/* ============================================================
   agent/observability/tracer.mjs — the API an agent uses

   The whole surface an agent needs:

     const tracer = new Tracer({ service:'…' });
     const run = tracer.startRun({ agent:'orchestrator', task:'…' });
     const scout = run.startAgent({ agent:'scout', task:'…' });
     const call = scout.startTool({ name:'eurlex.search', inputs:{…} });
     call.end({ status:'ok', outputs, usage:{…} });
     scout.observe({ summary:'…', data:{…}, confidence:.8, risk:'low' });
     scout.provenance({ source_id:'…', role:'official', url:'…' });
     scout.decide({ decision:'…', rationale:'…', alternatives:[…] });
     scout.artifact({ artifact_id:'…', artifact_type:'candidate-set' });
     scout.handoff({ to_agent:'verifier', artifact_ids:[…] });
     scout.end({ status:'ok', outputs, confidence:.8, risk:'low' });

   Three properties this deliberately keeps:

   NOTHING IS OPTIONALLY TRACED. `run.step()` wraps a function so a
   thrown error becomes an `error` record and a `failed` span
   without the caller remembering to catch it. An agent that forgets
   to close a span leaves it `running`, which reads as what it is.

   EVERY FIELD IS REDACTED ON THE WAY IN (see redact.mjs).

   THE TRACE ID SURVIVES. It is the same on the orchestrator, on the
   provenance record five levels down and on the website_change at
   the end, which is what makes requirement 7 — source → verification
   → decision → implementation → deployment — answerable by a query
   rather than by memory.
   ============================================================ */

import { randomIds, systemClock, isoOf } from './ids.mjs';
import { redact } from './redact.mjs';
import { JsonlSink } from './sink.mjs';
import { SCHEMA_VERSION } from './schema.mjs';

export class Tracer {
  /**
   * @param {{service?:string, sink?:object, ids?:object, clock?:object,
   *          env?:string, attributes?:object}} opts
   */
  constructor({ service = 'eu-digital-policy', sink, ids = randomIds, clock = systemClock, env = 'local', attributes = {} } = {}) {
    this.service = service;
    this.sink = sink ?? new JsonlSink();
    this.ids = ids;
    this.clock = clock;
    this.env = env;
    this.attributes = attributes;
    /* Monotonic within a tracer, so two records written in the same
       millisecond still read in the order they happened. Per-tracer
       rather than per-process: a global counter makes two runs of
       the same workflow differ for no reason a reader cares about. */
    this.seq = 0;
  }

  /** Opens a new trace and its root run. */
  startRun(opts = {}) {
    const traceId = opts.trace_id ?? this.ids.traceId();
    return new Span(this, {
      trace_id: traceId,
      parent_span_id: null,
      parent_run_id: opts.parent_run_id ?? null,
      kind: opts.kind ?? 'orchestrator',
      ...opts,
    });
  }

  /** Re-enters an existing trace — a second process, a resumed run. */
  continueRun({ trace_id, parent_span_id = null, parent_run_id = null, ...opts }) {
    return new Span(this, { trace_id, parent_span_id, parent_run_id, kind: opts.kind ?? 'agent', ...opts });
  }

  emit(record) { return this.sink.write({ ...record, seq: this.seq++ }); }
}

export class Span {
  constructor(tracer, opts) {
    const t = tracer.clock.now();
    this.tracer = tracer;
    this.trace_id = opts.trace_id;
    this.span_id = opts.span_id ?? tracer.ids.spanId();
    this.parent_span_id = opts.parent_span_id ?? null;
    this.kind = opts.kind ?? 'agent';
    this.isRun = this.kind === 'orchestrator' || this.kind === 'agent';
    /* A run IS a span: run_id is this span's id when the span is a
       run, and the enclosing run's id otherwise. */
    this.run_id = this.isRun ? this.span_id : (opts.run_id ?? null);
    this.parent_run_id = opts.parent_run_id ?? null;
    this.agent = opts.agent ?? null;
    this.task = opts.task ?? null;
    this.name = opts.name ?? opts.task ?? opts.agent ?? this.kind;
    this.start_time = isoOf(t);
    this.ended = false;
    this.children = 0;
    this.counts = { observation: 0, decision: 0, artifact: 0, handoff: 0, approval: 0, provenance: 0, error: 0, tool: 0 };

    const { value: inputs, redactions } = redact(opts.inputs ?? null);
    this.tracer.emit({
      v: SCHEMA_VERSION,
      type: 'span.start',
      ts: this.start_time,
      trace_id: this.trace_id,
      span_id: this.span_id,
      parent_span_id: this.parent_span_id,
      run_id: this.run_id,
      parent_run_id: this.parent_run_id,
      kind: this.kind,
      name: this.name,
      agent: this.agent,
      task: this.task,
      service: tracer.service,
      env: tracer.env,
      start_time: this.start_time,
      status: 'running',
      inputs,
      attributes: redact({ ...tracer.attributes, ...(opts.attributes ?? {}) }).value,
      model: opts.model ?? null,
      redactions,
    });
  }

  /* ------------------------------------------------ child spans */

  child(opts) {
    this.children++;
    /* this.run_id is this span's own id when it is a run and the
       enclosing run's id when it is not, so both lines below are
       correct for a tool nested under a tool as well. A tool span
       inherits the agent that called it: an unattributed tool call
       is a tool call nobody owns. */
    return new Span(this.tracer, {
      trace_id: this.trace_id,
      parent_span_id: this.span_id,
      run_id: this.run_id,
      parent_run_id: this.run_id,
      agent: this.agent,
      ...opts,
    });
  }

  startAgent(opts) { return this.child({ kind: 'agent', ...opts }); }
  startTool(opts) { this.counts.tool++; return this.child({ kind: 'tool', name: opts.name, ...opts }); }
  startLlm(opts) { return this.child({ kind: 'llm', name: opts.name ?? opts.model, ...opts }); }
  startRetriever(opts) { return this.child({ kind: 'retriever', ...opts }); }

  /**
   * Run `fn` inside a child span, closing it either way. The point
   * of the wrapper is that a failure is recorded by the layer, not
   * by whoever remembered to write a try/catch.
   */
  async step(opts, fn) {
    const span = this.child({ kind: opts.kind ?? 'tool', ...opts });
    try {
      const out = await fn(span);
      if (!span.ended) span.end({ status: 'ok', outputs: opts.captureOutput === false ? null : out });
      return out;
    } catch (err) {
      span.error(err, { fatal: true });
      if (!span.ended) span.end({ status: 'failed' });
      throw err;
    }
  }

  /* ------------------------------------------------ events */

  #event(type, body) {
    const { value, redactions } = redact(body);
    if (this.counts[type] !== undefined) this.counts[type]++;
    return this.tracer.emit({
      v: SCHEMA_VERSION,
      type,
      ts: isoOf(this.tracer.clock.now()),
      trace_id: this.trace_id,
      span_id: this.span_id,
      parent_span_id: this.parent_span_id,
      run_id: this.run_id,
      agent: this.agent,
      redactions,
      ...value,
    });
  }

  /**
   * A structured claim about the world. `summary` is mandatory,
   * everything else is what makes it queryable later.
   */
  observe({ summary, subject = null, data = null, confidence = null, risk = null, refs = [], simulated = false }) {
    return this.#event('observation', { summary, subject, data, confidence, risk, refs, simulated });
  }

  /** A choice, with what was not chosen. An unrecorded alternative
   *  is how a decision becomes indistinguishable from an accident. */
  decide({ decision, rationale, alternatives = [], confidence = null, risk = null, inputs_ref = [], decision_id = null }) {
    return this.#event('decision', {
      decision_id: decision_id ?? `dec-${this.span_id}-${this.counts.decision + 1}`,
      decision, rationale, alternatives, confidence, risk, inputs_ref,
    });
  }

  artifact({ artifact_id, artifact_type, path = null, sha256 = null, bytes = null, preview = null, derived_from = [], simulated = false }) {
    return this.#event('artifact', { artifact_id, artifact_type, path, sha256, bytes, preview, derived_from, simulated });
  }

  /** The edge between two agents. `to_agent` may not have started
   *  yet — an open handoff is a queue entry, and the viewer shows it. */
  handoff({ to_agent, from_agent = this.agent, reason = null, artifact_ids = [], payload = null, handoff_id = null }) {
    return this.#event('handoff', {
      handoff_id: handoff_id ?? `ho-${this.span_id}-${this.counts.handoff + 1}`,
      from_agent, to_agent, reason, artifact_ids, payload,
    });
  }

  /** Human in the loop. `requested` with nothing after it is pending. */
  approval({ approval_id, state, subject = null, requested_of = null, actor = null, note = null, artifact_ids = [], risk = null }) {
    return this.#event('approval', { approval_id, state, subject, requested_of, actor, note, artifact_ids, risk });
  }

  /**
   * Where a legal statement came from and what was done to check it.
   * `simulated` marks a fixture so a demonstration can never be
   * mistaken for research: nothing in this repository may fabricate
   * a legal source, and a record that says so in its own body is
   * harder to launder than a convention in a README.
   */
  provenance({ source_id, role, url = null, title = null, publisher = null, locator = null,
               retrieved_at = null, content_sha256 = null, quote = null, verification = null,
               claim_ids = [], instrument_ids = [], simulated = false }) {
    return this.#event('provenance', {
      source_id, role, url, title, publisher, locator,
      retrieved_at: retrieved_at ?? isoOf(this.tracer.clock.now()),
      content_sha256, quote, verification, claim_ids, instrument_ids, simulated,
    });
  }

  /** Token, cost and latency, when the caller knows them. */
  usage({ model = null, input_tokens = null, output_tokens = null, total_tokens = null,
          cost_usd = null, latency_ms = null, provider = null }) {
    return this.#event('usage', {
      model, provider, input_tokens, output_tokens,
      total_tokens: total_tokens ?? ((input_tokens ?? 0) + (output_tokens ?? 0) || null),
      cost_usd, latency_ms,
    });
  }

  error(err, { fatal = false, code = null } = {}) {
    const e = err instanceof Error ? err : new Error(String(err));
    return this.#event('error', { message: e.message, error_type: e.name, code, stack: e.stack ?? null, fatal });
  }

  /**
   * The link that makes a deployed change auditable: which files
   * changed, under which decision, on the strength of which
   * provenance, and where it went.
   */
  websiteChange({ files, change_id = null, summary = null, decision_ids = [], artifact_ids = [],
                  provenance_ids = [], approval_ids = [], commit = null, deployment = null, status = 'proposed' }) {
    return this.#event('website_change', {
      change_id: change_id ?? `chg-${this.trace_id.slice(0, 8)}`,
      files, summary, decision_ids, artifact_ids, provenance_ids, approval_ids, commit, deployment, status,
    });
  }

  /* ------------------------------------------------ closing */

  end({ status = 'ok', outputs = null, confidence = null, risk = null, usage = null, error = null } = {}) {
    if (this.ended) return;
    this.ended = true;
    const t = this.tracer.clock.now();
    const end_time = isoOf(t);
    const { value: out, redactions } = redact(outputs);
    this.tracer.emit({
      v: SCHEMA_VERSION,
      type: 'span.end',
      ts: end_time,
      trace_id: this.trace_id,
      span_id: this.span_id,
      parent_span_id: this.parent_span_id,
      run_id: this.run_id,
      parent_run_id: this.parent_run_id,
      kind: this.kind,
      name: this.name,
      agent: this.agent,
      task: this.task,
      status,
      start_time: this.start_time,
      end_time,
      latency_ms: Date.parse(end_time) - Date.parse(this.start_time),
      outputs: out,
      confidence,
      risk,
      usage: usage ? redact(usage).value : null,
      error: error ? redact(error).value : null,
      counts: { ...this.counts },
      redactions,
    });
  }
}
