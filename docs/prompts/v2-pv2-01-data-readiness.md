<!--
Provenance: the prompt of Post-v2 PV2-01 (block A, data readiness), drafted on 9 Nov 2026 in the session that carried Stage 1
(docs/prompts/v2-stage-1-operational-closure.md) on `claude/kind-maxwell-e31dud`, on the author's request "ok, prepara prompt
(session 26) per Blocco A" and on the author's question "posso proseguire al blocco A,B,C prima della conclusione dello stage
1? Senza alterare niente?" (§8, "Post-v2 A may open before G1…"). NUMBERING: the author wrote "session 26"; in this
repository S26 is the second half of Track M's reading of the 33 rules (docs/SESSION-ARCHITECTURE.md, docs/prompts/v2-session-25.md),
a different session, so this prompt is named for its work, PV2-01, as docs/prompts/v2-session-27.md's own numbering rule says
("From 27, numbers name work"). Drawn from docs/POST-V2.md §2, §3 (A), §4.1, §6; docs/SESSION-ARCHITECTURE.md (Stage 2);
docs/ROADMAP-v2.md §8 (v2 Session 25, 25.5 questions 1 and 4; the standing rule of 4 Nov 2026; the rows of 6 Nov 2026).
The starting state was measured on `main` `ba8ddcf` on 9 Nov 2026. The decisions live in §8 and nowhere else; this file is the
instruction text that cites them. It records no §8 row of its own and does not open the session: PV2-01 records its scope in §8 as its
first write. Written in Italian, as the author's session prompts are. The author may change it before use.
-->

PV2-01 — Post-v2, blocco A: la data readiness (l'inventario dei dataset, le metriche candidate e il contratto delle metriche,
prima di qualunque dashboard o infografica), per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

Verifica che `main` contenga:
- `docs/POST-V2.md` (§2 con la nota del 5 novembre 2026, §3 parte A, §4.1 riga PV2-01, §6);
- `docs/SESSION-ARCHITECTURE.md` (Stadio 2: «A produces an audit and a metric contract, **no value estimated or generated to fill a
  gap**»);
- `docs/ROADMAP-v2.md` §8 con le righe «v2 Session 25, 25.5 question 1» e «question 4», e **la riga «Post-v2 A may open before
  G1…»** (9 novembre 2026). Se quest'ultima manca, A non è autorizzata prima di G1: fermati e chiedi;
- questo prompt.

**Verifica lo stato di G1.** G1 (`docs/SESSION-ARCHITECTURE.md` §2) apre lo Stadio 2 quando il gate di `main` mostra C5, C7 e C10 ✓.
Controlla la riga «G1» in §8: se c'è, A gira sotto G1; se non c'è, gira sotto la riga di anticipo del 9 novembre e **nient'altro
dello Stadio 2 (B, C, S27) è aperto**. Dillo nella riga d'ambito.

**Rimisura la data, prima di ogni altra cosa.** **Se è il 12 gennaio 2027 o dopo**, la finestra della sessione 25 (Traccia M,
12 gennaio – 2 febbraio 2027) è aperta e le 33 regole scadono il 3 febbraio: dillo all'autore per primo, perché la Traccia M ha la
precedenza su ogni stadio. **Se è il 9 marzo 2027 o dopo**, la concessione di autonomia è scaduta: dillo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of PV2-01 (Post-v2 A, data readiness)» con le parole con
cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande. Senza
quella riga non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di `docs/HANDOVER.md`
(`origin/claude/stage-1-decision` o un branch `release/…` dello Stadio 1 possono comparire: sono dello Stadio 1, non tuoi).

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/pv2-01-data-readiness`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare» — in particolare «Non dichiarare "sicurezza operativa dimostrata"…».
2. `docs/POST-V2.md` §2, §3 (parte A per intero), §5 e §6.
3. `docs/EVIDENCE-MODEL.md` e `docs/DATA-GOVERNANCE.md`: una sola sede per ogni fatto, derivazione invece di conservazione, i tre
   stati. Il contratto delle metriche **non è una seconda sede** di ciò che questi documenti già stabiliscono.
4. `docs/HEALTH-MONITOR.md` e `agent/health/model.mjs` (`node agent/health/cli.mjs --metrics`): il registro di 44 metriche in tre
   domini, **e le cinque contrassegnate `not_a_score`**. Qui esiste già una sede delle metriche *dell'ambiente*; una metrica del
   contratto non la riscrive né la duplica, e lo dichiara dove le due si toccano.
5. `data/*.json`: per ciascun dataset, `$description` e `$note` (l'invariante non ovvio vive nel `$note`); `js/status.js`,
   `js/evidence-model.js`, `js/pipeline.js`, `js/regulatory-model.js` e `js/format.js` come **sedi delle derivazioni a render time**:
   grado di evidenza, fasi della pipeline di enforcement, autorità competente, date chiave.
6. `AGENTS.md`, «The rules that matter most» 1–8 (in particolare: `null` ≠ `unknown`, **unknown non è mai zero**, nessuna regola
   che scatta ≠ nessun obbligo).

Se ritieni che una decisione del brief, del piano o di §8 vada rivista, segnalalo e attendi conferma. Non reinterpretare in
silenzio.

## Obiettivo della sessione

**L'audit e la proposta di contratto delle metriche, in `docs/`, e nient'altro.** Non si costruisce una visualizzazione: sono un gate
successivo (`docs/POST-V2.md` §3 A). **Nessun valore stimato o generato per riempire un buco**; dove il dato non c'è, la metrica lo
dice e non si calcola. Due checkpoint:

- **A.1 · Le premesse e le metriche che l'autore vuole mostrare** — si verifica che le righe ci siano; poi si chiede all'autore,
  con lo strumento di domande, **una domanda per volta, la raccomandazione per prima**: quali domande vuole che il sito sappia
  mostrare (le candidate possibili partono da ciò che i dati già contano: strumenti per stato, azioni di enforcement per fase e per
  esito, claim per tipo e grado di evidenza, scadenze, copertura di prosa; ma **la lista la decide l'autore**, non la sessione).
- **A.2 · L'inventario dei dataset** — per ciascuno dei dieci file di `data/` (e per le sue relazioni, se ne ha): record contati
  prima di scrivere, campi, chi li scrive e chi li legge, che cosa vi significano `null`, `unknown`, assente, non applicabile e non
  verificato, dove la sede è già una derivazione a render time, e quale metrica del registro di salute (`agent/health/`) già misura
  qualcosa di vicino. Misurato con un parser di prova **fuori dal repository** (nello scratchpad); **nulla in `data/` cambia**.
  **Checkpoint.**
- **A.3 · Le metriche candidate** — una scheda per ciascuna metrica che l'autore ha scelto in A.1, con tutto ciò che
  `docs/POST-V2.md` §3 A elenca: la domanda a cui risponde e la sua definizione operativa; campi e record sorgente con il
  collegamento alla fonte; formula, denominatore e unità; periodo e data «as of»; criteri di inclusione ed esclusione; il
  significato di zero, `null`, sconosciuto, non applicabile e non verificato; limiti di copertura, confrontabilità e
  aggiornamento; livello e stato dell'evidenza; **un caso piantato che fa fallire una proprietà essenziale** (come
  `docs/ATTESTATION-FORM.md` §5), su carta. Per ogni scheda, **che cosa la metrica non può dire**: una metrica con denominatore
  incerto non produce un numero, produce «non determinabile».
- **A.4 · Il contratto delle metriche, proposto** — lo schema che una metrica deve soddisfare per poter essere mostrata, con
  l'elenco delle proprietà, ciascuna con la regola esatta che un controllo applicherebbe, il caso piantato che la fa fallire e
  ciò che il controllo non può vedere. **È una proposta**: il controllo non si implementa qui (è di D, `docs/POST-V2.md` §3 D e
  PV2-08). Le scelte di disegno all'autore, una domanda per volta.
- **A.5 · Il prompt della sessione successiva** — `docs/prompts/v2-pv2-02-frontend-references.md` (blocco B, `docs/POST-V2.md` §3 B
  e §4.1 PV2-02: la griglia pubblicata **prima** della ricerca, nulla adottato), sotto la regola permanente di §8.
  **Il checkpoint finale approva insieme il lavoro e il prompt; senza il prompt non si approva.**

**Regola d'arresto:** se la sessione si allunga, la scheda A.3 si limita alle metriche che l'autore ha messo in cima; **A.2 e A.4 non
si spostano**, perché senza inventario e senza contratto non c'è data readiness.

## Lo stato di partenza

Misurato il 9 novembre 2026 su `main` `ba8ddcf`. **Rimisura tutto.**

| Fatto | Misura del 9 novembre 2026 |
|---|---|
| Dataset in `data/` | 10 file: `applicability` 33 regole · `brief` 13 parti e 20 voci di `reading_graph` · `claims` 182 · `enforcement` 21 · `glossary` 15 · `institutions` 21 · `instruments` 39 con 40 relazioni · `sources` 226 · `taxonomy` 35 vocabolari · `timeline` 101 eventi |
| Claim per tipo | interpretation 22 · law 67 · fact 64 · critique 13 · derived 5 · attributed 11 |
| Stato dell'evidenza dei claim | unverified 15 · direct 139 · partial 21 · disputed 1 · derived 5 · context-only 1 |
| Grado derivato | primary 68 · official 46 · secondary 13 · derived 5 · attributed 10 · interpretation 35 · unresolved 5 |
| Freschezza dei claim | fresh 151 · review-due 9 · aging 21 · stale 1 (rischio: low 35 · medium 128 · high 19) |
| Record non verificati o con `requires_verification` | 45 (`validate.mjs`; il numero cambia facendo verifica, ed è legato alle metriche `not_a_score` del registro di salute: non si ottimizza) |
| Registro delle metriche di salute | 44 metriche in tre domini, 5 contrassegnate `not_a_score` |
| Validatori | `validate.mjs` 0 errori · 5 avvertimenti; `evidence-audit.mjs` 0 errori |
| Stadio 1 | in corso: `readiness` 17 su 20, il registro delle decisioni è ancora assente su `main`; **A non dipende da G1** |
| Concessione di autonomia | scade il 9 marzo 2027: si segnala, non si rinnova |

## Scrivere

- **Solo `docs/`.** Nessuna modifica a `data/`, `tools/`, `js/`, `i18n/`, a una pagina, a uno stile o ad `agent/`. L'inventario si
  misura fuori dal repository; nessuno strumento nuovo entra nel repository in questa sessione.
- Le righe di §8 prima di ogni documento che dipende da una decisione; ogni risposta in §8 con le parole dell'autore, **committata
  subito**.
- **Nessun valore stimato, interpolato o generato.** Una metrica con un buco lo dichiara. `null` (non ricercato) e `unknown`
  (ricercato e non determinabile) non si rendono uguali e **unknown non è mai zero**: non entra in una somma.
- Ogni commit che cambia un file pubblicato porta `Evidence:`; questa sessione non ne cambia nessuno. `docs/` non è pubblicata.
- Prima di ogni checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`,
  `seo-audit`, `node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`. Prima del checkpoint finale anche le
  25 suite. Non scrivere nell'albero mentre la batteria gira.
- Una `agent/records/` locale non vuota fa fallire 3 test della suite governance che in CI passano: misurali con la cartella
  spostata, e dillo.

## Checkpoint

- **A.2:** l'inventario, con le risposte dell'autore di A.1 (righe §8) e i casi piantati; il rapporto in `docs/HANDOVER.md`.
  Attendi l'approvazione, registrata in §8.
- **Finale (A.3–A.5):** le schede, il contratto proposto e le scelte decise; il prompt di PV2-02 (percorso, commit, risposte
  dell'autore); la checklist. Riscarica `origin/main` subito prima dell'ultima scrittura di `docs/HANDOVER.md`. **Senza il prompt di
  PV2-02 non si chiede l'approvazione.** Poi chiedi se aprire una pull request verso `main` e registra la sorte del branch.

## Cosa NON fare in questa sessione

- Non costruire, abbozzare o prototipare una dashboard, un grafico o un'infografica: sono D (PV2-08) e un gate successivo.
- Non scegliere un riferimento frontend, un layout o un'estetica: è B e C. Non aprire B né C, né S27, né la Fase 5.
- Non cambiare un record di `data/`, né aggiungere un campo, un vocabolario o un termine a `data/taxonomy.json`; non implementare il
  controllo del contratto (è di D); non aggiungere uno strumento.
- Non riscrivere né duplicare il registro di salute (`agent/health/`), il modello di evidenza o la sede di una derivazione: si
  cita, si collega, e si dichiara dove si toccano.
- Non ottimizzare le cinque metriche `not_a_score`, e non proporre di farle scendere con un'azione che il sito vieta (azzerare
  `requires_verification`, mettere un sostituto plausibile, bollare in blocco `last_verified`).
- Non toccare lo Stadio 1: il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale,
  `ALLOWED_RUNTIME_ORIGINS`, le impostazioni di GitHub; non rinnovare la concessione di autonomia; D-5 è rinviato: non scegliere né
  installare un CMS.
- Non dichiarare «sicurezza operativa dimostrata» né che G1 regga: A gira prima o accanto a G1 e non lo decide.
- Non toccare licenza, non affiliazione, assenza di consulenza legale, README. Non riscrivere la storia di `main`; non riscrivere
  un rapporto passato (si annota). Vale in pieno «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–25 e dello Stadio 1 (da `docs/HANDOVER.md`; non ripeterle)

- **La data della sessione è un fatto da misurare**; la Traccia M ha la precedenza.
- **`origin/main` si muove durante la sessione**: riscarica prima di ogni scrittura di `docs/HANDOVER.md` e prima di aprire una PR;
  se la PR del branch è già fusa, il lavoro nuovo va su una nuova PR, ribasato.
- **`selftest` fissa ciò che cambi**; **conta prima di scrivere**; **non dichiarare una correzione che non hai fatto**.
- **Un percorso mai eseguito non è un percorso che funziona**: lo Stadio 1 ha trovato che Agent 9 rifiutava ogni proposta, perché
  i test usavano un applicatore finto. Per una metrica, il caso piantato che la fa fallire si fa girare, non si descrive soltanto.
- **Un controllo che una dichiarazione può soddisfare è un buco**: «not_applicable» ha reso «tutte e 12 le condizioni
  soddisfatte» e il gate avversariale l'ha preso. Un contratto di metriche che accetta «non applicabile» senza una regola esatta fa lo
  stesso.
- **Riavvii del worker**: ogni risposta in §8 committata subito; dopo un'interruzione, `git status` prima di rifare un comando.
  **Un clone superficiale non è un albero difettoso.** **Nessun output di agenti in `agent/records/` committato.**

## Criterio di uscita e consegna

La sessione è completa quando: l'inventario di A.2 è scritto e approvato in §8; le metriche scelte dall'autore hanno la loro scheda
(o, per la regola d'arresto, le altre sono nominate con la ragione); il contratto di A.4 è proposto, con la regola esatta, il caso
piantato e il limite di ciascuna proprietà; nessun valore è stato stimato o generato e nulla fuori da `docs/` è cambiato; i
checkpoint sono approvati in §8; `selftest` e le 25 suite passano; **il prompt di PV2-02 esiste su questo branch, porta la stessa
regola nel suo criterio di uscita, ed è approvato con il lavoro** (regola permanente di §8, 4 nov 2026). Oppure l'autore decide di
fermarsi: anche allora, **prima di chiudere, si scrive il prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (A.1–A.5) cosa è stato scritto (file, righe di §8, commit),
come verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è completo,
dichiaralo.
