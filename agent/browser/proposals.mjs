/* ============================================================
   agent/browser/proposals.mjs — a measured defect, turned into
   something a human can decide

   SESSION 19 built a suite that opens the site and found three
   defects no validator in `tools/` can see. It fixed none of them,
   deliberately: each is Class C interface work, and
   `docs/BROWSER-QA.md` §4 says so. But it also left the three
   findings with nowhere to go. `agent/implement/` implements
   PROPOSALS, and nothing in this repository had ever produced an
   `ImplementationProposal` — the contract has existed since SESSION
   04 and `docs/HANDOVER.md` records that three of the five contracts
   Agent 9 consumes "had been produced by nothing". This module is
   the missing producer for one of them.

   ------------------------------------------------------------
   WHAT IS DERIVED HERE, AND WHAT IS THIS AGENT'S JUDGEMENT

   DERIVED, and refused if it cannot be:

     · WHICH defects become proposals. Only a check that FAILED in
       the run being read. A check that passes mints nothing, so a
       proposal for a defect that is no longer measured cannot exist.
     · The `current` text of every operation, READ OUT OF THE FILE at
       the moment the proposal is minted, and required to occur
       EXACTLY ONCE. `agent/implement/apply.mjs` refuses an edit whose
       `current` occurs zero or two times; producing such a proposal
       would be producing one that is guaranteed to be refused, so it
       is refused here instead, by name.
     · The permitted file set, which is `files` — read by
       `agent/implement/scope.mjs` off the proposal itself.
     · The autonomy class. `agent/schemas/types.mjs` RED_TARGETS
       decides it: a proposal touching `tools/_footer.mjs` is red tier
       whatever this module would prefer, and the contract gate
       refuses it otherwise.

   THIS AGENT'S JUDGEMENT, typed as an interpretation and marked
   contested rather than presented as a measurement:

     · The drafted `proposed` value. `agent/ux/` and
       `agent/proposals/editorial/` both draft NOTHING on purpose,
       because what a site about EU law should SAY is not an agent's
       decision. That reasoning does not reach here and the difference
       is worth stating: these three defects are not about what the
       site says, they are mechanical properties of the rendered page
       — a tab order, a heading level, whether a link exists with
       scripting off — and each has a success criterion the suite
       measures. So a value is drafted, and the one place a person's
       judgement is genuinely required (the WORDING of the no-script
       notice) is carried as an open question on the record rather
       than hidden inside it.

   THE OPEN QUESTIONS HERE DO NOT BLOCK, and that is a deliberate,
   checkable difference from `agent/ux/`. A blocking question means
   nothing downstream may proceed; Agent 8 blocks because nothing it
   found had ever been opened in a browser. Everything here WAS
   opened in a browser, by the suite in this directory, and re-running
   it is what tells anyone whether the fix worked. Blocking these
   would be claiming an evidence gap that the measurement closed.

   NOTHING HERE IS AN APPROVAL. The records go to `agent/records/`,
   which is git-ignored and agent-written; `docs/IMPLEMENTATION-QA.md`
   §3 is explicit that an `ApprovalRequest` found there is a REQUEST
   whatever its state says. A grant exists only in
   `agent/implement/decisions/decisions.jsonl`, written by a human.
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { RecordBuilder } from '../verifier/build.mjs';
import { FOUR_VALIDATORS, approvalOver } from '../integrate/propose.mjs';
import { RED_TARGETS } from '../schemas/types.mjs';
import { REPO_ROOT } from './serve.mjs';
import { BROWSER_QA_COMMAND } from './runner.mjs';

export const BROWSER_QA_AGENT = 'browser-qa';

/** Who is asked. The role, not a name: this repository has one owner
 *  and a record should not carry a second copy of who that is. */
export const DECIDED_BY = 'the repository owner';

/* ---------------------------------------------------------- helpers */

const read = (path, root = REPO_ROOT) => {
  const abs = join(root, path);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
};

export function countOccurrences(haystack, needle) {
  if (!haystack || !needle) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) { n++; i = haystack.indexOf(needle, i + needle.length); }
  return n;
}

/** 1-based line of the first character of `needle`. Used only for an
 *  evidence locator, so an extract can be found again by hand. */
export function lineOf(haystack, needle) {
  const i = haystack.indexOf(needle);
  return i === -1 ? null : haystack.slice(0, i).split('\n').length;
}

/** page · module · stylesheet · tool, from the path. Read rather than
 *  declared per edit, so an entity kind cannot disagree with where
 *  the file actually is. */
export function entityKindOf(path) {
  if (path.endsWith('.html')) return 'page';
  if (path.endsWith('.css')) return 'stylesheet';
  if (path.startsWith('tools/')) return 'tool';
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'module';
  return 'document';
}

/** The red-tier targets this change actually touches. The list is
 *  `agent/schemas/types.mjs`'s; a second copy here would be the
 *  second home this repository exists to prevent. */
export function redTargetsAmong(paths) {
  return paths.filter((p) => RED_TARGETS.some((t) => p.toLowerCase().includes(t.toLowerCase())));
}

/** The four validators, plus the one check that can actually see any
 *  of these three defects. The four are imported rather than
 *  restated: `agent/integrate/propose.mjs` owns the baselines. */
export function validationRequirements(checkId) {
  return [
    ...FOUR_VALIDATORS,
    {
      check: 'the browser regression suite',
      command: `${BROWSER_QA_COMMAND} --require-browser`,
      expected: `"${checkId}" reports pass, and the run's fail count is lower by exactly one with no other check changing status. The two undecidables — keyboard:focus-visible and a11y:bound — MUST still be undecidable: they are perceptual properties this suite cannot establish, and a change that turned one into a pass would be a false clearance, not a fix.`,
      why: 'It is the only check in this repository that can see this defect at all. The four validators read files; this one opens the page and reads the rendered DOM, which is where all three of these defects live (docs/BROWSER-QA.md §4).',
    },
  ];
}

export const rollbackFor = (files) => ({
  method: 'restore_from_commit',
  steps: [
    `git checkout <the commit agent/implement/apply.mjs recorded when the change context opened> -- ${files.join(' ')}`,
    'node tools/validate.mjs && node tools/i18n-audit.mjs && node tools/design-qa.mjs && node tools/freshness.mjs <as-of date>',
    `${BROWSER_QA_COMMAND} --require-browser`,
  ],
  verification: 'Every restored path re-hashes to the sha256 agent/implement/apply.mjs recorded when the change context opened; the four validators return to the docs/CURRENT-ARCHITECTURE.md §12 baseline (0 errors, 106 unverified records, the same five design-qa warnings by file and line); and the browser suite reports the defect again. A rollback that does not bring the defect back has not rolled anything back.',
  irreversible_reason: null,
});

/* ============================================================
   THE RECIPES — one per browser-QA check id

   A recipe is the smallest coherent change for one measured defect.
   `anchor` is what the operation's `current` will be; it is read out
   of the file rather than trusted from here, and a recipe whose
   anchor is not in the file exactly once produces no proposal.
   ============================================================ */

export const RECIPES = {

  /* ---------------------------------------------------- issue 25 */
  'nav:noscript': {
    slug: 'noscript-nav',
    title: 'the site has no navigation with scripting off, and the notice does not say so',
    reason: 'A reader with scripting disabled lands on a page of this site and cannot leave it. js/shell.js builds the whole chrome at runtime, so with script execution disabled instruments.html links to none of the six top-level pages — and the <noscript> notice, which lists eight things that will not appear, does not list navigation among them. The written analysis reads perfectly well without JavaScript; the site around it does not exist. This is the one of the three defects a reader can meet today.',
    summary: 'Put the six top-level destinations inside the <noscript> notice, and say that the navigation is script-rendered.',
    scope_note: 'It gives a reader with scripting off a way out of the page they landed on, and it says why the navigation is missing. It does NOT move the header back into the markup, does not touch js/shell.js\'s nav model, takes no view on whether the tools should work without scripting, and alters not one word of the non-affiliation or no-legal-advice text in the same generator. The links are inside <noscript>, so a reader WITH scripting meets nothing new.',
    edits: [
      {
        path: 'tools/_footer.mjs',
        anchor: `<p>Every figure behind them is in that directory and can be read directly.</p>
</div>
</noscript>`,
        proposed: `<p>Every figure behind them is in that directory and can be read directly.</p>
<p><b>The navigation is rendered by script too</b>, so the links between the pages are not on
screen either. They are here:</p>
<ul class="noscript-nav">
<li><a href="index.html">The brief</a></li>
<li><a href="instruments.html">Instruments</a></li>
<li><a href="institutions.html">Institutions</a></li>
<li><a href="enforcement.html">Enforcement</a></li>
<li><a href="applies.html">What applies to me?</a></li>
<li><a href="bibliography.html">Evidence and sources</a></li>
</ul>
</div>
</noscript>`,
        rationale: 'The generator is the one home for the notice, and the seven copies in the pages are its output. Changing a page without changing this is the drift tools/design-qa.mjs errors on. The six labels are js/shell.js NAV\'s own `long` values, so the fallback and the chrome name the same destinations the same way.',
      },
    ],
    /* The seven pages carry the generator's output verbatim. They are
       filled in below from PAGES rather than listed twice. */
    generated_into: [
      'index.html', 'instruments.html', 'instrument.html', 'institutions.html',
      'enforcement.html', 'applies.html', 'bibliography.html',
    ],
    stylesheet_edit: {
      path: 'css/tools.css',
      anchor: '.noscript-note code{font-family:var(--mono);font-size:var(--t-data)}',
      proposed: `.noscript-note code{font-family:var(--mono);font-size:var(--t-data)}
.noscript-note ul{margin:0;padding-left:1.1em}
.noscript-note li{font-size:var(--t-body-sm);color:var(--text-2);margin:0 0 2px}
.noscript-note a{color:inherit;text-decoration:underline}`,
      rationale: 'Without a rule the links take the browser default link colour on a surface whose own colour is a token, and this repository computes no contrast ratios — so the conservative choice is to inherit the colour the notice already uses and mark the links with an underline instead. It declares no new custom property; --t-body-sm and --text-2 are already used by the rule above it.',
    },
    interpretation: {
      statement: 'Putting the destinations inside <noscript> is the smallest change that gives a no-script reader a way out of the page, because the generator already owns seven identical copies of that block and design-qa.mjs already errors when they drift or when an internal href resolves to nothing.',
      basis: 'The arrangement is read from tools/_footer.mjs and tools/design-qa.mjs. That this is the RIGHT answer, rather than restoring a markup header or leaving the site to say plainly that it needs JavaScript, is a judgement about a production site and is the reviewer\'s to make.',
    },
    open_questions: [
      {
        question: 'Is a list of destinations inside the no-script notice the right answer, or should the site restore a markup navigation path for every reader?',
        missing: 'A decision by the repository owner. docs/UX-AUDIT.md finding 3 is the wider version of this — five of seven pages are linked from no markup anywhere — and this proposal deliberately answers only the measured half. The wider change is a different proposal.',
      },
      {
        question: 'Is this wording right for a site people read to find out what EU law requires of them?',
        missing: 'The reviewer\'s own words, if not these. The sentence drafted here is this agent\'s, and it is prose on a production site; the operation can be granted with different text without any other part of the change moving.',
      },
    ],
    what_to_check: [
      'Read the drafted sentence and the six labels. They are prose on a production site and this agent wrote them; the labels are copied from js/shell.js NAV `long` values and should be checked against it.',
      'Confirm the change touches only the NOSCRIPT constant in tools/_footer.mjs. That file also generates the non-affiliation statement, the no-legal-advice statement and BASE, all of which are Class D under docs/AUTONOMY-POLICY.md and none of which this proposal alters.',
      'Confirm the seven page edits are byte-identical to the generator output, so `node tools/_footer.mjs` is a no-op afterwards and the seven copies have not drifted.',
      'Run node tools/design-qa.mjs: it errors when the seven notices differ, and it resolves every internal href — which is what will catch a destination filename going stale later.',
      'Run node agent/browser/cli.mjs --require-browser and confirm nav:noscript now passes, no other check changed status, and keyboard:focus-visible and a11y:bound are still undecidable.',
    ],
    consequence: 'If the wording is wrong, a reader without JavaScript is told something inaccurate about a site whose subject is what the law requires of them. If a destination filename is wrong, they follow a link to nothing — design-qa.mjs errors on that, which is why the links are markup rather than prose. This repository has no deploy gate: a push to main publishes.',
  },

  /* ---------------------------------------------------- issue 27 */
  'keyboard:skip-first': {
    slug: 'skip-link-first',
    title: 'the skip link is the tenth focusable element in the rendered page',
    reason: 'A skip link is a bypass mechanism only if it is the first thing a keyboard reader reaches. Every page carries <a class="skip-link"> as the first element in <body> and tools/design-qa.mjs confirms it resolves — but js/shell.js inserts the chrome at document.body.firstChild, ahead of it, so the rendered order puts nine navigation and chrome controls before the link that skips the navigation. Nothing that reads markup can see this, because the markup is correct.',
    summary: 'Insert the rendered chrome AFTER the skip link instead of at document.body.firstChild.',
    scope_note: 'It changes where one element is inserted. It does not change what the chrome contains, what the skip link points at, the nav model, or any page\'s markup — and it leaves fixSkipLink() alone, which still inserts a skip link at the top of <body> on the one page whose markup has none.',
    edits: [
      {
        path: 'js/shell.js',
        anchor: `  /* replace whichever hand-written header this page shipped with */
  const old = document.querySelector('.tool-top, .bib-top');
  const chrome = buildChrome(page);
  if (old) old.replaceWith(chrome);
  else document.body.insertBefore(chrome, document.body.firstChild);`,
        proposed: `  /* replace whichever hand-written header this page shipped with */
  const old = document.querySelector('.tool-top, .bib-top');
  const chrome = buildChrome(page);
  /* AFTER the skip link, never before it. Every page's markup puts
     <a class="skip-link"> first in <body>, and a skip link is a
     bypass mechanism only if it is the first thing a keyboard reader
     reaches; inserting the chrome at document.body.firstChild put
     nine controls ahead of it, so the link that skips the navigation
     sat behind the navigation. tools/design-qa.mjs reads the markup,
     where the order is right, and cannot see this — it is measured in
     the rendered page by agent/browser/ (keyboard:skip-first). */
  const skip = document.querySelector('body > a.skip-link');
  if (old) old.replaceWith(chrome);
  else document.body.insertBefore(chrome, skip ? skip.nextSibling : document.body.firstChild);`,
        rationale: 'The one-line change that puts the rendered order back where the markup already has it. The fallback to document.body.firstChild is kept for the page whose markup carries no skip link, where the current behaviour is already correct: fixSkipLink() creates one and inserts it ahead of the chrome.',
      },
    ],
    interpretation: {
      statement: 'Moving the insertion point is the smallest coherent fix, and it is preferable to giving the skip link a positive tabindex or reordering the chrome, both of which change the tab order of things that are not the defect.',
      basis: 'Read from js/shell.js and from the measured focus order. That a skip link ought to come first is WCAG 2.4.1\'s bypass-blocks intent as this agent understands it; no screen reader was run and no assistive technology was involved in this measurement.',
    },
    open_questions: [
      {
        question: 'Does this actually improve the experience of a keyboard or screen-reader user, as opposed to only the measured order?',
        missing: 'Somebody tabbing through the pages, and somebody running a screen reader. This suite reads the rendered DOM of one headless Chromium; README limitation 7 stands and docs/BROWSER-QA.md §6 lists what it still cannot see.',
      },
    ],
    what_to_check: [
      'Confirm the skip link is reached by the first Tab press on each of the six pages that carry one in their markup, and that it still moves focus to the page content.',
      'Confirm instrument.html — the page whose markup carries no skip link — is unchanged: fixSkipLink() creates one there and inserts it at the top of <body>, ahead of the chrome, which is already correct.',
      'Confirm the chrome still renders in the same place visually. The skip link is visually hidden until focused, so moving the chrome one sibling later should change nothing a mouse reader sees; this proposal has not looked at a pixel.',
      'Run node agent/browser/cli.mjs --require-browser and confirm keyboard:skip-first now passes and no other check changed status.',
    ],
    consequence: 'If this is wrong the chrome renders in the wrong place on every page but the brief, which every reader would meet immediately. This repository has no deploy gate: a push to main publishes.',
  },

  /* ---------------------------------------------------- issue 28 */
  'a11y:headings:enforcement.html': {
    slug: 'enforcement-heading-level',
    title: 'the enforcement register jumps h2 to h5 in its rendered outline',
    reason: 'js/enforcement-page.js renders each pipeline stage as an <h5> directly under the <h2> naming the company, so the rendered outline of enforcement.html skips h3 and h4. A reader navigating by heading level is told there are two levels of structure between the company and the stage, and there are none. tools/design-qa.mjs checks heading order in the markup, where these headings do not exist — this module creates them at runtime.',
    summary: 'Render each pipeline stage heading as <h3> rather than <h5>, and move the stylesheet rules with it.',
    scope_note: 'It changes a heading level and the four selectors that style it. It changes no text, no derivation, no state vocabulary and no other heading on the page; <h3> is what the sibling "Legal basis" and "Requires verification" blocks inside the same record already use.',
    edits: [
      {
        path: 'js/enforcement-page.js',
        anchor: `        '<h5>' + esc(taxLabel(IX, meta.id)) + ' — <span data-state="' + esc(st.state.split(':').pop()) + '">' +
          esc(STATE_WORD[st.state]) + '</span></h5>' +`,
        proposed: `        /* h3, not h5. This heading sits directly under the <h2> naming
           the company, and h2 → h5 is a skipped level in the RENDERED
           outline; h3 is also what the sibling "Legal basis" and
           "Requires verification" blocks in the same record use.
           tools/design-qa.mjs checks heading order in the markup,
           where these headings do not exist — this module creates
           them (agent/browser/ a11y:headings:enforcement.html). */
        '<h3>' + esc(taxLabel(IX, meta.id)) + ' — <span data-state="' + esc(st.state.split(':').pop()) + '">' +
          esc(STATE_WORD[st.state]) + '</span></h3>' +`,
        rationale: 'The stage heading is a peer of the other sub-blocks of one enforcement record, and those are already h3. Making it h3 removes the skipped level without inventing an intermediate heading nobody would read.',
      },
      {
        path: 'css/tools.css',
        anchor: `.pipe-detail h5{font-family:var(--mono);font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--paper);margin:0 0 6px;font-weight:500}
.pipe-detail h5 span[data-state="reached"]{color:var(--pipe-reached)}
.pipe-detail h5 span[data-state="not-reached"]{color:var(--pipe-not)}
.pipe-detail h5 span[data-state="unknown"]{color:var(--undet)}`,
        proposed: `.pipe-detail h3{font-family:var(--mono);font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--paper);margin:0 0 6px;font-weight:500}
.pipe-detail h3 span[data-state="reached"]{color:var(--pipe-reached)}
.pipe-detail h3 span[data-state="not-reached"]{color:var(--pipe-not)}
.pipe-detail h3 span[data-state="unknown"]{color:var(--undet)}`,
        rationale: 'The four rules are selector-scoped to the element being renamed. Every declaration is unchanged, including the explicit font-size, weight and margin, so the rendered appearance does not depend on which element the browser default would have styled differently. No stylesheet here carries a bare h3 or h5 rule that could now apply.',
      },
    ],
    interpretation: {
      statement: 'h3 is the right level, because the stage heading is a sibling of the "Legal basis" and "Requires verification" blocks in the same record, which are already h3.',
      basis: 'Read from js/enforcement-page.js. That a skipped heading level is a defect rather than a stylistic choice is WCAG 1.3.1 as this agent understands it; no screen reader was run.',
    },
    open_questions: [
      {
        question: 'Does the enforcement record\'s outline actually read correctly to a screen-reader user after this?',
        missing: 'Somebody running a screen reader over enforcement.html. This suite counts heading levels in the DOM; it does not listen to anything. README limitation 7 stands.',
      },
    ],
    what_to_check: [
      'Confirm every pipeline stage panel still looks identical. The four moved rules set font, size, letter-spacing, case, colour, margin and weight explicitly, so nothing should depend on the element name — but this proposal has compared no pixels.',
      'Confirm no other rule in style.css, css/tools.css, css/tokens.css or css/evidence.css targets a bare h3 or h5 that would now apply, or stop applying.',
      'Run node agent/browser/cli.mjs --require-browser and confirm a11y:headings:enforcement.html now passes, and that no other page\'s heading check changed.',
    ],
    consequence: 'If a rule was missed, the pipeline stage headings on enforcement.html render at the browser default size and weight, which every reader of that page would meet. This repository has no deploy gate: a push to main publishes.',
  },
};

/* ============================================================
   THE PRODUCER
   ============================================================ */

export class ProposalRefused extends Error {
  constructor(message, detail = {}) { super(message); this.detail = detail; }
}

/**
 * Every edit a recipe implies, with its anchor RESOLVED against the
 * file as it is right now.
 *
 * A recipe that names a file that does not exist, or whose anchor is
 * not in it exactly once, produces no proposal at all. Producing one
 * would be producing a proposal `agent/implement/apply.mjs` is
 * guaranteed to refuse — and refusing it there, after an approval,
 * costs a person's decision.
 */
export function resolveEdits(recipe, { root = REPO_ROOT } = {}) {
  const edits = [...recipe.edits];

  /* The generator's output, in each page it was generated into. The
     anchor is the generator's own, so the seven page edits cannot
     say something different from the generator edit. */
  if (recipe.generated_into) {
    const gen = recipe.edits.find((e) => e.path.startsWith('tools/'));
    for (const page of recipe.generated_into) {
      edits.push({
        path: page,
        anchor: gen.anchor,
        proposed: gen.proposed,
        rationale: `${page} carries the generator's output verbatim; tools/design-qa.mjs errors when the seven copies differ. Written here as the same edit rather than left to a re-run of the generator, so the change agent/implement/ applies is the change that was approved.`,
      });
    }
  }
  if (recipe.stylesheet_edit) edits.push(recipe.stylesheet_edit);

  const resolved = [];
  for (const e of edits) {
    const content = read(e.path, root);
    if (content === null) {
      throw new ProposalRefused(`${e.path} does not exist. The recipe was written against a tree this one is not.`, { path: e.path });
    }
    const n = countOccurrences(content, e.anchor);
    if (n !== 1) {
      throw new ProposalRefused(
        `the text this recipe would edit occurs ${n} time(s) in ${e.path}, and agent/implement/apply.mjs applies an edit only where its "current" occurs exactly once. ${n === 0 ? 'The file has changed since the recipe was written; the recipe goes back to whoever owns it.' : 'The recipe does not say which occurrence is meant, and choosing is an editorial decision.'}`,
        { path: e.path, occurrences: n });
    }
    resolved.push({ ...e, line: lineOf(content, e.anchor) });
  }
  return resolved;
}

/**
 * One ImplementationProposal, and the ApprovalRequest that asks a
 * human to decide it.
 *
 * @param {{check:object, recipe:object, ctx:object, span:object, root?:string}} opts
 * @returns {{proposal:object, approval:object}}
 */
export function buildProposal({ check, recipe, ctx, span, root = REPO_ROOT }) {
  const edits = resolveEdits(recipe, { root });
  const files = [...new Set(edits.map((e) => e.path))].sort();
  const modules = files.filter((f) => /^(js|app)\/|\.mjs$/.test(f) || f.endsWith('.js'));
  const red = redTargetsAmong(files);

  const b = new RecordBuilder({
    contract: 'ImplementationProposal',
    agent: BROWSER_QA_AGENT,
    now: ctx.now(),
    span,
    simulated: ctx.simulated,
  });

  for (const f of files) {
    b.addEntity({ kind: entityKindOf(f), id: null, path: f, field: null, note: null });
  }

  /* ------------------------------------------------- the evidence */

  /* WHAT THE BROWSER MEASURED. Its locator is the command that
     reproduces it, because that is the only way anyone can check it:
     there is no document to re-read. The browser version and the
     request count are deliberately NOT here — they vary by machine,
     and agent/implement/ledger.mjs binds an approval to the hash of
     this record's substance. An approval that went void because a
     runner had a different Chromium would be an approval nobody could
     keep. */
  b.addEvidence({
    evidence_id: 'ev-measured',
    kind: 'measurement',
    source_id: null,
    url: null,
    locator: `${BROWSER_QA_COMMAND} --only ${check.area === 'accessibility' ? 'accessibility' : check.area} → ${check.id}`,
    title: null,
    publisher: null,
    quote: check.summary,
    retrieved_at: null,
    checksum: null,
    supports: 'supports:direct',
    role: 'primary',
    simulated: ctx.simulated,
  });

  const refs = ['ev-measured'];
  edits.forEach((e, i) => {
    const id = `ev-file-${String(i + 1).padStart(2, '0')}`;
    b.addEvidence({
      evidence_id: id,
      kind: 'repository_file',
      source_id: null,
      url: null,
      locator: `${e.path}:${e.line}`,
      title: null,
      publisher: null,
      quote: e.anchor.length > 400 ? `${e.anchor.slice(0, 400)}…` : e.anchor,
      retrieved_at: null,
      checksum: null,
      supports: 'supports:direct',
      role: 'primary',
      simulated: ctx.simulated,
    });
    refs.push(id);
  });

  /* ------------------------------------------------- the fields */

  b.set('proposal_id', ctx.ids.mint(`prop-bqa-${recipe.slug}`, {
    kind: 'browser-qa-defect',
    entities: files,
    subject: check.id,
  }));
  b.set('reason', recipe.reason);
  b.set('confidence', 0.8);

  /* DERIVED, not chosen. RED_TARGETS decides it — a proposal touching
     tools/_footer.mjs is red tier whatever this module would prefer,
     and agent/schemas/validate.mjs refuses it otherwise. */
  b.set('autonomy_class', red.length ? 'human_only' : 'review_required');
  b.set('risk', red.length ? 'high' : 'medium');

  b.set('files', files);
  b.set('modules', modules);
  b.set('new_dependencies', []);
  b.set('adds_build_step', false);
  b.set('adds_fetch_call', false);
  b.set('fetch_modules', []);
  /* NO NEW TEST FILE, and the reason is not laziness: the regression
     test for each of these three defects already exists and is the
     thing that found it. A new test asserting the same property would
     be a second home for it. */
  b.set('tests_added', []);
  b.set('validator_impact', {
    baseline_ref: 'docs/CURRENT-ARCHITECTURE.md §12',
    expected_new_errors: 0,
    expected_new_warnings: 0,
    justification: null,
  });

  b.set('proposed_change', {
    summary: recipe.summary,
    operations: edits.map((e) => ({
      op: 'modify',
      target: e.path,
      current: e.anchor,
      proposed: e.proposed,
      rationale: e.rationale,
    })),
    scope_note: recipe.scope_note,
  });
  b.set('validation_requirements', validationRequirements(check.id));
  b.set('rollback_plan', rollbackFor(files));

  /* ------------------------------------------------- the epistemic block */

  b.fact(null, true,
    `The browser suite in agent/browser/ opened the page and measured this: ${check.summary}`,
    ['ev-measured']);
  b.fact(null, true,
    `The ${edits.length} extract(s) this proposal would edit are in ${files.join(', ')} at the locators given, each exactly once — checked by reading the files when this record was minted, because agent/implement/apply.mjs applies an edit only where its "current" occurs exactly once.`,
    refs.filter((r) => r !== 'ev-measured'));

  b.inference(null, undefined,
    `Editing those extracts as proposed would make "${check.id}" pass, because the check's own condition is a property of the rendered page that these edits change directly.`,
    refs,
    'Read the check\'s condition in agent/browser/checks.mjs and the code that produces the condition it fails, and compared the two. It is NOT a measurement of the fixed page: nothing has been applied, and the only thing that establishes the fix is re-running the suite afterwards, which is why that command is a validation requirement on this record.');

  b.interpretation('proposed_change', recipe.interpretation.statement, {
    held_by: BROWSER_QA_AGENT,
    basis: recipe.interpretation.basis,
    contested: true,
  });

  /* THE OPEN QUESTIONS DO NOT BLOCK. See the header: everything here
     was measured in a browser, and re-running the suite is what tells
     anyone whether the fix worked. Blocking would assert an evidence
     gap the measurement closed. What remains open is perceptual, and
     it is the same bound the suite states on every run. */
  for (const q of recipe.open_questions) {
    b.openNull(null, q.question, q.missing, { blocks: false });
  }
  b.openNull(null,
    'What does this look like, and sound like, to a real reader?',
    'No contrast ratio was computed, no screen reader was run, no pixels were compared, and no browser but headless Chromium was opened. README limitation 7 stands and docs/BROWSER-QA.md §6 lists it in full. This is the same bound the suite states on every run; it is not specific to this change, and it does not block, because the defect this proposal answers was measured rather than inferred.',
    { blocks: false });

  const proposal = ctx.ship(span, b.build(), []);
  const approval = buildApproval({ proposal, recipe, check, ctx, span, red });
  return { proposal, approval };
}

function buildApproval({ proposal, recipe, check, ctx, span, red }) {
  const b = new RecordBuilder({
    contract: 'ApprovalRequest',
    agent: BROWSER_QA_AGENT,
    now: ctx.now(),
    span,
    simulated: ctx.simulated,
  });
  b.addEvidence({
    evidence_id: 'ev-proposal',
    kind: 'agent_output',
    source_id: null,
    url: null,
    locator: `ImplementationProposal ${proposal.proposal_id}`,
    title: null,
    publisher: null,
    quote: null,
    retrieved_at: proposal.created_at,
    checksum: null,
    supports: 'supports:direct',
    role: 'secondary',
    simulated: ctx.simulated,
  });
  for (const e of proposal.affected_entities) b.addEntity(e);

  approvalOver({
    builder: b,
    approval_id: ctx.ids.mint(`appr-bqa-${recipe.slug}`, { kind: 'approval', subject: proposal.proposal_id }),
    proposal_ids: [proposal.proposal_id],
    tier: proposal.autonomy_class === 'human_only' ? 'red' : 'amber',
    requested_of: DECIDED_BY,
    why: red.length
      ? `This edits ${red.join(', ')}, which docs/AI-SAFE-BOUNDARIES.md §3 puts in the red tier — an agent may propose it and nothing more. ${proposal.proposed_change.operations.length} operation(s) across ${proposal.files.length} file(s) of a production website with no deploy gate: a push to main publishes.`
      : `A change to what every reader of this site meets in their browser, on a repository with no deploy gate — a push to main publishes. docs/BROWSER-QA.md §4 records this defect as Class C interface work needing a proposal and a human decision, and this is that proposal.`,
    what_to_check: [
      `The defect is real and still measured: run ${BROWSER_QA_COMMAND} --require-browser and confirm "${check.id}" is among the failures. If it is not, this proposal should be denied — the defect is gone and the edit would be a change nobody needs.`,
      ...recipe.what_to_check,
      'Run all four validators before and after, against the docs/CURRENT-ARCHITECTURE.md §12 baseline: 0 errors, 106 unverified records, the same five design-qa warnings by file and line. A sixth warning is a finding, not noise.',
      'Confirm the two undecidable checks — keyboard:focus-visible and a11y:bound — are STILL undecidable afterwards. They are perceptual properties this suite cannot establish, and turning one into a pass would be a false clearance rather than a fix.',
    ],
    risk: proposal.risk,
    consequence: recipe.consequence,
  });

  b.fact(null, true,
    `ImplementationProposal ${proposal.proposal_id} exists, is autonomy_class "${proposal.autonomy_class}", proposes ${proposal.proposed_change.operations.length} operation(s) across ${proposal.files.length} file(s), and has not been applied.`,
    ['ev-proposal']);
  b.openNull(null,
    'Is this worth changing on a production site people read to find out what EU law requires of them?',
    'A judgement by the repository owner. This agent measured the defect in a real browser and drafted the smallest edit it could find; whether the defect matters more than the risk of touching the site is not something a measurement decides.',
    { blocks: true });

  return ctx.ship(span, b.build(), [proposal.proposal_id]);
}

/**
 * Turn one browser-QA run into proposals.
 *
 * ONLY FAILURES, and only failures with a recipe. A passing check
 * mints nothing — so a proposal for a defect that is no longer
 * measured cannot exist. A failure with no recipe is REFUSED BY NAME
 * on the trace rather than dropped: a producer that silently ignores
 * a defect it has no answer for looks exactly like a producer that
 * found nothing.
 *
 * @param {{run:object, ctx:object, span:object, root?:string}} opts
 */
export function proposalsForRun({ run, ctx, span, root = REPO_ROOT }) {
  const proposals = [];
  const approvals = [];
  const refused = [];

  if (run.status === 'skipped') {
    refused.push({
      what: 'the whole run',
      stage: 'browser',
      reason: `no browser was found, so nothing was measured, so there is nothing to propose. ${run.skipReason}`,
    });
    return { proposals, approvals, refused, considered: 0 };
  }

  const failures = run.failed ?? [];
  span.observe({
    summary: `PROPOSING FOR ${failures.filter((f) => RECIPES[f.id]).length} OF ${failures.length} MEASURED FAILURE(S)`,
    subject: 'the failures',
    data: {
      failures: failures.map((f) => ({ id: f.id, area: f.area, has_recipe: Boolean(RECIPES[f.id]) })),
      undecidable: (run.undecided ?? []).map((u) => u.id),
      why_not_undecidable: 'An undecidable established neither a defect nor its absence. There is nothing to propose fixing, and proposing a change that made one of them PASS would be manufacturing a clearance this suite cannot give (docs/BROWSER-QA.md §5).',
    },
    confidence: 1,
    risk: 'low',
  });

  for (const check of failures) {
    const recipe = RECIPES[check.id];
    if (!recipe) {
      refused.push({
        what: check.id,
        stage: 'recipe',
        reason: 'no recipe is recorded for this check. The smallest coherent fix for a defect is a judgement about a production site, and improvising one here would be an implementation wearing a proposal\'s shape.',
      });
      span.observe({
        summary: `NO PROPOSAL — ${check.id}`,
        subject: check.id,
        data: { area: check.area, summary: check.summary, why: 'no recipe' },
        confidence: 1, risk: 'medium',
      });
      continue;
    }
    try {
      const { proposal, approval } = buildProposal({ check, recipe, ctx, span, root });
      proposals.push(proposal);
      approvals.push(approval);
    } catch (err) {
      if (!(err instanceof ProposalRefused)) throw err;
      refused.push({ what: check.id, stage: 'anchor', reason: err.message, detail: err.detail });
      span.observe({
        summary: `NO PROPOSAL — ${check.id}: ${err.message}`,
        subject: check.id,
        data: err.detail,
        confidence: 1, risk: 'medium',
      });
    }
  }

  return { proposals, approvals, refused, considered: failures.length };
}
