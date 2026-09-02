/* ============================================================
   agent/proposals/data/annotate.mjs — the only edit this repository
   can author today

   A KnowledgeGap says the corpus has no place for a concept. Closing
   it means writing the concept's VALUE, and the value is an article
   number, a date, a competence, a fine or a status — read from a
   document, and no agent here has ever read one. So the set of edits
   an agent may author with an empty hand is very small, and it has
   exactly one member:

     A NOTE, ON A RECORD THAT ALREADY EXISTS, STATING SOMETHING ABOUT
     THIS CORPUS RATHER THAN ABOUT EU LAW.

   That is not a consolation prize. `unsupported_claim` is the sharpest
   case: seven claims typed `claim-type:law` rest on the brief citing
   itself, and OTHER RECORDS ARE BUILT ON THEM. The evidence grade
   already renders as unresolved, which is honest — what nothing in
   data/ records is that the unresolved grade is load-bearing. SESSION
   11 established it and had nowhere to put it. A note is where it
   goes.

   THREE THINGS KEEP THIS FROM BECOMING A BACK DOOR.

   1. THE TEXT IS COMPOSED, NOT WRITTEN. `noteFor` is a pure function
      of ids and counts read off the corpus, plus fixed English.
      `selftest.mjs` recomputes every note a run produced and asserts
      it is identical, so there is no path by which a sentence an
      agent composed freely reaches a production page.

   2. THE TARGET'S CONTAINER MUST ALREADY USE THE FIELD, and that is
      asked of the corpus rather than declared in a table here. A
      table would be a second home for a fact about `data/`; the first
      draft had one and it disagreed with the corpus immediately,
      because an instrument carries no note and a relationship in the
      same file does. Where no sibling record uses the field, adding
      it is a schema change, and structural change is never Class B.

   3. NOTHING IS APPLIED. The output is a DataProposal behind an
      ApprovalRequest. `data/` is read and never written.

   AND THE NOTE IS VISIBLE TO A READER. `js/evidence.js`,
   `js/applies.js`, `js/enforcement-page.js` and `js/calendar.js` all
   render `verification_note`. That is the reason this is amber and
   approval-gated rather than green, and the reason the text is
   composed rather than written: a sentence on a production site about
   a corpus of EU law is not a place for an agent's prose.
   ============================================================ */

const arr = (x) => (Array.isArray(x) ? x : []);

/**
 * The one field a proposal here may write into.
 *
 * `verification_note` and nothing else. It is the field whose whole
 * purpose is to say what is still open about a record, it exists on
 * three of the ten datasets, and four modules in `js/` already render
 * it. `note` on a source record is deliberately excluded: it
 * DESCRIBES the document rather than recording what has been checked
 * about it, and appending a finding about this corpus to a
 * description of a publication would put two different kinds of
 * statement in one field.
 */
export const NOTE_FIELD = 'verification_note';

/**
 * Whether the record's own container already uses the field.
 *
 * DERIVED, NOT DECLARED. A table of which datasets carry
 * `verification_note` would be a second home for a fact about
 * `data/`, and a first draft of this module had one — it disagreed
 * with the corpus within an hour, because `data/instruments.json`
 * carries no note on an instrument and does carry one on a
 * relationship. So the question is asked of the array the record
 * actually sits in: if a sibling carries the field, the field is part
 * of that container's shape and writing it is an annotation. If none
 * does, adding it is a schema change, and structural change is never
 * Class B (docs/AGENT-ROLES.md §4).
 */
export const containerUses = (siblings) => arr(siblings).some((r) => typeof r?.[NOTE_FIELD] === 'string');

/**
 * Look up what the gap's recommended home actually points at, and
 * decide whether there is anything to annotate.
 *
 * This is a LOOKUP against the corpus and never a judgement. Each
 * failure says which of the four conditions failed, because "not
 * annotatable" covers four different findings and a reviewer needs to
 * know which one they are reading.
 *
 * @param {object} gap      a KnowledgeGap record
 * @param {object} corpus   loadCorpus()
 * @returns {{annotatable:boolean, why:string, ...}}
 */
export function targetOf(gap, corpus) {
  const dataset = gap.recommended_data_location?.dataset ?? null;

  if (gap.recommended_data_location?.shape_exists === false) {
    return { annotatable: false, why: 'the gap\'s recommended home does not exist in the schema, so there is no record in it to annotate' };
  }
  if (!canAnnotate(gap.gap_kind)) {
    return { annotatable: false, why: `there is no note this agent could compose for a ${gap.gap_kind} gap that would state something about the corpus rather than about EU law` };
  }

  /* The record has to be one the gap NAMES and the corpus HOLDS. A
     gap about a record that is ABSENT — no enforcement action under
     an act at all — has nothing to attach a note to, and that is the
     commonest reason this returns false. */
  const found = arr(gap.affected_entities)
    .map((e) => ({ entity: e, hit: e.id ? recordIn(corpus, dataset, e.id) : null }))
    .find((x) => x.hit);

  if (!found) {
    const named = arr(gap.affected_entities).map((e) => e.id ?? e.path).filter(Boolean);
    return {
      annotatable: false,
      why: `no record in ${dataset} carries any of the ids this gap names (${named.join(', ') || 'none'}) — the gap is that the record is absent, and creating one is not an annotation`,
    };
  }

  const { record, siblings, container } = found.hit;
  if (!containerUses(siblings)) {
    return {
      annotatable: false,
      why: `no record in ${dataset} ${container}[] carries a ${NOTE_FIELD}, so adding one is a schema change rather than an annotation`,
    };
  }

  return {
    annotatable: true,
    why: `${dataset} carries ${found.entity.id} in ${container}[], and that container already uses ${NOTE_FIELD}`,
    dataset,
    container,
    field: NOTE_FIELD,
    record_kind: found.entity.kind,
    record_id: found.entity.id,
    record,
    current: typeof record[NOTE_FIELD] === 'string' ? record[NOTE_FIELD] : null,
  };
}

/** Find a record by id anywhere in a dataset, and hand back the array
 *  it sits in — the siblings are what settle whether the field is
 *  part of the container's shape. */
function recordIn(corpus, dataset, id) {
  const key = String(dataset).replace(/^data\//, '').replace(/\.json$/, '');
  const block = corpus.db?.[key];
  if (!block) return null;
  for (const [container, v] of Object.entries(block)) {
    if (!Array.isArray(v)) continue;
    const record = v.find((r) => r && typeof r === 'object' && r.id === id);
    if (record) return { record, siblings: v, container };
  }
  return null;
}

/* ---------------------------------------------------------- the text

   One composer per gap kind that can be annotated. Each returns a
   sentence built from ids and counts read off the gap's own evidence
   and the record it sits on. There is no free text and no branch that
   produces one: a kind with no composer is not annotatable, and
   `selftest.mjs` recomputes every note a run emitted.

   WHAT THESE SENTENCES MAY SAY is bounded by one rule: every clause
   is checkable by opening a file in this repository. "Three records
   rest on this claim" is checkable. "This is probably about Article
   6" is not, and there is no shape here that could produce it.       */

const NOTE_FOR_KIND = {
  unsupported_claim: (gap, target) => {
    const leaning = leaningIds(gap);
    return `Load-bearing: ${leaning.length} record(s) in this corpus rest on this claim (${leaning.join(', ')}), and no source outside this site directly supports it. Recorded from the corpus by the depth analysis of ${gap.as_of}; nothing here has read a document.`;
  },
  incomplete_enforcement: (gap, target) => {
    const leaning = leaningIds(gap);
    const axis = gap.recommended_data_location?.field ?? 'this axis';
    return `${axis} is recorded as ${JSON.stringify(target.record?.[axis] ?? 'unknown')}, and ${leaning.length} record(s) in this corpus argue from this decision (${leaning.join(', ')}). Unknown is not zero: nothing here establishes the value. Recorded from the corpus by the depth analysis of ${gap.as_of}.`;
  },
};

/** The ids the gap's own evidence says lean on the missing concept,
 *  read off the evidence locators rather than recomputed. The count
 *  always describes the whole demand; agent/depth/depth.mjs caps how
 *  many are ITEMISED, and a note that said "12" while listing 12 of
 *  20 would be the count disagreeing with what it counts. */
export function leaningIds(gap) {
  return arr(gap.evidence)
    .filter((e) => e.kind === 'dataset_record' && typeof e.locator === 'string')
    .map((e) => e.locator.split('#')[1]?.split('.')[0])
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
}

/** True where this kind of gap has a composer at all. */
export const canAnnotate = (kind) => Object.prototype.hasOwnProperty.call(NOTE_FOR_KIND, kind);

/**
 * The sentence a proposal would add. Pure: same gap and same record
 * in, same string out, every time.
 */
export function noteFor(gap, target) {
  const compose = NOTE_FOR_KIND[gap.gap_kind];
  if (!compose) throw new Error(`annotate.mjs: no note composer for gap kind "${gap.gap_kind}" — canAnnotate() is the guard, and it was not asked`);
  return compose(gap, target);
}

/**
 * What the field would hold afterwards. An existing note is KEPT and
 * added to, never rewritten: PROVENANCE_DISPOSITIONS has no word for
 * removing one, because writing over a verification_note is red tier
 * (AI-SAFE-BOUNDARIES §3).
 */
export function appendedTo(current, sentence) {
  return current && current.trim() ? `${current.trim()} ${sentence}` : sentence;
}

/** `set_first_time` is only honest where the field was null and
 *  nobody had looked; the contract refuses it where `current` carries
 *  anything, and this is the one place that choice is made. */
export const dispositionFor = (current) => (current && current.trim() ? 'extended' : 'set_first_time');
