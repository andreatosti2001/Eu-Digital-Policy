# HANDOVER

**Last updated:** v2 Session 11, the closing gate of v2. **The v2 is not closed**: the author decided
it stays open, with Phase 3 next (`docs/ROADMAP-v2.md` §8). The checkpoint is **approved** · 28 October
2026
**Branch:** `claude/v2-session-11-closing-gate`, cut from `main` at `17768c1`.

## Branch register — 28 October 2026 (v2 Session 11)

- Branch `claude/v2-session-11-closing-gate`, cut from `main` at `17768c1` (#33 and #34 merged). The
  prompt's branch, `claude/v2-session-11-prompt`, was already in `main` as #34, so nothing was merged
  in.
- Unmerged branches at the start, `git branch -r --no-merged origin/main`: only
  `origin/claude/v2-session-8-findings` and `origin/scout/digest-digest-2026-10-26T13-10-32Z`, both
  already in the register. No other branch to report.
- `origin/main` was re-fetched before this handover was written: still `17768c1`.
- Disposition: approved (`docs/ROADMAP-v2.md` §8, "Approve the checkpoint"); pushed, with a pull
  request to `main` opened on the author's instruction of 28 Oct 2026 ("Open PR to main"). Nothing is
  pushed to the branch after the pull request is opened.

## v2 Session 11 — checkpoint report (the closing gate of v2)

### What the author decided (`docs/ROADMAP-v2.md` §8, in the author's words)

- **The scope** (the session's first write, `5fec457`): the closing gate only, 11.1 and 11.2 in
  `docs/V2-CLOSURE.md`, then the questions of 11.0, then the checkpoint; only `docs/` written, nothing
  published changed. The author first answered "Gate, measurement only", then asked for the question
  again and answered "Closing gate only (Recommended)"; the row records both.
- **The seven questions** (`166bf44`), all as recommended:
  1. **The v2 stays open, and Phase 3 is next.** Post-v2 waits until after it.
  2. **The classes as proposed**: A 1, B 39, C 5, D 0, E 20.
  3. **V2C-01 stays A** (an edge from a proposal labelled in the present tense) and is fixed at its
     root, the derived modality, as **the first item of Phase 3**, before the check extension; **V2C-06
     and V2C-08** (F-4, F-6 on `applies.html`) stay B, Phase 3, recorded as meeting the A criterion.
  4. **No class D**; the README is unchanged.
  5. **D-4 and D-5 stay open**, tied to Phase 4.
  6. **Post-v2 is not opened**; it opens after the v2 closure is recorded.
  7. **S1–S3 written verbatim** (`48f7cec`): the roadmap's status paragraph, the `AGENTS.md` row for
     the roadmap and a new row for `docs/V2-CLOSURE.md`, the status line of `docs/V2-DATA-DESIGN.md`.
     V2C-44 (the deploy gate "to be confirmed") is left for a later documentation pass.

### What was written

| Commit | File | Change |
|---|---|---|
| `5fec457` | `docs/ROADMAP-v2.md` §8 | the scope row |
| `1d41c13` | `docs/V2-CLOSURE.md` | 11.1, the comparison; 11.2, the inventory |
| `80adfd6` | `docs/V2-CLOSURE.md` §3.1 | the exact before and after for question 7 |
| `166bf44` | `docs/ROADMAP-v2.md` §8 | the seven answers |
| `48f7cec` | `docs/ROADMAP-v2.md`, `AGENTS.md`, `docs/V2-DATA-DESIGN.md`, `docs/V2-CLOSURE.md` | S1–S3; the decision marked in `docs/V2-CLOSURE.md` |
| this commit | `docs/HANDOVER.md` | this report |

**No published file changed**: nothing under `data/`, `js/`, `css/`, `style.css`, the pages, `i18n/`,
`img/`, `tools/`, `agent/` or `.control-room/`. `AGENTS.md` is outside `docs/`; it was written only
with the text approved for question 7, and the five suites that read it were re-run (374 · 0).

### The comparison, in short (the detail is `docs/V2-CLOSURE.md` §1)

- **Executed**: Phases 0, 1 and 2 (items 0.1–2.6), each closed at a checkpoint in §8, and Session
  10's maintenance. **Every exit criterion of 0.1–2.6 re-run today passes**: each named test is `ok` in
  this session's run (SNAPSHOT 0.1, ATTEST 0.2, D1–D4, EDITORIAL 1.1, METRICS 1.2, INVENTORY 1.3, N1,
  W1–W18).
- **Not started**: Phases 3, 4, 5 and the finance chapter. **Phase 3's entry condition is not met**:
  0 of 33 rules with `supports` and a locator; 0 of 101 condition values resolving to a provision ID
  (the 77 obligations do resolve); `evidence-audit.mjs` checks no rule.
- **The brief**: the five principles are checkable and hold, with two halves not executed (the map's
  edges, P4/N5); the nine "do not" rules are respected, one by a departure the author decided (D-2,
  `applies.html` kept with a notice); of the decisions already taken, the inclusions, the finance
  condition, `stratum` and the sequence to Phase 2 are executed, while **the status labels (D-3) and
  the map's audit by `evidence-audit.mjs` are decided and not implemented** (Phase 3).
- **Checkpoint discipline**: every session's first write has the previous checkpoint commit as an
  ancestor. From Session 5 to 9 several decision rows were committed in the same commit as the change
  they authorise; the order then rests on the author's quoted words, not on git.

### The findings, with the class the author decided (`docs/V2-CLOSURE.md` §2)

| Class | Count | What |
|---|---|---|
| **A** | 1 | V2C-01: an edge from a proposal in the present tense ("Amends", "Repeals"; the DNA's "Related" list with no qualifier). Fixed first in Phase 3 |
| **B** | 39 | Phase 3: 20 (V2C-02–21: the entry condition, F-1…F-8, R-01, the 8 v1 edges, the map audit, the labels, `stratum`, modality, the DNA's acts, `nis2 → eidas`, the TTPA edges, the procedural event type, eIDAS2's actors). Evidence, data depth, translation: 4 (V2C-24–27). Maintenance: 9 (V2C-28–36). Post-v2 D: 1 (V2C-37). Phase 4: 3 (V2C-40, 41, 43). Status documents: 2 (V2C-44, 45; V2C-45 written in this session) |
| **C** | 5 | V2C-22 (the Coreper of 21 Oct 2026, Council site), V2C-23 (the AI Omnibus page, 403), V2C-38 (other browsers, devices, screen reader), V2C-39 (the `::1` test, IPv6 runner), V2C-42 (the Pages setting) |
| **D** | 0 | — |
| **E** | 20 | V2C-46–65, each with the commit that closed it |

**Corrections to earlier reports, measured in this session:**
- "member State" is on **5** generated pages (CSA, DNA, EHDS, eIDAS2, IEA), not 3 (Session 9).
- The undated source's `.”.` is in **31** bibliography entries, not only the OEIL procedure files
  (Session 9).
- The verification date's line break reaches the GDPR page too: the `<b>` inside `.fresh` renders
  `display: block`, so it predates Phase 2 (Session 9 had it unmeasured).
- The notice's "Read it at the source" link is the default blue in **both** themes; dark, about 2.0:1
  (Session 8 said the dark theme).
- F-1 has 2 unmatched entries left, not 4: `data-act` and `dga` gained edges in item 2.1.
- The deploy gate: GitHub Actions shows the legacy "pages build and deployment" last running on
  24 Oct 2026 (#14), and `pages.yml` deploying every push to `main` since, the last for #34. That is a
  deployment record; the Pages setting itself was not read (V2C-42).

### Counts against `main` (`17768c1`), before and after

| Measure | Before | After | Why |
|---|---|---|---|
| records (instruments / relationships / sources / claims / events / terms) | 39 / 40 / 225 / 181 / 101 / 312 | unchanged | no data change |
| `validate` errors / warnings / unverified | 0 / 0 / 45 | 0 / 0 / 45 | |
| `evidence-audit --as-of 2026-10-28` | 0 errors · 11 warnings · covered 16 · mapped 12 · watched 5 · excluded 6 | unchanged | |
| `freshness --as-of 2026-10-28` | 0 defects · 3 prompts | unchanged | the same date as Session 10's close; the prompts are the enforcement set's age (V2C-24) |
| `i18n-audit`, `design-qa`, `seo-audit` | 0/0 | 0/0 | |
| all 25 suites | 1314 pass + 1 skipped (`::1`) | **1314 pass + 1 skipped (`::1`, EAFNOSUPPORT), 0 failures** | no test added or changed. The skip is not a pass |
| browser suite (`--require-browser`) | 343 · 0 · 1 undecidable | 343 · 0 · 1 undecidable (`a11y:bound`) | the first "before" run exited 1 because `docs/V2-CLOSURE.md` was written while it ran; it was re-run on a still tree |
| adversarial gate | 65 · 0 · 3 · 1 | 65 · 0 · 3 · 1 | |
| `readiness` | refuses, 17 of 20 | refuses, 17 of 20 | blocking: `production_dispatcher_wired`, `decision_ledger_present`; unmeasurable: `deploy_gate_exists` |
| instrument pages · indexable routes | 17 · 26 | 17 · 26 | |

Other checks, before and after: `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` and
`routes` exit 0; `tools/og-image.mjs --check` passes; `tools/commit-evidence.mjs origin/main HEAD`:
5 commits, 0 without evidence, each "changes no published file".
`BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`. No agent CLI that writes was
run; `agent/records/` does not exist in this checkout.

### What was not verified, and why

- **No source was re-read.** This was a measurement session; V2C-22 and V2C-23 need network this
  environment did not reach in Sessions 5 and 8, and were not retried.
- **The Pages setting** (V2C-42): only the Actions history was read.
- **The `::1` test** (V2C-39): skipped again (EAFNOSUPPORT).
- **Other browsers, devices, screen readers** (V2C-38): only Chromium 153.
- **The count of 11 rules in F-8** was not re-derived; the three AI Act rules it names were.
- **V2C-26** (`agent/depth`'s `missing_competence`): not re-run, to keep `agent/records/` empty.

### The verification checklist

**11.0 · Questions to the author.**
- *Written:* `docs/ROADMAP-v2.md` §8, the scope row (`5fec457`) and the row of the seven answers
  (`166bf44`); S1–S3 (`48f7cec`).
- *Verify:* `git log --oneline 17768c1..` shows `5fec457` first; read the last two rows of §8 and
  `docs/V2-CLOSURE.md` §3.1, and compare S1–S3 with `git show 48f7cec`.
- *Automatic:* none.
- *Criterion:* every answer recorded in the author's words; nothing unapproved written.

**11.1 · The comparison.**
- *Written:* `docs/V2-CLOSURE.md` §1 (`1d41c13`).
- *Verify:* re-run any row's "Today" command; for Phase 3, `python3` over `data/applicability.json`
  (every `sources` entry is a string; no condition value is a provision id) and
  `grep -n applicability tools/evidence-audit-record.mjs`.
- *Automatic:* the tests named in §1.4, all in the 25 suites.
- *Criterion:* every row measured today, not copied; no phase not executed marked complete.

**11.2 · The inventory.**
- *Written:* `docs/V2-CLOSURE.md` §2.
- *Verify:* for any open row, its "Measured today" cell; for any E row, `git show` its commit.
- *Automatic:* none for the inventory itself.
- *Criterion:* every finding of the named records, with origin, law or not, and a class; closed ones
  not reported as open.

**11.3 · Write and verify.**
- *Written:* only `docs/` and `AGENTS.md` (question 7).
- *Verify:* `git diff --stat 17768c1..` lists only `AGENTS.md` and `docs/`.
- *Automatic:* every validator, the 25 suites, the browser suite and the gate, before and after;
  `commit-evidence` 0.
- *Criterion:* nothing published changed; no gate, validator, test, CSP, CSRF, Origin, OIDC or
  publication limit lowered.

**11.4 · Checkpoint.**
- *Written:* this report.
- *Criterion:* the author's approval, recorded in §8. **Approved** on 28 Oct 2026; pull request
  opened on the author's instruction.

### How to check it by hand

1. `git diff --stat 17768c1..HEAD`: `AGENTS.md`, `docs/HANDOVER.md`, `docs/ROADMAP-v2.md`,
   `docs/V2-CLOSURE.md`, `docs/V2-DATA-DESIGN.md`, and nothing else.
2. `python3 -m http.server 8000`; open `/instruments/digital-networks-act/` and read the "Related" list:
   "ePrivacy / Amends" (V2C-01). Open `/instrument.html?id=p2b` in the dark theme: the source link is
   blue on near-black (V2C-28).
3. `node tools/evidence-audit.mjs --as-of 2026-10-28` and `node agent/production/cli.mjs readiness`:
   the figures above.

## Branch register — 28 October 2026 (v2 Session 10)

- Branch `claude/v2-session-10-frontend`, cut from `main` at `c982724` (#31 and #32 merged). The
  prompt's branch, `claude/v2-session-10-prompt`, was already in `main` as #32, so nothing was merged
  in.
- Unmerged branches at the start, `git branch -r --no-merged origin/main`:
  - `origin/claude/v2-session-8-findings`: `2b5d71d` only, whose content #31 carries (Session 9's
    register);
  - `origin/scout/digest-digest-2026-10-26T13-10-32Z` (already in the register).
  `origin/claude/new-session-o9uopd`, which the prompt expected, is no longer unmerged.
- `origin/main` was re-fetched before this handover was written: still `c982724`.
- Disposition: approved (`docs/ROADMAP-v2.md` §8, "Approve the checkpoint"); pushed, with a pull
  request to `main` opened on the author's instruction of 28 Oct 2026 ("Open PR to main"). Nothing is
  pushed to the branch after the pull request is opened.
- After that, on 28 Oct 2026: #33 was merged (`7cb47cf`), and the prompt of v2 Session 11 (the closing
  gate of v2: the comparison with `docs/ROADMAP-v2.md`, the open findings classified, the author's
  decision on the perimeter) was drafted on the author's request ("Write session 11"). It is kept as
  `docs/prompts/v2-session-11.md` on `claude/v2-session-11-prompt`, cut from `main` at `7cb47cf`. The
  prompt records no decision: its first write is §8's row "The scope of v2 Session 11", in the
  author's words.

## v2 Session 10 — checkpoint report (items 10.1 and 10.2)

### What the author decided (`docs/ROADMAP-v2.md` §8, in the author's words)

- **The scope** (the session's first write, `3e0e869`): items 10.1 and 10.2 only; a presentation
  session in which no data changes meaning; Session 11, Phase 3 and post-v2 out.
- **10.1** (`7cbfd4e`), all four as proposed: one `scrollbar-color` on `html`
  (`var(--paper-faint) transparent`), with the day palette also declared on `:root` when `body`
  carries it; a scroll shadow on `.chrome-nav` and `.subnav`, whose bars stay hidden; a thin bar on
  `.spine` in every engine; the hide rules of the dead `.tool-top`/`.bib-top` strip deleted.
- **10.2, the rule and how** (`7cbfd4e`): what counts as an internal reference and what does not; the
  perimeter of eight renderers (R1–R8); the data stays as written and one function in `js/format.js`
  cleans the text at render time; W18 holds it.
- **10.2, every text** (`ede6497`), one question per group, all as recommended: R1 (the relation-kind
  note, with "Direction: from = …" and "(from)" dropped by the interaction box), R2 (status notes),
  R3 (source notes), R4 (claim notes), R5–R7 (enforcement, institutions, search), R8 (the
  bibliography's own copy, word for word, with two links). No locale key to declare. The presentation
  findings of Sessions 8 and 9 stay open.

### What was written

| Commit | File | Change |
|---|---|---|
| `947803f` | `js/format.js` | `readerText()`, the filter (unwired until approved) |
| `d7d737b`, `8876649` | `style.css`, `css/tokens.css`, `css/tools.css` | 10.1 as decided; `8876649` tunes the shadow's covers (values only) after the browser showed a faint band at rest |
| `90c7f92` | `js/format.js` (`internalRefs()`), `js/interactions.js`, `js/instrument-view.js`, `js/status.js`, `js/evidence.js`, `js/bibliography.js`, `js/enforcement-page.js`, `js/institutions-page.js`, `js/search.js`, `bibliography.html`, `tools/selftest.mjs` | the eight renderers print notes through `readerText()`; each instrument page's claim card carries its id as an anchor; R8's copy; W18 |
| | generated | the 17 instrument pages (`node tools/_footer.mjs`; a second run writes 0 files). No OG card changed (`og-image --check` passes) |
| `77b9058` | `css/tokens.css` | the link style for the note containers (below, "checks changed") |
| this commit | `docs/HANDOVER.md`, `docs/v2-design/session-10-before-after.md` | this report; the before/after table |
| `3e0e869`, `7cbfd4e`, `ede6497` | `docs/ROADMAP-v2.md` §8 | four rows |

**No file under `data/` changed, and no fact, date, status, relationship, claim, source or judgement
changed.** The provenance stays in the notes, where the maintainers and the checks read it.
`js/search.js` was changed only for R7, on the author's decision; nothing there prepares the Evidence
Navigator.

### The checks changed, and why

- **W18**, new in `tools/selftest.mjs`. It runs every note a renderer of the perimeter prints (taxonomy
  notes of the relation kinds and actor/sector/activity/territory terms; status notes; relationship,
  source, claim and enforcement notes; appeal notes; competence notes) through `readerText()`, and
  fails on anything `internalRefs()` still finds. It reads the visible text of every static and
  generated page and of the three editions (the datasets explorer excepted, by the rule). It pins the
  approved R1 texts word for word, three R2 outputs and R8's copy, asserts the data still carries the
  references (so the provenance is not lost), plants a `docs/` path, a claim id and a commit, and
  asserts that case numbers, Council documents, a court URL and an agenda item are not findings.
  **Measured to fail** with each control off, and restored after each run:
  - `readerText()` made a pass-through: W18 fails on the fields;
  - the pages generated with it off: 56 leaks on the instrument pages;
  - the R1 rule removed from `js/interactions.js`: W18 fails on the pinned kind notes.
- **No existing test's premise changed.** No selftest, browser check, `prose-homes` or `design-qa`
  rule read any of the texts changed. The one check the work tripped is below.
- **A regression of this session, caught by the browser suite and fixed at its root (`77b9058`).** The
  links `readerText()` makes landed in containers that had only held plain text and had no link rule.
  They fell back to the browser's blue: `a11y:contrast:dark:enforcement.html` 1.85:1 and
  `:bibliography.html` 1.98:1, 2 failures. Those containers now take the site's existing link
  convention (`--mech`, underlined, `--live` on hover), and the suite is back to 343 · 0 · 1. No
  check was changed.

### Item 10.2: the inventory, and before and after

Measured in Chromium over every page, every instrument's generated page and `instrument.html?id`
(39), the 175 evidence panels the brief opens, search, the SEO metadata, JSON-LD, the OG cards' inputs
and the it/fr/es editions.

| Renderer | Field | Records | Shown on |
|---|---|---|---|
| R1 interaction box | taxonomy `relationship_kind` note | 2 | 26 cards on 12 instrument pages; `instrument.html`; the brief and its three editions |
| R2 status note | `instruments[].status_note` | 13 (+ ttpa, psd3, not printed today) | instrument page head; the brief's status strips; the evidence panel |
| R3 source note | `sources[].note` | 25 | the bibliography |
| R4 claim note | `claims[].verification_note` | 86 of 181 | the evidence panel |
| R5 enforcement | `verification_note`, `appeal.note` | 11 | `enforcement.html` |
| R6 institutions | `competences[].note` | 3 | `institutions.html` |
| R7 search | taxonomy actor notes | 6 | the search palette |
| R8 page copy | `bibliography.html` | 1 | the bibliography |

Clean before the work: the SEO metadata, JSON-LD, the OG cards (drawn from name, title, kind and CELEX).
Outside the rule: the datasets explorer (the raw records, by design); a record's own handle ("Claim ID
clm-…", "enf-… · verified"); URLs, case numbers, Council documents, CELEX numbers; the methodology and
licence pages' repository links. Not printed by any renderer today, and filtered anyway where the
renderer is in the perimeter: the relationships' notes (printed only when an edge requires
verification).

**Every changed sentence, before and after, is in `docs/v2-design/session-10-before-after.md`**
(148 records). By kind:

| Before | After | Where |
|---|---|---|
| "(docs/V2-DATA-DESIGN.md §1.4)", "(docs/AUDIT-2026-10-14.md §1 F)" | dropped | R1 (26 cards), R2 (CRA) |
| "Direction: from = the enabling instrument." / "(from)" | dropped | R1 (9 / 17 cards) |
| "(audit item 9)", "(audit items 9 and 10)", "(audit item 10)", "(audit items 2 and 12)", "(audit item N)" | dropped | R2 (11 instruments), R4, R5 |
| "(audit T-NN)", "(audits T-22, T-27)" | dropped | R3, R4, R5 |
| "for B.3 (v2 Session 5)", "for item 2.x" | dropped | R3 (16), R4, R7 (6) |
| "(commit 282a782)" | dropped | R2 (Data Act) |
| `last_verified`, `status_as_of`, `legislative_status`, `action_status`, `amended_by`, … | "the verification date", "the status date", "the legislative status", "the action status", "amended by", … | R2, R4, R5 |
| `status:in-force`, `status:stalled`, `remedy:ordered`, `record-type:inaction`, `actor:data-holder` | ‘In force’, ‘Stalled’, ‘Remedy ordered’, ‘Recorded inaction’, ‘Data holder’ | R2, R5, R7 |
| `clm-…` beside an Article or a Council document | dropped: "(Art. 5a(1))", "(ST 13112/26)" | R2 (eIDAS2 ×2, Data Omnibus ×2), R4 |
| `clm-…` with no citation beside it | "(see the claim)", a link to the claim on its instrument page; in the evidence panel "claim n", a button opening it | R2 (Data Omnibus ×3), R4, R5 (Apple) |
| `src-…` in a sentence | "⟨publisher, year⟩", a link to the bibliography entry; dropped where the sentence names the document; "a former record" for an id that no longer exists | R2, R3, R6 |
| `enf-…` | "the enforcement record", a link; dropped where the sentence names the decision | R4, R5 |
| `tools/evidence-audit.mjs`, `instruments.json`, `enforcement.json` | "the site's evidence audit", "the instruments dataset", "the enforcement dataset" | R4 |
| R8: "computed from `data/*.json`" / "(`tools/validate.mjs`)" | "computed from ⟨the site's datasets⟩" / ", in ⟨the site's data validator⟩" | the bibliography |

Two corrections to what was put to the author, neither changing a text:
- **R3's question said source notes are printed "in the bibliography and in the evidence panel's source
  list".** They are printed in the bibliography only: `js/evidence-view.js` cites a source without its
  note.
- **The footnote numbers in the review file were an approximation** (from the order of `data-claim` in
  the markup). The panel numbers them at run time: the two Dutch fines read "claim 38" and "claim 39",
  not 34 and 35. The committed table writes "claim [n]".

### Counts against `main` (`c982724`)

| Measure | Before | After | Why |
|---|---|---|---|
| records (instruments / relationships / sources / claims / events / terms) | 39 / 40 / 225 / 181 / 101 / 312 | unchanged | no data change |
| `validate` errors / warnings / unverified | 0 / 0 / 45 | 0 / 0 / 45 | |
| `evidence-audit --as-of 2026-10-28` | 0 errors · 11 warnings · covered 16 · mapped 12 · watched 5 · excluded 6 | unchanged | |
| `freshness --as-of 2026-10-28` | 0 defects · 3 prompts | unchanged | the calendar |
| `i18n-audit`, `design-qa`, `seo-audit` | 0/0 | 0/0 | |
| matches of the browser scan's patterns (datasets explorer and "Claim ID" handles excluded) | 797, 457 of them in the evidence panels | 20 (19 distinct) | the filter; every match left is an exempt kind: the Council's agenda "Item 1", hex segments of URLs, each enforcement record's own handle. The 797 also counted some of those |
| static pages: `docs/V2-DATA-DESIGN.md §1.4` / `clm-` / `commit` | 26 / 7 / 1 | 0 / 0 / 0 | |
| `tools/selftest.mjs` | 107 | 108 | W18 |
| all 25 suites | 1313 pass + 1 skipped | **1314 pass + 1 skipped (`::1`), 0 failures** | W18. The skip is the `::1` test, not run in this container: a skip is not a pass |
| browser suite (`--require-browser`) | 343 · 0 · 1 undecidable | 343 · 0 · 1 undecidable (`a11y:bound`) | 341 · 2 · 1 before `77b9058` |
| adversarial gate | 65 · 0 · 3 · 1 | 65 · 0 · 3 · 1 | |
| instrument pages · indexable routes | 17 · 26 | 17 · 26 | |

Other checks: `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` and `routes` exit 0;
`tools/og-image.mjs --check` passes; `tools/commit-evidence.mjs origin/main HEAD`: 0 commits without
evidence. `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`. No agent CLI that
writes was run, and `agent/records/` was empty before the last run of the suites.

### Seen in a browser, and what was not verified

Chromium 153 (Playwright), with classic scrollbars shown (headless hides them by default).
- The home page, `instruments.html`, the bibliography, the GDPR, DNA, eIDAS2 and Data Omnibus pages at
  1280px and 390px in both themes: the page's bar reads `--paper-faint` on `html` in each theme
  (#978C7E dark, #5B5053 day). No horizontal overflow, no console error.
- `.chrome-nav` at 390px, in both themes, at the start, in the middle and at the end of the strip: a
  shadow shows only on a side where links are hidden. The subnav behaves the same. Tab reaches the
  last link of each strip and the strip scrolls it into view.
- `.spine` at 1280×360: it overflows and shows a 10px thin bar in the theme's ink. At 200% zoom of a
  1280×720 screen (a 640×360 viewport) the spine is hidden by its existing breakpoint, so the bar is
  only ever seen on wide, short windows.
- The evidence panel: a claim note's "claim 38" button opens Note 38 in place. The Data Omnibus page's
  three "see the claim" links land on cards that exist.
- Contrast: thumb on track ≥ 5.3:1 in both themes (computed from the tokens), and the links in the
  notes pass the browser suite's contrast check in both themes.
- `prefers-reduced-motion`: nothing added moves; the scroll shadow is static backgrounds.

**Not verified:** Firefox and Safari/WebKit (Safari keeps its native bar; whether it honours
`scrollbar-color` was not measured); real touch devices, where scrollbars overlay and the shadow is the
only signal; screen readers; Windows forced-colours; pixels.

### Found, for the author — not changed

1. **Leftovers outside the rule**, in claim notes (R4): a provision id ("No tfeu:art-16 provision is
   modelled") and bare instrument ids ("eidas2 removed from instruments", "ehds added to
   instruments"). Approved as leftovers, unchanged.
2. **Un-numbered audit references stay**: "(audit, facts hidden in interpretation)", "21 Oct 2026
   (audit): …". They name no code, so the rule leaves them.
3. **Some outputs read stiffly**: "The verification date 21 Oct 2026: the status was re-read that day"
   (Data Omnibus); "this environment" in source notes. Approved as listed.
4. **The dead `.tool-top`/`.bib-top` block** in `css/tools.css` keeps its fade and layout rules (only
   the hide rules went, as decided), and `js/shell.js` still queries those headers.
5. **The spine's thin bar narrows the rail by 10px** when it shows; the dots sit close to it.
6. **No hover state on a scrollbar** (`scrollbar-color` has none), as decided.

**Still open from Session 9** (unchanged): the edge kind in the present tense ("Amends", "Defers to")
for a proposal; the modality derived from the `from` node (`docs/V2-DATA-DESIGN.md` §1.4) and the four
`enables` candidates; the acts the DNA would repeal or amend not modelled; "member State" in the
generated descriptions; the undated source's `.”.`; the verification date breaking its line; no event
type for a procedural step.

**Still open from Session 8** (unchanged): the colour of the notice's "Read it at the source" link in
the dark theme; the EHDS page's `<title>`; `data-omnibus`'s status note, to be re-verified against the
outcome of the Coreper meeting of 21 Oct 2026 (only its identifiers changed here, at render time);
`nis2 → eidas` not modelled.

**Still open** (unchanged): `src-ec-ai-omnibus-in-force` (403); the `::1` test (skipped again here); the
8 v1 relationships and the `edge-v1-sources` flip; R-01 and the eight findings of
`docs/V2-DATA-DESIGN.md` §7 (Phase 3); the Session 5 findings of the roadmap's §3.

### The verification checklist

**10.0 · Questions before writing.**
- *Changed:* `docs/ROADMAP-v2.md` §8, four rows (`3e0e869`, `7cbfd4e`, `ede6497`).
- *Verify:* `git log --oneline c982724..` shows `3e0e869` first, and `7cbfd4e` and `ede6497` before
  `d7d737b` and `90c7f92`.
- *Automatic:* none.
- *Criterion:* every reader-facing text decided before it was written; nothing published changed
  before the scope row.

**10.1 · Scrollbars.**
- *Changed:* `style.css`, `css/tokens.css`, `css/tools.css` (`d7d737b`, `8876649`).
- *Verify:* open any page in the dark theme: the page's bar is dark-on-dark. Narrow the window below
  ~1000px on an instrument page: a shadow appears at the nav strip's right edge, moves to both sides
  as you scroll, and leaves the right at the end. Make the brief's window short (below ~410px): the
  left rail shows a thin bar.
- *Automatic:* `design-qa` 0/0; the browser suite's contrast checks. No test asserts the scrollbar
  itself.
- *Criterion:* existing tokens only; no inline style or script; no CSP exception; nothing hidden
  globally; a continuity signal on every hidden strip.

**10.2 · Internal references.**
- *Changed:* `js/format.js` and seven renderers, `bibliography.html`, the 17 generated pages
  (`947803f`, `90c7f92`, `77b9058`).
- *Verify:* open `/instruments/eidas2/`: the status note ends its two duties "(Art. 5a(1))" and
  "(Art. 5f(2))". Open the GDPR page's interactions: no "docs/". In the brief, open the footnote of
  "Eight of the ten largest GDPR fines": its note says "claim 38", and the button opens Note 38. Open
  the bibliography's Data quality lede.
- *Automatic:* `node --test --test-name-pattern=W18 tools/selftest.mjs`.
- *Criterion:* no internal reference in a text a reader sees; the data and its provenance unchanged.

**10.3 · Write and verify.**
- *Automatic:* every validator, the 25 suites, the browser suite and the gate, as above;
  `commit-evidence` 0.
- *Criterion:* 0 errors everywhere; no gate, validator, test, CSP, CSRF, Origin, OIDC or publication
  limit lowered.

**10.4 · Checkpoint.**
- *Changed:* this report.
- *Criterion:* the author's approval, recorded in §8. **Approved** on 28 Oct 2026; pull request
  opened on the author's instruction.

### How to check it by hand

1. `node --test --test-name-pattern=W18 tools/selftest.mjs`.
2. To see it hold, add "(commit 1234abc)" to `eidas2`'s `status_note` in `data/instruments.json`: W18
   still passes (the filter drops it). Then make `readerText()` return its input in `js/format.js`:
   W18 fails. Restore both files.
3. `python3 -m http.server 8000`; open `/instruments/data-omnibus/` in both themes at 390px and
   desktop width; read the status note; follow a "see the claim" link; scroll the top nav strip.
4. `node agent/browser/cli.mjs --require-browser`: 343 · 0 · 1.

## Branch register — 28 October 2026 (v2 Session 9)

- Branch `claude/intelligent-bell-wuhder`, the one the environment assigned, cut from `main` at
  `cabe21b` (#28 and #29 merged). `c756f0f` (the prompt of this session, and the register entry that
  carries the content of `2b5d71d`), on `claude/new-session-o9uopd` and not on `main`, was merged into
  it (`8bd9e68`) on the author's decision ("Start Session 9 + merge c756f0f (Recommended)").
- Unmerged branches at the start, `git branch -r --no-merged origin/main`:
  - `origin/claude/new-session-o9uopd`: `c756f0f` only, now carried by this branch;
  - `origin/claude/v2-session-8-findings`: `2b5d71d` only, whose content `c756f0f` carries;
  - `origin/scout/digest-digest-2026-10-26T13-10-32Z` (already in the register).
- `origin/main` was re-fetched before this handover was written: still `cabe21b`.
- Disposition: approved (`docs/ROADMAP-v2.md` §8, "Yes"); pushed, with a pull request to `main` opened
  on the author's instruction of 28 Oct 2026 ("Open PR; Phase 2 closed"). Nothing is pushed to the
  branch after the pull request is opened.
- After that, on 28 Oct 2026: the prompt of v2 Session 10 (items 10.1 and 10.2: scrollbars, and the
  internal references shown to a reader) was drafted on the author's request ("Do it"). It is kept as
  `docs/prompts/v2-session-10.md` on `claude/v2-session-10-prompt`, cut from this branch at `480a83c`
  so that #31 stays untouched; once #31 is merged, its pull request would show only the prompt. The
  prompt records no decision: its first write is §8's row "The scope of v2 Session 10", in the
  author's words.

## v2 Session 9 — checkpoint report (item 2.6, the Digital Networks Act)

### What the author decided (`docs/ROADMAP-v2.md` §8, in the author's words)

- **The scope** (first write of the session, `89311c1`): item 2.6 only, then the checkpoint; Phase 3
  and Session 10 are not in this session.
- **Item 2.6** (`139c15a`), asked one question at a time before anything was written to `data/`.
  Thirteen answers, all as recommended:
  - *criterion*: `crit:object-infrastructure` + `crit:horizontal` + `crit:readable`, on Art. 1(1)–(2),
    Art. 9(2), Art. 93(1) and the procedure's first key event. `crit:horizontal` was put to the author
    as the contestable clause: Art. 1(2) names "the electronic communications sector". The reading
    taken: the rights would reach every end-user, whatever their sector, and the networks regulated
    include those carrying information society services;
  - *id and name*: `digital-networks-act`, not the draft's `dna`, which collides with the `dna` field
    of every record (294 occurrences of the word in 27 files; the locale keys `<id>.dna.*`; the
    detector's field paths; the `dna:` namespace). `short_name` "Digital Networks Act", alias
    `com-2026-16`, no `dna` alias, nothing in `KNOWN_AS`;
  - *status*: `status:proposal`, the status note word for word ("NOT LAW. …"), `status_basis` the
    procedure file's key events and stage (tier 2, S-03);
  - *edges*: three, all from the proposal — `amends` ePrivacy (Art. 207), `defers-to` GDPR
    (Art. 93(4)), `defers-to` NIS2 (Art. 5(2); Art. 8(3)). Any one of them meets the page gate's
    `context` criterion. No `enables` edge into the proposal (finding 2 below); no node for the acts it
    would repeal or amend outside the dataset (finding 3);
  - *dates*: the proposal event only. No event for the referral, the EESC opinion or the draft report
    (the taxonomy has no type for them; the status note names them), and none of the proposal's own
    bracketed dates;
  - `dna.objective` draft A;
  - *provisions and fields*: Arts 5, 9 and 93, each "Proposed, not law"; the new term
    `actor:electronic-communications-provider`; `regulated_actor` [that term, `actor:member-state`];
    `obligation_anchor` empty; `implementation_model` "Would be directly applicable: a proposed
    Regulation (Art. 210, last paragraph)"; `sanction_ceiling` with null amounts and the note
    (Art. 196(5); Art. 43(3)); the four other analytical fields `null`;
  - *display*, for `kind:proposal` only: the provisions table reads "Would bind" and "Would apply",
    its date cell "no date: a proposal is not law"; search offers no obligation from a proposal's
    article;
  - *sources*: `src-eurlex-dna-proposal` (tier 1) and `src-oeil-2026-0013` (tier 2), notes word for
    word;
  - *the reason* of the scope decision, word for word.
- **Two display defects the new record exposed** (`13b536f`), each asked before it was fixed:
  `tools/seo.mjs` `actNumber()` (the description called the proposal "Regulation (EU) 2015/2120") and
  `js/format.js` `tierWord()` (a Commission proposal labelled "primary law").

### What was written

| Commit | Record or file | Change |
|---|---|---|
| `53f51e6` | `digital-networks-act` | new; `kind:proposal`; `scope:core`; `brief_part` `null`; `status:proposal`, `status_as_of` 2026-10-28; the status note; `status_basis` (OEIL key events and stage, direct; the proposal's title and metadata, partial); `scope_decision` (included; three clauses; three references, all direct; `approved_on` 2026-10-28); `proposes_to_amend` [`eprivacy`]; `dna` as decided; `legal_basis` empty (not asked; Art. 114 TFEU is cited by the proposal) |
| | `digital-networks-act:art-5`, `:art-9`, `:art-93` | three provisions, each "Proposed, not law", `obligation_on` the new provider term |
| | `rel-digital-networks-act-eprivacy-amends`, `-gdpr-defers`, `-nis2-defers` | new, v2 shape, direct, every locator in the proposal; every summary opens "Proposed:" |
| | `tl-digital-networks-act-2026-01-21-proposal` | new; `event:proposal`; `obligation` `null` |
| | `actor:electronic-communications-provider` | new taxonomy term; nothing renamed |
| | `src-eurlex-dna-proposal`, `src-oeil-2026-0013` | new; each note says what was read and what was not |
| | `js/instrument-view.js`, `js/search.js` (`bindingActors`), `tools/seo.mjs` (`actNumber`), `js/format.js` (`tierWord`) | the proposal-only display fixes |
| | `tools/selftest.mjs` | W17, new (below) |
| | generated | `instruments/digital-networks-act/` (new); the GDPR and NIS2 pages (the edges from the other end); the data-omnibus and Data Act pages (`tierWord`); the `<noscript>` index on every page; `instruments.html`; `bibliography.html`; `datasets.html`; `sitemap.xml`; `img/og/digital-networks-act.png` and its manifest entry. The tool re-rendered the other cards; they were restored, because their inputs did not change (`og-image.mjs --check` passes) |
| `89311c1`, `139c15a`, `13b536f`, this commit | `docs/ROADMAP-v2.md` §8 | three rows; this report |

Not added:
- no claim (the brief does not name the DNA) and no applicability rule;
- no institution edge: no competent authority is recorded, and the page says "not established";
- no entry in `tools/seo.mjs`'s title table, `KNOWN_AS` or `PAGE_PUBLISHED`;
- no record for Directive (EU) 2018/1972, Regulation (EU) 2018/1971, Decision No 243/2012/EU,
  Regulation (EU) 2015/2120 or Decision No 676/2002/EC;
- no `enables` edge from `eidas`, `nis2`, `gdpr` or `iea`.

**No locale key was touched.** The fields written are data, which the editions do not carry, and the
strings changed in code ("Would bind", "Would apply", "no date: a proposal is not law", "Tier 1 ·
legislative proposal") have no locale key: the translations hold only the home and portal strings. No
key needs declaring `superseded` or `pending_translation`; `i18n-audit` is 0/0.

### The checks changed, and why

No validator, gate or check was loosened or extended. Four renderers changed, each for `kind:proposal`
only, each on the author's decision:
- `js/instrument-view.js`: the provisions table's columns ("Would bind", "Would apply") and its date
  cell. A proposal's provision passed through `provisionApplication()` would have read "no
  application date recorded for this article", as though a date were still to be found.
- `js/search.js`: `bindingActors()`. Search built an "obligation" entry ("a provision that binds
  somebody") from every provision's `obligation_on`, so it would have offered "Electronic
  communications provider — Digital Networks Act Art. 9" as an obligation.
- `tools/seo.mjs` `actNumber()`: the first act number in the title was the proposal's identity; the
  DNA's title names Regulation (EU) 2015/2120 first.
- `js/format.js` `tierWord()`: "Tier 1 · primary law" on a Commission proposal (true of COM(2025) 837
  on `main` already). The tier stays tier 1, which the taxonomy defines to include legislative
  documents; only the word changes, keyed on the CELEX (sector 5, type PC).

**W17**, a new test on W15's model:
- it asserts that the DNA is covered, sits in no backlog and passes as written; that it is a
  `kind:proposal` with `status:proposal` and no contradiction; that its one milestone is the proposal;
  that its three edges run from it, direct, structurally located in the proposal, each summary saying
  "Proposed:"; and that no edge runs into it;
- it plants the loss of the status basis (M-07), of the decision (M-04), of all three edges (M-05) and
  of the objective (M-05), and a post-adoption state (`status:in-force`, `status:applicable`,
  `status:adopted`) on the proposal, which `statusContradictions()` reports as "counts it as law" and
  M-07 refuses (a tier-2 procedure file cannot carry an adopted state). Each one fails;
- it asserts that any one edge alone still gives context;
- it reads the generated page: "Would bind" / "Would apply", no "Binds", one "no date: a proposal is
  not law" per provision, no "Applies since/from"; the IEA page keeps "Binds";
- it asserts `bindingActors()` offers nothing from the DNA's articles and the IEA's unchanged, and
  that `buildIndex()` asks it; `actNumber()` gives "COM(2026) 16", "COM(2025) 837" and "Regulation
  (EU) 2024/903"; the description does not name 2015/2120; `tierWord()` reads "legislative proposal"
  for the four proposal sources and "primary law" for the IEA's, and the page holds no "primary law".

Measured: W17 fails with each of nine controls disabled in turn — the proposal rule of
`statusContradictions()`; M-07; M-04's missing-decision line; M-05; the provisions-table fix; the
date-cell fix; `bindingActors()`'s proposal branch; `actNumber()`'s proposal branch; `tierWord()`'s
proposal branch (the page regenerated where the control is a renderer). Every file was restored and
the pages regenerated (`_footer` then wrote 0 files).

**A lesson-8 check: no existing test's premise changed.** The new edges end at GDPR and NIS2. W15
counts only the IEA's edges and W11 plants over `eidas2`'s; both pass unchanged.

No agent CLI was run, and `agent/records/` stayed empty.

### Facts read on 28 Oct 2026, and facts left `null`

- **Read** (no fact from a web search):
  - COM(2026) 16, from Cellar by CELEX `52026PC0016` (English XHTML, `DOC_1`, the act; HTTP 300 with
    two manifestations, then 200):
    - Arts 1–5, 9, 43, 93, 95, 99, 106, 107, 115, 196 and 206–210;
    - every other Article that names Regulation (EU) 2016/679, Directive (EU) 2022/2555, Regulation
      (EU) No 910/2014, Regulation (EU) 2024/903 or Directive 2002/58/EC (also Arts 2, 7, 8, 11(3)
      and 77);
    - the citation of Art. 114 TFEU, and the first section of the explanatory memorandum.
  - The enacting terms were searched, without a hit, for the DSA, the DMA, the Data Act, the AI Act,
    the CRA, the CSA, the EHDS, the DGA, DORA, Regulation (EU) 2024/1183, the e-Commerce Directive and
    the CER Directive.
  - The Publications Office's SPARQL metadata:
    - the work: document date 2026-01-21; resource type PROP_REG; based on the TFEU; proposes to
      amend 32002L0058, 32002D0676, 32012D0243, 32015R2120, 32018L1972 and 32018R1971;
    - the dossier: 2026/0013/COD, OLP, `PROP_PENDING`; pending 1, adopted 0, withdrawn 0,
      not-adopted 0;
    - its 28 events: the Commission's adoption (21 Jan), the EP referral (27 Apr, ITRE), the EESC
      opinion (17 Jun, EESC 2026-00515), the ITRE draft report (20 Oct), and 24 Council entries
      (the question put to the author said 25; the count is 24)
      (working party, one Coreper of 27 May, one Council of 9 Jun), all sent by `CONSIL:FilePlanning`.
      Planning entries; none establishes a position.
  - The Legislative Observatory, 2026/0013(COD): "Awaiting committee decision"; ITRE, rapporteur
    Michał Kobosko (Renew), appointed 26 Feb 2026; IMCO and LIBE for opinion; BUDG declined; the key
    events and documents as the source note lists them.
- **Not read**:
  - the recitals, the rest of the explanatory memorandum, the other Articles, the Annexes (`DOC_2`)
    and the financial statement;
  - the ITRE draft report PE791.994, the EESC opinion, the national parliaments' contributions;
  - the acts the proposal would repeal or amend (so no node for them);
  - the Council's documents (ST 8523/26, ST 9359/26, ST 9685/26, ST 9799/26), named in the planning
    entries only.
- **Left `null` or empty**: `protected_party`, `risk_logic`, `enforcement_mechanism`,
  `territorial_scope`; the sanction amounts; `legal_basis` (not asked); `obligation_anchor`.
- **Text-extraction note**: in the XHTML some Article headings are split by the converter ("Art icle
  6"), so the Article index was built from the headings that parse; every Article cited above was
  read in the text itself.

### Exit criteria of item 2.6, and Phase 2

- The criterion held, decided on the proposal's own text, with the contestable clause put to the
  author: **met**.
- The status label is what the sources establish on the date checked (roadmap §4): `status:proposal`
  on 28 Oct 2026, from the procedure file and the metadata: **met**.
- Every fact read from a retrieved primary source; `sources.json` records only for documents read;
  prose approved word for word before writing; `_footer` re-run; locale keys declared (none): **met**.
- No page presents the proposal as law (below): **met**, as far as the browser review reached.
- **Phase 2** (items 2.0–2.6): with this item every listed inclusion has been taken. Whether Phase 2
  is closed is **put to the author**, not stated here; Phase 3 does not start in this session.

### Counts against `main` (`cabe21b`)

| Measure | Before | After | Why |
|---|---|---|---|
| instruments / provisions / relationships | 38 / 89 / 37 | 39 / 92 / 40 | the DNA; three provisions; three edges |
| sources / timeline events / claims / taxonomy terms | 223 / 100 / 181 / 311 | 225 / 101 / 181 / 312 | two sources; the proposal event; one actor term |
| coverage covered / mapped / watched / excluded | 15 / 12 / 5 / 6 | 16 / 12 / 5 / 6 | the DNA |
| v1 relationships | 8 | 8 | the new edges are v2 |
| instrument pages · indexable routes | 16 · 25 | 17 · 26 | `instruments/digital-networks-act/` |
| `validate` errors / warnings / unverified | 0 / 0 / 45 | 0 / 0 / 45 | unchanged |
| `evidence-audit --as-of 2026-10-28` errors / warnings | 0 / 11 | 0 / 11 | unchanged (the same eleven) |
| `freshness --as-of 2026-10-28` | 0 defects / 3 prompts | 0 / 3 | unchanged |
| `i18n-audit`, `design-qa`, `seo-audit` | 0/0 | 0/0 | unchanged |
| `tools/selftest.mjs` | 106 | 107 | W17 |
| all 25 suites | 1312 pass + 1 skipped | **1313 pass + 1 skipped (`::1`), 0 failures (1314)** | W17. The skip is the `::1` test |
| browser suite (`--require-browser`) | 343 · 0 · 1 undecidable | 343 · 0 · 1 undecidable (`a11y:bound`) | |
| adversarial gate | 65 · 0 · 3 · 1 | 65 · 0 · 3 · 1 | unchanged |

Other checks:
- `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` and `routes` exit 0.
- `tools/og-image.mjs --check` passes.
- `tools/commit-evidence.mjs origin/main HEAD`: 0 commits without evidence. `53f51e6` names its
  evidence; the others change no published file or are the merge.
- `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.

### The page, opened in a browser

`/instruments/digital-networks-act/` was opened in Chromium (Playwright) at 1280px and 390px, in the
dark and the light theme. There was no console error and no horizontal overflow in any of the four.
The GDPR and NIS2 pages were opened the same way, with the same result. The page shows:
- the kicker "Proposal · not law · creates no obligations · CELEX 52026PC0016", the full title, and
  "Official text: COM(2026) 16 final — …", labelled "Tier 1 · legislative proposal";
- Status "Proposal, as of 28 October 2026"; "Next date: nothing further recorded"; "Competent
  authority: not established in this dataset"; "Sanction ceiling: no amount recorded"; the status
  note, opening "NOT LAW.";
- "In short": the objective in the conditional; "Would bind: Electronic communications provider ·
  Member State"; "Would protect: not established"; "Core provisions: not established"; "Key dates:
  Legislative proposal 21 January 2026"; the sanction note, opening "Proposed, not law.";
- headings in the conditional ("What does the Digital Networks Act propose?", "Where does … stand?",
  "Who would … affect?", "What would … change?", "How would … be enforced?");
- one dated event, the proposal; "No rules recorded", worded as absence of knowledge;
- three provisions under "Would bind" and "Would apply", each "Proposed, not law." and "no date: a
  proposal is not law";
- no enforcement recorded, no claims; three interactions, each summary opening "Proposed:", each with
  its locator;
- the GDPR and NIS2 pages show the `defers-to` edge from the other end, with "Proposed:" and the
  proposal's source labelled "Tier 1 · legislative proposal".

Nothing on these pages gives the proposal a date of entry into force or application, a sanction
amount, or an obligation stated as binding.

### Found, for the author — not changed

1. **An edge's kind reads in the present tense.** The interaction cards and the "Related" list say
   "Digital Networks Act — Amends → ePrivacy" and "Defers to"; only the summary says "Proposed:". The
   design's derived modality (`docs/V2-DATA-DESIGN.md` §1.4) is not rendered anywhere. The
   data-omnibus edges ("Repeals", "Amends") already read this way.
2. **The modality derivation would misread an edge into a proposal.** §1.4 derives modality from the
   `from` node's status. An `enables` edge from an act in force to a proposal (from `eidas`: Arts
   106(2), 107(2)–(3); from `nis2`: Arts 4, 5(1), 8(1); from `gdpr`: Art. 2, points (49)–(50); from
   `iea`: Art. 11(3)) would therefore derive as "law". Nothing derives modality yet, so no page shows
   it; none of these edges was added.
3. **The acts the proposal would replace are not nodes.** Directive (EU) 2018/1972 (the European
   Electronic Communications Code), Regulation (EU) 2018/1971 (BEREC) and Decision No 243/2012/EU
   (Art. 209), Regulation (EU) 2015/2120 (Art. 206) and Decision No 676/2002/EC (Art. 208). The page
   names them only in the title.
4. **"member State"** in the generated descriptions: `lowerLead()` lowercases the first letter of an
   actor label. It is on the DNA, CSA and IEA pages' meta, og and twitter descriptions.
5. **An undated source's bibliography entry ends `.”.`**: the OEIL procedure files, the new one
   included.
6. **"Last verified on 28 October 2026 ;"**: in the browser, the evidence section's verification date
   breaks onto its own line, with the semicolon after it. Seen on the DNA page; the static HTML (here
   and on the IEA page) is inline, so it comes from the client-side render and very probably reaches
   every instrument page, which was not measured. Display only; not introduced by this item.
7. **No event type for a procedural step** (committee referral, draft report, EESC opinion). The
   status note carries them; the timeline cannot.

**Still open from Session 8** (unchanged):
- the colour of the notice's "Read it at the source" link in the dark theme;
- the EHDS page's `<title>` ("EHDS — …");
- `data-omnibus`'s status note, to be re-verified against the outcome of the Coreper meeting of
  21 Oct 2026;
- `nis2 → eidas` not modelled.

**Still open** (unchanged):
- (g) the internal references shown to a reader (Session 10's item 10.2). The `defers-to` note
  "(docs/V2-DATA-DESIGN.md §1.4)" is now printed on the DNA page's two `defers-to` cards and on the
  new rows of the GDPR and NIS2 pages;
- `src-ec-ai-omnibus-in-force` (403);
- the `::1` test: skipped again in this container, so not run. A skip is not a pass;
- the 8 remaining v1 edges and the `edge-v1-sources` flip;
- R-01 and the eight findings of `docs/V2-DATA-DESIGN.md` §7 (Phase 3).

### The verification checklist

**9.0 · Questions before writing.**
- *Changed:* `docs/ROADMAP-v2.md` §8, rows "The scope of v2 Session 9" (`89311c1`) and "Item 2.6: the
  inclusion of `digital-networks-act`" (`139c15a`), both before `53f51e6`; "Item 2.6: two display
  defects" (`13b536f`).
- *Verify:* read the three rows; `git log --oneline cabe21b..` shows the first two before the data
  commit.
- *Automatic:* none.
- *Criterion:* every editorial field and every reader-facing text was decided word for word before
  `data/` was touched; `approved_on` carries the date of the row.

**9.1 · Sources read first.**
- *Changed:* `data/sources.json` (two new sources).
- *Verify:*
  - fetch `http://publications.europa.eu/resource/celex/52026PC0016` with Accept
    `application/xhtml+xml`, then the `DOC_1` it lists; read Arts 1, 5, 9, 43(3), 93, 196, 206–210;
  - query the SPARQL endpoint for the dossier `…/cellar/7e717699-f6af-11f0-b9bc-01aa75ed71a1`
    (`dossier_pending-proposal` 1) and its events (`event_legal_part_of_dossier`, with
    `sender_transmission`);
  - open the Legislative Observatory file 2026/0013(COD): "Awaiting committee decision".
- *Automatic:* none. No check reads a source (AUDIT F-12).
- *Criterion:* no fact from a search result, a snippet or memory.

**9.2 · Written in one home.**
- *Changed:* `data/instruments.json` (the record, three edges); `data/timeline.json` (one event);
  `data/taxonomy.json` (one term); `data/sources.json`; the four renderers; `tools/selftest.mjs` W17;
  the regenerated pages and `img/og/digital-networks-act.png`.
- *Verify:* `/instruments/digital-networks-act/`, `/instruments/gdpr/`, `/instruments/nis2/`,
  `/instruments/data-omnibus/` (its official text now "Tier 1 · legislative proposal").
- *Automatic:* `tools/selftest.mjs` W17; S1 (generated files current); `seo-audit` 0/0;
  `evidence-audit` 0 errors, with `statusContradictions()` and M-04/M-05/M-07.
- *Criterion:* M-04, M-05, M-07 and the pre-adoption rule at 0 errors, held in full; dates only in
  `timeline.json`; no proposed date as an event; no title in `data/`; no internal identifier in a
  reader-facing field written here.

**9.3 · Checkpoint.**
- *Changed:* this report.
- *Automatic:* every validator, the 25 suites, the browser suite and the gate, as re-run above.
- *Criterion:* the author's approval, recorded in §8; the closure of Phase 2 is the author's to decide.
- **Approved** on 28 Oct 2026 (§8, "The checkpoint of v2 Session 9 = item 2.6"), and Phase 2 closed;
  pull request opened on the author's instruction.

### How to check it by hand

1. `node tools/evidence-audit.mjs --as-of 2026-10-28`: REGISTER reads "covered 16 · mapped 12 ·
   watched 5 · excluded 6".
2. `python3 -m http.server 8000`, then open `/instruments/digital-networks-act/` in both themes, at
   desktop and phone width; check the head, "In short", the provisions table and the interactions.
   Open `/instruments/gdpr/` and `/instruments/nis2/` for the edges.
3. `node --test --test-name-pattern="W17" tools/selftest.mjs`.
4. To see a check hold, set `legislative_status` of `digital-networks-act` to `status:in-force` in
   `data/instruments.json`: `evidence-audit` then reports the M-07 error and the status contradiction
   ("counts it as law"). Restore the file afterwards.

## Branch register — 28 October 2026 (v2 Session 8, after the item 2.5 checkpoint)

- Branch `claude/v2-session-8-findings`, cut from `claude/new-session-o9uopd` at `58671c2`, not from
  `main`: the fixes regenerate pages that already carry the IEA (the `<noscript>` index, the sitemap),
  and a branch from `main` would conflict on every page. Once #28 is merged, its pull request shows only
  its own commits.
- `origin/main` was re-fetched before this handover was written: still `3cc0473`; #28 not yet merged.
- Disposition: approved (`docs/ROADMAP-v2.md` §8); pushed, with a pull request to `main` opened on the
  author's instruction of 28 Oct 2026 ("Approve and open the PR").
- After that, on 28 Oct 2026:
  - #28 (`claude/new-session-o9uopd`, item 2.5) was merged into `main` with a merge commit, `2513a09`.
    #29 then held only its own commits and merged without conflict.
  - #29 (`claude/v2-session-8-findings`) was merged as `cabe21b`. A register commit pushed to the
    branch seconds after the merge, `2b5d71d`, did not reach `main`. On the author's decision ("Si"),
    its content goes in with this entry rather than in a pull request of its own.
  - The prompt of v2 Session 9 (item 2.6, the Digital Networks Act) was drafted on the author's request
    ("mandami session 9's prompt"). It is kept as `docs/prompts/v2-session-9.md` on
    `claude/new-session-o9uopd`, restarted from `main` at `cabe21b`. The prompt records no decision: its
    first write is §8's row "The scope of v2 Session 9", in the author's words.

## v2 Session 8, part 2 — open findings resolved on the author's request

The Session 8 prompt excluded the open findings of Sessions 5–7. After the item 2.5 checkpoint the
author asked to be asked which of them this session could resolve ("Vorrei che mi chiedessi le
questioni aperte risolvibili in questa sessione"). Every decision below is in `docs/ROADMAP-v2.md` §8,
in the author's words, recorded before the change it governs.

### What the author decided, and what was written

| Item | Decision (§8) | Commit | Change |
|---|---|---|---|
| scope | (a)–(f), (h)–(k); not (g) | `85754b3` | §8 row |
| (a) sanction ceiling | A, renderer | `4558712` | `js/dna.js sanctionCeiling()`: an amount; "no amount recorded" with the record's note; "not established". The page head, "In short" and the comparison table read it. The renderer never says "none" by itself; the FAQ structured data is unchanged |
| (b) tranche date | B1 | `4558712` | a provision dated by an event that names it carries "a date set for named provisions: what it covers is under Key dates →" |
| (c) institutions | approved | `4558712` | the Binds column shows `obligation_on_institution` (CSA Arts 14 and 21; one other record) |
| (d) "not covered" notice | approved | `4558712` | `instrument.html?id=…` lists the record's relationships with `interactionsFor()`, in a `<div>` (`1d8a305`); nothing when there are none (the DGA shows 2, the EAA none) |
| (e) badge spacing | CSS | `4558712` | `.badge + .fresh{margin-left:var(--s-2)}`: 8px measured |
| (f) EHDS name | approved | `bb2176e` | `KNOWN_AS.ehds` "European Health Data Space": the `<h1>`, the index, the descriptions and `img/og/ehds.png`. The `<title>` is unchanged: `tools/seo.mjs` derives it from `short_name` |
| (h) Apple/Meta note | approved | `19f63c1` | `src-ec-apple-meta-dma-2025`: the note no longer attributes Arts 5(4) and 5(2) to a release that names no article; re-read recorded; `accessed` 2026-10-28 |
| (i) DSA–GDPR edge | A | `19f63c1` | `rel-dsa-gdpr-transparency-minimisation`: summary rewritten on Guidelines 3/2025 v2; `provisions` `dsa:art-16`; v2 reference, `supports:partial`, located; `last_verified` 2026-10-28; it leaves the v1 list. The `conflict` reading and its claim are the author's and unchanged |
| (j) "stalled in Council" | J-A | `19f63c1` | removed from `rel-data-omnibus-gdpr`; `clm-data-omnibus-stalled` off the edge, kept on the instrument; `last_verified` unchanged |
| (k) Regulation (EU) No 910/2014 | K1 + its texts | `98c9ade` | node `eidas` (`scope:referenced`, no page), `src-eurlex-eidas`, `rel-eidas2-eidas-amends` with the arrays, `rel-eidas-ehds-enables` |
| W11 | approved | `98c9ade` | its plant removed "the one relationship that gives it context"; `eidas2` now has two |

### Checks and tests

- **W16**, new: it pins the three sanction states and holds the page head and "In short" to them on
  every instrument page. Measured failing with the old wording planted back into a generated page.
- **W11**, changed:
  - the plant now removes every edge of `eidas2` and still expects M-05;
  - a new assertion records that removing the GDPR edge alone no longer removes its context;
  - no assertion was removed;
  - measured failing with M-05 disabled, then restored.
- No check was changed. No locale key carries any string changed here, so none needed declaring.
- No agent CLI was run; `agent/records/` stayed empty.

### Facts read on 28 Oct 2026

- **(h)**: the DMA portal page of 23 April 2025, and IP/25/1085 in full through the press corner's
  documents API. Neither names an article of the DMA.
- **(i)**: EDPB Guidelines 3/2025 v2 (adopted 17 September 2026), the PDF from the EDPB's site:
  - the table of contents;
  - ¶¶1–11 (¶6: Art. 40 DSA and political advertising are outside their scope);
  - ¶¶53–59 and 79–81 (Art. 26 DSA).
  The source record itself was not changed.
- **(j)**:
  - the Legislative Observatory, 2025/0360(COD): "Awaiting committee decision", ITRE–LIBE;
  - the Publications Office's dossier metadata for COM(2025) 837: pending, not adopted, not withdrawn,
    with Council and Coreper deliberations from December 2025 to October 2026. Coreper events typed
    "Adoption of negotiating mandate" are recorded for 7, 11 and 21 October 2026, and one of 26 June
    is marked cancelled. They are the Council's planning entries (sender `CONSIL:FilePlanning`) and do
    not establish an outcome. The Council's site answered 403.
- **(k)**:
  - Regulation (EU) No 910/2014: Arts 6 and 52 (2014 text);
  - Regulation (EU) 2024/1183 Art. 1, points (1), (2), (3)(a), (6) and (47), including Art. 46b;
  - Regulation (EU) 2025/327: Arts 2(1)(f), 12, 16(1)–(2), 19(2)(m) and 92(8);
  - SPARQL metadata for 32014R0910: in force; 2014-09-17 and 2016-07-01; amended by 32022L2555 and
    32024R1183; consolidations to 2024-10-18; corrigenda R(01)–R(13), none read.
- **Not read**:
  - the NIS2 Article that amends Regulation (EU) No 910/2014 (no `nis2 → eidas` edge);
  - the 910/2014 Regulation's implementing acts, so `eidas` is `status:in-force`, not `applicable`;
  - the Council documents ST 14532/26 and ST 14633/26.

### Counts against this branch's base (`claude/new-session-o9uopd`, the item 2.5 close)

| Measure | Before | After | Why |
|---|---|---|---|
| instruments / provisions / relationships | 37 / 89 / 35 | 38 / 89 / 37 | `eidas`; two edges |
| sources / events / claims / terms | 222 / 100 / 181 / 311 | 223 / 100 / 181 / 311 | `src-eurlex-eidas` |
| coverage covered / mapped / watched / excluded | 15 / 11 / 5 / 6 | 15 / 12 / 5 / 6 | `eidas` is mapped |
| instrument pages · indexable routes | 16 · 25 | 16 · 25 | `eidas` has no page |
| v1 relationships | 9 | 8 | `rel-dsa-gdpr-transparency-minimisation` migrated |
| `validate` / `evidence-audit` / `freshness` | 0/0 (45) · 0 err, 11 warn · 0 defects, 3 prompts | the same | |
| `i18n-audit`, `design-qa`, `seo-audit` | 0/0 | 0/0 | |
| `tools/selftest.mjs` | 105 | 106 | W16 |
| all 25 suites | 1311 + 1 skipped | **1312 pass + 1 skipped (`::1`), 0 failures**, on `98c9ade` | W16 |
| browser suite | 343 · 0 · 1 | 343 · 0 · 1, on `1d8a305`. The first run on `98c9ade` read 342 · 1 · 1: `not-covered:watched` finds no `<section>` in the notice, and (d)'s block was one. It became a `<div>` (§8, `1d8a305`), with the check unchanged. After that commit, `agent/browser` (21/21), `agent/ux` (73), `tools/selftest.mjs` (106) and `design-qa` were re-run | |
| adversarial gate | 65 · 0 · 3 · 1 | 65 · 0 · 3 · 1 | |

Also: `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` and `routes` exit 0;
`og-image.mjs --check` passes; `commit-evidence`: 0 commits without evidence.

### Seen in a browser

All in Chromium at 1280px dark and 390px light, with no console error and no overflow:
- `/instruments/iea/` and `/instruments/csa/`: "no amount recorded" in the head and in "In short",
  the tranche line, and "European Commission" and "ENISA" in Binds;
- `instrument.html?id=dga`: two relationships under the notice;
- `instrument.html?id=eaa`: none;
- `instrument.html?id=eidas`: noindex, no page;
- `/instruments/ehds/` and `/instruments/eidas2/`: the new edges.

### Found, for the author — not changed

1. **The "Read it at the source" link on the "not covered" notice** is in the browser's default blue
   in the dark theme. It predates this work.
2. **The EHDS page `<title>`** still reads "EHDS — …": the derived title uses `short_name`. Changing
   it means touching `tools/seo.mjs`'s derived title, or a curated `INSTRUMENT_TITLE` entry.
3. **`data-omnibus`'s status note** says the 21 October Coreper outcome had not been published. The
   metadata now carry a "negotiating mandate" planning entry for that date, and the outcome could not
   be read from here. It needs re-checking against a Council source.
4. **`nis2 → eidas`** (NIS2 amends Regulation (EU) No 910/2014 per the metadata) is not modelled.

**Still open** (unchanged):
- (g), the internal references shown to a reader: Session 10's item 10.2;
- `src-ec-ai-omnibus-in-force` (403);
- the `::1` test, skipped again;
- the remaining 8 v1 edges and the `edge-v1-sources` flip;
- R-01 and `docs/V2-DATA-DESIGN.md` §7 (Phase 3).

### Verification checklist

- **Decisions:** four §8 rows (`85754b3`, `f61da1e`, `19f63c1`, `98c9ade`). Read them in order. The
  scope and display rows precede their commits; the (h)–(j) and (k) rows were written before the
  data and are committed with it.
- **Display (a)–(e):**
  - *Changed:* `js/dna.js`, `js/instrument-view.js`, `js/instrument-page.js`, `css/tokens.css`, and
    the generated pages.
  - *Verify:* open `/instruments/csa/`, `/instruments/iea/` and `instrument.html?id=dga`.
  - *Automatic:* W16, `design-qa`, the browser suite.
- **(f):**
  - *Changed:* `js/routes.js`, the pages and `img/og/ehds.png`.
  - *Verify:* the `<h1>` of `/instruments/ehds/`.
  - *Automatic:* `seo-audit` checks that `KNOWN_AS` matches an alias.
- **(h)–(j):**
  - *Changed:* `data/sources.json` and `data/instruments.json`.
  - *Verify:* re-read the three sources at their URLs.
  - *Automatic:* W12, which lets the v1 list only shrink.
- **(k):**
  - *Changed:* `data/instruments.json`, `data/sources.json` and `tools/selftest.mjs` W11.
  - *Verify:* `node tools/evidence-audit.mjs --as-of 2026-10-28` reads "mapped 12", and
    `instrument.html?id=eidas` shows the record.
  - *Automatic:* W11, M-07 (`status_basis`) and M-15.
- **Checkpoint:** approved on 28 Oct 2026 (§8, "The checkpoint of v2 Session 8, part 2"); pull request
  opened on the author's instruction.

## Branch register — 28 October 2026 (v2 Session 8)

- At the start, `main` was `3cc0473`, the merge of #27. It holds #26 (`21d6ada`), §8's three Session 7
  rows up to "The checkpoint of v2 Session 7 = item 2.4", and `docs/prompts/v2-session-6.md`, `-7.md`
  and `-8.md`.
- `git branch -r --no-merged origin/main` listed only
  `origin/scout/digest-digest-2026-10-26T13-10-32Z`, already in the registers below and untouched.
- `origin/main` was re-fetched before this handover was written: still `3cc0473`.
- This session's branch: `claude/new-session-o9uopd`. Disposition: item 2.5 approved
  (`docs/ROADMAP-v2.md` §8); pushed, with a pull request to `main` opened on the author's
  instruction of 28 Oct 2026 ("Approvo e apri la PR").

## v2 Session 8 — checkpoint report (item 2.5, the Interoperable Europe Act)

### What the author decided (`docs/ROADMAP-v2.md` §8, in the author's words)

- **The scope** (first write of the session, `11236e5`): item 2.5 only.
- **Item 2.5** (`5c86aa6`), asked one question at a time before anything was written to `data/`.
  Eight answers, all as recommended:
  - *criterion*: `crit:object-infrastructure` + `crit:horizontal`. The addressees are Union entities
    and public sector bodies, defined by function and not by sector (Art. 1(2)). Not
    `crit:sector-instance`, so M-04's edge rule does not apply;
  - *edges*: `iea → gdpr` `defers-to` and `nis2 → iea` `enables`. Either one alone meets the page
    gate's `context` criterion. Not `dga → iea` and not `iea → eaa`;
  - `status:applicable`, with the status note as proposed. The page shows "Applicable";
  - three events (E1–E3);
  - `dna.objective` draft A;
  - the other `dna` fields: four provisions and two new taxonomy terms;
  - a new source, `src-eurlex-iea`;
  - the name: `short_name` "Interoperable Europe Act", nothing in `KNOWN_AS`.

### What was written

| Commit | Record or file | Change |
|---|---|---|
| `0047586` | `iea` | new; `scope:core`; `brief_part` `null`; `status:applicable`, `status_as_of` 2026-10-28; `status_note` (no internal identifier); `status_basis` Art. 23(1)–(2) + metadata; `scope_decision` (included; `crit:object-infrastructure`, `crit:horizontal`; two direct structural references; `approved_on` 2026-10-28); `dna` as decided; `legal_basis` empty |
| | `iea:art-3`, `iea:art-4`, `iea:art-17`, `iea:art-18` | four provisions; `obligation_on` union-entity + public-sector-body, the same, member-state, union-entity |
| | `rel-iea-gdpr-defers`, `rel-nis2-iea-enables` | new, v2 shape, direct; every locator is in the IEA |
| | `tl-iea-2024-04-11-entry-into-force`, `tl-iea-2024-07-12-application`, `tl-iea-2025-01-12-application` | new; the tranche is tagged with `iea:art-3` and `iea:art-17`, and its text says Art. 3(5) is outside it |
| | `actor:union-entity`, `actor:public-sector-body` | new taxonomy terms; nothing renamed |
| | `src-eurlex-iea` | new; its note says what was read and what was not |
| | `tools/selftest.mjs` | W15, new (below) |
| | generated | `instruments/iea/` (new); the GDPR and NIS2 pages (the edges from the other end); `instruments.html`; the `<noscript>` index on every page; `sitemap.xml`; `img/og/iea.png` and its manifest entry. The tool re-rendered the other cards; they were restored, because their inputs did not change (`og-image.mjs --check` passes) |
| `11236e5`, `5c86aa6`, this commit | `docs/ROADMAP-v2.md` §8 | two rows; this report |

Not added:
- no claim (the brief does not name the IEA) and no applicability rule;
- no institution edge: no competent authority is recorded, and the page says "not established";
- no entry in `tools/seo.mjs`, `KNOWN_AS` or `PAGE_PUBLISHED`;
- no record for any other act: Regulation (EU) 2018/1725, Directive (EU) 2019/1024, Regulation (EU)
  No 1025/2012 and the accessibility Directives are cited by the IEA and are not instruments here.

**No locale key was touched.** The fields written are data, which the editions do not carry, so no
key needs declaring `superseded` or `pending_translation`; `i18n-audit` is 0/0.

**Checks.** No check was changed or extended. W15 is a new test on W14's model:
- it asserts that `iea` is covered, sits in no backlog, and that both edges are v2, direct, and
  located in the IEA;
- it asserts that "applicable" holds against `statusContradictions()`, and that Art. 3 dates from
  2025-01-12 and Art. 4 from 2024-07-12;
- it plants the loss of the status basis (M-07), of the decision (M-04), of both edges (M-05) and of
  the objective (M-05), and each one fails;
- it asserts that either edge alone still gives context;
- it plants a future application date, which `statusContradictions()` reports.

Measured: with the error line of M-04 (no decision), M-05 (no page) or M-07 (no status basis)
disabled in `tools/register-audit.mjs`, W15 fails, each time on that plant. The file was restored
(no diff).

No latent defect surfaced in a check: `agent/depth` and `agent/proposals/data` pass unchanged. No
agent CLI was run, and `agent/records/` stayed empty.

### Facts read on 28 Oct 2026, and facts left `null`

- **Read**:
  - Regulation (EU) 2024/903, the Official Journal text, from Cellar by CELEX `32024R0903` (XHTML,
    HTTP 200):
    - the enacting terms in full (Arts 1–23);
    - the Annex;
    - recitals 1–13, 41–43 and 56.
  - The Publications Office's SPARQL metadata:
    - in force; dates recorded 2024-04-11, 2024-07-12, 2025-01-12; deadline 2028-01-12; end of
      validity 9999-12-31;
    - based on Art. 172 TFEU;
    - no amending act; it amends nothing; no consolidated version; no corrigendum (no `R(..)`
      expression exists, so there was no language to ask about).
  - Searched the text in full for penalties, fines, sanctions and infringements. No Article sets any;
    the only mention is recital 41, on the EDPS.
  - Searched for the instruments in the dataset:
    - GDPR (Arts 8(1)(d), 11(4), 12(6)(c), (e), (f)) and NIS2 (Art. 2(3)): edges proposed;
    - DGA (Art. 2(7); Art. 15(5)(s)) and EAA (Art. 5(1)): proposed, not added;
    - ePrivacy: recital 11 only;
    - no reference to Regulation (EU) No 910/2014, to 2024/1183, to the Data Act or to the AI Act.
- **Not read**:
  - the other recitals;
  - the acts recorded as based on it (Regulation (EU) 2025/1420, COM(2025) 860, SWD(2025) 975 and a
    Parliament text, 52026IP0022);
  - the texts the IEA borrows definitions from (Directive (EU) 2022/2555 Art. 6(1); Directive (EU)
    2019/1024 Art. 2(1); Regulation (EU) 2022/868 Art. 2(1)); the edge and the term notes say so;
  - GDPR Art. 36, beyond the IEA's own reference to it.
- **Left `null` or empty, and shown on the page as "not established"**:
  - `risk_logic`, `enforcement_mechanism`, `protected_party`, `territorial_scope`;
  - the sanction ceiling's amounts, with the note that the Regulation sets none;
  - the competent authority: national competent authorities (Art. 17) and the Interoperable Europe
    Board (Art. 15) are not in `institutions.json`, and none was proposed.
- **Not recorded**:
  - Art. 172 TFEU as `legal_basis`: the TFEU record has no such provision;
  - the institutions' deadlines (Art. 3(5) Board guidelines and Art. 12(10) implementing acts) and the
    report of 2028-01-12 and every four years after it (Art. 20(5));
  - `sectors` on the three events (`sector:public-administration` exists and was not proposed).
- No fact was taken from a search result or from model knowledge. The design draft of 25 Oct 2026
  (`docs/v2-design/map-examples.json`) was not copied. Of its statements:
  - its status (applicable) and its three dates survived the re-reading;
  - its scope reason did not: "public-sector counterpart of the rulebook's private-sector duties" is
    not in the text;
  - its event list did not: it had no tranche event, because no provision existed;
  - its GDPR edge's locator now also cites Art. 12(6)(e)–(f).

### Exit criteria of item 2.5 (`docs/ROADMAP-v2.md` §4)

- *Every fact read from a retrieved primary source*: **pass** (above).
- *`sources.json` records only from documents read*: **pass**. One new record, from the text read.
- *Prose and claims to the author*: **pass**. Every text written was in an approved question; no
  claim was created or changed.
- *`node tools/_footer.mjs` re-run*: **pass**. Committed with the data; a second run writes 0 files.
- *Affected locale keys declared*: **n/a**, none touched.
- *M-04, M-05, M-07 held in full*: **pass**. `iea` is in no backlog, and W15 shows each one failing.
- *The page says nothing the records do not carry*: **pass**, with the display observations under
  "Found" below.
- *No relationship added to complete the page*: **pass**. Two edges were approved, each on its own
  text; two more were read, put to the author, and not added.

### Counts against the baseline (v2 Session 7's closing figures, re-measured at the start)

| Measure | Before | After | Why |
|---|---|---|---|
| instruments / provisions / relationships | 36 / 85 / 33 | 37 / 89 / 35 | `iea`; its four provisions; two edges |
| sources / timeline events / claims / taxonomy terms | 221 / 97 / 181 / 309 | 222 / 100 / 181 / 311 | `src-eurlex-iea`; three events; two actor terms |
| coverage covered / mapped / watched / excluded | 14 / 11 / 5 / 6 | 15 / 11 / 5 / 6 | `iea` |
| backlog `status-basis-missing` / `scope-decision-missing` | 23 / 11 | 23 / 11 | a new record joins no backlog |
| instrument pages · indexable routes | 15 · 24 | 16 · 25 | `instruments/iea/` |
| instruments.html "thinner records" | 7 | 7 | `iea` has a page |
| `validate` errors / warnings / unverified | 0 / 0 / 45 | 0 / 0 / 45 | unchanged |
| `evidence-audit --as-of 2026-10-28` errors / warnings | 0 / 11 | 0 / 11 | unchanged |
| `freshness --as-of 2026-10-28` | 0 defects / 3 prompts | 0 / 3 | unchanged |
| `i18n-audit`, `design-qa`, `seo-audit` | 0/0 | 0/0 | unchanged |
| `tools/selftest.mjs` | 104 | 105 | W15 |
| all 25 suites | 1310 pass + 1 skipped | **1311 pass + 1 skipped, 0 failures (1312)** | W15. The skip is the `::1` test, as in Sessions 5–7 |
| browser suite (`--require-browser`) | 343 · 0 · 1 undecidable | 343 · 0 · 1 undecidable | |
| adversarial gate | 65 · 0 · 3 · 1 | 65 · 0 · 3 · 1 | unchanged |

Other checks:
- `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` and `routes` exit 0.
- `tools/og-image.mjs --check` passes.
- `tools/commit-evidence.mjs origin/main HEAD`: 0 commits without evidence. `0047586` names its
  evidence; the others change no published file.
- `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.

### The page, opened in a browser

`/instruments/iea/` was opened in Chromium (Playwright) at 1280px dark and at 390px light. There was no
console error and no horizontal overflow at either width. The GDPR and NIS2 pages were opened the same
way. The IEA page shows:
- Status: "Applicable, as of 28 Oct 2026", with the status note, which gives both application dates
  and says both have passed. The header reads "Next date: nothing further recorded".
- "In short":
  - the objective;
  - "Union entity · Public sector body · Member State";
  - Arts 3 and 4;
  - the three dates;
  - the sanction note;
  - "not established" for the protected party.
- Three dated events, each with its Art. 23 text.
- "No rules recorded", worded as absence of knowledge.
- Four provisions: Arts 3 and 17 "Applies since 12 January 2025", Arts 4 and 18 since 12 July 2024
  (the general date).
- No enforcement recorded, no claims, and "Competent authority: not established in this dataset".
- Two interactions, each with its locator.
- "No Part of the brief covers this instrument directly".

Nothing on the page says the Act binds a private party. The GDPR and NIS2 pages show their edge from
the other end.

### Found, for the author — not changed

1. **The sanction ceiling, worded two ways, now reads against itself.** The header says "Sanction
   ceiling: none recorded". "In short" says "not established", followed by the note "None: no Article
   of the Regulation sets fines or penalties". For an act whose text was read in full and sets none,
   "not established" understates what was checked. This is Session 6's open finding (the CSA reads the
   same), not fixed here.
2. **Art. 3's date carries no qualifier.** The provisions table shows Art. 3 "Applies since
   12 January 2025". Art. 3(5), the Board's guidelines, is not part of that tranche, and only the
   event text says so. It is the same renderer limit as Session 7's finding 1.
3. **The internal reference reaches two more pages.** The `defers-to` and `enables` notes end "Added
   27 Oct 2026 (docs/V2-DATA-DESIGN.md §1.4)". They are printed on `/instruments/iea/` and on the new
   rows of the GDPR and NIS2 pages. This is Session 10's item 10.2.
4. **The status badge touches the "as of" text** on every instrument page with a status badge: no gap
   between the badge's border and "as of" (measured on the IEA, GDPR, DSA and EHDS pages). This is
   display only, predates this item, and is not fixed.
5. **The Commission's and the Board's duties are not shown.** No `obligation_on_institution` was
   proposed (Session 6's finding: the page would not show it anyway).

**Still open from Session 7** (unchanged):
- the tranche dates without their categories in the provisions table (point 2 above);
- Regulation (EU) No 910/2014 not modelled (no `eidas2 → ehds` edge). The IEA does not raise it: its
  enacting terms cite no eIDAS act;
- the internal reference in the `enables` and `defers-to` notes (point 3 above);
- the DGA's "not covered" notice showing no relationships;
- the EHDS's common name not in `KNOWN_AS`.

**Still open from Session 6** (unchanged):
- the sanction ceiling worded two ways (point 1 above);
- `obligation_on_institution` not displayed.

**Still open from Session 5** (the roadmap's §3; none touched):
1. `rel-dsa-gdpr-transparency-minimisation`: its summary no longer matches EDPB Guidelines 3/2025 v2.
2. `rel-data-omnibus-gdpr`: "stalled in Council" is unsupported and not re-read.
3. The 4 brief-only and 3 claimless analytical edges stay v1; the `edge-v1-sources` flip stays
   deferred.
4. The article attribution in `src-ec-apple-meta-dma-2025`'s note.
5. `src-ec-ai-omnibus-in-force`: not re-read (403).
6. The `::1` test: skipped again in this container, so not run. A skip is not a pass.
7. R-01's P2B gap and the eight findings of `docs/V2-DATA-DESIGN.md` §7 (Phase 3).
8. The internal identifiers shown to a reader (Session 10).

### The verification checklist

**8.0 · Questions before writing.**
- *Changed:* `docs/ROADMAP-v2.md` §8, two rows (`11236e5`, `5c86aa6`), both before `0047586`.
- *Verify:* read "The scope of v2 Session 8" and "Item 2.5: the inclusion of `iea`".
  `git log --oneline 3cc0473..` shows both before the data commit.
- *Automatic:* none.
- *Criterion:* every editorial field was decided before `data/` was touched, and `approved_on`
  carries the date of the row.

**8.1 · Sources read first.**
- *Changed:* `data/sources.json` (`src-eurlex-iea`, new).
- *Verify:*
  - fetch `http://publications.europa.eu/resource/celex/32024R0903` with Accept
    `application/xhtml+xml`;
  - read Art. 1, Art. 2 points (3), (5)–(7), Arts 3, 4, 11(4), 12(6), 17, 18 and 23;
  - search the text for "penalt" and "fine";
  - query the SPARQL endpoint for `resource_legal_date_entry-into-force` (three dates), and for
    incoming `amends` or `corrects` relations (none).
- *Automatic:* none. No check reads a source (AUDIT F-12).
- *Criterion:* no fact from a search result or memory.

**8.2 · Written in one home.**
- *Changed:*
  - `data/instruments.json`: `iea`, two edges;
  - `data/timeline.json`: three events;
  - `data/taxonomy.json`: two terms;
  - `data/sources.json`: one source;
  - `tools/selftest.mjs`: W15;
  - the regenerated pages and `img/og/iea.png`.
- *Verify:* `/instruments/iea/`, `/instruments/gdpr/`, `/instruments/nis2/`.
- *Automatic:*
  - `tools/selftest.mjs` W15;
  - S1 (generated files current);
  - `seo-audit` 0/0;
  - `evidence-audit` 0 errors, with `statusContradictions()` for `applicable`.
- *Criterion:*
  - M-04, M-05 and M-07 at 0 errors, held in full;
  - dates only in `timeline.json`;
  - no title in `data/`;
  - no internal identifier in a reader-facing field written here.

**8.3 · Checkpoint.**
- *Changed:* this report.
- *Automatic:* every validator, the 25 suites, the browser suite and the gate, as re-run above.
- *Criterion:* the author's approval, recorded in §8. Item 2.6 does not start before it.
- **Approved** on 28 Oct 2026 (§8, "The checkpoint of v2 Session 8 = item 2.5"); pull request opened
  on the author's instruction.

### How to check it by hand

1. `node tools/evidence-audit.mjs --as-of 2026-10-28`: REGISTER reads "covered 15 · mapped 11".
2. `python3 -m http.server 8000`, then open `/instruments/iea/` in both themes, at desktop and phone
   width. Also open `/instruments/gdpr/` and `/instruments/nis2/` for the edges. `/instruments.html`
   lists the Act with "Applicable".
3. `node --test --test-name-pattern="W15" tools/selftest.mjs`.
4. To see a check hold, delete `status_basis` from `iea` in `data/instruments.json`. `evidence-audit`
   then reports `M-07 instruments/iea: …`. Restore the file afterwards.

## Branch register — 28 October 2026 (v2 Session 7)

- At the start, `main` was `fdc7727`, the merge of #24. §8 carried the three Session 6 rows, up to
  "The checkpoint of v2 Session 6 = item 2.3", and `docs/prompts/v2-session-6.md`.
- `git branch -r --no-merged origin/main` listed two branches:
  - `origin/scout/digest-digest-2026-10-26T13-10-32Z`, already in the registers below and untouched;
  - `origin/claude/v2-session-7-prompt` (`9226a1e`: the prompt and its register entry, above). It was
    reported to the author and merged into this branch on the author's answer ("Solo 2.4, unisci il
    prompt").
- `origin/main` was re-fetched before this handover was written: it had moved to `8c60abb`, the
  merge of #25, which is that same prompt branch. It was merged into this branch (`8c1c480`), with
  no content this branch did not already hold.
- This session's branch: `claude/new-session-6evq51`. Disposition: item 2.4 approved
  (`docs/ROADMAP-v2.md` §8); pushed, with a pull request to `main` opened on the author's
  instruction of 28 Oct 2026 ("Approvo e apri la PR"); merged as #26 (`21d6ada`).
- After the merge, on 28 Oct 2026: the prompt of v2 Session 8 (item 2.5, the Interoperable Europe
  Act) was drafted on the author's request ("Manda session 8 md") and kept as
  `docs/prompts/v2-session-8.md` on `claude/new-session-6evq51`, restarted from `main` at `21d6ada`.
  Pull request to `main` opened on the author's instruction ("Si"). The prompt records no decision: its first write
  is §8's row "The scope of v2 Session 8", in the author's words.

## v2 Session 7 — checkpoint report (item 2.4, the European Health Data Space)

### What the author decided (`docs/ROADMAP-v2.md` §8, in the author's words)

- **The scope** (first write of the session, `96d9b19`): item 2.4 only; the prompt branch merged.
- **Item 2.4**, asked one question at a time before anything was written to `data/`; eleven answers,
  ten as recommended:
  - *criterion*: `crit:object-data` + `crit:sector-instance`. `crit:horizontal` does not hold (the
    rules are those of the health and care sectors), so the inclusion itself rests on an edge to a
    covered instrument;
  - *edges*: `gdpr → ehds` `enables`, knowing it is what shows the sector instance and meets the
    gate's `context` criterion; `ehds → cra` `amends`, with the `amends` / `amended_by` arrays filled;
    `eidas2 → ehds` **not** added (open finding below);
  - *more edges*, **not** as recommended (the recommendation was none): `ehds → data-act`
    `defers-to`, `ehds → ai-act` `defers-to`, `dga → ehds` `enables`;
  - `status:in-force`, with the status note as proposed;
  - four events (E1–E4);
  - `dna.objective` draft B;
  - the other `dna` fields, four provisions and two new taxonomy terms;
  - `clm-ehds-dates` tied to `ehds`, its false sentence replaced;
  - `src-eurlex-ehds` re-read, `src-ec-ehds-page` not used, the scope decision as proposed.

### What was written

| Commit | Record or file | Change |
|---|---|---|
| `fb015c6` | `ehds` | new; `scope:core`; `brief_part` `null`; `status:in-force`, `status_as_of` 2026-10-28; `status_note` (no internal identifier); `status_basis` Art. 105 + metadata; `scope_decision` (included; `crit:object-data`, `crit:sector-instance`; two direct structural references; `approved_on` 2026-10-28); `dna` as decided; `amends` `cra`; `legal_basis` `tfeu:art-114` |
| | `ehds:art-3`, `ehds:art-26`, `ehds:art-60`, `ehds:art-64` | four provisions; `obligation_on` member-state, manufacturer, health-data-holder, none |
| | `cra` | `amended_by` `ehds`; nothing else |
| | `rel-gdpr-ehds-enables`, `rel-ehds-cra-amends`, `rel-ehds-data-act-defers`, `rel-ehds-ai-act-defers`, `rel-dga-ehds-enables` | new, v2 shape, direct, every locator in the EHDS |
| | `tl-ehds-2025-03-25-entry-into-force`, `tl-ehds-2027-03-26-application`, `tl-ehds-2029-03-26-application`, `tl-ehds-2031-03-26-application` | new; the two tranches tagged with the provisions they govern |
| | `actor:health-data-holder`, `actor:health-data-user` | new taxonomy terms; nothing renamed |
| | `clm-ehds-dates` | `instruments` `ehds`; the sentence "The instrument is not modelled in data/instruments.json." replaced; `last_verified` 2026-10-28; statement unchanged |
| | `src-eurlex-ehds` | `accessed` 2026-10-28; the note says what was read and what was not |
| | `tools/register-audit.mjs` | **a check extended**: M-04 now also requires, for a decision citing `crit:sector-instance`, an edge to a covered instrument resting on a direct structural reference (below) |
| | `tools/selftest.mjs` | W14, new; W1 audits the tree as of its own newest decision date (below) |
| | generated | `instruments/ehds/` (new); the GDPR, CRA, Data Act and AI Act pages (the edges from the other end); `instruments.html`; the `<noscript>` index on every page; `sitemap.xml`; `img/og/ehds.png` and its manifest entry. The tool re-rendered the other fifteen cards; they were restored, because their inputs did not change (`og-image.mjs --check` passes) |
| `601fe44` | `agent/depth/detectors.mjs`, `depth.mjs` | a latent id collision the new record exposed (below) |
| `96d9b19`, this commit | `docs/ROADMAP-v2.md` §8 | two rows; this report |

Not added:
- no new claim and no new source;
- no applicability rule and no institution edge;
- no entry in `tools/seo.mjs`, `KNOWN_AS` or `PAGE_PUBLISHED`. The page is headed "EHDS"; a common
  name ("European Health Data Space") in `KNOWN_AS` was not proposed and is the author's to decide.

**No locale key was touched.** The fields written are data, which the editions do not carry, so no
key needs declaring `superseded` or `pending_translation`; `i18n-audit` is 0/0.

**Three changes to checks, each with a test that fails without it:**
1. **M-04 and `crit:sector-instance`.** §5 defines the clause as "shown by an edge to it", and no
   check held it. W14 showed the gap: with every edge from `ehds` to a covered instrument removed and
   the edge to the watched DGA kept, the page gate's `context` criterion still passed and nothing
   failed. M-04 now reports it. W14 asserts that case fails on the new rule and **not** on M-05, and
   it fails again with the new rule disabled (measured). Only `ehds` cites the clause, so no other
   record is affected.
2. **W1's date.** W1 asserted "this tree" clean as of a fixed 2026-10-27. The new decision is dated
   28 Oct, so that date produces a `VERIFIED_AFTER_AS_OF` warning, which W4 says belongs to the date
   asked and not to the tree. W1 now audits as of the tree's newest decision date and asserts that
   date is at least 2026-10-28. The assertions themselves are unchanged.
3. **`agent/depth` ids.** For an act with a sanction ceiling and no enforcement role at all, the
   detector reports two findings, "as different findings rather than averaged into one", and both
   derived one id. `ehds` is the first such act; `agent/depth` and `agent/proposals/data` failed
   "two findings share an id". The minter's own error names the fix, a discriminator. It is passed
   only when no role is held. Measured on the same tree against the code before the fix, **no
   existing gap id changes**: `ai-act`'s and `nis2`'s fines findings and `eidas2`'s and `pld`'s
   general findings keep theirs. That matters, because `agent/improve/cycles/cycles.jsonl` is tracked
   and records ids. No test was changed.

### Facts read on 28 Oct 2026, and facts left `null`

- **Read**:
  - Regulation (EU) 2025/327, the Official Journal text, from Cellar by CELEX `32025R0327` (XHTML):
    - Arts 1–4, 12, 14, 16, 19, 21–22, 26–27, 30, 55, 60–61, 63–65 and 99;
    - Arts 102–104, Art. 104 in full;
    - Art. 105 in full;
    - the chapter boundaries.
  - The Publications Office's SPARQL metadata:
    - in force; entry into force 2025-03-25; no end of validity;
    - dates recorded: 2027-03-26, 2029-03-26, 2031-03-26, 2035-03-26;
    - it amends `32011L0024` and `32024R2847`; the only consolidated version is the original.
  - Regulation (EU) 2024/2847, Arts 13(4), 31(3) and 32, to compare what Art. 104 replaces.
  - Regulation (EU) 2024/1183, Art. 1 points (3)(a) and (6), for the eIDAS question.
- **Not read**:
  - the three corrigenda, `32025R0327R(01)` (French, Croatian, Latvian) and `R(02)`, `R(03)`
    (Hungarian). The metadata lists no English expression for any of them, so the English text is
    not shown to be corrected;
  - Arts 5–11, 13, 15, 17–18, 20, 23–25, 28–29, 31–54, 56–59, 62, 66–98, 100–101 beyond their
    headings, and the Annexes;
  - the implementing and delegated acts the Regulation calls for.
- **Left `null` or empty, and shown on the page as "not established"**:
  - `risk_logic`, `enforcement_mechanism`, `protected_party`, `territorial_scope`.
  - No competent authority. `institutions.json` has none for the EHDS (digital health authorities,
    Art. 19; health data access bodies, Art. 55; GDPR supervisory authorities, Arts 22 and 65), and
    none was researched or proposed.
- **Not recorded**:
  - Art. 16 TFEU, the second legal basis: the dataset's TFEU record has no such provision.
  - Directive 2011/24/EU in `amends`: it is not an instrument in the dataset. The status note names
    it (Art. 103).
  - The 2035 date (Art. 75(5) only), the 2027 deadlines (implementing acts, Art. 99 notification,
    Art. 19(1) designation) and the evaluations (Art. 102).
  - Read and not proposed as edges: `ehds → eprivacy` (Art. 1(3)); `ehds → gdpr` `defers-to`
    (Art. 1(3)), beside the `enables` edge; Art. 27(2) on high-risk AI systems.
- No fact was taken from a search result or from model knowledge. The design draft of 25 Oct 2026
  (`docs/v2-design/map-examples.json`) was not copied. Three of its statements did not survive the
  re-reading:
  - its scope reason ("borrows eIDAS identification … amends the CRA");
  - its eIDAS edge's "as amended": the EHDS cites Regulation (EU) No 910/2014 by its 2014 reference;
  - its CRA summary, written on point (1) alone.

### Exit criteria of item 2.4 (`docs/ROADMAP-v2.md` §4)

- *Every fact read from a retrieved primary source*: **pass** (above).
- *`sources.json` records only from documents read*: **pass**. No new record; one updated after
  re-reading.
- *Prose and claims to the author*: **pass**. Every text written was in an approved question; one
  claim was changed, as approved, and none created.
- *`node tools/_footer.mjs` re-run*: **pass**. Committed with the data; a second run writes 0 files.
- *Affected locale keys declared*: **n/a**, none touched.
- *M-04, M-05, M-07 held in full*: **pass**. `ehds` is in no backlog; W14 shows each one failing,
  including the new sector-instance rule.
- *The page says nothing the records do not carry*: **pass**, with the display observations under
  "Found" below.

### Counts against the baseline (v2 Session 6's closing re-run, re-measured at the start)

| Measure | Before | After | Why |
|---|---|---|---|
| instruments / provisions / relationships | 35 / 81 / 28 | 36 / 85 / 33 | `ehds`; its four provisions; five edges |
| sources / timeline events / claims / taxonomy terms | 221 / 93 / 181 / 307 | 221 / 97 / 181 / 309 | four events; two actor terms |
| coverage covered / mapped / watched / excluded | 13 / 11 / 5 / 6 | 14 / 11 / 5 / 6 | `ehds` |
| backlog `status-basis-missing` / `scope-decision-missing` | 23 / 11 | 23 / 11 | a new record joins no backlog |
| instrument pages · indexable routes | 14 · 23 | 15 · 24 | `instruments/ehds/` |
| instruments.html "thinner records" | 7 | 7 | `ehds` has a page |
| `validate` errors / warnings / unverified | 0 / 0 / 45 | 0 / 0 / 45 | unchanged |
| `evidence-audit --as-of 2026-10-28` errors / warnings | 0 / 11 | 0 / 11 | unchanged. As of 2026-10-27 the after-tree reads 0 / 12: `VERIFIED_AFTER_AS_OF` for `ehds`, dated the day after |
| `freshness` | 0 defects / 2 prompts (as of 10-27) | 0 / 2 (as of 10-27); 0 / 3 (as of 10-28) | the third prompt is the calendar: the same before-tree also reads 3 as of 10-28 |
| `i18n-audit`, `design-qa`, `seo-audit` | 0/0 | 0/0 | unchanged |
| `tools/selftest.mjs` | 103 | 104 | W14 |
| all 25 suites | 1309 + 1 skipped | **1310 pass + 1 skipped, 0 failures (1311)** | W14. The skip is the `::1` test, as in Sessions 5 and 6 |
| browser suite (`--require-browser`) | 343 · 0 · 1 undecidable | 343 · 0 · 1 undecidable | unchanged (`a11y:bound`) |
| adversarial gate | 65 · 0 · 3 · 1 | 65 · 0 · 3 · 1 | unchanged |

Other checks:
- `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` and `routes` exit 0.
- `tools/og-image.mjs --check` passes.
- `tools/commit-evidence.mjs origin/main HEAD`: 0 commits without evidence. `fb015c6` names its
  evidence; the others change no published file or are merges.
- `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.

**One failure on the way, and its cause.** A first re-run had `agent/proposals/governance` at 42 + 3
failures (P-07: "76 proposal(s) are reachable … expects 0"). The cause was this session's own
`node agent/depth/cli.mjs` run, made to identify a gap id: it wrote 76 records into the git-ignored
`agent/records/`, which is empty on a fresh clone. The file, created at 10:04 that day and holding
only `data-depth` records, was deleted. The suite then passed 45/45. Nothing in the tree was the
cause.

### The page, opened in a browser

`/instruments/ehds/` was opened in Chromium (Playwright) at 1280px dark and 390px light. There was no
console error and no horizontal overflow at either width. The GDPR, CRA, Data Act and AI Act pages were
opened the same way. The page shows:
- Status: in force, as of 28 Oct 2026, and the status note. The header's next date is 26 March 2027,
  "Application date". Nothing says the Regulation applies today.
- "In short":
  - the objective;
  - "Member State · Manufacturer · Health data holder · Health data user";
  - Arts 3, 26 and 60;
  - the four dates;
  - "4% of global turnover / EUR 20m", with the two-tier note;
  - "not established" for the protected party.
- Four dated events, each with its Art. 105 text.
- "No rules recorded", worded as absence of knowledge.
- Four provisions, with their application dates.
- No enforcement recorded.
- One claim, graded primary law.
- Five interactions, each with its locator.
- "No Part of the brief covers this instrument directly".

Each other page shows its edge from the other end.

### Found, for the author — not changed

1. **The tranche dates in the provisions table carry no qualifier.** Arts 3 and 26 show "Applies
   from 26 March 2029, then from 26 March 2031". The event text says the 2029 date covers only the
   categories of Art. 14(1)(a)–(c) and the 2031 date covers (d)–(f), but the table does not repeat
   that. It is how the renderer shows any tranche, and the AI Act reads the same. It is not a data
   question, but a reader of the table alone could take 2029 as the date for all of Art. 3.
2. **eIDAS, not modelled** (the author's decision). The EHDS cites Regulation (EU) No 910/2014:
   - Art. 2(1)(f) borrows its Art. 3 points (1)–(2), which Regulation (EU) 2024/1183 replaced;
   - Arts 12 and 16(1) rely on Art. 6, which 2024/1183 did not amend.
   The question is whether to model the 910/2014 Regulation as a node. It is open, and no node was
   created.
3. **The internal reference now reaches more pages.** The `rel-kind:enables` and `defers-to` notes
   end "Added 27 Oct 2026 (docs/V2-DATA-DESIGN.md §1.4)". The interactions box prints them, now also
   on `/instruments/ehds/` and on the new rows of the GDPR, Data Act and AI Act pages. This is
   Session 10's item 10.2, not fixed here.
4. **The DGA's "not covered" notice shows no relationships.** `instrument.html?id=dga` renders the
   notice only, so `rel-dga-ehds-enables` is visible from the EHDS page alone. The DGA's existing
   edges are rendered the same way.
5. **Not this item's**: the `missing_competence` findings for `ehds` (a ceiling and no institution
   named) are what `agent/depth` now reports for it, as it does for `eidas2` and `pld`.

**Still open from Session 6** (unchanged):
- the `enables` note's internal reference (point 3 above);
- the sanction ceiling worded two ways, on the CSA and eIDAS2 pages. The EHDS, with a figure, reads
  the same in both places;
- `obligation_on_institution` not displayed.

**Still open from Session 5** (the roadmap's §3; none touched):
1. `rel-dsa-gdpr-transparency-minimisation`: its summary no longer matches EDPB Guidelines 3/2025 v2.
2. `rel-data-omnibus-gdpr`: "stalled in Council" is unsupported and not re-read.
3. The 4 brief-only and 3 claimless analytical edges stay v1; the `edge-v1-sources` flip stays
   deferred.
4. The article attribution in `src-ec-apple-meta-dma-2025`'s note.
5. `src-ec-ai-omnibus-in-force`: not re-read (403).
6. The `::1` test: skipped again in this container, so not run. A skip is not a pass.
7. R-01's P2B gap and the eight findings of `docs/V2-DATA-DESIGN.md` §7 (Phase 3). F-1 did not
   grow: the new `amends` edge has its arrays filled.
8. The internal identifiers shown to a reader (Session 10).

### The verification checklist

**7.0 · Questions before writing.**
- *Changed:* `docs/ROADMAP-v2.md` §8, two rows (`96d9b19`, `fb015c6`).
- *Verify:* read "The scope of v2 Session 7" and "Item 2.4: the inclusion of `ehds`".
- *Automatic:* none.
- *Criterion:* every editorial field was decided before `data/` was touched, and `approved_on`
  carries the date of the row.

**7.1 · Sources read first.**
- *Changed:* `data/sources.json` (`src-eurlex-ehds`: `accessed`, note).
- *Verify:*
  - fetch `http://publications.europa.eu/resource/celex/32025R0327` with Accept
    `application/xhtml+xml`;
  - read Art. 1(1)–(2), Art. 2(1)(a), (c) and (f), Art. 22, Art. 64, Art. 104 and Art. 105;
  - query the SPARQL endpoint for `resource_legal_date_entry-into-force` (2025-03-25) and for the
    corrigenda's languages.
- *Automatic:* none. No check reads a source (AUDIT F-12).
- *Criterion:* no fact from a search result or memory.

**7.2 · Written in one home.**
- *Changed:*
  - `data/instruments.json`: `ehds`, `cra.amended_by`, five edges;
  - `data/timeline.json`: four events;
  - `data/taxonomy.json`: two terms;
  - `data/claims.json`: `clm-ehds-dates`;
  - `tools/register-audit.mjs`, `tools/selftest.mjs`;
  - `agent/depth/`;
  - the regenerated pages and `img/og/ehds.png`.
- *Verify:* `/instruments/ehds/`, and `/instruments/gdpr/`, `/cra/`, `/data-act/`, `/ai-act/`.
- *Automatic:*
  - `tools/selftest.mjs` W14 (and W1);
  - S1 (generated files current);
  - `seo-audit` 0/0;
  - `agent/depth` "every gap id is distinct";
  - `agent/proposals/data` "every … data gap id in a run is distinct".
- *Criterion:*
  - M-04 (with the sector-instance rule), M-05 and M-07 at 0 errors, held in full;
  - dates only in `timeline.json`;
  - no title in `data/`;
  - no internal identifier in a reader-facing field written here.

**7.3 · Checkpoint.**
- *Changed:* this report.
- *Automatic:* every validator, the 25 suites, the browser suite and the gate, as re-run above.
- *Criterion:* the author's approval, recorded in §8. Item 2.5 does not start before it.
- **Approved** on 28 Oct 2026 (§8, "The checkpoint of v2 Session 7 = item 2.4"); pull request opened
  on the author's instruction.

### How to check it by hand

1. `node tools/evidence-audit.mjs --as-of 2026-10-28`: REGISTER reads "covered 14 · mapped 11".
2. `python3 -m http.server 8000`, then open `/instruments/ehds/` in both themes, at desktop and phone
   width, and `/instruments/gdpr/` for the edge that holds the criterion. `/instruments.html` lists
   the EHDS.
3. `node --test --test-name-pattern="W1 |W14" tools/selftest.mjs`.
4. To see the new rule fail, delete from `data/instruments.json` the four edges between `ehds` and
   GDPR, CRA, Data Act and AI Act, keeping the DGA's. `evidence-audit` then reports
   `M-04 instruments/ehds: crit:sector-instance …` and no M-05. Restore the file afterwards.

## Branch register — 27 October 2026 (v2 Session 6)

## Branch register — 27 October 2026 (v2 Session 6)

- At the start, `main` was `59dc88c`, the merge of #23. §8 carried every Session 5 row, including
  "The Part B checkpoint of v2 Session 5".
- `git branch -r --no-merged origin/main` listed only
  `origin/scout/digest-digest-2026-10-26T13-10-32Z`, already in the registers below and untouched.
- `origin/main` was re-fetched before this handover was written: still `59dc88c`.
- This session's branch: `claude/v2-session-6-csa`. Disposition: item 2.3 approved
  (`docs/ROADMAP-v2.md` §8); pushed, with a pull request to `main` opened on the author's
  instruction of 27 Oct 2026 ("Si"); merged as #24 (`fdc7727`).
- After the merge, on 28 Oct 2026: the prompt of v2 Session 7 (item 2.4, the EHDS) was drafted and,
  on the author's instruction ("Si"), kept as `docs/prompts/v2-session-7.md` on branch
  `claude/v2-session-7-prompt`, with a pull request to `main`. It records no decision: the prompt's
  first write is §8's row "The scope of v2 Session 7", in the author's words.

## v2 Session 6 — checkpoint report (item 2.3, the Cyber Solidarity Act)

### What the author decided (`docs/ROADMAP-v2.md` §8, in the author's words)

- **The scope**: the author's roadmap after v2 Session 5, which covers sessions 6–16, is kept as
  `docs/prompts/v2-session-6.md`. Session 6 is **item 2.3 only**, ending at a checkpoint.
- **Item 2.3, asked before anything was written to `data/`**, in seven answers, all as recommended:
  - `status:in-force`, not `status:applicable`;
  - `dna.objective` draft A;
  - `rel-nis2-csa-enables` added. The author knew it is also what meets the gate's `context`
    criterion;
  - the factual `dna` fields as proposed, with the analytical ones `null`;
  - the scope decision, status note, status basis and source as proposed;
  - only the entry-into-force event, not the Art. 25(1) evaluation date;
  - the roadmap recorded in §8 and in `docs/prompts/`.

### What was written — commit `f75c0f4`

| Record | Change |
|---|---|
| `csa` | new; `scope:core`; `brief_part` `null`; `status:in-force`, `status_as_of` 2026-10-27; `status_note` (no internal identifier); `status_basis` Art. 26 + metadata; `scope_decision` (included; `crit:object-security`, `crit:horizontal`; two direct structural references; `approved_on` 2026-10-27); `dna` as decided; `legal_basis` `tfeu:art-173` |
| `csa:art-3`, `csa:art-14`, `csa:art-21` | three provisions, one per mechanism of Art. 1(1); `obligation_on` empty (participation in the Alert System is voluntary); `obligation_on_institution` `ec` (Art. 14) and `enisa` (Art. 21) |
| `rel-nis2-csa-enables` | new, v2 shape; direct; "Art. 2, points (3)–(7), (9), (10), (12) and (16)". The locator is in the dependent act |
| `tl-csa-2025-02-04-entry-into-force` | new |
| `src-eurlex-csa` | new, tier 1, Cellar; the note says what was read and what was not |
| `tools/selftest.mjs` | W13: removing the status basis, the decision, the edge or the objective each fails (M-07, M-04, M-05 ×2). It also checks that the edge is v2, direct and structural, and located in the CSA |
| generated | `instruments/csa/` (new); `instruments.html`; the `<noscript>` index on every page; the NIS2 and GDPR pages (the edge from the other end and the related list); `sitemap.xml`; `img/og/csa.png` and its manifest entry. The tool re-rendered the other fourteen cards; they were restored, because their inputs did not change (`og-image.mjs --check` passes) |
| `docs/ROADMAP-v2.md` §8, `docs/prompts/v2-session-6.md` | two rows; the prompt |

Not added:
- no claim;
- no taxonomy term;
- no applicability rule;
- no institution edge;
- no entry in `tools/seo.mjs`, `KNOWN_AS` or `PAGE_PUBLISHED`.

**No locale key was touched.** The fields written are data, which the editions do not carry, so no
key needs declaring `superseded` or `pending_translation`; `i18n-audit` is 0/0.

### Facts read on 27 Oct 2026, and facts left `null`

- **Read**:
  - Regulation (EU) 2025/38, the Official Journal text, retrieved from Cellar by CELEX `32025R0038`
    (XHTML). Read in full: Arts 1–21 and 23–26. Of Art. 22 (the amendments to Regulation (EU)
    2021/694), only the opening.
  - The Publications Office's SPARQL metadata: in force, entry into force 2025-02-04, no end of
    validity, no amending act; the only consolidated version is the original.
  - The corrigenda:
    - OJ L 2025/90063: a reference in the Annex;
    - OJ L 2025/90886: Art. 22, point (3)(b);
    - neither touches an Article cited in the records.
- **Not read**:
  - corrigendum `32025R0038R(02)`: Cellar returned no English text;
  - the Council implementing decisions and the Commission documents that the metadata lists as
    based on, or citing, the Act (`32025D1458`, `32026D1354`, `32026D1725` and others);
  - whether ENISA has issued the interoperability guidelines due "by 5 February 2026" (Art. 6(4)).
    For that reason no event was proposed for it.
- **Left `null` or empty, and shown on the page as "not established"**:
  - `risk_logic`, `enforcement_mechanism`, `protected_party`, `territorial_scope`;
  - `obligation_anchor`;
  - the sanction amounts. The note says the text sets no fines or penalties: the whole OJ text was
    searched for "penalt", "fines" and "sanction", with no match.
  - No competent authority: `institutions.json` has none for the CSA, and none was researched.
- **Not recorded**:
  - Art. 322(1)(a) TFEU, the second legal basis. The dataset's TFEU record has no such provision,
    and adding one was not proposed.
  - Regulation (EU) 2021/694 in `amends`, because it is not an instrument in the dataset. The
    status note names it.
- No fact was taken from a search result or from model knowledge. The design draft of 25 Oct 2026
  (`docs/v2-design/map-examples.json`) was not copied: every field was re-read in the text.

### Exit criteria of item 2.3 (`docs/ROADMAP-v2.md` §4)

- *Every fact read from a retrieved primary source* — **pass** (above).
- *`sources.json` records only from documents read* — **pass**: one new record, for the text read.
- *Prose and claims to the author* — **pass**: every text written was in the approved block; no
  claim was created.
- *`node tools/_footer.mjs` re-run* — **pass**: committed with the data; a second run writes 0 files.
- *Affected locale keys declared* — **n/a**: none touched.
- *M-04, M-05, M-07 held in full* — **pass**: `csa` is in no backlog; W13 shows each one failing.
- *The page says nothing the records do not carry* — **pass**, with the two display observations
  under "Found" below.

### Counts against the baseline (v2 Session 5's closing re-run)

| Measure | Before | After | Why |
|---|---|---|---|
| instruments / provisions / relationships | 34 / 78 / 27 | 35 / 81 / 28 | `csa`; its three provisions; `rel-nis2-csa-enables` |
| sources / timeline events / claims / taxonomy terms | 220 / 92 / 181 / 307 | 221 / 93 / 181 / 307 | `src-eurlex-csa`; the entry-into-force event |
| coverage covered / mapped / watched / excluded | 12 / 11 / 5 / 6 | 13 / 11 / 5 / 6 | `csa` |
| backlog `status-basis-missing` / `scope-decision-missing` | 23 / 11 | 23 / 11 | a new record joins no backlog |
| instrument pages · indexable routes | 13 · 22 | 14 · 23 | `instruments/csa/` |
| instruments.html "thinner records" | 7 | 7 | `csa` has a page |
| `validate` errors / warnings / unverified | 0 / 0 / 45 | 0 / 0 / 45 | unchanged |
| `evidence-audit --as-of 2026-10-27` errors / warnings | 0 / 11 | 0 / 11 | unchanged |
| `freshness --as-of 2026-10-27` | 0 defects / 2 prompts | 0 / 2 | unchanged |
| `i18n-audit`, `design-qa`, `seo-audit` | 0/0 | 0/0 | unchanged |
| `tools/selftest.mjs` | 102 | 103 | W13 |
| all 25 suites | 1309 + 1 skipped | **1309 pass + 1 skipped, 0 failures (1310)** | W13; the skip is the `::1` test, as in Session 5 |
| browser suite | 343 · 0 · 1 undecidable | 343 · 0 · 1 undecidable | unchanged (`a11y:bound`) |
| adversarial gate | 65 · 0 · 3 · 1 | 65 · 0 · 3 · 1 | unchanged |

The provisions "before" figure (78) was counted on `data/instruments.json` at `59dc88c`; Session 5's
report did not record it.

Other checks:
- `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` and `routes` exit 0.
- `tools/og-image.mjs --check` passes.
- `tools/commit-evidence.mjs origin/main HEAD`: 0 commits without evidence.
- `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.

### The page, opened in a browser

`/instruments/csa/` was opened in Chromium (Playwright) at 1280px dark and 390px light. There was no
console error and, at 390px, no horizontal overflow. The page shows:
- Status: in force, as of 27 Oct 2026, and the status note.
- "In short":
  - the objective;
  - "Member State · Public authority";
  - "not established" for the protected party, the core obligations and the sanction ceiling, with
    the note;
  - entry into force on 4 February 2025.
- One dated event.
- "No rules recorded", worded as absence of knowledge.
- Three provisions.
- No enforcement recorded.
- "No claims attached".
- One interaction, "NIS2 enables Cyber Solidarity Act", with its locator.
- "No Part of the brief covers this instrument directly".

`/instruments/nis2/` shows the same edge from the other end.

### Found, for the author — not changed

1. **The internal reference reaches two more pages.** The `rel-kind:enables` taxonomy note ends
   "Added 27 Oct 2026 (docs/V2-DATA-DESIGN.md §1.4)". The interactions box prints it, now also on
   `/instruments/csa/` and on NIS2's new row. This is Session 10's item 10.2, foreseen when the edge
   was approved; it is not fixed here.
2. **The sanction ceiling reads two ways on one page.** The header strip says "none recorded"; "In
   short" says "not established", followed by the note that the text sets no penalties. This is
   the renderer's wording for null amounts, and eIDAS2 reads the same. It is not a data question.
3. **`obligation_on_institution` is not displayed.** The provisions table shows "not recorded"
   under "Binds" for Arts 14 and 21, although the records name the Commission and ENISA.
   `dma:art-53`, the one other provision with the field, renders the same way: checked on
   `/instruments/dma/`. This is a renderer gap, not changed.

**Still open from Session 5** (the roadmap's §3; none touched):
1. `rel-dsa-gdpr-transparency-minimisation`: its summary and provisions no longer match EDPB
   Guidelines 3/2025 v2. The revision is the author's.
2. `rel-data-omnibus-gdpr`: "stalled in Council" is carried by no source on the edge, and has not
   been re-read.
3. The 4 brief-only and 3 claimless analytical edges stay v1; the `edge-v1-sources` flip stays
   deferred.
4. The article attribution in `src-ec-apple-meta-dma-2025`'s note.
5. `src-ec-ai-omnibus-in-force`: not re-read (403).
6. The `::1` test: skipped again in this container, so not run. A skip is not a pass.
7. R-01's P2B gap and the eight findings of `docs/V2-DATA-DESIGN.md` §7 belong to Phase 3.
8. The internal identifiers shown to a reader (`eidas2.status_note`; the `defers-to` and `enables`
   notes). These are Session 10's.

### The verification checklist

**6.0 · Questions before writing.**
- *Changed:* `docs/ROADMAP-v2.md` §8, two rows.
- *Verify:* read "The scope of v2 Session 6" and "Item 2.3: the inclusion of `csa`".
- *Criterion:* every editorial field was decided before `data/` was touched.

**6.1 · Sources read first.**
- *Changed:* `data/sources.json` (`src-eurlex-csa`).
- *Verify:*
  - fetch `http://publications.europa.eu/resource/celex/32025R0038` with Accept
    `application/xhtml+xml`;
  - read Art. 1(1), Art. 2 points (3)–(16), Art. 26;
  - query the SPARQL endpoint for `resource_legal_date_entry-into-force` (2025-02-04).
- *Automatic:* none. No check reads a source (AUDIT F-12).

**6.2 · Written in one home.**
- *Changed:*
  - `data/instruments.json`: `csa` and `rel-nis2-csa-enables`;
  - `data/timeline.json`: one event;
  - the regenerated pages;
  - `img/og/csa.png`.
- *Verify:* `/instruments/csa/` and `/instruments/nis2/`.
- *Automatic:*
  - `tools/selftest.mjs` W13;
  - S1 (generated files current);
  - `seo-audit` 0/0.
- *Criterion:*
  - M-04, M-05 and M-07 at 0 errors, held in full;
  - the date lives only in `timeline.json`;
  - no title in `data/`.

**6.3 · Checkpoint.**
- *Changed:* this report.
- *Automatic:* every validator, the 25 suites, the browser suite and the gate, as re-run above.
- *Criterion:* the author's approval, recorded in §8. Item 2.4 does not start before it.

### How to check it by hand

1. `node tools/evidence-audit.mjs --as-of 2026-10-27`: REGISTER reads "covered 13 · mapped 11".
2. `python3 -m http.server 8000`, then open `/instruments/csa/` in both themes, at desktop and phone
   width, and `/instruments/nis2/` for the edge from the other end. `/instruments.html` lists the
   Cyber Solidarity Act.
3. `node --test --test-name-pattern=W13 tools/selftest.mjs`.

## Branch register — 27 October 2026 (v2 Session 5)

- At the start, `main` contained #21 (`b304114`) and §8's row "The scope of v2 Session 5" (#22,
  `64aa696`).
- `git branch -r --no-merged origin/main` listed only
  `origin/scout/digest-digest-2026-10-26T13-10-32Z`, already in the registers below and untouched.
- This session's branch: `claude/new-session-9ud5l5`. Disposition: Parts A and B approved (`docs/ROADMAP-v2.md` §8); pull request #23 to `main`, opened on the author's instruction of 27 Oct 2026 ("Sì, apri la PR").

## v2 Session 5 — Part B checkpoint report (B.1–B.3)

The author approved the Part A checkpoint (`docs/ROADMAP-v2.md` §8). With it, the internal references
the report found stay an open finding, unchanged.

### B.1 · PP-09's stale text — commit `bd2c318`

- `agent/policy/verify/attacks.mjs` PP-09 said nothing had ever fetched the deployed site.
- Its reason now cites `docs/DEPLOYMENT.md`'s dated measurements:
  - §1, 27 Sep 2026, on `github.io`;
  - §1a, 23 Oct 2026, on `eudigitalpolicy.eu`;
  - §1b, 24 Oct 2026, after the switch to GitHub Actions.
- It says those readings were taken by hand, not by the gate, and that `agent/records/` was never
  requested by name. `would_need` names the custom domain.
- **The outcome is unchanged**: undecidable, high. The gate performs no network I/O, so dated readings
  do not tell it what the origin serves on the day it runs. No outcome change was proposed.
- **`agent/policy/` was edited** — a never-automatic path. This is the one file.
- The gate reads 65 · 0 · 3 · 1 before and after. `agent/policy/verify` passes 9/9 and
  `agent/policy` 36/36.

### B.2 · The OIDC redirect URI and the `::1` origin — commit `dd3c1fe`

- **One home:** `.control-room/config.mjs serverOrigin(cfg, port)`. It returns the configured public
  origin, or the bind host and port, with an IPv6 host bracketed (`http://[::1]:7802`).
- `server.mjs selfOrigin()` asks it with the port actually listening.
- The `OidcProvider` is handed the server's `selfOrigin`, so `redirectUri()` reads the same value.
  With no server, it falls back to `serverOrigin(cfg)`.
- **Not loosened:**
  - the Origin comparison is the same exact match;
  - the CSRF check is unchanged;
  - state, nonce and PKCE are untouched, and the three existing OIDC tests pass.
- **Tests** in `.control-room/selftest.mjs`; the first two were reproduced failing before the fix,
  with `'http://::1:7802/auth/callback'` and `'http://127.0.0.1:0/auth/callback'`:
  - "ORIGIN · B.2 · one home …" (pure);
  - "OIDC · B.2 · with port 0, the redirect URI … carries the port actually listening": a real
    server, a stub IdP, and the `Location` of `GET /auth/login`;
  - "ORIGIN · B.2 · bound to ::1 …": the bracketed origin passes, while the unbracketed one, the
    `127.0.0.1` one and a foreign one are refused.
- **That third test did not run here.** This container cannot bind `::1` (`EAFNOSUPPORT`), so it
  reports itself SKIPPED with that reason. It runs wherever IPv6 loopback exists. Whether the GitHub
  runner has IPv6 loopback was not measured.

### B.3 · The migration of the readable relationships — commit `f90212f`

- **Measured 27 Oct 2026:**
  - 13 of the 17 v1 relationships cite only tier-1 or tier-2 sources;
  - 3 of those 13 are the claimless analytical edges, which leaves the prompt's 10;
  - 4 edges rest only on `src-brief-original`.
- **Re-read that day:**
  - through Cellar by CELEX: 32016R0679, 32024R1689, 32024L2853, 32026R1744, 32022R2554, 32022L2555,
    32022R2065, 32022R1925 and 52025PC0837 (the last as the PDF of `DOC_1`);
  - through the Commission press corner's documents API: IP/25/1992 and IP/25/1085;
  - from the EDPB's site: Guidelines 3/2025 v2 (PDF, adopted 17 Sep 2026).
- **Migrated (8), on the author's decisions:**

  | Relationship | References |
  |---|---|
  | `rel-ai-act-gdpr-art-22` | GDPR Art. 22(1), Art. 99(2) direct · AI Act Art. 6 partial |
  | `rel-ai-act-pld` | PLD Art. 4 point (1), recital 13 partial (analytical) |
  | `rel-nis2-dora` | DORA recital 16, Art. 1(2) direct · NIS2 Art. 4 partial |
  | `rel-dsa-ecommerce` | DSA Art. 89(1)–(2) direct |
  | `rel-nis2-nis1` | NIS2 Art. 44 direct |
  | `rel-dma-tfeu-102` | **+ DMA Art. 1(6) direct** · IP/25/1992 partial |
  | `rel-dma-gdpr-consent` | **+ DMA Art. 5(2) direct** · IP/25/1085 partial (the release text retrieved that day names no article) |
  | `rel-ai-omnibus-ai-act` | Regulation (EU) 2026/1744 Art. 1, point (40) direct. `src-ec-ai-omnibus-in-force` **left the edge**: it answered 403 and was not re-read. It stays on `clm-ai-act-delay-scope` |

- **Stay v1 (2), on the author's decisions:**
  - `rel-dsa-gdpr-transparency-minimisation`: **the source no longer carries the summary.** EDPB
    Guidelines 3/2025 v2 ¶6 put Art. 40 DSA researcher access outside their scope, and treat
    advertising transparency under Art. 26 (¶79–80), with Art. 39 named only in ¶118. The summary
    and `provisions` (`dsa:art-39`, `dsa:art-40`) are the author's to revise; nothing was changed.
  - `rel-data-omnibus-gdpr`: "stalled in Council" is carried by no source on the edge, and the
    Council stage was not re-read.
- **Backlog unchanged:** the 4 brief-only edges and the 3 claimless analytical edges. The
  `edge-v1-sources` flip was not done. v1 edges: **17 → 9**.
- Every migrated edge has `last_verified` 2026-10-27 and a note saying what was read and through
  which channel. No `summary` was changed.
- **Sources** re-read: `accessed` is 2026-10-27 and the note names the channel, for `src-eurlex-gdpr`,
  `-ai-act`, `-pld`, `-ai-omnibus`, `-nis2`, `-dma`, `src-ec-google-adtech-2025` and
  `src-ec-apple-meta-dma-2025`. The last two are tier 2, read through the press corner, and the
  Google URL now redirects to IP/25/1992. `src-edpb-guidelines-3-2025` was read but not changed:
  its finding is the v1 decision above.
- **No edge check exists in code** (M-08 to M-14 are D1's, not implemented). `tools/selftest.mjs` W12
  therefore pins the data:
  - the 8 migrated edges stay v2;
  - each direct tier-1 reference is structurally located;
  - each textual edge has a direct reference;
  - the remaining v1 edges are the 9 named;
  - a planted relapse is caught.

### Re-run on the final tree

- Validators, unchanged from the Part A checkpoint:
  - `validate`: 0/0, 45 unverified;
  - `i18n-audit`, `design-qa`, `seo-audit`: 0/0;
  - `evidence-audit --as-of 2026-10-27`: 0 errors, 11 warnings; REGISTER "covered 12 · mapped 11 ·
    watched 5 · excluded 6";
  - `freshness --as-of 2026-10-27`: 0 defects, 2 prompts.
- Suites: all 25 pass, **1309 tests**, 0 failures, 1 skipped (the `::1` test, as above), with
  `BROWSER_QA_CHROME` set. That is 1305 at the Part A checkpoint: `.control-room/` 74 → 77 (B.2) and
  `tools/` 101 → 102 (W12).
- Browser suite: 343 pass · 0 fail · 1 undecidable (`a11y:bound`).
- Adversarial gate: 65 · 0 · 3 · 1, unchanged.
- `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` and `routes` exit 0.
- `tools/commit-evidence.mjs origin/main HEAD`: 5 commits, 0 without evidence.
- `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.

### Found, for the author — not changed

1. `rel-dsa-gdpr-transparency-minimisation`: its summary and provisions no longer match its one
   source (above).
2. `src-ec-apple-meta-dma-2025`'s note attributes "under Art. 5(2)" and "under Art. 5(4)" to IP/25/1085.
   The release text retrieved on 27 Oct 2026 names no article, so the attribution may come from a part
   of the page not in that text. Not changed.
3. `src-ec-ai-omnibus-in-force` could not be re-read (403). It still supports `clm-ai-act-delay-scope`
   as last read on 27 Aug 2026.
4. Still open from Part A: internal identifiers shown to a reader (`eidas2.status_note`; the
   `defers-to`/`enables` taxonomy notes).

## v2 Session 5 — the verification checklist

**A.0 · Questions before writing.**
- *Changed:* `docs/ROADMAP-v2.md` §8, one row with the author's four answers.
- *Verify:* read the row "Four questions on item 2.2".
- *Automatic:* none (decisions).
- *Criterion:* gate, page fields and stale texts decided before `data/` was touched.

**A.1 · The promotion, in one block.**
- *Changed:* §8 row "Item 2.2: the promotion of `eidas2`".
- *Verify:* `scope_decision.approved_on` is 2026-10-27, with no DRAFT.
- *Automatic:* `tools/selftest.mjs` W3 (M-04 on any decision) and W11.
- *Criterion:* approved by the author before writing.

**A.2 · Sources read first.**
- *Changed:* the notes of the three sources, two claims, two events and the rule.
- *Verify:* fetch `http://publications.europa.eu/resource/celex/32024R1183` (Accept
  `application/xhtml+xml`) and read Art. 1 point (2)(b) and Art. 2.
- *Automatic:* none reads a source (AUDIT F-12).
- *Criterion:* every fact re-read; nothing from a search or from memory.

**A.3 · Written in one home.**
- *Changed:* `data/instruments.json` (`eidas2`, `rel-eidas2-gdpr-defers`), `timeline.json` (1),
  `taxonomy.json` (1), `claims.json`, `applicability.json`, `sources.json`;
  `tools/register-audit.mjs`; regenerated pages; `img/og/eidas2.png`.
- *Verify:* `/instruments/eidas2/`.
- *Automatic:* `tools/selftest.mjs` W11 (M-04, M-05, M-07 held in full), S1 (generated files
  current) and W1 (backlog 23).
- *Criterion:* M-04, M-05 and M-07 at 0 errors; dates only in `timeline.json`; no title in `data/`.

**A.4 · Checkpoint A.**
- *Changed:* `docs/HANDOVER.md`.
- *Verify:* the report above.
- *Automatic:* every validator, the 25 suites, the browser suite and the gate, as re-run.
- *Criterion:* approved (§8).

**B.1 · PP-09.**
- *Changed:* `agent/policy/verify/attacks.mjs` (PP-09 only).
- *Verify:* `node agent/policy/verify/cli.mjs` and read PP-09.
- *Automatic:* `agent/policy/verify/selftest.mjs` (the gate reproducible; outcome counts unchanged).
- *Criterion:* the text cites the dated measurements, and the outcome is what they support.

**B.2 · Origin and redirect URI.**
- *Changed:* `.control-room/config.mjs`, `authn.mjs`, `server.mjs`, `selftest.mjs`.
- *Verify:* run `CONTROL_ROOM_PORT=0 CONTROL_ROOM_AUTH_PROVIDER=oidc …` against an IdP, then open
  `/auth/login`. `redirect_uri` carries the real port. On a host with IPv6, also check
  `CONTROL_ROOM_HOST=::1`.
- *Automatic:* `.control-room/selftest.mjs` "ORIGIN · B.2" ×2 and "OIDC · B.2"; the `::1` test is
  skipped here.
- *Criterion:* one home for the origin; the Origin, CSRF, state and nonce checks are not loosened.

**B.3 · Relationships.**
- *Changed:* `data/instruments.json` (8 relationships), `data/sources.json` (8 notes),
  regenerated pages.
- *Verify:* `/instruments/nis2/` (Art. 44, recital 16) and `/instruments/dma/` (Art. 1(6), Art. 5(2))
  show the locators.
- *Automatic:* `tools/selftest.mjs` W12.
- *Criterion:* every migrated edge re-read; the two that no longer hold stay v1, with the reason; the
  flip is not done.

## v2 Session 5 — Part A checkpoint report (item 2.2)

### What the author decided (each in `docs/ROADMAP-v2.md` §8, in the author's words)

- **A.0, before anything was written to `data/`** (measured that day: `eidas2` failed the page gate's
  `explanation` and `context` only):
  - *context*: one edge, `eidas2 → gdpr` `defers-to`, on Art. 1 point (2)(b) of Regulation (EU)
    2024/1183, inserting Art. 2(4) into Regulation (EU) No 910/2014 ("without prejudice to Regulation
    (EU) 2016/679"). Three more edges read the same day were offered and **not** added: `dsa → eidas2`
    `enables` (Art. 5f(3)), `dma → eidas2` `enables` (Art. 12b), `eidas2 → nis2` `defers-to`
    (Art. 16(1)). `brief_part` stays `null`: the brief names eIDAS2 only in Part I's box "Also in the
    rulebook: what the six regimes leave out";
  - *dna.objective*: draft A;
  - *the other fields*: factual ones read now, analytical ones `null`;
  - *two stale texts*: corrections proposed in A.1.
- **A.1, in one block — approved as a whole**, with one addition: `actor:trust-service-provider`.

### What was written — commit `061c226`

| Record | Change |
|---|---|
| `eidas2` | `scope:adjacent` → `scope:core`; `scope_decision` (included; `crit:object-infrastructure`, `crit:horizontal`; three references, two direct structural); `status_basis` (Art. 2 + Publications Office metadata); `status_as_of` and `last_verified` 2026-10-27; the re-reading sentence of `status_note` replaced; `dna` (objective, `implementation_model`, `obligation_anchor`, `regulated_actor`, `sanction_ceiling` note; four fields `null`); milestone added |
| `rel-eidas2-gdpr-defers` | new, v2 shape, direct structural locator |
| `tl-eidas2-2024-05-20-entry-into-force` | new |
| `actor:trust-service-provider` | new taxonomy term; nothing renamed |
| `ap-eidas2-01` | rationale: "This dataset maps the framework as adjacent: the brief does not analyse it, and" removed; `last_verified` 2026-10-27 |
| `clm-also-in-the-rulebook` | `eidas2` removed from `instruments` (the claim is about the cyber package alone) |
| `clm-eidas2-wallets`, `clm-eidas2-private-acceptance`, the two deadline events | re-read; `last_verified` 2026-10-27; notes say what was read |
| `src-eurlex-eidas2`, `src-eurlex-eudi-2024-2981`, `src-eurlex-eudi-2024-2977` | `accessed` 2026-10-27; notes say what was read; 2977's says it was read through Cellar, not at its EUR-Lex URL |
| `tools/register-audit.mjs` | `eidas2` leaves `STATUS_BASIS_BACKLOG` (24 → 23): M-07 holds it in full |
| `tools/selftest.mjs` | W11: removing its status basis, its decision, its edge or its objective each fails (M-07, M-04, M-05 ×2); W1's frozen length 24 → 23 |
| generated | `instruments/eidas2/` (new), `instruments.html`, the `<noscript>` index on every page, `sitemap.xml`, `img/og/eidas2.png`. The tool also re-rendered the other twelve cards; they were restored, because their inputs did not change |

Nothing was added to `tools/seo.mjs` or to `KNOWN_AS`: the title is derived ("eIDAS2 — key provisions and key dates"), and with no `PAGE_PUBLISHED` entry the page states no `datePublished`. **No locale key was touched**: the fields written are data, which the editions do not carry; `i18n-audit` 0/0.

### Facts re-read on 27 Oct 2026, and facts left `null`

- **Read** (Cellar by CELEX, XHTML; Publications Office SPARQL):
  - 32024R1183: Art. 1 points (1) (Art. 1, subject matter), (2)(a)–(b) (Art. 2(1), Art. 2(4)),
    (5) (Arts 5a(1), 5f(1)–(3)), (13) (Art. 12b), (15) (Art. 16(1)–(2)); Art. 2; the OJ header
    (30.4.2024). SPARQL: in force, entry into force 2024-05-20.
  - 32024R2977 and 32024R2981: the citations (Arts 5a(23), 5c(6)) and the final articles; OJ L of
    4.12.2024. SPARQL: both in force, entry into force 2024-12-24.
  - Every fact already in the record, the two claims, the two events and the rule was confirmed;
    none changed.
- **Left `null`, declared on the page as "not established":** `risk_logic`,
  `enforcement_mechanism`, `protected_party`, `territorial_scope`; the sanction amounts (Art. 16(2)
  sets a floor for the national maximum, not a ceiling — said in the note). No competent authority:
  `institutions.json` has none for eIDAS2, and none was researched.
- **Not read:** the definition of "trust service provider" in Art. 3 of Regulation (EU) No 910/2014
  (the new term's note cites Art. 2(1) only); any other implementing act.
- No fact was taken from a search result or from model knowledge.

### Exit criteria of item 2.2

- *Every fact read from a retrieved primary source* — **pass** (above).
- *`sources.json` records only from documents read* — **pass**: no new source; three updated after
  re-reading.
- *Prose and claims to the author* — **pass**: every text written was in the A.1 block, approved;
  no claim was created; one claim's tag was removed on approval.
- *`node tools/_footer.mjs` re-run* — **pass**: committed with the data; `seo-audit` 0/0.
- *Affected locale keys declared* — **n/a**: none touched.
- *M-04, M-05, M-07 at 0 errors, held in full* — **pass**: `eidas2` is in no backlog; W11 shows each
  failing.
- *The page says nothing the records do not carry* — **pass**, opened in Chromium (below).

### Counts against the baseline (v2 Session 4's closing re-run)

| Measure | Before | After | Why |
|---|---|---|---|
| relationships (`validate`) | 26 | 27 | `rel-eidas2-gdpr-defers` |
| timeline events / taxonomy terms | 91 / 306 | 92 / 307 | the entry-into-force event; `actor:trust-service-provider` |
| instruments / sources / claims | 34 / 220 / 181 | unchanged | — |
| coverage covered / mapped | 11 / 12 | 12 / 11 | `eidas2` |
| backlog `status-basis-missing` / `scope-decision-missing` | 24 / 11 | 23 / 11 | `eidas2` has its basis; it was never in the second |
| instrument pages · indexable routes | 12 · 21 | 13 · 22 | `instruments/eidas2/` |
| instruments.html "thinner records" | 8 | 7 | `eidas2` has a page |
| `validate` errors / warnings / unverified | 0 / 0 / 45 | 0 / 0 / 45 | unchanged |
| `evidence-audit --as-of 2026-10-27` errors / warnings | 0 / 11 | 0 / 11 | unchanged |
| `freshness --as-of 2026-10-27` | 0 defects / 2 prompts | 0 / 2 | unchanged |
| `i18n-audit`, `design-qa`, `seo-audit` | 0/0 | 0/0 | unchanged |
| `tools/selftest.mjs` | 100 | 101 | W11 |
| all 25 suites | 1304 | 1305, 0 failures | W11. Without `BROWSER_QA_CHROME`: 1304 pass and 1 skipped; with it, `agent/browser` is 21/21 |
| browser suite | 343 · 0 · 1 undecidable | 343 · 0 · 1 undecidable | unchanged (`a11y:bound`) |
| adversarial gate | 65 · 0 · 3 · 1 | 65 · 0 · 3 · 1 | unchanged |

`agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` and `routes` exit 0;
`tools/commit-evidence.mjs origin/main HEAD`: `061c226` names its evidence.
`BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.

### The page, opened in a browser

`/instruments/eidas2/`, opened in Chromium (Playwright) with no console error, shows:

- Status: in force, as of 27 Oct 2026.
- "In short":
  - the objective;
  - five actors;
  - Arts 5a and 5f;
  - entry into force on 20 May 2024, and the next deadline;
  - "not established" for the protected party and for the sanction ceiling, with the Art. 16(2) note.
- Three dated events, one rule and two provisions.
- No enforcement recorded.
- Two claims, both graded primary law.
- One interaction, "eIDAS2 defers to GDPR", with its locator.
- "No Part of the brief covers this instrument directly".

`/instruments/gdpr/` shows the same edge from the other end.

### Found, for the author — not changed

1. **Internal identifiers shown to a reader.**
   - `eidas2.status_note` names `clm-eidas2-wallets` and `clm-eidas2-private-acceptance`. That text
     is unchanged and predates this session.
   - The interactions box prints the taxonomy note of `rel-kind:defers-to`, which ends "Added 27 Oct
     2026 (docs/V2-DATA-DESIGN.md §1.4)". It has appeared since item 2.1 on every page with a
     `defers-to` or `enables` edge: DSA, DORA, GDPR and now eIDAS2.
2. **`regulated_actor` mixes two populations.** One is the addressees of the wallet duties, taken
   from the provisions; the other is trust service providers, taken from the scope article. Both were
   read in the text, but the list is not exhaustive.
3. **Two grammar slips on every instrument page**, not introduced by this item: "1 rule in the
   dataset turn on this instrument" and "· 1 days ago".

### How to check it by hand

1. `node tools/evidence-audit.mjs --as-of 2026-10-27`: REGISTER reads "covered 12 · mapped 11";
   `status-basis-missing` is 23, without `eidas2`.
2. `python3 -m http.server 8000`, then open `/instruments/eidas2/` and `/instruments/gdpr/` (the edge
   from both ends). `/instruments.html`: eIDAS2 is in the list, with seven thinner records.
3. Fetch `http://publications.europa.eu/resource/celex/32024R1183` with Accept
   `application/xhtml+xml` and read Art. 1 point (2)(b): the sentence the edge rests on.
4. `node --test --test-name-pattern=W11 tools/selftest.mjs`.

## Branch register — 27 October 2026 (v2 Session 4)

- At the start, `docs/ROADMAP-v2.md` §8's row "The scope of v2 Session 4" was **not on `main`**: it
  was `7f82f62`, committed on `claude/eloquent-hamilton-7p6t2u` after #19 was merged. The session
  stopped and said so; the author merged it as #20 (`34a2ee0`), and the session started from there.
- `git branch -r --no-merged origin/main` then listed only
  `origin/scout/digest-digest-2026-10-26T13-10-32Z`, already in the registers below and untouched.
- This session's branch: `claude/new-session-e7w8sp`. Disposition: pull request #21, opened on the
  author's instruction of 27 Oct 2026 ("Sì, apri la PR") and merged as `b304114`. The branch then
  carries one more commit (the scope and prompt of v2 Session 5); no pull request for it unless the
  author asks.

## Next — v2 Session 5 (decided 27 Oct 2026, `docs/ROADMAP-v2.md` §8)

Pull request #21 was merged as `b304114`. The prompt is `docs/prompts/v2-session-5.md`. In order:
1. **Item 2.2, the promotion of `eidas2`**, then a checkpoint. Measured on `main`: the page gate
   would refuse `eidas2` a page today (no `dna.objective`, no `brief_part`, no relationship), so
   M-05 would fail on promotion; the prompt puts that to the author before anything is written.
2. **PP-09's stale text** (`agent/policy/`, never automatic).
3. **The OIDC redirect URI and the unbracketed `::1` origin** in `.control-room/`.
4. **The 10 readable relationships migrated to v2**; the other 7 stay in the backlog and the
   `edge-v1-sources` flip stays deferred.

Still for Phase 3: R-01's P2B gap, the eight findings of `docs/V2-DATA-DESIGN.md` §7, and the
`data-omnibus` correction left in `docs/v2-design/register-watchlist.proposed.json`.

## v2 Session 4 — Part B checkpoint report (B.1–B.3)

The author approved the Part A checkpoint (`docs/ROADMAP-v2.md` §8, commit `76fa900`), and with it:
R-01's P2B gap deferred to Phase 3; the internal references removed from three public texts (done in
`76fa900`); no relationship added for TTPA Art. 2(3)(f) and (h).

### B.1 · The ninth README limitation — commit `c886fdb`

- Inserted as item 9 of "Known limitations", **word for word** from `docs/AUDIT-2026-10-24.md` §5
  (checked by script: identical once the quote marks are removed).
- Every fact it cites was checked first and still holds: HSTS not sent on the custom domain
  (`docs/DEPLOYMENT.md` §1a, §4); the Control Room never deployed, OIDC only against a local stub,
  nothing penetration-tested (`docs/CONTROL-ROOM.md` §11 items 1, 2, 6).
- "Eight limitations" became "nine" where the count is stated: `AGENTS.md` (twice),
  `docs/AI-SAFE-BOUNDARIES.md` §0, a comment in `agent/ux/boundary.mjs`.

### B.2 · The publication model, corrected as a check — commit `1d0d897`

- `tools/pages-artifact.mjs refusal()` is the one home of what the website publishes;
  `agent/implement/boundary.mjs publicSurface()` asks it, and every other check reads
  `publicSurface()`.
- **Two surfaces, measured:** the website (106 tracked files the allowlist admits) and the
  repository (all 506 tracked files — **public on github.com**, read through the GitHub API on
  27 Oct 2026). Refused paths are listed by reason: `agent` 261, `docs` 62, `tools` 24, `.agents` 25,
  `.control-room` 20, and eight more.
- **The secret scan reads the whole repository** (487 text files, was 435): no check was weakened.
- **Verdicts, before → after, approved by the author before the commit:**

  | Verdict | Before | After |
  |---|---|---|
  | health `control_plane.control_room_assets_published` | 1 (`docs/CONTROL-ROOM.md`) | 0 (it is in the repository, not on the site; reported apart) |
  | `agent/implement` boundary errors / warnings | 0 / 13 | 0 / 20 (exposure 2 → 0; fixture credential shapes 11 → 20, `.control-room/selftest.mjs` now read) |
  | health `secrets_in_public_assets` | 0 (11 in fixtures) | 0 (20 in fixtures) |
  | adversarial gate | 65 · 0 · 3 · 1 | 65 · 0 · 3 · 1 — PP-08 still partial/high, its reason rewritten for both surfaces |
  | production readiness | refused | refused — no condition moved because of B.2 |
  | `.control-room` boundary | 0 errors | 0 errors — text only |

- **`agent/policy/` was edited** (a never-automatic path): `agent/policy/verify/attacks.mjs`, PP-08,
  and one phrase of PP-09 ("inferred from Jekyll's documented default" → "from the allowlist").
- **Four tests that asserted the Jekyll model were rewritten**, each now asserting the allowlist
  model and what would make an empty result vacuous: `agent/implement/selftest.mjs` R5 (×2),
  `agent/health/selftest.mjs` "SECURITY · the health RECORD is not published…",
  `.control-room/selftest.mjs` "THE REPOSITORY · …".
- Text with the same stale model corrected beyond the prompt's list: `agent/production/readiness.mjs`
  and `schedule.mjs`, `agent/simulation/threshold.mjs`, `docs/IMPLEMENTATION-QA.md` §6 (marked
  superseded, the SESSION 18 text kept).
- **Left open, by the author's decision:** PP-09 still says the deployed site has never been fetched,
  while `docs/DEPLOYMENT.md` §1 measured it on 27 Sep and 23 Oct 2026. Its outcome is undecidable.

### B.3 · The port-0 Origin defect — commit `dc3a030`

- `.control-room/server.mjs` `selfOrigin()`: the configured public origin, or the loopback host and
  the port **actually listening** (`server.address().port`). The exact-match comparison and the CSRF
  check are unchanged.
- Two paired tests in `.control-room/selftest.mjs` ("ORIGIN · B.3"), both reproduced failing before
  the fix: the server's real Origin now passes; a foreign Origin, the old `:0` origin, `localhost`
  and the next port are refused, and a POST with the right Origin and no CSRF token is still refused.
- **Found, not fixed (outside B.3):** `.control-room/authn.mjs redirectUri()` builds the OIDC
  redirect URI from `cfg.port` the same way, so with port 0 and the OIDC provider it would be wrong;
  and with `CONTROL_ROOM_HOST=::1` neither origin is bracketed (`http://::1:7802`), which no browser
  sends either.

### Re-run on the final tree

- Validators: `validate` 0/0, 45 unverified; `i18n-audit` 0/0; `design-qa` 0/0;
  `evidence-audit --as-of 2026-10-27` 0 errors, 11 warnings; `freshness --as-of 2026-10-27` 0 defects,
  2 prompts; `seo-audit` 0/0 — identical to the start of the session.
- Suites: all 25 pass, **1304 tests**, 0 failures (1292 at the start: `tools/` 90 → 100,
  `.control-room/` 72 → 74). Browser suite 343 pass · 0 fail · 1 undecidable (`a11y:bound`), with
  `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.
- Adversarial gate 65 · 0 · 3 · 1. `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary`
  and `routes` exit 0. `tools/commit-evidence.mjs origin/main HEAD`: every commit that changes a
  published file names its evidence.

## v2 Session 4 — the verification checklist

**A.1 · Entry-by-entry review.**
- *Changed:* `docs/ROADMAP-v2.md` §8, one row per entry and per decision, in the author's words.
- *Verify:* read the §8 rows dated 27 Oct 2026; each record in `data/instruments.json` carries
  `scope_decision.approved_on` 2026-10-27 and no `DRAFT`.
- *Automatic:* `tools/selftest.mjs` W3 (an unapproved or DRAFT decision is an M-04 error).
- *Criterion:* every entry approved, refused or deferred in writing — all ten approved.

**A.2 · Facts re-read before writing.**
- *Changed:* the record notes and source notes say what was read on 27 Oct 2026; one unsupported
  phrase removed (PSR); fields not researched stay `null`.
- *Verify:* open any new source's URL (Cellar, CELEX) and its locator, e.g. `src-eurlex-gpsr`, Art. 52.
- *Automatic:* none reads a source — no check here touches the network (AUDIT F-12). M-04 and M-07
  check that a direct structural reference exists.
- *Criterion:* "a status no source has been read for is null" — every status was read.

**A.3 · Written in one home.**
- *Changed:* `data/instruments.json` (10 records, `dga.scope_decision`, 9 relationships),
  `data/sources.json` (12 + 5 updated), `data/timeline.json` (14), `data/taxonomy.json` (11 terms);
  `docs/v2-design/register-watchlist.proposed.json` keeps only the `data-omnibus` block;
  `tools/register-audit.mjs` (new), `tools/evidence-audit.mjs`, `tools/validate.mjs`,
  `agent/detector/fields.mjs`; `js/routes.js coverage()`, `js/search.js`, `js/calendar.js`,
  `js/instrument-page.js`, `js/interactions.js`, `tools/seo.mjs`; regenerated pages.
- *Verify:* §"How to check it by hand" in the Part A report above.
- *Automatic:* `tools/selftest.mjs` W1–W10; `agent/browser` `not-covered:excluded`, `:watched`,
  `:calendar`, `:search`; `agent/detector` "the field register classifies every field".
- *Criterion:* item 2.1's exit criteria — all met except the `edge-v1-sources` flip, deferred by the
  author.

**A.4 · Part A checkpoint.** Report in this file; approved by the author (§8, `76fa900`).

**B.1 · Ninth limitation.** *Changed:* `README.md`. *Verify:* compare item 9 with
`docs/AUDIT-2026-10-24.md` §5. *Automatic:* none (a reading). *Criterion:* inserted verbatim, every
cited fact still true.

**B.2 · Publication model.** *Changed:* listed above. *Verify:* `node agent/implement/cli.mjs boundary`
prints the two surfaces; `node agent/policy/verify/cli.mjs` shows PP-08's new reason. *Automatic:*
`agent/implement/selftest.mjs` R5, `agent/health/selftest.mjs` SECURITY, `.control-room/selftest.mjs`
THE REPOSITORY. *Criterion:* one home, every moved verdict reported and approved, no check weakened.

**B.3 · Port 0.** *Changed:* `.control-room/server.mjs`. *Verify:* `CONTROL_ROOM_PORT=0 node
.control-room/cli.mjs serve`, log in from a browser and press Approve: no "cross-origin request".
*Automatic:* `.control-room/selftest.mjs` "ORIGIN · B.3" ×2. *Criterion:* fixed without loosening the
Origin or CSRF check.

## v2 Session 4 — Part A checkpoint report (item 2.1)

### What the author decided (each in `docs/ROADMAP-v2.md` §8, in the author's words)

- **A.0, before anything was written to `data/`:**
  - the 17 existing relationships are **not** migrated, and the flip of `edge-v1-sources` and
    `edge-analytical-no-claim` to ERROR is **deferred** with them. Measured that day: 10 of the 17
    cite only tier-1/2 sources and need a locator; 4 rest only on `src-brief-original`; 3 analytical
    edges have no claim;
  - the public views read **one derived filter**, `coverage()` in `js/routes.js`.
- **A.1, entry by entry — all ten approved, none refused, none deferred:**

  | Record | List | Approved | Corrections from the re-reading, approved with it |
  |---|---|---|---|
  | `vida` | register | yes | `status_note` states Art. 6(4)–(5); Art. 3 point (1) (new Art. 28a) cited for "deemed suppliers" |
  | `avmsd` | register | yes, **A-4 decided** (2010/13/EU as amended) | Directive 2018/1808 Art. 1(23) read and cited for "video-sharing platforms" |
  | `copyright-dsm` | register | yes, **A-2 decided** (Directive 2019/790) | reason gains "(Art. 17)"; Art. 17 cited |
  | `gpsr` | register | yes | source note lists every DSA article GPSR Art. 22 refers to |
  | `eaa` | register | yes | `full_name` is the exact title, without "(European Accessibility Act)" |
  | `ttpa` | register | yes | none |
  | `p2b` | watchlist | yes | none (procedure 2025/0360(COD): "Awaiting committee decision") |
  | `mica` | watchlist | yes | none |
  | `psd3` | watchlist | yes | Art. 1(1) of COM(2023) 366 added, so M-04 holds |
  | `psr` | watchlist | yes | reason without "including fraud prevention" (no source read establishes it); Art. 1(1) of COM(2023) 367 added |

  - `dga` (instrument update): approved, with DGA Art. 1(1) added to its decision's sources.
  - `data-omnibus` (instrument update, `proposes_to_amend` −dga +cer): **not applied**. It is
    findings F-2 and F-3 of `docs/V2-DATA-DESIGN.md` §7, which are Phase 3's (Q-5). It is the one block
    left in `docs/v2-design/register-watchlist.proposed.json`.
  - The four source updates: approved.
- **During implementation:** the "not covered" notice's wording (draft A); M-04's date test as a
  WARNING (`VERIFIED_AFTER_AS_OF`), because an ERROR in `evidence-audit.mjs` is a defect on every date.

### Facts re-read on 27 Oct 2026, and facts left `null`

- **Re-read, every one confirmed** (Cellar by CELEX for the texts, the Publications Office's SPARQL
  endpoint for in-force flags and dates, the Legislative Observatory for the three procedures): the
  title, entry into force, application and transposition articles of the eight acts; DSA Art. 2(4);
  DORA Art. 2(1)(f); COM(2025) 837 Arts 1, 9, 10 and 11; the stage and key events of 2023/0209(COD),
  2023/0210(COD) and 2025/0360(COD); the Commission's political-advertising page.
- **Read for the first time that day:** ViDA Art. 6(4)–(5) and Art. 3(1); Directive 2018/1808 Arts 1(23),
  2(1) and 3; Copyright DSM Art. 17; GPSR Art. 22 in full; DGA Art. 1(1); Art. 1(1) of both payment
  proposals.
- **One fact in a draft was not established by any source and was removed:** "including fraud
  prevention" (PSR).
- **Left `null`, with the reason in the record:** `transposition`, `dna` and `legal_basis` on all ten
  (not researched); other amendments to the AVMSD; Regulation (EU) 2025/517 (identified, not read);
  MiCA Art. 149(4) derogations (not itemised); the Council documents for PSD3 and PSR.
- No fact was taken from a search result or from model knowledge.

### Exit criteria of item 2.1 (`docs/ROADMAP-v2.md` §4)

- *The seven regimes are records with their reason, measured against the criterion* — **pass**: six
  in the register, P2B on the watchlist, each with `scope_decision.criterion` and an approved reason.
  The four conditional inclusions (MiCA, PSD3, PSR, DGA) are on the watchlist with the finance-chapter
  condition; the finance chapter was not opened.
- *None becomes a page* — **pass**: 12 instrument pages before and after; M-05 is 0 and fails on a
  planted record (W5).
- *A status no source has been read for is null* — **pass**: every status written was read that day;
  none is a guess.
- *The checks of §6.3 arrive with the records, each with a planted failure* — **pass**: M-03, M-04,
  M-05, M-06, M-07, R-01 in `tools/register-audit.mjs`; `tools/selftest.mjs` W1–W10.
- *Design §4.3: `edge-v1-sources` flips to ERROR at the end of 2.1* — **not met, deferred by the
  author** (A.0). The map view stays unpublished.

### Counts against the baseline (`docs/CURRENT-ARCHITECTURE.md` §12 and v2 Session 3's re-run)

| Measure | Before | After | Why |
|---|---|---|---|
| instruments / relationships | 24 / 17 | 34 / 26 | the ten records; nine v2 relationships |
| sources / timeline events | 208 / 77 | 220 / 91 | twelve sources, fourteen events |
| taxonomy terms | 295 | 306 | `rel-kind:enables`, `rel-kind:defers-to`, nine `crit:*` |
| `validate` errors / warnings / unverified | 0 / 0 / 45 | 0 / 0 / 45 | unchanged |
| `evidence-audit` errors / warnings | 0 / 11 | 0 / 11 | unchanged; new REGISTER section: backlog `scope-decision-missing` 11, `status-basis-missing` 24 |
| `freshness` defects / prompts | 0 / 2 | 0 / 2 | unchanged |
| `i18n-audit`, `design-qa`, `seo-audit` | 0/0 | 0/0 | unchanged; no locale key was touched |
| `tools/selftest.mjs` | 90 | 100 | W1–W10 |
| all 25 suites | 1292 | 1302 | the ten above; `agent/detector` 67 unchanged (the field register now classifies `scope_decision.*`, `status_basis.locator`, `relationships[].sources.locator`) |
| browser suite | 339 pass · 1 undecidable | 343 pass · 1 undecidable | `not-covered:excluded`, `:watched`, `:calendar`, `:search` |
| adversarial gate | 65 · 0 · 3 · 1 | 65 · 0 · 3 · 1 | unchanged |
| instruments.html "thinner records" | 9 | 8 | the DGA is watched, so it left that list |

`BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` for the browser suite.
`agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` and `routes` exit 0.

### What changes on screen

- `instrument.html?id=<excluded or watched>` shows the approved notice (name, register or watchlist,
  the reopening event, "Why.", "Read it at the source:", the two dates), noindex, not the full view.
- The static list on `instruments.html`, search and the calendar leave those records out.
- The interaction views gain the nine relationships, and every v2 reference shows its locator
  (`js/interactions.js` used to drop an object reference silently).
- Bibliography and Datasets count the new records; they are views of the data as such.

### Found, for the author — not changed

1. **R-01 cannot fire for P2B as designed.** It looks for the trigger among the watched record's own
   milestones; P2B's trigger, adoption of COM(2025) 837, would be a milestone of `data-omnibus`.
2. **Two notices show internal references** to a reader: MiCA's `watch_for.description` cites
   "docs/ROADMAP-v2.md §4", and the P2B and DGA reasons cite "(Q-1)" and "(Q-6)". All are approved text,
   shown verbatim.
3. **Political Advertising Regulation Art. 2(3)(f) and (h)** also name the AVMSD and P2B: two
   `defers-to` edges nobody proposed, not added.

### How to check it by hand

1. `node tools/evidence-audit.mjs --as-of 2026-10-27`: the REGISTER section lists 6 and 5 records and
   the two backlogs.
2. `python3 -m http.server 8000`, then open `/instrument.html?id=vida` and `/instrument.html?id=mica`:
   the notice. `/instruments.html`: the thinner-records list names eight instruments and none of the
   eleven. Search "ViDA" or "MiCA": no instrument result. Annex A's Instrument filter: none of them.
3. `/instruments/dsa/`: "DSA defers to AVMSD", with "Art. 2(4)(a)" beside the source.

## Branch register — 27 October 2026 (v2 Session 3)

- `git branch -r --no-merged origin/main` lists two branches:
  - this session's `claude/eloquent-hamilton-7p6t2u`. Disposition: pull request to `main`, opened
    on the author's instruction of 27 Oct 2026 ("approvo e apri pull request"); not merged.
  - `origin/scout/digest-digest-2026-10-26T13-10-32Z`, already in the 27 Oct register entry below
    and untouched.
- **The author approved the Phase 1 checkpoint** on 27 Oct 2026 (`docs/ROADMAP-v2.md` §8). Items
  2–4 of "Still open" below remain open, except the pull request.
- **Rewritten once, before review.** The pull request's QA run failed `tools/commit-evidence.mjs`.
  The F1.5 commit `2967f06` changed two published files (`applies.html`, `i18n/locales.json`)
  without the `Evidence:` trailer the rule requires. It was re-made as `d12b6ce` with the trailer,
  and the two commits after it were replayed: `6919acf` became `e6eb186`, and `7d6ca3b` became
  `2650cf4`. The tree is unchanged except for the hashes cited in `docs/`. This is a branch this
  session created; `main` was not touched.
- **Phase 2 has not started.**

## Next — v2 Session 4 (decided 27 Oct 2026, `docs/ROADMAP-v2.md` §8)

Pull request #19 was merged as `0456808`, and Phases 0 and 1 are on `main`. The author has set
Session 4 to do the following, in this order:
1. **The entry-by-entry review, then item 2.1.**
   - The author reviews the 10 records of `docs/v2-design/register-watchlist.proposed.json`.
   - `data/` receives only what the author approves, each fact re-read from a retrieved primary
     source.
   - Then a checkpoint. Item 2.2 is not in Session 4.
2. **The ninth README limitation**, verbatim from `docs/AUDIT-2026-10-24.md` §5 (accepted as
   written).
3. **The publication model, corrected as a check** against `tools/pages-artifact.mjs`.
   - It covers `publicSurface()`, PP-08, `agent/health/security.mjs` and the hazards in `AGENTS.md`.
   - Every verdict that moves is reported before and after.
   - The session stops and asks before a verdict changes.
4. **The port-0 Origin defect**, fixed without loosening the Origin or CSRF check.

## v2 Session 3 — Phase 1 checkpoint report, and the verification checklist

**The author approved:**
- the Phase 0 checkpoint (`docs/ROADMAP-v2.md` §8, `9d51dc8`);
- the wording of the `applies.html` notice: Draft A (§8, item 1.5).

**The Phase 1 checkpoint itself** is recorded in `docs/AUDIT-2026-10-24.md` §1.5, one row per
P0/P1 item with its commit. Its row in roadmap §8 waits for the author's words, because §8 is
"filled in only with the author's words".

**Phase 2 does not start.** Item 2.1 waits for the author's approval of the Phase 1 checkpoint and
of the reasons in `docs/v2-design/register-watchlist.proposed.json`.

### Re-run on the final tree

**Validators — identical to the session's baseline:**
- `validate` 0/0, 45 unverified;
- `i18n-audit` 0/0;
- `design-qa` 0/0;
- `freshness --as-of 2026-10-27`: 0 defects, 2 prompts;
- `evidence-audit --as-of 2026-10-27`: 0 errors, 11 warnings;
- `seo-audit` 0/0.

**Suites:**
- All 25 suites pass: 1292 tests, 0 failures, 0 skipped, with
  `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`. The baseline had 82 in
  `tools/` and 57 in `.control-room/`; they are now 90 and 72.
- Browser suite: 339 pass · 0 fail · 1 undecidable (`a11y:bound`, deliberate).
- Adversarial gate: 65 failed safely · 0 succeeded · 3 partial · 1 undecidable, unchanged.
- `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` and `routes` all exit 0.

### How to start a Control Room for the manual checks below

```
export CONTROL_ROOM_STATE_DIR=$(mktemp -d)        # keep the trial out of .control-room/state/
node .control-room/cli.mjs provision --subject you@example.org --role administrator --by "you"   # asks a password on stdin
node .control-room/cli.mjs serve                   # http://127.0.0.1:7802
```

Use a fixed port, not `CONTROL_ROOM_PORT=0`. *(Fixed in v2 Session 4, B.3: the Origin check now reads the listening port.)* That was a pre-existing defect: with port 0
the server expects the Origin `http://127.0.0.1:0` and refuses a real browser's POSTs.

The review queue is empty on a fresh clone. To see one proposal, the suite's fixture can be written
to a temporary `CONTROL_ROOM_RECORDS_DIR`, as `.control-room/selftest.mjs` `world()` does.

### The checklist — one entry per item

**F0.1 · Snapshot time and state** — commit `7a2346e`, `docs/` in `31db1a4`.
- *Changed:*
  - `.control-room/server.mjs`: `assembled_at` on every view payload and on `/api/proposal`;
  - `.control-room/views.mjs`: `HEALTH_RUN_FIELDS`, and `websiteHealth()` takes `historyDir`;
  - `ui/app.html`: the tab "Live system" became "Agent activity";
  - `ui/app.js`: `snapshotBar()`, `show()`, `load(view, {refresh})` and the health run fields;
  - `ui/app.css`.
- *Verify by hand:*
  1. Open any tab: it shows "Snapshot taken at … (server time, UTC)" and "Refresh this view".
  2. Leave the tab and come back: the time does not change. Press Refresh: it does.
  3. Stop the server and press Refresh: the old snapshot stays, with "The last refresh failed: …".
     Checked so in Chromium during this session.
  4. On Website health with a recorded run (`node agent/health/cli.mjs --as-of D`): Reference date,
     Run recorded at and Commit analysed are three separate rows.
- *Automatic:* `.control-room/selftest.mjs`:
  - "SNAPSHOT · 0.1 · every view payload carries the ISO time the server assembled it";
  - "… Website health shows reference date, run recorded at and commit analysed as three fields";
  - "… "Live system" is no label, and the one refresh is manual — no timer anywhere in ui/".
  - The failed-refresh behaviour is asserted in the source, not in a browser.
- *Satisfies:* roadmap 0.1, all three exit criteria.

**F0.2 · Attestation** — commit `cd3cd22`.
- *Changed:*
  - `.control-room/decide.mjs`: `ATTESTATION_SECTIONS`, `ATTESTATION_STATEMENT`,
    `attestationProblem()`, gate 7 in `decide()`, and the Sources panel data in `reviewQueue()`;
  - `.control-room/audit.mjs`: the `attestation` field, `REQUIRED_FIELDS`, and the write-time
    refusal;
  - `.control-room/server.mjs`: the accepted fields of the review body;
  - `.control-room/views.mjs`: `reviewQueueView()`;
  - `ui/app.js`: the fieldset and the Sources panel;
  - `agent/policy/verify/attacks.mjs` (AZ-01, AZ-03, AZ-07) and `agent/simulation/run.mjs`.
- *Verify by hand:*
  1. In the Review queue, press Approve with no box ticked: refused, and the refusal names
     `attestation`.
  2. Tick two boxes and approve: granted.
  3. In the Audit trail tab (or `node .control-room/cli.mjs audit --verify`) the
     `proposal.approved` entry carries `attestation.examined`, and the chain verifies.
- *Automatic:* `.control-room/selftest.mjs`, the four "ATTEST · 0.2" tests and test 10 (the
  byte-identical tree).
- *Satisfies:* roadmap 0.2, all four exit criteria.

**F0.3 · Dates the tools cannot read** — commit `2606f3e`.
- *Changed:* `tools/as-of.mjs` (new: `readArgs`, `dateProblem`, `refusalText`), and the argument
  parsing in `tools/freshness.mjs` and `tools/evidence-audit.mjs`.
- *Verify by hand:*
  - `node tools/freshness.mjs --as-of 2026-10-24` and `node tools/freshness.mjs 2026-10-24` print
    the same report;
  - `node tools/freshness.mjs --as-of banana; echo $?` gives 2;
  - so do `node tools/evidence-audit.mjs --as-of banana` and
    `node tools/evidence-audit.mjs 2026-10-24`.
- *Automatic:* `tools/selftest.mjs` D1–D4; F1–F9 unchanged.
- *Satisfies:* roadmap 0.3.

**F0.4 · `docs/CONTROL-ROOM.md` §5–§6** — commit `31db1a4`.
- *Verify by hand:* read §5 and §6 against the interface.
- *Automatic:* none for the text of §6. Item 1.3's inventory assertion now covers §5's views and
  routes.
- *Satisfies:* roadmap 0.4.

**F1.1 · Editorial-audit path** — commit `76e24f8`.
- *Changed:*
  - `tools/evidence-audit-record.mjs` (new; reads only);
  - `tools/evidence-audit.mjs`: `--record`, `recordEntry()`, `commitOf()`;
  - `tools/evidence-audit-runs/README.md` and `.gitignore`;
  - `.control-room/config.mjs`: `editorial_audit_dir`;
  - `.control-room/authz.mjs`: `editorial:read`;
  - `.control-room/views.mjs`: `editorialAuditView()`;
  - `.control-room/server.mjs`: `GET /api/editorial-audit`;
  - `ui/`: the "Editorial audit" tab and `renderEditorial()`;
  - `docs/EDITORIAL-AUDIT-PATH.md` (new), and a row in `AGENTS.md`.
- *Verify by hand:*
  1. On a fresh clone the Editorial audit tab says "no editorial audit has been recorded" and gives
     the command.
  2. Run `node tools/evidence-audit.mjs --as-of 2026-10-27 --record`, then Refresh: the latest run
     answers the five questions in order. With uncommitted changes, the commit row lists them.
  3. `git status` does not show the store.
- *Automatic:*
  - `tools/selftest.mjs` R1–R3;
  - `.control-room/selftest.mjs`, the three "EDITORIAL · 1.1" tests (no recorded run; a recorded
    run with every answer; no route that runs anything).
- *Satisfies:* roadmap 1.1, all three exit criteria.

**F1.2 · Readable metrics** — commit `8962210`.
- *Changed:*
  - `.control-room/views.mjs`: `VISIBILITY_LABEL`, `METRIC_DETAIL_FIELDS`, and the enriched
    readings;
  - `ui/app.js`: `metricCell()` and `visibilityPill()`, plus the register shown when no run is
    recorded.
- *Verify by hand:*
  - on Website health each metric shows its name, ID and definition, and "Source, calculation,
    frequency, interpretation, limitations" opens;
  - the visibility pill reads "public-safe" or "private", never "public".
- *Automatic:* `.control-room/selftest.mjs`, the two "METRICS · 1.2" tests.
- *Satisfies:* roadmap 1.2.

**F1.3 · Document matches interface** — commit `f9d9f26`.
- *Changed:*
  - `docs/CONTROL-ROOM.md`: the status line, the roles table in §4, the §5 inventory, §7, §10, and
    two named additions to §12;
  - `.control-room/README.md`, `AGENTS.md`:34, the `authz.mjs` comment, and
    `config.example.env`.
- *Verify by hand:* add `<button data-view="x" class="tab">X</button>` to `ui/app.html` and run the
  suite. "INVENTORY · 1.3 · docs/CONTROL-ROOM.md names every view…" fails, naming the tab.
- *Automatic:* `.control-room/selftest.mjs`, the three "INVENTORY · 1.3" tests: alignment; failure
  on a planted tab, a renamed tab, a dropped row and a wrong permission; §4 against
  `ROLE_PERMISSIONS`.
- *Satisfies:* roadmap 1.3.

**F1.4 · Security wording** — commit `721a26b`.
- *Changed:* `README.md` (outside the limitations), `docs/CONTROL-ROOM.md` §0, §1, §3, §10, §11.3
  and §12, `docs/DEPLOYMENT.md` §5, `AGENTS.md`, and `.control-room/README.md`.
- *Verify by hand:* read `docs/AUDIT-2026-10-24.md` §5, which lists all 26 occurrences examined
  and what was done with each.
- *Automatic:* none. The sweep is a reading; no check holds wording.
- **Not complete, by design:**
  - the proposed ninth README limitation is the author's to accept;
  - two findings were left for the author: the stale "whole tree is published" model in
    `AGENTS.md`, and the same model in the checks — `publicSurface()`, PP-08,
    `agent/health/security.mjs`.
- *Satisfies:* roadmap 1.4.

**F1.5 · `applies.html` notice** — commit `d12b6ce`; its test is in the checkpoint commit.
- *Changed:* `applies.html`, the first paragraph of the caveat box, `data-i18n="applies.notice"`;
  `i18n/locales.json`, where the key is `pending_translation` in it, fr and es, `it` is no longer
  complete, and the notes say why.
- *Verify by hand:* open `/applies.html`: the notice is the first thing under "Read this before you
  read a result".
- *Automatic:* `tools/selftest.mjs` N1 pins the approved text and its declarations; `i18n-audit`
  fails if the key is undeclared.
- *Satisfies:* roadmap 1.5 and D-2.

### Still open, for the author

1. ~~Approve the Phase 1 checkpoint.~~ Approved 27 Oct 2026 (roadmap §8).
2. The proposed ninth README limitation (`docs/AUDIT-2026-10-24.md` §5).
3. The two §5 findings: the stale publication model in `AGENTS.md` and in the checks.
4. ~~Whether to open a pull request for this branch.~~ Opened on the author's instruction.

## (previous header) v2 Session 3 — Phase 0, stopped at its checkpoint

**Branch:** `claude/eloquent-hamilton-7p6t2u`. **Stopped at the Phase 0 checkpoint**, which the
author approved on 27 Oct 2026 (above).

## v2 Session 3 — Phase 0 checkpoint report

**Asked** (in Italian): implement Phase 0 (audit P0: 0.1–0.4), stop at the checkpoint with a report
of every exit criterion, wait for the author's explicit approval, then Phase 1 (1.1–1.5).
Pre-condition checked: #18 is on `main` and `docs/BRIEF-v2.md` exists.

**Commits** (on `claude/eloquent-hamilton-7p6t2u`):
- `2606f3e` — 0.3, the date argument;
- `7a2346e` — 0.1, snapshot time and the three health dates;
- `cd3cd22` — 0.2, the attestation;
- the commit carrying this entry — 0.4, `docs/CONTROL-ROOM.md` §5 and §6.

### Exit criteria, one by one (`docs/ROADMAP-v2.md` §4)

**0.1 · Snapshot time and state — all three pass.**
- *Every view payload carries an ISO assembly time* — **pass**. `server.mjs` stamps `assembled_at`
  on all seven views and on `/api/proposal`. `.control-room/selftest.mjs` "SNAPSHOT · 0.1 · every
  view payload…" walks every `GET /api/*` route except `/api/session`, so a route added later is
  covered by default.
- *The health payload's three fields are distinct, and no label in `ui/` presents `as_of` as a run
  date* — **pass**. Labels come from `views.mjs HEALTH_RUN_FIELDS`: Reference date, Run recorded at,
  Commit analysed. The client never names `as_of`. Test "SNAPSHOT · 0.1 · Website health shows…".
- *"Live system" no longer appears as a label* — **pass**. The tab is now **Agent activity**; the
  route `/api/live`, the permission `live:read` and the view id are unchanged. Test "SNAPSHOT · 0.1 ·
  "Live system" is no label…" also asserts no timer anywhere in `ui/`.
- **Also delivered:**
  - "Snapshot taken at …" above every view;
  - one manual refresh per view, a `GET` of the same route; a visited tab keeps its snapshot;
  - a failed refresh keeps the earlier snapshot, with its own time and the error.
- **How the last point was checked:** the suite checks it in the source only. It was also checked
  in a real browser (Chromium, Playwright, scratch script, not committed): the server was stopped
  and Refresh pressed, and the queue stayed on screen with its time and "The last refresh failed:
  Failed to fetch".

**0.2 · Attestation of evidence review — all four pass.**
- *A decision without an attestation is refused, naming the field* — **pass**. 400 `no_attestation`
  / `bad_attestation`, `detail.field: "attestation"`, nothing written to the ledger, every refusal
  audited. Test "ATTEST · 0.2 · approving or rejecting without an attestation…".
- *An unknown field is still refused* — **pass**. `parseStrictJson` is unchanged; `attestation` was
  added to the accepted list (`server.mjs`). Test "ATTEST · 0.2 · an unknown field is still refused…".
- *The attestation appears in the trail entry and the chain verifies* — **pass**. It sits in the
  decision's own entry (D-9), under the same hash as `actor_id`, `ts` and `proposal_sha256`, and it is
  not in the ledger. Editing it on disk breaks `verifyChain()`, and the trail refuses an
  approved/rejected entry without one. Test "ATTEST · 0.2 · the attestation is in the decision's own
  trail entry…".
- *After a decision, the tree is byte-identical except the ledger* — **pass**. Existing test 10,
  unchanged except that its approval now carries an attestation.
- **The wording:** "a declaration, not proof of reading", on screen and in the recorded statement.
  Nothing records which panels were opened (asserted).

**0.3 · A date the tools cannot read — both pass.**
- *New self-tests plant an invalid date in each tool and assert exit 2* — **pass**:
  - `tools/selftest.mjs` D3 (freshness: `--as-of banana`, `banana`, `2026-02-30`, a bare `--as-of`,
    two dates, an unknown flag);
  - D4 (evidence-audit: `--as-of banana`, `2026-02-30`, a bare `--as-of`, `--as-of --json`, a
    positional date);
  - D1 (the parser itself).
- *The audit's own command produces the same report as the positional form* — **pass**. D2:
  `freshness.mjs --as-of 2026-10-24` is byte-identical to `freshness.mjs 2026-10-24`, with 2 prompts.
  Before this session it reported 0 prompts.
- *F1–F6 not broken* — **pass**. F1–F9 unchanged and passing.

**0.4 · `docs/CONTROL-ROOM.md` true about 0.1–0.2 — done; no automatic check (by design: that check
is item 1.3).**
- §5: snapshot, Agent activity, the three health dates, the Sources panel.
- §6: eight gates, gate 7 the attestation.
- **Deliberately not touched, for 1.3:**
  - the "SESSION 21" status line;
  - §7's list of entry fields, which does not yet name `attestation`;
  - §10's "55 tests" (it is 64);
  - `AGENTS.md:34`, which still says "the seven approval gates".

### Validators and suites, re-run on the final Phase 0 tree

**Validators — identical to this session's baseline:**
- `validate` 0 errors · 0 warnings · 45 unverified;
- `i18n-audit` 0/0;
- `design-qa` 0/0;
- `freshness --as-of 2026-10-27`: 0 defects, 2 staleness prompts, exit 0;
- `evidence-audit --as-of 2026-10-27`: 0 errors, 11 warnings;
- `seo-audit` 0/0.

**Suites:**
- All 25 suites: 1280 tests, 0 failures. The baseline had 82 in `tools/` and 57 in `.control-room/`;
  they are now 86 and 64.
- One test was skipped in the default run: `agent/browser` "the deployed-path check…", because no
  Chromium was on `PATH`. With `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`
  that suite is 21/21. `node agent/browser/cli.mjs` is 339 pass · 0 fail · 1 undecidable (the
  deliberate `a11y:bound`).
- `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` and `routes` all exit 0.

**The adversarial gate** (`node agent/policy/verify/cli.mjs`): 65 failed safely · 0 succeeded ·
3 partial · 1 undecidable. Its report is identical to the one on the tree before 0.2.

### What the author should know first

1. **A finding about the adversarial gate. Without a fix, three attacks would have passed for the
   wrong reason, and its summary would not have shown it.**
   - Once 0.2 landed, AZ-01's paired positive, AZ-03 (approve over a denial) and AZ-07 (replay) were
     refused for *lacking an attestation*, not by the defence each names.
   - The summary line was unchanged even so. I compared it against the pre-change tree with
     `git stash`.
   - **Fixed:** the setup decisions that must succeed now carry an attestation, in
     `agent/policy/verify/attacks.mjs` and in `agent/simulation/run.mjs`. Each attack again reaches
     its defence: 200; then `state_denied`; then a 409 replay with 1 grant.
   - `agent/policy/` is on the never-automatic path list, so this edit is named here for your review.
2. **My interpretations, each yours to overrule:**
   - (a) an attestation must name **at least one** section, not all five;
   - (b) an attestation sent with *request changes* is refused (400 `attestation_not_applicable`),
     not ignored;
   - (c) a visited tab shows its held snapshot, and only Refresh fetches again;
   - (d) `evidence-audit.mjs` now refuses **every** unrecognised argument with exit 2, not only a bad
     date. A positional date used to be silently ignored, the mirror of the freshness bug;
   - (e) the tab label **"Agent activity"** is my wording.
3. **Not fixed, pre-existing:** a Control Room configured with `port: 0` expects the Origin
   `http://127.0.0.1:0`, so a real browser's POSTs are refused as cross-origin.
   - The suite never sees it, because Node's `fetch` sends no Origin header.
   - Found while checking the UI in a browser. Not in Phase 0's scope.
4. **Branch register:**
   - `git branch -r --no-merged origin/main` lists only `origin/scout/digest-digest-2026-10-26T13-10-32Z`,
     already reported in the 27 Oct register entry and untouched;
   - this branch is pushed, with no pull request (none was asked for).

**Next:** the author approves (or corrects) this checkpoint. The approval is recorded in
`docs/ROADMAP-v2.md` §8, and only then does Phase 1 (1.1–1.5) start in this session.

## (previous header) v2 Session 2 — 25–27 October 2026

**Branch:** `claude/v2-session-2-schemas`, cut from `main` at `933515a` (the merge of #17),
documentation only. Merged as #18 (`51efe8e`).

## v2 Session 2 — the data design for v2.0 (item 2.0, brought forward)

**Asked** (in Italian): produce D1–D6 — the dependency-map schema, the applicability-trigger schema,
the status labels, the `evidence-audit.mjs` extension plan, the methodological note, the exclusion
register and watchlist — and a coherence matrix. No production code, no UI, no
`docs/CONTROL-ROOM.md`.

**What the author decided first** (four questions at the start, recorded in `docs/ROADMAP-v2.md` §8):
- The roadmap is approved. Item 2.0 is brought forward to this session; Phase 0 moves to Session 3 and
  Phase 1 to Session 4. Items 2.1–2.6, which write data, still wait for the Phase 1 checkpoint (read
  conservatively).
- D-3, D-6, and the trigger as the existing applicability rule: all as recommended.
- `stratum`: dropped, derived instead (option (c)).
- The brief: not available when the design was drafted, so every brief-dependent point was an
  assumption. **The author pasted it on 27 Oct 2026**, and the design was then checked against it
  (`docs/V2-DATA-DESIGN.md` §0.1):
  - A-1, A-3 and A-5 confirmed, with two corrections the brief required: the seven regimes go in the
    register *or* the watchlist; and PSD3/PSR reopen only if the finance chapter is opened, not on
    adoption;
  - node verification added: the brief says an unverifiable node is removed or downgraded;
  - the map is not published while any edge lacks locators ("an unverified map is worse than no map").
  The audit PDF attached with it is word for word `docs/AUDIT-2026-10-24.md` §1.

**What exists now** — design only; `data/`, `js/`, `tools/`, pages and locales are untouched:
- `docs/V2-DATA-DESIGN.md`: the reasons, every validation rule (M-, T-, S-, R-), the D4 plan, the
  proposed inclusion criterion (D-7), the coherence matrix and eight findings.
- `docs/v2-design/`: three schemas (map, applicability rule, status labels) and three record files
  (map examples; applicability examples; the register and watchlist as proposed records).
- `docs/METHODOLOGY-NOTE-v2.md`: D5, final text, to ship in the same commit as the map.
- `docs/ROADMAP-v2.md`: §8 approval row, the decided rows of §3, the session numbering of §4 and §6.

**What the author should know first:**
- **Every legal fact in the new files was read on 25 Oct 2026**, from Cellar (Official Journal texts and
  proposals, by CELEX), the Publications Office's SPARQL metadata and the Legislative Observatory.
  EUR-Lex returns empty pages to this environment; Cellar and OEIL do not. That is worth knowing for
  every later evidence session.
- **All 17 existing relationships derive as `unverified`** under the v2 rule (bare source IDs, no
  locator). That is the data's state made visible, not a regression.
- **None of the 33 applicability rules is publishable at the v2 standard** (v1 sources). What
  applies.html does about it: D-2, decided 27 Oct 2026 — kept, with a notice in Phase 1.
- **Eight findings in existing data, none fixed** (`docs/V2-DATA-DESIGN.md` §7). Most consequential:
  - F-2: `data-omnibus.proposes_to_amend` lists the DGA, which COM(2025) 837 Art. 10(3)(a) would
    *repeal*;
  - F-3: it omits the CER Directive, which Art. 9 amends;
  - F-4: `ap-ai-act-03`'s `_gte` key against AI Act Art. 51(2)'s "greater than";
  - F-8: 11 rules' dates omit application events of their own obligations.
- **Decided by the author on 27 Oct 2026** (ROADMAP-v2 §8):
  - D-1: the brief is committed as `docs/BRIEF-v2.md`, pointed to from `AGENTS.md`;
  - D-7: the inclusion criterion is approved;
  - D-2: `applies.html` stays, with a notice added in Phase 1 (item 1.5);
  - P2B: watchlist, watching COM(2025) 837;
  - the six states outside the brief's labels: no label;
  - the DGA: the finance-chapter condition applies to it too;
  - the eight findings: corrected in Phase 3;
  - the D6 reasons: drafts, which the author reviews entry by entry before item 2.1.
- **Still open:** D-4 (the tier names) and D-5 (the CMS login); A-2 and A-4 (which acts "copyright" and
  "AVMSD" mean), which the brief does not settle.

**Validators** before and after: unchanged — `validate` 0/0, `i18n-audit` 0/0, `design-qa` 0/0,
`evidence-audit` 0 errors / 11 warnings, `freshness` (positional date) 0 defects, `seo-audit` 0/0.
None of them reads `docs/`.

**Next:** v2 Session 3 = Phase 0 (0.1–0.4), then a checkpoint **inside** the session (report,
validators and suites re-run, the author's explicit approval), then Phase 1 (1.1–1.5) — decided on
27 Oct 2026 (ROADMAP-v2 §8). Before it starts, pull request #18 must be merged, or the brief and the
Session 2 schemas are not on `main`. What the author settled for it:
- 0.1: `as_of`, `recorded_at` and the commit analysed, shown apart; no `auto_checked_at`; no
  `verified_at` beside `last_verified`.
- 0.2: the attestation is required to approve **and** to deny; it uses a fixed list of sections and
  goes in the decision's trail entry (D-9).
- 0.3 (D-10): `--as-of YYYY-MM-DD` in both tools, exit 2 on a date that does not parse. It is also the
  prerequisite of every date check in `docs/V2-DATA-DESIGN.md` §4.
- 1.1: as planned — `--record` and a read-only Editorial audit view; nothing executes from the UI.
- 1.3: with the assertion that fails on a view the inventory does not name.
- 1.4: the security-wording sweep, listing every occurrence.
- 1.5 (D-2): the session drafts the notice for `applies.html` and waits for the author's wording.

Nothing from the Session 2 design (D1–D6) is implemented in Session 3. Item 2.1 (the register and
watchlist into `data/`) waits for the Phase 1 checkpoint and the author's approval of the D6 reasons.

## Branch register — 27 October 2026 (v2 Session 2)

`git branch -r --no-merged origin/main` lists one branch: `origin/scout/digest-digest-2026-10-26T13-10-32Z`,
the weekly Source Scout digest of 26 Oct 2026 (two files under `agent/scout/digests/`; candidates
about the DMA, GDPR enforcement and ENISA, none touching this session's records). It is in no register
entry, is reported to the author, and was not touched. `claude/v2-session-2-schemas` is this session's;
its disposition: pushed and opened as pull request #18 on the author's instruction of 27 Oct 2026; not merged.

## (previous header) v2 Session 1 — 25 October 2026

**Branch:** `claude/roadmap-v2-2026-10-25`, cut from `main` at `5f3859e` (the merge of #16),
documentation only. Merged as #17 (`933515a`).

## v2 Session 1 — ROADMAP v2.0 and the audit of 24 October 2026

**Asked** (in Italian): the author supplied the BRIEF v2.0 ("Contratto tra sessioni", binding on every
v2 session), then the Control Room content audit of 24 Oct 2026 as a PDF, then approved producing the
roadmap and recording the audit.

**What exists now.**
- `docs/AUDIT-2026-10-24.md`: the audit verbatim (Italian) and its six findings checked against the
  code at `5f3859e`. All six are confirmed.
- `docs/ROADMAP-v2.md`: Phases 0–5, ten decisions D-1…D-10 for the author, exit criteria. **Proposed,
  not approved**; its §8 approval record is empty.
- Two rows in `AGENTS.md`'s reading table.
- No code, data, page or locale was touched.

**What the author should know first.**
- **The audit's own freshness command gives a false all-clear.**
  - `node tools/freshness.mjs --as-of 2026-10-24` takes `--as-of` as the date and reports 0 prompts,
    exit 0.
  - `node tools/freshness.mjs 2026-10-24` reports 2.
  - `evidence-audit.mjs` fails the other way on a bad date (all stale, exit 1).
  - Not fixed: it is roadmap item 0.3 (D-10).
- **Finding A's remedy, as worded, would breach `docs/CONTROL-ROOM.md` §12** (no route that executes;
  `PROHIBITED_ROUTE_WORDS`). Roadmap 1.1 reaches the audit's goal by recording the run from the machine
  and having the Control Room read it.
- **The brief collides with the repository in four places**, each a decision, none taken:
  - D-2: `applies.html` is already published, with 33 rules whose source references carry no
    `supports` qualifier or locator, and which `evidence-audit.mjs` does not read.
  - D-3: six status labels over sixteen taxonomy states; the draft mapping is in §5.
  - D-4: "Tier A/B/C" vs the autonomy classes A/B/C/D.
  - D-5: a git-based CMS with OAuth vs "no serverless" and the empty runtime-origin allowlist.
- **The brief itself is not in the repository** (D-1).

**Decided by the author on 25 Oct 2026, recorded in `docs/ROADMAP-v2.md` §8:**
- **D-9:** the attestation goes in the Control Room trail.
- **D-10:** item 0.3 is in Phase 0.

The roadmap as a whole is **not yet approved**. D-1…D-8 are open.

**Pull request #17** was opened on the author's say-so. It is not merged.

**Next:** v2 Session 2 = Phase 0, only after the author approves the roadmap and that approval is
recorded in its §8.

## Branch register — 25 October 2026 (v2 Session 1)

At the start `git branch -r --no-merged origin/main` listed nothing. Thirteen remote branches besides
`main` are all already merged and not deleted. `claude/roadmap-v2-2026-10-25` is this session's; its
disposition: pushed and opened as pull request #17 on the author's instruction of 25 Oct 2026; not merged.

## (previous header) Annex B — the author's updated text, 24 October 2026

**Last updated:** Annex B replaced with the author's text · 24 October 2026
**Branch:** `claude/annex-b-2026-10-24`, cut from `main` at `74d2341` (the merge of #15). Not pushed
until the author says so.

**Asked** (in Italian): "modifica annex B con questo aggiornato", with the full Italian text pasted.

**What changed.** `annex-b.p2` to `p9` were replaced and a tenth paragraph added: the supplied
research-tooling note is two paragraphs, so its second half is the new key `annex-b.p10`, placed after
`p7` in `index.html` (as `part-1.p10` and `p11` precedent). `p1` is unchanged (its glossary link on
"sportello unico" is kept). What the new text says that the old did not:
- the date on a record is a date *associated with* the record, not proof of a fresh check; the
  freshness system flags priorities and certifies nothing; individual verification is incomplete;
- Claude Opus 5 **and 5.5**; ChatGPT (GPT-5.6 Luna), Mistral Large 4 and DeepSeek-V4.1-Flash-1017 as
  critical reviewers, "not final authorities on the correctness of the results";
- the Source Scout is "the documented operational component", and the wider design is **not** a fully
  operational end-to-end multi-agent system; the September runs fetched real pages, 21 September gave
  six candidates and none was promoted;
- the closing checks "do not equal a guarantee of absolute correctness".

**Which text is whose.** The Italian is the author's, verbatim (apart from the markup the page needs:
the bold lead-ins, the methodology link). **The English was written from it by the assistant**, so it is
a translation going the other way, and the author should read it: `index.html`, `annex-b.p2` to `p10`.
`annex-b.p5` renders "ChatGPT, con GPT-5.6 Luna" as "ChatGPT (GPT-5.6 Luna)".

**Checked against the repository, not assumed:** the Scout runs weekly (`source-scout.yml`, cron
Monday 06:17); on 21 Sep 2026 it made 17 retrieval attempts and produced 6 candidates (`digest-2026-09-21`,
`docs/SOURCE-SCOUT.md`); no candidate was promoted into `data/sources.json`; it never opens `data/*.json`
for writing. **Not checkable here:** the model names and versions, which are the author's own account of
the tools used. **One date to consider:** "As of 26 September 2026" is now a month old. Two Scout digests
since (12 and 19 Oct) were merged as candidates only; nothing found contradicts the sentence.

**French and Spanish.** Their eight Annex B paragraphs (`p2` to `p9`) described the old text, so they
are withdrawn as `superseded` and `p10` is `pending_translation` (`i18n/locales.json`, which says
so in each locale's note): those paragraphs show in English with the EN marker until someone
retranslates them. I did not translate the author's disclosure into two more languages unasked.
`it/` carries the author's Italian; **no review was recorded** (`record` is a person's), and all three
editions remain `noindex`. The three review sheets were regenerated (431 strings each).

**Checks:** validate, i18n-audit, design-qa, seo-audit, evidence-audit 0 errors (prose: 0 unclassified);
freshness 0 defects; `tools/selftest.mjs` 82/82; 25 suites 1269 pass 0 fail; browser suite 339/0/1;
gate 0 succeeded / 3 partial / 1 undecidable. Rendered in Chromium: English and Italian show ten
paragraphs in order with their links; French shows the English fallback, marked.

**Also settled today:** the Pages switch holds (`docs/DEPLOYMENT.md` §1b): the merge of #15 started no
"pages build and deployment" run.

## (previous header) The deployment settings — 24 October 2026

**Last updated:** the deployment settings, as the author reported them · 24 October 2026
**Branch:** `claude/deploy-settings-2026-10-24`, cut from `main` at `9891958` (the merge of #14),
documentation and workflow comments only. Not pushed until the author says so.

- **Pull request #14 was merged** by the author (`9891958`, 09:02:56 UTC). The branch build published
  it first, at 09:03:57, and `docs/HANDOVER.md` and `AGENTS.md` answered **200** on the live site;
  `pages.yml` run 22 replaced it at 09:07:16 and every private path is 404 again (measured).
- **Pages source:** the author switched it to "GitHub Actions" on 24 Oct. Unconfirmed: the merge
  above went through the branch build. **On the next push to `main`, check that no "pages build and
  deployment" run appears** and that `/docs/` never answers 200.
- **Rulesets:** none (the author's screenshot). Nothing requires QA before a merge.
- **HSTS: not sent** — hstspreload.org's check, with github.com as the control. Remedy is a hosting
  decision for the author (`docs/DEPLOYMENT.md` §4).
- Recorded in `docs/DEPLOYMENT.md` §1a, §1b, §3, §4; pointers in `AGENTS.md`,
  `docs/AI-SAFE-BOUNDARIES.md`, both skills, and the comments of `pages.yml` and `qa.yml`.

## (previous header) The audit snapshot of 23 October 2026 — rechecked and worked

**Last updated:** the audit snapshot of 23 October 2026, rechecked · 23 October 2026
**Branch:** `claude/audit-2026-10-23`, cut from `main` at `c5b2ad7`; pushed on the author's say-so
(QA run 246 green, the browser job on the image's own Chromium) and opened as a pull request on the
author's decision of 24 Oct 2026. Not merged; no setting changed.

The register is `docs/AUDIT-2026-10-23.md`. In one paragraph each:

- **QA's red browser job had a root cause, not a flake.** The log was readable: `apt-get install
  chromium-browser` replaced the runner image's own Chromium with a snap wrapper, the snap store
  answered 408, an `||` fallback hid it, `--version` exited 3. Both workflows now use the image's
  browser, chosen only if it runs. Not yet seen on a real runner: that needs a push.
- **Eight enforcement records rechecked.** Four re-read in full and re-dated (`enf-uber-ap-2026`,
  `enf-uber-ap-2024`, `enf-apple-ec-2025`, `enf-meta-ec-2025`). Four left unchanged with the reason:
  **two proposals the author decided on 24 Oct 2026 and that are now recorded** (the adtech appeal,
  T-794/25, with the case-number conflict AT.40670 / AT.40760 stated and unresolved; the
  supervisory-fee outcome now carries "from the date the judgments become final") **and two gaps** ([2026] IEHC 323 unidentified; courts.ie judgments offline since 21 Oct). Two candidates are
  not added: T-638/26 and T-639/26 (Google, 28 Sep 2026) and the Booking.com DSA opening.
- **Two publishers deploy every push to `main`**, the ungated branch build first; the skills that said
  "no CI, no deploy gate" now point to `docs/DEPLOYMENT.md` §1a.
- **The observability viewer binds loopback only, enforced**, and refuses a non-loopback `Host`.
- **Dialogs:** `app.js` and `js/threshold.js` now inert the whole background and the passage traps Tab;
  `js/dialog.js` lifts inert for a dialog opened over another. **Language note** keeps "· UI EN" on
  phones. **`brief_part`** absent and `null` read differently. **No colour-only state was confirmed.**
- **HSTS could not be measured from here** (the proxy hides it on hosts that send it).
- **Asked of the author on 24 Oct, not remembered:** whether the Pages source is "GitHub Actions",
  whether a ruleset requires QA on `main`, and an HSTS reading from an ordinary network. All three
  stay open; `docs/DEPLOYMENT.md` §1a and §3 say how to check each.

**Local state:** `agent/records/` and `agent/observability/runs/`, which this session's `agent/ux/` and
health-monitor runs created, were moved to the session scratchpad rather than deleted; with them in
the tree the governance suite fails three tests by design.

## (previous header) Dataset explorer: full screen and layout direction — 22 October 2026

**Last updated:** dataset explorer — full screen and layout direction · 22 October 2026
**Branch:** `claude/datasets-explorer`, restarted from `origin/main` at `cfe3607` after pull request
#13 merged (the procedure for a merged branch). Merged into `main` with `--no-ff` (`8f03a13`) on
the author's instruction of 22 Oct 2026 ("Ok, merge"), no pull request; not deleted.

**Asked** (in Italian): the graphs viewable full screen and "rotatable — moving between vertical
and horizontal is enough, not necessarily a full rotation". Read as a layout-direction switch, the
way JSON Crack offers one; dragging to pan already existed.

**What changed.** Both graphs (Structure, References) gain `↔ Horizontal` / `↕ Vertical` and
`Full screen` beside the zoom controls; `F` on the canvas toggles full screen. Vertical is the same
layout with the axes swapped (`js/json-graph.js` `layout(graph, m, orientation)`, `edgePath()`); the
References view puts the records naming this one above and the ones it names below, as a grid of
four. The direction is in the address (`o=vertical`) and travels with every reference followed.
Switching it redraws in place, so it does not leave full screen. What goes full screen is `<main>`,
not the viewer: `<main>` survives a render, so following a reference stays full screen, and only the
record heading and the graph are shown. Without the Fullscreen API (Safari on iPhone) `<main>` is
fixed over the window, page scroll locked, Escape or the button closes it.

**Found on the way, fixed before commit:** in full screen the canvas first stayed at its 200px
minimum — `.dx-layout` aligns its columns to the top, so the graph's column never stretched.

**Files:** `js/json-graph.js`, `js/datasets-page.js`, `css/tools.css` (tokens only),
`tools/selftest.mjs` (J6 now both directions over every record; J7 the reference graph in both;
J8 new), `agent/browser/checks.mjs` (`datasets:direction`, `datasets:fullscreen` with a real CDP
click, `datasets:fullscreen-fallback` with the API removed), `docs/CURRENT-ARCHITECTURE.md` §3.

**Tests — run, not asserted (22 Oct 2026, on `cfe3607` + this change):** validate, i18n-audit,
design-qa, seo-audit, evidence-audit 0 errors; freshness 0 defects; `_footer.mjs --check` current;
`tools/selftest.mjs` 82/82; every agent suite passing; baseline check `pass_with_findings`; boundary
clean; browser suite 331 pass, 0 fail, 1 undecidable (the screen-reader bound, as before).

**Not established:** Escape leaving the browser's own full screen is browser behaviour and cannot be
driven in headless Chromium (the button and `F` were tested); no real iPhone or trackpad was used —
the fallback was tested by removing the API in Chromium.

*(previous header)* **Last updated:** audit of 21 October 2026 and the dataset explorer, merged · 22 October 2026
**Branches:** both merged to `main` on 22 Oct 2026: `claude/audit-2026-10-21` (pull request #12,
`29f92c9`) and `claude/datasets-explorer` (another session; its own section below; pull request #13,
`1d973d8`). See the branch register below.

## Audit of 21 October 2026 — implemented on `claude/audit-2026-10-21`

**Asked:** the author's external audit "eudigitalpolicy.eu audit fixes" — 26 items in three phases and
an evidence-audit list. **The full register of what was checked, what changed and what was not done is
`docs/AUDIT-2026-10-21.md`.** One commit (or two) per item, each naming the item and its evidence.

**What the author should know first:**
- **Part VIII does not report the Coreper of 21 October.** No outcome had been published when it was
  checked; the brief says so, dated. Replace `clm-data-omnibus-coreper-21-october` the moment one is.
- **ST 13886/26 is a LIMITE Council document read in Agence Europe's copy**, recorded tier:2 with that
  provenance in its note; only its cover facts are used. Confirm or downgrade the tier.
- **Items 20 and 22 are built; the review itself is yours.** `it/`, `fr/`, `es/` exist as
  generated pages and the language menu goes there, but each stays `noindex` with no `hreflang`
  until every one of its 430 strings is recorded as reviewed by a person. To review Italian:
  `node tools/i18n-review.mjs sheet it`, tick `docs/i18n-review/it.md`, then
  `node tools/i18n-review.mjs record it --by "Your Name"` and `node tools/_footer.mjs`, and commit
  (`docs/SEO-OPERATIONS.md` §6). An agent never runs `record` (`docs/AI-SAFE-BOUNDARIES.md` §3).
- **Item 26 was not done**: versioned filenames need a build step, and GitHub Pages fixes
  `max-age=600`, so the gain is small.
- **Item 24 kept the three robots.txt lines**, documented: they stop being superfluous only when
  Settings → Pages → Source is "GitHub Actions".
- Annexes B and C are **one annex now**: 13 parts, `data/brief.json` and both trees changed.
- New checks: `last_verified ≥ status_as_of` and recorded inaction in `validate.mjs`; rankings of
  "largest to date" claims in `evidence-audit.mjs`; self-test A1–A6.
- Five things the suites pinned moved with the change, each with its reason: R6's unverified baseline
  (47 → 46 → 45, §12), the detector's field register (`ranking.*`), the editorial agent's box labels
  (SYNTHESIS) and root-page count (10), the health suite's Annex C assertions, and the detector's
  `NOT_ANALYTICAL` (404.html).
- Seen in passing, not acted on: the Commission opened DSA proceedings against Booking.com on
  21 Oct 2026 (IP/26/2223); the language menu is not reachable at 390px (pre-existing).

**Measured at the end** (22 Oct 2026, UTC): validators 0 errors (evidence-audit 11 warnings, as
before); 1255 tests passing; contracts 18/18; commit-evidence exit 0; browser suite 291 · 0 · 1
undecidable (`a11y:bound`), as before.

## Dataset explorer — 22 October 2026

**Asked:** evaluate JSON Crack and build an interactive JSON explorer for the site's data —
audit and proposal first, then implementation once approved. **Decided with the author before
any edit:** no JSON Crack, but a custom explorer "provided that it can visualize json content as
json crack or even more graphical"; a JSON Crack-style canvas with a tree as the accessible
fallback; the page a child of Evidence; indexed.

**Why not JSON Crack** (Apache-2.0, so not a licence question): the hosted widget is a
third-party iframe the CSP refuses (`frame-src 'none'`) and `tools/thirdparty.mjs` forbids
(`ALLOWED_RUNTIME_ORIGINS` empty, Class D); `jsoncrack-react` 1.0.3 needs React ≥ 18, four
further packages and a bundler (red under AI-SAFE-BOUNDARIES §3). And a generic viewer draws
nesting only: here a claim does not contain its source, it holds the source's id as a string, so
the edges that matter would have been invisible — and a raw claim shows no grade, because the
grade is never stored. `docs/CURRENT-ARCHITECTURE.md` §3 records the design.

**What it does:** `datasets.html` — one file, then one record. Four views: Structure (cards and
nesting lines, pan, ctrl/⌘-wheel or pinch zoom, keyboard pan and zoom, fit, find-in-record),
References (the records this one names on the right, those naming it on the left, edges labelled
by field), Tree, Raw JSON. A searchable record list; the file's own `$description`/`$note`; links
to the raw file and, where a page gives the record an anchor, to that page. Addresses are
`?d=&c=&r=&v=`, so Back works and a record can be linked.

**What it refuses to say:** a string is a reference only when it is EXACTLY an id in a loaded
file (960 today, none ambiguous); an id held twice resolves to nothing; the field is named and
the meaning of the link is not stated. `null` reads as the word, a string in quotes; a field a
record lacks is not drawn. The only derived fact is a claim's grade, from `gradeChip()`,
labelled as computed. The file header's `$last_verified` is shown beside the newest per-record
`last_verified`, named, because the header is one stamp for the file (AUDIT-2026-09-01 F-13).
No jurisdictions view: there is no jurisdictions dataset, and none was implied.

**Files.** New: `datasets.html`, `js/json-graph.js` (pure model and layout),
`js/datasets-page.js`. Changed: `js/shell.js` (`CHILD_OF`), `css/tools.css` (tokens only),
`bibliography.html` (one link), `tools/_footer.mjs` (page list, generated no-JS file index,
`childOfFromShell()`), `tools/seo.mjs` (route, `datasetsIndex()`, the structured-data breadcrumb
now carries the parent the page draws), `tools/seo-audit.mjs` (compares against the shell's
crumb, not a two-level assumption), `tools/pages-artifact.mjs` (allowlist), `tools/design-qa.mjs`
(DATASETS = `data/*.json`), `tools/selftest.mjs` (J1–J7), `agent/browser/checks.mjs` + `runner.mjs`
(the page in PAGES and SEO_PAGES; `checkDatasets`, 12 checks), `agent/detector/impact.mjs` (the two
modules classified), `agent/detector/detector.mjs` (below),
`agent/proposals/editorial/selftest.mjs` (ten pages), every generated page (site-index link),
`sitemap.xml`, `docs/CURRENT-ARCHITECTURE.md`, `docs/AI-SAFE-BOUNDARIES.md`. No `data/` file.

**Two things the change exposed, fixed:** (1) the detector's analytical-page note joined one
identical explanation per page, and a tenth page pushed it past the contract's 4,000 characters,
so five of six fixture changes lost their ImpactAssessment; it now keeps each distinct
explanation once (the pages stay listed in `pages`). Any new page would have tripped it. (2) the
structured-data breadcrumb assumed every top page sits directly under home; a page with a
`CHILD_OF` parent now gets the parent, read from `js/shell.js`.

**A documented fact changed:** "`brief.json` is loaded by nothing" is no longer true — the
explorer loads it and shows it raw. No view renders it, and it holds no copy of the brief's text,
but Annex C's dek, shown nowhere in the brief, is now visible in the explorer's view of that file.
CURRENT-ARCHITECTURE §5/§7/§8/§9 and AI-SAFE-BOUNDARIES §4 now say so.

**Tests — run, not asserted (22 Oct 2026):** `validate` 0 errors · `i18n-audit` 0/0 · `design-qa`
0/0 · `freshness` 0 defects, 3 staleness prompts (as at baseline) · `seo-audit` 0 · `evidence-audit`
0 · `_footer.mjs --check` current · `tools/selftest.mjs` 73/73 (J1–J7 new) · all 22 agent suites +
schemas + browser selftest pass · `agent/implement/cli.mjs check` pass_with_findings (baseline) ·
both boundary scans and `pages-artifact.mjs build` clean · every other CI command exits as on
`main` · browser suite 328 pass, 0 fail, 1 undecidable (baseline 291/0/1; the undecidable is the same). Browser `checkDatasets` covers render, the derived grade
against `format.js`, following a reference and Back, a reference clicked in the SVG, list and
in-record search, every view, an unknown record, the anchors the "shown on the site" links target,
390px, and — via CDP Fetch interception — `glossary.json` served malformed and `brief.json` as a
404, with the other eight files still usable.

**Limitations, stated:** the canvas is a mouse/touch surface; keyboard users get pan and zoom
keys, focusable reference links in the SVG, and the Tree view and reference lists as the full
alternative — no screen reader was run. Large records open at reading size on the first card
rather than fitted (GDPR is 80 cards). The Structure graph stops at 240 cards and says where; no
record is near it today. The References view draws 24 per side and lists the rest. Taxonomy terms
are labelled, not drawn. The deployed site was not loaded in this session; everything above ran
against a local server.

**For the author:** merge `claude/datasets-explorer` if you want it live; nothing else is needed.

## P1 — licence, methodology, structured data, custom domain — 21 October 2026

*(previous header)* **Branches:** `claude/p1-licence-geo` (cut from `origin/main` at `05707f5`) and
`claude/p1-custom-domain` (stacked on it). The first merged into `main` with `--no-ff` on the
author's instruction of 21 Oct 2026 ("Fai merge solo di claude p1-licence"), no pull request; the
second merged into `main` with `--no-ff` the same day, once `eudigitalpolicy.eu` resolved (A,
AAAA, `www` CNAME and the GitHub challenge TXT read back through dns.google on 21 Oct 2026).

**Asked** (in Italian): a `CNAME` for a placeholder domain `eu-digital-policy.eu` and the Jekyll
`url`/`baseurl`; a CC BY 4.0 `LICENSE`, a licence page and a methodology page; a licence line in
every footer; `Article` (author Andrea Tosti, dates, title) and `FAQPage` JSON-LD on the DMA pages,
from the "In short" box or "3–4 invented questions if there are none".

**Decided with the author before any edit:** the new pages and the footer line in English (the site
is `lang="en"`); the licence over **everything** original, code included (the EU texts and the
typefaces excluded); Article + FAQPage on **all twelve** instrument pages, from one code path.
**The licence is the author's decision of 21 Oct 2026**, which is what AGENTS.md rule 8 reserved to
them; rule 8 now forbids changing it.

**Not done, and why:**
- **No Jekyll config.** There is no `_config.yml`; the site is static HTML generated by
  `tools/_footer.mjs`, and the origin is one constant, `BASE`.
- **No invented FAQ.** Questions are the page's own H2s; answers are the "In short" box's text,
  derived from `data/`. A row the record does not establish ("not established") is left out of the
  FAQ rather than offered as an answer. The prompt's sample answers were not used (not from `data/`).
  Note: Google shows FAQ rich results only for authoritative government and health sites since
  2023, so the value here is to parsers and answer engines, not a rich result.
- **The domain, later the same day:** the author registered `eudigitalpolicy.eu` (Porkbun), and
  `CNAME`, `BASE` and the live-site links on `claude/p1-custom-domain` now name it instead of the
  placeholder. It resolved the same evening and the branch was merged. **Still the author's:**
  Settings → Pages → Custom domain shows `eudigitalpolicy.eu` and **Enforce HTTPS** once the
  certificate is issued; verify the domain at github.com/settings/pages; Search Console.
- **The CNAME is not on the mergeable branch.** `eu-digital-policy.eu` did not resolve on 21 Oct
  2026 (DNS answered for github.com from the same container). Pages serves `main` from the branch,
  so a `CNAME` reaching `main` would redirect the live site to a host that does not answer. The
  switch is on `claude/p1-custom-domain`, to merge only after the domain is registered and its DNS
  points at GitHub Pages.

**What changed (`claude/p1-licence-geo`):** `LICENSE` — the CC BY 4.0 legal code, verbatim from
creativecommons.org (sha256 `9ba9550a…`), no preamble so GitHub detects it; scope in README and
`licence.html`. `tools/_footer.mjs` — `AUTHOR`, `LICENCE`; the footer's reuse paragraph and ©
line (the non-affiliation and advice paragraphs byte-identical). `tools/seo.mjs` — `SITE.author`,
`SITE.licence`, `PAGE_PUBLISHED` (all twelve pages first written by `176e4b4`, 27 Sep 2026), two
new top pages, an "About this site" index column, and JSON-LD: `license`/`author` on WebSite;
Article (headline = `<h1>`, `dateModified` = the sitemap's `lastmod`, never before publication)
and the page node as `FAQPage` on instrument pages. `js/instrument-view.js` — `shortRows()` is the
one derivation behind the box and `instrumentFaq()`; the box's bytes did not change.
`tools/seo-audit.mjs` — author, licence and dates left `LD_FORBIDDEN` and are held to the page:
licence = the declared one and linked `rel="license"`, author named in the page, dates ISO, the
Article's headline the `<h1>`, the FAQ exactly the route model's and every question and answer
sentence in the crawlable text (selftest S4b plants each). `methodology.html`, `licence.html` —
new, generated regions by the generator, prose checked against README and `data/taxonomy.json`
(limitations quoted, not softened). `css/tools.css` — `.doc-body`, `.cc-badge` (text, not CC's
button image, which would be a third-party request), link style in the footer. Docs that stated
"no licence" as current fact: README, AGENTS rule 8, AI-SAFE-BOUNDARIES, PROJECT-CONTEXT §7,
SOURCE-POLICY, DISCOVERABILITY §9, CURRENT-ARCHITECTURE, VERIFICATION-POLICY.

**Three things the change exposed, fixed:** (1) `agent/ux/proposals.mjs` chose `review_required`
without consulting `RED_TARGETS`, so the first finding citing `licence.html` made the contract
throw; it now reads the same list. (2) The browser suite found the footer's new link in the
browser's default blue — 1.98:1 in the dark theme, on every page; the footer had never held a link.
(3) `licence.html` scrolled at 320px on the legal-code URL. The two pages are now in the browser
suite's `PAGES` and `SEO_PAGES`. `agent/proposals/editorial/selftest.mjs` asserts nine root pages.

**For the author:** (a) register the domain and set DNS (below), then merge
`claude/p1-custom-domain` and set the custom domain in Settings → Pages; (b) add the new property in
Search Console and resubmit the sitemap; (c) the citable data snapshot (DISCOVERABILITY §9) is no
longer blocked; (d) `fonts/` carries no licence files for the three typefaces — not changed here.

**`robots.txt`, later the same evening** (author: "Sisi"), on `claude/robots-txt`: generated by
`tools/_footer.mjs` from `tools/seo.mjs robotsTxt()` — all crawlers allowed, `/agent/`, `/docs/`,
`/tools/` disallowed, `Sitemap: https://eudigitalpolicy.eu/sitemap.xml`; in the deploy allowlist;
`seo-audit.mjs` fails a wrong sitemap or a rule over an indexable route (selftest S4c). Merged into
`main` with `--no-ff` on the author's instruction ("Fai merge"), not deleted.

## Branch register — 22 October 2026 (audit)

At the start `git branch -r --no-merged origin/main` listed nothing. During the session one branch
appeared, `claude/datasets-explorer` (another session, 22 Oct, a dataset explorer), which also added a
root page. Dispositions, all 22 Oct 2026, all on the author's instruction:

- **`claude/audit-2026-10-21`** → pull request **#12**, merged by the author (`29f92c9`).
- **`claude/datasets-explorer`** → `main` merged into it first (`89fccef`), seven conflicts resolved:
  both branches had added one root page each (`404.html`, `datasets.html`) to `tools/seo.mjs`,
  `tools/_footer.mjs`, `tools/pages-artifact.mjs` and the editorial suite's page count (now 11), both
  appended tests to `tools/selftest.mjs`, and both rewrote `brief.json`'s row in CURRENT-ARCHITECTURE
  §7 (13 parts) and the top of this file. Measured on the merged tree: validators 0 errors, 1262
  tests, browser suite 328 · 0 · 1 undecidable. Then pull request **#13**, merged (`1d973d8`) on the
  author's instruction, on the push run's full green for that commit; the pull-request run's browser
  tests had passed and only its upload step was still running. No review of #13 beyond its CI.

Afterwards `git branch -r --no-merged origin/main` lists nothing.

## Branch register — 21 October 2026 (P1)

At the start `git branch -r --no-merged origin/main` listed nothing besides `main`'s own history.
Both are in `main` (merged `--no-ff`, not deleted). `claude/p1-custom-domain` waited until DNS
answered, because merging it before would have taken the site offline.

## DMA click-through pass — 21 October 2026

*(previous header)* **Branch:** `claude/seo-dma-ctr`, cut from `origin/main` at `6a2357f` (PR #11's merge). Pushed
to `main` by fast-forward on the author's explicit instruction ("Push to main"), with no pull
request; `main` had not moved since the branch was cut. Then, on the author's decisions of the
same day, directly on `main`: `claude/amazing-einstein-yrsu79` (the Apple appeal recheck, below)
and the two October Scout digests merged with `--no-ff`, and the `<h1>` changed (below).

**Asked:** Search Console showed 830 impressions and 6 clicks (CTR 0.7%) over three months, on
"digital markets act", "dma third-party obligations", "compliance", "summary"; rename cryptic URLs
(`…/Eu-Digital-Policy//instrumlsa/` was cited), rewrite DMA titles and descriptions (supplied in
Italian), add a TL;DR box under the H1, turn H2s into questions, add contextual links.

**Decided with the author before any edit:** English metadata, because the page is `lang="en"`,
the queries are English and no locale is indexed (`docs/SEO-OPERATIONS.md` §6); one strengthened
DMA page rather than three new ones, because the strategy forbids a page written for a query.

**Not done, and why:** no URL was renamed. `instrumlsa` exists nowhere in the tree or in any
branch's history, `instruments/dma/` already earns the impressions and Pages cannot send a 301,
and instrument IDs are never renamed. The supplied TL;DR snippet's inline `style` would be blocked
by every page's CSP (`style-src 'self'`); the box uses a class instead.

**What changed:** `tools/seo.mjs` — the DMA title ("gatekeeper obligations, compliance deadlines
and fines") and the description template for all twelve instrument pages (§7 of
`docs/SEO-OPERATIONS.md`); `js/instrument-view.js` — question headings and the derived "In short"
box on every instrument page; `css/tools.css` — its style, tokens only; `index.html` Part IV and
the three overlays — two links to `instruments/dma/#sec-provisions` and `#sec-enforcement`, the
same words wrapped in all four languages, no text changed (the overlays replace `innerHTML`, so a
link in the English alone would vanish in it/fr/es); `instruments/*/index.html` regenerated.
No fact was authored: every value the box and the descriptions show is read from `data/`.

**Measured at the end** (21 Oct 2026, UTC): validate, i18n-audit, design-qa, seo-audit 0 errors /
0 warnings (the first draft of the template produced three over-length warnings, closed by
capping the actor list and the objective, not by raising `MAX_DESC`); evidence-audit 0 errors;
freshness 0 defects, 3 staleness prompts (as before); 25 suites, **1245 tests, all passing**;
contract check 18/18; browser suite **241 pass · 0 fail · 1 undecidable** (`a11y:bound`). The DMA
page was captured at 1280px in both themes and at 390px: no console error.

**The `<h1>`, decided by the author afterwards:** each instrument page is headed by
`displayName()` — "Digital Markets Act (DMA)" — wherever the record's aliases back a common name
(eight pages; CER, Data Act, DORA and NIS2 keep the short name). `displayName()` moved to
`js/routes.js` so the renderer and the route model's expected `h1` read one function; the
"Known as the …" line is dropped where the heading already carries the name. Re-measured on
`main` after every merge: validators 0 errors / 0 warnings; 25 suites, 1244 passing and 1
skipped (`agent/autonomy` test 28, which skips on `main` by design); governance check exit 0;
browser suite 241 · 0 · 1 undecidable; GDPR's heading checked at 390px, no overflow.

**One commit on `main` breaks the evidence rule, and was left as it is.** `55ac136` (the handover
commit after the `<h1>` change) also carries `instruments.html`: the generator rewrote its
JSON-LD instrument names through `displayName()`, and the `<h1>` commit `14a184a` staged
`instruments/` but not that file. `55ac136` has no `Evidence:` trailer, so
`tools/commit-evidence.mjs 22a217c 55ac136` exits 1, and the `commit-evidence` step of that push's
CI run is expected to be red, which in `qa.yml` skips the steps after it in that job. The
content is right: the file is the generator's output from `data/`, and every validator passes on
it. The evidence `55ac136` should have named is `14a184a`'s (the author's H1 decision of 21 Oct
2026; names from `KNOWN_AS` and the records' aliases). The author decided not to rewrite `main`
to add the trailer. Later pushes are judged on their own range only, so this does not recur. The
lesson: after `node tools/_footer.mjs`, stage everything it reports writing (`git status`),
not only `instruments/`.

**For the author:** (a) in Search Console, request indexing for `instruments/dma/` once deployed
and compare CTR per query after four weeks; (b) send the exact Search Console URL behind
"instrumlsa" if it is still reported; (c) the Apple appeal record's open question, below.

## Branch register — 21 October 2026

At the start `git branch -r --no-merged origin/main` listed three branches besides this one:
the Scout digests of 12 and 19 Oct 2026, and `claude/amazing-einstein-yrsu79`, recorded as merged
on 27 Sep (PR #4) but carrying one later commit (`ad7dd2d`, the Apple appeal recheck). **All three
were merged into `main` on the author's decision** — the digests as candidates only, unverified,
as the September digests were (`1c903a7`); the recheck after the author approved its data change,
with the handover conflict resolved by keeping both entries. `claude/seo-dma-ctr` is in `main`.
None of the four branches was deleted.

## (previous header) The Apple appeal recheck — 15 October 2026

**Last updated:** the Apple appeal recheck · 15 October 2026
**Branch:** `claude/amazing-einstein-yrsu79`, restarted from `origin/main` at `6a2357f` (PR #11's
merge) for this recheck; not opened as a pull request.

**Asked:** the October recheck the author approved on 27 Sep 2026 (a Routine). `main` re-fetched
before this write: `6a2357f`. Unverified count unchanged at **47**.

- **Register, read 15 Oct 2026** (InfoCuria's search service; index held lodgings to 7 Oct 2026
  and a closure dated 14 Oct 2026): T-1079/23, T-1080/23 and T-214/24 are closed on 8 July 2026,
  joined, with **no appeal linked**; no case with Apple as a party was lodged after 8 July 2026.
- **Recorded:** only the dated observation in `enf-apple-gc-2026-designation` `appeal.note`. It
  stays `appeal:unknown`. If notified on the day of delivery, the appeal period (Statute Art. 56,
  two months; Rules of Procedure Art. 51, ten days for distance) ended on 18 September 2026. The
  register does not show the notification date, so `appeal:not-lodged` is not recorded.
- **For the author:** to close this record as not appealed, establish the notification date. The
  Commission or Apple can state it, and a later register read can confirm it. Or decide that the
  register's silence, three weeks past the earliest possible deadline, is enough.

## (previous header) The October 2026 evidence update — 14 October 2026

**Last updated:** the October 2026 evidence update · 14 October 2026 (reference date)
**Branch:** `claude/eu-digital-policy-audit-um86no`, cut from `origin/main` at `e37f23b`. Opened
as pull request #11 on the author's instruction; not yet merged.

**Asked:** an evidence-quality audit and controlled implementation against a research brief
(Digital Omnibus, AI Act and Regulation (EU) 2026/1744, DSA enforcement, the DMA and Google,
eIDAS, CRA, NIS2/Italy, Gigabit Infrastructure Act, GDPR fine totals, EU–US transfers, new
initiatives, other figures), reference date 14 October 2026, with the brief treated as a list of
things to check rather than a source. **The register of what was checked, corrected, left
unresolved and found on the way is `docs/AUDIT-2026-10-14.md`.** Read it before this summary.

**The network reached the sources this time.** EUR-Lex (with retries past its HTTP 202
challenge), the Commission, the press corner's API, Parliament's Legislative Observatory, ACN,
DLA Piper and Agence Europe all answered; every source added or re-read was fetched and read on
14 Oct 2026. Not reached: the CMS Enforcement Tracker (403), and no Council record of the
October Coreper meetings was located.

**What changed, by area** (records and keys are listed in the audit document):
- Data Omnibus: the Coreper II vote planned for 11 Oct 2026 did not happen (Agence Europe, tier 4,
  graded secondary and said so in the prose); Parliament's stage from OEIL; status note, chip
  and Part VIII rewritten; no amendment count published, because none was verified.
- AI Act: every date re-read against the OJ text of 2026/1744 and found right; the Part V chip now
  carries Aug 2028 as well as Dec 2027; recital 40 anchors the standards premise of a critique.
- DSA: X's action plan (16 Jul 2026) recorded without disturbing the decision or the appeals;
  "first non-compliance decision" now sourced to the Commission; Meta/TikTok opening dates; the
  TikTok minors and addictive-design findings recorded as one proceeding (the brief said
  otherwise; IP/26/1679 is explicit).
- DMA: the 16 July 2026 Google specification decisions (Arts 6(7), 6(11)) as two claims, two
  month-precision compliance dates, and a sentence in Part IV; the gatekeeper count is now dated.
- eIDAS: wallet deadline stated as 24 Dec 2026; Art. 5f(2) private acceptance from 24 Dec 2027,
  with its three qualifications, as a claim, a provision, two calendar events and Part I's box.
- CRA: Art. 14 vs Art. 24(3) vs general application; "severe", not "serious", incidents.
- GDPR totals: the headline chip and sentence name DLA Piper, its cut-off and what it counts;
  Alliance Risk's 40% is no longer read as a share of DLA Piper's total.
- **Two pre-existing temporal errors the brief did not name, both fixed:** every CRA article was
  derived as applying from 11 June 2026, and Data Act Art. 8 from 12 September 2027, because a
  provision-less tranche was being read as the general application date. `statusContradictions()`
  now refuses that shape, and a proposal carrying a status that counts it as law.
- The masthead's verification line never rendered (it targeted `.portal-head`, which no page has);
  it now gives the range of per-record verification dates and says what the range does not mean.

**Translations:** 14 strings and 2 calendar obligations retranslated (it/fr/es), AI-assisted and
not reviewed by a native speaker; recorded in `i18n/locales.json`. Four new calendar events fall
back to English, marked EN.

**Measured at the end** (14–15 Oct 2026, UTC): validate, i18n-audit, design-qa, seo-audit
0 errors / 0 warnings; evidence-audit 0 errors, the same 11 warnings as on `e37f23b`; freshness
0 defects, 3 staleness prompts (as before); 25 suites, **1245 tests, all passing** (1237 + eight
new in `tools/selftest.mjs`, O1–O8); schemas and governance checks exit 0; browser suite
**241 pass · 0 fail · 1 undecidable** (`a11y:bound`, as before). The changed passages were also
captured at 1280px and 390px: no horizontal overflow, no console error.

**Not done, deliberately:** nothing was added for the Gigabit Infrastructure Act, the DPF,
the Digital Networks Act, the Digital Fairness Act or the EU KIDS ACT, which the site does not
cover; their status as read is in the audit document §3 for the author's decision. The DMA's
"not established" provisions (audit §4) need DMA Art. 54 read before they are tagged.
`docs/CURRENT-ARCHITECTURE.md` §12's unverified count is unchanged at 47.

**For the author:** (a) review the audit document and the per-area commits; (b) decide whether
any §3 item belongs on the site; (c) re-check AliExpress's action plan after 20 Oct 2026 and the
Data Omnibus before any further Council meeting; (d) the scout branch below.

## Branch register — 14 October 2026

`git branch -r --no-merged origin/main` lists
only `origin/scout/digest-digest-2026-10-12T15-34-12Z`, which is in no register entry and is
reported to the author: a Source Scout digest, two files under `agent/scout/digests/`, read only
as far as its summary (among its candidates are the Commission's Google specification page,
which this update read directly, and ENISA's CRA reporting-platform launch, which it did not).
This session's branch, `claude/eu-digital-policy-audit-um86no`, is pushed and open as pull request #11. The
scout branch named on 6 Oct (`…2026-10-05T14-47-50Z`) is no longer listed.

## (previous header) The brief rewritten to the author's editorial standard — 6 October 2026

**Last updated:** the brief rewritten to the author's editorial standard · 6 October 2026
**Branch:** `claude/editorial-standard`, cut from `origin/main` at `fbd173e` (PR #8's merge).
**Merged as pull request #9** (`4d9279f`, 6 Oct 2026). This follow-up on the same branch,
restarted from `4d9279f`, corrects the register below, which was written before the merge.

**Asked:** the author supplied a style guide for the brief's prose (serious European policy
analysis edited by a human, between Bruegel, the FT and The Economist; precision before style;
fact, then interpretation, then implication; criticism from evidence rather than adjectives;
informative titles; a list of constructions that make prose read as generated). Then: rewrite
the whole brief to it, in order, retranslate, and leave the standard recorded.

**Where the standard lives.** One home: Part A of
`.agents/skills/legal-editorial/references/house-register.md`. The file's previous content is
Part B, unchanged except that the em-dash convention now points at Part A's rationing and one
quoted example follows the rewritten sentence. The hedging table is untouched and still
outranks style. `legal-editorial/SKILL.md` has a procedure for a **style rewrite on the
author's instruction** (one section or the whole brief, committed section by section; claim set
compared; per-key parity of markup, numbers, months and asterisks in every language; every
changed key retranslated or superseded; titles changed in all six homes). Without that
instruction the standard governs new prose only; `docs/AI-SAFE-BOUNDARIES.md` §2 is unchanged.

**What changed.** 111 English strings across all fourteen sections, one commit per section,
then one commit for titles. Every element, `data-claim`, `data-record`, `data-prose` and
`data-i18n` attribute is where it was; no element was added, removed or split, so no claim
record, prose registration or locale key moved. Before writing, a script refused any key whose
inline markup, digits, English month names or asterisks differed from the previous version in
any of the four languages. What the edits did: em dashes 202 → 38 (most of the rest are list
bullets), sentences with two or more 42 → 3, "not … but" 7 → 3; "not a technicality", "the
mechanism working as designed", "the real output", "That proviso is doing real work" and
similar replaced by direct statements; the second-person instruction in Part IX and the word
"simply" in Part XI (both barred by Part B) removed. Titles: Part II "its enforcement gap"
(was "the cracks in it") and its dek and subheading drop "pathology"; Part VI "reallocating
control over machine data" (was "prising open the machine economy"); the em dashes leave the
titles of Parts VII and XI, whose portal copies already had the comma form. `data/brief.json`
changed only in those titles and that dek.

**A translation error fixed in passing.** The it/fr/es translations of `part-1.p10` said the
GPAI Code was finalised after "four drafts"; the English and `clm-gpai-code-four-drafts` say
"three drafts and a final text". The retranslation follows the English.

**Translations.** 110 strings changed in each of it, fr and es (one translation already
matched). Recorded in each locale's note in `i18n/locales.json`; nothing superseded or
pending. Like the 27 Sep 2026 translations they are AI-assisted and **not reviewed by a native
speaker**. README limitation 5 describes the 27 Sep batch only; extending it is the author's
call, because that section is reserved to the author.

**Measured at the end:** validate, i18n-audit, design-qa, seo-audit 0 errors / 0 warnings;
evidence-audit 0 errors, 11 warnings (the same 11 as on `fbd173e`); 25 suites, **1237 tests,
all passing**; schemas check exit 0; browser suite **241 pass · 0 fail · 1 undecidable**
(`a11y:bound`, as before).

**Not done, deliberately:** README limitation 5 (above). Part X's portal label reads "build at
once?" where its heading reads "at the same time?"; that drift predates this session and was
left alone. Title deks other than Part II's were not changed. No claim statement in
`data/claims.json` was edited: the prose was rewritten to keep asserting what each statement
says, and statements are data, outside a style pass.

**For the author:** (a) read the per-section commits (`git log fbd173e..45324ae`) and revert
any section whose voice is no longer yours; (b) decide on README limitation 5; (c) the scout
branch below.

## Branch register — 6 October 2026

`git branch -r --no-merged origin/main` lists only
`origin/scout/digest-digest-2026-10-05T14-47-50Z`, which is in no register entry and was
reported to the author rather than inspected further. This session's branch,
`claude/editorial-standard`, was merged as PR #9 and restarted from `4d9279f` for this
correction.

## The brief's text, single-sourced — 30 September 2026 (previous header)

**Branch:** `claude/brief-single-source`, cut from `origin/main` at `cc1f7d0` (PR #5's merge).
**Merged as pull request #6** (`d4065c6`, 1 Oct 2026). A follow-up on the same branch, restarted
from `d4065c6`, records the evidence the main commit omitted (below).

**Asked:** remove the duplication between `index.html`'s markup and `window.__CONTENT__` /
the structured layer by establishing one canonical source — not by synchronising copies — and
add a structural regression check. This lifts the standing "do not fix the `__CONTENT__` drift
on your own initiative": it was done on the author's instruction.

**Diagnosis, measured before any change.** `app.js` was the only reader of the blob and read
only `nav` (pagers, resume bar) and `search` (prose search). `meta` and `nodes` were read by
nothing. `search[].text` was **stale**: no Annex C, ~9 KB of current prose missing; in a
browser, three Parts' own last paragraphs could not be found by searching for them.
`data/brief.json` `meta` was read by nothing, lay outside the file's own `$description`, and
kept the "six regulations" miscount. The visible standfirst (`portal.p1`) differed from both.
The markup is where every edit had actually landed. Full table: `docs/CURRENT-ARCHITECTURE.md` §8.

**What changed:**
- `index.html` — the blob is deleted; the page has no inline script and its CSP is
  `script-src 'self'` (regenerated by `tools/_footer.mjs`).
- `app.js` — builds `BRIEF` (id, numeral, title, dek, prose) from the `section.part` markup at
  load; the search provider, pagers, resume bar and the portal's "Read the brief" crossing
  (which hardcoded Part I's title) read it. Annex C is now listed and searchable.
- `data/brief.json` — `meta` removed (title, subtitle, standfirst, dateline, note, howto; none
  rendered). **The dateline T-33 set ("State of play as of 26 September 2026") is therefore
  held nowhere; it was already shown nowhere** — see "For the author".
- Regression protection: `tools/prose-homes.mjs` + `design-qa.mjs` (no script, inline or
  module, holds a page's own text — detected by content, not by name); `validate.mjs` §4(g)
  (`brief.json` holds only `parts` and `reading_graph`); `tools/selftest.mjs` C1–C4 plant each
  shape; browser `checkBriefIndex` (4 checks; against the old tree three fail).
- Agent layer, so nothing misreports the new state: `health` `knowledge.duplicate_facts` now
  counts `brief.json` titles/deks against the markup headings (and script copies); `editorial`
  no longer reports the blob's absence as a divergence and its review guidance no longer says to
  sweep a blob; `detector` caveats; tests in `architect`, `health`, `editorial`, `detector`, and
  `tools` I1 updated to the new state, with planted cases where an assertion would otherwise go
  vacuous.
- Docs: `CURRENT-ARCHITECTURE` §4/§8/§9/§12, `AGENTS.md`, `AI-SAFE-BOUNDARIES`,
  `DATA-GOVERNANCE` §4–5, `VERIFICATION-POLICY`, `AGENT-ROLES`, `BROWSER-QA`, `CHANGE-DETECTOR`,
  `REGULATORY-IMPACT-MAPPING`, `EDITORIAL-AGENT`, a status line on AUDIT F-04, five skills.

**Measured at the end:** validate, i18n-audit, design-qa, evidence-audit, seo-audit 0 errors /
0 warnings; freshness 0 defects (1 staleness prompt, calendar-only, as before); 25 suites pass,
**1237 tests** (1233 + C1–C4); schemas and governance checks exit 0; browser suite **241 pass ·
0 fail · 1 undecidable** (`a11y:bound`, as before; 237 + 4). No legal fact in `data/` changed:
the only data edit removes unrendered text.

**Not done, deliberately (remaining debt):**
1. **Part titles and deks still have two homes** — `brief.json` `parts[]` and the markup
   (heading, tree list and SVG, spine `title`). Annex C's dek exists only in `brief.json`.
   Smallest fix: generate those markup regions from `brief.json` in `tools/_footer.mjs`. A
   change to how the brief is authored — the author's call.
2. `EditorialProposal.content_blob_checked` / `content_blob_divergence` and `PROSE_HOMES`'
   `content_blob` (`agent/schemas/`) are now vacuous. Retiring them is a contract change.
3. Rationale strings in `agent/policy/categories.mjs`, `governance.mjs` and
   `agent/orchestrator/policy.mjs` still say `index.html` carries "the inlined `__CONTENT__`
   copy". `agent/policy/` is reserved to a person; no rule changes with the wording.
4. The markup's system map still uses `aiact`/`dataact` (DATA-GOVERNANCE §4).
5. `agent/proposals/governance/patterns.mjs` P-11 states the duplication in the present tense;
   its anchors still resolve.

**The missing `Evidence:` trailer — recorded here, because `main` is not rewritten.**
`081ca54`, the commit of this change that touches `app.js`, `data/brief.json` and `index.html`,
was merged without the trailer `tools/commit-evidence.mjs` requires (the session did not run that
check before pushing). On the push of `d4065c6` the check failed in QA and in the Pages gate, and
every later step of the validators job was skipped; the site was still published, because the
Pages source is still the branch (`docs/DEPLOYMENT.md` §3). The evidence that commit rests on:
measured on `cc1f7d0` before any change — in Chromium, `window.__CONTENT__.search` against the
rendered `.part-body` text (Annex C absent, ~9 KB of current prose missing, the closing paragraphs
of three Parts unfindable by search); `tools/prose-homes.mjs` finds 112 copied blocks on that tree
and 0 after; `docs/CURRENT-ARCHITECTURE.md` §8 holds the table. No legal fact changed:
`data/brief.json` lost only its unrendered `meta` block. The check judges each push's own range,
so the next push to `main` is judged on its own commits; no check was changed to get past it.

**For the author:** (a) the brief shows no dateline anywhere; if it should, it belongs in the
markup under an i18n key. (b) Decide on item 1 above. (c) Merge the follow-up — it changes
only `docs/`, and its push re-runs the validator steps the failure skipped on `main`.

## Branch register — 30 September 2026

`git branch -r --no-merged origin/main` lists nothing. This session's branch,
`claude/brief-single-source`, was merged as PR #6 and restarted from `d4065c6` for the
evidence follow-up.

## SEO, indexing and discoverability — 27 September 2026 (night)

**Asked:** a production-grade SEO, indexing and discoverability audit and implementation that
sits on top of the evidence architecture without weakening it. Audit first
(`docs/SEO-AUDIT-2026-09-27.md`, committed before any change, measured raw vs rendered in
Chromium), then the change, then the tests.

**The defect that mattered:** 21 instrument URLs were one HTML file whose canonical, title, `<h1>`
and structured data were right only after JavaScript, and whose raw HTML was a loading stub linked
from nowhere.

**What changed:**
- `js/instrument-view.js` — the instrument renderer, split out of `instrument-page.js`, pure.
  `tools/_footer.mjs` calls it in Node (no clock) to write `instruments/<id>/index.html` for the
  12 instruments that pass the gate in `js/routes.js` (seven criteria, all derived from the
  record). The browser re-renders the same view with today's date.
- `instrument.html?id=…` forwards to the page (fragment kept); thin records render with
  `noindex`; no id forwards to the list now generated into `instruments.html`.
- `tools/seo.mjs` — the route model: titles, descriptions (derived; one curated facet phrase per
  instrument, checked against the page text), canonical, OG/Twitter, JSON-LD (WebSite, WebPage /
  CollectionPage, BreadcrumbList, `Legislation` from the record — no author, date, licence or
  legal force), sitemap with `lastmod` = newest verification date rendered. Site name "EU Digital
  Policy", editorial title as alternate.
- A static site index before every footer; `js/data.js` resolves data and locale paths against
  its own URL, and `js/shell.js`, `search.js`, `palette.js`, `dna.js`, `interactions.js` link
  through `js/routes.js`, so pages two levels down work.
- **hreflang and `?lang=` sitemap entries withdrawn** (reversing a decision of earlier the same
  day): the translations exist only after JavaScript over English HTML and are unreviewed.
  `?lang=` still works for readers. Selftest I1d rewritten to the new rule, with the reason.
- `tools/og-image.mjs` — 13 social cards rendered by the repository's own Chromium driver;
  staleness checked by input hash.
- `tools/seo-audit.mjs` — in `qa.yml` and the deploy gate; selftests S1–S6 plant each defect.
  Browser suite: new `seo` area (31 checks). `design-qa`, `thirdparty` and `pages-artifact` now
  know pages below the root; an `<a href>` to another origin is a link, not a request (a
  `<link rel=preconnect>` still is — S6).

**Second pass, same session ("continue"):** the enforcement, institutions and bibliography
mounts now open with a generated, clock-free record index (every record, linked to the instrument
pages), replaced by the full view on load; the loading line stays first so the browser suite
still detects a failed render. Crawlable text in the HTML as served: enforcement 2,048 → 6,026
characters, institutions 2,014 → 5,351, bibliography 3,564 → 46,486. `seo-audit.mjs` fails if an
index omits a record (planted in selftest S4).

**Measured at the end:** validators 0 errors / 0 warnings (evidence-audit 11 warnings, as on
`main`); `seo-audit` 0 / 0; 25 suites pass, 1233 tests (1221 before; tools 52, detector 67 with `instrument-view.js` and
`routes.js` registered in `MODULE_SURFACE`); browser suite 237 pass · 0 fail · 1 undecidable
(`a11y:bound`, as before). No fact in `data/` changed.

**For the author:**
1. **Search Console** — `docs/SEO-OPERATIONS.md` §3–5: URL-prefix property, verification by meta
   tag, submit `sitemap.xml`, inspect the representative URLs.
2. **Repository About box** (description, website, topics, social image) —
   `docs/DISCOVERABILITY-STRATEGY.md` §6. No tool here can set it.
3. **Decide on a custom domain** before citations accumulate (§7), and on a **licence** — a
   citable data snapshot is blocked without one (§9).
4. **After any data edit, run `node tools/_footer.mjs`** or CI fails on the stale page.
5. Merge PR #5 — merging publishes the site.

## Competences, Irish court records, prose corrections — 27 September 2026 (evening)

**Asked:** "continue", "go on", under the standing instruction to reduce the backlog as far as
possible, with permission to act on user-only blocks. `main` did not move (re-fetched before
this write: `179c975`). Unverified **52 → 47**. Every commit carries an `Evidence:` trailer and
passed validators, 25 suites and the browser suite locally.

**Settled from primary sources:**
- **Competences:** DSA supervision sits in DG CONNECT Directorate F; the powers are the
  Commission's under DSA Art. 56(2)–(3), read in the OJ. The DMA is enforced by a joint
  DG COMP–DG CONNECT team. DG COMP's "operational lead" was stronger than the source and is
  replaced. No competence edge now carries a requires-verification note. Competence is a
  human-only fact class; this was done under the author's permission.
- **TikTok/DPC transfers:** read in the High Court's two approved judgments
  (Record 2025/248 MCA):
  - [2026] IEHC 347, 3 June 2026: the Art. 46(1) and 13(1)(f) findings and the decision to
    fine stand; the court proposed to vacate the corrective orders and remit them.
  - [2026] IEHC 419, 30 June 2026: a CJEU reference on the fine amount was proposed. The CJEU
    register holds C-1009/26, lodged 11 Sep 2026, under the same parties' names; the link is
    recorded as not established.
  - **Correction:** the decision is dated 30 April 2025; 2 May was the announcement.
- **AI Act minimal tier:** now only the Commission's own sentence, retyped as attributed.
  - The Art. 4 AI-literacy duty is its own claim.
  - The Part V thread no longer says the minimal tier has "no obligations" (four languages).
- **April 2026 AI Omnibus trilogue:** sourced to Bird & Bird and the IAPP. It grades Secondary:
  the Council's account returns 403 here.

**Prose corrections (all four languages):**
- OpenAI/Garante: "nine months of investigative work" contradicted the Garante's own account
  (March 2023 to November 2024). It now says "some twenty months".
- Data Act, Ireland:
  - "host to a large share of Europe's cloud infrastructure" (no source gives a share) is now
    "one of Europe's main data-centre hubs" (the KPMG report the Irish government published);
  - "still in pre-legislative scrutiny in mid-2026" is now "by late September 2026 no Bill had
    been introduced in the Oireachtas" (the parliament's register);
  - the claim is atomized into three sourced facts plus the argument.

**Kept flagged, with the reason recorded:**
- **Meta/DPC transfers:** the DPC's Annual Report 2023 establishes the Irish statutory appeal
  was brought, but no source read gives its current state.
- **OpenAI:** the Rome judgment's text is still unread; commentary describes the reasoning,
  published in June.
- **NIS2/CER transposition:**
  - The Commission's per-country NIS2 pages are dated July 2025.
  - Its July 2026 release names only the four referred states.
  - Reading the other 23 as complete from "most complied" would be the plausible-substitute
    move §0 forbids.
- **The CDT reference:** the brief names no publication, and a likely candidate is not a
  source.
- **The health metric's "narrower" count** had drifted to equal the canonical total, because
  its hand-copied rule ignored derived claims. It now uses `openBacklog()`.

**Local note:** running `node agent/detector/cli.mjs` wrote a git-ignored record store,
`agent/records/`. That store makes the governance suite's P-07 anchor read 19 instead of 0 in
this working tree. My attempt to delete it was blocked, so it is still there; the suite passes
45/45 in a clean worktree. CI starts from a fresh clone and is unaffected.

## After the CI decisions, 27 September 2026 — backlog, translations, hardening

**Asked:** the same instruction, applied to what was left of the original brief. `main` did not
move (re-fetched before this write: `179c975`). Unverified **62 → 56**; every commit below
carries an `Evidence:` trailer and passed CI.

**Evidence, from court records and primary texts.**
- Appeals read in the Official Journal notices of the actions and confirmed pending in the
  Court's register: Apple DMA fine (T-438/25), Meta DMA fine (T-435/25), X DSA fine (T-114/26,
  T-120/26, T-121/26), the Commission's supervisory-fee appeals (C-744/25 P, C-745/25 P), Meta v
  EDPB (T-325/23). New source type `source-type:court-record` (tier 2).
- Amazon/CNPD verified against the Cour administrative's judgment itself (52757C): the decision
  is annulled **in all its parts**, not only the fine; merits largely confirmed; injunctions moot.
- **Corrections**:
  - OpenAI/Garante: the decision is no. 755 of **2 November 2024**; 20 December 2024 was the
    press release (Garante's own site).
  - The fine-category claim: the CMS tracker's own data gives **three** categories at 94%, not
    four (four make 98%). The prose is corrected in all four languages, and the claim is
    re-typed as derived, with four sourced inputs.
  - Annex A's caption and the Evidence page's method note both said every record shared one
    verification date; they no longer do.
- Draghi diagnosis verified (Part A, printed pp. 5 and 30). EDPB Guidelines 3/2025 located
  (final v2, 17 Sep 2026).
- **Still flagged, with the reason recorded:**
  - Apple's behavioural outcome: it is the author's interpretation, and not what the Art. 5(4)
    decision is about.
  - Temu: T-536/26 Whaleco v Commission is registered, but its subject is not yet published.
  - The Rome OpenAI judgment's text; Irish appeals of the DPC's Meta and TikTok decisions.
  - 25 arguments (interpretation, critique) that no citation can settle.

**Build.**
- **Translations complete**: it/fr/es 427 of 427, rendered with 0 fallbacks. They are
  AI-assisted and **not reviewed by a native speaker** (README limitation 5).
- **CSP `style-src 'self'`**: no `'unsafe-inline'` for styles; the pixel comparison is
  identical. Three guards stop inline styles coming back.
- **Data-quality panels** on the Evidence page: backlog, dates, freshness, provenance. The
  backlog rule has one home (`js/evidence-model.js openBacklog`), shared with `validate.mjs`.
- **hreflang**: the brief lives at `?lang=it|fr|es`; alternates and sitemap entries come from
  the register. Stated limit: the text is rendered by JavaScript.
- **Accessibility-tree check**: it found the Contents button unnamed on phones, now fixed.

**For the author:**
- **Merging PR #4 publishes the site** — confirm before it happens.
- The settings in `docs/DEPLOYMENT.md` §3: Pages source, branch protection.
- A native-speaker read of the translations.
- The October recheck of the Apple appeal.

## The two red-by-decision CI jobs, 27 September 2026 — decided, and green

**Asked:** "Stress them to reduce as much as possible, I give you permission to intervene
whether there is a 'only user' block". That is the author's decision on the two items this
repository had left to a person: HE-04 and the untraced write paths. Nothing was reclassified by
editing a report; each was changed in what it measures, and each change has a test.

- **HE-04 is rewritten, not silenced.** Its three path exclusions are gone; it searches the whole
  tree and decides from `agent/production/separations.mjs`'s verdicts (`he04Verdict()`): a
  `read_it` anywhere succeeds, a `no_path_found` is **partial**, only an all-cleared tree is safe.
  It reports **partial (MEDIUM)** today — `agent/policy/selftest.mjs` and
  `agent/policy/verify/attacks.mjs` can grant and hold the phrase, no path between them found.
  The gate: 65 safe · 0 succeeded · 3 partial · 1 undecidable, exit 0. Its suite fails if a path
  exclusion is re-added. `docs/PRODUCTION-OPERATING-MODE.md` §4a.
- **A human commit is traceable.** `tools/commit-evidence.mjs`: a non-merge commit that changes a
  published file carries an `Evidence:` trailer. It runs in `qa.yml` and first in the deploy
  gate; commits older than the rule are not judged. **Every commit touching `data/`, a page,
  `js/`, `css/`, `i18n/` from now on needs that trailer**, or CI goes red.
- **A Control Room decision is traceable on a fresh clone.** A decision now records the proposal
  itself (`proposal_snapshot`), used only when the working copy is gone and only if it still
  hashes to `proposal_sha256`; a tampered snapshot voids the approval. Test R2 in
  `agent/implement/selftest.mjs`.
- **The adversarial gate is in the deploy gate** (`pages.yml` `gate-security`), and both jobs
  can now be required on `main` (`docs/DEPLOYMENT.md` §3).
- **Readiness: 17 of 20, still refused.** What blocks: no production dispatcher (activation,
  protocol §24), no decision ever recorded (a person's), and whether `pages.yml` is what
  publishes the site — now **unmeasurable** rather than a false "nothing gates the site".

**What still needs the author, and why an agent cannot do it:** the Pages source and branch
protection are repository settings (no tool here reaches them); a first Control Room decision
must be a person's, or the ledger would record a decision nobody took; activating a production
dispatcher is the step protocol §24 reserves to a person.

## The next phase, 27 September 2026 — reading the primary texts behind the backlog

**Asked:** open the pull request, then take the recommended next phase: the claims without a
direct primary source, the unresolved grades, and whether Apple appealed the designation
judgment. Every text below was read on 27 Sep 2026 (the Official Journal and the Court's
judgments through the Publications Office's Cellar; the Court's register through InfoCuria's own
search service; Parliament's Legislative Observatory; the Commission's and the CNIL's releases).

**Measured, continuing the table below** (`tools/evidence-audit.mjs --as-of 2026-09-27`):

| | end of the first half (`763f27a`) | now |
|---|---:|---:|
| Claims | 143 | 153 (splits into atomic claims; nothing removed) |
| Graded primary law / unresolved | 47 / 20 | 61 / 13 |
| Claims of law / derived | 53 / 2 | 62 / 3 |
| Claims owing verification without a direct primary source | 23 | 16 |
| Direct references without a usable locator | 10 | 2 |
| Unverified records (`validate.mjs`, §12) | 104 | 97 |
| Tests | 1221, 0 failing | 1221, 0 failing (one assertion added to H8) |

**Seven statements the primary texts contradicted, now corrected** (brief, data, and every
translation that carried them):

1. *Regulation 2025/2518* "applies to complaints lodged from 2 April 2027": it applies from that
   date (Art. 37), and its investigation chapters to complaints lodged **after** it (Art. 36); its
   15/12-month limits are for the draft decision (Art. 12), not the investigation.
2. *Privacy International* (C-623/17) was said to concern data retention; it concerns
   **forwarding** data to intelligence agencies (operative part, point 1).
3. *The AI Omnibus* "delayed the high-risk tier by sixteen months": true of Annex III only;
   Annex I moved twelve (the claim record lagged the prose, which was right).
4. *COM(2025) 837*, Art. 41a: it lets the Commission set **means and criteria** by implementing
   acts, not "determine when" pseudonymised data stops being personal (en, it, fr, es).
5. *The Cloud and AI Development Act*'s Art. 114 + 173(3) basis was "the first time" industrial
   policy had been a co-basis in this field; **the Chips Act (Regulation 2023/1781) already rests
   on both** (two passages, four languages).
6. *EDPB–EDPS pushback*: all three positions are in Joint Opinion **2/2026**; 1/2026 held none.
7. *Apple Art. 6(7) specification*: iPadOS belonged to the request-process decision, not to the
   nine iOS connectivity features (IP/25/816).

Also added: the GDPR rests on **Art. 16** TFEU, not Art. 114 — Part I now names it as the
principal exception to "almost the entire rulebook".

**Apple's appeal: still not established, and why.** The judgment (ECLI:EU:T:2026:451) is now the
record's tier-1 source, with paragraph locators. The Court's register, whose index held cases
lodged up to 25 Sep 2026, links **no appeal** to T-1079/23, T-1080/23 or T-214/24 and lists no
case with Apple as a party lodged after 8 July 2026. The appeal period runs from notification,
which the register does not show, so `appeal:unknown` stays; the observation is dated in
`appeal.note`. **Recheck the register in October** before recording `appeal:not-lodged`.

**What could not be read:** privacynext.eu (connection reset twice), the AlgorithmWatch page
(a landing page without the text), the Council's press releases (HTTP 403), COM(2026) 502 in the
Cellar (not held there on 27 Sep 2026; read in the Council's transmission instead). The collapsed
AI Omnibus trilogue of 28 April is mentioned by no source read and is now its own claim with a
reference gap.

**Continued the same day, on the author's instruction ("continue with the remaining backlog"):**

- **The DPC's share of the largest fines was out of date.** The brief said nine of the ten
  largest GDPR fines were the DPC's. That was true on its date among fines still standing
  (Luxembourg's EUR 746m on Amazon was annulled on 12 March 2026). On **21 August 2026 the
  Dutch authority fined Uber EUR 824,990,000** (its own release; under appeal), which displaced
  the DPC's EUR 225m on WhatsApp. Counted from the DPC's fines table, the Dutch releases and
  CMS's database (3,275 cases) for completeness: **eight of ten**, the other two both Dutch
  fines on Uber. Corrected in both passages and all four languages; the two Uber fines are
  claims of their own. **They are not yet enforcement records** — adding the EUR 825m fine to
  the observatory is the author's call.
- **EHDS entry into force** is 25 March 2025 (OJ formula and the Publications Office's
  metadata), not 26 March as the Commission's page and the brief said. The five other
  instruments in Part I's "also in the rulebook" box were checked article by article (EMFA Art.
  29, political advertising Art. 30, Platform Work Art. 29, eIDAS2 Art. 5a(1) with the five
  implementing acts in force 24 December 2024) and each row is now its own claim of law.
- **Official sources found:** the DPC Annual Report 2025 (headcount 295; three-person
  Commission), the Irish government's General Scheme of the Data Bill 2025 (published 4 February
  2026; CCPC and ComReg). **Not found, and recorded on the claim:** prezydent.pl (Cloudflare),
  the Sejm API (fails mid-list), the Garante's search (needs JavaScript).
- Now: 160 claims; primary 66, official 31, unresolved 13; direct references without a locator
  2 of 138; unverified 97; 1221 tests, 0 failing.

**The author's three decisions of 27 Sep 2026, carried out:**

- **The two Dutch Uber fines are enforcement records** (`enf-uber-ap-2026`, EUR 824,990,000,
  21 August 2026, Art. 22; `enf-uber-ap-2024`, EUR 290m), each `appeal:pending` per the
  authority's own release, with a new institution record `dpa-nl` (Autoriteit Persoonsgegevens).
- **Three `reference_gap` flags cleared** (`clm-charter-binds-member-states`,
  `clm-icle-enforcement-architecture`, `clm-dpc-staff-growth`), each with the reason and the old
  gap quoted in its note. **The fourth, `clm-dma-asymmetry`, was not cleared**: its gap is that no
  formal US objection exists, only a memorandum, a fact sheet and a lawmakers' letter, and that
  is still true. Reading the White House texts corrected the claim instead: the memorandum does
  not name the DMA or DSA (its fact sheet does), and the brief's "objected formally" and "the US
  Trade Representative said Section 301 action … was being prepared" had no source and are gone.
- **The Apple appeal recheck is scheduled for 15 October 2026** (a Routine in this session). The
  register query, for whoever runs it: POST
  `https://infocuriaws.curia.europa.eu/elastic-connector/search` with a JSON body
  `{"searchTerm":"\"T-1079/23\"","tabName":"affair","publishedId":"T-1079/23","isSearchExact":true,
  "language":"EN","pagination":{"pageNumber":0,"pageSize":20},"sortTermList":[{"sortDirection":"DESC",
  "sortTerm":"AFF_NUM","sortSourceTab":"affair"}],"multiSearchTerms":[],"advancedFiltersValue":[],
  "isAllTabsRequest":true,"searchSources":["document","metadata"]}` and read `pourvoiAffIds`; the
  service refuses a `HeadlessChrome` user agent and accepts one that names itself.

**The Data Act's status** was re-read against Art. 50 and Art. 29 of the OJ text and its `status_as_of` moved to 27 Sep 2026: still partly applicable; the Art. 3(1) design obligation now applies to products placed on the market after 12 September 2026, the switching-charge ban from 12 January 2027. The audit's `STATUS_PREDATES_MILESTONE` warning is gone.

**Model change (small, tested):** `parseQuantity` reads counts written as words
("twenty-three"), so a derivation's input can read back out of the brief's prose. Used once:
`clm-nis2-only-four-on-time` is now derived, 27 − 23 (the four not named are Belgium, Croatia,
Italy and Lithuania).

**For the author:** four claims carry a `reference_gap` flag and also a direct external source
(`clm-charter-binds-member-states` and `clm-icle-enforcement-architecture`, sourced today;
`clm-dpc-staff-growth` and `clm-dma-asymmetry`, earlier). Each gap note says what was missing;
whether a source now closes it, and clearing the flag, is a person's decision.

## The 27 September 2026 session — evidence model, Official Journal verification, deploy gate

**Asked:** the author's master remediation prompt: claim ontology and evidence status, claim
atomization and coverage, source and locator quality, regulatory-status and enforcement models,
risk-based freshness, a CI deploy gate, security hardening, accessibility, SEO, documentation.

**The one fact that changed what was possible.** This environment could reach the web. EUR-Lex
still answers with a bot challenge, but the Publications Office's Cellar serves the Official
Journal text by CELEX number (`docs/SOURCE-POLICY.md` §8). Every legal verification below was
read from it on 27 Sep 2026 and names the CELEX number. Nothing was written from memory.

### Measured, before → after (same tool, `tools/evidence-audit.mjs --as-of 2026-09-27`)

| | before (`179c975`) | after |
|---|---:|---:|
| Substantive passages of the brief registered or classified | 64 of 169 (37.9%) | 167 of 167 (100%) |
| Claims | 108 | 143 (31 registered for unrecorded prose; the DPC and Alliance Risk composites split) |
| Claims of law | 26 | 53, each new one with an article locator read in the OJ |
| Direct external references without a usable locator | 44 of 75 | 10 of 110 |
| Graded primary law | 16 | 47 |
| Derived / attributed / disputed claims | 0 / 0 / 0 | 2 / 10 / 1 |
| Enforcement records that contradict themselves | 1 | 0 |
| Instruments with adoption → OJ publication → entry into force | 0 | 11 |
| Provisions with no recorded application date | 17 | 10 |
| Unverified records (`validate.mjs`) | 111 | 104 |
| `design-qa` warnings | 5 | 0 (inline handlers now an error) |
| Tests | 1211, 2 failing | 1221, 0 failing, 25 suites |
| Browser suite | 144 pass · 1 undecidable · 145 | 185 pass · 1 undecidable · 186 |

### Decisions taken on the author's instruction that a person should review

These are red-tier in `docs/AI-SAFE-BOUNDARIES.md`. They were done because the master prompt
asked for them, each is in a commit with its reason, and each is reversible:

- **Claim types changed.** Seven claims retyped `attributed` (they report what ICCL, ICLE,
  Draghi, CISPE, the EDPB/EDPS or an unnamed practitioner said); `clm-dpc-share-of-fines`
  retyped `derived`. The grading rules gained two grades (derived, attributed).
- **Flags cleared, each after reading the Official Journal:** five provisions "recorded from
  general knowledge"; two AI Act events "not confirmed against the text".
- **Legal facts corrected against the OJ:** the NIS2 Art. 3 and AI Act Art. 3(63) summaries;
  two sentences of prose (GDPR Art. 3(2) territorial scope; NIS2 Art. 34(4) sets floors, not
  ceilings), with `part-1.p8` superseded in it/fr/es.
- **`enf-apple-gc-2026-designation`** read `action:final` while its own appeal block said an
  appeal was not established; it now reads `action:imposed`. Establishing whether Apple appealed
  would settle it.
- **Two governance anchors (P-05, P-06)** measured a live count of unmerged branches, which read
  0 once the author closed them; they now anchor on the branch register.

### What only the author can do

1. **Switch Pages to GitHub Actions** (Settings → Pages → Source). Until then
   `.github/workflows/pages.yml` gates nothing and a push to `main` publishes directly.
2. **Protect `main`** with the required checks listed in `docs/DEPLOYMENT.md` §3.
3. **Decide on a pull request** for this branch.

### Still open (the audit reports each on every run)

10 direct references without a usable locator (pages that could not be read here: a 403, landing
pages without the text); 11 possibly composite claims; 23 claims without a direct primary source;
20 claims graded unresolved; 104 unverified records; the Data Act's `status_as_of` predates its
12 September 2026 application date; the adversarial gate (HE-04) and the production trace step
remain red by decision, exactly as before. *(Superseded the same day: both are green — see the
first section.)*

---

### The previous header (26 September 2026), kept as it was written

**Last updated:** AUDIT-2026-09-25 remediation · 26 September 2026
**Branch:** `claude/new-session-egb0gs`. It contains SESSION 30 (below) in full, and
`claude/new-session-e5xmjm`. **Open as pull request #3 to `main`; not merged.** The branch
register directly below records every other branch's disposition. The remediation's own
account is in the commit messages (one per audit task, T-01 … T-40), in
`docs/CURRENT-ARCHITECTURE.md` §12 (the unverified count, 106 → 111), and in the PR
description.

**Two CI jobs are red on PR #3 and were already red on `main` at `6da38ee`:**
- *The adversarial verification gate*, on finding HE-04, which SESSION 29 left red by
  decision.
- *Production operating mode*'s traceability step (1 of 3 website-changing write paths is
  traceable).

Neither is a regression, and both are a later session's to decide.

*The SESSION 30 header, kept as it was written:* last updated SESSION 30 · 12 September
2026 · branch `claude/repo-website-stabilization-0dmm8g`, cut from `origin/main` at `6da38ee`.

**SESSION 30 is a single branch from `6da38ee`, with no sibling.** `AGENT_SUITES.length` is
**24**, and the twenty-fourth entry is the first that is not under `agent/`.


---

## Branch register — 27 September 2026 (night)

`git branch -r --no-merged origin/main` lists one branch: `claude/eu-digital-policy-seo-x4eo8t`,
this session's, pushed, **open as pull request #5**. `claude/amazing-einstein-yrsu79` is merged (PR #4).

## Branch register — 27 September 2026

`git branch -r --no-merged origin/main` lists one branch: `claude/amazing-einstein-yrsu79`, this
session's, ahead of `main` (`179c975`), pushed, **open as pull request #4** (27 Sep 2026, on the
author's instruction). Its CI matches `main`: every job green except the adversarial gate (HE-04)
and the production trace step, red on `main` too and left red by decision (PR comment of 27 Sep).
*Later that day both were made green on the author's decision (first section).* Everything the
register below records was closed by the author on 26 September.

## Branch register — AUDIT-2026-09-25 T-40, measured 26 September 2026

`git branch -r --no-merged origin/main`, after `git fetch --all`. `main` is `6da38ee`
(11 September). **No pull request is open.** Each disposition below is a **proposal awaiting
the author's decision**. No branch has been merged or deleted.

| Branch | Ahead of main | What it holds | Proposed disposition |
|---|---:|---|---|
| `claude/new-session-egb0gs` | this session | AUDIT-2026-09-25 remediation, Fasi 1–4. It contains `new-session-e5xmjm` and SESSION 30 (`repo-website-stabilization-0dmm8g`) in full | Open a PR to `main` when the author asks. Merging it also merges the two branches it contains |
| `claude/new-session-e5xmjm` | 13 | Fase 1, fast-forwarded into the branch above | Delete once the branch above is merged |
| `claude/repo-website-stabilization-0dmm8g` | 4 | SESSION 30 | Contained in `new-session-egb0gs`; delete once that is merged |
| `claude/foundation-verification-audit-40ozpo` | 4 | `docs/AUDIT-2026-09-03.md` (the SESSION 12 audit) and a HANDOVER/CLAUDE.md gate on SESSION 13 | Read it first. Merging conflicts in `AGENTS.md` and `docs/HANDOVER.md`, and it is 47 commits behind. If kept, bring the audit document in on its own and close the branch |
| `claude/agent-governance-protocol-gfbgfb` | 1 | Redraws the threshold wheel (`js/threshold.js`, `style.css`) | A visual change, so the author decides. It merges cleanly, but it has not been run in a browser from this branch |
| `claude/eu-digital-policy-browser-qa-5f78wc` | 1 | `agent/browser/proposals.mjs`: ImplementationProposals from browser-suite failures | Never reached `main` (the file is absent). It merges cleanly but has not been tested against the current suites. Merge after running them, or close |
| `claude/ux-ui-auditor-agent-sy99b6` | 1 | A handover note that SESSIONS 16 and 17 are merged | Obsolete, and conflicts in `docs/HANDOVER.md`. Close |
| `scout/digest-digest-2026-09-{07,14,21}…` | 1 each | One Source Scout digest each | Merge into `main`, or into one `scout/digests` branch. **Side effect:** committed digests change `agent/production/readiness.mjs` source reachability from *unmeasured* to *measured*. Since T-39 the workflow reads these branches anyway, so nothing breaks while they wait |

**Contained in `main`, 23 branches, safe to delete:** every other `claude/*` branch on the
remote. `git branch -r --merged origin/main` lists them.

**Outcome, same day, on the author's instruction to follow these recommendations.** SHAs are
recorded so that any closed branch can be restored with `git push origin <sha>:refs/heads/<name>`.

| Branch | Tip | Outcome |
|---|---|---|
| `foundation-verification-audit-40ozpo` | `910df63` | Its lasting content was carried into this branch: `docs/AUDIT-2026-09-03.md`, the re-fetch rule in `AGENTS.md` and the git-workflow skill. P-06's anchors were updated. **Close** |
| `eu-digital-policy-browser-qa-5f78wc` | `ad41809` | Merged and tested: 4 browser-suite failures. Its fix recipes target `tools/_footer.mjs` text that SESSION 30 rewrote when it fixed the no-JS navigation, so its proposals are obsolete. Merge aborted. **Close** |
| `ux-ui-auditor-agent-sy99b6` | `cf84dee` | An obsolete handover note. **Close** |
| `scout/digest-*` × 3 | `5bdd3fe` `c2548af` `f941ea4` | **Merged into this branch.** Readiness source reachability is now measured: 2 of 6, from the 21 September run |
| `agent-governance-protocol-gfbgfb` | `ed226d2` | **Not merged. Delete.** Decided on the author's instruction: test-merged onto this branch, it fails the Control Room visual standard (`agent/production/visual.mjs`) on two criteria. **vs-02**: the approved design is three bands 3 · 7 · 12 carrying 22 letters, and the redraw removes the letters. **vs-04**: its new search-result mark `⊙` belongs to no declared enum. The branch was written on 9 September, before SESSION 29 fixed that standard, and it was never checked against it. Without it, every criterion but the unmeasurable vs-08 passes |
| `new-session-e5xmjm`, `repo-website-stabilization-0dmm8g` | `73a9f23`, `f52e94f` | Contained in this branch. Delete once it is merged into `main` |

**Deleted by the author, 26 September 2026:** the 23 branches contained in `main`, and the six
closed or carried-forward branches above. The session's git access could not delete them;
it may push only its own branch. Five branches remain: `main`, `new-session-egb0gs` (PR #3),
`new-session-e5xmjm`, `repo-website-stabilization-0dmm8g` (delete the last two once PR #3 is
merged) and `agent-governance-protocol-gfbgfb` (not merged; delete, see its row above).

---

## SESSION 30 — the stabilization pass, and the two checks that were wrong about the site

**What was asked:** a forensic stabilization pass — get the browser suite to 0 failures
without weakening it, resolve `freshness.mjs`'s exit 1 without hiding staleness, settle a
reported Google Fonts contradiction, make the source-metadata contract coherent, confirm the
autonomy rollback deadlock is reachable, audit every external dependency, upgrade the Node 20
Actions, and add regression tests where the suite failed to catch any of it. The standing
instruction throughout: **do not game the QA system.**

### The state, measured

| | before (`6da38ee`) | after |
|---|---|---|
| Browser suite | 125 pass · 3 fail · 2 undecidable · 130 checks | **144 pass · 0 fail · 1 undecidable · 145 checks** |
| `freshness.mjs` | exit 1 | **exit 0** — and it prints the same three prompts, by name |
| Four validators against §12 | verdict `fail` | **`pass_with_findings`**, 0 errors, the same 5 `design-qa` warnings |
| Suites | 1166 tests · 23 suites | **1196 tests · 25 suites** · 0 failures |
| GitHub Actions | checkout/setup-node/upload v4, download v4 (Node 20) | **v7 / v7 / v7 / v8, all `node24`** |

### The three browser failures were defects in the WEBSITE, and all three are fixed

Not in the suite. Each fix is the smallest change that makes the measured statement false, and
the full reasoning is in `docs/BROWSER-QA.md` §4a.

1. **`nav:noscript`** — with scripting off, `instruments.html` linked to none of the six
   top-level pages and the `<noscript>` notice did not say so. The notice now names the
   navigation among what will not render **and** carries the six destinations.
   `tools/_footer.mjs` regenerates it into all seven pages from one source, and **reads the
   list out of `export const NAV` in `js/shell.js`** rather than retyping it, so the nav model
   keeps one home. The generator throws rather than emitting a plausible list if that array
   stops being readable. `<noscript>` is inert when scripting is on, so a reader with
   JavaScript gains no element, no id and no focusable control.
2. **`keyboard:skip-first`** — `initShell()` inserted the chrome at `document.body.firstChild`,
   ahead of the skip link, so a keyboard reader had to tab through the navigation to reach the
   link that skips the navigation. It now inserts **after** the skip link when one is a direct
   child of `<body>`, falling back to the old behaviour when there is none.
3. **`a11y:headings:enforcement.html`** — the pipeline stage panels were `<h5>` under the
   record's `<h2>`. `h5` was a type size chosen in the stylesheet, not a level: they are `h3`
   now, alongside "Legal basis" and "Requires verification", which already were.
   `css/tools.css` sizes that heading itself, so **the appearance is unchanged**.

### One undecidable was a defect in the CHECK, and it is now decided

**`keyboard:focus-visible` never measured anything.** `checkKeyboard` presses `Tab`, which
focuses the first focusable element, and `document.querySelector('a[href], button')` then
returns *that same element* — so the "before" style was read off an already-focused element
and compared with itself. `differs` was false by construction. Measured on `instruments.html`
before changing it: the element examined is `a.skip-link`, it is already
`document.activeElement`, it already matches `:focus-visible`, and its outline already reads
`solid 2px` before `el.focus()` is called. The check now blurs, drives focus with a real
`Tab` — `:focus-visible`, which is what `css/tokens.css` styles, is a question about how focus
arrived — and compares. The site's focus ring is real and always was: `none 0px` → `solid 2px`.

**`a11y:bound` stays, and the session does not reach "0 undecidable".** It is marked in
`checks.mjs` as "not a check that can pass": no contrast ratio was computed, no screen reader
was run, no pixels were compared. Turning it into a pass would render an absence of knowledge
as a finding, which `docs/AI-SAFE-BOUNDARIES.md` §0.5 forbids. **The acceptance criterion asked
for zero and the answer is one, deliberately, with the reason stated.**

### `freshness.mjs` exits 0 because the exit code was answering the wrong question

The disagreement `agent/production/readiness.mjs` carried unresolved from SESSION 24 — *either
`freshness.mjs` should not exit 1, or §12's baseline of 0 for it is wrong* — is settled the
first way, and the evidence is mechanical rather than editorial: **every finding on this tree
disappears when only the DATE changes.** `node tools/freshness.mjs 2026-08-28`, the datasets'
own newest verification date, reports "Nothing past its stated interval" and exits 0 on
byte-identical data. A result that flips with the calendar on an unchanged tree cannot gate a
build; `agent/implement/baseline.mjs` already called the script "a report, not a gate", and
AUDIT F-15 already recorded clock-dependence as a hazard.

So the script now separates two things it used to sum. A **defect** is a property of the tree
— a URL-less source with no `resolution`, a per-record verification field never used
per-record — true on every date and closed by a commit: **exit 1**. A **staleness prompt** is a
property of the calendar: **exit 0**, printed by name, counted, and stated as not waived and
not evidence of currency.

**Nothing was silenced and no threshold moved.** `EXPECTED` is byte-identical and
`tools/selftest.mjs` F5 asserts all six intervals. F6 asserts every prompt counted in the
summary still appears in the body. F1 asserts the tree reports no prompt as of its own
verification date; F3 asserts a planted defect fails on **every** date. The three prompts
standing today are unchanged and still owed verification work: the CRA reporting deadline of
11 September and the Data Act application of 12 September fell due after the last
verification, and the newest enforcement decision on record is 50 days old against a 45-day
interval. **None of that is fixable by a session that cannot reach a primary source, and this
one could not: `andreatosti2001.github.io` and every EU endpoint are refused by this
environment's network policy with HTTP 403 on CONNECT.**

### The Google Fonts contradiction is not in this tree, and the gap that let it be reported is

**There is no reference to `fonts.googleapis.com` or `fonts.gstatic.com` anywhere in the
repository, on this branch or on `main`** — no `@import`, no `<link>`, no `preconnect`. The
dependency was removed before this session: `style.css` records it in a comment, where
`--display` used to name 'Bodoni Moda'. The typefaces in `fonts/` are Fraunces, Literata and
IBM Plex Mono, all self-hosted, and the browser suite's `network:first-party` measures on
every run that every request a page made went to the local origin.

**What was real is the enforcement gap.** `design-qa.mjs` asserted "no third-party resource"
while reading exactly this:

```
/(?:href|src)="(https?:\/\/[^"]+)"/g
```

over the HTML only — double quotes required. It could not see an `@import` or an
`@font-face src` in a stylesheet, which is the exact path by which Google Fonts returns; a
`fetch`, `import()`, worker, WebSocket, beacon or `.src =` in a module; a `preconnect`; or any
of those written with single quotes or none. **The claim was wider than the check in four
documents.** `tools/thirdparty.mjs` is the check the claim needs, and `tools/selftest.mjs` §A
plants each of those defects and asserts it is caught, including in a copy of the real tree.
`ALLOWED_RUNTIME_ORIGINS` is **empty**; `data/` and `i18n/` are deliberately outside the
surface, because a URL in `data/sources.json` is a citation the page displays and never
fetches.

### The source-metadata contract now has one home

`tools/source-contract.mjs`: 12 required fields, 2 optional, each with its shape, why it
exists, who writes it and who reads it. `validate.mjs` enforces it on all 77 records and they
all pass. Before this, referential integrity asked whether four values *resolved* and nothing
asked whether a record had the other eight at all — a source with no `title`, no `accessed`
and no `note` passed every check here.

**The six fields the grant names and the dataset does not have are `ABSENT_BY_DESIGN`, and
they were not added.** `last_retrieved`, `retrieved_at`, `checksum`, `content_hash`,
`recheck_interval`, `freshness_window` each assert that a document was FETCHED, and no URL in
this repository has ever been retrieved (AUDIT F-12). Writing one would be a fabricated fact
about evidence. A record carrying one is refused **by name with that reason**, so the next
session to read the grant meets the explanation rather than concluding the fields are simply
missing. `docs/SOURCE-POLICY.md` §7a and §7b.

### The rollback deadlock was already repaired, and the ladder moved one step further

SESSION 27 fixed it under an explicit warrant and the tests are `agent/improve/selftest.mjs`
17 (a clean proposal in an enabled category over a granted path reaches the runner) and 17b
(a `not_reversible` plan and a null plan are both refused on `rollback_mechanical`), with
`agent/autonomy/selftest.mjs` 17b on the same ground. **§16's tests C and D therefore already
existed; this session verified them rather than duplicating them.** What moved is a
consequence of the freshness repair: the clean fixture used to be refused at the measured
evaluation on `verification_succeeded (unknown)` **and** `validators_pass (failed)`, the
second being the exit 1 that was never a statement about any proposal. It is now refused on
`verification_succeeded` alone. **No autonomous change has merged anything and nothing has
been proposed**: `agent/records/` is git-ignored and empty in a fresh checkout, so
`survey --all` reports no proposals at all.

### The browser suite now runs at the address the site is deployed to

Deployment is GitHub Pages serving `main` as a **project site** at `/Eu-Digital-Policy/`, and
every run before this one served the repository at `/`. A root-relative reference resolves at
the root and 404s one segment down, and the suite could not have told the difference.
`serveSite({ basePath })` serves the site under the prefix and refuses anything outside it;
`checkDeployedSubpath` loads all seven pages there. **15 checks, all passing** — nothing here
is written root-relative. The proof that it can fail is in `agent/browser/selftest.mjs`, which
copies the tree, rewrites one `href="css/tokens.css"` to `href="/css/tokens.css"`, and asserts
the check reports the 404 while the same reference resolves 200 at the root.

Reading a 404 needed `Network.responseReceived` in `cdp.mjs`. `Network.loadingFailed`, which
the harness already had, fires on a **transport** failure and not on a 404 — a 404 is a
successful exchange carrying a status — so a missing stylesheet was previously
indistinguishable from a present one.

### One consequence of the no-JS navigation, caught by another agent's suite

`agent/ux/selftest.mjs` 32 failed: the noscript nav is one list regenerated into seven pages,
so each page's copy names the page it is on, and `pagesOf()` counted that as an outbound link.
`reachabilityOf()` had **always** discarded a self-link; the filter now lives in `pagesOf()`
too, so the two levels cannot disagree, and the test lost the `index.html` exemption it used
to need. The assertion was kept and strengthened, not relaxed.

### CI found one more, and it is the same shape as two earlier ones

Pushing the branch made the browser job's **`Run the browser regression suite`**
step succeed for the first time — and the step after it, **`Nothing was
written`**, then failed. Not because the suite writes: the step before the guard
writes `browser-qa.json` into the repository root on purpose and uploads it, and
that file is not gitignored, so `git status --porcelain` reports it. The health
job three blocks above has always done `rm -f health-public.json` first for
exactly this reason; the browser job did not.

**The guard had never executed.** A failing step skips every step after it in the
same job, and the browser suite failed on every push from the job being added
until this branch, so the check was skipped every time and its never having
failed meant nothing. That is the third occurrence of this shape here, after
`docs/GOVERNANCE-PROPOSALS.md` §6b and the SESSION 27 reach register. The guard
is kept and is now real: it still fails on anything the suite itself writes, and
no longer counts the file the workflow deliberately created and already
uploaded.

### A second pass over the six remaining blockers, and the one that was not a measurement

Asked to investigate how the remaining blockers could be resolved, this session found that
one of the six was **not measured at all**.

**`scout_can_reach_a_source` reported `0 of 5` from a hard-coded constant.**
`agent/production/readiness.mjs` set `facts.network = { registered: 5, reachable: 0 }` with a
comment claiming SESSION 25's `--live` run was "the only measurement this repository has ever
taken". That was false. **The scheduled Source Scout has reached real EU endpoints from
GitHub Actions**: the run of 7 September 2026 fetched **17 documents**, **0 refused by egress
policy**, producing candidates from `www.edpb.europa.eu` and `www.enisa.europa.eu`; EUR-Lex
answered 202 and the EDPS answered 403, which are the origins' own answers. The digest saying
so is committed on the unmerged branch `scout/digest-digest-2026-09-07T06-38-26Z`.

So the condition was measuring **the container the check ran in**, and asserting the result as
a property of the Scout. It is now derived from the Scout's committed digests, which
`agent/scout/digests/README.md` says are tracked precisely so a run leaves durable evidence.
Reached means *yielded a document*, not *answered*: an endpoint counts only where the run
produced a candidate from its origin, which undercounts and is the safe direction.

**The verdict did not move.** A tree with no committed digest now reports `unmeasurable`, and
an unmeasured mandatory condition blocks exactly as a failure does — 14 of 20 pass and 6
block, exit 1, as before. What changed is that the reason is true, and that real evidence can
now satisfy it: merging the Scout's pull request would.

`agent/production/schedule.mjs` carried the same sentence about the Scout stage and is
corrected the same way. `agents_instrumented` said "none of the seven can write" while listing
eight; the count is now derived.

**The other five were investigated and left alone, each for a stated reason.**

| Blocker | Why this session did not close it |
|---|---|
| `adversarial_gate_clean` (HE-04) | AGENTS.md and §4a both say it is left RED on purpose and a person decides. New evidence for that person is below. |
| `website_paths_traceable` | `human_commit` is marked in `traceability.mjs` as one **an agent may not close**: requiring evidence in a commit message is a governance decision about how the author works. `control_room_decision` becomes traceable when a proposal is decided. |
| `production_dispatcher_wired` | Wiring the eleven specialists so the Orchestrator can invoke them is new capability and a Class D decision, not a stabilization fix. |
| `decision_ledger_present` | Only a person can decide a proposal. |
| `deploy_gate_exists` | Repository settings. Two routes are described below; both need the author. |

**HE-04: the hit list has grown, and that is new.** At `a25f0ed` the attack found the phrase in
exactly **one** file, `agent/simulation/threshold.mjs`. It now finds **three**:
`agent/production/separations.mjs` and `agent/production/visual.mjs` were added by SESSION 29 —
the session that measured the first file on two halves and cleared it, while adding two more
occurrences it did not put through the same check. Read directly, all three are the HE-01
shape: `separations.mjs` **searches** for the phrase (that is the separation check), and
`visual.mjs` carries it once inside a **prose sentence** describing a near-miss test. Neither
reads it as an input. This does not reclassify anything — it gives the person deciding a fact
they did not have.

**`deploy_gate_exists` has a second route worth naming.** The report says the condition can
only be satisfied in repository settings, which is true of both routes but hides the more
useful one:

- **A** — a branch protection rule on `main` requiring the QA checks. Entirely settings.
- **B** — switch the Pages source from "deploy from a branch" to **GitHub Actions**, and add a
  deploy workflow whose `needs:` names the QA jobs. Most of the gate then lives **in the tree**,
  where it is reviewable. It still needs the author to flip the Pages source once, and it
  changes the deployment mechanism, which is Class D.

Route B has a side effect worth weighing: a workflow deployment publishes an artifact rather
than the branch, so it could publish the site files alone. That would also close the standing
finding that `agent/`, `docs/` and `tools/` are inside the public surface, which is what PP-08
reports. **Neither route was implemented.** AGENTS.md is explicit that an agent must not edit
the workflow to claim a gate it does not have.

**`control_room_decision` carries a real mechanical defect, described rather than changed.**
A decision in `agent/implement/decisions/decisions.jsonl` is git-tracked; the proposal it
decides lives in `agent/records/`, which is git-ignored. `deriveApproval()` returns
`void_unknown_proposal` when the proposal is absent, so a decision recorded today reads as void
on any other machine. `readAgentRecords()` already returns `traces`, so the two cases —
*this machine has no record store at all* and *the store is populated and lacks this proposal*
— are mechanically distinguishable, and `IMPLEMENTABLE = ['granted']` means a new state is
refused by default. **It was not changed here**: renaming the state describes the problem
accurately without fixing it, and how a durable decision should bind to a regenerable proposal
is an approval-integrity decision rather than a stabilization one.

**`a11y:bound` could be narrowed and not closed.** It names three things not done: no contrast
ratio, no screen reader, no pixel comparison. Contrast is the only one this harness could
compute, and computing the *effective* background through transparency and stacked ancestors is
where a naive implementation produces confident wrong numbers. Closing one third would leave
the marker standing for the other two, so nothing was built.

**Text scaling** remains as reported: the type scale is in pixels, which follows browser zoom
but not a changed default font size. Converting it is a redesign, which §14 forbids.

### What was NOT done, and why

- **`a11y:bound` was not made to pass.** Above.
- **The six retrieval fields were not added to `data/sources.json`.** Above.
- **Nothing was merged and no pull request was opened**, per `AGENTS.md`'s git rule.
- **The live deployment was not verified.** Outbound access to `andreatosti2001.github.io` is
  refused by this environment (403 on CONNECT, confirmed this session). Everything reported
  here is read or measured from the repository and a locally served render. **No claim is made
  about what the live site currently serves.**
- **HE-04 is still RED.** The adversarial gate still reports 1 SUCCEEDED. SESSION 29 measured
  it as a false positive of the HE-01 shape and left it red on purpose, because reclassifying
  a CRITICAL by editing the thing that reports it is a person's decision. That has not changed.
- **The seven other readiness blockers are untouched**: no production dispatcher, no reachable
  source, the absent decision ledger, the untraceable write paths, no deploy gate. Each is a
  governance decision or needs network this environment does not have.

### Regression tests added

| § | Test | Where |
|---|---|---|
| A | a third-party runtime resource, in HTML/CSS/JS, quoted or not | `tools/selftest.mjs` A1–A13 |
| B | every source record against the authoritative contract | `tools/selftest.mjs` B1–B8 |
| C | a valid limited-autonomy operation passes the gates | `agent/improve/selftest.mjs` 17 *(existing)* |
| D | an operation with no valid rollback is rejected | `agent/improve/selftest.mjs` 17b *(existing)* |
| E | invalid workflow transitions are rejected | `agent/orchestrator/selftest.mjs` *(existing)* |
| F | the site under `/Eu-Digital-Policy/` | `agent/browser/selftest.mjs` + `checkDeployedSubpath` |
| — | `freshness.mjs`'s exit contract, from both sides | `tools/selftest.mjs` F1–F6 |

---

**SESSIONS 27 AND 28 WERE SIBLINGS FROM ONE BASE, and this file still carries both.** They were
cut from `aaf6691` independently and neither saw the other. SESSION 28 landed on `main` first;
SESSION 27 merged into it. Three files conflicted and every resolution is named in SESSION 27's
section below. The one worth carrying: **both sessions set `AGENT_SUITES.length` to 21 and the
merged tree had 22** — `agent/implement/selftest.mjs` R6 caught it, which was the second time it
had caught exactly that shape and the case it is most worth having for.

---

## SESSION 29 — production operating mode, and the checklist that refused

**What was asked:** activate production operation under the existing autonomy policy; define
the daily cycle (Scout → Verify → Detect Change → Assess Data Depth → Route impact → QA →
Governance → Publish or Request Approval), the seven weekly reviews and the seven monthly
reviews; keep the system observable end-to-end, with every website modification traceable to
its originating evidence and execution trace; confirm that the hidden Control Room discovery
mechanism may reveal, transition and route but never authenticate, authorize, approve, execute,
deploy or expose privileged data; verify the final visual standard; **output a final readiness
checklist and stop if any mandatory condition fails.** Full report:
**`docs/PRODUCTION-OPERATING-MODE.md`**.

**IT STOPPED, AND THAT IS THE DELIVERABLE.** `node agent/production/cli.mjs readiness` reports
**`refused`**: twelve of twenty mandatory conditions pass and **eight block**. Production
operation is **not activated**. The eight, in the words the report uses: the `freshness.mjs`
baseline disagreement; the adversarial gate's CRITICAL; the browser suite's three SESSION 19
defects; **no production dispatcher is wired**; **no registered source endpoint is reachable**;
the decision ledger is absent; two of three website-changing write paths are untraceable; and
**there is no deploy gate**. Six of those eight are inherited and none is this session's to
decide. **A mandatory condition that could not be MEASURED blocks exactly as a failure does**,
which is this repository's own rule about a skipped browser run applied where it matters most.

**`agent/production/` IS THE FIFTEENTH THING IN `agent/`, AND IT WRITES NOTHING.** Five modules
and a CLI with five verbs: the schedule as data, the ten visual conditions, the six
separations, the write paths, and twenty-one readiness conditions in ten domains. No module
calls a write API — asserted as a *call*, so a header explaining the rule does not violate it —
and a full run of the four read-only verbs leaves the tree byte-identical. **There is no
`--execute`, no `--record`, no `--force` and no `--activate`**, and the suite reads the CLI to
prove it. If every condition passed, the report would say a person MAY activate: switching a
production mode on is a governance decision and protocol §24 reserves it to a person.

**THE SCHEDULE ENDS AT A PERSON AND THE LOADER ENFORCES IT**, which is the refusal
`agent/orchestrator/workflows.mjs` applies to its ten workflow types. Every stage states **what
it cannot establish**, and two of the eight cannot do what their names say: Scout reaches no
endpoint (SESSION 25's five refusals; no URL here has ever been fetched), and Route dispatches
nothing (there is no `agent/orchestrator/dispatchers.mjs`). All twenty-two scripts the schedule
names exist, and the fourteen reviews each say what a person must still do with what they
produced. **Nothing fires on a timer. There is no cron and no daemon in that directory.**

**THE HIDDEN ENTRY PASSES ALL TEN VISUAL CONDITIONS AND ALL SIX SEPARATIONS — AND WAS NOT
TOUCHED.** `js/threshold.js`, `style.css`, `index.html` and every other page are
**byte-identical to `a25f0ed`**. The standard was verified, not adjusted. Two of the ten are
settled only in their mechanical half and say so: whether the drawing *looks* like the rest of
the site, and whether a practitioner of the source tradition would accept the construction, are
judgements by people. No contrast was computed, no screen reader was run, no pixels compared.

**HE-04 IS NOW MEASURED RATHER THAN SUSPECTED, AND IS STILL RED.** AGENTS.md carried the
suspicion that the CRITICAL was a false positive; nothing had checked it.
`agent/production/separations.mjs` checks the condition the attack's own finding names — *if
any of those reads it as an input, it is a credential* — on two independent halves.
`agent/simulation/threshold.mjs` calls **none** of the twelve granting primitives, and **none**
of its eight occurrences of the phrase sits on either side of an equality test: three are probe
paths, two are arguments to the client matcher, one is a regex needle, one is prose, one is
quoted code. It is cleared on both halves. **The attack was not edited and the finding was not
reclassified.** HE-04's three path exclusions are exactly the stale exclusion list SESSION 23.5
already had to correct once, and choosing that fix is a person's call. SESSION 27
§4b set the precondition — correct it *only if* a reader confirms the module reads the phrase as
data and never as an input — and that confirmation is now on record, with the measurement
behind it.

**TWO THINGS WERE REPAIRED, AND BOTH ARE OBSERVABILITY DEFECTS.**

1. **The Orchestrator's register commands, dead since the SESSION 26 merge.**
   `agent/orchestrator/cli.mjs:50` imported `AUTONOMY_NOTE`, which `policy.mjs` stopped
   exporting when the note became derived, so **every verb of that CLI exited 1**. It now calls
   `autonomyNote()`. That also removed a **false statement**: the constant said no action
   category is approved for automatic execution, which stopped being true in SESSION 26, and
   the derived note reports the five the grant enables. Was `docs/GOVERNANCE-PROPOSALS.md`
   §6b.
2. **The adversarial gate is in CI**, in a job of its own, because a failing step skips every
   step after it in the same job and a step expected to be red must hide nothing. Its absence
   was the standing lesson: it is how a CRITICAL stayed red across **five** sessions while
   three documents said otherwise.

**FOUR FALSE POSITIVES WERE FOUND IN THIS SESSION'S OWN CODE, and all four are recorded with a
test pinned to the input that caused them.** Three are the HE-01 shape — a scan reading a
module's own denial as a finding: a capability scan that counted the array declaring its
vocabulary and then the regex that searches for it; a deploy check that failed on the panel
sentence *"This deployment does not publish its address"*; and a stylesheet line scan that
reported the minimum hit target absent because its rule spans five lines. **The fourth was
worse**: `gatherFacts()` read `browserJson.checks` where the suite's JSON calls that array
`results`, so the **mandatory** `browser_suite_pass` condition **passed while the browser suite
was exiting 1 on three real reader-facing defects**. A checklist that reports green because it
read the wrong field is worse than no checklist. It now reads the suite's own
`qa_check.exit_code`. `docs/PRODUCTION-OPERATING-MODE.md` §7.

**TRACEABILITY IS ONE OF THREE, AND THE WIDEST GAP IS THE MOST LIKELY PATH.** Of the three ways
a published file can change, only the autonomy runner leaves a durable record naming the
evidence — its commit message, which is built to be that record because the action ledger is
git-ignored. A person editing a page and pushing leaves whatever the commit message says, and
nothing requires or checks it; a Control Room decision would leave a ledger entry, and **the
ledger is absent**. Requiring evidence in a human commit message is a governance decision about
how the repository author works, and an agent may not take it.

**A tracked README is not a record.** The first draft of `traceability.mjs` counted
`agent/implement/decisions/README.md` and reported the decision ledger as durable. Placeholders
are counted separately now — and those same placeholders are what the gate's PP-08 reports at
HIGH, for a different reason.

**Baseline unchanged.** 0 errors across the four validators, the five named `design-qa`
warnings, 106 unverified records. **1166 tests across twenty-three suites**, 0 failures.
`AGENT_SUITES.length` is **23** and `agent/implement/selftest.mjs` R6 asserts it — the ninth
time that assertion has mattered, and the first where the suite was added *with* the number
rather than caught after it.

**What this session did NOT do:** it decided nothing, changed no policy, wrote no grant, and
recorded no decision. `DEFAULT_POLICY.enabled_categories` is still `[]` and the grant ledger is
unchanged at one line. **It did not touch `data/`, `i18n/`, `js/`, `css/`, `index.html` or any
page** — no legal fact, citation, date, article number or status was written, changed or moved.
It fixed none of SESSION 24's twenty-three findings, none of the three browser defects, and
neither OB-05 nor PP-08. **It did not activate production operation**, and describing what it
built as "production operation, activated" would be false: nothing here runs on a cadence.

---

## SESSION 28 — learn from the human decisions, and find there are none

**What was asked:** analyse the historical human decisions; for each approved, rejected or
edited proposal determine the patterns — repeated corrections, repeated rejection reasons,
recurring evidence weaknesses, recurring UX objections, recurring editorial corrections,
recurring implementation failures. Do not automatically rewrite policies; create
`agent/proposals/governance/` with proposals — new rule, new validation, new skill, new
evaluation, reduced autonomy, increased autonomy — every one requiring human approval. The
objective: convert repeated human intervention into durable system knowledge. Full report:
**`docs/GOVERNANCE-PROPOSALS.md`**.

**THE BRIEF'S CORPUS DOES NOT EXIST, AND THAT IS THE FIRST FINDING.** There are no approved,
rejected or edited proposals. `agent/implement/decisions/decisions.jsonl` is not empty — it is
**ABSENT**, and it is git-tracked, so absence there is the only absence in this repository's
six decision stores that proves anything. Of the seventy-one proposals AGENTS.md counts across
four agents, and the forty-eight SESSION 25 measured in one run, **not one has been decided**.
Analysing decisions that do not exist would have been prohibition 2 applied to governance: a
plausible substitute for a missing record. So the corpus is the one that does exist — **the
corrections**, twelve commits of ninety-two that say in their own subject that they are putting
something right.

**TWELVE PATTERNS, FORTY-NINE ANCHORS, NONE REFUTED.** Nothing in `patterns.mjs` stands on its
own words: every instance carries a commit and a substring of its subject, a path that must
exist or must not, a string in a tracked file, or a **live measurement**. Three states, never
two — `resolved`, `refuted`, `unresolvable_here` — because a commit missing from a shallow CI
clone is not a false claim about the history, and a checker that said otherwise would be making
the mistake P-02 is about. `node agent/proposals/governance/cli.mjs check` runs on every push
and exits 1 only on a refuted anchor. The two-instance rule is in code: a pattern that does not
clear it is reported as refused, not dropped.

**THE FOUR THAT MATTER.** *P-01* — a stale base read as a repository fact, four times, each
needing a correcting commit, with the mitigating rule already at the top of AGENTS.md the whole
time: nothing MEASURED the base and nothing FAILED when it was stale. *P-07* — nothing is ever
decided, and that is two problems: `deriveApproval()` binds a decision to a proposal in the
git-ignored record store, so a decision recorded today reads `void_unknown_proposal` on any
other machine until the producing agent is re-run, and H-1 says a reviewer is not shown the
twelve conditions their approval stands over. *P-12* — **this session's own measured finding**:
the grant's `docs/` allowlist and `categoriseProposal()`'s docs-only rule place **all eight**
prose governance documents inside an ENABLED category. `NEVER_AUTOMATIC_PATHS` guards
`agent/policy/` with protocol §24's own words; nothing guards `docs/AUTONOMY-POLICY.md`, which
is that policy in the form a person reads. In the other direction **six of the eight fields the
grant allowlists exist on none of the 77 records** in the file it names. Both are claims about
which gates would NOT stop a change — six gates and twelve conditions run afterwards, and
nothing autonomous has ever merged anything. *P-06* — a session found the stale-base failure,
wrote the fix as a rule, and pushed it to a branch that was never merged: the rule is **on no
document on `main`**, and six remote branches currently hold work `main` does not.

**SEVEN PROPOSALS, ALL SIX KINDS, NONE DECIDED AND NONE IMPLEMENTED.** GP-01 check every
declared count against the thing it counts · GP-02 state what was measured, where, and whose
conclusion it is · GP-03 a session-reporting skill · GP-04 measure the decision backlog and
whether a decision would survive a clone · GP-05 take the prose governance documents out of the
automatic path · GP-06 let a measured count be written back by the run that measured it ·
GP-07 report the work that is on a branch and not in `main`. **Every one states the case
against itself**, and GP-06 — the only one that makes the system looser — says to read that
first. Six of the seven derive `human_only`; GP-03 comes out `review_required` because
`.agents/skills/` is on none of the never-automatic lists, which is an observation and not a
recommendation.

**NOTHING IN `agent/proposals/governance/` WRITES, AND IT IS PROVED TWICE.** No module calls a
write API — asserted as a *call* rather than a mention, so the header explaining the rule does
not violate it — and a full run leaves the working tree byte-identical. Neither `recordDecision`
nor `recordGrant` is imported anywhere in the directory, and the CLI has no `decide`, `apply`,
`grant` or `record` verb, which the suite checks by reading it. The records are deliberately
**not** on the inter-agent bus and carry `contract: null`: a nineteenth contract would have put
a governance record on the agent-to-agent bus and changed the gate every other record passes.
GP-04 names what that costs rather than hiding it.

**TWO LIVE DRIFTS FOUND, NEITHER FIXED, BOTH ANCHORED.** `agent/schemas/cli.mjs:28` prints
`FOURTEEN CONTRACTS` immediately above a list of eighteen. And the SESSION 26 paragraph below
records the boundary scan at 225 files under `agent/` where every SESSION 26 commit holds
**226** — a hand-written count, one out, in the paragraph that exists so a later session can
detect drift. Both are left standing as the worked examples GP-01 exists for: a validation
proposed with no live instance is one nobody can evaluate. If GP-01 is refused, both words
should be spent anyway.

**P-01 FIRED ON THIS SESSION, AT THE MERGE, AND IT IS RECORDED RATHER THAN TIDIED AWAY.**
Immediately before merging, `git log main..origin/main` reported local `main` **three commits
behind** — at `4fe1952`, with the whole of SESSION 26 missing. Merging into it would have
reverted the limited-autonomy activation. It was reset to `origin/main` rather than merged
into, exactly as `aed63a7` did. **Fifth time the trap has caught a session, and the first time
it caught the session writing the pattern about it.** The rule was read and the rule is not
what caught it; the check was. `docs/GOVERNANCE-PROPOSALS.md` §6a.

**A REGISTER COMMAND ON `main` HAS BEEN FAILING SINCE SESSION 26, AND IT IS NOT THIS
SESSION'S AND NOT REPAIRED.** `node agent/orchestrator/cli.mjs workflows` and `capabilities`
exit 1 with *"The requested module './policy.mjs' does not provide an export named
'AUTONOMY_NOTE'"* — SESSION 26 made that note derived and `agent/orchestrator/cli.mjs:50`
still imports the constant it replaced. Verified pre-existing: the same import is at
`aaf6691`, and `git diff aaf6691 HEAD -- agent/orchestrator/` is empty. **No suite runs these
CLIs**, so only CI sees it, and a failing step skips every step after it in the same job —
which skipped this session's own governance check on its first run. The check has been moved
ahead of the registers; the register itself is left for a person, because
`agent/orchestrator/` is outside this brief and what the register should now print is a
judgement about what it asserts. It is the cheapest concrete thing SESSION 29 could fix.
`docs/GOVERNANCE-PROPOSALS.md` §6b.

**One existing assertion changed, and it is the recurring one.**
`agent/implement/selftest.mjs` R6, `AGENT_SUITES.length` 20 → 21. **Seventh catch**, and the
first time the thing it caught was a suite whose subject is that assertion's own failure mode.
No other existing assertion was touched, and no test was deleted, skipped or relaxed.

**Everything was re-run after `git add`, not before.** **1081 tests across twenty-two suites, 0
failures, 0 skipped**, measured on this session's branch (1036 across twenty-one before; the
governance suite adds 45). On `main` `agent/autonomy/selftest.mjs` test 28 skips itself,
because the cycle refuses to run there, so the figure on `main` is 1080 with one skipped.
18/18 contracts satisfiable. The four validators at the `docs/CURRENT-ARCHITECTURE.md` §12
baseline: `validate.mjs` 0 errors, `i18n-audit.mjs` 0 errors 0 warnings, `design-qa.mjs` 0
errors and the same five warnings by file and line, 106 unverified records.
`agent/implement/cli.mjs boundary` at **0 blocking / 13 warnings**, unchanged, with `agent/ is
inside the public surface` at **233 files** — 226 on `origin/main` plus this session's seven.
`.control-room/cli.mjs boundary` at 0 errors, 22 routes, 8 public, 0 production controls,
unchanged. The browser suite in a real Chromium: **125 pass · 3 fail · 2 undecidable**, the same
three SESSION 19 defects, untouched. `freshness.mjs` still exits 1 on the same "1 item(s) need
attention" SESSIONS 24, 25 and 26 all recorded; it is not this session's regression and it is
not fixed.

**CI'S OWN CONCLUSION, NOT THE LOCAL EXIT CODES.** Run 34482119556 on `main` at `d10b413`
reports overall **`failure`**, three of six jobs red: `freshness.mjs` on the same pre-existing
item, the browser suite on the same three SESSION 19 defects, and the Orchestrator's registers
on the SESSION 26 breakage above. **None is new and none is this session's.** The governance
evidence step reports **success** — it runs in CI now that it precedes the broken register; on
the merge commit's run it was `skipped`. `docs/GOVERNANCE-PROPOSALS.md` §6c.

**WHAT THIS SESSION DID NOT DO.** It decided nothing and changed no policy:
`DEFAULT_POLICY.enabled_categories` is still `[]`, the grant ledger is unchanged at one line,
`agent/policy/` was not edited, and the approval ledger is as absent after as before. It fixed
none of the twelve patterns, including the three whose fix it wrote out in full. It touched no
dataset, no locale, no module under `js/` and no page — **no legal fact was written, changed or
moved**. And it **did not merge SESSION 27**: `claude/continuous-improvement-loop-vpd2u1` holds
`agent/improve/`, a repaired autonomy gate ladder and two further findings, is not in `main`,
and is one of the six branches P-06 counts. This session cites none of its documents as
evidence, because a document on an unmerged branch is not something a reader of `main` can
check. **Merging it is a decision for the repository author**, and the next session should
expect a conflict in `docs/HANDOVER.md`, in AGENTS.md's suite list and test totals, and in
`agent/implement/selftest.mjs` R6 — every one of them a count, which is the conflict shape
`e6f2715` predicted.

**What SESSION 29 inherits.** Seven governance proposals in front of a person, added to a
queue from which nothing has ever been taken. That is the honest description of this session's
contribution and it is P-07 restated: seven more pending records do not convert repeated
intervention into durable knowledge — a person deciding them does. The cheapest three to
decide are GP-01, GP-02 and GP-07, each of which would have caught a failure this repository
has already had more than once; the one to read hardest before deciding is GP-06, and its own
entry argues for refusing it.

---

## SESSION 27 — the continuous improvement loop, and what it found

**What was built:** `agent/improve/`, eight files, thirty-one tests. Eight observers run in one
process against one corpus position with one as-of date; the pass is compared with the last
recorded one; every record is routed to a desk; the whole thing ends at a person. Full report:
**`docs/CONTINUOUS-IMPROVEMENT.md`**.

**THE FINDING THAT MATTERS: the autonomy gate ladder was unpassable. It is now repaired, under
an explicit warrant from the repository author.** Take an `ImplementationProposal` with nothing
wrong with it — one file under `docs/`, a path the grant names and `machine_derived_field`,
which the grant enables; real evidence, no interpretation, no blocking question, `low` risk, a
rollback plan. Under the real policy in force, five of the six gates passed and
`policy_route_pre` refused. It had **two independent locks on the same door**, and the second
was invisible until the first was picked.

**Lock 1.** `rollback_mechanical` reads a change context — the branch, the base commit and the
per-file pre-change hashes `agent/implement/apply.mjs openContext()` records in **step 2**;
gate 3 runs **before step 1**. Four of its six elements were therefore `unknown` for every
proposal ever written. `assessRollback()` has always distinguished `unknown` (not established)
from `absent` (established missing); `rollbackMechanical()` collapsed both into `failed`, which
is this repository's §0.3 error.

**Lock 2.** Gate 3's third clause read `route !== 'blocked'`. There are two ways the engine
returns `blocked` — an unauthorized actor, or an unmet condition on `NOT_WAIVABLE_BY_APPROVAL`
— and **every measured condition is on that list**, so the clause was unsatisfiable before a
run *independently of lock 1*. Fixing only the rollback condition moved the refusal from clause
1 to clause 3 and changed nothing a caller could see: the gate then reported "0 condition(s)
fail and 0 non-measurement condition(s) are unknown" **and failed anyway**.

**So `docs/LIMITED-AUTONOMY.md` §7.1 was true and was not the binding constraint.** "Nothing
produces a proposal in an enabled category" is a fact about producers. The permitting half was
**unreachable**. That is consistent with SESSION 26's §6, which shows gate 3 refusing with "4 of
six rollback elements absent" among five reasons — four other gates refused each of the fourteen
too, so this reason was never the one that mattered and nothing was in a position to notice.

**THE WARRANT.** `docs/AUTONOMY-POLICY.md` reserves a governance-layer change to a person, and
this session reported the finding and did not repair it. The repository author then gave the
warrant, on 9 September 2026, in these words: *"Changing what a gate proves is Class C work / I
give u the warrant"*. It is quoted in `docs/CONTINUOUS-IMPROVEMENT.md` §4a and **not** recorded
as a governance grant — a grant is read at runtime by `policyInForce()` and needs a ledger; this
is code, which `git blame` attributes. Nothing was enabled by it: no grant was written or
widened, `DEFAULT_POLICY.enabled_categories` is still `[]`, and no proposal was merged.

**NO CHECK WAS WEAKENED, and that is asserted rather than claimed.** An element established
missing still fails, and that check runs first — `not_reversible`, a context on `main`, and
nothing supplied at all all still FAIL. An unauthorized actor is still refused, and gate 3's new
clause is the only thing there that catches it: the engine returns `conditions: []` for one, so
clauses 1 and 2 both count zero and both pass. Step 6 still re-evaluates every condition with
`facts.context` from the real run and merges only on route `automatic`.

**WHAT IT NOW DOES.** All six gates pass; the cycle reaches the measured evaluation;
`outcome: rehearsed` where it was `refused`; `would_merge: false` on
`verification_succeeded (unknown)` and `validators_pass (failed)`. **The refusal moved from a
structural impossibility to two real measurements**, the second being `freshness.mjs`'s
pre-existing exit 1. **No autonomous change has merged anything and this session did not make
one.**

**A THIRD FINDING, NOT THIS SESSION'S AND NOT REPAIRED: the adversarial gate has been red since
SESSION 24.** `node agent/policy/verify/cli.mjs` reports **65 failed safely · 1 SUCCEEDED · 2
partial · 1 undecidable**. `AGENTS.md` and `docs/SECURITY-VERIFICATION-2026-09-08.md` both said
0 succeeded. HE-04 (CRITICAL) finds the trigger phrase in `agent/simulation/threshold.mjs`.
Measured at `aaf6691` in a clean worktree, so it predates this session entirely. The module uses
the phrase as a **probe** — the line the attack hits is the separation check that searches
Control Room source to prove the phrase is absent from it — so this is very probably the HE-01
shape SESSION 23.5 corrected once, with an exclusion list that went stale when SESSION 24 added
a fourth legitimate prober. Left red deliberately: a CRITICAL suppressed is worse than a
CRITICAL explained, and the gate's own posture is that a remediation is a later session's to
decide. **The standing lesson is that the gate is not in CI.**
`docs/CONTINUOUS-IMPROVEMENT.md` §4b.

**A SECOND FINDING, measured rather than inferred: six of the eight fields the grant allowlists
have never existed in `data/sources.json`.** `last_retrieved`, `retrieved_at`, `checksum`,
`content_hash`, `recheck_interval` and `freshness_window` appear nowhere in the file — not on a
record, not in `$description`, not in `$note`. Only `url` and `url_status` are there, on all 77
records. So `retrieval_metadata` has no surface to write to at all. This is not a defect: a
permission over nothing is inert, and §7.6 already says absence is the safe direction for the
opposite case. It is **not repaired**, and repairing it would be the failure it looks like a fix
for — adding `checksum` to `data/sources.json` is a schema decision about the legal record taken
to make an autonomy demonstration possible. `node agent/improve/cli.mjs reach` measures it on
every push. `docs/CONTINUOUS-IMPROVEMENT.md` §5.

**THE ONE RULE THE LOOP TURNS ON.** An observer that did not run is not an observer that found
nothing. A finding absent this cycle was either fixed or its observer did not run, and the
finding lists cannot tell those apart — so movement is per observer, and an observer that did
not run in BOTH cycles yields `undetermined` for everything it owns. Never `resolved`, never
counted as an improvement. Tests 5 to 8 are that case from four directions, including the
mirror image: an observer absent from the PREVIOUS cycle makes nothing new. A first cycle
reports nothing new at all.

**THE CYCLE LEDGER IS TRACKED, AND IT IS THE ONLY RUN STORE HERE THAT IS.** Every other one is
ignored and argues for it in `.gitignore`; the argument is good and this is the exception,
because a loop whose memory does not survive a clone is not a loop. The precedent is the grant
ledger and the decision ledger, not the health history. What pays for it is a rule: a signal
classified `private` by `agent/health/model.mjs` is withheld with the reason recorded, the
health monitor's own `collectLeaks()` runs over the serialised entry against the real private
metric register, and a path under `.control-room/` is a **refusal to write** rather than a
redaction. Nothing records without `--record`, for the reason
`agent/health/history.mjs writePublic()` gives about publishing.

**THE FIRST RECORDED CYCLE.** `cycle-9f20d795beea`, trace
`dbd43f16b2f34bf1fa0d2e7e3183f522`. 8 of 8 observers ran, **210 findings** — depth 57,
data-proposals 49, editorial 44, architect 40, ux 20. Triage: **0 referable to the autonomy
runner · 66 to a person · 144 proposing no act.** All 66 are refused by a category no policy may
ever automate: `legal_interpretation` 30, `architecture_change` 16, `substantive_data_change`
13, `taxonomy_change` 5, `schema_change` 2. `triage.blocked_only_by_prerun_condition` is 0 and
that zero means "no proposal got that far", not "the blocker is gone" — nothing in the real
corpus is refused later than the category gate, which is why the finding above needed a
well-formed fixture to surface.

**Six existing assertions changed, and every one is named.**

| | |
|---|---|
| `agent/implement/selftest.mjs` R6 | `AGENT_SUITES.length` 20 → 21. **Seventh catch.** The loop reads every other agent's output and routes it. |
| `agent/policy/selftest.mjs` 7 | the pre-run `rollback_mechanical` verdict `failed` → `unknown`. The route is still asserted `blocked` **first**, and the three cases the test is named for all still FAIL. Element-level assertions added so it cannot regress into "everything is unknown". |
| `agent/autonomy/selftest.mjs` 17 | `MEASURED_CONDITIONS` four → five, asserted exactly. |
| `agent/autonomy/selftest.mjs` 17b | **new** — gate 3 tolerates an unmeasured rollback; the measured evaluation still refuses one that is genuinely not mechanical, and one on `main`. |
| `agent/autonomy/selftest.mjs` 17c | **new** — an unauthorized actor is still refused at gate 3, with the empty condition list planted explicitly. |
| `agent/autonomy/selftest.mjs` 28 | ran a proposal whose simulated evidence is refused at gate 2, and accepted `refused` OR `rehearsed` — so it could never tell "correctly refused" from "the ladder cannot be passed". It now runs a clean fixture and asserts every gate passes. |

`agent/improve/` also **lost** code: the triage's special case for the pre-run condition, and
the signal that counted it. The case no longer arises, and code describing a world that has
changed is worse than no code. An assertion replaces it.

No other existing assertion was touched, and no test was deleted, skipped or relaxed.

**Everything was re-run after `git add`, not before.** **1069 tests across twenty-two suites, 0
failures**, measured on this session's branch (1036 across twenty-one before; the loop adds 31
and the gate repair adds 2).
18/18 contracts satisfiable. The four validators: `validate.mjs` 0 errors, `i18n-audit.mjs` 0
errors 0 warnings, `design-qa.mjs` 0 errors and the same five warnings by file and line, 106
unverified records. `agent/implement/cli.mjs boundary` at **0 blocking / 13 warnings**,
unchanged, with `agent/ is inside the public surface` at **236 files** where SESSION 26 recorded
225 — this session's eleven files being counted. `.control-room/cli.mjs boundary` at 0 errors,
22 routes, 8 public, 0 production controls, unchanged. The browser suite in a real Chromium:
**125 pass · 3 fail · 2 undecidable**, the same three SESSION 19 defects, untouched.

**THE LOOP MADE ITS FIRST REAL COMPARISON.** A second cycle, `cycle-df155e5eac10`, recorded
after the repair at `fa67b3ab`: **0 new · 210 persisting · 0 resolved · 0 undetermined**, all
eight observers comparable. Two passes an hour apart at different commits over an unchanged
corpus produced the same 210 findings under the same 210 ids — which is the reproducibility the
content-derived ids buy, and the thing eleven separate CLIs could not do.
`docs/CONTINUOUS-IMPROVEMENT.md` §6b.

**`freshness.mjs` still exits 1** on the same "1 item(s) need attention" SESSIONS 24, 25 and 26
all recorded. It is not this session's regression and it is not fixed. It is the sole reason
`validators.at_baseline` reads false in the recorded cycle.

**Nothing in `data/`, `i18n/`, `js/`, `css/` or any page was changed**, and
`agent/improve/selftest.mjs` test 20 runs two real cycles and asserts it from outside.

**SESSION 28's OWN CHECK CAUGHT A REAL ERROR OF SESSION 27's AT THIS MERGE, AND IT IS RECORDED
RATHER THAN EDITED AWAY.** `node agent/proposals/governance/cli.mjs check` came back **2
anchors REFUTED** on the merged tree, both naming strings that should be in `docs/HANDOVER.md`
and were not: `"at 225 files where SESSION"` (P-04) and `"0 merged · 0 reverted · 14"` (P-08).

The cause was SESSION 27's, not the merge's. Commit `b1b819a` rewrote this file with an
over-broad text replacement whose end anchor was the SESSION 25 header — **so it deleted the
entire SESSION 26 section, 113 lines, in passing.** It was not noticed because the staged diff
read `251 +++++----------` and that was taken for the session's own section being rewritten.
The section is restored here from `fa67b3a`, verbatim, and the check now reports **49 resolved
· 0 refuted**.

A second slip of the same family happened at this merge and is recorded for the same reason:
the merge commit shipped with two unfilled `__MERGED_TOTAL__` placeholders in `AGENTS.md`,
because the measured figures were written into the working tree **after** `git add` and the
commit took the staged copy. `AGENTS.md` already says to run the suites after `git add`, not
before; the sibling rule is to commit what you staged, or stage again. Corrected in the
following commit rather than amended away.

Three things worth carrying from the deleted section. **A `--stat` line is not a review** — `AGENTS.md` says to
read the full `git diff` before committing, and a large deletion count on a file you are also
adding to is exactly what that instruction is for. **The evidence anchors worked as designed**:
SESSION 28 built them to refuse a pattern citing something the tree contradicts, and the first
thing they caught was a sibling session deleting the evidence. And **it was caught at the
merge, by the other session's tool** — neither session's own suite would have noticed, because
no validator here reads prose.

**THE MERGE WITH SESSION 28, AND EVERY RESOLUTION NAMED.** SESSION 28 landed on `main` first;
this branch merged it in. Three files conflicted.

| | |
|---|---|
| `agent/implement/selftest.mjs` R6 | **Both sessions set `AGENT_SUITES.length` to 21**, each correctly about its own tree. The merged tree has 22. This is the second time this assertion has caught that exact shape — the first was the SESSION 22/23 merge — and it is the case it is most worth having for. The membership list now also names `agent/proposals/governance/selftest.mjs` explicitly, which SESSION 28 had not added. |
| `AGENTS.md` | Three hunks. The test count keeps both sessions' figures and says neither is the total; the R6 paragraph records 27 and 28 as **one occasion rather than two**; the commands section is a pure addition on both sides and keeps both. |
| `docs/HANDOVER.md` | Both prepended a session. Both are kept, newest first, with a merged header. |

`agent/implement/checks.mjs` and `.github/workflows/qa.yml` auto-merged correctly — both suite
lists hold all 22 entries — and were verified by reading rather than assumed.

**CI ON THE MERGE CAUGHT A FALSE CLAIM OF SESSION 27's, AND IT IS FIXED.** Run 34606107588 on
`main` at `376bfb9`: **three of six jobs red**, the same three SESSION 28 recorded — the
validators on `freshness.mjs`, the browser suite on the three SESSION 19 defects, and the agent
suites on the Orchestrator's registers. None is new. But the third has a consequence that *was*
new: a failing step skips every step after it in the same job, and SESSION 27 had registered
**"What limited autonomy can reach" after the broken register**, so it was skipped and never
ran. `AGENTS.md` and `docs/CONTINUOUS-IMPROVEMENT.md` §5 both said `reach` "runs on every push",
and that was false for as long as nobody read the job. Both register steps are moved ahead of
the break — which is what SESSION 28 did with the governance step, for the same reason and one
session earlier. **"Every agent suite" passed**, so all 22 suites are green in CI.

**Two things SESSION 28 reported that this merge did not touch and did not repair.**
`node agent/orchestrator/cli.mjs workflows` and `capabilities` exit 1 on `main` and have since
the SESSION 26 merge, because `cli.mjs:50` imports `AUTONOMY_NOTE` which `policy.mjs` stopped
exporting when the note became derived. And the seven governance proposals are in front of a
person in a queue from which nothing has ever been taken. Both are SESSION 29's.

**What SESSION 29 inherits from SESSION 27.** The gate ladder is passable and **nothing has passed it**.
`freshness.mjs` exiting 1 makes `validators_pass` fail for every run in this tree, so nothing
can merge here until that pre-existing item is dealt with — that is now the binding constraint,
and it is small and concrete where the previous one was a structural impossibility. HE-04 is
red and its remediation is a decision; the adversarial gate is not in CI. The loop has one
recorded cycle, taken before the repair; the second is where it starts being worth something.

---

## SESSION 26 — limited autonomy, activated

**What was asked:** enable automatic implementation for explicitly approved low-risk
categories only; for every automatic change create an isolated branch, implement, run the
validators, run browser tests where applicable, record a full observation trace, merge only if
all policy conditions pass, and retain rollback information; do not let substantive legal
content auto-merge; report every autonomous action in the Control Room. Full report:
**`docs/LIMITED-AUTONOMY.md`**.

**The governance decision has a home, and it is not the policy object.** SESSION 23 left every
category off because filling `DEFAULT_POLICY.enabled_categories` is a governance change
protocol §24 forbids the system making to itself. SESSION 26 is that decision arriving from
the repository author, and it is recorded as a **grant** in
`agent/policy/governance/grants.jsonl` — git-tracked like the decision ledger, because an
authorization has to be attributable — naming a person, a date, an authority quoted from the
brief, and an expiry of 9 March 2027. **`DEFAULT_POLICY.enabled_categories` is still `[]`, and
four suites still assert it at their original strength.** That is the BASE; the policy in
force is derived from the ledger by `policyInForce()`. Appending five strings to a frozen
array would have been a fact with no author and a second home for one fact.

**What the grant enables, and it is narrower than the brief allowed.** The five protocol §20
categories, over exactly two paths — `data/sources.json` and `docs/` — and, on the first,
exactly eight bookkeeping fields. The path allowlist is the real narrowing and the FIELD
allowlist is what keeps substantive legal content out of an enabled category: `tier`, `role`,
`supports`, `last_verified`, `verification_note`, `requires_verification`, `reference_gap`,
`gap_note`, `title`, `publisher`, `type` and `celex` are on a never-automatic list no grant
may name. Risk ceiling `low`, environments `local` and `ci`, **never `production`**. Every one
of those refusals runs again on every READ, and `agent/autonomy/selftest.mjs` test 7 writes a
forged line straight into a ledger file and asserts nothing it names is honoured.

**What a grant bought: exactly two of `preflight`'s ten gates.** `approved` and
`approval_attributable`, and nothing else — SESSION 18's own header already said "an
authorized human OR an explicitly permitted autonomy policy" and left the second half unbuilt.
`preflight` is not modified and not weakened. `agent/autonomy/` adds six gates in front of it,
all evaluated always, and the seven steps behind it.

**THE FIRST REAL RUN REFUSED ALL FOURTEEN PROPOSALS, EACH BY FOUR INDEPENDENT GATES.** Data
Depth and the Gap Proposals router ran against the real corpus (57 gaps, 14 `DataProposal`s);
`node agent/autonomy/cli.mjs run --as-of 2026-09-09` reports **0 merged · 0 reverted · 14
refused**, real trace `44b4813604b011a1a490761191704ad8`. Thirteen derived
`substantive_data_change` and one `taxonomy_change` — none is one of the five enabled. The
field gate fired on a real proposal whose operation target named `verification_note`, which is
the record of what was and was not established. Nothing in `data/`, `i18n/`, `js/`, `css/` or
any page was changed, and all fourteen ledger lines record `wrote_files: false`.

**What it did NOT do, and this is the limitation to carry.** **No autonomous change has ever
merged anything.** The gate ladder and the rehearsal path run against real proposals, and the
git mechanics of steps 1 and 6 are driven against a real temporary repository created with
`git init` (`agent/autonomy/selftest.mjs` tests 34–37: main is refused, an unrelated dirty
file is not swept into an autonomous commit, the merge is `--no-ff` with two parents and
`main` does not move, and `abandon` is idempotent and does not discard work it never touched).
The full seven steps have never run end to end with `--execute` against a proposal that
passed, because **nothing in this repository currently produces a proposal in one of the five
enabled categories** — and manufacturing one to demonstrate the mechanism would be a fixture
dressed as work.

**Three existing assertions changed, all because the world changed, and each is named here so
a reader can disagree.**

| | |
|---|---|
| `agent/orchestrator/selftest.mjs` R6 | Read "no action category is approved for automatic execution" and asserted `category_allowed` refused `source_metadata_maintenance`. A person has since granted that category. The replacement keeps all three original claims and adds two: a category no policy may EVER automate is refused **even under a hand-made policy object whose enabled list names it**, and the granted category satisfies that one condition while the act as a whole is still refused. The second of those caught a real weakness — the condition was a plain `includes()` and would have passed such a policy, leaving the engine as the only thing between a forged policy object and a legal interpretation. `agent/orchestrator/policy.mjs` now reads `automatable` first. |
| `agent/policy/selftest.mjs` 33 | Asserted the Orchestrator asks the engine about `DEFAULT_POLICY`. It now asks about the policy IN FORCE, because an Orchestrator enforcing a weaker policy than the implementation layer is exactly the drift that test exists to prevent. The replacement asserts the in-force id **and** that it begins with the base id, so a grant extends the base rather than replacing it. |
| `agent/implement/selftest.mjs` R6 | `AGENT_SUITES.length` 19 → 20. Sixth catch. |

**`agent/orchestrator/policy.mjs`'s `AUTONOMY_NOTE` became a false statement and is now
derived.** It said "No action category is approved for automatic execution in this
repository", which was true when written. `autonomyNote()` reads the ledger;
`AUTONOMY_BASE_NOTE` keeps the base statement.

**A fourth assertion changed, and it is the SESSION 19 shape — a check that passed for the
wrong reason.** `agent/simulation/selftest.mjs` test 1b's own comment said "the assertion is
that THIS run added nothing", and its code asserted that `agent/records/`,
`agent/observability/runs/`, `agent/orchestrator/state/` and `.control-room/state/` were
EMPTY. Those are different claims. `agent/records/` is git-ignored run state that any agent
run populates, so the test passed in a fresh clone and in CI and failed the moment this
session ran Data Depth first to give the autonomy layer something to refuse. It now
snapshots, runs, and compares — which is **stricter**: the old form could not have caught a
simulation writing into a directory that already held a file. This is a change to a check,
which is Class C, and it is recorded here so a reader can disagree with it.

**Two CI omissions were fixed rather than only reported**, and the fix is named because it is
a change to a gate: `.github/workflows/qa.yml` ran seventeen suites while `AGENT_SUITES`
listed nineteen — `agent/simulation/selftest.mjs` had never been in CI. Both it and
`agent/autonomy/selftest.mjs` are in now, plus a register step printing what limited autonomy
is switched on to do on every push.

**Everything was re-run after `git add`, not before.** **1036 tests across twenty-one suites,
0 failures, measured on this session's branch.** On `main` the figure is 1035 with one
skipped: `agent/autonomy/selftest.mjs` test 28 rehearses the real cycle, and the cycle
refuses to run on `main`, so the test skips itself rather than passing for the wrong reason.
That is the assertion being honest about where it can and cannot establish anything. (998 across twenty before; the autonomy suite adds 38, and three earlier tests
gained assertions rather than counts — the orchestrator's R6 split into three claims). 18/18 contracts
satisfiable. The four validators at the `docs/CURRENT-ARCHITECTURE.md` §12 baseline: 0 errors
on `validate.mjs` and `i18n-audit.mjs`, 0 errors and the same five `design-qa` warnings by
file and line, 106 unverified records. `agent/implement/cli.mjs boundary` at **0 blocking / 13
warnings**, unchanged, with `agent/ is inside the public surface` at 225 files where SESSION
23.5 recorded 204 — this session's files being counted. `.control-room/cli.mjs boundary` at 0
errors, **22 routes** (21 before, the new one being `GET /api/autonomy`), 8 public, 0
production controls. The browser suite in a real Chromium: **125 pass · 3 fail · 2
undecidable**, the same three SESSION 19 defects, untouched.

**`freshness.mjs` still exits 1** on the same "1 item(s) need attention" SESSIONS 24 and 25
both recorded, so `agent/implement/cli.mjs check` reports verdict `fail` for that reason and
that reason alone. It is not this session's regression and it is not fixed.

**What SESSION 27 inherits.** Limited autonomy is on and has merged nothing. The gap between
those two facts is the whole of the next objective: either an agent that produces a proposal
in one of the five enabled categories, or a person handing one to `--execute` by hand. Until
then the honest statement is that the permitting half is proved against fixtures and the
refusing half against the real corpus. Also inherited: `agent/policy/` is on the
never-automatic path list on purpose, so widening the grant is Class C work in front of a
person, not something the system can do to itself.

---

## SESSION 25 — the first controlled real-world run

**What was asked:** run the whole pipeline OBSERVE + PROPOSE ONLY against the small, already
-registered set of real EU sources (`agent/scout/authorities.mjs`), through discovery,
verification, change detection, gap identification, affected-page and editorial/UX implications,
Control Room discovery impact, QA simulation and the full trace, ending in a prioritized human
review queue. Full report: **`docs/SESSION-25-FIRST-REAL-WORLD-RUN.md`**.

**What happened at the network boundary, and it is the headline finding.** `agent/scout/cli.mjs
--live` attempted all five registered endpoints (EUR-Lex, the Commission's digital-strategy
site, EDPB, EDPS, ENISA) for the first time this project has ever asked it to. **All five were
refused by this environment's own egress policy** — confirmed independently with `curl` and
`WebFetch` against the same hostnames, neither of which is part of this repository. The Scout
recorded five `retrieval_blocked` gaps, real trace `3431281084fa9129b4689b82cb7043e8`, and
invented nothing. **This turns U-23.5-01 and AUDIT F-12 — "the deployed origin has never been
fetched, the network policy refuses it" — from an inference into a measurement**, for the first
time. Verification, integration and live-path change detection chained off that trace and
correctly found nothing to do (§3 of the report) rather than falling back to the mock corpus.

**What ran against the real corpus and real pages, and found real findings.** Data Depth (57
gaps), the Knowledge Architect (20 findings, all eight questions answered yes), the Gap
Proposals router (14 `DataProposal`s + 22 refused-and-named), Editorial (22
`editorial_recommendation`s over 387 real prose blocks), UX/UI (10 findings, 1 critical), and a
real-Chromium Browser QA run (125 pass · 3 fail · 2 undecidable — the same three SESSION 19
defects, unchanged). **48 proposals now sit in the record store, 0 decided, 0 routable to
implementation** — `agent/orchestrator/cli.mjs survey` refuses every one by the same four
`preflight` gates, which is those gates working as designed on records nobody has approved.

**The hidden Control Room entry was evaluated as instructed and found one relevant finding.**
`js/threshold.js` implements the modal/dialog contract independently of `js/dialog.js` and
`app.js` — an accessibility-consistency finding (`prop-ux-two-implementations-a364f0ff9dd6`),
explicitly **not** a security finding. Nothing else in this run's records touches search
behavior, hidden-entry detection, animation, Control Room login routing, the public/private
boundary, or a privileged interface. `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` §6.

**What it changed:** nothing in `data/`, `i18n/`, `js/`, `css/` or any page.
`git status --porcelain` was empty throughout, checked before this document was written. The
four validators are at the recorded baseline (0 errors, 106 unverified, 5 `design-qa`
warnings), both boundary checks are unchanged (0 blocking / 13 and 0 / 0), and
`agent/implement/decisions/decisions.jsonl` remains empty. A curated, prioritized review queue —
not all 48, by instruction — is in the report's closing section, ready for a human decision.

**CI on this push (`cdfe375`) reports `failure`, and that is not this session's regression.**
Checked against the actual GitHub Actions run rather than left to local exit codes: two of six
jobs fail — `freshness.mjs` exiting 1 on the same "1 item(s) need attention" reported above, and
the browser suite failing on the same three pre-existing defects already named. The immediately
preceding push, SESSION 24's `341ff39`, fails CI in the identical two jobs at the identical
steps. `AGENTS.md` already says this workflow "is not a deploy gate." Report:
`docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` §7.

**The one thing SESSION 26 inherits that is new:** the network boundary in §2 of the report is
now a measured fact about *this* environment rather than a documented default. It will
reproduce identically on a rerun here. Advancing step 1 needs either a different network policy
or a person retrieving one document by hand and handing its text to the Verifier via
`--records`.

---

## SESSION 24 — the first end-to-end run, in simulation

**What was asked:** run one complete simulated cycle across the whole agent graph, produce
an end-to-end trace, simulate the hidden Control Room discovery flow as a separate
UX/security path, define the intended visual sequence without implementing it, and then
identify what is missing, ambiguous, redundant, unvalidated, misrouted or insecure —
**without fixing any of it.**

**What was built:** `agent/simulation/`, nine files, twenty tests. It wires twelve
**simulated** specialists into the real Orchestrator and walks eight of the ten workflow
types once, with a real `.control-room/` process on the authorization leg — a real login, a
real authorization refusal for the wrong role, a real fingerprint check, a real CSRF
refusal, and one real ledger line written into a temporary decision directory.

**What ran for real:** the event intake and its stripping, classification, the capability
register and every grant, every handoff check, H3, the contract gateway, all six conflict
detectors, the provenance and rollback gates, the twelve autonomy conditions, the journal,
the tracer, `preflight`'s ten gates, the ledger, and the Control Room's seven decision gates.

**What was simulated:** the eleven specialists' domain reasoning. **No source was read, no
page was opened by a specialist, no dataset was examined, no sentence was judged.** A green
leg means the machinery routed a fixture.

**What it changed:** nothing, measured. `agent/simulation/world.mjs` fingerprints all 362
files in the working tree before and after; test 1 asserts the difference is empty and that
the real decision ledger still holds zero lines. **Not one proposal in this repository has
ever been decided, and this run did not change that.**

**What it found: twenty-three findings, none fixed.** `docs/FIRST-END-TO-END-AUDIT.md`. The
four to carry:

| | |
|---|---|
| **V-1** | `orchestrator.mjs:495` calls `receive(record, { allowSimulated: true })`, hard coded. **Every workflow admits a simulated record** and routes it to a person. Only `preflight` gate 2 stops one, and that runs on `IMPLEMENTATION_REQUEST` alone. |
| **V-3** | **The rollback gate has never examined a record.** On `IMPLEMENTATION_REQUEST` every stage before it is a gate, so it receives `[]` and passes; on `QA_FAILURE` it receives a `QAResult`, which has no `proposed_change` and is skipped. The trace reads *"0 rollback plan(s), each naming a method, steps and a verification"*. |
| **V-2** | **Nothing re-checks a `ChangeRecord`'s files against the approved scope after the dispatch.** Leg 6 approved a proposal scoped to `index.html` and admitted a `ChangeRecord` declaring a change to `tools/simulated-check.mjs`. `apply.mjs` still enforces the permitted set against git, so the site is protected — the Orchestrator's own record of what happened is not. |
| **I-1 / I-2** | Two conflict detectors have **no ordering constraint and no sibling exclusion**. Leg 1's trace names the upstream agent as the downstream one; leg 2 refused a workflow because one agent's proposal "softened" the blocking question in the `ApprovalRequest` it returned in the same call. |

**The discovery flow.** All six separations were measured and hold: the animation is separate
from authentication, authorization, approval, orchestration, execution and deployment.
`js/threshold.js` imports nothing at all. The real browser suite ran the nine threshold
checks in a real Chromium and all nine pass — including that opening the passage issues **no
network request of any kind**, and that the wheel draws 3 rings and 22 letters.

**The visual sequence** is declared as data in `agent/simulation/threshold.mjs`
(`VISUAL_SEQUENCE`), so intended-versus-actual is a comparison a machine performs. Three of
six phases do not match, and **one of the three must stay unmatched**: the brief's phase 6
("reveal CONTROL ROOM followed by the normal authentication interface") must never be
implemented as a login form on the published page. That would be a credential prompt in the
public tree. The refusal is written into the specification's own `must_not`, and
`selftest.mjs` test 6 asserts no page in the repository carries a `type="password"` field.

**The suite list grew to nineteen**, which `agent/implement/selftest.mjs` R6 caught for the
fifth time. **998 tests across twenty suites**, all passing. The four validators are at the
`docs/CURRENT-ARCHITECTURE.md` §12 baseline: 0 errors, 106 unverified, 5 design-qa warnings.
The browser suite is at its recorded state: the same three known failures (issues 25, 27 and
28) and two undecidable, none of them touched.

**Nothing in `data/`, `i18n/`, `js/`, `css/` or any page was changed, and no finding was
repaired.** Protocol §25 asks this session to observe and document rather than silently
repair, and a suite that pinned a defect would turn it into a requirement.

---

## SESSIONS 22, 23 and 23.5 — carried forward

**Branch:** `claude/agent-governance-protocol-gfbgfb`, cut from `origin/main` at `c43b7a9`,
with `claude/agent-governance-protocol-tx6mu1` (SESSION 22) merged into it. **Merged into
`main` at `8f1b411`.**

**WHAT THIS BRANCH NOW CARRIES.** Three sessions, on one tree:

- **SESSION 22** — the Master Orchestrator, `agent/orchestrator/`. It was written on a
  sibling branch cut from the same base and had never been merged. **An earlier version of
  this handover said it had never been built. That was wrong**, and the correction is kept
  below rather than edited away.
- **SESSION 23** — the executable autonomy and authorization policy, `agent/policy/`.
- **SESSION 23.5** — the adversarial verification gate, `agent/policy/verify/`.

**THE AUTONOMY POLICY NOW HAS ONE HOME, AND IT IS `agent/policy/`.** The two branches had
each implemented protocol §18's twelve mandatory conditions, §19's triggers, the §20 low-risk
categories and an empty approved-category list. That is a second home for one fact. The merge
resolved it in the direction protocol §14 states — the Orchestrator's responsibilities are
workflow state, routing, handoffs, conflict detection and **policy enforcement**, not policy
definition — so `agent/orchestrator/policy.mjs` now re-exports:

| Was a literal in the Orchestrator | Is now a view onto |
|---|---|
| `MANDATORY_AUTONOMY_CONDITIONS` | `agent/policy/conditions.mjs` `CONDITIONS` |
| `LOW_RISK_CATEGORIES` | `agent/policy/categories.mjs` `AUTOMATABLE_CATEGORIES` |
| `APPROVED_AUTONOMOUS_CATEGORIES` | `DEFAULT_POLICY.enabled_categories` — still empty |

**The two lists had already drifted, which makes the argument without anyone having to
make it.** SESSION 22 had all five of protocol §20's low-risk categories; SESSION 23 had four,
because `governed_metadata_maintenance` had been missed. The fifth is now in
`ACTION_CATEGORIES`, and the test that asserted "protocol §20 names four" — which was simply
wrong — asserts five and says why. Seven of the twelve conditions were spelled differently on
the two sides; `agent/policy/`'s spellings win because they are what `evaluate()` returns and
what the verification gate attacks. Four test names in SESSION 22's suite were renamed with
them, and **every assertion keeps exactly the strength it had.**
`agent/policy/selftest.mjs` test 32 is the drift check `docs/DATA-GOVERNANCE.md` §5 requires,
and gate attack AB-10 is the same check from the outside.

**SESSION 23's OTHER HALF IS NOW DONE.** Its brief says "the implementation layer **and
Orchestrator** must enforce it mechanically". Only the implementation layer did, because the
Orchestrator was not in the tree. `autonomyPermits()` now calls `agent/policy/engine.mjs` as
well and `permitted` requires both to agree. **The first version of that wiring was wrong in
an instructive way**: it asked the engine about the Orchestrator's own act of *enforcing* the
policy, which is a read, so `evaluate()` routed straight to `automatic` having checked nothing
and came back permitted. Policy test 33 now asserts the engine reported *which* conditions it
refused on, because a refusal with an empty verdict is a refusal that did not look.

**A CORRECTION TO THIS SESSION'S OWN REPORTING, AND IT MATTERS.** SESSION 23.5's commit said
"909 tests across eighteen suites, 0 failures". **`agent/implement/selftest.mjs` R4 was RED on
this branch as pushed, and on SESSION 22's branch as pushed, independently.** The suites were
run before staging, and `publicSurface()` reads *tracked* files — so the credential scan could
not see files that were not yet committed, and R4 went green for the wrong reason. Verified
after the fact in clean worktrees at `e6f2715` and `74e9a4a`: both report `54 pass · 1 fail`.
**Run the suites after `git add`, not before.**

Both blocking hits are fixed at source, and none of them by touching a pattern:

- `docs/HANDOVER.md` no longer reproduces the test passphrase literal. `docs/` is inside the
  published surface, and R4 caught SESSION 21's draft handover for exactly this.
- `agent/policy/verify/harness.mjs` is classified as the test fixture it is —
  `TEST_FIXTURE_PATHS` gains it. Classification is not suppression: the hit is still found,
  reported and counted, at warning severity beside the other ten. **This is a change to a
  check, which is Class C**, and it is recorded here so a reader can disagree with it.
- `agent/orchestrator/approval.mjs` had two call sites writing object syntax whose key and
  value were the same privileged account name, which the `default-credentials` pattern reads
  as a credential pair. The call sites changed; **the pattern did not.** Narrowing it to
  exclude a same-word pair would blind it to the exact pair protocol §11 names as forbidden.
  The over-firing is recorded as a finding in
  `docs/SECURITY-VERIFICATION-2026-09-08.md` instead.

**Everything was re-run on the merged tree, after staging this time.** Nineteen suites
(**978 pass, 0 fail**), the contract check (18/18 satisfiable), the four validators at the
`docs/CURRENT-ARCHITECTURE.md` §12 baseline (0 errors, 106 unverified, the same five
`design-qa` warnings), the browser suite (125 pass, the same three pre-existing defects), both
boundary checks, and the verification gate.

**The boundary check reports 0 blocking / 13 warnings**, where SESSION 21 recorded 11. Two
were added: this session's test passphrase in `agent/policy/selftest.mjs`, and the same
constant in `agent/policy/verify/harness.mjs`. `agent/ is inside the public surface` moved
from 180 files to 204, which is SESSIONS 22, 23 and 23.5 being counted.

**THE ONE-OFF TEST FAILURE WAS FOUND, IDENTIFIED AND FIXED — AND IT WAS NOT A FLAKE.**
An earlier version of this handover recorded a `.control-room/selftest.mjs` failure that had
been seen once and never reproduced, with its name uncaptured. It reappeared while merging to
`main`, and this is what it was:

```
15 · a session is a server-side record; nothing a client can write becomes one
    a forged cookie was accepted: cr_session=...   200 !== 401
```

That message reads as a session-forgery breach. **It was not one.** The test builds six
client-side forgeries, and the third is the real session token with its last character
replaced by `A`:

```js
`cr_session=${real.cookie.split('=')[1].slice(0, -1)}A`   // "one character changed"
```

**Whenever the real token already ends in `A`, that is not a forgery — it is the real
cookie**, and the server returned 200 because it was correctly accepting its own valid
session. Measured rather than assumed: 3 of 40 logins produced a token ending in `A`.
`.control-room/selftest.mjs` now replaces the final character with one that differs from it,
so the assertion is meaningful on every run instead of on most of them.

**The evidence that it is fixed is the construction, not the runs.** Eighteen consecutive
runs pass, and eighteen runs would not settle it on their own: at a 7.5% failure rate, an
unfixed test survives eighteen runs about a quarter of the time. What settles it is that
`mutateLastChar()` returns `'B'` when the last character is `'A'` and `'A'` otherwise, so the
mutated token can no longer equal the original for any input.

Two things worth carrying forward. **The Control Room was never wrong here** — no session
forgery was ever possible, and the other five forgeries and the four spoofed identity headers
were refused on every run including the failing ones. And **the earlier handover's refusal to
call it a flake was right**: it was a real defect with a probabilistic trigger, and calling it
noise would have left a security assertion silently passing for the wrong reason about once in
every thirteen runs.

---

## Current milestone

**SESSION 22 — complete and merged into this branch.** The Master Orchestrator,
`agent/orchestrator/`. The reference document is **`docs/ORCHESTRATOR.md`**.

**SESSION 23 — complete.** The executable autonomy and authorization policy,
`agent/policy/`, which is now the **one home** for the policy vocabulary. The reference
document is **`docs/AUTONOMY-AUTHORIZATION-POLICY.md`**.

**SESSION 23.5 — complete.** The adversarial verification gate, `agent/policy/verify/`:
**69 attacks, 66 failed safely, 0 succeeded, 2 partial, 1 undecidable.** The report is
**`docs/SECURITY-VERIFICATION-2026-09-08.md`**. **Two findings stand and neither was
fixed.**

---

# SESSION 23 — the policy, executable

## What was built

Five modules and a CLI under `agent/policy/`, answering the question none of the three
existing layers could: *may this specific act happen without a person?*
`docs/AUTONOMY-POLICY.md` is a document, `agent/implement/preflight.mjs` checks a
proposal's paperwork, `.control-room/authz.mjs` decides whether a person may press
approve — and protocol §18's twelve mandatory conditions had no home at all.

| File | What it owns |
|---|---|
| `categories.mjs` | 18 action categories, the policy object, the derivation of a category from a proposal |
| `actors.mjs` | 84 rows: actor × action × resource × environment × path × risk |
| `conditions.mjs` | the twelve mandatory conditions and the human-review triggers |
| `rollback.mjs` | six elements, not a boolean |
| `engine.mjs` | `evaluate()` → a route; `mayExecute()` → whether it may happen now |
| `cli.mjs` | `policy` · `matrix` · `categories` · `evaluate --proposal <id>` |

## The four things this session is arranged around

**1 · NOTHING IS SWITCHED ON, AND THAT IS THE DELIVERABLE.**
`DEFAULT_POLICY.enabled_categories` is `[]` and so is the path allowlist. No act in this
repository can reach the automatic route, and tests 1b and 29 assert it stays that way.
The prompt is explicit — "Do NOT enable automatic production merge in this session" — and
filling either list is a governance change protocol §24 forbids the system making to
itself. The suite proves the permitting half against `SIMULATION_POLICY`, a fixture
marked `simulated: true` enabling one category over `docs/`, and then proves the
identical act refused under the shipped policy. **A suite that could only ever see a
refusal cannot tell "correctly refused" from "broken"** — the failure
`.control-room/selftest.mjs` was arranged against, and the reason test 1 exists.

**2 · THREE ROUTES, AND `blocked` IS NOT A SOFTER `human_review`.** `blocked` means an
approval would not help, which is protocol §8 as code: approval "does not override
provenance requirements; validation requirements; security requirements; scope
restrictions; mandatory policy conditions". A proposal with missing provenance is not
waiting for a reviewer; it is waiting for the agent that owns it.

**3 · UNKNOWN BLOCKS.** Three verdicts, not two. Eight of the twelve conditions are read
off the proposal and **cannot be supplied**; four are measurements that default to
`unknown`, and `unknown` refuses exactly as a failure does. The project's own §0.3 rule,
applied where getting it wrong would let a machine write to a website about EU law. What
is NOT closed, and is said in the module header rather than discovered later: within one
process a caller can supply a false fact.

**4 · IT IS ENFORCED, NOT DESCRIBED.** `agent/implement/implementer.mjs` calls the engine
twice per proposal — before a line is written, and again on the measured validators,
browser suite and git scope enforcement. A `blocked` route is a refusal in the first
case and a reason to revert in the second. Tests 30 and 31 assert both call sites exist
and that the suite runs in CI.

## The hidden Control Room entry

`js/threshold.js`. Typing `thirty-two paths` into the search palette offers one extra
result; choosing it draws a wheel — three concentric bands divided 3 · 7 · 12,
twenty-two Hebrew letters, fine lines in the site's own ink — and offers a link to a
login page.

It authenticates nothing, authorizes nothing, and holds no credential, no endpoint and
no privileged state. **The phrase is not a credential**: it is in a file served to every
reader, protocol §10 says obscurity is not a control, and anybody who finds it meets the
same login. It reads its target from `<meta name="eu-control-room">` and **never invents
one**; no published page declares that tag, so on the live site the passage ends at a
statement rather than a navigation. **Do not add the meta tag, or a server route that
reads the phrase, without deciding to.**

The wheel is not decoration: the Sefer Yetzirah tradition's twenty-two letters are an
**enum authority**, a closed vocabulary from which everything else is composed, which is
what `data/taxonomy.json` is to every other dataset here.

Nine new browser checks measure it in a real Chromium, including that opening it issues
**no network request at all**. One of them, `threshold:no-globals`, is measured against
a blank document in the same browser — the naive form reported `sessionStorage` and
`credentialless`, which are Chromium's own, as defects in the site.

## Two existing assertions changed, and why

Both because the world changed, not because they were inconvenient:

- `agent/implement/selftest.mjs` R6 asserted `AGENT_SUITES.length === 15`. There are
  seventeen now — the policy suite and the verification gate. The assertion is kept and
  updated, because a suite silently dropped from that list stops gating changes and
  nothing else would notice.
- `agent/detector/impact.mjs` `MODULE_SURFACE` must name every module in `js/` and did
  not name `threshold.js`. It does now, classified `surface: null` — chrome, reached only
  through the palette, rendering no record.

## A defect the suite found in the policy itself

`agent/policy/selftest.mjs` test 5 caught it, and it is the kind of thing this whole
layer exists to catch. A condition's `data` object carrying a key named `verdict`
**overwrote the condition's own verdict**, turning `failed` into a word the engine
matched as neither satisfied nor unmet — so an act that should have been blocked
evaluated as **`automatic`**. It is fixed, the validator run's own verdict is now
reported under `run_verdict`, and `evaluateConditions()` throws on any verdict outside
the four it defines so it cannot recur elsewhere.

---

# SESSION 23.5 — the verification gate

## What was built

`agent/policy/verify/` — a catalogue of **65 attacks across seven areas**, each carried
out against something real: a Control Room running on an ephemeral loopback port, the
tracked tree as git reports it, or the policy and ledger modules themselves.

```
node agent/policy/verify/cli.mjs                the report
node agent/policy/verify/cli.mjs --json         the whole record
node --test agent/policy/verify/selftest.mjs    is the gate reproducible
```

**Result: 61 failed safely · 0 succeeded · 2 partial · 2 undecidable.** The repository
was byte-identical afterwards, measured by hashing the tree around the run.

## Four outcomes, not two

`failed_safely` · `succeeded` · `partial` · `undecidable`. **An `undecidable` is not a
pass.** Two of the boundaries the prompt names cannot be tested here at all, and a gate
with only pass and fail would have had to call them passed.

## The two findings, NEITHER FIXED

**F-23.5-01 (HIGH) — the control-plane directories are inside the published surface.**
188 files under `agent/` are published. No operational record is published today, but two
tracked placeholder READMEs prove the directories are in the deployment, and the only
thing keeping the records out is a `.gitignore` rule. **An ignore rule is not a
boundary**: one `git add -f agent/implement/decisions/decisions.jsonl` publishes the
approval ledger. Pre-existing — `docs/IMPLEMENTATION-QA.md` §6 — and re-measured rather
than quoted.

**F-23.5-02 (HIGH) — `agent/observability/server.mjs` authenticates nothing.** Eleven
`/api/` routes over the whole trace store, protected only by a `host` **default**. The
gate confirmed the module is unchanged and **did not re-run the measurement**, and says
so rather than reporting a number it did not take.

## The two undecidables

**U-23.5-01 — the deployed origin has never been fetched.** The network policy refuses
it. So the publication boundary, F-23.5-01 included, is **inferred** from Jekyll's
documented default and from reading the tree.

**U-23.5-02 — the Master Orchestrator is not in this working tree.** It exists on
`claude/agent-governance-protocol-tx6mu1`; this branch does not carry it, so the gate had
nothing to attack. The report records the correction rather than editing it away.

## Two defects in the gate itself, found and corrected before the report

Recorded in `docs/SECURITY-VERIFICATION-2026-09-08.md` §7 because a verification whose
own errors are invisible is not a verification. Both are the SESSION 19 shape — a check
that fails for the wrong reason:

1. **HE-01 cried CRITICAL over a sentence.** It substring-matched forbidden words over
   the whole of `js/threshold.js`, whose own header says *"It holds no token, no session,
   no credential"* — so `token` matched. It now strips comments and keeps string
   literals, because a credential would be one.
2. **PP-08 reported two READMEs as leaked decisions.** It now separates *is a record
   published* (no) from *is the directory inside the published surface* (yes), and the
   second is the real finding.

## What the gate does not establish

Fully in `docs/SECURITY-VERIFICATION-2026-09-08.md` §8. The one to carry: **this is an
automated gate written by the same session that built what it attacks.** It is
independent of the implementation — separate module, separate vocabulary, attacks rather
than assertions — and it is **not** independent of the author. Nothing here has been
penetration-tested by a person.

## Files changed, SESSIONS 23 and 23.5

**New:** `agent/policy/` (`categories.mjs`, `actors.mjs`, `conditions.mjs`,
`rollback.mjs`, `engine.mjs`, `cli.mjs`, `selftest.mjs`, `README.md`),
`agent/policy/verify/` (`harness.mjs`, `attacks.mjs`, `cli.mjs`, `selftest.mjs`),
`js/threshold.js`, `docs/AUTONOMY-AUTHORIZATION-POLICY.md`,
`docs/SECURITY-VERIFICATION-2026-09-08.md`.

**Modified:** `agent/implement/implementer.mjs` (the two policy call sites),
`agent/implement/checks.mjs` and `.github/workflows/qa.yml` (the two new suites),
`agent/implement/selftest.mjs` (the suite count), `agent/detector/impact.mjs`
(`threshold.js` classified), `agent/browser/checks.mjs` and `agent/browser/runner.mjs`
(the nine threshold checks), `js/palette.js` (nine lines), `style.css` (the threshold
block, appended), `AGENTS.md`.

**Not modified:** `data/`, `i18n/`, `css/`, `fonts/`, `tools/`, every `.html` page,
`app.js`, `README.md`, `CLAUDE.md`, `.control-room/`.

## Next session

**SESSION 24 — the end-to-end simulation.** Protocol §25 puts it next, and this branch is the
first tree on which it could run: the Orchestrator, the policy it enforces, the implementation
layer and the Control Room are all present together for the first time.

Four things it inherits.

- **No dispatcher is wired.** A workflow run today reports `not_dispatched` and ends
  `unresolved`. That is SESSION 22's own statement of where it stopped, and §25 says the first
  complete cycle runs in simulation and **must not modify production**.
- **`agent/policy/` is the home for the autonomy policy.** Do not re-implement a condition, a
  trigger or a category inside the Orchestrator, the simulation, or anywhere else.
  `agent/policy/selftest.mjs` test 32 and gate attack AB-10 will both notice.
- **SESSION 23.5's two findings must not be silently repaired.** The prompt says so and so
  does `docs/SECURITY-VERIFICATION-2026-09-08.md`. They are decisions for the repository
  author.
- **Run the suites after `git add`, not before.** This session reported a green R4 that was
  red, because the credential scan reads tracked files and its own were not yet staged.

### Exact next objective

Run the simulation of protocol §25 — Scout → Verifier → Detector → Data Depth → Knowledge
Architect → Editorial → UX → Implementation/QA → Orchestrator → Observability — in simulation
mode, modifying nothing, and **document the defects it exposes rather than repairing them**.

---


**SESSION 22 — complete.** The Master Orchestrator, `agent/orchestrator/`. The
reference document is **`docs/ORCHESTRATOR.md`**; this file is the handover only.

---

# SESSION 22 — the Master Orchestrator

## What was built

The twelfth thing in `agent/`, and the first whose subject is the other eleven. Nine
modules, a CLI, a suite, and one read-only view in the Control Room.

Zero dependencies, no build step, no `package.json` — `node:fs`, `node:crypto`,
`node:path`, the same constraints as the rest of the repository.

| File | What it owns |
|---|---|
| `capabilities.mjs` | the capability register for all fourteen actors, and `grantFor()` |
| `workflows.mjs` | the ten workflow types as data, the five end states, `classify()` |
| `state.mjs` | the workflow state machine and the append-only journal it is replayed from |
| `events.mjs` | intake: the whitelist, and the fields stripped and named at the door |
| `approval.mjs` | the eight routing checks, re-derived from the decision ledger |
| `conflict.mjs` | six conflict shapes, and no resolver |
| `policy.mjs` | the ten human-review triggers, protocol §18's twelve conditions, the provenance and rollback gates |
| `orchestrator.mjs` | the Orchestrator |
| `cli.mjs` · `selftest.mjs` · `README.md` · `state/README.md` | |

## The five things this session is arranged around

**1 · A GRANT IS AN INTERSECTION, NEVER A UNION.** SESSION 22 names three ways an
agent must not gain permission: because another agent asked, because the
Orchestrator routed a task, or because somebody clicked a button. All three have the
same shape — authority arriving with the REQUEST rather than being held by the
ACTOR. So `grantFor()` returns what is in BOTH the agent's registered capability and
the stage's declared need. A stage asking for more produces an **empty grant** and a
refusal naming the difference, not a grant covering the stage's need. Nothing in the
module reads an argument about permission: there is no `extra`, no `also`, no
`permissions`, and `checkOutput` has no `force`.

The register is **frozen all the way down**. A shallow freeze left `produces` a
mutable array, and `CAPABILITIES['legal-verifier'].produces.push('UXProposal')`
widened an agent at runtime — the suite planted that push, it succeeded, and the
fix was a deep freeze. That is the suite finding a real defect rather than
confirming a design.

**2 · APPROVAL IS RE-DERIVED, AND THE FORGERY IS NAMED RATHER THAN IGNORED.**
`events.mjs` strips every approval-shaped field at intake — `approved`,
`authorized`, `granted`, `decided_by`, `outcome`, `approval_id`, `permitted_files`,
`roles`, `force`, `skip_checks`, `deploy`, `git_ref` and twenty more — and reports
each one on the event AND on the trace. Silently ignoring them would look identical
to not having checked, which is the reasoning `agent/implement/ledger.mjs` already
established about agent-written approval claims, applied one layer up. An **unknown**
field is refused outright with its name.

`approval.mjs` then performs the eight checks the session names, five of them
**lifted from `agent/implement/preflight.mjs` rather than re-derived** so a gate
tightened there tightens this too. It does not reimplement `deriveApproval()`.

**3 · THE EIGHTH CHECK IS THE ONE NOTHING ELSE PERFORMS.** Implementation scope must
match approved scope. `preflight` derives the permitted set from the proposal and
`apply.mjs` enforces it afterwards against git; neither compares the set against
WHAT WAS ASKED FOR, because nothing was previously in a position to ask. A routing
request naming a file the proposal does not is **refused with the difference named**
— never intersected down to the permitted set and run anyway, which would let a
caller learn the permitted set by asking for the whole tree and reading what came
back.

**4 · THE CONFLICT DETECTOR HAS NO RESOLVER.** H7: a contradiction is never resolved
by seniority, recency or convenience. So there is no `resolve()`, no
`preferMostRecent()`, no confidence comparison and no tie-break, and the suite
asserts those exports do not exist. The temptation is specific: a verifier's
`contradicted` beside a proposal that asserts the value anyway has an obvious
answer, and taking it would be an agent deciding a question about EU law by rule of
thumb.

**5 · THE AUTONOMY ANSWER IS ALWAYS NO, AND ALL TWELVE CONDITIONS ARE STILL
EVALUATED.** `APPROVED_AUTONOMOUS_CATEGORIES` is empty, because no governance
decision in this repository has approved one and §24 forbids the system from taking
that decision itself. That could have been a single early `return false`, and
deliberately is not: the interesting fact is not "autonomy is off", it is WHICH
conditions a given piece of work would have failed. A system that only ever prints
"not permitted" teaches nobody anything, and the first session that enables a
category would be enabling it blind.

## Two things the suite corrected in the design

Both were wrong in code and right in the suite, and both are named here so a reader
can disagree.

**`same_agent_forbidden` named AGENTS, and the rule fired when the design was
HONOURED.** Written as agent-name pairs — `['regulatory-change-detector',
'legal-verifier']` — the H3 check refused the verifier stage precisely because the
detector had just run, which is the intended sequence, not a collision. The pairs
now name **STAGES** (`['detect', 'verify']`), which is what H3 actually says:
whoever runs `detect` may not also run `verify`. The load check refuses a pair
naming a stage the workflow does not have, and the suite asserts the two stages in
every pair are assigned to different agents today. A **second** check now carries
the real case: an agent handed a record it produced itself is refused before any
reasoning happens.

**`legal-verifier` could not consume a `RegulatoryChange`, which made `LEGAL_CHANGE`
unroutable.** The capability register said the verifier consumes `SourceCandidate`
only, so the handoff from `detect` to `verify` was refused as broken on every run of
that workflow type. `RegulatoryChange` was added to its `consumes`. That is the
register being corrected by the thing that uses it, rather than the workflow being
bent around the register.

## What is genuinely proved, and how

**65 tests in a new suite**, arranged as the six regressions the session names —
R1 incorrect routing, R2 forged approval, R3 scope expansion, R4 missing provenance,
R5 failed handoff, R6 unauthorized execution — plus the state machine, the
conflicts, the human-review triggers and the registers.

Two shapes it is arranged to avoid:

- **A test that passes because nothing happened.** Every refusal is paired with a
  positive proving the same path works when it should. Three of these failed in
  draft for exactly that reason: the R4 provenance test wired only the verifier, so
  the gate it was named for never ran.
- **A test asserting the shape somebody wrote.** The end-state assertions read the
  JOURNAL, because that is what the Control Room and a later session read, and an
  in-memory field can be right while the persisted record is wrong.

**Every fixture is about a file called `tools/example.mjs` that exists only in the
suite.** Nothing in it asserts anything about EU law. The records that must not be
`simulated` — because `preflight` refuses a simulated record as unactionable — are
safe to write only because their subject is a fixture path.

**Three fixtures the suite got wrong, and the contracts said so.** A hand-built
`VerificationRecord` did not satisfy its contract, so every test using it was
passing for the wrong reason — the gate refused it as *invalid* and the test read
that as the refusal it was looking for. They are now built from
`agent/schemas/fixtures.mjs`. A `RegulatoryChange` about a `tool` was refused
because a regulatory change is about the legal record. And the positive half of the
provenance test tried to use a `DataGap` with its blocking question deleted, which
is asserting that a record stops being a gap when you remove the part that makes it
one; it uses a `ClaimEvidence` now.

## The Control Room exposure

One route: `GET /api/workflows`, behind a new `workflows:read` permission that every
role holding `live:read` also holds. **There is no route that starts a workflow,
retries a stage, dispatches an agent or reopens a terminal one, and the absence is
the control** — not a check inside a route, because a check can be moved. The
Control Room does not import the `Orchestrator` class or the event intake, and two
new tests assert both: a server that could construct one could run one.

## Files changed

**New — `agent/orchestrator/`, 12 files:** `capabilities.mjs`, `workflows.mjs`,
`state.mjs`, `events.mjs`, `approval.mjs`, `conflict.mjs`, `policy.mjs`,
`orchestrator.mjs`, `cli.mjs`, `selftest.mjs`, `README.md`, `state/README.md`.

**New — `docs/ORCHESTRATOR.md`**, the reference document.

| File | What |
|---|---|
| `.control-room/authz.mjs` | `workflows:read`, granted to every role that holds `live:read`; `visibleActions().workflows` |
| `.control-room/views.mjs` | `workflowsView()` — the journal, the three registers, and `no_console` |
| `.control-room/server.mjs` | one route, `GET /api/workflows` |
| `.control-room/ui/app.html` · `ui/app.js` | the Workflows tab and its renderer |
| `.control-room/selftest.mjs` | tests 10c and 10d — the window-not-console assertions |
| `agent/implement/checks.mjs` | the orchestrator suite joins `AGENT_SUITES` |
| `agent/implement/selftest.mjs` | **one existing assertion changed** — see below |
| `.github/workflows/qa.yml` | the suite, the three register commands, and one more line in "what this workflow does not prove" |
| `.gitignore` | `agent/orchestrator/state/*`, README negated back in |
| `AGENTS.md` | the read list, the suite list, the test count, the Orchestrator paragraph, and the untracked-directories hazard |
| `docs/AGENT-ROLES.md` | §9 — the role is now filled, and three of its *never* items are mechanical rather than remembered |

**Not modified:** `data/`, `js/`, `css/`, `i18n/`, `fonts/`, `tools/`, every page,
`style.css`, `app.js`, `README.md`, `CLAUDE.md`.

## The one existing assertion that changed

`agent/implement/selftest.mjs` R6 asserts `AGENT_SUITES.length`. It was 15 and is
now 16, because the orchestrator suite joined the list. **The assertion caught the
change**, which is what it is for — its own comment says it had already caught the
list growing once, in SESSION 20, and this is the second time. Nothing was weakened:
the membership check was extended to name `agent/orchestrator/selftest.mjs`
explicitly as well.

No other existing assertion was touched, and no test was deleted, skipped or
relaxed.

## Tests and validators — run, not asserted

**934 across seventeen suites, 0 failures** (867 across sixteen before; SESSION 22
adds 65 in the new suite and 2 to `.control-room/selftest.mjs` — 867 + 67 = 934). No
existing suite's test COUNT changed; one existing ASSERTION did, and it is named
above. 18/18 contracts satisfiable by their fixture.

The four validators are at the `docs/CURRENT-ARCHITECTURE.md` §12 baseline: **0
errors, 0 warnings on `validate.mjs` and `i18n-audit.mjs`, 0 errors and the same
five `design-qa` warnings by file and line, 106 unverified records.**
`node agent/implement/cli.mjs check` reports `at_baseline` on all four.

Both boundary checks: `agent/implement/cli.mjs boundary` at **0 blocking / 11
warnings**, and `.control-room/cli.mjs boundary` at **0 errors**, 21 routes, 8
public, 0 production controls.

The browser suite ran against a real Chromium: **116 pass · 3 fail · 2 undecidable
across 121 checks**. The three failures are the ones SESSION 19 found and nobody has
fixed — issues 25, 27 and 28 — and this session did not touch the interface.

The health monitor ran: 44 metrics, three domains, no overall score, repository
byte-identical afterwards.

The orchestrator suite writes nothing to the repository: it uses a memory journal
throughout, and one test checks `git status --porcelain` from outside for anything
under `agent/orchestrator/state/`.

## What was run against the real stores, and what it found

`node agent/orchestrator/cli.mjs survey` reads the real record store and the real
decision ledger. On this machine it reports **no proposal in the record store** —
`agent/records/` is git-ignored run state, so a fresh clone and a CI runner have
none. The CLI says that in those words rather than printing "0 proposals", because
those are different facts.

One demonstration workflow was opened, with a memory journal, against a proposal id
that does not exist. It ended `human_review_required` with **ten of the twelve
mandatory autonomy conditions failing** and the three routing checks that do not
depend on later stages refusing by name. Nothing was published and nothing was
written.

## Known limitations

Every one is in `docs/ORCHESTRATOR.md` §13 in full. The four worth carrying at the
front:

1. **No specialist has ever been dispatched by the Orchestrator.** Every end-to-end
   path in the suite is driven by a fixture dispatcher. §12.
2. **The capability register is a boundary at the handoff, not process isolation.**
   Nothing stops a module calling `writeFileSync`; this repository has no sandbox
   and the module says so rather than implying a stronger control.
3. **The journal is neither tamper-evident nor private.** `readJournal()` reports a
   sequence gap and cannot prevent one; the directory is git-ignored, and one
   `git add -f` undoes that.
4. **The conflict detector sees six shapes.** Two records can disagree in prose that
   nothing in this repository reads.

## Next session

**SESSION 23 — the autonomy and authorization policy**, then 23.5, the security and
control-plane verification that gates the end-to-end simulation. Three things it
inherits:

- **`APPROVED_AUTONOMOUS_CATEGORIES` is empty and must stay empty until a person
  fills it.** Protocol §24 reserves the decision; an agent appending to that array
  would be taking it. The five categories §20 names are already written down beside
  it, so the decision has somewhere to land.
- **The twelve mandatory conditions are already evaluated and reported on every
  run.** Turning a category on means deciding which of the twelve a given category
  can satisfy, not building the check.
- **The dispatch seam is where SESSION 24's simulation attaches.** A dispatcher
  receives the grant, the event and the records handed to it — never the workflow,
  the journal or the ledger — and its output is validated against its contract and
  then against its grant before it travels.

---

# SESSION 21 — the Control Room

*(the previous milestone, kept for its findings and its refusals. The reference
document is `docs/CONTROL-ROOM.md`.)*

## What was built

A **server**, not a page, at `.control-room/`: 20 routes, 8 of them public and all 8
part of the login surface, every other one authenticating and then authorizing
server-side before it answers. Three views — live system, review queue, website
health — plus an audit trail view and a read-only access view. One state-changing
action in the whole system: approve, reject, request changes.

Zero dependencies, no build step, no `package.json`. `node:http`, `node:crypto`
and the global `fetch`, the same constraints as the rest of the repository.

## The four things this session is arranged around

**1 · THE ONE PUBLICATION BOUNDARY THIS REPOSITORY HAS.** SESSION 18 established
that there is no public/private separation here: GitHub Pages serves `main` at the
repository root with no `_config.yml`, no `.nojekyll` and no exclude list, so
`agent/`, `docs/` and the approval ledger are published beside `index.html`, and
`agent/implement/boundary.mjs` says in its own header that a Control Room page
added to this tree "would be public the moment it was pushed."

The exception, which that module already models and already calls "a real
boundary, and it is the only one this repository has", is Jekyll's documented
default: a path whose segments begin with `.` or `_` is not served. It is why
`.agents/` has never appeared in the published surface and `agent/` always has.
So the Control Room is `.control-room/`, and `node .control-room/cli.mjs boundary`
checks on every push — over the real tree, not by assertion — that it is still
outside.

**No `_config.yml` was added.** Adding one would change how the live site is
processed, on a production website with no deploy gate, to solve a problem the
existing exclusion already solves. That is a Class D change to the deployment and
it is not this session's to make.

**2 · THE DOT PREFIX IS NOT A SECURITY CONTROL, AND NOTHING RELIES ON IT BEING
ONE.** Protocol §10 is explicit that a hidden route, a hidden link, `robots.txt`,
a frontend check and an unlisted page are not security mechanisms. Every
privileged request is authenticated and then authorized whether or not anybody
finds the server; `.control-room/state/` is git-ignored as well; and the suite
proves the request boundary against a **running server over real HTTP**, not by
calling functions. The publication boundary is why a mistake in the request
boundary would not already have published an audit trail — it is the second line,
not the first.

**3 · A DEFAULT IS NOT A CONTROL — SESSION 20's FINDING, TURNED INTO REFUSALS.**
The health monitor measured `agent/observability/server.mjs` and found nine of
eleven privileged routes answering an unauthenticated request, its only protection
being that `host` DEFAULTS to loopback. So every dangerous configuration here is a
**refusal to start**, not a default somebody can override: the development
provider in production; the development provider off loopback in any environment
(two independent refusals, so changing one variable does not get round it); any
non-loopback bind outside production; production without an https origin; OIDC
without an issuer or client id; an insecure issuer in production; an idle timeout
that could never fire; and **an empty operator registry**.

**4 · APPROVAL IS AN AUTHORIZATION, NOT AN IMPLEMENTATION.** Approving writes one
line, to `agent/implement/decisions/decisions.jsonl`, through the same
`recordDecision` the CLI calls — one home for the fact of a decision. It changes
no dataset, no page, no stylesheet, no locale; it runs no validator, no build, no
deployment; it touches no git. `git_ref` on the audit entry is `null` at decision
time **by design**: a value there would mean the approval published something.
Test 10 hashes the whole repository before and after a real approval and asserts
nothing changed.

## What is genuinely proved, and how

Sixteen numbered proofs, each against a running server where the claim is about a
request. Two shapes the suite is arranged to avoid:

- **A test that passes for the wrong reason.** Every negative asserts the status
  AND the reason, and each is paired with a positive proving the same path works
  for somebody who is allowed. An authorization test that only ever sees 403
  cannot tell "correctly refused" from "broken", and three of these tests failed
  in draft for exactly that reason — `fetch` follows redirects by default, so
  `GET /` "answered 200" while actually serving the login page.
- **A test weakened to make a check pass.** The eight synthetic credentials in the
  suite exist to prove the secret scan fires; `boundary.mjs` names the file as one
  of its **two** exemptions — named files, not a directory, so a real key added
  beside them is still found.

**One of the eight was reshaped, and it is worth knowing why.** The planted Slack
token was written in the exact `digits-digits-alnum24` shape a real one has, and
**GitHub's push protection refused the push** — which is a scanner above this
repository's own doing its job, on a value that was synthetic but indistinguishable
from a live one at a glance. It now carries an obviously-not-a-token string after the
`xoxb-` prefix — still matched by `SECRET_PATTERNS`' `slack-token` pattern, which is
what the test is for, and the assertion fails if that ever stops being true. The
literal is deliberately **not** reproduced here: `docs/` IS in the published surface,
and `agent/implement/selftest.mjs` R4 caught the first draft of this paragraph for
exactly that reason — a credential shape in a published file is an error whether or
not it is synthetic. The other seven were not touched, and none of them may be deleted
to make a check clean.

The OIDC provider is exercised against a local stub with a **real RSA key pair**:
a genuine login succeeds, and a forged signature, `alg: none`, HS256, a wrong
issuer, a wrong audience, an expired token and a wrong nonce are each refused by
name. That is a real test of the verification path. It is **not** a test against a
real identity provider, and `docs/CONTROL-ROOM.md` §11 says so first rather than
in a footnote.

## Two existing assertions were changed, and why

Both in `agent/health/selftest.mjs`, and both because **the world changed**, not
because they were inconvenient. Named here so a reader can disagree:

- `control_plane.control_room_availability` asserted `not_applicable` with the
  reason "there is no Control Room. SESSION 21 builds it." There is one now, so
  that reading became a metric asserting the absence of a thing this session
  built. It is `unmeasurable` — nothing here measures whether an instance is
  running — and the new assertion is **stricter**: it requires the metric to say
  that 100% would read as "checked and up", and that a bare reachability probe
  would be worse than none, because a Control Room that is up and answering
  everybody is worse than one that is down.
- `control_plane.authn_authz_failures` asserted `unmeasurable` because "there is
  no login". There is one now, and it logs its decisions, so the metric counts
  refusals from the Control Room audit trail — split into failed logins and
  authorization denials, because **a denial is the authorization layer working**
  and a total invites reading that as a problem. What did **not** change is the
  refusal to report an absent trail as zero: the trail is git-ignored per-machine
  state, so a CI runner and a fresh clone have none, and the new test asserts both
  halves.

One metric's IMPLEMENTATION was also brought into line with its own definition.
`control_plane.privileged_endpoints_exposed` is defined as routes "whose only
protection against public reachability is a default that a caller can override",
and it was counting every interface whose bind host is a parameter. Until this
session nothing in the repository had authentication, so the two could not come
apart. They can now: an interface that authenticates and authorizes is not
protected BY the default. The signal lists were not touched, the planted-failure
tests still fire, and the observability viewer is still counted — the finding
against it is unchanged.

## Files changed

**New — `.control-room/`, 20 files:** `config.mjs`, `identity.mjs`, `authn.mjs`,
`authz.mjs`, `audit.mjs`, `decide.mjs`, `views.mjs`, `server.mjs`, `boundary.mjs`,
`cli.mjs`, `selftest.mjs`, `README.md`, `config.example.env`, `state/README.md`,
and `ui/` (login and app: two pages, two stylesheets, two scripts).

**New — `docs/CONTROL-ROOM.md`**, the reference document.

**Modified, all of it control-plane:**

| File | What |
|---|---|
| `agent/health/security.mjs` | `.control-room/server.mjs` registered in `PRIVILEGED_INTERFACES`; `privileged_endpoints_exposed` brought into line with its definition; `why_zero` on the approval-action metric now names both callers of `recordDecision` |
| `agent/health/control.mjs` | the two metrics above |
| `agent/health/gather.mjs` | `readControlRoomAudit()` — reads the trail **by path, not by import**, so the monitor cannot be prevented from running by the thing it measures |
| `agent/health/selftest.mjs` | the two changed assertions, and `control_room_audit` in `fakeCtx` |
| `agent/implement/boundary.mjs` | `.control-room/` added to `CONTROL_PLANE_DIRS` — it reports as excluded by the deployment, which is the first control-plane directory that has ever done so |
| `.github/workflows/qa.yml` | the suite, the Control Room boundary check, the route table, and two more lines in "what this workflow does not prove" |
| `.gitignore` | `.control-room/state/*`, README negated back in |
| `AGENTS.md` | the read list, the suite list, and three hazards that were no longer accurate |

**Not modified:** `data/`, `js/`, `css/`, `i18n/`, `fonts/`, `tools/`, every page,
`style.css`, `app.js`, `README.md`, `CLAUDE.md`.

## Tests

**867 across sixteen suites, 0 failures** (812 across fifteen before). 55 are new;
no existing test count changed. 18/18 contracts satisfiable by their fixture. The
four validators are at the `docs/CURRENT-ARCHITECTURE.md` §12 baseline: 0 errors,
106 unverified, the same five `design-qa` warnings by file and line, and the
boundary check at 0 blocking / 11 warnings.

The Control Room suite writes nothing to the repository: temporary state, record
and ledger directories per test, verified from outside by `git status` afterwards.

## A discrepancy found and NOT reconciled

`docs/CURRENT-ARCHITECTURE.md` §13 still says "**No CI.** There is no `.github/`
directory, no workflow". `.github/workflows/qa.yml` has existed since SESSION 19,
and `AGENTS.md` says "There is now CI." The two disagree. It is reported here
rather than edited, because AGENTS.md's rule is to stop and report a conflict
between the documentation and the code rather than reconciling it silently, and
because §13 is not this session's section. The same paragraph's other claims —
Pages serving `main` from the root, no `_config.yml`, no `.nojekyll` — were
re-read against the tree and are **still true**, which matters because the
Control Room's placement depends on them.

## Known limitations

Every one of these is in `docs/CONTROL-ROOM.md` §11 in full. The four worth
carrying at the front:

1. **No real identity provider has ever been contacted**, and this environment's
   network policy means none could. Refresh tokens, back-channel logout, token
   revocation and `end_session` are not implemented.
2. **No deployed Control Room has ever been reached.** The suite starts one on an
   ephemeral loopback port. `control_plane.control_room_availability` reports
   `unmeasurable` for exactly this reason.
3. **The publication boundary is inferred, not confirmed.** It follows from Pages'
   documented default and from reading the tree; the deployed origin has never
   been fetched (the same limitation as AUDIT F-12, one layer down).
4. **Nothing here has been penetration-tested**, there is no rate limiting and no
   account lockout. Under OIDC both belong to the identity provider; under the
   local provider they are absent, which is one more reason it may not serve
   production.

## Next session

SESSION 22 — the Master Orchestrator. Two things it inherits:

- **The Control Room is not a command console, and §14 of the protocol says the
  Orchestrator must not treat a UI action as unconditional authority.** What the
  Control Room produces is a governed event: a line in the decision ledger, bound
  to a proposal hash, attributable to an authenticated actor. The Orchestrator
  re-derives it — `deriveApproval()` already does, and already discards
  agent-written approval claims by name.
- **`decide.mjs` runs the Implementation Agent's own gates before granting**, so a
  proposal that cannot be implemented cannot be approved. If the Orchestrator
  grows a path that bypasses `preflight()`, that property is gone.

---

# SESSION 20 — the Website Health Monitor

*(the previous milestone, kept for its findings and its refusals. The reference
document is `docs/HEALTH-MONITOR.md`.)*

## What was built

The eleventh agent, and the first whose subject is the SYSTEM rather than any part of it:
the site a reader loads, the corpus that site argues from, and the machinery that produced
both. `docs/AGENT-ROLES.md` §10 has described the Observability role since SESSION 01;
`agent/observability/` gave it a trace model, and this gives it the numbers.

**Forty-four metrics across three domains that are never summed.** 10 public website, 10
knowledge, 24 control plane — the last including the seven security-boundary checks, filed
there because that is what they protect.

## The three refusals this session is built around

**1 · THERE IS NO OVERALL SCORE.** `agent/health/model.mjs` exports `overallScore()`, and it
**throws**, with the reasoning, at the exact place somebody would reach for one. The three
domains fail differently: a broken link costs a reader a click, a false statement about EU
law costs them a decision they cannot take back, and an unaudited approval costs the system
its provenance and is invisible to every reader. A mean says none of that and invites raising
the number by improving the cheapest domain. The refusal is also recorded as a decision on
every run's trace, with the three alternatives that were not taken, so it can be seen to have
held rather than taken on trust.

**2 · `unmeasurable` IS NEVER ZERO.** Three states — `measured`, `unmeasurable`,
`not_applicable` — and an unmeasurable carries a **null** value, a `why`, and what would be
needed. Two metrics can never be measured here and reporting either as 0 would be the exact
substitution `AI-SAFE-BOUNDARIES` §0.3 and §0.4 prohibit:

- **Deployment failures.** No telemetry, and nothing has ever fetched the deployed origin —
  the network policy refuses it.
- **Authentication failures.** A 0 would read as "no failed logins" when the truth is "there
  is no login". The metric points at the MISSING CONTROL instead, which is where a missing
  control belongs.
- **Control Room availability** is `not_applicable`: SESSION 21 builds it, and neither 0% nor
  100% would be true. `agent/observability/server.mjs` is a development viewer, and calling
  it a Control Room would overstate both what exists and what is protected.

Six more public-website metrics report unmeasurable whenever the browser suite did not run. A
report saying "0 console errors" because nobody opened a page would be the worst line this
monitor could produce.

**3 · A LOWER NUMBER IS NOT AUTOMATICALLY HEALTHIER.** Five metrics carry
`direction: 'not_a_score'`, and `defineMetric` **throws** if one is re-labelled — the
unverified count, the provenance gaps, the verification gaps, the blocking open questions and
the rejected proposals. Every cheap route down is a prohibited action under
`AUTONOMY-POLICY.md`: clearing `requires_verification`, attaching a plausible substitute,
bulk-stamping `last_verified`, removing a `blocks` flag. **A rise in the first four is usually
good news** — it normally means somebody examined a record nobody had examined. The CLI marks
them `=` rather than `!`, `summarise()` counts them apart from findings, and `movement()`
reports them in a list that never says "improved".

## Every metric declares eight things, and the model refuses one that does not

Name, definition, source, calculation, update frequency, interpretation, limitations, and
public-or-private — all mandatory, all checked at definition time, so SESSION 20's
requirement is a gate rather than a convention. `limitations` is never empty and the suite
asserts it is longer than a fragment: a metric that cannot say what it fails to see is a
number somebody will quote out of context.

`node agent/health/cli.mjs --metrics` prints the whole register and runs nothing.

## What it found

**PUBLIC WEBSITE** — 9 measured, 1 unmeasurable. Three findings, all already known: 3 browser
regressions, 2 accessibility failures, 1 navigation failure — issues 25, 27 and 28.

**KNOWLEDGE** — 10 measured. Evidence coverage 76.9% of 91 claims. 106 unresolved records,
matching §12 exactly. **15 facts stored in two places with no drift check, one already
drifted** — the `__CONTENT__` hazard AGENTS.md has recorded since SESSION 00, now MEASURED
rather than recalled. 1 contradictory record: issue 18, `rel-kind:complement`. 6 fact-typed
claims whose evidence cannot carry a fact.

**CONTROL PLANE** — 0 agent failures, 0 policy violations, 0 self-approved decisions, 0
misclassified proposals, **0 changes ever applied to the legal record by an agent.**

## The security finding

`agent/observability/server.mjs` serves **eleven `/api/` endpoints** over the whole trace
store — agent inputs and outputs, decisions, approvals, provenance — and performs **no
authentication and no authorization on any of them**. Its only control is that `host`
DEFAULTS to `127.0.0.1`.

**A default is not a control.** `serve({ host })` accepts any value; a caller passing
`0.0.0.0` exposes the entire store with nothing in the request path to object. The monitor
does not infer this: it starts the server on an ephemeral loopback port and asks each route
with no `Authorization` header and no cookie. **Nine of the eleven return data**, two of them
tens of kilobytes. Nothing returns 401, because nothing asks.

That is defensible for a local development viewer, which is what its own header says it is.
It is recorded because **SESSION 21 builds a Control Room**, and one that reused this server
would inherit a privileged API whose only protection is a default somebody can override.

### The false positive that shaped the check

The first draft of `AUTHZ_SIGNALS` counted a bare `403` and reported the server as HAVING
server-side authorization — on the strength of `json(res, { error: 'forbidden' }, 403)` for a
path resolving outside the viewer directory. **That is a path check.** It refuses a traversal
and makes no decision about who the caller is, and counting it turned the largest finding in
the file into a pass. A status code is not a control. The suite now plants exactly that
server and asserts `has_authz` is false.

## A correction to SESSION 18

`publicSurface()` walked the filesystem. Publication is **GitHub Pages serving `main`**, and
`main` carries **tracked files only** — a git-ignored run artifact has never been in a commit
and is not published. The walk reported `agent/records/`, `agent/observability/runs/` and this
session's own health history as PUBLISHED, which is a false alarm, and a security check that
cries wolf about three directories on every run is one people learn to ignore.

It now reads `git ls-files`, reports untracked files separately, distinguishes "excluded by
the deployment" from "absent because nobody committed it", and falls back to the walk **saying
so** when git cannot be consulted — overstating the surface is the safe direction.

**`agent/health/selftest.mjs` found this** by asserting the health record was not in the
published surface, and finding it there.

## Public and private

`publicSubset()` is a **whitelist**. Three deliberate acts are needed before anything
operational reaches a public view: set `visibility`, write a `public_justification`, and pass
the definition gate — which refuses a control-plane metric marked public without one. The
rejected alternative was a `redact()` stripping known-sensitive fields; its failure mode is a
new private metric nobody adds to the deny list, public by default. The whitelist's failure
mode is a public metric left private: a report nobody sees rather than a leak.

**22 publishable, 22 withheld, 0 leaked.** Only two control-plane metrics are public —
proposals awaiting a human, and changes an agent has applied to the site (0, and a reader of a
site about EU law is entitled to know it). `publicReading()` drops `detail` and `evidence`
WHOLESALE rather than filtering named keys, and the suite checks for leaks over the SERIALISED
view rather than the structure, because a structural check verifies the shape somebody wrote.

## The historical record

`agent/health/history/health.jsonl`, append-only, **git-ignored** — and that is a boundary
decision, not a convention: it holds private control-plane data, and this repository publishes
its whole tree. A `.gitignore` entry is not a security boundary and `agent/health/` says so
rather than pretending otherwise.

`movement()` compares against the previous entry with one rule doing most of the work: **a
metric is compared only where both entries measured it.** Comparing a run that had a browser
against one that did not would report six improvements or six regressions depending on which
way round they fell, and both would be fabrications.

## Files changed

```
agent/health/model.mjs            (new — the metric contract, three states, the score refusal)
agent/health/gather.mjs           (new — the evidence once, and the loopback probe)
agent/health/public.mjs           (new — 10 metrics)
agent/health/knowledge.mjs        (new — 10 metrics)
agent/health/control.mjs          (new — 17 metrics)
agent/health/security.mjs         (new — 7 checks, and the route/auth analysis)
agent/health/metrics.mjs          (new — the registry and the public subset)
agent/health/history.mjs          (new — the historical record and movement)
agent/health/monitor.mjs          (new — Agent 10)
agent/health/cli.mjs              (new)
agent/health/selftest.mjs         (new — 55 tests)
agent/health/README.md · agent/health/history/README.md   (new)
docs/HEALTH-MONITOR.md            (new — the reference document)

agent/implement/boundary.mjs      (publicSurface reads git ls-files — the correction above)
agent/implement/checks.mjs        (the health suite joins AGENT_SUITES)
agent/implement/selftest.mjs      (R5 sharpened for the new surface model)
agent/observability/server.mjs    (a `quiet` option, for the probe)
agent/observability/query.mjs     (healthState, into loadTrace)
agent/observability/cli.mjs       (the `health` command)
.github/workflows/qa.yml          (the health job)
.gitignore                        (agent/health/history/, with the reason)
AGENTS.md · docs/AGENT-ROLES.md · docs/HANDOVER.md
```

**Not touched:** every `data/*.json`, every page, everything under `js/`, `css/`, `i18n/` and
`fonts/`, all four validators in `tools/`, `style.css`, `app.js`, `README.md`, `CLAUDE.md`,
and every contract in `agent/schemas/`.

## Tests

| Command | Result |
|---|---|
| `node --test agent/health/selftest.mjs` | **55 pass · 0 fail** (new) |
| `node --test agent/implement/selftest.mjs` | **55 pass · 0 fail** (54 before; R5 gained a test for the corrected surface model) |
| `node --test agent/schemas/selftest.mjs` | 139 — unchanged |
| `node --test agent/ux/selftest.mjs` | 73 — unchanged |
| `node --test agent/detector/selftest.mjs` | 66 — unchanged |
| `node --test agent/integrate/selftest.mjs` | 64 — unchanged |
| `node --test agent/proposals/editorial/selftest.mjs` | 61 — unchanged |
| `node --test agent/architect/selftest.mjs` | 52 — unchanged |
| `node --test agent/proposals/data/selftest.mjs` | 50 — unchanged |
| `node --test agent/verifier/selftest.mjs` | 45 — unchanged |
| `node --test agent/depth/selftest.mjs` | 43 — unchanged |
| `node --test agent/observability/selftest.mjs` | 40 — unchanged |
| `node --test agent/scout/selftest.mjs` | 32 — unchanged |
| `node --test agent/browser/selftest.mjs` | 19 — unchanged |
| `node --test agent/scout/schedule/selftest.mjs` | 18 — unchanged |
| `node agent/schemas/cli.mjs check` | **18/18** satisfiable, exit 0 |
| `node tools/validate.mjs` | **0 errors, 0 warnings, 106 unverified** — matches §12 exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs 2026-09-03` | "Nothing past its stated interval" |
| `node agent/observability/cli.mjs validate` | 0 invalid records from this session's real runs |

**812 tests across fifteen suites, all passing** (756 before this session).

The extra test beyond 756 + 55 is in `agent/implement/selftest.mjs`: R5 gained a check that
the published surface is what git tracks rather than what is on the machine, which is the
correction described under "A correction to SESSION 18" above.

Also run as live verification: `node agent/health/cli.mjs --as-of 2026-09-03` (44 metrics),
`--metrics`, `--public`, `--history`, `--no-browser`, and
`node agent/observability/cli.mjs health --readings`.

## Known limitations

1. **The monitor measures what this repository can see, which is less than what matters.**
   Nothing has fetched the deployed site, no URL has been retrieved, no source document
   opened, no screen reader run, no contrast computed.
2. **Nine metrics report `unmeasurable` in a typical run.** That is the honest state, not a
   gap in the work — but a reader skimming the numbers must read the coverage line, and the
   history stores it for exactly that reason.
3. **The knowledge metrics check the SHAPE of evidence, not what a source says.** A claim
   typed as a fact with a tier:1 source that does not support it passes every check here.
4. **The security checks read source and match signals.** A mechanism they do not recognise
   reads as absent — a false positive, the safe direction, and one the suite tests for by
   planting a server that DOES authenticate.
5. **`PRIVILEGED_INTERFACES` is an allowlist.** A new server nobody registers is not checked.
6. **`incomplete_entities` overstates and `duplicate_facts` understates**, each for a reason
   stated in its own `limitations`.

## Unresolved issues, carried forward

SESSION 19's 1–31 stand unless noted.

2. **No deploy gate — PARTIALLY MOVED.** The validators now run in CI on every
   push (`.github/workflows/qa.yml`, SESSION 18), so a failure is **visible**.
   There is still nothing between a push to `main` and the live site: making the
   workflow blocking needs a branch protection rule, which is repository
   configuration outside this tree and outside any agent's reach.
5. **106 records carry an unverified note.** No session since SESSION 07 has
   moved it; this one does not either.
7. The Source Scout workflow has still never executed on GitHub Actions.
12. `GOVERNANCE_PERMITS` is empty and nothing in `docs/` opens it.
15. Fourteen gap-router proposals exist and nothing decides them.
16. Twenty architecture proposals exist and nothing decides them.
18. `rel-kind:complement` is stored as both symmetric and asymmetric. Still the
    cheapest real decision on the list.
19. Twenty-two editorial recommendations exist and nothing decides them.
20. The markup and `data/claims.json` disagree about what two passages are.
21. Nineteen sentences read as settled over claims graded Unresolved.
23. **New: ten UX findings and five testable proposals exist and nothing decides
    them.** Each is behind a pending approval. **They are proposals, not a work
    order**, and five of them are `human_only` because they change what a reader
    sees on a site with no deploy gate.
24. **New: nine components draw a status this agent could not establish is
    legible without colour.** Not a defect and not a clearance — an open
    question, and the only thing that closes it is somebody opening the page.
    `node agent/ux/cli.mjs --as-of <date> --open` lists them with the bytes.
25. **The site has no navigation in its markup, and the `<noscript>` notice does
    not say so — NOW MEASURED.** SESSION 17 established it by reading the source;
    SESSION 19 loaded `instruments.html` with scripting disabled and confirmed it
    links to none of the six top-level pages. Still not fixed: Class C interface
    work needing a proposal and a decision.
26. **New: `index.html` has no pre-paint theme bootstrap.** The six tool pages
    carry one inline; the brief consults `prefers-color-scheme` in `app.js`
    instead. Noticed while narrowing question 2's false positive and NOT filed
    as a finding — no lens establishes what it costs a reader, and filing it
    would have been an observation dressed as a measurement. Recorded here so the
    next session can decide whether it is one.

27. **New: the skip link is the tenth focusable element in the RENDERED page.**
    Every page carries `<a class="skip-link">` as the first element in `<body>`
    and `design-qa.mjs` confirms it resolves — but `js/shell.js:258` inserts the
    chrome at `document.body.firstChild`, ahead of it. A keyboard reader must tab
    through the whole navigation to reach the link that skips the navigation.
    Invisible to every validator here, because the markup is correct.
    `node agent/browser/cli.mjs --only keyboard`.

28. **New: `enforcement.html` jumps h2 → h5 in its rendered outline.** Each
    pipeline stage renders as an `<h5>` directly under the `<h2>` naming the
    company. `design-qa.mjs` checks heading order in the markup, where those
    headings do not exist — `js/enforcement-page.js` creates them.

29. **New: the whole repository is inside the public deployment.** GitHub Pages
    serves `main` at the repository root with no `_config.yml`, no `.nojekyll`
    and no exclude list, so `agent/`, `docs/` and the approval ledger are
    published alongside `index.html`. **A Control Room page added in SESSION 21
    would be public the moment it was pushed.** This is an INFERENCE from GitHub
    Pages' documented default — nothing here has ever fetched the deployed site,
    and the network policy refuses that origin.
    `node agent/implement/cli.mjs boundary`.

30. **New: the approval ledger is not authentication.** Anybody who can write to
    the working tree can write a grant. It gives one hashed home, git
    attribution, and a refusal of the four forgeries that do not need write
    access — and no more than that. Protocol §11 and §13 want an authenticated
    actor and server-side enforcement, which a static site cannot host.
    `docs/IMPLEMENTATION-QA.md` §9.

32. **New: the privileged API has no authentication and no authorization.**
    `agent/observability/server.mjs` serves eleven `/api/` endpoints over the
    whole trace store and checks nothing; its only control is a bind host that
    DEFAULTS to loopback, and a default is not a control. Measured, not inferred:
    the health monitor starts it on an ephemeral loopback port and finds **nine of
    the eleven return data to a request with no credential**. Defensible for a
    development viewer; **SESSION 21's Control Room must not inherit it.**
    `node agent/health/cli.mjs --as-of <date> --detail`, `docs/HEALTH-MONITOR.md` §6.

33. **New: 15 facts are stored in two places with no drift check, and one has
    already drifted.** The fourteen part titles and the standfirst exist in both
    `data/brief.json` and the `__CONTENT__` blob inlined at `index.html:361`, and
    `meta.standfirst` disagrees between them. AGENTS.md has carried this as a
    hazard since SESSION 00; it is now MEASURED rather than recalled, by
    `knowledge.duplicate_facts`. Still not fixed, and still not a work order.

34. **New: 6 fact-typed claims have evidence that cannot carry a fact** — no
    source, `supports:context` only, or the self-reference placeholder. A claim
    typed as a fact renders as law on the site.
    `knowledge.unsupported_factual_statements`.

35. **New: `.gitignore` is doing the work of a publication boundary for three
    directories.** `agent/records/`, `agent/observability/runs/` and
    `agent/health/history/` all hold control-plane data and are absent from the
    deployment only because nobody committed them. One `git add -f` undoes it and
    nothing in this repository would object. Distinct from issue 29, which is
    about there being no exclusion mechanism at all.

31. **Two UX proposals now assert something that is no longer true.**
    `agent/ux/proposals.mjs` writes "this repository has no browser harness and
    no dependency budget for one" into the open question on every browser test it
    proposes. SESSION 19 built one, with no dependency budget spent. The sentence
    was accurate when written and is not now. **Not edited here** — rewriting
    another agent's recipe to change what its records assert is exactly the
    scope-widening Agent 9 exists to refuse, and it is Agent 8's own file. It
    needs a one-line change in `agent/ux/proposals.mjs` and a re-run.

## Next session

**A — decide something.** Unchanged and now four sessions old. Seventy-one proposals across
four agents, not one decided. SESSION 18 built somewhere for a decision to land:

```
node agent/implement/cli.mjs queue --why
node agent/observability/cli.mjs implement --refusals
node agent/implement/cli.mjs decide --proposal <id> --grant --by "<your name>"
node agent/implement/cli.mjs run --as-of <date> --proposal <id>            # rehearse
node agent/implement/cli.mjs run --as-of <date> --proposal <id> --apply
```

Most proposals fail three gates besides `approved`, and two of those cannot be closed by a
decision at all. Issue 18 remains the cheapest real decision: one field, five records, one
word — and `knowledge.contradictory_records` now reports it on every health run.

**B — dispatch the Source Scout workflow on a real runner.** Unchanged since SESSION 06.

**C — the applied half.** Half-closed since SESSION 18: `ChangeRecord` is produced whenever
something is applied, and nothing has been applied because nothing has been approved.
`WebsiteChange` is still produced by nothing.

**D — do the manual pass.** The perceptual open questions — contrast, screen readers, what a
layout looks like — need a person. `.agents/skills/ux-audit/references/manual-checks.md`.

**E — fix the three defects the browser found**, or decide not to. Issues 25, 27, 28.

**F — new, and it is SESSION 21's problem before it is anybody's: do not let the Control Room
inherit the unauthenticated API.** Issue 32. `agent/observability/server.mjs` has eleven
privileged routes, no authentication, no authorization, and a bind host that is a parameter
with a loopback default. Nine of them answer an unauthenticated request today. A Control Room
built on it would be the failure protocol §11–§13 describes, and the health monitor would
report it on every run — which is not the same as preventing it.

### Exact next objective

**F**, then **A**.

F is SESSION 21's own subject and the monitor has already written the acceptance criteria: a
Control Room is done when `control_plane.privileged_routes_without_auth` and
`control_plane.privileged_routes_without_authz` reach 0, when
`control_plane.privileged_responses_without_authorization` reaches 0, and when
`control_plane.control_room_availability` stops being `not_applicable` **without**
`control_plane.control_room_assets_published` rising above 0. Run

```
node agent/health/cli.mjs --as-of <date> --detail
node agent/health/cli.mjs --as-of <date> --series control_plane.privileged_routes_without_auth
```

before and after. The second command is why the history exists.

A is unchanged and needs no code. Start with the cheapest decision on the list and watch the
whole chain run.

The full chain, every step carrying `parent_run_id`:

```
node agent/verifier/cli.mjs             --records <trace-id>
node agent/integrate/cli.mjs            --records <trace-id> --as-of <date>
node agent/detector/cli.mjs             --records <trace-id> --as-of <date>
node agent/depth/cli.mjs                --as-of <date> --changes <trace-id>
node agent/proposals/data/cli.mjs       --as-of <date> --gaps <depth-trace-id> --refusals
node agent/architect/cli.mjs            --as-of <date> --gaps <depth-trace-id> --aside
node agent/proposals/editorial/cli.mjs  --as-of <date> --changes <detector-trace-id> --no-change
node agent/ux/cli.mjs                   --as-of <date> --propose --open
node agent/browser/cli.mjs
node agent/implement/cli.mjs            run --as-of <date>
node agent/health/cli.mjs               --as-of <date>
node agent/observability/cli.mjs        health --readings
```

## Anything the next agent must know

**SESSION 24's, first:**

- **A simulated pass is not evidence.** Every leg of `agent/simulation/` is driven by a
  fixture dispatcher. If you find yourself citing a green leg as proof that the Scout
  works, the Verifier works, or the site is correct, you are citing the machinery having
  routed a fixture.
- **A simulated `QAResult` is indistinguishable from a measured one downstream.** That is
  finding A-4 and M-4, and it is the reason the browser dispatcher is the one to distrust
  most. The real browser suite was run for the discovery path only.
- **The twenty-three findings are not a work order.** Protocol §25 asked SESSION 24 to
  observe rather than repair, and every one of them is a change to `agent/` that needs its
  own reasoning. Several are load-bearing in ways a quick fix would break: `allowSimulated:
  true` (V-1) is what lets every existing suite drive the Orchestrator with fixtures, so
  removing it breaks nineteen suites before it fixes anything.
- **`agent/simulation/selftest.mjs` asserts the DISCIPLINE, not the findings.** It asserts
  that the tree is byte-identical, that no dispatcher can write, that every fixture is
  marked, that nothing was published, and that three visual phases do not match. It does
  **not** assert V-1, V-2, V-3, I-1 or I-2 — pinning a defect turns it into a requirement.
- **The count of three mismatched visual phases IS asserted.** If you implement phase 2 or
  phase 5, `selftest.mjs` test 6 fails and you come here and say so. That is the assertion
  doing its job, the same way R6 does.
- **The one unmarked record in the whole harness is `unmarkedControlFixture()`**, and it
  exists because `preflight` gate 2 refuses a simulated proposal. It lives in a `mkdtemp`
  record store, it is never offered to `data/`, and its reason is finding V-1 in the audit
  rather than a convenience in the code.

**SESSION 21's:**

- **`git fetch --all` before comparing anything, and compare against
  `origin/main`.** Local `main` on this machine is 52 commits behind. The trap in
  AGENTS.md has now caught something in three separate sessions.
- **An approval is an authorization for a scope, and nothing else happens.** If
  you find yourself expecting the site to change because somebody clicked
  Approve, read `docs/CONTROL-ROOM.md` §6: the Implementation Agent re-derives the
  authorization from the ledger through its own ten gates, and no proposal in this
  repository has ever been decided.
- **A decision is bound to the proposal's fingerprint.** Editing a proposal after
  it was approved VOIDS the approval — deliberately, because it is what stops
  approving something small and then widening it. The fix is a fresh decision
  against the scope the proposal now has, never a re-hash.
- **Roles are re-read from the registry on every request**, not taken from the
  session. `roles_at_login` exists for the audit trail and is never used for a
  decision. If you cache the actor, you have removed that property.
- **The Control Room audit trail is private per-machine state.** It is git-ignored
  and does not travel with a checkout, which is why
  `control_plane.authn_authz_failures` reports `unmeasurable` in CI rather than 0.
  A 0 there would read as "nobody was turned away".
- **The suite proves the boundary behaves as specified.** It proves nothing about
  whether a proposal a human approved through it was a good idea — which is the
  whole reason the human is there. `docs/CONTROL-ROOM.md` §11 has the rest.

Carried forward:

- **`agent/ux/` opens no page, and every record says so in a blocking open
  question.** If you are tempted to soften that — to write "screen readers
  announce this as…", to fill in a contrast ratio from a comment in
  `css/tokens.css`, to describe how something looks — you are making this
  project's own honesty worse than whatever you found. `boundary.mjs` refuses
  the phrasing and the suite proves the refusal fires.
- **An open question is a deliverable, and there are more of them than
  findings.** Deleting one to shorten a report turns "could not be settled
  without opening a page" into "nothing there".
- **A count is not a quote.** Two lenses filed a composed sentence behind a real
  `file:line` and the suite's byte-check caught both. `measurement` is the kind
  for a count, and the locator says what was counted over.
- **The three false positives above are why the checks are shaped as they are.**
  Tokenised class matching, both attribute syntaxes, and "mixed is undecidable"
  each exist because a draft without them reported a defect that was not there.
- **The hypothesis is the one thing in this directory that is not derived**, and
  it is typed as a contested interpretation for that reason. A recipe per lens is
  where it lives; a finding whose lens has no recipe is refused rather than
  improvised.
- **`asOf` is an argument, everywhere.** Unchanged.
- **An `ApprovalRequest` you find in `agent/records/` is a REQUEST.** Agents write
  that directory. If you are tempted to read one whose `state` says `granted` and
  act on it, that state was written by an agent, and `agent/implement/ledger.mjs`
  discards it and says so. A grant lives in `agent/implement/decisions/` and
  requires a named human.
- **A grant is bound to the proposal's hash.** Editing a proposal after it was
  approved VOIDS the approval. That is deliberate — it is what stops approving
  something small and then widening it — and the fix is a fresh decision against
  the scope the proposal now has, never a re-hash.
- **A skipped browser run is never a pass.** `agent/browser/cli.mjs` exits 2 when
  it found no browser, and `agent/implement/` treats a required-but-skipped run as
  a blocking finding. If you find yourself making either of those exit 0 to get a
  green pipeline, you are building the thing the exit code exists to prevent.
- **The eight synthetic credentials in the redaction fixtures are load-bearing.**
  A suite that proves redaction works has to contain something to redact. Do not
  delete them to make `boundary` clean — that is weakening a test to make a check
  pass — and do not allow-list the files, which would hide a real key added to one
  of them later. They are classified and counted.
- **The baseline in `agent/implement/baseline.mjs` is PARSED out of
  `docs/CURRENT-ARCHITECTURE.md` §12.** If you change the numbers there, this
  follows automatically. If you restructure the fenced block so it cannot be read,
  `readBaseline()` throws — on purpose. Do not add a fallback default.
- **A number is not a verdict, and five of them must never be optimised.** The unverified
  count, the provenance gaps, the verification gaps, the blocking open questions and the
  rejected proposals are marked `not_a_score`. If you find yourself trying to move one of
  them, read `docs/HEALTH-MONITOR.md` §4 first: every cheap route down is a prohibited
  action, and a RISE in the first four usually means somebody did real work.
- **`unmeasurable` is not zero, and the monitor will not let you write it as one.** Nine
  metrics report it in a typical run. If you are tempted to make one return 0 so the report
  looks cleaner, you are proposing to report an absence of instrumentation as an absence of
  problems.
- **There is no overall health score and there must not be one.**
  `agent/health/model.mjs overallScore()` throws on purpose. The three domains fail
  differently and a mean says none of it.
- Before declaring anything done: the fifteen `--test` suites,
  `agent/schemas/cli.mjs check`, then the four validators in `tools/`, compared
  against the `docs/CURRENT-ARCHITECTURE.md` §12 baseline — and
  `node agent/browser/cli.mjs` if you touched a page, a stylesheet, a module or a
  locale.

## Anything the next agent must NOT change

**SESSION 29's, first:**

- **Do not make a mandatory readiness condition non-blocking when it is `unmeasurable`.** That
  rule is what makes `--quick` useless for a real report, and relaxing it turns "we did not
  look" into "nothing was wrong". `agent/production/selftest.mjs` asserts it over every
  mandatory condition, one at a time.
- **Do not give `agent/production/` a verb that writes, records, decides or activates.** The
  absence of the verb is the control; a check inside one can be moved. The suite reads the CLI
  and refuses `decide`, `apply`, `grant`, `record`, `activate`, `deploy` and `publish` by name,
  and `--execute`, `--force` and `--record` as flags.
- **Do not add a readiness score.** `assessActivation()` returns `overall_score: null` for the
  reason `agent/health/model.mjs overallScore()` throws: ten domains that fail differently do
  not have a mean, and one number on a checklist invites somebody to move the number.
- **Do not pin a readiness condition's real-world verdict in the suite.** The refusal is driven
  with synthetic facts on purpose. Asserting "the adversarial gate is red" or "no dispatcher is
  wired" makes a defect a requirement and its repair a test failure.
- **Do not silence a classifier by excluding a file path.** `separations.mjs` classifies and
  reports every file, and the suite asserts that it names neither `selftest.mjs` nor
  `policy/verify` in its executable code. HE-04's three path exclusions are the failure mode
  this is arranged against.
- **Do not delete the `no_path_found` verdict.** Collapsing three states into two forces either
  "cleared" over a file that can grant, or "uncleared" over the policy suite and the adversarial
  gate for doing their job. A path not found is not a path proven absent.
- **Do not remove the `fixture` position, the comment mask, the string mask or the regex mask.**
  Each exists because a draft without it reported a module's own denial as a security finding,
  and each has a test pinned to the exact input.
- **Do not change the hidden entry to make a visual criterion pass.** All ten pass on a tree
  where `js/threshold.js` and `style.css` are byte-identical to `a25f0ed`. If a criterion ever
  fails, the question is whether the criterion or the module is wrong, and both answers are a
  person's.
- **Do not edit `agent/policy/verify/attacks.mjs` HE-04 on your own initiative.** It is red, it
  is very probably a false positive, and SESSION 29 measured why. Correcting it means editing a
  CRITICAL attack, and the proposed fix is the stale exclusion list SESSION 23.5 already had to
  correct once.
- **Do not make `.github/workflows/qa.yml`'s `security` job pass by narrowing what it runs.**
  The job exists to make a red thing visible. A green tick bought by running less is the thing
  its own five-session history is about.

Carried forward, still binding. **SESSION 24's:**

- **Do not implement the brief's phase 6 literally.** "Reveal CONTROL ROOM followed by the
  normal authentication interface" must never become a login form on a published page. A
  credential prompt in the public tree is a phishing surface and a second home for a login
  that `.control-room/` already serves behind its own origin. The refusal is written into
  `VISUAL_SEQUENCE` phase 6's `must_not`, and `agent/simulation/selftest.mjs` test 6
  asserts no `.html` file here carries a `type="password"` field. Do not delete either.
- **Do not give a simulation dispatcher the ability to write, spawn or fetch.** Test 1
  reads `dispatchers.mjs` and refuses the eight primitives by name. A dispatcher that could
  write is a simulation that could change production.
- **Do not delete the tree fingerprint.** "This run changed nothing" is the only claim the
  harness makes about production, and it is a measurement. An assurance in its place would
  be worth nothing.
- **Do not turn a finding into an assertion.** `agent/simulation/selftest.mjs` deliberately
  asserts none of the twenty-three. Pinning one makes the defect a requirement and the fix
  a test failure.
- **Do not clear the `simulated` mark on anything but the one control fixture**, and do not
  move that fixture out of `mkdtemp`. It is the one place in this repository where a record
  claims not to be simulated when it is, it is in the open with its reason, and it never
  touches the tree.
- **Do not describe SESSION 24's run as an end-to-end execution of the agents.** It is an
  end-to-end execution of the ROUTING. `docs/ORCHESTRATOR.md` §13 now says so in the same
  words, and softening it would make the strongest claim in that document false.

**SESSION 21's:**

- **Do not put a Control Room page in the published tree.** Not under `docs/`, not
  at the root, not as an `admin.html`. The dot prefix is the only publication
  boundary this repository has, and a page outside it is public the moment it is
  pushed — linked or not. If a future session needs a broader boundary, that is a
  `_config.yml` exclude list, which changes how the live site is processed and is
  a Class D deployment change, not a convenience.
- **Do not add a default account, a seeded administrator, or a "first run"
  bootstrap that creates one.** The refusal to start with an empty registry is the
  feature. Protocol §11 forbids `"admin"` / `"admin"` or any equivalent from
  existing at all, so none may be created either.
- **Do not let the interface become the authority.** `visibleActions()` is
  cosmetic and says so in its own header. Every privileged request is authorized
  server-side, and test 5 sends the request a hidden button would have prevented.
- **Do not add a route that can deploy, delete, apply, publish or execute.**
  `PROHIBITED_ROUTE_WORDS` and test 10b make that a failing check rather than a
  discussion, and `server.mjs` deliberately imports nothing that could write to
  the tree — no `child_process`, no `writeFileSync`, not the applier.
- **Do not add a second writer of a grant.** `recordDecision` has exactly two
  callers and one home. A third would put the fact of a decision in two places.
- **Do not make `request_changes` a ledger state.** It is a review annotation, it
  leaves `deriveApproval()` reporting `pending`, and that is what is true.
- **Do not relax `DECIDABLE_STATES`.** Approving over a denial through the same
  endpoint makes the denial advisory.
- **Do not remove the strict unknown-field check on the review body.** Silently
  ignoring an unexpected field is safe today and stops being safe the first time
  somebody adds a field with that name. It is what makes "scope cannot be expanded
  through request manipulation" a refusal rather than a hope.
- **Do not let the local development provider out of loopback development.** Both
  refusals are load-bearing; removing either leaves the other looking sufficient.
- **Do not delete the eight planted credentials in `.control-room/selftest.mjs`,**
  and do not allow-list a directory in `.control-room/boundary.mjs` — the two
  exemptions are named FILES, so a real key added beside them is still found.
- **Do not commit `.control-room/state/`.**
- **Do not "fix" `agent/observability/server.mjs` by bolting a token onto it.** It
  is a local development viewer and its own header says so; the finding against it
  stands, unchanged, and merging it with the Control Room would give a development
  tool a security model nobody tests.

Everything from before, still binding:

- Do not rebuild the site. No framework, no bundler, no build step, no
  dependency, no service worker, no server-side rendering.
- **Do not act on a UX proposal because it exists.** Fifteen records are
  outstanding, five of them `human_only` changes to what a reader sees, on a site
  where a push to `main` publishes and there is no deploy gate. They are
  proposals, not a work order.
- **Do not fix the three defects the browser found on your own initiative.**
  Issues 25, 27 and 28 are real, reproducible and reader-facing, and every one of
  them is Class C interface work: a proposal, then a human decision. A measured
  defect is not an authorisation.
- **Do not make `.github/workflows/qa.yml` a deploy gate by editing the workflow.**
  It cannot be one from inside this tree — blocking needs a branch protection
  rule, which is repository configuration. A workflow that CLAIMED to gate
  deployment would be worse than one that says plainly it does not.
- **Do not delete an `unmeasurable`, a `not_a_score` label, or the `overallScore()` throw.**
  Each is load-bearing, each makes a report longer and less satisfying, and each exists
  because the shorter version would be a lie.
- **Do not commit `agent/health/history/`.** It holds private control-plane data and this
  repository publishes its whole tree.
- **Do not add a `package.json`.** `agent/browser/` exists to prove the browser
  suite did not need one. Adding it later to "simplify" that code would spend the
  Class D budget the whole design avoided.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative. It
  now has THREE reports — an architecture finding, an editorial finding, and this
  session's measurement of what it costs — and three reports are no more a work
  order than one.
  *(30 Sep 2026: done on the author's instruction — the blob and `brief.json`'s `meta`
  are removed. The part titles/deks second home is still not an agent's to close.)*
- **Do not add an entry to `APPROVED_AUTONOMOUS_CATEGORIES`.** It is empty because no
  governance decision in this repository has approved an autonomous action category,
  and protocol §24 reserves that decision to a person. An agent appending to it would
  be taking the decision the protocol exists to withhold — not implementing one.
- **Do not give `agent/orchestrator/conflict.mjs` a resolver.** H7: a contradiction is
  never resolved by seniority, recency or convenience. The suite asserts that
  `resolve`, `preferMostRecent` and `tieBreak` are not exported, and the reason it
  can is that none of them exists.
- **Do not make a grant a union.** `grantFor()` returns the intersection of what the
  agent holds and what the stage asks for. A union lets any workflow author widen any
  agent by writing a more ambitious stage, which is one of the three leaks SESSION 22
  names by hand.
- **Do not add a Control Room route that starts, retries, dispatches or resumes a
  workflow.** The absence of the route is the control; a check inside one can be
  moved. §14 is explicit that a Control Room action creates a governed event and the
  Orchestrator decides independently whether it is permitted.
- **Do not let a workflow type end anywhere but a human stage**, and do not remove the
  load check in `workflows.mjs` that refuses one which does. Five types may complete
  without a person ONLY when they proposed nothing at all.
- **Do not narrow a scope request down to the permitted set.** A request naming a path
  the proposal does not is refused with the difference named. Narrowing it would let a
  caller discover the permitted set by asking for the whole tree and reading what came
  back.
- Do not modify `data/*.json` or any page in a session not scoped for that work.
- Do not touch the footer's non-affiliation or no-legal-advice text, `TIER_GRADE`
  in `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in
  `tools/_footer.mjs`.
- Do not declare a licence. Do not soften the README's known limitations or the
  unverified-record count. Do not re-run `tools/_refsweep.mjs` or
  `tools/_review10.mjs`.
- **Do not let a UX finding carry a drafted value.** The contract refuses it, the
  suite asserts it over every record, and SESSION 16's brief says the agent does
  not redesign the site. Loosening it is the one change in `agent/ux/` that
  cannot be made safely.
- **Do not let a proposal invent a design token.** Two checks exist because
  either alone could be edited away: `agent/ux/tokens.mjs` reads the stylesheets,
  and the contract requires an open question for any token added.
- **Do not remove the `measurement` evidence kind from this agent's output** by
  making every extract a `repository_file`. A count filed as a quote is a
  fabrication with a checkable-looking locator.
- **Do not turn an open question into a finding** to make the audit look more
  decisive, and do not turn one into a clearance. Nine components are neither
  legible nor illegible on this evidence, and saying either would be inventing a
  result.
- Do not reimplement `evidenceGrade` or `familyOf` in the agent layer.
- Do not add `retrieved_document` to `MINTABLE_EVIDENCE`.
- Do not add an id store, and do not change the id shapes in
  `agent/observability/ids.mjs`.
- Do not relax the contract gateway's rejection of anything malformed or
  `simulated`.
- Do not move `degraded` into a stored field. Do not move redaction to the read
  path, and do not raise `MAX_STRING`.
- Do not add an entry to `GOVERNANCE_PERMITS` without the repository owner naming
  the document that grants it.
- Do not relax the rule that `create_taxonomy_term` is `human_only`, and do not
  let `agent/architect/` propose a taxonomy term.
