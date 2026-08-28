/* ============================================================
   "What applies to me?"

   The engine is deliberately unintelligent. It holds no rules of its
   own: every rule, rationale, exemption and dependency lives in
   data/applicability.json, and this file only matches and ranks.

   Two design commitments carry the integrity of the result:

   1. An unanswered question DOWNGRADES an outcome by one step. It
      never excludes a rule, so a borderline case is shown rather
      than quietly dropped.
   2. When no rule covers a combination, the answer is NOT DETERMINED
      — never "probably not". Absence of a rule is absence of
      knowledge, and presenting it as a negative finding would be the
      single most damaging thing this tool could do.
   ============================================================ */

import { loadAll, index, renderError, label as taxLabel, note as taxNote } from './data.js';
import * as F from './format.js';
import { authoritiesFor } from './dna.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* the dimensions the questionnaire actually offers, in the order it asks them */
const OFFERED = {
  actor: ['actor:sme', 'actor:large-company', 'actor:online-platform', 'actor:vlop', 'actor:gatekeeper',
    'actor:ai-provider', 'actor:ai-deployer', 'actor:gpai-provider', 'actor:cloud-provider',
    'actor:manufacturer', 'actor:connected-product-provider', 'actor:financial-entity',
    'actor:public-authority', 'actor:critical-sector', 'actor:researcher'],
  activity: ['activity:processing-personal-data', 'activity:online-platform-activity',
    'activity:recommender-systems', 'activity:ai-deployment', 'activity:gpai-provision',
    'activity:cloud-services', 'activity:connected-products', 'activity:digital-identity',
    'activity:critical-infrastructure-operation', 'activity:marketplace-activity'],
  territory: ['territory:eu-established', 'territory:non-eu-serving-eu'],
};

const RANK = ['outcome:applies', 'outcome:likely', 'outcome:possible', 'outcome:unlikely'];
const DOWN = {
  'outcome:applies': 'outcome:likely',
  'outcome:likely': 'outcome:possible',
  'outcome:possible': 'outcome:possible',
  'outcome:unlikely': 'outcome:unlikely',
};
const VERDICT = {
  'outcome:applies': { word: 'Yes', slug: 'yes' },
  'outcome:likely': { word: 'Potentially applicable', slug: 'maybe' },
  'outcome:possible': { word: 'Potentially applicable', slug: 'maybe' },
  'outcome:unlikely': { word: 'Probably not', slug: 'no' },
  'outcome:undetermined': { word: 'Not determined', slug: 'undet' },
};
const CONFIDENCE = {
  'outcome:applies': 'on the facts given',
  'outcome:likely': 'on the ordinary reading — turns on a condition not established here',
  'outcome:possible': 'depends on facts this questionnaire does not ask for',
  'outcome:unlikely': 'absence of an obligation here is not a safe harbour',
};

let IX = null;
let RULES = [];
const selection = { actor: new Set(), activity: new Set(), territory: new Set() };

/* ---------------------------------------------------------- matching */

/** A VLOP is an online platform. Walk the taxonomy's parent links so a rule
 *  written for the broader class fires for the narrower one too. */
function withAncestors(ids) {
  const out = new Set();
  for (const id of ids) {
    let cur = id;
    let guard = 0;
    while (cur && guard++ < 12) {
      out.add(cur);
      const t = IX.taxonomy.get(cur);
      cur = t && t.parent ? t.parent : null;
    }
  }
  return out;
}

/**
 * Evaluate one rule against the selection.
 * @returns {{fires:boolean, outcome:string, downgrades:string[]}}
 */
export function evaluate(rule, sel) {
  const cond = rule.conditions || {};
  const downgrades = [];
  let outcome = rule.outcome;

  let specificity = 0;   // how many dimensions this rule constrains AND the user answered
  for (const dim of ['actor', 'activity', 'territory']) {
    const want = cond[dim];
    if (!want || !want.length) continue;               // dimension omitted = wildcard
    const have = sel[dim];
    if (!have || !have.size) {
      // the user has not answered this question: do not exclude, but be honest
      downgrades.push('You have not said ' + ({
        actor: 'what kind of organisation you are',
        activity: 'what you do',
        territory: 'where you are established',
      })[dim] + '.');
      outcome = DOWN[outcome];
      continue;
    }
    const expanded = withAncestors(have);
    if (!want.some((w) => expanded.has(w))) return { fires: false };
    specificity++;
  }

  if (cond.thresholds && Object.keys(cond.thresholds).length) {
    downgrades.push('This rule turns on a numeric threshold the questionnaire does not ask for: ' +
      Object.keys(cond.thresholds).map((k) => k.replace(/_/g, ' ')).join(', ') + '.');
    outcome = DOWN[outcome];
  }
  return { fires: true, outcome, downgrades, specificity };
}

function run(sel) {
  const byInstrument = new Map();
  for (const rule of RULES) {
    const r = evaluate(rule, sel);
    if (!r.fires) continue;
    if (!byInstrument.has(rule.instrument)) byInstrument.set(rule.instrument, []);
    byInstrument.get(rule.instrument).push({ rule, ...r });
  }
  const results = [...byInstrument.entries()].map(([instId, hits]) => {
    // Specificity first: a rule that matched on what you actually told the tool
    // is better evidence than one that fired only because a question was left
    // blank, and the headline verdict should come from the former.
    hits.sort((a, b) => b.specificity - a.specificity ||
      RANK.indexOf(a.outcome) - RANK.indexOf(b.outcome));
    return { instrument: IX.instrument.get(instId), best: hits[0].outcome, hits };
  });
  results.sort((a, b) => RANK.indexOf(a.best) - RANK.indexOf(b.best) ||
    a.instrument.short_name.localeCompare(b.instrument.short_name));

  // instruments the brief treats as core but for which nothing fired
  const covered = new Set(results.map((r) => r.instrument.id));
  // IX.instrument maps aliases to the same object, so dedupe by id before counting
  const seen = new Set();
  const undetermined = [...IX.instrument.values()]
    .filter((i) => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return i.scope_class === 'scope:core' && !covered.has(i.id) && i.kind !== 'kind:proposal';
    })
    .sort((a, b) => a.short_name.localeCompare(b.short_name));

  return { results, undetermined };
}

/* ---------------------------------------------------------- rendering */

function hitHTML(h) {
  const r = h.rule;
  const oblig = (r.obligations || []).map((p) => {
    const pr = IX.provision.get(p);
    const owner = IX.provisionOwner.get(p);
    const i = owner ? IX.instrument.get(owner) : null;
    return pr
      ? '<span class="ap-prov"><b>' + esc((i ? i.short_name + ' ' : '') + 'Art. ' + pr.number) + '</b>' +
        (pr.heading ? ' ' + esc(pr.heading) : '') + '</span>'
      : '<span class="ap-prov">' + esc(p) + '</span>';
  }).join('');

  const auth = (r.authority || []).map((a) => {
    const x = IX.institution.get(a);
    if (!x) return esc(a);
    const roles = authoritiesFor(r.instrument, IX)
      .filter((c) => c.institution.id === x.id)
      .map((c) => taxLabel(IX, c.role));
    return '<span class="ap-auth"><b>' + esc(x.short_name) + '</b>' +
      (roles.length ? '<span class="ap-role">' + esc([...new Set(roles)].join(' · ')) + '</span>' : '') + '</span>';
  }).join('');

  const dates = (r.dates || []).map((d) => {
    const e = IX.event.get(d);
    if (!e) return '';
    return '<span class="ap-date"><b class="' + (F.isPast(e.date) ? '' : 'future') + '">' +
      esc(F.humanDate(e.date, e.date_precision)) + '</b> ' +
      '<span class="ap-role">' + esc(taxLabel(IX, e.event_type)) + '</span></span>';
  }).join('');

  const srcs = (r.sources || []).map((s) => {
    const src = IX.source.get(s);
    return src ? '<li>' + F.citeHTML(src, IX, 'note') + '</li>' : '';
  }).join('');

  const li = (arr) => arr.map((x) => '<li>' + esc(x) + '</li>').join('');

  return '<div class="ap-hit">' +
    '<div class="ap-hit-head">' +
      '<span class="ap-verdict" data-v="' + VERDICT[h.outcome].slug + '">' + esc(VERDICT[h.outcome].word) + '</span>' +
      '<span class="ap-conf">' + esc(CONFIDENCE[h.outcome]) + '</span>' +
      (h.outcome !== r.outcome
        ? '<span class="ap-downgraded" title="This rule was written as ' + esc(VERDICT[r.outcome].word) +
          ' and downgraded because a question is unanswered">downgraded</span>' : '') +
      (h.specificity === 0
        ? '<span class="ap-downgraded" title="No dimension this rule constrains was answered, so it fired on wildcards alone">matched on no answer</span>' : '') +
      '<span class="ap-ruleid">' + esc(r.id) + '</span>' +
    '</div>' +
    '<p class="ap-rationale">' + esc(r.rationale) + '</p>' +
    (h.downgrades.length ? '<div class="ap-why-down"><b>Why this is not a firm answer</b><ul>' +
      li(h.downgrades) + '</ul></div>' : '') +
    (oblig ? '<div class="ap-field"><h4>Relevant obligations</h4><div class="ap-provs">' + oblig + '</div></div>' : '') +
    (auth ? '<div class="ap-field"><h4>Competent authority</h4><div class="ap-provs">' + auth + '</div></div>' : '') +
    (dates ? '<div class="ap-field"><h4>Key dates</h4><div class="ap-provs">' + dates + '</div></div>' : '') +
    ((r.exemptions || []).length ? '<div class="ap-field"><h4>Exemptions</h4><ul class="ap-list">' + li(r.exemptions) + '</ul></div>' : '') +
    ((r.depends_on || []).length ? '<div class="ap-field warn"><h4>Depends on</h4><ul class="ap-list">' + li(r.depends_on) + '</ul></div>' : '') +
    (r.requires_verification ? '<div class="ap-field warn"><h4>Requires verification</h4><p class="ap-list">' +
      esc(r.verification_note || '') + '</p></div>' : '') +
    (srcs ? '<div class="ap-field"><h4>Sources</h4><ul class="ap-cites">' + srcs + '</ul></div>' : '') +
    '<div class="ap-verified">Rule last verified ' +
      (r.last_verified ? esc(F.humanDate(r.last_verified)) : '<span class="ap-never">never</span>') + '</div>' +
    '</div>';
}

function resultHTML(res) {
  const i = res.instrument;
  const status = i.legislative_status;
  return '<article class="ap-result" data-v="' + VERDICT[res.best].slug + '">' +
    '<header class="ap-res-head">' +
      '<span class="ap-badge" data-v="' + VERDICT[res.best].slug + '">' + esc(VERDICT[res.best].word) + '</span>' +
      '<h3>' + esc(i.short_name) + '</h3>' +
      '<span class="ap-full">' + esc(i.full_name) + '</span>' +
      '<span class="ap-status" data-s="' + esc(status ? status.split(':').pop() : 'unknown') + '">' +
        esc(status ? taxLabel(IX, status) : 'status not established') + '</span>' +
      (i.kind === 'kind:proposal' ? '<span class="ap-proposal">proposal · not law</span>' : '') +
    '</header>' +
    res.hits.map(hitHTML).join('') +
    '</article>';
}

function render() {
  const host = document.getElementById('ap-results');
  const any = selection.actor.size + selection.activity.size + selection.territory.size;
  if (!any) {
    host.innerHTML = '<p class="ap-empty">Choose at least one option above. The more you answer, the ' +
      'firmer the result — but this tool can never give you a firm answer about your own situation.</p>';
    return;
  }
  const { results, undetermined } = run(selection);
  const counts = results.reduce((o, r) => { o[VERDICT[r.best].slug] = (o[VERDICT[r.best].slug] || 0) + 1; return o; }, {});

  const summary = '<div class="ap-summary" role="status">' +
    ['yes', 'maybe', 'no'].map((s) => counts[s]
      ? '<span class="ap-badge" data-v="' + s + '">' + counts[s] + ' ' +
        esc({ yes: 'Yes', maybe: 'Potentially applicable', no: 'Probably not' }[s]) + '</span>' : '').join('') +
    (undetermined.length ? '<span class="ap-badge" data-v="undet">' + undetermined.length + ' Not determined</span>' : '') +
    '</div>';

  const undetHTML = undetermined.length
    ? '<section class="ap-undet"><h3>Not determined by this tool</h3>' +
      '<p>No rule in this dataset covers the combination you selected for ' +
      undetermined.map((i) => '<b>' + esc(i.short_name) + '</b>').join(', ') + '. ' +
      '<strong>That is absence of knowledge, not evidence that these instruments do not apply to you.</strong> ' +
      'The rule set is uneven by design and does not attempt full coverage.</p></section>'
    : '';

  host.innerHTML = summary + results.map(resultHTML).join('') + undetHTML;
}

/* ---------------------------------------------------------- questionnaire */

function group(dim, legend, help) {
  const opts = OFFERED[dim].filter((id) => IX.taxonomy.has(id));
  return '<fieldset class="ap-group" data-dim="' + dim + '">' +
    '<legend>' + esc(legend) + '</legend>' +
    '<p class="ap-help">' + esc(help) + '</p>' +
    '<div class="ap-opts">' + opts.map((id) => {
      const t = IX.taxonomy.get(id);
      return '<label class="ap-opt"><input type="checkbox" value="' + esc(id) + '" data-dim="' + dim + '"/>' +
        '<span>' + esc(t.label) + '</span>' +
        (t.note ? '<span class="ap-optnote">' + esc(t.note) + '</span>' : '') + '</label>';
    }).join('') + '</div></fieldset>';
}

function buildForm() {
  const form = document.getElementById('ap-form');
  form.innerHTML =
    group('actor', 'What kind of organisation are you?', 'Choose every description that fits. Many organisations are more than one.') +
    group('activity', 'What do you do?', 'Select each activity you carry out. Instruments attach to activities, not to industries.') +
    group('territory', 'Where are you established?', 'Most of the rulebook reaches conduct directed at the Union irrespective of where the provider sits.') +
    '<div class="ap-actions"><button type="button" id="ap-reset">Clear all</button></div>';

  form.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.matches('input[type=checkbox][data-dim]')) return;
    const set = selection[el.dataset.dim];
    el.checked ? set.add(el.value) : set.delete(el.value);
    el.closest('.ap-opt').classList.toggle('on', el.checked);
    render();
    persist();
  });
  document.getElementById('ap-reset').addEventListener('click', () => {
    for (const d of Object.keys(selection)) selection[d].clear();
    for (const el of form.querySelectorAll('input[type=checkbox]')) {
      el.checked = false; el.closest('.ap-opt').classList.remove('on');
    }
    render(); persist();
  });
}

/* the selection lives in the URL so a result can be shared or bookmarked */
function persist() {
  const p = new URLSearchParams();
  for (const d of Object.keys(selection)) if (selection[d].size) p.set(d, [...selection[d]].join(','));
  const q = p.toString();
  history.replaceState(null, '', q ? '?' + q : location.pathname);
}
function restore() {
  const p = new URLSearchParams(location.search);
  for (const d of Object.keys(selection)) {
    for (const v of (p.get(d) || '').split(',').filter(Boolean)) {
      if (!IX.taxonomy.has(v)) continue;
      selection[d].add(v);
      const el = document.querySelector('input[data-dim="' + d + '"][value="' + v + '"]');
      if (el) { el.checked = true; el.closest('.ap-opt').classList.add('on'); }
    }
  }
}

/* ---------------------------------------------------------- boot */

(async function boot() {
  const host = document.getElementById('ap-results');
  try {
    const db = await loadAll(['taxonomy', 'instruments', 'institutions', 'sources', 'claims', 'timeline', 'applicability']);
    IX = index(db);
    RULES = db.applicability.rules || [];
    const limits = document.getElementById('ap-limits');
    if (limits && db.applicability.$limits) {
      limits.innerHTML = db.applicability.$limits.map((l) => '<li>' + esc(l) + '</li>').join('');
    }
    const n = document.getElementById('ap-rulecount');
    if (n) n.textContent = RULES.length;
    buildForm();
    restore();
    render();
  } catch (e) {
    renderError(host, e, () => location.reload());
    console.error('[applies]', e);
  }
})();
