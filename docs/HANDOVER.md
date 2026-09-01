# HANDOVER

**Last updated:** Reconciliation session · 1 September 2026
**Branch:** `main` — every prior parallel line merged here in one session, at the user's
explicit instruction, after four sessions had diverged without ever seeing each other.
**Base:** `4bd1f0d` (the last commit previously on `main`, end of SESSION 02).

---

## Read this first — five parallel lines, reconciled into one

Every session after SESSION 02 forked from the **same stale point** on `main` (`4bd1f0d`),
because no session's branch was ever merged back before the next one started. Five lines of
work accumulated in parallel, none aware the others existed:

| Line | Branch | What it was |
|---|---|---|
| Governance layer | `…repo-architectural-audit-v45psd` @ `cfe5d54` | An independent architectural audit (17 findings) and five operating-policy documents |
| Skill library | `…shared-skill-library-djn1oo` @ `feac219` | Sixteen agent skills and `docs/SKILL-MAP.md` |
| Contracts + Scout A | `…inter-agent-contract-schemas-o6dfc7` @ `2995328` | The fourteen inter-agent contracts (`agent/schemas/`) and the **Source Scout** — already internally reconciled against a second, competing Scout built in the same session window (see below) |
| Scout A's competitor | `…scout-agent-implementation-wsa31u` @ `7fcf0c5` | A claim-scoped citation resolver, retired in favour of the Source Scout before this reconciliation began |
| Scout B | `…source-scout-scheduled-workflow-5s645a` @ `ff84fe3` | A **third**, independently built Scout — forked *before* the contracts existed, so it bypassed them entirely — plus a scheduling and security design worth keeping even though its code was retired |

All four remaining lines (the fifth, Scout A's competitor, was already folded into Scout A's
branch before this session) are now merged into `main` as a sequence of real merge commits,
each keeping both parents' history:

```
fe404e8  Merge the architectural audit branch (cfe5d54)
399a51d  Merge the shared skill library branch (feac219)
498fba5  Merge the contracts and reconciled Source Scout branch (9d5308e)
ef92201  Merge and reconcile the third Scout branch (ff84fe3): retire its implementation
```

**Nothing here should need to happen again.** Going forward, a new session should fork from
`main` *after* the previous session's work has actually landed there — not from a stale
point — or this exact failure repeats. See "Do not" at the end of this file.

## What was decided, and why

### Two `docs/AGENT-CONTRACTS.md` — a rename, not a collision

The audit branch wrote a prose document at `docs/AGENT-CONTRACTS.md`: ten agent roles, what
each owns, what each may never do. The contracts branch later wrote a completely different,
code-backed document at the same path: the fourteen machine-readable JS contract schemas and
the gate that enforces them. These are not the same thing at different levels of finish —
one is policy prose, the other is an enforced validator — and neither should destroy the
other. The audit branch's document was renamed to **`docs/AGENT-ROLES.md`** before the
contracts branch was merged, with every cross-reference in the repository updated in the same
commit. Both documents now exist, distinct, at their intended names.

### Two Scouts inside one branch, already reconciled before this session

The contracts branch (`2995328`) and its immediate competitor (`7fcf0c5`) were built in the
same session window and both produced a complete Scout. That reconciliation happened in an
earlier session and is preserved verbatim in this file's own git history (`git log -p --
docs/HANDOVER.md` around commit `9d5308e`), not restated here. Short version: the **Source
Scout** was kept — it discovers documents from an authority hierarchy rather than only
re-resolving citations the corpus already held, and it is the stronger implementation (30
tests vs 12). A `DataGap` contract disagreement between the two (`retrieval_blocked` paired
with a new `retrieval_failed` absence kind, vs. the existing `null_not_researched`) was
decided in the adopted branch's favour on one-home-per-fact grounds: `gap_kind:
retrieval_blocked` already records that retrieval was attempted and refused, so a second
field recording the same fact would be a second home for it.

### A third Scout, found in this session, retired for the same reason

`ff84fe3` (SESSION 06) forked from `main` **before `agent/schemas/` existed**, so it built a
third, independent Scout with no contract awareness at all: it writes plain JSON reports to
`agent/scout/reports/`, traced through the observability layer but never through
`agent/schemas/gateway.mjs`. Its own suite passed cleanly on its own branch (41/41, verified
before merging), and it came with real, careful engineering — a GitHub Actions workflow that
splits `discover` (read-only, no write token) from `propose` (write token, no untrusted
input), and `guard.mjs`, which fails the run if anything outside the report directory
changed.

It was retired anyway, on the same principle as the prior reconciliation: this repository's
governance is now built around `agent/schemas/` — "no agent may bypass these contracts" is
that module, not a policy sentence — and a Scout that cannot be reconciled with it undermines
the reason the other two were reconciled in the first place. Running three Scouts, one of
which writes outside the contract system entirely, is not a stable end state.

**What was not thrown away:** `docs/AGENT-RUNBOOK.md` is kept, rewritten at the top to say
plainly it describes retired code, because the scheduling and security design in it — the
job-permission split, the write-boundary guard, the weekly cadence — is sound and independent
of which Scout implementation runs inside it. Porting that design onto the contract-backed
Scout (a different write boundary, `agent/records/` not `agent/scout/reports/`; different
candidate records, `SourceCandidate` not report JSON; a PR step that does not exist yet) is
real work, recorded below as a next-session objective, not attempted inside this
reconciliation.

## Current state of the repository

```
agent/
  observability/   the trace layer — spans, events, the JSONL store, the viewer
  schemas/         the fourteen inter-agent contracts, the validator, the gateway
  scout/           the Source Scout — read-only, contract-backed, 30 tests
.agents/skills/     sixteen skills — see docs/SKILL-MAP.md for scope and role
docs/
  AGENT-CONTRACTS.md   the fourteen contracts (code-backed) — reference for agent/schemas/
  AGENT-ROLES.md       ten agent roles (prose) — the audit branch's contribution
  AGENT-RUNBOOK.md     a retired Scout's scheduling design, kept for reuse
  AI-SAFE-BOUNDARIES.md   green/amber/red tiers, the eight absolute prohibitions
  AUDIT-2026-09-01.md     17 independent findings, F-01 self-retracted
  AUTONOMY-POLICY.md      autonomy classes A/B/C/D, refining the tiers above
  DATA-GOVERNANCE.md      one home per fact, derivation over storage
  SOURCE-POLICY.md        what may be cited, what a citation can support
  VERIFICATION-POLICY.md  what each validator proves and does not
  SOURCE-SCOUT.md         the Source Scout's own reference document
  SKILL-MAP.md            the sixteen skills, scope and intended role
  CURRENT-ARCHITECTURE.md, OBSERVABILITY.md, PROJECT-CONTEXT.md   unchanged
```

No file the website ships (`index.html` and its siblings, `js/`, `css/`, `data/`, `i18n/`,
`fonts/`) was touched by any of the four merges. Confirmed with `git status --porcelain`
after each one and again at the end.

## Tests, run at the end of this reconciliation, from `main`'s HEAD

| Command | Result |
|---|---|
| `node --test agent/scout/selftest.mjs` | 30 pass · 0 fail |
| `node --test agent/schemas/selftest.mjs` | 67 pass · 0 fail |
| `node --test agent/observability/selftest.mjs` | 13 pass · 0 fail |
| `node agent/schemas/cli.mjs check` | 14/14 satisfiable, exit 0 |
| `node agent/observability/cli.mjs validate` | 0 invalid, exit 0 |
| `node agent/scout/cli.mjs --live` | exit 0 — 0 candidates, 5 gaps (egress still blocked) |
| `node tools/validate.mjs` | 0 errors |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as the §12 baseline |
| `node tools/freshness.mjs` | reports only, exit 0 |

**The four validators' output is byte-identical to the baseline recorded on `main`'s `4bd1f0d`
before any branch was merged**, compared with `diff`, for every one of the four merges in
sequence and again at the end. No new warning at any point.

Also checked: `git status --porcelain` clean after the final merge; no dangling reference to
any retired file (`agent/scout/{http,feed,guard,relevance,report}.mjs`,
`agent/scout/registry.json`, `agent/scout/reports/`, `.github/workflows/source-scout.yml`)
anywhere in the tree except `docs/AGENT-RUNBOOK.md`'s own explanation of what was removed and
why.

## Network reality — unchanged

Outbound access is still refused by this environment's egress policy — HTTP 403 with
`x-deny-reason: host_not_allowed` for every host tried, EUR-Lex included. The Source Scout's
live run therefore still produces 0 candidates and 5 `DataGap` records, each naming the real
proxy response and stating plainly that this is the environment's policy and not a statement
about the document. Nothing was invented to compensate. See `docs/SOURCE-SCOUT.md` for detail
and `docs/AI-SAFE-BOUNDARIES.md` for why that discipline is non-negotiable here.

## Known limitations

1. **The Source Scout has still never successfully retrieved a real document.** Every
   `retrieved` code path is proven by mock fixtures and nothing else. The first live run in an
   environment with open egress should be watched closely.
2. **`docs/AGENT-ROLES.md` and `docs/AGENT-CONTRACTS.md` describe overlapping ground at
   different altitudes** — ten roles in prose vs. fourteen machine contracts — and nothing
   currently checks that a role's obligations in the former are actually enforceable through
   the latter. That reconciliation was not attempted here; it is a documentation-consistency
   question, not a code conflict, and belongs to a session that reads both closely.
3. **The five operating-policy documents (`AUTONOMY-POLICY.md`, `DATA-GOVERNANCE.md`,
   `SOURCE-POLICY.md`, `VERIFICATION-POLICY.md`, `AGENT-ROLES.md`) have not been cross-checked
   against `agent/schemas/`** for the same reason — they were written before the contracts
   existed, in prose, by a different session. Where they agree, that is not yet verified;
   where they might disagree, nothing would currently catch it.
4. **No agent is scheduled.** `docs/AGENT-RUNBOOK.md` describes a design, not a running
   system. See the next objective below.
5. **106 records carry an unverified or requires-verification note** — unchanged, and still
   the project's largest open body of work, still blocked on the same egress policy that
   blocks the Scout.
6. Carried forward: the record store (`agent/records/`) is per-developer, no retention
   policy, concurrent writers untested.

## Unresolved issues, carried forward

1. `data/brief.json` is canonical but never consumed; `index.html`'s inline
   `window.__CONTENT__` blob has already drifted from it (`meta.standfirst` differs).
2. No deploy gate. A push to `main` publishes; the validators do not run in CI.
3. GitHub Pages serves the repository at root, so `agent/` is reachable even though nothing
   links to it and no run data is committed.

## Next session

**Two candidate objectives, and they do not depend on each other:**

**A — open the egress policy for the hosts `data/sources.json` and the Source Scout's
registered endpoints cite**, then run `node agent/scout/cli.mjs --live` and see what the
first real candidates say about the contracts. This is the single highest-leverage next step
in the whole project: everything downstream (verification, the 106 unverified records) is
blocked on it.

**B — reconcile the policy documents against the code contracts** (limitation 2 and 3 above):
read `docs/AGENT-ROLES.md`, `docs/AUTONOMY-POLICY.md`, `docs/DATA-GOVERNANCE.md`,
`docs/SOURCE-POLICY.md`, `docs/VERIFICATION-POLICY.md` against `agent/schemas/` and
`docs/AGENT-CONTRACTS.md`, and report — do not silently paper over — anywhere they disagree
about what an agent may do.

Do not build the Verifier yet. It needs a document the Scout can actually open, which is
objective A.

### Exact next objective

Ask the repository owner which of A or B to prioritise, or whether to do the reachable parts
of B (a read-only audit) while waiting on a decision about A (which is an infrastructure
change outside this session's authority).

## Anything the next agent must know

- **Fork from the actual current `main`, not from memory of an earlier commit.** Run
  `git fetch origin main && git log --oneline -3 origin/main` before believing anything about
  what exists. This reconciliation exists because five sessions did not do that.
- The repository's governance is `agent/schemas/`. An agent that does not emit through
  `gateway.mjs` will not be reconcilable with the rest of the project, however good its code
  is — ask the third Scout.
- `agent/records/` and `agent/observability/runs/` are both git-ignored. Never commit either.
- `docs/AGENT-RUNBOOK.md` is design documentation for retired code, not an operating manual.
  Read its opening section before acting on anything in it.

## Do not

Carried forward and still binding:

- Do not rebuild the site. No framework, no bundler, no build step, no dependency, no service
  worker, no server-side rendering.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative.
- Do not modify `data/*.json` in a session not scoped for data work.
- Do not touch the footer's non-affiliation or no-legal-advice text, `TIER_GRADE` in
  `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in `tools/_footer.mjs`.
- Do not declare a licence. Do not soften the README's known limitations or the
  unverified-record count. Do not re-run `tools/_refsweep.mjs` or `tools/_review10.mjs`.
- Do not change the id shapes in `agent/observability/ids.mjs`, and do not move redaction to
  the read path.
- Do not commit anything under `agent/records/` or `agent/observability/runs/`.
- Do not add a validation bypass to `agent/schemas/validate.mjs`. No `skip`, no `force`, no
  `strict: false`. `allowSimulated` admits a fixture and nothing else.
- Do not add a field for a substitute value to `DataGap` or anywhere else.

Added by this reconciliation:

- **Do not resurrect the retired Scouts.** Neither the claim-scoped citation resolver
  (`…scout-agent-implementation-wsa31u` @ `7fcf0c5`) nor the report-based third Scout
  (`…source-scout-scheduled-workflow-5s645a` @ `ff84fe3`) should be rebuilt from their
  branches. Both were deliberately retired; the reasoning is above, and it does not weaken
  with time.
- **Do not treat `docs/AGENT-RUNBOOK.md` as a live operating manual.** Its scheduling design
  is worth porting; its file paths and CLI invocations refer to code that has been deleted.
- **Do not start a new session's branch from anything other than the current tip of `main`.**
  This entire session exists because that rule was not followed for four sessions running.
- **Do not re-litigate the two contract decisions already made** (the `docs/AGENT-CONTRACTS.md`
  rename, and `retrieval_blocked` pairing with `null_not_researched` rather than a new
  `retrieval_failed` kind) without reopening the reasoning recorded above and in this file's
  own history — both were argued, not defaulted to.

---

## What must NOT be rebuilt

Unchanged since SESSION 00, and every session since has respected it: **the architecture is
not technical debt, it is the argument.** The zero-build, zero-dependency, client-rendered
model; `js/data.js` as the sole fetch point; the derivation layer; the one-home-per-fact data
model; the taxonomy as universal enum authority; the `null` / `unknown` distinction;
`js/shell.js` and `js/evidence-view.js` as single renderers; the seven duplicated footers; and
the four validators — none of these was touched by any of the four merges in this session,
and none should be.

The agent layer this session reconciled was built to the same standard on every line that
contributed to it: no dependency, no build step, derived state never stored, every record
able to say what it cannot support. Where two lines disagreed about what a record may assert,
the disagreement was settled on that same principle rather than by which branch was newer.
