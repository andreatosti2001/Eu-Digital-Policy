# HANDOVER

**Last updated:** SESSION 06 · 1 September 2026
**Branch:** `claude/source-scout-scheduled-workflow-5s645a`
**Base commit:** `4bd1f0d` on `main` ("Merge pull request #1: Add the agent observability
foundation")

---

## ⚠ Discrepancy found at the start of this session — read this first

**The session brief and the repository disagreed, and the repository was right.**

SESSION 06's brief was *"Extend the Source Scout into a controlled scheduled workflow"*. It
presupposes a Source Scout. **There was none.** Verified, not assumed:

```
git log --all --oneline --grep='[Ss]cout'      → only 63a22ac (the observability layer)
git log --all --diff-filter=A --name-only      → no file named scout anywhere in history
find agent -type f                             → agent/observability/ only
find .github -type f                           → no .github directory at all
```

`docs/HANDOVER.md` agreed with the code, not with the brief: it recorded SESSION 02 as the last
completed milestone and named **"SESSION 03 — instrument one real read-only agent against the
now-published contract"** as the next objective, with the Scout as that agent. Sessions 03, 04
and 05 never happened. The branch was level with `main`.

**What this session did about it.** Reported it here rather than reconciling it silently
(`AGENTS.md`, and `docs/AI-SAFE-BOUNDARIES.md` §6), and then delivered the SESSION 06 brief in
full — which required building the Scout that SESSION 03 was to have built, because a schedule
around a non-existent agent is not a deliverable. So this session is **SESSION 03 and SESSION
06 together**, and it was scoped by SESSION 03's constraints as the handover stated them:
read-only, real sources, instrumented through `agent/observability/tracer.mjs`, no Verifier, no
Change Detector, and nothing writing to `data/*.json`.

**Nothing was assumed about sessions 04 and 05.** If they were meant to exist, their objectives
are still unmet and are not recorded anywhere in this repository.

---

## Current milestone

**SESSION 06 — Schedule the Source Scout. Complete**, with one honest caveat carried in §
*Known limitations* 1: the watchlist shipped **unverified**, because the authoring environment
had no outbound access to `europa.eu`.

The reference document is **`docs/AGENT-RUNBOOK.md`**. This file is the handover only.

## Work performed

1. **Built the Source Scout** (`agent/scout/`) — the read-only discovery agent SESSION 03 was
   to have built. Zero dependencies, no build step, instrumented through the existing tracer.
2. **Scheduled it** (`.github/workflows/source-scout.yml`) — cron, manual dispatch with five
   inputs, concurrency protection, artifact storage, and failure reporting through job
   summaries and annotations.
3. **Enforced the operating mode structurally** (`agent/scout/guard.mjs`) rather than
   promising it in a comment.
4. **Documented operation** (`docs/AGENT-RUNBOOK.md`), as the brief required.

**This is the repository's first CI of any kind.** It does not gate deploys and does not run
the four validators — see *Unresolved issues* 3.

## Files changed

All new and additive. **No file the website ships was modified**, and no `data/*.json` was
touched. Confirmed by `git status --porcelain` and by `agent/scout/guard.mjs`.

```
.github/workflows/source-scout.yml     (new — the first workflow in this repository)
docs/AGENT-RUNBOOK.md                  (new)
docs/HANDOVER.md                       (rewritten for this session)
agent/scout/README.md                  (new)
agent/scout/registry.json              (new — the watchlist)
agent/scout/http.mjs                   (new)
agent/scout/feed.mjs                   (new)
agent/scout/dedupe.mjs                 (new)
agent/scout/relevance.mjs              (new)
agent/scout/report.mjs                 (new)
agent/scout/scout.mjs                  (new)
agent/scout/cli.mjs                    (new)
agent/scout/guard.mjs                  (new)
agent/scout/selftest.mjs               (new — 41 tests)
agent/scout/reports/README.md          (new — the directory is committed on purpose)
```

## Architecture decisions

1. **The workflow is two jobs, split on a permission boundary, and that is the design.**
   `discover` touches the open internet holding `contents: read` and **no write token at all**,
   checked out with `persist-credentials: false`. `propose` holds `contents: write` and
   `pull-requests: write` and makes no request beyond github.com. The credential and the
   untrusted input are never in the same job. Merging them to save runner time would put a
   write token in the job that parses whatever a feed returns.
2. **The path guard is an allowlist, and it runs twice.** Once in `discover`, once in
   `propose` — an artifact is attacker-influenced input to the job that *does* hold the token,
   so checking only in the job that does not would not be checking. It is an allowlist rather
   than a denylist because a denylist protects what someone remembered to name.
3. **`degraded` exits 0 by default.** A dead feed must not turn the schedule red every week
   until someone disables the workflow to stop the noise — but it must not vanish either, so it
   lands in the report, in a `::warning`, and in the pull request. Escalation is
   `fail_on: degraded`, a policy an operator sets.
4. **A retrieval failure is a result, not an exception.** `http.mjs` never throws for a dead
   endpoint; it returns a record with `ok:false` and a named reason. A run continues and
   reports what it could not read.
5. **The relevance vocabulary is derived from `data/instruments.json` at run time**, never
   stored. Add an instrument to the dataset and the Scout starts watching for it. This is the
   same rule the site's evidence grades follow.
6. **Duplicate detection names the key that matched** — CELEX, then normalised URL, then
   normalised title, strongest first — and marks a title-only match `weak`. There is no
   similarity threshold to tune: a near-match is a new candidate that resembles an old one, and
   guessing would delete evidence to save a reviewer thirty seconds.
7. **CELEX numbers are read out of URLs, never inferred from titles.** A CELEX number is a
   legal fact.
8. **The registry is never rewritten by a run.** A live endpoint today is not a fact about the
   endpoint tomorrow; a config file that edits itself becomes a second home for a fact the
   report already carries. Entries keep `url:unchecked` permanently.
9. **Unassessable is not irrelevant.** A candidate with neither title nor summary gets band
   `unknown` and score `null`, counted separately and never folded into `none`. Unknown is not
   zero, here as everywhere else.
10. **The five report sections are written even when empty.** A section that disappears at zero
    teaches a reader to skim, and then the week it reappears it is missed.
11. **Reports are committed.** They are the cross-run duplicate-detection memory; gitignoring
    them would make every run propose everything again. This is the opposite of decision 9 in
    SESSION 02 (traces are ignored) and deliberately so — a trace is a run artifact, a report
    is the agent's memory.
12. **The Scout asks for an approval it cannot grant.** Every run emits `approval` in state
    `requested`, addressed to the maintainer, risk `high`. A test asserts no run ever emits
    `granted`.
13. **Provenance role is `unresolved` for everything the Scout emits.** It retrieved a
    *listing*; it did not read the document. The record says exactly that in its own
    `verification` block (`reviewed_by_human: false`).
14. **Nothing the Scout emits is marked `simulated`.** That flag belongs to the observability
    demonstrator alone, and a test asserts it.
15. **Workflow inputs are bound to environment variables, never interpolated into shell.** On a
    public repository a `workflow_dispatch` input is attacker-controllable.
16. **Actions are referenced at major version tags, not pinned to commit SHAs** — see
    *Known limitations* 2. This is the one place this session knowingly fell short of best
    practice, and it did so rather than write a SHA it could not verify.

## Tests

Run in this session, from the repository root:

| Command | Result |
|---|---|
| `node --test agent/scout/selftest.mjs` | **41 pass · 0 fail** |
| `node --test agent/observability/selftest.mjs` | **13 pass · 0 fail** — unchanged |
| `node agent/observability/cli.mjs validate` | 28 records · 0 invalid · 0 unparseable · exit 0 |
| `node tools/validate.mjs` | 0 errors · 0 warnings · exit 0 — matches the §12 baseline |
| `node tools/i18n-audit.mjs` | 0 errors · 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors · **5 warnings** · exit 0 — the same five listed in §12 |
| `node tools/freshness.mjs` | reports only · exit 0 — matches |

**No new warning.** The four validators' output matches the baseline recorded in
`docs/CURRENT-ARCHITECTURE.md` §12 and in SESSION 02's handover.

**The Scout was run for real**, not only against fixtures:
`node agent/scout/cli.mjs run --dry-run` completed a full pass over all six watchlist entries,
reported all six as failed with `403`, wrote a status of `failed`, and exited 1. The 403s came
from the authoring environment's egress proxy, not from the publishers — which is precisely why
the watchlist is recorded as unverified rather than as tested. **The failure path is the part of
this system that has actually been exercised end to end.**

The trace that run emitted was inspected in the existing tooling:
`node agent/observability/cli.mjs show <trace>` renders 8 spans over 2 runs with 6 tool calls,
the pending approval, and the open handoff to `human-reviewer`. Every record validated.

**The path guard was verified in both directions, on a clean tree:**

- after a real Scout run it reported `ok — 2 changed path(s), all inside agent/scout/reports/`
  and exited 0;
- with a single stray byte appended to `data/sources.json` it exited 1 and named the file as
  *"a canonical dataset — RED tier, docs/AI-SAFE-BOUNDARIES.md §3"*.

The report that run produced was **deliberately not committed**. It records six 403s from the
authoring environment's egress proxy, which is a fact about this sandbox and not about the
publishers; committing it would seed the duplicate-detection memory with nothing and read as
evidence about endpoints that were never actually reached.

**Workflow checks:** the YAML parses; every `run:` block passes `bash -n`; job structure,
permissions and concurrency were asserted by parsing the file rather than by reading it.

**Not run:** the workflow has never executed on GitHub Actions. No scheduled run, no manual
dispatch, no pull request opened by it. No real EU endpoint has been retrieved by this code.

## Observability

The Scout is instrumented end to end through `agent/observability/tracer.mjs` — no second
logging path, and no `console.log` used as one. The line-by-line output at the end of a run is a
*rendering of the report*, not the record of the run.

Per run: one orchestrator span, one agent span, one tool span per watchlist entry, plus
`observation` (one per retrieval and two per run), `decision` (with three recorded rejected
alternatives), `artifact` (the report, with sha256 and byte count), `provenance` (one per
successful retrieval, plus one per high-relevance candidate), `handoff` (to `human-reviewer`)
and `approval` (state `requested`, risk `high`).

In the workflow: the human summary is written to `$GITHUB_STEP_SUMMARY`; eight step outputs
carry the run's totals to the `propose` job; the outcome step emits `::notice` / `::warning` /
`::error` by status; and both the report and the trace are uploaded as artifacts **on failure as
well as success**, because a failed run's trace is the only evidence of why it failed.

**Not instrumented, still:** the four validators in `tools/` write to stdout only. SESSION 02
flagged this and deliberately left it; this session did too, for the same reason — their exact
output is the recorded baseline.

## Known limitations

1. **The watchlist has never been verified.** Not one of the six URLs in
   `agent/scout/registry.json` was confirmed to resolve: the authoring environment's egress
   proxy refused every `europa.eu` host with a 403. Every entry says so in its own `note`,
   every entry carries `url_status: "url:unchecked"`, and `watch-eurlex-oj-l-digital` is
   **expected to fail** until an operator regenerates the feed from EUR-Lex, because those feed
   ids are session-scoped. **The first scheduled run is what establishes which entries work,
   and a wholesale failure on it is the expected outcome, not a broken Scout.** This is recorded
   as a limitation rather than closed with plausible-looking URLs presented as tested.
2. **Actions are at version tags, not commit SHAs.** `actions/checkout@v4`,
   `setup-node@v4`, `upload-artifact@v4`, `download-artifact@v4`. Pinning to a SHA is the
   stronger practice, and it was not done because no SHA could be verified from this
   environment and inventing one would be exactly the kind of fabrication this repository
   forbids. All four are first-party GitHub actions. Pinning them is a good first task for an
   operator with network access.
3. **The workflow has never run.** Everything about it is verified statically.
4. **`feed.mjs` handles RSS 2.0 and Atom only.** A publisher on JSON Feed, or on a bespoke HTML
   listing, needs the parser extended — with a test in the same commit.
5. **`kind: "page"` link extraction is crude.** It takes every anchor with visible text, capped
   at 200. For `watch-curia-press` this will surface site furniture alongside judgments. The
   relevance band is what makes that survivable, not the extractor.
6. **Reports accumulate.** Two files a week, forever, and duplicate detection reads all of them
   on every run. There is no retention or compaction policy. This is fine for years, not for
   decades.
7. **No `since` or conditional request.** The Scout does not send `If-None-Match` or
   `If-Modified-Since` even though it captures `etag` and `last-modified`. It refetches in full
   weekly. Politeness to the publishers' servers could be better.
8. **Nothing rate-limits the Scout across watchlist entries.** Six sequential requests is
   harmless; a larger watchlist would want a delay.

## Unresolved issues

Carried forward from SESSION 00 and SESSION 02, all still open, none in this session's scope:

1. **`data/brief.json` is canonical but never consumed**; its content ships as the inline
   `window.__CONTENT__` blob at `index.html:361`. Two homes for one set of facts.
2. **The two copies have already drifted** — `meta.standfirst` differs. Which is correct is the
   author's decision; an agent must not pick one.
3. **No deploy gate.** A push to `main` still publishes, and the four validators still do not
   run in CI. This session added CI, but it schedules the Scout — it does not gate anything.
   **A workflow that runs the four validators on every push is now a much smaller job than it
   was yesterday**, because the hard part (a workflow file that exists, with a permission model)
   is done. It is the obvious next increment.
4. **106 records carry an unverified or requires-verification note.** The project's largest open
   body of work, and unchanged.
5. **No decision on excluding `agent/` from the Pages deployment.** SESSION 02 raised it; it is
   now slightly more pressing, because `agent/scout/reports/` will start accumulating committed
   Markdown that GitHub Pages will serve at `/agent/scout/reports/`.

New, from this session:

6. **Sessions 03, 04 and 05 are unaccounted for** (see the discrepancy above). If they had
   objectives, those objectives are recorded nowhere in this repository.
7. **The `source-scout` label does not exist** in the repository. The workflow creates the pull
   request first and applies the label separately, so a missing label costs a `::notice` and not
   the pull request — but creating it would tidy the Actions log.

## Next session

**SESSION 07 — run the Scout, verify the watchlist, and gate the validators.**

In this order, because the first is what makes the second honest:

1. **Dispatch the workflow manually** with `dry_run: true` and read the failed-retrievals
   section. Expect failures. Fix the URLs that are wrong, `enabled: false` the ones that are
   gone (with a note saying why and when), and regenerate the EUR-Lex feed.
2. **Dispatch it for real** and let it open its first pull request. Read what it proposes.
   Promote nothing without opening the document — `docs/AGENT-RUNBOOK.md` §4.
3. **Then add the deploy gate** (*Unresolved issues* 3): a second workflow running the four
   validators on push and pull request. It is the smallest remaining piece of the CI story and
   the one with the most direct effect on what reaches readers.

## Exact next objective

Manually dispatch `Source Scout` with `dry_run: true`, and reconcile
`agent/scout/registry.json` against what actually resolved.

## Anything the next agent must know

- **The watchlist is unverified and the first run will probably look bad.** That is limitation
  1, not a defect. Read the failed-retrievals table before concluding anything about the Scout.
- **The Scout's provenance records say `role: "unresolved"` and
  `verification.reviewed_by_human: false`.** This is correct and must stay correct until a human
  reads the document. The Scout retrieved a listing.
- **Every run leaves a pending approval.** That is the steady state, not a bug.
- **`agent/observability/runs/` is gitignored; `agent/scout/reports/` is not.** Traces are run
  artifacts, reports are the agent's memory. Do not "tidy" either into the other's rule.
- **The guard fails on a dirty tree.** The `discover` job checks the tree is clean *before* the
  Scout runs, because the guard compares after against before.
- Extending the trace record vocabulary means extending `agent/observability/schema.mjs` **and
  its tests** in the same commit. SESSION 02's rule, still binding.
- Before declaring done: `node --test agent/scout/selftest.mjs`,
  `node --test agent/observability/selftest.mjs`, `node agent/observability/cli.mjs validate`,
  and the four validators in `tools/`.

## Anything the next agent must NOT change

Carried forward from SESSION 00 and SESSION 02, unchanged and still binding:

- **Do not rebuild the site.** No framework, no bundler, no build step, no dependency, no
  service worker, no server-side rendering.
- **Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative.**
- **Do not modify `data/*.json`** in a session not scoped for data work.
- **Do not touch** the footer's non-affiliation or no-legal-advice text, `TIER_GRADE` in
  `js/format.js`, the derivation rules in `js/pipeline.js`, or the `BASE` constant in
  `tools/_footer.mjs`.
- **Do not declare a licence.**
- **Do not soften** the README's known limitations or the unverified-record count.
- **Do not re-run** `tools/_refsweep.mjs` or `tools/_review10.mjs`.
- **Do not change the id shapes in `ids.mjs`** — they are the OTLP export contract.
- **Do not move redaction to the read path.**
- **Do not remove the demonstrator's simulation markers**, and do not point it at a real source.
- **Do not commit anything under `agent/observability/runs/`.**
- **Do not install Langfuse or Phoenix without re-reading the evaluation** in
  `docs/OBSERVABILITY.md`.

Added by this session — the full list is `docs/AGENT-RUNBOOK.md` §7:

- **Do not give the Scout write access to `data/*.json`**, directly or by widening
  `guard.mjs`'s allowlist. If a future agent is to write data, it is a different agent with a
  different review path, not a relaxed Scout.
- **Do not merge the `discover` and `propose` jobs.** The split is a permission boundary, not
  an organisational one.
- **Do not set `cancel-in-progress: true`.** A cancelled run leaves a partial report.
- **Do not let the registry be rewritten by a run**, and do not "helpfully" flip an entry to
  `url:live` because it resolved once.
- **Do not drop a report section when its count is zero.**
- **Do not mark any Scout record `simulated`.**
- **Do not gitignore `agent/scout/reports/`.**
- **Do not treat a relevance band as evidence.** It is reading order. Band `high` means a
  string matched.

---

## What must NOT be rebuilt

SESSION 00's closing statement stands unchanged, and this session was built to respect it:
**the architecture is not technical debt, it is the argument.** Nothing in `js/`, `css/`,
`data/`, `i18n/`, `tools/` or the seven pages was touched by this session.

The Scout was built to the same standard as the observability layer it runs on: no dependency,
no build step, derived state never stored, `null` and `unknown` kept apart, and every record —
including the report of a run in which nothing worked — able to say exactly what it cannot
support.
