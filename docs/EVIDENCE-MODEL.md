# THE EVIDENCE MODEL

**Written:** 27 September 2026. **Code:** `js/evidence-model.js` (the model),
`js/format.js` (grades), `js/regulatory-model.js` (dates by provision), `js/pipeline.js`
(enforcement procedure), `tools/evidence-audit.mjs` (the check). **Vocabularies:**
`data/taxonomy.json`.

This document explains how the site separates

```
WHAT A SOURCE SAYS          a claim of law, fact or attribution, with a direct source and a locator
WHAT THE DATA DERIVE        a derived claim: inputs, formula, rounding — re-run on every check
WHAT THE AUTHOR INFERS      interpretation, critique, forecast; prose marked synthesis / critique / recommendation
WHAT SOME ACTOR CLAIMS      an attributed claim: whose view, in which publication
WHAT REMAINS UNCERTAIN      evidence status unverified or disputed; a named reference gap; unknown finality
```

and how each of those is checked. Every number the model produces is **derived at the moment
it is read and never stored** (`docs/DATA-GOVERNANCE.md`); `tools/evidence-audit.mjs` fails a
dataset that stores one.

---

## 1. Two axes, not one

**Claim type** — what kind of proposition it is. **Evidence status** — what the recorded
sources establish. Kept apart so that "nobody has found the source yet" is never confused with
"not the kind of statement a source could settle".

| Type | Family | Owes verification | Meaning |
|---|---|---|---|
| `law` | law | yes | What a legal instrument provides. Primary evidence: the legal text or a court. |
| `fact` | fact | yes | What the evidence shows. |
| `derived` | derived | yes | A figure the site computes from other claims (§4). |
| `attributed` | attributed | yes | What a named actor states or argues — reported, not adopted. The evidence is the actor's own text, whatever its tier. |
| `interpretation` | argument | no | The author's reading. |
| `critique` | argument | no | The author's normative argument. |
| `forecast` | argument | no | What may happen. |

| Evidence status | When |
|---|---|
| `disputed` | the claim records that its sources disagree (`contested`) |
| `derived` | the claim is typed `derived` |
| `direct` | an external source states it |
| `partial` | external sources establish part of it, a narrower case, or its components |
| `context-only` | external sources only inform it |
| `unverified` | nothing but the brief itself |

The **grade** a reader sees (`js/format.js`) combines them: primary, official, secondary,
derived, attributed, interpretation, unresolved. A derived claim is graded *unresolved* if its
arithmetic does not re-run or any input is unresolved.

## 2. Every substantive passage is accounted for

`tools/evidence-audit.mjs` walks the brief (the Parts and Annexes of `index.html`): every
paragraph, list item, caption, box and table row with text. Each must carry one of:

| Attribute | Means |
|---|---|
| `data-claim="clm-…"` | the passage states these registered claims |
| `data-record="tl-… enf-… gdpr"` | the passage restates canonical timeline, enforcement or instrument records |
| `data-prose="prose:synthesis"` (or `critique`, `recommendation`, `signpost`, `method`) | the passage is not a sourced finding, and says what it is instead |

A passage may carry `data-claim` and `data-prose` together: the registered facts in it, and
the author's reasoning around them. An unclassified passage is an **error**. The page marks
synthesis, critique and recommendation with a ◇ so they are never read as sourced findings.

**Table rows that restate records are a checked second home.** A row linked with
`data-record` must print, in its date column, a date one of its records carries, and any fine
it prints must be a fine its enforcement record carries.

## 3. Atomic claims and locators

A statement carrying several propositions is split, so each has its own source and status.
The audit flags likely composites by heuristic — three or more figures, or two of: a long
statement, several clause breaks, several coordinated clauses — as `POSSIBLY_COMPOSITE_CLAIM`.
It is a warning, never an error: whether "A and B" is one proposition is an editorial call.

A **locator** is what lets someone else reach the evidence without reading the whole document.
Graded `structural` (article, recital, annex, paragraph, page, case, decision or document
number), `descriptive` (a quoted phrase or named figure), `generic` ("Part II") or `none`. A
claim of **law** citing the legal text as direct support without a structural locator is an
**error**; any other direct reference without a usable locator is a
`DIRECT_CLAIM_WITHOUT_LOCATOR` warning and a `missing-locator` remediation code.

## 4. Derived claims

```json
"derivation": {
  "performed_by": "site",
  "method": "The DPC's cumulative fine value divided by the cumulative total …",
  "inputs": {
    "a": { "claim": "clm-dpc-cumulative-fines", "value": 4040000000, "as_stated": "EUR 4.04 billion" },
    "b": { "claim": "clm-gdpr-total-fines",     "value": 7100000000, "as_stated": "EUR 7.1 billion" }
  },
  "formula": "a / b", "result": 0.569, "unit": "ratio",
  "rounding": { "to": 0.01, "stated_value": 0.57 }
}
```

Checked on every run: each input exists and owes verification; each `as_stated` appears in
that input's own statement and reads back to `value` (so the figure keeps one home in the
prose); the formula is arithmetic only — read by a small parser, never `eval` — and gives
`result` to its stated precision; rounding `result` to `to` gives `stated_value`.
`performed_by: "site"` is required for a `derived` claim: if a source states the figure, the
claim is a fact with that source. That is the difference between "the source says 56.9%" and
"the site calculates 56.9%".

## 5. Attribution, premises, disagreement

- `attributed_to` (required on `attributed` claims): whose view, and in which publication.
- `premises` (arguments only): the registered claims an inference is drawn from. The drawer
  lists them with their grades, so a reader tests the inference, not the author.
- `contested: { note, sources }`: two sources disagree about the proposition itself. The claim
  becomes `disputed` and the drawer says so.

## 6. The provenance graph

Every edge already lives in the records:

```
source ─[direct|partial|context, locator]→ claim ─[input]→ derived claim
                                               └─[premise]→ argument
passage ─[states]→ claim          passage ─[restates]→ timeline / enforcement / instrument
```

`node tools/evidence-audit.mjs --graph` prints it as nodes and edges. Nothing stores it.

## 7. The remediation taxonomy

"Unresolved" used to be one bucket. The audit now says why a claim that owes verification is
not yet as strong as it could be. **Mechanical** codes are computed and may never be stored;
**judged** ones may be recorded by a person in the claim's `remediation` field.

| Code | Kind | Meaning |
|---|---|---|
| `missing-primary-source` | mechanical | law without a direct tier-1 source; fact without a direct tier-1/2 source |
| `missing-locator` | mechanical | a direct reference whose locator is none or generic |
| `self-source-only` | mechanical | nothing but the brief supports it |
| `secondary-source-only` | mechanical | every external source is tier 3 or 4 |
| `secondary-reproduction-only` | mechanical | law supported only by an unofficial reproduction of the text |
| `derivation-undocumented` | mechanical | a derivation missing or not re-running |
| `possibly-composite` | mechanical | the heuristic in §3 |
| `outdated` | mechanical | past the review interval of its risk class (§8) |
| `reference-gap` | mechanical | a person recorded a missing reference (`reference_gap`) |
| `claim-too-broad`, `interpretation-as-fact`, `contested`, `low-value` | judged | recorded by a person |

The backlog is reported by `node tools/evidence-audit.mjs` and in every CI run's job summary.
It is closed by verification work against primary sources, never by editing the check.

## 8. Freshness by risk

| Risk | Review within | Records |
|---|---|---|
| critical | 14 days | a pending appeal or preliminary finding; a scheduled event within 60 days |
| high | 30 days | institutional status, transposition, open enforcement, unknown payment |
| medium | 90 days | general claims of fact and law |
| low | 365 days | historical events, the author's own arguments |

State from the record's own `last_verified`: **fresh** (within half the interval), **aging**
(within it), **review due** (within twice it), **stale** (beyond, or never verified). The
intervals live in `js/evidence-model.js` `RISK_TTL_DAYS` and nowhere else. `tools/freshness.mjs`
prints the critical and high records that are due as a work list; it does not count them as
staleness prompts (`docs/CONTENT-FRESHNESS-POLICY.md`).

## 9. Legal status and enforcement posture

- **Provisions** (`js/regulatory-model.js`): when an article applies is derived from the
  timeline — its own application date, later tranches, a transitional deadline, or the
  instrument's general date (said as such). An event inserted by an amending act carries
  `introduced_by`. Adoption and Official Journal publication are events too. A scalar status
  that contradicts the milestones ("applicable" with an application date still to come) is an
  **error**.
- **Enforcement** (`js/pipeline.js` `procedure()`): the procedural posture — investigation,
  preliminary finding, decision, commitments, appeal, judgment, annulled, remitted — and
  finality: final, not final, or unknown, which is never counted as either. A record whose axes
  cannot all be true (final while an appeal is pending or unknown; annulled yet paid; a fine on
  a preliminary finding) is an **error**.

## 10. What the audit does not do

It does not establish that a sentence is true. It establishes that each sentence is accounted
for, that each claim says what kind of claim it is and what carries it, that the arithmetic and
the dates agree with the records, and that the records do not contradict themselves.
`docs/VERIFICATION-POLICY.md` §3 still applies.
