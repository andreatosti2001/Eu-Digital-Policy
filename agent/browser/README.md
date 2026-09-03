# `agent/browser/` — the browser regression suite

SESSION 19. The first thing in this repository that opens a page.

```
node agent/browser/cli.mjs                # everything
node agent/browser/cli.mjs --quick        # a subset, for a fast loop
node agent/browser/cli.mjs --only search,dialogs
node agent/browser/cli.mjs --json         # machine-readable, incl. the QAResult check
node agent/browser/cli.mjs --require-browser   # a missing browser is a hard failure
node --test agent/browser/selftest.mjs    # the suite's own suite
```

**Exit codes.** `0` pass (possibly with an undecidable named), `1` a check failed or the
run threw, **`2` no browser was found and the suite did not run.** `2` rather than `0` is
the design: a suite that exits 0 when it could not open a browser teaches a pipeline that
green means checked.

**It installs nothing.** No `package.json`, no lockfile, no Playwright. It drives a browser
already on the machine over the Chrome DevTools Protocol, using Node 22's global
`WebSocket`. Adding a dependency here is a red-tier architectural change
(`docs/AUTONOMY-POLICY.md` Class D), and `agent/schemas/contracts/implementation-proposal.mjs`
already refuses one.

| File | What it owns |
|---|---|
| `find.mjs` | Locating a browser — or refusing, with every path it looked in |
| `serve.mjs` | The site over HTTP on an ephemeral port, read-only, with a request log |
| `cdp.mjs` | The protocol client: launch, page, navigate, evaluate, key, viewport |
| `checks.mjs` | The fifteen areas SESSION 19 names |
| `runner.mjs` | One run: serve → launch → ask → close → report, and `asQACheck()` |
| `cli.mjs` | The command |
| `selftest.mjs` | 19 tests, including the proof a skip never becomes a pass |

Full documentation, coverage table and limitations: **`docs/BROWSER-QA.md`**.
