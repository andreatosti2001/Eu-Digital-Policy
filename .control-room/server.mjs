/* ============================================================
   .control-room/server.mjs — the private control plane, over HTTP

   ONE RULE, AND EVERY OTHER LINE IN THIS FILE SERVES IT: no request
   reaches data without passing authentication and then authorization,
   in that order, on the server. There is no route that skips it "for
   the dashboard", none that reads a role out of a request, and none
   that trusts anything the client sends about who it is.

   THE ROUTE TABLE IS DATA (see `ROUTES`), and it is the object the
   suite reads. Three properties follow from that:

     · every route declares the permission it needs, and
       `routeFor()` fails closed on a route that declares none — an
       endpoint added without thinking about permission is refused,
       not published;
     · `PUBLIC_ROUTES` is a short, explicit, testable list, so
       "which routes answer an unauthenticated request" is a
       question with a written answer rather than an audit;
     · the suite can assert what is ABSENT — no deploy, no delete,
       no apply, no publish, no shell, no arbitrary file write —
       which is SESSION 21's "NO DIRECT PRODUCTION CONTROL". This
       server can OBSERVE, REVIEW and DECIDE. It cannot change the
       website, and there is no flag that lets it.

   WHY THIS IS NOT `agent/observability/server.mjs`. That file serves
   eleven privileged routes over the whole trace store and checks
   nothing; SESSION 20 measured it and found nine of them answering a
   request with no credential (docs/HEALTH-MONITOR.md §6). Its own
   header says it is a local development viewer, and that is a
   defensible thing to be. Reusing it here would have inherited a
   privileged API whose only protection is a default somebody can
   override, which is precisely what SESSION 20 recorded the finding
   in order to prevent.

   WHAT IS NOT A SECURITY CONTROL HERE, said out loud because
   protocol §10 requires it: not the dot-prefixed directory, not the
   absence of a link from the public site, not the port, not
   robots.txt, and not the interface hiding a button. Those are
   deployment and ergonomics. The controls are: a session the client
   cannot forge, an authorization decision on every privileged
   request, a CSRF token on every state-changing one, an audit entry
   for each, and a configuration that refuses to start in a
   dangerous shape.
   ============================================================ */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { CONTROL_ROOM_ROOT, assertConfig, describeConfig, requiresSecureCookies, isLoopback } from './config.mjs';
import { registryRefusals } from './identity.mjs';
import { SessionStore, OidcProvider, resolveSession, authenticateLocal, parseCookies, sessionCookie, safeEqual, SESSION_COOKIE, CSRF_HEADER, AuthFailed, sanitiseReturnTo } from './authn.mjs';
import { authorize, visibleActions } from './authz.mjs';
import { AuditLog } from './audit.mjs';
import { decide, proposalDetail, DecisionRefused } from './decide.mjs';
import { liveSystem, reviewQueueView, websiteHealth, operatorsView } from './views.mjs';
import { Tracer } from '../agent/observability/tracer.mjs';
import { JsonlSink } from '../agent/observability/sink.mjs';

const UI = join(CONTROL_ROOM_ROOT, 'ui');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

/** Body limit. A control plane has no reason to accept a large
 *  request, and an unbounded read is a way to spend a server's
 *  memory without authenticating. */
export const MAX_BODY_BYTES = 64 * 1024;

/** The login cookie for an OIDC round trip. It carries a handle to
 *  server-side state and nothing else, lives for the length of a
 *  login, and is SameSite=Lax because the identity provider's
 *  redirect back here is a cross-site top-level navigation. */
export const LOGIN_COOKIE = 'cr_login';

/**
 * Every route this server answers.
 *
 * `permission: null` is only legal together with `public: true` or
 * `session_only: true`. `routeFor()` refuses anything else, so a
 * route added without a permission fails closed rather than open.
 */
export const ROUTES = [
  /* -------- public: the login surface, and nothing else -------- */
  { method: 'GET', path: '/login', permission: null, public: true, what: 'the login page. Static markup with no system data in it.' },
  { method: 'GET', path: '/login.css', permission: null, public: true, what: 'the login page stylesheet.' },
  { method: 'GET', path: '/login.js', permission: null, public: true, what: 'the login page script. It carries no system data and makes one request, to /auth/providers.' },
  { method: 'GET', path: '/auth/providers', permission: null, public: true, what: 'which authentication provider is configured, so the login page can show the right form. It returns the provider name and nothing else — no operator, no route, no configuration, no version.' },
  { method: 'POST', path: '/auth/local', permission: null, public: true, what: 'development-provider login. Refused unless the local provider is configured, which config.mjs refuses outside loopback development.' },
  { method: 'GET', path: '/auth/login', permission: null, public: true, what: 'starts an OIDC login and redirects to the identity provider.' },
  { method: 'GET', path: '/auth/callback', permission: null, public: true, what: 'the OIDC redirect target. Verifies state, code, and the id_token signature, issuer, audience, expiry and nonce.' },
  { method: 'GET', path: '/healthz', permission: null, public: true, what: 'liveness. Returns {"status":"ok"} and no system information at all.' },

  /* -------- authenticated, no further permission -------- */
  { method: 'POST', path: '/auth/logout', permission: null, session_only: true, what: 'destroys the session server-side.' },
  { method: 'GET', path: '/api/session', permission: null, session_only: true, what: 'who the caller is, what the interface may offer them, and the CSRF token for this session.' },
  { method: 'GET', path: '/', permission: null, session_only: true, what: 'the Control Room shell. Behind the session gate so that discovering the URL is not access.' },
  { method: 'GET', path: '/app.css', permission: null, session_only: true, what: 'the Control Room stylesheet.' },
  { method: 'GET', path: '/app.js', permission: null, session_only: true, what: 'the Control Room client. It renders what the server assembles and decides nothing.' },

  /* -------- authenticated and authorized -------- */
  { method: 'GET', path: '/api/live', permission: 'live:read', what: 'view 1 — agent runs, events, discoveries, verification decisions, handoffs, downstream effects, failures.' },
  { method: 'GET', path: '/api/queue', permission: 'queue:read', what: 'view 2 — proposals awaiting a human decision, each with its full trace.' },
  { method: 'GET', path: '/api/proposal', permission: 'queue:read', what: 'one proposal, by ?id=. The same trace, alone.' },
  { method: 'GET', path: '/api/health', permission: 'health:read', what: 'view 3 — the last recorded health run, with every reading marked public-safe or private.' },
  { method: 'GET', path: '/api/audit', permission: 'audit:read', what: 'the approval audit trail, and the result of re-walking its hash chain.' },
  { method: 'GET', path: '/api/operators', permission: 'operators:read', what: 'who has access and with what role.' },
  /* The floor to reach the endpoint. The permission that actually
     decides is computed from the PROPOSAL inside decide(), because
     a human_only proposal needs the administrator-only one. */
  { method: 'POST', path: '/api/review', permission: 'proposal:request_changes', what: 'approve · reject · request changes. Records an authorization; publishes nothing.' },
];

/** Words that would make a route a production control. The suite
 *  asserts none of them appears in a path, so this list is the
 *  written form of "OBSERVE → REVIEW → DECIDE, not DELETE → FORCE →
 *  DEPLOY → MODIFY PRODUCTION". */
export const PROHIBITED_ROUTE_WORDS = ['deploy', 'publish', 'delete', 'destroy', 'force', 'apply', 'exec', 'shell', 'command', 'run-agent', 'write', 'upload', 'merge', 'push'];

export const PUBLIC_ROUTES = ROUTES.filter((r) => r.public).map((r) => `${r.method} ${r.path}`);

/**
 * Find the route, and refuse a malformed one.
 *
 * Returning `{ route: null, reason }` rather than throwing keeps the
 * fail-closed path the same shape as every other refusal here.
 */
export function routeFor(method, path) {
  const exact = ROUTES.find((r) => r.path === path);
  if (!exact) return { route: null, status: 404, reason: 'no such endpoint' };
  const byMethod = ROUTES.filter((r) => r.path === path);
  const match = byMethod.find((r) => r.method === method);
  if (!match) return { route: null, status: 405, reason: `${method} is not accepted on ${path}; ${byMethod.map((r) => r.method).join(', ')} is` };
  if (!match.permission && !match.public && !match.session_only) {
    /* Deny by default, at the table. A route that declares no
       permission and does not declare itself public or
       session-only is a route somebody forgot to think about, and
       it is refused rather than served. */
    return { route: null, status: 403, reason: `${method} ${path} declares no permission and is not marked public or session_only. Fail closed: an endpoint added without a permission is refused, not published.` };
  }
  return { route: match, status: 200, reason: null };
}

/* ---------------------------------------------------------- helpers */

const SECURITY_HEADERS = (cfg) => ({
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'x-frame-options': 'DENY',
  'cache-control': 'no-store',
  'permissions-policy': 'geolocation=(), camera=(), microphone=(), payment=()',
  /* No inline script, no external anything. The Control Room makes
     no third-party request for the same reason the public site
     makes none. */
  'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  ...(requiresSecureCookies(cfg) ? { 'strict-transport-security': 'max-age=31536000; includeSubDomains' } : {}),
});

function readBody(req) {
  const tooLarge = () => new DecisionRefused(`the request body is larger than ${MAX_BODY_BYTES} bytes`, { status: 413, code: 'body_too_large', fix: 'a control plane has no reason to accept a large request. Nothing this server accepts is bigger than a proposal id, a fingerprint and a note.' });

  /* Declared length first, so an oversized body is refused BEFORE
     it is read. Destroying the socket mid-upload loses the response
     the client needs to see, and a client that lies about its length
     still hits the streaming guard below. */
  const declared = Number(req.headers['content-length'] ?? 0);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return Promise.reject(tooLarge());

  return new Promise((ok, fail) => {
    let size = 0;
    let done = false;
    const chunks = [];
    req.on('data', (c) => {
      if (done) return;
      size += c.length;
      if (size > MAX_BODY_BYTES) { done = true; req.pause(); fail(tooLarge()); return; }
      chunks.push(c);
    });
    req.on('end', () => { if (!done) ok(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', (e) => { if (!done) { done = true; fail(e); } });
  });
}

/**
 * Parse a JSON body and REFUSE ANY KEY THAT IS NOT EXPECTED.
 *
 * This is the direct answer to "proposal scope cannot be expanded
 * through request manipulation": a body carrying `permitted_files`,
 * `scope`, `roles`, `outcome` or anything else the handler does not
 * read is rejected with the field named, rather than silently
 * ignored. Silently ignoring is safe today and stops being safe the
 * first time somebody adds a field with the same name as one of
 * them.
 */
export function parseStrictJson(text, allowed) {
  let body;
  try { body = JSON.parse(text || '{}'); }
  catch (e) { throw new DecisionRefused(`the request body is not JSON: ${e.message}`, { status: 400, code: 'bad_json' }); }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new DecisionRefused('the request body must be a JSON object', { status: 400, code: 'bad_json' });
  }
  const unknown = Object.keys(body).filter((k) => !allowed.includes(k));
  if (unknown.length) {
    throw new DecisionRefused(`the request body carries ${unknown.length} field(s) this endpoint does not accept: ${unknown.join(', ')}`, {
      status: 400, code: 'unknown_fields',
      detail: { unknown, accepted: allowed },
      fix: 'the accepted fields are listed above. Scope is read from the stored proposal, never from the request — a body naming files, roles or an outcome is refused rather than ignored.',
    });
  }
  return body;
}

/* ============================================================
   The server
   ============================================================ */

/**
 * @param {{cfg:object, quiet?:boolean, tracer?:object}} opts
 */
export function serve({ cfg, quiet = false, tracer = null } = {}) {
  assertConfig(cfg);

  /* State refusals are checked here rather than per request: a
     server with no operator provisioned cannot serve anybody, and
     starting it would leave a privileged port open that nothing can
     ever log in to. */
  const stateRefusals = registryRefusals(cfg);
  if (stateRefusals.length) {
    const e = new Error(`the Control Room refuses to start: ${stateRefusals[0].message}`);
    e.fix = stateRefusals[0].fix;
    e.name = 'StartupRefused';
    throw e;
  }

  const sessions = new SessionStore(cfg);
  const audit = new AuditLog(cfg);
  const oidc = cfg.provider === 'oidc' ? new OidcProvider(cfg) : null;
  const trace = tracer ?? new Tracer({ service: 'control-room', sink: new JsonlSink({ dir: cfg.trace_dir }) });

  const send = (res, code, body, extra = {}) => {
    const s = JSON.stringify(body);
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(s), ...SECURITY_HEADERS(cfg), ...extra });
    res.end(s);
  };
  const sendFile = (res, name, extra = {}) => {
    const file = resolve(UI, name);
    if (!file.startsWith(UI) || !existsSync(file) || !statSync(file).isFile()) return send(res, 404, { error: 'not found' });
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'content-length': body.length, ...SECURITY_HEADERS(cfg), ...extra });
    res.end(body);
  };
  const redirect = (res, location, extra = {}) => {
    res.writeHead(302, { location, ...SECURITY_HEADERS(cfg), ...extra });
    res.end();
  };

  const server = createServer(async (req, res) => {
    const requestInfo = {
      method: req.method,
      path: null,
      ip: req.socket?.remoteAddress ?? null,
      user_agent: req.headers['user-agent'] ?? null,
    };

    let url;
    try { url = new URL(req.url, cfg.public_origin ?? `http://${cfg.host}:${cfg.port}`); }
    catch { return send(res, 400, { error: 'bad request' }); }
    const path = url.pathname;
    requestInfo.path = path;

    try {
      const { route, status, reason } = routeFor(req.method, path);
      if (!route) return send(res, status, { error: reason });

      /* ---------------------------------------------- 1 · session */
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies[SESSION_COOKIE] ?? null;
      const resolved = route.public && !route.session_only && !route.permission
        ? { actor: null, session: null, reason: null }
        : resolveSession(cfg, sessions, token);

      if (!route.public && !resolved.actor) {
        /* Never a redirect for an API route: a 302 to a login page
           in answer to a data request is how a fetch ends up
           rendering HTML into a dashboard and calling it data. */
        if (path.startsWith('/api/') || req.method !== 'GET') {
          audit.record({ action: 'authz.denied', outcome: 'denied', request: requestInfo, reason: resolved.reason ?? 'unauthenticated', detail: { route: `${req.method} ${path}`, required: route.permission } });
          return send(res, 401, { error: 'unauthenticated', reason: resolved.reason });
        }
        return redirect(res, `/login?next=${encodeURIComponent(sanitiseReturnTo(path))}`);
      }

      /* ------------------------------------------ 2 · authorization
         Server-side, on the route's declared permission, before the
         handler runs. The interface's opinion is not consulted. */
      if (route.permission) {
        const d = authorize({ actor: resolved.actor, action: route.permission, resource: { kind: 'route', id: path } });
        if (!d.allow) {
          audit.record({ action: 'authz.denied', outcome: 'denied', actor: resolved.actor, session: resolved.session, request: requestInfo, reason: d.reason, detail: { route: `${req.method} ${path}`, required: route.permission } });
          return send(res, 403, { error: 'forbidden', reason: d.reason, required: route.permission });
        }
      }

      /* ------------------------------------------------- 3 · CSRF
         Every state-changing request except the login endpoints,
         which have no session to carry a token yet and are protected
         by the Origin check and by SameSite. */
      if (req.method === 'POST' && !route.public) {
        const origin = req.headers.origin;
        const expected = cfg.public_origin ?? `http://${cfg.host}:${cfg.port}`;
        if (origin && origin.replace(/\/+$/, '') !== expected.replace(/\/+$/, '')) {
          audit.record({ action: 'authz.denied', outcome: 'denied', actor: resolved.actor, session: resolved.session, request: requestInfo, reason: `the request Origin "${origin}" is not this server's origin`, detail: { route: `${req.method} ${path}` } });
          return send(res, 403, { error: 'forbidden', reason: 'cross-origin request' });
        }
        if (!safeEqual(req.headers[CSRF_HEADER], resolved.session?.csrf ?? '')) {
          audit.record({ action: 'authz.denied', outcome: 'denied', actor: resolved.actor, session: resolved.session, request: requestInfo, reason: 'the CSRF token is missing or does not match this session', detail: { route: `${req.method} ${path}` } });
          return send(res, 403, { error: 'forbidden', reason: `state-changing requests carry ${CSRF_HEADER}, matching the token GET /api/session returns for this session` });
        }
      }

      /* ---------------------------------------------- 4 · handlers */

      if (path === '/healthz') return send(res, 200, { status: 'ok' });

      if (path === '/login') return sendFile(res, 'login.html');
      if (path === '/login.css') return sendFile(res, 'login.css');
      if (path === '/login.js') return sendFile(res, 'login.js');
      /* The provider name, alone. Everything else about the
         configuration is behind the session gate. */
      if (path === '/auth/providers') return send(res, 200, { provider: cfg.provider });
      if (path === '/') return sendFile(res, 'app.html');
      if (path === '/app.css') return sendFile(res, 'app.css');
      if (path === '/app.js') return sendFile(res, 'app.js');

      /* ---- login: local development provider ---- */
      if (path === '/auth/local') {
        if (cfg.provider !== 'local') return send(res, 404, { error: 'no such endpoint' });
        const body = parseStrictJson(await readBody(req), ['subject', 'password', 'next']);
        let operator;
        try { operator = authenticateLocal(cfg, { subject: body.subject, password: body.password }); }
        catch (e) {
          audit.record({ action: 'session.login_failed', outcome: 'denied', request: requestInfo, attempted_subject: String(body.subject ?? '').slice(0, 120), reason: e.message, detail: { provider: 'local', code: e.code } });
          /* Deliberately the same message and the same status for an
             unknown subject and a wrong password. */
          return send(res, 401, { error: 'unauthenticated', reason: 'the subject or the password is wrong' });
        }
        const { token: fresh, record } = sessions.create({ operator, ip: requestInfo.ip, userAgent: requestInfo.user_agent, authMethod: 'local' });
        audit.record({ action: 'session.login', outcome: 'allowed', actor: operator, session: record, request: requestInfo, reason: 'local development provider' });
        return send(res, 200, { ok: true, actor: operator, csrf: record.csrf, next: sanitiseReturnTo(body.next) }, { 'set-cookie': sessionCookie(fresh, cfg) });
      }

      /* ---- login: OIDC ---- */
      if (path === '/auth/login') {
        if (!oidc) return send(res, 404, { error: 'no such endpoint' });
        const { url: authUrl, handle } = await oidc.begin({ returnTo: url.searchParams.get('next') ?? '/' });
        return redirect(res, authUrl, {
          'set-cookie': `${LOGIN_COOKIE}=${handle}; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=900${requiresSecureCookies(cfg) ? '; Secure' : ''}`,
        });
      }

      if (path === '/auth/callback') {
        if (!oidc) return send(res, 404, { error: 'no such endpoint' });
        const clearLogin = `${LOGIN_COOKIE}=; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=0${requiresSecureCookies(cfg) ? '; Secure' : ''}`;
        let out;
        try {
          out = await oidc.complete({ handle: cookies[LOGIN_COOKIE], code: url.searchParams.get('code'), state: url.searchParams.get('state') });
        } catch (e) {
          audit.record({ action: 'session.login_failed', outcome: 'denied', request: requestInfo, reason: e.message, detail: { provider: 'oidc', code: e.code ?? null } });
          return send(res, e.status ?? 401, { error: 'unauthenticated', reason: e.message }, { 'set-cookie': clearLogin });
        }
        const { token: fresh, record } = sessions.create({ operator: out.operator, ip: requestInfo.ip, userAgent: requestInfo.user_agent, authMethod: 'oidc' });
        audit.record({ action: 'session.login', outcome: 'allowed', actor: out.operator, session: record, request: requestInfo, reason: `oidc, subject ${out.claims.sub}` });
        return redirect(res, sanitiseReturnTo(out.returnTo), { 'set-cookie': [sessionCookie(fresh, cfg), clearLogin] });
      }

      if (path === '/auth/logout') {
        sessions.destroy(token);
        audit.record({ action: 'session.logout', outcome: 'allowed', actor: resolved.actor, session: resolved.session, request: requestInfo, reason: 'logout' });
        return send(res, 200, { ok: true }, { 'set-cookie': sessionCookie('', cfg, { clear: true }) });
      }

      /* ---- who am I ---- */
      if (path === '/api/session') {
        return send(res, 200, {
          actor: resolved.actor,
          /* Returned so the client can send it back on a POST. It is
             useless without the session cookie, which is HttpOnly. */
          csrf: resolved.session.csrf,
          session: { session_id: resolved.session.session_id, created_at: resolved.session.created_at, absolute_expires_at: resolved.session.absolute_expires_at, idle_expires_at: resolved.session.idle_expires_at, auth_method: resolved.session.auth_method },
          interface: visibleActions(resolved.actor),
          environment: { env: cfg.env, provider: cfg.provider, bind_is_loopback: isLoopback(cfg.host) },
        });
      }

      /* ---- the three views ---- */
      if (path === '/api/live') { audit.record({ action: 'view.read', outcome: 'allowed', actor: resolved.actor, session: resolved.session, request: requestInfo, reason: 'live_system' }); return send(res, 200, liveSystem(cfg)); }
      if (path === '/api/queue') { audit.record({ action: 'view.read', outcome: 'allowed', actor: resolved.actor, session: resolved.session, request: requestInfo, reason: 'review_queue' }); return send(res, 200, reviewQueueView(cfg)); }
      if (path === '/api/health') { audit.record({ action: 'view.read', outcome: 'allowed', actor: resolved.actor, session: resolved.session, request: requestInfo, reason: 'website_health' }); return send(res, 200, websiteHealth(cfg, { root: cfg.root })); }

      if (path === '/api/proposal') {
        const id = url.searchParams.get('id');
        if (!id) return send(res, 400, { error: 'bad request', reason: 'name a proposal with ?id=' });
        const item = proposalDetail(cfg, id);
        return item ? send(res, 200, item) : send(res, 404, { error: 'not found', reason: `no proposal "${id}" is in the record store` });
      }

      if (path === '/api/audit') {
        const q = audit.query({ action: url.searchParams.get('action'), actor_id: url.searchParams.get('actor'), proposal_id: url.searchParams.get('proposal'), limit: Number(url.searchParams.get('limit') ?? 200) });
        return send(res, 200, { ...q, chain: audit.verifyChain() });
      }

      if (path === '/api/operators') return send(res, 200, operatorsView(cfg));

      /* ---- the one state-changing action in the system ---- */
      if (path === '/api/review') {
        const body = parseStrictJson(await readBody(req), ['action', 'proposal_id', 'fingerprint', 'note']);
        try {
          const out = decide(cfg, {
            actor: resolved.actor, session: resolved.session, request: requestInfo,
            action: body.action, proposalId: body.proposal_id, fingerprint: body.fingerprint, note: body.note ?? null,
            audit, tracer: trace,
          });
          return send(res, 200, out);
        } catch (e) {
          if (e instanceof DecisionRefused) return send(res, e.status, { error: e.code, reason: e.message, fix: e.fix, detail: e.detail });
          throw e;
        }
      }

      return send(res, 404, { error: 'no such endpoint' });
    } catch (err) {
      if (err instanceof DecisionRefused) return send(res, err.status, { error: err.code, reason: err.message, fix: err.fix ?? null });
      if (err instanceof AuthFailed) return send(res, err.status, { error: err.code, reason: err.message });
      /* The message, not the stack. A stack trace on an error page
         is a map of the server's filesystem. */
      try { audit.record({ action: 'server.error', outcome: 'failed', request: requestInfo, reason: err.message }); } catch { /* never fail on the audit of a failure */ }
      return send(res, 500, { error: 'internal', reason: err.message });
    }
  });

  server.listen(cfg.port, cfg.host, () => {
    sessions.sweep();
    oidc?.sweep();
    try {
      audit.record({ action: 'server.started', outcome: 'ok', reason: `${cfg.env} · provider ${cfg.provider} · ${cfg.host}:${server.address().port}`, detail: describeConfig(cfg) });
    } catch { /* the server still starts */ }
    if (quiet) return;
    const { port } = server.address();
    console.log(`Control Room → http://${cfg.host}:${port}`);
    console.log(`  environment: ${cfg.env} · provider: ${cfg.provider} · loopback: ${isLoopback(cfg.host)}`);
    console.log(`  state:  ${cfg.state_dir}   (git-ignored, and inside the dot-prefixed tree the deployment does not publish)`);
    console.log(`  traces: ${cfg.trace_dir}`);
    console.log(`  ${PUBLIC_ROUTES.length} route(s) answer without a session: ${PUBLIC_ROUTES.join(', ')}`);
    console.log('  every other route authenticates, then authorizes, server-side.');
    console.log('  ctrl-c to stop');
  });

  server.controlRoom = { cfg, sessions, audit, oidc, tracer: trace };
  return server;
}
