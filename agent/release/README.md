# `agent/release/` — the release dispatcher and the deploy gate

Written on 4 Nov 2026 (the Phase 4 operational-closure session; `docs/AUDIT-2026-11-04.md`). It closes the
middle of the chain this repository had at both ends and nothing in between:

```
agent proposal → deterministic validation → human decision (ledger) → [ dispatcher ] → pull request
                                                                  → [ deploy gate ] → authorised artifact
```

```
node agent/release/cli.mjs status                        the chain, measured; writes nothing
node agent/release/cli.mjs lifecycle [--proposal <id>]   the seven states, derived
node agent/release/cli.mjs verify-ledger                 chain, signatures, no fixtures
node agent/release/cli.mjs workflows                     is pages.yml the only publisher, the gate in its path?
node agent/release/cli.mjs dispatch --proposal <id>      REHEARSAL: every check, nothing written
node agent/release/cli.mjs dispatch --proposal <id> --execute --as-of YYYY-MM-DD
node agent/release/cli.mjs gate [--ci] [--head <sha>] [--artifact <dir>] [--needs-env <VAR>]
node agent/release/cli.mjs keygen --out-dir <dir outside the repo> --reviewer-id <id> --name "<person>" --role "<role>"
node --test agent/release/selftest.mjs                   59 tests (13 of them group I, P0.1)
```

**No verb pushes, merges, writes the decision ledger or accepts a waiver.** There is no `--force`, `--skip`,
`--allow-unsigned` or `--assume`, and a test (K1) fails if one is added. `dispatch` is a rehearsal unless `--execute`.

## What is here

| File | Holds |
|---|---|
| `dispatch.mjs` | the dispatcher: ten stages, each logged — intake · ledger · approval · preflight · duplicate · index · isolate · apply · scope · commit — and, on any failure after the branch is cut, a verified `rollback` |
| `worktree.mjs` | what the dispatcher may commit, measured against git: the index check, the snapshot, the produced set, the restore and its verification (P0.1, 11 Nov 2026; `docs/AUDIT-2026-11-11.md` §1–§3) |
| `gate.mjs` | the deploy gate: `gatherFacts()` reads git and the artifact; `judge()` is a pure function of those facts, ten conditions C1…C10 |
| `workflows.mjs` | a no-dependency reader of `.github/workflows/*.yml`: is `pages.yml` the only publisher; is the gate in its path |
| `lifecycle.mjs` | proposed → technically validated → awaiting review → approved → rejected → published → superseded/withdrawn, **derived**, never stored |
| `policy.mjs` | every constant the above decide by, in one place |
| `selftest.mjs` | positive and negative paths for all of it, on temporary repositories, ledgers and keys |

## The dispatcher, in the order it refuses

1. **intake** — one proposal id, 4–120 characters of `[A-Za-z0-9._-]`. Free text, a path, an empty input: refused.
2. **ledger** — the whole decision ledger verifies (`agent/implement/attestation.mjs`): hash chain, signatures against a
   registered reviewer, no simulated entry, no agent named as decider. One bad line refuses everything.
3. **approval** — `deriveApproval()` says `granted`, the decision is **signed** by a registered reviewer and records a role.
   `pending`, `denied`, `void_scope_changed`, `void_simulated`, `void_self_approved` and `no_request` are all refusals.
4. **preflight** — Agent 9's ten gates, run again now.
5. **duplicate** — `git log --all --grep "Dispatch-Key: <key>"`. The key is `sha256(approval_id : proposal_sha256)`; the
   same approved content cannot be dispatched twice, on any branch, and the second call names the first commit. Derived from
   git, not stored, so a fresh clone has it.
5a. **index** (11 Nov 2026, P0.1) — nothing staged, nothing unmerged, no merge, rebase, cherry-pick or revert in progress.
   Runs in a rehearsal too. **Refuses and names the paths; never unstages them.** `git commit` takes the whole index: this
   is how `11313f6` carried 9 files while the scope stage reported 1.
6. **isolate** — a new `release/<proposal>-<key>` branch, cut from a non-main branch, with a clean approved scope; the tree
   is **snapshotted** first (every path git reports, its status and the sha256 of its bytes; the person's uncommitted bytes
   held, up to 32 MiB).
7. **apply** — Agent 9 (`Implementer`, `apply: true`), handed the *same* record and ledger snapshot checked above.
8. **scope** — four lists kept apart: *permitted* (the proposal), *declared* (`result.change.files`), *produced* (every path
   whose status or bytes differ from the snapshot, including an edit inside a file the person had already changed). Refused
   when produced is empty, leaves the permitted set, or differs from declared in either direction.
9. **commit** — only produced paths are staged; the index is re-read and must equal produced; the commit is re-read and must
   have one parent (the base) and exactly the produced files. Trailers `Proposal`, `Proposal-SHA256`, `Approval`,
   `Dispatch-Key`, `Decided-By`, `Evidence`. Not pushed.

**rollback** — on any failure after stage 6: every path that differs from the snapshot is restored (from the base, from the
held bytes, or removed), then **verified** (status, every hash, HEAD, nothing staged) before the branch is deleted and again
after. Unverified: `severity: "high"`, every path named, the branch **kept**, the person's bytes copied to
`agent/release/runs/recovery-…`. Distinct from Agent 9's own rollback of the permitted paths, which the report keeps apart
(`agent_rollback`, `residue_after_agent`). No `reset`, `clean` or `stash`, anywhere (test A11).

A refusal, a duplicate and a failure are each a line in `agent/release/runs/dispatch.jsonl` (git-ignored, per machine) and
in the returned report; exit code 1 for refused/failed, 0 for rehearsed/dispatched/duplicate.

## The gate, condition by condition

| | Condition | Blocks when |
|---|---|---|
| C1 | origin | repository ≠ `andreatosti2001/Eu-Digital-Policy`, ref ≠ `refs/heads/main`, event ∉ {push, workflow_dispatch}, workflow ≠ `pages.yml@main`, or the checkout is not the commit judged. **Without `--ci` — a local run, or `qa.yml`'s rehearsal on a push or pull request — it is unmeasured**, never a pass and never a refusal of the origin; under `--ci` every one of these blocks (5 Nov 2026: before this, the rehearsal in `qa.yml` failed C1 on every run) |
| C2 | history | shallow clone; the commit that introduced the gate not found or not an ancestor |
| C3 | publisher | any workflow other than `pages.yml` publishes; `build` does not need every gate job; the gate step is missing or after the upload; `if:`, `continue-on-error`, `\|\| true`, `set +e` on the path; a non-push/dispatch trigger; write permissions anywhere but `deploy` |
| C4 | upstream | GitHub's own `needs` result shows any gate job not `success` |
| C5 | ledger | any chain, signature, registry, simulated-entry or agent-decider problem |
| C6 | append-only | any commit changed a decision recorded before it |
| C7 | agent changes | a commit declaring a `Proposal` has no granted, signed, human decision **preceding it in history**, a mismatched hash/key, a file outside the approved scope, a later denial, an approval older than 30 days or dated after the commit |
| C8 | unledgered | agent-attributed commits to the published site citing no Proposal — **reported, blocking only with `--strict-unledgered`** |
| C9 | artifact | any file off the allowlist, any dot path, any file not byte-identical to the commit's own blob, any published file missing, any credential shape |
| C10 | registry pin | a deploy relying on a signature, with `RELEASE_REVIEWER_REGISTRY_SHA256` unset or not matching `reviewers.json` |

`docs/DEPLOYMENT.md` §2a is the account of the gate in the pipeline; §3a lists the settings outside the tree; §3b is the
procedure by which a person makes the approval this module checks for.

## What it is not

- **Not the Orchestrator's dispatcher.** `agent/production/readiness.mjs production_dispatcher_wired` measures whether
  `agent/orchestrator/dispatchers.mjs` exists. This module does not create it and does not satisfy that condition; test R3
  fails if the file appears without a decision.
- **Not authentication.** A signature shows the holder of a registered key produced the line. Who holds the key, and whether the
  registry is honest, is the owner's pin (C10) and branch protection — neither is in the tree.
- **Not a judgement of truth.** C7 shows a person decided. It cannot show they were right.
