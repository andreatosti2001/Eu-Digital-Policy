# AGENT RUNBOOK

**Status:** written in SESSION 06. Operating manual for the scheduled agents in this repository.
**Read with:** `docs/AI-SAFE-BOUNDARIES.md` (what an agent may do) and `docs/OBSERVABILITY.md`
(how a run is recorded).

Currently one agent is scheduled: the **Source Scout**.

---

## 1. What the Source Scout is

A read-only discovery agent. Once a week it reads public feeds published by EU institutions,
records exactly what it retrieved, works out which documents this repository has not already
seen, ranks them for reading order, and opens a pull request containing a report.

**It proposes. It never decides, and it never edits.**

```
DISCOVER  →  OBSERVE  →  REPORT  →  PR
```

and never

```
DISCOVER  →  DIRECT PRODUCTION EDIT
```

The distinction is not stylistic. `docs/AI-SAFE-BOUNDARIES.md` §3 puts "creating a
`sources.json` record from anything other than a document actually retrieved and read" in the
RED tier — human control only. The Scout retrieves a *listing*; it does not read the document
behind it. Nothing it produces may enter `data/sources.json` until a person has opened the URL.

### Why the workflow has two jobs

`.github/workflows/source-scout.yml` splits the work along a permission boundary:

| Job | Permission | Touches |
|---|---|---|
| `discover` | `contents: read` — **no write token at all** | the open internet |
| `propose` | `contents: write`, `pull-requests: write` | GitHub only |

The credential and the untrusted input are never in the same job. A Scout subverted by a
malicious feed is running in a job that holds nothing it could use, and `discover` checks out
with `persist-credentials: false` so there is no token in `.git/config` either.

Both jobs run `agent/scout/guard.mjs`, which fails if any path outside `agent/scout/reports/`
changed. It runs twice on purpose: an artifact is attacker-influenced input to the job that
*does* hold the token, so checking only in the job that does not would not be checking.

---

## 2. Schedule and manual operation

**Scheduled:** `17 6 * * 1` — 06:17 UTC every Monday. Off the hour deliberately: a job on the
hour queues behind everyone else's. Scheduled runs are pinned to
`andreatosti2001/Eu-Digital-Policy`, so a fork does not poll public regulators' servers weekly
on the author's behalf.

**Manual:** Actions → *Source Scout* → *Run workflow*.

| Input | Default | What it does |
|---|---|---|
| `dry_run` | `false` | Runs everything; writes no report and opens no pull request. Use this after changing the watchlist. |
| `open_pr` | `auto` | `auto` opens a pull request only when there is something for a human to do — a new candidate, or an unresolved problem. `always` opens one regardless. `never` leaves the artifacts only. |
| `fail_on` | `failed` | `failed` = red only when the run produced nothing usable. `degraded` = red when any feed is dead. `never` = never red. |
| `limit` | `60` | Maximum candidates carried per watchlist entry. |
| `timeout_ms` | `20000` | Per-request timeout. |

**Concurrency:** the group is `source-scout` with `cancel-in-progress: false`. One Scout at a
time; a queued run waits rather than killing a live one, because a half-cancelled run leaves a
partial report and the report is the deliverable.

### Why `degraded` exits 0 by default

A dead feed must not turn the schedule red every week until someone disables the workflow to
stop the noise. It must not vanish either — so it lands in the report, in the job summary as a
`::warning`, and in the pull request. Escalating it to a failure is a policy an operator sets
with `fail_on: degraded`, not a default that trains people to ignore a red run.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | A report was produced — including a degraded one |
| 1 | Nothing usable: every retrieval failed, or the Scout threw |
| 2 | `--fail-on degraded` was set and the run was degraded |

---

## 3. Reading a report

Every run writes two files to `agent/scout/reports/`:

- `scout-<instant>.json` — machine-readable. The next run reads it, which is how a candidate
  proposed last week is recognised rather than re-proposed as new. **This is why reports are
  committed**: they are the cross-run duplicate-detection memory.
- `scout-<instant>.md` — the human summary, and the body of the pull request.

Both are also uploaded as workflow artifacts (`source-scout-report`), as is the observability
trace (`source-scout-trace`), on success **and on failure** — a failed run's trace is the only
evidence of why it failed. Retention 90 days.

The summary always carries five sections, **written even when empty**. A section that
disappears when its count is zero teaches a reader to skim, and then the week it reappears it
is missed.

| Section | What it is | What to do |
|---|---|---|
| **High-relevance candidates** | Band `high`: an exact instrument identifier, or several independent signals | Read these first. The matched terms are printed so you can audit the band. |
| **New sources** | Everything not already known, in reading order | Skim. Anything worth having, open — see §4. |
| **Duplicate sources** | Suppressed as already known, with the key that matched | Glance at any matched on `title` — that key is weak and two documents may honestly share a title. |
| **Failed retrievals** | An endpoint that could not be read this run | One week is noise. The same entry three weeks running is a dead feed — see §5. |
| **Unresolved retrieval problems** | Resolved but produced nothing usable: a feed that changed shape, a truncated body, a content type that did not match | These need an operator, not a re-run. |

### What a relevance band is not

It is reading order. It is **not** evidence, and it is not a legal judgement. Band `high` means
the title or summary contained the string; it does not mean the document is about the
instrument, that it is authoritative, or that it supports anything. The vocabulary is derived
from `data/instruments.json` at run time — add an instrument to the dataset and the Scout
starts watching for it.

Band `unknown` with a `null` score means the publisher supplied neither title nor summary, so
relevance **could not be assessed**. It is counted separately and never folded into `none`:
unknown is not zero, here as everywhere else in this repository.

---

## 4. Promoting a candidate to a source record

This is the step the whole design exists to keep manual. **Merging the Scout's pull request
records what the Scout saw. It accepts nothing.**

1. **Open the URL and read the document.** Not the feed entry — the document. If you cannot
   reach it, stop: `docs/AI-SAFE-BOUNDARIES.md` §0.1.
2. **Confirm it says what you are about to claim it says.** A loosely related substitute is
   worse than an admitted gap because it looks resolved (§0.2).
3. **Write the `sources.json` record by hand**, on a branch, in a session scoped for data work:
   `tier` and `type` from `data/taxonomy.json`; `published` and `accessed` as you actually
   found them; `url_status` per that dataset's `$note`; `publisher` **null if not researched**,
   never invented.
4. **Run the four validators** and compare against the baseline in
   `docs/CURRENT-ARCHITECTURE.md` §12.

The Scout's `expected_tier` and `expected_type` fields are the operator's prior about a
*publisher*. They are not a claim about the individual document and must not be copied into a
record unread.

---

## 5. When something goes wrong

**Every retrieval failed (status `failed`, exit 1).** Usually the runner's network or a
watchlist gone stale. Check whether the URLs resolve from a browser. If a single publisher
moved, fix that entry in `agent/scout/registry.json`; if all six failed at once, suspect the
runner, and re-run before editing anything.

**One entry fails every week.** The feed moved or was withdrawn. Fix the URL or set
`"enabled": false` with a note saying why and when. Do not delete the entry — a silently
shorter watchlist is a coverage loss nobody can see.

**`content-type-mismatch`.** The server returned HTML where the watchlist expected a feed.
Often a consent interstitial or an error page served with a 200. Open the URL and look.

**A feed returns entries but the report shows none.** A shape change. `agent/scout/feed.mjs`
handles RSS 2.0 and Atom; anything else needs the parser extended, with a test in the same
commit.

**The guard failed.** The Scout wrote outside `agent/scout/reports/`. Nothing was committed.
This is either a defect or an instruction the Scout should have refused — investigate before
re-running. Do not widen the allowlist to make it pass.

**The run threw.** No report was written; the job summary carries the message and the trace
artifact carries the run up to the throw. `node agent/observability/cli.mjs show <trace-id>`.

### Watching a run

```
node agent/observability/cli.mjs list           # every run
node agent/observability/cli.mjs show <trace>   # the execution tree
node agent/observability/cli.mjs validate       # the store is well-formed
node agent/observability/cli.mjs serve          # the viewer, on loopback
```

The Scout emits one orchestrator span, one agent span, a tool span per retrieval, and
`observation` / `decision` / `artifact` / `provenance` / `handoff` / `approval` records. Every
run leaves a **pending approval** addressed to the maintainer — that is the correct steady
state, not a bug. A Scout that granted its own approval would not be a Scout.

---

## 6. Maintaining the watchlist

`agent/scout/registry.json`. It is **agent configuration, not a dataset**: nothing in it is a
source record and nothing in it is cited by the site.

Every entry carries `url_status: "url:unchecked"` and **keeps it**. The Scout does not rewrite
its own registry from a run: a live endpoint today is not a fact about the endpoint tomorrow,
and a config file that edits itself becomes a second home for a fact the report already holds.
Which entries actually resolved is recorded per run, in that run's report.

Adding an entry: give it an `id`, a `publisher_name`, a `kind` (`feed` or `page`), the `url`,
and a `note` saying where the URL came from and whether it was confirmed. Set `publisher` to
an id that already exists in `data/sources.json`, or to `null` — **never mint one**. Then run
`node agent/scout/cli.mjs run --dry-run` and read the failed-retrievals section before
committing.

> **The watchlist shipped unverified.** It was authored in an environment with no outbound
> access to `europa.eu`, so not one of the six URLs was confirmed to resolve. Each entry says
> so in its own `note`, and `watch-eurlex-oj-l-digital` is expected to fail until an operator
> regenerates the feed from EUR-Lex — those feed ids are session-scoped. **The first
> successful scheduled run is what establishes which entries work.** Treat a wholesale failure
> on the first run as the expected outcome, not as a broken Scout.

---

## 7. What must not change

- **The Scout must never gain write access to `data/*.json`**, directly or through a widened
  guard allowlist. If a future agent is to write data, it is a different agent with a
  different review path, not a relaxed Scout.
- **The two-job split must stay split.** Merging `discover` and `propose` to save a minute of
  runner time puts the write token in the job that parses untrusted input.
- **`cancel-in-progress` stays `false`.** A cancelled run leaves a partial report.
- **The five report sections stay mandatory**, written when empty.
- **Nothing the Scout emits is ever marked `simulated`.** That flag belongs to the
  observability demonstrator alone.
- **The reports directory stays committed.** It is the duplicate-detection memory; gitignoring
  it makes every run propose everything again.
