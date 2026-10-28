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
| 27 Oct 2026 | **The wording of the `applies.html` notice** (item 1.5, D-2) | Draft A, inserted verbatim as the first paragraph of the page's "Read this before you read a result" box (`d12b6ce`). The key `applies.notice` is declared `pending_translation` for it, fr and es. | The author, in v2 Session 3, choosing "Draft A (Recommended)" |
| 27 Oct 2026 | **The Phase 1 checkpoint = the audit of 24 Oct 2026 closed** (items 1.1–1.5, v2 Session 3; report and checklist in `docs/HANDOVER.md`; one row per P0/P1 item with its commit in `docs/AUDIT-2026-10-24.md` §1.5) | Phase 1 closed. Phase 2 does not open yet: item 2.1 also waits for the author's entry-by-entry review of the reasons in `docs/v2-design/register-watchlist.proposed.json` (27 Oct 2026 row above). Still open: the proposed ninth README limitation and the two findings of `docs/AUDIT-2026-10-24.md` §5 (rows 25–26). Pull request to `main` opened on the author's instruction. | The author, in v2 Session 3 ("approvo e apri pull request") |
| 27 Oct 2026 | **The scope of v2 Session 4** | (a) Session 4 opens with the author's **entry-by-entry review** of `docs/v2-design/register-watchlist.proposed.json`: 10 records (ViDA, AVMSD, copyright, GPSR, EAA, political advertising excluded; P2B, MiCA, PSD3, PSR watched), with their relationships, sources and events. It writes to `data/` only what the author approves (item **2.1**), then stops at a checkpoint. Item 2.2 is not in Session 4. (b) The ninth README limitation proposed in `docs/AUDIT-2026-10-24.md` §5 is **accepted as written**, to be added verbatim. (c) The stale publication model is corrected **in Session 4, as a check**: `publicSurface()`, PP-08 and `agent/health/security.mjs` modelled on `tools/pages-artifact.mjs` (one home); every verdict that moves reported before and after; no check weakened; the session stops and asks before a verdict changes. (d) The port-0 Origin defect of the Control Room is fixed in Session 4, without loosening the Origin or CSRF check. Order: (a) first, then (b)–(d). | The author, answering four questions at the end of v2 Session 3 ("Review, then 2.1"; "Accept as written"; "In Session 4, as a check"; "Yes, small fix") |
| 27 Oct 2026 | **Two questions on item 2.1, asked before anything is written to `data/`** (v2 Session 4, A.0) | (1) **The 17 existing relationships are not migrated in Session 4**, and the flip of `edge-v1-sources` and `edge-analytical-no-claim` to ERROR, which `docs/V2-DATA-DESIGN.md` §4.3 placed "at the end of item 2.1", is **deferred with it**. Measured that day: 10 of the 17 cite only tier-1 or tier-2 sources and need a locator; 4 rest only on `src-brief-original` and have no source to re-read; 3 analytical edges have no claim. The map view stays unpublished (§4.3). (2) **The public views read one derived filter**: `coverage()` in `js/routes.js`, from `scope_class` and `scope_decision`. The static list on `instruments.html`, search and the calendar leave out excluded and watched records; `instrument.html?id=` shows those records a short "not covered by this site" notice with the reason and the external referral (its wording drafted for the author), instead of the full record; the relationships stay visible, and `js/interactions.js` reads v2 reference objects. | The author, answering two questions in v2 Session 4 ("Rinviare, flip rinviato (Recommended)"; "Sì, filtro + avviso (Recommended)") |
| 27 Oct 2026 | **Item 2.1, entry 1 of 10: `vida`** (ViDA, Directive (EU) 2025/516), excluded | The draft reason approved as written. Three corrections from the re-reading of 27 Oct 2026, approved with it: `status_note` states Art. 6(4)–(5) as read; `scope_decision.sources` adds Art. 3 point (1) (inserting Art. 28a), the source of "platforms as deemed suppliers"; the record's dates are those of the re-reading. | The author, in v2 Session 4 ("Approvo, con le correzioni") |
| 27 Oct 2026 | **Item 2.1, entry 2 of 10: `avmsd`** (AVMSD, Directive 2010/13/EU), excluded, with `rel-dsa-avmsd-defers` | The draft reason approved as written. **A-4 decided:** "AVMSD" is Directive 2010/13/EU as amended, notably by Directive (EU) 2018/1808. Corrections from the re-reading of 27 Oct 2026, approved with it: the reason's "reaches video-sharing platforms" rests on Directive (EU) 2018/1808 Art. 1 point (23) (Chapter IXa, Arts 28a–28b), read that day and added to `scope_decision.sources`; `src-eurlex-avmsd-2018`'s note says what was read; the dates are those of the re-reading. | The author, in v2 Session 4 ("Approvo, A-4 confermata") |
| 27 Oct 2026 | **Item 2.1, entry 3 of 10: `copyright-dsm`** (Directive (EU) 2019/790), excluded, with `rel-dsa-copyright-dsm-defers` | **A-2 decided:** "copyright" is Directive (EU) 2019/790. The reason approved with one change: "the liability of content-sharing platforms (Art. 17) beside the DSA's". Art. 17, read on 27 Oct 2026, is added to `scope_decision.sources`; the dates are those of the re-reading. | The author, in v2 Session 4 ("Approvo, reason corretta"; then "Tieni la bozza + Art. 17") |
| 27 Oct 2026 | **Item 2.1, entry 4 of 10: `gpsr`** (GPSR, Regulation (EU) 2023/988), excluded, with `rel-gpsr-dsa-defers` | The draft reason approved as written. Corrections from the re-reading of 27 Oct 2026, approved with it: `src-eurlex-gpsr`'s note lists every DSA article GPSR Art. 22 refers to (9(2), 11, 12, 16, 23, 30(1), 31(1)–(3)); the dates are those of the re-reading. | The author, in v2 Session 4 ("Approvo, con le correzioni") |
| 27 Oct 2026 | **Item 2.1, entry 5 of 10: `eaa`** (Directive (EU) 2019/882), excluded | The draft reason approved as written. Corrections from the re-reading of 27 Oct 2026, approved with it: `full_name` is the Directive's exact title, without "(European Accessibility Act)", which the title does not carry; the dates are those of the re-reading. | The author, in v2 Session 4 ("Approvo, con le correzioni") |
| 27 Oct 2026 | **Item 2.1, entry 6 of 10: `ttpa`** (Political Advertising Regulation, Regulation (EU) 2024/900), excluded, with `rel-ttpa-dsa-defers` | The draft reason approved as written; the dates are those of the re-reading of 27 Oct 2026. No further relationship is added (Art. 2(3)(f) and (h) also name the AVMSD and P2B; not proposed, not added). | The author, in v2 Session 4 ("Approvo") |
| 27 Oct 2026 | **Item 2.1, entry 7 of 10: `p2b`** (P2B Regulation, Regulation (EU) 2019/1150), watched, with `rel-dsa-p2b-defers` and `rel-data-omnibus-p2b-repeals` | The draft reason approved as written; the dates are those of the re-reading of 27 Oct 2026. Procedure 2025/0360(COD), read that day: "Awaiting committee decision", so the watch has not fired. | The author, in v2 Session 4 ("Approvo") |
| 27 Oct 2026 | **Item 2.1, entry 8 of 10: `mica`** (MiCA, Regulation (EU) 2023/1114), watched (finance chapter), with `rel-mica-dora-enables` | The draft reason approved as written; the dates are those of the re-reading of 27 Oct 2026. The finance chapter is not opened. | The author, in v2 Session 4 ("Approvo") |
| 27 Oct 2026 | **Item 2.1, entry 9 of 10: `psd3`** (PSD3, proposal COM(2023) 366), watched (finance chapter) | The draft reason approved as written; the status and its basis re-read on 27 Oct 2026 on procedure file 2023/0209(COD), unchanged since 25 Oct 2026; the dates are those of the re-reading. | The author, in v2 Session 4 ("Approvo") |
| 27 Oct 2026 | **Item 2.1, entry 10 of 10: `psr`** (PSR, proposal COM(2023) 367), watched (finance chapter) | The reason approved without "including fraud prevention", which no source read on 25 or 27 Oct 2026 establishes: "The PSR would set directly applicable rules on payment services: payments law, outside the brief's analysis today. Watched with PSD3, for the same two reasons." The status re-read on procedure file 2023/0210(COD), unchanged; the dates are those of the re-reading. | The author, in v2 Session 4 ("Approvo, togli la frase (Recommended)") |
| 27 Oct 2026 | **Item 2.1: the `instrument_updates` and `source_updates`** of `docs/v2-design/register-watchlist.proposed.json` | **`dga`** receives its `scope_decision` (watched, finance chapter, Q-6), the draft reason as written, with one correction from the re-reading of 27 Oct 2026: DGA Art. 1(1) added to its sources, for `crit:object-data`; with `rel-data-omnibus-dga-repeals` and `rel-data-omnibus-data-act-amends`. **`data-omnibus`** `proposes_to_amend` (−dga, +cer) is **not applied**: it is findings F-2 and F-3 of `docs/V2-DATA-DESIGN.md` §7, corrected in Phase 3 (Q-5); it stays in the proposed file. **The four source updates** (`src-eurlex-data-omnibus-837`, `src-eurlex-dsa`, `src-eurlex-dora`, `src-eurlex-ttpa`) approved, with `accessed` the date of the re-reading, 27 Oct 2026. | The author, in v2 Session 4 ("Approvo, con la correzione"; "Resta fuori, Fase 3 (Recommended)"; "Approvo") |
| 27 Oct 2026 | **Item 2.1: `psd3` and `psr` meet M-04**, and the wording of the "not covered" notice | Rule M-04 asks a scope decision for at least one direct reference with a structural locator; both records cited only the proposals' titles. **Art. 1(1) of COM(2023) 366 and of COM(2023) 367**, read on 27 Oct 2026 in the texts retrieved from Cellar, is added to each `scope_decision.sources`, and the two source notes say so; the reasons are unchanged. **The notice** `instrument.html?id=` shows an excluded or watched record is draft A: the name, "Not covered by this site." with the register or the watchlist (and, for a watched record, the event that reopens the decision), "Why." with the reason, "Read it at the source:" with the external referral, and the dates of the decision and of the facts it rests on. | The author, in v2 Session 4 ("Aggiungi Art. 1(1) (Recommended)"; "Bozza A, completa (Recommended)") |
| 27 Oct 2026 | **Item 2.1: M-04's date test is a WARNING** | `docs/V2-DATA-DESIGN.md` §1.5 lists "`last_verified` ≤ as-of" under M-04, an ERROR. `tools/evidence-audit.mjs` exits 1 only on a defect true on every date (SESSION 30), and an audit as of a date before a record's verification would fail on the date asked, not on the tree. The test is reported as `VERIFIED_AFTER_AS_OF`, a WARNING; the rest of M-04 stays ERROR. | The author, in v2 Session 4 ("WARNING, non ERROR (Recommended)") |
| 27 Oct 2026 | **The Part A checkpoint of v2 Session 4 = item 2.1** (report in `docs/HANDOVER.md`; commit `d25a2a8`) | Item 2.1 closed; Part B (the scope of Session 4, (b)–(d)) starts in the same session. On the three findings the report put to the author: **R-01** cannot fire for P2B as designed (its trigger would be a milestone of `data-omnibus`) — deferred to Phase 3, with the findings of `docs/V2-DATA-DESIGN.md` §7; **the internal references** shown to a reader are removed — "(docs/ROADMAP-v2.md §4, 'Phase 3 of the brief's list')" from MiCA's `watch_for`, "(Q-1)" from P2B's reason, "(Q-6)" from the DGA's reason and `watch_for`, nothing else changed; **TTPA Art. 2(3)(f) and (h)** (AVMSD, P2B): no relationship added now. | The author, in v2 Session 4 ("Approvo, vai alla Parte B (Recommended)"; "Rinvia alla Fase 3 (Recommended)"; "Toglili (Recommended)"; "No, non ora (Recommended)") |
| 27 Oct 2026 | **Part B, item (c): the publication model corrected as a check** (v2 Session 4, B.2) | `tools/pages-artifact.mjs refusal()` is the one home of what the website publishes, and `publicSurface()` reads it; the repository, public on github.com, is the second surface, and the secret scan reads all of it. Verdicts that move, approved: health `control_plane.control_room_assets_published` 1 → 0; `agent/implement` boundary 0 errors / 13 → 20 warnings (control-plane exposure 2 → 0; credential shapes in test fixtures 11 → 20, the scan now also reading `.control-room/`); the adversarial gate unchanged, PP-08 partial/high with its reason rewritten. Four tests that asserted the Jekyll model rewritten. **PP-09**'s stale "never fetched" text is left as an open finding (only its Jekyll phrase changed). | The author, in v2 Session 4 ("Approvo, applica (Recommended)"; "Lascialo, rilievo aperto (Recommended)") |
| 27 Oct 2026 | **The Part B checkpoint of v2 Session 4** (B.1 `c886fdb`, B.2 `1d0d897`, B.3 `dc3a030`; report and verification checklist in `docs/HANDOVER.md`) | Part B closed, and with it v2 Session 4. Still open: PP-09's stale text; the OIDC redirect URI and the unbracketed `::1` origin (found in B.3, not fixed); R-01's P2B gap and the eight findings of `docs/V2-DATA-DESIGN.md` §7 (Phase 3); the migration of the 17 relationships and the `edge-v1-sources` flip. Pull request to `main` opened on the author's instruction. | The author, in v2 Session 4 ("Approvo (Recommended)"; "Sì, apri la PR (Recommended)") |
| 27 Oct 2026 | **The scope of v2 Session 5** (prompt: `docs/prompts/v2-session-5.md`) | (a) **Item 2.2 only**: the promotion of `eidas2` to a covered instrument, then a checkpoint; item 2.3 is not in Session 5. (b) After that checkpoint, three items left open by Session 4: **PP-09**'s stale text; the **OIDC redirect URI and the unbracketed `::1` origin**; the **migration of the 10 readable relationships** to the v2 shape, the other 7 staying in the backlog and the `edge-v1-sources` flip staying deferred. (c) The prompt is kept in `docs/prompts/`, citing this row rather than repeating it; no pull request unless the author asks. | The author, answering three questions at the end of v2 Session 4 ("Solo 2.2 eIDAS 2.0 (Recommended)"; "PP-09 testo superato, OIDC redirectUri e ::1, Migrazione 17 relazioni"; "§8 + file in docs/ (Recommended)") |
| 27 Oct 2026 | **Four questions on item 2.2, asked before anything is written to `data/`** (v2 Session 5, A.0) | Measured that day: `eidas2` fails the page gate's `explanation` and `context` criteria only. (1) **`context`**: one relationship, `eidas2 → gdpr`, `rel-kind:defers-to`, on Regulation (EU) 2024/1183 Art. 1 point (2)(b), inserting Art. 2(4) into Regulation (EU) No 910/2014 ("without prejudice to Regulation (EU) 2016/679"), read on 27 Oct 2026 in the text retrieved from Cellar. The DSA, DMA and NIS2 edges read the same day are not added; `brief_part` stays `null` (the brief names eIDAS2 only in Part I's box of what the six regimes leave out). (2) **`dna.objective`**: draft A, "Secure electronic identification and trust services across the internal market, extended by the European Digital Identity Wallets each Member State must provide and recognise." (3) **The other fields**: the factual ones are read now and proposed in A.1 (`implementation_model`, `obligation_anchor`, `regulated_actor` from the verified provisions, the entry-into-force event, `sanction_ceiling` with null amounts and a note on Art. 16(2)); `risk_logic`, `enforcement_mechanism`, `protected_party` and `territorial_scope` stay `null`, declared. (4) **Two texts made stale by the promotion** (`ap-eidas2-01`'s "maps the framework as adjacent" sentence; the `eidas2` tag on `clm-also-in-the-rulebook`): corrections proposed in A.1, entering only if approved. | The author, answering four questions in v2 Session 5 ("eidas2 → gdpr defers-to (Recommended)"; "Bozza A (Recommended)"; "Fattuali ora, analitici vuoti (Recommended)"; "Proponi correzioni in A.1 (Recommended)") |
| 27 Oct 2026 | **Item 2.2: the promotion of `eidas2`** (v2 Session 5, A.1), as proposed in one block | `scope:core`; `scope_decision` included on `crit:object-infrastructure` + `crit:horizontal`, the draft reason as written, `approved_on` 2026-10-27; `status_basis` Art. 2 with the Publications Office metadata (in force, entry into force 2024-05-20); the entry-into-force event `tl-eidas2-2024-05-20-entry-into-force`; `dna.objective` draft A, `implementation_model`, `obligation_anchor`, `regulated_actor`, `sanction_ceiling` with null amounts and the Art. 16(2) note, the four analytical fields `null`; `rel-eidas2-gdpr-defers`; the `ap-eidas2-01` rationale sentence replaced by "The rule covers the wallet obligation only."; `eidas2` removed from `clm-also-in-the-rulebook`; the re-reading of 27 Oct 2026 recorded on the two claims, the two deadline events, the rule and the three sources; nothing in `tools/seo.mjs` or `KNOWN_AS`. **And** a new taxonomy term `actor:trust-service-provider`, read on Art. 2(1) of Regulation (EU) No 910/2014 as replaced (Art. 1 point (2)(a)), added to `regulated_actor`. | The author, in v2 Session 5 ("Approvo tutto (Recommended)"; "Aggiungi actor:trust-service-provider (Recommended)") |
| 27 Oct 2026 | **The Part A checkpoint of v2 Session 5 = item 2.2** (`eidas2` covered, with its page; report in `docs/HANDOVER.md`; commits `061c226`, `5a951bd`) | Item 2.2 closed; Part B (PP-09's text, the OIDC redirect URI and the `::1` origin, the migration of the 10 readable relationships) starts in the same session. The internal references shown to a reader that the report found (the `clm-eidas2-*` ids in `eidas2.status_note`; "docs/V2-DATA-DESIGN.md §1.4" in the `defers-to` and `enables` notes the interactions box prints) stay an **open finding**, unchanged. | The author, in v2 Session 5 ("Approvo, vai alla Parte B (Recommended)"; "Rilievo aperto (Recommended)") |
| 27 Oct 2026 | **Part B.3: the migration of the readable relationships to the v2 shape** (v2 Session 5), on the list put to the author with a locator for each, every source re-read that day | **Migrated (8):** `rel-ai-act-gdpr-art-22`, `rel-ai-act-pld`, `rel-nis2-dora`, `rel-dsa-ecommerce`, `rel-nis2-nis1` as proposed; `rel-dma-tfeu-102` and `rel-dma-gdpr-consent` with the DMA articles read that day added as direct references (Art. 1(6); Art. 5(2), last subparagraph), the Commission pages kept as partial; `rel-ai-omnibus-ai-act` on Regulation (EU) 2026/1744 alone, `src-ec-ai-omnibus-in-force` (403 that day, not re-read) leaving the edge and staying on its claim. **Stay v1 (2):** `rel-dsa-gdpr-transparency-minimisation` — EDPB Guidelines 3/2025 v2 ¶6 exclude Art. 40 DSA researcher access from their scope and treat advertising transparency under Art. 26, not Art. 39, so the source no longer carries the summary (the summary is the author's to revise); `rel-data-omnibus-gdpr` — its summary states "stalled in Council", which COM(2025) 837 cannot carry and which was not re-read. The 4 brief-only and 3 claimless analytical edges stay in the backlog; the `edge-v1-sources` flip stays deferred. | The author, in v2 Session 5 ("Approvo (Recommended)"; "Sì, entrambi (Recommended)"; "Migra col solo 2026/1744 (Recommended)"; "Resta v1 (Recommended)") |
| 27 Oct 2026 | **The Part B checkpoint of v2 Session 5** (B.1 `bd2c318`, B.2 `dd3c1fe`, B.3 `f90212f`; report and verification checklist in `docs/HANDOVER.md`, `7c26689`) | Part B closed, and with it v2 Session 5. Still open: `rel-dsa-gdpr-transparency-minimisation` (its summary no longer matches EDPB Guidelines 3/2025 v2) and `rel-data-omnibus-gdpr` (v1); the 4 brief-only and 3 claimless analytical edges and the `edge-v1-sources` flip; the internal references shown to a reader; the article attribution in `src-ec-apple-meta-dma-2025`'s note; `src-ec-ai-omnibus-in-force` not re-read (403); the `::1` test not run in this container; R-01's P2B gap and the eight findings of `docs/V2-DATA-DESIGN.md` §7 (Phase 3). Pull request to `main` opened on the author's instruction. | The author, in v2 Session 5 ("Approvo (Recommended)"; "Sì, apri la PR (Recommended)") |
| 27 Oct 2026 | **The scope of v2 Session 6** (prompt: `docs/prompts/v2-session-6.md`, the author's roadmap after v2 Session 5, covering sessions 6–16) | **Item 2.3 only**: evaluate the Cyber Solidarity Act and, if the criterion allows, add it as a covered instrument, then a checkpoint; item 2.4 is not in Session 6. The rest of the roadmap (sessions 7–16) is a plan, not an authorisation: each session starts only on the author's approval of the one before. The prompt is kept in `docs/prompts/`, citing this row. | The author, pasting the roadmap ("Session 6 — item 2.3: Cyber Solidarity Act … Non avanzare all'item 2.4 nella stessa sessione"), then answering "§8 + docs/prompts/ (Recommended)" |
| 27 Oct 2026 | **Item 2.3: the inclusion of `csa`** (Cyber Solidarity Act, Regulation (EU) 2025/38), asked in one block before anything was written to `data/`; every fact read that day in the Official Journal text retrieved from Cellar (CELEX 32025R0038) and in the Publications Office's SPARQL metadata | A new record `csa`, `scope:core`, `brief_part` `null` (the brief does not name it). **Status** `status:in-force` (Art. 26; metadata: in force, entry into force 2025-02-04), not `status:applicable`; `status_basis` Art. 26 + metadata; one event, `tl-csa-2025-02-04-entry-into-force` (the Art. 25(1) evaluation date is not added). **`scope_decision`** included on `crit:object-security` + `crit:horizontal`, the reason as proposed (Art. 1(1); Art. 1(3)(b); Art. 2, points (5)–(6)), without the design draft's "completes the cyber layer the brief analyses"; `approved_on` 2026-10-27. **`dna.objective`** draft A. **`dna`**: `regulated_actor` `actor:member-state` + `actor:public-authority`; provisions `csa:art-3`, `csa:art-14` (Commission), `csa:art-21` (ENISA); `obligation_anchor` empty; `sanction_ceiling` null with a note that the text sets no fines or penalties; `implementation_model` "Directly applicable"; `risk_logic`, `enforcement_mechanism`, `protected_party`, `territorial_scope` `null`. **`rel-nis2-csa-enables`**, v2, on CSA Art. 2, points (3)–(7), (9), (10), (12) and (16), knowing it is also what meets the page gate's `context` criterion. A new source `src-eurlex-csa`. | The author, answering seven questions in v2 Session 6 ("status:in-force (Recommended)"; "Bozza A (Recommended)"; "Sì, aggiungila (Recommended)"; "Approvo così (Recommended)"; "Approvo (Recommended)"; "Solo entrata in vigore (Recommended)"; "§8 + docs/prompts/ (Recommended)") |
| 27 Oct 2026 | **The checkpoint of v2 Session 6 = item 2.3** (`csa` covered, with its page; commit `f75c0f4`; report and verification checklist in `docs/HANDOVER.md`, `8d2d7d4`) | Item 2.3 closed, and with it v2 Session 6. The three display findings of the report (the `enables` note's internal reference now also on the CSA and NIS2 pages; the sanction ceiling worded two ways; `obligation_on_institution` not displayed) stay open, unchanged; the first is Session 10's item 10.2. Still open from Session 5: as listed in the report. Pull request to `main` opened on the author's instruction. Item 2.4 starts only in a new session. | The author, in v2 Session 6, asked whether the checkpoint is approved and whether to push and open a pull request: "Si" |
| 28 Oct 2026 | **The scope of v2 Session 7** (prompt: `docs/prompts/v2-session-7.md`) | **Item 2.4 only**: evaluate the European Health Data Space (Regulation (EU) 2025/327) and, if the criterion allows, add it as a covered instrument, then a checkpoint; item 2.5 is not in Session 7. The branch `claude/v2-session-7-prompt`, which holds the prompt and its branch-register entry, is merged into the session's branch. | The author, answering one question at the start of v2 Session 7 ("Solo 2.4, unisci il prompt (Recommended)") |
| 28 Oct 2026 | **Item 2.4: the inclusion of `ehds`** (European Health Data Space, Regulation (EU) 2025/327), asked one question at a time before anything was written to `data/`; every fact read that day in the Official Journal text retrieved from Cellar (CELEX 32025R0327) and in the Publications Office's SPARQL metadata | A new record `ehds`, `scope:core`, `brief_part` `null` (the brief names it only in Part I's box). **Criterion**: included on `crit:object-data` + `crit:sector-instance` (Art. 1(1); Art. 1(2)(a)); `crit:horizontal` does not hold (health and care sectors, Art. 2(2)(t)); the sector instance is shown by the edge to the GDPR; the reason as proposed; `approved_on` 2026-10-28. **Edges**: `rel-gdpr-ehds-enables` (Art. 2(1)(a); Art. 22; Art. 65), knowing it is what shows the sector instance and meets the page gate's `context` criterion; `rel-ehds-cra-amends` (Art. 104, points (1)–(3)), with `ehds.amends` = `cra` and `cra.amended_by` = `ehds`; `rel-ehds-data-act-defers` (Art. 1(3)); `rel-ehds-ai-act-defers` (Art. 1(5)); `rel-dga-ehds-enables` (Art. 2(1)(c)). **Not added**: `eidas2 → ehds` (the EHDS refers to Regulation (EU) No 910/2014; Art. 6 of it, which Arts 12 and 16(1) rely on, is not amended by Regulation (EU) 2024/1183) — an open finding; no node for Regulation (EU) No 910/2014; `ehds → eprivacy`. **Status** `status:in-force`, `status_as_of` 2026-10-28, `status_basis` Art. 105 + metadata, the status note as proposed. **Events**: entry into force (2025-03-25), the general date of application (2027-03-26), and the tranches of 2029-03-26 (`ehds:art-3`, `ehds:art-26`, `ehds:art-60`, `ehds:art-64`) and 2031-03-26 (`ehds:art-3`, `ehds:art-26`); not 2035 (Art. 75(5) only), nor the 2027 deadlines, nor the evaluations. **`dna.objective`** draft B. **`dna`**: four provisions (Arts 3, 26, 60, 64); `regulated_actor` `actor:member-state`, `actor:manufacturer`, and two new terms `actor:health-data-holder` (Art. 2(2)(t)) and `actor:health-data-user` (Art. 2(2)(u)); `obligation_anchor` Arts 3, 26, 60; `implementation_model` "Directly applicable"; `sanction_ceiling` 4 % / EUR 20 000 000 on `ehds:art-64`, with the note as proposed; `legal_basis` `tfeu:art-114`; `risk_logic`, `enforcement_mechanism`, `protected_party`, `territorial_scope` `null` or empty. **`clm-ehds-dates`**: statement unchanged; `ehds` added to `instruments`; the sentence "The instrument is not modelled in data/instruments.json." replaced; `last_verified` 2026-10-28. **Sources**: `src-eurlex-ehds` re-read (`accessed` and note); `src-ec-ehds-page` not used; no new source. | The author, answering eleven questions in v2 Session 7 ("object-data + sector-instance (Recommended)"; "Aggiungi come proposto (Recommended)"; "Aggiungi + compila array (Recommended)"; "Non aggiungere ora (Recommended)"; "ehds → data-act defers-to, ehds → ai-act defers-to, dga → ehds enables"; "status:in-force, come proposto (Recommended)"; "E1–E4 (Recommended)"; "Bozza B (Recommended)"; "Approvo tutto (Recommended)"; "Approvo (a)–(c) (Recommended)"; "Approvo (Recommended)") |
| 28 Oct 2026 | **The checkpoint of v2 Session 7 = item 2.4** (`ehds` covered, with its page; commits `fb015c6`, `601fe44`; report and verification checklist in `docs/HANDOVER.md`, `6c37f19`) | Item 2.4 closed, and with it v2 Session 7. Approved with it: the M-04 rule for `crit:sector-instance`, W1 audited as of the tree's newest decision, and the `agent/depth` discriminator. The findings of the report stay open, unchanged: the tranche dates shown without their categories in the provisions table; Regulation (EU) No 910/2014 not modelled (no `eidas2 → ehds` edge); the internal reference in the `enables` and `defers-to` notes, now on more pages (Session 10's item 10.2); the DGA notice showing no relationships. Still open from Sessions 5 and 6: as listed in the report. Pull request to `main` opened on the author's instruction. Item 2.5 starts only in a new session. | The author, in v2 Session 7 ("Approvo e apri la PR (Recommended)") |
| 28 Oct 2026 | **The scope of v2 Session 8** (prompt: `docs/prompts/v2-session-8.md`, merged to `main` as #27) | **Item 2.5 only**: evaluate the Interoperable Europe Act (Regulation (EU) 2024/903) and, if the criterion allows, add it as a covered instrument with its page, then a checkpoint; item 2.6 is not in Session 8. The session works on the branch the environment assigned, `claude/new-session-o9uopd`, cut from `main` at `3cc0473`; no prompt branch to merge. | The author, answering one question at the start of v2 Session 8 ("Solo 2.5 (Recommended)") |
| 28 Oct 2026 | **Item 2.5: the inclusion of `iea`** (Interoperable Europe Act, Regulation (EU) 2024/903), asked one question at a time before anything was written to `data/`; every fact read that day in the Official Journal text retrieved from Cellar (CELEX 32024R0903; the enacting terms in full, the Annex and recitals 1–13, 41–43 and 56) and in the Publications Office's SPARQL metadata | A new record `iea`, `scope:core`, `brief_part` `null` (the brief does not name it). **Criterion**: included on `crit:object-infrastructure` + `crit:horizontal` (Art. 1(1); Art. 1(2) with Art. 2, points (2), (5) and (6)), the reason as proposed, `approved_on` 2026-10-28; not `crit:sector-instance`. **Edges**: `rel-iea-gdpr-defers` (Art. 11(4); Art. 12(6)(e)–(f)) and `rel-nis2-iea-enables` (Art. 2(3)), each enough on its own for the page gate's `context` criterion. **Not added**: `dga → iea` (Art. 2(7); Art. 15(5)(s)); `iea → eaa` (Art. 5(1)). The enacting terms refer to no eIDAS Regulation, to neither the Data Act nor the AI Act, and to the ePrivacy Directive only in recital 11. **Status** `status:applicable`, `status_as_of` 2026-10-28, `status_basis` Art. 23(1)–(2) + metadata, the status note as proposed; the page shows "Applicable". **Events**: entry into force (2024-04-11), the general date of application (2024-07-12) and the tranche of 2025-01-12 (`iea:art-3`, `iea:art-17`; its note says Art. 3(5) is outside it); not the institutions' deadlines (Art. 3(5); Art. 12(10)) nor the report of 2028-01-12 (Art. 20(5)). **`dna.objective`** draft A. **`dna`**: four provisions (Arts 3, 4, 17, 18); `regulated_actor` `actor:member-state` and two new terms `actor:union-entity` (Art. 2(5)) and `actor:public-sector-body` (Art. 2(6)); `obligation_anchor` Arts 3 and 4; `implementation_model` "Directly applicable"; `sanction_ceiling` null, with the note as proposed (no Article sets fines or penalties; recital 41 on the EDPS); `legal_basis` empty (Art. 172 TFEU has no record); `risk_logic`, `enforcement_mechanism`, `protected_party`, `territorial_scope` `null` or empty; no `obligation_on_institution`. **Source** `src-eurlex-iea`, new, as proposed; no corrigendum is recorded; no Commission page; no claim. **Name**: `short_name` "Interoperable Europe Act", alias `interoperable-europe-act`; nothing in `KNOWN_AS` or `tools/seo.mjs`. | The author, answering eight questions in v2 Session 8 ("object-infra + horizontal (Recommended)"; "A iea→gdpr defers-to (Recommended), B nis2→iea enables (Recommended)"; "status:applicable (Recommended)"; "E1–E3 (Recommended)"; "Bozza A (Recommended)"; "Approvo tutto (Recommended)"; "Approvo (Recommended)"; "Short name pieno (Recommended)") |
| 28 Oct 2026 | **The checkpoint of v2 Session 8 = item 2.5** (`iea` covered, with its page; commit `0047586`; report and verification checklist in `docs/HANDOVER.md`, `c81a478`) | Item 2.5 closed, and with it v2 Session 8. Approved with it: W15. The findings of the report stay open, unchanged: the sanction ceiling worded two ways, now reading against itself on the IEA page (Session 6's finding); Art. 3's tranche date shown without the Art. 3(5) qualifier (Session 7's finding on tranches); the internal reference in the `defers-to` and `enables` notes, now also on the IEA, GDPR and NIS2 pages (Session 10's item 10.2); the status badge touching "as of" on every instrument page. Still open from Sessions 5–7: as listed in the report. Pull request to `main` opened on the author's instruction. Item 2.6 starts only in a new session. | The author, in v2 Session 8 ("Approvo e apri la PR (Recommended)") |
| 28 Oct 2026 | **v2 Session 8, after the item 2.5 checkpoint: open findings the session can resolve** (the Session 8 prompt had excluded them; this row widens the scope on the author's request, "Vorrei che mi chiedessi le questioni aperte risolvibili in questa sessione") | Taken up, each to be proposed to the author before anything is written: **display** — (a) the sanction ceiling worded two ways; (b) tranche dates without their qualifier in the provisions table; (c) `obligation_on_institution` not displayed; (d) the "not covered" notice showing no relationships; (e) the status badge touching "as of"; **naming** — (f) the EHDS's common name in `KNOWN_AS`; **sources, re-read that day** — (h) `src-ec-apple-meta-dma-2025`'s note; (i) `rel-dsa-gdpr-transparency-minimisation`'s summary against EDPB Guidelines 3/2025 v2; (j) "stalled in Council" in `rel-data-omnibus-gdpr`; (k) a node for Regulation (EU) No 910/2014 and the eIDAS edge to the EHDS. **Not taken up**: (g) the internal references (Session 10's item 10.2); and, not resolvable here, `src-ec-ai-omnibus-in-force` (403), the `::1` test (no IPv6 loopback), the 4 + 3 v1 edges and the `edge-v1-sources` flip, R-01 and the findings of `docs/V2-DATA-DESIGN.md` §7 (Phase 3). The work goes on a separate branch, `claude/v2-session-8-findings`, cut from `claude/new-session-o9uopd` (pull request #28 stays as approved), with its own pull request when the author says so. | The author, answering four questions in v2 Session 8 ("(a) Sanzioni in due modi, (b) Qualifica delle tranche, (c) Obblighi delle istituzioni, (d) Archi della DGA"; "(e) Spazio badge / as of, (f) EHDS in KNOWN_AS"; "(h) Nota Apple/Meta DMA, (i) Summary DSA–GDPR (EDPB), (j) «Stalled in Council», (k) Nodo 910/2014 (eIDAS)"; "PR separata (Recommended)") |
| 28 Oct 2026 | **The display findings (a)–(e)**, each proposed before any code was written | (a) **the sanction ceiling** has one derivation in the renderer for the page head, "In short" and the comparison table: an amount when one is recorded; "no amount recorded" with the record's note when the amounts are null and a note exists; "not established" otherwise. The renderer never states by itself that an act sets no sanction; only a sourced note does. No new data field. (b) **a tranche date** in the provisions table, when it comes from an event that names the article, carries "a date set for named provisions: what it covers is under Key dates →". (c) **the "Binds" column** also shows `obligation_on_institution`, by the institution's short name. (d) **the "not covered" notice** lists the record's relationships with the instrument page's own renderer, and nothing when there are none. (e) **the status badge** is spaced from "as of" by one CSS rule (`.badge + .fresh`, `--s-2`). | The author, answering four questions in v2 Session 8 ("A: renderer (Recommended)"; "B1: rinvio alle date (Recommended)"; "(c) Istituzione in Binds, (d) Relazioni nell'avviso"; "Regola CSS (Recommended)") |
