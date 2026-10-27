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

   THE FINDING THIS MODULE WAS WRITTEN TO MAKE CHECKABLE, and what
   became of it. Until 24 Oct 2026 the site was GitHub Pages serving
   `main` at the repository root through Jekyll, with no exclude list,
   so `agent/`, `docs/` and `tools/` were part of the same deployment
   as `index.html`, and the only exclusion was Jekyll's dot prefix.
   Since then the site is published only by
   `.github/workflows/pages.yml`, from an artifact built from the
   allowlist in `tools/pages-artifact.mjs` (docs/DEPLOYMENT.md §1b, §2),
   and this module reads that allowlist rather than modelling Jekyll
   (v2 Session 4, B.2, 27 Oct 2026). The protocol's §10 still holds:
   hidden routes, hidden links, robots.txt, frontend checks and unlisted
   pages are not security mechanisms, and neither is the allowlist — it
   is a PUBLICATION boundary.

   THE REPOSITORY IS A SECOND PUBLIC SURFACE. The GitHub repository is
   public (read on 27 Oct 2026), so every tracked file is readable on
   github.com whatever the website serves. The secret scan reads that
   surface; the control-plane exposure check reads the website's.

   WHAT IS ESTABLISHED AND WHAT IS INFERRED, kept apart because this
   repository has been caught conflating them before (AUDIT F-01).
   The allowlist and the tracked files are READ FROM THE TREE. That
   the live site serves exactly the artifact is inferred from the
   workflow and from the dated measurements docs/DEPLOYMENT.md
   records; nothing here fetches the site.

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
import { refusal } from '../../tools/pages-artifact.mjs';

/** Directories whose contents are, by their own documentation, the
 *  private control plane rather than the public website. Since
 *  24 Oct 2026 the allowlist keeps every one of them off the website;
 *  the tracked ones are still public in the repository. */
export const CONTROL_PLANE_DIRS = [
  ['agent/', 'the agent layer: orchestration, contracts, proposals, approval mechanisms and operational traces. Protocol §10 puts every one of those in the private control plane.'],
  ['agent/implement/decisions/', 'the approval ledger — who approved what, and when.'],
  ['agent/records/', 'contract records: what agents found, proposed and refused. Git-ignored, so not published today, and that is an ignore rule rather than a boundary.'],
  ['agent/observability/runs/', 'operational traces. Git-ignored, same caveat.'],
  ['.agents/', 'skills — the agent operating instructions.'],
  ['.control-room/', 'the Control Room: the private administrative interface, its authentication and authorization, and its audit trail. SESSION 21. It is dot-prefixed, and tools/pages-artifact.mjs refuses a dot path by name whatever its allowlist says. Its private state (.control-room/state/) is git-ignored as well, so it is outside the repository too; its source is public there.'],
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
export const TEST_FIXTURE_PATHS = [
  /(^|\/)selftest\.mjs$/,
  /(^|\/)fixtures\.mjs$/,
  /(^|\/)demo\//,
  /* SESSION 23.5's verification gate splits its fixtures across two
     files: `selftest.mjs`, which this list already covered, and
     `harness.mjs`, which builds the worlds the attacks run against
     and holds the local provider's test passphrase. It exists only
     to be imported by that suite and by `verify/cli.mjs`, so calling
     it a test fixture is a true classification rather than an
     exemption — and classification is not suppression: the hit is
     still found, still reported and still counted, at warning
     severity beside the other ten. This is a change to a check, and
     `docs/AUTONOMY-POLICY.md` puts that at Class C: it is recorded
     in docs/HANDOVER.md so a reader can disagree with it. */
  /(^|\/)verify\/harness\.mjs$/,
];

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
 * The two public surfaces, measured rather than inferred.
 *
 * Until 24 Oct 2026 this module modelled the website as GitHub Pages
 * serving `main` through Jekyll, so "published" was every tracked file
 * whose path had no "." or "_" segment. Since that day the site is
 * published only by .github/workflows/pages.yml, from an artifact built
 * from an ALLOWLIST (docs/DEPLOYMENT.md §1b, §2). What that artifact holds
 * has one home, tools/pages-artifact.mjs refusal(), and this asks it
 * instead of re-deriving it (v2 Session 4, B.2, 27 Oct 2026).
 *
 * That narrowed one surface and made a second one visible, and the two
 * must not be conflated in either direction:
 *   · published   — the WEBSITE: the tracked files refusal() admits, which
 *                   is what a reader's browser can be served;
 *   · repository  — every tracked file. The GitHub repository is PUBLIC
 *                   (its visibility read on 27 Oct 2026), so agent/, docs/,
 *                   tools/ and the dot directories are readable by anyone
 *                   on github.com even though the website serves none of
 *                   them. The secret scan reads this surface, not the
 *                   narrower one: a credential committed here is public
 *                   whatever the artifact says.
 * A path in the tree that the allowlist refuses is not silently gone: it
 * is listed in `excluded`, with the reason refusal() gives.
 */
export function publicSurface({ root = REPO_ROOT } = {}) {
  const tracked = trackedFiles({ root });
  const onDisk = allFiles({ root });
  /* Tracked files are what `main` carries. When git cannot be consulted,
     fall back to the whole tree — overstating a surface is the safe
     direction for a boundary check — and say which happened. */
  const files = tracked ?? onDisk;

  const why = new Map(files.map((f) => [f, refusal(f)]));
  const published = files.filter((f) => why.get(f) === null);
  const excluded = files.filter((f) => why.get(f) !== null);
  const refusedBy = {};
  for (const f of excluded) {
    const top = f.split('/')[0];
    (refusedBy[top] ??= { files: 0, why: why.get(f) }).files++;
  }
  const trackedSet = new Set(files);
  const untracked = tracked ? onDisk.filter((f) => !trackedSet.has(f)) : [];

  return {
    total: files.length,
    published,
    excluded,
    excluded_by_reason: refusedBy,
    repository: files,
    /* Present on this machine and never committed, so in neither surface.
       Reported rather than dropped: several of these hold control-plane
       data, and "not public because git ignores it" is a different and
       weaker fact from "not published because the allowlist refuses it". */
    untracked,
    allowlisted: true,
    source_of_truth: tracked
      ? 'git ls-files, filtered by tools/pages-artifact.mjs refusal() — the allowlist .github/workflows/pages.yml builds the deployed artifact from'
      : 'the filesystem walk filtered by refusal() — GIT COULD NOT BE CONSULTED, so the repository surface OVERSTATES by including untracked and ignored files',
    git_consulted: Boolean(tracked),
    files_on_disk: onDisk.length,
    has_config: existsSync(join(root, '_config.yml')),
    has_nojekyll: existsSync(join(root, '.nojekyll')),
    established: [
      `${published.length} of ${files.length} tracked file(s) are on the allowlist of website files (tools/pages-artifact.mjs); ${excluded.length} are refused by it`,
      'since 24 Oct 2026 .github/workflows/pages.yml is the only publisher of the site (docs/DEPLOYMENT.md §1b, measured that day)',
      'the GitHub repository is public (its visibility, read on 27 Oct 2026), so every tracked file is readable on github.com',
      tracked ? `${onDisk.length - files.length} more file(s) exist on this machine and are not tracked` : 'git could not be consulted, so this reads the filesystem and overstates',
    ],
    inferred: 'that the live site serves exactly the allowlisted artifact is inferred from the workflow and from the measurements docs/DEPLOYMENT.md records (private paths answering 404 on 27 Sep, 23 Oct and 24 Oct 2026); this function reads the tree and does not fetch the site.',
    unresolved: 'the publication boundary is measured on dates, not continuously: nothing here re-fetches the live site, so a later change of host or Pages setting would go unseen until somebody measures again (docs/CONTROL-ROOM.md §11.3).',
  };
}

/**
 * Control-plane paths that are on the public WEBSITE.
 *
 * Until 24 Oct 2026 this returned every one of them, because the
 * deployment served the whole tree. Since the allowlisted artifact it
 * returns none, and that is a measurement of the allowlist, not an
 * assumption: a control-plane path the allowlist admits appears here.
 * Two further facts are reported beside it rather than folded in:
 * the tracked control-plane files are public in the REPOSITORY, and a
 * git-ignored directory is absent from both surfaces only because
 * nobody committed it.
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
    /* An entry with zero files on the website is not a clearance of
       the repository: what is tracked there is readable on github.com,
       and what is git-ignored is kept out by an ignore rule, which one
       `git add -f` undoes. */
    ignored_not_excluded: CONTROL_PLANE_DIRS
      .filter(([prefix]) => !surface.published.some((f) => f.startsWith(prefix)))
      .map(([prefix, why]) => {
        const inRepo = surface.repository.filter((f) => f.startsWith(prefix)).length;
        const onDisk = surface.untracked.some((f) => f.startsWith(prefix));
        return {
          prefix,
          why,
          present_on_disk: onDisk,
          public_in_repository: inRepo,
          reason: inRepo
            ? `not on the website: tools/pages-artifact.mjs refuses it (${refusal(prefix + 'x')}). Its ${inRepo} tracked file(s) are public in the repository on github.com.`
            : 'in neither surface because git does not track it. That is an IGNORE RULE, not a publication boundary: a single `git add -f` would put it in the public repository, and nothing in this repository would object; the website would still refuse it.',
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
  /* the REPOSITORY surface: every tracked file is public on github.com,
     so a credential anywhere in it is published whatever the website's
     allowlist says (v2 Session 4, B.2) */
  const list = files ?? publicSurface({ root }).repository;
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
 * have introduced, and a control-plane path on the website is a
 * publication fact the allowlist decides. Since 24 Oct 2026 the
 * allowlist admits none, so the warning count is the test fixtures
 * alone; a control-plane path admitted tomorrow raises it, and it is
 * named in `new_findings` on every run so it cannot be missed.
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
      ...exposure.exposed.map((e) => `${e.prefix} is on the public website (${e.files} files): ${e.why}`),
    ],
    output_excerpt: [
      `${secrets.scanned} text file(s) scanned against ${secrets.patterns} credential patterns · ${secrets.blocking.length} blocking · ${secrets.fixtures.length} in test fixtures`,
      `${exposure.surface.published.length} of ${exposure.surface.total} tracked file(s) are on the website's allowlist (tools/pages-artifact.mjs); ${exposure.exposed.length} control-plane director(ies) among them`,
      `refused by the allowlist and public in the repository: ${Object.entries(exposure.surface.excluded_by_reason).map(([k, v]) => `${k} ${v.files}`).join(', ')}`,
      exposure.surface.unresolved,
    ].join('\n'),
    detail: { secrets, exposure },
  };
}
