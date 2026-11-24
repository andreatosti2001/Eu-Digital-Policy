<!--
Provenance: drafted on 24 Nov 2026 in the coverage session, on `claude/visible-coverage`, from `main` `74eb2cd`, on the author's answers of
that session (docs/ROADMAP-v2.md §8, the rows of 23–24 Nov 2026 «The scope of the coverage session», «Coverage, C.1», «Coverage, C.2 and
C.3: the reading cannot be done in this session»). The coverage session could not reach Cellar (`publications.europa.eu`: the name does not
resolve over HTTP, the proxy refuses the tunnel with 403 over HTTPS) and the author chose to reopen in an environment that reaches it.
**Nothing was read from any legal text for this prompt**: no status, date, objective or provision is asserted here. Written in Italian. The
author may change it before use.
-->

SESSIONE VISIBILE — la copertura, seconda parte: la lettura (C.2) e il glossario (C.3)

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`). Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`.

**Prima di ogni altra cosa, misura che Cellar risponda** da questo ambiente:

```
curl -sL -o /tmp/probe -w "%{http_code}\n" -H "Accept: application/xhtml+xml" -H "Accept-Language: eng" \
  http://publications.europa.eu/resource/celex/32025R2518
```

Se non risponde, **fermati e dillo all'autore**: è la ragione per cui questa sessione esiste. Non leggere da un riassunto, da una copia in cache,
da una riproduzione privata o da memoria.

Lavora sul branch assegnato. **Come prima scrittura**, registra in §8 la riga «The scope of the coverage reading session» con le parole
dell'autore.

Leggi: `docs/prompts/v2-visible-coverage.md` (il prompt di cui questa è la continuazione; vale tutto ciò che dice per C.2 e C.3);
`docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0, §2, §3 e §6; `docs/SOURCE-POLICY.md` §8 (la rotta di Cellar);
`docs/DATA-GOVERNANCE.md`; `js/routes.js` (il gate a sette criteri: `tools/seo.mjs` chiede a lui); `tools/register-audit.mjs` M-05; il commit
`061c226` (item 2.2: come `eidas2` ha avuto `dna.objective` in bozza, approvata dall'autore).

## Il punto di partenza (misurato il 23–24 novembre 2026 su `74eb2cd`; **rimisura tutto**)

- **44 record, 17 con pagina, 27 senza.** Gli 11 *excluded* o *watched* non possono avere pagina (M-05; il brief); TFEU, TEU e Charter non
  passano `not-treaty`.
- **I tre scelti dall'autore (§8, «Coverage, C.1», «Tutti e tre»)**, con i criteri del gate che mancano:
  - `gdpr-procedural` (CELEX `32025R2518`): `explanation` (`dna.objective`). Fonti già nel record: `src-eurlex-gdpr-procedural`,
    `src-eucrim-gdpr-procedural-2026`.
  - `eprivacy` (CELEX `32002L0058`): `explanation` e `dates` (nessun milestone in `timeline.json`). Fonti: `src-eurlex-eprivacy`,
    `src-cjeu-c623-17`.
  - `cloud-ai-development-act` (COM(2026) 502; nessun CELEX nel record): `identity` e `explanation`. Fonti: `src-council-cloud-ai-act-2026`,
    `src-ec-tech-sovereignty-2026`. **Il CELEX si scrive solo se letto** nei metadati del Publications Office; non si deduce dal numero COM.
- **Il brief li nomina** (testo di `index.html`, senza script e stili): Regolamento (UE) 2025/2518 2 volte (Part II e la timeline);
  «ePrivacy» 6; «Cloud and AI Development Act» 2 (Part X).
- **C.3, misurato sul testo del brief, termini senza voce nel glossario (15 termini, quasi tutte sigle)**: «systemic risk» 14 (esiste
  `gl-dsa-art-34`: dire all'autore se coincide), «high-risk» 13, DPC 9, EDPB 8, EDPS 7, «delegated act» 7, «ex ante» 5, «conformity
  assessment» 4, «harmonised standard» 4. È una misura di frequenza, non una proposta: rimisurala e proponi all'autore.
- **C.4 è chiuso dalla sessione precedente**: il foglio `docs/i18n-review/it.md` (24 nov 2026, 429 stringhe da rivedere) è dell'autore. Due
  stringhe sono non tradotte (`part-4.p2`, `part-4.p4`, ritirate da F-18 il 17 nov 2026): finché una persona non le scrive, `/it/` non arriva a
  431/431. **Non scriverle.** Se l'autore ha registrato una revisione nel frattempo, misurala con `node tools/i18n-review.mjs status` e
  `seo-audit` e dillo.

## Obiettivo

- **R.1 · La lettura.** Per i tre istrumenti, il testo letto da Cellar per CELEX (SHA-256 per documento, in un file di note di lettura sotto
  `docs/`), nulla da memoria; ciò che non si legge non si scrive e si dichiara. Per ogni criterio del gate che manca, ciò che il testo regge.
- **R.2 · Le decisioni.** Ogni `dna.objective` all'autore in bozza (al massimo due bozze, raccomandazione per prima), con l'articolo da cui
  viene; per `eprivacy` l'evento di timeline e la sua data; per il Cloud Act il CELEX. Una domanda per decisione; risposte in §8.
- **R.3 · La scrittura.** `data/` dopo la sua riga di §8; le pagine nuove generate da `tools/_footer.mjs`, solo per i record che il gate
  ammette; `instruments.html` e `sitemap.xml` rigenerati. Un record che non arriva al gate resta senza pagina, ed è detto.
- **R.4 · Il glossario (C.3).** I termini proposti all'autore con le occorrenze rimisurate; ogni definizione nuova cita la sua fonte primaria
  letta.
- **R.5 · Il prompt della sessione successiva** (manutenzione o prove, per la regola del 22 novembre 2026). Il checkpoint finale approva insieme
  il lavoro e il prompt.

**Regola d'arresto**: una pagina che direbbe più di quanto il record regge non si pubblica. Un controllo rosso si nomina e si decide.

## Scrivere e verificare

Ogni commit che tocca un file pubblicato porta `Evidence:`. Prima del checkpoint: `validate`, `i18n-audit`, `design-qa`, `register-audit`,
`evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`, `node --test tools/selftest.mjs`,
`node tools/commit-evidence.mjs <base> HEAD`, tutte le suite e `.control-room/`, la suite del browser (in background; non scrivere nell'albero
mentre gira). Un `selftest` che fissa il numero delle pagine o dei record si sposta solo perché il mondo è cambiato, e lo si dice.

## Cosa NON fare

Non scrivere una traduzione né approvarla. Non allentare il gate perché un istrumento abbia una pagina. Non dare una pagina a un record
*excluded* o *watched*. Non aggiungere una fonte senza averla letta. Non rinominare un ID. Non abbassare gate, validator o test. Non toccare
licenza, non affiliazione, assenza di consulenza legale, README. Vale «Cosa NON fare» del brief.

## Criterio di uscita e consegna

Completa quando: le pagine nuove esistono solo per i record che la lettura regge, generate da `tools/_footer.mjs`, e ciò che non si è letto è
dichiarato; le decisioni R.2 e R.4 sono in §8 con le parole dell'autore; validatori, `selftest`, le suite, `.control-room/` e il browser passano
e ogni avvertimento nuovo è spiegato; **il prompt della sessione successiva esiste sul branch, porta questa stessa regola nel suo criterio di
uscita ed è approvato con il lavoro; senza il prompt non si approva.** Oppure l'autore decide di fermarsi: anche allora si scrive il prompt
della successiva.

**La Traccia M ha la precedenza alle sue tappe** (`docs/SESSION-ARCHITECTURE.md` §1). Rimisura la data prima di iniziare: dal 25 dicembre 2026
`evidence-audit` stampa `STATUS_PREDATES_MILESTONE` per `eidas2` (e prima per `ai-act` e `pld`); gli stati alle tappe sono della sessione 25,
25.2 (`docs/prompts/v2-session-25.md`). Se la finestra della 25 (dal 12 gennaio 2027) si apre mentre questa sessione è in corso, dillo
all'autore. `ap-eidas2-01` scade il 21 febbraio 2027, `ap-dma-01` il 16 febbraio, le altre 30 regole il 17 febbraio
(`docs/prompts/v2-track-m-rules-round-2027-02.md`). Nessuno dei tre istrumenti ha regole in `data/applicability.json` né tappe della Traccia M
(misurato il 23 nov 2026): rimisuralo.

Prima di chiudere, la checklist R.1–R.5: cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
