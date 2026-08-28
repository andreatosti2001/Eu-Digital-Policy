/* ============================================================
   The glossary as a graph rather than a word list.

   glossary.json has carried the edges since Phase 1 — instruments,
   provisions, institutions, enforcement records, actors, claims,
   sources and related terms — and nothing rendered them. A reader
   who opened "gatekeeper" got a sentence. What they actually want to
   know is: which instrument is this a term of art in, which article
   defines it, who decides whether you are one, and has anyone been
   treated as one yet.

   Two things happen here.

   1. The side panel is rendered from glossary.json instead of from
      the fourteen entries hand-written into index.html. The static
      markup stays as the no-JavaScript fallback; it is replaced only
      once the data has actually loaded. This also recovers the
      fifteenth term, `gatekeeper`, which had a record in the data and
      no entry in the panel.

   2. Every entry gains its edges, each one a link to the page where
      that entity lives — so the glossary becomes a way into the
      record rather than a dead end.

   Nothing is asserted that the data does not carry. A term with no
   enforcement records shows no enforcement line; it does not show a
   zero, because "no record in this dataset" and "never happened" are
   different statements.
   ============================================================ */

import { loadAll, index, label as taxLabel } from './data.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let IX = null;
let TERMS = [];
const BY_SLUG = new Map();

const slugOf = (t) => String(t.legacy_dom_id || ('gloss-' + String(t.id).replace(/^gl-/, '')))
  .replace(/^gloss-/, '');

/* ---------------------------------------------------------- edge rendering */

function instrumentLinks(ids) {
  return (ids || []).map((id) => {
    const i = IX.instrument.get(id);
    return '<a class="gg-link" href="instruments.html#' + esc(id) + '">' +
      esc(i ? i.short_name : id) + '</a>';
  });
}

function provisionLinks(ids) {
  return (ids || []).map((pid) => {
    const pr = IX.provision.get(pid);
    const owner = IX.provisionOwner.get(pid);
    const inst = owner ? IX.instrument.get(owner) : null;
    const text = pr ? ((inst ? inst.short_name + ' ' : '') + 'Art. ' + pr.number) : pid;
    const title = pr && pr.heading ? pr.heading : '';
    return '<a class="gg-link" href="instruments.html#' + esc(owner || '') + '"' +
      (title ? ' title="' + esc(title) + '"' : '') + '>' + esc(text) + '</a>';
  });
}

function institutionLinks(ids) {
  return (ids || []).map((id) => {
    const x = IX.institution.get(id);
    const isClass = String(id).endsWith('-*');
    return '<a class="gg-link" href="institutions.html#' + esc(id) + '">' +
      esc(x ? x.short_name : id) +
      (isClass ? '<span class="gg-class" title="A class of national bodies, not a single institution">class</span>' : '') +
      '</a>';
  });
}

function enforcementLinks(ids) {
  return (ids || []).map((id) => {
    const r = IX.enforcementById.get(id);
    if (!r) return '<a class="gg-link" href="enforcement.html#' + esc(id) + '">' + esc(id) + '</a>';
    const st = taxLabel(IX, r.action_status);
    /* the same firm can appear twice under one term — two separate actions —
       so the year is part of the label rather than leaving two identical chips */
    const yr = String(r.decision_date || '').slice(0, 4);
    const short = String(r.entity).split(/[,(]| and /)[0].trim();
    return '<a class="gg-link" href="enforcement.html#' + esc(id) + '"' +
      ' title="' + esc(r.entity + (st ? ' — ' + st : '')) + '">' +
      esc(short) + (yr ? ' <span class="gg-yr">' + esc(yr) + '</span>' : '') + '</a>';
  });
}

function relatedLinks(ids) {
  return (ids || []).map((id) => {
    const t = BY_SLUG.get(String(id).replace(/^gl-/, ''));
    const slug = t ? slugOf(t) : String(id).replace(/^gl-/, '');
    return '<a class="gg-link gg-rel" href="#gloss-' + esc(slug) + '" data-goto="' + esc(slug) + '">' +
      esc(t ? t.term : id) + '</a>';
  });
}

const actorWords = (ids) => (ids || []).map((a) => '<span class="gg-flat">' + esc(taxLabel(IX, a)) + '</span>');

function row(label, links) {
  if (!links.length) return '';
  return '<div class="gg-row"><span class="gg-key">' + esc(label) + '</span>' +
    '<span class="gg-vals">' + links.join('') + '</span></div>';
}

function edgesHTML(t) {
  const claims = (t.claims || []).length;
  const body =
    row('Defined in', instrumentLinks(t.instruments)) +
    row('Articles', provisionLinks(t.provisions)) +
    row('Who decides', institutionLinks(t.institutions)) +
    row('Enforcement', enforcementLinks(t.enforcement)) +
    row('Applies to', actorWords(t.actors)) +
    row('Related', relatedLinks(t.related_terms));
  if (!body && !claims) return '';
  return '<div class="gg-links">' + body +
    (claims
      ? '<div class="gg-row"><span class="gg-key">In the brief</span><span class="gg-vals">' +
        '<span class="gg-flat">' + claims + ' claim' + (claims === 1 ? '' : 's') + ' turn on this term</span>' +
        '</span></div>'
      : '') +
    '</div>';
}

/* ---------------------------------------------------------- the panel */

function renderPanel() {
  const panel = document.getElementById('gpanel');
  if (!panel) return 0;
  const first = panel.querySelector('.gloss-entry');
  if (!first) return 0;

  const sorted = TERMS.slice().sort((a, b) =>
    a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));

  const html = sorted.map((t) =>
    '<div class="gloss-entry" id="gloss-' + esc(slugOf(t)) + '" data-term-id="' + esc(t.id) + '">' +
      '<b>' + esc(t.term) + '</b>' +
      '<span>' + esc(t.definition) + '</span>' +
      edgesHTML(t) +
    '</div>').join('');

  /* replace the static block in one move, keeping everything around it */
  const entries = [...panel.querySelectorAll('.gloss-entry')];
  const holder = document.createElement('div');
  holder.className = 'gp-entries';
  holder.innerHTML = html;
  first.parentNode.insertBefore(holder, first);
  entries.forEach((e) => e.remove());

  /* jumping between related terms inside the panel */
  holder.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-goto]');
    if (!a) return;
    e.preventDefault();
    const el = document.getElementById('gloss-' + a.dataset.goto);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add('lit');
    setTimeout(() => el.classList.remove('lit'), 1600);
  });

  return sorted.length;
}

/* ---------------------------------------------------------- the popover line

   The inline popover keeps its definition and gains one compact line of
   provenance: the instrument the term belongs to, the defining article and,
   where there are any, the number of enforcement records that turn on it.
   app.js builds the popover from the panel entry, so it is enough to expose
   the summary as a data attribute the popover can read. */

function annotateInlineButtons() {
  let n = 0;
  document.querySelectorAll('.gloss[data-term]').forEach((btn) => {
    const t = BY_SLUG.get(btn.dataset.term);
    if (!t) return;
    const bits = [];
    const inst = (t.instruments || []).map((id) => {
      const i = IX.instrument.get(id); return i ? i.short_name : id;
    });
    if (inst.length) bits.push(inst.join(', '));
    const prov = (t.provisions || []).slice(0, 2).map((pid) => {
      const pr = IX.provision.get(pid); return pr ? 'Art. ' + pr.number : null;
    }).filter(Boolean);
    if (prov.length) bits.push(prov.join(', '));
    const enf = (t.enforcement || []).length;
    if (enf) bits.push(enf + ' enforcement record' + (enf === 1 ? '' : 's'));
    if (bits.length) { btn.dataset.termMeta = bits.join(' · '); n++; }
  });
  return n;
}

/* ---------------------------------------------------------- boot */

export async function initGlossaryGraph() {
  const db = await loadAll(['taxonomy', 'instruments', 'institutions', 'enforcement', 'glossary']);
  IX = index(db);
  IX.enforcementById = new Map((db.enforcement.enforcement || []).map((r) => [r.id, r]));

  TERMS = db.glossary.terms || [];
  BY_SLUG.clear();
  for (const t of TERMS) BY_SLUG.set(slugOf(t), t);

  const n = renderPanel();
  const m = annotateInlineButtons();
  document.dispatchEvent(new CustomEvent('glossary:ready', {
    detail: { terms: n, annotated: m }
  }));
  return n;
}
