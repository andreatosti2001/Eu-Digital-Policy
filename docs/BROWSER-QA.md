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

## 3. Coverage — the fifteen areas SESSION 19 names

Measured on the real site as at **2026-09-03**: **121 checks · 116 pass · 3 fail · 2
undecidable**, across 17 areas, Chromium 141.0.7390.37, 1,397 requests, every one to the
local origin.

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

**None of the three has been fixed here.** They are findings, and fixing them is Class C
interface work that needs a proposal and a human decision — which is exactly what
`agent/implement/` refuses to do without. They are carried in `docs/HANDOVER.md`.

---

## 5. The two undecidables, and why they are not passes

**`keyboard:focus-visible`.** Focusing a link produced no change in computed
`outline`/`box-shadow`/`border-color`. Comparing computed styles is not the same as
establishing that a focus indicator is *perceivable*: no contrast is computed and no pixels
are compared. Reporting this as a pass would claim WCAG 2.4.7 coverage this suite does not
have; reporting it as a fail would assert a defect it has not established.

**`a11y:bound`.** Stated on every run, and it is not a check that can pass: no contrast ratio
was computed, no screen reader was run, no pixels were compared. README limitation 7 stands.

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
   than adapting, which understates rather than overstates.
6. **It is not a deploy gate.** `.github/workflows/qa.yml` makes a failure visible. Making
   it blocking needs a branch protection rule, which is repository configuration outside
   this tree.
7. **The fixture server is a fixture.** It binds 127.0.0.1, serves GET and HEAD only, and
   refuses a path outside the repository. It is not the deployment and proves nothing about
   what GitHub Pages serves.
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
