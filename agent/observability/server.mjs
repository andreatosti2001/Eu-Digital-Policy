/* ============================================================
   agent/observability/server.mjs — the local development view

   node:http, no framework, no build. It serves two things:

     · the viewer under /  (agent/observability/viewer/)
     · a JSON API over the trace store under /api/

   It binds to 127.0.0.1 by default. The store contains inputs and
   outputs of agent runs; even redacted, that is not something to
   expose on an interface by accident.

   The viewer is a development tool, not part of the site. It is
   deliberately not wired into js/shell.js, does not load the
   site's stylesheets, and is not linked from any page — so a
   change to the site cannot break it, and it cannot become a
   hidden consumer of the site's design tokens.
   ============================================================ */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { listRuns, loadTrace, overview, traceChain, impactState } from './query.mjs';
import { toOtlp, toProvenanceLedger } from './otlp.mjs';
import { DEFAULT_RUN_DIR, OBS_ROOT } from './sink.mjs';

const VIEWER = join(OBS_ROOT, 'viewer');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

export function serve({ port = 7801, host = '127.0.0.1', dir = DEFAULT_RUN_DIR } = {}) {
  const json = (res, body, code = 200) => {
    const s = JSON.stringify(body);
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': Buffer.byteLength(s) });
    res.end(s);
  };

  const server = createServer((req, res) => {
    let url;
    try { url = new URL(req.url, `http://${host}:${port}`); }
    catch { return json(res, { error: 'bad request' }, 400); }
    const p = url.pathname;

    try {
      if (p === '/api/summary') return json(res, overview(dir));
      if (p === '/api/runs') return json(res, { runs: listRuns(dir) });
      if (p.startsWith('/api/runs/')) {
        const id = decodeURIComponent(p.slice('/api/runs/'.length));
        if (!/^[0-9a-f]{32}$/.test(id)) return json(res, { error: 'bad trace id' }, 400);
        const t = loadTrace(id, dir);
        return t ? json(res, t) : json(res, { error: 'no such trace' }, 404);
      }
      if (p === '/api/impact') {
        /* The dependency/impact graph, exposed. `?trace=` narrows to
           one run, `?change=` to one detected change; with neither
           it is every impact map in the store. Same shape as the
           chain endpoint, and like it, an impact map missing its
           routing decision reports the gap rather than omitting
           it. */
        const trace = url.searchParams.get('trace');
        const change = url.searchParams.get('change');
        if (trace && !/^[0-9a-f]{32}$/.test(trace)) return json(res, { error: 'bad trace id' }, 400);
        const traces = trace ? [trace] : listRuns(dir).map((r) => r.trace_id);
        const maps = [];
        for (const id of traces) {
          const t = loadTrace(id, dir);
          if (!t) continue;
          for (const i of t.impact) {
            if (change && i.change_id !== change) continue;
            maps.push(i);
          }
        }
        return json(res, { impact: maps });
      }
      if (p === '/api/depth') {
        /* The depth analyses, exposed. `?trace=` narrows to one run;
           with nothing it is every depth analysis in the store.
           Every entry carries what the run SET ASIDE as well as what
           it reported — a view that showed only the reported gaps
           would present this agent's thirty-one judgements as if
           they were the corpus. */
        const trace = url.searchParams.get('trace');
        if (trace && !/^[0-9a-f]{32}$/.test(trace)) return json(res, { error: 'bad trace id' }, 400);
        const traces = trace ? [trace] : listRuns(dir).map((r) => r.trace_id);
        const analyses = [];
        for (const id of traces) {
          const t = loadTrace(id, dir);
          if (t?.depth) analyses.push(t.depth);
        }
        return json(res, { depth: analyses });
      }
      if (p === '/api/proposals') {
        /* What each routing run made of the gaps it was handed.
           `?trace=` narrows to one run. Every entry carries what the
           run REFUSED as well as what it proposed: on this corpus
           most gaps cannot become a proposal, and a view that showed
           only the proposals would report the work as more complete
           than it is. */
        const trace = url.searchParams.get('trace');
        if (trace && !/^[0-9a-f]{32}$/.test(trace)) return json(res, { error: 'bad trace id' }, 400);
        const traces = trace ? [trace] : listRuns(dir).map((r) => r.trace_id);
        const routings = [];
        for (const id of traces) {
          const t = loadTrace(id, dir);
          if (t?.proposals) routings.push(t.proposals);
        }
        return json(res, { proposals: routings });
      }
      if (p === '/api/architecture') {
        /* What each Knowledge Architect run concluded about the
           information model. `?trace=` narrows to one run. Every
           entry carries the questions answered NO as well as the
           ones answered yes: a question the model handles is the
           model working, and a view that carried only the defects
           would report it as nothing but them. */
        const trace = url.searchParams.get('trace');
        if (trace && !/^[0-9a-f]{32}$/.test(trace)) return json(res, { error: 'bad trace id' }, 400);
        const traces = trace ? [trace] : listRuns(dir).map((r) => r.trace_id);
        const analyses = [];
        for (const id of traces) {
          const t = loadTrace(id, dir);
          if (t?.architecture) analyses.push(t.architecture);
        }
        return json(res, { architecture: analyses });
      }
      if (p === '/api/chain') {
        return json(res, {
          chains: traceChain({
            file: url.searchParams.get('file'),
            change_id: url.searchParams.get('change'),
            trace_id: url.searchParams.get('trace'),
          }, dir),
        });
      }
      if (p === '/api/export') {
        const id = url.searchParams.get('trace');
        if (!/^[0-9a-f]{32}$/.test(id ?? '')) return json(res, { error: 'bad trace id' }, 400);
        const out = url.searchParams.get('kind') === 'provenance' ? toProvenanceLedger(id, dir) : toOtlp(id, dir);
        return out ? json(res, out) : json(res, { error: 'no such trace' }, 404);
      }
      if (p.startsWith('/api/')) return json(res, { error: 'no such endpoint' }, 404);

      /* static viewer; nothing outside the viewer directory */
      const rel = p === '/' ? 'index.html' : p.replace(/^\/+/, '');
      const file = resolve(VIEWER, rel);
      if (!file.startsWith(VIEWER)) return json(res, { error: 'forbidden' }, 403);
      if (!existsSync(file) || !statSync(file).isFile()) return json(res, { error: 'not found' }, 404);
      const body = readFileSync(file);
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      return res.end(body);
    } catch (err) {
      return json(res, { error: err.message }, 500);
    }
  });

  server.listen(port, host, () => {
    console.log(`observability view → http://${host}:${port}`);
    console.log(`  store: ${dir}`);
    console.log(`  ctrl-c to stop`);
  });
  return server;
}
