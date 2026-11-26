# Rules maintenance, group (b) — the reading notes

**Lifecycle:** closed · **Authority:** canonical · **Home of:** rules maintenance group (b), 18 Nov 2026 · **Closed by:** «Final checkpoint of the rules-maintenance session, group (b)» · **Catalogue:** `docs/README.md`

**Session:** Track R, rules maintenance, group (b) (`docs/prompts/v2-rules-maintenance-group-b.md`; scope `docs/ROADMAP-v2.md` §8, 18 Nov 2026,
"The scope of the rules-maintenance session (group (b))": all instruments in stages, `ap-eidas2-01` left to Track M). **Read on 18 Nov 2026**, in this
environment, from the Publications Office's Cellar by CELEX with `Accept: application/xhtml+xml` and `Accept-Language: eng`, text extracted by stripping
the markup, and from the Commission's and the EDPB's own pages. These notes are W.1 and the W.2 proposal. **They change nothing in `data/`, `i18n/` or
the brief**: what is written there is decided by the author in §8.

## 1. The premise, measured (18 Nov 2026, full clone, `main` at `2f5c1ef`)

- 33 rules; `ap-eidas2-01` is Track M's (decision of 18 Nov), `ap-dma-01` was re-read and attested on 17 Nov (F-18). **31 rules remain**, all at `last_verified`
  2026-11-04: gdpr 4 + `ap-cross-01`, dsa 5, ai-act 7, data-act 4, dma 3 (`-02`, `-03`, `-04`), nis2 3, dora 2, cra 1, pld 1.
- `freshness --as-of 2027-02-03` names 32 `RULE_STALE` (the 31 and `ap-eidas2-01`); T-12 fires on `ap-cra-01` on 26 Mar 2027 (`docs/RULE-MAINTENANCE.md` §0).
- Eight of the 31 carry **no** `attestation` (the eight closed on 4 Nov 2026 without the form: `ap-nis2-01`, `-02`, `ap-cra-01`, `ap-ai-act-02`, `-06`, `ap-gdpr-04`, `ap-dsa-03`, `ap-dma-04`). The form is
  **required** of every rule whose `last_verified` moves later than 2026-11-04 (A-3), so each closure writes it; A-4 (every cited Article in `read`), A-5 (every tier-1 text in `queried`) and A-7 (the note names the CELEX)
  are met by what §2 and §3 record.
- Validators on the tree before any write (saved for comparison): `validate`, `i18n-audit`, `design-qa`, `seo-audit`, `freshness --as-of 2026-11-18`,
  `evidence-audit --as-of 2026-11-18` all exit 0; `node --test tools/selftest.mjs` 201 pass, 0 fail.

## 2. What was retrieved today

| Document | Retrieval | SHA-256 |
|---|---|---|
| Regulation (EU) 2024/2847 (CRA) | Cellar `celex/32024R2847`, XHTML, HTTP 200, 710 696 B | `fe0cca4a0caec50e7cf5a91432b94a19b211f86be8584fdba56372bdcea571ed` |
| Regulation (EU) 2025/327 (EHDS) | `celex/32025R0327`, 884 421 B | `bf331ac48264118fb0461f793123a2726da88195a11d4bccb2075fd6326909da` |
| Directive (EU) 2024/2853 (PLD) | `celex/32024L2853`, 223 057 B | `5f20d9d33eb307683419f481f0e661e1be9d2daf186780a65c20d7690bf940b5` |
| Regulation (EU) 2022/2554 (DORA) | `celex/32022R2554`, 746 866 B | `cf50d8f023d23b2a56f535aaee0760eba7f1925ef08a9858c5c31d43d414f46b` |
| Directive (EU) 2022/2555 (NIS2) | `celex/32022L2555`, 702 913 B | `6ee66d5c419d9a056fb98d94083cacf9b818803bd6b416435718e0d4919cb589` (**identical to 17 Nov**) |
| Regulation (EU) 2022/1925 (DMA) | `celex/32022R1925`, 518 017 B | `d6af21a4f11c2b001b0486391fbd0813deba32305fb0d3865fbceccd45b827eb` (**identical to 17 Nov**) |
| Regulation (EU) 2023/2854 (Data Act) | `celex/32023R2854`, 590 794 B | `1085b7fa3011970b65b1e4d56205202dceb37f72cd22336aa0c78af35ceaea66` |
| Regulation (EU) 2022/2065 (DSA) | `celex/32022R2065`, 838 166 B | `11b119a7d45f3a10cd41714061f9d907839ef5d1634e41774490f00b95856bbf` |
| Delegated Regulation (EU) 2025/2050 | `celex/32025R2050`, 161 740 B | `23ca6a5e2fffa06c5847e91f25a19777f27c9f08a4a6fee45e7c42931f4d1997` |
| Regulation (EU) 2016/679 (GDPR) | `celex/32016R0679`, 806 864 B | `962539af03738bf552319ff4ce42d69e5f95a576307c4dfed7bf87e81b646b9d` |
| Regulation (EU) 2024/1689 (AI Act) | `celex/32024R1689`, 1 262 391 B | `8f0b656302f9864cc87e040c371f209a9d65ae1a6cecc25ca5eb737e872d721a` (**identical to 17 Nov**) |
| Regulation (EU) 2026/1744 (AI Omnibus) | `celex/32026R1744`, 351 287 B | `9d754652b867722807e4219c85912ce354233e58a1b4eb8c7752b4d1922993db` (**identical to 17 Nov**) |
| TEU, Art. 4 | `celex/12016M004`, 2 520 B | `5e6bbe07535d607a94a3c0dc10e0fd809d2e1fff30f021f9c1bf745c5eb90598` |
| Commission news item, NIS2 referral (`src-ec-nis2-referral-2026`; «Last update 9 July 2026») | its URL, HTTP 200 | `bcfcdb9c4a55476958bbccc9aeb0b57be6a94dface5f21594ad6d87bac89004f` (the page differs byte-wise from 17 Nov's `5688bfdd…`; the sentence «While most complied, Spain, France, Ireland and the Netherlands have yet to notify full transposition» is unchanged) |
| DMA Review Report COM(2026) 178 (`src-ec-dma-review-2026`) | PDF, `pdftotext`, Section 4 p. 8 and Section 5 p. 14 | `493a4c1159f4686e659312b312a5002b988cb1b5a6b89411d00ed8ad2707a129` |
| IP/25/2717 (`src-ec-dma-cloud-mi-2025`) | press corner documents API, JSON, HTTP 200 (the HTML URL is a script shell) | `8f49651ec8203e981f0e7a95b2049a07f989bef05b30c22a832b679d1ddd7c9e` |
| Commission news item, preliminary position on AWS and Azure (`src-ec-cloud-gatekeeper-preliminary-2026`) | its URL, HTTP 200 | `95d79db19dd8f900b353197f527ea1d322a414caf552663a2400f7fecc6d2b18` |
| Commission page, AI Code of Practice (`src-ec-gpai-code`) | its URL, HTTP 200 | `4f8653d2b6fbc7bc294914cd9907a0728f888f45012a75d74b57d1c842221298` |
| Commission news item, «AI omnibus enters into force» (`src-ec-ai-omnibus-in-force`) | its URL, HTTP 200 | `155ad1b6c868a10804968857c22953d71513f1786301843525d33763af5abcf7` |
| EDPB Guidelines 3/2025, **Version 2.0, adopted 17 September 2026** (`src-edpb-guidelines-3-2025`) | PDF linked from the source's page, `pdftotext` | `a9ec7227f142742a5baa2b7328326373516e5bc19b06f8d40b94ce727eca8022` |

**SPARQL (P-09), re-run today** with the two queries of `docs/RULE-MAINTENANCE.md` §2 on every CELEX above: **no amending act appears for any instrument except
the two already known** (EHDS amending the CRA; Regulation (EU) 2026/1744 amending the AI Act); no act amends or corrects 2025/2050 or 12016M004; and the
corrigenda match the 4 Nov counts (CRA 8, DORA 9, NIS2 9, DMA 3, Data Act 7, DSA 11, GDPR 3, AI Act 4, 2026/1744 1) with **one addition: PLD `32024L2853R(03)`, dated
2026-11-11**, after the last reading. English expressions: CRA R(01), R(02), R(04); PLD R(01); NIS2 R(04); DMA R(02); Data Act R(01); GDPR R(02); none for
DORA, DSA, the AI Act or 2026/1744. Every other corrigendum was requested by CELEX in XHTML and in HTML: **HTTP 404 in both** (so «no English expression» is measured, not
inferred). Read today: CRA R(01) (title), R(02) (Art. 64(10)), R(04) (Art. 67); PLD R(01) (Art. 2(1): «after 8 December 2026»); NIS2 R(04) (Art. 19(1)); DMA R(02)
(Art. 13(8)); Data Act R(01) (Art. 48); GDPR R(02) (recital 71): **none touches a provision a rule cites**. **Not readable and so not read: 53 corrigenda** (CRA 5, PLD 2, DORA 9, NIS2 8, DMA 2, Data Act 6, DSA 11, GDPR 2, AI Act 4, Regulation 2026/1744 1, EHDS 3), among them PLD R(02) (29 Sep 2026)
and R(03) (11 Nov 2026), whose content is unknown.

## 3. Reading, instrument by instrument

Every Article, point and recital a rule cites (`sources[].locator`, `exemptions[].basis[].locator`, `obligations`, `condition_provisions`) was opened in the text above and
read against the rule's `rationale`, `exemptions`, `depends_on` and `dates`. **«Holds» means the rule says what the text says; where it does not, §4 lists it.**

| Instrument | Rules | Result |
|---|---|---|
| CRA | `ap-cra-01` | **Holds.** Arts 2(1)–(7), 3 points (1), (13), (14), (21), (22), 13(1), 14(1)–(4), 69(2)–(3), 71(2) read; the exemptions of Art. 2(2), (3), (4), (6), (7) and Art. 69(2)–(3) are the text's. EHDS Art. 104 (replaces Art. 13(4) and 31(3), inserts Art. 32(5a)) and Art. 105 (applies from 26 March 2027) read again; Arts 13(1) and 14 untouched, as the 29 Oct decision («a note, no reference») assumed. |
| PLD | `ap-pld-01` | **Holds.** Arts 1, 2, 4 points (1), (10), (15), 8, 21, 22 and recital 13 read; Art. 2(1) of the OJ text says «after 9 December 2026», corrigendum R(01) «after 8 December 2026», the rule says «from 9 December 2026». **R(02) and R(03) unreadable** (§2). |
| DORA | `ap-dora-01`, `-02` | **Hold.** Arts 2(1)–(4), 3 points (19), (21), (23), 4, 5, 6, 16(1), 17, 19, 24(1), 28, 30, 31(8), 33, 64 read; Art. 2(3), 2(4), 16(1), 24(1) are the exemptions as written; application 17 Jan 2025 (Art. 64). |
| NIS2 | `ap-nis2-01`, `-02`, `-03` | **Hold** (one evaluative sentence in `-01`, §4 D3). Arts 2, 3, 6 points (30), (31), (35), 20, 21, 23, 32(6), 41, Annex I points 8 and 10 read; «ten measures» = Art. 21(2)(a)–(j); 24 h / 72 h / one month = Art. 23(4)(a), (b), (d); Art. 41(1) «from 18 October 2024». The press release (`src-ec-nis2-referral-2026`) carries the sentence `depends_on` reports. |
| DMA | `ap-dma-02`, `-03`, `-04` | **Hold.** Arts 1(2), 2 points (1), (2)(i), (13), (21), 3(1)–(4), (8), 5(4), (6), 6(10), 54 read; the review report p. 8 and p. 14 say what `-03` quotes; IP/25/2717 says «within 12 months» and «within 18 months»; the gatekeepers page (read 18 Nov, partial: 3.8 kB of text, script-rendered) shows no cloud computing service. `tl-dma-2026-11-01-designation` is still `scheduled` and Nov 2026 is the Commission's target (18 Nov 2026 is the 12-month mark); no designation decision was found. |
| Data Act | `ap-data-act-01`…`-04` | **`-02`, `-03` hold; `-01`, `-04` have a divergence each** (§4 D5, D4). Arts 1(2), (3), (5), 2, 3(1), 4(6)–(9), 7(1), 23, 25, 29(1), 31, 50 read. |
| DSA | `ap-dsa-01`, `-02`, `-03`, `-05` hold; **`-04` has one** (§4 D6) | Arts 2, 3 points (f), (i), (l), (p), (s), 16, 17, 19, 20, 25, 26, 27, 28, 29, 30, 33, 34, 35, 37, 38, 39, 40(4), (8), (9), (12), 43, 56(2) read; Delegated Regulation 2025/2050 Arts 1 and 16 read. |
| GDPR | `ap-gdpr-01`, `-03`, `ap-cross-01` hold; **`-02` (§4 D2) and `-04` (§4 D8)** | Arts 2, 3, 4 points (1), (2), (4), (7), (8), 5(1)(c), 6, 22(1), 25, 30(5), 33, 35, 37(1)(a), 99, recitals 19 and 23 read; EDPB Guidelines 3/2025 v2.0 paras 7–11, 80, 88, 93–95 read (the paragraph numbers the source record cites exist in Version 2.0). |
| AI Act | `ap-ai-act-01`…`-05`, `-07` hold; **`-06` has two** (§4 D1) | Arts 2, 3 points (1), (3), (4), (9), (63)–(65), 4 (as replaced), 5(1), 6, 9, 10–12, 14, 15, 25, 27, 43, 49, 51–53, 55, 111(3), 113 read; Omnibus Art. 1 points (5), (7), (8), (12), (13), (40) read: Art. 113 third paragraph points (a) and (c) as the rules state them; the Omnibus (OJ 24.7.2026, in force on the third day, 27 July 2026) recasts Art. 4; TEU Art. 4(2) third sentence: «national security remains the sole responsibility of each Member State». |

## 4. The divergences (text · site · what the text allows the site to say)

| # | Rule, field | The text says | The site says | What the text allows | Recommendation |
|---|---|---|---|---|---|
| D1 | `ap-ai-act-06` `rationale` | Art. 5(1)(c) prohibits AI systems for the evaluation or classification of natural persons over time based on social behaviour or characteristics, with a social score leading to the effects listed — **without limiting the actor**; Art. 5(1)(f) prohibits inferring emotions in the workplace and education **«except where the use … is intended to be put in place or into the market for medical or safety reasons»** | «Social scoring by government, … and emotion recognition in workplaces and educational institutions are prohibited outright.» | that the Art. 5 prohibitions bind public authorities as well as firms (Art. 2(1)(a)–(c); Art. 3 points (3), (4)); social scoring as the text defines it, not «by government»; emotion inference in workplace and education prohibited **save for medical or safety reasons** | reword to the text |
| D2 | `ap-gdpr-02` `rationale` and `sources` | recital 23: «the mere accessibility of the controller's, processor's or an intermediary's website in the Union … is insufficient to ascertain such intention» | «merely being accessible from the Union is not enough» — the rule cites Art. 3(2)(a) and (b) and **no recital** | the sentence, if recital 23 is a `for: "rationale"` source (the precedent is `ap-pld-01` recital 13) | add recital 23 as a source; no word changed |
| D3 | `ap-nis2-01` `rationale` | Art. 32(6): MS ensure natural persons responsible for an essential entity have the power to ensure compliance and that **it is possible to hold them liable**; nothing on effect | «the provision that actually changes boardroom behaviour» | the liability stated in Art. 32(6) | leave; name it (an evaluative sentence, not an error) |
| D4 | `ap-data-act-04` `rationale` | Art. 1(2): «covers personal and non-personal data»; Art. 1(5): data protection law prevails in a conflict | «personal or not, though predominantly non-personal, industrial and machine-generated» | personal and non-personal data; GDPR prevails | delete the «predominantly …» clause **or** attribute it; the text does not carry it |
| D5 | `ap-data-act-01` `rationale` | Art. 23: providers «shall not impose and shall remove pre-commercial, commercial, technical, contractual and organisational obstacles, which inhibit customers from» terminating, concluding new contracts, porting, achieving equivalence, unbundling | «must remove **all** pre-commercial, … obstacles to switching»; «carries most of the Regulation's practical weight for the software industry» | «must not impose, and must remove, the … obstacles that inhibit customers from switching (Art. 23)» | drop «all»; leave the weight sentence and name it |
| D6 | `ap-dsa-04` `rationale` | Art. 30(2): the provider «shall … make best efforts to assess whether the information … is reliable and complete»; Art. 30(7): make points (a), (d), (e) available to recipients | «must obtain and **check** specified trader information … and must design its interface so that the trader's identity is visible» | «obtain specified trader information and make best efforts to assess whether it is reliable and complete … and make the trader's name and contact details, register entry and self-certification available on its interface» | reword «check» to the text's «make best efforts to assess» |
| D7 | `ap-ai-act-04` `rationale`, `ap-ai-act-05` `rationale` | no Article says either | «Most deployed AI never leaves the minimal-risk tier» (`-04`); «Article 25 is the trap most often missed» (`-05`) | the Articles' content | leave; name them |
| D8 | `ap-gdpr-04` `rationale` | Art. 22(1) and Art. 99(2) (25 May 2018) | «applies to systems the AI Act classifies as minimal risk» | that Art. 22(1) applies whatever else applies (Art. 2(1)) | leave; name it |

## 5. The proposal (W.2) — what is put to the author

1. **The 24 rules with no divergence** (`ap-cra-01`, `ap-pld-01`, `ap-dora-01`, `-02`, `ap-nis2-02`, `-03`, `ap-dma-02`, `-03`, `-04`, `ap-data-act-02`, `-03`, `ap-dsa-01`, `-02`, `-03`, `-05`, `ap-gdpr-01`,
   `-03`, `ap-cross-01`, `ap-ai-act-01`, `-02`, `-03`, `-04`, `-05`, `-07`): re-attest **unchanged**, `last_verified` 2026-11-18, `attestation` as in `docs/ATTESTATION-FORM.md`, the `verification_note` rewritten to say what was read.
   (`ap-ai-act-04`'s and `-05`'s D7 sentence is carried unchanged and named.)
2. **The seven with a divergence** (`ap-nis2-01`, `ap-data-act-01`, `-04`, `ap-dsa-04`, `ap-gdpr-02`, `-04`, `ap-ai-act-06`): D1, D2, D5, D6 and D4 are decided one at a time; D3 and D8 are carried unchanged and named.
3. **Corrigenda that cannot be read** (§2): attest with them declared in the note (the 4 Nov precedent), or leave the rule. The new fact is PLD R(03).
4. **Pins**: `tools/selftest.mjs` fixes the dates of the 4 Nov reading (`READ_2026_11_04`, `READ_V2_23`); moving 31 `last_verified` needs the author's word to move the pins and nothing else in `tools/`.
5. **Not read, declared**: the claims the rules cite (`clm-…`) were not re-read; the consolidated texts were not read (Cellar serves the OJ original and the amending acts separately); the national transposition laws; the Commission's FAQs.

## 6. What this reading does not establish

That the law was read by anyone but the session, on any date: nothing in the tree can say (`docs/ATTESTATION-FORM.md` §6). That the Articles' paragraphs were each compared (A-4 is at Article level). That the 53 unreadable
corrigenda change nothing cited. That Cellar's XHTML is the Official Journal's text byte for byte; it is the text Cellar serves. That the DMA gatekeepers page is complete: it rendered 3.8 kB of text.
