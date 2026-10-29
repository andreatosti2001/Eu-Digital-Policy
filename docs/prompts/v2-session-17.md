<!--
Provenance: the prompt of v2 Session 17, drafted at the end of v2 Session 16 (29 Oct 2026) as its item 16.4,
as docs/prompts/v2-session-16.md asks, after "The checkpoint of v2 Session 16" was approved. Drawn from
docs/ROADMAP-v2.md §8: the plan row for Sessions 13–17 ("17: the Data Act, NIS2, DORA, the CRA (10); then the
`rule-*` flip to ERROR, and the entry condition is met; and two maintenance checks …"), the method of v2 Session
13, 13.0 question 4, the rows of v2 Session 14 (in particular question 3, on conditions another Act defines), of
v2 Session 15 (in particular "T-03 and thresholds" and questions 3a–3e on the dates) and of v2 Session 16 (in
particular questions 3b and 3d, on a definition among the obligations and on an event naming a provision its
text does not concern, question 6b, on a source's `published`, and the two corrections on the reach of a field);
from docs/V2-CLOSURE.md (V2C-02, V2C-10); and from the v2 Session 16 report in docs/HANDOVER.md. The starting
state was measured on Session 16's approved tree (5326ea5). The decisions live in those rows and nowhere else;
this file is the instruction text that cites them. Written in Italian, as the author's session prompts are. The
author may change it before use.
-->

SESSION 17 — Fase 3, quinta e ultima sessione sulle regole: le dieci regole del Data Act, di NIS2, DORA e CRA alla forma v2, il flip dei BACKLOG `rule-*` e i due controlli di manutenzione, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Verifica che `main`
contenga la sessione 16 e questo prompt:
- `docs/ROADMAP-v2.md` §8 ha la riga «The checkpoint of v2 Session 16»;
- `node tools/evidence-audit.mjs --as-of <oggi>` riporta «publishable 23 of 33» e i BACKLOG `rule-*`
  10/10/10/2/0/2;
- `docs/prompts/v2-session-17.md` esiste.

Se manca qualcosa in `main`, fermati e segnalalo. (La sessione 16 e questo prompt entrano in `main` con una pull
request, se l'autore ne apre una.)

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 17» con le
parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo
con lo strumento di domande. Senza quella riga non si scrive nulla, nemmeno in `docs/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso: `origin/scout/digest-digest-2026-10-26T13-10-32Z` e
`origin/claude/v2-session-8-findings` (già nel registro). Se il branch della sessione 16
(`claude/v2-session-16-ai-act-rules`) risulta non unito, la sua pull request non è ancora unita: segnalalo.

Crea un branch di sessione (`claude/v2-session-17-last-rules` o quello assegnato dall'ambiente). Non
lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, in particolare «Non pubblicare "what applies to me" prima che i trigger siano
   verificati con lo stesso rigore delle claim».
2. `docs/ROADMAP-v2.md`: §4 Fase 3 (la condizione d'ingresso); in §8 la riga del piano (sessioni 13–17), la
   domanda 4 della sessione 13 (il metodo), la domanda 3 della sessione 14, le righe delle sessioni 15 e 16 (in
   particolare 15 «T-03 and thresholds», 16 domande 3b, 3d, 6b, 7 e le due correzioni sulla portata).
3. `docs/V2-CLOSURE.md`: V2C-02, V2C-10 (chiuso per l'AI Act; restano `ap-data-act-02` e `-04`).
4. `docs/V2-DATA-DESIGN.md` §2 (T-01…T-11) e §4 (le gravità, il BACKLOG); `docs/v2-design/applicability-rule.schema.json`
   e `docs/v2-design/applicability-examples.json` (bozze del 25 ottobre: **un punto di partenza da rileggere,
   non da copiare**).
5. `docs/HANDOVER.md`: il rapporto della sessione 16 («Found, for the author», «What was not verified»).
6. Il codice e i dati che toccherai: `data/applicability.json` (`$description`, `$last_verified` e le dieci
   regole), `data/instruments.json` (le disposizioni di `data-act`, `nis2`, `dora`, `cra`; gli archi che li
   toccano), `data/timeline.json` (gli eventi che le regole citano o derivano), `data/sources.json`
   (`src-eurlex-data-act`, `src-eurlex-nis2`, `src-ec-nis2-referral-2026`, `src-eurlex-dora`, `src-eurlex-cra`);
   `tools/trigger-audit.mjs` (`RULES_V1`, `BACKLOG_CODES`, `owe`, T-10); `tools/evidence-audit.mjs` (come stampa
   TRIGGERS); `tools/selftest.mjs` X1–X4, Y1–Y5 (`RULES_V2`, `RULES_2026_10_28`, `TRIGGER_BACKLOG_2026_10_28`);
   `agent/detector/fields.mjs`; `js/regulatory-model.js` (`provisionApplication`, le modalità degli archi).

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e
attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

Tre voci, nell'ordine, poi checkpoint, poi la bozza del prompt che segue (17.5, se l'autore la chiede):
- **17.1 le dieci regole**: `ap-data-act-01`…`-04`, `ap-nis2-01`…`-03`, `ap-dora-01`, `-02`, `ap-cra-01` portate
  alla forma v2 contro i loro Articoli, **letti nel testo in vigore** (con le modifiche e le rettifiche che i
  metadati SPARQL elencano, nella lingua citata), fino a essere pubblicabili, **con il metodo deciso nella
  sessione 13** (§8, domanda 4): una tabella per strumento (quattro domande), e una domanda separata, regola per
  regola, per tutto ciò che va oltre la forma.
- **17.2 il flip**: quando `RULES_V1` è vuota, i BACKLOG `rule-*` diventano ERROR (§8, la riga del piano) e la
  condizione d'ingresso della Fase 3 è soddisfatta. Come, è una domanda all'autore (17.0, domanda 7).
- **17.3 i due controlli di manutenzione**, come §8 li descrive: derivati dai record, senza rete e senza campi
  nuovi — (a) un WARNING quando una regola cita una disposizione di uno strumento modificato (un arco di modalità
  `law`) o con un evento datato dopo il `last_verified` della regola; (b) la freschezza per regola anziché per
  file (il file dichiara il 27 agosto 2026; le sue regole sono verificate fino al 29 ottobre 2026). Accorgersi
  che il diritto è cambiato resta un atto di una persona fino alla Fase 4 (D-4, D-5 aperte).

## Lo stato di partenza

Misurato il 29 ottobre 2026 sull'albero approvato della sessione 16 (`5326ea5`). **Rimisura tutto.**
- TRIGGERS: 33 regole, pubblicabili 23; BACKLOG `rule-v1-sources` 10, `rule-scope-basis-missing` 10,
  `rule-condition-provisions-missing` 10, `rule-exemption-v1` 2 (`ap-data-act-03`, `ap-nis2-02`),
  `rule-threshold-basis-missing` 0, `rule-dates-not-derived` 2 (`ap-data-act-02`, `ap-data-act-04`). Gli altri
  BACKLOG (`scope-decision-missing` 11, `status-basis-missing` 23, e quelli sugli archi) **non** sono `rule-*` e non
  fanno parte del flip.
- Le dieci regole, tutte con fonti a ID nudi, nessun `condition_provisions`:
  - `ap-data-act-01` (`applies`; `actor:cloud-provider`, `activity:cloud-services`; obbligo `data-act:art-25`;
    date 12 set 2025 e 12 gen 2027), `-02` (`likely`; in più `territory:non-eu-serving-eu`; data 12 gen 2027; **la
    derivazione aggiunge 12 set 2025**), `-03` (`applies`; produttori e fornitori di prodotti connessi; obbligo
    `data-act:art-3-1`; data 12 set 2026; **un'esenzione stringa**), `-04` (`possible`; `actor:sme`,
    `actor:large-company`; obblighi `data-act:art-3-1`, `-25`; date 12 set 2025 e 12 set 2027; **la derivazione
    aggiunge 12 set 2026 e 12 gen 2027**). Tutte `last_verified` 2026-08-27; `src-eurlex-data-act` letta l'ultima
    volta il 27 agosto 2026.
  - `ap-nis2-01` (`likely`; obblighi `nis2:art-3`, `-20`, `-21`, `-23`; data di recepimento 17 ott 2024; fonti
    `src-eurlex-nis2` e **`src-ec-nis2-referral-2026`, tier 2**), `-02` (`likely`; `actor:cloud-provider`; **un'esenzione
    stringa**), `-03` (`possible`; `actor:public-authority`). NIS2 è una **direttiva** (`status:transposition-overdue`):
    le regole parlano di obblighi che arrivano attraverso il diritto nazionale; leggilo prima di scrivere una
    data o un `outcome` e chiedi se qualcosa va oltre la forma.
  - `ap-dora-01` (`applies`; `actor:financial-entity`, nessuna attività; obblighi Artt. 5, 6, 17, 19, 24, 28),
    `-02` (`possible`; fornitori ICT terzi; Artt. 28, 31). `last_verified` 2026-09-27.
  - `ap-cra-01` (`likely`; obblighi `cra:art-13`, `-14`; date 11 set 2026, scadenza di segnalazione, e 11 dic 2027).
    **Il CRA è `amended_by` `ehds`** (arco `rel-ehds-cra-amends`, di modalità `law`): leggi l'articolo dell'EHDS che lo
    modifica. Il Data Omnibus (`rel-data-omnibus-data-act-amends`) è una **proposta**: non si legge come legge.
- Disposizioni registrate: `data-act` 3(1), 8, 13 (Capo IV), 25; `nis2` 3, 20, 21, 23, 31; `dora` 5, 6, 17, 19, 24,
  28, 31; `cra` 13, 14, 16, 24, 35–51 (Capo IV). **Nessuno dei quattro ha registrati l'articolo delle definizioni
  né quello sull'ambito** (salvo `nis2:art-3`): quali siano, e con che numero, lo stabilisce la lettura, non questo
  prompt; `condition_provisions` ne avrà bisogno, come per i precedenti delle sessioni 14–16.
- `data/applicability.json` `$last_verified` è 2026-08-27: è la freschezza per file che il controllo 17.3(b)
  sostituisce con quella per regola.
- La baseline dopo la sessione 16 (dal suo rapporto, da rimisurare): validatori 0 errori, 45 non verificati,
  disposizioni 104; `tools/selftest.mjs` 121; le 24 suite 1251; Control Room 76 · 1 saltato; suite browser
  343 · 0 · 1; gate avversariale 65 · 0 · 3 · 1; prontezza 17 di 20, rifiuta.

## 17.0 · Domande da porre all'autore, prima di toccare qualcosa di pubblicato

Prima una ricognizione in sola lettura, con le fonti **lette**: il Data Act (32023R2854), NIS2 (32022L2555),
DORA (32022R2554) e il CRA (32024R2847) dal Cellar; l'atto dell'EHDS che modifica il CRA, articolo per articolo;
i metadati SPARQL di ciascuno (atti modificativi, rettifiche, e la lingua di ogni rettifica; un testo consolidato,
se esiste: dillo e dì se l'hai letto); la fonte tier 2 di `ap-nis2-01`. Poi **una domanda per volta tramite lo
strumento di domande**, con la raccomandazione in prima posizione e la motivazione nella domanda stessa. Almeno:

1. **Le quattro tabelle** (§8, domanda 4 della sessione 13), una per strumento: per ciascuna regola i
   riferimenti (fonte, `supports`, `for`, locator come letto) e le `condition_provisions`; le nuove disposizioni
   (numero, titolo e riassunto come letti, parola per parola); le esenzioni stringa rese oggetto **con il testo
   invariato**; e se le nuove disposizioni vanno collegate all'evento che ne fissa la data (precedente: sessione
   16, domanda 1). Ogni testo visibile che cambia, prima e dopo, **compresa la portata misurata nel codice**:
   `applies.html`, `/instruments/<id>/`, la palette di ricerca (`js/search.js` indicizza ogni disposizione), le
   schede delle interazioni (`js/interactions.js` stampa i titoli), `instrument.html?id=`.
2. **Le date** (`rule-dates-not-derived`, V2C-10): `ap-data-act-02` e `-04`, una domanda per regola. **Leggi prima
   i record degli eventi e le loro fonti**: un evento può nominare una disposizione che il suo testo non riguarda
   (sessione 16, domanda 3d), e una definizione tra gli obblighi deriva una data sbagliata (domanda 3b).
3. **Le esenzioni stringa** di `ap-data-act-03` e `ap-nis2-02`: il testo contro l'Articolo che citano.
4. **La fonte tier 2** di `ap-nis2-01`: quale testo tier 1 regge la regola, e che ruolo resta alla fonte tier 2
   (`context` o `direct`, per la motivazione; precedenti: sessione 15 domanda 4, sessione 16 domanda 5).
5. **NIS2 come direttiva** e **il CRA modificato dall'EHDS**: che cosa ne segue per date, `outcome` e riferimenti.
6. **Ogni altra cosa oltre la forma** trovata leggendo — titoli diversi dalla Gazzetta, `published` di una fonte
   che non è la data della Gazzetta (sessione 15 domanda 6a, sessione 16 domanda 6b): una domanda per regola o
   per record.
7. **Il flip (17.2)**: dopo che le dieci regole sono pubblicabili e `RULES_V1` è vuota — se `RULES_V1` resta come
   lista vuota congelata o sparisce; che cosa diventa `owe()` (ogni `rule-*` un ERROR); che cosa stampa il rapporto
   TRIGGERS (le righe BACKLOG `rule-*` spariscono o restano a 0); e che cosa diventa la condizione d'ingresso nei
   documenti che la citano (`docs/ROADMAP-v2.md` §4, `docs/V2-CLOSURE.md` V2C-02). Mostra un caso piantato prima e
   dopo.
8. **I due controlli (17.3)**: per ciascuno, il codice del messaggio, la gravità (WARNING, come dice §8), dove vive
   (`tools/trigger-audit.mjs` o `tools/freshness.mjs`), che cosa conta come «modificato» (solo archi di modalità
   `law`; un arco `proposed` mai), e che cosa stampa oggi sull'albero, misurato. Un controllo nuovo che trova
   qualcosa è un rilievo, non un difetto da far tacere.
9. **Le asserzioni**, misurate **dopo** aver scritto i dati approvati e rilanciato le suite: le regole escono da
   `RULES_V1` ed entrano in `RULES_V2` (una lista per gli strumenti di questa sessione); X1 e X3 passano ai valori
   misurati; ogni altra premessa che si sposta si nomina. Chiedere prima di cambiare un'asserzione.

Registra ogni risposta in §8 con le parole dell'autore, e committa subito. Ciò che non è approvato non entra.

## 17.1–17.3 · Scrivere e verificare

- Ogni valore scritto in `data/` è letto da una fonte recuperata, con `last_verified` della lettura; la nota
  di verifica dice che cosa è stato letto e dove, e in quale versione del testo. **Nulla dalla memoria del
  modello, nulla dalle bozze del design senza rileggerlo.**
- Le regole portate a v2 diventano pubblicabili (`publishable`, derivato); il rapporto TRIGGERS lo mostra.
- `applies.html` e la sua nota D-2 non cambiano in questa sessione (la nota è un rilievo aperto delle sessioni
  15 e 16: la sua parola è dell'autore, da chiedere a parte, non da riscrivere).
- `node tools/_footer.mjs` rilanciato; una seconda esecuzione scrive 0 file. **Ogni pagina che il generatore
  riscrive si spiega** (sessione 16: `instruments/gdpr/` per un titolo su una scheda d'interazione).
- Ogni commit che tocca un file pubblicato porta la riga `Evidence:`; `tools/commit-evidence.mjs
  <base della sessione> HEAD` deve dare 0 commit senza evidenza.
- Rilancia tutto, prima e dopo, e salva gli output su file: `validate`, `i18n-audit`, `design-qa`,
  `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`; le 25 suite (con
  `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, o il percorso dell'ambiente),
  la suite browser con `--require-browser`, il gate avversariale, `agent/schemas/cli.mjs check`,
  `.control-room/cli.mjs boundary` e `routes`, `tools/og-image.mjs --check`,
  `agent/production/cli.mjs readiness` (con `BROWSER_QA_CHROME` impostato).
- **Rilancia `evidence-audit` subito dopo aver scritto i dati, prima di committare.**
- Se una suite fallisce per una premessa cambiata, si dice quale e perché, e si chiede prima di cambiare
  un'asserzione o un registro. Non scrivere file mentre la suite browser gira. Leggi il `git diff` completo prima
  di ogni commit.
- Aperto nel browser: `applies.html` con le combinazioni che fanno scattare le dieci regole (per esempio
  `?actor=actor:cloud-provider&activity=activity:cloud-services`, `?actor=actor:financial-entity`,
  `?actor=actor:essential-entity&activity=activity:critical-infrastructure-operation`,
  `?actor=actor:pde-manufacturer&activity=activity:product-with-digital-elements`) e `/instruments/<id>/` dei quattro
  strumenti, nei due temi, a 1280px e 390px.

## 17.4 · Checkpoint — la sessione si ferma qui

- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 16: decisioni e commit;
  prima/dopo di ogni testo cambiato; le fonti lette, con data, locator e versione del testo; il rapporto
  TRIGGERS prima e dopo; i conteggi con il motivo di ogni movimento; ciò che non è stato verificato e perché; i
  rilievi trovati; la checklist (17.0–17.4) e come controllare a mano.
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore; si registra in §8, e la riga di V2C-10 (e di V2C-02, se il flip
  soddisfa la condizione d'ingresso) in `docs/V2-CLOSURE.md` indica il commit solo dopo l'approvazione. Poi
  chiedi se aprire una pull request verso `main`, e registra la sorte del branch. **Non pushare sul branch dopo
  aver aperto la PR.** Una bozza del prompt della sessione successiva si scrive solo se l'autore la chiede: con la
  sessione 17 il piano delle sessioni 13–17 di §8 è esaurito, e che cosa viene dopo (Fase 4, la chiusura della v2,
  il post-v2 di `docs/POST-V2.md`) è dell'autore.

## Cosa NON fare in questa sessione

- Non toccare le regole del GDPR, del DSA, del DMA, dell'AI Act, del PLD o di eIDAS 2, salvo una decisione
  dell'autore su una domanda posta.
- Non leggere come legge una modifica proposta (un arco di modalità `proposed`, come il Data Omnibus).
- Non scrivere `modality`, `publishable`, `verification_state` o un'altra proprietà derivata in `data/`.
- Non fare il flip dei BACKLOG che non sono `rule-*` (`scope-decision-missing`, `status-basis-missing`,
  `edge-v1-sources`, `edge-analytical-no-claim`).
- Non implementare i controlli della mappa M-08…M-16, né alcuna lettura di rete nei due controlli (17.3).
- Non toccare `applies.html` né la sua nota; non ritirare la pagina.
- Non correggere paragrafi del brief né claim (per esempio `part-4.p2` e `clm-dma-ex-ante`, rilievo della
  sessione 15); un difetto trovato si porta all'autore.
- Non avviare la Fase 4, il capitolo finanza o il post-v2.
- Non dichiarare la v2 conclusa; non dichiarare «sicurezza operativa dimostrata».
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione.
- Non toccare la licenza né il testo di non affiliazione o di assenza di consulenza legale; non scrivere
  nel README.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–16 (da `docs/HANDOVER.md`; non ripeterle)

- **I testi che il lettore vede si approvano parola per parola prima di scriverli.**
- **Ciò che si dice all'autore va misurato e citato esattamente**; e si legge prima di chiedere. **Prima di
  dire dove un campo si stampa, cercalo nel codice**: nella sessione 15 il `published` di una fonte si stampava in
  ogni citazione (`js/format.js` `cite()`); nella sessione 16 un titolo di disposizione si stampava anche nella
  palette di ricerca e su una scheda d'interazione di un'altra pagina, e due disposizioni nuove anche in ricerca —
  due correzioni chieste dopo. Cerca in `js/` ogni lettura del campo prima di porre la domanda.
- **Un difetto che il lavoro espone si porta all'autore**: né corretto in silenzio, né lasciato in silenzio.
  Leggi l'Articolo intero, non solo il punto che la bozza cita (sessione 16: l'esenzione dell'Art. 6(3) ometteva
  le quattro condizioni e la regola sulla profilazione; un fornitore di modelli GPAI non è per ciò solo
  destinatario degli Artt. 4 e 5).
- **Anche un controllo può avere un difetto**: il primo caso di un tipo può esporlo. Mostra il difetto su un caso
  piantato, prima e dopo la correzione, e chiedi prima di correggere. Vale anche per il flip e i due controlli
  nuovi.
- **Le date derivate dicono qualcosa sugli eventi e sugli obblighi**: un evento può nominare una disposizione che
  il suo testo non riguarda (sessione 16: l'Art. 27 sull'evento del 2 agosto 2028); una definizione tra gli
  obblighi deriva una data in cui nulla si applica (l'Art. 3(63)); un termine transitorio può mancare del tutto
  (l'Art. 111(3), riportato).
- **Rettifiche e modifiche.** Prima di citare un testo, chiedi ai metadati SPARQL se un atto lo modifica o lo
  rettifica, e **in quali lingue** è ogni rettifica; leggi l'atto modificativo articolo per articolo e scrivi nei
  locator se puntano al testo modificato. Il `published` di un atto è la data della Gazzetta, non dell'adozione
  (sessioni 15 e 16).
- **La domanda sulle asserzioni si pone dopo aver misurato**; una premessa che la domanda non ha nominato si
  chiede a parte.
- **Una regola che dipende dalla data non è un ERROR**: è un WARNING. Ma **T-10 è un ERROR per una regola uscita
  da `RULES_V1`**: le date derivate vanno decise prima che esca.
- **La suite browser e i self-test trovano ciò che la lettura non trova**; anche il registro dei campi.
  Rilanciali prima di dichiarare un esito, e non scrivere file mentre girano.
- **Branch e merge.** Non pushare su un branch dopo aver aperto la sua PR; `main` può muoversi durante la
  sessione: riscarica prima dell'ultima scrittura e dopo ogni commit di dati.
- **Riavvii del worker.** Registra ogni risposta in §8 e committa subito (nelle sessioni 15 e 16 il worker è
  ripartito più volte senza perdere nulla per questo). Salva gli output su file. Non usare `pkill -f` con una
  stringa che compare nella tua stessa riga di comando; `ss` non è installato: ferma un server per PID.
- **`js/applies.js` non si importa in Node** (si avvia su `document`): il suo rendering si verifica nel
  browser e sulle pagine generate.
- **Nessun output di agenti in `agent/records/`**; si diffano solo i record toccati.

## Criterio di uscita e consegna

La sessione è completa in uno di due casi: 17.1–17.3 sono scritti come l'autore li ha decisi, ogni controllo
rilanciato è a 0 errori e il checkpoint è approvato; oppure l'autore decide di fermarsi.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (17.0–17.4) indica:
- cosa è stato scritto (file, righe di §8, commit);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
