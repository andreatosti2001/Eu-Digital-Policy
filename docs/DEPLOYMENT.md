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
`fonts/`, `sitemap.xml`) that refuses by name every dot path and `agent/`, `docs/`, `tools/` —
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

## 3. Manual repository settings required

**None of the following can be done from the repository, and until they are done the gate in
§2 gates nothing.** Each is a setting on github.com, by someone with admin rights.

1. **Switch the Pages source.** Settings → Pages → Build and deployment → Source: **GitHub
   Actions**. From then on the site is published only by `pages.yml`, only after its gates
   pass, and only from the allowlisted artifact. Before this, `pages.yml`'s deploy job has no
   effect and GitHub's branch build keeps publishing every push.
2. **Protect `main`** (Settings → Rules → Rulesets → New branch ruleset, target `main`):
   - Require a pull request before merging.
   - Require status checks to pass, and add these check names from `qa.yml`:
     `The four validators`, `The agent suites`, `Public website / private control plane`,
     `Website health monitor`, `Browser regression suite`, `The adversarial verification gate`,
     `Production operating mode`. The last two were red by decision until 27 Sep 2026 and could
     not be required then; both are green now (§2).
   - Block force pushes. Restrict deletions.
3. **The `github-pages` environment** (created by the first Actions deployment): Settings →
   Environments → github-pages → Deployment branches: **`main` only**.

With 1–3 in place the chain is: a change arrives by pull request → `qa.yml` must be green to
merge → the merge to `main` triggers `pages.yml` → the site checks run again on the merged
commit → only then is the site deployed. **QA FAIL → no merge, and no deploy.**

Without 1, the honest description is the one `AGENTS.md` has always given: a push to `main`
publishes, and CI makes a failure visible, not blocking.

## 4. Security headers

| Protection | State | How |
|---|---|---|
| Content-Security-Policy | **In place** | `<meta http-equiv>` in every page, generated by `tools/_footer.mjs` from `tools/csp.mjs`. Scripts: `'self'` plus the SHA-256 of each page's inline scripts — no `'unsafe-inline'`, no `'unsafe-eval'`. `connect-src 'self'`, no objects, frames or workers. `design-qa.mjs` fails a page whose inline script is not hashed. Verified in Chromium on 27 Sep 2026: every page renders with zero CSP violations. |
| CSP `style-src` | `'self' 'unsafe-inline'` — a stated trade-off | Several modules build markup with `style="…"`. A style attribute cannot run script. Removing it is future work. |
| Referrer-Policy | **In place** | `<meta name="referrer" content="strict-origin-when-cross-origin">` on every page. |
| Inline event handlers | **None; now an error** | The three `onclick=""` in `index.html` moved into `app.js` (`data-action`). `design-qa.mjs` errors on any `on…=` attribute. |
| Strict-Transport-Security | Sent by GitHub Pages | Measured (§1). Not configurable here. |
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
  proved against a local identity-provider stub) and then authorizes it against the proposal's
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

- `sitemap.xml` (generated by `tools/_footer.mjs` from `BASE` and `data/instruments.json`) lists
  the six top-level pages and one URL per instrument. It carries no `<lastmod>`, because the
  only date the generator could write is the day it ran.
- `instrument.html` rewrites its canonical and `og:url` to `?id=…` once it knows which
  instrument it shows; the static tag names the chooser page.
- **There is no `robots.txt`, deliberately.** This is a project site under `/Eu-Digital-Policy/`;
  crawlers read `robots.txt` only at the root of the host (`andreatosti2001.github.io`), which
  this repository does not control. A file here would look like a policy and be ignored.
- **Languages.** Italian, French and Spanish are client-side overlays of the same URL. `hreflang`
  alternates need a distinct URL per language, which would mean pre-rendering `/it/`, `/fr/`,
  `/es/` pages — a build step, which is a red-tier architectural change in this repository.
  So no `hreflang` is emitted: an alternate pointing at the same URL is a false statement to a
  crawler. Every page declares `lang="en"`, and the locale switch sets `lang` on `<html>`.

## 7. What none of this proves

- That a deployed page says anything true. The gates check structure, consistency and
  provenance; `docs/VERIFICATION-POLICY.md` §3 still applies.
- That the settings in §3 have been applied. Nothing in this repository can read them.
