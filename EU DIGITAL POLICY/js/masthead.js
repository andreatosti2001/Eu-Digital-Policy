/* ============================================================
   State of play.

   The front door used to be a full screen of symbol: a Tree of Life,
   a line about thirteen vessels, and a button reading "Begin at Keter".
   Nothing above the fold said what the rulebook was doing. For a brief
   whose entire argument is that announced and applicable and collected
   are different things, that was the wrong first sentence.

   This renders the current state from the canonical records. Three
   readings, in the order a reader needs them:

     1. Where the core instruments stand — as a band per status, not a
        single count. The project's first rule is that entry into force
        is not application; a masthead that said "14 in force" would
        contradict the brief on its own front page.

     2. What falls due next — the soonest upcoming events from the
        timeline, with the distance in days computed at render.

     3. What enforcement has produced — announced against demonstrably
        collected, with the gap named rather than smoothed over.

   Nothing here is typed. Every number is derived, and where the record
   cannot support a figure it says so.
   ============================================================ */

import { loadAll, index, label as taxLabel, note as taxNote, renderError } from './data.js';
import * as F from './format.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The bands, in the order the obligations actually bite. Each carries the
   sentence that keeps it apart from its neighbours — this masthead is also
   where a first-time reader learns the distinction. */
const BANDS = [
  { id: 'status:applicable',
    short: 'Applicable',
    gloss: 'Obligations bite in full.' },
  { id: 'status:partly-applicable',
    short: 'Partly applicable',
    gloss: 'Some tranches apply and others do not yet.' },
  { id: 'status:in-force',
    short: 'In force',
    gloss: 'Binding law, but not yet fully applicable.' },
  { id: 'status:transposition-pending',
    short: 'Awaiting transposition',
    gloss: 'A directive: the date that binds you is national, not European.' },
  { id: 'status:stalled',
    short: 'Not law',
    gloss: 'In the process, with no path forward at the recorded date.' },
  { id: 'status:proposal',
    short: 'Proposal',
    gloss: 'Published by the Commission. Creates no obligations.' },
];

const DAY = 86400000;

function daysUntil(iso) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  if (isNaN(d)) return null;
  return Math.round((d - today) / DAY);
}

/* ---------------------------------------------------------- 1. status bands */

function statusLedger(ix, instruments) {
  /* the core set is the brief's actual subject; referenced and adjacent
     instruments are cited, not covered, and counting them would inflate this */
  const core = instruments.filter((i) => i.scope_class === 'scope:core');
  const counted = new Map();
  for (const b of BANDS) counted.set(b.id, []);
  const unrecorded = [];
  for (const i of core) {
    if (counted.has(i.legislative_status)) counted.get(i.legislative_status).push(i);
    else unrecorded.push(i);
  }

  const live = BANDS.filter((b) => counted.get(b.id).length);
  const total = core.length;

  const bar = live.map((b) => {
    const n = counted.get(b.id).length;
    return '<span class="sop-seg" data-s="' + esc(b.id.split(':').pop()) + '"' +
      ' style="flex:' + n + '"' +
      ' title="' + esc(n + ' — ' + b.short + '. ' + b.gloss) + '"></span>';
  }).join('');

  const rows = live.map((b) => {
    const list = counted.get(b.id);
    return '<li class="sop-band" data-s="' + esc(b.id.split(':').pop()) + '">' +
      '<span class="sb-n">' + list.length + '</span>' +
      '<span class="sb-body">' +
        '<span class="sb-label">' + esc(b.short) + '</span>' +
        '<span class="sb-which">' + list.map((i) =>
          '<a href="instruments.html#' + esc(i.id) + '">' + esc(i.short_name) + '</a>').join('') + '</span>' +
        '<span class="sb-gloss">' + esc(b.gloss) + '</span>' +
      '</span></li>';
  }).join('');

  return '<section class="sop-block sop-status">' +
    '<h2 class="sop-h">Where the core rulebook stands</h2>' +
    '<div class="sop-bar" role="img" aria-label="' +
      esc(live.map((b) => counted.get(b.id).length + ' ' + b.short).join(', ')) + '">' + bar + '</div>' +
    '<ul class="sop-bands">' + rows + '</ul>' +
    '<p class="sop-foot">' + total + ' core instruments' +
      (unrecorded.length ? ' · <span class="sop-unknown">' + unrecorded.length +
        ' with no status recorded</span>' : '') +
      ' · entry into force is not application, and neither is transposition.</p>' +
    '</section>';
}

/* ---------------------------------------------------------- 2. what falls due */

function nextDue(ix, howMany) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...ix.event.values()]
    .filter((e) => String(e.date) >= today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(0, howMany);

  if (!upcoming.length) {
    return '<section class="sop-block sop-due">' +
      '<h2 class="sop-h">What falls due next</h2>' +
      '<p class="sop-empty">No future-dated event is recorded in the timeline.</p></section>';
  }

  const rows = upcoming.map((e) => {
    const inst = ix.instrument.get(e.instrument);
    const n = daysUntil(e.date);
    const away = n == null ? '' : n === 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + ' days';
    const approx = e.date_precision && e.date_precision !== 'precision:day';
    return '<li class="sop-due-row">' +
      '<span class="sd-when">' +
        '<b>' + esc(F.humanDate(e.date, e.date_precision)) + '</b>' +
        (away ? '<span class="sd-away' + (approx ? ' approx' : '') + '">' +
          (approx ? '≈ ' : '') + esc(away) + '</span>' : '') +
      '</span>' +
      '<span class="sd-what">' +
        '<span class="sd-inst">' + esc(inst ? inst.short_name : e.instrument) + '</span>' +
        '<span class="sd-type" data-e="' + esc(String(e.event_type).split(':').pop()) + '">' +
          esc(taxLabel(ix, e.event_type)) + '</span>' +
        '<span class="sd-obl">' + esc(e.obligation || taxNote(ix, e.event_type) || '') + '</span>' +
      '</span></li>';
  }).join('');

  return '<section class="sop-block sop-due">' +
    '<h2 class="sop-h sop-h-rubric">What falls due next</h2>' +
    '<ol class="sop-due-list">' + rows + '</ol>' +
    '<a class="sop-more" href="#annex-a">The full compliance calendar →</a>' +
    '</section>';
}

/* ---------------------------------------------------------- 3. enforcement */

function enforcementLine(ix, records) {
  const withFine = records.filter((r) => r.fine_eur != null);
  const announced = withFine.reduce((a, r) => a + r.fine_eur, 0);

  /* collected is a different fact from imposed, and most records cannot
     settle it — the figure that would be wrong here is zero */
  const collected = records.filter((r) =>
    r.payment_status === 'payment:collected' || r.payment_status === 'payment:paid');
  const unknownPay = records.filter((r) =>
    !r.payment_status || r.payment_status === 'payment:unknown').length;
  const collectedEur = collected.reduce((a, r) => a + (r.fine_eur || 0), 0);

  /* Set as a sentence with the figures raised out of it, rather than as two
     matching cells under two matching labels. The claim is the point; the
     numbers are evidence inside it. */
  return '<section class="sop-block sop-enf">' +
    '<p class="enf-claim">' +
      '<span class="ec-fig">' + esc(F.eur(announced)) + '</span> ' +
      'has been <span class="ec-word">announced</span> in fines across ' +
      withFine.length + ' of ' + records.length + ' recorded actions. ' +
      'What has demonstrably reached a treasury is ' +
      '<span class="ec-fig' + (collected.length ? '' : ' unknown') + '">' +
        (collected.length ? esc(F.eur(collectedEur)) : 'unknown') + '</span>.' +
    '</p>' +
    '<p class="enf-gloss">' + unknownPay + ' of ' + records.length +
      ' records cannot settle whether money moved. That is not zero, and the ' +
      'distance between those two figures is this brief’s subject rather than ' +
      'a rounding error.</p>' +
    '<a class="sop-more" href="enforcement.html">The enforcement observatory →</a>' +
    '</section>';
}

/* ---------------------------------------------------------- 0. the ticker

   One line of fact under the title, so that the first thing on the page
   after the frontispiece is the state of the rulebook rather than another
   invitation to scroll. It says the same things as the ledger below in the
   space of a sentence. */

function ticker(ix, instruments, records) {
  const core = instruments.filter((i) => i.scope_class === 'scope:core');
  const byStatus = BANDS.map((b) => ({
    b, n: core.filter((i) => i.legislative_status === b.id).length
  })).filter((x) => x.n);

  const today = new Date().toISOString().slice(0, 10);
  const next = [...ix.event.values()]
    .filter((e) => String(e.date) >= today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];

  const counts = byStatus.map(({ b, n }) =>
    '<span class="tk-item" data-s="' + esc(b.id.split(':').pop()) + '">' +
      '<b>' + n + '</b> ' + esc(b.short.toLowerCase()) + '</span>').join('');

  const nextInst = next ? ix.instrument.get(next.instrument) : null;
  const nd = next ? daysUntil(next.date) : null;

  return counts +
    (next
      ? '<span class="tk-sep" aria-hidden="true"></span>' +
        '<span class="tk-next"><span class="tk-k">next</span> ' +
          '<b>' + esc(F.humanDate(next.date, next.date_precision)) + '</b> ' +
          esc(nextInst ? nextInst.short_name : next.instrument) +
          (nd != null && nd >= 0 ? ' <i>' + (nd === 0 ? 'today' : nd === 1 ? 'tomorrow' : nd + ' days') + '</i>' : '') +
        '</span>'
      : '');
}

/* ---------------------------------------------------------- mount */

export async function initMasthead() {
  const mount = document.querySelector('[data-mount="state-of-play"]');
  if (!mount) return 0;

  let db;
  try {
    db = await loadAll(['taxonomy', 'instruments', 'timeline', 'enforcement']);
  } catch (e) {
    /* §42: say so plainly and substitute nothing. The masthead is the one
       place a fabricated number would do the most damage. */
    renderError(mount, e, () => initMasthead());
    return 0;
  }

  const ix = index(db);
  const instruments = db.instruments.instruments || [];
  const records = db.enforcement.enforcement || [];

  mount.innerHTML =
    statusLedger(ix, instruments) +
    nextDue(ix, 3) +
    enforcementLine(ix, records);

  const tick = document.querySelector('[data-mount="sop-ticker"]');
  if (tick) tick.innerHTML = ticker(ix, instruments, records);

  /* Two dates, and they are not the same fact: the dateline is the document's
     own state-of-play date, the other is when these records were last checked.
     The second is appended as its own element so a translated dateline is not
     disturbed, and it is separated rather than run on to the end of it. */
  const verified = db.instruments.$last_verified || db.timeline.$last_verified;
  const kicker = document.querySelector('.portal-head .hero-kicker');
  if (verified && kicker && !kicker.parentNode.querySelector('.sop-verified')) {
    const s = document.createElement('span');
    s.className = 'sop-verified';
    s.textContent = 'Records verified ' + F.humanDate(verified, 'precision:day');
    kicker.parentNode.insertBefore(s, kicker.nextSibling);
  }

  document.dispatchEvent(new CustomEvent('masthead:ready', {
    detail: { instruments: instruments.length, events: ix.event.size, records: records.length }
  }));
  return instruments.length;
}
