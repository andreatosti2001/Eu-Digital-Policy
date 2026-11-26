<!--
Provenance: written on 26 Nov 2026 in documentation session D2 (`docs/ROADMAP-v2.md` §8, «The scope of the documentation session D2»), on
`claude/friendly-brahmagupta-lxuqd7`, from `main` `f6834f5` (#139 merged), as D2's item D2.4 (`docs/prompts/v2-docs-authority-catalogue.md`)
and under the standing rule of 4 Nov 2026 (the next session's prompt). It carries the author's decision on the check (§8, «D1, D.3 question
4: the documentation check») and D2's rows of 26 Nov 2026. Every figure below was measured by D2 on its branch; **rimisura tutto**. Nothing
was read from any legal text for this prompt. Written in Italian, like D1's and D2's. Approved, or not, with D2's work at its final checkpoint.
-->

SESSIONE D3 (programma di semplificazione della documentazione) — il controllo della documentazione

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`: la storia serve al controllo di governance). Esegui `git branch -r --no-merged origin/main` e segnala ogni branch
né tuo né nel registro di `docs/HANDOVER.md`.

**Controlla che D2 sia approvata e su `main`**: la riga di §8 «Final checkpoint of the documentation session D2» e il merge del suo branch
(`claude/friendly-brahmagupta-lxuqd7`). Se il branch non è su `main`, chiedi all'autore se fonderlo prima o partire dal branch: il brief, «Non
implementare nulla prima che la sessione precedente sia stata approvata».

Lavora sul branch assegnato dall'ambiente. **Come prima scrittura**, registra in §8 la riga «The scope of the documentation session D3» con
le parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo. Senza quella riga non si scrive
nulla.

Leggi, e trattali come vincolanti: `docs/DOCS-SIMPLIFICATION-PLAN.md` (§2, la riga D3: che cosa fa e che cosa non fa; §4, le regole di ogni
sessione); **`docs/DOCUMENTATION-ARCHITECTURE.md` per intero** (§3, quando un record è chiuso, con la clausola del merge su `main`; §5, la
forma dell'intestazione e «What a tool can check»); **`docs/README.md`** (§1, la tabella e le sue colonne fisse; §3, gli incerti; §4, i
totali); `docs/DOCS-DEPENDENCY-MAP.md` §0 e §B; `docs/ROADMAP-v2.md` §8, la riga «D1, D.3 question 4: the documentation check» e le righe di
D2 del 26 novembre 2026; `agent/proposals/governance/patterns.mjs`; `tools/validate.mjs` (A-6, i titoli delle righe di §8);
`.github/workflows/qa.yml`; `docs/CURRENT-ARCHITECTURE.md` §12 e `agent/implement/baseline.mjs` (la baseline dei validatori);
`docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §3.

## Il punto di partenza (misurato da D2 il 26 novembre 2026; **rimisura tutto**)

- **Il catalogo** (`docs/README.md` §1) ha **143 righe**: il perimetro (`.md` tracciati sotto `docs/`, più `AGENTS.md`, `CLAUDE.md`,
  `README.md`), compresi `docs/README.md` e `docs/DOCUMENTATION-ARCHITECTURE.md`, scritti da D2, e questo prompt. Sette colonne fisse. I totali di §4 sono
  ricontati dalla tabella da uno script di D2 tenuto fuori dal repository: il tuo strumento li ricalcola.
- **L'intestazione** (`docs/DOCUMENTATION-ARCHITECTURE.md` §5) è su **85 documenti** di `docs/`: gli 82 di `ff3ee87`, `docs/README.md`,
  `docs/DOCUMENTATION-ARCHITECTURE.md` e `docs/BRIEF-v2.md` (aggiunta dopo D2 sulle parole dell'autore, **sopra il commento di
  provenienza**: l'unica che non sta sotto il titolo, §8, «After D2: the standard header on `docs/BRIEF-v2.md`»; lo strumento la cerca lì). Una riga sotto il titolo, campi in ordine fisso separati da ` · `: `**Lifecycle:**`,
  `**Authority:**`, `**Home of:**` oppure `**Points to:**`, `**Snapshot of:**` facoltativo, `**Closed by:**` per un documento chiuso (il
  titolo di una riga di §8 tra «», oppure `` on `main` `<commit>` ``), `**Catalogue:**`. **Non la portano**, per decisione: i 51 prompt, questo compreso (§8,
  «D2, D2.3: whether the prompts under `docs/prompts/` carry the standard header», solo catalogo); `docs/i18n-review/` (generati);
  l'archivio; `AGENTS.md`, `CLAUDE.md`, `README.md` (fuori da `docs/`).
- **L'incerto** (`docs/README.md` §3): `docs/METHODOLOGY-NOTE-v2.md` (lasciato incerto dall'autore). Lo strumento accetta `uncertain`; non
  lo decide. `docs/V2-DATA-DESIGN.md` è stato misurato dopo D2 ed è `active` (§8, «After D2: the lifecycle of `docs/V2-DATA-DESIGN.md`,
  measured»).
- **Le ancore**: 29, di tipo `contains` (`patterns.mjs`). I lettori del testo: otto file su sei documenti (`docs/DOCS-DEPENDENCY-MAP.md` §0).
  §B.2 di quella mappa è un'euristica: **leggi il codice** prima di trattare un letterale come un pin.
- **La batteria di D2** (sul suo ultimo commit): `validate`, `i18n-audit`, `design-qa`, `seo-audit`, `evidence-audit --as-of 2026-11-26`,
  `freshness --as-of 2026-11-26` identici a `f6834f5`; il resto nella riga del checkpoint finale di D2 e in `docs/HANDOVER.md`.

## La decisione dell'autore (§8, 26 nov 2026, «D1, D.3 question 4»; non si richiede)

**Uno strumento nuovo, un passo di CI**: `tools/docs-check.mjs`, con il suo selftest, in `.github/workflows/qa.yml` accanto ai validatori.
Controlla che i link interni e i percorsi nominati in codice, workflow, skill e prompt si risolvano; che le frasi di §B.1 e §B.2 della mappa
esistano ancora, **importando `patterns.mjs` invece di copiarlo**; che un'intestazione di stato che cita il titolo di una riga di §8 ne nomini
una vera; i conteggi che il catalogo deriva. **I suoi avvertimenti iniziano come rilievi.**

## Obiettivo

- **D3.1 · Il progetto del controllo, misurato prima.** Esegui una prima versione in sola lettura su `main` e conta, per ciascun controllo,
  quanti casi falliscono oggi (link rotti, percorsi che non esistono, intestazioni, righe del catalogo, totali). Proponi all'autore che cosa è
  **errore** (CI rossa) e che cosa **avvertimento** (un rilievo). **Checkpoint**: il progetto all'autore
  prima di costruire il passo di CI. Un link rotto trovato è un rilievo con il suo file e la sua riga: **non si corregge in silenzio**; si
  corregge solo dove il bersaglio è stato spostato o rinominato e la correzione è meccanica, ciascuna nominata, e mai cambiando il senso di
  una frase.
- **D3.2 · `tools/docs-check.mjs` e il suo selftest.** I controlli di «What a tool can check» (`docs/DOCUMENTATION-ARCHITECTURE.md` §5) più
  quelli della decisione: (1) il catalogo copre ogni documento del perimetro e nessun altro; (2) ogni documento che deve portare
  l'intestazione ne porta **una**, nella forma fissa, con ciclo di vita e autorità uguali alla riga del catalogo, e chi non deve portarla non
  la porta; (3) un `Closed by` tra «» è il titolo di una riga di §8, un `` on `main` `<commit>` `` è un commit sulla linea first-parent di
  `main` (con un clone superficiale lo strumento lo dice, non lo inventa); (4) un `Points to`, un `Superseded by`, un link Markdown interno e
  un percorso `docs/…` nominato in codice, workflow, skill o prompt si risolvono; (5) le ancore di `patterns.mjs` e i pin di §B.2 che hai
  confermato nel codice esistono ancora; (6) i totali di `docs/README.md` §4 sono quelli della tabella. **Ogni controllo ha un caso piantato
  che deve fallire** nel selftest, su un albero di prova, mai sul repository.
- **D3.3 · Il passo di CI.** In `.github/workflows/qa.yml` accanto ai validatori, e il selftest dove girano le altre suite. Misura se
  «Against the recorded baseline» (`agent/implement/baseline.mjs`, `docs/CURRENT-ARCHITECTURE.md` §12) deve conoscere lo strumento nuovo: se
  sì, la riga di §12 si aggiunge nello stesso commit e si dice; **la baseline non si alza** per far passare qualcosa.
- **D3.4 · Il prompt di D4** (`AGENTS.md` ridotto a punto d'ingresso e la skill `project-context` per livelli, che legge le liste per dominio
  di `docs/README.md` §2; §8, «D1, D.3 question 1» e «question 2»), sul branch. Il checkpoint finale approva insieme il lavoro e il prompt.

**Regola d'arresto**: se la sessione si allunga, D3.3 resta su un elenco nominato nel prompt di D4; D3.1 e D3.2 non cadono.

## Scrivere e verificare

Dopo ogni commit che tocca un documento citato da un'ancora o letto dal codice: `node agent/proposals/governance/cli.mjs check`,
`node --test agent/implement/selftest.mjs`, `node --test agent/detector/selftest.mjs`, `node --test .control-room/selftest.mjs`. **Non
lanciare il self-test del browser mentre scrivi file** (il suo controllo «byte-identical» fallisce se il repository cambia durante la corsa).
Prima di ogni checkpoint la batteria del piano §4. L'output dei validatori resta quello della base: un avvertimento nuovo è un rilievo. Una
frase che lo scanner delle credenziali legge come una coppia chiave-valore si riformula (`node agent/implement/cli.mjs boundary`: 0
bloccanti, 24 avvertimenti a `f6834f5`); la baseline non si alza.

## Cosa NON fare

- Non spostare, rinominare, fondere o cancellare un documento (solo D6 sposta, e solo i record chiusi).
- Non toccare `AGENTS.md` (D4), né il testo di `docs/BRIEF-v2.md` (lo cambia solo l'autore).
- Non cambiare la classificazione di un documento per far passare un controllo: una riga del catalogo cambia con la sua ragione e, dove la
  regola lo chiede, con la riga di §8.
- Non copiare le ancore in un secondo file: si importano. Non modificare un'ancora, un pin o un test per farlo passare.
- Non riscrivere né riordinare le righe di §8; non scrivere uno stato generato (§8, «D1, D.3 question 3»).
- Non toccare `data/`, `i18n/`, `index.html` né le pagine pubblicate; non registrare una revisione di traduzione; non scrivere testo del
  livello rosso senza la sua riga di §8.
- Non aggiungere una dipendenza: lo strumento è Node senza pacchetti, come gli altri di `tools/` (`docs/AI-SAFE-BOUNDARIES.md` §3).

Vale «Cosa NON fare» del brief.

## Criterio di uscita e consegna

Completa quando:
- `tools/docs-check.mjs` e il suo selftest esistono, ogni controllo ha un caso piantato che fallisce, e il progetto (errori e avvertimenti)
  è approvato dall'autore in §8;
- il passo è in `.github/workflows/qa.yml`, oppure è nominato nel prompt di D4 come ciò che resta;
- ogni rilievo dello strumento su `main` è elencato con file e riga, corretto (e nominato) o lasciato all'autore;
- validatori, `selftest`, le suite, `.control-room/` e il controllo di governance passano, e ogni avvertimento nuovo è spiegato;
- **il prompt della sessione successiva (D4) esiste sul branch, porta questa stessa regola nel suo criterio di uscita ed è approvato con il
  lavoro; senza il prompt non si approva.**

Oppure l'autore decide di fermarsi: anche allora si scrive il prompt della successiva.

**Il calendario.** D6 chiude entro il 10 gennaio 2027 (§8, 25 nov 2026); se una sessione del programma è in corso il 10 gennaio, si ferma a un
checkpoint e il programma riprende dopo il giro delle regole di febbraio 2027.

**La Traccia M ha la precedenza alle sue tappe.** Rimisura la data prima di iniziare: `evidence-audit --as-of <oggi>` stampa
`STATUS_PREDATES_MILESTONE` dopo le tappe di `ai-act` (2 dic 2026), `pld` (9 dic) ed `eidas2` (24 dic) — misurato da D2 il 26 nov 2026: 0
righe; gli stati sono della sessione 25, 25.2 (`docs/prompts/v2-session-25.md`). **Se una tappa è passata, dillo all'autore prima di
iniziare**: decide lui se la sessione 25.2 viene prima.

Prima di chiudere, la checklist D3.1–D3.4: cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
