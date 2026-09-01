---
name: legal-source-verification
description: Check whether a retrieved source actually establishes the proposition a record asserts, and write the verification outcome honestly. Use before setting last_verified, before clearing a verification_note, and on any claim graded Unresolved.
---

# legal-source-verification

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 applies in full and is not restated here.

## Purpose

The act of checking. A source is attached; the question this skill answers is whether it
*says what the record says it says*, and — when it does not — what exactly is still missing.

This is the skill that keeps the site's central promise. Everything else can be redone; a
verification recorded that did not happen cannot be detected by any tool in this repository.

## When to invoke

Setting or refreshing `last_verified`. Proposing to remove or reword a `verification_note`,
a `reference_gap`, or an asterisk in the prose. Working any of the 106 unverified records.
Reviewing a claim that grades **Unresolved**.

## Scope boundary

| This skill | Not this skill |
|---|---|
| Does this document establish this proposition? | Finding the document — `eu-legal-research` |
| The verdict, the note, the dates | The record's fields and tier — `source-provenance` |
| | Counting how many records are still unverified — `data-completeness` |

## The method

**Read the proposition as a set of assertions.** "The Irish DPC accounts for about
EUR 4.04 billion of cumulative GDPR fine value — roughly 57% of the total — and nine of the
ten largest fines" is three assertions, and in this repository exactly one of them is
sourced. Split before you check.

**Check each assertion against the document text**, at a locator you can state. Not against
the document's title, not against a summary of it, not against what the document is generally
known to say.

**Take one verdict per assertion:**

| Verdict | Meaning | Consequence |
|---|---|---|
| Established | The document states it, at a locator you recorded | `supports:direct` is available |
| Partly established | It states a component, a narrower case, or the inputs | `supports:partial`; the note says which part is open |
| Not established | The document does not carry it | The assertion stays unverified — do not attach the source as if it did |
| Contradicted | The document says otherwise | **Stop and escalate.** Do not edit the record |
| Unreachable | The document could not be retrieved or read | Record the attempt; nothing changes |

**The record's verdict is the weakest verdict of its assertions.** A statement that is 90%
sourced is not a sourced statement.

## Writing the outcome

- `last_verified` moves **only** for assertions actually re-read on that date. Moving it as
  housekeeping converts a compilation date into a false claim of checking — the README
  already names this as limitation 2 and it must not get worse.
- `verification_note` states **what is missing, specifically**: which assertion, and what
  document would settle it. "Requires verification" alone is weaker than the note it
  replaces. `references/verification-protocol.md` has the wording patterns already in use.
- `reference_gap` / `gap_note` mark a claim whose prose carries an asterisk. They are cleared
  by finding the publication the brief was pointing at — never by attaching a substitute.
- Where two sources disagree and the schema cannot hold the disagreement, **stop and ask**.
  Recording one and dropping the other is a decision about the law, and it is not an agent's
  to take.

## Done when

- Every assertion in the record has a verdict and a locator, or is recorded as open.
- `last_verified` reflects a reading that happened today, or was not touched.
- `node tools/validate.mjs` reports 0 errors, and the unverified count moved only by the
  records actually worked.
- The note would let the next session pick the work up without re-reading the source.

## Refusal conditions

- Do not clear a `verification_note`, a `reference_gap`, an asterisk or a
  `requires_verification` flag without a retrieved document. **RED** under
  `docs/AI-SAFE-BOUNDARIES.md` §3.
- Do not record a verification you did not perform, and do not carry an old `last_verified`
  forward through an edit.
- Do not resolve a contradiction between sources by choosing one.
- Do not change a `claim_type` to make a verification problem disappear. Reclassifying a fact
  as an interpretation is the highest-leverage edit in the repository and belongs to the
  author.
