# HANDOVER

**Last updated:** 23 November 2026 (UTC), the network-map session, on `claude/dazzling-mendel-yor1kd`, from `main` `764ba77`. The entry before it: 23 November 2026, the Track M session (`eidas2` milestone).
**Branch:** `claude/dazzling-mendel-yor1kd`, pushed; final checkpoint approved, a pull request to `main` opened on the author's request, to be merged by the author.
**Read first:** **`network.html` — the network of the instruments — is built and in this branch**, the first piece of the Hybrid for the published site: the map alone, the full combination of `prototypes/hybrid/` (`6fdc311`), on the existing data, **`noindex` until measured on a real phone**. A relationship whose stating act is not adopted reads «Proposed: …» and is drawn faint (18 of 53 on 23 Nov 2026). **Not measured: a real phone, Safari, Firefox, a screen reader.** The next session is trials on a phone (`docs/prompts/v2-trials-network-map-phone.md`).

## The network map — `network.html` in production (23 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, the seven rows of 23 Nov 2026 (scope; N.1 decisions 1–3; decision 4; N.3; N.4), in the author's words.

- **N.1, measured first** (`764ba77`, full clone): 44 instruments and 53 relationships (the prototype was measured on 39/40); 18 relationships `proposed` by `js/map-model.js`; 8 instruments in no relationship. Decided: the full combination (English, no `data-i18n` string, so nothing new in the i18n register); a new page `network.html`, child of Instruments, linked from `instruments.html` and the site index; the site's wording (`kindText()`) and the site's renderer (`js/interactions.js`) for every relationship; `noindex`, no canonical, out of the sitemap.
- **Written** (`4956e42`, `640d046`): `network.html`; `js/network-model.js` (pure: counts, deterministic 3D layout, projection, geometry, ported from `prototypes/observatory/explorer.js`); `js/network-page.js` (the explorer in the Hybrid's arrangement built directly: box, "Enlarge the network", the phone's ego view, panel, legend as the type filter, the list keyed by record id); `js/interactions.js` exports `interactionsOverview()` (the brief's output unchanged); `css/tools.css` (one section on the site's tokens, no new colour: a type's colour is its family's pigment, plus a stroke pattern and a code); `tools/seo.mjs` (`noindex` route, `networkIndex()` — the no-JS list — and the site-index link); `tools/_footer.mjs`, `tools/pages-artifact.mjs`, `js/shell.js` `CHILD_OF`; `agent/detector/impact.mjs` `MODULE_SURFACE`; every page regenerated (site index). **No file under `data/` touched; no edge added, removed or reclassified.**
- **Decision 4 (found in N.2):** the page reads `data/brief.json` for the parts' numerals only («Part V», linked to the brief) and never prints a title, the second home. `agent/detector/selftest.mjs` now asserts `brief.json` reaches `network.html` only, with a guard that `js/network-page.js` prints no `.title`; `agent/detector/surfaces.mjs` keeps the second-home caveat in both cases.
- **Tests:** `agent/browser/network-checks.mjs`, 23 `netmap:*` checks (the prototype's planted cases for the published page; each expected figure derived from `data/` in Node), wired in `runner.mjs` and `PAGES`; `agent/browser/selftest.mjs` NETMAP 1 (all pass on the real site) and NETMAP 2 (eight fail on seven planted defects: an arrow everywhere, a proposal read as law, the filter rule removed, a phantom edge, the isolated instruments dropped, no no-JS list, the canvas shrunk onto a phone). **Assertions moved because the world changed, named:** `agent/proposals/editorial/selftest.mjs` page count 11 → 12; the detector test above.
- **Found and fixed in this session:** two links fell back to the browser's blue, 1.98:1 on the dark ground (`a11y:contrast:dark` on `instruments.html` and `network.html`); the longest rim label and MiCA clipped in the box and the enlarged stage. **Process slip, declared:** one test file was edited while a browser run was in progress; that run reported "the repository changed" and was discarded; the final run below was made with nothing written.
- **Not measured:** a real phone, a finger, Safari, Firefox, a screen reader, contrast inside the SVG against its pixels, performance on a slow device; whether the 3D network reads well in its box. The phone measurement is the author's after the merge (§8, N.3).
- **Found, not fixed:** `js/interactions.js` `KIND_ORDER` has no place for `defers-to` and `enables`, so their 19 relationships are grouped under "Other" in the brief's overview and on the network page's list (pre-existing; not this session's scope). The prototype's observatory still leaves a filtered type drawn (`docs/PROTOTYPES.md` §3.6); the production page carries the rule and `netmap:filter` checks the computed display.
- **Battery** (on `ee9a05e`, nothing written during it): `validate`, `csp`, `thirdparty`, `evidence-audit`, `metric-contract`, `freshness` output identical to `764ba77`; `i18n-audit`, `design-qa`, `seo-audit` differ only in the page and module counts and the `noindex` route of `network.html`; `_footer.mjs --check` current; `agent/implement/cli.mjs check --as-of 2026-11-23` verdict pass; 26 suites 1508 pass, 0 fail, 1 skipped (1506 + NETMAP 1 and 2; `tools/selftest.mjs` 201/201); browser 407 pass, 0 fail, 1 undecidable (`a11y:bound`), the repository byte-identical during the run; `commit-evidence` 0 without evidence.
- **Branch register:** `claude/dazzling-mendel-yor1kd`, disposition: the final checkpoint is approved (§8, 23 Nov 2026); on the author's answer («Approve both, open the PR»), a pull request to `main`, opened by the session and merged by the author with a merge commit. `git branch -r --no-merged origin/main` (re-fetched before this write; `origin/main` still `764ba77`): `claude/brave-goldberg-gm87jp`, `claude/confident-johnson-yeffcv`, both registered; no unregistered branch.

> The header the Track M session wrote, kept as written:
>
> **Last updated:** 23 November 2026 (UTC), the Track M session (`eidas2` milestone), on `claude/sweet-lamport-fhdex7`, from `main` `e514129`. The entry before it: 22 November 2026, the rebalancing session.
> **Branch:** `claude/sweet-lamport-fhdex7`, pushed; whether to open a pull request is the author's answer at the final checkpoint.
> **Read first:** **`ap-eidas2-01` was re-read from Cellar on 23 Nov 2026 and re-attested unchanged** (`last_verified` 2026-11-23; it lapses on 21 Feb 2027); `freshness --as-of 2027-02-03` now names no rule. **N1** — whether Implementing Regulation (EU) 2026/1731, adopted under Art. 5a(23) and in force since 11 Aug 2026, moves the date of Art. 5a(1) — is named, not decided, and goes to Session 25, 25.2. **The next session is the network map** (`docs/prompts/v2-visible-network-map.md`).

## Track M — the `eidas2` milestone: `ap-eidas2-01` re-attested; N1 named (23 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, the six rows of 23 Nov 2026 (scope; corrigenda; M.2 decisions 1–3; M.4), in the author's words.

- **Scope:** the rule only; `eidas2`'s status, `status_as_of`, milestones and timeline untouched — Session 25's (25.2), after 24 Dec 2026.
- **Read** (`docs/TRACK-M-EIDAS2-READING.md`, hashes in §2): 2024/1183 Art. 1 points (1)–(5) and Art. 2 (identical bytes to 13 Nov); 910/2014 Arts 2–3; the five implementing acts of 28 Nov 2024 (citations, final Articles); 2026/1731; 2025/846, 2025/848, 2026/1730 (citations, last Articles). SPARQL as on 4 and 13 Nov. **Corrigenda in French or Italian** (§8, 22 and 23 Nov): 2024/1183 R(03), R(06) (FR), 910/2014 R(06) (IT), R(11) (FR) — none touches what the rule cites. **Unreadable** (404 in IT and FR, XHTML/HTML/PDF): 2024/1183 R(01), R(04), R(05), R(07); 2024/2977 R(01) (Irish only).
- **Written:** `data/applicability.json` (`ap-eidas2-01`: `last_verified`, `verification_note`, `attestation` with `outcome: "unchanged"`; no word of the rule changed), `tools/selftest.mjs` (the one pin, §8 decision 3), `instruments/eidas2/index.html` and `sitemap.xml` regenerated — commit `15587a9`, with `Evidence:`. The five A-8 warnings stay, named.
- **Prompts:** `docs/prompts/v2-visible-network-map.md` gains an exit criterion (the standing rule; Track M's precedence); `docs/prompts/v2-session-25.md` gains the N1 addendum for 25.2.
- **Battery** (before the final write): `validate`, `i18n-audit`, `design-qa`, `seo-audit`, `evidence-audit --as-of 2026-11-23` and `--as-of 2027-02-03` output identical to the base; `freshness` differs only in the rules' date range and, at 2027-02-03, by the `ap-eidas2-01` prompt gone (15 → 14 staleness prompts); `csp`, `thirdparty`, `metric-contract`, `agent/implement/cli.mjs check` exit 0; 26 suites 1506 pass, 0 fail, 1 skipped (`tools/selftest.mjs` 201/201); browser 362 pass, 0 fail, 1 undecidable; `commit-evidence` 0 without evidence.
- **Residues, named and not touched:** group (b)'s corrigenda without an English expression (to the rules round of Feb 2027); the evaluative sentences (`ap-nis2-01`, `ap-gdpr-04`, `ap-ai-act-04`, `-05`, `ap-data-act-01`); the 2 Aug 2027 residue; group (a)'s open points; the statuses at milestones (ai-act 2 Dec, pld 9 Dec, eidas2 24 Dec 2026). The grant expires 9 Mar 2027 (flagged, not renewed).
- **Branch register:** unchanged from 22 Nov; no unregistered branch (`git branch -r --no-merged origin/main`: `claude/brave-goldberg-gm87jp`, `claude/confident-johnson-yeffcv`, both registered).

> The header the rebalancing session wrote, kept as written:
>
> **Last updated:** 22 November 2026 (UTC), the rebalancing session, on `claude/rebalance-housekeeping`, from `main` `a61b99d`. The entry before it: 19 November 2026, the serpent-opening fix.
> **Branch:** `claude/rebalance-housekeeping`, pushed; a pull request to `main` is opened on the author's request, to be merged by the author.
> **Read first:** **every other session now ships a change a reader can see** (§8, 22 Nov 2026, "Rebalancing the sessions"). **Entries before 13 Nov 2026 (HP-04 and older) are in `docs/archive/HANDOVER-to-2026-11-13.md`, unchanged.** The next session is still Track M (`docs/prompts/v2-track-m-eidas2-milestone.md`, the 24 Dec 2026 milestone); three more prompts wait after it (below).

## Rebalancing the sessions — archive, branches, the page without scripting, three prompts (22 Nov 2026)

**Authority:** the author's list of six items and four answers in chat, 22 Nov 2026; `docs/ROADMAP-v2.md` §8, the four rows of that date.

- **Measured first** (`a61b99d`): 648 non-merge commits since 1 Nov 2026, 538 of them touching no published file; `docs/HANDOVER.md` 871 kB.
- **Archive:** this file's text from line 419 to its end (HP-04 of 13 Nov 2026 and older) moved byte for byte to `docs/archive/HANDOVER-to-2026-11-13.md`; the five anchors in `agent/proposals/governance/patterns.mjs` that quote it now name the archive. 871 kB → 59 kB.
- **Without scripting** (`css/tools.css`, one `@media (scripting:none)` block): the notice moved below the fixed header; the header's controls, the spine's reset, "Open the contents", "Search the record", the compliance dial and the five placeholders hidden for that reader only. Measured in headless Chromium with script execution disabled, 1440 and 390 px, on `index.html`, `it/index.html`, `instruments.html`, `applies.html`, `bibliography.html`: placeholders 3/1/1/5 → 0, inert header controls → 0. **Not measured:** a real phone, Safari, Firefox; no browser check was added for it (a candidate for `agent/browser/checks.mjs`).
- **Prompts written** (not sessions opened): `docs/prompts/v2-visible-network-map.md` (the Regulatory Network Explorer in production, §8 "The Hybrid's first piece"), `docs/prompts/v2-track-m-rules-round-2027-02.md` (the rules round before 16–17 Feb 2027, corrigenda read in Italian or French), `docs/prompts/v2-visible-coverage.md` (instrument pages, glossary, the Italian edition's review by the author). **Their order is not decided.** Proposed, on the alternation rule: Track M `eidas2` (prompt of 18 Nov) → network map → rules round → coverage.
- **Battery** (on this branch, before the final write): `validate`, `i18n-audit`, `design-qa`, `freshness`, `evidence-audit`, `seo-audit` output identical to `a61b99d`; `csp`, `thirdparty`, `metric-contract` exit 0; the 26 suites 1506 pass, 0 fail, 1 skipped (`tools/selftest.mjs` 201/201); browser suite 362 pass, 0 fail, 1 undecidable; `commit-evidence` 0 without evidence.
- **Branch register.**
  - `scout/digest-digest-2026-11-02T16-04-07Z`, `…-11-09T16-29-04Z`, `…-11-16T15-54-39Z`: **merged into this branch**, as every earlier digest was (`ff3aa04`, `2f1fe88`, `1c903a7`), because the Scout counts "new against earlier digests" from the committed ones. The author had answered "close digests"; the session found the practice after the question and merged instead — **the author's to confirm at the pull request**.
  - `claude/brave-goldberg-gm87jp` (`7e93f27`): its one-line change is in `main` as `ed536d6` (§8, 17 Nov 2026). Nothing to merge.
  - `claude/confident-johnson-yeffcv` (`12240467ddbe3364f6c3adf4fab591bc76fe0098`): recorded as superseded by the author on 17 Nov 2026 (§8); not merged.
  - **Not deleted:** the session's attempt to delete the 23 remote branches already in `main` and the two above was refused by this environment's permission policy. The author can delete them on GitHub, or with `git push origin --delete <branch>`: `claude/amazing-mccarthy-doan3m`, `claude/amazing-pascal-95wq2o`, `claude/cool-goodall-dr0emd`, `claude/eager-euler-05ukz9`, `claude/fix-serpent-opening`, `claude/friendly-pasteur-mtqo8h`, `claude/funny-hamilton-yt9uh0`, `claude/jolly-hamilton-du9xkp`, `claude/keen-johnson-sxo9jy`, `claude/kind-rubin-qq3vpo`, `claude/laughing-tesla-ydv2ro`, `claude/mobile-tree-contents`, `claude/nice-babbage-8pohzh`, `claude/nifty-mccarthy-aov32e`, `claude/pv2-03-prototype-editorial`, `claude/pv2-04-start-nhgcqx`, `claude/pv2-05-start-jrurwd`, `claude/quirky-goldberg-fpoxdz`, `claude/sleepy-keller-u3igd5`, `claude/sweet-newton-58i6p3`, `claude/upbeat-thompson-yewfls`, `seo/snippets-2026-11`, `ui/favicon-brand-mark`, `claude/brave-goldberg-gm87jp`, `claude/confident-johnson-yeffcv`; and the three digest branches once this branch is merged.
  - `claude/rebalance-housekeeping`: disposition, a pull request to `main` on the author's request.
- **Answered in chat, not decided:** the SEO of the language editions already switches on by itself when a person has reviewed every string (`docs/SEO-OPERATIONS.md` §6); 0 of 431 are reviewed in each of it, fr, es. The coverage prompt carries the Italian review as the author's step.

> The header the serpent-opening fix wrote, kept as written:
>
> **Last updated:** 19 November 2026 (UTC), after the serpent-opening fix, on `claude/fix-serpent-opening`, from `main` `d168897`. The entry before it: 18 November 2026, the rules-maintenance session, group (b), on `claude/amazing-mccarthy-doan3m`.
> **Branch:** `claude/fix-serpent-opening`, pushed; whether to open a pull request is the author's answer.
> **Read first:** **31 rules were re-read from Cellar on 18 Nov 2026 and re-attested** (`last_verified` 2026-11-18; the 33rd, `ap-eidas2-01`, is Track M's by the author's decision). 26 of them are unchanged in meaning; five carry a wording change decided one at a time in §8 (decisions 2 to 5). `freshness --as-of 2027-02-03` now names only `ap-eidas2-01`. The next session is Track M (`docs/prompts/v2-track-m-eidas2-milestone.md`). Everything below is group (b)'s record, then the earlier sessions'.

## The serpent's opening was not seen — fixed (19 Nov 2026)

**Authority:** the author's report of 19 Nov 2026 («assenza dell'animazione del serpente sia in modalità mobile sia in modalità computer») and request to fix it. **No data, no claim and no page of law was touched.**

- **Measured before the fix** (headless Chromium, `main` `d168897`): the opening *ran*, but started as soon as the figure was built, wherever it was. At 390 × 844 the figure's top is at ~694 px, so the serpent played below the fold; at 1440 × 900 its lower half was cut. The serpent itself is on screen ~1.3 s. `pointerdown` ended it, so the touch that began a scroll on a phone ended it at once. A background tab ran its clock without frames. And `eupolicy:home-intro-seen` was written *before* it played, so each of these withheld it for good.
- **Changed** (`js/home-figure.js`): the opening holds its first frame until the figure is on screen (60 % of it, or 85 % of the viewport) and the tab is in front; the key is written only when it starts; a click (not a `pointerdown`) or a non-scrolling key ends it; the key is renamed `eupolicy:home-intro-seen-v2`, so every reader holding the old one gets one opening. **Not changed:** its timing, its drawing, once-per-browser, reduced motion (the final state at once), the images loaded only when it plays.
- **Checks:** `agent/browser/home-checks.mjs` seeds the new key and adds `home:opening-waits-in-view`; `agent/browser/selftest.mjs` HOME 2 plants a sixth defect it must catch. `validate`, `design-qa`, `i18n-audit`, `csp`, `metric-contract` exit 0; `tools/selftest.mjs` 201/201; browser suite exit 0 (`--only home` 19 pass); `agent/browser/selftest.mjs` 28/28.
- **Not measured:** a real phone, a finger, Safari or Firefox.
- **Branch register:** `claude/fix-serpent-opening`, disposition: the author's answer. `git branch -r --no-merged origin/main` was empty at the start.

## Rules maintenance, group (b) — 31 rules re-attested (18 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, 18 Nov 2026, "The scope of the rules-maintenance session (group (b))", decisions 1–7 and the W.4 row. **Record:** `docs/RULES-MAINTENANCE-B-READING.md`.

- **W.1** (`4214b7a`): 13 Official Journal texts read from Cellar by CELEX, seven Commission/EDPB documents, SHA-256 per document (the AI Act, Omnibus, DMA and NIS2 hashes equal 17 Nov's). SPARQL re-run on every CELEX: no new amending act; one new corrigendum, PLD `R(03)` (11 Nov 2026). **53 corrigenda have no English expression (HTTP 404 in XHTML and HTML) and were not read**, PLD R(02) and R(03) among them.
- **W.2:** seven decisions in §8 with the author's words: re-attest the 24 clean rules with corrigenda declared; reword `ap-ai-act-06` (Art. 5(1)(c), (f)), `ap-data-act-01` («all»), `ap-dsa-04` («check» → best efforts), delete `ap-data-act-04`'s «predominantly …» clause; cite recital 23 for `ap-gdpr-02`; carry the evaluative sentences unchanged and named; move the `tools/selftest.mjs` pins.
- **W.3** (`4702bde`): `data/applicability.json` (31 rules, `last_verified` 2026-11-18 and `attestation`), `tools/selftest.mjs` (pins to 2026-11-18; `ap-cra-01`'s 4 Nov state is now rebuilt by `asOf4Nov()` for the planted tests), seven instrument pages and `sitemap.xml` regenerated. `validate`, `i18n-audit`, `design-qa`, `seo-audit` output identical to the base; `unverified` 47 unchanged; all 26 suites and `tools/selftest.mjs` (201) pass; browser suite 361 pass, 0 fail, 1 undecidable (`a11y:bound`).
- **Partial readings, declared:** some Articles (GDPR 5, 6; DSA 17, 20, 25–28, 34, 35, 37–39; AI Act 9–12, 14, 15, 43, 49; Data Act 25) were read as title and opening paragraphs only — stated in each rule's note. The gatekeepers page rendered 3.8 kB. Claims the rules cite were not re-read.
- **W.4:** `docs/prompts/v2-track-m-eidas2-milestone.md`, chosen by the author («Track M: eidas2, 24 Dec milestone»).
- **Found, not fixed:** the 53 unreadable corrigenda; the five evaluative sentences; no designation decision of AWS/Azure found on 18 Nov (`tl-dma-2026-11-01-designation` still `scheduled`); the group (a) residues.
- **Branch register:** `claude/amazing-mccarthy-doan3m`, disposition: the final checkpoint is approved (§8, 18 Nov 2026); on the author's answer («Approve both, open the PR»), a pull request to `main`, opened by the session and merged by the author with a merge commit. `claude/brave-goldberg-gm87jp`, `claude/confident-johnson-yeffcv` and the three scout digests are as recorded, unmerged, not this session's.

## Rules maintenance, group (a) — the nine findings, re-measured (17 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, "The scope of the rules-maintenance session (group (a))", "Rules maintenance, group (a): the premise", decisions 1–3 and the W.4 row. **Record:** `docs/RULES-MAINTENANCE-A-READING.md`.

- **Premise:** F-02, F-03, F-04, F-13, F-14, F-17, F-19, F-20 and F-23 were each closed on 4 Nov 2026 (§8 rows 21.2; checkpoint 21.2 «Group (a) is closed»). The author chose «Residues only».
- **W.1** (`eb8c02f`): AI Act, Regulation 2026/1744, DMA and NIS2 read from Cellar, the two Commission news items and INF/26/1376 from the Commission, SHA-256 per document (the DMA's is F-18's). **Not re-run: the SPARQL query for amending acts and corrigenda**; the 4 Nov results stand and are declared as such.
- **W.2:** three decisions in §8 with the author's words: reword F-02's words in `nis2` and on the page; leave the 2 Aug 2027 timeline event; attribute `ap-dma-04`'s last sentence to the brief.
- **W.3** (`0e7e85d`): `data/instruments.json`, `instruments.html`, `data/applicability.json` (`ap-dma-04` rationale and note), `instruments/dma` and `instruments/nis2` regenerated. `unverified` 47 unchanged. Validators' output identical to the base; `selftest` 200/200; 26 suites exit 0 (1505 tests); browser exit 0; `commit-evidence` and `implement check` pass.
- **W.4:** the prompt of group (b).
- **Found, not fixed:** F-13's missing event for 2 Aug 2027 (decided: leave); the prompt's open points (named in the reading notes §5); `index.html` does not say «materially incomplete» though the page claimed the brief did.
- **Branch register:** `claude/laughing-tesla-ydv2ro`, disposition: the final checkpoint is approved (§8, 17 Nov 2026); on the author's answer («Approve, open the PR»), a pull request to `main`, opened by the session and merged by the author with a merge commit. `claude/brave-goldberg-gm87jp`, `claude/confident-johnson-yeffcv` and the three scout digests are as recorded, unmerged, not this session's.

## SEO — instrument descriptions lead with status and date (17 Nov 2026)

**Authority:** the author's answers in the session of 17 Nov 2026 (Search Console screenshots for 20 Oct–16 Nov 2026; "Si" to opening the PR). **Record:** `docs/SEO-OPERATIONS.md` §7, "Reordered on 17 Nov 2026".

- `tools/seo.mjs instrumentDescription()` reordered; 17 instrument pages regenerated; `tools/selftest.mjs` S9 added (201/201).
- **Battery:** validators 0 errors (warnings identical to the base); browser suite exit 0; agent suites pass except `agent/proposals/governance` 6 failures, identical on the unchanged base, because the session's clone was shallow and that suite reads history.
- **Not changed:** titles (they already lead with the query term); `MAX_TITLE`/`MAX_DESC`. **Not known:** average position per query — not in the screenshots, so whether the head queries are on page 1 is undetermined.
- **Branch register:** `seo/snippets-2026-11`, disposition: on the author's answer ("Si"), a pull request to `main`, opened by the session, to be merged by the author.

## F-18 — «immediately» against DMA Art. 3(10) (17 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, "The scope of the F-18 session", decisions 1–8, "W.3: `tools/selftest.mjs`" and the W.4 row. **Record:** `docs/F-18-READING.md`.

- **W.1** (`704a2e0`): Regulation (EU) 2022/1925 read from Cellar. Art. 3(10) gives six months after the listing; Arts 5, 6, 7 state no moment; Arts 11(1) and 15(1) use the same six months; the text uses «immediately» only for data access and national notices. **Found beyond F-18:** `clm-dma-ex-ante` cites Art. 3 itself as direct support; the Italian `part-4.p4` says «immediatamente applicabili» where English says "self-executing" and French/Spanish «d'application directe».
- **W.2:** six decisions in §8 with the author's words (rationale, claim, English brief, overlays withdrawn, dates left, the work is the attestation).
- **W.3** (`fe1ab0d`, then the baseline commit): see `docs/F-18-READING.md` §7. **Four checks found things I would not have**: A-4, A-8, seven selftest pins, and `agent/implement` S1B-h against the §12 baseline.
- **W.4:** the prompt of the rules-maintenance session.
- **Found, not fixed:** the self-executing wording; the corrigenda texts of the DMA; two sources of the rule not re-read; the withdrawn translations (no review is possible until they exist).
- **Branch register:** `claude/cool-goodall-dr0emd`, disposition at the final checkpoint. The scout digests, `claude/brave-goldberg-gm87jp` and `claude/confident-johnson-yeffcv` are as recorded, not this session's.

## V2C-17…19 — the DNA's acts, NIS 2 → eIDAS, the Political Advertising edges (17 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, "The scope of the V2C-17…19 session" ("As the prompt states"), decisions 1–8, and the W.4 rows. **Record:** `docs/V2C-17-19-READING.md`.

- **W.1** (`5ad9922`): COM(2026) 16, NIS 2 and Regulation 2024/900 read from Cellar, SHA-256 per document. **Findings against the prompt and the data:** the DNA *repeals* three of the acts the prompt lists (Art. 209: 2018/1972, 2018/1971, 243/2012) and *amends* the others (Art. 206: 2015/2120; Art. 208: 676/2002; Art. 207, ePrivacy, already an edge, confirmed); NIS 2 Art. 42 amends 910/2014 and **Art. 43 amends 2018/1972** (not in the prompt); TTPA Art. 2(3)(f) and (h) name the AVMSD and P2B, both already nodes, and the same Article names seven more acts.
- **W.2:** eight decisions in §8 with the author's words: five instances; nine edges (five DNA, two NIS 2, two TTPA); the other seven acts of Art. 2(3) left; the five carried open points not treated; the term `kind:decision` added.
- **W.3** (`c269d47`): `data/` (five instruments, five sources, nine edges, one taxonomy term), `tools/selftest.mjs`, pages regenerated. 44 instruments, 53 edges. `unverified` 47 unchanged.
- **W.4:** the prompt of F-18.
- **Found by a check, not by me:** M-07 raised five errors (a `status:in-force` instance needs a direct, structural status reference); fixed by reading the Articles. Decision 676/2002's XHTML answers 404 but its HTML is retrievable: a 404 on one format is not "no text".
- **Found, not fixed:** see the reading notes §2 F1–F5 and the prompt's open points (6).
- **Battery:** all as at the start except the counts the records change; `selftest` 200/200; 23 suites and `.control-room/` exit 0; schemas and browser exit 0; `commit-evidence` 0.
- **Branch register:** `claude/cool-goodall-dr0emd`, disposition: at the final checkpoint, on the author's answer. The scout digests, `claude/brave-goldberg-gm87jp` and `claude/confident-johnson-yeffcv` are as recorded, not this session's.

## V2C-03…05 — COM(2025) 837 and the instrument arrays (16 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, "The scope of the V2C-03…05 session" ("As the prompt states"), decisions 1–9, "W.3" and "W.4". **Record:** `docs/V2C-03-05-READING.md`.

- **W.1** (`7b73832`): COM(2025) 837 and its Annexes read from Cellar by CELEX, SHA-256 per document (the body's hash equals V2C-12's). **Findings against the data:** the title names seven acts amended, the articles amend nine (Art. 7 eIDAS, Art. 8 DORA are not in the title); the proposal repeals `dga` (it does not amend it); the arrays' `eprivacy` and `nis2` entries are true amendments with no edge.
- **W.2:** nine decisions in §8 with the author's words: five edges added; the `dga` entry removed; arrays derived and deleted; M-15 flipped to ERROR; P2B summary reworded; GDPR Art. 33 named and left; `eidas2` only the array keys; every key deleted (**measured: the keys were on all 39 instruments, 28 only as empty `[]`, not on 11**).
- **W.3** (`da5343e`): `data/instruments.json` (five edges, P2B summary, two notes annotated, 4 keys × 39 records deleted), `tools/map-audit.mjs` (M-15 ERROR, `ARRAY_FIELDS`), `tools/selftest.mjs` (MP1, MP6, MP8, V1: 13 proposed edges), pages regenerated. 44 edges, 34 textual.
- **W.4:** the prompt of V2C-17…19 (`docs/prompts/v2-v2c-17-19-map-nodes.md`).
- **Found, not fixed:** GDPR Art. 33 on `rel-data-omnibus-gdpr`; the memorandum and Art. 10(2) describe the P2B derogation differently; the three V2C-12 open points; `agent/architect/lenses.mjs` and `prototypes/observatory`, `prototypes/editorial` still mention the arrays (not changed; the lens now finds none).
- **Battery:** `validate`/`i18n-audit`/`design-qa`/`seo-audit` 0 errors; `evidence-audit` and `freshness` differ from the base only in the edge and date counts; `selftest` 199/199; 25 suites and `.control-room/` 0 failed (1 skip); browser exit 0; `commit-evidence` 0. The browser suite exceeds the 120 s foreground limit: run it in the background.
- **Branch register:** `claude/friendly-pasteur-mtqo8h`, disposition: the final checkpoint is approved (§8, 16 Nov 2026); on the author's answer ("Approve both, open the PR"), a pull request to `main`, opened by the session and merged by the author with a merge commit. `claude/brave-goldberg-gm87jp`, `claude/confident-johnson-yeffcv` and the three scout digests are as recorded, unmerged, not this session's.

## V2C-13 — the map checks (16 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, "The scope of the V2C-13 session" (the author's words "Start V2C-13"), decisions 1–7 and the "W.4" row. **Record:** `docs/V2C-13-MAP-CHECKS.md` (the measurement, the proposal, §5 what was written).

- **W.1/W.2** (`420854a`, `dd20ec4`, `7222f15`): M-08…M-16 measured on the 39 relationships before anything was asked: 0 red except M-10 (3), M-11 and M-13 (the same one edge, `rel-dsa-copyright-dsm-defers`, `supports:partial` by construction), M-15 (5 entries, 4 pairs, all `data-omnibus`), M-16 (12 of 12 terms lack `basis`). Seven decisions, each in §8 with the author's words: `basis` as classified; M-11/M-13 ERROR with that edge a named BACKLOG; `edge-v1-sources` flipped to ERROR and `edge-analytical-no-claim` kept as a frozen BACKLOG of three; the rest as designed; M-11 ERROR for all textual kinds (stricter than the design); `basis` registered as prose in the field register; the three open points of V2C-12 carried, none treated.
- **W.3** (`914e089`, `1ac2d6e`, and the register commit): `data/taxonomy.json` (`basis` only), `tools/map-audit.mjs`, `tools/validate.mjs` (M-16), `tools/evidence-audit.mjs` + `tools/evidence-audit-record.mjs` (MAP section), `tools/selftest.mjs` (MP1…MP9, each rule fired by a planted edge; four mutations of the module caught), `agent/detector/fields.mjs` (one entry). No relationship, status, date, `last_verified` or rule changed.
- **W.4:** the prompt of V2C-03…05.
- **Found, outside the writable files, and asked:** the 25-suite run failed `agent/detector/selftest.mjs` on the unclassified `taxonomy_term.basis`. Run `validate` alone and it would have passed. **A data change needs the 25 suites, not the validators.**
- **Found, not fixed:** the arrays' second home (M-15, 5 entries); the three analytical edges with no claim; `gdpr.legal_basis` against the GDPR's visa; the Annex II of COM(2026) 502 with no source record; the V2C-12 partial readings (all in the next prompt).
- **Battery:** `validate`, `i18n-audit`, `design-qa`, `seo-audit`, `freshness` byte-identical to the base; `evidence-audit` the five MAP lines more; `selftest` 199/199; 25 suites and `.control-room/` 1306 tests (before the register fix: 1304 pass, 1 fail, 1 skipped; **final tree: 1305 pass, 0 fail, 1 skipped**, every step of the battery exit 0, the schemas check exit 0); browser 361 pass, 0 fail, 1 undecidable; `commit-evidence` names the one published-file commit (`914e089`). A suite left an empty `agent/records/` behind, as the lesson says one can: removed before closing.
- **Branch register:** `claude/amazing-pascal-95wq2o`, disposition: on the author's answer ("Yes"), pull request #117 to `main`, opened by the session and to be merged by the author with a merge commit. **Reported at the start of the session, in no register and no document:** `origin/scout/digest-digest-2026-11-16T15-54-39Z` (a Source Scout digest of 16 Nov 2026, not this session's, no disposition decided); and `origin/claude/confident-johnson-yeffcv` carries one commit, `1224046` (the §8 row of 15 Nov 2026 on the order of V2C-12 and Sessions 25 and 26), that `main` does not contain — registered here, not merged, the author decides. `claude/brave-goldberg-gm87jp` and the two earlier scout digests are as recorded.

## V2C-12 — the eight v1 relationships (15 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, "The scope of the V2C-12 session" (the author's words "Start V2C-12"), the six "W.2" rows (decisions 1–6) and the "W.4" row. **Record:** `docs/V2C-12-READING.md` (read it, not this entry).

- **W.1** (`4a472a8`): eight texts, two proposals and the proposal's Annexes retrieved from Cellar, SHA-256 per document; each relationship read against its sources. **Three findings against the data:** `rel-tfeu-114-acquis` points Art. 114 at the GDPR, whose visa cites Art. 16 only; `rel-data-act-cloud-ai-act` is stored as a conflict while the proposal's own memorandum says it is consistent with the Data Act and that the Data Act "is thus an enabler for the proposal" (Annex II does require Union-located infrastructure and data, so the localisation half is read); `rel-ai-act-gdpr-impact-assessments` rests partly on a sentence ("regulators acknowledge the duplication") that no text read carries.
- **W.2** (`9cfe2a5`, `b5527e7`): six decisions, each in §8 with the author's words: migrate the five supported edges; migrate-and-flag the impact-assessment edge; downgrade (keep, flag, cite both) the cloud/Data Act edge; remove the TFEU edge; carry `gdpr.legal_basis` to the next session; no flip, left to V2C-13.
- **W.3** (`01de1f0`, `9c90e1d`): `data/instruments.json` (`relationships` only) and the regenerated pages; W12 shrunk to `[]` and W12b added; `docs/CURRENT-ARCHITECTURE.md` §12 45 → 47 (the two flags). No summary, kind, status, date, claim or validator changed.
- **W.4:** the prompt of V2C-13.
- **Found, not fixed, not in scope:** `gdpr.legal_basis` is `["tfeu:art-114"]` against the GDPR's own visa (carried to V2C-13, decision 5).
- **Battery:** see the reading notes §7: validate 0 errors / 47 unverified; selftest 190/190; 25 suites and `.control-room/` 1496 tests with the existing skip; browser 361/0/1. **Correction after CI (16 Nov 2026):** the §12 count is pinned in TWO suites, `agent/health` and `agent/implement` (R6); the session re-ran only the first after moving §12 to 47, so CI failed `agent/implement` on 45 !== 47 (`db20231` moves the pin, as the test says to, with §12, and every suite was then re-run: all exit 0). The lesson: after changing a recorded baseline, re-run EVERY suite, not the one that failed. `agent/records/` absent after the batteries.
- **Branch register:** `claude/upbeat-thompson-yewfls`, disposition: the final checkpoint is approved (§8, 15 Nov 2026); on the author's answer ("Yes, open the PR"), a pull request to `main`, opened by the session and merged by the author with a merge commit. `claude/confident-johnson-yeffcv` (PR #115 merged), `claude/brave-goldberg-gm87jp` and `scout/digest-digest-2026-11-02T16-04-07Z` are as recorded. **`origin/scout/digest-digest-2026-11-09T16-29-04Z`** (one Source Scout commit, `89a08b8`, 9 Nov 2026) was in no register and no document: reported to the author at the start of the session and registered here as the scout's digest, not this session's, no disposition decided.

## V2C-21b — `eidas2`'s provisions (14 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, "The scope of the V2C-21b session" (the author's words "Start V2C-21b"), the four "W.2" rows and the "W.4" row. **Record:** `docs/V2C-21b-READING.md` (read it, not this entry).

- **W.1** (`b9ef3c2`): both OJ texts re-retrieved, byte-identical to 13 Nov; SPARQL set unchanged; **ten corrigenda have no English text and were not read**.
- **W.2** (`fa21331`): five new provisions (`art-5b`, `12b`, `19a`, `45`, `45f`), `art-5a` extended, `art-5f` corrected, all anchored.
- **W.3** (`352b863`): `data/instruments.json` (`eidas2` only) and the regenerated page. Rule, status, dates, `last_verified`, `dna.regulated_actor` and the A-8 warnings untouched.
- **W.4:** the prompt of V2C-12.
- **One finding against V2C-21:** 46a and 46b bind the Member State, not a public authority, so `actor:public-authority` rests on 45f(8) alone (annotated in the reading notes).
- **Battery:** see the reading notes §4; all as at the start, browser 361/0/1. `agent/records/` absent after the batteries.
- **Branch register:** `claude/confident-johnson-yeffcv`, disposition: on the author's answer ("Yes, open the PR (Recommended)"), a pull request to `main`, opened by the session and merged by the author with a merge commit. The final checkpoint is approved (§8, 14 Nov 2026). `claude/sweet-newton-58i6p3` (merged as #114, two later prompt commits brought in here) and `claude/brave-goldberg-gm87jp` and the two scout digests are unchanged and not this session's.

## Branch register — 14 November 2026 (V2C-21)

- `claude/sweet-newton-58i6p3`, from `main` `d67fb93`: `docs/` (`ROADMAP-v2.md` §8, `V2C-21-READING.md`, `prompts/v2-v2c-21b-eidas2-provisions.md`,
  this file) and `data/instruments.json` (`eidas2.dna.regulated_actor` only), `data/taxonomy.json` (three terms added), and what
  `tools/_footer.mjs` regenerated (`instruments/eidas2/index.html`, `datasets.html`). Disposition: on the author's answer ("Yes, open the PR
  (Recommended)"), pull request #114 (https://github.com/andreatosti2001/Eu-Digital-Policy/pull/114), opened by the session and not merged by it;
  merging is the author's, with a merge commit. The final checkpoint is approved (§8, 14 Nov 2026).
- Reported at the start, all already in this register and left alone: `claude/brave-goldberg-gm87jp` (one commit, `7e93f27`); the scout
  digests of 2 and 9 Nov 2026. Nothing else is unmerged.

## V2C-21 — `eidas2`'s regulated actors, read against the Articles (13–14 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, "The scope of the V2C-21 session" (`0a28b52`, the author's words "Start V2C-21 session"), and the
rows "V2C-21, V.2: …" (`4a5eb37`, `681ddd5`) and "V2C-21, V.4: …" (`4b98209`). **Record:** `docs/V2C-21-READING.md` — read it, not this entry.

**V.1, the reading** (`4957b0d`). Regulation (EU) 2024/1183 and Regulation (EU) No 910/2014 retrieved from Cellar by CELEX on 13 Nov 2026
(`Accept-Language: eng`), with the SPARQL endpoint: two amending acts (NIS2, whose Art. 42 — read — deleted Art. 19 from 18 Oct 2024; and
2024/1183) and twenty corrigenda, of which one has an English text (32024R1183R(02), read: it changes no addressee). Thirteen addressees
noted with their locators (§3, A1–A13).

**V.2, the decisions** (seven rows, all as recommended; one after "What do you suggest?"): `member-state`, `vlop`, `trust-service-provider`
stay; `public-authority` stays rebased on Arts 45f(8), 46a, 46b (not 5f(1), whose addressee is the Member State); `large-company` exits;
added: `relying-party`, `wallet-provider`, `web-browser-provider` (new terms) and `gatekeeper` (existing). The eID-means issuer is a declared
limit. The reading lives in the new terms' notes and the reading notes; `last_verified` stays 2026-10-27.

**V.3, the writing** (`61dd1a7`, with `Evidence:`). **V.4, the prompt** (`docs/prompts/v2-v2c-21b-eidas2-provisions.md`): provisions that
anchor each actor to an Article on the page, and `eidas2:art-5f.obligation_on` corrected.

**Found, and what was done about each:**
- **A premise of the prompt did not hold**: no instrument has a record-level `verification_note`; put to the author, who chose the term
  notes and `docs/`.
- **`eidas2:art-5f.obligation_on` is inexact** (`public-authority` for 5f(1), `large-company` for 5f(2)): a provision field, outside the
  prompt's files; named for V2C-21b, not written.
- **Six of the eight actors are bound by no provision shown on the page** (only `art-5a` and `art-5f` carry `obligation_on`): the
  reason for V2C-21b.
- **A comparison of mine proved nothing at first**: a filter matched no line of `evidence-audit`'s output, so "identical" was vacuous;
  redone on the full output against a worktree of `main`: 44 lines each, identical.
- **The suites created an empty `agent/records/`**; removed, nothing in it.

**Not established:** a consolidated version (none used); the other-language corrigenda; the implementing acts; whether a reader takes
"Relying party" or "Public authority" as the Regulation means them (the terms' notes say it; the page shows the labels).

**Battery on `ea32bad`** (the data and notes as committed): `validate` 0 errors · 5 warnings (the A-8 of `ap-eidas2-01`, as at the start);
`i18n-audit`, `design-qa`, `seo-audit` 0/0; `evidence-audit --as-of 2026-11-14` 0 errors, 11 warnings, output identical to `main`;
`freshness --as-of 2026-11-14` exit 0, 0 defects, 3 staleness prompts (as at the start); `selftest` 189/189; `commit-evidence origin/main
HEAD`: the one commit touching published files names its evidence; the 25 suites and `.control-room/` 1495 tests, 1494 pass, 0 fail,
1 skipped; `agent/schemas/cli.mjs check` exit 0; **browser suite (`--require-browser`) 361 pass, 0 fail, 1 undecidable** (`a11y:bound`, by design).

**Checklist**

| # | Item | Written | Verify by hand | Automatic test | Exit |
|---|---|---|---|---|---|
| V.1 | The reading | `docs/V2C-21-READING.md` §1–§5, `4957b0d` | fetch `http://publications.europa.eu/resource/celex/32024R1183` (Accept `application/xhtml+xml`, Accept-Language `eng`) and read Arts 5b, 5f, 12b, 45(1a) | none (a reading) | **met** |
| V.2 | The decisions | §8, `0a28b52`, `4a5eb37`, `681ddd5` | read the seven rows: the author's words, the options not chosen | none | **met** |
| V.3 | The data | `61dd1a7`: `eidas2.dna.regulated_actor`, three terms | `python3 -m http.server 8000`, open `/instruments/eidas2/` and `/instrument.html?id=eidas2`: "Who it binds" lists eight | `validate.mjs` resolves every term; `seo-audit` the regenerated page; browser suite | **met** |
| V.4 | The next prompt | `docs/prompts/v2-v2c-21b-eidas2-provisions.md`; §8 `4b98209` | read its exit criterion: it carries the standing rule | none | **met**, approved with the work at this checkpoint |

## Branch register — 13 November 2026 (the mobile tree)

- `claude/mobile-tree-contents`, from `claude/eager-euler-05ukz9` `52a1b2a`: pull request #113 (https://github.com/andreatosti2001/Eu-Digital-Policy/pull/113), opened by the session and not
  merged by it; its own commits on `main` `9eaa961`. Merging is the author's, with a merge commit.
- `claude/eager-euler-05ukz9`: **merged** (#112, `9eaa961`); nothing unmerged on it.

## The mobile tree opens the Contents panel, with the site's pages (13 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, "The mobile tree opens the Contents panel, and the panel lists the site's pages: the authorization and
the scope" (`cc6f290`): **Class D**, `docs/AUTONOMY-POLICY.md` prohibited action 19, authorized by the author by name in four answers, after a
phone screenshot of the Contents panel and the request «se ci clicchi apri questo con sotto anche le altre pagine possibili».

**What changed** (`0fed543`): `app.js` — below 640 px a tap on `#homeFig .hp-tree` (capture phase) opens the Contents panel instead of jumping,
the tapped part marked in the panel's tree and list (`.marked`, `aria-current`, cleared whenever the panel hides); at every width the panel
copies the Site index's columns before the instrument column ("Sections", "About this site") once the document is parsed — one home, no new
string. `style.css` — the mark (heavier ring and border, not hue alone) and the pages block. `agent/browser/home-checks.mjs` — the check
`home:phone-tree-contents`; `agent/browser/selftest.mjs` HOME 2 — a fifth planted defect. `docs/BROWSER-QA.md`. **Not changed:**
`js/home-figure.js`, `index.html` and the editions, `i18n/`, the data, the CSP.

**Found, and what was done about each:**
- **The first version copied no page**: `app.js` runs before the Site index in the markup. Found by the new check on the real site (0 links);
  the copy now waits for the document to be parsed.
- **HOME 2 could not have caught that**: it asserts only that the check fails on its planted defect, not that it passes on the real tree — the
  full browser run does that. Reported, not changed.
- **The first fix copied a third column**, "The brief in" (the editions), seen in a phone screenshot; the copy now stops at the instrument
  column, and the check pins the two labels.
- **The suites create an empty `agent/records/`** (gitignored) on every run; removed after each battery, nothing in it.

**Not established:** a finger on a real phone (the check is a synthetic click: no target size, no touch); any browser but Chromium; the
live site (nothing deployed before the merge).

**Battery on `0fed543`:** validators exit 0 (`validate` 0 errors · 5 warnings; `i18n-audit`, `design-qa`, `seo-audit` 0/0; `evidence-audit` and
`freshness --as-of 2026-11-13` exit 0); `commit-evidence origin/main HEAD` 24 commits, 0 without evidence; the 25 suites and `.control-room/`
1495 tests, 1494 pass, 0 fail, 1 skipped; **browser suite (`--require-browser`) 361 pass, 0 fail, 1 undecidable** (`a11y:bound`, by design;
360 before plus `home:phone-tree-contents`).

**Checklist**

| # | Item | Written | Verify by hand | Automatic test | Exit |
|---|---|---|---|---|---|
| 1 | Authorization and scope | §8 `cc6f290` | read the row: the author's words and four answers | none | before any published file: **met** |
| 2 | Tap opens the panel, part marked | `app.js` `0fed543` | on a phone (or a 390 px window): tap a node of the homepage tree; the panel opens with it marked; close; tap again in the panel to read | `home:phone-tree-contents`; HOME 2 | **met** |
| 3 | Pages under the contents | `app.js`, `style.css` `0fed543` | open Contents at any width: "Sections" and "About this site" under the list; on `/it/` the links are `../…` | `home:phone-tree-contents` | **met** |
| 4 | Desktop unchanged | — | at a wide window a tap on the figure's tree still jumps | `home:phone-tree-contents` (1440 × 900) | **met** |

## Branch register — 13 November 2026 (v2 Session 27)

- `claude/eager-euler-05ukz9`, from `main` `3627de6`: `docs/` only (`ROADMAP-v2.md` §8, `PHASE-5-SETUP.md` §9–§11, `prompts/v2-session-28.md`, `HANDOVER.md`). Disposition: on the author's answer ("Yes, open the PR (Recommended)"), pull request #112 (https://github.com/andreatosti2001/Eu-Digital-Policy/pull/112), opened by the session and not merged by it; merging is the author's, with a merge commit. Final checkpoint approved (§8).
- Reported at the start, all already in this register and left alone: `claude/brave-goldberg-gm87jp` (one commit, `7e93f27`); the scout
  digests of 2 and 9 Nov 2026. `origin/main` re-fetched before this line: `3627de6`.

## v2 Session 27 — Phase 5, the design: final checkpoint (27.3–27.5) (13 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, the rows of v2 Session 27 after "Checkpoint 27.2 … approved" (`62d19a7`): the ten "27.3: the X5-1
dispositions for …" rows (`faed082`, `dec0da9`, `306d3e1`), "27.4: the cases of the paper test" (`9214224`) and "27.5: the prompt of v2
Session 28" (`a09c222`). **Record:** `docs/PHASE-5-SETUP.md` §10 and §11 — read them, not this entry.

**27.3, the X5-1 table.** All 68 items (38 `depends_on`, 4 threshold keys, 26 exemptions) classified from the records by a scratch script
outside the repository, against stated criteria (§10.1), each with what it rests on and its E5-3 (b) status; put to the author **one question
per instrument**, ten questions: **every instrument as proposed**. Askable 22, askable by an existing question 2, evaluated 6, stays a stated
dependency 16, left 20, to Session 28 2. Nothing in `data/` changed; no Article read.

**27.4, the paper test.** Four cases chosen by the author (after asking "what do you suggest?"; two adjusted by tracing which rules fire):
an EU AI deployer, a non-EU cloud provider, a public authority deploying AI, a VLOP. Today and under the decided table, unanswered / yes / no
(§11.1). **No unanswered question produces a "no"**: the same rules fire and NOT DETERMINED is the same list as today in every case, and
an exhaustive sweep (17,301,372 evaluations) found 0 rules that stopped firing and 0 absences read as `unlikely` (§11.2). The input to block D
is §11.4.

**27.5, the prompt of Session 28.** `docs/prompts/v2-session-28.md`, in Italian: it starts after G2 and E5-5; 28.1 E5-3 as a check at ERROR
with a `selftest` case for each of §9.4's nineteen; 28.2 M-1 (with item 40), M-2, M-3, M-4 and §9.5's finding; 28.3 the prompt of Session 29.
Its exit criterion carries the standing rule.

**Found, and what was done about each:**
- **An explicit "no" can put an instrument into NOT DETERMINED** (cases 2 and 4): right by the site's rule, but the page says the same for
  "no rule covers you" and "your answer excluded the rule". **Named for Session 29's wording** (§11.3; D input 3).
- **Item 56 (NIS2 Art. 2(7)) was not exercised** by any chosen case.
- **`ap-dsa-02` answered yes reads higher than today** (`applies` against `likely`): today's `likely` is the unasked threshold's downgrade.
- **Four askable items need a scope reference before E5-3 (b) passes** (items 8, 36, 37, 60): rule changes in Session 29 (§10.4).
- **I named the one `unlikely` rule before checking it** in §11.2; checked after writing (`ap-dma-03`, `actor:sme`) and it was right. Two typos
  in §11 corrected (`343bc50`).
- **`agent/records/` appeared during the battery** — an empty, gitignored directory a suite created; nothing in it, nothing committed;
  removed by the session.

**Not established:** anything about the law; the page; that the scratch matcher is the one Session 29 builds; that the restatements are right.

**Battery on `a09c222`, 13 Nov 2026:** `validate` 0 errors · 5 warnings; `i18n-audit`, `design-qa`, `seo-audit` 0/0; `evidence-audit --as-of
2026-11-13` exit 0 (11 warnings, as at the start); `freshness --as-of 2026-11-13` exit 0, 0 defects, 3 staleness prompts (time, not this branch);
`agent/schemas/cli.mjs check` exit 0; `commit-evidence origin/main HEAD` 17 commits, 0 without evidence, none changes a published file; **the 25
suites and `.control-room/`: 1495 tests, 1494 pass, 0 fail, 1 skipped** (`.control-room`, as before; `tools/selftest.mjs` 189/189). **The browser
suite was not run**: nothing outside `docs/` changed, and the prompt asks for the 25 suites. `agent/records/` absent after removal.

**Checklist**

| # | Item | Written | Verify by hand | Automatic test | Exit criterion |
|---|---|---|---|---|---|
| 27.1 | The premises | §8 scope `25c3087` | read the scope row; `docs/PHASE-5-SETUP.md` §7 and §8's 25.4 and 25.5 rows exist | none | rows present, verified with no question: **met** |
| 27.2 | E5-3 | `docs/PHASE-5-SETUP.md` §9 `3b1d80a`; §8 q1 `c98998e`, q2 `a668e00`, q3 `e46e369`, q4 `fdc6f6f`, q4b `164ff6f`; approval `62d19a7` | read §9.2: each clause has a rule, planted cases, what it cannot see | **none in the repository** — the scratch prototype (19/19) is not committed; the check is Session 28's | written with its planted cases and approved in §8: **met** |
| 27.3 | The X5-1 table | §10 `379e8ee`, decided `306d3e1`; §8 `faed082`, `dec0da9`, `306d3e1` | §10.7 has rows 1–68; §10.2 sums to 68 | none | dispositions decided per instrument: **met**; approved with this checkpoint |
| 27.4 | The paper test | §11 `b09223d`, `343bc50`; §8 `9214224` | read §11.1–§11.2 | none (computed in the scratchpad) | done; no unanswered question produces a "no"; outcome to D (§11.4): **met** |
| 27.5 | Session 28's prompt | `docs/prompts/v2-session-28.md`, §8 `a09c222` | its exit criterion carries the standing rule (line near «il prompt della sessione 29 esiste su questo branch») | none | exists on this branch, carries the rule: **met**; approved with the work |
| — | Untouched | — | `git diff origin/main --stat -- data tools js i18n agent css index.html it fr es instruments prototypes .github style.css app.js README.md LICENSE` is empty | `commit-evidence` | nothing outside `docs/` changed: **met** |

**For the next session:** **the V2C-21 session** (Track R, `eidas2`'s regulated actors), on `docs/prompts/v2-v2c-21-eidas2-actors.md`, before
12 Jan 2027 (§8, "The next session … V2C-21", "The prompt of the V2C-21 session"); then **v2 Session 25** (12 Jan–2 Feb 2027) and Session 26.
**G2 is open and Phase 5 is opened** (§8, "G2: Stage 3 is opened, and with it Phase 5"), with E5-5 failing and stated: **v2 Session 28**
runs only after the readings. The final checkpoint is **approved** (§8).

## v2 Session 27 — Phase 5, the design: checkpoint 27.2 (13 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, "The scope of v2 Session 27 (Phase 5, the design)" (the author's "start session 27 v2", `25c3087`) and
"v2 Session 27, 27.2 question 1" (`c98998e`), "question 2" (`a668e00`), "question 3" (`e46e369`), "question 4" (`fdc6f6f`), "question 4b"
(`164ff6f`). Prompt: `docs/prompts/v2-session-27.md` with its PV2-05 note (C is selected; the paper test's outcome goes to block D).
**Record:** `docs/PHASE-5-SETUP.md` §9 (`3b1d80a`) — read it, not this entry.

**27.1, the premises, verified — no question.** `main` `3627de6` holds `docs/PHASE-5-SETUP.md` ("APPROVED BY THE AUTHOR ON 4 NOV 2026 … PHASE 5
IS PLANNED AND NOT OPENED", the answers in §7: P-A depth, P-B design before and changes after, P-C from 27, P-D no agent proposals), §8's
"v2 Session 25, 25.4 question 1" … "question 7" and "25.4: the prompt of v2 Session 27", `docs/prompts/v2-session-25.md`, this session's
prompt, `docs/SESSION-ARCHITECTURE.md` with §8's "25.5 question 1" … "question 4" and "G1: Stage 2 is opened". Date measured 13 Nov 2026:
before 12 Jan 2027 (Track M; Session 25's window not open) and 9 Mar 2027 (the grant's expiry — **flagged, not renewed**). The clone was
shallow and was unshallowed before any suite. `git branch -r --no-merged origin/main`: only branches already in the register.

**The starting state, re-measured** (scratch parser outside the repository): **identical to 4 Nov 2026** — 33 rules, all `last_verified`
2026-11-04, 25 with `attestation`; actor 44 terms, activity 22, territory 3; outcomes applies 13, likely 9, possible 10, unlikely 1 (the 19
likely + possible all with `depends_on`); 38 `depends_on` items on 25 rules (14 rules with one, 9 with two, 2 with three); 4 threshold keys
on 3 rules; 26 exemptions on 20 rules, 10 `excludes` and 16 `narrows`, none evaluated. `freshness --as-of 2027-02-03`: 33 `RULE_STALE`, as
expected (the readings of Sessions 25 and 26 not done).

**27.2, the standard, in five answers** (§8): (1) written in `docs/PHASE-5-SETUP.md`, §9, with the table as §10 and the paper test as §11;
(2) the citation clause binds **new triggers only** — new dimensions, thresholds, evaluated exemptions, told apart by field and name, no
list; (3) an evaluated `excludes` removes the rule **on an explicit answer only**, an evaluated `narrows` never changes the result; (4) one
mechanism: an unanswered question or "don't know" **downgrades one step and the rule fires**, a rule whose dependency becomes askable is
restated one step up; (4b) it stands for multi-item rules.

**What §9 says:** four clauses — (a) a new question resolves to a provision; (b) every answer that can change an outcome cites a tier-1 text
`for: scope`, direct, at its Article; (c) an evaluated exemption has a tier-1 direct basis, an evaluable effect and a `when` of explicit
answers; (d) six properties of the matcher, run over the records, that make an absence unable to narrow a result — each with the exact rule,
its planted cases and what the check cannot see. **19 of 19 planted cases as intended** against a scratch prototype (§9.4).

**Found, and what was done about each:**
- **My example for question 4 was simplified** (`ap-gdpr-04` has three `depends_on` items, not one). Said to the author after the answer,
  recorded in the row's text, and put as question 4b; the answer stands.
- **6 provisions of the Phase 3 dimensions on 5 rules would fail clause (b)** (`ap-gdpr-02`, `ap-gdpr-03`, `ap-dsa-02`, `ap-ai-act-05`,
  `ap-eidas2-01`): **recorded and named for Session 28** (§9.5), not closed.
- **`ap-dma-01`'s `excludes` (SMEs) rests directly only on a tier-2 Commission report**: under (c) it cannot be evaluated as it stands.
- **The first prototype missed a `narrows` that downgrades on an explicit answer**; property (6) added, then 19 of 19.
- **The real matcher cannot be called by a Node check** (`js/applies.js` boots against `document` on import; `evaluate()` reads the
  module-level `IX`), and **`tools/validate.mjs` refuses a new dimension in `condition_provisions` and a `when` key**: both named for
  Sessions 28 and 29 (§9.6).

**Not established:** anything about the law (no Article read); the page (X5-3, Session 29); that the scratch prototype is the check
(Session 28 re-measures).

**Battery on `3b1d80a`, 13 Nov 2026:** `validate` 0 errors · 5 warnings; `i18n-audit`, `design-qa`, `seo-audit` 0/0; `evidence-audit --as-of
2026-11-13` exit 0; `freshness --as-of 2026-11-13` exit 0, 0 defects, 3 staleness prompts (time, not this branch); `node --test
tools/selftest.mjs` **189/189**; `commit-evidence origin/main HEAD` 7 commits, none changes a published file; `git diff origin/main --stat`:
`docs/PHASE-5-SETUP.md`, `docs/ROADMAP-v2.md` only. `agent/records/` absent.

**Waiting for:** the author's approval of checkpoint 27.2, recorded in §8. Then 27.3 (the X5-1 table, one question per instrument).

> The header PV2-05 wrote, kept as written:
>
> **Last updated:** 13 November 2026 (UTC), PV2-05 (Post-v2 C, the Hybrid prototype and the selection), at its final checkpoint.
> **Branch:** `claude/pv2-05-start-jrurwd` (assigned by the environment), from `main` `a6b609d` (#110). `origin/main` re-fetched immediately before this write: `a6b609d`, unchanged.
> **Read first:** **C is selected — the Hybrid to D, the combination (the Hybrid's layout with the observatory's 3D network) to PV2-08** (§8). Nothing of it is on the published site. The final checkpoint is **approved** (§8, "Final checkpoint of PV2-05 approved"). The entries below this session's are unchanged.
>

## Branch register — 13 November 2026 (PV2-05)

- `claude/pv2-05-start-jrurwd`, from `main` `a6b609d`: `docs/` (`ROADMAP-v2.md` §8, `HANDOVER.md`, `PROTOTYPES.md` §3, the dated note in
  `docs/prompts/v2-session-27.md`) and the unpublished `prototypes/hybrid/`. Disposition: on the author's answer ("Yes, open the PR (Recommended)"), pull request #111 (https://github.com/andreatosti2001/Eu-Digital-Policy/pull/111), opened by the session and
  not merged by it; merging is the author's, with a merge commit.
- Reported at the start, all already in this register and left alone: `claude/brave-goldberg-gm87jp` (one commit, `7e93f27`); the scout
  digests of 2 and 9 Nov 2026. `origin/main` re-fetched before this line: `a6b609d`.

## PV2-05 — Post-v2 C, the Hybrid prototype and the selection: final checkpoint (C.2–C.6) (13 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, PV2-05's rows of 13 Nov 2026 (scope, C.1 questions 1–2, "Checkpoint C.1 of PV2-05 approved", "the
author's first look", the three C.5 rows, "PV2-05: the next session"). **Record:** `docs/PROTOTYPES.md` §3 — read it, not this entry.
**Without the homepage view** (in production since HP-04).

**What happened.** C.1: the Hybrid explorer flat and table-led; the comparison view by view; approved. C.3: `prototypes/hybrid/` (`a5eca14`)
— the Editorial's article module and the observatory's regulation and timeline modules loaded **whole** (one home each), one stylesheet, and a
flat explorer (rings by `coverage()`, numbered nodes keyed to the table); shown in screenshots, sent to C.4 as built. C.4: measured and 27
planted cases (§3.2–§3.5). C.5: the three directions view by view and the two explorers on five interactions, no recommendation; the author
answered with a combination — **the Hybrid's layout with the observatory's 3D network in its box, and "enlarge"** — had it built now
(`6fdc311`, §3.6: re-measured, 29 planted cases) and made it **final: the Hybrid to D, the combination to PV2-08**. C.6: the next session is
**S27**, its prompt carrying a dated note (C selected; S27's outcome goes to D).

**Found, and what was done about each:**
- **The observatory's legend filter hides nothing in its canvas**: the filter sets `.off`, `observatory.css` has no rule for it (11 of 11
  "Defers to" edges still drawn); PV2-04's E5 counted the class. **Recorded, not repaired** (the author's answer); the Hybrid carries the rule.
- **This session's cpl reads lower than PV2-03's and PV2-04's published figures** (characters ÷ rendered lines): the three were compared on
  this script's reading; §1–§2 are not rewritten.
- **In the Hybrid's box** the label "GDPR Procedural Regulation" runs past the edge, and grouped by part 1 of 39 instruments starts outside it.
- **The theme choice is stored per module** in the Hybrid (the article under the Editorial's key, the rest under the observatory's).
- **The Hybrid depends on both other prototype folders**; removing either breaks it.

**Shrunk under the stopping rule:** in the flat explorer (`a5eca14`) zoom and pan, re-layout, free-text search and a selectable grouping; the
combination restored all of them, being the observatory's module. Nothing of the core was shrunk.

**Not established:** a screen reader; contrast inside the SVG; performance on a slow device; other browsers; languages; whether any direction
reads well — the author's eye, recorded in §8. **This decision does not open G2.**

**Battery on `254c55c`, 13 Nov 2026:** `validate` 0 errors · 5 warnings; `i18n-audit`, `design-qa`, `seo-audit` 0/0; `evidence-audit --as-of
2026-11-13` exit 0; `freshness --as-of 2026-11-13` 0 defects, 3 staleness prompts (time, not this branch); `agent/schemas/cli.mjs check` 18 of 18;
`commit-evidence origin/main HEAD` 13 commits, none changes a published file; **the 25 suites and `.control-room/`: 1495 tests, 1494 pass, 0 fail,
1 skipped** (`.control-room`, no IPv6 loopback; `tools/selftest.mjs` 189/189); **browser suite (`--require-browser`): 360 pass, 0 fail, 1
undecidable** (`a11y:bound`, by design; it does not cover `prototypes/`). `agent/records/` absent. The worker restarted several times; after each,
`git status` was clean and nothing was redone; the local HTTP server was restarted twice.

**Checklist**

| # | Item | Written | Verify by hand | Automatic test | Exit criterion |
|---|---|---|---|---|---|
| — | Premises | §8 scope `d45a8bd`; C.1 report `2f0b1b2` | read the rows; `node tools/pages-artifact.mjs list` does not list `prototypes/` | none | PV2-04's final approval in §8 before the start: **met** |
| C.1 | The Hybrid explorer; the comparison's form | §8 `d3be3af`, `e1329b1`; approval `3a86a74` | read the rows | none | answers in §8 in the author's words: **met** |
| C.2 | The grid | no anchor or weight changed | `docs/PROTOTYPES.md` §3.3 | none | grid unchanged: **met** |
| C.3 | The Hybrid | `prototypes/hybrid/` `a5eca14`, then the combination `6fdc311`; §8 `2acdca7`, `9746e9a` | `python3 -m http.server 8000`; open `/prototypes/hybrid/`, `regulation.html?id=chips-act`, `timeline.html?instrument=chips-act`, `timeline.html?mode=network`; "Enlarge the network"; a 390 px window; the theme | none in the repository (scratch planted cases: 27/27 on `a5eca14`, 29/29 on `6fdc311`) | three views, two widths, two themes, empty and missing states, the explorer with the table as its alternative: **met** |
| C.4 | The measurement | `docs/PROTOTYPES.md` §3 `0eae5e3`, §3.6 `6fdc311` | re-run M1–M8 from `docs/FRONTEND-REFERENCES.md` §4 | none committed — **a gap**, as in PV2-03 and PV2-04 | same measures and cases; what is not seen, said: **met** |
| C.5 | The comparison and the decision | §8 `2271205`, `9746e9a`, `812ec07` | read "PV2-05, C.5: the author's explicit decision" | none | shown view by view; the author's decision in §8 in the author's words: **met** |
| C.6 | The next prompt | `docs/prompts/v2-session-27.md` (dated note), §8 "PV2-05: the next session" `254c55c` | the note under the title; the exit criterion's standing rule (line near «il prompt della sessione successiva») | none | exists on this branch, carries the rule; approved with the work: **met** |
| — | Untouched | — | `git diff origin/main --stat -- prototypes/editorial prototypes/observatory prototypes/homepage data js css tools index.html it fr es instruments i18n agent .github style.css app.js` is empty | `commit-evidence` | nothing of the baseline, the other prototypes, the data, the models, the CSP or `tools/pages-artifact.mjs` changed; nothing of a third party entered: **met** |

**For the next session:** **v2 Session 27**, on `docs/prompts/v2-session-27.md` with its PV2-05 note — S27's outcome goes to block D. G2 is not open.

## PV2-05 — Post-v2 C, the Hybrid prototype and the selection: checkpoint C.1 (13 Nov 2026)

**Authority:** `docs/ROADMAP-v2.md` §8, "The scope of PV2-05" (the author's "Start pv2-05", `d45a8bd`), "PV2-05, C.1 question 1" (`d3be3af`) and "PV2-05, C.1 question 2" (`e1329b1`). Prompt: `docs/prompts/v2-pv2-05-prototype-hybrid-selection.md` with its notes of 12 and 13 Nov 2026 — **the homepage view is out** (in production since HP-04): three views are built and compared.

**The premises, verified.** §8 holds "G1: Stage 2 is opened", PV2-03's rows to "The reworked Editorial approved, look A", PV2-04's rows to "PV2-04, C.5 questions 1–3" and **"Final checkpoint of PV2-04 approved"**, and HP-04's "C.2 not performed" and "the next session". `main` `a6b609d` holds `prototypes/editorial/`, `prototypes/observatory/`, `docs/PROTOTYPES.md` §2 and the prompt. Date measured 13 Nov 2026: before Track M (12 Jan 2027) and the grant's expiry (9 Mar 2027). The clone was shallow and was unshallowed. `node tools/pages-artifact.mjs list` does not list `prototypes/`; `tools/pages-artifact.mjs` is not touched. The worker restarted twice during C.1; `git status` was clean each time and nothing was redone.

**The two answers** (§8): (1) the Hybrid's Explorer is **flat and table-led** — the relationships table leads, the map beside it is 2D SVG with the instruments on concentric rings by `coverage()` (covered inside, then mapped, watched, excluded), placed by `brief_part` then id, nothing moving or rotating; (2) C.5 runs **view by view** — the three prototypes side by side per view at 1280 light, 1280 dark and 390 px with that view's measures, then the steps C1…C6, then the two Explorers on five interactions, then the decision.

**The data, re-measured on `a6b609d`:** 39 instruments, 40 relationships (9 symmetric), 8 instruments in none (`gdpr-procedural`, `chips-act`, `ai-liability-directive`, `charter`, `vida`, `eaa`, `psd3`, `psr`), `brief_part` null on 24, 10 kinds in use; 101 events; 187 claims; 21 enforcement records — as in PV2-04's table.

**Battery on `e1329b1`, 13 Nov 2026:** `validate` 0 errors · 5 warnings; `i18n-audit` 0/0; `design-qa` 0/0; `evidence-audit --as-of 2026-11-13` exit 0, 0 errors; `freshness --as-of 2026-11-13` exit 0, 0 defects, 3 staleness prompts (time, not this branch); `seo-audit` 0/0; `node --test tools/selftest.mjs` **189/189**; `commit-evidence origin/main HEAD` 3 commits, none changes a published file. `agent/records/` absent.

**Waiting for:** the author's approval of C.1, recorded in §8. Then C.2–C.3 begin in `prototypes/hybrid/`.
