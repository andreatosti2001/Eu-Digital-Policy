#!/usr/bin/env node
/* ============================================================
   agent/observability/demo/workflow.mjs
   A FAKE Scout → Verifier → Change Detector run.

   Nothing here touches a real legal source, and nothing here
   asserts a legal fact. Every source is `demo-src-*` at
   example.invalid, every provenance and artifact record carries
   `simulated: true`, the proposed change names a file that does
   not exist in this site, and the viewer prints a SIMULATED banner
   for any trace containing such a record. The point of the
   demonstrator is to exercise the observability layer, and a
   demonstrator whose output could be mistaken for research would
   be a worse defect than no demonstrator.

       node agent/observability/demo/workflow.mjs
       node agent/observability/demo/workflow.mjs --live     # with delays,
                                                             # so the viewer
                                                             # shows it running
       node agent/observability/demo/workflow.mjs --stall    # leave the last
                                                             # agent open
       node agent/observability/demo/workflow.mjs --deterministic

   What it exercises, deliberately:
     · the full tree: orchestrator → agent → tool → observation →
       decision → artifact → handoff
     · a FAILING nested agent that the orchestrator survives
     · a tool call that fails and is retried
     · token / cost / latency on the model calls
     · a credential passed in an input, so redaction is visible
     · a human approval, requested and then granted
     · a website_change, and the audit chain behind it
   ============================================================ */

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Tracer } from '../tracer.mjs';
import { JsonlSink, DEFAULT_RUN_DIR } from '../sink.mjs';
import { deterministicIds, deterministicClock, randomIds, systemClock } from '../ids.mjs';

const argv = new Set(process.argv.slice(2));
const LIVE = argv.has('--live');
const STALL = argv.has('--stall');
const DET = argv.has('--deterministic');

const sleep = (ms) => new Promise((r) => setTimeout(r, LIVE ? ms : 0));

/* ---------------------------------------------------------- fixtures */

const CANDIDATES = [
  {
    id: 'demo-cand-1',
    headline: 'SIMULATED: consultation opened on an implementing act',
    instrument_ref: 'demo-instrument-x',
    source: { source_id: 'demo-src-oj-1', role: 'official', url: 'https://example.invalid/oj/demo-1', title: 'SIMULATED Official Journal notice (fixture)', publisher: 'SIMULATED publisher' },
    strength: 0.86,
  },
  {
    id: 'demo-cand-2',
    headline: 'SIMULATED: national transposition measure notified',
    instrument_ref: 'demo-instrument-y',
    source: { source_id: 'demo-src-ms-2', role: 'official', url: 'https://example.invalid/ms/demo-2', title: 'SIMULATED notification (fixture)', publisher: 'SIMULATED publisher' },
    strength: 0.74,
  },
  {
    id: 'demo-cand-3',
    headline: 'SIMULATED: press report of a forthcoming proposal',
    instrument_ref: 'demo-instrument-z',
    source: { source_id: 'demo-src-press-3', role: 'secondary', url: 'https://example.invalid/press/demo-3', title: 'SIMULATED press item (fixture)', publisher: 'SIMULATED outlet' },
    strength: 0.31,
  },
];

const sha = (s) => createHash('sha256').update(s).digest('hex');

/* ---------------------------------------------------------- run */

export async function runDemo({ sink, ids, clock, runDir = DEFAULT_RUN_DIR } = {}) {
  const tracer = new Tracer({
    service: 'eu-digital-policy',
    env: 'local-demo',
    sink: sink ?? new JsonlSink(),
    ids: ids ?? (DET ? deterministicIds(7) : randomIds),
    clock: clock ?? (DET ? deterministicClock('2026-09-01T09:00:00.000Z', 180) : systemClock),
    attributes: { demo: true, simulated: true },
  });

  const orch = tracer.startRun({
    kind: 'orchestrator',
    agent: 'orchestrator',
    task: 'SIMULATED regulatory-change watch: scout → verify → detect change',
    inputs: {
      window: '2026-08-25/2026-09-01',
      watchlist: ['demo-instrument-x', 'demo-instrument-y', 'demo-instrument-z'],
      /* deliberately present, deliberately never stored: see redact.mjs */
      api_key: 'sk-ant-demo-DO-NOT-STORE-0123456789',
      callback: 'https://user:hunter2@example.invalid/hook?token=abcdefghijklmnop',
    },
  });

  const artifactDir = join(runDir, `${orch.trace_id}.artifacts`);
  const writeArtifact = (name, obj) => {
    const body = JSON.stringify(obj, null, 2);
    mkdirSync(artifactDir, { recursive: true });
    const p = join(artifactDir, name);
    writeFileSync(p, body, 'utf8');
    /* recorded relative to the run directory: an absolute path in a
       stored record is a path that stops being true the moment the
       store is copied anywhere */
    return { path: `${orch.trace_id}.artifacts/${name}`, sha256: sha(body), bytes: Buffer.byteLength(body), preview: body.slice(0, 600) };
  };

  orch.observe({
    summary: 'Watch window opened over 3 simulated instruments',
    subject: 'window',
    data: { window: '2026-08-25/2026-09-01', instruments: 3 },
    confidence: 1, risk: 'none', simulated: true,
  });

  /* ---------------------------------------------------- SCOUT */

  const scout = orch.startAgent({
    agent: 'scout',
    task: 'Find candidate regulatory developments in the window',
    inputs: { window: '2026-08-25/2026-09-01', sources: ['demo-oj', 'demo-ms-register', 'demo-press'] },
  });
  await sleep(400);

  const search = scout.startTool({ name: 'demo.search', inputs: { query: 'SIMULATED corpus query', limit: 25 } });
  await sleep(300);
  search.end({ status: 'ok', outputs: { hits: CANDIDATES.length }, usage: { latency_ms: 312 } });

  for (const c of CANDIDATES) {
    const fetch = scout.startTool({ name: 'demo.fetch', inputs: { url: c.source.url } });
    await sleep(120);
    fetch.end({ status: 'ok', outputs: { bytes: 2048, content_sha256: sha(c.id) } });

    scout.provenance({
      source_id: c.source.source_id,
      role: c.source.role,
      url: c.source.url,
      title: c.source.title,
      publisher: c.source.publisher,
      content_sha256: sha(c.id),
      instrument_ids: [c.instrument_ref],
      simulated: true,
    });
    scout.observe({
      summary: c.headline,
      subject: c.instrument_ref,
      data: { candidate_id: c.id, signal_strength: c.strength },
      confidence: c.strength,
      risk: c.strength > 0.7 ? 'low' : 'medium',
      refs: [c.source.source_id],
      simulated: true,
    });
  }

  /* A nested agent that fails. The orchestrator survives it, the
     run is still usable, and the failure is visible rather than
     swallowed — which is the behaviour the layer has to make
     ordinary. */
  const poller = scout.startAgent({ agent: 'scout.poller', task: 'Poll the simulated register feed', inputs: { feed: 'https://example.invalid/feed' } });
  await sleep(150);
  try {
    throw Object.assign(new Error('SIMULATED: register feed unreachable (ECONNREFUSED)'), { name: 'FeedUnavailable' });
  } catch (err) {
    poller.error(err, { fatal: true, code: 'ECONNREFUSED' });
    poller.end({ status: 'failed', outputs: { partial: true } });
    scout.observe({
      summary: 'Register feed unavailable; proceeding on the two reachable sources',
      subject: 'coverage',
      data: { degraded: true, missing_source: 'demo-register-feed' },
      confidence: 1, risk: 'medium', simulated: true,
    });
  }

  const rank = scout.startLlm({ name: 'rank-candidates', model: 'simulated-model', inputs: { candidates: CANDIDATES.map((c) => c.id) } });
  await sleep(200);
  rank.usage({ model: 'simulated-model', provider: 'simulated', input_tokens: 1840, output_tokens: 260, cost_usd: 0.0042, latency_ms: 1980 });
  rank.end({ status: 'ok', outputs: { ranked: ['demo-cand-1', 'demo-cand-2', 'demo-cand-3'] } });

  const promoted = CANDIDATES.filter((c) => c.strength >= 0.5);
  const dec1 = scout.decide({
    decision: `Promote ${promoted.length} of ${CANDIDATES.length} candidates to verification`,
    rationale: 'The two promoted candidates rest on simulated official sources; the third rests on a simulated press item alone, which under this project\'s grading is secondary-only and cannot carry a status change on its own.',
    alternatives: [
      { option: 'Promote all three', rejected_because: 'a secondary-only signal would enter the pipeline with no primary or official corroboration' },
      { option: 'Promote none pending the unreachable feed', rejected_because: 'the two reachable sources are sufficient to verify independently' },
    ],
    confidence: 0.82,
    risk: 'low',
    inputs_ref: CANDIDATES.map((c) => c.source.source_id),
  });

  const candidateFile = writeArtifact('candidates.json', { simulated: true, generated_by: 'demo scout', candidates: promoted });
  scout.artifact({
    artifact_id: 'demo-art-candidates',
    artifact_type: 'candidate-set',
    ...candidateFile,
    derived_from: promoted.map((c) => c.source.source_id),
    simulated: true,
  });
  scout.handoff({
    to_agent: 'verifier',
    reason: 'Candidates need source-level verification before any change is proposed',
    artifact_ids: ['demo-art-candidates'],
    payload: { candidates: promoted.map((c) => c.id) },
  });
  scout.end({ status: 'ok', outputs: { promoted: promoted.map((c) => c.id), rejected: ['demo-cand-3'] }, confidence: 0.82, risk: 'low' });

  /* ---------------------------------------------------- VERIFIER */

  const verifier = orch.startAgent({
    agent: 'verifier',
    task: 'Verify each promoted candidate against its cited source',
    inputs: { artifact: 'demo-art-candidates', candidates: promoted.map((c) => c.id) },
  });
  await sleep(350);

  const confirmed = [];
  for (const c of promoted) {
    /* first attempt fails, second succeeds: a retry that is
       invisible is a latency mystery six months later */
    const attempt1 = verifier.startTool({ name: 'demo.resolve', inputs: { source_id: c.source.source_id, attempt: 1 } });
    await sleep(100);
    if (c.id === 'demo-cand-2') {
      attempt1.error(new Error('SIMULATED: resolver timed out after 5000ms'), { code: 'ETIMEDOUT' });
      attempt1.end({ status: 'failed' });
      const attempt2 = verifier.startTool({ name: 'demo.resolve', inputs: { source_id: c.source.source_id, attempt: 2 } });
      await sleep(120);
      attempt2.end({ status: 'ok', outputs: { resolved: true, retried: true } });
    } else {
      attempt1.end({ status: 'ok', outputs: { resolved: true } });
    }

    const agrees = c.id === 'demo-cand-1';
    verifier.provenance({
      source_id: c.source.source_id,
      role: c.source.role,
      url: c.source.url,
      title: c.source.title,
      publisher: c.source.publisher,
      locator: 'SIMULATED locator, no real provision cited',
      content_sha256: sha(c.id),
      quote: null,
      verification: {
        method: 'simulated hash comparison against the scouted retrieval',
        verdict: agrees ? 'supports' : 'insufficient',
        checked_by: 'verifier',
        note: agrees
          ? 'Simulated source resolves and matches the scouted retrieval.'
          : 'Simulated source resolves but does not state the change the candidate asserts.',
      },
      instrument_ids: [c.instrument_ref],
      simulated: true,
    });
    verifier.observe({
      summary: agrees ? `Candidate ${c.id} is corroborated by its cited source` : `Candidate ${c.id} is NOT corroborated by its cited source`,
      subject: c.id,
      data: { verdict: agrees ? 'supports' : 'insufficient' },
      confidence: agrees ? 0.91 : 0.88,
      risk: agrees ? 'low' : 'high',
      refs: [c.source.source_id],
      simulated: true,
    });
    if (agrees) confirmed.push(c);
  }

  const dec2 = verifier.decide({
    decision: `Confirm ${confirmed.length} candidate; reject 1 as unsupported`,
    rationale: 'One simulated source states the development it is cited for; the other resolves but does not support the assertion, and an unsupported assertion is not promoted to a proposed change under this project\'s evidence rules.',
    alternatives: [
      { option: 'Confirm both and mark the weaker one provisional', rejected_because: 'provisional is a status for a real but unsettled development, not for an unsupported one' },
    ],
    confidence: 0.9,
    risk: 'medium',
    inputs_ref: promoted.map((c) => c.source.source_id),
  });

  verifier.approval({
    approval_id: 'demo-appr-1',
    state: 'requested',
    subject: 'Allow a proposed change to be drafted from the confirmed candidate',
    requested_of: 'maintainer',
    risk: 'medium',
    artifact_ids: ['demo-art-candidates'],
    note: 'A confirmed candidate may be drafted into a proposed change; it may not be published without a second approval.',
  });
  await sleep(300);
  verifier.approval({
    approval_id: 'demo-appr-1',
    state: 'granted',
    actor: 'maintainer (SIMULATED)',
    note: 'Simulated approval recorded by the demonstrator.',
  });

  verifier.handoff({
    to_agent: 'change-detector',
    reason: 'One verified candidate is eligible to be drafted as a change',
    artifact_ids: ['demo-art-candidates'],
    payload: { confirmed: confirmed.map((c) => c.id) },
  });
  verifier.end({ status: 'ok', outputs: { confirmed: confirmed.map((c) => c.id), rejected: ['demo-cand-2'] }, confidence: 0.9, risk: 'medium' });

  /* ---------------------------------------------------- CHANGE DETECTOR */

  const detector = orch.startAgent({
    agent: 'change-detector',
    task: 'Compute what would have to change on the site, and propose it',
    inputs: { confirmed: confirmed.map((c) => c.id) },
  });
  await sleep(300);

  if (STALL) {
    detector.observe({
      summary: 'Stalled deliberately (--stall): this run stays open so the viewer shows a running agent',
      subject: 'demo', data: { stalled: true }, confidence: 1, risk: 'none', simulated: true,
    });
    console.log(`trace ${orch.trace_id} left running (--stall)`);
    return { trace_id: orch.trace_id, stalled: true };
  }

  const diff = detector.startTool({ name: 'demo.diff', inputs: { against: 'data/__demo__/simulated-instruments.json' } });
  await sleep(150);
  diff.end({ status: 'ok', outputs: { added: 1, changed: 0, removed: 0 } });

  detector.observe({
    summary: 'One simulated timeline event would be added; no existing record would be altered',
    subject: 'data/__demo__/simulated-change.json',
    data: { added: 1, changed: 0, removed: 0 },
    confidence: 0.87, risk: 'low', simulated: true,
  });

  const dec3 = detector.decide({
    decision: 'Propose an additive change; do not modify any existing record',
    rationale: 'An addition can be reviewed against its own source. Editing an existing record would put two facts in play at once, and this project keeps one home per fact.',
    alternatives: [
      { option: 'Amend the existing simulated record in place', rejected_because: 'it would mix a new claim with a settled one in a single reviewable unit' },
    ],
    confidence: 0.87, risk: 'low',
    inputs_ref: [confirmed[0]?.source.source_id].filter(Boolean),
  });

  const patchFile = writeArtifact('proposed-change.json', {
    simulated: true,
    note: 'This patch targets a file that does not exist in this site. It is a fixture.',
    target: 'data/__demo__/simulated-change.json',
    operation: 'add',
    record: { id: 'demo-evt-1', instrument: confirmed[0]?.instrument_ref ?? 'demo-instrument-x', source: confirmed[0]?.source.source_id ?? 'demo-src-oj-1' },
  });
  detector.artifact({
    artifact_id: 'demo-art-patch',
    artifact_type: 'proposed-change',
    ...patchFile,
    derived_from: ['demo-art-candidates', confirmed[0]?.source.source_id].filter(Boolean),
    simulated: true,
  });

  detector.websiteChange({
    change_id: 'demo-chg-1',
    files: ['data/__demo__/simulated-change.json'],
    summary: 'SIMULATED: add one timeline event derived from one verified simulated source',
    status: 'proposed',
    decision_ids: [dec1.decision_id, dec2.decision_id, dec3.decision_id],
    artifact_ids: ['demo-art-candidates', 'demo-art-patch'],
    provenance_ids: [confirmed[0]?.source.source_id].filter(Boolean),
    approval_ids: ['demo-appr-1'],
  });

  detector.approval({
    approval_id: 'demo-appr-2',
    state: 'requested',
    subject: 'Publish the proposed change to the site',
    requested_of: 'maintainer',
    risk: 'high',
    artifact_ids: ['demo-art-patch'],
    note: 'Left PENDING on purpose: a proposed change that no human has approved must read as unapproved in the viewer.',
  });
  detector.end({ status: 'ok', outputs: { change_id: 'demo-chg-1', files: 1 }, confidence: 0.87, risk: 'low' });

  /* ---------------------------------------------------- close the loop */

  /* The orchestrator, not a fourth agent, records where the change
     ended up. Both entries are simulated and say so; what is being
     demonstrated is that the chain closes:
     source → verification → decision → implementation → deployment. */
  orch.websiteChange({
    change_id: 'demo-chg-1',
    files: ['data/__demo__/simulated-change.json'],
    summary: 'SIMULATED deployment record, closing the audit chain for demo-chg-1',
    status: 'deployed',
    decision_ids: [dec1.decision_id, dec2.decision_id, dec3.decision_id],
    artifact_ids: ['demo-art-candidates', 'demo-art-patch'],
    provenance_ids: [confirmed[0]?.source.source_id].filter(Boolean),
    approval_ids: ['demo-appr-1'],
    commit: { sha: '0'.repeat(40), message: 'SIMULATED commit — no such commit exists', simulated: true },
    deployment: { target: 'github-pages', url: 'https://example.invalid/deployment/demo', at: new Date().toISOString(), simulated: true },
  });

  orch.end({
    status: 'ok',
    outputs: { candidates: CANDIDATES.length, promoted: promoted.length, confirmed: confirmed.length, proposed_changes: 1, degraded: ['scout.poller'] },
    confidence: 0.85,
    risk: 'low',
  });

  return { trace_id: orch.trace_id };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { trace_id } = await runDemo();
  console.log(`\nSIMULATED demo trace written: ${trace_id}`);
  console.log(`  node agent/observability/cli.mjs show ${trace_id}`);
  console.log(`  node agent/observability/cli.mjs serve      → http://localhost:7801\n`);
}
