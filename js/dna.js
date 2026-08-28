/* ============================================================
   Regulatory DNA — the comparison system.

   Eleven dimensions. Nine are stored on the instrument; two are
   DERIVED and deliberately not stored, because storing them would
   be a second copy of a fact that already has a home:

     competent authority  ← institutions.json competence edges
     key dates            ← timeline.json, via instrument.milestones

   One renderer serves both the in-article table (five instruments,
   five rows) and the full comparison page. There is no second table
   anywhere in the repository.
   ============================================================ */

import * as F from './format.js';
import { label as taxLabel, note as taxNote } from './data.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const DIMENSIONS = [
  'regulated_actor', 'protected_party', 'objective', 'risk_logic', 'obligations',
  'authority', 'enforcement_mechanism', 'sanction', 'territorial_scope',
  'implementation_model', 'key_dates',
];

let OVERLAY = {};
const tr = (k, fallback) => (OVERLAY && OVERLAY[k]) || fallback;

export function setOverlay(o) { OVERLAY = o || {}; }

const UNKNOWN = '<span class="dna-unknown">not established</span>';

/* ---------------------------------------------------------- derivations */

/** Who supervises, investigates, fines. Derived, never stored on the instrument. */
export function authoritiesFor(instId, ix) {
  const ROLES = ['role:supervises', 'role:designates', 'role:fines', 'role:investigates', 'role:transposes'];
  const out = [];
  for (const inst of ix.institution.values()) {
    for (const c of inst.competences || []) {
      if (c.instrument !== instId) continue;
      if (!ROLES.includes(c.role)) continue;
      out.push({
        institution: inst,
        role: c.role,
        exclusive: !!c.exclusive,
        scope: c.scope || null,
        basis: c.basis || [],
      });
    }
  }
  // A wildcard entry (dpa-*, nca-*, dsc-*) states the class. Where one exists
  // for the same role, the individually named members of that class are
  // examples rather than additional authorities, and listing them here would
  // read as though Spain and Luxembourg supervise the GDPR and Ireland does not.
  const classes = new Set(out.filter((a) => a.institution.id.endsWith('-*')).map((a) => a.institution.id.slice(0, -1) + '|' + a.role));
  const filtered = out.filter((a) => {
    if (a.institution.id.endsWith('-*')) return true;
    for (const c of classes) {
      const [prefix, role] = c.split('|');
      if (a.role === role && a.institution.id.startsWith(prefix)) return false;
    }
    return true;
  });
  // Classes before individuals: "National DPAs" is the general answer to who
  // supervises the GDPR; the EDPS supervising the EU institutions is a real but
  // narrow competence and must not head the cell.
  const rank = (r) => ROLES.indexOf(r.role);
  const isClass = (r) => (r.institution.id.endsWith('-*') ? 0 : 1);
  return filtered.sort((a, b) => rank(a) - rank(b) || isClass(a) - isClass(b) ||
    a.institution.short_name.localeCompare(b.institution.short_name));
}

/** Entry into force, application, transposition — kept apart. Derived from timeline.json. */
export function datesFor(inst, ix) {
  return (inst.milestones || [])
    .map((id) => ix.event.get(id))
    .filter(Boolean)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

/* ---------------------------------------------------------- cell renderers */

function actorList(ids, ix) {
  if (!ids || !ids.length) return UNKNOWN;
  return ids.map((a) => esc(tr(a + '.label', taxLabel(ix, a)))).join(' · ');
}

function provisionList(ids, ix, limit) {
  if (!ids || !ids.length) return UNKNOWN;
  const shown = limit ? ids.slice(0, limit) : ids;
  const txt = shown.map((p) => {
    const pr = ix.provision.get(p);
    const owner = ix.provisionOwner.get(p);
    const i = owner ? ix.instrument.get(owner) : null;
    return esc(pr ? ((i ? i.short_name + ' ' : '') + 'Art. ' + pr.number) : p);
  }).join(' · ');
  return txt + (limit && ids.length > limit ? ' <span class="dna-more">+' + (ids.length - limit) + '</span>' : '');
}

function sanctionCell(dna) {
  const s = dna && dna.sanction_ceiling;
  if (!s) return UNKNOWN;
  const bits = [];
  if (s.pct_global_turnover != null) bits.push(s.pct_global_turnover + '% of global turnover');
  if (s.fixed_eur != null) bits.push('EUR ' + (s.fixed_eur / 1e6) + 'm');
  let out = bits.length ? esc(bits.join(' / ')) : UNKNOWN;
  if (s.note) out += '<span class="dna-note">' + esc(s.note) + '</span>';
  return out;
}

function authorityCell(instId, ix) {
  const list = authoritiesFor(instId, ix);
  if (!list.length) return UNKNOWN;
  const seen = new Set();
  const rows = [];
  for (const a of list) {
    const key = a.institution.id + a.role;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push('<span class="dna-auth">' +
      '<b>' + esc(a.institution.short_name) + '</b>' +
      '<span class="dna-role">' + esc(taxLabel(ix, a.role)) + (a.exclusive ? ' · exclusive' : '') + '</span>' +
      (a.scope ? '<span class="dna-note">' + esc(a.scope) + '</span>' : '') +
      '</span>');
  }
  return '<span class="dna-derived" title="Derived from institutions.json, not stored on the instrument">derived</span>' + rows.join('');
}

function datesCell(inst, ix, limit) {
  const evs = datesFor(inst, ix);
  if (!evs.length) return UNKNOWN;
  const shown = limit ? evs.slice(0, limit) : evs;
  return '<span class="dna-derived" title="Derived from timeline.json via the instrument’s milestones">derived</span>' +
    shown.map((e) => '<span class="dna-date">' +
      '<b class="' + (F.isPast(e.date) ? '' : 'future') + '">' + esc(F.humanDate(e.date, e.date_precision)) + '</b>' +
      '<span class="dna-role" data-e="' + esc(String(e.event_type).split(':').pop()) + '">' +
        esc(taxLabel(ix, e.event_type)) + '</span></span>').join('') +
    (limit && evs.length > limit ? '<span class="dna-more">+' + (evs.length - limit) + ' more</span>' : '');
}

/** One cell for one instrument on one dimension. */
export function cell(dim, inst, ix, opts = {}) {
  const d = inst.dna;
  const t = (field, fallback) => tr(inst.id + '.dna.' + dim, fallback);
  if (!d && !['authority', 'key_dates'].includes(dim)) {
    return '<span class="dna-unknown">no DNA recorded for this instrument</span>';
  }
  switch (dim) {
    case 'regulated_actor':      return t(dim, null) ? esc(t(dim)) : actorList(d.regulated_actor, ix);
    case 'protected_party':      return t(dim, null) ? esc(t(dim)) : actorList(d.protected_party, ix);
    case 'objective':            return esc(t(dim, d.objective)) || UNKNOWN;
    case 'risk_logic':           return esc(t(dim, d.risk_logic)) || UNKNOWN;
    case 'obligations':          return provisionList(d.obligation_anchor, ix, opts.compact ? 3 : 0);
    case 'authority':            return authorityCell(inst.id, ix);
    case 'enforcement_mechanism':return esc(t(dim, d.enforcement_mechanism)) || UNKNOWN;
    case 'sanction':             return sanctionCell(d);
    case 'territorial_scope':    return actorList(d.territorial_scope, ix);
    case 'implementation_model': return esc(t(dim, d.implementation_model)) || UNKNOWN;
    case 'key_dates':            return datesCell(inst, ix, opts.compact ? 3 : 0);
    default:                     return UNKNOWN;
  }
}

/* ---------------------------------------------------------- table */

export function renderTable(mount, ix, opts = {}) {
  const ids = (opts.instruments || []).filter((i) => ix.instrument.has(i));
  const dims = (opts.rows && opts.rows.length ? opts.rows : DIMENSIONS).filter((d) => DIMENSIONS.includes(d));
  if (!ids.length || !dims.length) {
    mount.innerHTML = '<p class="dna-unknown">Nothing selected to compare.</p>';
    return;
  }
  const insts = ids.map((i) => ix.instrument.get(i));

  const head = '<tr><th scope="col">' + esc(tr('dna:slot.label', 'Dimension')) + '</th>' +
    insts.map((i) => '<th scope="col" id="' + esc(i.id) + '">' +
      '<a class="dna-head-link" href="instrument.html?id=' + esc(i.id) + '">' +
        esc(tr(i.id + '.short_name', i.short_name)) + '</a>' +
      (i.kind === 'kind:proposal' ? '<span class="dna-proposal">proposal · not law</span>' : '') +
      '</th>').join('') + '</tr>';

  const body = dims.map((dim) => {
    const label = tr('dna:' + dim + '.label', taxLabel(ix, 'dna:' + dim));
    const hint = taxNote(ix, 'dna:' + dim);
    return '<tr data-dim="' + esc(dim) + '">' +
      '<th scope="row">' + esc(label) +
        (hint ? '<span class="dna-note">' + esc(hint) + '</span>' : '') + '</th>' +
      insts.map((i) => '<td>' + cell(dim, i, ix, opts) + '</td>').join('') +
      '</tr>';
  }).join('');

  /* ---- the narrow form -------------------------------------------------
     A comparison table is transposed — dimensions down, instruments across —
     so the generic table-to-record transform does not apply to it: stacking
     its rows would give you eleven blocks each headed by a dimension, which
     is the wrong grouping. Below 720px the same cells are re-grouped by
     instrument instead, which is the shape a phone reader actually wants:
     one instrument at a time, all eleven dimensions under it.

     Both forms are generated here from the same cells by the same code, and
     only one is ever displayed, so there is no second implementation to
     drift and nothing is announced twice to a screen reader. */
  const records = insts.map((i) => {
    const title = esc(tr(i.id + '.short_name', i.short_name));
    const rows = dims.map((dim) => {
      const label = tr('dna:' + dim + '.label', taxLabel(ix, 'dna:' + dim));
      return '<div class="dna-rec-row"><dt>' + esc(label) + '</dt>' +
        '<dd>' + cell(dim, i, ix, opts) + '</dd></div>';
    }).join('');
    /* the heading level follows the document, not the component: this same
       renderer mounts inside Part I of the brief, under an h3, and on the
       comparison page directly under the h1 */
    const H = opts.compact ? 'h4' : 'h2';
    return '<article class="dna-rec" id="' + esc(i.id) + '-rec"><' + H + '>' +
      '<a class="dna-head-link" href="instrument.html?id=' + esc(i.id) + '">' + title + '</a>' +
      (i.kind === 'kind:proposal' ? '<span class="dna-proposal">proposal · not law</span>' : '') +
      '</' + H + '><dl>' + rows + '</dl></article>';
  }).join('');

  mount.innerHTML =
    '<div class="dna-wrap only-wide"><table class="dna-table">' +
      '<thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
    '<div class="dna-records only-narrow">' + records + '</div>';
}

/** Mount every [data-render="dna-compare"] in the page. */
export function initDNA(ix, overlay) {
  setOverlay(overlay);
  for (const m of document.querySelectorAll('[data-render="dna-compare"]')) {
    renderTable(m, ix, {
      instruments: (m.dataset.instruments || '').split(',').map((s) => s.trim()).filter(Boolean),
      rows: (m.dataset.rows || '').split(',').map((s) => s.trim()).filter(Boolean),
      compact: true,
    });
  }
}
