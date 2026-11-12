<!--
Provenance: the prompt of Post-v2 PV2-05 (block C, third prototype: the Hybrid direction with its instance of the Regulatory Network
Explorer; the comparison of the three prototypes and of the two Explorer concepts; the author's explicit decision), drafted on 11 Nov 2026
by PV2-04 (docs/prompts/v2-pv2-04-prototype-observatory.md) on `claude/pv2-04-start-nhgcqx`, as its last item under the standing rule of
docs/ROADMAP-v2.md §8 (4 Nov 2026). Drawn from docs/POST-V2.md §3 C and §3 D (with their additions of 11 Nov 2026), §4.1, §5;
docs/FRONTEND-REFERENCES.md §1, §4, §8.2 and §9; docs/PROTOTYPES.md §0, §1 and §2 (PV2-03's and PV2-04's output); docs/SESSION-ARCHITECTURE.md
§1–§2 (G2); docs/ROADMAP-v2.md §8. The author's answers, in the author's words, each recorded in §8 when given:
  1. "prototypes/hybrid/ (Recommended)" — PV2-05's folder (§8, "PV2-04, C.5 questions 1–3").
  2. "Yes, layout A for all three (Recommended)" — the Hybrid takes the Editorial's layout A whole (same row).
  3. "Hybrid extras; never the comparison (Recommended)" — what may shrink if the session runs long (same row).
  And, from PV2-04: "Take layout A whole (Recommended)"; "Its presentation (Recommended)" (Knwler's, as a usage reference); "Free 3D network";
  "Free rotation (Recommended)"; "Treate the osservatorio as a draft" and "Record it as a draft, go on (Recommended)".
The decisions live in §8 and nowhere else; this file is the instruction text that cites them. It records no §8 row of its own and does not
open the session: PV2-05 records its scope in §8 as its first write. Written in Italian, as the author's session prompts are. The author
may change it before use.
-->

PV2-05 — Post-v2, blocco C, terzo prototipo e selezione: la direzione Ibrida con la sua istanza del Regulatory Network Explorer, il confronto
omogeneo dei tre prototipi e dei due concept dell'Explorer, e la decisione esplicita dell'autore, per EU Digital Policy v2.0

> **Nota del 12 novembre 2026 (HP-01), da leggere prima di tutto.** La vista **homepage** di questo prompt è sostituita dal prototipo
> `prototypes/homepage/`, scelto dall'autore per quella vista (`docs/ROADMAP-v2.md` §8, «HP-01: the homepage prototype built», punto 2:
> «Supersedes homepage only (Recommended)»). PV2-05 costruisce e confronta solo le altre tre viste — pagina di un regolamento, pagina di un
> articolo, vista analitica — e la selezione riguarda quelle. **PV2-05 viene dopo HP-02** (`docs/prompts/v2-hp-02-homepage-follow-up.md`;
> «Homepage follow-up first (Recommended)»). Il resto del prompt vale com'è scritto.

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi `git rev-parse --is-shallow-repository`: se risponde
`true`, esegui `git fetch --unshallow` prima di qualunque suite.

**Verifica le righe, prima di ogni altra cosa.** In `docs/ROADMAP-v2.md` §8 devono esserci: «G1: Stage 2 is opened»; le righe di PV2-03
(fino a «The reworked Editorial approved, look A»); le righe di PV2-04 — ambito, «PV2-04, C.1 question 1», «Checkpoint C.1 of PV2-04 approved»,
le righe del rifacimento («still to fix», «what to fix», «option A and the form of the 3D Explorer», «the layout the author sent, and the Knwler
screenshot», «the observatory is a draft», «the tilt and what draft means»), «PV2-04, C.5 questions 1–3» — **e la riga che approva il checkpoint
finale di PV2-04**. Se manca quest'ultima, PV2-05 non è autorizzato: fermati e chiedi. Verifica che `main` contenga `prototypes/editorial/`,
`prototypes/observatory/`, `docs/PROTOTYPES.md` §2 e questo prompt.

**Rimisura la data.** **Se è il 12 gennaio 2027 o dopo**, la finestra della Traccia M è aperta e le 33 regole scadono il 3 febbraio: dillo
all'autore per primo, perché la Traccia M ha la precedenza. **Se è il 9 marzo 2027 o dopo**, la concessione di autonomia è scaduta: dillo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of PV2-05 (Post-v2 C, the Hybrid prototype and the selection)» con
le parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di `docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/pv2-05-prototype-hybrid`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare».
2. `docs/POST-V2.md` §3 C e §3 D **con le aggiunte dell'11 novembre 2026** (che cosa l'Explorer deve mostrare; i vincoli sui dati: solo
   strumenti come nodi, solo `relationships` come archi, nessuna relazione inventata, nessun raggruppamento calcolato, l'alternativa
   accessibile), §4.1 (la riga di PV2-05) e §5.
3. `AGENTS.md`, «Architecture — do not rebuild it»: nessun build step, nessuna dipendenza, nessun framework, nessuna libreria di grafi,
   nessuna richiesta a terzi; la Content-Security-Policy (`docs/DEPLOYMENT.md` §4).
4. `docs/FRONTEND-REFERENCES.md` §1 (la griglia), §4 (M1…M8; M4 letto sull'albero completo, §8 «PV2-03, grid C4 step 4»), §8.2 **direzione 3,
   Ibrida**, §9.
5. **`docs/PROTOTYPES.md` §0, §1 e §2 per intero**: il perimetro comune, le due direzioni costruite, le loro misure, i casi piantati, ciò che la
   misura non vede. **L'Osservatorio arriva come bozza** (§8, «the observatory is a draft»): lo si confronta come tale e non lo si rifinisce
   senza una riga di §8.
6. `docs/SESSION-ARCHITECTURE.md` §1–§2: la selezione di PV2-05 è **una** delle tre condizioni di G2; le altre due (S27 approvata, la Fase 5
   aperta su E5-1…E5-7) non sono di questa sessione.

Se ritieni che una decisione del brief, del piano o di §8 vada rivista, segnalalo e attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**La terza direzione nello stesso perimetro delle prime due**, in `prototypes/hybrid/` (§8, «PV2-04, C.5 questions 1–3»): homepage; pagina
dell'AI Act con il Chips Act come stato vuoto; Parte V del brief come articolo; la timeline come vista analitica con l'Explorer come modalità e
la tabella delle relazioni come sua alternativa — a 1280 e 390 px, tema chiaro e scuro, stati vuoti e dati mancanti. **Poi il confronto dei tre
prototipi e dei due concept dell'Explorer, e la decisione esplicita dell'autore.** Checkpoint:

- **C.1 · Le premesse.** Verifica le righe. Verifica con `node tools/pages-artifact.mjs list` che `prototypes/` non sia nell'elenco e che
  `tools/pages-artifact.mjs` non venga toccato. Poi, con lo strumento di domande, **una domanda per volta, la raccomandazione per prima**, ciò
  che il concept Ibrido dell'Explorer lascia all'autore: **in che cosa si distingue da quello dell'Osservatorio** (il §3 C chiede che i due
  concept rappresentino gli stessi dati con le stesse interazioni essenziali, e che si confrontino la gerarchia informativa e la presentazione
  visiva: per esempio 2D o 3D, la composizione della scena, il raggruppamento — da campi già presenti, mai da un algoritmo di comunità); e
  **come si svolge il confronto di C.5** (che cosa si mostra all'autore, in che ordine, con quali misure accanto). **Checkpoint.** Prima della
  riga che lo approva non si scrive nella cartella.
- **C.2 · La griglia.** Le ancore e i pesi non cambiano. Un'ancora che sembri chiedere una lettura nuova si porta all'autore (§1.1, regola 9).
- **C.3 · L'implementazione.** La direzione 3 di `docs/FRONTEND-REFERENCES.md` §8.2: l'apertura editoriale e la pagina dell'articolo nella
  colonna della direzione 1; le pagine strumento e la vista analitica nella disposizione tabellare della direzione 2; un solo insieme di token
  per i due temi; la disciplina di un solo foglio di stile leggibile. **Il layout è l'A dell'Editoriale, intero** (§8, «PV2-04, C.5 questions
  1–3», e prima «the layout the author sent»): l'intestazione con le viste, la colonna dei numeri romani, «In questa pagina» a sinistra,
  l'albero-portale come nell'Editoriale. **L'Explorer Ibrido** rispetta lo stesso nucleo: nodi = strumenti, archi = `relationships` letto in
  posto; tipologia con più di un segnale visivo; direzione **solo** dove `symmetric` è `false`; pannello laterale a schede; legenda sempre
  visibile; un campo assente è «non registrato»; disposizione **deterministica**, mai da un algoritmo di rilevamento di comunità; il mobile non è il
  canvas rimpicciolito; nessun movimento che parta da solo. **Riusa `prototypes/observatory/explorer.js` dove può** (una sola sede: §8, risposta
  3) e ciò che cambia è il concept deciso a C.1. **La tabella delle relazioni è la stessa delle altre due direzioni**: si importa
  `prototypes/editorial/relations.js`.
- **C.4 · La misura.** Gli stessi campioni — **E = la pagina dell'articolo, D = la timeline in entrambe le modalità** (come in
  `docs/PROTOTYPES.md` §2.3) — nominati prima di leggere un numero; M1…M8 come scritti nel §4 (gli script di PV2-03 e PV2-04 non sono nel
  repository: si riscrivono dal testo, e lo si dice); `node agent/browser/cli.mjs --require-browser` per la baseline. **I casi piantati di
  `docs/PROTOTYPES.md` §1.4 e §2.5, ripetuti.** Si registra in `docs/PROTOTYPES.md` §3, con ciò che la misura non vede. **Mostra all'autore gli
  screenshot prima del confronto**, non dopo.
- **C.5 · Il confronto e la decisione.** Il confronto dei tre prototipi sulle stesse viste e condizioni, **per passi e non per totale** (§8,
  «grid finding G7»), con ciò che ciascuno non raggiunge; il confronto dei due concept dell'Explorer (Osservatorio e Ibrido) sulle stesse
  interazioni essenziali; **le immagini e le misure accanto, nessuna raccomandazione presentata come decisione**. Poi **la decisione esplicita
  dell'autore**, con le sue parole, in §8: quale direzione (o quale combinazione) porta in D, e quale concept dell'Explorer va in PV2-08. Un
  rifiuto di tutte e tre è una risposta possibile e si registra come tale. **Questa decisione non apre G2 da sola** (`docs/SESSION-ARCHITECTURE.md`
  §2): lo si dice.
- **C.6 · Il prompt della sessione successiva** — quella che `docs/SESSION-ARCHITECTURE.md` indica a quel momento (S27, se non è stata
  eseguita; altrimenti la prima che G2 apre), sotto la regola permanente di §8. **Il checkpoint finale approva insieme il lavoro e il prompt;
  senza il prompt non si approva.**

**Regola d'arresto** (§8, «PV2-04, C.5 questions 1–3»): **non si riducono mai** le quattro viste, i due temi, gli stati vuoti e i dati mancanti,
il **nucleo dell'Explorer** (canvas con nodi e archi selezionabili, tipologia con più di un segnale, direzione, pannello a schede, legenda sempre
visibile, la tabella come alternativa accessibile, tastiera e 390 px), **il confronto a tre e la decisione esplicita dell'autore**. **Possono
ridursi** gli accessori dell'Explorer Ibrido (zoom e pan, ricerca, filtri per tipologia, messa a fuoco del vicinato, riordino del layout,
raggruppamento). Ciò che si riduce si dice in `docs/PROTOTYPES.md` §3.

## Lo stato di partenza

Misurato da PV2-04 l'11 novembre 2026 sul suo branch. **Rimisura tutto.**

| Fatto | Misura dell'11 novembre 2026 |
|---|---|
| G1 | registrato in §8 l'11 novembre 2026 |
| Uscita di PV2-03 | `prototypes/editorial/`, look A; passi C1 3 · C2 4 · C3 2 · C4 4 · C5 4 · C6 non punteggiato (`docs/PROTOTYPES.md` §1.6) |
| Uscita di PV2-04 | `prototypes/observatory/`, **una bozza**: layout A intero, l'Explorer in 3D nella presentazione di Knwler; passi C1 4 · C2 4 · C3 4 · C4 4 · C5 4 · C6 non punteggiato; 23 casi piantati superati (`docs/PROTOTYPES.md` §2) |
| Che cosa la griglia non vede | l'estetica: l'autore ha giudicato tre versioni dell'Osservatorio e la prima dell'Editoriale, tutte ai loro passi |
| Dati | 39 strumenti, 40 relazioni (9 simmetriche; 31 con `requires_verification`, vero su nessuna), 8 strumenti senza relazioni, 101 eventi, 187 claims, 21 record di enforcement |
| Validatori | `validate` 0 errori · 5 avvertimenti; `evidence-audit` e `freshness --as-of` exit 0; `tools/selftest.mjs` 176/176 |
| Suite | vedi la batteria di PV2-04 in `docs/HANDOVER.md` |
| S27 | prompt `docs/prompts/v2-session-27.md`; non eseguita all'11 novembre 2026 |
| Concessione di autonomia | scade il 9 marzo 2027: si segnala, non si rinnova |

## Scrivere

- **Il prototipo vive solo in `prototypes/hybrid/`.** Nessun file della baseline si modifica; `prototypes/editorial/` e `prototypes/observatory/`
  restano come sono: un difetto trovato lì si segnala all'autore e si corregge solo su una riga di §8. Il prototipo **legge `data/` e `index.html`
  sul posto**.
- **Nessuna dipendenza, nessun font remoto, nessuna richiesta a terzi**; nessun codice, asset, immagine o animazione di terzi (Knwler resta un
  riferimento d'uso); nessuno script inline né attributo `style`; la CSP del sito con `script-src 'self'`.
- **Una cifra non è mai uno zero per default e un valore sconosciuto non entra in una somma.** `null` ≠ `unknown`. Nessuna regola che scatta ≠
  nessun obbligo. Le cifre delle multe escono da `finesFigure()` di `js/pipeline.js`.
- Le righe di §8 prima di ogni documento che dipende da una decisione; ogni risposta in §8 con le parole dell'autore, **committata subito**.
- Prima di ogni checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`,
  `node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`. Prima del checkpoint finale anche le 25 suite e la suite del browser.
  Non scrivere nell'albero mentre la batteria gira. Una `agent/records/` locale non vuota fa fallire 3 test della suite governance: misurali con la
  cartella spostata, e dillo.
- **Nessun identificativo di modello nei messaggi di commit** (`AGENTS.md`, «Git»).

## Checkpoint

- **C.1:** le premesse e le risposte sul concept Ibrido dell'Explorer e sul modo del confronto (righe §8); il rapporto in `docs/HANDOVER.md`.
  Attendi l'approvazione, registrata in §8.
- **C.5 (decisione):** la riga di §8 con la scelta dell'autore, con le sue parole.
- **Finale (C.2–C.6):** il prototipo, la sua misura e ciò che questa non vede (`docs/PROTOTYPES.md` §3); il confronto; la decisione; ciò che la
  regola d'arresto ha ridotto, se qualcosa; il prompt della sessione successiva (percorso, commit, risposte dell'autore); la checklist. Riscarica
  `origin/main` subito prima dell'ultima scrittura di `docs/HANDOVER.md`. Poi chiedi se aprire una pull request verso `main` e registra la sorte del
  branch.

## Cosa NON fare in questa sessione

- Non decidere al posto dell'autore: nessun vincitore dichiarato dalla sessione, nessun totale che scelga da solo.
- Non toccare la baseline, `prototypes/editorial/`, `prototypes/observatory/`, i dati canonici, i modelli di evidenza, il rendering attuale, la CSP,
  `ALLOWED_RUNTIME_ORIGINS` o `tools/pages-artifact.mjs`. Non aggiungere uno strumento, una relazione o un campo a `data/` per far apparire la rete
  più ricca.
- Non costruire l'Explorer pubblicato (è PV2-08), non aprire D, E, S27 né la Fase 5, non registrare G2.
- Non cambiare un'ancora o un peso della griglia senza una riga di §8.
- Non toccare licenza, non affiliazione, assenza di consulenza legale, README. Non riscrivere la storia di `main`; non riscrivere un rapporto
  passato (si annota). Vale in pieno «Cosa NON fare» del brief.

## Lezioni di PV2-04 (non ripeterle)

- **Mostra gli screenshot presto e spesso.** In PV2-04 l'autore ha giudicato quattro versioni; ogni giudizio è arrivato dagli screenshot, non
  dalle misure, che erano ai passi massimi già alla prima.
- **Il layout è dell'autore, e l'autore lo ha detto con immagini.** Due volte l'autore ha risposto con uno screenshot senza parole: chiedi come
  leggerlo, con opzioni, prima di costruire; registra in §8 l'immagine descritta e le parole della risposta.
- **Una disposizione 3D si regola sulla scena, non sui numeri**: un raggruppamento attratto da relazioni tra gruppi si schiaccia (in PV2-04 i gruppi
  si sono separati solo tenendo ciascuno in una sfera propria); una vista che non riempie il riquadro sembra vuota. Guarda la scena dopo ogni modifica.
- **M1 non legge il corpo di una pagina tabellare**: su D legge il piè di pagina o una nota. Si registra, non si corregge la misura.
- **Il primo Tab non arriva all'Explorer**: M3 e M4 si fermano alla colonna dei numeri; i nodi dell'Explorer vanno misurati a parte (PV2-04: 39 di 39
  con nome).
- **Riavvii del worker**: ogni risposta in §8 committata subito; dopo un'interruzione, `git status` prima di rifare un comando; una domanda rimasta
  aperta a un riavvio si ripone. **Nessun output di agenti in `agent/records/` committato.**

## Criterio di uscita e consegna

La sessione è completa quando: la riga di approvazione finale di PV2-04 è in §8 prima dell'avvio; le risposte di C.1 sono in §8 con le parole
dell'autore; la direzione Ibrida è implementata in `prototypes/hybrid/`, sulle quattro viste, in desktop e mobile, in tema chiaro e scuro, con stati
vuoti e dati mancanti, con l'Explorer nella vista analitica e la tabella delle relazioni come sua alternativa, almeno nel nucleo che la regola
d'arresto tiene fermo; è misurata con le stesse misure e gli stessi casi piantati e si dice ciò che la misura non vede (`docs/PROTOTYPES.md` §3); il
confronto a tre e quello dei due concept sono stati mostrati all'autore e **la sua decisione esplicita è in §8 con le sue parole**; nulla della
baseline, delle altre due cartelle, dei dati, dei modelli, della CSP o di `tools/pages-artifact.mjs` è cambiato e nulla di terzi è entrato nel
repository; i checkpoint sono approvati in §8; `selftest` e le 25 suite passano; **il prompt della sessione successiva esiste su questo branch, porta la
stessa regola nel suo criterio di uscita, ed è approvato con il lavoro** (regola permanente di §8, 4 nov 2026). Oppure l'autore decide di fermarsi:
anche allora, **prima di chiudere, si scrive il prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (C.1–C.6) cosa è stato scritto (file, righe di §8, commit), come verificarlo
a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è completo, dichiaralo.
