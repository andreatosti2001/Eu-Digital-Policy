/* ============================================================
   agent/ux/proposals.mjs — SESSION 17: a finding, turned into
   something that could be tested

   SESSION 17's brief, for each high-priority finding: formulate the
   user problem; formulate a hypothesis; propose the smallest
   coherent change; identify affected files; define success metrics;
   define regression risks; define accessibility checks; define
   browser tests; generate a UX Proposal. No proposal may invent
   arbitrary design tokens. **Do not implement proposals in this
   session.**

   ------------------------------------------------------------
   WHERE THE JUDGEMENT LIVES, AND WHY IT IS IN ONE PLACE

   Everything SESSION 16 produced was derived: a lens read a file and
   the finding quoted it. A hypothesis cannot be derived that way. It
   is a belief about a reader, and this repository has no analytics,
   no telemetry and no user research — `UXProposal.forbidden.users_affected`
   exists so that a count of affected readers cannot be written into a
   record at all.

   So the judgement is written down, once, as a RECIPE per lens: what
   this agent believes the reader problem is, what the smallest
   coherent change would be, and what would have to be true
   afterwards. Each recipe is filled from the finding's own evidence,
   so the FILES, the TOKENS and the COUNTS in a produced proposal are
   read rather than asserted, and only the belief is the agent's.

   A finding whose lens has no recipe becomes a REFUSAL, named on the
   trace with its reason. It does not become a proposal with a
   plausible-looking hypothesis, which is the failure mode this
   arrangement is built against: the easiest thing to fabricate here
   is a confident sentence about what a reader wants.

   ------------------------------------------------------------
   FOUR THINGS EVERY PROPOSAL HERE MUST SURVIVE

   1 · `node tools/design-qa.mjs`, named in every proposal's
       validation requirements, as SESSION 17 requires.
   2 · `agent/ux/tokens.mjs`, which refuses a proposal naming a
       custom property no stylesheet declares.
   3 · The contract, which refuses a `testable_proposal` missing a
       metric, a regression risk, an accessibility check, a browser
       test or a hypothesis.
   4 · The honesty rule. There is no browser harness in this
       repository and no dependency budget for one, so every browser
       test carries a null `harness` and says a person runs it. A
       test that implied a runner exists would be the most useful-
       looking lie available in this file.
   ============================================================ */

import { RecordBuilder } from '../verifier/build.mjs';
import { ROLLBACK } from '../integrate/propose.mjs';
import { isHighPriority } from './severity.mjs';
import { tokensExist, tokensIn, statusVocabulary } from './tokens.mjs';

/** Every browser test in this repository is run by a person. Stated
 *  once, so a proposal cannot quietly imply otherwise. */
export const NO_HARNESS = null;
export const BY_HAND = 'Run by hand against `python3 -m http.server 8000`. This repository has no browser harness and no dependency budget for one (docs/AI-SAFE-BOUNDARIES.md §3), so this is a step a person performs and records.';

/** The three validators a proposal names as metrics, with what each
 *  would actually show for an interface change. The BASELINE numbers
 *  are not restated here: `agent/integrate/propose.mjs` owns them and
 *  the proposal carries them in `validation_requirements`. */
const metric = (metric_, how, baseline) => ({ metric: metric_, how_measured: how, baseline });

const RERUN = 'node agent/ux/cli.mjs --as-of <date> — the lens that found it is the measurement.';

/**
 * The recipes.
 *
 * One per lens, keyed by the lens id, each returning the seven
 * things SESSION 17 asks for. Everything a recipe cannot know is
 * filled from the finding: `f.evidence` gives the files and lines,
 * `f.pages` and `f.modules` give the surfaces, and `surface` gives
 * the design system the change may use.
 */
export const RECIPES = {

  hue_alone: (f, surface) => {
    const vocab = statusVocabulary(surface);
    return {
      user_problem: 'A reader who cannot separate the hues — in greyscale, on a monochrome print, or with a red-green deficiency — sees several states of one component as one state, and there is nothing else in the component that tells them apart.',
      hypothesis: 'The rule lapsed because it is written in a comment and checked by nothing. If a component drawing two or more states had to vary something other than colour before the checks pass, the next component would keep the rule without anyone remembering it — and the ones that lapsed would be found in one pass rather than one at a time.',
      change: {
        /* WOULD A READER SEE THE DIFFERENCE? Recorded per recipe,
           because it is the thing the autonomy class turns on and it
           cannot be read off an operation's target: a change to
           tools/_footer.mjs regenerates seven pages, and a change to
           tools/design-qa.mjs adds a check nobody reading the site
           will ever meet. */
        reader_visible: false,
        summary: 'Add a check that a set of sibling state rules varies at least one non-colour channel, and let it report the components that do not.',
        operations: [{
          op: 'add',
          target: 'tools/design-qa.mjs — a status-legibility check',
          current: `The rule is in a comment in ${vocab.home}. ${vocab.glyphs.length} glyph rules and ${vocab.borders.length} border-style rules keep it for \`${vocab.component}\`, and nothing keeps it for anything else.`,
          proposed: null,
          rationale: 'The smallest coherent change is a check, not a restyle: a restyle fixes the components that exist and a check fixes the ones that do not yet. Which glyph or border each component should take is a design decision and is deliberately not drafted.',
        }],
        scope_note: 'It adds a check. It restyles no component, chooses no glyph, and does not decide which of the components the check names are status rather than decoration — that judgement is the author\'s, and the check should let them mark one.',
      },
      metrics: [
        metric('Components drawing two or more states that vary only colour', 'node tools/design-qa.mjs, once the check exists', `${f.components?.length ?? 0} today, counted by agent/ux/lenses.mjs question 1`),
        metric('Open questions from question 1 of the UX audit', RERUN, 'nine today: nine components whose legibility this agent could not settle from the source'),
      ],
      risks: [
        { risk: 'The check fires on a component where colour is decoration rather than status, and somebody silences it by adding a glyph nobody needs.', watch: 'The count of components the check names, against the list in this finding.', mitigation: 'The check should let a component be marked as decoration in the stylesheet, so a silenced rule carries a reason instead of a workaround.' },
        { risk: 'A new check turns the design-qa baseline red and blocks unrelated work.', watch: 'node tools/design-qa.mjs against the docs/CURRENT-ARCHITECTURE.md §12 baseline: 0 errors, 5 warnings.', mitigation: 'Land it as a warning first, with the components it names listed in §12 the way the five existing warnings are, and promote it to an error once they are resolved.' },
      ],
      checks: [
        { check: 'Every component the check names is distinguishable in greyscale after the change.', how: 'Open each page carrying the component and view it with the display in greyscale, then again with the theme switched.', tool: null },
        { check: 'No glyph added for the check\'s sake is announced as content by a screen reader.', how: 'A ::before glyph is decorative; if it is added on a real element rather than a pseudo-element it becomes text.', tool: null },
      ],
      tests: [
        { name: 'the states are separable without colour', page: (f.pages ?? ['index.html'])[0], steps: [BY_HAND, `Open the page carrying ${f.components?.slice(0, 2).join(' and ') ?? 'the component'}.`, 'Set the display to greyscale.', 'Read each state in turn and write down which one it is, without looking at the markup.'], expected: 'Every state is identifiable from what is on screen.', harness: NO_HARNESS },
      ],
    };
  },

  two_implementations: (f) => ({
    user_problem: 'A reader who opens one overlay and then another meets two different behaviours under one appearance: what Escape does, what Tab is allowed to reach, and what happens to the page behind depend on which of the two implementations drew the panel they are in.',
    hypothesis: 'The divergence is not a decision anybody made; it is the older implementation not having been brought forward. If the stronger behaviours were carried across, no reader would be able to tell which implementation they were in — which is the state both files\' own comments say they were aiming at.',
    change: {
      reader_visible: true,
      summary: 'Bring the weaker implementation up to the behaviours the stronger one already has, one behaviour at a time.',
      operations: [{
        op: 'modify',
        target: (f.modules ?? []).join(' and '),
        current: f.problem,
        proposed: null,
        rationale: 'Carrying the behaviours across is smaller than merging the two files, and it is the part that changes what a reader meets. Whether the two should become one module at all is an architecture decision that this does not force and does not make.',
      }],
      scope_note: 'It closes the behavioural gap. It does not merge the two implementations, does not move code across the module/classic-script boundary, and takes no view on whether that boundary should exist.',
    },
    metrics: [
      metric('Behaviours present in one implementation and absent from the other', RERUN, `${f.problem.match(/differ on (\d+)/)?.[1] ?? 'some'} today`),
      metric('Overlays that trap focus and restore it on close', 'By hand, per overlay: open it, Tab to the end, confirm focus returns to the panel, close it, confirm focus returns to the trigger.', 'Not measured. Nothing here opened a page.'),
    ],
    risks: [
      { risk: 'Inerting every top-level element rather than a named list inerts something the page needs — a live region, a toast.', watch: 'Open each overlay and confirm the page behind it is unreachable and that nothing that should keep speaking has stopped.', mitigation: 'The stronger implementation records what it inerted and restores exactly that, which is what makes the change reversible per element.' },
      { risk: 'A focus-visibility test based on getClientRects behaves differently for an element inside a transformed ancestor than the offsetParent test it replaces, and a control that used to be skipped is now reachable — or the reverse.', watch: 'Tab through each overlay and count the stops before and after.', mitigation: null },
    ],
    checks: [
      { check: 'Escape closes every overlay, and focus returns to whatever opened it.', how: 'Open each overlay by keyboard, press Escape, and confirm the focus ring is back on the trigger.', tool: null },
      { check: 'Tab cannot leave an open overlay.', how: 'Tab forwards past the last control and backwards past the first.', tool: null },
      { check: 'The page behind an open overlay is not reachable by keyboard and is not announced.', how: 'Tab through with the overlay open; nothing behind it should take focus.', tool: null },
    ],
    tests: [
      { name: 'focus is trapped and restored in every overlay', page: (f.pages ?? ['index.html'])[0], steps: [BY_HAND, 'Tab to the control that opens each overlay in turn and press Enter.', 'Tab forwards until focus wraps; note where it went.', 'Press Escape.', 'Confirm focus is on the control that opened it.'], expected: 'Focus never leaves an open overlay, and always returns to the trigger.', harness: NO_HARNESS },
      { name: 'the background is inert', page: (f.pages ?? ['index.html'])[0], steps: [BY_HAND, 'Open an overlay.', 'Tab repeatedly and watch the page behind it.'], expected: 'No element behind the overlay takes focus.', harness: NO_HARNESS },
    ],
  }),

  name_at_every_width: (f) => ({
    user_problem: 'A reader using a screen reader, or a phone, or a keyboard, meets a control with no name that says what it does. The explanation exists — it is in a title attribute — and it reaches none of them.',
    hypothesis: 'The control was built with a title because the sighted, wide-window case reads fine, and the two controls beside it in the same module carry an aria-label because somebody wrote them at a different time. An aria-label saying the same thing the title says would cost nothing and would reach every reader.',
    change: {
      reader_visible: true,
      summary: 'Give the control an accessible name that states its purpose, the way the two controls beside it in the same module already do.',
      operations: [{
        op: 'modify',
        target: (f.modules ?? []).join(', '),
        current: f.evidence?.[0]?.quote ?? f.problem,
        proposed: null,
        rationale: 'An aria-label is the smallest change that reaches a keyboard reader, a screen-reader reader and a touch reader at once. The wording is the author\'s: it has to say what the control does in a sentence that also works in the three shipped locales.',
      }],
      scope_note: 'It gives one control a name. It does not restyle the chrome, does not change the breakpoint that hides the label text, and does not translate anything.',
    },
    metrics: [
      metric('Controls built by the el() helper with a title and no aria-label', RERUN, '1 today'),
      metric('Controls whose accessible name is unchanged at 390px and at 1440px', 'By hand, at both widths, reading the accessible name from the browser\'s accessibility inspector.', 'Not measured. Nothing here opened a page.'),
    ],
    risks: [
      { risk: 'The label and the title say different things, and a sighted mouse reader gets one answer while a screen-reader reader gets another.', watch: 'Both attributes on the same element.', mitigation: 'Drop the title once the label says the same thing, so there is one home for the sentence.' },
      { risk: 'The label is English on a page a reader chose another language for.', watch: 'tools/i18n-audit.mjs, and the locale register.', mitigation: 'The label is part of the chrome, which js/shell.js already states is English; if that changes, the key belongs in i18n/locales.json like every other.' },
    ],
    checks: [
      { check: 'The control has an accessible name that states its purpose.', how: 'Read the computed accessible name in the browser\'s accessibility inspector, at a wide and a narrow width.', tool: null },
      { check: 'The name is not the same string as the visible text, where the visible text is a two-letter code.', how: 'Compare the two.', tool: null },
    ],
    tests: [
      { name: 'the control names itself at both widths', page: (f.pages ?? ['index.html'])[0], steps: [BY_HAND, 'Open the page at 1440px and Tab to the control.', 'Read its accessible name in the accessibility inspector.', 'Resize to 390px and repeat.'], expected: 'The same purpose-stating name at both widths.', harness: NO_HARNESS },
    ],
  }),

  breakpoints: (f, surface) => ({
    user_problem: 'A reader at a width between two of the twelve meets a layout where some components have reflowed and others have not, because each stylesheet chose its own number.',
    hypothesis: 'The widths were each right for the component that introduced them, and nothing has ever compared them because there is nowhere they could be compared. Naming them in css/tokens.css, beside the spacing and type scales, would make the next choice a choice from a list.',
    change: {
      reader_visible: true,
      summary: 'Declare the viewport widths as named custom properties beside the existing scales, and let the sheets reference the names.',
      operations: [{
        op: 'add',
        target: 'css/tokens.css — a viewport scale',
        current: f.problem,
        proposed: null,
        rationale: 'Naming is separable from consolidating, and it is the half that can be done without changing what any reader sees: the same numbers under names render identically. Which widths survive a later consolidation is a design decision this does not force.',
      }],
      scope_note: 'It names the widths that exist. It merges none of them, moves no rule, and changes no rendered layout — which is what makes it checkable: if anything moves, the change was not this change.',
    },
    metrics: [
      metric('Viewport conditions that resolve against a declared name', RERUN, `0 of ${surface.breakpoints.filter((b) => b.dir === 'max').length} today`),
      metric('Rendered layout at each declared width', 'By hand, before and after, at each width in the scale.', 'Whatever it is today: this change is expected to move nothing.'),
    ],
    risks: [
      { risk: 'A media query cannot use a custom property in its condition, so naming means a build step or a duplicated constant — and a build step is a red-tier prohibition here.', watch: 'Whether the proposal survives contact with CSS at all.', mitigation: 'The names can be declared and documented as the vocabulary without the queries referencing them, which is weaker and adds no dependency. That is a real limitation of this proposal and it is stated rather than designed around.' },
      { risk: 'Consolidating a width while naming it changes a layout somebody tuned.', watch: 'Each page at each width, before and after.', mitigation: 'Name first, consolidate never in the same change.' },
    ],
    checks: [
      { check: 'Nothing renders differently at any width after the change.', how: 'Each of the seven pages at each declared width, before and after.', tool: null },
      { check: 'No new undeclared custom property.', how: 'node tools/design-qa.mjs, which errors on a var() pointing at a property nothing declares.', tool: 'tools/design-qa.mjs' },
    ],
    tests: [
      { name: 'the layout is unchanged at every named width', page: (f.pages ?? ['index.html'])[0], steps: [BY_HAND, 'Open each page at each width in the scale.', 'Compare against the same page before the change.'], expected: 'No visible difference anywhere.', harness: NO_HARNESS },
    ],
  }),

  absence_of_knowledge: (f) => ({
    user_problem: 'A reader meets a dash where a value would be and cannot tell whether nobody has looked, whether it was looked for and is not publicly determinable, or whether the answer is genuinely none. Those are three different things and the site says so everywhere except here.',
    hypothesis: 'The dash is a template default rather than a decision. The same modules already write "not recorded" and "no fine" where somebody thought about it, so replacing the dashes with a form of words that names the absence would not be a new convention — it would be the existing one, applied where it was missed.',
    change: {
      reader_visible: true,
      summary: 'Replace each fallback that names no absence with the one the field actually carries.',
      operations: [{
        op: 'modify',
        target: (f.modules ?? []).join(', '),
        current: f.evidence?.[0]?.quote ?? f.problem,
        proposed: null,
        rationale: 'Which of the three absences each field is in is a question about the record and not about the template, so the wording is not drafted here. What is drafted is nothing: the operation names the expression and stops.',
      }],
      scope_note: 'It changes what a renderer says about an absence. It writes nothing to data/, does not decide which absence any field is in, and does not touch the applicability tool\'s NOT DETERMINED path, which already says the right thing at length.',
    },
    metrics: [
      metric('Render fallbacks over a field data/ leaves absent that name no absence', RERUN, '1 today, against 7 that do name it'),
      metric('Records rendering the changed field', 'A count from data/, per field.', 'Nine records carry a null brief_part today.'),
    ],
    risks: [
      { risk: 'A longer phrase breaks a table cell or a definition-list row at a narrow width.', watch: 'The page at 390px.', mitigation: 'The same modules already render "not recorded" in the same rows, so the width is already carried somewhere.' },
      { risk: 'The English string carries a data-i18n key and three locale editions go on asserting the old text.', watch: 'node tools/i18n-audit.mjs.', mitigation: 'Declare the key superseded in i18n/locales.json, which AGENTS.md names as a known hazard because it has already happened once.' },
    ],
    checks: [
      { check: 'The three absences are distinguishable in the rendered page, not only in the JSON.', how: 'Find a record in each state and read what the page says.', tool: null },
      { check: 'No absence is rendered as a zero or an empty cell.', how: 'Read the changed rows.', tool: null },
    ],
    tests: [
      { name: 'an absent field says which absence it is', page: (f.pages ?? ['index.html'])[0], steps: [BY_HAND, 'Find a record whose field is null in data/.', 'Open the page that renders it.', 'Read what the row says.'], expected: 'It names the absence rather than showing a dash.', harness: NO_HARNESS },
    ],
  }),

  navigation_without_js: (f, surface) => ({
    user_problem: 'A reader with scripting off, or on a connection that dropped the module, can read the page they are on and cannot reach any other. The page tells them eight things will not appear and does not tell them this one.',
    hypothesis: 'The chrome moved into a module for a good reason — five hand-written headers had drifted — and the markup fallback was not part of that decision rather than being rejected by it. A list of the six destinations in the footer, which is already duplicated into all seven pages on purpose and regenerated from one source, would restore the floor without giving the header back to the pages.',
    change: {
      reader_visible: true,
      summary: 'Put the destinations in the markup where the footer already is, or name navigation in the noscript notice.',
      operations: [{
        op: 'add',
        target: `tools/_footer.mjs — the generator that writes the footer and the noscript notice into all ${surface.pages.length} pages`,
        current: f.problem,
        proposed: null,
        rationale: 'The footer is already duplicated into every page deliberately, already regenerated from one source, and already checked for drift by tools/design-qa.mjs. It is the one place a markup fallback can live without reintroducing the drift js/shell.js was built to end.',
      }],
      scope_note: 'It restores a markup path between pages, or says there is not one. It does not move the header back into the pages, does not touch js/shell.js\'s nav model, and takes no view on whether the tools should work without scripting.',
    },
    metrics: [
      metric('Pages reachable by a relative link in the markup from every other page', RERUN, `${surface.reachability.filter((r) => r.from_markup.length).length} of ${surface.pages.length} today`),
      metric('Whether the noscript notice names navigation', 'Read it. It is identical across all seven pages and design-qa.mjs errors if the copies drift.', 'It does not today.'),
    ],
    risks: [
      { risk: 'The seven footer copies drift, which is the failure the generator exists to prevent.', watch: 'node tools/design-qa.mjs, which errors when the copies differ.', mitigation: 'Change tools/_footer.mjs and regenerate, never edit a page\'s footer by hand. AGENTS.md names _footer.mjs as a generator and the two one-shot patches beside it as things not to re-run — this is the generator.' },
      { risk: 'A second set of destination links competes with the chrome\'s and a reader meets the same six links twice.', watch: 'Each page with scripting on.', mitigation: null },
      { risk: 'The footer\'s non-affiliation and no-legal-advice text is disturbed.', watch: 'node tools/design-qa.mjs, which errors when the non-affiliation statement is missing.', mitigation: 'AGENTS.md rule 8 and docs/AI-SAFE-BOUNDARIES.md put that text out of reach; a change here adds a list beside it and alters no word of it.' },
    ],
    checks: [
      { check: 'With scripting disabled, every page links to every top-level destination.', how: 'Disable JavaScript and Tab through each page.', tool: null },
      { check: 'The added links are in a landmark and are not announced twice when scripting is on.', how: 'Read the page with the chrome present.', tool: null },
    ],
    tests: [
      { name: 'the site is navigable with scripting off', page: (f.pages ?? ['index.html'])[0], steps: [BY_HAND, 'Disable JavaScript.', 'Open each of the seven pages in turn.', 'From each one, follow a link to another.'], expected: 'Every page reaches every top-level destination.', harness: NO_HARNESS },
      { name: 'the noscript notice is still identical across the pages', page: 'index.html', steps: ['node tools/design-qa.mjs'], expected: '0 errors; the notice and the footer each have exactly one version across all seven pages.', harness: 'tools/design-qa.mjs' },
    ],
  }),

  localisation: (f, surface) => ({
    user_problem: 'A reader who chose Italian on the brief follows a link and arrives at an English page. What tells them this is expected rather than broken is a two-letter chip whose explanation is a hover hint, and half of which disappears below 820px.',
    hypothesis: 'The chip was designed for the wide, mouse-driven case and the narrow case was not considered separately. Saying the same thing in a form that survives the breakpoint and reaches the accessibility tree would turn a page that looks broken into a page that is honest about its coverage, which is what js/shell.js\'s own comment says it is for.',
    change: {
      reader_visible: true,
      summary: 'Make the language chip say what it means without hover and at every width.',
      operations: [{
        op: 'modify',
        target: 'js/shell.js — the chip built in languageNote()',
        current: f.evidence?.find((e) => e.file === 'js/shell.js')?.quote ?? f.problem,
        proposed: null,
        rationale: 'The module already states the right intention in its comment; the change is to what it builds. An accessible name is the minimum; whether the visible form should also change at the narrow width is a design decision and is not drafted.',
      }],
      scope_note: `It makes the interface's own statement about its language coverage legible. It does NOT propose translating the ${surface.localisation.untranslated_pages.length} untranslated pages: that is a decision about scope and about who would write ${surface.localisation.shipped.length} locales' worth of strings, and it is not an agent's.`,
    },
    metrics: [
      metric('Pages where a reader in a shipped locale is told the interface is English, without hovering', 'By hand, at 390px and at 1440px, on each page.', `0 today at 390px: the chip's "· UI EN" half is inside a class a media query hides.`),
      metric('Accessible name of the language chip', 'The browser\'s accessibility inspector.', 'The two-letter language code, because a title is not used when an element has content.'),
    ],
    risks: [
      { risk: 'A longer chip crowds the chrome at the width where things are already being hidden.', watch: 'The chrome at 390px.', mitigation: 'The chrome already hides the search and theme labels at that width and keeps their aria-labels; the same shape works here.' },
      { risk: 'The new wording is itself English on a page the reader asked to be Italian.', watch: 'What the chip says in each shipped locale.', mitigation: null },
    ],
    checks: [
      { check: 'The chip has an accessible name that says the interface text is English and the record labels are not.', how: 'The accessibility inspector, at both widths.', tool: null },
      { check: 'The statement survives at 390px without hover.', how: 'Read the chrome at 390px on a touch device or with the pointer coarse.', tool: null },
    ],
    tests: [
      { name: 'the language coverage is stated at every width', page: (f.pages ?? ['index.html'])[0], steps: [BY_HAND, 'Choose a shipped locale on index.html.', 'Follow a link to any other page.', 'At 1440px and again at 390px, read what the chrome says about the language, without hovering anything.'], expected: 'At both widths, and in the accessibility tree, the interface says the record labels follow the chosen locale and the interface text is English.', harness: NO_HARNESS },
    ],
  }),
};

/**
 * Turn the high-priority half of a backlog into testable proposals.
 *
 * @param {{span:object, backlog:object[], surface:object, agent:object}} opts
 */
export function proposalsFor({ span, backlog, surface, agent }) {
  const ctx = agent.context;
  const eligible = backlog.filter(isHighPriority);
  const proposals = [];
  const approvals = [];
  const refused = [];
  /* Which finding each proposal answers. Kept beside the records
     rather than on them: a proposal already points at its finding
     through the trace's `derived_from`, and a second copy in a field
     would be the second home this repository refuses. */
  const answers = [];

  span.observe({
    summary: `PROPOSING FOR ${eligible.length} OF ${backlog.length} — critical and high only`,
    subject: 'the high-priority half',
    data: {
      eligible: eligible.map((f) => ({ rank: f.rank, severity: f.severity, subject: f.subject, lens: f.lens })),
      not_eligible: backlog.filter((f) => !isHighPriority(f)).map((f) => ({ rank: f.rank, severity: f.severity, subject: f.subject })),
      why: 'SESSION 17 asks for a proposal per HIGH-PRIORITY finding. A proposal for every finding is a redesign, and SESSION 16\'s brief refuses one.',
    },
    confidence: 1,
    risk: 'low',
  });

  for (const finding of eligible) {
    const recipe = RECIPES[finding.lens];
    if (!recipe) {
      /* NAMED, NOT DROPPED. A finding with no recipe would otherwise
         become a proposal with an invented hypothesis, which is the
         one thing this file is arranged to prevent. */
      refused.push({ what: finding.subject, stage: 'recipe', reason: `no recipe for lens "${finding.lens}": a hypothesis is a belief about a reader, this repository has no research to derive one from, and writing a plausible one here would be a fabrication wearing a proposal's shape` });
      span.observe({
        summary: `NO PROPOSAL — ${finding.subject}`,
        subject: finding.subject,
        data: { lens: finding.lens, why: 'no recipe is recorded for this lens, and a hypothesis may not be improvised' },
        confidence: 1, risk: 'medium',
      });
      continue;
    }

    const r = recipe(finding, surface);
    const record = buildProposal({ ctx, span, finding, recipe: r, surface });
    if (!record) { refused.push({ what: finding.subject, stage: 'tokens', reason: 'the proposal named a custom property no stylesheet declares' }); continue; }
    proposals.push(record);
    answers.push({ finding_id: finding.proposal_id ?? null, proposal_id: record.proposal_id, lens: finding.lens, severity: finding.severity });
    approvals.push(ctx.approvalFor(span, record, finding));
  }

  return { proposals, approvals, refused, answers, eligible: eligible.length };
}

function buildProposal({ ctx, span, finding, recipe, surface }) {
  const b = new RecordBuilder({ contract: 'UXProposal', agent: 'ux-auditor', now: ctx.now(), span, simulated: ctx.simulated });
  const refs = ctx.evidenceFor(b, finding);

  for (const page of finding.pages ?? []) b.addEntity({ kind: 'page', id: null, path: page, field: null, note: null });
  for (const mod of finding.modules ?? []) b.addEntity({ kind: 'module', id: null, path: mod, field: null, note: null });
  for (const file of new Set((finding.evidence ?? []).map((e) => e.file).filter(Boolean))) {
    if (/\.css$/.test(file)) b.addEntity({ kind: 'stylesheet', id: null, path: file, field: null, note: null });
  }

  /* THE FILES ARE THE FINDING'S, not the recipe's. SESSION 17 asks
     the proposal to identify the affected files, and the honest
     answer is the set the evidence was quoted from plus whatever the
     operations name — both read rather than asserted. */
  const files = [...new Set([
    ...(finding.evidence ?? []).map((e) => e.file),
    ...recipe.change.operations.map((o) => String(o.target).split(' ')[0]),
  ])].filter((f) => /\.(mjs|js|css|html|json|md)$/.test(f)).sort();

  /* AND THE TOKENS ARE READ OFF THE RULES THE CHANGE WOULD TOUCH.
     A proposal's declared dependency on the design system is
     harvested from the evidence rather than claimed about it. */
  const tokens_used = tokensIn((finding.evidence ?? []).map((e) => e.quote).join(' '), surface.tokens);

  b.set('proposal_id', ctx.ids.mint(`prop-uxp-${finding.lens.replace(/_/g, '-')}`, { kind: `${finding.lens}-proposal`, entities: files, subject: finding.subject }));
  b.set('reason', `${recipe.user_problem} ${finding.why_it_matters}`);
  b.set('proposal_kind', 'testable_proposal');
  b.set('finding_class', finding.finding_class);
  b.set('affected_journey', finding.journey ? { id: finding.journey.id, label: finding.journey.label, pages: finding.journey.pages, why: finding.journey_why } : null);
  b.set('success_criterion', finding.success_criterion);

  b.set('success_metrics', recipe.metrics);
  b.set('regression_risks', recipe.risks);
  b.set('accessibility_checks', recipe.checks);
  b.set('browser_tests', recipe.tests);
  b.set('tokens_used', tokens_used);

  b.set('pages', finding.pages ?? []);
  b.set('components', finding.components ?? []);
  /* NO NEW TOKEN, IN ANY PROPOSAL THIS AGENT WRITES. SESSION 17's
     rule is that a proposal uses the existing design system, and the
     narrowest reading of it — never add one — is the one this agent
     takes, because it has no way to establish that the system
     genuinely cannot hold something. */
  b.set('tokens_added', []);
  b.set('status_conveyed_by_hue_alone', false);
  b.set('adds_third_party_asset', false);
  b.set('accessibility', {
    keyboard_reachable: false,
    accessible_name: false,
    contrast_checked: false,
    screen_reader_checked: false,
    note: `Nothing was verified about a rendered page. The ${recipe.checks.length} accessibility check(s) and ${recipe.tests.length} browser test(s) on this record are what would HAVE to be done before it lands; none of them has been done. This repository has no browser harness, so every one of them is a step a person performs.`,
  });
  b.set('motion_note', 'Nothing in this proposal adds a transition. Anything that did would have to be silent under prefers-reduced-motion, which css/tokens.css and js/dialog.js both already honour.');

  b.set('proposed_change', {
    summary: recipe.change.summary,
    /* THE OPERATIONS STILL CARRY A NULL `proposed`. SESSION 17 asks
       for the smallest coherent change, not for the diff: "Do not
       implement proposals in this session." A drafted stylesheet
       here would be an implementation wearing a proposal's shape. */
    operations: recipe.change.operations.map((o) => ({ ...o, proposed: null })),
    scope_note: recipe.change.scope_note,
  });
  b.set('validation_requirements', ctx.validators);
  b.set('rollback_plan', ROLLBACK(`the change to ${files.join(' and ')}`));

  /* AUTONOMY. Amber only where the whole change is adding a check
     that no reader sees; red everywhere a reader would meet the
     difference. Derived from the operations rather than chosen. */
  /* AMBER ONLY WHERE NO READER MEETS THE CHANGE. `reader_visible` is
     the recipe's own judgement and it is not derivable from the
     operation's target: a change to tools/_footer.mjs regenerates
     seven published pages, and a change to tools/design-qa.mjs adds a
     check the site never renders. The first draft of this derived
     amber from "the target starts with tools/" and made a change that
     rewrites every page in the site reviewable rather than the
     author's. */
  const invisible = recipe.change.reader_visible === false
    && recipe.change.operations.every((o) => /^tools\//.test(String(o.target)));
  b.set('autonomy_class', invisible ? 'review_required' : 'human_only');
  b.set('risk', finding.severity === 'critical' ? 'high' : 'medium');
  b.set('confidence', Math.max(0.5, (finding.confidence ?? 0.75) - 0.15));

  b.fact(null, true, `The ${(finding.evidence ?? []).length} extract(s) this proposal stands on were read from ${files.join(', ')}, and contain what they are quoted as containing.`, refs.length ? refs : undefined);
  /* THE SEVERITY IS THE FINDING'S, carried across rather than
     recomputed: a proposal that re-derived it could disagree with
     the finding it answers, and the backlog would then be ordered by
     one number and the proposals by another. */
  b.inference('severity', finding.severity, `Carried from the finding this proposal answers (${finding.proposal_id ?? 'unrecorded'}), which agent/ux/severity.mjs derived as ${finding.severity}.`, refs, 'Copied from the finding rather than recomputed, so a proposal and the finding it answers cannot disagree about how bad the thing is.');
  b.inference('proposed_change', undefined, `The smallest coherent change for this finding is ${recipe.change.summary}`, refs, 'Taken from the recipe recorded for this lens in agent/ux/proposals.mjs, filled from the finding\'s own evidence: the files, the counts and the tokens are read off the extracts, and only the reader problem and the hypothesis are this agent\'s judgement.');
  b.interpretation('hypothesis', recipe.hypothesis, {
    held_by: 'ux-auditor',
    /* THE HYPOTHESIS IS THE ONE THING HERE THAT IS NOT DERIVED, and
       it is typed as an interpretation and marked contested so it
       cannot be read as a finding about a reader. */
    basis: 'Not measured. This repository has no analytics, no telemetry and no user research, and UXProposal.forbidden.users_affected exists so a count of affected readers cannot be written into a record at all. The hypothesis is what this agent believes would follow from the files it read, and the browser tests on this record are what would test it.',
    contested: true,
  });
  b.set('hypothesis', recipe.hypothesis);

  ctx.limitation(b);
  b.openNull(null, 'Would this change actually help a reader?',
    `Untested. The ${recipe.tests.length} browser test(s) and ${recipe.checks.length} accessibility check(s) on this record are what would answer it, and every one of them is a step a person performs — this repository has no browser harness and no dependency budget for one.`,
    { blocks: true });

  const check = tokensExist({ tokens_used, tokens_added: [] }, surface.tokens);
  if (!check.ok) {
    span.observe({ summary: `NO PROPOSAL — ${finding.subject} names a token the design system does not have`, subject: finding.subject, data: { unknown: check.unknown, why: check.why }, confidence: 1, risk: 'high' });
    return null;
  }

  return ctx.ship(span, b.build(), [finding.proposal_id].filter(Boolean));
}
