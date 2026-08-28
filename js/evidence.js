/* ============================================================
   The evidence layer.

   A Chicago-style superscript marker at the end of each block that
   makes a consequential claim; a numbered note list per Part; and a
   "Why this claim?" drawer carrying type, sources, legal basis,
   publication and verification dates, and regulatory status.

   Markers are re-injected after a language switch, because the i18n
   layer replaces innerHTML wholesale and would otherwise erase them.
   ============================================================ */

import { createDialog } from './dialog.js';
import * as F from './format.js';
import { label as taxLabel, note as taxNote } from './data.js';
import { sourceCard as sharedSourceCard, sourceList } from './evidence-view.js';

let IX = null;
let ORDER = [];              // [{n, claimId, el}] in document order
let dialogApi = null;
let panel = null;
let scrim = null;

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------------------------------------------------------- markers */

function buildOrder() {
  // Clear first: a marker carries its own claim reference, and a stale one
  // left in the DOM would be counted again on the next pass.
  for (const m of document.querySelectorAll('.fn')) m.remove();
  ORDER = [];
  let n = 0;
  for (const el of document.querySelectorAll('[data-claim]')) {
    for (const id of el.getAttribute('data-claim').split(/\s+/).filter(Boolean)) {
      if (!IX.claim.has(id)) continue;          // never render a marker onto nothing
      ORDER.push({ n: ++n, claimId: id, el });
    }
  }
}

function injectMarkers() {
  for (const { n, claimId, el } of ORDER) {
    const claim = IX.claim.get(claimId);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fn';
    b.textContent = n;
    // deliberately NOT data-claim: that attribute marks the blocks that make
    // claims, and a marker carrying it would be re-counted as one of them
    b.dataset.claimRef = claimId;
    b.dataset.family = F.familyOf(claim);
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-label',
      'Note ' + n + '. ' + F.typeOf(claim) + '. Why this claim?');
    if (F.isUnverified(claim)) b.dataset.unverified = '1';
    /* the grade is the finer signal: interpretation and unresolved are both
       "not a verified fact" but they are not the same thing */
    b.dataset.grade = F.evidenceGrade(claim, IX).id;
    el.appendChild(document.createTextNode(' '));
    el.appendChild(b);
  }
}

/* ---------------------------------------------------------- per-part notes */

function noteLine(entry) {
  const c = IX.claim.get(entry.claimId);
  const t = F.typeOf(c);
  const cites = (c.sources || []).map((s) => {
    const src = IX.source.get(s.source_id);
    if (!src) return null;
    const w = F.SUPPORTS_WORD[s.supports] || '';
    return F.citeHTML(src, IX, 'note') +
      (s.supports !== 'supports:direct' ? ' <span class="pn-tag">(' + esc(w) + ')</span>' : '');
  }).filter(Boolean);
  const body = cites.length ? cites.join('; ') : '<span class="evi-nourl">No source recorded.</span>';
  const unv = F.isUnverified(c)
    ? ' <span class="pn-tag" data-t="critique">requires verification</span>' : '';
  return '<li id="note-' + entry.n + '">' +
    '<span class="pn-n" data-family="' + F.familyOf(c) + '">' + entry.n + '.</span>' +
    '<span class="pn-body"><span class="pn-tag" data-t="' + t + '">' + esc(t) + '</span>' +
    body + unv + '</span></li>';
}

function injectPartNotes() {
  for (const old of document.querySelectorAll('.part-notes')) old.remove();
  const byPart = new Map();
  for (const e of ORDER) {
    const sec = e.el.closest('.part');
    if (!sec) continue;
    if (!byPart.has(sec)) byPart.set(sec, []);
    byPart.get(sec).push(e);
  }
  for (const [sec, entries] of byPart) {
    const host = sec.querySelector('.part-body') || sec;
    const d = document.createElement('details');
    d.className = 'part-notes';
    d.innerHTML = '<summary>Notes <span class="pn-count">' + entries.length + '</span></summary>' +
      '<ol>' + entries.map(noteLine).join('') + '</ol>';
    host.appendChild(d);
  }
}

/* ---------------------------------------------------------- legend */

function injectLegend() {
  const old = document.querySelector('.evi-legend');
  if (old) old.remove();
  const first = document.querySelector('#part-1 .part-body');
  if (!first) return;
  const l = document.createElement('div');
  l.className = 'evi-legend';
  l.innerHTML =
    '<b>Evidence</b>' +
    '<span class="lg-law">▪ law</span>' +
    '<span class="lg-fact">▪ fact</span>' +
    '<span class="lg-arg">▪ interpretation · critique · forecast</span>' +
    '<span>numbers open the source</span>' +
    '<a href="applies.html">What applies to me?</a>' +
    '<a href="instruments.html">Compare</a>' +
    '<a href="institutions.html">Institutions</a>' +
    '<a href="enforcement.html">Enforcement</a>' +
    '<a href="bibliography.html">Bibliography</a>';
  first.insertBefore(l, first.firstChild);
}

/* ---------------------------------------------------------- the drawer */

function statusFor(instrumentId) {
  const i = IX.instrument.get(instrumentId);
  if (!i) return null;
  const s = i.legislative_status;
  return {
    name: i.short_name,
    status: s ? taxLabel(IX, s) : 'Not established',
    slug: s ? s.split(':').pop() : 'unknown',
    asOf: i.status_as_of,
    note: i.status_note || (s ? taxNote(IX, s) : 'No primary source consulted for this instrument.'),
  };
}

function row(dt, dd, cls) {
  if (dd == null || dd === '') return '';
  return '<div class="evi-row"><dt>' + esc(dt) + '</dt><dd' +
    (cls ? ' class="' + cls + '"' : '') + '>' + dd + '</dd></div>';
}

/* The card itself lives in js/evidence-view.js, so the drawer and the
   instrument page cannot describe the same source differently — which they
   did once, when self-citation read as "press / advocacy" here and as itself
   everywhere else. */
const sourceCard = (ref) => sharedSourceCard(ref, IX, 'full');

function renderClaim(entry) {
  const c = IX.claim.get(entry.claimId);
  const t = F.typeOf(c);
  const unv = F.isUnverified(c);
  const g = F.evidenceGrade(c, IX);

  const basis = (c.legal_basis || []).map((p) => {
    const pr = IX.provision.get(p);
    const owner = IX.provisionOwner.get(p);
    const inst = owner ? IX.instrument.get(owner) : null;
    return pr ? esc((inst ? inst.short_name + ' ' : '') + 'Art. ' + pr.number) : esc(p);
  }).join(' · ');

  const insts = (c.institutions || []).map((id) => {
    const x = IX.institution.get(id);
    return x ? esc(x.short_name) : esc(id);
  }).join(' · ');

  const statuses = (c.instruments || []).map(statusFor).filter(Boolean);
  const statusHTML = statuses.length ? statuses.map((s) =>
    '<div class="evi-row"><dt>' + esc(s.name) + '</dt><dd>' +
    '<b>' + esc(s.status) + '</b>' + (s.asOf ? ' <span style="opacity:.7">as of ' + esc(F.humanDate(s.asOf)) + '</span>' : '') +
    (s.note ? '<br><span style="opacity:.8">' + esc(s.note) + '</span>' : '') +
    '</dd></div>').join('') : '';

  const cards = sourceList(c, IX, 'full');

  panel.innerHTML =
    '<div class="evi-head">' +
      '<button class="evi-close" type="button" aria-label="Close">&times;</button>' +
      '<span class="evi-eyebrow">Note ' + entry.n + ' · why this claim?</span>' +
      '<span class="evi-type" data-t="' + esc(t) + '">' + esc(t) + '</span>' +
      '<span class="evi-grade" data-g="' + esc(g.id) + '">' + esc(g.label) + '</span>' +
      '<p class="evi-type-note">' + esc(F.CLAIM_GLOSS[t] || '') + '</p>' +
      '<p class="evi-grade-note">' + esc(g.gloss) + '</p>' +
      '<p class="evi-statement" id="evi-title">' + esc(c.statement) + '</p>' +
    '</div>' +
    '<div class="evi-body">' +
      (g.id === 'unresolved'
        ? '<div class="evi-warn"><b>Unresolved</b>' +
          esc(c.verification_note || 'No directly supporting external source has been located for this claim.') +
          '</div>'
        : unv
          ? '<div class="evi-warn evi-warn-soft"><b>Open question on this record</b>' +
            esc(c.verification_note || '') + '</div>'
          : '') +
      (statusHTML ? '<div class="evi-sec"><h4>Regulatory status</h4><dl class="evi-dl">' + statusHTML + '</dl></div>' : '') +
      '<div class="evi-sec"><h4>Basis</h4><dl class="evi-dl">' +
        row('Legal basis', basis || '<span style="opacity:.7">none — this is not a claim about the text of an instrument</span>') +
        row('Institutions', insts) +
        row('Part', esc(c.brief_part || '—')) +
      '</dl></div>' +
      '<div class="evi-sec"><h4>Sources (' + (c.sources || []).length + ')</h4>' + cards + '</div>' +
      '<div class="evi-sec"><h4>Dates</h4><dl class="evi-dl">' +
        row('Published', esc(F.humanDate(c.published) || 'not recorded')) +
        row('Verified', c.last_verified
          ? esc(F.humanDate(c.last_verified))
          : '<span class="evi-nourl">never verified</span>') +
      '</dl></div>' +
      (!unv && c.verification_note
        ? '<div class="evi-sec"><h4>Note</h4><p class="evi-cite">' + esc(c.verification_note) + '</p></div>' : '') +
      '<div class="evi-foot">Claim ID <code>' + esc(c.id) + '</code>. ' +
        'Every source above is listed in the <a href="bibliography.html">bibliography</a>.</div>' +
    '</div>';

  panel.querySelector('.evi-close').addEventListener('click', () => dialogApi.close());
}

function ensureDialog() {
  if (dialogApi) return;
  scrim = document.createElement('div');
  scrim.className = 'evi-scrim';
  panel = document.createElement('aside');
  panel.className = 'evi';
  document.body.append(scrim, panel);
  dialogApi = createDialog(panel, scrim, {
    label: 'Evidence for this claim',
    onClose() {
      for (const b of document.querySelectorAll('.fn[aria-expanded="true"]')) b.setAttribute('aria-expanded', 'false');
    },
  });
}

function openFor(claimId, trigger) {
  const entry = ORDER.find((e) => e.claimId === claimId) || { n: '—', claimId };
  ensureDialog();
  renderClaim(entry);
  for (const b of document.querySelectorAll('.fn[aria-expanded="true"]')) b.setAttribute('aria-expanded', 'false');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  if (dialogApi.isOpen) { panel.focus({ preventScroll: true }); } else { dialogApi.open(trigger); }
}

/* ---------------------------------------------------------- boot */

export function initEvidence(ix) {
  IX = ix;
  const render = () => { buildOrder(); injectMarkers(); injectPartNotes(); injectLegend(); };
  render();

  // the i18n layer replaces innerHTML, which erases the markers; put them back
  document.addEventListener('i18n:applied', () => { render(); });

  // delegated, so markers survive being re-created
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.fn');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    openFor(b.dataset.claimRef, b);
  });

  return { openFor, get order() { return ORDER; } };
}
