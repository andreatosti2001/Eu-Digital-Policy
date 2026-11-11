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
     an astrolabe, every instrument on one ring with its name read outward,
     ordered from the ids by a fixed number of passes, no randomness.
     Grouping, when chosen, divides the ring into sectors by a field already
     in the records (coverage() of js/routes.js, or brief_part), never by
     community detection (roadmap §8, "PV2-04, C.1 question 1").
   - An instrument with no relationship stays on the ring, in a sector of
     its own (or in its group), and says "no relationship recorded".
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

/* ---------------------------------------------------------- the deterministic layout: an astrolabe
   Every instrument sits on one ring, its name read outward along its
   radius, so no two names can collide. The ring is divided into sectors —
   the groups when a grouping is chosen; otherwise one sector for the
   instruments in a relationship and one for those with none. Within a
   sector the order starts from the instruments' ids and is refined by a
   fixed number of passes that move each instrument toward the mean place of
   the instruments it is related to (fewer and shorter chords). No
   randomness: the same records give the same picture. */

const RING = 165;

function ringLayout(counts, mode) {
  const groups = counts.groupsBy(mode) || [
    { key: '__linked', label: 'In a relationship', members: counts.instruments.filter((i) => counts.touching.get(i.id).length) },
    { key: '__none', label: 'No relationship', members: counts.isolated },
  ].filter((g) => g.members.length);
  const slots = counts.instruments.length + groups.length; // one empty slot between sectors
  const step = (2 * Math.PI) / slots;
  const order = groups.map((g) => [...g.members].sort((a, b) => a.id.localeCompare(b.id)).map((i) => i.id));
  const neighbours = new Map(counts.instruments.map((i) => [i.id, []]));
  for (const r of counts.rels) { if (r.from === r.to) continue; neighbours.get(r.from)?.push(r.to); neighbours.get(r.to)?.push(r.from); }
  const angles = new Map();
  const place = () => {
    let slot = 0;
    order.forEach((list) => { for (const id of list) { angles.set(id, -Math.PI / 2 + (slot + 0.5) * step); slot++; } slot++; });
  };
  place();
  for (let pass = 0; pass < 24; pass++) {
    order.forEach((list, gi) => {
      const key = new Map(list.map((id, i) => {
        const ns = neighbours.get(id);
        if (!ns.length) return [id, i];
        /* the circular mean of the neighbours' angles, read as a slot inside this sector */
        let sx = Math.cos(angles.get(id)), sy = Math.sin(angles.get(id));
        for (const n of ns) { sx += Math.cos(angles.get(n)); sy += Math.sin(angles.get(n)); }
        const target = Math.atan2(sy, sx);
        const first = angles.get(list[0]);
        let d = target - first; while (d < -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
        return [id, Math.max(-1, Math.min(list.length, d / step))];
      }));
      order[gi] = [...list].sort((a, b) => (key.get(a) - key.get(b)) || a.localeCompare(b));
    });
    place();
  }
  const pos = new Map([...angles].map(([id, a]) => [id, { x: RING * Math.cos(a), y: RING * Math.sin(a), a }]));
  let slot = 0;
  const sectors = groups.map((g, gi) => {
    const a0 = -Math.PI / 2 + slot * step, a1 = a0 + order[gi].length * step;
    slot += order[gi].length + 1;
    return { label: g.label, short: g.short || null, n: g.members.length, a0, a1 };
  });
  const half = RING + 222;
  return { pos, sectors, box: { x: -half, y: -half, w: 2 * half, h: 2 * half } };
}

/* ---------------------------------------------------------- drawing */

const NODE_R = 7;

function edgeGeometry(a, b, curve, R1 = NODE_R + 3, R2 = NODE_R + 6, centre = null) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(0.01, Math.hypot(dx, dy));
  /* on the ring, a chord is bent toward the centre (more for a long one), and two between one pair are drawn apart */
  const pull = centre ? 0.25 + 0.35 * (d / (2 * RING)) : 0;
  const c = centre
    ? { x: mx + (centre.x - mx) * pull - (dy / d) * curve * d * 0.6, y: my + (centre.y - my) * pull + (dx / d) * curve * d * 0.6 }
    : { x: mx - (dy / d) * curve * d, y: my + (dx / d) * curve * d };
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
  let text;
  if (labelSide === 'radial') {
    /* the name read outward along the radius; on the left half turned so it never reads upside down */
    const deg = (p.a * 180) / Math.PI;
    const left = Math.cos(p.a) < 0;
    text = `<text x="${left ? -(NODE_R + 6) : NODE_R + 6}" y="4" text-anchor="${left ? 'end' : 'start'}" transform="rotate(${(left ? deg + 180 : deg).toFixed(2)})">${esc(inst.short_name)}</text>`;
  } else {
    const below = labelSide === 'below';
    text = `<text x="${below ? 0 : NODE_R + 5}" y="${below ? NODE_R + 15 : 4}" text-anchor="${below ? 'middle' : 'start'}">${esc(inst.short_name)}</text>`;
  }
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
    roving: null,
    tableAll: !window.matchMedia('(max-width: 51.99rem)').matches,
  };
  const byId = (id) => ix.instrument.get(id);
  const relById = new Map(counts.rels.map((r) => [r.id, r]));
  const visibleRels = () => counts.rels.filter((r) => !state.hidden.has(r.kind));

  root.innerHTML = `
    <div class="explorer">
      <div class="ex-tools" role="group" aria-label="Explorer controls">
        <label>Find an instrument<input type="search" id="ex-find" list="ex-names" autocomplete="off" placeholder="e.g. GDPR"></label>
        <datalist id="ex-names">${counts.instruments.map((i) => `<option value="${esc(i.short_name)}"></option>`).join('')}</datalist>
        <label class="ex-grp">Group by<select id="ex-group">
          <option value="none">No grouping</option>
          <option value="coverage">Coverage (covered, mapped, watched, excluded)</option>
          <option value="part">Part of the brief</option>
        </select></label>
        <button type="button" id="ex-relayout">Re-layout and reset view</button>
        <div class="ex-zoom" role="group" aria-label="Zoom">
          <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
          <button type="button" data-zoom="out" aria-label="Zoom out">−</button>
          <button type="button" data-zoom="reset">Fit</button>
        </div>
        <p class="visually-hidden" id="ex-live" aria-live="polite"></p>
      </div>
      <div class="ex-canvas"><div id="ex-svg"></div>
        <p class="ex-hint">Keyboard: Tab into the network; arrow keys move between instruments by position; Enter selects; Esc clears; + and − zoom. The relationships of a selection are buttons in the panel's Relations tab, and every relationship is in the table below. Drag the background to pan.</p></div>
      <div class="ego" id="ex-ego"></div>
      <aside class="ex-panel" id="ex-panel" aria-label="The selection"></aside>
      <div class="ex-legend" id="ex-legend"></div>
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
      <p class="lg-note"><span id="ex-shown">${shownText()}</span> An arrow runs from → to and is drawn only where the record gives a direction (${counts.directed}); a mutual relationship (${counts.mutual}) has none.
      ${counts.unused.length ? ` No relationship is recorded of ${counts.unused.length === 1 ? 'one type' : counts.unused.length + ' types'} in the vocabulary: ${counts.unused.map((k) => esc(label(ix, k))).join(', ')}.` : ''}</p>
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
    L = ringLayout(counts, state.group);
    state.base = { ...L.box };
    if (!state.vb) state.vb = { ...L.box };
    const curve = curvatures(counts.rels);
    const C = { x: 0, y: 0 };
    /* the astrolabe: two hairline circles and a tick every 10°, drawing only (aria-hidden) */
    const ticks = Array.from({ length: 36 }, (_, i) => {
      const a = (i * Math.PI) / 18, r0 = RING + 198, r1 = RING + (i % 9 === 0 ? 186 : 192);
      return `<line x1="${(r0 * Math.cos(a)).toFixed(1)}" y1="${(r0 * Math.sin(a)).toFixed(1)}" x2="${(r1 * Math.cos(a)).toFixed(1)}" y2="${(r1 * Math.sin(a)).toFixed(1)}"/>`;
    }).join('');
    const arc = (r, a0, a1) => `M${(r * Math.cos(a0)).toFixed(1)},${(r * Math.sin(a0)).toFixed(1)} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${(r * Math.cos(a1)).toFixed(1)},${(r * Math.sin(a1)).toFixed(1)}`;
    const sectors = L.sectors.map((sct, i) => {
      const mid = (sct.a0 + sct.a1) / 2, r = RING - 22;
      const lx = r * Math.cos(mid), ly = r * Math.sin(mid);
      return `<path class="sector-arc" d="${arc(RING - 12, sct.a0 + 0.02, sct.a1 - 0.02)}"/>` +
        `<text class="group-label" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${Math.abs(Math.cos(mid)) < 0.3 ? 'middle' : Math.cos(mid) > 0 ? 'end' : 'start'}" dominant-baseline="middle">${sct.short ? esc(sct.short) : `${esc(sct.label)} · ${sct.n}`}</text><title>${esc(sct.label)}: ${sct.n}</title>`;
    }).join('');
    const deco = `<g class="astro" aria-hidden="true"><circle r="${RING + 198}"/><circle r="${RING}" class="astro-ring"/>${ticks}</g>`;
    const edges = counts.rels.map((r) => edgeSvg(ix, r, edgeGeometry(L.pos.get(r.from), L.pos.get(r.to), curve.get(r), NODE_R + 3, NODE_R + 6, C), 'mk')).join('');
    const nodes = counts.instruments.map((i) => nodeSvg(ix, counts, i, L.pos.get(i.id), { labelSide: 'radial' })).join('');
    root.querySelector('#ex-svg').innerHTML = `<svg xmlns="${SVGNS}" viewBox="${vbStr()}" role="group" aria-label="Network of ${counts.instruments.length} instruments and ${counts.rels.length} recorded relationships, drawn on a ring. Use the arrow keys to move between instruments.">` +
      markers('mk', kindsInUse) + `${deco}<g class="hulls" aria-hidden="true">${sectors}</g><g class="edges">${edges}</g><g class="nodes">${nodes}</g></svg>`;
    wireCanvas();
    applyFilters();
    applySelection(false);
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
    /* pan by dragging the background */
    let drag = null, moved = false;
    svg.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.node') || ev.target.closest('.edge') || ev.button !== 0) return;
      drag = { x: ev.clientX, y: ev.clientY, vb: { ...state.vb } };
      svg.setPointerCapture(ev.pointerId);
      svg.classList.add('dragging');
    });
    svg.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const s = state.vb.w / svg.clientWidth;
      const dx = (ev.clientX - drag.x) * s, dy = (ev.clientY - drag.y) * s;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      state.vb = { ...drag.vb, x: drag.vb.x - dx, y: drag.vb.y - dy };
      setVb();
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
  root.querySelector('#ex-relayout').addEventListener('click', () => { state.vb = null; draw(); say('Layout recomputed from the records; view reset.'); });
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
