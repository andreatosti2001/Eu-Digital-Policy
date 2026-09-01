# The source record, field by field

The live shape is `data/sources.json`. Read a real record before writing one; the fields
below are the union actually in use.

```jsonc
{
  "id": "src-<publisher-slug>-<subject>-<year>",   // stable, never renamed
  "tier": "tier:1",                 // taxonomy source_tier — publisher + document type
  "type": "source-type:decision",   // taxonomy source_type
  "publisher": "ec",                // institution ID from institutions.json, or null
  "publisher_name": "European Commission",  // as printed on the document
  "title": "…",                     // the document's own title, verbatim
  "url": "https://…",               // the URL actually loaded, or null
  "url_status": "url:live",         // taxonomy url_status — see below
  "published": "2026-07-24",        // from the document, ISO
  "accessed": "2026-09-01",         // the date you loaded it
  "language": "en",
  "note": "…",                      // what this document does and does not settle
  "resolution": "…",                // only on records with no URL
  "resolution_note": "…"            // why the URL is missing, in the reader's terms
}
```

## Rules that are not visible in the shape

- **`publisher` is an ID; `publisher_name` is the printed name.** They are not
  interchangeable, and a publisher that is not an institution in `institutions.json` has
  `publisher: null` with the name still recorded.
- **`accessed` is the date of retrieval, not the date of the edit.** Backdating it, or
  carrying an old value forward through an edit, makes the freshness report lie.
- **`published` at reduced precision** follows the same convention as `timeline.json`: a
  month-only date is stored as the first of that month, and the imprecision is stated in
  `note`.
- **`note` is where the source says what it cannot support.** "Confirms the amount and the
  date; contains no ranking language" is a good note. It is what stops the next session
  re-reading the document to answer a question this one already answered.
- **A record with no URL needs `resolution` and `resolution_note`.**
  `tools/freshness.mjs` groups by `resolution`, and the three current values are
  `url-not-located` (findable by searching), `publication-not-identified` (cannot be fixed by
  finding a link) and `self-reference` (not a source at all).

## Choosing `supports` — the decision that is actually hard

`supports` lives on the reference inside `data/claims.json`, not on the source record.

| Ask | Answer | Value |
|---|---|---|
| Does the document assert this exact proposition? | yes | `supports:direct` |
| Does it assert a narrower case, one component, or the inputs the number is computed from? | yes | `supports:partial` |
| Does it merely bear on the subject? | yes | `supports:context` |
| Is it the brief itself (`src-brief-original`)? | — | not evidence at all |

Worked examples from records already in this repository:

- A Commission press release confirming a fine amount and its grounds, attached to a claim
  that states the amount → `direct`. Attached to a claim that the fine is the *largest to
  date* → `context`, because the release contains no ranking language. The repository
  records exactly this distinction on `enf-temu-ec-2026`.
- A Commission statement that letters of formal notice went to 23 Member States, attached to
  a claim that only four transposed on time → `partial`. The document establishes a related
  quantity, not the stated one.
- Analysis of a judgment, attached to a claim about what the judgment held → `partial` at
  best, and the `verification_note` says the judgment text itself has not been retrieved.

## The self-reference placeholder

`src-brief-original` exists so that a fact asserted by the brief alone still has traceable
provenance. It is `tier:4`, `url:none`, `resolution: self-reference`. Attaching it does not
close a gap; `js/format.js` excludes it from grading, so a claim whose only direct source is
this one grades **Unresolved** whatever else is attached as context. That is the intended
behaviour, and it must not be worked around.
