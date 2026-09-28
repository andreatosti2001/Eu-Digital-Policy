# DISCOVERABILITY AND REACHABILITY STRATEGY

**Written:** 27 September 2026. **Operational detail:** `docs/SEO-OPERATIONS.md`. **The state
this starts from:** `docs/SEO-AUDIT-2026-09-27.md`.

The site is found by being the best available answer to specific questions about EU digital law,
and by being the thing people cite when they have answered one. Both follow from what it already
is — graded evidence, one record per fact, stated gaps — and neither is served by more pages,
more words or more keywords. This document says who it is for, which questions it answers, where
each question should land, and what would widen its reach. It contains no search-volume figure,
because none has been measured; the first ones will come from Search Console (§9).

---

## 1. Who it is for

| Reader | What they arrive wanting | What serves them |
|---|---|---|
| Compliance and legal teams in companies, especially SaaS, platforms and AI providers | "Does X apply to us, from when, and who enforces it?" | instrument pages (dates, provisions, authorities), `applies.html` |
| Policy researchers, students, journalists | "What does the law say, what has enforcement achieved, what is the argument about it?" | the brief, instrument pages' evidence sections, `enforcement.html`, `bibliography.html` |
| Regulators, NGOs, advocacy | the record of enforcement and of what is still open | `enforcement.html`, instrument pages |
| Engineers and data people | how an evidence-graded legal dataset is built | the repository, `README.md`, `docs/EVIDENCE-MODEL.md` |
| AI search systems answering the above | a stable, sourced, explicit statement to cite | every page's headings, sources and dates, in the HTML |

## 2. Search-intent clusters, and the one page each should land on

A cluster names questions the site already answers from its records. It is not a list of
phrases to insert; no prose was edited to add any of these words.

| Cluster | Typical questions | Canonical entry page |
|---|---|---|
| **Core** — EU digital policy, EU digital regulation, European digital rulebook | "what are the EU's digital laws", "how does EU tech regulation fit together" | `/` (the brief), then `instruments.html` |
| **AI Act** — scope, obligations, timeline, high-risk, GPAI, enforcement | "when does the AI Act apply", "AI Act high-risk deadline", "GPAI obligations" | `instruments/ai-act/` |
| **AI Omnibus** — what changed in the AI Act | "AI Act delay", "Digital Omnibus on AI" | `instruments/ai-omnibus/` |
| **GDPR** — obligations, enforcement, fines, automated decision-making | "largest GDPR fines", "GDPR one-stop-shop enforcement" | `instruments/gdpr/` |
| **DSA** — obligations, VLOPs, enforcement | "DSA VLOP obligations", "DSA fines X TikTok" | `instruments/dsa/` |
| **DMA** — gatekeepers, obligations, enforcement | "DMA gatekeeper obligations", "DMA Apple Meta fine" | `instruments/dma/` |
| **Data Act** — data access, sharing, cloud switching | "Data Act cloud switching", "Data Act September 2026" | `instruments/data-act/` |
| **Cyber** — NIS2, DORA, CRA, CER | "NIS2 transposition status", "CRA reporting obligations date" | `instruments/nis2/`, `instruments/dora/`, `instruments/cra/`, `instruments/cer/` |
| **Data/GDPR reform** — Digital Omnibus proposal | "Digital Omnibus GDPR changes" | `instruments/data-omnibus/` |
| **Product liability** | "new Product Liability Directive software" | `instruments/pld/` |
| **Cross-regulation** — GDPR vs AI Act, DSA vs DMA, NIS2 and CRA | "how do the AI Act and GDPR interact" | the "How it interacts" section of each instrument page, which carries every recorded relationship with its summary, provisions and sources; the brief's interactions view |
| **Applicability** — "which EU tech laws apply to my company / to SaaS" | `applies.html`, and each instrument page's "Who it applies to" |
| **Enforcement** — "EU digital regulation fines", "what has enforcement achieved" | `enforcement.html` |
| **Evidence / method** — "is this reliable, where does it come from" | `bibliography.html` (sources, method, data quality) and the brief's Annexes B–C |

Where two clusters meet (GDPR and AI Act), the site does **not** make a comparison page. The
relationship is a record in `data/instruments.json`, rendered on both instrument pages with the
same text and sources; a separate "GDPR vs AI Act" page would say the same thing a third time.

## 3. Canonical entry pages

Eighteen indexable addresses (`node tools/seo-audit.mjs` lists them): the brief, five directory
pages and twelve instrument pages. Every one has a unique title built from what the page
contains, a description derived from its record, a social card, a breadcrumb, and structured
data describing it and nothing else. Nothing else is offered to a search engine, and why each
other address is not is printed on every CI run.

## 4. The internal link graph

- **Every page** carries a static site index before the footer: the six sections and the twelve
  instrument pages, with descriptive anchor text ("Digital Services Act (DSA)", not "read more").
  This is what makes the whole indexable set reachable from any page by plain `<a href>`, with or
  without scripts — `seo-audit.mjs` §5 fails if one becomes unreachable.
- **`instruments.html`** carries the list of instrument pages in its HTML, each with its full
  name, status and kind, and names the thinner records rather than hiding them.
- **Each instrument page** links to: every instrument it has a recorded relationship with (in
  "How it interacts", anchored in the relationship's own sentence, and in "Related", labelled
  with the kind of relationship — *overlap*, *lex specialis*, *amends*); its competent
  authorities on the institutional map; its enforcement records in the observatory; its Part of
  the brief; its glossary terms; and its official text.
- **Relationship links are evidence-backed by construction**: a link exists only where
  `data/instruments.json` records an edge, and the edge is shown with its summary, the provisions
  that carry it and its sources. The graph is 17 edges; the site says 17, and adds none.

## 5. Social sharing

Every page has a 1200×630 card rendered in the site's own type and palette, self-hosted under
`img/og/` (`tools/og-image.mjs`). Instrument cards carry only identity — name, full title, kind,
CELEX — because an image cannot be corrected by a check and must not carry anything that goes
stale. Titles and descriptions are the page's own, so a shared link says exactly what the page
says. Worth sharing, when there is news: the instrument page concerned, not the home page — a
DSA decision should be shared as `instruments/dsa/#sec-enforcement`.

## 6. GitHub discoverability

The repository is a second front door and currently undersells the project. Suggested settings
(repository → About; only the owner can change them):

- **Description:** "Evidence-graded map of EU digital law — GDPR, DSA, DMA, AI Act, Data Act,
  NIS2 — one page per regulation, every claim sourced and graded. Static site, zero dependencies."
- **Website:** `https://andreatosti2001.github.io/Eu-Digital-Policy/`
- **Topics:** `eu-law`, `digital-policy`, `gdpr`, `digital-services-act`, `digital-markets-act`,
  `ai-act`, `data-act`, `nis2`, `regulation`, `legal-data`, `open-data`, `static-site`.
- **Social preview image:** upload `img/og/site.png`.
- The README now leads with what the site is and links the main instrument pages.

## 7. The custom domain — a recommendation, not a prerequisite

At `andreatosti2001.github.io/Eu-Digital-Policy/` the site cannot have a site name in Google
results (Google does not support site names at the subdirectory level), cannot publish a
`robots.txt` of its own, cannot be a Search Console *Domain* property, and shares a host with
whatever else the account publishes. The URL is also hard to remember or cite aloud.

A short custom domain would fix all four: `WebSite.name` "EU Digital Policy" would become
eligible as the site name; a root `robots.txt` and `Sitemap:` line become possible; backlinks
accrue to a domain the project owns and can keep if the hosting changes; and citations become
stable independently of GitHub. The move is cheap here: set `BASE` in `tools/_footer.mjs`,
regenerate, configure the Pages custom domain (GitHub then redirects the old address), and add
the new property in Search Console. The cost is a domain registration and the risk of letting it
lapse — a lapsed domain is worse for citations than a `github.io` address. **Decide before
external citations accumulate**, since every citation made now points at the old address.

## 8. Multilingual

English is the only indexed language (`docs/SEO-OPERATIONS.md` §6 gives the reasons and the
three conditions for changing that). Each locale becomes indexable on its own, as soon as a
native-speaker review of it exists — the brief first, instrument pages only if their interface
text is translated too. Machine-assisted translations should not be indexed unreviewed on a site whose
claim is that every statement says what it can support.

## 9. Backlinks and citation

What makes the site citable already exists: stable, permanent IDs; one URL per instrument; dates
on every record; sources with locators. What would widen its reach, in order of fit:

1. **A citable snapshot.** A dated release of `data/` with a DOI (e.g. through Zenodo's GitHub
   integration) is how datasets are cited in academic work. **This is blocked by the licence
   question**: the footer states no licence has been declared, and without one a dataset cannot
   responsibly be deposited for reuse. The licence is the author's decision (AGENTS.md rule 8).
2. **A short method note** — the evidence model and the provenance discipline — as a working
   paper (SSRN, a university repository). It is the part of the project most likely to be cited
   by people who do not need the legal content.
3. **Subject guides.** University law-library guides on EU digital law list free resources; the
   instrument pages and the enforcement observatory are the relevant entries.
4. **Practitioner communities** where the enforcement record is useful (privacy and platform
   regulation newsletters, the IAPP community): share a specific record when it changes, not the
   site in general.
5. **Correction as outreach.** When the site corrects a widely repeated figure (as it did for the
   DPC's share of the largest GDPR fines), the correction, with its sources, is the most citable
   thing it has.

No paid links, directories or link exchanges: they would be the opposite of the project's claim.

## 10. AI search and citation

Google's guidance (read 27 Sep 2026) is that appearing in AI Overviews or AI Mode needs no
special files or markup; they draw on the same index. So the strategy is the ordinary one done
thoroughly, and it is what the instrument pages now are: each question in §2 has a page whose
HTML, before any script runs, states what the instrument is, its CELEX number and kind, its
scope and objective, who it binds, its status and the date it was assessed, its dates, its
competent authorities, its provisions, its sanction ceiling, its enforcement, its relationships
and — for every claim — its sources, its grade and the date it was last verified, under explicit
headings. Nothing is written for machines that a reader does not see. **No `llms.txt`**, no
hidden text, no separate crawler content. What will earn citations from those systems is what
earns them from people: being specific, dated and sourced, and saying plainly what is not known.
