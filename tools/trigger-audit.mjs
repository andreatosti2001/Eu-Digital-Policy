/**
 * tools/trigger-audit.mjs — the applicability rules, checked as the claims are.
 *
 * v2 Session 12, item 12.2 (docs/ROADMAP-v2.md §4 Phase 3: "the session that
 * opens Phase 3 starts by extending the check"). The rules behind
 * applies.html are data/applicability.json; the triggers of
 * docs/V2-DATA-DESIGN.md §2 are those rules raised to the claims' standard
 * (docs/v2-design/applicability-rule.schema.json). These are its checks,
 * at the severities the author set (§8, v2 Session 12, question 5):
 *
 *   T-01  sources are reference objects                       ERROR
 *   T-02  ≥1 `for: scope` reference, supports:direct, to a tier-1 text,
 *         with a structural locator                           ERROR
 *   T-03  condition_provisions covers every dimension the conditions use,
 *         each id a provision of the rule's instrument or of one an edge
 *         connects to it                                      ERROR
 *   T-04  each exemption an object with a text and a structural basis
 *                                                             ERROR
 *   T-05  each threshold key ends in its comparator and has a
 *         threshold_basis                                     ERROR
 *   T-06  likely / possible ⇒ depends_on non-empty            ERROR
 *   T-07  last_verified present and ISO (ERROR); after the audit date
 *         (WARNING VERIFIED_AFTER_AS_OF)
 *   T-08  no applies / likely rule on an instrument that binds nobody:
 *         pre-adoption, repealed, adopted or published        ERROR
 *   T-09  the rule's instrument is not excluded (ERROR) or watched (WARNING)
 *   T-10  the stored dates hold every application date the obligations
 *         derive (js/regulatory-model.js)                     ERROR
 *   T-11  outcome:applies with every application date after the audit
 *         date                                                WARNING APPLIES_BEFORE_DATE
 *   T-12  an instrument whose provisions the rule cites changed in law
 *         after the rule was read, on or before the audit date WARNING LAW_CHANGED_SINCE_VERIFIED
 *
 * ERROR is a defect in the tree on every date, so T-07's date half, T-11 and
 * T-12, which turn on the date asked, are WARNINGs (SESSION 30's exit-code
 * rule; the precedent is tools/register-audit.mjs VERIFIED_AFTER_AS_OF).
 *
 * THE FLIP (v2 Session 17, 29 Oct 2026, docs/ROADMAP-v2.md §8, 17.0 question
 * 7). Until then T-01…T-05 and T-10 were BACKLOG for the 33 rules of 28 Oct
 * 2026 that had not yet been read against their Articles (RULES_V1, a list
 * that only shrank) and ERROR for any rule added after. Session 17 brought
 * the last ten to the v2 shape, publishable 33 of 33, and the list was
 * removed with its backlog, as the author decided: every finding of those
 * checks is an ERROR for every rule, and no list remains through which a rule
 * could return to a backlog. Phase 3's entry condition is met (§4).
 *
 * T-12 (v2 Session 17, §8 17.0 question 8a) is one of the two maintenance
 * checks of the plan row of 28 Oct 2026. It notices, from the records alone,
 * that the law a rule cites may have moved since the rule was read: an
 * amending or repealing edge of modality `law` (never `proposed`) whose
 * amending act entered into force or began to apply after the rule's
 * last_verified, or a delegated act, implementing act, judicial event or
 * guidance of the cited instrument in that window. It says where to look;
 * deciding whether the rule must change stays a person's act (D-4, D-5).
 *
 * Whether a reference, a provision or an exemption's effect RESOLVES, and is
 * in its vocabulary, is tools/validate.mjs's to report (v2 Session 13,
 * docs/ROADMAP-v2.md §8, 13.0 question 2); a rule that fails it is still not
 * publishable here, so the derivation never depends on validate having run.
 *
 * `publishable` is derived (§2): a rule with no T-01…T-05 finding of either
 * severity. It is never stored, and evidence-audit.mjs refuses a rule that
 * stores it.
 *
 * Pure: reads the records and the date it is given. No network, no clock,
 * no write.
 */

import { index } from '../js/data.js';
import { coverage } from '../js/routes.js';
import { PRE_ADOPTION, provisionApplication } from '../js/regulatory-model.js';
import { modality } from '../js/map-model.js';
import { structural } from './register-audit.mjs';

/* A state in which an instrument binds nobody (T-08). */
const BINDS_NOBODY = new Set([...PRE_ADOPTION, 'status:repealed', 'status:adopted', 'status:published']);
const APPLICATION = new Set(['event:application', 'event:compliance-deadline', 'event:transposition']);
/* T-12: what changes a text in law, and what changes how it is read (§8, 17.0 question 8a) */
const CHANGES_IN_LAW = new Set(['rel-kind:amends', 'rel-kind:repeals']);
const IN_FORCE = new Set(['event:entry-into-force', 'event:application']);
const CHANGES_READING = new Set(['event:delegated-act', 'event:implementing-act', 'event:judicial', 'event:guidance']);
const SUPPORTS = new Set(['supports:direct', 'supports:partial', 'supports:context']);
const FOR = new Set(['scope', 'obligation', 'date', 'rationale']);
const EFFECTS = new Set(['excludes', 'narrows', 'reinstates']);
const COMPARATOR = /_(gt|gte|lt|lte)$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const arr = (x) => (Array.isArray(x) ? x : []);
const isRef = (s) => !!s && typeof s === 'object';

/** The application events a rule's obligations derive, every tranche included. */
export function derivedDates(rule, ix, asOf) {
  const inst = ix.instrument.get(rule.instrument);
  const out = new Set();
  if (!inst) return out;
  for (const p of arr(rule.obligations)) {
    const a = provisionApplication(p, inst, ix, asOf);
    if (a.event) { out.add(a.event.id); for (const l of a.later) out.add(l.id); }
  }
  return out;
}

/**
 * @param db    the datasets, as js/data.js loadAll() returns them
 * @param asOf  YYYY-MM-DD; T-07 and T-11 read it, never the clock
 * @returns { total, errors, warnings, publishable: [ids], by_outcome }
 */
export function triggerAudit(db, asOf) {
  const errors = [];
  const warnings = [];
  const ix = index(db);
  const rules = arr(db.applicability?.rules);
  const rels = arr(db.instruments?.relationships);
  const events = arr(db.timeline?.events);
  const notPublishable = new Set();

  for (const r of rules) {
    const w = `applicability/${r.id}`;
    const inst = ix.instrument.get(r.instrument);
    const t05 = (m) => { errors.push(m); notPublishable.add(r.id); };

    /* T-01 · reference objects */
    const refs = arr(r.sources);
    const objs = refs.filter(isRef);
    if (refs.some((s) => !isRef(s))) t05(`T-01 ${w}: a bare source id`);

    /* T-02 · a scope reference that can carry the rule. A reference that does
       not resolve, or whose supports or for is outside the vocabulary, is
       tools/validate.mjs's to report (v2 Session 13, 13.0 question 2: one home
       per check); here it only keeps the rule from being publishable. */
    if (objs.some((s) => !ix.source.get(s.source_id) || !SUPPORTS.has(s.supports) || (s.for != null && !FOR.has(s.for))))
      notPublishable.add(r.id);
    const scope = objs.some((s) => s.for === 'scope' && s.supports === 'supports:direct' && structural(s.locator)
      && (ix.source.get(s.source_id) || {}).tier === 'tier:1');
    if (!scope) {
      if (objs.length) t05(`T-02 ${w}: no for:scope, supports:direct reference to a tier-1 text with a structural locator`);
      else t05(`T-02 ${w}: no scope reference`);
    }

    /* T-03 · every condition resolves to the provision that defines it. The dimensions are the
       keys of conditions other than thresholds (the schema's derived `asks`): a threshold has its
       own basis, T-05, and validate.mjs admits no `thresholds` key in condition_provisions.
       v2 Session 15 (29 Oct 2026, docs/ROADMAP-v2.md §8, "T-03 and thresholds"): until then no
       rule with a threshold could pass both checks. */
    const dims = Object.keys(r.conditions || {}).filter((d) => d !== 'thresholds');
    if (r.condition_provisions == null) t05(`T-03 ${w}: no condition_provisions`);
    else {
      const linked = new Set([r.instrument]);
      for (const e of rels) { if (e.from === r.instrument) linked.add(e.to); if (e.to === r.instrument) linked.add(e.from); }
      for (const d of dims) if (!arr(r.condition_provisions[d]).length) t05(`T-03 ${w}: condition "${d}" names no provision`);
      for (const [d, ids] of Object.entries(r.condition_provisions)) for (const p of arr(ids)) {
        if (!ix.provision.get(p)) notPublishable.add(r.id); /* validate.mjs reports it */
        else if (!linked.has(ix.provisionOwner.get(p))) t05(`T-03 ${w}: ${d} → ${p} belongs to an instrument neither this rule's nor connected to it by an edge`);
      }
    }

    /* T-04 · exemptions with an effect and a basis */
    const ex = arr(r.exemptions);
    if (ex.some((e) => typeof e === 'string')) t05(`T-04 ${w}: an exemption is a bare string`);
    for (const e of ex.filter(isRef)) {
      /* the effect's vocabulary and the basis's resolution are validate.mjs's */
      if (!EFFECTS.has(e.effect) || arr(e.basis).some((b) => !isRef(b) || !ix.source.get(b.source_id))) notPublishable.add(r.id);
      if (typeof e.text !== 'string' || e.text.trim().length < 10
        || !arr(e.basis).some((b) => isRef(b) && b.supports === 'supports:direct' && structural(b.locator)))
        t05(`T-04 ${w}: an exemption object without text, or without a direct reference with a structural locator`);
    }

    /* T-05 · thresholds: the comparator and the basis */
    const keys = Object.keys((r.conditions || {}).thresholds || {});
    for (const k of keys) if (!COMPARATOR.test(k)) t05(`T-05 ${w}: threshold key "${k}" does not end in _gt, _gte, _lt or _lte`);
    if (keys.some((k) => !(r.threshold_basis && arr(r.threshold_basis[k]).length)))
      t05(`T-05 ${w}: a threshold with no threshold_basis`);

    /* T-06 · what an uncertain outcome turns on */
    if (['outcome:likely', 'outcome:possible'].includes(r.outcome) && !arr(r.depends_on).length)
      errors.push(`T-06 ${w}: ${r.outcome.split(':')[1]} with no depends_on — what the outcome turns on is unstated`);

    /* T-07 · when the rule was last checked */
    if (!(typeof r.last_verified === 'string' && ISO.test(r.last_verified))) errors.push(`T-07 ${w}: last_verified missing or not YYYY-MM-DD`);
    else if (asOf && r.last_verified > asOf) warnings.push(`VERIFIED_AFTER_AS_OF ${w}: last_verified ${r.last_verified} is after the audit date ${asOf}`);

    /* T-08 · a text that binds nobody cannot apply to anybody */
    if (inst && BINDS_NOBODY.has(inst.legislative_status) && ['outcome:applies', 'outcome:likely'].includes(r.outcome))
      errors.push(`T-08 ${w}: ${r.outcome.split(':')[1]} on ${inst.id}, whose status (${inst.legislative_status.split(':')[1]}) binds nobody`);

    /* T-09 · not a rule on an instrument the site does not cover */
    const cov = inst ? coverage(inst) : null;
    if (cov === 'excluded') errors.push(`T-09 ${w}: a rule on ${inst.id}, which the register excludes`);
    if (cov === 'watched') warnings.push(`RULE_ON_WATCHED ${w}: a rule on ${inst.id}, which is on the watchlist`);

    /* T-10 · the dates the obligations derive are the rule's dates */
    const missing = [...derivedDates(r, ix, asOf || '9999-12-31')].filter((e) => !arr(r.dates).includes(e));
    if (missing.length) errors.push(`T-10 ${w}: dates omit ${missing.join(', ')}`);

    /* T-11 · "applies" before anything applies */
    if (asOf && r.outcome === 'outcome:applies') {
      const app = arr(r.dates).map((d) => ix.event.get(d)).filter((e) => e && APPLICATION.has(e.event_type));
      if (app.length && app.every((e) => e.date > asOf))
        warnings.push(`APPLIES_BEFORE_DATE ${w}: outcome applies, and every application date (${app.map((e) => e.date).join(', ')}) is after the audit date ${asOf}`);
    }

    /* T-12 · the law cited moved after the rule was read */
    if (asOf && typeof r.last_verified === 'string' && ISO.test(r.last_verified)) {
      const since = (e) => e.date > r.last_verified && e.date <= asOf;
      const cited = [...arr(r.obligations), ...Object.values(r.condition_provisions || {}).flatMap(arr)];
      const owners = [...new Set(cited.map((p) => ix.provisionOwner.get(p)).filter(Boolean))];
      for (const I of owners) {
        for (const e of rels.filter((x) => CHANGES_IN_LAW.has(x.kind) && x.to === I && modality(x, ix) === 'law'))
          for (const ev of events.filter((v) => v.instrument === e.from && IN_FORCE.has(v.event_type) && since(v)))
            warnings.push(`LAW_CHANGED_SINCE_VERIFIED ${w}: cites ${I}, ${e.kind === 'rel-kind:repeals' ? 'repealed' : 'amended'} by ${e.from} (${e.id}), whose ${ev.id} (${ev.date}) is after last_verified ${r.last_verified}`);
        for (const ev of events.filter((v) => v.instrument === I && CHANGES_READING.has(v.event_type) && since(v)))
          warnings.push(`LAW_CHANGED_SINCE_VERIFIED ${w}: cites ${I}, whose ${ev.id} (${ev.event_type.split(':')[1]}, ${ev.date}) is after last_verified ${r.last_verified}`);
      }
    }
  }

  const byOutcome = {};
  for (const r of rules) byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + 1;
  return {
    total: rules.length,
    errors,
    warnings,
    publishable: rules.filter((r) => !notPublishable.has(r.id)).map((r) => r.id),
    by_outcome: byOutcome,
  };
}
