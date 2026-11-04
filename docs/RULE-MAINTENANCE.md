# RULE MAINTENANCE — the manual process, written down before anything in it is automated

**Status: A DESCRIPTION OF WHAT A PERSON DOES; IT IMPLEMENTS NOTHING.** Item 4.1 of Phase 4, written in v2 Session 20
(3 Nov 2026) on `claude/v2-session-20-phase-4`, as the author decided (`docs/ROADMAP-v2.md` §8, v2 Session 20, questions 1,
3, 4 and 5; first item and exit: `docs/PHASE-4-SETUP.md` §6). **"Roadmap §8" means that approval record throughout; this
document's own sections are cited as "§0" to "§9" and "step 1" to "step 6" (§1 to §6, in order).** It adds no field, no check, no command and no form of
attestation, touches no rule, and is not read by any tool. The brief's rule is the reason it exists: «Prima di
automatizzare, rendi trasparente il processo manuale» (`docs/BRIEF-v2.md`).

**What it covers.** The processes P-08 → P-09 → P-10 → P-11 → P-12 → P-13 of `docs/PHASE-4-SETUP.md` §1, taken in the
order a person meets them when a maintenance prompt fires. **The levels** are that document's §2.2, approved as drafted
(roadmap §8, 17.5.0 question 6), under the names the author chose: *machine check* (what a validator can establish), *human
attestation* (a person declares what was done) and *human authorship* (what no machine writes). They are never given
letters, which would collide with the autonomy classes A–D of `docs/AUTONOMY-POLICY.md`.

**What it does not do.** It does not say what any rule should say, and it contains no legal fact of its own: every
example is what `data/applicability.json` and the other records already state, quoted as theirs. The reading of a
Regulation is a person's, and this document is not a substitute for it.

---

## 0 · The two prompts that start it

Both are **derived from the records with no network and no new field** (`docs/PHASE-3-AUDIT.md` §5; roadmap §8, v2 Session 17,
questions 8a and 8b). Each says *where to look*. Neither changes a rule, and neither can tell whether the law was read.

| Prompt | Where it is printed | When it fires on the records of 3 Nov 2026 | Meaning |
|---|---|---|---|
| `RULE_STALE applicability/<id>` | `node tools/freshness.mjs --as-of <date>`; in CI, a "Content stale" warning (`docs/CONTENT-FRESHNESS-POLICY.md`) | **all 33 rules on 28 Jan 2027**: each carries `last_verified` 2026-10-29, and the interval is 90 days (`RULE_INTERVAL`, `tools/freshness.mjs:118`); none on 27 Jan 2027. Measured 3 Nov 2026. | the rule was last read more than 90 days before the date asked |
| `LAW_CHANGED_SINCE_VERIFIED applicability/<id>` (T-12) | `node tools/evidence-audit.mjs --as-of <date>`, under WARNINGS (`tools/trigger-audit.mjs`) | **`ap-cra-01` on 26 Mar 2027**, and no other rule. Measured 3 Nov 2026. | an instrument whose provisions the rule cites was amended or repealed by a law-modality edge whose amending act has an entry-into-force or application event dated after the rule's `last_verified`, or has had a delegated act, implementing act, judicial event or guidance in that window |

Neither prompt changes an exit code (`freshness.mjs` exits 1 only on a defect in the tree; T-12 is a WARNING). A prompt is
closed by doing step 1 to step 4 below for the rule it names, and by nothing else — not by editing a check, an interval or
a date (`docs/CONTENT-FRESHNESS-POLICY.md`; `tools/selftest.mjs` F1–F6).

**Why 28 Jan 2027 is one day and not thirty-three.** The rules were read on one day (29 Oct 2026), so they lapse on one
day (`docs/PHASE-3-AUDIT.md` F-09). A rule re-read on a different day lapses on a different day from then on. **The rules are re-read in stages**, each when a
prompt or a finding names it, and the calendar is not realigned on one day (roadmap §8, v2 Session 21, premise 2).

---

## 1 · P-08 — read the rule against its Articles in the Official Journal text

| | |
|---|---|
| **Who** | A session working under the author's prompt; the author approves what is to be changed (roadmap §8), and approves the table of Articles read (`docs/PHASE-4-SETUP.md` §1, P-08). |
| **Trigger** | A prompt of §0 names a rule; or the author asks for the rule to be read. |
| **Action** | For each instrument the rule cites (`instrument`, `obligations`, `condition_provisions`, each `sources[].locator`): fetch the Official Journal text from the Publications Office's Cellar by CELEX — `https://publications.europa.eu/resource/celex/<CELEX>`, English, with `Accept: application/xhtml+xml` and `Accept-Language: eng` (without the second header Cellar answers HTTP 400: measured 4 Nov 2026, v2 Session 21), then the document the answer lists (the method recorded in `docs/HANDOVER.md`, Sessions 13–18; for the CRA, CELEX 32024R2847, as `ap-cra-01`'s note records). Read each Article the rule cites and each one it should now cite, against the rule's `conditions`, `outcome`, `rationale`, `obligations`, `exemptions`, `depends_on`, `dates` and `sources[].locator`. Read the rationale, the obligations and `depends_on` against the texts, not only against the citations: where a statement rests on an Article the rule does not cite, or an Article the texts make applicable is missing from the obligations, put it to the author (step 3) — A-4 compares what is cited with what is read and cannot see it (roadmap §8, v2 Session 24, 24.2: R-2; precedents: a `for: "rationale"` reference in v2 Session 23, a scope citation and an added obligation for `ap-nis2-03` in v2 Session 24). Write down which Articles were read and from which CELEX. **Cite only the document actually read** (`docs/AI-SAFE-BOUNDARIES.md` §0, 1–2). A corrigendum's CELEX is fetched with its parentheses percent-encoded, e.g. `32022L2555R%2804%29`; unencoded, Cellar answers 404 (measured 4 Nov 2026). |
| **Level** | *machine check*: the shape (T-01…T-05, `tools/trigger-audit.mjs`), the application dates the obligations derive (T-10), every reference and provision resolving (`tools/validate.mjs`). *human attestation*: "read on D in the Official Journal text retrieved by CELEX X" — today a `verification_note`, free text. From 5 Nov 2026 the same declaration is also `attestation.read` on the rule, which A-4 holds to every Article the rule cites (`docs/ATTESTATION-FORM.md`). *human authorship*: the rule's content. |
| **Trace** | `data/applicability.json`: the rule's `last_verified` and `verification_note`; the roadmap §8 rows; the commit. All git-tracked. |
| **What no check sees** | That the Articles were read at all. `tools/validate.mjs` and `tools/trigger-audit.mjs` check that a locator resolves and that the shape holds, not that the Article says what the rule says (`docs/AUDIT-2026-09-01.md` F-12: no URL in this repository has ever been fetched by any tool here). Whether the rule says what the Article says is the reading, which is the person's. |

**The form of a note, as the practice has left it.** `ap-cra-01`'s `verification_note` (29 Oct 2026) names the date, the
Session, the Official Journal text read and its CELEX, the Articles read, the amending act and the corrigenda checked,
what they touch, and what the author decided about them. A note shaped so is the model for *human attestation* today. It
is prose: nothing reads it.

## 2 · P-09 — ask the Publications Office's SPARQL endpoint for amending acts, corrigenda and language versions

| | |
|---|---|
| **Who** | The same session, from its own network. |
| **Trigger** | Part of P-08: the text read is the text as published, so what amends or corrects it has to be asked separately. |
| **Action** | Query the Publications Office's SPARQL endpoint (`https://publications.europa.eu/webapi/rdf/sparql`, as recorded in the prompts of `docs/prompts/v2-session-7.md` and `v2-session-8.md`) for each CELEX read: the acts that *amend* or *repeal* it, the *corrigenda* and which have an English expression, the dates of entry into force, and proposals to amend. Read what an amending act changes in the cited Articles before deciding it matters; the practice has been to read a corrigendum's English expression and to record which corrigenda have none. **A proposal is not law**: the practice has been to list one and not read it into a rule (`docs/HANDOVER.md`, the Session 16 report). |
| **Level** | *machine check*: none (a fetch is a network act, `docs/PHASE-4-SETUP.md` §3). *human attestation*: "queried on D; N amending acts; M corrigenda" — today in prose in the roadmap §8 row and the `verification_note`. *human authorship*: what an amendment or a corrigendum means for the rule. |
| **Trace** | The roadmap §8 row and the `verification_note`. The query text is kept below this table (roadmap §8, v2 Session 21, premise 3); **no answer is kept**: a later reader has the sentence, not the response. |
| **What no check sees** | **Everything.** No tool in this repository makes a network request, so nothing establishes that the query was run, what it returned, or that it was run at all (`docs/AUDIT-2026-09-01.md` F-12). Whether Cellar is reachable depends on the environment: it was in some sessions and not in others (`docs/HANDOVER.md`, Session 18). When it is not, or when any text the rule cites could not be read, **nothing in `data/` changes**: `last_verified` stays where it is and the published `verification_note` does not record the failure; the roadmap §8 row and the `docs/HANDOVER.md` report say what could not be read, and the prompt or finding stays open (roadmap §8, v2 Session 21, premise 1). Do not close the prompt on a reading that could not be made. |

**The query, as a text a person copies and runs** (roadmap §8, v2 Session 21, premise 3). No tool in this repository runs
it; it is not a command and not a check. Replace the CELEX, and send it to the endpoint above as the form field `query`
with `Accept: text/csv`. It asks only for the acts that amend, repeal or correct one CELEX; entry-into-force dates, the
language expressions of a corrigendum and proposals to amend are asked separately. **Last run 4 Nov 2026** (v2 Session
21), HTTP 200: for `32016R0679` it returned three corrigenda — `32016R0679R(01)` 2016-11-22, `32016R0679R(02)`
2018-05-23, `32016R0679R(03)` 2021-03-04 — and no amending or repealing act.

```sparql
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?rel ?celex ?date WHERE {
  ?w cdm:resource_legal_id_celex "32016R0679"^^<http://www.w3.org/2001/XMLSchema#string> .
  { ?a cdm:resource_legal_amends_resource_legal ?w . BIND("amends" AS ?rel) }
  UNION { ?a cdm:resource_legal_repeals_resource_legal ?w . BIND("repeals" AS ?rel) }
  UNION { ?a cdm:resource_legal_corrects_resource_legal ?w . BIND("corrects" AS ?rel) }
  ?a cdm:resource_legal_id_celex ?celex .
  OPTIONAL { ?a cdm:work_date_document ?date }
} ORDER BY ?rel ?celex
```

**Which corrigenda have an English expression** — the same kind of text, copied and run by a person, no tool runs it
(roadmap §8, v2 Session 21). One row per corrigendum of the CELEX, with the number of its English expressions (0 means
none). Last run 4 Nov 2026 on 32022L2555, 32024R2847, 32024R1689, 32016R0679, 32022R2065 and 32022R1925.

```sparql
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT ?celex (COUNT(?e) AS ?eng) WHERE {
  ?w cdm:resource_legal_id_celex "32022L2555"^^<http://www.w3.org/2001/XMLSchema#string> .
  ?a cdm:resource_legal_corrects_resource_legal ?w ; cdm:resource_legal_id_celex ?celex .
  OPTIONAL { ?e cdm:expression_belongs_to_work ?a ; cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> . }
} GROUP BY ?celex ORDER BY ?celex
```

**What the records already hold that T-12 uses.** The edges between instruments are in `data/instruments.json`
(`relationships`) and the events in `data/timeline.json`. T-12 reads those; it does **not** query Cellar. So a prompt
fires only for an amendment somebody has already recorded there, and **no prompt fires for one nobody has recorded**.
Recording a missed amendment is a data change like any other (step 5).

## 3 · P-10 — put the decision to the author, one question at a time, and record it in roadmap §8 in their words

| | |
|---|---|
| **Who** | A session asks; the author answers. |
| **Trigger** | The reading of steps 1–2 found something the session may not decide: a rule whose content would change; a reference to add or remove; an amendment that touches a cited Article; a source that cannot be read. Class C: a change to a value in `data/*.json` needs the author's approval (`docs/AUTONOMY-POLICY.md`; `docs/AI-SAFE-BOUNDARIES.md` §2–3). |
| **Action** | Ask one question at a time, with the recommendation first and the reason in the question, quoting the Article text that bears on it (never from memory). Record each answer in `docs/ROADMAP-v2.md` §8 **in the author's words, and commit it at once**: the standing instruction of the session prompts, because a worker can restart (`docs/prompts/v2-session-20.md`, "Riavvii del worker"). Do not change `data/` before the answer is in roadmap §8. |
| **Level** | *human authorship*: the decision. There is no *machine check* and no *human attestation* part. |
| **Trace** | `docs/ROADMAP-v2.md` §8, git-tracked. |
| **What no check sees** | Everything. **Nothing checks roadmap §8**: its rows are prose, and a decision absent from it is invisible to every validator. The decision is the author's, and so is the record of it. |

## 4 · P-11 — respond to `LAW_CHANGED_SINCE_VERIFIED` or `RULE_STALE`

This is the step the two prompts of §0 begin. It is P-08, P-09 and P-10 applied to the named rule, and it ends in one of
two states.

| | |
|---|---|
| **Who** | Nobody yet: the first prompt is due on 28 Jan 2027 (33 rules) and the second on 26 Mar 2027 (`ap-cra-01`). A session, under the author's prompt. |
| **Trigger** | §0. |
| **Action** | (1) Read the rule against its Articles (step 1). (2) Ask for amending acts and corrigenda (step 2). (3) Put anything that would change the rule to the author (step 3). (4) **Close the rule — only if every Article it cites was read; otherwise nothing in `data/` changes (step 2, last row) — in one of two ways.** *The rule changes*: the author's answer is written to `data/applicability.json`, with `last_verified` set to the date of the reading and the `verification_note` rewritten to say what was read and what was changed. *The rule does not change*: **no field records "re-read, no change"**; the practice today is a new `last_verified` together with a `verification_note` naming the date, the CELEX read, the Articles read and the metadata queried, as `ap-cra-01`'s own note does (roadmap §8, v2 Session 20, question 4). From 5 Nov 2026 (a `last_verified` later than 2026-11-04), either closure also writes `attestation` in the same change, with `of` equal to the new `last_verified`, `read`, `queried`, `outcome` and the §8 titles of any decision; *the rule does not change* is `outcome: "unchanged"`, the field this step said did not exist (`docs/ATTESTATION-FORM.md` §7). |
| **Level** | *machine check*: noticing — T-12 and `RULE_STALE`. *human attestation*: "re-read on D, no change needed", which today has **no form other than a new `last_verified`** (`docs/PHASE-4-SETUP.md` §2.2, P-11); from 5 Nov 2026, `attestation` with `outcome: "unchanged"`. *human authorship*: deciding the rule's new content. |
| **Trace** | The printed prompt (printed and counted, not stored); then, as P-08. A recorded evidence-audit run, if one is made, is `tools/evidence-audit-runs/evidence-audit.jsonl`: git-ignored, per machine (`docs/EDITORIAL-AUDIT-PATH.md`). |
| **What no check sees** | **Whether the law was re-read.** T-12 compares event dates to `last_verified`, and `RULE_STALE` ages `last_verified`, so a bare date bump closes both prompts whether or not anything was read — measured in §9 below. **A new `last_verified` without a `verification_note` that names what was read is not a closure; it is a silenced prompt.** The reader of a rule cannot tell the two apart, and neither can any check. A closure moves `last_verified`, and `tools/selftest.mjs` pins the dates of the 29 Oct 2026 reading (F10, X1, X2, Y3–Y6, through `READ_2026_11_04`): run `node tools/selftest.mjs` after each closure, and update the pin only on the author's word (roadmap §8, v2 Session 21). In v2 Session 21 the omission left the branch red for four closures. |

**The structured form of this attestation is the next item, not this one.** `docs/PHASE-4-SETUP.md` §2.2 names it
(*human attestation* for P-08 and P-11, "0.2 generalised"); this document proposes no field for it.
*Written in v2 Session 22 (4 Nov 2026): `docs/ATTESTATION-FORM.md`; checks A-1…A-8 in `tools/attestation-audit.mjs`, run by `tools/validate.mjs`.*

## 5 · P-12 — regenerate the generated pages

| | |
|---|---|
| **Who** | The same session. |
| **Trigger** | **Any change to `data/`**, including a change of `last_verified` alone — measured in the rehearsal below — and any edit of an inline script (`docs/SEO-OPERATIONS.md`). |
| **Action** | `node tools/_footer.mjs`, then commit what it writes. `node tools/_footer.mjs --check` reports what is out of date without writing; a second run writes nothing. Never edit a file under `instruments/` by hand. If the change alters an instrument's name, CELEX number or kind, also `node tools/og-image.mjs` (needs a local Chromium). |
| **Level** | *machine check* only: detecting staleness (`seo-audit.mjs`; CI). The generation itself is deterministic and there is no judgement in it. |
| **Trace** | The regenerated files (`sitemap.xml`, `instruments/<id>/index.html`, …), git-tracked. |
| **What no check sees** | Nothing, in the direction that matters: **it is the one step here whose omission a check catches** — `seo-audit.mjs` errors on a stale page, CI fails, and `pages.yml` does not deploy (run 55, `d65e713`, 2 Nov 2026). It cannot catch a generated file that is current but whose underlying record was wrong. |

## 6 · P-13 — name the evidence of a published change in an `Evidence:` trailer

| | |
|---|---|
| **Who** | Whoever commits. |
| **Trigger** | A non-merge commit that changes a file of the published surface (`tools/pages-artifact.mjs`: the pages, `app.js`, `style.css`, `sitemap.xml`, `css/`, `js/`, `data/`, `i18n/`, `fonts/`). A change to a rule is one. A commit that changes only `docs/` is not: `node tools/commit-evidence.mjs` reports it "changes no published file". |
| **Action** | Add one trailer line to the commit message, `Evidence: <what justified the change>` — the source read, the record, the check — saying something (more than a few characters). Run `node tools/commit-evidence.mjs <base> <head>` before pushing; it runs in `qa.yml` and `pages.yml`. |
| **Level** | *machine check*: that the line exists. *human attestation*: the line is a declaration. *human authorship*: what the evidence is. |
| **Trace** | The commit message, git-tracked. |
| **What no check sees** | **Whether the evidence is good.** `tools/commit-evidence.mjs` checks that a line exists and says something; "Evidence: read it" passes. It cannot judge whether the evidence carries the change (its own header says so). |

---

## 7 · The order, in one paragraph

A prompt fires (§0). A session reads the rule against the Official Journal text (1), asks what amends or corrects it (2),
puts anything that would change the rule to the author and records the answer in roadmap §8 (3), closes the rule — changed, or
unchanged with a note that says what was read (4), regenerates (5), and commits with an `Evidence:` line (6). The
validators then run as at every change: `node tools/validate.mjs`, `i18n-audit.mjs`, `design-qa.mjs`, `freshness.mjs`,
`evidence-audit.mjs`, `seo-audit.mjs`, `tools/selftest.mjs`, and the agent suites a change under `agent/` or `tools/`
requires (`AGENTS.md`). Of those, only step 5 has a check that notices its omission — and `selftest`, which notices a closure, not its omission. From 5 Nov 2026, A-3 notices the omission of step 4's attestation: a date moved with no form fails `validate.mjs`. Steps 1, 2, 3, 4 and 6 are
declarations, and the system holds them as prose.

## 8 · What this document does not establish

- **That any step is right.** It describes the practice of Sessions 13–19; the practice may be wrong. The walk below found
  what it found and no more.
- **That a prompt will fire for a change that matters.** T-12 reads recorded edges and events only; an amendment nobody
  has recorded produces no prompt (§2).
- **That the law was read** by anyone, on any date: nothing in the tree can say (§1, §2, §4).
- **That Cellar or the SPARQL endpoint will answer.** Neither is under this repository's control.
- **That a CMS or a login is needed.** None of this needs one; D-5 is deferred (roadmap §8, v2 Session 17.5, question 7).
- **Anything about automating a step.** No step is automated or proposed for automation here. The structured form of
  *human attestation* for P-08 and P-11 is the next item, named in `docs/PHASE-4-SETUP.md` §6, and is not written. *(4 Nov 2026: written — `docs/ATTESTATION-FORM.md`.)*

---

## 9 · The rehearsal of 3 Nov 2026

*The account of one walk of the steps above, made once on the records, as `docs/PHASE-4-SETUP.md` §6 requires and roadmap §8
(v2 Session 20, question 5) decided. It is what the author asked for, and it is not a re-reading of the law.*

**What was run.** On a full clone (`git rev-parse --is-shallow-repository` → `false`), `main` at `40d4dd1`:

```
node tools/evidence-audit.mjs --as-of 2027-03-26    exit 0
node tools/freshness.mjs      --as-of 2027-03-26    exit 0
```

`evidence-audit` printed, among its 18 warnings, the one line about a rule (and no other rule is named by T-12):

```
! LAW_CHANGED_SINCE_VERIFIED applicability/ap-cra-01: cites cra, amended by ehds (rel-ehds-cra-amends), whose tl-ehds-2027-03-26-application (2027-03-26) is after last_verified 2026-10-29
```

`freshness` printed 33 `RULE_STALE` prompts, among them:

```
! RULE_STALE applicability/ap-cra-01 was last verified 2026-10-29, 148 days ago, past its 90-day interval — a rule reads its Articles, and an amendment, a new tranche or a judgment changes what it should say
```

Both match `docs/PHASE-3-AUDIT.md` §5 and the prompt's table (and `evidence-audit` gave 0 errors; `publishable 33 of 33`).

**How far the walk went.** It followed §0 to step 4 on `ap-cra-01` **up to the point where a person would read the text,
and stopped there**: the prompt names `cra` and the EHDS (`rel-ehds-cra-amends`, whose application event is
`tl-ehds-2027-03-26-application`); the rule's `verification_note` already records what a reading on 29 Oct 2026 found —
that Art. 104 of Regulation (EU) 2025/327 replaces Arts 13(4) and 31(3) of the CRA and inserts Art. 32(5a) from
26 March 2027, and leaves Arts 13(1) and 14 untouched, the author deciding on 29 Oct 2026 "a note, no reference" — so the
person's first question is whether the application of that amendment on 26 Mar 2027 changes anything the rule says. **That
question is not answered here.**

**What was measured on a scratch copy, outside the repository** (in the session's scratchpad; the repository's own `data/`
is unchanged — `git status` empty, `git diff -- data` empty): `ap-cra-01`'s `last_verified` was set to 2027-03-26 and
nothing else.

| | on the real records | on the copy with that one date |
|---|---|---|
| `LAW_CHANGED_SINCE_VERIFIED` (`evidence-audit --as-of 2027-03-26`) | 1 | **0** |
| `RULE_STALE` (`freshness --as-of 2027-03-26`) | 33 | **32** |
| `node tools/_footer.mjs --check` | every generated file is current | **2 generated files out of date**: `sitemap.xml` and `instruments/cra/index.html` |
| `node tools/seo-audit.mjs` | 0 errors | **8 errors**, among them `sitemap.xml … lastmod 2026-10-29 ≠ the newest verification date the page renders (2027-03-26)` for `applies.html`, `bibliography.html`, `datasets.html` and `instruments/cra/`, and `Article dateModified is not the route model's` |
| `node tools/validate.mjs` | 0 errors | 0 errors |

So the two things the document says are measured and not argued: **a bare date bump silences both prompts** (§4), and
**a change to `last_verified` alone makes generated files stale and fails `seo-audit`** (§5), which is why a rule's closure
is not complete until `_footer.mjs` has been run and its output committed.

**Where the document was clear.** The order of the steps and the trigger of each; that steps 1–4 stop at a person; that
step 5 is the only one a check notices; the form of the note, because `ap-cra-01`'s own note is an example.

**Where it was not, and what had to be assumed.**
1. **Step 5's trigger needed the measurement.** `docs/PHASE-4-SETUP.md` §1 (P-12) says "after a change to `data/` or an
   inline script". That is true, and a person closing a rule could read it as meaning a content change: the walk showed
   that even the smallest closure — one date — makes two generated files stale and fails `seo-audit`. The step says so,
   with the measurement in this section. **No step of the document was shown wrong by the walk and none was corrected**;
   this is a place the sources were silent and the document now is not.
2. **What "close the rule" does to `last_verified` for a partial re-reading** is not stated by any source here. The
   document says to leave `last_verified` where it is when the reading could not be made (§2); that is an assumption drawn
   from "a silenced prompt is not a closure" (§4), not a rule the author decided. It is for the author to confirm.
3. **Whether all 33 rules are to be re-read on one day** or over several is unstated; the document says only that they
   lapse on the day they were read (§0).
4. **The SPARQL query itself** (its text, its variables) is not recorded anywhere in the repository (`docs/PHASE-4-SETUP.md`
   P-09: "the queries themselves are not kept"). The document gives the endpoint, which the earlier prompts recorded, and
   the kinds of thing asked; it cannot give the query. A person starting from this document alone would have to write it.

**Decided on 4 Nov 2026** (roadmap §8, v2 Session 21; noted here, the account above is not rewritten). Item 2: a rule's
`last_verified` moves only when every Article it cites was read; otherwise nothing in `data/` changes (premise 1, step 2).
Item 3: the rules are re-read in stages (premise 2, §0). Item 4: the query is kept in step 2 (premise 3). The HTTP 400 of
the probe below came from a request without `Accept-Language: eng` (step 1).

**What this rehearsal did not do.**
- **No re-reading of the CRA or the EHDS.** No Official Journal text was read, and no legal conclusion about `ap-cra-01` is
  drawn or implied.
- **No rule or data file was changed in the repository**; no `last_verified` was touched there.
- **No Cellar and no SPARQL request was made.** The network was not used for the walk: a rehearsal on the records needs
  none. (One unrelated probe of Cellar from this environment, made while preparing, answered HTTP 400; it was not
  investigated, and nothing here depends on it.)
- **Steps 3 and 6 were not exercised on a real change**: no question to the author about a rule was put, because no rule
  was to change; and no commit carried a published-file change, so P-13 was read, not run on one.
- **One walk, one rule, one date.** It is not evidence that the process works for the other 32 rules, for a rule that must
  change, or on 28 Jan 2027.
