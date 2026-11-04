# ATTESTATION FORM — the structured human attestation of a rule's reading (P-08, P-11)

**Status: A DESIGN, DOCS ONLY; IT IMPLEMENTS NOTHING.** Item 22.1 of v2 Session 22 (4 Nov 2026), on
`claude/session-22-o5cl9k`, under `docs/PHASE-4-PLAN.md` (exit criterion X-2) and the session's prompt
(`docs/prompts/v2-session-22.md`). Every choice below is the author's, answered one question at a time and recorded in
`docs/ROADMAP-v2.md` §8, v2 Session 22, 22.1 questions 1–7. **"Roadmap §8" means that approval record throughout;
"Q1"…"Q7" are those seven rows.** The field, its validation and its checks are item 22.2, which does not begin before
this design is approved at checkpoint 22.1.

**Why it exists.** Today the attestation that a rule was read against its Articles is a `verification_note`, free prose
that nothing reads (`docs/PHASE-4-SETUP.md` §2.2, P-08 and P-11; `docs/RULE-MAINTENANCE.md` §1 and §4). A new
`last_verified` with a note that does not say what was read is "not a closure; it is a silenced prompt", and "the reader
of a rule cannot tell the two apart, and neither can any check" (`docs/RULE-MAINTENANCE.md` §4). The form makes the
declaration readable by a check. **It does not make the reading checkable** (§6).

---

## 1 · The shape

A new optional object `attestation` on a rule in `data/applicability.json` (Q1). It is written by a closure — the
rule re-read under `docs/RULE-MAINTENANCE.md` steps 1–4 — and only by closures made after the form exists (Q4).

```json
"attestation": {
  "of": "2027-01-20",
  "read": [
    { "source_id": "src-eurlex-cra",  "locator": "Art. 2; Art. 3 points (1), (13), (14), (21) and (22); Art. 13(1); Art. 14; Art. 69; Art. 71" },
    { "source_id": "src-eurlex-ehds", "locator": "Art. 104; Art. 105" }
  ],
  "queried": ["src-eurlex-cra"],
  "outcome": "unchanged",
  "decisions": []
}
```

*(An illustration with a hypothetical date, built from what `ap-cra-01`'s note of 4 Nov 2026 says was read. It is not a
record, and no rule carries it.)*

| Part | What it declares | Its values | Decided |
|---|---|---|---|
| `of` | **the seal**: the date of the reading this attestation is about | equal to the rule's `last_verified`, or the tree fails | Q2 |
| `read` | the texts read, each by its source record, and the Articles read in it | a non-empty list of `{source_id, locator}`; `locator` in the grammar of `sources[].locator` | Q1 |
| `queried` | the texts whose amending acts and corrigenda were asked of the Publications Office's SPARQL endpoint (P-09) — **that** they were asked, not what came back | a list of `source_id`s, each also in `read` | Q1 |
| `outcome` | whether the reading changed the rule | `"changed"` or `"unchanged"` | Q3 |
| `decisions` | the roadmap §8 rows in which the author decided the change | the exact bold titles of those rows; at least one when `outcome` is `"changed"`; may be empty when `"unchanged"` | Q3 |

**What it does not hold**, each because it has a home already or is not a declaration:

| Not in the form | Its one home |
|---|---|
| the date of the reading | `last_verified` (the seal `of` is a check, not a second date: §2) |
| a text's CELEX, title, URL | its record in `data/sources.json` |
| the Articles the rule *cites* | `sources[].locator`, `exemptions[].basis[].locator`, `obligations`, `condition_provisions` |
| what SPARQL returned (amending acts, corrigenda, languages) | prose in `verification_note`; the amendments recorded as law are `data/instruments.json` `relationships` |
| what was decided, and why | roadmap §8, in the author's words |
| what was found, what was not re-read, the reader's account | `verification_note`, published on `applies.html` |

**It is not shown on `applies.html`** (Q6). The published `verification_note` stays the reader's account; 22.2 touches
no page, no module under `js/` and no i18n string.

## 2 · How it is coupled, and the one place a fact is written twice

| Pair | Coupling | What fails |
|---|---|---|
| `attestation.of` ↔ `last_verified` | a seal checked equal (Q2): `last_verified` is the date every consumer reads; `of` exists so that a check can tell an attestation of *this* reading from one left over from the last | `of` ≠ `last_verified` → ERROR. A re-reading that moves the date and forgets the form fails the tree on every date. |
| `last_verified` ↔ the form's existence | the form is required of every rule whose `last_verified` is later than **2026-11-04**, a named constant (Q4) | a later `last_verified` and no `attestation` → ERROR: the bare date bump of `docs/RULE-MAINTENANCE.md` §9, which silences both prompts, can no longer be deployed |
| `attestation.read` ↔ the rule's citations | completeness, at Article level (Q5; §3) | a cited Article of a tier-1 text not in `read` → ERROR |
| `attestation.decisions` ↔ roadmap §8 | each title must match exactly one §8 row's bold title (Q3) | no match, or two → ERROR; `"changed"` with no decision → ERROR |
| `attestation.read` ↔ `verification_note` | **a known second home** (Q7): the note keeps naming what was read, because it is the only account a reader sees; the form names it for the checks. Coupled at the level of the text: the note must contain the CELEX of each tier-1 text in `read` | a missing CELEX → ERROR. The Articles are **not** compared (§6). Recorded in `docs/DATA-GOVERNANCE.md` §5 by 22.2. |

**Why `of` is not a second home.** It is a copy that a check refuses unless identical, so it can never state a different
date; its only use is to make staleness visible. The alternative with no date at all leaves a stale attestation invisible
to every check; the alternative through git history depends on history a shallow clone lacks (Q2, the rows not chosen).

## 3 · The offline checks

All of them read the records and `docs/ROADMAP-v2.md`, and nothing else: **no network, no clock, no write** (plan §2;
`docs/AUDIT-2026-09-01.md` F-12). Where each lives in `tools/`, the code that names it and the test that plants its
failure are item 22.2's, put to the author there check by check.

| # | Check | Severity | The case that fails it |
|---|---|---|---|
| A-1 | `attestation` is an object with exactly the five parts; `outcome` in its vocabulary; `read` non-empty; every `source_id` resolves; every `queried` id is also in `read` | ERROR | a misspelt key; `"outcome": "re-read"`; `read: []`; a dangling source |
| A-2 | **the seal**: `of` equals `last_verified` | ERROR | the next reading moves `last_verified` and leaves the form |
| A-3 | **the gap**: `last_verified` later than 2026-11-04 and no `attestation` | ERROR | a bare date bump |
| A-4 | **completeness**: every Article, Annex or Recital in a locator on a tier-1 source (`sources[]` and `exemptions[].basis[]`) is in `read` under the same `source_id`; every provision in `obligations` and `condition_provisions` is in `read` as its Article number under one of its tier-1 sources. Compared **at Article level** | ERROR | `Art. 32(6)` cited, not read (§5, planted case 3) |
| A-5 | every tier-1 text in the rule's `sources[]` is in `queried` (P-09 is part of P-08); an amending act read in addition need not be | ERROR | a cited tier-1 text whose amendments were not asked (§5: `ap-ai-act-06`) |
| A-6 | each `decisions` title matches exactly one roadmap §8 row; `"changed"` names at least one | ERROR | a title not in §8; a changed rule with no decision |
| A-7 | the `verification_note` contains the CELEX of each tier-1 text in `read`, taken from the source's URL (a CELEX URL directly; an ELI of a Union act converted deterministically) | ERROR | a note that does not name a text the form says was read |
| A-8 | **what the checks cannot resolve, named, never skipped**: a locator segment the parser cannot read as an Article, Annex or Recital; a provision whose number is an Article of another act ("5a (of Regulation (EU) No 910/2014, as inserted)"); a tier-2 source the rule cites that `read` does not name; a tier-1 text in `read` whose URL yields no CELEX | WARNING, one line each | `ap-eidas2-01`'s "Citation (…)" segments (§4) |

**Article level, not paragraph level.** Reading Art. 13(1) satisfies A-4 for a citation of Art. 13(4). A locator's
paragraphs and points are free text (`"Art. 3 points (1), (13), (21) and (22)"`, `"Art. 113, third paragraph, point
(b)"`); a parser that claimed to compare them would be claiming more than it can do reliably. The check says what it
compares.

## 4 · What was measured before the checks were promised (4 Nov 2026, `main` at `244072f`, full clone)

*Measured with a scratch parser outside the repository (plan §5, second risk). 22.2 re-measures with the real one.*

| Measure | Result |
|---|---|
| Locators of the 33 rules on tier-1 texts (`sources[]` and `exemptions[].basis[]`) | **113**, with **216** segments (split at `;` outside parentheses) |
| Segments resolved to an Article, Annex or Recital | **214 of 216** |
| Segments not resolved | **2**, both `ap-eidas2-01`: "Citation ('in particular Article 5a(23) thereof')" on `src-eurlex-eudi-2024-2977` and "Citation ('in particular Article 5c(6) thereof')" on `src-eurlex-eudi-2024-2981` — the citation of an implementing act, which is not an Article |
| Locators carrying an amended Article in parentheses ("Art. 1 point (7) (Art. 5(1) …, as inserted)") | **12**; resolved to the amending act's Article (the outer one) |
| Locators on tier-2 sources (press releases, guidance, a Commission report) | **10**; they name sections, pages, paragraphs — not Articles by nature |
| Rules whose every tier-1 locator resolves | **32 of 33** (all but `ap-eidas2-01`) |
| Provision references (`obligations` + `condition_provisions`, per rule, deduplicated) | **136**: 124 resolve to one tier-1 text and an Article number directly; 9 more by the leading number ("3(63)" → Art. 3) or with two tier-1 texts, a base act and its amending act, either of which satisfies A-4; **3** (`eidas2:art-2`, `art-3`, `art-5a`, all on `ap-eidas2-01`) are Articles of Regulation (EU) No 910/2014 recorded under the amending Regulation's source, and A-8 names them |
| Tier-1 records in `data/sources.json` whose URL yields a CELEX (A-7) | **48 of 52**: 43 by a CELEX URL, 5 by an ELI; 4 (a Commission decision PDF, three national judgments) yield none, and no rule cites them today |
| Rules today with `last_verified` later than 2026-11-04 (A-3) | **0**: nothing is backfilled (plan §2) |
| Roadmap §8 bold titles (A-6) | **232**, none duplicated |

## 5 · The paper test: the eight closures of v2 Session 21, as if the form had existed

Each of the eight rules re-read on 4 Nov 2026 was written as an attestation **from its own `verification_note` and roadmap
§8 row, and from nothing else**, then run through a scratch prototype of A-1…A-8. No record in `data/` was changed; this
is not a backfill (plan §2): the eight stay prose, and none will carry the form.

| Rule | `read` (from the note) | `queried` | `decisions` (§8 title) | Result |
|---|---|---|---|---|
| `ap-nis2-01` | nis2: Arts 2, 3, 20, 21, 23, 32(6), 41, Annexes I and II; the press release of 8 July 2026 | nis2 | "v2 Session 21, 21.2 F-02: …" | passes |
| `ap-nis2-02` | nis2: Arts 2, 3, 6 points (30) and (31), 20, 21, 23, 41, Annex I point 8 | nis2 | "… F-04: …" | passes |
| `ap-cra-01` | cra: Arts 2, 3, 13(1), 14, 69, 71; ehds: Arts 104, 105 | cra | "… F-03: …" | passes |
| `ap-ai-act-02` | ai-act: Arts 2(1)(a), 3, 53, 111, 113; ai-omnibus: Art. 1; the Code of Practice page | ai-act | "… F-13: …" | passes |
| `ap-ai-act-06` | ai-act: Arts 2(1)(b) and (3), 3 point (4), 5, 27, 113; ai-omnibus: Art. 1 points (7), (13), (40); TEU: Art. 4(2) | ai-act | "… F-14: …" | **fails A-5**: `src-eurlex-ai-omnibus` is a tier-1 text in the rule's `sources[]`, and on 4 Nov 2026 only the AI Act was queried (roadmap §8, F-14: "SPARQL, one amending act, four corrigenda" — the AI Act's) |
| `ap-gdpr-04` | gdpr: Arts 2, 4, 22, 35; ai-act: Art. 3 points (3) and (4) | gdpr | "… F-17 and F-23: …" | passes |
| `ap-dsa-03` | dsa: Arts 2(1), 3, 19, 27, 33, 34, 35 | dsa | "… F-19: …" | passes |
| `ap-dma-04` | dma: Arts 1(2), 2, 3, 54; IP/25/2717; the announcement of 25 June 2026 | dma | "… F-20: …" | passes |

**Seven pass and one fails, and the failure is the form doing what was decided.** `ap-ai-act-06` cites the AI Omnibus as a
source; under A-5 its closure would have had to ask the Omnibus's own amending acts and corrigenda too. Whether that is
right for an amending act that a rule cites is not reopened here: Q5 decided it, and the paper test shows its first
consequence. It is reported at checkpoint 22.1.

**Planted against the same prototype**, each fails as intended:

| Planted case | Result |
|---|---|
| 1. `ap-cra-01`'s `last_verified` set to 2027-03-26 and nothing else — the bare date bump of `docs/RULE-MAINTENANCE.md` §9 | A-3, ERROR |
| 2. the same date, with the attestation of 4 Nov 2026 left in place | A-2, ERROR (seal 2026-11-04 ≠ 2027-03-26) |
| 3. `ap-nis2-01` with Art. 32(6) removed from `read` | A-4, ERROR (Art. 32 unread) |
| 4. `ap-dsa-03` with a decision titled "v2 Session 21, F-19" | A-6, ERROR (matches 0 rows) |
| 5. `ap-gdpr-04` with a note that names no CELEX | A-7, ERROR, twice (32016R0679, 32024R1689) |
| 6. `ap-eidas2-01`, hypothetically attested over every Article it cites | 0 ERROR, **5 WARNING** (A-8): the two "Citation (…)" segments and the three 910/2014 provisions |

**Where the form is not enough, as the paper test showed it:**

1. **`ap-eidas2-01` is mostly outside A-4.** Of what it cites, two segments and three provisions can only be named, not
   compared. Its attestation would be a declaration the check cannot hold to its citations. It is one of the five rules of
   Session 24.
2. **Tier-2 sources are only named.** `ap-dma-04`'s and `ap-nis2-01`'s press releases are, in the notes, quoted; the form
   records that they were read and where, and A-8 warns when one is missing. What they say is not compared to anything.
3. **Article level hides paragraphs.** All eight notes read whole Articles or the cited paragraphs, so nothing was hidden
   here; a reading of Art. 14(1) alone would still satisfy a citation of Art. 14(3).
4. **The notes' richest content stays prose.** What SPARQL returned, which corrigenda have an English expression, what a
   corrigendum corrects, what was *not* re-read ("The claims were not re-read"): the form carries none of it (Q1).

## 6 · What the form cannot see

- **That the law was read.** The form is a declaration. A-4 shows that the Articles *named* cover the Articles *cited*;
  it cannot show that anyone opened the text, or that the rule says what the Article says. No tool in this repository
  fetches anything (`docs/AUDIT-2026-09-01.md` F-12), and none will (plan §2). This is P-02's limit in the Control Room
  ("a **declaration, not proof of reading**", `docs/PHASE-4-SETUP.md` §1), carried to a rule.
- **That the query was run, or what it returned.** `queried` says a text was asked about; A-5 checks that it says so.
  The answer is prose, and nothing here can tell a query run from a query claimed.
- **That the note and the form agree on the Articles.** A-7 compares texts (by CELEX), not Articles. A note listing
  Arts 2 and 3 next to a form listing Arts 2, 3 and 14 passes.
- **That a decision row says what the change was.** A-6 matches a title; it does not read the row, and nothing checks
  roadmap §8's content (`docs/RULE-MAINTENANCE.md` §3).
- **That "unchanged" is true.** An `outcome` of `"unchanged"` with a rule whose content did change in the same commit
  passes; a check comparing commits would need git history (the reason Q2 refused that route).
- **Paragraphs and points** (§3), **tier-2 content** (§5, item 2) and **the five cases of A-8** (§4).
- **The 33 rules of today.** None carries the form, and none will until it is re-read: the eight of 4 Nov 2026 from
  3 Feb 2027, the other 25 in Sessions 23 and 24.

## 7 · How a closure uses it

`docs/RULE-MAINTENANCE.md` step 4, "close the rule", gains one act: **write `attestation` in the same change that moves
`last_verified`**, with `of` equal to it, `read` naming every text and Article read, `queried` every text asked of SPARQL,
`outcome`, and the §8 titles of any decision. The note is rewritten as before and names the CELEX of every tier-1 text
read. Then `node tools/validate.mjs` (A-1…A-8 live there or beside it, 22.2), `node tools/selftest.mjs`, `node
tools/_footer.mjs` and the commit with its `Evidence:` line, as steps 5 and 6 already require. **A reading that could not
be completed writes no attestation and moves no date** (roadmap §8, v2 Session 21, premise 1): A-4 is that premise made
mechanical. The change to `docs/RULE-MAINTENANCE.md` itself is put to the author in 22.2.

## 8 · What this document does not establish

- **The implementation.** Field validation, the module that holds A-1…A-8, the tests that plant each failure and the
  `tools/selftest.mjs` pins are 22.2's, each put to the author.
- **That the form will be used well.** Its first real use is Session 23's twenty closures (plan §3, X-2's last clause);
  until then this is a design tested on paper against eight closures that were made without it.
- **That Article-level completeness is enough.** It is what a deterministic parser can do on these locators; whether it
  is enough is a judgement the first uses will inform.
- **Anything about P-04 or P-09 as processes of their own.** The form covers P-08 and P-11; P-09 appears only as
  `queried`. Their dispositions are the X-1 table's (22.3).
- **That the law was read**, on any date, by anyone (§6).
