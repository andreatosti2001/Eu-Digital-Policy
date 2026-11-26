# THE CLOSED RECORDS — the map before any move (D6.1)

**Lifecycle:** closed · **Authority:** canonical · **Home of:** the map of the closed records and of every reference to them, measured in D6 (D6.1) · **Snapshot of:** `e3b7e28` · **Closed by:** «Final checkpoint of the documentation session D6» · **Catalogue:** `docs/README.md`

**Written in documentation session D6** (26 Nov 2026; `docs/ROADMAP-v2.md` §8, «The scope of the documentation session D6»; the prompt
`docs/prompts/v2-docs-records.md`, D6.1), on `claude/zen-brahmagupta-btc1tx`, measured on `e3b7e28` (`main` `c47b535` with D6's scope row),
by a script kept outside the repository. **Nothing has moved.** This is the map the prompt puts to the author before anything moves; what
moves, and where, is the author's (§8, the rows of D6.1). A snapshot: its figures hold for `e3b7e28` and are not kept current.

**26 Nov 2026, D6.1 (a dated note; the paragraph above stays as written): the author decided that nothing moves** (§8, «D6, D6.1
question 1: whether, and where, the closed records move»). The answers to questions 2–4 are recorded there, for the case that a later
session reopens the move; none applies now. The «proposed path» column of §3 is therefore no one's plan.

---

## 0 · What it found

- **79 closed records** of the four kinds the plan names or D2 defined: **49 `prompt`, 15 `audit`, 10 `reading`, 5 `run`** — D5's prompt
  counted 78; the 79th is D5's own prompt, closed by «Final checkpoint of the documentation session D5». 1 450 296 bytes. **Not in the
  map, and not moving:** the five prompts that are not closed (`v2-docs-records`, `v2-session-25`, `v2-session-28`,
  `v2-track-m-rules-round-2027-02`, `v2-visible-coverage-reading`) and the five closed documents that are not of a record kind
  (`docs/AGENTS-ENTRY-MOVES.md`, `docs/ATTESTATION-FORM.md` — designs; `docs/HOMEPAGE-PRODUCTION-PLAN.md`, `docs/PHASE-4-PLAN.md`,
  `docs/PHASE-4-SETUP.md` — plans): the plan §1 moves «only executed prompts, readings and audits».
- **1 263 occurrences of their paths** in tracked files; outside `docs/archive/`, 1 077 on 980 lines of 203 files (D5's prompt measured
  «584 citations from 202 files» by a method it did not state; this map counts every occurrence of the literal path `docs/…`, and
  separately 166 lines that name a record's file name without its path, which a move that keeps the file name leaves true).
- **Every one of the 79 is cited by at least one home that no session may rewrite** (the columns in bold below):
  - **`docs/ROADMAP-v2.md` §8 — 255 occurrences, 74 records.** §8 is append-only (`docs/DOCS-SIMPLIFICATION-PLAN.md` §4): no row is
    rewritten.
  - **The two archive files of `docs/HANDOVER.md` — 186 occurrences, 70 records.** Not reopened (the prompt, «Cosa NON fare»).
  - **`data/` — 31 occurrences, 7 records** (`AUDIT-2026-10-14`, `F-18-READING`, `V2C-03-05-READING`, `V2C-12-READING`,
    `V2C-17-19-READING`, `V2C-21-READING`, `V2C-21b-READING`), all inside `verification_note`, `note` or `status_note` text of
    `data/instruments.json`, `data/sources.json`, `data/applicability.json` and `data/claims.json`. The plan §4 forbids `data/`.
  - **Published files — 7 occurrences, 4 records** (`AUDIT-2026-09-01` in `js/datasets-page.js`; `AUDIT-2026-11-11-P1` in
    `js/evidence-model.js`; `SEO-AUDIT-2026-09-27` in `js/routes.js` and `js/instrument-view.js`; `PROTOTYPES` in `css/tools.css`,
    `js/network-model.js`, `js/network-page.js`), all in comments; and 2 more by file name only (`AUDIT-2026-10-28`, `AUDIT-2026-11-11` in
    `js/evidence-model.js`). Changing one changes a published file: the `Evidence:` trailer, the browser suite, the release gate.
  - **The approval ledger — 2 occurrences, 1 record** (`docs/AUDIT-2026-11-04.md`): line 1 of `agent/implement/decisions/decisions.jsonl`
    (hash-chained) and line 1 of `docs/stage-1-proposal.jsonl` (the proposal that entry hashes, `proposal_sha256`). **Neither can change
    without breaking the ledger's integrity.**
- **So the plan's «every reference … updated in the same commit» (§2, D6) cannot hold for any of the 79** under the plan's own §4, the
  prompt and the ledger: a moved record leaves its old path written in §8 and the archive for good. **The plan's §5 point 2 («No internal
  reference broken») then fails for every record moved, unless the old path stays resolvable by a rule a tool checks** (question 4).
- **The archive path collides with `tools/docs-check.mjs`.** All 30 records that are not prompts carry the standard header
  (`docs/DOCUMENTATION-ARCHITECTURE.md` §5), and the check forbids a header under `docs/archive/` (HDR-FORBIDDEN, an error). A byte-for-byte
  `git mv` of an audit, a reading or a run into `docs/archive/` turns CI red; keeping them byte for byte there needs the check changed, and
  their header would then say `closed` where the catalogue says `historical` (question 1).
- **A moved prompt leaves the PATH-PROMPT scan.** The check reads `docs/prompts/<name>.md`, one level only: a prompt moved to a sub-folder or
  to `docs/archive/` is no longer scanned. One of today's four warnings (`docs/prompts/v2-docs-coherence.md:94`, a closed prompt) would
  disappear by the move, not by a correction: a check lost, which this map says rather than counts as progress.
- **What a move must carry, if it happens** (the references that are rewritable: active documents, code, tests, other files) — about **500
  occurrences in 126 files**, among them `AGENTS.md` (21, 17 records), the skill `.agents/skills/git-workflow/SKILL.md` and
  `.github/workflows/qa.yml` (4); **12 anchors** of `agent/proposals/governance/patterns.mjs` on 4 records (`AUDIT-2026-09-01` 5,
  `SESSION-25-FIRST-REAL-WORLD-RUN` 5, `AUDIT-2026-09-03` 1, `FIRST-END-TO-END-AUDIT` 1), whose `path` changes and whose text does not;
  **3 fixture paths** of `tools/docs-check-selftest.mjs` (lines 196, 198, 227: planted edits on `docs/F-18-READING.md` and
  `docs/AUDIT-2026-09-01.md`); the `doc:` field of `agent/production/schedule.mjs` (lines 189, 259, 267), printed by
  `production schedule`; and 37 lines of code — comments, thrown error messages, CLI output — that cite `docs/AUDIT-2026-09-01.md F-15`. A test matches a
  record's file name (`agent/simulation/selftest.mjs:129`, `/FIRST-END-TO-END-AUDIT/`): **a move keeps every file name**.
- **No record holds a relative Markdown link** (0): the LINK check is not at stake. 18 records name their own path (19 times), which a
  byte-for-byte move leaves at the old path. 0 pins of `tools/docs-check.mjs` are on a record. 298 occurrences are closed documents citing
  each other (question 4).
- **Where the records sit today:** 85 of the 145 documents under `docs/` are at its top level; the 29 top-level records among them would
  leave it (85 → 56), and 49 of the 54 prompts would leave `docs/prompts/` (54 → 5). Whether a session finds what it needs **already**
  does not depend on this: the skill reads by level and the catalogue lists records «on request» (D4, D2).

## 1 · The questions for the author (D6.1)

The prompt's four, with what the measure adds. **Answered in §8, one row each, before anything moves.**

1. **Whether, and where, the records move.** (a) `docs/archive/<kind>s/` — the architecture's `historical`; needs HDR-FORBIDDEN changed
   for the 30 headered records, or their headers removed (no longer byte for byte). (b) a path outside `docs/archive/`, e.g.
   `docs/records/<kind>s/`, where they stay `closed` with their headers valid and the check unchanged (and a scan rule for the moved
   prompts). (c) **nothing moves**: the measure shows every record cited by a home that cannot be rewritten; the reading levels and the
   catalogue already keep records out of a session's start; D6 does D6.3 and D6.4 and records why.
2. **Whether the five `run` records move** (`docs/FIRST-END-TO-END-AUDIT.md`, `docs/PROTOTYPES.md`,
   `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md`, `docs/V2C-13-MAP-CHECKS.md`, `docs/v2-design/session-10-before-after.md`): the plan §1 names prompts,
   readings and audits; D2 defined `run` afterwards.
3. **The records cited by `data/`, by published files and by the ledger** (11 records): they stay where they are; or they move and the
   reference stays written at the old path, resolvable by question 4's rule; or a §8 row authorises changing `data/` and the published
   files (never the ledger).
4. **The references that cannot or may not be rewritten** — in §8, the archive, closed records, `data/`, published files, the ledger: left
   as written, with **the old path resolvable** — the catalogue row of each moved record names its former path, and `tools/docs-check.mjs`
   checks that every former path named there is absent and maps to the row; or closed records updated with a dated note in the same commit
   (63 files, no longer byte for byte) and the rest left as written; or something else.

## 2 · Method, and what it does not measure

The catalogue `docs/README.md` §1, parsed by `tools/docs-check.mjs`'s own `catalogueRows()`; a record is a row of kind `prompt`,
`reading`, `audit` or `run` whose lifecycle is `closed`. Every tracked text file was read; an occurrence is the literal path `docs/…`, and a
Markdown link that resolves to the record (none found without the path). The classes are fixed in this order, first match wins: §8 (the
lines of `docs/ROADMAP-v2.md` from `## 8 ` on), `docs/archive/`, a closed document of `docs/README.md` §1 (records, and closed designs and
plans), `data/`, `js/`/`css/`, the two `.jsonl` files of the ledger, other Markdown of the perimeter («active docs», which includes the
catalogue, `AGENTS.md`, `docs/HANDOVER.md` and the active prompts), `*selftest.mjs`/`attacks.mjs`, code under `agent/`, `tools/`,
`.control-room/`, and the rest (agent and prototype READMEs and styles, the workflow, the skill, `docs/v2-design/status-labels.json`).
Anchors from `PATTERNS`, pins from `PINS`, both imported.

**Not measured:** paths built at run time; readers outside the repository (a prompt pasted in chat, links from the web); whether a
reference is a citation a reader follows or a passing mention; the six lines of `docs/ROADMAP-v2.md` before §8 are counted as active.

## 3 · The records

Bold: a home that no session may rewrite. «closed rec.» counts closed documents of every kind. «Own path»: occurrences of the record's
path inside itself. The proposed path is the prompt's example, shown so that the table can be read; it is the author's (question 1).

| Record | Kind | Header | §8 | archive | closed rec. | data/ | published | ledger | active docs | tests | code | other | Anchors | Own path | Proposed path (if Q1 = `docs/archive/<kind>s/`) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `docs/AUDIT-2026-09-01.md` | audit | yes | **1** | · | 14 | · | **1** | · | 20 | 4 | 57 | 5 | 5 | · | `docs/archive/audits/AUDIT-2026-09-01.md` |
| `docs/AUDIT-2026-09-03.md` | audit | yes | · | **2** | · | · | · | · | 7 | · | 1 | 1 | 1 | · | `docs/archive/audits/AUDIT-2026-09-03.md` |
| `docs/AUDIT-2026-10-14.md` | audit | yes | **1** | **2** | 2 | **1** | · | · | 5 | 1 | · | · | · | · | `docs/archive/audits/AUDIT-2026-10-14.md` |
| `docs/AUDIT-2026-10-21.md` | audit | yes | · | **1** | · | · | · | · | 4 | · | · | · | · | · | `docs/archive/audits/AUDIT-2026-10-21.md` |
| `docs/AUDIT-2026-10-23.md` | audit | yes | · | **1** | · | · | · | · | 3 | · | · | · | · | · | `docs/archive/audits/AUDIT-2026-10-23.md` |
| `docs/AUDIT-2026-10-24.md` | audit | yes | **3** | **8** | 7 | · | · | · | 16 | 7 | 11 | · | · | · | `docs/archive/audits/AUDIT-2026-10-24.md` |
| `docs/AUDIT-2026-10-28.md` | audit | yes | · | **1** | 3 | · | · | · | 4 | · | · | · | · | · | `docs/archive/audits/AUDIT-2026-10-28.md` |
| `docs/AUDIT-2026-11-04.md` | audit | yes | **5** | **3** | 5 | · | · | **2** | 5 | · | · | 1 | · | 1 | `docs/archive/audits/AUDIT-2026-11-04.md` |
| `docs/AUDIT-2026-11-11-P1.md` | audit | yes | **2** | **2** | 1 | · | **1** | · | 11 | 4 | 6 | 1 | · | · | `docs/archive/audits/AUDIT-2026-11-11-P1.md` |
| `docs/AUDIT-2026-11-11.md` | audit | yes | **4** | **1** | 4 | · | · | · | 5 | · | 1 | 2 | · | · | `docs/archive/audits/AUDIT-2026-11-11.md` |
| `docs/GOVERNANCE-PROPOSALS.md` | audit | yes | **2** | **6** | 4 | · | · | · | 6 | · | 2 | 4 | · | 1 | `docs/archive/audits/GOVERNANCE-PROPOSALS.md` |
| `docs/PHASE-3-AUDIT.md` | audit | yes | **15** | **5** | 32 | · | · | · | 10 | · | 1 | · | · | · | `docs/archive/audits/PHASE-3-AUDIT.md` |
| `docs/SECURITY-VERIFICATION-2026-09-08.md` | audit | yes | **2** | **7** | 4 | · | · | · | 7 | 1 | 3 | · | · | · | `docs/archive/audits/SECURITY-VERIFICATION-2026-09-08.md` |
| `docs/SEO-AUDIT-2026-09-27.md` | audit | yes | **1** | **1** | · | · | **2** | · | 8 | 2 | 5 | · | · | · | `docs/archive/audits/SEO-AUDIT-2026-09-27.md` |
| `docs/V2-CLOSURE.md` | audit | yes | **24** | **26** | 51 | · | · | · | 13 | · | · | · | · | 2 | `docs/archive/audits/V2-CLOSURE.md` |
| `docs/prompts/v2-docs-agents-entry.md` | prompt | — | **3** | **1** | 1 | · | · | · | 4 | · | · | · | · | · | `docs/archive/prompts/v2-docs-agents-entry.md` |
| `docs/prompts/v2-docs-authority-catalogue.md` | prompt | — | **4** | **1** | 1 | · | · | · | 6 | · | · | · | · | · | `docs/archive/prompts/v2-docs-authority-catalogue.md` |
| `docs/prompts/v2-docs-check.md` | prompt | — | **3** | **1** | 1 | · | · | · | 4 | 2 | · | · | · | · | `docs/archive/prompts/v2-docs-check.md` |
| `docs/prompts/v2-docs-coherence.md` | prompt | — | **1** | **2** | 1 | · | · | · | 5 | · | · | · | · | · | `docs/archive/prompts/v2-docs-coherence.md` |
| `docs/prompts/v2-docs-handover.md` | prompt | — | **3** | · | · | · | · | · | 6 | · | · | · | · | · | `docs/archive/prompts/v2-docs-handover.md` |
| `docs/prompts/v2-f-18-dma-immediately.md` | prompt | — | **3** | · | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-f-18-dma-immediately.md` |
| `docs/prompts/v2-hp-02-homepage-follow-up.md` | prompt | — | **2** | **1** | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-hp-02-homepage-follow-up.md` |
| `docs/prompts/v2-hp-03-homepage-production-plan.md` | prompt | — | **2** | **1** | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-hp-03-homepage-production-plan.md` |
| `docs/prompts/v2-hp-04-homepage-production.md` | prompt | — | **3** | **1** | · | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-hp-04-homepage-production.md` |
| `docs/prompts/v2-pv2-01-data-readiness.md` | prompt | — | **2** | **1** | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-pv2-01-data-readiness.md` |
| `docs/prompts/v2-pv2-02-frontend-references.md` | prompt | — | **3** | **3** | 2 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-pv2-02-frontend-references.md` |
| `docs/prompts/v2-pv2-03-prototype-editorial.md` | prompt | — | **4** | **5** | 2 | · | · | · | 3 | · | · | · | · | · | `docs/archive/prompts/v2-pv2-03-prototype-editorial.md` |
| `docs/prompts/v2-pv2-04-prototype-observatory.md` | prompt | — | **3** | **2** | 2 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-pv2-04-prototype-observatory.md` |
| `docs/prompts/v2-pv2-05-prototype-hybrid-selection.md` | prompt | — | **3** | **3** | 2 | · | · | · | 2 | · | · | 1 | · | · | `docs/archive/prompts/v2-pv2-05-prototype-hybrid-selection.md` |
| `docs/prompts/v2-rules-maintenance-group-a.md` | prompt | — | **3** | · | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-rules-maintenance-group-a.md` |
| `docs/prompts/v2-rules-maintenance-group-b.md` | prompt | — | **3** | · | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-rules-maintenance-group-b.md` |
| `docs/prompts/v2-session-10.md` | prompt | — | **1** | **1** | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-session-10.md` |
| `docs/prompts/v2-session-11.md` | prompt | — | **1** | **1** | · | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-session-11.md` |
| `docs/prompts/v2-session-12.md` | prompt | — | **1** | **1** | · | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-session-12.md` |
| `docs/prompts/v2-session-13.md` | prompt | — | **1** | **1** | · | · | · | · | 2 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-13.md` |
| `docs/prompts/v2-session-14.md` | prompt | — | **1** | **1** | 1 | · | · | · | 2 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-14.md` |
| `docs/prompts/v2-session-15.md` | prompt | — | **1** | **2** | 2 | · | · | · | 2 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-15.md` |
| `docs/prompts/v2-session-16.md` | prompt | — | **1** | **2** | 2 | · | · | · | 2 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-16.md` |
| `docs/prompts/v2-session-17-5.md` | prompt | — | **1** | **1** | · | · | · | · | 2 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-17-5.md` |
| `docs/prompts/v2-session-17.md` | prompt | — | **1** | **2** | 1 | · | · | · | 2 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-17.md` |
| `docs/prompts/v2-session-18.md` | prompt | — | **1** | **1** | · | · | · | · | 2 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-18.md` |
| `docs/prompts/v2-session-19.md` | prompt | — | **1** | · | · | · | · | · | 2 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-19.md` |
| `docs/prompts/v2-session-20.md` | prompt | — | **2** | **1** | · | · | · | · | 3 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-20.md` |
| `docs/prompts/v2-session-21.md` | prompt | — | **1** | **1** | · | · | · | · | 2 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-21.md` |
| `docs/prompts/v2-session-22.md` | prompt | — | **3** | **4** | 3 | · | · | · | 2 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-22.md` |
| `docs/prompts/v2-session-23.md` | prompt | — | **2** | **2** | 1 | · | · | · | 2 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-23.md` |
| `docs/prompts/v2-session-24.md` | prompt | — | **2** | **4** | 1 | · | · | · | 2 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-24.md` |
| `docs/prompts/v2-session-27.md` | prompt | — | **7** | **6** | 2 | · | · | · | 4 | · | · | · | · | 1 | `docs/archive/prompts/v2-session-27.md` |
| `docs/prompts/v2-session-5.md` | prompt | — | **1** | **1** | · | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-session-5.md` |
| `docs/prompts/v2-session-6.md` | prompt | — | **3** | **4** | 18 | · | · | · | 4 | · | · | · | · | · | `docs/archive/prompts/v2-session-6.md` |
| `docs/prompts/v2-session-7.md` | prompt | — | **1** | **1** | 1 | · | · | · | 3 | · | · | · | · | · | `docs/archive/prompts/v2-session-7.md` |
| `docs/prompts/v2-session-8.md` | prompt | — | **1** | **1** | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-session-8.md` |
| `docs/prompts/v2-session-9.md` | prompt | — | **1** | **1** | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-session-9.md` |
| `docs/prompts/v2-stage-1-operational-closure.md` | prompt | — | · | **1** | 1 | · | · | · | 4 | · | · | · | · | 1 | `docs/archive/prompts/v2-stage-1-operational-closure.md` |
| `docs/prompts/v2-track-m-eidas2-milestone.md` | prompt | — | **3** | **3** | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-track-m-eidas2-milestone.md` |
| `docs/prompts/v2-trials-network-map-phone.md` | prompt | — | **4** | **1** | · | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-trials-network-map-phone.md` |
| `docs/prompts/v2-v2c-03-05-arrays.md` | prompt | — | **2** | · | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-v2c-03-05-arrays.md` |
| `docs/prompts/v2-v2c-12-v1-relationships.md` | prompt | — | **3** | · | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-v2c-12-v1-relationships.md` |
| `docs/prompts/v2-v2c-13-map-checks.md` | prompt | — | **3** | · | 2 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-v2c-13-map-checks.md` |
| `docs/prompts/v2-v2c-17-19-map-nodes.md` | prompt | — | **3** | **1** | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-v2c-17-19-map-nodes.md` |
| `docs/prompts/v2-v2c-21-eidas2-actors.md` | prompt | — | **2** | **1** | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-v2c-21-eidas2-actors.md` |
| `docs/prompts/v2-v2c-21b-eidas2-provisions.md` | prompt | — | **4** | **2** | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-v2c-21b-eidas2-provisions.md` |
| `docs/prompts/v2-visible-coverage.md` | prompt | — | **2** | **3** | · | · | · | · | 3 | · | · | · | · | · | `docs/archive/prompts/v2-visible-coverage.md` |
| `docs/prompts/v2-visible-network-map.md` | prompt | — | **4** | **3** | 1 | · | · | · | 2 | · | · | · | · | · | `docs/archive/prompts/v2-visible-network-map.md` |
| `docs/F-18-READING.md` | reading | yes | **2** | **2** | 3 | **2** | · | · | 4 | 2 | · | · | · | · | `docs/archive/readings/F-18-READING.md` |
| `docs/FRONTEND-REFERENCES.md` | reading | yes | **25** | **8** | 28 | · | · | · | 5 | · | 2 | 12 | · | · | `docs/archive/readings/FRONTEND-REFERENCES.md` |
| `docs/RULES-MAINTENANCE-A-READING.md` | reading | yes | **4** | **1** | 3 | · | · | · | 3 | · | · | · | · | · | `docs/archive/readings/RULES-MAINTENANCE-A-READING.md` |
| `docs/RULES-MAINTENANCE-B-READING.md` | reading | yes | **3** | **1** | 3 | · | · | · | 6 | · | · | · | · | · | `docs/archive/readings/RULES-MAINTENANCE-B-READING.md` |
| `docs/TRACK-M-EIDAS2-READING.md` | reading | yes | **2** | **1** | · | · | · | · | 3 | · | · | · | · | · | `docs/archive/readings/TRACK-M-EIDAS2-READING.md` |
| `docs/V2C-03-05-READING.md` | reading | yes | **4** | **1** | 5 | **5** | · | · | 3 | · | · | · | · | · | `docs/archive/readings/V2C-03-05-READING.md` |
| `docs/V2C-12-READING.md` | reading | yes | **3** | **1** | 7 | **7** | · | · | 4 | · | · | · | · | · | `docs/archive/readings/V2C-12-READING.md` |
| `docs/V2C-17-19-READING.md` | reading | yes | **2** | **1** | 3 | **13** | · | · | 3 | · | · | · | · | · | `docs/archive/readings/V2C-17-19-READING.md` |
| `docs/V2C-21-READING.md` | reading | yes | **8** | **2** | 10 | **1** | · | · | 2 | · | · | · | · | · | `docs/archive/readings/V2C-21-READING.md` |
| `docs/V2C-21b-READING.md` | reading | yes | **2** | **1** | 2 | **2** | · | · | 2 | · | · | · | · | · | `docs/archive/readings/V2C-21b-READING.md` |
| `docs/FIRST-END-TO-END-AUDIT.md` | run | yes | **1** | **1** | 4 | · | · | · | 12 | 1 | 9 | 1 | 1 | · | `docs/archive/runs/FIRST-END-TO-END-AUDIT.md` |
| `docs/PROTOTYPES.md` | run | yes | **25** | **18** | 33 | · | **3** | · | 6 | · | 1 | 10 | · | · | `docs/archive/runs/PROTOTYPES.md` |
| `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` | run | yes | **1** | **3** | 1 | · | · | · | 11 | · | 5 | · | 5 | · | `docs/archive/runs/SESSION-25-FIRST-REAL-WORLD-RUN.md` |
| `docs/v2-design/session-10-before-after.md` | run | yes | **1** | **2** | · | · | · | · | 3 | · | · | · | · | · | `docs/archive/runs/session-10-before-after.md` |
| `docs/V2C-13-MAP-CHECKS.md` | run | yes | **2** | **1** | 6 | · | · | · | 3 | · | 1 | · | · | · | `docs/archive/runs/V2C-13-MAP-CHECKS.md` |
| **79 records** | | 30 | 255 | 186 | 298 | 31 | 7 | 2 | 317 | 24 | 105 | 38 | 12 | 19 | |

## 4 · Every reference, by record

§8 is counted by rows; every other class lists `file`:lines.

- **`docs/AUDIT-2026-09-01.md`** (audit — closed by on `main` `fe404e8` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…) — **anchors:** P-04, P-05, P-09, P-11, P-11  
  §8: 1 row(s)  
  closed rec.: `docs/ATTESTATION-FORM.md`:80,165 · `docs/AUDIT-2026-09-03.md`:14,31,160,195 · `docs/AUDIT-2026-10-24.md`:213 · `docs/FIRST-END-TO-END-AUDIT.md`:9,523 · `docs/PHASE-4-PLAN.md`:64,106 · `docs/PHASE-4-SETUP.md`:57 · `docs/prompts/v2-docs-coherence.md`:68 · `docs/prompts/v2-session-22.md`:72  
  published: `js/datasets-page.js`:200  
  active docs: `AGENTS.md`:54 · `docs/AUTONOMY-AUTHORIZATION-POLICY.md`:317 · `docs/CONTROL-ROOM.md`:506 · `docs/CURRENT-ARCHITECTURE.md`:426 · `docs/DOCS-DEPENDENCY-MAP.md`:23,90,244,245,246,247,248 · `docs/ORCHESTRATOR.md`:91 · `docs/README.md`:39 · `docs/REGULATORY-IMPACT-MAPPING.md`:68,233 · `docs/RULE-MAINTENANCE.md`:53,69 · `docs/UX-AUDIT.md`:342 · `docs/VERIFICATION-POLICY.md`:202 · `docs/prompts/v2-docs-records.md`:50  
  tests: `agent/policy/verify/attacks.mjs`:19 · `tools/docs-check-selftest.mjs`:227 · `tools/selftest.mjs`:18,305  
  code: `agent/architect/architect.mjs`:78,93,97 · `agent/architect/cli.mjs`:14,65 · `agent/architect/lenses.mjs`:791 · `agent/autonomy/cli.mjs`:168 · `agent/depth/cli.mjs`:59 · `agent/depth/depth.mjs`:88,92,178 · `agent/detector/detector.mjs`:83 · `agent/detector/graph.mjs`:32,218 · `agent/detector/impact.mjs`:706,784 · `agent/health/cli.mjs`:18,93 · `agent/health/gather.mjs`:15,71 · `agent/health/public.mjs`:64 · `agent/implement/baseline.mjs`:114 · `agent/implement/cli.mjs`:28,242 · `agent/improve/cli.mjs`:147 · `agent/improve/observe.mjs`:279 · `agent/integrate/adapter.mjs`:70 · `agent/integrate/stale.mjs`:70 · `agent/orchestrator/workflows.mjs`:61 · `agent/proposals/data/cli.mjs`:52 · `agent/proposals/data/proposals.mjs`:90,94 · `agent/proposals/editorial/cli.mjs`:15,71 · `agent/proposals/editorial/editorial.mjs`:99,179,183 · `agent/proposals/governance/evidence.mjs`:9 · `agent/proposals/governance/patterns.mjs`:126,143,208,238,240 · `agent/proposals/governance/proposals.mjs`:230 · `agent/release/cli.mjs`:115 · `agent/schemas/contracts/knowledge-gap.mjs`:118 · `agent/ux/auditor.mjs`:82,160,166 · `agent/ux/cli.mjs`:15,71 · `tools/attestation-audit.mjs`:32 · `tools/evidence-audit-record.mjs`:73 · `tools/freshness.mjs`:55,301 · `tools/source-contract.mjs`:31,116  
  other: `.github/workflows/qa.yml`:4 · `agent/depth/README.md`:20 · `agent/proposals/data/README.md`:20 · `agent/proposals/editorial/README.md`:21 · `docs/v2-design/status-labels.json`:101
- **`docs/AUDIT-2026-09-03.md`** (audit — closed by on `main` `179c975` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…) — **anchors:** P-06  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:7999,8013  
  active docs: `AGENTS.md`:55,376 · `docs/DOCS-DEPENDENCY-MAP.md`:24,91,249 · `docs/README.md`:40 · `docs/prompts/v2-docs-records.md`:51  
  code: `agent/proposals/governance/patterns.mjs`:160  
  other: `.agents/skills/git-workflow/SKILL.md`:59
- **`docs/AUDIT-2026-10-14.md`** (audit — closed by on `main` `6a2357f` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:4376,7356  
  closed rec.: `docs/prompts/v2-session-10.md`:92 · `docs/v2-design/session-10-before-after.md`:63  
  data/: `data/instruments.json`:1732  
  active docs: `AGENTS.md`:56 · `docs/CURRENT-ARCHITECTURE.md`:521 · `docs/DOCS-DEPENDENCY-MAP.md`:92 · `docs/README.md`:41 · `docs/prompts/v2-docs-records.md`:54  
  tests: `tools/selftest.mjs`:2441
- **`docs/AUDIT-2026-10-21.md`** (audit — closed by on `main` `29f92c9` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:7045  
  active docs: `AGENTS.md`:57 · `docs/CURRENT-ARCHITECTURE.md`:522 · `docs/DOCS-DEPENDENCY-MAP.md`:93 · `docs/README.md`:42
- **`docs/AUDIT-2026-10-23.md`** (audit — closed by on `main` `9891958` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:6971  
  active docs: `AGENTS.md`:58 · `docs/DOCS-DEPENDENCY-MAP.md`:94 · `docs/README.md`:43
- **`docs/AUDIT-2026-10-24.md`** (audit — closed by The Phase 1 checkpoint = the audit of 24 Oct 2026 closed)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:6176,6275,6427,6441,6593,6616,6777,6856  
  closed rec.: `docs/V2-CLOSURE.md`:56,95,97,143 · `docs/prompts/v2-session-11.md`:51,80,129  
  active docs: `AGENTS.md`:60 · `docs/CONTROL-ROOM.md`:253,273,309,348 · `docs/DOCS-DEPENDENCY-MAP.md`:95,347,360 · `docs/EDITORIAL-AUDIT-PATH.md`:5 · `docs/README.md`:44 · `docs/ROADMAP-v2.md`:18,132,151,195,291 · `docs/V2-DATA-DESIGN.md`:68  
  tests: `.control-room/selftest.mjs`:1412,1540,1629,1681,1757 · `tools/selftest.mjs`:567,582  
  code: `.control-room/decide.mjs`:39 · `.control-room/server.mjs`:420 · `.control-room/ui/app.js`:25 · `.control-room/views.mjs`:12,390,452,464 · `tools/as-of.mjs`:8 · `tools/evidence-audit-record.mjs`:5 · `tools/evidence-audit.mjs`:56 · `tools/freshness.mjs`:12
- **`docs/AUDIT-2026-10-28.md`** (audit — closed by on `main` `a53c2c2` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:4070  
  closed rec.: `docs/prompts/v2-session-12.md`:18,48 · `docs/prompts/v2-session-13.md`:46  
  active docs: `AGENTS.md`:59 · `docs/DOCS-DEPENDENCY-MAP.md`:96 · `docs/EVIDENCE-MODEL.md`:158 · `docs/README.md`:45
- **`docs/AUDIT-2026-11-04.md`** (audit — closed by on `main` `d4f860e` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…)  
  §8: 4 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:1057,1096,1192  
  closed rec.: `docs/prompts/v2-stage-1-operational-closure.md`:7,26,49,80,148  
  ledger: `agent/implement/decisions/decisions.jsonl`:1 · `docs/stage-1-proposal.jsonl`:1  
  active docs: `AGENTS.md`:48 · `docs/DEPLOYMENT.md`:400 · `docs/DOCS-DEPENDENCY-MAP.md`:97 · `docs/README.md`:46 · `docs/SESSION-ARCHITECTURE.md`:19  
  other: `agent/release/README.md`:3
- **`docs/AUDIT-2026-11-11-P1.md`** (audit — closed by on `main` `89c0305` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:294,313  
  closed rec.: `docs/FIRST-END-TO-END-AUDIT.md`:377  
  published: `js/evidence-model.js`:346  
  active docs: `AGENTS.md`:51 · `docs/CONTENT-FRESHNESS-POLICY.md`:91 · `docs/DATA-READINESS.md`:343,527,529,550 · `docs/DOCS-DEPENDENCY-MAP.md`:98 · `docs/EVIDENCE-MODEL.md`:158 · `docs/ORCHESTRATOR.md`:389,433 · `docs/README.md`:47  
  tests: `agent/release/selftest.mjs`:1115 · `tools/selftest.mjs`:3939,4043,4080  
  code: `agent/orchestrator/orchestrator.mjs`:87 · `agent/release/gate.mjs`:104 · `tools/commit-evidence.mjs`:23 · `tools/metric-contract.mjs`:17 · `tools/register-reading.mjs`:6 · `tools/validate.mjs`:631  
  other: `agent/release/README.md`:90
- **`docs/AUDIT-2026-11-11.md`** (audit — closed by Checkpoint of the session "P0.1 + P0.4" approved)  
  §8: 3 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:478  
  closed rec.: `docs/AUDIT-2026-11-11-P1.md`:33,109,137,148  
  active docs: `AGENTS.md`:50 · `docs/DEPLOYMENT.md`:171,175 · `docs/DOCS-DEPENDENCY-MAP.md`:99 · `docs/README.md`:48  
  code: `agent/release/gate.mjs`:104  
  other: `agent/release/README.md`:31,88
- **`docs/GOVERNANCE-PROPOSALS.md`** (audit — closed by on `main` `1f47b85` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:8209,8405,8462,8534,8547,8574  
  closed rec.: `docs/AGENTS-ENTRY-MOVES.md`:55,73,163,172  
  active docs: `AGENTS.md`:44,101,317 · `docs/DOCS-DEPENDENCY-MAP.md`:122 · `docs/PRODUCTION-OPERATING-MODE.md`:282 · `docs/README.md`:73  
  code: `agent/production/schedule.mjs`:189,259  
  other: `.github/workflows/qa.yml`:276,439,627 · `agent/proposals/governance/README.md`:11
- **`docs/PHASE-3-AUDIT.md`** (audit — closed by The checkpoint of v2 Session 17.5 = items 17.5.1, 17.5.2 and 17.5.0)  
  §8: 14 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:2366,2744,2755,2871,2895  
  closed rec.: `docs/PHASE-4-SETUP.md`:55,59,215 · `docs/RULES-MAINTENANCE-A-READING.md`:13 · `docs/V2C-21-READING.md`:10 · `docs/prompts/v2-f-18-dma-immediately.md`:4,18,25 · `docs/prompts/v2-rules-maintenance-group-a.md`:4,27,33 · `docs/prompts/v2-session-17-5.md`:148,260 · `docs/prompts/v2-session-18.md`:8,27,46,82,166 · `docs/prompts/v2-session-20.md`:8,49 · `docs/prompts/v2-session-21.md`:12,53,91 · `docs/prompts/v2-v2c-03-05-arrays.md`:4,30 · `docs/prompts/v2-v2c-12-v1-relationships.md`:4,31 · `docs/prompts/v2-v2c-13-map-checks.md`:5,32 · `docs/prompts/v2-v2c-21-eidas2-actors.md`:5,43,57  
  active docs: `AGENTS.md`:65 · `docs/DOCS-DEPENDENCY-MAP.md`:136,368 · `docs/PHASE-5-SETUP.md`:80,82 · `docs/README.md`:87 · `docs/ROADMAP-v2.md`:10 · `docs/RULE-MAINTENANCE.md`:26,39,209  
  code: `tools/notice-audit.mjs`:5
- **`docs/SECURITY-VERIFICATION-2026-09-08.md`** (audit — closed by on `main` `8f1b411` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:8659,9123,9186,9340,9354,9366,9393  
  closed rec.: `docs/AGENTS-ENTRY-MOVES.md`:64,111 · `docs/AUDIT-2026-10-24.md`:294 · `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md`:50  
  active docs: `AGENTS.md`:69,119 · `docs/CONTINUOUS-IMPROVEMENT.md`:239 · `docs/DEPLOYMENT.md`:299 · `docs/DOCS-DEPENDENCY-MAP.md`:198 · `docs/HANDOVER.md`:93 · `docs/README.md`:155  
  tests: `agent/improve/selftest.mjs`:618  
  code: `agent/orchestrator/approval.mjs`:173 · `agent/policy/verify/harness.mjs`:29 · `agent/production/schedule.mjs`:267
- **`docs/SEO-AUDIT-2026-09-27.md`** (audit — closed by on `main` `cc1f7d0` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:7579  
  published: `js/instrument-view.js`:13 · `js/routes.js`:6  
  active docs: `AGENTS.md`:46 · `docs/CURRENT-ARCHITECTURE.md`:37 · `docs/DEPLOYMENT.md`:309 · `docs/DISCOVERABILITY-STRATEGY.md`:6 · `docs/DOCS-DEPENDENCY-MAP.md`:199 · `docs/README.md`:156 · `docs/SEO-OPERATIONS.md`:5,155  
  tests: `tools/selftest.mjs`:1081,1138  
  code: `agent/browser/checks.mjs`:873 · `tools/og-image.mjs`:5 · `tools/seo-audit.mjs`:6 · `tools/seo.mjs`:5,749
- **`docs/V2-CLOSURE.md`** (audit — closed by The checkpoint of v2 Session 11 = the closing gate of v2)  
  §8: 20 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:2195,2370,2685,2748,2796,2904,3017,3117,3314,3525,3692,3873,3941,4116,4129,4137,4138,4140,4147,4165,4198,4225,4230,4238,4260  
  closed rec.: `docs/PHASE-3-AUDIT.md`:19,81,122 · `docs/V2C-21-READING.md`:10 · `docs/prompts/v2-session-11.md`:109,167,198,216 · `docs/prompts/v2-session-12.md`:5,16,42,166 · `docs/prompts/v2-session-13.md`:5,42,128 · `docs/prompts/v2-session-14.md`:5,42,162 · `docs/prompts/v2-session-15.md`:7,46,188 · `docs/prompts/v2-session-16.md`:7,46,185 · `docs/prompts/v2-session-17-5.md`:8,62,107,148,157,239,261 · `docs/prompts/v2-session-17.md`:10,48,144,192 · `docs/prompts/v2-session-18.md`:9,47,165 · `docs/prompts/v2-session-21.md`:93 · `docs/prompts/v2-v2c-03-05-arrays.md`:4,30 · `docs/prompts/v2-v2c-12-v1-relationships.md`:5,32 · `docs/prompts/v2-v2c-13-map-checks.md`:4,31 · `docs/prompts/v2-v2c-17-19-map-nodes.md`:4,24 · `docs/prompts/v2-v2c-21-eidas2-actors.md`:6,43,57 · `docs/prompts/v2-v2c-21b-eidas2-provisions.md`:70  
  active docs: `AGENTS.md`:64 · `docs/DOCS-DEPENDENCY-MAP.md`:208,379 · `docs/PHASE-5-SETUP.md`:137 · `docs/POST-V2.md`:29,48,209,451 · `docs/README.md`:165 · `docs/SESSION-ARCHITECTURE.md`:50,74,131,170
- **`docs/prompts/v2-docs-agents-entry.md`** (prompt — closed by «The scope of the documentation session D4» → closed by «Final checkpoint of the documenta…)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:15  
  closed rec.: `docs/prompts/v2-docs-handover.md`:3  
  active docs: `docs/DOCS-SIMPLIFICATION-PLAN.md`:68 · `docs/HANDOVER.md`:19 · `docs/README.md`:94 · `docs/SESSION-ARCHITECTURE.md`:20
- **`docs/prompts/v2-docs-authority-catalogue.md`** (prompt — closed by «The scope of the documentation session D2» → closed by «Final checkpoint of the documenta…)  
  §8: 3 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:46  
  closed rec.: `docs/prompts/v2-docs-check.md`:3  
  active docs: `docs/DOCS-SIMPLIFICATION-PLAN.md`:66 · `docs/DOCUMENTATION-ARCHITECTURE.md`:7 · `docs/HANDOVER.md`:31 · `docs/README.md`:6,97 · `docs/SESSION-ARCHITECTURE.md`:20
- **`docs/prompts/v2-docs-check.md`** (prompt — closed by «The scope of the documentation session D3» → closed by «Final checkpoint of the documenta…)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:30  
  closed rec.: `docs/prompts/v2-docs-agents-entry.md`:3  
  active docs: `docs/DOCS-SIMPLIFICATION-PLAN.md`:67 · `docs/HANDOVER.md`:25 · `docs/README.md`:98 · `docs/SESSION-ARCHITECTURE.md`:20  
  tests: `tools/docs-check-selftest.mjs`:172,263
- **`docs/prompts/v2-docs-coherence.md`** (prompt — closed by «The scope of the documentation session D1» → closed by «Final checkpoint of the documenta…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:16,60  
  closed rec.: `docs/prompts/v2-docs-authority-catalogue.md`:3  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:143 · `docs/DOCS-SIMPLIFICATION-PLAN.md`:32,65 · `docs/README.md`:99 · `docs/SESSION-ARCHITECTURE.md`:20
- **`docs/prompts/v2-docs-handover.md`** (prompt — closed by «The scope of the documentation session D5» → closed by «Final checkpoint of the documenta…)  
  §8: 2 row(s)  
  active docs: `docs/DOCS-SIMPLIFICATION-PLAN.md`:69 · `docs/HANDOVER.md`:13,92 · `docs/README.md`:95 · `docs/SESSION-ARCHITECTURE.md`:20 · `docs/prompts/v2-docs-records.md`:3
- **`docs/prompts/v2-f-18-dma-immediately.md`** (prompt — closed by «The scope of the F-18 session» → closed by «Final checkpoint of the F-18 session»)  
  §8: 3 row(s)  
  closed rec.: `docs/F-18-READING.md`:5  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:144 · `docs/README.md`:100
- **`docs/prompts/v2-hp-02-homepage-follow-up.md`** (prompt — closed by «The scope of HP-02 (the homepage follow-up)» → closed by «HP-02: the next session»)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:283  
  closed rec.: `docs/prompts/v2-pv2-05-prototype-hybrid-selection.md`:24  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:145 · `docs/README.md`:101
- **`docs/prompts/v2-hp-03-homepage-production-plan.md`** (prompt — closed by «The scope of HP-03 (the homepage production plan)» → closed by «Final checkpoint of HP-03…)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:216  
  closed rec.: `docs/HOMEPAGE-PRODUCTION-PLAN.md`:6  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:146 · `docs/README.md`:102
- **`docs/prompts/v2-hp-04-homepage-production.md`** (prompt — closed by «The scope of HP-04 (the homepage in production: the plan executed)» → closed by «HP-04: t…)  
  §8: 3 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:109  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:147 · `docs/README.md`:103
- **`docs/prompts/v2-pv2-01-data-readiness.md`** (prompt — closed by «The scope of PV2-01 (Post-v2 A, data readiness)» → closed by «Final checkpoint of PV2-01 …)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:909  
  closed rec.: `docs/prompts/v2-pv2-02-frontend-references.md`:3  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:148 · `docs/README.md`:104
- **`docs/prompts/v2-pv2-02-frontend-references.md`** (prompt — closed by «The scope of PV2-02 (Post-v2 B, frontend references)» → closed by «Final checkpoint of PV…)  
  §8: 3 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:823,839,859  
  closed rec.: `docs/prompts/v2-pv2-01-data-readiness.md`:91 · `docs/prompts/v2-pv2-03-prototype-editorial.md`:3  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:149 · `docs/README.md`:105
- **`docs/prompts/v2-pv2-03-prototype-editorial.md`** (prompt — closed by «The scope of PV2-03 (Post-v2 C, the Editorial prototype)» → closed by «Final checkpoint o…)  
  §8: 4 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:592,625,703,716,733  
  closed rec.: `docs/prompts/v2-pv2-02-frontend-references.md`:91 · `docs/prompts/v2-pv2-04-prototype-observatory.md`:3  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:150 · `docs/POST-V2.md`:473 · `docs/README.md`:106
- **`docs/prompts/v2-pv2-04-prototype-observatory.md`** (prompt — closed by «The scope of PV2-04 (Post-v2 C, the Policy observatory prototype)» → closed by «Final che…)  
  §8: 3 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:406,565  
  closed rec.: `docs/prompts/v2-pv2-03-prototype-editorial.md`:105 · `docs/prompts/v2-pv2-05-prototype-hybrid-selection.md`:4  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:151 · `docs/README.md`:107
- **`docs/prompts/v2-pv2-05-prototype-hybrid-selection.md`** (prompt — closed by «The scope of PV2-05 (Post-v2 C, the Hybrid prototype and the selection)» → closed by «Fin…)  
  §8: 3 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:579 · `docs/archive/HANDOVER-to-2026-11-13.md`:56,377  
  closed rec.: `docs/HOMEPAGE-PRODUCTION-PLAN.md`:330 · `docs/prompts/v2-pv2-04-prototype-observatory.md`:97  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:152 · `docs/README.md`:108  
  other: `prototypes/homepage/README.md`:59
- **`docs/prompts/v2-rules-maintenance-group-a.md`** (prompt — closed by «The scope of the rules-maintenance session (group (a))» → closed by «Final checkpoint of …)  
  §8: 3 row(s)  
  closed rec.: `docs/RULES-MAINTENANCE-A-READING.md`:5  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:153 · `docs/README.md`:109
- **`docs/prompts/v2-rules-maintenance-group-b.md`** (prompt — closed by «The scope of the rules-maintenance session (group (b))» → closed by «Final checkpoint of …)  
  §8: 3 row(s)  
  closed rec.: `docs/RULES-MAINTENANCE-B-READING.md`:5  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:154 · `docs/README.md`:110
- **`docs/prompts/v2-session-10.md`** (prompt — closed by «The scope of v2 Session 10» → closed by «The checkpoint of v2 Session 10 = items 10.1 and…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:4540  
  closed rec.: `docs/prompts/v2-session-11.md`:18  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:155 · `docs/README.md`:111
- **`docs/prompts/v2-session-11.md`** (prompt — closed by «The scope of v2 Session 11» → closed by «The checkpoint of v2 Session 11 = the closing ga…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:4284  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:156 · `docs/README.md`:112
- **`docs/prompts/v2-session-12.md`** (prompt — closed by «The scope of v2 Session 12» → closed by «The checkpoint of v2 Session 12 = items 12.1 and…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:4104  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:157 · `docs/README.md`:113
- **`docs/prompts/v2-session-13.md`** (prompt — closed by «The scope of v2 Session 13» → closed by «The checkpoint of v2 Session 13 = items 13.1, 13…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:3900  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:158 · `docs/README.md`:114
- **`docs/prompts/v2-session-14.md`** (prompt — closed by «The scope of v2 Session 14» → closed by «The checkpoint of v2 Session 14 = item 14.1»…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:3717  
  closed rec.: `docs/prompts/v2-session-15.md`:3  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:159 · `docs/README.md`:115
- **`docs/prompts/v2-session-15.md`** (prompt — closed by «The scope of v2 Session 15» → closed by «The checkpoint of v2 Session 15 = item 15.1»…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:3546,3693  
  closed rec.: `docs/prompts/v2-session-14.md`:169 · `docs/prompts/v2-session-16.md`:3  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:160 · `docs/README.md`:116
- **`docs/prompts/v2-session-16.md`** (prompt — closed by «The scope of v2 Session 16» → closed by «The checkpoint of v2 Session 16 = item 16.1»…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:3344,3526  
  closed rec.: `docs/prompts/v2-session-15.md`:194 · `docs/prompts/v2-session-17.md`:3  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:161 · `docs/README.md`:117
- **`docs/prompts/v2-session-17-5.md`** (prompt — closed by «The scope of v2 Session 17.5» → closed by «The checkpoint of v2 Session 17.5 = items 17.5…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:2891  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:162 · `docs/README.md`:118
- **`docs/prompts/v2-session-17.md`** (prompt — closed by «The scope of v2 Session 17» → closed by «The checkpoint of v2 Session 17 = items 17.1, 17…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:3141,3315  
  closed rec.: `docs/prompts/v2-session-16.md`:191  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:163 · `docs/README.md`:119
- **`docs/prompts/v2-session-18.md`** (prompt — closed by «The scope of v2 Session 18» → closed by «The final checkpoint of v2 Session 18 = item 18.…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:2680  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:164 · `docs/README.md`:120
- **`docs/prompts/v2-session-19.md`** (prompt — closed by «The scope of v2 Session 19» → closed by «The checkpoint of v2 Session 19 = item 19.1, the…)  
  §8: 1 row(s)  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:165 · `docs/README.md`:121
- **`docs/prompts/v2-session-20.md`** (prompt — closed by «The scope of v2 Session 20» → closed by «The final checkpoint of v2 Session 20 = item 20.…)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:2390  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:166 · `docs/README.md`:122 · `docs/RULE-MAINTENANCE.md`:114
- **`docs/prompts/v2-session-21.md`** (prompt — closed by «The scope of v2 Session 21» → closed by «The final checkpoint of v2 Session 21 = 21.3 and…)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:2247  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:167 · `docs/README.md`:123
- **`docs/prompts/v2-session-22.md`** (prompt — closed by «The scope of v2 Session 22» → closed by «The final checkpoint of v2 Session 22 = 22.3, 22…)  
  §8: 3 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:1985,2032,2075,2114  
  closed rec.: `docs/ATTESTATION-FORM.md`:7 · `docs/PHASE-4-PLAN.md`:75 · `docs/prompts/v2-session-21.md`:78  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:168 · `docs/README.md`:124
- **`docs/prompts/v2-session-23.md`** (prompt — closed by «The scope of v2 Session 23» → closed by «The final checkpoint of v2 Session 23 = 23.4, wi…)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:1880,1923  
  closed rec.: `docs/prompts/v2-session-22.md`:88  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:169 · `docs/README.md`:125
- **`docs/prompts/v2-session-24.md`** (prompt — closed by «The scope of v2 Session 24» → closed by «The final checkpoint of v2 Session 24 = 24.2–24.…)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:1440,1555,1584,1598  
  closed rec.: `docs/prompts/v2-session-23.md`:69  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:170 · `docs/README.md`:126
- **`docs/prompts/v2-session-27.md`** (prompt — closed by «The scope of v2 Session 27 (Phase 5, the design)» → closed by «Final checkpoint of v2 Ses…)  
  §8: 6 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:463,521,572,575 · `docs/archive/HANDOVER-to-2026-11-13.md`:1080,1309  
  closed rec.: `docs/prompts/v2-pv2-01-data-readiness.md`:7 · `docs/prompts/v2-pv2-05-prototype-hybrid-selection.md`:131  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:172 · `docs/README.md`:128 · `docs/SESSION-ARCHITECTURE.md`:16,122
- **`docs/prompts/v2-session-5.md`** (prompt — closed by «The scope of v2 Session 5» → closed by «The Part B checkpoint of v2 Session 5»)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:6156  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:174 · `docs/README.md`:130
- **`docs/prompts/v2-session-6.md`** (prompt — closed by «The scope of v2 Session 6» → closed by «The checkpoint of v2 Session 6 = item 2.3»)  
  §8: 3 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:5017,5301,5622,5644  
  closed rec.: `docs/V2-CLOSURE.md`:17,144 · `docs/prompts/v2-session-10.md`:4,19,43,180 · `docs/prompts/v2-session-11.md`:4,18,42 · `docs/prompts/v2-session-7.md`:3,17,31 · `docs/prompts/v2-session-8.md`:3,17,34 · `docs/prompts/v2-session-9.md`:4,19,40  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:175 · `docs/POST-V2.md`:6,440 · `docs/README.md`:131
- **`docs/prompts/v2-session-7.md`** (prompt — closed by «The scope of v2 Session 7» → closed by «The checkpoint of v2 Session 7 = item 2.4»)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:5613  
  closed rec.: `docs/prompts/v2-session-8.md`:18  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:176 · `docs/README.md`:132 · `docs/RULE-MAINTENANCE.md`:66
- **`docs/prompts/v2-session-8.md`** (prompt — closed by «The scope of v2 Session 8» → closed by «The checkpoint of v2 Session 8, part 2: the open …)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:5315  
  closed rec.: `docs/prompts/v2-session-9.md`:19  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:177 · `docs/README.md`:133
- **`docs/prompts/v2-session-9.md`** (prompt — closed by «The scope of v2 Session 9» → closed by «The checkpoint of v2 Session 9 = item 2.6»)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:4874  
  closed rec.: `docs/prompts/v2-session-10.md`:19  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:178 · `docs/README.md`:134
- **`docs/prompts/v2-stage-1-operational-closure.md`** (prompt — closed by «The scope of Stage 1 (Phase 4's operational closure)» → closed by «Stage 1 concluded: the…)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:1101  
  closed rec.: `docs/prompts/v2-pv2-01-data-readiness.md`:3  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:179 · `docs/README.md`:135 · `docs/SESSION-ARCHITECTURE.md`:19,89
- **`docs/prompts/v2-track-m-eidas2-milestone.md`** (prompt — closed by «The scope of the Track M session (eidas2 milestone)» → closed by «Final checkpoint of the…)  
  §8: 3 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:155,178,198  
  closed rec.: `docs/TRACK-M-EIDAS2-READING.md`:5  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:180 · `docs/README.md`:136
- **`docs/prompts/v2-trials-network-map-phone.md`** (prompt — closed by «The scope of the network-map trials session» → closed by «Final checkpoint of the network…)  
  §8: 4 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:117  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:182 · `docs/README.md`:138
- **`docs/prompts/v2-v2c-03-05-arrays.md`** (prompt — closed by «The scope of the V2C-03…05 session» → closed by «Final checkpoint of the V2C-03…05 sessio…)  
  §8: 2 row(s)  
  closed rec.: `docs/V2C-03-05-READING.md`:5  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:183 · `docs/README.md`:139
- **`docs/prompts/v2-v2c-12-v1-relationships.md`** (prompt — closed by «The scope of the V2C-12 session» → closed by «Final checkpoint of the V2C-12 session»…)  
  §8: 3 row(s)  
  closed rec.: `docs/V2C-12-READING.md`:5  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:184 · `docs/README.md`:140
- **`docs/prompts/v2-v2c-13-map-checks.md`** (prompt — closed by «The scope of the V2C-13 session» → closed by «V2C-13, W.4: the next session»)  
  §8: 3 row(s)  
  closed rec.: `docs/V2C-12-READING.md`:298 · `docs/V2C-13-MAP-CHECKS.md`:6  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:185 · `docs/README.md`:141
- **`docs/prompts/v2-v2c-17-19-map-nodes.md`** (prompt — closed by «The scope of the V2C-17…19 session» → closed by «Final checkpoint of the V2C-17…19 sessio…)  
  §8: 3 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:254  
  closed rec.: `docs/V2C-17-19-READING.md`:5  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:186 · `docs/README.md`:142
- **`docs/prompts/v2-v2c-21-eidas2-actors.md`** (prompt — closed by «The scope of the V2C-21 session» → closed by «Final checkpoint of the V2C-21 session appr…)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:454  
  closed rec.: `docs/V2C-21-READING.md`:5  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:187 · `docs/README.md`:143
- **`docs/prompts/v2-v2c-21b-eidas2-provisions.md`** (prompt — closed by «The scope of the V2C-21b session» → closed by «Final checkpoint of the V2C-21b session ap…)  
  §8: 4 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:320,350  
  closed rec.: `docs/V2C-21b-READING.md`:5  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:188 · `docs/README.md`:144
- **`docs/prompts/v2-visible-coverage.md`** (prompt — closed by «The scope of the coverage session» → closed by «Final checkpoint of the coverage session»…)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:99,108,164  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:190 · `docs/README.md`:146 · `docs/prompts/v2-visible-coverage-reading.md`:30
- **`docs/prompts/v2-visible-network-map.md`** (prompt — closed by «The scope of the network-map session» → closed by «Final checkpoint of the network-map se…)  
  §8: 4 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:137,146,164  
  closed rec.: `docs/prompts/v2-trials-network-map-phone.md`:5  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:191 · `docs/README.md`:147
- **`docs/F-18-READING.md`** (reading — closed by Final checkpoint of the F-18 session)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:225,229  
  closed rec.: `docs/prompts/v2-rules-maintenance-group-a.md`:17,28 · `docs/prompts/v2-rules-maintenance-group-b.md`:30  
  data/: `data/applicability.json`:392 · `data/claims.json`:2580  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:118 · `docs/HANDOVER.md`:72 · `docs/README.md`:69 · `docs/prompts/v2-docs-records.md`:55  
  tests: `tools/docs-check-selftest.mjs`:196,198
- **`docs/FRONTEND-REFERENCES.md`** (reading — closed by Final checkpoint of PV2-02 approved: B.2–B.4 and the prompt of PV2-03)  
  §8: 21 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:570 · `docs/archive/HANDOVER-to-2026-11-13.md`:396,558,690,702,711,730,766  
  closed rec.: `docs/HOMEPAGE-PRODUCTION-PLAN.md`:240 · `docs/PROTOTYPES.md`:6,29,44,55,67,114,208,276,367,407 · `docs/prompts/v2-hp-02-homepage-follow-up.md`:5,51 · `docs/prompts/v2-pv2-03-prototype-editorial.md`:5,34,58,89,94,103,121,135,171 · `docs/prompts/v2-pv2-04-prototype-observatory.md`:5,52,76 · `docs/prompts/v2-pv2-05-prototype-hybrid-selection.md`:6,62,87  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:120,362 · `docs/POST-V2.md`:144 · `docs/README.md`:71,193  
  code: `agent/browser/home-checks.mjs`:32,415  
  other: `prototypes/editorial/README.md`:3 · `prototypes/editorial/editorial.css`:7 · `prototypes/homepage/README.md`:165 · `prototypes/hybrid/README.md`:3 · `prototypes/hybrid/hybrid.css`:4,134 · `prototypes/hybrid/timeline.js`:6 · `prototypes/observatory/README.md`:3,32 · `prototypes/observatory/common.js`:4 · `prototypes/observatory/observatory.css`:4,127
- **`docs/RULES-MAINTENANCE-A-READING.md`** (reading — closed by Final checkpoint of the rules-maintenance session, group (a))  
  §8: 4 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:204  
  closed rec.: `docs/prompts/v2-rules-maintenance-group-b.md`:4,16,29  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:196 · `docs/HANDOVER.md`:70 · `docs/README.md`:153
- **`docs/RULES-MAINTENANCE-B-READING.md`** (reading — closed by Final checkpoint of the rules-maintenance session, group (b))  
  §8: 3 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:192  
  closed rec.: `docs/prompts/v2-track-m-eidas2-milestone.md`:4,16,29  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:197 · `docs/HANDOVER.md`:68,69 · `docs/README.md`:154 · `docs/prompts/v2-track-m-rules-round-2027-02.md`:5,21
- **`docs/TRACK-M-EIDAS2-READING.md`** (reading — closed by Final checkpoint of the Track M session (eidas2 milestone))  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:144  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:206 · `docs/README.md`:163 · `docs/prompts/v2-session-25.md`:227
- **`docs/V2C-03-05-READING.md`** (reading — closed by Final checkpoint of the V2C-03…05 session)  
  §8: 4 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:249  
  closed rec.: `docs/prompts/v2-f-18-dma-immediately.md`:66 · `docs/prompts/v2-v2c-17-19-map-nodes.md`:4,15,25,56  
  data/: `data/instruments.json`:4779,4799,4819,4839,4859  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:211 · `docs/HANDOVER.md`:74 · `docs/README.md`:168
- **`docs/V2C-12-READING.md`** (reading — closed by Final checkpoint of the V2C-12 session)  
  §8: 3 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:273  
  closed rec.: `docs/V2C-03-05-READING.md`:22,46 · `docs/prompts/v2-v2c-03-05-arrays.md`:32,74 · `docs/prompts/v2-v2c-13-map-checks.md`:16,33,72  
  data/: `data/instruments.json`:4210,4260,4385,4412,4462,4496,4572  
  active docs: `docs/CURRENT-ARCHITECTURE.md`:525 · `docs/DOCS-DEPENDENCY-MAP.md`:212 · `docs/HANDOVER.md`:76 · `docs/README.md`:169
- **`docs/V2C-17-19-READING.md`** (reading — closed by Final checkpoint of the V2C-17…19 session)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:236  
  closed rec.: `docs/prompts/v2-f-18-dma-immediately.md`:15,67 · `docs/prompts/v2-rules-maintenance-group-a.md`:16  
  data/: `data/instruments.json`:5163,5183,5203,5223,5243,5263,5283,5303,5323 · `data/sources.json`:249,643,713  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:214 · `docs/HANDOVER.md`:73 · `docs/README.md`:171
- **`docs/V2C-21-READING.md`** (reading — closed by Final checkpoint of the V2C-21 session approved: `eidas2`'s regulated actors and the promp…)  
  §8: 8 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:308,347  
  closed rec.: `docs/TRACK-M-EIDAS2-READING.md`:26,75 · `docs/V2C-17-19-READING.md`:75 · `docs/V2C-21b-READING.md`:8 · `docs/prompts/v2-track-m-eidas2-milestone.md`:29 · `docs/prompts/v2-v2c-21b-eidas2-provisions.md`:5,21,42,60,73  
  data/: `data/instruments.json`:5283  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:215 · `docs/README.md`:172
- **`docs/V2C-21b-READING.md`** (reading — closed by Final checkpoint of the V2C-21b session approved: `eidas2`'s provisions and the prompt of …)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:285  
  closed rec.: `docs/prompts/v2-v2c-12-v1-relationships.md`:17,35  
  data/: `data/instruments.json`:2345,2379  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:216 · `docs/README.md`:173
- **`docs/FIRST-END-TO-END-AUDIT.md`** (run — closed by on `main` `341ff39` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…) — **anchors:** P-07  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:9018  
  closed rec.: `docs/AUDIT-2026-11-11-P1.md`:35,155 · `docs/GOVERNANCE-PROPOSALS.md`:154 · `docs/PHASE-4-SETUP.md`:181  
  active docs: `AGENTS.md`:39 · `docs/AGENT-ROLES.md`:264 · `docs/AUTONOMY-AUTHORIZATION-POLICY.md`:350 · `docs/DOCS-DEPENDENCY-MAP.md`:24,119,252,361 · `docs/ORCHESTRATOR.md`:366,388,429 · `docs/README.md`:70 · `docs/prompts/v2-docs-records.md`:51  
  tests: `agent/simulation/selftest.mjs`:8  
  code: `agent/orchestrator/orchestrator.mjs`:88 · `agent/proposals/governance/patterns.mjs`:178 · `agent/proposals/governance/proposals.mjs`:132 · `agent/simulation/cycle.mjs`:28 · `agent/simulation/dispatchers.mjs`:33 · `agent/simulation/fixture.mjs`:29 · `agent/simulation/run.mjs`:8 · `agent/simulation/threshold.mjs`:24 · `agent/simulation/world.mjs`:27  
  other: `agent/simulation/README.md`:47
- **`docs/PROTOTYPES.md`** (run — closed by Final checkpoint of PV2-05 approved: C.2–C.6, the decision and the prompt of S27)  
  §8: 22 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:129,529,568,570,581 · `docs/archive/HANDOVER-to-2026-11-13.md`:181,256,282,363,372,394,396,410,527,555,557,580,582  
  closed rec.: `docs/prompts/v2-hp-02-homepage-follow-up.md`:4,27,76,114 · `docs/prompts/v2-hp-03-homepage-production-plan.md`:4,76 · `docs/prompts/v2-pv2-04-prototype-observatory.md`:6,33,55,79,83,90,93,95,104,113,138,177 · `docs/prompts/v2-pv2-05-prototype-hybrid-selection.md`:6,28,43,64,98,100,116,125,126,155,190 · `docs/prompts/v2-session-27.md`:26 · `docs/prompts/v2-visible-network-map.md`:5,22  
  published: `css/tools.css`:1592 · `js/network-model.js`:8 · `js/network-page.js`:6  
  active docs: `docs/CURRENT-ARCHITECTURE.md`:64 · `docs/DOCS-DEPENDENCY-MAP.md`:192 · `docs/HANDOVER.md`:78 · `docs/README.md`:148,193 · `docs/prompts/v2-docs-records.md`:47  
  code: `agent/browser/network-checks.mjs`:5  
  other: `prototypes/editorial/README.md`:41 · `prototypes/hybrid/README.md`:4,9,49,51 · `prototypes/hybrid/explorer.js`:26 · `prototypes/hybrid/hybrid.css`:471 · `prototypes/observatory/README.md`:4,7 · `prototypes/observatory/common.js`:16
- **`docs/SESSION-25-FIRST-REAL-WORLD-RUN.md`** (run — closed by on `main` `cdfe375` (no §8 row closes its session; closed by the rule of «D2, D2.2 questio…) — **anchors:** P-07, P-08, P-09, P-10, P-11  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:8938,8965,8980  
  closed rec.: `docs/prompts/v2-docs-coherence.md`:68  
  active docs: `AGENTS.md`:42 · `docs/DOCS-DEPENDENCY-MAP.md`:23,201,253,254,255,256,257 · `docs/README.md`:158 · `docs/prompts/v2-docs-records.md`:47,51  
  code: `agent/proposals/governance/patterns.mjs`:177,192,207,224,239
- **`docs/v2-design/session-10-before-after.md`** (run — closed by The checkpoint of v2 Session 10 = items 10.1 and 10.2)  
  §8: 1 row(s)  
  archive: `docs/archive/HANDOVER-to-2026-11-13.md`:4316,4371  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:210 · `docs/DOCUMENTATION-ARCHITECTURE.md`:95 · `docs/README.md`:167
- **`docs/V2C-13-MAP-CHECKS.md`** (run — closed by V2C-13, W.4: the next session)  
  §8: 2 row(s)  
  archive: `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`:261  
  closed rec.: `docs/V2-CLOSURE.md`:178 · `docs/V2C-03-05-READING.md`:68 · `docs/prompts/v2-v2c-03-05-arrays.md`:5,16,31 · `docs/prompts/v2-v2c-17-19-map-nodes.md`:25  
  active docs: `docs/DOCS-DEPENDENCY-MAP.md`:213 · `docs/HANDOVER.md`:75 · `docs/README.md`:170  
  code: `tools/map-audit.mjs`:12
