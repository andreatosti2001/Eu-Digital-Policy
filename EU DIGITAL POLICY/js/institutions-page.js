/* ============================================================
   The institutional map.

   Eight competence roles, kept apart because they are not
   interchangeable: legislating is not supervising, supervising is
   not fining, and interpreting is neither. The map is built from
   the competence edges in institutions.json, which carry an
   exclusivity flag, a scope string and a legal basis — so the
   hard cases stay hard rather than being flattened.

   The two views answer the two directions of the same question:
   what does this body do, and who does this to me.
   ============================================================ */

import { loadAll, index, renderError, label as taxLabel, note as taxNote } from './data.js';
import * as F from './format.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ROLES = ['role:legislates', 'role:supervises', 'role:investigates', 'role:fines',
  'role:issues-guidance', 'role:transposes', 'role:hears-appeals', 'role:interprets',
  'role:designates', 'role:coordinates', 'role:advises'];

/* the eight the brief asks the reader to be able to distinguish */
const PRIMARY = ROLES.slice(0, 8);

let IX = null;
let INSTITUTIONS = [];
let view = 'body';                 // 'body' | 'role'
let filters = { role: '', instrument: '' };

const edges = () => {
  const out = [];
  for (const inst of INSTITUTIONS) {
    for (const c of inst.competences || []) out.push({ inst, ...c });
  }
  return out;
};

const matches = (e) =>
  (!filters.role || e.role === filters.role) &&
  (!filters.instrument || e.instrument === filters.instrument || e.instrument === '*');

/* ---------------------------------------------------------- pieces */

function instrumentName(id) {
  if (id === '*') return 'across the acquis';
  const i = IX.instrument.get(id);
  return i ? i.short_name : id;
}

function competenceHTML(e) {
  const basis = (e.basis || []).map((p) => {
    const pr = IX.provision.get(p);
    const owner = IX.provisionOwner.get(p);
    const i = owner ? IX.instrument.get(owner) : null;
    return '<span class="im-basis">' + esc(pr ? ((i ? i.short_name + ' ' : '') + 'Art. ' + pr.number) : p) + '</span>';
  }).join('');
  const unverified = String(e.note || '').startsWith('requires verification');
  return '<li class="im-comp" data-role="' + esc(e.role.split(':').pop()) + '">' +
    '<span class="im-role">' + esc(taxLabel(IX, e.role)) + '</span>' +
    '<span class="im-inst">' + esc(instrumentName(e.instrument)) + '</span>' +
    (e.exclusive ? '<span class="im-excl" title="No other body holds this competence">exclusive</span>' : '') +
    (basis ? '<span class="im-bases">' + basis + '</span>' : '<span class="im-nobasis">no provision recorded</span>') +
    (e.scope ? '<span class="im-scope">' + esc(e.scope) + '</span>' : '') +
    (e.note && !unverified ? '<span class="im-note">' + esc(e.note) + '</span>' : '') +
    (unverified ? '<span class="im-unver">' + esc(e.note) + '</span>' : '') +
    '</li>';
}

function bodyHTML(inst) {
  const comps = (inst.competences || []).filter(matches);
  if (!comps.length) return '';
  const parent = inst.parent ? IX.institution.get(inst.parent) : null;
  const children = (inst.children || []).map((c) => IX.institution.get(c)).filter(Boolean);
  const roleSet = [...new Set(comps.map((c) => c.role))];

  return '<article class="im-body" id="' + esc(inst.id) + '">' +
    '<header class="im-head">' +
      '<h2>' + esc(inst.short_name) + '</h2>' +
      '<span class="im-type">' + esc(taxLabel(IX, inst.type)) + '</span>' +
      (inst.id.endsWith('-*')
        ? '<span class="im-class" title="A class of national bodies, not a single institution">class</span>' : '') +
      (inst.member_state ? '<span class="im-ms">' + esc(inst.member_state.toUpperCase()) + '</span>' : '') +
      '<span class="im-roles">' + roleSet.map((r) =>
        '<span class="im-pill" data-role="' + esc(r.split(':').pop()) + '">' + esc(taxLabel(IX, r)) + '</span>').join('') +
      '</span>' +
    '</header>' +
    (inst.full_name && inst.full_name !== inst.short_name
      ? '<p class="im-full">' + esc(inst.full_name) + '</p>' : '') +
    (parent || children.length
      ? '<p class="im-rel">' +
        (parent ? 'Part of <a href="#' + esc(parent.id) + '">' + esc(parent.short_name) + '</a>. ' : '') +
        (children.length ? 'Comprises ' + children.map((c) =>
          '<a href="#' + esc(c.id) + '">' + esc(c.short_name) + '</a>').join(', ') + '.' : '') +
        '</p>' : '') +
    '<ul class="im-comps">' + comps.map(competenceHTML).join('') + '</ul>' +
    '</article>';
}

function roleHTML(role) {
  const list = edges().filter((e) => e.role === role).filter(matches);
  if (!list.length) return '';
  const byInst = new Map();
  for (const e of list) {
    if (!byInst.has(e.inst.id)) byInst.set(e.inst.id, { inst: e.inst, items: [] });
    byInst.get(e.inst.id).items.push(e);
  }
  return '<article class="im-rolegroup" data-role="' + esc(role.split(':').pop()) + '">' +
    '<header class="im-rolehead">' +
      '<h2>' + esc(taxLabel(IX, role)) + '</h2>' +
      '<span class="im-count">' + byInst.size + ' bod' + (byInst.size === 1 ? 'y' : 'ies') + '</span>' +
    '</header>' +
    '<div class="im-rolebodies">' + [...byInst.values()].map(({ inst, items }) =>
      '<div class="im-rolebody">' +
        '<a class="im-rolename" href="#' + esc(inst.id) + '">' + esc(inst.short_name) +
          (inst.id.endsWith('-*')
            ? '<span class="im-class" title="A class of national bodies, not a single institution">class</span>'
            : (inst.member_state ? '<span class="im-memberof">' + esc(inst.member_state.toUpperCase()) + ' — one member of that class</span>' : '')) +
        '</a>' +
        '<span class="im-rolewhat">' + items.map((e) =>
          esc(instrumentName(e.instrument)) + (e.exclusive ? ' <span class="im-excl">exclusive</span>' : '') +
          (e.scope ? '<span class="im-scope">' + esc(e.scope) + '</span>' : '')).join('<br>') +
        '</span>' +
      '</div>').join('') + '</div>' +
    '</article>';
}

/* ---------------------------------------------------------- render */

function render() {
  const host = document.getElementById('imBody');
  if (view === 'role') {
    const out = PRIMARY.concat(ROLES.slice(8)).map(roleHTML).filter(Boolean).join('');
    host.innerHTML = out || '<p class="enf-empty">Nothing matches this filter.</p>';
  } else {
    const out = INSTITUTIONS
      .slice()
      .sort((a, b) => {
        const rank = (x) => (x.type === 'inst-type:eu-institution' ? 0
          : x.type === 'inst-type:eu-body' || x.type === 'inst-type:directorate-general' ? 1
            : x.type === 'inst-type:court' ? 2
              : x.type === 'inst-type:eu-agency' || x.type === 'inst-type:network' ? 3 : 4);
        return rank(a) - rank(b) || a.short_name.localeCompare(b.short_name);
      })
      .map(bodyHTML).filter(Boolean).join('');
    host.innerHTML = out || '<p class="enf-empty">Nothing matches this filter.</p>';
  }
  const n = edges().filter(matches).length;
  const c = document.querySelector('.im-total');
  if (c) c.textContent = n + ' competence' + (n === 1 ? '' : 's') + ' shown';
}

function controls() {
  const opt = (v, l, sel) => '<option value="' + esc(v) + '"' + (sel === v ? ' selected' : '') + '>' + esc(l) + '</option>';
  const instIds = [...new Set(edges().map((e) => e.instrument))].filter((i) => i !== '*').sort();
  document.getElementById('imControls').innerHTML =
    '<span class="dc-label">View</span>' +
    '<button class="dna-chip" id="v-body" aria-pressed="true" type="button">By body</button>' +
    '<button class="dna-chip" id="v-role" aria-pressed="false" type="button">By competence</button>' +
    '<span class="flt"><label for="f-role">Role</label><select id="f-role">' + opt('', 'All eight', filters.role) +
      PRIMARY.map((r) => opt(r, taxLabel(IX, r), filters.role)).join('') + '</select></span>' +
    '<span class="flt"><label for="f-inst">Instrument</label><select id="f-inst">' + opt('', 'All', filters.instrument) +
      instIds.map((i) => opt(i, instrumentName(i), filters.instrument)).join('') + '</select></span>' +
    '<span class="im-total" role="status"></span>';

  const host = document.getElementById('imControls');
  host.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    view = b.id === 'v-role' ? 'role' : 'body';
    host.querySelector('#v-body').setAttribute('aria-pressed', String(view === 'body'));
    host.querySelector('#v-role').setAttribute('aria-pressed', String(view === 'role'));
    render();
  });
  host.addEventListener('change', (e) => {
    if (e.target.id === 'f-role') filters.role = e.target.value;
    else if (e.target.id === 'f-inst') filters.instrument = e.target.value;
    else return;
    render();
  });
}

function legend() {
  document.getElementById('imLegend').innerHTML = PRIMARY.map((r) =>
    '<div class="im-legend-row"><span class="im-pill" data-role="' + esc(r.split(':').pop()) + '">' +
    esc(taxLabel(IX, r)) + '</span><span>' + esc(taxNote(IX, r) || '') + '</span></div>').join('');
}

function stats() {
  const e = edges();
  const exclusive = e.filter((x) => x.exclusive).length;
  const noBasis = e.filter((x) => !(x.basis || []).length).length;
  document.getElementById('imStats').innerHTML =
    '<span><b>' + INSTITUTIONS.length + '</b> bodies</span>' +
    '<span><b>' + e.length + '</b> competences</span>' +
    '<span><b>' + exclusive + '</b> held exclusively</span>' +
    '<span><b>' + noBasis + '</b> not yet anchored to a provision</span>';
}

/* Arriving from a search result: institutions.html#edpb. Filters are
   cleared first so the named body cannot be hidden by a filter the
   linker knew nothing about. */
function focusFromHash() {
  const id = decodeURIComponent(String(location.hash || '').slice(1));
  if (!id || !IX.institution.get(id)) return;
  if (filters.role || filters.instrument || view !== 'body') {
    filters = { role: '', instrument: '' };
    view = 'body';
    const host = document.getElementById('imControls');
    if (host) {
      for (const sel of host.querySelectorAll('select')) sel.value = '';
      const vb = host.querySelector('#v-body'), vr = host.querySelector('#v-role');
      if (vb) vb.setAttribute('aria-pressed', 'true');
      if (vr) vr.setAttribute('aria-pressed', 'false');
    }
    render();
  }
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('tabindex', '-1');
  el.scrollIntoView({ block: 'start' });
  el.focus({ preventScroll: true });
  el.classList.add('im-lit');
  setTimeout(() => el.classList.remove('im-lit'), 1800);
}

(async function boot() {
  const host = document.getElementById('imBody');
  try {
    const db = await loadAll(['taxonomy', 'instruments', 'institutions', 'sources']);
    IX = index(db);
    INSTITUTIONS = db.institutions.institutions || [];
    stats(); legend(); controls(); render();
    focusFromHash();
    window.addEventListener('hashchange', focusFromHash);
  } catch (e) {
    renderError(host, e, () => location.reload());
    console.error('[institutions]', e);
  }
})();
