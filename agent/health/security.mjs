/* ============================================================
   agent/health/security.mjs — the security boundary

   The seven checks SESSION 20 names. They are filed under
   `control_plane` rather than as a fourth domain because that is
   what they protect: every one of them asks whether the private
   control plane has leaked into, or become reachable from, the
   public website. The domain's stake — "the system cannot say what
   it did or on whose authority" — is exactly what a boundary failure
   costs.

   THE INSTRUCTION THIS FILE IS BUILT AROUND:

     "Do not rely on frontend visibility or route obscurity as
      evidence of protection."

   So none of these checks asks whether something is LINKED, HIDDEN,
   UNLISTED or hard to guess. Each asks a structural question:

     · is the file inside the set the deployment publishes?
     · does the route perform an authentication check?
     · does the handler perform an authorization check?
     · would a request with no credential get an answer?

   `routesOf()` below parses `agent/observability/server.mjs` and
   answers the last three by reading the code, not by making
   requests. That is deliberate: a request-based check tests the
   configuration this machine happens to be running, and the
   question is what the code permits.

   WHAT IT FOUND, AND WHY IT IS A FINDING RATHER THAN A BUG.
   `agent/observability/server.mjs` serves eleven `/api/` endpoints
   over the whole trace store — agent inputs and outputs, decisions,
   approvals, provenance — and performs NO authentication and NO
   authorization on any of them. Its only control is that `host`
   DEFAULTS to 127.0.0.1. A default is not a control: it is a
   parameter, `serve({ host })` accepts any value, and a caller who
   passes '0.0.0.0' exposes the entire store to the network with
   nothing in the request path to object.

   That is honestly a reasonable design for a local development
   viewer, which is what its own header says it is. It is recorded
   here because SESSION 21 builds a Control Room, and a Control Room
   that reuses this server would inherit exactly this: a privileged
   API whose only protection is a default somebody can override.
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineMetric, measured, unmeasurable } from './model.mjs';
import { isWebsiteAsset, CONTROL_PLANE_DIRS } from '../implement/boundary.mjs';

/** Interfaces in this repository that serve privileged data, with
 *  what makes them privileged. An interface not on this list is not
 *  checked, and adding one is how a new server gets checked. */
export const PRIVILEGED_INTERFACES = [
  {
    path: 'agent/observability/server.mjs',
    what: 'the trace store: agent inputs and outputs, decisions, approvals, provenance, and every artifact pointer',
    route_prefix: '/api/',
  },
];

/** Shapes that would constitute an authentication check in a
 *  zero-dependency Node server. Absence of ALL of them is what the
 *  metric reports; presence of one is not proof the check is
 *  correct, only that one exists. */
export const AUTH_SIGNALS = [
  /req\.headers\s*\[\s*['"]authorization['"]\s*\]/i,
  /\bauthenticate\s*\(/,
  /\brequireAuth\b/,
  /\bverifyToken\b/,
  /\bsession\b\s*[.=]/,
  /\bWWW-Authenticate\b/i,
  /\b401\b/,
];

/**
 * Authorization signals. NOTE WHAT IS DELIBERATELY ABSENT: a bare
 * 403.
 *
 * The first draft of this list included one, and it reported
 * agent/observability/server.mjs as HAVING server-side authorization
 * — on the strength of `return json(res, { error: 'forbidden' }, 403)`
 * for a path that resolves outside the viewer directory. That is a
 * PATH CHECK. It refuses a traversal; it makes no decision about who
 * the caller is or what they may see, and counting it would have
 * turned the single most important finding in this file into a pass.
 *
 * A status code is not a control. An authorization signal has to name
 * an actor, a role, a permission or a resource decision.
 */
export const AUTHZ_SIGNALS = [
  /\bauthorize\s*\(/,
  /\brequireRole\b/,
  /\bhasPermission\b/,
  /\bpermissions?\s*[.[(]/,
  /\bactor\b\s*[.=]/,
  /\brole\s*[=:]\s*['"]/,
  /\bacl\b/i,
];

/** Words that would make a file a Control Room asset. Matched
 *  against the PATH, because a file's own contents claiming to be
 *  private is not a boundary either. */
export const CONTROL_ROOM_MARKERS = [
  'control-room', 'control_room', 'controlroom',
  'admin', 'approve', 'approval-ui', 'operator', 'console',
];

/** Mutations that would let a caller decide a proposal. */
export const APPROVAL_ACTION_SIGNALS = [
  /recordDecision\s*\(/,
  /\bgrant(ed)?\b\s*[:=]/,
  /['"]\/api\/(approve|decide|approval)/,
];

/**
 * Parse a Node http server for its routes and what each one checks.
 *
 * Reading the source rather than making requests is the point: a
 * request-based probe tests the configuration this process happens
 * to have started with, and the question is what the CODE permits
 * anyone to start.
 *
 * @returns {{path:string, exists:boolean, routes:object[], binds:string|null,
 *            host_is_a_parameter:boolean, has_auth:boolean, has_authz:boolean,
 *            methods_accepted:string[]}}
 */
export function analyseInterface(spec, root) {
  const abs = join(root, spec.path);
  if (!existsSync(abs)) return { path: spec.path, exists: false, routes: [], binds: null, host_is_a_parameter: false, has_auth: false, has_authz: false, methods_accepted: [] };
  const src = readFileSync(abs, 'utf8');

  /* Every literal route this file answers on. */
  const routes = [];
  for (const m of src.matchAll(/p\s*(?:===|\.startsWith\()\s*['"]([^'"]+)['"]/g)) {
    const route = m[1];
    if (!route.startsWith('/')) continue;
    /* The prefix itself is the catch-all that answers 404 for an
       unknown endpoint. It is not a route serving data, and counting
       it would inflate every number in this file by one. */
    if (route === spec.route_prefix) continue;
    routes.push({ route, privileged: route.startsWith(spec.route_prefix) });
  }

  const hostDefault = (src.match(/host\s*=\s*['"]([^'"]+)['"]/) ?? [])[1] ?? null;
  /* A default is not a control. If `host` is a parameter, a caller
     chooses it, and the loopback default protects only callers who
     do not pass one. */
  const hostIsParameter = /function\s+serve\s*\(\s*\{[^}]*\bhost\b/.test(src) || /\bhost\s*=\s*['"][^'"]+['"]/.test(src);

  const hasAuth = AUTH_SIGNALS.some((re) => re.test(src));
  const hasAuthz = AUTHZ_SIGNALS.some((re) => re.test(src));

  const methods = [...new Set([...src.matchAll(/req\.method\s*(?:===|!==)\s*['"]([A-Z]+)['"]/g)].map((m) => m[1]))];
  /* A server that never inspects req.method answers every verb it is
     given, which is a broader surface than its route list suggests. */
  const acceptsAnyMethod = methods.length === 0;

  return {
    path: spec.path,
    exists: true,
    what: spec.what,
    routes: [...new Map(routes.map((r) => [r.route, r])).values()],
    privileged_routes: [...new Set(routes.filter((r) => r.privileged).map((r) => r.route))],
    binds: hostDefault,
    host_is_a_parameter: hostIsParameter,
    has_auth: hasAuth,
    has_authz: hasAuthz,
    methods_checked: methods,
    accepts_any_method: acceptsAnyMethod,
  };
}

export function analyseAll(root) {
  return PRIVILEGED_INTERFACES.map((s) => analyseInterface(s, root));
}

export const SECURITY_METRICS = [

  defineMetric({
    id: 'control_plane.secrets_in_public_assets',
    name: 'Secrets in public assets',
    domain: 'control_plane',
    definition: 'Credential shapes found in a file the published site serves, split by whether the file is one a reader\'s browser loads or merely one the deployment happens to publish.',
    source: 'agent/implement/boundary.mjs scanSecrets(), over the published surface',
    calculation: 'Eleven credential patterns matched against every text file in the published surface. A hit in a website asset — the seven pages, js/, css/, data/, i18n/, fonts/, app.js, style.css — is BLOCKING. A hit in a declared test fixture is classified and counted separately, because the suites that prove agent/observability/redact.mjs works must contain something to redact.',
    frequency: 'per_commit',
    interpretation: 'Any blocking value above 0 is an incident, not a metric movement: a credential in a file a reader\'s browser loads has already been published, and rotating it comes before fixing the commit. The fixture count should be stable; a RISE in it means a new synthetic credential was added, or a real one was put somewhere the classifier treats as a fixture.',
    limitations: 'It matches known credential SHAPES. A credential it does not match is a credential it did not find, and a clean run is not proof the tree holds no secret. It reads only text files: a key inside a font or an image is invisible. It also sees only the CURRENT tree — a secret committed and later removed is still in the history and still published to anyone who clones.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const s = ctx.secrets;
      return measured(s.blocking.length, {
        unit: 'blocking credentials',
        detail: {
          blocking: s.blocking.map((f) => ({ path: f.path, line: f.line, pattern: f.pattern, class: f.class })),
          in_test_fixtures: s.fixtures.length,
          fixture_paths: [...new Set(s.fixtures.map((f) => f.path))],
          files_scanned: s.scanned,
          patterns: s.patterns,
          history_note: 'this sees the current tree only. A secret committed and later removed remains in the git history and is published to anyone who clones.',
          bound: s.bound,
        },
        evidence: ['agent/implement/boundary.mjs'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.privileged_endpoints_exposed',
    name: 'Privileged endpoints exposed publicly',
    domain: 'control_plane',
    definition: 'Privileged HTTP routes whose only protection against public reachability is a default that a caller can override.',
    source: 'agent/health/security.mjs analyseInterface(), parsing agent/observability/server.mjs',
    calculation: 'For each privileged interface, the routes under its privileged prefix, counted when the bind host is a PARAMETER with a loopback default rather than a fixed loopback bind. A default is not a control.',
    frequency: 'per_commit',
    interpretation: 'Above 0 means the code permits a caller to expose those routes to a network, and nothing in the request path would object if they did. That is a defensible design for a local development viewer, which is what agent/observability/server.mjs says it is. It becomes a real exposure the moment anything reuses it — and SESSION 21 builds a Control Room.',
    limitations: 'It reads the code, not a running process. It cannot tell whether anybody has ever started the server with a non-loopback host, and it does not probe the network. It also only checks interfaces listed in PRIVILEGED_INTERFACES: a new server nobody adds to that list is not checked, which is the standing weakness of every allowlist.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const ifaces = analyseAll(ctx.root);
      const exposed = ifaces.filter((i) => i.exists && i.host_is_a_parameter);
      return measured(exposed.reduce((n, i) => n + i.privileged_routes.length, 0), {
        unit: 'routes whose only control is an overridable default',
        detail: {
          interfaces: ifaces.map((i) => ({
            path: i.path,
            exists: i.exists,
            privileged_routes: i.privileged_routes ?? [],
            binds_by_default: i.binds,
            host_is_a_parameter: i.host_is_a_parameter,
            serves: i.what ?? null,
          })),
          note: 'the bind address is a PARAMETER with a loopback default. serve({ host }) accepts any value, and a caller passing 0.0.0.0 exposes the whole trace store with nothing in the request path to refuse.',
        },
        evidence: ['agent/observability/server.mjs'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.control_room_assets_published',
    name: 'Control Room assets in the published surface',
    domain: 'control_plane',
    definition: 'Files whose path marks them as an administrative or Control Room asset, present in the set the deployment publishes.',
    source: 'agent/implement/boundary.mjs publicSurface(), matched against CONTROL_ROOM_MARKERS',
    calculation: 'Published files whose path contains control-room, admin, approve, operator or console. Also reports whether any exclusion mechanism exists at all — because with none, a future Control Room page IS published, and the count being 0 today says only that nobody has added one yet.',
    frequency: 'per_commit',
    interpretation: 'Above 0 means an administrative asset is on the public web. The 0 today is not a clearance: there is no _config.yml, no .nojekyll and no exclude list, so nothing WOULD stop one. Protocol §10 is explicit that hidden routes, unlisted pages and robots.txt are not security mechanisms, and this metric is deliberately not satisfied by any of them.',
    limitations: 'It matches on PATH. A Control Room page called something else is invisible to it — which is why the second half of the reading, whether any exclusion mechanism exists, matters more than the count. Whether the live site actually serves what this predicts has never been confirmed: the network policy refuses that origin.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const published = ctx.surface.published;
      const hits = published.filter((f) => CONTROL_ROOM_MARKERS.some((m) => f.toLowerCase().includes(m)));
      const hasExclusion = ctx.surface.has_config || ctx.surface.has_nojekyll;
      return measured(hits.length, {
        unit: 'published administrative assets',
        of: published.length,
        detail: {
          matches: hits,
          exclusion_mechanism_exists: hasExclusion,
          has_config_yml: ctx.surface.has_config,
          has_nojekyll: ctx.surface.has_nojekyll,
          control_plane_directories_in_the_published_surface: ctx.exposure.exposed.map((e) => ({ prefix: e.prefix, files: e.files })),
          standing_finding: hasExclusion
            ? null
            : 'THERE IS NO EXCLUSION MECHANISM. GitHub Pages serves main at the repository root with no _config.yml, no .nojekyll and no exclude list. A Control Room page added to this tree would be published the moment it was pushed. The 0 above means nobody has added one, not that one would be protected.',
          not_established: ctx.surface.unresolved,
        },
        evidence: ['agent/implement/boundary.mjs'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.privileged_routes_without_auth',
    name: 'Privileged routes with no authentication',
    domain: 'control_plane',
    definition: 'Routes serving privileged data whose handler performs no authentication check of any kind.',
    source: 'agent/health/security.mjs analyseInterface(), parsing the server source for authentication signals',
    calculation: 'Privileged routes in an interface whose source contains none of: an Authorization header read, an authenticate/requireAuth/verifyToken call, a session reference, a WWW-Authenticate header, or a 401 response.',
    frequency: 'per_commit',
    interpretation: 'This is the metric control_plane.authn_authz_failures points at. There is no authentication in this repository, so counting FAILED authentications would report 0 and read as "nobody was turned away" — when the truth is that nobody is asked. The missing control belongs here, as a count of routes that would answer anyone, and a 0 in the other metric is meaningless until this one is 0 first.',
    limitations: 'It matches signals in source text. A server with an authentication mechanism this list does not recognise would be reported as having none — a false positive, which is the safe direction for a security check. It cannot judge whether an auth check that EXISTS is correct.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const ifaces = analyseAll(ctx.root).filter((i) => i.exists);
      if (!ifaces.length) return unmeasurable('no interface in PRIVILEGED_INTERFACES exists in this tree', 'add the interface to PRIVILEGED_INTERFACES, or restore the file');
      const unauth = ifaces.filter((i) => !i.has_auth);
      return measured(unauth.reduce((n, i) => n + i.privileged_routes.length, 0), {
        unit: 'unauthenticated privileged routes',
        detail: {
          interfaces: ifaces.map((i) => ({ path: i.path, privileged_routes: i.privileged_routes.length, has_auth: i.has_auth, routes: i.privileged_routes })),
          note: 'no authentication signal of any kind is present. The only control is the bind address, which is a default a caller can override.',
        },
        evidence: ['agent/observability/server.mjs'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.privileged_routes_without_authz',
    name: 'Privileged routes with no server-side authorization',
    domain: 'control_plane',
    definition: 'Routes serving privileged data whose handler performs no authorization decision — no actor, no role, no resource check.',
    source: 'agent/health/security.mjs analyseInterface(), parsing the server source for authorization signals',
    calculation: 'Privileged routes in an interface whose source contains no authorize/requireRole/permission call and no 403 response arising from a permission decision.',
    frequency: 'per_commit',
    interpretation: 'Authentication establishes identity; authorization establishes permission, and they are separate controls. A route with neither answers everyone identically, which is what these do. Counted separately from authentication because fixing one does not fix the other — a Control Room that authenticated every caller and then served every caller the same data would score 0 above and the full count here.',
    limitations: 'Same as the authentication check: it matches source signals, cannot judge correctness, and reports a false positive rather than a false negative when it does not recognise a mechanism. agent/observability/server.mjs does return 403 for a path-traversal attempt, which is a path check and not an authorization decision; the signal list is written to exclude it.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const ifaces = analyseAll(ctx.root).filter((i) => i.exists);
      if (!ifaces.length) return unmeasurable('no interface in PRIVILEGED_INTERFACES exists in this tree', 'add the interface to PRIVILEGED_INTERFACES, or restore the file');
      const unauthz = ifaces.filter((i) => !i.has_authz);
      return measured(unauthz.reduce((n, i) => n + i.privileged_routes.length, 0), {
        unit: 'unauthorized privileged routes',
        detail: {
          interfaces: ifaces.map((i) => ({ path: i.path, privileged_routes: i.privileged_routes.length, has_authz: i.has_authz })),
          note: 'authentication establishes identity, authorization establishes permission. These routes make no authorization decision: every caller who reaches them gets the same answer.',
        },
        evidence: ['agent/observability/server.mjs'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.approval_actions_publicly_reachable',
    name: 'Approval actions reachable without authorization',
    domain: 'control_plane',
    definition: 'Interfaces that expose an approval or decision action — anything that could move a proposal from pending to granted — over HTTP without an authorization decision.',
    source: 'agent/health/security.mjs, matching APPROVAL_ACTION_SIGNALS against every privileged interface and the published surface',
    calculation: 'Privileged interfaces whose source calls recordDecision, or routes named approve/decide/approval, counted when no authorization signal is present. Also checks the published surface for any file exposing such an action.',
    frequency: 'per_commit',
    interpretation: 'Any value above 0 is the most serious finding this monitor can produce: it means a proposal could be approved by whoever reaches the endpoint, which defeats the entire governance chain. The 0 today has a specific cause worth knowing: the ONLY code path that writes a grant is a CLI command, and no HTTP interface in this repository can reach it.',
    limitations: 'It checks the interfaces in PRIVILEGED_INTERFACES and the published surface. An approval action added to a new server nobody registered is not checked. It also cannot see an approval performed by editing the ledger file directly, which anybody with write access to the working tree can do — that is docs/IMPLEMENTATION-QA.md §9 open question 1 and it is not a defect this metric can find.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      const ifaces = analyseAll(ctx.root).filter((i) => i.exists);
      const offenders = [];
      for (const spec of PRIVILEGED_INTERFACES) {
        const abs = join(ctx.root, spec.path);
        if (!existsSync(abs)) continue;
        const src = readFileSync(abs, 'utf8');
        const exposes = APPROVAL_ACTION_SIGNALS.filter((re) => re.test(src));
        const iface = ifaces.find((i) => i.path === spec.path);
        if (exposes.length && !(iface?.has_authz)) offenders.push({ path: spec.path, signals: exposes.map(String) });
      }
      /* And the published surface: a static page carrying an approve
         button is not an approval action, but a page that POSTs to
         one would be. Nothing here does; the check exists so that a
         future one is caught. */
      const publishedWithActions = ctx.surface.published
        .filter((f) => isWebsiteAsset(f))
        .filter((f) => {
          try { return APPROVAL_ACTION_SIGNALS.some((re) => re.test(readFileSync(join(ctx.root, f), 'utf8'))); }
          catch { return false; }
        });

      return measured(offenders.length + publishedWithActions.length, {
        unit: 'reachable approval actions',
        detail: {
          interfaces_exposing_an_approval_action: offenders,
          website_assets_exposing_one: publishedWithActions,
          why_zero: 'the only code path that writes a grant is `node agent/implement/cli.mjs decide`, a CLI command. No HTTP interface in this repository can reach it, and no page carries one.',
          not_covered: 'a person editing agent/implement/decisions/decisions.jsonl directly. That is not an HTTP exposure and this metric cannot find it — docs/IMPLEMENTATION-QA.md §9 open question 1.',
        },
        evidence: ['agent/implement/cli.mjs', 'agent/observability/server.mjs'],
      });
    },
  }),

  defineMetric({
    id: 'control_plane.privileged_responses_without_authorization',
    name: 'Privileged API responses served without authorization',
    domain: 'control_plane',
    definition: 'Privileged routes that return data to a caller who presented no credential and passed no authorization check — measured by starting the server on loopback and requesting each route with no headers.',
    source: 'agent/health/security.mjs, by starting agent/observability/server.mjs on an ephemeral loopback port and requesting each privileged route',
    calculation: 'Each privileged route is requested with no Authorization header and no cookie. A 2xx carrying a body is a privileged response served without authorization. The server is started on 127.0.0.1 on an ephemeral port and shut down immediately afterwards; nothing is exposed to a network by this measurement.',
    frequency: 'per_run',
    interpretation: 'This is the one check in this file that PROBES rather than reads, and it exists because the other six could all be satisfied by code that still answers anyone. Above 0 means an unauthenticated request got privileged data back. The number today equals the route count, and that is the honest state of a local development viewer with no auth — it is recorded so that SESSION 21 cannot inherit it silently.',
    limitations: 'It probes on loopback, which is where the server is meant to run. It establishes that the ROUTES answer without a credential, not that they are reachable from anywhere else — reachability is a deployment question this repository cannot observe. It is skipped when the monitor runs with --no-probe.',
    visibility: 'private',
    direction: 'lower_is_better',
    measure(ctx) {
      if (ctx.probe === null || ctx.probe === undefined) {
        return unmeasurable(
          'the loopback probe did not run in this gathering.',
          'run the monitor without --no-probe. The probe starts agent/observability/server.mjs on 127.0.0.1 on an ephemeral port, requests each privileged route with no credential, and shuts it down.',
        );
      }
      if (ctx.probe.error) {
        return unmeasurable(`the probe could not start the server: ${ctx.probe.error}`, 'a working agent/observability/server.mjs; node --test agent/observability/selftest.mjs tests it');
      }
      const answered = ctx.probe.results.filter((r) => r.status >= 200 && r.status < 300 && r.bytes > 0);
      return measured(answered.length, {
        unit: 'routes answering an unauthenticated request',
        of: ctx.probe.results.length,
        detail: {
          answered: answered.map((r) => ({ route: r.route, status: r.status, bytes: r.bytes })),
          refused: ctx.probe.results.filter((r) => r.status === 401 || r.status === 403).map((r) => r.route),
          probed_on: ctx.probe.origin,
          note: 'requested with no Authorization header and no cookie, on loopback. This establishes that the routes answer without a credential — not that they are reachable from elsewhere, which is a deployment question nothing here can observe.',
        },
        evidence: ['agent/observability/server.mjs'],
      });
    },
  }),

];
