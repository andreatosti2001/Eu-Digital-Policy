/* PV2-04 · view 3 of 4: an article — Part V of the brief (roadmap §8,
   "PV2-03, C.1 question 2": the same text as the Editorial's). The prose is
   read in place from index.html; in this direction the evidence is not in a
   margin beside each passage but in an EVIDENCE LEDGER beside the text: every
   claim the part rests on is numbered once, in reading order, and each
   passage carries the numbers of its claims. A ledger entry keeps the
   statement, its source and its evidence status as three things, with the
   exact locators, and links back to the passages that cite it. The status
   strip at the head of the body is js/status.js's, imported. */

import { boot, esc, F, label, has, notRecorded, tag, evidenceTag, dateText, sourceShort } from './common.js';
import { readBrief } from '../editorial/brief.js';
import { initStatus } from '../../js/status.js';

const PART = 'part-5';
const NEEDED = ['taxonomy', 'instruments', 'timeline', 'claims', 'sources', 'glossary', 'brief'];

/* ---------------------------------------------------------- sanitising the brief's markup
   An allowlist of elements and attributes: data and i18n attributes, classes
   and handlers are dropped; DOMParser's output is inert in any case. The
   glossary buttons become links to the terms listed under the part. */

const KEEP = new Set(['p', 'b', 'strong', 'i', 'em', 'a', 'br', 'ul', 'ol', 'li', 'sup', 'sub', 'code', 'span', 'abbr', 'q', 'blockquote',
  'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
  'svg', 'g', 'polygon', 'rect', 'line', 'path', 'circle', 'text', 'tspan', 'title', 'desc']);
const ATTRS = new Set(['href', 'id', 'role', 'aria-label', 'scope', 'colspan', 'rowspan',
  'viewBox', 'points', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'd', 'cx', 'cy', 'r', 'width', 'height', 'text-anchor']);
const SVG_CLASSES = /^(pyramid|pyr-[a-z-]+|fill-[a-z0-9-]+)$/;
const SVG_NS = 'http://www.w3.org/2000/svg';

function clean(node, terms) {
  if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const name = node.localName;
  if (name === 'button' && node.classList.contains('gloss')) {
    const t = node.getAttribute('data-term');
    if (t) terms.add(t);
    const a = document.createElement('a');
    a.className = 'term-link';
    a.href = '#term-' + t;
    a.textContent = node.textContent;
    return a;
  }
  let out;
  if (!KEEP.has(name)) out = document.createDocumentFragment();
  else {
    out = node.namespaceURI === SVG_NS ? document.createElementNS(SVG_NS, name) : document.createElement(name);
    for (const at of node.attributes) {
      if (ATTRS.has(at.name) && !(at.name === 'href' && /^\s*javascript:/i.test(at.value))) out.setAttribute(at.name, at.value);
    }
    if (out.namespaceURI === SVG_NS && node.getAttribute('class')) {
      const keep = node.getAttribute('class').split(/\s+/).filter((c) => SVG_CLASSES.test(c));
      if (keep.length) out.setAttribute('class', keep.join(' '));
    }
    if (name === 'a' && out.getAttribute('href')?.startsWith('#')) out.setAttribute('href', '../../index.html' + out.getAttribute('href'));
  }
  for (const child of node.childNodes) { const c = clean(child, terms); if (c) out.appendChild(c); }
  return out;
}

const idsIn = (el, attr) => {
  const set = new Set();
  for (const x of [el, ...el.querySelectorAll('[' + attr + ']')]) {
    for (const id of String(x.getAttribute(attr) || '').split(/\s+/)) if (id) set.add(id);
  }
  return [...set];
};

/* ---------------------------------------------------------- the ledger */

function ledgerEntry(ix, id, n, passages) {
  const back = passages.map((p, i) => `<a href="#${esc(p)}">passage ${i + 1}</a>`).join(', ');
  const c = ix.claim.get(id);
  if (!c) {
    return `<li id="lg-${esc(id)}"><span class="lg-n">[${n}]</span><code>${esc(id)}</code> ${notRecorded('not found in claims.json')}
      <p class="back">Cited in ${back}</p></li>`;
  }
  const locs = (c.sources || []).filter((s) => s && typeof s === 'object');
  return `<li id="lg-${esc(id)}"><span class="lg-n">[${n}]</span>${evidenceTag(c)}
    <dl>
      <dt>Stated</dt><dd class="stmt">${esc(c.statement)}</dd>
      <dt>Source</dt><dd>${has(c.sources) ? c.sources.map((s) => sourceShort(ix, s, { locator: false })).join('; ') : notRecorded('no source recorded')}</dd>
      <dt>Where</dt><dd class="loc">${locs.length ? locs.map((s) => s.locator ? esc(s.locator) : notRecorded('locator not recorded')).join(' · ') : notRecorded('no locator recorded')}</dd>
    </dl>
    <p class="back">Cited in ${back}</p></li>`;
}

function eventsList(ix, ids) {
  if (!ids.length) return '';
  return `<h3>Dated in the record</h3><ol>` + ids.map((id) => {
    const e = ix.event.get(id);
    if (!e) return `<li><code>${esc(id)}</code> ${notRecorded('not found in timeline.json')}</li>`;
    return `<li><a href="timeline.html?instrument=${encodeURIComponent(e.instrument)}">${dateText(e.date, e.date_precision)}</a> · ${esc(label(ix, e.event_type))} · ${e.status === 'scheduled' ? 'scheduled' : e.status ? 'occurred' : notRecorded('status')}</li>`;
  }).join('') + '</ol>';
}

/* ---------------------------------------------------------- the body */

function block(ix, el, terms, numbering, pid) {
  const name = el.localName;
  let main;
  if (name === 'h3' || name === 'h4') {
    main = document.createElement(name === 'h3' ? 'h2' : 'h3'); // the page's h1 is the part's title: sequential, no skip
    if (el.id) main.id = el.id;
    main.textContent = el.textContent.trim();
    return main;
  }
  if (name === 'aside' && el.classList.contains('box')) {
    main = document.createElement('aside');
    main.className = 'box';
    const lab = el.querySelector('.box-label');
    const h = el.querySelector('h4');
    const body = el.querySelector('.box-body');
    main.innerHTML = `<span class="box-label">${esc(lab ? lab.textContent.trim() : 'Note')}</span>` + (h ? `<h3>${esc(h.textContent.trim())}</h3>` : '');
    const p = document.createElement('p');
    if (body) for (const c of body.childNodes) { const k = clean(c, terms); if (k) p.appendChild(k); }
    main.appendChild(p);
  } else {
    main = clean(el, terms);
  }
  const claims = idsIn(el, 'data-claim');
  const wrap = document.createElement('div');
  wrap.className = 'passage';
  wrap.id = pid;
  const kind = el.getAttribute('data-prose') || el.querySelector('[data-prose]')?.getAttribute('data-prose');
  if (kind) wrap.insertAdjacentHTML('beforeend', `<span class="passage-kind">${esc(label(ix, kind))}</span>`);
  wrap.appendChild(main);
  if (claims.length) {
    const marks = claims.map((id) => {
      if (!numbering.has(id)) numbering.set(id, { n: numbering.size + 1, passages: [] });
      const entry = numbering.get(id);
      entry.passages.push(pid);
      return `<a class="cite" href="#lg-${esc(id)}" aria-label="Evidence ${entry.n} in the ledger">${entry.n}</a>`;
    }).join('');
    const target = main.nodeType === Node.ELEMENT_NODE && main.lastElementChild && main.localName !== 'p' ? main.lastElementChild : main;
    (target.nodeType === Node.ELEMENT_NODE ? target : wrap).insertAdjacentHTML('beforeend', marks);
  }
  return wrap;
}

function termsSection(ix, terms) {
  if (!terms.size) return '';
  const byLegacy = new Map([...ix.term.values()].map((t) => [t.legacy_dom_id, t]));
  return `<h2 id="terms">Terms in this part</h2><dl class="terms">` + [...terms].sort().map((k) => {
    const t = byLegacy.get('gloss-' + k) || ix.term.get('gl-' + k);
    return `<dt id="term-${esc(k)}">${esc(t ? t.term : k)}</dt><dd>${t && t.definition ? esc(t.definition) : notRecorded('definition not found in glossary.json')}</dd>`;
  }).join('') + '</dl>';
}

boot(NEEDED, async (db, ix, mount) => {
  const doc = await readBrief();
  const sec = doc.getElementById(PART);
  const meta = (db.brief?.parts || []).find((p) => p.id === PART);
  if (!sec) {
    mount.innerHTML = `<h1>Part V</h1><p class="empty"><b>The text of this part was not found</b> in <code>index.html</code> (<code>#${PART}</code>). Nothing has been substituted.</p>`;
    return;
  }
  const title = (sec.querySelector('.part-head h2')?.textContent || meta?.title || '').trim();
  const dek = sec.querySelector('.part-dek')?.textContent.trim() || meta?.dek;
  const claims = ix.claimsByPart.get(PART) || [];
  const tally = new Map();
  for (const c of claims) { const s = F.evidenceStatus(c); tally.set(s, (tally.get(s) || 0) + 1); }
  const tallyLine = [...tally].sort((a, b) => b[1] - a[1]).map(([s, n]) => `${n} ${esc((F.EVIDENCE_WORD[s] || s).toLowerCase())}`).join(' · ');
  if (title) document.title = `Part V · ${title} · Observatory prototype`;

  const terms = new Set();
  const numbering = new Map();
  const thread = sec.querySelector('aside.thread');
  const threadItems = thread ? [...thread.querySelectorAll('li')] : [];

  mount.innerHTML = `
    <header class="head">
      <p class="kicker">Part ${esc(meta?.roman || 'V')} of the brief · ${meta?.reading_minutes != null ? esc(meta.reading_minutes) + ' min read' : notRecorded('reading time not recorded')}</p>
      <h1>${title ? esc(title) : notRecorded('title not found')}</h1>
      ${dek ? `<p class="lede">${esc(dek)}</p>` : ''}
      <p class="meta">${claims.length ? `${esc(F.plural(claims.length, 'claim'))} are recorded under this part: ${tallyLine}. The numbers in the text open the evidence ledger.` : 'No claim is recorded for this part.'}</p>
    </header>
    <div class="article-grid">
      <div class="body-col">
        ${threadItems.length ? `<section class="thread" aria-labelledby="in-short"><h2 id="in-short">In short</h2><ul></ul></section>` : ''}
        <div id="${PART}"><div class="part-body"></div></div>
      </div>
      <aside class="ledger" aria-labelledby="ledger"><nav class="onpage-here" aria-labelledby="onpage-here-h"><h2 id="onpage-here-h">On this page</h2><ol></ol></nav><h2 id="ledger">Evidence ledger</h2><p class="meta" id="ledger-h">Each claim the text cites, numbered once in reading order: what is stated, what it rests on, and how far that evidence carries it.</p><ol id="ledger-list"></ol><div id="ledger-events"></div></aside>
    </div>`;

  const ul = mount.querySelector('.thread ul');
  for (const li of threadItems) ul.appendChild(clean(li, terms));

  const body = mount.querySelector('.part-body');
  const src = sec.querySelector('.part-body');
  const records = new Set();
  let i = 0;
  for (const el of src ? src.children : []) {
    if (el.classList.contains('recap')) { for (const b of el.querySelectorAll('[data-term]')) terms.add(b.getAttribute('data-term')); continue; }
    for (const r of idsIn(el, 'data-record')) records.add(r);
    body.appendChild(block(ix, el, terms, numbering, 'p5-' + (++i)));
  }
  initStatus(ix); // js/status.js: the AI Act's status strip at the head of the body, as on the site
  body.insertAdjacentHTML('beforeend', termsSection(ix, terms) +
    `<p class="meta">Read the same part <a href="../../index.html#${PART}">in the current site</a>, or the <a href="regulation.html?id=ai-act">AI Act as a record</a>.</p>`);

  mount.querySelector('#ledger-list').innerHTML = numbering.size
    ? [...numbering].map(([id, e]) => ledgerEntry(ix, id, e.n, e.passages)).join('')
    : `<li>${notRecorded('no claim is cited in this part')}</li>`;
  mount.querySelector('#ledger-events').innerHTML = eventsList(ix, [...records]);
}, { part: PART });
