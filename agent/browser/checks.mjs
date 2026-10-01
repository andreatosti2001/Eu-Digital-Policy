/* ============================================================
   agent/browser/checks.mjs — the fifteen things SESSION 19 names,
   asked of a page that is actually open

   Every check here answers a question NOTHING ELSE IN THIS
   REPOSITORY CAN ANSWER. That is the selection rule, and it is worth
   stating because the temptation is to re-implement `design-qa.mjs`
   in a browser and call the duplication coverage:

     · `tools/design-qa.mjs` reads the markup. It can see that
       `instruments.html` contains `<div id="dnaTable">`. It cannot
       see whether anything ever put a table in it.
     · `tools/i18n-audit.mjs` compares the register against the
       markup. It cannot see what the DOM says after a reader picks
       Italian.
     · `agent/ux/` reads the source and says so in twelve open
       questions. docs/UX-AUDIT.md §7 lists them; several of them are
       closed by opening the page, and this file is the first thing
       here that opens one.

   WHAT A CHECK MAY CONCLUDE. A check returns pass, fail, or
   `undecidable` with the reason. `undecidable` is a first-class
   result for the same reason `absent` is a first-class evidence kind
   in agent/schemas/common.mjs: a check that cannot establish its
   subject must say so rather than pass by default. `runner.mjs`
   counts undecidables separately and never folds them into the pass
   count.

   WHAT NONE OF THEM MAY DO. Since 27 Sep 2026 checkContrast computes
   WCAG contrast ratios — from COMPUTED colours, not rendered pixels —
   and no check reports a screen-reader announcement. A headless
   Chromium can report a computed colour; it cannot tell you what a
   person with low vision sees, and NVDA is not installed here. README limitation
   7 stands, and `runner.mjs` carries it on every run.
   ============================================================ */

import { serveSite, REPO_ROOT } from './serve.mjs';
import { sleep } from './cdp.mjs';

/** The six top-level pages, plus one instrument page. Since 27 Sep 2026
 *  an instrument is served at instruments/<id>/, pre-rendered;
 *  instrument.html?id=… forwards there, and checkSeo measures that. */
export const PAGES = [
  { file: 'index.html', name: 'the brief', main: 'body' },
  { file: 'instruments.html', name: 'the comparison', main: '#dnaTable' },
  { file: 'institutions.html', name: 'the institutional map', main: '#imBody' },
  { file: 'enforcement.html', name: 'the enforcement register', main: '#enfList' },
  { file: 'applies.html', name: 'the applicability tool', main: '#ap-results' },
  { file: 'bibliography.html', name: 'the evidence and sources view', main: '#bib' },
  { file: 'instruments/gdpr/', name: 'one instrument, in full', main: '#instrumentPage' },
];

/** A page is "rendered" when its mount point no longer holds the
 *  loading fallback the markup ships. Checking for the ABSENCE of
 *  the fallback rather than the presence of content is deliberate:
 *  it is the one condition that cannot be satisfied by a renderer
 *  that wrote an error message into the same element. */
export const FALLBACK_TEXT = ['Loading the', 'Loading…', 'mount-fallback'];

const ok = (id, area, summary, data = {}) => ({ id, area, status: 'pass', summary, data });
const bad = (id, area, summary, data = {}) => ({ id, area, status: 'fail', summary, data });
const undecidable = (id, area, summary, why, data = {}) => ({ id, area, status: 'undecidable', summary, why, data });

/* ============================================================
   1 · every major page loads
   ============================================================ */

export async function checkPageLoads(page, origin, spec) {
  const url = `${origin}/${spec.file}`;
  const before = page.console.length;
  await page.goto(url);

  const state = await page.evaluate(`(() => {
    const main = document.querySelector(${JSON.stringify(spec.main)});
    return {
      title: document.title,
      h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim()),
      mainFound: !!main,
      mainText: main ? main.textContent.trim().slice(0, 400) : null,
      mainChildren: main ? main.children.length : 0,
      bodyChars: document.body.textContent.trim().length,
      lang: document.documentElement.getAttribute('lang'),
    };
  })()`);

  const results = [];
  const area = 'page-load';

  results.push(state.title ? ok(`load:${spec.file}:title`, area, `${spec.name} has a title`, { title: state.title })
    : bad(`load:${spec.file}:title`, area, `${spec.file} rendered with no document title`));

  results.push(state.h1.length === 1
    ? ok(`load:${spec.file}:h1`, area, `${spec.name} renders exactly one h1`, { h1: state.h1[0] })
    : bad(`load:${spec.file}:h1`, area, `${spec.file} rendered ${state.h1.length} h1 elements`, { h1: state.h1 }));

  if (!state.mainFound) {
    results.push(bad(`load:${spec.file}:mount`, area, `${spec.file} has no ${spec.main} in the rendered DOM`));
  } else {
    const stillLoading = FALLBACK_TEXT.some((t) => (state.mainText ?? '').startsWith(t));
    results.push(stillLoading || state.bodyChars < 200
      ? bad(`load:${spec.file}:mount`, area, `${spec.name} never rendered: ${spec.main} still holds the loading fallback`, { text: state.mainText })
      : ok(`load:${spec.file}:mount`, area, `${spec.name} rendered into ${spec.main}`, { chars: state.bodyChars, children: state.mainChildren }));
  }

  /* Console errors, scoped to this navigation. A page that renders
     and throws is not a page that works. */
  const fresh = page.console.slice(before);
  const errors = fresh.filter((c) => c.level === 'error');
  results.push(errors.length === 0
    ? ok(`console:${spec.file}`, 'console', `${spec.name} logged no console error`)
    : bad(`console:${spec.file}`, 'console', `${spec.name} logged ${errors.length} console error(s)`, { errors: errors.slice(0, 8) }));

  /* Content-Security-Policy refusals, recorded in the page by cdp.mjs
     Page.init. The policy has had no 'unsafe-inline' for styles since
     27 Sep 2026, so a style attribute that reaches the DOM is refused
     and the element renders without it — visible to no other check. */
  const csp = (await page.evaluate('window.__cspViolations || null')) ?? null;
  results.push(csp === null
    ? undecidable(`csp:${spec.file}`, 'console', `${spec.name}: CSP refusals could not be read`, 'the violation recorder was not installed in this page')
    : csp.length === 0
      ? ok(`csp:${spec.file}`, 'console', `${spec.name}: the Content-Security-Policy refused nothing`)
      : bad(`csp:${spec.file}`, 'console', `${spec.name}: the Content-Security-Policy refused ${csp.length} thing(s)`, { violations: csp.slice(0, 8) }));

  const thrown = page.exceptions.length;
  results.push(thrown === 0
    ? ok(`exception:${spec.file}`, 'console', `${spec.name} threw no uncaught exception`)
    : bad(`exception:${spec.file}`, 'console', `${spec.name} threw ${thrown} uncaught exception(s)`, { exceptions: page.exceptions.slice(0, 5) }));

  return results;
}

/* ============================================================
   2 · navigation — and the finding agent/ux/ could only suspect

   docs/UX-AUDIT.md finding 3 is that five of the seven pages are
   linked from no markup anywhere: `js/shell.js` builds the nav at
   runtime. Reading the source establishes the links are not IN the
   markup. Only a browser can establish whether they arrive, and
   whether they arrive for a reader with scripting off — which is the
   half that finding says a reader can meet today.
   ============================================================ */

export const NAV_FILES = ['index.html', 'instruments.html', 'institutions.html', 'enforcement.html', 'applies.html', 'bibliography.html'];

export async function checkNavigation(page, origin) {
  const results = [];
  await page.goto(`${origin}/instruments.html`);

  const nav = await page.evaluate(`(() => {
    const hrefs = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
    return {
      hrefs,
      hasHeader: !!document.querySelector('header'),
      brand: !!document.querySelector('.chrome-brand'),
      skip: !!document.querySelector('a.skip-link'),
      current: document.querySelector('[aria-current]')?.getAttribute('href') ?? null,
    };
  })()`);

  const missing = NAV_FILES.filter((f) => !nav.hrefs.some((h) => h && h.split('#')[0].split('?')[0] === f));
  results.push(missing.length === 0
    ? ok('nav:links', 'navigation', `every one of the ${NAV_FILES.length} top-level pages is reachable from the rendered chrome`, { current: nav.current })
    : bad('nav:links', 'navigation', `${missing.join(', ')} is not linked from the rendered chrome`, { missing, hrefs: nav.hrefs.slice(0, 20) }));

  results.push(nav.skip
    ? ok('nav:skip', 'accessibility', 'the skip link is present in the rendered page')
    : bad('nav:skip', 'accessibility', 'no a.skip-link in the rendered page'));

  /* The half that matters to a reader with scripting off. This is a
     measurement, not a reading of the source: the same page is
     loaded with JavaScript disabled and asked the same question. */
  const noScript = await page.browser.newPage();
  try {
    await noScript.send('Emulation.setScriptExecutionDisabled', { value: true });
    await noScript.goto(`${origin}/instruments.html`, { settleMs: 250 });
    const off = await noScript.evaluate(`(() => ({
      links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')),
      noscript: [...document.querySelectorAll('noscript')].map(n => n.textContent.trim().slice(0, 600)),
    }))()`);
    const reachable = NAV_FILES.filter((f) => off.links.some((h) => h && h.split('#')[0].split('?')[0] === f));
    const noscriptMentionsNav = off.noscript.some((t) => /navigat|menu|links? between|other pages/i.test(t));

    results.push(reachable.length === 0 && !noscriptMentionsNav
      ? bad('nav:noscript', 'navigation', `with scripting off, instruments.html links to none of the ${NAV_FILES.length} top-level pages, and its <noscript> notice does not say navigation is among what will not appear`, { reachable, noscript: off.noscript })
      : ok('nav:noscript', 'navigation', `with scripting off, ${reachable.length} top-level page(s) are reachable${noscriptMentionsNav ? ' and the noscript notice names navigation' : ''}`, { reachable }));
  } finally {
    await noScript.close();
  }

  return results;
}

/* ============================================================
   3 · internal links — every one, followed
   ============================================================ */

export async function checkInternalLinks(page, origin, { pages = PAGES } = {}) {
  const seen = new Map();   // path -> status
  const broken = [];
  let followed = 0;

  for (const spec of pages) {
    await page.goto(`${origin}/${spec.file}`);
    const hrefs = await page.evaluate(`(() => [...new Set(
      [...document.querySelectorAll('a[href]')]
        .map(a => a.getAttribute('href'))
        .filter(h => h && !/^(https?:|mailto:|tel:|javascript:|#)/.test(h))
    )])()`);

    for (const href of hrefs) {
      const path = href.split('#')[0].split('?')[0];
      if (!path) continue;
      if (seen.has(path)) continue;
      const res = await fetch(`${origin}/${path.replace(/^\.?\//, '')}`, { method: 'HEAD' });
      seen.set(path, res.status);
      followed++;
      if (res.status >= 400) broken.push({ from: spec.file, href, status: res.status });
    }
  }

  return [broken.length === 0
    ? ok('links:internal', 'links', `${followed} distinct internal link target(s) followed across ${pages.length} pages; every one resolves`, { followed })
    : bad('links:internal', 'links', `${broken.length} internal link(s) do not resolve`, { broken })];
}

/* ============================================================
   4 · search — the command palette
   ============================================================ */

export async function checkSearch(page, origin) {
  const results = [];
  await page.goto(`${origin}/enforcement.html`);

  /* Opened by the keyboard, the way the shortcuts card says it is.
     Clicking the button would also work and would test less: the
     "/" binding lives in js/palette.js and nothing else exercises it.

     NO `text` HERE, and that is not a detail. A keyDown carrying text
     types the character as well as firing the binding, so the first
     draft of this check opened the palette and then typed "/" into
     the input it had just focused — and reported a working search as
     returning nothing for "/gdpr". See docs/BROWSER-QA.md §7. */
  await page.key('/', { code: 'Slash', keyCode: 191 });
  const opened = await page.waitFor(`(() => {
    const p = document.querySelector('[role=dialog]');
    return p && getComputedStyle(p).display !== 'none' ? true : null;
  })()`, { timeoutMs: 4000 });

  if (!opened) {
    results.push(bad('search:open', 'search', 'pressing "/" did not open a dialog on enforcement.html'));
    return results;
  }
  results.push(ok('search:open', 'search', 'pressing "/" opens the search palette'));

  const focused = await page.evaluate(`(() => {
    const a = document.activeElement;
    return a ? { tag: a.tagName, type: a.getAttribute('type'), role: a.getAttribute('role') } : null;
  })()`);
  results.push(focused && focused.tag === 'INPUT'
    ? ok('search:focus', 'search', 'the palette takes focus into its input when it opens', focused)
    : bad('search:focus', 'search', 'the palette opened without moving focus into an input', { focused }));

  await page.type('gdpr');
  const hits = await page.waitFor(`(() => {
    const r = document.querySelectorAll('[role=option], .cmdk-item, #cmdkResults li, #cmdkResults a');
    return r.length ? r.length : null;
  })()`, { timeoutMs: 6000 });

  results.push(hits
    ? ok('search:results', 'search', `typing "gdpr" produces ${hits} result(s)`, { hits })
    : bad('search:results', 'search', 'typing "gdpr" produced no visible result in the palette'));

  await page.key('Escape', { code: 'Escape', keyCode: 27 });
  const closed = await page.waitFor(`(() => {
    const p = document.querySelector('[role=dialog]');
    return (!p || getComputedStyle(p).display === 'none') ? true : null;
  })()`, { timeoutMs: 3000 });
  results.push(closed
    ? ok('search:escape', 'dialogs', 'Escape closes the palette')
    : bad('search:escape', 'dialogs', 'Escape did not close the palette'));

  return results;
}

/* The brief's own index — its contents, pagers and prose search — is
   read by app.js out of the markup it is loaded into. Until 30 Sep 2026 it
   came from window.__CONTENT__, an inline copy with no generator that had
   lost Annex C and ~9 KB of the current prose, so search could not find
   what the page said (docs/CURRENT-ARCHITECTURE.md §8). This measures the
   index against the page in the browser, through the provider js/palette.js
   calls, rather than against any copy of it: every Part listed in order,
   every title the heading a reader sees, the LAST paragraph of every Part
   findable, and every pager naming the heading it leads to. */
export async function checkBriefIndex(page, origin) {
  const results = [];
  await page.goto(`${origin}/index.html`);
  const r = await page.evaluate(`(() => {
    const search = window.__EU_PROSE_SEARCH__;
    if (typeof search !== 'function') return { provider: false };
    const secs = [...document.querySelectorAll('section.part')];
    const heads = secs.map((s) => ({ id: s.id, title: (s.querySelector('.part-head h2')?.textContent ?? '').replace(/\\s+/g, ' ').trim() }));
    const listed = (search('')[0]?.items ?? []).map((i) => ({ id: i.id, title: i.title }));
    /* a phrase from the last paragraph of each Part: words 2–8, so
       the query is prose and not the first word of a heading */
    const unfound = [];
    for (const s of secs) {
      const ps = [...s.querySelectorAll('.part-body p')].map((p) => p.textContent.replace(/\\s+/g, ' ').trim()).filter((t) => t.split(' ').length >= 10);
      if (!ps.length) continue;
      const q = ps[ps.length - 1].split(' ').slice(1, 8).join(' ');
      const hit = search(q).some((g) => g.kind === 'passage' && g.items.some((i) => i.id === s.id));
      if (!hit) unfound.push({ id: s.id, query: q });
    }
    const pagers = secs.map((s, i) => {
      const next = s.querySelector('.pager .pg.next b');
      const want = secs[i + 1] ? heads[i + 1].title.split(':')[0] : null;
      return { id: s.id, pagers: s.querySelectorAll('.pager').length, next: next ? next.textContent : null, want };
    }).filter((x) => x.pagers !== 1 || x.next !== x.want);
    return { provider: true, heads, listed, unfound, pagers, blob: typeof window.__CONTENT__ !== 'undefined' };
  })()`);

  if (!r?.provider) {
    results.push(bad('search:brief-index', 'search', 'index.html exposes no prose search provider (window.__EU_PROSE_SEARCH__)'));
    return results;
  }
  const same = JSON.stringify(r.listed) === JSON.stringify(r.heads);
  results.push(same
    ? ok('search:brief-index', 'search', `the brief's search lists all ${r.heads.length} Parts, in order, under the headings the page shows`, { parts: r.heads.length })
    : bad('search:brief-index', 'search', 'the brief\'s search index does not match the Parts on the page', { listed: r.listed, page: r.heads }));
  results.push(!r.unfound.length
    ? ok('search:brief-prose', 'search', 'the last paragraph of every Part is found by the brief\'s search — the index covers the current prose', { parts: r.heads.length })
    : bad('search:brief-prose', 'search', `${r.unfound.length} Part(s) whose own last paragraph search does not find`, { unfound: r.unfound }));
  results.push(!r.pagers.length
    ? ok('search:brief-pagers', 'navigation', 'every Part has one pager, and it names the heading it leads to')
    : bad('search:brief-pagers', 'navigation', 'a pager is missing, doubled, or names a heading the page does not show', { pagers: r.pagers }));
  results.push(!r.blob
    ? ok('search:brief-one-home', 'search', 'no window.__CONTENT__: the index is read from the page, not from a copy of it')
    : bad('search:brief-one-home', 'search', 'window.__CONTENT__ is defined again — a second copy of the brief (docs/CURRENT-ARCHITECTURE.md §8)'));
  return results;
}

/* ============================================================
   5 · glossary
   ============================================================ */

export async function checkGlossary(page, origin) {
  const results = [];
  await page.goto(`${origin}/index.html`);

  const terms = await page.evaluate(`(() => document.querySelectorAll('[data-gloss], .gloss, a[href^="#gloss-"]').length)()`);
  if (!terms) {
    results.push(undecidable('glossary:terms', 'glossary',
      'no glossary term marker was found in the rendered brief',
      'The check looks for [data-gloss], .gloss and a[href^="#gloss-"]. If the brief marks its terms another way, this check is looking for the wrong thing and reports that rather than reporting an absence.'));
    return results;
  }
  results.push(ok('glossary:terms', 'glossary', `${terms} glossary term marker(s) in the rendered brief`, { terms }));

  const opened = await page.evaluate(`(() => {
    const t = document.querySelector('[data-gloss], .gloss, a[href^="#gloss-"]');
    if (!t) return null;
    t.click();
    return true;
  })()`);
  if (!opened) { results.push(bad('glossary:open', 'glossary', 'the first glossary term could not be clicked')); return results; }

  const shown = await page.waitFor(`(() => {
    const pop = document.querySelector('.gloss-pop, #gpanel.open, #gpanel[aria-hidden=false], .gpanel.show');
    if (pop && getComputedStyle(pop).display !== 'none') return pop.textContent.trim().slice(0, 200);
    const panel = document.getElementById('gpanel');
    if (panel && getComputedStyle(panel).display !== 'none' && panel.textContent.trim()) return panel.textContent.trim().slice(0, 200);
    return null;
  })()`, { timeoutMs: 4000 });

  results.push(shown
    ? ok('glossary:open', 'glossary', 'clicking a glossary term shows a definition', { text: shown })
    : bad('glossary:open', 'glossary', 'clicking a glossary term showed no definition popover or panel'));

  return results;
}

/* ============================================================
   6 · comparison views · 7 · evidence interfaces · 8 · applicability
   · 9 · representative instrument views

   One shape, four subjects: render the page, then assert the thing
   the page exists to produce is actually there and is not a zero.
   "0 rows" and "the renderer never ran" look identical to a check
   that only asserts the mount point is non-empty.
   ============================================================ */

export async function checkComparison(page, origin) {
  await page.goto(`${origin}/instruments.html`);
  const s = await page.evaluate(`(() => {
    const t = document.querySelector('#dnaTable');
    return {
      rows: t ? t.querySelectorAll('tr, .dna-row').length : 0,
      cols: t ? t.querySelectorAll('th, .dna-head').length : 0,
      instrumentToggles: document.querySelectorAll('#dnaInstruments input, #dnaInstruments button, #dnaInstruments label').length,
      dimensionToggles: document.querySelectorAll('#dnaDimensions input, #dnaDimensions button, #dnaDimensions label').length,
      stats: (document.querySelector('#dnaStats')?.textContent ?? '').trim().slice(0, 160),
    };
  })()`);

  const out = [s.rows > 1 && s.cols > 1
    ? ok('compare:table', 'comparison', `the regulatory DNA table renders ${s.rows} row(s) across ${s.cols} column heading(s)`, s)
    : bad('compare:table', 'comparison', 'the regulatory DNA table rendered no comparable grid', s)];

  out.push(s.instrumentToggles > 0 && s.dimensionToggles > 0
    ? ok('compare:controls', 'comparison', `${s.instrumentToggles} instrument control(s) and ${s.dimensionToggles} dimension control(s) rendered`, s)
    : bad('compare:controls', 'comparison', 'the comparison rendered without its instrument or dimension controls', s));

  /* Toggling a dimension must change the table. A control that
     renders and does nothing is the failure a static read cannot
     see at all. */
  const changed = await page.evaluate(`(() => {
    const t = document.querySelector('#dnaTable');
    const before = t ? t.textContent.length : 0;
    const c = document.querySelector('#dnaDimensions input, #dnaDimensions button, #dnaDimensions label');
    if (!c) return null;
    c.click();
    return { before, after: (document.querySelector('#dnaTable')?.textContent ?? '').length };
  })()`);
  out.push(changed && changed.before !== changed.after
    ? ok('compare:interactive', 'interaction', 'toggling a dimension changes the rendered table', changed)
    : undecidable('compare:interactive', 'interaction',
      'toggling the first dimension control did not change the table text length',
      'A control may legitimately be already-off, or may change the table without changing its character count. This check cannot separate those from a dead control, so it reports undecidable rather than a defect.', { changed }));

  return out;
}

export async function checkEvidence(page, origin) {
  await page.goto(`${origin}/bibliography.html`);
  const s = await page.evaluate(`(() => ({
    entries: document.querySelectorAll('#bib li, #bib .bib-item, #bib article').length,
    grades: document.querySelectorAll('#bibGrades li').length,
    stats: (document.querySelector('#bibStats')?.textContent ?? '').trim().slice(0, 200),
    self: (document.querySelector('#bibSelf')?.textContent ?? '').trim().slice(0, 200),
  }))()`);

  const out = [s.entries > 0
    ? ok('evidence:entries', 'evidence', `the bibliography renders ${s.entries} entr(ies)`, s)
    : bad('evidence:entries', 'evidence', 'the bibliography rendered no entries', s)];

  out.push(s.self && s.self !== 'Counting…'
    ? ok('evidence:self', 'evidence', 'the self-citation count resolved', { self: s.self })
    : bad('evidence:self', 'evidence', 'the self-citation line never resolved past its placeholder', { self: s.self }));

  out.push(s.grades > 0
    ? ok('evidence:grades', 'evidence', `${s.grades} evidence grade(s) rendered — the grades are derived at render time, so an empty list here means the derivation did not run`, s)
    : bad('evidence:grades', 'evidence', 'no evidence grades rendered', s));

  return out;
}

export async function checkApplicability(page, origin) {
  await page.goto(`${origin}/applies.html`);
  const built = await page.evaluate(`(() => ({
    boxes: document.querySelectorAll('#ap-form input[type=checkbox]').length,
    ruleCount: (document.querySelector('#ap-rulecount')?.textContent ?? '').trim(),
    limits: document.querySelectorAll('#ap-limits li').length,
    results: (document.querySelector('#ap-results')?.textContent ?? '').trim().slice(0, 200),
  }))()`);

  const out = [built.boxes > 0
    ? ok('applies:form', 'applicability', `the situation form renders ${built.boxes} option(s)`, built)
    : bad('applies:form', 'applicability', 'the applicability form rendered no options', built)];

  out.push(built.ruleCount && built.ruleCount !== '—'
    ? ok('applies:rulecount', 'applicability', `the rule count resolved to ${built.ruleCount}`, built)
    : bad('applies:rulecount', 'applicability', 'the rule count never resolved past its placeholder', built));

  out.push(built.limits > 0
    ? ok('applies:limits', 'applicability', `${built.limits} stated limitation(s) render above the tool`, built)
    : bad('applies:limits', 'applicability', 'the tool rendered without its stated limitations — docs/AI-SAFE-BOUNDARIES.md §0.7 makes those the point of the page'));

  /* THE ONE THAT MATTERS MOST ON THIS SITE. §0.5: where no rule
     matches, the answer is NOT DETERMINED, never "probably not". A
     browser is the only thing that can read what a reader is
     actually shown after selecting a combination. */
  const selected = await page.evaluate(`(() => {
    const b = document.querySelector('#ap-form input[type=checkbox]');
    if (!b) return null;
    b.click();
    return true;
  })()`);
  if (!selected) { out.push(bad('applies:answer', 'applicability', 'no option could be selected')); return out; }

  const answer = await page.waitFor(`(() => {
    const t = (document.querySelector('#ap-results')?.textContent ?? '').trim();
    return t.length > 40 ? t.slice(0, 1200) : null;
  })()`, { timeoutMs: 5000 });

  if (!answer) { out.push(bad('applies:answer', 'applicability', 'selecting an option produced no rendered answer')); return out; }

  const negative = /\bprobably not\b|\bdoes not apply\b|\bnot applicable\b|\bunlikely\b/i.test(answer);
  const notDetermined = /not determined|no rule|cannot be determined|undetermined/i.test(answer);
  out.push(negative && !notDetermined
    ? bad('applies:answer', 'applicability', 'the rendered answer reads as a negative finding without a NOT DETERMINED qualifier — AI-SAFE-BOUNDARIES §0.5 calls presenting absence of knowledge as a negative finding the single most damaging thing this tool could do', { answer: answer.slice(0, 600) })
    : ok('applies:answer', 'applicability', 'the rendered answer does not present an absence of a matching rule as a negative finding', { chars: answer.length }));

  return out;
}

export async function checkInstrumentView(page, origin, id = 'gdpr') {
  await page.goto(`${origin}/instruments/${id}/`);
  await sleep(400);
  const s = await page.evaluate(`(() => {
    const m = document.querySelector('#instrumentPage');
    return {
      chars: m ? m.textContent.trim().length : 0,
      headings: m ? m.querySelectorAll('h2, h3').length : 0,
      title: document.title,
      dates: m ? m.querySelectorAll('time, .date, [data-date]').length : 0,
    };
  })()`);

  const out = [s.chars > 400 && s.headings > 0
    ? ok(`instrument:${id}`, 'instrument-view', `instruments/${id}/ renders ${s.chars} characters under ${s.headings} heading(s)`, s)
    : bad(`instrument:${id}`, 'instrument-view', `instruments/${id}/ rendered almost nothing`, s)];

  /* An unknown id must not render a plausible-looking empty
     instrument. */
  await page.goto(`${origin}/instrument.html?id=not-an-instrument`);
  await sleep(400);
  const missing = await page.evaluate(`(() => (document.querySelector('#instrumentPage')?.textContent ?? '').trim().slice(0, 300))()`);
  out.push(/not|unknown|no such|choose|select/i.test(missing)
    ? ok('instrument:unknown', 'instrument-view', 'an unknown instrument id renders a stated absence rather than an empty page', { text: missing.slice(0, 160) })
    : bad('instrument:unknown', 'instrument-view', 'an unknown instrument id renders no explanation', { text: missing.slice(0, 160) }));

  return out;
}

/* ============================================================
   9b · what a crawler is told, measured against what renders

   tools/seo-audit.mjs reads the HTML as served and cannot run a
   script. These checks load the same pages in a browser and ask the
   question it cannot: after every module has run, does the page still
   say what its HTML said — the same title, the same canonical, the same
   <h1>, the same sections, structured data that parses and names the
   URL in the address bar? docs/SEO-AUDIT-2026-09-27.md A1 was exactly a
   page whose answer changed after load. And the address every instrument
   used to have must still work: forward to the instrument's own page,
   keep the fragment, and mark a record too thin for a page noindex.
   ============================================================ */

export const SEO_PAGES = ['', 'instruments.html', 'instruments/ai-act/', 'instruments/gdpr/', 'instruments/dsa/',
  'instruments/dma/', 'enforcement.html', 'applies.html', 'bibliography.html', 'institutions.html'];

const rawSeo = (html) => {
  const visible = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [, ''])[1]
    .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<noscript[\s\S]*?<\/noscript>/g, ' ');
  return {
    title: ((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').replace(/&amp;/g, '&').trim(),
    canonical: (html.match(/<link href="([^"]+)" rel="canonical"\/>/) || [])[1] || null,
    h1: [...visible.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim()),
    h2: [...visible.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim()),
    text: visible.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length,
  };
};

async function waitFor(page, expr, ms = 6000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await page.evaluate(expr)) return true;
    await sleep(100);
  }
  return false;
}

export async function checkSeo(page, origin, { pages = SEO_PAGES } = {}) {
  const out = [];
  const area = 'seo';
  for (const file of pages) {
    const name = file || 'index';
    const raw = rawSeo(await (await fetch(`${origin}/${file}`)).text());
    await page.goto(`${origin}/${file}`);
    await sleep(file.startsWith('instruments/') ? 700 : 300);
    const r = await page.evaluate(`(() => {
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
        try { return JSON.parse(s.textContent); } catch (e) { return { error: String(e) }; } });
      return {
        title: document.title,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
        robots: document.querySelector('meta[name="robots"]')?.content ?? null,
        description: document.querySelector('meta[name="description"]')?.content ?? null,
        h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
        h2: [...document.querySelectorAll('main h2, .page-shell h2, .tool-shell h2, .bib-shell h2')].map((h) => h.textContent.trim()),
        crumbs: [...document.querySelectorAll('.crumbs li')].map((li) => li.textContent.trim()),
        ld,
        entityLinks: [...document.querySelectorAll('a[href]')].filter((a) => /^(\\.\\.\\/)*instruments\\/[a-z0-9-]+\\/$/.test(a.getAttribute('href') || '')).length,
      };
    })()`);
    const same = r.title === raw.title && r.canonical === raw.canonical && r.h1.length === 1 && r.h1[0] === raw.h1[0];
    out.push(same && !r.robots
      ? ok(`seo:${name}:stable`, area, `${name}: title, canonical and <h1> are the same before and after scripts run`, { title: r.title, canonical: r.canonical })
      : bad(`seo:${name}:stable`, area, `${name}: what the HTML declares changed after load, or the page is noindex`, { raw, rendered: { title: r.title, canonical: r.canonical, h1: r.h1, robots: r.robots } }));

    const docs = r.ld;
    const graph = docs.length === 1 && docs[0]['@graph'] ? docs[0]['@graph'] : null;
    const pg = graph && graph.find((x) => x['@id'] && x['@id'].endsWith('#page'));
    const bc = graph && graph.find((x) => x['@type'] === 'BreadcrumbList');
    const bcNames = bc ? bc.itemListElement.map((x) => x.name) : [];
    const crumbsOk = file === '' ? !bc : (bc && bcNames.join(' > ') === r.crumbs.join(' > '));
    out.push(graph && pg && pg.url === r.canonical && pg.name === r.title && pg.description === r.description && crumbsOk
      ? ok(`seo:${name}:structured-data`, area, `${name}: JSON-LD parses, names this URL, title and description, and its breadcrumb is the visible one`)
      : bad(`seo:${name}:structured-data`, area, `${name}: structured data does not match the rendered page`, { ld: docs.map((d) => d.error || (d['@graph'] || []).map((x) => x['@type'])), crumbs: r.crumbs, bcNames }));

    if (file.startsWith('instruments/')) {
      /* the static page and the rendered page carry the same sections */
      const sections = raw.h2.join(' | ') === r.h2.join(' | ');
      out.push(sections && raw.text > 3000
        ? ok(`seo:${name}:static`, area, `${name}: ${raw.text} characters and the same ${raw.h2.length} sections are in the HTML before any script runs`)
        : bad(`seo:${name}:static`, area, `${name}: the HTML as served lacks the substance the rendered page has`, { rawH2: raw.h2, renderedH2: r.h2, rawText: raw.text }));
    }
    if (file === '') {
      out.push(r.entityLinks >= 5
        ? ok('seo:index:entity-links', area, `the home page links to ${r.entityLinks} instrument pages by plain <a href>`)
        : bad('seo:index:entity-links', area, `the home page links to only ${r.entityLinks} instrument page(s)`));
    }
  }

  /* the old addresses */
  await page.goto(`${origin}/instrument.html?id=dsa#sec-enforcement`);
  const fwd = await waitFor(page, `location.pathname.endsWith('/instruments/dsa/') && location.hash === '#sec-enforcement'`);
  const landed = await page.evaluate('location.pathname + location.search + location.hash');
  out.push(fwd
    ? ok('seo:compat:forward', area, 'instrument.html?id=dsa#sec-enforcement forwards to instruments/dsa/ and keeps the fragment', { landed })
    : bad('seo:compat:forward', area, 'instrument.html?id=… does not forward to the instrument\'s own page', { landed }));

  await page.goto(`${origin}/instrument.html?id=eprivacy`);
  const thinOk = await waitFor(page, `document.querySelector('meta[name="robots"]')?.content === 'noindex, follow' && !document.querySelector('link[rel="canonical"]') && document.querySelectorAll('h1').length === 1`);
  out.push(thinOk
    ? ok('seo:compat:thin', area, 'a record below the gate still renders at instrument.html?id=…, marked noindex with no canonical')
    : bad('seo:compat:thin', area, 'a thin record is not rendered, or not marked noindex'));

  await page.goto(`${origin}/instrument.html`);
  const chooser = await waitFor(page, `location.pathname.endsWith('/instruments.html') && location.hash === '#instrument-records'`);
  out.push(chooser
    ? ok('seo:compat:chooser', area, 'instrument.html with no id forwards to the list of instrument pages')
    : bad('seo:compat:chooser', area, 'instrument.html with no id does not reach the instrument list'));

  /* one instrument page, as a reader meets it: keyboard first, both themes, a phone */
  await page.goto(`${origin}/instruments/ai-act/`);
  await sleep(700);
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  const first = await page.evaluate(`(() => { const a = document.activeElement; return { cls: a && a.className, href: a && a.getAttribute('href') }; })()`);
  out.push(first.cls === 'skip-link' && first.href === '#instrumentPage'
    ? ok('seo:ai-act:keyboard', area, 'on an instrument page the first Tab reaches the skip link, which targets the pre-rendered view')
    : bad('seo:ai-act:keyboard', area, 'the first Tab on an instrument page does not reach the skip link', first));

  const themes = [];
  for (const t of ['light', 'dark']) {
    await page.evaluate(`document.body.dataset.theme = '${t}'`);
    await sleep(900); /* the page ground transitions between palettes */
    themes.push(await page.evaluate(`(() => {
      const cs = getComputedStyle(document.body); const h = getComputedStyle(document.querySelector('h1'));
      return { t: '${t}', bg: cs.backgroundColor, ink: h.color }; })()`));
  }
  out.push(themes[0].bg !== themes[1].bg && themes.every((x) => x.bg !== x.ink)
    ? ok('seo:ai-act:themes', area, 'the instrument page renders in both themes with the heading distinct from the ground', { themes })
    : bad('seo:ai-act:themes', area, 'the instrument page does not change with the theme, or its heading matches its ground', { themes }));

  await page.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  try {
    await page.goto(`${origin}/instruments/ai-act/`);
    await sleep(700);
    const m = await page.evaluate('({ sw: document.documentElement.scrollWidth, w: innerWidth, h1: document.querySelector("h1")?.getBoundingClientRect().width || 0 })');
    out.push(m.sw <= m.w + 1 && m.h1 > 0
      ? ok('seo:ai-act:phone', area, 'the instrument page fits a 390px phone without sideways scrolling', m)
      : bad('seo:ai-act:phone', area, 'the instrument page scrolls sideways on a 390px phone', m));
  } finally {
    await page.send('Emulation.clearDeviceMetricsOverride');
  }
  return out;
}

/* ============================================================
   10 · language switching

   `tools/i18n-audit.mjs` compares the register against the markup.
   What it cannot do is pick Italian and read the result — and the
   superseded-translation hazard in AGENTS.md is exactly a hazard
   about what a reader is shown after they do.
   ============================================================ */

export async function checkLanguageSwitching(page, origin) {
  const out = [];
  await page.goto(`${origin}/index.html`);

  const menu = await page.evaluate(`(() => {
    const btn = document.getElementById('langToggle');
    const menu = document.getElementById('langMenu');
    if (!btn || !menu) return null;
    btn.click();
    return {
      options: [...menu.querySelectorAll('li[data-lang]')].map(li => li.dataset.lang),
      expanded: btn.getAttribute('aria-expanded'),
    };
  })()`);

  if (!menu) {
    out.push(bad('lang:menu', 'localization', 'no language control (#langToggle / #langMenu) in the rendered brief'));
    return out;
  }
  out.push(menu.options.length > 1
    ? ok('lang:menu', 'localization', `the language menu offers ${menu.options.join(', ')}`, menu)
    : bad('lang:menu', 'localization', 'the language menu rendered fewer than two languages', menu));

  const target = menu.options.find((c) => c && c !== 'en');
  if (!target) { out.push(undecidable('lang:switch', 'localization', 'no non-English locale is offered', 'Nothing to switch to; the register may be empty at runtime.')); return out; }

  const switched = await page.evaluate(`(() => {
    const before = document.querySelectorAll('[data-i18n]').length;
    const sample = [...document.querySelectorAll('[data-i18n]')].slice(0, 12).map(el => el.innerHTML);
    const li = document.querySelector('#langMenu li[data-lang=' + JSON.stringify(${JSON.stringify(target)}) + ']')
            || [...document.querySelectorAll('#langMenu li[data-lang]')].find(l => l.dataset.lang === ${JSON.stringify(target)});
    if (!li) return null;
    (li.querySelector('button, a') || li).click();
    return { before, sample };
  })()`);

  if (!switched) { out.push(bad('lang:switch', 'localization', `the ${target} entry could not be activated`)); return out; }

  const after = await page.waitFor(`(() => {
    const lang = document.documentElement.getAttribute('lang');
    return lang === ${JSON.stringify(target)} ? {
      lang,
      changed: [...document.querySelectorAll('[data-i18n]')].slice(0, 12).map(el => el.innerHTML),
      fallbacks: document.querySelectorAll('[data-i18n-fallback]').length,
      keys: document.querySelectorAll('[data-i18n]').length,
    } : null;
  })()`, { timeoutMs: 8000 });

  if (!after) {
    out.push(bad('lang:switch', 'localization', `choosing ${target} did not set <html lang="${target}">`));
    return out;
  }

  const moved = after.changed.filter((v, i) => v !== switched.sample[i]).length;
  out.push(moved > 0
    ? ok('lang:switch', 'localization', `choosing ${target} sets lang="${target}" and rewrites ${moved} of the first 12 translated nodes`, { moved, keys: after.keys, fallbacks: after.fallbacks })
    : bad('lang:switch', 'localization', `choosing ${target} set lang="${target}" but rewrote none of the first 12 translated nodes`, after));

  /* A fallback is not a defect — `js/shell.js` marks it deliberately
     with data-i18n-fallback so a hole is visible rather than silent.
     It is REPORTED, because the count is what says how much of the
     locale is actually there. */
  out.push(ok('lang:fallbacks', 'localization',
    `${after.fallbacks} of ${after.keys} translated node(s) fell back to English in ${target} — reported, not judged: the register declares its gaps and tools/i18n-audit.mjs owns whether they are declared correctly`,
    { fallbacks: after.fallbacks, keys: after.keys, locale: target }));

  return out;
}

/* ============================================================
   11 · mobile layouts
   ============================================================ */

export const VIEWPORTS = [
  /* 320 CSS px is WCAG 2.x 1.4.10 Reflow: the width a 1280px screen
     presents at 400% zoom. Added 27 Sep 2026, when it found the
     bibliography scrolling sideways by 8px. */
  { name: 'reflow', width: 320, height: 800, mobile: true },
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'tablet', width: 820, height: 1180, mobile: true },
  { name: 'laptop', width: 1024, height: 768, mobile: false },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];

export async function checkViewports(page, origin, { pages = PAGES.slice(0, 5) } = {}) {
  const out = [];
  for (const vp of VIEWPORTS) {
    await page.setViewport(vp);
    for (const spec of pages) {
      await page.goto(`${origin}/${spec.file}`);
      const m = await page.evaluate(`(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        overflowing: [...document.querySelectorAll('body *')]
          .filter(el => el.getBoundingClientRect().right > document.documentElement.clientWidth + 2)
          .slice(0, 6)
          .map(el => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : '')).slice(0, 90)),
      }))()`);

      const overflows = m.scrollW > m.clientW + 2;
      out.push(overflows
        ? bad(`viewport:${vp.name}:${spec.file}`, 'responsive', `${spec.name} scrolls horizontally at ${vp.width}px (${m.scrollW} > ${m.clientW})`, m)
        : ok(`viewport:${vp.name}:${spec.file}`, 'responsive', `${spec.name} fits ${vp.width}px with no horizontal scroll`, { scrollW: m.scrollW, clientW: m.clientW }));
    }
  }
  await page.setViewport(VIEWPORTS[2]);
  return out;
}

/* ============================================================
   12 · keyboard navigation
   ============================================================ */

export async function checkKeyboard(page, origin) {
  const out = [];
  await page.goto(`${origin}/instruments.html`);

  /* Tab from the top. A skip link is only a bypass mechanism if it
     is the FIRST thing a keyboard reader reaches; one that comes
     after the navigation is a link to skip the navigation, placed
     after the navigation.

     `tools/design-qa.mjs` checks the skip link exists and that its
     href resolves, and in the MARKUP it is the first element in
     `<body>`. That is why this check is here and not there: the
     question is what the ORDER is after the page has rendered. */
  await page.evaluate(`(() => { if (document.activeElement) document.activeElement.blur(); })()`);
  await page.key('Tab', { code: 'Tab', keyCode: 9 });
  const first = await page.evaluate(`(() => {
    const a = document.activeElement;
    const focusables = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter(el => el.getClientRects().length || el.classList.contains('skip-link'));
    const skip = document.querySelector('a.skip-link');
    return {
      focused: a ? { tag: a.tagName, cls: String(a.className || ''), text: (a.textContent || '').trim().slice(0, 60) } : null,
      skipPresent: !!skip,
      skipIndex: skip ? focusables.indexOf(skip) : -1,
      before: skip ? focusables.slice(0, Math.max(0, focusables.indexOf(skip)))
        .map(el => (el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : '') + ' “' + (el.textContent || '').trim().slice(0, 24) + '”'))
        .slice(0, 12) : [],
    };
  })()`);

  if (!first.skipPresent) {
    out.push(bad('keyboard:skip-first', 'accessibility', 'no a.skip-link in the rendered page', first));
  } else if (first.skipIndex === 0) {
    out.push(ok('keyboard:skip-first', 'accessibility', 'the skip link is the first focusable element in the rendered page', first));
  } else {
    out.push(bad('keyboard:skip-first', 'accessibility',
      `the skip link is the ${first.skipIndex + 1}th focusable element in the RENDERED page, behind ${first.before.length} chrome control(s): a keyboard reader must tab through the navigation to reach the link that skips the navigation. The markup places it first (every page carries <a class="skip-link"> as the first element in <body>); js/shell.js inserts the chrome at document.body.firstChild, ahead of it. tools/design-qa.mjs reads the markup and cannot see this.`,
      first));
  }

  const focusables = await page.evaluate(`(() => {
    const sel = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const all = [...document.querySelectorAll(sel)].filter(el => el.getClientRects().length);
    return {
      count: all.length,
      noName: all.filter(el => !(el.textContent || '').trim()
        && !el.getAttribute('aria-label')
        && !el.getAttribute('title')
        && !el.getAttribute('aria-labelledby')
        && !(el.tagName === 'INPUT' && (el.labels || []).length))
        .slice(0, 10)
        .map(el => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/)[0] : ''))),
    };
  })()`);

  out.push(focusables.count > 5
    ? ok('keyboard:focusables', 'keyboard', `${focusables.count} focusable element(s) are reachable on the rendered page`, { count: focusables.count })
    : bad('keyboard:focusables', 'keyboard', `only ${focusables.count} focusable element(s) — the chrome may not have rendered`, focusables));

  out.push(focusables.noName.length === 0
    ? ok('keyboard:names', 'accessibility', 'every visible focusable element has an accessible name from text, aria-label, title or a label')
    : bad('keyboard:names', 'accessibility', `${focusables.noName.length} focusable element(s) have no accessible name`, focusables));

  /* A visible focus indicator. Comparing the focused computed style
     against the blurred one is the strongest thing available without
     rendering pixels — and it is stated as such rather than sold as
     a WCAG 2.4.7 result.

     THE BLUR IS LOAD-BEARING, and its absence is why this check spent
     every run reporting `undecidable` about a site that has had a focus
     ring the whole time. This function presses Tab a few lines above,
     which focuses the FIRST focusable element; `querySelector('a[href],
     button')` then returns that same element. Reading a "before" style
     off it compared a focus ring with itself, so `differs` was false by
     construction and nothing about the page could ever have changed it.
     Measured: the element examined is `a.skip-link`, it is already
     `document.activeElement`, it already matches `:focus-visible`, and
     its outline already reads `solid 2px` before `el.focus()` is called.

     Blurring first restores the comparison the check was written to
     make, and it is driven from the keyboard rather than by a bare
     programmatic focus, because `:focus-visible` — which is what
     css/tokens.css actually styles — is about how focus arrived. The
     invariant is unchanged: a keyboard reader must be able to see where
     focus is. What changed is that the check now measures it. */
  const indicator = await page.evaluate(`(() => {
    const el = document.querySelector('a[href], button');
    if (!el) return null;
    const seen = { tag: el.tagName, cls: String(el.className || ''), was_active: el === document.activeElement };
    el.blur();
    const before = getComputedStyle(el);
    const b = { outline: before.outlineStyle + ' ' + before.outlineWidth, shadow: before.boxShadow, border: before.borderColor };
    return { seen, b };
  })()`);
  if (indicator) {
    /* A real Tab, not el.focus(): the rule the site is styled against is
       :focus-visible, and that predicate asks how the focus arrived. */
    await page.key('Tab', { code: 'Tab', keyCode: 9 });
    const after = await page.evaluate(`(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName, cls: String(el.className || ''),
        focus_visible: el.matches(':focus-visible'),
        a: { outline: cs.outlineStyle + ' ' + cs.outlineWidth, shadow: cs.boxShadow, border: cs.borderColor },
      };
    })()`);
    indicator.a = after ? after.a : null;
    indicator.focused = after ? { tag: after.tag, cls: after.cls, focus_visible: after.focus_visible } : null;
    indicator.differs = Boolean(after) && JSON.stringify(indicator.b) !== JSON.stringify(after.a);
  }
  out.push(indicator && indicator.differs
    ? ok('keyboard:focus-visible', 'accessibility', 'tabbing to the first focusable element changes its computed outline, shadow or border. This is a computed-style difference, not a perceptual result: no contrast ratio was computed and no pixels were compared.', indicator)
    : undecidable('keyboard:focus-visible', 'accessibility',
      'tabbing to the first focusable element produced no change in outline, box-shadow or border-color',
      'This compares computed styles, which is not the same as establishing that a focus indicator is PERCEIVABLE. Contrast is not computed here and no pixels are compared. README limitation 7 stands.', { indicator }));

  return out;
}

/* ============================================================
   13 · dialogs and interactions
   ============================================================ */

export async function checkDialogs(page, origin) {
  const out = [];
  await page.goto(`${origin}/enforcement.html`);
  await page.key('/', { code: 'Slash', keyCode: 191 });
  const up = await page.waitFor(`(() => document.querySelector('[role=dialog]') ? true : null)()`, { timeoutMs: 4000 });
  if (!up) { out.push(bad('dialog:open', 'dialogs', 'no [role=dialog] appeared')); return out; }

  const semantics = await page.evaluate(`(() => {
    const d = document.querySelector('[role=dialog]');
    return {
      modal: d.getAttribute('aria-modal'),
      label: d.getAttribute('aria-label') || d.getAttribute('aria-labelledby'),
      inertSiblings: [...document.body.children].filter(el => el !== d && !el.contains(d) && (el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true')).length,
      topLevelSiblings: [...document.body.children].filter(el => el !== d && !el.contains(d)).length,
    };
  })()`);

  out.push(semantics.modal === 'true'
    ? ok('dialog:modal', 'dialogs', 'the dialog declares aria-modal="true"', semantics)
    : bad('dialog:modal', 'dialogs', `the dialog declares aria-modal="${semantics.modal}"`, semantics));

  out.push(semantics.label
    ? ok('dialog:label', 'dialogs', 'the dialog has an accessible name', semantics)
    : bad('dialog:label', 'dialogs', 'the dialog has neither aria-label nor aria-labelledby', semantics));

  out.push(semantics.inertSiblings > 0
    ? ok('dialog:inert', 'dialogs', `${semantics.inertSiblings} of ${semantics.topLevelSiblings} top-level sibling(s) are inert or aria-hidden while the dialog is up`, semantics)
    : bad('dialog:inert', 'dialogs', 'the background is not inert while the dialog is up — a screen reader can still reach it, and the leak is invisible to a sighted tester', semantics));

  /* Focus must not escape. Tab enough times to have left any
     reasonable trap and check where focus landed. */
  for (let i = 0; i < 25; i++) await page.key('Tab', { code: 'Tab', keyCode: 9 });
  const inside = await page.evaluate(`(() => {
    const d = document.querySelector('[role=dialog]');
    return !!(d && d.contains(document.activeElement));
  })()`);
  out.push(inside
    ? ok('dialog:trap', 'dialogs', 'focus is still inside the dialog after 25 tab presses')
    : bad('dialog:trap', 'dialogs', 'focus escaped the dialog within 25 tab presses'));

  await page.key('Escape', { code: 'Escape', keyCode: 27 });

  /* The theme control — agent/ux/ finding: two implementations, and
     only one exposes aria-pressed. Asked here of the rendered page
     rather than of the source. */
  await page.goto(`${origin}/instruments.html`);
  const theme = await page.evaluate(`(() => {
    const b = document.querySelector('.chrome-theme, [data-theme-toggle], button[aria-pressed]');
    if (!b) return null;
    const before = document.body.getAttribute('data-theme') || document.body.className;
    b.click();
    return { pressed: b.getAttribute('aria-pressed'), label: b.getAttribute('aria-label'), before, after: document.body.getAttribute('data-theme') || document.body.className };
  })()`);
  out.push(theme && theme.before !== theme.after
    ? ok('theme:toggle', 'interaction', 'the theme control changes the theme attribute on <body>', theme)
    : undecidable('theme:toggle', 'interaction',
      'the theme control was not found, or clicking it changed no attribute this check reads',
      'The check reads body[data-theme] and body.className. A theme applied another way is invisible to it.', { theme }));

  return out;
}

/* ============================================================
   14 · third-party requests, measured rather than read

   `tools/design-qa.mjs` errors on a third-party <script> or <link>
   in the markup. It cannot see a request a module makes at runtime.
   This is the same prohibition, measured at the network layer.
   ============================================================ */

export function checkNoThirdParty(page, origin) {
  const foreign = page.requests
    .map((r) => r.url)
    .filter((u) => u && !u.startsWith(origin) && !u.startsWith('data:') && !u.startsWith('blob:') && !u.startsWith('about:'));
  return [foreign.length === 0
    ? ok('network:first-party', 'network', `every one of the ${page.requests.length} request(s) THE PAGES made went to the local origin. This is a statement about the site: it is measured from Network events on the page's own session and says nothing about the browser process's own traffic, which cdp.mjs suppresses by flag and docs/BROWSER-QA.md §6.8 does not claim to have eliminated.`, { total: page.requests.length })
    : bad('network:first-party', 'network', `${foreign.length} request(s) left the origin — the site makes no third-party request and design-qa.mjs errors on one in the markup`, { foreign: [...new Set(foreign)].slice(0, 12) })];
}

/* ============================================================
   15 · basic accessibility, and the honest bound on it
   ============================================================ */

/* The accessibility tree (27 Sep 2026). What a screen reader is handed
   is not the DOM but the tree the browser computes from it: roles,
   accessible names, what is ignored. Chromium exposes that tree over CDP,
   so this reads it rather than inferring it from markup. Two questions,
   both about the tree as computed on the rendered page:
     · does every control a person can operate have a name? A button or
       link with no accessible name is announced as "button" and nothing
       else;
     · does the tree carry the main and navigation landmarks a
       screen-reader user moves by?
   It is still not a screen reader: reading order, verbosity and how a
   given reader announces a live region are outside it. */
const AX_OPERABLE = new Set(['button', 'link', 'textbox', 'searchbox', 'combobox', 'listbox', 'option',
  'checkbox', 'radio', 'menuitem', 'menuitemradio', 'menuitemcheckbox', 'tab', 'slider', 'switch', 'spinbutton']);

/* Read at a desktop and a phone width: a label hidden by a breakpoint
   drops out of the accessible name only at that breakpoint, which is how
   the Contents button came to be announced as a bare "button" on phones
   (found by this check, fixed with an aria-label, 27 Sep 2026).

   Each control's node is asked for on its own (getPartialAXTree) rather
   than serialising the whole tree: getFullAXTree stalled past its timeout
   on the brief at phone width, while the per-node query returns the same
   computed role and name in about a second for the whole page. The page
   is loaded AT each width, not resized after loading. */
const AX_WIDTHS = [{ width: 1280, height: 900, mobile: false }, { width: 390, height: 844, mobile: true }];
const AX_CANDIDATES = 'button, a[href], input, select, textarea, summary, [role=button], [role=link], [role=tab], [role=option], [role=menuitem], [role=switch], [role=checkbox], [role=radio], [role=combobox], [role=searchbox], [role=slider]';

async function axTree(page, spec, origin) {
  const role = (n) => n && n.role && n.role.value;
  const name = (n) => String((n && n.name && n.name.value) || '').trim();
  const unnamed = [];
  let operable = 0;
  const landmarks = { main: false, navigation: false };
  const before = await page.evaluate('({ width: innerWidth, height: innerHeight })');
  const axOf = async (nodeId) => ((await page.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })).nodes || [])[0];
  try {
    for (const vp of AX_WIDTHS) {
      await page.setViewport(vp);
      await page.goto(`${origin}/${spec.file}`);
      const { root } = await page.send('DOM.getDocument', { depth: 0 });
      const { nodeIds } = await page.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: AX_CANDIDATES });
      let here = 0;
      for (const id of nodeIds) {
        const n = await axOf(id);
        if (!n || n.ignored || !AX_OPERABLE.has(role(n))) continue;
        here++;
        if (name(n)) continue;
        let html = null;
        try { html = (await page.send('DOM.getOuterHTML', { nodeId: id })).outerHTML.replace(/\s+/g, ' ').slice(0, 140); } catch (e) { /* named by role and width */ }
        unnamed.push({ width: vp.width, role: role(n), html });
      }
      operable = Math.max(operable, here);
      if (vp.width === AX_WIDTHS[0].width) {
        for (const [key, sel] of [['main', 'main, [role=main]'], ['navigation', 'nav, [role=navigation]']]) {
          const { nodeIds: ids } = await page.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: sel });
          for (const id of ids) { const n = await axOf(id); if (n && !n.ignored && role(n) === key) { landmarks[key] = true; break; } }
        }
      }
    }
  } catch (e) {
    return [undecidable(`a11y:axtree:${spec.file}`, 'accessibility', `${spec.name}: the accessibility tree could not be read`, String(e.message || e))];
  } finally {
    /* the viewport the suite was in, restored so the checks that follow
       see exactly what they saw before this one existed */
    try { await page.setViewport({ width: before.width, height: before.height, mobile: before.width < 500 }); } catch (e) { /* best effort */ }
  }
  const out = [];
  out.push(operable === 0
    ? undecidable(`a11y:axnames:${spec.file}`, 'accessibility', `${spec.name}: no operable control in the accessibility tree`, 'a page with nothing to operate cannot show that its controls are named')
    : unnamed.length === 0
      ? ok(`a11y:axnames:${spec.file}`, 'accessibility', `${spec.name}: every operable control in the accessibility tree has a name, at 1280px and at 390px (${operable} controls)`)
      : bad(`a11y:axnames:${spec.file}`, 'accessibility', `${spec.name}: ${unnamed.length} operable control(s) have no accessible name (${[...new Set(unnamed.map((u) => u.width + 'px'))].join(', ')}) — a screen reader announces the role and nothing else`, { unnamed: unnamed.slice(0, 10) }));
  out.push(landmarks.main && landmarks.navigation
    ? ok(`a11y:axlandmarks:${spec.file}`, 'accessibility', `${spec.name}: the accessibility tree carries main and navigation landmarks`, landmarks)
    : bad(`a11y:axlandmarks:${spec.file}`, 'accessibility', `${spec.name}: the accessibility tree lacks ${Object.keys(landmarks).filter((k) => !landmarks[k]).join(' and ')}`, landmarks));
  return out;
}

export async function checkAccessibility(page, origin, { pages = PAGES } = {}) {
  const out = [];
  for (const spec of pages) {
    await page.goto(`${origin}/${spec.file}`);
    const a = await page.evaluate(`(() => {
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
      let jump = null;
      for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i - 1] > 1) { jump = [headings[i - 1], headings[i]]; break; }
      const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      return {
        lang: document.documentElement.getAttribute('lang'),
        headingJump: jump,
        duplicateIds: [...new Set(dupes)].slice(0, 8),
        imgNoAlt: [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length,
        svgNoName: [...document.querySelectorAll('svg')].filter(s => s.getAttribute('aria-hidden') !== 'true' && !s.getAttribute('aria-label') && !s.querySelector('title')).length,
        landmarks: {
          main: document.querySelectorAll('main').length,
          nav: document.querySelectorAll('nav, [role=navigation]').length,
          footer: document.querySelectorAll('footer, [role=contentinfo]').length,
        },
      };
    })()`);

    out.push(a.lang
      ? ok(`a11y:lang:${spec.file}`, 'accessibility', `${spec.name} declares lang="${a.lang}"`)
      : bad(`a11y:lang:${spec.file}`, 'accessibility', `${spec.file} renders with no lang on <html>`));

    out.push(!a.headingJump
      ? ok(`a11y:headings:${spec.file}`, 'accessibility', `${spec.name} skips no heading level in the RENDERED outline`)
      : bad(`a11y:headings:${spec.file}`, 'accessibility', `${spec.name} jumps h${a.headingJump[0]} → h${a.headingJump[1]} once rendered`, a));

    out.push(a.duplicateIds.length === 0
      ? ok(`a11y:ids:${spec.file}`, 'accessibility', `${spec.name} has no duplicate id after rendering`)
      : bad(`a11y:ids:${spec.file}`, 'accessibility', `${spec.name} has ${a.duplicateIds.length} duplicate id(s) after rendering — design-qa.mjs checks the markup and cannot see an id a renderer added`, a));

    out.push(a.imgNoAlt === 0
      ? ok(`a11y:alt:${spec.file}`, 'accessibility', `${spec.name} has no <img> without alt after rendering`)
      : bad(`a11y:alt:${spec.file}`, 'accessibility', `${a.imgNoAlt} rendered <img> element(s) have no alt`, a));

    out.push(a.landmarks.main === 1
      ? ok(`a11y:landmarks:${spec.file}`, 'accessibility', `${spec.name} renders exactly one <main>`, a.landmarks)
      : bad(`a11y:landmarks:${spec.file}`, 'accessibility', `${spec.name} renders ${a.landmarks.main} <main> element(s)`, a.landmarks));

    out.push(...await axTree(page, spec, origin));
  }

  /* Stated once, on every run. Not a check that can pass. Narrowed on
     27 Sep 2026, when checkContrast began computing ratios: what is still
     not established is named, and nothing more is claimed. */
  out.push(undecidable('a11y:bound', 'accessibility',
    'no screen reader was run, no pixels were compared, and contrast was computed only for text over solid colours',
    'This suite reads the DOM, the computed styles and — since 27 Sep 2026 — the accessibility tree of a headless Chromium: every operable control is checked for an accessible name at 1280px and 390px, and the main and navigation landmarks are read from the tree. That is what a screen reader is handed, not what one does with it: reading order, verbosity and how a live region is announced are outside it. checkContrast computes WCAG 2.x contrast from computed colours, not from rendered pixels: text over an image or a gradient other than the page background is counted as not measured, and anti-aliasing, font rendering and a reader\'s own settings are outside it. README limitation 7 stands in its narrowed form, and docs/UX-AUDIT.md §7 lists the open questions a static read could not settle.'));

  return out;
}

/* ============================================================
   16b · contrast (27 Sep 2026)

   WCAG 2.x 1.4.3: 4.5:1 for text, 3:1 for large text (24px, or 18.66px
   bold). Computed from each text element's computed colour — including
   its alpha and every ancestor's opacity — against the first solid
   background colour behind it, compositing translucent layers. Both
   themes, every page.

   Three counts, never merged: measured exactly (solid backgrounds all
   the way down); measured against the page colour where the page
   background also carries its decorative gradient (reported, and failed
   like the others, because the gradient is a faint tint over that
   colour); and not measured (text over any other image). A failure
   names the colour pair, so a person can find the token.
   ============================================================ */

const CONTRAST_PROBE = `(() => {
  const lin = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const parse = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
  const page = [document.body, document.documentElement];
  const bgOf = (el) => {
    const layers = []; let approx = false;
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') { if (page.includes(e)) approx = true; else return null; }
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let base = [255, 255, 255];
    for (const l of layers.reverse()) base = base.map((v, i) => v * (1 - l.a) + l.rgb[i] * l.a);
    return { rgb: base, approx };
  };
  let exact = 0, approx = 0, unmeasured = 0, min = Infinity; const fails = []; const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
    if (el.closest('[aria-hidden="true"], .sr-only, noscript, svg, [hidden]')) continue;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || !r.width || !r.height) continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    if (op === 0) continue;
    const fg = parse(cs.color); const bg = bgOf(el);
    if (!fg || !bg) { unmeasured++; continue; }
    const a = fg.a * op;
    const f = fg.rgb.map((v, i) => v * a + bg.rgb[i] * (1 - a));
    const L1 = lum(f), L2 = lum(bg.rgb); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize); const large = size >= 24 || (+cs.fontWeight >= 700 && size >= 18.66);
    bg.approx ? approx++ : exact++;
    min = Math.min(min, ratio);
    if (ratio < (large ? 3 : 4.5)) {
      const key = cs.color + ' on rgb(' + bg.rgb.map(Math.round).join(', ') + ')' + (op < 1 ? ' at opacity ' + op.toFixed(2) : '');
      if (!seen.has(key)) { seen.add(key); fails.push({ pair: key, ratio: +ratio.toFixed(2), need: large ? 3 : 4.5, where: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/)[0] : ''), text: el.textContent.trim().slice(0, 40) }); }
    }
  }
  return { exact, approx, unmeasured, min: min === Infinity ? null : +min.toFixed(2), fails: fails.slice(0, 10) };
})()`;

export async function checkContrast(page, origin, { pages = PAGES } = {}) {
  const out = [];
  for (const theme of ['dark', 'light']) {
    for (const spec of pages) {
      await page.goto(`${origin}/${spec.file}`);
      await page.evaluate(`document.body.dataset.theme = '${theme}'`);
      await sleep(250);
      const c = await page.evaluate(CONTRAST_PROBE);
      const id = `a11y:contrast:${theme}:${spec.file}`;
      out.push(c.fails.length
        ? bad(id, 'accessibility', `${spec.name}, ${theme} theme: ${c.fails.length} colour pair(s) below WCAG AA — lowest ${c.fails[0].ratio}:1 (${c.fails[0].pair})`, c)
        : ok(id, 'accessibility', `${spec.name}, ${theme} theme: ${c.exact + c.approx} text element(s) at or above WCAG AA (lowest ${c.min}:1); ${c.unmeasured} over an image not measured`, c));
    }
  }
  return out;
}

/* ============================================================
   16c · reduced motion (27 Sep 2026)

   With prefers-reduced-motion: reduce emulated, nothing on the page may
   still be animating or transitioning for longer than a frame. The
   stylesheets already say so in several places; this measures that they
   are obeyed after the page has rendered, including animations a module
   started.
   ============================================================ */

export async function checkReducedMotion(page, origin, { pages = PAGES } = {}) {
  const out = [];
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  try {
    for (const spec of pages) {
      await page.goto(`${origin}/${spec.file}`);
      await sleep(250);
      const m = await page.evaluate(`(() => {
        const long = document.getAnimations().filter((a) => {
          const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : {};
          return a.playState === 'running' && (t.activeDuration === Infinity || t.duration > 16);
        });
        return { reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, running: long.length,
          sample: long.slice(0, 5).map((a) => (a.animationName || a.transitionProperty || a.constructor.name) + ' on ' + (a.effect && a.effect.target ? a.effect.target.tagName.toLowerCase() + '.' + String(a.effect.target.className || '').split(' ')[0] : '?')) };
      })()`);
      const id = `a11y:reduced-motion:${spec.file}`;
      out.push(!m.reduce
        ? undecidable(id, 'accessibility', 'the reduced-motion preference could not be emulated', 'Emulation.setEmulatedMedia did not take effect, so nothing was measured.')
        : m.running
          ? bad(id, 'accessibility', `${spec.name}: ${m.running} animation(s) still running with reduced motion requested`, m)
          : ok(id, 'accessibility', `${spec.name}: nothing animates for longer than a frame with reduced motion requested`, m));
    }
  } finally {
    await page.send('Emulation.setEmulatedMedia', { features: [] });
  }
  return out;
}

/* ============================================================
   17 · the threshold — the hidden Control Room discovery, measured
   in a real browser rather than reasoned about

   SESSION 23 adds a discovery affordance to the public search
   palette, and SESSION 23.5 has to be able to say whether it does
   anything beyond what it claims. Everything here is a MEASUREMENT
   of the running page:

     · the phrase produces exactly one result, and only the phrase;
     · choosing it opens a panel and nothing else;
     · the panel carries no credential, no token and no privileged
       system data — asserted against its rendered text and against
       the whole document, not against the source;
     · no request leaves the page as a result of it;
     · Escape ends it, and the page is where it was.

   The last two are the ones a source read cannot make. A module can
   be read and found to contain no `fetch`; only a browser can say
   that opening the thing issued no request.
   ============================================================ */

/** Words that would mean the panel is carrying something it should
 *  not. Deliberately crude and deliberately broad: a false positive
 *  here costs a look, and a false negative costs the boundary. */
const PRIVILEGED_WORDS = [
  'token', 'session', 'cookie', 'secret', 'password', 'api_key', 'apikey',
  'bearer', 'authorization:', 'operator_id', 'approval_id', 'proposal_id',
  'decided_by', 'audit', 'csrf',
];

export async function checkThreshold(page, origin) {
  const results = [];
  const before = page.requests.length;
  await page.goto(`${origin}/enforcement.html`);

  await page.key('/', { code: 'Slash', keyCode: 191 });
  const opened = await page.waitFor(`(() => {
    const p = document.querySelector('[role=dialog]');
    return p && getComputedStyle(p).display !== 'none' ? true : null;
  })()`, { timeoutMs: 4000 });
  if (!opened) {
    results.push(bad('threshold:open', 'threshold', 'the palette did not open, so the threshold could not be exercised'));
    return results;
  }

  /* A near miss first. If "thirty-two path" (singular) also fired,
     the trigger would be a prefix match and the phrase would be far
     easier to hit by accident than this check assumes. */
  await page.type('thirty-two path');
  const near = await page.evaluate(`document.querySelectorAll('#cmdkResults [role=option]').length`);
  results.push(Number(near) === 0
    ? ok('threshold:exact', 'threshold', 'a near miss ("thirty-two path") produces no result — the trigger is the exact phrase, not a prefix')
    : bad('threshold:exact', 'threshold', `a near miss produced ${near} result(s); the trigger is looser than it claims to be`, { near }));

  await page.type('s');
  const hits = await page.waitFor(`(() => {
    const r = document.querySelectorAll('#cmdkResults [role=option]');
    return r.length ? r.length : null;
  })()`, { timeoutMs: 4000 });
  results.push(Number(hits) === 1
    ? ok('threshold:one-result', 'threshold', 'the phrase produces exactly one result')
    : bad('threshold:one-result', 'threshold', `the phrase produced ${hits} result(s); it should produce exactly one`, { hits }));

  const requestsBeforeOpen = page.requests.length;
  await page.key('Enter', { code: 'Enter', keyCode: 13 });
  const panel = await page.waitFor(`(() => {
    const n = document.querySelector('.thr-scrim');
    return n ? { text: n.innerText, links: [...n.querySelectorAll('a')].map((a) => a.getAttribute('href')), rings: n.querySelectorAll('.thr-ring').length, letters: n.querySelectorAll('.thr-letter').length } : null;
  })()`, { timeoutMs: 4000 });

  if (!panel) {
    results.push(bad('threshold:passage', 'threshold', 'choosing the result opened no panel'));
    return results;
  }
  results.push(ok('threshold:passage', 'threshold', `choosing the result opens the passage: ${panel.rings} ring(s), ${panel.letters} letter(s) drawn`, { rings: panel.rings, letters: panel.letters }));

  const lower = String(panel.text || '').toLowerCase();
  const leaked = PRIVILEGED_WORDS.filter((w) => lower.includes(w));
  results.push(leaked.length === 0
    ? ok('threshold:no-privileged-text', 'threshold', 'the panel\'s rendered text carries none of the words a credential or a privileged record would bring with it')
    : bad('threshold:no-privileged-text', 'threshold', `the panel\'s text contains ${leaked.join(', ')}`, { leaked }));

  /* Whatever the deployment declares — and these pages declare
     nothing — the panel may only ever offer a link somebody clicks.
     It may not navigate on its own, and it may not carry a query
     string, which is where a credential would travel. */
  const bad_ = (panel.links || []).filter((h) => h && (h.includes('?') || h.includes('#token') || /^javascript:/i.test(h)));
  results.push(bad_.length === 0
    ? ok('threshold:link-shape', 'threshold', `${(panel.links || []).length} link(s) in the panel, none carrying a query string or a javascript: target`)
    : bad('threshold:link-shape', 'threshold', `${bad_.length} link(s) carry something that could be a credential: ${bad_.join(', ')}`, { links: panel.links }));

  const issued = page.requests.length - requestsBeforeOpen;
  results.push(issued === 0
    ? ok('threshold:no-request', 'threshold', 'opening the passage issued no network request of any kind')
    : bad('threshold:no-request', 'threshold', `opening the passage issued ${issued} request(s)`, { issued, since: requestsBeforeOpen }));

  const here = await page.evaluate('location.pathname');
  await page.key('Escape', { code: 'Escape', keyCode: 27 });
  const gone = await page.waitFor(`(() => (document.querySelector('.thr-scrim') ? null : true))()`, { timeoutMs: 3000 });
  const stillHere = await page.evaluate('location.pathname');
  results.push(gone && stillHere === here
    ? ok('threshold:interruptible', 'threshold', 'Escape ends the passage and leaves the reader on the page they were on')
    : bad('threshold:interruptible', 'threshold', `Escape did not end the passage cleanly (removed=${Boolean(gone)}, path ${here} → ${stillHere})`));

  /* Said as a measurement rather than as a reassurance: the page
     never held anything privileged, so there was nothing for the
     passage to expose.

     AGAINST A CONTROL, because the naive form of this check fails
     for the wrong reason. `sessionStorage` and `credentialless` are
     Chromium's own globals and match any pattern broad enough to
     catch a real leak, so the first draft reported the browser as a
     defect in the site. The comparison is therefore with a blank
     document in the SAME browser: what is left is what these pages
     added. */
  const SUSPICIOUS = '/token|secret|session|operator|approval|credential|password|bearer/i';
  const onPage = await page.evaluate(`Object.keys(window).filter((k) => ${SUSPICIOUS}.test(k))`);
  await page.goto('about:blank');
  const onBlank = await page.evaluate(`Object.keys(window).filter((k) => ${SUSPICIOUS}.test(k))`);
  const globals = (onPage || []).filter((k) => !(onBlank || []).includes(k));
  results.push(globals.length === 0
    ? ok('threshold:no-globals', 'threshold', `the page adds no window global whose name suggests a credential, a session or an approval (${(onBlank || []).length} such name(s) belong to the browser itself and are excluded by comparison with a blank document)`, { browser_globals: onBlank })
    : bad('threshold:no-globals', 'threshold', `these pages add ${globals.join(', ')} beyond what a blank document in the same browser carries`, { globals, browser_globals: onBlank }));

  results.push(ok('threshold:total-requests', 'threshold', `${page.requests.length - before} request(s) over the whole threshold check, all of them the page's own assets`));
  return results;
}

/* ============================================================
   18 · THE SITE AT ITS PUBLISHED ADDRESS

   Deployment is GitHub Pages serving `main` at
   https://andreatosti2001.github.io/Eu-Digital-Policy/ — a PROJECT
   site, so everything sits one path segment down. Every browser run
   before SESSION 30 served the repository at `/`, which is the one
   layout the deployment is not.

   The difference is small and it is the kind that breaks a static
   site silently. A root-relative reference — `/css/tokens.css`,
   `fetch('/data/claims.json')`, `href="/instruments.html"` — resolves
   at the root and 404s under the prefix. Nothing here is written that
   way today, so this check passes; it passes as a MEASUREMENT rather
   than as a coincidence, which is what it is for. The suite could not
   previously have told the difference, and the next session to write
   a leading slash would have shipped it.

   It cannot check what a Pages deployment does with `.`-prefixed
   paths, redirect behaviour, or the real origin's headers: nothing in
   this repository has ever reached the deployed site
   (docs/CURRENT-ARCHITECTURE.md §13), and this environment's network
   policy refuses it. This is the layout, served locally, and it says
   so.
   ============================================================ */

export const DEPLOY_BASE_PATH = 'Eu-Digital-Policy';

export async function checkDeployedSubpath(browser, { root = REPO_ROOT, pages = PAGES, quick = false } = {}) {
  const out = [];
  const site = await serveSite({ root, basePath: DEPLOY_BASE_PATH });
  const page = await browser.newPage();
  try {
    /* The prefix is real: a request outside it must not be served,
       or this fixture is still serving the site at the root and the
       whole check proves nothing. */
    const rootOrigin = site.origin.slice(0, -`/${DEPLOY_BASE_PATH}`.length);
    await page.goto(`${rootOrigin}/index.html`);
    const outside = page.responses.filter((r) => r.url === `${rootOrigin}/index.html`).pop();
    out.push(outside && outside.status === 404
      ? ok('deploy:base-enforced', 'deployment', `the fixture serves ONLY under /${DEPLOY_BASE_PATH}/, as a GitHub Pages project site does — the same page at the root is 404`, { status: outside.status })
      : bad('deploy:base-enforced', 'deployment', 'a path outside the deployment base was served, so this check is measuring a root-served site and proves nothing about the published layout', { seen: outside ?? null }));
    page.responses.length = 0;

    for (const spec of (quick ? pages.slice(0, 3) : pages)) {
      await page.goto(`${site.origin}/${spec.file}`);
      /* "Rendered" is the same condition checkPageLoads uses: the
         page's own mount point exists and no longer holds the loading
         fallback the markup ships. NOT the presence of `.chrome-brand`
         — js/shell.js deliberately leaves the brief's own top bar
         alone, so that would report index.html as broken on every
         run. */
      const state = await page.evaluate(`(() => {
        const mount = document.querySelector(${JSON.stringify(spec.main)});
        const text = mount ? (mount.innerText || '') : '';
        return {
          title: document.title,
          mounted: !!mount,
          fallback: ${JSON.stringify(FALLBACK_TEXT)}.some((t) => text.includes(t)),
          stylesheets: [...document.styleSheets].length,
          modulesRan: document.body.dataset.page != null || !!document.querySelector('.chrome-brand, .lens'),
        };
      })()`);

      /* Every response this page received, and whether any carries a
         4xx/5xx. A root-relative asset is a 404 here and a 200 at the
         root, which is the entire point of serving it twice.

         `responses`, not `failedRequests`: a 404 is a successful
         exchange carrying a status, not a transport failure, so the
         existing failed-request list cannot see one. */
      const failed = page.responses.filter((r) => r.status >= 400);
      out.push(failed.length === 0
        ? ok(`deploy:assets:${spec.file}`, 'deployment', `${spec.name} loads under /${DEPLOY_BASE_PATH}/ with all ${page.responses.length} response(s) resolving`, { responses: page.responses.length })
        : bad(`deploy:assets:${spec.file}`, 'deployment', `${failed.length} request(s) 4xx/5xx under the published path — a reference that resolves at the root and not one segment down is a root-relative path`, { failed: failed.slice(0, 8).map((r) => `${r.status} ${r.url}`) }));

      out.push(state.mounted && !state.fallback && state.stylesheets > 0 && state.modulesRan
        ? ok(`deploy:render:${spec.file}`, 'deployment', `${spec.name} renders under the published path: its mount point is filled, ${state.stylesheets} stylesheet(s) loaded and its modules ran`, { stylesheets: state.stylesheets })
        : bad(`deploy:render:${spec.file}`, 'deployment', `${spec.name} did not render under the published path (mount=${state.mounted}, still showing a loading fallback=${state.fallback}, stylesheets=${state.stylesheets}, modules ran=${state.modulesRan})`, state));

      page.responses.length = 0;
    }
  } finally {
    await page.close();
    await site.close();
  }
  return out;
}
