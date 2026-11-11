/* PV2-03 · view 2 of 4: a regulation's page. The AI Act is the view; the
   Chips Act, whose record holds almost nothing, is its empty state (roadmap
   §8, "PV2-03, C.1 question 1"). Any instrument id renders through the same
   template; every section says when its field is not recorded. */

import {
  boot, esc, F, label, has, notRecorded, unknown, tag, statusTag, evidenceTag, dateText, instrumentLink,
  provisionText, sourceShort, fillToc,
} from './common.js';
import { relationsTable } from './relations.js';
import { aggregate, actionsOnly } from '../../js/pipeline.js';
import { instrumentHref, siteRoot } from '../../js/routes.js';

const NEEDED = ['taxonomy', 'instruments', 'timeline', 'claims', 'sources', 'enforcement', 'brief'];
const EXAMPLES = [['ai-act', 'AI Act'], ['chips-act', 'Chips Act (the empty state)']];

const section = (id, title, body, wide = false) => `<section${wide ? ' class="wide"' : ''} aria-labelledby="${id}"><h2 id="${id}">${esc(title)}</h2>${body}</section>`;
const empty = (what, where) => `<p class="empty"><b>${what}</b>${where ? ' ' + where : ''}</p>`;

function identity(ix, inst, db) {
  const part = inst.brief_part ? (db.brief?.parts || []).find((p) => p.id === inst.brief_part) : null;
  const partCell = !inst.brief_part
    ? notRecorded('not discussed in a part of the brief')
    : part
      ? `<a href="${part.id === 'part-5' ? 'article.html' : '../../index.html#' + esc(part.id)}">Part ${esc(part.roman)} — ${esc(part.title)}</a>`
      : `<code>${esc(inst.brief_part)}</code> ${notRecorded('part not found in brief.json')}`;
  const rel = (ids) => has(ids) ? ids.map((id) => instrumentLink(ix, id)).join(', ') : notRecorded();
  return `<aside class="card" aria-label="The record at a glance"><dl class="facts">
    <dt>Status</dt><dd>${statusTag(ix, inst.legislative_status)}${inst.status_as_of ? ` <span class="meta">as of ${esc(F.humanDate(inst.status_as_of))}</span>` : ` ${notRecorded('date of assessment not recorded')}`}</dd>
    <dt>Kind</dt><dd>${inst.kind ? esc(label(ix, inst.kind)) : notRecorded()}</dd>
    <dt>CELEX</dt><dd>${inst.celex ? `<code>${esc(inst.celex)}</code>` : notRecorded()}</dd>
    <dt>In the brief</dt><dd>${partCell}</dd>
    <dt>Scope</dt><dd>${inst.scope_class ? esc(label(ix, inst.scope_class)) : notRecorded()}</dd>
    <dt>Amended by</dt><dd>${rel(inst.amended_by)}</dd>
    <dt>Amends</dt><dd>${rel(inst.amends)}</dd>
    <dt>Repeals</dt><dd>${rel(inst.repeals)}</dd>
    <dt>Last verified</dt><dd>${inst.last_verified ? esc(F.humanDate(inst.last_verified)) : notRecorded()}</dd>
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
  return `<p class="measure">${d.objective ? esc(d.objective) : notRecorded('objective not recorded')}</p>
  <dl class="facts">
    <dt>Risk logic</dt><dd>${d.risk_logic ? esc(d.risk_logic) : notRecorded()}</dd>
    <dt>Regulates</dt><dd>${actors(d.regulated_actor)}</dd>
    <dt>Protects</dt><dd>${actors(d.protected_party)}</dd>
    <dt>Enforced by</dt><dd>${d.enforcement_mechanism ? esc(d.enforcement_mechanism) : notRecorded()}</dd>
    <dt>Sanction ceiling</dt><dd>${ceiling}</dd>
    <dt>Applies as</dt><dd>${d.implementation_model ? esc(d.implementation_model) : notRecorded()}</dd>
  </dl>`;
}

function dates(ix, inst) {
  const evs = (inst.milestones || []).map((id) => ix.event.get(id) || { id, missing: true })
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  if (!evs.length) return empty('No dated milestone is recorded', `for ${esc(inst.short_name)} in <code>data/timeline.json</code>. That is not a statement that nothing has happened.`);
  return '<ol class="tl">' + evs.map((e) => e.missing
    ? `<li><code>${esc(e.id)}</code> ${notRecorded('event not found in timeline.json')}</li>`
    : `<li class="${e.status === 'scheduled' ? 'scheduled' : ''}"><span class="when">${dateText(e.date, e.date_precision)}</span>
        <div><span class="head">${tag(label(ix, e.event_type))} ${e.status ? tag(e.status === 'scheduled' ? 'Scheduled' : 'Occurred', e.status === 'scheduled' ? '' : 'ok') : notRecorded('status not recorded')}${e.requires_verification ? ' ' + tag('Unverified', 'warn') : ''}</span>
        ${e.obligation ? `<p>${esc(e.obligation)}</p>` : ''}</div></li>`).join('') +
    `</ol><p class="meta"><a href="timeline.html?instrument=${encodeURIComponent(inst.id)}">These dates on the timeline</a></p>`;
}

function provisions(inst) {
  if (!has(inst.provisions)) return empty('No provision is recorded', `for ${esc(inst.short_name)}.`);
  return '<ul class="records">' + inst.provisions.map((p) => `<li>
      <span class="head">Art. ${esc(p.number || '')} ${p.heading ? '· ' + esc(p.heading) : notRecorded('heading not recorded')}</span>
      <p>${p.summary ? esc(p.summary) : notRecorded('summary not recorded')}</p></li>`).join('') + '</ul>';
}

function claims(ix, inst) {
  const list = [...ix.claim.values()].filter((c) => (c.instruments || []).includes(inst.id));
  if (!list.length) return empty('No claim is recorded', `about ${esc(inst.short_name)} in <code>data/claims.json</code>.`);
  return `<p class="meta">Each claim is three things kept apart: what is stated, what it rests on, and how far that evidence carries it.</p>
  <ul class="records">` + list.map((c) => `<li>
      <span class="head">${evidenceTag(c)} <span class="meta">${esc(label(ix, c.type) || '')}</span></span>
      <p>${esc(c.statement)}</p>
      <p class="meta">${has(c.sources) ? 'Rests on: ' + c.sources.map((s) => sourceShort(ix, s)).join('; ') : notRecorded('no source recorded')}</p></li>`).join('') + '</ul>';
}

function enforcement(ix, inst, db) {
  const recs = actionsOnly(db.enforcement?.enforcement).filter((r) => r.instrument === inst.id);
  if (!recs.length) return empty('No enforcement action is recorded', `under ${esc(inst.short_name)}. That is the state of the record, not a finding that no authority has acted.`);
  const a = aggregate(recs, ix);
  const sum = a.fined
    ? `${esc(F.eur(a.announcedEur))} announced across ${esc(F.plural(a.fined, 'action'))} with a stated amount`
    : 'no action with a stated amount';
  return `<p class="measure">${esc(F.plural(a.count, 'action'))} recorded: ${sum}${a.announcedUnknownAmount ? `; ${unknown(F.plural(a.announcedUnknownAmount, 'amount') + ' not established')}, not added to the sum` : ''}. Payment ${a.paymentUnknown ? unknown(`unknown for ${a.paymentUnknown}`) : 'established for every action'}.</p>
  <ul class="records">` + recs.map((r) => `<li>
      <span class="head">${r.entity ? esc(r.entity) : notRecorded('entity not recorded')} ${r.action_status ? tag(label(ix, r.action_status)) : notRecorded('status not recorded')}</span>
      <p>${r.action ? esc(r.action) : notRecorded('action not recorded')}</p>
      <p class="meta">Fine: ${r.fine_eur != null ? esc(F.eur(r.fine_eur)) : notRecorded('no amount recorded')} · Payment: ${r.payment_status === 'payment:unknown' ? unknown() : r.payment_status ? esc(label(ix, r.payment_status)) : notRecorded()}</p></li>`).join('') + '</ul>';
}

function sources(ix, inst) {
  if (!has(inst.sources)) return empty('No source is recorded', `for this record.`);
  return '<ul class="records">' + inst.sources.map((s) => `<li><p>${sourceShort(ix, s)}</p></li>`).join('') + '</ul>';
}

boot(NEEDED, (db, ix, mount) => {
  const id = new URLSearchParams(location.search).get('id') || 'ai-act';
  const inst = ix.instrument.get(id);
  const switcher = `<p class="switch">The same view, two records: ${EXAMPLES.map(([k, n]) => k === (inst && inst.id) ? `<b>${esc(n)}</b>` : `<a href="regulation.html?id=${k}">${esc(n)}</a>`).join(' · ')}</p>`;
  if (!inst) {
    mount.innerHTML = `<header class="head">${switcher}<h1>Instrument not found</h1></header>` + empty(`No instrument with the id <code>${esc(id)}</code> is recorded`, 'in <code>data/instruments.json</code>. Nothing has been substituted.');
    return;
  }
  document.title = `${inst.short_name} · Editorial prototype`;
  const statusNote = inst.status_note
    ? `<p>${F.readerText(inst.status_note, ix, { href: (p) => siteRoot() + p, instrumentHref: (x) => instrumentHref(x, ix) })}</p>`
    : empty('No note on the status is recorded.');

  mount.innerHTML = `
    <header class="head">
      ${switcher}
      <p class="kicker label">${inst.kind ? esc(label(ix, inst.kind)) : 'Instrument'}</p>
      <h1>${esc(inst.short_name)}</h1>
      <p class="lede">${inst.full_name ? esc(inst.full_name) : notRecorded('full name not recorded')}</p>
    </header>
    <div class="toc"><nav aria-labelledby="toc-h"><h2 id="toc-h">On this page</h2><ol></ol></nav></div>
    ${identity(ix, inst, db)}
    ${section('status', 'Where it stands', statusNote)}
    ${section('design', 'What it is for', design(ix, inst))}
    ${section('dates', 'Dates', dates(ix, inst))}
    ${section('provisions', 'Provisions', provisions(inst))}
    ${section('claims', 'Claims and their evidence', claims(ix, inst))}
    ${section('relationships', 'Relationships with other instruments',
      ix.relationship.some((r) => r.from === inst.id || r.to === inst.id)
        ? relationsTable(ix, { only: inst.id })
        : empty('No relationship is recorded', `between ${esc(inst.short_name)} and another instrument in <code>data/instruments.json</code>. It stays listed, with this state, in <a href="timeline.html#relationships">the full table</a>.`),
      ix.relationship.some((r) => r.from === inst.id || r.to === inst.id))}
    ${section('enforcement', 'Enforcement', enforcement(ix, inst, db))}
    ${section('sources', 'Sources of the record', sources(ix, inst))}`;
  fillToc(mount, mount.querySelector('.toc'));
});
