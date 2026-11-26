# DOCUMENTATION ARCHITECTURE — how a document here is classified, and who decides it

**Lifecycle:** active · **Authority:** normative · **Home of:** the rules that classify the documentation · **Catalogue:** `docs/README.md`

**Status: PROPOSED IN DOCUMENTATION SESSION D2 (26 Nov 2026), FOR THE AUTHOR'S APPROVAL AT CHECKPOINT D2.1** (`docs/ROADMAP-v2.md`
§8, «The scope of the documentation session D2»; the prompt `docs/prompts/v2-docs-authority-catalogue.md`, D2.1). Until a §8 row approves
it, these rules are a proposal and nothing is classified by them. Written on `claude/friendly-brahmagupta-lxuqd7`, from `main` `f6834f5`.

**What this file is the home of:** the vocabulary every document in the perimeter is classified with — lifecycle, authority, kind, domain,
reading level — the criterion that assigns each value, who decides it, and the form of the header that states it. **What it is not the
home of:** any document's classification (that is the catalogue, `docs/README.md`); the state of the project (`main` and §8); the
programme's sessions (`docs/DOCS-SIMPLIFICATION-PLAN.md`); what code reads in a document (`docs/DOCS-DEPENDENCY-MAP.md`, a snapshot,
kept current by D3's check).

---

## 0 · The perimeter

Every `.md` file tracked under `docs/`, and the three at the root: `AGENTS.md`, `CLAUDE.md`, `README.md`. Other Markdown in the
repository (the skills under `.agents/skills/`, the agents' own `README.md` files, `prototypes/`, the Scout's digests) is outside it: those
files belong to the code beside them and are named by their directory. Non-Markdown files under `docs/` (`docs/v2-design/*.json`,
`docs/stage-1-proposal.jsonl`) are data, not documents, and are outside it too.

## 1 · Lifecycle — four values

A document's lifecycle says whether a session may rely on it **as a description of today**.

| Value | Criterion | Who decides |
|---|---|---|
| `active` | It describes something as it is now — a rule, a component, a plan whose work is open, a process — or it is a prompt for work not yet closed in §8. Whoever changes what it describes changes it in the same commit. | The session that writes it proposes it; the author approves it at that session's checkpoint. |
| `closed` | A record of a bounded piece of work that §8 records as finished (§3): what it says was true on its date and is not kept current. It changes afterwards only by a dated note that keeps the old words. | **Mechanical**, by the row that closes it: any session may apply it, citing that row's title. Where no row fits the rule, the value is `uncertain` (§6). |
| `superseded` | Its subject is now described by another document, which it names; it is kept because something cites it or because it records how the subject was understood. | The author, on a session's proposal that names the successor. |
| `historical` | Moved out of the working set, byte for byte, to keep the record: today `docs/archive/`. | The author (only D6 moves, and only closed records; `docs/DOCS-SIMPLIFICATION-PLAN.md` §1). |

**Not a lifecycle:** «snapshot». A document that describes the repository **at a named commit** and that nobody keeps current
(`docs/PROJECT-CONTEXT.md`, `7248290`; `docs/DOCS-DEPENDENCY-MAP.md`, `5232941`) carries the commit in its header (§5) and may still be
`active`: its principles or its method hold, its figures do not.

## 2 · Authority — three values

A document's authority says **what happens when it disagrees with something else**.

| Value | Criterion | When it disagrees with another home | Who decides |
|---|---|---|---|
| `normative` | It states a rule a session or an agent must follow, and the rule has no other home. | It governs; the other text is the defect. Where code implements the rule and the document says the code governs (`docs/LIMITED-AUTONOMY.md`, `docs/CONTINUOUS-IMPROVEMENT.md`), that sentence is part of the rule. | **The author only, by a §8 row**, both to make a document normative and to take that away. The governance texts of `docs/DOCS-SIMPLIFICATION-PLAN.md` §0 point 3 change only on the author's words recorded in §8 first. |
| `canonical` | It is the one home of a fact or a state that is not a rule: the decisions (§8), the previous session's state (`docs/HANDOVER.md`), the validator baseline (`docs/CURRENT-ARCHITECTURE.md` §12), the author's account (`README.md`), the order of the work, this catalogue. **A record is canonical for what it records, on its date, and for nothing after it.** | It governs for that fact; a second copy elsewhere is the defect (`docs/DATA-GOVERNANCE.md` §1.1). | The session that writes it proposes; the author approves at its checkpoint. |
| `reference` | It describes something whose truth lives elsewhere — code, data, §8 — so that a reader can find and understand it. | **The other home governs**, and the disagreement is a defect in this document. | The session that writes it proposes; the author approves at its checkpoint. |

A document has **one** authority. Where parts of it differ — a reference document with one normative section — the catalogue names the
section in its «home» column, and the document's authority is its main one.

## 3 · Kind — what a document is, and which kinds are records

| Kind | What it is | Record or specification |
|---|---|---|
| `entry` | An agent's entry point: `AGENTS.md`, `CLAUDE.md` | specification |
| `policy` | A binding rule set: boundaries, autonomy, data governance, sources, verification, freshness, contracts, roles, the brief | specification |
| `spec` | What a component, an agent or a process is and does today; `docs/CURRENT-ARCHITECTURE.md` among them | specification |
| `plan` | The work ahead and its order: the roadmap, the session architecture, Post-v2, a phase's set-up, a programme | specification while its work is open; a record once §8 concludes it |
| `design` | A design or a proposal approved, or awaiting approval, before it is built | as `plan` |
| `catalogue` | A list of documents: `docs/README.md`, `docs/DOCS-DEPENDENCY-MAP.md` | specification |
| `handover` | `docs/HANDOVER.md`: the previous sessions' entries | specification (its entries are records; D5 moves the closed ones) |
| `account` | `README.md`: the author's own account, with the «Known limitations» (red tier) | specification |
| `prompt` | A session's instructions, under `docs/prompts/` | **record** |
| `reading` | What a session read from which source on which day, with hashes where taken | **record** |
| `audit` | A dated audit or a dated measurement of the system against its documents | **record** |
| `run` | A dated run of the system: a simulation, a real-world run, a before/after listing | **record** |
| `archive` | Text moved byte for byte to `docs/archive/` | **record** |
| `generated` | Written by a command (§4) | neither: its source is the home |

**A record** is written for one bounded piece of work, carries its date and branch, and once that work is closed it is not edited except
by a dated note that keeps the old words (D1's practice, 26 Nov 2026). **A specification** says what something is now, and is changed by
whoever changes the thing, in the same commit. A plan or a design is a specification while its work is open and a record once §8
concludes it (the precedent: `docs/PHASE-4-SETUP.md` and `docs/PHASE-4-PLAN.md`, Phase 4 concluded on 4 Nov 2026).

**When a record is closed** (the rule for `closed` in §1):
- **a prompt**: §8 holds, after its scope row, a row of the same session titled as its checkpoint, final checkpoint or conclusion, or
  handing over the next session's prompt. A prompt with a scope row and no such row is `active`; a prompt with no scope row is `active`
  (not yet run). The catalogue cites the row.
- **a reading, an audit, a run**: the session that wrote it has its closing row in §8, by the same test.
- **a plan or a design**: §8 records its work concluded, or its last item approved and implemented.

## 4 · Generated files

A generated file has a command that rewrites it; it carries **no header** (the command would remove it) and the catalogue covers it.

| File | Command | Note |
|---|---|---|
| `docs/i18n-review/<code>.md` | `node tools/i18n-review.mjs sheet <code>` | the review sheet a speaker of the language ticks; an agent may generate it, never record it (`docs/AI-SAFE-BOUNDARIES.md` §3) |

`docs/v2-design/session-10-before-after.md` says «Generated on 28 Oct 2026» but no committed command rewrites it: it is a `run`, a record,
not a generated file. `docs/DOCS-DEPENDENCY-MAP.md` was produced by a script kept outside the repository: a snapshot, not a generated file.

## 5 · The standard header

One line, **directly under the document's title, followed by a blank line**, with fixed fields in a fixed order:

```
**Lifecycle:** <active|closed|superseded|historical> · **Authority:** <normative|canonical|reference> · **Home of:** <what> · **Catalogue:** `docs/README.md`
```

- `**Home of:** <what>` names what the document is the home of. A document that is not a home and only points to one writes
  `**Points to:** <path or §8 row>` instead.
- A snapshot adds `· **Snapshot of:** \`<commit>\`` after the home field.
- A `closed` or `superseded` document adds `· **Closed by:** <§8 row title>` or `· **Superseded by:** <path>`.
- A value that is not decided is written `uncertain`, never guessed (§6).

**It is added, never substituted.** No existing sentence is changed, moved or removed to make room for it: the governance anchors are
`contains` matches on exact sentences, and the code that reads a document's text looks for a heading or a fixed line that the header does
not touch (`docs/DOCS-DEPENDENCY-MAP.md` §0: `## 5. Dataset dependency map` and `**Baseline at commit` in
`docs/CURRENT-ARCHITECTURE.md`, `## Known hazards` in `AGENTS.md`, §5's table in `docs/CONTROL-ROOM.md`, §8's rows in
`docs/ROADMAP-v2.md`). Where a document already has a status line, the header sits above it and the status line stays as written.

**Who carries it:** every hand-written document under `docs/`. **Not:** the generated files (§4); the archive (moved byte for byte on 22 Nov
2026); `AGENTS.md`, `CLAUDE.md` and `README.md` (outside `docs/`; `AGENTS.md` is D4's, `README.md`'s limitations are red tier); the
prompts, **unless the author decides otherwise** (D2.3: they are pasted whole into a session as its instructions, so a header would become
part of every future instruction; the catalogue carries their lifecycle and their §8 rows). The catalogue covers all of these.

**What a tool can check** (D3, `tools/docs-check.mjs`): that every document that must carry the header carries exactly one, in this form;
that its lifecycle and authority equal the catalogue's row; that a `Closed by` title exists in §8 (and, by `tools/validate.mjs` A-6, only
once); that a `Superseded by` or `Points to` path resolves.

## 6 · Uncertain

A value no criterion above settles is written **`uncertain`**, with the reason, in the catalogue; it is not assigned for convenience and not
defaulted to `reference`. An uncertain value is decided one at a time — by the author where the answer is a judgment, by a later session
where it is a measurement — and the decision is cited in the catalogue's row.

## 7 · Domains and reading levels

**Domains** — what a task touches, so that a session reads the documents of its task and not the whole of `docs/`:

| Domain | A task here touches |
|---|---|
| `evidence` | `data/`, claims, sources, evidence grades, freshness, the map and the registers |
| `i18n` | `i18n/`, the editions, the review sheets and the review ledger |
| `publishing` | SEO, the pages' generation, deployment and the deploy gate, the CSP |
| `decisions` | §8, the plan and the order of sessions, the release chain, the decision ledger and attestation |
| `agents` | `agent/`: the eleven agents, the Orchestrator, autonomy, observability |
| `control-room` | `.control-room/` |
| `frontend` | `index.html` and the pages, `js/`, `css/`, the prototypes, the browser and UX checks |
| `rules` | `data/applicability.json`, rule maintenance, Track M |
| `docs` | the documentation itself: this file, the catalogue, the map, the programme |

A document has **one** domain, the one whose task most needs it; the catalogue's reading lists (§2 there) may name it under others.

**Reading levels** (the author's decision, §8, 26 Nov 2026, «D1, D.3 question 2»; implemented in the skill `project-context` by D4):

| Level | What | Where it is named |
|---|---|---|
| **always** | `docs/AI-SAFE-BOUNDARIES.md` §0 and §3; the header of `docs/HANDOVER.md`; the rules of `AGENTS.md` | §8, «D1, D.3 question 2» |
| **by domain** | the documents the catalogue lists for the task's domain | `docs/README.md` §2 |
| **on request** | records (prompts, readings, audits, runs), the archive, generated sheets, snapshots | read when a task, a prompt or a §8 row cites them |

## 8 · What this document does not establish

That any document's classification is right: the catalogue proposes each one, and the author decides. That a document is true: D1 measured
statements against `main` and §8, and a `reference` document disagreeing with its home is a defect to correct, not a classification. Any
change to a rule, a policy, the brief or `AGENTS.md`.
