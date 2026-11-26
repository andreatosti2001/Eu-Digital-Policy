# DOCUMENTATION DEPENDENCY MAP — who reads each document, and which of its sentences code depends on

**Lifecycle:** active · **Authority:** reference · **Home of:** who reads each document; the anchored sentences · **Snapshot of:** `5232941` · **Catalogue:** `docs/README.md`

**Status: A MEASUREMENT AND A PROPOSAL; IT DECIDES NOTHING AND MOVES NOTHING.** Written in documentation session D1 (26 Nov 2026,
`docs/DOCS-SIMPLIFICATION-PLAN.md` §2; scope: `docs/ROADMAP-v2.md` §8, «The scope of the documentation session D1»), on
`claude/intelligent-rubin-8pykrj`, measured on `5232941`. **A snapshot:** the script that produced §A–§C was kept outside the
repository, as D1's prompt asks, so nothing here regenerates this file; keeping dependencies current is D3's check
(`docs/DOCS-SIMPLIFICATION-PLAN.md` §2, D3). The lifecycle and authority columns are **proposals** for D2's catalogue, each with the
rule that produced it; D2 decides them, not this file.

**What this file is the home of:** which tracked files name each document, which exact sentences code depends on, and which
documents code parses, on `5232941`. **What it is not the home of:** the state of the project (`main` and §8), a document's
classification (D2), the rules.

## 0 · What it found

- **138 documents in scope** (every `.md` under `docs/`, 135, and the three at the root: `AGENTS.md`, `CLAUDE.md`, `README.md`),
  **4.79 MB**. Four exceed 100 kB: `docs/archive/HANDOVER-to-2026-11-13.md` (818 kB), `docs/ROADMAP-v2.md` (772 kB),
  `docs/i18n-review/fr.md` (237 kB) and `es.md` (231 kB). The 69 other tracked `.md` files (skills, agent READMEs, prototypes, scout
  digests) are counted as readers, not mapped.
- **Sentences, not only paths.** `agent/proposals/governance/patterns.mjs` holds **29 anchors to exact strings** (§B.1): 9 in
  `AGENTS.md`, 5 each in the HANDOVER archive, `docs/AUDIT-2026-09-01.md` and `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md`, 2 in
  `docs/BROWSER-QA.md`, 1 each in `docs/AUDIT-2026-09-03.md` and `docs/FIRST-END-TO-END-AUDIT.md`, and 1 in a code file
  (`agent/policy/categories.mjs`). Changing one of those sentences makes `node agent/proposals/governance/cli.mjs check` report REFUTED.
  **Five of the seven documents holding them are closed records** that D6 may move: each move must update its anchors in the same commit.
- **Eight files read six documents' text**, confirmed by reading the code (§B.3 is the script's wider heuristic, and the rows it
  adds are named below as what they are):

  | Document | Read by | What it depends on |
  |---|---|---|
  | `docs/CURRENT-ARCHITECTURE.md` | `agent/implement/baseline.mjs` | the line `**Baseline at commit \`…\`**` and the first fenced block after it (§12): a line per validator and the line `agent/implement/boundary.mjs` |
  | `docs/CURRENT-ARCHITECTURE.md` | `agent/detector/selftest.mjs` | the table between `## 5. Dataset dependency map` and `## 6.`, compared with the code |
  | `docs/CURRENT-ARCHITECTURE.md` | `agent/implement/selftest.mjs` | §12's boundary line, removed in a scratch copy (S1B-f) |
  | `docs/ROADMAP-v2.md` | `tools/validate.mjs` | §8's row titles (A-6: every row titled, no title twice) |
  | `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | copied whole into scratch trees for `validate.mjs`'s A-6, and read for the attestation tests |
  | `AGENTS.md` | `.control-room/views.mjs` | the section from `## Known hazards` to the next `## `, split on `\n- ` |
  | `README.md` | `agent/ux/surface.mjs` | limitation 7, quoted verbatim into every record Agent 8 writes |
  | `docs/CONTROL-ROOM.md` | `.control-room/selftest.mjs` | §5's inventory table (test INVENTORY 1.3) |

  **Named by the heuristic and not reads:** `README.md` in `.control-room/boundary.mjs`, `agent/improve/selftest.mjs` and
  `agent/simulation/selftest.mjs` is a directory's own `README.md`; `docs/IMPLEMENTATION-QA.md` in `.control-room/selftest.mjs` is
  in a scan's exclusion list; `docs/DEPLOYMENT.md` in `agent/implement/boundary.mjs` and `docs/V2-DATA-DESIGN.md` in
  `tools/selftest.mjs` are a comment and a negative assertion. **Renaming or moving any document still breaks the exclusion list and
  every path that names it**; only the eight above depend on its text.

  And one generic reader: `agent/proposals/governance/evidence.mjs` reads whatever path an anchor names, so every document in §B.1 is
  read by it.
- **The skills name documents an agent must read**: `.agents/skills/project-context/SKILL.md` names five for every session
  (`docs/PROJECT-CONTEXT.md`, `docs/CURRENT-ARCHITECTURE.md`, `docs/AI-SAFE-BOUNDARIES.md`, `docs/HANDOVER.md`, `README.md`); the
  «skill» column counts every skill file that names a document.
- **Proposed lifecycle** (§A, by the rules in its last column): 12 active and normative; 4 active and canonical (`docs/ROADMAP-v2.md`, `docs/CURRENT-ARCHITECTURE.md`, `docs/HANDOVER.md`, `README.md`); 3 generated (`docs/i18n-review/`);
  26 closed records (audits, readings, measured runs) and 2 closed references (`PHASE-4-SETUP`, `PHASE-4-PLAN`); 1 historical
  (the archive); 45 prompts **opened** (a §8 scope row cites them — whether each session finished, the rule cannot tell: v2 Session 25's
  prompt is opened and its reading is still to come); 4 prompts with no scope row (`v2-session-28`, `v2-stage-1-operational-closure`,
  `v2-track-m-rules-round-2027-02`, `v2-visible-coverage-reading`: pending, or opened without one); **41 not determined** by any rule.
- **Two documents no tracked file names**: `docs/i18n-review/fr.md` and `es.md` (generated sheets, read by the person reviewing).

## 1 · What this map does not know

- **Paths built at run time.** A reader that composes a name (`join('docs', name)`, a template, a list read from a file) is found only
  where the file name appears literally; `evidence.mjs`'s generic read is named above by hand.
- **Readers outside the repository**: session prompts pasted in chat, the author's own habits, links from elsewhere on the web.
- **What a prompt or a skill makes an agent read.** The skill and prompt columns count files that *name* a document; whether the
  instruction says «read it» or only cites it is not distinguished.
- **Sentences other documents quote.** Only code, tests and workflows were searched for pins (§B.2); a document quoting another
  document's sentence, and anchors inside Markdown links (`#section`), were not.
- **Whether a link resolves.** No internal link was followed; that is D3's check.
- **Whether a «closed» or «opened» label is right.** Each label is a rule over the file name or §8, stated beside it; 41 documents fit
  no rule and are «not determined», not «reference».
- **§B.2 is a heuristic**: a literal of twelve or more characters in a file of §B.3 that also occurs in the document. Many are
  coincidences (taxonomy ids such as `status:in-force` appear in `docs/ROADMAP-v2.md` and in `tools/selftest.mjs` independently);
  read the code before relying on a line.

<!-- Generated on `5232941` by a script kept outside the repository (D1, D.2). A snapshot: nothing in the repository regenerates it. -->
## A · Every document, measured

Columns: **bytes**; how many tracked files name it, by kind — **code**, **test** (selftests), **wf** (workflows), **skill**, **prompt** (docs/prompts), **doc** (other Markdown), **other** (JSON, HTML, CSS); **anchors**: governance anchors in `patterns.mjs` on its text; **pins**: string literals of ≥ 12 characters in code, tests or workflows that name the document and that occur verbatim in it; **reads**: code, tests or workflows that name it and read files (a heuristic for "parses it"); **lifecycle** and **authority**: a *proposal*, with the rule that produced it.

| Document | bytes | code | test | wf | skill | prompt | doc | other | anchors | pins | reads | lifecycle (proposed) | authority (proposed) | why |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| `AGENTS.md` | 66073 | 48 | 8 | 1 | 1 | 14 | 40 | 3 | 9 | 1 | 1 | active | normative | the agent entry point |
| `CLAUDE.md` | 1413 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | active | normative | the agent entry point |
| `docs/AGENT-CONTRACTS.md` | 34576 | 1 | 0 | 0 | 0 | 0 | 12 | 0 | 0 | 0 | 0 | active | normative | a policy, the brief or a contract |
| `docs/AGENT-ROLES.md` | 18931 | 24 | 3 | 0 | 0 | 0 | 13 | 0 | 0 | 0 | 0 | active | normative | a policy, the brief or a contract |
| `docs/AGENT-RUNBOOK.md` | 13711 | 2 | 0 | 1 | 0 | 0 | 11 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/AI-SAFE-BOUNDARIES.md` | 10992 | 23 | 1 | 1 | 16 | 28 | 45 | 11 | 0 | 0 | 0 | active | normative | a policy, the brief or a contract |
| `docs/archive/HANDOVER-to-2026-11-13.md` | 818017 | 1 | 0 | 0 | 0 | 1 | 2 | 0 | 5 | 0 | 0 | historical | record | under docs/archive/ |
| `docs/ATTESTATION-FORM.md` | 17739 | 5 | 2 | 0 | 0 | 11 | 10 | 1 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/AUDIT-2026-09-01.md` | 29833 | 36 | 1 | 1 | 0 | 2 | 22 | 1 | 5 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/AUDIT-2026-09-03.md` | 11811 | 1 | 0 | 0 | 1 | 0 | 2 | 0 | 1 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/AUDIT-2026-10-14.md` | 13430 | 0 | 1 | 0 | 0 | 1 | 5 | 1 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/AUDIT-2026-10-21.md` | 9574 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/AUDIT-2026-10-23.md` | 16506 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/AUDIT-2026-10-24.md` | 25791 | 8 | 2 | 0 | 0 | 1 | 7 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/AUDIT-2026-10-28.md` | 17179 | 0 | 0 | 0 | 0 | 2 | 3 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/AUDIT-2026-11-04.md` | 24438 | 0 | 0 | 0 | 0 | 1 | 5 | 2 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/AUDIT-2026-11-11-P1.md` | 26909 | 7 | 2 | 0 | 0 | 0 | 9 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/AUDIT-2026-11-11.md` | 20803 | 1 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/AUTONOMY-AUTHORIZATION-POLICY.md` | 18688 | 3 | 1 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | active | normative | a policy, the brief or a contract |
| `docs/AUTONOMY-POLICY.md` | 9506 | 28 | 3 | 1 | 0 | 10 | 23 | 1 | 0 | 0 | 0 | active | normative | a policy, the brief or a contract |
| `docs/BRIEF-v2.md` | 3980 | 0 | 0 | 0 | 0 | 45 | 8 | 0 | 0 | 0 | 0 | active | normative | a policy, the brief or a contract |
| `docs/BROWSER-QA.md` | 26893 | 7 | 1 | 0 | 0 | 3 | 13 | 0 | 2 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/CHANGE-DETECTOR.md` | 20420 | 4 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/CONTENT-FRESHNESS-POLICY.md` | 5702 | 1 | 1 | 1 | 0 | 0 | 7 | 0 | 0 | 0 | 0 | active | normative | a policy, the brief or a contract |
| `docs/CONTINUOUS-IMPROVEMENT.md` | 28453 | 4 | 3 | 1 | 0 | 0 | 6 | 1 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/CONTROL-ROOM.md` | 39083 | 13 | 1 | 0 | 0 | 1 | 18 | 0 | 0 | 1 | 1 | not determined | reference? | no rule of this script classifies it |
| `docs/CURRENT-ARCHITECTURE.md` | 53273 | 43 | 8 | 1 | 7 | 11 | 37 | 4 | 0 | 3 | 3 | active | canonical | §12 is the home of the baseline, parsed by code |
| `docs/DATA-DEPTH.md` | 22205 | 4 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/DATA-GOVERNANCE.md` | 11257 | 11 | 2 | 0 | 0 | 8 | 15 | 0 | 0 | 0 | 0 | active | normative | a policy, the brief or a contract |
| `docs/DATA-READINESS.md` | 64662 | 8 | 1 | 0 | 0 | 3 | 6 | 1 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/DEPLOYMENT.md` | 33351 | 15 | 1 | 3 | 2 | 10 | 22 | 2 | 0 | 0 | 1 | not determined | reference? | no rule of this script classifies it |
| `docs/DISCOVERABILITY-STRATEGY.md` | 11799 | 0 | 0 | 0 | 0 | 1 | 4 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/DOCS-SIMPLIFICATION-PLAN.md` | 11229 | 0 | 0 | 0 | 0 | 1 | 3 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/EDITORIAL-AGENT.md` | 24679 | 2 | 0 | 0 | 1 | 0 | 7 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/EDITORIAL-AUDIT-PATH.md` | 4226 | 1 | 0 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/EVIDENCE-MODEL.md` | 10493 | 1 | 1 | 0 | 0 | 4 | 9 | 1 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/F-18-READING.md` | 12660 | 0 | 0 | 0 | 0 | 2 | 2 | 2 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/FIRST-END-TO-END-AUDIT.md` | 35609 | 9 | 1 | 0 | 0 | 0 | 8 | 0 | 1 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/FRONTEND-REFERENCES.md` | 51711 | 3 | 0 | 0 | 0 | 4 | 10 | 3 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/GAP-PROPOSALS.md` | 17422 | 2 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/GOVERNANCE-PROPOSALS.md` | 25330 | 1 | 0 | 1 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/HANDOVER.md` | 84184 | 11 | 4 | 1 | 2 | 49 | 34 | 0 | 0 | 0 | 0 | active | canonical | the previous session's state |
| `docs/HEALTH-MONITOR.md` | 17794 | 6 | 0 | 0 | 0 | 1 | 7 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/HOMEPAGE-PRODUCTION-PLAN.md` | 32589 | 4 | 0 | 0 | 0 | 2 | 5 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/i18n-review/es.md` | 230918 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | active | generated | written by tools/i18n-review.mjs sheet |
| `docs/i18n-review/fr.md` | 236604 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | active | generated | written by tools/i18n-review.mjs sheet |
| `docs/i18n-review/it.md` | 1052 | 0 | 0 | 0 | 0 | 2 | 5 | 0 | 0 | 0 | 0 | active | generated | written by tools/i18n-review.mjs sheet |
| `docs/IMPLEMENTATION-QA.md` | 19877 | 9 | 1 | 0 | 0 | 0 | 12 | 0 | 0 | 0 | 1 | not determined | reference? | no rule of this script classifies it |
| `docs/KNOWLEDGE-ARCHITECTURE.md` | 14648 | 3 | 0 | 0 | 1 | 0 | 4 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/LEGAL-VERIFIER.md` | 22202 | 3 | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/LIMITED-AUTONOMY.md` | 17640 | 5 | 0 | 0 | 0 | 1 | 8 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/METHODOLOGY-NOTE-v2.md` | 6650 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/OBSERVABILITY.md` | 35185 | 1 | 0 | 0 | 1 | 0 | 7 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/ORCHESTRATOR.md` | 23411 | 5 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/PHASE-3-AUDIT.md` | 25129 | 1 | 0 | 0 | 0 | 10 | 8 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/PHASE-4-PLAN.md` | 15653 | 1 | 1 | 0 | 0 | 5 | 6 | 0 | 0 | 0 | 0 | closed | reference | Phase 4 concluded, §8 4 Nov 2026 |
| `docs/PHASE-4-SETUP.md` | 22816 | 0 | 0 | 0 | 0 | 6 | 9 | 0 | 0 | 0 | 0 | closed | reference | Phase 4 concluded, §8 4 Nov 2026 |
| `docs/PHASE-5-SETUP.md` | 73025 | 0 | 0 | 0 | 0 | 5 | 5 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/POST-V2.md` | 39127 | 4 | 1 | 0 | 0 | 11 | 10 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/PRODUCTION-OPERATING-MODE.md` | 23688 | 6 | 0 | 2 | 0 | 3 | 9 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/PROJECT-CONTEXT.md` | 7576 | 2 | 0 | 0 | 1 | 1 | 8 | 1 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/prompts/v2-docs-coherence.md` | 13540 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-f-18-dma-immediately.md` | 10419 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-hp-02-homepage-follow-up.md` | 10150 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-hp-03-homepage-production-plan.md` | 11854 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-hp-04-homepage-production.md` | 9653 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-pv2-01-data-readiness.md` | 15576 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-pv2-02-frontend-references.md` | 14670 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-pv2-03-prototype-editorial.md` | 18898 | 0 | 0 | 0 | 0 | 2 | 3 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-pv2-04-prototype-observatory.md` | 18424 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-pv2-05-prototype-hybrid-selection.md` | 19151 | 0 | 0 | 0 | 0 | 1 | 5 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-rules-maintenance-group-a.md` | 11249 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-rules-maintenance-group-b.md` | 10814 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-10.md` | 20169 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-11.md` | 18270 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-12.md` | 15131 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-13.md` | 14734 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-14.md` | 17105 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-15.md` | 20044 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-16.md` | 21886 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-17-5.md` | 25871 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-17.md` | 21838 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-18.md` | 16816 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-19.md` | 17453 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-20.md` | 13688 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-21.md` | 18922 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-22.md` | 16106 | 0 | 0 | 0 | 0 | 1 | 4 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-23.md` | 14735 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-24.md` | 18660 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-25.md` | 19054 | 0 | 0 | 0 | 0 | 8 | 5 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-27.md` | 15487 | 0 | 0 | 0 | 0 | 2 | 4 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-28.md` | 14483 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | not determined | record | no §8 scope row cites it: pending, unused or opened without one |
| `docs/prompts/v2-session-5.md` | 11403 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-6.md` | 26843 | 0 | 0 | 0 | 0 | 5 | 4 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-7.md` | 16238 | 0 | 0 | 0 | 0 | 1 | 3 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-8.md` | 19518 | 0 | 0 | 0 | 0 | 1 | 3 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-session-9.md` | 22414 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-stage-1-operational-closure.md` | 13383 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | not determined | record | no §8 scope row cites it: pending, unused or opened without one |
| `docs/prompts/v2-track-m-eidas2-milestone.md` | 8987 | 0 | 0 | 0 | 0 | 1 | 3 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-track-m-rules-round-2027-02.md` | 4656 | 0 | 0 | 0 | 0 | 5 | 3 | 0 | 0 | 0 | 0 | not determined | record | no §8 scope row cites it: pending, unused or opened without one |
| `docs/prompts/v2-trials-network-map-phone.md` | 8035 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-v2c-03-05-arrays.md` | 12408 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-v2c-12-v1-relationships.md` | 8339 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-v2c-13-map-checks.md` | 12176 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-v2c-17-19-map-nodes.md` | 8466 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-v2c-21-eidas2-actors.md` | 11981 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-v2c-21b-eidas2-provisions.md` | 14370 | 0 | 0 | 0 | 0 | 1 | 3 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-visible-coverage-reading.md` | 7986 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | not determined | record | no §8 scope row cites it: pending, unused or opened without one |
| `docs/prompts/v2-visible-coverage.md` | 7379 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/prompts/v2-visible-network-map.md` | 7344 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | opened | record | a §8 «The scope of …» row cites it; whether the session finished is not decided by this rule |
| `docs/PROTOTYPES.md` | 56885 | 5 | 0 | 0 | 0 | 7 | 8 | 2 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/REGULATORY-IMPACT-MAPPING.md` | 21557 | 2 | 0 | 0 | 0 | 0 | 9 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/ROADMAP-v2.md` | 771717 | 35 | 6 | 0 | 0 | 49 | 43 | 14 | 0 | 70 | 2 | active | canonical | §8 is the home of every decision |
| `docs/RULE-MAINTENANCE.md` | 27521 | 1 | 1 | 0 | 0 | 13 | 10 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/RULES-MAINTENANCE-A-READING.md` | 11800 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/RULES-MAINTENANCE-B-READING.md` | 16323 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/SECURITY-VERIFICATION-2026-09-08.md` | 24996 | 3 | 1 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/SEO-AUDIT-2026-09-27.md` | 9615 | 6 | 1 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/SEO-OPERATIONS.md` | 21383 | 2 | 1 | 1 | 0 | 3 | 12 | 1 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` | 21429 | 1 | 0 | 0 | 0 | 1 | 2 | 0 | 5 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/SESSION-ARCHITECTURE.md` | 13707 | 0 | 0 | 0 | 0 | 22 | 6 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/SKILL-MAP.md` | 11381 | 1 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/SOURCE-POLICY.md` | 11837 | 7 | 0 | 0 | 0 | 10 | 7 | 0 | 0 | 0 | 0 | active | normative | a policy, the brief or a contract |
| `docs/SOURCE-SCOUT.md` | 14837 | 5 | 0 | 1 | 0 | 0 | 18 | 8 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/TRACK-M-EIDAS2-READING.md` | 14868 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/UX-AUDIT.md` | 20383 | 7 | 0 | 0 | 0 | 1 | 8 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/V2-CLOSURE.md` | 48321 | 0 | 0 | 0 | 0 | 16 | 8 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/V2-DATA-DESIGN.md` | 47392 | 9 | 1 | 0 | 0 | 18 | 9 | 7 | 0 | 16 | 1 | not determined | reference? | no rule of this script classifies it |
| `docs/v2-design/session-10-before-after.md` | 59532 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/V2C-03-05-READING.md` | 9522 | 0 | 0 | 0 | 0 | 2 | 2 | 1 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/V2C-12-READING.md` | 34295 | 0 | 0 | 0 | 0 | 2 | 4 | 1 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/V2C-13-MAP-CHECKS.md` | 10721 | 1 | 0 | 0 | 0 | 2 | 4 | 0 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/V2C-17-19-READING.md` | 14985 | 0 | 0 | 0 | 0 | 2 | 2 | 2 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/V2C-21-READING.md` | 16190 | 0 | 0 | 0 | 0 | 2 | 5 | 1 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/V2C-21b-READING.md` | 18129 | 0 | 0 | 0 | 0 | 1 | 2 | 1 | 0 | 0 | 0 | closed | record | an audit, a reading or a measured run, dated |
| `docs/VERIFICATION-INTEGRATION.md` | 25467 | 3 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | not determined | reference? | no rule of this script classifies it |
| `docs/VERIFICATION-POLICY.md` | 9282 | 9 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | active | normative | a policy, the brief or a contract |
| `README.md` | 28627 | 4 | 5 | 1 | 1 | 4 | 15 | 0 | 0 | 0 | 4 | active | canonical | the author's account; «Known limitations» is red tier |

## B · The sentences code depends on

### B.1 · The governance anchors (`agent/proposals/governance/patterns.mjs`, 29 parsed)

A changed sentence makes `node agent/proposals/governance/cli.mjs check` report REFUTED and CI fail.

| Document | kind | exact text |
|---|---|---|
| `agent/policy/categories.mjs` | contains | «docs/ only» |
| `AGENTS.md` | contains | «Your base may be stale» |
| `AGENTS.md` | contains | «Never state a validator passed if it was not run» |
| `AGENTS.md` | contains | «caught the suite list growing» |
| `AGENTS.md` | contains | «caught the suite list growing» |
| `AGENTS.md` | contains | «MODULE_SURFACE» |
| `AGENTS.md` | contains | «re-fetch and diff against it again» |
| `AGENTS.md` | contains | «the rollback gate has never examined a record» |
| `AGENTS.md` | contains | «no URL here has ever been fetched» |
| `AGENTS.md` | contains | «__CONTENT__» |
| `docs/archive/HANDOVER-to-2026-11-13.md` | contains | «wrong reason» |
| `docs/archive/HANDOVER-to-2026-11-13.md` | contains | «at 225 files where SESSION» |
| `docs/archive/HANDOVER-to-2026-11-13.md` | contains | «Branch register — AUDIT-2026-09-25 T-40» |
| `docs/archive/HANDOVER-to-2026-11-13.md` | contains | «Deleted by the author, 26 September 2026» |
| `docs/archive/HANDOVER-to-2026-11-13.md` | contains | «0 merged · 0 reverted · 14» |
| `docs/AUDIT-2026-09-01.md` | contains | «F-08» |
| `docs/AUDIT-2026-09-01.md` | contains | «F-17» |
| `docs/AUDIT-2026-09-01.md` | contains | «F-13» |
| `docs/AUDIT-2026-09-01.md` | contains | «F-04» |
| `docs/AUDIT-2026-09-01.md` | contains | «F-05» |
| `docs/AUDIT-2026-09-03.md` | contains | «Correction, same day» |
| `docs/BROWSER-QA.md` | contains | «With scripting off, the site has no navigation» |
| `docs/BROWSER-QA.md` | contains | «The skip link is the tenth focusable element» |
| `docs/FIRST-END-TO-END-AUDIT.md` | contains | «H-1» |
| `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` | contains | «It did not decide a single proposal» |
| `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` | contains | «NOT PROPOSABLE HERE» |
| `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` | contains | «could not verify a single claim» |
| `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` | contains | «nobody has fixed» |
| `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` | contains | «meta.standfirst» |

### B.2 · Literals in code, tests and workflows that read a document and occur verbatim in it

Only files of B.3 (those that read the document) are searched. A literal that also occurs in the document may be a pin, a heading a parser looks for, or a coincidence: read the code before relying on any line.

| Document | read by | text |
|---|---|---|
| `AGENTS.md` | `.control-room/views.mjs` | «## Known hazards» |
| `docs/CONTROL-ROOM.md` | `.control-room/selftest.mjs` | «Last recorded run» |
| `docs/CURRENT-ARCHITECTURE.md` | `agent/detector/selftest.mjs` | «## 5. Dataset dependency map» |
| `docs/CURRENT-ARCHITECTURE.md` | `agent/implement/selftest.mjs` | «supports:direct» |
| `docs/CURRENT-ARCHITECTURE.md` | `agent/implement/selftest.mjs` | «nothing else» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «VERIFICATION DATES» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «applies.html has lost the notice that states how far its rules are verified» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «the wording is the author's (docs/ROADMAP-v2.md §8); change it only on their word» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «action:annulled» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «payment:paid» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «status:applicable» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «supports:direct» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «, supports: » |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «claim-type:critique» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «Applies since» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «Eu Digital Policy» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «the Council has yet to agree a mandate on the Commission's own GDPR reforms» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «kind:proposal» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «28 Oct 2026 (» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «the Regulation» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «T-01 applicability/ap-data-act-01: a bare source id» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «T-02 applicability/ap-data-act-01: no scope reference» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «It reads the rules behind applies.html (data/applicability.json) for their structure and evidence: references and locators, the provision behind each condition,» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «supports:partial» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «'s exemption, » |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «v2 Session 21, 21.2 F-03: `ap-cra-01`'s rationale» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «Recital 13 (software, including AI systems; AI system providers treated as manufacturers)» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «Art. 2(1); Art. 3 points (1), (13), (21) and (22)» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «Art. 2(1), (2) and (3); Art. 3(1) and (2); Annexes I and II» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «Annex I, point 8» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «Art. 2(2)(d); recital 19 (Directive (EU) 2016/680)» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «Art. 1 point (7) (Art. 5(1), first subparagraph, points (ba) and (bb), and Art. 5(1a) and (1b), as inserted)» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «Art. 1 point (5) (Art. 5a(1) of Regulation (EU) No 910/2014, as inserted)» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «Citation ('in particular Article 5a(23) thereof'); Art. 6 (entry into force)» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «Section 5 (Conclusions), page 14» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «third paragraph» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «checked to the standard» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «Read a result as a pointer to the law, not as a verified reading of it.» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «not applicable» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «scope:adjacent» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «status:partly-applicable» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «status:in-force» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «status:transposition-pending» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «status:transposition-overdue» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «status:proposal» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «scope:referenced» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «named as excluded, not dropped» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «status:political-agreement» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «payment:unknown» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «rel-kind:defers-to» |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs` | «rel-kind:amends» |
| `docs/ROADMAP-v2.md` | `tools/validate.mjs` | «$last_verified» |
| `docs/V2-DATA-DESIGN.md` | `tools/selftest.mjs` | «supports:direct» |
| `docs/V2-DATA-DESIGN.md` | `tools/selftest.mjs` | «scope:out-of-scope» |
| `docs/V2-DATA-DESIGN.md` | `tools/selftest.mjs` | «kind:proposal» |
| `docs/V2-DATA-DESIGN.md` | `tools/selftest.mjs` | «outcome:likely» |
| `docs/V2-DATA-DESIGN.md` | `tools/selftest.mjs` | «outcome:possible» |
| `docs/V2-DATA-DESIGN.md` | `tools/selftest.mjs` | «rel-kind:defers-to» |

### B.3 · Code, tests and workflows that name a document and read files

| Document | files |
|---|---|
| `AGENTS.md` | `.control-room/views.mjs` |
| `docs/CONTROL-ROOM.md` | `.control-room/selftest.mjs` |
| `docs/CURRENT-ARCHITECTURE.md` | `agent/detector/selftest.mjs`, `agent/implement/baseline.mjs`, `agent/implement/selftest.mjs` |
| `docs/DEPLOYMENT.md` | `agent/implement/boundary.mjs` |
| `docs/IMPLEMENTATION-QA.md` | `.control-room/selftest.mjs` |
| `docs/ROADMAP-v2.md` | `tools/selftest.mjs`, `tools/validate.mjs` |
| `docs/V2-DATA-DESIGN.md` | `tools/selftest.mjs` |
| `README.md` | `.control-room/boundary.mjs`, `agent/improve/selftest.mjs`, `agent/simulation/selftest.mjs`, `agent/ux/surface.mjs` |

## C · Status lines as each document states them

The first `**Status` or `**Stato` line in the first twelve lines, truncated; documents without one are not listed.

| Document | status line |
|---|---|
| `docs/AGENT-ROLES.md` | **Status:** binding. Defines ten roles, what each owns, what each may never do, |
| `docs/AGENT-RUNBOOK.md` | **Status:** rewritten in the SESSION 06 follow-up (2 September 2026) to describe the system |
| `docs/AI-SAFE-BOUNDARIES.md` | **Status:** written in SESSION 00. Governs any AI agent working in this repository. |
| `docs/ATTESTATION-FORM.md` | **Status: A DESIGN, DOCS ONLY; IT IMPLEMENTS NOTHING.** Item 22.1 of v2 Session 22 (4 Nov 2026), on |
| `docs/AUDIT-2026-10-24.md` | **Status:** recorded on 25 Oct 2026, v2 Session 1. **The audit is the author's document, not this |
| `docs/AUTONOMY-AUTHORIZATION-POLICY.md` | **Status:** binding, and **executable**. `agent/policy/` is the policy; this document |
| `docs/AUTONOMY-POLICY.md` | **Status:** binding. Defines the four autonomy classes, what is prohibited |
| `docs/BROWSER-QA.md` | **Status:** operational. Runs locally and in GitHub Actions. |
| `docs/CHANGE-DETECTOR.md` | **Status:** reference. Agent 3 — what it detects, how it classifies, and what it |
| `docs/CONTENT-FRESHNESS-POLICY.md` | **Status:** binding. It sets out when the site's content is to be called *stale*, and what |
| `docs/CONTINUOUS-IMPROVEMENT.md` | **Status:** binding. `agent/improve/` is the mechanism; this document describes it and reports |
| `docs/CONTROL-ROOM.md` | **Status:** binding. The reference document for `.control-room/` — the private control plane |
| `docs/CURRENT-ARCHITECTURE.md` | **Status:** written in SESSION 00 (reconnaissance). Describes commit `7248290` on `main`. |
| `docs/DATA-GOVERNANCE.md` | **Status:** binding. Derived from the code and data in this repository as it |
| `docs/DATA-READINESS.md` | **Status:** approved (§8, 9 Nov 2026: A.2, then the final checkpoint). **Extended the same day** (§8, "PV2-01,… |
| `docs/DOCS-SIMPLIFICATION-PLAN.md` | **Status: THE FOUR DECISIONS BELOW ARE THE AUTHOR'S** (`docs/ROADMAP-v2.md` §8, the four rows of 25 Nov 2026 «… |
| `docs/EDITORIAL-AGENT.md` | **Status:** built in SESSIONS 14 and 15, on top of Agent 3 (`docs/CHANGE-DETECTOR.md`) and the |
| `docs/EDITORIAL-AUDIT-PATH.md` | **Status:** v2 Session 3, 27 Oct 2026. Roadmap v2 item 1.1; `docs/AUDIT-2026-10-24.md` finding A. |
| `docs/FIRST-END-TO-END-AUDIT.md` | **Status:** the observation record for the first complete cycle this system has |
| `docs/FRONTEND-REFERENCES.md` | **Status:** B.1 **approved** (§8, "Checkpoint B.1 of PV2-02 approved", 10 Nov 2026): the scoring grid; the six… |
| `docs/HEALTH-MONITOR.md` | **Status:** operational. 44 metrics across three domains, measured separately and never summed. |
| `docs/IMPLEMENTATION-QA.md` | **Status:** operational, and it has implemented nothing. That is the correct result and §5 |
| `docs/LIMITED-AUTONOMY.md` | **Status:** binding. `agent/policy/governance.mjs` and `agent/autonomy/` are the mechanism; |
| `docs/METHODOLOGY-NOTE-v2.md` | **Status: final text, for the author's editorial review.** Written in v2 Session 2, 27 Oct 2026. It is |
| `docs/ORCHESTRATOR.md` | **Status:** the reference document for `agent/orchestrator/`. SESSION 22. |
| `docs/PHASE-3-AUDIT.md` | **Status: MEASURED; DECIDED BY THE AUTHOR ON 3 NOV 2026 (§8, v2 Session 17.5).** Written in v2 Session 17.5, 3… |
| `docs/PHASE-4-PLAN.md` | **Status: APPROVED BY THE AUTHOR ON 4 NOV 2026** (§8, «The plan to conclude Phase 4»), **AND PHASE 4 WAS CONCL… |
| `docs/PHASE-4-SETUP.md` | **Status: A DESIGN DOCUMENT; IT IMPLEMENTS NOTHING. DECIDED BY THE AUTHOR ON 3 NOV 2026 (§8, v2 Session 17.5).… |
| `docs/PHASE-5-SETUP.md` | **Status: APPROVED BY THE AUTHOR ON 4 NOV 2026 (roadmap §8, v2 Session 25, 25.4 questions 1–7; the answers in … |
| `docs/POST-V2.md` | **Stato** (corretto il 26 novembre 2026, sessione di documentazione D1, da `docs/ROADMAP-v2.md` §8): **lo Stad… |
| `docs/REGULATORY-IMPACT-MAPPING.md` | **Status:** built in SESSION 10, on top of Agent 3 (`docs/CHANGE-DETECTOR.md`). |
| `docs/ROADMAP-v2.md` | **Status: APPROVED by the author on 25 Oct 2026 (§8)**, with item 2.0 brought forward to v2 Session 2. Written… |
| `docs/RULE-MAINTENANCE.md` | **Status: A DESCRIPTION OF WHAT A PERSON DOES; IT IMPLEMENTS NOTHING.** Item 4.1 of Phase 4, written in v2 Ses… |
| `docs/SESSION-ARCHITECTURE.md` | **Status: DECIDED BY THE AUTHOR ON 5 NOV 2026** (`docs/ROADMAP-v2.md` §8, v2 Session 25, 25.5, the scope row a… |
| `docs/SKILL-MAP.md` | **Status:** written in SESSION 03. Describes `.agents/skills/` as at this commit. |
| `docs/SOURCE-POLICY.md` | **Status:** binding. Governs what may be cited, what a citation is allowed to |
| `docs/V2-CLOSURE.md` | **Status: MEASURED, AND DECIDED BY THE AUTHOR ON 28 OCT 2026** (`docs/ROADMAP-v2.md` §8, "The closing |
| `docs/V2-DATA-DESIGN.md` | **Status: APPROVED (`docs/ROADMAP-v2.md` §8: D-3, D-6, D-7, D-8 and the trigger model, 25–27 Oct 2026), implem… |
| `docs/VERIFICATION-INTEGRATION.md` | **Status:** reference. The adapter between `VerificationRecord`s and the |
| `docs/VERIFICATION-POLICY.md` | **Status:** binding. Governs what counts as verification, what the validators |

<!-- totals: {"docs":138,"bytes":4789603,"anchors":29,"scopeRows":53} -->
