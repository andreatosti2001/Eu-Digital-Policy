/* ============================================================
   agent/observability/redact.mjs — secrets never reach the store

   A trace store is the worst place to leak a credential: it is
   append-only by design, it is written without being read, and its
   whole purpose is to be kept. So redaction happens on the way IN,
   at the sink boundary, not on the way out in a viewer. A record
   that was written clean cannot be un-redacted by a later reader.

   Two passes, because a secret arrives in two shapes:

     · by KEY   — {api_key: "…"} — the name says what it is
     · by VALUE — a token pasted into a URL, a prose field, an
                  argv array, where no key names it

   Redaction is counted, and the count is written onto the record
   as `redactions`. A silent redactor is indistinguishable from a
   broken one.
   ============================================================ */

export const MASK = '[redacted]';

/* Keys whose value is a credential whatever it looks like. */
const SECRET_KEY = /(^|[_.-])(api[_-]?key|apikey|secret|token|access[_-]?token|refresh[_-]?token|password|passwd|pwd|authorization|auth|bearer|credential|credentials|private[_-]?key|client[_-]?secret|session[_-]?id|cookie|set[_-]?cookie)([_.-]|$)/i;

/* Values that are a credential whatever they are called. Ordered:
   the more specific pattern must match before the generic one. */
const SECRET_VALUE = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[redacted:private-key]'],
  [/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/g, '[redacted:github-token]'],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/g, '[redacted:github-token]'],
  [/\bsk-(?:ant-)?[A-Za-z0-9_-]{16,}/g, '[redacted:api-key]'],
  [/\bAKIA[0-9A-Z]{16}\b/g, '[redacted:aws-key-id]'],
  [/\bxox[abposr]-[A-Za-z0-9-]{10,}/g, '[redacted:slack-token]'],
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, '[redacted:jwt]'],
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{12,}/gi, '$1 [redacted]'],
  [/\b(api[_-]?key|token|secret|password)\s*[=:]\s*["']?[^\s"'&;,}]{8,}/gi, '$1=[redacted]'],
  /* userinfo in a URL, and the query parameters that carry a key */
  [/\b([a-z][a-z0-9+.-]*:\/\/)[^/\s:@]+:[^/\s@]+@/gi, '$1[redacted]@'],
  [/([?&](?:api[_-]?key|access[_-]?token|token|key|signature|sig)=)[^&\s"']+/gi, '$1[redacted]'],
];

const MAX_STRING = 8000;   /* a trace field is evidence, not a payload dump */
const MAX_DEPTH = 12;
const MAX_ARRAY = 500;

function redactString(s, ctx) {
  let out = s;
  for (const [re, rep] of SECRET_VALUE) {
    out = out.replace(re, (...a) => { ctx.n++; return typeof rep === 'string' ? rep.replace('$1', a[1] ?? '') : rep; });
  }
  if (out.length > MAX_STRING) {
    ctx.truncated++;
    out = out.slice(0, MAX_STRING) + `…[truncated ${out.length - MAX_STRING} chars]`;
  }
  return out;
}

function walk(value, ctx, depth) {
  if (value === null || value === undefined) return value ?? null;
  if (depth > MAX_DEPTH) { ctx.truncated++; return '[depth-limit]'; }

  const t = typeof value;
  if (t === 'string') return redactString(value, ctx);
  if (t === 'number' || t === 'boolean') return value;
  if (t === 'bigint') return String(value);
  if (t === 'function' || t === 'symbol') return `[${t}]`;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message, ctx), stack: value.stack ? redactString(value.stack, ctx) : undefined };
  }
  if (Array.isArray(value)) {
    const head = value.length > MAX_ARRAY ? value.slice(0, MAX_ARRAY) : value;
    if (value.length > MAX_ARRAY) ctx.truncated++;
    return head.map((v) => walk(v, ctx, depth + 1));
  }
  if (t === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SECRET_KEY.test(k)) { ctx.n++; out[k] = MASK; continue; }
      out[k] = walk(v, ctx, depth + 1);
    }
    return out;
  }
  return String(value);
}

/**
 * @returns {{value:any, redactions:number, truncations:number}}
 */
export function redact(value) {
  const ctx = { n: 0, truncated: 0 };
  const v = walk(value, ctx, 0);
  return { value: v, redactions: ctx.n, truncations: ctx.truncated };
}

/** Convenience for a single string field. */
export function redactText(s) {
  const ctx = { n: 0, truncated: 0 };
  return redactString(String(s), ctx);
}
