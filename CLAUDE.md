# CLAUDE.md

**See [`AGENTS.md`](AGENTS.md) — it is the canonical agent entry point for this repository
and applies in full to Claude Code.**

This file deliberately holds no rules of its own. This project's first principle is *one home
per fact*: duplicating the instructions here would create the second copy that the whole
architecture — and `tools/validate.mjs` §4 — exists to prevent.

Start every session by reading `AGENTS.md`, then invoke the `project-context` skill in
`.agents/skills/`. The skill says what else to read, by level — always the binding
constraints, then the documents the catalogue lists for the task's domain, then records only
when something cites them. This file carries no reading list of its own: the skill and the
catalogue are its home, and a list here would be the second copy.

`AGENTS.md` links the five operating policies in `docs/` — autonomy classes, agent
contracts, data governance, source policy, verification policy. Read the one your task
touches.

**Before you conclude anything about what this repository contains, run
`git fetch --all && git branch -a`.** Branches here move while a session is working, and an
earlier one reported four existing documents as missing by checking an unfetched tree.

**The one thing to carry in before you read anything else:** this is a production site about
what EU law requires of people. Never fabricate a citation, date, article number, fine or
regulatory status, and never close an evidence gap with a plausible substitute.
