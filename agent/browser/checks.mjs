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

   WHAT NONE OF THEM MAY DO. No check computes a contrast ratio, and
   none reports a screen-reader announcement. A headless Chromium can
   report a computed colour; it cannot tell you what a person with
   low vision sees, and NVDA is not installed here. README limitation
   7 stands, and `runner.mjs` carries it on every run.
   ============================================================ */

/** The seven pages `tools/design-qa.mjs` knows about, plus the one
 *  that is only reachable with a query string. `instrument.html`
 *  with no `?id=` renders a chooser, so both are worth loading. */
export const PAGES = [
  { file: 'index.html', name: 'the brief', main: 'body' },
  { file: 'instruments.html', name: 'the comparison', main: '#dnaTable' },
  { file: 'institutions.html', name: 'the institutional map', main: '#imBody' },
  { file: 'enforcement.html', name: 'the enforcement register', main: '#enfList' },
  { file: 'applies.html', name: 'the applicability tool', main: '#ap-results' },
  { file: 'bibliography.html', name: 'the evidence and sources view', main: '#bib' },
  { file: 'instrument.html?id=gdpr', name: 'one instrument, in full', main: '#instrumentPage' },
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
  await page.goto(`${origin}/instrument.html?id=${id}`);
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
    ? ok(`instrument:${id}`, 'instrument-view', `instrument.html?id=${id} renders ${s.chars} characters under ${s.headings} heading(s)`, s)
    : bad(`instrument:${id}`, 'instrument-view', `instrument.html?id=${id} rendered almost nothing`, s)];

  /* An unknown id must not render a plausible-looking empty
     instrument. */
  await page.goto(`${origin}/instrument.html?id=not-an-instrument`);
  const missing = await page.evaluate(`(() => (document.querySelector('#instrumentPage')?.textContent ?? '').trim().slice(0, 300))()`);
  out.push(/not|unknown|no such|choose|select/i.test(missing)
    ? ok('instrument:unknown', 'instrument-view', 'an unknown instrument id renders a stated absence rather than an empty page', { text: missing.slice(0, 160) })
    : bad('instrument:unknown', 'instrument-view', 'an unknown instrument id renders no explanation', { text: missing.slice(0, 160) }));

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
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'tablet', width: 820, height: 1180, mobile: true },
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
     a WCAG 2.4.7 result. */
  const indicator = await page.evaluate(`(() => {
    const el = document.querySelector('a[href], button');
    if (!el) return null;
    const before = getComputedStyle(el);
    const b = { outline: before.outlineStyle + ' ' + before.outlineWidth, shadow: before.boxShadow, border: before.borderColor };
    el.focus();
    const after = getComputedStyle(el);
    const a = { outline: after.outlineStyle + ' ' + after.outlineWidth, shadow: after.boxShadow, border: after.borderColor };
    return { b, a, differs: JSON.stringify(b) !== JSON.stringify(a) };
  })()`);
  out.push(indicator && indicator.differs
    ? ok('keyboard:focus-visible', 'accessibility', 'focusing a link changes its computed outline, shadow or border', indicator)
    : undecidable('keyboard:focus-visible', 'accessibility',
      'focusing a link produced no change in outline, box-shadow or border-color',
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
  }

  /* Stated once, on every run. Not a check that can pass. */
  out.push(undecidable('a11y:bound', 'accessibility',
    'no contrast ratio was computed, no screen reader was run, and no pixels were compared',
    'This suite reads the DOM and computed styles of a headless Chromium. README limitation 7 stands, and docs/UX-AUDIT.md §7 lists the twelve open questions a static read could not settle — this suite closes some of them and cannot close the perceptual ones.'));

  return out;
}
