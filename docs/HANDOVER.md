# HANDOVER

**Last updated:** SESSION 05 · 1 September 2026 (reconciliation)
**Branch:** `claude/scout-agent-implementation-wsa31u`
**Base commits:** `68805c8` (SESSION 04 — the inter-agent contracts) and `2995328`
(SESSION 05 — the Source Scout), merged here.

---

## Read this first — two Scouts were built, and one was chosen

SESSION 05 ran **twice, in parallel, in two sessions that could not see each other**, and each
built a complete Scout into `agent/scout/`:

| | Branch | What it was |
|---|---|---|
| **Adopted** | `…inter-agent-contract-schemas-o6dfc7` @ `2995328` | The **Source Scout** — discovers documents from the official EU authority hierarchy. 9 modules, 30 tests, `docs/SOURCE-SCOUT.md`. |
| Retired | `…scout-agent-implementation-wsa31u` @ `7fcf0c5` | A claim-scoped citation resolver: given a claim id, it resolved the sources `data/claims.json` already cited and reported what it could not retrieve. 5 modules, 12 tests. |

Both passed their own suites. They were **mutually incompatible**, and it was verified rather
than assumed: each Scout's real records were run through the other's validator, and each was
refused — the retired branch's records with three errors, the adopted branch's with one.

**The decision, and the reasoning.** The Source Scout was adopted whole. It is the stronger
implementation — an authority hierarchy, duplicate detection, extraction, mock-first fixtures
and two and a half times the tests — and, more importantly, it actually *scouts*: it discovers
documents the corpus does not yet name, where the retired one could only re-resolve citations
the corpus already held.

The two branches had also amended `DataGap` in contradictory ways, which is the part worth
understanding, because the retired branch's argument was not obviously wrong:

- adopted: `gap_kind: retrieval_blocked` ⟹ `absence_kind: null_not_researched`
- retired: `gap_kind: retrieval_blocked` ⟹ a **new fourth** `absence_kind: retrieval_failed`

The retired branch argued that `null_not_researched` reads as "nobody looked", when in fact
somebody looked and was refused. The adopted rule wins anyway, on this repository's own first
principle: **`gap_kind: retrieval_blocked` already records that retrieval was attempted and
refused.** Putting the same fact into `absence_kind` as well is a second home for one fact.
The fourth state also grows a vocabulary the site's own `null` / `unknown` discipline
(AI-SAFE-BOUNDARIES §0.3) is built around, and every downstream consumer would have had to
learn it.

Both designs refuse `unknown_not_determinable` for an unreachable document, so the actual
harm — turning a network failure into a claim that an answer is not publicly determinable —
is prevented either way. That was the thing that mattered, and both got it right.

**What survived from the retired branch:** only the two entry-point fixes its brief asked for,
which the adopted branch never touched — the `AGENTS.md` rows pointing at
`docs/AGENT-CONTRACTS.md` and `docs/OBSERVABILITY.md`, and the removal of the hard-coded
branch name in `.agents/skills/git-workflow/SKILL.md`. Its Scout, its `agent/schemas/store.mjs`
and its `agent/runs/` store are **deleted**; the record store is `agent/records/`.

---

## Current milestone

**SESSION 05 — Build Agent 1: the Source Scout. Complete, with one part of the
brief blocked by this environment and reported rather than faked.**

The reference document is **`docs/SOURCE-SCOUT.md`**. This file is the handover
only.

The handover is consistent with the code: SESSION 04 recorded that no agent
existed and named the Scout as the next objective. One now exists, it is
read-only, and it speaks the contracts SESSION 04 defined.

### FINDING — live retrieval is refused by this environment's egress policy

The brief says: *"Then connect a small number of real authoritative sources."*
The connection is built, instrumented and was run. It retrieved nothing, because
**all five registered endpoints answer HTTP 403 on CONNECT** at the session's
egress proxy:

```
eur-lex.europa.eu · digital-strategy.ec.europa.eu · www.edpb.europa.eu
www.edps.europa.eu · www.enisa.europa.eu
```

The proxy's own status endpoint records each denial as a policy denial, and its
documentation states that such refusals must be reported rather than retried or
routed around. A live run therefore produces:

```
0 candidate(s) · 5 gap(s) · 5 retrieval attempt(s)
5 retrieval(s) refused before reaching the origin
```

Each gap carries the actual proxy message, says that this is the environment's
egress policy and **not a statement about the document**, and names what would
close it. **Nothing was invented to make the demonstration look complete, and no
claim is made anywhere in this repository about what any of those sites
currently publishes.** The five endpoint entries are marked
`endpoint_verified: false`: they are addresses the Scout will attempt, not
citations.

To finish this half of the brief, the environment's network policy must permit
those hosts. Nothing in the code needs to change to take advantage of it — the
same command produces candidates instead of gaps.

## Implementation

`agent/scout/` — the Source Scout. Read-only, zero dependencies, no build step,
nothing wired into the site.

- **Mission.** Given the instruments already tracked in
  `data/instruments.json`, retrieve documents from official EU sources and
  report which bear on them.
- **The nine-level priority hierarchy** lives as `AUTHORITY_CLASSES` in
  `agent/schemas/types.mjs`, and **the array order is the priority order** —
  rank is derived from the index, so the ranking cannot disagree with itself.
  Secondary sources may be discovered and are labelled
  `authority:secondary-expert`; a contract rule refuses a secondary source that
  claims `tier:1` or `tier:2`.
- **Authority is not tier.** The tier estimate reads the taxonomy's own tier
  notes and takes the document type into account, and returns **null with a
  stated reason** where neither settles it — the Commission spans two tiers, and
  a secondary source is tier 3 or tier 4 depending on what kind of document it
  is.
- **The four epistemic states are filled honestly.** Title, publisher and
  publication date are `fact` only where the document states them in a
  machine-readable field. Authority class and tier are `inference`, with the
  method. Relevance is `interpretation`, carrying the exact matched string and
  count. Everything else is `unresolved`: an undated document yields
  `publication_date: "unknown"` and a question, never a date taken from the URL;
  an unregistered host yields a null authority class and a question, never a
  quiet "secondary"; `source_type` is always null and says so.
- **Being served by a host is never recorded as a publisher.** The publisher is
  read from what the document says about itself; the host produces an inference
  about the authority class. A fixture exercises exactly this.
- **Duplicates are named, never resolved**, and graded by what they prove:
  identical bytes, then normalised URL, then identical title — the last reported
  explicitly as a suggestion. Choosing between two records is a change to the
  corpus, and this agent is read-only.
- **Mocked first.** `fixtures.mjs` is seven simulated documents on `.invalid`
  hosts covering every awkward case; the live transport came second.
- **Fully instrumented.** A mock run writes 13 spans, 7 observations, 4
  provenance records, 12 usage records and 14 artifact pointers. Every contract
  record reaches the trace as an id and a sha256, never as a copy.
- **The record store** — `agent/records/<trace_id>.jsonl`, append-only,
  git-ignored, validated on the way in. This closes the storage question
  SESSION 04 left open.

## Files changed

```
agent/scout/README.md                          (new)
agent/scout/authorities.mjs                    (new)
agent/scout/transport.mjs                      (new)
agent/scout/extract.mjs                        (new)
agent/scout/dedupe.mjs                         (new)
agent/scout/store.mjs                          (new)
agent/scout/scout.mjs                          (new)
agent/scout/fixtures.mjs                       (new)
agent/scout/cli.mjs                            (new)
agent/scout/selftest.mjs                       (new)
docs/SOURCE-SCOUT.md                           (new — the reference document)

agent/schemas/types.mjs                        (AUTHORITY_CLASSES; gap kind retrieval_blocked)
agent/schemas/contracts/source-candidate.mjs   (3 new fields, 3 new rules)
agent/schemas/contracts/data-gap.mjs           (1 new rule)
agent/schemas/fixtures.mjs                     (the SourceCandidate fixture, for the new fields)
agent/schemas/selftest.mjs                     (6 new tests for the above)
docs/AGENT-CONTRACTS.md                        (counts, the amendments, two limitations)
docs/HANDOVER.md                               (rewritten)
.gitignore                                     (agent/records/)
```

**No file the website ships was modified. No file of the observability layer was
modified. No file in `data/` was modified** — the suite hashes the whole
directory around a full run and fails if a byte moves.

## Architecture decisions

1. **Contract records live in `agent/records/`, git-ignored, never `data/`.**
   Same shape as the trace store and for the same reasons. `data/` is the legal
   record; an agent's findings are not that until a human has verified them.
2. **Four contract amendments, each with tests in the same commit** — the rule
   SESSION 04 set for exactly this moment. `SourceCandidate` gained
   `authority_class` (inference, nullable, with a rule that a null one must be
   declared rather than defaulted to secondary), `duplicate_candidate_ids` and
   `confidence`; `DataGap` gained `gap_kind: retrieval_blocked`, tied by a rule
   to `absence_kind: null_not_researched`.
3. **The retrieval date and the content fingerprint were NOT added** as
   top-level fields, though the brief lists them. They live on the evidence
   entry that records the retrieval — `evidence[].retrieved_at` and
   `evidence[].checksum` — because they are properties of the act of fetching,
   not of the document. Both are on the record, one level down, on the thing
   they describe. A test asserts the top-level fields do not exist. **If the
   author wants them at the top level, that is a defensible different call — it
   just costs a second home for two facts.**
4. **The publisher is read from the document; the host produces an inference.**
   Collapsing the two would have made "served by enisa.europa.eu" into "published
   by ENISA", which is a fact the document never stated.
5. **A tier estimate is null where the taxonomy does not settle it.** The
   mapping is read out of `data/taxonomy.json`'s own tier notes and invents no
   classification.
6. **`extract.mjs` returns null rather than a good guess** — no date from a URL,
   none parsed out of prose, no publisher from a hostname. A null makes the Scout
   write an open question; a guess makes it write something a reader might act
   on.
7. **The transport is the only module that touches the network**, so a refusal
   has one place to be recorded honestly and everything above it is testable
   without one. It never disables TLS verification; a test asserts the strings
   are absent from the file.
8. **The `AgentRun` records no affected entities.** A read-only discovery run
   changes nothing, so it is green tier. See the limitation below — this is
   correct but it leans on a distinction the contracts do not yet make.
9. **Politeness is a default, not an option**: one request at a time, a
   one-second pause, a descriptive user agent, a 2 MB cap, a 20 s timeout.

## Tests

Run in this session from the repository root:

| Command | Result |
|---|---|
| `node --test agent/scout/selftest.mjs` | **30 pass · 0 fail** |
| `node --test agent/schemas/selftest.mjs` | **67 pass · 0 fail** (61 + 6 new) |
| `node --test agent/observability/selftest.mjs` | 13 pass · 0 fail — unchanged |
| `node agent/schemas/cli.mjs check` | 14/14 satisfiable · exit 0 |
| `node agent/observability/cli.mjs validate` | 154 records · 0 invalid · exit 0 |
| `node tools/validate.mjs` | 0 errors · exit 0 |
| `node tools/i18n-audit.mjs` | 0 errors · 0 warnings |
| `node tools/design-qa.mjs` | 0 errors · **5 warnings** · exit 0 — the same five in §12 |
| `node tools/freshness.mjs` | reports only · exit 0 |

**The four validators' output is byte-identical to the baseline taken before any
file was touched**, compared with `diff`. No new warning.

Both modes were run end to end. **Mock:** 6 candidates, 1 gap, 1 screened out, 12
retrieval attempts — exercising duplicates, an undated document, a
publisher-less page, a secondary source and a refused endpoint. **Live:** 0
candidates, 5 gaps, 5 attempts, all refused (see the finding above). Every
record produced by either run validates; the mock ones are all `simulated: true`
and cite only `.invalid` hosts.

The suite's strongest guarantees: `data/` is hashed around a full run and must
be unchanged; the module is scanned for write calls; no date may come from a URL
or from prose; a host may not become a publisher; a refused retrieval must
become a named gap and never a candidate; an invalid record cannot reach the
store.

## Observability

**No file in `agent/observability/` was modified.** The Scout is a consumer:
spans for the run and every retrieval, `observe` for every meaningful operation,
`provenance` for every retrieved listing page, `usage` for network latency, and
`artifact` pointers written by the contract gate. A mock run produces 13 spans
and 50 records; every one satisfies the unchanged trace schema, asserted by the
suite.

## Known limitations

1. **Nothing has been retrieved from a real source.** No candidate in this
   repository has ever been produced from a real document.
2. **The endpoint registry is five unverified root URLs.** A working live run
   would likely show that a listing page is the wrong entry point and each
   authority needs its own feed.
3. **Link-following is one level deep**, capped at four documents per endpoint,
   with no memory of previous runs. This is a discovery sketch, not a crawler.
4. **Relevance is string matching.** It will match a passing mention and miss a
   discussion that never names the instrument. The matched string is recorded and
   `contested` is set when only an acronym matched, but it is the weakest part.
5. **`source_type` is never established**, so the tier estimate is null for the
   Commission and for every secondary source.
6. **Duplicate detection is within one run.** It never compares against
   `data/sources.json`, so `matches_existing_source_id` is always null.
7. **The governance check keys off `affected_entities`**, which the contracts
   define as "what this record is about". For a read-only record those are not
   the same thing, so the Scout's `AgentRun` records none. The distinction
   between "about" and "changes" is not in the contract and probably should be.
8. **No `robots.txt` handling.** The transport is polite but does not read it.
   Before any sustained live use, it should.
9. **`AgentObservation` and the tracer's `observe()` still overlap**, carried
   forward from SESSION 04.

## Unresolved issues

Carried forward and still open:

1. **`data/brief.json` is canonical but never consumed**; the content ships as
   the inline `window.__CONTENT__` blob at `index.html:361`.
2. **The two copies have already drifted** — `meta.standfirst`. The author's
   decision; an agent must not pick one.
3. **No deploy gate.** A push to `main` publishes; the validators do not run in
   CI.
4. **106 records carry an unverified or requires-verification note.**
5. **No decision on excluding `agent/` from the Pages deployment.** This session
   adds a third directory under it. Nothing is reachable as a page and nothing
   links to it, but the directory is served and the decision is still not taken.
6. **Neither `docs/OBSERVABILITY.md`, `docs/AGENT-CONTRACTS.md` nor
   `docs/SOURCE-SCOUT.md` is referenced from `AGENTS.md`.** The canonical entry
   point still does not mention that the contracts or the agent exist. This
   session again did not edit `AGENTS.md` — what belongs in the author's entry
   point is the author's decision — but the gap is now three documents wide, and
   it undercuts "no agent may bypass these contracts". **Recommendation: add
   three rows to the "Read these first" table, pointing only, copying no rule.**
7. **`.agents/skills/git-workflow/SKILL.md` names a stale branch**
   (`claude/eu-digital-policy-protocol-ntyhqc`). Recommendation unchanged:
   replace the hard-coded name with "the session's designated branch".

New, from this session:

8. **Live retrieval is blocked by the environment's egress policy.** See the
   finding above. This is the one part of the brief that could not be completed,
   and it is not a code defect.
9. **Whether the retrieval date and content fingerprint should be duplicated to
   the top level of `SourceCandidate`** — decision 3 above. Currently no.

## Next session

**SESSION 06 — the Verifier**, or **a live Scout run**, depending on whether the
egress policy can be opened.

If the network policy can permit the five hosts, do that first and run
`node agent/scout/cli.mjs --live` before building anything: the first real
candidates will say more about what these contracts got wrong than another
session of design will.

Otherwise, build **Agent 2: the Verifier** — one agent, taking a
`SourceCandidate` and a statement, and producing a `VerificationRecord` with a
verdict that the contract already gates on the evidence. It must not write to
`data/*.json` either; a verified candidate becomes a proposal for a human, not a
source record.

## Exact next objective

Either: open the egress policy for the five registered hosts, run the live
Scout, and record what the first real candidates show about the contracts.

Or: the Verifier, read-only against `data/`, consuming the Scout's stored
records through `agent/schemas/gateway.mjs` and emitting `VerificationRecord`
and `ClaimEvidence` records — never a `sources.json` entry, and never an
approval of its own work.

## Next-session instructions

- Read `AGENTS.md`, then `project-context`, then
  `docs/PROJECT-CONTEXT.md`, `docs/CURRENT-ARCHITECTURE.md`,
  `docs/AI-SAFE-BOUNDARIES.md`, this file, `docs/OBSERVABILITY.md`,
  `docs/AGENT-CONTRACTS.md` and `docs/SOURCE-SCOUT.md`.
- Re-run the four validators and confirm the §12 baseline first.
- **Every record goes through `agent/schemas/gateway.mjs`.** There is no second
  path and none may be added.
- **Only `agent/scout/fixtures.mjs` and `agent/schemas/fixtures.mjs` may mark a
  record `simulated`.** A live run's findings are real or they are not written.
- If a contract refuses something an agent legitimately needs to say, change the
  contract **and its tests in the same commit** and record what forced it. That
  is what this session did four times; it is the intended path, not a
  workaround.
- Do not weaken the Scout's honesty rules to produce more candidates. A date
  taken from a URL, a publisher taken from a hostname, or a tier guessed for a
  Commission document would each be exactly the defect this project exists to
  refuse.

## Do not

Carried forward, unchanged and still binding:

- **Do not rebuild the site.** No framework, no bundler, no build step, no
  dependency, no service worker, no server-side rendering.
- **Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative.**
- **Do not modify `data/*.json`** in a session not scoped for data work.
- **Do not touch** the footer's non-affiliation or no-legal-advice text,
  `TIER_GRADE` in `js/format.js`, the derivation rules in `js/pipeline.js`, or
  the `BASE` constant in `tools/_footer.mjs`.
- **Do not declare a licence.**
- **Do not soften** the README's known limitations or the unverified-record
  count.
- **Do not re-run** `tools/_refsweep.mjs` or `tools/_review10.mjs`.
- **Do not change the id shapes in `agent/observability/ids.mjs`.**
- **Do not move redaction to the read path.**
- **Do not commit anything under `agent/observability/runs/` or
  `agent/records/`.**
- **Do not add a validation bypass.** No `skip`, no `force`, no
  `strict: false`. The single flag that exists, `allowSimulated`, admits a
  fixture and nothing else.
- **Do not commit a `.schema.json`.**
- **Do not copy a contract record's body into the trace.**
- **Do not add a field for a substitute value** to `DataGap` or anywhere else.
- **Do not relax `supports:context`.**
- **Do not copy a vocabulary** out of `data/taxonomy.json` or
  `agent/observability/schema.mjs`.

Added by the reconciliation:

- **Do not resurrect the retired Scout** from `…scout-agent-implementation-wsa31u`
  (`7fcf0c5`). Its `agent/scout/{scout,retrieve,corpus,cli}.mjs` and its
  `agent/schemas/store.mjs` were deleted deliberately, not lost. The branch is kept only so
  the decision stays auditable.
- **Do not re-add `absence_kind: retrieval_failed`.** It was considered, argued for, and
  rejected: `gap_kind: retrieval_blocked` is already the one home for "retrieval was
  attempted and refused", and a fourth absence kind would be a second home for that fact and
  a fourth state for every consumer of `null` / `unknown` to learn. The reasoning is at the
  top of this file; reopen it there before changing the rule.
- **Do not write contract records to `agent/runs/`.** That path belonged to the retired
  store and is gone. The record store is `agent/records/`, via `agent/scout/store.mjs`.

Added by this session:

- **Do not let the Scout write anywhere but `agent/records/`.** The suite hashes
  `data/` around a run and scans the module for write calls; both must keep
  passing.
- **Do not turn a blocked retrieval into a candidate**, and do not retry or
  route around an egress-policy denial. It is a `DataGap`, and the proxy's own
  documentation says to report it.
- **Do not take a publication date from a URL or from prose**, and do not take a
  publisher from a hostname. Three tests hold each of these.
- **Do not mark an endpoint `endpoint_verified: true`** until something in this
  repository has actually retrieved it.
- **Do not have the Scout choose between duplicates.** It names them. Choosing
  is a change to the corpus.
- **Do not remove the `.invalid` hosts from the mock corpus** or the
  `simulated: true` flag from mock records.

---

## What must NOT be rebuilt

SESSION 00's closing statement stands unchanged: **the architecture is not
technical debt, it is the argument.** The zero-build, zero-dependency,
client-rendered model; `js/data.js` as the sole fetch point; the derivation
layer; the one-home-per-fact data model; the taxonomy as universal enum
authority; the `null` / `unknown` distinction; `js/shell.js` and
`js/evidence-view.js` as single renderers; the seven duplicated footers; and the
four validators — none of these was touched, and none should be.

The Scout was built to the same standard as the two layers under it: no
dependency, no build step, derived state never stored, vocabularies borrowed
rather than copied, and every record able to say what it cannot support. On the
day it could reach nothing at all, it said so in five records and invented
nothing — which is the only reason it is worth having.
