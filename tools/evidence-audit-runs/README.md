# Recorded editorial audits

`evidence-audit.jsonl` — one line per run of

```
node tools/evidence-audit.mjs --as-of YYYY-MM-DD --record
```

append-only. Without `--record` the tool writes nothing.

**Git-ignored.** A recorded run is a fact about one machine on one day, not about the
repository, so a fresh clone has none — and the Control Room's **Editorial audit** view says
"no recorded run" and shows the command, rather than rendering an absence as zeros.

Each record answers the five questions of the BRIEF v2.0's fifth principle — what was checked,
on which evidence (the files read, by content hash), as of which date, at which commit (and
whether the tree matched it), with which limits. The shape is defined in
`tools/evidence-audit-record.mjs`; the path a person follows is `docs/EDITORIAL-AUDIT-PATH.md`.

Nothing in the Control Room runs the tool or writes here (`docs/CONTROL-ROOM.md` §12).
