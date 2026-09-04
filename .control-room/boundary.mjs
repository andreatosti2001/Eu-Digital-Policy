/* ============================================================
   .control-room/boundary.mjs — is the private control plane actually
   outside the public website?

   SESSION 18 built `agent/implement/boundary.mjs` and it reported
   the honest answer for this repository: there is no separation.
   GitHub Pages serves `main` at the repository root, with no
   `_config.yml`, no `.nojekyll` and no exclude list, so `agent/`,
   `docs/` and `tools/` are published beside `index.html`.

   THE ONE EXCLUSION THAT DOES EXIST is Jekyll's documented default:
   a path whose segments begin with `.` or `_` is not served. That is
   why `.agents/` has never been in the published surface and `agent/`
   always has been, and it is the boundary this directory is behind.
   It is a property of the DEPLOYMENT, not a hidden route: nothing
   here relies on the URL being unknown, and every privileged request
   is authenticated and authorized whether or not anybody finds the
   server.

   WHAT THIS MODULE CHECKS, over the actual tree rather than by
   assertion:

     1 · no Control Room file is in the set the deployment publishes;
     2 · no Control Room file carries a credential shape;
     3 · nothing under the state directory is tracked by git —
         operators, password hashes, sessions, the audit trail and
         the review notes are all outside the repository;
     4 · the state directory is named in `.gitignore`, so it stays
         outside by rule rather than by nobody having run the server
         yet;
     5 · no route in the server can change the website.

   WHAT IT DOES NOT PROVE, in the same words `agent/implement/`
   uses: the secret scan matches known credential SHAPES, so a clean
   run is a floor and not a ceiling; and whether the live site serves
   what this predicts has never been confirmed, because outbound
   access to the deployed origin is refused by this environment's
   network policy.
   ============================================================ */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { CONTROL_ROOM_ROOT, REPO_ROOT } from './config.mjs';
import { publicSurface, scanSecrets, trackedFiles, SECRET_PATTERNS } from '../agent/implement/boundary.mjs';
import { ROUTES, PROHIBITED_ROUTE_WORDS, PUBLIC_ROUTES } from './server.mjs';

/** This module and the suite define credential patterns and plant
 *  synthetic credentials to prove the scan works. Without this, the
 *  check reports itself — the same exemption
 *  `agent/implement/boundary.mjs` keeps, for the same reason, and it
 *  is an exemption for TWO NAMED FILES rather than a directory. */
export const SCANNER_OWN_FILES = ['.control-room/boundary.mjs', '.control-room/selftest.mjs'];

/** Paths under the state directory that hold identity or decisions.
 *  Every one of them must be absent from git. */
export const PRIVATE_STATE = ['operators.json', 'sessions', 'audit', 'reviews', 'pending'];

/** The one tracked file under the state directory, and the reason it
 *  is tracked: the reasoning for the rule belongs in the repository
 *  even though nothing it describes does. The same shape
 *  `agent/health/history/README.md` uses. It is exempted BY NAME
 *  rather than by directory — an exemption for a directory would
 *  hide an operator registry dropped into it next week. */
export const TRACKED_STATE_README = 'README.md';

const walk = (dir, root = dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name);
    let st; try { st = statSync(abs); } catch { continue; }
    if (st.isDirectory()) walk(abs, root, out);
    else out.push(relative(root, abs).split('\\').join('/'));
  }
  return out;
};

/**
 * The whole check, in the shape `agent/implement/boundary.mjs`
 * returns for one QA check, so it can be read the same way.
 */
export function controlRoomBoundary({ root = REPO_ROOT, cfg = null } = {}) {
  const surface = publicSurface({ root });
  const tracked = trackedFiles({ root }) ?? [];

  /* 1 · nothing of ours in the published set. */
  const published = surface.published.filter((f) => f.startsWith('.control-room/'));

  /* 2 · credential shapes in our own tree. Scanned explicitly,
         because `scanSecrets` reads the PUBLISHED surface by default
         and we are deliberately not in it — which would otherwise
         mean this directory was the one place never scanned. */
  const ourFiles = walk(CONTROL_ROOM_ROOT).map((f) => `.control-room/${f}`)
    .filter((f) => !f.startsWith('.control-room/state/'))
    .filter((f) => !SCANNER_OWN_FILES.includes(f));
  const secrets = scanSecrets({ root, files: ourFiles });

  /* 3 · no identity or decision state is in git. */
  const stateDir = cfg?.state_dir ? relative(root, cfg.state_dir).split('\\').join('/') : '.control-room/state';
  const trackedState = tracked
    .filter((f) => f.startsWith(`${stateDir}/`) || f === stateDir
      || PRIVATE_STATE.some((n) => f.startsWith(`${stateDir}/${n}`)))
    .filter((f) => f !== `${stateDir}/${TRACKED_STATE_README}`);

  /* 4 · and it is excluded by rule rather than by accident. */
  const gitignore = existsSync(join(root, '.gitignore')) ? readFileSync(join(root, '.gitignore'), 'utf8') : '';
  const ignoreRuleExists = /\.control-room\/state\//.test(gitignore);

  /* 5 · no route can change the website. */
  const productionControls = ROUTES.filter((r) => PROHIBITED_ROUTE_WORDS.some((w) => r.path.toLowerCase().includes(w)));

  const errors = published.length + secrets.blocking.length + trackedState.length + productionControls.length + (ignoreRuleExists ? 0 : 1);

  return {
    name: 'control room / public website boundary',
    command: 'node .control-room/cli.mjs check',
    exit_code: errors ? 1 : 0,
    errors,
    warnings: 0,
    findings: [
      ...published.map((f) => `${f} is in the set the deployment publishes. The Control Room is behind the dot-prefix exclusion; a file of ours in the published surface means that is no longer true.`),
      ...secrets.blocking.map((f) => `${f.path}:${f.line} — ${f.what} (${f.pattern}), value redacted`),
      ...trackedState.map((f) => `${f} is tracked by git. Operators, password hashes, sessions, the audit trail and review notes are private control-plane data and this repository publishes its whole tree.`),
      ...productionControls.map((r) => `${r.method} ${r.path} names a production control. The Control Room is OBSERVE → REVIEW → DECIDE; it may not delete, deploy, force or publish.`),
      ...(ignoreRuleExists ? [] : ['.gitignore does not name .control-room/state/. Nothing being tracked today is not the same as nothing being trackable tomorrow.']),
    ],
    detail: {
      published_control_room_files: published,
      control_room_files_scanned: ourFiles.length,
      credential_patterns: SECRET_PATTERNS.length,
      secret_findings: secrets.findings.map((f) => ({ path: f.path, line: f.line, pattern: f.pattern, class: f.class })),
      tracked_state_files: trackedState,
      state_dir: stateDir,
      gitignore_rule_present: ignoreRuleExists,
      routes: ROUTES.length,
      public_routes: PUBLIC_ROUTES,
      production_controls: productionControls.map((r) => `${r.method} ${r.path}`),
      excluded_because: 'a path whose segments begin with "." or "_" is not served by a GitHub Pages deployment with no _config.yml. That is a property of the deployment, and it is the only publication boundary this repository has.',
    },
    bound: 'The secret scan matches known credential SHAPES: a clean run is a floor, not a ceiling. And whether the deployed site serves what this predicts has never been confirmed — outbound access to the deployed origin is refused by this environment\'s network policy, exactly as docs/CURRENT-ARCHITECTURE.md §13 records.',
  };
}
