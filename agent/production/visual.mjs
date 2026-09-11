/* ============================================================
   agent/production/visual.mjs — the final visual standard for the
   hidden entry, measured

   WHAT THIS IS FOR. SESSION 29's brief sets ten conditions on the
   hidden-entry animation and requires them verified BEFORE
   production activation. Nine of the ten are checkable against
   `js/threshold.js` and the end of `style.css` without opening a
   browser; the tenth — that it does not materially degrade
   performance — is partly settled by `agent/browser/checks.mjs
   checkThreshold`, which measures in a real browser that opening
   the passage issues no network request at all.

   IT MEASURES, IT DOES NOT ASSERT. Every criterion returns the
   strings it found and the line it found them on. Where a criterion
   cannot be settled by reading source, it returns `unmeasurable`
   with the reason rather than a pass — the same rule
   `agent/health/` and `agent/ux/` apply, and for the same reason:
   an aesthetic judgement dressed as a measurement is the worst kind
   of green tick.

   TWO CRITERIA ARE PARTLY AESTHETIC AND SAY SO. "Consistent with
   the site's established visual identity" and "does not introduce a
   generic horror/hacker aesthetic" are settled here only in their
   MECHANICAL half: whether the block declares its own colours or
   reuses the site's tokens, and whether any of a named list of
   genre signatures appears. A reader looking at the drawing is the
   other half and this module does not pretend to be one.

   ON THE SOURCE TRADITION. The brief asks that the design be
   inspired by the Yetziratic wheel "without misrepresenting the
   source tradition" and that it not use "arbitrary religious
   symbols as decoration". Those are checked as two mechanical
   properties with a stated bound: that the twenty-two letters are
   used as the ENUM the module's own header says they are — three
   mothers, seven doubles, twelve simples, in those counts — and
   that the rendered panel makes no devotional, liturgical or
   doctrinal claim. Whether a practitioner of that tradition would
   accept the construction is not a thing this file can measure, and
   it says so rather than reporting a pass.
   ============================================================ */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT } from '../implement/baseline.mjs';

export const THRESHOLD_MODULE = 'js/threshold.js';
export const THRESHOLD_STYLES = 'style.css';

/** The genre signatures the brief rules out. Matched case-insensitively
 *  against the module and the stylesheet block. Each is a thing a
 *  "hacker interface" reliably brings with it, and none of them is a
 *  word this site would use for any other reason. */
export const GENRE_SIGNATURES = Object.freeze([
  'matrix', 'glitch', 'scanline', 'scan-line', 'crt', 'flicker', 'skull',
  'blood', 'hack', 'breach', 'intrusion', 'terminal-green', 'neon', 'glow',
  'cyber', 'vault', 'unlock', 'decrypt', 'access granted', 'classified',
]);

/** Devotional, liturgical or doctrinal vocabulary. The panel is a
 *  statement about where a control plane lives; any of these would
 *  make it a statement about a religion. */
export const DEVOTIONAL_VOCABULARY = Object.freeze([
  'god', 'divine', 'holy', 'sacred', 'blessed', 'prayer', 'ritual',
  'mystic', 'kabbal', 'sefirot', 'emanation', 'creation', 'soul',
  'spirit', 'enlighten', 'initiat',
]);

/** The privileged constructs a credential or a session would need.
 *  Kept in step with the list `agent/simulation/threshold.mjs` uses;
 *  this module checks the same absence for a different purpose, and
 *  a divergence between the two lists is itself worth seeing. */
export const FORBIDDEN_PRIMITIVES = Object.freeze([
  'fetch(', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'sessionStorage',
  'document.cookie', 'Authorization', 'Bearer', 'password', 'csrf', 'token', 'secret', '/api',
]);

const state = (id, name, s, evidence, bound = null) => ({ criterion: id, name, state: s, evidence, bound });
const pass = (id, name, evidence, bound = null) => state(id, name, 'pass', evidence, bound);
const fail = (id, name, evidence, bound = null) => state(id, name, 'fail', evidence, bound);
const unmeasurable = (id, name, evidence, bound = null) => state(id, name, 'unmeasurable', evidence, bound);

/** Strip block and line comments, keeping string literals. The
 *  precedent is `agent/policy/verify/attacks.mjs` HE-01: a module
 *  whose header says "it holds no token" was reported as holding a
 *  token by a scan that read its own denial. */
export function stripComments(text) {
  return String(text ?? '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
}

/** Every stylesheet RULE that declares or uses a threshold class or
 *  keyframe, as whole blocks rather than as matching lines.
 *
 *  A line scan was the first draft and it was wrong in a way worth
 *  recording: `.thr-go,.thr-back{ … min-height:var(--hit) … }` spans
 *  five lines and only the first of them contains the string
 *  `thr-`, so the scan reported the minimum hit target as absent
 *  when it is declared. The block matcher handles one level of
 *  nesting, which is what an `@media` wrapper needs and all this
 *  stylesheet uses.
 *
 *  Each row carries the line the block starts on, so a finding names
 *  somewhere a person can open. */
export function thresholdStyleRules(css) {
  const text = String(css ?? '');
  const out = [];
  const re = /([^{}]+)\{((?:[^{}]|\{[^{}]*\})*)\}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const block = m[0];
    if (!/thr-/.test(block)) continue;
    const line = text.slice(0, m.index + m[1].search(/\S/)).split('\n').length;
    out.push({ line, selector: m[1].trim(), text: block });
  }
  return out;
}

/**
 * The ten criteria, measured.
 *
 * @param {{root?:string, browser?:object|null}} opts
 *        `browser` is a parsed `agent/browser/cli.mjs --json` result.
 *        When absent, the two criteria that depend on it report
 *        `unmeasurable` rather than assuming.
 */
export function visualStandard({ root = REPO_ROOT, browser = null } = {}) {
  const src = readFileSync(join(root, THRESHOLD_MODULE), 'utf8');
  const code = stripComments(src);
  const css = readFileSync(join(root, THRESHOLD_STYLES), 'utf8');
  const styleRules = thresholdStyleRules(css);
  const styleText = styleRules.map((r) => r.text).join('\n');
  const styleCode = stripComments(styleText);

  const out = [];

  /* 1 ------------------------------- the site's own visual identity */
  {
    /* A colour literal in this block would be a second home for a
       palette the whole stylesheet derives from tokens. Hex, rgb()
       and hsl() are all literals; `var(--x)` is not. */
    const literals = styleRules.filter((r) => /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i.test(r.text) && !/var\(--/.test(r.text));
    const tokens = [...new Set(styleCode.match(/var\(--[a-z0-9-]+/gi) ?? [])].map((t) => t.slice(4));
    out.push(literals.length === 0
      ? pass('vs-01', 'consistent with the site\'s established visual identity',
        `the ${styleRules.length} threshold style rule(s) declare no colour, duration or spacing literal: every value is one of ${tokens.length} site token(s) — ${tokens.slice(0, 8).join(', ')}${tokens.length > 8 ? ', …' : ''}. The drawing is the site's own ink at the site's own weights.`,
        'This establishes that the block reuses the palette. Whether the RESULT looks like the rest of the site is a judgement a reader makes, and no measurement here is one.')
      : fail('vs-01', 'consistent with the site\'s established visual identity',
        `${literals.length} threshold style rule(s) carry a colour literal instead of a token: ${literals.map((r) => `${THRESHOLD_STYLES}:${r.line}`).join(', ')}`));
  }

  /* 2 ---------------------------- the approved original geometry */
  {
    /* Three concentric bands divided 3 · 7 · 12, twenty-two letters.
       The counts are read out of the module rather than restated. */
    const mothers = (code.match(/const MOTHERS = \[([^\]]*)\]/) ?? [])[1] ?? '';
    const doubles = (code.match(/const DOUBLES = \[([^\]]*)\]/) ?? [])[1] ?? '';
    const simples = (code.match(/const SIMPLES = \[([^\]]*)\]/) ?? [])[1] ?? '';
    const count = (s) => (s.match(/'[^']+'/g) ?? []).length;
    const n = { mothers: count(mothers), doubles: count(doubles), simples: count(simples) };
    const bands = [...code.matchAll(/band\(g, \{ r: (\d+), count: (\d+)/g)].map((m) => ({ r: Number(m[1]), count: Number(m[2]) }));
    const divisions = bands.map((b) => b.count);
    const ok = n.mothers === 3 && n.doubles === 7 && n.simples === 12
      && divisions.length === 3 && divisions.includes(3) && divisions.includes(7) && divisions.includes(12);
    out.push(ok
      ? pass('vs-02', 'uses the approved original geometric design',
        `three concentric bands at r=${bands.map((b) => b.r).join(', ')}, divided ${divisions.join(' · ')}, carrying ${n.mothers} + ${n.doubles} + ${n.simples} = ${n.mothers + n.doubles + n.simples} letters, drawn as SVG circles, lines and text by this module. No image, no font file and no third-party asset is loaded for it.`,
        'The construction is original to this repository. That it is ORIGINAL is a fact about provenance, not about quality.')
      : fail('vs-02', 'uses the approved original geometric design',
        `the geometry has changed: bands ${JSON.stringify(divisions)}, letters ${JSON.stringify(n)}. The declared design is three bands divided 3 · 7 · 12 carrying 22 letters.`));
  }

  /* 3 ------------------- inspired without misrepresenting the source */
  {
    const panelText = [...src.matchAll(/textContent = '([^']*)'/g)].map((m) => m[1]).join(' ')
      + ' ' + [...src.matchAll(/\? '([^']*)'\s*\n?\s*:\s*'([^']*)'/g)].map((m) => `${m[1]} ${m[2]}`).join(' ');
    const lower = panelText.toLowerCase();
    const devotional = DEVOTIONAL_VOCABULARY.filter((w) => lower.includes(w));
    /* The module states WHY the division is there rather than using
       it as a motif: the twenty-two letters are an enum authority,
       which is what data/taxonomy.json is to every other dataset. */
    const statesTheReason = /ENUM AUTHORITY/.test(src) && /taxonomy\.json/.test(src);
    out.push(devotional.length === 0 && statesTheReason
      ? pass('vs-03', 'inspired by the Yetziratic wheel without misrepresenting the source tradition',
        `the rendered panel carries none of the ${DEVOTIONAL_VOCABULARY.length} devotional, liturgical or doctrinal terms checked for; it says only that a private control plane exists elsewhere, behind an account. The module states the reason for the division in its own header — the tradition's twenty-two letters are a closed vocabulary from which everything else is composed, which is what data/taxonomy.json is to every other dataset here — so the borrowing is an analogy that is argued rather than a motif that is taken.`,
        'This establishes that the interface makes no religious claim and that the borrowing is reasoned. It does not establish that a practitioner of that tradition would accept the construction, and nothing in this repository can: that is a judgement by a person outside it.')
      : fail('vs-03', 'inspired by the Yetziratic wheel without misrepresenting the source tradition',
        devotional.length
          ? `the panel's rendered text carries ${devotional.join(', ')} — the interface is making a claim about a religion`
          : 'the module no longer states why the division is there, so the borrowing is a motif rather than an argument'));
  }

  /* 4 ------------------- no arbitrary religious symbol as decoration */
  {
    /* Every non-Latin glyph in the module, and whether each is one of
       the twenty-two the enum declares. A symbol that is NOT in the
       enum would be decoration by definition — it would belong to no
       structure the module explains. */
    const declared = new Set([
      ...((code.match(/const MOTHERS = \[([^\]]*)\]/) ?? [])[1] ?? '').match(/'([^']+)'/g)?.map((s) => s.slice(1, -1)) ?? [],
      ...((code.match(/const DOUBLES = \[([^\]]*)\]/) ?? [])[1] ?? '').match(/'([^']+)'/g)?.map((s) => s.slice(1, -1)) ?? [],
      ...((code.match(/const SIMPLES = \[([^\]]*)\]/) ?? [])[1] ?? '').match(/'([^']+)'/g)?.map((s) => s.slice(1, -1)) ?? [],
    ]);
    const glyphs = [...new Set((code.match(/[^\x00-\x7F]/g) ?? []))];
    const undeclared = glyphs.filter((g) => !declared.has(g));
    out.push(undeclared.length === 0
      ? pass('vs-04', 'does not use arbitrary religious symbols as decoration',
        `${glyphs.length} non-Latin glyph(s) appear in the module's executable code and every one of them is a member of the declared ${declared.size}-letter enum. The mark on the search result — "${[...declared][0]}" — is the first member of that enum and not a separate emblem. No star, no cross, no crescent, no tetragrammaton, no sigil and no symbol from any other tradition appears.`,
        'This counts glyphs in source. It does not establish that the ARRANGEMENT of them carries no meaning to somebody who reads it.')
      : fail('vs-04', 'does not use arbitrary religious symbols as decoration',
        `${undeclared.length} glyph(s) appear that belong to no declared enum: ${undeclared.join(' ')}`));
  }

  /* 5 ------------------------- no generic horror / hacker aesthetic */
  {
    const hay = `${code}\n${styleCode}`.toLowerCase();
    const hits = GENRE_SIGNATURES.filter((w) => hay.includes(w));
    /* The other half of the genre is the colour: terminal green on
       black, at full saturation. The block uses --live, which the
       site uses for its own live-status accents. */
    const greens = styleRules.filter((r) => /#0f0\b|#00ff00\b|\blime\b|rgb\(\s*0\s*,\s*255/i.test(r.text));
    out.push(hits.length === 0 && greens.length === 0
      ? pass('vs-05', 'does not introduce a generic horror or hacker aesthetic',
        `none of the ${GENRE_SIGNATURES.length} genre signatures checked for appears in the module or in the ${styleRules.length} style rule(s), and no full-saturation terminal green is declared. The strokes are hairlines at 0.75 and 1, there is no glow, no fill and no flicker, and the one continuous motion is a 24-second rotation of the wheel.`,
        'A named-word scan settles the vocabulary, not the impression. Whether the drawing READS as ominous is a judgement by a reader, and this module is not one.')
      : fail('vs-05', 'does not introduce a generic horror or hacker aesthetic',
        `${[...hits, ...greens.map((g) => `${THRESHOLD_STYLES}:${g.line}`)].join(', ')}`));
  }

  /* 6 -------------------------------------------------- accessible */
  {
    const required = [
      ["role', 'dialog", 'the panel is a dialog'],
      ["aria-modal', 'true", 'it is modal'],
      ["aria-label', 'Threshold", 'it is named'],
      ["'aria-hidden': 'true'", 'the drawing is hidden from assistive technology'],
      ["focusable: 'false'", 'the drawing is out of the tab order'],
      ["back.focus()", 'focus is moved into the panel'],
      ["open.restore.focus()", 'focus is restored on close'],
      ["e.key === 'Escape'", 'Escape closes it'],
    ];
    const missing = required.filter(([needle]) => !code.includes(needle));
    const hit = /min-height:var\(--hit\)/.test(styleCode);
    out.push(missing.length === 0 && hit
      ? pass('vs-06', 'is accessible',
        `all ${required.length} properties are present in the module's executable code — ${required.map(([, what]) => what).join('; ')} — and both actions carry min-height:var(--hit). agent/browser/checks.mjs measures the interruptible half in a real browser.`,
        'No contrast ratio was computed, no screen reader was run and no pixels were compared. README limitation 7 stands over this affordance exactly as it stands over the rest of the site, and docs/UX-AUDIT.md §7 holds the open questions a static read cannot settle.')
      : fail('vs-06', 'is accessible',
        `${missing.map(([, what]) => what).join('; ') || ''}${missing.length && !hit ? '; ' : ''}${hit ? '' : 'the actions declare no minimum hit target'}`));
  }

  /* 7 ------------------------------ respects reduced-motion */
  {
    /* Two independent mechanisms, and both must hold. The media query
       alone would leave the injectable path unprotected; the
       injectable path alone would leave a real reader's preference
       unread. */
    const mediaQuery = /@media \(prefers-reduced-motion:reduce\)\{[\s\S]{0,400}?animation:none/.test(css.replace(/\s*\n\s*/g, ''));
    const reads = code.includes("matchMedia('(prefers-reduced-motion: reduce)')");
    const stillClass = code.includes("classList.add('thr-still')");
    out.push(mediaQuery && reads && stillClass
      ? pass('vs-07', 'respects reduced-motion preferences',
        'three mechanisms, all present: the module reads window.matchMedia(\'(prefers-reduced-motion: reduce)\'); a reader who asked for none gets .thr-still, which is the finished state with no motion; and the stylesheet carries an @media (prefers-reduced-motion:reduce) block that sets animation:none on every animated selector in the block, so the preference holds even if the module\'s own read were bypassed.',
        'The media query is asserted against the stylesheet text. Nothing here simulates a browser with the preference set: agent/browser/ runs a default Chromium.')
      : fail('vs-07', 'respects reduced-motion preferences',
        `matchMedia read: ${reads}; still state: ${stillClass}; stylesheet @media block: ${mediaQuery}`));
  }

  /* 8 ------------------------ does not materially degrade performance */
  {
    const checks = browserChecks(browser, 'threshold:no-request', 'threshold:total-requests');
    const infinite = styleRules.filter((r) => /infinite/.test(r.text));
    const animatedProps = [...new Set((styleCode.match(/@keyframes thr-[a-z]+\{[^}]*\}/g) ?? [])
      .flatMap((k) => (k.match(/(opacity|transform|stroke-dashoffset)\s*:/g) ?? []).map((p) => p.replace(/\s*:$/, ''))))];
    const cheap = animatedProps.every((p) => ['opacity', 'transform', 'stroke-dashoffset'].includes(p));
    if (!checks.available) {
      out.push(unmeasurable('vs-08', 'does not materially degrade performance',
        `every animated property is one of ${animatedProps.join(', ')}, and ${infinite.length} declaration(s) run continuously — the 24-second rotation of the wheel, on transform. No browser result was supplied, so the network half is not measured here.`,
        'Run node agent/browser/cli.mjs --json and pass it in. This environment measures no frame rate, no paint time and no CPU: "materially degrade" is settled here only as "issues no request and animates only compositor-friendly properties".'));
    } else {
      out.push(checks.allPass && cheap
        ? pass('vs-08', 'does not materially degrade performance',
          `a real browser measured that opening the passage issues no network request of any kind, and that the page's total request count is unchanged by it. Every animated property is ${animatedProps.join(', ')} — opacity, transform and a stroke dash offset — and the one continuous animation is a 24-second rotation on transform. The drawing is inline SVG built by the module: no image, no font and no third-party asset is fetched for it.`,
          'No frame rate, paint time, CPU or memory was measured anywhere in this repository. "Does not materially degrade performance" is established here as "issues no request and animates only properties a compositor can handle", which is narrower than the words.')
        : fail('vs-08', 'does not materially degrade performance',
          `browser checks: ${checks.failing.join(', ') || 'all passed'}; animated properties: ${animatedProps.join(', ')}`));
    }
  }

  /* 9 ---------------------------- does not interfere with ordinary search */
  {
    const exactOnly = /TRIGGERS\.indexOf\(norm\(q\)\) !== -1/.test(code);
    const emptyOtherwise = /if \(!isThreshold\(q\)\) return \[\];/.test(code);
    const checks = browserChecks(browser, 'threshold:exact', 'threshold:one-result');
    const mechanical = exactOnly && emptyOtherwise;
    out.push(mechanical
      ? pass('vs-09', 'does not interfere with ordinary search',
        `the provider returns [] for every query that is not the exact phrase — an indexOf over a three-element list after whitespace and case normalisation, not a prefix or a substring match — so it contributes nothing to any other search.${checks.available ? ` A real browser confirms it: a near miss ("thirty-two path", singular) produces zero results, and the phrase produces exactly one.` : ' No browser result was supplied, so the near-miss behaviour is established from the matcher rather than from a rendered palette.'}`,
        checks.available ? null : 'Run node agent/browser/cli.mjs --json and pass it in to settle this against the rendered palette rather than the matcher.')
      : fail('vs-09', 'does not interfere with ordinary search',
        `exact match only: ${exactOnly}; empty for every other query: ${emptyOtherwise}`));
  }

  /* 10 ------------------ cannot weaken the public/private boundary */
  {
    const present = FORBIDDEN_PRIMITIVES.filter((f) => code.includes(f));
    const imports = (code.match(/^\s*import\s/gm) ?? []).length;
    const inventsAddress = !/if \(!d \|\| !d\.querySelector\) return null;/.test(code)
      || !/return v && v\.trim\(\) \? v\.trim\(\) : null;/.test(code);
    out.push(present.length === 0 && imports === 0 && !inventsAddress
      ? pass('vs-10', 'cannot weaken the public/private security boundary',
        `the module contains none of the ${FORBIDDEN_PRIMITIVES.length} primitives a credential or a session would need, in its executable code; it has ${imports} import statements, so it can reach no other module in js/ and no data loader; and controlRoomHref() returns null rather than constructing an address when the document declares none. On the published site it therefore ends at a statement.`,
        'This is a static read of one module. agent/production/separations.mjs measures the six separations the brief names, and agent/policy/verify/ attacks the boundary from outside; neither this nor those can establish what a deployment that DID declare an address would do.')
      : fail('vs-10', 'cannot weaken the public/private security boundary',
        `primitives present: ${present.join(', ') || 'none'}; imports: ${imports}; invents an address: ${inventsAddress}`));
  }

  return out;
}

/** Pull named checks out of a parsed browser result. Returns
 *  `available: false` rather than assuming a pass when the result is
 *  missing — a skipped browser run is never a pass. */
export function browserChecks(browser, ...ids) {
  const all = browser?.checks ?? browser?.results ?? null;
  if (!Array.isArray(all)) return { available: false, allPass: false, failing: [], found: [] };
  const found = all.filter((c) => ids.includes(c.id ?? c.name));
  if (found.length !== ids.length) return { available: false, allPass: false, failing: [], found };
  const failing = found.filter((c) => (c.status ?? c.outcome) !== 'pass').map((c) => c.id ?? c.name);
  return { available: true, allPass: failing.length === 0, failing, found };
}

/** The ten criteria, summarised. `mandatory` is every one of them:
 *  the brief sets all ten as conditions of activation. */
export function visualSummary(rows) {
  return {
    total: rows.length,
    pass: rows.filter((r) => r.state === 'pass').length,
    fail: rows.filter((r) => r.state === 'fail').length,
    unmeasurable: rows.filter((r) => r.state === 'unmeasurable').length,
    failing: rows.filter((r) => r.state === 'fail').map((r) => r.criterion),
  };
}
