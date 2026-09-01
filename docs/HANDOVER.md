# HANDOVER

**Last updated:** SESSION 02 · 1 September 2026
**Branch:** `claude/eu-digital-policy-protocol-kye69t`
**Base commit:** `c2e62c7` on `main` (SESSION 00)

---

## Current milestone

**SESSION 02 — Build the observability foundation. Complete.**

This is the session SESSION 00 recommended as "SESSION 01 — design and implement the agent
observability layer". The numbering differs; the objective is the same one, and it is now
done. No legal agent was built, and none should be until the next session.

The reference document is **`docs/OBSERVABILITY.md`**. This file is the handover only.

## Implementation

`agent/observability/` — the instrumentation layer the future multi-agent system runs on.
Zero dependencies, no build step, nothing wired into the site.

- **Model.** An append-only JSONL event log, one file per trace. `span.start` / `span.end`
  build the execution tree; nine event types hang off the spans — `observation`, `decision`,
  `artifact`, `handoff`, `approval`, `provenance`, `usage`, `error`, `website_change`.
  Nothing derived is ever stored, matching the rule the data model already keeps.
- **Identifiers.** W3C Trace Context shapes — `trace_id` 32 hex, `span_id` 16 hex.
  `run_id` **is** the `span_id` of an orchestrator/agent span, so a run is not a second home
  for a fact. `parent_run_id` skips tool spans. A tool span carries the `run_id` and the
  name of the agent that called it.
- **Observations, not log lines.** The layer offers no logging call at all. Every meaningful
  operation writes a structured claim with subject, summary, data, confidence, risk and refs.
- **Redaction** happens at the sink on the way *in*, by key and by value, and the count is
  written onto every record.
- **Read model** (`query.mjs`) derives the tree, token/cost/latency rollups, the queues, and
  the `source → verification → decision → implementation → deployment` chain — which reports
  its own gaps rather than omitting them.
- **Export** (`otlp.mjs`) emits OTLP/JSON with OpenInference attributes.
- **Development view** — `node:http` on loopback plus a static page: running, completed,
  degraded and failed traces, open handoffs, pending human approvals, artifacts, decisions,
  provenance, website changes, errors.
- **Demonstrator** — a fully simulated Scout → Verifier → Change Detector run.

## Files changed

All new and additive. **No file the website ships was modified.** Confirmed by
`git status --porcelain`.

```
.gitignore                              (new — ignores the trace store only)
docs/OBSERVABILITY.md                   (new)
docs/HANDOVER.md                        (rewritten for this session)
agent/observability/README.md
agent/observability/ids.mjs
agent/observability/redact.mjs
agent/observability/schema.mjs
agent/observability/sink.mjs
agent/observability/tracer.mjs
agent/observability/query.mjs
agent/observability/otlp.mjs
agent/observability/server.mjs
agent/observability/cli.mjs
agent/observability/selftest.mjs
agent/observability/demo/workflow.mjs
agent/observability/viewer/{index.html,viewer.css,viewer.js}
```

## Architecture decisions

1. **No dependency, no build step, no `package.json`.** `node:test` and `node:http` cover
   the suite and the server. This is the repository's rule and a RED-tier prohibition in
   `docs/AI-SAFE-BOUNDARIES.md` §3; it was kept.
2. **Neither Langfuse nor Phoenix was installed.** The canonical store is the local JSONL
   log; `otlp.mjs` exports to either, so adoption later is a decision about where to POST.
   Phoenix is the recommended first backend — local-first, no account, OpenInference-native.
   Langfuse becomes the better answer once there are prompts to version, evaluation suites
   to score and more than one annotator, and then self-hosted, because of what the traces
   contain. Full reasoning in `docs/OBSERVABILITY.md`.
3. **`run_id` is a span id, not a separate identifier.** One home per fact.
4. **`degraded` is derived, never stored** — a root that finished ok over a failed child.
   `ok` would hide the failure; `failed` would be the kind of red nobody reads twice.
5. **Redaction on the write path.** A store written clean cannot be un-redacted later.
6. **The viewer does not import `css/tokens.css` or `style.css`.** A tool used to debug the
   site must not break when the site's component layer changes, and must not become a hidden
   consumer of tokens `design-qa.mjs` believes only the site uses.
7. **The demonstrator is aggressively marked simulated** — `example.invalid` hosts,
   `simulated: true` on every record, a banner in the interface, and tests that assert it.
   Under §0.1 of the boundaries, fixture data that reads as research would be a worse defect
   than no demonstrator.
8. **A missing link in an audit chain is reported, never omitted.** The same discipline as
   the asterisk in the running text.
9. **`agent/observability/runs/` is git-ignored.** Run records are build artifacts, not
   canonical data — SESSION 00's instruction, kept. They hold run inputs and outputs and are
   regenerable.

## Tests

Run in this session, from the repository root, on the rebased tree at `c2e62c7`:

| Command | Result |
|---|---|
| `node --test agent/observability/selftest.mjs` | **13 pass · 0 fail** |
| `node agent/observability/cli.mjs validate` | 56 records · 0 invalid · 0 unparseable · exit 0 |
| `node tools/validate.mjs` | 0 errors · exit 0 — matches the §12 baseline |
| `node tools/i18n-audit.mjs` | 0 errors · 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors · **5 warnings** · exit 0 — the same five listed in §12 |
| `node tools/freshness.mjs` | reports only · exit 0 — matches |

No new warning. The four validators' output is byte-identical to the run taken before any
file was added.

**Browser** — headless Chromium via Playwright, against the local server: all ten tabs
render, the execution tree shows 14 spans, no console error, one `<h1>`, `lang` set, no
duplicate id, no heading-level jump, every control has an accessible name, the skip link is
the first tab stop and moves focus to `<main>`, both themes compute. A run started with
`--live` was observed in the `running` state mid-flight and settled to `degraded`.

**Not run:** no screen reader, no non-Chromium browser, no real-device testing — the same
limitation the site itself declares. No live OTLP collector ingested an export.

## Observability

The demonstrator is instrumented end to end: run id, parent run id, agent, task, start and
end, status, inputs, outputs, tool calls, observations, decisions with their rejected
alternatives, confidence, risk, artifacts with sha256, handoffs, human approvals, provenance
with a verification block, token/cost/latency, errors, and a website change with its audit
chain. Every record passes the schema validator on the way into the store.

**What was not instrumented:** the four validators in `tools/` still write to stdout only.
SESSION 00 suggested retrofitting them to emit a structured record alongside their
human-readable output. That was deliberately **not** done here — this session's brief scoped
the work to the multi-agent foundation, and changing four scripts whose exact output is the
recorded baseline is a separate, reviewable change. It is the smallest useful next
increment after the Scout.

## Known limitations

1. No real agent is instrumented, because none exists.
2. The store is per-developer; no aggregation, no retention policy.
3. Concurrent writers are untested — appends are synchronous and per-trace.
4. The viewer polls every 2s; no streaming.
5. The OTLP export is written to the spec and asserted in the suite, but no Phoenix or
   Langfuse instance has ingested one.
6. GitHub Pages serves the repository at root, so the viewer's HTML is reachable at
   `/agent/observability/viewer/`. Nothing links to it, no trace data is committed, and
   without the local API it renders an explanation rather than a broken page — but it is
   reachable, and excluding `agent/` from the deployment is a decision not yet taken.
7. `cost_usd` is whatever the caller passes. There is no price table.

## Unresolved issues

Carried forward from SESSION 00 and still open — none was in this session's scope:

1. **`data/brief.json` is canonical but never consumed**; its content ships instead as the
   inline `window.__CONTENT__` blob at `index.html:361`. Two homes for one set of facts.
2. **The two copies have already drifted** — `meta.standfirst` differs. Which is correct is
   the author's decision; an agent must not pick one.
3. **No deploy gate.** A push to `main` publishes; the validators do not run in CI.
4. **106 records carry an unverified or requires-verification note.** The project's largest
   open body of work.

New, from this session:

5. **There is no agent contract yet.** The protocol requires every agent to operate through
   "the project's agent contracts and observability layer". The observability half now
   exists; the contract half is unwritten. There is no `AGENTS.md` and no `CLAUDE.md` in the
   repository.
6. **No decision on excluding `agent/` from the Pages deployment** (limitation 6 above).

## Next session

**SESSION 03 — write the agent contract, and instrument one real read-only agent against
it.**

Define, in `AGENTS.md`, what an agent in this project may do, what it must emit, and what it
may never do — the boundaries document already supplies most of the content; what is missing
is the contract an agent's *code* is held to. Then build **one** agent: the Scout,
**read-only**, against real sources, emitting through `agent/observability/tracer.mjs` and
appearing in the viewer with real provenance.

Do not build the Verifier or the Change Detector in the same session, and do not let any
agent write to `data/*.json`.

## Next-session instructions

- Invoke `project-context` first. Read `docs/PROJECT-CONTEXT.md`,
  `docs/CURRENT-ARCHITECTURE.md`, `docs/AI-SAFE-BOUNDARIES.md` and this file before code —
  then `docs/OBSERVABILITY.md` before writing any agent.
- Re-run the four validators and confirm the §12 baseline before changing anything.
- Instrument through `tracer.mjs`. Do not add a second logging path, and do not use
  `console.log` as the observability mechanism.
- A real provenance record must carry a `url` or a `locator`; the schema refuses it
  otherwise unless it is marked `simulated`, and **nothing outside the demonstrator may be
  marked simulated**.
- `provenance.role` uses the same vocabulary as `data/claims.json` deliberately. Keep it
  reconcilable with the bibliography.
- Extending the record vocabulary means extending `schema.mjs` **and its tests** in the same
  commit. A record type the validator does not know is a record the viewer will not render.
- Before declaring done: `node --test agent/observability/selftest.mjs`,
  `node agent/observability/cli.mjs validate`, and the four validators in `tools/`.

## Do not

Carried forward from SESSION 00, unchanged and still binding:

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

Added by this session:

- **Do not change the id shapes in `ids.mjs`.** They are the OTLP export contract.
- **Do not move redaction to the read path.**
- **Do not remove the demonstrator's simulation markers**, and do not point it at a real
  source. If a real Scout is wanted, write one — do not repurpose the fixture.
- **Do not commit anything under `agent/observability/runs/`.** It holds run inputs and
  outputs.
- **Do not install Langfuse or Phoenix without re-reading the evaluation** in
  `docs/OBSERVABILITY.md`. Both remain viable; neither is a dependency of this layer.

---

## What must NOT be rebuilt

SESSION 00's closing statement stands unchanged, and this session was built to respect it:
**the architecture is not technical debt, it is the argument.** The zero-build,
zero-dependency, client-rendered model; `js/data.js` as the sole fetch point; the derivation
layer; the one-home-per-fact data model; the taxonomy as universal enum authority; the
`null` / `unknown` distinction; `js/shell.js` and `js/evidence-view.js` as single renderers;
the seven duplicated footers; and the four validators — none of these was touched, and none
should be. The full statement and its reasoning are in the SESSION 00 section of the
repository history (`git show c2e62c7:docs/HANDOVER.md`).

The observability layer was built to the same standard: no dependency, no build step,
derived state never stored, and every record able to say what it cannot support.
