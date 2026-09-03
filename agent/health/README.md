# `agent/health/` — Agent 10, the Website Health Monitor

SESSION 20. Three domains, measured separately and **never summed**.

```
node agent/health/cli.mjs --as-of YYYY-MM-DD
node agent/health/cli.mjs --as-of YYYY-MM-DD --detail
node agent/health/cli.mjs --metrics                     # the register, runs nothing
node agent/health/cli.mjs --as-of YYYY-MM-DD --public   # the public-safe subset
node agent/health/cli.mjs --as-of YYYY-MM-DD --publish out.json
node agent/health/cli.mjs --as-of YYYY-MM-DD --history
node agent/health/cli.mjs --as-of YYYY-MM-DD --series knowledge.evidence_coverage
node agent/observability/cli.mjs health [--readings]
node --test agent/health/selftest.mjs
```

**There is no overall score.** `model.mjs overallScore()` throws, with the reasoning, at the
place somebody would reach for one. A broken link costs a reader a click; a false statement
about EU law costs them a decision they cannot take back; an unaudited approval costs the
system its provenance and is invisible to every reader. A mean says none of that.

**`unmeasurable` is never zero.** Nine of the forty-four metrics cannot be measured in some
runs and two cannot be measured at all — deployment failures (no telemetry, and the network
policy refuses the live origin) and authentication failures (there is no authentication).
Each says why and what would be needed.

**Five metrics are `not_a_score`.** The unverified count, the provenance gaps, the blocking
open questions, the rejected proposals and the verification gaps. Every cheap route down is a
prohibited action; the only legitimate one is work this monitor cannot see. `model.mjs`
refuses to let any of them be re-labelled.

| File | What it owns |
|---|---|
| `model.mjs` | the metric contract, the three states, `direction`, and the refusal to score |
| `gather.mjs` | the evidence, collected once, plus the loopback probe |
| `public.mjs` · `knowledge.mjs` · `control.mjs` | the three domains |
| `security.mjs` | the seven security-boundary checks, and the route/auth analysis |
| `metrics.mjs` | the registry, and the public subset as a whitelist |
| `history.mjs` | the historical record and what moved (git-ignored: it holds control-plane data) |
| `monitor.mjs` | Agent 10 |
| `selftest.mjs` | 55 tests — normal operation and planted security-boundary failures |

Full documentation: **`docs/HEALTH-MONITOR.md`**.
