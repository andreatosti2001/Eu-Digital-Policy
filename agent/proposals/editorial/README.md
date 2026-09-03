# agent/proposals/editorial — Agent 7, the Editorial Agent

The prose a verified change has made wrong, the prose it has only made *doubtful*, and the
prose it has left alone — kept apart, because they are three different claims.

The reference document is **`docs/EDITORIAL-AGENT.md`**. This file is the directory's own map.

```
node agent/proposals/editorial/cli.mjs --as-of 2026-09-03                       # the half that needs no input
node agent/proposals/editorial/cli.mjs --as-of 2026-09-03 --changes <trace-id>  # what a detector run stored
node agent/proposals/editorial/cli.mjs --as-of 2026-09-03 --mock                # the detector's fixtures, inline
node agent/proposals/editorial/cli.mjs --as-of 2026-09-03 --dry                 # nothing stored
node agent/proposals/editorial/cli.mjs --as-of 2026-09-03 --kind factual_update
node agent/proposals/editorial/cli.mjs --as-of 2026-09-03 --no-change           # names every sentence it cleared

node --test agent/proposals/editorial/selftest.mjs      # 61 tests, against the real pages and the real data/
node agent/observability/cli.mjs editorial [--no-change] # the run, off the trace
```

`--as-of` is required. A proposal quotes a sentence verbatim, and only a stated as-of date
says which version of the page it quoted (`docs/AUDIT-2026-09-01.md` F-15).

## The modules

| File | What it owns |
|---|---|
| `prose.mjs` | The site's prose, read as a structure: 387 authored blocks across seven pages and the three homes an English string can have. |
| `register.mjs` | FACT · INTERPRETATION · CRITIQUE · UNRESOLVED, for a *sentence*. Derived, never stored, and `not_attributed` where it cannot be derived. |
| `intake.mjs` | Only verified inputs, and a named reason on every refusal. |
| `staleness.mjs` | Certain contradiction, possible staleness, and the triage table between them. |
| `drafts.mjs` | The one edit this agent may compose, and the five cases where it refuses to. |
| `editorial.mjs` | The agent: the traced run that authors `EditorialProposal`s, `ApprovalRequest`s and the no-change `AgentObservation`s. |
| `drafts-dir.mjs` | Where a draft lives. |
| `cli.mjs` | The terminal report — intake, prose, proposals, no-change, refusals, in that order. |
| `selftest.mjs` | The suite, against the real pages and the real `data/`. |

## The six things to know before changing anything here

**1 · It writes no sentence, and the guarantee is arithmetic.** The only text this agent
composes is a substitution of one verified value for another inside a sentence that already
exists:

```
current.split(matched).join(replacement) === proposed,  and matched occurs exactly once
```

The suite asserts it over every draft a full run produces, along with the attribute
fingerprint and every caveat the sentence carried. Everything that is not a `factual_update`
carries a **null** `proposed`, and `EditorialProposal` refuses a record that does otherwise.

**2 · It never rewrites an argument.** A passage typed `interpretation` or `critique` whose
factual premise moved is flagged with what moved and where, and nothing is drafted. The
triage table in `staleness.mjs` throws **at module load** if any row ever routes an argument
to a correction, and the contract refuses one independently.

**3 · Contradiction and staleness are different claims.** A sentence that *states* the value
that moved is `contradicted` and the finding carries the sentence, quoted. A sentence that
merely depends on the record is `possibly_stale`, has nothing to quote, and is never edited.
`docs/REGULATORY-IMPACT-MAPPING.md` §5 settled this for prose inside `data/`; this is the
same rule applied to the sentences a reader reads.

**4 · "No change needed" is a deliverable.** It is an `AgentObservation`, not a proposal — a
proposal with no operations is a suggestion, and the contract requires at least one. A
sentence examined and found not to state the value that moved is reported *with the sentence
and the value it does not contain*, because "looked and found nothing" and "did not look" are
different findings everywhere else in this repository.

**5 · It fabricates no citation.** Every evidence entry it mints is a `repository_file`, a
`dataset_record` or an `agent_output`. `retrieved_document` is absent from `MINTABLE_EVIDENCE`
on purpose: a citation reaches a record here only by being carried across from the
verification that actually read the document, and `evidenceProblems()` refuses a record that
minted one.

**6 · It writes nothing to the site.** There is no write call to any page, any dataset or any
locale file in this directory; the suite scans every module for one, and a full run hashes
`data/`, all seven pages and all three locale files before and after. Drafts go to
`drafts/<trace-id>.jsonl`, which is git-ignored for the reason `agent/records/` is.
