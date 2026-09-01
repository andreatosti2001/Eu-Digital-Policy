# The Scout

The first real agent in this repository. Given a statement already in the brief, it looks
for the sources that statement rests on and reports **what it found and what it did not**.

```
node agent/scout/cli.mjs claims             # which claims can be scouted, and what they cite
node agent/scout/cli.mjs run <claim-id>     # scout one claim
node agent/scout/cli.mjs show <trace-id>    # the contract records it stored
node --test agent/scout/selftest.mjs        # the suite
```

Reference documents: [`docs/AGENT-CONTRACTS.md`](../../docs/AGENT-CONTRACTS.md) for the
contracts it emits through, [`docs/OBSERVABILITY.md`](../../docs/OBSERVABILITY.md) for the
trace it is instrumented into.

## What it does

1. Reads the claim from `data/claims.json` — a real file, at a real locator.
2. Resolves every source the claim cites against `data/sources.json`.
3. **Actually attempts** an HTTP retrieval of each cited URL.
4. Emits, through `agent/schemas/gateway.mjs` and nothing else:
   - a `SourceCandidate` for each source it located,
   - a `DataGap` for each document it could not retrieve, and for each claim the corpus
     itself says has no external source,
   - `AgentObservation` records for what the run established,
   - an `AgentRun` for the run itself.
5. Stores them in `agent/runs/<trace_id>.jsonl` — git-ignored, appended, never rewritten.

## What it does not do

It does not **verify** — no `VerificationRecord`; that is the Verifier's contract, and an
agent that verifies its own findings has verified nothing. It does not **propose** — no
`*Proposal`, no `ChangeRecord`, no `WebsiteChange`. It does not write to `data/*.json`, and
above all it never creates a `sources.json` record: doing that from anything other than a
retrieved document is red tier under `docs/AI-SAFE-BOUNDARIES.md` §3.

## The distinction it exists to keep

Two things the Scout can establish, which are not the same thing:

| | evidence kind | what it establishes |
|---|---|---|
| what `data/sources.json` **records** about a document | `dataset_record` | a fact about the corpus |
| what the **document says** | `retrieved_document` | a fact about the world |

Only the first is available when retrieval fails. So a candidate emitted in that state cites
`dataset_record` evidence, states its facts as facts about the corpus in so many words,
carries `url_status: "url:unchecked"`, sets `tier_estimate: null`, and is filed as
`duplicate` of the source record it came from. It is not a new find and it must never read
as one.

## Network reality

Retrieval outcomes are classified rather than reduced to a boolean, because "could not
retrieve" collapses four states that mean different things:

| outcome | what it means |
|---|---|
| `retrieved` | the bytes are here, with a sha256 over them |
| `policy_denied` | **this environment's** egress policy refused the request — a fact about the agent, never about the source |
| `http_error` | the origin itself answered, and answered no |
| `network_error` | DNS, TLS, connection, timeout — nobody answered |

The `policy_denied` / `http_error` split is the one that matters most, and it is why
`retrieve.mjs` reads response headers rather than status codes alone. An egress proxy that
denies a request answers with the same `403` an origin uses to refuse a bot. Recording an
egress denial as though the publisher had turned us away would be a false statement about a
publisher, filed in a record that looks like research.

**In the environment SESSION 05 ran in, every outbound host was refused** — the egress proxy
answered `403` with `x-deny-reason: host_not_allowed` for EUR-Lex, for the live site, for
everything. So every retrieval gap recorded there is `policy_denied`, and no document was
opened. That is an honest result: a Scout that produces nothing because it could reach
nothing has reported correctly, and a Scout that produced plausible-looking sources instead
would be the failure this project is built against.

## Files

```
scout.mjs      the agent: the run, the records, and what it refuses to write
retrieve.mjs   one HTTP attempt, and an honest account of how it ended
corpus.mjs     read-only reads of data/*.json, with `recorded_*` naming kept deliberate
cli.mjs        claims · run · show
selftest.mjs   the suite
```
