<!--
Provenance: written on 26 Nov 2026 in documentation session D6 (`docs/ROADMAP-v2.md` §8, «The scope of the documentation session D6»), on
`claude/zen-brahmagupta-btc1tx`, from `main` `c47b535` (#143 merged), as D6's item D6.4 (`docs/prompts/v2-docs-records.md`) and under the
standing rule of 4 Nov 2026 (the next session's prompt). It carries the plan's row for D7, the buffer (`docs/DOCS-SIMPLIFICATION-PLAN.md`
§2: «Only a check that D6 could not close inside its scope»), D6's measure of the plan's §5 (`docs/DOCS-SIMPLIFICATION-PLAN.md` §5a) and
D6's rows of 26 Nov 2026. Every figure below was measured by D6 on its branch, with scripts kept outside the repository where no command
exists; **rimisura tutto**. Nothing was read from any legal text for this prompt. Written in Italian, like D1's to D6's. Approved, or not,
with D6's work at its final checkpoint.
-->

SESSIONE D7 (programma di semplificazione della documentazione, il cuscinetto) — i due controlli del piano §5 che D6 ha misurato e non ha
chiuso; poi la fine del programma

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`: `tools/docs-check.mjs` verifica i commit citati sulla linea first-parent di `main`). Esegui
`git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`.

**Controlla che D6 sia approvata e su `main`**: la riga di §8 «Final checkpoint of the documentation session D6» e il merge del suo branch
(`claude/zen-brahmagupta-btc1tx`). Se il branch non è su `main`, chiedi all'autore se fonderlo prima o partire dal branch: il brief, «Non
implementare nulla prima che la sessione precedente sia stata approvata».

**La Traccia M ha la precedenza alle sue tappe, e una è vicinissima.** Rimisura la data prima di iniziare: `evidence-audit --as-of <oggi>`
stampa `STATUS_PREDATES_MILESTONE` dopo le tappe di `ai-act` (2 dic 2026), `pld` (9 dic) ed `eidas2` (24 dic) — misurato da D6 il 26 nov
2026: 0 righe. **Se una tappa è passata, dillo all'autore prima di iniziare**: decide lui se la sessione 25, 25.2
(`docs/prompts/v2-session-25.md`) viene prima. D7 è piccola e può aspettare.

Lavora sul branch assegnato dall'ambiente. **Come prima scrittura**, registra in §8 la riga «The scope of the documentation session D7» con
le parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo. Senza quella riga non si scrive
nulla.

Leggi, e trattali come vincolanti: `docs/DOCS-SIMPLIFICATION-PLAN.md` (§2, la riga D7 e la nota datata di D6; §4, le regole di ogni
sessione — **niente `data/`, niente `i18n/`, niente testo del brief**; §5 e **§5a, la misura di D6**; §7); `docs/DOCUMENTATION-ARCHITECTURE.md`
§1, §3 (**un documento attivo si corregge nello stesso commit di ciò che descrive; un record chiuso solo con una nota datata che tiene le
parole vecchie**) e §5; `docs/README.md` §1, §2, §4; `docs/RECORDS-MAP.md` (la mappa di D6, un'istantanea); **`tools/docs-check.mjs`** e il
suo selftest; `docs/ROADMAP-v2.md` §8, le righe di D6 del 26 nov 2026 («D6, D6.1 question 1» … «question 4») e la riga «Rebalancing the
sessions» del 22 nov 2026; `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §3.

## Il punto di partenza (misurato da D6 il 26 novembre 2026; **rimisura tutto**)

- **D6 non ha spostato nulla, per decisione dell'autore** (§8, «D6, D6.1 question 1: whether, and where, the closed records move»): ognuno
  dei 79 record chiusi è citato da una sede che nessuna sessione può riscrivere (§8, l'archivio di `docs/HANDOVER.md`, `data/`, file
  pubblicati, il registro firmato). Le risposte alle domande 2–4 valgono **solo se** una sessione futura riapre lo spostamento; **D7 non lo
  riapre**.
- **Il piano §5 misurato da D6** (`docs/DOCS-SIMPLIFICATION-PLAN.md` §5a): nove punti passano; **due non passano e uno passa solo in
  parte**, ciascuno con la sua causa:
  - **Punti 4 e 8 — `docs/PHASE-5-SETUP.md`** (attivo, canonico) contraddice §8: la riga di stato dice «PHASE 5 IS PLANNED AND NOT OPENED»
    (riga 5) e §5.2 dice Post-v2 «not opened; after the v2» (riga 177), senza nota datata; §8 registra «Phase 4 concluded» (4 nov 2026),
    «G2: Stage 3 is opened, and with it Phase 5» (13 nov 2026) e le righe che hanno aperto i blocchi A, B e C di Post-v2 (9–11 nov 2026).
    `docs/ROADMAP-v2.md`, `AGENTS.md`, `docs/SESSION-ARCHITECTURE.md`, `docs/POST-V2.md` e la riga di catalogo del documento sono già
    allineati. La causa: le correzioni di D1 non lo hanno raggiunto. Nessuna ancora e nessun pin stanno su quel file (misurato da D6).
  - **Punto 5 — l'intestazione di `docs/HANDOVER.md`**, letta all'inizio di ogni sessione (il livello «always»), porta le intestazioni
    citate di sessioni le cui voci sono in archivio (D4, D3, D2, D1, il follow-up della pagina del network; 7 988 byte d'intestazione) e
    **cresce di una per sessione**: con D6 sono sei. La causa: nessuna sessione può accorciarla senza una riga di §8 (la scoperta di D5; il
    prompt di D6).
- **`tools/docs-check.mjs`**: 0 errori; 4 avvertimenti (`agent/schemas/types.mjs:673`, `tools/commit-evidence.mjs:140`, due prompt),
  lasciati all'autore; 31 test nel selftest. **La batteria** su `74c16e0`: 26 suite di `AGENT_SUITES` e `.control-room/`, 1 540 test, 1 539
  passano, 0 falliscono, 1 saltato; i validatori identici alla base. Un avvertimento nuovo è un rilievo.
- **Da D4, D5 e D6, decisi per una sessione successiva e non per D7** (§8, le righe «After D4: …»; `docs/HANDOVER.md`, le voci di D5 e
  D6): collegare `repositoryCaveats()` di `.control-room/views.mjs` a una vista, con un test; le note datate sul deploy gate (H03 in
  `docs/DEPLOYMENT.md`, il suo §3 punto 1, `docs/AI-SAFE-BOUNDARIES.md` §4), quella in `docs/AI-SAFE-BOUNDARIES.md` su una riga di §8 sua;
  `docs/AI-SAFE-BOUNDARIES.md` §4 ridotto a puntatori; il `what` dell'ancora «\_\_CONTENT\_\_» che nomina il punto d'ingresso; i branch già
  fusi ancora sul remoto (38 il 26 nov 2026), tra cui `claude/eudigitalpolicy-translation-review-f7jdzs` che la voce di D1 dice cancellato;
  i rilievi aperti elencati nella voce di D5 (31 righe). D7 li nomina nel suo passaggio di consegne e nel prompt successivo se nessuna sessione li ha
  chiusi; **non li fa**.

## Obiettivo

- **D7.1 · `docs/PHASE-5-SETUP.md` allineato a §8.** Rimisura prima: ogni frase del documento che dichiara lo stato della Fase 4, della
  Fase 5 o di Post-v2, con la riga di §8 che la smentisce o la conferma. Il documento è **attivo**: si corregge, ma **con una nota datata
  sotto la riga di stato, che lascia la riga com'è scritta** (la pratica di D1 su `docs/ROADMAP-v2.md` e `docs/POST-V2.md`), e una nota
  datata accanto alla riga Post-v2 di §5.2; ogni nota cita per titolo la riga di §8. **Nessuna frase cancellata o riscritta.** Se la misura
  trova un altro documento attivo che dice lo stato in modo diverso da §8, è un rilievo: si nomina, e si corregge nello stesso modo solo se
  l'autore lo dice al checkpoint.
- **D7.2 · L'intestazione di `docs/HANDOVER.md`: una regola, non un taglio.** Misura l'intestazione (righe, byte, quante intestazioni citate,
  di quali sessioni, dove sta la voce di ciascuna) e metti all'autore **una domanda**, con le opzioni e la raccomandazione: che cosa
  l'intestazione tiene (per esempio solo l'intestazione citata della sessione precedente; oppure nessuna; oppure com'è), e dove vanno le
  altre (con la voce archiviata della loro sessione, byte per byte, in un **nuovo** file d'archivio — i due esistenti non si riaprono —
  oppure altrove). **Nulla si accorcia prima della riga di §8 con le parole dell'autore.** Dopo la riga, se l'autore decide un taglio:
  lo spostamento byte per byte, la riga di catalogo e i totali di `docs/README.md` §4 nello stesso commit, e la regola scritta dove una
  sessione la legge (la sede la decide l'autore con la domanda: `docs/DOCUMENTATION-ARCHITECTURE.md` o l'intestazione stessa).
- **D7.3 · I punti 4, 5 e 8 del piano §5 rimisurati** con il metodo di §5a, e gli altri nove ricontrollati sul nuovo albero; il risultato in
  una nota datata sotto §5a (§5a resta com'è scritta). Un punto che non passa si dice, con la sua causa; non si fa passare.
- **D7.4 · Il prompt della sessione successiva**, sul branch. **Il programma finisce con D7** e l'alternanza del 22 nov 2026 riprende (il
  piano §7): **la successiva la sceglie l'autore** — chiediglielo al checkpoint D7.3, con le opzioni che §8, `docs/SESSION-ARCHITECTURE.md`
  e la Traccia M offrono quel giorno (misurale: non copiarle da qui). Se la successiva ha già un prompt approvato e attivo (per esempio
  `docs/prompts/v2-session-25.md`), D7.4 non ne scrive un secondo: lo nomina, e ne verifica i presupposti alla data. Il checkpoint finale
  approva insieme il lavoro e il prompt.

**Regola d'arresto**: se la sessione si allunga, D7.2 si ferma alla domanda e alla riga di §8 (la regola decisa, il taglio no), e ciò che
resta è nominato nel prompt successivo; D7.1, D7.3 e D7.4 non cadono.

## Scrivere e verificare

Dopo ogni commit: `node tools/docs-check.mjs` (0 errori; gli avvertimenti quelli della base), `node --test tools/docs-check-selftest.mjs`,
`node agent/proposals/governance/cli.mjs check` (exit 0). Uno spostamento si verifica **per confronto di byte** (uno script fuori dal
repository, il cui risultato si dice). **Non lanciare il self-test del browser mentre scrivi file.** Prima di ogni checkpoint la batteria del
piano §4, più `node tools/docs-check.mjs` e il suo selftest. L'output dei validatori resta quello della base; una frase che lo scanner delle
credenziali legge come una coppia chiave-valore si riformula (`node agent/implement/cli.mjs boundary`: 0 bloccanti, 24 avvertimenti); la
baseline non si alza.

## Cosa NON fare

- Non riaprire lo spostamento dei record chiusi (§8, «D6, D6.1 question 1 …»); non spostare, rinominare, fondere o cancellare un documento,
  salvo ciò che l'autore decide a D7.2 per l'intestazione di `docs/HANDOVER.md`.
- Non riscrivere né cancellare una frase di `docs/PHASE-5-SETUP.md` o di `docs/DOCS-SIMPLIFICATION-PLAN.md` §5a: si aggiunge una nota datata.
- Non accorciare l'intestazione di `docs/HANDOVER.md` sopra la prima `## ` senza la riga di §8 di D7.2; non scrivere uno stato generato né un
  file di stato a mano; non riaprire i due file d'archivio di `docs/HANDOVER.md`.
- Non modificare il testo di un'ancora, un pin o un test per farlo passare.
- Non fare il lavoro deciso per una sessione successiva (l'elenco sopra): lo si nomina.
- Non toccare `data/`, `i18n/`, `index.html` né le pagine pubblicate; non registrare una revisione di traduzione; non toccare il testo di
  `docs/BRIEF-v2.md`.
- Non toccare `AGENTS.md`, la skill, `CLAUDE.md` né `docs/AI-SAFE-BOUNDARIES.md` senza una riga di §8 con le parole dell'autore, scritta prima.
- Non aggiungere una dipendenza.

Vale «Cosa NON fare» del brief.

## Criterio di uscita e consegna

Completa quando:
- `docs/PHASE-5-SETUP.md` porta le note datate che lo allineano a §8, ognuna con la sua riga di §8, nessuna frase cambiata;
- la regola sull'intestazione di `docs/HANDOVER.md` è decisa dall'autore in §8 e, se decide un taglio, applicata byte per byte con la sua
  riga di catalogo;
- i punti 4, 5 e 8 del piano §5 sono rimisurati e riportati all'autore, con gli altri nove ricontrollati;
- nessun riferimento è rotto (`tools/docs-check.mjs` a 0 errori, il controllo di governance a exit 0);
- validatori, `selftest`, le suite e `.control-room/` passano, e ogni avvertimento nuovo è spiegato;
- **il prompt della sessione successiva esiste sul branch (o è nominato, se esiste già), porta questa stessa regola nel suo criterio di
  uscita ed è approvato con il lavoro; senza il prompt non si approva.**

Oppure l'autore decide di fermarsi: anche allora si scrive, o si nomina, il prompt della successiva.

**Il calendario.** Il programma chiude entro il 10 gennaio 2027 (§8, 25 nov 2026); se D7 è in corso il 10 gennaio, si ferma a un
checkpoint, ciò che resta va nel prompt successivo e il programma riprende dopo il giro delle regole di febbraio 2027
(`docs/prompts/v2-track-m-rules-round-2027-02.md`).

Prima di chiudere, la checklist D7.1–D7.4: cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
