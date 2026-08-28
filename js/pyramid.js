/* ============================================================
   The DSA obligation pyramid.

   The prose beside it says "The DSA stacks obligations cumulatively
   across four tiers. Every tier inherits the tier below it." The
   figure said nothing of the sort: four flat polygons with labels on
   them, which a reader could just as easily take for four separate
   categories. The one fact the picture existed to carry was the one
   fact it did not show.

   So the bands are now selectable, and selecting one does the thing
   the sentence describes: it marks what that tier *adds*, and marks
   every tier beneath it as inherited — because a VLOP owes all of it.

   What each band adds is not typed here. It is read from the DSA's
   provisions in instruments.json via obligation_on, which already
   records which class of actor each article binds. The band therefore
   reports what the dataset actually holds, and says how many
   provisions are recorded rather than implying the list is complete.

   The band geometry and the article ranges are the ones the figure
   already carried; nothing about the legal claim has changed.
   ============================================================ */

import { loadAll, index, label as taxLabel } from './data.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Bottom tier first: that is the order obligations accumulate in, and the
   order the build animation reveals them. `actors` are the taxonomy ids the
   DSA's provisions are recorded against. */
const TIERS = [
  { key: 'intermediary', label: 'All intermediary services',
    sub: 'no general monitoring · liability exemptions · Arts. 4–15',
    actors: ['actor:intermediary', 'actor:intermediary-service'],
    who: 'Every intermediary offering a service in the Union.' },
  { key: 'hosting', label: 'Hosting services',
    sub: 'notice-and-action · Arts. 16–18',
    actors: ['actor:hosting-provider'],
    who: 'Anyone storing information provided by a recipient.' },
  { key: 'platform', label: 'Online platforms',
    sub: 'dark-pattern ban · trusted flaggers · Arts. 20–32',
    actors: ['actor:online-platform'],
    who: 'Hosting services that also disseminate to the public.' },
  { key: 'vlop', label: 'VLOPs / VLOSEs',
    sub: '45m+ users · systemic risk · Arts. 33–43',
    actors: ['actor:vlop', 'actor:vlose'],
    who: 'Designated by the Commission at 45 million average monthly recipients.' },
];

/* the trapezoid for each band, widest at the base */
const W = 700, H = 300, PAD = 30, TOP_W = 250, BAND_H = 60, BASE_Y = 262;

function bandPoints(i) {
  const n = TIERS.length;
  const t0 = i / n, t1 = (i + 1) / n;
  const halfAt = (t) => ((W - PAD * 2) / 2) * (1 - t) + (TOP_W / 2) * t;
  const y0 = BASE_Y - i * BAND_H;
  const y1 = y0 - BAND_H + 2;
  const cx = W / 2;
  return [
    [cx - halfAt(t0), y0], [cx + halfAt(t0), y0],
    [cx + halfAt(t1), y1], [cx - halfAt(t1), y1],
  ].map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join(' ');
}

let IX = null;
let PROVS = new Map();      // tier key -> provisions recorded against it
let selected = null;

function provisionsFor(tier) {
  return PROVS.get(tier.key) || [];
}

/* ---------------------------------------------------------- rendering */

function svgHTML() {
  const bands = TIERS.map((t, i) => {
    const y = BASE_Y - i * BAND_H - BAND_H / 2 + 4;
    const n = provisionsFor(t).length;
    return '<g class="pyr-g" data-tier="' + esc(t.key) + '" data-i="' + i + '"' +
      ' role="button" tabindex="0"' +
      ' aria-label="' + esc(t.label + '. ' + t.sub + '. ' +
        (n ? n + ' provisions recorded.' : 'No provisions recorded in this build.')) + '">' +
      '<polygon class="pyr-band" points="' + bandPoints(i) + '"></polygon>' +
      '<text class="pyr-band-label" text-anchor="middle" x="' + (W / 2) + '" y="' + (y - 6) + '">' +
        esc(t.label) + '</text>' +
      '<text class="pyr-band-sub" text-anchor="middle" x="' + (W / 2) + '" y="' + (y + 12) + '">' +
        esc(t.sub) + '</text>' +
      '</g>';
  }).join('');

  return '<svg class="pyramid" viewBox="0 0 ' + W + ' ' + H + '" role="group"' +
    ' aria-label="Four-tier DSA obligation pyramid. Obligations are cumulative: each tier inherits every tier below it. Select a tier to see what it adds.">' +
    bands +
    '<text class="pyr-tag" x="' + PAD + '" y="' + (H - 8) + '">fewer obligated services</text>' +
    '<text class="pyr-tag" text-anchor="end" x="' + (W - PAD) + '" y="' + (H - 8) + '">heavier obligation set</text>' +
    '</svg>';
}

function readoutHTML(i) {
  if (i == null) {
    return '<p class="pyr-hint">Select a tier to see what it adds — and everything it inherits.</p>';
  }
  const t = TIERS[i];
  const own = provisionsFor(t);
  const below = TIERS.slice(0, i);
  const inherited = below.reduce((a, x) => a + provisionsFor(x).length, 0);

  const chip = (p) => {
    const pr = IX.provision.get(p.id);
    return '<a class="pyr-prov" href="instruments.html#dsa" title="' + esc(pr.heading || '') + '">' +
      'Art. ' + esc(pr.number) + '</a>';
  };

  return '<div class="pyr-readout" role="status">' +
    '<h4 class="pyr-ro-h">' + esc(t.label) + '</h4>' +
    '<p class="pyr-who">' + esc(t.who) + '</p>' +
    '<div class="pyr-ro-row"><span class="pyr-ro-k">Adds</span>' +
      '<span class="pyr-ro-v">' + (own.length
        ? own.map(chip).join('') +
          '<span class="pyr-count">' + own.length + ' recorded in this build</span>'
        : '<span class="pyr-none">No provision from this tier is recorded in this build. ' +
          'The tier exists; the dataset does not yet hold its articles.</span>') +
      '</span></div>' +
    (below.length
      ? '<div class="pyr-ro-row"><span class="pyr-ro-k">Inherits</span>' +
        '<span class="pyr-ro-v">' +
          below.map((x) => '<span class="pyr-inh">' + esc(x.label) + '</span>').join('') +
          (inherited ? '<span class="pyr-count">' + inherited +
            ' further provisions recorded below</span>' : '') +
        '</span></div>'
      : '<div class="pyr-ro-row"><span class="pyr-ro-k">Inherits</span>' +
        '<span class="pyr-ro-v"><span class="pyr-none">Nothing — this is the floor every ' +
        'intermediary stands on.</span></span></div>') +
    '</div>';
}

function paint(host) {
  const svg = host.querySelector('svg');
  if (!svg) return;
  svg.querySelectorAll('.pyr-g').forEach((g) => {
    const i = Number(g.dataset.i);
    g.classList.toggle('sel', selected === i);
    g.classList.toggle('inherited', selected != null && i < selected);
    g.classList.toggle('dim', selected != null && i > selected);
    g.setAttribute('aria-pressed', String(selected === i));
  });
  const ro = host.querySelector('[data-pyr-readout]');
  if (ro) ro.innerHTML = readoutHTML(selected);
}

/* ---------------------------------------------------------- boot */

export async function initPyramid() {
  const holder = document.querySelector('.pyramid');
  if (!holder) return 0;
  const fig = holder.closest('figure') || holder.parentNode;

  const db = await loadAll(['taxonomy', 'instruments']);
  IX = index(db);

  /* map the DSA's recorded provisions onto the tiers by the actor each one
     binds — the data already says who owes what */
  const dsa = (db.instruments.instruments || []).find((i) => i.id === 'dsa');
  PROVS = new Map(TIERS.map((t) => [t.key, []]));
  for (const p of (dsa && dsa.provisions) || []) {
    for (const t of TIERS) {
      if ((p.obligation_on || []).some((a) => t.actors.includes(a))) {
        PROVS.get(t.key).push(p);
        break;
      }
    }
  }

  const host = document.createElement('div');
  host.className = 'pyr-host';
  host.innerHTML = svgHTML() + '<div data-pyr-readout>' + readoutHTML(null) + '</div>';
  holder.replaceWith(host);

  const svg = host.querySelector('svg');
  const pick = (g) => {
    const i = Number(g.dataset.i);
    selected = selected === i ? null : i;
    paint(host);
  };
  svg.addEventListener('click', (e) => {
    const g = e.target.closest('.pyr-g'); if (g) pick(g);
  });
  svg.addEventListener('keydown', (e) => {
    const g = e.target.closest('.pyr-g'); if (!g) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(g); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const i = Number(g.dataset.i);
      const next = svg.querySelector('.pyr-g[data-i="' + (i + (e.key === 'ArrowUp' ? 1 : -1)) + '"]');
      if (next) next.focus();
    }
  });

  /* the build runs bottom-up, so the accumulation is something you watch
     happen rather than a caption you are asked to believe */
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    host.classList.add('armed');
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        requestAnimationFrame(() => en.target.classList.add('built'));
        setTimeout(() => en.target.classList.remove('armed', 'built'), 2200);
      }
    }, { threshold: 0.25 });
    io.observe(host);
    setTimeout(() => host.classList.remove('armed', 'built'), 6000);
  }

  paint(host);
  document.dispatchEvent(new CustomEvent('pyramid:ready', {
    detail: { tiers: TIERS.length, mapped: [...PROVS.values()].reduce((a, v) => a + v.length, 0) }
  }));
  return TIERS.length;
}
