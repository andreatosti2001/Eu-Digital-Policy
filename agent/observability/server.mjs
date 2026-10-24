/* ============================================================
   agent/observability/server.mjs — the local development view

   node:http, no framework, no build. It serves two things:

     · the viewer under /  (agent/observability/viewer/)
     · a JSON API over the trace store under /api/

   It binds to loopback ONLY — enforced, not defaulted (below). The
   store contains inputs and outputs of agent runs; even redacted,
   that is not something to expose on an interface by accident.

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

/* 23 Oct 2026. LOOPBACK ONLY, AND ENFORCED RATHER THAN DEFAULTED.
   Until this date `host` was a parameter with a loopback default, and
   serve({ host: '0.0.0.0' }) put the whole trace store on a network
   with nothing in the request path to object (docs/HEALTH-MONITOR.md
   §6). The viewer checks no credential, by design: it is a development
   tool, and bolting a token onto it would give it a security model
   nobody tests (AGENTS.md, Known hazards). So its boundary is the bind
   address, and a bind address other than a loopback LITERAL is now
   refused — before listening, and again on the address actually bound.
   A hostname is refused too, `localhost` included: what a name
   resolves to is the resolver's decision, not this file's.

   The Host header is checked on every request as well. A loopback
   bind does not stop a web page the developer has open from reaching
   127.0.0.1 through a DNS name its owner re-points there (DNS
   rebinding); such a request carries that name in Host and is refused.
   Neither check identifies a caller: any process on this machine can
   still read the store, which is what "local" means here. */
export const LOOPBACK_BIND_ADDRESSES = Object.freeze(['127.0.0.1', '::1']);

export function isLoopbackAddress(address) {
  return LOOPBACK_BIND_ADDRESSES.includes(String(address));
}

/** Host header values a loopback viewer can legitimately be asked for. */
export function isLoopbackHostHeader(value) {
  return typeof value === 'string' && /^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d{1,5})?$/i.test(value);
}

/**
 * @param {{port?:number, host?:string, dir?:string, quiet?:boolean}} opts
 *
 * `quiet` suppresses the startup banner. It exists for
 * agent/health/gather.mjs, which starts this server on an ephemeral
 * loopback port to check whether its privileged routes answer an
 * unauthenticated request, and then shuts it down — three lines of
 * banner in the middle of a health report is noise, not information.
 */
export function serve({ port = 7801, host = '127.0.0.1', dir = DEFAULT_RUN_DIR, quiet = false } = {}) {
  if (!isLoopbackAddress(host)) {
    throw new Error(`observability viewer: refusing to bind "${host}". It serves the trace store with no credential check and binds loopback only: ${LOOPBACK_BIND_ADDRESSES.join(' or ')}.`);
  }
  const json = (res, body, code = 200) => {
    const s = JSON.stringify(body);
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': Buffer.byteLength(s) });
    res.end(s);
  };

  const server = createServer((req, res) => {
    if (!isLoopbackHostHeader(req.headers.host)) return json(res, { error: 'host not allowed: this viewer answers only requests addressed to loopback' }, 403);
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
      if (p === '/api/editorial') {
        /* What each Editorial Agent run proposed for the site's
           prose, and what it examined and left alone. `?trace=`
           narrows to one run. The no-change explanations travel
           with the proposals: a view carrying only what an agent
           wanted changed reports "examined and clear" as "not
           looked at". */
        const trace = url.searchParams.get('trace');
        if (trace && !/^[0-9a-f]{32}$/.test(trace)) return json(res, { error: 'bad trace id' }, 400);
        const traces = trace ? [trace] : listRuns(dir).map((r) => r.trace_id);
        const runs = [];
        for (const id of traces) {
          const t = loadTrace(id, dir);
          if (t?.editorial) runs.push(t.editorial);
        }
        return json(res, { editorial: runs });
      }
      if (p === '/api/ux') {
        /* What each UX audit found, what it could not settle from the
           source, and what it routed to another agent. `?trace=`
           narrows to one run. The open questions travel with the
           findings for the same reason the no-change explanations
           travel with the editorial proposals: a view carrying only
           what an agent found reports "could not be settled without
           opening a page" as "nothing there". */
        const trace = url.searchParams.get('trace');
        if (trace && !/^[0-9a-f]{32}$/.test(trace)) return json(res, { error: 'bad trace id' }, 400);
        const traces = trace ? [trace] : listRuns(dir).map((r) => r.trace_id);
        const runs = [];
        for (const id of traces) {
          const t = loadTrace(id, dir);
          if (t?.ux) runs.push(t.ux);
        }
        return json(res, { ux: runs });
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
    const bound = server.address();
    if (!bound || !isLoopbackAddress(bound.address)) {
      server.close();
      server.emit('error', new Error(`observability viewer: bound ${bound && bound.address}, which is not loopback; closed`));
      return;
    }
    if (quiet) return;
    console.log(`observability view → http://${host}:${port}`);
    console.log(`  store: ${dir}`);
    console.log(`  ctrl-c to stop`);
  });
  return server;
}
