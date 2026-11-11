/* PV2-04 · view 1 of 4: the homepage — the brief's opening beside the site's
   portal tree of the parts, drawn here as a star chart (kept: roadmap §8,
   11 Nov 2026), then the record counted in cards (label, value, change), two
   charts each beside its table, and the parts as a sortable table. Every
   figure is counted from the records on this page load. */

import {
  boot, esc, F, label, has, notRecorded, unknown, section, card, sortableTable, wireSort, barChart, chartWithTable,
  countBy, TODAY, yearBefore,
} from './common.js';
import { readBrief, textOf } from '../editorial/brief.js';
import { finesFigure, actionsOnly } from '../../js/pipeline.js';
import { coverage } from '../../js/routes.js';

const NEEDED = ['taxonomy', 'instruments', 'timeline', 'claims', 'sources', 'enforcement', 'brief'];

const partHref = (id) => id === 'part-5' ? 'article.html' : `../../index.html#${encodeURIComponent(id)}`;

/* The portal tree, read in place from index.html (#portalTree): node positions and paths are the site's;
   the drawing is the Editorial's look A (roadmap §8, "PV2-04: the layout the author sent"): each numeral
   inside its circle, V — the article — filled, each node a real link, on the page with no background.
   Nothing of the tree is copied into the folder. */
function tree(doc, db) {
  const src = doc.getElementById('portalTree');
  if (!src) return `<p class="empty"><b>The portal tree was not found</b> in <code>index.html</code>.</p>`;
  const parts = new Map((db.brief?.parts || []).map((p) => [p.id, p]));
  const lines = [...src.querySelectorAll('line[data-a][data-b]')].map((l) =>
    `<line x1="${+l.getAttribute('x1')}" y1="${+l.getAttribute('y1')}" x2="${+l.getAttribute('x2')}" y2="${+l.getAttribute('y2')}"/>`).join('');
  const pts = [];
  const nodes = [...src.querySelectorAll('[data-node]')].map((g) => {
    const id = g.getAttribute('data-node');
    const m = (g.getAttribute('transform') || '').match(/translate\(\s*([\d.]+)[ ,]+([\d.]+)\s*\)/);
    if (!m) return '';
    const x = +m[1], y = +m[2];
    pts.push([x, y]);
    const p = parts.get(id);
    const roman = g.getAttribute('data-roman') || p?.roman || '?';
    const word = (p?.kind || (id.startsWith('annex') ? 'annex' : 'part')) === 'annex' ? 'Annex' : 'Part';
    const name = `${word} ${roman}: ${p?.title || g.getAttribute('data-title') || id}`;
    const cls = [id.startsWith('annex') ? 'annex' : '', id === 'part-5' ? 'here' : ''].filter(Boolean).join(' ');
    return `<a href="${partHref(id)}" aria-label="${esc(name)}"${cls ? ` class="${cls}"` : ''}><title>${esc(name)}</title>` +
      `<circle cx="${x}" cy="${y}" r="27"/><text x="${x}" y="${y + 5}" text-anchor="middle">${esc(roman)}</text></a>`;
  }).join('');
  /* the viewBox is cropped to the nodes actually placed */
  const vb = pts.length
    ? `${Math.min(...pts.map((p) => p[0])) - 32} ${Math.min(...pts.map((p) => p[1])) - 32} ${Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0])) + 64} ${Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1])) + 64}`
    : (src.getAttribute('viewBox') || src.getAttribute('viewbox') || '0 0 600 882');
  return `<figure class="tree"><svg viewBox="${esc(vb)}" role="group" aria-label="The parts of the brief, as the site draws them">${lines}${nodes}</svg>
    <figcaption>The parts of the brief, as the site draws them. V opens the article; the others open the current site.</figcaption></figure>`;
}

function cards(db, ix) {
  const instruments = [...new Set(ix.instrument.values())];
  const claims = [...ix.claim.values()];
  const events = [...ix.event.values()];
  const since = yearBefore(TODAY);
  const window = `in the 12 months to ${esc(F.humanDate(TODAY))}`;

  const occurredInWindow = events.filter((e) => e.status === 'occurred' && e.date && e.date > since && e.date <= TODAY).length;
  const next = events.filter((e) => e.status === 'scheduled' && e.date && e.date > TODAY).sort((a, b) => a.date.localeCompare(b.date))[0];

  const records = db.enforcement?.enforcement || [];
  const fig = finesFigure(records, { asOf: TODAY });
  const recent = actionsOnly(records).filter((r) => r.decision_date && r.decision_date > since && r.decision_date <= TODAY);
  const recentFig = finesFigure(recent);
  const noDate = actionsOnly(records).filter((r) => !r.decision_date).length;

  const announced = fig.announced.state === 'determined'
    ? esc(F.eur(fig.announced.eur))
    : unknown('not determinable');
  const announcedNote = fig.announced.state === 'determined'
    ? `across ${esc(F.plural(fig.announced.records, 'action'))} with a stated amount, of ${esc(F.plural(fig.population, 'enforcement action'))} recorded`
    : `${esc(F.plural(fig.announced.unrecorded.length + fig.announced.invalid.length, 'action'))} without an established amount — the sum is not shown`;
  const recentChange = !recent.length ? `no action decided ${window}`
    : recentFig.announced.state === 'determined'
    ? `+${esc(F.eur(recentFig.announced.eur))} in ${esc(F.plural(recent.length, 'action'))} decided ${window}${noDate ? `; ${notRecorded(F.plural(noDate, 'action') + ' with no decision date')}` : ''}`
    : unknown('change not determinable');

  const collected = fig.collected.state === 'determined' ? esc(F.eur(fig.collected.eur)) : unknown('not determinable');
  const nUnknown = fig.collected.unknown.length + fig.collected.not_researched.length + fig.collected.unmapped.length;

  return `<div class="cards">
    ${card({ label: 'Instruments recorded', value: instruments.length, change: null,
      note: `${instruments.filter((i) => coverage(i) === 'covered').length} analysed by the site; the rest mapped, watched or excluded` })}
    ${card({ label: 'Relationships recorded', value: ix.relationship.length, change: null,
      note: `${ix.relationship.filter((r) => r.symmetric === true).length} mutual, ${ix.relationship.filter((r) => r.symmetric === false).length} with a direction` })}
    ${card({ label: 'Claims, each graded by its evidence', value: claims.length, change: null,
      note: 'by evidence status in the chart below' })}
    ${card({ label: 'Dated legal events', value: events.length,
      change: `+${occurredInWindow} occurred ${window}`,
      note: next ? `next scheduled: ${esc(F.humanDate(next.date, next.date_precision))}` : notRecorded('no scheduled event recorded') })}
    ${card({ label: 'Fines announced', value: announced, change: recentChange, note: announcedNote })}
    ${card({ label: 'Fines collected or paid', value: collected, tone: 'gap',
      change: null,
      note: `payment ${unknown('unknown')} for ${esc(F.plural(nUnknown, 'fined action'))}; never read as paid or unpaid` })}
  </div>`;
}

function evidenceChart(ix) {
  const claims = [...ix.claim.values()];
  const ev = countBy(claims, (c) => F.evidenceStatus(c));
  const order = ['evidence:direct', 'evidence:partial', 'evidence:derived', 'evidence:context-only', 'evidence:disputed', 'evidence:unverified'];
  const rows = order.map((s) => ({ s, label: F.EVIDENCE_WORD[s], value: ev.get(s) || 0 }));
  const chart = barChart({ title: `Claims by evidence status, ${claims.length} claims`, unitWord: 'claims',
    rows: rows.map((r) => ({ label: r.label, value: r.value, pattern: r.s === 'evidence:unverified' ? 'hatch' : r.s === 'evidence:disputed' ? 'dots' : 'solid' })) });
  const cols = [{ key: 'status', label: 'Evidence status', sort: 'text' }, { key: 'n', label: 'Claims', sort: 'num' }];
  const table = sortableTable({ id: 'tbl-evidence', cols, caption: `Claims by evidence status (${claims.length}), each status derived from the claim's own sources on this page load.`,
    rows: rows.map((r) => ({ rowHeader: true, cells: { status: esc(r.label), n: String(r.value) }, keys: { status: r.label, n: r.value } })) });
  return { html: chartWithTable('Claims by evidence status — derived by <code>js/evidence-model.js</code> on this page load', chart, table), cols };
}

function coverageChart(ix) {
  const instruments = [...new Set(ix.instrument.values())];
  const by = countBy(instruments, (i) => coverage(i));
  const order = [['covered', 'Covered'], ['mapped', 'Mapped'], ['watched', 'Watched'], ['excluded', 'Excluded']];
  const chart = barChart({ title: `Instruments by coverage, ${instruments.length} instruments`, unitWord: 'instruments',
    rows: order.map(([k, l]) => ({ label: l, value: by.get(k) || 0, pattern: k === 'covered' ? 'solid' : k === 'mapped' ? 'dots' : 'hatch' })) });
  const cols = [{ key: 'c', label: 'Coverage', sort: 'text' }, { key: 'n', label: 'Instruments', sort: 'num' }, { key: 'm', label: 'What it means', sort: false }];
  const meaning = { covered: 'core to the brief, analysed', mapped: 'adjacent or referenced, recorded for its links', watched: 'named and watched, not analysed', excluded: 'named and deliberately not analysed' };
  const table = sortableTable({ id: 'tbl-coverage', cols, caption: `Instruments by coverage (${instruments.length}), as <code>coverage()</code> in <code>js/routes.js</code> derives it.`,
    rows: order.map(([k, l]) => ({ rowHeader: true, cells: { c: esc(l), n: String(by.get(k) || 0), m: esc(meaning[k]) }, keys: { c: l, n: by.get(k) || 0 } })) });
  return { html: chartWithTable('Instruments by coverage', chart, table), cols };
}

function partsTable(db, ix) {
  const list = db.brief?.parts;
  if (!has(list)) return { html: `<p class="empty"><b>No part is recorded</b> in <code>data/brief.json</code>.</p>`, cols: [] };
  const cols = [
    { key: 'roman', label: 'No.', sort: 'num' }, { key: 'title', label: 'Part', sort: 'text' },
    { key: 'mins', label: 'Reading time', sort: 'num' }, { key: 'claims', label: 'Claims', sort: 'num' }, { key: 'opens', label: 'Opens in', sort: 'text' },
  ];
  const rows = list.map((p, i) => {
    const n = (ix.claimsByPart.get(p.id) || []).length;
    const word = p.kind === 'annex' ? 'Annex' : 'Part';
    return {
      rowHeader: true,
      cells: {
        roman: `<span class="roman">${esc(p.roman || '?')}</span>`,
        title: `<a href="${partHref(p.id)}">${esc(p.title || p.id)}</a>${p.dek ? `<span class="cell-sub">${esc(p.dek)}</span>` : ` ${notRecorded('dek not recorded')}`}`,
        mins: p.reading_minutes != null ? `${esc(p.reading_minutes)} min` : notRecorded(),
        claims: n ? String(n) : '<span class="cell-sub">no claim recorded</span>',
        opens: p.id === 'part-5' ? 'this prototype' : 'the current site',
      },
      keys: { roman: i, title: `${word} ${p.title || ''}`, mins: p.reading_minutes, claims: n, opens: p.id === 'part-5' ? 'a' : 'b' },
    };
  });
  return { html: sortableTable({ id: 'tbl-parts', cols, rows, cls: 'parts',
    caption: `The ${list.length} parts and annexes of the brief, from <code>data/brief.json</code>, with the claims recorded under each. Sort by any column.` }), cols };
}

boot(NEEDED, async (db, ix, mount) => {
  const doc = await readBrief();
  const h1 = doc.querySelector('.portal-masthead h1');
  const em = h1?.querySelector('em')?.textContent.trim();
  const full = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : null;
  const title = !full ? notRecorded('title not found in index.html')
    : em && full.endsWith(em) ? `${esc(full.slice(0, -em.length).trim())} <em>${esc(em)}</em>` : esc(full);
  const stand = textOf(doc, '.portal-masthead .portal-stand');
  const intro = textOf(doc, '.hero .stand');
  const advice = textOf(doc, '.hero .hero-meta');

  const ev = evidenceChart(ix);
  const cov = coverageChart(ix);
  const parts = partsTable(db, ix);

  mount.innerHTML = `
    <header class="head hero">
      <div class="hero-text">
        <p class="kicker">An analytical brief on the EU digital acquis · the observatory</p>
        <h1>${title}</h1>
        ${stand ? `<p class="lede">${esc(stand)}</p>` : ''}
        ${intro ? `<p class="prose">${esc(intro)}</p>` : ''}
        ${advice ? `<p class="dek">${esc(advice)}</p>` : ''}
      </div>
      ${tree(doc, db)}
    </header>
    ${section('views', 'Four ways in', `<ul class="ways">
      <li><a href="regulation.html?id=ai-act"><span class="way-k">Regulation</span><strong>The AI Act, as a record</strong><span>Status, dates, provisions, claims, relationships, enforcement.</span></a></li>
      <li><a href="article.html"><span class="way-k">The brief</span><strong>Part V</strong><span>The risk pyramid, the compute threshold and the delay — with an evidence ledger.</span></a></li>
      <li><a href="timeline.html"><span class="way-k">Analysis</span><strong>The timeline</strong><span>Every dated legal event, sortable and filterable.</span></a></li>
      <li><a href="timeline.html?mode=network"><span class="way-k">Analysis</span><strong>The network explorer</strong><span>Instruments and the relationships recorded between them.</span></a></li>
    </ul>`)}
    ${section('numbers', 'The record, counted', `<p class="prose">Counted from the records on this page load, ${esc(F.humanDate(TODAY))}. A card shows a change only where dated records give one, with its window: the record keeps no earlier reading of a count, so no trend is invented. An unknown is never added as zero.</p>${cards(db, ix)}`)}
    ${section('evidence', 'Claims and their evidence', ev.html)}
    ${section('coverage', 'What the site covers', cov.html)}
    ${section('parts', 'The brief, in parts', parts.html)}`;
  wireSort(mount.querySelector('#tbl-evidence'), ev.cols);
  wireSort(mount.querySelector('#tbl-coverage'), cov.cols);
  if (parts.cols.length) wireSort(mount.querySelector('#tbl-parts'), parts.cols);
});
