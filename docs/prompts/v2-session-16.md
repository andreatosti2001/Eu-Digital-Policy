<!--
Provenance: the prompt of v2 Session 16, drafted at the end of v2 Session 15 (29 Oct 2026) as its item 15.4,
as docs/prompts/v2-session-15.md asks, after "The checkpoint of v2 Session 15" was approved. Drawn from
docs/ROADMAP-v2.md §8: the plan row for Sessions 13–17 ("16: the AI Act (7, F-4, F-8's 2 Dec 2026 tranche)"),
the method of v2 Session 13, 13.0 question 4, the rows of v2 Session 14 (in particular question 3, on conditions
another Act defines) and the rows of v2 Session 15 (in particular "T-03 and thresholds", questions 3a–3e on the
dates, and question 7 on the assertions); from docs/V2-CLOSURE.md (V2C-06, V2C-10); and from the v2 Session 15
report in docs/HANDOVER.md. The starting state was measured on Session 15's approved tree (d57bf0b). The
decisions live in those rows and nowhere else; this file is the instruction text that cites them. Written in
Italian, as the author's session prompts are. The author may change it before use.
-->

SESSION 16 — Fase 3, quarta sessione sulle regole: le sette regole dell'AI Act alla forma v2, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Verifica che `main`
contenga la sessione 15 e questo prompt:
- `docs/ROADMAP-v2.md` §8 ha la riga «The checkpoint of v2 Session 15»;
- `node tools/evidence-audit.mjs --as-of <oggi>` riporta «publishable 16 of 33: ap-gdpr-01, ap-gdpr-02,
  ap-gdpr-03, ap-gdpr-04, ap-dsa-01, ap-dsa-02, ap-dsa-03, ap-dsa-04, ap-dsa-05, ap-dma-01, ap-dma-02, ap-dma-03,
  ap-dma-04, ap-pld-01, ap-eidas2-01, ap-cross-01»;
- `docs/prompts/v2-session-16.md` esiste.

Se manca qualcosa in `main`, fermati e segnalalo. (I dati della sessione 15 sono già in `main` con la PR #43;
il rapporto, l'approvazione e questo prompt entrano con una nuova pull request, se l'autore ne apre una.)

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 16» con le
parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo
con lo strumento di domande. Senza quella riga non si scrive nulla, nemmeno in `docs/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso: `origin/scout/digest-digest-2026-10-26T13-10-32Z` e
`origin/claude/v2-session-8-findings` (già nel registro). Se il branch della sessione 15
(`claude/vigilant-ride-i216wh`) risulta non unito, la sua seconda pull request non è ancora unita: segnalalo.

Crea un branch di sessione (`claude/v2-session-16-ai-act-rules` o quello assegnato dall'ambiente). Non
lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, in particolare «Non pubblicare "what applies to me" prima che i trigger siano
   verificati con lo stesso rigore delle claim».
2. `docs/ROADMAP-v2.md`: §4 Fase 3; in §8 la riga del piano (sessioni 13–17), la domanda 4 della sessione 13
   (il metodo), la domanda 3 della sessione 14 (le condizioni definite da un altro atto), e tutte le righe
   della sessione 15, in particolare «T-03 and thresholds», le domande 3a–3e (le date) e la domanda 7.
3. `docs/V2-CLOSURE.md`: V2C-02, V2C-06 (F-4), V2C-10 (F-8).
4. `docs/V2-DATA-DESIGN.md` §2 (T-01…T-11) e §7 (F-4, F-8); `docs/v2-design/applicability-rule.schema.json` e
   `docs/v2-design/applicability-examples.json` (le bozze dell'AI Act, lette il 25 ottobre 2026: **un punto di
   partenza da rileggere, non da copiare**).
5. `docs/HANDOVER.md`: il rapporto della sessione 15 («Found, for the author», «What was not verified»).
6. Il codice e i dati che toccherai: `data/applicability.json` (`$description` e le sette regole),
   `data/instruments.json` (le disposizioni di `ai-act` e `ai-omnibus`), `data/timeline.json` (gli eventi che le
   regole citano o derivano), `data/sources.json` (`src-eurlex-ai-act`, `src-eurlex-ai-omnibus`,
   `src-ec-gpai-code`, `src-ec-ai-omnibus-in-force`); `tools/trigger-audit.mjs` (`RULES_V1`, T-03, T-10, T-11);
   `tools/selftest.mjs` X1–X3, Y2–Y4 (`RULES_PILOT`, `RULES_GDPR`, `RULES_DSA_DMA`, `RULES_V2`,
   `RULES_2026_10_28`); `agent/detector/fields.mjs` (il registro dei campi, comprese le chiavi delle soglie).

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e
attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

Una voce, poi checkpoint, poi la bozza del prompt della sessione 17 (16.4):
- **16.1 l'AI Act**: le sette regole (`ap-ai-act-01`…`ap-ai-act-07`) portate alla forma v2 contro i loro
  Articoli, **letti nel testo come modificato dall'AI Omnibus** (Regolamento (UE) 2026/1744, 32026R1744), fino
  a essere pubblicabili, **con il metodo deciso nella sessione 13** (§8, domanda 4): una tabella per lo
  strumento (una domanda), e una domanda separata, regola per regola, per tutto ciò che va oltre la forma. F-4
  (V2C-06) e F-8 (V2C-10, la tranche del 2 dicembre 2026) sono tra queste.

Le altre 10 regole del backlog (Data Act, NIS2, DORA, CRA) **non** si toccano: appartengono alla sessione 17
(§8, il piano), con il flip dei BACKLOG `rule-*` e i due controlli di manutenzione.

## Lo stato di partenza

Misurato il 29 ottobre 2026 sull'albero approvato della sessione 15 (`d57bf0b`). **Rimisura tutto.**
- TRIGGERS: 33 regole, pubblicabili 16; BACKLOG `rule-v1-sources` 17, `rule-scope-basis-missing` 17,
  `rule-condition-provisions-missing` 17, `rule-exemption-v1` 6 (tra cui `ap-ai-act-01`, `-02`, `-04`, `-06`),
  `rule-threshold-basis-missing` 1 (`ap-ai-act-03`), `rule-dates-not-derived` 7 (tra cui `ap-ai-act-01`, `-02`,
  `-05`, `-06`, `-07`).
- Le sette regole, tutte con `last_verified` 2026-08-27 e fonti a ID nudi:
  - `ap-ai-act-01`: attori `ai-provider`, `ai-deployer`, `gpai-provider`; tre attività; `applies`; obbligo
    `ai-act:art-5`; data `tl-ai-act-2025-02-02-application`; un'esenzione stringa. **F-8**: omette
    `tl-ai-act-2026-12-02-application` (la tranche dell'Art. 5 introdotta dall'Omnibus).
  - `ap-ai-act-02`: attore `gpai-provider`; `applies`; obblighi `ai-act:art-53`, `ai-act:art-3-63`; date
    `tl-ai-act-2025-08-02-application`, `tl-ai-act-2025-07-10-guidance`; fonti `src-eurlex-ai-act` e
    `src-ec-gpai-code` (tier 2); un'esenzione stringa. La derivazione aggiunge `tl-ai-act-2025-02-02-application`
    **perché una definizione (`ai-act:art-3-63`) sta tra gli obblighi**: da portare all'autore.
  - `ap-ai-act-03`: attore `gpai-provider`; soglia `cumulative_training_flop_gte` 1e25; `likely`; senza
    `threshold_basis`. **F-4 / V2C-06**: secondo il design l'Art. 51(2) dice «greater than», quindi `_gt` (da
    rileggere nel testo modificato). È la terza regola con soglie: T-03 non conta più `thresholds` come
    dimensione (sessione 15).
  - `ap-ai-act-04`: `possible`; obblighi `ai-act:art-6`, `-9`, `-27`; date 2 dic 2027 e 2 ago 2028; fonti
    `src-eurlex-ai-act` e `src-ec-ai-omnibus-in-force` (tier 2); un'esenzione stringa.
  - `ap-ai-act-05`: `possible`; obbligo `ai-act:art-25`; data 2 dic 2027; la derivazione aggiunge
    `tl-ai-act-2028-08-02-application`.
  - `ap-ai-act-06`: attore `public-authority`; `applies`; obblighi `ai-act:art-5`, `-27`; data 2 feb 2025;
    un'esenzione stringa. La derivazione aggiunge il 2 dic 2026 (**F-8**), il 2 dic 2027 e il 2 ago 2028.
  - `ap-ai-act-07`: territorio `non-eu-serving-eu`; `likely`; obblighi `ai-act:art-5`, `-53`; data 2 feb 2025.
    La derivazione aggiunge il 2 dic 2026 (**F-8**) e il 2 ago 2025.
- Disposizioni registrate di `ai-act`: 2(3) (`ai-act:art-2`, «Scope — exclusion of military, defence and
  national security»), 3(63) (`ai-act:art-3-63`), 4, 5, 6, 9, 25, 27, 50, 51, 53, 55, 99 —
  **manca l'Art. 3 nel suo insieme** (le definizioni di fornitore, deployer, sistema di IA: punti (1)–(4)).
  `ai-act` è `amended_by` `ai-omnibus` (32026R1744, in vigore; arco `rel-ai-omnibus-ai-act`).
- Eventi: `tl-ai-act-2026-12-02-application` e `tl-ai-act-2026-12-02-transition-end` sono datati **dopo** il 29
  ottobre 2026 e portano `introduced_by: ai-omnibus`: una regola `applies` con tutte le date future dà il
  WARNING T-11, non un ERROR.
- **Il precedente della domanda 3 della sessione 14**: `ap-gdpr-04` usa gli attori dell'AI Act risolti sul
  GDPR; la sessione 16 decide se aggiungere `ai-act:art-3`, letto **contro le modifiche dell'AI Omnibus**.
- La baseline dopo la sessione 15 (dal suo rapporto, da rimisurare): validatori 0 errori, 45 non verificati,
  disposizioni 102; `tools/selftest.mjs` 120; le 24 suite 1250; Control Room 76 · 1 saltato; suite browser
  343 · 0 · 1; gate avversariale 65 · 0 · 3 · 1; prontezza 17 di 20, rifiuta.

## 16.0 · Domande da porre all'autore, prima di toccare qualcosa di pubblicato

Prima una ricognizione in sola lettura, con le fonti **lette**: l'AI Act dal Cellar per CELEX 32024R1689;
**l'AI Omnibus per CELEX 32026R1744, articolo per articolo, per sapere che cosa sostituisce, inserisce o
sopprime negli Articoli che le regole citano**; i metadati SPARQL (atti modificativi, rettifiche, e la lingua di
ogni rettifica); le fonti tier 2, se restano. Se esiste un testo consolidato, dillo e dì se l'hai letto; se no,
il testo che conta è l'atto originale più l'Omnibus, letti insieme. Poi **una domanda per volta tramite lo
strumento di domande**, con la raccomandazione in prima posizione e la motivazione nella domanda stessa. Almeno:

1. **La tabella dell'AI Act** (§8, domanda 4 della sessione 13): per ciascuna regola i riferimenti (fonte,
   `supports`, `for`, locator come letto, e se il locator punta al testo modificato) e le `condition_provisions`;
   il `threshold_basis` di `ap-ai-act-03`; le nuove disposizioni (numero, titolo e riassunto come letti, parola
   per parola, nel testo in vigore); le esenzioni stringa rese oggetto **con il testo invariato**. Ogni testo
   visibile su `applies.html` e su `/instruments/ai-act/` che cambia, prima e dopo.
2. **F-4 (V2C-06)**, `ap-ai-act-03`: il comparatore dell'Art. 51(2) come letto (e se l'Omnibus lo tocca); la
   chiave rinominata o no, e che cosa ne segue per `agent/detector/fields.mjs`.
3. **F-8 (V2C-10) e le date** (`rule-dates-not-derived`): per `ap-ai-act-01`, `-06`, `-07` la tranche del 2
   dicembre 2026; per `-02`, `-05`, `-06`, `-07` le altre date derivate. Una domanda per regola dove qualcosa
   cambia. **Leggi prima i record degli eventi e le loro fonti** (sessione 15: un evento può parlare d'altro
   rispetto alla regola che lo cita), e chiedi se `ai-act:art-3-63` debba restare tra gli obblighi di `-02`.
4. **Gli attori definiti dall'AI Act**: se aggiungere `ai-act:art-3` (i punti che le regole usano) e se
   `ap-gdpr-04` debba citarlo, sul precedente della domanda 3 della sessione 14.
5. **Le fonti tier 2** di `ap-ai-act-02` e `-04`: quale testo tier 1 regge la regola, e che ruolo resta alla
   fonte tier 2 (sessione 15, domanda 4: `context` o `direct` per la motivazione).
6. **Ogni altra cosa oltre la forma** trovata leggendo: una domanda per regola o per record.
7. **Le asserzioni**, misurate **dopo** aver scritto i dati approvati e rilanciato le suite: le regole portate a
   v2 escono da `RULES_V1` ed entrano in `RULES_V2` (una lista `RULES_AI_ACT`); X1 e X3 passano ai valori
   misurati; ogni altra premessa che si sposta (il registro dei campi, Y2–Y4, i test che cercano un caso nei dati
   vivi) si nomina. Chiedere prima di cambiare un'asserzione.

Registra ogni risposta in §8 con le parole dell'autore, e committa subito. Ciò che non è approvato non entra.

## 16.1 · L'AI Act

- Ogni valore scritto in `data/` è letto da una fonte recuperata, con `last_verified` della lettura; la nota
  di verifica dice che cosa è stato letto e dove, **e in quale versione del testo (originale o come modificato
  dall'Omnibus)**. **Nulla dalla memoria del modello, nulla dalle bozze del design senza rileggerlo.**
- Le regole portate a v2 diventano pubblicabili (`publishable`, derivato); il rapporto TRIGGERS lo mostra.
  Una regola che non può esserlo resta in `RULES_V1` e il rapporto lo dice.
- `applies.html` e la sua nota D-2 non cambiano; cambia solo ciò che le regole stampano, nelle parole
  approvate.
- `node tools/_footer.mjs` rilanciato; una seconda esecuzione scrive 0 file.
- Aperto nel browser: `applies.html` con le combinazioni che fanno scattare le sette regole (per esempio
  `?actor=actor:gpai-provider&activity=activity:gpai-provision`, `?actor=actor:public-authority&activity=activity:ai-deployment`,
  `?actor=actor:ai-provider&territory=territory:non-eu-serving-eu`), `/instruments/ai-act/` e `/instruments/gdpr/`
  se `ap-gdpr-04` cambia, nei due temi, a 1280px e 390px.

## 16.2 · Scrivere e verificare

- Ogni commit che tocca un file pubblicato porta la riga `Evidence:`; `tools/commit-evidence.mjs
  <base della sessione> HEAD` deve dare 0 commit senza evidenza.
- Rilancia tutto, prima e dopo, e salva gli output su file: `validate`, `i18n-audit`, `design-qa`,
  `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`; le 25 suite (con
  `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, o il percorso dell'ambiente),
  la suite browser con `--require-browser`, il gate avversariale, `agent/schemas/cli.mjs check`,
  `.control-room/cli.mjs boundary` e `routes`, `tools/og-image.mjs --check`,
  `agent/production/cli.mjs readiness` (con `BROWSER_QA_CHROME` impostato).
- **Rilancia `evidence-audit` subito dopo aver scritto i dati, prima di committare**: nella sessione 15 le
  prime regole con soglie hanno esposto un difetto di T-03 che nessuna sessione precedente poteva vedere.
- **Rilancia le 24 suite prima del checkpoint, non solo `tools/selftest.mjs`.**
- Se una suite fallisce per una premessa cambiata, si dice quale e perché, e si chiede prima di cambiare
  un'asserzione o un registro.
- Non scrivere file mentre la suite browser gira. Leggi il `git diff` completo prima di ogni commit.

## 16.3 · Checkpoint — la sessione si ferma qui

- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 15: decisioni e commit;
  prima/dopo di ogni testo cambiato; le fonti lette, con data, locator e versione del testo; il rapporto
  TRIGGERS prima e dopo; i conteggi con il motivo di ogni movimento; ciò che non è stato verificato e perché; i
  rilievi trovati; la checklist (16.0–16.4) e come controllare a mano.
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore; si registra in §8, e le righe di V2C-06 e V2C-10 in
  `docs/V2-CLOSURE.md` indicano il commit solo dopo l'approvazione. Poi la bozza del prompt della sessione 17
  (16.4), **prima** di chiedere della pull request.

## 16.4 · La bozza del prompt della sessione 17 — dopo l'approvazione del checkpoint

Come la sessione 15 ha scritto questo prompt:
- `docs/prompts/v2-session-17.md`, in italiano, sul modello di questo file; il commento di provenienza
  dice da quali righe di §8 è tratto.
- Il contenuto viene da §8: la riga del piano ("**17**: the Data Act, NIS2, DORA, the CRA (10); then the
  `rule-*` flip to ERROR, and the entry condition is met; and two maintenance checks …") e il metodo della
  domanda 4 della sessione 13, più ciò che le sessioni 14–16 avranno deciso.
- Lo stato di partenza **misurato sull'albero approvato della sessione 16**: le dieci regole rimaste con i loro
  backlog, le disposizioni registrate e quelle che mancano, i conteggi della baseline; e che cosa il flip e i
  due controlli di manutenzione richiedono, come §8 li descrive.
- Le lezioni delle sessioni 8–16 aggiunte a quelle qui sotto.
- **Il prompt non registra alcuna decisione**: la sua prima scrittura sarà la riga «The scope of v2
  Session 17» in §8, con le parole dell'autore.
- Commit sul branch della sessione, con una voce nel registro di `docs/HANDOVER.md`; poi chiedi se aprire
  una pull request verso `main`, che porta insieme la sessione 16 e il prompt della 17, e registra la sorte
  del branch. **Non pushare sul branch dopo aver aperto la PR.** Se la PR è già aperta (o già unita) quando
  l'autore chiede la bozza, il prompt va su un branch nuovo tagliato dal branch della sessione
  (`claude/v2-session-17-prompt`), o, se l'ambiente assegna un solo branch, sul branch della sessione
  riallineato a `main`, e lo si dice.

## Cosa NON fare in questa sessione

- Non toccare le regole del Data Act, di NIS2, DORA e CRA (sessione 17).
- Non toccare le regole del GDPR, del DSA e del DMA oltre a ciò che l'autore decide su `ap-gdpr-04`
  (domanda 4).
- Non leggere come legge una modifica proposta (un arco di modalità `proposed`); l'AI Omnibus è in vigore, ma
  ogni sua disposizione si legge nel suo testo, non nelle bozze.
- Non scrivere `modality`, `publishable`, `verification_state` o un'altra proprietà derivata in `data/`.
- Non fare il flip dei BACKLOG `rule-*`, `scope-decision-missing`, `status-basis-missing`,
  `edge-v1-sources`, `edge-analytical-no-claim`.
- Non implementare i due controlli di manutenzione (sessione 17) né i controlli della mappa M-08…M-16.
- Non toccare `applies.html` né la sua nota; non ritirare la pagina.
- Non correggere paragrafi del brief né claim (per esempio `part-4.p2` e `clm-dma-ex-ante`, rilievo della
  sessione 15); un difetto trovato si porta all'autore.
- Non avviare la Fase 4, il capitolo finanza, il post-v2, né la sessione 17: scriverne il prompt (16.4) non
  è avviarla.
- Non dichiarare la v2 conclusa; non dichiarare «sicurezza operativa dimostrata».
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione.
- Non toccare la licenza né il testo di non affiliazione o di assenza di consulenza legale; non scrivere
  nel README.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–15 (da `docs/HANDOVER.md`; non ripeterle)

- **I testi che il lettore vede si approvano parola per parola prima di scriverli.**
- **Ciò che si dice all'autore va misurato e citato esattamente**; e si legge prima di chiedere. **Prima di
  dire dove un campo si stampa, cercalo nel codice** (sessione 15: il `published` di una fonte non si stampa
  solo nella bibliografia ma in ogni citazione, `js/format.js` `cite()`; l'errore è stato corretto con una
  domanda in più).
- **Un difetto che il lavoro espone si porta all'autore**: né corretto in silenzio, né lasciato in silenzio.
  Leggi l'Articolo intero, non solo il punto che la bozza cita. Nella sessione 15 la lettura ha trovato due
  titoli DMA diversi dalla Gazzetta, una nota di fonte contraddetta dal testo («Silent on the data access
  portal»), e un «immediately» contraddetto dall'Art. 3(10) del DMA, che vive anche in una claim e nel brief.
- **Anche un controllo può avere un difetto**: il primo caso di un tipo (le prime regole con soglie) può
  esporlo. Mostra il difetto su un caso piantato, prima e dopo la correzione, e chiedi prima di correggere.
- **Le date derivate dicono qualcosa sugli eventi**: nella sessione 15 una data mancante veniva da un evento
  che non nominava due Articoli (DSA Artt. 38, 39); e un evento citato da una regola parlava d'altro (la
  designazione di AWS e Azure fuori dalle soglie, su una regola sulle soglie). Leggi gli eventi e le loro fonti.
- **Rettifiche e modifiche.** Prima di citare un testo, chiedi ai metadati SPARQL se un atto lo modifica o lo
  rettifica, e **in quali lingue** è ogni rettifica (sessione 15: undici rettifiche del DSA, nessuna in
  inglese; tre del DMA, una in inglese, sull'Art. 13(8)); leggi quella nella lingua citata.
- **La domanda sulle asserzioni si pone dopo aver misurato**; una premessa che la domanda non ha nominato si
  chiede a parte (sessione 15: il conteggio delle date in X3).
- **Una regola che dipende dalla data non è un ERROR**: è un WARNING. Ma **T-10 è un ERROR per una regola uscita
  da `RULES_V1`**: le date derivate vanno decise prima che esca.
- **La suite browser e i self-test trovano ciò che la lettura non trova**; anche il registro dei campi.
  Rilanciali prima di dichiarare un esito, e non scrivere file mentre girano.
- **Branch e merge.** Non pushare su un branch dopo aver aperto la sua PR; `main` può muoversi durante la
  sessione: riscarica prima dell'ultima scrittura. **Nella sessione 15 la PR #43 del branch è stata aperta e
  unita dall'account dell'autore prima del checkpoint**: lo si è trovato solo al riscaricamento finale, e il
  rapporto lo ha riportato senza riconciliarlo. Controlla `origin/main` anche dopo ogni commit di dati.
- **Riavvii del worker.** Registra ogni risposta in §8 e committa subito (nella sessione 15 il worker è
  ripartito due volte senza perdere nulla per questo). Salva gli output su file. Non usare `pkill -f` con una
  stringa che compare nella tua stessa riga di comando; `ss` non è installato: ferma un server per PID.
- **`js/applies.js` non si importa in Node** (si avvia su `document`): il suo rendering si verifica nel
  browser e sulle pagine generate.
- **Nessun output di agenti in `agent/records/`**; si diffano solo i record toccati.

## Criterio di uscita e consegna

La sessione è completa in uno di due casi: 16.1 è scritto come l'autore l'ha deciso, ogni controllo
rilanciato è a 0 errori, il checkpoint è approvato e il prompt della sessione 17 è scritto (16.4); oppure
l'autore decide di fermarsi.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (16.0–16.4) indica:
- cosa è stato scritto (file, righe di §8, commit);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
