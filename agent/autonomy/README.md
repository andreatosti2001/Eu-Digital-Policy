# `agent/autonomy/` — limited autonomy, activated

SESSION 26. The first thing in this repository that can change a file without a person
deciding that individual change — and the narrowest possible version of it.

```
node agent/autonomy/cli.mjs status                 what is switched on, and what it has done
node agent/autonomy/cli.mjs survey [--all]         what could run automatically right now
node agent/autonomy/cli.mjs run --as-of YYYY-MM-DD [--proposal <id>] [--execute]
node agent/autonomy/cli.mjs actions [--json]       every attempt, merged, reverted and refused
node agent/autonomy/cli.mjs rollback --action <id> the six rollback elements, printed
```

**The default writes nothing.** `run` without `--execute` walks every gate, cuts no branch,
computes the edit, runs the validators and the browser suite, and reports whether it *would*
have merged. An autonomy layer whose safe mode is the one nobody selects is not a safe mode.

## What autonomy actually bought, in one sentence

A governance grant stands in for **exactly two** of `agent/implement/preflight.mjs`'s ten
gates — `approved` and `approval_attributable` — and only when the policy in force
independently routes the act `automatic`. Every other gate must pass, unchanged and
unweakened.

That substitution is what SESSION 18's own preflight header anticipated and left unbuilt:
*"the approval is attributable to an authorized human **or an explicitly permitted autonomy
policy**"*. There was no such policy until a person wrote a grant.

## The seven steps

| | | |
|---|---|---|
| 1 | `isolate` | A real branch, `autonomy/<action-id>`, cut from the working branch, plus the pre-change commit and a per-file sha256 of every permitted path. It refuses to start on `main`. |
| 2 | `implement` | `agent/implement/apply.mjs`, called. Each operation applies only where its quoted `current` occurs **exactly once**; zero and two are both refusals. |
| 3 | `validators` | The four validators against `docs/CURRENT-ARCHITECTURE.md` §12, plus the agent suites and the contract check where the change touches `agent/` or `tools/`. |
| 4 | `browser` | The browser suite where the change touches a page, stylesheet, module or locale. A required run that did not happen is a **blocking finding**, never a pass. |
| 5 | `trace` | Every stage on the observability trace: gates, the policy route before and after, the checks, the scope enforcement, the outcome. |
| 6 | `merge` | Into the **working branch**, and only if every mandatory condition is satisfied on the **measured** facts, git says the scope held, and the checks are at baseline. Otherwise: revert, re-hash, delete the branch. |
| 7 | `rollback` | Retained — the base commit, the branch, the per-file hashes, the executable procedure, and how a revert is confirmed. |

**Merge means into the session branch.** It does not mean `main`, it does not mean a push,
and it does not mean deployment. Nothing here deploys; Pages publishes `main` when somebody
pushes it, and that is Class D.

## The six gates before anything is written

All six are evaluated, always. Stopping at the first is cheaper and produces a worse report.

1. **`governance_grant`** — a grant is in force, and `governanceSelfCheck()` confirms the
   eligible and never-automatic lists still agree.
2. **`preflight_less_approval`** — every preflight gate except the two above.
3. **`policy_route_pre`** — no mandatory condition *fails*, and the only `unknown`s are the
   four that are measurements. An unknown blocks exactly as a failure does.
4. **`fields_permitted`** — **the one that keeps substantive legal content out.** It reads
   the operation *targets*: a target naming `tier`, `role`, `supports`, `last_verified`,
   `verification_note`, `requires_verification` or `reference_gap` is refused however the
   proposal categorised itself.
5. **`no_human_review_trigger`** — none of the conditions protocol §19 reserves to a person.
6. **`legal_record_named`** — every legal-record path in scope is named **exactly** by a
   grant, never reached by a prefix that happens to cover it.

## The two supplied facts are derived, not asserted

`agent/policy/conditions.mjs` says four of the twelve conditions are measurements a caller
supplies, and that within one process a caller can pass a false fact. Two of the four are
measured here by runs that just happened. The other two — `verification_succeeded` and
`no_unresolved_conflict` — are the easy ones to fake, and `facts.mjs` derives both from the
record store: live `VerificationRecord`s over the same entities, and a scan for a
contradicting verification, an open blocking gap or a competing proposal.

**Both return `undefined` where there is nothing to read**, never a default. An absent fact
is `unknown` in the engine and `unknown` does not execute. This module's failure mode is
refusing a change that could have been made.

## What it does not prove

- **It is not process isolation.** Anything running in this process can call the engine with
  whatever facts it likes. What the design gives is: an absent fact is unknown, eight of the
  twelve conditions cannot be supplied at all, and here the four that can are return values
  of runs that just happened.
- **`categoriseProposal()` reads records, not prose.** It cannot tell that a change described
  as bookkeeping in fact changes what a claim asserts, beyond what the record's fields say.
  Gate 4 closes the specific hole where the *field* gives it away; it does not close the
  general one, and `docs/AUTONOMY-AUTHORIZATION-POLICY.md` §10.4 already said so.
- **The action ledger is git-ignored per-machine state.** The durable record is the commit.
