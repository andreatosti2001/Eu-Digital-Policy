/* PV2-03 · view 1 of 4: the homepage (the brief's opening, the record
   counted, the parts). Every figure is counted from the records on this run
   and carries what it cannot account for beside it. */

import { boot, esc, F, label, has, notRecorded, unknown, fillToc } from './common.js';
import { readBrief, textOf } from './brief.js';
import { aggregate, actionsOnly } from '../../js/pipeline.js';

const NEEDED = ['taxonomy', 'instruments', 'timeline', 'claims', 'sources', 'enforcement', 'brief'];

function countBy(items, key) {
  const m = new Map();
  for (const x of items) m.set(key(x), (m.get(key(x)) || 0) + 1);
  return m;
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

  return `<div class="figures">
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
  return '<ul class="parts">' + list.map((p) => {
    const href = p.id === 'part-5' ? 'article.html' : `../../index.html#${encodeURIComponent(p.id)}`;
    const n = (ix.claimsByPart.get(p.id) || []).length;
    const mins = p.reading_minutes != null ? `${esc(p.reading_minutes)} min` : notRecorded('reading time not recorded');
    const word = p.kind === 'annex' ? 'Annex' : 'Part';
    return `<li><span class="roman" aria-hidden="true">${esc(p.roman || '')}</span><div>
      <h3><a href="${href}">${esc(p.title || p.id)}</a></h3>
      ${p.dek ? `<p>${esc(p.dek)}</p>` : `<p>${notRecorded('dek not recorded')}</p>`}
      <p class="meta">${word} ${esc(p.roman || '')} · ${mins} · ${n ? esc(F.plural(n, 'claim')) : 'no claim recorded for this part'}${p.id === 'part-5' ? ' · <b>the article view</b>' : ' · opens in the current site'}</p>
    </div></li>`;
  }).join('') + '</ul>';
}

boot(NEEDED, async (db, ix, mount) => {
  const doc = await readBrief();
  const title = textOf(doc, '.portal-masthead h1');
  const stand = textOf(doc, '.portal-masthead .portal-stand');
  const intro = textOf(doc, '.hero .stand');
  const advice = textOf(doc, '.hero .hero-meta');

  mount.innerHTML = `
    <p class="kicker">An analytical brief on the EU digital acquis</p>
    <h1>${title ? esc(title) : notRecorded('title not found in index.html')}</h1>
    ${stand ? `<p class="lede">${esc(stand)}</p>` : ''}
    ${intro ? `<p class="measure">${esc(intro)}</p>` : ''}
    ${advice ? `<p class="dek">${esc(advice)}</p>` : ''}

    <nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h">On this page</h2><ol></ol></nav>

    <h2 id="views">Four ways in</h2>
    <ul class="views">
      <li><a href="article.html"><strong>Read Part V</strong><span>The AI Act: the risk pyramid, the compute threshold and the delay — with its evidence in the margin.</span></a></li>
      <li><a href="regulation.html?id=ai-act"><strong>The AI Act, as a record</strong><span>Status, dates, provisions, claims, relationships and enforcement.</span></a></li>
      <li><a href="regulation.html?id=chips-act"><strong>A record with little in it</strong><span>The Chips Act: how the page says what is not recorded.</span></a></li>
      <li><a href="timeline.html"><strong>The timeline</strong><span>Every dated legal event, and every relationship between instruments.</span></a></li>
    </ul>

    <h2 id="numbers">The record, counted</h2>
    <p class="measure">Counted from the records on this page load. A figure carries what it cannot account for; an unknown is never added as zero.</p>
    ${figures(db, ix)}

    <h2 id="parts">The brief, in parts</h2>
    ${parts(db, ix)}`;
  fillToc(mount, mount.querySelector('.toc'));
});
