# SESSION 25 — the first controlled real-world run

**Ran:** 9 September 2026 · branch `claude/first-controlled-real-world-run-wyz3k2`, cut from
`origin/main` at the SESSION 24 merge.

**Mode:** OBSERVE + PROPOSE ONLY, as instructed. **Nothing in `data/`, `i18n/`, `js/`, `css/`
or any page was changed, and no proposal was decided.** Every claim below is checked against
`git status --porcelain` (empty throughout) and the record store, not asserted.

---

## 1 · What "real-world" means here, and what changed from SESSION 24

SESSION 24 ran the whole agent graph in **simulation** — twelve specialists wired to the real
Orchestrator, all domain reasoning fixture-driven, every host `.invalid`. This session is the
first to invoke the **non-simulated** paths that already existed in the tree but had never been
asked for "in as many words" (`agent/scout/cli.mjs --live`, `--records <trace-id>` on the
Verifier/Integrator/Detector, and the plain, non-`--mock` invocation of Depth, Architect, the
two proposal agents, UX and the browser suite, which read `data/` and the live pages directly
rather than an adversarial fixture).

**The bounded source set is the one already registered in the tree**,
`agent/scout/authorities.mjs` `ENDPOINTS` — five root addresses, most-authoritative first:
EUR-Lex, the Commission's digital-strategy site, EDPB, EDPS, ENISA. Nothing was added to that
list this session; picking a *different* bounded set would have been inventing a source
registry, which is exactly what `endpoint_verified: false` on every entry already refuses to
let this agent do on its own.

## 2 · Step 1 — discover material: blocked at the network boundary, not simulated past it

```
node agent/scout/cli.mjs --live
```

**Result: 0 candidates, 5 of 5 retrieval attempts refused, real trace
`3431281084fa9129b4689b82cb7043e8`.** Every one of the five registered endpoints answered the
Scout's `HttpTransport` with a blocked CONNECT (surfaced to the Scout as `status 403`) — this
environment's own egress policy, confirmed independently by `curl` (`CONNECT tunnel failed,
response 403`) and by `WebFetch` (`EGRESS_BLOCKED · eur-lex.europa.eu`) against the same host,
neither of which is part of this repository's code. **This is not a repository defect.** It is
this remote session's network policy, and the Scout did exactly what
`docs/SOURCE-SCOUT.md` says it must: it recorded five `DataGap` records
(`retrieval_blocked`), not five empty results and not five candidates. Nothing was invented to
fill the gap.

**This is the first session in which U-23.5-01 and AUDIT F-12 — "the deployed origin has never
been fetched, the network policy refuses it" — is a measurement rather than an inference.** The
same sentence in `docs/SECURITY-VERIFICATION-2026-09-08.md` and `AGENTS.md` was written from
reading the tree and the environment's documented default; this run is the first time an actual
retrieval attempt against a real regulator's site was made from inside this project and
actually refused, on the record, with a trace id.

## 3 · Steps 2–4 — verify, detect, chain: nothing to chain, honestly

```
node agent/verifier/cli.mjs --records 3431281084fa9129b4689b82cb7043e8
  → "no SourceCandidate records in agent/records/3431281084fa9129b4689b82cb7043e8.jsonl"  (exit 1)
node agent/integrate/cli.mjs  --records 3431281084fa9129b4689b82cb7043e8 --as-of 2026-09-09
  → "no VerificationRecord records …"  (exit 1)
node agent/detector/cli.mjs   --records 3431281084fa9129b4689b82cb7043e8 --as-of 2026-09-09
  → "no VerificationRecord records …"  (exit 1)
```

Each refusal is correct and expected: zero live candidates means zero verifications means
zero integration proposals means zero detected changes **on the live path**. No mock corpus was
substituted to produce a result. (An earlier exploratory `--help` probe of `agent/detector/cli.mjs`
in this session's own shell history executed its **default `--mock`** path — the same
`.invalid`-hosted adversarial fixture SESSION 24 already used — because `--help` is not a flag
the CLI recognises. That output is **not** part of this session's real findings and is excluded
from the review queue below; it is noted here only so the trace list is not misread.)

**Finding R-1 (materiality: high; confidence: measured, not inferred).** *The live discovery
path, run for the first time, could not verify a single claim in this build against a live
source, because it could not reach a single registered source.* Every one of the 106 records
`validate.mjs` already reports `UNVERIFIED / REQUIRES VERIFICATION` remains exactly as
unverified as it was before this run — this session neither closed a gap nor could have. That
is not a new problem; it is the old one, now demonstrated rather than assumed, and it bounds
what every later step in this report can honestly claim: nothing below rests on a document this
session actually read.

## 4 · Step 5 — identify affected pages, and step 6 — editorial implications

These run against **real `data/` and the real pages**, not the mock corpus, and need no live
source: they ask what the existing corpus already says about itself.

**Knowledge Architect** (`agent/architect/cli.mjs --as-of 2026-09-09`, trace
`f3ef6497f709b5ec6d1305095a0d1d47`): all eight questions answered yes — 20 findings, 20
`ArchitectureProposal`s, 9 set aside below the demand floor or already owned by Data Depth.

**Data Depth** (`agent/depth/cli.mjs --as-of 2026-09-09`, trace
`b9c18df85cb41f2977a7e04b3272bf0d` and re-runs): 57 gaps — 15 `reader_could_be_misled`, 10
`reader_finds_nothing`, 32 `analysis_incomplete`; 36 `human_only`, 21 `review_required`.

**Gap Proposals** (`agent/proposals/data/cli.mjs --as-of 2026-09-09`, trace
`55144293055186b12c54eca1be16bf4b`): 57 gaps routed, 14 `DataProposal`s authored (all
`review_required`, all pending), 21 evidence questions handed to the Verifier (which cannot run
without a live source — see §3), 21 handed to Editorial, 1 `taxonomy_proposal`, 1
`owner_decision`, 22 refused and **named** rather than dropped (§"NOT PROPOSABLE HERE" in the
CLI output — four inter-instrument overlap readings, seventeen glossary definitions, one schema
decision).

**Editorial** (`agent/proposals/editorial/cli.mjs --as-of 2026-09-09`, trace
`bb17549a37af0dd7ded77e32868aca39`): 387 prose blocks read across 7 pages; 22
`editorial_recommendation`s, all pending, all `human_only`. **This agent proposes no wording** —
every record names a mismatch between what a sentence claims and what backs it, and drafts
nothing, by its own design.

## 5 · Step 7 — UX implications

**UX/UI Audit** (`agent/ux/cli.mjs --as-of 2026-09-09`, trace
`d4e5961ff6a4c4e43369b7158f83ba38`): 10 findings — 1 critical, 4 high, 5 medium — 10
`UXProposal`s, all `human_only`, all pending. 12 open questions the source could not settle on
its own.

**Browser QA** (`agent/browser/cli.mjs --require-browser`, real Chromium 141.0.7390.37, 1474
requests): **125 pass · 3 fail · 2 undecidable across 130 checks.** The three failures are the
same three SESSION 19 found and nobody has fixed — `nav:noscript`, `keyboard:skip-first`,
`a11y:headings:enforcement.html` — measured again, unchanged. No new browser defect was found
this session.

## 6 · Step 8 — Control Room discovery impact

Per protocol: the hidden Control Room entry (`js/threshold.js`, reached through the search
palette by typing `thirty-two paths`) is treated here as a legitimate UX/system proposal
category, and **is not treated as a security control** — consistent with how
`docs/AUTONOMY-AUTHORIZATION-POLICY.md`, `AGENTS.md` and `docs/CONTROL-ROOM.md` already describe
it: obscurity is not the control, authentication and authorization behind the login are, and
neither of those was touched or exercised this session.

**This session's records were searched for anything touching search behavior, hidden-entry
detection, animation, Control Room login routing, public/private boundaries, or privileged
interfaces.** One finding qualifies:

> **UX-3 — the modal dialog contract is implemented three times, and `js/threshold.js` is one
> of the three.** `js/dialog.js:46`, `js/threshold.js:159` and `app.js:286` each set
> `role="dialog"`, `aria-modal` and manage focus independently. This is an **interaction
> consistency finding about the threshold wheel's accessibility behaviour** — not about
> authentication, not about what the passage reveals, and not about the boundary between the
> public site and `.control-room/`. `prop-ux-two-implementations-a364f0ff9dd6` ·
> `human_only` · high priority.

No other finding this session names `js/threshold.js`, `js/palette.js`, `style.css`'s threshold
block, `.control-room/`, or any Control Room route. (Two `data-depth` claim IDs —
`clm-dsa-vlop-threshold`, `clm-flop-threshold` — matched the search term on the unrelated legal
sense of "threshold": the DSA's very-large-platform user-count thresholds. They are ordinary
knowledge-corpus findings, unrelated to the hidden entry, and are not listed here again.)

**Conclusion for step 8:** this run found no defect and no proposal that touches search
behavior, hidden-entry detection, animation, Control Room login routing, the public/private
boundary, or a privileged interface. The one relevant finding is a UX/accessibility
consistency item, correctly routed `human_only`, and does not — and under this protocol must
not — become a security finding by virtue of touching that file.

## 7 · Step 9 — QA simulations

The browser suite (§5) is the real QA simulation this session ran — a real Chromium opening
every page. `agent/health/cli.mjs --as-of 2026-09-09 --quick` (trace
`75c67ccf90b223b5522f205615e55eea`) ran the three-domain health measurement across all 44
metrics on top of it: **public website 9/10 measured** (`Deployment failures` remains
`UNMEASURABLE` — same reason as §2, now doubly confirmed this session), **knowledge health
10/10 measured** (evidence coverage 76.9% of 91, 106 unresolved claims, 74 stale sources of 77),
**control-plane 21/24 measured**, two `UNMEASURABLE` for the reasons already on record
(`Control Room availability`, `Authentication and authorization failures` — no instance was run
this session) and one newly measurable this run only because the run itself created a trace
(`Unauthorized action attempts` remains unmeasurable — no implementation run occurred).
`node agent/implement/cli.mjs boundary` and `node .control-room/cli.mjs boundary`: **0 blocking
findings on both**, at the recorded baseline (13 / 0 warnings respectively).

The four validators are at the recorded `docs/CURRENT-ARCHITECTURE.md` §12 baseline throughout
this run: **0 errors** on `validate.mjs`, `i18n-audit.mjs` and `design-qa.mjs` (5 pre-existing
warnings, unchanged), **106 unverified records** (unchanged — this run could not have changed
it, §3), `freshness.mjs` unchanged (3 `url:none`, 1 `url:paywalled`, 73 `url:live`).

**CI's own verdict on this push, stated plainly rather than left to be inferred from the local
runs above.** `.github/workflows/qa.yml` ran on `cdfe375` (this session's commit, on `main`) and
its overall conclusion is **`failure`**, run
[34334054392](https://github.com/andreatosti2001/Eu-Digital-Policy/actions/runs/34334054392).
Four of six jobs pass (`Public website / private control plane`, `The agent suites`, `Website
health monitor`, `What this workflow does not prove`); two fail:

- **`The four validators`** — the job's own steps for `validate.mjs`, `i18n-audit.mjs` and
  `design-qa.mjs` all report `success`; the job fails because `freshness.mjs` exits 1. Its own
  output, read from the CI log, is the same "1 item(s) need attention" reported in §7 above and
  matches this session's local run exactly — the three already-named sources
  (`src-us-house-judiciary-dsa-2025`, `src-cdt-ai-act-national-security`, `src-brief-original`).
  `freshness.mjs` exits non-zero whenever it has something to report, by design; that is not the
  same fact as the check being broken.
- **`Browser regression suite`** — fails on the same three pre-existing, already-documented
  defects listed in §5 (`nav:noscript`, `keyboard:skip-first`,
  `a11y:headings:enforcement.html`), byte-identical to the CI log for this run.

**Neither failure is new, and neither was caused by this session.** The immediately preceding
push to `main` — SESSION 24's commit `341ff39`, made before this session started — fails CI in
the identical two jobs at the identical two steps (run
[34329668649](https://github.com/andreatosti2001/Eu-Digital-Policy/actions/runs/34329668649)),
and the merge before that (`8f1b411`) fails the same way too. `AGENTS.md` states this workflow
"is not a deploy gate" — a push to `main` still publishes regardless of its conclusion, and this
run's job list matches that pre-existing pattern exactly, not a regression this session
introduced.

**The correction this note makes:** §9 below and the closing summary of this session originally
reported the four validators and both boundary checks as "unchanged at baseline" from local
tool runs alone, without checking GitHub's own CI conclusion for the pushed commit. Both facts
are true and are not in tension — the local exit codes and the CI job's pass/fail conclusion are
different measurements of the same underlying, pre-existing, already-documented state — but
stating only the former reads as a stronger claim ("CI is green") than what was actually
checked. It is corrected here rather than edited away.

## 8 · Step 10 — the execution trace

**21 traces total in `agent/observability/runs/` after this session; the ones this session
created:** Scout ×2 (`3431281084fa9129b4689b82cb7043e8` live/stored,
`2c2bf7f64809ed01959e2e0fdab72493` live/dry), Data Depth ×3, Architect ×1, Gap Proposals ×2,
Editorial ×1, UX ×5, Health ×2. `node agent/observability/cli.mjs summary` reports **15
completed, 6 degraded, 0 failed** — the 6 `degraded` are the two live Scout runs (correctly
degraded: 5/5 retrieval refused) and four pre-existing SIMULATED traces from before this
session that this run did not touch. `node agent/orchestrator/cli.mjs survey` read the real
record store against the real decision ledger and reports **48 proposals, 0 routable to
implementation** — every one refused by `scope_defined` / `provenance_complete` /
`proposal_approvable` / `approval_attributable`, which is `preflight`'s own gate correctly
refusing a proposal that is, by every one of these agents' own design, not meant to write
itself into `data/`. **Zero decisions exist in `agent/implement/decisions/decisions.jsonl`
before or after this session.** `node agent/implement/cli.mjs` confirms: 48 pending, 0 decided,
0 granted, 0 implementable.

---

## THE HUMAN REVIEW QUEUE

**48 proposals exist in the record store; this queue is not that list.** Per instruction, this
names only what is materially significant, ranked by materiality, evidence quality,
confidence, reader impact and legal significance — not by count. The full set is always
reachable: `node agent/implement/cli.mjs --all --why`, or by trace id above.

### Tier 1 — legal-accuracy risk a reader could act on

1. **R-1 — this environment cannot verify a single claim against a live source.**
   Materiality: structural, affects every one of the 106 unverified records equally. Evidence:
   measured this session (§2, §3), not inferred. No proposal exists for this because none is
   possible from inside the tree — it needs either a different network policy or a person
   fetching a source by hand and handing the text to the Verifier.

2. **`prop-ed-editorial-recommendation-e6e61ba86b15`** — `index.html` labels a passage
   "CRITIQUE" (an argument) while its only claim, `clm-cjeu-pseudonymised-data`, is typed
   `claim-type:law` (a fact) in `data/claims.json`. Confidence 0.9. `claim_type` is, in this
   agent's own words, "the highest-leverage field in the repository" — a reader cannot tell
   from the page whether this is the author's argument or a stated legal fact, and the two
   records disagree about which it is.

3. **`prop-ed-editorial-recommendation-52561bfe7c59`** — the known `__CONTENT__` hazard
   (`AGENTS.md`), now specifically located: `index.html`'s inline blob and `data/brief.json`
   hold **different text** at `meta.standfirst`, and the blob — not the canonical record — is
   what a reader and any search index actually see. Confidence 0.95, the highest of this
   session's editorial findings.

4. **`prop-annotate-ae6b2d48872f`** and **`prop-annotate-926143433cb2`** — two enforcement
   actions on the public `enforcement.html` register (EUR 120,000,000 and EUR 500,000,000
   fines) carry `payment_status: unknown`, which is not the same fact as "no payment issue" and
   is not currently distinguished from it anywhere a reader can see. Seven and three claims
   respectively argue from these records. Confidence 0.9 each.

5. **`kg-stale-record-6749087fa14b`** (Data Depth) — no dataset in this corpus records when an
   individual claim was last checked; every `last_verified` is a bulk compilation date. 19
   records currently read as stale relative to something they depend on, and the finding itself
   says that reading may be an artefact of two bulk stamps rather than real decay — the corpus
   cannot currently tell the two apart. This is the gap every other verification decision in
   this system depends on being able to make.

### Tier 2 — interface defects a reader meets directly

6. **UX-1 (critical)** `prop-ux-hue-alone-a3a7cde0da35` — the site's own stated rule that state
   is never carried by hue alone is bypassed by 26 components.

7. **UX-3 (high)** `prop-ux-two-implementations-a364f0ff9dd6` — the modal dialog contract,
   three independent implementations, one of them the Control Room threshold wheel (§6). Not a
   security finding; an accessibility-consistency one.

8. **UX-4 (high)** `prop-ux-navigation-without-js-cc1165de54f1` — 5 of 7 pages are linked from
   no markup anywhere (only reachable via the JS-rendered nav), compounding the pre-existing
   `nav:noscript` browser-suite failure (§5): with scripting off, a reader on most pages has no
   way to the rest of the site and is not told so.

9. **UX-5 (high)** `prop-ux-name-at-every-width-343652ba0a9e` — a link in `js/shell.js` names
   itself only via `title=`, which is not read reliably by assistive technology or on touch.

10. The three unfixed browser-suite defects, re-measured unchanged this session:
    `nav:noscript`, `keyboard:skip-first` (skip link is the 10th focusable element),
    `a11y:headings:enforcement.html` (h2 → h5 heading jump).

### Tier 3 — structural / architectural, lower urgency

11–15. Five `ArchitectureProposal`s from the Knowledge Architect answering "yes" to all eight
of its questions (missing entity types, a duplicated relationship, two duplicated vocabularies,
a fact forced into prose ten times over, one under-modelled regulatory relationship, one
versioning gap) — `node agent/architect/cli.mjs --as-of 2026-09-09 --all` for the full 20.

**Not in this queue, and named rather than omitted:** the 22 refused "NOT PROPOSABLE HERE" data
gaps (four legal-overlap readings, seventeen glossary definitions, one schema decision — all
correctly reserved for a human author); the 4 knowledge-architect findings set aside below the
demand floor; the 6 remaining medium UX findings; the routine `analytical_update` /
`factual_update` proposal kinds, of which this run authored zero.

---

## 9 · What this session did not do, named rather than implied

- **It did not enable `--live` by default anywhere**, does not change any CLI's default, and
  proposes no change to `agent/scout/authorities.mjs`'s endpoint list.
- **It did not decide a single proposal.** `agent/implement/decisions/decisions.jsonl` is empty
  before and after, exactly as it has been since SESSION 18's count of it.
- **It did not touch `APPROVED_AUTONOMOUS_CATEGORIES`**, still `[]`, still a decision protocol
  §24 reserves to a person.
- **It did not add the `<meta name="eu-control-room">` tag**, a server route, or any change to
  `js/threshold.js`, `style.css`'s threshold block, or `.control-room/`.
- **It did not fabricate a fetch.** Every "blocked" statement in this report is a real
  `403`/`EGRESS_BLOCKED` this session actually received, from two independent tools, against a
  real hostname, not a value read from a document.
- **`git status --porcelain` was empty for the whole run**, checked before this document was
  written (the record store and observability traces are git-ignored run state, as designed).

## 10 · Next session

The exact objective this environment cannot advance on its own: **step 1 needs a network
policy that can reach at least one of the five registered endpoints**, from either this
environment or a person retrieving a document by hand and handing its text to the Verifier via
`--records`. Until then, every future "real-world run" in this environment will reproduce §2
and §3 exactly, and that repetition is itself the honest result, not a wasted run.

Tier 1 and Tier 2 above are ready for a human decision now, through `.control-room/`'s review
queue or `node agent/implement/cli.mjs decide` — nothing here requires another agent pass first.
