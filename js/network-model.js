/* ============================================================
   The network of the instruments — what network.html draws, derived.

   Pure: no DOM, no fetch, no clock. The page (js/network-page.js) draws
   what this computes; tools/selftest.mjs checks it in Node against the
   real records. Ported from the prototype the author chose on 13 Nov
   2026 — prototypes/observatory/explorer.js, run inside the Hybrid's
   layout (docs/PROTOTYPES.md §3.6) — and brought to production by the
   network-map session (docs/ROADMAP-v2.md §8, 23 Nov 2026).

   What a node and an edge are (docs/POST-V2.md §3 D, addition of 11 Nov
   2026): the nodes are the records of `instruments` and nothing else; the
   edges are the records of `relationships` and nothing else — never a
   shared provision, claim or source, never a transitive link. Nothing is
   stored: no coordinate, count or graph exists anywhere but here, on
   each render.

   - Direction: from → to ONLY where `symmetric` is false. A record with
     `symmetric: true` has no direction; one with neither says so.
   - Two relationships between the same pair are two edges, drawn apart.
   - The layout is deterministic: fixed starting positions, a fixed number
     of steps, no randomness. The reader turns it; nothing moves by itself.
   - Every figure the page prints comes from explorerCounts(), and "none
     recorded" is a state (an empty list), never a 0 printed as a finding.
   ============================================================ */

import { coverage } from './routes.js';

/* type → [code, stroke pattern, family]. The colour is the family's, in
   css/tools.css; the code and the pattern are the kind's own, so the type
   is carried by three signals and never by hue alone. A kind missing here
   is drawn with '??' and a dotted line rather than guessed. */
export const KIND_STYLE = Object.freeze({
  'rel-kind:amends': ['AM', '', 'textual'],
  'rel-kind:repeals': ['RP', '9 3 2 3', 'textual'],
  'rel-kind:implements': ['IM', '1 3', 'textual'],
  'rel-kind:legal-basis': ['LB', '6 2', 'textual'],
  'rel-kind:defers-to': ['DF', '7 4', 'deferral'],
  'rel-kind:enables': ['EN', '2 4', 'deferral'],
  'rel-kind:lex-specialis': ['LS', '9 3 2 3', 'deferral'],
  'rel-kind:carve-out': ['CV', '12 4', 'deferral'],
  'rel-kind:sequence': ['SQ', '4 4', 'deferral'],
  'rel-kind:overlap': ['OV', '', 'analytical'],
  'rel-kind:complement': ['CO', '7 4', 'analytical'],
  'rel-kind:conflict': ['CF', '2 3', 'analytical'],
});
export const kindKey = (k) => String(k || '').split(':').pop() || 'unknown';
export const kindCode = (k) => (KIND_STYLE[k] || ['??'])[0];
export const kindDash = (k) => (KIND_STYLE[k] || ['', '2 2'])[1];
export const kindFamily = (k) => (KIND_STYLE[k] || ['', '', 'unknown'])[2];

export const COVERAGE_GROUPS = Object.freeze([['covered', 'Covered'], ['mapped', 'Mapped'], ['watched', 'Watched'], ['excluded', 'Excluded']]);
export const COVERAGE_WORD = Object.freeze({
  covered: 'Covered — analysed by the site',
  mapped: 'Mapped — recorded for its links, not analysed in depth',
  watched: 'Watched — named by the site, not analysed',
  excluded: 'Excluded — named by the site and deliberately not analysed',
});

/* ---------------------------------------------------------- the one counting function */

/**
 * Every figure the page prints.
 * @param {object} ix  js/data.js index()
 * @param {object} db  the loaded datasets (taxonomy, brief)
 */
export function explorerCounts(ix, db) {
  /* the index maps aliases onto the same object: count distinct records */
  const instruments = [...new Set(ix.instrument.values())].sort((a, b) => a.id.localeCompare(b.id));
  const rels = ix.relationship || [];
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
    undirected: rels.filter((r) => typeof r.symmetric !== 'boolean').length,
  };
}

/* ---------------------------------------------------------- the deterministic layout, in three dimensions

   A force layout — related instruments attract, all repel — with fixed
   starting positions (instruments ordered by id on a Fibonacci sphere), a
   fixed number of steps and nothing random, so the same records give the
   same network. Each group (the chosen grouping; with none, the
   instruments with no relationship) is pulled toward a point of its own,
   by a field already in the records — never by community detection. */

export const R3 = 285;
export const RIM = 300; // the circle the ungrouped network sits in

function fib(i, n, r) {
  const y = 1 - (2 * (i + 0.5)) / n, rr = Math.sqrt(Math.max(0, 1 - y * y)), t = i * Math.PI * (3 - Math.sqrt(5));
  return { x: r * rr * Math.cos(t), y: r * y, z: r * rr * Math.sin(t) };
}

export function layout3d(counts, mode) {
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
      const f = (k * k) / d, da = disp.get(ids[i]), dbb = disp.get(ids[j]);
      da.x += (dx / d) * f; da.y += (dy / d) * f; da.z += (dz / d) * f;
      dbb.x -= (dx / d) * f; dbb.y -= (dy / d) * f; dbb.z -= (dz / d) * f;
    }
    for (const e of edges) {
      const a = pos.get(e.from), b = pos.get(e.to);
      const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z, d = Math.max(0.01, Math.hypot(dx, dy, dz));
      const f = ((d * d) / k) * (chosen ? 0.5 : 1), da = disp.get(e.from), dbb = disp.get(e.to);
      da.x -= (dx / d) * f; da.y -= (dy / d) * f; da.z -= (dz / d) * f;
      dbb.x += (dx / d) * f; dbb.y += (dy / d) * f; dbb.z += (dz / d) * f;
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
  /* centred on the network's own middle; ungrouped, scaled so that most of it (the 90th
     percentile of the instruments in a relationship) reaches R3, outliers held inside the
     circle; grouped, the clusters keep their own size */
  const cx = ids.reduce((a, id) => a + pos.get(id).x, 0) / n, cy = ids.reduce((a, id) => a + pos.get(id).y, 0) / n, cz = ids.reduce((a, id) => a + pos.get(id).z, 0) / n;
  const scaleIds = chosen ? ids : ids.filter((id) => counts.touching.get(id).length);
  const far = Math.max(...scaleIds.map((id) => { const p = pos.get(id); return Math.hypot(p.x - cx, p.y - cy, p.z - cz); }));
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
  return { p3: pos, labels };
}

/* the projection: a rotation (yaw about the vertical, then pitch), then perspective */
export const FOCAL = 900;
export function project(p, yaw, pitch) {
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = p.x * cyw + p.z * syw, z1 = -p.x * syw + p.z * cyw;
  const y2 = p.y * cp - z1 * sp, z2 = p.y * sp + z1 * cp;
  const s = FOCAL / (FOCAL - z2);
  return { x: x1 * s, y: y2 * s, z: z2, s };
}

/** Curvature for each relationship, so two between one pair are drawn apart. */
export function curvatures(rels) {
  const pairs = new Map();
  for (const r of rels) { const key = [r.from, r.to].sort().join('|'); if (!pairs.has(key)) pairs.set(key, []); pairs.get(key).push(r); }
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

export const NODE_R = 7;

/** A quadratic edge from a to b, stopped short of both nodes; its midpoint carries the code. */
export function edgeGeometry(a, b, curve, R1 = NODE_R + 3, R2 = NODE_R + 6) {
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
