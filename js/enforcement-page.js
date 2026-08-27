/* ============================================================
   The enforcement observatory.

   Records rendered with the full eight-stage pipeline derived from
   them, and aggregates that carry their own unknowns. No figure on
   this page is a total that silently treats unresearched records
   as zero.
   ============================================================ */

import { loadAll, index, renderError, label as taxLabel, note as taxNote } from './data.js';
import * as F from './format.js';
import { STAGES, DERIVATION, derive, depth, aggregate } from './pipeline.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let IX = null;
let RECORDS = [];
let filters = { instrument: '', authority: '', action: '', payment: '', stage: '' };

/* one definition, in format.js, shared with the search index */
const eur = F.eur;

const STATE_WORD = {
  'state:reached': 'reached',
  'state:not-reached': 'not reached',
  'state:unknown': 'unknown',
  'state:na': 'n/a',
};

/* ---------------------------------------------------------- pipeline strip */

function pipelineHTML(rec, id) {
  const stages = derive(rec, IX);
  return '<div class="pipe" role="group" aria-label="Enforcement pipeline">' +
    stages.map((st, i) => {
      const meta = STAGES[i];
      const slug = st.state.split(':').pop();
      return '<button class="pipe-stage" type="button" data-state="' + esc(slug) + '" ' +
        'aria-expanded="false" aria-controls="' + id + '-s' + i + '">' +
        '<span class="pipe-dot" aria-hidden="true"></span>' +
        '<span class="pipe-name">' + esc(meta.short) + '</span>' +
        '<span class="pipe-state">' + esc(STATE_WORD[st.state]) + '</span>' +
        '</button>';
    }).join('') +
    '</div>' +
    stages.map((st, i) => {
      const meta = STAGES[i];
      return '<div class="pipe-detail" id="' + id + '-s' + i + '" hidden>' +
        '<h5>' + esc(taxLabel(IX, meta.id)) + ' — <span data-state="' + esc(st.state.split(':').pop()) + '">' +
          esc(STATE_WORD[st.state]) + '</span></h5>' +
        (st.note ? '<p class="pipe-note">' + esc(st.note) + '</p>' : '') +
        '<p class="pipe-why"><b>How this is derived</b> ' + esc(DERIVATION[meta.id]) + '</p>' +
        '</div>';
    }).join('');
}

/* ---------------------------------------------------------- one record */

function recordHTML(rec, n) {
  const id = 'enf-' + n;
  const inst = IX.instrument.get(rec.instrument);
  const auth = IX.institution.get(rec.authority);
  const stages = derive(rec, IX);
  const d = depth(stages);

  const basis = (rec.legal_basis || []).map((p) => {
    const pr = IX.provision.get(p);
    const owner = IX.provisionOwner.get(p);
    const i = owner ? IX.instrument.get(owner) : null;
    return '<span class="enf-chip">' + esc(pr ? ((i ? i.short_name + ' ' : '') + 'Art. ' + pr.number) : p) + '</span>';
  }).join('');

  const srcs = (rec.sources || []).map((s) => {
    const src = IX.source.get(s);
    return src ? '<li>' + F.citeHTML(src, IX, 'note') + '</li>' : '';
  }).join('');

  const axis = (word, value, vocab) => {
    const v = value ? taxLabel(IX, value) : 'not applicable';
    const note = value ? taxNote(IX, value) : null;
    const slug = value ? value.split(':').pop() : 'na';
    return '<div class="enf-axis"><dt>' + esc(word) + '</dt><dd>' +
      '<span class="enf-state" data-s="' + esc(slug) + '">' + esc(v) + '</span>' +
      (note ? '<span class="enf-axis-note">' + esc(note) + '</span>' : '') + '</dd></div>';
  };

  const ap = rec.appeal || {};
  const j = rec.judicial;

  return '<article class="enf-rec" id="' + esc(rec.id) + '" data-depth="' + d + '" data-id="' + esc(rec.id) + '">' +
    '<header class="enf-head">' +
      '<h2>' + esc(rec.entity) + '</h2>' +
      '<span class="enf-inst">' + esc(inst ? inst.short_name : rec.instrument) + '</span>' +
      '<span class="enf-auth">' + esc(auth ? auth.short_name : rec.authority) + '</span>' +
      '<span class="enf-date">' + esc(rec.decision_date ? F.humanDate(rec.decision_date) : 'no date recorded') + '</span>' +
      '<span class="enf-fine' + (rec.fine_eur == null ? ' none' : '') + '">' +
        esc(rec.fine_eur == null ? 'no fine' : eur(rec.fine_eur)) + '</span>' +
    '</header>' +

    '<p class="enf-action">' + esc(rec.action || '—') + '</p>' +

    pipelineHTML(rec, id) +

    '<dl class="enf-axes">' +
      axis('Action', rec.action_status) +
      axis('Payment', rec.payment_status) +
      axis('Remedy', rec.remedy_status) +
      axis('Appeal', ap.status) +
    '</dl>' +

    (ap.note ? '<p class="enf-sub"><b>Appeal</b> ' +
      (ap.forum ? esc(ap.forum) + (ap.lodged_by ? ', lodged by ' + esc(ap.lodged_by) : '') + '. ' : '') +
      esc(ap.note) + '</p>' : '') +

    (j ? '<p class="enf-sub"><b>Judicial</b> ' + esc(j.forum || '') +
      (j.date ? ', ' + esc(F.humanDate(j.date)) : '') +
      (j.case_ref ? ' (' + esc(j.case_ref) + ')' : '') + '. ' + esc(j.outcome || '') + '</p>' : '') +

    '<p class="enf-sub"><b>Behavioural outcome</b> ' +
      (rec.behavioural_outcome == null
        ? '<span class="enf-unknown">Unknown — not researched.</span>'
        : String(rec.behavioural_outcome).toLowerCase() === 'unknown'
          ? '<span class="enf-unknown">Unknown — researched, not publicly determinable.</span>'
          : esc(rec.behavioural_outcome)) + '</p>' +

    (basis ? '<div class="enf-field"><h3>Legal basis</h3><div class="enf-chips">' + basis + '</div></div>' : '') +

    (rec.requires_verification
      ? '<div class="enf-field warn"><h3>Requires verification</h3><p>' + esc(rec.verification_note || '') + '</p></div>'
      : rec.verification_note ? '<p class="enf-sub enf-quiet">' + esc(rec.verification_note) + '</p>' : '') +

    (srcs ? '<details class="enf-sources"><summary>Sources (' + (rec.sources || []).length + ')</summary><ul>' + srcs + '</ul></details>' : '') +

    '<div class="enf-verified">' + esc(rec.id) + ' · verified ' +
      (rec.last_verified ? esc(F.humanDate(rec.last_verified)) : '<span class="enf-unknown">never</span>') + '</div>' +
    '</article>';
}

/* ---------------------------------------------------------- aggregates */

function summaryHTML(list) {
  const a = aggregate(list, IX);
  const payStage = a.byStage['stage:payment'];
  const behStage = a.byStage['stage:behaviour'];

  const line = (label, value, caveat) =>
    '<div class="agg"><span class="agg-n">' + value + '</span>' +
    '<span class="agg-l">' + esc(label) + '</span>' +
    (caveat ? '<span class="agg-c">' + caveat + '</span>' : '') + '</div>';

  return '<section class="enf-summary" aria-label="Aggregates">' +
    line('records', a.count, esc(a.fined + ' carry a fine amount')) +
    line('announced', esc(eur(a.announcedEur)),
      a.announcedUnknownAmount
        ? esc(a.announcedUnknownAmount + ' further action' + (a.announcedUnknownAmount === 1 ? '' : 's') + ' with no amount recorded')
        : 'across the records that state one') +
    line('demonstrably collected',
      a.paidEur ? esc(eur(a.paidEur)) : '<span class="agg-unknown">unknown</span>',
      '<b>' + a.paymentUnknown + ' of ' + a.count + '</b> records cannot settle whether money moved. ' +
      'That is not zero, and this figure is not a total.') +
    line('reached a decision', payStage ? a.byStage['stage:decision'].reached : 0,
      esc(a.byStage['stage:decision'].notReached + ' did not; ' + a.byStage['stage:decision'].unknown + ' unknown')) +
    line('became final', a.byStage['stage:final'].reached,
      esc(a.byStage['stage:final'].notReached + ' did not; ' + a.byStage['stage:final'].unknown + ' unknown')) +
    line('documented behavioural change', behStage.reached,
      '<b>' + behStage.unknown + '</b> unknown — the least evidenced stage in the pipeline') +
    '</section>';
}

/* ---------------------------------------------------------- funnel */

function funnelHTML(list) {
  const a = aggregate(list, IX);
  const max = a.count || 1;
  return '<section class="funnel" aria-label="How far enforcement actually travels">' +
    '<h2>Law on paper to behavioural change</h2>' +
    '<p class="funnel-lede">Each bar is the number of records in the current view that demonstrably ' +
      'reached that stage. The pale segment is what the records cannot settle. <b>It is not zero, and it ' +
      'is not counted as failure — it is the measure of what is not public.</b></p>' +
    STAGES.map((s) => {
      const b = a.byStage[s.id];
      const pct = (x) => (x / max * 100).toFixed(1) + '%';
      return '<div class="fn-row">' +
        '<span class="fn-label">' + esc(taxLabel(IX, s.id)) + '</span>' +
        '<span class="fn-bar">' +
          '<span class="fn-seg reached" style="width:' + pct(b.reached) + '" title="' + b.reached + ' reached"></span>' +
          '<span class="fn-seg unknown" style="width:' + pct(b.unknown) + '" title="' + b.unknown + ' unknown"></span>' +
          '<span class="fn-seg na" style="width:' + pct(b.na) + '" title="' + b.na + ' not applicable"></span>' +
        '</span>' +
        '<span class="fn-n">' + b.reached + '<span class="fn-u"> · ' + b.unknown + ' unknown</span></span>' +
        '</div>';
    }).join('') +
    '</section>';
}

/* ---------------------------------------------------------- controls */

function controls() {
  const uniq = (fn) => [...new Set(RECORDS.map(fn).filter(Boolean))];
  const opt = (v, l, sel) => '<option value="' + esc(v) + '"' + (sel === v ? ' selected' : '') + '>' + esc(l) + '</option>';
  const instOpts = uniq((r) => r.instrument).sort()
    .map((i) => opt(i, (IX.instrument.get(i) || {}).short_name || i, filters.instrument)).join('');
  const authOpts = uniq((r) => r.authority).sort()
    .map((i) => opt(i, (IX.institution.get(i) || {}).short_name || i, filters.authority)).join('');
  const actOpts = uniq((r) => r.action_status).sort()
    .map((i) => opt(i, taxLabel(IX, i), filters.action)).join('');
  const payOpts = uniq((r) => r.payment_status).sort()
    .map((i) => opt(i, taxLabel(IX, i), filters.payment)).join('');

  document.getElementById('enfControls').innerHTML =
    '<span class="flt"><label for="f-i">Instrument</label><select id="f-i">' + opt('', 'All', filters.instrument) + instOpts + '</select></span>' +
    '<span class="flt"><label for="f-a">Authority</label><select id="f-a">' + opt('', 'All', filters.authority) + authOpts + '</select></span>' +
    '<span class="flt"><label for="f-s">Action status</label><select id="f-s">' + opt('', 'All', filters.action) + actOpts + '</select></span>' +
    '<span class="flt"><label for="f-p">Payment</label><select id="f-p">' + opt('', 'All', filters.payment) + payOpts + '</select></span>' +
    '<span class="flt"><label for="f-t">Reached stage</label><select id="f-t">' + opt('', 'Any', filters.stage) +
      STAGES.map((s) => opt(s.id, taxLabel(IX, s.id), filters.stage)).join('') + '</select></span>' +
    '<span class="enf-count" role="status"></span>';
}

function match(rec) {
  if (filters.instrument && rec.instrument !== filters.instrument) return false;
  if (filters.authority && rec.authority !== filters.authority) return false;
  if (filters.action && rec.action_status !== filters.action) return false;
  if (filters.payment && rec.payment_status !== filters.payment) return false;
  if (filters.stage) {
    const st = derive(rec, IX).find((s) => s.id === filters.stage);
    if (!st || st.state !== 'state:reached') return false;
  }
  return true;
}

function render() {
  const list = RECORDS.filter(match)
    .sort((a, b) => String(b.decision_date || '').localeCompare(String(a.decision_date || '')));
  document.getElementById('enfSummary').innerHTML = summaryHTML(list);
  document.getElementById('enfFunnel').innerHTML = funnelHTML(list);
  document.getElementById('enfList').innerHTML = list.length
    ? list.map(recordHTML).join('')
    : '<p class="enf-empty">No records match this filter.</p>';
  const c = document.querySelector('.enf-count');
  if (c) c.textContent = list.length + ' of ' + RECORDS.length + ' records';
}

/* ---------------------------------------------------------- boot */

/* ------------------------------------------------------------------
   Arriving from a search result. The record the link names may be
   hidden by whatever filters are set, so the filters are cleared
   first — a link that silently lands on nothing is worse than no
   link. The record is then revealed and focused, not merely
   scrolled to, so a keyboard reader arrives where the sighted
   reader's eye does.
   ------------------------------------------------------------------ */
function focusFromHash() {
  const id = decodeURIComponent(String(location.hash || '').slice(1));
  if (!id) return;
  if (!RECORDS.some((r) => r.id === id)) return;
  const anyFilter = Object.values(filters).some(Boolean);
  if (anyFilter) {
    for (const k of Object.keys(filters)) filters[k] = '';
    const host = document.getElementById('enfControls');
    if (host) for (const sel of host.querySelectorAll('select')) sel.value = '';
    render();
  }
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('tabindex', '-1');
  el.scrollIntoView({ block: 'start' });
  el.focus({ preventScroll: true });
  el.classList.add('enf-lit');
  setTimeout(() => el.classList.remove('enf-lit'), 1800);
}

(async function boot() {
  const host = document.getElementById('enfList');
  try {
    const db = await loadAll(['taxonomy', 'instruments', 'institutions', 'sources', 'claims', 'timeline', 'enforcement']);
    IX = index(db);
    RECORDS = db.enforcement.enforcement || [];
    const st = document.getElementById('enfStats');
    if (st) {
      const withFine = RECORDS.filter((r) => r.fine_eur != null).length;
      const unknownPay = RECORDS.filter((r) => !r.payment_status || r.payment_status === 'payment:unknown').length;
      const authorities = new Set(RECORDS.map((r) => r.authority)).size;
      st.innerHTML =
        '<span><b>' + RECORDS.length + '</b> records</span>' +
        '<span><b>' + withFine + '</b> with a stated amount</span>' +
        '<span><b>' + authorities + '</b> authorities</span>' +
        '<span><b>' + unknownPay + '</b> where payment cannot be established</span>';
    }
    controls();
    render();
    focusFromHash();
    window.addEventListener('hashchange', focusFromHash);
    document.getElementById('enfControls').addEventListener('change', (e) => {
      const map = { 'f-i': 'instrument', 'f-a': 'authority', 'f-s': 'action', 'f-p': 'payment', 'f-t': 'stage' };
      if (!map[e.target.id]) return;
      filters[map[e.target.id]] = e.target.value;
      render();
    });
    document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('.pipe-stage');
      if (!b) return;
      const d = document.getElementById(b.getAttribute('aria-controls'));
      if (!d) return;
      const open = d.hidden;
      for (const other of b.closest('.enf-rec').querySelectorAll('.pipe-detail')) other.hidden = true;
      for (const other of b.closest('.enf-rec').querySelectorAll('.pipe-stage')) other.setAttribute('aria-expanded', 'false');
      d.hidden = !open;
      b.setAttribute('aria-expanded', String(open));
    });
  } catch (e) {
    renderError(host, e, () => location.reload());
    console.error('[enforcement]', e);
  }
})();
