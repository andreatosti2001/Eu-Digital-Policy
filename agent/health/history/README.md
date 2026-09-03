# The historical health record

`health.jsonl` — one line per run, append-only.

**Git-ignored, and not merely by convention.** It holds **private control plane health
data**: which routes answer unauthenticated requests, which approvals were void, which gate
refused what. This repository has no publication boundary — GitHub Pages serves `main` at the
repository root with no `_config.yml`, no `.nojekyll` and no exclude list — so a git-tracked
health record would be a health record on the public web, which is exactly what SESSION 20
forbids.

**A `.gitignore` entry is not a security boundary**, and `agent/health/` says so rather than
pretending otherwise: `control_plane.control_room_assets_published` reports the missing
mechanism on every run, and `agent/implement/boundary.mjs` distinguishes "excluded by the
deployment" from "absent because nobody committed it, which one `git add -f` undoes".

Each entry stores the readings as `{id, state, value, unit}` and **not** their `detail` — the
detail runs to tens of kilobytes per run, and a history that grows by a megabyte a day is a
history nobody keeps. The current view holds the detail; the history holds the movement.

The **public-safe subset** is a separate artifact and nothing writes it by default:

```
node agent/health/cli.mjs --as-of <date> --publish <path>
```

Publishing is a decision. An agent that published on every run would have taken it once, for
everybody, without anyone deciding.
