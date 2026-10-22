/* ============================================================
   The dataset explorer — datasets.html.

   Every other page renders the records into an argument, a register or
   a comparison. This one shows them as they are written: one file, one
   record at a time, as a graph of cards in the manner of a JSON viewer,
   as a tree, or as the raw text. It is read-only, and it shows only the
   files every other page already fetches from data/.

   What the graph does and does not say is decided in js/json-graph.js:
   solid lines are nesting inside one record; a reference is a string
   that is exactly another record's id, named by the field holding it,
   with no claim about what the link means. The one derived fact shown
   — a claim's evidence grade — comes from js/evidence-view.js, the one
   evidence renderer, and is labelled as computed rather than stored.

   Failure is per file. A file that does not load or does not parse is
   reported by name and the others stay usable; references into it then
   read as plain strings, and the page says why. Nothing is substituted.
   ============================================================ */

import { load, index, label as taxLabel, renderError } from './data.js';
import { gradeChip } from './evidence-view.js';
import { href, instrumentHref } from './routes.js';
import * as G from './json-graph.js';

const $ = (sel, root = document) => root.querySelector(sel);
const SVGNS = 'http://www.w3.org/2000/svg';

const el = (tag, attrs, kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'text') n.textContent = v;
    else n.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of kids || []) if (c != null) n.append(c);
  return n;
};
const svg = (tag, attrs, kids) => {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null) continue;
    if (k === 'text') n.textContent = v;
    else n.setAttribute(k, String(v));
  }
  for (const c of kids || []) if (c != null) n.append(c);
  return n;
};

const VIEWS = [
  { id: 'structure', label: 'Structure' },
  { id: 'references', label: 'References' },
  { id: 'tree', label: 'Tree' },
  { id: 'raw', label: 'Raw JSON' },
];
const LIST_CAP = 300;
const PANEL_CAP = 200;

const S = {
  docs: {},          // name → parsed file
  failed: {},        // name → Error
  described: {},     // name → G.describe()
  refs: new Map(),
  into: new Map(),
  ix: null,
  state: { d: null, c: null, r: null, v: 'structure', q: '' },
  view: null,        // the live canvas, while one is shown
  notice: null,      // what the address asked for and could not be given
};

/* ---------------------------------------------------------- state ⇄ address */

function readState() {
  const p = new URLSearchParams(location.search);
  const v = p.get('v');
  return {
    d: p.get('d'), c: p.get('c'), r: p.get('r'),
    v: VIEWS.some((x) => x.id === v) ? v : 'structure',
    q: '',
  };
}

const linkFor = (st) => {
  const p = new URLSearchParams();
  if (st.d) p.set('d', st.d);
  if (st.c) p.set('c', st.c);
  if (st.r) p.set('r', st.r);
  if (st.v && st.v !== 'structure') p.set('v', st.v);
  return '?' + p.toString();
};

function go(next, { push = true, focus = false } = {}) {
  S.state = { ...S.state, ...next };
  normalise();
  const url = linkFor(S.state);
  if (url !== location.search) history[push ? 'pushState' : 'replaceState'](null, '', url || location.pathname);
  render({ focus });
}

/* Fill in what the address leaves out, and never invent what it names:
   a record key that is not in the file stays as asked, and is reported. */
function normalise() {
  const st = S.state;
  if (!st.d || !G.DATASETS.some((x) => x.name === st.d)) st.d = G.DATASETS.find((x) => S.described[x.name]?.ok)?.name || G.DATASETS[0].name;
  const d = S.described[st.d];
  if (!d || !d.ok) { st.c = null; st.r = null; return; }
  if (st.c && !d.collections.some((c) => c.key === st.c)) {
    S.notice = 'There is no collection “' + st.c + '” in ' + st.d + '.json; showing its first collection instead.';
  }
  if (!st.c || !d.collections.some((c) => c.key === st.c)) { st.c = d.collections[0].key; st.r = null; }
  const col = d.collections.find((c) => c.key === st.c);
  if (!st.r && col.records.length) st.r = G.recordKey(col.records[0], 0);
}

/* A link to a record inside the explorer. Ordinary <a href>, so it opens
   in a new tab and survives copy-paste; a plain click stays in place. */
function recordLink(target, text, cls) {
  const st = { d: target.dataset, c: target.collection, r: target.record, v: S.state.v };
  const a = el('a', { href: linkFor(st), class: cls || 'dx-link', 'data-dx': JSON.stringify(st) });
  a.textContent = text;
  return a;
}

document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[data-dx]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  go(JSON.parse(a.getAttribute('data-dx')), { focus: true });
});
window.addEventListener('popstate', () => { S.state = readState(); normalise(); render({}); });

/* ---------------------------------------------------------- where a record is shown

   Only the pages that give a record an anchor of its own, checked by the
   browser suite: an instrument's page, and the bibliography, enforcement
   and institutions registers, whose entries carry the record's id. */
function canonicalHref(dataset, key) {
  if (dataset === 'instruments' && S.ix && S.ix.instrument.has(key)) return instrumentHref(key, S.ix);
  if (dataset === 'sources') return href('bibliography.html#' + encodeURIComponent(key));
  if (dataset === 'enforcement') return href('enforcement.html#' + encodeURIComponent(key));
  if (dataset === 'institutions') return href('institutions.html#' + encodeURIComponent(key));
  return null;
}

/* a taxonomy label, or the id itself when the index could not be built */
const tl = (id) => (S.ix ? taxLabel(S.ix, id) : id);

const titleOf = (name) => (G.DATASETS.find((x) => x.name === name) || { title: name }).title;

/* ---------------------------------------------------------- controls */

function renderControls() {
  const host = $('#dxControls');
  host.textContent = '';
  const st = S.state;
  const dsSel = el('select', { id: 'dx-d' }, G.DATASETS.map((x) => el('option', {
    value: x.name, selected: x.name === st.d,
    text: x.title + (S.failed[x.name] ? ' — could not be loaded' : ''),
  })));
  dsSel.addEventListener('change', () => go({ d: dsSel.value, c: null, r: null, q: '' }));
  host.append(el('span', { class: 'flt' }, [el('label', { for: 'dx-d', text: 'File' }), dsSel]));

  const d = S.described[st.d];
  if (d && d.ok && d.collections.length > 1) {
    const cSel = el('select', { id: 'dx-c' }, d.collections.map((c) => el('option', {
      value: c.key, selected: c.key === st.c, text: c.key + ' (' + c.records.length + ')',
    })));
    cSel.addEventListener('change', () => go({ c: cSel.value, r: null, q: '' }));
    host.append(el('span', { class: 'flt' }, [el('label', { for: 'dx-c', text: 'Collection' }), cSel]));
  }

  const tabs = el('div', { class: 'dx-views', role: 'group', 'aria-label': 'How to show the record' });
  for (const v of VIEWS) {
    const b = el('button', { type: 'button', class: 'dx-view', 'aria-pressed': v.id === st.v ? 'true' : 'false', text: v.label });
    b.addEventListener('click', () => go({ v: v.id }, { push: false }));
    tabs.append(b);
  }
  host.append(tabs);
}

/* ---------------------------------------------------------- the file */

function fileCard(name) {
  const d = S.described[name];
  const box = el('div', { class: 'dx-file' });
  box.append(el('h2', { class: 'dx-file-name' }, [el('code', { text: 'data/' + name + '.json' })]));
  box.append(el('p', { class: 'dx-file-name' }, [el('a', { href: href('data/' + name + '.json'), class: 'dx-raw-link', text: 'Open the raw file' })]));
  const meta = new Map(d.meta);
  const facts = el('dl', { class: 'dx-facts' });
  for (const [k, lab] of [['$schema_version', 'Schema version'], ['$last_verified', '$last_verified in the file header']]) {
    if (meta.has(k)) facts.append(el('div', {}, [el('dt', { text: lab }), el('dd', { text: String(meta.get(k)) })]));
  }
  /* The header date is one stamp for the whole file (docs/AUDIT-2026-09-01.md
     F-13); records re-checked since carry their own. Show both, named, so the
     header is not read as the age of every record. */
  let dated = 0, total = 0, newest = '';
  for (const c of d.collections) for (const r of c.records) {
    total += 1;
    if (r && typeof r.last_verified === 'string') { dated += 1; if (r.last_verified > newest) newest = r.last_verified; }
  }
  if (dated) {
    facts.append(el('div', {}, [el('dt', { text: 'last_verified on the records' }),
      el('dd', { text: dated + ' of ' + total + ' records carry their own; the newest is ' + newest })]));
  }
  facts.append(el('div', {}, [el('dt', { text: 'Records' }),
    el('dd', { text: G.countText(d) })]));
  box.append(facts);
  if (typeof meta.get('$description') === 'string') box.append(el('p', { class: 'dx-desc', text: meta.get('$description') }));
  const rest = d.meta.filter(([k]) => !['$schema_version', '$last_verified', '$description'].includes(k));
  if (rest.length) {
    const det = el('details', { class: 'dx-more' }, [el('summary', { text: 'The file’s own notes (' + rest.map(([k]) => k).join(', ') + ')' })]);
    for (const [k, v] of rest) {
      det.append(el('h3', { class: 'dx-meta-k', text: k }));
      det.append(typeof v === 'string' ? el('p', { class: 'dx-desc', text: v }) : tree(v, null));
    }
    box.append(det);
  }
  if (d.other.length) {
    box.append(el('p', { class: 'dx-note', text: 'Also at the top level, outside any collection: ' + d.other.map(([k]) => k).join(', ') + '. Shown in the raw file.' }));
  }
  return box;
}

function recordList(name) {
  const d = S.described[name];
  const st = S.state;
  const col = d.collections.find((c) => c.key === st.c);
  const wrap = el('div', { class: 'dx-list' });
  const q = el('input', { type: 'search', id: 'dx-q', placeholder: 'id, name or any value', autocomplete: 'off', value: st.q || '' });
  const count = el('p', { class: 'dx-count', 'aria-live': 'polite' });
  const ul = el('ul', { class: 'dx-records' });
  const fill = () => {
    st.q = q.value;
    ul.textContent = '';
    const hits = [];
    col.records.forEach((rec, i) => { if (G.recordMatches(rec, q.value)) hits.push([rec, i]); });
    for (const [rec, i] of hits.slice(0, LIST_CAP)) {
      const key = G.recordKey(rec, i);
      const a = recordLink({ dataset: name, collection: col.key, record: key }, '', 'dx-rec');
      a.append(el('span', { class: 'dx-rec-id', text: key }));
      const lab = G.recordLabel(rec);
      if (lab) a.append(el('span', { class: 'dx-rec-label', text: lab }));
      if (key === st.r) a.setAttribute('aria-current', 'true');
      ul.append(el('li', {}, [a]));
    }
    count.textContent = hits.length === col.records.length
      ? col.records.length + (col.records.length === 1 ? ' record' : ' records')
      : hits.length + ' of ' + col.records.length + ' records match';
    if (hits.length > LIST_CAP) count.textContent += ' — the first ' + LIST_CAP + ' are listed; narrow the search to reach the rest';
    if (!col.records.length) ul.append(el('li', { class: 'dx-empty', text: 'This collection holds no records.' }));
    else if (!hits.length) ul.append(el('li', { class: 'dx-empty', text: 'No record in this collection contains that text.' }));
  };
  q.addEventListener('input', fill);
  wrap.append(el('label', { for: 'dx-q', class: 'dx-label', text: 'Find a record in ' + col.key }), q, count, ul);
  fill();
  return wrap;
}

/* ---------------------------------------------------------- the record */

function renderStage(name, { focus }) {
  const stage = el('section', { class: 'dx-stage', 'aria-labelledby': 'dx-rec-h' });
  const st = S.state;
  const d = S.described[name];
  const hit = G.findRecord(d, st.c, st.r);
  const h = el('h2', { id: 'dx-rec-h', tabindex: '-1' });
  stage.append(h);
  if (!hit) {
    h.textContent = 'No record to show';
    const col = d.collections.find((c) => c.key === st.c);
    stage.append(el('p', { class: 'dx-note', text: col && col.records.length
      ? 'There is no record “' + st.r + '” in ' + st.c + '. It may have been renamed or removed; nothing has been substituted for it. Choose one from the list.'
      : 'This collection holds no records.' }));
    return stage;
  }
  const rec = hit.record;
  h.append(el('span', { class: 'dx-crumb', text: titleOf(name) + ' › ' + st.c + ' › ' }), el('span', { text: st.r }));
  const lab = G.recordLabel(rec);
  if (lab) stage.append(el('p', { class: 'dx-rec-name', text: lab }));

  const where = canonicalHref(name, st.r);
  if (where) stage.append(el('p', { class: 'dx-where' }, ['Shown on the site: ', el('a', { href: where, text: where.replace(/^(\.\.\/)+/, '') })]));
  if (name === 'claims' && S.ix) {
    const g = el('div', { class: 'dx-derived' });
    g.innerHTML = gradeChip(rec, S.ix, true);
    g.prepend(el('b', { text: 'Evidence grade, computed on this load — not stored in claims.json: ' }));
    stage.append(g);
  }

  const body = el('div', { class: 'dx-body' });
  stage.append(body);
  S.view = null;
  if (st.v === 'structure') body.append(structureView(rec, st.r));
  else if (st.v === 'references') body.append(referencesView(name, rec));
  else if (st.v === 'tree') body.append(el('div', { class: 'dx-tree-wrap' }, [tree(rec, null)]));
  else body.append(rawView(rec));

  stage.append(referencePanel(name, rec));
  if (focus) queueMicrotask(() => h.focus());
  return stage;
}

/* ---------------------------------------------------------- the canvas

   An SVG world inside a fixed frame. Drag to pan; ctrl/⌘ + wheel, or a
   pinch, to zoom about the pointer. A plain wheel scrolls the page, so
   the frame never traps a reader scrolling past it. The transform is an
   SVG attribute, which the style-src policy does not govern. */

function canvas(width, height, ariaLabel) {
  const frame = el('div', { class: 'dx-canvas', tabindex: '0', role: 'region', 'aria-label': ariaLabel + '. Arrow keys pan, plus and minus zoom, 0 fits.' });
  const root = svg('svg', { class: 'dx-svg', role: 'group', 'aria-label': ariaLabel });
  const world = svg('g', {});
  root.append(world);
  frame.append(root);
  const v = { k: 1, x: 0, y: 0, width, height, frame, world };
  const apply = () => world.setAttribute('transform', 'translate(' + v.x.toFixed(1) + ' ' + v.y.toFixed(1) + ') scale(' + v.k.toFixed(4) + ')');
  const clampK = (k) => Math.min(3, Math.max(0.1, k));
  v.zoomAt = (factor, cx, cy) => {
    const k = clampK(v.k * factor);
    v.x = cx - (cx - v.x) * (k / v.k);
    v.y = cy - (cy - v.y) * (k / v.k);
    v.k = k; apply();
  };
  v.fit = () => {
    const fw = frame.clientWidth || 800, fh = frame.clientHeight || 500, pad = 24;
    v.k = clampK(Math.min(1, (fw - pad * 2) / Math.max(1, v.width), (fh - pad * 2) / Math.max(1, v.height)));
    v.x = (fw - v.width * v.k) / 2; v.y = (fh - v.height * v.k) / 2; apply();
  };
  /* a record too large to read when fitted opens at reading size on its first card */
  v.start = (focusBox) => {
    const fw = frame.clientWidth || 800, fh = frame.clientHeight || 500;
    const fitK = Math.min(1, (fw - 48) / Math.max(1, v.width), (fh - 48) / Math.max(1, v.height));
    if (fitK >= 0.6 || !focusBox) { v.fit(); return; }
    v.k = 0.9; v.x = 24 - focusBox.x * v.k; v.y = fh / 2 - (focusBox.y + focusBox.h / 2) * v.k; apply();
  };
  v.centreOn = (box) => {
    const fw = frame.clientWidth || 800, fh = frame.clientHeight || 500;
    v.k = Math.max(v.k, 0.8);
    v.x = fw / 2 - (box.x + box.w / 2) * v.k; v.y = fh / 2 - (box.y + box.h / 2) * v.k; apply();
  };

  const pts = new Map();
  let pinch = null;
  root.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a')) return;
    root.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    frame.classList.add('is-panning');
  });
  root.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const r = root.getBoundingClientRect();
      if (pinch) v.zoomAt(dist / pinch, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      pinch = dist;
      return;
    }
    v.x += e.clientX - prev.x; v.y += e.clientY - prev.y; apply();
  });
  const up = (e) => { pts.delete(e.pointerId); pinch = null; if (!pts.size) frame.classList.remove('is-panning'); };
  root.addEventListener('pointerup', up);
  root.addEventListener('pointercancel', up);
  root.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const r = root.getBoundingClientRect();
    v.zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  frame.addEventListener('keydown', (e) => {
    if (e.target !== frame) return;
    const step = 48, cx = frame.clientWidth / 2, cy = frame.clientHeight / 2;
    const act = { ArrowLeft: () => { v.x += step; apply(); }, ArrowRight: () => { v.x -= step; apply(); },
      ArrowUp: () => { v.y += step; apply(); }, ArrowDown: () => { v.y -= step; apply(); },
      '+': () => v.zoomAt(1.2, cx, cy), '=': () => v.zoomAt(1.2, cx, cy), '-': () => v.zoomAt(1 / 1.2, cx, cy), '0': () => v.fit() }[e.key];
    if (act) { e.preventDefault(); act(); }
  });
  apply();
  return v;
}

function zoomBar(v, extra) {
  const bar = el('div', { class: 'dx-zoom', role: 'group', 'aria-label': 'Zoom' });
  const btn = (text, label, fn) => {
    const b = el('button', { type: 'button', class: 'dx-zbtn', 'aria-label': label, text });
    b.addEventListener('click', fn);
    return b;
  };
  const mid = () => [v.frame.clientWidth / 2, v.frame.clientHeight / 2];
  bar.append(
    btn('−', 'Zoom out', () => v.zoomAt(1 / 1.25, ...mid())),
    btn('+', 'Zoom in', () => v.zoomAt(1.25, ...mid())),
    btn('Fit', 'Fit the whole graph in view', () => v.fit()),
  );
  for (const x of extra || []) bar.append(x);
  return bar;
}

const edgePath = (e) => {
  const mx = (e.x1 + e.x2) / 2;
  return 'M' + e.x1 + ' ' + e.y1 + ' C' + mx + ' ' + e.y1 + ' ' + mx + ' ' + e.y2 + ' ' + e.x2 + ' ' + e.y2;
};

function structureView(rec, key) {
  const graph = G.structureGraph(rec, { title: key, refs: S.refs });
  const L = G.layout(graph);
  const m = G.METRICS;
  const v = canvas(L.width, L.height, 'Structure of record ' + key + ': ' + L.nodes.length + (L.nodes.length === 1 ? ' card' : ' cards'));
  const byId = new Map(L.nodes.map((n) => [n.id, n]));
  const gEdges = svg('g', { class: 'dx-edges' });
  for (const e of L.edges) gEdges.append(svg('path', { class: 'dx-edge', d: edgePath(e) }));
  const gNodes = svg('g', {});
  const nodeEls = new Map();
  for (const n of L.nodes) {
    const g = svg('g', { class: 'dx-node' + (n.depth === 0 ? ' is-root' : ''), transform: 'translate(' + n.x + ' ' + n.y + ')' });
    g.append(svg('rect', { class: 'dx-card', width: n.w, height: n.h, rx: 2 }));
    g.append(svg('text', { class: 'dx-title', x: m.padX, y: 17, text: G.clip(n.title, Math.floor((n.w - m.padX * 2) / m.char)) }));
    g.append(svg('line', { class: 'dx-sep', x1: 0, x2: n.w, y1: m.head - 4, y2: m.head - 4 }));
    n.rows.forEach((r, i) => {
      const y = m.head + i * m.row + 13;
      const t = svg('text', { class: 'dx-row', x: m.padX, y });
      if (r.key) t.append(svg('tspan', { class: 'dx-k', text: G.clip(r.key, G.LIMITS.maxKey) }), svg('tspan', { class: 'dx-p', text: ': ' }));
      const val = svg('tspan', { class: 'dx-v t-' + r.type, text: (r.type === 'ref' ? '→ ' : '') + r.text });
      t.append(val);
      const tip = r.type === 'vocab' ? r.full + ' — ' + (tl(r.full) || 'vocabulary term')
        : r.type === 'ref' ? r.full + ' — ' + titleOf(r.target.dataset).toLowerCase() + ' record' + (r.target.label ? ': ' + r.target.label : '')
          : r.full;
      if (tip) t.append(svg('title', { text: (r.path ? r.path + ' = ' : '') + tip }));
      if (r.type === 'ref') {
        const st = { d: r.target.dataset, c: r.target.collection, r: r.target.record, v: S.state.v };
        const a = svg('a', { href: linkFor(st), 'data-dx': JSON.stringify(st), class: 'dx-svg-ref' });
        a.append(t);
        g.append(a);
      } else g.append(t);
    });
    gNodes.append(g);
    nodeEls.set(n.id, g);
  }
  v.world.append(gEdges, gNodes);

  /* search inside the record */
  const q = el('input', { type: 'search', class: 'dx-find', placeholder: 'Find in this record', 'aria-label': 'Find in this record', autocomplete: 'off' });
  const out = el('span', { class: 'dx-find-n', 'aria-live': 'polite' });
  const next = el('button', { type: 'button', class: 'dx-zbtn', text: 'Next', disabled: true });
  let hits = [], at = -1;
  q.addEventListener('input', () => {
    for (const g of nodeEls.values()) g.classList.remove('is-hit', 'is-current');
    hits = G.matchNodes(graph, q.value);
    at = -1;
    for (const id of hits) nodeEls.get(id).classList.add('is-hit');
    out.textContent = q.value.trim() ? (hits.length ? hits.length + (hits.length === 1 ? ' card matches' : ' cards match') : 'no card matches') : '';
    next.disabled = !hits.length;
    if (hits.length) step();
  });
  const step = () => {
    if (at >= 0) nodeEls.get(hits[at]).classList.remove('is-current');
    at = (at + 1) % hits.length;
    nodeEls.get(hits[at]).classList.add('is-current');
    v.centreOn(byId.get(hits[at]));
  };
  next.addEventListener('click', step);
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter' && hits.length) { e.preventDefault(); step(); } });

  const wrap = el('div', { class: 'dx-viewer' }, [zoomBar(v, [q, next, out]), v.frame]);
  if (graph.truncated) wrap.append(el('p', { class: 'dx-note', text: 'This record is larger than the graph draws (' + G.LIMITS.maxNodes + ' cards). The rows marked “not drawn” are complete in the Tree and Raw JSON views.' }));
  wrap.append(legend('structure'));
  S.view = v;
  requestAnimationFrame(() => v.start(L.nodes[0]));
  return wrap;
}

function referencesView(name, rec) {
  const st = S.state;
  const outgoing = G.referencesIn(rec, S.refs);
  const incoming = S.into.get(st.r) || [];
  const RG = G.referenceGraph({ dataset: name, collection: st.c, record: st.r, label: G.recordLabel(rec) }, outgoing, incoming);
  const v = canvas(RG.width, RG.height, 'References to and from record ' + st.r);
  const gE = svg('g', {});
  for (const e of RG.edges) {
    gE.append(svg('path', { class: 'dx-redge is-' + e.side, d: edgePath(e) }));
    /* beside the outer card, not at the middle: the middles converge on
       the centre card and the labels would print over each other */
    const atIn = e.side === 'in';
    gE.append(svg('text', { class: 'dx-elabel', x: atIn ? e.x1 + 6 : e.x2 - 6, y: (atIn ? e.y1 : e.y2) - 4,
      'text-anchor': atIn ? 'start' : 'end', text: G.clip(e.label, 28) }, [svg('title', { text: e.label })]));
  }
  const card = (c, centre) => {
    const g = svg('g', { class: 'dx-rcard' + (centre ? ' is-centre' : ''), transform: 'translate(' + c.x + ' ' + c.y + ')' });
    g.append(svg('rect', { class: 'dx-card', width: c.w, height: c.h, rx: 2 }));
    g.append(svg('text', { class: 'dx-rds', x: 10, y: 15, text: titleOf(c.dataset) + (c.collection !== c.dataset ? ' · ' + c.collection : '') }));
    g.append(svg('text', { class: 'dx-rid', x: 10, y: 31, text: G.clip(c.record, 36) }));
    if (c.label) g.append(svg('text', { class: 'dx-rlabel', x: 10, y: centre ? 49 : 42, text: G.clip(c.label, 38) }));
    if (centre) return g;
    const st2 = { d: c.dataset, c: c.collection, r: c.record, v: 'references' };
    const a = svg('a', { href: linkFor(st2), 'data-dx': JSON.stringify(st2), class: 'dx-svg-ref', 'aria-label': titleOf(c.dataset) + ' record ' + c.record });
    a.append(g);
    return a;
  };
  const gN = svg('g', {});
  gN.append(card(RG.center, true));
  for (const c of RG.cards) gN.append(card(c, false));
  v.world.append(gE, gN);
  const wrap = el('div', { class: 'dx-viewer' }, [zoomBar(v), v.frame]);
  const vocab = outgoing.filter((r) => r.target.vocabulary).length;
  const notes = [];
  if (!RG.totals.in && !RG.totals.out) notes.push('No other record in the loaded files is named by this one, and none names it.');
  if (RG.omitted.in || RG.omitted.out) notes.push('The graph draws ' + RG.cap + ' records per side; ' +
    [RG.omitted.in && RG.omitted.in + ' more name this record', RG.omitted.out && RG.omitted.out + ' more are named by it'].filter(Boolean).join(' and ') +
    '. All are listed below.');
  if (vocab) notes.push(vocab + (vocab === 1 ? ' controlled-vocabulary term is' : ' controlled-vocabulary terms are') + ' not drawn; the Structure and Tree views label them in place.');
  for (const n of notes) wrap.append(el('p', { class: 'dx-note', text: n }));
  wrap.append(legend('references'));
  S.view = v;
  requestAnimationFrame(() => v.fit());
  return wrap;
}

function legend(kind) {
  const sample = (cls) => {
    const s = svg('svg', { class: 'dx-lg-line', width: 36, height: 10, 'aria-hidden': 'true' });
    s.append(svg('path', { class: cls, d: 'M2 5 L34 5' }));
    return s;
  };
  const items = kind === 'structure'
    ? [[sample('dx-edge'), 'Nesting: an object or list held inside this record. It is how the file is written, not a relationship between records.'],
      [el('span', { class: 'dx-lg-ref', text: '→ id' }), 'A reference: the value is exactly the id of another record. Follow it to open that record. The file states the id, not what the link means.'],
      [el('span', { class: 'dx-lg-null', text: 'null' }), 'Written as null in the file. A field absent from a record is not drawn at all; absence is not a value.']]
    : [[sample('dx-redge is-out'), 'Right: records this one names. The label is the field that holds the id.'],
      [sample('dx-redge is-in'), 'Left: records that name this one, across every loaded file.']];
  const dl = el('ul', { class: 'dx-legend' });
  for (const [k, t] of items) dl.append(el('li', {}, [k, el('span', { text: t })]));
  return dl;
}

/* ---------------------------------------------------------- tree and raw */

function scalar(v, key) {
  if (v === null) return el('span', { class: 'dx-v t-null', text: 'null' });
  if (typeof v !== 'string') return el('span', { class: 'dx-v t-' + typeof v, text: String(v) });
  const t = G.resolve(S.refs, key, v);
  if (t && t.vocabulary) {
    return el('span', {}, [el('span', { class: 'dx-v t-vocab', text: '"' + v + '"' }), el('span', { class: 'dx-tax', text: tl(v) })]);
  }
  if (t) {
    return el('span', {}, [el('span', { class: 'dx-v t-string', text: '"' + v + '"' }), ' ',
      recordLink(t, '→ ' + titleOf(t.dataset).toLowerCase() + ' record' + (t.path.length ? ' (inside ' + t.record + ')' : ''), 'dx-link')]);
  }
  return el('span', { class: 'dx-v t-string', text: '"' + v + '"' });
}

function tree(value, key, depth = 0) {
  const ul = el('ul', { class: depth ? 'dx-tree-sub' : 'dx-tree' });
  const entries = Array.isArray(value) ? value.map((x, i) => [i, x]) : Object.entries(value || {});
  if (!entries.length) ul.append(el('li', { class: 'dx-empty', text: Array.isArray(value) ? 'empty array' : 'empty object' }));
  for (const [k, x] of entries) {
    const name = typeof k === 'number' ? '[' + k + ']' : k;
    const refKey = typeof k === 'number' ? key : k;
    if (x !== null && typeof x === 'object') {
      const n = Array.isArray(x) ? x.length + (x.length === 1 ? ' item' : ' items') : Object.keys(x).length + ' fields';
      const det = el('details', { open: true }, [el('summary', {}, [el('span', { class: 'dx-k', text: name }), ' ', el('span', { class: 'dx-meta', text: n })])]);
      det.append(tree(x, refKey, depth + 1));
      ul.append(el('li', {}, [det]));
    } else {
      ul.append(el('li', {}, [el('span', { class: 'dx-k', text: name }), el('span', { class: 'dx-p', text: ': ' }), scalar(x, refKey)]));
    }
  }
  return ul;
}

function rawView(rec) {
  const text = JSON.stringify(rec, null, 2);
  const pre = el('pre', { class: 'dx-raw', tabindex: '0' }, [el('code', { text })]);
  const status = el('span', { class: 'dx-find-n', 'aria-live': 'polite' });
  const copy = el('button', { type: 'button', class: 'dx-zbtn', text: 'Copy' });
  copy.addEventListener('click', () => {
    try {
      navigator.clipboard.writeText(text).then(() => { status.textContent = 'Copied.'; }, () => { status.textContent = 'Copying was refused by the browser; select the text instead.'; });
    } catch (e) { status.textContent = 'Copying is not available here; select the text instead.'; }
  });
  return el('div', { class: 'dx-viewer' }, [el('div', { class: 'dx-zoom' }, [copy, status]), pre,
    el('p', { class: 'dx-note', text: 'The record exactly as it parses from the file, re-indented. Key order is the file’s.' })]);
}

/* ---------------------------------------------------------- references, listed

   The accessible form of the reference graph, and the complete one: the
   canvas stops at a cap, these lists stop only at a much larger one,
   and say so when they do. */

function referencePanel(name, rec) {
  const st = S.state;
  const box = el('section', { class: 'dx-refs', 'aria-label': 'References' });
  const outgoing = G.referencesIn(rec, S.refs).filter((r) => !r.target.vocabulary);
  const incoming = S.into.get(st.r) || [];
  const list = (items, mk) => {
    const ul = el('ul', { class: 'dx-reflist' });
    for (const x of items.slice(0, PANEL_CAP)) ul.append(mk(x));
    if (items.length > PANEL_CAP) ul.append(el('li', { class: 'dx-empty', text: (items.length - PANEL_CAP) + ' more not listed.' }));
    return ul;
  };
  /* a record can be named from several fields: count both, and say which is which */
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const distinct = (xs, key) => new Set(xs.map(key)).size;
  const nOut = distinct(outgoing, (r) => r.target.dataset + '/' + r.target.record);
  const nIn = distinct(incoming, (r) => r.dataset + '/' + r.record);
  box.append(el('h3', { text: 'Names ' + plural(nOut, 'record', 'records') + ', in ' + plural(outgoing.length, 'field', 'fields') }));
  box.append(outgoing.length
    ? list(outgoing, (r) => el('li', {}, [el('code', { text: r.path }), ' → ', recordLink(r.target, r.id), r.target.label ? el('span', { class: 'dx-rec-label', text: r.target.label }) : null]))
    : el('p', { class: 'dx-empty', text: 'This record holds no id of another record.' }));
  box.append(el('h3', { text: 'Named by ' + plural(nIn, 'record', 'records') + ', in ' + plural(incoming.length, 'field', 'fields') }));
  box.append(incoming.length
    ? list(incoming, (r) => el('li', {}, [recordLink(r, r.record), ' ', el('span', { class: 'dx-meta', text: titleOf(r.dataset) + ', field ' + r.path }), r.label ? el('span', { class: 'dx-rec-label', text: r.label }) : null]))
    : el('p', { class: 'dx-empty', text: 'No record in the loaded files holds this record’s id.' }));
  const down = Object.keys(S.failed);
  if (down.length) box.append(el('p', { class: 'dx-note', text: 'Incomplete: ' + down.map((n) => n + '.json').join(', ') + ' could not be loaded, so references into and out of ' + (down.length === 1 ? 'it' : 'them') + ' are not counted.' }));
  return box;
}

/* ---------------------------------------------------------- the page */

function renderStats() {
  const host = $('#dxStats');
  if (!host) return;
  const ok = G.DATASETS.filter((x) => S.described[x.name]?.ok).length;
  const recs = G.DATASETS.reduce((s, x) => s + (S.described[x.name]?.ok ? S.described[x.name].collections.reduce((t, c) => t + c.records.length, 0) : 0), 0);
  const parts = [[ok + ' of ' + G.DATASETS.length, ' files loaded'], [String(recs), ' records'], [String(S.refs.size), ' addressable ids']];
  host.textContent = '';
  for (const [b, t] of parts) host.append(el('span', {}, [el('b', { text: b }), t]));
}

function render({ focus = false } = {}) {
  const main = $('#dxMain');
  renderControls();
  const name = S.state.d;
  /* the list is re-drawn on every change; keep the reader's place in it */
  const listTop = ($('.dx-records') || {}).scrollTop || 0;
  main.textContent = '';
  if (S.failed[name] || !S.described[name]?.ok) {
    const err = S.failed[name] || new Error(S.described[name]?.problem || 'data/' + name + '.json could not be read');
    renderError(main, err, () => location.reload());
    const other = el('p', { class: 'dx-note', text: 'The other files are unaffected; choose one above.' });
    main.append(other);
    return;
  }
  if (S.notice) { main.append(el('p', { class: 'dx-note', role: 'status', text: S.notice })); S.notice = null; }
  const side = el('div', { class: 'dx-side' }, [fileCard(name), recordList(name)]);
  main.append(el('div', { class: 'dx-layout' }, [side, renderStage(name, { focus })]));
  const list = $('.dx-records');
  if (list) list.scrollTop = listTop;
}

async function init() {
  const main = $('#dxMain');
  if (!main) return;
  const settled = await Promise.allSettled(G.DATASETS.map((x) => load(x.name)));
  settled.forEach((r, i) => {
    const name = G.DATASETS[i].name;
    if (r.status === 'fulfilled') {
      S.docs[name] = r.value;
      S.described[name] = G.describe(r.value);
      if (!S.described[name].ok) S.failed[name] = new Error('data/' + name + '.json: ' + S.described[name].problem);
    } else {
      S.failed[name] = r.reason instanceof SyntaxError
        ? new Error('data/' + name + '.json is not valid JSON (' + r.reason.message + ')')
        : r.reason;
    }
  });
  const ok = Object.fromEntries(Object.entries(S.docs).filter(([n]) => !S.failed[n]));
  if (!Object.keys(ok).length) { renderError(main, new Error('None of the ' + G.DATASETS.length + ' data files could be loaded.'), () => location.reload()); return; }
  S.refs = G.refIndex(ok);
  S.into = G.incomingIndex(ok, S.refs);
  try { S.ix = index(ok); } catch (e) { S.ix = null; }
  S.state = readState();
  normalise();
  history.replaceState(null, '', linkFor(S.state));
  renderStats();
  render({});
}

init().catch((e) => renderError($('#dxMain'), e, () => location.reload()));
