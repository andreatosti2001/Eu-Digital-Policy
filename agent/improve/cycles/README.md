# The cycle ledger

`cycles.jsonl` — one line per recorded improvement cycle, append-only.

**Git-tracked, and it is the only run store in this repository that is.** Every other one is
ignored, and each argues for it in `.gitignore` at length: the trace store, the record store,
the editorial drafts, the health history, the Control Room state, the Orchestrator journals,
the simulation traces, the autonomous-action ledger. The argument is the same each time and it
is a good one — this repository publishes its whole tree, so a tracked operational trace is an
operational trace on the public web.

**The reason this one is different is that a loop whose memory does not survive a clone is not
a loop.** Every ignored store above is per-machine: a fresh clone and a CI runner have none,
which is why `agent/orchestrator/cli.mjs survey` reports "no proposal in the record store"
rather than "0 proposals". Applied to a cycle record that would mean every session
re-measuring from scratch and comparing against the previous session's **prose** in
`docs/HANDOVER.md` — a second home for those facts, which this project's first principle
forbids, and which has already drifted once: `docs/LIMITED-AUTONOMY.md` §7c exists because a
test count was stated two ways.

So the precedent here is not the health history. It is
`agent/policy/governance/grants.jsonl` and `agent/implement/decisions/decisions.jsonl`, both
tracked, for the same reason: a fact a later session has to be able to check has to survive the
clone.

**What pays for it is a rule, not a promise.** `agent/improve/ledger.mjs` enforces three
things before it appends a line, and refuses rather than redacting:

- every signal declares `visibility` using `agent/health/model.mjs`'s two values, and a
  `private` one is **withheld** with its id and the reason recorded in its place. The
  public/private boundary check is private for exactly the reason
  `control_plane.secrets_in_public_assets` is.
- `collectLeaks()` — the health monitor's own detector, not a second copy — runs over the
  **serialised** entry against the real private metric register. A private id arriving through
  a field nobody thought about is the only way this leak would actually happen.
- a path under `.control-room/` anywhere in the entry is a refusal to write. Redacting it
  would leave a record shaped like a complete one.

**Nothing writes a cycle by default.** `node agent/improve/cli.mjs cycle --as-of <date>`
records only with `--record` — the same reasoning `agent/health/history.mjs writePublic()`
gives about publishing. An agent that appended a tracked line on every run would have taken a
commit decision once, for everybody, without anyone deciding.

**Each entry holds finding IDS and not summaries**, which is the health history's rule for the
same reason: 210 findings with their prose is about 60 KB a cycle, and a ledger that grows by
that much per run is a ledger nobody keeps. The ids are content-derived
(`agent/schemas/identity.mjs`), so a finding's kind is in its prefix and the finding itself is
reproducible by re-running the observer that minted it. The current view holds the detail; the
ledger holds the movement.
