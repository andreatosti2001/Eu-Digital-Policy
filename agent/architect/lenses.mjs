/* ============================================================
   agent/architect/lenses.mjs — the eight questions, as code

   SESSION 13's brief asks eight questions of the information
   model. There is one lens per question, in the brief's own order,
   and each one answers from the repository rather than from
   anything anybody knows about EU law:

     1  Are entity types missing?
     2  Are relationship types missing?
     3  Are datasets duplicating concepts?
     4  Is the data model too coarse?
     5  Are important facts being forced into prose because the
        schema cannot represent them?
     6  Are comparison dimensions missing?
     7  Are regulatory relationships under-modelled?
     8  Is versioning sufficient?

   A LENS THAT FINDS NOTHING IS A RESULT. Each one reports what it
   examined as well as what it found, so a reader can tell "looked
   and found nothing" from "did not look" — the same rule
   `agent/depth/` works under, and the reason a zero from one of
   these is information rather than an untested branch.

   EVERY FINDING DECLARES `closes_by`. `record` means somebody
   writing a value into a shape that already exists would close it,
   and it is Data Depth's finding, not this agent's; `shape` means
   no record closes it. `boundary.mjs` does the partitioning and
   nothing here may skip it. A lens that reported everything it
   noticed would be a second Data Depth Agent under a new name.

   EVERY FINDING CARRIES `demand`: the records in the corpus that
   are, today, saying something the missing shape would hold. A
   finding with an empty demand is a design opinion about EU law,
   and it is set aside as one.
   ============================================================ */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROSE_FIELDS, shapeOf } from './model.mjs';

const arr = (x) => (Array.isArray(x) ? x : []);
const norm = (s) => String(s ?? '').trim().toLowerCase();

/** A field name that says the thing it belongs to happens at a
 *  time. Stated rather than inferred, because a null date is still
 *  the model saying so and a value check would miss it. */
export const DATE_NAMED = /(^|_)(date|deadline|opened|closed|since|until|published|accessed|as_of)($|_)/;

/** A prose field whose whole job is to NAME the record it sits on.
 *  A title that contains an instrument's name is a title. */
export const NAMING_FIELDS = new Set(['title', 'full_name', 'short_name', 'heading', 'dek', 'label']);

/** The fields this corpus uses to point at another record. Read off
 *  the datasets rather than declared in the abstract: these are the
 *  names that actually carry ids here. */
export const REFERENCE_FIELDS = new Set([
  'instrument', 'instruments', 'institutions', 'authority', 'provisions', 'claims',
  'sources', 'enforcement', 'legal_basis', 'milestones', 'timeline_events',
  'related_terms', 'actors', 'amends', 'amended_by', 'repeals', 'from', 'to',
  'parent', 'children', 'supersedes', 'depends_on',
]);

/* ============================================================
   1 · Are entity types missing?
   ============================================================ */

/**
 * An embedded object is an entity the model has not named.
 *
 * Derived rather than hand-picked: a field whose value is an object
 * with no `id`, carrying at least one value that resolves to a
 * taxonomy term AND at least one date-shaped value, is a record in
 * everything but name. It has a status from the enum authority and
 * a date of its own, and nothing can cite it, reference it, or put
 * it on the timeline, because it has no id.
 *
 * `data/instruments.json`'s `dna` is deliberately NOT one: it
 * carries no status and no date, and it is a comparison slot rather
 * than a thing that happened. The rule finds that out rather than
 * being told it.
 */
export const entityTypeLens = {
  id: 'entity_type',
  question: 1,
  label: 'entity types',
  asks: 'Are entity types missing?',
  why: 'A thing with its own status, its own date and no id is an entity the model has not named.',
  inspect(model) {
    const findings = [];
    const examined = [];
    const taxonomyIds = new Set();
    for (const [dim, terms] of Object.entries(model.corpus.db.taxonomy ?? {})) {
      if (dim.startsWith('$') || !Array.isArray(terms)) continue;
      for (const t of terms) taxonomyIds.add(t.id);
    }

    for (const c of model.containers) {
      for (const f of c.fields) {
        if (!f.shapes.includes('object')) continue;
        const samples = f.samples.filter((v) => v && typeof v === 'object' && !Array.isArray(v));
        if (!samples.length) continue;
        examined.push(`${c.container}[].${f.field}`);

        const records = recordsOf(model, c).filter((r) => r?.[f.field] && typeof r[f.field] === 'object' && !Array.isArray(r[f.field]));
        if (!records.length) continue;
        if (records.some((r) => typeof r[f.field].id === 'string')) continue;

        if (records.length < 2) continue;
        const subFields = [...new Set(records.flatMap((r) => Object.keys(r[f.field])))];
        if (subFields.length < 3) continue;
        /* A DATE-NAMED SUB-FIELD IS THE TEST, and it is what keeps
           `dna` out. A comparison slot has no date because it is not
           a thing that happened; an appeal, a judgment and a
           transposition each carry one. Named rather than valued: a
           date field that is null on every record is still the model
           saying this thing happens at a time. */
        const dateNamed = subFields.filter((k) => DATE_NAMED.test(k));
        if (!dateNamed.length) continue;

        const typed = records.filter((r) => Object.values(r[f.field]).some((v) => typeof v === 'string' && taxonomyIds.has(v)));
        const dated = records.filter((r) => Object.entries(r[f.field]).some(([k, v]) => DATE_NAMED.test(k) && typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)));
        const carrying = records;

        /* Does the corpus already declare a home for a dated thing
           like this, and is the record using it? `enforcement[]`
           carries `timeline_events[]` and data/taxonomy.json carries
           `event:judicial`; an embedded judgment beside an empty
           reference array is the shape being bypassed rather than
           absent, which is a different finding and a sharper one. */
        const refField = c.fields.find((x) => /^timeline_events$/.test(x.field));
        const declaredHome = refField
          ? {
            field: refField.field,
            using: records.filter((r) => arr(r[refField.field]).length).length,
            of: records.length,
          }
          : null;
        findings.push({
          lens: 'entity_type',
          question: 1,
          subject: `${c.dataset}#${c.container}[].${f.field}`,
          closes_by: 'shape',
          missing_shape: `An id for what \`${c.container}[].${f.field}\` holds. It is an object with ${subFields.length} field(s) including ${dateNamed.join(' and ')}${typed.length ? `, a status from data/taxonomy.json on ${typed.length} record(s)` : ''}, present on ${records.length} record(s) — and no id. Nothing can cite it, no claim can reference it, tools/validate.mjs resolves nothing into it, and it cannot be an event on the timeline.`,
          why_it_matters: `\`${dateNamed.join('` and `')}\` ${dateNamed.length === 1 ? 'says' : 'say'} the model treats this as a thing that happens at a time${dated.length ? `, and ${dated.length} record(s) carry a real date for it` : ', though no record carries a date value for it yet — which is a different absence again'}. ${declaredHome ? `${c.container}[] already carries \`${declaredHome.field}\`, the reference array that would put such a thing on data/timeline.json, and ${declaredHome.of - declaredHome.using} of ${declaredHome.of} record(s) carrying this object leave it empty: the home exists and is bypassed, so the same fact has two shapes and only one of them is citable.` : 'Every other record of this shape in the corpus has an id.'}`,
          method: `Walked every object-valued field on every container, kept those whose value carries no id on any record, has at least three sub-fields, appears on at least two records, and includes a date-named sub-field. The date-named test is what separates a thing that happened from a comparison slot: data/instruments.json's \`dna\` has nine sub-fields and no date, and is not reported.`,
          entities: [{ kind: 'instrument', id: null, path: c.dataset, field: f.field, note: `The embedded object. ${records.length} record(s) carry one.` }],
          invariants: ['one_home_per_fact'],
          modules: [c.dataset],
          demand: carrying.slice(0, 12).map((r) => ({
            dataset: c.dataset, record_id: r.id, field: f.field,
            saying: summarise(r[f.field]),
          })),
          declared_home: declaredHome,
          demand_total: carrying.length,
          risk: 'medium',
          operations: [{
            op: 'add',
            target: `${c.dataset} — a container for what ${c.container}[].${f.field} currently embeds`,
            current: `An object on ${records.length} ${c.container} record(s), with no id.`,
            proposed: null,
            rationale: `Giving it an id and a container of its own would make it citable, referenceable and datable like every other record in the corpus. WHAT ITS FIELDS SHOULD BE IS NOT PROPOSED HERE: the fields it already carries are visible in the demand, and whether that set is right is a decision about what the corpus needs to say, which is the repository owner's.`,
          }],
          scope_note: 'It proposes a shape and no values. No record is drafted, no id is minted, and nothing is said about what any of these objects mean in law.',
        });
      }
    }
    return { findings, examined };
  },
};

/* ============================================================
   2 · Are relationship types missing?
   ============================================================ */

/**
 * A relationship the corpus expresses as a FIELD as well as an
 * edge.
 *
 * `data/taxonomy.json` declares `relationship_kind`, and
 * `data/instruments.json` has a `relationships[]` container that
 * uses it. It ALSO has `amends`, `amended_by` and `repeals` as
 * fields on the instrument — and `rel-kind:amends` and
 * `rel-kind:repeals` are terms in the vocabulary. So the same edge
 * has two homes, and the two can disagree.
 *
 * Derived: a `relationship_kind` term whose bare word is also a
 * field on a container that has a relationships edge container.
 */
export const relationshipTypeLens = {
  id: 'relationship_type',
  question: 2,
  label: 'relationship types',
  asks: 'Are relationship types missing?',
  why: 'An edge stored twice, and a declared kind nothing uses.',
  inspect(model) {
    const findings = [];
    const examined = [];
    const kinds = arr(model.corpus.db.taxonomy?.relationship_kind).map((t) => ({ id: t.id, label: t.label ?? null, bare: String(t.id).split(':').pop() }));

    for (const c of model.containers) {
      if (c.dataset === 'data/taxonomy.json') continue;
      const edges = edgeContainerOf(model, c.dataset);
      if (!edges || edges.container === c.container) continue;

      /* Every kind that is ALSO a field on the record container —
         including the passive inverse, because `amended_by` is the
         same edge read the other way. */
      const collisions = [];
      for (const k of kinds) {
        const stem = k.bare.replace(/s$/, '');
        for (const f of c.fields) {
          examined.push(`${c.container}[].${f.field} vs ${k.id}`);
          const isActive = f.field === k.bare;
          const isPassive = f.field === `${stem}ed_by` || f.field === `${stem}d_by` || f.field === `${k.bare}_by`;
          if (!isActive && !isPassive) continue;
          const using = recordsOf(model, c).filter((r) => arr(r[f.field]).length);
          if (!using.length) continue;
          collisions.push({ kind: k, field: f.field, direction: isActive ? 'active' : 'passive', using, edges: recordsOf(model, edges).filter((r) => r.kind === k.id) });
        }
      }
      if (!collisions.length) continue;

      const usingTotal = [...new Set(collisions.flatMap((x) => x.using.map((r) => r.id)))];
      findings.push({
        lens: 'relationship_type',
        question: 2,
        subject: `${c.dataset}#${c.container}-edge-fields`,
        closes_by: 'shape',
        missing_shape: `One home for the edge${new Set(collisions.map((x) => x.kind.id)).size === 1 ? '' : 's'} ${[...new Set(collisions.map((x) => x.kind.id))].map((k) => `"${k}"`).join(', ')}. ${collisions.map((x) => `\`${c.container}[].${x.field}\` carries it on ${x.using.length} record(s) and ${edges.container}[] carries ${x.edges.length} record(s) of that kind`).join('; ')}. Neither home is derived from the other and nothing compares them.`,
        why_it_matters: `${edges.container}[] carries ${edges.fields.map((f) => f.field).join(', ')} — a summary, the provisions the relation turns on, the claims that rest on it, its sources and a verification date. The field home carries an id and nothing else. So the same relationship is evidenced or bare depending on which home a renderer reads, an edge added to one is invisible in the other, and tools/validate.mjs resolves both without ever noticing they disagree. AGENTS.md's third rule is one home per fact.`,
        method: `Compared the bare word of every data/taxonomy.json relationship_kind term, and its passive inverse, against the field names of ${c.container}[] — for a dataset that already carries an edge container. A term that is also a populated field is an edge with two homes.`,
        entities: [
          ...collisions.map((x) => ({ kind: 'instrument', id: null, path: c.dataset, field: x.field, note: `The field home for ${x.kind.id}, ${x.direction}. ${x.using.length} record(s).` })),
          { kind: 'relationship', id: null, path: c.dataset, field: 'kind', note: `The edge home. ${recordsOf(model, edges).length} edge(s) in total.` },
        ],
        invariants: ['one_home_per_fact', 'taxonomy_enum_authority'],
        modules: [c.dataset],
        demand: collisions.flatMap((x) => x.using.slice(0, 6).map((r) => ({
          dataset: c.dataset, record_id: r.id, field: x.field,
          saying: `${x.field}: ${arr(r[x.field]).join(', ')} — the same edge ${edges.container}[] also models, as ${x.kind.id}`,
        }))).slice(0, 12),
        demand_total: usingTotal.length,
        risk: 'medium',
        operations: [{
          op: 'modify',
          target: `${c.dataset} — ${collisions.map((x) => `${c.container}[].${x.field}`).join(', ')} and ${edges.container}[]`,
          current: collisions.map((x) => `${x.field} on ${x.using.length} record(s); ${x.edges.length} edge(s) of kind ${x.kind.id}`).join('; '),
          proposed: null,
          rationale: `One of the two becomes the home and the other is derived from it at render time, the way js/format.js derives evidence grades and js/pipeline.js the enforcement stages. WHICH ONE IS THE HOME IS NOT PROPOSED HERE: the edge container can carry evidence and the field cannot, which argues for the edge; the field is what the renderers currently read, which is a migration cost. That trade-off is the repository owner's, and so is whether the passive direction stays readable without being stored.`,
        }],
        scope_note: 'It proposes that the fact have one home. It moves no data, chooses neither home, and creates no relationship record.',
      });
    }

    /* A declared kind nothing uses. Looked at deliberately, because
       "the vocabulary is bigger than the model" is one of the ways
       question 2 can be answered — and the answer is a record, not
       a shape, so it is routed rather than reported. */
    for (const c of model.containers.filter((x) => x.dataset !== 'data/taxonomy.json' && /relationship/i.test(x.container))) {
      const used = new Set(recordsOf(model, c).map((r) => r.kind));
      const unused = kinds.filter((k) => !used.has(k.id));
      examined.push(`${c.dataset}#unused-kinds`);
      if (!unused.length) continue;
      findings.push({
        lens: 'relationship_type',
        question: 2,
        subject: `${c.dataset}#unused-relationship-kinds`,
        closes_by: 'record',
        route: 'data_depth',
        missing_shape: `${unused.length} relationship_kind term(s) that no edge uses: ${unused.map((k) => k.id).join(', ')}.`,
        why_it_matters: 'A declared term nothing uses is either a relation the corpus has not recorded yet or a term that should not exist. Which of the two it is decides what to do, and both are decided by looking at pairs of instruments rather than at the shape.',
        method: `Compared the relationship_kind terms declared in data/taxonomy.json against the kinds ${c.container}[] actually carries.`,
        entities: [],
        demand: [],
        demand_total: 0,
        risk: 'low',
        operations: [],
        scope_note: '',
      });
    }
    return { findings, examined };
  },
};

/* ============================================================
   3 · Are datasets duplicating concepts?
   ============================================================ */

export const duplicationLens = {
  id: 'duplication',
  question: 3,
  label: 'duplicated concepts',
  asks: 'Are datasets duplicating concepts?',
  why: 'A vocabulary held twice, and a dataset nothing reads because a page carries a copy of it.',
  inspect(model) {
    const findings = [];
    const examined = [];

    /* A vocabulary copied out of the enum authority into a module. */
    for (const v of model.vocabularies) {
      examined.push(`taxonomy.${v.dimension}`);
      for (const copy of arr(v.copies)) {
        findings.push({
          lens: 'duplication',
          question: 3,
          subject: `${copy.module}#${copy.name ?? 'array'}`,
          closes_by: 'shape',
          missing_shape: `One home for the ${v.dimension} vocabulary. data/taxonomy.json declares ${v.terms.length} term(s) and ${copy.module} holds ${copy.name ? `\`${copy.name}\`` : 'an array literal'} carrying ${copy.covered} of them as bare strings.`,
          why_it_matters: `data/taxonomy.json is the enum authority every other dataset resolves against. This copy is a LIST rather than a dispatch: it decides what the module enumerates, so adding a term to the authority changes nothing on the page and removing one leaves the module asking for a term that no longer exists. Neither failure is caught — no validator compares the two.`,
          method: `Read every array literal of bare string members in js/ and compared its members against each taxonomy dimension's term ids with the dimension prefix removed. A dispatch — a switch or a chain of equality tests, which a renderer needs whatever the vocabulary lives in — is deliberately not counted; only a list is.`,
          entities: [
            { kind: 'taxonomy_term', id: null, path: 'data/taxonomy.json', field: v.dimension, note: `The authority. ${v.terms.length} term(s).` },
            { kind: 'instrument', id: null, path: copy.module, field: copy.name, note: `The copy. ${copy.covered} of ${copy.of} term(s), ${copy.complete ? 'complete' : `missing ${copy.missing.join(', ')}`}.` },
          ],
          invariants: ['one_home_per_fact', 'taxonomy_enum_authority'],
          modules: ['data/taxonomy.json', copy.module],
          demand: [{ dataset: 'data/taxonomy.json', record_id: v.dimension, field: null, saying: `${v.terms.length} term(s) declared here and listed again in ${copy.module}` }],
          demand_total: v.terms.length,
          risk: 'medium',
          operations: [{
            op: 'modify',
            target: `${copy.module} — ${copy.name ?? 'the array literal'}`,
            current: `A literal list of ${copy.covered} member(s).`,
            proposed: null,
            rationale: `Derived from data/taxonomy.json at render time rather than restated. js/data.js already loads the taxonomy and is the only module that fetches a dataset, so the term list is reachable without a second fetch and without a build step. THE ORDER OF THE ROWS IS NOT THE TAXONOMY'S and would have to survive the change — whether by an explicit order field or by the taxonomy's own array order is a decision, not a detail.`,
          }],
          scope_note: 'It proposes that the list have one home. It changes no term, adds none, and proposes no rendering change beyond where the list is read from.',
        });
      }
    }

    /* A dataset nothing fetches, whose content a page inlines. */
    const fetched = fetchedDatasets(model);
    for (const [dataset, holder] of Object.entries(model.corpus.db)) {
      const path = `data/${dataset}.json`;
      examined.push(path);
      if (fetched.has(dataset)) continue;
      const inlining = model.pages.filter((p) => p.inline_content_bytes > 0);
      if (!inlining.length) continue;
      const bytes = Buffer.byteLength(JSON.stringify(holder), 'utf8');
      findings.push({
        lens: 'duplication',
        question: 3,
        subject: `${path}#not-fetched`,
        closes_by: 'shape',
        missing_shape: `One home for what ${path} holds. No module in js/ names it, so nothing loads it at runtime, while ${inlining.map((p) => `${p.page} inlines ${p.inline_content_bytes} bytes`).join(' and ')} of content in a script block.`,
        why_it_matters: `Two copies of a fact can disagree, and these already have: docs/CURRENT-ARCHITECTURE.md §8 records that meta.standfirst differs between the two homes. Nothing compares them — no validator reads the inlined blob — so the canonical file can be edited with no effect on the page and the page can be edited with no effect on the file.`,
        method: `Listed every dataset in data/ and every dataset name js/ modules pass to js/data.js's load(), which is the only module that fetches one. A dataset no module names is a dataset nothing reads. The inlined block is measured by byte length; its content is not read here, because the brief's prose is the author's argument.`,
        entities: [
          { kind: 'brief_part', id: null, path, field: null, note: `${bytes} bytes, fetched by nothing.` },
          ...inlining.map((p) => ({ kind: 'brief_part', id: null, path: p.page, field: 'window.__CONTENT__', note: `${p.inline_content_bytes} bytes inlined.` })),
        ],
        invariants: ['one_home_per_fact', 'single_data_gateway'],
        modules: [path, ...inlining.map((p) => p.page)],
        demand: inlining.map((p) => ({ dataset: p.page, record_id: null, field: 'window.__CONTENT__', saying: `${p.inline_content_bytes} bytes of content that ${path} also holds` })),
        demand_total: inlining.length,
        risk: 'high',
        operations: [{
          op: 'modify',
          target: `${path} and ${inlining.map((p) => p.page).join(', ')}`,
          current: `${bytes} bytes in ${path} that nothing fetches; ${inlining.reduce((n, p) => n + p.inline_content_bytes, 0)} bytes inlined in a script block.`,
          proposed: null,
          rationale: `One of the two becomes the home. THIS IS NOT A CODE DEFECT TO FIX ON AN AGENT'S INITIATIVE: the inline blob is what the page renders today, the standfirst has already drifted, and deciding which text is right is an editorial decision about the site's own words. The handover has said "do not fix this on your own initiative" since SESSION 08 and this proposal does not change that — it states the shape of the problem and stops.`,
        }],
        scope_note: 'It reconciles nothing, edits no prose, and does not say which of the two homes is correct. It measures the divergence and names the decision.',
      });
    }
    return { findings, examined };
  },
};

/* ============================================================
   4 · Is the data model too coarse?
   ============================================================ */

/**
 * A field is too coarse when the corpus is already encoding
 * structure INSIDE its value that the schema does not model.
 *
 * Derived: a string field whose values carry, in most cases, more
 * than one structural component — a bracketed sub-reference, a
 * range, a percentage-of-turnover qualifier — where the same
 * concept elsewhere in the corpus is stored as structure.
 */
export const granularityLens = {
  id: 'granularity',
  question: 4,
  label: 'granularity',
  asks: 'Is the data model too coarse?',
  why: 'A scalar carrying what the corpus stores as structure somewhere else.',
  inspect(model) {
    const findings = [];
    const examined = [];

    /* The same concept, two shapes. A field whose name names a
       concept another field also names, where one is a scalar and
       the other an object, is a concept the model measures two
       ways. */
    const byConcept = new Map();
    for (const c of model.containers) {
      /* The NESTED census, not the top-level one: `sanction_ceiling`
         lives under `dna` on an instrument and `fine_eur` at the top
         level of an enforcement action, and a comparison that only
         saw top-level keys would see nothing. */
      for (const f of c.nested) {
        const concept = conceptOf(f.field);
        if (!concept) continue;
        if (!byConcept.has(concept)) byConcept.set(concept, []);
        byConcept.get(concept).push({ container: c, field: f });
      }
    }
    for (const [concept, holders] of byConcept) {
      examined.push(`concept:${concept}`);
      const scalar = holders.filter((h) => h.field.shapes.some((s) => s === 'number' || s === 'string'));
      const structured = holders.filter((h) => h.field.shapes.includes('object'));
      if (!scalar.length || !structured.length) continue;

      const scalarRecords = scalar.flatMap((h) => recordsOf(model, h.container)
        .map((r) => ({ h, r, value: atPath(r, h.field.path) }))
        .filter((x) => x.value !== null && x.value !== undefined));
      if (!scalarRecords.length) continue;

      findings.push({
        lens: 'granularity',
        question: 4,
        subject: `concept:${concept}`,
        closes_by: 'shape',
        missing_shape: `One shape for "${concept}". ${scalar.map((h) => `\`${h.container.container}[].${h.field.path}\` stores it as a ${h.field.shapes.filter((s) => s !== 'null').join('/')}`).join('; ')}, while ${structured.map((h) => `\`${h.container.container}[].${h.field.path}\` stores it as an object with ${Object.keys(h.field.samples.find((v) => v && typeof v === 'object') ?? {}).join(', ')}`).join('; ')}.`,
        why_it_matters: `The two cannot be compared or summed. A reader looking at what an act permits and what an authority actually imposed is looking at a structure on one side and a bare ${scalar[0].field.shapes.filter((s) => s !== 'null')[0]} on the other, and no derivation can bridge them without deciding what the scalar leaves out.`,
        method: `Grouped every field on every container by the concept its name carries, then kept the concepts stored as a scalar in one place and as an object in another. Both shapes are read from the records rather than declared.`,
        entities: [
          ...scalar.map((h) => ({ kind: 'instrument', id: null, path: h.container.dataset, field: h.field.path, note: `Scalar: ${h.field.shapes.join('|')}, on ${h.field.present - h.field.nulls} of ${h.field.of} record(s).` })),
          ...structured.map((h) => ({ kind: 'instrument', id: null, path: h.container.dataset, field: h.field.path, note: `Object, on ${h.field.present - h.field.nulls} of ${h.field.of} record(s).` })),
        ],
        invariants: ['one_home_per_fact'],
        modules: [...new Set([...scalar, ...structured].map((h) => h.container.dataset))],
        demand: scalarRecords.slice(0, 12).map(({ h, r, value }) => ({
          dataset: h.container.dataset, record_id: r.id, field: h.field.path,
          saying: `${h.field.path}: ${summarise(value)}`,
        })),
        demand_total: scalarRecords.length,
        risk: 'medium',
        operations: [{
          op: 'modify',
          target: `${scalar.map((h) => `${h.container.dataset} ${h.container.container}[].${h.field.path}`).join(', ')}`,
          current: `A ${scalar[0].field.shapes.filter((s) => s !== 'null').join('/')} on ${scalarRecords.length} record(s).`,
          proposed: null,
          rationale: `The two shapes become one, or the difference between them is stated on the record rather than left to be inferred. WHICH SHAPE WINS IS NOT PROPOSED: widening the scalar changes what every existing record asserts, and narrowing the object loses what it carries. Both are data decisions.`,
        }],
        scope_note: 'It names a concept stored two ways. It converts nothing, and it asserts nothing about any amount.',
      });
    }
    return { findings, examined };
  },
};

/* ============================================================
   5 · Facts forced into prose
   ============================================================ */

/**
 * A prose field naming a record the corpus already holds.
 *
 * This is the sharpest of the eight, because it is exact: the
 * corpus knows the short and full names of every instrument and
 * institution it carries, and a prose field containing one is a
 * reference that had nowhere else to go.
 */
export const proseLens = {
  id: 'fact_in_prose',
  question: 5,
  label: 'facts in prose',
  asks: 'Are important facts being forced into prose because the schema cannot represent them?',
  why: 'A prose field naming a record the corpus holds, on a record that does not reference it anywhere.',
  inspect(model) {
    const findings = [];
    const examined = [];
    const byField = new Map();

    for (const c of model.containers) {
      if (c.dataset === 'data/taxonomy.json') continue;
      for (const record of recordsOf(model, c)) {
        /* EVERY ID THIS RECORD ALREADY REFERENCES, anywhere on it.
           This is the test that keeps the lens honest. A definition
           that names the AI Act on a glossary term whose
           `instruments` array already holds `ai-act` is not a fact
           forced into prose — the reference exists, and the sentence
           is the explanation beside it. Only a name with NO
           corresponding reference is a fact with nowhere to go. */
        const referenced = new Set();
        walkStrings(record, (v, path) => {
          if (PROSE_FIELDS.has(path[path.length - 1])) return;
          referenced.add(v);
        });
        const selfNames = new Set([record.id, norm(record.short_name), norm(record.full_name), norm(record.term), norm(record.title)].filter(Boolean));

        walkStrings(record, (value, path) => {
          const field = path[path.length - 1];
          if (!PROSE_FIELDS.has(field)) return;
          /* A field whose whole job is to NAME the record is not a
             reference gone missing. */
          if (NAMING_FIELDS.has(field)) return;
          examined.push(`${c.container}[].${path.join('.')}`);
          const hay = norm(value);
          if (hay.length < 24) return;
          for (const [name, targets] of model.names) {
            if (selfNames.has(name)) continue;
            if (!new RegExp(`(^|[^a-z0-9])${escapeRe(name)}([^a-z0-9]|$)`).test(hay)) continue;
            /* Already referenced by this record, in a field that is
               not prose? Then the schema CAN represent it and does. */
            const unreferenced = targets.filter((t) => !referenced.has(t.id));
            if (!unreferenced.length) continue;
            const key = `${c.dataset}#${c.container}[].${path.join('.')}`;
            if (!byField.has(key)) byField.set(key, { dataset: c.dataset, container: c.container, path: path.join('.'), field, hits: [] });
            byField.get(key).hits.push({ record_id: record.id, names: unreferenced.map((t) => t.id), matched: name, value });
          }
        });
      }
    }

    for (const [key, g] of byField) {
      const container = model.containers.find((c) => c.dataset === g.dataset && c.container === g.container);
      const refFields = (container?.fields ?? []).filter((f) => REFERENCE_FIELDS.has(f.field)).map((f) => f.field);
      const named = [...new Set(g.hits.flatMap((h) => h.names))];
      findings.push({
        lens: 'fact_in_prose',
        question: 5,
        subject: key,
        closes_by: 'shape',
        missing_shape: `A reference on \`${g.container}[].${g.path}\`. It is prose, and on ${g.hits.length} record(s) it names ${named.length} record(s) the corpus holds — ${named.slice(0, 6).join(', ')}${named.length > 6 ? `, +${named.length - 6}` : ''} — none of which the naming record references anywhere.`,
        why_it_matters: `A reference in prose is invisible to tools/validate.mjs, which resolves references and would catch a broken one; invisible to the dependency walk agent/detector/graph.mjs derives, so a change to the named record does not reach this one; and invisible to a reader filtering by it. ${refFields.length ? `${g.container}[] carries ${refFields.join(', ')} for exactly this kind of target, and the naming record leaves them without this id.` : `${g.container}[] carries no reference field for this target at all.`}`,
        method: `Indexed the short name, full name and aliases of every instrument and institution in the corpus and matched them whole-word against the value of every field on the stated prose list (agent/architect/model.mjs#PROSE_FIELDS). Three exclusions, each of which removed a class of false finding: a field whose job is to name the record it is on; a record naming itself; and — the one that matters — a name the same record ALREADY references in a non-prose field, because there the schema can represent it and does.`,
        entities: [{ kind: 'instrument', id: null, path: g.dataset, field: g.path, note: `Prose naming an unreferenced record, on ${g.hits.length} record(s).` }],
        invariants: ['one_home_per_fact'],
        modules: [g.dataset],
        demand: g.hits.slice(0, 12).map((h) => ({
          dataset: g.dataset, record_id: h.record_id, field: g.path,
          saying: `names ${h.names.join(', ')} as "${h.matched}" in prose: "${String(h.value).slice(0, 160)}"`,
        })),
        demand_total: g.hits.length,
        /* Two, not one. See boundary.mjs#demandOf. */
        demand_floor: 2,
        risk: 'medium',
        operations: [{
          op: 'add',
          target: `${g.dataset} — a reference alongside ${g.container}[].${g.path}`,
          current: `Prose on ${g.hits.length} record(s), naming ${named.join(', ')}.`,
          proposed: null,
          rationale: `A reference field beside the prose, not instead of it: the sentence says WHY and the reference says WHAT, and collapsing the two would lose the reason. THE PROSE IS NOT REWRITTEN — it is the author's, on a production site, and this agent does not edit a sentence.`,
        }],
        scope_note: 'It proposes a field beside the prose. It rewrites no sentence, resolves no reference, and writes nothing into data/.',
      });
    }
    findings.sort((a, b) => b.demand_total - a.demand_total || a.subject.localeCompare(b.subject));
    return { findings, examined };
  },
};

/* ============================================================
   6 · Are comparison dimensions missing?
   ============================================================ */

export const comparisonLens = {
  id: 'comparison_dimension',
  question: 6,
  label: 'comparison dimensions',
  asks: 'Are comparison dimensions missing?',
  why: 'The comparison vocabulary and the comparison data, checked against each other.',
  inspect(model) {
    const findings = [];
    const examined = [`taxonomy.dna_dimension vs ${model.comparison.where}`];
    const c = model.comparison;

    if (c.declared_unused.length || c.used_undeclared.length) {
      findings.push({
        lens: 'comparison_dimension',
        question: 6,
        subject: 'data/taxonomy.json#dna_dimension',
        closes_by: 'shape',
        missing_shape: `An agreement between the comparison vocabulary and the comparison data. data/taxonomy.json declares ${c.declared.length} dna_dimension term(s); ${c.where} stores ${c.used.length} key(s). ${c.declared_unused.length} declared term(s) are stored by nothing — ${c.declared_unused.join(', ')} — and ${c.used_undeclared.length} stored key(s) are declared by nothing — ${c.used_undeclared.join(', ')}.`,
        why_it_matters: `The vocabulary is stored as OBJECT KEYS rather than as field values, and nothing in tools/validate.mjs compares a key against the enum authority — it checks the values inside dna and not the names of the slots. So a dimension can be declared and never stored, or stored under a name the authority does not know, and every check in this repository passes. Two of the four unused terms are stored nowhere because they are derived at render time, which is correct and is a different fact from the other two, and the model cannot currently tell those two cases apart.`,
        method: `Read the dna_dimension term ids from data/taxonomy.json with the prefix removed, read the keys of the dna object on every instrument, and compared the two sets. Both are read from the files; neither is declared here.`,
        entities: [
          { kind: 'taxonomy_term', id: null, path: 'data/taxonomy.json', field: 'dna_dimension', note: `${c.declared.length} term(s) declared.` },
          { kind: 'instrument', id: null, path: 'data/instruments.json', field: 'dna', note: `${c.used.length} key(s) stored, on ${c.carrying} of ${c.records} instrument(s).` },
        ],
        invariants: ['taxonomy_enum_authority', 'one_home_per_fact', 'derivation_over_storage'],
        modules: ['data/taxonomy.json', 'data/instruments.json'],
        demand: [
          { dataset: 'data/taxonomy.json', record_id: 'dna_dimension', field: null, saying: `declares ${c.declared.join(', ')}` },
          { dataset: 'data/instruments.json', record_id: null, field: 'dna', saying: `${c.carrying} instrument(s) store ${c.used.join(', ')}` },
        ],
        demand_total: c.carrying + 1,
        risk: 'medium',
        operations: [{
          op: 'modify',
          target: 'data/taxonomy.json dna_dimension, and the dna slot names on data/instruments.json',
          current: `Declared: ${c.declared.join(', ')}. Stored: ${c.used.join(', ')}.`,
          proposed: null,
          rationale: `The two sets agree, and a term the comparison DERIVES rather than stores is marked as derived so that "declared and never stored" stops meaning two different things at once. WHICH NAME WINS for each mismatched pair is not proposed: renaming a taxonomy id is forbidden outright (AGENTS.md — ids are never renamed), and renaming a storage key changes what every renderer reads, so this is a decision with a migration attached.`,
        }],
        scope_note: 'It reports the disagreement and proposes that it be resolved. It renames nothing — a taxonomy id is never renamed here — and adds no dimension.',
      });
    }

    if (c.carrying < c.records) {
      findings.push({
        lens: 'comparison_dimension',
        question: 6,
        subject: 'data/instruments.json#dna-coverage',
        closes_by: 'record',
        route: 'data_depth',
        missing_shape: `A dna block on the ${c.records - c.carrying} instrument(s) that carry none.`,
        why_it_matters: 'The comparison table renders "no DNA recorded for this instrument" for each of them.',
        method: 'Counted the instruments carrying a dna object.',
        entities: [],
        demand: [],
        demand_total: 0,
        risk: 'low',
        operations: [],
        scope_note: '',
      });
    }
    return { findings, examined };
  },
};

/* ============================================================
   7 · Are regulatory relationships under-modelled?
   ============================================================ */

/**
 * An edge that cannot say when it started.
 *
 * `rel-kind:amends` and `rel-kind:repeals` are events with a date —
 * the corpus dates them, on the timeline, as `event:*` records. The
 * relationship record carries `last_verified`, which is when
 * somebody checked it, and nothing that says when the relation
 * began. So "the AI Act as amended" and "the AI Act as enacted" are
 * the same node.
 */
export const relationshipDepthLens = {
  id: 'relationship_depth',
  question: 7,
  label: 'relationship modelling',
  asks: 'Are regulatory relationships under-modelled?',
  why: 'A property of the KIND, stored once per edge — and already disagreeing with itself.',
  inspect(model) {
    const findings = [];
    const examined = [];

    for (const c of model.containers) {
      if (c.dataset === 'data/taxonomy.json' || !/relationship/i.test(c.container)) continue;
      const records = recordsOf(model, c);
      if (!records.length) continue;

      /* A field whose value is the same for every edge of a kind is
         a fact about the KIND, stored once per edge. Found by
         grouping rather than by being told which field: any scalar
         field that partitions cleanly by `kind` is a candidate, and
         one that does NOT partition cleanly is the stronger finding
         — the copies have already diverged. */
      const kinds = [...new Set(records.map((r) => r.kind).filter(Boolean))];
      for (const f of c.fields) {
        if (!f.shapes.every((sh) => sh === 'boolean' || sh === 'null')) continue;
        examined.push(`${c.container}[].${f.field} by kind`);
        /* STRUCTURAL, NOT ANNOTATED. A field on every record is part
           of the shape; one on some records is a note somebody added
           to those. `requires_verification` sits on 1 of the 17
           edges and is a per-record provenance flag
           (docs/VERIFICATION-POLICY.md §5); `symmetric` sits on all
           17 and is the shape. The count decides, not a list. */
        if (f.present !== f.of) continue;
        /* And "constant within a kind" is only evidence where some
           kind has more than one edge to be constant across. */
        const repeated = [...new Map(records.map((r) => [r.kind, records.filter((x) => x.kind === r.kind).length])).values()].filter((n) => n > 1).length;
        if (repeated < 2) continue;
        const byKind = new Map();
        for (const r of records) {
          if (!r.kind) continue;
          if (!byKind.has(r.kind)) byKind.set(r.kind, new Set());
          byKind.get(r.kind).add(r[f.field]);
        }
        const disagreeing = [...byKind.entries()].filter(([, vals]) => vals.size > 1);

        const consumers = modulesReading(model, f.field);
        findings.push({
          lens: 'relationship_depth',
          question: 7,
          subject: `${c.dataset}#${c.container}[].${f.field}`,
          closes_by: 'shape',
          missing_shape: `A home for \`${f.field}\` beside the relationship_kind term rather than on every edge. It is a property of the KIND — whether "${kinds[0]}" reads the same way in both directions is a fact about that word, not about a pair of instruments — and it is stored ${records.length} time(s) for ${kinds.length} kind(s).${disagreeing.length ? ` ${disagreeing.length} kind(s) already carry both values: ${disagreeing.map(([k, v]) => `${k} is stored as ${[...v].join(' and ')}`).join('; ')}.` : ''}`,
          why_it_matters: `${disagreeing.length
            ? `The copies have already diverged, and nothing catches it: tools/validate.mjs does not check this field, and ${consumers.length ? `${consumers.join(', ')} render${consumers.length === 1 ? 's' : ''} from it` : 'the renderers read it'} — so the same relationship kind draws one arrow on one pair and a different one on another, from data alone.`
            : `${records.length} copies of ${kinds.length} fact(s) can disagree, and nothing would catch it: tools/validate.mjs does not check this field against the kind.`} data/taxonomy.json is the enum authority every other dataset resolves against; a property of a term belongs beside the term.`,
          method: `Grouped every boolean field on ${c.container}[] by the edge's kind and checked whether the value is constant within each kind. A field that is constant per kind is a fact about the kind stored per edge; one that is not constant is that, and already inconsistent. Which modules read the field is found by reading js/ for it.`,
          entities: [
            { kind: 'relationship', id: null, path: c.dataset, field: f.field, note: `${records.length} edge(s) across ${kinds.length} kind(s).` },
            { kind: 'taxonomy_term', id: null, path: 'data/taxonomy.json', field: 'relationship_kind', note: `The ${arr(model.corpus.db.taxonomy?.relationship_kind).length} term(s) this is a property of. None carries it.` },
            ...consumers.map((mod) => ({ kind: 'instrument', id: null, path: mod, field: f.field, note: 'Renders from the per-edge value.' })),
          ],
          invariants: ['one_home_per_fact', 'taxonomy_enum_authority'],
          modules: [c.dataset, 'data/taxonomy.json', ...consumers],
          demand: (disagreeing.length ? disagreeing.map(([k]) => records.filter((r) => r.kind === k)) : [records]).flat().slice(0, 12).map((r) => ({
            dataset: c.dataset, record_id: r.id, field: f.field,
            saying: `${r.from} → ${r.to} (${r.kind}) stores ${f.field}: ${r[f.field]}`,
          })),
          demand_total: records.length,
          risk: disagreeing.length ? 'high' : 'medium',
          operations: [{
            op: 'move',
            target: `${f.field}: from ${c.dataset} ${c.container}[] to data/taxonomy.json relationship_kind[]`,
            current: `${records.length} per-edge value(s)${disagreeing.length ? `, ${disagreeing.length} kind(s) inconsistent` : ''}.`,
            proposed: null,
            rationale: `The term carries the property once and the edge derives it, which is what derivation over storage means here. THE DISAGREEMENT IS NOT RESOLVED BY THIS PROPOSAL: deciding which value is right for ${disagreeing.map(([k]) => k).join(', ') || 'each kind'} is a decision about what the word means, and it is the repository owner's. Moving the field before that decision would silently pick one.`,
          }],
          scope_note: `It proposes where the fact should live. It does not decide the disagreeing value${disagreeing.length === 1 ? '' : 's'}, edits no edge, and adds nothing to data/taxonomy.json.`,
        });
      }
    }
    return { findings, examined };
  },
};

/* ============================================================
   8 · Is versioning sufficient?
   ============================================================ */

export const versioningLens = {
  id: 'versioning',
  question: 8,
  label: 'versioning',
  asks: 'Is versioning sufficient?',
  why: 'What the corpus can say about its own past, measured.',
  inspect(model) {
    const findings = [];
    const examined = [];
    const HISTORY = /^(history|versions|revisions|previous|prior|was|superseded_value|changed_from)/;

    const datasets = Object.entries(model.corpus.db).map(([name, holder]) => ({
      path: `data/${name}.json`,
      schema_version: holder.$schema_version ?? null,
      last_verified: holder.$last_verified ?? null,
    }));
    examined.push(...datasets.map((d) => d.path));

    /* Does any container anywhere hold a prior state? */
    const historyFields = [];
    for (const c of model.containers) {
      for (const f of c.fields) if (HISTORY.test(f.field)) historyFields.push(`${c.dataset} ${c.container}[].${f.field}`);
    }

    /* How many records carry a per-record verification date, and
       how many carry a status with an as-of date — the two things
       that would each become a lie the moment the underlying value
       changed and nothing recorded that it had. */
    let verified = 0;
    let statusAsOf = 0;
    for (const c of model.containers) {
      for (const r of recordsOf(model, c)) {
        if (typeof r.last_verified === 'string') verified++;
        if (typeof r.status_as_of === 'string' || (r.status && typeof r.last_verified === 'string')) statusAsOf++;
      }
    }

    if (!historyFields.length && verified > 0) {
      const versions = [...new Set(datasets.map((d) => d.schema_version).filter(Boolean))];
      findings.push({
        lens: 'versioning',
        question: 8,
        subject: 'data/#no-prior-state',
        closes_by: 'shape',
        missing_shape: `Any way for a record to say what it used to say. ${verified} record(s) across ${model.containers.length} container(s) carry a last_verified date and not one container anywhere holds a prior value, a revision or a change note. The corpus can say when it was last checked and never what changed when it was.`,
        why_it_matters: `Every consequential statement here is dated, and a date with no prior value cannot distinguish "checked and unchanged" from "checked and changed, and nobody recorded what it was". docs/VERIFICATION-POLICY.md §5 turns on last_verified meaning something; agent/detector/ exists to detect that a value has moved, and has nowhere in data/ to record that it did — its RegulatoryChange records live in agent/records/, which is git-ignored and regenerable. So the one place the corpus is asked about its own past is the one place it cannot answer.`,
        method: `Listed every field on every container and looked for one whose name carries a prior state — history, versions, revisions, previous, prior, superseded_value, changed_from. Counted the records carrying a per-record last_verified. Read $schema_version off each dataset: ${versions.length === 1 ? `all ten are "${versions[0]}", so no dataset's shape has ever been versioned apart from the others` : versions.join(', ')}.`,
        entities: datasets.map((d) => ({ kind: 'instrument', id: null, path: d.path, field: '$schema_version', note: `${d.schema_version ?? 'none'}, last verified ${d.last_verified ?? 'never stated'}.` })),
        invariants: ['one_home_per_fact', 'derivation_over_storage', 'null_vs_unknown'],
        modules: datasets.map((d) => d.path),
        demand: [
          { dataset: 'data/', record_id: null, field: 'last_verified', saying: `${verified} record(s) carry a verification date with no prior value beside it` },
          { dataset: 'agent/detector/', record_id: null, field: null, saying: 'an agent exists to detect that a value moved, and data/ has no shape that records it did' },
        ],
        demand_total: verified,
        risk: 'high',
        operations: [{
          op: 'add',
          target: 'data/ — a shape that records a value having changed',
          current: `${verified} last_verified date(s), no prior state anywhere, $schema_version ${versions.join('/')} on every dataset.`,
          proposed: null,
          rationale: `Where it lives is the decision, and it is a large one. A history array on every record would put a second copy of every superseded value beside the current one; a change container per dataset keeps one home and needs a reference shape; git already holds the history and is not queryable by a renderer, which is why "git blame answers nothing" is a recorded finding (docs/AUDIT-2026-09-01.md F-06). THE OPTIONS ARE NAMED AND NONE IS CHOSEN.`,
        }],
        scope_note: 'It reports what the corpus cannot say about its own past. It proposes no schema, writes no history, and stamps no date.',
      });
    }
    return { findings, examined };
  },
};

export const LENSES = [
  entityTypeLens,
  relationshipTypeLens,
  duplicationLens,
  granularityLens,
  proseLens,
  comparisonLens,
  relationshipDepthLens,
  versioningLens,
];

export const LENS_IDS = LENSES.map((l) => l.id);

/* ---------------------------------------------------------- helpers */

/** Which modules in js/ read a field by name. Read rather than
 *  assumed: "who would this break?" is a question about the code,
 *  and the code is here. */
export function modulesReading(model, field) {
  const dir = join(model.root, 'js');
  let files = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith('.js')); } catch { return []; }
  const out = [];
  for (const f of files) {
    let src = '';
    try { src = readFileSync(join(dir, f), 'utf8'); } catch { continue; }
    if (new RegExp(`\\.${field}\\b|\\['${field}'\\]`).test(src)) out.push(`js/${f}`);
  }
  return out;
}

/** The edge container of a dataset, if it has one. `data/taxonomy.json`'s
 *  `relationship_kind` is the VOCABULARY of edges, not a container of
 *  them, and the caller excludes that dataset before asking. */
export function edgeContainerOf(model, dataset) {
  return model.containers.find((x) => x.dataset === dataset && /relationship/i.test(x.container)) ?? null;
}

/** The records of a container, from the corpus this model read. */
export function recordsOf(model, container) {
  const dataset = container.dataset.replace(/^data\//, '').replace(/\.json$/, '');
  return arr(model.corpus.db[dataset]?.[container.container]);
}

function recordIdsOf(model, container) {
  return new Set(recordsOf(model, container).map((r) => r?.id).filter(Boolean));
}

/**
 * Which datasets a module in js/ actually asks js/data.js for.
 *
 * `js/data.js` is the ONLY module that fetches a dataset — that is
 * an architectural invariant, and it is what makes this answerable
 * by reading the call sites. Only the argument lists of `load(...)`
 * and `loadAll([...])` are read: a dataset's name appearing
 * anywhere else in a module is not a fetch. `js/shell.js` carries
 * `id: 'brief'` as a NAV ID, and counting that would have reported
 * data/brief.json as loaded when nothing loads it.
 */
export function fetchedDatasets(model) {
  const found = new Set();
  const dir = join(model.root, 'js');
  let files = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith('.js')); } catch { return found; }
  for (const f of files) {
    let src = '';
    try { src = readFileSync(join(dir, f), 'utf8'); } catch { continue; }
    for (const call of src.matchAll(/\bload(?:All)?\s*\(([\s\S]{0,600}?)\)/g)) {
      for (const lit of call[1].matchAll(/'([a-z][a-z0-9_-]{2,30})'/g)) found.add(lit[1]);
    }
  }
  return found;
}

/** Concepts two field names can both be about. Stated rather than
 *  inferred: "is fine_eur the same concept as sanction_ceiling?" is
 *  a judgement, and it belongs in one visible table. */
export const CONCEPT_OF_FIELD = {
  fine_eur: 'monetary penalty',
  sanction_ceiling: 'monetary penalty',
};

function conceptOf(field) { return CONCEPT_OF_FIELD[field] ?? null; }

/** A value at a dotted path, or undefined. */
export function atPath(record, path) {
  return String(path).split('.').reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), record);
}

function walkStrings(node, fn, path = []) {
  if (typeof node === 'string') return fn(node, path);
  if (Array.isArray(node)) return node.forEach((x) => walkStrings(x, fn, path));
  if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walkStrings(v, fn, [...path, k]);
}

function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function summarise(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'object' && !Array.isArray(v)) {
    return Object.entries(v).map(([k, x]) => `${k}: ${String(Array.isArray(x) ? x.join('/') : x).slice(0, 40)}`).join(' · ').slice(0, 300);
  }
  return String(v).slice(0, 200);
}

export { summarise, walkStrings, shapeOf };
