---
name: legal-editorial
description: Write and correct the brief's prose without changing what it claims — the house register, hedging discipline, asterisks, and the three homes an English string can have. Use before editing any sentence a reader sees.
---

# legal-editorial

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 applies in full and is not restated here.

## Purpose

The prose *is* the argument. This skill covers editing it: the register to write in, the
difference between a correction and a rewrite, and the three places one English sentence can
live.

## When to invoke

Editing any sentence in `index.html` or another page; writing a dek, a caption, a note or an
error message a reader sees; correcting a fact in the running text; changing a heading.

## Scope boundary

| This skill | Not this skill |
|---|---|
| How the sentence is written | Whether the fact in it is true — `legal-source-verification` |
| Register, hedging, asterisks | The `claims.json` record behind it — `data-governance` |
| The English string's three homes | The markup and locale machinery — `frontend-implementation` |

## Whose text this is

**Editing the argument is the author's work.** An agent may correct a fact it has verified,
fix a typo, or repair a broken reference. It may not restructure a paragraph, change an
emphasis, add a claim, or improve a formulation it merely finds unconvincing. The distinction
is not stylistic: the prose and `data/claims.json` are two views of the same assertions, and
a rewritten sentence silently orphans its claim record.

## The register

Read `references/house-register.md`. In summary: declarative, unhedged where the evidence is
solid, explicitly hedged where it is not, and never selling. The brief's characteristic move
is to state the mechanism and then state its limit in the same breath.

**The one rule that outranks style:** confidence in the prose must match the grade of the
claim behind it. A sentence that reads as settled law over a claim graded *Unresolved* is a
defect, whatever else is right about it. Where the prose must be more confident than the
evidence, the fix is verification, not adverbs.

## The three homes of an English string

A correction in `index.html` is not finished when the page reads correctly.

1. **The markup** — the sentence as the reader sees it.
2. **`window.__CONTENT__` at `index.html:361`** — a ~59.8 KB inline blob duplicating
   `data/brief.json` (`meta`, `nodes`, `nav`, `search`). Nothing loads `brief.json` at
   runtime and no validator compares the two; `meta.standfirst` has **already drifted**. If
   the string you edited appears there — in a nav entry, a dek, or the search index — it must
   be edited there too, or the search result and the contents overlay will assert the thing
   you just corrected.
3. **The locale overlays** — `i18n/it.json`, `fr.json`, `es.json` hold translations of the
   *previous* English. Correcting the English without declaring the key `superseded` in
   `i18n/locales.json` leaves three editions asserting the corrected error. This has already
   happened once.

Also check `data/claims.json` for the claim whose `statement` mirrors the sentence: if the
sentence changed what is asserted, the claim record changed too, and that is `data-governance`
work.

## Asterisks and gaps

An asterisk in the running text means **the reference is missing**, not that the statement is
doubted. It is removed by finding the publication the brief was pointing at — never by
attaching something related, and never by deleting the asterisk. The corresponding
`reference_gap` and `gap_note` in `claims.json` say exactly what is missing; keep the two
readings identical.

## Procedure

1. Read the sentence, then the claim record behind it, then the claim's grade.
2. Make the minimal edit. A correction changes what was wrong and nothing else.
3. Sweep the other two homes (`__CONTENT__`, locales) and declare any superseded key.
4. `node tools/design-qa.mjs` and `node tools/i18n-audit.mjs` — expect the recorded baseline.
5. Read the full `git diff`. In prose, a diff that is larger than the correction is the
   finding.

## Done when

- The sentence's confidence matches the grade of its claim.
- All three homes agree, or the locale gap is declared `superseded`.
- `i18n-audit.mjs` reports 0 errors and 0 warnings; `design-qa.mjs` shows no new warning.
- The diff contains the correction and nothing else.

## Refusal conditions

- Do not rewrite the argument, reorder it, or add a statement the data does not carry.
- Do not remove an asterisk, a caveat, a stated limitation or a hedge that the evidence
  requires. **RED** under `docs/AI-SAFE-BOUNDARIES.md` §0.7.
- Do not alter the footer's non-affiliation, no-legal-advice or reuse text, in the markup or
  in `tools/_footer.mjs`.
- Do not correct an English string and leave the locales asserting the error.
