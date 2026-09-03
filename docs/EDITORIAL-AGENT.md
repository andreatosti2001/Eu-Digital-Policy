# The Editorial Agent

**Status:** built in SESSIONS 14 and 15, on top of Agent 3 (`docs/CHANGE-DETECTOR.md`) and the
impact map (`docs/REGULATORY-IMPACT-MAPPING.md`).
**Nothing in production changed.** `data/`, all seven pages, `js/`, `css/`, `i18n/` and `fonts/`
are byte-identical, and the whole of `tools/` is untouched.

```
node agent/proposals/editorial/cli.mjs --as-of 2026-09-03                       # the half that needs no input
node agent/proposals/editorial/cli.mjs --as-of 2026-09-03 --changes <trace-id>  # what a detector run stored
node agent/proposals/editorial/cli.mjs --as-of 2026-09-03 --mock                # the fixtures, through the detector
node agent/observability/cli.mjs editorial [--no-change]                        # the run, off the trace
node agent/observability/cli.mjs serve                                          # → the Editorial panel
```

---

## 1. What the two sessions asked for

> **SESSION 14.** Build the Editorial Agent. Study the site's existing editorial structure and
> voice. Preserve these distinctions: FACT = directly supported legal/institutional
> proposition · INTERPRETATION = reasoned understanding of implications · CRITIQUE =
> analytical judgment · UNRESOLVED = evidence insufficient or conflicting. The Editorial Agent
> may receive only verified inputs. Create three proposal types: factual update, analytical
> update, editorial recommendation. Factual updates may be drafted automatically; analytical
> updates and editorial recommendations require human review. Every material factual sentence
> must retain provenance. The agent must never fabricate citations. Draft into
> `agent/proposals/editorial/`. Do not directly modify production HTML.

> **SESSION 15.** Whenever a verified change affects an existing entity: search affected pages ·
> identify factual statements · identify statements dependent on changed facts · distinguish
> certain contradiction from possible staleness · propose factual correction where justified ·
> flag analytical passages for human review · preserve caveats and uncertainty · preserve the
> site's editorial structure. The system must never silently rewrite an analytical argument
> merely because a factual input changed. Produce: a factual correction proposal, an analytical
> review proposal, and a no-change explanation where appropriate. Add regression tests for all
> three cases.

Both are implemented against the real pages and the real corpus. The three cases are three
regression tests, each running the whole agent over the real `index.html`.

**It is Agent 7.** Scout, Verifier, Integrator, Detector, Data Depth, the gap router and the
Knowledge Architect came first. `docs/AGENT-ROLES.md` §6 has described the Editorial role
since SESSION 01 and nothing has filled it until now.

**No nineteenth contract.** `EditorialProposal` has existed since SESSION 03 and has never been
produced by anything. Its burden — the prose locations, the claims affected, both homes of the
string, a disposition for every locale key, and the red-tier `changes_what_a_claim_asserts`
flag — is exactly the burden a change to the brief carries. Three fields were added to it, and
§6 says why each one had to be a field rather than a convention.

## 2. Seven modules, and what each refuses

| Module | Does | Refuses |
|---|---|---|
| `prose.mjs` | Reads the site's prose as a structure: 387 authored blocks over seven pages and three homes | To invent an anchor, to index the prose, or to reconcile the two homes |
| `register.mjs` | FACT · INTERPRETATION · CRITIQUE · UNRESOLVED, for a **sentence** | To guess a state for a block that carries no claim record |
| `intake.mjs` | The gate: three admissible contracts, four named refusals | To act on a verdict that settled nothing |
| `staleness.mjs` | Certain contradiction vs possible staleness, and the triage table | To let the weaker claim stand in for the stronger |
| `drafts.mjs` | The one edit this agent may compose | Five cases where a substitution looked available and was not |
| `editorial.mjs` | Agent 7: the traced run | To mint a citation, or to write a sentence |
| `agent/schemas/contracts/editorial-proposal.mjs` | The seventh contract, with three new fields | To let anything but a factual update carry a drafted replacement |

## 3. The site already draws the four distinctions, in three places

This is why the agent can exist at all, and it is worth stating precisely, because the
temptation is to build a fourth home for something the site already knows.

| Where | What it says |
|---|---|
| `data/claims.json` `type` | law · fact · interpretation · critique · forecast, on 91 records |
| `js/format.js` | `familyOf()` groups the last three as `argument`; `evidenceGrade()` answers `unresolved` where no external source directly carries the claim |
| the markup | `data-tone="crit"` and a `<span class="box-label">CRITIQUE</span>` on the brief's own critique boxes — the author saying, in their own hand, which of the four a passage is |
| `data-claim` | the provenance link between a sentence and its claim record. **59 of them** across `index.html` |

**`familyOf` and `evidenceGrade` are imported from `js/format.js`, never reimplemented.** The
grading rules are red tier (`docs/AI-SAFE-BOUNDARIES.md` §3) and a second implementation in the
agent layer would be exactly the copy that drifts. The precedent is
`agent/integrate/unsupported.mjs`, which imports the same two for the same reason; the suite
asserts that no module in `agent/proposals/editorial/` so much as names `TIER_GRADE`.

### What is new: the subject is a SENTENCE

A claim record describes a **proposition**. No record in `data/` describes a **block of prose**.
That is why `editorial_state` is not a second home for `claims.json`'s `type`, and it is why
there are five words rather than four:

| state | what it means |
|---|---|
| `fact` | a directly supported legal or institutional proposition |
| `interpretation` | a reasoned understanding of implications |
| `critique` | an analytical judgement |
| `unresolved` | evidence insufficient or conflicting |
| `not_attributed` | **the block carries no claim record**, so which of the four it is cannot be derived — and guessing would be an absence of knowledge presented as a finding (§0.5) |

Measured on the real site, as at 3 September 2026:

```
387 authored blocks   markup 324 · __CONTENT__ blob 34 · data/brief.json 29
fact 18 · interpretation 9 · critique 24 · unresolved 19 · not_attributed 317
59 blocks carry a claim record.  328 carry none.
```

**317 unattributed blocks is not a defect of the site.** Most sentences on any page are not
consequential statements. What matters is that the agent says so rather than assigning one of
the four to them, and that a `factual_update` over one is refused by the contract.

### Two rules where the three sources meet

**The weakest governs.** A block carrying one established fact and one argument is not an
established fact, and rendering it as one is how an argument comes to read as law. Same
direction `agent/detector/impact.mjs` fails in: when in doubt, the higher class.

**The author's own label governs where the data agrees with it.** A box marked CRITIQUE holding
argument-family claims is a critique, whichever of the two argument types those claims carry —
the label is about the *passage*, the claim type about a proposition inside it. Where **no**
attached claim is in a family the label is consistent with, nothing is overridden and the
disagreement is reported. Two on the real corpus:

| block | markup says | the claims say |
|---|---|---|
| `index.html` `part-2.div2` | CRITIQUE | `clm-cjeu-pseudonymised-data`, typed `claim-type:law` |
| `index.html` `part-3.div1` | CRITIQUE | `clm-x-data-access-staffing`, typed law/fact and graded Unresolved |

Nothing in this repository checks for that today, and reclassifying a claim is red tier — so
both are reported as recommendations that draft nothing.

## 4. Only verified inputs, and what each one buys

Three contracts are admissible, and **what each entitles the agent to do differs**. That
distinction is the honest core of the whole agent.

| input | may compose a correction | why |
|---|---|---|
| `RegulatoryChange` | **yes** | It carries both sides of the move — what the corpus asserts and what the document states — so a substitution is well defined and checkable |
| `ImpactAssessment` | no | It names what a change reaches and carries no values. It bounds the search; a correction from it would have nothing to substitute |
| `VerificationRecord` | no | A `contradicted` verdict establishes that the corpus is wrong and **not what is right**. Composing a replacement from it would author the legal fact the check did not carry |

Four refusals, each a deliverable (`docs/AGENT-ROLES.md` H6):

- **Not one of the three.** A `DataProposal` is somebody's suggestion, and prose on a production
  site about EU law is not changed on a suggestion.
- **Rejected by the contract gateway.** `receive()` is called on every record, including ones
  this process believes it produced itself: "I wrote it" is not a property the receiver can
  check.
- **A verdict that settled nothing.** `not_determinable` is an absence of knowledge;
  `source_unavailable` means nothing was read; **`conflict` is two authoritative sources
  disagreeing**, and `docs/AGENT-ROLES.md` H7 is that contradictions stop the chain and go to a
  human. Editing prose there would be an agent picking a winner between two regulators.
- **Materiality `none`.** Nothing moved that a reader could act on.

## 5. Contradiction, staleness, and no change

> **"This paragraph might be wrong" and "this paragraph says 25 May 2018" are different claims,
> and nothing here lets the second stand in for the first.**
> — `docs/REGULATORY-IMPACT-MAPPING.md` §5, on prose inside `data/`

The same rule, applied to the sentences a reader reads. How a sentence comes to depend on a
record, in decreasing strength, **every one of them derived rather than declared**:

| # | mechanism | verdict |
|---|---|---|
| 1 | the sentence contains the value that moved | `contradicted` — and the sentence is quoted |
| 2 | a claim attached to the block references the changed record | `possibly_stale` |
| 3 | the sentence names the record, under a name a string match can distinguish, and the block carries no claim of its own | `possibly_stale` |

**The reading rules have one home and it is not this agent.** `proseMentions`, `datesIn`,
`monthNames` and `labelAmbiguity` are imported from `agent/detector/impact.mjs`. SESSION 10
worked out how a value can appear in a sentence — any rendering of the same calendar day, a
taxonomy term's *label* rather than its id, a literal on a token boundary — and a second reader
here would disagree with the first on some sentence nobody has looked at yet.

**The third mechanism is the dangerous one, and it is tested.** `status:applicable` is labelled
"Applicable", and searching prose for that word finds sentences about a different act in which
the word is doing ordinary work. The same test `labelAmbiguity` applies to taxonomy labels is
applied to a record's own names, against the site's own prose: *does this name appear,
whole-word, in blocks whose claims are about other records?* If it does, a match establishes
that the word is there and nothing about which record it is about — and the mention becomes an
**open question with its sentence attached**, never a finding.

### The triage table

One row per case, so a reviewer can read every case the agent claims to know about and a
combination it does not know about is a blank rather than a fall-through. It **throws at module
load** if any row ever routes an argument to a correction.

| the sentence is | the value is | outcome |
|---|---|---|
| FACT | in the sentence | **factual correction proposal** — drafted as a substitution |
| FACT | not in the sentence | **no-change explanation** |
| INTERPRETATION | in the sentence | **analytical review proposal** — quoted, never drafted |
| INTERPRETATION | not in the sentence | **analytical review proposal** |
| CRITIQUE | either | **analytical review proposal** |
| UNRESOLVED | in the sentence | **editorial recommendation** — there is nothing to correct it *to* with any authority |
| UNRESOLVED | not in the sentence | **no-change explanation** — what it needs is verification, which is the Verifier's |
| NOT ATTRIBUTED | in the sentence | **editorial recommendation** — two findings at once, and correcting the value silently would fix the smaller and hide the larger |
| NOT ATTRIBUTED | not in the sentence | **no-change explanation** |

**Why FACT × not-in-the-sentence is *no change* rather than a review item.** This site derives
at render time: the evidence markers, the status strips, the compliance calendar and the
pipeline stages are computed whenever a page is opened. A statement of fact *about* the changed
record that does not *state* the value that moved needs no prose edit, because correcting the
record corrects everything the reader sees there. SESSION 10 made the same point about the
factual half of its impact map — 225 of 260 impacts needed no edit anywhere — and saying so is
worth more than a list of files, because the alternative is a reviewer hand-checking paragraphs
that cannot be wrong.

## 6. What "drafted automatically" is allowed to mean

The whole weight of SESSION 14 sits here.

**It means substitution, and nothing else.** `substitute()` takes the sentence that is already
there, replaces the **one** occurrence of the value a verification read from a document with
the value the same verification read from the same document, and changes not one other byte:

```
current.split(matched).join(replacement) === proposed     and matched occurs exactly once
```

The guarantee is arithmetic rather than editorial, and the suite asserts it over every draft a
full run produces. No sentence is generated, no wording improved, no clause moved. It is
`agent/proposals/data/annotate.mjs`'s discipline — *"the note is composed, not written"* —
applied to a sentence a reader reads.

Five refusals, each a case where a substitution looked available and was not:

1. **Zero occurrences in the markup.** The value reads correctly in the plain text and is broken
   across inline tags — `25 <b>May</b> 2018`, a glossary span, a link. An edit computed on
   plain text would destroy the markup around it.
2. **More than one occurrence.** Which one moved is a reading, and two substitutions where one
   was meant is a silent second edit.
3. **The attributes would move.** `data-claim` is the sentence's link to its claim record and
   `data-i18n` is the key three locale editions translate. The check is a set comparison of
   every load-bearing attribute before and after, not a promise.
4. **A caveat would be lost.** The hedging vocabulary is read off the brief's own house register
   (`.agents/skills/legal-editorial/references/house-register.md`). It is used only to **refuse**:
   it never adds a hedge and never decides what a sentence means.
5. **The new value is not a value.** `null` and `"unknown"` are states, and putting either into
   a sentence prints an internal sentinel in front of a reader.

**A refused substitution does not vanish.** It becomes an `editorial_recommendation` naming the
reason, so a finding is never lost to a mechanism that could not act on it.

### The three fields added to `EditorialProposal`, and why each had to be a field

| field | why not a convention |
|---|---|
| `proposal_kind` | Without it, "only a factual update may be drafted" lives in an agent's head and no rule can be written against it |
| `editorial_state` | It is a statement about a **sentence**, and no record in `data/` describes one. It is what makes "an argument is never corrected" checkable rather than trusted |
| `staleness` | Contradiction and possible staleness are different claims; the rules refuse to let the weaker one produce an edit, and a `contradicted` finding that cannot quote what it is correcting is refused outright |

Seven rules follow from them, and together they say: nothing but a factual update carries a
drafted replacement · an analytical update and a recommendation are `human_only` · a factual
update may not sit over an argument, over unresolved evidence or over unattributed prose · it
must name the claim record the sentence hangs on · it must quote what it corrects · and a
`possibly_stale` finding may never carry a replacement.

## 7. Every material factual sentence retains its provenance

Three mechanisms, none of them a promise:

- A `factual_update` whose `claim_ids_affected` is empty is **refused by the contract**. The
  sentence and its claim record are two views of one assertion, and a correction that cannot
  name the record has orphaned it.
- A `factual_update` over prose whose state is `not_attributed` is **refused by the contract**.
  A sentence with no claim record is reported as a recommendation naming the missing
  attribution — the finding is two things at once, and fixing the visible half would hide the
  larger one.
- The substitution operates on the element's **content**, never its attributes, and the
  attribute fingerprint is compared before and after. `data-claim` cannot move.

## 8. Exposed through observability

The reasoning is the deliverable. On the trace:

| record | carries |
|---|---|
| span `editorial.intake` | what was admitted, what was refused, and an observation per refusal with its reason |
| span `editorial.prose` | how much prose was read, in how many homes, and how much of it carries provenance at all |
| span `editorial.site` | the findings that need no verified input |
| span `editorial.change.*` | one per change: what it reached, at what strength, and what became of each block |
| `decision` | the triage, with the four alternatives it did not take |
| `observation` per no-change | the sentence, and the value it does not contain |
| `observation` per open question | a sentence containing the word, and a reading this agent does not make |
| `artifact` | every `EditorialProposal`, `ApprovalRequest` and `AgentObservation`, as a pointer |
| a census, and `NOTHING APPLIED` | with `sentences_authored: 0` — the number that matters most on this agent |

`editorialState()` in `agent/observability/query.mjs` derives the view at read time and stores
nothing twice. Reachable three ways:

```
node agent/observability/cli.mjs editorial [--trace t] [--no-change]
GET /api/editorial?trace=
the Editorial panel in the viewer, plus two overview tiles
```

**The two tiles are deliberate.** *Prose corrections drafted* is the only number that counts
text a machine put on a page; *prose examined, no change* sits beside it because a tile showing
only what an agent wanted changed would report "examined and clear" as "not looked at".

**The view reports gaps rather than filling them.** A run that drafted a replacement over an
analytical passage, proposed without an approval, refused an input without saying why, or
claims to have authored a sentence is a gap in the view, not a silence.

## 9. What it found with no input at all

Three finding classes need no verified change, because they are about the site disagreeing with
itself. All three are `editorial_recommendation`s: nothing drafted, every one `human_only`,
each behind a pending approval.

1. **`meta.standfirst` differs between its two homes** — the inline `__CONTENT__` blob (what the
   reader's contents overlay and search index actually read) and `data/brief.json` (canonical,
   and fetched by nothing). Reported, **never reconciled**: the drift is the author's decision
   and `docs/HANDOVER.md` says so. This is the *editorial* half of the divergence;
   `agent/architect/` raised the *shape* half in SESSION 13 and the two proposals say so about
   each other.
2. **Two CRITIQUE boxes whose every claim is typed law or fact** (§3).
3. **Nineteen sentences that read as settled over claims graded Unresolved.** The
   `legal-editorial` skill's one rule that outranks style: *confidence in the prose must match
   the grade of the claim behind it*. This agent adds no hedge and proposes no wording — the two
   available fixes are verification (the Verifier's) and rewording (the author's), and it says
   so. The finding is marked `contested: true`, because a sentence can be appropriately
   confident with none of the register's markers in it: it is a prompt to look, not a verdict on
   the writing.

And one result that is a result: **every `data-claim` attribution in the markup resolves to a
record in `data/claims.json`.** Zero dangling. Recorded as *looked and found nothing*.

## 10. Known limitations

1. **No agent here has read a real document.** Unchanged since SESSION 05, and it bounds this
   agent more tightly than most: the value a correction substitutes IN is only ever as good as
   the verification that carried it, and every approval says so in its own words.
2. **A paraphrase of a value is invisible.** A sentence that says "the following summer" about a
   date that moved states nothing a string match can find. Every no-change explanation carries
   that as an open question rather than implying coverage — it says the value is **not present**,
   never that the sentence is unaffected.
3. **The word threshold is stated, not tuned.** Six words is where a table cell stops being a
   label. A block below the line is not thereby proved to assert nothing.
4. **The caveat list is a judgement**, in one place, with a reason. It is used only to refuse a
   substitution, never to decide what a sentence means, and it can miss a hedge phrased in a way
   the house register does not name.
5. **The `not_attributed` state is a floor, not a verdict.** 317 blocks carry no claim record.
   The agent says which of the four it cannot derive; it does not say the sentence is
   unimportant.
6. **The tag scanner is a scanner, not a parser.** It handles the markup this repository
   controls and `tools/design-qa.mjs` already checks, and it reports every close tag it could
   not match. That count is zero today; a change to the markup that made it non-zero would be a
   finding, not noise.
7. **The locale overlays are declared, never edited.** Every affected key gets a disposition;
   applying it is a human's, and `tools/i18n-audit.mjs` is what proves it was done.
8. **A `factual_update` never fired on the detector's own fixtures.** The corpus and the
   adversarial fixtures do not happen to produce a fact-state sentence quoting a moved value;
   the path is exercised against the **real** `index.html` by the suite's first regression test,
   over a real timeline event and a real sentence. That the fixtures do not reach it is recorded
   rather than papered over.

## 11. Where this sits

```
scout → verifier → integrate → a proposal in front of a human
                 → detector  → a change in front of a human
                             → impact map → what it reaches inside the site
                                          → EDITORIAL → the sentence that states it   (corrected, once)
                                                      → the argument that rests on it (flagged, never written)
                                                      → the sentence that needs nothing (said so)
```

**Autonomy class.** A `factual_update` is `review_required` and everything else is `human_only`.
Nothing this agent produces is ever `autonomous`, and the contract refuses one that claims to
be: a change to the brief's prose is Class C under `docs/AUTONOMY-POLICY.md` — pull request and
human approval — and `GOVERNANCE_PERMITS` is still empty.

**The boundary with the Data Depth Agent and the Knowledge Architect.** Agent 4 finds records
the corpus lacks; Agent 6 finds shapes it lacks; this one finds **sentences that have stopped
being true**. A finding about a claim record's own `verification_note` is
`agent/integrate/`'s; a finding about a missing glossary definition is `agent/depth/`'s, routed
`editorial` and still not authored by anything, because writing a definition is the author's
work and this agent writes no sentence either.
