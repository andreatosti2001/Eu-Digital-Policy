# CLAUDE.md

**See [`AGENTS.md`](AGENTS.md) — it is the canonical agent entry point for this repository
and applies in full to Claude Code.**

This file deliberately holds no rules of its own. This project's first principle is *one home
per fact*: duplicating the instructions here would create the second copy that the whole
architecture — and `tools/validate.mjs` §4 — exists to prevent.

Start every session by reading, in order:

1. `AGENTS.md`
2. `docs/PROJECT-CONTEXT.md`
3. `docs/CURRENT-ARCHITECTURE.md`
4. `docs/AI-SAFE-BOUNDARIES.md`
5. `docs/HANDOVER.md`
6. `docs/AUDIT-2026-09-01.md` — where the architecture above is not enforced
7. `docs/AUDIT-2026-09-03.md` — foundation verification before SESSION 13; read this before
   starting it

Then invoke the `project-context` skill in `.agents/skills/`.

`AGENTS.md` links the five operating policies in `docs/` — autonomy classes, agent
contracts, data governance, source policy, verification policy. Read the one your task
touches.

**Before you conclude anything about what this repository contains, run
`git fetch --all && git branch -a`.** Branches here move while a session is working, and an
earlier one reported four existing documents as missing by checking an unfetched tree.

**The one thing to carry in before you read anything else:** this is a production site about
what EU law requires of people. Never fabricate a citation, date, article number, fine or
regulatory status, and never close an evidence gap with a plausible substitute.
