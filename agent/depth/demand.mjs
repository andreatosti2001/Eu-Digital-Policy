/* ============================================================
   agent/depth/demand.mjs — the load-bearing test

   The brief's hardest instruction is one sentence: **do not reward
   quantity; prioritise meaningful semantic gaps.** Everything in
   this module exists to make that a mechanism rather than an
   intention.

   COUNTING ABSENCES IS TRIVIAL AND ALREADY DONE. Fifteen instruments
   carry no provisions; thirteen have no applicability rule; seven
   sources are never cited. Those numbers have a home —
   `.agents/skills/data-completeness/scripts/gaps.mjs` computes the
   census, and `tools/validate.mjs` and `tools/freshness.mjs` own the
   unverified and staleness tallies. Restating any of them here would
   be the second home this architecture exists to prevent, and it
   would produce a list of a hundred findings that a reviewer stops
   reading at the tenth.

   WHAT IS NOT TRIVIAL IS DEMAND. A gap is worth reporting when
   something else in the corpus LEANS on the missing thing: a rule
   that tells a reader an act applies to them, a claim that argues
   from a provision, a glossary term that points at a record, a fine
   ceiling stated with nobody to impose it. That is not a judgement
   an agent makes about importance — it is an edge, and
   `agent/detector/graph.mjs` already derives every edge in the
   corpus from the rule that a string equal to a record's id is an
   edge to that record.

   So: **a finding with no demand is not reported.** It is counted as
   suppressed, the count is on the run and in the trace, and the
   reason is stated. That is the opposite of hiding it — a reviewer
   can see that eleven instruments with no provisions were set aside
   because nothing in the corpus asks for one, and that is a more
   useful sentence than eleven findings.

   DEMAND IS NOT IMPORTANCE, AND THIS MODULE DOES NOT PRETEND
   OTHERWISE. An act nothing points at may be the most important
   omission in the corpus; the model simply cannot tell, and saying
   so is the honest position. Every run reports what it suppressed
   and why, so the reader of the report knows the shape of what it
   did not look at.
   ============================================================ */

const arr = (x) => (Array.isArray(x) ? x : []);

/**
 * One thing in the corpus that leans on a missing concept.
 *
 * `weight` is NOT a severity score and never leaves this module as
 * one. It orders findings for presentation, so the reviewer meets
 * the enforcement competence before the unnamed relationship; the
 * contract carries an impact LEVEL, argued in words, and forbids a
 * numeric score by name for exactly this reason.
 *
 * @param {{from:string, from_kind:string, dataset:string, field:string|null,
 *          note:string, weight?:number}} d
 */
export const demand = (d) => ({ weight: 1, field: null, ...d });

/**
 * Demand read straight off the graph: every record that references
 * this one.
 *
 * `kinds` narrows to the record kinds whose dependence actually
 * bears on the question. A claim depending on an instrument is
 * evidence that the brief argues from it; a taxonomy term is not,
 * and a detector that counted enum membership as demand would find
 * demand everywhere and discriminate nothing.
 */
export function demandFromGraph(lens, id, { kinds = null, note } = {}) {
  const seen = new Map();
  for (const e of lens.inbound(id)) {
    if (kinds && !kinds.includes(e.from_kind)) continue;
    if (e.via_wildcard) continue;      // an edge nobody has ever checked (audit F-12)
    if (seen.has(e.from)) continue;
    const node = lens.node(e.from);
    seen.set(e.from, demand({
      from: e.from,
      from_kind: e.from_kind,
      dataset: node?.dataset ?? null,
      field: e.field,
      note: note ? note(e, node) : `${e.from_kind} ${e.from} references it at ${e.field}`,
    }));
  }
  return [...seen.values()];
}

/**
 * The judgement that decides whether a finding is reported at all.
 *
 * A finding arrives with the demand its detector could establish.
 * Nothing else is consulted — not the record's size, not how many
 * siblings share its shape, not whether the id looks important.
 *
 * @returns {{reported:boolean, why:string, weight:number}}
 */
export function assess(finding) {
  const d = arr(finding.demand);

  /* THE CORPUS'S OWN DECLARATION COMES FIRST. `data/taxonomy.json`
     defines scope:referenced as "named and placed, but outside this
     brief's analytical scope". An act the site has said it is not
     analysing, modelled thinly, is the site doing what it said it
     would do. Reporting it would be quantity argued against the
     corpus's stated intent, which is worse than plain quantity — and
     it is checked before demand, because such an act can accumulate
     demand from claims that merely name it in passing. */
  if (finding.out_of_scope) {
    return {
      reported: false,
      weight: 0,
      why: `the corpus records this act as ${finding.out_of_scope}, which data/taxonomy.json defines as outside this brief's analytical scope. A thin model of it is intended.`,
    };
  }

  if (!d.length) {
    return {
      reported: false,
      weight: 0,
      why: 'nothing in the corpus leans on the missing concept. The absence is real and is in the census; reporting it here would be quantity, and a list a reviewer stops reading is worse than a shorter one.',
    };
  }
  return {
    reported: true,
    weight: d.reduce((n, x) => n + (x.weight ?? 1), 0),
    why: `${d.length} record(s) in the corpus lean on it`,
  };
}

/**
 * Split a detector's findings into what is reported and what is set
 * aside, keeping the reason for each suppression.
 *
 * The suppressed list is returned rather than dropped. A run that
 * reported nine findings and silently discarded forty has told its
 * reader something false about its own coverage.
 */
export function partition(findings) {
  const reported = [];
  const suppressed = [];
  for (const f of findings) {
    const a = assess(f);
    if (a.reported) reported.push({ ...f, weight: a.weight, demand_note: a.why });
    else suppressed.push({ gap_kind: f.gap_kind, subject: f.subject, why: a.why });
  }
  /* Heaviest first, then by subject so two runs over an unchanged
     corpus produce the same order. A report whose order moves for no
     reason cannot be diffed against the previous session's. */
  reported.sort((a, b) => (b.weight - a.weight) || String(a.subject).localeCompare(String(b.subject)));
  return { reported, suppressed };
}

/**
 * Turn a demand entry into the evidence entry the contract requires.
 *
 * WHAT THIS EVIDENCE SUPPORTS IS A PROPOSITION ABOUT THE CORPUS —
 * "this rule exists and names no authority" — and never a
 * proposition about EU law. The record states that directly, so the
 * qualifier is `supports:direct`; it establishes nothing whatever
 * about what the law requires, and the `role` stays `unresolved`
 * because a JSON file in this repository is not a legal authority.
 */
export function demandEvidence(d, i, { simulated = false } = {}) {
  return {
    evidence_id: `ev-demand-${String(i + 1).padStart(2, '0')}`,
    kind: 'dataset_record',
    source_id: null,
    url: null,
    locator: `${d.dataset ?? 'data/'}#${d.from}${d.field ? `.${d.field}` : ''}`,
    title: null,
    publisher: null,
    quote: null,
    retrieved_at: null,
    checksum: null,
    supports: 'supports:direct',
    role: 'unresolved',
    simulated,
  };
}
