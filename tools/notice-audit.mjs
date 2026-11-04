/**
 * tools/notice-audit.mjs — the factual clauses of the notice on applies.html, checked (P-07).
 *
 * v2 Session 22, item 22.4 (c) (4 Nov 2026; docs/ROADMAP-v2.md §8). The notice (`applies.notice`,
 * D-2, rewritten in v2 Session 18 when docs/PHASE-3-AUDIT.md F-01 was closed) states four things about
 * the rules that the records and the code can carry. Until this module nothing held the first of them:
 * tools/validate.mjs admits `locator: null` and T-02 needs only one scope locator, so the notice could
 * turn false while every check passed — which is how F-01 happened.
 *
 *   N-1  "for every source it cites, what that source supports and where in it the rule is found":
 *        every reference on a rule — sources[], exemptions[].basis[], threshold_basis — carries a
 *        `supports` and a non-empty locator                                              ERROR
 *   N-2  "each condition names the provision that defines it": every dimension a rule's conditions
 *        use (thresholds aside, which T-05 holds) names a provision in condition_provisions  ERROR
 *   N-3  "the evidence audit that checks every claim checks these rules too":
 *        tools/evidence-audit.mjs imports and calls triggerAudit                         ERROR
 *   N-4  "Each rule shows the date it was last read against its Articles": every rule carries
 *        last_verified, and js/applies.js renders it                                     ERROR
 *   N-0  the English notice is the text these clauses were read from, exactly; a rewording fails
 *        until this module is re-reviewed against the new words                         ERROR
 *
 * NOT CHECKED, and cannot be: the fifth sentence, "a change in the law after that date reaches a rule
 * only when a person reads it again", which is about a process; the wording, which is the author's
 * (D-2); and the translations, which stay `pending_translation` in i18n/locales.json.
 *
 * Pure: reads what it is given. No network, no clock, no write.
 */

/** The notice's English markup, exactly as N-1…N-4 were read from it on 4 Nov 2026. */
export const NOTICE_TEXT = "<b>These rules are checked to the standard the site\'s claims are.</b> Each rule says, for every source it cites, what that source supports and where in it the rule is found; each condition names the provision that defines it; and the evidence audit that checks every claim checks these rules too. Each rule shows the date it was last read against its Articles, and a change in the law after that date reaches a rule only when a person reads it again. Read a result as a pointer to the law, not as a verified reading of it.";

const arr = (x) => (Array.isArray(x) ? x : []);
const filled = (s) => typeof s === 'string' && s.trim().length > 0;

/**
 * @param {{db:object, appliesHtml:?string, evidenceAuditSrc:?string, appliesJsSrc:?string}} q
 *   a source that could not be read is null, and is reported as a WARNING, not skipped silently
 * @returns { errors, warnings }
 */
export function noticeAudit({ db, appliesHtml, evidenceAuditSrc, appliesJsSrc }) {
  const errors = [];
  const warnings = [];

  /* N-0 · the text the clauses were read from */
  if (appliesHtml == null) warnings.push('NOTICE_NOT_READ applies.html could not be read: the notice text was not checked');
  else {
    const m = appliesHtml.match(/<p data-i18n="applies\.notice">([\s\S]*?)<\/p>/);
    if (!m) errors.push('N-0 applies.html: no element carries data-i18n="applies.notice"');
    else if (m[1] !== NOTICE_TEXT)
      errors.push('N-0 applies.html: the notice is not the text N-1…N-4 were read from — re-read tools/notice-audit.mjs against the new words, then update NOTICE_TEXT on the author\'s word');
  }

  for (const r of arr(db.applicability?.rules)) {
    const w = `applicability/${r.id}`;
    /* N-1 · every reference says what it supports and where */
    const refs = [
      ...arr(r.sources).map((s, n) => [`sources[${n}]`, s]),
      ...arr(r.exemptions).flatMap((e, i) => arr(e?.basis).map((b, n) => [`exemptions[${i}].basis[${n}]`, b])),
      ...Object.entries(r.threshold_basis ?? {}).flatMap(([k, v]) => arr(v).map((b, n) => [`threshold_basis.${k}[${n}]`, b])),
    ];
    for (const [where, s] of refs) {
      if (!s || typeof s !== 'object') { errors.push(`N-1 ${w}: ${where} is not a reference object, so it cannot say what it supports or where`); continue; }
      if (!filled(s.supports)) errors.push(`N-1 ${w}: ${where} (${s.source_id}) says nothing about what it supports — the notice says every source does`);
      if (!filled(s.locator)) errors.push(`N-1 ${w}: ${where} (${s.source_id}) has no locator — the notice says every source says where in it the rule is found`);
    }
    /* N-2 · every condition names its provision */
    for (const d of Object.keys(r.conditions ?? {}).filter((k) => k !== 'thresholds'))
      if (!arr(r.condition_provisions?.[d]).length) errors.push(`N-2 ${w}: condition "${d}" names no provision — the notice says each condition does`);
    /* N-4, the data half */
    if (!filled(r.last_verified)) errors.push(`N-4 ${w}: no last_verified — the notice says each rule shows the date it was last read`);
  }

  /* N-3 · the evidence audit runs the rule checks */
  if (evidenceAuditSrc == null) warnings.push('NOTICE_NOT_READ tools/evidence-audit.mjs could not be read: N-3 was not checked');
  else if (!/import \{[^}]*\btriggerAudit\b[^}]*\} from '\.\/trigger-audit\.mjs'/.test(evidenceAuditSrc) || !/\btriggerAudit\(/.test(evidenceAuditSrc))
    errors.push('N-3 tools/evidence-audit.mjs no longer imports and calls triggerAudit — the notice says the evidence audit checks the rules');

  /* N-4, the page half */
  if (appliesJsSrc == null) warnings.push('NOTICE_NOT_READ js/applies.js could not be read: N-4 was not checked on the page');
  else if (!/humanDate\(r\.last_verified\)/.test(appliesJsSrc))
    errors.push('N-4 js/applies.js no longer renders a rule\'s last_verified — the notice says each rule shows it');

  return { errors, warnings };
}
