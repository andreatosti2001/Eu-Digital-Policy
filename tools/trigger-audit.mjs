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
 *   T-01  sources are reference objects                       BACKLOG rule-v1-sources
 *   T-02  ≥1 `for: scope` reference, supports:direct, to a tier-1 text,
 *         with a structural locator                           ERROR on a rule with any object reference;
 *                                                             BACKLOG rule-scope-basis-missing otherwise
 *   T-03  condition_provisions covers every dimension the conditions use,
 *         each id a provision of the rule's instrument or of one an edge
 *         connects to it                                      ERROR where present;
 *                                                             BACKLOG rule-condition-provisions-missing
 *   T-04  each exemption an object with a text and a structural basis
 *                                                             ERROR on objects; BACKLOG rule-exemption-v1
 *   T-05  each threshold key ends in its comparator (ERROR) and has a
 *         threshold_basis                                     BACKLOG rule-threshold-basis-missing
 *   T-06  likely / possible ⇒ depends_on non-empty            ERROR
 *   T-07  last_verified present and ISO (ERROR); after the audit date
 *         (WARNING VERIFIED_AFTER_AS_OF)
 *   T-08  no applies / likely rule on an instrument that binds nobody:
 *         pre-adoption, repealed, adopted or published        ERROR
 *   T-09  the rule's instrument is not excluded (ERROR) or watched (WARNING)
 *   T-10  the stored dates hold every application date the obligations
 *         derive (js/regulatory-model.js)                     BACKLOG rule-dates-not-derived
 *   T-11  outcome:applies with every application date after the audit
 *         date                                                WARNING APPLIES_BEFORE_DATE
 *
 * ERROR is a defect in the tree on every date, so T-07's date half and T-11,
 * which turn on the date asked, are WARNINGs (SESSION 30's exit-code rule;
 * the precedent is tools/register-audit.mjs VERIFIED_AFTER_AS_OF). BACKLOG is
 * counted and named and never fails the run, and only the 33 rules that
 * existed when the check was written may sit in it (RULES_V1, like
 * register-audit.mjs's frozen lists): a rule added after is held to every
 * check in full, because adding rules waits until the 33 pass (Phase 3).
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
import { structural } from './register-audit.mjs';

/* The rules in data/applicability.json on 28 Oct 2026, when this check was
   written. A rule leaves the list in the session that brings it to the v2
   standard; the list only shrinks. */
export const RULES_V1 = Object.freeze(['ap-gdpr-01', 'ap-gdpr-02', 'ap-gdpr-03', 'ap-gdpr-04', 'ap-dsa-01',
  'ap-dsa-02', 'ap-dsa-03', 'ap-dsa-04', 'ap-dsa-05', 'ap-dma-01', 'ap-dma-02', 'ap-dma-03', 'ap-dma-04',
  'ap-ai-act-01', 'ap-ai-act-02', 'ap-ai-act-03', 'ap-ai-act-04', 'ap-ai-act-05', 'ap-ai-act-06', 'ap-ai-act-07',
  'ap-data-act-01', 'ap-data-act-02', 'ap-data-act-03', 'ap-data-act-04', 'ap-nis2-01', 'ap-nis2-02', 'ap-nis2-03',
  'ap-dora-01', 'ap-dora-02', 'ap-cra-01', 'ap-pld-01', 'ap-eidas2-01', 'ap-cross-01']);

export const BACKLOG_CODES = Object.freeze(['rule-v1-sources', 'rule-scope-basis-missing',
  'rule-condition-provisions-missing', 'rule-exemption-v1', 'rule-threshold-basis-missing', 'rule-dates-not-derived']);

/* A state in which an instrument binds nobody (T-08). */
const BINDS_NOBODY = new Set([...PRE_ADOPTION, 'status:repealed', 'status:adopted', 'status:published']);
const APPLICATION = new Set(['event:application', 'event:compliance-deadline', 'event:transposition']);
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
 * @returns { total, errors, warnings, backlog: {code: [rule ids]}, publishable: [ids], by_outcome }
 */
export function triggerAudit(db, asOf) {
  const errors = [];
  const warnings = [];
  const backlog = Object.fromEntries(BACKLOG_CODES.map((c) => [c, []]));
  const ix = index(db);
  const rules = arr(db.applicability?.rules);
  const rels = arr(db.instruments?.relationships);
  const notPublishable = new Set();

  for (const r of rules) {
    const w = `applicability/${r.id}`;
    const v1 = RULES_V1.includes(r.id);
    const inst = ix.instrument.get(r.instrument);
    /* a finding that a v1 rule carries as backlog; a rule added after is held in full */
    const owe = (code, msg) => {
      if (v1) backlog[code].push(r.id);
      else errors.push(`${msg} — a rule added after 28 Oct 2026 is held to it in full`);
    };
    const t05 = (m) => { errors.push(m); notPublishable.add(r.id); };
    const owePub = (code, msg) => { owe(code, msg); notPublishable.add(r.id); };

    /* T-01 · reference objects */
    const refs = arr(r.sources);
    const objs = refs.filter(isRef);
    if (refs.some((s) => !isRef(s))) owePub('rule-v1-sources', `T-01 ${w}: a bare source id`);

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
      else owePub('rule-scope-basis-missing', `T-02 ${w}: no scope reference`);
    }

    /* T-03 · every condition resolves to the provision that defines it */
    const dims = Object.keys(r.conditions || {});
    if (r.condition_provisions == null) owePub('rule-condition-provisions-missing', `T-03 ${w}: no condition_provisions`);
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
    if (ex.some((e) => typeof e === 'string')) owePub('rule-exemption-v1', `T-04 ${w}: an exemption is a bare string`);
    for (const e of ex.filter(isRef)) {
      /* the effect's vocabulary and the basis's resolution are validate.mjs's */
      if (!EFFECTS.has(e.effect) || arr(e.basis).some((b) => !isRef(b) || !ix.source.get(b.source_id))) notPublishable.add(r.id);
      if (typeof e.text !== 'string' || e.text.trim().length < 10
        || !arr(e.basis).some((b) => isRef(b) && b.supports === 'supports:direct' && structural(b.locator)))
        t05(`T-04 ${w}: an exemption object without text, or without a direct reference with a structural locator`);
    }

    /* T-05 · thresholds: the comparator now, the basis as backlog */
    const keys = Object.keys((r.conditions || {}).thresholds || {});
    for (const k of keys) if (!COMPARATOR.test(k)) t05(`T-05 ${w}: threshold key "${k}" does not end in _gt, _gte, _lt or _lte`);
    if (keys.some((k) => !(r.threshold_basis && arr(r.threshold_basis[k]).length)))
      owePub('rule-threshold-basis-missing', `T-05 ${w}: a threshold with no threshold_basis`);

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
    if (missing.length) owe('rule-dates-not-derived', `T-10 ${w}: dates omit ${missing.join(', ')}`);

    /* T-11 · "applies" before anything applies */
    if (asOf && r.outcome === 'outcome:applies') {
      const app = arr(r.dates).map((d) => ix.event.get(d)).filter((e) => e && APPLICATION.has(e.event_type));
      if (app.length && app.every((e) => e.date > asOf))
        warnings.push(`APPLIES_BEFORE_DATE ${w}: outcome applies, and every application date (${app.map((e) => e.date).join(', ')}) is after the audit date ${asOf}`);
    }
  }

  const byOutcome = {};
  for (const r of rules) byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + 1;
  return {
    total: rules.length,
    errors,
    warnings,
    backlog,
    publishable: rules.filter((r) => !notPublishable.has(r.id)).map((r) => r.id),
    by_outcome: byOutcome,
  };
}
