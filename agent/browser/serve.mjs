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

   `basePath` SERVES THE SITE WHERE IT IS ACTUALLY PUBLISHED. Every run
   before SESSION 30 served the repository at `/`, and the deployment
   is GitHub Pages at `/Eu-Digital-Policy/`. The two differ in exactly
   one way that matters, and it is the way that breaks a static site
   silently: a root-relative reference — `/css/tokens.css`,
   `/data/claims.json`, `fetch('/i18n/locales.json')` — resolves at `/`
   and 404s under a subpath. Everything here is written relative today,
   so the suite found nothing; it found nothing because it could not
   have found anything. `checkDeployedSubpath` in checks.mjs opens the
   site under the published prefix and asks the same questions again.
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
 * @param {{root?:string, host?:string, basePath?:string}} opts
 * @returns {Promise<{origin:string, base:string, port:number, requests:Array, close:()=>Promise<void>}>}
 */
export async function serveSite({ root = REPO_ROOT, host = '127.0.0.1', basePath = '' } = {}) {
  const requests = [];
  /* Normalised to "" or "/prefix" — no trailing slash, so the join
     below is the same expression in both cases. */
  const base = basePath ? `/${String(basePath).replace(/^\/+|\/+$/g, '')}` : '';

  const server = createServer((req, res) => {
    const started = Date.now();
    let url;
    try { url = new URL(req.url, `http://${host}`); }
    catch { res.writeHead(400).end('bad request'); return; }

    let pathname = decodeURIComponent(url.pathname);

    /* Under a base path, anything outside it is not served at all —
       which is what GitHub Pages does with a project site, and is the
       half a root-served fixture cannot show. A root-relative
       `/css/tokens.css` in a page reaches this branch and 404s, exactly
       as it would on the deployed site. */
    if (base) {
      if (pathname === base) pathname = `${base}/`;
      if (!pathname.startsWith(`${base}/`)) {
        requests.push({ method: req.method, path: url.pathname, status: 404, bytes: 0, ms: Date.now() - started });
        res.writeHead(404).end('outside the deployment base path');
        return;
      }
      pathname = pathname.slice(base.length);
    }

    const rel = pathname.replace(/^\/+/, '') || 'index.html';

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
    /* `origin` is where the site is, base path included, so every
       caller composes `${origin}/page.html` unchanged whether the
       fixture is serving at the root or under the published prefix.
       `base` is kept separately for the checks that need to reason
       about the prefix itself. */
    origin: `http://${host}:${port}${base}`,
    base,
    port,
    requests,
    close: () => new Promise((ok) => server.close(ok)),
  };
}
