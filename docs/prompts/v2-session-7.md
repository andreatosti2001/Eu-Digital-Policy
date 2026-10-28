<!--
Provenance: the prompt of v2 Session 7, drafted at the end of v2 Session 6 (28 Oct 2026) from the
author's roadmap after v2 Session 5 (docs/prompts/v2-session-6.md, "Session 7 — item 2.4") and the
§8 rows of 27 Oct 2026 that close Session 6. The decisions live in those rows and nowhere else; this
file is the instruction text that cites them. Written in Italian, as the author's session prompts
are. The author may change it before use.
-->

SESSION 7 — Voce 2.4 (European Health Data Space), per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Verifica tre cose:
- che `main` contenga la pull request #24 (sessione 6: voce 2.3, `csa`), cioè almeno `fdc7727`;
- che `docs/ROADMAP-v2.md` §8 abbia le tre righe del 27 ottobre 2026 della sessione 6, fino a
  «The checkpoint of v2 Session 6 = item 2.3»;
- che `docs/prompts/v2-session-6.md` (la roadmap dell'autore per le sessioni 6–16) sia in `main`.

Se una delle tre manca in `main`, fermati e segnalalo.

La roadmap dell'autore è un piano, non un'autorizzazione: §8 lo dice nella riga «The scope of v2
Session 6». **Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 7»
con le parole con cui l'autore avvia questa sessione. Senza quella riga non si scrive nulla in `data/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Crea un branch di sessione (`claude/v2-session-7-ehds` o quello assegnato
dall'ambiente). Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md` — contratto tra sessioni.
2. `docs/prompts/v2-session-6.md` — la roadmap dell'autore: §1 (regole per ogni sessione), «Session 7»,
   §3 (finding della Session 5 da non correggere in silenzio), §4 (Evidence Navigator: fuori perimetro).
3. `docs/ROADMAP-v2.md`:
   - §4, Fase 2, voci 2.2–2.6 (il paragrafo comune: ogni voce è lavoro ambra o rosso);
   - §8, tutte le righe, in particolare quelle della sessione 5 (voce 2.2) e della sessione 6 (voce 2.3).
4. `docs/HANDOVER.md`, sezioni «v2 Session 6 — checkpoint report (item 2.3, the Cyber Solidarity Act)» e
   «v2 Session 5 — Part A checkpoint report (item 2.2)»: sono i due precedenti di una voce 2.x.
5. `docs/V2-DATA-DESIGN.md`:
   - §1.3 (nodi e copertura), §1.4 (relazioni, `basis` testuale/analitica), §1.5 (M-01…M-16);
   - §5 (criterio approvato): per l'EHDS il design propone `crit:object-data` + `crit:sector-instance`;
   - §6.1 (riga `ehds`) e §7 (otto rilievi, della Fase 3: non correggerli).
6. `docs/v2-design/map-examples.json`: il nodo `ehds` e gli archi `rel-eidas2-ehds-enables`,
   `rel-ehds-cra-amends`. **Sono bozze del 25 ottobre 2026, non fatti**: si rileggono, non si copiano.
7. `js/routes.js` (`GATE`, `coverage()`), `tools/register-audit.mjs`, `tools/selftest.mjs` W11 e W13.
8. `docs/AI-SAFE-BOUNDARIES.md` §0–§3 e `docs/SOURCE-POLICY.md`: ogni fatto di questa voce è rosso.

Se ritieni che una decisione del brief, della roadmap o del design vada rivista, segnalalo
esplicitamente e attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**Solo la voce 2.4**: valutare il European Health Data Space (Regolamento (UE) 2025/327) e, se il
criterio lo consente, aggiungerlo come strumento coperto, con la sua pagina. Poi checkpoint. La sessione
si ferma al checkpoint.

Non procedere alla voce 2.5 (Interoperable Europe Act) né oltre. **Non copiare** schema, stato,
relazioni o conclusioni decise per il Cyber Solidarity Act o per eIDAS2: ogni campo dell'EHDS si decide
sulle fonti dell'EHDS, in questa sessione.

## Lo stato di partenza

Misurato il 28 ottobre 2026 su `main` (`fdc7727`). Rimisura tutto prima di porre le domande: può essere
cambiato.
- **Nessun record `ehds`** in `data/instruments.json`: nessun nodo, nessuna relazione, nessun evento in
  `data/timeline.json`, nessuna regola in `data/applicability.json`.
- **Una claim esiste già**: `clm-ehds-dates` (`claim-type:law`, `brief_part: part-1`, riga del riquadro
  «also in the rulebook» della Parte I). Il suo campo `instruments` è **vuoto** e la sua
  `verification_note` dice «The instrument is not modelled in data/instruments.json»: frase che diventa
  falsa nel momento in cui il record esiste.
- **Due fonti esistono già**:
  - `src-eurlex-ehds` (tier 1, Cellar, `accessed` 2026-09-27): la sua nota riporta Art. 105 e
    l'entrata in vigore del 25 marzo 2025 dai metadati;
  - `src-ec-ehds-page` (tier 2, pagina della Commissione, `accessed` 2026-09-26): dice 26 marzo 2025.
    Il sito segue la Gazzetta ufficiale; la discrepanza è già annotata.
- **Il brief** nomina l'EHDS nel riquadro della Parte I; verifica se lo analizzi in una Parte (per
  `eidas2` e `csa`, `brief_part` è rimasto `null` per la stessa ragione).
- **La baseline di chiusura della sessione 6** (da ricontrollare, non da copiare): `validate` 0/0 con 45
  non verificati; `i18n-audit`, `design-qa`, `seo-audit` 0/0; `evidence-audit --as-of 2026-10-27` 0
  errori, 11 warning, REGISTER «covered 13 · mapped 11 · watched 5 · excluded 6»; `freshness` 0 difetti,
  2 richieste; 25 suite 1309 pass + 1 saltato (`::1`); browser 343 · 0 · 1 indecidibile; gate
  avversariale 65 · 0 · 3 · 1; 14 pagine strumento, 23 route indicizzabili.

## 7.0 · Domande da porre all'autore prima di scrivere qualsiasi cosa in `data/`

Prima leggi le fonti (7.1). Poi porta all'autore, **una domanda per volta tramite lo strumento di
domande** (l'autore ha chiesto così nella sessione 6: «Chiedimi»), con la raccomandazione in prima
posizione e la motivazione nella domanda stessa. Non meno di queste:

1. **Il criterio di inclusione.** Il design propone `crit:object-data` + `crit:sector-instance`. Il
   §5 definisce *sector-instance* come «a sector's instance of one object layer, built on a covered
   instrument, **and shown by an edge to it**». Quindi, a differenza del CSA, per l'EHDS l'inclusione
   stessa dipende da un arco testuale verso uno strumento coperto. Porta all'autore:
   - la clausola d'oggetto letta nell'articolo sull'oggetto dell'EHDS (quale, e con quale locator);
   - se regge `crit:horizontal` o `crit:sector-instance`, e perché;
   - se nessuna combinazione regge, la voce non si fa e lo dici. Non indebolire il criterio.
2. **Gli archi, uno per uno**, ciascuno con il testo che lo regge, letto oggi. Candidati del design,
   da rileggere e non da copiare:
   - EHDS → CRA, `rel-kind:amends`, sull'articolo che modifica il Regolamento (UE) 2024/2847. La bozza
     dice che il 25 ottobre fu letto solo il punto (1): leggi tutto l'articolo prima di scrivere il
     `summary`. Attenzione a M-15 e al rilievo F-1: gli array `amends` / `amended_by` sono una seconda
     sede degli archi; chiedi all'autore se compilarli (`ehds.amends`, `cra.amended_by`) o lasciarli
     come sono, e dillo nel rapporto;
   - eIDAS2 → EHDS, `rel-kind:enables`, che la bozza stessa dichiara *partial by construction*:
     l'EHDS rinvia al Regolamento (UE) n. 910/2014 come modificato, mentre il nodo `eidas2` è l'atto
     modificativo. Presenta il problema all'autore; non risolverlo modellando il 910/2014 come nodo
     nuovo senza la sua decisione;
   - ogni altro rinvio espresso che trovi (per esempio al GDPR), solo se il testo lo dice in modo
     specifico.
   Un arco aggiunto **solo** per superare il criterio `context` del cancello non entra (roadmap §1 e
   «Session 6», passo 4). Se un arco è ciò che soddisfa il cancello, dillo nella domanda, come nella
   sessione 6.
3. **Lo stato.** L'EHDS ha un'applicazione scaglionata (Art. 105, da rileggere). Alla data del
   controllo: `status:in-force` (in vigore, non ancora applicabile) o `status:partly-applicable`
   (se una parte si applica già)? Decidilo dalle date lette, non dalla bozza del design. L'etichetta
   pubblica derivata cambia con lo stato: dillo.
4. **Le date.** Proponi gli eventi di `data/timeline.json` uno per uno (entrata in vigore; ciascuna data
   di applicazione dell'Art. 105 che il testo stabilisce), ciascuno con articolo e paragrafo. Un evento
   che non hai letto non si propone. Chiedi quali entrano.
5. **`dna.objective`**: due bozze, lette sull'articolo dell'oggetto.
6. **Gli altri campi di `dna`**: quelli fattuali proposti dal testo (`regulated_actor`, provisions,
   `obligation_anchor`, `implementation_model`, `sanction_ceiling` — l'EHDS ha sanzioni? leggi e non
   presumere), quelli analitici (`risk_logic`, `enforcement_mechanism`, `protected_party`,
   `territorial_scope`) lasciati `null` salvo decisione contraria. Se serve un termine di tassonomia
   nuovo (per esempio un attore), proponilo con la fonte; si aggiungono termini, non se ne rinomina
   nessuno.
7. **La claim esistente `clm-ehds-dates`**: aggiungere `ehds` al suo `instruments` (soddisferebbe il
   criterio `evidence` del cancello) e correggere la frase della `verification_note` che diventa falsa.
   Rileggi la claim sul testo prima di proporlo: se la statement non regge più, è dell'autore.
8. **Le fonti esistenti**: `src-eurlex-ehds` riletta oggi (nota e `accessed` aggiornati);
   `src-ec-ehds-page` riletta solo se la usi.

Registra ogni risposta in §8 con le parole dell'autore. Solo allora `approved_on` prende la data (M-04).
Ciò che non è approvato non entra.

## 7.1 · Leggere le fonti, prima delle domande

- Cellar per CELEX `32025R0327`, con `Accept: application/xhtml+xml`. EUR-Lex restituisce pagine vuote a
  questo ambiente. Leggi almeno: l'articolo sull'oggetto e l'ambito; le definizioni che rinviano ad
  altri atti; l'articolo che modifica il CRA, per intero; l'articolo o gli articoli sulle sanzioni, se
  esistono; l'Art. 105 per intero; l'articolo di entrata in vigore.
- I metadati SPARQL dell'Ufficio delle pubblicazioni (`https://publications.europa.eu/webapi/rdf/sparql`):
  in vigore, data di entrata in vigore, date di scadenza e di applicazione registrate, atti
  modificativi, rettifiche. Leggi le rettifiche disponibili in inglese e di' quali non hai potuto
  leggere.
- Per un arco verso il CRA o eIDAS2, rileggi anche il testo dell'altro strumento dove serve a capire il
  rinvio; il locator dell'arco sta comunque nel testo che stabilisce il rapporto (`rel-kind:amends`:
  l'atto che modifica; `rel-kind:enables`: l'atto **dipendente**).
- Un fatto che oggi non riesci a riconfermare non entra in `data/`: resta `null`, con una nota. Non
  completare con un risultato di ricerca, uno snippet o la memoria del modello.
- I record di `data/sources.json` nascono solo da documenti recuperati e letti
  (`tools/source-contract.mjs`).

## 7.2 · Scrivere

- Una sola sede per fatto. Le date stanno in `timeline.json`, mai sullo strumento. Titoli e nomi in uso
  stanno in `tools/seo.mjs` e `js/routes.js KNOWN_AS`, mai in `data/`.
- **Nessun identificativo interno nei testi che il lettore vede** (`status_note`, `summary`, `reason`,
  note delle provision): niente `clm-*`, `docs/...`, codici di decisione. È il finding 10.2 aperto: non
  aggiungerne di nuovi. Le note di verifica (`verification_note`) possono nominare record e canali.
- I controlli devono restare a 0 errori: M-04 (record core aggiunto dopo il 25 ottobre 2026: la
  decisione è obbligatoria), M-05 (la pagina), M-07 (`status_basis` tenuto alla regola piena).
  Aggiungi in `tools/selftest.mjs` un test sul modello di W11/W13 che pianta la perdita della base dello
  stato, della decisione, dell'arco che regge il criterio e dell'obiettivo, e verifica che ciascuna
  fallisca. Se un controllo va esteso, è un controllo in più, con un test che lo fa fallire.
- Dopo ogni modifica a `data/`:
  - `node tools/_footer.mjs`, e committa ciò che scrive (la nuova pagina `instruments/ehds/`, le pagine
    degli strumenti collegati, la sitemap, `instruments.html`, l'indice `<noscript>`);
  - `node tools/og-image.mjs` per `img/og/ehds.png`: lo strumento rigenera tutte le card; ripristina
    quelle i cui input non sono cambiati e controlla con `node tools/og-image.mjs --check`;
  - dichiara `superseded` o `pending_translation` ogni chiave di locale toccata, oppure dichiara che
    nessuna lo è e perché.
- **Ogni commit che modifica un file pubblicato** porta una riga `Evidence: <fonte, record o
  controllo>`; `tools/commit-evidence.mjs origin/main HEAD` deve dare 0 commit senza evidenza.
- Leggi il `git diff` completo prima di ogni commit.

## 7.3 · Checkpoint — la sessione si ferma qui

- Rilancia `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`,
  `freshness --as-of <oggi>`, `seo-audit`, le 25 suite (con
  `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, o il percorso
  dell'ambiente), la suite browser con `--require-browser`, il gate avversariale,
  `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`, `tools/commit-evidence.mjs`.
- Apri `/instruments/ehds/` in un browser, tema scuro e chiaro, desktop e 390px; apri anche le pagine
  degli strumenti all'altro capo di ogni arco. Verifica che nessuna pagina dica più di quanto reggono i
  record, in particolare sullo stato e sulle date di applicazione future.
- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 6: decisioni dell'autore;
  cosa è stato scritto (commit); fatti letti, non letti e lasciati `null`; criteri di uscita della voce
  2.4; conteggi prima/dopo con il motivo; la pagina vista nel browser; finding non corretti; la
  checklist di verifica; come controllare a mano.
- Tieni visibili nel rapporto i finding ancora aperti (sessione 5, roadmap §3; sessione 6: i tre rilievi
  di visualizzazione — la nota interna di `rel-kind:enables`, il tetto delle sanzioni scritto in due
  modi, `obligation_on_institution` non mostrato).
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore; si registra in §8. Poi chiedi se aprire una pull request
  verso `main` e registra la sorte del branch nel registro di `docs/HANDOVER.md`.

## Cosa NON fare in questa sessione

- Non implementare le voci 2.5 e 2.6 (Interoperable Europe Act, Digital Networks Act). Non creare
  record per loro, nemmeno per dare un arco all'EHDS.
- Non creare un nodo per il Regolamento (UE) n. 910/2014, né per un altro atto, senza una decisione
  dell'autore.
- Non correggere i finding aperti: i tre di visualizzazione della sessione 6 e i riferimenti interni
  (sessione 10, voce 10.2); `rel-dsa-gdpr-transparency-minimisation`, `rel-data-omnibus-gdpr`, le 4
  relazioni solo-brief e le 3 analitiche senza claim, il flip di `edge-v1-sources`,
  `src-ec-apple-meta-dma-2025`, `src-ec-ai-omnibus-in-force`; R-01 e gli otto rilievi del design §7
  (Fase 3).
- Non pubblicare la mappa delle dipendenze né la sua vista. Non implementare D2 né D3 oltre a ciò che
  la voce 2.4 richiede in modo dimostrabile.
- Non applicare la correzione `data-omnibus` rimasta in `docs/v2-design/register-watchlist.proposed.json`.
  Non aprire il capitolo finanza.
- Non implementare né preparare l'Evidence Navigator (roadmap §4), né toccare `js/search.js` per esso.
- Non introdurre Tier A/B/C, automazione, dipendenze runtime, richieste a terze parti, dashboard,
  redesign.
- Non dichiarare «sicurezza operativa dimostrata». Non trasformare uno skip in un pass.
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Criterio di uscita e consegna

La sessione è completa quando la voce 2.4 è implementata e il suo checkpoint è approvato dall'autore,
oppure quando l'autore decide di fermarsi, o quando il criterio di inclusione non regge e lo hai
dimostrato sulle fonti.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (7.0–7.3) indica:
- cosa è stato modificato (file, record, viste);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
