# The Regulatory Change Detector

**Status:** reference. Agent 3 — what it detects, how it classifies, and what it
refuses to say.
**Built:** SESSION 09, 2 September 2026.
**Code:** `agent/detector/`. **Contract:** `agent/schemas/contracts/regulatory-change.mjs`.
**Extended:** SESSION 10 — `docs/REGULATORY-IMPACT-MAPPING.md`, which is where the
impact map, the factual/editorial split and the dependency graph are documented.
This document stops at the detection; that one starts at it.
**Companions:** `docs/LEGAL-VERIFIER.md` (what produces its input),
`docs/VERIFICATION-INTEGRATION.md` (what happens to its output),
`.agents/skills/regulatory-change-detection/` (the skill it implements).

---

## 1. The naming conflict, stated first

**SESSION 09's brief says "Output: ChangeRecord". This agent does not output a
`ChangeRecord`, and the reason is not a preference.**

`ChangeRecord` already exists in this repository and means **a change actually
made to this repository**: a file list (`files`, minimum one entry), a
`diff_summary`, a `branch`, a `commit`, an `applied_at`, a `rollback_ref`. A
regulation entering into force changes no file, sits on no branch, and has no
commit. A `ChangeRecord` that could hold one would have to stop meaning what it
means, and every existing rule on it — *"state is applied but no qa_result_id"*,
*"branch is main and nothing records the explicit permission"* — would become
nonsense.

So SESSION 09 added **`RegulatoryChange`** as a sixteenth contract and flagged
the conflict rather than reconciling it silently. AGENTS.md requires exactly
that: *"If `docs/HANDOVER.md` conflicts with the code, stop and report the
discrepancy rather than reconciling it silently."*

**The two are now mutually un-confusable.** Each names the other's
distinguishing fields in its `forbidden` block with the reason, so an agent
reaching for the wrong one is told which it wanted:

| Reaching for | on `RegulatoryChange` | on `ChangeRecord` |
|---|---|---|
| `files`, `diff_summary`, `branch`, `commit`, `applied_at` | refused — "that is ChangeRecord's field" | the actual fields |
| `change_kind`, `materiality`, `old_value`, `new_value` | the actual fields | refused — "that is RegulatoryChange's field" |

A test asserts they share no field outside the envelope.

**The chain they sit in**, each arrow crossing a gate:

```
RegulatoryChange   the world moved                    ← this agent stops here
      ↓
DataProposal       what the corpus might do about it  ← agent/integrate/
      ↓
ApprovalRequest    a human decides
      ↓
ChangeRecord       a change made to this repository
```

**If "ChangeRecord" was meant literally, the rename is mechanical** — one
contract file, one registry line, one fixture, the tests that name it. What is
not mechanical is making one contract mean both things, and that is what this
document is flagging.

## 2. What it does

```
node agent/detector/cli.mjs --mock --dry               # the adversarial corpus, storing nothing
node agent/detector/cli.mjs --mock --as-of 2026-09-02
node agent/detector/cli.mjs --records <trace-id> --as-of YYYY-MM-DD
node --test agent/detector/selftest.mjs                # 38 tests, against the real data/
```

Inputs, as the brief names them:

| Input | What it actually is here |
|---|---|
| current canonical data | `data/*.json`, read through `agent/integrate/canonical.mjs` |
| Verification Records | what a document was read to say |
| previous source snapshots | **the checksum and the values an earlier verification recorded** — see §5 |

Output: one `RegulatoryChange` per detected divergence, or a `DataGap` where the
classifier has no word for it.

**Never edits production.** `data/` is read and never written; there is no write
path in the directory; the suite hashes every file in `data/` around a full run
and scans every module for a write call; and the contract forbids the fields
that would let a detection carry an edit.

## 3. Three comparisons, answering different questions

```
document vs. document        did the source itself move?
                             → unchanged source · metadata-only update
document vs. corpus          has the world moved past the record?
                             → dates · statuses · amendments · corrections
document vs. document,
  different sources          do two authorities disagree?
                             → NOT a change. Set aside by name.
```

**The third is the trap.** Two sources disagreeing looks exactly like a change
when only one of them is read, and reporting it as one would silently pick a
winner between two regulators. Verifications carrying a `conflict` verdict or a
populated `conflicting_evidence` array are set aside before anything is
compared, counted in the run record, and handed to the conflict path in
`agent/integrate/conflicts.mjs`.

## 4. Classification: a table and an ordered list

**A table for the six kinds that are a legal status arriving.** The status
vocabulary is closed — twelve values — so the transitions are enumerable, and
enumerating them means a reviewer can read every one this detector claims to
know. `TRANSITIONS[from][to]`, and nothing else. A cascade of conditions would
have reached the same answers while hiding which cases it had actually thought
about.

**An ordered list for the eight that are about the document or the record.**
Order is the order of harm, the same principle as `agent/verifier/judge.mjs`.
Filing a substantive change as `UPDATED` makes it invisible, so **`UPDATED` is
tested last**, after everything that could have been a real change has failed to
match. A test asserts it is last.

### The table has holes, and a hole is the answer

`classify` returns `{ kind: null }` for a transition it does not know, and the
`RegulatoryChange` contract requires a kind — so an unclassified transition
**cannot become one**. It becomes a `DataGap` naming the transition, with
`absence_kind: no_rule_matched`. Defaulting to the nearest kind would report a
state change the table's author never considered, in a corpus about what EU law
requires of people.

**A hole and a decision are reported apart.** `not_a_change: true` marks a pair
the table holds and deliberately does not treat as a movement — an `applicable`
act is not un-applied by a later document restating that it entered into force.
Those go to "not compared". Only the pairs nobody has decided become gaps.
Burying settled cases among the real holes is how the real holes stop being
read.

### Three things it refuses to call a change

- **A court being *seised* is not a court deciding.** `→ under_judicial_review`
  is deliberately absent from every row. There is no kind among the fourteen for
  "a challenge was lodged", and a reader told a court had ruled when it had only
  been asked would have been told something false.
- **A date that moved *earlier* is not `DELAYED`.** The word would be false. It
  is equally a change and equally material, and it comes out unclassified —
  which is where a change this vocabulary has no word for belongs.
- **A staged act is not compared against one of its stages.**
  `data/timeline.json` carries six `event:application` events for the AI Act.
  Comparing against one of them would be this detector choosing which stage a
  document meant, and that is a reading of the act. Reported as "not compared",
  never as silence.

### The defect the fixtures caught

**`status:partly-applicable` is a taxonomy term the agent layer cannot name.**
`LEGAL_STATUS_TAXONOMY` maps seven of the twelve agent-layer statuses onto
`data/taxonomy.json` terms; the reverse direction has holes of its own, and this
is one — and it is the state several of this corpus's most-read acts are
actually in.

The first version fell through to the table's `null` row and reported `NEW`,
which would have asserted that the corpus had said nothing about an act it says
a great deal about. `corpus_status_unmappable` is now a distinct input and the
case is unclassified with its own reason. **A status this vocabulary cannot name
is not "the corpus has no record".** SESSION 07 found the same gap from the
other direction — five agent statuses with no taxonomy term — and this is its
mirror.

## 5. What a "previous source snapshot" actually is

**Nothing in this repository stores a document's bytes.** The Scout fetches and
hashes; `agent/scout/digests/` holds previews and says so; `agent/records/`
holds contract records, and the gateway deliberately puts only a pointer into
the trace.

So a snapshot here is **the sha256 an earlier retrieval recorded, plus the
values that retrieval read**. That supports exactly two questions:

- *did the document change?* — the checksums differ
- *did what it says change?* — the values differ

and it does **not** support *what changed in it*, because there is no earlier
text to diff. Every record carries that limit in its `source_snapshot.note`
rather than leaving a reader of the report to assume a diff was possible. A
metadata-only finding also carries the open question that **a substantive change
inside a document whose stated values happen to match would look identical**.

**The absence is never agreement.** With no earlier checksum, `bytes_changed` is
`null`, not `false`. Nothing was compared, and an absence of comparison is not a
finding of no change — the contract has a rule refusing the combination.

## 6. Materiality — a judgement, and it states its method

Not a lookup on the change kind. The same kind is material at one attribute and
cosmetic at another: an `AMENDED` that moves an application date is something a
person schedules their compliance around; an `AMENDED` that renumbers a recital
is not. A table on the kind would have been a judgement disguised as a lookup,
and the contract types `materiality` as an inference precisely so it has to
state how it was reached.

| Level | What it means |
|---|---|
| `none` | neither the values nor the bytes moved |
| `metadata_only` | the bytes moved and nothing the corpus asserts did |
| `substantive` | a value moved; the site would afterwards state something different |
| `reader_acts_on_it` | the value is one a person changes their behaviour because of |

**The rule:** decided by *which attribute moved*, raised where the change
removes an obligation's basis or reverses a decision (`REPEALED`, `ANNULLED`,
`COURT_OUTCOME` reach the top whatever attribute carried them), and lowered only
where nothing the corpus asserts moved at all.

`READER_ACTS_ON` is short on purpose — eleven attributes, each with a statement
of what it answers. A list any longer stops meaning "a reader acts on it", and a
test asserts the length.

**Materiality is never lowered by uncertainty.** A change the detector is unsure
about is a change with a low *confidence*. Its materiality is what it would cost
if it is real, and multiplying the two into one number is how a high-harm,
low-certainty finding disappears into a middling score nobody acts on.

**Confidence** is a stated formula, like the Scout's and the Verifier's. The
ceiling is **0.85**: this detector compares printed values and status words; it
has not read either document the way a lawyer would.

**Autonomy** is derived from the harm and then *checked*:
`agent/schemas/validate.mjs` reads what the record actually touches and refuses
a class that is too low. Nothing this detector produces is `autonomous` — every
record kind it can be about is a legal-record kind, and a detection is a finding
about what the site tells a reader about EU law.

## 7. Affected pages, derived rather than listed

`docs/CURRENT-ARCHITECTURE.md` §5 carries a table of which page loads which
dataset, and says in its own header that it was *"read from the `loadAll` /
`load` call sites, not assumed"*. Copying that table into the detector would
create a second home for it — and it would go stale the first time a page loaded
one more dataset, silently.

So `agent/detector/surfaces.mjs` reads the same call sites: each page's
`<script src>` entry modules, their static imports followed transitively, and
every `loadAll([...])` and `load('…')` literal, including the one-hop constant
indirection `js/main.js` uses. **The suite parses §5's own table and asserts the
two agree**, so a drift is a test failure rather than a silent disagreement.
That is the only shape this repository permits a duplicate to take: one
generator, and a check that fails on divergence (`DATA-GOVERNANCE` §5).

**The chrome is counted apart, and that distinction is the whole value of the
field.** `js/boot.js` starts the command palette on every page, and the palette
pulls in `js/search.js`, which loads seven datasets. Walked naively, every page
"loads" almost everything and `affected_pages` degenerates into all seven pages
every time — true, and useless. So the walk stops at the chrome modules, and
what they reach is reported as a caveat: a stale value is *discoverable*
site-wide through search even where no view renders it, which is real and is not
the same as a page rendering it.

**`data/brief.json` is deliberately excluded.** Nothing fetches it at runtime;
`index.html` renders the brief from the inlined `window.__CONTENT__` blob, which
has already drifted (`CURRENT-ARCHITECTURE` §8). Claiming `index.html` renders
`brief.json` would be claiming the bypass is resolved. The exclusion comes back
as a caveat rather than being silent.

## 7a. What a change reaches — SESSION 10

`affected_pages` above answers "which pages render the changed value". It does not
answer what else in the corpus depends on it, which prose restates it, or what a
machine may do about any of it. SESSION 10 added that as a record of its own:
**`ImpactAssessment`**, one per confirmed change, produced in a `detector.impact`
span and exposed through observability.

- `agent/detector/graph.mjs` — the corpus dependency graph, 651 records and 3070
  references, every edge derived by testing whether a string a record holds **is**
  the id of another record.
- `agent/detector/fields.mjs` — which fields carry a fact and which carry an
  argument, exhaustive against the live data and failing the suite when it is not.
- `agent/detector/impact.mjs` — the nine surfaces, the factual/editorial split, and
  the governance gate.

**The full account is `docs/REGULATORY-IMPACT-MAPPING.md`.** Two things from it
belong here because they change how this agent's output is read:

- **The detection's `affected_datasets` and the assessment's `datasets_reached` are
  different questions.** The first is where the changed fact lives; the second is
  what depends on it, which is strictly wider.
- **An assessment is never lower than the detection's own autonomy class**, and an
  editorial finding anywhere in a run stops the whole run reporting as autonomous.

## 8. Tests

`node --test agent/detector/selftest.mjs` — **38 tests**, against the **real
`data/`**. The seven the session required:

| | Test | What it holds down |
|---|---|---|
| ▸ | unchanged source | one stated finding with its as-of date, no change record, and the run record says so — silence is indistinguishable from not having looked |
| ▸ | metadata-only update | `UPDATED` / `metadata_only`, with the open question that a substantive change inside the document would look identical |
| ▸ | substantive date change | `DELAYED`, `reader_acts_on_it`, `human_only`, corpus side read from `data/timeline.json` |
| ▸ | amendment | `AMENDED` via the table, with the transition named in the method |
| ▸ | correction | `CORRECTED`, never folded into `AMENDED` |
| ▸ | contradictory source | **no change, no gap** — set aside and counted |
| ▸ | court reversal | `ANNULLED`, not `COURT_OUTCOME`: the table takes the more specific and truer word |

Plus: a transition with no kind is a gap not a guess; an unmappable status is not
"no record"; a deliberate non-change is not a hole; a court being seised is not a
court deciding; a date that moved earlier is not `DELAYED`; a staged act is not
compared against one stage; the page map agrees with §5; nothing reads a clock;
`data/` is byte-identical after a full run.

**The fixtures' real ids and real values are read out of `data/` at load**, not
typed in. A fixture that typed an EU instrument's status or a timeline date by
hand would be a legal fact authored from model knowledge. If a record is
renamed, the fixtures fail loudly instead of quietly testing nothing.

**Both cross-checks were verified to bite** by deliberately breaking the derived
map two ways and confirming the suite failed each time.

## 9. Known limitations

1. **It has never seen a real `VerificationRecord`.** The Verifier has never read
   a real document — every registered endpoint is refused by this environment's
   egress policy. The *corpus* side of every comparison is real; the document
   side is a fixture.
2. **A checksum says that a document changed, never where.** No document bodies
   are stored, so a metadata-only finding cannot rule out a substantive change
   inside a document whose stated values happen to match. Carried as an open
   question on every such record.
3. **Only instruments and timeline events are compared.** The classifier has
   kinds for `ENFORCEMENT_UPDATED`, `RELATIONSHIP_CHANGED` and `SOURCE_REPLACED`,
   and the ordered rules that reach them are written and tested at the unit
   level — but the detector builds no candidates from `data/enforcement.json`,
   `instruments.relationships` or `data/sources.json`, because a
   `VerificationRecord` carries no attribute that maps onto them. Reaching those
   kinds needs an input this repository does not yet produce.
4. **`NEW` is reachable only in principle.** It needs a verification about an
   instrument `data/instruments.json` has no record of, and the Verifier attaches
   instrument entities by matching against that same file — so a real run cannot
   currently produce one. The kind, its rule and its contract behaviour are
   tested; the path to it is not exercised end to end.
5. **The transition table is a judgement.** A different table gives different
   kinds on the same corpus. It is in one place and every entry is readable,
   which is the most that can be said for it.
6. **Materiality's attribute list is hand-kept.** `READER_ACTS_ON` is eleven
   entries in one module; an attribute added to a dataset without being added
   there falls through to `substantive`. Nothing cross-checks it against the
   datasets' actual fields.
7. **The page map does not follow dynamic imports**, and treats the chrome as a
   fixed list of four module names.

## 10. What must not be changed

- **Do not add a write path to `agent/detector/`**, and do not add a bypass to
  the gate. The suite asserts exactly one call to the store.
- **Do not give `classify` a default.** An unrecognised transition is a gap. A
  fallback to the nearest kind would report a state change nobody established.
- **Do not move `UPDATED` earlier in the ordered rules.** It asserts that nothing
  substantive moved, so everything that could have been substantive runs first.
- **Do not add `→ under_judicial_review` to the table** as `COURT_OUTCOME`. A
  court being asked is not a court deciding.
- **Do not widen `DELAYED` to cover a date that moved earlier.** The word would
  be false, and the unclassified answer is the honest one.
- **Do not let `dayOrdinal` parse a month-precision date.** Ordering one against
  a day-precision date means widening one of them, and `date_precision` exists
  because that distinction is load-bearing.
- **Do not make materiality a lookup on `change_kind`.** It is a judgement about
  what a change costs somebody outside this repository, and it states its method.
- **Do not multiply materiality by confidence.** They answer different questions
  and one number would hide the high-harm, low-certainty findings.
- **Do not let the detector report a conflict as a change**, and do not let it
  rank two sources.
- **Do not hand-write the page map.** It is derived, and the suite fails if it
  and §5 disagree.
- **Do not let `bytes_changed` be `false` where there is nothing to compare.**
