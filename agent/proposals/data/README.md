# agent/proposals/data — Agent 5, the gap router

What each `KnowledgeGap` can honestly become — and, for most of them, why the answer is
"not a proposal, and here is who can".

The reference document is **`docs/GAP-PROPOSALS.md`**. This file is the directory's own map.

```
node agent/proposals/data/cli.mjs --as-of 2026-09-02                    # runs the depth agent inline
node agent/proposals/data/cli.mjs --as-of 2026-09-02 --gaps <trace-id>  # gaps a depth run stored
node agent/proposals/data/cli.mjs --as-of 2026-09-02 --dry              # nothing stored
node agent/proposals/data/cli.mjs --as-of 2026-09-02 --route verifier
node agent/proposals/data/cli.mjs --as-of 2026-09-02 --refusals         # names every gap it could not touch

node --test agent/proposals/data/selftest.mjs        # 47 tests, against the real data/
node agent/observability/cli.mjs proposals --refused # the routing, off the trace
```

`--as-of` is required. A proposal quotes a canonical record verbatim, and only a stated
as-of date says which version of that record it quoted (`docs/AUDIT-2026-09-01.md` F-15).

## The modules

| File | What it owns |
|---|---|
| `route.mjs` | The routing table, one row per gap kind with its reason, and the two one-way overrides. |
| `annotate.mjs` | The one edit this repository can author with an empty hand: a note, composed rather than written. |
| `taxonomy.mjs` | Establishing that the vocabulary really has no word for it, before proposing one. |
| `proposals.mjs` | The agent: the traced run that authors `DataProposal`s, `ApprovalRequest`s and `DataGap`s, and hands the rest on. |
| `cli.mjs` | The terminal report — proposals, handoffs and refusals, in that order. |
| `selftest.mjs` | The suite, run against the real `data/` and a real depth run's gaps. |

## The five things to know before changing anything here

**1 · It never writes and it never merges.** There is no write call in this directory,
`selftest.mjs` scans every module for one, and a full run hashes `data/` before and after.
Every proposal is emitted with an `ApprovalRequest` in the `requested` state, and pending is
never granted.

**2 · Most gaps cannot become a proposal, and that is the finding.** Closing a knowledge gap
means writing the value the corpus lacks; for eleven of the thirteen kinds that value is an
article number, a date, a competence, a fine or a status, read from a document — and nothing
in this repository has ever retrieved one. The run reports its refusals beside its proposals
at every level, because a run that authored fourteen proposals and said nothing about the
forty-three gaps it could not touch would have told its reader something false about its own
coverage.

**3 · The note is composed, not written.** `annotate.mjs#noteFor` is a pure function of ids
and counts read off the gap's own evidence, plus fixed English. The suite recomputes every
note a run emitted and asserts it is identical, so there is no path by which a sentence an
agent composed freely reaches a production page. `verification_note` is rendered by four
modules in `js/` — that is why this is amber and approval-gated rather than green.

**4 · A taxonomy term is proposed, never created.** The search through the dimension's
existing terms is mandatory, it can come back empty-handed (a suite test asks it about a
concept the dimension *does* carry), and `DataProposal` forces the class to `human_only`
whatever this agent claims. `data/taxonomy.json` is what every other dataset resolves
against.

**5 · A refusal is a deliverable and is passed on intact.** `docs/AGENT-ROLES.md` H6. The
editorial route authors nothing on purpose — an `EditorialProposal`'s operations would have
to carry the sentence, and the sentence is the argument.
