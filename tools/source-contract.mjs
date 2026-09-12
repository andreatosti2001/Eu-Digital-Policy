/* ============================================================
   tools/source-contract.mjs — the one contract a source record
   satisfies, and the reason each field is in it

   THE PROBLEM THIS RESOLVES. Three layers described a source record
   and none of them was the contract:

     · `data/sources.json` carries 77 records and a `$note`. The `$note`
       explains what the three `url_status` values mean and says nothing
       about which fields a record must have.
     · `tools/validate.mjs` checked four fields — `tier`, `type`,
       `url_status`, `publisher` — and only that each RESOLVES to a
       taxonomy or institution id. A record missing `title`, `accessed`
       or `note` entirely passed every check in this repository.
     · `agent/policy/governance.mjs` allowlists EIGHT fields on this
       file for limited autonomy, and `agent/improve/reach.mjs` measured
       that SIX of them — `last_retrieved`, `retrieved_at`, `checksum`,
       `content_hash`, `recheck_interval`, `freshness_window` — exist on
       none of the 77 records, in no `$description` and in no `$note`.

   So the governance layer named a surface the data layer did not have,
   and the validator enforced neither. This module is the missing home:
   one contract, derived from what the 77 records ACTUALLY carry, with
   the reason each field exists written next to it.

   WHY THE SIX ABSENT FIELDS ARE NOT ADDED. They are retrieval
   bookkeeping — when a document was last fetched, what its bytes
   hashed to, how often to re-check. Nothing in this repository has ever
   fetched a URL: `tools/freshness.mjs` prints a SOURCE REACHABILITY
   heading and performs no network I/O, which is
   docs/AUDIT-2026-09-01.md F-12, and this environment's network policy
   refused all five endpoints when SESSION 25 tried. A `checksum` field
   written without fetching the document is a fabricated fact about
   evidence, which is the first prohibition in AGENTS.md. So the
   contract records them as ABSENT AND DELIBERATELY SO, rather than
   leaving the next session to infer that adding them would be helpful.

   A grant naming a field that does not exist is not a hazard —
   `agent/improve/reach.mjs` says why, and the safe direction is that a
   permission over nothing can do nothing. What was missing was anybody
   writing down which of the two lists is the data model. This one is.

   WHO MAY CHANGE IT. `tools/` is outside `AUTOMATIC_ELIGIBLE_PATHS` in
   `agent/policy/governance.mjs`, so no autonomous run can widen this
   contract. `tools/selftest.mjs` asserts its contents field by field,
   so a change here is a change to a test as well as to a check.
   ============================================================ */

/**
 * Every field a source record may carry, and nothing else.
 *
 * `required: true` means all 77 records have it today and a new record
 * without it is an error. `required: false` means it is written only
 * where it applies, and where it applies is stated.
 *
 * `written_by` and `read_by` are the two questions that make a schema a
 * contract rather than a list: a field nobody writes is dead, and a
 * field nobody reads is decoration.
 */
export const SOURCE_FIELDS = Object.freeze({
  id: Object.freeze({
    required: true,
    shape: 'string matching ^src-[a-z0-9-]+$',
    why: 'The record\'s only name. claims, enforcement, timeline, instruments and institutions all reference a source by this and nothing else.',
    written_by: 'a person, once, when the source is first cited',
    read_by: 'tools/validate.mjs referential integrity; js/evidence.js; js/data.js indices',
    never_renamed: true,
  }),
  tier: Object.freeze({
    required: true,
    shape: 'a taxonomy id under tier:',
    why: 'What kind of authority the document carries. The evidence grade is DERIVED from this at render time and is never stored (docs/DATA-GOVERNANCE.md).',
    written_by: 'a person, against docs/SOURCE-POLICY.md',
    read_by: 'js/evidence.js grading; tools/validate.mjs',
  }),
  type: Object.freeze({
    required: true,
    shape: 'a taxonomy id under source-type:',
    why: 'What the document IS — a regulation, a judgment, a press release, commentary. A press release cannot support what a judgment supports.',
    written_by: 'a person',
    read_by: 'js/format.js citation rendering; tools/validate.mjs',
  }),
  publisher: Object.freeze({
    required: true,
    nullable: true,
    shape: 'an institution id, the literal "eu", or null where the publisher is not an EU institution',
    why: 'Competence and independence: who published a document bears on what it can be cited for. null is the 25 non-institutional publishers and is NOT unknown — publisher_name carries the name.',
    written_by: 'a person',
    read_by: 'tools/validate.mjs referential integrity',
  }),
  publisher_name: Object.freeze({
    required: true,
    shape: 'non-empty string',
    why: 'The name a reader sees. Present even where `publisher` is null, which is why null there is not a gap.',
    written_by: 'a person',
    read_by: 'js/format.js; the bibliography',
  }),
  title: Object.freeze({
    required: true,
    shape: 'non-empty string',
    why: 'A citation a reader cannot look up is not a citation.',
    written_by: 'a person, from the document',
    read_by: 'js/format.js; bibliography.html',
  }),
  url: Object.freeze({
    required: true,
    nullable: true,
    shape: 'an http(s) URL, or null',
    why: 'Where the reader goes. null means no citable URL has been located, and a null here REQUIRES `resolution` — an admitted gap, never a plausible substitute (AGENTS.md rule 2).',
    written_by: 'a person. In an enabled autonomy category a `source_url_correction` proposal may change it, and only where the proposal records `retrieved_and_read: true`.',
    read_by: 'js/format.js; tools/freshness.mjs SOURCE REACHABILITY',
  }),
  url_status: Object.freeze({
    required: true,
    shape: 'a taxonomy id under url:',
    why: 'What is known about the URL. `url:live` means it was seen on the accessed date — it is a STORED ASSERTION, not a measurement: no URL here has ever been fetched (docs/AUDIT-2026-09-01.md F-12).',
    written_by: 'a person',
    read_by: 'tools/freshness.mjs; agent/health/knowledge.mjs; tools/validate.mjs',
  }),
  published: Object.freeze({
    required: true,
    nullable: true,
    shape: 'YYYY-MM-DD, YYYY-MM, YYYY, or null',
    why: 'When the document was published. The three precisions are real: some documents carry only a month or a year, and padding one to a day would invent precision.',
    written_by: 'a person, from the document',
    read_by: 'js/format.js citation rendering',
  }),
  accessed: Object.freeze({
    required: true,
    shape: 'YYYY-MM-DD',
    why: 'When a person last looked at it. This is the only evidence the URL was ever reachable, and it is the field tools/freshness.mjs ages against EXPECTED.sources.',
    written_by: 'a person, when they read the document',
    read_by: 'tools/freshness.mjs; js/format.js',
  }),
  language: Object.freeze({
    required: true,
    shape: 'an ISO 639-1 code',
    why: 'Which language edition was read. EU instruments exist in 24 and they are equally authentic; a claim read in one is not automatically true of another.',
    written_by: 'a person',
    read_by: 'js/format.js',
  }),
  note: Object.freeze({
    required: true,
    nullable: true,
    shape: 'string, or null where there is nothing to say',
    why: 'What this record can and cannot support, in the words of whoever read it. This is where a correction surfaced during verification is recorded.',
    written_by: 'a person',
    read_by: 'tools/validate.mjs unverified-data report; bibliography.html',
  }),
  resolution: Object.freeze({
    required: false,
    required_when: 'url is null',
    shape: 'one of: url-not-located, publication-not-identified, self-reference',
    why: 'WHY there is no URL, because the three cases need different work and only one of them is findable by looking. tools/freshness.mjs reports them separately and treats a null url with no resolution as a defect in the record.',
    written_by: 'a person',
    read_by: 'tools/freshness.mjs SOURCE REACHABILITY',
  }),
  resolution_note: Object.freeze({
    required: false,
    shape: 'string',
    why: 'The sentence a reader needs about this particular record — why a tier:4 commentary is cited at all, or exactly what was and was not located. Written on 11 records; independent of `resolution`, which is a closed vocabulary.',
    written_by: 'a person',
    read_by: 'bibliography.html',
  }),
});

/** The three values `resolution` may take. Closed, because each names
 *  a different piece of work and "other" would erase the distinction. */
export const RESOLUTIONS = Object.freeze(['url-not-located', 'publication-not-identified', 'self-reference']);

/**
 * Retrieval-bookkeeping fields `agent/policy/governance.mjs` allowlists
 * for limited autonomy on this dataset and which the dataset does not
 * have.
 *
 * THIS LIST IS NOT A TODO. Every one of them asserts something about a
 * document having been FETCHED, and nothing in this repository has ever
 * fetched one. Writing a `checksum` or a `last_retrieved` without
 * retrieving the document would be a fabricated fact about evidence.
 * They are named here so that the disagreement between the two layers
 * is recorded in the data layer's own contract rather than only in
 * `agent/improve/reach.mjs`, and so that a session which reads the
 * grant does not conclude the fields are simply missing.
 */
export const ABSENT_BY_DESIGN = Object.freeze([
  'last_retrieved', 'retrieved_at', 'checksum', 'content_hash', 'recheck_interval', 'freshness_window',
]);

export const REQUIRED_FIELDS = Object.freeze(
  Object.entries(SOURCE_FIELDS).filter(([, f]) => f.required).map(([k]) => k));
export const OPTIONAL_FIELDS = Object.freeze(
  Object.entries(SOURCE_FIELDS).filter(([, f]) => !f.required).map(([k]) => k));

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const PUBLISHED = /^\d{4}(-\d{2}(-\d{2})?)?$/;

/**
 * Every way one source record can fail the contract.
 *
 * Returns a list of plain strings. Enum membership — that `tier`,
 * `type` and `url_status` resolve to real taxonomy ids and `publisher`
 * to a real institution — is NOT re-checked here: `tools/validate.mjs`
 * §3 owns referential integrity and a second copy of that rule would be
 * the second home this project's first principle forbids.
 *
 * @param {object} rec
 * @returns {string[]}
 */
export function violations(rec) {
  const out = [];
  if (!rec || typeof rec !== 'object') return ['not an object'];

  for (const name of REQUIRED_FIELDS) {
    if (!(name in rec)) { out.push(`missing required field \`${name}\` — ${SOURCE_FIELDS[name].why}`); continue; }
    const spec = SOURCE_FIELDS[name];
    if (rec[name] === null && !spec.nullable) out.push(`\`${name}\` is null, and null is not one of its values`);
  }

  for (const name of Object.keys(rec)) {
    if (name in SOURCE_FIELDS) continue;
    out.push(ABSENT_BY_DESIGN.includes(name)
      ? `carries \`${name}\`, which is retrieval bookkeeping this repository cannot honestly write: no URL here has ever been fetched (AUDIT F-12). See ABSENT_BY_DESIGN in tools/source-contract.mjs.`
      : `carries \`${name}\`, which is not in the contract. Add it to SOURCE_FIELDS with its reason, who writes it and who reads it, or remove it.`);
  }

  if (typeof rec.id === 'string' && !/^src-[a-z0-9-]+$/.test(rec.id)) out.push(`id "${rec.id}" is not of the form src-[a-z0-9-]+`);
  for (const name of ['publisher_name', 'title']) {
    if (name in rec && (typeof rec[name] !== 'string' || !rec[name].trim())) out.push(`\`${name}\` must be a non-empty string`);
  }
  if (rec.url != null && !/^https?:\/\//.test(String(rec.url))) out.push(`\`url\` is not an http(s) URL: ${rec.url}`);
  if (rec.url == null && !rec.resolution) {
    out.push('has no url and no `resolution`, so it is not recorded WHY it cannot be linked. The three reasons need different work and only one is findable by looking.');
  }
  if (rec.url != null && rec.url_status === 'url:none') out.push('`url_status` is url:none but a url is present');
  if (rec.url == null && rec.url_status !== 'url:none') out.push(`has no url but \`url_status\` is ${rec.url_status}`);
  if ('resolution' in rec && rec.resolution != null && !RESOLUTIONS.includes(rec.resolution)) {
    out.push(`\`resolution\` is "${rec.resolution}", which is not one of ${RESOLUTIONS.join(', ')}`);
  }
  if (rec.accessed != null && !ISO_DAY.test(String(rec.accessed))) out.push(`\`accessed\` is not YYYY-MM-DD: ${rec.accessed}`);
  if (rec.published != null && !PUBLISHED.test(String(rec.published))) out.push(`\`published\` is not YYYY, YYYY-MM or YYYY-MM-DD: ${rec.published}`);
  if (rec.language != null && !/^[a-z]{2}$/.test(String(rec.language))) out.push(`\`language\` is not an ISO 639-1 code: ${rec.language}`);

  return out;
}
