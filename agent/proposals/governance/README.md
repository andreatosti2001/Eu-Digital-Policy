# agent/proposals/governance/ — repeated human intervention, turned into a request

SESSION 28's brief: *analyse the historical human decisions; for each approved, rejected or
edited proposal determine the patterns — repeated corrections, repeated rejection reasons,
recurring evidence weaknesses, recurring UX objections, recurring editorial corrections,
recurring implementation failures. Do not automatically rewrite policies. Instead create
proposals: a new rule, a new validation, a new skill, a new evaluation, reduced autonomy,
increased autonomy. Every governance proposal requires human approval. The objective is to
convert repeated human intervention into durable system knowledge.*

Full report: **`docs/GOVERNANCE-PROPOSALS.md`**.

---

## 1 · The first finding is about the corpus

**There are no approved, rejected or edited proposals.** `agent/implement/decisions/decisions.jsonl`
— the only place a grant on a proposal can exist — is not empty. It is **absent**. Of the seventy-one
proposals AGENTS.md counts across four agents, not one has been decided: nobody has ever run
the one command that records a decision.

`corpus.mjs` measures that rather than asserting it, and keeps `absent` and `empty` apart
everywhere, because they are different facts and this repository's §0.3 rule applies to its
own governance as much as to a fine or a date.

So the corpus analysed here is the one that exists: **the corrections**. Twelve commits on
`main` say in their own subject that they are putting something right, and the useful ones are
the corrections a session made to work a session had already pushed. A pattern is a thing a
person had to say more than once.

## 2 · What each file is

| | |
|---|---|
| `corpus.mjs` | The six places a human decision could be recorded, and what is in each. Reads only; never decides what an emptiness means. |
| `evidence.mjs` | The five anchor kinds and the three states an anchor can be in. Nothing in `patterns.mjs` stands on its own words. |
| `patterns.mjs` | The twelve patterns, each with its instances and their anchors. The two-instance rule is enforced in code, and a pattern that fails it is reported, not dropped. |
| `proposals.mjs` | The seven governance proposals, derived from the patterns. No write path, no decision home, no `automatic` class. |
| `cli.mjs` | `corpus` · `patterns` · `list` · `show <GP-nn>` · `check`. There is no `decide`, no `apply` and no `grant`. |
| `selftest.mjs` | Thirty-eight tests, including the proof that a full run leaves the working tree byte-identical. |

## 3 · Three design decisions worth disagreeing with

**These records are not on the inter-agent bus, and `contract` is `null`.** The eighteen
contracts in `agent/schemas/` are for records that pass between agents. A governance proposal
passes from this module to a person and nowhere else. Registering a nineteenth contract to
carry it would have put a governance record on the agent-to-agent bus and changed the gate
every other record goes through — a schema change, which is a category no policy may ever
automate. **The cost is real and is named in GP-04**: `deriveApproval()` indexes only
registered contracts held in the git-ignored record store, so a decision recorded against one
of these proposals reads `void_unknown_proposal` elsewhere until this module is re-run. That
is a question for a person, and GP-04 asks it rather than answering it here.

**The proposals are derived, not stored.** They are computed from `patterns.mjs` on every run
with content-derived ids, so re-running mints the same ids from the same evidence and there is
no JSON copy to drift from the reasoning that produced it. Derivation over storage, applied to
this system's own paperwork.

**Nothing here writes.** Not behind a flag, not behind a guard. `selftest.mjs` scans every
module in this directory for a write API and hashes the whole working tree around a full run.
Protocol §24 reserves a change to this system's governance to a person; a module that both
proposes governance changes and can apply one is that reservation on the honour system.

## 4 · What this module does not establish

- **It reads a history, and a reading can be wrong.** Every instance is anchored to a commit,
  a path, a string in a tracked file or a live measurement, and `cli.mjs check` resolves all of
  them on every run — but the *grouping* of instances into a pattern is this session's
  judgement, and no anchor tests a judgement.
- **The correction classifier is crude and says so.** It matches subject lines, so it
  over-counts a commit that merely uses the word and cannot see a correction made quietly
  inside a larger commit. The count is a floor, measured one way; the patterns anchor to named
  commits rather than to it.
- **Nothing here has been decided, and nothing here is a decision.** Seven proposals exist;
  seven proposals are pending. Adding them to the pile the rest of this repository is already
  waiting on is the honest description of what this session did, and P-07 is the pattern that
  says so.
