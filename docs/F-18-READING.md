# F-18 — «immediately» against DMA Art. 3(10): the reading notes

**Lifecycle:** closed · **Authority:** canonical · **Home of:** F-18 against DMA Art. 3(10), 17 Nov 2026 · **Closed by:** «Final checkpoint of the F-18 session» · **Catalogue:** `docs/README.md`

**Session:** F-18, Track R, evidence (`docs/prompts/v2-f-18-dma-immediately.md`; scope `docs/ROADMAP-v2.md` §8, "The scope of the F-18
session"). **Read on 17 Nov 2026**, in this environment, from the Publications Office's Cellar by CELEX with
`Accept: application/xhtml+xml` and `Accept-Language: eng`, text extracted by stripping the markup. These notes are W.1 and the W.2
proposal. **They change nothing in `data/`, `i18n/` or the brief**: what is written there is decided by the author in §8. The text read
is the Official Journal original, not a consolidated version.

## 1. What was retrieved

| Document | Retrieval | Bytes | SHA-256 |
|---|---|---|---|
| Regulation (EU) 2022/1925 (DMA), OJ L 265, 12.10.2022 | `celex/32022R1925` (HTTP 200) | 518 017 | `d6af21a4f11c2b001b0486391fbd0813deba32305fb0d3865fbceccd45b827eb` |

SPARQL metadata, the same day: **no amending act**; **three corrigenda**, `32022R1925R(01)`, `R(02)`, `R(03)`. The XHTML of all three
answers HTTP 404; `R(01)` and `R(03)` also 406 for the CELEX URL without a type, and `R(02)` answers only its metadata (RDF). So **no
corrigendum text was read today**; the repository records that `R(02)` has the only English expression and changes Art. 13(8) alone
(`docs/HANDOVER.md`, read on 4 Nov 2026) — not re-read, and Art. 13(8) is not about when Arts 5 to 7 bind.

## 2. What the text says

**Art. 3(10)**: "The gatekeeper shall comply with the obligations laid down in Articles 5, 6 and 7 within 6 months after a core
platform service has been listed in the designation decision pursuant to paragraph 9 of this Article." Art. 3(9): "For each
undertaking designated as a gatekeeper pursuant to paragraph 4 or 8, the Commission shall list in the designation decision the
relevant core platform services …". **Quoted exactly; it agrees with what the 4 Nov 2026 note of `ap-dma-01` quotes.**

**Arts 5, 6 and 7** each open by tying the duty to the listing: Art. 5(1) "shall comply with all obligations set out in this Article
with respect to each of its core platform services listed in the designation decision pursuant to Article 3(9)"; Art. 6(1) the same
words; Art. 7(1) "Where a gatekeeper provides number-independent interpersonal communications services that are listed in the
designation decision pursuant to Article 3(9)". **None of the three states a moment**; the moment is Art. 3(10)'s.

**Art. 11(1)** (the compliance report): "Within 6 months after its designation pursuant to Article 3, and in accordance with Article
3(10), the gatekeeper shall provide the Commission with a report …". **Art. 15(1)**: "Within 6 months after its designation pursuant
to Article 3, a gatekeeper shall submit … an independently audited description of any techniques for profiling of consumers …".
Both read together with Art. 3(10): the six-month period is the Regulation's own frame for the first compliance steps.

**Art. 7(2)** staggers interoperability further ("within 2 years from the designation", "within 4 years from the designation").

**Art. 54**: the Regulation "shall apply from 2 May 2023" (Art. 3(6) and (7), Arts 40, 46–50 from 1 November 2022; Arts 42 and 43
from 25 June 2023). **That is when the Regulation applies; it is not when a gatekeeper's Art. 5 duties start**, which is Art. 3(10).

**The word "immediately"/"immediate" in the whole text** (searched): a recital on data portability ("effective and immediate access to
the data"; "a format that can be immediately and effectively accessed"), and Art. 38(2) and (3) on notices from national authorities
("before or immediately after the start of such measure"). **It is not used for when Arts 5, 6 or 7 bind.** "Self-executing" is not
in the text either.

## 3. What the site says (every place found; `grep` over `data/`, `i18n/`, `js/`, `*.html`, `instruments/`)

| # | Place | Words | Against the text |
|---|---|---|---|
| 1 | `data/applicability.json`, `ap-dma-01`, `rationale` | "Designation is the switch. Once an undertaking is designated for a core platform service, the Article 5 prohibitions apply immediately and self-executingly, with no requirement to demonstrate anticompetitive effect in the individual case." | "immediately" is not what Art. 3(10) says. "Self-executingly" and "no requirement to demonstrate anticompetitive effect" are not tested here (§5, not established) |
| 2 | `data/claims.json`, `clm-dma-ex-ante` (`claim-type:law`; provisions `dma:art-3`, `dma:art-5`, `dma:art-6`; one direct source, `src-eurlex-dma`, "Arts. 3, 5, 6"; `last_verified` 2026-08-27; no `verification_note`) | "The DMA is ex ante regulation: once an undertaking is designated, a list of prohibitions and obligations applies immediately, with no requirement to demonstrate anticompetitive effect in the individual case." | the same. **The claim cites Art. 3 as a provision and a locator that includes Art. 3 — the Article that contradicts it** |
| 3 | `index.html`, `part-4.p2` (EN source, `data-claim="clm-dma-ex-ante clm-dma-commission-exclusive"`) | "Designate the firm, and a list of prohibitions and obligations applies immediately, with no requirement to demonstrate anticompetitive effect in the individual case." | the same |
| 4 | `i18n/it.json`, `fr.json`, `es.json`, `part-4.p2` | IT «si applica immediatamente»; FR «s'applique immédiatement»; ES «se aplica de inmediato» | the same, in three overlays |
| 5 | `i18n/it.json`, `part-4.p4` | «L'articolo 5 contiene i divieti **immediatamente applicabili**» | **new, not in F-18's record.** The English source of `part-4.p4` says "the self-executing prohibitions"; the French and Spanish overlays say «d'application directe» / «de aplicación directa». The Italian overlay alone says «immediatamente applicabili», which in this sentence reads as a statement about time, not about direct effect |
| 6 | `data/timeline.json`, `tl-dma-2024-03-07-compliance` | the six gatekeepers designated on 6 Sep 2023 "must comply in full" on 7 Mar 2024; sources IP/23/4328 ("six months to comply") and the DMA website announcement of 7 Mar 2024 | **consistent with Art. 3(10)**; those two Commission sources were not re-read today |
| 7 | `data/applicability.json`, `ap-dma-01`, `dates` | `tl-dma-2023-05-01-application` only (2023-05-02: the Regulation's application, Art. 54) | the rule's date is the Regulation's application; the gatekeeper's own duty date is the timeline event of row 6, which the rule does not list |

`part-4.p4` (English) also says "Article 11 requires a compliance report within six months of designation": **consistent with Art.
11(1).** No other place was found that says the DMA's obligations bind "immediately": the DMA instrument page and `data/instruments.json`
were searched for «immediate» near "DMA"/"gatekeeper" and have none.

## 4. Findings

- **F18-1.** The text does not support «immediately» for Arts 5–7. It gives the gatekeeper six months from the listing (Art. 3(10)),
  and Arts 11 and 15 use the same six months. Rows 1–4.
- **F18-2.** `clm-dma-ex-ante` is typed `law` and cites `dma:art-3` and "Arts. 3, 5, 6" as direct support: its own cited Article is the
  one that says six months.
- **F18-3 (new).** The Italian overlay of `part-4.p4` says «immediatamente applicabili» where its English source says "self-executing"
  and the French and Spanish say «d'application directe» / «de aplicación directa». Row 5.
- **F18-4.** The rule's `dates` lists the Regulation's application but not the six-month date the timeline already holds. Row 7.
- **What the sentence gets right:** that the prohibitions in Art. 5 are tied to designation of a core platform service, not to a finding
  of effects, is not contradicted by anything read (Art. 5(1) is tied to the listing; no condition of effects appears in Arts 3(10) or
  5(1)). It was not re-tested beyond that, and is **not established** here as a statement about every obligation.

## 5. Not established

Whether Art. 5's duties are "self-executing" in the sense the rule and `part-4.p4` use (that turns on Art. 8 and on Art. 6's heading,
"susceptible of being further specified under Article 8"; Art. 5 has no such heading, which is not a reading of effect); the text of any
corrigendum; the two Commission sources of the timeline event; consolidated law; case law; the Commission's decisions.

## 6. W.2 — what is put to the author (one question per decision; recommendation first)

| # | Item | Options | Recommendation |
|---|---|---|---|
| Q1 | `ap-dma-01.rationale` (row 1) | (A) replace "apply immediately" by the Article's own words: "must be complied with within six months after the core platform service is listed in the designation decision (Art. 3(10))", leaving every other word; (B) leave and keep the 4 Nov note; (C) another wording | **A** |
| Q2 | `clm-dma-ex-ante` (row 2) | (A) same correction of the statement, sources and type unchanged, `last_verified` 17 Nov 2026 with a `verification_note` quoting Art. 3(10); (B) split into two claims (ex ante / the six-month period), a new record; (C) leave | **A** (B adds a claim, a second home for the period) |
| Q3 | `part-4.p2` and the English brief text (row 3) | (A) same correction in the English source; (B) leave | **A** |
| Q4 | the three overlays of `part-4.p2` and the Italian `part-4.p4` (rows 4–5) | (A) correct the English; **withdraw** the four overlay strings as `superseded` (the page falls back to English until a translation is authored); (B) correct the English and write the four strings (unreviewed; the session is not a reviewer); (C) leave overlays | **A** (a translation I write is not a reviewed translation; a withdrawn one is declared) |
| Q5 | `ap-dma-01.dates` (row 7) | (A) add `tl-dma-2024-03-07-compliance` to the rule's dates; (B) leave | **B** — the event rests on two Commission sources not re-read here and the rule is about the Article; a date added to a rule on sources not re-read is the pattern the prompt forbids |
| Q6 | the attestation of `ap-dma-01` | the work is its attestation (steps 1–6 of `docs/RULE-MAINTENANCE.md`: `last_verified` 17 Nov 2026, `outcome` `changed`, A-1…A-8 clean) / no re-attestation, keep `last_verified` 4 Nov | the work is the attestation, **only if Q1 is A or C** |

## 7. What was written (W.3), and what the checks found

On the author's decisions 1 to 8 of 17 Nov 2026 (`docs/ROADMAP-v2.md` §8), commit `fe1ab0d`: `data/applicability.json` (`ap-dma-01`: the
rationale, `last_verified` 17 Nov 2026, the `verification_note`, the attestation — `outcome` `changed`, read Arts 1, 2, 3, 5, 6, 7,
11(1), 13, 15(1), 54; `dates` unchanged); `data/claims.json` (`clm-dma-ex-ante`: the statement, `last_verified`, a
`verification_note`; type, provisions and sources unchanged); `index.html` (the English `part-4.p2`); `i18n/` (the it, fr, es
`part-4.p2` and the it `part-4.p4` withdrawn as `superseded`; `locales.json` counts and declarations); `tools/selftest.mjs` (the pinned
dates and the A-8 lists; A8's scratch copy); generated pages regenerated. Arts 1, 2(1) and 13 were read in addition to what F-18 named
because A-4 requires the attestation to cover every Article the rule cites; they agree with what the rule cites of them.

**Found by the checks, not by me, and what was done:** (1) A-4 on the first attestation (it omitted Arts 1, 2, 13): the Articles were
read, not the check loosened; (2) A-8: the two non-tier-1 sources the rule cites were read on 4 Nov and not again — decision 7: not
claimed, two named warnings accepted; (3) seven tests of `tools/selftest.mjs` pinned what the data was — §8 row before the file was
touched; (4) the 25-suite run, not the validators, found `agent/implement` S1B-h: `validate` at 7 warnings against the 5 recorded in
`docs/CURRENT-ARCHITECTURE.md` §12 — decision 8: the baseline moves 5 → 7, with a paragraph naming the two cases. **A baseline
changed by a data decision needs the 25 suites, not the validators** (the V2C-13 lesson, again).

**Measured after:** `validate` 0 errors, 7 warnings, `unverified` 47 unchanged; `i18n-audit`, `design-qa`, `seo-audit` 0;
`selftest` 200/200; `freshness`: 32 rules lapse on 3 Feb 2027 and `ap-dma-01` on 16 Feb (an earlier "28 Jan" in the F-18 prompt and
the §8 scope row was true of the tree of 3 Nov; it is not now).

**Not established, carried to the next prompt:** the self-executing character of Art. 5; the corrigenda texts; the two Commission
sources of the timeline event; the two not-re-read sources of the rule; any translation of the corrected sentences (withdrawn, not
written); consolidated law; case law.

