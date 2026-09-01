# HANDOVER

**Last updated:** SESSION 05 · 1 September 2026
**Branch:** `claude/scout-agent-implementation-wsa31u`
**Base commit:** `68805c8` (SESSION 04, on `claude/inter-agent-contract-schemas-o6dfc7`) —
**not** `main`. See the discrepancy below; this matters more than anything else in this file.

---

## Current milestone

**SESSION 05 — Instrument the Scout, read-only, against the contracts. Complete.**

One agent exists: `agent/scout/`. It is read-only, it runs against real sources, and in this
environment it retrieved nothing, because the environment refuses every outbound host. That
is recorded as a finding rather than worked around.

The reference documents are **`agent/scout/README.md`** and **`docs/AGENT-CONTRACTS.md`**.
This file is the handover only.

---

## Discrepancy with the repository — READ THIS FIRST

**The session brief was written against `agent/schemas/`, which does not exist on `main`.**

SESSION 04's work is real and complete, but it was never merged. Four session branches have
diverged in parallel and only SESSION 02 has ever reached `main`:

| Session | Branch | On `main`? |
|---|---|---|
| 00, 02 (governance + observability) | `main` @ `4bd1f0d` | — it *is* `main` |
| audit + constitution | `claude/repo-architectural-audit-v45psd` @ `cfe5d54` | **No** |
| 03 — shared skill library (16 skills, `docs/SKILL-MAP.md`) | `claude/shared-skill-library-djn1oo` @ `feac219` | **No** |
| 04 — the fourteen contracts | `claude/inter-agent-contract-schemas-o6dfc7` @ `68805c8` | **No** |
| 05 — the Scout (this session) | `claude/scout-agent-implementation-wsa31u` @ `45fec5d` | **No** |

SESSION 05 cannot be done without SESSION 04 — the brief names `gateway.mjs`, `fixtures.mjs`,
`allowSimulated` and the contracts by name. So **this branch was fast-forwarded onto
`68805c8`** (whose merge-base with `main` *is* `main`, so this was a clean fast-forward, not a
merge) and the Scout was built on top. SESSION 03 was deliberately **not** pulled in: it is
out of this session's scope, and sweeping 2,240 lines of unrelated skills into this commit
would have been the defect `git-workflow` warns about.

**This is the author's decision to make, and it is now the largest open question in the
project.** Four parallel lines of work, none merged, all touching `AGENTS.md`,
`docs/HANDOVER.md` and `.gitignore`. Known conflicts when they are merged:

- **`docs/HANDOVER.md`** — SESSION 03 and SESSION 04 each rewrote it wholesale, and so did
  this session. Three-way conflict, guaranteed.
- **`AGENTS.md`** — SESSION 03 rewrote the skills paragraph; this session added two rows to
  the table just above it. Adjacent, probably auto-mergeable, worth reading.
- **`.gitignore`** — SESSION 03 added five lines; this session added `agent/runs/`.
- **`.agents/skills/git-workflow/SKILL.md`** — **both** SESSION 03 and this session fixed the
  stale branch name, differently. **Take SESSION 03's version**: it is the richer fix (it also
  says to confirm with `git branch --show-current`, and states why the branch is named in the
  brief and not in the skill). This session's is the one-line fix its brief specified, made
  because SESSION 03 is unmerged and its fix is therefore not present on this line of work.

## Implementation

`agent/scout/` — the first real agent. Zero dependencies, no build step, nothing wired into
the site.

- **What it does.** Reads a claim from `data/claims.json`; resolves every source it cites
  against `data/sources.json`; **actually attempts** an HTTP retrieval of each cited URL;
  emits `SourceCandidate` for what it located, `DataGap` for what it could not retrieve and
  for claims the corpus itself says have no external source, `AgentObservation` for what the
  run established, and an `AgentRun` for the run — all through `agent/schemas/gateway.mjs`.
- **What it does not do.** No `VerificationRecord` — verifying is the Verifier's contract, and
  an agent that verifies its own findings has verified nothing. No `*Proposal`, no
  `ChangeRecord`, no `WebsiteChange`. No write to `data/*.json`, and no `sources.json` record:
  creating one from anything but a retrieved document is red tier. The suite asserts all of
  this by name.
- **The distinction it exists to keep.** What `data/sources.json` *records* about a document
  (a fact about the corpus, evidenced by the corpus, at a real locator) is not what the
  *document says* (a fact about the world, requiring having opened it). With retrieval
  blocked only the first is available, so those candidates cite `dataset_record` evidence
  rather than `retrieved_document`, phrase every fact as a fact about the corpus in so many
  words, carry `url_status: "url:unchecked"`, set `tier_estimate: null`, and are filed as
  `duplicate` of the source record they came from. **A re-read of `sources.json` is not a
  find, and must never read as one.**
- **Retrieval outcomes are classified, not reduced to a boolean** — `retrieved` /
  `policy_denied` / `http_error` / `network_error`. The middle two arrive as the same HTTP
  403, so `retrieve.mjs` reads response headers rather than status codes alone.
- **Traced end to end**: agent span, one retriever span per attempt, real `provenance` records
  with a real locator and a real `retrieved_at`, and a `decision` record per failed retrieval
  naming the three alternatives it rejected — including "substitute a different, reachable
  document", rejected outright.

`agent/schemas/store.mjs` — where a contract record lives (decision 0.1 below).

## Files changed

```
NEW
  agent/scout/README.md               what it does, and the network reality it ran into
  agent/scout/scout.mjs               the agent
  agent/scout/retrieve.mjs            one HTTP attempt, honestly classified
  agent/scout/corpus.mjs              read-only reads of data/*.json
  agent/scout/cli.mjs                 claims · run · show
  agent/scout/selftest.mjs            12 tests
  agent/schemas/store.mjs             agent/runs/, written through the gate

MODIFIED
  agent/schemas/types.mjs             + absence_kind retrieval_failed, + gap_kind retrieval_blocked
  agent/schemas/contracts/data-gap.mjs  + the two pairing rules, and why
  agent/schemas/selftest.mjs          + the test for them (61 → 62)
  agent/schemas/README.md             an agent speaks these contracts now
  docs/AGENT-CONTRACTS.md             the storage decision, retrieval_failed, limitations 1/5/6
  AGENTS.md                           two rows: AGENT-CONTRACTS.md, OBSERVABILITY.md
  .gitignore                          + agent/runs/
  .agents/skills/git-workflow/SKILL.md  the stale branch name, one line
  docs/HANDOVER.md                    this file
```

**No file the website ships was modified.** Confirmed by `git status --porcelain`. No run
output is committed.

## The three decisions carried forward from SESSION 04

**0.1 — Contract records live in `agent/runs/`.** One JSONL file per run, named by `trace_id`,
appended and never rewritten, git-ignored, on the same reasoning `agent/observability/runs/`
already gives. **Not `data/`**: that is the legal record, and a contract record is an agent's
unverified finding — a `SourceCandidate` is not a source, and putting one where sources live
is how the two stop being distinguishable. Written into `docs/AGENT-CONTRACTS.md` and
`.gitignore`. **The store is not a second path around the gate**: `ContractStore.append` calls
the gateway's own `receive`, which validates and throws, and a test asserts an invalid record
dies at the store boundary.

**0.2 — `AGENTS.md` now points at `docs/AGENT-CONTRACTS.md` and `docs/OBSERVABILITY.md`.** Two
rows in the "Read these first" table and nothing else. Restating a rule there would create the
second home that file exists to prevent.

**0.3 — `.agents/skills/git-workflow/SKILL.md` no longer hard-codes a branch name.** One line.
Nothing else in that skill was touched. See the merge note above: SESSION 03 fixed this
differently and better, and its version should win.

## Architecture decisions

1. **The branch was based on SESSION 04, not `main`.** The alternative was to deliver nothing.
   Recorded above as the project's largest open question rather than resolved silently.
2. **A contract was changed rather than routed around** — see below. SESSION 04's §3 authorised
   exactly this, and required the contract, its tests and the documentation to move together.
   They did, in one commit.
3. **Retrieval outcomes are classified rather than booleaned.** `policy_denied` vs
   `http_error` is the distinction that matters: an egress proxy denying a request answers
   with the same 403 an origin uses to refuse a bot, and recording ours as theirs would be a
   false statement about a publisher inside a record that looks like research.
4. **A failed candidate is `duplicate`, never `proposed`.** It re-derived a citation the corpus
   already holds. `proposed` would say the Scout found something new.
5. **`url_status` is `url:unchecked` on a refused attempt** — never `url:live` (nothing was
   fetched) and never `url:dead` (that is a claim about the URL made out of our own failure).
6. **`role: "unresolved"` on the Scout's evidence and provenance records.** The provenance role
   of a document is exactly what the agent failed to establish; claiming one would be the
   inference the record exists to avoid. See known limitation 4.
7. **The Scout does not hand off.** `handed_off_to: []`. There is no Verifier, and creating a
   queue entry addressed to an agent that does not exist would imply one does.
8. **The parsed corpus never leaves `corpus.mjs`.** See "one defect found" below.
9. **`AgentRun.status` is `ok` on a run that retrieved nothing.** The agent did not fail; the
   network did, and that is what the `DataGap` records are for. A `failed` run would say the
   Scout malfunctioned.

## The contract that turned out to be the wrong shape

SESSION 04 predicted the first real agent would find one. It did.

**`absence_kind` gained `retrieval_failed`; `GAP_KINDS` gained `retrieval_blocked`; `DataGap`
gained two rules pairing them in both directions.**

With only the three original absence kinds, a document the Scout cannot reach had to be filed
as either `null_not_researched` — which says nobody looked, when somebody did — or
`unknown_not_determinable`, which is much worse: **that one asserts the answer is not publicly
determinable, which is a claim about the world, and a false one manufactured out of a network
failure.** The Official Journal is published whether or not this process can open a socket.

The general rule: **an agent must never be able to turn its own failure into a finding about
EU law.** `VERIFICATION_VERDICTS` already had `source_unavailable`, so SESSION 04 had seen
this state for the Verifier's verdict and not for the absence taxonomy — which is why this
reads as a gap in the contract rather than a disagreement with it.

Contract, rules, tests and `docs/AGENT-CONTRACTS.md` changed in the same commit. Rule count
went 69 → 71; the schema suite went 61 → 62 tests.

## Network reality — reported, not papered over

**Every outbound host is refused in this environment.** The egress proxy answers HTTP 403 with
`x-deny-reason: host_not_allowed` and a body reading `Host not in allowlist: <host>`, for
EUR-Lex, for `andreatosti2001.github.io`, for `example.com` — everything. Confirmed directly
against the proxy's own status endpoint, which logs each refusal as
`connect_rejected · gateway answered 403 to CONNECT (policy denial)`.

This is the environment's egress allowlist, **not** EUR-Lex refusing us, and the Scout records
it as such. Consequences:

- **Zero documents were retrieved.** Every retrievable source became a `DataGap` with
  `gap_kind: retrieval_blocked` / `absence_kind: retrieval_failed`.
- **Nothing was invented to compensate**, and the demonstrator's simulated fixtures were not
  reused. The success path is exercised only by a stub `fetch` in the suite — a test double
  for the transport, whose records are checked and never stored.
- SESSION 00 recorded HTTP 403 on the live site. This is the same wall, now measured
  precisely and given a contract shape.

**The single highest-value change to what this agent can do is not a code change.** Adding
`eur-lex.europa.eu` (and the handful of regulator hosts `data/sources.json` cites) to the
environment's network egress allowlist would let the Scout do the job it was built for. Until
then it can locate leads and name gaps, and it cannot open a document.

## Tests

Run from the repository root, on `45fec5d`:

| Command | Result |
|---|---|
| `node --test agent/schemas/selftest.mjs` | **62 pass · 0 fail** (was 61; +1 for the contract change) |
| `node agent/schemas/cli.mjs check` | 14 contracts, 14 satisfiable, exit 0 |
| `node --test agent/observability/selftest.mjs` | **13 pass · 0 fail** |
| `node agent/observability/cli.mjs validate` | 0 invalid · 0 unparseable · exit 0 |
| `node --test agent/scout/selftest.mjs` | **12 pass · 0 fail** |
| `node tools/validate.mjs` | 0 errors · exit 0 |
| `node tools/i18n-audit.mjs` | 0 errors · 0 warnings |
| `node tools/design-qa.mjs` | 0 errors · **5 warnings** · exit 0 — the same five as §12 |
| `node tools/freshness.mjs` | reports only · exit 0 · "Nothing past its stated interval" |

**The four validators' output is byte-identical to the baseline** taken before any file was
changed, compared with `diff`. No new warning.

Also run live: `node agent/scout/cli.mjs run clm-dpc-collected` (3 cited URLs, 3
`policy_denied`, 9 records emitted) and `run clm-dpc-staff-growth` (placeholder-only, 0
retrievals attempted, 0 candidates, 1 `missing_source` gap) — the honest-empty path.

**Not run:** no browser or viewer testing of the Scout's traces (the viewer was verified in
SESSION 02 and its code is unchanged); no successful live retrieval of any kind, because none
is possible here; no concurrent runs.

## Observability

The run is traced end to end through `tracer.mjs`: one agent span (`run_id` = its `span_id`),
a `corpus.claim` tool span, one `http.get` retriever span per attempt with a `usage` record
carrying real latency, a `provenance` record per source with a real locator and a real
`retrieved_at`, a `decision` record per failed retrieval with three named rejected
alternatives, and an `artifact` pointer per contract record — id, contract name and sha256,
never a copy of the body. `console.log` is not used as the observability mechanism anywhere;
the CLI writes to stdout for a human, which is a different thing.

## One defect found and fixed while building

Letting `run.step` capture a tool's return value wholesale put a **74 KB copy of
`data/claims.json` into a single trace line**, because the corpus reader returned the parsed
dataset alongside the claim. Nothing failed — it was simply the second home for the entire
corpus, arriving through an output capture rather than a schema. The parsed corpus no longer
leaves `corpus.mjs`, spans close with explicit compact outputs, and a regression test asserts
no trace record exceeds 8 KB and that neither a dataset nor a document body appears in one.
Max trace line went from 74,292 bytes to 1,483.

## Known limitations

1. **The Scout has never successfully retrieved anything.** The whole `retrieved` path is
   proven by tests with a stub `fetch` and by nothing else. The first run in an environment
   with real egress should be watched closely.
2. **It scouts one claim per run.** No batching, no scheduling, no resumption, and no
   cross-run deduplication of gaps: scouting the same claim twice writes two `DataGap` records
   with two ids and no relationship between them.
3. **It only looks where the corpus already points.** It resolves the sources a claim cites; it
   does not search for sources the corpus does not name. For the 20 claims resting only on the
   brief's own placeholder, it can therefore say only "no external source is recorded" — which
   is true and useful, and is not the same as having looked for one.
4. **`role: "unresolved"` is doing work the vocabulary was not designed for.** `PROVENANCE_ROLES`
   describes how a *legal source* stands; the Scout uses `unresolved` for a corpus record, a
   measurement of its own run, and an unopened document. It is defensible in each case and it
   is not obviously right. Expanding that vocabulary would touch the observability layer's
   re-exported enum and risk drift with `data/claims.json`, so it was left alone deliberately.
5. **`retrieval_failed` carries no field-value rule.** The other two absence kinds constrain
   the field they name (`null_not_researched` forbids a value, `unknown_not_determinable`
   requires `"unknown"`). `retrieval_failed` constrains nothing, because a field could
   legitimately carry a value obtained another way. Whether that is right is unproven.
6. **The `<title>` reader is the only thing that parses a retrieved document**, and it is
   deliberately crude. Anything more would be extraction, which is the Verifier's problem.
7. **Only four of the fourteen contracts have been exercised** by a real agent. The other ten
   remain unproven, and the next one built will probably find its own wrong-shaped field.
8. Carried forward: the store is per-developer; there is no retention policy; concurrent
   writers are untested.

## Unresolved issues

Carried forward and still open:

1. **`data/brief.json` is canonical but never consumed**; its content ships as the inline
   `window.__CONTENT__` blob at `index.html:361`. Two homes for one set of facts.
2. **The two copies have already drifted** — `meta.standfirst` differs. The author's decision.
3. **No deploy gate.** A push to `main` publishes; the validators do not run in CI.
4. **106 records carry an unverified or requires-verification note.** The project's largest
   open body of work — and the thing the Scout was built to start chipping at, which it cannot
   do until it can reach a document.
5. **No decision on excluding `agent/` from the Pages deployment.** Now slightly larger:
   `agent/scout/` joins `agent/observability/` and `agent/schemas/` under the published root.
   Nothing links to it and no run data is committed, but it is reachable.

New, from this session:

6. **Four unmerged parallel session branches.** See the discrepancy section. This is now the
   project's biggest structural risk: the longer they diverge, the worse the `docs/HANDOVER.md`
   conflict gets.
7. **The environment's egress allowlist is the binding constraint on every future research
   agent**, not just this one. The Verifier will hit exactly the same wall, and it has less to
   do without a document than the Scout does.

## Next session

**SESSION 06 — the Verifier, against a document the Scout can actually retrieve.**

Prerequisite, and it is a real one: **either the egress allowlist is opened for the source
hosts `data/sources.json` cites, or SESSION 06 is a different session.** A Verifier's entire
contract is comparing a statement against a retrieved document. With retrieval blocked it can
produce exactly one verdict — `source_unavailable` — which the Scout's `DataGap` records
already say more precisely. Building it into a blocked network would produce a component that
looks finished and has never done its job once.

If egress cannot be opened, the better next objective is the one SESSION 02 named and nobody
has taken: **retrofit the four validators in `tools/` to emit a structured record alongside
their human-readable output.** It needs no network, it is the smallest useful increment, and
`QAResult` is the contract it would exercise — a fifth of the fourteen, proven.

### Exact next objective

Ask the author to decide the merge question in the discrepancy section **before** writing any
code. Every branch listed there rewrites `docs/HANDOVER.md`, and a fifth parallel line makes
it worse. Then, depending on the egress answer, build the Verifier or instrument the
validators — one of the two, not both.

## Anything the next agent must know

- **The repository is the source of truth, and `main` is not the whole repository.** Run
  `git ls-remote --heads origin` before believing anything about what exists.
- The Scout's records are **real** — `simulated: false` throughout, validated with
  `allowSimulated` off. Nothing outside `fixtures.mjs` may be marked simulated, and the suite
  asserts it.
- `agent/runs/` and `agent/observability/runs/` are both git-ignored. Do not commit either.
- The gate is `agent/schemas/gateway.mjs` and the store calls into it. If you need a record
  somewhere new, route it through `emit` or `receive`; do not add a third door.
- A `403` is not evidence about a publisher. Read the headers before writing down whose
  refusal it was.

## Anything the next agent must NOT change

Carried forward, unchanged and still binding:

- **Do not rebuild the site.** No framework, no bundler, no build step, no dependency, no
  service worker, no server-side rendering.
- **Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative.**
- **Do not modify `data/*.json`** in a session not scoped for data work.
- **Do not touch** the footer's non-affiliation or no-legal-advice text, `TIER_GRADE` in
  `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in `tools/_footer.mjs`.
- **Do not declare a licence.** **Do not soften** the README's known limitations or the
  unverified-record count. **Do not re-run** `tools/_refsweep.mjs` or `tools/_review10.mjs`.
- **Do not change the id shapes in `ids.mjs`**, and do not move redaction to the read path.
- **Do not remove the demonstrator's simulation markers**, and do not point it at a real
  source.

Added by this session:

- **Do not let the Scout write to `data/`, verify anything, or propose anything.** The suite
  asserts all three by contract name; if a test there starts failing, the agent has grown a
  second job and needs splitting, not a looser test.
- **Do not collapse `retrieval_failed` back into the other absence kinds**, and do not
  weaken the two `DataGap` pairing rules. They exist to stop a network failure being written
  down as a finding about EU law.
- **Do not give `DataGap` a field for a substitute** under any name. The forbidden list is the
  contract, and the Scout's suite re-checks it independently.
- **Do not let a span capture a dataset or a document body.** Close spans with explicit
  compact outputs; the 8 KB regression test is there because this already happened once.
- **Do not mark `url_status` as `url:live` or `url:dead` on an attempt that never reached the
  origin**, and do not attach a URL to a `provenance` record for a document that was not
  opened.
- **Do not merge SESSION 03's branch by taking this session's `git-workflow` fix.** Theirs is
  better; this one exists only because theirs is unmerged.

---

## What must NOT be rebuilt

SESSION 00's closing statement stands, and SESSION 02's and SESSION 04's restatements of it
stand with it: **the architecture is not technical debt, it is the argument.** The zero-build,
zero-dependency, client-rendered model; `js/data.js` as the sole fetch point; the derivation
layer; the one-home-per-fact data model; the taxonomy as universal enum authority; the `null` /
`unknown` distinction; `js/shell.js` and `js/evidence-view.js` as single renderers; the seven
duplicated footers; and the four validators — none of these was touched, and none should be.

The Scout was built to the same standard: no dependency, no build step, derived state never
stored, every record able to say what it cannot support — and, when the contracts could not
express what was actually true, the contract was changed in the open rather than the record
bent to fit it.
