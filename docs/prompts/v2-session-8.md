<!--
Provenance: the prompt of v2 Session 8, drafted at the end of v2 Session 7 (28 Oct 2026) from the
author's roadmap after v2 Session 5 (docs/prompts/v2-session-6.md, "Session 8 — item 2.5") and the
§8 rows of 28 Oct 2026 that close Session 7. The decisions live in those rows and nowhere else; this
file is the instruction text that cites them. Written in Italian, as the author's session prompts
are. The author may change it before use.
-->

SESSION 8 — Voce 2.5 (Interoperable Europe Act), per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Verifica tre cose:
- che `main` contenga la pull request #26 (sessione 7: voce 2.4, `ehds`), cioè almeno `21d6ada`;
- che `docs/ROADMAP-v2.md` §8 abbia le tre righe del 28 ottobre 2026 della sessione 7, fino a
  «The checkpoint of v2 Session 7 = item 2.4»;
- che `docs/prompts/v2-session-6.md` (la roadmap dell'autore per le sessioni 6–16) e
  `docs/prompts/v2-session-7.md` siano in `main`.

Se una delle tre manca in `main`, fermati e segnalalo.

La roadmap dell'autore è un piano, non un'autorizzazione: §8 lo dice nella riga «The scope of v2
Session 6». **Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 8»
con le parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore,
chiediglielo con lo strumento di domande, come nella sessione 7. Senza quella riga non si scrive nulla
in `data/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Crea un branch di sessione (`claude/v2-session-8-iea` o quello assegnato
dall'ambiente). Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md` — contratto tra sessioni.
2. `docs/prompts/v2-session-6.md` — la roadmap dell'autore: §1 (regole per ogni sessione), «Session 8»,
   §3 (finding della Session 5 da non correggere in silenzio), §4 (Evidence Navigator: fuori perimetro).
3. `docs/ROADMAP-v2.md`:
   - §4, Fase 2, voci 2.2–2.6 (il paragrafo comune: ogni voce è lavoro ambra o rosso);
   - §8, tutte le righe, in particolare quelle delle sessioni 5, 6 e 7 (voci 2.2, 2.3, 2.4).
4. `docs/HANDOVER.md`, sezioni «v2 Session 7 — checkpoint report (item 2.4, …)», «v2 Session 6 —
   checkpoint report (item 2.3, …)» e «v2 Session 5 — Part A checkpoint report (item 2.2)»: sono i tre
   precedenti di una voce 2.x. Quello della sessione 7 contiene anche tre modifiche ai controlli e un
   incidente sul record store (sotto, «Lezioni della sessione 7»).
5. `docs/V2-DATA-DESIGN.md`:
   - §1.3 (nodi e copertura), §1.4 (relazioni, `basis` testuale/analitica), §1.5 (M-01…M-16);
   - §5 (criterio approvato): per l'IEA il design propone `crit:object-infrastructure` +
     `crit:horizontal` («interoperability of public digital services» è nella definizione di
     `crit:object-infrastructure`);
   - §6.1 (riga `iea`) e §7 (otto rilievi, della Fase 3: non correggerli).
6. `docs/v2-design/map-examples.json`: il nodo `iea`, l'arco `rel-iea-gdpr-defers`, la fonte
   `src-eurlex-iea` e i due eventi `tl-iea-*`. **Sono bozze del 25 ottobre 2026, non fatti, e nessuno di
   essi esiste in `data/`**: si rileggono, non si copiano.
7. `js/routes.js` (`GATE`, `coverage()`), `js/regulatory-model.js` (`statusContradictions()`,
   `provisionApplication()`), `tools/register-audit.mjs`, `tools/selftest.mjs` W11, W13 e W14,
   `tools/source-contract.mjs`.
8. `docs/AI-SAFE-BOUNDARIES.md` §0–§3 e `docs/SOURCE-POLICY.md`: ogni fatto di questa voce è rosso.

Se ritieni che una decisione del brief, della roadmap o del design vada rivista, segnalalo
esplicitamente e attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**Solo la voce 2.5**: valutare l'Interoperable Europe Act (Regolamento (UE) 2024/903) e, se il
criterio lo consente, aggiungerlo come strumento coperto, con la sua pagina. Poi checkpoint. La sessione
si ferma al checkpoint.

Non procedere alla voce 2.6 (Digital Networks Act) né oltre. **Non copiare** schema, stato, relazioni o
conclusioni decise per eIDAS2, il Cyber Solidarity Act o l'EHDS: ogni campo dell'IEA si decide sulle
fonti dell'IEA, in questa sessione. La roadmap lo chiede in modo esplicito per questa voce: **non
inferire scope o obblighi dal solo titolo dell'atto**; tieni distinti identità dello strumento, stato,
date, campo di applicazione e rilevanza per il brief; **nessuna relazione viene aggiunta per
«completare» la pagina**.

## Lo stato di partenza

Misurato il 28 ottobre 2026 su `main` (`21d6ada`). Rimisura tutto prima di porre le domande: può essere
cambiato.
- **Nessun record `iea`** in `data/instruments.json`: nessun nodo, nessuna relazione, nessun evento in
  `data/timeline.json`, nessuna regola in `data/applicability.json`.
- **Nessuna fonte**: `src-eurlex-iea` esiste solo come bozza nel design; in `data/sources.json` non c'è
  alcun record per CELEX `32024R0903`. Il record nasce solo dal documento recuperato e letto in questa
  sessione (`tools/source-contract.mjs`).
- **Nessuna claim** nomina l'IEA, e **il brief non lo nomina** (nessuna occorrenza di «Interoperable
  Europe» né di «2024/903» in `index.html`): `brief_part` resta `null`, e il criterio `evidence` del
  cancello dovrà reggersi su una provision con fonte, non su una claim. Non creare una claim per
  soddisfare il cancello: una claim corrisponde a un'affermazione già presente nella prosa.
- **La bozza del design dice `status:applicable`** (tutte le date dell'Art. 23 passate): è una bozza.
  Decidilo dalle date lette oggi, e tieni conto che `statusContradictions()` rifiuta `applicable` se
  resta una data di applicazione futura, e che una tranche (la bozza nomina Art. 3(1)–(4) e Art. 17)
  diventa un evento solo etichettata con disposizioni che esistono come record.
- **La baseline di chiusura della sessione 7** (da ricontrollare, non da copiare): `validate` 0/0 con 45
  non verificati; `i18n-audit`, `design-qa`, `seo-audit` 0/0; `evidence-audit --as-of 2026-10-28` 0
  errori, 11 warning, REGISTER «covered 14 · mapped 11 · watched 5 · excluded 6»; `freshness` 0 difetti,
  3 richieste al 28/10 (2 al 27/10: è il calendario); 25 suite 1310 pass + 1 saltato (`::1`); browser
  343 · 0 · 1 indecidibile; gate avversariale 65 · 0 · 3 · 1; 15 pagine strumento, 24 route indicizzabili.

## Lezioni della sessione 7 (da `docs/HANDOVER.md`; non ripeterle)

- **M-04 ora tiene `crit:sector-instance`**: una decisione che lo cita deve avere un arco verso uno
  strumento coperto, con un riferimento diretto e un locator strutturale. Se per l'IEA proponi
  `crit:horizontal`, la regola non lo tocca; se il testo non regge `crit:horizontal` e proponi
  `crit:sector-instance`, l'inclusione dipende da quell'arco, e lo dici nella domanda.
- **W1 verifica l'albero alla data della sua decisione più recente**: una decisione datata oggi non
  richiede di toccare W1.
- **Non lasciare output di agenti nel record store.** Una CLI di agente (per esempio
  `node agent/depth/cli.mjs`) scrive in `agent/records/`, ignorato da git e vuoto su un clone pulito; nella
  sessione 7 un file così fece fallire `agent/proposals/governance` (P-07). Se ne lanci una, rimuovi ciò
  che ha scritto prima di rilanciare le suite, e dillo nel rapporto.
- **Un record nuovo può esporre un difetto latente in un controllo** (sessione 7: due finding distinti di
  `agent/depth` con lo stesso id). Si corregge il controllo alla radice, senza cambiare id esistenti e
  senza toccare un test; lo si misura prima e dopo, e lo si dichiara.
- **Formato dei file di `data/`**: `timeline.json` è indentato di uno spazio, `sources.json` ha escape
  misti. Non riserializzarli interi: il diff deve contenere solo i record toccati.
- **Rettifiche**: chiedi a SPARQL le lingue delle espressioni di ciascuna (`expression_uses_language`)
  prima di dire che non sono leggibili in inglese.

## 8.0 · Domande da porre all'autore prima di scrivere qualsiasi cosa in `data/`

Prima leggi le fonti (8.1). Poi porta all'autore, **una domanda per volta tramite lo strumento di
domande**, con la raccomandazione in prima posizione e la motivazione nella domanda stessa. Non meno di
queste:

1. **Il criterio di inclusione.** Il design propone `crit:object-infrastructure` + `crit:horizontal`.
   Porta all'autore:
   - la clausola d'oggetto letta nell'articolo sull'oggetto e l'ambito dell'IEA (quale, con quale
     locator), e a chi si applica (enti pubblici dell'Unione e degli Stati membri? solo i servizi
     pubblici digitali transeuropei?) — letto nel testo, non nel titolo;
   - se `crit:horizontal` regge, cioè se le regole si applicano trasversalmente ai settori, e perché;
     un atto rivolto al settore pubblico non è per ciò solo orizzontale né settoriale: decidilo sul testo;
   - se nessuna combinazione regge, la voce non si fa e lo dici. Non indebolire il criterio.
2. **Gli archi, uno per uno**, ciascuno con il testo che lo regge, letto oggi. Candidato del design, da
   rileggere e non da copiare: `iea → gdpr`, `rel-kind:defers-to`, sull'Art. 11(4) (una consultazione in
   una sandbox non sostituisce la consultazione preventiva dell'Art. 36 GDPR). Poi ogni altro rinvio
   espresso che trovi verso uno strumento del dataset (per esempio eIDAS2, il Data Act, il DGA, l'AI Act),
   solo se il testo lo dice in modo specifico, con la direzione e il `rel-kind` che la tassonomia
   prevede (`enables`: locator nell'atto dipendente; `defers-to`: locator nell'atto che rinvia).
   Per eIDAS: se l'IEA rinvia al Regolamento (UE) n. 910/2014 e non al 2024/1183, è lo stesso problema
   rimasto aperto con l'EHDS (sessione 7): presentalo, non risolverlo creando un nodo per il 910/2014.
   Un arco aggiunto **solo** per superare il criterio `context` del cancello non entra (roadmap §1 e
   «Session 8»). Se un arco è ciò che soddisfa il cancello, dillo nella domanda.
3. **Lo stato.** `status:in-force`, `status:partly-applicable` o `status:applicable`, alla data del
   controllo, deciso dall'Art. 23 letto per intero e dai metadati. L'etichetta pubblica derivata cambia
   con lo stato: dillo.
4. **Le date.** Proponi gli eventi di `data/timeline.json` uno per uno (entrata in vigore; ciascuna data
   di applicazione che il testo stabilisce; eventuali scadenze che il testo pone e che la pagina
   mostrerebbe), ciascuno con articolo e paragrafo, e con le disposizioni che etichetta. Un evento che non
   hai letto non si propone. Chiedi quali entrano.
5. **`dna.objective`**: due bozze, lette sull'articolo dell'oggetto.
6. **Gli altri campi di `dna` e le provision.** I fattuali proposti dal testo (`regulated_actor`,
   provisions con i loro destinatari, `obligation_anchor`, `implementation_model`, `sanction_ceiling` —
   l'IEA prevede sanzioni? cerca nel testo intero e dillo; non presumere), quelli analitici
   (`risk_logic`, `enforcement_mechanism`, `protected_party`, `territorial_scope`) lasciati `null` salvo
   decisione contraria. `obligation_on_institution` per gli obblighi della Commissione o di un organo
   dell'Unione (esiste: `csa:art-14`), sapendo che la pagina non lo mostra (rilievo aperto della
   sessione 6). Se serve un termine di tassonomia nuovo, proponilo con la fonte; si aggiungono termini,
   non se ne rinomina nessuno.
7. **La fonte nuova** `src-eurlex-iea`: i campi del contratto delle fonti, la nota che dice cosa è stato
   letto e cosa no, le rettifiche. Nessuna pagina della Commissione, salvo che tu la legga e la usi.
8. **Il nome mostrato.** Il titolo della pagina deriva da `short_name` e da `js/routes.js KNOWN_AS`.
   Proponi se aggiungere una voce a `KNOWN_AS` (il nome deve corrispondere a un alias del record),
   oppure lasciare il nome derivato; nella sessione 7 la stessa scelta per l'EHDS non fu posta e resta
   aperta.

Registra ogni risposta in §8 con le parole dell'autore. Solo allora `approved_on` prende la data (M-04).
Ciò che non è approvato non entra.

## 8.1 · Leggere le fonti, prima delle domande

- Cellar per CELEX `32024R0903`, con `Accept: application/xhtml+xml`. EUR-Lex restituisce pagine vuote a
  questo ambiente. Leggi almeno: l'articolo sull'oggetto e l'ambito; le definizioni, in particolare quelle
  che rinviano ad altri atti; ogni articolo che rinvia a uno strumento del dataset; gli articoli che
  pongono obblighi (a chi, da quando); l'articolo o gli articoli sulle sanzioni, se esistono; l'articolo
  di entrata in vigore e applicazione, per intero.
- I metadati SPARQL dell'Ufficio delle pubblicazioni (`https://publications.europa.eu/webapi/rdf/sparql`):
  in vigore, data di entrata in vigore, date registrate, atti modificati e modificativi, versioni
  consolidate, rettifiche e le loro lingue. Leggi le rettifiche disponibili in inglese e di' quali non
  hai potuto leggere e perché.
- Per un arco verso un altro strumento, rileggi anche il testo dell'altro dove serve a capire il rinvio;
  il locator dell'arco sta comunque nel testo che stabilisce il rapporto.
- Un fatto che oggi non riesci a riconfermare non entra in `data/`: resta `null`, con una nota. Non
  completare con un risultato di ricerca, uno snippet o la memoria del modello.

## 8.2 · Scrivere

- Una sola sede per fatto. Le date stanno in `timeline.json`, mai sullo strumento. Titoli e nomi in uso
  stanno in `tools/seo.mjs` e `js/routes.js KNOWN_AS`, mai in `data/`.
- **Nessun identificativo interno nei testi che il lettore vede** (`status_note`, `summary`, `reason`,
  note delle provision, `obligation` degli eventi): niente `clm-*`, `docs/...`, codici di decisione. È il
  finding 10.2 aperto: non aggiungerne di nuovi. Le note di verifica possono nominare record e canali.
- I controlli devono restare a 0 errori: M-04 (record core aggiunto dopo il 25 ottobre 2026: la
  decisione è obbligatoria), M-05 (la pagina), M-07 (`status_basis` tenuto alla regola piena).
  Aggiungi in `tools/selftest.mjs` un test sul modello di W14 che pianta la perdita della base dello
  stato, della decisione, dell'arco o degli archi che danno contesto e dell'obiettivo, e verifica che
  ciascuna fallisca; e dimostra che il test fallisce se il controllo che lo regge viene disattivato. Se un
  controllo va esteso, è un controllo in più, con un test che lo fa fallire.
- Dopo ogni modifica a `data/`:
  - `node tools/_footer.mjs`, e committa ciò che scrive (la nuova pagina `instruments/iea/`, le pagine
    degli strumenti collegati, la sitemap, `instruments.html`, l'indice `<noscript>`); un secondo
    `_footer` deve scrivere 0 file;
  - `node tools/og-image.mjs` per `img/og/iea.png` (serve `BROWSER_QA_CHROME`): lo strumento rigenera
    tutte le card; ripristina quelle i cui input non sono cambiati e controlla con
    `node tools/og-image.mjs --check`;
  - dichiara `superseded` o `pending_translation` ogni chiave di locale toccata, oppure dichiara che
    nessuna lo è e perché.
- **Ogni commit che modifica un file pubblicato** porta una riga `Evidence: <fonte, record o
  controllo>`; `tools/commit-evidence.mjs origin/main HEAD` deve dare 0 commit senza evidenza.
- Leggi il `git diff` completo prima di ogni commit.

## 8.3 · Checkpoint — la sessione si ferma qui

- Rilancia `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`,
  `freshness --as-of <oggi>`, `seo-audit`, le 25 suite (con
  `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, o il percorso
  dell'ambiente), la suite browser con `--require-browser`, il gate avversariale,
  `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`, `tools/commit-evidence.mjs`.
  Prima dell'ultima corsa delle suite, verifica che `agent/records/` sia vuoto di ciò che hai prodotto.
- Apri `/instruments/iea/` in un browser, tema scuro e chiaro, desktop e 390px; apri anche le pagine
  degli strumenti all'altro capo di ogni arco. Verifica che nessuna pagina dica più di quanto reggono i
  record, in particolare sullo stato, sulle date e su chi è obbligato.
- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 7: decisioni dell'autore;
  cosa è stato scritto (commit); controlli modificati e perché; fatti letti, non letti e lasciati
  `null`; criteri di uscita della voce 2.5; conteggi prima/dopo con il motivo; la pagina vista nel
  browser; finding non corretti; la checklist di verifica; come controllare a mano.
- Tieni visibili nel rapporto i finding ancora aperti:
  - sessione 7: le date delle tranche senza le categorie nella tabella delle provision; il Regolamento
    (UE) n. 910/2014 non modellato (nessun arco `eidas2 → ehds`); il riferimento interno nelle note di
    `enables` e `defers-to`, ora su più pagine (voce 10.2); l'avviso «non coperto» del DGA che non
    mostra archi; il nome comune dell'EHDS non in `KNOWN_AS`;
  - sessione 6: il tetto delle sanzioni scritto in due modi; `obligation_on_institution` non mostrato;
  - sessione 5 (roadmap §3): come elencati nel rapporto della sessione 7.
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore; si registra in §8. Poi chiedi se aprire una pull request
  verso `main` e registra la sorte del branch nel registro di `docs/HANDOVER.md`.

## Cosa NON fare in questa sessione

- Non implementare la voce 2.6 (Digital Networks Act). Non creare record per essa, nemmeno per dare un
  arco all'IEA.
- Non creare un nodo per il Regolamento (UE) n. 910/2014, né per un altro atto, senza una decisione
  dell'autore.
- Non creare una claim che la prosa del brief non contiene.
- Non correggere i finding aperti: quelli delle sessioni 5, 6 e 7 elencati sopra; i riferimenti interni
  (sessione 10, voce 10.2); `rel-dsa-gdpr-transparency-minimisation`, `rel-data-omnibus-gdpr`, le 4
  relazioni solo-brief e le 3 analitiche senza claim, il flip di `edge-v1-sources`,
  `src-ec-apple-meta-dma-2025`, `src-ec-ai-omnibus-in-force`; R-01 e gli otto rilievi del design §7
  (Fase 3).
- Non pubblicare la mappa delle dipendenze né la sua vista. Non implementare D2 né D3 oltre a ciò che
  la voce 2.5 richiede in modo dimostrabile.
- Non applicare la correzione `data-omnibus` rimasta in `docs/v2-design/register-watchlist.proposed.json`.
  Non aprire il capitolo finanza.
- Non implementare né preparare l'Evidence Navigator (roadmap §4), né toccare `js/search.js` per esso.
- Non introdurre Tier A/B/C, automazione, dipendenze runtime, richieste a terze parti, dashboard,
  redesign.
- Non dichiarare «sicurezza operativa dimostrata». Non trasformare uno skip in un pass.
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Criterio di uscita e consegna

La sessione è completa quando la voce 2.5 è implementata e il suo checkpoint è approvato dall'autore,
oppure quando l'autore decide di fermarsi, o quando il criterio di inclusione non regge e lo hai
dimostrato sulle fonti.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (8.0–8.3) indica:
- cosa è stato modificato (file, record, viste);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
