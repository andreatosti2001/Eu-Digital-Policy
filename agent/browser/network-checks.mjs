/* ============================================================
   agent/browser/network-checks.mjs — network.html, measured in a real
   browser (the network-map session, docs/ROADMAP-v2.md §8, 23 Nov 2026)

   The prototype's planted cases (docs/PROTOTYPES.md §3.4 and §3.6, 29 on
   13 Nov 2026, run then with Playwright's page.route in a scratchpad)
   brought here for the published page, so they run on every push. Each
   expected figure is computed in Node from data/ through the site's own
   derivations, never written in: the counts move when the records do.

     netmap:render        one node per instrument, one edge per relationship
     netmap:arrows        an arrow exactly where `symmetric` is false
     netmap:legend        the legend's counts are the records' counts by kind
     netmap:pair          two relationships between one pair are drawn apart
     netmap:named         every node is a button with a name
     netmap:proposed      the edges js/map-model.js derives as proposed, and
                           only those, are drawn and worded as proposed
     netmap:keyboard      every instrument reached by the arrow keys; Enter
                           selects, Esc clears, Tab leaves the network
     netmap:every-rel     every relationship selected from its row in the list
     netmap:rows          each row is keyed to its own record, both ends named
     netmap:isolated      an instrument with no relationship stays, and says so
     netmap:filter        a type unticked is not drawn and leaves the list
     netmap:deterministic two loads give the same picture
     netmap:enlarge       enlarge and back, by the button and by Esc
     netmap:centre        Shift and drag moves the view and not the sphere, a plain drag turns the
                           sphere and not the view, a double-click centres, Fit restores (24 Nov 2026)
     netmap:enlarged-clear enlarged, the controls, the legend and the panel sit beside
                           the canvas, none over it (24 Nov 2026)
     netmap:in-box        every instrument inside the box at the starting view
     netmap:phone         390 px: the ego view, not the canvas; no sideways scroll
     netmap:themes        both themes render; no sideways scroll at 1440 or 390
     netmap:reduced-motion nothing animates, with the preference set or not
     netmap:no-script     without JavaScript, the relationships as a list of links
     planted, served in place of data/instruments.json (Fetch, never the tree):
     netmap:planted-symmetric a directed record served as mutual loses its arrow
     netmap:planted-stripped  a relationship stripped of claims, provisions,
                           sources and verification shows none of them as present
     netmap:planted-error the dataset served as HTTP 500: an error, no network
     netmap:first-party   every request those pages made went to the local origin

   What none of them is: a reader's judgement of whether the picture reads
   well, a screen reader, contrast inside the SVG against its pixels, a real
   phone, a finger, Safari or Firefox. The keyboard walk is the script's.
   ============================================================ */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './serve.mjs';
import { sleep } from './cdp.mjs';

const ok = (id, area, summary, data = {}) => ({ id, area, status: 'pass', summary, data });
const bad = (id, area, summary, data = {}) => ({ id, area, status: 'fail', summary, data });
const AREA = 'netmap';

const STATE = `(() => {
  const svg = document.querySelector('#nx-svg svg');
  if (!svg) return { mounted: false, error: (document.querySelector('#nxMain .data-error')?.textContent || '').trim().slice(0, 200) };
  const nodes = [...svg.querySelectorAll('.node')], edges = [...svg.querySelectorAll('.edge')];
  return {
    mounted: true,
    nodes: nodes.map((n) => n.dataset.id),
    named: nodes.filter((n) => n.getAttribute('role') === 'button' && (n.getAttribute('aria-label') || '').trim().length > 3).length,
    edges: edges.map((e) => e.dataset.rel),
    arrows: edges.filter((e) => e.querySelector('.e-line')?.hasAttribute('marker-end')).map((e) => e.dataset.rel),
    proposed: edges.filter((e) => e.classList.contains('proposed')).map((e) => e.dataset.rel),
    proposedTitles: edges.filter((e) => e.classList.contains('proposed')).map((e) => e.querySelector('title')?.textContent || ''),
    lawTitles: edges.filter((e) => !e.classList.contains('proposed')).map((e) => e.querySelector('title')?.textContent || ''),
    drawn: edges.filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.dataset.rel),
    paths: Object.fromEntries(edges.map((e) => [e.dataset.rel, e.querySelector('.e-line')?.getAttribute('d')])),
    transforms: nodes.map((n) => n.getAttribute('transform')).join('|'),
    legend: Object.fromEntries([...document.querySelectorAll('#nx-legend input[data-kind]')].map((i) => [i.dataset.kind, +(i.closest('label').querySelector('.lg-count')?.textContent || NaN)])),
    rows: [...document.querySelectorAll('#nx-table .nx-row')].map((r) => r.dataset.rel),
    panel: (document.querySelector('#nx-panel')?.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 600),
    width: document.documentElement.scrollWidth, inner: innerWidth,
  };
})()`;

/** Read the records and derive what the page must show, with the site's own modules. */
async function expected() {
  const { index } = await import('../../js/data.js');
  const { modality } = await import('../../js/map-model.js');
  const read = (n) => JSON.parse(readFileSync(join(REPO_ROOT, 'data', n + '.json'), 'utf8'));
  const db = Object.fromEntries(['taxonomy', 'instruments', 'sources', 'claims', 'brief'].map((n) => [n, read(n)]));
  const ix = index(db);
  const insts = [...new Set(ix.instrument.values())];
  const rels = ix.relationship;
  const touched = new Set(rels.flatMap((r) => [r.from, r.to]));
  const byKind = {};
  for (const r of rels) byKind[r.kind] = (byKind[r.kind] || 0) + 1;
  const pairs = new Map();
  for (const r of rels) { const k = [r.from, r.to].sort().join('|'); pairs.set(k, [...(pairs.get(k) || []), r.id]); }
  return {
    db, ix, insts: insts.map((i) => i.id).sort(), rels,
    relIds: rels.map((r) => r.id).sort(),
    directed: rels.filter((r) => r.symmetric === false).map((r) => r.id).sort(),
    proposed: rels.filter((r) => modality(r, ix) === 'proposed').map((r) => r.id).sort(),
    isolated: insts.filter((i) => !touched.has(i.id)).map((i) => i.id).sort(),
    byKind, multi: [...pairs.values()].filter((l) => l.length > 1),
  };
}

const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

/** A page in its own context, optionally with data/instruments.json replaced by `body` (or an HTTP status). */
async function openPage(browser, origin, { serve = null, viewport = null, url = '/network.html' } = {}) {
  const page = await browser.newPage();
  if (viewport) await page.send('Emulation.setDeviceMetricsOverride', { deviceScaleFactor: 1, mobile: viewport.width < 600, ...viewport });
  if (serve) {
    await page.send('Fetch.enable', { patterns: [{ urlPattern: '*/data/instruments.json*' }] });
    page.browser.rpc.on('Fetch.requestPaused', (p, sid) => {
      if (sid !== page.sessionId) return;
      page.send('Fetch.fulfillRequest', {
        requestId: p.requestId, responseCode: serve.status || 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
        body: Buffer.from(serve.body || 'error').toString('base64'),
      }).catch(() => {});
    });
  }
  await page.goto(origin + url);
  await page.waitFor(`!!document.querySelector('#nx-svg svg') || !!document.querySelector('#nxMain .data-error')`, { timeoutMs: 8000 }).catch(() => {});
  await sleep(150);
  return page;
}

export async function checkNetwork(browser, origin) {
  const out = [];
  const requests = [];
  const closeP = async (p) => { requests.push(...p.requests); await p.close(); };
  const X = await expected();
  let page = await openPage(browser, origin, { viewport: { width: 1440, height: 900 } });
  try {
    const s = await page.evaluate(STATE);
    if (!s.mounted) return [bad('netmap:render', AREA, 'the network did not render', s)];

    out.push(same(s.nodes, X.insts) && same(s.edges, X.relIds)
      ? ok('netmap:render', AREA, `${s.nodes.length} nodes are the ${X.insts.length} instruments and ${s.edges.length} edges the ${X.relIds.length} relationships, one each`)
      : bad('netmap:render', AREA, 'the nodes or edges are not exactly the records', { nodes: s.nodes.length, want: X.insts.length, edges: s.edges.length, wantEdges: X.relIds.length }));

    out.push(same(s.arrows, X.directed)
      ? ok('netmap:arrows', AREA, `an arrow on exactly the ${X.directed.length} relationships with symmetric: false, none elsewhere`)
      : bad('netmap:arrows', AREA, 'an arrow is drawn where the record gives no direction, or missing where it does', { drawn: s.arrows.length, want: X.directed.length }));

    out.push(JSON.stringify(Object.fromEntries(Object.entries(s.legend).sort())) === JSON.stringify(Object.fromEntries(Object.entries(X.byKind).sort()))
      ? ok('netmap:legend', AREA, 'the legend counts each type as the records do', { legend: s.legend })
      : bad('netmap:legend', AREA, 'the legend\'s counts differ from the records\'', { legend: s.legend, want: X.byKind }));

    const apart = X.multi.every((ids) => new Set(ids.map((id) => s.paths[id])).size === ids.length);
    out.push(X.multi.length && apart
      ? ok('netmap:pair', AREA, `${X.multi.length} pair(s) with more than one relationship, each drawn as separate lines`, { pairs: X.multi })
      : bad('netmap:pair', AREA, X.multi.length ? 'two relationships between one pair share one line' : 'no pair with two relationships in the records: nothing measured', { pairs: X.multi }));

    out.push(s.named === X.insts.length
      ? ok('netmap:named', AREA, `${s.named} of ${X.insts.length} nodes are named buttons`)
      : bad('netmap:named', AREA, `${s.named} of ${X.insts.length} nodes are named buttons`));

    out.push(same(s.proposed, X.proposed) && s.proposedTitles.every((t) => /^Proposed: /.test(t)) && s.lawTitles.every((t) => !/^Proposed/.test(t))
      ? ok('netmap:proposed', AREA, `the ${X.proposed.length} relationships js/map-model.js derives as proposed are drawn and named "Proposed: …"; the other ${X.relIds.length - X.proposed.length} are not`)
      : bad('netmap:proposed', AREA, 'a proposed relationship is drawn or named as law, or the reverse', { drawn: s.proposed.length, want: X.proposed.length }));

    /* the keyboard: walk the arrow keys from the first node until nothing new is reached */
    const walk = await page.evaluate(`(async () => {
      const svg = document.querySelector('#nx-svg svg');
      const first = svg.querySelector('.node[tabindex="0"]'); first.focus();
      const seen = new Set([first.dataset.id]); const queue = [first.dataset.id];
      const keys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'];
      while (queue.length) {
        const id = queue.shift();
        for (const k of keys) {
          svg.querySelector('.node[data-id="' + CSS.escape(id) + '"]').focus();
          document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
          const now = document.activeElement?.dataset?.id;
          if (now && !seen.has(now)) { seen.add(now); queue.push(now); }
        }
      }
      return [...seen];
    })()`);
    /* Enter selects, Esc clears */
    const enter = await page.evaluate(`(() => {
      const n = document.querySelector('#nx-svg .node[data-id="${X.insts[0]}"]'); n.focus();
      n.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const sel = n.getAttribute('aria-pressed');
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return { sel, cleared: !document.querySelector('#nx-svg .node[aria-pressed="true"]'), panel: document.querySelector('#nx-panel').textContent.includes('Nothing selected') };
    })()`);
    /* Tab leaves the network: one Tab stop, then out */
    await page.evaluate(`document.querySelector('#nx-svg .node[tabindex="0"]').focus()`);
    await page.key('Tab', { code: 'Tab', keyCode: 9 });
    const after = await page.evaluate(`({ inSvg: !!document.activeElement.closest('#nx-svg'), tag: document.activeElement.tagName })`);
    const reached = same(walk, X.insts);
    out.push(reached && enter.sel === 'true' && enter.cleared && enter.panel && !after.inSvg
      ? ok('netmap:keyboard', AREA, `${walk.length} of ${X.insts.length} instruments reached by the arrow keys from the first; Enter selects, Esc clears, Tab leaves (to ${after.tag})`)
      : bad('netmap:keyboard', AREA, 'the arrow keys, Enter, Esc or Tab do not do what the page says', { reached: walk.length, want: X.insts.length, enter, after }));

    /* every relationship, selected from its row in the list */
    const everyRel = await page.evaluate(`(() => {
      const ids = ${JSON.stringify(X.relIds)}; const fails = [];
      for (const id of ids) {
        if (document.querySelector('.nx-all')) document.querySelector('.nx-all').click();
        const b = document.querySelector('#nx-table .nx-pick[data-rel="' + CSS.escape(id) + '"]');
        if (!b) { fails.push(id + ': no row'); continue; }
        b.click();
        const e = document.querySelector('#nx-svg .edge[data-rel="' + CSS.escape(id) + '"]');
        if (!e || !e.classList.contains('selected')) fails.push(id + ': not selected');
        if (!document.querySelector('#nx-panel').textContent.includes('Relationship')) fails.push(id + ': panel');
      }
      document.querySelector('#nx-panel [data-act="clear"]')?.click();
      return fails;
    })()`);
    out.push(!everyRel.length
      ? ok('netmap:every-rel', AREA, `each of the ${X.relIds.length} relationships is selected in the network from its row, and opens in the panel`)
      : bad('netmap:every-rel', AREA, `${everyRel.length} relationship(s) could not be selected from the list`, { fails: everyRel.slice(0, 10) }));

    /* each row keyed to its own record: the block's two links are its two ends */
    const rows = await page.evaluate(`(() => [...document.querySelectorAll('#nx-table .nx-row')].map((r) => ({ id: r.dataset.rel,
      names: [...r.querySelectorAll('.ix-head a, .ix-head .ix-self')].map((a) => a.textContent.trim()) })))()`);
    const short = (id) => X.ix.instrument.get(id)?.short_name || id;
    const badRows = rows.filter((r) => { const rec = X.rels.find((x) => x.id === r.id); return !rec || r.names[0] !== short(rec.from) || r.names[1] !== short(rec.to); });
    out.push(rows.length === X.relIds.length && !badRows.length
      ? ok('netmap:rows', AREA, `the ${rows.length} rows each carry their record's id and name its two ends, from then to`)
      : bad('netmap:rows', AREA, 'a row is missing, or keyed to a record whose ends it does not name', { rows: rows.length, bad: badRows.slice(0, 5) }));

    /* an instrument with no relationship stays, and says so */
    const iso = X.isolated[0];
    const isoState = iso ? await page.evaluate(`(() => {
      const inNet = !!document.querySelector('#nx-svg .node[data-id="${iso}"]');
      const b = document.querySelector('#nx-panel button[data-node="${iso}"]'); b?.click();
      const p = document.querySelector('#nx-panel').textContent;
      const t = document.querySelector('#nx-table').textContent;
      document.querySelector('#nx-panel [data-act="clear"]')?.click();
      return { inNet, panel: /no relationship recorded/.test(p), table: /No relationship recorded/i.test(t) };
    })()`) : null;
    out.push(iso && isoState.inNet && isoState.panel && isoState.table
      ? ok('netmap:isolated', AREA, `${X.isolated.length} instruments with no relationship stay in the network; ${iso} selected says "no relationship recorded", in the panel and the list`)
      : bad('netmap:isolated', AREA, iso ? 'an instrument with no relationship is missing or not said to have none' : 'no instrument without a relationship: nothing measured', { iso, isoState }));

    /* the type filter: a kind unticked is not drawn, and leaves the list */
    const kind = Object.keys(X.byKind).sort((a, b) => X.byKind[b] - X.byKind[a])[0];
    await page.evaluate(`(() => { const c = document.querySelector('#nx-legend input[data-kind="${kind}"]'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    const f = await page.evaluate(STATE);
    const wantShown = X.relIds.length - X.byKind[kind];
    const hiddenIds = X.rels.filter((r) => r.kind === kind).map((r) => r.id);
    out.push(f.drawn.length === wantShown && f.rows.length === wantShown && !hiddenIds.some((id) => f.drawn.includes(id) || f.rows.includes(id))
      ? ok('netmap:filter', AREA, `"${kind}" unticked: ${f.drawn.length} of ${X.relIds.length} edges drawn (computed display) and ${f.rows.length} rows in the list`)
      : bad('netmap:filter', AREA, 'a type unticked in the legend is still drawn or still listed', { drawn: f.drawn.length, rows: f.rows.length, want: wantShown }));
    await page.evaluate(`(() => { const c = document.querySelector('#nx-legend input[data-kind="${kind}"]'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); })()`);

    /* enlarge and back */
    const enl = await page.evaluate(`(() => {
      const b = document.querySelector('.nx-enlarge'); const w0 = document.querySelector('.nx-stage').getBoundingClientRect().width;
      b.click();
      const wide = { w: document.querySelector('.nx-stage').getBoundingClientRect().width, panelIn: !!document.querySelector('.nx-stage #nx-panel'), pressed: b.getAttribute('aria-pressed') };
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return { w0, wide, back: { panelOut: !!document.querySelector('.nx-panel-slot #nx-panel'), pressed: b.getAttribute('aria-pressed') } };
    })()`);
    out.push(enl.wide.w > enl.w0 * 1.5 && enl.wide.panelIn && enl.wide.pressed === 'true' && enl.back.panelOut && enl.back.pressed === 'false'
      ? ok('netmap:enlarge', AREA, `enlarged: the stage ${Math.round(enl.wide.w)} px with the panel inside it; Esc returns it to the left column`, enl)
      : bad('netmap:enlarge', AREA, 'enlarging, or returning with Esc, did not happen', enl));

    /* enlarged: the controls, the legend and the panel are beside the canvas, never over it
       (24 Nov 2026: the author's screenshot showed the controls and the legend drawn on the
       left of the map's pane). At 1440 px, and at 1000 px where the stacked arrangement applies. */
    const CLEAR = `(() => {
      const b = document.querySelector('.nx-enlarge'); b.click();
      const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const q = e.getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom }; };
      const c = r('.nx-canvas');
      const over = (q) => !!q && q.l < c.r - 0.5 && q.r > c.l + 0.5 && q.t < c.b - 0.5 && q.b > c.t + 0.5;
      const parts = { tools: r('.nx-stage .nx-tools'), legend: r('.nx-stage .nx-legend'), panel: r('.nx-stage #nx-panel') };
      const res = { canvasW: Math.round(c.r - c.l), present: Object.entries(parts).filter(([, q]) => q).map(([k]) => k), covering: Object.entries(parts).filter(([, q]) => over(q)).map(([k]) => k), scrollsSideways: document.documentElement.scrollWidth > innerWidth + 1 };
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return res;
    })()`;
    const clear = [{ w: 1440, ...await page.evaluate(CLEAR) }];
    {
      const mid = await openPage(browser, origin, { viewport: { width: 1000, height: 800 } });
      try {
        await mid.waitFor(`!!document.querySelector('#nx-svg svg')`, { timeoutMs: 8000 });
        clear.push({ w: 1000, ...await mid.evaluate(CLEAR) });
      } finally { await closeP(mid); }
    }
    out.push(clear.every((x) => x.present.length === 3 && !x.covering.length && x.canvasW > 400 && !x.scrollsSideways)
      ? ok('netmap:enlarged-clear', AREA, `enlarged, at 1440 and 1000 px: the controls, the legend and the panel sit beside the canvas (${clear.map((x) => x.canvasW).join(' and ')} px wide), none over it`, { clear })
      : bad('netmap:enlarged-clear', AREA, `enlarged: ${clear.filter((x) => x.covering.length).map((x) => x.covering.join(', ') + ' at ' + x.w + ' px').join('; ') || 'a part missing, or the canvas too narrow'}`, { clear }));

    /* the pointer centres the view (24 Nov 2026): Shift and drag moves the view and leaves the sphere
       where it is; a plain drag turns the sphere and leaves the view; a double-click on an empty place
       brings that place to the centre; Fit brings the whole network back */
    await page.evaluate(`document.querySelector('#nx-svg svg').scrollIntoView({ block: 'center' })`);
    await sleep(200);
    const SNAP = `(() => {
      const svg = document.querySelector('#nx-svg svg');
      const vb = svg.getAttribute('viewBox').split(' ').map(Number);
      return { vb, tr: [...svg.querySelectorAll('.node')].map((n) => n.getAttribute('transform')).join('|'), k: svg.getScreenCTM().a };
    })()`;
    const spot = await page.evaluate(`(() => {
      const svg = document.querySelector('#nx-svg svg'), c = svg.getBoundingClientRect();
      for (let fy = 0.08; fy < 0.95; fy += 0.07) for (let fx = 0.08; fx < 0.95; fx += 0.07) {
        const x = c.left + c.width * fx, y = c.top + c.height * fy, t = document.elementFromPoint(x, y);
        if (t && svg.contains(t) && !t.closest('.node,.edge')) return { x, y };
      }
      return null;
    })()`);
    const mouse = (type, x, y, extra = {}) => page.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', ...extra });
    const dragFrom = async (x0, y0, dx, dy, modifiers) => {
      await mouse('mouseMoved', x0, y0, { button: 'none' });
      await mouse('mousePressed', x0, y0, { buttons: 1, clickCount: 1, modifiers });
      for (let i = 1; i <= 4; i++) await mouse('mouseMoved', x0 + dx * i / 4, y0 + dy * i / 4, { buttons: 1, modifiers });
      await mouse('mouseReleased', x0 + dx, y0 + dy, { buttons: 0, clickCount: 1, modifiers });
      await sleep(80);
    };
    let centre = { spot };
    if (spot) {
      const a = await page.evaluate(SNAP);
      await dragFrom(spot.x, spot.y, 60, 40, 8); // Shift
      const b = await page.evaluate(SNAP);
      await dragFrom(spot.x, spot.y, 50, 0, 0); // plain
      const c = await page.evaluate(SNAP);
      await page.evaluate(`document.querySelector('[data-zoom="reset"]').click()`);
      const d = await page.evaluate(SNAP);
      const want = await page.evaluate(`(() => { const svg = document.querySelector('#nx-svg svg'); const p = new DOMPoint(${spot.x}, ${spot.y}).matrixTransform(svg.getScreenCTM().inverse()); return { x: p.x, y: p.y }; })()`);
      for (const n of [1, 2]) { await mouse('mousePressed', spot.x, spot.y, { buttons: 1, clickCount: n }); await mouse('mouseReleased', spot.x, spot.y, { buttons: 0, clickCount: n }); }
      await sleep(80);
      const e = await page.evaluate(SNAP);
      const near = (u, v, tol) => Math.abs(u - v) <= tol;
      centre = {
        spot,
        shiftMovesView: near(b.vb[0], a.vb[0] - 60 / a.k, 1.5) && near(b.vb[1], a.vb[1] - 40 / a.k, 1.5) && near(b.vb[2], a.vb[2], 0.2) && b.tr === a.tr,
        plainTurnsSphere: c.tr !== b.tr && c.vb.every((v, i) => near(v, b.vb[i], 0.2)),
        fitRestores: d.vb.every((v, i) => near(v, a.vb[i], 0.2)),
        dblclickCentres: near(e.vb[0] + e.vb[2] / 2, want.x, 1.5) && near(e.vb[1] + e.vb[3] / 2, want.y, 1.5),
        a: a.vb, b: b.vb, e: e.vb, want,
      };
    }
    out.push(spot && centre.shiftMovesView && centre.plainTurnsSphere && centre.fitRestores && centre.dblclickCentres
      ? ok('netmap:centre', AREA, 'Shift and drag moves the view and not the sphere; a plain drag turns the sphere and not the view; Fit restores; a double-click on an empty place brings it to the centre', centre)
      : bad('netmap:centre', AREA, spot ? 'the pointer does not move or centre the view as it should (see data)' : 'no empty place in the canvas to measure from', centre));

    /* every instrument inside the box at the starting view */
    await page.goto(origin + '/network.html');
    await page.waitFor(`!!document.querySelector('#nx-svg svg')`, { timeoutMs: 8000 });
    const box = await page.evaluate(`(() => {
      const c = document.querySelector('.nx-canvas').getBoundingClientRect();
      const nodes = [...document.querySelectorAll('#nx-svg .node .n-dot')];
      const outside = nodes.filter((n) => { const r = n.getBoundingClientRect(); return r.left < c.left || r.right > c.right || r.top < c.top || r.bottom > c.bottom; })
        .map((n) => n.closest('.node').dataset.id);
      return { n: nodes.length, outside, transforms: [...document.querySelectorAll('#nx-svg .node')].map((n) => n.getAttribute('transform')).join('|') };
    })()`);
    out.push(!box.outside.length
      ? ok('netmap:in-box', AREA, `${box.n} of ${box.n} instruments inside the box at the starting view`)
      : bad('netmap:in-box', AREA, `${box.outside.length} instrument(s) start outside the box`, { outside: box.outside }));
    out.push(box.transforms === s.transforms
      ? ok('netmap:deterministic', AREA, 'two loads place every instrument at the same point')
      : bad('netmap:deterministic', AREA, 'two loads of the same records give two pictures'));

    /* both themes, wide */
    const themes = [];
    for (const t of ['light', 'dark']) {
      await page.evaluate(`document.body.dataset.theme = '${t}'`);
      await sleep(400);
      themes.push(await page.evaluate(`(() => ({ t: '${t}', bg: getComputedStyle(document.body).backgroundColor,
        node: getComputedStyle(document.querySelector('#nx-svg .node.c-covered .n-dot')).fill, sw: document.documentElement.scrollWidth, w: innerWidth }))()`));
    }
    out.push(themes[0].bg !== themes[1].bg && themes[0].node !== themes[1].node && themes.every((x) => x.sw <= x.w + 1)
      ? ok('netmap:themes', AREA, 'light and dark both render (ground and nodes change); no sideways scroll at 1440 px', { themes })
      : bad('netmap:themes', AREA, 'a theme does not change the network, or the page scrolls sideways at 1440 px', { themes }));

    /* reduced motion: nothing animates either way */
    const anim = [];
    for (const v of ['no-preference', 'reduce']) {
      await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: v }] });
      await page.goto(origin + '/network.html');
      await page.waitFor(`!!document.querySelector('#nx-svg svg')`, { timeoutMs: 8000 });
      anim.push(await page.evaluate(`({ v: '${v}', running: document.getAnimations().filter((a) => a.playState === 'running').length })`));
    }
    await page.send('Emulation.setEmulatedMedia', { features: [] });
    out.push(anim.every((a) => a.running === 0)
      ? ok('netmap:reduced-motion', AREA, 'no animation runs, with prefers-reduced-motion unset or set to reduce', { anim })
      : bad('netmap:reduced-motion', AREA, 'an animation runs on the network page', { anim }));
  } finally { await closeP(page); }

  /* the phone: the ego view, not the canvas */
  page = await openPage(browser, origin, { viewport: { width: 390, height: 844, mobile: true } });
  try {
    const m = await page.evaluate(`(() => ({ canvas: getComputedStyle(document.querySelector('.nx-canvas')).display,
      ego: !!document.querySelector('#nx-ego svg') && getComputedStyle(document.querySelector('#nx-ego')).display !== 'none',
      centre: document.querySelector('#nx-ego .node.selected')?.dataset.id || null,
      sw: document.documentElement.scrollWidth, w: innerWidth }))()`);
    const themes = [];
    for (const t of ['light', 'dark']) {
      await page.evaluate(`document.body.dataset.theme = '${t}'`);
      await sleep(300);
      themes.push(await page.evaluate(`({ t: '${t}', sw: document.documentElement.scrollWidth, w: innerWidth })`));
    }
    out.push(m.canvas === 'none' && m.ego && m.centre && m.sw <= m.w + 1 && themes.every((x) => x.sw <= x.w + 1)
      ? ok('netmap:phone', AREA, `at 390 px the ego view of ${m.centre} replaces the canvas; no sideways scroll, light or dark`, { m, themes })
      : bad('netmap:phone', AREA, 'at 390 px the canvas is shrunk instead of the ego view, or the page scrolls sideways', { m, themes }));
  } finally { await closeP(page); }

  /* without JavaScript: the relationships as a list of links */
  page = await browser.newPage();
  try {
    await page.send('Emulation.setScriptExecutionDisabled', { value: true });
    await page.goto(origin + '/network.html');
    const n = await page.evaluate(`(() => ({ blocks: document.querySelectorAll('#nxMain .ix-edge').length,
      links: document.querySelectorAll('#nxMain .ix-head a').length,
      isolated: document.querySelectorAll('#nxMain .nx-isolated a').length }))()`).catch(() => null);
    /* scripting off: read the served markup instead of evaluating in the page */
    const html = n || await (await fetch(origin + '/network.html')).text().then((t) => ({
      blocks: (t.match(/<article class="ix-edge"/g) || []).length,
      links: (t.match(/<p class="ix-head">/g) || []).length * 2,
      isolated: ((t.match(/<ul class="nx-isolated">([\s\S]*?)<\/ul>/) || [])[1] || '').split('<a ').length - 1,
    }));
    out.push(html.blocks === X.relIds.length && html.links >= X.relIds.length && html.isolated === X.isolated.length
      ? ok('netmap:no-script', AREA, `without JavaScript the page lists the ${html.blocks} relationships, their instruments as links, and the ${html.isolated} with none`, html)
      : bad('netmap:no-script', AREA, 'without JavaScript the page does not list every relationship as links', { html, want: X.relIds.length, isolated: X.isolated.length }));
  } finally { await closeP(page); }

  /* planted: a directed record served as mutual loses its arrow */
  const directed = X.rels.find((r) => r.symmetric === false);
  const plantSym = structuredClone(X.db.instruments);
  plantSym.relationships.find((r) => r.id === directed.id).symmetric = true;
  page = await openPage(browser, origin, { viewport: { width: 1440, height: 900 }, serve: { body: JSON.stringify(plantSym) } });
  try {
    const p = await page.evaluate(STATE);
    out.push(p.mounted && !p.arrows.includes(directed.id) && p.arrows.length === X.directed.length - 1
      ? ok('netmap:planted-symmetric', AREA, `${directed.id} served as mutual is drawn without an arrow; the other ${p.arrows.length} keep theirs`)
      : bad('netmap:planted-symmetric', AREA, 'a record served as mutual still has an arrow', { mounted: p.mounted, arrows: p.arrows?.length }));
  } finally { await closeP(page); }

  /* planted: a relationship stripped of everything optional shows none of it as present */
  const target = X.rels.find((r) => (r.claims || []).length && (r.provisions || []).length) || X.rels[0];
  const plantStrip = structuredClone(X.db.instruments);
  const st = plantStrip.relationships.find((r) => r.id === target.id);
  for (const k of ['claims', 'provisions', 'sources', 'requires_verification', 'verification_note', 'last_verified']) delete st[k];
  page = await openPage(browser, origin, { viewport: { width: 1440, height: 900 }, serve: { body: JSON.stringify(plantStrip) } });
  try {
    const p = await page.evaluate(`(() => {
      document.querySelector('#nx-table .nx-pick[data-rel="${target.id}"]')?.click();
      const b = document.querySelector('#nx-panel .ix-edge');
      return b ? { found: true, text: b.textContent, provs: b.querySelectorAll('.ix-prov').length, claims: b.querySelectorAll('.ix-claims li').length,
        srcs: b.querySelectorAll('.ix-srcs li').length, when: !!b.querySelector('.ix-when') } : { found: false };
    })()`);
    out.push(p.found && !p.provs && !p.claims && !p.srcs && !p.when && !/verified/i.test(p.text)
      ? ok('netmap:planted-stripped', AREA, `${target.id} served without claims, provisions, sources or verification: the panel shows none of them, and nothing reads "verified"`)
      : bad('netmap:planted-stripped', AREA, 'a field the record does not hold is shown as present', p));
  } finally { await closeP(page); }

  /* planted: the dataset fails — an error, and no network drawn */
  page = await openPage(browser, origin, { viewport: { width: 1440, height: 900 }, serve: { status: 500, body: 'error' } });
  try {
    const p = await page.evaluate(STATE);
    out.push(!p.mounted && /could not be loaded/i.test(p.error || '')
      ? ok('netmap:planted-error', AREA, 'instruments.json served as HTTP 500: the error is shown and no network is drawn', { error: p.error })
      : bad('netmap:planted-error', AREA, 'with the dataset failing, a network was drawn or no error shown', p));
  } finally { await closeP(page); }

  /* every page opened here, the planted ones included, asked only the local origin */
  const foreign = requests.filter((r) => !r.url.startsWith(origin) && !/^(data|blob|about|chrome):/.test(r.url));
  out.push(!foreign.length && requests.length
    ? ok('netmap:first-party', AREA, `the ${requests.length} request(s) the network pages made all went to the local origin`)
    : bad('netmap:first-party', AREA, foreign.length ? `${foreign.length} request(s) left the origin` : 'no request was recorded: nothing measured', { foreign: foreign.slice(0, 10).map((r) => r.url) }));
  return out;
}
