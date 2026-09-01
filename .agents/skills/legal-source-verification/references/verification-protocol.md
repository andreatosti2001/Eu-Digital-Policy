# Verification protocol — verdicts, notes, and worked cases

## The note patterns already in use

Read these off the repository, not from this file; they are reproduced here so the register
is learnable in one place. All are live `verification_note` values.

**Partial support, with the gap named**

> PARTIAL SUPPORT. The Commission states that letters of formal notice went to 23 named
> Member States for failure to fully transpose by the deadline. 'Only four' is the arithmetic
> complement; no official source phrases it that way. The inference is sound but should be
> presented as derived.

What makes it good: it says what the source *does* establish, names the exact step the source
does not take, and states the consequence for how the claim should read.

**A figure confirmed, a derivation not**

> The EUR 4.04bn figure is confirmed against DLA Piper (January 2026). The derived 57% share
> and the "nine of the ten largest fines" ranking are NOT stated by that source and remain
> the brief's own arithmetic against a total from the same compilation.

**Nothing located, with the obvious next step**

> REQUIRES VERIFICATION. No external source located. The DPC annual reports are the obvious
> primary source.

**An attribution that cannot be resolved**

> REQUIRES VERIFICATION. The brief attributes the 40% figure to 'analysis published on the
> regulation's eighth anniversary' without naming it. Source not identified.

**A record that asserts an absence**

> A NEGATIVE record: it asserts the absence of enforcement, which is true only at an instant.

**A placeholder that must not be mistaken for a finding**

> PLACEHOLDER RECORD. The brief states that first NIS2 fines have landed in Belgium, Italy
> and Hungary, but names no entity, date, amount or authority.

## What a bad note looks like

- "Verified." — against what, at which locator, on what date?
- "Requires verification." — with no statement of which assertion or what would settle it.
- "Source confirms the claim." — when the source confirms one of three assertions.
- Any note that is *shorter and vaguer* than the one it replaces. Notes get more specific
  over time or they are not doing work.

## Recording a verification from an instrumented agent

The observability layer carries a verification block inside the provenance record:

```js
span.provenance({
  source_id, role, url, title, publisher, locator, retrieved_at,
  content_sha256, quote,
  verification: { method, verdict, checked_by, note },
  claim_ids: ['clm-…'],
});
```

`verdict` should use the same five words as the table in the skill — established, partly
established, not established, contradicted, unreachable — so the ledger and the
`verification_note` in `data/` say the same thing. See the `observability` skill for the rest
of the surface, and note that a provenance record with neither `url` nor `locator` is refused
by `agent/observability/schema.mjs` unless it is marked `simulated`.

## Two failure modes specific to this corpus

**Time-sensitivity.** Several records are true only at an instant — a pending appeal, an
absence of infringement proceedings, a transposition state. A verification of one of these
carries an expiry, and `regulatory-change-detection` is the skill that watches it. Say so in
the note; `clm-enforcement-asymmetry` already documents that it rests on a time-sensitive
premise.

**The document record versus the document.** A register's metadata can disagree with the
instrument's own final provisions. Where the fact is a date, read the text. One entry in
this repository records exactly this trap: an entry-into-force field that actually held the
application date.
