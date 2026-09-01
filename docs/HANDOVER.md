# HANDOVER

**Last updated:** SESSION 03 · 1 September 2026
**Branch:** `claude/shared-skill-library-djn1oo`
**Base commit:** `4bd1f0d` on `main` (the SESSION 02 merge)

---

## Current milestone

**SESSION 03 — Build the shared skill library. Complete.**

`.agents/skills/` now holds sixteen skills, and `docs/SKILL-MAP.md` records what each owns
and which agent role uses it. **No file the website ships was modified.**

### Discrepancy between the brief and the previous handover — reported, not reconciled

SESSION 02 recommended that SESSION 03 be *"instrument one real read-only agent — the
Scout"*. **This session's brief instructed something different**: build the shared skill
library. The brief was followed, as the more recent instruction, and the recommendation is
**not lost** — it is carried forward below as the next objective, which the library was
written to serve. The numbering now matches the brief; the Scout is the next session's work.
Recording the divergence here rather than silently renumbering, per the rule that a handover
which has drifted from the instruction is itself a finding.

## Work performed

Twelve new skills, four existing ones amended, one map, two scripts.

**New** — `eu-legal-research`, `source-provenance`, `legal-source-verification`,
`regulatory-change-detection`, `data-completeness`, `knowledge-architecture`,
`legal-editorial`, `ux-audit`, `frontend-implementation`, `legal-site-qa`, `observability`,
`autonomy-governance`.

**Amended** — `project-context` (pointer to the map; boundary line),
`data-governance` (scope boundary against its three new siblings; the deliberate-duplication
note), `repository-audit` (scope boundary), `git-workflow` (boundary line, plus the fix
below).

**Fixed** — `git-workflow` named `claude/eu-digital-policy-protocol-ntyhqc` as "the session's
designated branch". That branch belonged to SESSION 00; the name had gone stale and would
have sent a later session to the wrong branch. The branch is a session fact, so it now lives
only in the session brief and in this file, and the skill tells the agent to confirm it with
`git branch --show-current`.

## Files changed

```
.agents/skills/eu-legal-research/SKILL.md                          (new)
.agents/skills/eu-legal-research/references/source-registers.md    (new)
.agents/skills/source-provenance/SKILL.md                          (new)
.agents/skills/source-provenance/references/source-record.md       (new)
.agents/skills/legal-source-verification/SKILL.md                  (new)
.agents/skills/legal-source-verification/references/verification-protocol.md (new)
.agents/skills/regulatory-change-detection/SKILL.md                (new)
.agents/skills/regulatory-change-detection/references/decay-surfaces.md (new)
.agents/skills/data-completeness/SKILL.md                          (new)
.agents/skills/data-completeness/scripts/gaps.mjs                  (new)
.agents/skills/knowledge-architecture/SKILL.md                     (new)
.agents/skills/legal-editorial/SKILL.md                            (new)
.agents/skills/legal-editorial/references/house-register.md        (new)
.agents/skills/ux-audit/SKILL.md                                   (new)
.agents/skills/ux-audit/references/manual-checks.md                (new)
.agents/skills/frontend-implementation/SKILL.md                    (new)
.agents/skills/legal-site-qa/SKILL.md                              (new)
.agents/skills/legal-site-qa/scripts/baseline.mjs                  (new)
.agents/skills/observability/SKILL.md                              (new)
.agents/skills/autonomy-governance/SKILL.md                        (new)
.agents/skills/autonomy-governance/references/escalation-record.md (new)
.agents/skills/project-context/SKILL.md                            (amended)
.agents/skills/data-governance/SKILL.md                            (amended)
.agents/skills/repository-audit/SKILL.md                           (amended)
.agents/skills/git-workflow/SKILL.md                               (amended — stale branch)
docs/SKILL-MAP.md                                                  (new)
AGENTS.md                                                          (skills paragraph)
.gitignore                                                         (+ the QA snapshot path)
```

## Architecture decisions

1. **Portable by construction.** `SKILL.md` with `name` and `description` front matter and
   plain Markdown below, at `.agents/skills/<name>/SKILL.md`. No assistant-specific front
   matter field is used, so Claude Code discovers them by path and any agent reachable through
   `AGENTS.md` reads them as files.
2. **One home per rule, applied to the instructions themselves.** Skills point at
   `docs/AI-SAFE-BOUNDARIES.md` §0 rather than copying it; the tiers, the architecture, the
   recorded validator baseline, the taxonomy definitions and the branch name each keep their
   existing single home. `docs/SKILL-MAP.md` §4 lists what is deliberately not duplicated.
3. **One deliberate exception, recorded rather than hidden.** `data-governance` still restates
   the prohibitions, because it is invoked at the moment of highest risk and a pointer there
   costs a file read at exactly the wrong time. The exception is stated in that skill and in
   the map, so the principle stays legible. The existing wording was left untouched: trimming
   a safety section was judged the wrong risk to take in a session scoped to build a library.
4. **Every skill declares a scope boundary.** A table or a sentence naming the sibling that
   owns what this skill does not. That is the anti-overlap mechanism, and it is what lets the
   evidence pipeline stay four separate acts — detect, retrieve, verify, record — instead of
   collapsing into one.
5. **Every skill states Done-when and Refusal conditions.** Observable criteria (a validator
   result, a number that moved, a file that exists) rather than advice. That is what "testable"
   means for a prose skill.
6. **Scripts only where they add a number nothing else prints.** Two, both zero-dependency in
   the style of `tools/`. No script was written for regulatory decay, because
   `tools/freshness.mjs` already reports it, and a second implementation would be a second
   home.
7. **`gaps.mjs` imports the site's own derivation.** `evidenceGrade` is loaded from
   `js/format.js` — via a `data:` URL, because a browser ES module in a repository with no
   `package.json` cannot be imported by path — so the census cannot disagree with what the
   page renders. Its output reproduces the README's stated figure of 22 unresolved claims
   without that figure appearing anywhere in the script.
8. **`baseline.mjs` asserts nothing of its own.** It holds no expected counts. It compares
   against a snapshot the session takes, so the recorded baseline keeps its home in
   `docs/CURRENT-ARCHITECTURE.md` §12. Its snapshot is a session artifact and is git-ignored,
   for the same reason `agent/observability/runs/` is.
9. **The map names agent roles that do not exist yet**, and says so. The allocation is
   intended, not observed; the useful column is "never", which is where a role's boundary is
   enforced by what it may not load.

## Tests

| Command | Result |
|---|---|
| `node tools/validate.mjs` | 0 errors · 0 warnings · 106 unverified · exit 0 |
| `node tools/i18n-audit.mjs` | 0 errors · 0 warnings · exit 0 |
| `node tools/design-qa.mjs` | 0 errors · **5 warnings** (the same five) · exit 0 |
| `node tools/freshness.mjs` | nothing past its stated interval · exit 0 |
| `node agent/observability/cli.mjs validate` | 0 invalid · 0 unparseable · exit 0 (empty store) |
| `node .agents/skills/data-completeness/scripts/gaps.mjs` | runs; `--json` valid; exit 0 |
| `node .agents/skills/legal-site-qa/scripts/baseline.mjs --save/--check` | no change · exit 0; verified to exit 1 and name the field on an injected difference |

Run before and after the work. **Identical to the `docs/CURRENT-ARCHITECTURE.md` §12
baseline; no new warning.** `git status --porcelain` confirms no file the website ships was
touched.

Cross-checks that the two scripts agree with the existing tools rather than restating them:
`gaps.mjs` reports 7 payment-unknown enforcement records against `freshness.mjs`'s "7 of 16
payment unknown", and 22 unresolved claims against the README's stated figure.

**Not run:** no browser, no screen reader, no live agent. Nothing in this session is runtime
code for the site.

## Observability

No new instrumentation. The `observability` skill documents the existing surface in
`agent/observability/tracer.mjs` for the agents that will use it, and `baseline.mjs` includes
`cli.mjs validate` in the one-pass check so the trace store is verified alongside the four
validators. `agent/observability/**` itself is unchanged.

## Known limitations

1. **Prose skills are untested until an agent follows one.** The two scripts run; the other
   fourteen skills are tested by use, and the first session to follow one will find where a
   procedure is wrong.
2. **`gaps.mjs` loads `js/format.js` through a `data:` URL.** It works, and it avoids a second
   copy of the grading rule, but it will break if `format.js` ever gains an import — at which
   point the import chain would need resolving too. It imports `evidenceGrade` and
   `gradeTally` only.
3. **`baseline.mjs` digests the output of three checks and not `freshness.mjs`**, whose text
   legitimately changes with the date. A change in freshness's prose that does not move its
   overdue count will not be caught.
4. **The agent roles in `docs/SKILL-MAP.md` §3 are intended, not implemented.**
5. **The skill library does not cover translation work.** `i18n` discipline appears inside
   `legal-editorial` and `frontend-implementation`; no session has yet needed a translator
   skill, and one should not be written speculatively.
6. **`data-governance` still duplicates the §0 prohibitions.** Deliberate and recorded, but it
   is a second copy, and if §0 changes both must change.

## Unresolved issues

Carried forward, none in this session's scope:

1. **`data/brief.json` is canonical but never consumed**; its content ships as the inline
   `window.__CONTENT__` blob at `index.html:361`. Two homes for one set of facts.
2. **The two copies have already drifted** — `meta.standfirst` differs. Which is correct is
   the author's decision.
3. **No deploy gate.** A push to `main` publishes; the validators do not run in CI.
4. **106 records carry an unverified or requires-verification note.** The project's largest
   open body of work. `gaps.mjs` now breaks it down: 22 claims grade *Unresolved*, 40 rest
   directly on the brief itself alone, 10 carry an explicit reference gap.
5. **No decision on excluding `agent/` from the Pages deployment** (SESSION 02, limitation 6).

New, from this session:

6. **`AGENTS.md` §"The rules that matter most" summarises `docs/AI-SAFE-BOUNDARIES.md` §0.**
   That is a pre-existing second copy, and deliberate — the entry point has to carry the rules
   an agent needs before it has read anything. It was left alone, but it means §0 now has
   three homes counting `data-governance`. If §0 is ever amended, all three must be.

## Next session

**SESSION 04 — instrument one real read-only agent: the Scout.**

This is SESSION 02's recommendation, unchanged, and the library now exists to serve it. Build
**one** agent, **read-only**, against real sources, emitting through
`agent/observability/tracer.mjs` and appearing in the viewer with real provenance.

Do not build the Verifier or the Change Detector in the same session, and **do not let any
agent write to `data/*.json`.**

## Next-session instructions

- Read `AGENTS.md`, invoke `project-context`, then read `docs/PROJECT-CONTEXT.md`,
  `docs/CURRENT-ARCHITECTURE.md`, `docs/AI-SAFE-BOUNDARIES.md`, this file and
  `docs/OBSERVABILITY.md`.
- Then load, from `docs/SKILL-MAP.md` §3, the Scout's row: `observability`,
  `regulatory-change-detection`, `eu-legal-research`, `autonomy-governance`. Its "never"
  column is binding — a Scout proposes; it does not edit.
- Take the baseline first: `node .agents/skills/legal-site-qa/scripts/baseline.mjs --save`,
  and `--check` before declaring done.
- A real provenance record must carry a `url` or a `locator`; the schema refuses it otherwise
  unless marked `simulated`, and **nothing outside the demonstrator may be marked simulated**.
- Extending the record vocabulary means extending `agent/observability/schema.mjs` **and its
  tests** in the same commit.
- Before declaring done: `node --test agent/observability/selftest.mjs`,
  `node agent/observability/cli.mjs validate`, and the four validators in `tools/`.
- **Report which skills you used and where one was wrong.** The library is untested prose
  until a session follows it; a skill that had to be contradicted is a finding for the session
  after, not a rule to bend quietly.

## Do not

Carried forward, unchanged and still binding:

- **Do not rebuild the site.** No framework, no bundler, no build step, no dependency, no
  service worker, no server-side rendering.
- **Do not fix the `__CONTENT__` / `brief.json` drift on your own initiative.**
- **Do not modify `data/*.json`** in a session not scoped for data work.
- **Do not touch** the footer's non-affiliation or no-legal-advice text, `TIER_GRADE` in
  `js/format.js`, the derivation rules in `js/pipeline.js`, or `BASE` in `tools/_footer.mjs`.
- **Do not declare a licence.**
- **Do not soften** the README's known limitations or the unverified-record count.
- **Do not re-run** `tools/_refsweep.mjs` or `tools/_review10.mjs`.
- **Do not change the id shapes in `ids.mjs`**, move redaction to the read path, remove the
  demonstrator's simulation markers, or commit anything under `agent/observability/runs/`.

Added by this session:

- **Do not copy a rule into a skill that already has a home.** The library's value is that
  sixteen files do not have to be kept in agreement with each other. `docs/SKILL-MAP.md` §4
  lists what must never be duplicated; add to that list rather than to the skills.
- **Do not hardcode the recorded validator baseline into a script.** `baseline.mjs` compares
  against a session snapshot for exactly this reason.
- **Do not reimplement `evidenceGrade`, the pipeline rules or the unverified tally** in a
  skill script. Import the site's function, or call the tool that owns the number.
- **Do not add a skill speculatively.** Sixteen is already a lot to keep true. A new one is
  justified when a session had to work outside the library, and it says so in its handover.
- **Do not let a skill grow into a second architecture document.** If a skill needs three
  paragraphs of background, the background belongs in `docs/` and the skill points at it.
