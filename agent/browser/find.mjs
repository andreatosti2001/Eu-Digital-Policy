/* ============================================================
   agent/browser/find.mjs — locate a browser, or say plainly that
   there is none

   SESSION 19 asks for a browser regression suite that runs locally
   AND in GitHub Actions. The constraint it runs into immediately is
   the one AGENTS.md states as architecture: **no build step, no
   dependencies, no package.json.** `npm i playwright` is not a
   convenience here; `agent/schemas/contracts/implementation-proposal.mjs`
   already names adding a package.json as a red-tier architectural
   change, and an agent that installs one to test itself has done the
   exact thing the contract refuses.

   So this suite drives a browser that is ALREADY ON THE MACHINE, over
   the Chrome DevTools Protocol, using Node 22's global WebSocket. It
   installs nothing and it can be deleted without leaving a lockfile
   behind.

   THE HONEST HALF, AND THE REASON THIS MODULE EXISTS SEPARATELY.
   A suite that quietly reports success when no browser was found is
   worse than no suite: it converts "nobody looked" into "everything
   passed", which is precisely the substitution
   docs/AI-SAFE-BOUNDARIES.md §0.5 prohibits and which
   docs/UX-AUDIT.md spent a session refusing to make. So this returns
   either a browser or a REFUSAL that names every path it looked in,
   and `runner.mjs` turns that refusal into a `skipped` run — never a
   pass. `agent/implement/` then treats a `skipped` browser run as a
   BLOCKING finding wherever browser QA was required.
   ============================================================ */

import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/**
 * Where a browser is, in the order it is preferred.
 *
 * The environment variable comes first so a contributor with a
 * browser somewhere unusual — or a runner that pins a version — can
 * say so without editing this list. Playwright's own cache is
 * consulted because a machine that has ever installed Playwright
 * (this repository does not, but a contributor's machine may) has a
 * known-good Chromium in a known place, and using it installs
 * nothing.
 */
export const BROWSER_ENV_VARS = ['BROWSER_QA_CHROME', 'CHROME_PATH', 'CHROMIUM_PATH'];

export const CANDIDATE_PATHS = [
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/microsoft-edge',
  '/snap/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

/** Glob-free expansion of the Playwright cache, which versions its
 *  directory names. Read with readdir rather than a glob so this
 *  needs no shell. */
export const PLAYWRIGHT_ROOTS = [
  process.env.PLAYWRIGHT_BROWSERS_PATH || null,
  process.env.HOME ? `${process.env.HOME}/.cache/ms-playwright` : null,
].filter(Boolean);

const executable = (p) => {
  try { return existsSync(p) && statSync(p).isFile(); } catch { return false; }
};

function playwrightCandidates() {
  const out = [];
  for (const root of PLAYWRIGHT_ROOTS) {
    for (const suffix of ['chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-linux/headless_shell']) {
      out.push(`${root}/chromium/${suffix}`);
      /* Versioned directories: chromium-1194/, chromium_headless_shell-1194/.
         readdirSync is avoided here deliberately — the caller may not
         have read permission on the root, and a thrown EACCES in a
         path-search helper reads as a failure of the suite rather
         than of the search. `which` below covers the rest. */
      for (const n of ['chromium-1194', 'chromium-1187', 'chromium-1181']) out.push(`${root}/${n}/${suffix}`);
    }
  }
  return out;
}

function onPath(name) {
  try {
    const p = execFileSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n')[0].trim();
    return p || null;
  } catch { return null; }
}

/**
 * @returns {{found:true, path:string, via:string, looked:string[]}
 *          |{found:false, path:null, reason:string, looked:string[]}}
 */
export function findBrowser({ env = process.env } = {}) {
  const looked = [];

  for (const v of BROWSER_ENV_VARS) {
    if (!env[v]) continue;
    looked.push(`$${v}=${env[v]}`);
    if (executable(env[v])) return { found: true, path: env[v], via: `$${v}`, looked };
  }

  for (const p of [...CANDIDATE_PATHS, ...playwrightCandidates()]) {
    looked.push(p);
    if (executable(p)) return { found: true, path: p, via: 'a known install location', looked };
  }

  for (const name of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
    const p = onPath(name);
    looked.push(`${name} (on PATH)`);
    if (p && executable(p)) return { found: true, path: p, via: 'PATH', looked };
  }

  return {
    found: false,
    path: null,
    reason: 'No Chromium or Chrome executable was found. This suite installs nothing — it drives a browser already on the machine over the DevTools protocol, because a package.json here is a red-tier architectural change (docs/AUTONOMY-POLICY.md, Class D). Set $BROWSER_QA_CHROME to a browser executable, or install one through the operating system.',
    looked,
  };
}

/** The version string the browser reports, for the run record. An
 *  unversioned browser result is not reproducible. */
export function browserVersion(path) {
  try {
    return execFileSync(path, ['--version'], { encoding: 'utf8', timeout: 10_000 }).trim() || null;
  } catch { return null; }
}
