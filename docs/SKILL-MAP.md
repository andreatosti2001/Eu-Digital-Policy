# SKILL MAP

**Status:** written in SESSION 03. Describes `.agents/skills/` as at this commit.
**Read with:** `AGENTS.md` (the contract), `docs/AI-SAFE-BOUNDARIES.md` (the tiers),
`docs/OBSERVABILITY.md` (the instrumentation layer).

Sixteen skills live in `.agents/skills/`, one directory each, every one a `SKILL.md` with
`name` and `description` front matter and plain Markdown below. Nothing in the format is
specific to one assistant: Claude Code discovers them by path, and any agent reachable through
`AGENTS.md` is told where they are and reads them as files. References sit in
`references/`, executables in `scripts/`, and only three skills have either.

---

## 1. The library

| Skill | Owns | Files beyond `SKILL.md` |
|---|---|---|
| `project-context` | Loading the mandatory context at session start; the reading order | — |
| `autonomy-governance` | May an agent act, propose, or must it stop; escalation and approval | `references/escalation-record.md` |
| `repository-audit` | What is *actually* implemented, as against what is documented | — |
| `eu-legal-research` | Retrieving the document — which register is authoritative for which fact | `references/source-registers.md` |
| `legal-source-verification` | Whether a retrieved source establishes the proposition; the verdict and the note | `references/verification-protocol.md` |
| `source-provenance` | The source record, the tier, the `supports` qualifier, the provenance event | `references/source-record.md` |
| `data-governance` | Whether a value in `data/` may change, and what must accompany it | — |
| `knowledge-architecture` | Where a fact lives; store vs derive; the taxonomy as enum authority | — |
| `data-completeness` | Measuring what the corpus does not establish | `scripts/gaps.mjs` |
| `regulatory-change-detection` | Noticing that a record may have decayed; producing candidates | `references/decay-surfaces.md` |
| `legal-editorial` | The prose: register, hedging, asterisks, the three homes of an English string | `references/house-register.md` |
| `frontend-implementation` | Building views inside the architecture's invariants | — |
| `ux-audit` | The judgment the validators cannot make | `references/manual-checks.md` |
| `legal-site-qa` | Running the checks and reporting them honestly | `scripts/baseline.mjs` |
| `observability` | Instrumenting an agent through `tracer.mjs` | — |
| `git-workflow` | Branch, diff, commit and push discipline | — |

## 2. The seam between adjacent skills

The library is deliberately narrow: several skills cover one workflow between them, and the
seam is where an agent would otherwise do two jobs badly.

**The evidence pipeline** — the four steps are separate acts on purpose, because collapsing
any two is how an unverified value enters the corpus.

```
regulatory-change-detection → eu-legal-research → legal-source-verification → source-provenance → data-governance
   a record may have moved     get the document     does it establish it?      record where it     may the value
   (produces candidates)       (produces a quote     (produces a verdict)       came from            change, and
                               and a locator)                                                       what goes with it
```

**Content vs structure.** `data-governance` governs *values*; `knowledge-architecture`
governs *shape*. "Is this fine amount right?" is the first. "Should fine amounts live here at
all?" is the second.

**Measuring vs closing.** `data-completeness` counts gaps and never closes one;
`legal-source-verification` closes them one at a time and never reports a total.

**Checks vs judgment.** `legal-site-qa` runs the validators and reports numbers; `ux-audit`
makes the judgments no validator can make; `repository-audit` establishes whether the
repository matches its own documentation.

**Doing vs recording vs permission.** `frontend-implementation` and the data skills do the
work; `observability` records that it happened; `autonomy-governance` decides whether it may;
`git-workflow` gets it committed.

## 3. Which agent uses which

The agent roles are the ones the observability demonstrator already models
(`agent/observability/demo/workflow.mjs`) plus the roles the repository's own work implies.
**Five of these agents now exist** — Source Scout (`agent/scout/`), Legal Verifier
(`agent/verifier/`), the verification integrator (`agent/integrate/`), Regulatory Change
Detector (`agent/detector/`) and Data Depth (`agent/depth/`), built in SESSIONS 06 to 11. The
rest of the table is still the intended allocation rather than a description of running code.
*This paragraph said "none of these agents exists yet" until SESSION 11; it had been stale
since SESSION 06.*

| Agent | Always | Per task | Never |
|---|---|---|---|
| **Orchestrator** | `project-context`, `autonomy-governance`, `observability` | `repository-audit`, `data-completeness` | any write to `data/` |
| **Scout** (read-only) | `project-context`, `observability` | `regulatory-change-detection`, `eu-legal-research` | `data-governance` — a scout proposes, never edits |
| **Verifier** | `project-context`, `observability` | `legal-source-verification`, `eu-legal-research`, `source-provenance` | `legal-editorial` — it does not rewrite the prose it checks |
| **Change detector** | `project-context`, `observability` | `regulatory-change-detection`, `data-completeness` | closing any gap it finds |
| **Data depth** (read-only) | `project-context`, `observability` | `data-completeness`, `knowledge-architecture`, `data-governance` | closing a gap, or writing to `data/` at all — it asks where a fact would live and never puts one there |
| **Data editor** (human-approved) | `project-context`, `autonomy-governance`, `git-workflow` | `data-governance`, `source-provenance`, `knowledge-architecture`, `legal-site-qa` | authoring a fact from model knowledge |
| **Editor** (prose) | `project-context`, `autonomy-governance`, `git-workflow` | `legal-editorial`, `legal-site-qa` | changing a claim record to fit a sentence |
| **Frontend** | `project-context`, `git-workflow` | `frontend-implementation`, `legal-site-qa`, `ux-audit` | touching `data/` or the derivation rules |
| **Auditor** | `project-context` | `repository-audit`, `data-completeness`, `ux-audit`, `legal-site-qa` | fixing anything it finds |
| **Any session** | `project-context` first; `git-workflow` before committing; `legal-site-qa` before and after | — | — |

Read across the rows: **every agent loads `project-context`**, every agent that writes
anything loads `git-workflow` and `legal-site-qa`, and every agent that could change what the
site asserts loads `autonomy-governance`. The "never" column is the useful one — it is where
a role's boundary is enforced by what it is not allowed to load.

## 4. What the library deliberately does not duplicate

*One home per fact* applies to the instructions as much as to the data.

- **The absolute prohibitions** live in `docs/AI-SAFE-BOUNDARIES.md` §0. Skills carry a
  one-line pointer, not a copy — **with one deliberate exception**: `data-governance`
  restates them, because it is invoked at the moment of highest risk and a pointer there
  costs a file read at exactly the wrong time. The exception is recorded in that skill and
  here, so the principle stays legible.
- **The green/amber/red tiers** live in `docs/AI-SAFE-BOUNDARIES.md` §1–§3.
  `autonomy-governance` teaches how to apply them; it does not restate the tables.
- **The architecture** lives in `docs/CURRENT-ARCHITECTURE.md`. `frontend-implementation`
  states the invariants an implementer must hold in their head and points at the document for
  the rest.
- **The recorded validator baseline** lives in `docs/CURRENT-ARCHITECTURE.md` §12. No skill
  and no script in this library hardcodes it — `scripts/baseline.mjs` compares against a
  snapshot the session takes, and asserts nothing of its own.
- **The evidence grading rule** lives in `js/format.js`. `scripts/gaps.mjs` imports
  `evidenceGrade` from it rather than reimplementing it, so the census cannot disagree with
  the page.
- **The taxonomy** is the enum authority. No skill restates the tier or `supports`
  definitions; they are read from `data/taxonomy.json`.
- **The session's branch name** is a session fact. It lives in the session brief and
  `docs/HANDOVER.md`, not in `git-workflow`.

## 5. How a skill is written here

Every `SKILL.md` in this library has the same skeleton, so an agent can predict where the
answer is:

```
front matter: name, description   ← the description says WHEN to use it, not just what it is
Boundaries:  one-line pointer to docs/AI-SAFE-BOUNDARIES.md §0
Purpose      one paragraph
When to invoke
Scope boundary   ← what this skill does NOT cover, and which sibling owns it
Procedure / the rules
Done when        ← the testable criteria
Refusal conditions
```

**Done when** and **Refusal conditions** are what make a skill testable rather than
advisory: each states an observable outcome — a validator result, a file that exists, a
number that moved — or an action that must not have happened.

## 6. Testing the library

The two scripts run standalone, zero-dependency, from the repository root:

```
node .agents/skills/data-completeness/scripts/gaps.mjs [--json]
node .agents/skills/legal-site-qa/scripts/baseline.mjs [--save|--check] [--json]
```

Everything else is prose, and prose is tested by use: a skill is working when the session that
followed it can show the **Done when** criteria met, and failing when an agent had to go
outside it to finish the job. A skill that had to be contradicted is a finding for the next
session, not a rule to bend quietly.
