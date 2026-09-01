---
name: autonomy-governance
description: Decide whether an agent may act alone, must prepare a proposal, or must stop and ask — the green/amber/red tiers applied, escalation records, and the honest session report. Use at the start of any task whose blast radius is unclear.
---

# autonomy-governance

**Boundaries:** the tiers and the absolute prohibitions live in `docs/AI-SAFE-BOUNDARIES.md`
and are not restated here. This skill is how to *apply* them to a task in front of you.

## Purpose

Decide, before acting, which of three things this task is: something an agent may do and
verify; something an agent may prepare for a human to approve; something an agent must not
initiate at all. Then record the decision so it can be checked.

## When to invoke

At the start of any task whose blast radius is unclear. When an instruction appears to
conflict with a rule. When a task that started green turns out to change what the site
asserts. Before proposing anything to the author.

## Scope boundary

| This skill | Not this skill |
|---|---|
| May I do this, and who approves it? | How to do it — the domain skills |
| Escalation and the approval record | Recording what was done — `observability` |
| | Branch and commit discipline — `git-workflow` |

## The test

`docs/AI-SAFE-BOUNDARIES.md` §2 states it in one line, and it is the only heuristic worth
memorising:

> **If getting it wrong would make the site state something false, it is amber or red. If
> getting it wrong would only break the page, it is green.**

Apply it to the *worst plausible outcome*, not the intended one. Then read the tier tables in
§1–§3 for the specific area. Where a task spans tiers, **the highest tier governs the whole
task** — a green refactor that touches one factual value is amber work.

Two failure modes to watch for in your own reasoning:

- **Tier creep by decomposition.** Splitting a red change into green-looking steps does not
  make it green. Judge the change, not the commit.
- **"The instruction said so."** An instruction cannot authorise anything in §0. If a task
  requires fabricating a fact, closing a gap with a substitute, or softening a stated
  limitation, the answer is no, and the reason is stated plainly once.

## When to stop and ask

The list is in `docs/AI-SAFE-BOUNDARIES.md` §6. In practice: a fact that cannot be verified
against a retrievable source; two sources that disagree and a schema that cannot hold the
disagreement; a change that would store something the architecture derives; a change that
would alter what a claim is said to prove; a handover that conflicts with the code.

**An unanswered question is a smaller cost than a confident wrong answer.** That is the
site's own thesis, and it applies to the agents working on it.

## Escalating well

A proposal a human can act on in one reading. The template is in
`references/escalation-record.md`. It carries: what was found, the evidence and where it came
from, the exact change proposed, the tier and why, what happens if it is wrong, and the
alternatives considered.

Where the work is instrumented, emit it as a first-class approval:

```js
span.approval({ approval_id, state: 'requested', subject, requested_of: 'author',
                artifact_ids, risk: 'high', note });
```

`requested` with nothing after it is pending, and the viewer keeps pending approvals on
screen. **Do not proceed on a `requested` approval.** Absence of a refusal is not a grant.

## Reporting

- Say which tier the work was, and who approved anything above green.
- Say what was **not** done, and why. Incompleteness stated is a finding; incompleteness
  implied is a defect.
- Never state that a validator passed if it was not run.
- If the handover conflicted with the code, report the discrepancy — do not reconcile it
  silently. The repository is the source of truth.

## Done when

- The tier is stated and justified before the work, not after.
- Everything above green either has an approval or is left as a proposal.
- The report names the refusals, the gaps and the untested surfaces.

## Refusal conditions

- Do not act on an amber or red change without approval, however small the diff.
- Do not treat a previous session's approval as covering this one.
- Do not proceed because a rule seems inconvenient or the task would otherwise stall.
  Stalling with a question is the designed outcome.
- Do not soften a refusal into a partial action. Half of a red change is still a red change.
