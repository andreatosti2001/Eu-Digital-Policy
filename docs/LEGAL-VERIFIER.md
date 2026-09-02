# The Legal Verifier

Agent 2. It answers one question — *what does this document actually establish?* —
and it is allowed to answer "not enough to say" and "two authorities disagree",
because those are frequently the true answers.

```
node agent/verifier/cli.mjs --mock              # the adversarial corpus
node agent/verifier/cli.mjs --records <trace>   # candidates from a real Scout run
```

---

## Where this sits

Read `docs/AI-SAFE-BOUNDARIES.md`, `docs/VERIFICATION-POLICY.md` and
`docs/AGENT-CONTRACTS.md` first; this document assumes all three.

`docs/AGENT-ROLES.md` §2 defines the role: *turns a candidate into a fact, or
refuses to.* The Verifier is the only role that may move a record from uncertain
to certain — **and even then only through Class C**, as a proposal for a human,
never a merge. This agent implements the checking half of that role. It does not
implement the writing half, and it has no code path to.

Input: `SourceCandidate` (Agent 1's output). Output: `VerificationRecord`.

## What it must not do, and cannot

| Prohibited | How it is prevented |
|---|---|
| update canonical data | it never opens `data/*.json` for writing. The suite hashes the whole of `data/` around a full run and fails if a byte moves, and scans every module in `agent/verifier/` for `writeFileSync`, `appendFileSync`, `createWriteStream`, `rmSync`, `unlinkSync` and `mkdirSync` |
| promote a candidate | `state: "accepted"` is a change to a `SourceCandidate`, and this agent emits new immutable records only. It writes the verification; a human decides |
| verify its own scouting | refused at intake when a candidate's `agent` is this agent (`AGENT-ROLES.md` §2). A test asserts the refusal and that the candidate produced no records |
| force a yes or a no | six verdicts, three outcome classes, and `unresolved` and `conflict` are first-class results |
| resolve a disagreement between authorities | `conflict.mjs` has no ranking function, no tie-break and no "most recent wins". Each of those is a rule about which regulator to believe |
| infer content from a title or a snippet | every proposition is quoted verbatim from text actually retrieved, and carried into the record |

## The twelve legal statuses

The brief requires the Verifier to tell apart **proposed · adopted · published ·
entered into force · applicable · amended · corrected · repealed · annulled ·
under judicial review · guidance · non-binding commentary.**

**Seven already have a home.** `data/taxonomy.json`'s `status` dimension is the
site's own vocabulary for exactly this, and `LEGAL_STATUS_TAXONOMY` in
`agent/schemas/types.mjs` points at it rather than copying its ids — one home per
fact, and a renamed taxonomy term fails the suite instead of silently
disagreeing with the agent layer.

| Status | `data/taxonomy.json` |
|---|---|
| proposed | `status:proposal` |
| adopted | `status:adopted` |
| published | `status:published` |
| entered_into_force | `status:in-force` |
| applicable | `status:applicable` |
| amended | `status:amended` |
| repealed | `status:repealed` |
| **corrected** | *none* |
| **annulled** | *none* |
| **under_judicial_review** | *none* |
| **guidance** | *none* |
| **non_binding_commentary** | *none* |

**The five nulls are the finding, not a gap to close from here.** They are
distinctions the Verifier must draw and the site's vocabulary does not carry.
They were deliberately **not** added to `data/taxonomy.json`: that file is the
enum authority a reader's page resolves against, changing it is data work, and
this session was not scoped for it. Whether they belong there is a real question
for a session that is — see "What the next session owns".

The status values are bare snake_case rather than `status:`-prefixed ids on
purpose: an agent-layer value that *looked* like a taxonomy id would eventually
be written into a dataset by something that did not check.

### In force is not applicable, and the tense is what keeps them apart

An act can be in force for two years before anyone owes anything under it. A
reader told an act "applies" when it has only entered into force may build a
compliance programme two years early — or read the reverse and be two years
late. This is the single most consequential collapse available in this corpus,
so it is prevented twice over:

- **At the signal.** Only a *perfect or present* form yields `applicable` —
  "has applied since", "has been applicable since", "is applicable". **"Shall
  apply from" produces no applicability signal at all**: it schedules
  applicability and does not assert it.
- **At the verdict.** A proposition *asserting* applicability over a text that
  only schedules it is downgraded to `partially_confirmed`, with the gap saying
  so in as many words.

**Whether a stated application date has arrived is never decided.** That answer
changes with when the question is asked, and `AUDIT-2026-09-01.md` F-15 records
what happens to derived output that depends on the reader's clock. A test
strips the comments from `judge.mjs`, `statuses.mjs`, `dates.mjs`,
`conflict.mjs`, `locate.mjs` and `decompose.mjs` and asserts none of them calls
`Date.now`, `new Date(`, `Date.parse` or `toISOString`.

### The lifecycle is cumulative; everything off it is not

`proposed → adopted → published → entered_into_force → applicable` is one act at
several points in its life, so co-occurring signals from that list are **not** an
ambiguity: the furthest along is the answer and each earlier stage is recorded as
also stated. Everything outside that list — amended, corrected, repealed,
annulled, under judicial review, guidance, commentary — is a statement about what
happened *to* an act. **Two of those together is a real ambiguity**, and the
status comes back null with the competing signals named.

### An annulment under appeal is not a final annulment

A General Court annulment with an appeal pending before the Court of Justice is
`under_judicial_review`. The annulment is recorded; its finality is not.

A pending challenge qualifies a document as a whole, not the one sentence that
mentions it, so `under_judicial_review` is carried down from the document even
onto propositions that carry status wording of their own. Without that, "the
decision is annulled" reads as settled in a judgment whose next paragraph says it
is under appeal.

## Decomposition, and why immaterial sentences are counted

`.agents/skills/legal-source-verification/SKILL.md`: *read the proposition as a
set of assertions… split before you check.* A record that checks a conjunction
takes the weakest verdict of its parts and reports it for the strongest, which is
how "90% sourced" becomes "sourced". So the unit of verification is **one
proposition**, and `VerificationRecord.statement` is singular by contract.

A proposition is **material** if it carries a legal-status signal, a date the act
turns on, an obligation, a penalty, or a reference to an instrument this
repository tracks. Everything else is set aside **with its reason recorded and
counted** — a proposition silently discarded is indistinguishable from one nobody
noticed.

**This is sentence-level pattern matching and it says so.** It does not parse
legal language, resolve anaphora, or understand a sentence whose subject is three
sentences back. `docs/SOURCE-SCOUT.md` records the same honest limitation about
the Scout's relevance matching.

### A status with no named subject is not attributed

Where a proposition states a status but names no instrument, **no instrument is
attached** and an open question records that its subject is unresolved. Attaching
"is repealed" to whatever instrument the document happens to mention elsewhere is
how a regulation that repeals a predecessor while amending the DSA ends up
reporting the DSA repealed. A proposition making no status claim *is* related to
the document's own subject — that is an association, not an assertion about that
act.

## The three dates, read and never computed

Publication, entry into force and application are three different dates, and this
corpus has already been bitten by treating them as one:
`.agents/skills/legal-source-verification/references/verification-protocol.md`
records an entry-into-force field in this repository that actually held the
application date. Each is read separately, from its own lead-in wording, and
returned **exactly as printed** — never reformatted, never widened. Normalising
"July 2024" into "2024-07-01" invents a precision the source does not have.

**Two refusals, both deliberate:**

- **The twentieth-day formula.** *"shall enter into force on the twentieth day
  following that of its publication in the Official Journal"* is the commonest
  entry-into-force wording in EU law and states no date. Computing one needs the
  OJ publication date at day precision, and being a day out is a fabricated legal
  fact under `AGENTS.md` rule 1. The formula is recorded as a formula, the date
  comes back `"unknown"`, and an open question names what would close it.
- **Two dates for the same thing.** *"Chapters I and II shall apply from X and
  the remainder from Y"* gives two application dates because the act applies in
  stages. Returning either would be false about the other half of the act, so the
  value is `"unknown"` and both are carried in the gap.

**The register is not the text.** Where a document's machine-readable metadata
and its operative text give different dates, **the text governs** — the protocol
reference states the rule and the reason — and the disagreement is reported as a
`partially_confirmed` verdict rather than silently resolved.

## The verdict, and the order it is decided in

`agent/verifier/judge.mjs`. The order is the argument: the most damaging error to
make is checked first.

1. **an internal contradiction** — a document saying two different things about
   the same date is not partially right → `contradicted`
2. **an ambiguous status** — collapsing two kinds is how a repeal reaches the
   wrong act → `not_determinable`
3. **applicability asserted where the text only schedules it** → `partially_confirmed`
4. **a register/text disagreement** → `partially_confirmed`
5. **one date stated more than once, differently** → `not_determinable`
6. **an obligation drawn from a non-binding source** → `partially_confirmed`
7. **an unresolved entry-into-force formula** → `partially_confirmed`
8. **nothing locatable** — an unlocatable support is unfalsifiable → `partially_confirmed`
9. **and only then** → `confirmed`

### Verdicts, outcomes, and how the source is said to bear on the proposition

| Verdict | Outcome class | `evidence[].supports` |
|---|---|---|
| `confirmed` | resolved | `supports:direct` |
| `partially_confirmed` | resolved | `supports:partial` |
| `contradicted` | resolved | `supports:direct` |
| `not_determinable` | **unresolved** | `supports:partial` |
| `source_unavailable` | **unresolved** | *(cites an `absent` entry; supports nothing)* |
| `conflict` | **conflict** | `supports:direct` on each side |

**The outcome class is derived and never stored** — `VerificationRecord` forbids
an `outcome_class` field on the same reasoning as an evidence grade: a second
copy is a second thing to be wrong.

**`supports:context` never appears, and that is not an oversight.** Context means
a source informs a claim without establishing it. A proposition here is quoted
from the document being checked, so the document always bears on it at least
partially; an unsettled check is unsettled because the document *qualifies* what
it says, not because it is silent.

## Conflict — found, and never resolved

`.agents/skills/legal-source-verification/SKILL.md` states it as a refusal
condition: **do not resolve a contradiction between sources by choosing one.**
So `conflict.mjs` finds disagreements and stops.

A **conflict** requires two *different documents*, both **authoritative**
(`tier:1` or `tier:2`), giving different values for the same attribute of the
same instrument. Three things that look like conflicts and are not:

- **A lower tier disagreeing with a higher one** is one authority and one
  commentary. The evidence hierarchy in `data/taxonomy.json` settles it, and
  calling it a conflict would suggest the law is unsettled when it is not. It is
  reported as `outranked`.
- **Two precisions of the same date** — "July 2024" and "12 July 2024" — are not
  a disagreement, and are not equality either (`sameDate` refuses to widen). A
  third thing, reported as `precision`.
- **The same document at two addresses** disagrees with nothing. Findings are
  compared across documents, matched on the candidate they came from.

One document states the same date in several of its own propositions, so the same
two documents would otherwise be reported as disagreeing once per pair of
propositions. Deduplicated on the instrument, the attribute and the two
documents — but **never on the values**, because two documents that disagree
twice have disagreed twice.

A conflict record carries both sides in `conflicting_evidence`, sets the disputed
field to `null` with a **blocking** open question, and picks no winner.

## Contract changes this agent forced

The brief requires fifteen things recorded for every material proposition. Six
already had a home on `VerificationRecord` — the claim (`statement`), the source
(`evidence[]`), the verification outcome (`verdict`), the uncertainty
(`residual_gap` and `epistemic.unresolved`), the verifier timestamp
(`checked_at`) and the exact supporting location at document level
(`evidence[].locator`). **Nine did not**, and each was added to the contract with
its tests rather than routed around — the same course SESSION 05 took for the
Scout (`docs/SOURCE-SCOUT.md`, "Contract changes this agent forced").

1. **`legal_status`** — the twelve-state vocabulary, new in
   `agent/schemas/types.mjs`. Typed `inference`, nullable and unknownable: the
   *classification into this vocabulary* is always the verifier's mapping step,
   never the document's own word, which is the same reasoning the Scout's
   `authority_class` and `tier_estimate` already carry.
2. **`publication_date`**, 3. **`entry_into_force_date`**, 4. **`applicability_date`**
   — three fields, kept apart under all circumstances. Typed `factual`, so a
   value with no `epistemic.fact` entry citing the retrieval is refused.
5. **`document_id`** — a CELEX number, an ELI, a case number, as printed. Never
   constructed from a URL.
6. **`source_tier`** — typed `inference` and named an estimate. `tier` and
   `grade` are added to `forbidden`, mirroring `SourceCandidate`: the settled
   tier lives in `data/sources.json` and the grade is derived at render time.
7. **`supporting_location`** — `{ raw, article, paragraph, page }`, the
   proposition-level pointer.
8. **`conflicting_evidence`** — the brief's "conflicting evidence", structured:
   which entries disagree, what each says, and why neither displaces the other.
9. **`confidence`** — the envelope carries one only on proposals; a record needs
   one too. (SESSION 05 made the same finding for a *finding*.)

Plus **`conflict`** added to `VERIFICATION_VERDICTS`. Nothing in the existing
vocabulary meant it: `contradicted` is *the source says otherwise*, and filing a
disagreement between two regulators as `not_determinable` would record evidence
as an absence of evidence.

**Six new contract rules**, and two existing ones extended to cover `conflict`:
a conflict verdict needs both sides named, a residual gap, an open question and a
stated method for concluding that they disagree; a conflict can never be
`confirmed`; `conflicting_evidence` refs must resolve; nothing may be located
inside a document nobody fetched; and `legal_status: "applicable"` with no
`applicability_date` must at least say the date is open.

### Why the new fields are flat rather than nested

They would read better grouped in one `legal_position` object. They are not,
because `agent/schemas/validate.mjs` enforces the epistemic burden — a factual
field must cite evidence, an inference must state its method, `"unknown"` must be
declared — on **top-level fields only**. Nested, they would be documented and
unenforced, which is the shape of a field nothing can be held to.

### One field deliberately not added

`outcome_class`. Derived from the verdict where it is read, and `forbidden` on
the contract so a later session cannot quietly store it.

## The record builder

`agent/verifier/build.mjs`. The Verifier never sets a field without its epistemic
entry: `fact()` writes the value **and** the citation, `openUnknown()` writes
`"unknown"` **and** the `unknown_not_determinable` entry, `openNull()` writes
`null` **and** `null_not_researched`. The two states the whole architecture
insists on keeping apart cannot be confused, because there is one call for each
and neither can produce the other's shape. `fact()` throws on a null value and on
an empty citation list.

## Observability

Every step is a span: `verifier.intake`, `verifier.retrieve`,
`verifier.decompose`, `verifier.proposition`, `verifier.crosscheck`. Every
verdict is a `decision` event carrying the verdicts **not** chosen and why — an
unrecorded alternative is how a decision becomes indistinguishable from an
accident. Every document read leaves a `provenance` event with the verification
block the protocol reference specifies.

**The protocol has five words and this agent emits six.** `conflicting` is new,
because `conflict` is a verdict the contract did not carry before this session
and none of the five means it: "not established" would file a disagreement
between two regulators as an absence of evidence. The reference file is
skill-layer material and was **not** edited from here — see below.

## Confidence

A formula, not a feeling, so two checks with the same evidence get the same
number and a reviewer can see why one is lower. It starts at 0.25 and is earned
by quoting the words, locating them, identifying the document, an authoritative
publisher and a status read from the proposition itself; it is reduced by an
ambiguous status and by a conflict verdict. **The ceiling is 0.9.** A rule-based
verifier reading signal phrases has not read the document the way a lawyer would,
and a number that reached 1.0 would say it had.

`source_unavailable` is the exception at 0.9 flat: nothing was read, but the
verdict is not a judgement call — the document did not arrive.

## The adversarial corpus

`agent/verifier/fixtures.mjs`. Eleven cases, each one where the plausible answer
is the wrong one: the twentieth-day formula · in force but applying later ·
applying in stages · one document repealing one act and amending another ·
annulled under appeal · a corrigendum · guidance using "must" · two authorities
with two dates · a press release placing nothing · metadata against the operative
text · a refused retrieval.

**Every host is `.invalid`** and every record produced from them is marked
`simulated: true` and refused as actionable by `agent/schemas/validate.mjs`. No
date, article number, case number, CELEX number or quotation in that file is a
real legal fact. The instrument *short names* are real, because the corpus has to
exercise the matcher against `data/instruments.json`; nothing asserted about them
is.

## Checks

```
node --test agent/verifier/selftest.mjs     # 42 tests, no network
node --test agent/schemas/selftest.mjs      # 73 — the contract layer, incl. the new rules
node agent/schemas/cli.mjs check            # 14/14 contracts satisfiable
```

Plus the four validators in `tools/`, against the `docs/CURRENT-ARCHITECTURE.md`
§12 baseline.

## Known limitations

1. **It has never read a real document.** Every registered endpoint is refused by
   this environment's egress policy (`docs/SOURCE-SCOUT.md` FINDING), so the
   Verifier has only ever run against its own fixtures. Everything below the
   contract layer is therefore verified against a corpus this session wrote.
2. **Decomposition is sentence-level pattern matching**, not parsing. A
   proposition whose subject is three sentences back is not resolved; a sentence
   split across a list or a table is not reassembled.
3. **Status detection is signal phrases in English only.** A document in French
   or German yields no status and an open question — correct behaviour, and a
   large coverage gap for a corpus about EU law.
4. **The verdict ordering is a judgement about which error is worst**, not a
   derivation from anything. It is stated in one place and testable, but a
   different ordering would give different verdicts on the same document.
5. **`conflict` detection compares only four attributes** — legal status and the
   three dates. Two sources disagreeing about an obligation, a penalty or a scope
   are not compared at all.
6. **Nothing recomputes `matches_existing_source_id`.** The Verifier does not
   cross-reference `data/sources.json`; that check lives at the Scout's report
   layer (`agent/scout/schedule/digest.mjs`) and was not extended here.
7. **The five unmapped legal statuses have no home in the site's vocabulary**,
   so a verification asserting `corrected` or `under_judicial_review` cannot yet
   be reconciled with any dataset record.
8. **No `ApprovalRequest` is emitted.** A verification is a Class C proposal and
   a human gate belongs in front of it; this session built the checking half of
   `AGENT-ROLES.md` §2 and not the gate.

## What the next session owns

- **Whether the five unmapped statuses belong in `data/taxonomy.json`.** That is
  a deliberate, reviewed data change under `docs/DATA-GOVERNANCE.md` — not
  something to retrofit from the agent layer.
- **Updating the verification protocol reference** for the sixth provenance word
  (`conflicting`). `.agents/skills/legal-source-verification/references/verification-protocol.md`
  documents five, and this agent emits six. The file was deliberately not edited
  from a session scoped to build an agent.
- **The human gate.** `ApprovalRequest` in front of anything that would act on a
  verification.
