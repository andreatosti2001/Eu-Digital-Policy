/* ============================================================
   PV2-04 · the Regulatory Network Explorer, Policy observatory instance
   (docs/POST-V2.md §3 C and §3 D, additions of 11 Nov 2026).

   Nodes are the instruments of data/instruments.json and nothing else; edges
   are its `relationships` array and nothing else — not `amends`/`amended_by`/
   `repeals` (a second home of the same fact), not a shared provision, claim or
   source, not a transitive link. Everything is derived from the records on
   each render; no coordinate, count or graph is stored anywhere.

   - Type: the `kind`, with the taxonomy's label, drawn with THREE signals —
     a colour, a stroke pattern and a two-letter code on the edge and in the
     legend — so colour is never the only one.
   - Direction: an arrow from → to ONLY where `symmetric` is false; a record
     with `symmetric: true` has no direction and no arrow. Never inferred
     from the type.
   - Two relationships between the same pair are two edges, drawn apart.
   - The layout is deterministic — the same records give the same picture:
     a network in three dimensions, fixed starting positions, a fixed number
     of steps, no randomness, projected by this module into SVG; the reader
     turns it, nothing moves on its own (prefers-reduced-motion holds
     trivially). Grouping, when chosen, pulls each group toward a point of its
     own by a field already in the records (coverage() of js/routes.js, or
     brief_part), never by community detection (§8, "PV2-04, C.1 question 1").
   - An instrument with no relationship stays in the network, in a cluster
     of its own (or in its group), and says "no relationship recorded".
   - The type's code is drawn on the edges of the selection; colour and the
     stroke pattern are on every edge, always.
   - A panel field the record does not hold reads "not recorded" — the panel
     shows the relationship through ../editorial/relations.js, the same rules
     as the table, so the rules have one home.
   - On a phone the canvas is not shrunk: an "ego" view draws the selected
     instrument with its direct relationships, and the table follows it.
   ============================================================ */

import { esc, F, label, has, notRecorded, statusTag, evidenceTag } from './common.js';
import { relationsTable } from '../editorial/relations.js';
import { coverage, instrumentHref } from '../../js/routes.js';

const SVGNS = 'http://www.w3.org/2000/svg';

/* type → [code, stroke pattern]; the colour is in the stylesheet (.k-*) */
const KIND_STYLE = {
  'rel-kind:amends': ['AM', ''], 'rel-kind:repeals': ['RP', '9 3 2 3'], 'rel-kind:defers-to': ['DF', '7 4'],
  'rel-kind:enables': ['EN', '2 4'], 'rel-kind:overlap': ['OV', ''], 'rel-kind:complement': ['CO', '7 4'],
  'rel-kind:conflict': ['CF', '2 3'], 'rel-kind:lex-specialis': ['LS', '9 3 2 3'], 'rel-kind:legal-basis': ['LB', ''],
  'rel-kind:carve-out': ['CV', '12 4'], 'rel-kind:sequence': ['SQ', '4 4'], 'rel-kind:implements': ['IM', '1 3'],
};
const kindKey = (k) => String(k || '').split(':').pop() || 'unknown';
const kindCode = (k) => (KIND_STYLE[k] || ['??'])[0];
const kindDash = (k) => (KIND_STYLE[k] || ['', '3 3'])[1];

const COVERAGE_GROUPS = [['covered', 'Covered'], ['mapped', 'Mapped'], ['watched', 'Watched'], ['excluded', 'Excluded']];
const COVERAGE_WORD = {
  covered: 'Covered — analysed by the site',
  mapped: 'Mapped — recorded for its links, not analysed in depth',
  watched: 'Watched — named by the site, not analysed',
  excluded: 'Excluded — named by the site and deliberately not analysed',
};

/* ---------------------------------------------------------- the one counting function
   Every figure the explorer prints comes from here (docs/POST-V2.md §3 D,
   "Le cifre mostrate"; docs/DATA-READINESS.md §6, MC-2, MC-6). "None
   recorded" is a state, returned as an empty list, never as 0 printed. */

export function explorerCounts(ix, db) {
  const instruments = [...new Set(ix.instrument.values())].sort((a, b) => a.id.localeCompare(b.id));
  const rels = ix.relationship;
  const byKind = new Map();
  for (const r of rels) byKind.set(r.kind, (byKind.get(r.kind) || 0) + 1);
  const vocabulary = (db.taxonomy?.relationship_kind || []).map((t) => t.id);
  const unused = vocabulary.filter((k) => !byKind.has(k));
  const touching = new Map(instruments.map((i) => [i.id, []]));
  for (const r of rels) { touching.get(r.from)?.push(r); if (r.to !== r.from) touching.get(r.to)?.push(r); }
  const isolated = instruments.filter((i) => !touching.get(i.id).length);
  const groupsBy = (mode) => {
    if (mode === 'coverage') {
      return COVERAGE_GROUPS.map(([k, l]) => ({ key: k, label: l, members: instruments.filter((i) => coverage(i) === k) }))
        .filter((g) => g.members.length);
    }
    if (mode === 'part') {
      const parts = db.brief?.parts || [];
      const out = parts.map((p) => ({ key: p.id, label: `${p.kind === 'annex' ? 'Annex' : 'Part'} ${p.roman}`, short: p.roman, members: instruments.filter((i) => i.brief_part === p.id) }))
        .filter((g) => g.members.length);
      const known = new Set(parts.map((p) => p.id));
      const unassigned = instruments.filter((i) => !i.brief_part || !known.has(i.brief_part));
      if (unassigned.length) out.push({ key: '__none', label: 'Not assigned', members: unassigned });
      return out;
    }
    return null;
  };
  return {
    instruments, rels, byKind, unused, touching, isolated, groupsBy,
    mutual: rels.filter((r) => r.symmetric === true).length,
    directed: rels.filter((r) => r.symmetric === false).length,
  };
}

/* ---------------------------------------------------------- the deterministic layout: a network in three dimensions
   (roadmap §8, "PV2-04: option A and the form of the 3D Explorer"). A force
   layout in 3D — related instruments attract, all repel — computed by this
   module, with no library: the starting positions are fixed (instruments
   ordered by id on a Fibonacci sphere), the number of steps is fixed and
   nothing is random, so the same records give the same network. Each group
   (the chosen grouping; with none, the instruments with no relationship)
   is pulled toward a fixed point of its own. The prototype projects the
   network onto the screen itself, in SVG; the reader turns it — nothing
   ever moves on its own. */

const R3 = 285;
const RIM = 300; // the circle the ungrouped network sits in

function fib(i, n, r) {
  const y = 1 - (2 * (i + 0.5)) / n, rr = Math.sqrt(Math.max(0, 1 - y * y)), t = i * Math.PI * (3 - Math.sqrt(5));
  return { x: r * rr * Math.cos(t), y: r * y, z: r * rr * Math.sin(t) };
}

function layout3d(counts, mode) {
  const chosen = counts.groupsBy(mode);
  const groups = chosen || [
    { key: '__linked', label: 'In a relationship', members: counts.instruments.filter((i) => counts.touching.get(i.id).length) },
    { key: '__none', label: 'No relationship recorded', members: counts.isolated },
  ].filter((g) => g.members.length);
  const ids = counts.instruments.map((i) => i.id); // already ordered by id
  const n = ids.length;
  const groupOf = new Map();
  const centres = groups.map((g, gi) => {
    let c;
    if (!chosen) c = g.key === '__none' ? { x: 0, y: R3 * 1.1, z: 0 } : { x: 0, y: -R3 * 0.1, z: 0 };
    else {
      /* the groups on a spaced grid, alternately nearer and farther, so none hides another from the starting view */
      const G = groups.length, cols = Math.ceil(Math.sqrt(G * 1.6)), rows = Math.ceil(G / cols);
      const S = 2.3 * Math.max(...groups.map((x) => 34 + 26 * Math.sqrt(x.members.length)));
      const col = gi % cols, row = Math.floor(gi / cols);
      c = { x: (col - (cols - 1) / 2) * S, y: (row - (rows - 1) / 2) * S * 0.85, z: (gi % 2 ? 1 : -1) * S * 0.3, r: 34 + 26 * Math.sqrt(g.members.length) };
    }
    for (const m of g.members) groupOf.set(m.id, gi);
    return c;
  });
  const pos = new Map(ids.map((id, i) => {
    if (!chosen) return [id, fib(i, n, R3 * 0.8)];
    const c = centres[groupOf.get(id)], g = groups[groupOf.get(id)], j = g.members.findIndex((m) => m.id === id);
    const q = fib(j, g.members.length, c.r * 0.6);
    return [id, { x: c.x + q.x, y: c.y + q.y, z: c.z + q.z }];
  }));
  const edges = counts.rels.filter((r) => r.from !== r.to && pos.has(r.from) && pos.has(r.to));
  const k = chosen ? 58 : 95, steps = 360, pull = chosen ? 0.05 : 0.02;
  for (let st = 0; st < steps; st++) {
    const t = 26 * (1 - st / steps) + 0.4;
    const disp = new Map(ids.map((id) => [id, { x: 0, y: 0, z: 0 }]));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = pos.get(ids[i]), b = pos.get(ids[j]);
      let dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z, d = Math.hypot(dx, dy, dz);
      if (d < 0.01) { dx = 0.01; dy = 0.01 * (i - j); dz = 0; d = Math.hypot(dx, dy); }
      const f = (k * k) / d, da = disp.get(ids[i]), db = disp.get(ids[j]);
      da.x += (dx / d) * f; da.y += (dy / d) * f; da.z += (dz / d) * f;
      db.x -= (dx / d) * f; db.y -= (dy / d) * f; db.z -= (dz / d) * f;
    }
    for (const e of edges) {
      const a = pos.get(e.from), b = pos.get(e.to);
      const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z, d = Math.max(0.01, Math.hypot(dx, dy, dz));
      const f = ((d * d) / k) * (chosen ? 0.5 : 1), da = disp.get(e.from), db = disp.get(e.to);
      da.x -= (dx / d) * f; da.y -= (dy / d) * f; da.z -= (dz / d) * f;
      db.x += (dx / d) * f; db.y += (dy / d) * f; db.z += (dz / d) * f;
    }
    for (const id of ids) {
      const p = pos.get(id), dd = disp.get(id), c = centres[groupOf.get(id)];
      dd.x += (c.x - p.x) * pull * k; dd.y += (c.y - p.y) * pull * k; dd.z += (c.z - p.z) * pull * k;
      const m = Math.max(0.01, Math.hypot(dd.x, dd.y, dd.z));
      p.x += (dd.x / m) * Math.min(m, t); p.y += (dd.y / m) * Math.min(m, t); p.z += (dd.z / m) * Math.min(m, t);
      if (c.r) { /* grouped: each instrument stays inside its group's sphere */
        const ex = p.x - c.x, ey = p.y - c.y, ez = p.z - c.z, d = Math.hypot(ex, ey, ez);
        if (d > c.r) { p.x = c.x + (ex / d) * c.r; p.y = c.y + (ey / d) * c.r; p.z = c.z + (ez / d) * c.r; }
      }
    }
  }
  /* centred on the network's own middle and scaled to a fixed radius */
  const cx = ids.reduce((a, id) => a + pos.get(id).x, 0) / n, cy = ids.reduce((a, id) => a + pos.get(id).y, 0) / n, cz = ids.reduce((a, id) => a + pos.get(id).z, 0) / n;
  /* the scale is set by the instruments in a relationship, so a separate cluster cannot shrink the network */
  const scaleIds = chosen ? ids : ids.filter((id) => counts.touching.get(id).length);
  const far = Math.max(...scaleIds.map((id) => { const p = pos.get(id); return Math.hypot(p.x - cx, p.y - cy, p.z - cz); }));
  /* grouped, the clusters keep their own size (scaling to the whole would crush them); ungrouped, scaled to R3 */
  /* ungrouped: scaled so that most of the network reaches R3 (the 90th percentile), outliers held inside
     the circle, so the network fills it; grouped, the clusters keep their own size */
  let sc = 1;
  if (!chosen) {
    const ds = scaleIds.map((id) => { const p = pos.get(id); return Math.hypot(p.x - cx, p.y - cy, p.z - cz); }).sort((a, b) => a - b);
    sc = R3 / Math.max(1, ds[Math.floor(ds.length * 0.9)] || far);
  }
  for (const id of ids) {
    const p = pos.get(id); p.x = (p.x - cx) * sc; p.y = (p.y - cy) * sc; p.z = (p.z - cz) * sc;
    const d = Math.hypot(p.x, p.y, p.z), lim = RIM * 0.8;
    if (!chosen && d > lim) { p.x *= lim / d; p.y *= lim / d; p.z *= lim / d; }
  }
  const labels = groups.map((g) => {
    const ms = g.members.map((m) => pos.get(m.id));
    return { key: g.key, label: g.label, short: g.short || null, n: g.members.length,
      at: { x: ms.reduce((a, p) => a + p.x, 0) / ms.length, y: Math.min(...ms.map((p) => p.y)) - 42, z: ms.reduce((a, p) => a + p.z, 0) / ms.length } };
  });
  const ys = ids.map((id) => pos.get(id).y);
  const xs = ids.map((id) => Math.hypot(pos.get(id).x, pos.get(id).z));
  const half = Math.max(R3 + 95, Math.max(...ys.map(Math.abs)) + 55, Math.max(...xs) + 120);
  return { p3: pos, labels, box: { x: -half, y: -half, w: 2 * half, h: 2 * half } };
}

/* the projection: a rotation (yaw about the vertical, then pitch), then perspective */
const FOCAL = 900;
function project(p, yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = p.x * cy + p.z * sy, z1 = -p.x * sy + p.z * cy;
  const y2 = p.y * cp - z1 * sp, z2 = p.y * sp + z1 * cp;
  const s = FOCAL / (FOCAL - z2);
  return { x: x1 * s, y: y2 * s, z: z2, s };
}

/* ---------------------------------------------------------- drawing */

const NODE_R = 7;

function edgeGeometry(a, b, curve, R1 = NODE_R + 3, R2 = NODE_R + 6) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(0.01, Math.hypot(dx, dy));
  const c = { x: mx - (dy / d) * curve * d, y: my + (dx / d) * curve * d };
  const u1 = { x: c.x - a.x, y: c.y - a.y }, l1 = Math.max(0.01, Math.hypot(u1.x, u1.y));
  const u2 = { x: b.x - c.x, y: b.y - c.y }, l2 = Math.max(0.01, Math.hypot(u2.x, u2.y));
  const s = { x: a.x + (u1.x / l1) * R1, y: a.y + (u1.y / l1) * R1 };
  const e = { x: b.x - (u2.x / l2) * R2, y: b.y - (u2.y / l2) * R2 };
  const mid = { x: 0.25 * a.x + 0.5 * c.x + 0.25 * b.x, y: 0.25 * a.y + 0.5 * c.y + 0.25 * b.y };
  return { d: `M${s.x.toFixed(1)},${s.y.toFixed(1)} Q${c.x.toFixed(1)},${c.y.toFixed(1)} ${e.x.toFixed(1)},${e.y.toFixed(1)}`, mid };
}

/** Curvature for each relationship, so two between one pair are drawn apart. */
function curvatures(rels) {
  const pairs = new Map();
  for (const r of rels) { const k = [r.from, r.to].sort().join('|'); if (!pairs.has(k)) pairs.set(k, []); pairs.get(k).push(r); }
  const out = new Map();
  for (const list of pairs.values()) {
    list.forEach((r, i) => {
      let c = list.length === 1 ? 0 : (i - (list.length - 1) / 2) * 0.28;
      if (r.from > r.to) c = -c; // the same side whatever the record's own order
      out.set(r, c);
    });
  }
  return out;
}

const markers = (prefix, kinds) => '<defs>' + kinds.map((k) =>
  `<marker id="${prefix}-${kindKey(k)}" class="mk-${kindKey(k)}" viewBox="0 0 10 10" refX="8.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M0,0.5 L10,5 L0,9.5 z"/></marker>`).join('') + '</defs>';

function directionWords(ix, r) {
  const a = ix.instrument.get(r.from)?.short_name || r.from;
  const b = ix.instrument.get(r.to)?.short_name || r.to;
  const verb = label(ix, r.kind) || 'relates to';
  if (r.symmetric === true) return `Mutual, no direction: ${a} and ${b} — ${verb.toLowerCase()}`;
  if (r.symmetric === false) return `${a} ${verb.toLowerCase()} ${b} (from ${a} to ${b})`;
  return `${a} — ${b}: ${notRecorded('direction not recorded')}`;
}

function edgeSvg(ix, r, geo, prefix) {
  const k = kindKey(r.kind);
  const dash = kindDash(r.kind);
  const arrow = r.symmetric === false ? ` marker-end="url(#${prefix}-${k})"` : '';
  const words = directionWords(ix, r).replace(/<[^>]+>/g, '');
  return `<g class="edge k-${k}" data-rel="${esc(r.id)}" aria-hidden="true"><title>${esc(words)}</title>` +
    `<path class="e-line"${dash ? ` stroke-dasharray="${dash}"` : ''} d="${geo.d}"${arrow}/>` +
    `<path class="e-hit" d="${geo.d}"/>` +
    `<g class="e-badge"><rect x="${(geo.mid.x - 10).toFixed(1)}" y="${(geo.mid.y - 6.5).toFixed(1)}" width="20" height="13" rx="2"/>` +
    `<text x="${geo.mid.x.toFixed(1)}" y="${(geo.mid.y + 3).toFixed(1)}">${esc(kindCode(r.kind))}</text></g></g>`;
}

function nodeLabel(ix, counts, inst) {
  const n = counts.touching.get(inst.id).length;
  const cov = coverage(inst);
  return `${inst.short_name}, ${label(ix, inst.kind) || 'instrument'}; ${cov ? cov : 'coverage not recorded'}; ${n ? F.plural(n, 'relationship') + ' recorded' : 'no relationship recorded'}`;
}

function nodeSvg(ix, counts, inst, p, { labelSide = 'right' } = {}) {
  const cov = coverage(inst) || 'none';
  const below = labelSide === 'below';
  const text = `<text x="${below ? 0 : NODE_R + 5}" y="${below ? NODE_R + 15 : 4}" text-anchor="${below ? 'middle' : 'start'}">${esc(inst.short_name)}</text>`;
  return `<g class="node c-${cov}" data-id="${esc(inst.id)}" role="button" tabindex="-1" aria-pressed="false" aria-label="${esc(nodeLabel(ix, counts, inst))}" transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})">` +
    `<circle class="n-ring" r="${NODE_R + 5}"/><circle class="n-dot" r="${NODE_R}"/>${text}</g>`;
}

/* ---------------------------------------------------------- the explorer */

export function mountExplorer(root, ix, db, { focus = null, tableMount, onSelect } = {}) {
  const counts = explorerCounts(ix, db);
  const kindsInUse = [...counts.byKind.keys()].sort((a, b) => (counts.byKind.get(b) - counts.byKind.get(a)) || String(label(ix, a)).localeCompare(label(ix, b)));
  const state = {
    group: 'none',
    hidden: new Set(),
    sel: null,          // { type: 'node' | 'edge', id }
    neighbourhood: false,
    tab: 'props',
    vb: null, base: null,
    yaw: 0.55, pitch: -0.32,   // the fixed starting view
    roving: null,
    tableAll: !window.matchMedia('(max-width: 51.99rem)').matches,
  };
  const byId = (id) => ix.instrument.get(id);
  const relById = new Map(counts.rels.map((r) => [r.id, r]));
  const visibleRels = () => counts.rels.filter((r) => !state.hidden.has(r.kind));

  root.innerHTML = `
    <div class="explorer">
      <div class="stage">
        <div class="ex-canvas"><div id="ex-svg"></div></div>
        <div class="ex-tools" role="group" aria-label="Explorer controls">
          <p class="ex-title">// The EU digital acquis</p>
          <label>Find an instrument<input type="search" id="ex-find" list="ex-names" autocomplete="off" placeholder="e.g. GDPR"></label>
          <datalist id="ex-names">${counts.instruments.map((i) => `<option value="${esc(i.short_name)}"></option>`).join('')}</datalist>
          <label class="ex-grp">Group by<select id="ex-group">
            <option value="none">No grouping</option>
            <option value="coverage">Coverage</option>
            <option value="part">Part of the brief</option>
          </select></label>
          <button type="button" id="ex-relayout">Re-layout graph</button>
          <div class="ex-zoom" role="group" aria-label="Zoom and turn">
            <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
            <button type="button" data-zoom="out" aria-label="Zoom out">−</button>
            <button type="button" data-zoom="reset" aria-label="Fit the whole network">Fit</button>
            <button type="button" data-turn="left" aria-label="Turn left">⟲</button>
            <button type="button" data-turn="right" aria-label="Turn right">⟳</button>
            <button type="button" data-turn="up" aria-label="Tilt up">⤒</button>
            <button type="button" data-turn="down" aria-label="Tilt down">⤓</button>
          </div>
          <details class="ex-keys"><summary>How to use it</summary><p>Drag the background, the turn buttons, or Shift and an arrow key turn the network in three dimensions; nothing moves on its own; nearer instruments are larger and darker. Tab into the network; arrow keys move between instruments as they appear; Enter selects; Esc clears; + and − zoom. A selection's relationships are buttons in the panel's Relations tab; every relationship is in the table below.</p></details>
          <p class="visually-hidden" id="ex-live" aria-live="polite"></p>
        </div>
        <div class="ex-legend" id="ex-legend"></div>
        <aside class="ex-panel" id="ex-panel" aria-label="The selection"></aside>
      </div>
      <div class="ego" id="ex-ego"></div>
    </div>`;

  /* ------------------------------------------------ the legend: always visible, and the type filter */
  function legend() {
    const box = root.querySelector('#ex-legend');
    box.innerHTML = `<h3>Types of relationship</h3>
      <ul>${kindsInUse.map((k) => {
        const kk = kindKey(k), dash = kindDash(k);
        return `<li><label><input type="checkbox" data-kind="${esc(k)}"${state.hidden.has(k) ? '' : ' checked'}>
          <svg width="52" height="12" aria-hidden="true" class="k-${kk}"><line x1="2" y1="6" x2="50" y2="6" stroke-width="2.2"${dash ? ` stroke-dasharray="${dash}"` : ''}/></svg>
          <span class="code k-${kk}">${esc(kindCode(k))}</span><span>${esc(label(ix, k))}</span><span class="lg-count">${counts.byKind.get(k)}</span></label></li>`;
      }).join('')}</ul>
      <p class="lg-note"><span id="ex-shown">${shownText()}</span> → only where the record gives a direction (${counts.directed}); none on a mutual one (${counts.mutual}).${counts.unused.length ? ` None recorded: ${counts.unused.map((k) => esc(label(ix, k))).join(', ')}.` : ''}</p>
      <div class="lg-nodes" aria-label="Instruments">
        <span><svg width="16" height="16" aria-hidden="true"><g class="node c-covered"><circle class="n-dot" cx="8" cy="8" r="6"/></g></svg> covered</span>
        <span><svg width="16" height="16" aria-hidden="true"><g class="node c-mapped"><circle class="n-dot" cx="8" cy="8" r="6"/></g></svg> mapped</span>
        <span><svg width="16" height="16" aria-hidden="true"><g class="node c-watched"><circle class="n-dot" cx="8" cy="8" r="6"/></g></svg> watched (dashed)</span>
        <span><svg width="16" height="16" aria-hidden="true"><g class="node c-excluded"><circle class="n-dot" cx="8" cy="8" r="6"/></g></svg> excluded (dashed, hollow)</span>
      </div>`;
    for (const cb of box.querySelectorAll('input[data-kind]')) {
      cb.addEventListener('change', () => {
        if (cb.checked) state.hidden.delete(cb.dataset.kind); else state.hidden.add(cb.dataset.kind);
        if (state.sel?.type === 'edge' && state.hidden.has(relById.get(state.sel.id)?.kind)) state.sel = null;
        applyFilters(); legendCount(); panel(); table(); ego();
      });
    }
  }
  function shownText() {
    const shown = visibleRels().length;
    return `Showing ${shown} of ${counts.rels.length} relationships${state.hidden.size ? ` — ${state.hidden.size === 1 ? 'one type' : state.hidden.size + ' types'} hidden by the filter` : ''}.`;
  }
  function legendCount() { const s = root.querySelector('#ex-shown'); if (s) s.textContent = shownText(); }

  /* ------------------------------------------------ the canvas */
  let L = null;
  function draw() {
    L = layout3d(counts, state.group);
    /* ungrouped (Knwler's presentation, §8): the network inside a circle, the instruments with no
       relationship on its rim, fixed on the screen; grouped: the view fitted to the starting view */
    L.rim = new Map();
    if (state.group === 'none') {
      const iso = counts.isolated;
      iso.forEach((inst, i) => {
        const a = Math.PI * (-0.42 + (0.84 * (i + 0.5)) / Math.max(1, iso.length)); // the right-hand arc, clear of the floating controls and legend
        L.rim.set(inst.id, { x: RIM * Math.cos(a), y: RIM * Math.sin(a), z: 0, s: 1, rim: true });
      });
      L.box = { x: -RIM - 300, y: -RIM - 40, w: 2 * RIM + 300 + 210, h: 2 * RIM + 130 };
    } else {
      const P = [...L.p3.values()].map((p) => project(p, state.yaw, state.pitch));
      const G = L.labels.map((g) => project(g.at, state.yaw, state.pitch));
      const x0 = Math.min(...P.map((q) => q.x), ...G.map((q) => q.x - 60)) - 30, x1 = Math.max(...P.map((q) => q.x), ...G.map((q) => q.x + 60)) + 175;
      const y0 = Math.min(...P.map((q) => q.y), ...G.map((q) => q.y)) - 30, y1 = Math.max(...P.map((q) => q.y)) + 30;
      const w = x1 - x0, h = Math.max(y1 - y0, w * 0.62);
      L.box = { x: x0 - 260, y: y0 - (h - (y1 - y0)) / 2, w: w + 260, h };
    }
    state.base = { ...L.box };
    if (!state.vb) state.vb = { ...L.box };
    L.pos = new Map();
    const glabels = L.labels.map((g, i) => `<text class="group-label" data-g="${i}" text-anchor="middle">${g.short ? esc(g.short) : esc(g.label)} · ${g.n}<title>${esc(g.label)}: ${g.n}</title></text>`).join('');
    const edges = counts.rels.map((r) => edgeSvg(ix, r, { d: 'M0,0', mid: { x: 0, y: 0 } }, 'mk')).join('');
    const nodes = counts.instruments.map((i) => nodeSvg(ix, counts, i, { x: 0, y: 0 })).join('');
    root.querySelector('#ex-svg').innerHTML = `<svg xmlns="${SVGNS}" viewBox="${vbStr()}" role="group" aria-label="Network of ${counts.instruments.length} instruments and ${counts.rels.length} recorded relationships, in three dimensions. Arrow keys move between instruments; Shift and an arrow key turns the network.">` +
      markers('mk', kindsInUse) + (state.group === 'none' ? `<circle class="frame" r="${RIM}" aria-hidden="true"/>` : '') + `<g class="hulls" aria-hidden="true">${glabels}</g><g class="edges">${edges}</g><g class="nodes">${nodes}</g></svg>`;
    wireCanvas();
    projectAll();
    applyFilters();
    applySelection(false);
  }
  /* re-project every node, edge and label for the current rotation; the DOM is kept (focus stays where it is) */
  const curveOf = curvatures(counts.rels);
  function projectAll() {
    const svg = svgEl();
    if (!svg || !L) return;
    const P = new Map();
    let zmin = Infinity, zmax = -Infinity;
    for (const [id, p] of L.p3) { if (L.rim.has(id)) continue; const q = project(p, state.yaw, state.pitch); P.set(id, q); zmin = Math.min(zmin, q.z); zmax = Math.max(zmax, q.z); }
    const depth = (z) => (zmax > zmin ? (z - zmin) / (zmax - zmin) : 1); // 0 far … 1 near
    for (const [id, q] of L.rim) P.set(id, { ...q, z: zmax });
    L.pos = P;
    for (const g of svg.querySelectorAll('.node')) {
      const q = P.get(g.dataset.id), dd = depth(q.z);
      g.setAttribute('transform', `translate(${q.x.toFixed(1)},${q.y.toFixed(1)}) scale(${(0.72 + 0.45 * dd).toFixed(3)})`);
      g.setAttribute('opacity', (0.42 + 0.58 * dd).toFixed(2));
    }
    for (const g of svg.querySelectorAll('.edge')) {
      const r = relById.get(g.dataset.rel), a = P.get(r.from), b = P.get(r.to);
      const geo = edgeGeometry(a, b, curveOf.get(r), (NODE_R + 3) * (0.72 + 0.45 * depth(a.z)), (NODE_R + 6) * (0.72 + 0.45 * depth(b.z)));
      for (const path of g.querySelectorAll('path')) path.setAttribute('d', geo.d);
      const rect = g.querySelector('.e-badge rect'), text = g.querySelector('.e-badge text');
      rect.setAttribute('x', (geo.mid.x - 10).toFixed(1)); rect.setAttribute('y', (geo.mid.y - 6.5).toFixed(1));
      text.setAttribute('x', geo.mid.x.toFixed(1)); text.setAttribute('y', (geo.mid.y + 3).toFixed(1));
      g.setAttribute('opacity', (0.3 + 0.7 * depth((a.z + b.z) / 2)).toFixed(2));
    }
    for (const t of svg.querySelectorAll('.group-label')) {
      const lab = L.labels[+t.dataset.g];
      if (state.group === 'none' && lab.key === '__none') { t.setAttribute('x', '110'); t.setAttribute('y', String(-RIM - 14)); t.setAttribute('text-anchor', 'start'); continue; }
      if (state.group === 'none' && lab.key === '__linked') { t.setAttribute('x', '-20'); t.setAttribute('y', String(-RIM - 14)); t.setAttribute('text-anchor', 'end'); continue; }
      const q = project(lab.at, state.yaw, state.pitch);
      t.setAttribute('x', q.x.toFixed(1)); t.setAttribute('y', q.y.toFixed(1));
    }
  }
  function turn(dyaw, dpitch, words) {
    state.yaw += dyaw;
    state.pitch = Math.max(-1.3, Math.min(1.3, state.pitch + dpitch));
    projectAll();
    if (words) say(words);
  }
  const vbStr = () => `${state.vb.x.toFixed(1)} ${state.vb.y.toFixed(1)} ${state.vb.w.toFixed(1)} ${state.vb.h.toFixed(1)}`;
  const svgEl = () => root.querySelector('#ex-svg svg');
  function setVb() { const s = svgEl(); if (s) s.setAttribute('viewBox', vbStr()); }
  function zoom(f) {
    const v = state.vb, cx = v.x + v.w / 2, cy = v.y + v.h / 2;
    const w = Math.min(state.base.w * 1.5, Math.max(state.base.w / 6, v.w / f));
    const h = w * (state.base.h / state.base.w);
    state.vb = { x: cx - w / 2, y: cy - h / 2, w, h };
    setVb();
    say(`Zoom ${Math.round((state.base.w / w) * 100)}%.`);
  }
  function fit() { state.vb = { ...state.base }; setVb(); say('Whole network in view.'); }

  function wireCanvas() {
    const svg = svgEl();
    const nodes = [...svg.querySelectorAll('.node')];
    const first = state.sel?.type === 'node' ? state.sel.id : [...counts.instruments].sort((a, b) => a.short_name.localeCompare(b.short_name))[0].id;
    setRoving(first);
    svg.addEventListener('click', (ev) => {
      const n = ev.target.closest('.node');
      const e = ev.target.closest('.edge');
      if (moved) { moved = false; return; }
      if (n) select({ type: 'node', id: n.dataset.id }, { focusNode: true });
      else if (e) select({ type: 'edge', id: e.dataset.rel });
    });
    svg.addEventListener('keydown', (ev) => {
      const cur = ev.target.closest('.node');
      if (ev.key === '+' || ev.key === '=') { zoom(1.25); ev.preventDefault(); return; }
      if (ev.key === '-' || ev.key === '_') { zoom(0.8); ev.preventDefault(); return; }
      const turnKeys = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, 0.15], ArrowDown: [0, -0.15] };
      if (ev.shiftKey && turnKeys[ev.key]) { turn(...turnKeys[ev.key], 'Network turned.'); ev.preventDefault(); return; }
      if (!cur) return;
      if (ev.key === 'Enter' || ev.key === ' ') { select({ type: 'node', id: cur.dataset.id }, { focusNode: true }); ev.preventDefault(); return; }
      if (ev.key === 'Escape') { select(null); ev.preventDefault(); return; }
      const dirs = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
      if (ev.key === 'Home' || ev.key === 'End') {
        const sorted = [...counts.instruments].sort((a, b) => a.short_name.localeCompare(b.short_name));
        focusNode((ev.key === 'Home' ? sorted[0] : sorted[sorted.length - 1]).id); ev.preventDefault(); return;
      }
      if (!dirs[ev.key]) return;
      ev.preventDefault();
      const [ux, uy] = dirs[ev.key];
      const p = L.pos.get(cur.dataset.id);
      let best = null, bestScore = Infinity;
      for (const n of nodes) {
        if (n === cur) continue;
        const q = L.pos.get(n.dataset.id);
        const dx = q.x - p.x, dy = q.y - p.y;
        const along = dx * ux + dy * uy;
        if (along <= 0) continue;
        const across = Math.abs(dx * uy - dy * ux);
        const score = along + across * 2.2;
        if (score < bestScore) { bestScore = score; best = n; }
      }
      if (best) focusNode(best.dataset.id);
    });
    /* drag the background to turn the network */
    let drag = null, moved = false;
    svg.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.node') || ev.target.closest('.edge') || ev.button !== 0) return;
      drag = { x: ev.clientX, y: ev.clientY, yaw: state.yaw, pitch: state.pitch };
      svg.setPointerCapture(ev.pointerId);
      svg.classList.add('dragging');
    });
    svg.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      state.yaw = drag.yaw + dx * 0.008;
      state.pitch = Math.max(-1.3, Math.min(1.3, drag.pitch - dy * 0.008));
      projectAll();
    });
    const end = () => { drag = null; svg.classList.remove('dragging'); setTimeout(() => { moved = false; }, 0); };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
  }
  function setRoving(id) {
    const svg = svgEl();
    if (!svg) return;
    for (const n of svg.querySelectorAll('.node')) n.setAttribute('tabindex', n.dataset.id === id ? '0' : '-1');
    state.roving = id;
  }
  function focusNode(id) {
    setRoving(id);
    const n = svgEl()?.querySelector(`.node[data-id="${CSS.escape(id)}"]`);
    if (n && getComputedStyle(root.querySelector('.ex-canvas')).display !== 'none') n.focus();
  }

  function applyFilters() {
    const svg = svgEl();
    if (!svg) return;
    for (const g of svg.querySelectorAll('.edge')) g.classList.toggle('off', state.hidden.has(relById.get(g.dataset.rel)?.kind));
    applySelection(false);
  }

  function applySelection() {
    const svg = svgEl();
    if (!svg) return;
    const sel = state.sel;
    const vis = new Set(visibleRels().map((r) => r.id));
    let keepNodes = null, keepEdges = null;
    if (sel && state.neighbourhood) {
      keepNodes = new Set(); keepEdges = new Set();
      if (sel.type === 'node') {
        keepNodes.add(sel.id);
        for (const r of counts.touching.get(sel.id) || []) if (vis.has(r.id)) { keepEdges.add(r.id); keepNodes.add(r.from); keepNodes.add(r.to); }
      } else {
        const r = relById.get(sel.id);
        keepEdges.add(r.id); keepNodes.add(r.from); keepNodes.add(r.to);
      }
    }
    for (const n of svg.querySelectorAll('.node')) {
      const on = sel?.type === 'node' && sel.id === n.dataset.id;
      n.classList.toggle('selected', on);
      n.setAttribute('aria-pressed', on ? 'true' : 'false');
      n.classList.toggle('dim', !!keepNodes && !keepNodes.has(n.dataset.id));
    }
    for (const g of svg.querySelectorAll('.edge')) {
      const r = relById.get(g.dataset.rel);
      g.classList.toggle('selected', sel?.type === 'edge' && sel.id === g.dataset.rel);
      g.classList.toggle('dim', !!keepEdges && !keepEdges.has(g.dataset.rel));
      /* the code is drawn on the selection's own edges */
      g.classList.toggle('coded', !!sel && (sel.type === 'edge' ? sel.id === r.id : r.from === sel.id || r.to === sel.id));
    }
  }

  /* ------------------------------------------------ selection */
  function select(sel, { focusNode: f = false } = {}) {
    state.sel = sel;
    if (!sel) state.neighbourhood = false;
    state.tab = 'props';
    if (sel?.type === 'node') { if (f) focusNode(sel.id); else setRoving(sel.id); }
    applySelection();
    panel(); table(); ego();
    if (onSelect) onSelect(sel);
    say(sel ? (sel.type === 'node' ? `${byId(sel.id)?.short_name} selected.` : `Relationship selected: ${directionWords(ix, relById.get(sel.id)).replace(/<[^>]+>/g, '')}.`) : 'Selection cleared.');
  }
  function say(text) { const l = root.querySelector('#ex-live'); if (l) l.textContent = text; }

  /* ------------------------------------------------ the panel: two tabs */
  function relButton(r, self) {
    const other = r.from === self ? r.to : r.from;
    const words = directionWords(ix, r);
    return `<li><button type="button" data-rel="${esc(r.id)}"><span class="code k-${kindKey(r.kind)}">${esc(kindCode(r.kind))}</span><span class="r-text">${words}</span></button></li>`;
  }
  function tabs(propsHtml, relsHtml, relsCount) {
    const t = state.tab;
    return `<div class="tabs" role="tablist" aria-label="Selection details">
        <button type="button" role="tab" id="tab-props" aria-controls="tp-props" aria-selected="${t === 'props'}" tabindex="${t === 'props' ? 0 : -1}">Properties</button>
        <button type="button" role="tab" id="tab-rels" aria-controls="tp-rels" aria-selected="${t === 'rels'}" tabindex="${t === 'rels' ? 0 : -1}">Relations (${relsCount})</button>
      </div>
      <div role="tabpanel" id="tp-props" aria-labelledby="tab-props"${t === 'props' ? '' : ' hidden'}>${propsHtml}</div>
      <div role="tabpanel" id="tp-rels" aria-labelledby="tab-rels"${t === 'rels' ? '' : ' hidden'}>${relsHtml}</div>`;
  }
  function panel() {
    const box = root.querySelector('#ex-panel');
    const sel = state.sel;
    if (!sel) {
      box.innerHTML = `<p class="p-kicker">Nothing selected</p>
        <p class="p-title">${counts.instruments.length} instruments · ${counts.rels.length} relationships</p>
        <p class="p-sub">${counts.directed} with a direction, ${counts.mutual} mutual. Select an instrument or a relationship in the network, find one by name, or read the table below.</p>
        <h3>No relationship recorded</h3>
        <p class="p-sub">${counts.isolated.length} instruments appear in no relationship. They stay in the network and in the table.</p>
        <ul class="rels">${counts.isolated.map((i) => `<li><button type="button" data-node="${esc(i.id)}"><span class="code">—</span><span class="r-text">${esc(i.short_name)}</span></button></li>`).join('')}</ul>`;
    } else if (sel.type === 'node') {
      const inst = byId(sel.id);
      const cov = coverage(inst);
      const part = inst.brief_part ? (db.brief?.parts || []).find((p) => p.id === inst.brief_part) : null;
      const rels = (counts.touching.get(inst.id) || []);
      const shownRels = rels.filter((r) => !state.hidden.has(r.kind));
      const props = `<p class="p-kicker">${inst.kind ? esc(label(ix, inst.kind)) : 'Instrument'}</p>
        <p class="p-title">${esc(inst.short_name)}</p>
        <p class="p-sub">${inst.full_name ? esc(inst.full_name) : notRecorded('full name not recorded')}</p>
        <dl class="facts">
          <dt>Status</dt><dd>${statusTag(ix, inst.legislative_status)}</dd>
          <dt>Coverage</dt><dd>${cov ? esc(COVERAGE_WORD[cov]) : notRecorded()}</dd>
          <dt>Part of the brief</dt><dd>${part ? `Part ${esc(part.roman)} — ${esc(part.title)}` : inst.brief_part ? `<code>${esc(inst.brief_part)}</code>` : notRecorded('not assigned to a part')}</dd>
          <dt>CELEX</dt><dd>${inst.celex ? `<code>${esc(inst.celex)}</code>` : notRecorded()}</dd>
          <dt>Last verified</dt><dd>${inst.last_verified ? esc(F.humanDate(inst.last_verified)) : notRecorded()}</dd>
          <dt>Relationships</dt><dd>${rels.length ? esc(F.plural(rels.length, 'relationship')) + ' recorded' + (shownRels.length !== rels.length ? ` (${shownRels.length} shown by the type filter)` : '') : notRecorded('no relationship recorded')}</dd>
        </dl>
        <div class="p-actions">
          <a href="regulation.html?id=${encodeURIComponent(inst.id)}">Its page</a>
          <a href="${esc(instrumentHref(inst, ix))}">On the current site</a>
          ${rels.length ? `<button type="button" data-act="hood" aria-pressed="${state.neighbourhood}">${state.neighbourhood ? 'Show the whole network' : 'Focus on its connections'}</button>` : ''}
          <button type="button" data-act="clear">Clear selection</button>
        </div>`;
      const relsHtml = rels.length
        ? `<ul class="rels">${rels.map((r) => state.hidden.has(r.kind) ? '' : relButton(r, inst.id)).join('')}</ul>${shownRels.length !== rels.length ? `<p class="meta">${rels.length - shownRels.length} hidden by the type filter.</p>` : ''}`
        : `<p>${notRecorded('no relationship recorded')}</p><p class="p-sub">${esc(inst.short_name)} appears in no relationship in <code>data/instruments.json</code>. That is the state of the record, not a finding that it relates to nothing.</p>`;
      box.innerHTML = tabs(props, relsHtml, shownRels.length);
    } else {
      const r = relById.get(sel.id);
      const kk = kindKey(r.kind);
      const note = ix.taxonomy.get(r.kind)?.note;
      const claims = has(r.claims) ? `<h3>Claims</h3><ul class="stmt-list">${r.claims.map((id) => {
        const c = ix.claim.get(id);
        return c ? `<li>${evidenceTag(c)} ${esc(c.statement)}</li>` : `<li><code>${esc(id)}</code> ${notRecorded('not found in claims.json')}</li>`;
      }).join('')}</ul>` : '';
      const props = `<p class="p-kicker">Relationship</p>
        <p class="p-title"><span class="code k-${kk}">${esc(kindCode(r.kind))}</span> ${esc(label(ix, r.kind))}</p>
        <p class="p-sub">${directionWords(ix, r)}</p>
        ${note ? `<p class="meta">${esc(note)}</p>` : ''}
        ${relationsTable({ ...ix, relationship: [r] }, { only: r.from })}
        ${claims}
        <div class="p-actions">
          <button type="button" data-act="hood" aria-pressed="${state.neighbourhood}">${state.neighbourhood ? 'Show the whole network' : 'Focus on this relationship'}</button>
          <button type="button" data-act="clear">Clear selection</button>
        </div>`;
      const relsHtml = `<ul class="rels">${[r.from, r.to].map((id) => `<li><button type="button" data-node="${esc(id)}"><span class="code">${id === r.from && r.symmetric === false ? 'from' : id === r.to && r.symmetric === false ? 'to' : '—'}</span><span class="r-text">${esc(byId(id)?.short_name || id)}</span></button></li>`).join('')}</ul>`;
      box.innerHTML = tabs(props, relsHtml, 2);
    }
    wirePanel(box);
  }
  function wirePanel(box) {
    for (const b of box.querySelectorAll('button[data-rel]')) b.addEventListener('click', () => { select({ type: 'edge', id: b.dataset.rel }); box.querySelector('[role="tab"]')?.focus(); });
    for (const b of box.querySelectorAll('button[data-node]')) b.addEventListener('click', () => { select({ type: 'node', id: b.dataset.node }); box.querySelector('[role="tab"]')?.focus(); });
    box.querySelector('[data-act="clear"]')?.addEventListener('click', () => select(null));
    box.querySelector('[data-act="hood"]')?.addEventListener('click', () => {
      state.neighbourhood = !state.neighbourhood;
      applySelection(); panel();
      box.querySelector('[data-act="hood"]')?.focus();
      say(state.neighbourhood ? 'Showing only the direct connections.' : 'Showing the whole network.');
    });
    const tabsEls = [...box.querySelectorAll('[role="tab"]')];
    for (const t of tabsEls) {
      t.addEventListener('click', () => { state.tab = t.id === 'tab-rels' ? 'rels' : 'props'; panel(); box.querySelector(`#${t.id}`)?.focus(); });
      t.addEventListener('keydown', (ev) => {
        if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
        state.tab = state.tab === 'props' ? 'rels' : 'props';
        panel(); box.querySelector(state.tab === 'props' ? '#tab-props' : '#tab-rels')?.focus(); ev.preventDefault();
      });
    }
  }

  /* ------------------------------------------------ the accessible alternative: the same table, same filter, same selection */
  function table() {
    if (!tableMount) return;
    const filtered = { ...ix, relationship: visibleRels() };
    const sel = state.sel;
    let only = null, rels = filtered;
    if (sel?.type === 'node') only = sel.id;
    else if (sel?.type === 'edge') { const r = relById.get(sel.id); only = r.from; rels = { ...ix, relationship: [r] }; }
    else if (!state.tableAll) only = focus || 'ai-act';
    const what = sel?.type === 'edge' ? 'the selected relationship'
      : only ? `the relationships of ${esc(byId(only)?.short_name || only)}`
      : 'every instrument and every relationship';
    const filterNote = state.hidden.size ? ` The type filter hides ${state.hidden.size === 1 ? 'one type' : state.hidden.size + ' types'}: ${[...state.hidden].map((k) => esc(label(ix, k))).join(', ')}; the caption counts what is shown.` : '';
    tableMount.innerHTML = `<p class="prose">The same relationships, in the table the Editorial prototype shows (<code>prototypes/editorial/relations.js</code>, imported: one set of rules). It follows the explorer: now ${what}.${filterNote}</p>
      <p>${only || sel ? `<button type="button" class="btn" data-act="all">Show every instrument (${counts.instruments.length}, a relationship under each of its two)</button>` : ''}</p>
      ${relationsTable(rels, only ? { only } : {})}`;
    tableMount.querySelector('[data-act="all"]')?.addEventListener('click', () => { state.tableAll = true; if (state.sel) select(null); else table(); });
  }

  /* ------------------------------------------------ the phone: an ego view, not the canvas made small */
  function ego() {
    const box = root.querySelector('#ex-ego');
    const sel = state.sel;
    const centreId = sel?.type === 'node' ? sel.id : sel?.type === 'edge' ? relById.get(sel.id).from : (focus || 'ai-act');
    const inst = byId(centreId);
    if (!inst) { box.innerHTML = ''; return; }
    const rels = (counts.touching.get(inst.id) || []).filter((r) => !state.hidden.has(r.kind));
    const others = [...new Set(rels.map((r) => (r.from === inst.id ? r.to : r.from)))]
      .sort((a, b) => (byId(a)?.short_name || a).localeCompare(byId(b)?.short_name || b));
    const C = { x: 200, y: 190 }, R = 128;
    const pos = new Map([[inst.id, C]]);
    others.forEach((id, i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, others.length); pos.set(id, { x: C.x + R * Math.cos(a), y: C.y + R * Math.sin(a) }); });
    const curve = curvatures(rels);
    const edges = rels.map((r) => edgeSvg(ix, r, edgeGeometry(pos.get(r.from), pos.get(r.to), curve.get(r)), 'mke')).join('');
    const nodes = [inst.id, ...others].map((id) => nodeSvg(ix, counts, byId(id), pos.get(id), { labelSide: 'below' })).join('');
    box.innerHTML = `<p class="count-line">${esc(inst.short_name)}: ${rels.length ? esc(F.plural(rels.length, 'relationship')) + ' shown' : 'no relationship recorded' + (state.hidden.size && (counts.touching.get(inst.id) || []).length ? ' among the types shown' : '')}. Tap an instrument to centre it; tap a code to open the relationship.</p>
      <svg xmlns="${SVGNS}" viewBox="-10 40 420 310" role="group" aria-label="${esc(inst.short_name)} and its direct relationships">${markers('mke', kindsInUse)}<g class="edges">${edges}</g><g class="nodes">${nodes}</g></svg>`;
    const svg = box.querySelector('svg');
    for (const n of svg.querySelectorAll('.node')) {
      n.setAttribute('tabindex', '0');
      const on = sel?.type === 'node' && sel.id === n.dataset.id;
      n.classList.toggle('selected', on);
      n.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    for (const g of svg.querySelectorAll('.edge')) g.classList.toggle('selected', sel?.type === 'edge' && sel.id === g.dataset.rel);
    svg.addEventListener('click', (ev) => {
      const n = ev.target.closest('.node'), e = ev.target.closest('.edge');
      if (n) select({ type: 'node', id: n.dataset.id });
      else if (e) select({ type: 'edge', id: e.dataset.rel });
    });
    svg.addEventListener('keydown', (ev) => {
      const n = ev.target.closest('.node');
      if (n && (ev.key === 'Enter' || ev.key === ' ')) { select({ type: 'node', id: n.dataset.id }); ev.preventDefault(); }
    });
  }

  /* ------------------------------------------------ the controls */
  root.querySelector('#ex-group').addEventListener('change', (ev) => {
    state.group = ev.target.value; state.vb = null; draw();
    say(`Grouped by ${ev.target.selectedOptions[0].textContent.toLowerCase()}.`);
  });
  root.querySelector('#ex-relayout').addEventListener('click', () => { state.vb = null; state.yaw = 0.55; state.pitch = -0.32; draw(); say('Layout recomputed from the records; the starting view restored.'); });
  for (const b of root.querySelectorAll('[data-turn]')) b.addEventListener('click', () => {
    const t = { left: [-0.25, 0], right: [0.25, 0], up: [0, 0.18], down: [0, -0.18] }[b.dataset.turn];
    turn(t[0], t[1], 'Network turned.');
  });
  for (const b of root.querySelectorAll('[data-zoom]')) b.addEventListener('click', () => { const z = b.dataset.zoom; if (z === 'in') zoom(1.25); else if (z === 'out') zoom(0.8); else fit(); });
  const find = root.querySelector('#ex-find');
  const doFind = () => {
    const q = find.value.trim().toLowerCase();
    if (!q) return;
    const hit = counts.instruments.find((i) => i.short_name.toLowerCase() === q || i.id === q)
      || counts.instruments.find((i) => i.short_name.toLowerCase().startsWith(q))
      || counts.instruments.find((i) => (i.full_name || '').toLowerCase().includes(q) || (i.aliases || []).some((a) => a.toLowerCase().includes(q)));
    if (hit) select({ type: 'node', id: hit.id }, { focusNode: false });
    else say(`No instrument matches “${find.value.trim()}”.`);
  };
  find.addEventListener('change', doFind);
  find.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { doFind(); ev.preventDefault(); } });

  legend();
  draw();
  document.addEventListener('obs:theme', () => {}); // colours are CSS variables: nothing to redraw
  /* on a phone the ego view always has a centre, so the panel starts on it */
  const start = focus && byId(focus) ? focus : window.matchMedia('(max-width: 51.99rem)').matches ? 'ai-act' : null;
  if (start && byId(start)) select({ type: 'node', id: start });
  else { panel(); table(); ego(); }
  return { select, counts };
}
