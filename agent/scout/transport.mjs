/* ============================================================
   agent/scout/transport.mjs — the retrieval boundary

   The one place in the Scout that touches the network, so that
   everything above it can be tested without one, and so that a
   refusal has exactly one place to be recorded honestly.

   Zero dependencies: node:https with an agent that opens a CONNECT
   tunnel through the session's egress proxy when HTTPS_PROXY is
   set. TLS verification is never disabled — the proxy re-terminates
   TLS and the CA bundle is already in NODE_EXTRA_CA_CERTS; a
   transport that turned verification off to make a fetch succeed
   would be lying about what it retrieved.

   EVERY RESULT IS A RECORD OF WHAT HAPPENED, including the failures.
   `ok:false` carries a `reason` and, where the refusal came from the
   egress policy rather than the origin, `blocked_by:'egress_policy'`.
   The Scout turns that into a DataGap. It never turns it into
   nothing, and it never turns it into a candidate.

   MockTransport implements the same interface over fixture
   documents. It is the first thing the Scout was built against, and
   every document it serves is on an unresolvable host.
   ============================================================ */

import https from 'node:https';
import http from 'node:http';
import net from 'node:net';
import tls from 'node:tls';
import { createHash } from 'node:crypto';

export const DEFAULT_LIMITS = {
  timeout_ms: 20000,
  max_bytes: 2 * 1024 * 1024,
  max_redirects: 3,
  /** Politeness. One request at a time per host, with a pause. */
  delay_ms: 1000,
  user_agent: 'EuDigitalPolicyScout/0.1 (research; read-only; contact via repository)',
};

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/* ---------------------------------------------------------- tunnel */

/** Opens a CONNECT tunnel and resolves the raw socket. Rejects with
 *  the proxy's own status when it refuses, because "403 on CONNECT"
 *  is the answer, not an unexplained failure. */
function openTunnel(proxyUrl, host, port, timeout_ms) {
  return new Promise((resolve, reject) => {
    const p = new URL(proxyUrl);
    const req = http.request({
      host: p.hostname,
      port: p.port || 80,
      method: 'CONNECT',
      path: `${host}:${port}`,
      headers: { Host: `${host}:${port}` },
      timeout: timeout_ms,
    });
    req.on('connect', (res, socket) => {
      if (res.statusCode !== 200) {
        socket.destroy();
        const err = new Error(`proxy answered ${res.statusCode} to CONNECT ${host}:${port}`);
        err.proxyStatus = res.statusCode;
        reject(err);
        return;
      }
      resolve(socket);
    });
    req.on('timeout', () => { req.destroy(new Error(`CONNECT to ${host}:${port} timed out`)); });
    req.on('error', reject);
    req.end();
  });
}

class TunnelAgent extends https.Agent {
  constructor(proxyUrl, timeout_ms) { super({ keepAlive: false }); this.proxyUrl = proxyUrl; this.timeout_ms = timeout_ms; }
  createConnection(options, cb) {
    const port = Number(options.port) || 443;
    openTunnel(this.proxyUrl, options.host, port, this.timeout_ms)
      .then((socket) => cb(null, tls.connect({ socket, servername: options.host, ALPNProtocols: ['http/1.1'] })))
      .catch(cb);
  }
}

/* ---------------------------------------------------------- real */

export class HttpTransport {
  constructor(limits = {}) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
    this.proxy = process.env.HTTPS_PROXY || process.env.https_proxy || null;
    this.simulated = false;
    this.lastRequestAt = 0;
  }

  /** One request at a time, with the configured pause between them.
   *  A scout that hammers a regulator's website is a scout that gets
   *  the repository blocked. */
  async #bePolite() {
    const wait = this.limits.delay_ms - (Date.now() - this.lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.lastRequestAt = Date.now();
  }

  async get(url, { redirects = 0 } = {}) {
    await this.#bePolite();
    const started = Date.now();
    try {
      const res = await this.#once(url);
      const elapsed_ms = Date.now() - started;

      if ([301, 302, 303, 307, 308].includes(res.status) && res.headers.location) {
        if (redirects >= this.limits.max_redirects) {
          return { ok: false, url, status: res.status, reason: 'too many redirects', blocked_by: null, elapsed_ms };
        }
        const next = new URL(res.headers.location, url).toString();
        return this.get(next, { redirects: redirects + 1 });
      }
      if (res.status !== 200) {
        return { ok: false, url, final_url: res.final_url, status: res.status, reason: `origin answered ${res.status}`, blocked_by: null, elapsed_ms };
      }
      return {
        ok: true,
        url,
        final_url: res.final_url,
        status: 200,
        bytes: res.body,
        byte_length: res.body.length,
        sha256: sha256(res.body),
        content_type: res.headers['content-type'] ?? null,
        truncated: res.truncated,
        elapsed_ms,
        blocked_by: null,
      };
    } catch (err) {
      const elapsed_ms = Date.now() - started;
      const blocked_by = err.proxyStatus === 403 || err.proxyStatus === 407 ? 'egress_policy' : null;
      return { ok: false, url, status: err.proxyStatus ?? null, reason: err.message, blocked_by, elapsed_ms };
    }
  }

  #once(url) {
    const u = new URL(url);
    const opts = {
      method: 'GET',
      host: u.hostname,
      port: u.port || 443,
      path: `${u.pathname}${u.search}`,
      headers: { 'User-Agent': this.limits.user_agent, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      timeout: this.limits.timeout_ms,
    };
    if (this.proxy) opts.agent = new TunnelAgent(this.proxy, this.limits.timeout_ms);

    return new Promise((resolve, reject) => {
      const req = https.request(opts, (res) => {
        const chunks = [];
        let total = 0;
        let truncated = false;
        res.on('data', (c) => {
          total += c.length;
          if (total <= this.limits.max_bytes) chunks.push(c);
          else if (!truncated) { truncated = true; res.destroy(); }
        });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), truncated, final_url: url }));
        res.on('close', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), truncated, final_url: url }));
        res.on('error', reject);
      });
      req.on('timeout', () => req.destroy(new Error(`request to ${u.hostname} timed out after ${this.limits.timeout_ms}ms`)));
      req.on('error', reject);
      req.end();
    });
  }
}

/* ---------------------------------------------------------- mock */

/**
 * Serves fixture documents. Same interface, no network, and every
 * result carries `simulated: true` so nothing downstream can mistake
 * a fixture for a retrieval.
 */
export class MockTransport {
  constructor(documents) {
    this.documents = new Map(Object.entries(documents));
    this.simulated = true;
    this.requests = [];
  }

  async get(url) {
    this.requests.push(url);
    const doc = this.documents.get(url);
    if (!doc) {
      return { ok: false, url, status: 404, reason: 'no fixture document at this address', blocked_by: null, elapsed_ms: 1, simulated: true };
    }
    if (doc.blocked) {
      return { ok: false, url, status: 403, reason: doc.reason ?? 'simulated refusal', blocked_by: doc.blocked_by ?? 'egress_policy', elapsed_ms: 1, simulated: true };
    }
    const bytes = Buffer.from(doc.body, 'utf8');
    return {
      ok: true,
      url,
      final_url: url,
      status: 200,
      bytes,
      byte_length: bytes.length,
      sha256: sha256(bytes),
      content_type: doc.content_type ?? 'text/html; charset=utf-8',
      truncated: false,
      elapsed_ms: 1,
      blocked_by: null,
      simulated: true,
    };
  }
}
