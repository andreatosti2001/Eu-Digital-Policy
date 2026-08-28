/* ============================================================
   Regulatory status.

   A strip at the head of each Part that analyses an instrument,
   stating what that instrument's status actually is and when its
   obligations bite. Entry into force, application, transposition,
   guidance and delegated acts are kept apart — a single scalar
   cannot describe the AI Act, so the milestones are shown too.
   ============================================================ */

import * as F from './format.js';
import { label as taxLabel } from './data.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const KIND_WORD = {
  'kind:regulation': 'Regulation · directly applicable',
  'kind:directive': 'Directive · requires national transposition',
  'kind:proposal': 'Proposal · NOT law',
  'kind:treaty-provision': 'Treaty provision',
  'kind:delegated-regulation': 'Delegated regulation',
  'kind:code-of-practice': 'Code of practice · voluntary',
};

function milestoneRow(ev, ix) {
  const type = String(ev.event_type).split(':').pop();
  const date = F.humanDate(ev.date, ev.date_precision);
  const future = !F.isPast(ev.date);
  const what = ev.obligation || taxLabel(ix, ev.event_type);
  return '<div class="is-m">' +
    '<span class="m-date' + (future ? ' future' : '') + '">' + esc(date) + '</span>' +
    '<span class="m-type" data-e="' + esc(type) + '">' + esc(taxLabel(ix, ev.event_type)) + '</span>' +
    '<span class="m-what">' + esc(what) +
      (ev.requires_verification ? ' <span class="is-unver">unverified</span>' : '') +
    '</span></div>';
}

function transpositionBlock(inst, ix) {
  const t = inst.transposition;
  if (!t) return '';
  const states = Object.entries(t.state || {});
  const listed = states.length
    ? states.map(([ms, st]) => esc(ms.toUpperCase()) + ' ' + esc(taxLabel(ix, st))).join(' · ')
    : 'no per-Member-State position established';
  return '<p class="is-note warn"><b>Transposition is not applicability.</b> ' +
    'Obligations bite at national dates, which vary. ' + esc(listed) + '. ' +
    (t.state_note ? esc(t.state_note) : '') + '</p>';
}

function strip(inst, ix) {
  const s = inst.legislative_status;
  const slug = s ? s.split(':').pop() : 'unknown';
  const events = (inst.milestones || []).map((id) => ix.event.get(id)).filter(Boolean)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const proposalWarning = inst.kind === 'kind:proposal'
    ? '<p class="is-note warn"><b>This is a proposal, not law.</b> ' +
      'It creates no obligations and must not be read as binding.</p>'
    : '';

  return '<section class="instr-status" aria-label="Regulatory status of ' + esc(inst.short_name) + '">' +
    '<div class="is-head">' +
      '<span class="is-name">' + esc(inst.short_name) + '</span>' +
      '<span class="is-kind">' + esc(KIND_WORD[inst.kind] || taxLabel(ix, inst.kind)) + '</span>' +
      '<span class="is-pill" data-s="' + esc(slug) + '">' +
        esc(s ? taxLabel(ix, s) : 'Status not established') + '</span>' +
      (inst.status_as_of ? '<span class="is-asof">as of ' + esc(F.humanDate(inst.status_as_of)) + '</span>' : '') +
    '</div>' +
    proposalWarning +
    (inst.status_note ? '<p class="is-note">' + esc(inst.status_note) + '</p>' : '') +
    transpositionBlock(inst, ix) +
    (events.length ? '<div class="is-mile">' + events.map((e) => milestoneRow(e, ix)).join('') + '</div>' : '') +
    '</section>';
}

export function initStatus(ix) {
  for (const old of document.querySelectorAll('.instr-status')) old.remove();

  const byPart = new Map();
  for (const inst of ix.instrument.values()) {
    if (!inst.brief_part) continue;
    if (!byPart.has(inst.brief_part)) byPart.set(inst.brief_part, new Set());
    byPart.get(inst.brief_part).add(inst);
  }
  for (const [pid, set] of byPart) {
    const body = document.querySelector('#' + pid + ' .part-body');
    if (!body) continue;
    // Only instruments the Part is actually about — core and adjacent, never
    // the treaty articles it merely cites.
    const list = [...set].filter((i) => i.scope_class === 'scope:core' || i.scope_class === 'scope:adjacent');
    if (!list.length) continue;
    list.sort((a, b) => a.short_name.localeCompare(b.short_name));
    const wrap = document.createElement('div');
    wrap.innerHTML = list.map((i) => strip(i, ix)).join('');
    // after the legend if one is there, otherwise at the top of the body
    const legend = body.querySelector('.evi-legend');
    const at = legend ? legend.nextSibling : body.firstChild;
    while (wrap.firstChild) body.insertBefore(wrap.firstChild, at);
  }
}
