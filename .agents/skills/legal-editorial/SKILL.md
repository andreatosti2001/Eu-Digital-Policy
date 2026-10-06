---
name: legal-editorial
description: Write and correct the brief's prose without changing what it claims — the author's editorial standard, the house register, hedging discipline, asterisks, and the three homes an English string can have. Use before editing any sentence a reader sees, and before any style rewrite the author asks for.
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

## The agent that reads this prose, and what it may not do

`agent/proposals/editorial/` (Agent 7, `docs/EDITORIAL-AGENT.md`) is the only thing in this
repository that reads a sentence. It produces proposals in front of a human and **writes
nothing**: its one permitted edit is a substitution of one verified value for another inside a
sentence that already exists, and everything else it produces carries a null replacement.

If you are working through that agent, its refusals are this skill's rules in executable form
and nothing here overrides them. If you are editing by hand, its output is a queue and not a
work order.

## Whose text this is

**Editing the argument is the author's work.** An agent may correct a fact it has verified,
fix a typo, or repair a broken reference. It may not restructure a paragraph, change an
emphasis, add a claim, or improve a formulation it merely finds unconvincing. The distinction
is not stylistic: the prose and `data/claims.json` are two views of the same assertions, and
a rewritten sentence silently orphans its claim record.

**The one exception is a style rewrite the author asks for**, under the editorial standard and
the procedure below. It changes how a passage reads and nothing it asserts. Without that
instruction, the standard governs new prose only.

## The register

Read `references/house-register.md`. It has two parts.

- **Part A, the editorial standard** (the author, 6 October 2026): serious European policy
  analysis edited by a human. Precision, then clarity, then argument, then style; fact, then
  interpretation, then implication; criticism built from evidence rather than adjectives;
  informative titles; rationed contrast formulas, metaphors and em dashes.
- **Part B, the observed register**: declarative, unhedged where the evidence is solid,
  explicitly hedged where it is not, and never selling. The brief's characteristic move is to
  state the mechanism and then state its limit in the same breath. Part B also holds the
  hedging table.

**The one rule that outranks style:** confidence in the prose must match the grade of the
claim behind it. A sentence that reads as settled law over a claim graded *Unresolved* is a
defect, whatever else is right about it. Where the prose must be more confident than the
evidence, the fix is verification, not adverbs.

## The three homes of an English string

A correction in `index.html` is not finished when the page reads correctly.

1. **The markup** — the sentence as the reader sees it.
2. **`data/brief.json` `parts[]` — for a part title or dek only.** It holds each Part's
   title and dek beside the headings in the markup, and nothing keeps the two in step
   (`docs/CURRENT-ARCHITECTURE.md` §8). The brief's prose has no second copy: the
   `window.__CONTENT__` blob was removed on 30 Sep 2026 and `app.js` builds the contents,
   pagers and search index from the markup, so a corrected sentence is searchable as
   corrected. Do not add a copy back — `design-qa.mjs` fails a script holding a page's text.
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

## A style rewrite, on the author's instruction

Only when the author has asked for it, and one section at a time.

1. Record the section's claim set first: every `data-claim`, `data-record` and `data-prose`
   attribute, each `data-i18n` key, every asterisk, and the hedging markers from Part B's
   table that the section contains.
2. Rewrite to Part A. Each claim's sentence still asserts what its `claims.json` `statement`
   says, at the confidence its grade allows. A paragraph that is split keeps its attributes on
   the paragraph that carries the claim; never duplicate a `data-claim` to keep both halves
   linked.
3. Compare the claim set before and after. Any difference in attributes, asterisks or hedges
   that was not the author's explicit decision is reverted.
4. Every `data-i18n` key whose English changed is declared `superseded` in
   `i18n/locales.json` for each locale, or retranslated. A rewritten section can touch a dozen
   keys; that is the cost, and it is not skipped.
5. A changed Part title or dek changes in `data/brief.json` too, and in the tree, SVG and
   spine regions of the markup.
6. Run `node tools/i18n-audit.mjs`, `node tools/design-qa.mjs` and
   `node tools/evidence-audit.mjs`, and expect the recorded baseline. The evidence audit is
   the one that notices a passage which lost its registration.
7. Show the author the before and after of each paragraph. The prose is theirs, and the
   rewrite is a proposal until they accept it.

## Procedure

1. Read the sentence, then the claim record behind it, then the claim's grade.
2. Make the minimal edit. A correction changes what was wrong and nothing else.
3. Sweep the other homes (`data/brief.json` for a title or dek; the locales) and declare
   any superseded key.
4. `node tools/design-qa.mjs` and `node tools/i18n-audit.mjs` — expect the recorded baseline.
5. Read the full `git diff`. In prose, a diff that is larger than the correction is the
   finding.

## Done when

- The sentence's confidence matches the grade of its claim.
- All three homes agree, or the locale gap is declared `superseded`.
- `i18n-audit.mjs` reports 0 errors and 0 warnings; `design-qa.mjs` shows no new warning.
- The diff contains the correction and nothing else.

## Refusal conditions

- Do not rewrite the argument, reorder it, or add a statement the data does not carry. A style
  rewrite the author asked for changes how a passage reads, never what it claims.
- Do not remove an asterisk, a caveat, a stated limitation or a hedge that the evidence
  requires. **RED** under `docs/AI-SAFE-BOUNDARIES.md` §0.7.
- Do not alter the footer's non-affiliation, no-legal-advice or reuse text, in the markup or
  in `tools/_footer.mjs`.
- Do not correct an English string and leave the locales asserting the error.
