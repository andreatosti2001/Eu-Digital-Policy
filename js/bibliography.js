/* ============================================================
   The bibliography page. Chicago bibliography form, grouped by the
   source hierarchy, alphabetical within each tier, with the claims
   each source is actually used for — so a reader can go the other
   way round: from a source to what it was made to carry.
   ============================================================ */

import { loadAll, index, renderError, label as taxLabel, note as taxNote } from './data.js';
import * as F from './format.js';
import { renderFilterState, syncUrl, readUrl, emptyState } from './filters.js';
import { openBacklog, riskClass, freshnessState, kindInfo } from './evidence-model.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TIERS = ['tier:1', 'tier:2', 'tier:3', 'tier:4'];
const TIER_TITLE = {
  'tier:1': 'Primary law and courts',
  'tier:2': 'Regulators and EU institutions',
  'tier:3': 'Research',
  'tier:4': 'Industry, advocacy and press',
};

let IX = null;

/* the placeholder provenance used where no external source has been located */
const SELF_SOURCE = 'src-brief-original';
let USED = new Map();     // sourceId -> [{claim, supports}]
let filters = { q: '', tier: '', status: '' };

function buildUsage(db) {
  USED = new Map();
  const add = (sid, entry) => {
    if (!USED.has(sid)) USED.set(sid, []);
    USED.get(sid).push(entry);
  };
  for (const c of db.claims.claims) {
    for (const ref of c.sources || []) add(ref.source_id, { claim: c, supports: ref.supports });
  }
}

function entryHTML(src) {
  const uses = USED.get(src.id) || [];
  const byType = {};
  for (const u of uses) {
    const t = F.typeOf(u.claim);
    byType[t] = (byType[t] || 0) + 1;
  }
  const usedLine = uses.length
    ? 'Cited for ' + uses.length + ' claim' + (uses.length === 1 ? '' : 's') + ': ' +
      Object.entries(byType).map(([t, n]) => esc(t) + ' ×' + n).join(', ') + '.'
    : 'Recorded but not currently attached to any claim.';

  const direct = uses.filter((u) => u.supports === 'supports:direct').length;
  const partial = uses.filter((u) => u.supports === 'supports:partial').length;
  const context = uses.filter((u) => u.supports === 'supports:context').length;
  const strength = [
    direct ? direct + ' states' : null,
    partial ? partial + ' partial' : null,
    context ? context + ' context only' : null,
  ].filter(Boolean).join(' · ');

  return '<article class="bib-entry" id="' + esc(src.id) + '">' +
    '<p class="bib-cite">' + F.citeHTML(src, IX, 'bibliography') + '</p>' +
    '<div class="bib-meta">' +
      '<span class="bib-url" data-s="' + esc(src.url_status) + '">' +
        esc(taxLabel(IX, src.url_status)) + '</span>' +
      (src.type ? '<span>' + esc(taxLabel(IX, src.type)) + '</span>' : '') +
      (src.accessed ? '<span>accessed ' + esc(F.humanDate(src.accessed)) + '</span>' : '') +
      (strength ? '<span>' + esc(strength) + '</span>' : '') +
      '<span>' + esc(src.id) + '</span>' +
    '</div>' +
    '<p class="bib-used">' + usedLine + '</p>' +
    (src.note ? '<p class="bib-note">' + esc(src.note) + '</p>' : '') +
    '</article>';
}

function matches(src) {
  if (filters.tier && src.tier !== filters.tier) return false;
  if (filters.status === 'nourl' && src.url_status !== 'url:none') return false;
  if (filters.status === 'live' && src.url_status !== 'url:live') return false;
  if (filters.status === 'unused' && (USED.get(src.id) || []).length) return false;
  if (filters.q) {
    const hay = [src.title, src.publisher_name, src.id, src.note, src.url].join(' ').toLowerCase();
    if (!hay.includes(filters.q.toLowerCase())) return false;
  }
  return true;
}

function render() {
  const host = document.getElementById('bib');
  const all = [...IX.source.values()].filter(matches);
  let out = '';
  let shown = 0;

  for (const tier of TIERS) {
    const list = all.filter((s) => s.tier === tier)
      .sort((a, b) => F.sortKey(a, IX).localeCompare(F.sortKey(b, IX)));
    if (!list.length) continue;
    shown += list.length;
    out += '<section class="tier-block">' +
      '<div class="tier-head">' +
        '<h2>' + esc(TIER_TITLE[tier]) + '</h2>' +
        '<span class="th-n">' + list.length + '</span>' +
        '<p>' + esc(taxNote(IX, tier) || '') + '</p>' +
      '</div>' + list.map(entryHTML).join('') + '</section>';
  }

  const untiered = all.filter((s) => !TIERS.includes(s.tier));
  if (untiered.length) {
    shown += untiered.length;
    out += '<section class="tier-block"><div class="tier-head"><h2>Untiered</h2>' +
      '<span class="th-n">' + untiered.length + '</span>' +
      '<p>These records carry no tier and must be classified before publication.</p></div>' +
      untiered.map(entryHTML).join('') + '</section>';
  }

  host.innerHTML = out || emptyState('sources',
    'Every source here is one the brief actually cites; a combination with no results ' +
    'means nothing in the bibliography has that shape.');

  /* the same filter-state row every filtered view on the site uses: what is
     on, how much it leaves, and a way to take one off without going back
     through the control that set it */
  renderFilterState({
    host: document.getElementById('bibState'),
    active: activeFilters(),
    count: { shown, total: IX.source.size },
    onRemove: (k) => setFilter(k, ''),
    onClear: clearFilters,
  });
  const inline = host.querySelector('[data-clear]');
  if (inline) inline.addEventListener('click', clearFilters);
  syncUrl(filters);
}

const FILTER_LABEL = { q: 'Search', tier: 'Tier', status: 'Show' };
const STATUS_LABEL = {
  live: 'URL confirmed live', nourl: 'No URL located', unused: 'Not attached to a claim',
};

function activeFilters() {
  return Object.entries(filters).filter(([, v]) => v).map(([k, v]) => ({
    key: k,
    label: FILTER_LABEL[k] || k,
    value: k === 'tier' ? (TIER_TITLE[v] || v) : k === 'status' ? (STATUS_LABEL[v] || v) : v,
  }));
}

function setFilter(key, value) {
  filters[key] = value || '';
  const ids = { q: 'bq', tier: 'bt', status: 'bs' };
  const el = document.getElementById(ids[key]);
  if (el) el.value = filters[key];
  render();
}

function clearFilters() {
  for (const k of Object.keys(filters)) filters[k] = '';
  for (const id of ['bq', 'bt', 'bs']) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  }
  render();
}

function controls() {
  const wrap = document.createElement('div');
  wrap.className = 'bib-controls';
  wrap.innerHTML =
    '<label for="bq">Search</label><input id="bq" type="search" placeholder="title, publisher, id…"/>' +
    '<label for="bt">Tier</label><select id="bt">' +
      '<option value="">All tiers</option>' +
      TIERS.map((t) => '<option value="' + t + '">' + esc(TIER_TITLE[t]) + '</option>').join('') +
    '</select>' +
    '<label for="bs">Show</label><select id="bs">' +
      '<option value="">Everything</option>' +
      '<option value="live">URL confirmed live</option>' +
      '<option value="nourl">No URL located</option>' +
      '<option value="unused">Not attached to a claim</option>' +
    '</select>' +
    '';
  wrap.classList.add('filters-row');
  const state = document.createElement('div');
  state.className = 'filters-state';
  state.id = 'bibState';
  document.getElementById('bib').before(wrap);
  document.getElementById('bib').before(state);
  /* arriving with a filter in the URL applies it */
  filters = readUrl(filters);
  for (const [k, id] of [['q', 'bq'], ['tier', 'bt'], ['status', 'bs']]) {
    const el = document.getElementById(id);
    if (el && filters[k]) el.value = filters[k];
  }
  wrap.addEventListener('input', (e) => {
    if (e.target.id === 'bq') setFilter('q', e.target.value.trim());
  });
  wrap.addEventListener('change', (e) => {
    if (e.target.id === 'bt') setFilter('tier', e.target.value);
    else if (e.target.id === 'bs') setFilter('status', e.target.value);
  });
}

function stats(db) {
  const s = [...IX.source.values()];
  const live = s.filter((x) => x.url_status === 'url:live').length;
  const none = s.filter((x) => x.url_status === 'url:none').length;
  const t1 = s.filter((x) => x.tier === 'tier:1').length;
  const claims = db.claims.claims;
  const unver = claims.filter((c) => F.isUnverified(c, IX)).length;

  /* How many claims rest only on the brief itself.

     This is the number a hostile reader asks for first and it was not on the
     page anywhere. Each such claim already carries an unverified flag, but a
     footnote apparatus and a tiered bibliography together imply an externally
     sourced document, and half of this one is not. Stating the share is the
     minimum the apparatus owes; it is counted here rather than typed, so it
     cannot drift away from the data. */
  const selfOnly = claims.filter((c) => {
    const direct = (c.sources || []).filter((x) => x.supports === 'supports:direct');
    return direct.length > 0 && direct.every((x) => x.source_id === SELF_SOURCE);
  }).length;
  const noDirect = claims.filter((c) =>
    !(c.sources || []).some((x) => x.supports === 'supports:direct')).length;

  document.getElementById('bibStats').innerHTML =
    '<span><b>' + s.length + '</b> sources</span>' +
    '<span><b>' + t1 + '</b> primary law and courts</span>' +
    '<span><b>' + live + '</b> URLs confirmed live</span>' +
    '<span><b>' + none + '</b> with no URL located</span>' +
    '<span><b>' + claims.length + '</b> claims, of which <b>' + unver + '</b> require verification</span>';

  const self = document.getElementById('bibSelf');
  if (self) {
    self.innerHTML =
      '<b>' + selfOnly + ' of ' + claims.length + '</b> claims in this brief are supported ' +
      'directly by nothing but the brief itself, and <b>' + noDirect + '</b> more have no ' +
      'directly supporting source at all. Those are counted from the data on every load, ' +
      'not written down here. A note that leads back to the document making the claim is ' +
      'provenance, not corroboration; each one is flagged where it appears, and ' +
      'the figure is stated here so the apparatus does not imply more than it holds.';
  }

  /* The grade breakdown. "122 records require verification" was one number
     doing five jobs, and it made an argument — which no citation can settle —
     look like a fact awaiting a source. */
  const grades = document.getElementById('bibGrades');
  if (grades) {
    const t = F.gradeTally(claims, IX);
    const order = F.GRADE_ORDER;
    grades.innerHTML = order.map((k) => {
      const g = F.GRADE[k];
      return '<li class="bg-row" data-g="' + k + '">' +
        '<span class="bg-n">' + t[k] + '</span>' +
        '<span class="bg-body"><span class="bg-label">' + g.label + '</span>' +
        '<span class="bg-gloss">' + g.gloss + '</span></span></li>';
    }).join('');
  }
}

/* ============================================================
   Data quality, measured on this load. Four panels, every number
   computed here from the datasets: nothing on the page states a count
   that could outlive the data. The backlog is js/evidence-model.js
   openBacklog(), the same function tools/validate.mjs prints, so the
   site and the build cannot disagree about it.
   ============================================================ */

const today = () => new Date().toISOString().slice(0, 10);
const arrOf = (x) => (Array.isArray(x) ? x : []);
const dl = (rows) => '<dl class="dq-list">' + rows.map(([n, label, sub]) =>
  '<div class="dq-row"><dt class="dq-n">' + n + '</dt><dd>' + label +
  (sub ? '<span class="dq-sub">' + sub + '</span>' : '') + '</dd></div>').join('') + '</dl>';

const BACKLOG_WORD = {
  'claim (unverified)': ['Claims never verified', 'no verification date at all'],
  'enforcement': ['Enforcement records flagged', 'an appeal, a payment or an outcome not established from a primary source'],
  'timeline': ['Timeline events flagged', null],
  'transposition': ['Transposition states flagged', 'per-Member-State transposition not established'],
  'competence': ['Institutional competences flagged', 'no official text states the allocation'],
  'source (no URL)': ['Sources with no URL located', 'listed anyway, marked as such below'],
  'instrument (never verified)': ['Instruments never verified', null],
  'relationship': ['Instrument relationships flagged', null],
  'glossary': ['Glossary entries flagged', null],
  'applicability rule': ['Applicability rules flagged', null],
  'provision': ['Provisions flagged', null],
};

function dqBacklog(db) {
  const rows = openBacklog(db);
  const byKind = new Map();
  for (const r of rows) byKind.set(r.kind, (byKind.get(r.kind) || 0) + 1);
  /* "No external direct source" is split by what the claim is. An
     argument — an interpretation, a critique, a forecast — is not owed a
     citation that could settle it; a fact, a statement of law or an
     attribution is. Counting them as one number made the author's voice
     look like a missing footnote. */
  const claimById = new Map(arrOf(db.claims.claims).map((c) => [c.id, c]));
  const noDirect = rows.filter((r) => r.kind === 'claim (no external direct source)').map((r) => claimById.get(r.id)).filter(Boolean);
  const owed = noDirect.filter((c) => kindInfo(c).owesVerification).length;
  const args = noDirect.length - owed;
  const list = [];
  if (owed) list.push([owed, 'Facts, law and attributions without an external source that states them', 'the ones a source could settle']);
  if (args) list.push([args, 'Arguments resting on the brief itself', 'interpretations, critiques and forecasts: no citation can settle an argument, so these stay counted rather than being hidden']);
  for (const [k, n] of [...byKind.entries()].sort((a, b) => b[1] - a[1])) {
    if (k === 'claim (no external direct source)') continue;
    const w = BACKLOG_WORD[k] || [k, null];
    list.push([n, esc(w[0]), w[1] ? esc(w[1]) : null]);
  }
  document.getElementById('dqBacklog').innerHTML =
    '<p class="dq-total"><b>' + rows.length + '</b> records say they are not established.</p>' + dl(list) +
    '<p class="dq-foot">A rise usually means someone examined a record and found it wanting. A fall is good news only when verification against a primary source produced it.</p>';
}

function dqDates(db) {
  const sets = [
    ['Claims', arrOf(db.claims.claims)],
    ['Enforcement records', arrOf(db.enforcement.enforcement)],
    ['Timeline events', arrOf(db.timeline.events)],
    ['Instruments', arrOf(db.instruments.instruments)],
  ];
  document.getElementById('dqDates').innerHTML = sets.map(([name, list]) => {
    const t = new Map();
    for (const r of list) { const k = r.last_verified || 'never'; t.set(k, (t.get(k) || 0) + 1); }
    const keys = [...t.keys()].sort((a, b) => (a === 'never') - (b === 'never') || b.localeCompare(a));
    return '<div class="dq-block"><h4>' + name + ' <span class="dq-sub">' + list.length + '</span></h4>' +
      '<ul class="dq-dates">' + keys.map((k) =>
        '<li><span class="dq-d">' + (k === 'never' ? 'never verified' : esc(F.humanDate(k))) + '</span>' +
        '<b>' + t.get(k) + '</b></li>').join('') + '</ul></div>';
  }).join('') +
  '<p class="dq-foot">' + 'A date is when the record was last checked against its sources, not a promise that it is still true.' + '</p>';
}

const FRESH_ORDER = ['freshness:fresh', 'freshness:aging', 'freshness:review-due', 'freshness:stale'];
const FRESH_WORD = { 'freshness:fresh': 'fresh', 'freshness:aging': 'ageing', 'freshness:review-due': 'review due', 'freshness:stale': 'stale' };

function dqFresh(db) {
  const asOf = today();
  const enfById = new Map(arrOf(db.enforcement.enforcement).map((e) => [e.id, e]));
  const sets = [
    ['Claims', 'claim', arrOf(db.claims.claims)],
    ['Enforcement records', 'enforcement', arrOf(db.enforcement.enforcement)],
    ['Timeline events', 'event', arrOf(db.timeline.events)],
    ['Instruments', 'instrument', arrOf(db.instruments.instruments)],
  ];
  const head = '<tr><th scope="col">Dataset</th>' + FRESH_ORDER.map((s) => '<th scope="col">' + FRESH_WORD[s] + '</th>').join('') + '</tr>';
  const body = sets.map(([name, kind, list]) => {
    const t = {};
    for (const r of list) {
      const st = freshnessState(r.last_verified, riskClass(kind, r, { asOf, enforcementById: enfById }), asOf);
      t[st] = (t[st] || 0) + 1;
    }
    return '<tr><th scope="row">' + name + '</th>' + FRESH_ORDER.map((s) => '<td>' + (t[s] || 0) + '</td>').join('') + '</tr>';
  }).join('');
  document.getElementById('dqFresh').innerHTML =
    '<p class="dq-cap" id="dqFreshCap">As of ' + esc(F.humanDate(asOf)) + ', against a review interval set by what each record is about: a pending appeal is re-read within 14 days, a settled date within a year.</p>' +
    '<table class="dq-table" aria-describedby="dqFreshCap">' +
    '<thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
}

const SUPPORT_ORDER = ['supports:direct', 'supports:partial', 'supports:context'];
const SUPPORT_HEAD = { 'supports:direct': 'states it', 'supports:partial': 'in part', 'supports:context': 'context only' };

function dqProv(db) {
  const rows = new Map([...TIERS, 'self', 'none'].map((k) => [k, { 'supports:direct': 0, 'supports:partial': 0, 'supports:context': 0 }]));
  for (const c of arrOf(db.claims.claims)) {
    for (const ref of c.sources || []) {
      const src = IX.source.get(ref.source_id);
      const key = ref.source_id === SELF_SOURCE ? 'self' : (src && TIERS.includes(src.tier) ? src.tier : 'none');
      if (rows.get(key)[ref.supports] != null) rows.get(key)[ref.supports] += 1;
    }
  }
  const label = (k) => k === 'self' ? 'The brief itself <span class="dq-sub">provenance, not corroboration</span>'
    : k === 'none' ? 'Untiered or missing' : esc(TIER_TITLE[k]);
  const body = [...rows.entries()].filter(([k, v]) => k !== 'none' || SUPPORT_ORDER.some((s) => v[s]))
    .map(([k, v]) => '<tr><th scope="row">' + label(k) + '</th>' + SUPPORT_ORDER.map((s) => '<td>' + v[s] + '</td>').join('') + '</tr>').join('');
  document.getElementById('dqProv').innerHTML =
    '<p class="dq-cap" id="dqProvCap">Every link from a claim to a source, by the source’s tier and by what the source does for the claim. A partial link establishes a narrower case; a context link is not a citation at all.</p>' +
    '<table class="dq-table" aria-describedby="dqProvCap">' +
    '<thead><tr><th scope="col">Source tier</th>' + SUPPORT_ORDER.map((s) => '<th scope="col">' + SUPPORT_HEAD[s] + '</th>').join('') + '</tr></thead>' +
    '<tbody>' + body + '</tbody></table>';
}

function quality(db) {
  for (const [fn, id] of [[dqBacklog, 'dqBacklog'], [dqDates, 'dqDates'], [dqFresh, 'dqFresh'], [dqProv, 'dqProv']]) {
    try { fn(db); } catch (e) {
      /* one panel failing must not take the bibliography with it, and must say so */
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="bib-empty">This panel could not be computed: ' + esc(e.message) + '</p>';
      console.error('[quality]', id, e);
    }
  }
}

(async function boot() {
  const host = document.getElementById('bib');
  try {
    const db = await loadAll(['taxonomy', 'instruments', 'institutions', 'sources', 'claims',
      'enforcement', 'timeline', 'glossary', 'applicability']);
    IX = index(db);
    buildUsage(db);
    stats(db);
    quality(db);
    controls();
    render();
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ block: 'center' });
    }
  } catch (e) {
    renderError(host, e, () => location.reload());
    console.error('[bibliography]', e);
  }
})();
