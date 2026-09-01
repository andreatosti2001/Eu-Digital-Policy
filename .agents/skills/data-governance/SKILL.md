---
name: data-governance
description: Rules for touching canonical data in Eu-Digital-Policy — data/*.json, claims, sources, evidence grading and the derivation layer. Use before any change that affects what the site asserts about EU law.
---

# data-governance

## Purpose

The site tells readers what EU law requires of them. A fabricated date, article number, fine
or regulatory status is not a code defect — it is a harm to a reader who may act on it. This
skill governs every change that alters what the site asserts.

## When to invoke

Before editing anything in `data/`, any claim or source record, the evidence grading rules,
the pipeline derivation, or any factual statement in the brief's prose.

## Scope boundary

This skill answers **may this value change, and what must accompany it**. Its siblings own the
steps around it: finding the document is `eu-legal-research`; checking that it establishes the
proposition is `legal-source-verification`; the source record and the `supports` qualifier are
`source-provenance`; where a fact belongs in the model is `knowledge-architecture`; measuring
what is still missing is `data-completeness`.

The prohibitions below are the one duplication this library keeps. They live canonically in
`docs/AI-SAFE-BOUNDARIES.md` §0 and are repeated here on purpose: this is the skill invoked at
the moment of highest risk, and a pointer costs a file read at exactly the wrong time.

## The absolute prohibitions

1. **Never fabricate a legal fact.** No citation, URL, date, CELEX number, article number,
   fine, publisher, court or status from model knowledge. If it was not read from a
   retrieved source, it does not go in the data.
2. **Never close an evidence gap with a plausible substitute.** A gap is closed by finding
   the publication the brief was pointing at and confirming it says what the brief says it
   says. A loose substitute is worse than an admitted gap because it looks resolved.
3. **`null` ≠ `unknown`.** Not researched vs researched-and-not-publicly-determinable. Never
   render them alike.
4. **Unknown is never zero.** Not in a total, a percentage, a pipeline stage or a chart.
5. **No rule ≠ no obligation.** Where no applicability rule matches, the answer is NOT
   DETERMINED — never "probably not".
6. **Never store a derived fact.** Grades, pipeline stages, competent authority and key
   dates are computed at render time.

## The structural rules

**One home per fact.** A date lives in `timeline.json` and is referenced by ID; instruments
carry no dates. Competence lives in `institutions.json` and nowhere else; instruments carry
no supervisor field. If you are about to write a fact that exists elsewhere, stop.

**Taxonomy is the enum authority.** Every enum-valued field resolves to one of the 243 terms
in `taxonomy.json`. New terms may be added; **existing IDs are never renamed**.

**The `supports` qualifier is load-bearing.** `direct` = the source states the proposition.
`partial` = it establishes part of it, a narrower case, or the components it is computed
from. `context` = it informs the claim without establishing it and is **not a citation**.

**A claim's grade is derived** from its type and the tier of its strongest *direct* source.
A claim whose only source is `src-brief-original` is by definition unverified, and its
`verification_note` must say so.

**Every factual change carries:** a retrieved source, a `sources.json` record, an accurate
`last_verified`, and — where the fact is not settled — a `verification_note` stating exactly
what is missing.

## Requires human approval

Authoring or altering any legal fact; creating a source record; **changing a `claim_type`**
(the highest-leverage field in the repository); removing an asterisk, a
`requires_verification` flag or a `verification_note`; changing `TIER_GRADE` in
`js/format.js` or the rules in `js/pipeline.js`.

## Procedure

1. Read the target dataset's `$description` and `$note` first.
2. Make the minimal edit. Never reformat a whole JSON file — it hides the factual change in
   the diff.
3. Run `node tools/validate.mjs` — expect 0 errors — then the other three validators.
4. Read the full `git diff` line by line before committing.
5. If the edit changed English prose, check whether the string is duplicated in
   `window.__CONTENT__` (`index.html:361`) and whether the locale overlays must be declared
   `superseded`.

## Refusal conditions

Stop and ask the author when a fact cannot be verified against a retrievable source; when
sources disagree and the model cannot hold the disagreement; when the change would store
something the architecture derives; or when it would alter what a claim is said to prove.
