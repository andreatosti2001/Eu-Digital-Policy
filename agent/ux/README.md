# agent/ux — Agent 8, the UX/UI Auditor

Asks what this interface does to a reader that nothing in `tools/` can see. Ten
questions of the pages, the stylesheets, the modules, the design tokens, the
navigation, the responsive behaviour, the evidence and comparison surfaces,
search, the glossary, the applicability flow, the localisation layer and the
design QA rules that already exist. Output: `UXProposal` records, each behind a
pending `ApprovalRequest`, ranked into a backlog.

```
node agent/ux/cli.mjs --as-of 2026-09-03
node agent/ux/cli.mjs --as-of 2026-09-03 --backlog        # each finding whole
node agent/ux/cli.mjs --as-of 2026-09-03 --open           # what it could not settle
node agent/ux/cli.mjs --as-of 2026-09-03 --question 6
node agent/ux/cli.mjs --as-of 2026-09-03 --propose        # SESSION 17
node --test agent/ux/selftest.mjs
node agent/observability/cli.mjs ux --backlog --open
```

**It is Agent 8, not Agent 7.** The session brief calls it Agent 7; Agent 7 is
the Editorial Agent, built in SESSION 14. The brief's numbering predates it, the
same way SESSION 13's did.

**It restyles nothing and it drafts nothing.** Every operation on every record —
a SESSION 16 finding and a SESSION 17 testable proposal alike — carries a null
`proposed`. It names what is wrong and what the decision is, and stops: choosing
the glyph, the wording, the width or the palette is deciding what a production
site about EU law looks like. The suite asserts it over every record a full run
produces, scans every module here for a write call, and hashes `data/`, all seven
pages and all four stylesheets around a full run.

**Nothing here opens a page.** There is no browser, there is no dependency budget
for one, and no screen reader has ever been run against this site. Every record
carries README limitation 7 as a **blocking** open question, quoted whole, and
its accessibility block is four falses with a note saying what that means. A
finding phrased as though somebody had looked at a rendered page is refused at
the boundary — because the most damaging thing a UX audit can do to this project
is imply coverage it did not have.

**It produces more open questions than findings, and that is the result.** Nine
of the ten components question 1 examines could not be settled from the source:
whether a colour-only state is legible depends on what the element beside it
renders, and reading a template cannot always say. Each one is an
`AgentObservation` on the trace carrying the bytes it read and what would close
it. Deleting one to shorten a report turns "could not be settled without opening
a page" into "nothing there".

**It is not `tools/design-qa.mjs` and it is not the other seven agents.** A
missing record is `agent/depth/`'s, a missing shape is `agent/architect/`'s, a
stale sentence is `agent/proposals/editorial/`'s, and a structural markup defect
is already checked on every run. `boundary.mjs` routes each of them and nothing
here may skip it.

**Every finding quotes bytes at a file and a line**, or it is set aside. A count
is filed as a `measurement` and never as a quoted extract: "no page links to this
one" is not a string in any file, and dressing it as one would be a fabricated
quote behind a checkable-looking locator.

**SESSION 17 invents no design token.** A testable proposal names only custom
properties a stylesheet already declares — `agent/ux/tokens.mjs` refuses one that
does not, and the contract independently refuses a proposal that adds a token
without saying what the existing system could not hold. Every browser test on
every proposal says a person runs it, because there is no harness here.

The design, the ten questions, the severity model and what they found are in
**`docs/UX-AUDIT.md`**. Read that first, and `docs/AGENT-CONTRACTS.md` and
`docs/AI-SAFE-BOUNDARIES.md` before it.
