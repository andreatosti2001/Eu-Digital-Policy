/* ============================================================
   agent/ux/lenses.mjs — the ten questions, as code

   SESSION 16's brief lists what to study: the current site, the CSS
   and design tokens, navigation, interaction patterns, responsive
   behaviour, the evidence interfaces, the comparison interfaces,
   search, the glossary, the applicability flow, localisation, and
   the design QA rules that already exist. There is one lens per
   question, and each answers FROM THE FILES rather than from
   anything anybody knows about how websites ought to look:

     1  Is a state carried by hue alone?
     2  Is one interaction contract implemented twice?
     3  Is something that behaves like a control built as one?
     4  Does every control keep its name at every width?
     5  Is there a breakpoint vocabulary, or twelve magic numbers?
     6  Can a reader tell an absence of knowledge from a negative
        finding?
     7  Can a reader get anywhere without JavaScript?
     8  Does the interface say which language it is in?
     9  What does the reading surface cost to open?
    10  What does tools/design-qa.mjs not check?

   A LENS THAT FINDS NOTHING IS A RESULT. Each reports what it
   EXAMINED as well as what it found, so a reader can tell "looked
   and found nothing" from "did not look" — the discipline
   `agent/depth/` and `agent/architect/` already work under, and the
   reason a zero from one of these is information rather than an
   untested branch. Several of these lenses do return zero, because
   this site is careful, and reporting that is the point.

   EVERY FINDING DECLARES `about`, and only `interface` is this
   agent's — `boundary.mjs` does the partitioning and nothing here
   may skip it. Every finding QUOTES the bytes it read, at a file
   and a line; a finding that cannot is a design opinion and is set
   aside as one.

   AND NOTHING HERE OPENED A PAGE. Every lens reads source. Where
   the source cannot settle a question — whether a colour-only state
   also carries its own word, whether a control is reachable in
   practice — the lens produces an OPEN QUESTION with the bytes
   attached, never a finding. That rule is inherited from SESSION
   15's `labelAmbiguity` and it is what keeps the audit's coverage
   claim honest.
   ============================================================ */

import { lineAt, NON_COLOUR_CHANNELS } from './surface.mjs';

const uniq = (xs) => [...new Set(xs)];
const clip = (s, n = 300) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };

/** An evidence extract: the bytes, and where they are. Every finding
 *  is built out of these, and `boundary.standingOf` refuses one that
 *  has none. */
export const at = (file, line, quote, note = null) => ({
  file, line, locator: `${file}:${line}`, quote: clip(quote, 600), note,
});

/**
 * A COUNT, which is not a quote.
 *
 * "bibliography.html has no inbound relative link" is not a string in
 * any file; it is something this run counted, and dressing it as a
 * quoted extract with a file and a line would put a fabricated quote
 * behind a real locator. The schema already has `measurement` as an
 * evidence kind for exactly this, and it had never been produced.
 *
 * The suite's byte-check skips these and asserts instead that each
 * one states what was counted and over what — which is the only thing
 * that makes a count checkable.
 */
export const counted = (over, statement, note = null) => ({
  file: null, line: null, locator: over, quote: clip(statement, 600), note, measured: true,
});

/** The class a rule actually paints, which is not always the class
 *  carrying the state: `.bg-row[data-g="primary"] .bg-n` puts the
 *  state on the row and the colour on the source's NAME. Which of
 *  the two is painted decides whether the element's own text can
 *  carry the meaning, so it is derived rather than assumed. */
export function paintedClassOf(selector) {
  const last = selector.split(',')[0].trim().split(/\s+/).pop() ?? '';
  const cls = last.replace(/::?[a-z-]+(\([^)]*\))?/g, '').match(/\.[A-Za-z][\w-]*/g);
  return cls ? cls[cls.length - 1] : null;
}

/** Does this template put the state's own word inside the element?
 *
 *  Three answers, and the third is the important one. A template
 *  that interpolates a label — `esc(g.label)`, `VERDICT[x].word`,
 *  `taxLabel(...)` — names the state, and colour is then decoration
 *  over text that already says it. A template that interpolates a
 *  NAME or a NUMBER does not: the reader sees "Reuters" or "17" in
 *  a colour, and the colour is the whole of the meaning. Anything
 *  else is not decidable from the source, and becomes an open
 *  question rather than either answer. */
const LABEL_SHAPED = /\.label\b|\.word\b|taxLabel|\btierWord\b|\bVERDICT\[|\.state\b|\bstatusWord\b|\bg\.label\b|\bwordOf\b/;
const NAME_SHAPED = /short_name|full_name|publisher_name|\.name\b|\.title\b|\.statement\b|\.heading\b|\bnumber\b|\.length\b|\.size\b|\bcount\b/;

export function carriesItsWord(template, values = []) {
  const t = String(template ?? '');
  if (LABEL_SHAPED.test(t)) return { answer: 'names_the_state', why: 'it interpolates the state\'s own label' };

  /* The state's value is often a SLUG of the word the reader sees —
     `undet` for "Not determined", `in-force` for "In force" — so a
     value is matched as a prefix of a rendered word as well as
     whole. Three characters is the floor: below that a slug matches
     half the alphabet. */
  for (const v of values) {
    const bare = String(v).replace(/[^a-z0-9]+/gi, ' ').trim();
    if (bare.length < 3) continue;
    const stem = bare.split(/\s+/)[0];
    const pattern = bare.replace(/\s+/g, '[ -]');
    if (new RegExp(`>[^<]*\\b${pattern}`, 'i').test(t)) return { answer: 'names_the_state', why: `its text contains "${v}"` };
    if (stem.length >= 5 && new RegExp(`>[^<]*\\b${stem}`, 'i').test(t)) return { answer: 'names_the_state', why: `its text contains a word beginning "${stem}"` };
  }

  /* WHAT THE ELEMENT INTERPOLATES, one expression at a time.
     `names_something_else` is only returned where EVERY interpolated
     expression is a name, a title or a count — because a component
     that renders `list.length` and then `esc(b.short)` renders both
     a number and, two spans later, the word for the state it is in,
     and a check that stopped at the first `.length` reported it as
     carrying its meaning in hue. It does not, and the second draft
     of this lens said it did. Anything mixed is UNDECIDABLE, which
     becomes an open question and never a finding. */
  const rendered = t.slice(t.indexOf('>') + 1);
  const expressions = [...rendered.matchAll(/\+\s*([^+]+?)\s*(?=\+|$)/g)]
    .map((m) => m[1].trim())
    .filter((x) => x && !/^['"]/.test(x));
  if (!expressions.length) {
    return { answer: 'names_something_else', why: 'it carries a static string or a glyph, and the state word is not in it' };
  }
  const named = expressions.filter((x) => NAME_SHAPED.test(x));
  if (named.length === expressions.length) {
    return { answer: 'names_something_else', why: `everything it renders is a name, a title or a count — ${clip(named.slice(0, 2).join(', '), 80)} — and not the state` };
  }
  return { answer: 'undecidable', why: `it renders ${expressions.length} expression(s), of which ${expressions.length - named.length} could be a label; what a reader sees cannot be settled from the source` };
}

/* ============================================================
   1 · Is a state carried by hue alone?
   ============================================================ */

/**
 * `css/tokens.css` states the rule in its own header: "STATUS IS
 * NEVER CARRIED BY HUE ALONE. Every status token comes with a glyph
 * and a border style." `.badge` obeys it — nine states, eight
 * glyphs, four border styles. The question is whether every OTHER
 * state-drawing component in the four stylesheets does, and the
 * answer is derived per (component, attribute) group rather than per
 * rule: a component whose glyph is set once on the base class and
 * whose hue varies per state is carrying the state by hue, and a
 * rule-by-rule check would not see it.
 *
 * The second gate is what keeps this honest. A colour-only state on
 * an element whose own text is the state word is decoration over a
 * label, and reporting it would be reporting `.evi-grade`, which
 * renders "PRIMARY" in a colour and is fine. So the emitting
 * template is read, and where it cannot be settled the pair becomes
 * an open question with the bytes attached.
 */
export const hueLens = {
  id: 'hue_alone',
  question: 1,
  label: 'status without colour',
  asks: 'Is a state carried by hue alone?',
  why: 'A state a reader cannot get in greyscale, in a monochrome print, or with a red-green deficiency is a state that reader does not have. css/tokens.css says the rule; this asks whether every component keeps it.',
  inspect(surface) {
    const findings = [];
    const examined = [];
    const questions = [];

    /* Group every state rule by the component and attribute it
       belongs to, so the question is about the SET of states rather
       than one rule at a time. */
    const groups = new Map();
    for (const row of surface.states) {
      const painted = paintedClassOf(row.selector);
      const key = `${row.component ?? '?'}|${row.attr}|${painted ?? '?'}`;
      if (!groups.has(key)) groups.set(key, { component: row.component, attr: row.attr, painted, rows: [], values: new Set(), channels: new Set(), files: new Set() });
      const g = groups.get(key);
      g.rows.push(row);
      g.values.add(row.value);
      for (const p of row.props) if (NON_COLOUR_CHANNELS.includes(p)) g.channels.add(p);
      g.files.add(row.file);
    }

    for (const g of groups.values()) {
      examined.push(`${g.component}[data-${g.attr}] → ${g.painted}`);
      if (g.values.size < 2) continue;                        /* one state is not a set of states */
      if (g.channels.size) continue;                          /* the set varies a non-colour channel */
      const colourRows = g.rows.filter((r) => r.props.includes('color'));
      if (colourRows.length < 2) continue;

      /* DOES THE COMPONENT SAY WHICH STATE IT IS IN, ANYWHERE IN
         ITSELF? Not "does the painted element" — a first draft asked
         that and reported `.sop-band`, whose coloured number sits
         beside a `.sb-label` carrying the status word two spans
         later. The reader gets the state from the label; the hue is
         decoration over it. So the container that CARRIES the state
         is read whole, and the painted leaf is read as well where it
         is a different element. */
      const container = g.component;
      const emissions = [
        ...(container ? emissionsFor(surface, container, { whole: true }) : []),
        ...(g.painted && g.painted !== container ? emissionsFor(surface, g.painted) : []),
      ];
      const verdicts = emissions.map((e) => ({ ...e, ...carriesItsWord(e.template, [...g.values]) }));
      const named = verdicts.filter((v) => v.answer === 'names_the_state');
      const other = verdicts.filter((v) => v.answer === 'names_something_else');
      const unknown = verdicts.filter((v) => v.answer === 'undecidable');

      /* ONE EMISSION THAT NAMES THE STATE IS ENOUGH TO STOP THIS
         BEING A FINDING. The claim would be "a reader cannot get
         this state without colour", and a component that renders its
         own state word somewhere refutes it. Where SOME emissions
         name it and others do not, the component is inconsistent and
         reading source cannot say which one a given reader meets —
         so it becomes an open question, never a finding. */
      if (named.length && !other.length && !unknown.length) continue;
      if (named.length) {
        questions.push({
          subject: `${g.component}[data-${g.attr}]`,
          question: `\`${g.component}\` draws ${g.values.size} states in \`color\` alone. ${named.length} of its ${verdicts.length} emission(s) render the state's own word and ${verdicts.length - named.length} do not. Does every instance a reader meets carry the word?`,
          missing: 'Which emission renders on which page, for which record, is a runtime question. Nothing here opened the page, and a component that names its state in one branch and not another is not settled by reading either branch.',
          evidence: [
            ...colourRows.slice(0, 3).map((r) => at(r.file, r.line, `${r.selector}{${r.declarations.map((d) => `${d.prop}:${d.value}`).join(';')}}`)),
            ...verdicts.filter((v) => v.answer !== 'names_the_state').slice(0, 2).map((v) => at(v.module, v.line, v.template, `this emission ${v.why}`)),
          ],
        });
        continue;
      }

      if (!verdicts.length || unknown.length) {
        questions.push({
          subject: `${g.component}[data-${g.attr}]`,
          question: `${g.values.size} states of \`${g.component}\` differ only in \`color\`. Does the element the colour lands on say which state it is?`,
          missing: verdicts.length
            ? 'The emitting template neither interpolates a state label nor a name, and nothing here opened the page to look.'
            : (g.painted
              ? `No module in js/ or app.js emits class "${String(g.painted).replace(/^\./, '')}" in a string literal this agent can read, so what the element contains could not be established from the source.`
              : `The rule paints a bare element rather than a class (\`${g.rows[0].selector}\`), so there is no class to trace back to the code that draws it, and what the element contains could not be established from the source.`),
          evidence: colourRows.slice(0, 4).map((r) => at(r.file, r.line, `${r.selector}{${r.declarations.map((d) => `${d.prop}:${d.value}`).join(';')}}`)),
        });
        continue;
      }

      const modules = uniq(other.map((v) => v.module));
      const pages = pagesLoading(surface, modules);
      findings.push({
        lens: 'hue_alone',
        question: 1,
        about: 'interface',
        design_qa_overlap: null,
        finding_class: 'accessibility_defect',
        subject: `${g.component}[data-${g.attr}] paints ${g.painted}`,
        problem: `\`${g.component}\` draws ${g.values.size} different states — ${[...g.values].sort().join(', ')} — and the only thing that changes between them is \`color\`, on \`${g.painted}\`, whose own text is ${other[0].why}. In greyscale, in a monochrome print, or to a reader with a red-green deficiency, the ${g.values.size} states are one state.`,
        why_it_matters: `css/tokens.css states the rule in its own header — status is never carried by hue alone, every status token comes with a glyph and a border style — and says it is there because the failure already shipped twice. \`.badge\` in the same file obeys it with eight glyphs and four border styles. This component does not, and nothing in tools/ checks for it: design-qa.mjs reads structure and colour LITERALS, not whether two states are distinguishable.`,
        method: `Grouped every rule in the four stylesheets whose selector carries a [data-*="value"] state, by the component and the painted element. Kept the groups with two or more states where no rule in the group varies any of ${NON_COLOUR_CHANNELS.length} non-colour channels. Then read the modules that emit the painted class and kept only the groups where the element's own text is a name, a count or a static glyph rather than the state's own word.`,
        evidence: [
          ...colourRows.slice(0, 6).map((r) => at(r.file, r.line, `${r.selector}{${r.declarations.map((d) => `${d.prop}:${d.value}`).join(';')}}`, 'the state, drawn')),
          ...other.slice(0, 3).map((v) => at(v.module, v.line, v.template, `what ${g.painted} actually contains`)),
        ],
        components: [g.component, g.painted].filter(Boolean),
        modules,
        pages,
        spread: uniq([...g.files, ...modules]).length,
        misreads_absence: [...g.values].some((v) => /unknown|undet|not-reached|pending|unresolved/.test(v)),
        blocks_journey: false,
        recommendation: `Give each state of \`${g.component}\` a second channel, the way \`.badge\` already does in css/tokens.css: a ::before glyph, a border-style, or a font-style. WHICH channel, and which glyph, is a design decision and is not proposed here.`,
        success_criterion: `A greyscale rendering of a page carrying \`${g.component}\` distinguishes all ${g.values.size} states, and a rule in a stylesheet varies a non-colour channel for each of them — which is checkable by re-running this lens and getting nothing.`,
        scope_note: 'It names a component whose states are indistinguishable without colour. It does not choose the glyph, the border or the hue, and it changes no stylesheet.',
        operations: [{
          op: 'modify',
          target: `${[...g.files][0]} — the ${g.values.size} \`${g.component}[data-${g.attr}]\` rules`,
          current: colourRows.map((r) => `${r.selector}{${r.declarations.map((d) => `${d.prop}:${d.value}`).join(';')}}`).join(' '),
          rationale: 'A second, non-colour channel per state, chosen from the ones css/tokens.css already uses for .badge so the interface gains no new vocabulary. The channel is the author\'s choice; this operation carries no drafted value.',
        }],
      });
    }

    /* ------------------------------------------------------------
       AND THE FINDING THAT IS ABOUT THE SET RATHER THAN A MEMBER.

       Nine of the ten questions above could not be settled from the
       source, and that is itself a fact about the design system: the
       repository states the rule once, implements it once, and then
       draws status nine more times without it.

       `css/tokens.css` gives `.badge` eight glyphs and four border
       styles, and its header says why — "STATUS IS NEVER CARRIED BY
       HUE ALONE… The three pigments are already spent". Every other
       status component in the four sheets varies `color` and nothing
       else, and whether each one gets away with it depends on
       whether the element beside it happens to carry a word. That is
       not a rule; it is nine separate accidents, and it is why nine
       of these could only be answered by opening a page.
       ------------------------------------------------------------ */
    const adopters = new Set();
    const bypassers = new Map();
    for (const g of groups.values()) {
      if (g.values.size < 2) continue;
      const key = `${g.component}[data-${g.attr}]`;
      if (g.channels.size) { adopters.add(key); continue; }
      if (!g.rows.some((r) => r.props.includes('color'))) continue;
      if (!bypassers.has(key)) bypassers.set(key, g);
    }
    if (bypassers.size >= 2 && adopters.size) {
      const header = quoteFrom(surface, 'css/tokens.css', /STATUS IS NEVER CARRIED BY HUE ALONE[\s\S]{0,320}/);
      const badgeGlyphs = surface.sheets
        .flatMap((sh) => sh.rules)
        .filter((r) => /\.badge\[data-st=/.test(r.selector) && r.declarations.some((d) => d.prop === 'content'))
        .slice(0, 3);
      const files = uniq([...bypassers.values()].flatMap((g) => [...g.files]));
      findings.push({
        lens: 'hue_alone',
        question: 1,
        about: 'interface',
        design_qa_overlap: null,
        finding_class: 'information_architecture',
        subject: `the status rule is stated once, implemented once, and bypassed by ${bypassers.size} components`,
        problem: `css/tokens.css states the rule in its own header and gives \`.badge\` ${surface.sheets.flatMap((sh) => sh.rules).filter((r) => /\.badge\[data-st=/.test(r.selector) && r.declarations.some((d) => d.prop === 'content')).length} glyph rules and four border styles to keep it. ${bypassers.size} other components across ${files.join(', ')} draw a multi-state status and vary \`color\` and nothing else: ${[...bypassers.keys()].slice(0, 8).join(', ')}${bypassers.size > 8 ? `, +${bypassers.size - 8}` : ''}. Whether each of them is legible without colour depends on whether a sibling element happens to carry the state's word, and for ${questions.length} of them this agent could not establish from the source that it does.`,
        why_it_matters: 'The rule is not enforced anywhere. tools/design-qa.mjs checks that a colour literal is not used outside the two files allowed to declare one, and that a theme-dependent token is not declared at :root; it does not check that two states of one component are distinguishable. So the rule holds where somebody remembered it and lapses silently where nobody did, and the lapse is invisible in the theme you happen to be developing in — which is the same failure mode the header says shipped twice already.',
        method: `Grouped every state rule in the four stylesheets by component and attribute. Counted the groups that vary a non-colour channel (${adopters.size}) against those that vary only colour (${bypassers.size}), then read the modules that emit each bypassing component to see whether its own text names the state. The count of groups this agent could not settle from the source is the measure of how much the rule is being kept by accident.`,
        evidence: [
          ...(header ? [header] : []),
          ...badgeGlyphs.map((r) => at(r.file, r.line, `${r.selector}{${r.declarations.map((d) => `${d.prop}:${d.value}`).join(';')}}`, 'the one component that keeps the rule')),
          ...[...bypassers.values()].slice(0, 5).map((g) => {
            const r = g.rows.find((x) => x.props.includes('color')) ?? g.rows[0];
            return at(r.file, r.line, `${r.selector}{${r.declarations.map((d) => `${d.prop}:${d.value}`).join(';')}}`, `${g.component} draws ${g.values.size} states and varies only colour`);
          }),
        ],
        components: [...bypassers.keys()],
        modules: [],
        pages: surface.pages.map((p) => p.page),
        spread: files.length,
        misreads_absence: [...bypassers.values()].some((g) => [...g.values].some((v) => /^(unknown|undet|not-reached)$/.test(v))),
        blocks_journey: false,
        recommendation: 'Either adopt `.badge` where a component draws a status, or make the rule checkable — a check that every set of sibling state rules varies at least one non-colour channel would catch the next lapse the day it is written. WHICH of the two, and whether some of these nine are deliberately decoration rather than status, is the author\'s decision and is not made here.',
        success_criterion: 'Every component in the four stylesheets that draws two or more states varies a non-colour channel between them, or is recorded as decoration rather than status — checkable by re-running this lens and getting no open questions.',
        scope_note: 'It measures how many components keep a rule the repository states, and how many this agent could not tell either way. It restyles nothing, adopts nothing, and does not decide which of the nine are status and which are decoration.',
        operations: [{
          op: 'add',
          target: 'tools/design-qa.mjs — a check that sibling state rules vary something other than colour',
          current: `The rule is stated in css/tokens.css and enforced nowhere. ${adopters.size} component(s) keep it, ${bypassers.size} do not.`,
          rationale: 'A rule that is written down and not checked is a rule that holds until somebody forgets. Whether the check belongs in design-qa.mjs or stays a lens in this agent is a decision about where this project\'s checks live, and it is the repository owner\'s.',
        }],
      });
    }

    return { findings, examined: uniq(examined), questions };
  },
};

/* ============================================================
   2 · Is one interaction contract implemented twice?
   ============================================================ */

/**
 * `js/dialog.js` opens with "One accessible dialog primitive… so no
 * view has to reimplement them, and so the four existing overlays
 * can adopt it later." `app.js` then reimplements it, and says so
 * too: "app.js is a classic script and js/dialog.js is a module, so
 * rather than reach across that line this is the same contract
 * implemented once here and applied to all four."
 *
 * Both comments are honest and the split is deliberate. What
 * neither says is that the two implementations have DIVERGED, which
 * is the finding: two dialogs on the same site behave differently,
 * and a reader cannot tell which one they are in.
 *
 * Derived rather than named: a contract is a set of marker strings
 * that only an implementation of that contract would contain. Where
 * two modules both carry the markers, the two implementations are
 * compared on the behaviours the contract is made of, and the
 * finding is the list of behaviours only one of them has.
 */
const CONTRACTS = [
  {
    id: 'modal_dialog',
    label: 'the modal dialog contract',
    markers: ['aria-modal', 'Escape'],
    /* HOW FAR FROM A MARKER A BEHAVIOUR STILL BELONGS TO THIS
       IMPLEMENTATION. A module-wide test is wrong in the direction
       that matters: `app.js` sets `aria-pressed` on the reading-lens
       buttons, 23 lines from the theme control and nothing to do with
       it, and a first draft of this lens duly reported the theme
       toggle as exposing a state it does not. Each contract states
       the span its implementation actually occupies, with a reason,
       rather than one number standing for both. */
    scope: 130,
    scope_why: 'js/dialog.js is 166 lines and the whole file is the implementation; app.js\'s makeModal and its two helpers run about 120 lines.',
    behaviours: [
      { id: 'focus_trap', test: /shiftKey/, says: 'traps Tab inside the panel' },
      { id: 'focus_restore', test: /opener/, says: 'returns focus to whatever opened it' },
      { id: 'inert_background', test: /inert/, says: 'makes the background inert' },
      { id: 'inert_everything', test: /document\.body\.children|for \(const el of document\.body/, says: 'inerts EVERY top-level element rather than a named list, so an element added to a page later is covered without anyone remembering' },
      { id: 'reduced_motion', test: /prefers-reduced-motion/, says: 'honours prefers-reduced-motion when it closes' },
      { id: 'visibility_test', test: /getClientRects/, says: 'decides what is focusable by getClientRects, which is correct for an element inside a transformed or fixed ancestor' },
    ],
  },
  {
    id: 'theme_control',
    label: 'the theme control',
    markers: ['eupolicy:theme'],
    scope: 20,
    scope_why: 'the control is a button and a click handler in both places, about fifteen lines each.',
    behaviours: [
      { id: 'aria_pressed', test: /aria-pressed/, says: 'exposes its state as aria-pressed' },
      { id: 'aria_label', test: /aria-label/, says: 'says which theme it will switch to, in its accessible name' },
      { id: 'private_mode', test: /catch\s*\(/, says: 'survives a localStorage that throws' },
    ],
    /* `prefers-color-scheme` is deliberately NOT a behaviour here.
       js/shell.js says in its own comment that the pre-paint
       bootstrap "stays inline in each page (it has to run before the
       first paint or the wrong palette flashes)" and that the module
       "owns only the control" — and six of the seven pages do carry
       it inline. A module-level test would report shell.js as
       ignoring the reader's system preference, which is false, and
       the fact it WOULD have caught — that index.html is the one page
       with no inline bootstrap — is a different finding about a
       different file. */
    not_a_behaviour: { id: 'system_preference', why: 'the pre-paint bootstrap is in the page markup on six pages and in app.js on the seventh; a module-level test says nothing about it' },
  },
];

/** The lines of a module that belong to one contract's
 *  implementation: everything within `scope` lines of an occurrence
 *  of one of its markers. */
export function contractRegion(src, markers, scope) {
  const lines = src.split('\n');
  const keep = new Set();
  lines.forEach((line, i) => {
    if (!markers.some((k) => line.includes(k))) return;
    for (let j = Math.max(0, i - scope); j < Math.min(lines.length, i + scope + 1); j++) keep.add(j);
  });
  return { text: [...keep].sort((a, b) => a - b).map((i) => lines[i]).join('\n'), lines: keep.size };
}

export const contractLens = {
  id: 'two_implementations',
  question: 2,
  label: 'interaction patterns',
  asks: 'Is one interaction contract implemented twice, and have the two drifted?',
  why: 'Two implementations of one behaviour is a cost. Two implementations that have diverged is a defect a reader meets as "sometimes Escape works differently", and no validator here compares them.',
  inspect(surface) {
    const findings = [];
    const examined = [];
    const questions = [];

    for (const contract of CONTRACTS) {
      examined.push(contract.id);
      const holders = surface.modules.filter((m) => contract.markers.every((k) => m.src.includes(k)));
      if (holders.length < 2) continue;

      const table = holders.map((m) => {
        const region = contractRegion(m.src, contract.markers, contract.scope);
        return {
          module: m.path,
          kind: m.kind,
          region,
          has: contract.behaviours.filter((b) => b.test.test(region.text)).map((b) => b.id),
        };
      });

      /* The finding is the DIVERGENCE, not the duplication. Two
         identical implementations of one contract are a maintenance
         cost and nobody's user problem; two that differ are a
         reader meeting two behaviours under one appearance. */
      const divergent = contract.behaviours.filter((b) => {
        const withIt = table.filter((t) => t.has.includes(b.id)).length;
        return withIt > 0 && withIt < table.length;
      });
      if (!divergent.length) {
        questions.push({
          subject: contract.id,
          question: `${holders.length} modules implement ${contract.label}. Do they behave identically at runtime?`,
          missing: `They agree on all ${contract.behaviours.length} behaviours this lens can read out of the source. Whether they agree in a browser is not something reading source can settle, and nothing here opened one.`,
          evidence: holders.map((m) => counted(m.path, `${m.path} carries ${contract.markers.join(' and ')}`)),
        });
        continue;
      }

      const evidence = [];
      for (const m of holders) {
        for (const marker of contract.markers.slice(0, 1)) {
          const idx = m.src.indexOf(marker);
          if (idx >= 0) evidence.push(at(m.path, lineAt(m.src, idx), m.src.slice(Math.max(0, idx - 90), idx + 130), `${m.path} implements ${contract.label}`));
        }
      }
      for (const b of divergent) {
        const withIt = table.find((t) => t.has.includes(b.id));
        const mod = surface.modules.find((m) => m.path === withIt.module);
        const idx = mod.src.search(b.test);
        if (idx < 0) continue;
        if (idx >= 0) evidence.push(at(mod.path, lineAt(mod.src, idx), mod.src.slice(Math.max(0, idx - 100), idx + 160), `only ${withIt.module} ${b.says}`));
      }

      const pages = pagesLoading(surface, table.map((t) => t.module));
      findings.push({
        lens: 'two_implementations',
        question: 2,
        about: 'interface',
        design_qa_overlap: null,
        finding_class: 'interaction_problem',
        subject: `${contract.label}, implemented in ${holders.length} places`,
        problem: `${contract.label} is implemented in ${table.map((t) => t.module).join(' and ')}, and the ${holders.length} implementations differ on ${divergent.length} behaviour(s): ${divergent.map((b) => `${b.id} (only ${table.filter((t) => t.has.includes(b.id)).map((t) => t.module).join(', ')} ${b.says})`).join('; ')}.`,
        why_it_matters: `A reader does not know which implementation they are in. ${divergent.some((b) => b.id === 'inert_everything') ? 'One of them inerts a NAMED LIST of background elements, so a top-level element added to a page later is not covered and a keyboard reader can tab out of an open dialog into content they cannot see. ' : ''}Both files say in their own comments that they are the one implementation of this contract; neither says the other exists in the form it now has. Nothing in tools/ compares two modules.`,
        method: `Found the modules carrying every marker of ${contract.label} (${contract.markers.join(', ')}), took the ${contract.scope} lines either side of each marker as that module's implementation — ${contract.scope_why} — and tested each region against ${contract.behaviours.length} behaviours the contract is made of. A behaviour present in some implementations and absent from others is the divergence; a behaviour absent from all of them is not this lens's finding, because a contract nobody implements is not a contract two things disagree about.${contract.not_a_behaviour ? ` \`${contract.not_a_behaviour.id}\` is deliberately not tested: ${contract.not_a_behaviour.why}.` : ''}`,
        evidence,
        components: [contract.id],
        modules: table.map((t) => t.module),
        pages,
        spread: pages.length,
        misreads_absence: false,
        blocks_journey: divergent.some((b) => b.id === 'focus_trap' || b.id === 'inert_everything'),
        recommendation: `Bring the ${holders.length} implementations to the same behaviour, or record on each why it differs. WHICH direction — a shared module both can reach, or the weaker one raised to the stronger — is an architecture decision, and this proposes neither.`,
        success_criterion: `Re-running this lens reports no behaviour that one implementation has and another lacks; or each divergence carries a comment in the source naming the reason, and this lens is taught to read it.`,
        scope_note: 'It names a divergence between two implementations. It does not merge them, does not decide which is correct, and writes no code.',
        operations: [{
          op: 'modify',
          target: table.map((t) => t.module).join(' and '),
          current: `${divergent.length} behaviour(s) present in one implementation and absent from the other: ${divergent.map((b) => b.id).join(', ')}.`,
          rationale: 'The two either behave the same or say why not. Which of the two is the reference is a decision about the module boundary between a classic script and an ES module, and it is the repository owner\'s.',
        }],
      });
    }
    return { findings, examined, questions };
  },
};

/* ============================================================
   3 · Is something that behaves like a control built as one?
   ============================================================ */

/**
 * A `<div>` with a click handler is a control to a mouse and
 * nothing at all to a keyboard. This site mostly gets it right —
 * the SVG contents nodes carry `role="button" tabindex="0"` and an
 * `aria-label`, and the palette is a real listbox with
 * `aria-activedescendant` — so this lens is expected to find
 * little, and finding little is the result.
 *
 * Derived from the stylesheets rather than from the modules,
 * because `cursor:pointer` is the site's own declaration that
 * something is pressable: the rule says "this looks like a control",
 * and the question is whether the element it lands on is one.
 */
const NATIVE_CONTROL = /^(a|button|input|select|textarea|summary|label|details)\b/;

/** How close a native control has to be to count as "beside it".
 *  Forty lines is one screen of this codebase's density; it is a
 *  judgement, it is in one place, and it decides only whether a pair
 *  becomes an open question rather than a finding. */
export const NEAR_LINES = 40;

/** A native control within NEAR_LINES of an element, in the same
 *  file. */
export function nativeControlNear(surface, el) {
  const holder = surface.modules.find((m) => m.path === el.where) ?? surface.pages.find((p) => p.page === el.where);
  const src = holder?.src;
  if (!src) return null;
  const lines = src.split('\n');
  const from = Math.max(0, el.line - 1 - NEAR_LINES);
  const to = Math.min(lines.length, el.line + NEAR_LINES);
  for (let i = from; i < to; i++) {
    const m = lines[i].match(/<button\b[^>]*>|el\(\s*'button'|createElement\(\s*'button'\s*\)/);
    if (m) return { where: el.where, line: i + 1, snippet: clip(lines[i], 220) };
  }
  return null;
}

export const controlLens = {
  id: 'not_a_control',
  question: 3,
  label: 'controls',
  asks: 'Is something that behaves like a control built as one?',
  why: 'cursor:pointer is the stylesheet saying "press this". A keyboard reader gets whatever the element actually is.',
  inspect(surface) {
    const findings = [];
    const examined = [];
    const questions = [];

    const pressable = [];
    for (const sheet of surface.sheets) {
      for (const rule of sheet.rules) {
        if (!rule.declarations.some((d) => d.prop === 'cursor' && /pointer/.test(d.value))) continue;
        for (const sel of rule.selector.split(',')) {
          const cls = paintedClassOf(sel);
          if (!cls) continue;
          pressable.push({ file: rule.file, line: rule.line, selector: sel.trim(), cls: cls.slice(1) });
        }
      }
    }

    const seen = new Set();
    for (const p of pressable) {
      if (seen.has(p.cls)) continue;
      seen.add(p.cls);
      examined.push(`.${p.cls}`);

      /* Every element carrying this class, in the markup and in the
         modules, with the tag it is built as. */
      const built = elementsWith(surface, p.cls);
      if (!built.length) {
        questions.push({
          subject: `.${p.cls}`,
          question: `A stylesheet gives \`.${p.cls}\` cursor:pointer. What element is it?`,
          missing: `No page and no module writes class="${p.cls}" in a form this agent can read, so the tag it lands on could not be established from the source. A class nothing emits is also a candidate for a dead rule, which is a different finding and not this lens's.`,
          evidence: [at(p.file, p.line, `${p.selector}{cursor:pointer}`)],
        });
        continue;
      }

      const bad = built.map((b) => ({ ...b, ...isOperable(b) })).filter((b) => !b.operable);
      if (!bad.length) continue;

      /* A NATIVE CONTROL BESIDE IT IS NOT A FIX, BUT IT IS NOT
         NOTHING EITHER. The compliance dial's dots are pressable
         circles and the dial also ships Previous and Next buttons
         and an arrow-key handler, so the function is reachable by
         keyboard even where the dot is not. Whether the two do the
         same thing is not something reading source can settle, so
         this becomes an open question with the bytes attached
         rather than a finding either way. */
      const nearNative = bad.map((b) => ({ b, near: nativeControlNear(surface, b) })).filter((x) => x.near);
      if (nearNative.length === bad.length) {
        questions.push({
          subject: `.${p.cls}`,
          question: `\`.${p.cls}\` is styled pressable and built as <${bad[0].tag}> with ${bad[0].why}. A native control sits within ${NEAR_LINES} lines of it. Does that control do the same thing?`,
          missing: 'Whether the neighbouring control offers the same action is a question about behaviour, and nothing here ran the page. Reading source can show that a keyboard path exists nearby; it cannot show that it goes to the same place.',
          evidence: [at(p.file, p.line, `${p.selector}{cursor:pointer}`), at(bad[0].where, bad[0].line, bad[0].snippet), at(nearNative[0].near.where, nearNative[0].near.line, nearNative[0].near.snippet, 'the native control beside it')],
        });
        continue;
      }

      const modules = uniq(bad.map((b) => b.where).filter((w) => /\.js$/.test(w)));
      const pages = uniq([...bad.map((b) => b.where).filter((w) => /\.html$/.test(w)), ...pagesLoading(surface, modules)]);
      findings.push({
        lens: 'not_a_control',
        question: 3,
        about: 'interface',
        design_qa_overlap: null,
        finding_class: 'accessibility_defect',
        subject: `.${p.cls} is styled as pressable and built as a <${bad[0].tag}>`,
        problem: `\`.${p.cls}\` carries \`cursor:pointer\`, which is this stylesheet saying it is pressable, and ${bad.length} of the ${built.length} element(s) that wear it are built as \`<${bad[0].tag}>\` with ${bad[0].why}. A pointer can press it. A keyboard cannot reach it and a screen reader is not told it is a control.`,
        why_it_matters: 'Every other pressable thing on this site is a real control or is given one: the contents tree\'s SVG nodes carry role="button" tabindex="0" and an aria-label, and the search palette is a listbox with aria-activedescendant. This is the exception, and nothing in tools/ looks for it — design-qa.mjs checks that an <img> has alt and that ids are unique, not that a styled control is operable.',
        method: `Collected every selector in the four stylesheets declaring cursor:pointer, took the class each one paints, then found every element carrying that class in the seven pages and the ${surface.modules.length} modules — in all three forms this codebase builds elements in — and read the tag and the attributes. Kept the ones that are neither a native control nor given both a control role and a tabindex, in either the markup's \`role="button"\` syntax or the el() helper's \`role: 'button'\`. Where a native control sits within ${NEAR_LINES} lines of every offending element, the pair became an open question instead: a keyboard path may exist beside it, and reading source cannot show it goes to the same place.`,
        evidence: [
          at(p.file, p.line, `${p.selector}{cursor:pointer}`, 'the stylesheet says this is pressable'),
          ...bad.slice(0, 4).map((b) => at(b.where, b.line, b.snippet, `built as <${b.tag}>`)),
        ],
        components: [`.${p.cls}`],
        modules,
        pages,
        spread: uniq([p.file, ...bad.map((b) => b.where)]).length,
        misreads_absence: false,
        blocks_journey: true,
        recommendation: `Make it a control: a \`<button>\` where it acts on this page, an \`<a>\` where it goes somewhere else, or the role/tabindex/keydown trio the contents nodes already use. WHICH of the three depends on what pressing it does, and this proposes none.`,
        success_criterion: `Every element carrying \`.${p.cls}\` is reachable by Tab and operable by Enter or Space, and re-running this lens reports nothing for it.`,
        scope_note: 'It names a styled control that is not one. It does not write the markup, does not choose between a button and a link, and adds no keyboard handler.',
        operations: [{
          op: 'modify',
          target: `.${p.cls} — ${bad.length} element(s) across ${uniq(bad.map((b) => b.where)).join(', ')}`,
          current: bad.slice(0, 3).map((b) => b.snippet).join(' … '),
          rationale: 'Something the stylesheet declares pressable should be operable by every input a reader has. What it should become depends on what it does when pressed, which this agent did not run.',
        }],
      });
    }
    return { findings, examined: uniq(examined), questions };
  },
};

/* ---------------------------------------------------------- shared */

/** Where a class is emitted, across the modules. */
export function emissionsFor(surface, className, { whole = false } = {}) {
  const want = String(className).replace(/^\./, '');
  const esc = want.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const needle = new RegExp(`class=("|')([^"'+]*\\b${esc}\\b[^"'+]*)`, 'g');
  const out = [];
  for (const m of surface.modules) {
    for (const found of m.src.matchAll(needle)) {
      const tokens = String(found[2] ?? '').trim().split(/\s+/);
      if (!tokens.includes(want)) continue;
      const after = m.src.slice(found.index, found.index + (whole ? 1400 : 700));
      /* A CONTAINER'S FIRST `</` IS ITS FIRST CHILD'S, not its own.
         `.sop-band` opens, renders a number, closes the number, and
         only then renders the label that says which state it is in —
         so a template cut at the first close tag stops one span
         before the answer. A container is read whole; a leaf is read
         to its own close. */
      const close = whole ? -1 : after.indexOf('</');
      out.push({ module: m.path, line: lineAt(m.src, found.index), template: clip(close === -1 ? after : after.slice(0, close), whole ? 1200 : 400) });
    }
  }
  return out;
}

/**
 * Every element carrying a class, in the pages and the modules,
 * with the tag and the attributes it is built with.
 *
 * THE CLASS ATTRIBUTE IS TOKENISED, never substring-matched. A word
 * boundary treats `chrome-btn-word` as carrying `chrome-btn`, and a
 * first draft of this lens duly reported the chrome's own buttons as
 * unreachable `<span>`s on the strength of the label inside them.
 * Every class here is hyphenated, so a boundary match is wrong for
 * nearly all of them.
 *
 * THREE CONSTRUCTION FORMS, because this codebase uses three and a
 * lens that read one would report the other two as absent:
 *
 *   markup / template   <button class="gloss" data-term="cra">
 *   the el() helper     el('circle', { class: 'rota-dot', role: 'button', tabindex: '0' })
 *   createElement       const b = document.createElement('button'); b.className = 'fn';
 *
 * The second draft of this lens reported `.rota-dot` as an
 * unreachable `<circle>`. It is a `<circle>` with `role: 'button'`,
 * `tabindex: '0'` and an `aria-label`, three lines below the class —
 * the lens was testing for `role="button"` and the helper writes
 * `role: 'button'`. Both syntaxes are read now, and that finding is
 * the reason.
 */
export function elementsWith(surface, className) {
  const want = String(className).replace(/^\./, '');
  const out = [];
  const hasClass = (value) => String(value ?? '').trim().split(/\s+/).includes(want);
  const push = (where, src, index, tag, attrs, snippet) => {
    out.push({ where, line: lineAt(src, index), tag: String(tag).toLowerCase(), attrs, snippet: clip(snippet, 300) });
  };

  const scanMarkup = (where, src) => {
    for (const m of src.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
      /* The class value may be a concatenation — `class="cmdk-item'
         + (idx === 0 ? ' sel' : '') + '"` — so the value is taken up
         to the closing quote OR to the break, whichever comes first.
         The base class always sits before the break here. */
      const cls = m[2].match(/\bclass=("|')([^"'+]*)/);
      if (!cls || !hasClass(cls[2])) continue;
      push(where, src, m.index, m[1], m[2], m[0]);
    }
  };

  for (const p of surface.pages) scanMarkup(p.page, p.src);

  for (const mod of surface.modules) {
    scanMarkup(mod.path, mod.src);

    for (const m of mod.src.matchAll(/el\(\s*'([a-z]+)'\s*,\s*\{/g)) {
      const body = balanced(mod.src, m.index + m[0].length - 1);
      const cls = body.match(/\bclass:\s*'([^']*)/);
      if (!cls || !hasClass(cls[1])) continue;
      push(mod.path, mod.src, m.index, m[1], body, `el('${m[1]}', {${clip(body, 220)}})`);
    }

    for (const m of mod.src.matchAll(/createElement\(\s*'([a-z]+)'\s*\)/g)) {
      /* The properties are set on the following lines rather than in
         a literal, so the window after the call IS the attribute
         list. Bounded at 1,200 characters: an element still being
         configured further down than that is one this lens cannot
         read, and it says so by finding no class. */
      const window = mod.src.slice(m.index, m.index + 1200);
      const cls = window.match(/\.className\s*=\s*'([^']*)'/);
      if (!cls || !hasClass(cls[1])) continue;
      push(mod.path, mod.src, m.index, m[1], window, `createElement('${m[1]}') … className = '${cls[1]}'`);
    }
  }
  return out;
}

/** The text between a `{` and its matching `}`. */
function balanced(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (!depth) return src.slice(open + 1, i); }
  }
  return src.slice(open + 1, open + 800);
}

/**
 * Is this element a control, however it was built?
 *
 * Both attribute syntaxes, because the markup writes `role="button"`
 * and the `el()` helper writes `role: 'button'`, and a check that
 * knew only the first reported the contents tree and the compliance
 * dial — both of which carry a role, a tabindex and an aria-label —
 * as unreachable shapes.
 */
export function isOperable(el) {
  if (NATIVE_CONTROL.test(el.tag)) return { operable: true, why: `a native <${el.tag}>` };
  const a = String(el.attrs ?? '');
  const role = a.match(/\brole\s*[:=]\s*["']([a-z]+)["']/);
  const tab = /\btabindex\s*[:=]\s*["']?-?\d/.test(a);
  if (role && /^(button|link|option|tab|checkbox|radio|menuitem|switch)$/.test(role[1]) && tab) {
    return { operable: true, why: `role="${role[1]}" with a tabindex` };
  }
  if (role && !tab) return { operable: false, why: `role="${role[1]}" with no tabindex: named as a control and not reachable by one` };
  if (tab) return { operable: true, why: 'a tabindex, though no role' };
  return { operable: false, why: 'no native semantics, no role and no tabindex' };
}

/** The first match of a pattern in a repository file, quoted with
 *  its line. Returns null rather than an empty quote: a finding that
 *  cited a file and quoted nothing would pass `standingOf` while
 *  standing on nothing. */
export function quoteFrom(surface, path, pattern) {
  const holder = surface.sheets.find((x) => x.file === path)
    ?? surface.modules.find((x) => x.path === path)
    ?? surface.pages.find((x) => x.page === path);
  const src = holder?.css ?? holder?.src;
  if (!src) return null;
  const m = src.match(pattern);
  if (!m) return null;
  return at(path, lineAt(src, m.index), m[0], 'the rule, as the repository states it');
}

/** Which pages actually run these modules, through the import graph. */
export function pagesLoading(surface, modules) {
  return uniq(modules.flatMap((m) => surface.graph.pagesLoading(m))).sort();
}

/* ============================================================
   4 · Does every control keep its name at every width?
   ============================================================ */

/**
 * A `title` attribute is not an accessible name.
 *
 * The accessible-name computation falls back to `title` only when
 * the element has no content and no label, so a control with text
 * inside it takes the text and the title never reaches assistive
 * technology at all. It also never reaches a touch reader, who has
 * no hover, and it disappears at a breakpoint if the text it
 * explains is hidden there.
 *
 * This site mostly gets that right: the chrome's search and theme
 * buttons both set an `aria-label`, which is why `chrome-btn-word`
 * being hidden below 820px costs them nothing. The lens looks for
 * the controls that do not.
 */
export const nameLens = {
  id: 'name_at_every_width',
  question: 4,
  label: 'accessible names',
  asks: 'Does every control keep a name that says what it does, at every width and to every reader?',
  why: 'A title attribute is not an accessible name, is not available on touch, and vanishes with the text it explains when a breakpoint hides it.',
  inspect(surface) {
    const findings = [];
    const examined = [];
    const questions = [];

    /* Classes a media query hides. Needed for the second half of the
       question: a control whose visible text is hidden at a width
       has only whatever name it declared. */
    const hidden = new Map();
    for (const sheet of surface.sheets) {
      for (const rule of sheet.rules) {
        if (!rule.at.some((c) => /width/.test(c))) continue;
        if (!rule.declarations.some((d) => d.prop === 'display' && /^none/.test(d.value))) continue;
        for (const sel of rule.selector.split(',')) {
          const cls = paintedClassOf(sel);
          if (!cls) continue;
          if (!hidden.has(cls.slice(1))) hidden.set(cls.slice(1), { at: rule.at.join(' and '), file: rule.file, line: rule.line, selector: sel.trim() });
        }
      }
    }

    for (const mod of surface.modules) {
      /* Controls built by the el() helper, which is how the whole
         chrome is built. */
      for (const m of mod.src.matchAll(/el\(\s*'(a|button)'\s*,\s*\{/g)) {
        const body = balanced(mod.src, m.index + m[0].length - 1);
        const cls = (body.match(/\bclass:\s*'([^']*)/) ?? [])[1] ?? '';
        examined.push(`${mod.path}:${lineAt(mod.src, m.index)} <${m[1]} class="${cls}">`);
        if (!/\btitle:\s*'/.test(body) && !/\btitle:\s*[A-Za-z]/.test(body)) continue;
        if (/aria-label/.test(body)) continue;

        /* What does it contain, and is any of it hidden at a
           breakpoint? Read from the lines after the construction,
           where this codebase sets innerHTML or appends children. */
        const after = mod.src.slice(m.index, m.index + 900);
        const inner = [...after.matchAll(/class="([^"]+)"/g)].flatMap((x) => x[1].split(/\s+/));
        const vanishing = inner.map((c) => ({ cls: c, rule: hidden.get(c) })).filter((x) => x.rule);

        const title = (body.match(/\btitle:\s*'([^']*)/) ?? [])[1] ?? null;
        const pages = surface.graph.pagesLoading(mod.path);
        findings.push({
          lens: 'name_at_every_width',
          question: 4,
          about: 'interface',
          design_qa_overlap: null,
          finding_class: 'accessibility_defect',
          subject: `a <${m[1]}> in ${mod.path} explains itself only in title=`,
          problem: `${mod.path} builds a \`<${m[1]}>\`${cls ? ` with class \`${cls}\`` : ''} whose explanation is a \`title\` attribute and which sets no \`aria-label\`. The accessible-name computation prefers the element's content, so the title never becomes the name; a touch reader has no hover and never sees it either.${vanishing.length ? ` And ${vanishing.map((v) => `\`.${v.cls}\``).join(', ')} — part of what it does show — is \`display:none\` under ${vanishing[0].rule.at}, so below that width the control is reduced to what is left.` : ''}`,
          why_it_matters: `${title ? `The title says: "${clip(title, 200)}". That is the whole of what tells a reader what this control is for. ` : ''}The two other controls the same module builds — the search button and the theme toggle — both set an \`aria-label\`, and the theme toggle repaints it on every change. This one is the exception, and nothing checks for it: design-qa.mjs checks that an \`<img>\` has an \`alt\`, not that a control has a name.`,
          method: 'Read every <a> and <button> built by the el() helper in the modules, kept the ones that set a title and no aria-label, then matched every class they contain against the classes a media query sets to display:none, so a control whose visible text disappears at a width is reported with the width.',
          evidence: [
            at(mod.path, lineAt(mod.src, m.index), clip(after.slice(0, 420), 500), 'the control, as built'),
            ...vanishing.slice(0, 2).map((v) => at(v.rule.file, v.rule.line, `${v.rule.selector}{display:none} under ${v.rule.at}`, `what it shows, hidden at a width`)),
          ],
          components: cls ? cls.split(/\s+/).map((c) => `.${c}`) : [],
          modules: [mod.path],
          pages,
          spread: pages.length,
          misreads_absence: false,
          blocks_journey: false,
          recommendation: 'Give it an `aria-label` that says what pressing it does, the way the search button and the theme toggle in the same module already do. WHAT the label should say is a wording decision and is not drafted here.',
          success_criterion: 'The control has an accessible name that states its purpose without hover, at every width; re-running this lens reports nothing for it.',
          scope_note: 'It names a control whose purpose lives in a title attribute. It writes no label, changes no module, and does not judge the wording of the title itself.',
          operations: [{
            op: 'modify',
            target: `${mod.path}:${lineAt(mod.src, m.index)} — the <${m[1]}> element`,
            current: clip(after.slice(0, 300), 400),
            rationale: 'A control whose name is a hover hint has no name for a keyboard reader, a screen-reader reader, or anyone on a touch screen. The wording is the author\'s.',
          }],
        });
      }
    }
    return { findings, examined: uniq(examined), questions };
  },
};

/* ============================================================
   5 · Is there a breakpoint vocabulary, or a set of magic numbers?
   ============================================================ */

/**
 * `css/tokens.css` gives this project a type scale of eleven roles,
 * one spacing scale, and a comment saying "A margin that is not on
 * it is a mistake, not a nuance." There is no such scale for
 * viewport widths, and there are twelve of them.
 *
 * The finding is not that twelve is too many. It is that a component
 * reflowing at 760 while the thing beside it reflows at 820 changes
 * at a different moment on the same screen, and nobody deciding
 * where a new component should break has anything to consult.
 */
export const breakpointLens = {
  id: 'breakpoints',
  question: 5,
  label: 'responsive behaviour',
  asks: 'Is there a breakpoint vocabulary, or a set of magic numbers?',
  why: 'Everything else in this design system is a named scale with a comment saying a value off it is a mistake. Viewport width is the exception.',
  inspect(surface) {
    const findings = [];
    const examined = surface.breakpoints.map((b) => `${b.key} × ${b.rules.length}`);
    const questions = [];

    const named = [...surface.tokens.declared.keys()].filter((t) => /(^--bp|breakpoint|--w-(sm|md|lg))/.test(t));
    const maxWidths = surface.breakpoints.filter((b) => b.dir === 'max');
    /* A width used in one file only is a number that file invented.
       A width used across three is a shared decision, whatever it is
       called. */
    const local = maxWidths.filter((b) => b.files.length === 1);

    if (maxWidths.length >= 6 && !named.length) {
      const scale = [...surface.tokens.declared.keys()].filter((t) => /^--s-\d/.test(t));
      const comment = quoteFrom(surface, 'css/tokens.css', /One scale\. A margin that is not on it is a mistake, not a nuance\./);
      findings.push({
        lens: 'breakpoints',
        question: 5,
        about: 'interface',
        design_qa_overlap: null,
        finding_class: 'information_architecture',
        subject: `${maxWidths.length} viewport widths, no declared scale`,
        problem: `The four stylesheets break at ${maxWidths.length} different max-widths — ${maxWidths.map((b) => `${b.px}px`).join(', ')} — and no custom property names any of them. ${local.length} of the ${maxWidths.length} appear in one stylesheet only. The same repository declares ${scale.length} spacing steps and eleven type roles as tokens, with a comment saying a value off the scale is a mistake rather than a nuance.`,
        why_it_matters: `A reader at 780px is past four of these and short of three more, and which components have reflowed is whatever each sheet happened to choose. Somebody adding a component has nothing to consult, so the thirteenth width gets invented the same way the first twelve did. This is the one axis of the design system with no vocabulary, and design-qa.mjs — which does check that every custom property used is declared — cannot see a number that was never a property.`,
        method: `Walked every at-rule in the four stylesheets, collected each (min|max)-width condition with the rules under it, then looked for a declared custom property naming any of them. Counted how many widths appear in only one sheet, because a width one file invented is the case a shared scale would have prevented.`,
        evidence: [
          ...(comment ? [{ ...comment, note: 'the rule this project applies to every other scale' }] : []),
          /* THE BYTES, not a summary of them. A first draft composed
             a sentence here and put a file:line on it, which passes
             every check except reading the file — and the suite's
             quote check is what caught it. */
          ...maxWidths.slice(0, 6).map((b) => at(b.rules[0].file, b.rules[0].line,
            `${b.rules[0].at.join(' ')}{ ${b.rules[0].selector}{${b.rules[0].declarations.map((d) => `${d.prop}:${d.value}`).join(';')}} }`,
            `${b.rules.length} rule(s) at this width, across ${b.files.join(', ')}${b.files.length === 1 ? ' — one stylesheet only' : ''}`)),
        ],
        components: [],
        modules: [],
        pages: surface.pages.map((p) => p.page),
        spread: uniq(maxWidths.flatMap((b) => b.files)).length,
        misreads_absence: false,
        blocks_journey: false,
        recommendation: 'Name the widths the way the spacing and type scales are named, and let the sheets reference the names. WHICH widths survive the consolidation is a design decision about a layout this agent has never seen rendered, and it is not made here.',
        success_criterion: 'Every viewport condition in the stylesheets resolves against a declared name, and adding a component means choosing from the scale rather than inventing a number — checkable by re-running this lens, which counts conditions that name nothing.',
        scope_note: 'It counts the widths and observes that nothing names them. It proposes no set of breakpoints, moves no rule, and takes no view on whether twelve is too many.',
        operations: [{
          op: 'add',
          target: 'css/tokens.css — a viewport scale beside the spacing and type scales',
          current: `${maxWidths.length} max-width conditions, ${local.length} of them in a single stylesheet, none named.`,
          rationale: 'Every other scale in this file is named and commented, and the comment on the spacing scale says why. Which widths belong on the scale is the decision, and this proposal carries none.',
        }],
      });
    }

    /* Two components that reflow at different widths inside the same
       layout is a sharper finding than the count, but it needs the
       rendered box model to establish, and nothing here rendered
       anything. */
    questions.push({
      subject: 'components that reflow at different widths',
      question: `Do any two components that sit side by side reflow at different widths — one at ${maxWidths[0]?.px ?? '?'}px and its neighbour at ${maxWidths[1]?.px ?? '?'}px?`,
      missing: 'Which components share a row is a question about the rendered box model. Nothing here opened a page, and reading selectors cannot tell a sibling from a cousin.',
      evidence: maxWidths.slice(0, 3).map((b) => at(b.rules[0].file, b.rules[0].line, `@media (max-width:${b.px}px) ${b.rules[0].selector}`)),
    });

    return { findings, examined, questions };
  },
};

/* ============================================================
   6 · Can a reader tell an absence of knowledge from a negative
       finding?
   ============================================================ */

/**
 * THE ONE THAT MATTERS MOST, and the `ux-audit` skill says so: "An
 * absence of knowledge must not read as a negative finding. This is
 * the site's own thesis applied to its interface, and it is the
 * highest-severity class of defect the project can ship."
 *
 * The site is careful about this in most places, and the careful
 * places are the reason the careless ones are findings rather than a
 * house style: the enforcement pipeline draws `unknown` as its own
 * state beside `not-reached`, the applicability tool writes "That is
 * absence of knowledge, not evidence that these instruments do not
 * apply to you" in the page, and one renderer writes "no fine" where
 * the field is null rather than a dash.
 *
 * What this looks for is the fallback that names no absence at all:
 * a bare em-dash, an empty string, or a zero standing where a value
 * was not found. A zero is the worst of the three, because unknown
 * summed into a total is the failure `AGENTS.md` rule 5 names
 * outright.
 */
const PLACEHOLDERS = [
  { pattern: /\|\|\s*'(—|-|–|n\/a|N\/A|\?)'/g, kind: 'a glyph', reads_as: 'something, but not which kind of absence' },
  { pattern: /\|\|\s*0\b/g, kind: 'a zero', reads_as: 'none — which is a value, and the one AGENTS.md rule 5 names: unknown is never zero' },
];

/** A fallback that says which absence it is. Counted so the finding
 *  can report the ratio rather than only the failures — this site
 *  does it right more often than not, and a report that showed only
 *  the lapses would misdescribe it. */
const SELF_DESCRIBING = /\|\|\s*'(not recorded|no fine|not established|none[^']*|not determined|unknown|no [a-z]+ (recorded|located|named))'/gi;

export const absenceLens = {
  id: 'absence_of_knowledge',
  question: 6,
  label: 'absence of knowledge',
  asks: 'Can a reader tell "nobody has looked" from "there is nothing"?',
  why: 'It is this site\'s own thesis applied to its own interface, and the ux-audit skill calls it the highest-severity class of defect the project can ship.',
  inspect(surface) {
    const findings = [];
    const examined = [];
    const questions = [];
    const fields = surface.absence_fields;

    /* Which field is this fallback covering? `rec.action || '—'`
       covers `action`. Needed because the question is not "does this
       template have a fallback" — nearly all of them do, and should
       — but "does the interface flatten a distinction the DATA
       draws". A fallback over a field no record ever leaves absent
       flattens nothing today. */
    const fieldOf = (source, at_) => {
      const before = source.slice(0, at_);
      const m = [...before.matchAll(/([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*$/g)].pop()
        ?? [...before.matchAll(/([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*\)?\s*$/g)].pop();
      return m ? m[2] : null;
    };

    const self = [];
    const bare = [];
    const cleared = [];
    for (const mod of surface.modules) {
      examined.push(mod.path);
      for (const m of mod.src.matchAll(SELF_DESCRIBING)) {
        self.push({ module: mod.path, line: lineAt(mod.src, m.index), text: m[0] });
      }
      for (const p of PLACEHOLDERS) {
        for (const m of mod.src.matchAll(p.pattern)) {
          const line = lineAt(mod.src, m.index);
          const source = mod.src.split('\n')[line - 1] ?? '';
          /* A counter initialising at zero is arithmetic, not an
             absence. Reporting it would be reporting a for-loop. */
          if (p.kind === 'a zero' && /\+\s*1|reduce\(/.test(source)) continue;
          const field = fieldOf(source, source.indexOf(m[0]) === -1 ? source.length : source.indexOf(m[0]));
          const entry = {
            module: mod.path, line, text: m[0], kind: p.kind, reads_as: p.reads_as,
            source: source.trim(), field,
            /* Three states, from the data rather than from a guess. */
            in_data: field ? (fields.both.has(field) ? 'both' : fields.nullable.has(field) ? 'null' : fields.unknownable.has(field) ? 'unknown' : 'never absent') : 'unidentified',
          };
          if (entry.in_data === 'never absent' || entry.in_data === 'unidentified') { cleared.push(entry); continue; }
          bare.push(entry);
        }
      }
    }

    /* WHAT WAS CLEARED IS PART OF THE ANSWER. A fallback over a field
       no record currently leaves absent renders nothing today and an
       em-dash the day one does; that is a latent case, and stating it
       as a finding would be reporting a defect nobody can see. */
    if (cleared.length) {
      questions.push({
        subject: 'fallbacks over fields no record currently leaves absent',
        question: `${cleared.length} fallback(s) supply a glyph or a zero for a field that is never null and never "unknown" in data/ today. What would they render the day a record leaves one of those fields absent?`,
        missing: `An em-dash, presumably — but that is a statement about a record that does not exist yet, and this agent will not report a defect nobody can currently see. The fields are ${uniq(cleared.map((c) => c.field ?? 'unidentified')).slice(0, 6).join(', ')}.`,
        evidence: cleared.slice(0, 4).map((c) => at(c.module, c.line, c.source, `covers \`${c.field ?? 'an expression this lens could not name'}\`, which no record in data/ leaves absent`)),
      });
    }

    if (!bare.length) return { findings, examined, questions };

    const modules = uniq(bare.map((b) => b.module));
    const pages = pagesLoading(surface, modules);
    /* THE GATE. It fires only where the DATA keeps two absences apart
       for this field and the renderer does not: that is the interface
       losing a distinction the corpus is making, which is the failure
       AGENTS.md rule 5 names. A fallback over a merely-nullable field
       is a defect and is not that. */
    const flattens = bare.filter((b) => b.in_data === 'both');
    findings.push({
      lens: 'absence_of_knowledge',
      question: 6,
      about: 'interface',
      design_qa_overlap: null,
      finding_class: 'usability_defect',
      subject: `${bare.length} render fallback(s) over a field the data leaves absent, none of which says which absence it is`,
      problem: `${bare.length} place(s) in ${modules.length} module(s) render a missing value as ${uniq(bare.map((b) => b.kind)).join(' or ')}, over a field that IS absent on records in data/ today: ${bare.slice(0, 4).map((b) => `\`${b.field}\` (${b.module}:${b.line}, ${b.text})`).join(', ')}${bare.length > 4 ? `, +${bare.length - 4}` : ''}. The same modules do it the other way ${self.length} time(s), with a fallback that names the absence: ${uniq(self.map((x) => x.text)).slice(0, 3).join(', ')}. A reader meeting the first kind cannot tell whether nobody looked, whether it was researched and is not determinable, or whether the answer is genuinely none.${flattens.length ? ` ${flattens.length} of them cover a field data/ carries as BOTH null and "unknown", so the renderer is flattening a distinction the corpus is making.` : ''}`,
      why_it_matters: 'AGENTS.md rule 5 is that `null` is not `unknown` and unknown is never zero, and rule 6 is that where no rule fires the answer is NOT DETERMINED and never "probably not". The datasets keep those states apart — 37 fields carry a null and 2 carry the "unknown" sentinel — and these fallbacks collapse them at the last step, in the renderer, where no validator looks. tools/validate.mjs reads the data and cannot see the template that draws it.',
      method: `Read every module for a fallback that supplies a value when one is missing; separated the ones that name the absence from the ones that do not; discarded fallbacks feeding a sum rather than a render; then named the field each one covers and looked it up in data/, keeping only the fallbacks over fields records actually leave absent. ${self.length} name the absence, ${bare.length} do not, and ${cleared.length} cover a field nothing leaves absent today and are an open question rather than a finding.`,
      evidence: [
        ...bare.slice(0, 6).map((b) => at(b.module, b.line, b.source, `covers \`${b.field}\`, which data/ carries as ${b.in_data}; renders ${b.kind}, which reads as ${b.reads_as}`)),
        ...self.slice(0, 3).map((x) => at(x.module, x.line, x.text, 'the same codebase, doing it the other way')),
      ],
      components: [],
      modules,
      pages,
      spread: modules.length,
      misreads_absence: flattens.length > 0,
      blocks_journey: false,
      recommendation: 'Replace each fallback that names no absence with one that does, choosing from the three states the datasets already keep apart. WHICH state each field is in is a question about the record rather than about the renderer, and this proposes no wording.',
      success_criterion: 'Every fallback in a renderer, over a field data/ leaves absent, names which of the three absences it is standing for — checkable by re-running this lens and getting no findings, only the latent cases as open questions.',
      scope_note: 'It names the fallbacks that say nothing about the absence they cover, over fields the corpus actually leaves absent. It does not decide which absence any particular field is in — that is a question about the record, and agent/depth/ owns it — and it edits no module.',
      operations: [{
        op: 'modify',
        target: `${modules.join(', ')} — ${bare.length} fallback expression(s)`,
        current: bare.slice(0, 4).map((b) => `${b.module}:${b.line} ${b.text} over \`${b.field}\``).join(' · '),
        rationale: 'The datasets distinguish three absences and the renderer flattens them. Which one each field carries is the author\'s to say; that the renderer should be able to say it is what this finding establishes.',
      }],
    });

    return { findings, examined, questions };
  },
};

/* ============================================================
   7 · Can a reader get anywhere without JavaScript?
   ============================================================ */

/**
 * `js/shell.js` owns the chrome and says why: five hand-written
 * headers had drifted, the same destination was called two things,
 * and the skip link pointed at an id that existed on one page out of
 * six. Consolidating them was right.
 *
 * What it also did was move every link between the seven pages out
 * of the markup and into a module. The `<noscript>` notice on every
 * page — identical by design, and `design-qa.mjs` errors if the
 * seven copies drift — lists what will not appear when scripting is
 * off. Navigation is not on the list.
 */
export const navLens = {
  id: 'navigation_without_js',
  question: 7,
  label: 'navigation',
  asks: 'Can a reader get from one page to another without JavaScript, and does the page say so if not?',
  why: 'Every page ships a noscript notice saying what will not appear. If the navigation is one of those things, the notice is the place a reader finds out.',
  inspect(surface) {
    const findings = [];
    const examined = surface.reachability.map((r) => `${r.page}: ${r.from_markup.length} markup, ${r.from_module.length} module`);
    const questions = [];

    const orphans = surface.reachability.filter((r) => r.from_markup.length === 0 && r.from_module.length > 0);
    if (!orphans.length) return { findings, examined, questions };

    const notices = uniq(surface.pages.map((p) => p.noscript).filter(Boolean));
    const mentionsNav = notices.some((n) => /navigat|other pages|links?\b|menu|sections of this project/i.test(n));
    const shell = surface.modules.find((m) => m.path === 'js/shell.js');
    const navComment = shell ? quoteFrom(surface, 'js/shell.js', /One list\.[\s\S]{0,180}/) : null;
    const noscriptPage = surface.pages.find((p) => p.noscript);

    findings.push({
      lens: 'navigation_without_js',
      question: 7,
      about: 'interface',
      design_qa_overlap: null,
      finding_class: 'discoverability',
      subject: `${orphans.length} of the ${surface.pages.length} pages are linked from no markup anywhere`,
      problem: `${orphans.map((o) => o.page).join(', ')} — ${orphans.length} of the ${surface.pages.length} pages — are reached only by links a module builds at runtime. Nothing in the seven HTML files links to them. With scripting off, or before js/shell.js runs, or if it throws, a reader on any page has no way to any other page except the address bar.${mentionsNav ? '' : ' The <noscript> notice every page carries lists what will not appear — the ledger, the status strips, the calendar, the evidence drawer, the comparison tables, the interactions view, search and the glossary — and does not mention the navigation.'}`,
      why_it_matters: 'The site already concedes, in its own words on every page, that the data-driven parts need scripting. That concession is what makes the omission matter: a reader who has read the notice believes the written analysis reads normally and that only the tools are missing. The written analysis does read normally. What they cannot do is leave the page.',
      method: `Built the link graph from the seven pages, counting only RELATIVE hrefs — the canonical URL and the og: tags name each page's own absolute address and are not navigation. Counted separately the links a module constructs, following js/shell.js's NAV model. Then read the <noscript> notice, which is identical across all seven pages by design, for any mention of navigation.`,
      evidence: [
        ...(navComment ? [navComment] : []),
        ...orphans.slice(0, 4).map((o) => counted(`the ${surface.pages.length} pages in this repository`, `${o.page} — 0 relative links to it in any of the ${surface.pages.length} pages; built at runtime by ${o.from_module.join(', ')}`, 'reachable only at runtime')),
        ...(noscriptPage ? [at(noscriptPage.page, lineAt(noscriptPage.src, noscriptPage.src.indexOf('<noscript>')), noscriptPage.noscript, 'what the page says will not appear')] : []),
      ],
      components: ['chrome-nav', 'portal-doors'],
      modules: ['js/shell.js'],
      pages: surface.pages.map((p) => p.page),
      spread: surface.pages.length,
      misreads_absence: false,
      blocks_journey: true,
      recommendation: 'Either put the six destinations in the markup — a list in the footer costs nothing and js/shell.js can go on owning the header — or add navigation to the list in the <noscript> notice, which tools/_footer.mjs regenerates across all seven pages from one source. WHICH of the two is a decision about whether this site intends to work without scripting, and it is not made here.',
      success_criterion: 'Either every top-level destination is reachable from every page with scripting disabled, or the noscript notice on every page names navigation among the things that will not appear — checkable by re-running this lens, which counts relative links in the markup and reads the notice.',
      scope_note: 'It counts links and reads a notice. It writes no markup, does not touch the footer generator, and takes no view on whether this site should work without scripting.',
      operations: [{
        op: 'add',
        target: `${orphans.length} destination link(s) in the markup, or one clause in the <noscript> notice`,
        current: `${orphans.map((o) => o.page).join(', ')} carry no inbound relative link. The notice lists eight things that will not appear and navigation is not one of them.`,
        rationale: 'A reader who has been told what will not work should not discover a ninth thing by finding themselves unable to leave. Which of the two fixes is right depends on an intention this agent cannot read out of the files.',
      }],
    });

    return { findings, examined, questions };
  },
};

/* ============================================================
   8 · Does the interface say which language it is in?
   ============================================================ */

/**
 * `i18n/locales.json` declares three shipped locales beside English
 * and carries the key counts itself; `js/shell.js` says plainly what
 * the situation is: "The tool pages have no UI translation — only
 * the entity overlay… Rather than pretend either that the language
 * does not exist or that these pages are translated, the chrome
 * carries the language the reader chose on the brief… and says
 * plainly that the interface text around it is English."
 *
 * That is the right decision, honestly taken. The lens asks whether
 * the interface actually manages to say it.
 */
export const localeLens = {
  id: 'localisation',
  question: 8,
  label: 'localisation',
  asks: 'Does a reader who chose another language find out where it stops?',
  why: 'Three locales ship. One page carries them. The chrome is where a reader is told, and what it can say depends on how wide the window is.',
  inspect(surface) {
    const findings = [];
    const examined = surface.localisation.by_page.map((p) => `${p.page}: ${p.keys} keys`);
    const questions = [];
    const loc = surface.localisation;

    if (!loc.shipped.length || !loc.untranslated_pages.length) return { findings, examined, questions };

    /* What the chrome says, and how much of it survives a narrow
       window. The word beside the language code is inside
       `.chrome-btn-word`, which a media query hides. */
    const shell = surface.modules.find((m) => m.path === 'js/shell.js');
    const noteAt = shell ? shell.src.indexOf('chrome-lang') : -1;
    const noteSrc = noteAt >= 0 ? shell.src.slice(Math.max(0, noteAt - 200), noteAt + 700) : null;
    const hiddenWord = surface.sheets.flatMap((sh) => sh.rules).find((r) =>
      r.at.some((c) => /max-width/.test(c))
      && /chrome-btn-word/.test(r.selector)
      && r.declarations.some((d) => d.prop === 'display' && /none/.test(d.value)));

    const pages = surface.pages.map((p) => p.page);
    findings.push({
      lens: 'localisation',
      question: 8,
      about: 'interface',
      design_qa_overlap: null,
      finding_class: 'usability_defect',
      subject: `${loc.shipped.length} locales ship, ${loc.translated_pages.length} of ${surface.pages.length} pages carry any of them`,
      problem: `i18n/locales.json declares ${loc.locales.length} locales — ${loc.locales.map((l) => l.code).join(', ')} — and ${loc.translated_pages.join(', ')} is the only page carrying a data-i18n key: ${loc.untranslated_pages.length} pages carry zero. A reader who chose ${loc.locales.find((l) => l.file)?.label ?? 'a locale'} on the brief and follows a link to any other page arrives at an English interface. What tells them is a chip in the chrome reading the language code and "· UI EN"${hiddenWord ? `, and the "· UI EN" half is inside \`.chrome-btn-word\`, which ${hiddenWord.at.join(' and ')} sets to display:none — so below that width the chip reads only "${loc.shipped[0]?.toUpperCase() ?? 'XX'}"` : ''}. Its full explanation is a \`title\` attribute, which is not an accessible name and does not exist on a touch screen.`,
      why_it_matters: `js/shell.js states the intention in its own comment: rather than pretend the pages are translated, the chrome "says plainly that the interface text on this page is English". Below the breakpoint, on a phone, and to a screen reader, it does not say it at all — it shows a two-letter code. This is the same control question 4 reports and this is what it costs on this journey: a reader can conclude the translation is broken rather than absent, which is the interface making an absence look like a failure.`,
      method: `Counted data-i18n attributes per page; read i18n/locales.json for what actually ships, taking its own key counts rather than recomputing them; found the module that builds the language chip and read what it puts in the element and what it puts in the title; then matched the classes inside the chip against the classes a media query hides.`,
      evidence: [
        counted(loc.register_path, `${loc.locales.length} locales declared: ${loc.locales.map((l) => `${l.code} (${l.keys ?? '?'} keys${l.complete ? '' : ', incomplete'})`).join(', ')}`, 'what ships, read from the register\'s own counts rather than recomputed'),
        ...loc.untranslated_pages.slice(0, 3).map((p) => counted(p, `${p} — 0 data-i18n attributes`, 'no UI translation')),
        ...(noteSrc ? [at('js/shell.js', lineAt(shell.src, noteAt), clip(noteSrc, 520), 'the chip, and where its explanation lives')] : []),
        ...(hiddenWord ? [at(hiddenWord.file, hiddenWord.line, `${hiddenWord.selector}{display:none} under ${hiddenWord.at.join(' and ')}`, 'the half of the chip that says "UI EN"')] : []),
      ],
      components: ['.chrome-lang', '.chrome-btn-word'],
      modules: ['js/shell.js'],
      pages,
      spread: loc.untranslated_pages.length,
      misreads_absence: false,
      blocks_journey: false,
      recommendation: 'Make the chip say what it means without hover and at every width — an accessible name at minimum, and a form of words that survives the breakpoint. WHAT it should say, in which language, is a wording decision across four locales and is not drafted here.',
      success_criterion: 'A reader in a shipped locale, on a narrow window or a screen reader, can tell that the interface text on this page is English and that the record labels are not — without hovering anything.',
      scope_note: 'It reports that the interface\'s own statement about its language coverage is not reliably legible. It does not propose translating the six pages, which is a decision about scope and about who would write four locales\' worth of strings.',
      operations: [{
        op: 'modify',
        target: 'js/shell.js — the language chip built in languageNote()',
        current: noteSrc ? clip(noteSrc, 300) : 'the chip, built in js/shell.js',
        rationale: 'The module already states the right intention in its comment. What it builds keeps that promise on a wide window with a mouse, and not otherwise.',
      }],
    });

    /* The superseded and pending keys are the register's business and
       tools/i18n-audit.mjs already checks them; whether a reader can
       SEE which strings fell back is an interface question this agent
       cannot answer without rendering. */
    const withGaps = loc.locales.filter((l) => l.superseded || l.pending);
    if (withGaps.length) {
      questions.push({
        subject: 'fallen-back strings, in the interface',
        question: `${withGaps.map((l) => `${l.code} (${l.pending} pending, ${l.superseded} superseded)`).join(', ')}. i18n/locales.json says a fallen-back element is marked data-i18n-fallback and shows as EN. Does a reader notice?`,
        missing: 'Whether the marking is legible is a rendered question. Nothing here opened a page, and the register describes the mechanism rather than the appearance.',
        evidence: [counted(loc.register_path, withGaps.map((l) => `${l.code}: ${l.pending} pending_translation, ${l.superseded} superseded`).join(' · '))],
      });
    }

    return { findings, examined, questions };
  },
};

/* ============================================================
   9 · What does the reading surface cost to open?
   ============================================================ */

/**
 * `index.html` is the page a reader meets first, it is 210 KB, and
 * ~59.8 KB of that is `window.__CONTENT__` — a blob duplicating
 * `data/brief.json`, which nothing fetches at runtime.
 *
 * THE DUPLICATION IS NOT THIS AGENT'S FINDING. `agent/architect/`
 * raised it as a shape finding in SESSION 13 and
 * `agent/proposals/editorial/` raised the drifted standfirst as an
 * editorial finding in SESSION 14; both sit behind pending
 * approvals, and re-reporting it here would give one fact a third
 * home. What is this agent's is the part neither of them measured:
 * what it costs the reader who downloads it, on the one journey
 * every reader takes first.
 */
export const surfaceLens = {
  id: 'reading_surface',
  question: 9,
  label: 'the reading surface',
  asks: 'What does the page a reader meets first cost to open?',
  why: 'The brief is the front door and the largest thing here. What a reader downloads before reading a sentence is an interface fact, whatever else the duplication is.',
  inspect(surface) {
    const findings = [];
    const examined = surface.pages.map((p) => `${p.page}: ${Math.round(p.bytes / 1024)} KB`);
    const questions = [];

    const front = surface.pages.find((p) => p.page === 'index.html');
    if (!front || !front.inline_content_bytes) return { findings, examined, questions };

    const others = surface.pages.filter((p) => p.page !== 'index.html');
    const median = Math.round(others.reduce((n, p) => n + p.bytes, 0) / others.length);
    const share = Math.round((front.inline_content_bytes / front.bytes) * 100);

    findings.push({
      lens: 'reading_surface',
      question: 9,
      about: 'interface',
      design_qa_overlap: null,
      finding_class: 'enhancement',
      subject: `the front door is ${Math.round(front.bytes / 1024)} KB, ${share}% of it an inline blob nothing reads at runtime`,
      problem: `index.html is ${Math.round(front.bytes / 1024)} KB against an average of ${Math.round(median / 1024)} KB for the other ${others.length} pages, and ${Math.round(front.inline_content_bytes / 1024)} KB of it — ${share}% — is the \`window.__CONTENT__\` script block. Nothing fetches it at runtime: it duplicates data/brief.json, which no module loads. Every reader downloads and parses it before the first sentence renders.`,
      why_it_matters: 'This is the page every journey starts on and the one a reader on a slow connection is most likely to abandon. The site has no build step and no bundler by deliberate choice, so nothing is going to compress this on the way out.',
      method: `Measured every page, took the byte span from \`window.__CONTENT__\` to the end of its script block, and compared the front door against the average of the other ${others.length} pages. No page was rendered and no load was timed: the numbers are file sizes, which is what a file can tell you.`,
      evidence: [
        at('index.html', lineAt(front.src, front.src.indexOf('window.__CONTENT__')), clip(front.src.slice(front.src.indexOf('window.__CONTENT__'), front.src.indexOf('window.__CONTENT__') + 200), 220), `${Math.round(front.inline_content_bytes / 1024)} KB of inline content`),
        ...others.slice(0, 3).map((p) => counted(p.page, `${p.page} — ${Math.round(p.bytes / 1024)} KB`, 'for comparison')),
      ],
      components: [],
      modules: [],
      pages: ['index.html'],
      spread: 1,
      misreads_absence: false,
      blocks_journey: false,
      recommendation: 'Nothing here proposes deleting it: the blob and data/brief.json have already drifted, agent/architect/ and agent/proposals/editorial/ have both raised that, and both proposals are pending. What this adds is the cost, so that whoever decides the shape question knows what the current shape costs a reader.',
      success_criterion: 'index.html is within the same order of magnitude as the other six pages, OR the decision to keep the blob is recorded with the cost stated — because "it is 59 KB and we accept that" is an answer and "nobody measured it" is not.',
      scope_note: 'It measures. It does not propose removing the blob, does not touch data/brief.json, and does not re-report the duplication — that has two homes already, both behind pending approvals, and a third would be the second home this repository refuses.',
      operations: [{
        op: 'modify',
        target: 'index.html — the window.__CONTENT__ block',
        current: `${front.inline_content_bytes} bytes, ${share}% of the page, duplicating data/brief.json, which nothing fetches.`,
        rationale: 'The shape decision belongs to the pending architecture proposal. This operation exists so the cost is attached to it rather than discovered afterwards.',
      }],
    });

    return { findings, examined, questions };
  },
};

/* ============================================================
   10 · What does tools/design-qa.mjs not check?
   ============================================================ */

/**
 * The `ux-audit` skill already carries the list: 31 manual checks
 * across 8 sections in `references/manual-checks.md`, written as
 * exactly the things `design-qa.mjs` cannot see. That list is
 * canonical and this lens does not restate it — it reads it, and
 * asks which of its items anything in this repository could check
 * automatically.
 *
 * The answer is the enhancement backlog: every item that could be a
 * check and is not is a defect that will ship again, and every item
 * that could NOT be is a place where this project's honesty depends
 * on somebody actually doing the pass.
 */

/** Which manual items a static check could decide, by the section
 *  they sit in. A judgement, in one place, with its reason. */
const AUTOMATABLE_SECTIONS = {
  'Absence of knowledge': { can: 'partly', why: 'whether a renderer distinguishes null from unknown is decidable from the source, as question 6 does; whether a reader reads it that way is not' },
  'Keyboard and focus': { can: 'partly', why: 'whether a control has a role and a tabindex is decidable, as question 3 does; whether the tab order makes sense needs a rendered document' },
  'Names and semantics': { can: 'partly', why: 'whether a control declares a name is decidable, as question 4 does; whether the name says what it does is a reading' },
  'Status without colour': { can: 'yes', why: 'whether two states of one component vary anything but colour is entirely decidable from the stylesheets, as question 1 does' },
  'Theme, zoom, motion': { can: 'partly', why: 'whether a theme-dependent token is declared on body is already checked by design-qa.mjs; what happens at 200% zoom needs a browser' },
  'Failure and empty states': { can: 'no', why: 'it needs a dataset to fail while somebody watches' },
  'Localisation': { can: 'partly', why: 'the register and the DOM are already compared by tools/i18n-audit.mjs; whether a fallback is visible is rendered' },
  'What was not tested': { can: 'no', why: 'it is an instruction to the person writing the report, not a property of the site' },
};

export const coverageLens = {
  id: 'check_coverage',
  question: 10,
  label: 'the existing design QA rules',
  asks: 'What does tools/design-qa.mjs not check, and how much of that could it?',
  why: 'The skill already lists what the validator cannot see. Which of those items a check could decide is the difference between a defect that ships once and one that ships every time.',
  inspect(surface) {
    const findings = [];
    const questions = [];
    const manual = surface.manual_checks;
    const examined = manual.items.map((i) => `${i.section}: ${clip(i.text, 60)}`);
    if (!manual.items.length) return { findings, examined, questions };

    const bySection = manual.sections.map((s) => ({
      section: s.heading.replace(/^\d+\.\s*/, ''),
      items: s.items.length,
      ...(AUTOMATABLE_SECTIONS[s.heading.replace(/^\d+\.\s*/, '')] ?? { can: 'unclassified', why: 'this lens has no judgement recorded for this section' }),
    }));
    const automatable = bySection.filter((s) => s.can === 'yes' || s.can === 'partly');
    const covered = automatable.reduce((n, s) => n + s.items, 0);
    const unclassified = bySection.filter((s) => s.can === 'unclassified');

    if (unclassified.length) {
      questions.push({
        subject: 'manual-check sections with no recorded judgement',
        question: `${unclassified.map((s) => `"${s.section}"`).join(', ')} — could a static check decide these items?`,
        missing: 'A section was added to the checklist after this lens was written, and this agent will guess about neither. The judgement belongs in AUTOMATABLE_SECTIONS in agent/ux/lenses.mjs, beside the seven that are already recorded.',
        evidence: unclassified.slice(0, 3).map((s) => counted(manual.path, `## ${s.section} — ${s.items} item(s)`)),
      });
    }

    findings.push({
      lens: 'check_coverage',
      question: 10,
      about: 'interface',
      design_qa_overlap: null,
      finding_class: 'enhancement',
      subject: `${covered} of ${manual.items.length} manual checks sit in sections a static check could decide, in whole or in part`,
      problem: `${manual.path} lists ${manual.items.length} checks across ${manual.sections.length} sections, written as the things tools/design-qa.mjs cannot see — and design-qa.mjs states ${surface.design_qa.checks.length} checks of its own in its header, none of which overlaps them. ${covered} of the ${manual.items.length} items sit in sections where a static check could decide the item or part of it: ${automatable.map((s) => `${s.section} (${s.items}, ${s.can})`).join('; ')}. Today all ${manual.items.length} depend on somebody running the pass and reporting honestly, and nothing records when one last happened.`,
      why_it_matters: 'The project has no CI and no deploy gate — AGENTS.md says a push to main publishes — so a check that is not a script is a check that runs when somebody remembers. The four items this agent\'s own lenses 1, 3, 4 and 6 decide were on this list, which is the evidence that a good number of the rest are decidable too.',
      method: `Read the checklist from ${manual.path} as items and sections rather than restating any of them, read the checks design-qa.mjs states in its own header, and classified each section by whether a static check could decide its items — a judgement recorded once, in AUTOMATABLE_SECTIONS, with its reason, and reported as an open question for any section it has no judgement for.`,
      evidence: [
        counted(manual.path, `${manual.items.length} checks across ${manual.sections.length} sections: ${manual.sections.map((s) => `${s.heading} (${s.items.length})`).join(', ')}`, 'the list, as it stands'),
        counted(surface.design_qa.path, `${surface.design_qa.checks.length} checks stated in the header: ${clip(surface.design_qa.checks.join('; '), 400)}`, 'what the validator does check'),
        ...manual.sections.filter((s) => AUTOMATABLE_SECTIONS[s.heading.replace(/^\d+\.\s*/, '')]?.can === 'yes').slice(0, 2).map((s) => at(manual.path, s.items[0]?.line ?? 1, s.items.map((i) => i.text).join(' · '), 'a section a check could decide outright')),
      ],
      components: [],
      modules: [],
      pages: surface.pages.map((p) => p.page),
      spread: surface.pages.length,
      misreads_absence: false,
      blocks_journey: false,
      recommendation: 'Move the decidable items into a check — either into tools/design-qa.mjs beside the ones already there, or as lenses in this agent, which is where four of them now are. WHICH of the two is a decision about where this project\'s checks live: design-qa.mjs runs on every change and this agent runs when somebody runs it.',
      success_criterion: `Every item in the ${automatable.filter((s) => s.can === 'yes').map((s) => `"${s.section}"`).join(' and ') || 'fully decidable'} section(s) is decided by a script, and the checklist marks which items are automated and which still need a person — so a reader of the report can tell the two apart.`,
      scope_note: 'It counts and classifies. It writes no check, moves no item, and does not decide whether a new check belongs in tools/ or here.',
      operations: [{
        op: 'add',
        target: 'tools/design-qa.mjs or agent/ux/lenses.mjs — checks for the decidable items',
        current: `${manual.items.length} manual items, ${covered} of them in sections a static check could decide in whole or in part, 0 automated today.`,
        rationale: 'A check that depends on somebody remembering is a check that catches a defect once. Where the new checks live is a decision about this project\'s tooling, and it carries no drafted implementation here.',
      }],
    });

    return { findings, examined, questions };
  },
};

/* ============================================================
   the ten, in the brief's own order
   ============================================================ */

export const LENSES = [
  hueLens, contractLens, controlLens, nameLens, breakpointLens,
  absenceLens, navLens, localeLens, surfaceLens, coverageLens,
];
