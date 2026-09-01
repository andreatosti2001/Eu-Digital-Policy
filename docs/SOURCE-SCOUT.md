# The Source Scout

Agent 1. The first agent this project has actually built.

It answers one question — *what has been published that bears on the
instruments this repository tracks?* — and it answers it in the only form the
contracts allow: findings that say what was read, what was concluded, whose
reading is whose, and what is still open.

```
node agent/scout/cli.mjs --mock        # the fixture corpus
node agent/scout/cli.mjs --live        # the registered real endpoints
```

---

## Where this sits

Read `docs/AI-SAFE-BOUNDARIES.md`, `docs/OBSERVABILITY.md` and
`docs/AGENT-CONTRACTS.md` first; this document assumes all three.

The Scout is **green tier** in what it does — it reads, and changes nothing —
and it produces records *about* amber and red material. That distinction is the
whole shape of the agent: discovering that the EDPB published something is safe;
deciding that the corpus should now say so is not, and the Scout cannot do it.

## What it must not do, and cannot

| Prohibited | How it is prevented |
|---|---|
| publish | it has no publishing path; the CLI writes to a git-ignored store |
| modify a canonical fact | it never opens `data/*.json` for writing. The suite hashes the whole of `data/` around a full run and fails if a byte moves, and scans the module for a write call |
| create a `sources.json` record | a `SourceCandidate` is not a source. `state: "accepted"` requires a `VerificationRecord` id, and the Scout writes no verifications |
| generate a finished article | it emits four contract types, none of which carries prose for publication |
| silently update an existing record | it cannot update anything. Every emission is a new immutable record with its own id. Where a document already looks like one in the corpus, it **names** the match and stops |

## The priority hierarchy

The nine levels the brief specifies, in `AUTHORITY_CLASSES`
(`agent/schemas/types.mjs`). **The array order is the priority order** — rank is
derived from the index, so the ranking cannot disagree with itself:

```
1 EUR-Lex / Official Journal      6 other EU agencies
2 European Commission              7 national competent authorities
3 EDPB                             8 courts and judicial sources
4 EDPS                             9 secondary expert sources
5 ENISA
```

Secondary sources may be discovered, and are labelled
`authority:secondary-expert` when they are. A contract rule refuses a secondary
source that claims `tier:1` or `tier:2`, so "discovered but explicitly
classified" is enforced rather than trusted.

### Authority is not tier

Which evidence tier a document sits in is **not** a property of its publisher.
`data/taxonomy.json` puts "official Commission decisions and legislative
documents" in tier 1 and the Commission's other output in tier 2. So the
estimate takes the document type as well, the mapping is read out of the
taxonomy's own notes, and where neither settles it the answer is **null with a
stated reason** — never a plausible tier:

```
EUR-Lex, courts        → tier:1   the taxonomy names them
EDPB, EDPS, ENISA,
agencies, national     → tier:2   the taxonomy names them
Commission             → null     spans two tiers; document type not established
secondary expert       → null     tier 3 or tier 4; document type not established
```

## The four states, and how each is filled

This is the part that matters more than the crawling.

**fact** — the title, the publisher and the publication date, and *only* where
the document states them in a machine-readable field, each citing the retrieval
that read them.

**inference** — the authority class, concluded from the host that served the
document, with the method saying exactly that; and the evidence tier, concluded
from the taxonomy's definitions.

**interpretation** — the relevance: which instruments the Scout thinks the
document bears on, carrying the exact string that matched and how often, so a
reviewer can disagree on the evidence. Every search term comes from
`data/instruments.json` — a `short_name`, `full_name`, alias or CELEX number
already in the repository — so a match can be checked against the record it came
from. A match on a three-letter acronym alone is marked `contested: true`.

**unresolved** — everything else, and there is a lot of it by design:

- a document that states no date yields `publication_date: "unknown"` with
  `absence_kind: unknown_not_determinable` — the document *was* read and states
  none. It never yields a date taken from the URL or parsed out of prose;
- a document served by a host on no registered endpoint yields
  `authority_class: null` and a question, never a quiet "secondary";
- `source_type` is always null with `null_not_researched`: the Scout does not
  classify document type, and says so rather than guessing;
- a refused retrieval yields a `DataGap`, never silence.

### Being served by a host is not a publisher

`extract.mjs` reads the publisher from what the document says about itself
(`og:site_name`, `DC.publisher`, and similar) and from nowhere else. "Served by
`enisa.europa.eu`" is a fact about a server; "published by ENISA" is a fact about
a document. The first becomes an *inference* about the authority class; it never
becomes a *fact* about the publisher. A fixture exercises exactly this: an
ENISA-hosted page that names no publisher comes out with `publisher: null`,
`authority_class: authority:enisa`, and an open question.

## Duplicates are named, never resolved

A regulator publishes one document at several addresses. Three tests, graded by
what they prove: identical bytes (proof), addresses that normalise to the same
URL (proof of a weaker kind), identical titles (**a suggestion, and reported as
one**). The Scout names duplicates in both directions and records an open
question about which to keep. Choosing is a change to the corpus, and this agent
is read-only.

## Mocked first, then live

`fixtures.mjs` is a corpus of seven simulated documents on `.invalid` hosts,
built before the live transport, covering: a listing page; a fully described
document; one that states no date; the same document at a second address; one
about nothing in this corpus; a refused endpoint; and a secondary source. An
agent developed straight against live regulators is an agent whose behaviour on
the awkward cases is whatever happened to occur on the day.

Every record from a mock run is `simulated: true`, and
`agent/schemas/validate.mjs` refuses a simulated record as actionable. The
simulated flag comes from the transport, so a live run cannot produce one.

## FINDING — live retrieval is refused by this environment

All five registered endpoints answer **HTTP 403 on CONNECT** at the egress
proxy: `eur-lex.europa.eu`, `digital-strategy.ec.europa.eu`,
`www.edpb.europa.eu`, `www.edps.europa.eu`, `www.enisa.europa.eu`. The proxy's
own status endpoint records the denials, and its documentation says not to retry
or route around them.

The live path is fully built and was run. It produces:

```
0 candidate(s) · 5 gap(s) · 5 retrieval attempt(s)
5 retrieval(s) refused before reaching the origin
```

Each gap carries the real reason (`proxy answered 403 to CONNECT
eur-lex.europa.eu:443`), states that this is *this environment's egress policy
and not a statement about the document*, and names what would close it. Nothing
was invented to make the demonstration look better. **No claim is made in this
repository about what any of those sites currently publishes.**

The registry entries are marked `endpoint_verified: false` for the same reason:
they are addresses the Scout will attempt, not citations, and nothing in this
repository has confirmed that any of them is the right place to look.

## Contract changes this agent forced

SESSION 04 predicted the first real agent would find the contracts the wrong
shape. It found four things, and each was changed in the contract with its
tests, not routed around:

1. **`authority_class`** on `SourceCandidate` — the brief requires an issuing
   authority, and `publisher` could not carry it without collapsing the
   fact/inference distinction above. Typed `inference`, nullable, with a rule
   that a null one must be declared rather than defaulted to secondary.
2. **`duplicate_candidate_ids`** — `matches_existing_source_id` covers "this is
   already in `sources.json`"; it had nothing for "these two candidates are the
   same document".
3. **`confidence`** — the envelope carries it only on proposals; a finding needs
   one too.
4. **`gap_kind: retrieval_blocked`** on `DataGap` — the vocabulary had
   `missing_source` (nobody knows where to look) but nothing for *the address is
   known, retrieval was attempted, and it failed*. A rule ties it to
   `absence_kind: null_not_researched`: a document nobody could reach has not
   been read, which is not the same as one that was read and found wanting.

**Two fields the brief asked for were deliberately not added.** The retrieval
date and the content fingerprint live on the evidence entry that records the
retrieval — `evidence[].retrieved_at` and `evidence[].checksum` — because they
are properties of the act of fetching, not of the document. Both are on the
record; they are one level down, on the thing they describe. A test asserts the
top-level fields do not exist.

## Where the records live

`agent/records/<trace_id>.jsonl`, append-only, one JSON object per line —
the same shape as the trace store, and git-ignored for the same reason: these
are run artifacts, regenerable, and not canonical. **It is not `data/`**, which
is the legal record and which nothing reaches without a human. Every record is
validated on the way in; the store throws rather than accept one that is invalid.

This closes the storage question SESSION 04 left open.

## Confidence

Stated as a formula rather than a feeling, so two candidates with the same
evidence get the same number:

```
0.30  it fetched something
+0.15 the document names itself          +0.15 it says who published it
+0.15 it says when                       +0.15 the host is on the registry
+0.10 an instrument matched by CELEX     (+0.05 by full title)
```

capped at **0.95**, never 1: the Scout has verified nothing.

## Files

```
agent/scout/authorities.mjs   the hierarchy, the endpoint registry, tier estimation
agent/scout/transport.mjs     the retrieval boundary — real HTTP and the mock
agent/scout/extract.mjs       what can honestly be read off a page
agent/scout/dedupe.mjs        the same document, twice
agent/scout/store.mjs         where a contract record lives
agent/scout/scout.mjs         the agent
agent/scout/fixtures.mjs      the mocked corpus
agent/scout/cli.mjs           --mock / --live / --dry
agent/scout/selftest.mjs      30 tests
```

## Checks

```
node --test agent/scout/selftest.mjs      # 30 tests, no network
node --test agent/schemas/selftest.mjs    # 67 — includes the contract changes above
node --test agent/observability/selftest.mjs
node agent/schemas/cli.mjs check
```

The four validators in `tools/` are untouched by this agent and their output is
byte-identical to the `docs/CURRENT-ARCHITECTURE.md` §12 baseline.

## Known limitations

1. **Nothing has been retrieved from a real source**, so no candidate in this
   repository has ever been produced from a real document. The live path is
   built, instrumented and exercised; it has only ever returned refusals.
2. **The endpoint registry is five root URLs, none verified.** They are
   hypotheses about where to look. A working live run would very likely show
   that a listing page is the wrong entry point and that each authority needs
   its own feed.
3. **Link-following is one level deep** and capped at four documents per
   endpoint. This is a discovery sketch, not a crawler, and it has no notion of
   what it saw last time — change detection is a different agent.
4. **Relevance is string matching.** It will match a document that mentions the
   DSA in passing and miss one that discusses it without naming it. The matched
   string is recorded so the judgment is checkable, and `contested` is set when
   only an acronym matched, but it remains the weakest part of the agent.
5. **`source_type` is never established**, so the tier estimate is null for the
   Commission and for every secondary source. Classifying document type is the
   obvious next increment.
6. **Duplicate detection is within a single run.** It does not compare against
   `data/sources.json`, so `matches_existing_source_id` is always null.
7. **The governance check keys off `affected_entities`**, which the contracts use
   to mean "what this record is about". For a read-only run those are not the
   same thing, and the `AgentRun` therefore records no affected entities — true,
   but it means the check cannot distinguish "about the legal record" from
   "changes the legal record". See the handover.
8. **No robots.txt handling.** The transport is polite — one request at a time,
   a one-second pause, a descriptive user agent, a byte cap — but it does not
   read `robots.txt`. Before any sustained live use, it should.
