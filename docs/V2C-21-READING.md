# V2C-21 — who Regulation (EU) No 910/2014, as amended, binds: the reading notes

**Session:** V2C-21, Track R (`docs/prompts/v2-v2c-21-eidas2-actors.md`; scope `docs/ROADMAP-v2.md` §8, "The scope of the
V2C-21 session"). **Read on 13 Nov 2026**, in this environment, from the Publications Office's Cellar by CELEX with
`Accept: application/xhtml+xml` and `Accept-Language: eng`. These notes are the reading (V.1). **They change nothing in
`data/`**: what is written there, and why, is decided by the author in §8 (V.2) and recorded at the end of this file.

The finding being answered (`docs/PHASE-3-AUDIT.md`, `docs/V2-CLOSURE.md`, V2C-21): `eidas2.dna.regulated_actor` — the
reader's "Who it binds" — mixes the addressees of the wallet duties with trust service providers from the scope article, and
is not exhaustive. Measured at the start: `actor:member-state`, `actor:public-authority`, `actor:large-company`, `actor:vlop`,
`actor:trust-service-provider`.

## 1. What was retrieved

| Document | CELEX | Retrieved | Bytes (XHTML) | SHA-256 of the XHTML |
|---|---|---|---|---|
| Regulation (EU) 2024/1183, OJ L, 2024/1183, 30.4.2024 | 32024R1183 | Cellar, 13 Nov 2026 | 583 007 | `1e0f838b…4cc4319add8cf` |
| Regulation (EU) No 910/2014, OJ L 257, 28.8.2014 (the original text) | 32014R0910 | Cellar, 13 Nov 2026 | 355 891 | `b4fa3525…a3169b27f33` |
| Corrigendum to Regulation (EU) 2024/1183, OJ L, 2025/90317, 9.4.2025 (English) | 32024R1183R(02) | Cellar, 13 Nov 2026 | 11 426 | — |
| Directive (EU) 2022/2555 (NIS 2), Art. 42 | 32022L2555 | Cellar, 13 Nov 2026 | 702 913 | — |

**The amending acts and corrigenda**, from the Publications Office's SPARQL endpoint
(`https://publications.europa.eu/webapi/rdf/sparql`, 13 Nov 2026, `cdm:resource_legal_amends_resource_legal` and
`cdm:resource_legal_corrects_resource_legal` on the two works):

- **Amending Regulation (EU) No 910/2014:** Directive (EU) 2022/2555 and Regulation (EU) 2024/1183. Nothing else.
- **Corrigenda:** thirteen to No 910/2014 (`R(01)`…`R(13)`, 2014–2026) and seven to 2024/1183 (`R(01)`…`R(07)`, 2024–2026).
  By the language of each expression, **only one has an English text**: 32024R1183R(02) of 9 Apr 2025, in every language. It
  corrects "unlikeability" to "unlinkability" in Art. 5a(16)(b) and the reference "Article 5c(7)" to "Article 5c(8)" in the
  replaced Art. 47(2), (3) and (5). **Neither correction changes whom any Article binds.** The others are in one or two other
  languages each (CES, DEU, SLK, LIT, ITA, SPA, RON, HRV/SWE, FRA, MLT; DAN/NLD, POL) and were not read.
- **Directive (EU) 2022/2555, Art. 42:** "In Regulation (EU) No 910/2014, Article 19 is deleted with effect from 18 October
  2024." So the security and breach-notification duties of the original Art. 19 no longer bind; non-qualified providers are
  bound instead by Art. 19a, inserted by 2024/1183, and qualified providers by Art. 24(2), points (fa) and (fb).

**Not read:** a consolidated version (none was used; the amended text is assembled from the two OJ texts); Annexes I–VII
beyond the amending instructions; the implementing acts (2024/2977, 2024/2981 and the others) — they specify, they do not
add addressees; the recitals, except where cited below. **Every locator below is to an OJ text read on 13 Nov 2026.**

In the locators, "2024/1183 Art. 1(5)" means Art. 1, point (5), of Regulation (EU) 2024/1183, which inserts or replaces
the Article named after it in Regulation (EU) No 910/2014. An Article of No 910/2014 cited without a point of 2024/1183 is
in its original text, unamended in the parts quoted.

## 2. Scope

**Art. 2(1)**, as replaced (2024/1183 Art. 1(2)(a)): "This Regulation applies to electronic identification schemes notified
by a Member State, to European Digital Identity Wallets provided by a Member State and to trust service providers
established in the Union." The scope Article names **two objects and one actor**. Whom the Regulation *binds* is a separate
question, answered by the Articles that say "shall"; it binds several parties the scope Article does not name (§3).

## 3. Who each Article binds

Only an addressee of a "shall" (or "shall not") is listed. A party that is only the object of a duty, or that "may" act, is
not. The term column is the existing `data/taxonomy.json` term that says it, or "none".

| # | Addressee, in the Regulation's words | What binds it, with the locator | Existing term |
|---|---|---|---|
| A1 | **Member States** | Provide at least one wallet within 24 months of the implementing acts (Art. 5a(1), 2024/1183 Art. 1(5)); inform users of breaches (5a(6)); provide validation mechanisms free of charge (5a(8)); ensure revocation (5a(9)); notify the Commission (5a(18)); publish relying-party registrations and provide a common mechanism (5b(5), (7)); designate conformity assessment bodies and set national certification schemes (5c(1), (3), (7)); inform the Commission of certified wallets (5d(1)); suspend, withdraw, re-establish wallets on a breach (5e(1)–(3)); **accept wallets where they require electronic identification for an online service provided by a public sector body (5f(1))**; ensure identity matching when acting as relying parties (11a(1), 2024/1183 Art. 1(11)); peer reviews (12(5), Art. 1(12)(d)); penalties, and fines on trust service providers of at least EUR 5 000 000 or 1 % (16(1), (2), Art. 1(15)); verification of attributes against authentic sources (45e(1), Art. 1(46)); public sector bodies issuing attestations (45f(2), (3)); supervisory bodies (46a(1), (2); 46b(1), (2), Art. 1(47)); single points of contact (46c(1), (3)); statistics (48a, Art. 1(49)); trusted lists (Art. 22); recognition of signatures in public services (Art. 27); the notifying Member State's duties and liability (Arts 7, 10, 11(1)) | `actor:member-state` |
| A2 | **Providers of European Digital Identity Wallets** — a wallet is provided directly by a Member State, under its mandate, or independently of it but recognised by it (5a(2)) | Ensure users can request support and report problems (5a(10)); not collect or combine data beyond what the wallet needs, and keep it logically separate (5a(14)); Art. 24(2), points (b) and (d) to (h), apply to them mutatis mutandis (5a(20)); supervised by the supervisory body of the Member State where they are established (46a(3)), which may order them to suspend or cease (46a(5)) | **none** |
| A3 | **Relying parties** — "a natural or legal person that relies upon electronic identification, European Digital Identity Wallets or other electronic identification means, or upon a trust service" (Art. 3, point (6), as replaced by 2024/1183 Art. 1(3)(c)) | One that intends to rely upon wallets must register in the Member State where it is established (5b(1)); must not request data beyond what it registered (5b(3)); must report changes (5b(6)); must identify itself to the user (5b(8)); is responsible for authenticating and validating the data requested and must not refuse pseudonyms where identification is not required (5b(9)); **an intermediary acting on its behalf is deemed a relying party** (5b(10)). All 2024/1183 Art. 1(5) | **none** |
| A4 | **Private relying parties that provide services and are required to use strong user authentication for online identification**, by Union or national law or by contract, **except microenterprises and small enterprises** (Recommendation 2003/361/EC) | Accept wallets no later than 36 months from the implementing acts, only on the user's voluntary request (5f(2)). A subset of A3: **medium-sized enterprises are bound; the size test is an exemption, the trigger is the authentication requirement** | `actor:large-company` (today) — **inexact**: it excludes medium-sized enterprises, which are bound, and includes large companies with no authentication requirement, which are not |
| A5 | **Providers of very large online platforms** as referred to in Art. 33 of Regulation (EU) 2022/2065 | Where they require user authentication, accept and facilitate wallets, only on the user's voluntary request and for the minimum data necessary (5f(3)) | `actor:vlop` |
| A6 | **Gatekeepers** under Regulation (EU) 2022/1925 | Allow wallet providers and issuers of notified electronic identification means that are business users effective interoperability with, and access to, the same operating system, hardware or software features, free of charge (Art. 12b, 2024/1183 Art. 1(13)) | `actor:gatekeeper` |
| A7 | **Trust service providers** — "a natural or a legal person who provides one or more trust services either as a qualified or as a non-qualified trust service provider" (Art. 3, point (19)); in scope when established in the Union (Art. 2(1)) | Liability (13(1), Art. 1(14)); administrative fines (16(2)); non-qualified: risk measures and 24-hour breach notification (19a, Art. 1(18)); qualified: audited every 24 months and report within three working days (20(1), (1a), Art. 1(19)); notify before providing a qualified service (21(1), Art. 1(20)); verify identity and attributes (24(1)–(1b)); the duties in 24(2), including (fa) and (fb) (Art. 1(21)); remote creation devices (29a, Art. 1(28)); **providers of electronic attestations of attributes** — issuing them is a trust service (Art. 3, point (16)(g)) — offer them to wallet users and interface with wallets (45g), and keep the data separate (45h) (Art. 1(46)) | `actor:trust-service-provider` |
| A8 | **Providers of web-browsers** | Recognise qualified certificates for website authentication, display the attested identity data user-friendly, ensure support and interoperability — except micro and small enterprises in their first five years as providers of web-browsing services (45(1a), 2024/1183 Art. 1(44)); take no measure contrary to those duties, and notify any precautionary measure (45a(1), (3), Art. 1(45)) | **none** |
| A9 | **Public sector bodies** responsible for an authentic source, or designated to issue attestations on their behalf (Art. 3, point (46)); "public sector body" is defined in Art. 3, point (7), of No 910/2014 and **includes a private entity mandated to provide public services, when acting under that mandate** | Those issuing electronic attestations of attributes shall provide an interface with wallets (45f(8), Art. 1(46)) | `actor:public-authority` (no definition) or `actor:public-sector-body` (its note is the Interoperable Europe Act's definition, Regulation (EU) 2024/903, which is not this one) |
| A10 | **Supervisory bodies** designated by the Member States | Supervise wallet providers (46a(3)–(6)) and trust service providers (46b(3)–(6)); require remedies and withdraw qualified status (20(2)–(3c)); verify notifications (21(2)); acknowledge and investigate a web-browser's notice (45a(3), (4)) | `actor:public-authority` (by function; the Regulation does not say a supervisory body is a public authority) |
| A11 | **The party issuing a notified electronic identification means**, and **the party operating the authentication procedure** — the Member State, a party under its mandate, or a party independent of it but recognised (Art. 7(a)) | Attribute the means to the person (Art. 7(e)); liable for damage for failing to (Art. 11(2)); liable for the correct operation of the authentication (Art. 11(3)) | **none** |
| A12 | **Conformity assessment bodies** (Art. 3, point (18), as replaced) | Certify wallets (5c(1)) and audit qualified providers (20(1)) — **as the instrument of another's duty**: the "shall" is on the Member State that designates them and on the provider that must be audited. No Article read gives them a duty of their own | none needed |
| A13 | **The Commission** and the **European Digital Identity Cooperation Group** | Implementing and delegated acts, lists, reports (passim; 46e, 49) | outside the actor vocabulary: a Union institution is an `institutions.json` record, not an actor |

**No duty was found on users.** The wallet's use is voluntary (5a(15)).

## 4. What the five actors on record are, measured against the reading

| Actor on record | What the reading shows |
|---|---|
| `actor:member-state` | **Correct.** The principal addressee (A1). |
| `actor:public-authority` | **Correct in kind, not on its current basis.** `eidas2:art-5f`'s summary reads "Public-sector online services … must also accept the wallet (5f(1))", but 5f(1)'s addressee is the **Member State** ("Where Member States require … they shall also accept"). Public bodies are bound elsewhere: as public sector bodies issuing attestations (A9, 45f(8)) and as supervisory bodies (A10). |
| `actor:large-company` | **Inexact** (A4). |
| `actor:vlop` | **Correct** (A5). |
| `actor:trust-service-provider` | **Correct, and not only from the scope Article**: Arts 13, 16(2), 19a, 20, 21, 24 and 45g–45h bind it (A7). The finding's "mixes" is answered: the wallet duties and the trust-service duties are both duties of this Regulation. |

**Missing, and bound by an Article:** wallet providers (A2), relying parties (A3), gatekeepers (A6), web-browser providers
(A8), issuers of notified electronic identification means (A11).

## 5. What this reading names for others, and does not write

- **`eidas2:art-5f.obligation_on`** lists `actor:public-authority` for 5f(1), whose addressee is the Member State, and
  `actor:large-company` for 5f(2) (A4). A provision field, outside this session's files (the prompt, "Scrivere").
- **`ap-eidas2-01`** (Session 25's reading; X5-1 item 67, `docs/PHASE-5-SETUP.md` §10.7): its `depends_on` says the
  obligations on relying parties and trust service providers "are not mapped here". This reading locates them (A3, A4, A7);
  the rule is not touched.
- **The questionnaire** (`js/applies.js`, Session 29): of the actors above it offers `actor:vlop`, `actor:gatekeeper`,
  `actor:large-company`, `actor:sme` and `actor:public-authority`; it offers no wallet provider, relying party, web-browser
  provider or trust service provider.
- **No instrument record has a record-level `verification_note`** (measured across all of `data/instruments.json`): the
  prompt's V.3 premise that `eidas2`'s is "rewritten" does not hold, and where the reading is recorded is put to the author.

## 6. What the author decided, and what was written

The decisions are `docs/ROADMAP-v2.md` §8, the rows "V2C-21, V.2: …" of 13 and 14 Nov 2026, in the author's words. Written
in `61dd1a7`:

| Actor | Decision | Rests on |
|---|---|---|
| `actor:member-state` | stays | A1 |
| `actor:wallet-provider` | **added, new term** | A2 |
| `actor:relying-party` | **added, new term**; replaces `actor:large-company` | A3, A4 |
| `actor:vlop` | stays | A5 |
| `actor:gatekeeper` | **added**, existing term | A6 |
| `actor:trust-service-provider` | stays | A7 |
| `actor:web-browser-provider` | **added, new term** | A8 |
| `actor:public-authority` | stays, **rebased** on Arts 45f(8), 46a, 46b, not 5f(1) | A9, A10 |
| `actor:large-company` | **exits** | A4 |

**Declared limits — bound, and not in "Who it binds":** the issuer of a notified electronic identification means and the
party operating the authentication (A11; the author's decision of 14 Nov 2026); conformity assessment bodies, which no Article
read binds directly (A12); the Commission and the Cooperation Group, outside the actor vocabulary (A13).

**Where the reading lives** (the author's decision, 14 Nov 2026): the three new terms' notes in `data/taxonomy.json` cite their
Articles; every actor's Articles and the limits are in this file. No field was added to the record. **`last_verified` stays
2026-10-27**: the status, `status_as_of` and milestones were not re-read and are Session 25's.

**Unchanged:** `ap-eidas2-01` and every rule; `eidas2`'s status, `status_as_of`, milestones and timeline; the provisions,
including `eidas2:art-5f.obligation_on` (§5); the A-8 warnings; `i18n/` (taxonomy labels have no translation overlay and fall
back to English, so no key is added). **Named for a later session:** provisions for Arts 5b, 12b, 45, 45f and 46a with
`obligation_on`, so that "Who it binds" is anchored to Articles shown on the page; and `eidas2:art-5f.obligation_on` (§5).
