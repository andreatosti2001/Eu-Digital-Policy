# The editorial-audit path

**Status:** v2 Session 3, 27 Oct 2026. Roadmap v2 item 1.1; `docs/AUDIT-2026-10-24.md` finding A.

The audit of 24 Oct 2026 found no way to start an editorial audit from the Control Room, and asked
for a path that runs the check, records the outcome and keeps it apart from Website health. A route
that **runs** something is what `docs/CONTROL-ROOM.md` §12 forbids. So the path runs the check from
the machine, **records** the run, and has the Control Room **read** the record. That is the same
arrangement the Control Room already has with the health monitor, and it is the BRIEF v2.0's rule:
make the manual process transparent before automating it.

Run every command below from the repository root.

---

## 1 · Run the audit and read the report (writes nothing)

```
node tools/evidence-audit.mjs --as-of 2026-10-24              # the report, as text
node tools/evidence-audit.mjs --as-of 2026-10-24 --markdown   # the same, as a table
node tools/evidence-audit.mjs --as-of 2026-10-24 --json       # the same, as data
```

- **What it checks:** claims, remediation, prose coverage, sources, freshness, enforcement and
  regulatory status, as its own header states.
- **`--as-of`** is the **reference date**: freshness and application dates are computed against
  it. It is not the day the command runs, and it is not evidence that anything is current.

## 2 · Run the complementary freshness check (writes nothing)

```
node tools/freshness.mjs --as-of 2026-10-24
node tools/freshness.mjs 2026-10-24          # the same, the older positional form
```

- **Its subject:** verification dates past their stated interval, events that passed unnoticed,
  and records whose own text says they will change.
- **It performs no network I/O**, and exit 0 is not evidence of currency
  (`docs/CONTENT-FRESHNESS-POLICY.md`).
- **It has no `--record`.** The roadmap gives the evidence audit one and not this check, so a
  freshness run leaves no trace beyond the terminal.

## 3 · Record a run

```
node tools/evidence-audit.mjs --as-of 2026-10-24 --record
```

- **What it does:** appends one line to `tools/evidence-audit-runs/evidence-audit.jsonl` under the
  audited tree. The store is **git-ignored**, and a fresh clone has none.
- **Without `--record`** nothing is written.
- **What the record answers:** the five questions of the BRIEF v2.0's fifth principle:
  - what was checked;
  - on which evidence — the files read, each with its SHA-256, and the rule modules applied;
  - as of which date — with `recorded_at` kept apart as a separate field;
  - at which commit — and whether the tree matched it. If it did not, the uncommitted changes
    are listed, because they were audited too;
  - with which limits.
- **Where the record's shape and its limits live:** `tools/evidence-audit-record.mjs`. Read the
  limits there; they are not restated here.

## 4 · Read it in the Control Room

- **Where:** the **Editorial audit** tab (`GET /api/editorial-audit`, permission `editorial:read`).
  It shows the latest recorded run, question by question, with its findings and the exact command
  that records a new one.
- **On a machine with no recorded run** it says "no recorded run" and gives the command. It does
  not show zeros.
- **The view runs nothing.** It is kept apart from Website health, which measures the system, not
  the claims.

## 5 · From a finding to a proposal

- **The view adds nothing to the review queue.** Turning a finding into a proposal is the
  editorial agent's job: `node agent/proposals/editorial/cli.mjs --as-of 2026-10-24`
  (`docs/EDITORIAL-AGENT.md`).
- **Where its proposals land:** the Review queue, where a person decides them with an attestation
  (`docs/CONTROL-ROOM.md` §6).
- **No second kind of queue item exists.**

## Exit codes

| | `evidence-audit.mjs` | `freshness.mjs` |
|---|---|---|
| 0 | no error in the tree; warnings are findings to read | no defect in the tree; staleness prompts are printed and counted |
| 1 | an error in the tree | a defect in the tree |
| 2 | a command line it cannot read — a bad date, an unknown argument, `--record` with `--graph`; nothing was audited | a command line it cannot read; nothing was audited |
