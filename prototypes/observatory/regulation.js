/* PV2-04 · view 2 of 4: a regulation's page, data first. The AI Act is the
   view; the Chips Act, whose record holds almost nothing, is its empty state
   (roadmap §8, "PV2-03, C.1 question 1" — the same perimeter). Any id renders
   through the same template. Cards first, then each field as a captioned,
   sortable table; the record's facts in a card on the right. A count of
   nothing recorded is written as such, never as 0. */

import {
  boot, esc, F, label, has, notRecorded, unknown, tag, statusTag, evidenceTag, dateText, instrumentLink,
  provisionText, sourceShort, section, empty, card, sortableTable, wireSort, TODAY,
} from './common.js';
import { relationsTable } from '../editorial/relations.js';
import { finesFigure, actionsOnly } from '../../js/pipeline.js';
import { instrumentHref, siteRoot, coverage } from '../../js/routes.js';

const NEEDED = ['taxonomy', 'instruments', 'timeline', 'claims', 'sources', 'enforcement', 'brief'];
const EXAMPLES = [['ai-act', 'AI Act'], ['chips-act', 'Chips Act (the empty state)']];
const COVERAGE_WORD = { covered: 'Covered — analysed by the site', mapped: 'Mapped — recorded for its links', watched: 'Watched — named, not analysed', excluded: 'Excluded — named, deliberately not analysed' };

const none = (what) => notRecorded(what);

function record(ix, inst, db) {
  const part = inst.brief_part ? (db.brief?.parts || []).find((p) => p.id === inst.brief_part) : null;
  const partCell = !inst.brief_part
    ? notRecorded('not discussed in a part of the brief')
    : part
      ? `<a href="${part.id === 'part-5' ? 'article.html' : '../../index.html#' + esc(part.id)}">Part ${esc(part.roman)} — ${esc(part.title)}</a>`
      : `<code>${esc(inst.brief_part)}</code> ${notRecorded('part not found in brief.json')}`;
  const rel = (ids) => has(ids) ? ids.map((id) => instrumentLink(ix, id)).join(', ') : notRecorded();
  const cov = coverage(inst);
  return `<aside class="record" aria-label="The record at a glance"><p class="kicker">The record at a glance</p><dl class="facts-grid">
    <div><dt>Status</dt><dd>${statusTag(ix, inst.legislative_status)}${inst.status_as_of ? ` <span class="meta">as of ${esc(F.humanDate(inst.status_as_of))}</span>` : ` ${notRecorded('date of assessment not recorded')}`}</dd></div>
    <div><dt>Kind</dt><dd>${inst.kind ? esc(label(ix, inst.kind)) : notRecorded()}</dd></div>
    <div><dt>CELEX</dt><dd>${inst.celex ? `<code>${esc(inst.celex)}</code>` : notRecorded()}</dd></div>
    <div><dt>Coverage</dt><dd>${cov ? esc(COVERAGE_WORD[cov]) : notRecorded()}</dd></div>
    <div><dt>In the brief</dt><dd>${partCell}</dd></div>
    <div><dt>Amended by</dt><dd>${rel(inst.amended_by)}</dd></div>
    <div><dt>Amends</dt><dd>${rel(inst.amends)}</dd></div>
    <div><dt>Repeals</dt><dd>${rel(inst.repeals)}</dd></div>
    <div><dt>Last verified</dt><dd>${inst.last_verified ? esc(F.humanDate(inst.last_verified)) : notRecorded()}</dd></div>
    <div><dt>On the current site</dt><dd><a href="${esc(instrumentHref(inst, ix))}">${esc(inst.short_name)}</a></dd></div>
  </dl></aside>`;
}

function design(ix, inst) {
  const d = inst.dna;
  if (!d) return empty('The design of this instrument is not recorded.', 'Its objective, regulated actors, risk logic, enforcement mechanism and sanction ceiling have not been researched for this record (<code>dna</code> is <code>null</code>).');
  const actors = (ids) => has(ids) ? ids.map((a) => esc(label(ix, a))).join(', ') : notRecorded();
  const sc = d.sanction_ceiling;
  const ceiling = !sc ? notRecorded()
    : [sc.pct_global_turnover != null ? `${esc(sc.pct_global_turnover)}% of worldwide annual turnover` : null,
      sc.fixed_eur != null ? esc(F.eur(sc.fixed_eur)) : null].filter(Boolean).join(' or ') +
      (sc.basis ? ` <span class="meta">(${provisionText(ix, sc.basis)})</span>` : '') || notRecorded();
  return `<p class="prose">${d.objective ? esc(d.objective) : notRecorded('objective not recorded')}</p>
  <dl class="facts">
    <dt>Risk logic</dt><dd>${d.risk_logic ? esc(d.risk_logic) : notRecorded()}</dd>
    <dt>Regulates</dt><dd>${actors(d.regulated_actor)}</dd>
    <dt>Protects</dt><dd>${actors(d.protected_party)}</dd>
    <dt>Enforced by</dt><dd>${d.enforcement_mechanism ? esc(d.enforcement_mechanism) : notRecorded()}</dd>
    <dt>Sanction ceiling</dt><dd>${ceiling}</dd>
    <dt>Applies as</dt><dd>${d.implementation_model ? esc(d.implementation_model) : notRecorded()}</dd>
  </dl>`;
}

const SORTS = {};

function datesTable(ix, inst) {
  const evs = (inst.milestones || []).map((id) => ix.event.get(id) || { id, missing: true });
  if (!evs.length) return empty('No dated milestone is recorded', `for ${esc(inst.short_name)} in <code>data/timeline.json</code>. That is not a statement that nothing has happened.`);
  const cols = [{ key: 'date', label: 'Date', sort: 'date' }, { key: 'type', label: 'Event', sort: 'text' }, { key: 'status', label: 'Status', sort: 'text' }, { key: 'what', label: 'Obligation', sort: false }];
  SORTS['tbl-dates'] = cols;
  const rows = evs.sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))).map((e) => e.missing
    ? { cells: { date: `<code>${esc(e.id)}</code>`, type: notRecorded('event not found in timeline.json'), status: '', what: '' }, keys: {} }
    : { cells: {
        date: dateText(e.date, e.date_precision),
        type: e.event_type ? esc(label(ix, e.event_type)) : notRecorded(),
        status: (e.status ? tag(e.status === 'scheduled' ? 'Scheduled' : 'Occurred', e.status === 'scheduled' ? '' : 'ok') : notRecorded('status not recorded')) + (e.requires_verification ? ' ' + tag('Unverified', 'warn') : ''),
        what: e.obligation ? esc(e.obligation) : notRecorded('none recorded'),
      }, keys: { date: e.date, type: e.event_type ? label(ix, e.event_type) : null, status: e.status } });
  return sortableTable({ id: 'tbl-dates', cols, rows,
    caption: `${esc(F.plural(evs.length, 'dated milestone'))} of ${esc(inst.short_name)}, from <code>data/timeline.json</code>. A date known only to the month says so.` }) +
    `<p class="meta"><a href="timeline.html?instrument=${encodeURIComponent(inst.id)}">These dates on the timeline</a></p>`;
}

function provisionsTable(inst) {
  if (!has(inst.provisions)) return empty('No provision is recorded', `for ${esc(inst.short_name)}.`);
  const cols = [{ key: 'n', label: 'Article', sort: 'num' }, { key: 'h', label: 'Heading', sort: 'text' }, { key: 's', label: 'What it does', sort: false }];
  SORTS['tbl-prov'] = cols;
  const rows = inst.provisions.map((p) => ({ rowHeader: true,
    cells: { n: `Art. ${esc(p.number || '')}`, h: p.heading ? esc(p.heading) : notRecorded('heading not recorded'), s: p.summary ? esc(p.summary) : notRecorded('summary not recorded') },
    keys: { n: parseFloat(p.number), h: p.heading || null } }));
  return sortableTable({ id: 'tbl-prov', cols, rows, caption: `${esc(F.plural(inst.provisions.length, 'provision'))} recorded for ${esc(inst.short_name)} in <code>data/instruments.json</code>.` });
}

function claimsTable(ix, inst) {
  const list = [...ix.claim.values()].filter((c) => (c.instruments || []).includes(inst.id));
  if (!list.length) return empty('No claim is recorded', `about ${esc(inst.short_name)} in <code>data/claims.json</code>.`);
  const cols = [{ key: 's', label: 'What is stated', sort: false }, { key: 'e', label: 'Evidence', sort: 'text' }, { key: 'k', label: 'Kind of claim', sort: 'text' }, { key: 'src', label: 'What it rests on', sort: false }];
  SORTS['tbl-claims'] = cols;
  const rows = list.map((c) => ({
    cells: { s: esc(c.statement), e: evidenceTag(c), k: esc(label(ix, c.type) || ''), src: has(c.sources) ? c.sources.map((s) => sourceShort(ix, s)).join('<br>') : notRecorded('no source recorded') },
    keys: { e: F.EVIDENCE_WORD[F.evidenceStatus(c)], k: label(ix, c.type) } }));
  return sortableTable({ id: 'tbl-claims', cols, rows,
    caption: `${esc(F.plural(list.length, 'claim'))} about ${esc(inst.short_name)}: what is stated, how far its evidence carries it, and what it rests on — three things kept apart.` });
}

function enforcementTable(ix, inst, db) {
  const recs = actionsOnly(db.enforcement?.enforcement).filter((r) => r.instrument === inst.id);
  if (!recs.length) return empty('No enforcement action is recorded', `under ${esc(inst.short_name)}. That is the state of the record, not a finding that no authority has acted.`);
  const fig = finesFigure(recs, { asOf: TODAY });
  const announced = fig.announced.state === 'determined'
    ? (fig.fined ? `${esc(F.eur(fig.announced.eur))} announced across ${esc(F.plural(fig.fined, 'action'))} with a stated amount` : 'no action with a stated amount')
    : `the announced total is ${unknown('not determinable')}: ${esc(F.plural(fig.announced.unrecorded.length + fig.announced.invalid.length, 'action'))} without an established amount`;
  const cols = [{ key: 'e', label: 'Entity', sort: 'text' }, { key: 'a', label: 'Action', sort: false }, { key: 'st', label: 'Status', sort: 'text' }, { key: 'f', label: 'Fine', sort: 'num' }, { key: 'p', label: 'Payment', sort: 'text' }, { key: 'd', label: 'Decided', sort: 'date' }];
  SORTS['tbl-enf'] = cols;
  const rows = recs.map((r) => ({ rowHeader: true, cells: {
    e: r.entity ? esc(r.entity) : notRecorded('entity not recorded'),
    a: r.action ? esc(r.action) : notRecorded('action not recorded'),
    st: r.action_status ? tag(label(ix, r.action_status)) : notRecorded('status not recorded'),
    f: r.fine_eur != null ? esc(F.eur(r.fine_eur)) : notRecorded('no amount recorded'),
    p: r.payment_status === 'payment:unknown' ? unknown() : r.payment_status ? esc(label(ix, r.payment_status)) : notRecorded(),
    d: r.decision_date ? esc(F.humanDate(r.decision_date)) : notRecorded(),
  }, keys: { e: r.entity, st: r.action_status ? label(ix, r.action_status) : null, f: r.fine_eur, p: r.payment_status ? label(ix, r.payment_status) : null, d: r.decision_date } }));
  return `<p class="prose">${esc(F.plural(fig.population, 'action'))} recorded: ${announced}. Collected or paid: ${fig.collected.state === 'determined' ? esc(F.eur(fig.collected.eur)) : unknown('not determinable')}.</p>` +
    sortableTable({ id: 'tbl-enf', cols, rows, caption: `Enforcement actions under ${esc(inst.short_name)}, from <code>data/enforcement.json</code>; the totals above come from <code>finesFigure()</code> in <code>js/pipeline.js</code>, the site's one computing function for them. A fine with no amount sorts last.` });
}

function sourcesList(ix, inst) {
  if (!has(inst.sources)) return empty('No source is recorded', 'for this record.');
  return '<ul class="plain">' + inst.sources.map((s) => `<li>${sourceShort(ix, s)}</li>`).join('') + '</ul>';
}

function cards(ix, inst, db) {
  const claims = [...ix.claim.values()].filter((c) => (c.instruments || []).includes(inst.id));
  const direct = claims.filter((c) => F.evidenceStatus(c) === 'evidence:direct').length;
  const rels = ix.relationship.filter((r) => r.from === inst.id || r.to === inst.id);
  const evs = (inst.milestones || []).map((id) => ix.event.get(id)).filter(Boolean);
  const next = evs.filter((e) => e.status === 'scheduled' && e.date > TODAY).sort((a, b) => a.date.localeCompare(b.date))[0];
  const last = evs.filter((e) => e.status === 'occurred').sort((a, b) => b.date.localeCompare(a.date))[0];
  const recs = actionsOnly(db.enforcement?.enforcement).filter((r) => r.instrument === inst.id);
  return `<div class="cards">
    ${card({ label: 'Provisions recorded', value: has(inst.provisions) ? inst.provisions.length : none('none recorded'), change: null })}
    ${card({ label: 'Claims', value: claims.length || none('none recorded'), change: null,
      note: claims.length ? `${direct} with direct evidence` : 'nothing about this instrument is graded' })}
    ${card({ label: 'Dated milestones', value: evs.length || none('none recorded'),
      change: last ? `last: ${esc(label(ix, last.event_type))}, ${esc(F.humanDate(last.date, last.date_precision))}` : null,
      note: next ? `next: ${esc(label(ix, next.event_type))}, ${esc(F.humanDate(next.date, next.date_precision))}` : (evs.length ? 'no scheduled milestone recorded' : '') })}
    ${card({ label: 'Relationships', value: rels.length || none('none recorded'), change: null,
      note: rels.length ? `<a href="timeline.html?mode=network&amp;focus=${encodeURIComponent(inst.id)}">In the network explorer</a>` : 'kept in the explorer and its table, with this state' })}
    ${card({ label: 'Enforcement actions', value: recs.length || none('none recorded'), change: null })}
  </div>`;
}

boot(NEEDED, (db, ix, mount) => {
  const id = new URLSearchParams(location.search).get('id') || 'ai-act';
  const inst = ix.instrument.get(id);
  const switcher = `<p class="switch">The same view, two records: ${EXAMPLES.map(([k, n]) => k === (inst && inst.id) ? `<b>${esc(n)}</b>` : `<a href="regulation.html?id=${k}">${esc(n)}</a>`).join(' · ')}</p>`;
  if (!inst) {
    mount.innerHTML = `<header class="head">${switcher}<h1>Instrument not found</h1></header>` + empty(`No instrument with the id <code>${esc(id)}</code> is recorded`, 'in <code>data/instruments.json</code>. Nothing has been substituted.');
    return;
  }
  document.title = `${inst.short_name} · Observatory prototype`;
  const statusNote = inst.status_note
    ? `<p class="prose">${F.readerText(inst.status_note, ix, { href: (p) => siteRoot() + p, instrumentHref: (x) => instrumentHref(x, ix) })}</p>`
    : empty('No note on the status is recorded.');
  const hasRel = ix.relationship.some((r) => r.from === inst.id || r.to === inst.id);

  mount.innerHTML = `
    <header class="head">
      ${switcher}
      <p class="kicker">${inst.kind ? esc(label(ix, inst.kind)) : 'Instrument'}</p>
      <h1>${esc(inst.short_name)}</h1>
      <p class="lede">${inst.full_name ? esc(inst.full_name) : notRecorded('full name not recorded')}</p>
    </header>
    ${cards(ix, inst, db)}
    <div class="rec-grid">
      ${record(ix, inst, db)}
      ${section('status', 'Where it stands', statusNote)}
      ${section('design', 'What it is for', design(ix, inst))}
      ${section('dates', 'Dates', datesTable(ix, inst))}
      ${section('provisions', 'Provisions', provisionsTable(inst))}
      ${section('claims', 'Claims and their evidence', claimsTable(ix, inst))}
      ${section('relationships', 'Relationships with other instruments', hasRel
        ? `<p class="prose">The same table as in the timeline's network explorer, narrowed to ${esc(inst.short_name)}. <a href="timeline.html?mode=network&amp;focus=${encodeURIComponent(inst.id)}">See these relationships in the explorer</a>.</p>${relationsTable(ix, { only: inst.id })}`
        : empty('No relationship is recorded', `between ${esc(inst.short_name)} and another instrument in <code>data/instruments.json</code>. It stays in <a href="timeline.html?mode=network&amp;focus=${encodeURIComponent(inst.id)}">the network explorer</a> and its table, with this state.`))}
      ${section('enforcement', 'Enforcement', enforcementTable(ix, inst, db))}
      ${section('sources', 'Sources of the record', sourcesList(ix, inst))}
    </div>`;
  for (const [tid, cols] of Object.entries(SORTS)) { const t = mount.querySelector('#' + tid); if (t) wireSort(t, cols); }
});
