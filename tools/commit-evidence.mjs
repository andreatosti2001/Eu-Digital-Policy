#!/usr/bin/env node
/* ============================================================
   commit-evidence.mjs — a change to the published website names its
   evidence in the commit that makes it.

   docs/PRODUCTION-OPERATING-MODE.md §5 measured three write paths by
   which the website can change and found the human commit the widest
   untraced one: "nothing requires a commit message here to name
   evidence, and nothing checks one". It recorded that requiring it was
   the author's decision. The author took it on 27 Sep 2026.

   THE RULE. A non-merge commit that changes a file in the published
   surface (tools/pages-artifact.mjs: the pages, app.js, style.css,
   sitemap.xml, css/, js/, data/, i18n/, fonts/) carries at least one
   trailer line

       Evidence: <what justified the change>

   naming what the change rests on: a source read, a record, a check,
   an issue. The check is that the line exists and says something; it
   cannot judge whether the evidence is good, and does not pretend to.

   MERGE COMMITS (11 Nov 2026, P1 checkpoint; docs/AUDIT-2026-11-11-P1.md
   §4). The rule as the author decided it judges non-merge commits, and
   that is unchanged here. Its stated reason — a merge's "content arrived
   in commits judged on their own" — is true only of a merge that adds
   nothing of its own. A merge can also carry content of its own: a
   conflict resolution, or an edit made while the merge was uncommitted
   (AUDIT-2026-11-11 §1.3, §5.4). mergeOwnFiles() measures exactly that
   content, and check() REPORTS each merge whose own content reaches a
   published file. Whether such a merge must also carry an Evidence:
   trailer is the author's decision (D-P1-1), not made here.

   SCOPE. Commits made before this file existed are not judged: the
   rule is not applied backwards to history that was written without
   it. The cut-off is the commit that added this file, found with git
   itself, not a date typed here.

   USAGE
     node tools/commit-evidence.mjs <base> <head>   check base..head
     node tools/commit-evidence.mjs --self-test

   Exit 0 when every commit in range complies, 1 when one does not,
   2 when git could not answer (an unknown commit is not a pass).
   ============================================================ */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { refusal } from './pages-artifact.mjs';

export const TRAILER = /^Evidence:[ \t]*\S.{3,}$/m;

/** Is this repository path part of the published website? */
export const isPublished = (path) => refusal(path) === null;

/**
 * The files a merge commit changes ITSELF: those whose content in the merge
 * differs from every parent (`git diff-tree --cc`) AND from the merge git
 * would have made on its own (`--remerge-diff`, git ≥ 2.36). The first list
 * alone also names a file both branches edited cleanly in different places;
 * the second alone also names a conflict resolved by taking one side
 * wholesale. Neither of those adds content no parent had; their
 * intersection is what does. An octopus merge (3+ parents) has no remerge
 * diff, so the first list is returned: wider, never narrower.
 *
 * Throws when git cannot answer (an unknown commit, a git too old for
 * --remerge-diff): an unanswered question is never an empty list.
 * @returns {string[]} sorted repository paths
 */
export function mergeOwnFiles(sha, { cwd } = {}) {
  const run = (args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  const list = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
  const parents = list(run(['rev-list', '--parents', '-n', '1', sha]).replace(/\s+/g, '\n')).slice(1);
  if (parents.length < 2) throw new Error(`${sha} is not a merge commit`);
  const vsEveryParent = new Set(list(run(['diff-tree', '--cc', '--no-renames', '--name-only', '--no-commit-id', sha])));
  if (!vsEveryParent.size) return [];
  if (parents.length > 2) return [...vsEveryParent].sort();
  const vsRemerge = new Set(list(run(['show', '--remerge-diff', '--no-renames', '--name-only', '--format=', sha])));
  return [...vsEveryParent].filter((f) => vsRemerge.has(f)).sort();
}

/** The judgement on one commit, as a pure function. A merge is not judged
 *  under the rule as decided; `files` is then the merge's own content
 *  (mergeOwnFiles), and the published part of it is reported. */
export function judge({ sha, parents, message, files }) {
  if (parents.length > 1) {
    if (files === null) return { sha, ok: true, merge: true, own_published: null, why: 'merge commit: not judged (non-merge commits only); what it changed itself could NOT be determined — reported, see the error above' };
    const own = (files ?? []).filter(isPublished);
    if (!own.length) return { sha, ok: true, merge: true, own_published: [], why: 'merge commit: no content of its own in a published file; its content arrived in commits judged on their own' };
    return { sha, ok: true, merge: true, own_published: own, why: `merge commit: not judged (the rule covers non-merge commits), but it changes ${own.length} published file(s) ITSELF (${own.slice(0, 4).join(', ')}${own.length > 4 ? ', …' : ''}) — content no commit in range was judged for; reported` };
  }
  const published = files.filter(isPublished);
  if (!published.length) return { sha, ok: true, why: 'changes no published file' };
  if (TRAILER.test(message)) return { sha, ok: true, why: `changes ${published.length} published file(s) and names its evidence` };
  return { sha, ok: false, why: `changes ${published.length} published file(s) (${published.slice(0, 4).join(', ')}${published.length > 4 ? ', …' : ''}) and carries no "Evidence:" trailer` };
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** The commit that introduced this rule; nothing before it is judged. */
export function ruleCommit() {
  const out = git('log', '--diff-filter=A', '--format=%H', '--', 'tools/commit-evidence.mjs');
  const shas = out.split('\n').filter(Boolean);
  return shas.length ? shas[shas.length - 1] : null;
}

export function check(base, head) {
  const cut = ruleCommit();
  const range = git('rev-list', '--reverse', `${base}..${head}`).split('\n').filter(Boolean);
  const results = [];
  for (const sha of range) {
    /* Judged only if the rule's own commit is an ancestor of (or is)
       this commit. Before the rule existed, or while the rule is not yet
       committed, nothing is judged. */
    let judged = Boolean(cut);
    if (cut) {
      try { execFileSync('git', ['merge-base', '--is-ancestor', cut, sha], { stdio: 'ignore' }); } catch { judged = false; }
    }
    if (!judged) { results.push({ sha, ok: true, why: 'made before the evidence rule existed; not judged' }); continue; }
    const parents = git('rev-list', '--parents', '-n', '1', sha).split(' ').slice(1);
    const message = git('log', '-1', '--format=%B', sha);
    let files;
    if (parents.length > 1) {
      try { files = mergeOwnFiles(sha); } catch (e) { files = null; console.error(`commit-evidence: the own changes of merge ${sha.slice(0, 7)} could not be determined: ${e.message.split('\n')[0]}`); }
    } else files = git('diff-tree', '--no-commit-id', '--name-only', '-r', '--root', sha).split('\n').filter(Boolean);
    results.push(judge({ sha, parents, message, files }));
  }
  return results;
}

function selfTest() {
  const t = (c, want, label) => { const got = judge(c).ok; if (got !== want) { console.error(`self-test FAILED: ${label}`); process.exit(1); } };
  t({ sha: 'a', parents: ['p'], message: 'x\n\nEvidence: OJ L 2024/1689, Art. 113', files: ['data/claims.json'] }, true, 'a trailer on a published change passes');
  t({ sha: 'b', parents: ['p'], message: 'x', files: ['data/claims.json'] }, false, 'a published change without a trailer fails');
  t({ sha: 'c', parents: ['p'], message: 'x', files: ['docs/HANDOVER.md', 'agent/x.mjs'] }, true, 'no published file, no trailer needed');
  t({ sha: 'd', parents: ['p', 'q'], message: 'Merge', files: ['index.html'] }, true, 'merge commits are not judged');
  t({ sha: 'e', parents: ['p'], message: 'x\n\nEvidence:', files: ['index.html'] }, false, 'an empty trailer is not evidence');
  t({ sha: 'f', parents: ['p'], message: 'x\n\nEvidence: n/a', files: ['index.html'] }, false, 'a trailer too short to name anything fails');
  /* a merge's own published content is reported, never silently "arrived elsewhere" */
  const own = judge({ sha: 'g', parents: ['p', 'q'], message: 'Merge', files: ['index.html', 'docs/x.md'] });
  if (!(own.ok && own.merge && own.own_published.length === 1 && /ITSELF/.test(own.why))) { console.error('self-test FAILED: a merge\'s own published change is reported'); process.exit(1); }
  const unknown = judge({ sha: 'h', parents: ['p', 'q'], message: 'Merge', files: null });
  if (!(unknown.own_published === null && /could NOT be determined/.test(unknown.why))) { console.error('self-test FAILED: an undetermined merge is reported as undetermined'); process.exit(1); }
  console.log('commit-evidence self-test: 8 of 8 cases as expected');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [a, b] = process.argv.slice(2);
  if (a === '--self-test') { selfTest(); process.exit(0); }
  if (!a || !b) { console.error('usage: node tools/commit-evidence.mjs <base> <head> | --self-test'); process.exit(2); }
  let results;
  try { results = check(a, b); } catch (e) { console.error(`git could not answer for ${a}..${b}: ${e.message.split('\n')[0]}. An unknown range is not a pass.`); process.exit(2); }
  const bad = results.filter((r) => !r.ok);
  const mergeOwn = results.filter((r) => r.merge && r.own_published !== undefined && (r.own_published === null || r.own_published.length));
  console.log(`commit-evidence · ${results.length} commit(s) in ${a.slice(0, 7)}..${b.slice(0, 7)} · ${bad.length} without evidence · ${mergeOwn.length} merge(s) with published content of their own or undetermined (reported, not judged)`);
  for (const r of results) console.log(`  ${r.ok ? (mergeOwn.includes(r) ? '!' : '·') : '✗'} ${r.sha.slice(0, 7)}  ${r.why}`);
  if (bad.length) console.log('\n  Add a trailer line "Evidence: <source, record or check the change rests on>" to each ✗ commit.');
  process.exit(bad.length ? 1 : 0);
}
