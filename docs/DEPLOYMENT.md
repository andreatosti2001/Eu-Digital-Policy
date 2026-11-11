# DEPLOYMENT, THE GATE, AND THE SECURITY BOUNDARY

**Written:** 27 September 2026, with the measurements below taken that day from this
environment, which — unlike earlier sessions' — could reach the deployed site.

This document says exactly what stops an unverified change reaching the public site, what does
not, and which part of that depends on a setting only the repository owner can change. It does
not claim a protection the hosting does not provide.

---

## 1. How the site is published today (measured)

- GitHub Pages serves **`main` from the repository root** ("Deploy from a branch"). The live
  `index.html`, `data/claims.json` and `js/format.js` were byte-identical to `origin/main`
  (`179c975`) on 27 Sep 2026. **A push to `main` publishes.**
- Because Pages runs Jekyll on that branch, a path segment beginning with `.` is not served.
  Measured on the live site: `.control-room/server.mjs`, `.control-room/cli.mjs` and
  `.agents/skills/…/SKILL.md` return **404**. This is the first time that boundary has been
  confirmed in production rather than predicted.
- Everything else in the repository **is** public. Measured: `agent/health/model.mjs`,
  `docs/HANDOVER.md`, `tools/validate.mjs`, `AGENTS.md` and
  `agent/policy/governance/grants.jsonl` all return **200**. Nothing secret is in them (§5), but
  it is more than the website.
- Response headers from GitHub Pages: `strict-transport-security: max-age=31556952` and
  `cache-control: max-age=600`. No `Content-Security-Policy`, `X-Content-Type-Options`,
  `Permissions-Policy` or `X-Frame-Options` header is sent, and Pages offers no way to add one.

### 1a. Re-measured 23 Oct 2026, on the custom domain

From this session's container, whose HTTPS goes through a TLS-intercepting proxy (which matters
for the last point).

- **Two publishers deploy every push to `main`, and the ungated one goes first.** For
  `c5b2ad7` (22 Oct 2026) GitHub's branch build, *pages build and deployment* (Jekyll, no
  gate), deployed at 11:23:19 UTC, and `pages.yml` deployed the allowlisted artifact at
  11:27:16 after its four gates passed. Both runs report success. The live site is the second:
  its `last-modified` is 11:27:18, its `index.html` is byte-identical to `c5b2ad7`, and paths
  outside the allowlist that the branch build served on 27 Sep 2026 (§1) now return **404** —
  `AGENTS.md`, `docs/HANDOVER.md`, `tools/validate.mjs`, `agent/`, `docs/`, `.control-room/`.
  So the gate decides what stays published, but **not what is published first**: for about four
  minutes after each push the branch build's output was live, and if a gate fails, nothing
  replaces it. The Pages source setting itself could not be read (the API path is refused by
  this environment's proxy); §3.1 is the setting that would leave one publisher.
- **No QA check is shown to be required before a merge.** The QA run on `c5b2ad7` failed
  (its browser job, `docs/BROWSER-QA.md` §8) on a commit already on `main`; the public rulesets
  endpoint for `main` returned none. This does not prove no rule exists — an admin can bypass
  one — only that nothing measured shows it.
- **Redirects:** `http://eudigitalpolicy.eu/`, `http://www.…` and `https://www.…` answer **301**
  to `https://eudigitalpolicy.eu/`, and the old `github.io` address answers 301 to the same.
- **`Strict-Transport-Security` is not sent** (settled 24 Oct 2026). This container's proxy hid
  the header on hosts that send it, so the question was put to hstspreload.org's API, which
  fetches from its own network: for `eudigitalpolicy.eu` it answers `response.no_header`, "No
  HSTS header is present on the response"; for `github.com`, the control, it reports no error.
  No other security header
  (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`,
  `Permissions-Policy`) was observed as a response header; the CSP is in a `<meta>` (§4).

### 1b. 24 Oct 2026 — the settings, as the author reported and as measured

- **Pages source: switched to "GitHub Actions" by the author on 24 Oct 2026.** The merge of
  pull request #14 (`9891958`, 09:02:56 UTC) was still published by the branch build, at
  09:03:57: for those minutes `docs/HANDOVER.md` and `AGENTS.md` returned **200** on the live
  site (measured). `pages.yml` run 22 replaced it at 09:07:16 and they returned 404 again
  (measured). So either the switch came after the merge or it had not taken effect then. **The
  next push to `main` settles it**: with the setting in force, no "pages build and deployment"
  run appears and the private paths never answer 200. **Settled the same day:** the merge of
  pull request #15 (`74d2341`, 09:11:37 UTC) started only the "Pages" and "QA" workflows; the last
  "pages build and deployment" run is #103, for the earlier merge. The private paths stayed 404
  (measured 09:15 and after). The switch holds, and `pages.yml` is now the only publisher.
- **Rulesets: none.** The repository's Rulesets page reads "You haven't created any rulesets"
  (the author's screenshot, 24 Oct 2026). Nothing requires a QA check before a merge; §3.2 is
  still undone.
- **HSTS: not sent** (§1a).

## 2. The gate — `.github/workflows/pages.yml`

On a push to `main` (or by hand), four gate jobs run on the exact commit, and the site is
built and deployed **only if all four pass**:

| Job | What it runs | Fails on |
|---|---|---|
| Gate — data, markup and evidence | `tools/commit-evidence.mjs` (a commit changing a published file carries an `Evidence:` trailer), `validate.mjs`, `i18n-audit.mjs`, `design-qa.mjs` (incl. the CSP and inline-handler checks), `freshness.mjs`, `evidence-audit.mjs`, `node --test tools/selftest.mjs`, the §12 baseline comparison | any error; a validator above its recorded baseline; a published change without an `Evidence:` trailer |
| Gate — public / private boundary | `agent/implement/cli.mjs boundary`, `.control-room/cli.mjs boundary`, `tools/pages-artifact.mjs build` | a credential in the published surface; a Control Room file outside the dot prefix; an incomplete or over-inclusive artifact |
| Gate — browser regression | `agent/browser/cli.mjs --require-browser` | any failing browser check; no browser |
| Gate — adversarial verification | `agent/policy/verify/cli.mjs` | any attack that SUCCEEDS (a `partial` does not block) |

Then `build` assembles the artifact with `tools/pages-artifact.mjs` — **an allowlist of the
website's own files** (the seven pages, `app.js`, `style.css`, `css/`, `js/`, `data/`, `i18n/`,
`fonts/`, `instruments/`, `img/`, `sitemap.xml`) that refuses by name every dot path and `agent/`, `docs/`, `tools/` —
and `deploy` publishes it with `actions/deploy-pages`.

**Why the allowlist matters.** A deployment through Actions does not run Jekyll, so Jekyll's
dot-prefix rule — the only thing that kept `.control-room/` private — no longer applies. The
allowlist replaces it with a stronger rule: nothing is public unless it is named as part of the
website. `tools/selftest.mjs` I2 builds the artifact and asserts `.control-room/`, `agent/`,
`docs/` and `tools/` are absent. Served on its own on 27 Sep 2026, the artifact rendered all
seven pages with no console error, and every private path returned 404.

**The adversarial gate is in the deploy gate since 27 Sep 2026** (`gate-security`). Until then
it was red on purpose — finding HE-04 — and a gate that includes a check that is always red
publishes nothing. The author decided that HE-04 should decide from the separation verdicts
rather than from a list of skipped paths (`docs/PRODUCTION-OPERATING-MODE.md` §4a); the gate is
green, and a deploy is now blocked whenever an attack succeeds. A `partial` does not block.

**What is deliberately not in the gate.** The production-mode checks in `qa.yml` — schedule,
visual standard, separations, traceability — describe how the agent layer operates, not the
published site; they are green and run on every push. The agent suites are not in the deploy
gate either: they test the agent layer, which is not part of the published site. They are in
`qa.yml` and should be required on pull requests (§3). The evidence-trailer rule
(`tools/commit-evidence.mjs`, §5 of the operating-mode document) **is** in the gate, as the
first step of `gate-data`.

## 2a. The release gate — `agent/release/gate.mjs`, inside `build`

*Added 4 Nov 2026. Implemented and tested; **not yet run by GitHub** — it takes effect on the first push to `main` after
it is merged, and §3a lists what must be true outside the tree for it to mean what it says.*

The four gate jobs of §2 say the *site* is sound. They do not say that *this commit* is one a person authorised, or that
*this artifact* is the one built from it. `build` now ends, before `upload-pages-artifact`, with
`node agent/release/cli.mjs gate --ci --head "$GITHUB_SHA" --artifact _site --needs-env NEEDS_JSON`. A non-zero exit means
no artifact is uploaded and `deploy` has nothing to deploy. It is in `build`, not in a job beside it, because a gate
beside the path gates nothing.

| | Checks | Answers |
|---|---|---|
| C1 | `GITHUB_REPOSITORY`, `_REF`, `_EVENT_NAME`, `_WORKFLOW_REF`, `_SHA` against the authorised publisher; the checkout is the commit judged | the change originates from an authorised workflow |
| C2 | full clone; the commit that introduced the gate is an ancestor | the range can be judged at all |
| C3 | `agent/release/workflows.mjs`: 14 checks on every workflow file | `pages.yml` is the only publisher; no direct deploy trigger, alternative entry point or skippable gate exists in the files |
| C4 | GitHub's `toJSON(needs)`: every gate job `success` | required validation succeeded, as reported by GitHub rather than inferred |
| C5, C6 | the decision ledger's chain, signatures, registered reviewers, no simulated entry; append-only across history | the decision record is valid and was not modified after the approval |
| C7 | every commit declaring `Proposal:` traces to a granted, signed, in-scope, unwithdrawn decision that precedes it, ≤ 30 days old | the relevant human approval exists and corresponds to the actual change |
| C8 | agent-attributed commits to the site citing no Proposal | **reported only**; see below |
| C9 | `_site` against the allowlist **and against the commit's own git blobs**; nothing missing; credential scan | the artifact contains only authorised files and is the artifact of this commit |
| C10 | `reviewers.json` against a fingerprint pinned *outside* the repository | the approval's signature is checked against a registry nobody inside the tree could have rewritten |

A condition that cannot be **measured** blocks exactly as a failure does in CI: an unset `needs`, a missing artifact, a run
outside Actions. A local run (`node agent/release/cli.mjs gate`) reports the same conditions and does not block on the
unmeasured ones, because it cannot authorise anything.

**Bypass scenarios, each with the test that refuses it** (`agent/release/selftest.mjs`):

| Scenario | Where it is stopped | Test |
|---|---|---|
| a direct deploy by another workflow, an action (`deploy-pages`, gh-pages), a push to a pages branch, the deployments API, or a `pages: write` grant | C3 / W1 | C3 |
| `pull_request_target`, a schedule, or a push to a branch other than `main` starting a publish | C3 / P1, P1b | C2 |
| removing a gate from `build.needs`, `deploy.needs`, adding `if:`, `continue-on-error`, `\|\| true` or `set +e` to the path | C3 / P3–P6 | C2 |
| deleting the release gate step, or moving it after the upload | C3 / P7 | C2 |
| a manual `workflow_dispatch` from another branch or fork | C1 | G2 |
| a gate job failed, was cancelled or skipped | C4 | G4 |
| a change citing a proposal that nobody decided | C7 | G9 |
| unsigned decision; signed by an unregistered key; revoked reviewer; simulated fixture; edited line | C5 | G10 |
| wrong `Proposal-SHA256` or `Dispatch-Key`; a file outside the approved scope | C7 | G11 |
| approval recorded *after* the change; approval older than 30 days; decided after the commit | C7 | G12 |
| approval later withdrawn | C7 | G13 |
| an agent adds its own key to `reviewers.json` and signs its own approval | C10 (the pin) | G14 |
| a ledger line edited after an approval | C5, C6 | G10 |
| an extra file, a changed byte, a missing file, a dot path or a credential in `_site` | C9 | G6, G7 |
| the commit deployed is not the commit judged | C1, C9 | G2, G7 |

**What the gate does not do, and why that is stated here.**

- **It does not block agent-attributed commits that cite no Proposal (C8).** Today every change to this site is a session's
  commit on the author's word in `docs/ROADMAP-v2.md` §8, merged by the author in a pull request, and the approval of that path
  is the merge. The gate cannot tell that merge from an unreviewed one; branch protection (§3a-2) is the control that can —
  **but since 11 Nov 2026 the ruleset requires no review** (the author's decision, §3a-2): the merge by the author is the whole
  of the approval, and nothing requires a second person.
  `--strict-unledgered` would make it block, and would block every such change until it goes through the dispatcher. Whether
  to switch it on is the author's decision and is **not** made here.
- **It is code in the repository it guards.** Whoever can change `agent/release/` and `pages.yml` in one merge can change what
  the gate asks. §3a-2 and §3a-4 are what protect the gate; with no required review (§3a-2, 11 Nov 2026), what stops a pull
  request that changes `reviewers.json` is C10's pin outside the tree (§3a-5), not a second reader.
- **It cannot show a change is true** (§7).

## 3. Manual repository settings required

**None of the following can be done from the repository, and until they are done the gate in
§2 gates nothing.** Each is a setting on github.com, by someone with admin rights.

1. **Switch the Pages source.** *Done by the author on 24 Oct 2026; to be confirmed on the next
   push to `main` (§1b).* Settings → Pages → Build and deployment → Source: **GitHub
   Actions**. From then on the site is published only by `pages.yml`, only after its gates
   pass, and only from the allowlisted artifact. Before this, `pages.yml`'s deploy job has no
   effect and GitHub's branch build keeps publishing every push.
2. **Protect `main`** — *not done: no ruleset exists (24 Oct 2026, §1b).* (Settings → Rules →
   Rulesets → New branch ruleset, target `main`):
   - Require a pull request before merging.
   - Require status checks to pass, and add these check names from `qa.yml`:
     `The four validators`, `The agent suites`, `Public website / private control plane`,
     `Website health monitor`, `Browser regression suite`, `The adversarial verification gate`,
     `Production operating mode`. The last two were red by decision until 27 Sep 2026 and could
     not be required then; both are green now (§2).
   - Block force pushes. Restrict deletions.
   - **Do not** require a review: the author removed "Require review from Code Owners" on 11 Nov 2026 (§3a-2).
3. **The `github-pages` environment** (created by the first Actions deployment): Settings →
   Environments → github-pages → Deployment branches: **`main` only**.

**Why 1 matters more than it reads (§1a, §1b):** while both publishers deploy, `pages.yml`'s
gate governs what stays live but not what goes live first — measured again on 24 Oct 2026, when
the branch build put `docs/` on the live site for about three minutes.

With 1–3 in place the chain is: a change arrives by pull request → `qa.yml` must be green to
merge → the merge to `main` triggers `pages.yml` → the site checks run again on the merged
commit → only then is the site deployed. **QA FAIL → no merge, and no deploy.**

Without 1, the honest description is the one `AGENTS.md` has always given: a push to `main`
publishes, and CI makes a failure visible, not blocking.

## 3a. External settings the release gate depends on

**None of these can be set from the repository, and the gate does not say they are set.** `node agent/release/cli.mjs
status` lists them as *not measured* for that reason. Status as of 4 Nov 2026 is what the repository can show, which is
nothing about any of them. **Rows 1, 2, 4 and 5 now carry the author's report of 6 Nov 2026**: it is the author's word,
it is not something the tree can show, and the deploy record after the table is the only part of it that a log supports.
**Rows 2 and 3 carry a change reported by the author on 11 Nov 2026**: the required code-owner review was removed.

| # | Setting | Why the gate needs it | Status |
|---|---|---|---|
| 1 | Settings → Pages → Source: **GitHub Actions** (§3.1) | otherwise a push to `main` is published by GitHub's branch build, which no workflow can gate | reported done 24 Oct 2026 (§1b); **reported in place again by the author on 6 Nov 2026**; the deploy record below is consistent with it; not measurable from the tree |
| 2 | **Ruleset on `main`**: require a pull request, require the `qa.yml` checks, block force pushes and deletions (§3.2). **No required review**: "Require review from Code Owners" was in this row until 11 Nov 2026 | the gate trusts the merge. With no required review, C8's commits are unreviewed by construction, and the author's merge is the approval (§2a) | **reported done by the author on 6 Nov 2026, with the code-owner review; the review was reported removed by the author on 11 Nov 2026** (the rest of the ruleset left as it was; `docs/ROADMAP-v2.md` §8). Pull request #94 merged on 11 Nov 2026 with no review recorded on it — consistent with the removal, not proof of it; "not done" on 24 Oct 2026 (§1b: "none") and on 4 Nov 2026; not measurable from the tree |
| 3 | **`CODEOWNERS`** naming the owner for `/.github/`, `/agent/release/`, `/agent/implement/decisions/`, `/tools/pages-artifact.mjs` | it took effect only with row 2's code-owner review; **it no longer does** | **file on `main`** (`.github/CODEOWNERS`, added 5 Nov 2026 at the owner's request), **kept and now inert**: row 2 no longer requires a code-owner review (11 Nov 2026), so no path above needs the owner's review to merge. The file is not deleted, because turning the requirement back on makes it work again |
| 4 | **`github-pages` environment → Deployment branches: `main` only** (§3.3), and **required reviewers** if the owner wants a manual stop before deploy | a `workflow_dispatch` from another ref cannot deploy; C1 checks the ref, this makes GitHub check it first | **reported done by the author on 6 Nov 2026** (`main` only; whether required reviewers were added was not said); "not done" on 4 Nov 2026; not measurable from the tree |
| 5 | **Repository variable `RELEASE_REVIEWER_REGISTRY_SHA256`** = the output of `node agent/release/cli.mjs status` ("registry fingerprint") | C10: pins the reviewer registry outside the tree. Unset, any run relying on a signature is refused | **reported set by the author on 6 Nov 2026**, to the fingerprint `node agent/release/cli.mjs status` printed that day for the one-reviewer registry (`rev-andrea`, added 5 Nov 2026): `4b4a0efb3e024584545d33de8d59ba39bf72455c315d6a0a5c614766f86bc259`; "not set — there is no registry yet" on 4 Nov 2026; whether the stored value equals that fingerprint is not measurable from the tree, and it changes whenever `reviewers.json` does |
| 6 | Keep the reviewer's **private key** outside the repository and every agent's reach | it is the whole of the approval's authenticity | the owner's |

**The deploy record, 6 Nov 2026.** Run 85 of `pages.yml` (actions/runs/42138109579): a push to `main` by `andreatosti2001`,
commit `345ac7556d223f63e9285468d86062addd9773ab` (the merge of #77), **success**. Its jobs, as the run page lists them: the
four gates ("data, markup and evidence", "public / private boundary", "browser regression", "adversarial verification"),
"Build the artifact, then the release gate", and "Deploy". The log of "Deploy", supplied by the author, shows
`actions/deploy-pages@v5` creating the Pages deployment for that commit from the `github-pages` artifact of the same run
and reporting success at `https://eudigitalpolicy.eu/`. That is the record the condition `deploy_gate_exists` names
("a deployment record showing pages.yml published the live site"). **What it does not show:** that the settings of rows 2, 4
and 5 are in place, which no log of this run carries; and the condition stays *unmeasurable* in
`node agent/production/cli.mjs readiness`, because it reads only the tree.

## 3b. How a person makes the approval the gate checks for

The mechanism exists; **no authentic approval has been made, and this document does not make one.** An approval is a person's
act and a tool will not simulate it (`agent/implement/decisions/README.md`).

1. **Once.** `node agent/release/cli.mjs keygen --out-dir ~/.eu-digital-policy-keys --reviewer-id rev-<you> --name "<your name>" --role "repository author"`.
   The private key is written outside the repository (the command refuses a path inside it) and is never printed.
2. **Once.** Put the public entry it prints into `agent/implement/decisions/reviewers.json` as `{"reviewers":[ … ]}`, in a pull
   request **you** review and merge (step 4 of §3a makes the registry yours). Then set the repository variable of §3a-5 to the
   fingerprint `node agent/release/cli.mjs status` prints.
3. **Per proposal.** Inspect what the record asks you to check: `node agent/release/cli.mjs lifecycle --proposal <id>`, then the
   proposal itself in `agent/records/` or the Control Room's queue — its `evidence`, `proposed_change.operations` (each carries
   `current` and `proposed`), `risk`, `rollback_plan`, and the `what_to_check` of its `ApprovalRequest`. Then decide:
   `node agent/implement/cli.mjs decide --proposal <id> --grant --by "<your name>" --role "repository author" --sign-key <your private key> --note "…"`
   (the Control Room's `POST /api/review` is the other writer; it authenticates you and does not yet sign).
4. Commit `decisions.jsonl` in its own commit, **before** the change. C7 refuses an approval that arrives after the change it
   approves.
5. `node agent/release/cli.mjs dispatch --proposal <id>` (rehearsal), then `… --execute --as-of <date>`; push the `release/…`
   branch; open the pull request; merge it. `pages.yml` runs the gate on the merged commit.

Approvals are **per proposal content**: editing the proposal afterwards voids the decision (the fingerprint no longer
matches); denying it afterwards withdraws it; 30 days after the decision the gate calls it stale.

## 4. Security headers

| Protection | State | How |
|---|---|---|
| Content-Security-Policy | **In place** | `<meta http-equiv>` in every page, generated by `tools/_footer.mjs` from `tools/csp.mjs`. Scripts: `'self'` plus the SHA-256 of each page's inline scripts — no `'unsafe-inline'`, no `'unsafe-eval'`. `connect-src 'self'`, no objects, frames or workers. `design-qa.mjs` fails a page whose inline script is not hashed. Verified in Chromium on 27 Sep 2026: every page renders with zero CSP violations. |
| CSP `style-src` | **`'self'` only, since 27 Sep 2026** | Until then `'unsafe-inline'` was a stated trade-off for the `style="…"` attributes pages and modules wrote. Fixed values are now classes (end of `css/tools.css`); values computed at run time go through the CSSOM (`js/format.js` `applyGeometry`), which the policy allows. Three guards: `tools/csp.mjs` fails a page carrying a style attribute or `<style>` element; `design-qa.mjs` fails a module that writes one into markup; the browser suite's `csp:<page>` check records every `securitypolicyviolation` in Chromium and fails on any. All seven pages: zero refusals. |
| Referrer-Policy | **In place** | `<meta name="referrer" content="strict-origin-when-cross-origin">` on every page. |
| Inline event handlers | **None; now an error** | The three `onclick=""` in `index.html` moved into `app.js` (`data-action`). `design-qa.mjs` errors on any `on…=` attribute. |
| Strict-Transport-Security | **Not sent on the custom domain** | Sent on `github.io` (measured 27 Sep 2026, §1). On `eudigitalpolicy.eu` it is absent: hstspreload.org's check, from its own network, reports "No HSTS header" (24 Oct 2026, §1a). GitHub Pages offers no setting for it, and a `<meta http-equiv>` cannot carry it — browsers honour HSTS only as a response header. HTTP is redirected to HTTPS (301), which covers every visit after the first plain-HTTP request. The remedies are outside this repository: a host or proxy in front of Pages that sets the header (and then HSTS preload, which requires it) — a hosting change for the owner to decide, not made here. |
| CSP `frame-ancestors`, X-Frame-Options | **Not possible** | Ignored in a meta policy; Pages sends no such header. Clickjacking protection would need a host or proxy that sets headers. |
| X-Content-Type-Options, Permissions-Policy | **Not possible** | Headers only; Pages cannot send them. |

## 5. The Control Room — hidden is not secure

`.control-room/` is the private administrative interface a person uses to observe, review and
decide (`docs/CONTROL-ROOM.md`). Its security does **not** rest on its being hard to find:

- **The browser holds no secret.** No token, key, password or credential is in any file the
  website loads. `agent/implement/cli.mjs boundary` scans 364 files against 11 credential
  shapes (0 blocking; the 12 matches are declared test fixtures outside the site), and the
  allowlisted Pages artifact contains no credential-shaped string (checked 27 Sep 2026).
- **The public page cannot grant anything.** `js/threshold.js` (the "thirty-two paths" palette
  affordance) imports nothing, issues no network request, holds no endpoint and reads its
  target from a `<meta name="eu-control-room">` that no page declares. The phrase is not a
  credential: it is in a file served to every reader. `agent/policy/selftest.mjs` 18–20 and the
  browser suite's `threshold` checks assert this.
- **Privileged operations are server-side only.** The Control Room is a Node server
  (`.control-room/server.mjs`) that authenticates every privileged request (OIDC with PKCE,
  tested against a local identity-provider stub and never against a real one) and then authorizes it against the proposal's
  autonomy class, and audits it. The shape is **browser → authenticated server → secret →
  action**, never **browser → embedded secret**. It exposes no route that deploys, deletes or
  publishes (`.control-room/cli.mjs routes`).
- **It is not deployed anywhere.** No production Control Room instance exists; nothing here
  has spoken to a real identity provider. Those are the two boundaries this repository still
  cannot test (`docs/SECURITY-VERIFICATION-2026-09-08.md`).
- **The dot prefix is a publication boundary, not a security control**, and after §3.1 it is
  no longer even the publication boundary: the allowlist is.

No backend was added for this: the public site needs none, and the Control Room already is the
authenticated server the model requires.

## 6. Indexing

*Rewritten 27 Sep 2026; the full account is `docs/SEO-OPERATIONS.md`, the measurements behind it
`docs/SEO-AUDIT-2026-09-27.md`.*

- **Instrument pages.** Each substantive instrument has a pre-rendered page at `instruments/<id>/`
  (12 on 27 Sep 2026), written by `tools/_footer.mjs` from the data through the same renderer the
  browser runs. Its canonical, title, `<h1>` and structured data are in the HTML and do not change
  on load. `instrument.html?id=…` no longer rewrites its canonical: it forwards to the
  instrument's page, or marks a thin record `noindex`. The Pages artifact includes `instruments/`
  and `img/` (the social cards).
- `sitemap.xml` lists exactly the 18 indexable routes, each with a `<lastmod>` that is the newest
  verification date among the records the page renders — a date the data holds, not the day the
  generator ran. `tools/seo-audit.mjs` fails on any divergence, in CI and in the deploy gate.
- **`robots.txt` exists since 21 Oct 2026.** Until the custom domain (§8) crawlers read it only at
  the host root (`andreatosti2001.github.io`), which this project did not have. It is generated from
  `BASE`, names the sitemap, keeps crawlers out of `/agent/`, `/docs/` and `/tools/`, and is in the
  deploy allowlist. `docs/SEO-OPERATIONS.md` §2.
- **Languages.** Since 22 Oct 2026 the brief has a page per language, `it/`, `fr/`, `es/`,
  generated by `tools/_footer.mjs` and published by the allowlist (`EDITION_DIRS`, read from the
  register). `?lang=xx` forwards to them. Each is `noindex`, with no canonical, no `hreflang` and
  no sitemap entry, until its translation review is complete (`docs/SEO-OPERATIONS.md` §6); the
  same generator then makes it indexable. No build step: the pages are committed, and CI fails if
  they are stale.

## 8. The custom domain (21 Oct 2026)

On the author's decision the site moves from `https://andreatosti2001.github.io/Eu-Digital-Policy/`
to `https://eudigitalpolicy.eu/`, registered by the author on 21 Oct 2026 (it replaced the
placeholder `eu-digital-policy.eu` the same day).
In the tree that is two lines: `CNAME` and `BASE` in `tools/_footer.mjs`, then
`node tools/_footer.mjs`. Every canonical, `og:url`, sitemap entry and JSON-LD `@id` follows; every
internal link is relative and was already measured under a prefix (`checkDeployedSubpath`), so none
changes. **Merge it only after the domain answers**: on 21 Oct 2026, just after registration, `eudigitalpolicy.eu` did not
resolve, and while Pages deploys from the branch, a `CNAME` on `main` sets the custom domain at once.

What only the owner can do, in this order:

1. **Register the domain** — *done 21 Oct 2026, `eudigitalpolicy.eu`, at Porkbun* — and keep it
   renewed: a lapsed domain is worse for citations than the `github.io` address. Porkbun warns that
   a `.eu` can be deleted *before* its expiry date, so auto-renew must stay on and there is no grace
   period to count on. Eligibility (EU/EEA citizenship, residence or establishment) must hold for
   the domain's whole life. A different name means changing `CNAME` and `BASE` and regenerating.
2. **Verify it for the account** (Settings → Pages → *Add a domain* under the account's settings),
   which stops anyone else's repository claiming it.
3. **DNS at the registrar**, for the apex: four `A` records — `185.199.108.153`,
   `185.199.109.153`, `185.199.110.153`, `185.199.111.153` — and, for IPv6, four `AAAA` records —
   `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`;
   for `www`, a `CNAME` to `andreatosti2001.github.io`. Remove any other `A`/`AAAA`/`ALIAS` on
   the apex. These are GitHub's published Pages addresses (read from docs.github.com on
   21 Oct 2026) — check them against GitHub's
   documentation on the day, not this file.
4. **Merge `claude/p1-custom-domain`**, then Settings → Pages → Custom domain: the same name, wait
   for the DNS check, then tick **Enforce HTTPS** once the certificate is issued.
5. **Search Console:** add a *Domain* property for the new name (DNS TXT verification), submit
   `https://<domain>/sitemap.xml`, and keep the old URL-prefix property to watch the redirect.

GitHub redirects the old `github.io` address to the custom domain, so existing links keep
working while the custom domain is set; they stop if it is removed.

## 7. What none of this proves

- That a deployed page says anything true. The gates check structure, consistency and
  provenance; `docs/VERIFICATION-POLICY.md` §3 still applies.
- That the settings in §3 and §3a have been applied. Nothing in this repository can read them.
- That the release gate (§2a) has exercised every condition. It has run in GitHub Actions: the logs of `pages.yml` runs 86 (`6bfe537`)
  and 87 (`149e9b7`), read on 6 Nov 2026, show C1, C2, C3, C4, C6, C9 and C10 satisfied, C5 and C7 not measured (no decision ledger
  and no commit declaring a Proposal) and C8 reported (five agent-marked commits, not blocking). An earlier pair of runs, 76 and 77,
  is recorded in `docs/ROADMAP-v2.md` §8 (5 Nov 2026). A pass with C5 and C7 unmeasured says nothing about whether an approval is
  authentic or whether an agent change was decided before it was made.
- That any approval is authentic. The mechanism (signed, chained, pinned — §3b) exists and a person has used it once: the ledger
  holds one entry, the author's signed grant of `prop-docs-ea57404dc452` (6 Nov 2026), which the gate in run 100 found chained,
  signed by a registered reviewer and not simulated. That the key is held by the person it names, that the registry is honest and
  that the person read what they signed are what a signature cannot show.
