# V2C-21b — the provisions of `eidas2` that say whom Regulation (EU) No 910/2014, as amended, binds: the reading notes

**Session:** V2C-21b, Track R (`docs/prompts/v2-v2c-21b-eidas2-provisions.md`; scope `docs/ROADMAP-v2.md` §8, "The scope of the
V2C-21b session"). **Read on 14 Nov 2026**, in this environment, from the Publications Office's Cellar by CELEX with
`Accept: application/xhtml+xml` and `Accept-Language: eng`, **again and not from the notes of V2C-21**
(`docs/V2C-21-READING.md`). These notes are W.1. **They change nothing in `data/`**: what is written there is decided by the
author in §8 (W.2) and recorded at the end of this file.

## 1. What was retrieved

| Document | CELEX | Retrieved | Bytes (XHTML) | SHA-256 of the XHTML |
|---|---|---|---|---|
| Regulation (EU) 2024/1183, OJ L, 2024/1183, 30.4.2024 | 32024R1183 | Cellar, 14 Nov 2026 | 583 007 | `1e0f838b7fdb1a07ddbc359c836796cb8fe5ba44f812ae4c4884cc4319add8cf` |
| Regulation (EU) No 910/2014, OJ L 257, 28.8.2014 | 32014R0910 | Cellar, 14 Nov 2026 | 355 891 | `b4fa35255bc0ad6b7a8275cfa329a1f17f91830299b8096e6d5e6a3169b27f33` |
| Corrigendum to 2024/1183, OJ L, 2025/90317, 9.4.2025 | 32024R1183R(02) | Cellar, 14 Nov 2026 | 11 426 | — |

**Both texts are byte-identical to those V2C-21 read on 13 Nov 2026** (same size and SHA-256 prefix and suffix as its §1).

**The amending acts and corrigenda** (SPARQL, `https://publications.europa.eu/webapi/rdf/sparql`, 14 Nov 2026,
`cdm:resource_legal_amends_resource_legal` and `cdm:resource_legal_corrects_resource_legal` on the two works):

- **Amending No 910/2014:** Directive (EU) 2022/2555 and Regulation (EU) 2024/1183. Nothing else — **the same set as on 13 Nov**.
- **Corrigenda:** `32014R0910R(01)…(13)` and `32024R1183R(01)…(07)` — **the same twenty as on 13 Nov; none is dated after 13 Nov
  2026** (the newest are R(07) to 2024/1183, 29 Oct 2026, and R(13) to No 910/2014, 15 Oct 2026). **Of the eleven that matter
  (R(10)–R(13) to No 910/2014, R(01)–R(07) to 2024/1183) only R(02) has an English text in Cellar** (the other ten return 404 for
  `Accept-Language: eng`). R(02) was read on 13 Nov and corrects "unlikeability" and a cross-reference in Art. 47; it changes
  no addressee. **The other ten were not read, and that is a limit, not a finding of nothing**: they are in other languages, and
  R(07) (29 Oct 2026) and R(13) (15 Oct 2026), the two most recent, fall within the window in which `eidas2`'s provisions were
  added (14–29 Oct 2026). A reader of the English text cannot say whether one of them changes whom an Article binds.
- Directive (EU) 2022/2555, Art. 42 deletes Art. 19 of No 910/2014 with effect from 18 Oct 2024 (read on 13 Nov; not re-read).

**Not read:** a consolidated version (none used; the amended text is assembled from the two OJ texts); the Annexes; the
implementing acts; the recitals. In the locators, "2024/1183 Art. 1(n)" is Art. 1, point (n), of Regulation (EU) 2024/1183,
which inserts or replaces the Article of No 910/2014 named after it.

## 2. The Articles, read for their addressee

Only the subject of a "shall" or "shall not" is listed. The grammatical subject is the addressee.

| Article (of No 910/2014) | Inserted / replaced by | Addressee of the duty, as the text says it | What it requires, by paragraph |
|---|---|---|---|
| **5a** (wallets) | 2024/1183 Art. 1(5) | **Member States** (1: "each Member State shall provide"); **providers of European Digital Identity Wallets** (10, 14, 20) | 5a(1): Member States provide at least one wallet within 24 months of the implementing acts. **5a(10): "Providers of European Digital Identity Wallets shall ensure that users can easily request technical support and report technical problems or any other incidents".** **5a(14): "The provider … shall neither collect information about the use … which is not necessary …, nor combine person identification data … with personal data from any other services offered by that provider or from third-party services … unless the user has expressly requested".** **5a(20): "Article 24(2), points (b), and (d) to (h), shall apply mutatis mutandis to providers of European Digital Identity Wallets."** 5a(2): a wallet is provided directly by a Member State, under a mandate, or independently but recognised by it. |
| **5b** | 2024/1183 Art. 1(5) | **Relying parties** (1, 3, 6, 8, 9, 10); **Member States** (5, 7) | 5b(1): "Where a relying party intends to rely upon European Digital Identity Wallets … the relying party shall register in the Member State where it is established." 5b(3): relying parties "shall not request users to provide any data other than that indicated" at registration. 5b(6): inform Member States without delay of changes. 5b(8): identify themselves to the user. 5b(9): responsible for authenticating and validating the data requested; "shall not refuse the use of pseudonyms, where the identification of the user is not required by Union or national law". 5b(10): "Intermediaries acting on behalf of relying parties shall be deemed to be relying parties". 5b(5): Member States make the registration information publicly available online; 5b(7) provide a common mechanism. |
| **5f** | 2024/1183 Art. 1(5) | **5f(1): Member States.** **5f(2): "private relying parties that provide services, with the exception of microenterprises and small enterprises"** that are required by Union or national law, or by contractual obligation, to use strong user authentication for online identification. **5f(3): providers of very large online platforms** (Art. 33, Reg. (EU) 2022/2065) | 5f(1): "Where Member States require electronic identification and authentication to access an online service provided by a public sector body, **they** shall also accept" wallets. 5f(2): those private relying parties "shall, no later than 36 months from the date of entry into force of the implementing acts … and only upon the voluntary request of the user, also accept" wallets; the text lists, "including in the areas of" transport, energy, banking, financial services, social security, health, drinking water, postal services, digital infrastructure, education or telecommunications. 5f(3): VLOPs that "require user authentication for access to online services … shall also accept and facilitate the use" of wallets, "only upon the voluntary request of the user and in respect of the minimum data necessary". 5f(4): the Commission facilitates codes of conduct; 5f(5): the Commission assesses within 24 months. |
| **12b** | 2024/1183 Art. 1(13) | **Gatekeepers** | "Where providers of European Digital Identity Wallets and issuers of notified electronic identification means that act in a commercial or professional capacity and use core platform services as defined in Article 2, point (2), of Regulation (EU) 2022/1925 … are business users …, **gatekeepers shall in particular allow them effective interoperability with, and, for the purposes of interoperability, access to, the same operating system, hardware or software features**", "free of charge" and "regardless of whether the hardware or software features are part of the operating system, are available to, or are used by, that gatekeeper". Without prejudice to Art. 5a(14). |
| **19a** | 2024/1183 Art. 1(18) | **Non-qualified trust service providers** | 19a(1): "A non-qualified trust service provider providing non-qualified trust services shall" (a) have appropriate policies and take corresponding measures to manage risks, "notwithstanding Article 21 of Directive (EU) 2022/2555", including measures on registration and onboarding, procedural or administrative checks, and the management and implementation of trust services; (b) notify the supervisory body, the identifiable affected individuals, the public if it is of public interest and, where applicable, other competent authorities, of security breaches or disruptions with significant impact, "no later than 24 hours of having become aware". 19a(2): the Commission lists standards by 21 May 2025. |
| **24** | 2024/1183 Art. 1(21) | **Qualified trust service providers** | 24(1)–(1b): verify identity and attributes before issuing a qualified certificate or qualified attestation of attributes, by the methods listed, directly or via a third party; 24(2): inform the supervisory body one month before any change (three months before ceasing) (a); (b), (d)–(h) as amended; new (fa) risk policies and (fb) breach notification. **Read, not proposed in the recommended set** (§3, question 1). |
| **45** | 2024/1183 Art. 1(44) | **Providers of web-browsers** (45(1a)) | 45(1a): qualified certificates for website authentication "shall be recognised by providers of web-browsers"; providers "shall ensure that the identity data attested in the certificate and additional attested attributes are displayed in a user-friendly manner" and "shall ensure support and interoperability" with them, "with the exception of microenterprises or small enterprises … during the first five years of operating as providers of web-browsing services". 45(1)–(1b), (2) concern the certificates and the Commission. |
| **45a** | 2024/1183 Art. 1(45) | **Providers of web-browsers** | 45a(1): "shall not take any measures contrary to their obligations set out in Article 45". 45a(2): precautionary measures only on substantiated concerns; 45a(3): notify the Commission, the supervisory body, the certificate holder and the issuing qualified provider, in writing, without undue delay; 45a(4): the supervisory body investigates. **Read, not proposed in the recommended set.** |
| **45f** | 2024/1183 Art. 1(46) | **Public sector bodies referred to in Art. 3, point (46)** (45f(8)); **Member States** (2, 3) | 45f(8): "Public sector bodies referred to in Article 3, point (46), issuing electronic attestation of attributes **shall provide an interface with European Digital Identity Wallets**". 45f(2): the Member State "shall ensure that the public sector bodies that issue electronic attestations of attributes meet a level of reliability and trustworthiness equivalent to qualified trust service providers in accordance with Article 24". 45f(3): Member States notify those bodies to the Commission with a conformity assessment report. 45f(1): the attestation must meet Annex VII and the qualified-certificate conditions. **Art. 3, point (46)** (2024/1183 Art. 1(3)) defines "electronic attestation of attributes issued by or on behalf of a public sector body responsible for an authentic source"; **"public sector body"** (Art. 3, point (7), as replaced, 2024/1183 line 204 of the retrieved text) "means a state, regional or local authority, a body governed by public law or an association formed by one or several such authorities or … bodies governed by public law, **or a private entity mandated by at least one of those authorities … to provide public services, when acting under such a mandate**". |
| **45g** | 2024/1183 Art. 1(46) | **Providers of electronic attestations of attributes** (1); **providers of qualified electronic attestations of attributes** (2) | 45g(1): provide wallet users with "the possibility to request, obtain, store and manage the electronic attestation of attributes irrespective of the Member State where the … Wallet is provided"; 45g(2): qualified providers "shall provide an interface with European Digital Identity Wallets". **Read, not proposed in the recommended set.** |
| **46a** | 2024/1183 Art. 1(47) | **Member States** (1, 2) | 46a(1): "Member States shall designate one or more supervisory bodies established in their territory" with the powers and resources; 46a(2): notify the Commission. 46a(3)–(6): the role and tasks of those supervisory bodies (supervise wallet providers established in the designating State, ex ante and ex post; require remedies; suspend or cancel the registration of relying parties in the 5b(7) mechanism; order a provider to suspend or cease; annual report by 31 March). **A supervisory body is not called a public authority in the text.** |
| **46b** | 2024/1183 Art. 1(47) | **Member States** (1, 2) | 46b(1)–(2): designate and notify a supervisory body for trust services. 46b(3): supervise qualified trust service providers; act ex post on non-qualified ones; 46b(4)(k): "to investigate claims made by providers of web-browsers pursuant to Article 45a". **Read, not proposed in the recommended set.** |

**What changes against the notes of V2C-21:**

1. **Nothing in the addressees.** Each addressee V2C-21 listed (A1–A10) is the addressee of the "shall" read today.
2. **A9's second basis is not in this text.** V2C-21 §3 A10 grounded `actor:public-authority` in 46a and 46b "by function". 46a and 46b
   bind **Member States** ("shall designate") and describe what the designated bodies' role "shall be"; no paragraph calls a
   supervisory body a public authority. **The Article that binds a public body the text itself names as a body, with a duty of
   its own, is 45f(8)** (and 45f's "public sector body" includes a mandated private entity, so it is not exactly
   `actor:public-authority` either; V2C-21 §3 A9 said so). 46a and 46b anchor `actor:member-state`, not `actor:public-authority`.
3. **45g(1) is wider than V2C-21's A7 said.** It binds "providers of electronic attestations of attributes", qualified or not; only
   45g(2) is limited to the qualified ones.
4. **5a(14) binds the wallet provider, 5a(10) too, and 5a(20) extends 24(2)(b), (d)–(h) to it.** `eidas2:art-5a` exists and its
   `obligation_on` is `actor:member-state` only.

## 3. The proposal (W.2), for the author

`eidas2.dna.regulated_actor` (decided in V2C-21, not touched): `actor:member-state`, `actor:wallet-provider`,
`actor:relying-party`, `actor:vlop`, `actor:gatekeeper`, `actor:trust-service-provider`, `actor:web-browser-provider`,
`actor:public-authority`. Of these the page now anchors, by a provision's `obligation_on`: `actor:member-state` (`art-5a`),
`actor:vlop` (`art-5f`), `actor:public-authority` and `actor:large-company` (`art-5f`, wrongly: §2, 5f). **Six have nothing:**
wallet provider, relying party, gatekeeper, trust service provider, web-browser provider; and public authority only on the wrong basis.

| # | Provision (id never renamed) | `obligation_on` | Entry in `dna.obligation_anchor` | Anchors |
|---|---|---|---|---|
| P1 | `eidas2:art-5b` **new** | `actor:relying-party` | yes | relying party |
| P2 | `eidas2:art-12b` **new** | `actor:gatekeeper` | yes | gatekeeper |
| P3 | `eidas2:art-19a` **new** | `actor:trust-service-provider` | yes | trust service provider (non-qualified; the summary says so) |
| P4 | `eidas2:art-45` **new** (45(1a)) | `actor:web-browser-provider` | yes | web-browser provider |
| P5 | `eidas2:art-45f` **new** | `actor:public-authority`, `actor:member-state` | yes | public authority (45f(8)), on the right basis |
| P6 | `eidas2:art-5a` **existing, extended** | adds `actor:wallet-provider` to `actor:member-state` | already | wallet provider (5a(10), (14), (20)); the summary today says only the Member State's duty |
| P7 | `eidas2:art-5f` **correction** | `actor:member-state` (5f(1)), `actor:relying-party` (5f(2)), `actor:vlop` (5f(3)); removes `actor:public-authority` and `actor:large-company` | already | the summary now follows the paragraphs' addressees: 5f(1) the Member State; 5f(2) private relying parties, medium enterprises included |

Optional, not in the recommendation: `art-24` (qualified TSPs), `art-45a` (web-browser precautionary measures), `art-45g`
(attestation providers), `art-46a` and `art-46b` (`actor:member-state`; supervisory bodies). They anchor actors already anchored.

Each new provision's `sources` is `src-eurlex-eidas2`; `src-eurlex-eidas` is added only where the text read is in the original
Regulation (none of the five is). Each carries a `verification_note` saying what was read and when. No `claims` entry is
written: a claim is a separate record (the prompt names none).

## 4. The decisions

*(filled in §8 of `docs/ROADMAP-v2.md` with the author's words; this file records what was written after them.)*
