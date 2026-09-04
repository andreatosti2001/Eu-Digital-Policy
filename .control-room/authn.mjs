/* ============================================================
   .control-room/authn.mjs — establishing who is making the request

   TWO PROVIDERS, AND ONLY ONE OF THEM MAY SERVE PRODUCTION.

   `oidc` — OpenID Connect authorization code flow with PKCE, against
   an established identity provider. Discovery document, JWKS, an
   id_token whose signature, issuer, audience, expiry and nonce are
   all checked before anybody is anybody. MFA, account recovery,
   password policy and revocation are the identity provider's, which
   is the entire reason protocol §11 says to prefer one.

   `local` — a development provider, scrypt over a registry a person
   provisioned by hand. `config.mjs` refuses to let it run in
   production and refuses to let it bind anything but loopback, in
   two independent checks. Its documented architectural reason is in
   docs/CONTROL-ROOM.md §3: this repository has no dependencies and
   this environment has no outbound network, so without an offline
   provider the sixteen security proofs could not be RUN, and a
   security boundary nobody has executed is a claim.

   WHAT A SESSION IS HERE, AND WHAT IT IS NOT.

   The cookie carries ONE thing: 256 bits of randomness. It carries
   no identity, no role, no expiry and no signature, so there is
   nothing in it to forge — a modified cookie is a session id that
   does not exist. Everything else lives server-side, in a file named
   by the SHA-256 of the token, so the store itself does not contain
   a usable credential either.

   `resolveSession()` re-reads the operator's roles FROM THE REGISTRY
   on every request rather than trusting what was true at login. A
   role revoked at 11:00 is gone at 11:00, not when a session
   happens to expire. `roles_at_login` is kept for the audit trail
   and is never used for a decision.

   NOTHING SENSITIVE IS RETURNED, LOGGED OR TRACED. Not the token,
   not the password, not the id_token, not the access token — the
   access token is never even stored, because the Control Room needs
   an identity and not an API credential. The redaction layer in
   `agent/observability/redact.mjs` is a second line, not the first.
   ============================================================ */

import { randomBytes, createHash, timingSafeEqual, createPublicKey, verify as cryptoVerify, constants } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { findOperator, findOperatorById, publicOperator, verifyPassword, touchOperator } from './identity.mjs';

export class AuthFailed extends Error {
  constructor(message, { code = 'unauthenticated', status = 401 } = {}) { super(message); this.name = 'AuthFailed'; this.code = code; this.status = status; }
}

export const SESSION_COOKIE = 'cr_session';
export const CSRF_HEADER = 'x-control-room-csrf';

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const sha256hex = (s) => createHash('sha256').update(s).digest('hex');
const nowIso = () => new Date().toISOString();

/** Constant-time string comparison that does not leak length by
 *  throwing. Used for the CSRF token. */
export function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? ''), 'utf8');
  const y = Buffer.from(String(b ?? ''), 'utf8');
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

/* ============================================================
   The session store
   ============================================================ */

export class SessionStore {
  constructor(cfg) {
    this.cfg = cfg;
    this.dir = join(cfg.state_dir, 'sessions');
  }

  #path(tokenSha) { return join(this.dir, `${tokenSha}.json`); }

  /**
   * Mint a session for an authenticated operator.
   *
   * Returns the token exactly once, to the caller who will put it in
   * a Set-Cookie header. It is not stored, not returned again, and
   * not recoverable from the store — the store holds its hash.
   */
  create({ operator, ip = null, userAgent = null, authMethod, now = nowIso }) {
    mkdirSync(this.dir, { recursive: true });
    const token = b64url(randomBytes(32));
    const tokenSha = sha256hex(token);
    const t = Date.parse(now());
    const record = {
      session_id: `sess-${b64url(randomBytes(9))}`,
      token_sha256: tokenSha,
      operator_id: operator.operator_id,
      provider: operator.provider,
      subject: operator.subject,
      /* For the audit trail only. Authorization always re-reads the
         registry; see resolveSession below. */
      roles_at_login: [...(operator.roles ?? [])],
      auth_method: authMethod,
      created_at: new Date(t).toISOString(),
      last_seen_at: new Date(t).toISOString(),
      absolute_expires_at: new Date(t + this.cfg.session.ttl_minutes * 60_000).toISOString(),
      idle_expires_at: new Date(t + this.cfg.session.idle_minutes * 60_000).toISOString(),
      /* Double-submit CSRF secret. Useless on its own: a request
         needs the cookie AND this, and the cookie is SameSite. */
      csrf: b64url(randomBytes(24)),
      ip,
      user_agent: userAgent ? String(userAgent).slice(0, 200) : null,
    };
    writeFileSync(this.#path(tokenSha), `${JSON.stringify(record, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    return { token, record };
  }

  read(token) {
    if (!token || typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,200}$/.test(token)) return null;
    const file = this.#path(sha256hex(token));
    if (!existsSync(file)) return null;
    try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; }
  }

  touch(record, now = nowIso) {
    const t = Date.parse(now());
    record.last_seen_at = new Date(t).toISOString();
    record.idle_expires_at = new Date(t + this.cfg.session.idle_minutes * 60_000).toISOString();
    try { writeFileSync(this.#path(record.token_sha256), `${JSON.stringify(record, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 }); } catch { /* a failed touch must not fail the request */ }
    return record;
  }

  destroy(token) {
    if (!token) return false;
    const file = this.#path(sha256hex(token));
    if (!existsSync(file)) return false;
    rmSync(file, { force: true });
    return true;
  }

  /** Every session for one operator, by id. Used when a role is
   *  revoked and by `cli.mjs sessions`. */
  destroyForOperator(operatorId) {
    if (!existsSync(this.dir)) return 0;
    let n = 0;
    for (const f of readdirSync(this.dir)) {
      if (!f.endsWith('.json')) continue;
      try {
        const rec = JSON.parse(readFileSync(join(this.dir, f), 'utf8'));
        if (rec.operator_id === operatorId) { rmSync(join(this.dir, f), { force: true }); n++; }
      } catch { /* a session file that does not parse is removed too */ }
    }
    return n;
  }

  sweep(now = nowIso) {
    if (!existsSync(this.dir)) return 0;
    const t = Date.parse(now());
    let n = 0;
    for (const f of readdirSync(this.dir)) {
      if (!f.endsWith('.json')) continue;
      const p = join(this.dir, f);
      try {
        const rec = JSON.parse(readFileSync(p, 'utf8'));
        if (Date.parse(rec.absolute_expires_at) <= t || Date.parse(rec.idle_expires_at) <= t) { rmSync(p, { force: true }); n++; }
      } catch { rmSync(p, { force: true }); n++; }
    }
    return n;
  }
}

/**
 * Turn a cookie into an actor, or into a stated reason there is
 * none. Every privileged route in `server.mjs` starts here.
 *
 * @returns {{actor:object|null, session:object|null, reason:string|null}}
 */
export function resolveSession(cfg, store, token, { now = nowIso } = {}) {
  const record = store.read(token);
  if (!record) return { actor: null, session: null, reason: 'no session. The cookie is absent, malformed, or names a session that does not exist — which is what a forged one looks like, because the cookie carries nothing but randomness.' };

  const t = Date.parse(now());
  if (Date.parse(record.absolute_expires_at) <= t) {
    store.destroy(token);
    return { actor: null, session: null, reason: `the session reached its absolute lifetime at ${record.absolute_expires_at}. Re-authenticate.` };
  }
  if (Date.parse(record.idle_expires_at) <= t) {
    store.destroy(token);
    return { actor: null, session: null, reason: `the session was idle past ${record.idle_expires_at}. Re-authenticate.` };
  }

  /* THE REGISTRY IS THE AUTHORITY, not the session. A role revoked
     since login is gone now. */
  const op = findOperatorById(cfg, record.operator_id);
  if (!op) return { actor: null, session: null, reason: `the session names operator ${record.operator_id}, who is no longer in the registry. Access removed since login is access removed now.` };
  if (op.disabled) return { actor: null, session: null, reason: `operator ${op.operator_id} is disabled.` };

  store.touch(record, now);
  return { actor: { ...publicOperator(op), session_id: record.session_id }, session: record, reason: null };
}

/* ============================================================
   Provider · local (development only)
   ============================================================ */

/**
 * Authenticate a subject and password against the operator registry.
 *
 * The failure message is the SAME for an unknown subject and a wrong
 * password, and the scrypt work is done either way, so the response
 * does not say which of the two was wrong.
 */
export function authenticateLocal(cfg, { subject, password }) {
  if (cfg.provider !== 'local') throw new AuthFailed('the local provider is not configured', { code: 'provider_mismatch', status: 400 });
  const op = findOperator(cfg, { provider: 'local', subject: String(subject ?? '') });
  /* A fixed decoy so an unknown subject costs the same as a known
     one. The value is not a credential: no operator can ever hold
     it, because it is generated fresh per process. */
  const decoy = DECOY_SECRET;
  const ok = op && !op.disabled ? verifyPassword(password, op.secret) : (verifyPassword(password, decoy), false);
  if (!ok) throw new AuthFailed('the subject or the password is wrong', { code: 'bad_credentials', status: 401 });
  touchOperator(cfg, op.operator_id);
  return publicOperator(op);
}

/* Generated once per process, never written down, never checked
   against anything real. Its only job is to make the timing of a
   miss look like the timing of a hit. */
const DECOY_SECRET = (() => {
  const salt = randomBytes(16);
  return { algo: 'scrypt', N: 32768, r: 8, p: 1, keylen: 32, salt: salt.toString('base64'), hash: b64url(randomBytes(32)) };
})();

/* ============================================================
   Provider · OIDC
   ============================================================ */

/** Algorithms accepted on an id_token. `none` is absent because it
 *  is the classic forgery, and HS* is absent because a shared-secret
 *  signature over an assertion about identity is a weaker thing than
 *  a public-key one and this build does not need it. */
export const ACCEPTED_JWT_ALGS = new Set(['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512']);

const ALG_PARAMS = {
  RS256: { hash: 'sha256' }, RS384: { hash: 'sha384' }, RS512: { hash: 'sha512' },
  PS256: { hash: 'sha256', pss: true }, PS384: { hash: 'sha384', pss: true }, PS512: { hash: 'sha512', pss: true },
  ES256: { hash: 'sha256', ec: true }, ES384: { hash: 'sha384', ec: true }, ES512: { hash: 'sha512', ec: true },
};

/** Clock skew tolerated on exp/iat, in seconds. */
export const CLOCK_SKEW_SECONDS = 60;

export class OidcProvider {
  constructor(cfg, { fetchImpl = globalThis.fetch } = {}) {
    this.cfg = cfg;
    this.fetch = fetchImpl;
    this.metadata = null;
    this.jwks = null;
    this.pendingDir = join(cfg.state_dir, 'pending');
  }

  async discover() {
    if (this.metadata) return this.metadata;
    const base = this.cfg.oidc.issuer.replace(/\/+$/, '');
    const res = await this.fetch(`${base}/.well-known/openid-configuration`);
    if (!res.ok) throw new AuthFailed(`the identity provider's discovery document returned ${res.status}`, { code: 'discovery_failed', status: 502 });
    const md = await res.json();
    /* The issuer in the document must be the issuer we asked. An IdP
       that answers for somebody else is the substitution the check
       exists for. */
    if (md.issuer !== this.cfg.oidc.issuer && md.issuer !== base) {
      throw new AuthFailed(`the discovery document declares issuer "${md.issuer}", which is not the configured "${this.cfg.oidc.issuer}"`, { code: 'issuer_mismatch', status: 502 });
    }
    for (const k of ['authorization_endpoint', 'token_endpoint', 'jwks_uri']) {
      if (!md[k]) throw new AuthFailed(`the discovery document has no ${k}`, { code: 'discovery_incomplete', status: 502 });
    }
    this.metadata = md;
    return md;
  }

  async keys() {
    if (this.jwks) return this.jwks;
    const md = await this.discover();
    const res = await this.fetch(md.jwks_uri);
    if (!res.ok) throw new AuthFailed(`the identity provider's JWKS returned ${res.status}`, { code: 'jwks_failed', status: 502 });
    const body = await res.json();
    if (!Array.isArray(body?.keys)) throw new AuthFailed('the JWKS document has no keys array', { code: 'jwks_failed', status: 502 });
    this.jwks = body.keys;
    return this.jwks;
  }

  redirectUri() {
    const origin = this.cfg.public_origin ?? `http://${this.cfg.host}:${this.cfg.port}`;
    return `${origin.replace(/\/+$/, '')}/auth/callback`;
  }

  /** Start a login. Returns the URL to send the browser to and the
   *  opaque handle that must come back with it. */
  async begin({ returnTo = '/' } = {}) {
    const md = await this.discover();
    const state = b64url(randomBytes(24));
    const nonce = b64url(randomBytes(24));
    const verifier = b64url(randomBytes(32));
    const challenge = b64url(createHash('sha256').update(verifier).digest());

    mkdirSync(this.pendingDir, { recursive: true });
    const handle = b64url(randomBytes(24));
    writeFileSync(join(this.pendingDir, `${sha256hex(handle)}.json`),
      `${JSON.stringify({ state, nonce, verifier, return_to: sanitiseReturnTo(returnTo), created_at: nowIso() }, null, 2)}\n`,
      { encoding: 'utf8', mode: 0o600 });

    const url = new URL(md.authorization_endpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.cfg.oidc.client_id);
    url.searchParams.set('redirect_uri', this.redirectUri());
    url.searchParams.set('scope', this.cfg.oidc.scopes);
    url.searchParams.set('state', state);
    url.searchParams.set('nonce', nonce);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    return { url: url.toString(), handle };
  }

  #pending(handle) {
    if (!handle || !/^[A-Za-z0-9_-]{10,200}$/.test(handle)) return null;
    const file = join(this.pendingDir, `${sha256hex(handle)}.json`);
    if (!existsSync(file)) return null;
    try { return { file, data: JSON.parse(readFileSync(file, 'utf8')) }; } catch { return null; }
  }

  /**
   * Finish a login. Verifies the state, exchanges the code, verifies
   * the id_token, and maps its `sub` onto a provisioned operator.
   *
   * An identity the registry does not know is a 403, never an
   * account: an identity provider says who somebody is, and this
   * repository says what they may do. Auto-provisioning would let
   * anybody in the IdP's directory into the Control Room.
   */
  async complete({ handle, code, state }) {
    const p = this.#pending(handle);
    if (!p) throw new AuthFailed('there is no login in progress for this browser', { code: 'no_pending_login', status: 400 });
    rmSync(p.file, { force: true });          // one use, whatever happens next
    if (!safeEqual(state, p.data.state)) throw new AuthFailed('the state parameter does not match the one this login started with', { code: 'state_mismatch', status: 400 });
    if (!code) throw new AuthFailed('the identity provider returned no authorization code', { code: 'no_code', status: 400 });

    const md = await this.discover();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: this.redirectUri(),
      client_id: this.cfg.oidc.client_id,
      code_verifier: p.data.verifier,
    });
    const headers = { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' };
    if (this.cfg.oidc.client_secret) {
      headers.authorization = `Basic ${Buffer.from(`${encodeURIComponent(this.cfg.oidc.client_id)}:${encodeURIComponent(this.cfg.oidc.client_secret)}`).toString('base64')}`;
    }
    const res = await this.fetch(md.token_endpoint, { method: 'POST', headers, body: body.toString() });
    if (!res.ok) throw new AuthFailed(`the token endpoint returned ${res.status}`, { code: 'token_exchange_failed', status: 502 });
    const tokens = await res.json();
    if (!tokens.id_token) throw new AuthFailed('the token response carried no id_token', { code: 'no_id_token', status: 502 });

    const claims = await this.verifyIdToken(tokens.id_token, { nonce: p.data.nonce });

    const op = findOperator(this.cfg, { provider: 'oidc', subject: claims.sub });
    if (!op) {
      throw new AuthFailed(`the identity provider authenticated "${claims.sub}", and no operator is provisioned for that subject`,
        { code: 'not_provisioned', status: 403 });
    }
    if (op.disabled) throw new AuthFailed(`operator ${op.operator_id} is disabled`, { code: 'disabled', status: 403 });
    touchOperator(this.cfg, op.operator_id);
    /* The tokens go no further. The Control Room wanted an identity,
       not an API credential, and a stored access token is a stored
       liability. */
    return { operator: publicOperator(op), claims: { sub: claims.sub, email: claims.email ?? null }, returnTo: p.data.return_to };
  }

  /**
   * Signature, issuer, audience, expiry, issued-at and nonce. All of
   * them, in that order, before the token is anybody.
   */
  async verifyIdToken(idToken, { nonce = null, now = () => Date.now() } = {}) {
    const parts = String(idToken).split('.');
    if (parts.length !== 3) throw new AuthFailed('the id_token is not a three-part JWS', { code: 'bad_id_token', status: 502 });
    let header, payload;
    try { header = JSON.parse(unb64url(parts[0]).toString('utf8')); payload = JSON.parse(unb64url(parts[1]).toString('utf8')); }
    catch { throw new AuthFailed('the id_token header or payload does not parse', { code: 'bad_id_token', status: 502 }); }

    if (!ACCEPTED_JWT_ALGS.has(header.alg)) {
      throw new AuthFailed(`the id_token declares alg "${header.alg}", which this build does not accept. "none" and the HMAC algorithms are refused by construction.`, { code: 'bad_alg', status: 502 });
    }
    const keys = await this.keys();
    const jwk = keys.find((k) => (header.kid ? k.kid === header.kid : true) && (!k.alg || k.alg === header.alg) && (k.use ?? 'sig') === 'sig');
    if (!jwk) throw new AuthFailed(`no key in the JWKS matches kid "${header.kid ?? '(none)'}"`, { code: 'no_key', status: 502 });

    const spec = ALG_PARAMS[header.alg];
    let key;
    try { key = createPublicKey({ key: jwk, format: 'jwk' }); }
    catch (e) { throw new AuthFailed(`the JWKS key could not be read: ${e.message}`, { code: 'bad_key', status: 502 }); }

    const signed = Buffer.from(`${parts[0]}.${parts[1]}`, 'utf8');
    const sig = unb64url(parts[2]);
    /* Three different key parameterisations, and they are not
       interchangeable. ECDSA in a JWS is the raw r‖s pair, which
       Node calls `ieee-p1363` and which will not verify as the DER
       sequence it defaults to; PS* is RSA-PSS with the salt length
       equal to the digest, which is what the JOSE spec fixes it at. */
    const param = spec.ec
      ? { key, dsaEncoding: 'ieee-p1363' }
      : spec.pss
        ? { key, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: constants.RSA_PSS_SALTLEN_DIGEST }
        : key;
    let ok = false;
    try { ok = cryptoVerify(spec.hash, signed, param, sig); }
    catch { ok = false; }
    if (!ok) throw new AuthFailed('the id_token signature does not verify against the identity provider\'s keys', { code: 'bad_signature', status: 401 });

    const t = Math.floor(now() / 1000);
    const issuers = new Set([this.cfg.oidc.issuer, this.cfg.oidc.issuer.replace(/\/+$/, '')]);
    if (!issuers.has(payload.iss)) throw new AuthFailed(`the id_token issuer is "${payload.iss}", not the configured issuer`, { code: 'bad_issuer', status: 401 });
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(this.cfg.oidc.client_id)) throw new AuthFailed('the id_token audience does not include this client', { code: 'bad_audience', status: 401 });
    if (Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== this.cfg.oidc.client_id) {
      throw new AuthFailed('the id_token has multiple audiences and azp is not this client', { code: 'bad_azp', status: 401 });
    }
    if (typeof payload.exp !== 'number' || payload.exp + CLOCK_SKEW_SECONDS < t) throw new AuthFailed('the id_token has expired', { code: 'expired', status: 401 });
    if (typeof payload.iat === 'number' && payload.iat - CLOCK_SKEW_SECONDS > t) throw new AuthFailed('the id_token was issued in the future', { code: 'bad_iat', status: 401 });
    if (nonce && !safeEqual(payload.nonce ?? '', nonce)) throw new AuthFailed('the id_token nonce does not match the one this login started with', { code: 'bad_nonce', status: 401 });
    if (!payload.sub) throw new AuthFailed('the id_token carries no subject', { code: 'no_subject', status: 401 });
    return payload;
  }

  sweep({ olderThanMinutes = 15, now = () => Date.now() } = {}) {
    if (!existsSync(this.pendingDir)) return 0;
    let n = 0;
    for (const f of readdirSync(this.pendingDir)) {
      const p = join(this.pendingDir, f);
      try {
        const d = JSON.parse(readFileSync(p, 'utf8'));
        if (now() - Date.parse(d.created_at) > olderThanMinutes * 60_000) { rmSync(p, { force: true }); n++; }
      } catch { rmSync(p, { force: true }); n++; }
    }
    return n;
  }
}

/** A return path may only be a path on this server. An open
 *  redirector on a login endpoint is how a phishing page borrows an
 *  organisation's own domain. */
export function sanitiseReturnTo(value) {
  const s = String(value ?? '/');
  if (!s.startsWith('/') || s.startsWith('//')) return '/';
  if (/[\r\n]/.test(s)) return '/';
  return s;
}

/* ---------------------------------------------------------- cookies */

export function parseCookies(header) {
  const out = {};
  for (const part of String(header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function sessionCookie(token, cfg, { clear = false } = {}) {
  const attrs = [
    `${SESSION_COOKIE}=${clear ? '' : token}`,
    'Path=/',
    'HttpOnly',
    /* Lax rather than Strict, and the reason is worth stating rather
       than leaving as a preference. The OIDC callback is a top-level
       navigation FROM the identity provider, which is cross-site; a
       Strict cookie set on that response is not returned on the next
       navigation in several browsers, which produces a login loop —
       and a login loop is the kind of thing somebody fixes by
       weakening something that actually mattered.

       Lax is not what stops cross-site request forgery here. That is
       the double-submit token in `x-control-room-csrf`, required on
       every state-changing request, checked in constant time against
       a per-session secret; plus an Origin check when the header is
       present; plus a refusal of any body that is not
       application/json. Lax is the fourth of those, not the first. */
    'SameSite=Lax',
    clear ? 'Max-Age=0' : `Max-Age=${cfg.session.ttl_minutes * 60}`,
  ];
  if (cfg.env === 'production') attrs.push('Secure');
  return attrs.join('; ');
}
