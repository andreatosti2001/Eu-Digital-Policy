/* ============================================================
   agent/improve/observe.mjs — one observation pass over the whole
   system, in one process, with one as-of date

   WHAT THIS IS FOR. Everything it runs already exists and already
   has a CLI. What did not exist is a pass that runs them TOGETHER,
   against the same corpus at the same instant, and normalises what
   comes back into one list whose entries can be compared with the
   same list taken last week. Eleven CLIs run by hand on eleven
   afternoons produce eleven reports and no comparison, and the
   comparison is the whole of what "continuous" means.

   IT RE-IMPLEMENTS NOTHING, and that is a constraint rather than a
   preference. Every finding here is a record a specialist agent
   minted, carrying the id that agent derived from the finding's own
   content (agent/schemas/identity.mjs). This module does not mint an
   id, does not assign a severity, does not decide what is
   important, and does not read a page, a dataset or a sentence. If
   it did, the finding would have two homes and they could disagree.

   HOW A FINDING IS NORMALISED, and why it is done this way. Each
   observer runs against a MemoryRecordStore and this module reads
   `store.written` — the records the agent actually shipped through
   its own contract gateway. It does NOT read the agent's return
   value, whose shape differs agent by agent and is that agent's
   presentation of its run. The stored records are the thing every
   other consumer here reads, so normalising from them means this
   module sees exactly what the Orchestrator, the Control Room and
   the autonomy runner see.

   TWO KINDS OF OBSERVATION, and they are never mixed.

   · A FINDING is an identified thing: a gap, a proposal, a
     recommendation. It has a stable id, so "is this the one I saw
     last cycle" is answerable, and movement over it is a set
     difference.

   · A SIGNAL is a number: errors from a validator, warnings from
     the boundary check, files under a granted path. It has no
     identity, so movement over it is a comparison of values and
     nothing can be said about WHICH of them moved.

   Reporting a signal as though it were a finding would invent an
   identity; reporting a finding as a count would throw away the one
   property that makes the loop possible. `agent/health/` already
   holds the metric register and the movement over metric readings,
   and this module does not duplicate it: the signals here are the
   small set the loop itself routes on, read from the same
   `agent/implement/checks.mjs` the implementation layer uses.

   AN OBSERVER THAT DID NOT RUN IS NOT AN OBSERVER THAT FOUND
   NOTHING. Every observer reports `ran`, and a failure is captured
   with its error rather than swallowed. `movement.mjs` refuses to
   call anything resolved on the strength of an observer that did
   not run, which is this repository's own rule that unknown is
   never zero, applied where getting it wrong would report progress
   that did not happen.
   ============================================================ */

import { MemoryRecordStore } from '../scout/store.mjs';
import { getContract } from '../schemas/registry.mjs';
import { loadCorpus } from '../integrate/canonical.mjs';
import { DepthAgent } from '../depth/depth.mjs';
import { ProposalRouter } from '../proposals/data/proposals.mjs';
import { KnowledgeArchitect } from '../architect/architect.mjs';
import { readModel } from '../architect/model.mjs';
import { EditorialAgent } from '../proposals/editorial/editorial.mjs';
import { UXAuditor } from '../ux/auditor.mjs';
import { runValidators, runBoundaryCheck } from '../implement/checks.mjs';
import { reach } from './reach.mjs';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The observers, as data.
 *
 * `what_it_cannot_see` is not decoration. A loop that reports "no
 * findings" has said something very different depending on which of
 * these ran, and the register is what a reader checks that against.
 * It is the same discipline `agent/health/` applies to a metric's
 * `limitations`.
 */
export const OBSERVERS = Object.freeze([
  Object.freeze({
    id: 'depth',
    agent: 'data-depth',
    kind: 'findings',
    what_it_reads: 'the canonical corpus in data/, through thirteen detectors',
    what_it_cannot_see: 'anything outside data/. It retrieves no document and answers no gap it finds.',
    doc: 'docs/DATA-DEPTH.md',
  }),
  Object.freeze({
    id: 'data-proposals',
    agent: 'gap-proposal-router',
    kind: 'findings',
    what_it_reads: 'the KnowledgeGap records the depth pass just produced',
    what_it_cannot_see: 'whether a gap SHOULD be closed. It routes; it does not decide, and it names every gap it refuses to route.',
    doc: 'docs/GAP-PROPOSALS.md',
  }),
  Object.freeze({
    id: 'architect',
    agent: 'knowledge-architect',
    kind: 'findings',
    what_it_reads: 'the information model — containers, vocabularies, pages — through eight questions',
    what_it_cannot_see: 'whether a shape it proposes is the right one. It names shapes and drafts none.',
    doc: 'docs/KNOWLEDGE-ARCHITECTURE.md',
  }),
  Object.freeze({
    id: 'editorial',
    agent: 'editorial-agent',
    kind: 'findings',
    what_it_reads: 'the brief\'s real prose blocks, and what the site says that disagrees with itself',
    what_it_cannot_see: 'whether a sentence is true. With no verified change records as input it runs only the half that needs none.',
    doc: 'docs/EDITORIAL-AGENT.md',
  }),
  Object.freeze({
    id: 'ux',
    agent: 'ux-auditor',
    kind: 'findings',
    what_it_reads: 'the markup, the stylesheets and the modules',
    what_it_cannot_see: 'a rendered page. It has never opened one — README limitation 7 — and agent/browser/ is what does.',
    doc: 'docs/UX-AUDIT.md',
  }),
  Object.freeze({
    id: 'validators',
    agent: 'implementation-qa',
    kind: 'signals',
    what_it_reads: 'the four validators, against the baseline recorded in docs/CURRENT-ARCHITECTURE.md §12',
    what_it_cannot_see: 'prose. A false statement in index.html passes every one of them.',
    doc: 'docs/VERIFICATION-POLICY.md',
  }),
  Object.freeze({
    id: 'boundary',
    agent: 'implementation-qa',
    kind: 'signals',
    what_it_reads: 'the public/private boundary over the tracked tree',
    what_it_cannot_see: 'the deployed origin. No URL in this repository has ever been fetched (AUDIT F-12).',
    doc: 'docs/IMPLEMENTATION-QA.md',
  }),
  Object.freeze({
    id: 'reach',
    agent: 'improvement-loop',
    kind: 'signals',
    what_it_reads: 'the grant\'s path and field allowlists against the real tree and the real schema',
    what_it_cannot_see: 'whether a change would be permitted. It reports whether there is anything there to write to at all.',
    doc: 'docs/LIMITED-AUTONOMY.md',
  }),
]);

export const OBSERVER_IDS = Object.freeze(OBSERVERS.map((o) => o.id));

/** The record's own id, by its contract's declared id field. Never
 *  re-derived, never defaulted to something else: a record whose
 *  contract does not declare one is reported as unidentifiable
 *  rather than given an id this module invented. */
export function findingIdOf(record) {
  /* `getContract` throws on a name it does not know, which is right
     for a gateway and wrong here: this module is normalising what an
     observer shipped, and a record of an unknown contract is one it
     cannot identify rather than an error in the loop. */
  let field = null;
  try { field = getContract(record?.contract)?.id_field ?? null; } catch { return null; }
  if (!field) return null;
  const id = record?.[field];
  return typeof id === 'string' && id.length ? id : null;
}

/**
 * One record, flattened to what the loop compares and routes on.
 *
 * Everything here is read off the record. `severity` is whichever
 * field the record's own contract carries and `null` where it
 * carries none — never a default, because a default severity is a
 * priority this module made up.
 */
export function normalise(record, observerId) {
  const paths = pathsOf(record);
  return {
    finding_id: findingIdOf(record),
    observer: observerId,
    contract: record?.contract ?? null,
    kind: record?.gap_kind ?? record?.finding_kind ?? record?.kind ?? record?.operation_kind ?? null,
    severity: record?.severity ?? record?.impact ?? record?.priority ?? null,
    autonomy_class: record?.autonomy_class ?? null,
    substantive: typeof record?.substantive === 'boolean' ? record.substantive : null,
    dataset: record?.dataset ?? null,
    paths,
    blocks: (record?.epistemic?.unresolved ?? []).filter((u) => u?.blocks).length,
    summary: firstSentence(
      record?.summary ?? record?.missing_concept ?? record?.finding ?? record?.recommendation ?? record?.title ?? '',
    ),
  };
}

/** Every repository path a record declares it is about. Read from
 *  the three places the contracts put one; a record naming none
 *  yields an empty list rather than a guess. */
export function pathsOf(record) {
  const out = new Set();
  for (const op of record?.proposed_change?.operations ?? []) {
    const p = String(op?.path ?? op?.file ?? '').trim();
    if (p) out.add(p);
  }
  for (const p of record?.affected_paths ?? []) if (typeof p === 'string' && p) out.add(p);
  const loc = record?.recommended_data_location?.dataset ?? record?.dataset ?? null;
  if (typeof loc === 'string' && loc) out.add(loc);
  for (const e of record?.affected_entities ?? []) if (typeof e?.path === 'string' && e.path) out.add(e.path);
  return [...out].sort();
}

const firstSentence = (s) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  const cut = t.slice(0, 220);
  return cut.length < t.length ? `${cut}…` : cut;
};

/** A shipped-record harvest for one observer, with the failure
 *  captured rather than thrown. One observer failing must not cost
 *  the cycle the other seven. */
async function harvest(observerId, fn) {
  const store = new MemoryRecordStore({ allowSimulated: false });
  const started = Date.now();
  try {
    const result = await fn(store);
    const findings = store.written
      .map((r) => normalise(r, observerId))
      .filter((f) => f.finding_id !== null);
    const unidentifiable = store.written.length - findings.length;
    return {
      observer: observerId, ran: true, error: null, ms: Date.now() - started,
      records: store.written.length, unidentifiable, findings, result,
      /* The records as shipped, kept in memory for this process only.
         The loop's triage reads them because a category is derived
         from a proposal's own body (agent/policy/categories.mjs) and
         cannot be derived from the flattened finding. Nothing writes
         them anywhere: `cycle.mjs --store` is the one path that does,
         and it is opt-in. */
      raw: store.written,
    };
  } catch (e) {
    return {
      observer: observerId, ran: false, error: `${e?.message ?? e}`, ms: Date.now() - started,
      records: 0, unidentifiable: 0, findings: [], result: null, raw: [],
    };
  }
}

/**
 * A signal reading. `value` is null where the observer could not
 * measure — never zero, which would read as "clean".
 *
 * `visibility` uses `agent/health/model.mjs`'s two values and the
 * same classification, because the question is the same one and it
 * already has an owner. It matters here for one reason:
 * `ledger.mjs` writes a GIT-TRACKED file, this repository publishes
 * its whole tree, and a `private` reading in that file would be
 * control-plane data on the public web. The boundary check is
 * `private` for exactly the reason
 * `control_plane.secrets_in_public_assets` is.
 */
const signal = (id, value, unit, why, detail = null, visibility = 'public') =>
  ({ signal_id: id, value, unit, why, detail, visibility });

/**
 * THE OBSERVATION PASS.
 *
 * @param {{tracer:object, asOf:string, only?:string[], corpus?:object,
 *          validators?:boolean, root?:string}} opts
 *   `asOf` is mandatory for the reason it is mandatory on every agent
 *   here: "nothing has changed" and "nobody has looked" are different
 *   findings and only a stated date separates them (AUDIT F-15).
 *   `validators` off skips the four validator subprocesses, which is
 *   the only slow part; the signals they produce then report `null`
 *   with the reason, never zero.
 */
export async function observe({ tracer, asOf, only = null, corpus = undefined, validators = true, root = undefined } = {}) {
  if (!asOf || !ISO_DATE.test(String(asOf))) {
    throw new Error('observe() needs an explicit asOf date (YYYY-MM-DD). "Nothing has changed" and "nobody has looked" are different findings, and only a stated as-of date tells them apart (docs/AUDIT-2026-09-01.md F-15).');
  }
  const wanted = only && only.length ? new Set(only) : null;
  const skipped = [];
  const want = (id) => {
    if (!wanted || wanted.has(id)) return true;
    skipped.push(id);
    return false;
  };

  const theCorpus = corpus ?? loadCorpus();
  const passes = [];
  const signals = [];

  /* ---- depth, and the router that consumes it ---------------- */
  let gaps = [];
  if (want('depth')) {
    const p = await harvest('depth', async (store) => {
      const r = await new DepthAgent({ tracer, store, corpus: theCorpus, asOf }).run();
      gaps = r.gaps ?? [];
      return { reported: r.gaps?.length ?? 0, set_aside: r.suppressed?.length ?? 0 };
    });
    passes.push(p);
  }

  if (want('data-proposals')) {
    /* The router takes the gaps the depth pass produced. Where depth
       did not run, it has no input, and that is reported as not
       having run rather than as having found nothing. */
    const p = gaps.length
      ? await harvest('data-proposals', async (store) => {
        const r = await new ProposalRouter({ tracer, store, gaps, corpus: theCorpus, asOf }).run();
        return { proposals: r.proposals?.length ?? 0, refused: r.refused?.length ?? 0 };
      })
      : {
        observer: 'data-proposals', ran: false, ms: 0, records: 0, unidentifiable: 0, findings: [], result: null, raw: [],
        error: 'the depth pass produced no KnowledgeGap records to route, so this observer had no input. That is not the same fact as having routed nothing.',
      };
    passes.push(p);
  }

  if (want('architect')) {
    passes.push(await harvest('architect', async (store) => {
      const r = await new KnowledgeArchitect({ tracer, store, model: readModel(), corpus: theCorpus, asOf, gaps }).run();
      return { findings: r.findings?.length ?? 0, lenses: r.by_lens?.length ?? 0 };
    }));
  }

  if (want('editorial')) {
    passes.push(await harvest('editorial', async (store) => {
      /* No verified change records are given, so this runs only the
         half that needs none: what the site says that disagrees with
         itself. Handing it mock inputs would be a fixture. */
      const r = await new EditorialAgent({ tracer, store, corpus: theCorpus, asOf, inputs: [] }).run();
      return { recommendations: r.recommendations?.length ?? 0, blocks: r.prose?.blocks?.length ?? r.blocks_read ?? null };
    }));
  }

  if (want('ux')) {
    passes.push(await harvest('ux', async (store) => {
      const r = await new UXAuditor({ tracer, store, asOf }).run();
      return { findings: r.findings?.length ?? 0 };
    }));
  }

  /* ---- the signals ------------------------------------------- */
  if (want('validators')) {
    if (!validators) {
      signals.push(signal('validators.errors', null, 'errors', 'the validators were not run in this pass (--no-validators). Zero would read as clean; this reads as not measured.'));
      signals.push(signal('validators.at_baseline', null, 'boolean', 'the validators were not run in this pass.'));
      /* `not_run` rather than `failed`. A caller who asked for the
         validators to be skipped and a validator that crashed are
         different facts, and a cycle report that showed them alike
         would make one of them invisible. */
      passes.push({ observer: 'validators', ran: false, not_run: true, error: 'not run — this pass was asked to skip the validators (--no-validators). That is a choice, not a failure, and it is not a clean result either.', ms: 0, records: 0, unidentifiable: 0, findings: [], result: null, raw: [] });
    } else {
      /* `runValidators` already compares each check against
         docs/CURRENT-ARCHITECTURE.md §12 and returns the verdict.
         This reads that verdict rather than re-deriving one: the
         baseline has one home, and a second comparison here could
         disagree with the one the implementation layer acts on. */
      const p = await harvest('validators', async () => runValidators({ root, asOf }));
      passes.push(p);
      const comparisons = p.result?.comparisons ?? [];
      const totalErrors = comparisons.length ? comparisons.reduce((n, c) => n + (Number(c.errors) || 0), 0) : null;
      signals.push(signal('validators.errors', totalErrors, 'errors',
        comparisons.length
          ? `summed across ${comparisons.length} validator(s): ${comparisons.map((c) => `${c.name} ${c.errors}`).join(' · ')}.`
          : 'the validators produced no parseable check.',
        comparisons.map((c) => ({ name: c.name, errors: c.errors, warnings: c.warnings, verdict: c.verdict }))));
      signals.push(signal('validators.at_baseline', comparisons.length ? comparisons.every((c) => c.verdict === 'at_baseline') : null, 'boolean',
        comparisons.length
          ? `${comparisons.filter((c) => c.verdict === 'at_baseline').length} of ${comparisons.length} validator(s) at the docs/CURRENT-ARCHITECTURE.md §12 baseline. A "below_baseline" verdict is NOT counted as at baseline: fewer warnings can mean something was fixed or a check stopped firing, and AUDIT F-10 found the second once already.`
          : 'no validator could be compared against a recorded baseline.'));
    }
  }

  if (want('boundary')) {
    const p = await harvest('boundary', async () => runBoundaryCheck({ root }));
    passes.push(p);
    const b = p.result ?? null;
    signals.push(signal('boundary.blocking', b ? (b.errors ?? null) : null, 'blocking findings',
      b ? 'node agent/implement/cli.mjs boundary, over the tracked tree.' : 'the boundary check did not run.',
      null, 'private'));
    signals.push(signal('boundary.warnings', b ? (b.warnings ?? null) : null, 'warnings',
      b ? 'the same run. A warning here is a standing finding, not noise.' : 'the boundary check did not run.',
      null, 'private'));
  }

  if (want('reach')) {
    const p = await harvest('reach', async () => reach({ root }));
    passes.push(p);
    const r = p.result ?? null;
    signals.push(signal('reach.absent_granted_fields', r ? r.absent_fields.length : null, 'fields',
      r ? 'fields a governance grant names that no record in the dataset carries.' : 'the reach report did not run.',
      r ? r.absent_fields.map((f) => `${f.dataset}.${f.field}`) : null));
    signals.push(signal('reach.categories_without_surface', r ? r.categories_without_surface.length : null, 'categories',
      r ? 'enabled categories with nothing in this tree to write to.' : 'the reach report did not run.',
      r ? r.categories_without_surface.map((c) => c.category) : null));
  }

  const findings = passes.flatMap((p) => p.findings);
  const ranIds = passes.filter((p) => p.ran).map((p) => p.observer);

  return {
    as_of: String(asOf).slice(0, 10),
    observers_run: ranIds,
    observers_failed: passes.filter((p) => !p.ran).map((p) => ({ observer: p.observer, why: p.error })),
    observers_skipped: skipped,
    passes,
    findings,
    /* The shipped records themselves, in memory. `cycle.mjs` reads
       them to derive a category, and `--store` is the only thing
       that ever writes them anywhere. */
    records: passes.flatMap((p) => p.raw ?? []),
    signals,
    coverage: coverageOf(passes, skipped),
  };
}

/**
 * What this pass could and could not see, stated rather than
 * implied. A cycle report that does not carry this is a count
 * somebody will read as complete.
 */
export function coverageOf(passes, skipped = []) {
  return OBSERVERS.map((o) => {
    const p = passes.find((x) => x.observer === o.id) ?? null;
    const state = !p
      ? (skipped.includes(o.id) ? 'skipped' : 'not_selected')
      : (p.ran ? 'ran' : (p.not_run ? 'not_run' : 'failed'));
    return {
      observer: o.id,
      agent: o.agent,
      kind: o.kind,
      state,
      why: !p ? 'not part of this pass.' : (p.ran ? null : p.error),
      /* A signal observer produces no identified findings, and its
         count is null rather than 0 — `null` is "this observer does
         not answer that question", and 0 would read as "it looked
         and found none". §0.3, in a status line. */
      findings: o.kind === 'signals' ? null : (p?.findings.length ?? null),
      what_it_cannot_see: o.what_it_cannot_see,
    };
  });
}
