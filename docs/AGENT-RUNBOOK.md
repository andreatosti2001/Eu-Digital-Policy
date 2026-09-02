# AGENT RUNBOOK

**Status:** rewritten in the SESSION 06 follow-up (2 September 2026) to describe the system
that actually runs today. The version before this one documented a Scout implementation that
had been retired during the SESSION 00–06 reconciliation, kept only as design reference. That
design — the scheduling model, the permission-split GitHub Actions jobs, the write-boundary
guard — has now been ported onto the contract-backed Scout that replaced it. This document
describes real, running code.

**Read with:** `docs/SOURCE-SCOUT.md` (the agent this schedules), `docs/AGENT-CONTRACTS.md`
(the contracts it emits through), `docs/AI-SAFE-BOUNDARIES.md` (what an agent may do) and
`docs/OBSERVABILITY.md` (how a run is recorded).

---

## 1. What is scheduled

**Agent 1, the Source Scout** (`agent/scout/scout.mjs`) — read-only, contract-backed, unchanged
by this document. It finds documents that bear on the instruments this repository tracks and
emits `SourceCandidate` and `DataGap` records through `agent/schemas/gateway.mjs`. Full detail:
`docs/SOURCE-SCOUT.md`.

**This document is about the layer around it**, `agent/scout/schedule/`, which:

```
DISCOVER  →  OBSERVE  →  REPORT  →  PR
```

and never

```
DISCOVER  →  DIRECT PRODUCTION EDIT
```

**The scheduling layer never modifies the Scout it wraps.** `agent/scout/schedule/guard.mjs`
fails the run if any path outside `agent/scout/digests/*.{json,md}` changes — including
`agent/scout/scout.mjs` itself, `agent/schemas/`, and `data/*.json`. This is the same
discipline `agent/scout/selftest.mjs` already applies to the Scout's relationship with
`data/` (hash the directory, don't trust the code), aimed one layer further out.

### Why a wrapper, not a change to the Scout

The reconciliation that preceded this (`docs/HANDOVER.md`, "Read this first — five parallel
lines, reconciled into one") retired a Scout for the same reason a second one nearly
duplicated the first: **it could not be reconciled without a rewrite.** A wrapper that never
touches `agent/scout/*.mjs` or `agent/schemas/` cannot have that problem — a future session can
delete `agent/scout/schedule/` entirely without touching the agent itself.

---

## 2. What the scheduling layer adds

Three things the Scout itself does not do, none of them changing what the Scout asserts:

1. **A committed digest** (`agent/scout/schedule/digest.mjs`) — a human/machine preview of a
   run, written to `agent/scout/digests/`. It is a **pointer summary, not the record**: the
   same rule `agent/schemas/gateway.mjs` applies to the trace ("copying the body into the trace
   would make the trace a second home for every fact the record carries") applies here one
   level up. The full `SourceCandidate` / `DataGap` bodies live only in
   `agent/records/<trace_id>.jsonl` — regenerable, git-ignored, attached to the run's workflow
   artifact.

2. **Two duplicate checks the Scout itself does not perform**, both read-only and both
   explicitly labelled as report-layer annotations rather than Scout findings — the Scout's own
   `matches_existing_source_id` field stays `null`, exactly as `docs/SOURCE-SCOUT.md` known
   limitation 6 describes:
   - against `data/sources.json` — is the bibliography already aware of this document?
   - against every earlier committed digest — was this exact candidate already proposed?

   Matching is CELEX, then normalised URL, then normalised title (weak), using
   `normaliseUrl`/`normaliseTitle` **imported from the Scout's own `dedupe.mjs`**, not
   reimplemented.

3. **Scheduling, concurrency control, and a pull request** — the subject of the rest of this
   document.

---

## 3. Schedule and manual operation

**Scheduled:** `17 6 * * 1` — 06:17 UTC every Monday, off the hour deliberately. Pinned to
`andreatosti2001/Eu-Digital-Policy`, so a fork does not poll public regulators weekly on the
author's behalf.

**Manual:** Actions → *Source Scout* → *Run workflow*.

| Input | Default | What it does |
|---|---|---|
| `mode` | `live` | `live` = the five registered endpoints (`agent/scout/authorities.mjs`). `mock` = the fixture corpus, to test the workflow itself without touching the network. |
| `dry_run` | `false` | Runs everything; writes no digest and opens no pull request. |
| `open_pr` | `auto` | `auto` opens a PR only when there is a candidate new against the bibliography or against an earlier digest. `always` / `never` override this. |
| `fail_on` | `ok` | `ok` = only a thrown run reddens the job. `degraded` = any failed retrieval reddens it — today, that is **every** live run, because every registered endpoint is refused by this environment's egress policy (§6). |
| `max_docs` | `4` | Documents followed per endpoint, passed straight to the Scout's own `--max-docs=`. |

**Concurrency:** group `source-scout`, `cancel-in-progress: false`. One run at a time; a queued
run waits rather than killing a live one, because a half-cancelled run leaves a partial digest.

### Why `degraded` exits 0 by default

Every registered endpoint is currently refused before it reaches the origin (§6). That is a
fact about this environment's network, reported honestly on every run, and it must not turn
the schedule red every week until someone disables the workflow to silence it. It also must not
vanish: it lands in the digest, in a `::warning` annotation, and in the pull request body.
Escalating it to red is `fail_on: degraded`, an operator's explicit choice — the moment a real
GitHub-hosted runner reaches even one endpoint, this stops being the steady state and is worth
re-examining.

### Exit codes (`agent/scout/schedule/run.mjs`)

| Code | Meaning |
|---|---|
| 0 | A digest was produced — including a degraded one |
| 1 | The Scout threw before producing one |
| 2 | `--fail-on degraded` was set and the run was degraded |

---

## 4. The two-job permission split

```
discover   contents: read, no write token, persist-credentials: false
             ↓ (upload-artifact: digest, records, trace)
propose    contents: write, pull-requests: write, no network beyond github.com
```

The credential and the untrusted input are never in the same job. A Scout subverted by a
hostile response from a compromised endpoint is running in a job that holds nothing it could
use to act on that. `agent/scout/schedule/guard.mjs` runs in **both** jobs — once against the
live working tree in `discover`, once against a downloaded artifact in `propose` — because an
artifact is attacker-influenced input to the job that holds the token, so checking only in the
job that does not hold it would not be checking.

**Artifact storage.** Every run uploads four artifacts, on success *and on failure* — a failed
run's records and trace are the only evidence of why it failed:

| Artifact | Contents | Committed? |
|---|---|---|
| `source-scout-digest` | `agent/scout/digests/*.json` | Yes, by the `propose` job |
| `source-scout-digest-summary` | `agent/scout/digests/*.md` | Yes, by the `propose` job |
| `source-scout-records` | `agent/records/*.jsonl` — the full contract records | No — git-ignored by design |
| `source-scout-trace` | `agent/observability/runs/*.jsonl` | No — git-ignored by design |

---

## 5. Reading a digest

Two files per run in `agent/scout/digests/`: `<digest_id>.json` (machine-readable) and
`<digest_id>.md` (human-readable, and the pull request body). Five sections are always
present, written even when empty:

| Section | What it is | What to do |
|---|---|---|
| **High-relevance candidates** | The Scout's own `confidence` ≥ 0.75 (`docs/SOURCE-SCOUT.md` "Confidence") | Read first. Not a legal judgement — a reading-order signal against the Scout's own stated formula. |
| **New sources** | Not matched against the bibliography or an earlier digest | Skim; anything worth having, open — see §7. |
| **Duplicate sources** | Three signals, each named: `within-run` (Scout-asserted), `bibliography`, `prior-digest` (both report-layer only) | A `title`-only match is weak — glance at it. |
| **Failed retrievals** | Every `DataGap` this run produced | One week is unsurprising given §6. Watch for a `blocked_by_egress_policy: false` row — that is a *different* kind of failure and worth investigating. |
| **Unresolved retrieval problems** | What `DataGap.closes_with` says would close each gap | Never a substitute for the document — `AI-SAFE-BOUNDARIES.md` §0.2. |

---

## 6. Network reality

At the time this was written, every one of the five registered endpoints
(`eur-lex.europa.eu`, `digital-strategy.ec.europa.eu`, `www.edpb.europa.eu`,
`www.edps.europa.eu`, `www.enisa.europa.eu`) is refused with HTTP 403 on `CONNECT` at this
environment's egress proxy — `docs/SOURCE-SCOUT.md` "FINDING". A scheduled run today is
expected to produce `0` candidates and `5` gaps, all `blocked_by_egress_policy: true`. **That
is not a broken Scout or a broken workflow; it is the honest current state of this
environment's network**, and the digest says so on every run rather than going quiet about it.

A GitHub-hosted runner may have different network reach than the environment this was built
in. The first run that reaches even one real endpoint is worth reading closely — nothing in
this repository has yet seen what any of these sites currently publish.

---

## 7. Promoting a candidate to a source record

**Merging the Scout's pull request records what the Scout saw. It accepts nothing.**

1. **Open the URL and read the document.** Not the digest preview — the document. If you
   cannot reach it, stop (`AI-SAFE-BOUNDARIES.md` §0.1).
2. **Confirm it says what you are about to claim it says.**
3. **Write the `sources.json` record by hand**, on a branch, in a session scoped for data
   work — Class C under `docs/AUTONOMY-POLICY.md`: prepared, validated, and put to a human,
   never committed by an agent on its own authority.
4. Run the four validators in `tools/` and compare against the §12 baseline.

The digest's `authority_class` and `tier_estimate` are the Scout's own *inference*, already
typed as such in the contract. They are not a citable fact about the document and must not be
copied into a record unread.

---

## 8. When something goes wrong

**Every retrieval failed with `blocked_by_egress_policy: true`.** Expected — see §6.

**A retrieval failed with `blocked_by_egress_policy: false`.** A real problem: the origin
itself refused, moved, or timed out. Open the URL by hand and check
`agent/scout/authorities.mjs` for whether the endpoint moved.

**The guard failed.** The run wrote outside `agent/scout/digests/`. Nothing was committed.
This is either a defect in `agent/scout/schedule/run.mjs` or a sign the Scout it wraps changed
underneath it — investigate before re-running. **Never widen the allowlist to make it pass.**

**The run threw.** No digest was written; the job summary carries the message, and the
`source-scout-records` / `source-scout-trace` artifacts carry the run up to the throw.

### Watching a run

```
node agent/observability/cli.mjs list
node agent/observability/cli.mjs show <trace-id>
node agent/schemas/cli.mjs check
```

Every scheduled run emits the same instrumentation as a manual `agent/scout/cli.mjs --live`
run — this wrapper adds no second logging path.

---

## 9. Maintaining the endpoint registry

`agent/scout/authorities.mjs`. **This document does not own that file** — it belongs to Agent
1, and changing it is changing what the Scout searches, not how it is scheduled. See
`docs/SOURCE-SCOUT.md` "The priority hierarchy" and known limitation 2 (the registry is five
unverified root URLs).

---

## 10. What must not change

- **The scheduling layer must never gain write access to `agent/scout/*.mjs`,
  `agent/schemas/`, or `data/*.json`**, directly or through a widened guard allowlist. The
  guard's test suite (`agent/scout/schedule/selftest.mjs`) asserts each of these paths is
  refused by name — extending the allowlist without extending that test is the failure mode to
  watch for.
- **The two-job permission split must stay split.**
- **`cancel-in-progress` stays `false`.**
- **The five digest sections stay mandatory**, written when empty.
- **`agent/scout/digests/` stays committed.** It is the only memory this layer has between
  runs; git-ignoring it makes every run propose everything again.
- **Report-layer duplicate annotations are never written back into a `SourceCandidate`.** If a
  future session decides the Scout itself should compare against `data/sources.json`
  (`docs/SOURCE-SCOUT.md` known limitation 6), that is a change to `agent/scout/scout.mjs` and
  its contract, made deliberately — not something this wrapper should do by accident.
