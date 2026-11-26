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
| **D5 · State and handover** | If decided in D1, a generated current state with its CI check; `docs/HANDOVER.md` reduced by moving closed entries to `docs/archive/` byte for byte, anchors updated in the same commit (the precedent of 22 Nov 2026) | write a state by hand | written by D4 |
| **D6 · Records and the final measure** | Executed prompts, readings and audits moved to an archive path, every reference (Markdown, code, workflows, skills, prompts, anchors, pins) updated in the same commit; §5 measured and reported | move a policy or a specification | written by D5 |
| (D7 · Buffer) | Only a check that D6 could not close inside its scope | — | written by D6 if needed |

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
