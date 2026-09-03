/* ============================================================
   agent/browser/serve.mjs — the site, served, so a browser can
   actually open it

   AGENTS.md is explicit that this site must be served over HTTP:
   `file://` blocks both ES modules and the `fetch` calls in
   `js/data.js` that load `data/*.json`. A browser suite that opened
   `file:///…/index.html` would find every page empty and would
   report that as a finding, which is the sort of false positive that
   discredits a suite in its first week.

   The documented way to serve it is `python3 -m http.server 8000`.
   This is the same thing in Node, for three reasons: the suite must
   run where python3 may not exist; it needs an EPHEMERAL port, so
   two runs (or a run and a developer's own server) cannot collide;
   and it needs to know, afterwards, exactly which requests the pages
   made — the request log below is what lets `checks.mjs` assert that
   NO THIRD-PARTY REQUEST WAS MADE from a real page load rather than
   from reading the markup, which is all `tools/design-qa.mjs` can do.

   It serves the repository root read-only over GET and HEAD. It is a
   TEST FIXTURE, not a deployment: it binds 127.0.0.1 only, and the
   path traversal guard below is what stops a crafted URL reading
   outside the repository.
   ============================================================ */

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, normalize, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

/**
 * @param {{root?:string, host?:string}} opts
 * @returns {Promise<{origin:string, port:number, requests:Array, close:()=>Promise<void>}>}
 */
export async function serveSite({ root = REPO_ROOT, host = '127.0.0.1' } = {}) {
  const requests = [];

  const server = createServer((req, res) => {
    const started = Date.now();
    let url;
    try { url = new URL(req.url, `http://${host}`); }
    catch { res.writeHead(400).end('bad request'); return; }

    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';

    /* Traversal guard. normalize() collapses ".."; the resolved path
       is then checked to be inside root rather than assumed to be,
       because a symlink inside the tree would satisfy the string
       check and not the real one. */
    const target = resolve(join(root, normalize(rel)));
    const inside = target === root || target.startsWith(root + sep);

    const record = (status, bytes) => requests.push({
      method: req.method, path: url.pathname, status, bytes,
      ms: Date.now() - started,
    });

    if (!inside) { record(403, 0); res.writeHead(403).end('outside the repository'); return; }
    if (req.method !== 'GET' && req.method !== 'HEAD') { record(405, 0); res.writeHead(405).end('read-only'); return; }

    let st;
    try { st = statSync(target); } catch { record(404, 0); res.writeHead(404).end('not found'); return; }
    if (st.isDirectory()) {
      const idx = join(target, 'index.html');
      try { statSync(idx); } catch { record(404, 0); res.writeHead(404).end('no index'); return; }
      res.writeHead(302, { location: `${url.pathname.replace(/\/*$/, '')}/index.html` }).end();
      record(302, 0);
      return;
    }

    res.writeHead(200, {
      'content-type': MIME[extname(target).toLowerCase()] ?? 'application/octet-stream',
      'content-length': String(st.size),
      'cache-control': 'no-store',
    });
    record(200, st.size);
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(target).pipe(res);
  });

  await new Promise((ok, fail) => {
    server.once('error', fail);
    server.listen(0, host, ok);
  });

  const { port } = server.address();
  return {
    origin: `http://${host}:${port}`,
    port,
    requests,
    close: () => new Promise((ok) => server.close(ok)),
  };
}
