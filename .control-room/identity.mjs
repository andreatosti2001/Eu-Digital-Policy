/* ============================================================
   .control-room/identity.mjs — who may reach the Control Room, and
   how the first one of them comes to exist

   Protocol §11, INITIAL ADMINISTRATOR: "Do NOT create a hard-coded
   default account such as "admin" / "admin" or any equivalent embedded
   credential. The system MUST document how the owner creates their
   first account and assigns the required administrative role."

   So this file contains no account. It contains the RULES an account
   has to satisfy and the one code path that creates one, which is a
   CLI command a person runs on the machine:

     node .control-room/cli.mjs provision --subject you@example.org --role administrator

   The registry it writes lives under the state directory, which is
   git-ignored and inside the dot-prefixed tree the deployment does
   not publish. Nothing in the repository holds an operator, a role
   grant, a password or a hash — `boundary.mjs` asserts it, over the
   actual tree, on every run of the suite.

   THE SERVER REFUSES TO START WITH AN EMPTY REGISTRY, and says the
   provisioning command. That is deliberate and is the opposite of
   the usual shape: the common failure is a system that seeds an
   administrator so it can start, and then ships with it.

   WHAT A SUBJECT IS. Under OIDC it is the identity provider's `sub`
   claim — stable, opaque, and the only thing an IdP promises will
   not be reassigned. An email is recorded alongside it for a human
   to read and is NEVER what a role is looked up by: emails get
   reassigned inside an organisation, and a role that followed one
   would follow it to the wrong person. Under the local development
   provider the subject is whatever the operator was provisioned
   with, because there is no IdP to ask.

   PASSWORDS EXIST ONLY UNDER THE LOCAL DEVELOPMENT PROVIDER. They
   are scrypt-hashed with a per-operator salt, compared in constant
   time, and never logged, printed, traced or returned by any route.
   `config.mjs` refuses to let that provider run anywhere but
   loopback, in development. The reason it exists at all is stated in
   docs/CONTROL-ROOM.md §3 and is not "it was easier": this
   repository has no dependencies and this environment has no
   outbound network, so an offline provider is the only way the
   sixteen security proofs can actually run.
   ============================================================ */

import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ROLES, isRole, permissionsOf } from './authz.mjs';

export const REGISTRY_VERSION = 1;
export const REGISTRY_FILE = 'operators.json';

/** scrypt cost. 2^15 rounds is deliberately slow; `maxmem` is raised
 *  because 128·N·r is 32 MiB and Node's default cap is exactly that,
 *  which fails rather than degrades. */
export const SCRYPT = { N: 32768, r: 8, p: 1, keylen: 32, maxmem: 96 * 1024 * 1024 };

/** The minimum a local development password may be. Not a policy
 *  worth arguing about — it exists so that "admin" cannot be one. */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * Passwords refused outright. The list is short on purpose: it is
 * not a dictionary check, it is the specific prohibition protocol
 * §11 names. `"admin" / "admin"` may not exist, so it may not be
 * created either.
 */
export const REFUSED_PASSWORDS = new Set([
  'admin', 'administrator', 'password', 'passw0rd', 'changeme', 'letmein',
  'controlroom', 'control-room', 'secret', '123456', '12345678', 'qwerty',
]);

export class ProvisioningRefused extends Error {
  constructor(message, { fix } = {}) { super(message); this.name = 'ProvisioningRefused'; this.fix = fix ?? null; }
}

export const registryPath = (cfg) => join(cfg.state_dir, REGISTRY_FILE);

/* ---------------------------------------------------------- reading */

/**
 * The operator registry. A missing file is an EMPTY registry, not an
 * error: a fresh checkout has nobody, and that is the correct
 * starting state.
 *
 * A malformed file IS an error. A registry that cannot be parsed is
 * not a registry with nobody in it — silently treating it as empty
 * would let a corrupted file become "no access rules", and the
 * server would then refuse to start, which is the safe end of that.
 */
export function readRegistry(cfg) {
  const file = registryPath(cfg);
  if (!existsSync(file)) return { version: REGISTRY_VERSION, operators: [], path: file, existed: false };
  let parsed;
  try { parsed = JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { throw new ProvisioningRefused(`the operator registry at ${file} does not parse: ${e.message}`, { fix: 'repair or remove the file. A registry that cannot be read is not a registry with nobody in it, and this refuses to guess which.' }); }
  if (!Array.isArray(parsed?.operators)) {
    throw new ProvisioningRefused(`the operator registry at ${file} has no "operators" array`, { fix: 'repair or remove the file.' });
  }
  return { version: parsed.version ?? REGISTRY_VERSION, operators: parsed.operators, path: file, existed: true };
}

function writeRegistry(cfg, registry) {
  const file = registryPath(cfg);
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify({ version: REGISTRY_VERSION, operators: registry.operators }, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  renameSync(tmp, file);
  try { chmodSync(file, 0o600); } catch { /* best effort; the boundary does not depend on it */ }
  return file;
}

/**
 * What a route, a trace or an audit record may see. Note what is
 * removed: the secret, in every direction. There is no code path
 * that returns a hash to a caller.
 */
export function publicOperator(op) {
  if (!op) return null;
  return {
    operator_id: op.operator_id,
    provider: op.provider,
    subject: op.subject,
    display_name: op.display_name ?? null,
    email: op.email ?? null,
    roles: op.roles ?? [],
    permissions: permissionsOf(op.roles ?? []),
    disabled: Boolean(op.disabled),
    created_at: op.created_at,
    created_by: op.created_by,
    last_seen_at: op.last_seen_at ?? null,
  };
}

/** Looked up by PROVIDER AND SUBJECT together. A subject is only
 *  unique within the provider that issued it. */
export function findOperator(cfg, { provider, subject }) {
  const { operators } = readRegistry(cfg);
  return operators.find((o) => o.provider === provider && o.subject === subject) ?? null;
}

export function findOperatorById(cfg, operatorId_) {
  const { operators } = readRegistry(cfg);
  return operators.find((o) => o.operator_id === operatorId_) ?? null;
}

export function listOperators(cfg) {
  return readRegistry(cfg).operators.map(publicOperator);
}

/**
 * Every reason this configuration may not serve requests yet.
 * Separate from `configRefusals` because it is about STATE rather
 * than configuration, and because it is the one that names the
 * provisioning command.
 */
export function registryRefusals(cfg) {
  const out = [];
  let reg;
  try { reg = readRegistry(cfg); }
  catch (e) { return [{ message: e.message, fix: e.fix ?? 'repair the registry.' }]; }

  const active = reg.operators.filter((o) => !o.disabled);
  if (!active.length) {
    out.push({
      message: `no operator is provisioned in ${reg.path}`,
      fix: 'create the first administrator, on this machine: node .control-room/cli.mjs provision --subject "you@example.org" --role administrator --by "your name". There is deliberately no default account. Protocol §11 forbids one, so an empty registry is a refusal to start rather than a reason to invent an "admin".',
    });
  }
  if (active.length && !active.some((o) => (o.roles ?? []).includes('administrator'))) {
    out.push({
      message: 'operators exist but none holds the administrator role',
      fix: 'grant it: node .control-room/cli.mjs grant --subject "you@example.org" --role administrator --by "your name". Without one, nobody can grant a role or approve a human_only proposal, and the system has no way back.',
    });
  }
  for (const o of active) {
    if (cfg.provider === 'local' && !o.secret && o.provider === 'local') {
      out.push({ message: `local operator "${o.subject}" has no credential`, fix: 're-provision it, or disable it. An operator the local provider can never authenticate is a role grant with nothing behind it.' });
    }
    for (const r of o.roles ?? []) {
      if (!isRole(r)) out.push({ message: `operator "${o.subject}" carries role "${r}", which does not exist`, fix: `roles are: ${ROLES.join(', ')}. An unrecognised role grants nothing, and it is reported rather than ignored.` });
    }
  }
  return out;
}

/* ---------------------------------------------------------- passwords */

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(Buffer.from(password, 'utf8'), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: SCRYPT.maxmem });
  return { algo: 'scrypt', N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, keylen: SCRYPT.keylen, salt: salt.toString('base64'), hash: hash.toString('base64') };
}

/** Constant-time, and it returns false rather than throwing on a
 *  malformed record: a comparison that throws on a bad stored value
 *  tells a caller something a false does not. */
export function verifyPassword(password, secret) {
  if (!secret || secret.algo !== 'scrypt') return false;
  let expected;
  try { expected = Buffer.from(secret.hash, 'base64'); } catch { return false; }
  let actual;
  try {
    actual = scryptSync(Buffer.from(password ?? '', 'utf8'), Buffer.from(secret.salt, 'base64'),
      secret.keylen ?? SCRYPT.keylen, { N: secret.N ?? SCRYPT.N, r: secret.r ?? SCRYPT.r, p: secret.p ?? SCRYPT.p, maxmem: SCRYPT.maxmem });
  } catch { return false; }
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/** Why this password may not be used. Returns null when it may. */
export function passwordRefusal(password, { subject } = {}) {
  const p = String(password ?? '');
  if (p.length < MIN_PASSWORD_LENGTH) return `a Control Room password must be at least ${MIN_PASSWORD_LENGTH} characters; this one is ${p.length}`;
  if (REFUSED_PASSWORDS.has(p.toLowerCase())) return 'that is one of the default credentials protocol §11 forbids from existing at all';
  if (subject && p.toLowerCase() === String(subject).toLowerCase()) return 'the password is the subject';
  if (/^(.)\1+$/.test(p)) return 'the password is one repeated character';
  return null;
}

/* ---------------------------------------------------------- writing */

const operatorIdFor = (provider, subject) => `op-${createHash('sha256').update(`${provider} ${subject}`).digest('hex').slice(0, 16)}`;

/**
 * Create an operator. The ONLY code path that does.
 *
 * Note the absence of a `force`, a `seed` and a `default`. A
 * function with an override argument is a function whose checks are
 * advisory — the same sentence `agent/implement/ledger.mjs` records
 * about `recordDecision`, for the same reason.
 *
 * @param {object} cfg
 * @param {{provider?:string, subject:string, roles:string[], password?:string|null,
 *          displayName?:string|null, email?:string|null, createdBy:string}} spec
 */
export function provisionOperator(cfg, { provider = cfg.provider, subject, roles, password = null, displayName = null, email = null, createdBy, now = () => new Date().toISOString() }) {
  if (!subject || !String(subject).trim()) throw new ProvisioningRefused('an operator with no subject is an access grant to nobody', { fix: 'pass --subject. Under OIDC it is the identity provider’s `sub` claim; under the local provider it is the name you will log in with.' });
  if (!Array.isArray(roles) || !roles.length) throw new ProvisioningRefused('an operator with no role is an account that can do nothing', { fix: `pass --role at least once. Roles are: ${ROLES.join(', ')}.` });
  for (const r of roles) if (!isRole(r)) throw new ProvisioningRefused(`"${r}" is not a role`, { fix: `roles are: ${ROLES.join(', ')}.` });
  if (!createdBy || !String(createdBy).trim()) throw new ProvisioningRefused('an operator provisioned by nobody is an unattributable grant of access', { fix: 'pass --by with the name of the person doing it. It goes in the registry and in the audit trail.' });

  const reg = readRegistry(cfg);
  if (reg.operators.some((o) => o.provider === provider && o.subject === subject)) {
    throw new ProvisioningRefused(`an operator already exists for subject "${subject}" under provider "${provider}"`, { fix: 'use `grant` or `revoke` to change its roles. Re-provisioning would silently replace a credential.' });
  }

  let secret = null;
  if (provider === 'local') {
    if (!password) throw new ProvisioningRefused('the local provider needs a password, and it is read from stdin rather than from the command line', { fix: 'run the provision command without --password and type it when asked; a password in argv is in the shell history and in the process list.' });
    const refusal = passwordRefusal(password, { subject });
    if (refusal) throw new ProvisioningRefused(refusal, { fix: 'choose another. Protocol §11: no default credential such as "admin" / "admin" may exist, so none may be created.' });
    secret = hashPassword(password);
  }

  const op = {
    operator_id: operatorIdFor(provider, subject),
    provider,
    subject: String(subject),
    display_name: displayName,
    email,
    roles: [...new Set(roles)],
    disabled: false,
    created_at: now(),
    created_by: String(createdBy),
    ...(secret ? { secret } : {}),
  };
  reg.operators.push(op);
  writeRegistry(cfg, reg);
  return publicOperator(op);
}

/** Grant or revoke a role. Separate from provisioning because
 *  changing what somebody may do is a different act from deciding
 *  that they exist, and the audit trail records them differently. */
export function setRoles(cfg, { provider = cfg.provider, subject, roles, changedBy }) {
  if (!Array.isArray(roles)) throw new ProvisioningRefused('roles must be a list');
  for (const r of roles) if (!isRole(r)) throw new ProvisioningRefused(`"${r}" is not a role`, { fix: `roles are: ${ROLES.join(', ')}.` });
  if (!changedBy) throw new ProvisioningRefused('a role change with no actor is unattributable');
  const reg = readRegistry(cfg);
  const op = reg.operators.find((o) => o.provider === provider && o.subject === subject);
  if (!op) throw new ProvisioningRefused(`no operator "${subject}" under provider "${provider}"`);

  /* The last administrator may not remove themselves. Not a
     convenience: with none, nobody can grant a role, and the only
     way back is editing the registry by hand — which is exactly the
     unattributable act this whole file exists to avoid. */
  const willHold = new Set(roles);
  const others = reg.operators.filter((o) => o !== op && !o.disabled && (o.roles ?? []).includes('administrator'));
  if ((op.roles ?? []).includes('administrator') && !willHold.has('administrator') && !others.length) {
    throw new ProvisioningRefused('this is the only administrator, and removing the role would leave nobody able to grant it back', { fix: 'provision or promote a second administrator first.' });
  }

  op.roles = [...willHold];
  op.updated_at = new Date().toISOString();
  op.updated_by = String(changedBy);
  writeRegistry(cfg, reg);
  return publicOperator(op);
}

export function setDisabled(cfg, { provider = cfg.provider, subject, disabled, changedBy }) {
  if (!changedBy) throw new ProvisioningRefused('a disable with no actor is unattributable');
  const reg = readRegistry(cfg);
  const op = reg.operators.find((o) => o.provider === provider && o.subject === subject);
  if (!op) throw new ProvisioningRefused(`no operator "${subject}" under provider "${provider}"`);
  const others = reg.operators.filter((o) => o !== op && !o.disabled && (o.roles ?? []).includes('administrator'));
  if (disabled && (op.roles ?? []).includes('administrator') && !others.length) {
    throw new ProvisioningRefused('this is the only administrator, and disabling it would lock the Control Room', { fix: 'provision a second administrator first.' });
  }
  op.disabled = Boolean(disabled);
  op.updated_at = new Date().toISOString();
  op.updated_by = String(changedBy);
  writeRegistry(cfg, reg);
  return publicOperator(op);
}

/** Recorded so the operator list can show who has actually used
 *  their access. Best-effort: a failure here must never fail a
 *  login. */
export function touchOperator(cfg, operatorId_, now = () => new Date().toISOString()) {
  try {
    const reg = readRegistry(cfg);
    const op = reg.operators.find((o) => o.operator_id === operatorId_);
    if (!op) return;
    op.last_seen_at = now();
    writeRegistry(cfg, reg);
  } catch { /* not worth failing a login over */ }
}
