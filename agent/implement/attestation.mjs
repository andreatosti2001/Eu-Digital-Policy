/* ============================================================
   agent/implement/attestation.mjs — what makes a decision line
   tamper-evident and attributable, and what it still cannot prove

   WHY THIS FILE EXISTS. `ledger.mjs` gave a decision a single git-tracked
   home, a content binding to the proposal, and a refusal of four forgeries
   that need no write access. Its own header names the gap that remained:
   "anybody who can write to the working tree can write a line in this
   file". A line reading `decided_by: "<the author>"` was indistinguishable
   from the author having decided. This module strengthens that mechanism —
   it does not replace it, and it adds no second home for a decision.

   THREE ADDITIONS, EACH OF WHICH A READER CAN CHECK OFFLINE WITH NODE'S OWN
   CRYPTO MODULE AND NO DEPENDENCY:

     · A HASH CHAIN. Each entry carries `seq`, `prev_entry_sha256` and
       `entry_sha256`. Editing, deleting or re-ordering an entry in the
       middle of the ledger breaks every hash after it. (Truncating the
       TAIL is not visible to a chain; the release gate catches that by
       requiring the ledger at the base commit to be a byte prefix of the
       ledger at the head — agent/release/gate.mjs.)

     · A SIGNATURE. An ed25519 signature over `entry_sha256`, made with a
       private key the reviewer holds and this repository never sees, and
       checked against a public key registered in `reviewers.json`. This is
       the difference between "a name is written here" and "the holder of a
       registered key produced this line". An agent that can write to the
       working tree cannot produce it.

     · A PROVENANCE LABEL. An entry is `human` or `simulated`. A simulated
       entry must say so in its `decided_by` ("SIMULATED: …"), is read as
       void by `deriveApproval()`, and is refused outright by the release
       gate. A test fixture therefore cannot be mistaken for an approval.

   WHAT THIS DOES NOT PROVE, SAID HERE AND NOT ONLY IN A DOCUMENT.
     · Who holds the private key. The registry maps a name to a PUBLIC key;
       nothing here shows the named person is the one who generated it.
     · That the registry is honest. `reviewers.json` is in the repository,
       so whoever can write the ledger can also add a key to it. The only
       control that closes this is OUTSIDE the tree: the registry's
       fingerprint pinned as a repository variable the release gate reads
       (RELEASE_REVIEWER_REGISTRY_SHA256), together with branch protection
       on the registry file. `registryFingerprint()` is the value to pin.
       docs/DEPLOYMENT.md §3a lists it with the other external settings.
     · That the person read what they signed. A signature is a declaration.
       docs/CONTROL-ROOM.md §11 and the roadmap's structured attestation
       are the same limit.
   ============================================================ */

import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign as nodeSign, verify as nodeVerify } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJson } from '../schemas/gateway.mjs';

export const DECISIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'decisions');
export const LEDGER_FILE = 'decisions.jsonl';
export const REVIEWERS_FILE = 'reviewers.json';
export const GENESIS = '0'.repeat(64);
export const LEDGER_SCHEMA_VERSION = 2;
export const PROVENANCES = ['human', 'simulated'];
export const OUTCOMES = ['granted', 'denied'];
export const SIGNATURE_ALG = 'ed25519';
export const SIMULATED_PREFIX = 'SIMULATED:';

/** How far ahead of the verifier's clock an entry may be dated. A decision
 *  dated in the future is a decision nobody has made yet. */
export const CLOCK_SKEW_MS = 10 * 60 * 1000;

const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/* ------------------------------------------------------------ hashing */

/** What the entry hash covers: everything except the hash itself and the
 *  signature, which signs the hash. */
export function entryBody(entry) {
  const { entry_sha256, signature, ...body } = entry ?? {};
  return body;
}
export const computeEntryHash = (entry) => sha256(canonicalJson(entryBody(entry)));

/* ------------------------------------------------------------ keys */

export function publicKeyFingerprint(publicKeyPem) {
  const der = createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' });
  return createHash('sha256').update(der).digest('hex');
}

/** Generate a reviewer key pair. The private half is returned to the CALLER
 *  to put somewhere outside the repository; nothing in this module writes it. */
export function generateReviewerKey() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  return {
    publicKeyPem,
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    fingerprint: publicKeyFingerprint(publicKeyPem),
  };
}

export function signEntryHash(entryHash, privateKeyPem) {
  const key = createPrivateKey(privateKeyPem);
  return {
    alg: SIGNATURE_ALG,
    key_fingerprint: publicKeyFingerprint(createPublicKey(key).export({ type: 'spki', format: 'pem' })),
    value: nodeSign(null, Buffer.from(entryHash, 'hex'), key).toString('base64'),
  };
}

export function verifyEntrySignature(entryHash, signature, publicKeyPem) {
  try {
    if (signature?.alg !== SIGNATURE_ALG) return false;
    return nodeVerify(null, Buffer.from(entryHash, 'hex'), createPublicKey(publicKeyPem), Buffer.from(String(signature.value), 'base64'));
  } catch { return false; }
}

/* ------------------------------------------------------------ registry */

export function reviewersPath(dir = DECISIONS_DIR) { return join(dir, REVIEWERS_FILE); }

/** The registered reviewers, from the text of reviewers.json. Separate from
 *  the file read so the release gate can read the registry AT A COMMIT rather
 *  than from whatever the working tree holds. A text that does not parse is
 *  REPORTED, never read as an empty registry. */
export function parseReviewers(raw, path = REVIEWERS_FILE) {
  if (raw == null) return { reviewers: [], present: false, problems: [], path, raw: null };
  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) {
    return { reviewers: [], present: true, problems: [`reviewers.json does not parse: ${e.message}`], path, raw };
  }
  const problems = [];
  const list = Array.isArray(parsed?.reviewers) ? parsed.reviewers : [];
  if (!Array.isArray(parsed?.reviewers)) problems.push('reviewers.json has no "reviewers" array');
  const seen = new Set();
  for (const r of list) {
    for (const f of ['reviewer_id', 'name', 'role', 'public_key_pem', 'status', 'added_at']) {
      if (!r?.[f] || typeof r[f] !== 'string') problems.push(`reviewer ${r?.reviewer_id ?? '(unnamed)'} lacks a string "${f}"`);
    }
    if (r?.status && !['active', 'revoked'].includes(r.status)) problems.push(`reviewer ${r.reviewer_id}: status must be "active" or "revoked"`);
    if (seen.has(r?.reviewer_id)) problems.push(`reviewer_id ${r.reviewer_id} appears twice`);
    seen.add(r?.reviewer_id);
    try { r.fingerprint = publicKeyFingerprint(r.public_key_pem); } catch { problems.push(`reviewer ${r?.reviewer_id}: public_key_pem is not a public key`); }
  }
  return { reviewers: list, present: true, problems, path, raw };
}

/** A missing file is "none registered", which makes every signed entry
 *  unverifiable — a state, not an error. */
export function readReviewers({ dir = DECISIONS_DIR } = {}) {
  const path = reviewersPath(dir);
  return parseReviewers(existsSync(path) ? readFileSync(path, 'utf8') : null, path);
}

/** The value to pin outside the repository (see the header). Over the exact
 *  bytes of reviewers.json, so ANY edit — a new key, a status change, a
 *  re-ordering — changes it. */
export const registryFingerprintOf = (raw) => sha256(raw ?? '');
export function registryFingerprint({ dir = DECISIONS_DIR } = {}) {
  return registryFingerprintOf(readReviewers({ dir }).raw);
}

/* ------------------------------------------------------------ the check */

/**
 * Verify a ledger as a whole. Pure over its inputs apart from reading the two
 * files, and it never throws on bad content: a ledger that cannot be read is
 * a result, not an exception.
 *
 * @param {{dir?:string, text?:string, reviewers?:object, requireSignatures?:boolean,
 *          allowSimulated?:boolean, agentNames?:string[], now?:Date}} opts
 */
export function verifyLedger({ dir = DECISIONS_DIR, text = null, reviewers = null, requireSignatures = false, allowSimulated = false, agentNames = [], now = new Date() } = {}) {
  const problems = [];
  const add = (code, line, why) => problems.push({ code, line, why });
  const file = join(dir, LEDGER_FILE);
  const body = text ?? (existsSync(file) ? readFileSync(file, 'utf8') : '');
  const reg = reviewers ?? readReviewers({ dir });
  for (const p of reg.problems ?? []) add('reviewer_registry', null, p);

  const entries = [];
  let prev = GENESIS;
  let seq = 0;
  const lines = body.split('\n');
  lines.forEach((raw, i) => {
    if (!raw.trim()) return;
    const line = i + 1;
    let e;
    try { e = JSON.parse(raw); } catch (err) { add('malformed_line', line, `not JSON: ${err.message}`); return; }
    seq += 1;
    const info = { line, entry: e, signed: false, signature_ok: false, reviewer: null };
    entries.push(info);

    for (const f of ['approval_id', 'proposal_id', 'outcome', 'decided_by', 'decided_at', 'proposal_sha256']) {
      if (!e[f] || typeof e[f] !== 'string') add('missing_field', line, `"${f}" is absent or not a string`);
    }
    if (e.outcome && !OUTCOMES.includes(e.outcome)) add('bad_outcome', line, `outcome "${e.outcome}" is neither granted nor denied`);
    if (e.decided_at) {
      const t = Date.parse(e.decided_at);
      if (!ISO.test(e.decided_at) || Number.isNaN(t)) add('bad_timestamp', line, `decided_at "${e.decided_at}" is not an ISO-8601 timestamp`);
      else if (t > now.getTime() + CLOCK_SKEW_MS) add('future_timestamp', line, `decided_at ${e.decided_at} is in the future`);
    }

    if (e.ledger_version !== LEDGER_SCHEMA_VERSION) {
      add('legacy_unchained', line, `ledger_version ${e.ledger_version ?? 'absent'}: entry has no hash chain and no signature slot, so nothing makes it tamper-evident`);
    } else {
      if (e.seq !== seq) add('seq_gap', line, `seq is ${e.seq}, expected ${seq}: an entry was removed, inserted or re-ordered`);
      if (e.prev_entry_sha256 !== prev) add('chain_break', line, 'prev_entry_sha256 does not match the previous entry: the ledger was edited before this line');
      const recomputed = computeEntryHash(e);
      if (e.entry_sha256 !== recomputed) add('hash_mismatch', line, 'entry_sha256 does not match the entry as it stands: the line was edited after it was written');
      prev = e.entry_sha256 ?? prev;

      if (!PROVENANCES.includes(e.provenance)) add('bad_provenance', line, `provenance must be one of ${PROVENANCES.join(', ')}`);
      const simulated = e.provenance === 'simulated';
      const labelled = String(e.decided_by ?? '').startsWith(SIMULATED_PREFIX);
      if (simulated && !labelled) add('simulated_unlabelled', line, `a simulated entry's decided_by must begin "${SIMULATED_PREFIX}"`);
      if (!simulated && labelled) add('simulated_mislabelled', line, `decided_by begins "${SIMULATED_PREFIX}" but provenance is not "simulated"`);
      if (simulated && !allowSimulated) add('simulated_entry', line, 'a simulated entry is a test fixture; it is refused wherever an authentic approval is required');
      if (simulated && e.signature) add('simulated_signed', line, 'a simulated entry must not carry a signature: a signature is an authenticity claim');

      /* the snapshot the entry carries must still hash to what it was bound to */
      if (e.proposal_snapshot) {
        const { trace_ref, created_at, ...substance } = e.proposal_snapshot;
        if (sha256(canonicalJson(substance)) !== e.proposal_sha256) add('snapshot_mismatch', line, 'proposal_snapshot does not hash to proposal_sha256');
      }
      if (agentNames.includes(e.decided_by) || (e.proposal_agent && e.proposal_agent === e.decided_by)) {
        add('agent_decider', line, `decided_by "${e.decided_by}" is an agent in this system`);
      }

      /* signature */
      info.signed = Boolean(e.signature);
      if (!e.signature) {
        if (requireSignatures && !simulated) add('unsigned', line, 'no signature: nothing shows a registered reviewer produced this line');
      } else {
        const r = (reg.reviewers ?? []).find((x) => x.fingerprint === e.signature.key_fingerprint);
        if (!r) add('unknown_reviewer', line, `signed by key ${String(e.signature.key_fingerprint).slice(0, 12)}…, which no registered reviewer holds`);
        else {
          info.reviewer = r;
          info.signature_ok = verifyEntrySignature(e.entry_sha256, e.signature, r.public_key_pem);
          if (!info.signature_ok) add('signature_invalid', line, 'the signature does not verify against the registered public key');
          if (r.status !== 'active') add('reviewer_revoked', line, `reviewer ${r.reviewer_id} is ${r.status}`);
          if (e.decided_by !== r.name) add('reviewer_name_mismatch', line, `decided_by "${e.decided_by}" is not the registered name "${r.name}" of the key that signed`);
          if (e.decided_role !== r.role) add('reviewer_role_mismatch', line, `decided_role "${e.decided_role ?? 'absent'}" is not the registered role "${r.role}"`);
        }
      }
    }
  });

  return {
    ok: problems.length === 0,
    problems,
    entries,
    count: entries.length,
    chain_head: prev,
    signed: entries.filter((x) => x.signed).length,
    simulated: entries.filter((x) => x.entry.provenance === 'simulated').length,
    registry_fingerprint: reg.raw == null ? null : sha256(reg.raw),
    path: file,
  };
}

/** The one-line state of a ledger, for a report: never "fine". */
export function describeLedger(v) {
  if (v.count === 0 && v.ok) return 'ledger is empty or absent: no human decision has been recorded';
  return v.ok
    ? `${v.count} entr${v.count === 1 ? 'y' : 'ies'}, chain intact, ${v.signed} signed by a registered reviewer, ${v.simulated} simulated`
    : `${v.problems.length} problem(s): ${[...new Set(v.problems.map((p) => p.code))].join(', ')}`;
}
