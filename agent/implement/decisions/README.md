# The approval ledger

`decisions.jsonl` is the **only** place a grant exists. It is git-**tracked** — unlike
`agent/records/`, which is written by agents and ignored — because a decision is provenance
that must survive, and git is the only attribution this repository has.

**Written by exactly one command:**

```
node agent/implement/cli.mjs decide --proposal <id> --grant|--deny --by "<person>" [--note "…"]
```

It requires a named human, refuses any name belonging to an agent in this system, and records
the sha256 of the proposal being decided. Editing that proposal afterwards **voids** the
approval rather than carrying it onto a scope nobody agreed to.

**This is not authentication.** Anybody who can write to the working tree can write a line
here. See `docs/IMPLEMENTATION-QA.md` §3 and §9 open question 1 — closing that gap needs the
Control Room of SESSION 21, and a comment claiming otherwise would be worse than the gap.

Do not hand-edit this file. A line that does not parse is **reported**, not skipped: a ledger
that quietly drops what it cannot read is a ledger that can be made to forget.
