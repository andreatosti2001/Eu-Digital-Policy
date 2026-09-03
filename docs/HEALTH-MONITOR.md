# The Website Health Monitor — Agent 10

**SESSION 20.** `agent/health/`.
**Status:** operational. 44 metrics across three domains, measured separately and never summed.
**Read with:** `docs/BROWSER-QA.md` (where six public-website metrics come from),
`docs/IMPLEMENTATION-QA.md` (where the boundary checks began), `docs/OBSERVABILITY.md`.

---

## 1. Three domains, and why they are never added together

SESSION 20: *"Do not collapse these into a single raw score."* This repository has a specific
reason to mean it, and it is not aesthetic. The three domains fail differently:

| Domain | Metrics | What a failure costs |
|---|---|---|
| **PUBLIC WEBSITE** | 10 | A reader cannot use the site, or is shown something broken. **Recoverable by a fix.** |
| **KNOWLEDGE / CONTENT** | 10 | A reader is told something false about EU law and may act on it. **Not recoverable by a fix** — it is a harm that already happened. |
| **PRIVATE CONTROL PLANE** | 24 | The system cannot say what it did or on whose authority. **Invisible to every reader**, and it is what all the other guarantees rest on. |

An arithmetic mean of the three says none of that, and it invites raising the number by
improving the cheapest domain. So there is no mean, no percentage and no grade anywhere in
the output — and `agent/health/model.mjs` exports `overallScore()`, **which throws**, with the
reasoning, at the exact place somebody would reach for one. The refusal is also recorded as a
decision on every run's trace, with the three alternatives that were not taken, so a later
reader can see it held rather than take it on trust.

The 24 in the control plane includes the seven security-boundary checks. They are filed there
rather than as a fourth domain because that is what they protect.

---

## 2. Every metric declares eight things, and `defineMetric` refuses one that does not

SESSION 20 requires name, definition, source, calculation, update frequency, interpretation,
limitations, and public-or-private. All eight are mandatory fields;
`agent/health/model.mjs` throws on a metric that omits any, so the requirement is a gate
rather than a convention somebody keeps. Two more are required on top:

- **`direction`** — `lower_is_better` · `higher_is_better` · **`not_a_score`** (§4).
- **`measure(ctx)`** — a pure function of one gathered snapshot.

`limitations` is never empty, and the suite asserts it is longer than a sentence fragment. A
metric that cannot say what it fails to see is a number somebody will quote out of context.

```
node agent/health/cli.mjs --metrics
```
prints the whole register — all forty-four, with all eight fields — and runs nothing.

---

## 3. Three measurement states, and `unmeasurable` is never zero

| State | Means |
|---|---|
| `measured` | a number, with the calculation that produced it |
| `unmeasurable` | **nothing here can see this**, with `why` and `needs` |
| `not_applicable` | the thing being measured does not exist yet |

Several things SESSION 20 asks for cannot be measured in this repository, and reporting any
of them as `0` would be the substitution `docs/AI-SAFE-BOUNDARIES.md` §0.3 and §0.4 prohibit:

- **Deployment failures.** There is no deployment telemetry, and no session has ever fetched
  `https://andreatosti2001.github.io/Eu-Digital-Policy/` — outbound access to that origin is
  refused by this environment's network policy (`CURRENT-ARCHITECTURE` §13). Nothing here can
  see whether a publication succeeded, failed, or served something different from the tree.
- **Authentication and authorization failures.** There is no authentication anywhere. A `0`
  would read as *"no failed logins"* when the truth is *"there is no login"* — so the metric
  is unmeasurable and points at the **missing control** instead, which is reported by
  `control_plane.privileged_routes_without_auth`.
- **Control Room availability.** `not_applicable`: SESSION 21 builds it. Neither 0% nor 100%
  would be true. `agent/observability/server.mjs` is a local development viewer and calling it
  a Control Room would overstate both what exists and what is protected.
- **Six public-website metrics** whenever the browser suite did not run. A health report
  saying *"0 console errors"* because nobody opened a page would be the single worst line this
  monitor could produce.

`gather()` collects the evidence **once**, with a date and a commit, so two metrics cannot
disagree about the tree they measured — and the history stores a `coverage` block, so a `0`
taken with no browser is distinguishable six months later from a `0` taken with one.

---

## 4. A lower number is not automatically healthier

SESSION 20 states it. Five metrics carry `direction: 'not_a_score'`, `NOT_A_SCORE_METRICS`
names them, and `defineMetric` **throws** if one is re-labelled:

| Metric | Why it must not be optimised |
|---|---|
| `knowledge.unresolved_claims` | The 106 unverified records are the project's honesty (`AI-SAFE-BOUNDARIES` §0.7). Every cheap route down — clearing `requires_verification`, bulk-stamping `last_verified`, deleting the note — is a **prohibited action** under every autonomy class. |
| `knowledge.provenance_gaps` | §0.2: an asterisk means the reference is **missing**, not doubted. It is removed by finding the publication, never by attaching something related. A fall produced by a plausible substitute is worse than the gap, because it looks resolved. |
| `knowledge.verification_gaps` | Setting `last_verified` on a record nobody read is prohibited action 2; bulk-stamping is prohibited action 3. |
| `control_plane.unresolved_conflicts` | A blocking open question is an agent refusing to proceed as if it had settled something. Removing the flag converts *"could not be established"* into *"established"*, silently, across everything downstream. |
| `control_plane.rejected_proposals` | A rejection is the governance system **working**. An agent shown this as a number to reduce would learn to propose less, or to propose only what is easy to approve. |

**A rise in the first four is usually good news** — it normally means somebody examined a
record nobody had examined and found it wanting, which is the corpus getting more honest. The
CLI marks them `=` rather than `!`, `summarise()` counts them apart from findings, and
`movement()` reports them in a separate list that never says "improved".

---

## 5. What it measures today

As at **2026-09-03**, with the browser suite and the loopback probe:

**PUBLIC WEBSITE** — 9 measured, 1 unmeasurable. Three findings, all already known and all
carried in `docs/HANDOVER.md`: 3 browser regressions, 2 accessibility failures, 1 navigation
failure. Validation, localization, rendering, search, console errors and internal links are
clean against their recorded baselines.

**KNOWLEDGE** — 10 measured. Evidence coverage 76.9% of 91 claims; 106 unresolved records
(matching §12 exactly); **15 facts stored in two places with no drift check, one of which has
already drifted** — the `__CONTENT__` hazard AGENTS.md records, now measured rather than
recalled; 1 contradictory record (handover issue 18, `rel-kind:complement`); 6 fact-typed
claims whose evidence cannot carry a fact.

**CONTROL PLANE** — 22 measured, 1 unmeasurable, 1 not applicable. 0 agent failures, 0 policy
violations, 0 self-approved decisions, 0 misclassified proposals, 0 changes ever applied to
the legal record by an agent. 35 proposals awaiting a human. **And the security findings in
§6.**

---

## 6. The security boundary

Seven checks. None asks whether something is *linked*, *hidden*, *unlisted* or hard to guess —
SESSION 20 forbids treating any of those as evidence of protection. Each asks a structural
question, and six read source rather than probing, because a request-based check tests the
configuration this machine happens to be running and the question is **what the code permits**.

| Check | Today |
|---|---|
| Secrets in public assets | **0 blocking.** The 60 files a reader's browser loads carry no credential. Eight synthetic credentials live in the fixtures that prove `redact.mjs` works; they are classified and counted, never suppressed. |
| Privileged endpoints exposed publicly | **11 routes.** |
| Control Room assets published | **0** — and *not a clearance*: there is no exclusion mechanism, so a Control Room page added in SESSION 21 would be published the moment it was pushed. |
| Privileged routes with no authentication | **11.** |
| Privileged routes with no server-side authorization | **11.** |
| Approval actions reachable without authorization | **0**, with the reason recorded: the only code path that writes a grant is a CLI command, and no HTTP interface can reach it. |
| Privileged API responses served without authorization | **9 of 11**, verified by probe. |

### The finding

`agent/observability/server.mjs` serves eleven `/api/` endpoints over the whole trace store —
agent inputs and outputs, decisions, approvals, provenance — and performs **no authentication
and no authorization on any of them**. Its only control is that `host` *defaults* to
`127.0.0.1`.

**A default is not a control.** `serve({ host })` accepts any value; a caller passing
`0.0.0.0` exposes the entire store with nothing in the request path to object. The loopback
probe confirms the consequence rather than inferring it: started on an ephemeral loopback
port and asked with no `Authorization` header and no cookie, **nine of the eleven routes
return data**, two of them tens of kilobytes. Nothing returns 401, because nothing asks.

That is a defensible design for a local development viewer, which is what its own header says
it is. It is recorded because **SESSION 21 builds a Control Room**, and a Control Room that
reused this server would inherit a privileged API whose only protection is a default somebody
can override.

### The false positive that shaped the check

The first draft of `AUTHZ_SIGNALS` counted a bare `403`, and reported the server as *having*
server-side authorization — on the strength of `return json(res, { error: 'forbidden' }, 403)`
for a path resolving outside the viewer directory. **That is a path check.** It refuses a
traversal; it makes no decision about who the caller is. Counting it turned the largest
finding in the file into a pass. A status code is not a control, and
`agent/health/selftest.mjs` now plants exactly that server and asserts `has_authz` is false.

### A correction to SESSION 18

`publicSurface()` originally walked the filesystem. Publication is **GitHub Pages serving
`main`**, and `main` carries **tracked files only** — so a git-ignored run artifact, which has
never been in a commit, is not published. The filesystem walk reported `agent/records/`,
`agent/observability/runs/` and this session's own health history as *published*, which is a
false alarm; a security check that cries wolf about three directories on every run is one
people learn to ignore. It now reads `git ls-files`, reports untracked files separately, and
falls back to the walk **saying so** when git cannot be consulted — overstating the surface is
the safe direction. `agent/health/selftest.mjs` caught this by asserting the health record was
not in the published surface and finding it there.

---

## 7. Public and private

> The public website MUST NOT expose private Control Plane health data unless an explicitly
> defined public-safe subset is intentionally published.

`publicSubset()` is a **whitelist**, not a filter. Three deliberate acts are required before
anything operational can reach a public view: set `visibility: 'public'`, write a
`public_justification`, and pass the definition gate — `model.mjs` refuses a control-plane
metric marked public without one.

The rejected alternative was a `redact()` that strips known-sensitive fields. Its failure mode
is a new private metric nobody adds to the deny list, which is then public by default. The
whitelist's failure mode is a public metric accidentally left private: a report nobody sees
rather than a leak.

**22 metrics are publishable** — the ten public-website metrics, the ten knowledge metrics,
and exactly two from the control plane:

- `proposals_awaiting_a_human` — the size of the queue between the agent layer and the site.
- `agent_changes_applied_to_the_site` — **0**, and a reader of a site about EU law is entitled
  to know whether an AI has written anything into what it says about the law.

**22 are withheld**, and the public view states the *count* — pretending the private domain
did not exist would be a different kind of dishonesty. `publicReading()` drops `detail` and
`evidence` **wholesale** rather than filtering named keys, because the next metric to add a
sensitive key will not be on the list. The suite asserts no private metric id appears anywhere
in the serialised public view, checked over the string rather than the structure.

Nothing publishes by default. `--publish <path>` is the only writer, and it prints what it
wrote.

---

## 8. The historical record

`agent/health/history/health.jsonl`, one line per run, append-only, **git-ignored** — see
`agent/health/history/README.md` for why that is a boundary question rather than a convention.

`movement()` compares a run against the previous one, with one rule that does most of the
work: **a metric is compared only where both entries measured it.** Comparing a run that had a
browser against one that did not would report six improvements or six regressions depending on
which way round they fell, and both would be fabrications. Everything else is reported as a
*coverage change*, and not-a-score movements go in their own list.

```
node agent/health/cli.mjs --as-of <date> --history
node agent/health/cli.mjs --as-of <date> --series knowledge.evidence_coverage
```

---

## 9. Observability

One span per domain — never one for all three — an observation per metric carrying **all eight
declared fields alongside the reading**, a census reporting the three sets of totals side by
side, the score refusal as a decision with its alternatives, a coverage observation, a
public-subset observation naming anything leaked, and a `NOTHING CHANGED` claim checked by
hashing the repository around the run.

`healthState()` derives the view at read time: `node agent/observability/cli.mjs health
[--readings] [--domains]`. Its gap list reports a run with no census, no coverage, no subset
check, no score refusal or no "nothing changed" claim — and a run whose census reports
anything other than three domains.

---

## 10. Limitations

1. **The monitor measures what this repository can see, which is less than what matters.**
   Nothing has fetched the deployed site, no URL has ever been retrieved, no source document
   has been opened, no screen reader has run and no contrast has been computed.
2. **Nine metrics report `unmeasurable` in a typical run and two can never be measured here.**
   That is the honest state, not a gap in the work — but a reader skimming the numbers must
   read the coverage line, and the history stores it for exactly that reason.
3. **The knowledge metrics check the SHAPE of evidence, not what a source says.** A claim
   typed as a fact, with a tier:1 primary source that does not actually support it, passes
   every check here and is exactly as wrong.
4. **The security checks read source and match signals.** A mechanism they do not recognise is
   reported as absent — a false positive, which is the safe direction, and one the suite tests
   for by planting a server that *does* authenticate.
5. **The allowlist problem.** `PRIVILEGED_INTERFACES` is checked; a new server nobody adds to
   it is not. That is the standing weakness of every allowlist and it is not solved here.
6. **`incomplete_entities` overstates.** A `null` meaning *not researched* and one meaning
   *researched and not determinable* are indistinguishable in most datasets, and §0.3 says they
   are different states.
7. **`duplicate_facts` understates.** It compares the part titles and the standfirst — the
   fields whose drift is established. The inlined blob also holds the prose and a search index,
   which are not stored in comparable form. It is a floor, not a measurement.
8. **The monitor's own trace is excluded from its control-plane metrics.** Without that it
   reads its own in-flight run and reports two spans left running — true of the process doing
   the measuring and false of everything it measures. Observed on the first full run of this
   session: 0 incomplete traces before the monitor existed, 2 after.
