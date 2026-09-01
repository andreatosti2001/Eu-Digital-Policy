---
name: source-provenance
description: Record where a fact came from — sources.json records, tier assignment, the supports qualifier, and the provenance event in the observability layer. Use after retrieving a document and before attaching it to a claim.
---

# source-provenance

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 applies in full and is not restated here.

## Purpose

Turn a retrieved document into a provenance trail that a reader — or an auditor six months
from now — can walk back. This skill owns the *shape* of that trail: the source record, the
tier, the `supports` qualifier, and the `provenance` event an instrumented agent emits.

## When to invoke

Creating or updating a `data/sources.json` record; attaching a source to a claim, timeline
event, enforcement record, instrument or competence; emitting `span.provenance(...)` from an
agent.

## Scope boundary

| This skill | Not this skill |
|---|---|
| The record: fields, tier, `supports`, `url_status` | Finding the document — `eu-legal-research` |
| Whether the trail is *complete* and honest | Whether the source *establishes the proposition* — `legal-source-verification` |
| | Whether the edit is permitted — `data-governance` |

## The three fields that carry the weight

**`tier`** — what kind of authority this is, not how convincing it is. The four terms and
their definitions live in `data/taxonomy.json` under `source_tier`; read them there. Tier is
a property of the publisher and document type, never of how well it happens to fit the claim.

**`supports`** — the relation between *this source* and *this claim*, stored on the reference
inside `claims.json`, not on the source. `direct` = the source states the proposition.
`partial` = it establishes part of it, a narrower case, or the components it is computed
from. `context` = it informs the claim without establishing it, **and is not a citation**.
The evidence grade is derived from the strongest *external direct* source only, so an
optimistic `supports` value silently upgrades the site's confidence. This is the single most
tempting field in the repository to get wrong.

**`url_status`** — whether a reader can reach it. Not a formality: three sources in this
repository carry no URL, and `tools/freshness.mjs` reports them grouped by *why*, because
"URL not located" is fixable and "publication not identified" is not.

## Procedure

1. **Look for an existing record first.** One record per document —
   `data/sources.json:$description` states it, and `tools/validate.mjs` §2 enforces unique
   IDs. A second record for the same document is a second home for a fact.
2. **Fill every field from the retrieved document**, using the template in
   `references/source-record.md`. A field you cannot fill is `null`, never a guess.
3. **Assign the tier from the publisher and document type**, not from the claim it is about
   to support.
4. **Attach it with an honest `supports`.** When in doubt between `direct` and `partial`,
   take `partial`. Between `partial` and `context`, take `context`.
5. **Never use `src-brief-original` as evidence.** It is the self-reference placeholder; a
   claim resting only on it is unverified by definition, and its `verification_note` must say
   so.
6. **When an agent did the retrieval, emit the provenance record** —
   `span.provenance({ source_id, role, url, title, publisher, locator, retrieved_at,
   content_sha256, quote, verification, claim_ids })`. `role` uses the same vocabulary as
   the site's claim sourcing so the two reconcile; see the `observability` skill.
7. Run `node tools/validate.mjs` — expect 0 errors — then `node tools/freshness.mjs` and read
   the source-reachability section.

## Done when

- Exactly one record exists per document, and `validate.mjs` reports 0 errors.
- Every field is either read from the document or explicitly `null`.
- The `supports` value would survive being read aloud next to the source and the claim.
- `freshness.mjs` shows no new `url:none` that has not been explained.

## Refusal conditions

- Do not create a source record for a document that was not retrieved and read. This is a RED
  action under `docs/AI-SAFE-BOUNDARIES.md` §3.
- Do not upgrade a `supports` value to close a grading gap. That is the substitute failure
  wearing a different hat.
- Do not mark `url:live` for a URL you did not load.
- Do not describe one document twice under two IDs.
