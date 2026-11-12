/* ============================================================
   State of play.

   The front door used to be a full screen of symbol: a Tree of Life,
   a line about thirteen vessels, and a button reading "Begin at Keter".
   Nothing above the fold said what the rulebook was doing. For a brief
   whose entire argument is that announced and applicable and collected
   are different things, that was the wrong first sentence.

   This renders the current state from the canonical records. Three
   readings, in the order a reader needs them:

     1. Where the instruments stand — the core and the adjacent ones, as
        a band per status, not a single count. The project's first rule is that entry into force
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
import { actionsOnly, finesFigure } from './pipeline.js';
import { instrumentsByStatus, STATUS_ORDER } from './regulatory-model.js';
import { href as siteHref } from './routes.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The words for the bands. WHICH bands exist, their order and every count
   come from js/regulatory-model.js instrumentsByStatus() (F-A7, MC-2): this
   module counts nothing. A status with no entry here is still shown, under
   its taxonomy label and note — never as "no status recorded". Each entry
   carries the sentence that keeps it apart from its neighbours: this
   masthead is also where a first-time reader learns the distinction. */
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
  { id: 'status:transposition-overdue',
    short: 'Transposition overdue',
    gloss: 'A directive past its deadline: the date that binds you is still national, and some Member States are late.' },
  { id: 'status:stalled',
    short: 'Not law',
    gloss: 'In the process, with no path forward at the recorded date.' },
  { id: 'status:proposal',
    short: 'Proposal',
    gloss: 'Published by the Commission. Creates no obligations.' },
];

const BAND_TEXT = new Map(BANDS.map((b) => [b.id, b]));
const bandOf = (ix, id) => BAND_TEXT.get(id) || { id, short: taxLabel(ix, id), gloss: taxNote(ix, id) || '' };
/** the non-empty parts of the figure, in its own order */
const liveBands = (ix, fig) => STATUS_ORDER.filter((id) => fig.parts[id].records.length)
  .map((id) => ({ b: bandOf(ix, id), list: fig.parts[id].records.map((r) => ix.instrument.get(r)).filter(Boolean) }));

const DAY = 86400000;

/* ONE stated date for every deadline view on this page (F-15;
   docs/DATA-READINESS.md F-A10). It used to be read three times: the
   filters took the UTC day and daysUntil() took the reader's LOCAL
   midnight, so east of UTC, just after midnight, an event dated
   "yesterday" in UTC passed the filter and printed "in -1 days". It is
   now taken once, as the UTC calendar day — the same day js/format.js
   isPast() and js/pipeline.js use — passed to each view, and printed. */
const statedDay = () => new Date().toISOString().slice(0, 10);

function daysUntil(iso, asOf) {
  const a = Date.parse(asOf + 'T00:00:00Z');
  const d = Date.parse(String(iso).slice(0, 10) + 'T00:00:00Z');
  if (isNaN(a) || isNaN(d)) return null;
  return Math.round((d - a) / DAY);
}

/* ---------------------------------------------------------- 1. status bands */

function statusLedger(ix, fig) {
  /* the core and adjacent instruments (the author's decision of 9 Nov 2026,
     docs/ROADMAP-v2.md §8): the adjacent ones are mapped and profiled here,
     so they have a status a reader may need; the referenced and out-of-scope
     ones are cited, not covered, and are not counted */
  const live = liveBands(ix, fig);
  const total = fig.population;
  const core = fig.by_scope['scope:core'].length;
  const adjacent = fig.by_scope['scope:adjacent'].length;
  const adjNote = taxNote(ix, 'scope:adjacent');

  const bar = live.map(({ b, list }) => {
    const n = list.length;
    return '<span class="sop-seg" data-s="' + esc(b.id.split(':').pop()) + '"' +
      ' data-flex="' + n + '"' +
      ' title="' + esc(n + ' — ' + b.short + '. ' + b.gloss) + '"></span>';
  }).join('');

  const rows = live.map(({ b, list }) => {
    return '<li class="sop-band" data-s="' + esc(b.id.split(':').pop()) + '">' +
      '<span class="sb-n">' + list.length + '</span>' +
      '<span class="sb-body">' +
        '<span class="sb-label">' + esc(b.short) + '</span>' +
        '<span class="sb-which">' + list.map((i) =>
          '<a href="' + esc(siteHref('instruments.html#' + i.id)) + '"' +
            (i.scope_class === 'scope:adjacent' ? ' title="' + esc('Adjacent: ' + adjNote) + '"' : '') +
            '>' + esc(i.short_name) + '</a>').join('') + '</span>' +
        '<span class="sb-gloss">' + esc(b.gloss) + '</span>' +
      '</span></li>';
  }).join('');

  return '<section class="sop-block sop-status">' +
    '<h2 class="sop-h">Where the rulebook stands</h2>' +
    '<div class="sop-bar" role="img" aria-label="' +
      esc(live.map(({ b, list }) => list.length + ' ' + b.short).join(', ')) + '">' + bar + '</div>' +
    '<ul class="sop-bands">' + rows + '</ul>' +
    '<p class="sop-foot">' + total + ' instruments: ' + core + ' core and ' + adjacent + ' adjacent' +
      ' (' + esc(adjNote.charAt(0).toLowerCase() + adjNote.slice(1).replace(/\.$/, '')) + ')' +
      (fig.unmapped.length ? ' · <span class="sop-unknown">' + fig.unmapped.length +
        ' with a status outside the vocabulary</span>' : '') +
      ' · entry into force is not application, and neither is transposition.</p>' +
    '</section>';
}

/* ---------------------------------------------------------- 2. what falls due */

function nextDue(ix, howMany, asOf) {
  const today = asOf;
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
    const n = daysUntil(e.date, asOf);
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
    '<p class="sop-foot">Days are counted from ' + esc(F.humanDate(asOf, 'precision:day')) + ' (UTC).</p>' +
    '<a class="sop-more" href="#annex-a">The full compliance calendar →</a>' +
    '</section>';
}

/* ---------------------------------------------------------- 3. enforcement */

function enforcementLine(ix, records) {
  /* one computing function (js/pipeline.js finesFigure, MC-2): the sum, the
     payment states and "unknown is never zero" have one home. This view only
     words them. Collected is a figure only when every input's payment state
     is known; otherwise it is unknown, whatever a few records show. */
  const fig = finesFigure(records);
  const announced = fig.announced.eur;
  const unknownPay = fig.collected.unknown.length + fig.collected.not_researched.length + fig.collected.unmapped.length;
  const collectedKnown = fig.collected.state === 'determined';

  /* Set as a sentence with the figures raised out of it, rather than as two
     matching cells under two matching labels. The claim is the point; the
     numbers are evidence inside it. */
  return '<section class="sop-block sop-enf">' +
    '<p class="enf-claim">' +
      '<span class="ec-fig' + (announced === null ? ' unknown' : '') + '">' + (announced === null ? 'not determinable' : esc(F.eur(announced))) + '</span> ' +
      'has been <span class="ec-word">announced</span> in fines across ' +
      fig.fined + ' of ' + fig.population + ' recorded actions. ' +
      'What has demonstrably reached a treasury is ' +
      '<span class="ec-fig' + (collectedKnown ? '' : ' unknown') + '">' +
        (collectedKnown ? esc(F.eur(fig.collected.eur)) : 'unknown') + '</span>.' +
    '</p>' +
    '<p class="enf-gloss">' + unknownPay + ' of ' + fig.population +
      ' records cannot settle whether money moved. That is not zero, and the ' +
      'distance between those two figures is this brief’s subject rather than ' +
      'a rounding error.</p>' +
    '<a class="sop-more" href="' + esc(siteHref('enforcement.html')) + '">The enforcement observatory →</a>' +
    '</section>';
}

/* ---------------------------------------------------------- 0. the ticker

   One line of fact under the title, so that the first thing on the page
   after the frontispiece is the state of the rulebook rather than another
   invitation to scroll. It says the same things as the ledger below in the
   space of a sentence. */

function ticker(ix, fig, asOf) {
  const byStatus = liveBands(ix, fig).map(({ b, list }) => ({ b, n: list.length }));

  const today = asOf;
  const next = [...ix.event.values()]
    .filter((e) => String(e.date) >= today)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];

  const counts = byStatus.map(({ b, n }) =>
    '<span class="tk-item" data-s="' + esc(b.id.split(':').pop()) + '">' +
      '<b>' + n + '</b> ' + esc(b.short.toLowerCase()) + '</span>').join('');

  const nextInst = next ? ix.instrument.get(next.instrument) : null;
  const nd = next ? daysUntil(next.date, asOf) : null;

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

/* ---------------------------------------------------------- 4. when checked

   When the records above were last checked against their sources. This used
   to print a file's $last_verified as "Records verified …", into a
   `.portal-head` that no page has, so it never rendered; and a file-level date
   is the wrong fact anyway, because a file's $last_verified is deliberately
   not moved when only some of its records are re-read. The per-record dates
   are the evidence, so the line gives their range and says plainly that the
   newest date is not a re-check of every record. */

function checkedLine(...sets) {
  const dates = sets.flat()
    .map((r) => String(r.last_verified || ''))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
  if (!dates.length) return '';
  const day = (d) => esc(F.humanDate(d, 'precision:day'));
  return '<p class="sop-foot sop-checked">Instrument, calendar and enforcement records were last checked ' +
    'against their sources between ' + day(dates[0]) + ' and ' + day(dates[dates.length - 1]) +
    '. The newest date is not a re-check of every record: each record shows its own.</p>';
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
  const asOf = statedDay();
  const instruments = db.instruments.instruments || [];
  /* the one computing function (F-A7, MC-2): both views below read this */
  const byStatus = instrumentsByStatus(instruments);
  const records = db.enforcement.enforcement || [];

  mount.innerHTML =
    statusLedger(ix, byStatus) +
    nextDue(ix, 3, asOf) +
    /* a recorded absence of action is not an action and is counted nowhere */
    enforcementLine(ix, actionsOnly(records)) +
    checkedLine(instruments, [...ix.event.values()], records);
  F.applyGeometry(mount);

  const tick = document.querySelector('[data-mount="sop-ticker"]');
  if (tick) tick.innerHTML = ticker(ix, byStatus, asOf);

  document.dispatchEvent(new CustomEvent('masthead:ready', {
    detail: { instruments: instruments.length, events: ix.event.size, records: records.length }
  }));
  return instruments.length;
}
