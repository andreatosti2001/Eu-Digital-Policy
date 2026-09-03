/* ============================================================
   agent/ux/boundary.mjs — what makes a finding this agent's

   Eight agents already read this repository, and a UX auditor is
   the easiest of the nine to turn into a duplicate of all of them:
   everything a reader sees passes through markup, styles, data and
   prose, so an agent that "audits the interface" can end up
   re-reporting a missing record, a missing shape, a stale sentence
   and a failing validator under new names. That is the second home
   this architecture exists to prevent, arriving as an agent.

   FOUR TESTS, AND EACH IS A MECHANISM RATHER THAN AN INTENTION.

   1 · IS IT ABOUT WHAT A READER CAN SEE, DO OR MISREAD?
       A finding declares `about`, and only `interface` is this
       agent's. `record` is agent/depth/'s, `shape` is
       agent/architect/'s, `sentence` is agent/proposals/editorial/'s
       and `structure` is already checked by tools/design-qa.mjs. A
       finding that does not say is refused rather than guessed at.

   2 · WOULD tools/design-qa.mjs ALREADY CATCH IT?
       If it would, it is not a finding — it is a check that is
       passing, and re-reporting it would mean this agent's backlog
       and the validator's output could disagree about the same
       file. `alreadyChecked` matches a finding against the checks
       design-qa states in its own header, read from the file.

   3 · DOES IT STAND ON SOMETHING QUOTED?
       Every finding carries `evidence` entries that are
       `repository_file` with a file, a line and the bytes that were
       read. A UX finding is the easiest kind in this repository to
       fabricate — "the hierarchy is unclear" cites nothing and
       cannot be checked — so a finding whose evidence carries no
       quote is refused, and `evidenceProblems` checks it rather
       than trusting it. `retrieved_document` is refused outright,
       as everywhere else here: no agent in this repository has ever
       retrieved one.

   4 · DID ANYTHING ACTUALLY OPEN IT?
       Nothing did. There is no browser here, no screen reader has
       ever been run against this site (README limitation 7), and
       every record this agent emits says so. A finding phrased as
       though somebody had looked at the rendered page is refused by
       `unverifiablePhrasing`, because the most damaging thing a UX
       audit can do to this project is imply coverage it did not
       have.
   ============================================================ */

/** Why a finding is not this agent's, by the agent or the tool it
 *  belongs to. */
export const NOT_OURS = {
  data_depth: 'A record written into a shape that already exists would close this. agent/depth/ asks that question and answers it with a KnowledgeGap; the interface renders what the record says, and an empty panel over an empty field is a data finding wearing an interface costume.',
  architect: 'The answer is a change to the information model. agent/architect/ owns that, and a proposal to draw a fact the schema cannot hold is a proposal to invent the fact.',
  editorial: 'The answer is a sentence in the brief. agent/proposals/editorial/ reads prose and this agent does not; what the argument says is the author\'s.',
  design_qa: 'tools/design-qa.mjs already checks this, on every run, and it is passing. A backlog entry for a check that passes is a second opinion about a file that already has one.',
  legal_verifier: 'The answer is a value read from a document. Nothing in this repository has ever retrieved one.',
};

/** What a finding can be ABOUT. Only the first is this agent's. */
export const FINDING_SUBJECTS = ['interface', 'record', 'shape', 'sentence', 'structure'];

/** The evidence kinds a UX finding may stand on. `retrieved_document`
 *  is deliberately absent, and so is `dataset_record` on its own:
 *  this agent reads the FILES THAT DRAW the interface, and a finding
 *  standing only on a data record is a finding about the data. */
export const ALLOWED_EVIDENCE_KINDS = new Set(['repository_file', 'measurement', 'agent_output', 'absent', 'dataset_record']);

/**
 * Phrasing that claims an observation nothing here made.
 *
 * This is not style policing. `docs/AI-SAFE-BOUNDARIES.md` and the
 * `ux-audit` skill both forbid reporting a screen-reader, browser or
 * device result that was not obtained, and README limitation 7 is
 * one of the eight stated limitations `AGENTS.md` rule 7 says may
 * never be softened. An audit that writes "screen readers announce
 * this as…" has softened it, whatever else the finding got right.
 */
const CLAIMS_AN_OBSERVATION = [
  /\bscreen reader(s)? (announce|read|report|say)/i,
  /\bI (opened|clicked|tabbed|viewed|tested)\b/i,
  /\b(we|I) (measured|observed) (the )?(contrast|render)/i,
  /\bin (chrome|firefox|safari|voiceover|nvda|jaws)\b/i,
  /\bon (an? )?(iphone|android|real device)\b/i,
  /\bat 200% zoom,? (it|the)\b/i,
];

/**
 * Is this finding this agent's?
 * @param {object} finding
 * @returns {{ours:boolean, why:string, route:string|null}}
 */
export function ownershipOf(finding) {
  const about = finding?.about;
  if (!FINDING_SUBJECTS.includes(about)) {
    return { ours: false, route: null, why: `about is ${JSON.stringify(about)}: a finding that does not say whether it is about the interface, a record, a shape, a sentence or the markup's structure cannot be placed, and guessing is how one agent's job becomes another's` };
  }
  if (about === 'record') return { ours: false, route: 'data_depth', why: NOT_OURS.data_depth };
  if (about === 'shape') return { ours: false, route: 'architect', why: NOT_OURS.architect };
  if (about === 'sentence') return { ours: false, route: 'editorial', why: NOT_OURS.editorial };
  if (about === 'structure') return { ours: false, route: 'design_qa', why: NOT_OURS.design_qa };
  return { ours: true, route: null, why: 'It is about what a reader can see, do, or come away believing, and nothing in tools/ checks it.' };
}

/**
 * Would `tools/design-qa.mjs` already have caught this?
 *
 * Matched against the checks that validator states in its own
 * header, read out of the file by `surface.designQaCoverage()`. A
 * finding declares `design_qa_overlap` — the check it would
 * duplicate, or null — and this confirms the named check actually
 * exists rather than taking the finding's word for it. A finding
 * that names a check design-qa does not have is a finding claiming
 * cover it does not have.
 */
export function alreadyChecked(finding, coverage) {
  const named = finding?.design_qa_overlap ?? null;
  if (!named) return { overlaps: false, check: null, why: null };
  const hit = (coverage?.checks ?? []).find((c) => c.toLowerCase().includes(String(named).toLowerCase()));
  if (!hit) {
    return { overlaps: false, check: null, why: `the finding names design-qa check "${named}", and tools/design-qa.mjs states no such check in its header — the overlap claim is wrong in the direction that would have hidden a real finding` };
  }
  return { overlaps: true, check: hit, why: `${NOT_OURS.design_qa} The check is: "${hit}".` };
}

/**
 * Does the corpus of files actually show what the finding says?
 *
 * `evidence` is the quoted bytes. A finding with none is a design
 * opinion, and a design opinion about a production site about EU law
 * is not something an agent gets to file.
 */
export function standingOf(finding) {
  const quoted = (finding?.evidence ?? []).filter((e) => e && typeof e.quote === 'string' && e.quote.trim().length);
  const located = (finding?.evidence ?? []).filter((e) => e && e.locator && /:\d+/.test(String(e.locator)));
  if (!quoted.length) {
    return { standing: false, count: 0, why: 'The finding quotes nothing. A UX finding is the easiest kind in this repository to invent, and one that cannot show the bytes it read is an opinion about how a page feels.' };
  }
  if (!located.length) {
    return { standing: false, count: quoted.length, why: 'The finding quotes something but locates it in no file at a line. "Somewhere in tools.css" is not a locator a reviewer can check.' };
  }
  return { standing: true, count: quoted.length, why: `${quoted.length} quoted extract(s), each located at a file and a line.` };
}

/**
 * Does the finding claim an observation nothing here made?
 *
 * Returns the phrase, so a refusal names what it objected to rather
 * than asserting that something somewhere was wrong.
 */
export function unverifiablePhrasing(finding) {
  const text = [finding?.problem, finding?.why_it_matters, finding?.success_criterion, finding?.recommendation]
    .filter(Boolean).join(' \n ');
  for (const re of CLAIMS_AN_OBSERVATION) {
    const m = text.match(re);
    if (m) return { claims: true, phrase: m[0] };
  }
  return { claims: false, phrase: null };
}

/**
 * Partition a lens's findings, with a reason on every one that is
 * set aside.
 *
 * A finding that vanished without a reason is the failure SESSION 11
 * designed against, and this agent is more exposed to it than most:
 * ten lenses over 1,600 CSS rules and 26 modules will notice a great
 * deal, and a run that reported eight things and silently dropped
 * ninety would have told its reader something false about its own
 * coverage.
 */
export function partition(findings = [], { designQa = null } = {}) {
  const reported = [];
  const aside = [];
  for (const f of findings) {
    const own = ownershipOf(f);
    if (!own.ours) { aside.push({ finding: f, subject: f.subject, why: own.why, route: own.route }); continue; }

    const overlap = alreadyChecked(f, designQa);
    if (overlap.overlaps) { aside.push({ finding: f, subject: f.subject, why: overlap.why, route: 'design_qa' }); continue; }
    if (overlap.why) { aside.push({ finding: f, subject: f.subject, why: overlap.why, route: null }); continue; }

    const phrase = unverifiablePhrasing(f);
    if (phrase.claims) {
      aside.push({ finding: f, subject: f.subject, route: null, why: `The finding says "${phrase.phrase}". Nothing here opened a browser or ran a screen reader, README limitation 7 says none ever has, and a finding written as though one had makes this project's own honesty worse than the defect it reports.` });
      continue;
    }

    const stand = standingOf(f);
    if (!stand.standing) { aside.push({ finding: f, subject: f.subject, why: stand.why, route: null }); continue; }

    reported.push({ ...f, quoted: stand.count });
  }
  return { reported, aside };
}

/** The evidence entries a finding stands on, checked. Returns the
 *  problems rather than throwing: one bad entry should be reported
 *  as such, not take the run down. */
export function evidenceProblems(entries = []) {
  const problems = [];
  for (const e of entries) {
    if (!ALLOWED_EVIDENCE_KINDS.has(e?.kind)) {
      problems.push(`evidence "${e?.evidence_id ?? '?'}" is a ${e?.kind}: this agent reads the files that draw the interface, and a finding standing on a retrieved document would be standing on something no agent here has ever retrieved`);
    }
    if (e?.kind === 'repository_file' && !e?.locator) {
      problems.push(`evidence "${e?.evidence_id ?? '?'}" is a repository_file with no locator: a file with no line is not a place`);
    }
  }
  return problems;
}
