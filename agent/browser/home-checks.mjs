/* ============================================================
   agent/browser/home-checks.mjs — the homepage figure, measured in a
   real browser (HP-04, docs/HOMEPAGE-PRODUCTION-PLAN.md §5)

   Until HP-04 nothing in this repository opened the homepage figure:
   `design-qa.mjs` reads the markup, the stylesheets and the modules, and
   the generic checks of checks.mjs see only that `index.html` loads and
   the keyboard reaches its focusables. These are the thirteen things only
   an open page can say about it. Each one carries, in its summary or its
   data, what it does NOT prove, because a green line here is easily read
   as more than it is:

     home:figure              the figure exists; the counts match the data
     home:no-script           with JavaScript off the published tree shows
     home:module-failure      with the module unloadable it shows too
     home:reduced-motion      the final state at once, no picture, no motion
     home:opening-once        the opening fetches its pictures once, ever
     home:next-matches-ticker the gold mark is under the ticker's event
     home:approx              a month-precision count says "≈"
     home:visited             the parts already read are lit, and follow
     home:edition-note        an edition says, in English, that it is English
     home:masthead-marks      one shape per ticker item and band; text unchanged
     home:no-hooks            none of the three review hooks of the prototype
     home:labels              no label on a label or a mark (one named exception)
     home:svg-contrast        text 4.5 : 1, graphics 3 : 1, against the pixels
     home:phone-tree-contents below 640px the tree opens the Contents panel,
                              the part marked, the Site index's pages beneath
                              (§8, 13 Nov 2026; a synthetic click, not a finger)

   NONE of them is a timing measure (that is a person's, on a phone:
   plan §6), a screen-reader reading (a declared manual protocol), or M2
   (docs/FRONTEND-REFERENCES.md §4). Every page is opened in its OWN
   isolated context, because the opening is remembered in localStorage and
   a check that inherited it would not be measuring a first visit.
   ============================================================ */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { REPO_ROOT } from './serve.mjs';
import { sleep } from './cdp.mjs';

const AREA = 'home';
const ok = (id, summary, data = {}) => ({ id, area: AREA, status: 'pass', summary, data });
const bad = (id, summary, data = {}) => ({ id, area: AREA, status: 'fail', summary, data });
const undecidable = (id, summary, why, data = {}) => ({ id, area: AREA, status: 'undecidable', summary, why, data });

/** The one label the author chose to leave touching its neighbours (§8, "HP-02: the measures", "Leave it, say so"). */
export const LABEL_EXCEPTION = 'Digital Networks Act';

const json = (root, f) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));

/* ---------------------------------------------------------- opening a page the way a reader's browser would */

/** A clock pinned to one instant that keeps running from there: the date-dependent checks must not depend on the day they run. */
const clockShim = (iso) => `(() => { const R = Date, F = R.parse(${JSON.stringify(iso)}), t0 = R.now();
  class D extends R { constructor(...a) { if (a.length === 0) super(F + (R.now() - t0)); else super(...a); } static now() { return F + (R.now() - t0); } }
  window.Date = D; })();`;

async function openHome(browser, origin, {
  path = '/', theme = 'dark', seen = true, progress = null, clock = null, reduced = false, js = true, block = [],
  viewport = { width: 1440, height: 900 }, waitFigure = true,
} = {}) {
  const page = await browser.newPage();
  const seed = `try { localStorage.setItem('eupolicy:theme', ${JSON.stringify(theme)});
    ${seen ? "localStorage.setItem('eupolicy:home-intro-seen', '1');" : ''}
    ${progress ? `if (localStorage.getItem('eupolicy:progress') === null) localStorage.setItem('eupolicy:progress', ${JSON.stringify(JSON.stringify(progress))});` : ''} } catch (e) {}`;
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: seed });
  if (clock) await page.send('Page.addScriptToEvaluateOnNewDocument', { source: clockShim(clock) });
  await page.setViewport(viewport);
  if (reduced) await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (!js) await page.send('Emulation.setScriptExecutionDisabled', { value: true });
  if (block.length) { await page.send('Network.enable'); await page.send('Network.setBlockedURLs', { urls: block }); }
  await page.goto(`${origin}${path}`);
  if (js && waitFigure) await page.waitFor(`document.querySelectorAll('#homeFig .tn').length > 0 && !document.querySelector('.home-stage.hp-settling')`, { timeoutMs: 12000, everyMs: 50 });
  return page;
}

const withPage = async (browser, origin, opts, fn) => {
  const page = await openHome(browser, origin, opts);
  try { return await fn(page); } finally { await page.close(); }
};

/* ---------------------------------------------------------- a PNG, decoded (zlib is the only thing needed; no dependency) */

export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let p = 8, w = 0, h = 0, depth = 0, ctype = 0, interlace = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8), body = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = body.readUInt32BE(0); h = body.readUInt32BE(4); depth = body[8]; ctype = body[9]; interlace = body[12]; }
    else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (depth !== 8 || interlace !== 0 || (ctype !== 6 && ctype !== 2)) throw new Error(`unsupported PNG (depth ${depth}, colour type ${ctype}, interlace ${interlace})`);
  const bpp = ctype === 6 ? 4 : 3, stride = w * bpp, raw = inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0, b = y ? out[dst - stride + x] : 0, c = x >= bpp && y ? out[dst - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[dst + x] = v & 255;
    }
  }
  return { w, h, px: (x, y) => { const i = y * stride + x * bpp; return [out[i], out[i + 1], out[i + 2]]; } };
}

const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
export const contrastRatio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

/* ---------------------------------------------------------- the checks */

export async function checkHome(browser, origin, { root = REPO_ROOT } = {}) {
  const out = [];
  const instruments = json(root, 'instruments.json').instruments;
  const events = json(root, 'timeline.json').events;
  const statusLabels = new Set(json(root, 'taxonomy.json').status.map((s) => s.label));
  const core = instruments.filter((i) => i.scope_class === 'scope:core');
  const today = new Date().toISOString().slice(0, 10);
  const nextEvent = events.filter((e) => String(e.date) >= today).sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];

  /* ---- a returning visitor, Night: the figure as it stays, its counts, its hooks, its masthead */
  const A = await withPage(browser, origin, { seen: true, progress: ['part-1'] }, async (page) => page.evaluate(`(() => {
    const portal = document.querySelector('.portal'), mount = document.querySelector('[data-mount="home-figure"]');
    const marks = [...document.querySelectorAll('#homeFig a.mk')];
    return {
      hasFigure: portal.classList.contains('has-figure'), mountHidden: mount.hidden, mountLang: mount.getAttribute('lang'),
      treeDisplay: getComputedStyle(document.querySelector('.portal-figure')).display,
      nodes: document.querySelectorAll('#homeFig .tn').length, marks: marks.length,
      names: marks.map((a) => a.getAttribute('aria-label') || ''),
      unnamedNodes: [...document.querySelectorAll('#homeFig .tn')].filter((n) => !(n.getAttribute('aria-label') || '').trim()).length,
      images: document.querySelectorAll('#homeFig image').length,
      hooks: ['__hpFrame', '__hpLabels', '__hpParallax'].filter((k) => typeof window[k] !== 'undefined'),
      listAfterButtons: !!(document.querySelector('.portal-cta') && document.querySelector('.portal-cta').nextElementSibling && document.querySelector('.portal-cta').nextElementSibling.classList.contains('hp-list')),
    };
  })()`));

  {
    const id = 'home:figure';
    const nameless = A.names.filter((n) => !(statusLabels.has(n.split(' — ')[1]) || n.split(' — ')[1] === 'status not recorded'));
    const problems = [];
    if (!A.hasFigure) problems.push('.portal.has-figure is not set');
    if (A.mountHidden) problems.push('the mount is still hidden');
    if (A.treeDisplay !== 'none') problems.push(`the published tree is still displayed (${A.treeDisplay}) under .has-figure`);
    if (A.nodes !== 13) problems.push(`${A.nodes} tree nodes, not 13`);
    if (A.marks !== core.length) problems.push(`${A.marks} core marks for ${core.length} scope:core instruments`);
    if (nameless.length) problems.push(`${nameless.length} mark name(s) naming no status label of the taxonomy: ${nameless.slice(0, 3).join(' | ')}`);
    if (A.unnamedNodes) problems.push(`${A.unnamedNodes} tree node(s) without an accessible name`);
    out.push(problems.length
      ? bad(id, `the figure is not what the data says it should be: ${problems.join('; ')}`, { problems })
      : ok(id, `the figure is built (.has-figure set, the published tree hidden), with 13 tree nodes and ${A.marks} core marks for ${core.length} scope:core instruments, each mark named with a status label of the taxonomy — it does not prove the drawing is legible or that any status is current`, { nodes: A.nodes, marks: A.marks }));
    out.push(A.hooks.length
      ? bad('home:no-hooks', `the prototype's review hook(s) ${A.hooks.join(', ')} are on window`, { hooks: A.hooks })
      : ok('home:no-hooks', 'window.__hpFrame, __hpLabels and __hpParallax are undefined (HP-04 ships none of the prototype\'s review hooks)'));
  }

  /* ---- JavaScript off, and the module refused: the published tree stays */
  {
    const state = `(() => ({ tree: getComputedStyle(document.querySelector('.portal-figure')).display, mount: getComputedStyle(document.querySelector('[data-mount="home-figure"]')).display,
      hasFigure: document.querySelector('.portal').classList.contains('has-figure'), treeNodes: document.querySelectorAll('#portalTree [data-node]').length }))()`;
    const n = await withPage(browser, origin, { js: false, waitFigure: false }, (p) => p.evaluate(state));
    out.push(n.tree !== 'none' && n.mount === 'none' && !n.hasFigure && n.treeNodes === 13
      ? ok('home:no-script', 'with JavaScript off #portalTree is displayed with its 13 nodes and the figure\'s mount is not — nothing about a crawler\'s ranking is proved', n)
      : bad('home:no-script', `with JavaScript off the published tree is "${n.tree}" and the mount "${n.mount}"`, n));
    const f = await withPage(browser, origin, { block: ['*home-figure.js'], waitFigure: false }, async (p) => {
      await p.waitFor(`document.querySelector('.sop-ticker .tk-item')`, { timeoutMs: 8000 }); await sleep(800);
      const st = await p.evaluate(state); st.mastheadRendered = await p.evaluate(`!!document.querySelector('.sop-ticker .tk-item') && !!document.querySelector('.sop-band')`); return st;
    });
    out.push(f.tree !== 'none' && f.mount === 'none' && !f.hasFigure && f.mastheadRendered
      ? ok('home:module-failure', 'with js/home-figure.js refused by the network the page is the published one: the tree displayed, the mount hidden, .has-figure never set, and the masthead still rendered (the figure is imported dynamically, so a file that cannot be fetched cannot stop the page\'s own boot)', f)
      : bad('home:module-failure', `with the module unloadable the tree is "${f.tree}", the mount "${f.mount}", has-figure ${f.hasFigure}, masthead rendered ${f.mastheadRendered}`, f));
  }

  /* ---- reduced motion, first visit: the final state at once, no picture, nothing moving */
  {
    const r = await withPage(browser, origin, { seen: false, reduced: true }, async (page) => {
      const requestsBefore = page.requests.length;
      await sleep(700);
      await page.evaluate(`window.__muts = 0; new MutationObserver((m) => { window.__muts += m.length; }).observe(document.getElementById('homeFig'), { attributes: true, subtree: true, childList: true });`);
      await sleep(900);
      const s = await page.evaluate(`({ muts: window.__muts, images: document.querySelectorAll('#homeFig image').length,
        shown: [...document.querySelectorAll('#homeFig .tn')].every((n) => n.getAttribute('opacity') === '1'),
        marksShown: [...document.querySelectorAll('#homeFig a.mk')].every((n) => n.getAttribute('opacity') === '1'),
        reduce: matchMedia('(prefers-reduced-motion: reduce)').matches })`);
      s.imageRequests = page.requests.filter((q) => q.url.includes('/img/home/')).length;
      s.requestsBefore = requestsBefore;
      return s;
    });
    out.push(!r.reduce
      ? undecidable('home:reduced-motion', 'reduced motion could not be emulated', 'Emulation.setEmulatedMedia did not take effect', r)
      : r.muts === 0 && r.images === 0 && r.imageRequests === 0 && r.shown && r.marksShown
        ? ok('home:reduced-motion', 'under prefers-reduced-motion, on a first visit, the figure is at its final state, holds no <image>, requested none of the three pictures, and changed no attribute for 0.9 s — nothing about motion elsewhere on the page', r)
        : bad('home:reduced-motion', `under reduced motion: ${r.muts} mutation(s), ${r.images} <image>, ${r.imageRequests} picture request(s), nodes shown ${r.shown}, marks shown ${r.marksShown}`, r));
  }

  /* ---- the opening: once, and under the ticker's next deadline */
  {
    const page = await openHome(browser, origin, { seen: false, waitFigure: false });
    try {
      let pulse = null;
      const expectCore = nextEvent && core.some((i) => i.id === nextEvent.instrument);
      pulse = await page.waitFor(`(() => {
        const p = [...document.querySelectorAll('#homeFig circle.pulse')].find((c) => parseFloat(c.getAttribute('opacity')) > 0.05);
        if (!p) return null;
        const a = [...document.querySelectorAll('#homeFig a.mk')].find((k) => { const c = k.querySelector('.mk-in circle'); return c && c.getAttribute('cx') === p.getAttribute('cx') && c.getAttribute('cy') === p.getAttribute('cy'); });
        return a ? { inst: a.dataset.inst, name: (a.getAttribute('aria-label') || '').split(' — ')[0] } : { inst: null };
      })()`, { timeoutMs: 12000, everyMs: 25 });
      await page.waitFor(`!document.querySelector('.home-stage.hp-opening') && document.querySelectorAll('#homeFig image').length === 0`, { timeoutMs: 10000, everyMs: 100 });
      const firstImages = page.requests.filter((q) => q.url.includes('/img/home/')).map((q) => q.url.split('/img/home/')[1]);
      const left = await page.evaluate(`({ images: document.querySelectorAll('#homeFig image').length, ticker: (document.querySelector('.sop-ticker .tk-next') || {}).textContent || '' })`);
      const before = page.requests.length;
      await page.goto(`${origin}/`);
      await page.waitFor(`document.querySelectorAll('#homeFig .tn').length > 0 && !document.querySelector('.home-stage.hp-opening')`, { timeoutMs: 12000, everyMs: 100 });
      await sleep(600);
      const secondImages = page.requests.slice(before).filter((q) => q.url.includes('/img/home/'));
      out.push(firstImages.length >= 2 && secondImages.length === 0 && left.images === 0
        ? ok('home:opening-once', `the opening plays on a first visit (${firstImages.length} picture request(s): ${firstImages.join(', ')}), leaves no <image> behind, and a second visit requests none — nothing about its timing`, { firstImages, secondImages: 0 })
        : bad('home:opening-once', `first visit: ${firstImages.length} picture request(s); after it ${left.images} <image> left; second visit: ${secondImages.length} picture request(s)`, { firstImages, secondImages: secondImages.length, left }));
      const id = 'home:next-matches-ticker';
      if (!nextEvent) out.push(undecidable(id, 'the timeline holds no upcoming dated event', 'there is no ticker deadline to compare the gold mark with'));
      else if (!expectCore) out.push(undecidable(id, `the next dated event (${nextEvent.id}) is of an instrument that is not a core mark`, 'the figure draws its gold mark only under a core instrument, so there is none to compare'));
      else if (!pulse || !pulse.inst) out.push(bad(id, 'the next dated event is of a core instrument, and no gold mark appeared under any mark during the opening', { next: nextEvent.instrument }));
      else {
        const tk = left.ticker.replace(/\s+/g, ' ');
        out.push(pulse.inst === nextEvent.instrument && tk.includes(pulse.name)
          ? ok(id, `the gold mark of the opening is under ${pulse.name}, the instrument of the ticker's next deadline ("${tk.trim()}") — that the date itself is right is data/'s business`, { instrument: pulse.inst })
          : bad(id, `the gold mark is under ${pulse.name} (${pulse.inst}); the ticker's next deadline is ${tk.trim()} (${nextEvent.instrument})`, { pulse, ticker: tk, next: nextEvent.instrument }));
      }
    } finally { await page.close(); }
  }

  /* ---- the "≈": a month-precision count, on a clock where one is inside the 90 days */
  {
    const id = 'home:approx';
    const day = 86400000;
    const choose = events.filter((e) => e.date_precision && e.date_precision !== 'precision:day')
      .map((e) => ({ e, asOf: new Date(Date.parse(String(e.date).slice(0, 10) + 'T00:00:00Z') - 30 * day).toISOString().slice(0, 10) }))
      .find(({ e, asOf }) => !events.some((o) => o.instrument === e.instrument && o !== e && String(o.date) >= asOf && String(o.date) < String(e.date)));
    if (!choose) out.push(undecidable(id, 'no event in data/timeline.json is dated to less than the day', 'there is no month-precision count to look at'));
    else {
      const inst = instruments.find((i) => i.id === choose.e.instrument);
      const r = await withPage(browser, origin, { seen: true, clock: `${choose.asOf}T10:00:00Z` }, async (page) => {
        await page.evaluate(`document.querySelector('[data-hp-lens="due"]').click()`);
        return page.evaluate(`(() => ({
          labels: [...document.querySelectorAll('#homeFig text.lb.due-only, #homeFig text.lb.due')].map((t) => t.textContent.replace(/\\s+/g, ' ').trim()),
          caption: document.querySelector('[data-part="caption"]').innerText.replace(/\\s+/g, ' ') }))()`);
      });
      const mine = r.labels.filter((l) => l.startsWith(inst.short_name + ' ·'));
      const stray = r.labels.filter((l) => !l.startsWith(inst.short_name + ' ·') && l.includes('≈'));
      out.push(mine.length && mine.every((l) => l.includes('≈')) && r.caption.includes(inst.short_name + ' · ≈') && !stray.length
        ? ok(id, `on a clock set to ${choose.asOf}, ${inst.short_name}'s event (${choose.e.id}, dated to the month) is counted "${mine[0]}" in the figure and "≈" in its caption, and no day-precision count carries one`, { labels: r.labels })
        : bad(id, `on ${choose.asOf} the month-precision event of ${inst.short_name} is not marked "≈" everywhere it is counted, or a day-precision count is: labels ${JSON.stringify(r.labels)}`, r));
    }
  }

  /* ---- the parts already read */
  {
    const r = await withPage(browser, origin, { seen: true, progress: ['part-1'] }, async (page) => {
      const read = () => page.evaluate(`[...document.querySelectorAll('#homeFig .tn.read')].map((n) => n.dataset.part)`);
      const first = await read();
      const named = await page.evaluate(`(document.querySelector('#homeFig .tn[data-part="part-1"]').getAttribute('aria-label') || '')`);
      await page.evaluate(`document.dispatchEvent(new CustomEvent('progress:changed', { detail: { visited: new Set(['part-2', 'annex-a']) } }))`);
      return { first, named, second: await read() };
    });
    const a = JSON.stringify(r.first) === '["part-1"]', b = JSON.stringify([...r.second].sort()) === '["annex-a","part-2"]';
    out.push(a && b && /already read/.test(r.named)
      ? ok('home:visited', 'with eupolicy:progress holding part-1 only that node is read on the figure (and its accessible name says so); a progress:changed event then lights exactly the parts it names — it does not test that the reading progress itself is right (app.js\'s)', r)
      : bad('home:visited', `after load the read nodes are ${JSON.stringify(r.first)}; after the event ${JSON.stringify(r.second)}; name "${r.named}"`, r));
  }

  /* ---- an edition says it is English; the English page does not */
  {
    const get = (path) => withPage(browser, origin, { path, seen: true }, (p) => p.evaluate(`(() => { const m = document.querySelector('[data-mount="home-figure"]'); const n = document.querySelector('.hp-edition-note');
      return { docLang: document.documentElement.lang, mountLang: m && m.getAttribute('lang'), note: n ? n.textContent : null, noteLang: n ? n.getAttribute('lang') : null, built: document.querySelectorAll('#homeFig .tn').length }; })()`));
    const it = await get('/it/'), en = await get('/');
    out.push(it.built && it.mountLang === 'en' && it.note === 'This figure is in English.' && it.noteLang === 'en' && en.note === null && en.mountLang === 'en'
      ? ok('home:edition-note', `on /it/ (<html lang="${it.docLang}">) the figure's lang is "en" and one English line says "This figure is in English."; on / the line is absent — what a screen reader does with lang is not measured`, { it, en })
      : bad('home:edition-note', `/it/: figure lang ${it.mountLang}, note ${JSON.stringify(it.note)}; /: note ${JSON.stringify(en.note)}`, { it, en }));
  }

  /* ---- the masthead: one shape each, and the text is the masthead's own */
  {
    const clock = '2026-12-02T10:00:00Z';
    const grab = `(() => { const t = document.querySelector('[data-mount="sop-ticker"]'), s = document.querySelector('[data-mount="state-of-play"]');
      const c = (el) => { const k = el.cloneNode(true); k.querySelectorAll('.hp-icon').forEach((n) => n.remove()); return k.outerHTML; };
      return { tickerHtml: c(t), sopHtml: c(s), tickerText: t.textContent, sopText: s.textContent,
        items: [...document.querySelectorAll('.sop-ticker .tk-item, .sop-band')].map((n) => n.querySelectorAll('.hp-icon').length),
        shapesAriaHidden: [...document.querySelectorAll('.hp-icon')].every((n) => n.getAttribute('aria-hidden') === 'true') }; })()`;
    const withFig = await withPage(browser, origin, { seen: true, clock }, async (p) => { await p.waitFor(`document.querySelector('.hp-icon')`, { timeoutMs: 8000 }); return p.evaluate(grab); });
    const without = await withPage(browser, origin, { seen: true, clock, block: ['*home-figure.js'], waitFigure: false }, async (p) => { await p.waitFor(`document.querySelector('.sop-ticker .tk-item')`, { timeoutMs: 8000 }); await sleep(400); return p.evaluate(grab); });
    const one = withFig.items.length > 0 && withFig.items.every((n) => n === 1);
    const same = withFig.tickerHtml === without.tickerHtml && withFig.sopHtml === without.sopHtml && withFig.tickerText === without.tickerText && withFig.sopText === without.sopText;
    out.push(one && same && withFig.shapesAriaHidden && without.items.every((n) => n === 0)
      ? ok('home:masthead-marks', `all ${withFig.items.length} ticker items and bands carry exactly one aria-hidden shape, and with the shapes removed the masthead is byte for byte the one rendered without the module — it does not prove the shapes are read as statuses by a person`, { items: withFig.items.length })
      : bad('home:masthead-marks', `shapes per item ${JSON.stringify(withFig.items)}; masthead identical to the module-less one: ${same}; aria-hidden: ${withFig.shapesAriaHidden}; without the module ${JSON.stringify(without.items)}`, { one, same }));
  }

  /* ---- labels and contrast: both themes, both lenses, at 1440 x 900 */
  for (const theme of ['dark', 'light']) {
    const page = await openHome(browser, origin, { seen: true, theme });
    try {
      for (const lens of ['status', 'due']) {
        await page.evaluate(`document.querySelector('[data-hp-lens="${lens}"]').click()`);
        await sleep(150);
        const tag = `${theme === 'dark' ? 'night' : 'day'}:${lens}`;

        if (theme === 'dark') {
          const L = await page.evaluate(`((exception) => {
            const vis = (e) => { const b = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && b.width > 0 && b.height > 0 ? b : null; };
            const texts = [...document.querySelectorAll('#homeFig text.lb, #homeFig text.ring-lb, #homeFig text.cap')].map((e) => ({ e, b: vis(e), kind: 'label' })).filter((x) => x.b);
            const marks = [...document.querySelectorAll('#homeFig .mk-in, #homeFig .duering')].map((e) => ({ e, b: vis(e), kind: 'mark' })).filter((x) => x.b);
            const all = [...texts, ...marks]; const hits = [];
            const name = (x) => x.kind === 'label' ? x.e.textContent.replace(/\\s+/g, ' ').trim()
              : 'a mark of ' + ((x.e.closest('a.mk') && x.e.closest('a.mk').getAttribute('aria-label')) || (x.e.closest('g.dot-g') && x.e.closest('g.dot-g').querySelector('title') && x.e.closest('g.dot-g').querySelector('title').textContent) || '?');
            for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
              const a = all[i], b = all[j]; if (a.kind === 'mark' && b.kind === 'mark') continue;
              if (a.e.closest('a.mk') && a.e.closest('a.mk') === b.e.closest('a.mk')) continue;
              /* a label's OWN mark is not counted: the label is set against it by construction (offset 15 from its centre), and the placement pass of the figure excludes it too */
              const lab = a.kind === 'label' ? a : b.kind === 'label' ? b : null, mk = a.kind === 'mark' ? a : b.kind === 'mark' ? b : null;
              if (lab && mk) {
                const own = (mk.e.closest('a.mk') && (mk.e.closest('a.mk').getAttribute('aria-label') || '').split(' \u2014 ')[0] === lab.e.textContent.split(' \u00b7 ')[0].trim())
                  || (lab.e.closest('g.dot-g') && lab.e.closest('g.dot-g') === mk.e.closest('g.dot-g'));
                if (own) continue;
              }
              const x = Math.min(a.b.right, b.b.right) - Math.max(a.b.left, b.b.left), y = Math.min(a.b.bottom, b.b.bottom) - Math.max(a.b.top, b.b.top);
              if (x > 0.5 && y > 0.5) hits.push({ a: name(a), b: name(b), x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, excepted: [a, b].some((q) => q.kind === 'label' && q.e.textContent.includes(exception)) });
            }
            return { labels: texts.length, marks: marks.length, hits };
          })(${JSON.stringify(LABEL_EXCEPTION)})`);
          const real = L.hits.filter((h) => !h.excepted);
          out.push(real.length
            ? bad(`home:labels:${lens}`, `${real.length} label(s)/mark(s) overlap other than ${LABEL_EXCEPTION}, lens "${lens}": ${real.slice(0, 4).map((h) => h.a + ' × ' + h.b).join('; ')}`, { hits: real, excepted: L.hits.length - real.length })
            : ok(`home:labels:${lens}`, `at 1440 × 900, lens "${lens}": ${L.labels} labels and ${L.marks} marks, no label on a label or on a mark other than its own${L.hits.length ? ` except the ${L.hits.length} contact(s) of "${LABEL_EXCEPTION}", left as the author decided` : ''} — nothing about other widths`, { labels: L.labels, marks: L.marks, excepted: L.hits.length }));
        }

        /* contrast: resolved paint × ancestor opacity, against the pixels behind each element, the element hidden (HP-02's method) */
        const M = await page.evaluate(`(() => {
          const fig = document.getElementById('homeFig'); fig.scrollIntoView({ block: 'center', behavior: 'instant' });
          const sx = scrollX, sy = scrollY, items = [];
          const rgba = (s) => { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
          for (const el of fig.querySelectorAll('text, circle, ellipse, path, line')) {
            const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            let op = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity); if (op < 0.02) continue;
            const isText = el.tagName === 'text', hasStroke = !isText && cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0;
            const paint = isText || !hasStroke ? rgba(cs.fill) : rgba(cs.stroke); if (!paint || cs.fill === 'none' && !hasStroke && !isText) continue;
            const alpha = op * paint.a * parseFloat(isText || !hasStroke ? cs.fillOpacity : cs.strokeOpacity); if (alpha < 0.02) continue;
            const b = el.getBoundingClientRect(); if (b.width <= 0 && b.height <= 0) continue;
            const cls = (el.getAttribute('class') || '').split(' ')[0] || el.tagName;
            const structure = /^(ring|disc|tl|tie)$/.test(cls);
            items.push({ i: items.length, cls, text: isText, structure, fg: paint.c, alpha, x: b.left + sx, y: b.top + sy, w: Math.max(b.width, 2), h: Math.max(b.height, 2), label: isText ? el.textContent.slice(0, 24) : cls });
            el.__m = items.length - 1;
          }
          const r = fig.getBoundingClientRect(); window.__items = items;
          return { items, clip: { x: r.left + sx - 20, y: r.top + sy - 20, width: r.width + 40, height: r.height + 40 } };
        })()`);
        const shot = async (hideStructure) => {
          await page.evaluate(`(() => { for (const el of document.querySelectorAll('#homeFig text, #homeFig circle, #homeFig ellipse, #homeFig path, #homeFig line')) {
            if (el.__m === undefined) continue; const cls = (el.getAttribute('class') || '').split(' ')[0];
            if (!${hideStructure} && /^(ring|disc|tl|tie)$/.test(cls)) continue; el.style.visibility = 'hidden'; } })()`);
          const r = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { ...M.clip, scale: 1 } });
          await page.evaluate(`(() => { for (const el of document.querySelectorAll('#homeFig text, #homeFig circle, #homeFig ellipse, #homeFig path, #homeFig line')) el.style.visibility = ''; })()`);
          return decodePng(Buffer.from(r.data, 'base64'));
        };
        const withStructure = await shot(false), bare = await shot(true);
        const readings = [];
        for (const it of M.items) {
          const png = it.structure ? bare : withStructure;
          const x0 = Math.max(0, Math.round(it.x - M.clip.x) - 1), y0 = Math.max(0, Math.round(it.y - M.clip.y) - 1);
          const x1 = Math.min(png.w - 1, Math.round(it.x - M.clip.x + it.w) + 1), y1 = Math.min(png.h - 1, Math.round(it.y - M.clip.y + it.h) + 1);
          const R = [], G = [], B = [];
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const p = png.px(x, y); R.push(p[0]); G.push(p[1]); B.push(p[2]); }
          if (!R.length) continue;
          const bg = [median(R), median(G), median(B)];
          const eff = it.fg.map((v, k) => Math.round(it.alpha * v + (1 - it.alpha) * bg[k]));
          readings.push({ cls: it.cls, label: it.label, text: it.text, ratio: contrastRatio(eff, bg) });
        }
        const failing = readings.filter((q) => q.ratio < (q.text ? 4.5 : 3));
        const low = (t) => readings.filter((q) => q.text === t).reduce((m, q) => Math.min(m, q.ratio), Infinity);
        const id = `home:svg-contrast:${tag}`;
        out.push(!readings.length
          ? undecidable(id, 'no element of the figure could be read', 'no painted element was found to measure')
          : failing.length
            ? bad(id, `${failing.length} of ${readings.length} readings fail (text 4.5 : 1, graphics 3 : 1) in ${tag}: ${failing.slice(0, 4).map((q) => `${q.label} ${q.ratio.toFixed(2)}`).join('; ')}`, { failing: failing.slice(0, 20), lowestText: low(true), lowestGraphic: low(false) })
            : ok(id, `${tag}: ${readings.length} readings against the pixels behind each element, none failing — lowest text ${low(true).toFixed(2)} : 1, lowest graphic ${low(false).toFixed(2)} : 1; resolved fill/stroke × ancestor opacity, Chromium only, the rings and the disc behind a label counted from the background median; hover and focus states are not read, and this is not M2 (docs/FRONTEND-REFERENCES.md §4)`, { readings: readings.length, lowestText: low(true), lowestGraphic: low(false) }));
      }
    } finally { await page.close(); }
  }
  /* ---- on a phone the figure's tree opens the Contents panel, with the part marked and the pages beneath
     (§8, 13 Nov 2026, "The mobile tree opens the Contents panel"); above 640px the node still jumps */
  {
    const probe = (part) => `(() => {
      const n = document.querySelector('#homeFig .tn[data-part="${part}"]'); const y0 = scrollY;
      n.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      const scrim = document.getElementById('treeScrim');
      const cols = []; for (let c = document.querySelector('.site-index .si-col'); c && !c.classList.contains('si-wide'); c = c.nextElementSibling) cols.push(c);
      const idx = cols.flatMap((c) => [...c.querySelectorAll('a')]).map((a) => a.getAttribute('href'));
      const labels = [...document.querySelectorAll('#treeScrim .tree-panel-pages .si-label')].map((l) => l.textContent);
      const panel = [...document.querySelectorAll('#treeScrim .tree-panel-pages a')].map((a) => a.getAttribute('href'));
      const r = { open: scrim.classList.contains('show'), hash: location.hash, moved: scrollY !== y0,
        markedList: [...scrim.querySelectorAll('.tree-listitem.marked')].map((x) => x.dataset.node + ':' + x.getAttribute('aria-current')),
        markedNodes: [...scrim.querySelectorAll('.tree-node.marked')].map((x) => x.dataset.node),
        pagesSame: idx.length > 0 && JSON.stringify(idx) === JSON.stringify(panel) && JSON.stringify(labels) === '["Sections","About this site"]', pages: panel.length, labels };
      if (r.open) document.getElementById('treeClose').click();
      r.marksAfterClose = document.querySelectorAll('#treeScrim .marked').length;
      return r; })()`;
    const phone = await withPage(browser, origin, { seen: true, viewport: { width: 390, height: 844, mobile: true } }, (p) => p.evaluate(probe('part-3')));
    const it = await withPage(browser, origin, { path: '/it/', seen: true, viewport: { width: 390, height: 844, mobile: true } }, (p) => p.evaluate(probe('part-3')));
    const desk = await withPage(browser, origin, { seen: true }, (p) => p.evaluate(probe('part-3')));
    const phoneOk = (r) => r.open && r.hash === '' && JSON.stringify(r.markedList) === '["part-3:true"]' && JSON.stringify(r.markedNodes) === '["part-3"]'
      && r.pagesSame && r.marksAfterClose === 0;
    out.push(phoneOk(phone) && phoneOk(it) && !desk.open && desk.hash === '#part-3' && desk.pagesSame
      ? ok('home:phone-tree-contents', `at 390 × 844 (/ and /it/) a tap on part III of the figure's tree opens the Contents panel without jumping, marks III in the panel's tree and list (aria-current), lists the Site index's two columns, "Sections" and "About this site" (${phone.pages} links, the edition's own paths, nothing else), and leaves no mark after closing; at 1440 × 900 the same tap jumps to #part-3 and the panel stays shut — a synthetic click, not a finger: it does not measure the target's size or a touch gesture`, { phone, it, desk })
      : bad('home:phone-tree-contents', `390: open ${phone.open}, hash "${phone.hash}", list ${JSON.stringify(phone.markedList)}, nodes ${JSON.stringify(phone.markedNodes)}, pages same ${phone.pagesSame}, marks after close ${phone.marksAfterClose}; /it/: open ${it.open}, pages same ${it.pagesSame}; 1440: open ${desk.open}, hash "${desk.hash}"`, { phone, it, desk }));
  }

  return out;
}
