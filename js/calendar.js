/* ============================================================
   The regulatory calendar.

   Annex A's hand-typed table becomes a rendering of timeline.json.
   Sorting is done by the data, so the ordering defect in the static
   table cannot recur. Each row expands to the fields §22 asks for:
   event type, instrument, affected actors, obligation, authority,
   legal basis, required action, status, source, verification date.

   The three visible columns keep the shape the volvelle reads, and
   an i18n:applied event is dispatched after every render so the
   wheel re-reads the corrected order.
   ============================================================ */

import * as F from './format.js';
import { label as taxLabel, loadOverlay } from './data.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let IX = null;
let OVERLAY = {};            // entity-keyed translation overlay for the active locale
let filters = { type: '', instrument: '', horizon: 'upcoming' };

const lang = () => document.documentElement.getAttribute('lang') || 'en';
const tr = (key, fallback) => (OVERLAY && OVERLAY[key]) || fallback;

/* ---------------------------------------------------------- data shaping */

function events() {
  const all = [...IX.event.values()];
  const today = new Date().toISOString().slice(0, 10);
  let out = all;
  if (filters.horizon === 'upcoming') out = out.filter((e) => String(e.date) >= today);
  else if (filters.horizon === 'past') out = out.filter((e) => String(e.date) < today);
  if (filters.type) out = out.filter((e) => e.event_type === filters.type);
  if (filters.instrument) out = out.filter((e) => e.instrument === filters.instrument);
  return out.sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.id).localeCompare(String(b.id)));
}

const instrName = (id) => {
  const i = IX.instrument.get(id);
  if (!i) return id;
  return tr(id + '.short_name', i.short_name);
};

/* ---------------------------------------------------------- rows */

function detailList(ev) {
  const actors = (ev.affected_actors || []).map((a) => esc(taxLabel(IX, a))).join(' · ');
  const sectors = (ev.sectors || []).map((a) => esc(taxLabel(IX, a))).join(' · ');
  const auth = (ev.authority || []).map((a) => {
    const x = IX.institution.get(a);
    return esc(x ? (x.short_name + (x.full_name && x.full_name !== x.short_name ? ' (' + x.full_name + ')' : '')) : a);
  }).join(' · ');
  const basis = (ev.provisions || []).map((p) => {
    const pr = IX.provision.get(p);
    const owner = IX.provisionOwner.get(p);
    const inst = owner ? IX.instrument.get(owner) : null;
    return esc(pr ? ((inst ? inst.short_name + ' ' : '') + 'Art. ' + pr.number) : p);
  }).join(' · ');
  const srcs = (ev.sources || []).map((s) => {
    const src = IX.source.get(s);
    return src ? '<div>' + F.citeHTML(src, IX, 'note') + '</div>' : '';
  }).join('');

  const unknown = (v, fallbackWord) => v
    ? esc(v)
    : '<span class="unknown">' + (fallbackWord || 'not recorded') + '</span>';

  return '<dl>' +
    '<dt>Event type</dt><dd>' + esc(taxLabel(IX, ev.event_type)) +
      (taxLabel(IX, ev.event_type) ? '' : '') + '</dd>' +
    '<dt>Instrument</dt><dd>' + esc(instrName(ev.instrument)) + '</dd>' +
    '<dt>Affected actors</dt><dd>' + (actors || '<span class="unknown">not recorded</span>') + '</dd>' +
    (sectors ? '<dt>Sectors</dt><dd>' + sectors + '</dd>' : '') +
    '<dt>Obligation</dt><dd>' + unknown(tr(ev.id + '.obligation', ev.obligation)) + '</dd>' +
    '<dt>Required action</dt><dd>' + unknown(ev.required_action, 'no action required of regulated entities') + '</dd>' +
    '<dt>Authority</dt><dd>' + (auth || '<span class="unknown">not recorded</span>') + '</dd>' +
    '<dt>Legal basis</dt><dd>' + (basis || '<span class="unknown">not pinned to a provision</span>') + '</dd>' +
    '<dt>Status</dt><dd>' + esc(ev.status || 'unknown') + '</dd>' +
    '<dt>Verified</dt><dd>' + (ev.last_verified ? esc(F.humanDate(ev.last_verified)) : '<span class="unknown">never</span>') +
      (ev.requires_verification ? ' — <span class="unknown">' + esc(ev.verification_note || 'requires verification') + '</span>' : '') + '</dd>' +
    '<dt>Sources</dt><dd>' + (srcs || '<span class="unknown">none recorded</span>') + '</dd>' +
    '</dl>';
}

function rowHTML(ev, i) {
  const type = String(ev.event_type).split(':').pop();
  const prec = String(ev.date_precision || '').split(':').pop();
  const dateTxt = tr(ev.id + '.date_label', F.humanDate(ev.date, ev.date_precision));
  const past = F.isPast(ev.date);
  const evText = tr(ev.id + '.obligation', ev.obligation || taxLabel(IX, ev.event_type));
  const untranslated = lang() !== 'en' && !OVERLAY[ev.id + '.obligation'];

  /* The ISO date and the event type travel with the row. The rota used to
     recover the date by parsing the rendered month name against a table of
     abbreviations in five languages — "set", "sept", "ago", "aou" — which is
     a guess dressed as a lookup. The row now simply carries the fact. */
  return '<tr class="cal-row' + (past ? ' past' : '') + '" data-ev="' + esc(ev.id) + '"' +
    ' data-date="' + esc(ev.date) + '"' +
    ' data-etype="' + esc(type) + '"' +
    ' data-instrument="' + esc(ev.instrument) + '">' +
    '<td class="c-date" data-label="Date">' + esc(dateTxt) +
      (prec && prec !== 'day' ? '<span class="c-approx">' + esc(prec) + ' precision</span>' : '') + '</td>' +
    '<td data-label="Instrument">' + esc(instrName(ev.instrument)) + '</td>' +
    '<td data-label="What happens">' +
      '<span class="cal-etype" data-e="' + esc(type) + '">' + esc(taxLabel(IX, ev.event_type)) + '</span>' +
      '<div>' + esc(evText) + (untranslated ? '<span class="cal-fallback">EN</span>' : '') + '</div>' +
      '<button class="cal-more" type="button" aria-expanded="false" aria-controls="cal-d-' + i + '">Details</button>' +
    '</td></tr>' +
    '<tr class="cal-detail" id="cal-d-' + i + '" hidden><td colspan="3">' + detailList(ev) + '</td></tr>';
}

/* ---------------------------------------------------------- controls */

function controlsHTML() {
  const types = [...new Set([...IX.event.values()].map((e) => e.event_type))]
    .sort((a, b) => taxLabel(IX, a).localeCompare(taxLabel(IX, b)));
  const instruments = [...new Set([...IX.event.values()].map((e) => e.instrument))]
    .sort((a, b) => String(instrName(a)).localeCompare(String(instrName(b))));
  const opt = (v, l, sel) => '<option value="' + esc(v) + '"' + (sel === v ? ' selected' : '') + '>' + esc(l) + '</option>';
  /* each label travels with its own control: as bare siblings in a wrapping
     flex row they came apart, leaving "Instrument" on one line and its select
     on the next, pointing at nothing */
  return '<div class="cal-controls">' +
    '<span class="flt"><label for="cal-h">Horizon</label><select id="cal-h">' +
      opt('upcoming', 'Upcoming', filters.horizon) + opt('past', 'Already occurred', filters.horizon) + opt('all', 'All', filters.horizon) +
    '</select></span>' +
    '<span class="flt"><label for="cal-t">Event type</label><select id="cal-t">' + opt('', 'All types', filters.type) +
      types.map((t) => opt(t, taxLabel(IX, t), filters.type)).join('') + '</select></span>' +
    '<span class="flt"><label for="cal-i">Instrument</label><select id="cal-i">' + opt('', 'All instruments', filters.instrument) +
      instruments.map((t) => opt(t, instrName(t), filters.instrument)).join('') + '</select></span>' +
    '<span class="cal-count" role="status"></span>' +
    '</div>';
}

/* ---------------------------------------------------------- render */

let host = null;

function render() {
  const table = document.querySelector('#annex-a table');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  /* below 720px this becomes one record per event rather than a table with a
     scrollbar; the transform is in css/tokens.css and needs only the class
     and the per-cell labels the rows already carry */
  table.classList.add('t-rec');

  const list = events();
  tbody.innerHTML = list.map(rowHTML).join('') ||
    '<tr><td colspan="3"><div class="state" data-kind="empty"><h3>Nothing in this window</h3>' +
    '<p>No calendar event matches the current horizon, event type and instrument together. ' +
    'Widening the horizon to <b>All</b> is usually what is wanted.</p></div></td></tr>';

  const count = host && host.querySelector('.cal-count');
  if (count) count.textContent = list.length + ' event' + (list.length === 1 ? '' : 's');

  // the volvelle derives its dial from this table; tell it to re-read
  document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang: lang(), missing: 0, source: 'calendar' } }));
}

function mountControls() {
  const table = document.querySelector('#annex-a table');
  if (!table) return;
  const wrap = table.closest('figure') || table.parentElement;
  if (!wrap) return;
  host = document.createElement('div');
  host.innerHTML = controlsHTML();
  host = host.firstElementChild;
  wrap.parentElement.insertBefore(host, wrap);

  host.addEventListener('change', (e) => {
    if (e.target.id === 'cal-h') filters.horizon = e.target.value;
    else if (e.target.id === 'cal-t') filters.type = e.target.value;
    else if (e.target.id === 'cal-i') filters.instrument = e.target.value;
    else return;
    render();
  });
}

export async function initCalendar(ix) {
  IX = ix;
  await refreshOverlay();
  mountControls();
  render();

  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.cal-more');
    if (!b) return;
    const row = document.getElementById(b.getAttribute('aria-controls'));
    if (!row) return;
    const open = row.hidden;
    row.hidden = !open;
    b.setAttribute('aria-expanded', String(open));
    b.textContent = open ? 'Hide details' : 'Details';
  });

  // a language switch replaces prose innerHTML; the calendar is rendered from
  // data, so it re-renders from the overlay for the new locale instead
  document.addEventListener('i18n:applied', (e) => {
    if (e.detail && e.detail.source === 'calendar') return;   // our own event
    refreshOverlay().then(render);
  });
}

async function refreshOverlay() {
  OVERLAY = await loadOverlay(lang());
  return OVERLAY;
}
