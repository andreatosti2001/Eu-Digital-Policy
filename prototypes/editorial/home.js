/* PV2-03 · view 1 of 4: the homepage — the brief's opening beside the site's
   portal tree of the parts (kept: roadmap §8, 11 Nov 2026), the record counted,
   the parts. Every figure is counted from the records on this run and
   carries what it cannot account for beside it. */

import { boot, esc, F, label, has, notRecorded, unknown, fillToc } from './common.js';
import { readBrief, textOf } from './brief.js';
import { aggregate, actionsOnly } from '../../js/pipeline.js';

const NEEDED = ['taxonomy', 'instruments', 'timeline', 'claims', 'sources', 'enforcement', 'brief'];

const partHref = (id) => id === 'part-5' ? 'article.html' : `../../index.html#${encodeURIComponent(id)}`;

function countBy(items, key) {
  const m = new Map();
  for (const x of items) m.set(key(x), (m.get(key(x)) || 0) + 1);
  return m;
}

/* The portal tree, read in place from index.html (#portalTree): its node
   positions and its paths are the site's; the drawing here is the prototype's
   own, each node a real link. Nothing is copied into the folder. */
function tree(doc, db) {
  const src = doc.getElementById('portalTree');
  if (!src) return `<p class="empty"><b>The portal tree was not found</b> in <code>index.html</code>.</p>`;
  const vb = src.getAttribute('viewBox') || src.getAttribute('viewbox') || '0 0 600 882';
  const titles = new Map((db.brief?.parts || []).map((p) => [p.id, p]));
  const lines = [...src.querySelectorAll('line[data-a][data-b]')].map((l) =>
    `<line x1="${+l.getAttribute('x1')}" y1="${+l.getAttribute('y1')}" x2="${+l.getAttribute('x2')}" y2="${+l.getAttribute('y2')}"/>`).join('');
  const nodes = [...src.querySelectorAll('[data-node]')].map((g) => {
    const id = g.getAttribute('data-node');
    const m = (g.getAttribute('transform') || '').match(/translate\(\s*([\d.]+)[ ,]+([\d.]+)\s*\)/);
    if (!m) return '';
    const p = titles.get(id);
    const roman = g.getAttribute('data-roman') || p?.roman || '?';
    const word = (p?.kind || (id.startsWith('annex') ? 'annex' : 'part')) === 'annex' ? 'Annex' : 'Part';
    const name = `${word} ${roman}: ${p?.title || g.getAttribute('data-title') || id}`;
    const cls = [id.startsWith('annex') ? 'annex' : '', id === 'part-5' ? 'here' : ''].filter(Boolean).join(' ');
    return `<a href="${partHref(id)}" aria-label="${esc(name)}"${cls ? ` class="${cls}"` : ''}><title>${esc(name)}</title>` +
      `<circle cx="${+m[1]}" cy="${+m[2]}" r="27"/><text x="${+m[1]}" y="${+m[2] + 5}" text-anchor="middle">${esc(roman)}</text></a>`;
  }).join('');
  return `<figure class="tree"><svg viewBox="${esc(vb)}" role="group" aria-label="The parts of the brief, as the site draws them">${lines}${nodes}</svg>
    <figcaption>The parts of the brief, as the site draws them. V opens the article; the others open the current site.</figcaption></figure>`;
}

function figures(db, ix) {
  const instruments = [...new Set(ix.instrument.values())];
  const kinds = countBy(instruments, (i) => i.kind || null);
  const noStatus = instruments.filter((i) => !i.legislative_status).length;
  const kindLine = [...kinds].filter(([k]) => k).sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${n} ${esc(label(ix, k).toLowerCase())}`).join(' · ');

  const claims = [...ix.claim.values()];
  const ev = countBy(claims, (c) => F.evidenceStatus(c));
  const evLine = ['evidence:direct', 'evidence:partial', 'evidence:derived', 'evidence:context-only', 'evidence:disputed', 'evidence:unverified']
    .filter((s) => ev.get(s)).map((s) => `${ev.get(s)} ${esc(F.EVIDENCE_WORD[s].toLowerCase())}`).join(' · ');

  const records = actionsOnly(db.enforcement?.enforcement);
  const agg = aggregate(records, ix);
  const amountGap = agg.announcedUnknownAmount
    ? `and ${unknown(F.plural(agg.announcedUnknownAmount, 'action') + ' with the amount not established')}, not counted in the sum`
    : 'no action with an amount not established';

  const events = [...ix.event.values()];
  const st = countBy(events, (e) => e.status);
  const monthOnly = events.filter((e) => String(e.date_precision).endsWith('month')).length;

  return `<div class="figures wide">
    <p class="figure"><span class="n">${instruments.length}</span><span class="what">instruments recorded</span>
      <span class="but">${kindLine}${noStatus ? ` · ${notRecorded(F.plural(noStatus, 'status') + ' not recorded')}` : ''}</span></p>
    <p class="figure"><span class="n">${claims.length}</span><span class="what">claims, each graded by its evidence</span>
      <span class="but">${evLine}</span></p>
    <p class="figure"><span class="n">${esc(agg.fined ? F.eur(agg.announcedEur) : '—')}</span><span class="what">in fines announced, across ${esc(F.plural(agg.fined, 'action'))} with a stated amount</span>
      <span class="but">of ${esc(F.plural(agg.count, 'enforcement action'))} recorded, ${amountGap}.</span></p>
    <p class="figure"><span class="n">${agg.paymentUnknown}</span><span class="what">of ${agg.count} actions whose payment is ${unknown('unknown')}</span>
      <span class="but">payment established for ${agg.paymentKnown}; collected or paid ${esc(F.eur(agg.paidEur) || '—')}. An unknown payment is never read as paid or unpaid.</span></p>
    <p class="figure"><span class="n">${events.length}</span><span class="what">dated legal events</span>
      <span class="but">${st.get('occurred') || 0} occurred · ${st.get('scheduled') || 0} scheduled${monthOnly ? ` · ${monthOnly} dated to the month, the day not established` : ''}</span></p>
  </div>`;
}

function parts(db, ix) {
  const list = db.brief?.parts;
  if (!has(list)) return `<p class="empty"><b>No part is recorded</b> in <code>data/brief.json</code>.</p>`;
  return '<ul class="parts wide">' + list.map((p) => {
    const n = (ix.claimsByPart.get(p.id) || []).length;
    const mins = p.reading_minutes != null ? `${esc(p.reading_minutes)} min` : notRecorded('reading time not recorded');
    return `<li><span class="roman" aria-hidden="true">${esc(p.roman || '')}</span><div>
      <h3><a href="${partHref(p.id)}">${esc(p.title || p.id)}</a></h3>
      ${p.dek ? `<p>${esc(p.dek)}</p>` : `<p>${notRecorded('dek not recorded')}</p>`}
      <p class="meta">${mins} · ${n ? esc(F.plural(n, 'claim')) : 'no claim recorded for this part'}${p.id === 'part-5' ? ' · the article view' : ' · in the current site'}</p>
    </div></li>`;
  }).join('') + '</ul>';
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

  mount.innerHTML = `
    <header class="head hero">
      <div>
        <p class="kicker label">An analytical brief on the EU digital acquis</p>
        <h1>${title}</h1>
        ${stand ? `<p class="lede">${esc(stand)}</p>` : ''}
        ${intro ? `<p>${esc(intro)}</p>` : ''}
        ${advice ? `<p class="dek">${esc(advice)}</p>` : ''}
      </div>
      ${tree(doc, db)}
    </header>
    <div class="toc"><nav aria-labelledby="toc-h"><h2 id="toc-h">On this page</h2><ol></ol></nav></div>
    <h2 id="views">Four ways in</h2>
    <ul class="views wide">
      <li><a href="article.html"><strong>Read Part V</strong><span>The AI Act: the risk pyramid, the compute threshold and the delay — with its evidence in the margin.</span></a></li>
      <li><a href="regulation.html?id=ai-act"><strong>The AI Act, as a record</strong><span>Status, dates, provisions, claims, relationships and enforcement.</span></a></li>
      <li><a href="regulation.html?id=chips-act"><strong>A record with little in it</strong><span>The Chips Act: how a page says what is not recorded.</span></a></li>
      <li><a href="timeline.html"><strong>The timeline</strong><span>Every dated legal event, and every relationship between instruments.</span></a></li>
    </ul>
    <h2 id="numbers">The record, counted</h2>
    <p>Counted from the records on this page load. A figure carries what it cannot account for; an unknown is never added as zero.</p>
    ${figures(db, ix)}
    <h2 id="parts">The brief, in parts</h2>
    ${parts(db, ix)}`;
  fillToc(mount, mount.querySelector('.toc'));
});
