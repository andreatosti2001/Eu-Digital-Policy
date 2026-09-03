# `agent/implement/` — Agent 9, Implementation and QA

SESSION 18. The only specialist that may write to the repository — and the one that refuses
most often.

```
node agent/implement/cli.mjs queue [--all] [--why]
node agent/implement/cli.mjs preflight --proposal <id>
node agent/implement/cli.mjs boundary
node agent/implement/cli.mjs check --as-of YYYY-MM-DD
node agent/implement/cli.mjs decide --proposal <id> --grant|--deny --by "<person>"
node agent/implement/cli.mjs run --as-of YYYY-MM-DD [--apply]
node agent/observability/cli.mjs implement [--refusals]
node --test agent/implement/selftest.mjs
```

**The default writes nothing.** `run` rehearses; `--apply` is the only thing that writes, and
it still refuses everything that is not approved.

**A grant lives in `decisions/decisions.jsonl` and nowhere else.** An `ApprovalRequest` in
`agent/records/` is a request, whatever its `state` says — agents write that directory. Each
decision binds the sha256 of the proposal it decided, so editing the proposal afterwards
voids the approval rather than carrying it onto a scope nobody agreed to.

| File | What it owns |
|---|---|
| `baseline.mjs` | the recorded baseline, parsed out of `docs/CURRENT-ARCHITECTURE.md` §12 |
| `ledger.mjs` | where an approval lives, and the forgeries it refuses |
| `preflight.mjs` | the ten gates |
| `scope.mjs` | the permitted set, derived; enforced against git afterwards |
| `boundary.mjs` | public website / private control plane |
| `checks.mjs` | validators, suites, contracts, browser QA, boundary → `QAResult` |
| `apply.mjs` | the change context, the exact edit, and the verified way back |
| `implementer.mjs` | the agent |
| `selftest.mjs` | 54 tests, including SESSION 18's eight required proofs (`R1`–`R8`) |

Full documentation: **`docs/IMPLEMENTATION-QA.md`**.
