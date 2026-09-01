# What can go stale in this corpus, and what would show it

Ordered by reader harm. Each row: the surface, why it decays, and the check.

| Surface | Why it moves | Check |
|---|---|---|
| **Forthcoming dates in `timeline.json`** | A date passes, or an instrument's application is postponed | `freshness.mjs` lists events that have passed since the last verification, and the next ones due. A postponement is an amending act — it changes the instrument, not just the date |
| **`legislative_status` on an instrument** | A proposal is adopted; an act becomes applicable, or partly so | The instrument's own record on EUR-Lex. Note that `$note` in `instruments.json` warns that status is deliberately **not** sufficient on its own: `milestones` is authoritative for staggered instruments |
| **Appeal state in `enforcement.json`** | An appeal is lodged, decided, or the fine annulled or reduced | 9 of 16 records are currently appeal pending or unknown. The court's own record settles it |
| **Payment and remedy state** | Money moves, or behaviour changes, long after the decision | 7 of 16 are payment-unknown. `unknown` here is a researched state — do not convert it to a value without a document |
| **Negative records** | A record asserting an *absence* is true only at an instant | `enf-hungary-commission-none` is one. Every negative record needs an as-at date and a recheck cadence |
| **Transposition state of directives** | Member States transpose late, or are referred to the Court | Commission infringement record. Only positions actually established are recorded — absence of a per-state row is not a claim that a state has not transposed |
| **Designations** | New gatekeepers, VLOPs, VLOSEs are designated and some are removed | The Commission's own designation register |
| **Applicability rules** | A rule written against a provision that has since been amended | `applicability.json` rules referencing a provision whose instrument has changed status |
| **`url_status`** | Links rot, move, or go behind a paywall | `freshness.mjs` reports reachability; a `url:live` recorded long ago is a claim about the past |
| **Provisional and placeholder records** | They were always meant to be replaced | `validate.mjs` lists them; `freshness.mjs` counts "preliminary / announced only" |

## The record types that must not be "updated" quietly

- **A placeholder** (`enf-nis2-first-fines` is one) is replaced by a real record with an
  entity, a date, an amount and an authority — or it stays a placeholder. Filling in a
  plausible entity is the substitute failure.
- **A claim whose premise decayed.** `clm-enforcement-asymmetry` records in its own note that
  it rests on a time-sensitive premise. When the premise moves, the claim is the author's to
  revisit, not an agent's to patch.
- **A month-precision date** does not become a day-precision date because a secondary source
  gives one. `date_precision` records what is *published*.

## Cadence

There is no scheduler in this repository. A watch run is a session, and its output is a
candidate list plus a handoff. The as-at date belongs on the report, because a candidate list
without one cannot be told apart from a stale candidate list.
