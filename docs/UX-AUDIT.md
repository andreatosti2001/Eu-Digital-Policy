# The UX/UI Audit Agent

**Agent 8** · `agent/ux/` · SESSIONS 16 and 17 · reference document

> The session brief calls this **Agent 7**. Agent 7 is the Editorial Agent, built in
> SESSION 14 (`docs/EDITORIAL-AGENT.md`). The brief's numbering predates it, exactly as
> SESSION 13's did — `agent/architect/` records the same discrepancy in its own header —
> and it is stated here rather than resolved by renumbering somebody else.

---

## 1 · What it is

The first thing in this repository that asks what the **interface** does to a reader.

`tools/design-qa.mjs` checks structure: one `<h1>`, no skipped heading level, no duplicate
id, a resolving skip link, alt attributes, the token layer first, no third-party resource,
no page-local `<style>`. It says in its own header that this is what it checks. It cannot
tell whether the interface is *legible*, whether focus goes somewhere sensible, or whether
an absence of knowledge reads as a negative finding.

`.agents/skills/ux-audit/` has described that judgement since SESSION 01 and carries the
31-item manual checklist that goes with it. `UXProposal` has existed since SESSION 03 and
had been produced by nothing — precisely where `EditorialProposal` stood before SESSION 14.

This agent fills the gap between them, and it fills it **statically**: it reads the seven
pages, the four stylesheets and the 26 modules, and it never opens any of them.

---

## 2 · The four refusals

**It restyles nothing and drafts nothing.** Every operation on every record — a SESSION 16
finding and a SESSION 17 testable proposal alike — carries a null `proposed`. SESSION 16's
brief is that the agent observes and proposes and does not redesign the site; SESSION 17's
is that proposals are not implemented. Choosing the glyph, the wording, the width or the
palette is deciding what a production site about EU law looks like. The contract refuses a
`finding` whose operation carries a value, and the suite asserts it over every record a
full run produces.

**Nothing here opens a page.** There is no browser, no dependency budget for one
(`docs/AI-SAFE-BOUNDARIES.md` §3), and no screen reader has ever been run against this
site. Every record carries README limitation 7 as a **blocking** open question, quoted
whole rather than paraphrased, plus a second saying no contrast was computed. Every
record's accessibility block is four `false`s with a note saying what that means — which is
why the contract has four booleans and not one `accessible: true`. A finding phrased as
though somebody had looked at a rendered page is refused at the boundary, and the suite
proves the refusal fires.

**Every finding quotes bytes at a file and a line, or it is set aside.** A UX finding is
the easiest thing in this repository to fabricate: "the hierarchy is unclear" cites nothing
and cannot be checked. The suite reads every quote back out of the file it names. A COUNT
is filed as a `measurement` and never as a quoted extract — "no page links to this one" is
not a string in any file, and dressing it as one would be a fabricated quote behind a
checkable-looking locator. Two lenses were doing exactly that, and the suite's byte-check
is what found them.

**It re-reports nobody else's finding.** A missing record is `agent/depth/`'s, a missing
shape is `agent/architect/`'s, a stale sentence is `agent/proposals/editorial/`'s, and a
structural markup defect is already `tools/design-qa.mjs`'s and is passing. `boundary.mjs`
partitions on a declared `about` and nothing may skip it.

---

## 3 · Why the contract grew rather than gained a sibling

No nineteenth contract. `UXProposal` already carried what a change to the interface carries
— pages, components, tokens, the two red-tier booleans, the four-part accessibility block,
a motion note, four validators and a rollback. What it could not hold was the difference
between a **finding** and a **proposal**, whose journey a defect sits on, how bad it is,
and how anyone would know it had been fixed.

Five fields, each because a rule had to be written against it:

| field | the rule it makes checkable |
|---|---|
| `proposal_kind` | a finding never drafts a value, and never carries the testable half |
| `finding_class` | an enhancement is never `critical` or `high` |
| `severity` | the backlog is ordered by something other than the order the lenses ran in |
| `affected_journey` | a defect is attached to a reader doing something, not to a file |
| `success_criterion` | it may not repeat `proposed_change.summary` word for word |

SESSION 17 added the testable half on the same contract — `hypothesis`, `success_metrics`,
`regression_risks`, `accessibility_checks`, `browser_tests`, `tokens_used` — under
`proposal_kind: "testable_proposal"`, the same move SESSION 14 made with
`EditorialProposal.proposal_kind`. A finding carries none of them and the rules say so, so
a query cannot confuse the two.

Four forbidden fields, and two of them are new: **`priority`**, because the backlog
position is derived and a stored one is a second home for an ordering; and
**`users_affected`**, because this project has no analytics, no telemetry and no user
research, so a number there could only be invented — and an invented number is the most
persuasive kind of fabrication available here.

---

## 4 · The ten questions

One lens each, in the brief's own order over what it asked to be studied. Each reports what
it **examined** as well as what it found, so "looked and found nothing" and "did not look"
are different results.

| # | asks | class it produces |
|---|---|---|
| 1 | Is a state carried by hue alone? | accessibility / information architecture |
| 2 | Is one interaction contract implemented twice, and have the two drifted? | interaction |
| 3 | Is something that behaves like a control built as one? | accessibility |
| 4 | Does every control keep a name that says what it does, at every width? | accessibility |
| 5 | Is there a breakpoint vocabulary, or a set of magic numbers? | information architecture |
| 6 | Can a reader tell "nobody has looked" from "there is nothing"? | usability |
| 7 | Can a reader get anywhere without JavaScript, and does the page say so if not? | discoverability |
| 8 | Does a reader who chose another language find out where it stops? | usability |
| 9 | What does the page a reader meets first cost to open? | enhancement |
| 10 | What does `tools/design-qa.mjs` not check, and how much of that could it? | enhancement |

**Question 3 finds nothing, and that is the result.** Every class the four stylesheets
declare pressable with `cursor:pointer` lands on an operable element: the contents tree's
SVG nodes carry `role="button" tabindex="0"` and an `aria-label`, the search palette is a
listbox with `aria-activedescendant`, the compliance dial's dots are `<circle>`s with a
role, a tabindex and a label. Two earlier drafts of that lens reported ten defects and then
one, both wrong — the first because a word boundary treats `chrome-btn-word` as carrying
`chrome-btn`, the second because the markup writes `role="button"` and the `el()` helper
writes `role: 'button'`. Both drafts are recorded in the module's comments, because the
false positives are the reason the checks are shaped as they are.

---

## 5 · Severity is derived, and `critical` means one thing

`agent/ux/severity.mjs` computes it from three things that were read rather than judged —
the finding's **class**, the **stake** of the journey it sits on, and how many **surfaces**
carry it — and records every step, so a reviewer who disagrees can see which step produced
the number.

**One gate outranks all three.** A finding where a reader can take an absence of knowledge
for a negative finding is `critical` whatever else it is. That is not a severity scale
borrowed from general practice; it is this project's own thesis turned on its own
interface, and `AGENTS.md` rules 5 and 6, `docs/AI-SAFE-BOUNDARIES.md` §0.3 and §0.5 and
the first section of the `ux-audit` checklist all say the same thing.

**And one ceiling.** Without the gate, `high` is the top: a model where three ordinary
escalations also reach `critical` would make the word mean "several things at once".

**And one floor.** `enhancement` is capped at `medium` — by the model and, independently,
by the contract, because either check alone could be edited away. Without it, "the front
door is 205 KB" competes with "a reader cannot tell an unknown from a zero".

The backlog is ordered by severity, then journey stake, then how much the finding is
standing on, then subject — a total order, so two runs over an unchanged site produce the
same backlog and a diff between them means something. **The rank is derived at read time
and stored on no record.**

---

## 6 · The journeys

Ten, and they are **read rather than invented**. `js/shell.js` carries the site's own
conceptual model in two literals — `NAV`, whose comment says the order "is the conceptual
model of the product, not alphabetical and not traffic-ranked", and `DOOR_BLURB`. Both are
parsed out of the module, and the suite asserts the parsed count matches the literal.

Four more are derived from the modules rather than the nav: searching the record, opening a
glossary term, following a claim to its evidence, and reading in another language. Each
names the module that owns it and is dropped if that module is gone.

Two journeys carry `legal_consequence` — **applicability** and **following the evidence** —
because those are the two where a reader can come away with a belief about what the law
requires of them. Inflating a journey to reach that stake is what the field is guarding
against.

**A finding that reaches every page is filed against the site**, not against the
highest-stake journey it happens to touch. Without that rule every finding in a shared
stylesheet is filed against the applicability tool — the journey with the most at stake and
one that every finding touches — and the field would say "this matters" rather than "this
is where the reader meets it". The journeys it also reaches are recorded rather than
dropped.

---

## 7 · What it found, as at 2026-09-03

**10 findings · 12 open questions · 1 lens answering no · 5 testable proposals.**

| # | severity | class | finding |
|---|---|---|---|
| 1 | critical | information architecture | The status rule is stated once, implemented once, and bypassed by 26 components |
| 2 | high | usability | A render fallback over a field `data/` leaves absent that does not say which absence it is |
| 3 | high | discoverability | 5 of the 7 pages are linked from no markup anywhere |
| 4 | high | interaction | The modal dialog contract, implemented in 2 places, diverged on 2 behaviours |
| 5 | high | accessibility | A control in `js/shell.js` explains itself only in `title=` |
| 6 | medium | enhancement | The front door is 205 KB, 29% of it an inline blob nothing reads at runtime |
| 7 | medium | information architecture | 10 viewport widths, no declared scale |
| 8 | medium | usability | 3 locales ship; 1 of 7 pages carries any of them |
| 9 | medium | interaction | The theme control, implemented in 2 places, diverged on 2 behaviours |
| 10 | medium | enhancement | 28 of 31 manual checks sit in sections a static check could decide |

Three of them are worth stating in full, because they are what the audit is for.

**№1 — the rule is written down and enforced nowhere.** `css/tokens.css` states it in its
own header: *"STATUS IS NEVER CARRIED BY HUE ALONE. Every status token comes with a glyph
and a border style."* `.badge` keeps it, with eight glyph rules and four border styles.
Twenty-six other components across the four sheets draw a multi-state status and vary
`color` and nothing else. Whether each of them is legible without colour depends on whether
a sibling element happens to carry the state's word — and for **nine** of them this agent
could not establish from the source that it does. That count is the finding: the rule holds
where somebody remembered it, and nothing would catch the next lapse.

**№3 — the site has no navigation in its markup.** `js/shell.js` consolidated five
hand-written headers that had drifted, which was right. It also moved every link between
the seven pages into a module. Five of the seven pages carry no inbound relative link at
all; `index.html` carries two. The `<noscript>` notice — identical across all seven pages
by design, and `design-qa.mjs` errors if the copies drift — lists eight things that will
not appear when scripting is off. Navigation is not one of them. A reader who has read that
notice believes the written analysis reads normally and only the tools are missing. The
written analysis does read normally. What they cannot do is leave the page.

**№4 and №9 — one contract, two implementations, and they have drifted.** `js/dialog.js`
says it exists "so no view has to reimplement" dialog semantics; `app.js` reimplements them
and says why (a classic script cannot import a module). Both comments are honest. What
neither says is that the two now differ: only `js/dialog.js` inerts **every** top-level
element rather than a named list, so an element added to a page later is not covered; and
only `js/dialog.js` decides focusability by `getClientRects`. Separately, the theme control
exists in both, and only the one in `js/shell.js` exposes `aria-pressed` and an
`aria-label` — the brief's own toggle has neither.

**And the twelve open questions are a deliberate deliverable**, not a shortfall. Nine of
them are components whose legibility without colour cannot be settled by reading a
template. Each carries the bytes it read and what would close it: somebody opening the page.

---

## 8 · SESSION 17 — the testable half

For each finding at `critical` or `high`, and for nothing else: the user problem, a
hypothesis, the smallest coherent change, the affected files, success metrics, regression
risks, accessibility checks and browser tests.

**Where the judgement lives, and why it is in one place.** Everything SESSION 16 produced
was derived — a lens read a file and the finding quoted it. A hypothesis cannot be. It is a
belief about a reader, and this repository has no analytics, no telemetry and no user
research. So the judgement is written down once, as a **recipe per lens**, and each recipe
is filled from the finding's own evidence: the files, the counts and the tokens are read
off the extracts, and only the reader problem and the hypothesis are the agent's. The
hypothesis is typed as a **contested interpretation** with a basis saying nothing measured
it.

**A high-priority finding whose lens has no recipe is refused by name**, on the trace, with
the reason. It does not become a proposal with a plausible-looking hypothesis, which is the
failure this arrangement is built against: the easiest thing to fabricate here is a
confident sentence about what a reader wants.

**No proposal invents a design token.** Two checks, because either alone could be edited
away: `agent/ux/tokens.mjs` refuses a proposal naming a custom property no stylesheet
declares, and the contract independently refuses one that *adds* a token without an open
question saying what the existing system could not hold. In practice this agent adds none
at all — it has no way to establish that the system genuinely cannot hold something.

**Every browser test says a person runs it.** There is no browser harness here and no
dependency budget for one, so `harness` is `null` on every test that is not a script in
`tools/`, and the suite enforces it. A test implying a runner exists would be the most
useful-looking lie available in that file.

**Every proposal names all four validators, `tools/design-qa.mjs` among them**, as SESSION
17 requires — with this agent's reasons rather than the data agent's. For a data proposal
`i18n-audit` proves the change touched no prose; for an interface change it is the check
most likely to fail.

`autonomy_class` is `review_required` only where **no reader would meet the change** — a
judgement recorded per recipe, because it cannot be read off an operation's target: a
change to `tools/_footer.mjs` regenerates seven published pages, and a change to
`tools/design-qa.mjs` adds a check the site never renders. The first draft derived amber
from "the target starts with `tools/`" and made a change that rewrites every page in the
site reviewable rather than the author's.

---

## 9 · Observability

Ten lens spans (`ux.<lens>`) plus `ux.proposals`; an observation per lens carrying the
question, what it examined, what it found and what it set aside; an observation per open
question carrying the bytes and what would close it; an observation per routed finding with
the agent it belongs to and a `handoff` to that agent; the ordering as a **decision** with
the four alternatives it did not take; a census; the **backlog** as an observation, which
is the session's deliverable; and `NOTHING RESTYLED` with five zeros — `applied`,
`stylesheets_written`, `pages_opened`, `tokens_invented`, `data_dir_written`.

`uxState()` derives the view at read time and stores nothing twice —
`cli.mjs ux [--backlog] [--open]`, `GET /api/ux`, the **UX audit** panel, and two overview
tiles: *UX defects at critical* beside *UX questions unanswerable from source*, because a
tile showing only the first would report an audit that could answer ten of its twenty-two
questions as one that found ten things and nothing else.

The view reports **gaps**: a run with no census, no backlog, no ordering decision, no
"nothing restyled" claim — or one that claims to have opened a page, written a stylesheet
or invented a token. The suite forges a trace making all three claims and asserts the view
catches them.

---

## 10 · Known limitations

1. **Nothing has been rendered.** Every finding is about a source file. A defect a browser
   would show and the source does not is invisible here, and a defect the source shows may
   look different in a browser. The twelve open questions are where that bites hardest.
2. **No contrast was computed.** `css/tokens.css` carries measured ratios in its comments,
   taken by whoever wrote them. Reading one out of a comment and presenting it as this
   run's measurement would be a fabricated measurement, so the agent computes none and
   every record says so.
3. **Question 2 scopes a behaviour by proximity to a marker**, at a span recorded per
   contract with its reason. That is a judgement, it understates rather than overstates —
   a behaviour implemented far from the markers reads as present when the region reaches it
   — and it exists because a module-wide test reported the theme toggle as exposing a state
   it does not.
4. **Question 10's classification of which manual checks are automatable is a judgement**,
   recorded once in `AUTOMATABLE_SECTIONS` with a reason per section, and a section with no
   recorded judgement becomes an open question rather than a guess.
5. **`js/shell.js` is parsed, not imported.** It touches `document` at load, and a DOM here
   would be a dependency. The suite asserts the parsed nav model matches the literal in the
   file, which is what makes the parse checkable rather than trusted.
6. **The agent knows nothing about EU law and reads no prose.** What the brief argues is
   `agent/proposals/editorial/`'s, and the suite asserts no record here quotes
   `data/brief.json`.

---

## 11 · Running it

```
node agent/ux/cli.mjs --as-of YYYY-MM-DD            # the ten questions and the backlog
node agent/ux/cli.mjs --as-of YYYY-MM-DD --backlog  # each finding whole
node agent/ux/cli.mjs --as-of YYYY-MM-DD --open     # what the source could not settle
node agent/ux/cli.mjs --as-of YYYY-MM-DD --propose  # SESSION 17
node agent/ux/cli.mjs --as-of YYYY-MM-DD --question 6
node --test agent/ux/selftest.mjs                   # 73 tests, against the real site
node agent/observability/cli.mjs ux --backlog --open
```

`--as-of` is required, for the reason it is required on every agent here: "the interface
has not changed" and "nobody has looked" are different findings, and only a stated date
tells them apart (`docs/AUDIT-2026-09-01.md` F-15).

The CLI hashes `data/`, all seven pages and all four stylesheets before and after the run
and exits non-zero if any of them moved.
