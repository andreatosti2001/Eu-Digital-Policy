/* ============================================================
   EVIDENCE, RENDERED — one implementation.

   A source attached to a claim was being drawn in two places: the
   "Why this claim?" drawer, and (as of the instrument page) the
   evidence section of a detail view. Two renderers of the same
   object is how a tier ends up worded one way in one place and
   another way somewhere else — which has already happened once
   here, when self-citation was described to the reader as
   "press / advocacy" in the drawer and as itself everywhere else.

   So there is one function. It takes a density rather than a
   caller: `full` for the drawer, where the reader has asked for the
   apparatus, and `compact` for a list, where thirty of these sit one
   under another and the Chicago note and the accessed date are
   noise. Both emit the same classes and the same words.

   Nothing here decides anything. The grade, the tier word and the
   supports word all come from format.js, which is where those
   judgements are made and where they can be audited.
   ============================================================ */

import * as F from './format.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SELF = 'src-brief-original';

/** The status glyph a supports-qualifier maps to. Context-only is rendered so
 *  that it cannot be mistaken for a citation, which is the whole reason the
 *  field is stored rather than inferred. */
const SUPPORTS_STATUS = {
  'supports:direct': 'verified',
  'supports:partial': 'provisional',
  'supports:context': 'secondary',
};

function row(dt, dd) {
  if (dd == null || dd === '') return '';
  return '<div class="evi-row"><dt>' + esc(dt) + '</dt><dd>' + dd + '</dd></div>';
}

/**
 * One source, as attached to one claim.
 * @param {object} ref  {source_id, supports, locator}
 * @param {object} ix   the built index
 * @param {'full'|'compact'} density
 */
export function sourceCard(ref, ix, density = 'full') {
  const src = ix.source.get(ref.source_id);
  if (!src) return '';
  const sup = String(ref.supports || '').split(':').pop();
  const publisher = src.publisher && ix.institution.has(src.publisher)
    ? (ix.institution.get(src.publisher).full_name || ix.institution.get(src.publisher).short_name)
    : src.publisher_name;

  const head =
    '<div class="evi-src-top">' +
      '<span class="evi-tier" data-tier="' + esc(src.id === SELF ? 'self' : src.tier) + '">' +
        esc(F.tierWord(src)) + '</span>' +
      '<span class="badge" data-st="' + (SUPPORTS_STATUS[ref.supports] || 'secondary') + '"' +
        ' title="' + esc(F.SUPPORTS_GLOSS[ref.supports] || '') + '">' +
        esc(F.SUPPORTS_WORD[ref.supports] || sup) + '</span>' +
    '</div>';

  if (density === 'compact') {
    /* the title carries the link, because in a list the title is the thing a
       reader scans for and a bare "EUR-Lex" repeated twelve times is not a
       distinguishing label */
    const title = esc(src.title || publisher || src.id);
    const linked = src.url
      ? '<a class="ext" href="' + esc(src.url) + '" rel="noopener">' + title + '</a>'
      : title + '<span class="evi-nourl" title="' +
        esc(src.resolution === 'publication-not-identified'
          ? 'The brief refers to this body of work without naming a publication. There is no document to link to until the reference is pinned.'
          : 'No public URL has been located for this source.') +
        '">no link</span>';
    return '<div class="evi-src is-compact" data-supports="' + esc(sup) + '">' +
      head + '<p class="evi-cite">' + linked +
      (publisher && src.title ? ' — ' + esc(publisher) : '') +
      (src.published ? ' <span class="evi-when">' + esc(F.humanDate(src.published)) + '</span>' : '') +
      (ref.locator ? ' <span class="evi-loc">' + esc(ref.locator) + '</span>' : '') +
      '</p></div>';
  }

  return '<div class="evi-src" data-supports="' + esc(sup) + '">' +
    head +
    '<p class="evi-cite">' + F.citeHTML(src, ix, 'note') + '</p>' +
    (publisher
      ? '<dl class="evi-dl">' + row('Institution', esc(publisher)) +
        row('Published', esc(F.humanDate(src.published) || 'not recorded')) +
        row('Accessed', esc(F.humanDate(src.accessed) || '—')) + '</dl>'
      : '') +
    (ref.locator ? '<div class="evi-foot">at ' + esc(ref.locator) + '</div>' : '') +
    '</div>';
}

/** Every source on a claim, or an honest statement that there are none. */
export function sourceList(claim, ix, density = 'full') {
  const out = (claim.sources || []).map((r) => sourceCard(r, ix, density)).join('');
  if (out) return out;
  return '<div class="evi-warn"><b>No source recorded</b>' +
    'This claim has no source attached at all.</div>';
}

/** The grade, with the gloss that says what the grade means. */
export function gradeChip(claim, ix, withGloss = false) {
  const g = F.evidenceGrade(claim, ix);
  return '<span class="evi-grade" data-g="' + esc(g.id) + '">' + esc(g.label) + '</span>' +
    (withGloss ? '<span class="evi-gloss">' + esc(g.gloss) + '</span>' : '');
}

/* ============================================================
   FRESHNESS — how old a record is, said in words as well as in hue.

   The interval is short on purpose. This subject moves: a status or
   an enforcement position four months old is not evidence of
   anything current, and a page that looks authoritative while being
   stale is the specific failure mode a reference work has.
   ============================================================ */

export const STALE_DAYS = 120;

export function freshness(iso, whatFor) {
  if (!iso) {
    return '<span class="fresh"><span class="fresh-flag">no verification date recorded</span></span>';
  }
  const days = Math.round((Date.now() - Date.parse(iso + 'T00:00:00Z')) / 864e5);
  return '<span class="fresh">Last verified <b>' + esc(F.humanDate(iso)) + '</b>' +
    (whatFor ? ' <span>· ' + esc(whatFor) + '</span>' : '') +
    (Number.isFinite(days) ? ' <span>· ' + (days <= 0 ? 'today' : days + ' days ago') + '</span>' : '') +
    (days > STALE_DAYS ? ' <span class="fresh-flag">review recommended</span>' : '') +
    '</span>';
}
