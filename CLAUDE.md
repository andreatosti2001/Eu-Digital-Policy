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

Then invoke the `project-context` skill in `.agents/skills/`.

**The one thing to carry in before you read anything else:** this is a production site about
what EU law requires of people. Never fabricate a citation, date, article number, fine or
regulatory status, and never close an evidence gap with a plausible substitute.
