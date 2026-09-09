# `agent/autonomy/actions/`

One append-only file, `actions.jsonl`, holding **every autonomous action attempted on this
machine** — merged, reverted and refused alike.

It is **git-ignored**, and the reason is the same one `agent/orchestrator/state/` gives: this
repository publishes its whole tree, so a tracked operational trace of what an agent did
would be a control-plane record on the public web.

**Losing it loses history and no authority.** The durable record of an autonomous change is
the **commit** it made. That commit's message names the governance grant, the person who
wrote it, the derived category, the policy in force, the checks, the base commit and the
exact command that undoes the change — so a fresh clone can read and reverse an autonomous
change with this directory empty. Derivation over storage, applied to an audit trail.

What a line here holds that the commit does not: the **sha256 of every permitted path taken
before the edit**. That is what turns "it was reverted" from an assertion into a
measurement, and it is why `agent/implement/apply.mjs rollback()` re-hashes rather than
trusting a return code.

```
node agent/autonomy/cli.mjs actions              every attempt, newest last
node agent/autonomy/cli.mjs rollback --action <id>   the six rollback elements, printed
```

`rollback` **prints**. Undoing a merged change is a decision, and running it is a person's.
