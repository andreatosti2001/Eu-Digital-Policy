/* PV2-03 · view 3 of 4: an article — Part V of the brief (roadmap §8,
   "PV2-03, C.1 question 2"). The prose is read in place from index.html and
   re-set in one reading column; every passage that rests on a claim carries,
   in the margin (inline on a narrow screen), the claim's statement, its
   source and its evidence status as three separate things. The status strip
   at the head of the body is js/status.js's, imported, not rewritten. */

import { boot, esc, F, label, has, notRecorded, tag, evidenceTag, dateText, sourceShort, fillToc } from './common.js';
import { readBrief } from './brief.js';
import { initStatus } from '../../js/status.js';

const PART = 'part-5';
const NEEDED = ['taxonomy', 'instruments', 'timeline', 'claims', 'sources', 'glossary', 'brief'];

/* ---------------------------------------------------------- sanitising the brief's markup
   The source is the site's own index.html, but the prototype still keeps only
   what it means to keep: an allowlist of elements and attributes. Data and
   i18n attributes, classes and handlers are dropped; nothing executable
   survives (DOMParser output is inert in any case). */

const KEEP = new Set(['p', 'b', 'strong', 'i', 'em', 'a', 'br', 'ul', 'ol', 'li', 'sup', 'sub', 'code', 'span', 'abbr', 'q', 'blockquote',
  'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
  'svg', 'g', 'polygon', 'rect', 'line', 'path', 'circle', 'text', 'tspan', 'title', 'desc']);
const ATTRS = new Set(['href', 'id', 'role', 'aria-label', 'scope', 'colspan', 'rowspan',
  'viewBox', 'points', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'd', 'cx', 'cy', 'r', 'width', 'height', 'text-anchor']);
const SVG_CLASSES = /^(pyramid|pyr-[a-z-]+|fill-[a-z0-9-]+)$/;

function clean(node, terms) {
  if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const tagName = node.localName;

  if (tagName === 'button' && node.classList.contains('gloss')) {
    const t = node.getAttribute('data-term');
    if (t) terms.add(t);
    const a = document.createElement('a');
    a.className = 'term-link';
    a.href = '#term-' + t;
    a.textContent = node.textContent;
    return a;
  }
  let out;
  if (!KEEP.has(tagName)) {
    out = document.createDocumentFragment(); // unwrap: keep the text, drop the element
  } else {
    out = node.namespaceURI === 'http://www.w3.org/2000/svg'
      ? document.createElementNS(node.namespaceURI, tagName)
      : document.createElement(tagName);
    for (const at of node.attributes) {
      if (ATTRS.has(at.name) && !(at.name === 'href' && /^\s*javascript:/i.test(at.value))) out.setAttribute(at.name, at.value);
    }
    if (out.namespaceURI === 'http://www.w3.org/2000/svg' && node.getAttribute('class')) {
      const keep = node.getAttribute('class').split(/\s+/).filter((c) => SVG_CLASSES.test(c));
      if (keep.length) out.setAttribute('class', keep.join(' '));
    }
    /* an in-page anchor of the brief points at the current site, not at this page */
    if (tagName === 'a' && out.getAttribute('href')?.startsWith('#')) out.setAttribute('href', '../../index.html' + out.getAttribute('href'));
  }
  for (const child of node.childNodes) {
    const c = clean(child, terms);
    if (c) out.appendChild(c);
  }
  return out;
}

/* ---------------------------------------------------------- the margin */

const idsIn = (el, attr) => {
  const set = new Set();
  for (const x of [el, ...el.querySelectorAll('[' + attr + ']')]) {
    for (const id of String(x.getAttribute(attr) || '').split(/\s+/)) if (id) set.add(id);
  }
  return [...set];
};

/* The exact places in each source, kept with the statement so a long locator
   does not stretch the margin; nothing is shortened. */
function locators(c) {
  const with_ = (c.sources || []).filter((s) => s && typeof s === 'object');
  if (!with_.length) return '';
  return '<p>' + with_.map((s) => s.locator ? esc(s.locator) : notRecorded('locator not recorded')).join(' · ') + '</p>';
}

function claimNote(ix, id) {
  const c = ix.claim.get(id);
  if (!c) return `<div class="note"><span class="note-label">Claim</span><code>${esc(id)}</code> ${notRecorded('not found in claims.json')}</div>`;
  return `<div class="note"><span class="note-label">Claim</span><dl>
      <dt>Evidence</dt><dd>${evidenceTag(c)}</dd>
      <dt>Source</dt><dd>${has(c.sources) ? c.sources.map((s) => sourceShort(ix, s, { locator: false })).join('; ') : notRecorded('no source recorded')}</dd>
    </dl><details><summary>What is claimed, and where</summary><p>${esc(c.statement)}</p>${locators(c)}</details></div>`;
}

function eventsNote(ix, ids) {
  if (!ids.length) return '';
  return `<div class="note"><span class="note-label">Dated in the record</span><ul class="plain">` + ids.map((id) => {
    const e = ix.event.get(id);
    if (!e) return `<li><code>${esc(id)}</code> ${notRecorded('not found in timeline.json')}</li>`;
    return `<li><a href="timeline.html#${esc(id)}">${dateText(e.date, e.date_precision)}</a> · ${esc(label(ix, e.event_type))} · ${e.status === 'scheduled' ? 'scheduled' : e.status ? 'occurred' : notRecorded('status')}</li>`;
  }).join('') + '</ul></div>';
}

function proseNote(ix, el) {
  const p = el.getAttribute('data-prose') || el.querySelector('[data-prose]')?.getAttribute('data-prose');
  return p ? `<div class="note"><span class="note-label">Kind of passage</span>${tag(label(ix, p))}</div>` : '';
}

function notesFor(ix, el) {
  const html = proseNote(ix, el) + idsIn(el, 'data-claim').map((id) => claimNote(ix, id)).join('') + eventsNote(ix, idsIn(el, 'data-record'));
  return html ? `<aside class="notes" aria-label="Evidence for the passage">${html}</aside>` : '';
}

/* ---------------------------------------------------------- the body */

function block(ix, el, terms) {
  const wrap = document.createElement('div');
  wrap.className = 'blk';
  const name = el.localName;
  let main;
  if (name === 'h3' || name === 'h4') {
    main = document.createElement(name === 'h3' ? 'h2' : 'h3'); // the page's h1 is the part's title: sequential, no skip
    if (el.id) main.id = el.id;
    main.textContent = el.textContent.trim();
  } else if (name === 'aside' && el.classList.contains('box')) {
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
  wrap.appendChild(main);
  wrap.insertAdjacentHTML('beforeend', notesFor(ix, el));
  return wrap;
}

function termsSection(ix, terms) {
  if (!terms.size) return '';
  const byLegacy = new Map([...ix.term.values()].map((t) => [t.legacy_dom_id, t]));
  return `<h2 id="terms">Terms in this part</h2><dl class="terms measure">` + [...terms].sort().map((k) => {
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
  if (title) document.title = `Part V · ${title} · Editorial prototype`;

  const terms = new Set();
  const thread = sec.querySelector('aside.thread');
  const threadItems = thread ? [...thread.querySelectorAll('li')] : [];

  mount.innerHTML = `
    <header class="head">
      <p class="kicker label">Part ${esc(meta?.roman || 'V')} of the brief · ${meta?.reading_minutes != null ? esc(meta.reading_minutes) + ' min read' : notRecorded('reading time not recorded')}</p>
      <h1>${title ? esc(title) : notRecorded('title not found')}</h1>
      ${dek ? `<p class="lede">${esc(dek)}</p>` : ''}
      <p class="meta">${claims.length ? `${esc(F.plural(claims.length, 'claim'))} rest under this part: ${tallyLine}. Each passage's evidence is in the margin.` : 'No claim is recorded for this part.'}</p>
    </header>
    <div class="toc"><nav aria-labelledby="toc-h"><h2 id="toc-h">On this page</h2><ol></ol></nav></div>
    ${threadItems.length ? `<section class="thread" aria-labelledby="in-short"><h2 id="in-short">In short</h2><ul></ul></section>` : ''}
    <div id="${PART}"><div class="part-body"></div></div>`;

  const ul = mount.querySelector('.thread ul');
  for (const li of threadItems) ul.appendChild(clean(li, terms));

  const body = mount.querySelector('.part-body');
  const src = sec.querySelector('.part-body');
  for (const el of src ? src.children : []) {
    if (el.classList.contains('recap')) { for (const b of el.querySelectorAll('[data-term]')) terms.add(b.getAttribute('data-term')); continue; }
    body.appendChild(block(ix, el, terms));
  }
  initStatus(ix); // js/status.js: the AI Act's status strip at the head of the body, as on the site
  body.insertAdjacentHTML('beforeend', termsSection(ix, terms) +
    `<p class="meta measure">Read the same part <a href="../../index.html#${PART}">in the current site</a>, or the <a href="regulation.html?id=ai-act">AI Act as a record</a>.</p>`);
  fillToc(mount, mount.querySelector('.toc'));
}, { part: PART });
