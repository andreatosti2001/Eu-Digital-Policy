/* ============================================================
   THE INSTRUMENT VIEW — the renderer, and nothing else.

   Until 27 Sep 2026 this lived inside js/instrument-page.js, which
   also fetched the data and booted on import, so nothing but a
   browser could call it. It is now pure: it takes the built index
   and returns markup. Two callers, one renderer:

     · js/instrument-page.js, in the browser, on every load;
     · tools/_footer.mjs, in Node, which writes the same markup into
       instruments/<id>/index.html so the page's substance is in the
       HTML a crawler fetches, not only in the DOM a script builds
       (docs/SEO-AUDIT-2026-09-27.md, A2).

   Because there is one renderer, the static page and the rendered
   page cannot say different things — with ONE deliberate exception.
   A few fragments depend on the reader's clock: which date is
   "next", whether an article "applies since" or "applies from",
   how many days ago a record was checked, how far an enforcement
   pipeline has travelled. A committed file cannot contain those
   without going stale on its own (AUDIT F-15), so when `today` is
   null — the generator's case — each of them renders in a form that
   is true on every date, and the browser fills in the rest on load.

   Every section is read from the canonical JSON. Nothing is stored
   for this view and nothing is typed into it: the authority is
   derived from institutions.json, the dates from timeline.json, the
   enforcement from enforcement.json, the applicability from
   applicability.json, and the evidence from claims.json against
   sources.json. If a dataset holds nothing for a section, the
   section says so — the one thing it must never do is imply that an
   empty dataset means an empty world.
   ============================================================ */

import { label as taxLabel } from './data.js';
import * as F from './format.js';
import { authoritiesFor, datesFor, cell, setOverlay, sanctionCeiling } from './dna.js';
import { provisionApplication, provisionDeadlines } from './regulatory-model.js';
import { derive, STAGES, actionsOnly, inactionsOnly } from './pipeline.js';
import { sourceList, gradeChip, freshness } from './evidence-view.js';
import { interactionsFor } from './interactions.js';
import { instrumentHref, knownAs, displayName, legalTextSource } from './routes.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The render context. Set once per renderInstrument() call; the section
   functions read it, exactly as they read module globals before the split. */
let IX = null, DB = null, OVERLAY = {}, TODAY = null, ROOT = '', H = {};
const tr = (k, fb) => (OVERLAY && OVERLAY[k]) || fb;
const to = (path) => ROOT + path;

/* ---------------------------------------------------------- headings

   Each section is headed by the question a reader arrives with ("When does
   the DMA apply?") rather than by a catalogue label, because that is the
   sentence a search or answer engine matches a page against. The label a
   reader scans for stays after the question, and the subnav keeps the short
   labels. A proposal creates no obligations (kindLine says so), so its
   questions are asked in the conditional. Built from the record's own names:
   the common name only where knownAs() finds it backed by an alias. */
const isProposal = (inst) => inst.kind === 'kind:proposal';
function headings(inst) {
  const name = 'the ' + inst.short_name;
  const prop = isProposal(inst);
  return {
    what: 'What does the ' + (knownAs(inst) || inst.short_name) + (prop ? ' propose?' : ' do?'),
    dates: (prop ? 'Where does ' + name + ' stand?' : 'When does ' + name + ' apply?') + ' Key dates',
    applies: prop ? 'Who would ' + name + ' affect?' : 'Who does ' + name + ' apply to?',
    provisions: (prop ? 'What would ' + name + ' change?' : 'What does ' + name + ' require?') + ' Key provisions',
    enforcement: prop ? 'How would ' + name + ' be enforced?' : 'How is ' + name + ' enforced?',
    evidence: 'What is this page based on? Evidence and sources',
    interactions: 'How does ' + name + ' interact with other EU laws?',
  };
}

/** "Last verified …", with the age and the review flag only when there is
 *  a clock to measure them against. */
function verified(iso) {
  if (TODAY) return freshness(iso);
  if (!iso) return '<span class="fresh"><span class="fresh-flag">no verification date recorded</span></span>';
  return '<span class="fresh">Last verified <b>' + esc(F.humanDate(iso)) + '</b></span>';
}

/* ---------------------------------------------------------- status */

/* The scalar status is not the whole answer and the site's own first rule is
   that entry into force is not application. The pill therefore always travels
   with the as-of date and, where the instrument has milestones, with the
   sentence that says why the scalar is insufficient. */
export function statusBadge(inst, ix = IX) {
  const st = String(inst.legislative_status || '').split(':').pop();
  const map = {
    'in-force': 'verified', applicable: 'verified', 'partly-applicable': 'provisional',
    proposal: 'provisional', stalled: 'provisional', withdrawn: 'historical',
    repealed: 'historical', amended: 'provisional',
  };
  return '<span class="badge" data-st="' + (map[st] || 'neutral') + '">' +
    esc(taxLabel(ix, inst.legislative_status)) + '</span>';
}

export function kindLine(inst, ix = IX) {
  const k = String(inst.kind || '').split(':').pop();
  if (k === 'proposal') return 'Proposal · <b>not law</b> · creates no obligations';
  if (k === 'directive') return 'Directive · requires national transposition';
  if (k === 'regulation') return 'Regulation · directly applicable';
  return esc(taxLabel(ix, inst.kind) || k);
}

/** One row of an instrument list — the instruments page's static index
 *  and instrument.html's fallback both use it, so it reads one way. */
export function instrumentListItem(inst, ix, root = '') {
  return '<li><a href="' + esc(instrumentHref(inst, ix, root)) + '">' +
    '<b>' + esc(inst.short_name) + '</b>' +
    '<span class="il-full">' + esc(inst.full_name || '') + '</span>' +
    '<span class="il-meta">' + statusBadge(inst, ix) + ' <span class="mono">' + kindLine(inst, ix).replace(/<[^>]+>/g, '') +
    '</span></span></a></li>';
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
    /* words in adjacent chips are separated by a space as well as by the
       layout, so extracted text and a screen reader do not run them together
       (audit of 21 Oct 2026 item 15) */
    '<div class="ev-kicker">' + gradeChip(claim, IX) + ' ' +
      '<span class="badge" data-st="' + (type === 'law' ? 'verified'
        : type === 'fact' ? 'neutral' : 'interpretation') + '">' + esc(type) + '</span>' +
      (F.isUnverified(claim, IX) ? ' <span class="badge" data-st="unresolved">unverified</span>' : '') +
    '</div>' +
    '<p class="ev-claim">' + esc(claim.statement) + '</p>' +
    '<div class="ev-src">' + sourceList(claim, IX, 'compact') + '</div>' +
    '<div class="ev-foot">' +
      (claim.brief_part
        ? '<a class="ev-part" href="' + esc(to('index.html#' + claim.brief_part)) + '">Read it in the brief &rarr;</a> '
        : '') +
      verified(claim.last_verified) +
    '</div></div>';
}

/* ---------------------------------------------------------- sections */

function headSection(inst) {
  const auths = authoritiesFor(inst.id, IX);
  const dates = datesFor(inst, IX);
  const ceiling = inst.dna && inst.dna.sanction_ceiling;
  const ceilingTxt = ceiling
    ? [ceiling.pct_global_turnover != null ? ceiling.pct_global_turnover + '% of global turnover' : null,
       ceiling.fixed_eur != null ? F.eur(ceiling.fixed_eur) : null].filter(Boolean).join(' / ')
    : null;
  /* the common name, only where the <h1> does not already carry it */
  const aka = displayName(inst) === inst.short_name ? knownAs(inst) : null;
  const text = legalTextSource(inst, IX);

  const item = (k, v, mono) =>
    '<div class="meta-item"><dt>' + esc(k) + '</dt><dd class="v' + (mono ? ' mono' : '') + '">' + v + '</dd></div>';

  /* "Next" is a question about today. Without a clock the item says what
     is true on every date — how many dated events there are — and the
     browser replaces it with the next one on load. */
  let dateItem;
  if (TODAY) {
    const next = dates.find((e) => !F.isPast(e.date));
    dateItem = item('Next date', next
      ? esc(F.humanDate(next.date, next.date_precision)) +
        '<span class="v-sub">' + esc(taxLabel(IX, next.event_type)) + '</span>'
      : '<span class="none">nothing further recorded</span>');
  } else {
    dateItem = item('Key dates', dates.length
      ? '<a href="#sec-dates">' + dates.length + ' dated event' + (dates.length === 1 ? '' : 's') + '</a>'
      : '<span class="none">none recorded</span>');
  }

  return '<div class="page-head">' +
    '<p class="section-kicker">' + kindLine(inst) +
      (inst.celex ? ' · <span class="mono">CELEX ' + esc(inst.celex) + '</span>' : '') + '</p>' +
    /* the common name a reader searches for heads the page ("Digital Markets
       Act (DMA)"); the "Known as" line then has nothing left to add */
    '<h1>' + esc(tr(inst.id + '.short_name', null) || displayName(inst)) + '</h1>' +
    '<p class="lede">' + esc(tr(inst.id + '.full_name', inst.full_name)) + '</p>' +
    (aka || text
      ? '<p class="inst-ident">' +
        (aka ? 'Known as the <b>' + esc(aka) + '</b>.' : '') +
        (aka && text ? ' ' : '') +
        (text ? 'Official text: <a class="ext" href="' + esc(text.url) + '" rel="noopener">' +
          esc(text.title || text.publisher_name || text.id) + '</a>' +
          '<span class="evi-tier" data-tier="' + esc(text.tier) + '">' + esc(F.tierWord(text)) + '</span>' : '') +
        '</p>'
      : '') +
    '<dl class="meta-grid">' +
      item('Status', statusBadge(inst) +
        (inst.status_as_of ? '<span class="fresh"> as of <b>' + esc(F.humanDate(inst.status_as_of)) + '</b></span>' : '')) +
      dateItem +
      item('Competent authority', auths.length
        ? esc(auths[0].institution.short_name) +
          /* a space between the elements, so extracted text and a screen reader
             read "authorities and 1 more", not "authoritiesand" (audit item 15) */
          (auths.length > 1 ? ' <span class="v-sub">and ' + (auths.length - 1) + ' more — see below</span>' : '')
        : '<span class="none">not established in this dataset</span>') +
      /* the same three states as the comparison table and "In short" (js/dna.js
         sanctionCeiling): an amount, "no amount recorded" with a note below, or
         "not established" */
      item('Sanction ceiling', ceilingTxt ? esc(ceilingTxt)
        : sanctionCeiling(inst.dna).state === 'no-amount' ? '<span class="none">no amount recorded</span>'
        : '<span class="none">not established</span>', true) +
    '</dl>' +
    (inst.status_note ? '<p class="inst-statusnote">' + esc(inst.status_note) + '</p>' : '') +
    '</div>';
}

/* ---------------------------------------------------------- in short

   The answer first: six lines a reader can act on before the sections,
   each DERIVED from the record those sections render in full — the
   objective, who it binds and protects, the load-bearing articles, the
   dates that decide when it bites, and the sanction ceiling — through the
   same cell() formatters as the comparison table. Nothing is typed for
   it, so it cannot say what the sections below do not, and where the
   record holds nothing it says "not established" rather than a guess.
   The dates are the ones true on every date (entry into force,
   application, transposition); "next" is added only when there is a
   clock, exactly as in the head. */
const ANCHOR_DATES = new Set(['event:entry-into-force', 'event:application', 'event:transposition']);

/* The rows, as label, value and the link that follows it. One derivation
   for the box and for instrumentFaq() below, so the structured data the
   route model declares cannot say what the box does not. `section` names
   the section of the page each row expands. */
function shortRows(inst) {
  const d = inst.dna;
  const prop = isProposal(inst);
  const evs = datesFor(inst, IX);
  let key = evs.filter((e) => ANCHOR_DATES.has(e.event_type));
  if (!key.length) key = evs.slice(0, 1);
  const when = (e) => esc(taxLabel(IX, e.event_type)) + ' <b>' + esc(F.humanDate(e.date, e.date_precision)) + '</b>';
  const next = TODAY ? evs.find((e) => !F.isPast(e.date)) : null;
  const rest = evs.length - key.length;
  const enf = actionsOnly(DB.enforcement.enforcement).filter((r) => r.instrument === inst.id).length;
  return [
    { section: 'what', label: 'Objective', value: esc(tr(inst.id + '.dna.objective', d.objective)), more: '' },
    { section: 'applies', label: prop ? 'Would bind' : 'Who it binds', value: cell('regulated_actor', inst, IX), more: '' },
    { section: 'applies', label: prop ? 'Would protect' : 'Who it protects', value: cell('protected_party', inst, IX), more: '' },
    { section: 'provisions', label: prop ? 'Core provisions' : 'Core obligations', value: cell('obligations', inst, IX),
      more: ' <a href="#sec-provisions">key provisions →</a>' },
    { section: 'dates', label: 'Key dates',
      value: (key.length ? key.map(when).join(' · ') : '<span class="none">none recorded</span>') +
        (next ? ' · next: ' + when(next) : ''),
      more: evs.length ? ' <a href="#sec-dates">' +
        (rest > 0 ? '+' + rest + ' more dated event' + (rest === 1 ? '' : 's') : 'the timeline') + ' →</a>' : '' },
    { section: 'enforcement', label: 'Sanction ceiling', value: cell('sanction', inst, IX),
      more: ' <a href="#sec-enforcement">' +
        (enf ? enf + ' enforcement record' + (enf === 1 ? '' : 's') : 'enforcement') + ' →</a>' },
  ];
}

function inShort(inst) {
  if (!inst.dna) return '';
  const row = (k, v) => '<li><strong>' + esc(k) + ':</strong> ' + v + '</li>';
  return '<section class="inst-short" aria-labelledby="sec-short-h">' +
    '<h2 id="sec-short-h">In short: what you need to know</h2><ul>' +
    shortRows(inst).map((r) => row(r.label, r.value + r.more)).join('') +
    '</ul></section>';
}

/* Text as tools/seo-audit.mjs read() takes it from the page: tags become
   spaces, entities are decoded, whitespace collapses. */
const plain = (html) => String(html).replace(/<[^>]+>/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
const NOT_ESTABLISHED = /^<span class="(dna-unknown|none)">/;

/**
 * The "In short" box as questions and answers, for the FAQPage the route
 * model declares (tools/seo.mjs). Each question is the heading of the
 * section the rows expand, up to its question mark, so it is on the page;
 * each answer is made of the rows' text exactly as a crawler reads it,
 * a note set apart as its own sentence. A row the record does not
 * establish is left out rather than answered "not established": the
 * structured data may be silent, it must not offer an unknown as an
 * answer. Clock-free, like the static page.
 * @returns {{ question: string, parts: string[] }[]}
 */
export function instrumentFaq(inst, ctx) {
  if (!inst.dna) return [];
  IX = ctx.ix; DB = ctx.db; OVERLAY = {}; TODAY = null; ROOT = ctx.root || '';
  H = headings(inst);
  setOverlay(OVERLAY);
  const out = [];
  for (const r of shortRows(inst)) {
    if (NOT_ESTABLISHED.test(r.value)) continue;
    const [main, ...notes] = r.value.split('<span class="dna-note">');
    const parts = [r.label + ': ' + plain(main), ...notes.map(plain)].filter(Boolean);
    const question = H[r.section].replace(/\?.*$/, '?');
    const q = out.find((x) => x.question === question);
    if (q) q.parts.push(...parts); else out.push({ question, parts });
  }
  return out;
}

function whatItDoes(inst) {
  const d = inst.dna;
  if (!d) return '';
  return section('what', H.what,
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
    return section('dates', H.dates, empty('No dated events',
      'No timeline event references this instrument. That is a gap in the dataset, not a statement that nothing is scheduled.'));
  }
  const rows = evs.map((e) => {
    const past = TODAY ? F.isPast(e.date) : false;
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
  return section('dates', H.dates,
    '<p>Entry into force, application and transposition are different events and are kept apart. ' +
    'A date at month precision is shown as a month rather than invented as a day.</p>' +
    '<ol class="ip-tl">' + rows + '</ol>' +
    '<p class="src-line"><a href="' + esc(to('index.html#annex-a')) + '">The whole compliance calendar, filterable →</a></p>');
}

function appliesSection(inst) {
  const rules = (DB.applicability.rules || []).filter((r) => r.instrument === inst.id);
  if (!rules.length) {
    return section('applies', H.applies, empty('No rules recorded',
      'The applicability engine holds no rule for this instrument yet. Absence of a rule is absence of ' +
      'knowledge, not evidence that the instrument does not reach you.') +
      '<p class="src-line"><a href="' + esc(to('applies.html')) + '">Answer three questions instead →</a></p>');
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
      verified(r.last_verified) +
      '</article>';
  }).join('');
  return section('applies', H.applies,
    '<p>' + rules.length + ' rule' + (rules.length === 1 ? '' : 's') +
    ' in the dataset turn on this instrument. They are conditions, not a test: the engine ranks them ' +
    'against what you actually answer, and downgrades rather than excludes where a question is left blank.</p>' +
    '<div class="ip-rules">' + rows + '</div>' +
    '<p class="src-line"><a href="' + esc(to('applies.html?instrument=' + inst.id)) + '">Run these against your situation →</a></p>');
}

/* When THIS article applies — derived from timeline.json by
   js/regulatory-model.js, never stored. A date inherited from the whole
   act says so, because "the Regulation applies from X" and "this Article
   applies from X" are different statements that happen to share a date.
   Without a clock every date is read as "applies from", which is how the
   acts themselves phrase it and is true before and after the date. */
function appliesCell(p, inst) {
  const a = provisionApplication(p.id, inst, IX, TODAY || '');
  if (a.state === 'not-established') return '<span class="none">no application date recorded for this article</span>';
  const when = (e) => esc(F.humanDate(e.date, e.date_precision));
  const amended = (e) => e.introduced_by && IX.instrument.get(e.introduced_by)
    ? ' <span class="v-sub">inserted by ' + esc(IX.instrument.get(e.introduced_by).short_name) + '</span>' : '';
  const verb = { applies: 'Applies since', scheduled: 'Applies from', general: 'Applies since', 'general-scheduled': 'Applies from' }[a.state];
  let html = '<span class="p-when" data-state="' + esc(a.state) + '">' + verb + ' <b>' + when(a.event) + '</b></span>' +
    amended(a.event) +
    (a.via === 'instrument' ? ' <span class="v-sub">the instrument’s general date; nothing specific to this article is recorded</span>' : '') +
    /* a tranche may cover the whole article or only part of it, and the
       record cannot say which: the event's own text, under Key dates, does */
    (a.via === 'provision' ? ' <span class="v-sub">a date set for named provisions: what it covers is under <a href="#sec-dates">Key dates →</a></span>' : '');
  for (const e of a.later) html += ' <span class="v-sub">then from ' + when(e) + ': ' + esc(taxLabel(IX, e.event_type).toLowerCase()) + amended(e) + '</span>';
  for (const d of provisionDeadlines(p.id, inst, IX)) html += ' <span class="v-sub">deadline ' + when(d) + ': ' + esc(d.required_action || d.obligation || '') + '</span>';
  return html;
}

function provisionsSection(inst) {
  const provs = inst.provisions || [];
  if (!provs.length) {
    return section('provisions', H.provisions, empty('No provisions recorded',
      'No article of this instrument has been entered into the dataset. The obligations it imposes are ' +
      'therefore described here only in general terms, and the applicability rules for it cannot point at articles.'));
  }
  const anchors = new Set((inst.dna && inst.dna.obligation_anchor) || []);
  const rows = provs.map((p) => {
    /* an Article that obliges a Union institution names it (obligation_on_institution) */
    const inst2 = p.obligation_on_institution && IX.institution.get(p.obligation_on_institution);
    const on = [...(p.obligation_on || []).map((a) => esc(taxLabel(IX, a))),
      ...(inst2 ? [esc(inst2.short_name)] : [])].join(' · ');
    return '<tr class="' + (anchors.has(p.id) ? 'is-anchor' : '') + '">' +
      '<th scope="row" data-label="Article"><span class="mono">Art. ' + esc(p.number) + '</span>' +
        (anchors.has(p.id) ? ' <span class="badge" data-st="verified">load-bearing</span>' : '') + '</th>' +
      '<td data-label="Heading"><b>' + esc(p.heading || '') + '</b>' +
        (p.summary ? '<span class="p-sum">' + esc(p.summary) + '</span>' : '') +
        (p.requires_verification
          ? '<span class="badge badge-long" data-st="unresolved">article number not confirmed against the consolidated text</span>'
          : '') + '</td>' +
      '<td data-label="Binds">' + (on || '<span class="none">not recorded</span>') + '</td>' +
      '<td data-label="Applies">' + appliesCell(p, inst) + '</td>' +
      '</tr>';
  }).join('');
  return section('provisions', H.provisions,
    '<p>' + provs.length + ' provision' + (provs.length === 1 ? '' : 's') +
    ' recorded. This is what the dataset holds, not the whole instrument — an article that is not here ' +
    'has not been entered, which is a different statement from its not existing.</p>' +
    '<div class="t-scroll"><table class="t-rec prov-table"><thead><tr>' +
      '<th scope="col">Article</th><th scope="col">Heading</th><th scope="col">Binds</th><th scope="col">Applies</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>');
}

/* A recorded absence of action is not an enforcement action: it is
   listed under its own heading, dated, and counted nowhere (js/pipeline.js
   isInaction, audit of 21 Oct 2026 item 11). */
function inactionHTML(inst) {
  const none = inactionsOnly(DB.enforcement.enforcement).filter((r) => r.instrument === inst.id);
  if (!none.length) return '';
  return '<div class="ip-enf-none"><h3>Recorded inaction</h3>' +
    '<p class="ip-enf-caveat">Not an enforcement action, and not counted above: each of these records says that ' +
      'no action had been found when it was last checked, which is true only at that date.</p><ul>' +
    none.map((r) => '<li><b>' + esc(r.entity) + '.</b> ' + esc(r.action || '') +
      ' <a href="' + esc(to('enforcement.html#' + r.id)) + '">Record &rarr;</a> ' + verified(r.last_verified) + '</li>').join('') +
    '</ul></div>';
}

function enforcementSection(inst) {
  const recs = actionsOnly(DB.enforcement.enforcement).filter((r) => r.instrument === inst.id);
  if (!recs.length) {
    return section('enforcement', H.enforcement, empty('No enforcement recorded',
      'This dataset holds no enforcement action under this instrument. That is what the record says; ' +
      'it is not a finding that none has been taken.') + inactionHTML(inst) +
      '<p class="src-line"><a href="' + esc(to('enforcement.html')) + '">The whole enforcement observatory →</a></p>');
  }
  /* announced is a sum of what was announced; collected is not a sum at all,
     because a record that cannot settle whether money moved is not a zero */
  const announced = recs.reduce((n, r) => n + (r.fine_eur || 0), 0);
  const unknownPay = recs.filter((r) => String(r.payment_status || '').endsWith('unknown')).length;

  const cards = recs
    .slice()
    .sort((a, b) => String(b.decision_date || '').localeCompare(String(a.decision_date || '')))
    .map((r) => {
      const auth = IX.institution.get(r.authority);
      const act = String(r.action_status || '').split(':').pop();
      const st = act === 'final' ? 'verified'
        : act === 'annulled' || act === 'withdrawn' ? 'historical'
        : act === 'appealed' || act === 'announced' ? 'provisional' : 'neutral';
      /* the pipeline is derived per record and each stage carries the rule
         that produced it, so a dark stage can be interrogated rather than
         guessed at. Unknown is rendered distinctly from not-reached. Its
         first stage asks whether the law applied yet — a question about
         today — so it is drawn only when there is a today to ask it of. */
      const pipe = TODAY
        ? '<div class="ip-enf-pipe">' + derive(r, IX).map((s) => {
          const meta = STAGES.find((x) => x.id === s.id) || { short: s.id };
          return '<span class="ip-pipe-step" data-s="' + esc(String(s.state).split(':').pop()) + '"' +
            ' title="' + esc(s.note || '') + '">' + esc(meta.short) + '</span>';
        }).join('') + '</div>'
        : '';
      return '<article class="ip-enf-card">' +
        '<header><h3>' + esc(r.entity) + '</h3>' +
          '<span class="badge" data-st="' + st + '">' + esc(taxLabel(IX, r.action_status)) + '</span></header>' +
        '<div class="ip-enf-figs">' +
          '<div class="numstat"><b>' + esc(r.fine_eur ? F.eur(r.fine_eur) : '—') + '</b> <span>announced</span></div>' +
          '<div class="numstat" data-tone="' +
            (String(r.payment_status).endsWith('collected') || String(r.payment_status).endsWith('paid') ? '' : 'unknown') +
            '"><b>' + esc(taxLabel(IX, r.payment_status)) + '</b> <span>payment</span></div>' +
          '<div class="numstat"><b>' + esc(r.decision_date ? F.humanDate(r.decision_date) : 'no decision') +
            '</b> <span>decision</span></div>' +
        '</div>' +
        '<dl class="meta-grid">' +
          '<div class="meta-item"><dt>Authority</dt><dd class="v">' +
            esc(auth ? auth.short_name : r.authority) + '</dd></div>' +
          '<div class="meta-item"><dt>Issue</dt><dd class="v">' + esc(r.action || 'not recorded') + '</dd></div>' +
          '<div class="meta-item"><dt>Legal basis</dt><dd class="v mono">' +
            ((r.legal_basis || []).map((p) => esc(String(p).split(':').pop().replace('art-', 'Art. '))).join(' · ')
              || 'not recorded') + '</dd></div>' +
        '</dl>' +
        pipe +
        (r.judicial && r.judicial.outcome
          ? '<p class="ip-enf-jud"><b>' + esc(r.judicial.forum || 'Court') +
            (r.judicial.date ? ', ' + esc(F.humanDate(r.judicial.date)) : '') + '.</b> ' +
            esc(r.judicial.outcome) + '</p>' : '') +
        '<div class="ev-foot">' +
          '<a class="ev-part" href="' + esc(to('enforcement.html#' + r.id)) + '">Full record and derivation &rarr;</a>' +
          verified(r.last_verified) + '</div>' +
        '</article>';
    }).join('');

  return section('enforcement', H.enforcement,
    '<div class="ip-enf-summary">' +
      '<div class="numstat"><b>' + esc(F.eur(announced)) + '</b> <span>announced across ' + esc(F.plural(recs.length, 'record')) + '</span></div>' +
      '<div class="numstat" data-tone="unknown"><b>unknown</b> <span>demonstrably collected</span></div>' +
      '<p class="ip-enf-caveat">' + unknownPay + ' of ' + F.plural(recs.length, 'record') +
        ' cannot settle whether money moved. That is not zero, and the announced figure is not a total ' +
        'of anything that has been paid.</p>' +
    '</div>' + '<div class="ip-enf-cards">' + cards + '</div>' + inactionHTML(inst));
}

function evidenceSection(inst) {
  const claims = (DB.claims.claims || []).filter((c) => (c.instruments || []).includes(inst.id));
  const recordLine = '<p class="fresh">The instrument record itself was last verified on <b>' +
    esc(inst.last_verified ? F.humanDate(inst.last_verified) : 'no recorded date') +
    '</b>; every claim below carries its own date.</p>';
  if (!claims.length) {
    return section('evidence', H.evidence, recordLine + empty('No claims attached',
      'No claim in the dataset is tagged to this instrument.'));
  }
  const tally = F.gradeTally(claims, IX);
  const order = F.GRADE_ORDER;
  const bar = order.filter((k) => tally[k]).map((k) =>
    '<span class="grade-tally" data-g="' + k + '"><b>' + tally[k] + '</b> ' +
    esc(F.GRADE[k].label) + '</span>').join('');

  /* strongest first: what a reader wants from this section is the best
     available support, and then an honest view of how much of it is thin */
  const sorted = claims.slice().sort((a, b) =>
    order.indexOf(F.evidenceGrade(a, IX).id) - order.indexOf(F.evidenceGrade(b, IX).id));

  return section('evidence', H.evidence,
    '<p>Every statement this site makes about ' + esc(inst.short_name) +
    ', graded by what actually carries it. The grade is derived from the claim type and its ' +
    'sources, never stored, so it cannot drift from what it describes.</p>' +
    recordLine +
    '<div class="grade-bar">' + bar + '</div>' +
    '<div class="ev-list">' + sorted.map(evidenceBlock).join('') + '</div>' +
    '<p class="src-line"><a href="' + esc(to('bibliography.html')) + '">The full bibliography and the evidence method →</a></p>');
}

function interactionsSection(inst) {
  const blocks = interactionsFor(inst.id, IX, ROOT);
  if (!blocks) {
    return section('interactions', H.interactions, empty('No interaction recorded',
      'No cross-instrument relationship touching ' + esc(inst.short_name) + ' has been recorded in ' +
      'this build. That is a gap in the dataset, not a finding that this instrument stands alone.'));
  }
  const n = (IX.relationship || []).filter((r) => r.from === inst.id || r.to === inst.id).length;
  return section('interactions', H.interactions,
    '<p>' + n + ' recorded interaction' + (n === 1 ? '' : 's') + ' with other instruments — each with a ' +
    'direction, the provisions that carry it and its own sources. Direction is preserved as recorded: ' +
    'an instrument that amends another is not the same as one amended by it.</p>' +
    '<div class="ix-list ix-inline">' + blocks + '</div>');
}

function relatedSection(inst) {
  const rels = (DB.instruments.relationships || [])
    .filter((r) => r.from === inst.id || r.to === inst.id);
  const auths = authoritiesFor(inst.id, IX);
  const terms = (DB.glossary.terms || []).filter((t) => (t.instruments || []).includes(inst.id));

  /* each related instrument links to its own page, and the label says how
     the two are related, so the link reads as the relationship it is */
  /* one entry per related instrument: two edges to the same instrument
     (the AI Act overlaps the GDPR on Art. 22 and on impact assessments)
     are two records, but one place to go, so they are one link that says
     how many edges it stands for (audit of 21 Oct 2026 item 15) */
  const byOther = new Map();
  for (const r of rels) {
    const otherId = r.from === inst.id ? r.to : r.from;
    if (!byOther.has(otherId)) byOther.set(otherId, []);
    byOther.get(otherId).push(r);
  }
  const relList = byOther.size ? [...byOther].map(([otherId, edges]) => {
    const other = IX.instrument.get(otherId);
    const kinds = [...new Set(edges.map((r) => taxLabel(IX, r.kind)))].join(' · ');
    return '<li><a href="' + esc(instrumentHref(otherId, IX, ROOT)) + '">' +
      esc(other ? other.short_name : otherId) +
      '<span class="n">' + esc(kinds) + (edges.length > 1 ? ' · ' + esc(F.plural(edges.length, 'edge')) : '') + '</span></a></li>';
  }).join('') : '<li class="none">none recorded</li>';

  const authList = auths.length ? auths.slice(0, 6).map((a) =>
    '<li><a href="' + esc(to('institutions.html#' + a.institution.id)) + '">' + esc(a.institution.short_name) +
    '<span class="n">' + esc(taxLabel(IX, a.role)) + (a.exclusive ? ' · exclusive' : '') + '</span></a></li>').join('')
    : '<li class="none">not established</li>';

  const termList = terms.length ? terms.map((t) =>
    '<li><a href="' + esc(to('index.html#gloss-' + String(t.id).replace(/^gl-/, ''))) + '">' + esc(t.term) + '</a></li>').join('')
    : '<li class="none">none</li>';

  const part = inst.brief_part
    ? '<li><a href="' + esc(to('index.html#' + inst.brief_part)) + '">Read the analysis of ' + esc(inst.short_name) + ' in the brief</a></li>'
    : '<li class="none">no Part of the brief covers this instrument directly</li>';

  return section('related', 'Related',
    '<p>Every one of these is an edge in the data, not a hand-written link list: change the record and ' +
    'this section changes with it.</p>' +
    '<div class="rel-grid">' +
      '<div class="rel-col"><h3>Instruments</h3><ul>' + relList + '</ul></div>' +
      '<div class="rel-col"><h3>Institutions</h3><ul>' + authList + '</ul></div>' +
      '<div class="rel-col"><h3>Defined terms</h3><ul>' + termList + '</ul></div>' +
      '<div class="rel-col"><h3>In the brief</h3><ul>' + part +
        '<li><a href="' + esc(to('instruments.html#' + inst.id)) + '">Compare ' + esc(inst.short_name) + ' with other instruments</a></li></ul></div>' +
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
  ['evidence', 'Evidence'], ['interactions', 'How it interacts'], ['related', 'Related'],
];

function subnav() {
  return '<nav class="subnav" aria-label="Sections of this instrument">' +
    SECTIONS.map(([id, label], i) =>
      '<a href="#sec-' + id + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + esc(label) + '</a>').join(' ') +
    '</nav>';
}

/**
 * The whole view for one instrument.
 * @param {object} inst  the instrument record
 * @param {object} ctx   { ix, db, overlay = {}, today = null, root = '' }
 *   today: 'YYYY-MM-DD' in the browser; null for the static page, which
 *   then states nothing that depends on the reader's clock.
 */
export function renderInstrument(inst, ctx) {
  IX = ctx.ix; DB = ctx.db; OVERLAY = ctx.overlay || {}; TODAY = ctx.today || null; ROOT = ctx.root || '';
  H = headings(inst);
  setOverlay(OVERLAY);
  return headSection(inst) + inShort(inst) + subnav() +
    whatItDoes(inst) + datesSection(inst) + appliesSection(inst) +
    provisionsSection(inst) + enforcementSection(inst) +
    evidenceSection(inst) + interactionsSection(inst) + relatedSection(inst);
}
