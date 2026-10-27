# ROADMAP v2.0

**Status: APPROVED by the author on 25 Oct 2026 (§8)**, with item 2.0 brought forward to v2 Session 2. Written in v2 Session 1, 25 Oct 2026, on
`claude/roadmap-v2-2026-10-25`, cut from `main` at `5f3859e`. Nothing in it is implemented, and
nothing in it may be implemented until the author approves it. The approval is recorded in §8, by
the author's word, and nowhere else.

**What governs it.** The BRIEF v2.0 ("Contratto tra sessioni") is the contract; this document is the
plan that answers it. The brief is `docs/BRIEF-v2.md`, committed on 27 Oct 2026 (decision D-1, §8). Where this roadmap departs from the brief, or reads it in a way
the brief does not settle, it says so in §3 and does not proceed on that point.

**What it is measured against.** `docs/AUDIT-2026-10-24.md` — the Control Room content audit the
brief calls "the P0/P1 audit", reproduced verbatim and checked against the code there.

**Numbering.** "v2 Session N" throughout, because this repository already has a SESSION 01 (the
operating policies) and SESSIONS 00–30. The two series are unrelated.

---

## 1 · The brief's principles, as conditions a session can be held to

A principle that no exit criterion can fail is decoration. Each one below names how it is checked.

| Brief | How this roadmap makes it checkable |
|---|---|
| More explicit, not bigger | Phases 0 and 1 add **no** new instrument, page or dataset. Phase 2 opens only when §4's Phase 1 checkpoint is recorded in §8. |
| Every expansion traceable to a declared criterion | Item 2.0 writes the criterion down **before** any instrument is added; each addition cites it. The brief lists the instruments but does not state the criterion they meet (§3, D-7). |
| Uncertainty legible, not hidden | Every new field or view states its `null`/`unknown`/absent states and renders them apart (`docs/AI-SAFE-BOUNDARIES.md` §0.3–0.4). |
| Partiality allowed if declared | The exclusion register and watchlist (2.1) are data, not prose; the dependency map's unverified edges are shown as unverified or not shown (2.0). |
| What was checked, on which evidence, on what date, with what limits | Every Phase 0–1 change answers those four questions on screen. It is the audit's own conclusion, and Phase 0's exit criteria test it field by field. |

The brief's "do not" list is carried in full by the phase that each item would otherwise tempt;
it is not restated here.

---

## 2 · Where the repository is today (measured 25 Oct 2026, `5f3859e`)

- Validators: `validate`, `i18n-audit`, `design-qa`, `evidence-audit` 0 errors; `freshness` 0
  defects. The baseline figures have one home, `docs/CURRENT-ARCHITECTURE.md` §12.
- `git branch -r --no-merged origin/main` lists nothing.
- **Already present, relevant to the brief:**
  - `eidas2` is an instrument record (the brief's "promotion" is from that).
  - `dga` is an instrument record (the brief's Phase 3 "DGA in transition" concerns it).
  - `data/instruments.json` holds **17 typed relationships** between instruments (eight kinds:
    overlap, conflict, complement, amends, lex specialis, repeals, legal basis, carve-out), each
    with `provisions`, `claims`, `sources` and `last_verified`. That is the existing inter-instrument
    graph the dependency map must build on rather than duplicate (D-6).
  - **`applies.html` is published**: 33 applicability rules (`data/applicability.json`), every one
    with `sources` and `last_verified` — but its source references are **bare IDs**, without the
    `supports` qualifier or the locator a claim's references carry, and `tools/evidence-audit.mjs`
    does not read `applicability.json` at all (D-2).
  - A Control Room exists (`.control-room/`, OIDC and local providers, seven views, seven approval
    gates, a hash-chained trail) and is not deployed anywhere (`docs/CONTROL-ROOM.md` §11).
- **Absent:** a `stratum` property, anywhere; any record for the Cyber Solidarity Act, EHDS, the
  Interoperable Europe Act or the Digital Networks Act. This roadmap states **no fact** about any of
  them — not a status, a date or an article. Each is read from a retrieved primary source in the
  session that adds it, or it is not added.

---

## 3 · Decisions the author has to take, and the phase each one blocks

None is taken here. Each carries a recommendation; the recommendation is not a decision.

| | Decision | Blocks | Recommendation |
|---|---|---|---|
| D-1 | Where the brief lives — **decided 27 Oct 2026: as recommended** (§8; `docs/BRIEF-v2.md`) | nothing yet | Commit it as `docs/BRIEF-v2.md`, pointed to once from `AGENTS.md`, so a session that is not handed it still finds it. One home: the prompt then cites the file rather than carrying a copy. |
| D-2 | `applies.html` is already published, and the brief says not to publish "what applies" before the triggers meet claim-level rigour — **decided 27 Oct 2026: as recommended, kept with a notice** (§8) | Phase 1 item 1.5; Phase 3 | Keep the page; in Phase 1, add a plain statement on it that its rules are not yet verified to the standard the claims are (the measured gap in §2). The statement is public text, so its wording is yours. Withdrawing the page is the other honest option; leaving it unmarked is not. |
| D-3 | The six uniform status labels vs the 16 states in `data/taxonomy.json` — **decided 25 Oct 2026: as recommended** (§8; designed in `docs/v2-design/status-labels.json`) | Phase 2 | Make the six a **derived display grouping** over the 16, never a replacement and never stored (IDs are never renamed; a derived fact is never stored). §5 drafts the mapping and shows where it loses information. |
| D-4 | "Tier A/B/C" collides with the autonomy classes A/B/C/D of `docs/AUTONOMY-POLICY.md`, which mean something else | Phase 4 | Name the three levels in words — *machine check*, *human attestation*, *human authorship* — and give them no letters. |
| D-5 | A git-based CMS with OAuth, under "no serverless backend" and "no third-party requests" | Phase 4 | Not needed before Phase 4. Before choosing one, read the chosen CMS's own documentation for two facts this session did not verify: whether its GitHub login needs a server-side token exchange (which is a backend), and which origins it loads code from (`ALLOWED_RUNTIME_ORIGINS` in `tools/thirdparty.mjs` is empty; adding one is Class D). Weigh it against the Control Room's existing OIDC login. |
| D-6 | What the dependency map is — **decided 25 Oct 2026: as recommended** (§8; designed in `docs/V2-DATA-DESIGN.md` §1) | Phase 2 | An extension of the 17 existing `relationships`, not a second graph: new edge kinds, if needed, go in `data/taxonomy.json`; the map is a derived view. A separate file would be a second home for the edges that already exist. |
| D-7 | The inclusion criterion behind the Phase 2 list — **decided 27 Oct 2026: the criterion of `docs/V2-DATA-DESIGN.md` §5 approved** (§8) | Phase 2 | Item 2.0 proposes one in writing; you approve it before 2.2. The list itself is already decided by the brief and is not reopened. |
| D-8 | The brief mentions `stratum` being reviewed "in Session 2"; this roadmap puts Phase 0 in v2 Session 2 — **decided 25 Oct 2026: reviewed in v2 Session 2 with item 2.0, and `stratum` dropped, derived instead** (§8; `docs/V2-DATA-DESIGN.md` §1.2) | v2 Session 2 | Keep the brief's binding sequence (Phase 0 first) and review `stratum` in the Phase 2 design session (v2 Session 4). The brief's clause is conditional ("if it emerges in Session 2"), and nothing in Phase 0 touches the property. |
| D-9 | Where a reviewer's attestation is recorded — **decided 25 Oct 2026: the trail** (§8) | Phase 0 item 0.2 | The Control Room trail, in the same entry as the decision it accompanies, bound to the same fingerprint. Not the decision ledger: the attestation is a fact about the review, not about the grant, and the ledger is one home for grants. Trade-off, stated: the trail is per-machine and git-ignored. |
| D-10 | Item 0.3 is this session's finding, not the audit's — **decided 25 Oct 2026: in Phase 0** (§8) | Phase 0 item 0.3 | Include it in Phase 0: it is a check that reports a clean result on an invalid date, and the brief's fifth principle is "on what date". |

---

## 4 · The phases

Each item names what it traces to, the standing rules it must not break, and an exit criterion a
session can fail. **A phase ends at a checkpoint**: the session reports, the four validators and
every suite are re-run, `docs/HANDOVER.md` records the result, and the author's approval is
recorded in §8 before the next phase starts.

### Phase 0 — the audit's P0 (v2 Session 3 — moved on 25 Oct 2026, §8)

**0.1 · Snapshot time and state** — audit B and E.
- Every Control Room view payload carries the time the server assembled it. The interface shows
  it as "Snapshot taken at …" on every view.
- "Live system" is renamed to something that does not promise real time.
- One manual **Refresh** per view, declared as manual; no periodic refresh in Phase 0.
- On a failed fetch, the last snapshot stays visible, marked with its own time and the error.
- Website health shows **reference date** (`as_of`), **run recorded at** (`recorded_at`) and
  **commit analysed** as three separate fields. Freshness is never inferred from `as_of` alone.
- *Must not break:* `docs/CONTROL-ROOM.md` §12. Refresh is a `GET` of the same view; no new route
  verb. The server stays the authority, and the browser derives nothing.
- *Exit:*
  - `.control-room/selftest.mjs` asserts every view payload carries an ISO assembly time.
  - It asserts the health payload's three fields are distinct, and that no label in `ui/` presents
    `as_of` as a run date.
  - The words "Live system" no longer appear as a label.

**0.2 · Attestation of evidence review** — audit C.
- Approving or denying requires an attestation in the review body.
- The attestation names, from a fixed list, the sections the reviewer declares they examined:
  evidence, sources, operations, tests, rollback.
- It is recorded with the decision (D-9).
- The wording on screen says what it is: a **declaration**, not proof of reading (the audit's own
  caveat).
- **Not proposed:** recording which panels were opened in the browser. That is cosmetic, trivially
  faked, and would invite being read as proof.
- *Must not break:* the strict unknown-field check (`server.mjs` `parseStrictJson`). The field is
  added to the accepted list at `server.mjs:424`; the check is not loosened. Also: one writer of a
  grant; `request_changes` stays a non-state.
- *Exit:*
  - A decision without an attestation is refused, naming the field.
  - An unknown field is still refused.
  - The attestation appears in the trail entry and the chain verifies.
  - After a decision, the tree is byte-identical except the ledger (the existing assertion still
    passes).

**0.3 · A date the tools cannot read is refused, not reinterpreted** — D-10,
`docs/AUDIT-2026-10-24.md` §3.1.
- `tools/freshness.mjs` takes the date positionally and treats `--as-of` as a date. It then reports
  "Nothing past its stated interval" (0 prompts, exit 0) where the correct date gives 2.
- `tools/evidence-audit.mjs --as-of banana` fails in the other direction: everything stale, exit 1.
- Both accept `--as-of YYYY-MM-DD`; `freshness.mjs` keeps the positional form for compatibility.
- Both exit 2 on a date that does not parse, with the reason.
- *Must not break:* `tools/selftest.mjs` F1–F6 (freshness's exit-code split).
- *Exit:* new self-tests plant an invalid date in each tool and assert exit 2. The audit's own
  command then produces the same report as the positional form.

**0.4 · Keep the document true about what 0.1–0.2 changed.**
- `docs/CONTROL-ROOM.md` §5 and §6 are corrected for the changes above, and only for them. The
  full realignment is 1.3.

### Phase 1 — the audit's P1 (v2 Session 3, after Phase 0's checkpoint — decided 27 Oct 2026, §8)

**1.1 · An editorial-audit path that is recorded, and that the Control Room reads** — audit A.
- The audit asks for a way to *launch* the check from the Control Room. That would be a route that
  executes, which `docs/CONTROL-ROOM.md` §12 forbids and `PROHIBITED_ROUTE_WORDS` enforces
  (`docs/AUDIT-2026-10-24.md` §3.3).
- The proposal reaches the audit's goals another way:
  - `node tools/evidence-audit.mjs --as-of D --record` writes one run record to a git-ignored store.
    The default still writes nothing.
  - A read-only Control Room view, **Editorial audit**, shows the latest record with the audit's
    four questions answered (what was checked, on which evidence, as of which date, at which
    commit, with which limits). It also shows the exact command that produces a new record.
- The view is kept apart from Website health, as the audit asks.
- Turning a finding into a proposal stays the editorial agent's job (`agent/proposals/editorial/`).
  No second kind of queue item is added.
- This is the one new view in Phases 0–1, and it is the audit's own P1 item. The brief's "no other
  dashboard" is read as permitting it for that reason and no other.
- *Exit:* the view renders "no recorded run", with the command, on a fresh clone. It renders a
  recorded run with all four answers. The suite asserts the view has no route that executes.

**1.2 · Metric definitions you can read** — audit D.
- The name and definition sit beside each ID.
- Source, computation, frequency, interpretation and limitations can be opened. They are already in
  the payload (`views.mjs:425`).
- One display term for the visibility value: the data value `public` is not renamed. The interface
  says "public-safe" everywhere it shows it.
- *Exit:* the suite asserts every reading row carries name and definition, and that one term is
  used throughout.

**1.3 · `docs/CONTROL-ROOM.md` matches the interface, and a check says when it stops** — audit F.
- An inventory table covers every view: data shown, where it comes from, the operations it permits,
  its limits. The status line is updated.
- §11 and §12 are kept, except where a fact in them has changed. Each such change is named.
- A new assertion fails when `ui/app.html` has a view the inventory does not name. More checking is
  green (`docs/AI-SAFE-BOUNDARIES.md` §1).
- *Exit:* the assertion exists and passes, and fails when a planted tab is added.

**1.4 · Security wording proportionate to the evidence** — audit §3; the brief's "do not claim
operational security".
- Sweep `README.md`, `docs/`, `AGENTS.md`, the published pages and the Control Room's own strings
  for wording that presents security as demonstrated in operation.
- Correct it to "controls implemented in code; verified in tests; not verified on a deployed
  installation".
- *Exit:* the session lists every occurrence it examined and what it did with each. Rewording in
  the README's limitations is the author's (`docs/AI-SAFE-BOUNDARIES.md` §3).

**1.5 · `applies.html` says what it has not yet been checked against** — only if D-2 is decided
that way. The wording is the author's.

**Phase 1 checkpoint = the audit closed.** Every P0/P1 row of `docs/AUDIT-2026-10-24.md` §1.5 is
marked done, with its commit, in that document. Only then does Phase 2 open.

### Phase 2 — the expansion (item 2.0 in v2 Session 2; items 2.1 onward after the Phase 1 checkpoint)

**2.0 · Design, in documents only** (v2 Session 2, brought forward on 25 Oct 2026; delivered as `docs/V2-DATA-DESIGN.md` and `docs/v2-design/`). Nothing is added to `data/` in this session.
It produces:
- the inclusion criterion (D-7);
- the status display grouping (D-3, from the §5 draft);
- the dependency-map model over the existing relationships (D-6);
- the review of `stratum` (D-8). `product` | `system` | `mixed` is an analytical heuristic, not a
  legal category. It is proposed with that stated on screen, or replaced, or dropped, with reasons.
- how `tools/evidence-audit.mjs` audits the map:
  - every node is an instrument record;
  - every edge carries source references with a `supports` qualifier and a locator;
  - an edge that cannot be verified is removed or shown as unverified, **never drawn as verified**.
- the schema of the exclusion register and the watchlist.

**2.1 · Exclusion register and watchlist.**
- ViDA, AVMSD, copyright, GPSR, EAA, P2B and political advertising are entered as records with
  their reason for exclusion, measured against the 2.0 criterion. None becomes a page.
- A status no source has been read for is `null`, not a guess.

**2.2–2.6 · The five priority inclusions**, one per session or two at most:
- 2.2 eIDAS 2.0 (promotion of `eidas2`);
- 2.3 Cyber Solidarity Act;
- 2.4 EHDS;
- 2.5 Interoperable Europe Act;
- 2.6 Digital Networks Act, as a regime still forming.

Every one is amber or red work (`docs/AI-SAFE-BOUNDARIES.md` §2–3):
- every fact is read from a retrieved primary source;
- `sources.json` records are made only from documents actually read;
- prose and claims go to the author for approval;
- `node tools/_footer.mjs` is re-run;
- affected locale keys are declared `superseded` or `pending_translation`.

The Digital Networks Act's status label is whatever the sources establish **on the date checked**.

**Phase 3 of the brief's list (MiCA, PSD3/PSR, DGA in transition)** opens only if the author
explicitly opens a finance chapter. It is not scheduled.

### Phase 3 — "what applies", base

- **Entry condition:** the triggers meet the claims' standard. This roadmap defines that standard
  so it can fail:
  - every rule's source reference carries `supports` and a locator;
  - every condition resolves to a provision ID;
  - `tools/evidence-audit.mjs` reads `applicability.json` and reports its rules the way it reports
    claims.
- **Measured today:** 33 rules, none meeting the first or third condition.
- The session that opens Phase 3 starts by extending the check. Adding rules waits until the
  existing 33 pass it.

### Phase 4 — automation

- The three levels (D-4 for their names):
  - *machine check* — what a validator can establish;
  - *human attestation* — 0.2 generalised;
  - *human authorship* — what no machine writes.
- The login decision (D-5). A serverless backend only if the git-based CMS is shown, in writing,
  to be insufficient.
- Phase 4 automates only what Phases 0–1 made visible as a manual process.

### Phase 5 — "what applies", advanced

- Not planned. Its scope is written only after Phase 3's checkpoint, against what Phase 3 measured.

---

## 5 · Draft for D-3: the six labels over the sixteen states

This is a vocabulary mapping, not a statement about any instrument. **Not adopted.**
- The site is English-first, so each label needs an English form.
- The Italian is the brief's wording and belongs in `i18n/` for the `it/` edition.

| Brief label | Taxonomy states it would group | Where it loses or lacks information |
|---|---|---|
| in vigore | `status:in-force`, `status:applicable` | `taxonomy.json` says in force is **not** applicable. Grouping them hides exactly the distinction the note exists for. The underlying state must stay visible beside the label. |
| in applicazione scaglionata | `status:partly-applicable` | Whether an in-force act's obligations are staggered is a fact of its provision dates, which are derived. The label should be derived from those dates too, not from the status alone. |
| proposta legislativa in corso | `status:proposal`, `status:parliament-position`, `status:council-position`, `status:trilogue` | Four procedural stages collapse into one, and `status:stalled` has no clear home. |
| accordo politico raggiunto, adozione formale attesa | `status:political-agreement` | `status:adopted` and `status:published` (adopted, not yet in force) have no label. |
| ritirato | `status:withdrawn` | — |
| in transizione / possibile abrogazione | **no state** | Would need a new taxonomy term (adding terms is permitted; renaming is not). It is also a forecast about a legislative outcome, so it needs the evidence a `forecast` claim needs. |
| *(no label)* | `status:transposition-pending`, `status:transposition-overdue`, `status:amended`, `status:repealed` | The six labels have no place for these four states, nor for `adopted` and `published` above. A grouping that drops them silently is worse than no grouping. |

---

## 6 · Session plan

| v2 Session | Work | Ends with |
|---|---|---|
| 1 (this) | This roadmap; `docs/AUDIT-2026-10-24.md` | Author's approval of the roadmap and decisions D-1…D-10, recorded in §8 |
| 2 | Phase 2.0, design documents only — brought forward on 25 Oct 2026 (§8) | Approval of the criterion, the labels, the map model, `stratum` |
| 3 | Phase 0: 0.1–0.4; **checkpoint inside the session** (report, validators and suites re-run, the author's explicit approval); then Phase 1: 1.1–1.5 | Phase 0 checkpoint, mid-session; audit closed and Phase 1 checkpoint at the end |
| 4 → | 2.1, then 2.2–2.6, one or two instruments per session | A checkpoint per session |
| later | Phases 3, 4, 5 | Planned only when reached |

No session starts on an unrecorded approval of the one before (the brief).

---

## 7 · What this roadmap does not establish

- **Any fact about any instrument.** It names instruments; it states no status, date, article or
  scope for any of them.
- **Effort or dates.** No session is given a duration, because none was measured.
- **That any remedy is right.** Phase 0–1 items are proposals against a confirmed observation.
  The session that implements one may find it wrong, and must then stop and say so.
- **That the brief's decisions are correct.** They are binding. Where one collides with a standing
  rule, §3 says so and proposes. It does not override.

---

## 8 · Approval record

Filled in only with the author's words. A row here is the checkpoint.

| Date | What was approved | Decisions taken | By |
|---|---|---|---|
| 25 Oct 2026 | Two decisions only. **The roadmap as a whole is not yet approved**, and v2 Session 2 does not start until it is. | **D-9:** the reviewer's attestation is recorded in the Control Room trail, in the decision's own entry, bound to the same fingerprint; not in the decision ledger. **D-10:** item 0.3 (the date argument of `freshness.mjs` and `evidence-audit.mjs`) is in Phase 0. Both as recommended. | The author, answering in v2 Session 1 |
| 25 Oct 2026 | **The roadmap**, with one change of sequence: item 2.0 (design, documents only) is brought forward to v2 Session 2; Phase 0 moves to v2 Session 3 and Phase 1 to v2 Session 4. Read conservatively: items 2.1–2.6, which write data, still wait for the Phase 1 checkpoint (§1, first row). | **D-3:** the six labels are a derived display grouping over the sixteen states. **D-6:** the map extends the existing relationships; it is a derived view. **The trigger** of the v2 Session 2 prompt is the existing applicability rule raised to a v2 schema, not a new entity. **D-8:** `stratum` is dropped (option (c)), and what it meant is derived from the applicability rules' actors and the edge kinds. D-1, D-2, D-4, D-5 and D-7 stay open; D-7 is proposed in `docs/V2-DATA-DESIGN.md` §5. | The author, answering four questions in v2 Session 2 ("Approvo e anticipo 2.0"; "Sì, tutte e tre"; "(c) eliminare, derivare"), then "Vai" |
| 27 Oct 2026 | — | **D-1:** the brief is committed verbatim as `docs/BRIEF-v2.md` and pointed to once from `AGENTS.md`. | The author, in v2 Session 2 ("si") |
| 27 Oct 2026 | **The inclusion criterion** (item 2.0) | **D-7:** the criterion of `docs/V2-DATA-DESIGN.md` §5 is approved. **D-2:** `applies.html` stays, with a notice that its rules are not yet verified to the claims' standard, added in Phase 1 (item 1.5) in words the author approves. And the questions the design raised: **P2B** joins the watchlist, watching COM(2025) 837; the six states outside the brief's labels carry **no label**; the finance-chapter condition **applies to the DGA** too; the eight findings of `docs/V2-DATA-DESIGN.md` §7 are corrected **in Phase 3**; the reasons in the register and watchlist stay **drafts**, reviewed by the author entry by entry before item 2.1. D-4 and D-5 stay open. | The author, answering six questions in v2 Session 2 |
| 27 Oct 2026 | **The scope of v2 Session 3** | Phases 0 and 1 in one session, with Phase 0's checkpoint **inside** it: the session reports, re-runs the validators and suites, and stops until the author approves before starting Phase 1. Item **1.1** as planned (`--record` and a read-only Editorial audit view). Item **1.5**: the session drafts the notice for `applies.html` and waits for the author's approval of its wording. Item **0.1**: `as_of`, `recorded_at` and the commit analysed, shown apart; no `auto_checked_at` (a field nobody writes, and preparation for Phase 4's automation); `verified_at` is not a new field — where the date an evidence record was last verified is meant, it is the existing `last_verified`. | The author, answering four questions in v2 Session 2 |
| 27 Oct 2026 | **The Phase 0 checkpoint** (items 0.1–0.4, v2 Session 3; the report is in `docs/HANDOVER.md`, commits `2606f3e`, `7a2346e`, `cd3cd22`, `31db1a4`) | Phase 0 closed; Phase 1 starts in the same session. No change was asked to the five interpretations the report put to the author: an attestation names at least one section, not all five; an attestation sent with a request for changes is refused; a visited tab shows its held snapshot until Refresh; `evidence-audit.mjs` refuses every unrecognised argument with exit 2; the first tab is labelled "Agent activity". Nor to the edit of `agent/policy/verify/attacks.mjs` (AZ-01, AZ-03, AZ-07) named there. | The author, in v2 Session 3 ("Approvo il check point della Fase 0 e voglio che passi alla fase 1") |
| 27 Oct 2026 | **The wording of the `applies.html` notice** (item 1.5, D-2) | Draft A, inserted verbatim as the first paragraph of the page's "Read this before you read a result" box (`2967f06`). The key `applies.notice` is declared `pending_translation` for it, fr and es. | The author, in v2 Session 3, choosing "Draft A (Recommended)" |
