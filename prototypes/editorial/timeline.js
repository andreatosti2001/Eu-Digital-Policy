/* PV2-03 · view 4 of 4: the analytical view is the timeline (roadmap §8,
   "PV2-03, C.1 question 3"), read in place from data/timeline.json, followed
   by the relationships between instruments as a non-interactive table.
   The only control is a plain GET form that narrows the timeline to one
   instrument or one status; with no match it says so, and names what was
   asked. It does not touch the relationships table. */

import { boot, esc, F, label, notRecorded, tag, dateText, instrumentLink, instrumentName, fillToc } from './common.js';
import { relationsTable } from './relations.js';

const NEEDED = ['taxonomy', 'instruments', 'timeline', 'claims', 'sources'];

function filterForm(ix, events, q) {
  const withEvents = new Set(events.map((e) => e.instrument));
  const insts = [...new Set(ix.instrument.values())].sort((a, b) => a.short_name.localeCompare(b.short_name));
  const opt = (v, text, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(text)}</option>`;
  return `<form class="filter" method="get" action="timeline.html" aria-label="Narrow the timeline">
    <label>Instrument<select name="instrument">${opt('', 'All instruments', !q.instrument)}${insts.map((i) =>
      opt(i.id, i.short_name + (withEvents.has(i.id) ? '' : ' (no dated event)'), q.instrument === i.id)).join('')}</select></label>
    <label>Status<select name="status">${opt('', 'Occurred and scheduled', !q.status)}${opt('occurred', 'Occurred', q.status === 'occurred')}${opt('scheduled', 'Scheduled', q.status === 'scheduled')}</select></label>
    <button type="submit">Show</button>
    ${q.instrument || q.status ? '<a href="timeline.html">Show everything</a>' : ''}
  </form>`;
}

function eventItem(ix, e) {
  const scheduled = e.status === 'scheduled';
  return `<li id="${esc(e.id)}" class="${scheduled ? 'scheduled' : ''}">
    <span class="when">${dateText(e.date, e.date_precision)}</span>
    <span class="head">${instrumentLink(ix, e.instrument)} ${e.event_type ? tag(label(ix, e.event_type)) : notRecorded('type not recorded')}
      ${e.status ? tag(scheduled ? 'Scheduled' : 'Occurred', scheduled ? '' : 'ok') : notRecorded('status not recorded')}
      ${e.requires_verification ? tag('Unverified', 'warn') : ''}</span>
    ${e.obligation ? `<p>${esc(e.obligation)}</p>` : '' /* null on adoption, publication, entry into force: the type above says what happened (as js/status.js does) */}
    ${e.supersedes ? `<p class="meta">${esc(e.supersedes)}</p>` : ''}
  </li>`;
}

function byYear(ix, events) {
  const years = new Map();
  for (const e of events) {
    const y = String(e.date || '').slice(0, 4) || 'undated';
    if (!years.has(y)) years.set(y, []);
    years.get(y).push(e);
  }
  return [...years].map(([y, list]) => `<h3 class="year" id="y-${esc(y)}">${y === 'undated' ? notRecorded('date not recorded') : esc(y)}</h3>
    <ol class="tl">${list.map((e) => eventItem(ix, e)).join('')}</ol>`).join('');
}

boot(NEEDED, (db, ix, mount) => {
  const params = new URLSearchParams(location.search);
  const q = { instrument: params.get('instrument') || '', status: params.get('status') || '' };
  const all = [...ix.event.values()].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  const shown = all.filter((e) => (!q.instrument || e.instrument === q.instrument) && (!q.status || e.status === q.status));

  const occurred = all.filter((e) => e.status === 'occurred').length;
  const scheduled = all.filter((e) => e.status === 'scheduled').length;
  const noStatus = all.length - occurred - scheduled;
  const monthOnly = all.filter((e) => String(e.date_precision).endsWith('month')).length;

  const asked = [q.instrument ? (instrumentName(ix, q.instrument) || q.instrument) : null, q.status || null].filter(Boolean).join(', ');
  const listing = shown.length
    ? `<p class="meta">${q.instrument || q.status ? `Showing ${esc(F.plural(shown.length, 'event'))} for ${esc(asked)}.` : `Showing all ${esc(F.plural(shown.length, 'event'))}.`} A filled dot has occurred; a ring is scheduled.</p>${byYear(ix, shown)}`
    : `<p class="empty"><b>No dated event is recorded for ${esc(asked)}</b> in <code>data/timeline.json</code>. That is the state of the record, not a statement that nothing has happened or will.${q.instrument && ix.instrument.get(q.instrument) ? ` See <a href="regulation.html?id=${encodeURIComponent(q.instrument)}">the record of ${esc(instrumentName(ix, q.instrument))}</a>.` : ''}</p>`;

  mount.innerHTML = `
    <p class="kicker">The record over time</p>
    <h1>Timeline</h1>
    <p class="lede">Every dated legal event the site records — adoption, entry into force, application, deadlines, decisions — and, after it, every relationship recorded between the instruments.</p>
    <p class="measure">${esc(F.plural(all.length, 'event'))}: ${occurred} occurred, ${scheduled} scheduled${noStatus ? `, ${notRecorded(noStatus + ' with no status')}` : ''}. ${monthOnly ? `${monthOnly} are dated to the month and shown that way: their day is not established.` : ''}</p>
    <nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h">On this page</h2><ol></ol></nav>
    <h2 id="events">Dated events</h2>
    ${filterForm(ix, all, q)}
    ${listing}
    <h2 id="relationships">Relationships between instruments</h2>
    <p class="measure">The same relationships the other directions draw as a network, here as one fixed table. A type is the record's own; a direction appears only where the relationship has one; a field the record does not hold is marked as not recorded.</p>
    ${relationsTable(ix)}`;
  fillToc(mount, mount.querySelector('.toc'));
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
});
