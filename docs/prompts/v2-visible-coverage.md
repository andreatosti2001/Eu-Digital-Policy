<!--
Provenance: drafted on 22 Nov 2026 in the rebalancing session, on `claude/rebalance-housekeeping`, from `main` `a61b99d`, on the author's
answers of that day (docs/ROADMAP-v2.md §8, "Rebalancing the sessions"). The figures below were measured on `a61b99d`: 44 instrument records,
17 with a page under `instruments/`; 15 glossary terms; the it, fr and es editions cover the brief only, each with 0 of 431 strings reviewed
(`i18n/review/*.json`), so all three are `noindex` (docs/SEO-OPERATIONS.md §6). **Nothing was read from any legal text for this prompt**: no
status, date or provision is asserted here. It records no §8 row of its own. Written in Italian. The author may change it before use.
-->

SESSIONE VISIBILE — la copertura: pagine degli istrumenti, glossario, edizione italiana

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`). Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`.
Lavora sul branch assegnato. **Come prima scrittura**, registra in §8 la riga «The scope of the coverage session» con le parole dell'autore.

Leggi: `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0, §2 e §3 (perché un agente non approva una traduzione);
`docs/SEO-OPERATIONS.md` §1 (la tabella delle rotte: i record «thin» sono `noindex`) e §6 (le edizioni); `tools/seo.mjs` (come si decide se
un istrumento ha una pagina); `docs/DATA-GOVERNANCE.md`; `docs/SOURCE-POLICY.md`.

## Il punto di partenza (misurato il 22 novembre 2026 su `a61b99d`; **rimisura tutto**)

- **Istrumenti senza pagina (27):** `gdpr-procedural`, `dga`, `eprivacy`, `eidas`, `cloud-ai-development-act`, `ecommerce-directive`, `nis1`,
  `chips-act`, `ai-liability-directive`, `charter`, `tfeu`, `teu`, `vida`, `avmsd`, `copyright-dsm`, `gpsr`, `eaa`, `p2b`, `ttpa`, `mica`,
  `psd3`, `psr`, `eecc`, `berec-regulation`, `rspp-decision`, `open-internet-regulation`, `radio-spectrum-decision`. Una pagina non manca per
  caso: `tools/seo.mjs` la genera solo per un record abbastanza ricco. Colmare la distanza è **lavoro sui dati**, non sui template.
- **Glossario:** 15 termini (`data/glossary.json`).
- **Edizioni:** it, fr, es coprono solo la brief; 0 stringhe su 431 riviste in ciascuna, quindi tutte `noindex`.

## Obiettivo

- **C.1 · La scelta, all'autore.** Per ogni istrumento senza pagina, che cosa gli manca per averne una (misurato con `tools/seo.mjs`, non
  stimato). Proponi **al massimo tre istrumenti** per questa sessione, raccomandazione per prima (criteri: quanto spesso la brief li nomina,
  quanto sono vicini a una scadenza, quanto poco manca). Una domanda per decisione; risposte in §8.
- **C.2 · La lettura.** Per i tre istrumenti scelti, il testo letto da Cellar per CELEX (SHA-256 per documento), nulla da memoria; ciò che non
  si legge non si scrive e si dichiara. I record si arricchiscono solo con ciò che la lettura regge, e la pagina nasce da `tools/_footer.mjs`.
- **C.3 · Il glossario.** Proponi all'autore i termini che la brief usa senza voce (misurati sul testo, con le occorrenze); ogni definizione
  nuova cita la sua fonte primaria letta.
- **C.4 · L'edizione italiana.** **Un agente non approva una traduzione.** Genera il foglio (`node tools/i18n-review.mjs sheet it`) e
  consegnalo all'autore, che lo rivede di persona e registra la revisione con `node tools/i18n-review.mjs record it --by "<nome>"`. Quando le
  431 stringhe sono riviste, `seo-audit` deve mostrare `/it/` con canonical, sitemap e hreflang; misuralo. fr ed es restano `noindex` finché un
  lettore che conosce la lingua non le rivede.
- **C.5 · Il prompt della sessione successiva** (manutenzione o prove, per la regola del 22 novembre 2026). Il checkpoint finale approva insieme
  il lavoro e il prompt.

**Regola d'arresto**: una pagina che direbbe più di quanto il record regge non si pubblica. Un controllo rosso si nomina e si decide.

## Scrivere e verificare

`data/` dopo la sua riga di §8; ogni commit che tocca un file pubblicato porta `Evidence:`. Prima del checkpoint: `validate`, `i18n-audit`,
`design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`, `node --test tools/selftest.mjs`,
`node tools/commit-evidence.mjs <base> HEAD`, le 25 suite e `.control-room/`, la suite del browser (in background; non scrivere nell'albero
mentre gira).

## Cosa NON fare

Non scrivere una traduzione né approvarla. Non allentare il criterio che decide se un istrumento ha una pagina per fargliela avere. Non
aggiungere una fonte senza averla letta. Non rinominare un ID. Non abbassare gate, validator o test. Non toccare licenza, non affiliazione,
assenza di consulenza legale, README. Vale «Cosa NON fare» del brief.
