# Escalation record

One proposal, one record. Written so the author can decide without re-doing the research.

```markdown
## Proposal: <one line, the change itself>

**Tier:** amber | red — <the rule it falls under, from docs/AI-SAFE-BOUNDARIES.md>
**Records affected:** <IDs, and the files they live in>
**Blocked on:** author's decision | a source that could not be retrieved | a contradiction

### What was found
<The observation, with the file:line or record ID it came from.>

### The evidence
<Document, publisher, date, the URL actually loaded, the access date, the locator, and a
verbatim quote of the passage relied on. If nothing was retrieved, say so — that is the
finding, and the proposal is then to record a gap, not to make a change.>

### The change proposed
<Exact. The before and after value, or the diff. Not "update the status".>

### If this is wrong
<What a reader would be told, and what they might do about it. This is the field that decides
whether the proposal is worth the author's time.>

### Alternatives considered, and why not
<Including "record it as an open gap and change nothing", which is often correct.>

### What was NOT done
<Everything adjacent that this proposal deliberately leaves alone.>
```

## Rules for the record itself

- **One proposal per record.** A bundle of five changes gets approved or rejected as one, and
  that is how an unexamined change gets in.
- **Quote, do not summarise, the passage the change rests on.** A summary is a second home
  for the fact, and it is the copy that will be wrong.
- **State the tier before the change, not after.** Working out the tier retrospectively is how
  a red change comes to be described as a tidy-up.
- **"Change nothing" is a legitimate proposal** and should be offered whenever the honest
  answer is that the evidence has not been found.

## The three that always escalate

1. **A `claim_type` change.** Reclassifying an interpretation as a fact — or the reverse —
   changes what the site claims it can support. The highest-leverage field in the repository.
2. **Removing an asterisk, a `reference_gap`, a `requires_verification` flag or a
   `verification_note`.** These are the project's honesty; they are removed by verification
   work, and the author signs off on the verification.
3. **Anything touching the derivation rules** — `TIER_GRADE` in `js/format.js`, the stage
   rules in `js/pipeline.js`. They decide what the whole corpus is said to prove.
