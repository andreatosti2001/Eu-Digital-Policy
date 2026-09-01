# The house register

Observed from the brief's own prose. This describes how the site already writes; it is not a
licence to rewrite anything into it.

## What the register does

**States the mechanism, then its limit, in the same breath.**

> The EU has no general competence to legislate on speech, safety or morality. What it has is
> Article 114 TFEU — the power to harmonise national rules that fragment the internal market.

**Names the consequence rather than gesturing at one.**

> The consequence is a persistent mismatch between the stated legal purpose (removing
> barriers to trade) and the actual regulatory ambition … That mismatch is the raw material
> for most litigation risk in the system.

**Distinguishes what happened from what was announced.** The whole enforcement section turns
on this distinction; "imposed" never implies "collected", in the prose any more than in
`enforcement.json`.

**Attributes an argument to whoever made it**, by name, and marks the author's own reading as
the author's.

## Conventions

- Em dashes set off a clarifying clause; en dashes for ranges.
- Instrument short names on first use in a part, then the abbreviation.
- Figures as printed in the source. An amount the source gives in millions does not become a
  decimal fraction of a billion.
- Dates spelled out in prose (17 October 2024), ISO in data.
- No exclamation marks, no rhetorical questions, no second-person instruction to the reader.
- No "simply", "just", "obviously", "of course" — every one of them asserts that a
  proposition needs no support.
- British spelling.

## Hedging, calibrated to the grade

| Claim grade | Prose that fits | Prose that does not |
|---|---|---|
| Primary / official | "Article 5(2) requires…" | "Article 5(2) appears to require…" |
| Secondary | "Analysis of the tracker corpus puts the figure at…" | "The figure is…" |
| Interpretation / critique | "This brief reads that as…", "The author argues…" | "In fact…", "Clearly…" |
| Unresolved | Say what is unestablished, or carry the asterisk | Any confident assertion |

A hedge is not a substitute for verification, and removing one is not an improvement in
style. Where the prose is more confident than the evidence, the entry point is
`legal-source-verification`, not the thesaurus.

## Error and empty states

The same discipline applies to interface text. `js/data.js:renderError` shows a clear failure
and **does not fabricate fallback data**; an empty result says which question returned
nothing. "Not determined" is the required wording where no applicability rule fired — never
"probably not", and never a blank.
