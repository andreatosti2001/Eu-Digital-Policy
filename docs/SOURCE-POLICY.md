# Source policy

**Status:** binding. Governs what may be cited, what a citation is allowed to
support, and the absolute prohibition on inventing legal facts.

---

## 1. The rule that outranks every other rule

**Never invent a legal fact.**

An article number, a date, a fine amount, a status, a Member State position, a
publication title, a URL, a case number, a recital: if it has not been read in
the source, it does not go in. Not as a placeholder, not "pending verification",
not because it is almost certainly right, not because a model is confident, and
not because the shape of the record has a hole in it.

Where a value is not established, the record says so in its own vocabulary:
`requires_verification: true` with a `verification_note`, `url_status:
url:none` with a `resolution`, `legislative_status: null` with a `status_note`,
or `reference_gap` with a `gap_note`. The repository already contains records
that do exactly this, and they are the model:

> `dga` — *"Status NOT ESTABLISHED in this build. Recorded for scope-mapping
> only (§24). No primary source consulted. Must not be rendered with a status
> until verified."*

That record is **correct**. An agent that "helpfully" fills in the DGA's status
from general knowledge has broken the project.

**A related prohibition:** several provisions carry the note *"Article number
and heading recorded from general knowledge of the instrument; confirm the
wording against the consolidated text before display."* Those notes are a debt
the project has admitted. An agent may not remove such a note without having
read the consolidated text, and may not add a new record carrying that
justification — general knowledge is not a source.

## 2. Never turn uncertainty into certainty

Every transition from an uncertain state to a certain one is a **substantive
claim about the world** and is governed by `VERIFICATION-POLICY.md`. Any of the
following is a Class C or D change, never automatic:

- clearing `requires_verification`
- setting `last_verified` on a record that had none
- moving `url_status` from `url:none` to `url:live`
- removing `reference_gap` / `gap_note`
- filling a `null` `legislative_status`, `action_status` or `payment_status`
- narrowing a `date_precision` (`month` → `day`)
- removing a `verification_note` that describes a limit

The reverse — marking something *less* certain than it was recorded — is always
permitted and never needs approval. **Uncertainty flows in one direction
freely.**

## 3. Commentary is not primary legal authority

The tiers in `data/taxonomy.json`, and what each may carry:

| Tier | What it is | Grade it can support |
|---|---|---|
| `tier:1` | The legal text; a court judgment | **Primary law** |
| `tier:2` | A regulator or an EU institution | **Official source** |
| `tier:3` | Research, academic work | **Secondary only** |
| `tier:4` | Press, advocacy, industry submission | **Secondary only** |

`js/format.js` `evidenceGrade()` implements this and takes the **strongest
direct** source. Consequences an agent must not attempt to route around:

- **Tiers 3 and 4 can never produce a "Primary law" or "Official source"
  grade**, however many of them agree. Ten think-tank papers do not make a legal
  fact.
- **A think tank quoting a regulator is still tier 4.** Cite the regulator.
  `src-itif-dma-compliance` records this explicitly: *"Note that ITIF is itself
  quoting studies for the first phrase."*
- **Adjusting a source's `tier` to raise a claim's grade is falsification.**
  Tier describes the publisher, not the usefulness of the citation.
- A source's `publisher` must resolve to an institution ID (or `eu`), so
  "who says this" is itself structured data.

## 4. What a source does for a claim

Every entry in `claim.sources[]` carries a `supports` value. Only
`supports:direct` can raise a grade. A source that supplies context, background
or a contrary position is recorded with its true relation and is **not** a
substitute for a missing direct source.

## 5. Self-citation

`src-brief-original` is the brief citing itself. It is **not a source**, and the
code treats it as one everywhere:

- `evidenceGrade()` filters it out before grading. A claim whose only direct
  source is the brief grades **Unresolved**, not "Secondary".
- `freshness.mjs` classifies it `self-reference — not a source at all`.
- `validate.mjs`'s unverified report excludes it when looking for a "strongest
  direct" source.

**40 claims currently rest on nothing but the brief itself** (audit F-08,
independently reproduced). That number is meant to be uncomfortable. An agent
may not reduce it by attaching a loosely related substitute.

## 6. The asterisk, and the prohibition on closing a gap the wrong way

An asterisk in the running text means **the reference is missing, not that the
statement is doubted**. It appears on a claim graded *Unresolved*, and on a
claim that is partly sourced with a named hole (`reference_gap` + `gap_note`).

From `tools/_refsweep.mjs`, and binding:

> *"Nothing was attached because it looked related — the method note forbids
> that, and a loosely related substitute is worse than an admitted gap because
> it looks resolved."*

A gap is closed by finding the publication the brief was pointing at, opening
it, and confirming it says what the brief says it says. It is closed by nothing
else. An unclosed gap is a correct state.

## 7. Provenance every source must carry

- `id`, `tier`, `type`, `title`, `publisher`
- `url` **and** `url_status`; if `url:none`, a `resolution` naming *why*:
  - `url-not-located` — publication identified, no stable URL found; findable
  - `publication-not-identified` — no specific publication named; **cannot** be
    fixed by finding a link
  - `self-reference` — not a source at all
- `published`, `accessed`
- `note` — what was checked, when, and what the source actually says

The `note` on the sources resolved in the August 2026 sweep is the standard:
what was located, on what date, and how closely it matches the brief's
characterisation.

## 8. Reachability is asserted, not measured

`url_status` is a **stored assertion by whoever last edited the record**.
Nothing in this repository has ever fetched a URL — `freshness.mjs` prints its
counts under a heading reading `SOURCE REACHABILITY` but performs no network
I/O (audit F-12).

An agent must not describe `url:live` as verified, and must not report the
freshness output as evidence that links work.

## 9. Legal-text conventions

- Cite the **consolidated** text on EUR-Lex for anything in force.
- Quotations from and links to EU legal texts carry those documents' own reuse
  terms, which this site neither extends nor restricts.
- **No licence has been declared for this repository.** Ordinary copyright
  applies to the analysis and the datasets by default. No agent may declare,
  imply, or add a licence — that is the author's decision alone (Class D).
- The independence disclaimer and the "not legal advice" statement are on every
  page by design and may not be moved into JavaScript-rendered chrome.
