---
name: knowledge-architecture
description: Decide where a fact belongs in the data model — one home per fact, taxonomy as enum authority, derivation over storage. Use before adding a field, a dataset, a taxonomy term, or a record type.
---

# knowledge-architecture

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 applies in full and is not restated here.

## Purpose

The *structure* of the knowledge, as distinct from its content. This skill answers: where
does this fact live, is it stored or derived, and what happens to everything that resolves
against it.

**An agent now asks part of this automatically.** `agent/architect/` (SESSION 13)
runs eight structural questions over `data/`, `js/` and the pages and emits
`ArchitectureProposal` records — it names a shape that cannot hold what the corpus is
saying and deliberately drafts no replacement, because that decision is the repository
owner's. `docs/KNOWLEDGE-ARCHITECTURE.md` has what it found and what it refuses. This
skill is still what a human or agent invokes to make the decision the agent stops short of.

## When to invoke

Adding a field to a dataset, a new dataset, a taxonomy term, or an event/record type. Being
tempted to copy a value from one file to another. Finding the same fact in two places.
Extending `agent/observability/schema.mjs`.

## Scope boundary

| This skill | Not this skill |
|---|---|
| Where a fact lives, and its shape | Whether the *value* is true — `legal-source-verification` |
| Whether to store or derive | Whether the edit is permitted — `data-governance` |
| The taxonomy as authority | Rendering the structure — `frontend-implementation` |

## The four structural rules

**1. One home per fact.** If a fact is already recorded somewhere, reference it by ID. The
existing applications: instruments carry no dates (only `milestones` → timeline IDs) and no
supervisor field (competence is an edge inside `institutions.json`); enforcement stores no
aggregate totals; a source is described once. `tools/validate.mjs` §4 checks duplicated
canonical facts — but it cannot see inside HTML, which is how the `__CONTENT__` bypass came
to exist.

**2. Derivation over storage.** Four facts are computed at render time and never stored:
evidence grade (`js/format.js`), the eight-stage enforcement pipeline (`js/pipeline.js`),
competent authority and key dates (`js/dna.js`). Adding a fifth derived view is green work;
storing any of these four is **RED**. Ask: *could this be computed from records that already
exist?* If yes, compute it.

**3. The taxonomy is the enum authority.** Every enum-valued field in every dataset resolves
to a term in `data/taxonomy.json`. Adding a term is amber; **renaming an existing ID is never
done** — every other dataset, every locale overlay's entity keys, and the observability
vocabulary resolve against them.

**4. Absence has a shape.** The model distinguishes not-researched (`null`) from
researched-and-not-determinable (`unknown`) from not-applicable (`…:na`) from no-rule-fired
(`outcome:undetermined`). A new field must say which absences it can express **before** it is
added, or it will collapse them.

## Procedure

1. **Find the fact's current home first.** Grep for the value, not the field name, across
   `data/`, `js/`, `i18n/` and inline `<script>` blocks in the HTML.
2. **Read the target dataset's `$description` and `$note`.** The non-obvious invariant lives
   in the `$note` — that is where "status is deliberately not sufficient on its own" and
   "`null` ≠ `unknown`" are written down.
3. **Test the addition against the four rules above**, in order. Most proposed fields fail
   rule 2.
4. **If it is a new enum value**, add the term to `taxonomy.json` with a `label` and, where
   the distinction is not self-evident, a `note`. Do not invent a label anywhere else.
5. **If it is a new dataset**, it needs `$schema_version`, `$description`, `$last_verified`
   and a `$note` stating the rule it exists to enforce, plus a `validate.mjs` section that
   checks that rule. A dataset no validator checks is a dataset that will drift.
6. **If it is an observability record type**, extend `agent/observability/schema.mjs` **and
   its tests in the same commit**. A record type the validator does not know is a record the
   viewer will not render.
7. Run `node tools/validate.mjs` and `node tools/i18n-audit.mjs`. A new entity-keyed field
   may need locale coverage.

## Done when

- The fact has exactly one home, and everything else references it by ID.
- Nothing derivable is stored.
- Every new enum value exists in `taxonomy.json`; no existing ID was renamed.
- The absences the field can express are stated in its `$note`.
- `validate.mjs` reports 0 errors and a check exists for the new rule.

## Refusal conditions

- Do not store a derived fact, and do not add a cache of one "for performance". **RED**.
- Do not rename a taxonomy ID. Add a term; deprecate in a note if needed.
- Do not resolve the `brief.json` / `__CONTENT__` duplication on your own initiative — which
  copy is correct is the author's decision, and it is recorded as an open issue.
- Do not add a field that makes `null` and `unknown` indistinguishable.
- Do not reformat a whole JSON file to accommodate a new field.
