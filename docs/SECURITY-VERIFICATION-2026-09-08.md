# Security verification — SESSION 23.5

**The gate:** control plane security and autonomy boundaries, verified adversarially before the
end-to-end simulation.
**Run:** 8 September 2026, `node agent/policy/verify/cli.mjs`.
**Result:** 65 attacks across seven areas — **61 failed safely · 0 succeeded · 2 partial ·
2 undecidable.** The repository was byte-identical afterwards, measured by hashing the tree
around the run.

**Nothing in this report has been fixed.** SESSION 23.5's instruction is explicit — *"Do NOT
use this session to fix identified defects"* — and the reason is worth stating rather than
only obeying: a session that both finds and fixes leaves no independent record of what the
system was like before it was told. Each finding below carries a severity, evidence, the
affected component and a recommended remediation, and every remediation is a later session's
to decide. **Session 24 must not silently repair any of them either.**

---

## 1 · How to re-derive this

```
node agent/policy/verify/cli.mjs              the report
node agent/policy/verify/cli.mjs --json       the whole record, attack by attack
node agent/policy/verify/cli.mjs --area authorization
node --test agent/policy/verify/selftest.mjs  is the gate itself reproducible
```

Exit 0 the gate ran · 1 an attack **succeeded** · 2 the gate could not run.

`agent/policy/verify/selftest.mjs` runs the whole gate **twice** and asserts the two runs agree
on which attacks exist and on what happened to each. That is the slowest suite in the
repository and the cost is the point: a gate whose result depended on the order its own attacks
ran in would be reporting noise as security. It also asserts that all seven areas are covered,
that an `undecidable` is never counted as a pass, that every finding carries a severity and
evidence, and that the run wrote nothing.

Every world the gate attacks is a temporary directory — its own Control Room on an ephemeral
loopback port, its own record store, its own ledger, its own trace store. **The repository's own
`agent/records/`, `agent/implement/decisions/` and `.control-room/state/` are never read or
written.**

---

## 2 · The four outcomes, and why there are four

| Outcome | Meaning |
|---|---|
| `failed_safely` | The attempt was refused, and the refusal names a reason rather than being an error |
| `succeeded` | The boundary was crossed. **A finding.** |
| `partial` | Something less than the boundary was obtained. **A finding**, at a lower severity, never rounded down |
| `undecidable` | The attempt could not be carried out here. **Not a pass** |

The third and fourth are the ones that matter. A gate with only pass and fail has to call an
untested boundary a passed one, and this environment genuinely cannot test two of the
boundaries SESSION 23.5 names.

---

## 3 · Coverage

| Area | Attacks | Result |
|---|---|---|
| Public / private boundary | 9 | 7 failed safely · 1 partial · 1 undecidable |
| Hidden Control Room entry | 8 | 8 failed safely |
| Authorization | 10 | 10 failed safely |
| Agent boundaries | 6 | 5 failed safely · 1 undecidable |
| Autonomy policy | 22 | 22 failed safely (including one control) |
| Approval integrity | 5 | 5 failed safely |
| Observability | 5 | 4 failed safely · 1 partial |

---

## 4 · Findings

### F-23.5-01 · The control-plane directories are inside the published surface

**Severity: HIGH.** *Pre-existing; re-measured, not quoted.*
**Component:** the GitHub Pages deployment · `agent/implement/decisions/` ·
`agent/observability/runs/` · `agent/health/history/` · `agent/records/`
**Attack:** PP-08.

**Evidence.** `publicSurface()` over the tracked tree reports **217 files under `agent/` and
`docs/` inside the published surface**, including the whole agent layer's source. No
operational record is published *today* — the four record directories are git-ignored — but two
placeholder `README.md` files (`agent/health/history/README.md`,
`agent/implement/decisions/README.md`) are tracked and published, which is direct evidence that
those **directories** are inside the deployment.

**Why it is a finding.** The ignore rule is what keeps the records out, and **an ignore rule is
not a boundary.** One `git add -f agent/implement/decisions/decisions.jsonl` publishes the
approval ledger — who approved what, when, and against which proposal hash — and nothing in this
repository would object. Protocol §10 puts orchestration, approval mechanisms and operational
traces in the private control plane; the source of all three is public here, and the records are
one command away from being public.

**Recommended remediation** (not applied): the exclusion mechanism that already works is the dot
prefix — it is why `.agents/` and `.control-room/` have never been in the published surface. The
control-plane record directories could move behind it, or a `_config.yml` with an explicit
exclude list could be added. Both are Class D changes to a live deployment with no deploy gate,
and both need the repository author. `docs/IMPLEMENTATION-QA.md` §6 carries this as a standing
finding and has since SESSION 18.

---

### F-23.5-02 · The observability viewer authenticates nothing, and still exists

**Severity: HIGH.** *Pre-existing; confirmed unchanged, not re-measured.*
**Component:** `agent/observability/server.mjs`
**Attack:** OB-05.

**Evidence.** The module serves eleven `/api/` routes over the whole trace store — agent inputs
and outputs, decisions, approvals, provenance — and checks no credential. Its only protection is
that `host` **defaults** to `127.0.0.1`, and `serve({ host })` accepts any value. A default is
not a control. `agent/health/` measures this by starting the server on an ephemeral loopback
port and finding **nine of the eleven routes answer a request with no credential**
(`docs/HEALTH-MONITOR.md` §6).

**What this gate did and did not do.** It confirmed the module is unchanged and that the finding
stands. **It did not re-run the measurement**, and says so rather than reporting a number it did
not take.

**Why it is a finding rather than a defect in the Control Room.** SESSION 21 did not inherit it:
`.control-room/server.mjs` is a separate server that authenticates and then authorizes every
privileged request, and the gate's own PP-01 to PP-06 confirm that across twelve private routes.
The viewer is a local development tool.

**Recommended remediation** (not applied): AGENTS.md's existing instruction is the right one and
should stay — do not point a Control Room at the viewer's routes, and do **not** bolt a token
onto the viewer, because that would give a development tool a security model nobody tests. The
decision to take is whether the viewer should refuse to start off loopback at all, the way
`.control-room/config.mjs` refuses eight dangerous configurations outright.

---

## 5 · Undecidable — boundaries this environment could not test

Neither is a pass, and neither is a defect. Both are limits of the verification.

### U-23.5-01 · The deployed origin has never been fetched

**Attack PP-09.** Nothing here has ever requested
`https://andreatosti2001.github.io/Eu-Digital-Policy/`; the network policy refuses it, and
`docs/CURRENT-ARCHITECTURE.md` §13 and AUDIT F-12 both record that **no URL in this repository
has ever been retrieved.** So the publication boundary — including F-23.5-01 above, and
including the claim that `.control-room/` is not served — is **inferred** from Jekyll's
documented default and from reading the tree, and has never been confirmed against the thing it
is about.

**Would settle it:** an environment with outbound access to the deployed origin, requesting
`.control-room/`, `agent/records/` and `agent/implement/decisions/` against it.

### U-23.5-02 · There is no Master Orchestrator to attack

**Attack AB-06.** SESSION 22 was not built. There is no `agent/orchestrator/`, and AGENTS.md
lists eleven agents with no coordinator among them. Attack AB-02 exercises the **policy row**
that describes what an orchestrator may and may not do — six privileged actions, all refused —
and that row is a **specification**, not a description of anything running.

**Would settle it:** SESSION 22. Until then, every claim about orchestrator behaviour in
`docs/AUTONOMY-AUTHORIZATION-POLICY.md` §7 should be read as a specification.

---

## 6 · What held, and what the evidence for that is

Sixty-one attempts were refused, and the ones worth naming individually are these.

**The Control Room's request boundary.** All twelve private routes refused an anonymous
request and none answered with data (PP-01). Six named privileged endpoints refused, and no
refusal body carried a proposal id, an operator id or a decision (PP-02). Fourteen path
variants — traversal, percent-encoding, casing, duplicated separators, a null byte, `..%2f` —
all refused (PP-04). Five alternate methods refused; `TRACE` **could not be sent by Node's
fetch and is recorded as untested rather than as passed** (PP-05). Four fabricated session
cookies refused on both a read and a write (PP-06). A session cookie without the CSRF token
refused (AZ-10).

**Authorization, with paired positives.** A viewer, a reviewer and an operator were each
refused `403` on approve — **and an administrator approving the same proposal succeeded**, which
is what makes the three refusals meaningful (AZ-01). An approver was refused a `human_only`
proposal, because the permission required is computed from the proposal's own autonomy class
rather than from the request (AZ-02). A rejected proposal could not be approved over its
denial (AZ-03). A nonexistent proposal, a mismatched fingerprint, and a replay were all
refused (AZ-04, AZ-05, AZ-07). A body carrying `files`, `permitted_files`, `operations`,
`autonomy_class` and `scope: "*"` did not widen anything (AZ-06). A disabled administrator
could not log in, and `authorize()` refuses an actor holding no role — the identity layer
additionally **refuses to provision a role-less operator at all** (AZ-08).

**Approval integrity.** An `ApprovalRequest` edited to `state: "granted"` with a plausible
human name in its decision block authorised nothing, and the claim was **reported as discarded
rather than silently dropped** (AI-01). A hand-written ledger line with a forged hash derived
`void_scope_changed` (AI-02). Passing `approval`, `approved`, `grant`, `force` and
`skip_checks` into `mayExecute()` changed nothing, because none of them is a parameter (AI-03).
A decision left `index.html` byte-identical and recorded `git_ref: null` (AI-04). A grant did
not follow a proposal that was widened after it was decided (AI-05).

**The autonomy policy, against a control.** Twenty prohibited acts, all refused: no provenance,
a failed verification, no verification at all, conflicting evidence, a failing validator run, a
validator that could not run reported as a pass, a visual change with the browser suite skipped,
no rollback path, an out-of-scope file, a never-writable file, an ambiguous legal status, an
editorial interpretation, a legal conclusion, a schema change, a taxonomy change, a deletion, a
40-operation rewrite, a risk above the ceiling, a proposal declaring itself `autonomous`, and a
simulated record. **AP-00 is the control**: a clean act under a policy that enables its category
*is* permitted, so the twenty refusals are refusals rather than a broken evaluator. AP-21 then
confirms that under the policy this repository actually ships, **even the clean act is refused**
— `enabled_categories` and the path allowlist are both empty.

Six of those twenty were stopped one layer earlier than the probe aimed at: the **inter-agent
contract** refused the record before the policy needed to. The gate says so on each, because
letting a reader assume the autonomy condition caught it would overstate what was tested.

**Agent boundaries.** Eight specialist agents × six forbidden actions, all refused by a named
rule — and the paired positive holds, the same agent may still create a proposal (AB-01). Seven
escalation parameter names × four component/action pairs: none carried a capability, and
**every attempt was recorded on the decision** rather than ignored (AB-05). Implementation/QA
with no grant in the ledger was refused (AB-03). The deployment system was refused `publish` by
a rule that names the action rather than by its absence (AB-04).

**The hidden entry.** `js/threshold.js` contains none of thirteen privileged constructs in its
executable code (HE-01). Eight probes of the search provider returned nothing but the single
inert item (HE-02). Four claims that the animation had been completed — as headers and as
cookies — were refused `401`/`403`, because **nothing server-side reads the phrase** (HE-03).
The phrase appears in no `.control-room/` or agent code path (HE-04). `GET /` is refused
anonymously while `GET /login` answers `200`, so discovering the URL is not access (HE-05). No
published page declares `<meta name="eu-control-room">` (HE-06). With no `document`, `passage()`
returns `null` rather than throwing (HE-07). The phrase submitted as a query, a header, a body
field and a cookie changed no server-side answer (HE-08).

**Observability.** 48 refusals on the audit trail, each carrying an action, an actor or a
request, a reason and an outcome (OB-01). 63 audit entries scanned against eleven credential
patterns and the operator password: **none matched** (OB-02). The trail distinguishes four
outcomes, so a refusal cannot be mistaken for a success (OB-03). Every unmet policy condition
carries both a reason and what would close it (OB-04).

---

## 7 · Two defects in the gate itself, found and corrected before this report

Recorded because a verification whose own errors are invisible is not a verification, and both
are the same failure shape the browser suite hit in SESSION 19: **a check that fails for the
wrong reason.**

1. **HE-01 reported a CRITICAL finding against a sentence.** The first version substring-matched
   forbidden words over the whole of `js/threshold.js`, and the module's own header says *"It
   holds no token, no session, no credential"* — so `token` matched, and the gate cried critical
   over prose asserting the opposite. It now strips comments before scanning and **keeps string
   literals**, because a credential would be one.
2. **PP-08 reported two README files as leaked decisions.** `agent/health/history/README.md` and
   `agent/implement/decisions/README.md` are placeholders explaining why a directory is empty,
   not operational records. The check now separates *is a record published* (no) from *is the
   directory inside the published surface* (yes) — and the second is the real finding, at its
   real severity.

A third, in the policy rather than the gate, was found by `agent/policy/selftest.mjs` test 5
during SESSION 23 and is named here because it is the kind of thing this gate exists to catch: a
condition's `data` object carrying a key named `verdict` **overwrote the condition's own
verdict**, turning `failed` into a word the engine matched as neither satisfied nor unmet — so an
act that should have been blocked evaluated as `automatic`. It is fixed, and
`evaluateConditions()` now throws on any verdict outside the four it defines, so it cannot recur
elsewhere.

---

## 8 · What this verification does not establish

1. **Nothing here has been penetration-tested by a person.** This is an automated gate written
   by the same session that built what it attacks, which is the weakest form of independence
   there is. It is independent of the *implementation* — separate module, separate vocabulary,
   attacks rather than assertions — and it is not independent of the *author*.
2. **No real identity provider has ever been contacted** (`docs/CONTROL-ROOM.md` §11). The OIDC
   path is exercised against a local stub. Rate limiting and account lockout are absent under
   the development provider.
3. **The deployed site has never been fetched** — U-23.5-01, and it is the load-bearing gap in
   §4's first finding.
4. **Timing, side channels, and resource exhaustion were not attempted.**
5. **The autonomy policy is not a boundary between processes.** Four of its twelve conditions
   are supplied facts, and anything running in the same process can supply them.
   `docs/AUTONOMY-AUTHORIZATION-POLICY.md` §4 and §10 say so at length; this gate confirms the
   *default* is safe (absent means unknown means blocked) and does not claim the gap is closed.
6. **The secret scan matches credential SHAPES.** A credential it does not match is a credential
   it did not find, and a clean run is a floor rather than a ceiling.
