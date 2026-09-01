---
name: regulatory-change-detection
description: Detect when the EU legal position the site describes has moved — decayed dates, resolved appeals, new designations, superseded status — and report candidates without editing the data. Use for scheduled watches and before publishing anything time-sensitive.
---

# regulatory-change-detection

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 applies in full and is not restated here.

## Purpose

Everything on this site is true as at a date. This skill finds the records where the world
may have moved since that date, and produces **candidates** — never edits.

## When to invoke

A scheduled watch run. Before any publication that leans on a status, an appeal, a
transposition state or a forthcoming date. After a long gap between sessions. When
`tools/freshness.mjs` flags something past its interval.

## Scope boundary

| This skill | Not this skill |
|---|---|
| Noticing that a record may have decayed | Retrieving the document that proves it — `eu-legal-research` |
| Producing a ranked candidate list | Checking and recording the outcome — `legal-source-verification` |
| | Counting the corpus's standing gaps — `data-completeness` |

A candidate is a **question**, not a finding. It becomes a finding only after retrieval and
verification, and it becomes an edit only under `data-governance`.

## Procedure

1. **Start from the tool, not from memory.**
   ```
   node tools/freshness.mjs            # verification-date age, passed events, provisional records
   node tools/freshness.mjs 2027-01-01 # or as at any date, to see what is about to decay
   ```
   `freshness.mjs` already reports events that have passed, records whose own text says they
   are provisional, appeal-pending and payment-unknown counts, and source reachability.
   **Do not write a second script that recomputes any of this.**
2. **Work the decay surfaces** in `references/decay-surfaces.md`, which lists what in this
   data model can go stale and what would show it.
3. **Rank by reader harm, not by ease.** A stale applicability outcome or a wrong application
   date can change what a reader does. A stale token count cannot.
4. **Write each candidate as:** the record ID, what it currently asserts, what may have
   changed, the date the current position was last verified, what document would settle it,
   and the harm if it is wrong. Nothing else.
5. **Emit it, if instrumented.** `span.observe({ summary, subject, data, confidence, risk })`
   per candidate, and `span.handoff({ to_agent: 'verifier', artifact_ids })` to pass the set
   on. An open handoff is a visible queue entry; a candidate held in a session's head is not.
6. **Report the empty result.** "Nothing has decayed" is a finding and must be stated, with
   the as-at date. Silence is indistinguishable from not having looked.

## Done when

- Every surface in the reference has been swept, or the ones skipped are named.
- Each candidate names the document that would settle it.
- No file in `data/` was modified.
- The as-at date is stated on the report.

## Refusal conditions

- Do not edit `data/*.json` from this skill. Detection and amendment are separate acts, and
  the separation is what keeps an unverified "update" out of the corpus.
- Do not report a change you have not seen a document for. "The appeal has probably been
  decided by now" is not a candidate — the candidate is "the appeal state was last verified
  on *date* and has not been rechecked".
- Do not turn an absence of news into a negative finding. No visible change is not evidence
  that nothing changed.
- Do not let a candidate list quietly drop a record you could not check. Report it as
  unchecked.
