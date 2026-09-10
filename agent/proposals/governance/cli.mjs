#!/usr/bin/env node
/* ============================================================
   agent/proposals/governance/cli.mjs

     node agent/proposals/governance/cli.mjs corpus
     node agent/proposals/governance/cli.mjs patterns [--family <f>]
     node agent/proposals/governance/cli.mjs list
     node agent/proposals/governance/cli.mjs show <GP-nn|proposal-id>
     node agent/proposals/governance/cli.mjs check
     node agent/proposals/governance/cli.mjs --json <command>

   THERE IS NO `decide`, NO `apply`, NO `grant` AND NO `record`.
   That is the whole design. A decision on any of these lives in
   `agent/implement/decisions/decisions.jsonl` and is written by
   `node agent/implement/cli.mjs decide`, which requires a named
   human; a governance grant lives in
   `agent/policy/governance/grants.jsonl` and is written by
   `node agent/policy/cli.mjs grant`. This command reads.

   `check` is the one that belongs in CI. It resolves every anchor
   under every pattern against the tree it is run in and exits:

     0  no anchor is refuted
     1  an anchor is REFUTED — a pattern cites something this tree
        contradicts, which means the reading is wrong or the world
        moved, and either way a reader should not be shown it
        unqualified

   An anchor that cannot be checked here — a commit missing from a
   shallow clone, a measurement that needs a ref this checkout does
   not have — is `unresolvable_here`, is printed, and is NOT an
   exit 1. A checker that reported a fetch depth as a false claim
   would be making exactly the mistake pattern P-02 is about.
   ============================================================ */

import { resolveAll, REPO_ROOT, gitAvailability } from './evidence.mjs';
import { decisionCorpus, corrections } from './corpus.mjs';
import { patternsWithEvidence, FAMILIES } from './patterns.mjs';
import { buildProposals, PROPOSAL_KINDS } from './proposals.mjs';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (flag) => {
  const inline = argv.find((a) => a.startsWith(`${flag}=`));
  if (inline) return inline.split('=').slice(1).join('=');
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};
const command = argv.find((a) => !a.startsWith('--')) ?? 'list';
const asJson = has('--json');
const out = (s = '') => process.stdout.write(`${s}\n`);
const rule = () => out('  ' + '─'.repeat(74));
const wrap = (s, indent = '  ') => {
  const words = String(s).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 74) { lines.push(line); line = w; } else { line = (line ? `${line} ` : '') + w; }
  }
  if (line) lines.push(line);
  return lines.map((l) => indent + l).join('\n');
};

const asOf = valueOf('--as-of');

/* ---------------------------------------------------------- corpus */

if (command === 'corpus') {
  const c = decisionCorpus();
  const cor = corrections();
  if (asJson) { out(JSON.stringify({ ...c, corrections: cor }, null, 2)); process.exit(0); }
  out('');
  out('  THE DECISION CORPUS — every place a human decision could be recorded');
  rule();
  for (const s of c.stores) {
    out(`  ${s.id.padEnd(20)} ${s.state.toUpperCase().padEnd(11)} ${String(s.count).padStart(4)}  ${s.tracked ? 'tracked' : 'ignored'}`);
    out(wrap(s.why, '      '));
    out('');
  }
  rule();
  out(wrap(c.statement));
  out('');
  out(`  CORRECTIONS IN THE HISTORY — ${cor.available ? `${cor.count} of ${cor.scanned} commit(s)` : 'not measurable here'}`);
  out(wrap(cor.why, '    '));
  for (const x of cor.commits) out(`    ${x.sha.slice(0, 7)}  ${x.date}  ${x.subject}`);
  out('');
  process.exit(0);
}

/* ---------------------------------------------------------- patterns */

if (command === 'patterns') {
  const family = valueOf('--family');
  const r = await patternsWithEvidence({ resolveAll });
  const shown = family ? r.patterns.filter((p) => p.family === family) : r.patterns;
  if (asJson) { out(JSON.stringify(r, null, 2)); process.exit(0); }
  out('');
  out(`  WHAT KEEPS HAPPENING — ${r.patterns.length} supported pattern(s), ${r.refused.length} refused`);
  out(`  anchors: ${r.anchors.resolved} resolved · ${r.anchors.refuted} refuted · ${r.anchors.unresolvable_here} not checkable here`);
  rule();
  for (const f of FAMILIES) out(`  ${String(r.families[f]).padStart(2)}  ${f}`);
  rule();
  for (const p of shown) {
    out('');
    out(`  ${p.id} · ${p.family}`);
    out(`  ${p.title}`);
    out(wrap(p.statement, '      '));
    out('');
    out(wrap(`SO WHAT: ${p.so_what}`, '      '));
    out('');
    out(`      ${p.instances_holding} of ${p.instances_total} instance(s) hold:`);
    for (const i of p.instances) {
      const mark = i.anchor.state === 'resolved' ? '·' : i.anchor.state === 'refuted' ? 'X' : '?';
      out(`      ${mark} [${i.when}] ${i.what}`);
      out(wrap(i.anchor.why, '          '));
    }
  }
  if (r.refused.length) {
    rule();
    out('  REFUSED — reported rather than dropped');
    for (const p of r.refused) { out(`  ${p.id} · ${p.title}`); out(wrap(p.why, '      ')); }
  }
  out('');
  process.exit(0);
}

/* ---------------------------------------------------------- list / show */

if (command === 'list' || command === 'show') {
  const r = await buildProposals({ resolveAll, now: asOf });
  if (command === 'show') {
    const key = argv.find((a) => a !== 'show' && !a.startsWith('--'));
    const p = r.proposals.find((x) => x.ref === key || x.proposal_id === key);
    if (!p) { out(`  no governance proposal "${key}". Try: ${r.proposals.map((x) => x.ref).join(', ')}`); process.exit(1); }
    if (asJson) { out(JSON.stringify(p, null, 2)); process.exit(0); }
    out('');
    out(`  ${p.ref} · ${p.kind}`);
    out(`  ${p.title}`);
    out(`  ${p.proposal_id}`);
    rule();
    out('  THE ASK');       out(wrap(p.ask, '      '));
    out('');
    out('  WHAT IT WOULD DO');     out(wrap(p.what_it_would_do, '      '));
    out('');
    out('  WHAT IT WOULD NOT DO'); out(wrap(p.what_it_would_not_do, '      '));
    out('');
    out('  THE CASE AGAINST');     out(wrap(p.against, '      '));
    out('');
    out(`  COST            ${p.cost}`);
    out(`  WOULD TOUCH     ${p.changes.join(', ')}`);
    out(`  CLASS           ${p.autonomy_class}`);
    out(wrap(p.autonomy_why, '                  '));
    out(`  EVIDENCE        ${p.evidence.map((e) => `${e.pattern_id} (${e.instances_holding}/${e.instances_total})`).join(' · ')}`);
    out(`  DECISION        ${p.decision === null ? 'NONE. This proposal requires human approval and has not been decided.' : p.decision}`);
    out(wrap(p.decision_home, '                  '));
    out('');
    process.exit(0);
  }
  if (asJson) { out(JSON.stringify(r, null, 2)); process.exit(0); }
  out('');
  out('  GOVERNANCE PROPOSALS — every one requires human approval, none is decided');
  rule();
  out(wrap(r.patterns.patterns.length
    ? `Derived from ${r.patterns.patterns.length} supported pattern(s) over ${r.patterns.anchors.resolved} resolved anchor(s). Nothing in this directory writes a file, records a decision or changes a policy.`
    : 'No pattern in this tree is supported, so no proposal rests on anything.'));
  rule();
  for (const k of PROPOSAL_KINDS) {
    const ps = r.proposals.filter((p) => p.kind === k);
    if (!ps.length) { out(`  ${k} — none. The evidence in this tree does not support one, and one was not invented to fill the row.`); continue; }
    for (const p of ps) {
      out('');
      out(`  ${p.ref}  ${p.kind.toUpperCase()}  [${p.autonomy_class}]`);
      out(`        ${p.title}`);
      out(wrap(p.ask, '        '));
      out(`        evidence: ${p.evidence.map((e) => e.pattern_id).join(', ')} · would touch: ${p.changes.join(', ')}`);
    }
  }
  if (r.refused.length) {
    rule();
    out('  WITHDRAWN — the evidence stopped holding');
    for (const p of r.refused) { out(`  ${p.ref} · ${p.title}`); out(wrap(p.refused_why, '      ')); }
  }
  rule();
  out(`  ${r.summary}`);
  out('  node agent/proposals/governance/cli.mjs show <GP-nn>   for the argument, the cost and the case against');
  out('');
  process.exit(0);
}

/* ---------------------------------------------------------- check */

if (command === 'check') {
  const r = await patternsWithEvidence({ resolveAll });
  const all = [...r.patterns, ...r.refused];
  const refuted = [];
  const unresolvable = [];
  for (const p of all) {
    for (const i of p.instances) {
      if (i.anchor.state === 'refuted') refuted.push({ pattern: p.id, why: i.anchor.why });
      if (i.anchor.state === 'unresolvable_here') unresolvable.push({ pattern: p.id, why: i.anchor.why });
    }
  }
  const git = gitAvailability();
  if (asJson) { out(JSON.stringify({ refuted, unresolvable, git, root: REPO_ROOT }, null, 2)); process.exit(refuted.length ? 1 : 0); }
  out('');
  out(`  GOVERNANCE EVIDENCE CHECK — ${r.anchors.resolved} resolved · ${r.anchors.refuted} refuted · ${r.anchors.unresolvable_here} not checkable here`);
  rule();
  out(wrap(`git: ${git.why}`));
  for (const u of unresolvable) { out(`  ?  ${u.pattern}`); out(wrap(u.why, '      ')); }
  for (const f of refuted) { out(`  X  ${f.pattern}`); out(wrap(f.why, '      ')); }
  rule();
  if (refuted.length) {
    out(`  ${refuted.length} anchor(s) REFUTED. A pattern citing something this tree contradicts is not shown unqualified.`);
    out('');
    process.exit(1);
  }
  out('  No anchor is refuted. Nothing here writes, and nothing here decides.');
  out('');
  process.exit(0);
}

out('');
out(`  unknown command "${command}". Try: corpus · patterns · list · show <GP-nn> · check`);
out('');
process.exit(1);
