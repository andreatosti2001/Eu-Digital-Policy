# V2C-12 — the eight v1 relationships of `data/instruments.json`, read against their sources: the reading notes

**Lifecycle:** closed · **Authority:** canonical · **Home of:** V2C-12, 15 Nov 2026 · **Closed by:** «Final checkpoint of the V2C-12 session» · **Catalogue:** `docs/README.md`

**Session:** V2C-12, Track R (`docs/prompts/v2-v2c-12-v1-relationships.md`; scope `docs/ROADMAP-v2.md` §8, "The scope of the
V2C-12 session"). **Read on 15 Nov 2026**, in this environment, from the Publications Office's Cellar by CELEX with
`Accept: application/xhtml+xml` and `Accept-Language: eng` (the two proposals as PDF/HTML manifestations, §1). These notes are
W.1. **They change nothing in `data/`**: what is written there is decided by the author in §8 (W.2) and recorded at the end of
this file. The texts were read here, not recalled; where a sentence below quotes a text, the quotation is from the file whose
SHA-256 is in §1.

## 1. What was retrieved

| Document | CELEX / handle | Bytes | SHA-256 |
|---|---|---|---|
| Regulation (EU) 2016/679 (GDPR) | 32016R0679 | 806 864 | `962539af03738bf552319ff4ce42d69e5f95a576307c4dfed7bf87e81b646b9d` |
| Regulation (EU) 2022/2065 (DSA) | 32022R2065 | 838 166 | `11b119a7d45f3a10cd41714061f9d907839ef5d1634e41774490f00b95856bbf` |
| Regulation (EU) 2022/1925 (DMA) | 32022R1925 | 518 017 | `d6af21a4f11c2b001b0486391fbd0813deba32305fb0d3865fbceccd45b827eb` |
| Directive (EU) 2022/2555 (NIS 2) | 32022L2555 | 702 913 | `6ee66d5c419d9a056fb98d94083cacf9b818803bd6b416435718e0d4919cb589` |
| Directive (EU) 2022/2557 (CER) | 32022L2557 | 320 830 | `fd1e80bbc7ee68a0b35fd51f4a2b618298258a58c6e7b8e0b971fb5cebb279d0` |
| Regulation (EU) 2024/2847 (CRA) | 32024R2847 | 710 696 | `fe0cca4a0caec50e7cf5a91432b94a19b211f86be8584fdba56372bdcea571ed` |
| Regulation (EU) 2023/2854 (Data Act) | 32023R2854 | 590 794 | `1085b7fa3011970b65b1e4d56205202dceb37f72cd22336aa0c78af35ceaea66` |
| Regulation (EU) 2024/1689 (AI Act) | 32024R1689 | 1 262 391 | `8f0b656302f9864cc87e040c371f209a9d65ae1a6cecc25ca5eb737e872d721a` |
| TFEU Art. 114 (OJ C 202, 7.6.2016, p. 94) | 12016E114 | 5 628 | `85dcae05324aa9dc93e221b1b19ddfd4072f4c47378f562bd4dff812c4023426` |
| TEU Art. 4 (OJ C 202, 7.6.2016, p. 18) | 12016M004 | 2 520 | `5e6bbe07535d607a94a3c0dc10e0fd809d2e1fff30f021f9c1bf745c5eb90598` |
| COM(2025) 837 final (Digital Omnibus), PDF | 52025PC0837 (`…ebf17714-c56e-11f0-8da2-01aa75ed71a1.0001.02/DOC_1`) | 1 132 756 | `0d954aa0795001f0cc178be3d17421630ddd83ad1fb17972d9b709483fcfc8c2` |
| COM(2026) 502 final (Cloud and AI Development Act), body, HTML | 52026PC0502 (`…6e73e2db-5f40-11f1-aa6d-01aa75ed71a1.0001.03/DOC_1`) | 842 771 | `811d9b7e2c762ba6ce994513de3ac27bc163c3f1deb68ededccfaa0751d1bb14` |
| COM(2026) 502 final, **Annexes** I–III, HTML | same manifestation, `DOC_2` | 114 942 | `0dfa4719efb98240449f178d91eb62adc8f93b2ed2421c685f9cc83552b0fbb4` |
| Council ST 10104/26 (transmission of COM(2026) 502 final), PDF — the document `src-council-cloud-ai-act-2026` cites | `data.consilium.europa.eu/doc/document/ST-10104-2026-INIT/en/pdf` | 1 281 425 | `aeaa1ef43d05fb8b529b998645e37d394812b49344f8e412e5b30fc905356e73` |

The Council PDF contains the proposal's body and its explanatory memorandum but **not its Annexes**; the Annexes were read from
Cellar's own manifestation (row 14). The two proposals' texts agree where they were compared (the "Consistency with existing
policy provisions" passage appears in both).

**Not read, and the limit that follows:** consolidated versions (none used; each text is the Official Journal text as
published); corrigenda to any of the eight acts (none was looked up this session — V2C-21b's SPARQL check was for Regulation
(EU) No 910/2014 only, so **whether a corrigendum changes a sentence quoted below was not established**); the Annexes of the
eight acts other than CADA's; anything published after the dates of the texts above. A proposal's text (COM(2025) 837,
COM(2026) 502) is the Commission's proposal as transmitted, not what the co-legislators may adopt.

## 2. The reading, one relationship at a time

For each: what the relationship says, which provision is said to carry it, what the text says, and the verdict. The verdict
scale is the taxonomy's `supports`: **direct** (the text states the proposition), **partial** (the text states part of it, or the
components it is built from), **context**. A proposition the text does not carry is named as such.

### 2.1 `rel-dsa-dma-scope` — `dsa` ↔ `dma`, complement

*Says:* both regulate large platforms on different axes (DSA: systemic risk and due diligence; DMA: contestability and
fairness); designation under one does not imply designation under the other. *Provisions:* `dsa:art-33`, `dma:art-3`.

*Text:* DSA Art. 33(1): the Section applies to online platforms and online search engines with ≥ 45 million average monthly
active recipients in the Union **and designated** under Art. 33(4); Art. 33(4): the Commission adopts a designation decision on
that number; Art. 34(1): providers of very large online platforms/search engines assess "systemic risks in the Union".
DMA Art. 1(1): the purpose is "contestable and fair markets in the digital sector … where gatekeepers are present"; Art. 3(1): an
undertaking is designated a gatekeeper if it has a significant impact on the internal market, provides a core platform service
that is an important gateway, and enjoys an entrenched and durable position; Art. 3(2): presumptions at EUR 7.5 billion turnover
or EUR 75 billion market capitalisation, 45 million monthly active end users **and** 10 000 yearly active business users,
three financial years; Art. 3(4), (8) designation procedures. DMA recital (12) says the Regulation applies "without prejudice to
… a Regulation on a single market for digital services" — the DSA, unnamed in the OJ text because it was not yet adopted.

*Verdict:* **the two axes: direct, from each text's own Articles. "Designation under one does not imply designation under the
other": partial.** Neither text makes designation under the other a condition, and the two criteria differ in object (the DSA
designates a *service*, the DMA an *undertaking* and its *core platform services*), in thresholds and in procedure; but no
provision says "does not imply", and I found **no cross-reference between the two designation provisions in either text** (the
DMA text contains no mention of the DSA by number or by name; the DSA text none of the DMA). The non-implication is the site's
inference from two independent criteria. It is a sound one, and it is an inference.

### 2.2 `rel-nis2-cer` — `nis2` ↔ `cer`, complement

*Says:* companion directives sharing a transposition deadline; NIS 2 on cyber resilience, CER on the physical and
organisational resilience of critical entities. *Provisions:* none.

*Text:* NIS 2 Art. 41(1): "By 17 October 2024, Member States shall adopt and publish the measures necessary to comply with this
Directive … They shall apply those measures from 18 October 2024." CER Art. 26(1): **word for word the same dates.**
NIS 2 Art. 2(3): "Regardless of their size, this Directive applies to entities identified as critical entities under Directive
(EU) 2022/2557"; Art. 1(2)(b): risk-management measures and reporting for Annex I/II entities "as well as for entities
identified as critical entities under Directive (EU) 2022/2557"; recital (30): critical entities "should be considered to be
essential entities". CER Art. 1(2): "This Directive shall not apply to matters covered by Directive (EU) 2022/2555, without
prejudice to Article 8 …; … Member States shall ensure that this Directive and Directive (EU) 2022/2555 are implemented in a
coordinated manner"; Art. 1(1)(a)–(b), (e): resilience of critical entities and of the services they provide; recital (20):
digital-infrastructure entities are to be outside CER's Art. 11 and Chapters III, IV and VI because NIS 2's requirements are "at
least equivalent" (the operative carve-out is not re-read here beyond Art. 1(2)).

*Verdict:* **direct** on every element of the summary: the shared deadline (both Arts, the same two dates), the companion
character (each text names the other and allocates matters between them), and the split of subject matter (NIS 2: cybersecurity,
Art. 1(1); CER: resilience of critical entities, Art. 1(1)). "Physical and organisational" is the site's gloss on CER; the text
says "resilience", and speaks of "physical security" and "cybersecurity" together in Art. 1(2). It does not change what the
edge asserts. *Note:* `cer` has **no provision records** in `data/instruments.json`, and `nis2:art-41` is not one either; the
only existing provision that carries the edge is `nis2:art-2`.

### 2.3 `rel-cra-nis2` — `cra` ↔ `nis2`, complement

*Says:* the CRA regulates the security of products with digital elements; NIS 2 the security of the entities that operate them.
*Provisions:* none.

*Text:* CRA Art. 1(a)–(b): rules "for the making available on the market of products with digital elements to ensure the
cybersecurity of such products" and "essential cybersecurity requirements for the design, development and production" of them.
NIS 2 Art. 1(1)–(2): "a high common level of cybersecurity across the Union"; risk-management measures and reporting obligations
for entities (Arts 20–21, 23); Art. 21(2)(d): supply-chain security. The two texts are linked **in terms**: CRA recital (24):
Directive 2022/2555 "aims at ensuring a high level of cybersecurity of services provided by essential and important entities";
the CRA "also aims at facilitating the compliance of digital infrastructure providers with the supply chain requirements" under
it; recital (125): the CRA "will facilitate the compliance with supply chain security obligations of entities that fall within
the scope of … Directive (EU) 2022/2555 that **use** products with digital elements"; CRA Art. 14(1) and Art. 3 (a "CSIRT
designated as coordinator" is one designated under NIS 2 Art. 12(1)): manufacturers notify actively exploited
vulnerabilities to those CSIRTs and ENISA; Art. 3 defines "incident" and "near miss" by reference to NIS 2 Art. 6, points (6) and (5).

*Verdict:* the CRA half is **direct** (Art. 1). The NIS 2 half is **partial**: NIS 2 is about the security of the *entities* and
of the services they provide (Art. 1(2)(b), Art. 21), which the text states; "the entities that **operate** them" (the products)
is the site's paraphrase — the CRA's own recital says entities that *use* such products, and NIS 2 does not say that its
entities operate CRA products. The relationship as a whole (they complement each other, the CRA feeding the entities' supply
chain obligations) is stated by the CRA, recitals (24) and (125), and is **not** in doubt.

### 2.4 `rel-ai-act-teu-4-2` — `teu` → `ai-act`, carve-out

*Says:* Art. 4(2) TEU reserves national security to the Member States, and the AI Act does not apply to AI systems used
exclusively for military, defence or national security purposes (Art. 2(3)); the brief argues this is the structural source of
the asymmetry between constraint on corporate and on state power. *Provisions:* `teu:art-4-2`, `ai-act:art-2`. *Claims:*
`clm-art-4-2-teu-carve-out`, `clm-enforcement-asymmetry`.

*Text:* TEU Art. 4(2), third sentence: "In particular, national security remains the sole responsibility of each Member State."
AI Act Art. 2(3), first subparagraph: the Regulation "does not apply to areas outside the scope of Union law, and shall not, in
any event, affect the competences of the Member States concerning national security"; second subparagraph: "This Regulation does
not apply to AI systems where and in so far they are placed on the market, put into service, or used with or without
modification **exclusively** for military, defence or national security purposes, regardless of the type of entity carrying out
those activities." **AI Act recital (24) ties the two in terms:** "As regards national security purposes, the exclusion is
justified both by the fact that national security remains the sole responsibility of Member States in accordance with Article
4(2) TEU and by the specific nature and operational needs of national security activities…"; for military and defence the
exclusion "is justified both by Article 4(2) TEU and by the specificities of the Member States' and the common Union defence
policy".

*Verdict:* **direct** for the textual half (TEU Art. 4(2); AI Act Art. 2(3); recital (24)). The "structural source of the
asymmetry" half is **attributed to the brief in the summary itself** and rests on `clm-enforcement-asymmetry`, a critique; the
text does not say it and the summary does not claim that it does. Nothing to correct.

### 2.5 `rel-data-omnibus-gdpr` — `data-omnibus` → `gdpr`, amends (proposed)

*Says:* PROPOSED amendment only; the Digital Omnibus proposes changes to the personal-data definition, a new Art. 41a,
relocation of cookie consent to Art. 88a and a new Art. 88c; none is law. *Provisions:* none. *Claims:*
`clm-omnibus-four-gdpr-reforms`.

*Text (COM(2025) 837 final, Art. 3 "Amendments to Regulation (EU) 2016/679 (GDPR)"):* point 1(a) adds to Art. 4(1) the
sentences "Information shall not be personal for a given entity where that entity cannot identify the natural person to whom the
information relates, taking into account the means reasonably likely to be used by that entity …"; point 10 inserts Art. 41a
("The Commission may adopt implementing acts to specify means and criteria to determine whether data resulting from
pseudonymisation no longer constitutes personal data for certain entities"); point 15 inserts Art. 88a ("Storing of personal
data, or gaining of access to personal data already stored, in the terminal equipment of a natural person is only allowed when
that person has given his or her consent …") and Art. 88c (processing "in the context of the development and operation of an AI
system … may be pursued for legitimate interests within the meaning of Article 6(1)(f)", subject to the conditions it states).

*Verdict:* **direct**, with a structural locator, on every element of the summary, and identical to what `clm-omnibus-four-gdpr-reforms`
already records (its locator, "Art. 3 … point 1(a) … point 10 … point 15", was re-resolved here against the same text). "Not law" is
a statement about status, which this session does not re-measure (§8, "Not touched").

### 2.6 `rel-ai-act-gdpr-impact-assessments` — `ai-act` ↔ `gdpr`, overlap

*Says:* GDPR Art. 35 DPIAs, DSA Art. 34 systemic risk assessments and AI Act Art. 27 fundamental rights impact assessments are
three overlapping assessment duties "that regulators themselves acknowledge are duplicated". *Provisions:* `gdpr:art-35`,
`dsa:art-34`, `ai-act:art-27`. *Claim:* `clm-three-impact-assessments` (itself noted: "the claim that regulators acknowledge the
duplication is not sourced").

*Text:* GDPR Art. 35(1): the *controller* carries out a data protection impact assessment where processing is "likely to result
in a high risk to the rights and freedoms of natural persons". AI Act Art. 27(1): certain *deployers* of high-risk AI systems
perform "an assessment of the impact on fundamental rights that the use of such system may produce"; **Art. 27(4): "If any of the
obligations laid down in this Article is already met through the data protection impact assessment conducted pursuant to Article
35 of Regulation (EU) 2016/679 …, the fundamental rights impact assessment … shall complement that data protection impact
assessment."** DSA Art. 34(1): providers of very large online platforms and search engines assess "systemic risks in the Union",
including negative effects on fundamental rights, "to the protection of personal data enshrined in Article 8 of the Charter"
(point (b)). **The DSA text has no reference to Art. 35 GDPR or to Art. 27 AI Act, and neither of those mentions Art. 34 DSA.**

*Verdict:* **AI Act ↔ GDPR: direct** — the legislator itself provides that Art. 27's assessment complements the DPIA where
obligations are already met through it (Art. 27(4)). That is an acknowledgement of overlap *and its resolution*; it is not a
statement that the work is "duplicated". **DSA Art. 34: partial** — it is a third assessment duty whose subject matter
(including personal data protection) overlaps, but nothing in any of the three texts links it to the other two. **"Regulators
themselves acknowledge" the duplication: not carried by any text read**; the one acknowledgement found (Art. 27(4)) is the
legislator's, between two of the three, and says "complement". Also: the three duties have *different addressees* (controllers;
providers of very large platforms or search engines; certain deployers of high-risk AI), so an "organisation running all three" is
possible only for one that is all three — which the claim does not say. The edge is `ai-act` ↔ `gdpr` and carries a DSA
provision, a third instrument.

### 2.7 `rel-data-act-cloud-ai-act` — `cloud-ai-development-act` ↔ `data-act`, **conflict**

*Says:* the Data Act mandates open interoperability and the elimination of lock-in; the sovereignty requirements of the
proposed Cloud and AI Development Act push toward highly secure, localised environments; **the two pull in opposite
directions.** *Provisions:* `data-act:art-25`. *Claim:* `clm-sovereignty-vs-interoperability`, a **critique**, "the author's"
(its own note).

*Text, the Data Act half:* Art. 23 ("Providers of data processing services shall take the measures provided for in Articles 25,
26, 27, 29 and 30 to enable customers to switch …"); Art. 25: the switching contract, with a 30-day maximum transitional period,
a two-month maximum notice period, an exhaustive specification of exportable data (Art. 25(2)(a), (d), (e)). The Data Act
mandates *switching and portability* in these Articles; **"open interoperability" is, in the Data Act, Chapter VIII
(Arts 33–36: essential requirements on interoperability of data and of data processing services, Art. 35 included) and Art. 30
("Technical aspects of switching") — not Art. 25** — which this session did not read beyond Art. 23 and Art. 25. *Text, the CADA half:* **Annex II** (read; the criteria cited are quoted from their full text) makes recognition at Union assurance levels 1–4
depend on cumulative criteria that include, at every level, that "the infrastructure and assets … are located in the Union"
(level 1, point 1.1(b), "unless the public sector body explicitly requires otherwise") and that customer data "remain
exclusively within the Union" (1.1(c), 2.1(c), 3.1(c), 4.1(c)); from level 2, personnel and support within the Union (2.1(b),
(h)); levels 3–4, Union-citizen personnel (3.1(d), 4.1(d)) and no third-country control (3.1(g), 4.1(g)). So "localised
environments" is **directly supported by Annex II**.

*Text, the relationship between the two — and the finding.* **The proposal says the opposite of "conflict", in terms.**
COM(2026) 502 final, explanatory memorandum, *Consistency with existing policy provisions in the policy area*: "The proposal is
consistent with the rules on switching between data processing services introduced by the Data Act. By enabling switching and
removing key sources of vendor lock-in, the Data Act seeks to ensure that cloud computing service providers in the EU compete
on quality, innovation, and price … The Data Act opens the path towards a possible reduction of dependencies on non-EU providers
but does not build the road towards a more sovereign and trusted EU cloud computing sector. Its cloud switching and
interoperability provisions, however, make it possible for users to embrace European cloud computing services more strongly.
**The Data Act is thus an enabler for the proposal.**" The same passage recurs later in the same document, and §1.5.3 ("Lessons learned
from similar experiences in the past") says the proposal "builds on and complements the Cybersecurity Act 2.0, as well as
provisions of the Data Act, which focuses on switching costs, interoperability, portability and unfair contractual terms". Art. 18(1)(b) of the proposal cross-refers to
Data Act Art. 32(2)–(3) (third-country access to non-personal data); Art. 29(6) (where a risk assessment requires migration,
it takes place "taking into account … data portability requirements") and Art. 29(9) (Member States and Union entities "shall
consider whether a multi-vendor or multi-cloud strategy is appropriate") carry the Data Act's concerns into the proposal's
risk-assessment duty. **I found no provision in the proposal that
requires anything the Data Act forbids, and none in the Data Act that forbids what the proposal requires** — but this session
did not run that comparison exhaustively; it read the proposal's own statements and Annex II.

*Verdict:* **the premise on the CADA side (localisation) is direct; the premise on the Data Act side is partial (switching and
portability: direct; "open interoperability" is Ch. VIII, not read in full); the conclusion — that the two "pull in opposite
directions" and are in `conflict` — is the author's critique and is contradicted at the level of the Commission's stated
intent, in the proposal's own text.** Whether a *tension in effect* exists (for example between localisation criteria and a
customer's freedom to switch to a provider that is not in the Union) is a legitimate analytical question this text neither
asserts nor refutes. **The edge, as written, states a conflict as a fact about two instruments, with a "conflict" kind that
`tools/selftest.mjs` treats as an analytical edge, and the one primary text that speaks to it says the reverse.** The rule of the
prompt applies: a relationship the text does not carry is proposed for downgrade or removal, not for "adjustment".

### 2.8 `rel-tfeu-114-acquis` — `tfeu` → `gdpr`, legal-basis — **the endpoint is contradicted**

*Says:* almost the entire digital rulebook rests on the internal-market harmonisation competence (Art. 114 TFEU), which shapes
each instrument's form. *Provisions:* `tfeu:art-114`. *Claim:* `clm-art-114-shapes-everything`. **The edge points at `gdpr`.**

*Text:* TFEU Art. 114(1): the Parliament and the Council adopt "the measures for the approximation of the provisions laid down by
law, regulation or administrative action in Member States which have as their object the establishment and functioning of the
internal market". The visas of the eight acts read here: DSA, DMA, NIS 2, CER, CRA, Data Act — "in particular **Article 114**
thereof"; AI Act — "**Articles 16 and 114**"; **GDPR — "in particular Article 16 thereof" — Article 114 is not cited.**

*Verdict:* the proposition in the summary ("almost the entire digital rulebook") is **direct** as to the six instruments whose
visa cites Art. 114 alone, **partial** for the AI Act (Art. 114 together with Art. 16), and **false of the instrument the edge
points at.** `clm-art-114-shapes-everything`'s own note records the GDPR as "the principal exception" (27 Sep 2026) and
`clm-gdpr-legal-basis-art-16` is registered; the GDPR page says in prose that the GDPR "rests on Article 16 TFEU … not on
Article 114". **The edge asserts, on the GDPR's own page and in the interaction boxes, a legal basis that the GDPR's visa
excludes.** That "shapes each instrument's form" is the author's reading and stays one.

## 3. Findings outside the eight (not touched)

1. **`data/instruments.json`: `gdpr.legal_basis` is `["tfeu:art-114"]`.** The visa of Regulation (EU) 2016/679, read here, cites
   Art. 16 only (§2.8). The same field is `["tfeu:art-114"]` for the AI Act, whose visa cites Arts 16 **and** 114 (so true, but
   incomplete: no Art. 16 provision exists to name — `clm-gdpr-legal-basis-art-16`'s note says so). The GDPR value is the same
   contradiction as §2.8 in a field `data/instruments.json` stores per instrument; **V2C-12 does not change it** (the prompt
   restricts the session to `relationships`), and it is put to the author as a decision (§4, question 6). Its reader-facing
   reach was not measured here: the instrument page's prose says Art. 16 correctly.
2. **The DMA's reference to the DSA is unnumbered** ("a Regulation on a single market for digital services", recitals (12) and
   (38)); not a defect of the data. It matters for §2.1 only in that no designation-to-designation cross-reference exists.
3. **No relationship in the eight carries `requires_verification`** (measured: 0 of 8), including the two whose reading in §2.6
   and §2.7 finds a proposition no text carries.

## 4. The proposal (W.2) — what would be written, per relationship

All sources below are v2 reference objects `{source_id, supports, locator}`. `last_verified` would be `2026-11-15` for every
relationship the session writes. No new `data/claims.json` or `data/sources.json` record is proposed: every document read is
already a source record (`src-eurlex-*`, `src-eurlex-teu-art-4`, `src-eurlex-data-omnibus-837`, `src-council-cloud-ai-act-2026`),
and every claim an edge cites already exists. No provision record is added (the prompt restricts the session to
`relationships`).

| Relationship | Reading | Proposal | Sources written (`supports` · locator) | `requires_verification` |
|---|---|---|---|---|
| `rel-nis2-cer` | direct | **Migrate.** `provisions: ["nis2:art-2"]` (the only existing provision that carries it) | `src-eurlex-nis2` direct · Art. 2(3); Art. 41(1) · `src-eurlex-cer` direct · Art. 1(2); Art. 26(1) | no |
| `rel-ai-act-teu-4-2` | direct (textual half) | **Migrate.** summary unchanged | `src-eurlex-teu-art-4` direct · Art. 4(2), third sentence · `src-eurlex-ai-act` direct · Art. 2(3), second subparagraph; recital (24) · `src-brief-original` direct · Part XI (the sentence that begins "The brief argues") | no |
| `rel-data-omnibus-gdpr` | direct | **Migrate.** summary unchanged | `src-eurlex-data-omnibus-837` direct · Art. 3, point 1(a) (Art. 4(1), added sentences); point 10 (new Art. 41a); point 15 (new Arts 88a and 88c) | no |
| `rel-cra-nis2` | CRA direct; NIS 2 partial | **Migrate.** summary unchanged; the note names "operate" as the site's paraphrase | `src-eurlex-cra` direct · Art. 1, points (a)–(b); recitals (24), (125) · `src-eurlex-nis2` partial · Art. 1(1)–(2)(b); Art. 21(2), point (d) | no |
| `rel-dsa-dma-scope` | axes direct; non-implication partial | **Migrate.** summary unchanged; the note says "does not imply" is an inference from two independent criteria with no cross-reference | `src-eurlex-dsa` partial · Art. 33(1), (4); Art. 34(1) · `src-eurlex-dma` partial · Art. 1(1); Art. 3(1)–(2), (4) | no |
| `rel-ai-act-gdpr-impact-assessments` | AI Act ↔ GDPR direct; DSA partial; "regulators acknowledge duplication" **not carried** | **Migrate and flag.** summary unchanged *as the author's text*; the note says precisely which part no text carries | `src-eurlex-ai-act` direct · Art. 27(1), (4) · `src-eurlex-gdpr` direct · Art. 35(1) · `src-eurlex-dsa` partial · Art. 34(1), point (b) | **yes** |
| `rel-data-act-cloud-ai-act` | localisation direct; switching direct; **"conflict" contradicted by the proposal's own text** | **Downgrade** (options in question 4) | `src-council-cloud-ai-act-2026` context · COM(2026) 502 final, explanatory memorandum, "Consistency with existing policy provisions in the policy area"; Annexes, Annex II, points 1.1(b)–(c), 2.1(b)–(c), 3.1(b)–(d), 4.1(b)–(d) · `src-eurlex-data-act` partial · Art. 23; Art. 25(2) · `src-brief-original` direct · Part X | **yes** |
| `rel-tfeu-114-acquis` | true of six instruments, partial for the AI Act, **false of `gdpr`** | **Remove, or re-point** (options in question 5) | — | — |

**Four decisions beyond the per-relationship ones:** (a) the `edge-v1-sources` / `edge-analytical-no-claim` *flip* — the prompt
leaves it to the author; (b) `tools/selftest.mjs` W12 — `B3_STILL_V1` may only shrink, and if relationships leave it the list is
edited, with a §8 row, never relaxed; the migrated edges would also need to enter a **pinned** list (as `B3_MIGRATED` pins the
earlier eight) so they cannot drift back — that is a test *added*, not one lowered; (c) the `gdpr.legal_basis` finding (§3.1);
(d) the summary text of an edge is never changed by this session without a decision in §8 — the only wording proposed to change
anywhere in this table is in `rel-data-act-cloud-ai-act`, and only if the author chooses option B or C in question 4.

## 5. The author's decisions (W.2)

*(Recorded here and in `docs/ROADMAP-v2.md` §8, each in the author's words, committed at once.)*

**15 Nov 2026, W.2 — four decisions, each in `docs/ROADMAP-v2.md` §8 with the author's words (committed at once):**

1. *The five relationships the text supports* (§2.1–2.5): **"Migrate all five as tabulated (Recommended)"** — `rel-nis2-cer`,
   `rel-ai-act-teu-4-2`, `rel-data-omnibus-gdpr`, `rel-cra-nis2`, `rel-dsa-dma-scope`, as in the §4 table.
2. *`rel-ai-act-gdpr-impact-assessments`*: **"Migrate and flag (Recommended)"** — `requires_verification: true`, the note naming
   the part no text carries.
3. *`rel-data-act-cloud-ai-act`*: **"Downgrade: keep, flag, cite both (Recommended)"** — kind and summary stay; sources and flag as
   in the §4 table; the note states the proposal's contrary wording in full.
4. *`rel-tfeu-114-acquis`*: **"Remove the edge (Recommended)"**.

5. *`gdpr.legal_basis`* (§3.1): **"Carry it to the next session (Recommended)"** — not touched here.
6. *The flip*: **"No flip; leave to V2C-13 (Recommended)"** — W12 is edited only to shrink `B3_STILL_V1` and pin the migrated edges.
7. *W.4, the next session*: **"V2C-13, the map checks (Recommended)"** — `docs/prompts/v2-v2c-13-map-checks.md`.

## 6. What was written (W.3), and what it changed

**`data/instruments.json`** (`01de1f0`; only `relationships`; `$last_verified` of the file deliberately unchanged, because the file as
a whole was not re-read): seven relationships moved from bare source ids to v2 references, each with a structural locator and a
`verification_note` dated 15 Nov 2026; `rel-tfeu-114-acquis` removed; `last_verified` 2026-11-15 on the seven; `rel-nis2-cer` gained
`provisions: ["nis2:art-2"]`, the only provision field touched. **No summary, kind, `from`, `to`, status, date or claim changed.**
Generated by `node tools/_footer.mjs`: `datasets.html`, nine instrument pages and `sitemap.xml` (whose `lastmod` values are derived from
the newest `last_verified` and moved to 2026-11-15). **`tools/selftest.mjs`** (`9c90e1d`): W12's `B3_STILL_V1` is now `[]` (a list that
only shrinks, shrunk), and W12b pins the seven, the two flags and the removal; a test added, none lowered.
**`docs/CURRENT-ARCHITECTURE.md` §12:** 45 → 47 unverified, with the explanation: the two flagged edges are new to the count, which is
the honest direction.

| Relationship | Written | `requires_verification` |
|---|---|---|
| `rel-nis2-cer` | v2: NIS 2 Art. 2(3), 41(1); CER Art. 1(2), 26(1); both direct | false |
| `rel-ai-act-teu-4-2` | v2: TEU Art. 4(2); AI Act Art. 2(3), recital (24); brief Part XI | false |
| `rel-data-omnibus-gdpr` | v2: COM(2025) 837 Art. 3 points 1(a), 10, 15; direct | false |
| `rel-cra-nis2` | v2: CRA Art. 1 (direct), NIS 2 Art. 1, 21(2)(d) (partial) | false |
| `rel-dsa-dma-scope` | v2: DSA Art. 33, 34(1); DMA Art. 1(1), 3 (both partial: "does not imply" is an inference) | false |
| `rel-ai-act-gdpr-impact-assessments` | v2: AI Act Art. 27(1),(4); GDPR Art. 35(1); DSA Art. 34(1)(b) partial | **true** |
| `rel-data-act-cloud-ai-act` | v2: proposal's memorandum + Art. 16 (context); Data Act Art. 23, 25(2) (partial); brief Part X | **true** |
| `rel-tfeu-114-acquis` | **removed** | — |

## 7. The battery, 15 Nov 2026, against the base (`92117b4` plus this session's four docs commits)

| Check | Base | After |
|---|---|---|
| `validate` | 0 errors, 5 warnings, 45 unverified, 40 relationships | 0 errors, 5 warnings, **47** unverified, **39** relationships; the only added lines are the two flagged relationships |
| `i18n-audit`, `design-qa`, `seo-audit`, `evidence-audit --as-of 2026-11-15` | exit 0 | identical output, exit 0 |
| `freshness --as-of 2026-11-15` | 98 records, 7 distinct dates (…2026-11-04) | 97 records, 8 distinct dates (…2026-11-15), exit 0 |
| `node --test tools/selftest.mjs` | 189/189 | **190/190** (W12b added) |
| the 24 agent suites and `.control-room/` | — | **corrected 16 Nov 2026: the first run reported all passing but `agent/implement` R6 also pins §12's count (45) and was not re-run after §12 moved; CI caught it; `db20231` moves the pin and all suites were re-run, all exit 0.** `agent/health` had one failure, the test that pins §12's unverified count to 45 (see §6), repaired by recording 47 and passing 57/57; `.control-room/` 76 pass, 1 skipped. Together with `tools/selftest.mjs`: **1496 tests, 1495 pass, 1 skipped** |
| `node agent/schemas/cli.mjs check` | — | exit 0 |
| browser suite (`--require-browser`) | 361 pass, 1 undecidable | **361 pass, 0 fail, 1 undecidable** (`a11y:bound`, deliberate) |
| `node tools/commit-evidence.mjs 92117b4 HEAD` | — | 0 commits without evidence |

`agent/records/` absent after the batteries. `agent/release/runs/` exists and is git-ignored.

## 8. What stays open

- `gdpr.legal_basis` (§3.1), decision 5: carried to V2C-13's prompt as a named item.
- **The Annex II document.** The Annexes of COM(2026) 502 were read from Cellar's manifestation of the proposal; the source record the edge
  cites, `src-council-cloud-ai-act-2026` (ST 10104/26), does not reproduce them, and the edge's note says so. No source record exists for
  the Annexes and none was added (no decision covered one).
- **Partial readings, not defects:** no corrigendum to any of the eight acts was looked up; Data Act Chapter VIII (Arts 33–36) was not read
  beyond what is cited; DSA/DMA `rel-dsa-dma-scope`'s "does not imply" and `rel-cra-nis2`'s "operate" are the site's paraphrases, declared as
  such in the notes.
- **M-10:** three analytical edges have no claim (`rel-dsa-dma-scope`, `rel-nis2-cer`, `rel-cra-nis2`), the same three as the 28 Oct 2026
  measure; the check that would name them is V2C-13's, and this session wrote no claim to close them (no decision covered one).

