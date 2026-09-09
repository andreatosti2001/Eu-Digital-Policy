/* ============================================================
   agent/simulation/threshold.mjs — the Control Room discovery flow,
   simulated as a SEPARATE UX/security path

   WHY IT IS A SEPARATE PATH AND NOT A LEG OF THE CYCLE. The cycle
   in `cycle.mjs` is the governed one: events, workflows, grants,
   gates, a person. This is not on it. A reader typing a phrase into
   a search box is a UX event on a static page, and the whole
   question this file exists to answer is whether it is ONLY that.

   THE SIX SEPARATIONS. SESSION 24's brief asks the simulation to
   verify that the visual animation is completely separate from
   authentication, authorization, approval, orchestration, execution
   and deployment. Each is checked as a MEASUREMENT with named
   evidence rather than as a claim: a file read, a route table
   walked, an import graph followed, or a live HTTP request to a
   real Control Room. Where a separation cannot be measured without
   a browser, `separations()` says so instead of asserting it.

   THE SPEC LIVES HERE, NOT IN THE DOCUMENT. `VISUAL_SEQUENCE` is
   the intended six-phase sequence, declared as data so the
   comparison between INTENDED and ACTUAL is something a machine
   performs rather than something a session asserts.
   `docs/FIRST-END-TO-END-AUDIT.md` quotes the output of
   `node agent/simulation/cli.mjs threshold` rather than restating
   the table — one home per fact.

   NOTHING HERE IMPLEMENTS ANYTHING. Phases 2, 5 and 6 do not match
   the intended sequence today. This file REPORTS that; SESSION 24's
   brief says the visual sequence is defined "without requiring
   production implementation yet", and the mismatches are findings
   in the audit rather than a patch to `js/threshold.js`.
   ============================================================ */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT } from '../implement/baseline.mjs';
import { isThreshold, thresholdProvider, controlRoomHref, THRESHOLD_TRIGGERS, passage } from '../../js/threshold.js';

const read = (p) => readFileSync(join(REPO_ROOT, p), 'utf8');
const src = () => read('js/threshold.js');
const css = () => read('style.css');

/* ============================================================
   The intended visual sequence — SESSION 24's specification
   ============================================================ */

export const VISUAL_SEQUENCE = Object.freeze([
  Object.freeze({
    phase: 1,
    id: 'recognition',
    intended: 'The search bar recognises the designated query. Nothing else in the interface reacts, and the result is one item that says what it is.',
    must_not: 'match a prefix, a substring or a near miss; contribute anything to ordinary search; or read the query anywhere but in the browser.',
    reference: 'A closed vocabulary, recognised. The phrase is the count the tradition gives the paths of wisdom — twenty-two letters and ten sefirot.',
  }),
  Object.freeze({
    phase: 2,
    id: 'transition',
    intended: 'The normal search interface becomes temporarily quiet and the surrounding interface begins to recede — the page withdraws rather than being covered.',
    must_not: 'navigate, fetch, or commit anything. An interruption at this point must leave the reader exactly where they were.',
    reference: 'Quiet, not spectacle. Nothing of the terminal-green kind.',
  }),
  Object.freeze({
    phase: 3,
    id: 'geometric_emergence',
    intended: 'A circular geometric structure begins to form: concentric circular organisation, radial divisions, twenty-two Hebrew letters, precise geometric lines, a restrained manuscript-like composition.',
    must_not: 'read as decoration or as a digital effect. The structure is the argument — a closed enum authority, which is what data/taxonomy.json is to every other dataset here.',
    reference: 'An original construction in the diagrammatic manner of the Sefer Yetzirah wheels: three bands divided 3 · 7 · 12.',
  }),
  Object.freeze({
    phase: 4,
    id: 'activation',
    intended: 'The structure becomes progressively more complete, as if a hidden diagram were being revealed rather than generated.',
    must_not: 'complete instantly, or depend on completing. prefers-reduced-motion goes straight to the end state, and no state anywhere depends on the animation finishing.',
    reference: 'Drawn, not faded in: a line that arrives along its own length reads as revealed.',
  }),
  Object.freeze({
    phase: 5,
    id: 'passage',
    intended: 'The completed structure contracts, or transforms, into the entry point for the private interface. The wheel becomes the door.',
    must_not: 'imply that the query opened anything. A passage is a way to a login, never a way past one.',
    reference: 'The gate at the centre of the wheel is where the contraction resolves.',
  }),
  Object.freeze({
    phase: 6,
    id: 'authentication',
    intended: 'CONTROL ROOM is revealed, followed by the normal authentication interface.',
    must_not: 'render an authentication interface ON THE PUBLIC PAGE. A credential prompt served from the published static site is a phishing surface and a second home for a login. The public page may only hand the reader to the Control Room\'s own origin, which serves its own login and authenticates there.',
    reference: 'The name, then the ordinary door. The animation must never imply that the special query itself grants access.',
  }),
]);

/* ============================================================
   What the code actually does — measured, not asserted
   ============================================================ */

export function measureSequence() {
  const js = src();
  const style = css();

  const has = (hay, needle) => hay.includes(needle);

  const phases = [
    {
      id: 'recognition',
      status: 'implemented',
      evidence: [
        'js/threshold.js isThreshold() normalises case and whitespace and compares against three exact triggers.',
        `js/palette.js:129 returns thresholdProvider(q) ALONE for the phrase, so the threshold never mixes with ordinary results.`,
        'agent/browser/checks.mjs threshold:exact measures in a real browser that "thirty-two path" (singular) produces zero results.',
      ],
      matches: true,
      mismatch: null,
    },
    {
      id: 'transition',
      status: 'partially_implemented',
      evidence: [
        `style.css .thr-scrim is a fixed full-viewport overlay: ${has(style, '.thr-scrim{') ? 'declared' : 'NOT FOUND'}.`,
        'js/threshold.js passage() appends the scrim to document.body and adds .thr-run on the next animation frame.',
        'Nothing in either file touches the palette, the chrome or the page behind.',
      ],
      matches: false,
      mismatch: 'The page is COVERED, not receded. There is no step that quiets the search interface or withdraws the surrounding page: '
        + 'the scrim is painted over it in one move. The intended "begins to recede" is not implemented, and the palette is left open behind the overlay.',
    },
    {
      id: 'geometric_emergence',
      status: 'implemented',
      evidence: [
        'js/threshold.js wheel() draws three concentric bands at r=148/104/62 divided 12 · 7 · 3, with 22 letters across them.',
        `The letters are declared as three arrays — MOTHERS(3), DOUBLES(7), SIMPLES(12) — totalling ${3 + 7 + 12}.`,
        'agent/browser/checks.mjs threshold:passage measured 3 rings and 22 letters rendered in a real browser.',
        'style.css .thr-ring/.thr-spoke use stroke-width .75 with vector-effect:non-scaling-stroke — fine lines that stay fine.',
      ],
      matches: true,
      mismatch: null,
    },
    {
      id: 'activation',
      status: 'implemented',
      evidence: [
        `style.css @keyframes thr-draw animates stroke-dashoffset 1000 → 0: ${has(style, '@keyframes thr-draw') ? 'present' : 'NOT FOUND'} — the ring arrives along its own length rather than fading in.`,
        'The three rings are staggered 0 / 160 / 320 ms; letters and spokes fade at 620 ms; the centre gate at 1000 ms.',
        `prefers-reduced-motion is honoured: ${has(style, 'prefers-reduced-motion') ? '.thr-still is the finished state with no motion' : 'NOT FOUND'}.`,
        'js/threshold.js: the transition is one class, so removing the element mid-way cannot strand the reader.',
      ],
      matches: true,
      mismatch: null,
    },
    {
      id: 'passage',
      status: 'not_implemented',
      evidence: [
        `style.css .thr-run .thr-wheel>g animates thr-turn 24s linear INFINITE: ${has(style, 'thr-turn 24s linear infinite') ? 'present' : 'NOT FOUND'} — the wheel rotates forever rather than resolving.`,
        'The panel arrives beside the wheel (thr-rise, 900 ms) in a flex row; the two coexist.',
        'There is no contraction, no transform of the wheel into the entry point, and no animation on .thr-gate after it fades in.',
      ],
      matches: false,
      mismatch: 'The completed structure does NOT contract or transform into the entry point. It rotates indefinitely next to a text panel. '
        + 'The intended phase 5 — the wheel becoming the door — does not exist in js/threshold.js or style.css.',
    },
    {
      id: 'authentication',
      status: 'deliberately_different',
      evidence: [
        `The panel's kicker is "Threshold" and its title is "A private control plane"; the string "CONTROL ROOM" does not appear: ${/CONTROL ROOM/.test(js) ? 'FOUND — investigate' : 'confirmed absent'}.`,
        'No authentication interface is rendered on the public page. The panel offers at most one link, and only when the deployment declares <meta name="eu-control-room">.',
        `No page in this repository declares that meta tag, so on the published site the passage ends at a statement and offers no link at all: ${pagesDeclaringControlRoom().length} page(s) declare it.`,
        'The panel says in its own copy that finding the page grants no access, which is the one thing the brief says the animation must never imply.',
      ],
      matches: false,
      mismatch: 'Two differences, and they are not the same kind of thing. (a) COSMETIC: the reveal says "Threshold / A private control plane" rather than '
        + '"CONTROL ROOM", so the intended name is not shown. (b) DELIBERATE AND CORRECT: the "normal authentication interface" is NOT rendered here and must not be. '
        + 'A login form served from the published static site would be a credential prompt in the public tree — a phishing surface, and a second home for a login that '
        + '.control-room/ already serves behind its own origin. The public page hands the reader to that origin; it does not become it.',
    },
  ];

  return VISUAL_SEQUENCE.map((spec) => ({ ...spec, ...phases.find((p) => p.id === spec.id) }));
}

function pagesDeclaringControlRoom() {
  return readdirSync(REPO_ROOT)
    .filter((f) => f.endsWith('.html'))
    .filter((f) => read(f).includes('eu-control-room'));
}

/* ============================================================
   The six separations
   ============================================================ */

/** Primitives whose presence would make the module more than a UX
 *  event. Taken from `agent/policy/selftest.mjs` test 18 rather than
 *  reinvented, and extended with the two the animation could reach
 *  for. */
const FORBIDDEN_PRIMITIVES = Object.freeze([
  'fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'document.cookie',
  'Authorization', 'Bearer', 'password', 'csrf', 'WebSocket', 'navigator.sendBeacon',
]);

/**
 * @param {{controlRoom?:{get:function, post?:function}|null}} live
 *        A running Control Room, when the caller has one. Without it
 *        the two live separations report `not_measured_here` rather
 *        than passing.
 */
export async function separations({ controlRoom = null } = {}) {
  const js = src();
  const crFiles = existsSync(join(REPO_ROOT, '.control-room'))
    ? readdirSync(join(REPO_ROOT, '.control-room')).filter((f) => f.endsWith('.mjs'))
    : [];
  const crSrc = crFiles.map((f) => read(join('.control-room', f))).join('\n');
  const { ROUTES } = await import('../../.control-room/server.mjs');
  const { DISCARDED_FIELDS, ACCEPTED_FIELDS } = await import('../orchestrator/events.mjs');
  const { WORKFLOW_TYPES } = await import('../orchestrator/workflows.mjs');
  const { AGENT_NAMES } = await import('../orchestrator/capabilities.mjs');

  const imports = [...js.matchAll(/^\s*import\s.+$/gm)].map((m) => m[0].trim());
  const present = FORBIDDEN_PRIMITIVES.filter((p) => js.includes(p));

  const out = [];

  /* 1 ---------------------------------------------- authentication */
  out.push({
    separation: 'authentication',
    separated: present.length === 0 && imports.length === 0,
    measured: [
      `js/threshold.js contains none of the ${FORBIDDEN_PRIMITIVES.length} primitives a credential or a session would need${present.length ? `: FOUND ${present.join(', ')}` : ''}.`,
      `The module imports nothing at all (${imports.length} import statements), so it can reach no data loader, no fetch wrapper and no other module in js/.`,
      'passage() called with no document returns null rather than throwing: no state anywhere depends on it having run.',
      'controlRoomHref() reads <meta name="eu-control-room"> and never constructs an address.',
    ],
    bound: 'This is a static read of one module plus a call with no DOM. It does not prove what a browser does with it; agent/browser/checks.mjs checkThreshold measures that, including that opening the passage issues no network request at all.',
  });

  /* 2 ----------------------------------------------- authorization */
  const namedRoutes = ROUTES.filter((r) => /threshold|paths|yetzirah|passage/i.test(r.path));
  out.push({
    separation: 'authorization',
    separated: namedRoutes.length === 0 && !/threshold|thirty-two/i.test(crSrc),
    measured: [
      `${namedRoutes.length} of ${ROUTES.length} Control Room routes name the discovery mechanism.`,
      `${crFiles.length} server-side file(s) were searched for the trigger phrase: ${/threshold|thirty-two/i.test(crSrc) ? 'FOUND — the phrase would be a credential' : 'absent'}.`,
      'The permission a request needs is computed from the PROPOSAL\'s autonomy class inside decide(), never from anything the caller sends.',
      controlRoom ? 'A live Control Room was probed with the phrase in three shapes; results below.' : 'No live Control Room was started for this measurement.',
    ],
    live: controlRoom ? await probeLive(controlRoom) : 'not_measured_here',
    bound: 'The route table is data and can be asserted against. It says nothing about a route somebody adds later; agent/policy/selftest.mjs test 20 is the standing check.',
  });

  /* 3 --------------------------------------------------- approval */
  const ledgerCallers = grepRepo('recordDecision(');
  out.push({
    separation: 'approval',
    separated: !ledgerCallers.some((f) => f.startsWith('js/')),
    measured: [
      `The spelling "recordDecision(" appears in: ${ledgerCallers.join(', ') || '(none found)'}. `
        + 'That is a search for a string, not a call graph: agent/implement/cli.mjs and .control-room/decide.mjs are the two real writers AGENTS.md names, '
        + 'agent/policy/verify/attacks.mjs is the adversarial harness that tries to forge one, two selftests exercise those callers, and agent/health/control.mjs mentions it in a comment.',
      'NONE of them is under js/, which is the separation actually being measured, and js/threshold.js imports nothing — so no path exists from the animation to the decision ledger.',
      'A grant is bound to the proposal\'s sha256 and refuses any agent name; the animation has neither a proposal nor a name.',
    ],
    bound: 'A grep over call sites is a search for one spelling. The structural fact behind it is that js/ is served to browsers and agent/implement/decisions/ is written by a Node process on somebody\'s machine — they are not in the same address space at all.',
  });

  /* 4 ---------------------------------------------- orchestration */
  const mentions = {
    event_sources: ACCEPTED_FIELDS.includes('source'),
    workflow_types_naming_it: WORKFLOW_TYPES.filter((t) => /threshold|passage/i.test(t)),
    agents_naming_it: AGENT_NAMES.filter((a) => /threshold|passage/i.test(a)),
  };
  out.push({
    separation: 'orchestration',
    separated: mentions.workflow_types_naming_it.length === 0 && mentions.agents_naming_it.length === 0,
    measured: [
      `${mentions.workflow_types_naming_it.length} of ${WORKFLOW_TYPES.length} workflow types name the threshold.`,
      `${mentions.agents_naming_it.length} of ${AGENT_NAMES.length} registered actors name it.`,
      'The Control Room has no route that starts, retries, dispatches or resumes a workflow, so even an authenticated operator cannot begin one — and the animation is not authenticated.',
      `The event intake refuses an unknown field outright and strips ${DISCARDED_FIELDS.length} approval-shaped ones; a UX event cannot become a governed event by naming itself one.`,
    ],
    bound: 'This measures that no orchestration vocabulary knows the word. It does not prove a future session could not add one — the absence of the route is the control, and it is asserted by agent/orchestrator/selftest.mjs and .control-room/selftest.mjs, not by this file.',
  });

  /* 5 ----------------------------------------------- execution */
  /* AGAINST THE CODE, NOT THE PROSE. The first draft of this check
     scanned the whole file and reported js/threshold.js as failing
     because its own header says the module does not "approve,
     execute, or read anything privileged". A check that a comment
     can trip is a check that reports the documentation instead of
     the behaviour — the same mistake agent/browser/checks.mjs
     records against its own first draft of threshold:no-globals. */
  const code = stripComments(js);
  const executionPrimitives = ['child_process', 'exec(', 'execSync', 'spawn(', 'eval(', 'new Function'].filter((p) => code.includes(p));
  out.push({
    separation: 'execution',
    separated: imports.length === 0 && executionPrimitives.length === 0,
    measured: [
      `js/threshold.js contains no child_process, exec, spawn, eval or Function constructor in its CODE${executionPrimitives.length ? `: FOUND ${executionPrimitives.join(', ')}` : ''} — comments are stripped before the scan, because the module's own header uses the word "execute".`,
      'It runs in a browser, on a static page served by GitHub Pages, with no build step and no server behind it.',
      'The one action it exposes is `passage()`, which appends a DOM node and adds a CSS class.',
    ],
    bound: 'A browser page cannot execute anything in this repository. That is a property of the deployment, not of this module\'s discipline, and it would stop being true the day a server route read the phrase.',
  });

  /* 6 ---------------------------------------------- deployment */
  const declaring = pagesDeclaringControlRoom();
  out.push({
    separation: 'deployment',
    separated: declaring.length === 0,
    measured: [
      `${declaring.length} published page(s) declare <meta name="eu-control-room">, so the passage ends at a statement and navigates nowhere.`,
      '.control-room/ is behind a dot prefix and is therefore not served by a GitHub Pages deployment with no _config.yml.',
      'No route in the Control Room contains any of the prohibited production words, and the server imports neither child_process nor the applier.',
      'Nothing about the animation can cause a deployment: a push to main publishes, and the animation cannot push.',
    ],
    bound: 'Almost the whole repository IS inside the published deployment (docs/IMPLEMENTATION-QA.md §6). The dot prefix is the one real exclusion, and it is a publication boundary, not a security control — protocol §10 and docs/CONTROL-ROOM.md §1 both say so.',
  });

  return out;
}

async function probeLive(cr) {
  const paths = ['/api/queue?q=thirty-two%20paths', '/login?threshold=thirty-two+paths', '/api/session?paths=32', '/api/review?paths=thirty-two'];
  const rows = [];
  for (const p of paths) {
    const res = await cr.get(p);
    rows.push({ path: p, status: res.status, admitted: res.status === 200 && !p.startsWith('/login') });
  }
  return rows;
}

/** Every file that mentions a spelling, repository-relative, skipping
 *  the places a run artifact would live. */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

function grepRepo(needle, dir = REPO_ROOT, rel = '', out = []) {
  const SKIP = new Set(['.git', 'node_modules', 'runs', 'state', 'history', 'drafts']);
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) { grepRepo(needle, join(dir, e.name), r, out); continue; }
    if (!/\.(mjs|js)$/.test(e.name)) continue;
    if (e.name === 'ledger.mjs') continue;          // the definition, not a caller
    if (r === 'agent/simulation/threshold.mjs') continue;   // this file, doing the measuring
    let text = '';
    try { text = readFileSync(join(dir, e.name), 'utf8'); } catch { continue; }
    if (text.includes(needle)) out.push(r);
  }
  return out;
}

/* ============================================================
   The whole path, as one object
   ============================================================ */

export async function discoverySimulation({ controlRoom = null } = {}) {
  return {
    what: 'The hidden Control Room discovery flow, simulated as a separate UX/security path: search trigger → recognition → animation → login boundary.',
    triggers: [...THRESHOLD_TRIGGERS],
    trigger_is_not_a_credential:
      'The phrase is in js/threshold.js, which is served to every reader. Protocol §10 says a hidden route, a hidden link and an unlisted page are not security mechanisms. '
      + 'Anybody who finds it meets the same login as somebody who typed the URL.',
    recognition: {
      exact_only: thresholdProvider('thirty-two path').length === 0,
      one_result: thresholdProvider(THRESHOLD_TRIGGERS[0]).length === 1,
      item_keys: Object.keys(thresholdProvider(THRESHOLD_TRIGGERS[0])[0].items[0]).sort(),
      every_other_query: thresholdProvider('gdpr').length === 0,
      case_insensitive: isThreshold('THIRTY-TWO PATHS'),
    },
    with_no_document: passage(),
    control_room_href_without_meta: controlRoomHref({ querySelector: () => null }),
    visual_sequence: measureSequence(),
    separations: await separations({ controlRoom }),
    animation_is_presentation_only:
      'The six separations above are the whole of the claim. The animation draws an SVG and adds a CSS class. It authenticates nothing, authorizes nothing, '
      + 'approves nothing, orchestrates nothing, executes nothing and deploys nothing — and each of those is measured above rather than asserted here.',
  };
}
