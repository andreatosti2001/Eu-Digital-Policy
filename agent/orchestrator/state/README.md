# agent/orchestrator/state/ — workflow journals

One append-only `.jsonl` per workflow. Each line is one transition or one stage outcome;
the current state is `replay()` of those lines, never a stored field.

**Git-ignored, and that is a placement decision rather than a convention.** These files
hold control-plane routing: which specialist refused what, which gate blocked which
proposal, which approval was found void. This repository publishes its whole tree — GitHub
Pages serves `main` at the repository root with no `_config.yml` and no exclude list — so a
tracked journal would be an operational trace on the public web.

**A `.gitignore` entry is not a security boundary.** One `git add -f` undoes it. It is the
strongest control available in a repository whose deployment unit is the whole tree, and
`docs/ORCHESTRATOR.md` §9 says so rather than implying otherwise.

**It is not tamper-evident either.** `readJournal()` reports a sequence gap; it cannot
prevent one, and anybody who can write the working tree can write these files. The record
that carries authority is `agent/implement/decisions/decisions.jsonl`; the record that
carries a hash chain is the Control Room's audit trail. Neither is this.

An empty directory means no workflow has run **on this machine**. A fresh clone and a CI
runner have none, and that is not the same as no workflow having run.
