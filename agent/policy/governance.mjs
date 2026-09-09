/* ============================================================
   agent/policy/governance.mjs — the governance decision that
   switches a category on, and the only place it can live

   SESSION 23 built the policy and left it switched off, and said why
   in its own words: filling `DEFAULT_POLICY.enabled_categories` is a
   GOVERNANCE CHANGE, and protocol §24 says the system must not make
   one of those to itself. It needs a governance proposal and a human
   decision.

   SESSION 26 is that decision arriving. The repository author's
   brief: "Enable automatic implementation only for explicitly
   approved low-risk categories… Do not allow substantive legal
   content to auto-merge."

   WHY THIS IS NOT AN EDIT TO `DEFAULT_POLICY`. Appending five strings
   to a frozen array in `categories.mjs` would have been three
   characters of work and it would have been the wrong shape twice
   over:

     · It is a fact with no author. A category switched on in a
       literal is switched on by whoever last edited the file, and
       `git blame` in this repository answers "Add files via upload"
       for anything older than SESSION 00 (docs/AUTONOMY-POLICY.md §4,
       AUDIT F-06). An authorization has to name a person, a date and
       an authority, the way `agent/implement/decisions/` does for a
       proposal.
     · It would make `DEFAULT_POLICY` a second home. What is switched
       on is one fact; it lives in the grant ledger, and the policy in
       force is DERIVED from it. `docs/DATA-GOVERNANCE.md`: derivation
       over storage, one home per fact.

   SO `DEFAULT_POLICY.enabled_categories` STAYS EMPTY, AND THAT IS NOT
   A FICTION. It is the base case — what the policy permits when no
   governance grant exists — and `agent/policy/selftest.mjs` tests 1b,
   29 and 32 still assert it, word for word and at their original
   strength. `policyInForce()` is the base plus the grants, and it is
   what an executing layer must ask.

   FOUR REFUSALS, ENFORCED AT WRITE TIME AND AGAIN AT READ TIME.
   A check that runs only when a file is written protects only the
   file that process wrote — `agent/implement/ledger.mjs` establishes
   that reasoning about self-approval and it holds here. Every grant
   is re-validated on every read, and one that would not be writable
   today is not honoured today.

     1 · A CATEGORY THAT IS NOT AUTOMATABLE IS NEVER GRANTABLE. The
         fourteen §19 categories — legal interpretation, legal
         conclusion, critique, substantive analytical and editorial
         change, schema, taxonomy, deletion, major rewrite,
         architecture, ambiguous legal status, unresolved
         contradiction, substantive data change, and the
         `uncategorised` residue — cannot be enabled by any grant.
         `categoryAllowed()` already reads `automatable` before it
         reads the enabled list; this refuses the grant one layer
         earlier so the list never contains one.

     2 · A PATH IS ALLOWLISTED, NOT DENYLISTED. A grant may name only
         a path at or under `AUTOMATIC_ELIGIBLE_PATHS`, which is two
         entries long and each one carries the reason it is there.
         `agent/implement/scope.mjs` states the principle: "An
         allowlist, not a denylist — a denylist protects what somebody
         remembered to name." `NEVER_AUTOMATIC_PATHS` is kept beside
         it as a second, independent refusal, and a test asserts no
         eligible path reaches any of them.

     3 · A FIELD IS ALLOWLISTED TOO, AND THIS IS THE ONE THAT KEEPS
         SUBSTANTIVE LEGAL CONTENT OUT. `data/sources.json` is on the
         eligible list because protocol §20's first three categories
         are about it — url_status, retrieval dates, a corrected URL.
         The same file also carries `tier`, `role`, `supports`,
         `verification_note`, `last_verified` and `requires_
         verification`, and every one of those changes what a claim is
         said to prove or moves a record from uncertainty toward
         certainty, which `docs/AUTONOMY-POLICY.md`'s prohibitions 2
         and 5 forbid outright. So a grant names FIELDS, and a
         proposal touching a field the grant does not name is refused
         however it categorised itself.

     4 · RISK, ENVIRONMENT AND EXPIRY. `low` is the ceiling and a
         grant may not raise it. `production` may not be an
         environment: nothing here deploys, GitHub Pages serves `main`
         on push, and a push to `main` is Class D. Every grant expires
         — an authorization with no end is an authorization nobody
         ever revisits — and an expired grant enables nothing.

   WHAT THIS DOES NOT DO. It is not authentication. Anybody who can
   write to the working tree can write a line in the grant ledger, in
   exactly the way `agent/implement/ledger.mjs` says about the
   decision ledger, and for the same reason: this is a static site
   with no server. What the ledger gives is one attributable home, a
   set of refusals a forged line still has to pass, and a git history
   that says who added it. The Control Room's server-side
   authorization is what covers anything arriving over HTTP.
   ============================================================ */

import { appendFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { DEFAULT_POLICY, ACTION_CATEGORIES, AUTOMATABLE_CATEGORIES, riskRank } from './categories.mjs';

export const POLICY_ROOT = dirname(fileURLToPath(import.meta.url));
export const GOVERNANCE_DIR = join(POLICY_ROOT, 'governance');
export const GRANT_LEDGER = 'grants.jsonl';
export const GOVERNANCE_LEDGER_VERSION = 1;

export const GRANT_ACTIONS = ['enable', 'revoke'];

/* ---------------------------------------------------------- the three allowlists */

/**
 * The only paths a governance grant may name, each with why it is
 * eligible. Two entries. Widening this list is a change to
 * `agent/policy/`, which is Class C work behind a human review — it
 * is deliberately not something a grant can do to itself.
 */
export const AUTOMATIC_ELIGIBLE_PATHS = Object.freeze([
  Object.freeze(['data/sources.json',
    'the source register. Protocol §20\'s first three low-risk categories are about this file and nothing else: url_status, retrieval bookkeeping, and a URL corrected after the document at it was retrieved and read. It is inside data/, so it is the legal record and every other guard still applies to it — the FIELD allowlist below is what separates its bookkeeping from what a source is said to support.']),
  Object.freeze(['docs/',
    'no reader\'s browser loads a file here, no dataset resolves against one, and design-qa.mjs does not read them. docs/AUTONOMY-POLICY.md Class A is "reports and proposals as new files under docs/", which is the narrowest write in the whole policy. It is inside the published surface, so a credential written here would be public — agent/implement/boundary.mjs R4 scans it on every run and that does not change.']),
]);

export const ELIGIBLE_PATH_PREFIXES = AUTOMATIC_ELIGIBLE_PATHS.map(([p]) => p);

/**
 * A second, independent refusal. Nothing on this list may be reached
 * by a grant, and `governanceSelfCheck()` asserts that no eligible
 * path above covers any entry here — so the two lists cannot be made
 * to disagree quietly.
 */
export const NEVER_AUTOMATIC_PATHS = Object.freeze([
  Object.freeze(['data/claims.json', 'every consequential statement this site makes about EU law is a record here. AI-SAFE-BOUNDARIES §0.']),
  Object.freeze(['data/taxonomy.json', 'the enum authority every other dataset resolves against. IDs are never renamed.']),
  Object.freeze(['index.html', 'the brief\'s prose and the inlined __CONTENT__ copy of it.']),
  Object.freeze(['i18n/', 'what the it/fr/es editions assert. Prohibition 11.']),
  Object.freeze(['js/', 'the derivations: evidence grade, the enforcement pipeline, the applicability ladder.']),
  Object.freeze(['app.js', 'the application shell.']),
  Object.freeze(['css/', 'the visual system, including the design tokens design-qa.mjs checks every colour literal against.']),
  Object.freeze(['style.css', 'the visual system, and the one stylesheet every page loads. Redesigning the website is Class D.']),
  Object.freeze(['tools/', 'the validators. Weakening one to obtain a pass is prohibition 16, and _refsweep.mjs re-dates 106 records on any run.']),
  Object.freeze(['agent/schemas/', 'the inter-agent contracts. An agent that can edit the gate has bypassed it.']),
  Object.freeze(['agent/policy/', 'this policy. Protocol §24: the system must not autonomously rewrite its own governance policy — including by granting itself the right to.']),
  Object.freeze(['agent/implement/decisions/', 'the approval ledger. An agent that can write its own approvals is not governed by them.']),
  Object.freeze(['.github/', 'the workflow definitions decide what runs with a write token.']),
  Object.freeze(['.control-room/', 'the private control plane.']),
  Object.freeze(['.git/', 'the repository\'s own history.']),
]);

/**
 * Fields a grant may name, per dataset, and — the half that matters —
 * the fields it may never name however it is written.
 *
 * The never list is not the complement of the may list. A field
 * nobody has classified is refused by ABSENCE (a grant names fields
 * explicitly), and the never list additionally makes the refusal
 * legible for the six fields where getting it wrong is the harm this
 * whole repository is arranged against.
 */
export const GRANTABLE_FIELDS = Object.freeze({
  'data/sources.json': Object.freeze([
    'url_status',        // reachable / redirected / gone — an artefact fact about the document
    'last_retrieved',    // when it was fetched
    'retrieved_at',
    'checksum',          // what it hashed to
    'content_hash',
    'recheck_interval',  // the governed re-check cadence
    'freshness_window',
    'url',               // only reachable through source_url_correction, which additionally requires retrieved_and_read
  ]),
});

export const NEVER_AUTOMATIC_FIELDS = Object.freeze([
  Object.freeze(['tier', 'the tier decides the evidence grade a claim derives at render time. Re-tiering a source to change a derived grade is prohibition 5.']),
  Object.freeze(['type', 'what kind of thing the source is. It feeds the same derivation.']),
  Object.freeze(['role', 'primary/official/secondary — what the citation can support. docs/SOURCE-POLICY.md.']),
  Object.freeze(['supports', 'what the evidence is said to establish. Changing it changes what a claim proves.']),
  Object.freeze(['last_verified', 'bulk-stamping last_verified on a record nobody read is prohibition 3.']),
  Object.freeze(['verification_note', 'the record of what was and was not established.']),
  Object.freeze(['requires_verification', 'clearing it is the move from uncertainty to certainty that prohibition 2 forbids.']),
  Object.freeze(['reference_gap', 'the admitted gap. Removing one is prohibition 2 and AI-SAFE-BOUNDARIES §0.2.']),
  Object.freeze(['gap_note', 'the note that says what is missing and why. Removing it removes the record of what was not known.']),
  Object.freeze(['title', 'what the document is. A wrong title is a wrong citation.']),
  Object.freeze(['publisher', 'who published it. A wrong publisher is a wrong citation, and a citation is what a claim stands on.']),
  Object.freeze(['celex', 'the CELEX identifier is the document\'s identity in the EU corpus.']),
]);

export const NEVER_AUTOMATIC_FIELD_NAMES = Object.freeze(NEVER_AUTOMATIC_FIELDS.map(([f]) => f));

/** The highest risk any grant may ever carry, whatever it says. */
export const GRANT_RISK_CEILING = 'low';

/** Environments a grant may name. `production` is not one, and the
 *  refusal is here rather than in a comment: nothing in this
 *  repository deploys, GitHub Pages publishes `main` on push, and a
 *  push to `main` is Class D under docs/AUTONOMY-POLICY.md. */
export const GRANTABLE_ENVIRONMENTS = Object.freeze(['local', 'ci']);

/* ---------------------------------------------------------- ids */

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

/** A grant's id is derived from what it grants, so two identical
 *  grants collide rather than accumulating, and an edited grant is a
 *  different grant. */
export function grantId(body) {
  const material = JSON.stringify([
    body.action, [...(body.categories ?? [])].sort(), [...(body.path_allowlist ?? [])].sort(),
    body.max_automatic_risk, [...(body.environments ?? [])].sort(),
    body.decided_by, body.decided_at, body.expires_at, body.revokes ?? null,
  ]);
  return `gov-${sha256(material).slice(0, 16)}`;
}

/* ---------------------------------------------------------- validation */

const refusal = (rule, why) => ({ rule, why });

/**
 * Every reason this grant may not be honoured. An empty array is the
 * only thing that counts as valid, and the function is called on
 * write AND on every read.
 *
 * @param {object} body a grant as it would be written
 * @param {{now?:string, agents?:Set<string>}} ctx
 * @returns {object[]} refusals, each naming the rule and the reason
 */
export function validateGrant(body, { now = new Date().toISOString(), agents = null } = {}) {
  const out = [];
  if (!body || typeof body !== 'object') return [refusal('shape', 'a grant must be an object.')];

  if (!GRANT_ACTIONS.includes(body.action)) {
    out.push(refusal('action', `action must be one of ${GRANT_ACTIONS.join(', ')}, not "${body.action}".`));
  }

  /* ---- who decided ---- */
  if (!body.decided_by || !String(body.decided_by).trim()) {
    out.push(refusal('attribution', 'a governance decision with no decided_by is a record of nobody having decided. Protocol §24 reserves this decision to a person.'));
  } else if (agents && agents.has(String(body.decided_by))) {
    out.push(refusal('attribution', `"${body.decided_by}" is an agent in this system. An agent enabling its own autonomy is the failure protocol §24 names, with a longer name. The same rule agent/implement/ledger.mjs applies to an approval.`));
  }
  if (!body.decided_at) out.push(refusal('attribution', 'a governance decision carries when it was taken.'));
  if (!body.authority || String(body.authority).trim().length < 12) {
    out.push(refusal('authority', 'a grant states the authority it rests on — who asked for it and in what words. "Because the policy allows it" is circular.'));
  }

  /* ---- expiry ---- */
  if (!body.expires_at) {
    out.push(refusal('expiry', 'a grant with no expiry is an authorization nobody ever revisits. Every grant ends, and is renewed by a person deciding again.'));
  } else if (String(body.expires_at) <= String(now)) {
    out.push(refusal('expiry', `the grant expired at ${body.expires_at} and it is ${now}. An expired grant enables nothing; it does not decay into a weaker grant.`));
  }

  if (body.action === 'revoke') {
    if (!body.revokes) out.push(refusal('revoke', 'a revocation names the grant_id it revokes.'));
    return out;
  }

  /* ---- categories ---- */
  const cats = body.categories ?? [];
  if (!Array.isArray(cats) || !cats.length) {
    out.push(refusal('categories', 'an enabling grant that enables no category is not a decision.'));
  }
  for (const c of cats) {
    if (!(c in ACTION_CATEGORIES)) {
      out.push(refusal('categories', `"${c}" is not an action category. agent/policy/categories.mjs is the vocabulary, and a word outside it is a mistake rather than a request.`));
      continue;
    }
    if (!ACTION_CATEGORIES[c].automatable) {
      out.push(refusal('categories', `"${c}" may never be automated by any policy: ${ACTION_CATEGORIES[c].human_review}. ${ACTION_CATEGORIES[c].costs}`));
    }
  }

  /* ---- paths ---- */
  const paths = body.path_allowlist ?? [];
  if (!Array.isArray(paths) || !paths.length) {
    out.push(refusal('paths', 'an enabling grant names the paths it covers. An enabled category with no path writes nothing, and saying so is clearer than an empty list that reads as "anywhere".'));
  }
  for (const p of paths) {
    const never = NEVER_AUTOMATIC_PATHS.find(([n]) => p === n || p.startsWith(n) || n.startsWith(p));
    if (never) {
      out.push(refusal('paths', `"${p}" reaches ${never[0]}, which no grant may name: ${never[1]}`));
      continue;
    }
    const eligible = ELIGIBLE_PATH_PREFIXES.find((e) => p === e || p.startsWith(e));
    if (!eligible) {
      out.push(refusal('paths', `"${p}" is not at or under an eligible path. The eligible set is ${ELIGIBLE_PATH_PREFIXES.join(', ')} — an allowlist, because a denylist protects only what somebody remembered to name.`));
    }
  }

  /* ---- fields ---- */
  const fields = body.field_allowlist ?? {};
  if (typeof fields !== 'object' || fields === null) {
    out.push(refusal('fields', 'field_allowlist must be an object keyed by dataset path.'));
  } else {
    for (const [dataset, names] of Object.entries(fields)) {
      const grantable = GRANTABLE_FIELDS[dataset];
      if (!grantable) {
        out.push(refusal('fields', `no field of "${dataset}" is grantable. GRANTABLE_FIELDS names the datasets whose fields have been classified, and an unclassified dataset is refused rather than assumed harmless.`));
        continue;
      }
      for (const n of names ?? []) {
        const never = NEVER_AUTOMATIC_FIELDS.find(([f]) => f === n);
        if (never) { out.push(refusal('fields', `"${dataset}.${n}" may never be written automatically: ${never[1]}`)); continue; }
        if (!grantable.includes(n)) {
          out.push(refusal('fields', `"${dataset}.${n}" is not on the grantable field list for that dataset: ${grantable.join(', ')}.`));
        }
      }
    }
  }
  /* A dataset in the path allowlist whose fields are classified must
     say which ones. Silence there would read as "all of them", and
     "all of them" includes tier. */
  for (const p of paths) {
    if (GRANTABLE_FIELDS[p] && !(fields[p] ?? []).length) {
      out.push(refusal('fields', `"${p}" is in the path allowlist and names no field. A dataset whose fields have been classified must say which ones the grant covers; an empty list would read as all of them, and all of them includes ${NEVER_AUTOMATIC_FIELDS[0][0]}.`));
    }
  }

  /* ---- risk, environment ---- */
  const risk = body.max_automatic_risk ?? null;
  if (!risk) out.push(refusal('risk', 'a grant states the risk ceiling it authorises.'));
  else if (riskRank(risk) > riskRank(GRANT_RISK_CEILING)) {
    out.push(refusal('risk', `"${risk}" is above the ceiling "${GRANT_RISK_CEILING}" that no grant may raise. Raising it is a change to agent/policy/, which no grant may name (see NEVER_AUTOMATIC_PATHS).`));
  }

  const envs = body.environments ?? [];
  if (!Array.isArray(envs) || !envs.length) out.push(refusal('environments', 'a grant names the environments it covers.'));
  for (const e of envs) {
    if (!GRANTABLE_ENVIRONMENTS.includes(e)) {
      out.push(refusal('environments', `"${e}" is not a grantable environment. The set is ${GRANTABLE_ENVIRONMENTS.join(', ')}: nothing in this repository deploys, GitHub Pages publishes main on push, and pushing to main is Class D.`));
    }
  }

  return out;
}

/**
 * The two lists cannot be made to disagree quietly. Run by the suite
 * and by the CLI; it takes no arguments because it is a statement
 * about the module rather than about a grant.
 */
export function governanceSelfCheck() {
  const problems = [];
  for (const [e] of AUTOMATIC_ELIGIBLE_PATHS) {
    for (const [n, why] of NEVER_AUTOMATIC_PATHS) {
      if (e === n || e.startsWith(n) || n.startsWith(e)) {
        problems.push(`eligible path "${e}" reaches never-automatic path "${n}": ${why}`);
      }
    }
  }
  for (const [dataset, fields] of Object.entries(GRANTABLE_FIELDS)) {
    for (const f of fields) {
      const never = NEVER_AUTOMATIC_FIELDS.find(([n]) => n === f);
      if (never) problems.push(`"${dataset}.${f}" is on both the grantable and the never-automatic field list: ${never[1]}`);
    }
  }
  for (const c of AUTOMATABLE_CATEGORIES) {
    if (!ACTION_CATEGORIES[c].automatable) problems.push(`"${c}" is in AUTOMATABLE_CATEGORIES and its own metadata says automatable:false`);
  }
  return { ok: problems.length === 0, problems };
}

/* ---------------------------------------------------------- reading */

export function grantLedgerPath(dir = GOVERNANCE_DIR) { return join(dir, GRANT_LEDGER); }

/**
 * Every governance line ever recorded, oldest first. A malformed line
 * is REPORTED, never skipped — a ledger that quietly drops what it
 * cannot parse is a ledger that can be made to forget.
 */
export function readGrantLedger({ dir = GOVERNANCE_DIR } = {}) {
  const file = grantLedgerPath(dir);
  if (!existsSync(file)) return { entries: [], malformed: [], path: file };
  const entries = [];
  const malformed = [];
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    try {
      const g = JSON.parse(line);
      if (!g.grant_id || !g.action || !g.decided_by || !g.decided_at) {
        malformed.push({ line: i + 1, why: 'a governance entry carries grant_id, action, decided_by and decided_at', raw: line.slice(0, 200) });
        return;
      }
      entries.push(g);
    } catch (e) {
      malformed.push({ line: i + 1, why: `not JSON: ${e.message}`, raw: line.slice(0, 200) });
    }
  });
  return { entries, malformed, path: file };
}

/**
 * The grants that are in force right now, and — separately — every
 * one that is not, with the reason.
 *
 * Three ways a grant fails to be in force, and they are different
 * facts: it was revoked, it expired, or it is invalid under rules
 * that are re-checked on every read.
 */
export function activeGrants({ dir = GOVERNANCE_DIR, now = new Date().toISOString(), agents = null } = {}) {
  const led = readGrantLedger({ dir });
  const revoked = new Set();
  for (const g of led.entries) if (g.action === 'revoke' && g.revokes) revoked.add(g.revokes);

  const active = [];
  const inactive = [];
  for (const g of led.entries) {
    if (g.action !== 'enable') continue;
    if (revoked.has(g.grant_id)) { inactive.push({ grant: g, state: 'revoked', why: 'a later line in this ledger revokes it.' }); continue; }
    const refusals = validateGrant(g, { now, agents });
    if (refusals.length) {
      const expired = refusals.some((r) => r.rule === 'expiry');
      inactive.push({ grant: g, state: expired ? 'expired' : 'invalid', why: refusals.map((r) => `${r.rule}: ${r.why}`).join(' · '), refusals });
      continue;
    }
    active.push(g);
  }
  return { active, inactive, malformed: led.malformed, path: led.path, now };
}

/**
 * THE POLICY IN FORCE. The base policy plus every active grant.
 *
 * An executing layer asks this and never `DEFAULT_POLICY` — the base
 * is what the policy permits with no grant, and asking it would
 * report every act as refused for a reason that stopped being true
 * when somebody decided otherwise.
 *
 * Nothing here widens anything the base policy already fixes:
 * `max_automatic_risk` is the LOWER of the base ceiling and every
 * grant's, and `automatic_environments` is the intersection. A grant
 * can only ever narrow.
 */
export function policyInForce({ dir = GOVERNANCE_DIR, now = new Date().toISOString(), agents = null, base = DEFAULT_POLICY } = {}) {
  const { active, inactive, malformed, path } = activeGrants({ dir, now, agents });

  const categories = new Set();
  const paths = new Set();
  const fields = {};
  let risk = base.max_automatic_risk;
  let envs = [...(base.automatic_environments ?? [])];

  for (const g of active) {
    for (const c of g.categories ?? []) categories.add(c);
    for (const p of g.path_allowlist ?? []) paths.add(p);
    for (const [dataset, names] of Object.entries(g.field_allowlist ?? {})) {
      fields[dataset] = [...new Set([...(fields[dataset] ?? []), ...names])];
    }
    if (riskRank(g.max_automatic_risk) < riskRank(risk)) risk = g.max_automatic_risk;
    envs = envs.filter((e) => (g.environments ?? []).includes(e));
  }

  const policy = Object.freeze({
    ...base,
    policy_id: active.length
      ? `${base.policy_id}+grants/${active.map((g) => g.grant_id).sort().join('+')}`
      : base.policy_id,
    enabled_categories: Object.freeze([...categories].sort()),
    automatic_path_allowlist: Object.freeze([...paths].sort()),
    automatic_field_allowlist: Object.freeze(fields),
    max_automatic_risk: risk,
    automatic_environments: Object.freeze(active.length ? envs : [...(base.automatic_environments ?? [])]),
    granted_by: Object.freeze(active.map((g) => ({ grant_id: g.grant_id, decided_by: g.decided_by, decided_at: g.decided_at, expires_at: g.expires_at }))),
    why_empty: active.length
      ? `${active.length} governance grant(s) are in force. What is switched on is derived from agent/policy/governance/grants.jsonl and has one home there; DEFAULT_POLICY remains the base case — what this policy permits when nobody has decided anything.`
      : base.why_empty,
  });

  return { policy, active, inactive, malformed, ledger_path: path, now };
}

/* ---------------------------------------------------------- the field gate */

/**
 * Does this proposal write only fields the policy in force names?
 *
 * This is the refusal that keeps substantive legal content out of the
 * automatic route even when the derived category says "source
 * metadata". `categoriseProposal()` reads a proposal's own fields and
 * cannot tell that an edit described as bookkeeping in fact re-tiers a
 * source (`docs/AUTONOMY-AUTHORIZATION-POLICY.md` §10.4 says so about
 * itself). Reading the operation TARGETS closes that specific hole:
 * a target naming `tier` is refused whatever the proposal calls
 * itself.
 *
 * It is deliberately not a thirteenth mandatory condition. The twelve
 * are protocol §18's list and extending it quietly would put a
 * thirteenth condition in a place readers of §18 do not look. This is
 * a gate on the grant, it lives with the grant, and the autonomy
 * pipeline runs it by name.
 *
 * @returns {{ok:boolean, checked:object[], refusals:object[], why:string}}
 */
export function fieldsPermitted(proposal, policy) {
  const allow = policy?.automatic_field_allowlist ?? {};
  const ops = proposal?.proposed_change?.operations ?? [];
  const dataset = proposal?.dataset ?? null;
  const checked = [];
  const refusals = [];

  for (const op of ops) {
    const target = String(op.target ?? '');
    /* An operation target is documented as a path, an id, or a dotted
       field, and all three occur. The field is the last dotted
       segment that is not a path component or an array index. */
    const field = fieldOf(target);
    const ds = datasetOf(target) ?? dataset;
    checked.push({ target, dataset: ds, field });

    const never = NEVER_AUTOMATIC_FIELDS.find(([f]) => f === field);
    if (never) {
      refusals.push({ target, field, why: `"${field}" may never be written automatically: ${never[1]}` });
      continue;
    }
    if (!ds) continue;                       // not a dataset write; scope_permitted governs it
    const names = allow[ds];
    if (!names) {
      refusals.push({ target, field, why: `the policy in force names no automatic field for "${ds}". A dataset with no field allowlist is refused rather than assumed to be entirely bookkeeping.` });
      continue;
    }
    if (!field) {
      refusals.push({ target, field: null, why: `operation target "${target}" names no field of ${ds}, so what it would write cannot be checked against the allowlist. An unreadable target is refused, not assumed narrow.` });
      continue;
    }
    if (!names.includes(field)) {
      refusals.push({ target, field, why: `"${ds}.${field}" is not on the policy's automatic field allowlist (${names.join(', ')}).` });
    }
  }

  return {
    ok: refusals.length === 0,
    checked,
    refusals,
    why: refusals.length === 0
      ? `${checked.length} operation target(s), every field one of them names is on the automatic allowlist, and none is on the never-automatic list.`
      : `${refusals.length} of ${checked.length} operation target(s) name a field no grant covers: ${refusals.map((r) => r.field ?? r.target).join(', ')}.`,
  };
}

/** The dataset a target names, where it names one. */
export function datasetOf(target) {
  const m = String(target ?? '').match(/^([A-Za-z0-9_./-]+\.json)/);
  return m ? m[1].replace(/^\.?\//, '') : null;
}

/**
 * The field a target names, or `null` where it names none.
 *
 * `null` is not "no field is written" — it is "this target does not
 * say which field", and `fieldsPermitted` refuses on it rather than
 * reading it as narrow. That is the project's own §0.3 rule: nothing
 * travels from not-stated to fine.
 */
export function fieldOf(target) {
  const t = String(target ?? '').trim();
  if (!t) return null;
  const ds = datasetOf(t);
  /* A bare dataset path names no field. Splitting "data/sources.json"
     on its dots would answer "json", which is the shape of mistake
     this whole module exists to refuse. */
  const rest = ds ? t.slice(t.indexOf(ds) + ds.length) : t;
  if (ds && !rest.trim()) return null;
  const segments = rest.split(/[.#[\]/]/).filter(Boolean).filter((s) => !/^\d+$/.test(s));
  const last = segments[segments.length - 1] ?? null;
  if (!last) return null;
  if (/^(json|html|mjs|js|css|md)$/i.test(last)) return null;
  return last;
}

/* ---------------------------------------------------------- writing */

export class GrantRefused extends Error {
  constructor(message, refusals = []) { super(message); this.refusals = refusals; }
}

/**
 * Record a governance decision. The ONLY code path that writes one.
 *
 * Note what it does not take: no `force`, no `skip_checks`, no
 * `assume`. Every refusal `validateGrant` finds is thrown, and the
 * same refusals run again on every read, so a line written around
 * this function is not honoured either.
 */
export function recordGrant(body, { dir = GOVERNANCE_DIR, agents = null, now = () => new Date().toISOString() } = {}) {
  const at = now();
  const entry = {
    ledger_version: GOVERNANCE_LEDGER_VERSION,
    action: body.action ?? 'enable',
    categories: body.categories ?? [],
    path_allowlist: body.path_allowlist ?? [],
    field_allowlist: body.field_allowlist ?? {},
    max_automatic_risk: body.max_automatic_risk ?? GRANT_RISK_CEILING,
    environments: body.environments ?? [...GRANTABLE_ENVIRONMENTS],
    decided_by: body.decided_by ?? null,
    decided_at: body.decided_at ?? at,
    expires_at: body.expires_at ?? null,
    authority: body.authority ?? null,
    rationale: body.rationale ?? null,
    revokes: body.revokes ?? null,
    session: body.session ?? null,
    recorded_at: at,
  };
  entry.grant_id = grantId(entry);

  const refusals = validateGrant(entry, { now: at, agents });
  if (refusals.length) {
    throw new GrantRefused(
      `the governance grant was refused on ${refusals.length} rule(s): ${refusals.map((r) => `${r.rule} — ${r.why}`).join(' · ')}`,
      refusals,
    );
  }

  mkdirSync(dir, { recursive: true });
  appendFileSync(grantLedgerPath(dir), `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
}

/** Everything a reader needs to see what is switched on and why. */
export function describeGovernance({ dir = GOVERNANCE_DIR, now = new Date().toISOString(), agents = null } = {}) {
  const inForce = policyInForce({ dir, now, agents });
  const self = governanceSelfCheck();
  return {
    now,
    ledger_path: inForce.ledger_path,
    self_check: self,
    policy: inForce.policy,
    active: inForce.active,
    inactive: inForce.inactive,
    malformed: inForce.malformed,
    base_policy_id: DEFAULT_POLICY.policy_id,
    base_enabled_categories: [...DEFAULT_POLICY.enabled_categories],
    eligible_paths: AUTOMATIC_ELIGIBLE_PATHS.map(([p, why]) => ({ path: p, why })),
    never_paths: NEVER_AUTOMATIC_PATHS.map(([p, why]) => ({ path: p, why })),
    never_fields: NEVER_AUTOMATIC_FIELDS.map(([f, why]) => ({ field: f, why })),
    automatable_categories: [...AUTOMATABLE_CATEGORIES],
    note: 'DEFAULT_POLICY.enabled_categories is empty and stays empty: it is the base case, not a second home. What is switched on lives in the grant ledger and the policy in force is derived from it.',
  };
}
