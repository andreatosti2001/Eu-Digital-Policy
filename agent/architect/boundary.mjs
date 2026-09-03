/* ============================================================
   agent/architect/boundary.mjs — what makes a finding this agent's

   SESSION 11 built an agent that asks what knowledge is missing
   from the corpus and answers with `KnowledgeGap`. SESSION 13 asks
   whether the MODEL can represent the system at all. Those are two
   questions and the second is easy to answer by accident with the
   first, which would produce a second Data Depth Agent under a new
   name — the second home this architecture exists to prevent,
   arriving as an agent rather than as a field.

   ONE TEST SEPARATES THEM, and it is a mechanism rather than an
   intention:

     Would writing a record close this?

   If yes, it is Data Depth's. A missing competence edge, an
   instrument with no provisions, an undated status — every one of
   those closes by somebody writing the value into a shape that
   already exists. This agent sets it aside and names the agent
   that owns it.

   If no — because there is no field to write the value into, or
   because writing it would put a second copy of a fact somewhere,
   or because the field exists and cannot hold what the corpus needs
   it to say — it is an architecture finding, and the answer is a
   proposed change to the shape.

   THE SECOND TEST IS DEMAND, inherited from SESSION 11 for the same
   reason. A shape is reported missing only where records ALREADY IN
   THE CORPUS lean on it — where something is being said, today, in
   a place that cannot hold it. "The model could also represent X"
   is not a finding; it is a design opinion, and one about EU law
   that nothing here has read a document to support.

   THE THIRD IS THE ONE THAT MATTERS MOST. Every finding must stand
   on `dataset_record` evidence — records in this repository — and
   never on a retrieved document, because no agent here has ever
   retrieved one. A finding whose real support is "the EU
   regulatory system also has X" is model knowledge about EU law
   presented as analysis. `agent/architect/selftest.mjs` asserts
   that no finding this agent emits carries a `retrieved_document`
   evidence entry, and the contract gateway refuses the record
   independently.
   ============================================================ */

/** Why a finding is not this agent's, by the agent it belongs to. */
export const NOT_OURS = {
  data_depth: 'A record written into a shape that already exists would close this. agent/depth/ asks that question and answers it with a KnowledgeGap; reporting it here would give one finding two homes.',
  gap_router: 'The answer is a taxonomy TERM, not a shape. agent/proposals/data/ proposes a term through DataProposal\'s create_taxonomy_term, with the search that could have stopped it — and that burden is already somebody\'s.',
  legal_verifier: 'The answer is a value read from a document. Nothing in this repository has ever retrieved one, and a shape proposed to hold a value nobody has read is a shape proposed on nothing.',
  editorial: 'The answer is a sentence in the brief, which is the author\'s argument and not a schema.',
};

/** The evidence kinds a finding of this agent's may stand on. A
 *  retrieved document is deliberately absent: this agent reads the
 *  repository, and the repository is not a source. */
export const ALLOWED_EVIDENCE_KINDS = new Set(['dataset_record', 'agent_output', 'measurement', 'absent']);

/**
 * Would writing a record close this finding?
 *
 * A finding declares `closes_by`, and only two answers are
 * available: `record` (somebody writes a value into a shape that
 * exists) or `shape` (there is no shape to write it into, or the
 * shape cannot hold what is being said). A finding that does not
 * say is refused rather than guessed at — an unstated boundary is
 * how one agent's job quietly becomes another's.
 *
 * @param {object} finding
 * @returns {{ours:boolean, why:string, route:string|null}}
 */
export function ownershipOf(finding) {
  const closes = finding?.closes_by;
  if (closes !== 'record' && closes !== 'shape') {
    return { ours: false, route: null, why: `closes_by is ${JSON.stringify(closes)}: a finding that does not say whether a record or a shape would close it cannot be placed, and guessing is how one agent's job becomes another's` };
  }
  if (closes === 'record') {
    return { ours: false, route: finding.route ?? 'data_depth', why: NOT_OURS[finding.route ?? 'data_depth'] ?? NOT_OURS.data_depth };
  }
  return { ours: true, route: null, why: 'No record written into any existing shape closes this: the shape itself is what is missing or cannot hold what the corpus is already saying.' };
}

/**
 * Does the corpus already lean on the missing shape?
 *
 * `demand` is the records that are, today, saying something the
 * shape would hold — each one a `{dataset, record_id, field,
 * saying}` entry. An empty demand is not a small finding; it is a
 * design opinion, and it is set aside with that said.
 */
export function demandOf(finding) {
  const demand = Array.isArray(finding?.demand) ? finding.demand : [];
  /* The count always describes the WHOLE demand; `demand` itself is
     a bounded preview, because the trace store caps a stored string
     and a truncated list whose count describes the truncation tells
     its reader something false (SESSION 10's lesson, F-15's
     discipline). */
  const count = Number.isInteger(finding?.demand_total) ? finding.demand_total : demand.length;
  if (!count) {
    return { standing: false, count: 0, why: 'No record in the corpus leans on this shape. "The model could also represent X" is a design opinion about EU law, and nothing here has read a document that would support one.' };
  }
  /* A lens may set a floor above one. `fact_in_prose` does: a single
     sentence naming a record it does not reference is one author's
     wording, and a shape proposed on it would be a schema change
     argued from one line of prose. Two is the point at which the
     corpus is doing something repeatedly. */
  const floor = Number.isInteger(finding?.demand_floor) ? finding.demand_floor : 1;
  if (count < floor) {
    return { standing: false, count, why: `${count} record(s) lean on this shape and this lens asks for ${floor}. One occurrence is a record's wording, not a shape the corpus leans on, and a schema change argued from it would be argued from one line of prose.` };
  }
  return { standing: true, count, why: `${count} record(s) in the corpus are already saying something this shape would hold.` };
}

/**
 * Partition a lens's findings into what is reported and what is set
 * aside, with a reason on every one.
 *
 * A finding that vanished without a reason is the failure SESSION 11
 * designed against: a run that reported three findings and silently
 * dropped nine has told its reader something false about its own
 * coverage.
 */
export function partition(findings = []) {
  const reported = [];
  const aside = [];
  for (const f of findings) {
    const own = ownershipOf(f);
    if (!own.ours) { aside.push({ finding: f, subject: f.subject, why: own.why, route: own.route }); continue; }
    const dem = demandOf(f);
    if (!dem.standing) { aside.push({ finding: f, subject: f.subject, why: dem.why, route: null }); continue; }
    reported.push({ ...f, demand_count: dem.count });
  }
  /* Heaviest first, then by subject, so two runs over an unchanged
     corpus report in the same order. */
  reported.sort((a, b) => (b.demand_count - a.demand_count) || String(a.subject).localeCompare(String(b.subject)));
  return { reported, aside };
}

/**
 * The evidence entries a finding stands on, checked.
 *
 * Returns the problems rather than throwing: a lens that produced
 * one bad entry should be reported as such, not take the run down.
 */
export function evidenceProblems(entries = []) {
  const problems = [];
  for (const e of entries) {
    if (!ALLOWED_EVIDENCE_KINDS.has(e?.kind)) {
      problems.push(`evidence "${e?.evidence_id ?? '?'}" is a ${e?.kind}: this agent reads the repository, and a finding standing on a retrieved document would be standing on something no agent here has ever retrieved`);
    }
  }
  return problems;
}
