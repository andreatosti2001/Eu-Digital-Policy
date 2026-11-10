<!--
Provenance: the prompt of Post-v2 PV2-03 (block C, first prototype: the Editorial direction), drafted on 10 Nov 2026 by PV2-02
(docs/prompts/v2-pv2-02-frontend-references.md) on `claude/pv2-02-frontend-references`, as its last item under the standing rule of
docs/ROADMAP-v2.md §8 (4 Nov 2026). Drawn from docs/POST-V2.md §2, §3 (C), §4.1, §5, §6; docs/SESSION-ARCHITECTURE.md (Stage 2, G1);
docs/FRONTEND-REFERENCES.md (PV2-02's output); docs/DATA-READINESS.md (PV2-01's output); docs/ROADMAP-v2.md §8. The author's answers, in
the author's words, each recorded in §8 when given:
  1. "At G1 (Recommended)" — PV2-03 opens only once §8 records G1; the row of 10 Nov 2026 that let PV2-02 run before G1 keeps C behind it
     (§8, "PV2-02, B.4 question 1", df995f4).
  2. "A new unpublished folder (Recommended)" — the prototype lives in a new top-level folder the Pages allowlist does not list, such as
     `prototypes/editorial/`, never published; it reads `data/` in place and no baseline file is edited (§8, "PV2-02, B.4 question 2").
The decisions live in §8 and nowhere else; this file is the instruction text that cites them. It records no §8 row of its own and does not
open the session: PV2-03 records its scope in §8 as its first write. Written in Italian, as the author's session prompts are. The author
may change it before use.
-->

PV2-03 — Post-v2, blocco C, primo prototipo: la direzione Editoriale (una direzione implementata sulle stesse viste e sugli stessi stati
delle altre due, per il confronto; il frontend attuale resta la baseline), per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi `git rev-parse --is-shallow-repository`: se risponde
`true`, esegui `git fetch --unshallow` prima di qualunque suite.

**Verifica il gate, prima di ogni altra cosa.** PV2-03 si apre **solo al G1** (§8, «PV2-02, B.4 question 1»): cerca in `docs/ROADMAP-v2.md`
§8 la riga che registra G1 (`docs/SESSION-ARCHITECTURE.md` §2: il gate di `main` mostra C5, C7 e C10 ✓, e l'autore lo approva). **Se la riga
non c'è, fermati e dillo all'autore: C non è aperto.** La riga del 10 novembre 2026 che ha aperto PV2-02 prima del G1 non vale per C, che
scrive codice d'interfaccia. Non decidere, non presumere e non annunciare G1. Lo Stadio 1 era stato rinviato al 6 dicembre 2026 (§8, «Stage 1
is deferred»): ricorda all'autore la data se G1 non è ancora aperto.

Verifica che `main` contenga:
- `docs/POST-V2.md` (§3 parte C per intero, §4.1 riga PV2-03, §5);
- `docs/FRONTEND-REFERENCES.md` (l'uscita di PV2-02: la griglia, la matrice, la galleria, la shortlist proposta e le tre direzioni descritte)
  e `docs/DATA-READINESS.md` (l'uscita di PV2-01: le quattro schede e il contratto MC-1…MC-15);
- `docs/ROADMAP-v2.md` §8 con le righe di PV2-02 (ambito, la griglia, i sei candidati, l'approvazione del checkpoint finale e le risposte di
  B.4) **e la riga che registra G1**. Se manca una delle due ultime, C non è autorizzato: fermati e chiedi;
- questo prompt.

**Rimisura la data.** **Se è il 12 gennaio 2027 o dopo**, la finestra della Traccia M è aperta e le 33 regole scadono il 3 febbraio: dillo
all'autore per primo, perché la Traccia M ha la precedenza su ogni stadio. **Se è il 9 marzo 2027 o dopo**, la concessione di autonomia è
scaduta: dillo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of PV2-03 (Post-v2 C, the Editorial prototype)» con le parole con
cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande. Senza quella riga
non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di `docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/pv2-03-prototype-editorial`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare».
2. `docs/POST-V2.md` §3 C (le tre direzioni, le viste, i vincoli) e §5.
3. `AGENTS.md`, «Architecture — do not rebuild it»: nessun build step, nessuna dipendenza, nessun framework, nessuna richiesta a terzi;
   `tools/thirdparty.mjs` e `ALLOWED_RUNTIME_ORIGINS` (vuoto); la Content-Security-Policy (`docs/DEPLOYMENT.md`) e gli script inline con il loro
   hash. **Il prototipo non aggiunge una dipendenza né un font remoto, e non copia codice, asset o immagini di terzi.**
4. `docs/FRONTEND-REFERENCES.md` per intero, in particolare §5.1 (le prove dietro ogni punteggio), **§6 (i sette rilievi sulla griglia: G1…G7)**,
   §7 (la galleria), §8.2 (la direzione 1, Editoriale: che cosa prende, da dove, e che cosa non si ricostruisce senza una dipendenza) e la
   riga «un punto aperto» sui font di Tufte CSS.
5. `docs/DATA-READINESS.md` §6: il contratto MC-1…MC-15 è una **proposta** e non è implementato (è di D); ma una vista del prototipo che mostra
   una cifra **non** mostra un dato mancante come zero e **non** somma un valore sconosciuto (regole 5 e 6 di `AGENTS.md`).
6. `docs/DATA-GOVERNANCE.md` §1.2 e §2: una derivazione non si duplica in una seconda implementazione — il prototipo **importa** `js/format.js`,
   `js/pipeline.js`, `js/evidence-model.js`, `js/status.js`, non li riscrive.

Se ritieni che una decisione del brief, del piano o di §8 vada rivista, segnalalo e attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**Una direzione, implementata, nello stesso perimetro delle altre due.** `docs/POST-V2.md` §3 C: ogni direzione usa **gli stessi contenuti** e
**almeno quattro viste** — homepage, pagina di un regolamento, dashboard o timeline, pagina di un articolo — in desktop e mobile, tema chiaro e
scuro, **con stati vuoti e dati mancanti**. Si confronta prima di selezionare; il frontend attuale resta la baseline; **non si riscrivono insieme
struttura dei dati, modelli di evidenza e rendering**; la nuova interfaccia consuma i JSON canonici e mantiene i gate di pubblicazione, la CSP e
i test esistenti. Tre checkpoint:

- **C.1 · Le premesse e il perimetro del confronto.** Verifica le righe. Poi, con lo strumento di domande, **una domanda per volta, la
  raccomandazione per prima**: (a) **quali quattro viste concrete** (quale regolamento, quale articolo, se la quarta è la dashboard o la
  timeline) — scelte che PV2-04 e PV2-05 dovranno ripetere identiche; (b) **la shortlist**: la proposta di `docs/FRONTEND-REFERENCES.md` §8.1
  (Simple.css, USWDS, Tufte CSS, GOV.UK) è approvata, cambiata o respinta; (c) **il nome della cartella** (§8, «PV2-02, B.4 question 2»: una nuova
  cartella di primo livello non pubblicata, per esempio `prototypes/editorial/`): **si conferma con l'autore prima di scrivervi**. Verifica con
  `node tools/pages-artifact.mjs list` che la cartella scelta non sia nell'elenco, e che `tools/pages-artifact.mjs` non venga toccato.
  **Checkpoint.**
- **C.2 · I rilievi G1…G7 della griglia.** Se un'ancora della griglia serve a questo lavoro (per esempio C3 per le tabelle, C4 per il tema scuro),
  **non reinterpretarla**: porta la domanda all'autore. Un cambio di ancora o di peso richiede una riga di §8 con le sue parole.
- **C.3 · L'implementazione.** La direzione Editoriale di `docs/FRONTEND-REFERENCES.md` §8.2: una colonna di lettura di 65–85 caratteri a
  17–21 px, note in margine su schermo largo e in linea su schermo stretto, titoli rigorosamente sequenziali, un elenco «in questa pagina»,
  un'etichetta di stato solo dove un record ha uno stato. **Si costruisce con HTML, CSS e moduli ES vanilla.** Per ciascuna delle quattro viste:
  desktop (1280 px) e mobile (390 px), tema chiaro e scuro, **lo stato vuoto e il dato mancante** — «sconosciuto» mostrato diverso da zero, e un
  totale che porta con sé il conteggio di ciò che non può rendere conto (`js/pipeline.js` `aggregate()`). **Il tema scuro non ha un riferimento
  nei candidati** (USWDS e GOV.UK non lo offrono: `docs/FRONTEND-REFERENCES.md` §8.2): si progetta, e si dice che si è progettato.
- **C.4 · La misura.** Con la stessa batteria di misure di `docs/FRONTEND-REFERENCES.md` §4 (M1…M8) — le stesse, **non altre scelte dopo aver visto
  il risultato** — e con `node agent/browser/cli.mjs --require-browser` dove la cartella lo permette. Si registra ciò che la misura non vede.
- **C.5 · Il prompt della sessione successiva** — `docs/prompts/v2-pv2-04-prototype-observatory.md` (blocco C, seconda direzione, Policy
  observatory, `docs/POST-V2.md` §3 C e §4.1 PV2-04), sotto la regola permanente di §8. **Il checkpoint finale approva insieme il lavoro e il
  prompt; senza il prompt non si approva.**

**Regola d'arresto:** se la sessione si allunga, si riducono i *dettagli* delle viste, **non le quattro viste, non i due temi, non gli stati
vuoti e i dati mancanti**: senza di questi il confronto con le altre direzioni non è omogeneo, e `docs/POST-V2.md` §4.2 lo dice (il blocco C deve
garantire che le tre direzioni siano confrontate con gli stessi contenuti e nelle stesse condizioni, non soltanto che esistano tre homepage
dimostrative).

## Lo stato di partenza

Misurato da PV2-02 il 10 novembre 2026 su `main` `b705f15` e sul suo branch. **Rimisura tutto.**

| Fatto | Misura del 10 novembre 2026 |
|---|---|
| G1 | **non registrato** in §8; lo Stadio 1 è rinviato al **6 dicembre 2026**; C si apre solo al G1 |
| Uscita di B | `docs/FRONTEND-REFERENCES.md`: sei candidati verificati dal vivo e punteggiati sulla griglia approvata (Simple.css 56,25 · USWDS 52,5 · Tufte CSS 51,25 · GOV.UK 48,75 · Tabler 33,75\* · HTML5 UP 30\*); sette rilievi G1…G7 sulla griglia; shortlist e tre direzioni **proposte**, non decise |
| Che cosa nessun candidato mostra | un valore mancante diverso da zero; enunciato, fonte e stato come tre cose; i tre stati; una timeline di eventi giuridici datati — **si progettano sui contenuti del sito** |
| Baseline | misurata su tre criteri: C2 4 · C4 4 · C5 4; fuori griglia: sulla pagina dei dati il paragrafo è a 12,5 px e circa 150 caratteri per riga |
| Pubblicazione | l'allowlist di `tools/pages-artifact.mjs` elenca le pagine e le cartelle che caricano; **ogni altra cartella non è pubblicata** |
| Validatori | `validate.mjs` 0 errori · 5 avvertimenti; `evidence-audit.mjs` 0 errori; `tools/selftest.mjs` 143/143 |
| Concessione di autonomia | scade il 9 marzo 2027: si segnala, non si rinnova |

## Scrivere

- **Il prototipo vive solo nella cartella non pubblicata confermata in C.1.** Nessun file della baseline si modifica: `index.html`, le altre pagine,
  `style.css`, `css/`, `js/`, `i18n/`, `data/`, `app.js` restano come sono, e `tools/`, `agent/` e `docs/` cambiano solo per i documenti della sessione.
  Il prototipo **legge `data/` sul posto** e non ne copia i dati.
- **Nessuna dipendenza, nessun font remoto, nessuna richiesta a terzi**; nessun codice, asset, immagine o animazione di terzi. Un riferimento si
  studia per il pattern e si riscrive; dove la licenza lo consentirebbe e l'autore lo decide, un piccolo riuso porta l'attribuzione. Il carattere
  tipografico del prototipo è un tipo di sistema o un file locale la cui licenza si **legge** e si cita (`docs/FRONTEND-REFERENCES.md` §8.2, punto
  aperto sui font di Tufte CSS).
- **Una cifra non è mai uno zero per default e un valore sconosciuto non entra in una somma.** `null` ≠ `unknown`. Nessuna regola che scatta ≠
  nessun obbligo: dove nessuna regola scatta, la risposta è «non determinato».
- Le righe di §8 prima di ogni documento che dipende da una decisione; ogni risposta in §8 con le parole dell'autore, **committata subito**.
- Ogni commit che cambia un file pubblicato porta `Evidence:`; questa sessione non ne cambia nessuno (la cartella non è pubblicata).
- Prima di ogni checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`,
  `node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`. Prima del checkpoint finale anche le 25 suite e la suite del
  browser. Non scrivere nell'albero mentre la batteria gira. Una `agent/records/` locale non vuota fa fallire 3 test della suite governance che in
  CI passano: misurali con la cartella spostata, e dillo.

## Checkpoint

- **C.1:** le quattro viste, la shortlist e il nome della cartella, con le risposte dell'autore (righe §8); il rapporto in `docs/HANDOVER.md`.
  Attendi l'approvazione, registrata in §8. **Prima di quella riga non si scrive nella cartella del prototipo.**
- **Finale (C.3–C.5):** il prototipo, la sua misura e ciò che questa non vede; il prompt di PV2-04 (percorso, commit, risposte dell'autore); la
  checklist. Riscarica `origin/main` subito prima dell'ultima scrittura di `docs/HANDOVER.md`. **Senza il prompt di PV2-04 non si chiede
  l'approvazione.** Poi chiedi se aprire una pull request verso `main` e registra la sorte del branch.

## Cosa NON fare in questa sessione

- Non scegliere la direzione, non dichiarare vincitore un prototipo e non confrontare ancora: è PV2-05, con i tre prototipi e la decisione
  esplicita dell'autore. Non costruire le altre due direzioni.
- Non toccare la baseline, i dati canonici, i modelli di evidenza, il rendering attuale, la CSP, `ALLOWED_RUNTIME_ORIGINS` o `tools/pages-artifact.mjs`.
- Non implementare il controllo del contratto MC-1…MC-15 (è di D) né aggiungere uno strumento; non aprire D, E, S27 né la Fase 5.
- Non cambiare una delle ancore della griglia o dei pesi senza una riga di §8; non riaprire la scelta dei sei candidati.
- Non toccare lo Stadio 1, non decidere G1, non rinnovare la concessione di autonomia.
- Non toccare licenza, non affiliazione, assenza di consulenza legale, README. Non riscrivere la storia di `main`; non riscrivere un rapporto
  passato (si annota). Vale in pieno «Cosa NON fare» del brief.

## Lezioni delle sessioni precedenti e di PV2-02 (non ripeterle)

- **La data della sessione e il gate sono fatti da misurare**; la Traccia M ha la precedenza.
- **`origin/main` si muove durante la sessione**: riscarica prima di ogni scrittura di `docs/HANDOVER.md` e prima di aprire una PR.
- **Una misura di prova può sbagliare il bersaglio.** In PV2-02 il «testo del corpo» della baseline risultò due volte la cosa sbagliata (una nota
  in piccolo, poi l'elenco bibliografico) prima di una definizione difendibile: definisci la misura **prima**, applicala a tutti allo stesso modo,
  e se la cambi dopo aver visto un numero, dillo e tieni entrambi i risultati (`docs/FRONTEND-REFERENCES.md` §4, M1).
- **Una scansione statica sbaglia in entrambe le direzioni** (falsi positivi e falsi negativi): un caso piantato si fa girare.
- **Non dichiarare una verifica che non hai fatto**: un'accessibilità, un tema, un contrasto «verificati» vanno detti con la pagina letta, la
  misura e la data; ciò che il metodo non vede (un iframe di terzi, una transizione al passaggio del mouse) si dice.
- **Riavvii del worker**: ogni risposta in §8 committata subito; dopo un'interruzione, `git status` prima di rifare un comando.
  **Un clone superficiale non è un albero difettoso.** **Nessun output di agenti in `agent/records/` committato.**

## Criterio di uscita e consegna

La sessione è completa quando: G1 è registrato in §8 prima dell'avvio; le quattro viste, la shortlist e la cartella sono decise in §8 con le
parole dell'autore; la direzione Editoriale è implementata nella cartella non pubblicata, sulle quattro viste, in desktop e mobile, in tema
chiaro e scuro, con stati vuoti e dati mancanti; è misurata con le stesse misure di PV2-02 e si dice ciò che la misura non vede; nulla della
baseline, dei dati, dei modelli, della CSP o di `tools/pages-artifact.mjs` è cambiato e nulla di terzi è entrato nel repository; i checkpoint
sono approvati in §8; `selftest` e le 25 suite passano; **il prompt di PV2-04 esiste su questo branch, porta la stessa regola nel suo criterio
di uscita, ed è approvato con il lavoro** (regola permanente di §8, 4 nov 2026). Oppure l'autore decide di fermarsi: anche allora, **prima di
chiudere, si scrive il prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (C.1–C.5) cosa è stato scritto (file, righe di §8, commit), come
verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è completo, dichiaralo.
