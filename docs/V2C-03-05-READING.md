# V2C-03…05 — COM(2025) 837 read against the instrument arrays: the reading notes

**Session:** V2C-03…05, Track R (`docs/prompts/v2-v2c-03-05-arrays.md`; scope `docs/ROADMAP-v2.md` §8, "The scope of the V2C-03…05
session"). **Read on 16 Nov 2026**, in this environment, from the Publications Office's Cellar by CELEX (`52025PC0837`) with
`Accept: application/pdf` and `Accept-Language: eng`, text extracted with `pdftotext -layout`. These notes are W.1. **They change
nothing in `data/`**: what is written there is decided by the author in §8 (W.2). Where a sentence below quotes the text, the
quotation is from the file whose SHA-256 is in §1.

## 1. What was retrieved

A request to `publications.europa.eu/resource/celex/52025PC0837` answers HTTP 300 and lists two manifestations; the CELEX URL
with an `.ENG.xhtml` suffix, and the handle with `Accept: application/xhtml+xml` or `text/html`, answered 404 and 406 and were
not used. Each manifestation was fetched by its handle with `Accept: application/pdf`.

| Document | Handle | Bytes | SHA-256 |
|---|---|---|---|
| COM(2025) 837 final, the proposal (body, recitals, articles, financial statement) | `…ebf17714-c56e-11f0-8da2-01aa75ed71a1.0001.02/DOC_1` | 1 132 756 | `0d954aa0795001f0cc178be3d17421630ddd83ad1fb17972d9b709483fcfc8c2` |
| COM(2025) 837 final, ANNEXES 1 to 2 (Annex I the correlation tables) | same, `DOC_2` | 109 712 | `8a2be5cc18b4d41dfa00837d71f823eda5d4a48189d2d555c60684e64b7a0ec1` |

The body's hash is the one V2C-12 recorded for the same document (`docs/V2C-12-READING.md` §1): the text read here is the text read
there. The Annexes were not retrieved in V2C-12.

## 2. What the text does, act by act

**The title.** "amending Regulations (EU) 2016/679, (EU) 2018/1724, (EU) 2018/1725, (EU) 2023/2854 and Directives 2002/58/EC, (EU)
2022/2555 and (EU) 2022/2557 … and repealing Regulations (EU) 2018/1807, (EU) 2019/1150, (EU) 2022/868, and Directive (EU)
2019/1024 (Digital Omnibus)": seven acts amended, four repealed.

**The operative articles amend nine acts, not seven.** Art. 1 the Data Act (2023/2854); Art. 2 Regulation 2018/1724; Art. 3 the GDPR;
Art. 4 Regulation 2018/1725; Art. 5 Directive 2002/58/EC; Art. 6 Directive 2022/2555; **Art. 7 Regulation 910/2014 (eIDAS)**;
**Art. 8 Regulation 2022/2554 (DORA)**; Art. 9 Directive 2022/2557. Arts 7 and 8 amend two acts the title does not name. This is a
property of the proposal's text, read; it is not a defect of any record here.

| Act | Instrument id | Article | What it does (quoted or closely paraphrased from the text) |
|---|---|---|---|
| ePrivacy Directive 2002/58/EC | `eprivacy` | Art. 5 | Point 1: "Article 4 is deleted". Point 2: after Art. 5(3) a subparagraph is added: "This paragraph shall not apply if the subscriber or user is a natural person, and the information stored or accessed constitutes or leads to the processing of personal data." The memorandum says Art. 4 is "repealed" and the new text lets the storing-and-accessing rules move to a new Art. 88a of the GDPR. **An amendment, not a repeal.** |
| NIS 2 Directive 2022/2555 | `nis2` | Art. 6 | Adds Art. 23a (a single-entry point for incident reporting, developed and maintained by ENISA); amends Art. 23 (para. 1 first sentence replaced so notification is "via the single-entry point"; a new para. 12 on a manufacturer's notification under CRA Art. 14(3)); replaces Art. 30(1). **An amendment.** |
| CER Directive 2022/2557 | `cer` | Art. 9 | Amends Art. 15: para. 1 first sentence replaced ("critical entities notify via the single-entry point established pursuant to Article 23a of Directive (EU) 2022/2555 the competent authority…"); a sub-paragraph added to para. 2 (implementing acts on the type and format of information notified). **An amendment**, as V2C-05 said. |
| eIDAS Regulation 910/2014 | `eidas` | Art. 7 | Inserts Arts 19a(1a), 24(2a) and 45a(3a): notifications "shall be made through the single-entry point pursuant to Article 23a of Directive (EU) 2022/2555". **An amendment; the record names no edge between `data-omnibus` and `eidas`.** |
| DORA 2022/2554 | `dora` | Art. 8 | Replaces the first subparagraph of Art. 19(1) and of Art. 19(2) so reports and voluntary notifications go "via the single-entry point established pursuant to Article 23a of Directive (EU) 2022/2555". **An amendment; no edge between `data-omnibus` and `dora`.** |
| Data Governance Act 2022/868 | `dga` | Art. 10(3)(a), (4) | "The following acts are repealed, with effect from [Date, aligned with the entry into application of the amendments]: a) Regulation (EU) 2022/868; …"; para. 4: references to it "shall be read in accordance with the correlation table set out in Annex I". No article amends it. The memorandum says its two regimes (Chapters III and IV) are inserted as a new Chapter VIIa of the Data Act, and Annex I carries a correlation table from 2022/868 to the Data Act. **A repeal with absorption into the Data Act. Not an amendment.** |
| P2B Regulation 2019/1150 | `p2b` | Art. 10(1)–(2) | Para. 1: "Regulation 2019/1150/EU is repealed with effect from [date = entry into application of this Regulation]". Para. 2: "By way of derogation … the following provisions shall continue to apply until 31 December 2032": Art. 2 points (1), (2) and (5); Art. 4; Art. 11; Art. 15 (six items in four Articles). **A repeal with a derogation.** |
| Data Act 2023/2854 | `data-act` | Art. 1 | Amended (Chapters VIIa and VIIb inserted, per the memorandum). Already an edge. Not read further here. |
| GDPR 2016/679 | `gdpr` | Art. 3 | Already read in V2C-12 (`docs/V2C-12-READING.md` §2.5). Not re-read here. |

Acts the proposal touches that **no instrument record exists for**: Regulation 2018/1724 (amended, Art. 2), Regulation 2018/1725
(amended, Art. 4), Regulation 2018/1807 and Directive 2019/1024 (repealed, Art. 10(3)(b), (c); the Annex I correlation tables
carry both). A relationship needs two instruments; these four cannot be edges today.

## 3. What this does to the instrument arrays

| Array entry on `data-omnibus.proposes_to_amend` | The text | |
|---|---|---|
| `gdpr` | Art. 3 amends | agrees (edge `rel-data-omnibus-gdpr`) |
| `data-act` | Art. 1 amends | agrees (edge `rel-data-omnibus-data-act-amends`) |
| `eprivacy` | Art. 5 amends | **true, and has no edge** |
| `nis2` | Art. 6 amends | **true, and has no edge** |
| `dga` | Art. 10(3)(a) **repeals** | **false as an amendment**; the edge `rel-data-omnibus-dga-repeals` is right |

| Not in any array | The text |
|---|---|
| `cer` | Art. 9 amends (V2C-05) |
| `eidas`, `dora` | Arts 7, 8 amend (not named by V2C-03…05) |
| `p2b` | Art. 10(1) repeals; the edge exists, no array can carry it |

M-15's five entries (`docs/V2C-13-MAP-CHECKS.md` §2) are, read against the text: `eprivacy` (true amendment, no edge); `nis2`
(true amendment, no edge); `dga` as an amendment (the wrong kind: Art. 10(3)(a) repeals); and two edges that no array can carry,
`rel-data-omnibus-p2b-repeals` and `rel-data-omnibus-dga-repeals` (both correct, both read). `cer`, `eidas` and `dora` are not entries:
they are amendments the text makes and that neither an array nor an edge states.

## 4. What was not read

The proposal was not read in full: its 6 792 extracted lines were searched and the operative Arts 5–11, the title, the memorandum's
account of Arts 3, 5–10 and the Annex I headings were read. **Not read here:** Art. 1's amendments to the Data Act in detail,
Art. 2 and Art. 4, the recitals beyond those quoted, the Annex I tables line by line, the Annex II, and the Staff Working Document
SWD(2025) 836. No corrigendum or Council/Parliament position was searched. Art. 11's application dates are quoted in §5 only.

## 5. Observations that are not part of any decision

- `rel-data-omnibus-p2b-repeals`'s summary says "keeping four provisions until 31 December 2032". Art. 10(2) lists six items
  (Art. 2 points (1), (2), (5); Arts 4, 11, 15), in four Articles. The sentence is true if it counts Articles, and is loose if it
  counts the items. The memorandum describes the derogation differently: it speaks of cross-references to the P2B Regulation in other
  acts, which "remain in application until amended … at the latest by 31 December 2032". The article text and the memorandum do not
  say the same thing; the edge cites the article.
- Art. 11: Arts 6(2) and (3) and 7 to 9 "shall enter into application 18 months from the entry into force"; Art. 6(1) (the new
  Art. 23a) is not in that list; Art. 5(2) applies 6 months after publication. Where the Commission finds the single-entry point
  inadequate the obligations "set out in Article 23(4) of Directive (EU) 2022/2555, Article 19a(1a), Article 24(2a) and Article
  45a(3a) of Regulation (EU) 910/2014, Article 33(1) of Regulation (EU) 2016/679, Article 19(1) and (2) of Regulation (EU)
  2022/2554, and Article 15(1) of Directive (EU) 2022/2557" apply 24 months from entry into force. None of this is stored by
  these notes.
- Art. 3 of the proposal amends GDPR Art. 33 (its point 8: the controller notifies a personal-data breach "not later than 96 hours
  after having become aware of it … via the single-entry point established pursuant to Article 23a of Directive (EU) 2022/2555").
  The memorandum calls this "Article 3(6)"; the operative text numbers it point 8, and Art. 11 refers to "Article 3(8), points (a)
  to (c)". `rel-data-omnibus-gdpr` lists points 1(a), 10 and 15 and does not mention it. **Not decided here; named.**
