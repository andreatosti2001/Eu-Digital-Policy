<!--
Provenance: the prompt of v2 Session 15, drafted at the end of v2 Session 14 (29 Oct 2026) as its item 14.4,
on the author's request recorded in docs/prompts/v2-session-14.md ("include the drafting of session 15 at the
end of the session"), after "The checkpoint of v2 Session 14" was approved. Drawn from docs/ROADMAP-v2.md §8:
the plan row for Sessions 13–17 ("15: the DSA (F-6, F-7) and the DMA (9)"), the method of v2 Session 13,
13.0 question 4, and the rows of v2 Session 14 (in particular question 3, on conditions another Act defines,
and question 5, on the assertions); from docs/V2-CLOSURE.md (V2C-08, V2C-09); and from the v2 Session 14
report in docs/HANDOVER.md. The starting state was measured on Session 14's approved tree (8c1b1a3). The
decisions live in those rows and nowhere else; this file is the instruction text that cites them. Written in
Italian, as the author's session prompts are. The author may change it before use.
-->

SESSION 15 — Fase 3, terza sessione sulle regole: le nove regole del DSA e del DMA alla forma v2, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Verifica che `main`
contenga la sessione 14 e questo prompt:
- `docs/ROADMAP-v2.md` §8 ha la riga «The checkpoint of v2 Session 14»;
- `node tools/evidence-audit.mjs --as-of <oggi>` riporta «publishable 7 of 33: ap-gdpr-01, ap-gdpr-02,
  ap-gdpr-03, ap-gdpr-04, ap-pld-01, ap-eidas2-01, ap-cross-01»;
- `docs/prompts/v2-session-15.md` esiste.

Se manca qualcosa in `main`, fermati e segnalalo. (La sessione 14 e questo prompt entrano in `main` con la
stessa pull request, se l'autore ne apre una.)

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 15» con le
parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo
con lo strumento di domande. Senza quella riga non si scrive nulla, nemmeno in `docs/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso: `origin/scout/digest-digest-2026-10-26T13-10-32Z` e
`origin/claude/v2-session-8-findings` (già nel registro). Se il branch della sessione 14
(`claude/zen-hamilton-rtgv1j`) risulta non unito, la sua pull request non è ancora unita: segnalalo.

Crea un branch di sessione (`claude/v2-session-15-dsa-dma-rules` o quello assegnato dall'ambiente). Non
lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, in particolare «Non pubblicare "what applies to me" prima che i trigger siano
   verificati con lo stesso rigore delle claim».
2. `docs/ROADMAP-v2.md`: §4 Fase 3; in §8 la riga del piano (sessioni 13–17), la domanda 4 della sessione 13
   (il metodo), e tutte le righe della sessione 14, in particolare la domanda 3 (le condizioni definite da
   un altro atto), la domanda 4c (`ap-cross-01`, consegnata a questa sessione), la domanda 5 (`RULES_V1`) e
   il checkpoint.
3. `docs/V2-CLOSURE.md`: V2C-02, V2C-08 (F-6), V2C-09 (F-7).
4. `docs/V2-DATA-DESIGN.md` §2 (T-01…T-11) e §7 (F-6, F-7); `docs/v2-design/applicability-rule.schema.json` e
   `docs/v2-design/applicability-examples.json` (le bozze `ap-dsa-01`, `ap-dsa-02`, `ap-dsa-04`, lette il 25
   ottobre 2026: **un punto di partenza da rileggere, non da copiare**).
5. `docs/HANDOVER.md`: il rapporto della sessione 14 («Found, for the author», «What was not verified»).
6. Il codice e i dati che toccherai: `data/applicability.json` (`$description` e le nove regole),
   `data/instruments.json` (le disposizioni di `dsa` e `dma`), `data/timeline.json` (gli eventi che le regole
   citano), `data/sources.json` (`src-eurlex-dsa`, `src-eurlex-dsa-da-2050`, `src-eurlex-dma`,
   `src-ec-apple-meta-dma-2025`, `src-ec-dma-review-2026`); `tools/trigger-audit.mjs` (`RULES_V1`);
   `tools/selftest.mjs` X1, X2, X3, Y1–Y3 (`RULES_PILOT`, `RULES_GDPR`, `RULES_V2`, `RULES_2026_10_28`);
   `agent/detector/fields.mjs` (il registro dei campi, comprese le chiavi delle soglie).

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e
attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

Una voce, poi checkpoint, poi la bozza del prompt della sessione 16 (15.4):
- **15.1 il DSA e il DMA**: le nove regole (`ap-dsa-01`…`ap-dsa-05`, `ap-dma-01`…`ap-dma-04`) portate alla
  forma v2 contro i loro Articoli, fino a essere pubblicabili, **con il metodo deciso nella sessione 13**
  (§8, domanda 4): una tabella per strumento (due tabelle, una domanda ciascuna), e una domanda separata,
  regola per regola, per tutto ciò che va oltre la forma. F-6 (V2C-08) e F-7 (V2C-09) sono tra queste; così
  le due segnalazioni su `ap-cross-01` che la sessione 14 ha consegnato a questa (§8, domanda 4c).

Le altre 17 regole del backlog (AI Act, Data Act, NIS2, DORA, CRA), F-4 e F-8 **non** si toccano:
appartengono alle sessioni 16 e 17 (§8, il piano).

## Lo stato di partenza

Misurato il 29 ottobre 2026 sull'albero approvato della sessione 14 (`8c1b1a3`). **Rimisura tutto.**
- TRIGGERS: 33 regole, pubblicabili 7; BACKLOG `rule-v1-sources` 26, `rule-scope-basis-missing` 26,
  `rule-condition-provisions-missing` 26, `rule-exemption-v1` 11 (tra cui `ap-dsa-01`, `ap-dsa-03`,
  `ap-dsa-04`, `ap-dsa-05`, `ap-dma-01`), `rule-threshold-basis-missing` 3 (tra cui `ap-dsa-02`, `ap-dma-02`),
  `rule-dates-not-derived` 10 (tra cui `ap-dsa-02`, che omette `tl-dsa-2024-02-17-application`; `ap-dsa-05`,
  che omette `tl-dsa-2023-08-01-application`; `ap-dma-03`, che non ha date e omette
  `tl-dma-2023-05-01-application`).
- Le nove regole, tutte con `last_verified` 2026-08-27:
  - `ap-dsa-01`: attori `online-platform`, `vlop`; `applies`; un'esenzione stringa (micro e piccole imprese,
    «Section 3 online-platform obligations»). **F-7 / V2C-09**: omette l'eccezione dell'Art. 24(3) e la coda
    di dodici mesi (Art. 19, secondo il design: da rileggere).
  - `ap-dsa-02`: attore `vlop`, soglia `monthly_active_eu_users_gte` 45000000; `applies`; senza
    `threshold_basis`.
  - `ap-dsa-03`: attori `online-platform`, `large-company`; `possible`; un'esenzione stringa.
  - `ap-dsa-04`: attività `marketplace-activity`; `applies`. **F-6 / V2C-08**: l'esenzione nomina «the
    online-platform section»; secondo il design l'esclusione per i marketplace è la Sezione 4, Art. 29 (da
    rileggere: V2C-08 soddisfa anche il criterio A).
  - `ap-dsa-05`: attore `researcher`; `possible`; fonti `src-eurlex-dsa` e `src-eurlex-dsa-da-2050`; data
    `tl-dsa-2025-10-29-delegated-act`.
  - `ap-dma-01`: attore `gatekeeper`; `applies`; fonti `src-eurlex-dma` e `src-ec-apple-meta-dma-2025` (tier 2).
  - `ap-dma-02`: attori `large-company`, `online-platform`, `cloud-provider`; due soglie
    (`monthly_active_eu_end_users_gte`, `yearly_active_eu_business_users_gte`); `possible`; data
    `tl-dma-2026-11-01-designation`.
  - `ap-dma-03`: attore `sme`; `unlikely`; **unica fonte `src-ec-dma-review-2026` (tier 2)**: T-02 chiede un
    riferimento `scope` diretto a un testo tier 1.
  - `ap-dma-04`: attività `cloud-services`; `possible`; date `tl-dma-2026-11-01-designation` e
    `tl-dma-2027-05-01-market-investigation` (leggi i loro record prima di citarle).
- Disposizioni registrate: `dsa` 16, 25, 28, 30, 33, 34, 35, 38, 39, 40, 49, 56, 74 — **mancano l'Art. 3
  (definizioni), l'Art. 19 e l'Art. 29** (le esclusioni per le micro e piccole imprese); `dma` 2, 3, 5, 6, 7,
  13, 30, 38, 53.
- Archi: `rel-dsa-gdpr-transparency-minimisation`, `rel-dsa-dma-scope`, `rel-dma-gdpr-consent`,
  `rel-dma-tfeu-102`, e gli archi `defers-to` verso AVMSD, copyright DSM, P2B.
- **Consegnato dalla sessione 14** (§8, domanda 4c): `ap-cross-01` risponde «applies» senza `depends_on`,
  mentre le linee guida EDPB 3/2025 (§88) dicono che un sistema di raccomandazione può non trattare dati
  personali; e la sua motivazione nomina l'archivio pubblicitario del DSA (Art. 39), che nessuna fonte della
  regola copre (il riferimento EDPB stampa «(supports in part)»). La regola è già pubblicabile: ogni
  modifica è una domanda all'autore, non un obbligo.
- **Il precedente della domanda 3 della sessione 14**: una condizione definita da un altro atto si risolve
  sulle disposizioni dello strumento della regola, e quelle dell'altro atto arrivano nella sessione di
  quello strumento. Per il DSA e il DMA le definizioni sono dello strumento stesso: l'Art. 3 del DSA e
  l'Art. 2 del DMA (`dma:art-2` esiste) vanno letti e, se servono, aggiunti.
- La baseline dopo la sessione 14 (dal suo rapporto, da rimisurare): validatori 0 errori, 45 non verificati,
  disposizioni 99; `tools/selftest.mjs` 119; le 24 suite 1249; Control Room 76 · 1 saltato; suite browser
  343 · 0 · 1; gate avversariale 65 · 0 · 3 · 1; prontezza 17 di 20, rifiuta.

## 15.0 · Domande da porre all'autore, prima di toccare qualcosa di pubblicato

Prima una ricognizione in sola lettura, con le fonti **lette** (il DSA dal Cellar per CELEX 32022R2065; il DMA
per CELEX 32022R1925; il regolamento delegato sull'accesso ai dati, `src-eurlex-dsa-da-2050`; i metadati
SPARQL per sapere se un atto li modifica; le due fonti tier 2 del DMA, se restano). Poi **una domanda per
volta tramite lo strumento di domande**, con la raccomandazione in prima posizione e la motivazione nella
domanda stessa. Almeno:

1. **Le tabelle del DSA e del DMA** (§8, domanda 4 della sessione 13), una domanda per strumento: per
   ciascuna regola i riferimenti (fonte, `supports`, `for`, locator come letto) e le `condition_provisions`;
   i `threshold_basis` di `ap-dsa-02` e `ap-dma-02` (il suffisso della chiave deve essere il comparatore del
   testo); le nuove disposizioni (numero, titolo e riassunto come letti, parola per parola); le esenzioni
   stringa rese oggetto **con il testo invariato**. Ogni testo visibile su `applies.html` e sulle pagine
   `/instruments/dsa/` e `/instruments/dma/` che cambia, prima e dopo.
2. **F-6 (V2C-08)**, `ap-dsa-04`, e **F-7 (V2C-09)**, `ap-dsa-01`: il testo esatto, letto sugli Articoli;
   oppure lasciarli, dicendo perché. Una domanda per ciascuna.
3. **Le date** (`rule-dates-not-derived`): per `ap-dsa-02`, `ap-dsa-05`, `ap-dma-03`, aggiungere le date
   derivate o dire perché no; e le date di `ap-dma-02` e `ap-dma-04`, lette nei loro record. Una domanda per
   regola dove qualcosa cambia.
4. **`ap-dma-03`** e le fonti tier 2 di `ap-dma-01`: quale testo tier 1 regge la regola, o resta nel backlog.
5. **`ap-cross-01`** (consegnato dalla sessione 14): il `depends_on` e l'archivio pubblicitario, ora che i
   riferimenti del DSA si possono leggere; oppure lasciare, dicendo perché.
6. **Ogni altra cosa oltre la forma** trovata leggendo: una domanda per regola.
7. **Le asserzioni**, misurate **dopo** aver scritto i dati approvati e rilanciato le suite (come nella
   sessione 14, domanda 5): le regole portate a v2 escono da `RULES_V1` ed entrano in `RULES_V2`; X1 e X3
   passano ai valori misurati; ogni altra premessa che si sposta (il registro dei campi, i test che cercano
   un caso nei dati vivi) si nomina. Chiedere prima di cambiare un'asserzione.

Registra ogni risposta in §8 con le parole dell'autore, e committa subito. Ciò che non è approvato non entra.

## 15.1 · Il DSA e il DMA

- Ogni valore scritto in `data/` è letto da una fonte recuperata, con `last_verified` della lettura; la nota
  di verifica dice che cosa è stato letto e dove. **Nulla dalla memoria del modello, nulla dalle bozze del
  design senza rileggerlo.**
- Le regole portate a v2 diventano pubblicabili (`publishable`, derivato); il rapporto TRIGGERS lo mostra.
  Una regola che non può esserlo resta in `RULES_V1` e il rapporto lo dice.
- `applies.html` e la sua nota D-2 non cambiano; cambia solo ciò che le regole stampano, nelle parole
  approvate.
- `node tools/_footer.mjs` rilanciato; una seconda esecuzione scrive 0 file.
- Aperto nel browser: `applies.html` con le combinazioni che fanno scattare le nove regole (per esempio
  `?actor=actor:vlop&activity=activity:recommender-systems`, `?actor=actor:gatekeeper`), `/instruments/dsa/` e
  `/instruments/dma/`, nei due temi, a 1280px e 390px.

## 15.2 · Scrivere e verificare

- Ogni commit che tocca un file pubblicato porta la riga `Evidence:`; `tools/commit-evidence.mjs
  origin/main HEAD` deve dare 0 commit senza evidenza.
- Rilancia tutto, prima e dopo, e salva gli output su file: `validate`, `i18n-audit`, `design-qa`,
  `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`; le 25 suite (con
  `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, o il percorso dell'ambiente),
  la suite browser con `--require-browser`, il gate avversariale, `agent/schemas/cli.mjs check`,
  `.control-room/cli.mjs boundary` e `routes`, `tools/og-image.mjs --check`,
  `agent/production/cli.mjs readiness` (con `BROWSER_QA_CHROME` impostato).
- **Rilancia le 24 suite prima del checkpoint, non solo `tools/selftest.mjs`**: nella sessione 14 il test 43
  di `agent/detector` cercava nei dati vivi un caso che il lavoro aveva fatto sparire.
- Se una suite fallisce per una premessa cambiata, si dice quale e perché, e si chiede prima di cambiare
  un'asserzione o un registro.
- Non scrivere file mentre la suite browser gira. Leggi il `git diff` completo prima di ogni commit.

## 15.3 · Checkpoint — la sessione si ferma qui

- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 14: decisioni e commit;
  prima/dopo di ogni testo cambiato; le fonti lette, con data e locator; il rapporto TRIGGERS prima e dopo;
  i conteggi con il motivo di ogni movimento; ciò che non è stato verificato e perché; i rilievi trovati; la
  checklist (15.0–15.4) e come controllare a mano.
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore; si registra in §8, e le righe di V2C-08 e V2C-09 in
  `docs/V2-CLOSURE.md` indicano il commit solo dopo l'approvazione. Poi la bozza del prompt della sessione 16
  (15.4), **prima** di chiedere della pull request.

## 15.4 · La bozza del prompt della sessione 16 — dopo l'approvazione del checkpoint

Come la sessione 14 ha scritto questo prompt:
- `docs/prompts/v2-session-16.md`, in italiano, sul modello di questo file; il commento di provenienza
  dice da quali righe di §8 è tratto.
- Il contenuto viene da §8: la riga del piano ("**16**: the AI Act (7, F-4, F-8's 2 Dec 2026 tranche).") e il
  metodo della domanda 4 della sessione 13, più ciò che le sessioni 14 e 15 avranno deciso (in particolare
  la domanda 3 della sessione 14: `ap-gdpr-04` usa gli attori dell'AI Act risolti sul GDPR; la sessione 16
  decide se aggiungere `ai-act:art-3`, letto **contro le modifiche dell'AI Omnibus**, 32026R1744).
- Lo stato di partenza **misurato sull'albero approvato della sessione 15**: le regole `ap-ai-act-*` con i
  loro backlog, le disposizioni registrate e quelle che mancano, F-4 (la chiave
  `cumulative_training_flop_gte` di `ap-ai-act-03`) e F-8 (la tranche del 2 dicembre 2026,
  `ap-ai-act-01`, `-06`, `-07`); i conteggi della baseline.
- Le lezioni della sessione 15 aggiunte a quelle delle sessioni 8–14.
- **Il prompt non registra alcuna decisione**: la sua prima scrittura sarà la riga «The scope of v2
  Session 16» in §8, con le parole dell'autore.
- Commit sul branch della sessione, con una voce nel registro di `docs/HANDOVER.md`; poi chiedi se aprire
  una pull request verso `main`, che porta insieme la sessione 15 e il prompt della 16, e registra la sorte
  del branch. **Non pushare sul branch dopo aver aperto la PR.** Se la PR è già aperta quando l'autore chiede
  la bozza, il prompt va su un branch nuovo tagliato dal branch della sessione
  (`claude/v2-session-16-prompt`).

## Cosa NON fare in questa sessione

- Non toccare le regole dell'AI Act, del Data Act, di NIS2, DORA e CRA, né F-4 o F-8 (sessioni 16–17).
- Non toccare le cinque regole del GDPR oltre a ciò che l'autore decide su `ap-cross-01` (domanda 5).
- Non leggere come legge una modifica proposta (un arco di modalità `proposed`).
- Non scrivere `modality`, `publishable`, `verification_state` o un'altra proprietà derivata in `data/`.
- Non fare il flip dei BACKLOG `rule-*`, `scope-decision-missing`, `status-basis-missing`,
  `edge-v1-sources`, `edge-analytical-no-claim`.
- Non implementare i due controlli di manutenzione (sessione 17) né i controlli della mappa M-08…M-16.
- Non toccare `applies.html` né la sua nota; non ritirare la pagina.
- Non correggere paragrafi del brief; un difetto trovato si porta all'autore.
- Non avviare la Fase 4, il capitolo finanza, il post-v2, né la sessione 16: scriverne il prompt (15.4) non
  è avviarla, e nessuna regola dell'AI Act si tocca.
- Non dichiarare la v2 conclusa; non dichiarare «sicurezza operativa dimostrata».
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione.
- Non toccare la licenza né il testo di non affiliazione o di assenza di consulenza legale; non scrivere
  nel README.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–14 (da `docs/HANDOVER.md`; non ripeterle)

- **I testi che il lettore vede si approvano parola per parola prima di scriverli.**
- **Ciò che si dice all'autore va misurato e citato esattamente**; e si legge prima di chiedere.
- **Un difetto che il lavoro espone si porta all'autore**: né corretto in silenzio, né lasciato in silenzio.
  Nella sessione 14 la lettura dell'Articolo ha trovato due difetti che il design non aveva visto (il testo
  dell'Art. 30(5) e le istituzioni dell'Unione, Art. 2(3)): leggere l'Articolo intero, non solo il punto
  che la bozza cita.
- **Rettifiche e modifiche.** Prima di citare un testo, chiedi ai metadati SPARQL se un atto lo modifica o lo
  rettifica; leggi la rettifica nella lingua citata (sessione 14: la rettifica inglese del GDPR tocca l'Art.
  37(1)(c)).
- **La domanda sulle asserzioni si pone dopo aver misurato** (sessione 14, domanda 5): scrivi i dati
  approvati, rilancia le suite, e chiedi con l'elenco esatto di ciò che si sposta. Il commit dei dati può
  precedere la risposta, purché nessuna asserzione cambi prima; lo stato rosso intermedio si dice.
- **Una regola che dipende dalla data non è un ERROR**: è un WARNING.
- **La suite browser e i self-test trovano ciò che la lettura non trova**; anche il registro dei campi.
  Rilanciali prima di dichiarare un esito, e non scrivere file mentre girano.
- **Branch e merge.** Non pushare su un branch dopo aver aperto la sua PR; `main` può muoversi durante la
  sessione: riscarica prima dell'ultima scrittura.
- **Riavvii del worker.** Registra ogni risposta in §8 e committa subito (nelle sessioni 13 e 14 il worker è
  ripartito senza perdere nulla per questo). Salva gli output su file. Non usare `pkill -f` con una stringa
  che compare nella tua stessa riga di comando; `ss` non è installato: ferma un server per PID.
- **`js/applies.js` non si importa in Node** (si avvia su `document`): il suo rendering si verifica nel
  browser e sulle pagine generate.
- **Nessun output di agenti in `agent/records/`**; si diffano solo i record toccati.

## Criterio di uscita e consegna

La sessione è completa in uno di due casi: 15.1 è scritto come l'autore l'ha deciso, ogni controllo
rilanciato è a 0 errori, il checkpoint è approvato e il prompt della sessione 16 è scritto (15.4); oppure
l'autore decide di fermarsi.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (15.0–15.4) indica:
- cosa è stato scritto (file, righe di §8, commit);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
