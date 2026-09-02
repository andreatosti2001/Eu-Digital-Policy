# HANDOVER

**Last updated:** SESSION 06 follow-up · 2 September 2026
**Branch:** `claude/source-scout-scheduled-workflow-5s645a`, restarted from `origin/main` at
`82fc692` (the reconciliation session's own final commit) — not stacked on this branch's own
earlier, now-superseded history. See "What happened to the earlier attempt" below.
**Base commit:** `82fc692` on `main`.

---

## Read this first — this branch was built twice, and the first build was retired

A session on this same designated branch (`ff84fe3`) built a Source Scout **before**
`agent/schemas/` existed on `main`. A separate reconciliation session merged five parallel
lines of work into `main` (`docs/HANDOVER.md`'s previous revision, "five parallel lines,
reconciled into one") and, in doing so, **retired that Scout and everything it wrote** —
`agent/scout/{scout,http,feed,dedupe,relevance,report,guard,cli,selftest}.mjs`,
`agent/scout/registry.json`, `agent/scout/reports/`, and
`.github/workflows/source-scout.yml` — in favour of a contract-backed Scout two other sessions
had already built and cross-validated against `agent/schemas/`.

The repository's own record of that decision (`git show ef92201`) is plain that the retired
work was not bad — "real, careful engineering: a permission-split GitHub Actions workflow…
and `guard.mjs`, which fails the run if anything outside the report directory changed" — only
that it bypassed the contract layer entirely and could not be reconciled with it. It also
recorded, explicitly, that porting that design onto the surviving Scout was **real work for a
future session, not attempted during the reconciliation.**

This session is that future session. The user asked me to confirm sessions 00–05 had actually
landed on `main` (they had — verified with `git merge-base --is-ancestor`, not assumed) and
then to redo this branch's objective against the repository as it now stands. Per
`AGENTS.md`'s "if the PR for your designated branch has already been merged, restart the
branch" instruction, the branch was reset to `origin/main` rather than built on top of its own
retired commit — the retired commit is still in `main`'s history (inside the merge at
`ef92201`), but nothing on this branch depends on it.

**Everything below is new work against the surviving Scout.** No file inside
`agent/scout/{scout,authorities,extract,dedupe,fixtures,store,cli,selftest}.mjs` or
`agent/schemas/` was touched.

---

## Current milestone

**SESSION 06, redone — schedule the Source Scout, this time against `agent/schemas/`.
Complete**, with the same honest caveat the reconciliation already recorded: every registered
endpoint is refused by this environment's egress policy, so the schedule has never yet
retrieved a real document. See §6 below and `docs/AGENT-RUNBOOK.md` §6.

The reference document is **`docs/AGENT-RUNBOOK.md`**, rewritten in full this session. This
file is the handover only.

## Work performed

Built `agent/scout/schedule/` — a wrapper around Agent 1 (`agent/scout/scout.mjs`) that adds
scheduling without modifying the agent it schedules:

1. **`digest.mjs`** — turns a completed run into a committed preview (`agent/scout/digests/`):
   a pointer/summary of each `SourceCandidate` and `DataGap`, never the full record body, on
   the same reasoning `agent/schemas/gateway.mjs` already applies to the trace. Adds two
   duplicate checks the Scout itself does not perform (against `data/sources.json` and against
   every earlier digest), explicitly labelled as report-layer annotations and never written
   back into a contract record.
2. **`guard.mjs`** — the write boundary, enforced against the actual working tree: only
   `agent/scout/digests/*.{json,md}` may change. An allowlist, and it names
   `agent/scout/scout.mjs` and `agent/schemas/` explicitly among what it refuses, so the
   scheduling layer cannot rewrite the agent it wraps.
3. **`run.mjs`** — what the workflow invokes. Runs the same `Scout` class
   `agent/scout/cli.mjs` runs, the same way (`--mock` default, `--live` explicit), and adds a
   committed digest plus GitHub Actions step outputs.
4. **`selftest.mjs`** — 18 tests, `node:test`, no network.
5. **`.github/workflows/source-scout.yml`** — rebuilt against `run.mjs` and `guard.mjs`.
   Same two-job permission split as the retired design (`discover`: `contents: read`, no write
   token, network; `propose`: `contents: write`, `pull-requests: write`, no network beyond
   GitHub) and the same reasoning for it.
6. **`docs/AGENT-RUNBOOK.md`** — rewritten in full as a live operating manual, replacing the
   "describes retired code" framing.
7. **`docs/SOURCE-SCOUT.md`** — one addendum to known limitation 6, pointing at where it is
   partially mitigated (the digest's report-layer duplicate check) without softening the
   limitation itself, which still holds inside the Scout.

## Files changed

```
agent/scout/schedule/digest.mjs      (new)
agent/scout/schedule/guard.mjs       (new)
agent/scout/schedule/run.mjs         (new)
agent/scout/schedule/selftest.mjs    (new — 18 tests)
agent/scout/schedule/README.md       (new)
agent/scout/digests/README.md        (new — the directory itself is committed on purpose)
.github/workflows/source-scout.yml   (new)
docs/AGENT-RUNBOOK.md                (rewritten in full)
docs/SOURCE-SCOUT.md                 (one addendum, known limitation 6)
docs/HANDOVER.md                     (rewritten for this session)
```

**Not touched:** `agent/scout/{scout,authorities,extract,dedupe,fixtures,store,cli,selftest}.mjs`,
every file under `agent/schemas/`, every file under `agent/observability/`, and no
`data/*.json`. Confirmed by `git status --porcelain` and, structurally, by
`agent/scout/schedule/guard.mjs` refusing every one of those paths by name in its own test
suite.

## Architecture decisions

1. **A wrapper, never a modification.** The reconciliation's own diagnosis of the retired
   Scout was that it "cannot be reconciled with [the contracts] without being substantially
   rewritten." A wrapper that imports the Scout's own classes and functions rather than
   reimplementing anything cannot have that problem — deleting `agent/scout/schedule/` entirely
   would leave Agent 1 exactly as this session found it.
2. **A digest is a pointer, not a second home for the record.** Directly copying
   `gateway.mjs`'s own justification for why the trace carries only an id and a hash: "Copying
   the body into the trace would make the trace a second home for every fact the record
   carries." The digest carries id, url, title, confidence and the other fields a human needs
   to triage — never `epistemic` or `evidence`. A test (`selftest.mjs`, "pointer, not the
   record") asserts this directly.
3. **Two duplicate checks live at the report layer, not inside the Scout.** Cross-referencing
   `data/sources.json` and prior digests is genuinely useful and was an explicit requirement of
   this session's original brief, but it is not something SESSION 05 built into the contract
   (`docs/SOURCE-SCOUT.md` limitation 6), and extending `SourceCandidate` or `scout.mjs` was out
   of this session's scope and risked exactly the kind of unreviewed contract change
   `docs/AUTONOMY-POLICY.md` Class C reserves for a human decision. So the check is read-only,
   built fresh in `digest.mjs` (reusing `normaliseUrl`/`normaliseTitle` from the Scout's own
   `dedupe.mjs` rather than reimplementing them), and never written back into a
   `SourceCandidate`. `matches_existing_source_id` stays `null`, exactly as the limitation
   describes. This is flagged as a judgement call, not a settled design — see "Anything the
   next agent must know."
4. **The guard is an allowlist that names the Scout's own files.** Not just "everything outside
   `agent/scout/digests/`" — the guard's `NAMED` table and its test suite explicitly call out
   `agent/scout/scout.mjs` and `agent/schemas/` by name, so a future reader of a failed guard
   run sees "the Source Scout core" or "no agent may bypass these contracts" rather than a bare
   path.
5. **`--live` is the schedule's default mode**, `--mock` opt-in via `workflow_dispatch`,
   inverting `agent/scout/cli.mjs`'s own default (which stays `--mock`, unchanged). The CLI's
   default protects an interactive session from an accidental live run; a *scheduled* workflow
   whose entire purpose is periodic live discovery is the "asked for it in as many words" case
   `docs/SOURCE-SCOUT.md` describes.
6. **`degraded` exits 0 by default**, same reasoning as the retired design and restated because
   it is currently the expected outcome of every run: every registered endpoint is refused by
   egress policy (§6), and that must not redden the schedule every week until it is disabled.
7. **The two-job permission split and the double guard check are carried over unchanged.** The
   reconciliation's own commit message called this "real, careful engineering" worth reusing;
   it needed no rework, only repointing at the new write boundary and the new run entry point.

## Tests

Run in this session, from the repository root, on the branch restarted from `82fc692`:

| Command | Result |
|---|---|
| `node --test agent/scout/schedule/selftest.mjs` | **18 pass · 0 fail** (new) |
| `node --test agent/schemas/selftest.mjs` | 67 pass · 0 fail — unchanged, confirms the contracts were not touched |
| `node --test agent/scout/selftest.mjs` | 30 pass · 0 fail — unchanged, confirms Agent 1 was not touched |
| `node --test agent/observability/selftest.mjs` | 13 pass · 0 fail — unchanged |
| `node agent/schemas/cli.mjs check` | 14/14 satisfiable, exit 0 |
| `node tools/validate.mjs` | 0 errors — matches the §12 baseline |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12 |
| `node tools/freshness.mjs` | reports only, exit 0 |

**128 tests total across the four suites, all passing.** No new `design-qa` warning.

**The guard was verified in both directions, on the real working tree:**
- a real mock run (`node agent/scout/schedule/run.mjs`) wrote exactly two files under
  `agent/scout/digests/`, and the guard reported `ok`;
- with a stray byte appended to `data/sources.json`, the guard exited 1 and named it "a
  canonical dataset — RED tier, docs/AI-SAFE-BOUNDARIES.md §3" alongside every other legitimate
  but not-yet-committed change on the branch, proving it does not special-case its own output.

**A live run was also exercised** (`node agent/scout/schedule/run.mjs --live --dry
--max-docs=1`): five gaps, all `blocked_by_egress_policy: true`, identical in substance to what
`docs/SOURCE-SCOUT.md` "FINDING" already recorded before this session. Nothing new was learned
about network reachability; the wrapper reproduces the Scout's own documented behaviour
faithfully.

**Test digests from these runs were deliberately not committed** — they are fixture-corpus and
sandbox-live output, not real proposals, and committing them would seed
`agent/scout/digests/`'s cross-run memory with nothing.

**The workflow itself has never executed on GitHub Actions.** Verified statically only: the
YAML parses, every `run:` block passes `bash -n`, job permissions and the concurrency block
were asserted by parsing the file.

## Observability

Every scheduled run emits through the same path a manual `agent/scout/cli.mjs --live` run
does — `agent/scout/schedule/run.mjs` constructs the same `Scout`, `Tracer` and `RecordStore`
classes and adds no second logging path. `agent/observability/cli.mjs show <trace-id>` renders
a scheduled run exactly as it would a manual one.

## Known limitations

1. **The workflow has never run on GitHub Actions.** Everything about it is verified
   statically, same caveat the retired design carried and for the same reason: this session had
   no means to dispatch it.
2. **Every registered endpoint is still refused by this environment's egress policy.** Nothing
   about that changed this session; it is inherited from `docs/SOURCE-SCOUT.md`, unmodified.
3. **The report-layer duplicate check (decision 3 above) is new and unexercised against a real
   corpus of prior digests** — the test suite covers it with synthetic fixtures, but no real
   scheduled run has yet produced two digests to cross-reference.
4. **Digests will accumulate with no retention policy**, the same limitation the retired
   design's reports carried, now stated up front rather than discovered later.
5. **Whether the report-layer duplicate check belongs at this layer at all, versus as a
   proper extension to `SourceCandidate` and `scout.mjs`, is a judgement call this session made
   under scope pressure, not a settled architectural decision.** See "Anything the next agent
   must know."
6. Every limitation `docs/SOURCE-SCOUT.md` already states about Agent 1 itself (link-following
   one level deep, relevance as string matching, no `source_type` classification, no
   `robots.txt` handling) is unchanged and out of this session's scope.

## Unresolved issues, carried forward unchanged

From the reconciliation's own handover, none touched by this session:

1. `data/brief.json` is canonical but never consumed; `index.html`'s inline
   `window.__CONTENT__` blob has already drifted from it.
2. No deploy gate — a push to `main` publishes; the validators do not run in CI. **This
   session's workflow does not address this**; it schedules Agent 1, not a validator gate.
3. `docs/AGENT-ROLES.md` and `docs/AGENT-CONTRACTS.md` describe overlapping ground at different
   altitudes, uncross-checked.
4. The five operating-policy documents have not been cross-checked against `agent/schemas/`.
5. 106 records carry an unverified or requires-verification note.
6. `agent/records/` and `agent/observability/runs/` remain per-developer, no retention policy,
   concurrent writers untested.

## Next session

**Two candidate objectives, unchanged in substance from what the reconciliation already
recommended, now that scheduling exists to make the first one automatic:**

**A — dispatch the workflow manually with `mode: mock` first**, to confirm it runs cleanly on
a real GitHub-hosted runner (this session could not test that), then with `mode: live` and
`dry_run: true`, and read what it reports about the five endpoints from a real runner's network
position — which may differ from this development environment's. This is the single
highest-leverage next step: everything downstream (verification, the 106 unverified records)
is still blocked on a real retrieval ever succeeding.

**B — decide whether the report-layer duplicate check (decision 3) should move into
`SourceCandidate` and `scout.mjs` itself.** If a future session wants the Scout's own
`matches_existing_source_id` populated, that is a deliberate, reviewed change to a contract
Class C requires — not something to retrofit into the wrapper.

### Exact next objective

Dispatch **Source Scout** manually with `mode: mock`, `dry_run: true` first (to prove the
workflow's own mechanics on a real runner without touching any endpoint or committing
anything), then decide with the repository owner whether to proceed to a live dispatch.

## Anything the next agent must know

- **This branch was restarted from `main`, not built on its own earlier commit.** If a session
  after this one finds itself confused about `ff84fe3` or `9d5308e` in the log, `git log
  --graph` — they are real history, already reconciled, and not this session's starting point.
- **`agent/scout/schedule/` never touches `agent/scout/scout.mjs` or `agent/schemas/`.** If a
  task seems to require changing either from inside this wrapper, stop — that is a different,
  larger change with its own review path, not a scheduling change.
- **The report-layer duplicate check is a judgement call, flagged as one** (known limitation
  5). It was the most defensible design available without touching the contracts, not
  necessarily the only one. A future session revisiting it should read
  `agent/scout/schedule/digest.mjs`'s own opening comment before changing it.
- **Every registered endpoint being refused is the expected state, not a bug to fix from
  inside this repository.** It is a property of the environment the Scout runs in.
- Before declaring anything done: `node --test agent/scout/schedule/selftest.mjs`,
  `node --test agent/schemas/selftest.mjs`, `node --test agent/scout/selftest.mjs`,
  `node --test agent/observability/selftest.mjs`, and the four validators in `tools/`.

## Anything the next agent must NOT change

Carried forward from the reconciliation, unchanged and still binding:

- Do not rebuild the site. No framework, no bundler, no build step, no dependency, no service
  worker, no server-side rendering.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative.
- Do not modify `data/*.json` in a session not scoped for data work.
- Do not touch the footer's non-affiliation or no-legal-advice text, `TIER_GRADE` in
  `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in `tools/_footer.mjs`.
- Do not declare a licence. Do not soften the README's known limitations or the
  unverified-record count. Do not re-run `tools/_refsweep.mjs` or `tools/_review10.mjs`.
- Do not change the id shapes in `agent/observability/ids.mjs`; do not move redaction to the
  read path.
- Do not commit anything under `agent/records/` or `agent/observability/runs/`.
- Do not add a validation bypass to `agent/schemas/validate.mjs`. No `skip`, no `force`, no
  `strict: false`.
- Do not add a field for a substitute value to `DataGap` or anywhere else.
- Do not resurrect the retired Scouts from their old branches.
- Do not start a new session's branch from anything other than the current tip of `main`.

Added by this session:

- **Do not let `agent/scout/schedule/` write to anything but `agent/scout/digests/*.{json,md}`.**
  Extending its allowlist without extending `guard.mjs`'s own test suite in the same commit is
  the failure mode to watch for.
- **Do not write a report-layer annotation back into a `SourceCandidate` or `DataGap`.** If
  that check is ever promoted into the contract, it is a Class C change to `agent/schemas/` and
  `agent/scout/scout.mjs`, made deliberately, with its own tests — not a quiet addition from the
  wrapper.
- **Do not treat a digest's `relevance_band` as a legal or editorial judgement.** It is the
  Scout's own `confidence` number against a stated threshold, nothing more.
- **Do not gitignore `agent/scout/digests/`.** It is the only memory this scheduling layer has
  between runs.

---

## What must NOT be rebuilt

Unchanged since SESSION 00 and every session since: **the architecture is not technical debt,
it is the argument.** Nothing in `js/`, `css/`, `data/`, `i18n/`, `tools/`, the seven pages,
`agent/observability/`, `agent/schemas/`, or Agent 1's own files was touched by this session.

The scheduling layer was built to the same standard as everything it wraps: no dependency, no
build step, derived state never stored twice, `null` and `unknown` kept apart, and every
record — including a digest describing a run in which every retrieval failed — able to say
exactly what it cannot support.
