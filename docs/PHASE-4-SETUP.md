# PHASE 4 SET-UP — the manual processes, the three levels, the login, and an entry condition that can fail

**Status: A DESIGN DOCUMENT; IT IMPLEMENTS NOTHING. DECIDED BY THE AUTHOR ON 3 NOV 2026 (§8, v2 Session 17.5).** Written in v2 Session 17.5,
3 Nov 2026, on `claude/nifty-ride-kc0p4x`, on the author's scope (`docs/ROADMAP-v2.md` §8, "The scope of v2 Session
17.5"). The name of this file is the prompt's proposal. **Phase 4 is not open**: opening it is the author's
decision, and starting it is another session. D-4 is decided (the three names and §2.2 as drafted); D-5 is deferred
on §4's facts; §0 is read by principle; the entry condition (§5) and the first item (§6) are approved.

**What governs it.** The brief (`docs/BRIEF-v2.md`): «Non aggiungere la Tier A/B/C come primo intervento. Prima di
automatizzare, rendi trasparente il processo manuale»; «Non costruire un backend serverless custom finché un CMS
git-based non si dimostra insufficiente»; «Control Room: Tier A (auto, controllo macchina), Tier B (attestazione
umana), Tier C (autorialità umana). Login preferito: CMS git-based con OAuth. Serverless solo se necessario.»
`docs/ROADMAP-v2.md` §4, Phase 4: "Phase 4 automates only what Phases 0–1 made visible as a manual process."

**The names of the three levels.** This document uses the words of D-4's recommendation — *machine check*, *human
attestation*, *human authorship* — because the brief's letters collide with the autonomy classes A/B/C/D of
`docs/AUTONOMY-POLICY.md`, which mean something else (§2.1). The letters appear here only as the brief's words.

---

## 0 · A premise to put to the author before anything else

§4's sentence limits Phase 4 to "what Phases 0–1 made visible as a manual process": items 0.1–0.4 and 1.1–1.5.
The prompt of this session asks the inventory to include, as well, the processes **Phase 3** made manual and
repeatable (reading a rule in Cellar, the SPARQL metadata, the §8 question method, the response to T-12 and
RULE_STALE, `tools/_footer.mjs`, the `Evidence:` line). Read literally, §4 puts those outside Phase 4's automation.
Two readings are possible:

- **literal** — Phase 4 automates only 0.1–1.5's processes; Phase 3's are inventoried for the record and stay manual
  until a later decision;
- **by principle** — §4's sentence is the brief's rule ("before automating, make the manual process transparent")
  applied to what existed when it was written; a Phase 3 process qualifies once it is written down as a manual
  process in the same way.

This document inventories both, marks which is which (column *Made visible by*), and does not choose. It is asked as
a premise of question 8 rather than assumed.

---

## 1 · The inventory of the manual processes

*Who today*: "a session" means a Claude session working under the author's prompt; "the author" means a decision in
the author's words. *Trace*: where the doing leaves a record, and whether git tracks it. *A validator can
establish*: measured in this repository today, not proposed. *Still a person's*: what no check here establishes.

| # | Process | Made visible by | Who today | Trace | A validator can establish | Still a person's |
|---|---|---|---|---|---|---|
| P-01 | Read a Control Room view as a snapshot, refresh it by hand | 0.1 | an operator, in the Control Room | none for a read (a `GET`); the payload carries `assembled_at` | the payload has an ISO assembly time; the three health fields are distinct; "Live system" is gone (`.control-room/selftest.mjs`) | deciding the snapshot is recent enough to act on |
| P-02 | Attest which sections were examined before approving or rejecting | 0.2 | a reviewer, in the Control Room | the Control Room trail, in the decision's entry, bound to its fingerprint (D-9) — **per machine, git-ignored** | that an attestation is present, from the fixed list, and in the chained entry (gate 7) | the examining itself: the attestation is a **declaration, not proof of reading** |
| P-03 | Choose the reference date of a check | 0.3 | whoever runs the check | the command line; in a recorded run, `as_of` | a date that does not parse is refused, exit 2 (measured today: `--as-of banana` → 2 on both tools) | choosing the date, and reading the result as of it |
| P-04 | Run the editorial audit, record the run, read it | 1.1 | a session or the author, from the machine | `tools/evidence-audit-runs/evidence-audit.jsonl` — **git-ignored**; the Control Room's Editorial audit view reads the latest | the audit itself (claims, prose coverage, triggers); the record's five answers (`tools/evidence-audit-record.mjs`) | running it at all (nothing schedules it), and turning a finding into a proposal or a correction |
| P-05 | Write a metric's definition | 1.2 | a session, approved by the author | the metric register, git-tracked | every reading row carries a name and a definition; one display term | whether the definition is right |
| P-06 | Keep `docs/CONTROL-ROOM.md` true to the interface | 1.3 | a session | `docs/CONTROL-ROOM.md` §5, git-tracked | a view in `ui/app.html` that the inventory does not name fails the suite | the row's content: data shown, source, operations, limits |
| P-07 | Word the notice on `applies.html` | 1.5 | the author (D-2) | `applies.html`, git-tracked; §8 | **nothing**: the notice is false today and every check passes (`docs/PHASE-3-AUDIT.md` F-01) | its truth, and its wording |
| P-08 | Read a rule against its Articles in the Official Journal text retrieved from Cellar by CELEX | Phase 3 | a session; the author approves the table | the rule's `last_verified` and `verification_note`; the §8 rows; git-tracked | the shape (T-01…T-05), the dates the obligations derive (T-10), every reference and provision resolving (`validate.mjs`) | the reading — what an Article says and whether the rule says it |
| P-09 | Ask the Publications Office's SPARQL endpoint for amending acts, corrigenda and language versions | Phase 3 | a session, from its own network | the §8 row and the `verification_note`; the queries themselves are not kept | **nothing in the tree**: no tool here makes a network request (`docs/AUDIT-2026-09-01.md` F-12) | running the query, and deciding what an amendment or corrigendum changes |
| P-10 | Put a decision to the author, one question at a time, and record it in §8 in the author's words | Phase 3 (Sessions 11–17) | a session asks; the author answers | `docs/ROADMAP-v2.md` §8, git-tracked | nothing checks §8 (its rows are prose) | the decision |
| P-11 | Respond to `LAW_CHANGED_SINCE_VERIFIED` (T-12) or `RULE_STALE` | Phase 3 (17.3) | nobody yet: the first is due on 28 Jan 2027 (33 rules) and 26 Mar 2027 (`ap-cra-01`) | the warning or prompt is printed and counted; a re-reading would leave P-08's trace | **noticing**: both are derived from the records, no network (`docs/PHASE-3-AUDIT.md` §5) | re-reading the law, and deciding whether the rule changes |
| P-12 | Regenerate the generated pages with `node tools/_footer.mjs` after a change to `data/` or an inline script | Phase 3 practice; older | a session | the regenerated files, git-tracked | **that it was not done**: `seo-audit.mjs` fails a stale page, CI fails, and `pages.yml` does not deploy (run 55, `d65e713`, 2 Nov 2026) | running it; deterministic, so nothing of judgement |
| P-13 | Name the evidence of a published change in an `Evidence:` trailer | 27 Sep 2026 decision; Phase 3 practice | whoever commits | the commit message, git-tracked | **that the line exists** (`tools/commit-evidence.mjs`, in `qa.yml` and `pages.yml`) — it cannot judge the evidence | what the evidence is, and whether it carries the change |

## 2 · The three levels applied to the inventory (pending D-4)

### 2.1 Why not the letters

| Brief | Its meaning | The class of `docs/AUTONOMY-POLICY.md` with that letter | Its meaning there |
|---|---|---|---|
| «Tier A» | auto, machine check | Class A | read-only and `docs/`-only, fully autonomous |
| «Tier B» | human attestation | Class B | autonomous with automated validation |
| «Tier C» | human authorship | Class C | pull request and human approval |
| — | — | Class D | explicit, named, recorded human authorization |

"Tier B" (a person attests) and "Class B" (no person) are near opposites. A document that said "a Tier B process"
next to "a Class B change" would state two different facts with one letter.

### 2.2 Per process

A process usually has a part at each level. **No cell here is a decision.**

| # | *machine check* | *human attestation* | *human authorship* |
|---|---|---|---|
| P-01 | the assembly time is present and shown | — | the judgement that it is recent enough |
| P-02 | the attestation is present and chained | the declaration of what was examined | — |
| P-03 | an unreadable date is refused | — | the choice of date |
| P-04 | the audit's findings; the record's five answers | "I ran it as of D and read it" (today implicit in `--record`) | turning a finding into a correction |
| P-05 | name and definition present | — | the definition |
| P-06 | an uninventoried view fails | — | the row's content |
| P-07 | **none today** (a check that the notice's factual clauses match the measured state would be one) | — | the wording |
| P-08 | shape, dates, resolution | "read on D in the OJ text retrieved by CELEX X" (today a `verification_note`, free text) | the rule's content |
| P-09 | none today (a fetch is a network act; §3) | "queried on D; N amending acts; M corrigenda" (today in prose) | what a change means |
| P-10 | none | — | the decision |
| P-11 | noticing (T-12, RULE_STALE) | "re-read on D, no change needed" — the cheapest honest closure of a prompt, and today it has no form other than a new `last_verified` | deciding the rule's new content |
| P-12 | detecting staleness; the generation itself is deterministic | — | — |
| P-13 | the line exists | the line is a declaration | what the evidence is |

**What this shows.** The *human attestation* column is where Phase 4 has something to build: P-04, P-08, P-09 and
P-11 each record an attestation **as free prose today** (a `verification_note`, a §8 row), which no check can read.
0.2 gave the Control Room's decision a structured attestation; generalising it — the roadmap's own words for the
level, "0.2 generalised" — would give those four a structured one. The *machine check* column is mostly built; the
gaps are P-07 (nothing checks the notice), P-09 and P-10. The *human authorship* column is what Phase 4 must never
automate, and it is most of the legal work.

---

## 3 · What already exists, and whether Phase 4 extends it, uses it or leaves it

The rule: **no second home for a policy** — `agent/policy/` is the one (AGENTS.md; `docs/LIMITED-AUTONOMY.md`).

| What | Today (measured 3 Nov 2026) | Phase 4 |
|---|---|---|
| The limited-autonomy grant `gov-5c5d9d87d8ca4478` | five categories (source metadata maintenance, retrieval metadata, source URL correction, machine-derived field, governed metadata maintenance), over `data/sources.json` (eight fields) and `docs/`; risk ≤ low; **expires 9 Mar 2027**; `node agent/policy/cli.mjs governance`: self-check ok | **leaves it**. None of P-01…P-13 is in its paths. Extending it to `data/applicability.json` would put rule content inside an automatic category, which is *human authorship*. Its expiry falls inside the window in which Phase 4 would run: whether it is renewed is a separate governance decision, not Phase 4's |
| The Control Room's eight approval gates and its OIDC login | approve · reject · request changes; gate 7 is 0.2's attestation; OIDC authorization code with PKCE (S256), token exchange server-side; **implemented in code, verified in tests, never against a real identity provider, never deployed** (`docs/CONTROL-ROOM.md` §0, §11) | **uses** gate 7 as the model of *human attestation*; does not add a route that executes (`docs/CONTROL-ROOM.md` §12) |
| Production readiness | `node agent/production/cli.mjs readiness`: refuses (exit 1). On a full-history clone the blockers are `production_dispatcher_wired`, `decision_ledger_present`, and `deploy_gate_exists` unmeasurable from the tree (re-measured for the checkpoint report) | **leaves it**. Activation is a governance decision (protocol §24); nothing in the inventory needs a dispatcher |
| V2C-40 — no production dispatcher | unchanged | **leaves it** (as above) |
| V2C-41 — the decision ledger is ABSENT | `agent/implement/decisions/` holds only `README.md` | **does not touch it**: a first decision is a person's act through the Control Room or `cli.mjs decide`. Phase 4 can make it *possible to record*; it cannot make one |
| V2C-43 — the adversarial gate | `node agent/policy/verify/cli.mjs`: 65 failed safely · 0 succeeded · 3 partial (PP-08 high; HE-04, OB-05 medium) · 1 undecidable (PP-09) — unchanged | **leaves it** unless D-5 adds a login surface to the published site, which would change PP-08's and PP-09's terrain |
| `ALLOWED_RUNTIME_ORIGINS` (`tools/thirdparty.mjs`) | empty | **leaves it** unless D-5 decides otherwise, which is Class D |
| The editorial-audit path (1.1) | `--record` to a git-ignored store; read-only view | **uses** it: P-04 is its manual process |

---

## 4 · D-5: the two facts, read in each CMS's own documentation

D-5's recommendation asks two facts before a git-based CMS is chosen: **(a)** whether its GitHub login needs a
server-side token exchange (a backend), and **(b)** from which origins it loads code. The author named no CMS, so
two are proposed, with the reason: **Decap CMS**, because it is the git-based CMS with OAuth that the brief's
wording describes (formerly Netlify CMS); and **Sveltia CMS**, because its documentation presents it as Decap's
successor and as having a sign-in that needs no OAuth app. Read on **3 Nov 2026 (about 11:25 UTC)**, from this
session's network. Nothing below is from memory; each fact quotes the page.

### Decap CMS

- **(a) Login.** *decapcms.org/docs/github-backend/* (source `content/docs/github-backend.md` of
  `decaporg/decap-website`), the opening section: "Because GitHub requires a server for authentication, Netlify
  facilitates basic GitHub authentication." *decapcms.org/docs/external-oauth-clients/*: "If you would like to
  facilitate your own OAuth authentication rather than use Netlify's service or a client side flow like implicit or
  PKCE, you can use one of the community-maintained projects below" — every one listed is a server (Node.js, Go,
  Python, Cloudflare Pages, AWS Lambda, Firebase functions …). **Answer: yes, a server — Netlify's or one we run.**
  The GitHub backend page names no client-side flow for GitHub.
- **(b) Code.** *decapcms.org/docs/install-decap-cms/*, "1. Install Decap CMS": the admin page loads
  `https://cdn.jsdelivr.net/npm/decap-cms@^3.0.0/dist/decap-cms.js`, with `https://unpkg.com/decap-cms@^3.0.0/…` as
  the alternative; or, "Installing with npm", `npm install decap-cms-app` with "tooling for imports". **Answer: a
  third-party CDN, or a dependency and a build step.**

### Sveltia CMS

- **(a) Login.** *sveltiacms.app/en/docs/backends/github* (read as `…/github.md`), "Authentication":
  - "Access Token (Quick Start)": a personal access token pasted into a prompt; "The token will be stored in the
    browser's local storage and used for subsequent API requests." **No server.**
  - "PKCE Authorization": marked **Unimplemented** — "We're waiting for GitHub to support client-side PKCE
    authentication for single-page apps … GitHub has put the project on hold."
  - "Authorization Code Flow": "requires you to set up an OAuth app on GitHub and deploy an OAuth client server" —
    Sveltia CMS Authenticator "on Cloudflare Workers", a Decap third-party client, or Netlify.
  - **Answer: an OAuth login needs a server; only a personal access token avoids one.**
- **(b) Code.** *sveltiacms.app/en/docs/start* (read as `…/start.md`), "Manual Installation":
  `<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>`; "a single-page application (SPA)
  distributed as a small JavaScript bundle via a content delivery network (CDN)"; or npm, "and manually initialize
  the CMS in your JavaScript code". The GitHub page's "CSP" section: a site with a CSP "may need to update it to
  allow requests to GitHub". **Answer: a third-party CDN, or a dependency; and `connect-src` widened to GitHub.**

### Against the Control Room's existing login, and against the standing rules

| | Decap | Sveltia (token) | Sveltia (OAuth) | The Control Room |
|---|---|---|---|---|
| A server for login | yes (Netlify or ours) | no | yes (Workers, ours, or Netlify) | yes — the Control Room **is** a server (OIDC, PKCE, token exchange server-side) |
| Third-party origin for code | jsDelivr / unpkg, or npm + build | unpkg, or npm + build | the same | none |
| What it can do | **write** content to the repository (commits) | the same | the same | **approve, reject, request changes** — writes one ledger line, changes no content |
| Where it lives | an `admin/` page on the published site | the same | the same | outside the published surface (`tools/pages-artifact.mjs` refuses it) |

**What the facts collide with**, stated so the author can weigh them:
- Loading the CMS from a CDN adds an origin to `ALLOWED_RUNTIME_ORIGINS`, which is **Class D** (`docs/AUTONOMY-POLICY.md`:
  "Adding a runtime dependency, a build step … a third-party script"). Self-hosting the bundle avoids the origin but
  is a vendored dependency, against "zero dependencies".
- Any OAuth login for GitHub needs a server. The site is static and published by GitHub Pages; a token-exchange
  server is the "backend serverless custom" the brief allows only once a git-based CMS «si dimostra insufficiente».
  The facts above are that evidence's raw material; whether they make the case is the author's.
- A CMS that commits content is a **fourth path by which the website changes** (`docs/PRODUCTION-OPERATING-MODE.md`
  §5 traces three). Each of its commits to a published file would need an `Evidence:` line; whether either CMS can
  write one was **not read** and is not asserted.
- An `admin/` login page on the published site is a credential prompt in the public tree. `docs/FIRST-END-TO-END-AUDIT.md`
  §6 (as `AGENTS.md` summarises it) gives that as the reason the Control Room's discovery flow must not end in a login
  form on the published page; the same reasoning would apply here, though §6 was written about that flow, not a CMS.
- The personal-access-token route puts a repository credential in the browser's local storage.

**Not verified:** any of this in a running instance (nothing was installed, by the prompt's rule); whether either
CMS can write a commit trailer; GitHub App (rather than OAuth App) options, which neither page read describes for
login.

---

## 5 · An entry condition for Phase 4 that can fail (a proposal)

On the model of Phase 3's: each criterion with what verifies it. **The decision is the author's.**

| # | Criterion | Verified by | Fails today? |
|---|---|---|---|
| E-1 | Phase 3's state is decided: closed, or Phase 4 allowed to start with Phase 3 open (the brief's sequence is binding) | a row in `docs/ROADMAP-v2.md` §8 in the author's words | **yes** (question 1) |
| E-2 | D-4 is decided: the three levels have names, and no letter | a §8 row; `grep -n "Tier [ABC]" docs/PHASE-4-SETUP.md` finds only the brief's quoted words (§0 header, §2.1) | **yes** (question 6) |
| E-3 | The inventory (§1) is approved, each process with its level per part (§2.2), and the premise of §0 decided | a §8 row; §2.2 carries no "pending" | **yes** (questions 6, 8) |
| E-4 | D-5 is decided on the two facts of §4, or deferred with its reason | a §8 row | **yes** (question 7) |
| E-5 | The baseline is green on a full-history clone: the four validators and `seo-audit` 0 errors; `evidence-audit` 0 errors; `tools/selftest.mjs` and the 24 suites of `AGENT_SUITES` pass; the browser suite passes | the commands of `AGENTS.md` "Validators"; `git rev-parse --is-shallow-repository` → `false` first | no (re-measured for the checkpoint report) |
| E-6 | Nothing in Phase 4's first item writes outside `docs/` without its own §8 row | the item's scope row | — (a property of the item, §6) |

Readiness (`agent/production/cli.mjs readiness`) is deliberately **not** a criterion: it refuses by design until a
production dispatcher and a first decision exist, and neither is Phase 4's to create.

## 6 · A first item for Phase 4 (a proposal, and only the first)

The roadmap does not plan a phase before it is reached (§6), so this is one item, not a plan.

**4.1 · The rule-maintenance process, written down as a manual process before anything is automated.**
- **Why first:** the brief's rule ("prima di automatizzare, rendi trasparente il processo manuale"); and the
  calendar — on **28 Jan 2027** all 33 rules lapse, and on **26 Mar 2027** T-12 reports `ap-cra-01`
  (`docs/PHASE-3-AUDIT.md` §5). P-08, P-09 and P-11 have been done five times, by sessions, and written down only as
  prose in §8 rows and `verification_note`s.
- **What it would produce:** one document (`docs/`) that writes P-08 → P-09 → P-10 → P-11 → P-12 → P-13 as the
  steps a person takes when a prompt fires, each step tagged with its level as decided in D-4, and the record each
  step leaves. No code, no data, no new field.
- **What it would not do:** automate any step; touch a rule; add a check. A *human attestation* form for P-08/P-11
  (§2.2) is the natural second item, and is named here only so the first is not mistaken for the whole.
- **Exit, so it can fail:** the document exists; every step names its level and its trace; and it is walked through
  once with `--as-of 2027-03-26` against `ap-cra-01`'s T-12 **as a rehearsal on the records** (no rule changed),
  the walk recorded in the session's report.

---

## 7 · What this document does not establish

- **That Phase 4 should open now**, or at all before Phase 3's state is decided.
- **That a CMS is needed.** §6's first item needs no login.
- **Anything about a CMS beyond the pages quoted**, read once on one date.
- **That any level assignment is right.** §2.2 is a proposal pending D-4.
