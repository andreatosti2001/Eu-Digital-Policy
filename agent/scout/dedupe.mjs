/* ============================================================
   agent/scout/dedupe.mjs — the same document, twice

   A regulator publishes one document at several addresses: a news
   item, a permalink, a PDF, a tracking-tagged share link. Recording
   it four times would put four candidates in front of a human who
   has to decide once.

   Three tests, in descending order of how much they prove:

     fingerprint  the bytes are identical. This is proof.
     url          the addresses normalise to the same thing. Also
                  proof, of a weaker kind — a redirect could still
                  make two different-looking addresses one document.
     title        the titles are identical once normalised. This is a
                  SUGGESTION, and it is reported as one: two EDPB
                  documents can legitimately share a title.

   The Scout names duplicates and never picks a winner. Deciding
   which of two records is canonical is a change to the corpus, and
   this agent is read-only.
   ============================================================ */

const TRACKING = /^(utm_[a-z_]*|fbclid|gclid|mc_cid|mc_eid|_ga|ref|source)$/i;

/** Same document, addressed differently. Never rewrites the stored
 *  URL — the candidate keeps the address it was actually fetched
 *  from; this is only for comparison. */
export function normaliseUrl(url) {
  let u;
  try { u = new URL(url); } catch { return String(url).trim().toLowerCase(); }
  u.hash = '';
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
  u.protocol = 'https:';
  for (const key of [...u.searchParams.keys()]) if (TRACKING.test(key)) u.searchParams.delete(key);
  u.searchParams.sort();
  let path = u.pathname.replace(/\/+$/, '');
  if (path === '') path = '/';
  u.pathname = path;
  return u.toString();
}

export const normaliseTitle = (t) =>
  String(t ?? '').toLowerCase().replace(/[‐-―]/g, '-').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/**
 * @param {Array<{candidate_id:string, url:string|null, title:string|null, fingerprint:string|null}>} items
 * @returns {Map<string, Array<{candidate_id:string, basis:string}>>}
 *   candidate_id → the others that look like the same document, each
 *   with the basis on which they matched, so a reviewer can tell
 *   proof from suggestion.
 */
export function findDuplicates(items) {
  const out = new Map(items.map((i) => [i.candidate_id, []]));
  for (let a = 0; a < items.length; a++) {
    for (let b = a + 1; b < items.length; b++) {
      const x = items[a];
      const y = items[b];
      let basis = null;
      if (x.fingerprint && y.fingerprint && x.fingerprint === y.fingerprint) basis = 'identical content fingerprint';
      else if (x.url && y.url && normaliseUrl(x.url) === normaliseUrl(y.url)) basis = 'the addresses normalise to the same URL';
      else if (x.title && y.title && normaliseTitle(x.title) && normaliseTitle(x.title) === normaliseTitle(y.title)) basis = 'identical title — a suggestion, not proof';
      if (!basis) continue;
      out.get(x.candidate_id).push({ candidate_id: y.candidate_id, basis });
      out.get(y.candidate_id).push({ candidate_id: x.candidate_id, basis });
    }
  }
  return out;
}
