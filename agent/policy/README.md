# agent/policy — the autonomy and authorization policy, executable

The reference document is **`docs/AUTONOMY-AUTHORIZATION-POLICY.md`**. This is the short form.

```
node agent/policy/cli.mjs policy                   what is switched on. Nothing is.
node agent/policy/cli.mjs matrix                   every actor against every action
node agent/policy/cli.mjs categories               eighteen, four of them eligible
node agent/policy/cli.mjs evaluate --proposal <id> [--simulate]
node --test agent/policy/selftest.mjs              34 tests
```

- `categories.mjs` — the action categories, the policy object, and the derivation of a
  category from a proposal. `DEFAULT_POLICY.enabled_categories` is **empty** and filling it is
  a governance change.
- `actors.mjs` — actor × action × resource × environment × path × risk, deny by default. No
  `on_behalf_of`: there is no parameter through which a privilege travels.
- `conditions.mjs` — the twelve mandatory conditions. Eight are derived from the proposal and
  cannot be supplied; four are measurements and default to `unknown`, which blocks.
- `rollback.mjs` — six elements, not a boolean.
- `engine.mjs` — `evaluate()` returns a route; `mayExecute()` re-derives the approval from the
  ledger and takes no approval parameter.

`agent/implement/implementer.mjs` calls the engine twice per proposal: once before anything is
written, once on the measured facts. A policy that is only a document is not a policy.
