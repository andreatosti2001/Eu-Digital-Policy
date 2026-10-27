/**
 * tools/register-audit.mjs — the exclusion register and the watchlist, checked.
 *
 * Roadmap item 2.1 (v2 Session 4, 27 Oct 2026). The register and the
 * watchlist are not files: they are the instrument records whose
 * `scope_decision` says `excluded` or `watched`, listed by js/routes.js
 * coverage(). These are the checks docs/V2-DATA-DESIGN.md §6.3 ties to them,
 * as §1.5 and §3 define them:
 *
 *   M-03  the disposition agrees with scope_class
 *   M-04  a scope decision is present where it is required, and complete
 *   M-05  covered ⇒ a page of its own; excluded or watched ⇒ none
 *   M-06  an excluded or watched record refers the reader to a source with a URL
 *   M-07  status_basis: a direct reference with a structural locator, of the
 *         tier its state requires (S-03)
 *   R-01  a watched record whose watch_for event has happened
 *
 * ERROR is a defect in the tree on every date — so M-04's "last_verified ≤
 * as-of", which turns on the date asked, is a WARNING (VERIFIED_AFTER_AS_OF).
 * WARNING is printed, and a new
 * one is a finding. BACKLOG is counted and named, never fails the run, and
 * applies only to the records that existed on 25 Oct 2026 (the frozen lists
 * below, like PAGE_PUBLISHED): every record added after that date is held to
 * the rule in full. Each backlog becomes an ERROR at the checkpoint
 * docs/V2-DATA-DESIGN.md §4.3 names for it — `scope-decision-missing` and
 * `status-basis-missing` at the end of item 2.6. Closing one is a one-line
 * change to its list, made in the session that does the verification work.
 *
 * Pure: reads the records it is given and the clock it is given. Nothing here
 * reads the network or writes anything.
 */

import { index } from '../js/data.js';
import { coverage, hasEntityPage } from '../js/routes.js';
import { locatorQuality } from '../js/evidence-model.js';

/* The core records that existed on 25 Oct 2026, before a scope decision
   existed. Required of every core record added after it (M-04). */
export const SCOPE_DECISION_BACKLOG = Object.freeze(['gdpr', 'dsa', 'dma', 'ai-act', 'data-act', 'nis2', 'cer',
  'dora', 'cra', 'ai-omnibus', 'data-omnibus']);

/* The 24 records that existed on 25 Oct 2026, before status_basis existed (M-07). */
export const STATUS_BASIS_BACKLOG = Object.freeze(['gdpr', 'dsa', 'dma', 'ai-act', 'data-act', 'nis2', 'cer',
  'dora', 'cra', 'ai-omnibus', 'data-omnibus', 'pld', 'gdpr-procedural', 'dga', 'eprivacy', 'eidas2',
  'cloud-ai-development-act', 'ecommerce-directive', 'nis1', 'chips-act', 'ai-liability-directive', 'charter',
  'tfeu', 'teu']);

export const DISPOSITIONS = Object.freeze(['included', 'excluded', 'watched']);

/* A procedural stage, or a withdrawal, may rest on a tier-2 procedure file;
   every other state is a fact of an adopted text and needs tier 1
   (docs/v2-design/status-labels.json x-verification; rule S-03). */
export const PROCEDURAL_STATES = Object.freeze(['status:proposal', 'status:parliament-position',
  'status:council-position', 'status:trilogue', 'status:political-agreement', 'status:stalled', 'status:withdrawn']);

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const arr = (x) => (Array.isArray(x) ? x : []);

/** Structural: what js/evidence-model.js calls structural for a claim
 *  (article, recital, annex …), plus a procedure file's key event, which
 *  docs/v2-design/map.schema.json counts among the structural locators. */
export function structural(locator) {
  return locatorQuality(locator) === 'structural' || /^\s*Key events?\b/i.test(String(locator || ''));
}

/** Does this reference set hold a direct, structurally located reference to
 *  a source of one of these tiers? */
function hasDirect(refs, ix, tiers) {
  return arr(refs).some((r) => r && r.supports === 'supports:direct' && structural(r.locator)
    && tiers.includes((ix.source.get(r.source_id) || {}).tier));
}

/**
 * @param db    the datasets, as js/data.js loadAll() returns them
 * @param asOf  YYYY-MM-DD; R-01 and the last_verified test read it, never the clock
 * @returns { errors, warnings, backlog: {code: [ids]}, register, watchlist, by_coverage }
 */
export function registerAudit(db, asOf) {
  const errors = [];
  const warnings = [];
  const backlog = { 'scope-decision-missing': [], 'status-basis-missing': [] };
  const ix = index(db);
  const crit = new Set(arr(db.taxonomy?.inclusion_criterion).map((t) => t.id));
  const instruments = arr(db.instruments?.instruments);

  for (const i of instruments) {
    const w = `instruments/${i.id}`;
    const d = i.scope_decision;
    const cov = coverage(i);

    /* M-03 · the disposition agrees with the scope class */
    if (d) {
      if (!DISPOSITIONS.includes(d.disposition)) errors.push(`M-03 ${w}: scope_decision.disposition "${d.disposition}" is none of ${DISPOSITIONS.join(', ')}`);
      else if ((d.disposition === 'included') !== (i.scope_class === 'scope:core'))
        errors.push(`M-03 ${w}: disposition "${d.disposition}" with ${i.scope_class} — included and core go together`);
      else if ((d.disposition === 'excluded') !== (i.scope_class === 'scope:out-of-scope'))
        errors.push(`M-03 ${w}: disposition "${d.disposition}" with ${i.scope_class} — excluded and out-of-scope go together`);
    }

    /* M-04 · present where required, and complete */
    if (!d) {
      if (i.scope_class === 'scope:out-of-scope') errors.push(`M-04 ${w}: out of scope with no scope_decision — the register must say why`);
      else if (i.scope_class === 'scope:core') {
        if (SCOPE_DECISION_BACKLOG.includes(i.id)) backlog['scope-decision-missing'].push(i.id);
        else errors.push(`M-04 ${w}: a core record added after 25 Oct 2026 with no scope_decision`);
      }
    } else {
      if (!(typeof d.approved_on === 'string' && ISO.test(d.approved_on)))
        errors.push(`M-04 ${w}: approved_on is ${JSON.stringify(d.approved_on)} — a decision enters data/ only on the date of its approval in docs/ROADMAP-v2.md §8`);
      if (!arr(d.criterion).length) errors.push(`M-04 ${w}: no criterion clause`);
      for (const c of arr(d.criterion)) if (!crit.has(c)) errors.push(`M-04 ${w}: criterion "${c}" is not an inclusion_criterion term`);
      if (typeof d.reason !== 'string' || d.reason.trim().length < 20) errors.push(`M-04 ${w}: no reason`);
      if (/^\s*DRAFT\b/.test(String(d.reason || ''))) errors.push(`M-04 ${w}: the reason is still marked DRAFT`);
      const watched = d.disposition === 'watched';
      if (watched && !(d.watch_for && typeof d.watch_for.description === 'string' && d.watch_for.description.trim()))
        errors.push(`M-04 ${w}: watched with no watch_for — the event that reopens the decision`);
      if (!watched && d.watch_for != null) errors.push(`M-04 ${w}: watch_for on a decision that is not watched`);
      if (!arr(d.sources).length || arr(d.sources).some((s) => !s || typeof s !== 'object'))
        errors.push(`M-04 ${w}: scope_decision.sources must be reference objects`);
      else if (!arr(d.sources).some((s) => s.supports === 'supports:direct' && structural(s.locator)))
        errors.push(`M-04 ${w}: no direct reference with a structural locator among the decision's sources`);
      if (!(typeof d.last_verified === 'string' && ISO.test(d.last_verified))) errors.push(`M-04 ${w}: scope_decision.last_verified missing`);
      /* a decision verified after the audit date is a property of the date
         asked, not of the tree, so it is a WARNING: an ERROR here is a defect
         on every date (SESSION 30's exit-code rule; the author's decision of
         27 Oct 2026, docs/ROADMAP-v2.md §8) */
      else if (asOf && d.last_verified > asOf) warnings.push(`VERIFIED_AFTER_AS_OF ${w}: scope_decision.last_verified ${d.last_verified} is after the audit date ${asOf}`);
    }

    /* M-05 · coverage against the page gate */
    const page = hasEntityPage(i, ix);
    if (cov === 'covered' && !page) errors.push(`M-05 ${w}: covered (core) without a page of its own`);
    if ((cov === 'excluded' || cov === 'watched') && page) errors.push(`M-05 ${w}: ${cov}, and the page gate gives it a page`);

    /* M-06 · the external referral leads somewhere */
    if (cov === 'excluded' || cov === 'watched') {
      if (!arr(d.refer_to).length) errors.push(`M-06 ${w}: ${cov} with no refer_to — the reader is sent nowhere`);
      for (const s of arr(d.refer_to)) {
        const src = ix.source.get(s);
        if (!src) errors.push(`M-06 ${w}: refers to ${s}, which is not a source`);
        else if (!src.url) errors.push(`M-06 ${w}: refers to ${s}, which has no url`);
      }
    }

    /* M-07 · the status rests on a reference of the tier its state needs */
    if (i.legislative_status != null) {
      const tiers = PROCEDURAL_STATES.includes(i.legislative_status) ? ['tier:1', 'tier:2'] : ['tier:1'];
      const ok = hasDirect(i.status_basis, ix, tiers);
      if (!ok) {
        if (STATUS_BASIS_BACKLOG.includes(i.id) && !arr(i.status_basis).length) backlog['status-basis-missing'].push(i.id);
        else errors.push(`M-07 ${w}: ${i.legislative_status} without a direct ${tiers.join(' or ')} reference with a structural locator in status_basis`);
      }
    }

    /* R-01 · a watched decision whose event has happened */
    if (cov === 'watched' && d.watch_for && d.watch_for.event_type) {
      const hit = arr(i.milestones).map((m) => ix.event.get(m)).filter(Boolean)
        .filter((e) => e.event_type === d.watch_for.event_type && (!asOf || String(e.date) <= asOf));
      for (const e of hit) warnings.push(`WATCH_TRIGGERED ${w}: ${e.event_type} on ${e.date} (${e.id}) — the decision must be reopened`);
    }
  }

  const named = (c) => instruments.filter((i) => coverage(i) === c).map((i) => i.id);
  const byCoverage = {};
  for (const i of instruments) byCoverage[coverage(i)] = (byCoverage[coverage(i)] || 0) + 1;
  return { errors, warnings, backlog, register: named('excluded'), watchlist: named('watched'), by_coverage: byCoverage };
}
