# AI-SAFE BOUNDARIES

**Status:** written in SESSION 00. Governs any AI agent working in this repository.
**Read with:** `docs/PROJECT-CONTEXT.md` (why) and `docs/CURRENT-ARCHITECTURE.md` (what).

This site tells readers what EU law requires of them. A fabricated date, article number,
fine or regulatory status here is not a code defect — it is a harm to a reader who may act
on it. Every rule below follows from that.

---

## 0. The absolute prohibitions

These hold in every session, under every instruction, regardless of convenience.

1. **Never fabricate a legal fact.** No citation, URL, date, CELEX number, article number,
   fine amount, publisher, publication date, court, case number or regulatory status may be
   authored from model knowledge. If it was not read from a source, it does not go in the
   data.
2. **Never close an evidence gap with a plausible substitute.** An asterisk in the running
   text means the reference is missing, not that the statement is doubted. It is removed by
   *finding the publication the brief was pointing at and checking that it says what the
   brief says it says* — never by attaching something related. A loose substitute is worse
   than an admitted gap because it looks resolved.
3. **Never render `null` and `unknown` alike.** `null` = not researched. `unknown` =
   researched and not publicly determinable. They are different states.
4. **Never let unknown count as zero.** Not in a total, not in a percentage, not in a
   pipeline stage, not in a chart axis.
5. **Never turn an absence of a rule into a negative finding.** When no applicability rule
   covers a combination, the answer is NOT DETERMINED — never "probably not". Presenting
   absence of knowledge as a negative finding is the single most damaging thing this tool
   could do.
6. **Never store a derived fact.** Evidence grades, pipeline stages, competent authority and
   key dates are computed at render time. Storing one creates the second copy the whole
   architecture exists to prevent.
7. **Never soften a stated limitation.** The README's eight limitations and the
   106 unverified records are the project's honesty, not its backlog embarrassment. They are
   changed by doing the verification work, not by rewording.
8. **Never declare a licence**, and never alter the non-affiliation or no-legal-advice text.

---

## 1. GREEN — safe to automate

An agent may do these without prior human sign-off, provided the validators pass afterwards.

| Area | Scope |
|---|---|
| `docs/**` | Write and update project documentation, audits, handovers. |
| `.agents/skills/**` | Author and refine agent skills. |
| `tools/*.mjs` — **new** checks | Add validators. More checking is always safe. Adding a check that fails is a finding, not a regression. |
| New derived views | Render *existing* canonical records in a new way, using the existing derivation modules. No new stored facts. |
| Test scaffolding | Add a test runner, fixtures, CI that runs the existing validators. |
| Refactors within one module | Provided behaviour, output and the four validator results are unchanged. |

**Green is not "unreviewed".** It means the failure mode is a broken build, not a false
statement to a reader.

---

## 2. AMBER — permitted, but only with evidence and human review

These change what the site asserts. An agent may prepare them; a human must approve them.

| Area | Conditions |
|---|---|
| `data/*.json` — factual fields | Every new or changed value carries a real, retrieved source; a `sources.json` record; an accurate `last_verified`; and, where the fact is not settled, a `verification_note` that says exactly what is missing. Cite the source you actually read. |
| `data/claims.json` | A new claim must correspond to a statement already present in the prose. The `supports` qualifier must be honest: `context` is **not** a citation. |
| `data/taxonomy.json` | New terms may be added. **Existing IDs are never renamed** — every other dataset resolves against them. |
| `i18n/**` | Any added or removed `data-i18n` key must be reflected in the register, and any gap declared `superseded` or `pending_translation`. Never silently drop a key. |
| CSS | Only within existing tokens. A new colour goes in `css/tokens.css` in both themes, on `body` not `:root`, never inline. |
| Prose in `index.html` | Editing the argument is the author's work. An agent may correct a fact it has verified — and must then check whether the same string is duplicated in `window.__CONTENT__` (see §4) and whether the locale overlays now assert the superseded English. |
| `tools/_footer.mjs` `BASE` | Only if the site actually moves; re-run and confirm all seven canonical URLs agree. |

**The amber test:** if getting it wrong would make the site state something false, it is
amber or red. If getting it wrong would only break the page, it is green.

---

## 3. RED — human control only

An agent must **not** do these on its own initiative. Prepare a proposal; do not commit.

- **Authoring or altering any legal fact** — CELEX, article number, heading, date, fine
  amount, legislative status, competence, legal basis, appeal state.
- **Creating or editing a `sources.json` record** from anything other than a document
  actually retrieved and read.
- **Changing a `claim_type`.** Reclassifying an `interpretation` as a fact — or the reverse
  — changes what the site claims it can support. This is the highest-leverage field in the
  repository.
- **Removing an asterisk, a reference gap, a `requires_verification` flag or a
  `verification_note`.**
- **Changing the evidence grading rules** (`TIER_GRADE` in `js/format.js`) or the pipeline
  derivation rules (`js/pipeline.js`). These decide what the whole corpus is said to prove.
- **The footer's non-affiliation, no-legal-advice or reuse text**, in the markup or in
  `tools/_footer.mjs`.
- **Declaring a licence.**
- **Deleting or rewriting the README's "Known limitations" section.**
- **Architectural replacement** — introducing a framework, a build step, a bundler, a
  dependency, a service worker, server-side rendering, or a third-party script or
  stylesheet. All are currently absent by explicit design and `design-qa.mjs` fails on the
  last two.
- **Reformatting `data/*.json` wholesale.** A whole-file reformat hides a factual change in
  the diff. Keep diffs minimal and readable.

---

## 4. Known hazards

Traps that have already caused, or are positioned to cause, a false statement.

**The `__CONTENT__` bypass.** `index.html:361` inlines a ~59.8 KB blob duplicating
`data/brief.json` (`meta`, `nodes`, `nav`, `search`). Nothing loads `brief.json` at runtime;
no validator compares the two; and `meta.standfirst` has **already drifted** between them.
An agent editing brief prose or part metadata must check both homes, and must not assume
`brief.json` is what the reader sees. Full detail in `docs/CURRENT-ARCHITECTURE.md` §8.

**Superseded translations.** The `it`/`fr`/`es` overlays hold translations of the *previous*
English. Correcting an English string without declaring its key `superseded` leaves those
editions asserting the thing that was just corrected. This has already happened once (the
Annex A captions) and is the reason `tools/_review10.mjs` carries a warning comment about it.

**No deploy gate.** A push to `main` publishes. The validators do not run in CI — there is
no CI. Run all four by hand before every commit that touches data or markup.

**The validators do not check the prose.** `validate.mjs` sees `data/`; `design-qa.mjs` sees
markup structure. Neither reads a sentence. A false statement in `index.html` passes every
check in this repository.

**`null` vs `unknown` is invisible in a diff.** Changing one to the other is a one-character
edit that changes what the record asserts.

---

## 5. Required procedure

**Before changing anything**

1. Read `docs/PROJECT-CONTEXT.md`, `docs/CURRENT-ARCHITECTURE.md`, this file, and
   `docs/HANDOVER.md`.
2. Read the `$description` and `$note` of any dataset you intend to touch. The non-obvious
   invariant lives in the `$note`.
3. Run all four validators and record the output. That is your baseline.

**After changing anything**

```
node tools/validate.mjs        # expect 0 errors
node tools/i18n-audit.mjs      # expect 0 errors, 0 warnings
node tools/design-qa.mjs       # expect 0 errors
node tools/freshness.mjs       # read the report
git diff                       # read every line before committing
git status --porcelain         # confirm no unrelated file was touched
```

Compare against the baseline. **A new warning is a finding, not noise.** The five existing
`design-qa` warnings are listed in `docs/CURRENT-ARCHITECTURE.md` §12 precisely so a later
session can tell new from pre-existing.

**Report honestly.** Never state that a validator passed if it was not run. If something is
incomplete, say which part and why. The site's own argument is that a record should say what
it cannot support; a session report is held to the same standard.

---

## 6. When to stop and ask

Stop and put the question to the author when:

- A fact cannot be verified against a retrievable source.
- Two sources disagree and the data model has no way to hold the disagreement.
- The change would require storing something the architecture derives.
- The change would alter what a claim is said to prove.
- `docs/HANDOVER.md` conflicts with the code. **Report the discrepancy; do not reconcile it
  silently** — the repository is the source of truth, and a handover that has drifted is
  itself a finding.
- The instruction conflicts with a rule in §0.

An unanswered question is a smaller cost than a confident wrong answer. That is the site's
own thesis, and it applies to the agents working on it.
