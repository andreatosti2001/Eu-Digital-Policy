# Track M (eidas2 milestone) — the reading notes for `ap-eidas2-01`

**Lifecycle:** closed · **Authority:** canonical · **Home of:** Track M, `eidas2`, 23 Nov 2026 · **Closed by:** «Final checkpoint of the Track M session (eidas2 milestone)» · **Catalogue:** `docs/README.md`

**Session:** Track M, the `eidas2` milestone of 24 Dec 2026 (`docs/prompts/v2-track-m-eidas2-milestone.md`; scope `docs/ROADMAP-v2.md` §8,
23 Nov 2026, "The scope of the Track M session (eidas2 milestone)": the rule only, `eidas2`'s status and milestones to Session 25; and
"Track M (eidas2), the corrigenda without an English expression": read in Italian or French). **Read on 23 Nov 2026**, in this environment,
from the Publications Office's Cellar by CELEX with `Accept: application/xhtml+xml` and `Accept-Language: eng` (Italian and French: `ita`,
`fra`), text extracted by stripping the markup. These notes are M.1 and the M.2 proposal. **They change nothing in `data/`, `i18n/` or the
brief**: what is written there is decided by the author in §8.

## 1. The premise, measured (23 Nov 2026, full clone, `main` at `e514129`)

- `ap-eidas2-01`: `last_verified` 2026-11-04; `attestation` of 4 Nov 2026 (`outcome: "unchanged"`); lapses on 3 Feb 2027; the only rule
  `node tools/freshness.mjs --as-of 2027-02-03` names. `node tools/attestation-audit.mjs packet ap-eidas2-01`: A-4 requires 32024R1183 Art. 1,
  32024R2977 Art. 6, 32024R2981 Art. 22; A-5 requires the three queried; A-8 names five things no check can resolve (§5).
- `eidas2`: `last_verified` 2026-10-27, `status_as_of` 2026-10-27; `tl-eidas2-2026-12-24-compliance-deadline` critical review-due;
  `STATUS_PREDATES_MILESTONE instruments/eidas2` fires from 25 Dec 2026. **Not this session's** (scope row): none of it is touched.
- Validators before any write (saved for comparison): `validate`, `i18n-audit`, `design-qa`, `seo-audit` exit 0; `freshness` and
  `evidence-audit` `--as-of 2026-11-23` and `--as-of 2027-02-03` exit 0; `node --test tools/selftest.mjs` 201 pass, 0 fail.

## 2. What was retrieved today

| Document | Retrieval | SHA-256 |
|---|---|---|
| Regulation (EU) 2024/1183 | Cellar `celex/32024R1183`, XHTML, HTTP 200, 583 007 B | `1e0f838b7fdb1a07ddbc359c836796cb8fe5ba44f812ae4c4884cc4319add8cf` (**identical to 13 Nov**, `docs/V2C-21-READING.md` §1) |
| Regulation (EU) No 910/2014 (the original text) | `celex/32014R0910`, 355 891 B | `b4fa35255bc0ad6b7a8275cfa329a1f17f91830299b8096e6d5e6a3169b27f33` (**identical to 13 Nov**) |
| Implementing Regulation (EU) 2024/2977 | `celex/32024R2977`, 82 808 B | `e6823fd65f11dc56c803daac4e5e5fde5c6404b0fad6924f80bd54264bcb3e94` |
| Implementing Regulation (EU) 2024/2981 | `celex/32024R2981`, 450 763 B | `e45c7c805a4c14082e8537d14805b159e86aa279c45a4715e2a2e161952be210` |
| Implementing Regulation (EU) 2024/2979 | `celex/32024R2979` | `ac7e5fff2a72a3bb4ad6fa442745e59ee59ad3e65dc578f6acdd6575040b8b5a` |
| Implementing Regulation (EU) 2024/2980 | `celex/32024R2980` | `f9d82eb35f4b5b8f7bdf209936306593b965925e8aef2dccad62bdcfc20e1345` |
| Implementing Regulation (EU) 2024/2982 | `celex/32024R2982` | `6dcd6d801df70c72976faf396166d82990cd6b3b152a10828be5eda3e7b8c213` |
| Implementing Regulation (EU) 2026/1731 (amends 2024/2977, 2979, 2980, 2982) | `celex/32026R1731`, 698 370 B | `716f17c983e24d60d54e577a696e691518bc082330920298c6f7fe64c24d0f73` |
| Implementing Regulation (EU) 2025/846 | `celex/32025R0846` | `065793e75f3d8142968130c1c65a090fb1d0cfc4788fa2d3fe07ca9b4db37807` |
| Implementing Regulation (EU) 2025/848 | `celex/32025R0848` | `ad3e50c59821596b3e829d6fdf08125d1da8255c9d0613648b79e0013a88226e` |
| Implementing Regulation (EU) 2026/1730 (amends 2025/848) | `celex/32026R1730` | `2d939d209aeb176ac76a05062e05fad7f630251c95afa8f0874f815c8421269f` |
| Corrigendum 32024R1183R(03), **French** (OJ L, 2025/90631, 4.8.2025) | `Accept-Language: fra`, XHTML, 6 863 B | `bd83c72e37cfa931e3891a4751101ce66906eb38f490698addbb479ed329e1d6` |
| Corrigendum 32024R1183R(06), **French** (OJ L, 2026/90271, 7.4.2026) | `fra`, XHTML, 20 549 B | `0013a41c9557ae53fdaf1f1cce566090e8608d276fa7535af5505f3c80c5cf52` |
| Corrigendum 32014R0910R(06), **Italian** (OJ L 272, 7.10.2016) | `ita`, XHTML, 5 216 B | `bb66e011d874bc691c2823763d4ee184f57edf307325f730321ec74c0b40feea` |
| Corrigendum 32014R0910R(11), **French** (OJ L, 2025/90630, 4.8.2025) | `fra`, XHTML, 9 236 B | `e26b127cb06c782f7fef0e538a2679c8d2fcb808b86dcc63c72e676e37a5f10c` |

Besides these, 29 more implementing acts based on Regulation (EU) No 910/2014 (2025–2026, listed in §3) were retrieved **only to read their
citation** («in particular Article … thereof») and, for 2025/847 and 2025/849, their final Article. Nothing else in them was read.

## 3. SPARQL (P-09), re-run today

The two queries of `docs/RULE-MAINTENANCE.md` §2, and one asking the language of every expression of each corrigendum, on 32024R1183,
32014R0910, 32024R2977, 32024R2981 and 32026R1731. **The same as on 4 and 13 Nov 2026; nothing new:**

- **32024R1183**: no amending or repealing act; seven corrigenda R(01) 2024-10-23, R(02) 2025-04-09, R(03) 2025-08-04, R(04) 2025-11-24,
  R(05) 2026-02-03, R(06) 2026-04-07, R(07) 2026-10-29. Languages: R(01) DAN NLD; **R(02) all 24 languages, ENG among them**; R(03) FRA;
  R(04) POL; R(05) MLT; R(06) FRA; R(07) SLK.
- **32014R0910**: amended by 32022L2555 and 32024R1183, nothing else; thirteen corrigenda R(01)–R(13), each in one language or two (CES,
  DEU, SLK, LIT, DEU, **ITA** (R(06)), SPA, SPA, RON, HRV SWE, **FRA** (R(11)), MLT, SLK), none in English.
- **32024R2977**: amended by 32026R1731 (2026-07-15); one corrigendum, R(01) 2025-05-16, **in Irish only** (GLE).
- **32024R2981** and **32026R1731**: no amending act, no corrigendum.

**Which implementing acts are adopted under Art. 5a(23) or Art. 5c(6).** Asked of SPARQL as the acts based on 32014R0910
(`cdm:resource_legal_based_on_resource_legal`; none based on 32024R1183 but two Parliament documents), then each act's citation read in its
OJ text: **under Art. 5a(23)**: 2024/2977, 2024/2979, 2024/2980, 2024/2982 (all OJ 4.12.2024, each «shall enter into force on the twentieth
day following that of its publication», so 24 Dec 2024; SPARQL entry into force 2024-12-24 for each) and **2026/1731** (OJ 22.7.2026, the
same clause, so 11 Aug 2026; SPARQL 2026-08-11). **Under Art. 5c(6)**: 2024/2981 only (OJ 4.12.2024; 24 Dec 2024). Every other act of the
list cites another Article: 2025/846 (11a(3)), 2025/847 (5e(5)), 2025/848 (5b(11)), 2025/849 (5d(7)), 2025/1566–1572, 2025/1929,
2025/1942–1946, 2025/2160, 2025/2162, 2025/2164, 2025/2527, 2025/2530–2532, 2026/248, 2026/798 (5a(24)), 2026/1730 (5b(11)),
2026/1735.

## 4. Reading, against the rule

| Field | The rule says | The text says | Holds? |
|---|---|---|---|
| `rationale`, first sentence; `obligations` `eidas2:art-5a`; `sources[1]` | «each Member State must provide at least one European Digital Identity Wallet within 24 months of the entry into force of the implementing acts under Arts 5a(23) and 5c(6)» | Art. 5a(1) (2024/1183 Art. 1 point (5)): «each Member State shall provide at least one European Digital Identity Wallet within 24 months of the date of entry into force of the implementing acts referred to in paragraph 23 of this Article and in Article 5c(6)» | **Holds** |
| `rationale`, «which entered into force on 24 December 2024»; `sources[2]`, `[3]`; `dates` | the acts entered into force on 24 Dec 2024 | 2024/2977 («in particular Article 5a(23)»; Art. 6) and 2024/2981 («in particular Article 5c(6)»; Art. 22), both OJ 4.12.2024, in force on the twentieth day following: 24 Dec 2024. So also 2024/2979, 2980, 2982 under 5a(23). **But 2026/1731 is also adopted «in particular» under Art. 5a(23), and entered into force on 11 Aug 2026** (§3; N1 below) | **Holds for the five acts of 28 Nov 2024; see N1** |
| `sources[0]`, scope; `condition_provisions` `eidas2:art-2`, `art-3`; `conditions` `activity:digital-identity` | scope: Art. 2(1) as replaced; Art. 3 point (42) as added | Art. 2(1) (2024/1183 Art. 1 point (2)(a)): «applies to electronic identification schemes notified by a Member State, to European Digital Identity Wallets provided by a Member State and to trust service providers established in the Union»; Art. 3 point (42) (point (3)(j)): the wallet is «an electronic identification means which allows the user to securely store, manage and validate person identification data and electronic attestations of attributes …». Art. 2(2) of No 910/2014 (closed systems) unamended; Art. 2(3) replaced and 2(4) added (point (2)(b)) | **Holds** |
| `authority` `member-states`; `outcome:possible` | the duty is on Member States; an organisation's position depends on its role | Art. 5a(1) binds «each Member State»; 5a(2): a wallet is provided directly by a Member State, under its mandate, or independently but recognised | **Holds** |
| `depends_on` | relying parties' and trust service providers' obligations «not mapped here» | Arts 5b, 5f bind relying parties; Arts 13, 19a, 20, 24, 45g–45h trust service providers (`docs/V2C-21-READING.md` §3, A3, A4, A7) | **Holds** (true: they are not mapped) |
| «The rule covers the wallet obligation only» | — | — | a statement of the rule's scope, not of the law |

**N1 — what the texts do not settle (named, not decided).** Art. 5a(1) counts 24 months from «the date of entry into force of the
implementing acts referred to in paragraph 23 … and in Article 5c(6)». **Implementing Regulation (EU) 2026/1731**, adopted «in particular»
under Art. 5a(23), amends 2024/2977, 2979, 2980 and 2982 and entered into force on 11 Aug 2026; no text read says whether an act amending the
first implementing acts moves the date from which Art. 5a(1) counts. **What the texts read do say**: Implementing Regulation (EU) 2025/846,
recital (11) («each Member State should provide at least one wallet within 24 months as of the date of entry into force of the implementing acts
referred to in Articles 5a(23) and 5c(6) … the application of the relevant provisions … should coincide with the above timeframe») and its last
Article («It shall apply from 24 December 2026»); 2025/848, last Article («It shall apply from the 24 December 2026»). Those are the Commission's
implementing acts, not the Regulation. Also: Art. 5b(11) and 5d(7) call their implementing acts «implementing acts on the implementation of
European Digital Identity Wallets as referred to in Article 5a(23)»; 2025/848 (5b(11)) and 2025/849 (5d(7)) entered into force on
27 May 2025 (SPARQL); their citations name 5b(11) and 5d(7), not 5a(23). **The rule's sentence is true of the five acts of 28 Nov 2024. Whether
the deadline is still 24 Dec 2026 is the milestone's question — `tl-eidas2-2026-12-24-compliance-deadline` and `eidas2`'s status — which the
scope row gives to Session 25 (25.2).**

**The corrigenda, read in Italian or French** (the 22 and 23 Nov 2026 rows). **Each corrects the language version it is published in, and
none touches Art. 2, Art. 3 point (42) or Art. 5a:**

| Corrigendum | Language read | What it corrects |
|---|---|---|
| 32024R1183R(02) | English (read 4 and 13 Nov; unchanged) | Art. 5a(16)(b) «unlinkability»; references in Art. 47 |
| 32024R1183R(03) | French | Art. 5 sexies (5e)(1)–(3): «altération» → «compromission» |
| 32024R1183R(06) | French | recital 66, Art. 3 point 16(e), Art. 24 bis (24a)(5), Art. 34: «préservation» → «conservation» |
| 32014R0910R(06) | Italian | Art. 3 point 37 (word order) and Art. 41(1), (3) («validazione temporale elettronica qualificata») |
| 32014R0910R(11) | French | Art. 10(1)–(3) «altération» → «compromission»; Art. 39(3) «certifiés» |

**Not readable and so not read** (requested by CELEX in Italian and in French, as XHTML, HTML and PDF: **HTTP 404 in every case**; the key
answers in the language SPARQL lists, e.g. R(04) in Polish, HTTP 200): 32024R1183 R(01) (Danish, Dutch), R(04) (Polish), R(05) (Maltese),
R(07) (Slovak); 32024R2977 R(01) (Irish); 32014R0910 R(01)–R(05), R(07)–R(10), R(12), R(13) (not requested: none has an Italian or French
expression in SPARQL). A corrigendum published in one language corrects that language's text; **that it changes nothing in the English text the
rule quotes is likely and not measured**.

## 5. The five A-8 warnings — named, not closed

A re-attestation cannot close them; it names them (`docs/ATTESTATION-FORM.md` §5, point 1). Each was read all the same:

1. 2024/2977 «Citation ('in particular Article 5a(23) thereof')»: read; the citation says so.
2. 2024/2981 «Citation ('in particular Article 5c(6) thereof')»: read; the citation says so.
3. `eidas2:art-5a` (Art. 5a of No 910/2014, as inserted): read in full in 2024/1183 Art. 1 point (5), paragraphs 1 to 24.
4. `eidas2:art-2` (Art. 2 of No 910/2014, as amended): paragraphs 1 and 3–4 in 2024/1183 Art. 1 point (2); paragraph 2 in 32014R0910.
5. `eidas2:art-3` (Art. 3, as amended): points (1)–(41) in 32014R0910; points (1)–(6), (16), (18), (21), (23a), (23b), (38), (41) and
   (42)–(57) as replaced or added by 2024/1183 Art. 1 point (3).

## 6. What was read, and what was not

- **32024R1183**: Art. 1 points (1) to (5) in full — point (5) is Arts 5a to 5f, each read in full; **points (6) to (53) not read**, only
  their amending instructions scanned: each names an Article from Art. 6 onwards, an Annex or a new chapter, none Art. 2, 3 or 5a. Art. 2
  (entry into force). Recitals not read.
- **32014R0910**: Art. 2 and Art. 3 (original). Nothing else.
- **32024R2977**: citation and Art. 6. **32024R2981**: citation and Art. 22. **32024R2979, 2980, 2982**: citation and final Article.
  **32026R1731**: title, citation, recitals (1)–(9), Art. 1 and the amending instructions of Arts 2 to 4, Art. 5; its Annexes not read.
  **32025R0846**: recital (11) and the last Article. **32025R0848**, **32026R1730**: citation and last Article.
- **Not read**: `clm-eidas2-wallets`; a consolidated version (none used); any Commission page on the wallets; the Member States' wallet
  notifications (whether any Member State has provided a wallet is the milestone's question, Session 25).

## 7. The proposal (M.2) — what is put to the author

1. **`ap-eidas2-01`**: the text holds it (§4). Recommended: **re-attest unchanged**, `last_verified` 2026-11-23, `attestation` with
   `outcome: "unchanged"`, the `verification_note` rewritten to say what was read, naming N1, the corrigenda read and unread, and the five
   A-8 warnings. Alternatives: reword the rationale's «which entered into force on 24 December 2024» to name the five acts of 28 Nov 2024; or
   leave the rule un-attested until Session 25 answers N1 (it lapses on 3 Feb 2027).
2. **N1** goes to Session 25 (25.2) by name, with the milestone, whatever the answer to 1.
3. **Pins**: `tools/selftest.mjs` fixes `ap-eidas2-01` at 2026-11-04 in `READ_V2_23`; moving it needs the author's word, and nothing else in
   `tools/` moves.
