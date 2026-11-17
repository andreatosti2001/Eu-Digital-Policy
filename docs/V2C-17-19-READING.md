# V2C-17…19 — the DNA's acts, NIS 2 → eIDAS, and the Political Advertising `defers-to` edges: the reading notes

**Session:** V2C-17…19, Track R (`docs/prompts/v2-v2c-17-19-map-nodes.md`; scope `docs/ROADMAP-v2.md` §8, "The scope of the
V2C-17…19 session"). **Read on 17 Nov 2026**, in this environment, from the Publications Office's Cellar by CELEX with
`Accept: application/xhtml+xml` and `Accept-Language: eng`, text extracted by stripping the markup. These notes are W.1 and the W.2
proposal. **They change nothing in `data/`**: what is written there is decided by the author in §8. Where a sentence below quotes the
text, the quotation is from the file whose SHA-256 is in §1. The text read is the Official Journal original (or, for COM(2026) 16, the
Commission's document), **not a consolidated version**: no amendment made after publication is in it.

## 1. What was retrieved

| Document | Retrieval | Bytes | SHA-256 |
|---|---|---|---|
| COM(2026) 16 final, the DNA proposal (body) | handle `cellar:85e1265a-f6af-11f0-b9bc-01aa75ed71a1.0001.03/DOC_1` (the CELEX URL answers HTTP 300) | 1 718 632 | `845579362318285d62e20c3623d9a3b9ad2fa1608700f8064dca5b8e58051cf0` |
| COM(2026) 16 final, its Annexes | same, `DOC_2` | 44 602 | `040e2da79e2b1a84dc083b0e3c8e30d71f02acebb0949367e17d460c26ec0456` |
| Directive (EU) 2022/2555 (NIS 2) | `celex/32022L2555` | 702 913 | `6ee66d5c419d9a056fb98d94083cacf9b818803bd6b416435718e0d4919cb589` |
| Regulation (EU) 2024/900 (political advertising) | `celex/32024R0900` | 370 804 | `ae0a5e8fca438c320dcd9838c114b5abb8ea70292e3608d4f0e0e1eb83993302` |
| Directive (EU) 2018/1972 (EECC), Art. 1 only read | `celex/32018L1972` | 1 556 085 | `87e2dae5b83700e6f40ff105b8ee5d5395cc778ad92d4a046a44cbde3d011eb3` |
| Regulation (EU) 2018/1971 (BEREC), Art. 1 and title read | `celex/32018R1971` | 292 929 | `2072375b2e49aca56b10d4627bc42d0c2a8cbc512e886fa6cd410ca85e676382` |
| Decision No 243/2012/EU, Art. 1 and title read | `celex/32012D0243` | 120 148 | `d1a63ee9eb70a153d86eae4d0914800fafce3d9b3ead0e78756faf9254fbc801` |
| Regulation (EU) 2015/2120, Art. 1 and title read | `celex/32015R2120` | 165 618 | `6be7c7dee2051a82790baab17498a450bf43b032bcd48206bb5731a8923bc3e2` |
| Decision No 676/2002/EC | `celex/32002D0676` | — | **no text**: the XHTML request answers HTTP 404; the title was read from the metadata only (§2) |

The five acts' status was read from the Publications Office's SPARQL endpoint the same day (`resource_legal_in-force`,
`date_entry-into-force`, `date_end-of-validity`): all five are recorded **in force**, with end of validity `9999-12-31` (open);
entry into force 2018-12-20 (2018/1972, 2018/1971), 2012-04-10 (243/2012), 2002-04-24 (676/2002) and 2015-11-29 / 2016-04-30 for
2015/2120 (the endpoint returns several expressions of it). Amending acts recorded against them: 2015/2120 two, 2018/1972 one, the other
three none. **This is the metadata's statement, not a reading of consolidated law.**

## 2. V2C-17 — what the DNA does to the acts it names

**The prompt's description of the title does not match the title.** The prompt lists five acts "the DNA would repeal or amend". The
title (COM(2026) 16, p. 1) reads: "on digital networks, **amending** Regulation (EU) 2015/2120, Directive 2002/58/EC and Decision No
676/2002/EC and **repealing** Regulation (EU) 2018/1971, Directive (EU) 2018/1972 and Decision No 243/2012/EU". The operative articles
agree with the title:

| Act | Instance today | Article | What the text does |
|---|---|---|---|
| Regulation (EU) 2015/2120 (open internet, roaming) | none | **Art. 206** | "is amended as follows": the Title is replaced ("… laying down measures concerning retail charges for regulated intra-EU communications"); Art. 1(1) and (2), Art. 2 points (1) and (2), Arts 3, 4, 5 and 9 are deleted; Art. 6 first subparagraph is deleted; Art. 10(2) points (a)–(d) and Art. 10(3) and (4) are deleted. **An amendment.** |
| Directive 2002/58/EC (ePrivacy) | `eprivacy` | **Art. 207** | "Articles 7, 8, 10, 11 and 12 … are deleted. References to Article 8 … shall be read as references to Article 109 of this Regulation." **An amendment; the edge `rel-digital-networks-act-eprivacy-amends` already exists and says exactly this. Confirmed, not changed.** |
| Decision No 676/2002/EC (Radio Spectrum Decision) | none | **Art. 208** | In Art. 4 a paragraph 2a is inserted: the Commission "may require Member States to establish common positions" for the CEPT on technical implementing measures that may affect the security or technological sovereignty of the Union or of its Member States; it "shall act in accordance with the procedure referred to in Article 3(3)". **An amendment.** The Decision itself continues: Art. 195(2) refers to its Art. 4 and Art. 199(2) to the committee "established by Article 3(1) of Decision No 676/2002/EC". |
| Regulation (EU) 2018/1971 (BEREC), Directive (EU) 2018/1972 (EECC), Decision No 243/2012/EU (radio spectrum policy programme) | none | **Art. 209** | "are repealed with effect from [6 months after the date of entry into force of this Regulation]. References to [them] shall be construed as references to this Regulation." **Three repeals** (the date is in square brackets in the proposal). |

What each of the five says of itself (Art. 1, read): **2018/1972** "establishes a harmonised framework for the regulation of electronic
communications networks, electronic communications services, associated facilities and associated services, and certain aspects of
terminal equipment" — the `dna.objective` of the DNA record repeats it closely (its own Art. 1 was not re-read here); **2018/1971** "establishes [BEREC] and the
[BEREC Office]"; **243/2012** "establishes a multiannual radio spectrum policy programme for the strategic planning and harmonisation of
the use of spectrum"; **2015/2120** "establishes common rules to safeguard equal and non-discriminatory treatment of traffic in the
provision of internet access services" and "sets up a … pricing mechanism for Union-wide regulated roaming"; **676/2002** (title,
metadata only) "on a regulatory framework for radio spectrum policy in the European Community (Radio Spectrum Decision)".

**Findings against the data, none fixed:**

- **F1.** The DNA record has one edge to an act it changes (`eprivacy`, correct) and **none for the other five**. Of those, three are
  repealed (Art. 209), which the `repeals` kind exists to say. The `status_basis` source note of `src-eurlex-dna-proposal` lists
  "proposes to amend 32002L0058, 32002D0676, 32012D0243, 32015R2120, 32018L1972 and 32018R1971" — the metadata's wording; **the text
  repeals three of those six**, and the note is not wrong (it quotes the metadata) but misleads the reader who takes "amend" for the
  articles' verb. Not changed.
- **F2.** Directive 2018/1972 is touched by **two** acts in the texts read: NIS 2 **Art. 43** ("In Directive (EU) 2018/1972, Articles 40
  and 41 are deleted with effect from 18 October 2024") and the DNA Art. 209 (repeal, proposed). Neither can be drawn while it is not a
  node. The prompt did not name this; it is put to the author as a separate decision (§5, Q3).
- **F3.** Art. 199(1) says the Commission "shall be assisted by the Communications Committee established by Directive (EU) 2018/1972"
  — the Directive that Art. 209 repeals. Stated as found; no reading of its effect is offered.
- **F4.** The five acts' own articles were read for Art. 1 only. **Not read:** their remaining articles, any amendment after
  publication (2015/2120's amendments are named in the DNA's own footnotes — Regulation (EU) 2018/1971 and Regulation (EU) 2024/1309 —
  but neither text was read for what it amended), 243/2012's own duration provision (not located), and 676/2002's text (404).

## 3. V2C-18 — NIS 2 and Regulation 910/2014

**Exists.** NIS 2 **Art. 42** "Amendment of Regulation (EU) No 910/2014": "In Regulation (EU) No 910/2014, Article 19 is deleted with
effect from 18 October 2024." Both nodes exist (`nis2`, `eidas`). The source in V2C-CLOSURE ("per the metadata") is now a reading of the
text. **No edge exists between the two** (measured on `main` `83295cb`: the only `nis2`/`eidas` pair is absent). The amendment is of law in force
(the Directive entered into force on 16 January 2023; Art. 42 applies from 18 October 2024). `src-eurlex-nis2` already records Arts 4, 44, 1–6, 20–26, 32(6) and 41 as read: **Arts 42 and 43 are not in its note**.
The same Article 42 was read and quoted in V2C-21 (`docs/V2C-21-READING.md`, the table of sources and the quotation after it).

## 4. V2C-19 — Political Advertising Regulation Art. 2(3)

**Text.** Art. 2(3): "This Regulation is without prejudice to the rules laid down in the following: (a) Directive 2000/31/EC; (b) Directive
2002/58/EC; (c) Directive 2005/29/EC; (d) Directive 2006/114/EC; (e) Directive 2006/123/EC; **(f) Directive 2010/13/EU; (g) Directive
2011/83/EU; (h) Regulation (EU) 2019/1150**; (i) Regulation (EU) 2022/2065." Point (f) is the AVMSD (`avmsd`, CELEX 32010L0013), (h) the
P2B Regulation (`p2b`, 32019R1150). **Both are nodes already** (`avmsd`: out of scope, excluded; `p2b`: referenced, watched), so no node
is missing. The form is the same as the DSA's Art. 2(4) ("without prejudice to"), which the site records as `defers-to`
(`rel-dsa-avmsd-defers`, `rel-dsa-p2b-defers`) and the existing `rel-ttpa-dsa-defers` records for Art. 2(3)(i).

**Finding F5 (not in the prompt).** Of the nine acts of Art. 2(3), the data holds **one edge** (to the DSA, point (i)). Points (a)
`ecommerce-directive` and (b) `eprivacy` are nodes with no edge from `ttpa`; points (c), (d), (e) and (g) have no node (Directives
2005/29/EC, 2006/114/EC, 2006/123/EC, 2011/83/EU). The prompt names (f) and (h) only.

## 5. W.2 — what is put to the author (one question per decision; recommendation first)

| # | Item | Options | Recommendation | Rests on |
|---|---|---|---|---|
| Q1 | V2C-17: do the five acts become instances? | (A) all five, `scope:referenced`, no page, status from the metadata, no `scope_decision` (the shape of `nis1`, which NIS 2 repeals); (B) only the three the DNA repeals; (C) none — they stay named in the DNA record, no node | **A** | §2: every edge in Q2 needs both ends; `nis1` is the precedent for a repealed act as a referenced node (`rel-nis2-nis1`); the inclusion criterion of `docs/V2-DATA-DESIGN.md` §5 governs *coverage*, and `referenced` nodes carry no `scope_decision` |
| Q2 | V2C-17: the DNA's edges (asked after Q1 if A or B) | five edges from `digital-networks-act`: `repeals` → 2018/1972, 2018/1971, 243/2012 (Art. 209); `amends` → 2015/2120 (Art. 206), 676/2002 (Art. 208). Each `supports:direct`, locator Article, `provisions: []`, no claim, `last_verified` 17 Nov 2026, labelled PROPOSED in the summary | all five | §2 |
| Q3 | F2: a sixth edge, `nis2` → 2018/1972 `amends` (Art. 43), if 2018/1972 becomes a node | add / leave | add (a textual edge, `supports:direct`, from an act in force) | §2 F2 |
| Q4 | V2C-18: `nis2` → `eidas` `amends`, Art. 42 | add / leave | add | §3 |
| Q5 | V2C-19: `ttpa` → `avmsd` (Art. 2(3)(f)) and `ttpa` → `p2b` (Art. 2(3)(h)), `defers-to` | add both / add neither | add both, in the DSA edges' wording | §4 |
| Q6 | F5: the other seven acts of Art. 2(3) | add `ttpa` → `ecommerce-directive` (a) and → `eprivacy` (b), two nodes with no edge / leave all seven named only | leave (not in the prompt; a list entry is not a relationship worth a line unless the reader can follow it to a node — here two can, and that is your call) | §4 F5 |
| Q7 | the five open points carried from V2C-03…05 | treat none / name which | none (they stay named) | the prompt |

**Cost of Q1 (A), measured:** 39 instruments → 44; five new `sources` records (one per act); `docs/CURRENT-ARCHITECTURE.md` §12 and the
suites that pin instrument or edge counts must be re-run (25 suites, not only the validators — the V2C-13 and V2C-03…05 lesson); a new
instrument needs its `status_basis`, `milestones` or an empty list, and a `status_note` read from the text; **no taxonomy term is added**
(`scope:referenced`, `kind:*` and `status:in-force` exist). `eidas2`, `ap-eidas2-01` and `data/applicability.json` are untouched.

## 6. What was not established

A consolidated reading of any of the five acts; 676/2002's text; the five acts' articles other than Art. 1; any amendment of 2015/2120
or 2018/1972 other than NIS 2 Art. 43 and the DNA's; the Council's or Parliament's position on the DNA (the proposal is not law and no
status of it changed here); corrigenda (none searched); other-language texts.
