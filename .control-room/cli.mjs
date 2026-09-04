#!/usr/bin/env node
/* ============================================================
   .control-room/cli.mjs — the commands a person runs on the machine

     node .control-room/cli.mjs check
     node .control-room/cli.mjs provision --subject you@example.org --role administrator --by "your name"
     node .control-room/cli.mjs grant   --subject you@example.org --role approver --by "your name"
     node .control-room/cli.mjs revoke  --subject them@example.org --role approver --by "your name"
     node .control-room/cli.mjs disable --subject them@example.org --by "your name"
     node .control-room/cli.mjs enable  --subject them@example.org --by "your name"
     node .control-room/cli.mjs operators
     node .control-room/cli.mjs audit [--verify] [--proposal <id>]
     node .control-room/cli.mjs routes
     node .control-room/cli.mjs serve [--port N] [--host H]

   WHY PROVISIONING IS HERE AND NOT IN THE INTERFACE. Somebody has to
   be able to create the first administrator, and the first
   administrator cannot log in to create themselves. Every system
   solves that either with a seeded default account — which protocol
   §11 forbids from existing at all — or with an out-of-band act by
   somebody with access to the machine. This is the second.

   It also means the Control Room cannot grant itself a role. A
   privileged interface that could widen its own access has no
   boundary above it, and the audit trail of that widening would be
   written by the thing doing the widening.

   THE PASSWORD IS READ FROM STDIN, never from an argument. A
   password in argv is in the shell history, in the process list, and
   in any log that records a command line. There is no --password
   flag, and adding one would undo the point.
   ============================================================ */

import { createInterface } from 'node:readline';
import { stdin, stdout, argv, exit, env } from 'node:process';
import { readConfig, configRefusals, describeConfig, assertConfig, ConfigRefused } from './config.mjs';
import { provisionOperator, setRoles, setDisabled, listOperators, findOperator, registryRefusals, registryPath, ProvisioningRefused, MIN_PASSWORD_LENGTH } from './identity.mjs';
import { ROLES, ROLE_PERMISSIONS } from './authz.mjs';
import { AuditLog } from './audit.mjs';
import { serve, ROUTES, PUBLIC_ROUTES } from './server.mjs';

const args = argv.slice(2);
const command = args[0] ?? 'help';

function flag(name, { many = false } = {}) {
  const out = [];
  for (let i = 0; i < args.length; i++) if (args[i] === `--${name}`) out.push(args[i + 1]);
  return many ? out.filter(Boolean) : out[0];
}
const has = (name) => args.includes(`--${name}`);

const die = (message, fix = null) => {
  console.error(`\n  ${message}`);
  if (fix) console.error(`\n  ${fix}`);
  console.error('');
  exit(1);
};

/** Reads a line from stdin without echoing it. Falls back to an
 *  echoing read where the terminal cannot be put in raw mode (a
 *  pipe, CI), and SAYS SO rather than silently echoing a password. */
function askSecret(prompt) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      /* A pipe, or CI. It is read without hiding, and the prompt
         says so — a password silently echoed is worse than one you
         were told would be. */
      console.log(`${prompt}(stdin is not a terminal, so this will NOT be hidden)`);
      const rl = createInterface({ input: stdin, output: stdout, terminal: false });
      rl.once('line', (line) => { rl.close(); resolve(line); });
      return;
    }
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let buf = '';
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\n' || ch === '\r' || ch === '\u0004') {
          stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData);
          stdout.write('\n');
          return resolve(buf);
        }
        if (ch === '\u0003') {                       // ctrl-c
          stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData);
          stdout.write('\n');
          return reject(new Error('cancelled'));
        }
        if (ch === '\u007f' || ch === '\b') { buf = buf.slice(0, -1); continue; }
        buf += ch;
      }
    };
    stdin.on('data', onData);
  });
}

const cfg = readConfig(env);

/* ---------------------------------------------------------- commands */

async function main() {
  switch (command) {
    case 'check': {
      const c = configRefusals(cfg);
      const r = registryRefusals(cfg);
      console.log('\nCONFIGURATION');
      for (const [k, v] of Object.entries(describeConfig(cfg))) console.log(`  ${k.padEnd(20)} ${typeof v === 'object' ? JSON.stringify(v) : v}`);
      console.log(`\nREGISTRY\n  ${registryPath(cfg)}`);
      console.log(`\n${c.length + r.length} refusal(s)`);
      for (const x of [...c, ...r]) console.log(`\n  ✗ ${x.message}\n    → ${x.fix}`);
      if (!c.length && !r.length) console.log('\n  The server would start. That is not a statement that it is secure; it is a statement that nothing in the startup checks refuses it.');
      console.log('');
      exit(c.length + r.length ? 1 : 0);
      break;
    }

    case 'provision': {
      const subject = flag('subject');
      const roles = flag('role', { many: true });
      const by = flag('by');
      const provider = flag('provider') ?? cfg.provider;
      if (!subject) die('--subject is required.', 'Under OIDC it is the identity provider’s `sub` claim. Under the local development provider it is the name you will type at the login form.');
      if (!roles.length) die('--role is required, at least once.', `Roles: ${ROLES.join(', ')}. The first one should be administrator, or nobody can grant a role afterwards.`);
      if (!by) die('--by is required.', 'The name of the person doing this. It is recorded in the registry and in the audit trail; an unattributable grant of access is what this whole directory exists to avoid.');

      let password = null;
      if (provider === 'local') {
        password = await askSecret(`A password for "${subject}" (at least ${MIN_PASSWORD_LENGTH} characters, not echoed): `);
        const again = await askSecret('Again: ');
        if (password !== again) die('The two passwords do not match.');
      }
      try {
        const op = provisionOperator(cfg, { provider, subject, roles, password, createdBy: by, displayName: flag('name') ?? null, email: flag('email') ?? null });
        new AuditLog(cfg).record({ action: 'operators.provisioned', outcome: 'ok', reason: `${op.subject} provisioned with ${op.roles.join(', ')} by ${by}`, detail: { operator_id: op.operator_id, provider: op.provider, roles: op.roles, by } });
        console.log(`\n  provisioned ${op.subject}  (${op.operator_id})`);
        console.log(`  roles:       ${op.roles.join(', ')}`);
        console.log(`  permissions: ${op.permissions.join(', ')}`);
        console.log(`\n  Nothing about this operator is in the repository: the registry is at\n  ${registryPath(cfg)}, which is git-ignored and inside the dot-prefixed\n  tree the deployment does not publish.\n`);
      } catch (e) { die(e.message, e.fix); }
      break;
    }

    case 'grant':
    case 'revoke': {
      const subject = flag('subject');
      const roles = flag('role', { many: true });
      const by = flag('by');
      if (!subject || !roles.length || !by) die('--subject, --role and --by are all required.');
      const op = findOperator(cfg, { provider: flag('provider') ?? cfg.provider, subject });
      if (!op) die(`No operator "${subject}" under provider "${flag('provider') ?? cfg.provider}".`, 'Provision them first.');
      const next = command === 'grant'
        ? [...new Set([...(op.roles ?? []), ...roles])]
        : (op.roles ?? []).filter((r) => !roles.includes(r));
      try {
        const out = setRoles(cfg, { provider: op.provider, subject, roles: next, changedBy: by });
        new AuditLog(cfg).record({ action: command === 'grant' ? 'operators.granted' : 'operators.revoked', outcome: 'ok', reason: `${subject}: ${(op.roles ?? []).join(', ') || 'none'} → ${out.roles.join(', ') || 'none'}, by ${by}`, detail: { operator_id: out.operator_id, before: op.roles ?? [], after: out.roles, by } });
        console.log(`\n  ${subject}: ${(op.roles ?? []).join(', ') || 'none'} → ${out.roles.join(', ') || 'none'}`);
        console.log('  Open sessions pick this up on their next request: roles are re-read from the registry every time, not taken from the session.\n');
      } catch (e) { die(e.message, e.fix); }
      break;
    }

    case 'disable':
    case 'enable': {
      const subject = flag('subject');
      const by = flag('by');
      if (!subject || !by) die('--subject and --by are required.');
      try {
        const out = setDisabled(cfg, { subject, disabled: command === 'disable', changedBy: by });
        console.log(`\n  ${out.subject} is now ${out.disabled ? 'disabled' : 'active'}.\n`);
      } catch (e) { die(e.message, e.fix); }
      break;
    }

    case 'operators': {
      const ops = listOperators(cfg);
      if (!ops.length) { console.log('\n  Nobody is provisioned. The server will refuse to start.\n\n  node .control-room/cli.mjs provision --subject "you@example.org" --role administrator --by "your name"\n'); break; }
      console.log('');
      for (const o of ops) console.log(`  ${o.disabled ? '✗' : '·'} ${o.subject.padEnd(28)} ${o.roles.join(', ').padEnd(28)} ${o.provider}  created ${o.created_at} by ${o.created_by}`);
      console.log('');
      break;
    }

    case 'roles': {
      console.log('');
      for (const r of ROLES) console.log(`  ${r.padEnd(16)} ${ROLE_PERMISSIONS[r].join(', ')}`);
      console.log('\n  Approving a human_only (red-tier) proposal needs proposal:approve:human_only,\n  which only administrator holds. docs/AUTONOMY-POLICY.md Class D.\n');
      break;
    }

    case 'audit': {
      const log = new AuditLog(cfg);
      if (has('verify')) {
        const v = log.verifyChain();
        console.log(`\n  ${v.entries} entr(ies) · chain ${v.ok ? 'intact' : 'BROKEN'} · ${v.tampered.length} edited · ${v.breaks.length} break(s) · ${v.malformed.length} unparseable`);
        for (const t of v.tampered) console.log(`  ✗ ${t.event_id}: ${t.why}`);
        for (const b of v.breaks) console.log(`  ✗ ${b.event_id}: ${b.why}`);
        console.log(`\n  ${v.bound}\n`);
        exit(v.ok ? 0 : 1);
      }
      const q = log.query({ action: flag('action'), proposal_id: flag('proposal'), limit: Number(flag('limit') ?? 50) });
      console.log('');
      for (const e of q.entries) console.log(`  ${e.ts}  ${String(e.action).padEnd(28)} ${String(e.outcome).padEnd(9)} ${e.actor_subject ?? '—'}  ${e.proposal_id ?? ''} ${e.previous_state ? `${e.previous_state}→${e.resulting_state}` : ''}`);
      console.log(`\n  ${q.entries.length} of ${q.total}\n`);
      break;
    }

    case 'boundary': {
      /* Runs without a configuration, without a registry and without
         a server, so CI can ask the one question that matters
         without provisioning anybody: is the private control plane
         actually outside the public website? */
      const { controlRoomBoundary } = await import('./boundary.mjs');
      const b = controlRoomBoundary({ cfg });
      console.log(`\n  ${b.name}`);
      console.log(`  ${b.detail.control_room_files_scanned} file(s) scanned against ${b.detail.credential_patterns} credential patterns`);
      console.log(`  ${b.detail.published_control_room_files.length} Control Room file(s) in the published surface`);
      console.log(`  ${b.detail.tracked_state_files.length} private state file(s) tracked by git`);
      console.log(`  ${b.detail.routes} route(s), ${b.detail.public_routes.length} of them public, ${b.detail.production_controls.length} production control(s)`);
      console.log(`  .gitignore rule present: ${b.detail.gitignore_rule_present}`);
      console.log(`\n  ${b.errors} error(s)`);
      for (const f of b.findings) console.log(`  ✗ ${f}`);
      console.log(`\n  ${b.detail.excluded_because}`);
      console.log(`\n  ${b.bound}\n`);
      exit(b.exit_code);
      break;
    }

    case 'routes': {
      console.log('\n  Every route this server answers, and what it needs.\n');
      for (const r of ROUTES) {
        const gate = r.public ? 'PUBLIC' : r.session_only ? 'session' : r.permission;
        console.log(`  ${r.method.padEnd(5)} ${r.path.padEnd(20)} ${String(gate).padEnd(28)} ${r.what}`);
      }
      console.log(`\n  ${PUBLIC_ROUTES.length} answer without a session: ${PUBLIC_ROUTES.join(', ')}`);
      console.log('  Every other one authenticates, then authorizes, server-side.\n');
      break;
    }

    case 'serve': {
      const port = flag('port');
      const host = flag('host');
      const runtime = { ...cfg, ...(port ? { port: Number(port) } : {}), ...(host ? { host } : {}) };
      try { assertConfig(runtime); } catch (e) { die(e.message, e instanceof ConfigRefused ? e.fix : null); }
      try { serve({ cfg: runtime }); } catch (e) { die(e.message, e.fix); }
      break;
    }

    default:
      console.log(`
  Control Room — the private control plane for
  The European Legal Framework for the Digital World

    check        what the configuration is, and every reason the server would refuse to start
    provision    create an operator. The only way one comes to exist.
    grant        add a role      --subject … --role … --by …
    revoke       remove a role   --subject … --role … --by …
    disable      remove all access without removing the identity
    enable       give it back
    operators    who has access
    roles        what each role may do
    audit        the approval trail   [--verify] [--proposal <id>] [--action <name>]
    boundary     is the private control plane actually outside the public website?
    routes       every route, and the permission it needs
    serve        run it

  Read docs/CONTROL-ROOM.md before the first run. There is no default
  account, and the server refuses to start until somebody provisions one.
`);
  }
}

main().catch((e) => {
  if (e instanceof ProvisioningRefused || e instanceof ConfigRefused) die(e.message, e.fix);
  die(e.message);
});
