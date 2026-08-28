/* ============================================================
   THE INSTRUMENT PAGE — the reference implementation for a detail
   view, and the thing the data model has been able to support for
   three phases without anything rendering it.

   Until now an instrument existed as a column in a comparison table
   and as a status strip inside the Part that discusses it. There
   was no page for "the AI Act" — no single surface answering, in
   one place: what is it, where does it stand, when does it land,
   who does it bind, which provisions carry it, what has it
   produced, and what does any of that rest on.

   Every section here is read from the canonical JSON. Nothing is
   stored for this page and nothing is typed into it: the authority
   is derived from institutions.json, the dates from timeline.json,
   the enforcement from enforcement.json, the applicability from
   applicability.json, and the evidence from claims.json against
   sources.json. If a dataset holds nothing for a section, the
   section says so — the one thing it must never do is imply that
   an empty dataset means an empty world.
   ============================================================ */

import { loadAll, index, renderError, label as taxLabel, note as taxNote, loadOverlay } from './data.js';
import * as F from './format.js';
import { authoritiesFor, datesFor, cell, DIMENSIONS, setOverlay } from './dna.js';
import { derive, STAGES } from './pipeline.js';
import { sourceList, gradeChip, freshness } from './evidence-view.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let IX = null, DB = null, OVERLAY = {};
const tr = (k, fb) => (OVERLAY && OVERLAY[k]) || fb;

/* ---------------------------------------------------------- status */

/* The scalar status is not the whole answer and the site's own first rule is
   that entry into force is not application. The pill therefore always travels
   with the as-of date and, where the instrument has milestones, with the
   sentence that says why the scalar is insufficient. */
function statusBadge(inst) {
  const st = String(inst.legislative_status || '').split(':').pop();
  const map = {
    'in-force': 'verified', applicable: 'verified', 'partly-applicable': 'provisional',
    proposal: 'provisional', stalled: 'provisional', withdrawn: 'historical',
    repealed: 'historical', amended: 'provisional',
  };
  return '<span class="badge" data-st="' + (map[st] || 'neutral') + '">' +
    esc(taxLabel(IX, inst.legislative_status)) + '</span>';
}

function kindLine(inst) {
  const k = String(inst.kind || '').split(':').pop();
  if (k === 'proposal') return 'Proposal · <b>not law</b> · creates no obligations';
  if (k === 'directive') return 'Directive · requires national transposition';
  if (k === 'regulation') return 'Regulation · directly applicable';
  return esc(taxLabel(IX, inst.kind) || k);
}

/* ---------------------------------------------------------- evidence */

/** One evidence block for one claim: what is claimed, what carries it,
 *  what kind of source that is, and when it was last checked — in that
 *  fixed order, because that is the order the questions arrive in. The
 *  sources themselves are drawn by js/evidence-view.js, the same function
 *  the drawer uses, at the density a list needs. */
function evidenceBlock(claim) {
  const grade = F.evidenceGrade(claim, IX);
  const type = F.typeOf(claim);
  return '<div class="ev" data-grade="' + esc(grade.id) + '">' +
    '<div class="ev-kicker">' + gradeChip(claim, IX) +
      '<span class="badge" data-st="' + (type === 'law' ? 'verified'
        : type === 'fact' ? 'neutral' : 'interpretation') + '">' + esc(type) + '</span>' +
      (F.isUnverified(claim) ? '<span class="badge" data-st="unresolved">unverified</span>' : '') +
    '</div>' +
    '<p class="ev-claim">' + esc(claim.statement) + '</p>' +
    '<div class="ev-src">' + sourceList(claim, IX, 'compact') + '</div>' +
    '<div class="ev-foot">' +
      (claim.brief_part
        ? '<a class="ev-part" href="index.html#' + esc(claim.brief_part) + '">Read it in the brief &rarr;</a>'
        : '') +
      freshness(claim.last_verified) +
    '</div></div>';
}

/* ---------------------------------------------------------- sections */

function headSection(inst) {
  const auths = authoritiesFor(inst.id, IX);
  const dates = datesFor(inst, IX);
  const next = dates.find((e) => !F.isPast(e.date));
  const ceiling = inst.dna && inst.dna.sanction_ceiling;
  const ceilingTxt = ceiling
    ? [ceiling.pct_global_turnover != null ? ceiling.pct_global_turnover + '% of global turnover' : null,
       ceiling.fixed_eur != null ? F.eur(ceiling.fixed_eur) : null].filter(Boolean).join(' / ')
    : null;

  const item = (k, v, mono) =>
    '<div class="meta-item"><dt>' + esc(k) + '</dt><dd class="v' + (mono ? ' mono' : '') + '">' + v + '</dd></div>';

  return '<div class="page-head">' +
    '<p class="section-kicker">' + kindLine(inst) +
      (inst.celex ? ' · <span class="mono">CELEX ' + esc(inst.celex) + '</span>' : '') + '</p>' +
    '<h1>' + esc(tr(inst.id + '.short_name', inst.short_name)) + '</h1>' +
    '<p class="lede">' + esc(tr(inst.id + '.full_name', inst.full_name)) + '</p>' +
    '<dl class="meta-grid">' +
      item('Status', statusBadge(inst) +
        (inst.status_as_of ? '<span class="fresh"> as of <b>' + esc(F.humanDate(inst.status_as_of)) + '</b></span>' : '')) +
      item('Next date', next
        ? esc(F.humanDate(next.date, next.date_precision)) +
          '<span class="v-sub">' + esc(taxLabel(IX, next.event_type)) + '</span>'
        : '<span class="none">nothing further recorded</span>') +
      item('Competent authority', auths.length
        ? esc(auths[0].institution.short_name) +
          (auths.length > 1 ? '<span class="v-sub">and ' + (auths.length - 1) + ' more — see below</span>' : '')
        : '<span class="none">not established in this dataset</span>') +
      item('Sanction ceiling', ceilingTxt ? esc(ceilingTxt) : '<span class="none">none recorded</span>', true) +
    '</dl>' +
    (inst.status_note ? '<p class="inst-statusnote">' + esc(inst.status_note) + '</p>' : '') +
    '</div>';
}

function whatItDoes(inst) {
  const d = inst.dna;
  if (!d) return '';
  return section('what', 'What it does',
    '<p class="inst-objective">' + esc(tr(inst.id + '.dna.objective', d.objective)) + '</p>' +
    (d.risk_logic ? '<div class="inst-logic"><span class="k">How it allocates obligations</span>' +
      '<p>' + esc(tr(inst.id + '.dna.risk_logic', d.risk_logic)) + '</p></div>' : '') +
    '<dl class="meta-grid">' +
      ['regulated_actor', 'protected_party', 'territorial_scope', 'implementation_model',
       'enforcement_mechanism'].map((dim) =>
        '<div class="meta-item"><dt>' + esc(tr('dna:' + dim + '.label', taxLabel(IX, 'dna:' + dim))) + '</dt>' +
        '<dd class="v">' + cell(dim, inst, IX, {}) + '</dd></div>').join('') +
    '</dl>');
}

function datesSection(inst) {
  const evs = datesFor(inst, IX);
  if (!evs.length) {
    return section('dates', 'Key dates', empty('No dated events',
      'No timeline event references this instrument. That is a gap in the dataset, not a statement that nothing is scheduled.'));
  }
  const rows = evs.map((e) => {
    const past = F.isPast(e.date);
    return '<li class="ip-tl-item' + (past ? ' past' : '') + '">' +
      '<span class="ip-tl-date">' + esc(F.humanDate(e.date, e.date_precision)) +
        (String(e.date_precision || '').split(':').pop() !== 'day'
          ? '<span class="ip-tl-prec">' + esc(String(e.date_precision).split(':').pop()) + ' precision</span>' : '') +
      '</span>' +
      '<span class="ip-tl-body">' +
        '<span class="ip-tl-type" data-e="' + esc(String(e.event_type).split(':').pop()) + '">' +
          esc(taxLabel(IX, e.event_type)) + '</span>' +
        '<b>' + esc(tr(e.id + '.obligation', e.obligation || taxLabel(IX, e.event_type))) + '</b>' +
        (e.required_action ? '<span class="ip-tl-why"><i>What it requires:</i> ' + esc(e.required_action) + '</span>' : '') +
        (e.requires_verification ? '<span class="badge" data-st="unresolved">date unverified</span>' : '') +
      '</span></li>';
  }).join('');
  return section('dates', 'Key dates',
    '<p>Entry into force, application and transposition are different events and are kept apart. ' +
    'A date at month precision is shown as a month rather than invented as a day.</p>' +
    '<ol class="ip-tl">' + rows + '</ol>' +
    '<p class="src-line"><a href="index.html#annex-a">The whole calendar, filterable →</a></p>');
}

function appliesSection(inst) {
  const rules = (DB.applicability.rules || []).filter((r) => r.instrument === inst.id);
  if (!rules.length) {
    return section('applies', 'Who it applies to', empty('No rules recorded',
      'The applicability engine holds no rule for this instrument yet. Absence of a rule is absence of ' +
      'knowledge, not evidence that the instrument does not reach you.') +
      '<p class="src-line"><a href="applies.html">Answer three questions instead →</a></p>');
  }
  const rows = rules.map((r) => {
    const c = r.conditions || {};
    const cond = ['actor', 'activity', 'territory', 'sector']
      .filter((k) => c[k] && c[k].length)
      .map((k) => '<span class="cond"><i>' + k + '</i> ' +
        c[k].map((v) => esc(taxLabel(IX, v))).join(' or ') + '</span>').join('');
    const out = String(r.outcome || '').split(':').pop();
    return '<article class="ip-rule">' +
      '<h3><span class="badge" data-st="' +
        (out === 'applies' ? 'verified' : out === 'likely' ? 'provisional' : 'secondary') + '">' +
        esc(taxLabel(IX, r.outcome)) + '</span></h3>' +
      '<div class="ip-rule-cond">' + (cond || '<span class="none">no condition recorded</span>') + '</div>' +
      '<p>' + esc(r.rationale) + '</p>' +
      ((r.exemptions || []).length
        ? '<p class="ip-rule-ex"><i>Exemptions:</i> ' + r.exemptions.map(esc).join(' · ') + '</p>' : '') +
      freshness(r.last_verified) +
      '</article>';
  }).join('');
  return section('applies', 'Who it applies to',
    '<p>' + rules.length + ' rule' + (rules.length === 1 ? '' : 's') +
    ' in the dataset turn on this instrument. They are conditions, not a test: the engine ranks them ' +
    'against what you actually answer, and downgrades rather than excludes where a question is left blank.</p>' +
    '<div class="ip-rules">' + rows + '</div>' +
    '<p class="src-line"><a href="applies.html?instrument=' + esc(inst.id) + '">Run these against your situation →</a></p>');
}

function provisionsSection(inst) {
  const provs = inst.provisions || [];
  if (!provs.length) {
    return section('provisions', 'Key provisions', empty('No provisions recorded',
      'No article of this instrument has been entered into the dataset. The obligations it imposes are ' +
      'therefore described here only in general terms, and the applicability rules for it cannot point at articles.'));
  }
  const anchors = new Set((inst.dna && inst.dna.obligation_anchor) || []);
  const rows = provs.map((p) => {
    const on = (p.obligation_on || []).map((a) => esc(taxLabel(IX, a))).join(' · ');
    return '<tr class="' + (anchors.has(p.id) ? 'is-anchor' : '') + '">' +
      '<th scope="row" data-label="Article"><span class="mono">Art. ' + esc(p.number) + '</span>' +
        (anchors.has(p.id) ? '<span class="badge" data-st="verified">load-bearing</span>' : '') + '</th>' +
      '<td data-label="Heading"><b>' + esc(p.heading || '') + '</b>' +
        (p.summary ? '<span class="p-sum">' + esc(p.summary) + '</span>' : '') +
        (p.requires_verification
          ? '<span class="badge" data-st="unresolved">article number not confirmed against the consolidated text</span>'
          : '') + '</td>' +
      '<td data-label="Binds">' + (on || '<span class="none">not recorded</span>') + '</td>' +
      '</tr>';
  }).join('');
  return section('provisions', 'Key provisions',
    '<p>' + provs.length + ' provision' + (provs.length === 1 ? '' : 's') +
    ' recorded. This is what the dataset holds, not the whole instrument — an article that is not here ' +
    'has not been entered, which is a different statement from its not existing.</p>' +
    '<div class="t-scroll"><table class="t-rec prov-table"><thead><tr>' +
      '<th scope="col">Article</th><th scope="col">Heading</th><th scope="col">Binds</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>');
}

function enforcementSection(inst) {
  const recs = (DB.enforcement.enforcement || []).filter((r) => r.instrument === inst.id);
  if (!recs.length) {
    return section('enforcement', 'Enforcement', empty('No enforcement recorded',
      'This dataset holds no enforcement action under this instrument. That is what the record says; ' +
      'it is not a finding that none has been taken.') +
      '<p class="src-line"><a href="enforcement.html">The whole observatory →</a></p>');
  }
  /* announced is a sum of what was announced; collected is not a sum at all,
     because a record that cannot settle whether money moved is not a zero */
  const announced = recs.reduce((n, r) => n + (r.fine_eur || 0), 0);
  const unknownPay = recs.filter((r) => String(r.payment_status || '').endsWith('unknown')).length;

  const cards = recs
    .sort((a, b) => String(b.decision_date || '').localeCompare(String(a.decision_date || '')))
    .map((r) => {
      const stages = derive(r, IX);
      const auth = IX.institution.get(r.authority);
      const act = String(r.action_status || '').split(':').pop();
      const st = act === 'final' ? 'verified'
        : act === 'annulled' || act === 'withdrawn' ? 'historical'
        : act === 'appealed' || act === 'announced' ? 'provisional' : 'neutral';
      return '<article class="ip-enf-card">' +
        '<header><h3>' + esc(r.entity) + '</h3>' +
          '<span class="badge" data-st="' + st + '">' + esc(taxLabel(IX, r.action_status)) + '</span></header>' +
        '<div class="ip-enf-figs">' +
          '<div class="numstat"><b>' + esc(r.fine_eur ? F.eur(r.fine_eur) : '—') + '</b><span>announced</span></div>' +
          '<div class="numstat" data-tone="' +
            (String(r.payment_status).endsWith('collected') || String(r.payment_status).endsWith('paid') ? '' : 'unknown') +
            '"><b>' + esc(taxLabel(IX, r.payment_status)) + '</b><span>payment</span></div>' +
          '<div class="numstat"><b>' + esc(r.decision_date ? F.humanDate(r.decision_date) : 'no decision') +
            '</b><span>decision</span></div>' +
        '</div>' +
        '<dl class="meta-grid">' +
          '<div class="meta-item"><dt>Authority</dt><dd class="v">' +
            esc(auth ? auth.short_name : r.authority) + '</dd></div>' +
          '<div class="meta-item"><dt>Issue</dt><dd class="v">' + esc(r.action || 'not recorded') + '</dd></div>' +
          '<div class="meta-item"><dt>Legal basis</dt><dd class="v mono">' +
            ((r.legal_basis || []).map((p) => esc(String(p).split(':').pop().replace('art-', 'Art. '))).join(' · ')
              || 'not recorded') + '</dd></div>' +
        '</dl>' +
        /* the pipeline is derived per record and each stage carries the rule
           that produced it, so a dark stage can be interrogated rather than
           guessed at. Unknown is rendered distinctly from not-reached. */
        '<div class="ip-enf-pipe">' + stages.map((s) => {
          const meta = STAGES.find((x) => x.id === s.id) || { short: s.id };
          return '<span class="ip-pipe-step" data-s="' + esc(String(s.state).split(':').pop()) + '"' +
            ' title="' + esc(s.note || '') + '">' + esc(meta.short) + '</span>';
        }).join('') + '</div>' +
        (r.judicial && r.judicial.outcome
          ? '<p class="ip-enf-jud"><b>' + esc(r.judicial.forum || 'Court') +
            (r.judicial.date ? ', ' + esc(F.humanDate(r.judicial.date)) : '') + '.</b> ' +
            esc(r.judicial.outcome) + '</p>' : '') +
        '<div class="ev-foot">' +
          '<a class="ev-part" href="enforcement.html#' + esc(r.id) + '">Full record and derivation &rarr;</a>' +
          freshness(r.last_verified) + '</div>' +
        '</article>';
    }).join('');

  return section('enforcement', 'Enforcement',
    '<div class="ip-enf-summary">' +
      '<div class="numstat"><b>' + esc(F.eur(announced)) + '</b><span>announced across ' + recs.length + ' records</span></div>' +
      '<div class="numstat" data-tone="unknown"><b>unknown</b><span>demonstrably collected</span></div>' +
      '<p class="ip-enf-caveat">' + unknownPay + ' of ' + recs.length +
        ' records cannot settle whether money moved. That is not zero, and the announced figure is not a total ' +
        'of anything that has been paid.</p>' +
    '</div>' + '<div class="ip-enf-cards">' + cards + '</div>');
}

function evidenceSection(inst) {
  const claims = (DB.claims.claims || []).filter((c) => (c.instruments || []).includes(inst.id));
  if (!claims.length) {
    return section('evidence', 'Evidence', empty('No claims attached',
      'No claim in the dataset is tagged to this instrument.'));
  }
  const tally = F.gradeTally(claims, IX);
  const order = ['primary', 'official', 'secondary', 'interpretation', 'unresolved'];
  const bar = order.filter((k) => tally[k]).map((k) =>
    '<span class="grade-tally" data-g="' + k + '"><b>' + tally[k] + '</b> ' +
    esc(F.GRADE[k].label) + '</span>').join('');

  /* strongest first: what a reader wants from this section is the best
     available support, and then an honest view of how much of it is thin */
  const sorted = claims.slice().sort((a, b) =>
    order.indexOf(F.evidenceGrade(a, IX).id) - order.indexOf(F.evidenceGrade(b, IX).id));

  return section('evidence', 'Evidence',
    '<p>Every statement this site makes about ' + esc(inst.short_name) +
    ', graded by what actually carries it. The grade is derived on load from the claim type and its ' +
    'sources, never stored, so it cannot drift from what it describes.</p>' +
    '<div class="grade-bar">' + bar + '</div>' +
    '<div class="ev-list">' + sorted.map(evidenceBlock).join('') + '</div>' +
    '<p class="src-line"><a href="bibliography.html">The full bibliography, tiered →</a></p>');
}

function relatedSection(inst) {
  const rels = (DB.instruments.relationships || [])
    .filter((r) => r.from === inst.id || r.to === inst.id);
  const auths = authoritiesFor(inst.id, IX);
  const terms = (DB.glossary.terms || []).filter((t) => (t.instruments || []).includes(inst.id));

  const relList = rels.length ? rels.map((r) => {
    const otherId = r.from === inst.id ? r.to : r.from;
    const other = IX.instrument.get(otherId);
    return '<li><a href="instrument.html?id=' + esc(otherId) + '">' +
      esc(other ? other.short_name : otherId) +
      '<span class="n">' + esc(taxLabel(IX, r.kind)) + '</span></a></li>';
  }).join('') : '<li class="none">none recorded</li>';

  const authList = auths.length ? auths.slice(0, 6).map((a) =>
    '<li><a href="institutions.html#' + esc(a.institution.id) + '">' + esc(a.institution.short_name) +
    '<span class="n">' + esc(taxLabel(IX, a.role)) + (a.exclusive ? ' · exclusive' : '') + '</span></a></li>').join('')
    : '<li class="none">not established</li>';

  const termList = terms.length ? terms.map((t) =>
    '<li><a href="index.html#gloss-' + esc(String(t.id).replace(/^gl-/, '')) + '">' + esc(t.term) + '</a></li>').join('')
    : '<li class="none">none</li>';

  const part = inst.brief_part
    ? '<li><a href="index.html#' + esc(inst.brief_part) + '">Read the analysis in the brief</a></li>'
    : '<li class="none">no Part of the brief covers this instrument directly</li>';

  return section('related', 'Related',
    '<p>Every one of these is an edge in the data, not a hand-written link list: change the record and ' +
    'this section changes with it.</p>' +
    '<div class="rel-grid">' +
      '<div class="rel-col"><h3>Instruments</h3><ul>' + relList + '</ul></div>' +
      '<div class="rel-col"><h3>Institutions</h3><ul>' + authList + '</ul></div>' +
      '<div class="rel-col"><h3>Defined terms</h3><ul>' + termList + '</ul></div>' +
      '<div class="rel-col"><h3>In the brief</h3><ul>' + part +
        '<li><a href="instruments.html#' + esc(inst.id) + '">Compare against other instruments</a></li></ul></div>' +
    '</div>');
}

/* ---------------------------------------------------------- scaffolding */

function section(id, title, body) {
  return '<section class="section" id="sec-' + id + '"><h2>' + esc(title) + '</h2>' + body + '</section>';
}
function empty(head, body) {
  return '<div class="state" data-kind="empty"><h3>' + esc(head) + '</h3><p>' + esc(body) + '</p></div>';
}

const SECTIONS = [
  ['what', 'Overview'], ['dates', 'Key dates'], ['applies', 'Applies to'],
  ['provisions', 'Provisions'], ['enforcement', 'Enforcement'],
  ['evidence', 'Evidence'], ['related', 'Related'],
];

function subnav() {
  return '<nav class="subnav" aria-label="Sections of this instrument">' +
    SECTIONS.map(([id, label], i) =>
      '<a href="#sec-' + id + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + esc(label) + '</a>').join('') +
    '</nav>';
}

/* the section nav follows the reading position, on one shared frame rather
   than a listener per section */
function spy() {
  const links = [...document.querySelectorAll('.subnav a')];
  const targets = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!targets.length) return;
  let ticking = false;
  const paint = () => {
    ticking = false;
    const y = window.scrollY + 140;
    let cur = 0;
    targets.forEach((t, i) => { if (t.offsetTop <= y) cur = i; });
    links.forEach((a, i) => {
      if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(paint); }
  }, { passive: true });
  paint();
}

/* ---------------------------------------------------------- boot */

function chooser(list) {
  return '<div class="page-head"><h1>Instruments</h1>' +
    '<p class="lede">Every instrument the dataset holds a record for. The comparison view puts any set of ' +
    'them side by side; this is the way in to one of them on its own.</p></div>' +
    '<ul class="inst-list">' + list.map((i) =>
      '<li><a href="instrument.html?id=' + esc(i.id) + '">' +
        '<b>' + esc(i.short_name) + '</b>' +
        '<span class="il-full">' + esc(i.full_name || '') + '</span>' +
        '<span class="il-meta">' + statusBadge(i) + ' <span class="mono">' + kindLine(i).replace(/<[^>]+>/g, '') +
        '</span></span></a></li>').join('') + '</ul>';
}

async function boot() {
  const mount = document.getElementById('instrumentPage');
  let db;
  try {
    db = await loadAll(['taxonomy', 'instruments', 'institutions', 'sources', 'claims',
      'timeline', 'enforcement', 'applicability', 'glossary']);
  } catch (e) {
    renderError(mount, e, () => boot());
    return;
  }
  DB = db;
  IX = index(db);
  OVERLAY = await loadOverlay();
  setOverlay(OVERLAY);

  const id = new URLSearchParams(location.search).get('id');
  const inst = id ? IX.instrument.get(id) : null;

  if (!inst) {
    const list = [...new Set([...IX.instrument.values()])]
      .filter((i) => i.scope_class === 'scope:core' || i.dna)
      .sort((a, b) => a.short_name.localeCompare(b.short_name));
    if (id) {
      mount.innerHTML = '<div class="page-head"><h1>No such instrument</h1>' +
        '<p class="lede">Nothing in the dataset has the id <span class="mono">' + esc(id) + '</span>. ' +
        'It may have been renamed — ids are permanent by rule, so this is more likely a typo in the link.</p></div>' +
        chooser(list).replace(/^<div class="page-head">[\s\S]*?<\/div>/, '');
    } else {
      mount.innerHTML = chooser(list);
    }
    document.title = 'Instruments — The European Legal Framework for the Digital World';
    return;
  }

  document.title = inst.short_name + ' — The European Legal Framework for the Digital World';
  document.body.dataset.crumb = inst.short_name;
  const crumb = document.querySelector('.crumbs [aria-current="page"]');
  if (crumb) crumb.textContent = inst.short_name;

  mount.innerHTML =
    headSection(inst) + subnav() +
    whatItDoes(inst) + datesSection(inst) + appliesSection(inst) +
    provisionsSection(inst) + enforcementSection(inst) +
    evidenceSection(inst) + relatedSection(inst);

  spy();

  /* deep links land on the section, not near it */
  if (location.hash) {
    const t = document.querySelector(location.hash);
    if (t) t.scrollIntoView({ block: 'start' });
  }
}

boot();
