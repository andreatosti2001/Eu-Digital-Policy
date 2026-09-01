/* ============================================================
   agent/scout/retrieve.mjs — actually fetching a document, and
   telling the truth about what happened

   The Scout is read-only in the strongest sense: this module GETs a
   URL and reports the outcome. It never falls back, never
   substitutes, and never returns a document it did not receive.

   WHY THE OUTCOME IS CLASSIFIED RATHER THAN REDUCED TO A BOOLEAN.
   "Could not retrieve" collapses four different states, and three of
   them say something quite different about the world:

     retrieved       the bytes are here, with a sha256 over them
     policy_denied   THIS environment's egress policy refused the
                     request. The document is untouched by this and
                     may be perfectly available to anyone else. This
                     is a fact about the agent, never about the source
     http_error      the origin itself answered, and answered no
     network_error   DNS, TLS, connection, timeout — nobody answered

   The distinction between `policy_denied` and `http_error` is the one
   that matters most here, and it is why this module reads the
   response headers rather than just the status code. An egress proxy
   that denies a request answers with the same 403 an origin uses to
   refuse a bot. Recording an egress denial as though EUR-Lex had
   turned us away would be a false statement about a publisher, filed
   in a record that looks like research — which is precisely the
   class of defect this repository is built to prevent.

   Every outcome carries a real `attempted_at`. A retrieval nobody can
   date cannot be re-checked, and a claim that cannot be re-checked is
   the kind this project refuses to make.
   ============================================================ */

import { createHash } from 'node:crypto';

/** The proxy in this environment names its own refusals in a header.
 *  Presence of it is the signal that the denial is ours, not the
 *  origin's; absence means we do not claim to know, and the outcome
 *  is reported as an ordinary HTTP response. */
const EGRESS_DENY_HEADER = 'x-deny-reason';

export const OUTCOMES = ['retrieved', 'policy_denied', 'http_error', 'network_error'];

/** Bodies are read to a cap. A document larger than this is still a
 *  real finding — it is recorded as truncated, and the checksum is
 *  over what was read, never over what was hoped for. */
const MAX_BYTES = 4 * 1024 * 1024;

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/**
 * Read a <title> if the bytes contain one. Deliberately conservative:
 * it returns what is in the document or nothing at all. There is no
 * cleanup pass that would let a guess through, and a document with no
 * title element yields null rather than a filename or a URL fragment
 * dressed up as one.
 */
export function titleFrom(text) {
  const m = /<title[^>]*>([\s\S]{1,400}?)<\/title>/i.exec(text);
  if (!m) return null;
  const t = m[1]
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length ? t : null;
}

/**
 * Attempt one retrieval. Never throws for a failed fetch: the
 * failure is the return value, because a failure this agent swallows
 * is a gap nobody records.
 *
 * @param {string} url
 * @param {{timeoutMs?:number, fetchImpl?:Function}} [opts]
 * @returns {Promise<object>} an outcome record, always with `outcome`
 *   and `attempted_at`
 */
export async function attempt(url, { timeoutMs = 20000, fetchImpl = globalThis.fetch } = {}) {
  const attempted_at = new Date().toISOString();
  const t0 = Date.now();
  const base = { url, attempted_at, outcome: null, status: null, final_url: null, bytes: null, checksum: null, title: null, body: null, detail: null, elapsed_ms: null };

  let res;
  try {
    res = await fetchImpl(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
    });
  } catch (err) {
    return {
      ...base,
      outcome: 'network_error',
      elapsed_ms: Date.now() - t0,
      detail: `${err.name}: ${err.message}${err.cause?.message ? ` (${err.cause.message})` : ''}`,
    };
  }

  const denyReason = res.headers.get(EGRESS_DENY_HEADER);
  let text = '';
  try {
    const buf = Buffer.from(await res.arrayBuffer());
    text = buf.subarray(0, MAX_BYTES).toString('utf8');
    base.bytes = buf.length;
    base.checksum = sha256(buf);
  } catch (err) {
    return { ...base, outcome: 'network_error', status: res.status, elapsed_ms: Date.now() - t0, detail: `body could not be read: ${err.message}` };
  }

  const common = { ...base, status: res.status, final_url: res.url || url, elapsed_ms: Date.now() - t0 };

  /* An egress refusal is not the publisher's answer, and is never
     recorded as one. */
  if (denyReason) {
    return {
      ...common,
      outcome: 'policy_denied',
      checksum: null,
      bytes: null,
      detail: `the egress policy of this environment refused the request (${EGRESS_DENY_HEADER}: ${denyReason}; HTTP ${res.status}): ${text.trim().slice(0, 300)}`,
    };
  }

  if (!res.ok) {
    return { ...common, outcome: 'http_error', detail: `the origin answered HTTP ${res.status} ${res.statusText}`.trim() };
  }

  return { ...common, outcome: 'retrieved', title: titleFrom(text), body: text, detail: null };
}

/** True when nothing about the document was established. */
export const failed = (o) => o.outcome !== 'retrieved';

/** One sentence a reviewer can read, saying what happened and, where
 *  it matters, whose failure it was. */
export function explain(o) {
  switch (o.outcome) {
    case 'retrieved':
      return `Retrieved ${o.bytes} bytes from ${o.final_url} at ${o.attempted_at}.`;
    case 'policy_denied':
      return `Not retrieved. ${o.detail} This is a limit on this agent's network reach and says nothing about the document, which may be perfectly available elsewhere.`;
    case 'http_error':
      return `Not retrieved. ${o.detail} at ${o.attempted_at}.`;
    case 'network_error':
      return `Not retrieved. The request did not complete — ${o.detail} — at ${o.attempted_at}.`;
    default:
      return `Not retrieved. Unclassified outcome at ${o.attempted_at}.`;
  }
}
