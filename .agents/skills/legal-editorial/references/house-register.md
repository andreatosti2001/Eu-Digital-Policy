# The house register

This file has two parts, and they do different jobs.

- **Part A, the editorial standard**, is the author's statement of how the brief should read.
  It was set on 6 October 2026 and it is prescriptive.
- **Part B, the observed register**, describes how the brief already writes. It is
  descriptive, and it is where the hedging vocabulary lives that
  `agent/proposals/editorial/` uses to refuse an edit.

Neither part outranks the rule in `../SKILL.md`: **confidence in the prose must match the grade
of the claim behind it.** Part A asks for editorial confidence. It never asks for more
confidence than the evidence carries.

**Who may apply Part A to existing prose.** All new prose is written to it. Existing prose in
`index.html` is rewritten to it only when the author asks, for one section or for the whole
brief, under the procedure in `../SKILL.md`. A style edit that changes no fact can still orphan
a claim record, drop a hedge or leave three locale editions translating the old sentence. That
is why the standard does not, by itself, licence an agent to rewrite the brief.

**The first full pass** was made on the author's instruction on 6 October 2026: all fourteen
sections, 111 English strings, each retranslated into Italian, French and Spanish, one commit
per section on `claude/editorial-standard`.

---

## Part A. The editorial standard (author, 6 October 2026)

The brief should read as serious European policy analysis written by a strong human editor.
The target sits between Bruegel, the *Financial Times*, *The Economist* and good institutional
policy analysis: rigorous, clear, contemporary and confident, without sounding academic for
its own sake and without copying any of those voices.

### A1. Order of priorities

Precision, then clarity, then argument, then style. Never trade readability for a sentence
that sounds sophisticated.

A reader should come away knowing what happened, what the rule or instrument actually does,
why it matters, and what tension or consequence follows. A sentence that tries to carry all
four usually reads better as two or three.

### A2. The voice

Analytical rather than bureaucratic. Confident without arrogance. Critical, and led by
evidence. Ambitious in its ideas and accessible in its language. Concise without being
simplistic. The author sounds like someone who knows the regulatory system well and is
explaining it to an intelligent reader, not someone demonstrating how much they know.

### A3. Constructions to ration

Each of these can work once. Repetition is what makes prose read as generated.

- "not X, but Y" and its variants
- "the real problem is…"
- "this is not merely…"
- "what this means is…"
- "the question is no longer whether…, but whether…"
- "at its core…"
- "far from being…"
- "the mechanism is working as designed" as a recurring conclusion
- em dashes in quantity (see the measurement below)
- three-part rhetorical lists, used as a habit
- stacked abstract nouns
- a dramatic contrast where a direct statement would be stronger

**Measured on 6 October 2026**, over the fourteen `section.part` blocks of `index.html`:

| | Before the pass | After the pass |
|---|---|---|
| Words | 12,437 | 12,356 |
| Sentences (approx.) | 444 | 521 |
| Em dashes | 202 | 38 |
| Sentences with two or more em dashes | 42 | 3 |
| Sentences with "not … but" | 7 | 3 |
| Sentences with ", not " | 18 | 14 |

Most of the 38 remaining em dashes are list bullets after a line break, which the markup uses
as its list marker. The other listed phrases were close to absent before and remain so.
Re-measure before claiming any further movement.

### A4. Concrete sentences over impressive ones

Prefer:

> The DSA gives the Commission stronger supervisory powers over the largest platforms. The
> difficulty is not the existence of those powers, but the administrative capacity required
> to use them consistently.

over:

> The DSA is not simply a new layer of platform regulation; it represents a fundamental shift
> in the architecture of European digital governance, where enforcement capacity becomes the
> decisive variable.

The second sounds weightier. The first says more.

### A5. Fact, then interpretation, then implication

Interpretation is wanted; the brief should not flatten into neutral description. Keep the
three steps visible:

> The regulation introduces X. In practice, this shifts responsibility toward Y. The result
> is Z.

Do not load a factual claim, a reading and a judgement into one sentence. This is also what
keeps the prose aligned with `data/claims.json`, where a fact and an interpretation are
different claim types with different grades. A sentence that fuses them is hard to grade
honestly.

A critical argument is stated and supported. Rhetoric does not stand in for the support.

### A6. Metaphor, used where it explains

A metaphor earns its place when it clarifies an institutional or legal relationship.

> The GDPR became the gravitational centre of Europe's digital regulatory framework.

When "gravity", "architecture", "ecosystem", "engine", "layer", "frontier", "fault line" and
their relatives start recurring, replace some of them with plain words. The prose should not
sound as if it is hunting for a clever formulation.

### A7. Sentence rhythm

Mix short declarative sentences for the points that matter, medium analytical sentences, and
long ones only where a relationship genuinely needs the length. A paragraph of identical
sentence shapes reads as machine-made.

### A8. Section openings

The first sentences of a section tell the reader what analytical question it answers. No
atmosphere before the point.

> The AI Act is often described as a risk-based framework. That description is correct, but
> incomplete. Its practical significance lies in how risk categories interact with
> enforcement, technical standards and implementation capacity.

### A9. Titles

Informative first, evocative second. Some personality is welcome; the title still has to say
what the section is about.

> AI Act: the risk-based model and its implementation problem

A Part title has **two homes**, the markup and `data/brief.json` `parts[]`, plus three locale
editions. Changing one is a change in all of them (`../SKILL.md`, "The three homes").

### A10. Criticism

The brief keeps a clear analytical voice and does not drop criticism to look neutral. The
criticism comes from documented design choices, evidence, institutional outcomes,
implementation problems, measurable consequences, or a named scholarly or policy argument.

Replace loaded adjectives ("absurd", "pathological", "chaotic", "deeply flawed") with an
account of what the mechanism does and why that creates a problem. Let the reader reach the
conclusion. In the hedging table in Part B, this is the *Interpretation / critique* row: the
author's reading, marked as the author's.

### A11. Academicism

No thesis prose unless the subject demands it: no long theoretical sentences, heavy
nominalisation, obscure terms where a plain one exists, citations as decoration, or phrases
whose job is to sound scholarly. Keep technical and legal terms wherever they carry a precise
meaning. A term an instrument defines keeps the instrument's exact form, however plain a
substitute would read.

### A12. Density

Do not popularise. The reader is intelligent and reasonably informed about European politics,
economics, technology or regulation. The aim is high information density with high
readability, not high density with high linguistic complexity.

### A13. The test

Before accepting a paragraph: would a very good policy analyst who had spent years on this
subject write it this way? If it sounds too polished, too repetitive, too rhetorical or too
formulaic, rewrite it.

**In one line:** sharp without being theatrical, critical without being polemical,
sophisticated without being obscure, authoritative without announcing it.

---

## Part B. The observed register

Observed from the brief's own prose. This describes how the site already writes; it is not a
licence to rewrite anything into it.

### What the register does

**States the mechanism, then its limit, in the same breath.**

> The EU has no general competence to legislate on speech, safety or morality. What it has is
> Article 114 TFEU, the power to harmonise national rules that fragment the internal market.

**Names the consequence rather than gesturing at one.**

> The consequence is a persistent mismatch between the stated legal purpose (removing
> barriers to trade) and the actual regulatory ambition … That mismatch is the raw material
> for most litigation risk in the system.

**Distinguishes what happened from what was announced.** The whole enforcement section turns
on this distinction; "imposed" never implies "collected", in the prose any more than in
`enforcement.json`.

**Attributes an argument to whoever made it**, by name, and marks the author's own reading as
the author's.

### Conventions

- Em dashes set off a clarifying clause, and sparingly: A3 rations them. Where a comma,
  a colon, brackets or a full stop does the job, use it. En dashes for ranges.
- Instrument short names on first use in a part, then the abbreviation.
- Figures as printed in the source. An amount the source gives in millions does not become a
  decimal fraction of a billion.
- Dates spelled out in prose (17 October 2024), ISO in data.
- No exclamation marks, no rhetorical questions, no second-person instruction to the reader.
- No "simply", "just", "obviously", "of course". Each one asserts that a proposition needs
  no support.
- British spelling.

### Hedging, calibrated to the grade

| Claim grade | Prose that fits | Prose that does not |
|---|---|---|
| Primary / official | "Article 5(2) requires…" | "Article 5(2) appears to require…" |
| Secondary | "Analysis of the tracker corpus puts the figure at…" | "The figure is…" |
| Interpretation / critique | "This brief reads that as…", "The author argues…" | "In fact…", "Clearly…" |
| Unresolved | Say what is unestablished, or carry the asterisk | Any confident assertion |

A hedge is not a substitute for verification, and removing one is not an improvement in
style. Part A's call for confidence does not change this table. Where the prose is more
confident than the evidence, the entry point is `legal-source-verification`, not the
thesaurus.

### Error and empty states

The same discipline applies to interface text. `js/data.js:renderError` shows a clear failure
and **does not fabricate fallback data**; an empty result says which question returned
nothing. "Not determined" is the required wording where no applicability rule fired. Never
"probably not", and never a blank.
