<!--
Provenance: written on 26 Nov 2026 in documentation session D5 (`docs/ROADMAP-v2.md` §8, «The scope of the documentation session D5»), on
`claude/dreamy-gates-cswf5y`, from `main` `4fa7f92` (#142 merged), as D5's item D5.3 (`docs/prompts/v2-docs-handover.md`) and under the
standing rule of 4 Nov 2026 (the next session's prompt). It carries the plan's row for D6 (`docs/DOCS-SIMPLIFICATION-PLAN.md` §2), the
author's decision «How much moves» (§1, 25 Nov 2026) and D5's rows of 26 Nov 2026. Every figure below was measured by D5 on its branch with
a script kept outside the repository; **rimisura tutto**. Nothing was read from any legal text for this prompt. Written in Italian, like
D1's to D5's. Approved, or not, with D5's work at its final checkpoint.
-->

SESSIONE D6 (programma di semplificazione della documentazione) — i record chiusi in un percorso d'archivio, ogni riferimento nello stesso
commit; la misura finale del piano (§5)

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`: `tools/docs-check.mjs` verifica i commit citati sulla linea first-parent di `main`). Esegui
`git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`.

**Controlla che D5 sia approvata e su `main`**: la riga di §8 «Final checkpoint of the documentation session D5» e il merge del suo branch
(`claude/dreamy-gates-cswf5y`). Se il branch non è su `main`, chiedi all'autore se fonderlo prima o partire dal branch: il brief, «Non
implementare nulla prima che la sessione precedente sia stata approvata».

**La Traccia M ha la precedenza alle sue tappe, e una è vicina.** Rimisura la data prima di iniziare: `evidence-audit --as-of <oggi>` stampa
`STATUS_PREDATES_MILESTONE` dopo le tappe di `ai-act` (2 dic 2026), `pld` (9 dic) ed `eidas2` (24 dic) — misurato da D5 il 26 nov 2026: 0
righe. **Se una tappa è passata, dillo all'autore prima di iniziare**: decide lui se la sessione 25, 25.2 (`docs/prompts/v2-session-25.md`)
viene prima.

Lavora sul branch assegnato dall'ambiente. **Come prima scrittura**, registra in §8 la riga «The scope of the documentation session D6» con
le parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo. Senza quella riga non si scrive
nulla.

Leggi, e trattali come vincolanti: `docs/DOCS-SIMPLIFICATION-PLAN.md` (§1: «Solo i record chiusi»; §2, la riga D6: che cosa fa e che cosa
non fa; §4, le regole di ogni sessione — **niente `data/`, niente `i18n/`, niente testo del brief**; §5, i dodici punti che D6 misura;
§6, i rischi); `docs/DOCUMENTATION-ARCHITECTURE.md` §1 (`historical`), §3 (i tipi; **un record chiuso cambia solo con una nota datata che
tiene le parole vecchie**) e §5 (l'archivio non porta l'intestazione); `docs/README.md` §1 (le righe di ogni record e le due dell'archivio),
§2 e §4; `docs/DOCS-DEPENDENCY-MAP.md` (il metodo; è un'istantanea, le sue cifre no); `agent/proposals/governance/patterns.mjs` (le
ancore); **`tools/docs-check.mjs`** (CAT, HDR, CLOSED, LINK, POINTS, PATH, ANCHOR, PIN, TOTAL, SKILL) e `tools/docs-check-selftest.mjs`;
`docs/ROADMAP-v2.md` §8, le righe di D5 del 26 nov 2026 e la riga «Rebalancing the sessions» del 22 nov 2026; `docs/BRIEF-v2.md` «Cosa NON
fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §3.

## Il punto di partenza (misurato da D5 il 26 novembre 2026; **rimisura tutto**)

- **Il catalogo**: 148 documenti con questo prompt. **78 record chiusi** dei tipi che il piano nomina o che D2 ha poi definito: 48 `prompt`,
  10 `reading`, 15 `audit`, 5 `run`. Non chiusi, e quindi **non si spostano**: `docs/prompts/v2-session-25.md`, `-28.md`,
  `v2-track-m-rules-round-2027-02.md`, `v2-visible-coverage-reading.md` e questo prompt (quello di D5 diventa `closed` col checkpoint finale di D5).
- **Il piano e i tipi non coincidono.** Il piano §1 dice «only executed prompts, readings and audits move»; il tipo `run` (5 documenti, tra
  cui `docs/PROTOTYPES.md` e `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md`) l'ha definito D2 dopo. Se un `run` si sposta lo decide l'autore.
- **Chi li cita**: 584 citazioni da 202 file fuori dall'archivio (55 sotto `agent/`, 55 in `docs/`, 46 prompt, 17 sotto `tools/`, 10 sotto
  `prototypes/`, 5 sotto `.control-room/`, `AGENTS.md`, una skill, `.github/workflows/qa.yml`, `docs/v2-design/status-labels.json`); 85 di
  questi file sono codice, workflow o dati. **12 ancore** di `patterns.mjs` stanno su 4 record chiusi (`docs/AUDIT-2026-09-01.md` 5,
  `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md` 5, `docs/AUDIT-2026-09-03.md` 1, `docs/FIRST-END-TO-END-AUDIT.md` 1): un'ancora il cui testo
  si sposta cambia `path` nello stesso commit, **mai il testo** (ANCHOR è un errore). Nessun record chiuso è nominato in `tools/docs-check.mjs`.
- **Due ostacoli che il piano non ha visto:**
  - **`data/` cita 7 record chiusi** — `data/instruments.json` (`docs/AUDIT-2026-10-14.md` e le letture V2C-03…05, V2C-12, V2C-17…19,
    V2C-21, V2C-21b), `data/applicability.json` e `data/claims.json` (`docs/F-18-READING.md`), `data/sources.json` (V2C-17…19). Il piano §4
    vieta `data/`: aggiornare quei riferimenti richiede una riga di §8 con le parole dell'autore; altrimenti quei record restano dove sono.
  - **File pubblicati citano 4 record chiusi** — `js/datasets-page.js` (`AUDIT-2026-09-01`), `js/evidence-model.js` (`AUDIT-2026-11-11-P1`),
    `js/routes.js` e `js/instrument-view.js` (`SEO-AUDIT-2026-09-27`), `css/tools.css`, `js/network-model.js`, `js/network-page.js`
    (`PROTOTYPES`): toccarli cambia un file pubblicato (il trailer `Evidence:`, la suite del browser, il gate di rilascio).
- **Un record chiuso che cita un altro record chiuso** (i prompt si citano tra loro): il piano §2 dice «every reference … updated in the same
  commit»; `docs/DOCUMENTATION-ARCHITECTURE.md` §3 dice che un record chiuso cambia solo con una nota datata. **Le due regole si scontrano**:
  lo decide l'autore a D6.1, prima di spostare.
- **`tools/docs-check.mjs`** è in CI: 0 errori; 4 avvertimenti (`agent/schemas/types.mjs:673`, `tools/commit-evidence.mjs:140`, due prompt),
  lasciati all'autore; 65 percorsi di fixture contati; 31 test nel selftest. Un avvertimento nuovo è un rilievo.
- **Da D4 e D5, decisi per una sessione successiva e non per D6** (§8, le righe «After D4: …»; `docs/HANDOVER.md`, la voce di D5):
  collegare `repositoryCaveats()` di `.control-room/views.mjs` a una vista, con un test; le note datate sul deploy gate (H03 in
  `docs/DEPLOYMENT.md`, il suo §3 punto 1, `docs/AI-SAFE-BOUNDARIES.md` §4), quella in `docs/AI-SAFE-BOUNDARIES.md` su una riga di §8 sua;
  `docs/AI-SAFE-BOUNDARIES.md` §4 ridotto a puntatori; il `what` dell'ancora «\_\_CONTENT\_\_» che nomina il punto d'ingresso;
  **l'intestazione di `docs/HANDOVER.md` cresce di un'intestazione citata per sessione** (ora porta quelle di D4, D3, D2, D1 e del
  follow-up della pagina del network, le cui voci sono in archivio) e nessuna sessione può accorciarla senza una riga di §8; 38 branch già
  fusi ancora sul remoto, tra cui `claude/eudigitalpolicy-translation-review-f7jdzs` che la voce di D1 dice cancellato. D6 li nomina nel suo
  passaggio di consegne e nel prompt successivo se nessuna sessione li ha chiusi; **non li fa**.
- **I rilievi aperti** delle voci archiviate da D5 sono elencati, uno per riga, nella voce di D5 in `docs/HANDOVER.md` (§8, «D5, D5.1
  question 2»). Se D6 sposta un record che uno di quei rilievi nomina come sua altra sede, la riga si aggiorna nello stesso commit.

## Obiettivo

- **D6.1 · La mappa dei record, misurata prima.** Per ogni record chiuso: percorso, tipo, la riga di §8 o il commit che lo chiude, ogni
  riferimento (file:riga) per specie — Markdown, codice, workflow, skill, prompt, ancore, pin, `data/`, file pubblicati —, il percorso nuovo
  proposto. **Checkpoint**: la mappa all'autore e le sue parole in §8 (una riga per ciò che decide) **prima** di spostare. Chiedi, con la
  mappa: (1) il percorso d'archivio (per esempio `docs/archive/` con le sottocartelle per tipo, oppure altro); (2) se i `run` si spostano;
  (3) i record citati da `data/` e da file pubblicati: restano, oppure si sposta con una riga di §8 che autorizza quel riferimento; (4) i
  riferimenti dentro i record chiusi: aggiornati nello stesso commit, oppure lasciati come scritti con il percorso vecchio che resta
  risolvibile, oppure altro.
- **D6.2 · Lo spostamento.** Per gruppi nominati nella mappa, un commit per gruppo, con `git mv` (la storia resta leggibile); in ogni commit
  ogni riferimento deciso, il `path` di ogni ancora, la riga di catalogo e i totali di `docs/README.md` §4. Dopo ogni commit
  `node tools/docs-check.mjs` a 0 errori e `node agent/proposals/governance/cli.mjs check` a exit 0.
- **D6.3 · La misura finale** (il piano §5): i dodici punti, uno per uno, ognuno con il metodo, il risultato e ciò che non misura; il punto
  12 si misura sulla voce di D5 in `docs/HANDOVER.md`. Un punto che non passa si dice, con la sua causa; non si fa passare.
- **D6.4 · Il prompt della sessione successiva**, sul branch. Il programma finisce con D6 e l'alternanza del 22 nov 2026 riprende (il piano
  §7): la successiva la sceglie l'autore; se D6 lascia un controllo aperto, D7 (il cuscinetto del piano §2) e il suo prompt. Il checkpoint
  finale approva insieme il lavoro e il prompt.

**Regola d'arresto**: se la sessione si allunga, D6.2 si ferma a un commit coerente (0 errori) e ciò che resta della mappa è nominato nel
prompt di D7; D6.1, D6.3 e D6.4 non cadono.

## Scrivere e verificare

Dopo ogni commit che sposta o cambia un riferimento: `node tools/docs-check.mjs`, `node --test tools/docs-check-selftest.mjs`,
`node agent/proposals/governance/cli.mjs check`, e le suite di `agent/` i cui file sono cambiati. Lo spostamento si verifica **per confronto
di byte**: ogni file spostato è identico alla base (`git diff -M100%` lo mostra come rinomina pura; uno script fuori dal repository, il cui
risultato si dice). **Non lanciare il self-test del browser mentre scrivi file.** Prima di ogni checkpoint la batteria del piano §4, più
`node tools/docs-check.mjs` e il suo selftest. L'output dei validatori resta quello della base; una frase che lo scanner delle credenziali
legge come una coppia chiave-valore si riformula (`node agent/implement/cli.mjs boundary`: 0 bloccanti, 24 avvertimenti); la baseline non
si alza.

## Cosa NON fare

- Non spostare un record che §8 (o il commit su `main`, per la regola di «D2, D2.2 question 1») non chiude; non spostare una policy, una
  specifica, un piano o un design attivi.
- Non modificare il testo di un record che si sposta, salvo ciò che l'autore decide a D6.1 (domanda 4), e sempre con una nota datata.
- Non riaprire i due file d'archivio di `docs/HANDOVER.md` (`docs/archive/HANDOVER-to-2026-11-13.md`,
  `docs/archive/HANDOVER-2026-11-13-to-2026-11-26.md`).
- Non modificare il testo di un'ancora, un pin o un test per farlo passare: si aggiorna il `path` dell'ancora nello stesso commit, e si dice.
- Non toccare `data/`, `i18n/`, `index.html` né le pagine pubblicate senza una riga di §8 con le parole dell'autore, scritta prima; non
  registrare una revisione di traduzione; non toccare il testo di `docs/BRIEF-v2.md`.
- Non toccare `AGENTS.md`, la skill, `CLAUDE.md` né `docs/AI-SAFE-BOUNDARIES.md` senza una riga di §8 con le parole dell'autore, scritta prima.
- Non accorciare l'intestazione di `docs/HANDOVER.md` sopra la prima `## `; non scrivere uno stato generato né un file di stato a mano.
- Non aggiungere una dipendenza.

Vale «Cosa NON fare» del brief.

## Criterio di uscita e consegna

Completa quando:
- la mappa dei record è approvata dall'autore in §8, e ogni record spostato è nel percorso deciso, identico byte per byte, con la sua riga di
  catalogo;
- nessun riferimento è rotto (`tools/docs-check.mjs` a 0 errori, il controllo di governance a exit 0), e ogni riferimento lasciato al
  percorso vecchio per decisione dell'autore è nominato;
- il piano §5 è misurato punto per punto e riportato all'autore;
- validatori, `selftest`, le suite e `.control-room/` passano, e ogni avvertimento nuovo è spiegato;
- **il prompt della sessione successiva esiste sul branch, porta questa stessa regola nel suo criterio di uscita ed è approvato con il
  lavoro; senza il prompt non si approva.**

Oppure l'autore decide di fermarsi: anche allora si scrive il prompt della successiva.

**Il calendario.** D6 chiude entro il 10 gennaio 2027 (§8, 25 nov 2026); se è in corso il 10 gennaio, si ferma a un checkpoint, ciò che
resta va nel prompt di D7 e il programma riprende dopo il giro delle regole di febbraio 2027
(`docs/prompts/v2-track-m-rules-round-2027-02.md`).

Prima di chiudere, la checklist D6.1–D6.4: cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
