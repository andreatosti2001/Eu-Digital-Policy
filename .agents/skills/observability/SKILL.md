---
name: observability
description: Instrument an agent through agent/observability/tracer.mjs — spans, observations, decisions, provenance, handoffs, approvals and website changes. Use whenever an agent does work that must be auditable later.
---

# observability

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 applies in full and is not restated here.
The layer's design and reasoning are in `docs/OBSERVABILITY.md`; this skill is how to use it.

## Purpose

The requirement this layer exists for: given a line on a page, it must be possible to answer
which source, retrieved when, verified how, decided by which agent on what reasoning,
approved by whom, implemented as which file, deployed in which commit — and to see the parts
of that chain that are missing rather than a chain that quietly omits them.

## When to invoke

Writing or running any agent. Adding a tool call, a decision, a retrieval or a proposed
change to an agent's behaviour. Investigating what a previous run did.

## Scope boundary

| This skill | Not this skill |
|---|---|
| How an agent records what it did | Whether it was allowed to do it — `autonomy-governance` |
| The provenance *event* | The `sources.json` *record* — `source-provenance` |
| | Running the site's validators — `legal-site-qa` |

## The surface

```js
import { Tracer } from '../observability/tracer.mjs';

const tracer = new Tracer({ service: 'eu-digital-policy' });
const run   = tracer.startRun({ agent: 'orchestrator', task: '…' });
const scout = run.startAgent({ agent: 'scout', task: '…' });

await scout.step({ name: 'eurlex.fetch', inputs: { url } }, async (span) => { … });

scout.observe({ summary: '…', subject: '…', data: {…}, confidence: 0.8, risk: 'low' });
scout.provenance({ source_id, role: 'official', url, title, publisher, locator,
                   retrieved_at, quote, verification: { method, verdict, checked_by, note },
                   claim_ids: ['clm-…'] });
scout.decide({ decision: '…', rationale: '…', alternatives: ['…'] });
scout.artifact({ artifact_id, artifact_type: 'candidate-set', sha256 });
scout.handoff({ to_agent: 'verifier', artifact_ids: [...] });
scout.approval({ approval_id, state: 'requested', subject, requested_of: 'author', risk });
scout.websiteChange({ files, decision_ids, provenance_ids, approval_ids, status: 'proposed' });
scout.end({ status: 'ok', outputs, confidence: 0.8, risk: 'low' });
```

Reading it back:

```
node agent/observability/cli.mjs list
node agent/observability/cli.mjs show <trace-id>
node agent/observability/cli.mjs chain --file data/instruments.json
node agent/observability/cli.mjs validate
node agent/observability/cli.mjs serve          # http://127.0.0.1:7801
```

## The rules that make it worth having

**An observation is not a log line.** The layer offers no logging call at all. Every
meaningful operation writes a structured claim — subject, summary, data, confidence, risk,
refs — that can be counted, graded and disagreed with later. `console.log` is not the
observability mechanism.

**Use `step()` rather than remembering to catch.** It closes the span either way and turns a
throw into an `error` record and a `failed` span. A span left open reads as running, which is
what it is.

**A decision without its rejected alternatives is indistinguishable from an accident.**
Record what was not chosen.

**Provenance needs a `url` or a `locator`.** The schema refuses a record with neither unless
it is marked `simulated`, and **nothing outside `demo/workflow.mjs` may be marked simulated**.
A source nobody can go and look at is not a source. `role` uses the same vocabulary as the
site's claim sourcing so the ledger reconciles with the bibliography.

**A human approval is a first-class state.** `requested` with nothing after it is pending, and
the viewer keeps pending approvals on screen whichever trace is open. Anything amber or red
under `docs/AI-SAFE-BOUNDARIES.md` is emitted as an approval request, not assumed.

**Redaction happens on the way in**, at the sink, by key and by value, with the count written
onto every record. Do not move it to the read path: a store written clean cannot be
un-redacted later.

**A missing link is reported, never omitted.** `chain` prints its own `GAPS`. A chain that
hides its missing link reads as an audit and is worse than no chain — the same discipline as
the asterisk in the running text.

**Nothing derived is stored.** Rollups, `degraded` status and the tree are computed in
`query.mjs` at read time.

## Extending it

A new record type means extending `agent/observability/schema.mjs` **and its tests in the
same commit**. A record type the validator does not know is a record the viewer will not
render. Do not change the id shapes in `ids.mjs` — they are the OTLP export contract.

## Done when

- `node --test agent/observability/selftest.mjs` passes.
- `node agent/observability/cli.mjs validate` reports 0 invalid, 0 unparseable.
- The run appears in the viewer with its provenance, decisions and any open handoff.
- `chain` answers source → verification → decision → implementation → deployment, or names
  the gaps.

## Refusal conditions

- Do not mark a real record `simulated`, and do not remove the demonstrator's simulation
  markers or point it at a real source.
- Do not commit anything under `agent/observability/runs/` — it holds run inputs and outputs
  and is git-ignored.
- Do not add a second logging path, and do not install Langfuse or Phoenix without re-reading
  the evaluation in `docs/OBSERVABILITY.md`.
- Do not emit a provenance record for a document that was not retrieved.
