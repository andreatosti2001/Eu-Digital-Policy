/* ============================================================
   agent/verifier/locate.mjs — where in the document a proposition
   actually sits

   `docs/VERIFICATION-POLICY.md` §1: a verification is a named human
   or agent opening the source and confirming it says what the
   record says it says. "The document supports it" with no locator
   is not that — it is unfalsifiable, and the
   `legal-source-verification` skill lists "Verified." with no
   locator as the canonical bad note.

   So every proposition gets a place or an admission that it has
   none. `null` here means the document was read and no structural
   marker governs the passage — a press release with no articles has
   no article, and saying so is correct. It never means the lookup
   was skipped.

   The marker is taken from the nearest one AT OR BEFORE the
   proposition, because that is how a legal text is organised: a
   sentence belongs to the last heading that opened above it. A
   marker inside the sentence itself wins, since a sentence that
   names its own article is telling you where it is.
   ============================================================ */

const ARTICLE = /\bArt(?:icle|\.)\s*(\d+[a-z]?)\s*(?:\(\s*([0-9]+[a-z]?|[a-z])\s*\))?/gi;
const RECITAL = /\bRecital\s+\(?(\d+)\)?/gi;
const PARAGRAPH = /\b(?:paragraph|para\.?)\s*(\d+[a-z]?)/gi;
const POINT = /\bpoint\s*\(([a-z0-9]+)\)/gi;
const PAGE = /\b(?:p\.|pp\.|page)\s*(\d+)/gi;
const CHAPTER = /\bChapter\s+([IVXLC]+|\d+)\b/g;
const ANNEX = /\bAnnex\s+([IVXLC]+|\d+)\b/g;

/** Every structural marker in the text, in document order. */
function markers(text) {
  const out = [];
  const scan = (re, kind) => {
    re.lastIndex = 0;
    for (const m of String(text).matchAll(re)) {
      out.push({ kind, match: m[0].trim(), a: m[1] ?? null, b: m[2] ?? null, index: m.index ?? 0 });
    }
  };
  scan(ARTICLE, 'article');
  scan(RECITAL, 'recital');
  scan(PARAGRAPH, 'paragraph');
  scan(POINT, 'point');
  scan(PAGE, 'page');
  scan(CHAPTER, 'chapter');
  scan(ANNEX, 'annex');
  return out.sort((x, y) => x.index - y.index);
}

/**
 * @param {string} text       the whole document text
 * @param {{text:string, index:number}} proposition
 * @returns {{raw:string, article:string|null, paragraph:string|null, page:string|null}|null}
 *   null where nothing governs the passage — a real answer, and one
 *   the caller records rather than hides.
 */
export function locate(text, proposition) {
  const all = markers(text);
  const start = proposition.index;
  const end = start + proposition.text.length;

  /* A marker the sentence carries itself. */
  const inside = all.filter((m) => m.index >= start && m.index < end);
  /* Otherwise the last one that opened above it. */
  const above = all.filter((m) => m.index < start);

  const pick = (kinds, from) => [...from].reverse().find((m) => kinds.includes(m.kind)) ?? null;

  const article = pick(['article'], inside) ?? pick(['article'], above);
  const recital = pick(['recital'], inside) ?? pick(['recital'], above);
  const paragraph = pick(['paragraph', 'point'], inside) ?? pick(['paragraph', 'point'], above);
  const page = pick(['page'], inside) ?? pick(['page'], above);
  const chapter = pick(['chapter', 'annex'], inside) ?? pick(['chapter', 'annex'], above);

  if (!article && !recital && !paragraph && !page && !chapter) return null;

  /* The article's own bracketed paragraph — "Article 99(2)" — is a
     paragraph statement the document made, and beats a looser
     "paragraph 2" found further up. */
  const articleParagraph = article?.b ?? null;

  const raw = [
    article ? article.match : null,
    !article && recital ? recital.match : null,
    !article && !recital && chapter ? chapter.match : null,
    !articleParagraph && paragraph ? paragraph.match : null,
    page ? page.match : null,
  ].filter(Boolean).join(', ');

  return {
    raw: raw || (chapter?.match ?? page?.match ?? ''),
    article: article?.a ?? null,
    paragraph: articleParagraph ?? paragraph?.a ?? null,
    page: page?.a ?? null,
  };
}
