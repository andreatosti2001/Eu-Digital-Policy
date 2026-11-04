# PHASE 4 — the plan to conclude it: exit criteria that can fail, and the sessions

**Status: A PROPOSAL, PUT TO THE AUTHOR; IT DECIDES NOTHING UNTIL ROADMAP §8 SAYS SO.** Drafted on 4 Nov 2026, after v2
Session 21 was merged (#60), on `claude/v2-phase-4-plan`, at the author's request ("I want you to conceive the sessions
needed to conclude phase 4 efficiently and effectively"). The author's four answers to the questions put with the
proposal are in §6; the approval is the §8 row that cites this file. **"Roadmap §8" means that approval record
throughout.** It adds no field, check or command by itself: it plans the sessions that may.

**Why it exists.** The roadmap gives Phase 4 an entry condition (E-1…E-6, approved 3 Nov 2026) and a first item (4.1,
written in Session 20 and first used in Session 21), and nothing that says when the phase is over. `docs/PHASE-4-SETUP.md`
§7 says it does not establish what comes after 4.1, and the roadmap does not plan a phase before it is reached
(`docs/ROADMAP-v2.md` §6). A phase with no exit does not end; it drifts. This file proposes an exit that can fail, on
the model of Phase 3's entry condition, and the fewest sessions that reach it.

---

## 1 · The exit criteria

Phase 4 is concluded when each of these holds, each with what verifies it. **The decision that it is concluded is the
author's** (§8 row).

| # | Criterion | Verified by | Fails today? |
|---|---|---|---|
| X-1 | **Every one of the thirteen processes of `docs/PHASE-4-SETUP.md` §1 has a recorded disposition**: a *machine check* exists and is named; a structured *human attestation* exists; it stays manual, with the reason; or it is left out of Phase 4, with the reason. | a table in `docs/`, one row per process, approved in §8 | **yes** — §2.2 assigns levels, not dispositions |
| X-2 | **The structured human-attestation form for P-08 and P-11 exists, with its offline checks, and has been used on real closures** — readings of the law that were made, not rehearsals. | the field in `data/applicability.json`; the checks; `tools/selftest.mjs`; the closures themselves, each with its §8 row | **yes** — the form does not exist |
| X-3 | **What Phase 4 leaves is unchanged** (`docs/PHASE-4-SETUP.md` §3): the production dispatcher, the decision ledger, readiness, the adversarial gate, `ALLOWED_RUNTIME_ORIGINS`. | `git diff <phase-4-start>..HEAD --stat -- agent/orchestrator agent/implement/decisions agent/production agent/policy/verify tools/thirdparty.mjs` shows nothing, or only what a §8 row approved | no |
| X-4 | **D-5 (the CMS and its login) is decided, or deferred past Phase 4 with its reason.** | a §8 row | **yes** — deferred in 17.5 until Phase 4 "needs" it; not yet re-asked |
| X-5 | **The baseline is green on a full-history clone**: the validators, `evidence-audit`, `selftest`, the 25 suites, the browser suite, the adversarial gate. | the commands of `AGENTS.md` "Validators"; `git rev-parse --is-shallow-repository` → `false` first | no (measured 4 Nov 2026) |

X-2's last clause is the reason for the order in §3. A form built after the last rule was closed has no real use before
the phase ends: the next readings fall on 3 Feb 2027 (the eight rules read on 4 Nov 2026) and 26 Mar 2027 (T-12 on
`ap-cra-01`), both after any reasonable end of Phase 4. A rehearsal would attest a reading that did not happen, which is
the thing the form exists to prevent.

## 2 · What stays out of Phase 4

Each is a reason, not a deferral by default; the author may reopen any (§8).

| Out | Why |
|---|---|
| **A tool that makes a network request (P-09, the SPARQL step)** | v2 Session 21, premise 3: the query is text a person copies and runs; "no tool runs it" (§8, 4 Nov 2026). `docs/AUDIT-2026-09-01.md` F-12: no tool in this repository makes a network request. Automating P-09 would end that. |
| **The CMS and its login (D-5) as a build** | Only the decision (X-4). A CMS loaded from a CDN adds a runtime origin (`ALLOWED_RUNTIME_ORIGINS`), which is Class D (`docs/PHASE-4-SETUP.md` §4). |
| **P-01, P-03, P-05, P-06, P-12, P-13** | Their *machine check* column is built (`docs/PHASE-4-SETUP.md` §2.2). They need a disposition line (X-1), not work. |
| **The production dispatcher, the decision ledger, readiness, the adversarial gate** | `docs/PHASE-4-SETUP.md` §3: "leaves it" / "does not touch it". Activation is a governance decision. |
| **Renewing the autonomy grant** | It expires 9 Mar 2027 (`docs/LIMITED-AUTONOMY.md`). A Class D decision; the plan flags it and does not renew it. |
| **Backfilling the 33 existing `verification_note`s into the new form** | They are prose that attest a reading already made; transcribing them into a structured field would be authoring an attestation about a reading no one in the new session made. The form is prospective (§3, S22). |
| **Phase 5's scope** | Written only after Phase 4 closes, against what it measured (`docs/ROADMAP-v2.md` §4). |

## 3 · The sessions

Four, with a buffer. **Attestation first** (§6, question 1). Every session ends with the next one's prompt (§8, 4 Nov
2026, the standing rule), so S22's prompt is already the one this plan revises (`docs/prompts/v2-session-22.md`).

| Session | Scope | Output | Checkpoints |
|---|---|---|---|
| **S22 · The form** | **22.1 Design, docs only:** the shape of the attestation; where it sits on a rule; how it is coupled to `last_verified` and `verification_note` without a second home for any fact; the offline checks and what they cannot see; a paper test against the eight real closures of Session 21 (their notes, read as if they had been written in the form). **22.2 Implement (Class C):** field, validation, checks, `tools/selftest.mjs`, every consumer of `verification_note` found first; prospective only. **22.3 The X-1 table**, docs. **22.4 The optional items**, each with its own question (§4): the reading packet; the roadmap §8 well-formed check (P-10); the notice check (P-07). **22.5 S23's prompt.** | `docs/ATTESTATION-FORM.md`; the form and its checks; the X-1 table; the optional tools if chosen | after 22.1; after 22.2; final |
| **S23 · First reading batch** | The **20** rules of GDPR (4, with `ap-cross-01`), DSA (4), DMA (3), AI Act (5), Data Act (4), each closed in the new form, with those instruments' Article headings compared to the Official Journal (the Session 18 finding, assigned in Session 21). | 20 closures — the first real uses of the form; 50 headings checked | per batch of instruments |
| **S24 · Second batch and exit** | The **5** rules of NIS2, DORA, PLD, eIDAS2 (`ap-nis2-03`, `ap-dora-01`, `ap-dora-02`, `ap-pld-01`, `ap-eidas2-01`); the 23 headings of those instruments and the 25 of instruments with no rule (50 + 23 + 25 = the 98 of Session 21's measurement); **the exit audit against X-1…X-5; the D-5 question (X-4)**; the calendar hand-over (§4 below). | Phase 4 concluded on the author's word, or the named residue | one, final |
| **S25 · Buffer, only if needed** | Whatever S23 or S24 could not close, named, **before 28 Jan 2027**. | | |

**Stop rules.** (1) In S22, the optional items go first, then the X-1 table moves to S23's opening; the form itself
(22.1–22.2) never moves. (2) In S23 and S24, a rule whose cited texts were not all read is not closed (§8, 4 Nov 2026,
premise 1); the 25 headings of instruments with no rule move before any rule does. (3) Whatever is not closed goes,
named, into the next prompt.

**If S22 is judged too large**, the cut is between 22.2 and 22.3: S22 = the form (22.1, 22.2, S23's prompt); the X-1
table and the optional items open S23. This adds no session, since S23 and S24 carry the reading, but S24's exit
audit then depends on S23 finishing its batch; S25 absorbs a slip.

## 4 · The calendar the plan answers to

| Date | What | Where in the plan |
|---|---|---|
| **28 Jan 2027** | 25 rules lapse together (`freshness --as-of 2027-01-28` → 25; measured 4 Nov 2026) | closed in S23–S24; S25 is the buffer |
| **3 Feb 2027** | the 8 rules read on 4 Nov 2026 lapse (`--as-of 2027-02-03` → 33) | after Phase 4: maintenance, under the written process and the form |
| **9 Mar 2027** | the limited-autonomy grant expires | flagged in S24's hand-over; not renewed by the plan |
| **26 Mar 2027** | T-12 on `ap-cra-01` (the EHDS's application) | after Phase 4: maintenance, under the written process and the form |
| **2 Dec 2026 – 12 Jan 2027** | statuses of ai-act, pld, eidas2, data-act meet milestones (`STATUS_PREDATES_MILESTONE`, `--as-of 2027-03-26`) | not in this plan; the S24 hand-over names them |

## 5 · Risks

- **The form cannot show the law was read.** It can show completeness against the record — that the Articles named include
  every Article the rule cites — and consistency with `last_verified`. `docs/AUDIT-2026-09-01.md` F-12 stands:
  nothing here fetches anything. S22 must say so in the form's own document.
- **The locators are free text** (`"Art. 2(1) and (2); Art. 3 points (1), (13), (21) and (22)"`). A completeness check
  rests on parsing them. S22.1 measures how many of the 33 rules' locators a deterministic parser resolves *before*
  the check is promised; a check that cannot resolve some locators must say so, not skip them silently.
- **A new field is a second home for a fact** if it repeats one. The date of a reading is `last_verified`; the Articles
  a rule cites are in `sources[].locator` and `obligations`. The form may store only what is a declaration (what was
  read, what was asked, what was decided), and must couple the rest, not copy it (`AGENTS.md`, one home per fact).
- **Consumers.** `verification_note` and the rule's fields are read by `tools/_refsweep.mjs`, `agent/schemas`,
  `agent/integrate`, `agent/improve` and `tools/selftest.mjs`'s pins (Session 21 learned this when five tests pinned
  29 Oct 2026). S22.2 finds every consumer before it changes anything, and runs `selftest` and the 25 suites after
  each change.
- **S23 is large** (20 rules and 50 headings; Session 21 closed 8 rules in one long session). The stop rule and S25
  are its answer; a slip costs a session, not the deadline, while the buffer holds.
- **S22 asks for design and implementation in one session.** The brief: «Non implementare nulla prima che la
  sessione precedente sia stata approvata». The checkpoint between 22.1 and 22.2 is the approval; Sessions 20 and 21
  worked that way.

## 6 · What the author decided about this plan (4 Nov 2026)

Put as four questions with the proposal; the answers, in the author's words:

1. **Order:** "Attestation first (Recommended)".
2. **Where the attestation lives:** "In data/ (Recommended)".
3. **Optional items in S22:** "Reading packet, §8 well-formed check (P-10), Notice check (P-07)" — all three.
4. **How the follow-up is recorded:** "Follow-up PR after #60 (Recommended)". This is that pull request.

The exit criteria (§1) and the out-list (§2) were put with the proposal and are approved only by the §8 row that cites
this file.

## 7 · What this document does not establish

- **That the exit criteria are the right ones.** They are a proposal; X-3 and X-5 are measurable today, X-1, X-2 and X-4
  are not yet satisfiable.
- **That 4 sessions suffice.** The count assumes S23 and S24 close what the Session 21 pace suggests; the buffer exists
  because that is an estimate.
- **The shape of the attestation.** Nothing here chooses a field name, a type or a check; S22.1 proposes them, one question
  at a time.
- **That the optional items are worth their cost.** The author chose them; S22 may find one unneeded and say so.
- **Anything about Phase 5.**
