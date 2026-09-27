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

/** The judgement on one commit, as a pure function. */
export function judge({ sha, parents, message, files }) {
  if (parents.length > 1) return { sha, ok: true, why: 'merge commit: its content arrived in commits judged on their own' };
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
    const files = git('diff-tree', '--no-commit-id', '--name-only', '-r', '-m', '--root', sha).split('\n').filter(Boolean);
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
  console.log('commit-evidence self-test: 6 of 6 cases as expected');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [a, b] = process.argv.slice(2);
  if (a === '--self-test') { selfTest(); process.exit(0); }
  if (!a || !b) { console.error('usage: node tools/commit-evidence.mjs <base> <head> | --self-test'); process.exit(2); }
  let results;
  try { results = check(a, b); } catch (e) { console.error(`git could not answer for ${a}..${b}: ${e.message.split('\n')[0]}. An unknown range is not a pass.`); process.exit(2); }
  const bad = results.filter((r) => !r.ok);
  console.log(`commit-evidence · ${results.length} commit(s) in ${a.slice(0, 7)}..${b.slice(0, 7)} · ${bad.length} without evidence`);
  for (const r of results) console.log(`  ${r.ok ? '·' : '✗'} ${r.sha.slice(0, 7)}  ${r.why}`);
  if (bad.length) console.log('\n  Add a trailer line "Evidence: <source, record or check the change rests on>" to each ✗ commit.');
  process.exit(bad.length ? 1 : 0);
}
