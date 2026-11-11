/* PV2-04 · view 4 of 4: the analytical view (roadmap §8, "PV2-03, C.1
   question 3": the timeline), with two modes reached by real links:
   - Timeline: cards, a chart of events by year beside its table, and every
     dated event in one captioned table — sortable from the keyboard, its
     header sticky, filterable by instrument, status and type, stacked on a
     phone; with no match it says so and names what was asked.
   - Network: the Regulatory Network Explorer (explorer.js), with the
     relationships table of the Editorial as its accessible alternative,
     following the explorer's filter and selection. */

import {
  boot, esc, F, label, notRecorded, tag, dateText, instrumentLink, instrumentName, section, empty, card,
  sortableTable, wireSort, chartWithTable, TODAY, yearBefore,
} from './common.js';
import { mountExplorer } from './explorer.js';

const NEEDED = ['taxonomy', 'instruments', 'timeline', 'claims', 'sources', 'brief'];

function modes(mode) {
  return `<nav class="modes" aria-label="Modes of the analytical view">
    <a href="timeline.html"${mode === 'timeline' ? ' aria-current="page"' : ''}>Timeline</a>
    <a href="timeline.html?mode=network"${mode === 'network' ? ' aria-current="page"' : ''}>Network explorer</a>
  </nav>`;
}

/* ---------------------------------------------------------- timeline mode */

function yearChart(events) {
  const years = new Map();
  for (const e of events) {
    const y = String(e.date || '').slice(0, 4) || null;
    if (!years.has(y)) years.set(y, { occurred: 0, scheduled: 0, other: 0, month: 0 });
    const b = years.get(y);
    if (e.status === 'occurred') b.occurred++; else if (e.status === 'scheduled') b.scheduled++; else b.other++;
    if (String(e.date_precision).endsWith('month')) b.month++;
  }
  const list = [...years].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  /* one bar per year: occurred solid, scheduled hatched after it; the numbers are printed and are in the table */
  const W = 300, rowH = 22, lab = 40, top = 26, H = top + list.length * rowH + 6;
  const max = Math.max(1, ...list.map(([, b]) => b.occurred + b.scheduled + b.other));
  const unit = (W - lab - 40) / max;
  const bars = list.map(([y, b], i) => {
    const yy = top + i * rowH;
    const wo = b.occurred * unit, ws = b.scheduled * unit;
    const nums = [b.occurred ? String(b.occurred) : null, b.scheduled ? `+${b.scheduled}` : null].filter(Boolean).join(' ');
    return `<text class="ch-label" x="${lab - 6}" y="${yy + 15}" text-anchor="end">${esc(y ?? 'undated')}</text>` +
      (wo ? `<rect class="ch-bar solid" x="${lab}" y="${yy + 4}" width="${wo.toFixed(1)}" height="${rowH - 8}"/>` : '') +
      (ws ? `<rect class="ch-bar hatch" fill="url(#yr-hatch)" x="${(lab + wo).toFixed(1)}" y="${yy + 4}" width="${ws.toFixed(1)}" height="${rowH - 8}"/>` : '') +
      `<text class="ch-val" x="${(lab + wo + ws + 6).toFixed(1)}" y="${yy + 15}">${esc(nums)}</text>`;
  }).join('');
  const chart = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dated events by year, ${events.length} events: occurred solid, scheduled hatched; the values are in the table beside it">
    <defs><pattern id="yr-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="ch-hatch-bg" width="6" height="6"/><line class="ch-hatch" x1="0" y1="0" x2="0" y2="6"/></pattern></defs>
    <rect class="ch-bar solid" x="${lab}" y="6" width="12" height="11"/><text class="ch-key" x="${lab + 17}" y="15">occurred</text>
    <rect class="ch-bar hatch" fill="url(#yr-hatch)" x="${lab + 90}" y="6" width="12" height="11"/><text class="ch-key" x="${lab + 107}" y="15">scheduled (+)</text>
    ${bars}</svg>`;
  const cols = [{ key: 'y', label: 'Year', sort: 'num' }, { key: 'o', label: 'Occurred', sort: 'num' }, { key: 's', label: 'Scheduled', sort: 'num' }, { key: 'm', label: 'Day not established', sort: 'num' }];
  const table = sortableTable({ id: 'tbl-years', cols, caption: 'Dated events by year. A year with no event of a kind shows 0: every event has a status, so this is a count, not a gap.',
    rows: list.map(([y, b]) => ({ rowHeader: true,
      cells: { y: y ? esc(y) : notRecorded('date not recorded'), o: String(b.occurred), s: String(b.scheduled), m: b.month ? String(b.month) : '0' },
      keys: { y: y ? +y : null, o: b.occurred, s: b.scheduled, m: b.month } })) });
  return { html: chartWithTable('Dated events by year — occurred solid, scheduled hatched; the numbers are in the table', chart, table), cols };
}

const EVENT_COLS = [
  { key: 'date', label: 'Date', sort: 'date' }, { key: 'inst', label: 'Instrument', sort: 'text' },
  { key: 'type', label: 'Event', sort: 'text' }, { key: 'status', label: 'Status', sort: 'text' }, { key: 'what', label: 'Obligation', sort: false },
];

function eventRows(ix, events) {
  return events.map((e) => {
    const scheduled = e.status === 'scheduled';
    return {
      attrs: ` id="${esc(e.id)}" data-inst="${esc(e.instrument)}" data-status="${esc(e.status || '')}" data-type="${esc(e.event_type || '')}"`,
      cells: {
        date: dateText(e.date, e.date_precision),
        inst: instrumentLink(ix, e.instrument),
        type: e.event_type ? esc(label(ix, e.event_type)) : notRecorded('type not recorded'),
        status: (e.status ? tag(scheduled ? 'Scheduled' : 'Occurred', scheduled ? '' : 'ok') : notRecorded('status not recorded')) + (e.requires_verification ? ' ' + tag('Unverified', 'warn') : ''),
        what: e.obligation ? esc(e.obligation) : notRecorded('none recorded'),
      },
      keys: { date: e.date, inst: instrumentName(ix, e.instrument) || e.instrument, type: e.event_type ? label(ix, e.event_type) : null, status: e.status },
    };
  });
}

function filterForm(ix, events, q) {
  const withEvents = new Set(events.map((e) => e.instrument));
  const insts = [...new Set(ix.instrument.values())].sort((a, b) => a.short_name.localeCompare(b.short_name));
  const types = [...new Set(events.map((e) => e.event_type).filter(Boolean))].sort((a, b) => label(ix, a).localeCompare(label(ix, b)));
  const opt = (v, text, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(text)}</option>`;
  return `<form class="filters" method="get" action="timeline.html" id="ev-filter" aria-label="Filter the events">
    <label>Instrument<select name="instrument">${opt('', 'All instruments', !q.instrument)}${insts.map((i) =>
      opt(i.id, i.short_name + (withEvents.has(i.id) ? '' : ' — no dated event'), q.instrument === i.id)).join('')}</select></label>
    <label>Status<select name="status">${opt('', 'Occurred and scheduled', !q.status)}${opt('occurred', 'Occurred', q.status === 'occurred')}${opt('scheduled', 'Scheduled', q.status === 'scheduled')}</select></label>
    <label>Event<select name="type">${opt('', 'Every type', !q.type)}${types.map((t) => opt(t, label(ix, t), q.type === t)).join('')}</select></label>
    <button type="submit">Apply</button>
    <button type="button" id="ev-reset">Clear filters</button>
  </form>`;
}

function timelineMode(db, ix, mount, params) {
  const q = { instrument: params.get('instrument') || '', status: params.get('status') || '', type: params.get('type') || '' };
  const all = [...ix.event.values()].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  const occurred = all.filter((e) => e.status === 'occurred').length;
  const scheduled = all.filter((e) => e.status === 'scheduled').length;
  const monthOnly = all.filter((e) => String(e.date_precision).endsWith('month')).length;
  const since = yearBefore(TODAY);
  const recent = all.filter((e) => e.status === 'occurred' && e.date > since && e.date <= TODAY).length;
  const next = all.find((e) => e.status === 'scheduled' && e.date > TODAY);
  const overdue = all.filter((e) => e.status === 'scheduled' && e.date && e.date <= TODAY).length;
  const years = yearChart(all);

  mount.innerHTML = `
    <header class="head">
      <p class="kicker">Analysis</p>
      <h1>Timeline and network</h1>
      <p class="lede">Every dated legal event the site records — adoption, entry into force, application, deadlines, decisions — and, in the second mode, the relationships recorded between the instruments.</p>
    </header>
    ${modes('timeline')}
    <div class="cards">
      ${card({ label: 'Dated events', value: all.length, change: `+${recent} occurred in the 12 months to ${esc(F.humanDate(TODAY))}` })}
      ${card({ label: 'Occurred', value: occurred })}
      ${card({ label: 'Scheduled', value: scheduled, change: next ? `next: ${esc(F.humanDate(next.date, next.date_precision))}` : null,
        note: overdue ? `${overdue} scheduled on or before today and not yet recorded as occurred` : '' })}
      ${card({ label: 'Dated to the month', value: monthOnly, note: 'the day is not established, and the date says so' })}
    </div>
    ${section('by-year', 'Events by year', years.html)}
    ${section('events', 'Every dated event', `${filterForm(ix, all, q)}<p class="count-line" id="ev-count" aria-live="polite"></p><div id="ev-table">${sortableTable({ id: 'tbl-events', cols: EVENT_COLS, rows: eventRows(ix, all),
      caption: `Dated events, from <code>data/timeline.json</code>. Sort by any column with its header button; filter above. A date known only to the month says so.` })}</div><div id="ev-empty"></div>`)}`;

  wireSort(mount.querySelector('#tbl-years'), years.cols);
  const tbl = mount.querySelector('#tbl-events');
  wireSort(tbl, EVENT_COLS);
  const form = mount.querySelector('#ev-filter');
  const apply = (push) => {
    const fd = new FormData(form);
    const cur = { instrument: fd.get('instrument') || '', status: fd.get('status') || '', type: fd.get('type') || '' };
    let n = 0;
    for (const tr of tbl.tBodies[0].rows) {
      const on = (!cur.instrument || tr.dataset.inst === cur.instrument) && (!cur.status || tr.dataset.status === cur.status) && (!cur.type || tr.dataset.type === cur.type);
      tr.hidden = !on;
      if (on) n++;
    }
    const asked = [cur.instrument ? (instrumentName(ix, cur.instrument) || cur.instrument) : null, cur.status || null, cur.type ? label(ix, cur.type) : null].filter(Boolean).join(', ');
    mount.querySelector('#ev-count').textContent = asked ? `Showing ${F.plural(n, 'event')} of ${all.length} for ${asked}.` : `Showing all ${F.plural(all.length, 'event')}.`;
    mount.querySelector('#ev-table').hidden = n === 0;
    mount.querySelector('#ev-empty').innerHTML = n ? '' : empty(`No dated event is recorded for ${esc(asked)}`,
      `in <code>data/timeline.json</code>. That is the state of the record, not a statement that nothing has happened or will.${cur.instrument && ix.instrument.get(cur.instrument) ? ` See <a href="regulation.html?id=${encodeURIComponent(cur.instrument)}">the record of ${esc(instrumentName(ix, cur.instrument))}</a>.` : ''}`);
    if (push) {
      const u = new URL(location.href);
      for (const [k, v] of Object.entries(cur)) { if (v) u.searchParams.set(k, v); else u.searchParams.delete(k); }
      history.replaceState(null, '', u);
    }
  };
  form.addEventListener('change', () => apply(true));
  form.addEventListener('submit', (ev) => { ev.preventDefault(); apply(true); });
  mount.querySelector('#ev-reset').addEventListener('click', () => { form.reset(); for (const s of form.querySelectorAll('select')) s.value = ''; apply(true); });
  apply(false);
}

/* ---------------------------------------------------------- network mode */

function networkMode(db, ix, mount, params) {
  const focus = params.get('focus');
  mount.innerHTML = `
    <header class="head">
      <p class="kicker">Analysis</p>
      <h1>Timeline and network</h1>
      <p class="lede">The instruments the site records, and the legal relationships recorded between them — only those: no relationship is inferred, and none is drawn from a shared provision or source.</p>
    </header>
    ${modes('network')}
    ${section('explorer', 'Regulatory network explorer', '<div id="explorer-root"></div>')}
    ${section('relationships', 'The same relationships, as a table', '<div id="explorer-table"></div>')}`;
  mountExplorer(mount.querySelector('#explorer-root'), ix, db, {
    focus: focus && ix.instrument.get(focus) ? ix.instrument.get(focus).id : null,
    tableMount: mount.querySelector('#explorer-table'),
  });
}

boot(NEEDED, (db, ix, mount) => {
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode') === 'network' ? 'network' : 'timeline';
  document.title = `${mode === 'network' ? 'Network explorer' : 'Timeline'} · Observatory prototype`;
  if (mode === 'network') networkMode(db, ix, mount, params);
  else timelineMode(db, ix, mount, params);
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
});
