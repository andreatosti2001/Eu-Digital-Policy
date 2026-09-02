# agent/integrate

The adapter between `VerificationRecord`s and the canonical datasets.

**It reads `data/` and never writes to it.** There is no code path here that
could: the suite hashes every file in `data/` around a full run and scans every
module in this directory for a write call. What comes out are contract
records — a `ClaimEvidence` link, a `DataProposal`, a `DataGap`, an
`ApprovalRequest`, an `AgentRun` — stored in git-ignored `agent/records/`.

**Nothing is merged.** Not the non-substantive proposals either. A human applies
a change or nobody does.

The reference document is **`docs/VERIFICATION-INTEGRATION.md`**. This file is
the map.

```
node agent/integrate/cli.mjs --mock --dry               # the adversarial corpus, storing nothing
node agent/integrate/cli.mjs --mock --as-of 2026-09-02
node agent/integrate/cli.mjs --records <trace-id> --as-of YYYY-MM-DD
node --test agent/integrate/selftest.mjs                # 61 tests, against the real data/
```

`--as-of` is required on the live path and has **no default**. Staleness is
measured against it, and nothing in this layer reads a clock for a judgement: a
report whose as-of date came from whenever it happened to run cannot be
reproduced (audit F-15).

## The modules

| File | What it owns |
|---|---|
| `canonical.mjs` | reading and indexing `data/`; the provenance field list; the one-home map |
| `match.mjs` | the matching arithmetic the two matchers share; the three outcomes; the thresholds |
| `claims.mjs` | **1** — find an existing claim before creating a new one |
| `sources.mjs` | **2** — find an existing source before creating a duplicate |
| `evidence.mjs` | **3** — attach evidence, at the qualifier the verdict supports and never a stronger one |
| `unsupported.mjs` | **4** — detect unsupported claims, without ever calling one false |
| `stale.mjs` | **5** — detect stale verification, against a stated as-of date |
| `conflicts.mjs` | **6** — detect conflicting evidence, and resolve none of it |
| `preserve.mjs` | **7** and **8** — IDs and provenance, checked against the corpus |
| `propose.mjs` | the proposal objects, and the four validators every one of them names |
| `adapter.mjs` | the run: intake, resolve, attach, then the four corpus-wide passes |
| `cli.mjs` | `--mock` / `--records`, and the report |
| `fixtures.mjs` | thirteen adversarial cases, with their real ids read out of `data/` |
| `selftest.mjs` | the suite |

## The three answers a matcher gives

`matched` · `ambiguous` · `no_match`. A matcher that only says yes or no forces
every close call into one of them, and both directions are damaging: a false yes
puts a citation under a sentence the source does not support; a false no writes a
second home for a record that already existed. **`ambiguous` is a correct
outcome**, and nothing here resolves one by taking the higher score.

## What it will not do

- resolve a conflict, or rank two authorities
- pick one of two candidates from an ambiguity
- strengthen a `supports` qualifier beyond what the verdict carries
- attach a source a claim already cites, or the same pair twice in one run
- create a source record from anything but a document actually fetched and read
- draft the text of a new claim
- mint an id in a namespace that is never renamed
- set `last_verified` on anything
- remove a `verification_note`, a `reference_gap` or a `requires_verification`
  flag
- read a clock

Each of those is a test, not a promise.
