/* ============================================================
   .control-room/ui/app.js — the client, and how little it decides

   It fetches what the server assembled and renders it. It computes
   no status, derives no permission and holds no authority. Two
   consequences worth being explicit about, because the interface is
   where somebody would assume otherwise:

     · a button hidden here is hidden as a COURTESY. The server
       authorizes every request whether the button existed or not,
       and `.control-room/authz.mjs` says so in its own header.
       Editing this file to show a hidden button gets a 403.

     · nothing here is a source of truth. There is no local cache of
       who you are, no stored role, no stored token. The session
       cookie is HttpOnly, so this script cannot read it, and the
       CSRF token it does hold is useless without the cookie.

   Rendering is done by building nodes, not by assigning innerHTML,
   so a string that arrives from an agent record cannot become
   markup. The content security policy would stop an injected script
   from loading; not injecting one is the first line.
   ============================================================ */

const $ = (id) => document.getElementById(id);
const state = { csrf: null, actor: null, view: 'live', data: {} };

/* ---------------------------------------------------------- dom */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = String(v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}
const stat = (label, value) => el('div', { class: 'stat' }, el('b', { text: value ?? '—' }), el('span', { text: label }));
const bound = (text) => (text ? el('p', { class: 'bound', text }) : null);
const dump = (label, value) => el('details', {}, el('summary', { text: label }), el('pre', { text: JSON.stringify(value, null, 2) }));

function setStatus(message, isError = false) {
  const s = $('status');
  s.textContent = message ?? '';
  s.hidden = !message;
  s.style.color = isError ? 'var(--error)' : 'var(--muted)';
}

/* ---------------------------------------------------------- http */

async function get(path) {
  const res = await fetch(path, { headers: { accept: 'application/json' } });
  if (res.status === 401) { location.href = '/login'; throw new Error('unauthenticated'); }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.reason || body.error || `HTTP ${res.status}`);
  return body;
}

async function post(path, payload) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-control-room-csrf': state.csrf ?? '' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(body.reason || body.error || `HTTP ${res.status}`); e.fix = body.fix; throw e; }
  return body;
}

/* ---------------------------------------------------------- views */

function renderLive(d) {
  const out = [el('h2', { text: 'Live system' })];
  if (d.state !== 'measured') {
    out.push(el('p', { class: 'empty', text: d.why }));
    out.push(bound(d.bound));
    return out;
  }
  out.push(el('div', { class: 'cards' },
    stat('runs in the store', d.counts.runs),
    stat('running', d.counts.running),
    stat('failed', d.counts.failed),
    stat('open handoffs', d.counts.open_handoffs),
    stat('pending approvals', d.counts.pending_approvals),
    stat('website changes', d.counts.website_changes)));

  if (d.failed.length) {
    out.push(el('h3', { text: 'Runs that failed' }));
    out.push(...d.failed.map((r) => el('div', { class: 'item' },
      el('h3', { text: `${r.agent ?? 'unknown agent'} — ${r.task ?? 'no task'}` }),
      el('div', { class: 'meta' }, el('span', { class: 'pill error', text: 'failed' }), el('span', { text: r.start_time ?? '' }), el('code', { text: r.trace_id })))));
  }
  if (d.running.length) {
    out.push(el('h3', { text: 'Runs still open' }));
    out.push(...d.running.map((r) => el('div', { class: 'item' },
      el('h3', { text: `${r.agent ?? 'unknown agent'} — ${r.task ?? 'no task'}` }),
      el('div', { class: 'meta' }, el('span', { class: 'pill warn', text: 'running' }), el('span', { text: r.start_time ?? '' }), el('code', { text: r.trace_id })))));
  }

  if (d.open_handoffs.length) {
    out.push(el('h3', { text: 'Handoffs nobody has taken' }));
    out.push(el('ul', {}, ...d.open_handoffs.map((h) => el('li', { text: `${h.from_agent ?? '?'} → ${h.to_agent}${h.reason ? `: ${h.reason}` : ''}` }))));
  }

  out.push(el('h3', { text: 'Events, newest first' }));
  if (!d.events.length) out.push(el('p', { class: 'empty', text: 'No events in the runs this view opened.' }));
  out.push(...d.events.slice(0, 60).map((e) => el('div', { class: 'item' },
    el('div', { class: 'meta' }, el('span', { class: 'pill', text: e.kind }), el('span', { text: e.agent ?? '' }), el('span', { text: e.ts ?? '' })),
    el('div', { text: e.summary ?? '' }),
    e.rationale ? el('p', { class: 'note', text: e.rationale }) : null,
    e.alternatives?.length ? dump(`${e.alternatives.length} alternative(s) not chosen`, e.alternatives) : null)));

  if (d.failures.length) {
    out.push(el('h3', { text: 'Errors' }));
    out.push(...d.failures.map((f) => el('div', { class: 'item' },
      el('div', { class: 'meta' }, el('span', { class: 'pill error', text: f.fatal ? 'fatal' : 'error' }), el('span', { text: f.agent ?? '' }), el('span', { text: f.ts ?? '' })),
      el('div', { text: f.message }))));
  }
  out.push(bound(d.bound));
  return out;
}

function renderQueue(d) {
  const out = [el('h2', { text: 'Review queue' })];
  out.push(el('div', { class: 'cards' },
    stat('proposals', d.counts.total),
    stat('pending', d.counts.pending),
    stat('decidable now', d.counts.decidable),
    stat('human_only', d.counts.human_only)));
  out.push(el('p', { class: 'note', text: d.note }));

  if (!d.items.length) {
    out.push(el('p', { class: 'empty', text: 'No proposal is in the record store on this machine. agent/records/ is git-ignored, so a fresh checkout has none — run an agent to produce some.' }));
    return out;
  }

  for (const item of d.items) {
    const canDecide = item.approval.state === 'pending';
    const blocked = item.blocking_gates.length > 0;
    const card = el('div', { class: 'item' },
      el('h3', { text: item.summary ?? item.proposal_id }),
      el('div', { class: 'meta' },
        el('code', { text: item.proposal_id }),
        el('span', { class: `pill ${item.approval.state === 'granted' ? 'ok' : item.approval.state === 'pending' ? '' : 'warn'}`, text: item.approval.state }),
        el('span', { class: `pill ${item.autonomy_class === 'human_only' ? 'error' : ''}`, text: item.autonomy_class ?? 'no autonomy class' }),
        el('span', { class: 'pill', text: `risk: ${item.risk ?? 'unstated'}` }),
        el('span', { text: item.contract }),
        el('span', { text: item.agent })),
      item.reason ? el('p', { text: item.reason }) : null,
      el('p', { class: 'note', text: item.approval.why }));

    /* The whole chain protocol §9 asks for. It is collapsed rather
       than absent: a reviewer who wants to approve without reading
       it has to open it first. */
    card.append(dump(`Evidence — ${item.trace.source_to_evidence.length} reference(s)`, item.trace.source_to_evidence));
    if (item.trace.epistemic) card.append(dump('Facts, inferences and open questions', item.trace.epistemic));
    card.append(dump(`Operations — ${item.trace.operations.length}`, item.trace.operations));
    card.append(dump(`Files this approval would permit — ${item.trace.permitted_files.length}`, item.trace.permitted_files));
    card.append(dump(`Required tests — ${item.trace.required_tests.length}`, item.trace.required_tests));
    if (item.trace.rollback) card.append(dump('Rollback plan', item.trace.rollback));
    if (item.trace.agent_run) card.append(dump('The agent run that produced it', item.trace.agent_run));
    if (item.approval.discarded?.length) card.append(dump(`${item.approval.discarded.length} agent-written approval claim(s), discarded`, item.approval.discarded));
    if (item.review_notes.length) card.append(dump(`${item.review_notes.length} change request(s)`, item.review_notes));

    if (blocked) {
      card.append(el('h3', { text: `${item.blocking_gates.length} gate(s) refuse this proposal` }));
      card.append(el('ul', {}, ...item.blocking_gates.map((g) => el('li', {}, el('code', { text: g.gate }), ` — ${g.why}`))));
      card.append(el('p', { class: 'note', text: 'These are the Implementation Agent’s own gates. They are closed by the agent that produced the proposal, not by approving it.' }));
    }

    const note = el('textarea', { placeholder: 'Why. Recorded in the ledger for a decision, and required for a change request.', 'aria-label': 'Decision note' });
    const actions = el('div', { class: 'actions' }, note);

    const button = (label, action, enabled) => {
      const b = el('button', { type: 'button', text: label, disabled: !enabled });
      b.addEventListener('click', async () => {
        setStatus(`${action} ${item.proposal_id}…`);
        try {
          const out = await post('/api/review', { action, proposal_id: item.proposal_id, fingerprint: item.fingerprint, note: note.value || null });
          setStatus(`${out.outcome}. ${out.publication_note}`);
          await load('queue');
        } catch (e) {
          setStatus(`${e.message}${e.fix ? ` — ${e.fix}` : ''}`, true);
        }
      });
      return b;
    };

    const may = state.actor?.permissions ?? [];
    const approvePermission = item.permission_required;
    actions.append(button('Approve', 'approve', canDecide && !blocked && may.includes(approvePermission)));
    actions.append(button('Reject', 'reject', canDecide && may.includes('proposal:reject')));
    actions.append(button('Request changes', 'request_changes', canDecide && may.includes('proposal:request_changes')));
    card.append(actions);
    card.append(el('p', { class: 'note', text: `Approving needs ${approvePermission}. Buttons are hidden or disabled as a courtesy; the server authorizes every request either way.` }));
    out.push(card);
  }
  return out;
}

function renderHealth(d) {
  const out = [el('h2', { text: 'Website health' })];
  out.push(el('p', { class: 'bound', text: d.no_overall_score }));

  if (d.state !== 'measured') {
    out.push(el('p', { class: 'empty', text: d.why }));
    out.push(el('p', { class: 'note' }, 'To produce one: ', el('code', { text: d.needs })));
  } else {
    out.push(el('div', { class: 'cards' },
      stat('measured', d.counts.measured),
      stat('unmeasurable', d.counts.unmeasurable),
      stat('not applicable', d.counts.not_applicable),
      stat('public-safe', d.counts.public_safe),
      stat('private', d.counts.private),
      stat('never a score', d.counts.not_a_score)));
    out.push(el('p', { class: 'note', text: `Last recorded run: ${d.as_of}${d.commit ? ` at ${d.commit}` : ''}.` }));

    for (const domain of d.domains) {
      const readings = d.readings.filter((r) => r.domain === domain.domain);
      if (!readings.length) continue;
      out.push(el('h3', { text: `${domain.label} — ${domain.stake}` }));
      const rows = readings.map((r) => el('tr', {},
        el('td', {}, el('code', { text: r.id })),
        el('td', { text: r.state === 'measured' ? `${r.value} ${r.unit ?? ''}${r.of != null ? ` of ${r.of}` : ''}` : r.state.toUpperCase() }),
        el('td', {}, el('span', { class: `pill ${r.visibility === 'public' ? 'ok' : ''}`, text: r.visibility })),
        el('td', { text: r.direction === 'not_a_score' ? 'never a score' : (r.direction ?? '') }),
        el('td', { text: r.why ?? '' })));
      out.push(el('div', { class: 'scroll' }, el('table', {},
        el('thead', {}, el('tr', {}, el('th', { text: 'metric' }), el('th', { text: 'reading' }), el('th', { text: 'visibility' }), el('th', { text: 'direction' }), el('th', { text: 'what it could not see' }))),
        el('tbody', {}, ...rows))));
    }
    if (d.movement) out.push(dump('Movement since the previous run', d.movement));
    out.push(bound(d.bound));
  }

  out.push(el('h3', { text: 'Privileged interfaces in this repository' }));
  out.push(el('div', { class: 'scroll' }, el('table', {},
    el('thead', {}, el('tr', {}, el('th', { text: 'interface' }), el('th', { text: 'privileged routes' }), el('th', { text: 'authentication' }), el('th', { text: 'authorization' }), el('th', { text: 'binds by default' }))),
    el('tbody', {}, ...d.security.interfaces.map((i) => el('tr', {},
      el('td', {}, el('code', { text: i.path })),
      el('td', { text: i.privileged_routes }),
      el('td', {}, el('span', { class: `pill ${i.has_auth ? 'ok' : 'error'}`, text: i.has_auth ? 'present' : 'none' })),
      el('td', {}, el('span', { class: `pill ${i.has_authz ? 'ok' : 'error'}`, text: i.has_authz ? 'present' : 'none' })),
      el('td', { text: i.binds_by_default ?? '—' })))))));
  out.push(bound(d.security.bound));
  out.push(dump('This server', d.security.this_server));
  out.push(el('p', { class: 'note', text: 'Readings marked private are control-plane information. Only the ones marked public-safe may be published, and the health monitor produces that subset separately: node agent/health/cli.mjs --publish' }));
  return out;
}

function renderAudit(d) {
  const out = [el('h2', { text: 'Audit trail' })];
  out.push(el('div', { class: 'cards' },
    stat('entries', d.total),
    stat('chain', d.chain.ok ? 'intact' : 'BROKEN'),
    stat('edited entries', d.chain.tampered.length),
    stat('chain breaks', d.chain.breaks.length)));
  if (!d.chain.ok) out.push(el('p', { class: 'bound', text: 'The hash chain does not verify. Something in this trail has been edited, removed or reordered since it was written.' }));
  out.push(bound(d.chain.bound));
  if (!d.entries.length) return [...out, el('p', { class: 'empty', text: 'Nothing has been recorded yet.' })];
  out.push(el('div', { class: 'scroll' }, el('table', {},
    el('thead', {}, el('tr', {}, el('th', { text: 'when' }), el('th', { text: 'action' }), el('th', { text: 'outcome' }), el('th', { text: 'actor' }), el('th', { text: 'proposal' }), el('th', { text: 'state' }), el('th', { text: 'why' }))),
    el('tbody', {}, ...d.entries.map((e) => el('tr', {},
      el('td', { text: e.ts }),
      el('td', {}, el('code', { text: e.action })),
      el('td', {}, el('span', { class: `pill ${e.outcome === 'allowed' || e.outcome === 'ok' ? 'ok' : 'warn'}`, text: e.outcome })),
      el('td', { text: e.actor_subject ?? '—' }),
      el('td', { text: e.proposal_id ?? '—' }),
      el('td', { text: e.previous_state && e.resulting_state ? `${e.previous_state} → ${e.resulting_state}` : '—' }),
      el('td', { text: e.reason ?? '' })))))));
  return out;
}

function renderOperators(d) {
  const out = [el('h2', { text: 'Access' })];
  out.push(el('div', { class: 'cards' }, stat('operators', d.counts.total), stat('active', d.counts.active), stat('administrators', d.counts.administrators)));
  out.push(el('div', { class: 'scroll' }, el('table', {},
    el('thead', {}, el('tr', {}, el('th', { text: 'subject' }), el('th', { text: 'roles' }), el('th', { text: 'provider' }), el('th', { text: 'created' }), el('th', { text: 'last seen' }), el('th', { text: 'state' }))),
    el('tbody', {}, ...d.operators.map((o) => el('tr', {},
      el('td', { text: o.subject }),
      el('td', { text: o.roles.join(', ') || '—' }),
      el('td', { text: o.provider }),
      el('td', { text: `${o.created_at} by ${o.created_by}` }),
      el('td', { text: o.last_seen_at ?? 'never' }),
      el('td', {}, el('span', { class: `pill ${o.disabled ? 'error' : 'ok'}`, text: o.disabled ? 'disabled' : 'active' }))))))));
  out.push(el('p', { class: 'note', text: d.note }));
  out.push(el('p', { class: 'note', text: 'Roles are granted from the machine, not from here: node .control-room/cli.mjs grant --subject … --role … --by … . A Control Room that could grant itself a role would be a Control Room with no boundary above it.' }));
  out.push(dump('Configuration (no secret is included)', d.config));
  return out;
}

/* ---------------------------------------------------------- shell */

const RENDER = { live: renderLive, queue: renderQueue, health: renderHealth, audit: renderAudit, operators: renderOperators };
const ENDPOINT = { live: '/api/live', queue: '/api/queue', health: '/api/health', audit: '/api/audit', operators: '/api/operators' };

async function load(view) {
  state.view = view;
  for (const tab of document.querySelectorAll('.tab')) tab.setAttribute('aria-current', String(tab.dataset.view === view));
  setStatus('Loading…');
  const section = $('view');
  try {
    const data = await get(ENDPOINT[view]);
    section.replaceChildren(...RENDER[view](data));
    setStatus('');
  } catch (e) {
    section.replaceChildren(el('p', { class: 'empty', text: e.message }));
    setStatus(e.message, true);
  }
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => load(tab.dataset.view));
}

$('logout').addEventListener('click', async () => {
  try { await post('/auth/logout', {}); } catch { /* the cookie is cleared either way */ }
  location.href = '/login';
});

try {
  const session = await get('/api/session');
  state.csrf = session.csrf;
  state.actor = session.actor;
  $('actor').textContent = `${session.actor.subject} — ${session.actor.roles.join(', ') || 'no role'}`;
  $('env').textContent = `${session.environment.env} · ${session.environment.provider}${session.environment.bind_is_loopback ? ' · loopback' : ''}`;
  /* A tab whose view the actor may not read is removed. The server
     refuses it regardless; this only stops offering a door that
     does not open. */
  const may = session.interface;
  const allowed = { live: may.live, queue: may.queue, health: may.health, audit: may.audit, operators: may.operators };
  for (const tab of document.querySelectorAll('.tab')) if (!allowed[tab.dataset.view]) tab.remove();
  const first = document.querySelector('.tab');
  await load(first ? first.dataset.view : 'live');
} catch {
  location.href = '/login';
}
