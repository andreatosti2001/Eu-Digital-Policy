<!--
Provenance: written on 26 Nov 2026 in documentation session D1 (`docs/ROADMAP-v2.md` §8, «The scope of the documentation session D1»), on
`claude/intelligent-rubin-8pykrj`, from `main` `36d57d7` (#138 merged), as D1's item D.4 (`docs/prompts/v2-docs-coherence.md`) and under the
standing rule of 4 Nov 2026 (the next session's prompt). It carries the author's answers to D1's four questions (§8, the four rows of 26 Nov
2026 «D1, D.3 question 1…4») where they concern D2. Every figure below was measured by D1 on its branch; **rimisura tutto**. Nothing was
read from any legal text for this prompt. Written in Italian, like D1's. Approved, or not, with D1's work at its final checkpoint.
-->

SESSIONE D2 (programma di semplificazione della documentazione) — l'autorità dei documenti e il catalogo

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`). Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`.

**Controlla che D1 sia approvata e su `main`**: la riga di §8 «Final checkpoint of the documentation session D1» e il merge del suo branch
(`claude/intelligent-rubin-8pykrj`). Se il branch non è su `main`, chiedi all'autore se fonderlo prima o partire dal branch: il brief, «Non
implementare nulla prima che la sessione precedente sia stata approvata».

Lavora sul branch assegnato dall'ambiente. **Come prima scrittura**, registra in §8 la riga «The scope of the documentation session D2» con
le parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo. Senza quella riga non si scrive
nulla.

Leggi, e trattali come vincolanti: **`docs/DOCS-SIMPLIFICATION-PLAN.md` per intero** (§2, la riga D2: che cosa fa e che cosa non fa; §4, le
regole di ogni sessione); **`docs/DOCS-DEPENDENCY-MAP.md`** (la mappa di D1: §0 i lettori confermati nel codice, §1 ciò che non sa, §A le
proposte di ciclo di vita e di autorità, ciascuna con la sua regola); `docs/ROADMAP-v2.md` §8, le righe di D1 del 26 novembre 2026 (scope,
D.1, checkpoint, **le quattro risposte di D.3**); `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §3;
`docs/DATA-GOVERNANCE.md`; `agent/proposals/governance/patterns.mjs` (le ancore).

## Il punto di partenza (misurato da D1 il 26 novembre 2026; **rimisura tutto**)

- **138 documenti** nel perimetro (135 sotto `docs/`, più `AGENTS.md`, `CLAUDE.md`, `README.md`), 4,79 MB. 49 prompt in `docs/prompts/`.
- **Le proposte di D1** (`docs/DOCS-DEPENDENCY-MAP.md` §A, colonne «lifecycle» e «authority»): 12 attivi e normativi; 4 attivi e canonici
  (`docs/ROADMAP-v2.md`, `docs/CURRENT-ARCHITECTURE.md`, `docs/HANDOVER.md`, `README.md`); 3 generati (`docs/i18n-review/`); 26 record chiusi
  e 2 riferimenti chiusi (`PHASE-4-SETUP`, `PHASE-4-PLAN`); 1 storico (l'archivio); 45 prompt «opened» (una riga di scope in §8 li cita: se
  la sessione sia finita la regola non lo dice — il prompt della sessione 25 è aperto e la sua lettura deve ancora venire); 4 prompt senza riga
  di scope; **41 non determinati**. **Sono proposte**: le decide questa sessione, con l'autore dove servono le sue parole.
- **Chi legge il testo** (D1, confermato nel codice): otto file leggono sei documenti (`CURRENT-ARCHITECTURE.md` §12 e §5, `ROADMAP-v2.md`
  §8, `AGENTS.md` «Known hazards», `README.md` limitazione 7, `CONTROL-ROOM.md` §5). **Un'intestazione aggiunta non deve rompere nessuno di
  questi**: `baseline.mjs` cerca la riga `**Baseline at commit` e il primo blocco recintato dopo di essa; `detector/selftest.mjs` la tabella tra
  `## 5. Dataset dependency map` e `## 6.`; `views.mjs` la sezione `## Known hazards`.
- **Le ancore** sono di tipo `contains`: aggiungere righe non le rompe, cambiare la frase sì.

## Le decisioni dell'autore che riguardano D2 (§8, 26 nov 2026; non si richiedono)

- **D.3, domanda 2 — la skill `project-context` a livelli** (implementata in D4): sempre `AI-SAFE-BOUNDARIES.md` §0 e §3, l'intestazione di
  `HANDOVER.md` e le regole di `AGENTS.md`; **per compito, i documenti di dominio che il catalogo di D2 nomina**. Il catalogo deve quindi dire,
  per ogni dominio (dati e prove, i18n, SEO e pubblicazione, rilascio e decisioni, agenti, Control Room, frontend, regole e Traccia M,
  documentazione), quali documenti un compito di quel dominio legge.
- **D.3, domanda 3 — nessuno stato corrente generato**: lo stato resta in §8, su `main` e nei comandi; il catalogo **non** riporta stati,
  né conteggi scritti a mano che abbiano già una casa.
- **D.3, domanda 4 — `tools/docs-check.mjs`** (costruito in D3) controllerà i conteggi che il catalogo deriva e le intestazioni di stato che
  citano un titolo di §8: scrivi il catalogo e le intestazioni in una forma che uno strumento possa leggere (una tabella con colonne fisse;
  un'intestazione con campi fissi).
- **D.3, domanda 1 — `AGENTS.md` ridotto a punto d'ingresso** (in D4): D2 **non** lo tocca, salvo la riga che punta al catalogo, se l'autore
  la approva.

## Obiettivo

- **D2.1 · Le regole di classificazione.** `docs/DOCUMENTATION-ARCHITECTURE.md`: i quattro cicli di vita (attivo, storico, superato,
  chiuso) e le tre autorità (normativo, canonico, riferimento), ciascuno con il criterio che lo assegna e chi lo decide; che cosa è un record
  (prompt, lettura, audit) e che cosa una specifica; quali file sono generati e da quale comando; i livelli di lettura (sempre / per
  dominio / su richiesta). **Checkpoint**: le regole all'autore prima di applicarle.
- **D2.2 · Il catalogo.** `docs/README.md`: ogni documento del perimetro con dominio, tipo, ciclo di vita, autorità e la casa che è (o a cui
  rimanda), in una tabella che uno strumento possa leggere; per ogni dominio, i documenti che un compito legge (il livello «per dominio»
  della skill). Le 41 voci non determinate da D1 si decidono una per una; **quelle che restano incerte si dicono incerte**, non si assegnano
  per comodità. I prompt e l'archivio stanno nel catalogo come record, con la loro riga di §8 dove esiste.
- **D2.3 · L'intestazione standard.** Su ogni documento di `docs/` che una persona scrive: una riga con ciclo di vita, autorità e la casa
  che è o a cui rimanda, **aggiunta sopra o sotto il titolo senza cambiare nessuna frase esistente** (le ancore e i lettori del codice
  restano verdi). **Esclusi** i file generati (`docs/i18n-review/`, che il generatore riscriverebbe) e l'archivio (spostato byte per byte il 22
  nov 2026): il catalogo li copre. Proponi all'autore se i 49 prompt ricevono l'intestazione o restano solo nel catalogo.
  `docs/PROJECT-CONTEXT.md` è segnato come istantanea (il piano §2).
- **D2.4 · Il prompt di D3** (`tools/docs-check.mjs`, il piano §2 e la risposta 4 di D.3), sul branch. Il checkpoint finale approva insieme il
  lavoro e il prompt.

**Regola d'arresto**: se la sessione si allunga, D2.3 si ferma a metà su un elenco nominato nel prompt di D3; D2.1 e D2.2 non cadono.

## Scrivere e verificare

Dopo ogni commit che tocca un documento citato da un'ancora o letto dal codice (`docs/DOCS-DEPENDENCY-MAP.md` §0, §B):
`node agent/proposals/governance/cli.mjs check`, `node --test agent/implement/selftest.mjs`, `node --test agent/detector/selftest.mjs`,
`node --test .control-room/selftest.mjs`. **Non lanciare il self-test del browser mentre scrivi file**: il suo controllo «byte-identical»
fallisce se il repository cambia durante l'esecuzione (D1 l'ha visto, e non era un difetto). Prima di ogni checkpoint la batteria del
piano §4. L'output dei validatori deve restare quello della base: un avvertimento nuovo è un rilievo. Una frase citata in un documento che lo
scanner delle credenziali legge come una coppia chiave-valore (D1, `5232941`) si riformula; la baseline non si alza.

## Cosa NON fare

- Non spostare, rinominare, fondere o cancellare un documento (solo D6 sposta, e solo i record chiusi).
- Non accorciare `AGENTS.md` (D4).
- Non cambiare una frase esistente per far posto all'intestazione; non riscrivere né riordinare le righe di §8.
- Non scrivere nel catalogo uno stato o un conteggio che ha già una casa.
- Non toccare `data/`, `i18n/`, `index.html` né le pagine pubblicate; non registrare una revisione di traduzione; non scrivere testo del
  livello rosso senza la sua riga di §8.
- Non modificare un'ancora, un pin o un test per farlo passare.

Vale «Cosa NON fare» del brief.

## Criterio di uscita e consegna

Completa quando:
- `docs/DOCUMENTATION-ARCHITECTURE.md` esiste e le sue regole sono approvate dall'autore in §8;
- `docs/README.md` cataloga ogni documento del perimetro e dice quali restano incerti;
- ogni documento scritto a mano in `docs/` porta l'intestazione standard, oppure è nominato nel prompt di D3 come ciò che resta;
- validatori, `selftest`, le suite, `.control-room/` e il controllo di governance passano, e ogni avvertimento nuovo è spiegato;
- **il prompt della sessione successiva (D3) esiste sul branch, porta questa stessa regola nel suo criterio di uscita ed è approvato con il
  lavoro; senza il prompt non si approva.**

Oppure l'autore decide di fermarsi: anche allora si scrive il prompt della successiva.

**Il calendario.** D6 chiude entro il 10 gennaio 2027 (§8, 25 nov 2026); se una sessione del programma è in corso il 10 gennaio, si ferma a un
checkpoint e il programma riprende dopo il giro delle regole di febbraio 2027.

**La Traccia M ha la precedenza alle sue tappe.** Rimisura la data prima di iniziare: `evidence-audit --as-of <oggi>` stampa
`STATUS_PREDATES_MILESTONE` dopo le tappe di `ai-act` (2 dic 2026), `pld` (9 dic) ed `eidas2` (24 dic) — misurato da D1 il 26 nov 2026: 0
righe; gli stati sono della sessione 25, 25.2 (`docs/prompts/v2-session-25.md`). Se una tappa è passata, dillo all'autore prima di iniziare:
decide lui se la sessione 25.2 viene prima. La finestra della sessione 25 si apre il 12 gennaio 2027.

Prima di chiudere, la checklist D2.1–D2.4: cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
