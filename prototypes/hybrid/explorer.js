/* ============================================================
   PV2-05 · the Regulatory Network Explorer, Hybrid instance
   (docs/POST-V2.md §3 C and §3 D, additions of 11 Nov 2026; roadmap §8,
   "PV2-05, C.1 question 1": flat and table-led).

   What differs from the observatory's (prototypes/observatory/explorer.js)
   is the hierarchy and the presentation, never the data or the essential
   interactions:
   - the relationships table LEADS: it is the reading surface, first in the
     page; the map beside it is its picture, keyed to it — each instrument's
     node carries the number of its row group in the table (alphabetical),
     and its name is drawn when it is selected or next to the selection;
   - the map is FLAT (SVG), the instruments on concentric rings by coverage()
     of js/routes.js — covered inside, then mapped, watched, excluded —
     placed on each ring by the order of the brief's parts (brief_part,
     those with none after) and then by id. Nothing is computed from the
     relationships to place a node: no force, no community detection;
     nothing moves and nothing turns.

   The same core as the observatory's, and the same rules:
   - nodes are the instruments of data/instruments.json and nothing else;
     edges are its `relationships` array and nothing else;
   - the counts come from ONE function, explorerCounts() of the observatory's
     explorer.js, imported — so both concepts count the same way;
   - type by three signals: a colour, a stroke pattern, a two-letter code
     (on the selection's edges and in the legend); an arrow ONLY where
     `symmetric` is false, never inferred from the type; two relationships
     between one pair are two edges drawn apart;
   - a tabbed panel (Properties, Relations); the legend always visible, and
     it is the type filter; focus on a node's direct connections;
   - an absent panel field reads "not recorded": the panel shows a
     relationship through ../editorial/relations.js, the table's own rules;
   - an instrument with no relationship stays on its ring and says
     "no relationship recorded";
   - on a phone the map is not shrunk: an "ego" view of one instrument and
     its direct relationships, with the panel and the table following it.

   The type codes and stroke patterns below repeat the observatory's
   KIND_STYLE, which that module does not export and which this session may
   not change (roadmap §8, "The scope of PV2-05"): a presentation choice
   kept identical on purpose, so the two concepts compare on hierarchy and
   layout, not on a different code for the same type.
   ============================================================ */

import { esc, F, label, has, notRecorded, statusTag, evidenceTag } from '../observatory/common.js';
import { explorerCounts } from '../observatory/explorer.js';
import { relationsTable } from '../editorial/relations.js';
import { coverage, instrumentHref } from '../../js/routes.js';

const SVGNS = 'http://www.w3.org/2000/svg';

const KIND_STYLE = {
  'rel-kind:amends': ['AM', ''], 'rel-kind:repeals': ['RP', '9 3 2 3'], 'rel-kind:defers-to': ['DF', '7 4'],
  'rel-kind:enables': ['EN', '2 4'], 'rel-kind:overlap': ['OV', ''], 'rel-kind:complement': ['CO', '7 4'],
  'rel-kind:conflict': ['CF', '2 3'], 'rel-kind:lex-specialis': ['LS', '9 3 2 3'], 'rel-kind:legal-basis': ['LB', ''],
  'rel-kind:carve-out': ['CV', '12 4'], 'rel-kind:sequence': ['SQ', '4 4'], 'rel-kind:implements': ['IM', '1 3'],
};
const kindKey = (k) => String(k || '').split(':').pop() || 'unknown';
const kindCode = (k) => (KIND_STYLE[k] || ['??'])[0];
const kindDash = (k) => (KIND_STYLE[k] || ['', '3 3'])[1];

/* the rings, inside out; the radius is in the drawing's own units */
const RINGS = [['covered', 'Covered', 112], ['mapped', 'Mapped', 178], ['watched', 'Watched', 228], ['excluded', 'Excluded', 270]];
const OTHER_R = 310; // coverage() gave none of the four: none on 13 Nov 2026, but such an instrument is never dropped
const COVERAGE_WORD = {
  covered: 'Covered — analysed by the site',
  mapped: 'Mapped — recorded for its links, not analysed in depth',
  watched: 'Watched — named by the site, not analysed',
  excluded: 'Excluded — named by the site and deliberately not analysed',
};
const NODE_R = 11;
const PHONE = '(max-width: 51.99rem)';

/* ---------------------------------------------------------- the deterministic layout: rings by coverage */

function ringLayout(counts, db) {
  const order = new Map((db.brief?.parts || []).map((p, i) => [p.id, i]));
  const po = (i) => (order.has(i.brief_part) ? order.get(i.brief_part) : Infinity);
  const known = new Set(RINGS.map((r) => r[0]));
  const defs = [...RINGS];
  const other = counts.instruments.filter((i) => !known.has(coverage(i)));
  if (other.length) defs.push(['__none', 'Coverage not recorded', OTHER_R]);
  const pos = new Map(), rings = [];
  defs.forEach(([key, word, R], ri) => {
    const members = (key === '__none' ? other : counts.instruments.filter((i) => coverage(i) === key))
      .sort((a, b) => (po(a) - po(b)) || a.id.localeCompare(b.id));
    if (!members.length) return;
    const n = members.length, step = (2 * Math.PI) / n, a0 = -Math.PI / 2 + (ri % 2 ? step / 2 : 0);
    members.forEach((inst, k) => {
      const a = a0 + k * step;
      pos.set(inst.id, { x: R * Math.cos(a), y: R * Math.sin(a), a, ring: rings.length, k });
    });
    rings.push({ key, word, R, members });
  });
  return { pos, rings };
}

/* ---------------------------------------------------------- drawing */

const unit = (x, y) => { const l = Math.max(0.01, Math.hypot(x, y)); return { x: x / l, y: y / l }; };

/** A quadratic edge whose control point is the midpoint pulled toward the
 *  centre (a chord), moved sideways for a second relationship between the
 *  same pair; trimmed at both ends so the arrow stops at the node. */
function edgeGeometry(a, b, off, pull = 0.5) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(0.01, Math.hypot(dx, dy));
  const c = { x: mx * pull - (dy / d) * off * d, y: my * pull + (dx / d) * off * d };
  const u1 = unit(c.x - a.x, c.y - a.y), u2 = unit(b.x - c.x, b.y - c.y);
  const s = { x: a.x + u1.x * (NODE_R + 2), y: a.y + u1.y * (NODE_R + 2) };
  const e = { x: b.x - u2.x * (NODE_R + 4), y: b.y - u2.y * (NODE_R + 4) };
  const mid = { x: 0.25 * a.x + 0.5 * c.x + 0.25 * b.x, y: 0.25 * a.y + 0.5 * c.y + 0.25 * b.y };
  return { d: `M${s.x.toFixed(1)},${s.y.toFixed(1)} Q${c.x.toFixed(1)},${c.y.toFixed(1)} ${e.x.toFixed(1)},${e.y.toFixed(1)}`, mid };
}

/** Offsets so two relationships between one pair are drawn apart. */
function offsets(rels) {
  const pairs = new Map();
  for (const r of rels) { const k = [r.from, r.to].sort().join('|'); if (!pairs.has(k)) pairs.set(k, []); pairs.get(k).push(r); }
  const out = new Map();
  for (const list of pairs.values()) {
    list.forEach((r, i) => {
      let o = list.length === 1 ? 0 : (i - (list.length - 1) / 2) * 0.3;
      if (r.from > r.to) o = -o; // the same side whatever the record's own order
      out.set(r, o);
    });
  }
  return out;
}

const markers = (prefix, kinds) => '<defs>' + kinds.map((k) =>
  `<marker id="${prefix}-${kindKey(k)}" class="mk-${kindKey(k)}" viewBox="0 0 10 10" refX="8.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,0.5 L10,5 L0,9.5 z"/></marker>`).join('') + '</defs>';

function directionWords(ix, r) {
  const a = ix.instrument.get(r.from)?.short_name || r.from;
  const b = ix.instrument.get(r.to)?.short_name || r.to;
  const verb = (label(ix, r.kind) || 'relates to').toLowerCase();
  if (r.symmetric === true) return `Mutual, no direction: ${esc(a)} and ${esc(b)} — ${esc(verb)}`;
  if (r.symmetric === false) return `${esc(a)} ${esc(verb)} ${esc(b)} (from ${esc(a)} to ${esc(b)})`;
  return `${esc(a)} — ${esc(b)}: ${notRecorded('direction not recorded')}`;
}
const plainWords = (ix, r) => directionWords(ix, r).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');

function edgeSvg(ix, r, geo, prefix) {
  const k = kindKey(r.kind), dash = kindDash(r.kind);
  const arrow = r.symmetric === false ? ` marker-end="url(#${prefix}-${k})"` : '';
  return `<g class="edge k-${k}" data-rel="${esc(r.id)}" aria-hidden="true"><title>${esc(plainWords(ix, r))}</title>` +
    `<path class="e-line"${dash ? ` stroke-dasharray="${dash}"` : ''} d="${geo.d}"${arrow}/>` +
    `<path class="e-hit" d="${geo.d}"/>` +
    `<g class="e-badge"><rect x="${(geo.mid.x - 10).toFixed(1)}" y="${(geo.mid.y - 6.5).toFixed(1)}" width="20" height="13" rx="2"/>` +
    `<text x="${geo.mid.x.toFixed(1)}" y="${(geo.mid.y + 3).toFixed(1)}">${esc(kindCode(r.kind))}</text></g></g>`;
}

function nodeLabel(ix, counts, inst, n) {
  const k = counts.touching.get(inst.id).length;
  const cov = coverage(inst);
  return `${n}, ${inst.short_name}, ${label(ix, inst.kind) || 'instrument'}; ${cov || 'coverage not recorded'}; ${k ? F.plural(k, 'relationship') + ' recorded' : 'no relationship recorded'}`;
}

/* ---------------------------------------------------------- the explorer */

export function mountExplorer(root, ix, db, { focus = null } = {}) {
  const counts = explorerCounts(ix, db);
  const alpha = [...counts.instruments].sort((a, b) => a.short_name.localeCompare(b.short_name));
  const num = new Map(alpha.map((i, k) => [i.id, k + 1])); // the table's order: the key between table and map
  const L = ringLayout(counts, db);
  const kindsInUse = [...counts.byKind.keys()].sort((a, b) => (counts.byKind.get(b) - counts.byKind.get(a)) || String(label(ix, a)).localeCompare(label(ix, b)));
  const relById = new Map(counts.rels.map((r) => [r.id, r]));
  const byId = (id) => ix.instrument.get(id);
  const phone = () => window.matchMedia(PHONE).matches;
  const state = { hidden: new Set(), sel: null, hood: false, tab: 'props', tableAll: true };
  const visibleRels = () => counts.rels.filter((r) => !state.hidden.has(r.kind));

  root.innerHTML = `
    <div class="hx">
      <div class="hx-main">
        <div class="hx-pick">
          <label for="hx-inst">Instrument</label>
          <select id="hx-inst"><option value="">— none selected: every instrument —</option>${alpha.map((i) =>
            `<option value="${esc(i.id)}">${num.get(i.id)} · ${esc(i.short_name)}</option>`).join('')}</select>
          <p class="visually-hidden" id="hx-live" aria-live="polite"></p>
        </div>
        <div class="hx-ego" id="hx-ego"></div>
        <aside class="ex-panel hx-panel" id="hx-panel" aria-label="The selection"></aside>
        <section class="hx-table" aria-labelledby="hx-table-h">
          <h2 id="hx-table-h">The relationships, recorded</h2>
          <div id="hx-table"></div>
        </section>
      </div>
      <div class="hx-side">
        <figure class="hx-map" id="hx-map"></figure>
        <div class="ex-legend hx-legend" id="hx-legend"></div>
      </div>
    </div>`;

  const say = (t) => { const l = root.querySelector('#hx-live'); if (l) l.textContent = t; };

  /* ------------------------------------------------ the legend: always visible, and the type filter */
  function shownText() {
    const shown = visibleRels().length;
    return `Showing ${shown} of ${counts.rels.length} relationships${state.hidden.size ? ` — ${state.hidden.size === 1 ? 'one type' : state.hidden.size + ' types'} hidden by the filter` : ''}.`;
  }
  function legend() {
    const box = root.querySelector('#hx-legend');
    box.innerHTML = `<h3>Types of relationship <span class="meta">— untick to hide</span></h3>
      <ul>${kindsInUse.map((k) => {
        const kk = kindKey(k), dash = kindDash(k);
        return `<li><label><input type="checkbox" data-kind="${esc(k)}"${state.hidden.has(k) ? '' : ' checked'}>
          <svg width="44" height="12" aria-hidden="true" class="k-${kk}"><line x1="2" y1="6" x2="42" y2="6" stroke-width="2.2"${dash ? ` stroke-dasharray="${dash}"` : ''}/></svg>
          <span class="code k-${kk}">${esc(kindCode(k))}</span><span>${esc(label(ix, k))}</span><span class="lg-count">${counts.byKind.get(k)}</span></label></li>`;
      }).join('')}</ul>
      <p class="lg-note"><span id="hx-shown">${shownText()}</span> An arrow only where the record gives a direction (${counts.directed}); none on a mutual one (${counts.mutual}).${counts.unused.length ? ` None recorded: ${counts.unused.map((k) => esc(label(ix, k))).join(', ')}.` : ''}</p>
      <h3>Rings, inside out</h3>
      <ol class="lg-rings">${L.rings.map((g) => `<li><b>${esc(g.word)}</b> · ${g.members.length}${COVERAGE_WORD[g.key] ? ` <span class="meta">${esc(COVERAGE_WORD[g.key].split(' — ')[1])}</span>` : ''}</li>`).join('')}</ol>
      <p class="lg-note">On each ring: by the brief's part, those with none after, then by id. The number in a node is its row group in the table. ${counts.isolated.length} instruments are in no relationship; they keep their place.</p>`;
    for (const cb of box.querySelectorAll('input[data-kind]')) {
      cb.addEventListener('change', () => {
        if (cb.checked) state.hidden.delete(cb.dataset.kind); else state.hidden.add(cb.dataset.kind);
        if (state.sel?.type === 'edge' && state.hidden.has(relById.get(state.sel.id)?.kind)) state.sel = null;
        root.querySelector('#hx-shown').textContent = shownText();
        applyMap(); panel(); table(); ego();
        say(shownText());
      });
    }
  }

  /* ------------------------------------------------ the map: flat, rings by coverage, nothing moves */
  const off = offsets(counts.rels);
  function map() {
    const box = root.querySelector('#hx-map');
    const half = OTHER_R + (L.rings.some((g) => g.key === '__none') ? 40 : -10);
    const rings = L.rings.map((g) => `<circle class="ring" r="${g.R}"/>`).join('');
    const edges = counts.rels.map((r) => edgeSvg(ix, r, edgeGeometry(L.pos.get(r.from), L.pos.get(r.to), off.get(r)), 'hk')).join('');
    const nodes = counts.instruments.map((inst) => {
      const p = L.pos.get(inst.id), n = num.get(inst.id);
      const out = L.rings[p.ring].R < 200; // names outward on the inner rings, inward on the outer ones
      const c = Math.cos(p.a), s = Math.sin(p.a), dir = out ? 1 : -1;
      const tx = dir * c * (NODE_R + 5), ty = dir * s * (NODE_R + 5) + 4;
      const anchor = Math.abs(c) < 0.3 ? 'middle' : (c * dir > 0 ? 'start' : 'end');
      const iso = counts.touching.get(inst.id).length ? '' : ' isolated';
      return `<g class="node c-${coverage(inst) || 'none'}${iso}" data-id="${esc(inst.id)}" role="button" tabindex="-1" aria-pressed="false" aria-label="${esc(nodeLabel(ix, counts, inst, n))}" transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})">` +
        `<title>${n} · ${esc(inst.short_name)}</title><circle class="n-ring" r="${NODE_R + 4}"/><circle class="n-dot" r="${NODE_R}"/>` +
        `<text class="n-num" y="3.6" text-anchor="middle">${n}</text>` +
        `<text class="n-name" x="${tx.toFixed(1)}" y="${(ty + (Math.abs(c) < 0.3 ? dir * s * 6 : 0)).toFixed(1)}" text-anchor="${anchor}">${esc(inst.short_name)}</text></g>`;
    }).join('');
    box.innerHTML = `<svg xmlns="${SVGNS}" viewBox="${-half} ${-half} ${2 * half} ${2 * half}" role="group" aria-label="Map of ${counts.instruments.length} instruments on rings by coverage and the ${counts.rels.length} relationships recorded between them. Arrow keys move along a ring and between rings; Enter selects; Escape clears.">` +
      markers('hk', kindsInUse) + `<g class="rings" aria-hidden="true">${rings}</g><g class="edges">${edges}</g><g class="nodes">${nodes}</g></svg>
      <figcaption>The map of the table. Rings by coverage, inside out: ${L.rings.map((g) => `${esc(g.word.toLowerCase())} ${g.members.length}`).join(', ')}. Laid out from the records each time, the same way every time; nothing moves on its own.</figcaption>`;
    wireMap(box.querySelector('svg'));
  }
  function setRoving(id) {
    for (const n of root.querySelectorAll('#hx-map .node')) n.setAttribute('tabindex', n.dataset.id === id ? '0' : '-1');
  }
  function focusNode(id) {
    setRoving(id);
    if (phone()) return;
    root.querySelector(`#hx-map .node[data-id="${CSS.escape(id)}"]`)?.focus();
  }
  function wireMap(svg) {
    setRoving(alpha[0].id);
    svg.addEventListener('click', (ev) => {
      const n = ev.target.closest('.node'), e = ev.target.closest('.edge');
      if (n) select({ type: 'node', id: n.dataset.id }, { from: 'map' });
      else if (e && !e.classList.contains('off')) select({ type: 'edge', id: e.dataset.rel }, { from: 'map' });
    });
    svg.addEventListener('keydown', (ev) => {
      const cur = ev.target.closest('.node');
      if (!cur) return;
      const id = cur.dataset.id;
      if (ev.key === 'Enter' || ev.key === ' ') { select({ type: 'node', id }, { from: 'map' }); ev.preventDefault(); return; }
      if (ev.key === 'Escape') { select(null); ev.preventDefault(); return; }
      if (ev.key === 'Home' || ev.key === 'End') { focusNode((ev.key === 'Home' ? alpha[0] : alpha[alpha.length - 1]).id); ev.preventDefault(); return; }
      const p = L.pos.get(id), ring = L.rings[p.ring];
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
        const k = (p.k + (ev.key === 'ArrowRight' ? 1 : -1) + ring.members.length) % ring.members.length;
        focusNode(ring.members[k].id); ev.preventDefault(); return;
      }
      if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
        const to = L.rings[p.ring + (ev.key === 'ArrowUp' ? 1 : -1)]; // up = outward, down = inward
        if (to) {
          const near = to.members.reduce((best, m) => {
            const d = Math.abs(Math.atan2(Math.sin(L.pos.get(m.id).a - p.a), Math.cos(L.pos.get(m.id).a - p.a)));
            return d < best.d ? { d, id: m.id } : best;
          }, { d: Infinity, id: null });
          if (near.id) focusNode(near.id);
        }
        ev.preventDefault();
      }
    });
  }
  function applyMap() {
    const svg = root.querySelector('#hx-map svg');
    if (!svg) return;
    const sel = state.sel, vis = new Set(visibleRels().map((r) => r.id));
    const near = new Set(), nearEdges = new Set();
    if (sel?.type === 'node') {
      near.add(sel.id);
      for (const r of counts.touching.get(sel.id) || []) if (vis.has(r.id)) { nearEdges.add(r.id); near.add(r.from); near.add(r.to); }
    } else if (sel?.type === 'edge') { const r = relById.get(sel.id); nearEdges.add(r.id); near.add(r.from); near.add(r.to); }
    for (const n of svg.querySelectorAll('.node')) {
      const on = sel?.type === 'node' && sel.id === n.dataset.id;
      n.classList.toggle('selected', on);
      n.setAttribute('aria-pressed', on ? 'true' : 'false');
      n.classList.toggle('named', near.has(n.dataset.id));
      n.classList.toggle('dim', state.hood && !!sel && !near.has(n.dataset.id));
    }
    for (const g of svg.querySelectorAll('.edge')) {
      const id = g.dataset.rel;
      g.classList.toggle('off', !vis.has(id));
      g.classList.toggle('selected', sel?.type === 'edge' && sel.id === id);
      g.classList.toggle('coded', nearEdges.has(id));
      g.classList.toggle('dim', state.hood && !!sel && !nearEdges.has(id));
    }
  }

  /* ------------------------------------------------ selection */
  function select(sel, { from = '' } = {}) {
    state.sel = sel;
    if (!sel) state.hood = false;
    state.tab = 'props';
    state.tableAll = !sel;
    if (sel?.type === 'node') setRoving(sel.id);
    const pick = root.querySelector('#hx-inst');
    if (pick) pick.value = sel?.type === 'node' ? sel.id : '';
    applyMap(); panel(); table(); ego();
    /* the table leads: a choice made on the map brings the panel above the table into view */
    if (from === 'map' && sel && !phone()) root.querySelector('#hx-panel')?.scrollIntoView({ block: 'nearest' });
    say(sel ? (sel.type === 'node' ? `${byId(sel.id)?.short_name} selected; the table shows its relationships.` : `Relationship selected: ${plainWords(ix, relById.get(sel.id))}.`) : 'Selection cleared; the table shows every instrument.');
  }

  /* ------------------------------------------------ the panel: two tabs */
  function tabs(propsHtml, relsHtml, relsCount) {
    const t = state.tab;
    return `<div class="tabs" role="tablist" aria-label="Selection details">
        <button type="button" role="tab" id="hx-tab-props" aria-controls="hx-tp-props" aria-selected="${t === 'props'}" tabindex="${t === 'props' ? 0 : -1}">Properties</button>
        <button type="button" role="tab" id="hx-tab-rels" aria-controls="hx-tp-rels" aria-selected="${t === 'rels'}" tabindex="${t === 'rels' ? 0 : -1}">Relations (${relsCount})</button>
      </div>
      <div role="tabpanel" id="hx-tp-props" aria-labelledby="hx-tab-props"${t === 'props' ? '' : ' hidden'}>${propsHtml}</div>
      <div role="tabpanel" id="hx-tp-rels" aria-labelledby="hx-tab-rels"${t === 'rels' ? '' : ' hidden'}>${relsHtml}</div>`;
  }
  const relButton = (r) => `<li><button type="button" data-rel="${esc(r.id)}"><span class="code k-${kindKey(r.kind)}">${esc(kindCode(r.kind))}</span><span class="r-text">${directionWords(ix, r)}</span></button></li>`;
  function panel() {
    const box = root.querySelector('#hx-panel');
    const sel = state.sel;
    if (!sel) {
      box.innerHTML = `<p class="p-kicker">Nothing selected</p>
        <p class="p-title">${counts.instruments.length} instruments · ${counts.rels.length} relationships</p>
        <p class="p-sub">${counts.directed} with a direction, ${counts.mutual} mutual. Choose an instrument above, a row group's “Show on the map”, or a node or an edge on the map.</p>
        <details class="p-iso"><summary>${counts.isolated.length} instruments in no relationship</summary>
        <ul class="rels">${counts.isolated.map((i) => `<li><button type="button" data-node="${esc(i.id)}"><span class="code">${num.get(i.id)}</span><span class="r-text">${esc(i.short_name)}</span></button></li>`).join('')}</ul></details>`;
    } else if (sel.type === 'node') {
      const inst = byId(sel.id);
      const cov = coverage(inst);
      const part = inst.brief_part ? (db.brief?.parts || []).find((p) => p.id === inst.brief_part) : null;
      const rels = counts.touching.get(inst.id) || [];
      const shown = rels.filter((r) => !state.hidden.has(r.kind));
      const props = `<p class="p-kicker">${num.get(inst.id)} · ${inst.kind ? esc(label(ix, inst.kind)) : 'Instrument'}</p>
        <p class="p-title">${esc(inst.short_name)}</p>
        <p class="p-sub">${inst.full_name ? esc(inst.full_name) : notRecorded('full name not recorded')}</p>
        <dl class="facts">
          <dt>Status</dt><dd>${statusTag(ix, inst.legislative_status)}</dd>
          <dt>Coverage</dt><dd>${cov ? esc(COVERAGE_WORD[cov] || cov) : notRecorded()}</dd>
          <dt>Part of the brief</dt><dd>${part ? `Part ${esc(part.roman)} — ${esc(part.title)}` : inst.brief_part ? `<code>${esc(inst.brief_part)}</code>` : notRecorded('not assigned to a part')}</dd>
          <dt>CELEX</dt><dd>${inst.celex ? `<code>${esc(inst.celex)}</code>` : notRecorded()}</dd>
          <dt>Relationships</dt><dd>${rels.length ? esc(F.plural(rels.length, 'relationship')) + ' recorded' + (shown.length !== rels.length ? ` (${shown.length} shown by the type filter)` : '') : notRecorded('no relationship recorded')}</dd>
        </dl>
        <div class="p-actions">
          <a href="regulation.html?id=${encodeURIComponent(inst.id)}">Its page</a>
          <a href="${esc(instrumentHref(inst, ix))}">On the current site</a>
          ${rels.length ? `<button type="button" data-act="hood" aria-pressed="${state.hood}">${state.hood ? 'Show the whole map' : 'Focus on its connections'}</button>` : ''}
          <button type="button" data-act="clear">Clear selection</button>
        </div>`;
      const relsHtml = rels.length
        ? `<ul class="rels">${shown.map(relButton).join('')}</ul>${shown.length !== rels.length ? `<p class="meta">${rels.length - shown.length} hidden by the type filter.</p>` : ''}`
        : `<p>${notRecorded('no relationship recorded')}</p><p class="p-sub">${esc(inst.short_name)} appears in no relationship in <code>data/instruments.json</code>. That is the state of the record, not a finding that it relates to nothing.</p>`;
      box.innerHTML = tabs(props, relsHtml, shown.length);
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
          <button type="button" data-act="hood" aria-pressed="${state.hood}">${state.hood ? 'Show the whole map' : 'Focus on this relationship'}</button>
          <button type="button" data-act="clear">Clear selection</button>
        </div>`;
      const relsHtml = `<ul class="rels">${[r.from, r.to].map((id) => `<li><button type="button" data-node="${esc(id)}"><span class="code">${id === r.from && r.symmetric === false ? 'from' : id === r.to && r.symmetric === false ? 'to' : '—'}</span><span class="r-text">${num.get(id) ?? ''} · ${esc(byId(id)?.short_name || id)}</span></button></li>`).join('')}</ul>`;
      box.innerHTML = tabs(props, relsHtml, 2);
    }
    for (const b of box.querySelectorAll('button[data-rel]')) b.addEventListener('click', () => { select({ type: 'edge', id: b.dataset.rel }); box.querySelector('[role="tab"]')?.focus(); });
    for (const b of box.querySelectorAll('button[data-node]')) b.addEventListener('click', () => { select({ type: 'node', id: b.dataset.node }); box.querySelector('[role="tab"]')?.focus(); });
    box.querySelector('[data-act="clear"]')?.addEventListener('click', () => { select(null); root.querySelector('#hx-inst')?.focus(); });
    box.querySelector('[data-act="hood"]')?.addEventListener('click', () => {
      state.hood = !state.hood;
      applyMap(); panel();
      box.querySelector('[data-act="hood"]')?.focus();
      say(state.hood ? 'The map shows only the direct connections.' : 'The map shows everything.');
    });
    for (const t of box.querySelectorAll('[role="tab"]')) {
      t.addEventListener('click', () => { state.tab = t.id === 'hx-tab-rels' ? 'rels' : 'props'; panel(); box.querySelector('#' + t.id)?.focus(); });
      t.addEventListener('keydown', (ev) => {
        if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
        state.tab = state.tab === 'props' ? 'rels' : 'props';
        panel(); box.querySelector(state.tab === 'props' ? '#hx-tab-props' : '#hx-tab-rels')?.focus(); ev.preventDefault();
      });
    }
  }

  /* ------------------------------------------------ the table: it leads, and it follows the filter and the selection */
  function table() {
    const box = root.querySelector('#hx-table');
    const filtered = { ...ix, relationship: visibleRels() };
    const sel = state.sel;
    let only = null, rels = filtered;
    if (sel?.type === 'node') only = sel.id;
    else if (sel?.type === 'edge') { const r = relById.get(sel.id); only = r.from; rels = { ...ix, relationship: [r] }; }
    else if (!state.tableAll || phone()) only = focus && byId(focus) ? focus : 'ai-act';
    const what = sel?.type === 'edge' ? 'the selected relationship'
      : only ? `the relationships of ${esc(byId(only)?.short_name || only)}` : 'every instrument and every relationship';
    const filterNote = state.hidden.size ? ` The type filter hides ${state.hidden.size === 1 ? 'one type' : state.hidden.size + ' types'}: ${[...state.hidden].map((k) => esc(label(ix, k))).join(', ')}.` : '';
    box.innerHTML = `<p class="prose meta">The table of the Editorial prototype (<code>prototypes/editorial/relations.js</code>, imported: one set of rules), with each instrument's number on the map. Now: ${what}.${filterNote}</p>
      ${only || sel ? `<p><button type="button" class="btn" data-act="all">Show every instrument (${counts.instruments.length}; a relationship appears under each of its two)</button></p>` : ''}
      ${relationsTable(rels, only ? { only } : {})}`;
    box.querySelector('[data-act="all"]')?.addEventListener('click', () => { state.tableAll = true; if (state.sel) select(null); else table(); });
    annotate(box, rels, only ? [byId(only)].filter(Boolean) : alpha);
  }
  /** Key the rendered table to the map: each row group gets its number and a
   *  "Show on the map" button; each relationship row a button that selects it.
   *  The rows are matched to the records in relations.js's own order (the
   *  relationships touching the instrument, in array order); if a count does
   *  not match, that group is left as rendered rather than keyed wrongly. */
  function annotate(box, rix, list) {
    const groups = [...box.querySelectorAll('table.rel > tbody')];
    groups.forEach((tb, gi) => {
      const inst = list[gi];
      if (!inst) return;
      const rels = rix.relationship.filter((r) => r.from === inst.id || r.to === inst.id);
      const head = tb.querySelector('th[scope="rowgroup"]');
      if (head) {
        head.insertAdjacentHTML('afterbegin', `<span class="hx-num" aria-hidden="true">${num.get(inst.id)}</span>`);
        head.insertAdjacentHTML('beforeend', ` <button type="button" class="hx-show" data-node="${esc(inst.id)}">Show on the map<span class="visually-hidden">: ${esc(inst.short_name)}</span></button>`);
      }
      const rows = [...tb.rows].filter((tr) => tr.querySelector('td') && !tr.querySelector('td[colspan]'));
      if (rows.length !== rels.length) return;
      rows.forEach((tr, k) => {
        const r = rels[k];
        tr.dataset.rel = r.id;
        if (state.sel?.type === 'edge' && state.sel.id === r.id) tr.classList.add('picked');
        tr.cells[3]?.querySelector('div')?.insertAdjacentHTML('beforeend',
          ` <button type="button" class="hx-pick-rel" data-rel="${esc(r.id)}" aria-label="Select on the map: ${esc(plainWords(ix, r))}"><span class="code k-${kindKey(r.kind)}">${esc(kindCode(r.kind))}</span> on the map</button>`);
      });
    });
    for (const b of box.querySelectorAll('button.hx-show')) b.addEventListener('click', () => select({ type: 'node', id: b.dataset.node }));
    for (const b of box.querySelectorAll('button.hx-pick-rel')) b.addEventListener('click', () => select({ type: 'edge', id: b.dataset.rel }));
  }

  /* ------------------------------------------------ the phone: an ego view, not the map made small */
  function ego() {
    const box = root.querySelector('#hx-ego');
    const sel = state.sel;
    const centreId = sel?.type === 'node' ? sel.id : sel?.type === 'edge' ? relById.get(sel.id).from : (focus && byId(focus) ? focus : 'ai-act');
    const inst = byId(centreId);
    if (!inst) { box.innerHTML = ''; return; }
    const rels = (counts.touching.get(inst.id) || []).filter((r) => !state.hidden.has(r.kind));
    const others = [...new Set(rels.map((r) => (r.from === inst.id ? r.to : r.from)))]
      .sort((a, b) => (byId(a)?.short_name || a).localeCompare(byId(b)?.short_name || b));
    const C = { x: 0, y: 0 }, R = 120;
    const pos = new Map([[inst.id, C]]);
    others.forEach((id, i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, others.length); pos.set(id, { x: R * Math.cos(a), y: R * Math.sin(a), a }); });
    const o = offsets(rels);
    const edges = rels.map((r) => edgeSvg(ix, r, edgeGeometry(pos.get(r.from), pos.get(r.to), o.get(r), 1), 'hke')).join('');
    const nodes = [inst.id, ...others].map((id) => {
      const p = pos.get(id), i2 = byId(id), n = num.get(id);
      const below = id === inst.id || Math.sin(p.a) > -0.2;
      return `<g class="node c-${coverage(i2) || 'none'} named${sel?.type === 'node' && sel.id === id ? ' selected' : ''}" data-id="${esc(id)}" role="button" tabindex="0" aria-pressed="${sel?.type === 'node' && sel.id === id}" aria-label="${esc(nodeLabel(ix, counts, i2, n))}" transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})">` +
        `<circle class="n-ring" r="${NODE_R + 4}"/><circle class="n-dot" r="${NODE_R}"/><text class="n-num" y="3.6" text-anchor="middle">${n}</text>` +
        `<text class="n-name" y="${below ? NODE_R + 14 : -NODE_R - 7}" text-anchor="middle">${esc(i2.short_name)}</text></g>`;
    }).join('');
    box.innerHTML = `<p class="count-line">${esc(inst.short_name)}: ${rels.length ? esc(F.plural(rels.length, 'relationship')) + ' shown' : 'no relationship recorded' + (state.hidden.size && (counts.touching.get(inst.id) || []).length ? ' among the types shown' : '')}. Tap an instrument to centre it; tap a line to open the relationship.</p>
      <svg xmlns="${SVGNS}" viewBox="-195 -160 390 320" role="group" aria-label="${esc(inst.short_name)} and its direct relationships">${markers('hke', kindsInUse)}<g class="edges">${edges}</g><g class="nodes">${nodes}</g></svg>`;
    const svg = box.querySelector('svg');
    for (const g of svg.querySelectorAll('.edge')) { g.classList.add('coded'); g.classList.toggle('selected', sel?.type === 'edge' && sel.id === g.dataset.rel); }
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

  /* ------------------------------------------------ the picker */
  root.querySelector('#hx-inst').addEventListener('change', (ev) => {
    const v = ev.target.value;
    select(v ? { type: 'node', id: v } : null);
  });

  legend();
  map();
  const start = focus && byId(focus) ? focus : phone() ? 'ai-act' : null;
  if (start) select({ type: 'node', id: start });
  else { applyMap(); panel(); table(); ego(); }
  return { select, counts };
}
