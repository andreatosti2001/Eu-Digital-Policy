# Data governance

**Status:** binding. Derived from the code and data in this repository as it
stood on 1 September 2026, and from `README.md`. It codifies the architecture
that already exists; it does not propose a new one.
**Companion documents:** `SOURCE-POLICY.md`, `VERIFICATION-POLICY.md`,
`AUTONOMY-POLICY.md`, `AGENT-CONTRACTS.md`, `AUDIT-2026-09-01.md`.

---

## 1. The two principles that govern everything

### 1.1 One home per fact

Every fact has exactly one canonical location. If it appears in two places, one
of them is wrong — not "a cache", not "a convenience copy". The homes:

| Fact | Canonical home |
|---|---|
| Controlled vocabulary — every label, status, type, role | `data/taxonomy.json` |
| Instruments, provisions, relationships, DNA slots | `data/instruments.json` |
| **Every date** | `data/timeline.json`, referenced by event ID |
| Bodies, competence edges, exclusivity, legal basis | `data/institutions.json` |
| Enforcement records, on three orthogonal axes plus appeal | `data/enforcement.json` |
| Assertions the brief makes, and what each source does for each | `data/claims.json` |
| The bibliography, tiered | `data/sources.json` |
| Applicability rules | `data/applicability.json` |
| Terms and their edges | `data/glossary.json` |
| Parts and the reading order | `data/brief.json` |
| Which locales ship, and every declared gap | `i18n/locales.json` |
| The deployed origin | `tools/_footer.mjs`, the `BASE` constant |
| The brief's prose | the markup of `index.html` |

Instruments carry **no dates**. They reference timeline events. `validate.mjs`
enforces this: an ISO date in an unexpected field on an instrument raises
`POSSIBLE DUPLICATE FACT`, and `supervisor`, `authority`, `competent_authority`,
`entry_into_force` and `application_date` on an instrument are hard errors.

### 1.2 Derivation over storage

If a value can be computed from the records, it is computed at render time and
never stored. Two copies cannot disagree if there is only one.

What is derived, and where the derivation lives — these are the load-bearing
functions of this project:

| Derived value | Function | Never stored |
|---|---|---|
| Evidence grade (5 grades) | `js/format.js` → `evidenceGrade()` | a `grade` field must never exist on a claim |
| Enforcement pipeline (8 stages) | `js/pipeline.js` → `derive()` | a `stage` field must never exist on a record |
| Competent authority for an instrument | `js/dna.js` → `authoritiesFor()` | see §1.1 — hard error if stored |
| Key dates on an instrument page | from `milestones[]` → timeline | see §1.1 |
| Grade tallies on the bibliography | `js/format.js` → `gradeTally()` | never typed into prose |
| Applicability outcome | `js/applies.js` → `evaluate()` | rules store an outcome; the *result* is computed |

**A derivation may not be duplicated into a second implementation.** If a second
view needs a graded claim, it imports `evidenceGrade`. This already has
precedent: `js/evidence-view.js` exists because the drawer and the instrument
page once described the same source differently.

---

## 2. Three states, and the prohibition on collapsing them

The project's entire argument rests on keeping these apart. No agent may merge
them, and no aggregate may silently drop one.

- **reached / known** — the record supports this.
- **not-reached / known-negative** — the record supports the *absence* of this.
- **unknown** — the record cannot settle it.

`UNKNOWN IS NEVER ZERO.` It is not counted as reached, not counted as
not-reached, and never summed into a total (`js/pipeline.js`). Every aggregate
returns the count it could not account for alongside the figure
(`aggregate()` returns `paymentUnknown`, `announcedUnknownAmount`, and per-stage
`unknown`).

Corollaries an agent must not violate:

- **Absence of a rule is not a negative finding.** `js/applies.js` returns
  *Not determined*, never "probably not". `validate.mjs` forbids any stored rule
  from claiming `outcome:undetermined` — only the engine may emit it.
- **An unanswered question downgrades, it never excludes.** A borderline case is
  shown with its downgrade reasons, not dropped.
- **A null field and the string `"unknown"` are different facts.** In
  `behavioural_outcome`, `null` means nobody looked; `"unknown"` means somebody
  looked and it is not knowable. Do not normalise them.
- **A negative record is true only at an instant.** `enf-hungary-commission-none`
  asserts an absence and carries `action_status: null` deliberately. Do not
  "fix" it by inventing a status.

---

## 3. Analytical interpretation is never mixed with factual or legal data

The claim type decides this, before sourcing is even considered
(`js/format.js`, `CLAIM_FAMILY`):

- `claim:law` and `claim:fact` → families `law` / `fact`. Gradeable by evidence.
- `claim:interpretation`, `claim:critique`, `claim:forecast` → family
  `argument`. **Always graded `interpretation`, however well sourced.** Sources
  support the premises; they cannot settle the conclusion.

An agent must never re-type a claim from `interpretation` to `fact` to raise its
grade. Grade is an output. Changing the input to improve the output is
falsification. If a claim is genuinely a statement of fact that was mistyped,
that is a Class C change (see `AUTONOMY-POLICY.md`) with the reasoning recorded.

The interface enforces the same separation — `family` drives the visual
treatment so an argument can never be rendered like binding law — and the
constitution requires that any new view preserves it.

---

## 4. Schema and ID discipline

- Every dataset carries `$schema_version`, `$description`, `$last_verified`.
  A structural change bumps `$schema_version`.
- IDs are stable and namespaced. A provision ID **must** begin with its
  instrument's ID plus `:` — `validate.mjs` errors otherwise (`gdpr:art-3`).
- IDs are global: `validate.mjs` errors on any duplicate across all datasets.
- **Do not introduce a second ID namespace.** `__CONTENT__.nodes` in
  `index.html` already uses `aiact`/`dataact` where the canonical IDs are
  `ai-act`/`data-act` (audit F-04). This is known debt, not a precedent. New
  code uses canonical IDs or a declared `aliases` entry.
- Wildcard references (`dpa-*`, `nca-*`, `dsc-*`, bare `*`) are a modelling
  device for classes of national bodies. `validate.mjs` cannot make them dangle
  (audit F-11), so they carry **no** referential guarantee. Adding one is a
  Class C change.

---

## 5. Known second homes — do not add to them

These violate §1.1 and are documented as debt so no agent mistakes them for
patterns to follow (audit F-04, F-14):

| Duplicate | Canonical | Guarded by |
|---|---|---|
| `__CONTENT__.nav[].title` in `index.html` | `data/brief.json` | **nothing** |
| `__CONTENT__.nodes[]` names/parts | `data/instruments.json` | **nothing** |
| `__CONTENT__.search[].text` | the markup of `index.html` | **nothing** |
| Footer + `<noscript>` × 7 pages | `tools/_footer.mjs` | `design-qa.mjs` (drift is an error) |
| Grade counts in `README.md` prose | derived by `gradeTally()` | **nothing** |
| "As of" date in README / footer / `__CONTENT__.meta.dateline` | — | **nothing** |

The footer duplication is **deliberate and correct**: a non-affiliation
statement that only appears when JavaScript runs is not a statement of
non-affiliation. It is duplicated *and* generated from one source *and* checked
for drift. That is the only acceptable shape for a duplicate in this repository:
**one generator, and a check that fails on divergence.** A duplicate with
neither is a defect.

An agent must not add a duplicate without both.

---

## 6. Localisation

`i18n/locales.json` is the single source of truth for which languages ship. A
language cannot be offered unless the register declares a file for it.

Every key a locale lacks must be declared as either:

- **`superseded`** — the English it translated no longer describes the site, so
  the translation was withdrawn; or
- **`pending_translation`** — new, not yet translated.

Undeclared gaps fail `i18n-audit.mjs`. Missing strings fall back to English and
are marked **EN** in the interface.

**Two things the audit found that agents must know:**

1. `superseded` is a claim about meaning, and **no tool can verify it**
   (audit F-05). The three locales already disagree about
   `annex-a.figcaption1`. Declaring a key superseded is therefore an editorial
   act, never an automated one.
2. **Editing English prose that carries a `data-i18n` key invalidates three
   translations.** The key must be declared `superseded` in *every* locale that
   holds a translation of the old text, in the same change. This is the failure
   phase 5 caught with the Annex A captions, and `_review10.mjs` exists partly
   to handle it.

## 7. Adding a dataset

New datasets are rare and are Class C. A new `data/*.json` file must:

1. carry the three `$` fields of §4;
2. be added to every relevant loop in `tools/validate.mjs` — `collectIds`,
   `checkDuplicates`, `checkRefs` — or it enters the repository unvalidated;
3. be added to `EXPECTED` in `tools/freshness.mjs` with a stated interval and a
   reason;
4. reference other datasets by ID, never by restating their fields.

`validate.mjs` parses every `.json` in `data/` but only *checks* the shapes it
knows by name. A new file with an unrecognised name **passes silently**. State
this in the change description.
