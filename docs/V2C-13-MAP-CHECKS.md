# V2C-13 — the map checks M-08…M-16: measurement and proposal

Session V2C-13 (Track R), 16 Nov 2026. Scope: `docs/ROADMAP-v2.md` §8, "The scope of the V2C-13 session". Prompt:
`docs/prompts/v2-v2c-13-map-checks.md`. Design: `docs/V2-DATA-DESIGN.md` §1.4, §1.5, §4. **Nothing in `tools/` or `data/` was written
to produce this document**: the measurement below was made by a throwaway script outside the tree that applies each rule, as §1.5
defines it, to `data/instruments.json` as it stands on `main` `00e1534`, as of 16 Nov 2026.

## 1. What was measured, and on what

39 relationships, all in the v2 shape (no bare source id). By kind: overlap 3, conflict 2, complement 5, amends 7, repeals 3,
lex-specialis 1, carve-out 1, defers-to 11, enables 6. **Nine of the twelve `relationship_kind` terms are used; `sequence`,
`implements` and `legal-basis` have no edge.** No term of `relationship_kind` carries `basis` (so M-16 cannot pass, and every rule that
separates a *textual* edge from an *analytical* one has nothing to read the separation from).

## 2. The rule-by-rule table

"Today" is what the rule gives on the 39 relationships, as §1.5 defines it. Severity is the design's (§1.5) unless the row says
otherwise. **Rows whose "today" is 0 can still fail: each gets a planted edge in `tools/selftest.mjs` that violates it** (§4.3: a check
that cannot be shown to fire is a check on nothing).

| Rule | What it checks | Design severity | Today (39) | Red rows | Needs `basis` |
|---|---|---|---|---|---|
| M-08 | every reference is an object; its `source_id` resolves; `supports` is one of direct / partial / context; a **direct** reference to a **tier-1** source has a structural locator. A bare id is the v1 form | ERROR for objects, BACKLOG `edge-v1-sources` for bare ids | **0** errors, **0** bare ids | — | no |
| M-09 | `summary` non-empty (≥ 20 characters, `map.schema.json`); `last_verified` is an ISO date. `last_verified` ≤ as-of is a property of the date asked, not of the tree: **WARNING `VERIFIED_AFTER_AS_OF`**, the rule the author decided for the register on 27 Oct 2026 (`register-audit.mjs`, M-04), not a new one | ERROR (summary; date present) / WARNING (date after as-of) | **0** / **0** | — | no |
| M-10 | an analytical edge has ≥ 1 claim | BACKLOG `edge-analytical-no-claim` | **3** | `rel-dsa-dma-scope`, `rel-nis2-cer`, `rel-cra-nis2` | yes |
| M-11 | a textual edge has ≥ 1 direct reference with a structural locator | ERROR for `enables` and `defers-to`; BACKLOG for the other textual kinds | **1** | `rel-dsa-copyright-dsm-defers` (defers-to; its one reference is `supports:partial`) | yes |
| M-12 | an edge whose stating act is a withdrawn proposal: a dead edge, drawn as such | WARNING `DEAD_EDGE` | **0** (the only withdrawn record, `ai-liability-directive`, is at no edge's end) | — | no |
| M-13 | `enables`: a direct reference whose source is among the **to** node's `sources`; `defers-to`: among the **from** node's | ERROR | **1** (the same edge: it has no direct reference at all). The other 16 `enables` / `defers-to` edges pass | `rel-dsa-copyright-dsm-defers` | no |
| M-14 | `symmetric: true` only on an analytical kind | ERROR | **0** (all 9 `symmetric: true` edges are overlap, conflict or complement) | — | yes |
| M-15 | the instrument arrays `amends`, `repeals`, `amended_by`, `proposes_to_amend` agree with the relationships | BACKLOG `edge-second-home` (until the arrays are derived) | **5 entries, 4 pairs** (see below) | `data-omnibus` with `eprivacy`, `nis2`, `dga`, `p2b` | no |
| M-16 | every `relationship_kind` term carries `basis` | ERROR, in `validate.mjs` | **12 of 12 terms lack it** | all twelve | — (it is the rule that adds it) |

Three observations the measurement made that the design did not state:

- **M-10, M-11 and M-14 cannot run without `basis`.** They are defined over "analytical" and "textual" edges, and no term says which a
  kind is. The design classifies all twelve (`docs/v2-design/map.schema.json` `x-taxonomy-additions.relationship_kind_basis`: textual —
  amends, repeals, implements, legal-basis, carve-out, lex-specialis, enables, defers-to; analytical — overlap, complement, sequence,
  conflict) and that classification is what decision 1 puts to the author. By the stop rule (the prompt: no check is written on a partial
  measurement), **if the author does not decide it, M-10, M-11, M-14 and M-16 are not implemented, and are declared so.**
- **M-11 and M-13 fire on one and the same edge, for one and the same reason**: `rel-dsa-copyright-dsm-defers` has no direct reference.
  Its `verification_note` says why — "Partial by construction: the DSA names a body of law (Art. 2(4)(b): 'Union law on copyright and
  related rights'), and that this Directive belongs to it is the site's reading." It is not a defect of the reading and was not touched.
  It is a textual kind (`defers-to`) carrying what is in truth an analytical step. Re-typing it, or adding a locator, is a decision about
  the edge, which is the author's (the prompt: no relationship is changed to make a check pass).
- **M-15, measured precisely.** Pair-level and kind-aware. The array side holds `data-omnibus.proposes_to_amend = [gdpr, eprivacy,
  data-act, dga, nis2]`; the relationships hold `data-omnibus → gdpr` amends, `→ data-act` amends, `→ dga` **repeals**, `→ p2b` **repeals**.
  So `eprivacy` and `nis2` are in the array with no edge (2); `dga` is in the array as an amendment while the edge says repeal (1 — and
  `proposes_to_amend` cannot say "repeal"); `p2b` has a repeal edge and no array entry (1). Four pairs; five entries when each array
  entry and each edge is counted. (The 28 Oct 2026 measurement recorded 2 against the 40 edges then; the definition above is the one
  this session measured, in both directions and with the kind.) Whether the Omnibus really amends ePrivacy and NIS2 is a question for
  the proposal's text, not for this check: **no edge is added to quiet it**. The check reports; the second home is closed by deriving the
  arrays (`docs/V2-DATA-DESIGN.md` §1.4), which is not this session's.

## 3. What each decision turns on

**Decision 1 — `basis` (W.1 b).** Adding `basis` to the twelve terms is a data change in `data/taxonomy.json`: a property added, no id or
label touched (the design's own wording). One home for the fact, in the vocabulary that already owns the kinds, and M-16 then holds it.
The alternative is a constant in `js/map-model.js` beside `HOLDER`: a second home for a fact the design puts in the taxonomy, with
nothing for M-16 to check (M-16 declared not implemented).

**Decision 2 — M-11 and M-13 on the partial `defers-to` edge (W.1 a).** Measured: ERROR for all turns the tree red on exactly one edge.
The options: ERROR for every edge but that one, which is named in a frozen, only-shrinks list (the pattern of `SCOPE_DECISION_BACKLOG` and
`STATUS_BASIS_BACKLOG` in `register-audit.mjs`) and shown as BACKLOG `edge-textual-partial`, so that every *new* `enables` or `defers-to`
edge is held in full; or ERROR for all, red until the edge is decided; or WARNING, the weakest — it would let a new `defers-to` edge with
no direct reference in, which is the case the rule exists for.

**Decision 3 — the flip (W.2).** `edge-v1-sources` (M-08 on bare ids) → ERROR: **0 today**, so the flip costs nothing and a later bare id
fails at once (W12 already says so for the test; this makes it the audit's). `edge-analytical-no-claim` (M-10) → ERROR: **3 today**, so
flipping it turns the tree red on three edges V2C-12 read and found carried by the site's reading, with no claim. The alternative that keeps
the backlog honest is the same frozen, only-shrinks list: a *new* analytical edge with no claim is an ERROR, the three are named.

**Decision 4 — everything else, as designed.** M-08, M-09 (summary ERROR, date after as-of WARNING), M-12 WARNING, M-14 ERROR, M-15
BACKLOG `edge-second-home` (not ERROR: the arrays are a known second home, closed by derivation). Implemented as one pure module,
`tools/map-audit.mjs` (the shape of `register-audit.mjs` and `trigger-audit.mjs`), called by `tools/evidence-audit.mjs` and printed in a new
section **10 · MAP** in text, `--json` and `--markdown`; the exit code keeps its meaning (1 on an ERROR; a BACKLOG never sets it). M-16
goes in `tools/validate.mjs` with the taxonomy, as §4.1 says. Every rule gets a planted edge in `tools/selftest.mjs`; no existing assertion
changes and W12 is not touched.

## 4. What this does not establish

That any of the 39 relationships is true: the checks measure what an edge *carries*, not whether it is right. That the arrays' second home
is closed (M-15 reports it). The map view stays unpublished (`docs/ROADMAP-v2.md` §8, 27 Oct 2026, A.0).
