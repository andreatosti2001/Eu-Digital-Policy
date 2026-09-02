# Verification integration

**Status:** reference. The adapter between `VerificationRecord`s and the
canonical datasets — what it does, what it refuses, and what it cannot do.
**Built:** SESSION 08, 2 September 2026.
**Code:** `agent/integrate/`. **Contract:** `agent/schemas/contracts/data-proposal.mjs`.
**Companions:** `docs/LEGAL-VERIFIER.md` (what produces its input),
`docs/AGENT-CONTRACTS.md` (the contract layer), `docs/DATA-GOVERNANCE.md`,
`docs/VERIFICATION-POLICY.md`, `docs/SOURCE-POLICY.md`.

---

## 1. What this is

The Legal Verifier produces a `VerificationRecord`: *this proposition, checked
against this retrieved document, by this method, at this location in it, with
this verdict, leaving this residual gap.* Nothing in that record touches
`data/`. Getting from one to the other is a separate act with its own burden,
and this layer is the shape of it.

**The current data model is not replaced, extended, migrated or shadowed.** No
new file was added to `data/`. No field was added to any dataset. `data/` is
read and never written, and there is no code path in `agent/integrate/` that
could write to it — the suite hashes every file in the directory around a full
run and scans every module for a write call.

What comes out is contract records: a `ClaimEvidence` link, a `DataProposal`, a
`DataGap`, an `ApprovalRequest`, an `AgentRun`. They live in `agent/records/`,
which is git-ignored, regenerable, and not canonical.

```
node agent/integrate/cli.mjs --mock --dry               # the adversarial corpus, storing nothing
node agent/integrate/cli.mjs --mock --as-of 2026-09-02
node agent/integrate/cli.mjs --records <trace-id> --as-of YYYY-MM-DD
node --test agent/integrate/selftest.mjs                # 61 tests
```

`--as-of` is required on the live path and has no default. See §7.

## 2. The eight things the session asked for, and where each lives

| | Requirement | Module |
|---|---|---|
| 1 | find an existing claim before creating a new one | `claims.mjs` |
| 2 | find an existing source before creating a duplicate | `sources.mjs` |
| 3 | attach evidence to the canonical record | `evidence.mjs` |
| 4 | detect unsupported claims | `unsupported.mjs` |
| 5 | detect stale verification | `stale.mjs` |
| 6 | detect conflicting evidence | `conflicts.mjs` |
| 7 | preserve existing IDs | `preserve.mjs` + the contract |
| 8 | preserve existing provenance | `preserve.mjs` + the contract |

`canonical.mjs` reads `data/`. `match.mjs` holds the matching arithmetic 1 and 2
share. `propose.mjs` builds the records. `adapter.mjs` sequences it.

The first three run per verification; the last five run over the corpus
afterwards, because 4, 5 and 6 need to know what this run resolved before they
can say what is unsupported, stale or in conflict.

## 3. The contract this forced, and what was rejected instead

**`DataProposal` is a fifteenth contract, and this is a Class C change to the
contract layer.** It is flagged here rather than buried.

The session requires that *any proposed factual modification must first become a
proposal object*. The fourteen had no home for one:

- **`EditorialProposal`** is a change to the brief's prose. A change to
  `data/claims.json` is not prose.
- **`ImplementationProposal`** is a change to code. It would have validated — a
  proposal to edit `data/claims.json` fits under `files` and `modules` — and it
  would have recorded a change to *what the site says about EU law* as a change
  to a script. That is the shape of routing around a contract while appearing to
  honour it.
- **`ClaimEvidence`** covers the *edge* between a claim and a source, and this
  layer emits one for every attachment. But it is a `link`, not a proposal: it
  carries no autonomy class, no rollback plan, no validation requirements, and
  it cannot express "create a source record" or "amend a field" at all.
- **Doing it outside the contract layer**, as a plain object the adapter
  understands, would have put the one operation that reaches the legal record
  outside the one gate that checks anything.

So the contract was added with its tests in the same commit — the course
SESSION 05 took for the Scout and SESSION 07 took for the Verifier, recorded the
same way.

**`CONTRACT_SCHEMA_VERSION` was deliberately NOT bumped**, on the precedent both
earlier sessions set and recorded. The constant is global across every contract
and bumping it invalidates every fixture and every stored record. Adding a
contract invalidates nothing that already exists — no record names
`DataProposal` unless something wrote one — so the case is weaker here than it
was for either earlier amendment. **The contract layer still has no per-contract
versioning, and this session did not add one.**

### Three of this repository's rules, stated as checks

**Find the existing record first.** `existing_search` is required before either
`create_` operation, and it is not a boolean: it names the strategies that were
run, how many records were compared, the closest one found, and *why that one is
not this one*. A duplicate source record does not announce itself later; it
quietly becomes a second home for a document that already had one.

**The id and the provenance survive.** `preserves_record_id` must be true
wherever a record already exists. Every provenance field the proposal touches
carries a stated disposition, and the vocabulary has **no word for removing
one** — `unchanged`, `extended`, `set_first_time`, `replaced_human_only`, and
nothing else. Removing an asterisk, a reference gap, a `requires_verification`
flag or a `verification_note` is red tier (`AI-SAFE-BOUNDARIES` §3), and a
vocabulary that offered the word would be an invitation to use it.

**A substantive legal change is never merged automatically.** `substantive`
forces `human_only`, and `auto_merge`, `apply_automatically`,
`merge_on_approval`, `merged` and `applied` are forbidden fields answered with
the objection rather than "unknown field". A proposal does not record its own
landing: that is a `ChangeRecord`, behind an `ApprovalRequest`.

## 4. Two gates, both mandatory

Every record goes through `agent/schemas/gateway.mjs` `emit`, which validates
against its contract and throws.

Every `DataProposal` **also** goes through `agent/integrate/preserve.mjs`
`checkPreservation`, which validates it against the corpus it would change:
does the `record_id` exist, is the quoted `current` value what `data/` actually
carries, is the id it would create already taken somewhere in the global
namespace, does the `record_kind` match the dataset that is its one home.

The split is deliberate. `agent/schemas/validate.mjs` never reads `data/` — a
gate that loaded the legal record in order to validate a record would make every
contract check depend on the state of the thing it is meant to be protecting. So
the contract holds the shape, and this holds the shape *against the corpus*.
Both run, on one path, and a proposal failing either is refused rather than
stored. There is no flag that turns either off, and the suite asserts there is
exactly one call to the store and exactly one call to the preservation check in
`adapter.mjs`.

## 5. What a match is, and what a near miss is called

Three outcomes, never two: **`matched`** · **`ambiguous`** · **`no_match`**.

A matcher that only says yes or no has to force every close call into one of
them, and both directions are damaging. A false yes attaches a citation to a
sentence the source does not support. A false no writes a second home for a
record that already existed. `ambiguous` is a finding for a human and it is a
correct outcome, in exactly the way the Verifier's `not_determinable` is.

**Claim strategies**, in order of what they prove: `declared_entity` (the
verification names a claim id that exists — identity, not a guess) ·
`statement_exact` · `statement_overlap` **with a shared instrument** ·
`statement_overlap` alone, capped below the accept threshold. The instrument
test is load-bearing: two sentences about EU law share a great deal of
vocabulary without being about the same act, and a matcher without it would
attach the AI Act's date to the DSA's claim.

**Source strategies**: `source_id` · `celex` · `normalised_url` ·
`title_and_publisher`. Two EUR-Lex addresses sharing a host and a path but
differing in their parameters are reported **ambiguous**, never matched: that is
often one document seen two ways and sometimes two language editions or two
consolidated versions, which are different documents with different content.

**The score is not a probability.** It is this matcher's own scale — Jaccard
overlap of token sets, chosen because a reviewer handed 0.42 can count the
words. Thresholds are `accept: 0.8` and `consider: 0.45`, in one place, with
what each costs when it is wrong.

`normaliseUrl` and `normaliseTitle` are imported from
`agent/scout/dedupe.mjs`, where they already answer the same question for the
Scout. A second copy would drift the first time somebody added a tracking
parameter to one of them.

## 6. Attaching evidence — the mapping that only ever weakens

`data/claims.json`'s own `$note`: *direct* means the source states the
proposition, *partial* means it establishes part of it or a narrower case, and
*context* means it informs the claim without establishing it and is **not** a
citation. Only `supports:direct` can raise a grade (`SOURCE-POLICY` §4). So the
verdict-to-qualifier mapping is the highest-leverage line in the directory, and
it is written to fail downward:

| Verdict | Qualifier |
|---|---|
| `confirmed` | whatever the evidence itself claimed, and never stronger |
| `partially_confirmed` | `supports:partial`, whatever the evidence entry said |
| `contradicted` | nothing is attached — a source that says otherwise is not a source that supports |
| `not_determinable` · `source_unavailable` · `conflict` | nothing is attached |

Where several retrieved documents are present, the **strongest** is chosen —
direct, then partial, then context. Taking whichever came first in the array
would make which document a claim ends up citing depend on the order the
Verifier wrote its evidence in, and a commentary listed above the Official
Journal would become the citation. Ordering is not a fact about the documents.

A source a claim already cites is never attached again, and **one
claim-and-source pair yields one proposal per run**. Several propositions from
one document routinely match one claim; a proposal each would put the same
reference in the bibliography five times, and the corpus check cannot catch it
because it compares against `data/`, which does not yet carry any of them. Where
a later check would have reached a *weaker* qualifier than the standing
proposal, that difference is recorded rather than swallowed — a reviewer should
decide which the reference carries.

## 7. Nothing here reads a clock

`asOf` is a mandatory argument. `Integrator` and `staleVerification` both throw
without it, and the CLI refuses to run on the live path without `--as-of`.

Audit F-15: derived output computed against `new Date()` changes with when and
where it runs, so a staleness report with no date on it is not reproducible.
`VERIFICATION-POLICY` §4 requires every report to carry its as-of date. A test
strips comments from every judging module and asserts none of them contains
`new Date()` or `Date.now()`.

The intervals come from `tools/freshness.mjs`, which SESSION 08 changed so that
`EXPECTED` is exported and the audit body runs only when the file is the entry
point. **Its output is byte-identical** — verified by diffing a run against the
same date before and after. A second table of intervals in the agent layer would
be a second home for a fact, and the two would disagree the first time somebody
tightened one.

### The caveat that qualifies every staleness figure

`VERIFICATION-POLICY` §5: the `last_verified` field is per-record and the
practice is not — the values were written in bulk by the sweep scripts. So an
"age" computed from one is the age of a **compilation**, and every staleness row
carries that qualifier.

The signal is `distinct dates <= 1` **or** `records per distinct date >= 10`.
The threshold is stated rather than tuned, and it is named as a signal rather
than a proof. It matters: `data/claims.json` carries 84 `last_verified` values
across **two** distinct dates. A binary "are they all the same value" test would
have called that a per-record field and told a reader the opposite of the truth.
This is a different question from the one `freshness.mjs` asks — that script
flags only when *every* date in the whole repository is identical — so the two
are not two homes for one fact.

**Stale is not wrong.** A dataset past its interval is one nobody has re-read,
and the record it holds may be exactly right. Nothing here may be used to lower
a confidence, downgrade a grade, or mark a record doubtful, and the fix is
re-reading the source — never bulk-stamping `last_verified`, which
`AUTONOMY-POLICY` §4 prohibits outright. The string saying so travels into every
gap record this produces, because a caveat that only exists in the source of the
module that computed it is a caveat nobody downstream reads.

## 8. Unsupported is not false

Six reasons, kept apart because they are different states needing different
work: `self_cited_only` · `no_external_direct` · `context_only` ·
`declared_reference_gap` · `dangling_source` · `verification_unsettled`.

`familyOf` and `evidenceGrade` are **imported from `js/format.js`**, not
reimplemented. `DATA-GOVERNANCE` §1.2 is explicit that a derivation may not be
duplicated into a second implementation, and a second grading rule in the agent
layer would be the exact defect `js/evidence-view.js` was written to end. The
grade this layer reports is the grade the page shows.

**An `argument`-family claim — interpretation, critique, forecast — is never
reported as a missing citation.** It grades `interpretation` however well
sourced it is, because a source can support the premises of a reading and cannot
settle its conclusion. Every row carries which it is, the tally reports the two
figures apart, and there is deliberately **no single total**: folding a reading
in with a missing citation is the collapse `DATA-GOVERNANCE` §2 prohibits,
applied to the one number a reader would quote.

**And the list getting shorter is not a goal.** `VERIFICATION-POLICY` §6: the
unverified report is the project's honest statement of what it cannot support,
and it shortens when a source is genuinely found and read — never by attaching a
plausible substitute, clearing a flag, or deleting a record. Every gap this
produces says so in `closes_with`.

Gap records are emitted **only for claims this run actually touched**. Emitting
91 of them for a corpus whose unverified state `tools/validate.mjs` already
reports would be a second home for that list. The full list is returned in the
report either way.

## 9. Conflicts are found and never resolved

Four kinds:

- **`verification_internal`** — a `conflict` verdict the Verifier already
  reached between two documents, carried through onto the canonical entity so it
  does not stop at the agent layer.
- **`against_canonical`** — a verification's stated value differs from what
  `data/` stores for the same attribute of the same instrument. *This is the one
  this layer exists to find, and the one with a reader on the end of it.*
- **`between_verifications`** — two verifications in one run state different
  values for one attribute.
- **`claim_contradicted`** — a verification matched to a claim came back
  `contradicted`.

**No `DataProposal` is produced for any of them.** `AGENT-ROLES` H7: where two
roles disagree on a fact, work halts and goes to a human — never resolved by
seniority, recency or convenience. A proposal would have to name a value, and
naming one is the decision this refuses to take. Each conflict becomes a
blocking `DataGap` and goes into the approval request.

`compareValues` is imported from `agent/verifier/conflict.mjs`, so a difference
of *precision* is not a disagreement here either. A second comparison rule would
manufacture conflicts out of a month and a day the first time the two drifted.

**A staged act yields nothing to compare against.** `data/timeline.json` carries
several application events for the AI Act; comparing a source against one of
them would be this layer choosing which stage the source meant. `canonicalValue`
returns null where there is not exactly one event, and null is an absence rather
than an agreement.

**A status the taxonomy cannot express is a coverage gap, not a conflict.**
Five of the Verifier's twelve legal statuses map to nothing in
`data/taxonomy.json` — `corrected`, `annulled`, `under_judicial_review`,
`guidance`, `non_binding_commentary`. Saying two things disagree when one of
them cannot be expressed would manufacture a disagreement out of a missing word.
Whether those terms belong in the taxonomy is a data decision (SESSION 07's
next-session candidate B), not something to retrofit from here.

## 10. What a new source record does *not* carry

Seven fields come back null, each with the reason recorded on the proposal:
`id`, `tier`, `type`, `publisher`, `url_status`, `language`, `note`.

- **`id`** — every id in this repository was minted by somebody who had read the
  document. This layer does not name records in a namespace that is never
  renamed.
- **`tier`** — the verification carries an estimated `source_tier`, typed as an
  *inference* and documented as an *estimate*. Writing it here as the settled
  tier would turn an estimate into a fact by moving it.
- **`url_status`** — a stored assertion by whoever last edited the record
  (`SOURCE-POLICY` §8). Nothing in this repository has ever fetched a URL as
  part of a validator, and this layer will not assert a status it did not
  establish.

A `create_source` proposal is `human_only`, `substantive`, and requires
`retrieved_and_read: true` plus a `retrieved_document` in its evidence — both
enforced by the contract. Creating a `sources.json` record from a title, an
abstract, a search snippet or model knowledge is red tier.

## 11. A new claim is proposed and blocked

`data/claims.json`'s `$description`: *no new claims were written: every record
below corresponds to a statement already present in the prose.* This layer
cannot see the prose. So a `create_claim` proposal:

- drafts **no claim text** — `proposed` is null;
- mints no id;
- carries `prose_anchor: null` and a **blocking** open question naming it;
- is `human_only` and `substantive`.

The contract refuses a `create_claim` with no `prose_anchor` and no blocking
question about it. The proposal exists so that a proposition nothing in the
corpus carries is a recorded finding rather than a silent drop — and if the
brief makes no corresponding statement, the answer is that there is no claim to
write, not that one should be invented.

## 12. Tests

`node --test agent/integrate/selftest.mjs` — **61 tests**, run against the
**real `data/` directory**, not a mock corpus. An adapter between an agent's
records and the canonical datasets that was only ever tested against a corpus
this session invented would prove nothing about the corpus it will actually
meet.

The fixtures' real ids and real URLs are **looked up from `data/` at load**, not
typed in. A fixture that typed a EUR-Lex address by hand would be a legal
address authored from model knowledge, whatever it was for; and if a record is
renamed, the fixtures fail loudly instead of quietly testing nothing. Everything
else about them is unmistakably simulated, and every record carries
`simulated: true`.

Thirteen adversarial cases, each breaking something different: a pair that both
resolve · a source the claim already cites · several documents where the
strongest must win · `partially_confirmed` on direct evidence · a document no
record carries · a document nobody read · a proposition no claim carries · two
claims declared at once · same path with different parameters · a date that
disagrees with `data/timeline.json` · a contradicted verdict · a conflict the
Verifier already reached · a recheck that came due and a superseded record. Plus
one record this agent claims to have verified itself, refused at intake.

## 13. Four defects the tests found

Recorded because the next session should know the suite earns its keep.

1. **The CELEX pattern matched nothing at all.** It omitted the sector digit —
   `32016R0679` is sector 3, year 2016, type R, number 0679 — so every EUR-Lex
   address fell through to the weaker URL strategy. The tests caught it because
   one asserts the specific number rather than "some match".
2. **Five identical attach proposals for one reference.** Four verifications
   matched one claim and one source, and each produced its own proposal to add
   the same entry. Applied in order they would have put the source in the
   claim's bibliography five times. Deduplicated per run — and the second
   check's *weaker* qualifier is now recorded rather than lost.
3. **A `conflict` verdict was founding a source record.** The conflict fixture
   carries two retrieved documents; the first fell through to `create_source`.
   Now no verdict outside `confirmed` and `partially_confirmed` produces any
   proposal at all: nothing was established, and a proposal drawn from a check
   that established nothing stands on nothing.
4. **The compilation-date signal was binary and wrong for the one dataset it
   mattered most for.** `data/claims.json` carries two distinct
   `last_verified` values across 84 records. An "are they all identical" test
   reported it as a per-record field — the opposite of what
   `VERIFICATION-POLICY` §5 records.

## 14. Known limitations

1. **It has never seen a real `VerificationRecord`.** The Verifier has never
   read a real document — every registered endpoint is refused by this
   environment's egress policy — so the fixtures are the only input this layer
   has ever met. The *corpus* it matches against is real; the verifications are
   not.
2. **Matching is English-only and lexical.** The stopword list is English, and
   `overlap` scores two French sentences on their punctuation. A corpus about EU
   law contains documents in twenty-three other languages. Named as a limitation
   in the module rather than hidden.
3. **The thresholds are a judgement, not a derivation.** `accept: 0.8` and
   `consider: 0.45` are in one place and testable; different numbers would give
   different outcomes on the same corpus.
4. **`create_claim` fires on every unmatched proposition.** In a real run over
   twenty-three verifications that is a substantial number of blocked proposals.
   Each is a recorded finding rather than a silent drop, which is the intended
   behaviour, but a reviewer will have a list to work through.
5. **Only claims and sources are matched.** A verification bearing on a timeline
   event, an enforcement action or a provision resolves to no claim, and the
   `against_canonical` conflict check is the only thing that looks at those
   datasets. `HOME_OF` names every dataset; the matchers cover two of them.
6. **The provenance field lists are hand-written per dataset.** They are in one
   place in `canonical.mjs`, and a field added to a dataset without being added
   there is a provenance field nothing protects. No validator cross-checks them
   against the datasets' actual shapes.
7. **Nothing applies a proposal.** There is no path from an approved
   `ApprovalRequest` to a `ChangeRecord` to an edit. That is deliberate for this
   session and it means the loop is not closed: a human applies the change by
   hand, and this layer does not know they did.

## 15. What must not be changed

- **Do not add a write path to `agent/integrate/`.** The suite fails on
  `writeFileSync`, `appendFileSync`, `createWriteStream`, `rmSync`,
  `unlinkSync`, `mkdirSync`, `writeFile(` and `rename(` in any module here.
- **Do not add a bypass to either gate.** No `skipValidation`, no `force`, no
  `strict: false`. The suite asserts `adapter.mjs` contains exactly one call to
  the store and exactly one to `checkPreservation`.
- **Do not let this layer resolve a conflict.** No ranking, no tie-break, no
  "most recent wins", no "the primary source governs". Each of those is a rule
  about which regulator to believe.
- **Do not let a matcher pick a winner from an ambiguity.** The highest score is
  not the right answer; it is the closest one.
- **Do not let the verdict-to-qualifier mapping strengthen anything.** A
  `partially_confirmed` verdict yields `supports:partial` whatever the evidence
  entry claimed.
- **Do not give the provenance vocabulary a word for removal**, and do not let
  `replaced_human_only` be used outside a substantive `human_only` proposal.
- **Do not let this layer set `last_verified`**, on any record, under any
  circumstance. Attaching evidence does not make a record freshly verified, and
  bulk-stamping the field is prohibited outright.
- **Do not read a clock in a judging path.** `asOf` is an argument.
- **Do not reimplement `evidenceGrade`, `familyOf`, `compareValues`,
  `normaliseUrl` or `normaliseTitle`.** All five are imported from the module
  that owns them.
- **Do not remove the self-verification refusal at intake.**
