# PROJECT CONTEXT

**Project:** The European Legal Framework for the Digital World
**Repository:** https://github.com/andreatosti2001/Eu-Digital-Policy
**Public site:** https://andreatosti2001.github.io/Eu-Digital-Policy/
**Document status:** written in SESSION 00 (reconnaissance). Reflects commit `7248290` on `main`.

---

## 1. What this project is

An analytical brief on the EU digital acquis — GDPR, DSA, DMA, AI Act, Data Act
and the cyber layer — published as a static website in which **the argument is
prose and everything the argument rests on is data**.

The distinguishing commitment is not the subject matter but the evidence
discipline. Every consequential statement in the brief exists as a record in
`data/claims.json`, typed, attached to sources, and graded by what those sources
can actually carry. The grade is *derived at render time*, never stored, so it
cannot drift away from the evidence it describes. Where nothing external
supports a statement, the site says so in the interface rather than quietly
looking confident.

This is a production website with a real reader-facing URL. It is not a
prototype and not a scaffold.

## 2. Provenance of the codebase

The repository is "vibe-coded" in origin but not casually built. It carries an
unusually explicit design record: `README.md` documents the architecture, the
data-model rules, the two CSS rules that exist because both already shipped as
bugs, and eight named limitations of the work. Several source files open with a
comment explaining the defect that motivated their existence.

That record is an asset. It means intent is recoverable from the repository
itself, and it means the project has a stated position on its own weaknesses.
An agent working here should extend that record, not flatten it.

## 3. Governing principles (inferred from the code and enforced by its tools)

These are not aspirations. Each is checked by a script in `tools/`.

1. **One home per fact.** If a date appears in two files, one of them is wrong.
   Instruments carry no dates — they reference timeline event IDs. Instruments
   carry no supervisor — competence is an edge in `institutions.json`.
   `tools/validate.mjs` §4 checks for duplicated canonical facts.
2. **Derivation over storage.** Competent authority, key dates, evidence grades
   and the eight-stage enforcement pipeline are all computed from the records at
   render time. Two copies cannot disagree if there is only one copy.
3. **Absence of knowledge is not a negative finding.** `null` (not researched)
   and `unknown` (researched, not publicly determinable) are different states
   and must never render alike. Unknown is never counted as zero. When no
   applicability rule covers a combination, the answer is NOT DETERMINED — never
   "probably not".
4. **Controlled vocabulary.** Every enum-valued field in every dataset resolves
   to one of 243 terms in `data/taxonomy.json`. Nothing elsewhere invents a
   label.
5. **A gap is closed by finding the source, never by attaching a plausible
   substitute.** An asterisk in the running text means the reference is missing,
   not that the statement is doubted. A loosely related substitute is worse than
   an admitted gap because it looks resolved.
6. **Status is never carried by hue alone**, and **a theme-dependent token is
   declared on `body`, never `:root`.** Both are checked by
   `tools/design-qa.mjs`; both have already shipped as bugs.
7. **Zero build, zero dependencies, zero third-party requests.** Typefaces are
   self-hosted. `design-qa.mjs` fails the build if a page adds an external
   stylesheet or script.

## 4. Factual vs. analytical content

The distinction is explicit in the data model, via the `claim_type` vocabulary
in `taxonomy.json`, and it drives how the interface renders each claim.

**Factual / verifiable** — must be evidence-backed, must never be authored from
model knowledge:
- Instrument identity, CELEX numbers, legislative status (`instruments.json`)
- Dates, event types, date precision (`timeline.json`)
- Provisions: article numbers and headings (`instruments.json`)
- Institutional competences, legal bases, exclusivity (`institutions.json`)
- Enforcement records: entity, authority, fine amounts, decision dates, appeal
  state (`enforcement.json`)
- Source records: publisher, title, URL, publication and access dates
  (`sources.json`)

**Analytical / editorial** — the author's own reading, and *correctly typed as
such* so the interface never renders it as binding law:
- Claims typed `interpretation`, `critique` or `forecast` in `claims.json`.
  These three share the "argument" family and are rendered differently from
  claims typed as law or fact.
- The brief's prose in `index.html` — the framing, the ordering, the argument.
- `rationale` text on applicability rules.

Sources can support the premises of an interpretation; they cannot settle its
conclusion. The data model encodes that: the `supports` qualifier on each source
reference (`direct` / `partial` / `context`) is the load-bearing field, and
`context` explicitly does not count as a citation.

## 5. Current evidence position (measured, not asserted)

Baseline from `node tools/validate.mjs` at commit `7248290`:

```
RECORDS  instruments=23  provisions=60  relationships=17  institutions=20
         competences=52  sources=77  claims=91  enforcement=16  timeline=42
         glossary=15  parts=14  applicability rules=33  taxonomy terms=243
ERRORS   0
WARNINGS 0
UNVERIFIED / REQUIRES VERIFICATION  106
```

106 records carry an explicit unverified or requires-verification note. That is
a declared state, not a defect: the validator reports it without failing, and
the bibliography page computes and displays the live tally on every load so no
document can drift from it. The README states the position plainly and this
document does not soften it.

## 6. Audience and stakes

The site addresses readers who may act on what it says about EU regulatory
obligations. The footer on all seven pages states that this is an independent,
non-affiliated project and that nothing here is legal advice. That statement is
written into the markup of every page rather than rendered by JavaScript,
because a statement of non-affiliation that only appears when JavaScript runs is
not a statement of non-affiliation.

The consequence for any agent: **fabricating a legal fact here is not a code
defect, it is a harm to a reader.** No citation, date, CELEX number, article
number, fine amount, regulatory status or source may be authored from model
knowledge. See `docs/AI-SAFE-BOUNDARIES.md`.

## 7. Licence position

No licence has been declared. Ordinary copyright applies to the analysis and the
datasets by default, and the footer says so rather than implying otherwise.
Quotations from and links to EU legal texts carry those documents' own reuse
terms, which this site neither extends nor restricts. **An agent must not
declare a licence on the author's behalf.**
