<!--
Provenance: the prompt of v2 Session 14, drafted at the end of v2 Session 13 (29 Oct 2026) on the author's
request ("draft session 14's prompt"; then "include the drafting of session 15 at the end of the
session", which became item 14.4), from docs/ROADMAP-v2.md §8 as it stands after "The checkpoint of v2
Session 13" (the plan row for Sessions 13–17 and the method of 13.0 question 4), from docs/V2-CLOSURE.md
(V2C-07) and from the v2 Session 13 report in docs/HANDOVER.md. The decisions live in those rows and nowhere
else; this file is the instruction text that cites them. Written in Italian, as the author's session prompts
are. The author may change it before use.
-->

SESSION 14 — Fase 3, seconda sessione sulle regole: le cinque regole del GDPR alla forma v2, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Verifica che `main`
contenga la sessione 13 e questo prompt:
- `docs/ROADMAP-v2.md` §8 ha la riga «The checkpoint of v2 Session 13»;
- `node tools/evidence-audit.mjs --as-of <oggi>` riporta «publishable 2 of 33: ap-pld-01, ap-eidas2-01»;
- `docs/prompts/v2-session-14.md` esiste.

Se manca qualcosa in `main`, fermati e segnalalo. (La sessione 13 è entrata in `main` come #40, `d9a3939`;
questo prompt con la sua pull request, se l'autore ne apre una.)

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 14» con le
parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo
con lo strumento di domande. Senza quella riga non si scrive nulla, nemmeno in `docs/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso: `origin/scout/digest-digest-2026-10-26T13-10-32Z` e
`origin/claude/v2-session-8-findings` (già nel registro). Se `claude/v2-session-14-prompt` risulta non
unito, la pull request di questo prompt non è ancora unita: segnalalo. (La sessione 13 è stata unita come
#40, `d9a3939`, e il registro lo dice.)

Crea un branch di sessione (`claude/v2-session-14-gdpr-rules` o quello assegnato dall'ambiente). Non
lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, in particolare «Non pubblicare "what applies to me" prima che i trigger siano
   verificati con lo stesso rigore delle claim».
2. `docs/ROADMAP-v2.md`: §4 Fase 3; in §8 tutte le righe della sessione 13, in particolare la domanda 4
   (il metodo), la domanda 5 (`RULES_V1`), la riga sul registro dei campi e il checkpoint.
3. `docs/V2-CLOSURE.md`: V2C-02, V2C-07 (F-5).
4. `docs/V2-DATA-DESIGN.md` §2 (T-01…T-11) e §7 (F-5); `docs/v2-design/applicability-rule.schema.json` e
   `docs/v2-design/applicability-examples.json` (le tre bozze del GDPR, lette il 25 ottobre 2026: **un punto
   di partenza da rileggere, non da copiare**).
5. `docs/HANDOVER.md`: il rapporto della sessione 13 («Found, for the author», «What was not verified»).
6. Il codice e i dati che toccherai: `data/applicability.json` (`$description` e le cinque regole),
   `data/instruments.json` (le disposizioni di `gdpr`), `data/sources.json` `src-eurlex-gdpr` e
   `src-edpb-guidelines-3-2025`; `tools/trigger-audit.mjs` (`RULES_V1`); `tools/selftest.mjs` X1, X3, Y1,
   Y2 (`RULES_V2`, `RULES_2026_10_28`); `agent/detector/fields.mjs` (il registro dei campi).

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e
attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

Una voce, poi checkpoint, poi la bozza del prompt della sessione 15 (14.4):
- **14.1 il GDPR**: le cinque regole sul GDPR (`ap-gdpr-01`…`ap-gdpr-04` e `ap-cross-01`, che ha
  `instrument: gdpr`) portate alla forma v2 contro i loro Articoli, fino a essere pubblicabili, **con il
  metodo deciso nella sessione 13** (§8, domanda 4): una tabella per lo strumento, approvata in una domanda,
  e una domanda separata, regola per regola, per tutto ciò che va oltre la forma. F-5 (V2C-07) è una di
  queste.

Le altre 26 regole, F-4 e F-6…F-8 **non** si toccano: appartengono alle sessioni 15–17 (§8, il piano).

## Lo stato di partenza

Misurato il 29 ottobre 2026 su `main` (`d9a3939`). **Rimisura tutto.**
- TRIGGERS: 33 regole, pubblicabili 2 (`ap-pld-01`, `ap-eidas2-01`); BACKLOG `rule-v1-sources` 31,
  `rule-scope-basis-missing` 31, `rule-condition-provisions-missing` 31, `rule-exemption-v1` 13 (tra cui
  `ap-gdpr-01`, `ap-gdpr-03`), `rule-threshold-basis-missing` 3, `rule-dates-not-derived` 10 (nessuna regola
  del GDPR).
- Le cinque regole: fonte nuda `src-eurlex-gdpr` (tier 1); `ap-cross-01` anche `src-edpb-guidelines-3-2025`
  (tier 2); tutte con data `tl-gdpr-2018-05-25-application` e `last_verified` 2026-08-27.
  - `ap-gdpr-01`: attività `processing-personal-data`, territorio `eu-established`; `applies`; due esenzioni
    stringa (uso personale o domestico; Art. 30(5)).
  - `ap-gdpr-02`: lo stesso, territorio `non-eu-serving-eu`; `likely`.
  - `ap-gdpr-03`: attore `public-authority`; `applies`; un'esenzione stringa (la direttiva sulla protezione
    dei dati nelle attività di contrasto, fuori dal dataset). **F-5 / V2C-07**: omette l'esenzione dell'Art.
    37(1)(a) per le autorità giurisdizionali nell'esercizio delle loro funzioni.
  - `ap-gdpr-04`: attori `ai-provider`, `ai-deployer`; `likely`. **L'attore è definito dall'AI Act**
    (Art. 3, punti 3 e 4), di cui il dataset non ha le disposizioni (`ai-act:art-3-63` esiste).
  - `ap-cross-01`: attori `vlop`, `online-platform`; attività `recommender-systems`,
    `online-platform-activity`; `applies`. **Gli attori sono definiti dal DSA** (Art. 3, definizioni; Art. 33
    per le VLOP), di cui il dataset ha l'Art. 33 ma non l'Art. 3.
- Disposizioni di `gdpr` registrate: 3, 5, 6, 9, 22, 25, 30, 33, 35, 37, 51, 56, 58, 60, 65, 83. **Mancano
  l'Art. 2 (ambito materiale) e l'Art. 4 (definizioni)**, che le bozze del design usano.
- Il GDPR ha un arco da una proposta: `rel-data-omnibus-gdpr` (COM(2025) 837, modalità `proposed`). **Una
  modifica proposta non è legge**: ogni riassunto e ogni locator descrivono il testo in vigore.
- La baseline dopo la sessione 13 (dal suo rapporto, da rimisurare): validatori 0 errori, 45 non
  verificati; `tools/selftest.mjs` 118; le 24 suite 1248; Control Room 76 · 1 saltato; suite browser
  343 · 0 · 1; gate avversariale 65 · 0 · 3 · 1; prontezza 17 di 20, rifiuta.

## 14.0 · Domande da porre all'autore, prima di toccare qualcosa di pubblicato

Prima una ricognizione in sola lettura, con le fonti **lette** (il GDPR dal Cellar del Publications Office
per CELEX 32016R0679; per `ap-cross-01` le linee guida EDPB 3/2025 e, se servono, il DSA, CELEX 32022R2065;
per `ap-gdpr-04`, se serve, l'AI Act, CELEX 32024R1689, come modificato). Poi **una domanda per volta tramite
lo strumento di domande**, con la raccomandazione in prima posizione e la motivazione nella domanda stessa.
Almeno:

1. **La tabella del GDPR** (§8, domanda 4 della sessione 13): per ciascuna delle cinque regole, i
   riferimenti (fonte, `supports`, `for`, locator come letto) e le `condition_provisions`; le nuove
   disposizioni `gdpr:art-2` e `gdpr:art-4` (numero, titolo e riassunto come letti, parola per parola); le
   esenzioni stringa rese oggetto **con il testo invariato** (`effect`, `basis`; `outside_dataset: true` per
   quella di `ap-gdpr-03`). Ogni testo visibile su `applies.html` e sulla pagina del GDPR che cambia, prima e
   dopo.
2. **F-5 (V2C-07)**, `ap-gdpr-03`: l'esenzione dell'Art. 37(1)(a) per le autorità giurisdizionali, il testo
   esatto, letto sull'Articolo; oppure lasciarla, dicendo perché.
3. **Gli attori definiti da un altro strumento**: `ap-gdpr-04` (AI Act, Art. 3(3)–(4)) e `ap-cross-01` (DSA).
   T-03 accetta una disposizione di uno strumento collegato da un arco (`rel-ai-act-gdpr-*`,
   `rel-dsa-gdpr-*`), ma aggiungerla qui anticipa lavoro delle sessioni 15 e 16. Proporre le opzioni: le
   disposizioni dell'altro strumento aggiunte ora, lette sul testo; oppure la regola resta nel backlog fino
   alla sessione di quello strumento (si dice, non si sostituisce).
4. **Ogni altra cosa oltre la forma** trovata leggendo (una data, un'esenzione, una condizione o un esito che
   l'Articolo non regge, un rilievo): una domanda per regola.
5. **Le asserzioni**: le regole portate a v2 escono da `RULES_V1` ed entrano in `RULES_V2`; X1 e X3 passano ai
   valori misurati; il registro dei campi (`agent/detector/fields.mjs`) riceve un percorso nuovo (per esempio
   `exemptions.outside_dataset`) **solo** con la classe decisa dall'autore. Chiedere prima di cambiare
   un'asserzione, dicendo quale premessa è cambiata.

Registra ogni risposta in §8 con le parole dell'autore, e committa subito. Ciò che non è approvato non entra.

## 14.1 · Il GDPR

- Ogni valore scritto in `data/` è letto da una fonte recuperata, con `last_verified` della lettura; la nota
  di verifica dice che cosa è stato letto e dove. **Nulla dalla memoria del modello, nulla dalle bozze del
  design senza rileggerlo.**
- Le regole portate a v2 diventano pubblicabili (`publishable`, derivato); il rapporto TRIGGERS lo mostra.
  Una regola che non può esserlo (domanda 3) resta in `RULES_V1` e il rapporto lo dice.
- `applies.html` e la sua nota D-2 non cambiano; cambia solo ciò che le regole stampano, nelle parole
  approvate.
- `node tools/_footer.mjs` rilanciato; una seconda esecuzione scrive 0 file.
- Aperto nel browser: `applies.html` con le combinazioni che fanno scattare le cinque regole (per esempio
  `?activity=activity:processing-personal-data&territory=territory:eu-established`), e
  `/instruments/gdpr/`, nei due temi, a 1280px e 390px.

## 14.2 · Scrivere e verificare

- Ogni commit che tocca un file pubblicato porta la riga `Evidence:`; `tools/commit-evidence.mjs
  origin/main HEAD` deve dare 0 commit senza evidenza.
- Rilancia tutto, prima e dopo, e salva gli output su file: `validate`, `i18n-audit`, `design-qa`,
  `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`; le 25 suite (con
  `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, o il percorso dell'ambiente),
  la suite browser con `--require-browser`, il gate avversariale, `agent/schemas/cli.mjs check`,
  `.control-room/cli.mjs boundary` e `routes`, `tools/og-image.mjs --check`,
  `agent/production/cli.mjs readiness` (con `BROWSER_QA_CHROME` impostato).
- **Rilancia le 24 suite prima del checkpoint, non solo `tools/selftest.mjs`**: nella sessione 13 il
  registro dei campi di `agent/detector` ha trovato cinque percorsi nuovi che nessun altro controllo vedeva.
- Se una suite fallisce per una premessa cambiata, si dice quale e perché, e si chiede prima di cambiare
  un'asserzione o un registro.
- Non scrivere file mentre la suite browser gira. Leggi il `git diff` completo prima di ogni commit.

## 14.3 · Checkpoint — la sessione si ferma qui

- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 13: decisioni e commit;
  prima/dopo di ogni testo cambiato; le fonti lette, con data e locator; il rapporto TRIGGERS prima e dopo;
  i conteggi con il motivo di ogni movimento; ciò che non è stato verificato e perché; i rilievi trovati; la
  checklist (14.0–14.4) e come controllare a mano.
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore; si registra in §8, e la riga di V2C-07 in
  `docs/V2-CLOSURE.md` indica il commit solo dopo l'approvazione. Poi la bozza del prompt della sessione 15
  (14.4), **prima** di chiedere della pull request.

## 14.4 · La bozza del prompt della sessione 15 — dopo l'approvazione del checkpoint

Su richiesta dell'autore, la sessione 14 si chiude scrivendo il prompt della sessione successiva, come la
sessione 13 ha scritto questo.
- `docs/prompts/v2-session-15.md`, in italiano, sul modello di questo file; il commento di provenienza
  dice da quali righe di §8 è tratto.
- Il contenuto viene da §8, non da questo prompt: la riga del piano (sessioni 13–17: "**15**: the DSA (F-6, F-7)
  and the DMA (9).") e il metodo della domanda 4 della sessione 13, più ciò che la sessione 14 avrà deciso (in
  particolare la domanda 3, sugli attori definiti da un altro strumento: se le definizioni del DSA restano
  da aggiungere, la sessione 15 le eredita).
- Lo stato di partenza **misurato sull'albero approvato della sessione 14**, non copiato dal piano: le regole
  del DSA e del DMA (`ap-dsa-*`, `ap-dma-*`) con i loro backlog, le disposizioni registrate e quelle che
  mancano, F-6 (V2C-08) e F-7 (V2C-09), `rule-threshold-basis-missing` per `ap-dsa-02` e `ap-dma-02`,
  `rule-dates-not-derived` per `ap-dsa-02`, `ap-dsa-05`, `ap-dma-03`; i conteggi della baseline.
- Le lezioni della sessione 14 aggiunte a quelle delle sessioni 8–13.
- **Il prompt non registra alcuna decisione**: la sua prima scrittura sarà la riga «The scope of v2
  Session 15» in §8, con le parole dell'autore.
- Commit sul branch della sessione, con una voce nel registro di `docs/HANDOVER.md`; poi chiedi se aprire
  una pull request verso `main`, che porta insieme la sessione 14 e il prompt della 15, e registra la sorte
  del branch. **Non pushare sul branch dopo aver aperto la PR.** Se la PR è già aperta quando l'autore chiede
  la bozza, il prompt va su un branch nuovo tagliato dal branch della sessione
  (`claude/v2-session-15-prompt`), come nella sessione 12.

## Cosa NON fare in questa sessione

- Non toccare le altre 26 regole, né F-4, F-6, F-7, F-8 (sessioni 15–17).
- Non leggere come legge una modifica proposta dal Data Omnibus (COM(2025) 837): le disposizioni e i
  riassunti descrivono il GDPR in vigore.
- Non scrivere `modality`, `publishable`, `verification_state` o un'altra proprietà derivata in `data/`.
- Non fare il flip dei BACKLOG `rule-*`, `scope-decision-missing`, `status-basis-missing`,
  `edge-v1-sources`, `edge-analytical-no-claim`.
- Non implementare i due controlli di manutenzione (sessione 17) né i controlli della mappa M-08…M-16.
- Non toccare `applies.html` né la sua nota; non ritirare la pagina.
- Non correggere paragrafi del brief; un difetto trovato si porta all'autore.
- Non avviare la Fase 4, il capitolo finanza, il post-v2, né la sessione 15: scriverne il prompt (14.4) non
  è avviarla, e nessuna regola del DSA o del DMA si tocca.
- Non dichiarare la v2 conclusa; non dichiarare «sicurezza operativa dimostrata».
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione.
- Non toccare la licenza né il testo di non affiliazione o di assenza di consulenza legale; non scrivere
  nel README.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–13 (da `docs/HANDOVER.md`; non ripeterle)

- **I testi che il lettore vede si approvano parola per parola prima di scriverli.**
- **Ciò che si dice all'autore va misurato e citato esattamente.** Nella sessione 13 due domande erano
  sbagliate in un dettaglio (un conteggio, le parole delle note): corrette in §8, ma andavano verificate
  prima di chiedere.
- **Un difetto che il lavoro espone si porta all'autore**: né corretto in silenzio, né lasciato in silenzio.
- **Una regola che dipende dalla data non è un ERROR**: è un WARNING. Un test che audita a una data fissa
  cambia quando una regola viene riletta dopo quella data (sessione 13, X1).
- **La suite browser e i self-test trovano ciò che la lettura non trova**; anche il registro dei campi.
  Rilanciali prima di dichiarare un esito, e non scrivere file mentre girano.
- **Branch e merge.** Non pushare su un branch dopo aver aperto la sua PR; `main` può muoversi durante la
  sessione: riscarica prima dell'ultima scrittura.
- **Riavvii del worker.** Registra ogni risposta in §8 e committa subito (nella sessione 13 il worker è
  ripartito due volte senza perdere nulla per questo). Salva gli output su file. Non usare `pkill -f` con
  una stringa che compare nella tua stessa riga di comando; `ss` non è installato: ferma un server per PID.
- **`js/applies.js` non si importa in Node** (si avvia su `document`): il suo rendering si verifica nel
  browser.
- **Nessun output di agenti in `agent/records/`**; si diffano solo i record toccati.

## Criterio di uscita e consegna

La sessione è completa in uno di due casi: 14.1 è scritto come l'autore l'ha deciso, ogni controllo
rilanciato è a 0 errori, il checkpoint è approvato e il prompt della sessione 15 è scritto (14.4); oppure
l'autore decide di fermarsi.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (14.0–14.4) indica:
- cosa è stato scritto (file, righe di §8, commit);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
