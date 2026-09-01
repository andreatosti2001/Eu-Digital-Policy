# agent/scout — Agent 1: the Source Scout

Finds documents from official EU sources that bear on the instruments this
repository already tracks, and says what it found, what it could not reach, and
how sure it is. **Read-only.** It publishes nothing, changes no canonical fact,
writes no article, and cannot update an existing record — everything it emits is
a new immutable contract record.

```
node agent/scout/cli.mjs --mock        # the fixture corpus (default)
node agent/scout/cli.mjs --live        # the registered real endpoints
node agent/scout/cli.mjs --live --dry  # live, storing nothing
node --test agent/scout/selftest.mjs   # 30 tests, no network
```

Output goes to `agent/records/<trace_id>.jsonl` and the trace to
`agent/observability/runs/<trace_id>.jsonl`. Both are git-ignored. Nothing is
written to `data/`, and there is no code path that could.

**Live retrieval is currently refused by this environment's egress policy**
(HTTP 403 on CONNECT for all five registered endpoints). The Scout reports that
as `DataGap` records with `gap_kind: retrieval_blocked` and produces no
candidates. That is the correct behaviour, not a bug to work around.

The design, the four epistemic states, the authority hierarchy and the tier
reasoning are in **`docs/SOURCE-SCOUT.md`**. Read `docs/AGENT-CONTRACTS.md`
first.
