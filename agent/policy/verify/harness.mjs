/* ============================================================
   agent/policy/verify/harness.mjs — a world to attack, and the
   vocabulary for saying what happened to the attack

   SESSION 23.5 is a VERIFICATION GATE, not a test suite, and the
   difference shows up in the vocabulary. A test asserts an expected
   result; an attack has an OUTCOME, and there are four of them, not
   two:

     failed_safely   the attempt was refused, and the refusal names a
                     reason rather than being an error
     succeeded       the boundary was crossed. This is a FINDING.
     partial         something less than the boundary was obtained —
                     a distinguishable error, a timing difference, a
                     piece of metadata. Reported as a finding at a
                     lower severity, never rounded down to
                     failed_safely.
     undecidable     the attempt could not be carried out here. NOT a
                     pass. `agent/browser/checks.mjs` takes the same
                     position and `agent/health/` takes it about
                     metrics: a check that did not run is reported as
                     not having run.

   NOTHING HERE FIXES ANYTHING. SESSION 23.5's instruction is
   explicit — "Do NOT use this session to fix identified defects" —
   and it is worth saying why rather than only obeying it: a session
   that both finds and fixes has no independent record of what the
   system was like before it was told. The findings go into
   docs/SECURITY-VERIFICATION-2026-09-08.md with severity, evidence,
   affected component and a recommended remediation, and the
   remediation is somebody else's to decide.

   EVERY WORLD IS TEMPORARY. State, records, decisions and traces are
   fresh directories per run, and the repository's own
   agent/records/, agent/implement/decisions/ and .control-room/state/
   are never read or written by anything here. `verifyTreeUnchanged()`
   hashes the tree around the whole run and the CLI reports it.
   ============================================================ */

import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

import { readConfig } from '../../../.control-room/config.mjs';
import { provisionOperator, setDisabled } from '../../../.control-room/identity.mjs';
import { serve } from '../../../.control-room/server.mjs';
import { dataProposalFixture, approvalRequestFixture } from '../../schemas/fixtures.mjs';

export const REPO_ROOT = join(import.meta.dirname, '..', '..', '..');
export const PASSWORD = 'a sufficiently long passphrase';

export const OUTCOMES = ['failed_safely', 'succeeded', 'partial', 'undecidable'];
export const SEVERITIES = ['critical', 'high', 'medium', 'low', 'informational'];

export const AREAS = [
  'public_private',
  'hidden_entry',
  'authorization',
  'agent_boundaries',
  'autonomy_policy',
  'approval_integrity',
  'observability',
];

const temps = [];
export const tempDir = (p = 'verify-') => { const d = mkdtempSync(join(tmpdir(), p)); temps.push(d); return d; };
export function cleanup() { for (const d of temps) { try { rmSync(d, { recursive: true, force: true }); } catch { /* nothing to do */ } } temps.length = 0; }

const deSim = (o) => JSON.parse(JSON.stringify(o), (k, v) => (k === 'simulated' ? false : v));

export function proposal(id = 'prop-verify-001', over = {}) {
  const p = deSim(dataProposalFixture());
  p.proposal_id = id;
  p.agent = 'data-proposal-agent';
  Object.assign(p, over);
  return p;
}

export function approvalRequestFor(proposalId, approvalId = `appr-${proposalId}`) {
  const a = deSim(approvalRequestFixture());
  a.approval_id = approvalId;
  a.proposal_ids = [proposalId];
  a.agent = 'data-proposal-agent';
  a.state = 'requested';
  a.decision = null;
  return a;
}

function writeRecords(dir, records) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1.jsonl'), `${records.map((r) => JSON.stringify(r)).join('\n')}\n`, 'utf8');
}

/**
 * A Control Room with operators at every role, a record store with
 * one ordinary proposal and one human_only proposal, and an empty
 * ledger — running on an ephemeral loopback port.
 */
export async function world() {
  const cfg = {
    ...readConfig({}),
    state_dir: tempDir('verify-state-'),
    records_dir: tempDir('verify-records-'),
    decision_dir: tempDir('verify-decisions-'),
    trace_dir: tempDir('verify-traces-'),
    port: 0,
  };
  const ordinary = proposal('prop-verify-ordinary');
  const redTier = proposal('prop-verify-human-only', { autonomy_class: 'human_only', risk: 'high' });
  const proposals = [ordinary, redTier];
  writeRecords(cfg.records_dir, [...proposals, ...proposals.map((p) => approvalRequestFor(p.proposal_id))]);

  const operators = {};
  for (const [name, roles] of Object.entries({
    admin: ['administrator'], approver: ['approver'], reviewer: ['reviewer'],
    viewer: ['viewer'], operator: ['operator'], disabled: ['administrator'],
  })) {
    operators[name] = provisionOperator(cfg, { subject: `${name}@example.org`, roles, password: PASSWORD, createdBy: 'verification-gate' });
  }
  /* An administrator whose account is switched off. The point of
     giving the disabled operator the HIGHEST role is that a check
     which passed because the account was merely a viewer would prove
     nothing about disablement.

     There is deliberately no role-less operator here:
     `.control-room/identity.mjs` refuses to provision one — "an
     operator with no role is an account that can do nothing" — which
     is a defensive property in its own right and is recorded as
     attack AZ-08 rather than worked around. */
  setDisabled(cfg, { subject: 'disabled@example.org', disabled: true, changedBy: 'verification-gate' });

  const server = serve({ cfg, quiet: true });
  await new Promise((ok, fail) => { server.once('listening', ok); server.once('error', fail); });
  const origin = `http://127.0.0.1:${server.address().port}`;

  return {
    cfg, origin, operators, proposals, ordinary, redTier,
    stop: () => new Promise((ok) => server.close(ok)),
    req: (method, path, { body = null, cookie = null, csrf = null, headers = {} } = {}) => fetch(`${origin}${path}`, {
      method,
      redirect: 'manual',
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(cookie ? { cookie } : {}),
        ...(csrf ? { 'x-control-room-csrf': csrf } : {}),
        ...headers,
      },
      ...(body ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
    }),
    async login(name) {
      const res = await fetch(`${origin}/auth/local`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject: `${name}@example.org`, password: PASSWORD }),
      });
      if (!res.ok) return { ok: false, status: res.status };
      const cookie = res.headers.getSetCookie()[0].split(';')[0];
      const session = await (await fetch(`${origin}/api/session`, { headers: { cookie } })).json();
      return { ok: true, cookie, csrf: session.csrf, actor: session.actor };
    },
    auditEntries() {
      const dir = join(cfg.state_dir, 'audit');
      let out = [];
      try {
        for (const f of readdirSync(dir)) {
          if (!f.endsWith('.jsonl')) continue;
          out = out.concat(readFileSync(join(dir, f), 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } }));
        }
      } catch { /* no trail is a finding for the caller to report, not an exception here */ }
      return out;
    },
  };
}

/* ---------------------------------------------------------- results */

export const attack = (id, area, attempts, severity_if_succeeds) => ({ id, area, attempts, severity_if_succeeds });

export const safely = (a, why, evidence = {}) => ({ ...a, outcome: 'failed_safely', why, evidence });
export const succeeded = (a, why, evidence = {}) => ({ ...a, outcome: 'succeeded', why, evidence });
export const partial = (a, why, evidence = {}, severity = 'low') => ({ ...a, outcome: 'partial', why, evidence, severity });
export const undecidable = (a, why, would_need, evidence = {}) => ({ ...a, outcome: 'undecidable', why, would_need, evidence });

/** A hash of the whole tree, minus the directories that change every
 *  run by design. The same function `agent/browser/runner.mjs` uses,
 *  and for the same claim. */
export function hashTree(root = REPO_ROOT) {
  const out = {};
  const walk = (dir, rel = '') => {
    for (const name of readdirSync(dir).sort()) {
      if (name === '.git' || name === 'node_modules') continue;
      const abs = join(dir, name);
      const r = rel ? `${rel}/${name}` : name;
      let st;
      try { st = statSync(abs); } catch { continue; }
      if (st.isDirectory()) {
        if (['runs', 'records', 'drafts', 'history', 'state'].includes(name)) continue;
        walk(abs, r);
      } else {
        out[r] = createHash('sha256').update(readFileSync(abs)).digest('hex');
      }
    }
  };
  walk(root);
  return out;
}
