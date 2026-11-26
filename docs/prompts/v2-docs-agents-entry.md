<!--
Provenance: written on 26 Nov 2026 in documentation session D3 (`docs/ROADMAP-v2.md` §8, «The scope of the documentation session D3»), on
`claude/laughing-galileo-czdpz2`, from `main` `9473496` (#140 merged), as D3's item D3.4 (`docs/prompts/v2-docs-check.md`) and under the
standing rule of 4 Nov 2026 (the next session's prompt). It carries the author's decisions on `AGENTS.md` and the skill (§8, «D1, D.3
question 1» and «question 2») and D3's rows of 26 Nov 2026. Every figure below was measured by D3 on its branch; **rimisura tutto**.
Nothing was read from any legal text for this prompt. Written in Italian, like D1's, D2's and D3's. Approved, or not, with D3's work at
its final checkpoint.
-->

SESSIONE D4 (programma di semplificazione della documentazione) — `AGENTS.md` come punto d'ingresso e la skill `project-context` per livelli

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`: la storia serve al controllo di governance e a `tools/docs-check.mjs`, che verifica i commit citati sulla linea
first-parent di `main`). Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`.

**Controlla che D3 sia approvata e su `main`**: la riga di §8 «Final checkpoint of the documentation session D3» e il merge del suo branch
(`claude/laughing-galileo-czdpz2`). Se il branch non è su `main`, chiedi all'autore se fonderlo prima o partire dal branch: il brief, «Non
implementare nulla prima che la sessione precedente sia stata approvata».

Lavora sul branch assegnato dall'ambiente. **Come prima scrittura**, registra in §8 la riga «The scope of the documentation session D4» con
le parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo. Senza quella riga non si scrive
nulla.

Leggi, e trattali come vincolanti: `docs/DOCS-SIMPLIFICATION-PLAN.md` (§0 punto 3: `AGENTS.md` e la skill `project-context` sono testi di
governo e cambiano **sulle parole dell'autore registrate in §8 prima del cambiamento**; §2, la riga D4: che cosa fa e che cosa non fa; §4, le
regole di ogni sessione; §6, il rischio «A reduced `AGENTS.md` loses a rule silently»); `docs/ROADMAP-v2.md` §8, **le righe «D1, D.3 question
1» e «D1, D.3 question 2»** e le righe di D3 del 26 novembre 2026; `docs/DOCUMENTATION-ARCHITECTURE.md` §5 (chi porta l'intestazione: non
`AGENTS.md`) e §7 (i tre livelli di lettura); **`docs/README.md` §2** (le liste per dominio, che la skill leggerà) e §1 (le righe di
`AGENTS.md`, `CLAUDE.md`, `README.md`); `docs/DOCS-DEPENDENCY-MAP.md` §0 e §B.1; `agent/proposals/governance/patterns.mjs` (le ancore);
`.control-room/views.mjs` `repositoryCaveats()`; **`tools/docs-check.mjs`** (`PINS`, `SEVERITY`) e `tools/docs-check-selftest.mjs`;
`CLAUDE.md`; `docs/SKILL-MAP.md`; `.agents/skills/project-context/SKILL.md`; `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md`
§0 e §3.

## Il punto di partenza (misurato da D3 il 26 novembre 2026; **rimisura tutto**)

- **`AGENTS.md`**: 797 righe, 66.073 byte. Sezioni: «What this is» (riga 9), «Read these first, in this order» (23; la tabella ha 41 righe,
  poi le due tabelle delle politiche e, **dalla riga 92 alla 295, i paragrafi narrativi delle sessioni**, ciascuno con un documento che ne è
  la casa), «The rules that matter most» (296: le otto regole), «Architecture — do not rebuild it» (321), «Running it» (338), «Validators —
  this project's test suite» (347–581: i comandi, e di nuovo storie delle sessioni e dei conteggi delle suite), «Known hazards» (582), «Git»
  (761), «When to stop and ask» (789).
- **Le 9 ancore in `AGENTS.md`** (`patterns.mjs`, tipo `contains`): «Your base may be stale», «Never state a validator passed if it was not
  run», «caught the suite list growing» (due volte), «MODULE_SURFACE», «re-fetch and diff against it again», «the rollback gate has never
  examined a record», «no URL here has ever been fetched», «__CONTENT__». **Da D3 una frase ancorata che lascia `AGENTS.md` senza che il
  `path` della sua ancora la segua nello stesso commit è un ERRORE di `tools/docs-check.mjs` (ANCHOR) e un REFUTED del controllo di
  governance: la CI diventa rossa.** Si aggiorna il `path` dell'ancora, **mai il suo testo**; e il testo spostato resta identico.
- **Chi legge il testo di `AGENTS.md`**: `.control-room/views.mjs` `repositoryCaveats()` legge da `## Known hazards` alla `## ` successiva,
  divide su `\n- ` e mostra i primi 400 caratteri di ciascun punto: **18 avvertenze** oggi, nella Control Room. È un pin di `docs-check`
  (PIN, errore). Ridurre ciascun punto a una riga cambia ciò che la Control Room mostra: va detto all'autore, non scoperto dopo.
- **La skill `project-context`**: 3.113 byte; fa leggere a ogni sessione cinque documenti interi (`docs/PROJECT-CONTEXT.md`,
  `docs/CURRENT-ARCHITECTURE.md`, `docs/AI-SAFE-BOUNDARIES.md`, `docs/HANDOVER.md`, `README.md`). **Nessun codice la testa** (0 occorrenze di
  `project-context` in `.mjs`, `.js` o nei workflow): «con i suoi test» (il piano §2) significa test che D4 scrive.
- **`CLAUDE.md`** (31 righe, `entry`, `normative`) elenca sei documenti da leggere in ordine e poi la skill: con la lettura per livelli quel
  elenco diventa una seconda casa dell'ordine di lettura. `docs/SKILL-MAP.md` dice che la skill porta «the reading order».
- **`tools/docs-check.mjs` è in CI** (D3): 0 errori; 4 avvertimenti, tutti percorsi `docs/…` non trovati e lasciati all'autore
  (`agent/schemas/types.mjs:673`, `tools/commit-evidence.mjs:140`, due prompt); 64 percorsi di fixture contati (56 delle suite, 8 del selftest di `docs-check`). Un avvertimento nuovo è un
  rilievo.

## Le decisioni dell'autore (§8, 26 nov 2026; non si richiedono)

- **D.3, domanda 1 — `AGENTS.md` è un punto d'ingresso** («Entry point (Recommended)»): restano che cosa è il progetto, la tabella di
  lettura, le otto regole, l'architettura, come lo si esegue, i comandi dei validatori, «Known hazards» **una riga ciascuno che punta alla
  sua casa**, Git e quando fermarsi; **ogni paragrafo narrativo va al documento che riassume, nello stesso commit**, con le sue ancore e la
  lettura di `views.mjs` che continuano a funzionare. Nessuna regola cambia senso o cade.
- **D.3, domanda 2 — la skill legge per livelli** («Reading by levels (Recommended)»): sempre `docs/AI-SAFE-BOUNDARIES.md` §0 e §3,
  l'intestazione di `docs/HANDOVER.md` e le regole di `AGENTS.md`; per compito, i documenti di dominio che il catalogo nomina
  (`docs/README.md` §2); su richiesta, i record. **Con i suoi test.**
- **D3: il controllo è in CI** (§8, «Checkpoint D3.1 of the documentation session D3: the design of the check»): ANCHOR, PIN, LINK, CAT,
  HDR, CLOSED, POINTS, TOTAL sono errori. Ogni commit di D4 deve lasciarlo a 0 errori.

## Obiettivo

- **D4.1 · La mappa delle mosse, misurata prima.** Per ogni paragrafo, tabella o punto che lascia `AGENTS.md`: il testo (righe), il
  documento che ne è la casa, **se la casa contiene già il fatto** (allora il paragrafo non si copia: si toglie e si lascia il puntatore),
  le ancore e i pin che tocca, e che cosa la Control Room mostrerà dopo («Known hazards»). Le otto regole e «When to stop and ask» restano
  **byte per byte**. **Checkpoint**: la mappa all'autore, e le sue parole in §8 (una riga per ciò che decide) **prima** di cambiare `AGENTS.md`
  (il piano §0 punto 3; `docs/AI-SAFE-BOUNDARIES.md` §3). Chiedi anche, con la mappa: che cosa diventa l'elenco di lettura di `CLAUDE.md`
  (resta, punta alla skill, o punta ai livelli), e dove vivono i test della skill (in `tools/docs-check.mjs` come controllo nuovo, con il suo
  caso piantato e la sua severità decisa, oppure in un file di test suo).
- **D4.2 · `AGENTS.md` ridotto.** Un commit per mossa (o per gruppo nominato nella mappa): il testo arriva nella sua casa **identico**, con una
  nota datata che dice da dove viene; dove la casa ha già il fatto, `AGENTS.md` perde il paragrafo e tiene la riga che punta; il `path` di
  ogni ancora che si sposta cambia nello stesso commit. Dopo ogni commit `node tools/docs-check.mjs` a 0 errori e
  `node agent/proposals/governance/cli.mjs check` a exit 0. «Known hazards» resta una sezione `## Known hazards` con punti `- `.
- **D4.3 · La skill `project-context` per livelli**, con i suoi test come decisi al checkpoint D4.1: sempre (§0 e §3 dei confini,
  l'intestazione di `docs/HANDOVER.md`, le regole di `AGENTS.md`); per dominio, **leggendo `docs/README.md` §2, non copiandone le liste**; su
  richiesta, i record. `docs/SKILL-MAP.md` e `CLAUDE.md` come deciso, nello stesso commit della skill.
- **D4.4 · Il prompt di D5** (`docs/HANDOVER.md` ridotto spostando le voci chiuse in `docs/archive/` byte per byte, le ancore aggiornate
  nello stesso commit; **nessuno stato generato**, §8, «D1, D.3 question 3»), sul branch. Il checkpoint finale approva insieme il lavoro e il
  prompt.

**Regola d'arresto**: se la sessione si allunga, D4.2 si ferma a un commit coerente (0 errori) e ciò che resta della mappa è nominato nel
prompt di D5; D4.1 e D4.3 non cadono.

## Scrivere e verificare

Dopo ogni commit che tocca `AGENTS.md`, la skill, `CLAUDE.md` o un documento che riceve un paragrafo: `node tools/docs-check.mjs`,
`node --test tools/docs-check-selftest.mjs`, `node agent/proposals/governance/cli.mjs check`, `node --test .control-room/selftest.mjs`,
`node --test agent/implement/selftest.mjs`. Un documento che riceve un paragrafo cambia la sua intestazione solo se cambia ciò di cui è la
casa, e allora la riga del catalogo cambia con lui. **Non lanciare il self-test del browser mentre scrivi file.** Prima di ogni checkpoint la
batteria del piano §4, più `node tools/docs-check.mjs` e il suo selftest. L'output dei validatori resta quello della base; una frase che lo
scanner delle credenziali legge come una coppia chiave-valore si riformula (`node agent/implement/cli.mjs boundary`: 0 bloccanti, 24
avvertimenti); la baseline non si alza.

## Cosa NON fare

- Non cambiare il senso di una regola, e non lasciarne cadere una: le otto regole, «When to stop and ask» e «Report honestly» restano byte
  per byte.
- Non cambiare `AGENTS.md`, la skill o `CLAUDE.md` senza la riga di §8 con le parole dell'autore, scritta prima.
- Non spostare, rinominare, fondere o cancellare un documento (solo D6 sposta, e solo i record chiusi). Spostare un **paragrafo** di
  `AGENTS.md` nella sua casa è il lavoro di D4; spostare un **file** no.
- Non modificare il testo di un'ancora, un pin o un test per farlo passare: si aggiorna il `path` dell'ancora o il pin nello stesso commit,
  e si dice.
- Non scrivere uno stato generato (§8, «D1, D.3 question 3»); non copiare in un secondo file le liste di `docs/README.md` §2.
- Non toccare `data/`, `i18n/`, `index.html` né le pagine pubblicate; non registrare una revisione di traduzione; non toccare il testo di
  `docs/BRIEF-v2.md`.
- Non aggiungere una dipendenza.

Vale «Cosa NON fare» del brief.

## Criterio di uscita e consegna

Completa quando:
- la mappa delle mosse è approvata dall'autore in §8, e ogni mossa fatta è un commit con il suo testo identico nella sua casa;
- `AGENTS.md` è il punto d'ingresso deciso, oppure ciò che resta della mappa è nominato nel prompt di D5;
- la skill legge per livelli, con i suoi test, e `CLAUDE.md` e `docs/SKILL-MAP.md` dicono la stessa cosa;
- `tools/docs-check.mjs` a 0 errori, il controllo di governance a exit 0, validatori, `selftest`, le suite e `.control-room/` passano, e ogni
  avvertimento nuovo è spiegato;
- **il prompt della sessione successiva (D5) esiste sul branch, porta questa stessa regola nel suo criterio di uscita ed è approvato con il
  lavoro; senza il prompt non si approva.**

Oppure l'autore decide di fermarsi: anche allora si scrive il prompt della successiva.

**Il calendario.** D6 chiude entro il 10 gennaio 2027 (§8, 25 nov 2026); se una sessione del programma è in corso il 10 gennaio, si ferma a un
checkpoint e il programma riprende dopo il giro delle regole di febbraio 2027.

**La Traccia M ha la precedenza alle sue tappe.** Rimisura la data prima di iniziare: `evidence-audit --as-of <oggi>` stampa
`STATUS_PREDATES_MILESTONE` dopo le tappe di `ai-act` (2 dic 2026), `pld` (9 dic) ed `eidas2` (24 dic) — misurato da D3 il 26 nov 2026: 0
righe; gli stati sono della sessione 25, 25.2 (`docs/prompts/v2-session-25.md`). **Se una tappa è passata, dillo all'autore prima di
iniziare**: decide lui se la sessione 25.2 viene prima.

Prima di chiudere, la checklist D4.1–D4.4: cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
