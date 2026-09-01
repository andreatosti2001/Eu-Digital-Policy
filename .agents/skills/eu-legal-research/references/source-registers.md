# Which register is authoritative for which fact

**These are navigation aids for finding a document, not citations.** Nothing in this file may
be copied into `data/sources.json`. A `url`, a CELEX number, a title, a publisher or a date
enters the data only after being read off the document actually retrieved.

## Authority table

| Fact type | Authoritative for the site's purposes | Tier it maps to |
|---|---|---|
| Instrument identity, CELEX, article number and heading, recitals | The consolidated or original text on EUR-Lex (`eur-lex.europa.eu`) | `tier:1` |
| Entry into force, application, staggered dates | The instrument's own final provisions, on EUR-Lex | `tier:1` |
| Judgments, orders, pending cases | The Court's own record (`curia.europa.eu`); the judgment text, not the press release, where the fact is a holding | `tier:1` |
| Commission decisions, fines, commitments | The Commission's decision; its press release where the decision text is not published | `tier:1` for the decision, `tier:2` for the release |
| Designations, opened proceedings, infringement steps | The Commission's own register or announcement | `tier:1`–`tier:2` |
| National supervisory decisions | The authority's own publication | `tier:2` |
| Guidance, opinions, recommendations | The issuing body (EDPB, EDPS, ENISA, a national authority) | `tier:2` |
| Legislative progress on a proposal | The Parliament's and Council's own procedure records; preparatory documents on EUR-Lex | `tier:1`–`tier:2` |
| Transposition state of a directive | The Commission's infringement record, or the Member State's own instrument | `tier:1`–`tier:2` |
| Aggregate enforcement statistics | Whoever compiled them, named as the compiler — never as the law | `tier:3`–`tier:4` |
| Characterisations, rankings, "first" and "largest" | Usually **nothing**. See below. | — |

The tier vocabulary is defined once, in `data/taxonomy.json` under `source_tier`. Do not
restate it; read it there.

## The three retrieval failures this project has already had

1. **A superlative taken from commentary.** "Largest fine to date" and "first enforcement of
   its kind" are almost never stated by the authority. If the retrieved document contains no
   ranking language, the ranking is not sourced — record that, do not soften it.
2. **A date taken from a document record rather than the text.** A register's metadata field
   can carry the wrong date; one entry-into-force date in this repository was captured from a
   field that actually held the application date. Read the instrument's final provisions.
3. **A publication that was never named.** Where the brief attributes a figure to
   "analysis published on the anniversary" without naming it, there is nothing to find. The
   finding is *the attribution is unnamed*, and it is recorded as such.

## CELEX — a parsing aid

A CELEX number is `sector + year + type + number`. Sector 1 = treaties, 2 = international
agreements, 3 = legislation, 4 = complementary legislation, 5 = preparatory documents,
6 = case law, 7 = national transposition, 0 = consolidated texts. For sector 3 the type
letter is `R` regulation, `L` directive, `D` decision.

Use this only to **read** a CELEX number you have retrieved, or to sanity-check that a number
you found refers to the kind of act you expect. **Never construct one.** A CELEX number
entered into `data/instruments.json` must have been read off the EUR-Lex record for that
instrument.

## When retrieval fails

Blocked network, a dead link, a paywall, a document that exists only on paper: record the
attempt and its outcome. `url_status` in `data/taxonomy.json` has a term for each of these
(`url:unchecked`, `url:dead`, `url:moved`, `url:paywalled`, `url:none`). Choosing the honest
term is the whole job. `tools/freshness.mjs` already groups missing URLs by *why* they are
missing — "publication not identified" is a different finding from "URL not located", and
only the second is fixable by searching harder.
