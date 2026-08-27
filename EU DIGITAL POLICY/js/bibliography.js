/* ============================================================
   The bibliography page. Chicago bibliography form, grouped by the
   source hierarchy, alphabetical within each tier, with the claims
   each source is actually used for — so a reader can go the other
   way round: from a source to what it was made to carry.
   ============================================================ */

import { loadAll, index, renderError, label as taxLabel, note as taxNote } from './data.js';
import * as F from './format.js';

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

  host.innerHTML = out || '<p class="bib-empty">No sources match this filter.</p>';
  const c = document.querySelector('.bc-count');
  if (c) c.textContent = shown + ' of ' + IX.source.size + ' sources';
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
    '<span class="bc-count"></span>';
  document.getElementById('bib').before(wrap);
  wrap.addEventListener('input', (e) => {
    if (e.target.id === 'bq') filters.q = e.target.value.trim();
    else return;
    render();
  });
  wrap.addEventListener('change', (e) => {
    if (e.target.id === 'bt') filters.tier = e.target.value;
    else if (e.target.id === 'bs') filters.status = e.target.value;
    else return;
    render();
  });
}

function stats(db) {
  const s = [...IX.source.values()];
  const live = s.filter((x) => x.url_status === 'url:live').length;
  const none = s.filter((x) => x.url_status === 'url:none').length;
  const t1 = s.filter((x) => x.tier === 'tier:1').length;
  const claims = db.claims.claims;
  const unver = claims.filter(F.isUnverified).length;

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
    const order = ['primary', 'official', 'secondary', 'interpretation', 'unresolved'];
    grades.innerHTML = order.map((k) => {
      const g = F.GRADE[k];
      return '<li class="bg-row" data-g="' + k + '">' +
        '<span class="bg-n">' + t[k] + '</span>' +
        '<span class="bg-body"><span class="bg-label">' + g.label + '</span>' +
        '<span class="bg-gloss">' + g.gloss + '</span></span></li>';
    }).join('');
  }
}

(async function boot() {
  const host = document.getElementById('bib');
  try {
    const db = await loadAll(['taxonomy', 'instruments', 'institutions', 'sources', 'claims']);
    IX = index(db);
    buildUsage(db);
    stats(db);
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
