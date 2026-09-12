# Browser QA

**SESSION 19.** The repository's own browser regression suite: `agent/browser/`.
**Status:** operational. Runs locally and in GitHub Actions.
**Read with:** `docs/IMPLEMENTATION-QA.md` (which makes it a gate) and `docs/UX-AUDIT.md`
(which said what a static read could not settle).

---

## 1. What this is, and why it exists

`docs/CURRENT-ARCHITECTURE.md` §12 ends with a sentence this session is the answer to:

> **There is no test runner.** The Playwright suites used during development live outside
> this repository.

And AGENTS.md carries the consequence as a known hazard: *"Nothing here has ever opened a
page."* `agent/ux/` audited the interface by reading the markup, the stylesheets and the
modules, and produced **twelve open questions** saying what a static read could not settle
(`docs/UX-AUDIT.md` §7). This suite is the first thing in this repository that opens one.

**It installs nothing.** No `package.json`, no lockfile, no Playwright. It drives a browser
already on the machine over the Chrome DevTools Protocol, using Node 22's global
`WebSocket`. That is not minimalism for its own sake: adding a dependency here is red tier
(`docs/AUTONOMY-POLICY.md` Class D), and
`agent/schemas/contracts/implementation-proposal.mjs` already refuses one by contract. A
suite that had to violate the architecture to test it would be testing a different
repository.

```
node agent/browser/cli.mjs                     # everything
node agent/browser/cli.mjs --quick             # a subset
node agent/browser/cli.mjs --only search,dialogs
node agent/browser/cli.mjs --json              # incl. the QAResult check
node agent/browser/cli.mjs --require-browser   # a missing browser is a hard failure
node --test agent/browser/selftest.mjs         # 19 tests
```

| Exit | Means |
|---|---|
| `0` | every check passed, possibly with an undecidable named |
| `1` | a check failed, or the run threw |
| **`2`** | **no browser was found — the suite did not run** |

**`2` rather than `0` is the design.** A suite that exits 0 when it could not open a browser
teaches a pipeline that green means checked. `--require-browser` turns the 2 into a 1 for CI,
where there is no human to read "skipped".

---

## 2. The three results a check can have

| Result | Means |
|---|---|
| `pass` | the check established what it set out to establish |
| `fail` | it established a defect |
| `undecidable` | **it established neither**, and says why |

`undecidable` is first-class for the same reason `absent` is a first-class evidence kind in
`agent/schemas/common.mjs`: a check that cannot settle its subject must say so rather than
pass by default. The runner counts undecidables separately and **never folds them into the
pass count**; `verdictOf()` returns `pass_with_findings` where any are present.

---

## 3. Coverage — the areas the suite names

Measured on the real site as at **2026-09-12**: **145 checks · 144 pass · 0 fail · 1
undecidable**, across 19 areas, Chromium 141.0.7390.37, 1,474 requests, every one to the
local origin.

SESSION 19 measured **121 checks · 116 pass · 3 fail · 2 undecidable** across 17 areas on
2026-09-03. What moved between the two: the three failures are fixed in the WEBSITE (§4a),
one undecidable was a defect in a CHECK and now passes (§5), and SESSION 30 added a
nineteenth area — the site served at its published GitHub Pages subpath, 15 checks (§5b).

| SESSION 19 asks for | Where | Checks | What it establishes that nothing else here can |
|---|---|---|---|
| every major page loads | `checkPageLoads` | 21 | `design-qa.mjs` can see `<div id="dnaTable">` in the markup. It cannot see whether anything ever put a table in it. |
| representative instrument views | `checkInstrumentView` | 2 | that `instrument.html?id=gdpr` renders, and that an **unknown** id renders a stated absence rather than a plausible empty page |
| search | `checkSearch` | 3 | that `/` opens the palette, focus lands in the input, typing produces results, Escape closes it |
| glossary | `checkGlossary` | 2 | that clicking a term shows a definition |
| comparison views | `checkComparison` | 2 | that the DNA grid has rows AND columns, and that toggling a dimension changes it — a control that renders and does nothing is invisible to a static read |
| evidence interfaces | `checkEvidence` | 3 | that the bibliography renders entries, that the self-citation count resolves past "Counting…", and that the **derived** evidence grades actually derived |
| applicability | `checkApplicability` | 4 | including the one that matters most on this site: that a rendered answer never presents an absence of a matching rule as a negative finding (`AI-SAFE-BOUNDARIES` §0.5) |
| language switching | `checkLanguageSwitching` | 3 | `i18n-audit.mjs` compares the register to the markup. It cannot pick Italian and read the result. |
| navigation | `checkNavigation` | 2 | including **with scripting disabled**, which is where finding 1 below came from |
| mobile layouts | `checkViewports` | 15 | horizontal overflow at 390 / 820 / 1440 px, per page |
| keyboard navigation | `checkKeyboard` | 1 + 3 | tab order, accessible names, focus indicator |
| dialogs / interactions | `checkDialogs` | 5 | `aria-modal`, accessible name, background inertness, a focus trap tested with 25 real Tab presses, the theme toggle |
| internal links | `checkInternalLinks` | 1 | every distinct internal target on every page, followed with a real HEAD request |
| console errors | in `checkPageLoads` | 14 | console errors AND uncaught exceptions, kept apart — the site logs `[shell] failed` deliberately, and a thrown `TypeError` is a different fact |
| basic accessibility | `checkAccessibility` | 40 | the **rendered** outline: heading jumps, duplicate ids, missing alt, landmarks, `lang` |
| *(added)* no third-party request | `checkNoThirdParty` | 1 | `design-qa.mjs` errors on a third-party `<script>` in the markup. This measures it at the network layer, where a request a module makes at runtime is visible. |
| *(SESSION 30)* the published subpath | `checkDeployedSubpath` | 15 | the site served where it is actually deployed — a GitHub Pages **project** site one path segment down. A root-relative reference resolves at `/` and 404s there, and no run before this one could have told the difference. |

---

## 4. What it found — three defects the existing validators cannot see

**1 · With scripting off, the site has no navigation, and the `<noscript>` notice does not
say so.** `docs/UX-AUDIT.md` finding 3 established that five of seven pages are linked from
no markup anywhere, because `js/shell.js` builds the nav at runtime. That was a reading of
the source. This is a measurement: `instruments.html` loaded with script execution disabled
links to **none** of the six top-level pages, and its `<noscript>` notice — which lists
eight things that will not appear — does not list navigation among them.

**2 · The skip link is the tenth focusable element in the rendered page.** Every page carries
`<a class="skip-link">` as the first element in `<body>`, and `design-qa.mjs` confirms it
resolves. But `js/shell.js:258` inserts the chrome at `document.body.firstChild` — *ahead of
it*. A keyboard reader must tab through the entire navigation to reach the link that skips
the navigation. Nothing that reads the markup can see this; the markup is correct.

**3 · `enforcement.html` jumps h2 → h5 in its rendered outline.** The register renders each
pipeline stage as an `<h5>` directly under the `<h2>` naming the company.
`design-qa.mjs` checks heading order in the markup, where those headings do not exist —
`js/enforcement-page.js` creates them.

**None of the three was fixed in SESSION 19.** They are findings, and fixing them is Class C
interface work that needs a proposal and a human decision — which is exactly what
`agent/implement/` refuses to do without.

### 4a. All three are fixed in SESSION 30, and each was a defect in the WEBSITE

The decision came from the repository author, in a session instruction that named the three
by their symptoms and required them repaired at root cause rather than removed from the
suite. Each fix is the smallest change that makes the measured statement false:

**1 · The no-JS notice now names the navigation, and supplies it.** `tools/_footer.mjs`
regenerates the `<noscript>` block into all seven pages from one source, and the block now
lists the site navigation among what will not render *and* carries the six destinations as
links. Both halves of the finding are answered: a reader with scripting off is told, and is
not stranded. **The nav list is READ out of `export const NAV` in `js/shell.js`** rather than
retyped — one home per fact, the same way `agent/implement/baseline.mjs` parses §12 rather
than restating it — and the generator throws rather than emitting a plausible list if that
array stops being readable. `<noscript>` content is inert when scripting is on, so the page a
reader with JavaScript receives gains no element, no id and no focusable control.

This is the route `agent/ux/lenses.mjs` itself proposed, in the half of its recommendation
that says "add navigation to the list in the `<noscript>` notice, which `tools/_footer.mjs`
regenerates across all seven pages from one source".

**2 · The chrome is inserted after the skip link.** `initShell()` now asks for
`a.skip-link` and inserts the header with `insertAdjacentElement('afterend', …)` when it is a
direct child of `<body>`, falling back to the old `document.body.firstChild` when there is no
skip link to sit behind. The skip link is the first focusable element in the rendered page on
every page the suite loads.

**3 · The pipeline stage panels are `h3`.** `h5` was a type size chosen in the stylesheet,
not a level in the document: the panels are direct subsections of the record whose heading is
the `<h2>`, alongside "Legal basis" and "Requires verification", which were already `h3`.
`css/tools.css` sizes that heading itself — font family, size, letter-spacing, transform,
weight, colour and margin are all declared on the rule — so **the rendered appearance is
unchanged**. §14 of the session brief forbids a visual redesign and this is not one.

---

## 5. The undecidables

SESSION 19 reported two. **One was a defect in the check and is now decided; one is a
statement of what the suite did not establish and stays.**

**`keyboard:focus-visible` — was a defect in the CHECK, and now passes.** It reported that
focusing a link produced no change in computed `outline`/`box-shadow`/`border-color`. It was
measuring nothing. `checkKeyboard` presses `Tab` a few lines earlier, which focuses the first
focusable element, and `document.querySelector('a[href], button')` then returns *that same
element* — so the "before" style was read off an already-focused element and compared with
itself. `differs` was false by construction, and nothing about the page could have changed
it. Measured directly on `instruments.html`: the element examined is `a.skip-link`, it is
already `document.activeElement`, it already matches `:focus-visible`, and its outline
already reads `solid 2px` before `el.focus()` is called.

The check now blurs first, drives focus with a real `Tab` — because `:focus-visible`, which
is what `css/tokens.css` actually styles, is a question about how focus arrived — and
compares. The site's focus indicator is real and always was: `none 0px` → `solid 2px`. The
invariant is unchanged; what changed is that the check now measures it. The perceptual caveat
is kept verbatim on the pass: this is a computed-style difference, not a WCAG 2.4.7 result.

**`a11y:bound` — stays, and is the last one.** No contrast ratio was computed, no screen
reader was run, no pixels were compared. It is marked in `checks.mjs` as "not a check that
can pass", and that is deliberate: it is the suite stating the boundary of what it
established. Turning it into a pass to reach "0 undecidable" would be rendering an absence of
knowledge as a finding, which `docs/AI-SAFE-BOUNDARIES.md` §0.5 forbids and which is the
single thing this repository is most arranged against. **It is reported as the one remaining
undecidable, and the suite exits 0 with it — which is its documented contract.**

---

## 5b. SESSION 30 · the site at its published address

Deployment is GitHub Pages serving `main` as a **project site** at
`https://andreatosti2001.github.io/Eu-Digital-Policy/`. Every run before SESSION 30 served
the repository at `/`, which is the one layout the deployment is not.

The difference is one path segment and it breaks a static site silently: a root-relative
reference — `/css/tokens.css`, `fetch('/data/claims.json')`, `href="/instruments.html"` —
resolves at the root and 404s under the prefix. `serveSite({ basePath })` now serves the site
where it is published and refuses anything outside the prefix, exactly as a project site
does, and `checkDeployedSubpath` loads all seven pages there.

**Result: 15 checks, all passing.** Nothing here is written root-relative, so the finding is
an absence — and it is an absence the suite could not previously have established. The proof
that the check can fail is in `agent/browser/selftest.mjs`: it copies the tree, rewrites one
`href="css/tokens.css"` to `href="/css/tokens.css"`, and asserts the check reports it — and
that the same reference resolves 200 when the same tree is served at the root, which is the
whole asymmetry.

Reading a 404 needed one addition to `cdp.mjs`: `Network.responseReceived` is now recorded
with its status. `Network.loadingFailed`, which the harness already had, fires on a transport
failure and **not** on a 404 — a 404 is a successful exchange carrying a status — so a
missing stylesheet was previously indistinguishable from a present one.

**What it does not prove.** Nothing in this repository has ever reached the deployed origin:
this environment's network policy refuses `andreatosti2001.github.io` (HTTP 403 on CONNECT,
recorded again in SESSION 30). This is the published *layout*, served locally. It says
nothing about what GitHub Pages does with dot-prefixed paths, about redirect behaviour, or
about the real origin's headers.

---



## 6. Limitations

1. **One browser.** Chromium, headless. No Firefox, no WebKit, no real device. README
   limitation 7's "Chromium only" is unchanged by this suite.
2. **No screen reader, no contrast, no pixels.** The suite reads the DOM and computed
   styles. It closes some of `docs/UX-AUDIT.md` §7's twelve open questions and cannot close
   the perceptual ones.
3. **Network quiet is `settleMs` after the last request**, not Playwright's `networkidle`. A
   renderer slower than 350 ms after its last fetch would be read as not having rendered.
   No such case exists today; it would show as a mount-point failure, not a silent pass.
4. **No visual regression.** Nothing is screenshotted or compared. A layout that renders
   without horizontal overflow and looks wrong passes every check here.
5. **The undecidable checks are judgements about what a check can conclude**, written once
   per check with the reason. A check whose subject moved would report undecidable rather
   than adapting, which understates rather than overstates. **SESSION 30's correction to
   `keyboard:focus-visible` is the counter-case worth remembering**: an undecidable can also
   mean the check was measuring the wrong thing, and the way to tell is to establish WHY it
   could not conclude before touching it. That one was proved — the element it examined was
   already focused by the check's own `Tab` — and only then changed. An undecidable removed
   without that proof is a finding deleted.
6. **It is not a deploy gate.** `.github/workflows/qa.yml` makes a failure visible. Making
   it blocking needs a branch protection rule, which is repository configuration outside
   this tree.
7. **The fixture server is a fixture.** It binds 127.0.0.1, serves GET and HEAD only, and
   refuses a path outside the repository. Since SESSION 30 it can also serve the site under
   the published `/Eu-Digital-Policy/` prefix and refuse anything outside it, which is the
   *layout* a GitHub Pages project site has. **It is still not the deployment**: nothing in
   this repository has ever reached `andreatosti2001.github.io` — this environment's network
   policy refuses it with HTTP 403 on CONNECT, confirmed again in SESSION 30 — so nothing
   here proves what the live origin serves, what it does with dot-prefixed paths, or what
   headers it sets.
8. **`network:first-party` is a statement about the SITE, not about Chromium.** It is
   measured from `Network` events on the page's own CDP session. The browser *process* has
   its own traffic — component updates, safe-browsing, autofill — and a run during
   construction left connection attempts to `www.google.com` and
   `content-autofill.googleapis.com` in this environment's proxy log, **none of them made by
   a page**. `cdp.mjs` suppresses what flags reach (`--disable-background-networking`,
   `--no-pings`, `--safebrowsing-disable-auto-update` and the rest, each listed with its
   reason). It is not claimed to have eliminated it: a browser is not a sandbox, and running
   this suite where outbound traffic matters is a decision to make deliberately.

---

## 7. The two false positives that shaped the harness

Recorded because they are why `cdp.mjs` is shaped as it is, and the next session should not
"simplify" them back.

**A `keyDown` carrying `text` types the character as well as firing the binding.** The first
draft opened the search palette with `key('/', { text: '/' })`, which fired `js/palette.js`'s
`/` binding **and** typed a slash into the input it had just focused. The palette searched
for `/gdpr`, found nothing, and the check reported a working search as broken. `key()` now
sends `text` only when a character is wanted, and says so in its own comment.

**`localStorage` survives a reload, and the language check writes to it.** The language
switch stores the chosen locale in `eupolicy:lang`. Running it on the shared page left every
*later* check reading an Italian DOM — observed as a heading-order finding reported against a
page whose `lang` attribute said `it`. The language check now runs in its own browser
context, which `newPage()` creates precisely so this cannot cross.

---

## 8. Running it in CI

`.github/workflows/qa.yml`, job **browser**. It installs a browser on the *runner* with
`apt` — a runner dependency, not a repository one; nothing is added to the tree — and runs
the suite with `--require-browser`, so a missing browser fails the job rather than skipping
it. The machine-readable result is uploaded as an artifact. The job then asserts the
repository is byte-identical afterwards.

The workflow's final job prints what a green tick does **not** mean: it is not a deploy gate,
the validators do not read prose, no URL has ever been fetched, no contrast was computed, and
106 records still carry an unverified note.
