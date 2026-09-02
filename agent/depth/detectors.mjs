/* ============================================================
   agent/depth/detectors.mjs — the thirteen questions

   One detector per kind in `DEPTH_GAP_KINDS`, in the brief's order.
   `selftest.mjs` asserts the two directions of that correspondence:
   a kind with no detector, and a detector claiming a kind that is
   not in the vocabulary, both fail. Naming a kind of gap and never
   looking for it would be a claim of coverage the code does not
   have.

   EVERY DETECTOR IS A TABLE OR A WALK, NEVER A JUDGEMENT ABOUT
   IMPORTANCE. Each returns findings with the DEMAND it could
   establish — the records in the corpus that lean on the missing
   thing — and `demand.mjs` decides which survive. A detector that
   returned a finding with no demand has not been censored; it has
   found something the census already counts, and the census is
   `.agents/skills/data-completeness/scripts/gaps.mjs`.

   NO DETECTOR READS PROSE TO ESTABLISH A LEGAL FACT. Two of them
   read a RECORDED STRING — a source's title, an instrument's
   `dna.sanction_ceiling` — and in both cases what is read is what
   the corpus itself wrote down, the method says so on the record,
   and the conclusion is about the corpus rather than about EU law.
   The distinction matters: "the corpus records a title containing
   'Delegated Regulation' and has no instrument for it" is checkable
   by opening the file. "There is a delegated act under the DSA" is a
   legal fact, and nothing here asserts one.

   THRESHOLDS ARE DERIVED FROM THE CORPUS OR THEY ARE STATED. There
   is one tuned number in this file — the two-claim floor on
   co-citation — and it is named, explained, and exported so the
   suite can assert it did not drift. The glossary threshold is
   derived from what the glossary already covers, which is the
   corpus's own standard rather than this agent's.
   ============================================================ */

import { DEPTH_GAP_KINDS } from '../schemas/types.mjs';
import { demand, demandFromGraph } from './demand.mjs';
import { ENFORCEMENT_ROLES, POSITIVE_OUTCOMES } from './lens.mjs';

const arr = (x) => (Array.isArray(x) ? x : []);

/** The kinds of record whose dependence on something is evidence
 *  that the corpus needs it. A taxonomy term referencing an id is
 *  enum membership, not demand, and counting it would find demand
 *  everywhere. */
const SUBSTANTIVE = ['claim', 'applicability_rule', 'glossary_term', 'enforcement_action', 'timeline_event', 'relationship', 'instrument', 'institution', 'provision'];

/**
 * The one tuned threshold in this file.
 *
 * Two independent claims treating a pair of acts together is the
 * floor for saying the corpus has a relationship in mind. One claim
 * mentioning two acts in the same sentence is ordinary prose — the
 * brief argues about the whole acquis and names several acts a
 * paragraph — and reporting every such pair would produce thirty
 * findings, twenty-six of them noise, which is exactly the quantity
 * the brief refuses to reward.
 *
 * Exported so the suite can assert it, and so changing it is a
 * visible decision rather than an edit inside a condition.
 */
export const CO_CITATION_FLOOR = 2;

/* ================================================================
   1 · missing instruments
   ================================================================ */

const missingInstrument = (lens) => {
  const out = [];
  for (const [title, group] of lens.sourcesByTitle) {
    if (group.length !== 1) continue;                     // two records for one document is detector 9
    const s = group[0];
    if (!['tier:1', 'tier:2'].includes(s.tier)) continue; // a commentary is not an act
    if (!['source-type:regulation', 'source-type:legislative-document'].includes(s.type)) continue;
    if (lens.instrumentOfSource.has(s.id)) continue;      // an instrument already claims it
    if (SUBORDINATE_RE.test(String(s.title))) continue;   // a delegated act is detector 12

    /* THE TEST THAT KEEPS THIS DETECTOR HONEST. A primary document
       the corpus cites is not evidence of an unmodelled act if the
       records citing it are already about an act the corpus models.
       An Official Journal notice withdrawing a proposal is exactly
       that case: the notice has no instrument record of its own, and
       the act it concerns is modelled, so reporting it would be a
       false positive dressed as a finding. So the document must
       float free of every modelled act — no claim citing it may name
       an instrument. This is derived from the references rather than
       read off the title. */
    const citingClaims = lens.corpus.claims.filter((cl) => arr(cl.sources).some((x) => x.source_id === s.id));
    if (citingClaims.some((cl) => arr(cl.instruments).some((x) => lens.corpus.instrumentById.has(x)))) continue;

    const d = demandFromGraph(lens, s.id, {
      kinds: SUBSTANTIVE,
      note: (e, n) => `${e.from_kind} ${e.from} cites this document at ${e.field}, and the corpus has no instrument record for the act it is the text of`,
    });
    out.push({
      gap_kind: 'missing_instrument',
      subject: s.id,
      entities: [{ kind: 'source', id: s.id, path: 'data/sources.json', field: null, note: 'The primary text is recorded as a source; the act it is the text of is not modelled.' }],
      missing_concept: `The corpus cites ${s.id} — recorded as a ${s.type} at ${s.tier}, titled "${s.title}" — as a primary document, and models no instrument for the act that document is the text of. Records reach the act only through the bibliography, so it has no scope class, no DNA, no provisions and no place in any comparison view.`,
      why_it_matters: 'An act the site cites as primary law but does not model is invisible to every derived view: the instrument comparison, the applicability questionnaire, the timeline and the competence map all iterate instrument records. A reader who meets the act in the bibliography and looks for it in the analysis finds nothing.',
      absence_kind: 'null_not_researched',
      demand: d,
      candidate_evidence: [{ kind: 'cited_document', where: s.id, what_it_would_establish: 'What the act is, its CELEX, its kind and its status — read from the document the source record already points at. A place to look; it establishes nothing until somebody reads it.', retrieved: false }],
      location: { dataset: 'data/instruments.json', container: 'instruments', field: null, shape_exists: true, why_here: 'An act is an instrument record. The source record stays where it is and is referenced from the instrument\'s sources[]; recording the act\'s properties on the source would put an instrument\'s facts in the bibliography.' },
      impact: 'analysis_incomplete',
      method: 'Indexed data/sources.json by title, kept the tier:1 and tier:2 legislative documents that exactly one record carries, subtracted the source ids some instrument record already names in its own sources[], and subtracted the documents whose citing claims are about an act the corpus does model. No title was interpreted as evidence that an act exists.',
    });
  }
  return out;
};

/* ================================================================
   2 · missing provisions
   ================================================================ */

const missingProvision = (lens) => {
  const out = [];
  for (const i of lens.corpus.instruments) {
    if (arr(i.provisions).length) continue;

    /* Demand for a PROVISION specifically: a record that needs an
       article to point at. A rule that fires and names no
       obligation; a glossary term explaining the act; a competence
       whose basis[] is empty; a claim arguing from the act. */
    const d = [];
    for (const r of lens.rulesOf(i.id)) {
      if (arr(r.obligations).length) continue;
      d.push(demand({
        from: r.id, from_kind: 'applicability_rule', dataset: 'data/applicability.json', field: 'obligations', weight: 3,
        note: `applicability rule ${r.id} reaches ${r.outcome} for this act and names no obligation, because the act has no provision record to name`,
      }));
    }
    for (const cp of lens.competencesOf(i.id)) {
      if (arr(cp.basis).length) continue;
      d.push(demand({
        from: cp.institution, from_kind: 'institution', dataset: 'data/institutions.json', field: 'competences.basis', weight: 2,
        note: `${cp.institution} holds ${cp.role} over this act on no stated legal basis, because the act has no provision record to cite`,
      }));
    }
    /* A glossary term explaining an act with no articles is demand;
       a claim merely naming the act is not. The brief names several
       acts a paragraph, and counting every mention as a demand for
       an article would find demand everywhere — which is the census,
       not a finding. */
    d.push(...demandFromGraph(lens, i.id, {
      kinds: ['glossary_term'],
      note: (e) => `glossary term ${e.from} explains this act at ${e.field} and cannot point at an article of it`,
    }));

    out.push({
      out_of_scope: lens.isUnanalysed(i) ? i.scope_class : null,
      gap_kind: 'missing_provision',
      subject: i.id,
      entities: [{ kind: 'instrument', id: i.id, path: 'data/instruments.json', field: 'provisions', note: null }],
      missing_concept: `${i.id} carries no provision records, so nothing in the corpus can cite an article of it. The act is modelled as a whole and never as text: its obligations, its scope article and its penalty article have no ids to be referenced by.`,
      why_it_matters: `The corpus already asks this act for articles it does not have — ${d.length} record(s) reach for one and get nothing. An applicability rule that tells a reader the act applies and lists no obligation is the sharpest form: the reader is told they are in scope and not told of what.`,
      absence_kind: 'null_not_researched',
      demand: d,
      candidate_evidence: [{
        kind: arr(i.sources).length ? 'cited_document' : 'none_identified',
        where: arr(i.sources)[0] ?? null,
        what_it_would_establish: arr(i.sources).length
          ? 'The article numbers, headings and obligation-bearers, read from the consolidated text the instrument already cites. A place to look.'
          : 'Nothing. The instrument record cites no primary text, so the corpus does not say where its articles would be read from.',
        retrieved: false,
      }],
      location: { dataset: 'data/instruments.json', container: 'instruments[].provisions', field: null, shape_exists: true, why_here: 'Provisions are nested inside their instrument and are the most-referenced ids in the corpus. There is no second home for an article.' },
      impact: lens.isLive(i) ? 'reader_finds_nothing' : 'analysis_incomplete',
      method: 'For each instrument with an empty provisions[] that the corpus has not declared outside its analytical scope, collected the records that reach for an article of it: applicability rules with an empty obligations[], competences with an empty basis[], and glossary terms explaining the act. A claim merely naming the act is not counted — that is a mention, not a demand for an article.',
    });
  }
  return out;
};

/* ================================================================
   3 · incomplete timelines

   Which event type a status implies is a TABLE rather than a chain
   of conditions, so a reviewer can read every state this detector
   claims to know about — and so the states it does not know about
   are visible as absences from the table rather than falling through
   to a default.
   ================================================================ */

export const STATUS_NEEDS_EVENT = {
  'status:in-force': 'event:entry-into-force',
  'status:applicable': 'event:application',
  'status:partly-applicable': 'event:application',
  'status:transposition-pending': 'event:transposition',
};

const incompleteTimeline = (lens) => {
  const out = [];
  for (const i of lens.corpus.instruments) {
    const need = STATUS_NEEDS_EVENT[i.legislative_status];
    if (!need) continue;
    if (lens.eventTypesOf(i.id).has(need)) continue;

    const d = [];
    for (const r of lens.rulesOf(i.id)) {
      if (arr(r.dates).length) continue;
      d.push(demand({ from: r.id, from_kind: 'applicability_rule', dataset: 'data/applicability.json', field: 'dates', weight: 3, note: `applicability rule ${r.id} carries no dates[], so a reader told the act applies is told nothing about when` }));
    }
    /* Demand for a DATE specifically. A rule with no dates[] reaches
       for one; a glossary term explaining the act reaches for one; a
       claim mentioning the act does not. */
    d.push(...demandFromGraph(lens, i.id, { kinds: ['glossary_term'], note: (e) => `glossary term ${e.from} explains the act at ${e.field} and the corpus cannot date the state it is in` }));

    out.push({
      out_of_scope: lens.isUnanalysed(i) ? i.scope_class : null,
      gap_kind: 'incomplete_timeline',
      subject: i.id,
      entities: [{ kind: 'instrument', id: i.id, path: 'data/instruments.json', field: 'milestones', note: `legislative_status is ${i.legislative_status}` }],
      missing_concept: `The corpus records ${i.id} as ${i.legislative_status} and carries no ${need} event dating it. The status asserts a state the timeline does not date, so nothing in the corpus says when that state began.`,
      why_it_matters: 'The compliance calendar, the status strips and the pipeline stages are all derived from timeline events at render time. A status with no event behind it renders as a state with no date — and because the derivation compares against the reader\'s own clock, what is shown depends on when the page is opened rather than on what the corpus knows.',
      absence_kind: 'null_not_researched',
      demand: d,
      candidate_evidence: [{
        kind: arr(i.sources).length ? 'cited_document' : 'none_identified',
        where: arr(i.sources)[0] ?? null,
        what_it_would_establish: arr(i.sources).length
          ? 'The date the act reached this state, in the final provisions of the text the instrument already cites. A place to look.'
          : 'Nothing. The instrument cites no primary text, so the corpus does not say where the date would be read from.',
        retrieved: false,
      }],
      location: { dataset: 'data/timeline.json', container: 'events', field: null, shape_exists: true, why_here: 'Instruments carry no dates — they reference timeline event ids, and the event is the date\'s one home. Writing the date onto the instrument would be the second copy the architecture exists to prevent.' },
      impact: 'analysis_incomplete',
      method: 'Read each instrument\'s legislative_status against a stated table of which event type dates which state, and checked the event types the instrument\'s own timeline events carry. Statuses not in the table are not reported, rather than defaulted.',
    });
  }
  return out;
};

/* ================================================================
   4 · incomplete applicability

   Two shapes, and the second is the one this project names as its
   most damaging failure mode.
   ================================================================ */

const incompleteApplicability = (lens) => {
  const out = [];

  /* (a) A rule that reaches a positive outcome and names no
         obligation. The reader is told the act applies to them and
         is not told of what. */
  for (const r of arr(lens.db.applicability?.rules)) {
    if (!POSITIVE_OUTCOMES.includes(r.outcome)) continue;
    if (arr(r.obligations).length) continue;
    out.push({
      gap_kind: 'incomplete_applicability',
      subject: r.id,
      entities: [{ kind: 'applicability_rule', id: r.id, path: 'data/applicability.json', field: 'obligations', note: `outcome is ${r.outcome}` }],
      missing_concept: `Rule ${r.id} reaches ${r.outcome} for ${r.instrument} and lists no obligations. The model can say the act reaches this reader and cannot say what it requires of them.`,
      why_it_matters: 'The questionnaire on applies.html exists to answer "does this reach me, and what then". A rule that answers the first half and not the second delivers the finding a reader came for and withholds the part they would act on.',
      absence_kind: 'null_not_researched',
      demand: [
        demand({ from: r.id, from_kind: 'applicability_rule', dataset: 'data/applicability.json', field: 'outcome', weight: 3, note: `the rule itself already tells a reader the act reaches them (${r.outcome})` }),
        ...demandFromGraph(lens, r.instrument, { kinds: ['claim', 'glossary_term'], note: (e) => `${e.from_kind} ${e.from} argues about this act at ${e.field}` }),
      ],
      candidate_evidence: [{ kind: 'corpus_record', where: r.instrument, what_it_would_establish: 'Which articles bear the obligations, from the instrument\'s own provisions[] once it has them — or from its dna.obligation_anchor where that is filled in. A place to look.', retrieved: false }],
      location: { dataset: 'data/applicability.json', container: 'rules[].obligations', field: 'obligations', shape_exists: true, why_here: 'The field exists and is empty. The obligations are provision ids; the articles themselves live on the instrument, and the rule references them.' },
      impact: 'reader_finds_nothing',
      method: 'Filtered data/applicability.json rules to those whose outcome is one of the positive outcomes the dataset\'s own $outcomes block defines, and kept the ones whose obligations[] is empty.',
    });
  }

  /* (b) A live act with no rule at all. The engine's answer is
         NOT DETERMINED, and AI-SAFE-BOUNDARIES §0.5 is explicit
         that absence of a rule must never read as "probably not".
         This is the one detector whose absence_kind is
         no_rule_matched, and the contract requires its impact to be
         the top of the ladder. */
  for (const i of lens.corpus.instruments) {
    if (!lens.isLive(i)) continue;
    if (lens.rulesOf(i.id).length) continue;
    const d = demandFromGraph(lens, i.id, { kinds: SUBSTANTIVE, note: (e) => `${e.from_kind} ${e.from} treats this act as part of the acquis at ${e.field}, while the questionnaire cannot reach it at all` });
    out.push({
      out_of_scope: lens.isUnanalysed(i) ? i.scope_class : null,
      gap_kind: 'incomplete_applicability',
      subject: i.id,
      entities: [{ kind: 'instrument', id: i.id, path: 'data/applicability.json', field: null, note: `legislative_status is ${i.legislative_status}; no rule in data/applicability.json names it` }],
      missing_concept: `No applicability rule covers ${i.id}, which the corpus records as ${i.legislative_status}. For every combination a reader can enter, the engine returns NOT DETERMINED for this act.`,
      why_it_matters: 'Absence of a rule is absence of knowledge and never evidence of non-applicability — the dataset\'s own $outcomes block says so of outcome:undetermined, and AI-SAFE-BOUNDARIES §0.5 names presenting it as a negative finding as the single most damaging thing this tool could do. An act that binds somebody today and that the questionnaire cannot reach is precisely where that misreading is available.',
      absence_kind: 'no_rule_matched',
      demand: d,
      candidate_evidence: [{ kind: 'corpus_record', where: i.id, what_it_would_establish: 'The act\'s scope article, from which the conditions of a rule would be drawn. A place to look; a rule may also be correctly absent, and establishing that is itself the work.', retrieved: false }],
      location: { dataset: 'data/applicability.json', container: 'rules', field: null, shape_exists: true, why_here: 'A rule is a record in the applicability dataset. The instrument keeps no applicability field: the rule references the instrument, not the other way round.' },
      impact: 'reader_could_be_misled',
      method: 'Took the instruments whose legislative_status is one of the live statuses, dropped the ones whose scope_class the corpus has declared outside its analytical scope, and looked the rest up in the applicability rules indexed by instrument. An act with no rule is reported as NOT DETERMINED, never as out of scope.',
    });
  }
  return out;
};

/* ================================================================
   5 · missing institutions
   ================================================================ */

const missingInstitution = (lens) => {
  const out = [];
  /* A record that names an authority generically where it is
     describing a specific event. A wildcard is a legitimate way to
     say "all national DPAs"; it is not a way to say who took a
     particular decision, and `tools/validate.mjs` treats every
     wildcard reference as resolving (audit F-12), so nothing else
     in the repository will notice. */
  for (const e of arr(lens.db.enforcement?.enforcement)) {
    const auth = e.authority;
    if (typeof auth !== 'string' || !auth.endsWith('-*')) continue;
    out.push({
      gap_kind: 'missing_institution',
      subject: e.id,
      entities: [{ kind: 'enforcement_action', id: e.id, path: 'data/enforcement.json', field: 'authority', note: `authority is the wildcard ${auth}` }],
      missing_concept: `Enforcement action ${e.id} records a decision and names its authority only as the class ${auth}. The corpus has no institution record for the body that actually decided it, so the action cannot be attributed.`,
      why_it_matters: 'An enforcement record exists to say who did what to whom. A wildcard authority answers the "who" with a category, and because validate.mjs treats a wildcard reference as resolving, no check in this repository reports it. The competence map, which is derived from institution records, cannot place the decision at all.',
      absence_kind: 'null_not_researched',
      demand: [
        demand({ from: e.id, from_kind: 'enforcement_action', dataset: 'data/enforcement.json', field: 'authority', weight: 3, note: 'the action itself asserts a decision was taken and cannot name who took it' }),
        ...demandFromGraph(lens, e.id, { kinds: ['claim', 'glossary_term'], note: (ed) => `${ed.from_kind} ${ed.from} argues from this action at ${ed.field}` }),
      ],
      candidate_evidence: [{
        kind: arr(e.sources).length ? 'cited_document' : 'none_identified',
        where: arr(e.sources)[0] ?? null,
        what_it_would_establish: arr(e.sources).length
          ? 'Which national authority took the decision, named in the document the action already cites. A place to look.'
          : 'Nothing. The action cites no source, so the corpus does not say where the authority would be read from.',
        retrieved: false,
      }],
      location: { dataset: 'data/institutions.json', container: 'institutions', field: null, shape_exists: true, why_here: 'A national authority is an institution record; the enforcement action then references it by id instead of by class. The authority\'s own competences stay on the institution, which is competence\'s one home.' },
      impact: 'reader_finds_nothing',
      method: 'Scanned enforcement records for an authority id ending in the wildcard suffix the institutions dataset\'s own $note defines, and kept those where the record describes a specific decision.',
    });
  }
  return out;
};

/* ================================================================
   6 · missing competences
   ================================================================ */

const missingCompetence = (lens) => {
  const out = [];
  for (const i of lens.corpus.instruments) {
    const roles = lens.enforcementRolesOf(i.id);
    const ceiling = i.dna?.sanction_ceiling ?? null;
    /* A ceiling with a FIGURE in it is the sharp case: the site tells
       a reader what they can be fined and cannot say who imposes it.
       A ceiling object carrying no figure is a weaker signal, and the
       two are reported as different findings rather than averaged
       into one. */
    const figure = ceiling && (ceiling.pct_global_turnover != null || ceiling.fixed_eur != null)
      ? [ceiling.pct_global_turnover != null ? `${ceiling.pct_global_turnover}% of global turnover` : null, ceiling.fixed_eur != null ? `EUR ${ceiling.fixed_eur}` : null].filter(Boolean).join(' / ')
      : null;

    /* (a) A STATED MAXIMUM FINE WITH NOBODY TO IMPOSE IT.
           Checked before the general case and independently of it: an
           act may be supervised by a named body and still have no
           institution holding role:fines, and that pairing — a figure
           a reader acts on, and no enforcer — is the sharpest thing
           this whole analysis finds. Collapsing it into "has some
           enforcement role" would hide it behind a supervisor. */
    if (figure && !roles.some((x) => x.role === 'role:fines')) {
      const d = [demand({
        from: i.id, from_kind: 'instrument', dataset: 'data/instruments.json', field: 'dna.sanction_ceiling', weight: 4,
        note: `the act's DNA records a maximum fine of ${figure} and no institution holds role:fines over it`,
      })];
      for (const r of lens.rulesOf(i.id)) {
        if (!POSITIVE_OUTCOMES.includes(r.outcome)) continue;
        d.push(demand({ from: r.id, from_kind: 'applicability_rule', dataset: 'data/applicability.json', field: 'outcome', weight: 3, note: `rule ${r.id} reaches ${r.outcome}, so a reader is told this act reaches them and can be fined under it by nobody the model names` }));
      }
      out.push({
        gap_kind: 'missing_competence',
        subject: i.id,
        entities: [{ kind: 'instrument', id: i.id, path: 'data/institutions.json', field: 'competences', note: 'A sanction ceiling is recorded; no institution holds role:fines over the act.' }],
        missing_concept: `${i.id} records a maximum fine of ${figure} in its DNA, and no institution in the corpus holds role:fines over it. The model states what a reader can be fined and cannot state who imposes it.${roles.length ? ` Other roles are held (${[...new Set(roles.map((x) => x.role))].join(', ')}), so this is a specific hole rather than an unsupervised act.` : ''}`,
        why_it_matters: 'A fine ceiling is among the few figures on this site a reader would change their behaviour over. Competent authority is derived at render time from the competence edges, so with no role:fines edge the site presents an enforceable maximum next to an unanswerable question about who enforces it — which reads as an oversight in the law rather than a hole in the model.',
        absence_kind: 'null_not_researched',
        demand: d,
        candidate_evidence: [{
          kind: arr(i.sources).length ? 'cited_document' : 'none_identified',
          where: arr(i.sources)[0] ?? null,
          what_it_would_establish: arr(i.sources).length
            ? 'The penalties article and the article designating competent authorities, in the text the instrument already cites. A place to look — and where an act leaves the allocation to Member States, establishing that is the finding.'
            : 'Nothing. The instrument cites no primary text.',
          retrieved: false,
        }],
        location: { dataset: 'data/institutions.json', container: 'institutions[].competences', field: 'role', shape_exists: true, why_here: 'Competence is an edge from an institution to an instrument and data/institutions.json is its one home. The ceiling stays on the instrument\'s DNA; who may impose it is not a property of the act.' },
        impact: 'reader_could_be_misled',
        method: 'Read dna.sanction_ceiling for a recorded figure, then looked for any competence entry naming the instrument in role:fines, keeping wildcard competences apart because a role held across the acquis does not answer who fines under one act.',
      });
    }

    /* (b) NO ENFORCEMENT ROLE OF ANY KIND. The general case: the
           question "who would enforce this against me" has no answer
           at all. */
    if (roles.length) continue;
    const d = [];
    for (const r of lens.rulesOf(i.id)) {
      if (!POSITIVE_OUTCOMES.includes(r.outcome)) continue;
      d.push(demand({ from: r.id, from_kind: 'applicability_rule', dataset: 'data/applicability.json', field: 'outcome', weight: 3, note: `rule ${r.id} reaches ${r.outcome}, so a reader is told this act reaches them and cannot be told who enforces it` }));
    }
    for (const e of lens.enforcementOf(i.id)) {
      d.push(demand({ from: e.id, from_kind: 'enforcement_action', dataset: 'data/enforcement.json', field: 'instrument', weight: 3, note: `enforcement action ${e.id} is recorded under this act while no institution holds an enforcement role over it` }));
    }
    if (figure) {
      d.push(demand({ from: i.id, from_kind: 'instrument', dataset: 'data/instruments.json', field: 'dna.sanction_ceiling', weight: 4, note: `the act's DNA records a maximum fine of ${figure} and no institution holds any enforcement role over it` }));
    }
    out.push({
      gap_kind: 'missing_competence',
      subject: i.id,
      entities: [{ kind: 'instrument', id: i.id, path: 'data/institutions.json', field: 'competences', note: 'No institution record names this instrument in an enforcement role.' }],
      missing_concept: `No institution in the corpus holds any of ${ENFORCEMENT_ROLES.join(', ')} over ${i.id}. The question a reader asks after being told an act applies to them — who would enforce it — has no answer in the model.`,
      why_it_matters: 'Competent authority is derived at render time from competence edges in data/institutions.json. With no edge, every view that answers "who supervises this" returns nothing for an act the corpus already tells readers about, and the reader cannot tell an unallocated competence from one nobody has recorded.',
      absence_kind: 'null_not_researched',
      demand: d,
      candidate_evidence: [{
        kind: arr(i.sources).length ? 'cited_document' : 'none_identified',
        where: arr(i.sources)[0] ?? null,
        what_it_would_establish: arr(i.sources).length
          ? 'The article designating competent authorities, in the text the instrument already cites. A place to look — and the allocation between services or agencies is frequently not settled by the act alone, which is why four competence edges already in the corpus carry a requires-verification note.'
          : 'Nothing. The instrument cites no primary text.',
        retrieved: false,
      }],
      location: { dataset: 'data/institutions.json', container: 'institutions[].competences', field: 'instrument', shape_exists: true, why_here: 'Competence is an edge from an institution to an instrument and data/institutions.json is its one home. Instruments carry no supervisor field by design, and adding one would be the second home the architecture exists to prevent.' },
      impact: 'reader_finds_nothing',
      method: 'Indexed every competence entry in data/institutions.json by the instrument it names, keeping wildcard competences apart because a role held across the acquis is not an answer to who enforces one act, then took the instruments with no entry in an enforcement role.',
    });
  }
  return out;
};

/* ================================================================
   7 · incomplete enforcement
   ================================================================ */

const incompleteEnforcement = (lens) => {
  const out = [];

  /* (a) A live act with no enforcement record at all. The trap here
         is that this may be entirely true — nobody may have been
         fined. So the finding is about how ZERO RENDERS, not about
         a missing decision, and the absence kind says nobody has
         looked rather than that nothing exists. */
  for (const i of lens.corpus.instruments) {
    if (!lens.isLive(i)) continue;
    if (lens.enforcementOf(i.id).length) continue;
    const d = demandFromGraph(lens, i.id, { kinds: ['claim', 'applicability_rule', 'glossary_term'], note: (e) => `${e.from_kind} ${e.from} treats this act as live at ${e.field}` });
    out.push({
      out_of_scope: lens.isUnanalysed(i) ? i.scope_class : null,
      gap_kind: 'incomplete_enforcement',
      subject: i.id,
      entities: [{ kind: 'instrument', id: i.id, path: 'data/enforcement.json', field: null, note: 'No enforcement record names this instrument.' }],
      missing_concept: `The corpus records ${i.id} as ${i.legislative_status} and holds no enforcement action under it. Whether that is because none has been taken or because none has been looked for is not recorded anywhere, and the two are different states.`,
      why_it_matters: 'A count of zero renders identically whether it means "researched, and there have been none" or "nobody has looked". Unknown is never zero — the whole enforcement view is built on that distinction, and here the distinction is not held.',
      absence_kind: 'null_not_researched',
      demand: d,
      candidate_evidence: [{ kind: 'official_register', where: 'the supervisory authority\'s own decisions register for this act', what_it_would_establish: 'Whether any decision exists. A place to look — and finding none is a result worth recording, not a failure.', retrieved: false }],
      location: { dataset: 'data/enforcement.json', container: 'enforcement', field: null, shape_exists: true, why_here: 'An enforcement action is a record in the enforcement dataset. Where the finding is that none exists, the honest home is a record stating the absence — the dataset already carries one such placeholder — rather than silence.' },
      impact: 'reader_could_be_misled',
      method: 'Took the instruments whose legislative_status is one of the live statuses, dropped the ones the corpus has declared outside its analytical scope, and looked the rest up in the enforcement records indexed by instrument.',
    });
  }

  /* (b) A recorded fine figure whose payment status is unknown,
         where a claim in the corpus argues from the gap between
         announced and collected. The axis census belongs to
         gaps.mjs; what is added here is which of those unknowns a
         standing argument depends on. */
  for (const e of arr(lens.db.enforcement?.enforcement)) {
    if (e.fine_eur == null) continue;
    if (e.payment_status !== 'payment:unknown') continue;
    const d = demandFromGraph(lens, e.id, { kinds: ['claim'], note: (ed) => `claim ${ed.from} argues from this action at ${ed.field}, and the amount actually collected is not recorded` });
    out.push({
      gap_kind: 'incomplete_enforcement',
      subject: e.id,
      entities: [{ kind: 'enforcement_action', id: e.id, path: 'data/enforcement.json', field: 'payment_status', note: 'payment_status is unknown against a recorded fine figure' }],
      missing_concept: `Action ${e.id} records a fine of EUR ${e.fine_eur} and a payment status of unknown — researched, and not publicly determinable. The corpus can state what was announced and not what was collected.`,
      why_it_matters: 'Claims in this corpus argue precisely from the distance between announced and collected fine value. Those arguments rest on an axis the corpus records as not determinable, so the argument is available and the number behind it is not — which is a different position from the argument being unsupported, and must not be rendered as the same.',
      absence_kind: 'unknown_not_determinable',
      demand: d,
      candidate_evidence: [{ kind: 'official_register', where: 'the deciding authority\'s published account of payment or the annual report covering it', what_it_would_establish: 'Whether the fine was paid, suspended or annulled. A place to look — and payment data is frequently not published at all, which is why the axis already reads unknown rather than null.', retrieved: false }],
      location: { dataset: 'data/enforcement.json', container: 'enforcement[].payment_status', field: 'payment_status', shape_exists: true, why_here: 'The axis exists and already carries the honest value. What is missing is the finding that would replace it, not a place to put one.' },
      impact: 'analysis_incomplete',
      method: 'Took enforcement records carrying a fine figure whose payment_status is the unknown sentinel, and kept those a claim references.',
    });
  }
  return out;
};

/* ================================================================
   8 · unsupported claims
   ================================================================ */

const unsupportedClaim = (lens) => {
  const out = [];
  for (const cl of lens.corpus.claims) {
    /* Narrowed to claim-type:law deliberately. The census counts
       every claim with no external direct source, and that number
       has a home. What is a DEPTH question is the site asserting
       WHAT THE LAW IS on nothing but itself — an interpretation
       resting on the brief is correctly typed, and a fact resting on
       the brief is a sourcing gap. A statement of law resting on the
       brief is the model asserting law from itself. */
    if (cl.type !== 'claim-type:law') continue;
    if (!lens.restsOnlyOnItself(cl)) continue;

    const d = demandFromGraph(lens, cl.id, { kinds: SUBSTANTIVE, note: (e) => `${e.from_kind} ${e.from} rests on this statement of law at ${e.field}` });
    out.push({
      gap_kind: 'unsupported_claim',
      subject: cl.id,
      entities: [{ kind: 'claim', id: cl.id, path: 'data/claims.json', field: 'sources', note: 'claim-type:law with no external direct source' }],
      missing_concept: `Claim ${cl.id} is typed claim-type:law — the site stating what the law requires — and no source outside this site directly supports it. Other records in the corpus are built on it.`,
      why_it_matters: 'A statement of law is the kind of claim a reader is most likely to act on, and this one rests on the brief citing itself. The evidence grade already renders as unresolved, which is honest; what is not visible is that other records depend on it, so the unresolved grade is load-bearing rather than isolated.',
      absence_kind: 'null_not_researched',
      demand: d,
      candidate_evidence: arr(cl.legal_basis).length
        ? [{ kind: 'corpus_record', where: arr(cl.legal_basis)[0], what_it_would_establish: 'The article the claim already names as its legal basis is where the statement would be confirmed. A place to look; the claim naming it is not the same as a source stating it.', retrieved: false }]
        : [{ kind: 'none_identified', where: null, what_it_would_establish: 'Nothing. The claim names no legal basis and cites no external document, so the corpus does not say where the statement would be confirmed.', retrieved: false }],
      location: { dataset: 'data/claims.json', container: 'claims[].sources', field: 'sources', shape_exists: true, why_here: 'A claim\'s evidence is the references in its own sources[], and the grade is derived from them at render time. Nothing about the grade is stored, and nothing here proposes storing one.' },
      impact: 'reader_could_be_misled',
      method: 'Filtered claims to type claim-type:law whose sources[] carries no supports:direct reference to anything other than the self-citation placeholder, using the same exclusion js/format.js applies before grading, and kept those other records depend on.',
    });
  }
  return out;
};

/* ================================================================
   9 · missing source relationships
   ================================================================ */

const missingSourceRelationship = (lens) => {
  const out = [];
  for (const [title, group] of lens.sourcesByTitle) {
    if (group.length < 2) continue;
    const ids = group.map((s) => s.id);
    const d = ids.flatMap((id) => demandFromGraph(lens, id, { kinds: SUBSTANTIVE, note: (e) => `${e.from_kind} ${e.from} cites ${e.to} at ${e.field}, one of two records for the same document` }));
    out.push({
      gap_kind: 'missing_source_relationship',
      subject: ids.join('+'),
      entities: ids.map((id) => ({ kind: 'source', id, path: 'data/sources.json', field: null, note: 'One of two records carrying the same recorded title.' })),
      missing_concept: `${ids.join(' and ')} carry the same recorded title, and no field in either says they are the same document at two addresses. The model has no way to express that relationship, so the bibliography holds two entries for one publication.`,
      why_it_matters: 'Evidence grades are derived per source reference. Two records for one document let the same document be counted twice behind a claim, and let a reader meet what is one publication as two independent corroborations. Nothing in the repository compares source records to each other, so no validator reports it.',
      absence_kind: 'null_not_researched',
      demand: d,
      candidate_evidence: [{ kind: 'cited_document', where: ids[0], what_it_would_establish: 'Whether the two addresses resolve to the same document. A place to look — and no URL in this repository has ever been fetched, so this is unestablished rather than merely unrecorded.', retrieved: false }],
      location: { dataset: 'data/sources.json', container: 'sources', field: null, shape_exists: false, why_here: 'There is no field for one source record standing in a relationship to another. Instruments have a relationships array for exactly this problem; sources have nothing equivalent, so closing this is a schema decision before it is a data one.' },
      impact: 'analysis_incomplete',
      method: 'Indexed data/sources.json by case-folded, whitespace-collapsed title and kept the titles carried by more than one record. Matching is on the title rather than the URL because the case the corpus contains is one document published at two addresses, which a URL comparison would miss.',
    });
  }
  return out;
};

/* ================================================================
   10 · missing instrument relationships
   ================================================================ */

const missingInstrumentRelationship = (lens) => {
  const pairs = new Map();
  for (const cl of lens.corpus.claims) {
    const is = [...new Set(arr(cl.instruments))].filter((x) => lens.corpus.instrumentById.has(x)).sort();
    for (let a = 0; a < is.length; a++) {
      for (let b = a + 1; b < is.length; b++) {
        if (lens.hasRelationship(is[a], is[b])) continue;
        const k = `${is[a]}|${is[b]}`;
        if (!pairs.has(k)) pairs.set(k, []);
        pairs.get(k).push(cl);
      }
    }
  }

  const out = [];
  for (const [k, claims] of pairs) {
    if (claims.length < CO_CITATION_FLOOR) continue;
    const [a, b] = k.split('|');
    out.push({
      gap_kind: 'missing_instrument_relationship',
      subject: k,
      entities: [a, b].map((id) => ({ kind: 'instrument', id, path: 'data/instruments.json', field: 'relationships', note: null })),
      missing_concept: `${claims.length} claims treat ${a} and ${b} together, and no relationship record states how the two acts stand to one another. The corpus argues about the pair and cannot say whether they overlap, complement, conflict or carve one another out.`,
      why_it_matters: 'The relationship records are what the instrument comparison renders and what lets a reader see where two acts meet. A pair the brief argues about repeatedly and the model does not connect is an argument the site makes in prose and cannot show in its structure — and prose is the half no validator here reads.',
      absence_kind: 'null_not_researched',
      demand: claims.map((cl) => demand({ from: cl.id, from_kind: 'claim', dataset: 'data/claims.json', field: 'instruments', weight: 2, note: `claim ${cl.id} treats both acts together and no relationship record connects them` })),
      candidate_evidence: [{ kind: 'corpus_record', where: claims[0].id, what_it_would_establish: 'What the claims already say about how the two acts meet, which is where the relationship\'s kind and summary would be drawn from. A place to look; characterising the relationship in the taxonomy\'s vocabulary is a legal reading, not a copy.', retrieved: false }],
      location: { dataset: 'data/instruments.json', container: 'relationships', field: null, shape_exists: true, why_here: 'A relationship is a record in the instruments dataset\'s relationships array, referencing both acts by id. Neither instrument stores anything about the other.' },
      impact: 'analysis_incomplete',
      method: `Counted the instrument pairs co-cited by a single claim's instruments[], subtracted the pairs an existing relationship record already connects in either direction, and kept the pairs reaching the stated floor of ${CO_CITATION_FLOOR} independent claims.`,
    });
  }
  return out;
};

/* ================================================================
   11 · missing glossary concepts

   The threshold here is DERIVED FROM THE GLOSSARY ITSELF rather than
   chosen. If the glossary already carries a term for something with
   N references, then something with more than N references and no
   term is a gap by the corpus's own standard — which is an argument
   a reviewer can check, where "more than five references" would be
   this agent's taste.
   ================================================================ */

export function glossaryFloor(lens) {
  const counts = referenceCounts(lens);
  const floors = {};
  for (const id of lens.glossaryCovers) {
    const n = counts.get(id);
    if (n === undefined) continue;
    const kind = lens.node(id)?.kind;
    if (!kind) continue;
    if (floors[kind] === undefined || n < floors[kind]) floors[kind] = n;
  }
  return floors;
}

function referenceCounts(lens) {
  const counts = new Map();
  for (const e of lens.graph.edges) {
    if (e.via_wildcard) continue;
    if (e.to_kind !== 'provision' && e.to_kind !== 'instrument') continue;
    if (!SUBSTANTIVE.includes(e.from_kind)) continue;
    counts.set(e.to, (counts.get(e.to) ?? 0) + 1);
  }
  return counts;
}

const missingGlossaryConcept = (lens) => {
  /* THE FLOOR IS PER KIND, and that is not a refinement — it is the
     difference between an argument and a number. The glossary
     explains provisions referenced as few as four times and
     instruments referenced forty-four times; a single floor across
     both would report every mid-sized instrument as unexplained
     against a standard the glossary sets for articles. Comparing a
     provision to the least-referenced provision the glossary covers
     is the corpus's own standard for that kind of thing. */
  const floors = glossaryFloor(lens);
  const counts = referenceCounts(lens);
  const out = [];
  for (const [id, n] of counts) {
    const node = lens.node(id);
    const kind = node?.kind;
    const floor = floors[kind];
    if (floor === undefined) continue;   // the glossary covers nothing of this kind, so it sets no standard for it
    if (n <= floor) continue;
    if (lens.glossaryCovers.has(id)) continue;
    const d = demandFromGraph(lens, id, { kinds: SUBSTANTIVE, note: (e) => `${e.from_kind} ${e.from} references it at ${e.field} with no glossary term to explain it` });
    out.push({
      gap_kind: 'missing_glossary_concept',
      subject: id,
      entities: [{ kind: kind ?? 'provision', id, path: node?.dataset ?? 'data/instruments.json', field: null, note: `${n} substantive references; no glossary term names it` }],
      missing_concept: `${id} is referenced by ${n} records across the corpus and no glossary term explains it. The glossary already carries terms for ${kind}s referenced as few as ${floor} times, so this is unexplained by the corpus's own standard for its own kind of record rather than by an outside one.`,
      why_it_matters: 'The glossary is where a reader who does not already know the acquis is met. A concept the corpus leans on more heavily than things it does define is one the reader is most likely to encounter and least likely to be helped with.',
      absence_kind: 'null_not_researched',
      demand: d,
      candidate_evidence: [{ kind: 'corpus_record', where: id, what_it_would_establish: 'The record\'s own summary or heading, which is where a definition would start. A place to look; a glossary definition is written, not copied.', retrieved: false }],
      location: { dataset: 'data/glossary.json', container: 'terms', field: null, shape_exists: true, why_here: 'A glossary term is a record in the glossary dataset that references the provisions and instruments it explains. The provision keeps its own summary; the term does not duplicate it.' },
      impact: 'analysis_incomplete',
      method: `Counted substantive references to every provision and instrument, took the lowest count among the concepts the glossary already covers OF THE SAME KIND as the floor (${Object.entries(floors).map(([k, v]) => `${k} ${v}`).join(', ')}), and kept the uncovered concepts above it. The threshold is the corpus's own standard rather than a chosen number.`,
    });
  }
  return out;
};

/* ================================================================
   12 · missing implementation / delegated / technical instruments

   A subordinate act is one made under a parent act. The corpus can
   be asked about them from two independent directions, and both are
   used, because either alone is weak: a title is a string, and an
   unused enum term may simply be a term nobody has needed yet.
   ================================================================ */

/** Matched against a source's RECORDED TITLE. What this establishes
 *  is that the corpus wrote that phrase down — never that such an
 *  act exists, which would be a legal fact and is not asserted
 *  anywhere here. */
const SUBORDINATE_RE = /\b(delegated|implementing)\s+(regulation|decision|directive|act)\b/i;

/** The taxonomy terms that exist for subordinate acts. Read from the
 *  enum authority rather than listed from knowledge. */
const SUBORDINATE_KINDS = ['kind:delegated-regulation', 'kind:implementing-decision'];

const missingSubordinateInstrument = (lens) => {
  const out = [];
  const usedKinds = new Set(lens.corpus.instruments.map((i) => i.kind));
  const unusedKinds = SUBORDINATE_KINDS.filter((k) => !usedKinds.has(k));

  for (const s of lens.corpus.sources) {
    if (!SUBORDINATE_RE.test(String(s.title))) continue;
    /* A press release ANNOUNCING a delegated act is not the act. The
       filter is on the source type the corpus recorded, not on a
       second reading of the title: only a document the corpus typed
       as legislation can be the text of one. */
    if (!['source-type:regulation', 'source-type:legislative-document'].includes(s.type)) continue;
    if (lens.instrumentOfSource.has(s.id)) continue;
    const d = demandFromGraph(lens, s.id, { kinds: SUBSTANTIVE, note: (e) => `${e.from_kind} ${e.from} cites this subordinate act at ${e.field} and cannot reference it as an instrument` });
    out.push({
      gap_kind: 'missing_subordinate_instrument',
      subject: s.id,
      entities: [{ kind: 'source', id: s.id, path: 'data/sources.json', field: 'title', note: 'The recorded title names a delegated or implementing act.' }],
      missing_concept: `The corpus records ${s.id} with the title "${s.title}", which names a delegated or implementing act, and models no instrument for it. Subordinate acts are where a parent regulation's obligations are actually specified, and this one exists in the corpus only as a citation.${unusedKinds.length ? ` The taxonomy declares ${unusedKinds.join(' and ')} and no instrument record uses either, so the model has a place for this kind of act and nothing occupies it.` : ''}`,
      why_it_matters: 'A framework regulation frequently states an obligation and leaves its content to a delegated or implementing act. A model that holds only the parent shows a reader the obligation and not the part that says what it requires — and because the subordinate act is not an instrument, no timeline event, applicability rule or competence edge can attach to it.',
      absence_kind: 'null_not_researched',
      demand: d,
      candidate_evidence: [{ kind: 'cited_document', where: s.id, what_it_would_establish: 'The act\'s CELEX, its kind, its parent act and its dates, from the document this source record already points at. A place to look.', retrieved: false }],
      location: { dataset: 'data/instruments.json', container: 'instruments', field: 'kind', shape_exists: true, why_here: `A subordinate act is an instrument record like any other, and the taxonomy already carries ${SUBORDINATE_KINDS.join(' and ')} for its kind. Its relation to the parent is a relationship record — rel-kind:implements exists — and not a field on either act.` },
      impact: 'analysis_incomplete',
      method: 'Matched the recorded titles in data/sources.json against a stated pattern for delegated and implementing acts, kept only the records the corpus itself typed as legislation so that a press release announcing an act is not mistaken for one, dropped the ones an instrument already claims, and cross-read the result against the instrument_kind terms the taxonomy declares and no record uses. What is established is that the corpus wrote the phrase down, never that the act exists.',
    });
  }
  return out;
};

/* ================================================================
   13 · stale records

   THE ANSWER HERE IS THAT THE QUESTION CANNOT BE ASKED, AND THAT IS
   THE FINDING.

   The obvious detector walks the graph for a record whose
   `last_verified` predates that of something it depends on, and on
   this corpus that produces nineteen findings. Every one of them is
   an artefact: `agent/integrate/canonical.mjs` works out that every
   dataset's dates are COMPILATION dates — 39 instrument records
   carrying one date, 84 claims carrying two — and
   VERIFICATION-POLICY §5 records that the field is per-record and
   the practice is not. Nineteen findings resting on a one-day
   difference between two bulk stamps would be quantity, and would
   assert a staleness the corpus cannot support.

   So this detector reports ONE gap, about the field rather than
   about the records, and names the nineteen as the cases where the
   question would have been askable. That is the honest shape, and it
   is what "do not reward quantity" looks like when the quantity is
   available and wrong.
   ================================================================ */

const staleRecord = (lens) => {
  const olderThanItsDependency = [];
  const lv = (id) => lens.node(id)?.record?.last_verified ?? null;
  for (const e of lens.graph.edges) {
    if (e.via_wildcard) continue;
    const a = lv(e.from);
    const b = lv(e.to);
    if (a && b && a < b) olderThanItsDependency.push(e);
  }
  if (!olderThanItsDependency.length) return [];

  const compiled = Object.entries(lens.verification).filter(([, v]) => v.is_compilation_date === true);
  if (!compiled.length) return [];   // per-record dates: a different detector's job, and it does not exist yet

  const seen = new Set();
  const d = [];
  for (const e of olderThanItsDependency) {
    if (seen.has(e.from)) continue;
    seen.add(e.from);
    const node = lens.node(e.from);
    d.push(demand({
      from: e.from, from_kind: e.from_kind, dataset: node?.dataset ?? null, field: 'last_verified', weight: 1,
      note: `${e.from} (last_verified ${lv(e.from)}) depends on ${e.to} (last_verified ${lv(e.to)}), so a dependency-staleness question is available here and cannot be answered from a compilation date`,
    }));
  }

  return [{
    gap_kind: 'stale_record',
    subject: 'data/*.json#last_verified',
    entities: compiled.map(([name]) => ({ kind: 'dataset', id: null, path: `data/${name}.json`, field: 'last_verified', note: `${lens.verification[name].per_record_count} record(s) across ${lens.verification[name].distinct.length} distinct date(s)` })),
    missing_concept: `No dataset records when an individual record was last checked. Every last_verified in data/ is a compilation date — ${compiled.map(([n, v]) => `${n}: ${v.per_record_count} record(s) over ${v.distinct.length} distinct date(s)`).join('; ')} — so the corpus cannot express the difference between a record re-read yesterday and one stamped in bulk alongside two hundred others.`,
    why_it_matters: `Staleness is the question every other agent here depends on: which records to re-verify, whether a detection is against a current corpus, whether a claim's evidence still stands. ${d.length} record(s) currently sit at an earlier date than something they depend on, which looks like exactly that finding and is an artefact of two bulk stamps a day apart. A detector that reported those ${d.length} as stale records would be asserting a decay it cannot establish — and the honest answer is that the field the question needs does not exist.`,
    absence_kind: 'unknown_not_determinable',
    demand: d,
    candidate_evidence: [{ kind: 'none_identified', where: null, what_it_would_establish: 'Nothing. This is not closed by finding a document: it is closed by a decision about whether last_verified is a per-record date, and then by doing the per-record verification that would populate it.', retrieved: false }],
    location: { dataset: 'data/claims.json', container: 'the last_verified field on every dataset', field: 'last_verified', shape_exists: false, why_here: 'The field already exists everywhere and is used as a compilation stamp. What is missing is either a per-record discipline for it or a second field that distinguishes the two, and choosing between those is a schema decision — which is why this is recorded as needing a shape that does not exist rather than as an empty field.' },
    impact: 'reader_could_be_misled',
    method: 'Borrowed the per-dataset compilation-date reading agent/integrate/canonical.mjs already computes from the spread of dates below each $last_verified, then walked the corpus graph for edges whose depending record carries an earlier date than its dependency. The walk is used as evidence that the question arises, never as evidence that any record is stale.',
  }];
};

/* ================================================================
   the table
   ================================================================ */

/**
 * The thirteen, in the brief's order.
 *
 * `why` is what the detector is for, in one sentence, and it is on
 * the record rather than in a document because a detector nobody can
 * state the purpose of is a detector nobody can tell is wrong.
 */
export const DETECTORS = [
  { kind: 'missing_instrument', label: 'missing instruments', why: 'An act the site cites as primary law and does not model.', detect: missingInstrument },
  { kind: 'missing_provision', label: 'missing provisions', why: 'An act with no articles for anything to cite.', detect: missingProvision },
  { kind: 'incomplete_timeline', label: 'incomplete timelines', why: 'A status the timeline does not date.', detect: incompleteTimeline },
  { kind: 'incomplete_applicability', label: 'incomplete applicability', why: 'A reader told an act reaches them and not what it requires — or not reached at all.', detect: incompleteApplicability },
  { kind: 'missing_institution', label: 'missing institutions', why: 'A decision the corpus cannot attribute to a body.', detect: missingInstitution },
  { kind: 'missing_competence', label: 'missing competences', why: 'An act nobody in the model enforces.', detect: missingCompetence },
  { kind: 'incomplete_enforcement', label: 'incomplete enforcement', why: 'A zero that may be an absence of looking, and an unknown a standing argument rests on.', detect: incompleteEnforcement },
  { kind: 'unsupported_claim', label: 'unsupported claims', why: 'The site stating what the law is, on nothing but itself, with records built on it.', detect: unsupportedClaim },
  { kind: 'missing_source_relationship', label: 'missing source relationships', why: 'One document held as two records, with no way to say so.', detect: missingSourceRelationship },
  { kind: 'missing_instrument_relationship', label: 'missing instrument relationships', why: 'A pair the brief argues about and the model does not connect.', detect: missingInstrumentRelationship },
  { kind: 'missing_glossary_concept', label: 'missing glossary concepts', why: 'A concept leaned on harder than things the glossary already defines.', detect: missingGlossaryConcept },
  { kind: 'missing_subordinate_instrument', label: 'missing implementing / delegated / technical instruments', why: 'The act that says what the parent act actually requires.', detect: missingSubordinateInstrument },
  { kind: 'stale_record', label: 'stale records', why: 'Whether anything can be said about staleness at all.', detect: staleRecord },
];

export const DETECTOR_KINDS = DETECTORS.map((d) => d.kind);

/* Fail at load rather than at run time. A kind with no detector is a
   claim of coverage the code does not have, and a detector claiming
   a kind outside the vocabulary would produce records nothing can
   validate. */
{
  const missing = DEPTH_GAP_KINDS.filter((k) => !DETECTOR_KINDS.includes(k));
  if (missing.length) throw new Error(`no detector for depth gap kind(s): ${missing.join(', ')}`);
  const unknown = DETECTOR_KINDS.filter((k) => !DEPTH_GAP_KINDS.includes(k));
  if (unknown.length) throw new Error(`detector claims unknown depth gap kind(s): ${unknown.join(', ')}`);
  if (new Set(DETECTOR_KINDS).size !== DETECTOR_KINDS.length) throw new Error('two detectors claim the same kind');
}

export { SUBORDINATE_RE, SUBORDINATE_KINDS, SUBSTANTIVE };
