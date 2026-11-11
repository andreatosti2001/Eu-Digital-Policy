# The approval ledger

`decisions.jsonl` is the **only** place a grant exists. It is git-**tracked** — unlike
`agent/records/`, which is written by agents and ignored — because a decision is provenance
that must survive, and git is the only attribution this repository has. **It holds one entry since 6 Nov 2026**:
the repository author's signed grant of `prop-docs-ea57404dc452`. No other proposal here has been decided by a person, and
nothing in a test, a fixture or a tool has put a line here to make it look otherwise.

**Written by exactly two things** (the Control Room's `POST /api/review` is the other):

```
node agent/implement/cli.mjs decide --proposal <id> --grant|--deny --by "<person>" [--role "<role>"] [--sign-key <private.pem>] [--note "…"]
```

It requires a named human, refuses any name belonging to an agent in this system, and records
the sha256 of the proposal being decided. Editing that proposal afterwards **voids** the
approval rather than carrying it onto a scope nobody agreed to.

## An entry (ledger version 2)

| Field | Meaning |
|---|---|
| `ledger_version` | `2`. A version-1 line has no chain and no signature slot, and is refused by the release gate |
| `seq`, `prev_entry_sha256`, `entry_sha256` | the hash chain: editing, deleting or re-ordering an entry breaks every hash after it. Truncating the *tail* is caught by the gate's append-only rule (C6), which compares the ledger at each commit with its parent's |
| `approval_id`, `proposal_id`, `proposal_agent`, `proposal_contract` | which request this decides, and which agent made the proposal |
| `proposal_sha256`, `proposal_snapshot` | the content binding: the decision authorises *this* proposal, byte for byte |
| `outcome` | `granted` or `denied` |
| `provenance` | `human` or `simulated`. A simulated entry's `decided_by` begins `SIMULATED:`, `deriveApproval()` reads it as `void_simulated`, the verifier and the gate refuse it, and it cannot be signed |
| `decided_by`, `decided_role`, `decided_at` | who, in what capacity, when. `decided_by` must equal the registered name of the key that signed; `decided_role` the registered role |
| `signature` | `{alg:"ed25519", key_fingerprint, value}` over `entry_sha256`, or `null` |
| `what_was_asked`, `risk_if_wrong` | a quote of what the person was asked to check |

`reviewers.json` — **one reviewer, active, since 5 Nov 2026** — is the registry: `{"reviewers":[{"reviewer_id","name","role","status":"active|revoked","added_at","public_key_pem"}]}`.
`node agent/release/cli.mjs status` prints its fingerprint, which the owner pins as the repository
variable `RELEASE_REVIEWER_REGISTRY_SHA256` (`docs/DEPLOYMENT.md` §3a).

## What each layer proves, and what none does

- `deriveApproval()` (the agent layer) accepts an unsigned entry, as it always did, so a development ledger stays usable.
- `verifyLedger()` (`agent/implement/attestation.mjs`) — run by the dispatcher and by the release gate with signatures
  **required** — proves the chain is intact, that a registered reviewer's key signed the line, and that no fixture is among
  them.
- **Nothing here proves who holds the private key**, that the registry is honest, or that the person read what they signed.
  The registry is in the repository; the only control that stops whoever can write the ledger from also registering their own
  key is the fingerprint pinned *outside* it. `docs/IMPLEMENTATION-QA.md` §9 question 1 stays open in exactly that respect.

Do not hand-edit this file. A line that does not parse is **reported**, not skipped: a ledger
that quietly drops what it cannot read is a ledger that can be made to forget. `recordDecision`
refuses to append to a ledger that does not verify.
