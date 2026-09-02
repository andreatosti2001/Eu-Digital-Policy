# agent/verifier — Agent 2: the Legal Verifier

Takes a `SourceCandidate`, opens the document it points at, breaks what it says
into discrete propositions, and for each material one records what the source
establishes — with the legal status, the three dates, the exact location, and
whatever the check did **not** settle. **Read-only.** It updates no canonical
data, promotes no candidate, and cannot verify a candidate it produced itself.

```
node agent/verifier/cli.mjs --mock              # the adversarial corpus (default)
node agent/verifier/cli.mjs --mock --dry        # mock, storing nothing
node agent/verifier/cli.mjs --records <trace>   # the candidates a Scout run produced
node --test agent/verifier/selftest.mjs         # 42 tests, no network
```

Output goes to `agent/records/<trace_id>.jsonl` and the trace to
`agent/observability/runs/<trace_id>.jsonl`. Both are git-ignored. Nothing is
written to `data/`, and there is no code path that could — the suite hashes the
whole directory around a full run and scans every module for a write call.

**Six verdicts, three outcomes.** `confirmed`, `partially_confirmed` and
`contradicted` resolve; `not_determinable` and `source_unavailable` are
**unresolved**; `conflict` is its own outcome. The last two are results, not
failures: an unresolved check and a conflict between two regulators are the
answers the evidence supports, and forcing either into a yes or a no is the
thing this agent exists not to do.

**The twelve legal statuses** — proposed, adopted, published, entered into
force, applicable, amended, corrected, repealed, annulled, under judicial
review, guidance, non-binding commentary. Seven map onto `data/taxonomy.json`'s
own `status` vocabulary; five have no term there and say so.

| Module | Job |
|---|---|
| `verifier.mjs` | the agent: intake, retrieval, per-proposition check, cross-document pass |
| `decompose.mjs` | source material → discrete propositions, with materiality stated as a rule |
| `statuses.mjs` | the twelve states, from signal phrases, with the phrase carried |
| `dates.mjs` | publication / entry into force / application, read and never computed |
| `locate.mjs` | article, paragraph, page — or the admission that nothing governs the passage |
| `judge.mjs` | the ordered verdict test, most damaging error checked first |
| `conflict.mjs` | disagreement between authorities, found and never resolved |
| `doctype.mjs` | the document's own self-description → a `source_type`, or null |
| `outcome.mjs` | outcome class, protocol word and confidence, all derived |
| `build.mjs` | the builder whose fields and epistemic block cannot drift apart |
| `fixtures.mjs` | the adversarial corpus: eleven cases where the plausible answer is wrong |

The design, the twelve statuses, the verdict ordering and the contract changes
this agent forced are in **`docs/LEGAL-VERIFIER.md`**. Read
`docs/AGENT-CONTRACTS.md` and `docs/VERIFICATION-POLICY.md` first.
