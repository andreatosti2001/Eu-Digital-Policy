<!--
Provenance: the prompt of Post-v2 PV2-02 (block B, open-source frontend references), drafted on 9 Nov 2026 by PV2-01
(docs/prompts/v2-pv2-01-data-readiness.md) on `claude/pensive-bell-665v9z`, as its last item under the standing rule of
docs/ROADMAP-v2.md §8 (4 Nov 2026). Drawn from docs/POST-V2.md §2, §3 (B), §4.1, §5, §6; docs/SESSION-ARCHITECTURE.md (Stage 2,
G1); docs/DATA-READINESS.md (PV2-01's output); docs/ROADMAP-v2.md §8. The author's answers, in the author's words, each recorded
in §8 when given:
  1. "At G1, as planned (Recommended)" — PV2-02 opens only once §8 records G1 (§8, "PV2-01, A.5 question 1", e176634).
  2. "Approved before research (Recommended)" — the grid is the first checkpoint, approved before any candidate is researched;
     this answers docs/POST-V2.md §6 question 3 (§8, "A.5 question 2", e176634).
  3. "Listed, not scored (Recommended)" — a candidate that cannot be verified live is listed, not scored, and cannot enter the
     shortlist (§8, "A.5 question 3", 9640461).
  4. "Described, not committed (Recommended)" — screenshots stay in the scratchpad; the matrix describes in words
     (§8, "A.5 question 4", 3d35ca5).
The decisions live in §8 and nowhere else; this file is the instruction text that cites them. It records no §8 row of its own
and does not open the session: PV2-02 records its scope in §8 as its first write. Written in Italian, as the author's session
prompts are. The author may change it before use.
-->

PV2-02 — Post-v2, blocco B: i riferimenti frontend open source (la griglia approvata prima della ricerca, la matrice dei
repository, nulla adottato), per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

**Verifica il gate, prima di ogni altra cosa.** PV2-02 si apre **solo al G1** (§8, «PV2-01, A.5 question 1»): cerca in
`docs/ROADMAP-v2.md` §8 la riga che registra G1 (`docs/SESSION-ARCHITECTURE.md` §2: il gate di `main` mostra C5, C7 e C10 ✓, e
l'autore lo approva). **Se la riga non c'è, fermati e dillo all'autore: B non è aperto**, e la riga di anticipo del 9 novembre 2026
vale per A soltanto. Non decidere, non presumere e non annunciare G1.

Verifica che `main` contenga:
- `docs/POST-V2.md` (§3 parte B per intero, §4.1 riga PV2-02, §6 con la domanda 3 risposta il 9 novembre 2026);
- `docs/DATA-READINESS.md` (l'uscita di PV2-01: l'inventario, le quattro schede, il contratto delle metriche proposto);
- `docs/ROADMAP-v2.md` §8 con le righe di PV2-01 (ambito, A.1, approvazione di A.2, A.3, A.4, A.5 domande 1–4, l'estensione e la sua approvazione) e **l'approvazione del
  checkpoint finale di PV2-01**. Se manca, B non è autorizzato: fermati e chiedi;
- questo prompt.

**Rimisura la data.** **Se è il 12 gennaio 2027 o dopo**, la finestra della Traccia M (12 gennaio – 2 febbraio 2027) è aperta e le 33
regole scadono il 3 febbraio: dillo all'autore per primo, perché la Traccia M ha la precedenza su ogni stadio. **Se è il 9 marzo 2027
o dopo**, la concessione di autonomia è scaduta: dillo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of PV2-02 (Post-v2 B, frontend references)» con le parole
con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande. Senza
quella riga non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di `docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/pv2-02-frontend-references`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare».
2. `docs/POST-V2.md` §3 B (la griglia, la galleria per categorie, i vincoli, il deliverable, la shortlist «da verificare»), §5 e §6.
3. `AGENTS.md`, «Architecture — do not rebuild it»: nessun build step, nessuna dipendenza, nessun framework, nessuna richiesta a terzi;
   `tools/thirdparty.mjs` e `ALLOWED_RUNTIME_ORIGINS` (vuoto). **Un riferimento che richiede un framework o una dipendenza di runtime
   si studia come pattern, non si adotta.**
4. `docs/DATA-READINESS.md` §5–§8: le quattro schede e il contratto MC-1…MC-15. Il criterio «qualità di dashboard, tabelle e
   visualizzazioni» si valuta anche su questo: **un riferimento che mostra un dato mancante come zero, o un totale senza la sua
   partizione, perde su quel criterio**, qualunque sia il suo aspetto.
5. `docs/DEPLOYMENT.md` (la Content-Security-Policy e ciò che Pages non può inviare): un pattern che la CSP del sito rifiuterebbe va
   annotato come tale.

Se ritieni che una decisione del brief, del piano o di §8 vada rivista, segnalalo e attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**La griglia, poi la ricerca, poi la matrice e tre direzioni descritte, in `docs/`, e nient'altro.** Non si sceglie un template e non
si scrive codice d'interfaccia: il prototipo è C (PV2-03…05). Tre checkpoint:

- **B.1 · La griglia, approvata prima della ricerca** (§8, «A.5 question 2»). Per ciascuno dei sei criteri di `docs/POST-V2.md` §3 B:
  che cosa si guarda, **la regola di punteggio** (che cosa vale 0, che cosa vale il massimo, e i gradini in mezzo), che cosa conta come
  prova e che cosa no (uno screenshot o il numero di stelle non bastano: lo dice il piano). I pesi come scritti, o come l'autore li
  cambia. Le scelte all'autore con lo strumento di domande, **una domanda per volta, la raccomandazione per prima** — tra queste, la
  domanda 5 di `docs/POST-V2.md` §6 (il Kabarza resta un riferimento visivo esterno, non un progetto open source?). **Nessun
  candidato si ricerca prima che l'approvazione della griglia sia registrata in §8.** **Checkpoint.**
- **B.2 · La ricerca e la matrice** — per ciascun candidato: repository e demo, attività e manutenzione, licenza e obblighi di
  attribuzione (letti nel LICENSE del progetto e nelle licenze degli asset, alla data), stack, dipendenze di runtime e di build,
  responsive, tema chiaro e scuro, accessibilità, qualità di tabelle e grafici, gerarchia editoriale, animazioni, facilità di
  ricostruzione senza dipendenze, limiti; il punteggio motivato su ogni criterio della griglia approvata. La shortlist del piano è un
  **punto di partenza da verificare**, non una lista da confermare. **Un candidato che non si può verificare dal vivo** (repository,
  demo o LICENSE irraggiungibili, o una licenza che non si legge chiaramente) **resta nella matrice segnato «not verified on <data>»
  con ciò che non si è raggiunto, non riceve punteggio su nessun criterio che richiede uno sguardo dal vivo, e non entra nella
  shortlist** (§8, «A.5 question 3»). Nulla si completa a memoria. **Gli screenshot restano nello scratchpad**, per la revisione
  della sessione e dell'autore; la matrice descrive in parole ciò che si è visto — URL, data, viewport, tema — e **nulla di terzi
  entra nel repository** (§8, «A.5 question 4»).
- **B.3 · La galleria, la shortlist e tre direzioni descritte** — la galleria per categorie del piano (homepage editoriale, pagina
  dello strumento, dashboard, timeline, tabella comparativa, blog o articolo, navigazione, microinterazioni), ogni voce con il
  candidato, l'URL e la data, in parole; la shortlist con i punteggi; **tre direzioni grafiche descritte** — Editoriale, Policy
  observatory, Ibrida (`docs/POST-V2.md` §3 C) — ciascuna con i pattern che prende e da dove, e con ciò che di ciascuna non si può
  ricostruire senza una dipendenza. **Descritte, non disegnate.**
- **B.4 · Il prompt della sessione successiva** — `docs/prompts/v2-pv2-03-prototype-editorial.md` (blocco C, prima direzione,
  `docs/POST-V2.md` §3 C e §4.1 PV2-03), sotto la regola permanente di §8. **Il checkpoint finale approva insieme il lavoro e il
  prompt; senza il prompt non si approva.**

**Regola d'arresto:** se la sessione si allunga, la matrice si limita ai candidati verificati, e gli altri sono nominati con la ragione;
**B.1 non si sposta e non si comprime**, perché una griglia scritta dopo aver visto i candidati non è più una griglia.

## Lo stato di partenza

Misurato da PV2-01 il 9 novembre 2026 su `main` `06d5640` e sul suo branch. **Rimisura tutto.**

| Fatto | Misura del 9 novembre 2026 |
|---|---|
| G1 | **non registrato** in §8; B si apre solo al G1 |
| Uscita di A | `docs/DATA-READINESS.md`: inventario dei dieci dataset (A.2, approvato), quattro schede (multe; strumenti per stato; scadenze nei 12 mesi; claim per grado e famiglia), il contratto MC-1…MC-15 proposto e non implementato; dieci finding F-A1…F-A10 lasciati a D |
| Rete dell'ambiente di PV2-01 | `design-system.service.gov.uk` e `tabler.io` rispondevano a una richiesta HEAD; **l'ambiente di PV2-02 può essere diverso: misuralo prima di B.2** |
| Validatori | `validate.mjs` 0 errori · 5 avvertimenti; `evidence-audit.mjs` 0 errori; `tools/selftest.mjs` 141/141 |
| Concessione di autonomia | scade il 9 marzo 2027: si segnala, non si rinnova |

## Scrivere

- **Solo `docs/`.** Nessuna modifica a `data/`, `tools/`, `js/`, `i18n/`, a una pagina, a uno stile o ad `agent/`. Nessuno strumento,
  nessun pacchetto, nessun font, nessuno script e nessuna immagine di terzi entra nel repository; nessuna dipendenza si installa.
- Le righe di §8 prima di ogni documento che dipende da una decisione; ogni risposta in §8 con le parole dell'autore, **committata
  subito**.
- **Una licenza si legge, non si ricorda.** Ogni licenza nella matrice cita il file letto e la data; «MIT» detto dal piano non è una
  verifica. Un progetto che non è open source (il Kabarza, nel piano) non si tratta come tale.
- Ogni commit che cambia un file pubblicato porta `Evidence:`; questa sessione non ne cambia nessuno. `docs/` non è pubblicata, ma
  è pubblica su github.com: nulla vi entra che non si possa pubblicare.
- Prima di ogni checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`,
  `seo-audit`, `node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`. Prima del checkpoint finale anche le
  25 suite. Non scrivere nell'albero mentre la batteria gira.
- Una `agent/records/` locale non vuota fa fallire 3 test della suite governance che in CI passano: misurali con la cartella
  spostata, e dillo.

## Checkpoint

- **B.1:** la griglia con le regole di punteggio e le risposte dell'autore (righe §8); il rapporto in `docs/HANDOVER.md`. Attendi
  l'approvazione, registrata in §8. **Prima di quella riga nessun candidato si apre.**
- **Finale (B.2–B.4):** la matrice, la galleria, la shortlist, le tre direzioni descritte; il prompt di PV2-03 (percorso, commit,
  risposte dell'autore); la checklist. Riscarica `origin/main` subito prima dell'ultima scrittura di `docs/HANDOVER.md`. **Senza il
  prompt di PV2-03 non si chiede l'approvazione.** Poi chiedi se aprire una pull request verso `main` e registra la sorte del branch.

## Cosa NON fare in questa sessione

- Non scegliere né adottare un template, un framework, una libreria o un tema; non copiare codice, asset o animazioni; non aprire C.
- Non costruire, abbozzare o prototipare una pagina, una dashboard, un grafico o un'infografica: sono C e D.
- Non ricercare un candidato prima che la griglia sia approvata in §8; non cambiare la griglia dopo averla approvata senza una nuova
  riga di §8 con le parole dell'autore.
- Non dare punteggio a un candidato non verificato dal vivo; non completare una licenza, una data di manutenzione o un'attività a
  memoria; non giudicare dal solo screenshot o dal numero di stelle.
- Non committare screenshot, immagini, font, CSS o JS di terzi.
- Non toccare l'uscita di A: il contratto MC-1…MC-15 è una proposta per D, e i finding F-A1…F-A10 restano dove sono.
- Non toccare lo Stadio 1, non decidere G1, non rinnovare la concessione di autonomia; non aprire S27 né la Fase 5.
- Non toccare licenza, non affiliazione, assenza di consulenza legale, README. Non riscrivere la storia di `main`; non riscrivere
  un rapporto passato (si annota). Vale in pieno «Cosa NON fare» del brief.

## Lezioni delle sessioni precedenti e di PV2-01 (non ripeterle)

- **La data della sessione e il gate sono fatti da misurare**; la Traccia M ha la precedenza.
- **`origin/main` si muove durante la sessione**: riscarica prima di ogni scrittura di `docs/HANDOVER.md` e prima di aprire una PR.
- **Conta prima di scrivere**; **non dichiarare una verifica che non hai fatto**: una licenza, una demo, un'accessibilità «verificate»
  vanno dette con il file o la pagina letti e la data.
- **Un caso piantato si fa girare, non si descrive soltanto** (PV2-01, §4 e §6 di `docs/DATA-READINESS.md`): se la griglia dichiara
  che un criterio distingue due candidati, mostralo su due candidati reali.
- **Un controllo che una dichiarazione può soddisfare è un buco**: un criterio che si soddisfa scrivendo «non applicabile» non è un
  criterio.
- **Riavvii del worker**: ogni risposta in §8 committata subito; dopo un'interruzione, `git status` prima di rifare un comando.
  **Un clone superficiale non è un albero difettoso.** **Nessun output di agenti in `agent/records/` committato.**

## Criterio di uscita e consegna

La sessione è completa quando: G1 è registrato in §8 prima dell'avvio; la griglia di B.1 è scritta con le regole di punteggio e
approvata in §8 **prima** di ogni ricerca; la matrice di B.2 ha ogni candidato verificato con licenza letta e data, e ogni candidato
non verificato segnato e non punteggiato; la galleria, la shortlist e le tre direzioni di B.3 sono descritte e nulla è disegnato;
nulla fuori da `docs/` è cambiato e nulla di terzi è entrato nel repository; i checkpoint sono approvati in §8; `selftest` e le 25
suite passano; **il prompt di PV2-03 esiste su questo branch, porta la stessa regola nel suo criterio di uscita, ed è approvato con
il lavoro** (regola permanente di §8, 4 nov 2026). Oppure l'autore decide di fermarsi: anche allora, **prima di chiudere, si scrive
il prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (B.1–B.4) cosa è stato scritto (file, righe di §8, commit),
come verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è completo,
dichiaralo.
