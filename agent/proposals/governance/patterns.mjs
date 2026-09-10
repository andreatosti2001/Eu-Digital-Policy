/* ============================================================
   agent/proposals/governance/patterns.mjs — what keeps happening

   SESSION 28's brief: analyse the historical human decisions and,
   for each approved / rejected / edited proposal, determine the
   patterns — repeated corrections, repeated rejection reasons,
   recurring evidence weaknesses, recurring UX objections, recurring
   editorial corrections, recurring implementation failures.

   THE FIRST FINDING IS ABOUT THE CORPUS AND IT CHANGES THE SHAPE OF
   EVERYTHING BELOW. There are no approved, rejected or edited
   proposals. `corpus.mjs` measures it: the approval ledger is not
   empty, it is ABSENT, and no proposal this repository has produced
   has ever been decided by a person. Analysing
   decisions that do not exist would have been the failure this
   repository is most arranged against — a plausible substitute for
   a missing record.

   SO THE CORPUS IS THE ONE THAT DOES EXIST: the corrections. Twelve
   commits on `main` say in their own subject that they are putting
   something right, and the interesting ones are the corrections a
   session made to work a session had already pushed. A pattern here
   is a thing a person had to say more than once.

   THE TWO-INSTANCE RULE, AND WHY IT IS ENFORCED IN CODE. One
   occurrence is an incident. `patternsWithEvidence()` refuses to
   report a pattern with fewer than two instances whose anchors
   actually hold, and reports the refusal by name rather than
   dropping it — the same discipline `agent/depth/` applies to what
   it sets aside. A single strong finding is still worth saying, and
   it is said as a finding rather than promoted to a pattern.

   NOTHING HERE IS A DECISION, AND NOTHING HERE CHANGES A POLICY.
   Protocol §24 reserves a change to this system's governance to a
   person, and `proposals.mjs` turns each of these into a request
   that ends at one.

   THE SIX FAMILIES ARE THE BRIEF'S OWN, kept as its own words rather
   than renamed, so a reader can check the answer against the
   question.
   ============================================================ */

export const FAMILIES = Object.freeze([
  'repeated_correction',
  'repeated_rejection_reason',
  'evidence_weakness',
  'ux_objection',
  'editorial_correction',
  'implementation_failure',
]);

/** A pattern needs this many instances whose anchors hold. */
export const MIN_INSTANCES = 2;

/**
 * The patterns, each one a claim with its evidence attached.
 *
 * `instances` are the occurrences. `anchor` is what makes each one
 * checkable — `evidence.mjs` resolves every one against the tree the
 * reader has, and a refuted anchor takes its instance out of the
 * count rather than being argued with.
 */
export const PATTERNS = Object.freeze([

  Object.freeze({
    id: 'P-01',
    family: 'repeated_correction',
    title: 'A stale base is read as a fact about the repository',
    statement:
      'Four separate sessions described their own working tree and reported it as the state of the repository. Every one had to be corrected by a later commit, and in two of them the uncorrected version would have destroyed a merged session\'s record.',
    so_what:
      'This is the most repeated correction in the history and it already has a mitigation — AGENTS.md opens with the fetch rule. The rule did not stop it. What the four have in common is not that the fetch was skipped; it is that nothing MEASURED the base and nothing failed when it was stale.',
    instances: Object.freeze([
      Object.freeze({ when: '2026-09-01', what: 'the SESSION 01 audit reported three existing documents as absent, from `ls docs` on an unfetched tree. F-01 is retracted in place rather than deleted.', anchor: { kind: 'commit', sha: '10a97593483fe063a6497dc4d53ee006ed669611', subject: 'Retract audit F-01' } }),
      Object.freeze({ when: '2026-09-03', what: 'a handover paragraph asserted the stale-base trap had missed the session. Local `main` was 45 commits behind — at the pre-SESSION 00 bulk upload. Merging into it would have reverted every session.', anchor: { kind: 'commit', sha: 'aed63a7e517c77a50721f2ac56f6316a436a2e51', subject: 'local main was 45 commits behind' } }),
      Object.freeze({ when: '2026-09-03', what: 'the same paragraph, one session later, on the strength of the working BRANCH sitting at origin/main — a different question from where local main is. 47 commits behind, the worst it had been.', anchor: { kind: 'commit', sha: 'f85be54d5463c2f9d2e5368738cd46673643039c', subject: 'local main was 47 commits behind' } }),
      Object.freeze({ when: '2026-09-08', what: 'four artifacts of one session asserted the Master Orchestrator had never been built. It existed, on a sibling branch cut from the same base.', anchor: { kind: 'commit', sha: 'e6f2715dc738a89750a8d04debb9d83e0585acd0', subject: 'session 22 exists, on a branch' } }),
      Object.freeze({ when: 'standing', what: 'the rule this pattern already has, at the end of AGENTS.md, written after the fourth time.', anchor: { kind: 'contains', path: 'AGENTS.md', text: 'Your base may be stale' } }),
    ]),
  }),

  Object.freeze({
    id: 'P-02',
    family: 'repeated_correction',
    title: 'A report states more than what was measured',
    statement:
      'Three corrections on `main` do the same thing: they take a claim a session had already pushed and narrow it to what the session had actually established. None of the three original claims was false. Each read as a stronger claim than the evidence behind it.',
    so_what:
      'This is the repository\'s own standard applied to its own reporting — the site\'s argument is that a record should say what it cannot support — and it is the correction a person has had to make most recently.',
    instances: Object.freeze([
      Object.freeze({ when: '2026-09-09', what: '"the four validators and boundary checks unchanged at baseline" was written from local tool runs without reading CI\'s own conclusion for the pushed commit. CI reported failure, on two pre-existing findings.', anchor: { kind: 'commit', sha: '4fe19522789288a16e492c1ca5044d037546b60d', subject: 'state CI\'s actual conclusion' } }),
      Object.freeze({ when: '2026-09-08', what: '"909 tests, 0 failures" was measured before staging, and the credential scan reads tracked files, so R4 was red on the branch as pushed. Recorded rather than edited away.', anchor: { kind: 'commit', sha: '542dfa81b3a366a0a4425307c3dd7b3ea2b388a0', subject: 'record what was mis-reported' } }),
      Object.freeze({ when: '2026-09-09', what: 'a test total that only reproduced on one branch was stated as the total. On `main` one test skips itself, and a later session would have read the difference as a regression.', anchor: { kind: 'commit', sha: 'c3b613f33f3529807fa427295bae974ea43628b2', subject: 'state the test count on both branches' } }),
      Object.freeze({ when: 'standing', what: 'the rule this pattern already has, in the last paragraph of AGENTS.md.', anchor: { kind: 'contains', path: 'AGENTS.md', text: 'Never state a validator passed if it was not run' } }),
    ]),
  }),

  Object.freeze({
    id: 'P-03',
    family: 'implementation_failure',
    title: 'A check passes for a reason nobody intended',
    statement:
      'The handover uses the phrase "for the wrong reason" about its own suites at least four times, in four different modules. In each case a test was green and the thing it was named for was not established.',
    so_what:
      'A check that passes for the wrong reason is worse than a missing check: it is a missing check that reports as coverage. Every instance was found by a person reading the assertion, not by anything running it.',
    instances: Object.freeze([
      Object.freeze({ when: '2026-09-08', what: 'the Control Room session-forgery test built its third forgery by replacing the token\'s last character with "A" — which is not a forgery when the token already ends in "A". 3 of 40 logins do. It failed with a message that reads as a session breach and was not one.', anchor: { kind: 'commit', sha: '6e2f9dab889ffdcac2bc9ddcc6c742f43953e95e', subject: 'passed for the wrong reason' } }),
      Object.freeze({ when: 'recorded', what: 'the phrase, used by the handover about its own assertions — the simulation\'s byte-identical-tree test, the autonomy suite\'s skip on `main`, the credential scan going green because files were not yet committed, and the session-forgery test above.', anchor: { kind: 'contains', path: 'docs/HANDOVER.md', text: 'wrong reason', min: 4 } }),
      Object.freeze({ when: 'standing', what: 'the assertion that has caught the suite list growing six times is itself the only structural defence recorded against this, and it defends one list.', anchor: { kind: 'contains', path: 'AGENTS.md', text: 'caught the suite list growing' } }),
    ]),
  }),

  Object.freeze({
    id: 'P-04',
    family: 'repeated_correction',
    title: 'A declared count drifts from the thing it counts',
    statement:
      'Counts in this repository are written by hand into prose and into code, beside the thing they count, and they drift. One is drifting right now: `agent/schemas/cli.mjs` prints a word-count of the contracts immediately above the list of contracts, and the two disagree.',
    so_what:
      'Every instance was caught by a person or by one assertion that happens to guard one list. Nothing checks a count against its subject anywhere else, and a count is the cheapest thing in this repository to check mechanically.',
    instances: Object.freeze([
      Object.freeze({ when: 'now', what: 'the contracts banner against the registry — measured on every run of this module, so it stops being evidence the moment somebody fixes it.', anchor: { kind: 'measure', measure: 'contracts_banner_vs_registry', expect: 'drifted' } }),
      Object.freeze({ when: 'six times', what: '`agent/implement/selftest.mjs` R6 asserts the length of the suite list, and has caught it growing six times — including once where a merge left two branches asserting different numbers for the same fact.', anchor: { kind: 'contains', path: 'AGENTS.md', text: 'caught the suite list growing' } }),
      Object.freeze({ when: '2026-09-08', what: 'protocol §20 was asserted to name four low-risk categories. It names five, and the fifth was missing until two independently written lists were merged and disagreed.', anchor: { kind: 'commit', sha: '542dfa81b3a366a0a4425307c3dd7b3ea2b388a0', subject: 'record what was mis-reported' } }),
      Object.freeze({ when: 'recorded', what: '`MODULE_SURFACE` must name every module in `js/` and did not name `threshold.js` until a session added it.', anchor: { kind: 'contains', path: 'AGENTS.md', text: 'MODULE_SURFACE' } }),
      Object.freeze({ when: 'recorded', what: 'audit F-08: the README hardcodes derived counts while asserting it cannot drift.', anchor: { kind: 'contains', path: 'docs/AUDIT-2026-09-01.md', text: 'F-08' } }),
      Object.freeze({ when: 'now', what: 'and one more, found by re-running the checks for this session rather than by looking for it: the handover records the boundary scan at 225 files under agent/, and every SESSION 26 commit holds 226. A hand-written count, one out, in the paragraph that exists to let a later session detect drift.', anchor: { kind: 'contains', path: 'docs/HANDOVER.md', text: 'at 225 files where SESSION' } }),
    ]),
  }),

  Object.freeze({
    id: 'P-05',
    family: 'implementation_failure',
    title: 'Parallel branches build the same thing twice',
    statement:
      'Sessions are cut from the same base and run without knowing about each other. Two of them implemented the same governance facts; two others built two Source Scouts; one titled its work with a session number another session was already using.',
    so_what:
      'One home per fact is this project\'s first principle, and the mechanism that most reliably produces a second home is the branching model itself. The audit named this in F-17 and nothing has been built for it.',
    instances: Object.freeze([
      Object.freeze({ when: '2026-09-08', what: 'SESSIONS 22 and 23 each implemented protocol §18\'s mandatory conditions and §19\'s triggers, in two modules, from the same base.', anchor: { kind: 'commit', sha: 'e6f2715dc738a89750a8d04debb9d83e0585acd0', subject: 'it duplicates session 23' } }),
      Object.freeze({ when: '2026-09-08', what: 'the merge that resolved it, in the direction protocol §14 states: the Orchestrator enforces policy and does not define it.', anchor: { kind: 'commit', sha: 'daba25ac39f81843dca12e702c5cd0810104e21e', subject: 'give the autonomy policy one home' } }),
      Object.freeze({ when: '2026-09-01', what: 'two parallel Scouts, reconciled by adopting one and retiring the other.', anchor: { kind: 'commit', sha: 'ef922015a44e7bd32b3eb324ef25032e3340ce55', subject: 'retire its implementation' } }),
      Object.freeze({ when: 'recorded', what: 'audit F-17: nothing makes concurrent sessions aware of each other.', anchor: { kind: 'contains', path: 'docs/AUDIT-2026-09-01.md', text: 'F-17' } }),
      Object.freeze({ when: 'now', what: 'the branch list, measured: work that is not in `main` and that a session starting from `main` does not inherit.', anchor: { kind: 'measure', measure: 'unmerged_session_branches', expect: { at_least: 1 } } }),
    ]),
  }),

  Object.freeze({
    id: 'P-06',
    family: 'implementation_failure',
    title: 'A lesson written on a branch never becomes a rule',
    statement:
      'A session found the stale-base failure, wrote the fix as a rule into the git-workflow skill and into AGENTS.md, and pushed it to a branch that was never merged. The rule is not on `main`. Neither AGENTS.md nor the skill a session reads contains it.',
    so_what:
      'This is the objective of this session stated as a defect: repeated human intervention becomes durable system knowledge only if it lands where the next session reads. Six branches currently hold work that `main` does not, and nothing reports them.',
    instances: Object.freeze([
      Object.freeze({ when: 'now', what: 'the end-of-session re-fetch rule — "re-fetch and diff docs/HANDOVER.md against origin/main immediately before the final write or any merge" — is in no document on `main`. The skill a session is pointed at does not carry it.', anchor: { kind: 'contains', path: '.agents/skills/git-workflow/SKILL.md', text: 're-fetch', max: 0 } }),
      Object.freeze({ when: 'now', what: 'nor does the canonical entry point.', anchor: { kind: 'contains', path: 'AGENTS.md', text: 're-fetch', max: 0 } }),
      Object.freeze({ when: 'now', what: 'the branches that hold what `main` does not, counted.', anchor: { kind: 'measure', measure: 'unmerged_session_branches', expect: { at_least: 1 } } }),
    ]),
  }),

  Object.freeze({
    id: 'P-07',
    family: 'implementation_failure',
    title: 'Nothing is ever decided, and the mechanism explains why',
    statement:
      'Not one proposal has been approved, rejected or edited. The ledger is absent rather than empty. And the one command that could write it binds a decision to a proposal held in a git-ignored store, so a decision recorded today reads `void_unknown_proposal` on any other machine until the producing agent is re-run over the same corpus.',
    so_what:
      'A backlog nobody decides is usually read as a backlog nobody has got to. Here it is also a mechanism nobody can use durably. The two are different problems and only one of them is about attention.',
    instances: Object.freeze([
      Object.freeze({ when: 'now', what: 'the ledger file, absent — which is not the same fact as empty and is not reported as one.', anchor: { kind: 'path', path: 'agent/implement/decisions/decisions.jsonl', exists: false } }),
      Object.freeze({ when: 'now', what: 'decisions recorded, measured through the ledger reader itself.', anchor: { kind: 'measure', measure: 'decisions_recorded', expect: 0 } }),
      Object.freeze({ when: 'now', what: 'proposals reachable by id for a decision to bind to, in a fresh clone.', anchor: { kind: 'measure', measure: 'proposals_reachable_for_decision', expect: 0 } }),
      Object.freeze({ when: 'recorded', what: 'the same fact, stated by the canonical entry point.', anchor: { kind: 'contains', path: 'AGENTS.md', text: 'proposal in this repository has ever been decided' } }),
      Object.freeze({ when: '2026-09-09', what: 'and by the session that ran the whole system against the real corpus and produced 48 proposals.', anchor: { kind: 'contains', path: 'docs/SESSION-25-FIRST-REAL-WORLD-RUN.md', text: 'It did not decide a single proposal' } }),
      Object.freeze({ when: 'recorded', what: 'the review surface itself: a person approving in the Control Room is not shown the twelve mandatory conditions their approval stands over.', anchor: { kind: 'contains', path: 'docs/FIRST-END-TO-END-AUDIT.md', text: 'H-1' } }),
    ]),
  }),

  Object.freeze({
    id: 'P-08',
    family: 'repeated_rejection_reason',
    title: 'Every refusal is the same refusal, and it happens at the first gate',
    statement:
      'Where something has been refused, the reason is almost always the derived category. The autonomy runner\'s first real run refused all fourteen proposals in the store, thirteen of them as `substantive_data_change`. The gap router refused twenty-two gaps as not proposable at all — seventeen of them glossary definitions, four legal-overlap readings, one schema decision.',
    so_what:
      'The refusals are machine refusals, not human ones, and they cluster at the earliest gate. That means the later gates — rollback, scope, verification — have almost never been exercised against real work, and a session reading "refused" learns nothing about them.',
    instances: Object.freeze([
      Object.freeze({ when: '2026-09-09', what: 'the first real autonomy run: 0 merged, 0 reverted, 14 refused, each by four independent gates.', anchor: { kind: 'contains', path: 'docs/HANDOVER.md', text: '0 merged · 0 reverted · 14' } }),
      Object.freeze({ when: '2026-09-09', what: 'the gap router\'s refusals, named rather than dropped.', anchor: { kind: 'contains', path: 'docs/SESSION-25-FIRST-REAL-WORLD-RUN.md', text: 'NOT PROPOSABLE HERE' } }),
      Object.freeze({ when: 'recorded', what: 'and the reason the clustering matters: the rollback gate has never examined a record on either workflow type that declares it.', anchor: { kind: 'contains', path: 'AGENTS.md', text: 'the rollback gate has never examined a record' } }),
    ]),
  }),

  Object.freeze({
    id: 'P-09',
    family: 'evidence_weakness',
    title: 'The corpus cannot say when anything was last checked',
    statement:
      'No URL in this repository has ever been fetched by anything in it. `last_verified` is a bulk compilation date wearing a per-record name. The one session that tried to verify against live sources reached none of the five registered endpoints. 106 records say they require verification and the number has not moved.',
    so_what:
      'This is the evidence weakness every other one reduces to. It is also the one thing on this list that no rule, validation or skill can fix — it needs documents retrieved and read, which is work, not governance.',
    instances: Object.freeze([
      Object.freeze({ when: 'recorded', what: 'the freshness validator prints a reachability heading and performs no network I/O.', anchor: { kind: 'contains', path: 'AGENTS.md', text: 'no URL here has ever been fetched' } }),
      Object.freeze({ when: '2026-09-09', what: 'the live run: not one claim in this build could be verified against a live source, because not one registered source could be reached.', anchor: { kind: 'contains', path: 'docs/SESSION-25-FIRST-REAL-WORLD-RUN.md', text: 'could not verify a single claim' } }),
      Object.freeze({ when: 'recorded', what: 'audit F-13: `last_verified` is a batch stamp wearing a per-record name.', anchor: { kind: 'contains', path: 'docs/AUDIT-2026-09-01.md', text: 'F-13' } }),
      Object.freeze({ when: 'now', what: 'and the shape of the hole, measured: six of the eight retrieval fields the governance grant allowlists exist on no record in the file the grant names.', anchor: { kind: 'measure', measure: 'grant_fields_absent', expect: { at_least: 1 } } }),
    ]),
  }),

  Object.freeze({
    id: 'P-10',
    family: 'ux_objection',
    title: 'An interface defect a reader meets is measured, re-measured, and left',
    statement:
      'The browser suite found three defects in SESSION 19 that no validator can see. SESSION 25 measured the same three, unchanged. Ten UX proposals and twelve open questions sit pending. Every one of them is Class C work needing a human decision that has not been made.',
    so_what:
      'These are not disputed and not hard to state. They are stuck on the same thing as everything else on this list: there is no decision, and no queue that shows one is needed.',
    instances: Object.freeze([
      Object.freeze({ when: '2026-09-03', what: 'with scripting off the site has no navigation, and the notice that would say so does not.', anchor: { kind: 'contains', path: 'docs/BROWSER-QA.md', text: 'With scripting off, the site has no navigation' } }),
      Object.freeze({ when: '2026-09-03', what: 'the skip link is the tenth focusable element in the rendered page, because the chrome is inserted ahead of it.', anchor: { kind: 'contains', path: 'docs/BROWSER-QA.md', text: 'The skip link is the tenth focusable element' } }),
      Object.freeze({ when: '2026-09-09', what: 're-measured six sessions later: the same three, and nobody has fixed them.', anchor: { kind: 'contains', path: 'docs/SESSION-25-FIRST-REAL-WORLD-RUN.md', text: 'nobody has fixed' } }),
    ]),
  }),

  Object.freeze({
    id: 'P-11',
    family: 'editorial_correction',
    title: 'The copy a reader actually sees is the one nothing validates',
    statement:
      'The brief\'s prose has two homes. `index.html` inlines a blob duplicating `data/brief.json`; nothing loads the canonical file at runtime and no validator compares them. They have already drifted, and the drifted field is the standfirst — the first sentence a reader and any search index meet.',
    so_what:
      'Every editorial finding this repository has produced is downstream of this: an agent that reads a sentence cannot tell which of the two copies it is reading, and the one it is least likely to read is the one that ships.',
    instances: Object.freeze([
      Object.freeze({ when: 'recorded', what: 'the hazard, in the canonical entry point.', anchor: { kind: 'contains', path: 'AGENTS.md', text: '__CONTENT__' } }),
      Object.freeze({ when: 'recorded', what: 'audit F-04: a second, unvalidated copy of the brief\'s facts, with its own ID namespace.', anchor: { kind: 'contains', path: 'docs/AUDIT-2026-09-01.md', text: 'F-04' } }),
      Object.freeze({ when: '2026-09-09', what: 'located precisely, and ranked the highest-confidence editorial finding of the real-world run.', anchor: { kind: 'contains', path: 'docs/SESSION-25-FIRST-REAL-WORLD-RUN.md', text: 'meta.standfirst' } }),
      Object.freeze({ when: 'recorded', what: 'and its sibling: correcting an English string without declaring the key superseded leaves three locales asserting the thing that was corrected. F-05.', anchor: { kind: 'contains', path: 'docs/AUDIT-2026-09-01.md', text: 'F-05' } }),
    ]),
  }),

  Object.freeze({
    id: 'P-12',
    family: 'implementation_failure',
    title: 'The grant was written against a description of the tree, not the tree',
    statement:
      'The one governance grant this repository has reaches, in one direction, further than it reads, and in the other, nothing at all. Its path allowlist names `docs/`, and every prose governance document lives under `docs/`; `categoriseProposal()` places any docs-only proposal in `machine_derived_field`, which the grant enables. In the other direction six of its eight allowlisted fields exist on no record in the file it names.',
    so_what:
      'The three lists that protect the executable policy — the never-automatic paths, the never-writable paths, and the legal-record paths — all name `agent/policy/` or `data/`. None names the documents a person reads to find out what the policy is. This is not a claim that such a change would merge: six further gates and twelve conditions run after these, and no autonomous change has ever merged anything. It is a claim about which gates would not stop it.',
    instances: Object.freeze([
      Object.freeze({ when: 'now', what: 'the prose governance documents that the category and path gates place inside an enabled category, counted against the real policy in force.', anchor: { kind: 'measure', measure: 'policy_docs_in_enabled_category', expect: { at_least: 1 } } }),
      Object.freeze({ when: 'now', what: 'the rule that puts them there: any ImplementationProposal whose every path is under `docs/`.', anchor: { kind: 'contains', path: 'agent/policy/categories.mjs', text: 'docs/ only' } }),
      Object.freeze({ when: 'now', what: 'and the other direction — the allowlisted fields that exist nowhere in the dataset the grant names.', anchor: { kind: 'measure', measure: 'grant_fields_absent', expect: { at_least: 1 } } }),
    ]),
  }),
]);

/* ---------------------------------------------------------- reading */

/**
 * Every pattern, with every anchor resolved, and the two-instance
 * rule applied to what actually held.
 *
 * A pattern that does not clear the rule is REPORTED as refused,
 * with its instances, rather than omitted — a session that dropped
 * what it could not support would be telling its reader something
 * false about its own coverage.
 *
 * @returns {Promise<{patterns:object[], refused:object[], families:object,
 *                    anchors:{resolved:number,refuted:number,unresolvable_here:number}}>}
 */
export async function patternsWithEvidence({ resolveAll, root, patterns = PATTERNS } = {}) {
  const out = [];
  const refused = [];
  const totals = { resolved: 0, refuted: 0, unresolvable_here: 0 };

  for (const p of patterns) {
    const anchors = await resolveAll(p.instances.map((i) => i.anchor), { root });
    for (const k of Object.keys(totals)) totals[k] += anchors.counts[k];
    const instances = p.instances.map((inst, i) => ({ ...inst, anchor: anchors.anchors[i] }));
    const holding = instances.filter((i) => i.anchor.state === 'resolved');
    const record = {
      ...p,
      instances,
      instances_total: instances.length,
      instances_holding: holding.length,
      anchors: anchors.counts,
      supported: holding.length >= MIN_INSTANCES && anchors.counts.refuted === 0,
      why: holding.length >= MIN_INSTANCES && anchors.counts.refuted === 0
        ? `${holding.length} of ${instances.length} instance(s) hold against this tree${anchors.counts.unresolvable_here ? `, and ${anchors.counts.unresolvable_here} anchor(s) cannot be checked here — recorded, and counted neither way` : ''}.`
        : anchors.counts.refuted
          ? `${anchors.counts.refuted} anchor(s) are REFUTED by this tree. A pattern with a refuted anchor is not reported as supported, whatever its other instances say: ${instances.filter((i) => i.anchor.state === 'refuted').map((i) => i.anchor.why).join(' · ')}`
          : `${holding.length} instance(s) hold and a pattern needs ${MIN_INSTANCES}. One occurrence is an incident.`,
    };
    (record.supported ? out : refused).push(record);
  }

  const families = Object.fromEntries(FAMILIES.map((f) => [f, out.filter((p) => p.family === f).length]));
  return { patterns: out, refused, families, anchors: totals };
}
