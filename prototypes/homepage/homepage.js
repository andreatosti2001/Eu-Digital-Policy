/* ============================================================
   Homepage prototype · "the tree and its constellation".

   The brief's tree at the centre; around it the sixteen core instruments,
   each beside the part that reads it (brief_part), marked by status;
   beyond them, in three rings, the instruments this site maps, watches or
   excludes (js/routes.js coverage()). Every instrument the masthead's bands
   count (core and adjacent: js/regulatory-model.js, the one home of that
   set and of the status order, MC-2) carries its status mark wherever its
   ring puts it; a plain dot is an instrument the bands do not count. On a first visit the site's own mark
   opens the figure: the icon grows, turning, into the serpent around the
   empty core, its body fades, and its beads close in on the core, where
   the instruments take their place.

   Nothing here is typed. The title and the standfirst are read in place
   from the site's index.html (prototypes/editorial/brief.js); the parts,
   instruments and events from data/ through js/data.js; the state of play,
   the ticker and the doors are rendered by the site's own js/masthead.js
   and js/shell.js, unchanged. What this module adds is the drawing, its
   motion, and the shape of each status mark.
   ============================================================ */

import { loadAll, index, label as taxLabel, renderError } from '../../js/data.js';
import { coverage, instrumentHref, href } from '../../js/routes.js';
import { STATUS_ORDER, statusPart, coveredInstruments } from '../../js/regulatory-model.js';
import { NAV, initShell } from '../../js/shell.js';
import { initMasthead } from '../../js/masthead.js';
import { initPalette } from '../../js/palette.js';
import { readBrief } from '../editorial/brief.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const THEME_KEY = 'eupolicy:theme';
const INTRO_KEY = 'eupolicy:home-intro-seen';

/* ---------------------------------------------------------- geometry (viewBox 720 × 640) */
const CX = 360, CY = 318;
const RC = 140, RM = 186, RW = 222, RE = 256;   // core, mapped, watched, excluded
const TREE_SCALE = 0.27;
const MIN_GAP = 15;                              // degrees between two core instruments
const BOTTOM_ARC = [58, 136];                    // where the instruments with no part sit
const END = 3.4;                                 // seconds: the figure is still from here

/* ---------------------------------------------------------- small helpers */
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lin = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const sine = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : -(Math.cos(Math.PI * x) - 1) / 2);
const seg = (t, a, b) => sine(lin(t, a, b));
const outCubic = (x) => 1 - Math.pow(1 - x, 3);
const rad = (d) => (d * Math.PI) / 180;
const f2 = (n) => Math.round(n * 100) / 100;
function svg(tag, attrs = {}, parent) {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, String(v));
  if (parent) parent.appendChild(n);
  return n;
}
/* writes only what changed: most elements are still for most of the opening, and a write that changes nothing still costs a style invalidation (HP-02, timing under CPU throttling) */
const lastSet = new WeakMap();
function set(n, attrs) {
  let m = lastSet.get(n); if (!m) lastSet.set(n, m = {});
  for (const [k, v] of Object.entries(attrs)) { const val = typeof v === 'number' ? f2(v) : v; if (m[k] !== val) { m[k] = val; n.setAttribute(k, val); } }
}
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* private mode */ } },
};
const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------- status → shape
   Status is never carried by hue alone (docs/PROJECT-CONTEXT.md, principle 6):
   each status is a shape. Labels come from the taxonomy, the enum authority;
   the order of the statuses is js/regulatory-model.js STATUS_ORDER. */
const SHAPE = {
  'status:applicable': 'full',
  'status:partly-applicable': 'half',
  'status:in-force': 'heavy',
  'status:transposition-pending': 'dot-ink',
  'status:transposition-overdue': 'dot-crit',
  'status:adopted': 'thin', 'status:published': 'thin',
  'status:proposal': 'dashed', 'status:parliament-position': 'dashed', 'status:council-position': 'dashed',
  'status:trilogue': 'dashed', 'status:political-agreement': 'dashed', 'status:stalled': 'dashed',
  'status:amended': 'slash', 'status:repealed': 'slash', 'status:withdrawn': 'slash',
};
const shapeOf = (status) => SHAPE[status] || 'none';

function drawMark(parent, x, y, r, shape) {
  const g = svg('g', { class: 'mk-in' }, parent);
  if (shape === 'full') svg('circle', { cx: x, cy: y, r, class: 'mk-s' }, g);
  else if (shape === 'half') {
    svg('circle', { cx: x, cy: y, r, class: 'mk-g' }, g);
    svg('path', { d: `M${x},${y - r} A${r},${r} 0 0 1 ${x},${y + r} Z`, class: 'mk-s' }, g);
  } else if (shape === 'heavy') svg('circle', { cx: x, cy: y, r, class: 'mk-g mk-heavy' }, g);
  else if (shape === 'dot-ink' || shape === 'dot-crit') {
    svg('circle', { cx: x, cy: y, r, class: 'mk-g' }, g);
    svg('circle', { cx: x, cy: y, r: r * 0.36, class: shape === 'dot-crit' ? 'mk-crit' : 'mk-s' }, g);
  } else if (shape === 'thin') svg('circle', { cx: x, cy: y, r, class: 'mk-g mk-thin' }, g);
  else if (shape === 'dashed') svg('circle', { cx: x, cy: y, r, class: 'mk-g mk-dash' }, g);
  else if (shape === 'slash') {
    svg('circle', { cx: x, cy: y, r, class: 'mk-g mk-dash' }, g);
    svg('line', { x1: x - r * 0.7, y1: y + r * 0.7, x2: x + r * 0.7, y2: y - r * 0.7, class: 'mk-slash' }, g);
  } else svg('circle', { cx: x, cy: y, r, class: 'mk-g mk-none' }, g);
  return g;
}
/** A mark as a small inline SVG, for the legend, the ticker and the bands. */
function markIcon(status, size = 12) {
  const s = document.createElementNS(SVGNS, 'svg');
  set(s, { viewBox: '0 0 20 20', width: size, height: size, class: 'hp-icon', 'aria-hidden': 'true', focusable: 'false' });
  drawMark(s, 10, 10, 7.5, shapeOf(status));
  return s;
}

/* ---------------------------------------------------------- theme */
function theme() { return document.body.dataset.theme === 'light' ? 'light' : 'dark'; }
function applyTheme(t) {
  document.body.dataset.theme = t;
  const b = $('#hpTheme');
  if (b) { b.textContent = t === 'light' ? 'Day' : 'Night'; b.setAttribute('aria-pressed', t === 'light' ? 'false' : 'true'); }
  document.dispatchEvent(new CustomEvent('hp:theme', { detail: t }));
}
function initTheme() {
  const saved = store.get(THEME_KEY);
  applyTheme(saved === 'light' || saved === 'dark' ? saved : 'dark');
  $('#hpTheme').addEventListener('click', () => {
    const t = theme() === 'light' ? 'dark' : 'light';
    store.set(THEME_KEY, t);
    applyTheme(t);
  });
}

/* ---------------------------------------------------------- the nav, from the site's one nav model */
function initNav() {
  const ul = $('#hpNav');
  for (const n of NAV) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href(n.file);
    a.textContent = n.label;
    li.appendChild(a);
    ul.appendChild(li);
  }
}

/* ---------------------------------------------------------- reading the tree in place */
function readTree(doc, brief) {
  const src = doc.getElementById('portalTree');
  if (!src) throw new Error('The portal tree (#portalTree) was not found in index.html.');
  const parts = new Map((brief.parts || []).map((p) => [p.id, p]));
  const nodes = [...src.querySelectorAll('[data-node]')].map((g) => {
    const m = (g.getAttribute('transform') || '').match(/translate\(\s*([\d.]+)[ ,]+([\d.]+)\s*\)/);
    const id = g.getAttribute('data-node');
    const p = parts.get(id) || {};
    return m && {
      id, x: +m[1], y: +m[2],
      roman: p.roman || g.getAttribute('data-roman'),
      title: p.title || g.getAttribute('data-title'),
      minutes: p.reading_minutes,
      kind: p.kind || (id.startsWith('annex') ? 'annex' : 'part'),
    };
  }).filter(Boolean);
  const edges = [...src.querySelectorAll('line[data-a][data-b]')].map((l) => [l.getAttribute('data-a'), l.getAttribute('data-b')]);
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
  const box = { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2,
    hx: (Math.max(...xs) - Math.min(...xs)) / 2 || 1, hy: (Math.max(...ys) - Math.min(...ys)) / 2 || 1 };
  /* reading order is the order of brief.json's parts */
  const order = (brief.parts || []).map((p) => p.id);
  nodes.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return { nodes, edges, box };
}

/* ---------------------------------------------------------- placing the core instruments
   Each beside the part that reads it: the angle of that part's node from the
   tree's centre. Instruments sharing a part start spread around that angle;
   then neighbours closer than MIN_GAP are pushed apart, a few degrees at a time.
   Those with no part recorded sit, in name order, on the bottom arc. */
function placeCore(core, treeNodes, box) {
  const nodeAngle = new Map(treeNodes.map((n) =>
    [n.id, Math.atan2((n.y - box.cy) / box.hy, (n.x - box.cx) / box.hx) * 180 / Math.PI]));
  const byName = (a, b) => String(a.short_name).localeCompare(String(b.short_name));
  const anchored = core.filter((i) => nodeAngle.has(i.brief_part)).sort(byName);
  const free = core.filter((i) => !nodeAngle.has(i.brief_part)).sort(byName);
  const items = [];
  const groups = new Map();
  for (const i of anchored) { if (!groups.has(i.brief_part)) groups.set(i.brief_part, []); groups.get(i.brief_part).push(i); }
  for (const [part, list] of groups) list.forEach((i, k) =>
    items.push({ inst: i, a: nodeAngle.get(part) + (k - (list.length - 1) / 2) * MIN_GAP, fixed: false }));
  free.forEach((i, k) => items.push({ inst: i, fixed: true,
    a: free.length === 1 ? (BOTTOM_ARC[0] + BOTTOM_ARC[1]) / 2 : BOTTOM_ARC[0] + k * (BOTTOM_ARC[1] - BOTTOM_ARC[0]) / (free.length - 1) }));
  const norm = (d) => ((d % 360) + 360) % 360;
  items.forEach((it) => { it.a = norm(it.a); });
  for (let pass = 0; pass < 400; pass++) {
    items.sort((p, q) => p.a - q.a);
    let moved = false;
    for (let k = 0; k < items.length; k++) {
      const p = items[k], q = items[(k + 1) % items.length];
      const gap = norm(q.a - p.a);
      if (gap >= MIN_GAP - 0.01 || items.length < 2) continue;
      const push = (MIN_GAP - gap) / 2 + 0.01;
      if (!p.fixed && !q.fixed) { p.a = norm(p.a - push); q.a = norm(q.a + push); }
      else if (!p.fixed) p.a = norm(p.a - 2 * push);
      else if (!q.fixed) q.a = norm(q.a + 2 * push);
      moved = true;
    }
    if (!moved) break;
  }
  return items.map((it) => ({ inst: it.inst, a: it.a > 180 ? it.a - 360 : it.a }));
}

/* ---------------------------------------------------------- what falls due in the next 90 days */
const DAY = 86400000;
function dueWithin(ix, days) {
  const today = new Date().toISOString().slice(0, 10);
  const t0 = Date.parse(today + 'T00:00:00Z');
  const due = new Map();
  for (const e of ix.event.values()) {
    const d = String(e.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < today) continue;
    const n = Math.round((Date.parse(d + 'T00:00:00Z') - t0) / DAY);
    if (n > days) continue;
    if (!due.has(e.instrument) || due.get(e.instrument) > n) due.set(e.instrument, n);
  }
  return due;
}
const dayWord = (n) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : n + ' days');

/* ---------------------------------------------------------- the figure */
async function buildFigure() {
  const fig = $('#hpFig');
  let db, doc, beads;
  try {
    [db, doc, beads] = await Promise.all([
      loadAll(['taxonomy', 'instruments', 'timeline', 'brief']),
      readBrief(),
      fetch(new URL('assets/serpent-beads.json', import.meta.url)).then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' for the serpent geometry'); return r.json();
      }),
    ]);
  } catch (e) {
    const box = document.createElement('div');
    fig.replaceWith(box);
    renderError(box, e, () => location.reload());
    return;
  }
  const ix = index(db);

  /* title and standfirst, in place */
  const h1 = doc.querySelector('#portal h1');
  if (h1) $('#hpTitle').innerHTML = h1.innerHTML;
  const stand = doc.querySelector('#portal .portal-stand');
  if (stand) $('#hpStand').textContent = stand.textContent.replace(/\s+/g, ' ').trim();

  const brief = db.brief;
  const tree = readTree(doc, brief);
  const instruments = db.instruments.instruments || [];
  const core = instruments.filter((i) => i.scope_class === 'scope:core');
  const coreIds = new Set(core.map((i) => i.id));
  /* the set the bands count (core and adjacent), from its one home */
  const counted = new Set(coveredInstruments(instruments).map((i) => i.id));
  const outer = { mapped: [], watched: [], excluded: [] };
  for (const i of instruments) {
    if (coreIds.has(i.id)) continue;
    const c = coverage(i);
    (outer[c] || outer.mapped).push(i);
  }
  for (const k of Object.keys(outer)) outer[k].sort((a, b) => String(a.short_name).localeCompare(String(b.short_name)));
  const placed = placeCore(core, tree.nodes, tree.box);
  const due = dueWithin(ix, 90);
  const nextEvent = [...ix.event.values()]
    .filter((e) => String(e.date) >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
  const partOf = new Map(tree.nodes.map((n) => [n.id, n]));
  const partWord = (n) => (n.kind === 'annex' ? 'Annex ' : 'Part ') + n.roman;

  /* ---- layers, back to front */
  const P = (n) => [CX + (n.x - tree.box.cx) * TREE_SCALE, CY + (n.y - tree.box.cy) * TREE_SCALE];
  const L = {};
  L.rings = svg('g', { class: 'hp-rings' }, fig);
  L.disc = svg('circle', { cx: CX, cy: CY, r: RC, class: 'disc', opacity: 0 }, fig);
  L.ties = svg('g', { class: 'hp-ties' }, fig);
  L.tree = svg('g', { class: 'hp-tree' }, fig);
  L.mark = svg('g', { class: 'hp-mark', 'aria-hidden': 'true' }, fig);
  L.core = svg('g', { class: 'hp-core' }, fig);
  L.labels = svg('g', { class: 'hp-labels', 'aria-hidden': 'true' }, fig);

  /* rings and their dots */
  const rings = [
    { key: 'mapped', R: RM, dash: false, word: 'Mapped', t: [2.16, 2.54], a0: 158, d: 2.2 },
    { key: 'watched', R: RW, dash: true, word: 'Watched', t: [2.29, 2.67], a0: -60, d: 2.33 },
    { key: 'excluded', R: RE, dash: true, word: 'Excluded', t: [2.42, 2.8], a0: -15, d: 2.46 },
  ];
  const ringEls = [];
  for (const r of rings) {
    const list = outer[r.key];
    const rg = svg('g', { class: 'hp-ring hp-ring-' + r.key }, L.rings);   // one plane per ring, for the depth (HP-02b)
    const c = svg('circle', { cx: CX, cy: CY, r: r.R, class: 'ring' + (r.dash ? ' dash' : ''), opacity: 0 }, rg);
    const la = rad(-62);
    const lb = svg('text', { x: CX + r.R * Math.cos(la) + 8, y: CY + r.R * Math.sin(la) - 4, class: 'ring-lb', opacity: 0 }, rg);
    lb.textContent = `${r.word.toUpperCase()} · ${list.length}`;
    const dots = list.map((inst, k) => {
      const a = rad(r.a0 + k * (360 / Math.max(list.length, 1)));
      const x = CX + r.R * Math.cos(a), y = CY + r.R * Math.sin(a);
      const isCounted = counted.has(inst.id);
      const g = svg('g', { class: 'dot-g' + (due.has(inst.id) ? ' due' : '') + (isCounted ? ' counted' : ''), opacity: 0 }, rg);
      if (isCounted) { const m = drawMark(g, x, y, 6, shapeOf(statusPart(inst))); m.classList.add('mk-in'); }
      else { const inner = svg('g', { class: 'mk-in' }, g); svg('circle', { cx: x, cy: y, r: 5.5, class: 'dot ' + r.key[0] }, inner); }
      svg('title', {}, g).textContent = `${inst.short_name} — ${r.word.toLowerCase()}` +
        (isCounted ? ` · ${inst.scope_class === 'scope:adjacent' ? 'adjacent' : 'core'} · ${taxLabel(ix, statusPart(inst)) || 'status not recorded'}` : '');
      if (due.has(inst.id)) {
        svg('circle', { cx: x, cy: y, r: 10.5, class: 'duering' }, g);
        const tx = svg('text', { x: x - 14, y: y + 4, class: 'lb due-only', 'text-anchor': 'end' }, g);
        tx.textContent = `${inst.short_name} · ${due.get(inst.id)} d`;
      }
      return g;
    });
    ringEls.push({ ...r, c, lb, dots, g: rg });
  }

  /* the tree, in reading order */
  const RO = tree.nodes.map((n) => n.id);
  const nStart = (id) => 0.95 + RO.indexOf(id) * 0.055;
  const treeLines = tree.edges.filter(([a, b]) => partOf.has(a) && partOf.has(b)).map(([a, b]) => {
    const [x1, y1] = P(partOf.get(a)), [x2, y2] = P(partOf.get(b));
    return { el: svg('line', { x1, y1, x2, y2, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1, class: 'tl' }, L.tree),
      st: Math.max(nStart(a), nStart(b)) + 0.04 };
  });
  const focusables = [];
  const treeEls = tree.nodes.map((n) => {
    const [x, y] = P(n);
    const r = Math.max(10.5, (n.kind === 'annex' ? 26 : 32) * TREE_SCALE);
    const a = svg('a', { href: href('index.html#' + n.id), class: 'tn fx' + (n.kind === 'annex' ? ' annex' : ''), 'data-part': n.id,
      'aria-label': `${partWord(n)}: ${n.title}${n.minutes ? ` — ${n.minutes} min read` : ''}`, opacity: 0, tabindex: -1 }, L.tree);
    svg('circle', { cx: x, cy: y, r: r + 4, class: 'fr' }, a);
    svg('circle', { cx: x, cy: y, r, class: 'tn-c' }, a);
    const tx = svg('text', { x, y: y + 3, class: 'tn-t', 'text-anchor': 'middle', 'aria-hidden': 'true' }, a);
    tx.textContent = n.roman;
    focusables.push(a);
    return { n, el: a };
  });

  /* the core ring: marks, labels, ties */
  const sortedCW = placed.slice().sort((p, q) => ((p.a + 90 + 360) % 360) - ((q.a + 90 + 360) % 360));
  const coreEls = sortedCW.map(({ inst, a }, idx) => {
    const x = CX + RC * Math.cos(rad(a)), y = CY + RC * Math.sin(rad(a));
    const part = partOf.get(inst.brief_part);
    const statusWord = taxLabel(ix, statusPart(inst)) || 'status not recorded';
    const isDue = due.has(inst.id);
    const link = svg('a', { href: instrumentHref(inst, ix), class: 'mk fx' + (isDue ? ' due' : ''), 'data-inst': inst.id,
      'data-part': part ? part.id : '', opacity: 0, tabindex: -1,
      'aria-label': `${inst.short_name} — ${statusWord} — ${part ? 'analysed in ' + partWord(part) : 'no part of the brief recorded'}` }, L.core);
    svg('circle', { cx: x, cy: y, r: 13, class: 'fr' }, link);
    drawMark(link, x, y, 8.5, shapeOf(statusPart(inst)));
    if (isDue) svg('circle', { cx: x, cy: y, r: 14, class: 'duering' }, link);
    const pulse = svg('circle', { cx: x, cy: y, r: 10, class: 'pulse', opacity: 0 }, L.core);
    const co = Math.cos(rad(a)), si = Math.sin(rad(a));
    /* along the bottom the names run into one another: alternate two distances */
    const bottom = si > 0.6;
    const k = bottom ? sortedCW.filter((p) => Math.sin(rad(p.a)) > 0.6).findIndex((p) => p.inst.id === inst.id) : 0;
    const off = bottom ? (k % 2 ? 31 : 17) : 15;
    const lb = svg('text', { x: x + co * off, y: y + si * off + 4, class: 'lb' + (isDue ? ' due' : ''),
      'text-anchor': co > 0.45 ? 'start' : co < -0.45 ? 'end' : 'middle', opacity: 0 }, L.labels);
    lb.appendChild(document.createTextNode(inst.short_name));
    if (isDue) { const d = svg('tspan', { class: 'dd' }, lb); d.textContent = ` · ${due.get(inst.id)} d`; }
    let tie = null;
    if (part) {
      const [px, py] = P(part);
      tie = svg('line', { x1: px, y1: py, x2: x, y2: y, class: 'tie', 'data-part': part.id, 'data-inst': inst.id }, L.ties);
    }
    focusables.push(link);
    return { inst, a, x, y, el: link, lb, pulse, tie, st0: 1.98 + idx * 0.012 };
  });
  const freeCaption = svg('text', { x: CX, y: CY + RE + 26, class: 'cap', 'text-anchor': 'middle', opacity: 0 }, L.labels);
  freeCaption.textContent = 'along the bottom of the core: instruments with no part of the brief recorded';
  const coverLb = svg('text', { x: CX + RC * Math.cos(rad(-62)) + 8, y: CY + RC * Math.sin(rad(-62)) - 4, class: 'ring-lb', opacity: 0 }, L.labels);
  coverLb.textContent = `CORE · ${core.length}`;

  /* the mark: the author's serpent drawing (the disc, then the body) and its beads as shapes */
  const H = beads.hole_centre, U = beads.size, S1 = U * (RC + 7) / beads.hole_radius;   // U: the side of the drawing's square, in its own units
  const icon = svg('image', { href: 'assets/serpent-mark.png', width: 0, height: 0, opacity: 0 }, L.mark);
  const body = svg('image', { href: '', width: 0, height: 0, opacity: 0 }, L.mark);
  const bodyHref = () => (theme() === 'light' ? 'assets/serpent-body-day.png' : 'assets/serpent-body-night.png');
  body.setAttribute('href', bodyHref());
  document.addEventListener('hp:theme', () => body.setAttribute('href', bodyHref()));
  const beadEls = beads.beads.map(() => svg('ellipse', { rx: 0, ry: 0, opacity: 0, class: 'bead' }, L.mark));

  /* ---- one frame of the opening */
  let tkNext = null, sideOp = null;
  const sidePanels = [...document.querySelectorAll('.hp-side')];
  const gold = () => (theme() === 'light' ? [184, 145, 58] : [217, 169, 60]);
  function frame(t) {
    /* the mark grows and turns counter-clockwise, head first, from upside down */
    const ko = outCubic(lin(t, 0.3, 1.0));
    const S = 76 + (S1 - 76) * ko, rot = 180 * (1 - ko);
    const tr = `translate(${f2(CX)},${f2(CY)}) rotate(${f2(rot)}) translate(${f2(-H[0] * S / U)},${f2(-H[1] * S / U)})`;
    const oA = seg(t, 0, 0.3) * (1 - seg(t, 0.35, 0.85));
    const oB = 0.88 * seg(t, 0.35, 0.85) * (1 - seg(t, 0.85, 1.25));
    set(icon, { width: S, height: S, transform: tr, opacity: oA });
    set(body, { width: S, height: S, transform: tr, opacity: oB });
    /* the beads: a halo while the tree draws, then one slow contraction onto the core */
    const on = seg(t, 0.35, 0.85), warm = seg(t, 0.9, 1.3), mv = seg(t, 1.1, 2.25), gone = seg(t, 2.0, 2.35);
    const g = gold();
    const col = `rgb(${Math.round(240 + (g[0] - 240) * warm)},${Math.round(224 + (g[1] - 224) * warm)},${Math.round(174 + (g[2] - 174) * warm)})`;
    const kk = S / U, th = rad(rot);
    beads.beads.forEach((b, i) => {
      const ux = (b[0] - H[0]) * kk, uy = (b[1] - H[1]) * kk;
      const x0 = ux * Math.cos(th) - uy * Math.sin(th), y0 = ux * Math.sin(th) + uy * Math.cos(th);
      const r0 = Math.hypot(x0, y0), a = Math.atan2(y0, x0), r = r0 + (RC - r0) * mv, sz = kk * (1 - 0.3 * mv);
      const X = CX + r * Math.cos(a), Y = CY + r * Math.sin(a);
      set(beadEls[i], { cx: X, cy: Y, rx: b[2] * sz, ry: b[3] * sz, transform: `rotate(${f2(b[4] + rot)} ${f2(X)} ${f2(Y)})`, opacity: on * (1 - gone) });
      if (beadEls[i].__fill !== col) { beadEls[i].__fill = col; beadEls[i].setAttribute('fill', col); }
    });
    /* the tree, drawn in reading order */
    for (const l of treeLines) set(l.el, { 'stroke-dashoffset': 1 - lin(t, l.st, l.st + 0.25) });
    for (const n of treeEls) set(n.el, { opacity: seg(t, nStart(n.n.id), nStart(n.n.id) + 0.22) });
    /* the core forms as the beads arrive; the instruments emerge under them */
    set(L.disc, { opacity: seg(t, 1.8, 2.3) });
    for (const c of coreEls) { set(c.el, { opacity: seg(t, c.st0, c.st0 + 0.38) }); set(c.lb, { opacity: seg(t, c.st0 + 0.1, c.st0 + 0.5) }); }
    set(coverLb, { opacity: seg(t, 2.2, 2.5) });
    set(freeCaption, { opacity: seg(t, 2.3, 2.6) });
    /* the rings follow, each opening by a few units */
    for (const r of ringEls) {
      const p = seg(t, r.t[0], r.t[1]);
      set(r.c, { r: r.R - 8 * (1 - p), opacity: p });
      set(r.lb, { opacity: seg(t, r.t[1] - 0.1, r.t[1] + 0.2) });
      r.dots.forEach((d) => set(d, { opacity: seg(t, r.d, r.d + 0.4) }));
    }
    /* one link back to the ticker's next deadline, once */
    const tk = tkNext || (tkNext = $('.sop-ticker .tk-next'));
    if (tk) tk.classList.toggle('hp-lit', t >= 2.75 && t < 3.6);
    const qq = lin(t, 2.75, 3.35);
    for (const c of coreEls) {
      const on2 = nextEvent && c.inst.id === nextEvent.instrument && qq > 0 && qq < 1;
      set(c.pulse, { r: 10 + 14 * qq, opacity: on2 ? 1 - qq : 0 });
    }
    /* the panels settle in last */
    const settle = seg(t, 2.6, 3.0);
    const so = String(settle); if (so !== sideOp) { sideOp = so; for (const p of sidePanels) p.style.opacity = so; }
  }

  /* ---- interactions: hover and focus name a part or an instrument */
  const cap = $('#hpCaption');
  const countBy = (k) => outer[k].length;
  const parts = tree.nodes.filter((n) => n.kind !== 'annex').length, annexes = tree.nodes.length - parts;
  const adjacentOut = instruments.filter((i) => counted.has(i.id) && !coreIds.has(i.id)).length;
  const defaultCaption = `<p class="hp-cap-default">${parts} parts and ${annexes} annexes of the brief at the centre; around them the ${core.length} core instruments, each beside the part that reads it; further out, ${countBy('mapped')} mapped, ${countBy('watched')} watched and ${countBy('excluded')} excluded. The ${adjacentOut} adjacent instruments the bands below also count keep their status mark out there.</p>`;
  cap.innerHTML = defaultCaption;
  function clear() {
    fig.querySelectorAll('.hl').forEach((n) => n.classList.remove('hl'));
    fig.querySelectorAll('.tie.on').forEach((n) => n.classList.remove('on'));
  }
  function showPart(id) {
    clear();
    const n = partOf.get(id); if (!n) return;
    fig.querySelectorAll(`[data-part="${id}"]`).forEach((e) => e.classList.add(e.classList.contains('tie') ? 'on' : 'hl'));
    const here = coreEls.filter((c) => c.inst.brief_part === id).map((c) => c.inst.short_name);
    cap.innerHTML = `<p class="hp-cap-k">${esc(partWord(n))}</p><p class="hp-cap-t">${esc(n.title)}</p>` +
      `<p class="hp-cap-m">${n.minutes ? esc(n.minutes + ' min read') : 'reading time not recorded'} · ${here.length ? esc(here.length + ' core instrument' + (here.length > 1 ? 's' : '') + ': ' + here.join(', ')) : 'no core instrument recorded here'}</p>`;
  }
  function showInst(id) {
    clear();
    const c = coreEls.find((x) => x.inst.id === id); if (!c) return;
    c.el.classList.add('hl');
    const part = partOf.get(c.inst.brief_part);
    if (part) { fig.querySelector(`.tn[data-part="${part.id}"]`)?.classList.add('hl'); c.tie?.classList.add('on'); }
    const st = taxLabel(ix, statusPart(c.inst)) || 'Status not recorded';
    cap.innerHTML = `<p class="hp-cap-k">${esc(st)}</p><p class="hp-cap-t">${esc(c.inst.short_name)}</p>` +
      `<p class="hp-cap-m">${part ? 'Analysed in ' + esc(partWord(part)) : 'No part of the brief recorded'}` +
      `${due.has(id) ? ' · next dated event in ' + esc(dayWord(due.get(id))) : ''}</p>`;
  }
  fig.addEventListener('pointerover', (e) => {
    const a = e.target.closest('.fx'); if (!a) return;
    if (a.dataset.inst) showInst(a.dataset.inst); else showPart(a.dataset.part);
  });
  fig.addEventListener('pointerleave', () => { clear(); cap.innerHTML = defaultCaption; });
  fig.addEventListener('focusin', (e) => {
    const a = e.target.closest('.fx'); if (!a) return;
    if (a.dataset.inst) showInst(a.dataset.inst); else showPart(a.dataset.part);
  });
  fig.addEventListener('focusout', (e) => { if (!fig.contains(e.relatedTarget)) { clear(); cap.innerHTML = defaultCaption; } });

  /* ---- keyboard: one tab stop; the arrow keys walk the parts in reading order, then the ring clockwise */
  let cur = 0;
  focusables.forEach((n, k) => n.setAttribute('tabindex', k === 0 ? 0 : -1));
  fig.addEventListener('keydown', (e) => {
    const k = focusables.indexOf(document.activeElement); if (k < 0) return;
    let to = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (k + 1) % focusables.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (k - 1 + focusables.length) % focusables.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = focusables.length - 1;
    if (to == null) return;
    e.preventDefault();
    focusables[cur].setAttribute('tabindex', -1);
    cur = to;
    focusables[cur].setAttribute('tabindex', 0);
    focusables[cur].focus();
  });

  /* ---- lenses */
  const lensBtns = [...document.querySelectorAll('[data-lens]')];
  function setLens(name) {
    fig.classList.toggle('lens-due', name === 'due');
    lensBtns.forEach((b) => { const on = b.dataset.lens === name; b.setAttribute('aria-checked', String(on)); b.setAttribute('tabindex', on ? '0' : '-1'); });
    if (name === 'due') {
      const list = [...due.entries()].sort((a, b) => a[1] - b[1])
        .map(([id, n]) => `${esc(ix.instrument.get(id)?.short_name || id)} · ${esc(dayWord(n))}`);
      cap.innerHTML = `<p class="hp-cap-k">Falls due next · 90 days</p>` +
        (list.length ? `<ul class="hp-cap-list">${list.map((x) => `<li>${x}</li>`).join('')}</ul>` : '<p class="hp-cap-m">No dated event recorded in the next 90 days.</p>');
    } else cap.innerHTML = defaultCaption;
  }
  lensBtns.forEach((b) => b.addEventListener('click', () => setLens(b.dataset.lens)));
  lensBtns.forEach((b, k) => b.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = lensBtns[(k + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : lensBtns.length - 1)) % lensBtns.length];
    n.focus(); setLens(n.dataset.lens);
  }));

  /* ---- the legend: the statuses present among the core instruments, labelled by the taxonomy */
  const present = [...new Set(coveredInstruments(instruments).map(statusPart))]
    .sort((a, b) => (STATUS_ORDER.indexOf(a) + 1 || 99) - (STATUS_ORDER.indexOf(b) + 1 || 99));
  const legend = $('#hpLegend');
  for (const s of present) {
    const li = document.createElement('li');
    li.appendChild(markIcon(s, 13));
    li.appendChild(document.createTextNode(taxLabel(ix, s) || 'status not recorded'));
    legend.appendChild(li);
  }

  /* ---- the figure as a list: the same content, readable without the drawing */
  const coreByPart = new Map();
  for (const i of core) if (partOf.has(i.brief_part)) {
    if (!coreByPart.has(i.brief_part)) coreByPart.set(i.brief_part, []);
    coreByPart.get(i.brief_part).push(i);
  }
  const instLi = (i) => `<li><a href="${esc(instrumentHref(i, ix))}">${esc(i.short_name)}</a> <span>${esc(taxLabel(ix, statusPart(i)) || 'status not recorded')}</span></li>`;
  const noPart = core.filter((i) => !partOf.has(i.brief_part));
  $('#hpListBody').innerHTML =
    '<ol class="hp-list-parts">' + tree.nodes.map((n) => {
      const list = coreByPart.get(n.id) || [];
      return `<li><a href="${esc(href('index.html#' + n.id))}"><b>${esc(partWord(n))}</b> ${esc(n.title)}</a>` +
        (list.length ? `<ul>${list.map(instLi).join('')}</ul>` : '') + '</li>';
    }).join('') + '</ol>' +
    (noPart.length ? `<p class="hp-k">Core instruments with no part of the brief recorded</p><ul>${noPart.map(instLi).join('')}</ul>` : '') +
    ['mapped', 'watched', 'excluded'].map((k) => `<p class="hp-k">${k} · ${outer[k].length}</p><p class="hp-list-names">${outer[k].map((i) => esc(i.short_name) + (counted.has(i.id) ? ` (adjacent, ${esc(taxLabel(ix, statusPart(i)) || 'status not recorded')})` : '')).join(' · ')}</p>`).join('');
  if (window.matchMedia('(max-width: 640px)').matches) $('#hpList').open = true;

  /* ---- labels: a greedy pass that moves a label which would sit on a mark or on another label (HP-02).
     It measures every label and mark in BOTH lens states (the due dates widen a label), then tries small shifts of each core
     and ring label in order of distance and keeps the first that clears everything by MARGIN units. Placement only: nothing here
     reads or writes data. What it moved and what it could not resolve is left in window.__hpLabels, for the review recordings. */
  const DEPTH_MAX = 8;
  const planes = [
    [L.tree, 0], [L.ties, 1], [L.disc, 2], [L.core, 2], [L.labels, 2],
    ...ringEls.map((r) => [r.g, { mapped: 4, watched: 6, excluded: 8 }[r.key] * DEPTH_MAX / 8]),
  ];
  const planeOf = (el) => { const pl = planes.find(([g]) => g.contains(el)); return pl ? pl[1] : 0; };
  function settleLabels() {
    const MARGIN = 3, MAXMOVE = 26, lensOn = fig.classList.contains('lens-due');
    const marks = [...fig.querySelectorAll('a.mk, g.dot-g .mk-in, g.dot-g circle.duering')];
    const texts = [...fig.querySelectorAll('text.lb, text.ring-lb, text.cap')];
    const box = new Map();
    for (const on of [false, true]) {
      fig.classList.toggle('lens-due', on);
      for (const e of [...marks, ...texts]) {
        const b = e.getBBox(); if (!b.width && !b.height) continue;          // not rendered in this state
        const o = { x: b.x, y: b.y, r: b.x + b.width, b: b.y + b.height, z: planeOf(e) }, u = box.get(e);
        box.set(e, u ? { x: Math.min(u.x, o.x), y: Math.min(u.y, o.y), r: Math.max(u.r, o.r), b: Math.max(u.b, o.b), z: o.z } : o);
      }
    }
    fig.classList.toggle('lens-due', lensOn);
    /* two elements on different planes slide over one another by up to the difference of their depths (the pointer's offset is at most 1): the clearance grows by that */
    const hit = (a, b) => { const m = MARGIN + Math.abs(a.z - b.z); return a.x < b.r + m && b.x < a.r + m && a.y < b.b + m && b.y < a.b + m; };
    const shifted = (b, dx, dy) => ({ x: b.x + dx, y: b.y + dy, r: b.r + dx, b: b.b + dy, z: b.z });
    const dueOnly = [...fig.querySelectorAll('text.lb.due-only')].map((el) => {
      const gx = +el.getAttribute('x') + 14, gy = +el.getAttribute('y') - 4, d = Math.hypot(gx - CX, gy - CY) || 1;   // the due label sits left of its dot: move it away from the centre
      return { el, own: el.parentNode.querySelector('.mk-in'), max: 34, ax: (gx - CX) / d, ay: (gy - CY) / d };   // beside its own dot, so it may travel a little further
    });
    const movers = [
      ...dueOnly,
      ...coreEls.map((c) => ({ el: c.lb, own: c.el, ax: Math.cos(rad(c.a)), ay: Math.sin(rad(c.a)) })),
      ...ringEls.map((r) => ({ el: r.lb, own: null, ax: 1, ay: 0 })),
      { el: coverLb, own: null, ax: 1, ay: 0 },                              // "CORE · n", the core ring's own label
    ];
    const report = { moved: [], unresolved: [] };
    for (const m of movers) {
      const b0 = box.get(m.el); if (!b0) continue;
      const tx = -m.ay, ty = m.ax;                                         // the tangent
      const cands = [];
      const hw = (b0.r - b0.x) / 2 + 4;                                   // half the label: start or end it at its own mark instead of centring on it
      for (const r of [0, 6, 12, 18, 24, 32]) for (const t of [0, 8, -8, 16, -16, 24, -24, 36, -36, hw, -hw]) cands.push([m.ax * r + tx * t, m.ay * r + ty * t]);
      /* a label stays within MAXMOVE of where it was: further, it reads as the name of the NEXT mark along, which is worse than touching */
      cands.sort((p, q) => Math.hypot(...p) - Math.hypot(...q));
      while (cands.length && Math.hypot(...cands[cands.length - 1]) > (m.max || MAXMOVE)) cands.pop();
      const others = [...marks.filter((e) => e !== m.own).map((e) => box.get(e)), ...texts.filter((e) => e !== m.el).map((e) => box.get(e))].filter(Boolean);
      const ok = ([dx, dy]) => { const c = shifted(b0, dx, dy); return !others.some((o) => hit(c, o)); };
      const pick = cands.find(ok);
      const name = (m.el.textContent || '').trim().slice(0, 28);
      if (!pick) { report.unresolved.push(name); continue; }
      if (pick[0] || pick[1]) {
        m.el.setAttribute('x', String(+m.el.getAttribute('x') + pick[0])); m.el.setAttribute('y', String(+m.el.getAttribute('y') + pick[1]));
        box.set(m.el, shifted(b0, pick[0], pick[1])); report.moved.push([name, Math.round(pick[0] * 10) / 10, Math.round(pick[1] * 10) / 10]);
      }
    }
    window.__hpLabels = report;
  }
  await document.fonts.ready;
  settleLabels();

  /* ---- depth by layers (HP-02b). The tree at the back, then the core ring, then the mapped, watched and excluded rings, each on its own plane:
     a pointer moving over the figure slides the planes over one another. TRANSLATIONS of eight groups only - nothing rotates, no node is reprojected,
     no library. The spread from the back plane to the front one is DEPTH_MAX units of the 720-unit drawing. Still while the opening plays, under
     prefers-reduced-motion, and on a device without a fine pointer. Nothing here touches focus, names or the keyboard. */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let px = 0, py = 0, aimX = 0, aimY = 0, praf = 0;
  const paintPlanes = () => { for (const [g, d] of planes) set(g, { transform: `translate(${f2(-px * d)} ${f2(-py * d)})` }); };
  const stepPlanes = () => {
    px += (aimX - px) * 0.16; py += (aimY - py) * 0.16;
    if (Math.hypot(aimX - px, aimY - py) < 0.002) { px = aimX; py = aimY; paintPlanes(); praf = 0; return; }
    paintPlanes(); praf = requestAnimationFrame(stepPlanes);
  };
  const aimPlanes = (x, y) => { aimX = x; aimY = y; if (!praf) praf = requestAnimationFrame(stepPlanes); };
  let opening = false;
  const stage = document.querySelector('.hp-stage');
  stage.addEventListener('pointermove', (e) => {
    if (opening || e.pointerType !== 'mouse' || !finePointer.matches || reduceMotion()) return;
    const r = fig.getBoundingClientRect();
    aimPlanes(Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / (r.width / 2))), Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / (r.height / 2))));
  });
  stage.addEventListener('pointerleave', () => aimPlanes(0, 0));
  window.__hpParallax = (x, y) => { px = aimX = x; py = aimY = y; paintPlanes(); };   // for the review recordings only

  /* ---- play the opening once, or show the figure as it ends */
  let raf = 0;
  function finish() { cancelAnimationFrame(raf); raf = 0; frame(END + 1); L.mark.setAttribute('display', 'none'); opening = false; }
  function play() {
    opening = true; aimPlanes(0, 0);
    L.mark.removeAttribute('display');
    const t0 = performance.now();
    const skip = () => { if (raf) finish(); };
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('pointerdown', skip, { once: true });
    const step = (now) => {
      const t = (now - t0) / 1000;
      if (t >= END + 0.6) { finish(); return; }
      frame(t);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  const force = new URLSearchParams(location.search).get('intro') === '1';
  if (reduceMotion() || (store.get(INTRO_KEY) && !force)) finish();
  else { store.set(INTRO_KEY, '1'); play(); }
  $('#hpReplay').addEventListener('click', (e) => { e.stopPropagation(); if (reduceMotion()) { finish(); return; } play(); });
  window.__hpFrame = frame;   // for the review recordings only
}

/* ---------------------------------------------------------- the masthead's sections, with the marks added */
async function initSections() {
  await initMasthead();
  const decorate = () => {
    document.querySelectorAll('.sop-ticker .tk-item[data-s], .sop-band[data-s] .sb-n').forEach((n) => {
      const host = n.classList.contains('sb-n') ? n : n;
      if (host.querySelector('.hp-icon')) return;
      const s = (n.dataset.s || n.closest('[data-s]')?.dataset.s);
      if (s) host.prepend(markIcon('status:' + s, n.classList.contains('sb-n') ? 14 : 11));
    });
  };
  decorate();
}

/* ---------------------------------------------------------- boot */
function boot() {
  initTheme();
  initNav();
  try { initShell(); } catch (e) { console.error('[shell] failed', e); }
  initSections().catch((e) => console.error('[masthead] failed', e));
  initPalette().catch((e) => console.error('[palette] failed', e));
  buildFigure().catch((e) => console.error('[figure] failed', e));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
