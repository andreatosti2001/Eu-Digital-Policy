/* ============================================================
   agent/production/separations.mjs — DISCOVERY ≠ AUTHENTICATION ≠
   AUTHORIZATION, measured against this tree

   WHAT SESSION 29 ASKS. The public website MAY keep the hidden
   Control Room discovery mechanism. The hidden search combination
   may reveal that a private interface exists, may trigger the
   visual transition, and may route the reader to authentication —
   and must NEVER authenticate, authorize, approve, execute, deploy
   or expose privileged data. This module measures all nine of
   those: three permissions and six prohibitions.

   IT DOES NOT DUPLICATE THE ADVERSARIAL GATE, AND THE DIFFERENCE
   MATTERS. `agent/policy/verify/` ATTACKS the boundary from
   outside: it starts a real Control Room and sends it forged
   claims. This module reads the tree and asks a different question
   — whether the mechanism has the CAPABILITY to do any of the six
   things at all. Both are worth having, because an attack that
   fails proves the door held today and a capability that is absent
   proves there is no door.

   THE HE-04 DISCRIMINATOR, and why it is here rather than in the
   gate. `agent/policy/verify/attacks.mjs` HE-04 is CRITICAL and has
   reported SUCCEEDED since SESSION 24: the trigger phrase appears
   in `agent/simulation/threshold.mjs`, outside the client module
   and its tests. The attack's own finding text states the
   condition it could not check — "if any of those READS IT AS AN
   INPUT, it is a credential" — and nothing checks it. This module
   checks it, in two independent halves that must BOTH hold before
   an occurrence is cleared:

     · POSITION — is the phrase a needle being searched for in
       repository text, or a value being compared against something
       the module received from outside?
     · CAPABILITY — can the module that holds it grant, authorize,
       authenticate, decide or execute anything at all? A module
       that cannot grant cannot use a phrase as a credential
       however it reads it.

   The gate is NOT edited here and its finding is NOT reclassified.
   Weakening a CRITICAL by editing the thing that reports it is the
   move this repository's whole architecture is arranged against,
   and a stale exclusion list is the specific shape SESSION 23.5
   already had to correct once. So HE-04 stays red, this module
   reports what it independently establishes, and
   `docs/PRODUCTION-OPERATING-MODE.md` carries both.

   THE CLASSIFIER DEFAULTS TO UNDETERMINED, never to safe. An
   occurrence it cannot place is `undetermined` and counts as
   unresolved. A lexical classifier that guessed "probably a search"
   would be closing an evidence gap with a plausible substitute.
   ============================================================ */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

import { REPO_ROOT } from '../implement/baseline.mjs';
import { THRESHOLD_TRIGGERS } from '../../js/threshold.js';

/** The client module is where the phrase belongs, and its own suites
 *  and the gate that attacks it must contain it to do their jobs. */
export const PHRASE_HOME = 'js/threshold.js';

/** What a module would need in order to grant anything. If none of
 *  these appears, the module cannot be the place a credential is
 *  honoured, whatever strings it holds.
 *
 *  MATCHED AS A CALL, NEVER AS A STRING, and this is the opposite of
 *  the rule `agent/policy/verify/attacks.mjs` HE-01 applies two
 *  directories away — deliberately, because the two are looking for
 *  different things. HE-01 looks for a CREDENTIAL and keeps string
 *  literals, because a credential is one. This looks for a
 *  CAPABILITY and discards them, because a capability is a call and
 *  never a quoted word. The first draft of this file kept them and
 *  reported itself as holding all thirteen primitives, on the
 *  strength of the array immediately below. */
export const GRANTING_PRIMITIVES = Object.freeze([
  'recordDecision', 'recordGrant', 'authorize', 'authenticate', 'permissionFor',
  'createSession', 'setCookie', 'signToken', 'mayExecute',
  'issueToken', 'grantFor', 'login',
]);

/** The six things the brief says the mechanism must never do, and
 *  the capability each would need. */
export const PROHIBITIONS = Object.freeze([
  Object.freeze({ id: 'never_authenticate', name: 'authenticate', needs: 'a credential store, a session, or a call into one' }),
  Object.freeze({ id: 'never_authorize', name: 'authorize', needs: 'a permission decision, or a call into one' }),
  Object.freeze({ id: 'never_approve', name: 'approve', needs: 'a writer of the decision ledger' }),
  Object.freeze({ id: 'never_execute', name: 'execute', needs: 'a process primitive or a file write' }),
  Object.freeze({ id: 'never_deploy', name: 'deploy', needs: 'a push, a publish or a build' }),
  Object.freeze({ id: 'never_expose', name: 'expose privileged data', needs: 'a fetch, a socket, or an import of a privileged module' }),
]);

/** The three things it MAY do. */
export const PERMISSIONS = Object.freeze([
  Object.freeze({ id: 'may_reveal', name: 'reveal that a private interface exists' }),
  Object.freeze({ id: 'may_transition', name: 'trigger the visual transition' }),
  Object.freeze({ id: 'may_route', name: 'route the reader to authentication' }),
]);

const row = (id, name, held, evidence, bound = null) => ({ id, name, held, evidence, bound });

/* ------------------------------------------ the phrase, everywhere */

/** Every `.mjs`, `.js` and `.html` file under the tree, skipping run
 *  stores and the git directory. */
export function sourceFiles({ root = REPO_ROOT } = {}) {
  const SKIP = new Set(['.git', 'node_modules', 'runs', 'records', 'state', 'history', 'drafts', 'cycles', 'fonts']);
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue;
      const abs = join(dir, e.name);
      if (e.isDirectory()) { walk(abs); continue; }
      if (/\.(mjs|js|html)$/.test(e.name)) out.push(relative(root, abs));
    }
  };
  walk(root);
  return out.sort();
}

/** Blank out comment bodies, preserving every character position and
 *  every newline, so an offset into the masked text is the same
 *  offset in the original. An occurrence that survives masking is in
 *  executable code; one that does not is in a comment. */
export function maskComments(text) {
  const s = String(text ?? '');
  const keep = (m) => m.replace(/[^\n]/g, ' ');
  return s
    .replace(/\/\*[\s\S]*?\*\//g, keep)
    .replace(/(^|[^:\\])\/\/[^\n]*/g, (m, p1) => p1 + keep(m.slice(p1.length)));
}

/** Blank out string and template literals the same way. Used only to
 *  look for a CALL, which is never inside a quoted word. */
export function maskStrings(text) {
  const keep = (m) => m.replace(/[^\n]/g, ' ');
  return String(text ?? '')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, keep)
    .replace(/"(?:[^"\\\n]|\\.)*"/g, keep)
    .replace(/`(?:[^`\\]|\\.)*`/g, keep);
}

/** Blank out regular-expression literals. A regex NAMING a primitive
 *  is searching for it, which is the opposite of calling it — and
 *  this module's own `never_authorize` check is the worked example:
 *  it asks `!/permission|authorize|mayExecute|grantFor/i.test(code)`,
 *  and the draft without this mask reported this file as calling
 *  five things it only ever looks for.
 *
 *  Run AFTER strings are masked, and anchored to a position where an
 *  expression may begin, so a division is not read as a regex. */
export function maskRegexLiterals(text) {
  const keep = (m) => m.replace(/[^\n]/g, ' ');
  return String(text ?? '').replace(
    /([(,=!&|:;?{[]|=>|\breturn\b)(\s*)(\/(?:[^/\\\n[]|\\.|\[(?:[^\]\\\n]|\\.)*\])+\/[gimsuy]*)/g,
    (m, lead, gap, re) => `${lead}${gap}${keep(re)}`,
  );
}

/**
 * Is position `col` inside a string literal, and if so which one?
 *
 * A left-to-right scan rather than a regex, because the regexes this
 * replaced could not see a string containing the OTHER quote
 * character — and one line of `agent/simulation/threshold.mjs` is a
 * single-quoted sentence with a double-quoted phrase inside it,
 * which those regexes reported as `undetermined`.
 */
export function stringContextAt(line, col) {
  const l = String(line ?? '');
  let quote = null;
  let start = -1;
  for (let i = 0; i < col && i < l.length; i++) {
    const c = l[i];
    if (c === '\\') { i += 1; continue; }
    if (quote) { if (c === quote) { quote = null; start = -1; } continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; start = i; }
  }
  return quote ? { inString: true, quote, start } : { inString: false, quote: null, start: -1 };
}

/** The whole string literal an occurrence sits in, given its start. */
function stringBody(line, start, quote) {
  const l = String(line ?? '');
  for (let i = start + 1; i < l.length; i++) {
    if (l[i] === '\\') { i += 1; continue; }
    if (l[i] === quote) return l.slice(start + 1, i);
  }
  return l.slice(start + 1);
}

/**
 * Where one occurrence of the phrase sits, structurally.
 *
 *   `needle`           — inside a regex literal, or handed to a
 *                        text-search method. The module is LOOKING
 *                        FOR the phrase in text it read.
 *   `fixture`          — inside a string whose body is itself source
 *                        code. Quoted code is never executed, so the
 *                        phrase in it cannot be honoured.
 *   `prose`            — inside a sentence the module prints or files.
 *   `argument`         — passed into a call. The module is GIVING the
 *                        phrase to something to see what it does.
 *   `data`             — an element of an array or object literal: a
 *                        fixture table of probes or expectations.
 *   `compared_against` — the string holding it is itself one side of
 *                        an equality test. THIS is the shape a
 *                        credential check has, and it is the only
 *                        position reported as needing a person.
 *   `undetermined`     — none of the above could be established.
 *
 * ORDER MATTERS AND TWO ORDERINGS WERE WRONG BEFORE THIS ONE. A
 * regex literal is checked first because it is structurally
 * unambiguous: a regex is a pattern matched against something, never
 * a value compared for equality — and the first draft reported
 * `!/threshold|thirty-two/i.test(crSrc)` as `compared_against` on
 * the strength of an `=== 0` earlier in the same expression. And
 * `compared_against` now requires the operator to be ADJACENT to the
 * phrase's own quotes, because the first draft read
 * `thresholdProvider('thirty-two path').length === 0` as a
 * comparison of the phrase when it compares the length of a result.
 *
 * It is lexical and it says so. `undetermined` is the default: a
 * classifier that guessed "probably a search" would be closing an
 * evidence gap with a plausible substitute.
 *
 * @param {string} line  the masked line — comments already removed
 * @param {number} col   the index within it where the phrase starts
 */
export function classifyOccurrence(line, col = 0) {
  const l = String(line ?? '');
  const ctx = stringContextAt(l, col);

  /* 1. A regex literal. Unambiguous, and checked before anything
        else. Bracketed by an unescaped `/` before and a `/flags`
        after, with neither inside a string. */
  if (!ctx.inString
    && /\/(?:[^/\\\n]|\\.)*$/.test(l.slice(0, col))
    && /^(?:[^/\\\n]|\\.)*\/[gimsuy]*/.test(l.slice(col))) return 'needle';

  if (!ctx.inString) return 'undetermined';

  const before = l.slice(0, ctx.start);
  const body = stringBody(l, ctx.start, ctx.quote);
  const after = l.slice(ctx.start + 1 + body.length + 1);

  /* 2. A fixture: a string whose BODY is itself source code. It is
        checked before `compared_against` and the two cannot
        collide, because a fixture's operators are INSIDE the body
        and a real comparison's operator is outside it, touching
        this string's own quotes. Quoted code is data: it is never
        executed, so the phrase inside it cannot be honoured.

        This exists because agent/production/selftest.mjs pins the
        classifier to the exact lines that fooled its drafts, and
        those fixtures are code in quotes. Without this the suite
        that proves the classifier works would itself have been
        reported as a file needing a security read. */
  if (/===|!==|=>|\)\s*[;,{]|\.\w+\(|\bconst\s|\breturn\s/.test(body)) return 'fixture';

  /* 3. Compared. The operator must touch this string's own quotes —
        `x === 'phrase'` or `'phrase' === x` — and nothing else
        counts, because a comparison of something DERIVED from the
        string is not a comparison of the string. */
  if (/(===|!==|==|!=)\s*$/.test(before) || /^\s*(===|!==|==|!=)/.test(after)) return 'compared_against';

  /* 4. Handed to a text search. */
  if (/\.\s*(includes|indexOf|match|search|startsWith|endsWith)\s*\(\s*$/.test(before)) return 'needle';

  /* 5. A sentence. Counted in words so a long identifier does not
        pass as prose, and checked before `argument` because prose is
        usually an argument to something that prints it. */
  if (body.trim().split(/\s+/).length >= 6) return 'prose';

  /* 6. Given to a call. */
  if (/[A-Za-z_$][\w$]*\s*\(\s*(?:[^()]*,\s*)?$/.test(before)) return 'argument';

  /* 7. An element of a fixture table. */
  if (/[[{,:]\s*$/.test(before)) return 'data';

  return 'undetermined';
}

/** Which granting primitives a file CALLS or imports. Comments and
 *  string literals are masked out first, so neither a header
 *  explaining the rule nor a list declaring the vocabulary counts as
 *  holding the capability. */
export function grantingPrimitivesIn(text) {
  const t = maskRegexLiterals(maskStrings(maskComments(text)));
  return GRANTING_PRIMITIVES.filter((p) => new RegExp(`\\b${p}\\b`).test(t));
}

/**
 * Every occurrence of the phrase outside its home, classified, with
 * the capability of the file that holds it.
 *
 * THE DECISIVE HALF IS CAPABILITY. A file that calls none of the
 * granting primitives cannot honour the phrase as a credential
 * however it reads it, because it can honour nothing. That is a
 * property of the file rather than a judgement about a line, and it
 * is why this is the half `cleared` mostly rests on.
 *
 * THE POSITION IS REPORTED ANYWAY, and one position overrides the
 * clearance: an occurrence sitting on one side of an equality or
 * membership test is the shape a credential check HAS, and it is
 * flagged for a person to read even in a file that can grant
 * nothing today — because the file that can grant nothing today is
 * the file somebody adds a capability to next year.
 *
 * An occurrence inside a comment is not in executable code at all
 * and is counted separately.
 */
export function phraseOccurrences({ root = REPO_ROOT, triggers = THRESHOLD_TRIGGERS } = {}) {
  const needles = triggers.map((t) => t.toLowerCase());
  const files = sourceFiles({ root });
  const out = [];
  const RE = /thirty[- ]two|32 paths/gi;

  for (const rel of files) {
    if (rel === PHRASE_HOME) continue;
    const text = readFileSync(join(root, rel), 'utf8');
    const lower = text.toLowerCase();
    if (!needles.some((n) => lower.includes(n)) && !lower.includes('thirty-two')) continue;

    const grants = grantingPrimitivesIn(text);
    const lines = text.split('\n');
    const masked = maskComments(text).split('\n');
    const occurrences = [];
    let inComments = 0;

    for (let i = 0; i < lines.length; i++) {
      RE.lastIndex = 0;
      let m;
      while ((m = RE.exec(lines[i])) !== null) {
        /* Masked to spaces at this offset means the occurrence is in
           a comment: not executable, and nothing can read it. */
        if (!/\S/.test(masked[i].slice(m.index, m.index + m[0].length))) { inComments += 1; continue; }
        occurrences.push({
          line: i + 1,
          position: classifyOccurrence(masked[i], m.index),
          excerpt: lines[i].trim().slice(0, 160),
        });
      }
    }
    if (!occurrences.length && !inComments) continue;

    const compared = occurrences.filter((o) => o.position === 'compared_against');
    const undetermined = occurrences.filter((o) => o.position === 'undetermined');

    /* THREE STATES, NEVER TWO. A binary here would have to call a
       file that CAN grant but never compares the phrase either
       "cleared", which overstates what was established, or
       "uncleared", which reports the policy suite and the
       adversarial gate as suspected credential stores for doing the
       job they exist to do. Neither is what was measured. */
    const verdict = compared.length || undetermined.length
      ? 'read_it'
      : (grants.length ? 'no_path_found' : 'cleared');
    const cleared = verdict === 'cleared';

    out.push({
      file: rel,
      occurrences,
      in_comments: inComments,
      granting_primitives: grants,
      compared_against: compared.length,
      undetermined: undetermined.length,
      verdict,
      cleared,
      why: {
        cleared: `${occurrences.length} occurrence(s) in executable code and ${inComments} in comments. None sits on either side of an equality test, and the file calls none of the ${GRANTING_PRIMITIVES.length} primitives that could grant anything — so it cannot honour the phrase as a credential, because it cannot honour anything.`,
        no_path_found: `the file calls ${grants.join(', ')}, so it CAN grant something — and none of its ${occurrences.length} occurrence(s) of the phrase sits on either side of an equality test, so no path was found from the phrase to that capability. A path not found is not a path proven absent: this is the state that says a person should read the file once, not the state that says it is safe.`,
        read_it: `${compared.length} occurrence(s) sit where a credential check would and ${undetermined.length} could not be placed${grants.length ? `, in a file that calls ${grants.join(', ')}` : ''}. Read it.`,
      }[verdict],
    });
  }

  return out.sort((a, b) => a.file.localeCompare(b.file));
}

/* ---------------------------------------- the three and the six */

/**
 * The three permissions and the six prohibitions, measured.
 *
 * @param {{root?:string}} opts
 */
export function separations({ root = REPO_ROOT } = {}) {
  const src = readFileSync(join(root, PHRASE_HOME), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n');
  const imports = (code.match(/^\s*import\s/gm) ?? []).length;

  const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
  const declaring = pages.filter((p) => readFileSync(join(root, p), 'utf8').includes('eu-control-room'));
  const passwordFields = pages.filter((p) => /type=["']password["']/i.test(readFileSync(join(root, p), 'utf8')));

  const permissions = [
    row('may_reveal', 'reveal that a private interface exists',
      /A private control plane/.test(src) && /thresholdProvider/.test(code),
      'the provider returns exactly one result, whose title and sub-title state that a private control plane exists and that this page grants no access to it. Revealing the existence is the whole of what it does.'),
    row('may_transition', 'trigger the visual transition',
      /export function passage/.test(code) && /classList\.add\('thr-run'\)/.test(code),
      'passage() builds the panel and adds one class. The whole animation is the presence of that class, so an interruption cannot strand a reader half way through, and no state anywhere depends on it having run.'),
    row('may_route', 'route the reader to authentication',
      /a\.href = href/.test(code) && /controlRoomHref/.test(code),
      `the panel offers an <a href> a person clicks, and only when the document declares <meta name="eu-control-room">. ${declaring.length} of ${pages.length} published page(s) declare one, so on this deployment the passage ends at a statement.`),
  ];

  const prohibitions = [
    row('never_authenticate', 'authenticate',
      imports === 0 && !/document\.cookie|localStorage|sessionStorage|Authorization|Bearer|password/.test(code),
      `the module holds no credential store, no session and no header, and it has ${imports} import statements, so it can call into none. There is no privileged state on the client at all, which is why there is nothing for a claim about the animation to satisfy.`,
      'agent/policy/verify/ HE-03 sends four forged claims about the animation to a real Control Room and all four are refused with 401/403. That is the other half and it is an attack rather than a read.'),
    row('never_authorize', 'authorize',
      !/permission|authorize|mayExecute|grantFor/i.test(code),
      'the module computes no permission. Every privileged request in .control-room/ derives the permission it needs from the PROPOSAL\'s own autonomy class inside decide(), never from anything the caller sends — so there is no parameter the phrase could occupy.'),
    row('never_approve', 'approve',
      !/recordDecision|recordGrant|approve/i.test(code),
      'the module names neither of the two writers of a decision. A grant exists only in agent/implement/decisions/decisions.jsonl through recordDecision, which requires a named human and binds the decision to the proposal\'s hash, and it has exactly two callers.'),
    row('never_execute', 'execute',
      !/child_process|exec|spawn|writeFile|eval\(|Function\(/.test(code),
      'the module holds no process primitive, no file write and no dynamic evaluation. Its only outward effect is an anchor element a person may click.'),
    /* CHECKED AS A CAPABILITY, NOT AS A VOCABULARY. The first draft
       searched the module for the words deploy, publish, push and
       build, and reported a FAILURE — on the sentence the panel
       shows a reader: "This deployment does not publish its
       address". A check that fails on a module's own denial is the
       HE-01 shape this repository has already had to correct once,
       and it is worth less than no check, because somebody would
       have removed the sentence to clear it. What a deployment
       actually needs is a way to make something happen without a
       person: a process, a request, or a navigation the module
       initiates itself. */
    row('never_deploy', 'deploy',
      !/child_process|exec|spawn|fetch\(|XMLHttpRequest|location\.(assign|replace|href\s*=)|window\.open|\.submit\(/.test(code),
      'the module can initiate nothing. It holds no process primitive, no request, no navigation it performs itself and no form submission: its only outward effect is an anchor element a person may click. Deployment here is GitHub Pages serving main at the repository root, and nothing on the client can push a commit.'),
    row('never_expose', 'expose privileged data',
      !/fetch\(|XMLHttpRequest|WebSocket|\/api/.test(code) && imports === 0,
      'the module issues no request of any kind and imports nothing, so it can reach no data loader, no trace store and no other module in js/. agent/browser/checks.mjs measures in a real browser that opening the passage issues no network request at all.'),
  ];

  return {
    permissions,
    prohibitions,
    pages_declaring_an_address: declaring,
    pages_with_a_password_field: passwordFields,
    occurrences: phraseOccurrences({ root }),
  };
}

/** Does the whole separation hold? Every prohibition must hold, no
 *  page may carry a password field, and every occurrence of the
 *  phrase outside its home must be cleared on both halves. */
export function separationSummary(s) {
  const failedProhibitions = s.prohibitions.filter((p) => !p.held).map((p) => p.id);
  const readIt = s.occurrences.filter((o) => o.verdict === 'read_it').map((o) => o.file);
  const noPath = s.occurrences.filter((o) => o.verdict === 'no_path_found').map((o) => o.file);
  return {
    prohibitions_held: s.prohibitions.filter((p) => p.held).length,
    prohibitions_total: s.prohibitions.length,
    failed_prohibitions: failedProhibitions,
    permissions_available: s.permissions.filter((p) => p.held).length,
    password_fields: s.pages_with_a_password_field,
    occurrence_files: s.occurrences.length,
    cleared_files: s.occurrences.filter((o) => o.verdict === 'cleared').map((o) => o.file),
    no_path_found_files: noPath,
    read_it_files: readIt,
    held: failedProhibitions.length === 0 && readIt.length === 0 && s.pages_with_a_password_field.length === 0,
  };
}

/** The control-plane half, separately: the phrase must appear in no
 *  file under `.control-room/` at all. This is the half HE-04's own
 *  title is about, and it is unconditional — a Control Room file
 *  that mentioned the phrase would be a credential regardless of how
 *  it read it, because that directory is where things are honoured. */
export function controlPlaneClear({ root = REPO_ROOT } = {}) {
  const dir = join(root, '.control-room');
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return { clear: false, files: [], why: '.control-room/ is not present, so nothing was checked. An absent check is not a pass.' };
  }
  const files = readdirSync(dir).filter((f) => f.endsWith('.mjs'));
  const hits = files.filter((f) => /threshold|thirty-two/i.test(readFileSync(join(dir, f), 'utf8')));
  return {
    clear: hits.length === 0,
    files: hits,
    why: hits.length === 0
      ? `${files.length} Control Room source file(s) searched for the phrase and for the word "threshold": absent from every one. Nothing server-side reads it, so there is nothing a claim about it could satisfy.`
      : `the phrase or the word "threshold" appears in ${hits.join(', ')}. In this directory that is a credential.`,
  };
}
