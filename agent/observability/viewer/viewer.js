/* ============================================================
   agent/observability/viewer/viewer.js

   Reads the JSON API in server.mjs and renders it. No framework,
   no build, no third-party request — the same rules the site
   itself keeps.

   Two behaviours worth naming, because both are the point rather
   than a detail:

   · A PENDING APPROVAL AND AN OPEN HANDOFF ARE RAILS, NOT TABS.
     They stay on screen whichever trace you are reading, because
     the state that matters most is the one nobody has looked at.

   · A SIMULATED TRACE SAYS SO ACROSS THE TOP. Fixture data that
     renders identically to real research is the one failure this
     interface must not have.

   If the API is not there — the file opened directly, or the
   directory served statically by GitHub Pages — the page says so
   in plain words instead of failing silently.
   ============================================================ */

const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;
    else n.setAttribute(k, v === true ? '' : String(v));
  }
  for (const k of kids.flat()) if (k) n.append(k.nodeType ? k : document.createTextNode(String(k)));
  return n;
};

const state = { runs: [], summary: null, trace: null, selected: null, tab: 'tree', filter: '', timer: null };

const fmtMs = (ms) => (ms == null ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`);
const fmtTime = (iso) => (iso ? new Date(iso).toISOString().replace('T', ' ').replace('.000Z', 'Z').slice(0, 23) : '—');
const short = (id) => (id ? String(id).slice(0, 8) : '—');
const badge = (s) => el('span', { class: 'badge', 'data-s': s, text: s });
const riskBadge = (r) => (r && r !== 'none' ? el('span', { class: 'badge', 'data-r': r, text: `risk ${r}` }) : null);
const confBadge = (c) => (c == null ? null : el('span', { class: 'badge', text: `conf ${Number(c).toFixed(2)}` }));

async function api(path) {
  const res = await fetch(path, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

function banner(kind, text) {
  const b = $('#banner');
  if (!text) { b.hidden = true; return; }
  b.hidden = false;
  b.dataset.kind = kind;
  b.textContent = text;
}

/* ---------------------------------------------------------- store level */

function renderTiles(s) {
  const tiles = [
    ['running', s.running, 'run'],
    ['completed', s.completed, 'ok'],
    ['degraded', s.degraded ?? 0, 'warn'],
    ['failed', s.failed, 'bad'],
    ['open handoffs', s.open_handoffs.length, s.open_handoffs.length ? 'warn' : null],
    ['pending approvals', s.pending_approvals.length, s.pending_approvals.length ? 'warn' : null],
    ['website changes', s.website_changes.length, null],
    ['impact maps', (s.impact ?? []).length, null],
    /* Reported gaps carry a warn where any of them could mislead a
       reader: that is the top of the depth impact ladder and it is
       AI-SAFE-BOUNDARIES §0.5 — absence read as a negative finding. */
    ['depth gaps', (s.depth ?? []).reduce((n, d) => n + (d.reported ?? 0), 0), (s.depth ?? []).some((d) => (d.by_impact?.reader_could_be_misled ?? 0) > 0) ? 'warn' : null],
    ['editorial impacts', (s.editorial_impacts ?? []).length, (s.editorial_impacts ?? []).length ? 'warn' : null],
    /* The refusal count, not the proposal count. Most gaps cannot
       become a proposal here, and a tile that showed only what was
       authored would report the work as more complete than it is. */
    ['gaps not proposable', (s.proposals ?? []).reduce((n, x) => n + (x.refused ?? 0), 0), (s.proposals ?? []).some((x) => (x.refused ?? 0) > 0) ? 'warn' : null],
    /* The questions the MODEL HANDLES, not the ones it fails. A
       tile counting only the defects would report the information
       model as nothing but them, and "the model can represent this"
       is the result a reader most needs to be able to see. */
    ['model questions handled', (s.architecture ?? []).reduce((n, x) => n + (x.answered_no ?? []).length, 0), null],
    ['model shapes proposed', (s.architecture ?? []).reduce((n, x) => n + (x.proposed ?? 0), 0), (s.architecture ?? []).some((x) => (x.proposed ?? 0) > 0) ? 'warn' : null],
  ];
  $('#tiles').replaceChildren(...tiles.map(([label, n, tone]) =>
    el('div', { class: 'tile', 'data-tone': tone }, el('b', { text: String(n) }), el('span', { text: label }))));
}

function renderRail() {
  const runs = state.filter ? state.runs.filter((r) => r.status === state.filter) : state.runs;
  $('#railCount').textContent = `${runs.length} trace${runs.length === 1 ? '' : 's'}`;
  $('#runList').replaceChildren(...runs.map((r) => el('li', {},
    el('button', { type: 'button', 'aria-current': String(r.trace_id === state.selected) },
      el('div', { class: 'id' }, badge(r.status), ' ', short(r.trace_id), r.simulated ? ' · simulated' : ''),
      el('span', { class: 'task', text: r.task ?? r.agent ?? '(no task)' }),
      el('div', { class: 'id', text: `${fmtTime(r.start_time)} · ${r.runs ?? 0} runs · ${fmtMs(r.latency_ms)}` })),
  )));
  [...$('#runList').querySelectorAll('button')].forEach((b, i) => {
    b.addEventListener('click', () => select(runs[i].trace_id));
  });

  const s = state.summary;
  $('#queues').replaceChildren(
    el('h3', { text: 'Pending human approvals' }),
    s.pending_approvals.length
      ? el('ul', { class: 'queue' }, ...s.pending_approvals.map((a) => el('li', {},
          badge('requested'), ' ', riskBadge(a.risk), el('div', { text: a.subject ?? a.approval_id }),
          el('div', { class: 'id mono', text: `${a.agent ?? '?'} · of ${a.requested_of ?? '?'} · ${short(a.trace_id)}` }))))
      : el('p', { class: 'none', text: 'none' }),
    el('h3', { text: 'Open handoffs' }),
    s.open_handoffs.length
      ? el('ul', { class: 'queue' }, ...s.open_handoffs.map((h) => el('li', {},
          el('div', { class: 'mono', text: `${h.from_agent} → ${h.to_agent}` }),
          el('div', { text: h.reason ?? '' }),
          el('div', { class: 'id mono', text: short(h.trace_id) }))))
      : el('p', { class: 'none', text: 'none' }),
    /* An editorial impact is a sentence on a production site about
       EU law that may now be false, and no check in this repository
       reads prose. It sits on the rail for the same reason a pending
       approval does: the state that matters most is the one nobody
       has looked at. */
    el('h3', { text: 'Editorial impacts — prose nothing here reads' }),
    (s.editorial_impacts ?? []).length
      ? el('ul', { class: 'queue' }, ...s.editorial_impacts.map((e) => el('li', {},
          riskBadge(e.risk), ' ', el('span', { class: 'mono', text: e.change_id }),
          el('div', { text: e.summary }),
          el('div', { class: 'id mono', text: `${e.data?.dataset ?? ''} · ${e.data?.route ?? ''} · ${short(e.trace_id)}` }))))
      : el('p', { class: 'none', text: 'none' }),
    el('h3', { text: 'Website changes' }),
    s.website_changes.length
      ? el('ul', { class: 'queue' }, ...s.website_changes.map((c) => el('li', {},
          badge(c.status === 'deployed' ? 'ok' : 'requested'), ' ',
          el('span', { class: 'mono', text: c.change_id }),
          el('div', { text: (c.files ?? []).join(', ') }))))
      : el('p', { class: 'none', text: 'none' }),
  );
}

/* ---------------------------------------------------------- trace level */

const TABS = [
  ['tree', 'Execution tree', (t) => t.summary?.spans],
  ['timeline', 'Timeline', null],
  ['agents', 'Agents', (t) => t.agents.length],
  ['decisions', 'Decisions', (t) => t.decisions.length],
  ['artifacts', 'Artifacts', (t) => t.artifacts.length],
  ['handoffs', 'Handoffs', (t) => t.handoffs.length],
  ['approvals', 'Approvals', (t) => t.approvals.length],
  ['provenance', 'Provenance', (t) => t.provenance.length],
  ['changes', 'Website changes', (t) => t.website_changes.length],
  ['impact', 'Regulatory impact', (t) => (t.impact ?? []).length],
  ['depth', 'Data depth', (t) => t.depth?.reported ?? null],
  ['proposals', 'Gap proposals', (t) => t.proposals?.proposed ?? null],
  ['architecture', 'Knowledge architecture', (t) => t.architecture?.proposed ?? null],
  ['errors', 'Errors', (t) => t.errors.length],
];

function renderTraceHead(t) {
  const s = t.summary;
  if (!s) { $('#traceHead').replaceChildren(el('p', { class: 'empty', text: 'This trace has no root span.' })); return; }
  $('#traceHead').replaceChildren(
    el('h1', {}, s.task ?? s.agent ?? t.trace_id, ' ', badge(s.status), ' ', riskBadge(s.risk), ' ', confBadge(s.confidence)),
    el('p', { class: 'meta' },
      el('span', { text: `trace ${t.trace_id}` }),
      el('span', { text: `run ${short(s.run_id)}` }),
      el('span', { text: `${s.runs} runs · ${s.spans} spans · ${s.tools} tools` }),
      el('span', { text: `${fmtTime(s.start_time)} → ${fmtTime(s.end_time)} (${fmtMs(s.latency_ms)})` }),
      s.usage ? el('span', { text: `${s.usage.total_tokens} tokens · $${s.usage.cost_usd}` }) : el('span', { text: 'no token/cost recorded' }),
      s.env ? el('span', { text: s.env }) : null),
  );
}

function renderTabs(t) {
  $('#tabs').replaceChildren(...TABS.map(([id, label, count]) => {
    const n = count ? count(t) : null;
    const b = el('button', { type: 'button', role: 'tab', 'aria-selected': String(state.tab === id) },
      label, n ? el('span', { class: 'n', text: String(n) }) : null);
    b.addEventListener('click', () => { state.tab = id; renderPanel(t); renderTabs(t); });
    return b;
  }));
}

const eventLine = (e) => el('li', { 'data-t': e.type },
  el('span', { class: 't', text: e.type.replace('website_change', 'change') }),
  el('span', {},
    e.summary ?? e.decision ?? e.subject ?? e.message ?? e.artifact_id ?? e.source_id ??
      (e.to_agent ? `${e.from_agent} → ${e.to_agent}` : '') ?? '',
    e.state ? ' ' : '', e.state ? badge(e.state) : null,
    e.confidence != null ? ' ' : '', e.confidence != null ? confBadge(e.confidence) : null,
    e.risk ? ' ' : '', riskBadge(e.risk),
    e.simulated ? ' ' : '', e.simulated ? badge('simulated') : null));

function nodeEl(s) {
  const li = el('li', { class: 'node' },
    el('div', { class: 'node-head' },
      badge(s.status),
      el('span', { class: 'node-kind', text: s.kind }),
      el('span', { class: 'node-name', text: s.name }),
      confBadge(s.confidence), riskBadge(s.risk),
      el('span', { class: 'node-dur', text: `${fmtMs(s.latency_ms)}${s.usage?.total_tokens ? ` · ${s.usage.total_tokens} tok` : ''}` })),
    s.events.length ? el('ul', { class: 'ev' }, ...s.events.map(eventLine)) : null,
    (s.inputs || s.outputs) ? el('details', {}, el('summary', { text: 'inputs / outputs' }),
      el('div', {}, el('pre', { text: JSON.stringify({ inputs: s.inputs, outputs: s.outputs }, null, 2) }))) : null,
  );
  if (s.children.length) li.append(el('ul', {}, ...s.children.map(nodeEl)));
  return li;
}

function flattenSpans(s, out = []) { out.push(s); s.children.forEach((c) => flattenSpans(c, out)); return out; }

function table(cols, rows) {
  if (!rows.length) return el('p', { class: 'empty', text: 'nothing recorded' });
  return el('table', {},
    el('thead', {}, el('tr', {}, ...cols.map((c) => el('th', { text: c[0] })))),
    el('tbody', {}, ...rows.map((r) => el('tr', {}, ...cols.map((c) => {
      const v = c[1](r);
      return el('td', { class: c[2] ?? null }, v && v.nodeType ? v : (v == null || v === '' ? '—' : String(v)));
    })))));
}

function renderPanel(t) {
  const p = $('#panel');
  const stamp = (e) => fmtTime(e.ts);

  if (state.tab === 'tree') {
    return p.replaceChildren(el('ul', { class: 'tree' }, ...t.roots.map(nodeEl)));
  }
  if (state.tab === 'timeline') {
    const spans = t.roots.flatMap((r) => flattenSpans(r));
    const t0 = Math.min(...spans.map((s) => Date.parse(s.start_time)).filter(Number.isFinite));
    const t1 = Math.max(...spans.map((s) => Date.parse(s.end_time ?? s.start_time)).filter(Number.isFinite));
    const span = Math.max(1, t1 - t0);
    return p.replaceChildren(table([
      ['status', (s) => badge(s.status)],
      ['kind', (s) => s.kind, 'mono'],
      ['name', (s) => s.name],
      ['start', (s) => fmtTime(s.start_time), 'mono'],
      ['duration', (s) => fmtMs(s.latency_ms), 'mono'],
      ['when', (s) => {
        const a = (Date.parse(s.start_time) - t0) / span * 100;
        const w = Math.max(1, ((Date.parse(s.end_time ?? s.start_time) - Date.parse(s.start_time)) / span) * 100);
        return el('div', { class: 'bar' }, el('i', { style: `margin-left:${a.toFixed(2)}%;width:${w.toFixed(2)}%` }));
      }],
    ], spans.sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time))));
  }
  if (state.tab === 'agents') {
    return p.replaceChildren(table([
      ['status', (r) => badge(r.status)],
      ['agent', (r) => r.agent, 'mono'],
      ['task', (r) => r.task],
      ['run', (r) => short(r.run_id), 'mono'],
      ['parent run', (r) => short(r.parent_run_id), 'mono'],
      ['duration', (r) => fmtMs(r.latency_ms), 'mono'],
      ['confidence', (r) => (r.confidence == null ? '—' : r.confidence), 'mono'],
      ['risk', (r) => riskBadge(r.risk) ?? '—'],
      ['errors', (r) => r.errors, 'mono'],
    ], t.agents));
  }
  if (state.tab === 'decisions') {
    return p.replaceChildren(...(t.decisions.length ? t.decisions.map((d) => el('details', { open: true },
      el('summary', {}, d.decision, ' ', confBadge(d.confidence), ' ', riskBadge(d.risk)),
      el('div', {},
        el('p', { class: 'mono', text: `${d.decision_id} · ${d._span.agent ?? '?'} · ${stamp(d)}` }),
        el('p', { text: d.rationale }),
        d.alternatives?.length ? el('div', {}, el('h4', { text: 'Not chosen' }),
          el('ul', {}, ...d.alternatives.map((a) => el('li', { text: `${a.option ?? JSON.stringify(a)} — ${a.rejected_because ?? ''}` })))) : null,
        d.inputs_ref?.length ? el('p', { class: 'mono', text: `on: ${d.inputs_ref.join(', ')}` }) : null))) 
      : [el('p', { class: 'empty', text: 'no decisions recorded' })]));
  }
  if (state.tab === 'artifacts') {
    return p.replaceChildren(...(t.artifacts.length ? t.artifacts.map((a) => el('details', {},
      el('summary', {}, `${a.artifact_id} · ${a.artifact_type}`, a.simulated ? ' ' : '', a.simulated ? badge('simulated') : null),
      el('div', {},
        el('p', { class: 'mono', text: `${a.path ?? 'no file'} · ${a.bytes ?? '?'} bytes · sha256 ${short(a.sha256)} · by ${a._span.agent ?? '?'}` }),
        a.derived_from?.length ? el('p', { class: 'mono', text: `derived from: ${a.derived_from.join(', ')}` }) : null,
        a.preview ? el('pre', { text: a.preview }) : null)))
      : [el('p', { class: 'empty', text: 'no artifacts recorded' })]));
  }
  if (state.tab === 'handoffs') {
    return p.replaceChildren(table([
      ['state', (h) => badge(h.accepted ? 'ok' : 'requested')],
      ['from', (h) => h.from_agent, 'mono'],
      ['to', (h) => h.to_agent, 'mono'],
      ['reason', (h) => h.reason],
      /* Where it went. A cross-trace handoff names the downstream
         trace the receiving run opened; an intra-run one does not,
         and the dash says so rather than leaving the column blank
         as though the question had not been asked. */
      ['downstream trace', (h) => h.downstream_trace_id ?? '—', 'mono'],
      ['artifacts', (h) => (h.artifact_ids ?? []).join(', '), 'mono'],
      ['at', (h) => stamp(h), 'mono'],
    ], t.handoffs));
  }
  if (state.tab === 'approvals') {
    return p.replaceChildren(table([
      ['state', (a) => badge(a.state)],
      ['id', (a) => a.approval_id, 'mono'],
      ['subject', (a) => a.subject],
      ['risk', (a) => riskBadge(a.risk) ?? '—'],
      ['of', (a) => a.requested_of, 'mono'],
      ['actor', (a) => a.actor, 'mono'],
      ['note', (a) => a.note],
    ], t.approvals));
  }
  if (state.tab === 'provenance') {
    return p.replaceChildren(table([
      ['source', (r) => r.source_id, 'mono'],
      ['role', (r) => r.role, 'mono'],
      ['title', (r) => r.title],
      ['url', (r) => (r.url ? el('a', { href: r.url, rel: 'noreferrer' }, r.url) : '—')],
      ['retrieved', (r) => fmtTime(r.retrieved_at), 'mono'],
      ['sha256', (r) => short(r.content_sha256), 'mono'],
      ['verification', (r) => (r.verification ? `${r.verification.verdict} — ${r.verification.method}` : '—')],
      ['by', (r) => r._span.agent, 'mono'],
      ['simulated', (r) => (r.simulated ? badge('simulated') : '—')],
    ], t.provenance));
  }
  if (state.tab === 'changes') {
    if (!t.website_changes.length) return p.replaceChildren(el('p', { class: 'empty', text: 'no website change recorded' }));
    p.replaceChildren(el('p', { class: 'empty', text: 'loading the audit chain…' }));
    return api(`/api/chain?trace=${encodeURIComponent(t.trace_id)}`).then(({ chains }) => {
      p.replaceChildren(...chains.map((c) => el('div', { class: 'chain' },
        el('h3', {}, `${c.change_id} `, badge(c.status === 'deployed' ? 'ok' : 'requested'), c.simulated ? ' ' : '', c.simulated ? badge('simulated') : null),
        el('p', { class: 'mono', text: c.files.join(', ') }),
        el('p', { text: c.summary ?? '' }),
        ...Object.entries(c.chain).map(([stage, rows]) => el('div', { class: 'chain-stage' },
          el('h4', { text: `${stage} (${rows.length})` }),
          rows.length ? el('pre', { text: rows.map((r) => JSON.stringify(r)).join('\n') }) : el('p', { class: 'none mono', text: 'nothing recorded at this stage' }))),
        c.gaps.length
          ? el('p', { class: 'gaps', text: `GAPS — ${c.gaps.join('; ')}` })
          : el('p', { class: 'mono', text: 'no gaps: source → verification → decision → implementation → deployment is complete' }),
      )));
    });
  }
  if (state.tab === 'impact') {
    const maps = t.impact ?? [];
    if (!maps.length) return p.replaceChildren(el('p', { class: 'empty', text: 'no regulatory change on this trace was mapped onto the site' }));
    return p.replaceChildren(...maps.map((i) => el('div', { class: 'chain' },
      el('h3', {}, `${i.change_id} `, i.simulated ? badge('simulated') : null),
      el('p', { class: 'mono', text: `${i.nodes} record(s), ${i.edges} reference(s) reached${i.dropped.nodes || i.dropped.edges ? ` · ${i.shown.nodes}/${i.shown.edges} carried on this trace` : ''}${i.graph_sha256 ? ` · sha256 ${i.graph_sha256.slice(0, 12)}…` : ''}` }),
      i.routing ? el('div', { class: 'chain-stage' },
        el('h4', { text: 'Routing — what may be done without a human' }),
        el('pre', { text: Object.entries(i.routing).map(([k, n]) => `${k.padEnd(28)} ${n}`).join('\n') })) : null,
      i.surfaces ? el('div', { class: 'chain-stage' },
        el('h4', { text: 'Surfaces reached' }),
        el('pre', { text: Object.entries(i.surfaces).filter(([, n]) => n > 0).map(([k, n]) => `${k.padEnd(24)} ${n} record(s)`).join('\n') || 'no surface carries a reached record' })) : null,
      ...i.decision.map((d) => el('div', { class: 'chain-stage' },
        el('h4', { text: 'Decision' }),
        el('p', { text: d.decision }),
        el('p', { class: 'none', text: d.rationale }),
        el('pre', { text: (d.alternatives ?? []).map((a) => `not taken: ${a.option}\n            ${a.why_not}`).join('\n') }))),
      i.editorial.length
        ? el('div', { class: 'chain-stage' },
            el('h4', { text: `Editorial — ${i.editorial.length} sentence(s) state the value that moved` }),
            el('ul', { class: 'queue' }, ...i.editorial.map((e) => el('li', {}, riskBadge(e.risk), ' ', el('div', { text: e.summary })))))
        : el('p', { class: 'mono', text: 'no sentence in data/ was found to state the value that moved. That is not a clearance: nothing in this repository reads prose, and the open questions are on the ImpactAssessment record.' }),
      i.graph ? el('div', { class: 'chain-stage' },
        el('h4', { text: 'Dependency graph' }),
        el('pre', { text: (i.graph.nodes ?? []).map((n) => `${n.depth === 0 ? '●' : '·'} ${n.id}  ${n.kind}  ${n.dataset}`).join('\n') })) : null,
      i.gaps.length
        ? el('p', { class: 'gaps', text: `GAPS — ${i.gaps.join('; ')}` })
        : el('p', { class: 'mono', text: 'no gaps: the graph, the routing and the summary are all on this trace' }),
    )));
  }
  if (state.tab === 'depth') {
    const d = t.depth;
    if (!d) return p.replaceChildren(el('p', { class: 'empty', text: 'no depth analysis ran on this trace' }));
    return p.replaceChildren(el('div', { class: 'chain' },
      el('h3', {}, `${d.reported} gap(s) reported, ${d.set_aside} set aside `, d.simulated ? badge('simulated') : null),
      el('p', { class: 'mono', text: `of ${d.examined} absence(s) examined · as at ${d.as_of ?? '?'}${d.corpus ? ` · corpus ${d.corpus.records} record(s), ${d.corpus.edges} reference(s)` : ''}` }),
      d.by_impact ? el('div', { class: 'chain-stage' },
        el('h4', { text: 'What the absence costs a reader' }),
        el('pre', { text: Object.entries(d.by_impact).map(([k, n]) => `${k.padEnd(26)} ${n}`).join('\n') })) : null,
      d.by_autonomy ? el('div', { class: 'chain-stage' },
        el('h4', { text: 'What may be done about it — never autonomous' }),
        el('pre', { text: Object.entries(d.by_autonomy).map(([k, n]) => `${k.padEnd(26)} ${n}`).join('\n') })) : null,
      el('div', { class: 'chain-stage' },
        el('h4', { text: 'By detector — a detector that found nothing is a result' }),
        el('pre', { text: d.detectors.map((x) => `${x.kind.padEnd(34)} ${String(x.reported).padStart(2)} reported  ${String(x.set_aside).padStart(2)} set aside`).join('\n') })),
      /* The set-aside panel is the point of this view. A run that
         reported fifty-seven gaps and dropped thirty-one made a
         judgement thirty-one times, and showing only the fifty-seven
         would present that judgement as though it were the corpus. */
      el('div', { class: 'chain-stage' },
        el('h4', { text: `Set aside — ${d.set_aside} finding(s) not reported, and why` }),
        d.set_aside
          ? el('ul', { class: 'queue' }, ...d.detectors.flatMap((x) => x.set_aside_detail.map((a) => el('li', {},
              el('code', { text: `${x.kind}:${a.subject}` }), ' ', el('div', { class: 'none', text: a.why })))))
          : el('p', { class: 'mono', text: 'nothing was set aside' })),
      d.ordering ? el('div', { class: 'chain-stage' },
        el('h4', { text: 'Ordering' }),
        el('p', { text: d.ordering.decision }),
        el('p', { class: 'none', text: d.ordering.rationale }),
        el('pre', { text: (d.ordering.alternatives ?? []).join('\n') })) : null,
      el('p', { class: 'mono', text: d.kinds_with_no_finding.length ? `found nothing: ${d.kinds_with_no_finding.join(', ')} — looked, and there was nothing, which is not the same as not looking` : 'every kind found something' }),
      d.gaps.length
        ? el('p', { class: 'gaps', text: `GAPS — ${d.gaps.join('; ')}` })
        : el('p', { class: 'mono', text: 'no gaps: the census, the ordering decision and every suppression reason are all on this trace' }),
    ));
  }
  if (state.tab === 'proposals') {
    const r = t.proposals;
    if (!r) return p.replaceChildren(el('p', { class: 'empty', text: 'no gap routing ran on this trace' }));
    return p.replaceChildren(el('div', { class: 'chain' },
      el('h3', {}, `${r.proposed} proposal(s) authored, ${r.refused} gap(s) not proposable here `, r.simulated ? badge('simulated') : null),
      el('p', { class: 'mono', text: `${r.routed} gap(s) routed as at ${r.as_of ?? '?'} · ${r.evidence_questions} evidence question(s) handed to the Verifier · ${r.pending_approvals} approval(s) pending · ${r.merged ?? '?'} merged · ${r.applied ?? '?'} applied` }),
      r.by_route ? el('div', { class: 'chain-stage' },
        el('h4', { text: 'Where each gap went' }),
        el('pre', { text: Object.entries(r.by_route).map(([k, n]) => `${k.padEnd(22)} ${n}`).join('\n') })) : null,
      el('div', { class: 'chain-stage' },
        el('h4', { text: 'By route — a route nothing took is a result' }),
        el('pre', { text: r.routes.map((x) => `${x.route.padEnd(22)} ${String(x.gaps).padStart(2)} gap(s)  ${String(x.proposals).padStart(2)} proposal(s)  ${String(x.data_gaps).padStart(2)} evidence  ${String(x.refused).padStart(2)} refused`).join('\n') })),
      /* The refusal panel is the point of this view, in the same way
         the set-aside panel is the point of the depth view. Closing
         most of these gaps means writing a legal fact from a document
         nobody has read, and showing only the proposals would present
         that limit as though it did not exist. */
      el('div', { class: 'chain-stage' },
        el('h4', { text: `Not proposable here — ${r.refused} gap(s), and why` }),
        r.routes.some((x) => x.refused_detail.length)
          ? el('ul', { class: 'queue' }, ...r.routes.flatMap((x) => x.refused_detail.map((d) => el('li', {},
              el('code', { text: `${x.route}:${d.gap_id}` }), ' ', el('div', { class: 'none', text: d.why })))))
          : el('p', { class: 'mono', text: r.refused ? 'the run refused gaps and recorded no reasons — see GAPS below' : 'nothing was refused' })),
      el('div', { class: 'chain-stage' },
        el('h4', { text: 'Handed on' }),
        el('pre', { text: r.routes.flatMap((x) => x.handoffs.map((h) => `${x.route.padEnd(22)} → ${h.to_agent}  ${(h.artifact_ids ?? []).join(', ')}`)).join('\n') || 'nothing was handed to another agent' })),
      r.routing ? el('div', { class: 'chain-stage' },
        el('h4', { text: 'Routing' }),
        el('p', { text: r.routing.decision }),
        el('p', { class: 'none', text: r.routing.rationale }),
        el('pre', { text: (r.routing.alternatives ?? []).join('\n') })) : null,
      el('p', { class: 'mono', text: `records — ${r.proposal_ids.length} DataProposal, ${r.approval_ids.length} ApprovalRequest, ${r.data_gap_ids.length} DataGap` }),
      r.gaps.length
        ? el('p', { class: 'gaps', text: `GAPS — ${r.gaps.join('; ')}` })
        : el('p', { class: 'mono', text: 'no gaps: the census, the routing decision, every refusal reason and the "nothing merged" claim are all on this trace' }),
    ));
  }
  if (state.tab === 'architecture') {
    const a = t.architecture;
    if (!a) return p.replaceChildren(el('p', { class: 'empty', text: 'no architecture analysis on this trace' }));
    return p.replaceChildren(el('div', { class: 'chain' },
      el('h3', {}, `${a.answered_yes.length} of ${a.questions} question(s) answered yes, ${a.proposed} shape(s) proposed `, a.simulated ? badge('simulated') : null),
      el('p', { class: 'mono', text: `as at ${a.as_of ?? '?'} · ${a.examined} thing(s) examined · ${a.reported} finding(s) · ${a.set_aside} set aside · ${a.pending_approvals} approval(s) pending · ${a.merged ?? '?'} merged · ${a.applied ?? '?'} applied · ${a.schemas_changed ?? '?'} schema(s) changed · ${a.values_proposed ?? '?'} value(s) proposed` }),
      /* THE EIGHT ANSWERS FIRST. A question answered "no" is the
         model working, and what each lens EXAMINED travels with its
         answer so "looked and found nothing" is never confusable
         with "did not look". */
      el('div', { class: 'chain-stage' },
        el('h4', { text: 'The eight questions — a "no" is the model working' }),
        el('pre', { text: a.lenses.map((l) => `q${l.question} ${String(l.asks ?? l.lens).padEnd(64)} ${String(l.answer ?? '?').toUpperCase().padEnd(4)} ${String(l.examined).padStart(4)} examined  ${String(l.reported).padStart(2)} reported  ${String(l.set_aside).padStart(2)} aside`).join('\n') })),
      el('div', { class: 'chain-stage' },
        el('h4', { text: 'What each question found' }),
        a.lenses.some((l) => l.subjects.length)
          ? el('ul', { class: 'queue' }, ...a.lenses.flatMap((l) => l.subjects.map((sub) => el('li', {},
              el('code', { text: `q${l.question}` }), ' ', el('code', { text: sub })))))
          : el('p', { class: 'mono', text: 'nothing was found' })),
      /* The set-aside panel is the point of this view, as the
         refusal panel is the point of the gap-proposal view: a
         finding this agent handed to another is not a finding it
         hid. */
      el('div', { class: 'chain-stage' },
        el('h4', { text: `Not reported here — ${a.set_aside} finding(s), and whose they are` }),
        a.lenses.some((l) => l.not_reported.length)
          ? el('ul', { class: 'queue' }, ...a.lenses.flatMap((l) => l.not_reported.map((x) => el('li', {},
              el('code', { text: x.subject }), x.route ? el('code', { text: ` → ${x.route}` }) : null, el('div', { class: 'none', text: x.why })))))
          : el('p', { class: 'mono', text: a.set_aside ? 'findings were set aside and no reasons recorded — see GAPS below' : 'nothing was set aside' })),
      a.ordering ? el('div', { class: 'chain-stage' },
        el('h4', { text: 'Ordering' }),
        el('p', { text: a.ordering.decision }),
        el('p', { class: 'none', text: a.ordering.rationale }),
        el('pre', { text: (a.ordering.alternatives ?? []).join('\n') })) : null,
      el('p', { class: 'mono', text: `records — ${a.proposal_ids.length} ArchitectureProposal, ${a.approval_ids.length} ApprovalRequest. Every proposed operation carries a null "proposed": this agent names a shape and drafts none.` }),
      a.gaps.length
        ? el('p', { class: 'gaps', text: `GAPS — ${a.gaps.join('; ')}` })
        : el('p', { class: 'mono', text: 'no gaps: the census, the ordering decision, all eight answers, every set-aside reason and the "nothing merged" claim are on this trace' }),
    ));
  }
  if (state.tab === 'errors') {
    return p.replaceChildren(table([
      ['agent', (e) => e._span.agent, 'mono'],
      ['span', (e) => e._span.name],
      ['type', (e) => e.error_type, 'mono'],
      ['code', (e) => e.code, 'mono'],
      ['fatal', (e) => (e.fatal ? 'yes' : 'no'), 'mono'],
      ['message', (e) => e.message],
      ['at', (e) => stamp(e), 'mono'],
    ], t.errors));
  }
}

/* ---------------------------------------------------------- loading */

async function select(traceId) {
  state.selected = traceId;
  const t = await api(`/api/runs/${traceId}`);
  state.trace = t;
  banner(t.summary?.simulated ? 'simulated' : null,
    t.summary?.simulated ? 'Simulated trace — fixture data. It asserts no legal fact and cites no real source.' : null);
  renderTraceHead(t);
  renderTabs(t);
  renderPanel(t);
  renderRail();
}

async function refresh() {
  try {
    const s = await api('/api/summary');
    state.summary = s;
    state.runs = s.runs;
    if (!state.selected && s.runs.length) state.selected = s.runs[0].trace_id;
    renderTiles(s);
    renderRail();
    if (state.selected) {
      const t = await api(`/api/runs/${state.selected}`);
      state.trace = t;
      banner(t.summary?.simulated ? 'simulated' : null,
        t.summary?.simulated ? 'Simulated trace — fixture data. It asserts no legal fact and cites no real source.' : null);
      renderTraceHead(t); renderTabs(t); renderPanel(t);
    } else {
      $('#traceHead').replaceChildren(el('h1', { text: 'No traces yet' }));
      $('#panel').replaceChildren(el('pre', { text: 'node agent/observability/demo/workflow.mjs --live\n\nthen this view will fill in.' }));
    }
  } catch (err) {
    banner('error', `The trace API is not reachable (${err.message}). This view only works under: node agent/observability/cli.mjs serve`);
    $('#tiles').replaceChildren();
    $('#panel').replaceChildren(el('pre', { text: 'This page is the local development view over the agent trace store.\n\nRun it with:\n\n  node agent/observability/cli.mjs serve\n\nOpening the file directly, or reading it from a static host, gives it no store to read.' }));
  }
}

/* ---------------------------------------------------------- wiring */

$('#refresh').addEventListener('click', refresh);
$('#statusFilter').addEventListener('change', (e) => { state.filter = e.target.value; renderRail(); });
$('#theme').addEventListener('click', () => {
  const light = document.documentElement.dataset.theme === 'light';
  document.documentElement.dataset.theme = light ? 'dark' : 'light';
  $('#theme').textContent = light ? 'Light' : 'Dark';
  $('#theme').setAttribute('aria-pressed', String(!light));
});
const tick = () => { if ($('#autorefresh').checked) refresh(); };
$('#autorefresh').addEventListener('change', () => {
  clearInterval(state.timer);
  if ($('#autorefresh').checked) state.timer = setInterval(tick, 2000);
});
state.timer = setInterval(tick, 2000);
refresh();
