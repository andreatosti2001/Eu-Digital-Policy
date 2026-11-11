/* ============================================================
   PV2-03 · the brief's prose, read in place from the site's index.html.

   The prose of the brief is not a dataset: it lives in index.html (its
   titles, deks and reading times are in data/brief.json). The author chose
   that the prototype reads it from there and copies nothing (roadmap §8,
   "PV2-03, C.1 question 2"). This is the prototype's one fetch outside
   js/data.js, and it reaches only the same origin (connect-src 'self').
   The parsed document is inert: DOMParser runs no script and loads nothing.
   ============================================================ */

let BRIEF = null;

export function readBrief() {
  if (!BRIEF) {
    const url = new URL('../../index.html', import.meta.url).href;
    BRIEF = fetch(url, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
        return r.text();
      })
      .then((html) => new DOMParser().parseFromString(html, 'text/html'))
      .catch((e) => { BRIEF = null; throw e; });
  }
  return BRIEF;
}

/** The text of the first element matching `sel`, whitespace-normalised, or null. */
export const textOf = (doc, sel) => {
  const el = doc.querySelector(sel);
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
};
