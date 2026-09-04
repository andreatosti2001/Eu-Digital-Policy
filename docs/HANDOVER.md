# HANDOVER

**Last updated:** SESSION 21 · 4 September 2026
**Branch:** `claude/control-room-private-plane-4a36vx`, cut from `origin/main` at `22747e1`.
**Base commit:** `22747e1` on `origin/main` ("Merge SESSION 20: the Website Health
Monitor").
**Merged into `main`.** The session prompt says "Merge to main only after the
complete Control Room security boundary is verified". The boundary was verified,
the branch was pushed, and the merge — a push to `main`, which
`docs/AUTONOMY-POLICY.md` Class D reserves to the repository author by name — was
then **explicitly authorised by the repository author in the session**, after being
shown what was being authorised. That is the permission `AGENTS.md` requires; the
session did not take it on its own reading of the prompt.

**Everything was re-run ON THE MERGED TREE before it was pushed**, not only on the
branch: all sixteen suites (867 pass), the contract check (18/18 satisfiable), the
four validators against the `docs/CURRENT-ARCHITECTURE.md` §12 baseline (0 errors,
106 unverified, the same five `design-qa` warnings by file and line), and both
boundary checks (0 blocking).

**THE STALE-`main` TRAP FIRED AGAIN, and this time on the local branch pointer
rather than on the working tree.** `git fetch --all` first, as AGENTS.md requires:
the working branch was cut from `origin/main` at `22747e1` and is current, but
**local `main` is 52 commits behind `origin/main`** (`4bd1f0d`). Any check run as
`git diff main..HEAD` on this machine would have reported 246 changed files and
67,592 insertions, almost none of them this session's. Every comparison below is
against **`origin/main`**, never against local `main`. This is the third session in
which the trap has caught something (F-01, then SESSION 18/19's 47 commits, now
52).

Local `main` was fast-forwarded to `origin/main` **only at merge time**, once the
author had authorised the merge, and only after `git rev-list --count
origin/main..main` was confirmed to be **0** — that is, the stale pointer carried no
commit of its own that a reset could have destroyed. Check that before resetting a
stale branch; a non-zero count there means somebody's work is about to be lost.

**THE LIVE SITE IS BYTE-FOR-BYTE UNCHANGED**, checked on the merged tree rather
than asserted. `git diff 22747e1 -- data/ js/ css/ i18n/ fonts/ tools/ index.html
applies.html bibliography.html enforcement.html institutions.html instrument.html
instruments.html style.css app.js README.md CLAUDE.md` is **empty**. The Control
Room's suite also hashes the whole tree around a live approval (test 10) and finds
nothing changed.

**So this merge publishes nothing to readers.** Every file it adds is either inside
`.control-room/`, which the deployment does not serve, or in `docs/` and `agent/`,
which are published but which no reader's browser loads. A push to `main` publishes,
and this one changes no page, no dataset, no stylesheet and no locale.

**Nothing that any agent has proposed was approved.** The Control Room can now
record a human decision, and no human decision has been recorded:
`agent/implement/decisions/decisions.jsonl` does not exist, and
`deriveApproval()` still answers `no_request` or `pending` for every proposal.
Building the mechanism and then using it on its first run would have skipped the
decision the whole governance chain exists to require — the same reasoning
SESSION 20 recorded about acting on the monitor's first readings.

---

## Current milestone

**SESSION 21 — complete.** The Human Control Room / private control plane,
`.control-room/`. The reference document is **`docs/CONTROL-ROOM.md`**; this file is the
handover only.

---

# SESSION 21 — the Control Room

## What was built

A **server**, not a page, at `.control-room/`: 20 routes, 8 of them public and all 8
part of the login surface, every other one authenticating and then authorizing
server-side before it answers. Three views — live system, review queue, website
health — plus an audit trail view and a read-only access view. One state-changing
action in the whole system: approve, reject, request changes.

Zero dependencies, no build step, no `package.json`. `node:http`, `node:crypto`
and the global `fetch`, the same constraints as the rest of the repository.

## The four things this session is arranged around

**1 · THE ONE PUBLICATION BOUNDARY THIS REPOSITORY HAS.** SESSION 18 established
that there is no public/private separation here: GitHub Pages serves `main` at the
repository root with no `_config.yml`, no `.nojekyll` and no exclude list, so
`agent/`, `docs/` and the approval ledger are published beside `index.html`, and
`agent/implement/boundary.mjs` says in its own header that a Control Room page
added to this tree "would be public the moment it was pushed."

The exception, which that module already models and already calls "a real
boundary, and it is the only one this repository has", is Jekyll's documented
default: a path whose segments begin with `.` or `_` is not served. It is why
`.agents/` has never appeared in the published surface and `agent/` always has.
So the Control Room is `.control-room/`, and `node .control-room/cli.mjs boundary`
checks on every push — over the real tree, not by assertion — that it is still
outside.

**No `_config.yml` was added.** Adding one would change how the live site is
processed, on a production website with no deploy gate, to solve a problem the
existing exclusion already solves. That is a Class D change to the deployment and
it is not this session's to make.

**2 · THE DOT PREFIX IS NOT A SECURITY CONTROL, AND NOTHING RELIES ON IT BEING
ONE.** Protocol §10 is explicit that a hidden route, a hidden link, `robots.txt`,
a frontend check and an unlisted page are not security mechanisms. Every
privileged request is authenticated and then authorized whether or not anybody
finds the server; `.control-room/state/` is git-ignored as well; and the suite
proves the request boundary against a **running server over real HTTP**, not by
calling functions. The publication boundary is why a mistake in the request
boundary would not already have published an audit trail — it is the second line,
not the first.

**3 · A DEFAULT IS NOT A CONTROL — SESSION 20's FINDING, TURNED INTO REFUSALS.**
The health monitor measured `agent/observability/server.mjs` and found nine of
eleven privileged routes answering an unauthenticated request, its only protection
being that `host` DEFAULTS to loopback. So every dangerous configuration here is a
**refusal to start**, not a default somebody can override: the development
provider in production; the development provider off loopback in any environment
(two independent refusals, so changing one variable does not get round it); any
non-loopback bind outside production; production without an https origin; OIDC
without an issuer or client id; an insecure issuer in production; an idle timeout
that could never fire; and **an empty operator registry**.

**4 · APPROVAL IS AN AUTHORIZATION, NOT AN IMPLEMENTATION.** Approving writes one
line, to `agent/implement/decisions/decisions.jsonl`, through the same
`recordDecision` the CLI calls — one home for the fact of a decision. It changes
no dataset, no page, no stylesheet, no locale; it runs no validator, no build, no
deployment; it touches no git. `git_ref` on the audit entry is `null` at decision
time **by design**: a value there would mean the approval published something.
Test 10 hashes the whole repository before and after a real approval and asserts
nothing changed.

## What is genuinely proved, and how

Sixteen numbered proofs, each against a running server where the claim is about a
request. Two shapes the suite is arranged to avoid:

- **A test that passes for the wrong reason.** Every negative asserts the status
  AND the reason, and each is paired with a positive proving the same path works
  for somebody who is allowed. An authorization test that only ever sees 403
  cannot tell "correctly refused" from "broken", and three of these tests failed
  in draft for exactly that reason — `fetch` follows redirects by default, so
  `GET /` "answered 200" while actually serving the login page.
- **A test weakened to make a check pass.** The eight synthetic credentials in the
  suite exist to prove the secret scan fires; `boundary.mjs` names the file as one
  of its **two** exemptions — named files, not a directory, so a real key added
  beside them is still found.

**One of the eight was reshaped, and it is worth knowing why.** The planted Slack
token was written in the exact `digits-digits-alnum24` shape a real one has, and
**GitHub's push protection refused the push** — which is a scanner above this
repository's own doing its job, on a value that was synthetic but indistinguishable
from a live one at a glance. It now carries an obviously-not-a-token string after the
`xoxb-` prefix — still matched by `SECRET_PATTERNS`' `slack-token` pattern, which is
what the test is for, and the assertion fails if that ever stops being true. The
literal is deliberately **not** reproduced here: `docs/` IS in the published surface,
and `agent/implement/selftest.mjs` R4 caught the first draft of this paragraph for
exactly that reason — a credential shape in a published file is an error whether or
not it is synthetic. The other seven were not touched, and none of them may be deleted
to make a check clean.

The OIDC provider is exercised against a local stub with a **real RSA key pair**:
a genuine login succeeds, and a forged signature, `alg: none`, HS256, a wrong
issuer, a wrong audience, an expired token and a wrong nonce are each refused by
name. That is a real test of the verification path. It is **not** a test against a
real identity provider, and `docs/CONTROL-ROOM.md` §11 says so first rather than
in a footnote.

## Two existing assertions were changed, and why

Both in `agent/health/selftest.mjs`, and both because **the world changed**, not
because they were inconvenient. Named here so a reader can disagree:

- `control_plane.control_room_availability` asserted `not_applicable` with the
  reason "there is no Control Room. SESSION 21 builds it." There is one now, so
  that reading became a metric asserting the absence of a thing this session
  built. It is `unmeasurable` — nothing here measures whether an instance is
  running — and the new assertion is **stricter**: it requires the metric to say
  that 100% would read as "checked and up", and that a bare reachability probe
  would be worse than none, because a Control Room that is up and answering
  everybody is worse than one that is down.
- `control_plane.authn_authz_failures` asserted `unmeasurable` because "there is
  no login". There is one now, and it logs its decisions, so the metric counts
  refusals from the Control Room audit trail — split into failed logins and
  authorization denials, because **a denial is the authorization layer working**
  and a total invites reading that as a problem. What did **not** change is the
  refusal to report an absent trail as zero: the trail is git-ignored per-machine
  state, so a CI runner and a fresh clone have none, and the new test asserts both
  halves.

One metric's IMPLEMENTATION was also brought into line with its own definition.
`control_plane.privileged_endpoints_exposed` is defined as routes "whose only
protection against public reachability is a default that a caller can override",
and it was counting every interface whose bind host is a parameter. Until this
session nothing in the repository had authentication, so the two could not come
apart. They can now: an interface that authenticates and authorizes is not
protected BY the default. The signal lists were not touched, the planted-failure
tests still fire, and the observability viewer is still counted — the finding
against it is unchanged.

## Files changed

**New — `.control-room/`, 20 files:** `config.mjs`, `identity.mjs`, `authn.mjs`,
`authz.mjs`, `audit.mjs`, `decide.mjs`, `views.mjs`, `server.mjs`, `boundary.mjs`,
`cli.mjs`, `selftest.mjs`, `README.md`, `config.example.env`, `state/README.md`,
and `ui/` (login and app: two pages, two stylesheets, two scripts).

**New — `docs/CONTROL-ROOM.md`**, the reference document.

**Modified, all of it control-plane:**

| File | What |
|---|---|
| `agent/health/security.mjs` | `.control-room/server.mjs` registered in `PRIVILEGED_INTERFACES`; `privileged_endpoints_exposed` brought into line with its definition; `why_zero` on the approval-action metric now names both callers of `recordDecision` |
| `agent/health/control.mjs` | the two metrics above |
| `agent/health/gather.mjs` | `readControlRoomAudit()` — reads the trail **by path, not by import**, so the monitor cannot be prevented from running by the thing it measures |
| `agent/health/selftest.mjs` | the two changed assertions, and `control_room_audit` in `fakeCtx` |
| `agent/implement/boundary.mjs` | `.control-room/` added to `CONTROL_PLANE_DIRS` — it reports as excluded by the deployment, which is the first control-plane directory that has ever done so |
| `.github/workflows/qa.yml` | the suite, the Control Room boundary check, the route table, and two more lines in "what this workflow does not prove" |
| `.gitignore` | `.control-room/state/*`, README negated back in |
| `AGENTS.md` | the read list, the suite list, and three hazards that were no longer accurate |

**Not modified:** `data/`, `js/`, `css/`, `i18n/`, `fonts/`, `tools/`, every page,
`style.css`, `app.js`, `README.md`, `CLAUDE.md`.

## Tests

**867 across sixteen suites, 0 failures** (812 across fifteen before). 55 are new;
no existing test count changed. 18/18 contracts satisfiable by their fixture. The
four validators are at the `docs/CURRENT-ARCHITECTURE.md` §12 baseline: 0 errors,
106 unverified, the same five `design-qa` warnings by file and line, and the
boundary check at 0 blocking / 11 warnings.

The Control Room suite writes nothing to the repository: temporary state, record
and ledger directories per test, verified from outside by `git status` afterwards.

## A discrepancy found and NOT reconciled

`docs/CURRENT-ARCHITECTURE.md` §13 still says "**No CI.** There is no `.github/`
directory, no workflow". `.github/workflows/qa.yml` has existed since SESSION 19,
and `AGENTS.md` says "There is now CI." The two disagree. It is reported here
rather than edited, because AGENTS.md's rule is to stop and report a conflict
between the documentation and the code rather than reconciling it silently, and
because §13 is not this session's section. The same paragraph's other claims —
Pages serving `main` from the root, no `_config.yml`, no `.nojekyll` — were
re-read against the tree and are **still true**, which matters because the
Control Room's placement depends on them.

## Known limitations

Every one of these is in `docs/CONTROL-ROOM.md` §11 in full. The four worth
carrying at the front:

1. **No real identity provider has ever been contacted**, and this environment's
   network policy means none could. Refresh tokens, back-channel logout, token
   revocation and `end_session` are not implemented.
2. **No deployed Control Room has ever been reached.** The suite starts one on an
   ephemeral loopback port. `control_plane.control_room_availability` reports
   `unmeasurable` for exactly this reason.
3. **The publication boundary is inferred, not confirmed.** It follows from Pages'
   documented default and from reading the tree; the deployed origin has never
   been fetched (the same limitation as AUDIT F-12, one layer down).
4. **Nothing here has been penetration-tested**, there is no rate limiting and no
   account lockout. Under OIDC both belong to the identity provider; under the
   local provider they are absent, which is one more reason it may not serve
   production.

## Next session

SESSION 22 — the Master Orchestrator. Two things it inherits:

- **The Control Room is not a command console, and §14 of the protocol says the
  Orchestrator must not treat a UI action as unconditional authority.** What the
  Control Room produces is a governed event: a line in the decision ledger, bound
  to a proposal hash, attributable to an authenticated actor. The Orchestrator
  re-derives it — `deriveApproval()` already does, and already discards
  agent-written approval claims by name.
- **`decide.mjs` runs the Implementation Agent's own gates before granting**, so a
  proposal that cannot be implemented cannot be approved. If the Orchestrator
  grows a path that bypasses `preflight()`, that property is gone.

---

# SESSION 20 — the Website Health Monitor

*(the previous milestone, kept for its findings and its refusals. The reference
document is `docs/HEALTH-MONITOR.md`.)*

## What was built

The eleventh agent, and the first whose subject is the SYSTEM rather than any part of it:
the site a reader loads, the corpus that site argues from, and the machinery that produced
both. `docs/AGENT-ROLES.md` §10 has described the Observability role since SESSION 01;
`agent/observability/` gave it a trace model, and this gives it the numbers.

**Forty-four metrics across three domains that are never summed.** 10 public website, 10
knowledge, 24 control plane — the last including the seven security-boundary checks, filed
there because that is what they protect.

## The three refusals this session is built around

**1 · THERE IS NO OVERALL SCORE.** `agent/health/model.mjs` exports `overallScore()`, and it
**throws**, with the reasoning, at the exact place somebody would reach for one. The three
domains fail differently: a broken link costs a reader a click, a false statement about EU
law costs them a decision they cannot take back, and an unaudited approval costs the system
its provenance and is invisible to every reader. A mean says none of that and invites raising
the number by improving the cheapest domain. The refusal is also recorded as a decision on
every run's trace, with the three alternatives that were not taken, so it can be seen to have
held rather than taken on trust.

**2 · `unmeasurable` IS NEVER ZERO.** Three states — `measured`, `unmeasurable`,
`not_applicable` — and an unmeasurable carries a **null** value, a `why`, and what would be
needed. Two metrics can never be measured here and reporting either as 0 would be the exact
substitution `AI-SAFE-BOUNDARIES` §0.3 and §0.4 prohibit:

- **Deployment failures.** No telemetry, and nothing has ever fetched the deployed origin —
  the network policy refuses it.
- **Authentication failures.** A 0 would read as "no failed logins" when the truth is "there
  is no login". The metric points at the MISSING CONTROL instead, which is where a missing
  control belongs.
- **Control Room availability** is `not_applicable`: SESSION 21 builds it, and neither 0% nor
  100% would be true. `agent/observability/server.mjs` is a development viewer, and calling
  it a Control Room would overstate both what exists and what is protected.

Six more public-website metrics report unmeasurable whenever the browser suite did not run. A
report saying "0 console errors" because nobody opened a page would be the worst line this
monitor could produce.

**3 · A LOWER NUMBER IS NOT AUTOMATICALLY HEALTHIER.** Five metrics carry
`direction: 'not_a_score'`, and `defineMetric` **throws** if one is re-labelled — the
unverified count, the provenance gaps, the verification gaps, the blocking open questions and
the rejected proposals. Every cheap route down is a prohibited action under
`AUTONOMY-POLICY.md`: clearing `requires_verification`, attaching a plausible substitute,
bulk-stamping `last_verified`, removing a `blocks` flag. **A rise in the first four is usually
good news** — it normally means somebody examined a record nobody had examined. The CLI marks
them `=` rather than `!`, `summarise()` counts them apart from findings, and `movement()`
reports them in a list that never says "improved".

## Every metric declares eight things, and the model refuses one that does not

Name, definition, source, calculation, update frequency, interpretation, limitations, and
public-or-private — all mandatory, all checked at definition time, so SESSION 20's
requirement is a gate rather than a convention. `limitations` is never empty and the suite
asserts it is longer than a fragment: a metric that cannot say what it fails to see is a
number somebody will quote out of context.

`node agent/health/cli.mjs --metrics` prints the whole register and runs nothing.

## What it found

**PUBLIC WEBSITE** — 9 measured, 1 unmeasurable. Three findings, all already known: 3 browser
regressions, 2 accessibility failures, 1 navigation failure — issues 25, 27 and 28.

**KNOWLEDGE** — 10 measured. Evidence coverage 76.9% of 91 claims. 106 unresolved records,
matching §12 exactly. **15 facts stored in two places with no drift check, one already
drifted** — the `__CONTENT__` hazard AGENTS.md has recorded since SESSION 00, now MEASURED
rather than recalled. 1 contradictory record: issue 18, `rel-kind:complement`. 6 fact-typed
claims whose evidence cannot carry a fact.

**CONTROL PLANE** — 0 agent failures, 0 policy violations, 0 self-approved decisions, 0
misclassified proposals, **0 changes ever applied to the legal record by an agent.**

## The security finding

`agent/observability/server.mjs` serves **eleven `/api/` endpoints** over the whole trace
store — agent inputs and outputs, decisions, approvals, provenance — and performs **no
authentication and no authorization on any of them**. Its only control is that `host`
DEFAULTS to `127.0.0.1`.

**A default is not a control.** `serve({ host })` accepts any value; a caller passing
`0.0.0.0` exposes the entire store with nothing in the request path to object. The monitor
does not infer this: it starts the server on an ephemeral loopback port and asks each route
with no `Authorization` header and no cookie. **Nine of the eleven return data**, two of them
tens of kilobytes. Nothing returns 401, because nothing asks.

That is defensible for a local development viewer, which is what its own header says it is.
It is recorded because **SESSION 21 builds a Control Room**, and one that reused this server
would inherit a privileged API whose only protection is a default somebody can override.

### The false positive that shaped the check

The first draft of `AUTHZ_SIGNALS` counted a bare `403` and reported the server as HAVING
server-side authorization — on the strength of `json(res, { error: 'forbidden' }, 403)` for a
path resolving outside the viewer directory. **That is a path check.** It refuses a traversal
and makes no decision about who the caller is, and counting it turned the largest finding in
the file into a pass. A status code is not a control. The suite now plants exactly that
server and asserts `has_authz` is false.

## A correction to SESSION 18

`publicSurface()` walked the filesystem. Publication is **GitHub Pages serving `main`**, and
`main` carries **tracked files only** — a git-ignored run artifact has never been in a commit
and is not published. The walk reported `agent/records/`, `agent/observability/runs/` and this
session's own health history as PUBLISHED, which is a false alarm, and a security check that
cries wolf about three directories on every run is one people learn to ignore.

It now reads `git ls-files`, reports untracked files separately, distinguishes "excluded by
the deployment" from "absent because nobody committed it", and falls back to the walk **saying
so** when git cannot be consulted — overstating the surface is the safe direction.

**`agent/health/selftest.mjs` found this** by asserting the health record was not in the
published surface, and finding it there.

## Public and private

`publicSubset()` is a **whitelist**. Three deliberate acts are needed before anything
operational reaches a public view: set `visibility`, write a `public_justification`, and pass
the definition gate — which refuses a control-plane metric marked public without one. The
rejected alternative was a `redact()` stripping known-sensitive fields; its failure mode is a
new private metric nobody adds to the deny list, public by default. The whitelist's failure
mode is a public metric left private: a report nobody sees rather than a leak.

**22 publishable, 22 withheld, 0 leaked.** Only two control-plane metrics are public —
proposals awaiting a human, and changes an agent has applied to the site (0, and a reader of a
site about EU law is entitled to know it). `publicReading()` drops `detail` and `evidence`
WHOLESALE rather than filtering named keys, and the suite checks for leaks over the SERIALISED
view rather than the structure, because a structural check verifies the shape somebody wrote.

## The historical record

`agent/health/history/health.jsonl`, append-only, **git-ignored** — and that is a boundary
decision, not a convention: it holds private control-plane data, and this repository publishes
its whole tree. A `.gitignore` entry is not a security boundary and `agent/health/` says so
rather than pretending otherwise.

`movement()` compares against the previous entry with one rule doing most of the work: **a
metric is compared only where both entries measured it.** Comparing a run that had a browser
against one that did not would report six improvements or six regressions depending on which
way round they fell, and both would be fabrications.

## Files changed

```
agent/health/model.mjs            (new — the metric contract, three states, the score refusal)
agent/health/gather.mjs           (new — the evidence once, and the loopback probe)
agent/health/public.mjs           (new — 10 metrics)
agent/health/knowledge.mjs        (new — 10 metrics)
agent/health/control.mjs          (new — 17 metrics)
agent/health/security.mjs         (new — 7 checks, and the route/auth analysis)
agent/health/metrics.mjs          (new — the registry and the public subset)
agent/health/history.mjs          (new — the historical record and movement)
agent/health/monitor.mjs          (new — Agent 10)
agent/health/cli.mjs              (new)
agent/health/selftest.mjs         (new — 55 tests)
agent/health/README.md · agent/health/history/README.md   (new)
docs/HEALTH-MONITOR.md            (new — the reference document)

agent/implement/boundary.mjs      (publicSurface reads git ls-files — the correction above)
agent/implement/checks.mjs        (the health suite joins AGENT_SUITES)
agent/implement/selftest.mjs      (R5 sharpened for the new surface model)
agent/observability/server.mjs    (a `quiet` option, for the probe)
agent/observability/query.mjs     (healthState, into loadTrace)
agent/observability/cli.mjs       (the `health` command)
.github/workflows/qa.yml          (the health job)
.gitignore                        (agent/health/history/, with the reason)
AGENTS.md · docs/AGENT-ROLES.md · docs/HANDOVER.md
```

**Not touched:** every `data/*.json`, every page, everything under `js/`, `css/`, `i18n/` and
`fonts/`, all four validators in `tools/`, `style.css`, `app.js`, `README.md`, `CLAUDE.md`,
and every contract in `agent/schemas/`.

## Tests

| Command | Result |
|---|---|
| `node --test agent/health/selftest.mjs` | **55 pass · 0 fail** (new) |
| `node --test agent/implement/selftest.mjs` | **55 pass · 0 fail** (54 before; R5 gained a test for the corrected surface model) |
| `node --test agent/schemas/selftest.mjs` | 139 — unchanged |
| `node --test agent/ux/selftest.mjs` | 73 — unchanged |
| `node --test agent/detector/selftest.mjs` | 66 — unchanged |
| `node --test agent/integrate/selftest.mjs` | 64 — unchanged |
| `node --test agent/proposals/editorial/selftest.mjs` | 61 — unchanged |
| `node --test agent/architect/selftest.mjs` | 52 — unchanged |
| `node --test agent/proposals/data/selftest.mjs` | 50 — unchanged |
| `node --test agent/verifier/selftest.mjs` | 45 — unchanged |
| `node --test agent/depth/selftest.mjs` | 43 — unchanged |
| `node --test agent/observability/selftest.mjs` | 40 — unchanged |
| `node --test agent/scout/selftest.mjs` | 32 — unchanged |
| `node --test agent/browser/selftest.mjs` | 19 — unchanged |
| `node --test agent/scout/schedule/selftest.mjs` | 18 — unchanged |
| `node agent/schemas/cli.mjs check` | **18/18** satisfiable, exit 0 |
| `node tools/validate.mjs` | **0 errors, 0 warnings, 106 unverified** — matches §12 exactly |
| `node tools/i18n-audit.mjs` | 0 errors, 0 warnings — matches |
| `node tools/design-qa.mjs` | 0 errors, **5 warnings** — the same five as §12, by file and line |
| `node tools/freshness.mjs 2026-09-03` | "Nothing past its stated interval" |
| `node agent/observability/cli.mjs validate` | 0 invalid records from this session's real runs |

**812 tests across fifteen suites, all passing** (756 before this session).

The extra test beyond 756 + 55 is in `agent/implement/selftest.mjs`: R5 gained a check that
the published surface is what git tracks rather than what is on the machine, which is the
correction described under "A correction to SESSION 18" above.

Also run as live verification: `node agent/health/cli.mjs --as-of 2026-09-03` (44 metrics),
`--metrics`, `--public`, `--history`, `--no-browser`, and
`node agent/observability/cli.mjs health --readings`.

## Known limitations

1. **The monitor measures what this repository can see, which is less than what matters.**
   Nothing has fetched the deployed site, no URL has been retrieved, no source document
   opened, no screen reader run, no contrast computed.
2. **Nine metrics report `unmeasurable` in a typical run.** That is the honest state, not a
   gap in the work — but a reader skimming the numbers must read the coverage line, and the
   history stores it for exactly that reason.
3. **The knowledge metrics check the SHAPE of evidence, not what a source says.** A claim
   typed as a fact with a tier:1 source that does not support it passes every check here.
4. **The security checks read source and match signals.** A mechanism they do not recognise
   reads as absent — a false positive, the safe direction, and one the suite tests for by
   planting a server that DOES authenticate.
5. **`PRIVILEGED_INTERFACES` is an allowlist.** A new server nobody registers is not checked.
6. **`incomplete_entities` overstates and `duplicate_facts` understates**, each for a reason
   stated in its own `limitations`.

## Unresolved issues, carried forward

SESSION 19's 1–31 stand unless noted.

2. **No deploy gate — PARTIALLY MOVED.** The validators now run in CI on every
   push (`.github/workflows/qa.yml`, SESSION 18), so a failure is **visible**.
   There is still nothing between a push to `main` and the live site: making the
   workflow blocking needs a branch protection rule, which is repository
   configuration outside this tree and outside any agent's reach.
5. **106 records carry an unverified note.** No session since SESSION 07 has
   moved it; this one does not either.
7. The Source Scout workflow has still never executed on GitHub Actions.
12. `GOVERNANCE_PERMITS` is empty and nothing in `docs/` opens it.
15. Fourteen gap-router proposals exist and nothing decides them.
16. Twenty architecture proposals exist and nothing decides them.
18. `rel-kind:complement` is stored as both symmetric and asymmetric. Still the
    cheapest real decision on the list.
19. Twenty-two editorial recommendations exist and nothing decides them.
20. The markup and `data/claims.json` disagree about what two passages are.
21. Nineteen sentences read as settled over claims graded Unresolved.
23. **New: ten UX findings and five testable proposals exist and nothing decides
    them.** Each is behind a pending approval. **They are proposals, not a work
    order**, and five of them are `human_only` because they change what a reader
    sees on a site with no deploy gate.
24. **New: nine components draw a status this agent could not establish is
    legible without colour.** Not a defect and not a clearance — an open
    question, and the only thing that closes it is somebody opening the page.
    `node agent/ux/cli.mjs --as-of <date> --open` lists them with the bytes.
25. **The site has no navigation in its markup, and the `<noscript>` notice does
    not say so — NOW MEASURED.** SESSION 17 established it by reading the source;
    SESSION 19 loaded `instruments.html` with scripting disabled and confirmed it
    links to none of the six top-level pages. Still not fixed: Class C interface
    work needing a proposal and a decision.
26. **New: `index.html` has no pre-paint theme bootstrap.** The six tool pages
    carry one inline; the brief consults `prefers-color-scheme` in `app.js`
    instead. Noticed while narrowing question 2's false positive and NOT filed
    as a finding — no lens establishes what it costs a reader, and filing it
    would have been an observation dressed as a measurement. Recorded here so the
    next session can decide whether it is one.

27. **New: the skip link is the tenth focusable element in the RENDERED page.**
    Every page carries `<a class="skip-link">` as the first element in `<body>`
    and `design-qa.mjs` confirms it resolves — but `js/shell.js:258` inserts the
    chrome at `document.body.firstChild`, ahead of it. A keyboard reader must tab
    through the whole navigation to reach the link that skips the navigation.
    Invisible to every validator here, because the markup is correct.
    `node agent/browser/cli.mjs --only keyboard`.

28. **New: `enforcement.html` jumps h2 → h5 in its rendered outline.** Each
    pipeline stage renders as an `<h5>` directly under the `<h2>` naming the
    company. `design-qa.mjs` checks heading order in the markup, where those
    headings do not exist — `js/enforcement-page.js` creates them.

29. **New: the whole repository is inside the public deployment.** GitHub Pages
    serves `main` at the repository root with no `_config.yml`, no `.nojekyll`
    and no exclude list, so `agent/`, `docs/` and the approval ledger are
    published alongside `index.html`. **A Control Room page added in SESSION 21
    would be public the moment it was pushed.** This is an INFERENCE from GitHub
    Pages' documented default — nothing here has ever fetched the deployed site,
    and the network policy refuses that origin.
    `node agent/implement/cli.mjs boundary`.

30. **New: the approval ledger is not authentication.** Anybody who can write to
    the working tree can write a grant. It gives one hashed home, git
    attribution, and a refusal of the four forgeries that do not need write
    access — and no more than that. Protocol §11 and §13 want an authenticated
    actor and server-side enforcement, which a static site cannot host.
    `docs/IMPLEMENTATION-QA.md` §9.

32. **New: the privileged API has no authentication and no authorization.**
    `agent/observability/server.mjs` serves eleven `/api/` endpoints over the
    whole trace store and checks nothing; its only control is a bind host that
    DEFAULTS to loopback, and a default is not a control. Measured, not inferred:
    the health monitor starts it on an ephemeral loopback port and finds **nine of
    the eleven return data to a request with no credential**. Defensible for a
    development viewer; **SESSION 21's Control Room must not inherit it.**
    `node agent/health/cli.mjs --as-of <date> --detail`, `docs/HEALTH-MONITOR.md` §6.

33. **New: 15 facts are stored in two places with no drift check, and one has
    already drifted.** The fourteen part titles and the standfirst exist in both
    `data/brief.json` and the `__CONTENT__` blob inlined at `index.html:361`, and
    `meta.standfirst` disagrees between them. AGENTS.md has carried this as a
    hazard since SESSION 00; it is now MEASURED rather than recalled, by
    `knowledge.duplicate_facts`. Still not fixed, and still not a work order.

34. **New: 6 fact-typed claims have evidence that cannot carry a fact** — no
    source, `supports:context` only, or the self-reference placeholder. A claim
    typed as a fact renders as law on the site.
    `knowledge.unsupported_factual_statements`.

35. **New: `.gitignore` is doing the work of a publication boundary for three
    directories.** `agent/records/`, `agent/observability/runs/` and
    `agent/health/history/` all hold control-plane data and are absent from the
    deployment only because nobody committed them. One `git add -f` undoes it and
    nothing in this repository would object. Distinct from issue 29, which is
    about there being no exclusion mechanism at all.

31. **Two UX proposals now assert something that is no longer true.**
    `agent/ux/proposals.mjs` writes "this repository has no browser harness and
    no dependency budget for one" into the open question on every browser test it
    proposes. SESSION 19 built one, with no dependency budget spent. The sentence
    was accurate when written and is not now. **Not edited here** — rewriting
    another agent's recipe to change what its records assert is exactly the
    scope-widening Agent 9 exists to refuse, and it is Agent 8's own file. It
    needs a one-line change in `agent/ux/proposals.mjs` and a re-run.

## Next session

**A — decide something.** Unchanged and now four sessions old. Seventy-one proposals across
four agents, not one decided. SESSION 18 built somewhere for a decision to land:

```
node agent/implement/cli.mjs queue --why
node agent/observability/cli.mjs implement --refusals
node agent/implement/cli.mjs decide --proposal <id> --grant --by "<your name>"
node agent/implement/cli.mjs run --as-of <date> --proposal <id>            # rehearse
node agent/implement/cli.mjs run --as-of <date> --proposal <id> --apply
```

Most proposals fail three gates besides `approved`, and two of those cannot be closed by a
decision at all. Issue 18 remains the cheapest real decision: one field, five records, one
word — and `knowledge.contradictory_records` now reports it on every health run.

**B — dispatch the Source Scout workflow on a real runner.** Unchanged since SESSION 06.

**C — the applied half.** Half-closed since SESSION 18: `ChangeRecord` is produced whenever
something is applied, and nothing has been applied because nothing has been approved.
`WebsiteChange` is still produced by nothing.

**D — do the manual pass.** The perceptual open questions — contrast, screen readers, what a
layout looks like — need a person. `.agents/skills/ux-audit/references/manual-checks.md`.

**E — fix the three defects the browser found**, or decide not to. Issues 25, 27, 28.

**F — new, and it is SESSION 21's problem before it is anybody's: do not let the Control Room
inherit the unauthenticated API.** Issue 32. `agent/observability/server.mjs` has eleven
privileged routes, no authentication, no authorization, and a bind host that is a parameter
with a loopback default. Nine of them answer an unauthenticated request today. A Control Room
built on it would be the failure protocol §11–§13 describes, and the health monitor would
report it on every run — which is not the same as preventing it.

### Exact next objective

**F**, then **A**.

F is SESSION 21's own subject and the monitor has already written the acceptance criteria: a
Control Room is done when `control_plane.privileged_routes_without_auth` and
`control_plane.privileged_routes_without_authz` reach 0, when
`control_plane.privileged_responses_without_authorization` reaches 0, and when
`control_plane.control_room_availability` stops being `not_applicable` **without**
`control_plane.control_room_assets_published` rising above 0. Run

```
node agent/health/cli.mjs --as-of <date> --detail
node agent/health/cli.mjs --as-of <date> --series control_plane.privileged_routes_without_auth
```

before and after. The second command is why the history exists.

A is unchanged and needs no code. Start with the cheapest decision on the list and watch the
whole chain run.

The full chain, every step carrying `parent_run_id`:

```
node agent/verifier/cli.mjs             --records <trace-id>
node agent/integrate/cli.mjs            --records <trace-id> --as-of <date>
node agent/detector/cli.mjs             --records <trace-id> --as-of <date>
node agent/depth/cli.mjs                --as-of <date> --changes <trace-id>
node agent/proposals/data/cli.mjs       --as-of <date> --gaps <depth-trace-id> --refusals
node agent/architect/cli.mjs            --as-of <date> --gaps <depth-trace-id> --aside
node agent/proposals/editorial/cli.mjs  --as-of <date> --changes <detector-trace-id> --no-change
node agent/ux/cli.mjs                   --as-of <date> --propose --open
node agent/browser/cli.mjs
node agent/implement/cli.mjs            run --as-of <date>
node agent/health/cli.mjs               --as-of <date>
node agent/observability/cli.mjs        health --readings
```

## Anything the next agent must know

**SESSION 21's, first:**

- **`git fetch --all` before comparing anything, and compare against
  `origin/main`.** Local `main` on this machine is 52 commits behind. The trap in
  AGENTS.md has now caught something in three separate sessions.
- **An approval is an authorization for a scope, and nothing else happens.** If
  you find yourself expecting the site to change because somebody clicked
  Approve, read `docs/CONTROL-ROOM.md` §6: the Implementation Agent re-derives the
  authorization from the ledger through its own ten gates, and no proposal in this
  repository has ever been decided.
- **A decision is bound to the proposal's fingerprint.** Editing a proposal after
  it was approved VOIDS the approval — deliberately, because it is what stops
  approving something small and then widening it. The fix is a fresh decision
  against the scope the proposal now has, never a re-hash.
- **Roles are re-read from the registry on every request**, not taken from the
  session. `roles_at_login` exists for the audit trail and is never used for a
  decision. If you cache the actor, you have removed that property.
- **The Control Room audit trail is private per-machine state.** It is git-ignored
  and does not travel with a checkout, which is why
  `control_plane.authn_authz_failures` reports `unmeasurable` in CI rather than 0.
  A 0 there would read as "nobody was turned away".
- **The suite proves the boundary behaves as specified.** It proves nothing about
  whether a proposal a human approved through it was a good idea — which is the
  whole reason the human is there. `docs/CONTROL-ROOM.md` §11 has the rest.

Carried forward:

- **`agent/ux/` opens no page, and every record says so in a blocking open
  question.** If you are tempted to soften that — to write "screen readers
  announce this as…", to fill in a contrast ratio from a comment in
  `css/tokens.css`, to describe how something looks — you are making this
  project's own honesty worse than whatever you found. `boundary.mjs` refuses
  the phrasing and the suite proves the refusal fires.
- **An open question is a deliverable, and there are more of them than
  findings.** Deleting one to shorten a report turns "could not be settled
  without opening a page" into "nothing there".
- **A count is not a quote.** Two lenses filed a composed sentence behind a real
  `file:line` and the suite's byte-check caught both. `measurement` is the kind
  for a count, and the locator says what was counted over.
- **The three false positives above are why the checks are shaped as they are.**
  Tokenised class matching, both attribute syntaxes, and "mixed is undecidable"
  each exist because a draft without them reported a defect that was not there.
- **The hypothesis is the one thing in this directory that is not derived**, and
  it is typed as a contested interpretation for that reason. A recipe per lens is
  where it lives; a finding whose lens has no recipe is refused rather than
  improvised.
- **`asOf` is an argument, everywhere.** Unchanged.
- **An `ApprovalRequest` you find in `agent/records/` is a REQUEST.** Agents write
  that directory. If you are tempted to read one whose `state` says `granted` and
  act on it, that state was written by an agent, and `agent/implement/ledger.mjs`
  discards it and says so. A grant lives in `agent/implement/decisions/` and
  requires a named human.
- **A grant is bound to the proposal's hash.** Editing a proposal after it was
  approved VOIDS the approval. That is deliberate — it is what stops approving
  something small and then widening it — and the fix is a fresh decision against
  the scope the proposal now has, never a re-hash.
- **A skipped browser run is never a pass.** `agent/browser/cli.mjs` exits 2 when
  it found no browser, and `agent/implement/` treats a required-but-skipped run as
  a blocking finding. If you find yourself making either of those exit 0 to get a
  green pipeline, you are building the thing the exit code exists to prevent.
- **The eight synthetic credentials in the redaction fixtures are load-bearing.**
  A suite that proves redaction works has to contain something to redact. Do not
  delete them to make `boundary` clean — that is weakening a test to make a check
  pass — and do not allow-list the files, which would hide a real key added to one
  of them later. They are classified and counted.
- **The baseline in `agent/implement/baseline.mjs` is PARSED out of
  `docs/CURRENT-ARCHITECTURE.md` §12.** If you change the numbers there, this
  follows automatically. If you restructure the fenced block so it cannot be read,
  `readBaseline()` throws — on purpose. Do not add a fallback default.
- **A number is not a verdict, and five of them must never be optimised.** The unverified
  count, the provenance gaps, the verification gaps, the blocking open questions and the
  rejected proposals are marked `not_a_score`. If you find yourself trying to move one of
  them, read `docs/HEALTH-MONITOR.md` §4 first: every cheap route down is a prohibited
  action, and a RISE in the first four usually means somebody did real work.
- **`unmeasurable` is not zero, and the monitor will not let you write it as one.** Nine
  metrics report it in a typical run. If you are tempted to make one return 0 so the report
  looks cleaner, you are proposing to report an absence of instrumentation as an absence of
  problems.
- **There is no overall health score and there must not be one.**
  `agent/health/model.mjs overallScore()` throws on purpose. The three domains fail
  differently and a mean says none of it.
- Before declaring anything done: the fifteen `--test` suites,
  `agent/schemas/cli.mjs check`, then the four validators in `tools/`, compared
  against the `docs/CURRENT-ARCHITECTURE.md` §12 baseline — and
  `node agent/browser/cli.mjs` if you touched a page, a stylesheet, a module or a
  locale.

## Anything the next agent must NOT change

Carried forward, still binding. **SESSION 21's, first:**

- **Do not put a Control Room page in the published tree.** Not under `docs/`, not
  at the root, not as an `admin.html`. The dot prefix is the only publication
  boundary this repository has, and a page outside it is public the moment it is
  pushed — linked or not. If a future session needs a broader boundary, that is a
  `_config.yml` exclude list, which changes how the live site is processed and is
  a Class D deployment change, not a convenience.
- **Do not add a default account, a seeded administrator, or a "first run"
  bootstrap that creates one.** The refusal to start with an empty registry is the
  feature. Protocol §11 forbids `"admin"` / `"admin"` or any equivalent from
  existing at all, so none may be created either.
- **Do not let the interface become the authority.** `visibleActions()` is
  cosmetic and says so in its own header. Every privileged request is authorized
  server-side, and test 5 sends the request a hidden button would have prevented.
- **Do not add a route that can deploy, delete, apply, publish or execute.**
  `PROHIBITED_ROUTE_WORDS` and test 10b make that a failing check rather than a
  discussion, and `server.mjs` deliberately imports nothing that could write to
  the tree — no `child_process`, no `writeFileSync`, not the applier.
- **Do not add a second writer of a grant.** `recordDecision` has exactly two
  callers and one home. A third would put the fact of a decision in two places.
- **Do not make `request_changes` a ledger state.** It is a review annotation, it
  leaves `deriveApproval()` reporting `pending`, and that is what is true.
- **Do not relax `DECIDABLE_STATES`.** Approving over a denial through the same
  endpoint makes the denial advisory.
- **Do not remove the strict unknown-field check on the review body.** Silently
  ignoring an unexpected field is safe today and stops being safe the first time
  somebody adds a field with that name. It is what makes "scope cannot be expanded
  through request manipulation" a refusal rather than a hope.
- **Do not let the local development provider out of loopback development.** Both
  refusals are load-bearing; removing either leaves the other looking sufficient.
- **Do not delete the eight planted credentials in `.control-room/selftest.mjs`,**
  and do not allow-list a directory in `.control-room/boundary.mjs` — the two
  exemptions are named FILES, so a real key added beside them is still found.
- **Do not commit `.control-room/state/`.**
- **Do not "fix" `agent/observability/server.mjs` by bolting a token onto it.** It
  is a local development viewer and its own header says so; the finding against it
  stands, unchanged, and merging it with the Control Room would give a development
  tool a security model nobody tests.

Everything from before, still binding:

- Do not rebuild the site. No framework, no bundler, no build step, no
  dependency, no service worker, no server-side rendering.
- **Do not act on a UX proposal because it exists.** Fifteen records are
  outstanding, five of them `human_only` changes to what a reader sees, on a site
  where a push to `main` publishes and there is no deploy gate. They are
  proposals, not a work order.
- **Do not fix the three defects the browser found on your own initiative.**
  Issues 25, 27 and 28 are real, reproducible and reader-facing, and every one of
  them is Class C interface work: a proposal, then a human decision. A measured
  defect is not an authorisation.
- **Do not make `.github/workflows/qa.yml` a deploy gate by editing the workflow.**
  It cannot be one from inside this tree — blocking needs a branch protection
  rule, which is repository configuration. A workflow that CLAIMED to gate
  deployment would be worse than one that says plainly it does not.
- **Do not delete an `unmeasurable`, a `not_a_score` label, or the `overallScore()` throw.**
  Each is load-bearing, each makes a report longer and less satisfying, and each exists
  because the shorter version would be a lie.
- **Do not commit `agent/health/history/`.** It holds private control-plane data and this
  repository publishes its whole tree.
- **Do not add a `package.json`.** `agent/browser/` exists to prove the browser
  suite did not need one. Adding it later to "simplify" that code would spend the
  Class D budget the whole design avoided.
- Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative. It
  now has THREE reports — an architecture finding, an editorial finding, and this
  session's measurement of what it costs — and three reports are no more a work
  order than one.
- Do not modify `data/*.json` or any page in a session not scoped for that work.
- Do not touch the footer's non-affiliation or no-legal-advice text, `TIER_GRADE`
  in `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in
  `tools/_footer.mjs`.
- Do not declare a licence. Do not soften the README's known limitations or the
  unverified-record count. Do not re-run `tools/_refsweep.mjs` or
  `tools/_review10.mjs`.
- **Do not let a UX finding carry a drafted value.** The contract refuses it, the
  suite asserts it over every record, and SESSION 16's brief says the agent does
  not redesign the site. Loosening it is the one change in `agent/ux/` that
  cannot be made safely.
- **Do not let a proposal invent a design token.** Two checks exist because
  either alone could be edited away: `agent/ux/tokens.mjs` reads the stylesheets,
  and the contract requires an open question for any token added.
- **Do not remove the `measurement` evidence kind from this agent's output** by
  making every extract a `repository_file`. A count filed as a quote is a
  fabrication with a checkable-looking locator.
- **Do not turn an open question into a finding** to make the audit look more
  decisive, and do not turn one into a clearance. Nine components are neither
  legible nor illegible on this evidence, and saying either would be inventing a
  result.
- Do not reimplement `evidenceGrade` or `familyOf` in the agent layer.
- Do not add `retrieved_document` to `MINTABLE_EVIDENCE`.
- Do not add an id store, and do not change the id shapes in
  `agent/observability/ids.mjs`.
- Do not relax the contract gateway's rejection of anything malformed or
  `simulated`.
- Do not move `degraded` into a stored field. Do not move redaction to the read
  path, and do not raise `MAX_STRING`.
- Do not add an entry to `GOVERNANCE_PERMITS` without the repository owner naming
  the document that grants it.
- Do not relax the rule that `create_taxonomy_term` is `human_only`, and do not
  let `agent/architect/` propose a taxonomy term.
