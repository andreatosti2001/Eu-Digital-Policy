# Rules maintenance, group (a) — the reading notes

**Session:** Track R, rules maintenance, group (a) (`docs/prompts/v2-rules-maintenance-group-a.md`; scope and premise `docs/ROADMAP-v2.md` §8,
17 Nov 2026, "The scope of the rules-maintenance session (group (a))" and "Rules maintenance, group (a): the premise"). **Read on 17 Nov 2026**,
in this environment, from the Publications Office's Cellar by CELEX with `Accept: application/xhtml+xml` and `Accept-Language: eng`, text
extracted by stripping the markup, and from the Commission's own pages. These notes are W.1 and the W.2 proposal. **They change nothing in
`data/`, `i18n/` or the brief**: what is written there is decided by the author in §8.

## 1. The premise, measured

The prompt starts from `docs/PHASE-3-AUDIT.md` §4, the tree of **3 Nov 2026**. On **4 Nov 2026** v2 Session 21 read each of the nine findings
from Cellar, put one question each to the author and wrote the answers (§8, rows "21.2 F-02" … "21.2 F-20", then checkpoint 21.2: «Group (a)
is closed»). Measured today against `data/applicability.json`:

| Finding | Rule | State on 17 Nov 2026 | Residue |
|---|---|---|---|
| F-02 | `ap-nis2-01` `depends_on` | closed 4 Nov: reports the press release, no «materially incomplete» | **the same words remain elsewhere** (§3.1) |
| F-03 | `ap-cra-01` rationale | closed 4 Nov: «severe incidents having an impact on the security of the product»; «has applied since 11 September 2026» | none |
| F-04 | `ap-nis2-02` rationale | closed 4 Nov: Annex I, «the sectors of high criticality»; category by Art. 3 | none |
| F-13 | `ap-ai-act-02` rationale | closed 4 Nov: Art. 113 point (b) and Art. 111(3) in the rationale and as a source | **`data/timeline.json` holds no event for 2 Aug 2027** (§3.2) |
| F-14 | `ap-ai-act-06` exemption; `teu:art-4-2`; `rel-ai-act-teu-4-2` | closed 4 Nov: the sentence is deleted from the exemption; two summaries now begin «The brief argues this is the structural source …» (two occurrences in `data/instruments.json`) | none |
| F-17 | `ap-gdpr-04` note | closed 4 Nov: «belong to Session 16» is in no data file (only in dated docs) | none |
| F-19 | `ap-dsa-03` rationale | closed 4 Nov: Art. 27 «unless it is a micro or small enterprise, which Article 19 exempts» | none |
| F-20 | `ap-dma-04` rationale | closed 4 Nov: «a target, not a legal deadline»; the DMA's status re-read and unchanged | **the rationale's last sentence is the brief's argument, kept on 4 Nov and reported** (§3.3) |
| F-23 | actors' definitions; `ap-gdpr-04` controller role | (3) closed 4 Nov (`depends_on` names the controller); (2) closed without change, the author's decision of 29 Oct kept | none |

**No rule lapses before 3 Feb 2027** (`node tools/freshness.mjs --as-of 2027-02-02`: 0 `RULE_STALE`; 2027-02-03: 32; 2027-02-16: 33, `ap-dma-01`
included). So there is no rule whose attestation is due in this session, and none is proposed.

## 2. What was retrieved today

| Document | Retrieval | Bytes | SHA-256 |
|---|---|---|---|
| Regulation (EU) 2024/1689 (AI Act) | Cellar `celex/32024R1689`, XHTML, HTTP 200 | 1 262 391 | `8f0b656302f9864cc87e040c371f209a9d65ae1a6cecc25ca5eb737e872d721a` |
| Regulation (EU) 2026/1744 | Cellar `celex/32026R1744`, XHTML, HTTP 200 | 351 287 | `9d754652b867722807e4219c85912ce354233e58a1b4eb8c7752b4d1922993db` |
| Regulation (EU) 2022/1925 (DMA) | Cellar `celex/32022R1925`, XHTML, HTTP 200 | 518 017 | `d6af21a4f11c2b001b0486391fbd0813deba32305fb0d3865fbceccd45b827eb` (**identical to F-18's**) |
| Directive (EU) 2022/2555 (NIS2) | Cellar `celex/32022L2555`, XHTML, HTTP 200 | 702 913 | `6ee66d5c419d9a056fb98d94083cacf9b818803bd6b416435718e0d4919cb589` |
| Commission news item, referral of IE, ES, FR, NL (digital-strategy page, «Last update 9 July 2026») | its URL, HTML, HTTP 200 | 50 848 | `5688bfdd4e9305b9b94dbbe160079db91178d3875b21b61e5b94713e043b5775` |
| Commission news item, letters of formal notice to 23 Member States (28 Nov 2024) | its URL, HTML, HTTP 200 | 49 806 | `ec7e10eb13f3502916eb494a4928a98cb3e2b0a77ac98f8d4c75cc5ba8819327` |
| INF/26/1376, «July infringements package: key decisions» | press corner documents API, JSON, HTTP 200 | 96 067 | `26f008e4a993d8cadd9947e7f3a9335d5af573dffeacd64883cf72bc213d055d` |

**Not done today, and declared:** the SPARQL query for amending acts and corrigenda was **not re-run** — the texts read are the Official Journal
originals, and the 4 Nov 2026 readings (§8 rows 21.2) hold the SPARQL results of that day (AI Act: one amending act, 2026/1744, four corrigenda,
none in English; DMA: no amending act, three corrigenda; NIS2: no amending act, nine corrigenda, R(04) the only English one). A residue below
that changed any of those would need the query first; none of the three proposals does. No consolidated text was read.

## 3. The three residues

### 3.1 F-02's words outside the rule: «materially incomplete»

**What the site says.** `data/instruments.json`, `nis2` `status_note` (status and `last_verified` 2026-10-21): «The transposition deadline of 17 October
2024 has passed and transposition is still **materially incomplete**: the Commission sent letters of formal notice to 23 Member States in November
2024 and referred Ireland, Spain, France and the Netherlands to the Court of Justice in July 2026. …». `instruments.html` line 112 (no `data-i18n`
key, so no overlay to supersede): «For a Directive it is national, and **the brief records that NIS2 transposition is materially incomplete**.»

**What the sources read today say.**
- Digital-strategy page of the referral: «Member States had until 17 October 2024 to transpose the Directive. **While most complied**, Spain, France,
  Ireland and the Netherlands have yet to notify full transposition. The Commission sent letters of formal notice on 28 November 2024 and reasoned
  opinions on 7 May 2025.»
- INF/26/1376: the Commission «decided to refer Ireland (INFR(2024)0279), Spain (INFR(2024)0270), France (INFR(2024)0274) and the Netherlands
  (INFR(2024)0288) … for failing to notify measures transposing the NIS2 Directive».
- 28 Nov 2024 release: letters of formal notice to **23 Member States** (named), «for failing to fully transpose».

**Against the text.** The facts in the note (23 letters in Nov 2024; four referrals in Jul 2026) are borne out. The adjective «materially incomplete» is
in **no source read**; it is the words the 4 Nov decision removed from the rule. And «the brief records» is not borne out on the page: the phrase
is in no passage of `index.html` (searched; not a test of what the brief says in other words).

### 3.2 F-13's timeline: no event holds 2 Aug 2027

**Text.** AI Act Art. 111(3): «Providers of general-purpose AI models that have been placed on the market before 2 August 2025 shall take the
necessary steps in order to comply with the obligations laid down in this Regulation by 2 August 2027.» Art. 113, third paragraph, point (b):
Chapter V «shall apply from 2 August 2025». **Regulation (EU) 2026/1744** was searched for «111(3)»: **no occurrence**; its Art. 111 text read
today concerns 111(2) (grace period for high-risk systems already placed on the market). So 111(3) reads as in the original.

**What the site holds.** `ap-ai-act-02` states the date and cites Art. 111(3) as a `date` source (4 Nov). `data/timeline.json` has **no event** dated
2027-08-02, so a date the rule states is not derived from an event (the rule's `dates` list `tl-ai-act-2025-08-02-application` and
`tl-ai-act-2025-07-10-guidance`). Adding an event is a data change with consequences (instrument pages, calendar, `STATUS_*` and trigger
audits, regeneration, suites); the 4 Nov session recorded it as a finding and left it.

### 3.3 F-20's last sentence: «The scope gap the brief identifies is generative AI, not cloud»

**Text read today.** DMA Art. 2(2), the closed list of core platform services: (a) online intermediation services, (b) online search engines,
(c) online social networking services, (d) video-sharing platform services, (e) number-independent interpersonal communications services,
(f) operating systems, (g) web browsers, (h) virtual assistants, (i) cloud computing services, (j) online advertising services. **The words
«generative», «artificial intelligence» and «large language» occur nowhere in the Regulation's text.**

**What that does and does not show.** The text bears out half of the sentence, that cloud is already listed (point (i)); it is silent on generative AI,
which is neither confirmation nor refutation of a critique. The sentence is **the brief's argument**, and `clm-dma-scope-gap` (type
`claim-type:critique`) says the same with `src-brief-original` as its direct source, «that the scope gap is the 'main' criticism remains the brief's
own critique» (its note). In the rule the sentence is not attributed to anyone, in a field read as what the law says.

## 4. The proposal (W.2) — one question per residue, recommendation first

| # | Residue | What the text says | What the site says | What the text allows the site to say | Recommendation |
|---|---|---|---|---|---|
| 1 | `nis2` `status_note` and `instruments.html:112` | «While most complied, Spain, France, Ireland and the Netherlands have yet to notify full transposition»; 23 letters, 4 referrals | «materially incomplete» (twice); «the brief records» | that the Commission, on 8 Jul 2026, said most Member States complied and four had yet to notify full transposition | reword both to the sources' words; no date or status moved |
| 2 | `data/timeline.json`, 2 Aug 2027 | Art. 111(3) | the date is in the rule and in no event | an event for 2027-08-02 sourced to Art. 111(3), if the author wants one | **leave as recorded** (a new event moves instrument pages, the calendar and the suites; it is not a wording fix) |
| 3 | `ap-dma-04` last sentence | Art. 2(2): cloud listed; generative AI not mentioned | an unattributed argument in a rule's rationale | «The brief identifies the scope gap as generative AI, not cloud.», or delete it | **attribute it to the brief** (the precedent of F-14, `teu:art-4-2`); a rationale then states law, then labels the argument |

Anything written follows the author's answers, with a §8 row each, `node tools/_footer.mjs` if a published page changes, then the 25 suites. For
residue 3 the rule's `last_verified` would move (the rule is one of the nine, re-read on 4 Nov; today the DMA was read in full from Cellar) only
if the author decides so; the proposal is to **keep `last_verified` at 2026-11-04**, because Arts 3 and 54 and the corrigenda were not re-read
today in the way the form attests. For residue 1, `nis2`'s `last_verified` stays 2026-10-21: the record was not re-read in full.

## 5. Open points of the prompt, named and not treated

The author chose «Residues only». Nothing below was read or changed: (1) `gdpr.legal_basis` `["tfeu:art-114"]` against a visa that cites Art. 16;
(2) COM(2026) 502 Annex II without a source record; (3) partial readings (V2C-12; V2C-17…19); (4) COM(2025) 837 Art. 3 point 8 amends GDPR Art. 33
and `rel-data-omnibus-gdpr` / `clm-omnibus-four-gdpr-reforms` do not name it; (5) the memorandum against Art. 10(2) on P2B; (6) the seven acts of
Art. 2(3) of the political-advertising Regulation without an edge, the note of `src-eurlex-dna-proposal`, DNA Art. 199(1); (7) from F-18: the it/fr/es
overlays of `part-4.p2` and `part-4.p4` (it) withdrawn and awaiting a reviewed translation, «self-executing» (Art. 5 against Art. 8) not verified,
`tl-dma-2024-03-07-compliance` resting on two Commission sources not re-read, the two non-tier-1 sources of `ap-dma-01` not re-read, the text of the
DMA corrigenda `R(01)`, `R(02)`, `R(03)` not retrieved.
