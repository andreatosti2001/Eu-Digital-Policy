/* ============================================================
   The homepage figure · "the tree and its constellation".

   The brief's tree at the centre; around it the sixteen core instruments,
   each beside the part that reads it (brief_part), marked by status;
   beyond them, in three rings, the instruments this site maps, watches or
   excludes (js/routes.js coverage()). Every instrument the masthead's bands
   count (core and adjacent: js/regulatory-model.js, the one home of that
   set and of the status order, MC-2) carries its status mark wherever its
   ring puts it; a plain dot is an instrument the bands do not count.

   It ENHANCES the published page and replaces none of its markup
   (docs/HOMEPAGE-PRODUCTION-PLAN.md §1): #portalTree, its caption and its
   button stay as they are, hidden by css/home.css only under `.has-figure`,
   which this module sets after the figure is built. Without JavaScript, or
   if anything here throws, the class is never set and the page is today's.

   Nothing here is typed. The parts are read from the document the figure
   sits on (#portalTree and section.part, no fetch); the instruments and the
   events through js/data.js, which every page already shares; the next dated
   event from js/masthead.js upcomingEvents(), the function the ticker uses,
   so the gold mark is under the event the ticker names. The serpent's
   geometry is js/home-serpent.js, generated from the author's drawing.

   The figure is ENGLISH in every edition, by construction and declared: its
   strings are built here, not carried as data-i18n markup, the mount says
   lang="en", and an edition shows one English line saying so
   (docs/HOMEPAGE-PRODUCTION-PLAN.md §3).

   What it does not do: count by status (js/regulatory-model.js does), fetch
   anything, hold a review hook on window, layer its planes in depth, or
   draw a veil over a jump to a part (HP-03, §8).
   ============================================================ */

import { loadAll, label as taxLabel } from './data.js';
import { coverage, instrumentHref, href } from './routes.js';
import { STATUS_ORDER, statusPart, coveredInstruments } from './regulatory-model.js';
import { upcomingEvents, statedDay } from './masthead.js';
import { SERPENT } from './home-serpent.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const INTRO_KEY = 'eupolicy:home-intro-seen';
const PROGRESS_KEY = 'eupolicy:progress';          // app.js DONE_KEY: the parts already read

/* ---------------------------------------------------------- geometry (viewBox 720 × 640) */
const CX = 360, CY = 318;
const RC = 140, RM = 186, RW = 222, RE = 256;   // core, mapped, watched, excluded
const TREE_SCALE = 0.27;
const MIN_GAP = 15;                              // degrees between two core instruments
const BOTTOM_ARC = [58, 136];                    // where the instruments with no part sit
const END = 3.4;                                 // seconds: the figure is still from here
const DUE_DAYS = 90;                             // the "Falls due next" lens

/* the colours of the author's drawing, which are artwork and not tokens: the bead cream is the
   drawing's own (derive-serpent.py BEAD), and the beads warm to the disc's gold, which on Day is
   a deeper gold than the site's --live (HP-02, approved as drawn) */
const BEAD_CREAM = [240, 224, 174];
const GOLD = { dark: [217, 169, 60], light: [184, 145, 58] };

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
};
const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* the site's theme is body[data-theme], set by app.js's toggle, which dispatches nothing: this module watches the attribute */
const theme = () => (document.body.dataset.theme === 'light' ? 'light' : 'dark');

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

/* ---------------------------------------------------------- reading the tree in place
   The tree's parts come from the document the figure sits on: the node's own data-title,
   data-roman and data-mins (the brief's one home of a part's title, AGENTS.md known hazards),
   and the reading order from the part sections in the order the document holds them. */
function readTree() {
  const src = document.getElementById('portalTree');
  if (!src) throw new Error('The portal tree (#portalTree) was not found on this page.');
  const order = [...document.querySelectorAll('section.part[id]')].map((s) => s.id);
  const nodes = [...src.querySelectorAll('[data-node]')].map((g) => {
    const m = (g.getAttribute('transform') || '').match(/translate\(\s*([\d.]+)[ ,]+([\d.]+)\s*\)/);
    if (!m) return null;
    const id = g.getAttribute('data-node');
    const mins = parseInt(g.getAttribute('data-mins'), 10);
    return { id, x: +m[1], y: +m[2], roman: g.getAttribute('data-roman') || '', title: g.getAttribute('data-title') || '',
      minutes: mins > 0 ? mins : null, kind: id.startsWith('annex') ? 'annex' : 'part' };
  }).filter(Boolean);
  if (!nodes.length) throw new Error('The portal tree holds no part.');
  const edges = [...src.querySelectorAll('line[data-a][data-b]')].map((l) => [l.getAttribute('data-a'), l.getAttribute('data-b')]);
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
  const box = { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2,
    hx: (Math.max(...xs) - Math.min(...xs)) / 2 || 1, hy: (Math.max(...ys) - Math.min(...ys)) / 2 || 1 };
  const pos = (id) => { const k = order.indexOf(id); return k < 0 ? order.length : k; };
  nodes.sort((a, b) => pos(a.id) - pos(b.id));
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

/* ---------------------------------------------------------- what falls due in the next 90 days
   From upcomingEvents(): the same filter and sort as the masthead's ticker and ledger, and the
   same stated day, so the figure and the ticker cannot name different "next" events. A count of
   days to an event dated only to the month (or the year) is approximate, and says so with "≈",
   as js/masthead.js does for its ledger (`approx`): printing a day count for a date known only
   to the month would narrow its precision on the page. */
const DAY = 86400000;
const isApprox = (e) => !!e.date_precision && e.date_precision !== 'precision:day';
function dueWithin(upcoming, asOf, days) {
  const t0 = Date.parse(asOf + 'T00:00:00Z');
  const due = new Map();
  for (const e of upcoming) {
    const d = String(e.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const n = Math.round((Date.parse(d + 'T00:00:00Z') - t0) / DAY);
    if (n > days) break;                         // sorted by date: nothing later is inside the window
    if (!due.has(e.instrument)) due.set(e.instrument, { n, approx: isApprox(e) });   // the earliest wins
  }
  return due;
}
const dayWord = (n) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : n + ' days');
/** "≈ 50 days" for a month-precision event, "50 days" for a day-precision one */
const away = (d) => (d.approx ? '≈ ' : '') + dayWord(d.n);

/* ---------------------------------------------------------- the stage's markup (built here, never in index.html: §3 of the plan) */
const STAGE_HTML =
  '<div class="hp-side hp-lenses">' +
    '<p class="hp-k" id="homeLensLabel">Show on the map</p>' +
    '<div role="radiogroup" aria-labelledby="homeLensLabel">' +
      '<button type="button" role="radio" aria-checked="true" data-lens="status"><b>Status</b><span>where the core rulebook stands</span></button>' +
      '<button type="button" role="radio" aria-checked="false" tabindex="-1" data-lens="due"><b>Falls due next</b><span>the next 90 days</span></button>' +
    '</div>' +
    '<p class="hp-k">The marks</p>' +
    '<ul class="hp-legend" data-part="legend"></ul>' +
  '</div>' +
  '<figure class="hp-figure">' +
    '<svg id="homeFig" class="hp-fig" viewBox="0 0 720 640" role="group" aria-labelledby="homeFigCap" tabindex="-1"></svg>' +
    '<figcaption id="homeFigCap" class="hp-sr">The parts and annexes of the brief at the centre, as the tree; around them the core instruments, each beside the part that reads it, marked by status; beyond them the instruments this site maps, watches or excludes. The same content follows as a list.</figcaption>' +
  '</figure>' +
  '<div class="hp-side hp-caption" data-part="caption" aria-live="polite"></div>';

/* ---------------------------------------------------------- the figure */
export async function initHomeFigure(ix) {
  const mount = document.querySelector('[data-mount="home-figure"]');
  if (!mount) return false;
  const portal = mount.closest('.portal') || $('#portal');

  /* the masthead's marks wait for both the figure and the masthead; either may be first */
  let built = false;
  const decorate = () => {
    if (!built) return;
    document.querySelectorAll('.sop-ticker .tk-item[data-s], .sop-band[data-s] .sb-n').forEach((n) => {
      if (n.querySelector('.hp-icon')) return;
      const s = n.dataset.s || (n.closest('[data-s]') && n.closest('[data-s]').dataset.s);
      if (s) n.prepend(markIcon('status:' + s, n.classList.contains('sb-n') ? 14 : 11));
    });
  };
  document.addEventListener('masthead:ready', decorate);

  const db = await loadAll(['taxonomy', 'instruments', 'timeline']);
  const asOf = statedDay();
  const upcoming = upcomingEvents(ix, asOf);
  const tree = readTree();
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
  const due = dueWithin(upcoming, asOf, DUE_DAYS);
  const nextEvent = upcoming[0] || null;
  const partOf = new Map(tree.nodes.map((n) => [n.id, n]));
  const partWord = (n) => (n.kind === 'annex' ? 'Annex ' : 'Part ') + n.roman;
  const nodeName = (n) => `${partWord(n)}: ${n.title}${n.minutes ? ` — ${n.minutes} min read` : ''}`;

  /* ---- the stage: one mount, built here; the published tree is left where it is */
  mount.setAttribute('lang', 'en');
  mount.innerHTML = STAGE_HTML;
  const fig = $('#homeFig', mount);
  const cap = $('[data-part="caption"]', mount);
  const stage = mount;
  const toRemove = [];                                   // what this module put outside the mount, for a failed build

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
    const rg = svg('g', { class: 'hp-ring hp-ring-' + r.key }, L.rings);
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
        tx.textContent = `${inst.short_name} · ${due.get(inst.id).approx ? '≈ ' : ''}${due.get(inst.id).n} d`;
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
    /* a part opens by a plain jump to its own section, on this page, in this edition */
    const a = svg('a', { href: '#' + n.id, class: 'tn fx' + (n.kind === 'annex' ? ' annex' : ''), 'data-part': n.id,
      'aria-label': nodeName(n), opacity: 0, tabindex: -1 }, L.tree);
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
    if (isDue) { const d = svg('tspan', { class: 'dd' }, lb); d.textContent = ` · ${due.get(inst.id).approx ? '≈ ' : ''}${due.get(inst.id).n} d`; }
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

  /* ---- the mark: the author's serpent drawing (the disc, then the body) and its beads as shapes.
     They exist ONLY while the opening plays: a returning reader, or one who asks for reduced motion,
     never has an <image> in the figure and never downloads the three pictures (plan §1). */
  const H = SERPENT.hole_centre, U = SERPENT.size, S1 = U * (RC + 7) / SERPENT.hole_radius;   // U: the side of the drawing's square, in its own units
  let mark = null;                                                  // { icon, body, beads } while the opening plays
  const bodyHref = () => href('img/home/' + (theme() === 'light' ? 'serpent-body-day.png' : 'serpent-body-night.png'));
  function buildMark() {
    const icon = svg('image', { href: href('img/home/serpent-mark.png'), width: 0, height: 0, opacity: 0 }, L.mark);
    const body = svg('image', { href: bodyHref(), width: 0, height: 0, opacity: 0 }, L.mark);
    const beads = SERPENT.beads.map(() => svg('ellipse', { rx: 0, ry: 0, opacity: 0, class: 'bead' }, L.mark));
    return { icon, body, beads };
  }

  /* ---- one frame of the opening (and, at END + 1, the figure as it stays) */
  let tkNext = null, openingOn = false;
  function frame(t) {
    if (mark) {
      /* the mark grows and turns counter-clockwise, head first, from upside down */
      const ko = outCubic(lin(t, 0.3, 1.0));
      const S = 76 + (S1 - 76) * ko, rot = 180 * (1 - ko);
      const tr = `translate(${f2(CX)},${f2(CY)}) rotate(${f2(rot)}) translate(${f2(-H[0] * S / U)},${f2(-H[1] * S / U)})`;
      const oA = seg(t, 0, 0.3) * (1 - seg(t, 0.35, 0.85));
      const oB = 0.88 * seg(t, 0.35, 0.85) * (1 - seg(t, 0.85, 1.25));
      set(mark.icon, { width: S, height: S, transform: tr, opacity: oA });
      set(mark.body, { width: S, height: S, transform: tr, opacity: oB });
      /* the beads: a halo while the tree draws, then one slow contraction onto the core */
      const on = seg(t, 0.35, 0.85), warm = seg(t, 0.9, 1.3), mv = seg(t, 1.1, 2.25), gone = seg(t, 2.0, 2.35);
      const g = GOLD[theme()];
      const col = `rgb(${Math.round(BEAD_CREAM[0] + (g[0] - BEAD_CREAM[0]) * warm)},${Math.round(BEAD_CREAM[1] + (g[1] - BEAD_CREAM[1]) * warm)},${Math.round(BEAD_CREAM[2] + (g[2] - BEAD_CREAM[2]) * warm)})`;
      const kk = S / U, th = rad(rot);
      SERPENT.beads.forEach((b, i) => {
        const ux = (b[0] - H[0]) * kk, uy = (b[1] - H[1]) * kk;
        const x0 = ux * Math.cos(th) - uy * Math.sin(th), y0 = ux * Math.sin(th) + uy * Math.cos(th);
        const r0 = Math.hypot(x0, y0), a = Math.atan2(y0, x0), r = r0 + (RC - r0) * mv, sz = kk * (1 - 0.3 * mv);
        const X = CX + r * Math.cos(a), Y = CY + r * Math.sin(a);
        set(mark.beads[i], { cx: X, cy: Y, rx: b[2] * sz, ry: b[3] * sz, transform: `rotate(${f2(b[4] + rot)} ${f2(X)} ${f2(Y)})`, opacity: on * (1 - gone), fill: col });
      });
    }
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
    /* one link back to the ticker's next deadline, once: under the event upcomingEvents() puts first */
    const tk = tkNext || (tkNext = $('.sop-ticker .tk-next'));
    if (tk) tk.classList.toggle('hp-lit', t >= 2.75 && t < 3.6);
    const qq = lin(t, 2.75, 3.35);
    for (const c of coreEls) {
      const on2 = nextEvent && c.inst.id === nextEvent.instrument && qq > 0 && qq < 1;
      set(c.pulse, { r: 10 + 14 * qq, opacity: on2 ? 1 - qq : 0 });
    }
    /* the panels settle in last (a class, a CSS transition: no style attribute is written) */
    const settling = t < 2.6;
    if (settling !== openingOn) { openingOn = settling; stage.classList.toggle('hp-opening', settling); }
  }

  /* ---- interactions: hover and focus name a part or an instrument */
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
    if (part) { const tn = fig.querySelector(`.tn[data-part="${part.id}"]`); if (tn) tn.classList.add('hl'); if (c.tie) c.tie.classList.add('on'); }
    const st = taxLabel(ix, statusPart(c.inst)) || 'Status not recorded';
    cap.innerHTML = `<p class="hp-cap-k">${esc(st)}</p><p class="hp-cap-t">${esc(c.inst.short_name)}</p>` +
      `<p class="hp-cap-m">${part ? 'Analysed in ' + esc(partWord(part)) : 'No part of the brief recorded'}` +
      `${due.has(id) ? ' · next dated event in ' + esc(away(due.get(id))) : ''}</p>`;
  }
  const point = (e) => {
    const a = e.target.closest ? e.target.closest('.fx') : null; if (!a) return;
    if (a.dataset.inst) showInst(a.dataset.inst); else showPart(a.dataset.part);
  };
  fig.addEventListener('pointerover', point);
  fig.addEventListener('pointerleave', () => { clear(); cap.innerHTML = lensName() === 'due' ? dueCaption() : defaultCaption; });
  fig.addEventListener('focusin', point);
  fig.addEventListener('focusout', (e) => { if (!fig.contains(e.relatedTarget)) { clear(); cap.innerHTML = lensName() === 'due' ? dueCaption() : defaultCaption; } });

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
  const lensBtns = [...mount.querySelectorAll('[data-lens]')];
  const lensName = () => (fig.classList.contains('lens-due') ? 'due' : 'status');
  const dueCaption = () => {
    const list = [...due.entries()].sort((a, b) => a[1].n - b[1].n)
      .map(([id, d]) => `${esc((ix.instrument.get(id) && ix.instrument.get(id).short_name) || id)} · ${esc(away(d))}`);
    return `<p class="hp-cap-k">Falls due next · ${DUE_DAYS} days</p>` +
      (list.length ? `<ul class="hp-cap-list">${list.map((x) => `<li>${x}</li>`).join('')}</ul>` : `<p class="hp-cap-m">No dated event recorded in the next ${DUE_DAYS} days.</p>`);
  };
  function setLens(name) {
    fig.classList.toggle('lens-due', name === 'due');
    lensBtns.forEach((b) => { const on = b.dataset.lens === name; b.setAttribute('aria-checked', String(on)); b.setAttribute('tabindex', on ? '0' : '-1'); });
    cap.innerHTML = name === 'due' ? dueCaption() : defaultCaption;
  }
  lensBtns.forEach((b) => b.addEventListener('click', () => setLens(b.dataset.lens)));
  lensBtns.forEach((b, k) => b.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = lensBtns[(k + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : lensBtns.length - 1)) % lensBtns.length];
    n.focus(); setLens(n.dataset.lens);
  }));

  /* ---- the legend: the statuses present among the instruments the bands count, labelled by the taxonomy */
  const present = [...new Set(coveredInstruments(instruments).map(statusPart))]
    .sort((a, b) => (STATUS_ORDER.indexOf(a) + 1 || 99) - (STATUS_ORDER.indexOf(b) + 1 || 99));
  const legend = $('[data-part="legend"]', mount);
  for (const s of present) {
    const li = document.createElement('li');
    li.appendChild(markIcon(s, 13));
    li.appendChild(document.createTextNode(taxLabel(ix, s) || 'status not recorded'));
    legend.appendChild(li);
  }

  /* ---- the figure as a list: the same content, readable without the drawing.
     It sits after the page's own buttons, as in the prototype, so "Read the brief" stays under the figure. */
  const coreByPart = new Map();
  for (const i of core) if (partOf.has(i.brief_part)) {
    if (!coreByPart.has(i.brief_part)) coreByPart.set(i.brief_part, []);
    coreByPart.get(i.brief_part).push(i);
  }
  const instLi = (i) => `<li><a href="${esc(instrumentHref(i, ix))}">${esc(i.short_name)}</a> <span>${esc(taxLabel(ix, statusPart(i)) || 'status not recorded')}</span></li>`;
  const noPart = core.filter((i) => !partOf.has(i.brief_part));
  const list = document.createElement('details');
  list.className = 'hp-list';
  list.setAttribute('lang', 'en');
  list.innerHTML = '<summary>The figure, as a list</summary><div>' +
    '<ol class="hp-list-parts">' + tree.nodes.map((n) => {
      const here = coreByPart.get(n.id) || [];
      return `<li><a href="#${esc(n.id)}"><b>${esc(partWord(n))}</b> ${esc(n.title)}</a>` +
        (here.length ? `<ul>${here.map(instLi).join('')}</ul>` : '') + '</li>';
    }).join('') + '</ol>' +
    (noPart.length ? `<p class="hp-k">Core instruments with no part of the brief recorded</p><ul>${noPart.map(instLi).join('')}</ul>` : '') +
    ['mapped', 'watched', 'excluded'].map((k) => `<p class="hp-k">${k} · ${outer[k].length}</p><p class="hp-list-names">${outer[k].map((i) => esc(i.short_name) + (counted.has(i.id) ? ` (adjacent, ${esc(taxLabel(ix, statusPart(i)) || 'status not recorded')})` : '')).join(' · ')}</p>`).join('') +
    '</div>';
  if (window.matchMedia('(max-width: 640px)').matches) list.open = true;
  const cta = portal && portal.querySelector('.portal-cta');
  (cta || mount).after(list);
  toRemove.push(list);

  /* ---- an edition says, in English, that the figure is English (a line, not a translation, and not a data-i18n key) */
  if (document.documentElement.lang !== 'en') {
    const note = document.createElement('p');
    note.className = 'hp-edition-note';
    note.setAttribute('lang', 'en');
    note.textContent = 'This figure is in English.';
    mount.after(note);
    toRemove.push(note);
  }

  /* ---- the parts already read are lit (app.js's eupolicy:progress and its progress:changed event; no change to app.js) */
  const readSet = (visited) => {
    if (visited && typeof visited.has === 'function') return visited;
    try { return new Set(JSON.parse(store.get(PROGRESS_KEY) || '[]')); } catch (e) { return new Set(); }
  };
  function paintRead(seen) {
    for (const { n, el } of treeEls) {
      const r = seen.has(n.id);
      el.classList.toggle('read', r);
      el.setAttribute('aria-label', nodeName(n) + (r ? ' — already read' : ''));
    }
  }
  paintRead(readSet());
  document.addEventListener('progress:changed', (e) => paintRead(readSet(e.detail && e.detail.visited)));

  /* ---- labels: a greedy pass that moves a label which would sit on a mark or on another label (HP-02).
     It measures every label and mark in BOTH lens states (the due dates widen a label), then tries small shifts of each core
     and ring label in order of distance and keeps the first that clears everything by MARGIN units. Placement only: nothing here
     reads or writes data. The clearance is the flat 3 units HP-02 measured; the depth by layers of HP-02b is not in this release. */
  function settleLabels() {
    const MARGIN = 3, MAXMOVE = 26, lensOn = fig.classList.contains('lens-due');
    const marks = [...fig.querySelectorAll('a.mk, g.dot-g .mk-in, g.dot-g circle.duering')];
    const texts = [...fig.querySelectorAll('text.lb, text.ring-lb, text.cap')];
    const box = new Map();
    for (const on of [false, true]) {
      fig.classList.toggle('lens-due', on);
      for (const e of [...marks, ...texts]) {
        const b = e.getBBox(); if (!b.width && !b.height) continue;          // not rendered in this state
        const o = { x: b.x, y: b.y, r: b.x + b.width, b: b.y + b.height }, u = box.get(e);
        box.set(e, u ? { x: Math.min(u.x, o.x), y: Math.min(u.y, o.y), r: Math.max(u.r, o.r), b: Math.max(u.b, o.b) } : o);
      }
    }
    fig.classList.toggle('lens-due', lensOn);
    const hit = (a, b) => a.x < b.r + MARGIN && b.x < a.r + MARGIN && a.y < b.b + MARGIN && b.y < a.b + MARGIN;
    const shifted = (b, dx, dy) => ({ x: b.x + dx, y: b.y + dy, r: b.r + dx, b: b.b + dy });
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
      if (!pick) continue;                                                // left where it was: the one the author chose to leave is Digital Networks Act
      if (pick[0] || pick[1]) {
        m.el.setAttribute('x', String(+m.el.getAttribute('x') + pick[0])); m.el.setAttribute('y', String(+m.el.getAttribute('y') + pick[1]));
        box.set(m.el, shifted(b0, pick[0], pick[1]));
      }
    }
  }

  /* ---- show the stage. Layout is needed to measure a label (getBBox), so the stage is laid out, but not yet seen,
     while the labels settle; the published figure is hidden only now that this one exists. If anything below
     throws, the page goes back to today's. */
  const showStage = () => { stage.hidden = false; stage.classList.add('hp-settling'); if (portal) portal.classList.add('has-figure'); };
  const undo = () => {
    stage.hidden = true; stage.classList.remove('hp-settling', 'hp-opening'); stage.replaceChildren();
    if (portal) portal.classList.remove('has-figure');
    toRemove.forEach((n) => n.remove());
  };

  /* ---- play the opening once, or show the figure as it ends */
  let raf = 0, stopWatching = null, stopSkip = null;
  function finish() {
    cancelAnimationFrame(raf); raf = 0;
    if (stopWatching) { stopWatching(); stopWatching = null; }
    if (stopSkip) { stopSkip(); stopSkip = null; }
    frame(END + 1);
    L.mark.replaceChildren(); mark = null;                  // the pictures leave with the opening
    stage.classList.remove('hp-opening'); openingOn = false;
  }
  function play() {
    mark = buildMark();
    openingOn = true; stage.classList.add('hp-opening');
    /* the body picture follows the site's theme while it is on screen: the toggle sets body[data-theme] and dispatches nothing */
    const obs = new MutationObserver(() => { if (mark) mark.body.setAttribute('href', bodyHref()); });
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    stopWatching = () => obs.disconnect();
    const skip = () => { if (raf) finish(); };
    window.addEventListener('keydown', skip); window.addEventListener('pointerdown', skip);
    stopSkip = () => { window.removeEventListener('keydown', skip); window.removeEventListener('pointerdown', skip); };
    const t0 = performance.now();
    const step = (now) => {
      const t = (now - t0) / 1000;
      if (t >= END + 0.6) { finish(); return; }
      frame(t);
      raf = requestAnimationFrame(step);
    };
    frame(0);
    raf = requestAnimationFrame(step);
  }

  try {
    showStage();
    try { await document.fonts.ready; settleLabels(); }
    catch (e) { console.error('[home] label placement failed', e); }   // the figure stands, its labels as first placed
    stage.classList.remove('hp-settling');
    if (reduceMotion() || store.get(INTRO_KEY)) finish();
    else { store.set(INTRO_KEY, '1'); play(); }
    built = true;
    decorate();                                                         // the masthead's marks, if the masthead is already there
  } catch (e) {
    undo();
    throw e;
  }
  return true;
}
