/* ============================================================
   .control-room/config.mjs — what the Control Room refuses to start
   without

   THE FIRST THING TO KNOW IS WHY THIS DIRECTORY BEGINS WITH A DOT.

   Deployment is GitHub Pages serving `main` at the repository root
   with no `_config.yml`, no `.nojekyll` and no exclude list
   (docs/CURRENT-ARCHITECTURE.md §13). The unit of publication is
   therefore FILES IN THE REPOSITORY: `agent/`, `docs/` and `tools/`
   are published alongside `index.html`, and
   `node agent/implement/cli.mjs boundary` has reported that on every
   run since SESSION 18.

   The one exclusion that does exist is Jekyll's documented default:
   a path whose segments begin with `.` or `_` is not served. It is
   the only publication boundary this repository has, and
   `agent/implement/boundary.mjs publicSurface()` already models it —
   which is why `.agents/` does not appear in the published surface
   and `agent/` does.

   So the Control Room lives behind that boundary rather than beside
   the pages. That is a structural fact about the deployment, not a
   hidden route: protocol §10 is explicit that a hidden route, a
   hidden link, robots.txt, a frontend check and an unlisted page are
   NOT security mechanisms, and none of them is relied on here. What
   is relied on is that these files are not in the set the public
   host serves, and that NOTHING IN THEM IS A SECURITY CONTROL BY
   ITSELF: the server below authenticates and authorizes every
   privileged request whether or not anybody ever finds it.

   WHAT THIS FILE IS. The environment contract, and the refusals that
   run before the first request. A default is not a control — SESSION
   20 measured `agent/observability/server.mjs` and found nine of
   eleven privileged routes answering an unauthenticated request, its
   only protection being that `host` DEFAULTS to loopback. That
   finding is the reason every dangerous combination below is a
   REFUSAL TO START rather than a default somebody can override.

   NOTHING HERE IS A CREDENTIAL. Every secret arrives through the
   environment. `config.example.env` carries placeholders and is the
   only configuration file in the repository.
   ============================================================ */

import { resolve, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_RECORD_DIR } from '../agent/scout/store.mjs';
import { DECISION_DIR } from '../agent/implement/ledger.mjs';

export const CONTROL_ROOM_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
export const REPO_ROOT = resolve(CONTROL_ROOM_ROOT, '..');

/** The two environments, and they behave differently on purpose. */
export const ENVIRONMENTS = ['development', 'production'];

/** The authentication providers this build ships. `local` is
 *  development-only and `assertConfig` refuses it in production. */
export const PROVIDERS = ['oidc', 'local'];

export const DEFAULTS = {
  env: 'development',
  host: '127.0.0.1',
  port: 7802,
  provider: 'local',
  session_ttl_minutes: 480,
  session_idle_minutes: 30,
  scopes: 'openid email profile',
};

/** A loopback bind is the only one that is safe without TLS in front
 *  of it, and the only one a development provider may ever use. */
export const LOOPBACK = new Set(['127.0.0.1', '::1', 'localhost']);

export class ConfigRefused extends Error {
  constructor(message, { fix } = {}) { super(message); this.name = 'ConfigRefused'; this.fix = fix ?? null; }
}

const bool = (v, dflt = false) => (v === undefined || v === '' ? dflt : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()));
const int = (v, dflt) => (v === undefined || v === '' ? dflt : Number.parseInt(v, 10));

/**
 * Read the environment into a configuration object. This does not
 * validate — `assertConfig` does, separately, so a caller can print
 * a configuration and its refusals together.
 *
 * @param {NodeJS.ProcessEnv} env
 */
export function readConfig(env = process.env, { root = REPO_ROOT } = {}) {
  const stateDir = env.CONTROL_ROOM_STATE_DIR
    ? (isAbsolute(env.CONTROL_ROOM_STATE_DIR) ? env.CONTROL_ROOM_STATE_DIR : join(root, env.CONTROL_ROOM_STATE_DIR))
    : join(CONTROL_ROOM_ROOT, 'state');

  return {
    env: env.CONTROL_ROOM_ENV || DEFAULTS.env,
    host: env.CONTROL_ROOM_HOST || DEFAULTS.host,
    port: int(env.CONTROL_ROOM_PORT, DEFAULTS.port),
    provider: env.CONTROL_ROOM_AUTH_PROVIDER || DEFAULTS.provider,

    /* The origin a browser actually reaches this on. It is what the
       Origin header is checked against and what the OIDC redirect is
       built from, so a wrong value breaks the login rather than
       silently weakening it. */
    public_origin: env.CONTROL_ROOM_PUBLIC_ORIGIN || null,

    oidc: {
      issuer: env.CONTROL_ROOM_OIDC_ISSUER || null,
      client_id: env.CONTROL_ROOM_OIDC_CLIENT_ID || null,
      client_secret: env.CONTROL_ROOM_OIDC_CLIENT_SECRET || null,
      scopes: env.CONTROL_ROOM_OIDC_SCOPES || DEFAULTS.scopes,
      /* Off by default. A build that trusted an unsigned discovery
         document over plain HTTP would be trusting the network. */
      allow_insecure_issuer: bool(env.CONTROL_ROOM_OIDC_ALLOW_INSECURE, false),
    },

    session: {
      ttl_minutes: int(env.CONTROL_ROOM_SESSION_TTL_MINUTES, DEFAULTS.session_ttl_minutes),
      idle_minutes: int(env.CONTROL_ROOM_SESSION_IDLE_MINUTES, DEFAULTS.session_idle_minutes),
    },

    state_dir: stateDir,

    /* WHERE THE PROPOSALS AND THE GRANTS LIVE. Both default to the
       repository's own directories, and both are machine-level
       configuration rather than anything a request can influence:
       no route reads them, and pointing them elsewhere is an act by
       somebody with access to the environment, in the same class as
       choosing the state directory. They are configurable because
       the security suite has to be able to exercise a real approval
       without writing into the repository's one ledger. */
    records_dir: env.CONTROL_ROOM_RECORDS_DIR || DEFAULT_RECORD_DIR,
    decision_dir: env.CONTROL_ROOM_DECISIONS_DIR || DECISION_DIR,

    /* The SHARED observability store, deliberately. A Control Room
       decision that could not be correlated with the agent run that
       produced the proposal would break the trace protocol §28
       requires end to end. */
    trace_dir: env.CONTROL_ROOM_TRACE_DIR || join(root, 'agent', 'observability', 'runs'),
    root,
  };
}

/** True when cookies must carry `Secure`. Production always; a
 *  development server on loopback is reached over http and a Secure
 *  cookie would simply never be sent back. */
export const requiresSecureCookies = (cfg) => cfg.env === 'production';

export const isLoopback = (host) => LOOPBACK.has(host);

/**
 * Every reason this configuration may not start a server.
 *
 * Returns the list rather than throwing, so `cli.mjs check` can
 * print all of them at once. `assertConfig` throws on the first.
 *
 * @returns {{message:string, fix:string}[]}
 */
export function configRefusals(cfg) {
  const out = [];
  const refuse = (message, fix) => out.push({ message, fix });

  if (!ENVIRONMENTS.includes(cfg.env)) {
    refuse(`CONTROL_ROOM_ENV is "${cfg.env}", which is neither "development" nor "production"`,
      'set it to one of the two. An unrecognised environment is treated as neither, not as the safer one, because guessing which was meant is how a production server ends up running a development provider.');
  }
  if (!PROVIDERS.includes(cfg.provider)) {
    refuse(`CONTROL_ROOM_AUTH_PROVIDER is "${cfg.provider}", which is not a provider this build ships`,
      `set it to one of: ${PROVIDERS.join(', ')}.`);
  }

  /* 1 · the development provider may never serve production. */
  if (cfg.env === 'production' && cfg.provider === 'local') {
    refuse('the "local" authentication provider is development-only and CONTROL_ROOM_ENV is "production"',
      'set CONTROL_ROOM_AUTH_PROVIDER=oidc and configure an identity provider. The local provider exists so the security suite can run offline; it has no MFA, no account recovery and no central revocation, and protocol §11 asks for an established provider supporting secure sessions and, where appropriate, MFA.');
  }

  /* 2 · the development provider may never leave loopback, whatever
         the environment says. Two independent conditions, because a
         single one can be got round by changing one variable. */
  if (cfg.provider === 'local' && !isLoopback(cfg.host)) {
    refuse(`the "local" authentication provider may only bind loopback, and CONTROL_ROOM_HOST is "${cfg.host}"`,
      'bind 127.0.0.1, or configure the OIDC provider. This is a refusal rather than a default: SESSION 20 measured what an overridable default is worth (docs/HEALTH-MONITOR.md §6).');
  }

  /* 3 · leaving loopback at all is a production act. */
  if (!isLoopback(cfg.host) && cfg.env !== 'production') {
    refuse(`CONTROL_ROOM_HOST is "${cfg.host}", which is not loopback, and CONTROL_ROOM_ENV is "${cfg.env}"`,
      'binding a network interface is a production configuration. Set CONTROL_ROOM_ENV=production, an OIDC provider and an https CONTROL_ROOM_PUBLIC_ORIGIN, or bind 127.0.0.1.');
  }

  /* 4 · production needs to know its own origin, over TLS. Sessions
         are cookies; a cookie without Secure on a network interface
         is a session token in clear text. */
  if (cfg.env === 'production') {
    if (!cfg.public_origin) {
      refuse('CONTROL_ROOM_PUBLIC_ORIGIN is not set and the environment is production',
        'set it to the https origin a browser reaches this on. It is what the Origin header is checked against and what the OIDC redirect URI is built from.');
    } else if (!/^https:\/\//i.test(cfg.public_origin)) {
      refuse(`CONTROL_ROOM_PUBLIC_ORIGIN is "${cfg.public_origin}", which is not https`,
        'terminate TLS in front of this server and set the https origin. Session cookies carry Secure in production and would never be returned over http.');
    }
  }

  /* 5 · OIDC needs an issuer and a client, and the issuer must be
         https unless somebody has deliberately said otherwise for a
         local test IdP. */
  if (cfg.provider === 'oidc') {
    for (const [k, v] of [['CONTROL_ROOM_OIDC_ISSUER', cfg.oidc.issuer], ['CONTROL_ROOM_OIDC_CLIENT_ID', cfg.oidc.client_id]]) {
      if (!v) refuse(`${k} is not set and the provider is oidc`, 'configure the identity provider. See .control-room/config.example.env and docs/CONTROL-ROOM.md §3.');
    }
    if (cfg.oidc.issuer && !/^https:\/\//i.test(cfg.oidc.issuer) && !cfg.oidc.allow_insecure_issuer) {
      refuse(`CONTROL_ROOM_OIDC_ISSUER is "${cfg.oidc.issuer}", which is not https`,
        'use an https issuer. CONTROL_ROOM_OIDC_ALLOW_INSECURE=1 exists only for a local test identity provider on loopback and is refused in production below.');
    }
    if (cfg.oidc.allow_insecure_issuer && cfg.env === 'production') {
      refuse('CONTROL_ROOM_OIDC_ALLOW_INSECURE is set and the environment is production',
        'unset it. Trusting an unsigned discovery document fetched over http is trusting the network to say who the user is.');
    }
  }

  if (!Number.isInteger(cfg.port) || cfg.port < 0 || cfg.port > 65535) {
    refuse(`CONTROL_ROOM_PORT is "${cfg.port}"`, 'set a port between 0 and 65535. 0 asks the operating system for an ephemeral port, which is what the test suite uses.');
  }
  for (const [k, v] of [['CONTROL_ROOM_SESSION_TTL_MINUTES', cfg.session.ttl_minutes], ['CONTROL_ROOM_SESSION_IDLE_MINUTES', cfg.session.idle_minutes]]) {
    if (!Number.isInteger(v) || v < 1) refuse(`${k} is "${v}"`, 'set a whole number of minutes, at least 1. A session that never expires is not a session.');
  }
  if (Number.isInteger(cfg.session.idle_minutes) && Number.isInteger(cfg.session.ttl_minutes) && cfg.session.idle_minutes > cfg.session.ttl_minutes) {
    refuse('the idle timeout is longer than the absolute session lifetime, so it can never fire',
      'set CONTROL_ROOM_SESSION_IDLE_MINUTES below CONTROL_ROOM_SESSION_TTL_MINUTES.');
  }

  return out;
}

/** Throws on the first refusal. The server calls this before it
 *  listens; there is no flag that skips it. */
export function assertConfig(cfg) {
  const refusals = configRefusals(cfg);
  if (refusals.length) {
    const r = refusals[0];
    throw new ConfigRefused(`the Control Room refuses to start: ${r.message}`, { fix: r.fix });
  }
  return cfg;
}

/** What may be printed, logged or served. Note what is absent: the
 *  client secret, in every direction. */
export function describeConfig(cfg) {
  return {
    env: cfg.env,
    host: cfg.host,
    port: cfg.port,
    bind_is_loopback: isLoopback(cfg.host),
    provider: cfg.provider,
    public_origin: cfg.public_origin,
    secure_cookies: requiresSecureCookies(cfg),
    oidc: cfg.provider === 'oidc'
      ? { issuer: cfg.oidc.issuer, client_id: cfg.oidc.client_id, scopes: cfg.oidc.scopes, client_secret: cfg.oidc.client_secret ? '[set, not shown]' : '[not set]' }
      : null,
    session: cfg.session,
    state_dir: cfg.state_dir,
    trace_dir: cfg.trace_dir,
    records_dir: cfg.records_dir,
    decision_dir: cfg.decision_dir,
  };
}
