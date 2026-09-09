# `agent/policy/governance/`

`grants.jsonl` — the **one home** for the fact of which action categories may happen without
a person, who decided that, on what authority, and until when.

It is **git-tracked**, unlike every other run-state directory under `agent/`, and for the
same reason `agent/implement/decisions/` is: a grant is an **authorization**, and an
authorization has to be attributable. Who added the line, and when, is a commit.

## Why the policy object is not edited instead

`agent/policy/categories.mjs` `DEFAULT_POLICY.enabled_categories` is `[]` and stays `[]`. It
is the **base case** — what the policy permits when nobody has decided anything — not a
second home for what is switched on. `policyInForce()` derives the live policy from this
ledger, so:

- a category switched on has an author, a date and a stated authority, rather than being
  switched on by whoever last edited a file;
- there is one place to look, and `agent/policy/selftest.mjs` tests 1b, 29 and 32 still
  assert the base is empty at their original strength.

## What a grant cannot do

Checked when it is written **and again on every read**, because a check that runs only at
write time protects only the file that process wrote:

| Refusal | |
|---|---|
| **Category** | Only the five protocol §20 names. The fourteen §19 categories may never be granted by any policy. |
| **Path** | Only at or under `AUTOMATIC_ELIGIBLE_PATHS` — an allowlist, because a denylist protects only what somebody remembered to name. `NEVER_AUTOMATIC_PATHS` is an independent second refusal, and `governanceSelfCheck()` asserts no eligible path reaches one. |
| **Field** | `data/sources.json` carries both bookkeeping and what a source is said to support. A grant names fields; `tier`, `role`, `supports`, `last_verified`, `verification_note`, `requires_verification`, `reference_gap` and five more may never be named. |
| **Risk** | `low` is the ceiling and no grant may raise it. |
| **Environment** | `production` is not grantable. Nothing here deploys, Pages publishes `main` on push, and that is Class D. |
| **Expiry** | Required, and an expired grant enables nothing. An authorization nobody revisits is an authorization nobody owns. |
| **Author** | Refused where the name belongs to an agent in this system. |

## Commands

```
node agent/policy/cli.mjs governance                     what is in force, and what is not
node agent/policy/cli.mjs grant  --by "<person>" --authority "<why>" --until <date> \
        --categories a,b --paths p,q --fields data/x.json:f1|f2
node agent/policy/cli.mjs revoke --grant <grant_id> --by "<person>" --authority "<why>" --until <date>
```

## What this is not

It is not authentication. Anybody who can write to the working tree can append a line here,
exactly as `agent/implement/ledger.mjs` says about the decision ledger and for the same
reason: this is a static site with no server. What the ledger gives is one attributable
home, a set of refusals a forged line still has to pass, and a git history that says who
added it. Anything arriving over HTTP is authorized server-side by `.control-room/` first.
