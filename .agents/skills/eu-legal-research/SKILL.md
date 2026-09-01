---
name: eu-legal-research
description: Retrieve the actual EU legal document behind a statement — which register is authoritative for which kind of fact, and what to record on the way. Use when a fact needs a source found, before any verification or data edit.
---

# eu-legal-research

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 applies in full and is not restated here.

## Purpose

Find and retrieve the document a statement rests on. This skill covers **retrieval only** —
getting a real document in front of you, and knowing which document is the right one for the
kind of fact at hand.

## When to invoke

A claim, date, article number, fine, competence or status needs a source. A
`verification_note` says "no source located". A `url:none` or `url:unchecked` record needs
resolving. A candidate change surfaced by `regulatory-change-detection` needs its underlying
document.

## Scope boundary

| This skill | Not this skill |
|---|---|
| Finding and fetching the document | Checking whether it says what the brief says — `legal-source-verification` |
| Judging which register is authoritative | Writing the `sources.json` record — `source-provenance` |
| | Deciding whether the edit may be made at all — `data-governance` |

## Procedure

1. **Type the fact before searching.** The register that is authoritative depends on it. See
   `references/source-registers.md` for the authority table and the CELEX parsing aid.
2. **Search for the document, not for a summary of it.** A news article reporting a fine is
   tier 4; the authority's own decision or press release is tier 1 or 2. Stop at the
   strongest tier you can actually retrieve — never quote a stronger tier than you opened.
3. **Retrieve it.** Open the document. If outbound access is blocked or the fetch fails,
   **say so explicitly** and stop. A document you could not open is not a source, and the
   correct outcome is an unresolved gap, not a plausible substitute.
4. **Record, at retrieval time and from the document itself:** publisher, title as printed,
   publication date, the URL you actually loaded, the access date, and the locator (article,
   recital, paragraph, page) the fact sits at. Copy a short verbatim quote of the passage.
   None of these fields may be reconstructed later from memory.
5. **Note what the document does not settle.** Most retrievals answer part of a claim. Which
   part is left open is the input `legal-source-verification` needs.
6. **Hand off.** Retrieval ends with a candidate source plus quote plus locator. It does not
   end with an edit to `data/`.

## Done when

- The document was opened at a URL you can state, or the attempt is recorded as failed.
- A verbatim quote and a locator exist for the specific proposition in question.
- The register you used is the strongest one you could reach for that fact type.

## Refusal conditions

- Do not report a URL, CELEX number, publisher or date you did not read off the retrieved
  document.
- Do not substitute a related publication for the one the brief points at. If the brief names
  no publication, that is the finding.
- Do not describe a document behind a paywall you did not get through — record
  `url:paywalled` and say what remains unread.
- Do not treat a search-result snippet as retrieval of the document.
