/* ============================================================
   The full Regulatory DNA comparison page. Uses exactly the same
   renderer as the in-article table — there is one comparison
   implementation in the repository, not two.
   ============================================================ */

import { loadAll, index, renderError, label as taxLabel, note as taxNote } from './data.js';
import { renderTable, DIMENSIONS, setOverlay } from './dna.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let IX = null;
let chosen = new Set(['gdpr', 'dsa', 'dma', 'ai-act', 'data-act']);
let dims = new Set(DIMENSIONS);

function paint() {
  renderTable(document.getElementById('dnaTable'), IX, {
    instruments: [...chosen],
    rows: DIMENSIONS.filter((d) => dims.has(d)),
    compact: false,
  });
}

function chip(host, id, label, on, title) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'dna-chip';
  b.textContent = label;
  b.setAttribute('aria-pressed', String(on));
  b.dataset.id = id;
  if (title) b.title = title;
  host.appendChild(b);
  return b;
}

function buildControls() {
  const iHost = document.getElementById('dnaInstruments');
  const dHost = document.getElementById('dnaDimensions');

  // comparable instruments only: those that actually carry a DNA block
  const list = [...IX.instrument.values()]
    .filter((i, n, arr) => arr.findIndex((x) => x.id === i.id) === n)   // aliases resolve to the same object
    .filter((i) => i.dna)
    .sort((a, b) => {
      const rank = (x) => (x.scope_class === 'scope:core' ? 0 : 1);
      return rank(a) - rank(b) || a.short_name.localeCompare(b.short_name);
    });

  for (const i of list) {
    chip(iHost, i.id, i.short_name, chosen.has(i.id),
      i.full_name + (i.kind === 'kind:proposal' ? ' — a proposal, not law' : ''));
  }
  iHost.addEventListener('click', (e) => {
    const b = e.target.closest('.dna-chip'); if (!b) return;
    chosen.has(b.dataset.id) ? chosen.delete(b.dataset.id) : chosen.add(b.dataset.id);
    b.setAttribute('aria-pressed', String(chosen.has(b.dataset.id)));
    paint();
  });

  for (const d of DIMENSIONS) {
    chip(dHost, d, taxLabel(IX, 'dna:' + d), dims.has(d), taxNote(IX, 'dna:' + d) || '');
  }
  dHost.addEventListener('click', (e) => {
    const b = e.target.closest('.dna-chip'); if (!b) return;
    dims.has(b.dataset.id) ? dims.delete(b.dataset.id) : dims.add(b.dataset.id);
    b.setAttribute('aria-pressed', String(dims.has(b.dataset.id)));
    paint();
  });
}

function stats() {
  const all = [...new Set([...IX.instrument.values()])];
  const withDna = all.filter((i) => i.dna).length;
  const derived = 2;
  document.getElementById('dnaStats').innerHTML =
    '<span><b>' + withDna + '</b> instruments with a DNA record</span>' +
    '<span><b>' + DIMENSIONS.length + '</b> dimensions, of which <b>' + derived + '</b> derived</span>' +
    '<span><b>' + IX.provision.size + '</b> provisions indexed</span>' +
    '<span><b>' + IX.event.size + '</b> dated events</span>';
}

/* ------------------------------------------------------------------
   Arriving from a search result: instruments.html#dsa. The named
   instrument is added to the comparison if it is not already in it,
   its chip is switched on, and its column is marked — so the link
   lands on the thing it named rather than on whatever the default
   selection happened to be. An instrument with no DNA record has no
   column to show; the page says so instead of failing silently.
   ------------------------------------------------------------------ */
function focusFromHash() {
  const id = decodeURIComponent(String(location.hash || '').slice(1));
  if (!id) return;
  const inst = IX.instrument.get(id);
  const note = document.getElementById('dnaHashNote');
  if (note) note.remove();
  if (!inst) return;

  if (!inst.dna) {
    const box = document.createElement('p');
    box.id = 'dnaHashNote';
    box.className = 'mount-fallback';
    box.setAttribute('role', 'status');
    box.textContent = inst.short_name + ' has no Regulatory DNA record in this build, '
      + 'so it has no column here. Nothing has been invented to fill one.';
    const host = document.getElementById('dnaTable');
    host.parentNode.insertBefore(box, host);
    return;
  }

  if (!chosen.has(inst.id)) {
    chosen.add(inst.id);
    const b = document.querySelector('#dnaInstruments .dna-chip[data-id="' + CSS.escape(inst.id) + '"]');
    if (b) b.setAttribute('aria-pressed', 'true');
    paint();
  }
  const cols = [...document.querySelectorAll('#dnaTable thead th')];
  const n = [...chosen].indexOf(inst.id) + 1;
  const th = cols[n];
  if (th) {
    th.classList.add('dna-lit');
    th.setAttribute('tabindex', '-1');
    th.scrollIntoView({ block: 'nearest', inline: 'center' });
    th.focus({ preventScroll: true });
    setTimeout(() => th.classList.remove('dna-lit'), 1800);
  }
}

(async function boot() {
  const host = document.getElementById('dnaTable');
  try {
    const db = await loadAll(['taxonomy', 'instruments', 'institutions', 'timeline', 'sources']);
    IX = index(db);
    setOverlay({});                 // English on this page; the overlay is the brief's concern
    stats();
    buildControls();
    paint();
    focusFromHash();
    window.addEventListener('hashchange', focusFromHash);
  } catch (e) {
    renderError(host, e, () => location.reload());
    console.error('[instruments]', e);
  }
})();
