# The Control Room

**Status:** binding. The reference document for `.control-room/` — the private control plane
for *The European Legal Framework for the Digital World*. SESSION 21.

`docs/HANDOVER.md` carries what this session did. This carries what the thing **is**, how the
owner sets it up, and — at the end, at length — **what it does not prove**.

---

## 0 · The one-paragraph version

The Control Room is a **server**, not a page. It lives at `.control-room/`, outside the set the
public deployment publishes. It requires an authenticated session for every route but the login
surface, makes a server-side authorization decision on every privileged request, records an
audit entry for each, and can do exactly three things to a proposal: **approve, reject, request
changes**. Approving writes one line to `agent/implement/decisions/decisions.jsonl` and changes
nothing else. It cannot deploy, delete, apply, publish or execute anything, and there is no
flag that lets it.

```
node .control-room/cli.mjs check       # what it would refuse to start on
node .control-room/cli.mjs provision --subject "you@example.org" --role administrator --by "your name"
node .control-room/cli.mjs serve       # http://127.0.0.1:7802
```

---

## 1 · The two security domains, and which boundary is real

Protocol §10 requires the public website and the private control plane to be architecturally
separated, and is explicit that a hidden route, a hidden link, `robots.txt`, a frontend check
and an unlisted page are **not** security mechanisms.

**The problem this repository starts from.** Deployment is GitHub Pages serving `main` at the
repository root, with no `_config.yml`, no `.nojekyll` and no exclude list
(`docs/CURRENT-ARCHITECTURE.md` §13). The unit of publication is *files in the repository*, so
`agent/`, `docs/` and `tools/` are published beside `index.html`.
`node agent/implement/cli.mjs boundary` has reported that on every run since SESSION 18, and it
is why SESSION 18's own module says a Control Room page "added to this tree in SESSION 21 would
be public the moment it was pushed."

**The one exclusion that exists** is Jekyll's documented default: a path whose segments begin
with `.` or `_` is not served. It is why `.agents/` has never appeared in the published surface
and `agent/` always has. `agent/implement/boundary.mjs publicSurface()` already models it, and
calls it, in its own words, "a real boundary, and it is the only one this repository has."

So the Control Room is behind that boundary. **That is a property of the deployment, not a
hidden route** — and it is deliberately not the only thing standing between a stranger and the
data:

| | |
|---|---|
| The **publication** boundary | `.control-room/` is not in the set the deployment serves. Checked over the real tree by `node .control-room/cli.mjs boundary`, in CI, on every push. |
| The **git** boundary | `.control-room/state/` is git-ignored, so the operator registry, sessions and the audit trail are outside the repository as well. |
| The **request** boundary | Every privileged route authenticates and then authorizes, server-side, whether or not anybody finds the server. |

Only the third is a security control. The first two are why a mistake in the third would not
already have published an audit trail.

**What this is not.** It is not a claim about what the deployed site serves. Nothing in this
repository has ever fetched `andreatosti2001.github.io` — outbound access to that origin is
refused by this environment's network policy — so the publication boundary is **read from the
tree and inferred from GitHub Pages' documented default**, and every record that touches it says
so.

---

## 2 · Running it

```
node .control-room/cli.mjs check          # configuration, registry, and every refusal
node .control-room/cli.mjs routes         # every route and the permission it needs
node .control-room/cli.mjs boundary       # is the private plane outside the public site?
node .control-room/cli.mjs roles          # what each role may do
node .control-room/cli.mjs operators      # who has access
node .control-room/cli.mjs audit --verify # re-walk the audit chain
node .control-room/cli.mjs serve
```

Zero dependencies, no build step, no `package.json` — the same constraints as the rest of the
repository, and for the same reason (`docs/AUTONOMY-POLICY.md` Class D).

### The first administrator

There is **no default account**, and the server **refuses to start** until one exists — it
prints the command below rather than seeding an "admin" so that it can run. Protocol §11
forbids `"admin"` / `"admin"` or any equivalent from existing at all, so none is created.

```
node .control-room/cli.mjs provision \
  --subject "you@example.org" \
  --role administrator \
  --by "your name"
```

- Under the **local** provider it then asks for a password **on stdin**, twice, without
  echoing. There is no `--password` flag: a password in `argv` is in the shell history, in the
  process list and in any log that records a command line.
- Under **oidc** the `--subject` is the identity provider's `sub` claim, and no password is
  involved. Add `--email` and `--name` for legibility; the role is looked up by `sub` and never
  by email, because an email can be reassigned inside an organisation and a role that followed
  one would follow it to the wrong person.
- `--by` is required. An operator provisioned by nobody is an unattributable grant of access.

Provisioning is a **CLI act on the machine**, not something the interface can do. Somebody has
to be able to create the first administrator, and the first administrator cannot log in to
create themselves; every system solves that either with a seeded default account or with an
out-of-band act, and this is the second. It also means the Control Room cannot grant itself a
role — a privileged interface that can widen its own access has no boundary above it, and the
audit trail of that widening would be written by the thing doing the widening.

Afterwards: `grant`, `revoke`, `disable`, `enable`. The last administrator may not be demoted
or disabled — with none, nobody can grant the role back, and the only way out would be editing
the registry by hand.

---

## 3 · Authentication

Protocol §11 says to prefer an established provider supporting secure sessions and, where
appropriate, MFA, and not to write custom username/password authentication **unless there is a
documented architectural reason**. There are two providers, and only one may serve production.

### `oidc` — the production provider

OpenID Connect **authorization code flow with PKCE (S256)**, implemented against `node:crypto`
and the global `fetch`, with no dependency.

```
/auth/login  →  discovery document  →  the identity provider  →  /auth/callback
```

| Step | What is checked |
|---|---|
| Discovery | `<issuer>/.well-known/openid-configuration`. The document must declare **the same issuer** that was configured; an IdP answering for somebody else is refused. |
| Authorize | `state`, `nonce` and a PKCE `code_challenge` are generated per login and held **server-side**; the browser carries only an opaque handle in a short-lived `cr_login` cookie. |
| Callback | `state` compared in constant time. The handle is **single-use** — consumed before anything else happens, so a replayed callback is refused. |
| Token exchange | POST to the token endpoint with the `code_verifier`, and HTTP Basic client authentication when a client secret is configured. |
| `id_token` | Signature verified against the JWKS (`RS*`, `PS*`, `ES*`). Then issuer, audience, `azp` where there are several audiences, `exp`, `iat` and `nonce`. |
| Mapping | The `sub` claim is looked up in the operator registry. **An identity the registry does not know is a 403, never an account.** Authentication says who somebody is; this repository says what they may do, and auto-provisioning would let anybody in the IdP's directory into the Control Room. |

`alg: none` is refused. So are the HMAC algorithms — a shared-secret signature over an
assertion about identity is a weaker thing than a public-key one, and this build does not need
it. Neither the `id_token` nor the access token is stored: the Control Room wanted an identity,
not an API credential, and a stored access token is a stored liability.

**MFA, password policy, account recovery, lockout and central revocation are the identity
provider's.** That is the entire reason for preferring one, and none of them is reimplemented
here. Revoking access on **this** side is `revoke` or `disable`, and it takes effect on the next
request rather than when a session expires.

### `local` — the development provider, and the documented reason it exists

scrypt (N=2¹⁵, per-operator salt, constant-time compare) over the operator registry.
`config.mjs` refuses it in **two independent checks**: it may not run when
`CONTROL_ROOM_ENV=production`, and it may not bind a non-loopback host in any environment. Two,
so that changing one variable does not get round it.

**The architectural reason, stated because §11 asks for one and because "it was easier" is not
one.** This repository has no dependencies and no build step, and this environment has no
outbound network access. Without an offline provider, the sixteen security proofs SESSION 21
requires could not be **run** — every one of them needs a login — and a security boundary
nobody has executed is a claim rather than a control. The local provider exists so that the
suite can actually authenticate, and it is structurally unable to serve production.

It has no MFA, no account recovery, no lockout and no central revocation. Do not use it for
anything but development.

### Sessions

The cookie carries **256 bits of randomness and nothing else** — no identity, no role, no
expiry, no signature — so there is nothing in it to forge; a modified cookie is a session id
that does not exist. The record lives server-side in a file named by the **SHA-256 of the
token**, so the store does not contain a usable credential either.

- `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production.
- **Why Lax and not Strict:** the OIDC callback is a top-level navigation *from* the identity
  provider, which is cross-site; a Strict cookie set on that response is not returned on the
  next navigation in several browsers, producing a login loop — and a login loop is the kind of
  thing somebody fixes by weakening something that mattered. Lax is the *fourth* line against
  cross-site request forgery here, not the first. The first is a **double-submit CSRF token**
  required on every state-changing request and compared in constant time; then an `Origin`
  check when the header is present; then a refusal of any body that is not `application/json`.
- Absolute lifetime **and** idle timeout, both enforced server-side, both destroying the record
  rather than merely refusing it.
- **Roles are re-read from the registry on every request.** `roles_at_login` is kept for the
  audit trail and is never used for a decision, so a role revoked at 11:00 is gone at 11:00.

---

## 4 · Authorization

Authentication establishes identity; authorization establishes permission. Separate files,
separate decisions, and `authorize()` **denies by default** — an action nobody wrote a rule for
is refused, because the alternative makes every route added later public until somebody
remembers.

| Role | Permissions |
|---|---|
| `viewer` | `live:read` `queue:read` `health:read` |
| `reviewer` | the above, plus `proposal:request_changes` |
| `approver` | the above, plus `audit:read` `proposal:reject` `proposal:approve` |
| `administrator` | the above, plus `operators:read` `operators:write` `proposal:approve:human_only` |
| `operator` | `live:read` `health:read` `audit:read` |

Two separations are the point rather than the detail:

- **`operator` decides nothing.** The person who keeps the agents running is not thereby a
  person who may decide what the site says about EU law.
- **`proposal:approve` does not cover a `human_only` proposal.** That needs
  `proposal:approve:human_only`, which only `administrator` holds, because
  `docs/AUTONOMY-POLICY.md` Class D — deleting a record, declaring a licence, adding a
  dependency, publishing — requires authorization "named and recorded" from the repository
  author. A proposal whose autonomy class is **missing or unrecognised takes the strictest
  permission**: the default when unsure is the higher class.

**The interface is never the authority.** `visibleActions()` exists so a button can be hidden,
and it is derived from the same matrix the server enforces — but the server authorizes every
request whether the button was there or not. A client that ignores every hint is refused, and
the suite proves it by sending exactly that request.

---

## 5 · The three views

All three are assembled **server-side**. The browser receives JSON and renders it; it computes
no state, derives no status and holds no authority.

**1 · Live system.** Agent runs, events, discoveries, verification decisions, handoffs,
downstream effects and failures — with **running** and **failed** runs lifted out, because a
stuck pipeline looks exactly like an idle one until somebody notices a run that never ended. An
absent trace store reports `no_trace_store` with the reason, not zero: nothing has run *where
this server can see* is a different fact from nothing having run.

**2 · Review queue.** Every proposal with its **whole chain** — evidence, facts, inferences and
open questions, affected entities, operations, the originating agent run, required tests, the
files an approval would permit, the rollback plan — plus the **fingerprint** of the exact
version being displayed and the **gates that currently refuse it**. A proposal that is pending
*and* gate-blocked is waiting on the agent that produced it, not on a reviewer, and the two are
counted apart: approving something that cannot be implemented spends the scarcest thing in this
system, which is a person having read the evidence.

**3 · Website health.** The last recorded run of `agent/health/`, every reading marked
**public-safe or private**, with the metric register alongside so a number is quotable in
context. Where no run has been recorded — the ordinary case on a fresh clone, because
`agent/health/history/` is git-ignored — it says so and gives the command, rather than
rendering nulls as zeros. **There is no overall score and this view will not compute one**;
`agent/health/model.mjs overallScore()` still throws.

There is also an **audit trail** view (`audit:read`) and an **access** view
(`operators:read`), the second read-only: roles are granted from the machine.

---

## 6 · Approval, and what it is not

Approving writes **one line**, to `agent/implement/decisions/decisions.jsonl`, through
`agent/implement/ledger.mjs recordDecision` — the same function `node agent/implement/cli.mjs
decide` calls, and the only code path in this repository that writes a grant. **One home for
the fact of a decision.**

It changes no dataset, no page, no stylesheet, no locale. It runs no validator, no build, no
deployment. It touches no git. `git_ref` on the audit entry is `null` at decision time by
design — a value there would mean the approval published something.

Seven gates, in order, all server-side:

| | | |
|---|---|---|
| 1 | the action is one of the three | 400 |
| 2 | the proposal exists, and is a proposal | 404 / 409 |
| 3 | the actor holds the permission **for this proposal's autonomy class** | 403 |
| 4 | the request is bound to the **exact version** the reviewer saw | 409 |
| 5 | the proposal is in a **governed state** to decide from | 409 |
| 6 | every governance gate that does not depend on the approval passes | 409 |
| 7 | the ledger accepts it — content-bound, no self-approval, a request exists | 409 |

Gate 4 is the answer to *scope cannot be expanded through request manipulation*: the request
carries a **fingerprint and nothing else about scope**. Scope is read from the stored proposal,
never from the body — and a body naming files, operations, roles or an outcome is **rejected
with the field named**, not silently ignored. Editing a proposal after approval voids the
approval rather than carrying it onto a widened scope, because `recordDecision` binds the
decision to the proposal's hash.

Gate 5 is the answer to *a rejected proposal cannot be approved without entering a valid
governed state*: only `pending` is decidable. A **denied** proposal is reopened by the producing
agent raising a fresh `ApprovalRequest` — approving over a denial through the same endpoint
would make the denial advisory.

**Request changes is not an approval state.** It writes no ledger line, because the ledger holds
grants and denials and this is neither. It is a review annotation: audited, traced, shown in the
queue, and it leaves `deriveApproval()` reporting `pending`, which is what is true.

**Approval does not publish.** The Implementation Agent re-derives the authorization from the
ledger, independently, through its own ten gates, and refuses if any says no
(`docs/IMPLEMENTATION-QA.md`). The suite asserts the negative directly: after an approval every
file in the tree is byte-identical except the ledger.

---

## 7 · The audit trail

Append-only JSONL under `.control-room/state/audit/`, one file per month, **hash-chained** —
each entry carries the SHA-256 of the one before it and its own.

Every entry carries the authenticated actor and **the roles they held at that moment**, the
session, the proposal, the fingerprint the decision was bound to, the state before and after,
the provenance the reviewer was shown, the originating agent run, the required tests, the
approved scope, the Control Room's trace id, and the reason. An entry that cannot answer one of
the questions lists it in `missing_fields` — an incomplete trail says so rather than looking
complete.

Refused things are recorded too, and separately: `authz.denied` for a permission the actor does
not hold, `proposal.decision_refused` for a governance gate, `session.login_failed` for a bad
credential. A record of who was turned away is part of the answer.

**Never in an entry:** passwords, session tokens, CSRF secrets, `id_token`s, access tokens,
cookies, the client secret. `agent/observability/redact.mjs` runs over every entry on the way in
as a second line, and the suite asserts over a real trail that none of the eleven credential
shapes appears in it.

`node .control-room/cli.mjs audit --verify` re-walks the chain. **What that proves:** no entry
was edited in place, removed from the middle, or reordered. **What it does not:** that the file
was never rewritten wholesale by somebody with write access, which produces a self-consistent
chain with a different head. Catching that means keeping a copy of the head somewhere else. The
word "tamper-proof" does not appear anywhere in this system, and should not start.

---

## 8 · Observability

Every substantive action reaches the **shared** trace store (`agent/observability/`, the same
one every agent writes to), because a Control Room decision that could not be correlated with
the agent run that produced the proposal would break the chain protocol §28 requires end to
end.

A decision emits an `approval` record (naming the **operator id**, not a display name), a
`decision` record with the alternatives not taken, and an observation stating that nothing was
published. It also **attaches to the originating run** — appending to the span the producing
agent already wrote, rather than opening a second one — so "what happened to the thing agent 5
proposed" is answerable from either end.

A trace that cannot be written never swallows a decision that was made: the audit entry records
`trace_id: null`, which reads as what it is.

---

## 9 · Configuration

`.control-room/config.example.env` holds **placeholders only** and is the only configuration
file in the repository. Copy it outside the tree, fill it in there, load it into the
environment. `node .control-room/cli.mjs check` prints what it read — with the client secret
shown as `[set, not shown]` and never as a value — and every reason the server would refuse to
start.

**The refusals that run before the first request.** SESSION 20 measured
`agent/observability/server.mjs` and found nine of eleven privileged routes answering an
unauthenticated request, its only protection being that `host` *defaults* to loopback. **A
default is not a control**, and that finding is why every dangerous combination below is a
refusal to start rather than a default somebody can override:

- the `local` provider with `CONTROL_ROOM_ENV=production`;
- the `local` provider on any non-loopback host, in any environment;
- any non-loopback host outside production;
- production without an `https` `CONTROL_ROOM_PUBLIC_ORIGIN`;
- `oidc` without an issuer or a client id, or with a non-https issuer;
- `CONTROL_ROOM_OIDC_ALLOW_INSECURE` in production;
- an idle timeout longer than the absolute session lifetime, which could never fire;
- **an empty operator registry.**

| | Development | Test | Production |
|---|---|---|---|
| Provider | `local` (or `oidc` against a local IdP) | `local`, in a temp state directory | `oidc`, required |
| Bind | loopback, enforced | ephemeral loopback port | any, with TLS in front |
| Cookies | no `Secure` (loopback is http) | as development | `Secure`, `HttpOnly`, `SameSite=Lax` |
| State | `.control-room/state/` | a temp directory per test | outside the repository |
| Ledger | the repository's | a temp directory per test | the repository's |

---

## 10 · The suite

```
node --test .control-room/selftest.mjs      # 55 tests
node .control-room/cli.mjs boundary         # in CI, on every push
```

The sixteen proofs SESSION 21 names are each a test with its number in the title, and each is
proved **against a running server over real HTTP** wherever the claim is about a request — a
claim about what a route does, tested by calling a function, is a claim about a function.

Two shapes the file is arranged to avoid. **A test that passes for the wrong reason:** every
negative test asserts the status *and* the reason, and each is paired with a positive proving
the same path works for somebody who is allowed, because an authorization test that only ever
sees 403 cannot tell "correctly refused" from "broken". **A test weakened to make a change
pass:** the eight synthetic credentials planted in it exist to prove the secret scan fires;
`boundary.mjs` names the file as one of its two exemptions for exactly that reason, and deleting
them to make a check clean is the weakening `docs/AUTONOMY-POLICY.md` prohibition 16 describes.

The suite writes nothing to the repository. It runs in temporary state, record and ledger
directories, and test 10 hashes the **whole tree** before and after an approval.

---

## 11 · What this does not prove

Read this section before quoting anything above.

1. **No real identity provider has ever been contacted.** The OIDC flow is exercised against a
   local stub with a real key pair — signature, issuer, audience, expiry, `iat`, nonce, PKCE
   and state are genuinely checked, and a forged signature, `alg: none`, HS256, a wrong issuer,
   a wrong audience, an expired token and a wrong nonce are genuinely refused — but nothing here
   has spoken to Auth0, Okta, Entra or Keycloak, and this environment's network policy means
   nothing could. Refresh tokens, back-channel logout, token revocation and the `end_session`
   endpoint are **not implemented**.
2. **No deployed Control Room has ever been reached.** The suite starts one on an ephemeral
   loopback port. `control_plane.control_room_availability` reports `unmeasurable` for exactly
   this reason, and 100% would be the more dangerous of the two possible lies.
3. **The publication boundary is inferred, not confirmed.** That `.control-room/` is not served
   follows from GitHub Pages' documented default and from `agent/implement/boundary.mjs`
   reading the tree. The deployed origin has never been fetched (`docs/AUDIT-2026-09-01.md`
   F-12 is the same limitation one layer down).
4. **The secret scan matches known credential shapes.** A clean run is a floor, not a ceiling,
   and it reads only text files.
5. **The audit chain detects edits, not rewrites.** §7 above.
6. **Nothing here has been penetration-tested,** and no threat model beyond SESSION 21's
   sixteen proofs has been worked through. Denial of service is not addressed beyond a body
   limit; there is no rate limiting and no account lockout — under `oidc` those belong to the
   identity provider, and under `local` they are absent, which is one more reason `local` may
   not serve production.
7. **TLS, the reverse proxy and the host are not in this tree.** A production deployment
   terminates TLS in front of this server, and nothing here can check that it did.
8. **`.control-room/state/` is protected by a `.gitignore` rule and a dot prefix.** Neither is a
   security control, and nothing here relies on one being: the request boundary is what stops a
   stranger, and the other two are why a mistake in it would not already have published an
   audit trail.
9. **A passing suite proves the boundary behaves as specified.** It proves nothing about whether
   a proposal a human approved through it was a good idea — which is the whole reason the human
   is there.

---

## 12 · What must not change

- **Do not put a Control Room page in the published tree.** Not under `docs/`, not at the root,
  not as an `admin.html`. The dot prefix is the only publication boundary this repository has,
  and a page outside it is public the moment it is pushed — whether or not it is linked.
- **Do not add a default account, a seeded administrator, or a "first run" bootstrap that
  creates one.** The refusal to start is the feature.
- **Do not add a `--password` flag,** and do not accept a credential in a URL, a query
  parameter or a request body field other than the login form's.
- **Do not let the interface become the authority.** `visibleActions()` is cosmetic and says so
  in its own header; every privileged request is authorized server-side.
- **Do not add a route that can deploy, delete, apply, publish or execute.** `PROHIBITED_ROUTE_WORDS`
  and `.control-room/selftest.mjs` test 10b exist to make that a failing check rather than a
  discussion, and `server.mjs` deliberately imports nothing that could write to the tree.
- **Do not let approval write anywhere but `agent/implement/decisions/decisions.jsonl`,** and
  do not add a second writer of a grant. One home per fact.
- **Do not make `request_changes` a ledger state.** It is a review annotation; giving it a
  state would put a second home under the fact of a decision.
- **Do not relax `DECIDABLE_STATES`.** Approving over a denial makes the denial advisory.
- **Do not remove the strict unknown-field check on the review body.** Silently ignoring an
  unexpected field is safe today and stops being safe the first time somebody adds a field with
  that name.
- **Do not delete the eight planted credentials in the suite,** and do not allow-list a
  directory in `boundary.mjs` — the two exemptions are named files, so a real key added beside
  them is still found.
- **Do not let the local provider out of loopback development.** Both refusals are load-bearing;
  removing either leaves the other looking sufficient.
- **Do not commit `.control-room/state/`.**
