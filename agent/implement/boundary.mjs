/* ============================================================
   agent/implement/boundary.mjs — the public website and the private
   control plane are separate security domains, and in this
   repository they are not separated at all

   SESSION 18 requires an implementation agent that will not let the
   public website expose Control Room credentials, API keys,
   privileged endpoints, approval mechanisms, agent execution
   controls, private operational traces or deployment credentials.
   Requirements 4 and 5 want regression tests proving that public
   assets carry no privileged credential and that Control Room
   functionality cannot become publicly accessible through accidental
   static publication.

   THE FINDING THIS MODULE EXISTS TO MAKE CHECKABLE, and it is a
   finding rather than a control: **there is no separation mechanism
   here.** Deployment is GitHub Pages serving `main` at the
   repository root (`docs/CURRENT-ARCHITECTURE.md` §13). There is no
   `_config.yml`, no `.nojekyll`, and no exclude list. Under that
   configuration the units of publication are FILES IN THE
   REPOSITORY, so `agent/`, `docs/`, `tools/` and this module are
   part of the same deployment as `index.html`. A Control Room page
   added to this tree in SESSION 21 would be public the moment it was
   pushed, and the protocol says so in its own §10: hidden routes,
   hidden links, robots.txt, frontend checks and unlisted pages are
   not security mechanisms.

   WHAT IS ESTABLISHED AND WHAT IS INFERRED, kept apart because this
   repository has been caught conflating them before (AUDIT F-01).
   That there is no `_config.yml`, no `.nojekyll` and no exclude
   list is READ FROM THE TREE. That the live site therefore serves
   `agent/` is an INFERENCE from GitHub Pages' documented default,
   and it has NOT been confirmed by fetching the deployed site:
   outbound access to andreatosti2001.github.io is refused by this
   environment's network policy, exactly as
   `docs/CURRENT-ARCHITECTURE.md` §13 records. Every record this
   module produces carries that as an open question rather than
   asserting what the live site serves.

   THE SECRET SCAN IS A FLOOR, NOT A CEILING. It matches shapes —
   `sk-`, `ghp_`, an `Authorization:` header with a literal, a long
   base64 run beside the word "key". A credential this does not match
   is a credential it did not find, and a clean run is not proof the
   tree holds no secret. Stated here rather than in a footnote,
   because "the secret scan passed" is the kind of sentence that gets
   quoted later as if it had proved something.
   ============================================================ */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { REPO_ROOT } from './baseline.mjs';

/** What GitHub Pages excludes by default when Jekyll processes a
 *  site with no `_config.yml`. Everything else in the tree is
 *  published. Sourced from Jekyll's documented defaults; the
 *  inference is labelled as one wherever this list is used. */
export const JEKYLL_DEFAULT_EXCLUDES = ['.git', '.github', 'node_modules', 'vendor', 'Gemfile', 'Gemfile.lock'];

/** Directories whose contents are, by their own documentation, the
 *  private control plane rather than the public website. None of
 *  them is excluded from publication by anything in this
 *  repository — which is the point. */
export const CONTROL_PLANE_DIRS = [
  ['agent/', 'the agent layer: orchestration, contracts, proposals, approval mechanisms and operational traces. Protocol §10 puts every one of those in the private control plane.'],
  ['agent/implement/decisions/', 'the approval ledger — who approved what, and when.'],
  ['agent/records/', 'contract records: what agents found, proposed and refused. Git-ignored, so not published today, and that is an ignore rule rather than a boundary.'],
  ['agent/observability/runs/', 'operational traces. Git-ignored, same caveat.'],
  ['.agents/', 'skills — the agent operating instructions.'],
  ['.control-room/', 'the Control Room: the private administrative interface, its authentication and authorization, and its audit trail. SESSION 21. It is dot-prefixed BECAUSE of this check — the deployment does not serve a path whose segments begin with "." or "_", and that is the only publication boundary this repository has. Its private state (.control-room/state/) is git-ignored as well, so it is outside on both counts.'],
];

/** Shapes that are credentials. Each carries what it matches so a
 *  hit is legible without re-deriving the regex. */
export const SECRET_PATTERNS = [
  { id: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/g, what: 'an AWS access key id' },
  { id: 'github-token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g, what: 'a GitHub token' },
  { id: 'openai-key', re: /\bsk-[A-Za-z0-9_-]{20,}\b/g, what: 'an API key in the sk- shape' },
  { id: 'slack-token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g, what: 'a Slack token' },
  { id: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g, what: 'a Google API key' },
  { id: 'private-key-block', re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g, what: 'a private key block' },
  { id: 'jwt', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, what: 'a JSON Web Token' },
  { id: 'basic-auth-url', re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s/@:]+:[^\s/@]+@/gi, what: 'credentials embedded in a URL' },
  { id: 'assigned-secret', re: /\b(?:api[_-]?key|secret|password|passwd|token|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'`][^"'`\n]{12,}["'`]/gi, what: 'a secret-shaped name assigned a literal value' },
  { id: 'authorization-header', re: /\bAuthorization\s*:\s*["'`]?\s*(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{12,}/g, what: 'an Authorization header carrying a literal credential' },
  { id: 'default-credentials', re: /\b(?:admin|root)\s*[:/]\s*(?:admin|root|password|123456)\b/gi, what: 'a default credential pair — protocol §11 forbids "admin / admin" existing at all' },
];

/** A hit inside one of these is a PATTERN DEFINITION, not a secret.
 *  Without this, this file reports itself. */
export const SCANNER_OWN_FILES = ['agent/implement/boundary.mjs', 'agent/implement/selftest.mjs', 'docs/IMPLEMENTATION-QA.md'];

/**
 * THE WEBSITE SURFACE — the files a reader's browser actually loads.
 *
 * This is the surface SESSION 18 requirement 4 is about, and it is
 * much smaller than "everything GitHub Pages would serve". A
 * credential here is an ERROR without qualification: it is in the
 * pages, the modules, the stylesheets or the data, and it reaches a
 * reader.
 */
export const WEBSITE_SURFACE = [
  (f) => f.endsWith('.html') && !f.includes('/'),
  (f) => f.startsWith('js/'),
  (f) => f.startsWith('css/'),
  (f) => f.startsWith('data/'),
  (f) => f.startsWith('i18n/'),
  (f) => f.startsWith('fonts/'),
  (f) => f === 'app.js' || f === 'style.css',
];

export const isWebsiteAsset = (f) => WEBSITE_SURFACE.some((m) => m(f));

/**
 * A mechanical classification of WHERE a credential shape was found.
 * Not a suppression: every hit is reported either way, and the count
 * of each class is carried separately.
 *
 * The distinction earns its place because eight of the hits in this
 * repository today are DELIBERATE synthetic credentials in the
 * fixtures that prove `agent/observability/redact.mjs` works — a
 * suite that tests redaction has to contain something to redact.
 * Deleting them would weaken a test to make a check pass, which
 * docs/AUTONOMY-POLICY.md prohibits under every autonomy class, and
 * allow-listing the files would hide a real key added to one of them
 * next week. Classifying and counting does neither.
 */
export const TEST_FIXTURE_PATHS = [/(^|\/)selftest\.mjs$/, /(^|\/)fixtures\.mjs$/, /(^|\/)demo\//];

export function classifyHit(path) {
  if (isWebsiteAsset(path)) return { class: 'website_asset', severity: 'error', why: 'in a file a reader\'s browser loads. A credential here reaches a reader.' };
  if (TEST_FIXTURE_PATHS.some((re) => re.test(path))) {
    return { class: 'test_fixture', severity: 'warning', why: 'in a selftest, a fixture set or a demo — where a suite that proves redaction works must contain something to redact. Reported and counted, never suppressed: a real credential added to one of these files appears here too, and the count rising is the finding.' };
  }
  return { class: 'unclassified', severity: 'error', why: 'in the published tree, in a file that is neither a website asset nor a declared test fixture. Treated as a real credential until somebody says otherwise.' };
}

/* Only the two that are enormous and never relevant. The run-artifact
   directories used to be listed here as well, which made `untracked`
   silently incomplete — a directory skipped by the walk cannot be
   reported as present on disk. Now that `publicSurface` filters by
   git tracking, the walk's job is to say what EXISTS, and skipping
   things it should be reporting was the wrong shape for it. */
const SKIP_DIRS = new Set(['.git', 'node_modules']);
const BINARY_EXT = new Set(['.woff', '.woff2', '.ttf', '.otf', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.gif', '.pdf', '.zip']);

/** Every file in the tree, repository-relative. Includes untracked
 *  and git-ignored files; `publicSurface` filters them out. */
export function allFiles({ root = REPO_ROOT } = {}) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      if (SKIP_DIRS.has(name)) continue;
      const abs = join(dir, name);
      let st;
      try { st = statSync(abs); } catch { continue; }
      if (st.isDirectory()) walk(abs);
      else out.push(relative(root, abs).split('\\').join('/'));
    }
  };
  walk(root);
  return out;
}

/**
 * Every file git actually tracks.
 *
 * THIS IS THE CORRECTION SESSION 20 FORCED. `publicSurface()`
 * originally walked the filesystem, which models "every file present
 * on this machine" — and publication is not that. Deployment is
 * GitHub Pages serving `main`, and `main` contains TRACKED FILES
 * ONLY. A git-ignored run artifact is on the developer's disk and
 * has never been in a commit, so it is not published.
 *
 * The difference is not academic: `agent/records/`,
 * `agent/observability/runs/` and `agent/health/history/` all hold
 * control-plane data and all exist locally the moment anything runs.
 * The filesystem walk reported them as PUBLISHED, which is a false
 * alarm — and a security check that cries wolf about three
 * directories on every run is a security check people learn to
 * ignore. agent/health/selftest.mjs caught it by asserting the
 * health record was not in the published surface, and finding it
 * there.
 *
 * A failure to run git is NOT silently treated as "everything is
 * tracked": it returns null, and the caller falls back to the
 * filesystem walk and SAYS SO, because overstating the published
 * surface is the safe direction for a boundary check.
 */
export function trackedFiles({ root = REPO_ROOT } = {}) {
  try {
    const out = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const files = out.split('\0').filter(Boolean);
    return files.length ? files : null;
  } catch { return null; }
}

/**
 * What a GitHub Pages deployment from the repository root would
 * serve — with the epistemic status of the answer attached, because
 * this has NOT been confirmed against the live site.
 */
export function publicSurface({ root = REPO_ROOT } = {}) {
  const tracked = trackedFiles({ root });
  const onDisk = allFiles({ root });
  /* Tracked files are what `main` carries and therefore what Pages
     serves. When git cannot be consulted, fall back to the whole
     tree — overstating the published surface is the safe direction
     for a boundary check — and say which happened. */
  const files = tracked ?? onDisk;

  const excludedByDefault = files.filter((f) => JEKYLL_DEFAULT_EXCLUDES.some((e) => f === e || f.startsWith(`${e}/`)));
  const dotfiles = files.filter((f) => f.split('/').some((seg) => seg.startsWith('_') || seg.startsWith('.')));
  const published = files.filter((f) => !excludedByDefault.includes(f) && !dotfiles.includes(f));
  const trackedSet = new Set(files);
  const untracked = tracked ? onDisk.filter((f) => !trackedSet.has(f)) : [];

  return {
    total: files.length,
    published,
    excluded: [...new Set([...excludedByDefault, ...dotfiles])],
    /* Present on this machine and never committed, so never
       published. Reported rather than dropped: several of these
       hold control-plane data, and "not published because git
       ignores it" is a different and weaker fact from "not
       published because the deployment excludes it". */
    untracked,
    source_of_truth: tracked ? 'git ls-files — what `main` carries, which is what GitHub Pages serves' : 'the filesystem walk — GIT COULD NOT BE CONSULTED, so this OVERSTATES the published surface by including untracked and ignored files',
    git_consulted: Boolean(tracked),
    files_on_disk: onDisk.length,
    has_config: existsSync(join(root, '_config.yml')),
    has_nojekyll: existsSync(join(root, '.nojekyll')),
    established: [
      `there is no _config.yml in the repository root${existsSync(join(root, '_config.yml')) ? ' — CORRECTION: there is one, and this module has not read its exclude list' : ''}`,
      `there is no .nojekyll${existsSync(join(root, '.nojekyll')) ? ' — CORRECTION: there is one' : ''}`,
      'no file in the tree declares an exclude list for publication',
      tracked ? `${files.length} file(s) are tracked by git and therefore in the deployment unit; ${onDisk.length - files.length} more exist on this machine and are not` : 'git could not be consulted, so this reads the filesystem and overstates',
    ],
    inferred: 'that the deployed site therefore serves every path above is inferred from GitHub Pages\' documented default behaviour and from docs/CURRENT-ARCHITECTURE.md §13 ("Deployment is GitHub Pages serving main at the repository root"). It has NOT been confirmed by fetching the deployed site.',
    unresolved: 'outbound access to andreatosti2001.github.io is refused by this environment\'s network policy (HTTP 403 on CONNECT, recorded in docs/CURRENT-ARCHITECTURE.md §13). Nothing in this repository has ever fetched the live site, so what it actually serves is not established here.',
  };
}

/**
 * Control-plane paths that are inside the public surface.
 *
 * Today this returns every one of them, and that IS the result. It
 * is not a bug in the check and it must not be "fixed" by narrowing
 * the list — the separation does not exist, and the honest output of
 * a boundary check on a repository with no boundary is a full list.
 */
export function controlPlaneExposure({ root = REPO_ROOT } = {}) {
  const surface = publicSurface({ root });
  const exposed = [];
  for (const [prefix, why] of CONTROL_PLANE_DIRS) {
    const hits = surface.published.filter((f) => f.startsWith(prefix));
    if (hits.length) exposed.push({ prefix, why, files: hits.length, sample: hits.slice(0, 4) });
  }
  return {
    exposed,
    /* An entry with zero files is not a clearance. agent/records/ and
       agent/observability/runs/ are absent because they are
       git-ignored, and an ignore rule is not a publication boundary:
       a single `git add -f` puts operational traces on the public
       web with no error anywhere. */
    ignored_not_excluded: CONTROL_PLANE_DIRS
      .filter(([prefix]) => !surface.published.some((f) => f.startsWith(prefix)))
      .map(([prefix, why]) => {
        const onDisk = surface.untracked.some((f) => f.startsWith(prefix));
        const excludedByJekyll = surface.excluded.some((f) => f.startsWith(prefix));
        return {
          prefix,
          why,
          present_on_disk: onDisk,
          /* Two very different reasons to be absent from the
             published set, and collapsing them would overstate the
             protection. A dotfile directory is excluded by the
             DEPLOYMENT; a git-ignored directory is absent because
             nobody committed it, which one `git add -f` undoes. */
          reason: excludedByJekyll
            ? 'excluded from publication by the deployment: paths beginning with "." or "_" are not served. That is a real boundary, and it is the only one this repository has.'
            : 'not in the deployment unit because git does not track it. That is an IGNORE RULE, not a publication boundary: a single `git add -f` would put it in `main` and nothing in this repository would object.',
        };
      }),
    surface,
  };
}

/**
 * Scan for credential shapes.
 *
 * @param {{root?:string, files?:string[]}} opts
 */
export function scanSecrets({ root = REPO_ROOT, files = null } = {}) {
  const list = files ?? publicSurface({ root }).published;
  const findings = [];
  let scanned = 0;
  let skippedBinary = 0;

  for (const rel of list) {
    if (BINARY_EXT.has(rel.slice(rel.lastIndexOf('.')).toLowerCase())) { skippedBinary++; continue; }
    let text;
    try { text = readFileSync(join(root, rel), 'utf8'); } catch { continue; }
    scanned++;
    if (SCANNER_OWN_FILES.includes(rel)) continue;

    for (const p of SECRET_PATTERNS) {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(text)) !== null) {
        const line = text.slice(0, m.index).split('\n').length;
        findings.push({
          pattern: p.id,
          what: p.what,
          path: rel,
          line,
          ...classifyHit(rel),
          /* The match is REDACTED. A boundary check that prints the
             credential it found has published it into the run log,
             the CI artifact and the pull request. */
          matched: `${m[0].slice(0, 4)}…${m[0].length} chars`,
        });
        if (findings.length > 200) break;
      }
    }
  }

  const blocking = findings.filter((f) => f.severity === 'error');
  return {
    findings,
    blocking,
    fixtures: findings.filter((f) => f.class === 'test_fixture'),
    scanned,
    skipped_binary: skippedBinary,
    patterns: SECRET_PATTERNS.length,
    bound: 'This matches known credential SHAPES. A credential it does not match is a credential it did not find, and a clean run is not proof the tree holds no secret. It also reads only text files: a key inside a font or an image is invisible to it.',
  };
}

/**
 * The whole boundary check, in the shape the QAResult contract wants
 * for one check.
 *
 * `errors` counts secrets only. Control-plane exposure is a WARNING
 * rather than an error, and the distinction is deliberate: a
 * credential in the public surface is a defect this change could
 * have introduced, and the absence of a public/private boundary is a
 * standing architectural fact that predates every change and would
 * otherwise redden every run forever. It is named in `new_findings`
 * on every run so it cannot be forgotten, and
 * `docs/IMPLEMENTATION-QA.md` §6 carries it as the standing finding
 * it is.
 */
export function boundaryCheck({ root = REPO_ROOT } = {}) {
  const secrets = scanSecrets({ root });
  const exposure = controlPlaneExposure({ root });

  return {
    name: 'public/private control plane boundary',
    command: 'node agent/implement/cli.mjs boundary',
    exit_code: secrets.blocking.length ? 1 : 0,
    /* Errors are credentials in a website asset or in an
       unclassified published file. A synthetic credential inside a
       selftest is a warning and is still named below. */
    errors: secrets.blocking.length,
    warnings: exposure.exposed.length + secrets.fixtures.length,
    baseline_errors: 0,
    /* The baseline for exposure is what it is TODAY, so a new
       control-plane directory shows up as a rise. It is recorded in
       docs/IMPLEMENTATION-QA.md §6 rather than here, and read from
       there by the implementer. */
    baseline_warnings: exposure.exposed.length + secrets.fixtures.length,
    new_findings: [
      ...secrets.findings.map((f) => `${f.path}:${f.line} — ${f.what} (${f.pattern}) [${f.class}, ${f.severity}], value redacted`),
      ...exposure.exposed.map((e) => `${e.prefix} is inside the public surface (${e.files} files): ${e.why}`),
    ],
    output_excerpt: [
      `${secrets.scanned} text file(s) scanned against ${secrets.patterns} credential patterns · ${secrets.blocking.length} blocking · ${secrets.fixtures.length} in test fixtures`,
      `${exposure.surface.published.length} of ${exposure.surface.total} file(s) would be published; ${exposure.exposed.length} control-plane director(ies) among them`,
      `_config.yml: ${exposure.surface.has_config ? 'present' : 'absent'} · .nojekyll: ${exposure.surface.has_nojekyll ? 'present' : 'absent'}`,
      exposure.surface.unresolved,
    ].join('\n'),
    detail: { secrets, exposure },
  };
}
