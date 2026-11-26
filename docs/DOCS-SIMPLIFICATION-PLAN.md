# DOCUMENTATION SIMPLIFICATION — the programme D1…D6

**Lifecycle:** active · **Authority:** canonical · **Home of:** the documentation programme D1…D6 · **Catalogue:** `docs/README.md`

**Status: THE FOUR DECISIONS BELOW ARE THE AUTHOR'S** (`docs/ROADMAP-v2.md` §8, the four rows of 25 Nov 2026 «The documentation
simplification programme, …»). **This text is proposed with them and is approved, or not, by the author at the merge of its pull request.**
Written on 25 Nov 2026 in the translation-review session (24–25 Nov 2026, unnumbered: no §8 row gave it a scope, which is stated here
rather than hidden), on `claude/eudigitalpolicy-translation-review-f7jdzs`, from `main` `685dd22` (#137 merged).

**What this file is the home of:** the documentation programme's sessions, their order, what each may and may not do, and how the
programme is judged finished. **What it is not the home of:** the state of the project (that is `main` and §8), the rules (each in its own
home: `docs/AI-SAFE-BOUNDARIES.md`, `docs/AUTONOMY-POLICY.md`, `docs/DATA-GOVERNANCE.md` …), the order of the other work
(`docs/SESSION-ARCHITECTURE.md`, which names this programme as Track D and points here). Each session's own instructions are its prompt.

---

## 0 · Where it comes from

On 25 Nov 2026 the author shared, in chat, a proposal for reorganising the documentation written with ChatGPT, and asked the session's
opinion. **The proposal is not in the repository** (§8, «… the proposal»: summarised here, the original kept out of the public repository).
What this plan takes from it:

- **Three levels:** an operational entry (the few documents every session needs), domain handbooks read when a task needs them, and
  records and archive read on request only.
- **The order of the work:** first the documents' truth, then their authority, only then any physical move.
- **A dependency map before any move**, and no move, merge or deletion done automatically by a tool.
- **`docs/ROADMAP-v2.md` §8 stays the record of decisions**, untouched in structure.
- **What is not measured is not an error and not a success:** `url:live` stored is not an HTTP check, `unmeasured` is not a failure, a
  claim's classification is not a legal verification, a JSON's raw size is not a measure of speed.
- **Success is not counted in files moved**, but in criteria (§5).

What this plan changes, and why (measured by the session on `685dd22`; the measurements are in `docs/prompts/v2-docs-coherence.md`,
«Il punto di partenza»):

1. **Dependencies are sentences, not only paths.** `agent/proposals/governance/patterns.mjs` holds 29 anchors to exact strings in tracked
   files, 9 of them in `AGENTS.md`; a changed sentence makes `node agent/proposals/governance/cli.mjs check` report REFUTED and the CI fail.
   `tools/validate.mjs` reads `docs/ROADMAP-v2.md`, `.control-room/views.mjs` reads `AGENTS.md`, `agent/ux/surface.mjs` reads `README.md`,
   `agent/implement/baseline.mjs` parses §12 of `docs/CURRENT-ARCHITECTURE.md`. The map (D1) and the check (D3) cover sentences.
2. **A current state, if any, is generated.** A hand-written `CURRENT-STATE.md` would be the second home `docs/DATA-GOVERNANCE.md`
   forbids, and would go stale as `docs/HANDOVER.md` did. If the author wants one (D1's question), it is produced by a tool, with a
   `--check` in CI, as `tools/_footer.mjs` produces the pages.
3. **Some of these texts are governance.** `AGENTS.md`, the skill `project-context`, `docs/AI-SAFE-BOUNDARIES.md`,
   `docs/AUTONOMY-POLICY.md` and the README's «Known limitations» (red tier, `docs/AI-SAFE-BOUNDARIES.md` §3) change on the author's
   words, recorded in §8 before the change.
4. **The check comes before the moves** (D3 before D4–D6), so that every later change is verified when it is made.
5. **Only closed records move** (the author's decision, §1): policies and specifications keep their paths, and the catalogue (D2) gives
   the view by domain.

## 1 · The author's decisions (25 Nov 2026)

| Question | Answer, in the author's words | What it means here |
|---|---|---|
| How the programme runs, against the alternation of 22 Nov 2026 | «Programma continuo (Recommended)» | D1…D6 run one after another; the alternation of 22 Nov 2026 is suspended for these six sessions only, and resumes after D6 |
| By when | «Entro il 10 gennaio (Recommended)» | D6 closes by 10 Jan 2027, before v2 Session 25's window (12 Jan 2027) |
| How much moves | «Solo i record chiusi (Recommended)» | only executed prompts, readings and audits move, in D6; nothing else changes path |
| The proposal | «Riassunta nel piano (Recommended)» | §0 of this file; the original is not committed |

## 2 · The sessions

Each session starts only once the previous one is approved at its checkpoint (the brief: «Non implementare nulla prima che la sessione
precedente sia stata approvata»), and writes the next one's prompt (the standing rule of 4 Nov 2026).

| Session | Does | Does not | Prompt |
|---|---|---|---|
| **D1 · Truth and map** | Corrects, one by one and each with its source, the statements that contradict `main` or §8; writes `docs/HANDOVER.md`'s entry for 24–25 Nov 2026; regenerates `docs/i18n-review/it.md`; produces the dependency map (paths and quoted sentences) in `docs/`; puts the four remaining questions to the author (§3) | move, rename, merge or delete anything; write red-tier text without a §8 row | `docs/prompts/v2-docs-coherence.md` |
| **D2 · Authority and catalogue** | `docs/README.md`, the catalogue by domain, kind and lifecycle; a standard header (lifecycle, authority, the home it is or points to) on each document in `docs/`; `docs/PROJECT-CONTEXT.md` marked as a snapshot; `docs/DOCUMENTATION-ARCHITECTURE.md` with the rules of classification | move; shorten `AGENTS.md` | `docs/prompts/v2-docs-authority-catalogue.md` (written by D1) |
| **D3 · The check** | The documentation check decided in D1 (a new tool or an existing one extended): internal links, paths named in code, workflows, skills and prompts, **sentences quoted by anchors and pins**, status headers against §8, counts the catalogue derives; wired into CI | move; touch `AGENTS.md` | `docs/prompts/v2-docs-check.md` (written by D2) |
| **D4 · `AGENTS.md` and the skill** | `AGENTS.md` reduced as the author decided, each rule that leaves it moved to its own home in the same commit, the 9 anchors updated in that commit; `project-context` reading by levels (the binding constraints always, the domain documents when the task needs them), with its tests | change a rule's meaning; drop a rule | `docs/prompts/v2-docs-agents-entry.md` (written by D3) |
| **D5 · State and handover** | If decided in D1, a generated current state with its CI check; `docs/HANDOVER.md` reduced by moving closed entries to `docs/archive/` byte for byte, anchors updated in the same commit (the precedent of 22 Nov 2026) | write a state by hand | `docs/prompts/v2-docs-handover.md` (written by D4) |
| **D6 · Records and the final measure** | Executed prompts, readings and audits moved to an archive path, every reference (Markdown, code, workflows, skills, prompts, anchors, pins) updated in the same commit; §5 measured and reported | move a policy or a specification | `docs/prompts/v2-docs-records.md` (written by D5) |
| (D7 · Buffer) | Only a check that D6 could not close inside its scope | — | `docs/prompts/v2-docs-buffer.md` (written by D6) |

**26 Nov 2026, D6 (a dated note; the row above stays as written):** **nothing moves.** D6.1 measured every one of the 79 closed records
cited by a home no session may rewrite — §8, the archive of `docs/HANDOVER.md`, `data/`, published files, the ledger — so the row's «every
reference … updated in the same commit» could not hold for any of them (`docs/RECORDS-MAP.md`), and the author decided that they stay at
their paths (`docs/ROADMAP-v2.md` §8, «D6, D6.1 question 1: whether, and where, the closed records move»). D6 measures §5 and writes the
next session's prompt.

## 3 · The questions left for D1

1. `AGENTS.md`: to what it is reduced, and where the rules that leave it go.
2. `project-context`: reading by levels, or as it is.
3. A current state: generated by a tool, or none (the header of `docs/HANDOVER.md` as today). Not hand-written (§0, point 2).
4. The documentation check: a new tool, or which existing one is extended (`tools/validate.mjs`, `tools/prose-homes.mjs`, the governance
   check), and what it checks.

## 4 · Rules for every session of the programme

- **Track M pre-empts.** A Track M session that is due (`docs/SESSION-ARCHITECTURE.md` §3) interrupts the programme. If D6 is not closed
  by 10 Jan 2027, the session in progress stops at a checkpoint, what remains is named in its prompt, and the programme resumes after the
  rules round of February 2027 (`docs/prompts/v2-track-m-rules-round-2027-02.md`).
- **Nothing is moved before D6**, and in D6 only closed records.
- **`docs/ROADMAP-v2.md` §8 is append-only**: rows are added, never rewritten or reordered.
- **No text of the brief, no `i18n/`, no `data/`:** a changed English sentence of the brief makes its approved Italian translation stale
  and takes `/it/` out of search until the author reads it again.
- **No translation review is recorded**, and no red-tier text is written without its §8 row.
- **An anchor, a pin or a test is never weakened to pass.** If a true correction breaks one, it is updated in the same commit and said.
- **The battery** before every checkpoint: `validate`, `i18n-audit`, `design-qa`, `seo-audit`, `node tools/_footer.mjs --check`,
  `node agent/proposals/governance/cli.mjs check`, `node --test tools/selftest.mjs`, every suite listed in `.github/workflows/qa.yml`,
  `.control-room/`, `node agent/schemas/cli.mjs check`, `node tools/commit-evidence.mjs <base> HEAD`. The validators' output stays the
  base's; a new warning is a finding.

## 5 · When the programme is finished (measured in D6)

1. No binding rule, agent capability or operational function lost.
2. No internal reference broken, including those in scripts, skills, workflows and anchors.
3. Every statement about the current state has an identifiable source.
4. No two documents describe the same state differently.
5. No historical document is loaded at the start of a session without a reason.
6. A session can find the documents a task needs from the catalogue, without loading the archive.
7. The battery (§4) passes, and the baseline, the agent workflows, the deployment and the tests work as before.
8. Phase 4, Phase 5 and Post-v2 read as §8 records them, in every document that states them, with no competing copy of a decision.
9. The documentation keeps apart technical reachability, substantive freshness and human verification of sources.
10. `unmeasured`, `unknown` and `not observed` are never presented as an error or a success.
11. Payload sizes are labelled raw sizes until a network or Web Vitals measurement exists.
12. The substantive findings that remain open stay visible in `docs/HANDOVER.md` (or the generated state) until they are closed.

### 5a · Measured in D6 (26 Nov 2026)

Measured by documentation session D6 (D6.3; `docs/ROADMAP-v2.md` §8, «The scope of the documentation session D6») on
`claude/zen-brahmagupta-btc1tx` at `74c16e0`, against the programme's base `main` `36d57d7` (before D1) and D6's base `main` `c47b535`,
with scripts kept outside the repository where a command does not exist. **Nine points pass, two fail, one fails in part. A point that
fails is stated with its cause and is not made to pass** (D6's prompt).

| # | Result | Method | What it does not measure |
|---|---|---|---|
| 1 | **Pass** | `AGENTS.md`'s «The rules that matter most» and «When to stop and ask» byte-identical to `36d57d7` (checksums). Of the 155 paragraphs of `36d57d7`'s `AGENTS.md`, 47 are no longer in it: 41 are verbatim in another tracked file; 4 are the pointers D4 left because their home held every fact, and the facts are there (`docs/GOVERNANCE-PROPOSALS.md` §6b, `docs/DATA-GOVERNANCE.md` §6, `docs/VERIFICATION-POLICY.md`, `docs/SECURITY-VERIFICATION-2026-09-08.md` §2); 2 changed by decision (the reading order, now the skill's — §8, «D4, D4.1: the reading order's homes»; the roadmap's index row, corrected by D1). Outside the documentation the programme changed 9 files, +1 474/−12 (the check and its suite, its CI step, `AGENT_SUITES` and R6, 12 anchor `path`s, 3 message paths, a scout digest); no file under `data/`, `i18n/`, `js/`, `css/` or a page. The suites: point 7. | whether a reader relied on a sentence's place rather than its text; capabilities no suite tests |
| 2 | **Pass** | `tools/docs-check.mjs`: 0 errors (3 links, 2 236 `docs/…` paths in code, workflows, skills and prompts, 29 anchors, 9 pins), the same 4 warnings as at D3; `node agent/proposals/governance/cli.mjs check` exit 0. Nothing moved but D5's entries, which carried no anchor (D6 moved nothing: §8, «D6, D6.1 question 1 …»). The `docs/…` paths written in Markdown prose, which no tool checks: in active documents 80 do not resolve — 79 are the «proposed path» column of `docs/RECORDS-MAP.md` (no one's plan, by its dated note) and 1 a §8 row naming the state file the author decided not to create; 1 in a closed record (`docs/AUDIT-2026-10-21.md:60`, a file it says was replaced), 4 in the archive (D3's warnings, quoted). | links from outside the repository; paths composed at run time |
| 3 | **Not established** | Where a tool checks it, every current-state statement has its source: the catalogue's 156 citations and 35 «Closed by» headers resolve to §8 or `main` (CLOSED: 0); the baseline of `docs/CURRENT-ARCHITECTURE.md` §12 names its commit and matches today's output (47 unverified, 7 warnings; boundary 0 blocking, 24); the header of `docs/HANDOVER.md` cites §8 rows for each decision it states. Beyond the «always» level and the catalogue, no one traced the prose of 140 documents; and one active statement about the current state has a source that §8 has since overtaken (point 8). | the prose of the documents outside the «always» level |
| 4 | **Fails** (once) | A fixed set of states that several documents state, compared with each other and with the code: the validator baseline, the unverified count, the ledger («one entry»; `decisions.jsonl` 1 line), the skills (sixteen; 16 directories), the next session (D6 in `docs/HANDOVER.md`, this plan §2, `docs/SESSION-ARCHITECTURE.md`) agree. **Phase 5 and Post-v2 do not: `docs/PHASE-5-SETUP.md` against §8** — point 8. (`docs/CURRENT-ARCHITECTURE.md` §12's last suite figure is dated 4 Nov 2026 — 25 `AGENT_SUITES`, 1 394 tests — where today there are 26 and 1 540: dated, not contradicted.) | states outside the set; two documents that agree and are both wrong |
| 5 | **Fails in part** | The «always» level (`docs/AI-SAFE-BOUNDARIES.md` §0 and §3, the header of `docs/HANDOVER.md`, `AGENTS.md`'s rules) holds only active documents; `CLAUDE.md` carries no list (SKILL-ENTRY: 0); the header says the archive is read on request; `AGENTS.md`'s index names 17 closed records, as «an index, not a reading order». **But the header of `docs/HANDOVER.md`, read at every start, carries five quoted headers of sessions whose entries are archived** (D4, D3, D2, D1, the network-page follow-up; the header is 7 988 bytes) **and grows by one per session**: D6's own header makes it six. Cause: no session may shorten it without a §8 row (D5's finding; D6's prompt). | what a session reads beyond what it is told to |
| 6 | **Pass** | `docs/README.md` §2 has a row for each of the nine domains (SKILL-READ: 0); its 40 paths are 36 active documents, 1 generated pattern and 3 closed records named as records in the «when the task touches it» column (`docs/PROTOTYPES.md`, `docs/FRONTEND-REFERENCES.md`, `docs/HOMEPAGE-PRODUCTION-PLAN.md`); none is in `docs/archive/`. | whether a real task finds what it needs: no session was observed |
| 7 | **Pass** | The battery of §4 on `74c16e0`: `validate`, `i18n-audit`, `design-qa`, `freshness`, `evidence-audit`, `seo-audit` output identical to `c47b535`; `docs-check` identical but for its count line (+1 document, `docs/RECORDS-MAP.md`); `_footer.mjs --check`, governance and `agent/schemas` checks exit 0; boundary 0 blocking, 24 warnings; the 26 `AGENT_SUITES` and `.control-room/`: 1 540 tests, 1 539 pass, 0 fail, 1 skipped — D5's figure; `commit-evidence c47b535 HEAD`: 3 commits, no published file. | the deployment itself: no release ran in the programme, and the Pages workflow does not run here |
| 8 | **Fails** | Every document that states the status of Phase 4, Phase 5 or Post-v2, against §8 («Phase 4 concluded», 4 Nov 2026; «G2: Stage 3 is opened, and with it Phase 5», 13 Nov 2026; the rows that opened Post-v2's A, B and C, 9–11 Nov 2026). `docs/ROADMAP-v2.md`'s status (D1's dated note), `AGENTS.md`, `docs/SESSION-ARCHITECTURE.md`, `docs/POST-V2.md` (D1) and the catalogue's own row agree. **`docs/PHASE-5-SETUP.md` (active, canonical) does not**: its status line says «PHASE 5 IS PLANNED AND NOT OPENED» (line 5) and §5.2 says Post-v2 is «not opened; after the v2» (line 177), with no dated note. Cause: D1's corrections did not reach it. | a status stated only in a closed record, which is true on its date |
| 9 | **Pass** where stated | Each has its home and says it is not the others: `docs/SOURCE-POLICY.md` §8 «Reachability is asserted, not measured» («An agent must not describe `url:live` as verified»); `docs/VERIFICATION-POLICY.md`: `freshness.mjs` measures no reachability and no correctness; `docs/CONTENT-FRESHNESS-POLICY.md` reads with the verification policy and is closed by verification against primary sources only; `docs/EVIDENCE-MODEL.md` §8 derives freshness from a date. | every sentence of every document: no tool reads prose (`docs/VERIFICATION-POLICY.md`) |
| 10 | **Pass** where measured | `node agent/health/cli.mjs --as-of 2026-11-26`: 13 metrics shown `?` UNMEASURABLE, «? not measured» in the legend, no overall score; the browser suite exits 2, «did not run»; `docs/CONTINUOUS-IMPROVEMENT.md`: «An observer that did not run is not an observer that found nothing»; `docs/DEPLOYMENT.md` lists C5 and C7 as «not measured». | the prose of the documents outside these homes |
| 11 | **Pass** in substance | No network or Web Vitals measurement exists, and no code reports a payload size. Active documents state file sizes as file sizes (`docs/CURRENT-ARCHITECTURE.md`: a 62 KB script, a 67 KB blob), without the word «raw». One closed plan says a reader «downloads 391 109 bytes» (`docs/HOMEPAGE-PRODUCTION-PLAN.md:83`): a byte count presented as a download, unlabelled, true on its date as a record. | sizes in code comments and prototypes |
| 12 | **Pass** | D5's entry in `docs/HANDOVER.md` lists the open findings of the archived entries, one line each (31 lines): 10 with no other home, 21 whose other home resolves; D4's entry keeps its five «After D4» findings. D6 changes neither, and its own entry carries them on. | findings that a closed record names and no entry carried (D5's list leaves records' remarks about other records as written there) |

**26 Nov 2026, documentation session D7 (a dated note; §5a above stays as written).** Re-measured by D7.3 (`docs/ROADMAP-v2.md` §8, «The scope of the documentation session D7») on `claude/serene-feynman-9vo5ej` at `71d8420`, against D7's base `main` `5100c5d`, with §5a's method. **Eleven points pass; 3 is still not established.**

- **4 — passes.** The same fixed set agrees, and Phase 5 and Post-v2 now agree too: `docs/PHASE-5-SETUP.md` carries two dated notes (`68552e8`), under its status line and under §5.2's table, each citing its rows of §8 («G2: Stage 3 is opened, and with it Phase 5»; «Post-v2 A may open before G1, …», «G1: Stage 2 is opened», the final checkpoints of PV2-01…PV2-05, «The Hybrid's first piece in production»). The old words stay as written, marked by the note — D1's practice on `docs/ROADMAP-v2.md`, which §5a counted as agreeing. The next session reads D7 in `docs/HANDOVER.md` and in this plan §2; `docs/SESSION-ARCHITECTURE.md` names «a buffer D7 only if needed».
- **5 — passes.** The header of `docs/HANDOVER.md` is 8 lines and 1 502 bytes, the current session's own text, with no quoted header (it was 44 lines and 9 393 bytes at `0cf0978`): the six quoted headers moved byte for byte to `docs/archive/HANDOVER-headers.md` (`71d8420`; 7 890 bytes, compared by a script kept outside the repository), and the rule that keeps it so is in `docs/DOCUMENTATION-ARCHITECTURE.md` §7 («D7, D7.2 question 1 …», «… question 2 …»). What it does not measure: that later sessions follow the rule — no tool checks it.
- **8 — passes.** Every document §5a measured, re-read: `docs/ROADMAP-v2.md`, `AGENTS.md`, `docs/SESSION-ARCHITECTURE.md`, `docs/POST-V2.md`, the catalogue's row and now `docs/PHASE-5-SETUP.md` state Phase 4 concluded, Phase 5 opened with G2, Post-v2's A–C run and D–E not opened. A search of the active documents outside §8, the prompts and the archive for a status worded otherwise found none. `docs/PHASE-5-SETUP.md` §8 («That Phase 5 is open … The approval of this plan does not open it») is true as written and has no note.
- **The other nine, on this tree.** D7 changed six files, all under `docs/` (`git diff 5100c5d HEAD`), none of them `AGENTS.md`, a skill, code, `data/`, `i18n/` or a page. 1: `AGENTS.md`'s two rule sections still byte-identical to `36d57d7` (checksums). 2: `docs-check` 0 errors, the same 4 warnings; governance check exit 0. 3: as §5a, not established. 6: the catalogue's reading lists unchanged (SKILL-READ 0). 7: the battery on `71d8420` — validators' output identical to `5100c5d`, `docs-check` but for its count line (+1 document); `_footer.mjs --check`, `agent/schemas` check exit 0; `tools/selftest.mjs` 201/201; boundary 0 blocking, 24 warnings; the 26 `AGENT_SUITES` and `.control-room/` 1 540 tests, 1 539 pass, 0 fail, 1 skipped; `commit-evidence 5100c5d HEAD` no published file. 9, 10, 11: their homes untouched by D7, as §5a. 12: D5's list of 31 open findings and D4's five are in `docs/HANDOVER.md`'s entries, byte-identical below the header.

## 6 · Risks

- **A broken anchor turns the CI red after a merge.** D3 exists to catch it before; until D3, every session runs the governance check
  after each documentation commit.
- **A reduced `AGENTS.md` loses a rule silently.** D4 moves each rule to a named home in the same commit, and the diff is read rule by
  rule with the author.
- **The calendar.** Six sessions in about six weeks, with milestones on 2, 9 and 24 Dec 2026 handled by v2 Session 25 (25.2), not here.
- **The substantive backlog is not this programme's.** Re-reading enforcement records and sources, the Source Scout's pull request step,
  the claims without a primary source: separate work, named in `docs/HANDOVER.md`, not closed by tidying documents.

## 7 · What this document does not establish

That any statement in the documentation is true or false: D1 measures each against `main` and §8. Which sessions follow D6: the alternation
of 22 Nov 2026 resumes, and the next prompt says which. Any change to a rule, a policy or the brief.
