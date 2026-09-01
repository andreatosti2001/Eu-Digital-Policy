/* ============================================================
   agent/scout/http.mjs — retrieval, and the metadata about it

   The Scout is READ-ONLY against the network. This module makes
   exactly one kind of request — GET — and it records what came
   back rather than what was hoped for.

   RETRIEVAL METADATA IS THE POINT, not a by-product. A candidate
   the Scout reports is only as good as the answer to "what
   exactly was fetched, when, from where, and did the server
   actually say so". Every field below exists so that a human
   reviewing the report can tell a real document from a captive
   portal, a 200-with-an-error-page from a 200, and a redirect to
   a login screen from a redirect to the canonical URL.

   Three properties this deliberately keeps:

   A FAILURE IS A RESULT. Nothing here throws on a dead endpoint.
   `get()` always resolves to a record with `ok:false` and a named
   reason, because a watchlist entry that stopped resolving is a
   finding the report must carry, not an exception that ends a run.

   NOTHING IS SENT. No credential, no cookie, no Authorization
   header is ever attached, and redirects are followed by hand so
   a cross-host hop cannot silently carry one. `credentials` is
   'omit' and the jar is not shared: the Scout has no identity to
   leak.

   UNKNOWN IS NOT ZERO. A header the server did not send is null,
   not "" and not 0. `bytes: 0` means an empty body was actually
   received; `bytes: null` means nothing was measured.
   ============================================================ */

import { createHash } from 'node:crypto';

/** Identifies the agent honestly to the servers it reads. A scraper
 *  that lies about who it is has already made the operator's
 *  apology harder to write. */
export const USER_AGENT =
  'Eu-Digital-Policy-SourceScout/1 (+https://github.com/andreatosti2001/Eu-Digital-Policy; read-only source discovery)';

export const DEFAULTS = {
  timeoutMs: 20000,
  maxRedirects: 5,
  maxBytes: 4 * 1024 * 1024,   /* a feed is small; a 4 MB body is a wrong turn */
};

const HOP_LIMIT_REASON = 'too-many-redirects';

/** Headers worth keeping. Deliberately a allowlist: a response
 *  header we did not ask for is not evidence, and Set-Cookie in a
 *  stored record is a leak with no upside. */
const KEEP_HEADERS = [
  'content-type', 'content-length', 'etag', 'last-modified',
  'date', 'expires', 'cache-control', 'content-language',
];

function headerSnapshot(headers) {
  const out = {};
  for (const name of KEEP_HEADERS) {
    const v = headers.get(name);
    out[name] = v === null ? null : v;      /* null = the server did not send it */
  }
  return out;
}

/** http(s) only. A redirect to file:, data: or javascript: is not a
 *  document, and following one is how a fetcher becomes a gadget. */
function isFetchableHttpUrl(u) {
  try {
    const p = new URL(u);
    return p.protocol === 'http:' || p.protocol === 'https:';
  } catch { return false; }
}

/**
 * GET one URL and describe the retrieval.
 *
 * Always resolves. Never throws for a network or protocol problem.
 *
 * @returns {Promise<object>} a retrieval record:
 *   ok, requested_url, final_url, redirects[], status, status_text,
 *   content_type, bytes, sha256, elapsed_ms, retrieved_at, headers,
 *   truncated, body (string|null), error{kind,message}|null
 */
export async function get(url, opts = {}) {
  const { timeoutMs, maxRedirects, maxBytes } = { ...DEFAULTS, ...opts };
  const fetchImpl = opts.fetch ?? globalThis.fetch;
  const startedAt = new Date();
  const t0 = Date.now();

  const record = {
    ok: false,
    requested_url: url,
    final_url: null,
    redirects: [],
    status: null,
    status_text: null,
    content_type: null,
    bytes: null,
    sha256: null,
    elapsed_ms: null,
    retrieved_at: startedAt.toISOString(),
    headers: null,
    truncated: false,
    body: null,
    error: null,
  };

  const fail = (kind, message) => {
    record.elapsed_ms = Date.now() - t0;
    record.error = { kind, message };
    return record;
  };

  if (!isFetchableHttpUrl(url)) {
    return fail('bad-url', `not an http(s) URL: ${String(url).slice(0, 200)}`);
  }

  let current = url;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetchImpl(current, {
        method: 'GET',
        redirect: 'manual',          /* followed by hand — see below */
        signal: controller.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: {
          'user-agent': USER_AGENT,
          'accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, text/html;q=0.8, */*;q=0.5',
          'accept-language': 'en',
        },
      });
    } catch (err) {
      clearTimeout(timer);
      const aborted = err?.name === 'AbortError' || controller.signal.aborted;
      record.final_url = current;
      return fail(aborted ? 'timeout' : 'network',
        aborted ? `no response within ${timeoutMs}ms` : (err?.message ?? String(err)));
    }
    clearTimeout(timer);

    record.status = res.status;
    record.status_text = res.statusText || null;
    record.final_url = current;
    record.headers = headerSnapshot(res.headers);
    record.content_type = res.headers.get('content-type');

    /* --- redirects, followed one hop at a time --------------- */
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return fail('bad-redirect', `${res.status} with no Location header`);
      let next;
      try { next = new URL(location, current).toString(); }
      catch { return fail('bad-redirect', `unresolvable Location: ${location.slice(0, 200)}`); }
      if (!isFetchableHttpUrl(next)) {
        return fail('bad-redirect', `redirect to a non-http(s) target: ${next.slice(0, 200)}`);
      }
      record.redirects.push({ from: current, to: next, status: res.status });
      current = next;
      if (hop === maxRedirects) return fail(HOP_LIMIT_REASON, `more than ${maxRedirects} redirects`);
      continue;
    }

    /* --- terminal response ----------------------------------- */
    let text;
    try {
      const buf = Buffer.from(await res.arrayBuffer());
      record.bytes = buf.length;
      record.sha256 = createHash('sha256').update(buf).digest('hex');
      if (buf.length > maxBytes) {
        record.truncated = true;
        text = buf.subarray(0, maxBytes).toString('utf8');
      } else {
        text = buf.toString('utf8');
      }
    } catch (err) {
      return fail('body', err?.message ?? String(err));
    }

    record.body = text;
    record.elapsed_ms = Date.now() - t0;
    /* ok means "the server returned this document", not "this
       document is any good". Judging it is the reviewer's job. */
    record.ok = res.status >= 200 && res.status < 300;
    if (!record.ok) record.error = { kind: 'http-status', message: `${res.status} ${res.statusText || ''}`.trim() };
    return record;
  }

  return fail(HOP_LIMIT_REASON, `more than ${maxRedirects} redirects`);
}

/**
 * The retrieval record minus the body — what goes into a report.
 * The body is evidence for this run, not something to commit: a
 * report carrying 4 MB of someone else's HTML is a report nobody
 * reads and a licence question nobody asked for.
 */
export function retrievalMetadata(r) {
  const { body, ...rest } = r;
  return { ...rest, body_captured: body !== null, body_chars: body === null ? null : body.length };
}
