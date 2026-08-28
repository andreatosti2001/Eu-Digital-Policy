/* ============================================================
   Cross-instrument interactions.

   instruments.json has carried a top-level relationships[] array since
   the first data phase, and until now the only thing that read it was
   the "Related" column on the instrument page, which rendered the other
   instrument's name and the kind label and dropped everything else —
   the summary sentence that says *how* the two interact, the provisions
   that carry the interaction, the claims that argue it and the sources
   that support it. That is the whole analytical payload of the record.

   This module renders the edge as what it is: a directed, typed,
   sourced statement about two instruments. Two surfaces use it —
   [data-render="interactions"] in the brief, and the instrument page —
   and both call the same block builder, so a change to how an
   interaction reads happens once.

   Nothing here invents a connection. Seventeen edges are recorded; the
   view says seventeen and says that seventeen is what has been written
   down, not what exists.
   ============================================================ */

import { load, index, label as taxLabel, note as taxNote, renderError } from './data.js';
import * as F from './format.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Ordered by how much a reader needs to know about them. A conflict
   between two instruments is a compliance problem today; a repeal is
   housekeeping. */
const KIND_ORDER = [
  'rel-kind:conflict',
  'rel-kind:overlap',
  'rel-kind:lex-specialis',
  'rel-kind:carve-out',
  'rel-kind:complement',
  'rel-kind:sequence',
  'rel-kind:implements',
  'rel-kind:amends',
  'rel-kind:repeals',
  'rel-kind:legal-basis',
];

const kindRank = (k) => {
  const i = KIND_ORDER.indexOf(k);
  return i === -1 ? KIND_ORDER.length : i;
};

const shortName = (ix, id) => {
  const i = ix.instrument.get(id);
  return i ? i.short_name : id;
};

const instLink = (ix, id, current) => {
  const name = esc(shortName(ix, id));
  if (id === current) return '<b class="ix-self">' + name + '</b>';
  return '<a href="instrument.html?id=' + esc(id) + '">' + name + '</a>';
};

/* ------------------------------------------------------------ one edge */

/**
 * One relationship, rendered whole.
 * @param {object} r   the relationship record
 * @param {object} ix  the built index
 * @param {string} [current]  instrument id to mark as "this one"
 */
export function interactionBlock(r, ix, current) {
  const kind = esc(taxLabel(ix, r.kind) || String(r.kind).split(':').pop());
  const kindNote = taxNote(ix, r.kind);

  /* Direction is not decoration. "AI Omnibus amends AI Act" and "AI Act
     amends AI Omnibus" are different statements and only one is true, so
     the edge is always drawn from -> to and never flipped to put the
     page's own instrument first. Symmetric kinds say so instead. */
  const arrow = r.symmetric
    ? '<span class="ix-rel" data-sym="1">' + kind + '</span>'
    : '<span class="ix-rel">' + kind + '</span>';

  const head = '<p class="ix-head">' +
    instLink(ix, r.from, current) + ' ' + arrow + ' ' + instLink(ix, r.to, current) +
    '</p>';

  const provisions = (r.provisions || []).map((pid) => {
    const p = ix.provision.get(pid);
    const owner = ix.provisionOwner.get(pid);
    const text = p
      ? shortName(ix, owner) + ' Art. ' + p.number
      : String(pid).replace(':art-', ' Art. ');
    const title = p && p.heading ? ' title="' + esc(p.heading) + '"' : '';
    return '<span class="ix-prov"' + title + '>' + esc(text) + '</span>';
  }).join('');

  /* A claim attached to an edge is the argument the brief makes about it.
     Its grade is derived the same way it is everywhere else, so an
     interaction resting on the brief's own assertion says so here too. */
  const claims = (r.claims || []).map((cid) => {
    const c = ix.claim.get(cid);
    if (!c) return '';
    const g = F.evidenceGrade(c, ix);
    return '<li><span class="ix-grade" data-g="' + esc(g.id) + '">' + esc(g.label) + '</span>' +
      '<span class="ix-claim-txt">' + esc(c.statement || c.id) + '</span></li>';
  }).filter(Boolean).join('');

  const sources = (r.sources || []).map((sid) => {
    const s = ix.source.get(sid);
    if (!s) return '';
    const name = esc(s.publisher_name || s.title || sid);
    const tier = esc(F.tierWord(s) || '');
    const inner = '<span class="ix-src-n">' + name + '</span>' +
      (tier ? '<span class="ix-src-t">' + tier + '</span>' : '');
    if (s.url) {
      return '<li><a href="' + esc(s.url) + '" rel="noopener noreferrer" target="_blank">' +
        inner + '</a></li>';
    }
    /* the brief citing itself is not a source missing a URL; tierWord
       already says what it is, and adding "no URL located" would imply
       there is a document to go and find */
    const why = s.id === 'src-brief-original' ? '' :
      '<span class="ix-src-t">no URL located</span>';
    return '<li>' + inner + why + '</li>';
  }).filter(Boolean).join('');

  const flag = r.requires_verification
    ? '<p class="ix-flag"><b>Characterisation requires verification.</b> ' +
      esc(r.verification_note || 'Not established from a primary source in this build.') + '</p>'
    : '';

  return '<article class="ix-edge" data-kind="' + esc(String(r.kind).split(':').pop()) + '"' +
      (r.requires_verification ? ' data-unverified="1"' : '') + '>' +
    head +
    (kindNote ? '<p class="ix-kindnote">' + esc(kindNote) + '</p>' : '') +
    '<p class="ix-sum">' + esc(r.summary || '') + '</p>' +
    flag +
    (provisions ? '<div class="ix-provs"><span class="ix-k">Carried by</span>' + provisions + '</div>' : '') +
    (claims ? '<div class="ix-block"><span class="ix-k">What the brief argues</span><ul class="ix-claims">' + claims + '</ul></div>' : '') +
    (sources ? '<div class="ix-block"><span class="ix-k">Sources</span><ul class="ix-srcs">' + sources + '</ul></div>' : '') +
    (r.last_verified ? '<p class="ix-when">Recorded as at ' + esc(F.citeDate(r.last_verified)) + '</p>' : '') +
    '</article>';
}

/**
 * Every edge touching one instrument, strongest-first, for the instrument page.
 * Returns '' when the instrument has no recorded edges — the caller decides
 * what to say about that, because "none recorded" is a statement about the
 * dataset and not about the law.
 */
export function interactionsFor(instrumentId, ix) {
  const rels = (ix.relationship || [])
    .filter((r) => r.from === instrumentId || r.to === instrumentId)
    .sort((a, b) => kindRank(a.kind) - kindRank(b.kind));
  if (!rels.length) return '';
  return rels.map((r) => interactionBlock(r, ix, instrumentId)).join('');
}

/* ------------------------------------------------------- the brief mount */

function overview(ix) {
  const rels = (ix.relationship || []).slice().sort((a, b) =>
    kindRank(a.kind) - kindRank(b.kind) ||
    String(a.from).localeCompare(String(b.from)));

  if (!rels.length) {
    return '<p class="mount-fallback">No cross-instrument relationship is recorded.</p>';
  }

  const touched = new Set();
  for (const r of rels) { touched.add(r.from); touched.add(r.to); }
  const unverified = rels.filter((r) => r.requires_verification).length;

  /* Grouped by kind so the reader meets the conflicts first and the
     housekeeping last, rather than an alphabetical soup. */
  const groups = [];
  for (const k of KIND_ORDER) {
    const inK = rels.filter((r) => r.kind === k);
    if (!inK.length) continue;
    groups.push(
      '<h4 class="ix-group">' + esc(taxLabel(ix, k) || k) +
        '<span class="ix-count">' + inK.length + '</span></h4>' +
      inK.map((r) => interactionBlock(r, ix)).join('')
    );
  }
  const rest = rels.filter((r) => kindRank(r.kind) === KIND_ORDER.length);
  if (rest.length) {
    groups.push('<h4 class="ix-group">Other<span class="ix-count">' + rest.length + '</span></h4>' +
      rest.map((r) => interactionBlock(r, ix)).join(''));
  }

  return '<div class="ix-lede">' +
      '<p><b>' + rels.length + ' interactions recorded, touching ' + touched.size + ' of the ' +
      /* the index maps aliases onto the same object, so counting keys would
         over-report; count distinct records */
      new Set([...ix.instrument.values()]).size + ' instruments in the dataset.</b> ' +
      'Each one is a stored record with a direction, a type, the provisions that carry it and its own ' +
      'sources — not a line drawn between two boxes. Where the brief is the only thing asserting the ' +
      'connection, the block says so.</p>' +
      '<p class="ix-caveat">This is what has been written down, not a complete map of the rulebook. ' +
      'An interaction absent here has not been recorded; that is not a finding that it does not exist.' +
      (unverified ? ' ' + unverified + ' of the ' + rels.length +
        ' carry a characterisation that is not established from a primary source, and are marked.' : '') +
      '</p>' +
    '</div>' +
    '<div class="ix-list">' + groups.join('') + '</div>';
}

/** Mount every [data-render="interactions"] in the page. */
export async function initInteractions(ix) {
  const mounts = document.querySelectorAll('[data-render="interactions"]');
  if (!mounts.length) return;

  let scope = ix;
  if (!scope) {
    /* stand-alone path: the module can be used on a page that has not
       already built the index */
    const [taxonomy, instruments, sources, claims] = await Promise.all(
      ['taxonomy', 'instruments', 'sources', 'claims'].map(load));
    scope = index({ taxonomy, instruments, sources, claims });
  }

  let html;
  try {
    html = overview(scope);
  } catch (e) {
    for (const m of mounts) renderError(m, e, () => initInteractions(ix));
    return;
  }
  for (const m of mounts) m.innerHTML = html;
}
