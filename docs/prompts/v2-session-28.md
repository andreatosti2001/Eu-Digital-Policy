<!--
Provenance: the prompt of v2 Session 28, drafted on 13 Nov 2026 in v2 Session 27 (item 27.5), on `claude/eager-euler-05ukz9`,
under the standing rule of docs/ROADMAP-v2.md §8 (4 Nov 2026: a session writes the next session's prompt before its work is
approved) and the prompt of v2 Session 27 (27.5). Drawn from docs/PHASE-5-SETUP.md §5.1 (S28, as approved on 4 Nov 2026), §9
(E5-3, approved at checkpoint 27.2), §10 (the X5-1 table, decided per instrument on 13 Nov 2026) and §11 (the paper test), and
from docs/ROADMAP-v2.md §8, the rows of v2 Session 27. The starting state was measured on 13 Nov 2026 on that branch, full clone.
The decisions live in those rows and sections and nowhere else; this file is the instruction text that cites them. It records no
§8 row of its own and does not open the session: v2 Session 28 records its scope in §8 as its first write. Written in Italian,
as the author's session prompts are. The author may change it before use.
-->

SESSION 28 — Fase 5: lo standard E5-3 come controllo a ERROR (28.1), poi il gruppo (b) — F-05, F-12, F-24, R-8 — una domanda
ciascuno (28.2), per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

**Questa sessione parte solo dopo tre cose. Verificale tutte prima di scrivere qualunque cosa; se ne manca una, fermati e
chiedi.**

1. **Il gate G2 è aperto** (`docs/SESSION-ARCHITECTURE.md` §2): in `docs/ROADMAP-v2.md` §8 esistono (a) la selezione di C
   («PV2-05, C.5: the author's explicit decision»), (b) l'approvazione finale della sessione 27 («Final checkpoint of v2
   Session 27 approved…») e (c) **una riga che apre la Fase 5** sulla parola dell'autore contro E5-1…E5-7
   (`docs/PHASE-5-SETUP.md` §3). **Senza la riga che apre la Fase 5, la Fase 5 non è aperta: fermati e chiedi.** Questa
   sessione non la apre.
2. **E5-5: le letture delle sessioni 25 e 26 sono chiuse**: §8 ha i loro checkpoint finali, e
   `node tools/freshness.mjs --as-of 2027-02-03` riporta **0 `RULE_STALE`**. Se una regola non è stata riletta, nessuna regola
   di questa sessione si chiude (E5-5; `docs/PHASE-5-SETUP.md` §5.1, regola d'arresto 2).
3. **La Traccia R prima della 29**: non blocca la 28, ma segnala se V2C-21 (gli attori regolati di `eidas2`) non è ancora
   stato fatto (`docs/PHASE-5-SETUP.md` §5.2).

Verifica anche che `main` contenga `docs/PHASE-5-SETUP.md` §9 (E5-3), §10 (la tabella X5-1) e §11 (la prova su carta), e
questo prompt.

**Rimisura la data, prima di ogni altra cosa.** Le regole rilette tra il 12 gennaio e il 2 febbraio 2027 scadono tra il
13 aprile e il 4 maggio 2027 (`docs/PHASE-5-SETUP.md` §5.3, misurato): **nessuna sessione della Fase 5 porta una regola oltre
la sua scadenza** (regola d'arresto 4). Se oggi è a meno di 30 giorni dalla scadenza di una regola che 28.2 tocca, dillo per
primo. **La concessione di autonomia scade il 9 marzo 2027**: se la data è vicina o passata, segnalalo; non si rinnova.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 28» con le parole con cui l'autore
avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande. Senza quella
riga non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2-session-28-e5-3-check`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare».
2. `docs/PHASE-5-SETUP.md` §9 per intero (lo standard approvato), §10.5 (ciò che è nominato per questa sessione), §5.1 e §6.
3. `docs/ROADMAP-v2.md` §8: le righe della sessione 27 (27.2 domande 1–4b, «Checkpoint 27.2 … approved», le righe 27.3 per
   strumento, 27.4, il checkpoint finale).
4. L'intestazione di `tools/trigger-audit.mjs` (T-01…T-12) e di `tools/attestation-audit.mjs` (A-1…A-8; `parseLocator()`,
   `provisionArticle()`); `js/applies.js` (`evaluate()`, `run()`, `boot()`).
5. `docs/ATTESTATION-FORM.md` §5–§7 e `docs/RULE-MAINTENANCE.md`: come si chiude una regola.

Se ritieni che una decisione del brief, del piano o di §8 vada rivista, segnalalo e attendi conferma. Non reinterpretare in
silenzio.

## Obiettivo della sessione

**28.1 · E5-3 come controllo a ERROR**, prima che esista un trigger nuovo; poi un checkpoint. **28.2 · Il gruppo (b)**, una
domanda per voce, gli Articoli letti in questa sessione. La numerazione segue `docs/PHASE-5-SETUP.md` §5.1.

- **28.1 · Il controllo.** In `tools/trigger-audit.mjs` (Classe C), le quattro clausole di `docs/PHASE-5-SETUP.md` §9.2 — (a),
  (b), (c) sui dati; (d) come proprietà del matcher — **a ERROR**, con i nomi che proponi all'autore (T-13… o altri), e in
  `tools/selftest.mjs` **un caso piantato per ciascuno dei 19 di §9.4**, positivi compresi, che fallisce come lì. Sull'albero di
  oggi: **0 risultati** (nessun trigger nuovo esiste). Due cose che §9.6 ha nominato, ciascuna una domanda all'autore, una alla
  volta, con la raccomandazione per prima:
  - **(d) ha bisogno del matcher vero, chiamabile da Node.** `js/applies.js` esegue `boot()` contro `document` all'import, ed
    `evaluate()` legge `IX` del modulo. Proposta: la parte pura del matcher in un modulo che un controllo può importare, con la
    tassonomia passata come argomento, il comportamento della pagina invariato e misurato prima e dopo — una modifica a `js/`
    con la sua riga in §8. L'alternativa (una copia nel controllo) controlla una copia: dillo.
  - **`tools/validate.mjs`** rifiuta oggi una dimensione nuova in `condition_provisions` e una chiave `when`: estenderlo è della
    sessione 29, con il primo trigger; il controllo della 28 non lo aspetta (i casi piantati mutano una copia dei record).
  Prima del checkpoint: la batteria (sotto). **Checkpoint 28.1**: il controllo, i casi piantati, la batteria; il rapporto in
  `docs/HANDOVER.md`. Attendi l'approvazione, registrata in §8.
- **28.2 · Il gruppo (b) e ciò che §10.5 nomina**, una domanda all'autore per voce, la raccomandazione per prima, ciascuna dopo
  la lettura in questa sessione degli Articoli che tocca, dal testo della Gazzetta ufficiale letto da Cellar per CELEX
  (`Accept-Language: eng`), mai a memoria:
  - **M-1 · F-05**, `ap-data-act-02` (voce 43 della tabella): se l'esito `likely` regge quando la condizione di territorio è già
    `territory:non-eu-serving-eu`; **con la voce 40** (`ap-ai-act-07`), che ha la stessa forma.
  - **M-2 · F-12 = R-6**, `ap-ai-act-01` e `actor:gpai-provider`.
  - **M-3 · F-24**, `ap-pld-01` e i deployer (`activity:ai-deployment`, Art. 8(2)).
  - **M-4 · R-8**, GDPR Art. 2(2)(a) e (b), portati da nessuna regola — accanto alle voci 1 e 4, che la tabella ha deciso
    «valutate» per i punti (c) e (d).
  - **Il rilievo di §9.5**: le 6 disposizioni delle dimensioni della Fase 3 su 5 regole che non passerebbero la clausola (b).
    Cosa ne segue, se qualcosa, è una domanda; una modifica è una modifica di regola.
  **Una regola che cambia è una chiusura nel modulo** (`outcome: "changed"`, le sue righe di §8 in `decisions`, A-1…A-8). Una
  regola i cui testi citati non sono stati letti tutti non si chiude e la sua data non si muove (§5.1, regola d'arresto 2).
- **28.3 · Il prompt della sessione 29** — `docs/prompts/v2-session-29.md`: il questionario, sulle voci «chiedibili» e
  «valutate» di §10 (`docs/PHASE-5-SETUP.md` §10.4: le referenze di ambito, 13–15 domande nuove, sei risposte nuove), le
  riformulazioni di §10.3 come chiusure, le verifiche del browser di X5-3, `$limits` e l'avviso secondo X5-5, e la formulazione
  che §11.3 ha nominato (NOT DETERMINED dopo un «no» esplicito). **Il checkpoint finale approva insieme il lavoro e il prompt;
  senza il prompt non si approva.**

**Regola d'arresto** (`docs/PHASE-5-SETUP.md` §5.1): 28.1 non si sposta; se la sessione si allunga, le voci di 28.2 non chiuse
vanno, nominate, nel prompt della 29; nessuna regola si chiude a metà.

## Lo stato di partenza

Misurato il 13 novembre 2026 sul branch della sessione 27, clone completo. **Rimisura tutto**: in mezzo ci sono le letture
delle sessioni 25 e 26.

| Fatto | Misura del 13 novembre 2026 |
|---|---|
| Le regole | 33, tutte `last_verified` 2026-11-04; 25 con `attestation` |
| Esiti | applies 13, likely 9, possible 10, unlikely 1 |
| Ciò che non si chiede | `depends_on` 38 su 25 regole; soglie 4 chiavi su 3 regole; esenzioni 26 su 20 regole (10 `excludes`, 16 `narrows`), nessuna valutata |
| La tabella X5-1 (§10) | chiedibili 22, chiedibili con una domanda esistente 2, valutate 6, dipendenze dichiarate 16, lasciate 20, alla 28 2 |
| Clausola (b) sulle dimensioni della Fase 3 | 84 disposizioni su 90 passerebbero; 6 su 5 regole no (§9.5) |
| Prototipo di E5-3 (fuori dal repository) | 19 casi piantati su 19 come previsto (§9.4) |
| Validatori | `validate.mjs` 0 errori · 5 avvertimenti; `selftest` 189/189 |
| Scadenze | `freshness --as-of 2027-02-03`: 33 `RULE_STALE` (prima delle letture) |
| Concessione di autonomia | scade il 9 marzo 2027: si segnala, non si rinnova |

## Scrivere

- **28.1**: `tools/trigger-audit.mjs`, `tools/selftest.mjs`, e — solo se l'autore lo decide — il modulo puro del matcher in
  `js/`, ciascuno con la sua riga di §8 prima. **28.2**: `data/applicability.json` solo come chiusura nel modulo, dopo la lettura
  e la risposta dell'autore. Nient'altro fuori da `docs/`.
- Le righe di §8 prima di ogni modifica che dipende da una decisione; ogni risposta in §8 con le parole dell'autore,
  **committata subito**. Ogni commit che tocca un file pubblicato porta la riga `Evidence:` (`tools/commit-evidence.mjs`).
- Prima di ogni checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`,
  `seo-audit`, `node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`. **Prima del checkpoint finale,
  anche le 25 suite e la suite del browser** (`js/` toccato). Non scrivere nell'albero mentre la batteria gira.

## Checkpoint

- **28.1:** il controllo, i casi piantati, le risposte dell'autore (righe §8); il rapporto in `docs/HANDOVER.md`. Attendi
  l'approvazione, registrata in §8.
- **Finale (28.2–28.3):** ogni voce con la sua risposta e, per ogni regola cambiata, la chiusura nel modulo; il prompt della 29
  (percorso, commit, risposte dell'autore); la checklist. Riscarica `origin/main` subito prima dell'ultima scrittura di
  `docs/HANDOVER.md`. **Senza il prompt della 29 non si chiede l'approvazione.** Poi chiedi se aprire una pull request verso
  `main` e registra la sorte del branch.

## Cosa NON fare in questa sessione

- Non aggiungere un trigger nuovo (una dimensione, una domanda, una `when`): è della 29, dopo che il controllo esiste.
- Non cambiare una regola fuori da 28.2, né senza la lettura e la risposta dell'autore; non spostare una data senza la lettura.
- Non aprire la Fase 5 (è del gate G2, prima di questa sessione); non aggiungere un termine a `data/taxonomy.json`.
- Non far proporre a un agente una modifica di regola (P-D); non toccare `agent/integrate/preserve.mjs` né il suo test.
- Non riaprire F-18 (gruppo (d)), V2C-13 o V2C-15 (sessione 30); non riaprire le decisioni di §10 se non segnalandolo.
- Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale,
  `ALLOWED_RUNTIME_ORIGINS`; D-5 è rinviato; non rinnovare la concessione di autonomia.
- Non abbassare gate, validator, test o limiti. Non toccare licenza, non affiliazione, assenza di consulenza legale, README.
- Non riscrivere la storia di `main`, né forzare un push su un branch altrui; non riscrivere un rapporto passato (si annota).
- Vale in pieno «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–27 (da `docs/HANDOVER.md`; non ripeterle)

- **La data della sessione è un fatto da misurare, e una premessa del prompt può essere sbagliata.**
- **Un esempio semplificato in una domanda all'autore è un errore da correggere subito**: nella sessione 27 la domanda 4 diceva
  che `ap-gdpr-04` dipende da una cosa; ne ha tre. Corretto dopo la risposta, registrato nella riga, e chiesto di nuovo (4b).
  **Prima di un esempio, misuralo.**
- **Un prototipo di controllo può non vedere ciò che la decisione vieta**: nella 27 un `narrows` che declassa passava le prime
  cinque proprietà; la sesta è stata aggiunta. Pianta un caso per ogni decisione, non solo per ogni clausola.
- **`origin/main` si muove durante la sessione**: prima di ogni scrittura di `docs/HANDOVER.md` e prima di aprire una PR,
  riscarica e confronta; se la PR del branch è già fusa, il lavoro nuovo va su una nuova PR, ribasato.
- **`selftest` fissa ciò che cambi**; **conta prima di scrivere**; **non dichiarare una correzione che non hai fatto**; leggi il
  diff intero prima di ogni commit.
- **Riavvii del worker e interruzioni**: ogni risposta in §8 committata subito; dopo un'interruzione, `git status` prima di
  rifare un comando. **Un clone superficiale non è un albero difettoso.** **Nessun output di agenti in `agent/records/`.**

## Criterio di uscita e consegna

La sessione è completa quando: E5-3 è un controllo a ERROR in `tools/trigger-audit.mjs` con un caso piantato in `selftest` per
ciascuno di §9.4, e 0 risultati sull'albero; il checkpoint 28.1 è approvato in §8; M-1…M-4 e il rilievo di §9.5 hanno ciascuno
una risposta dell'autore in §8, e ogni regola cambiata è una chiusura nel modulo con A-1…A-8 a 0 errori; `selftest` e la
batteria passano; **il prompt della sessione 29 esiste su questo branch, porta la stessa regola nel suo criterio di uscita, ed è
approvato con il lavoro** (regola permanente di §8, 4 nov 2026). Oppure l'autore decide di fermarsi: anche allora, **prima di
chiudere, si scrive il prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (28.1–28.3) cosa è stato scritto (file, righe di §8,
commit), come verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è
completo, dichiaralo.
