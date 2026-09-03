# Observability

The instrumentation layer for the agents this project has not built yet.

Nothing here is wired into the website. `agent/observability/` is a
development subsystem: it has its own store, its own viewer and its own
tests, it adds no dependency, it changes no page, and `tools/design-qa.mjs`
does not see it because that script reads only the root-level HTML, `css/`
and `js/`.

```
node agent/observability/demo/workflow.mjs --live   # write a simulated trace
node agent/observability/cli.mjs serve              # → http://127.0.0.1:7801
```

---

## Where this sits in the governance layer

Read `docs/PROJECT-CONTEXT.md`, `docs/CURRENT-ARCHITECTURE.md` and
`docs/AI-SAFE-BOUNDARIES.md` first; this document assumes them.

This layer is **green tier** under `docs/AI-SAFE-BOUNDARIES.md` §1 — new
tooling and test scaffolding, additive, changing nothing the site asserts. It
deliberately stays inside the red-tier prohibition on architectural
replacement (§3): no framework, no build step, no bundler, no dependency. That
prohibition is also why neither Langfuse nor Phoenix was installed; the
reasoning is at the end of this document.

Run records are **build artifacts, not canonical data**. They do not belong in
`data/`, which is reserved for the legal record, and `agent/observability/runs/`
is git-ignored for that reason.

The four validators in `tools/` are untouched. Their output and exit codes are
the recorded baseline in `docs/CURRENT-ARCHITECTURE.md` §12, and this session
left them byte-identical.

---

## Why this exists in this repository specifically

The site's argument is that a legal claim should carry its evidence, that a
grade should be derived rather than stored, and that a record should say what
it cannot support. An agent that edits this site has to be held to the same
standard, and that is not a property of the agent — it is a property of what
the agent is made to write down.

So the requirement is not "logging". It is that six months from now, given a
line on a page, it must be possible to answer: which source, retrieved when,
verified how, decided by which agent on what reasoning, approved by whom,
implemented as which file, deployed in which commit. `cli.mjs chain` answers
exactly that question, and reports the parts of the answer that are missing
rather than omitting them.

---

## The model

An append-only event log. One file per trace, one JSON object per line, in
`agent/observability/runs/<trace_id>.jsonl`. Nothing is ever rewritten, so a
run that crashed leaves everything it managed to emit, in order, and the file
still parses.

Two families of record.

**Spans** — the execution tree. A span is written twice: `span.start` when it
opens and `span.end` when it closes. A span with a start and no end is
running, or died; that reads as what it is rather than as a hole.

**Events** — what happened inside a span, each carrying its `span_id`:
`observation`, `decision`, `artifact`, `handoff`, `approval`, `provenance`,
`usage`, `error`, `website_change`.

Together they are the tree the system needs:

```
orchestrator ── agent ── tool ── observation
                     │       └── error
                     ├── decision
                     ├── artifact
                     ├── provenance
                     ├── approval
                     └── handoff ──▶ agent
```

### An observation is not a log line

A log line is prose addressed to whoever happens to be watching the terminal.
An observation is a structured claim — subject, summary, data, confidence,
risk, refs — and it can be counted, graded, queried and disagreed with later.
Every meaningful operation writes one. `print()` is not the observability
mechanism here, and the layer offers no logging call at all.

### Identifiers

W3C Trace Context shapes, so nothing has to be rewritten to export:

| id | shape | meaning |
|---|---|---|
| `trace_id` | 32 hex | one workflow, from the first orchestrator to the last artifact |
| `span_id` | 16 hex | one span |
| `run_id` | 16 hex | **the `span_id` of an orchestrator or agent span** |
| `parent_run_id` | 16 hex | the `run_id` of the enclosing run |

`run_id` is deliberately not a third identifier. A run *is* a span, so
storing a separate id for it would be a second home for one fact, and two
copies of a fact can disagree. A tool span carries the `run_id` of the agent
that called it, however deeply nested, and inherits that agent's name: an
unattributed tool call is a tool call nobody owns.

### Every field the session required

On a run (`span.start` / `span.end`): `run_id`, `parent_run_id`, `agent`,
`task`, `start_time`, `end_time`, `status`, `inputs`, `outputs`,
`confidence`, `risk`, `usage`, `counts`. Tool calls are child spans;
artifacts, decisions, handoffs and errors are events under the span that
produced them. Nothing is duplicated onto the parent — the rollups the viewer
shows are derived in `query.mjs` at read time.

### Status

Stored per span: `running · ok · failed · skipped · cancelled`.

Derived per trace, and deliberately wider: **`degraded`** — the root finished
ok but something under it failed. A root reporting ok over a failed child is
the kind of green that hides a defect; a whole trace reported failed because
one retryable poller died is the kind of red nobody reads twice.

**SESSION 13 fixed the half of this that was not true.** `degraded` was
defined, derived and documented, and the derivation walked only the *run*
spans. The case a SESSION 12 audit found went straight through it: a Verifier
run whose six candidates were all refused closed six `verifier.intake` spans
`failed` and wrote six `error` records, and reported `✓ ok` — because an
intake span is a **tool** span. `deriveStatus()` now walks every span under
the root, so a root that closed ok over a failed child of any kind reads as
`degraded`.

It also reaches a process now, which it did not before:

| where | behaviour |
|---|---|
| `cli.mjs show <trace>` | one run, so its own answer: **0** ok · **2** degraded · **1** failed or still running |
| `cli.mjs list` | the store's history, which accumulates every run ever made. Prints a census line naming `degraded` separately, and exits 0 — a run that failed in March is not a statement about today. `--fail-on degraded` (exit 2) or `--fail-on failed` (exit 1) is an operator's decision, spelled as `agent/scout/schedule/run.mjs` already spells it |
| the agent CLIs | **total intake refusal exits 2**. Every input record refused and nothing produced from them is not a successful run. An unresolved verdict, a conflict, a gap and an unclassified transition are results and still exit 0 |

`degraded` remains **derived and never stored**: `AgentRun.forbidden` bans it
by name, because a stored copy could not know about a child that failed after
the record was written.

### Correlating two agents' runs

Two questions, two homes, and they are not the same fact:

| question | where the answer lives |
|---|---|
| what run caused this one? | `parent_run_id` on the downstream run's spans and its `AgentRun` |
| where did this run's output go? | a `handoff` event on the **upstream** run, whose `payload.downstream_trace_id` names the trace that took it |

`Span.handoff()` and `gateway.handoff()` have been correct since SESSION 02
and, until SESSION 13, no real CLI called either: chaining a real Scout trace
into a real Verifier run produced `parent_run_id: null`, `handed_off_to: []`
and no reference at all to the trace it had just read. `chain.mjs` is what the
five chained CLIs now call.

- `upstreamOf(records)` reads the producing run **off the records**, from
  their own `trace_ref`. Records from two different runs are reported as
  ambiguous rather than resolved by picking one.
- The CLI passes that run to `new Tracer({ parent_run_id })`, so every span
  the run opens carries it and the `AgentRun` field is populated from one
  place rather than copied into a second.
- `recordHandoff(...)` appends **one** `handoff` event to the upstream run,
  using `Tracer#attachToRun` — which emits no `span.start` and whose `end()`
  is a no-op, because that span was opened and closed by somebody else and a
  second start would be a second home for one fact.

Three things it deliberately does not do. It does not call
`gateway.handoff()`, which re-emits an artifact pointer per record: right when
the records are new to a trace, wrong here, where the upstream run already
emitted every one. It does not make anything actionable — a `simulated`
record stays never-actionable, the downstream intake refuses it unchanged, and
the edge carries `simulated: true` so a chain of fixtures cannot be misread as
a chain of documents. And it writes nothing when the upstream trace file is
gone: it reports why, rather than leaving an orphan event on a trace that does
not exist.

`handoffState()` reads a cross-trace edge as **accepted**. Its old question —
"did an agent of that name start in this trace?" — answers no for a run that
started in another one, so every chained run would have shown a permanently
open handoff, and a queue panel that always warns is a panel nobody reads. A
payload naming the downstream trace is the receipt; without one, the old
question is still the right one.

**`AgentRun.handed_off_to` is still empty on a chained run, and that is not a
bug this session left unfixed.** A run closes before anything downstream
exists, so it cannot know at close time who will later take its records.
Back-filling the stored field would mean rewriting a closed record — the
second home this architecture exists to prevent. The durable answer is the
handoff event on the trace, derived by `handoffState()` at read time.

---

## Provenance

A `provenance` record is what makes a legal operation auditable:

```
source_id · role · url · title · publisher · locator · retrieved_at
content_sha256 · quote · verification{method, verdict, checked_by, note}
claim_ids · instrument_ids · simulated
```

`role` uses the vocabulary the site already uses in `data/claims.json` —
`primary`, `official`, `secondary`, `interpretation`, `unresolved` — so a
record an agent writes can be reconciled with the bibliography rather than
needing a translation table.

The schema refuses a provenance record that has neither a `url` nor a
`locator` unless it is explicitly marked `simulated: true`. A source nobody
can go and look at is not a source.

`cli.mjs export <trace> --provenance` emits the provenance ledger for one
trace on its own, for an audit that does not care about spans.

---

## Secrets

Redaction happens on the way **in**, at the sink boundary, not on the way out
in a viewer. A trace store is the worst possible place to leak a credential:
it is append-only by design, written without being read, and kept. A record
written clean cannot be un-redacted later.

Two passes — by key (`api_key`, `authorization`, `cookie`, `private_key`, …)
and by value (OpenAI/Anthropic-style keys, GitHub tokens, AWS key ids, Slack
tokens, JWTs, `Bearer …`, PEM blocks, URL userinfo, `?token=`). The count is
written onto the record as `redactions`, because a silent redactor is
indistinguishable from a broken one. Oversized strings are truncated with the
number of dropped characters stated.

The demonstrator passes a fake credential in its own inputs on purpose, so
this is visible in the store on the first run — and the test suite asserts
that none of them survives.

---

## Cost, tokens, latency

`usage` events and the `usage` field on `span.end` carry `model`, `provider`,
`input_tokens`, `output_tokens`, `total_tokens`, `cost_usd`, `latency_ms`.
Latency is also derived on every span from its own start and end, so it
exists whether or not the caller supplied anything. `query.mjs` rolls tokens
and cost up the tree; a trace with no usage recorded says "no token/cost
recorded" rather than showing a confident zero.

---

## Tracing a website change back

Requirement: source → verification → decision → implementation → deployment.

A `website_change` record names the files, and references the decisions,
artifacts, provenance and approvals behind them. Because all of them sit
under one `trace_id`, the chain is a query:

```
node agent/observability/cli.mjs chain --file data/instruments.json
node agent/observability/cli.mjs chain --change demo-chg-1
```

Any stage with nothing in it is reported under `GAPS` — no granted approval,
no commit, no verification. **A chain that quietly omits its missing link is
worse than no chain, because it reads as an audit.** In the demonstrator the
`proposed` record shows gaps and the `deployed` record shows none, so both
behaviours are visible on the first run.

---

## Regulatory impact — the dependency graph, exposed

SESSION 10 asked for the Change Detector's dependency/impact graph to be exposed
through this layer. It is exposed the way everything else here is: **derived at
read time from what the run actually emitted**, never stored a second time.

The detector writes three things onto the span that mapped a change:

| record | carries |
|---|---|
| `artifact` of type `impact-graph` | the subgraph that carried the change — roots, per-depth counts, the direct dependencies, and a `sha256` over the whole |
| `decision` | where the impacts routed, with the alternatives it did not take |
| `observation` at `risk: high` | one per editorial finding, with the sentence quoted |

`impactState()` in `query.mjs` joins them by the change id the artifact is named
for, and reports **gaps** the way `traceChain` does: a trace that emitted an
impact graph and no routing decision says the decision is missing. A view that
quietly fills in the gap reads as an audit.

```
node agent/observability/cli.mjs impact [--trace t] [--change c] [--graph]
GET /api/impact?trace=&change=
```

Two behaviours are the point rather than a detail:

- **Editorial impacts are a rail, beside pending approvals and open handoffs.** An
  editorial impact is a sentence on a production site about EU law that may now be
  false, and nothing in this repository reads prose. It belongs with the state
  nobody has looked at.
- **A bounded preview is never reported as the whole graph.** The redaction cap
  below applies to the graph like everything else, so the trace carries the shape
  and the identity while the complete graph stays on the `ImpactAssessment` record.
  `nodes` and `edges` come from the graph's own header; `shown` and `dropped` say
  what is on the trace, and a preview that dropped anything reports it as a gap
  with the hash to check against.

The failure that shaped this is worth keeping: the first version inlined the whole
subgraph, `redact.mjs` truncated the string at 8000 characters, and the viewer
showed **a graph of zero nodes for a change that reached a hundred and seventy-five
records**. A cap silently producing a confident zero is exactly the failure this
layer must not have, and there is now a test named for it.

Full account: `docs/REGULATORY-IMPACT-MAPPING.md` §8.

---

## Data depth — the analysis, exposed with what it set aside

SESSION 11 asked for the Data Depth Agent's analysis to be instrumented. It is
exposed the same way everything else here is: **derived at read time** from what
the run emitted, stored nowhere twice.

| Emitted by `agent/depth/` | Carrying |
|---|---|
| one span per detector, named `depth.<kind>` | `reported`, `set_aside` and `examined` on its own outputs |
| an `observation` beginning `SET ASIDE —` | every finding that detector did **not** report, with the reason for each |
| an `artifact` of type `contract:KnowledgeGap` | one per gap emitted |
| an `observation` beginning `DEPTH CENSUS —` | the run's totals: by kind, by impact, by autonomy, and the kinds that found nothing |
| a `decision` | what the run ordered by, with the alternatives it did not take |

`depthState()` in `query.mjs` joins them. **The set-aside half is the point of
this view.** A run that reported 57 gaps and dropped 31 made a judgement 31
times, and a view showing only the 57 would present that judgement as though it
were the corpus. So a detector that set findings aside and recorded no reasons is
reported as a **gap in the view** — a suppression nobody can see is a suppression
nobody can check — and a detector that found nothing is carried through, because
a reader who cannot tell *looked and found nothing* from *did not look* has been
told nothing.

```
node agent/observability/cli.mjs depth [--trace t] [--aside]
GET /api/depth?trace=
```

The viewer has a **Data depth** panel with the same content, and the overview
rail counts reported gaps — warning where any of them sit at
`reader_could_be_misled`, which is `AI-SAFE-BOUNDARIES` §0.5: an absence
available to be read as a negative finding.


---

## Gap proposals — the routing, exposed with what it refused

SESSION 12 asked that each knowledge gap can become a structured proposal. On
this corpus most cannot — closing them means writing a value read from a
document, and nothing here has retrieved one — so **the refusals are the half
this view exists to show**, in the same way the set-aside half is the point of
the depth view above.

| Emitted by `agent/proposals/data/` | Carrying |
|---|---|
| one span per route, named `propose.<route>` | `gaps`, `proposals`, `approvals`, `data_gaps` and `refused` on its own outputs |
| an `observation` beginning `NO PROPOSAL —` | one per gap that produced nothing, with the reason |
| `artifact`s of type `contract:DataProposal`, `contract:ApprovalRequest`, `contract:DataGap` | one per record emitted |
| `handoff`s to `editorial` and `legal-verifier` | the gaps this agent cannot act on, and what went with them |
| an `observation` beginning `PROPOSAL CENSUS —` | the run's totals: by route, by kind and route, and the routes nothing took |
| an `observation` beginning `NOTHING MERGED —` | `applied: 0` and `data_dir_written: false` |
| a `decision` | what the run routed by, with the alternatives it did not take — including *"author a proposal for every gap, leaving the value blank"* |

`proposalState()` in `query.mjs` joins them. Four states are reported as **gaps
in the view** rather than smoothed over: a missing census, a missing routing
decision, a missing nothing-merged claim, and — the one that matters most — a
proposal with no approval request, which is an unapproved change that looks
approved. A route nothing took is carried through, for the reason a detector
that found nothing is.

```
node agent/observability/cli.mjs proposals [--trace t] [--refused]
GET /api/proposals?trace=
```

The viewer has a **Gap proposals** panel with the same content, and the overview
rail counts the gaps that could **not** become a proposal — not the ones that
could, because a tile showing only what was authored would report the work as
more complete than it is.

## Knowledge architecture — the eight answers, exposed

SESSION 13's Knowledge Architect asks eight questions of the information model
and its brief requires the **reasoning** to be instrumented, not only the
output. So the interesting object in `architectureState()` is not the proposal
count: it is **the eight answers**, each one an observation of its own, carrying
the answer as a word and what the lens examined beside it. A question answered
"no" is the model working, and a run that could not say which of the eight it
answered "no" to would have hidden its own coverage behind its own output.

The architect writes onto each lens span:

```
a span  architect.<lens>     examined · found · reported · set_aside · proposals
an observation  Q<n> — …     the answer, with what was examined and reported
observations  NOT REPORTED   one per finding set aside, with the reason and
                             the agent it belongs to
handoffs                     the edges to the agents that own them
artifacts                    every ArchitectureProposal and ApprovalRequest
a decision                   the ordering, with what it did not choose
two observations             the census, and that nothing was merged
```

Derived at read time and stored nowhere twice. Exposed as
`cli.mjs architecture [--trace t] [--aside]`, `GET /api/architecture`, and the
**Knowledge architecture** panel in the viewer. The overview tile counts the
questions the model **handles**, not the ones it fails.

The view reports a gap in itself where a run failed to say something: no census,
no ordering decision, no "nothing merged" claim, a lens that recorded no answer,
findings set aside with no reasons, more proposals than approvals, or an
approval granted inside the run that requested it. The suite proves that check
does something by stripping the `NOT REPORTED` observations from a real trace
and asserting the view notices.

---

## The development view

`node agent/observability/cli.mjs serve` → `http://127.0.0.1:7801`.

A `node:http` server (no framework) over the store, and a static page. It
binds to loopback: even redacted, agent inputs and outputs are not something
to put on an interface by accident.

It shows, per the session's requirement: running / completed / degraded /
failed traces; open handoffs; pending human approvals; website changes; and
per trace — the execution tree, a timeline, the agents with their confidence
and risk, decisions with their rejected alternatives, artifacts with hashes
and previews, handoffs, approvals, the provenance ledger, the audit chain,
the regulatory impact maps, the data-depth analysis, the gap routing, and errors.

Two behaviours are the point rather than a detail:

- **Pending approvals and open handoffs are rails, not tabs.** They stay on
  screen whichever trace you are reading, because the state that matters most
  is the one nobody has looked at.
- **A simulated trace says so across the top of the page.** Fixture data that
  renders identically to real research is the one failure this interface must
  not have.

The viewer deliberately does **not** import `css/tokens.css` or `style.css`.
It restates the palette instead. A change to the site's component layer must
not be able to break the tool used to debug the site, and the tool must not
quietly become a second consumer of tokens that `design-qa.mjs` believes only
the site uses.

The API:

| endpoint | returns |
|---|---|
| `GET /api/summary` | store-wide counts, open handoffs, pending approvals, website changes |
| `GET /api/runs` | one summary per trace |
| `GET /api/runs/:trace_id` | one trace, fully derived |
| `GET /api/chain?trace=&file=&change=` | the audit chain |
| `GET /api/impact?trace=&change=` | the regulatory impact maps, with their graphs, routing and gaps |
| `GET /api/depth?trace=` | the depth analyses, with what each run reported **and** what it set aside |
| `GET /api/proposals?trace=` | the gap routings, with what each run proposed **and** what it refused |
| `GET /api/export?trace=&kind=` | OTLP/JSON, or the provenance ledger |

---

## Which backend — Langfuse, Phoenix, or neither yet

**Decision: neither is installed. The canonical store is the local JSONL log
in this repository, and `otlp.mjs` exports to either. When a hosted UI is
needed, Phoenix is the first backend to try.**

The reasoning, since the session asked for it rather than for an install:

**What this project actually is.** A zero-dependency static site with no
build step, no `package.json` and no `node_modules`, maintained by one
person, whose central claim is that its records are auditable. The trace
store is not product analytics. It is the evidence trail behind edits to a
document about law, and it has to outlive any vendor's free tier and any
schema migration.

**Langfuse.** Strong at what it is for: prompt management, evaluation runs,
scoring, sessions and users, cost dashboards, annotation queues for a team.
Against it here — self-hosting v3 means Postgres, ClickHouse, Redis and
object storage under Docker Compose, which is a serious operational surface
next to four Node scripts that need nothing; the cloud alternative means
sending research provenance to a third party, which sits badly with a
repository that self-hosts its own typefaces so that no page makes a
third-party request. Its strengths are also mostly team strengths, and there
is currently one maintainer and no prompts in the repository to manage.

**Phoenix (Arize).** `pip install arize-phoenix`, `phoenix serve`, a local UI,
SQLite underneath, no account and no network egress. It speaks OpenInference
natively — the same conventions `otlp.mjs` already emits — and ingests plain
OTLP over HTTP. It is the closer fit: local-first, offline, OTel-native, and
disposable. Against it: it introduces Python into a Node-and-browser
repository, and its retention model is a local database rather than something
that belongs in git.

**Why neither, yet.** Both are viewers over a trace stream. Installing one
before there is a single real agent would mean choosing the store before
knowing what has to be stored, and neither of them models the four things
this project actually needs — a provenance record tied to a source tier, a
human approval as a first-class state, a website change linked to the files
it touched, and a chain query that reports its own gaps. Those would end up
squeezed into free-form metadata, which is exactly where audit trails go to
die.

So the canonical record is the JSONL log — greppable, diffable, archivable,
and owned by this repository the same way `data/*.json` is — and the export
is the reversible part:

```
node agent/observability/cli.mjs export <trace-id> > trace.json
curl -X POST http://localhost:6006/v1/traces \
     -H 'content-type: application/json' -d @trace.json
```

Adopting Phoenix later is a decision about where to POST. Abandoning it costs
nothing. Langfuse becomes the better answer if and when this project has
prompts to version, evaluation suites to score, and more than one person
annotating runs — and then self-hosted, because of what the traces contain.

**OpenTelemetry / OpenInference compatibility, concretely:** W3C id shapes;
RFC3339 plus `unixNano` timestamps; one span tree; OTel status codes;
`openinference.span.kind` of `AGENT` / `TOOL` / `LLM` / `RETRIEVER` / `CHAIN`;
`input.value`, `output.value`, `llm.model_name`,
`llm.token_count.prompt|completion|total`, `llm.cost.total`, `tool.name`,
`session.id`, `graph.node.id`, `graph.node.parent_id`. Domain events export as
OTel span events carrying the full record on a `payload` attribute, so nothing
is lost in a backend that only understands spans.

---

## The demonstrator

`agent/observability/demo/workflow.mjs` — a fake Scout → Verifier → Change
Detector run. It connects to nothing.

Every source is `demo-src-*` at `example.invalid`; every provenance and
artifact record carries `simulated: true`; the proposed change names a file
that does not exist in this site; the viewer prints a banner for any trace
containing a simulated record; and the test suite asserts all of it. **The
demonstrator must never be mistakable for research** — that would be a worse
defect than having no demonstrator.

What it deliberately exercises: the full tree; a nested agent that **fails**
while the run survives it, degraded; a tool call that times out and is
retried; token, cost and latency on a model call; a credential in the inputs,
so redaction is visible in the store; a human approval requested and granted,
and a second one left **pending** on purpose; and a website change whose audit
chain is complete in one record and gapped in the other.

```
node agent/observability/demo/workflow.mjs                  # instant
node agent/observability/demo/workflow.mjs --live           # with delays, so the
                                                            # viewer shows it running
node agent/observability/demo/workflow.mjs --stall          # leave an agent open
node agent/observability/demo/workflow.mjs --deterministic  # fixed ids and clock
```

---

## Files

| File | What it is |
|---|---|
| `ids.mjs` | W3C-shaped id and clock generation, with a deterministic mode for fixtures |
| `redact.mjs` | secret redaction, by key and by value, counted |
| `schema.mjs` | the record vocabulary and the validator both write and read paths use |
| `sink.mjs` | the append-only JSONL store, plus in-memory and multi sinks |
| `tracer.mjs` | the API an agent uses: spans, events, `step()`, and `attachToRun` for appending one event to a run another process already closed |
| `chain.mjs` | the edge between two runs: the upstream run read off the records, and the handoff written onto its trace |
| `query.mjs` | the read model — tree, rollups, queues, audit chain. Nothing derived is stored |
| `otlp.mjs` | OTLP/JSON + OpenInference export, and the provenance ledger |
| `server.mjs` | the loopback dev server and its JSON API |
| `viewer/` | the development view |
| `cli.mjs` | `list · show · chain · impact · depth · proposals · architecture · validate · export · summary · serve`, with the exit codes in **Status** above |
| `demo/workflow.mjs` | the simulated Scout → Verifier → Change Detector run |
| `selftest.mjs` | `node --test agent/observability/selftest.mjs` |
| `runs/` | the store. Git-ignored: it holds run inputs and outputs, and it is regenerable |

## Checks

```
node --test agent/observability/selftest.mjs   # the suite
node agent/observability/cli.mjs validate      # exits 1 on a malformed store
```

`validate` also reports a span that started and never ended in a trace that
is otherwise over — legitimate while a run is live, a defect once it is not.

## Known limitations

1. **No agent is instrumented, because no agent exists.** Everything here is
   exercised by a simulated workflow only.
2. **The store is per-developer and not shared.** Two machines produce two
   stores; there is no aggregation and no retention policy.
3. **Concurrency is untested.** Appends are synchronous and per-trace, which
   should make two processes writing two different traces safe, but nothing
   here proves it.
4. **The viewer polls every two seconds.** No streaming, no websocket.
5. **The OTLP export is written to the spec, not tested against a live
   collector.** The shapes are asserted in the suite; no Phoenix or Langfuse
   instance has ingested one.
6. **The viewer's HTML is in the repository, so GitHub Pages serves it** at
   `/agent/observability/viewer/`. Nothing links to it, no trace data is
   committed, and without the local API it renders an explanatory message
   instead of a broken page — but it is reachable, and if that is not wanted
   the directory needs excluding from the deployment.
7. **`cost_usd` is whatever the caller passes.** There is no price table.
