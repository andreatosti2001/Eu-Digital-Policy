<!--
Provenance: the prompt of v2 Session 9, drafted at the end of v2 Session 8 (28 Oct 2026) on the
author's request ("mandami session 9's prompt"), from the author's roadmap after v2 Session 5
(docs/prompts/v2-session-6.md, "Session 9 — item 2.6") and the §8 rows of 28 Oct 2026 that close
Session 8. The decisions live in those rows and nowhere else; this file is the instruction text that
cites them. Written in Italian, as the author's session prompts are. The author may change it before
use.
-->

SESSION 9 — Voce 2.6 (Digital Networks Act), per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Verifica tre cose:
- che `main` contenga le pull request #28 (voce 2.5, `iea`) e #29 (le questioni aperte risolte nella
  sessione 8), cioè almeno `cabe21b`;
- che `docs/ROADMAP-v2.md` §8 abbia le righe del 28 ottobre 2026 della sessione 8, fino a «The
  checkpoint of v2 Session 8, part 2»;
- che `docs/prompts/v2-session-6.md` (la roadmap dell'autore) e `docs/prompts/v2-session-8.md` siano in
  `main`.

Se una delle tre manca in `main`, fermati e segnalalo.

La roadmap dell'autore è un piano, non un'autorizzazione (§8, «The scope of v2 Session 6»). **Come prima
scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 9» con le parole con cui
l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo
strumento di domande. Senza quella riga non si scrive nulla in `data/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso: `origin/scout/digest-digest-2026-10-26T13-10-32Z` (già nel registro) e
`origin/claude/v2-session-8-findings`, che porta un solo commit non unito, `2b5d71d` (una riga di registro
in `docs/HANDOVER.md`: la #28 unita come `2513a09`). Il merge della #29 è avvenuto pochi secondi prima del
suo push; l'autore ha deciso di riportarne il contenuto nel registro della sessione successiva invece di
aprire una PR, e la registrazione di questo prompt lo fa. Crea un branch di sessione
(`claude/v2-session-9-dna` o quello assegnato dall'ambiente). Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md` — contratto tra sessioni. In particolare: «Non pubblicare "what applies to me"…»
   e «Inclusioni prioritarie Fase 2: … Digital Networks Act (come regime in formazione)».
2. `docs/prompts/v2-session-6.md` — §1 (regole per ogni sessione), «Session 9» («prestando particolare
   attenzione allo stato legislativo effettivo alla data della verifica … non presentare una proposta
   come diritto vigente. Non aggiungere una previsione come se fosse un fatto giuridico»), §3, §4.
3. `docs/ROADMAP-v2.md`:
   - §4, Fase 2, voci 2.2–2.6 (ogni voce è lavoro ambra o rosso) e la frase «The Digital Networks Act's
     status label is whatever the sources establish on the date checked»;
   - §5 (le sei etichette sulle sedici posizioni) e §8, tutte le righe, in particolare quelle delle
     sessioni 6, 7 e 8.
4. `docs/HANDOVER.md`: i rapporti «v2 Session 8, part 2», «v2 Session 8 — checkpoint report (item 2.5,
   …)» e «v2 Session 7 — checkpoint report (item 2.4, …)».
5. `docs/V2-DATA-DESIGN.md`:
   - §1.3–§1.5 (nodi, archi, `basis`, la modalità `proposed` derivata dallo stato del nodo `from`,
     M-01…M-16);
   - §3 (D3: le etichette e gli stati; S-03: lo stadio procedurale accetta un procedure file di tier 2);
   - §5 (criterio: `crit:readable` comprende «a proposal whose procedure has begun»); §6.1 (riga `dna`);
     §7 (otto rilievi della Fase 3: non correggerli);
   - §0.1 (riga 128): nel design una ricerca web fu usata una volta per trovare il numero dell'atto. **In
     questa sessione nessun fatto viene da una ricerca web.**
6. `docs/v2-design/map-examples.json`: il nodo `dna`, l'arco `rel-dna-eprivacy-amends`, l'evento
   `tl-dna-2026-01-21-proposal`, le fonti `src-eurlex-dna-proposal` e `src-oeil-2026-0013`. **Sono bozze
   del 25 ottobre 2026, non fatti, e nessuna esiste in `data/`**: COM(2026) 16, CELEX `52026PC0016`, la
   procedura 2026/0013(COD), il titolo e le date vanno riletti oggi, non copiati.
7. Il precedente di una proposta coperta con pagina: il record `data-omnibus` (COM(2025) 837) in
   `data/instruments.json`, la sua `status_note` («NOT LAW …»), le sue claim procedurali e la sua pagina
   `instruments/data-omnibus/`. Lo si rilegge per capire come il sito rende una proposta; non si copia.
8. `js/routes.js` (`GATE`, `coverage()`, `KNOWN_AS`), `js/regulatory-model.js`
   (`statusContradictions()`: una `kind:proposal` richiede uno stato pre-adozione; `provisionApplication()`),
   `tools/register-audit.mjs`, `tools/selftest.mjs` W11, W14, W15 e W16, `tools/source-contract.mjs`,
   `agent/browser/checks.mjs` (`checkNotCovered`).
9. `docs/AI-SAFE-BOUNDARIES.md` §0–§3 e `docs/SOURCE-POLICY.md`: ogni fatto di questa voce è rosso.

Se ritieni che una decisione del brief, della roadmap o del design vada rivista, segnalalo
esplicitamente e attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**Solo la voce 2.6**: valutare il Digital Networks Act come **regime in formazione** e, se il criterio lo
consente, aggiungerlo come strumento coperto, con la sua pagina. Poi checkpoint. La sessione si ferma al
checkpoint. Con la voce 2.6 si chiude la Fase 2; non avviare la Fase 3 né la sessione 10.

**Non copiare** schema, stato, relazioni o conclusioni decise per eIDAS2, CSA, EHDS o IEA: ogni campo si
decide sulle fonti del DNA, in questa sessione. Tieni distinti identità dello strumento, stadio
procedurale, date, campo di applicazione proposto e rilevanza per il brief. **Una proposta non è
diritto**: nessun testo, campo o evento può presentarla come vigente, e nessuna data proposta (entrata in
vigore, applicazione, recepimento) entra come fatto. **Nessuna relazione viene aggiunta per «completare»
la pagina.**

## Lo stato di partenza

Misurato il 28 ottobre 2026 su `main` (`cabe21b`). Rimisura tutto prima di porre le domande.
- **Nessun record** del DNA in `data/instruments.json`, nessuna relazione, nessun evento, nessuna regola.
- **Nessuna fonte**: né la proposta né il procedure file sono in `data/sources.json`.
- **Il brief non nomina il Digital Networks Act** (nessuna occorrenza in `index.html`): `brief_part` resta
  `null`, il criterio `evidence` del cancello dovrà reggersi su una provision con fonte, e il criterio
  `context` su un arco. Non creare una claim per soddisfare il cancello.
- **La bozza del design dice `status:proposal`** al 25 ottobre. Decidilo sulle fonti lette oggi.
- **L'id `dna` della bozza collide con il nome del campo `dna`** di ogni record e con lo spazio di nomi
  `dna:` della tassonomia (`dna_dimension`). Le chiavi di traduzione sono `<id>.dna.objective`, e
  `agent/detector/fields.mjs` usa percorsi come `dna.sanction_ceiling.fixed_eur`. Gli id non si rinominano
  mai: misura le collisioni (grep su `js/`, `tools/`, `agent/`, `i18n/`) e porta la scelta all'autore
  (domanda 2).
- **La baseline di chiusura della sessione 8** (da ricontrollare, non da copiare):
  - `validate` 0/0 con 45 non verificati; `i18n-audit`, `design-qa`, `seo-audit` 0/0;
  - `evidence-audit --as-of 2026-10-28`: 0 errori, 11 warning, REGISTER «covered 15 · mapped 12 ·
    watched 5 · excluded 6»;
  - `freshness`: 0 difetti, 3 richieste al 28/10 (è il calendario);
  - 25 suite: 1312 pass + 1 saltato (`::1`); browser 343 · 0 · 1 indecidibile; gate avversariale
    65 · 0 · 3 · 1;
  - 16 pagine strumento e 25 route indicizzabili; 38 strumenti, 37 relazioni, 223 fonti, 100 eventi.

## Lezioni della sessione 8 (da `docs/HANDOVER.md`; non ripeterle)

- **I testi che il lettore vede si approvano parola per parola prima di scriverli.** In (k) la forma fu
  approvata prima, ma la status note e due summary furono mostrati solo dopo la scrittura.
  `status_note`, `summary`, `reason`, il testo delle provision e il campo `obligation` degli eventi vanno
  nella domanda.
- **Un arco nuovo può rendere falsa la premessa di un test esistente.** W11 piantava la rimozione di
  «l'unico arco» di `eidas2`. Si cambia la piantatura, non si toglie un'asserzione; si misura che il test
  fallisce con il controllo disattivato, e lo si dichiara.
- **La suite browser verifica l'avviso «not covered»** cercando che non contenga alcun `<section>`
  (`checkNotCovered`). Qualunque blocco aggiunto lì è un `<div>`.
- **I metadati di procedura di Cellar non sono esiti.** Gli eventi del Consiglio come «Adoption of
  negotiating mandate by Coreper» vengono dalla sua pianificazione (`sender_transmission`
  `CONSIL:FilePlanning`), possono essere marcati `CANCELLED` (`event_legal_has-status_event-status`) e
  non stabiliscono che un mandato sia stato adottato. Il sito del Consiglio risponde 403 a questo
  ambiente; il Legislative Observatory (OEIL) risponde. Uno stadio si afferma solo se una fonte letta lo
  stabilisce; altrimenti lo si dice.
- **Branch e merge.** Non pushare su un branch mentre la sua PR può essere unita: nella sessione 8 un
  commit (`2b5d71d`) è arrivato pochi secondi dopo il merge della #29 ed è rimasto fuori da `main`. Una
  PR impilata su un'altra va unita dopo, con «Create a merge commit».
- **Riavvii del worker.** I job in background muoiono quando il worker si riavvia: salva gli output su
  file e ricontrollali. Non usare `pkill -f` con una stringa che compare nella tua stessa riga di comando:
  uccide la shell.
- **Le lezioni della sessione 7 valgono ancora**:
  - nessun output di agenti in `agent/records/`;
  - si correggono alla radice i controlli che un record nuovo espone;
  - si diffano solo i record toccati (`timeline.json` è indentato di uno spazio, `sources.json` ha
    escape misti);
  - prima di dire che una rettifica non è leggibile in inglese, chiedi a SPARQL le lingue.

## 9.0 · Domande da porre all'autore prima di scrivere qualsiasi cosa in `data/`

Prima leggi le fonti (9.1). Poi porta all'autore, **una domanda per volta tramite lo strumento di
domande**, con la raccomandazione in prima posizione e la motivazione nella domanda stessa. Non meno di
queste:

1. **Il criterio di inclusione.** Il design propone `crit:object-infrastructure` + `crit:horizontal`
   (+ `crit:readable`, perché la procedura è iniziata). Porta all'autore l'articolo sull'oggetto e
   l'ambito della proposta letto oggi, con il locator, a chi si applicherebbe e se le regole proposte si
   applicherebbero trasversalmente ai settori. Una proposta si legge come proposta: «would apply», non
   «applies». Se il criterio non regge, la voce non si fa e lo dici.
2. **L'id e il nome.** L'id è per sempre. Proponi un id che non collida (per esempio
   `digital-networks-act`), con le collisioni misurate di `dna`, oppure motiva `dna`. Il nome mostrato:
   `short_name`, alias, ed eventualmente `KNOWN_AS` (il nome deve corrispondere a un alias).
3. **Lo stadio procedurale.** `status:proposal`, `status:parliament-position`, `status:council-position`,
   `status:trilogue`, `status:political-agreement` o `status:withdrawn`, alla data del controllo,
   stabilito dal procedure file e dai metadati letti oggi. `kind:proposal` richiede uno stato pre-adozione
   (`statusContradictions()`). Di' quale etichetta derivata ne segue (§5) e cosa la pagina mostrerà.
   Proponi la `status_note` per intero (deve dire **NOT LAW**, come `data-omnibus`), con la `status_basis`
   (lo stadio accetta un procedure file di tier 2, S-03).
4. **Gli archi, uno per uno**, ciascuno con il testo della proposta che lo regge, letto oggi:
   - la modifica proposta della direttiva ePrivacy (bozza `rel-dna-eprivacy-amends`): oggi il locator
     della bozza è il solo titolo. Serve l'articolo che modifica;
   - ogni altro rinvio espresso a uno strumento del dataset (GDPR, NIS2, il Regolamento eIDAS, il nodo
     `eidas` aggiunto nella sessione 8, DSA, Data Act, AI Act, la Data Omnibus …), solo se il testo lo dice
     in modo specifico, con la direzione e il `rel-kind` della tassonomia. La modalità `proposed` è
     derivata, non si scrive;
   - gli atti che la proposta abrogherebbe o modificherebbe e che **non** sono nel dataset (secondo la
     bozza: il Codice europeo delle comunicazioni elettroniche, Dir. (UE) 2018/1972; il Regolamento BEREC,
     (UE) 2018/1971; il Regolamento (UE) 2015/2120): presentali e chiedi. Un nodo nuovo si crea solo su
     decisione dell'autore, con la sua forma (come `eidas` nella sessione 8);
   - un arco aggiunto **solo** per superare il criterio `context` non entra. Se un arco è ciò che soddisfa
     il cancello, dillo nella domanda.
5. **Le date.** L'evento della proposta (adozione da parte della Commissione) ed eventuali tappe
   procedurali che il procedure file registra (deferimento, progetto di relazione, voto in commissione,
   orientamento generale …), una per una, con la fonte. **Nessuna data che la proposta stessa prevede**
   (entrata in vigore, applicazione, recepimento, abrogazione) entra come evento: sono previsioni.
   Ricorda che `status:` e le tappe sono due sedi diverse: lo stadio sta nello stato, le tappe sono
   eventi.
6. **`dna.objective`**: due bozze, lette sull'articolo dell'oggetto, al condizionale o esplicitamente
   «proposed».
7. **Gli altri campi di `dna` e le provision.**
   - Provision: poche, lette, con `obligation_on` sui destinatari proposti, e un testo che dica che sono
     proposte. Verifica come la pagina rende una provision di una `kind:proposal` (precedente:
     `data-omnibus`).
   - `regulated_actor`, `obligation_anchor`, `implementation_model`.
   - `sanction_ceiling`: un tetto proposto non è un tetto. Se la proposta prevede sanzioni, proponi se
     registrarle come proposte, con una nota, oppure lasciarle `null`; non presumere.
   - `risk_logic`, `enforcement_mechanism`, `protected_party`, `territorial_scope` restano `null`, salvo
     decisione contraria.
   - Se serve un termine di tassonomia nuovo (per esempio per i fornitori di reti o servizi di
     comunicazione elettronica), proponilo con la definizione letta. Si aggiungono termini, non se ne
     rinomina nessuno.
8. **Le fonti nuove**: la proposta (Cellar, CELEX da rileggere) e il procedure file OEIL. Per ciascuna:
   i campi del contratto delle fonti, e una nota che dica cosa è stato letto e cosa no. Niente pagine
   della Commissione, salvo che tu le legga e le usi.

Registra ogni risposta in §8 con le parole dell'autore. Solo allora `approved_on` prende la data (M-04).
Ciò che non è approvato non entra.

## 9.1 · Leggere le fonti, prima delle domande

- **Cellar** per il CELEX della proposta, con `Accept: application/xhtml+xml`: il testo, almeno
  l'articolo sull'oggetto e l'ambito, le definizioni, gli articoli che modificano o abrogano altri atti,
  ogni articolo che rinvia a uno strumento del dataset, gli articoli sulle sanzioni, l'articolo finale.
  Se Cellar dà solo un PDF o nessuna espressione inglese, dillo e non supplire con altro.
- **I metadati SPARQL dell'Ufficio delle pubblicazioni**:
  - il fascicolo (`work_part_of_dossier`), con `procedure_code_interinstitutional_reference_procedure`
    e i flag `dossier_pending-proposal`, `dossier_adopted-proposal`, `dossier_withdrawn-proposal`;
  - gli eventi (`event_legal_part_of_dossier`), con tipo, data, stato e mittente. Ricorda la lezione:
    gli eventi del Consiglio sono pianificazione.
- **Il Legislative Observatory** (OEIL) per la procedura: lo stadio («Stage reached in procedure»), le
  key events, le commissioni.
- **Per ogni arco** verso un altro strumento, rileggi anche il testo dell'altro dove serve a capire il
  rinvio; il locator dell'arco sta comunque nel testo che stabilisce il rapporto.
- **Un fatto che oggi non riesci a riconfermare** non entra in `data/`: resta `null`, con una nota.
  Non completare con un risultato di ricerca, uno snippet o la memoria del modello.

## 9.2 · Scrivere

- Una sola sede per fatto. Le date stanno in `timeline.json`, mai sullo strumento. Titoli e nomi in uso
  stanno in `tools/seo.mjs` e `js/routes.js KNOWN_AS`, mai in `data/`. Lo stadio procedurale sta nello
  stato e nella `status_note`, non nei summary degli archi (la sessione 8 ha tolto «stalled in Council»
  da un arco per questa ragione).
- **Nessun identificativo interno nei testi che il lettore vede**: niente `clm-*`, `docs/...`, codici di
  decisione (finding 10.2, ancora aperto: non aggiungerne).
- I controlli devono restare a 0 errori: M-04 (decisione obbligatoria), M-05 (la pagina), M-07
  (`status_basis`), S-07 e `statusContradictions()` (una proposta ha uno stato pre-adozione).
- Aggiungi in `tools/selftest.mjs` un test sul modello di W15. Deve piantare la perdita della base dello
  stato, della decisione, dell'arco o degli archi che danno contesto e dell'obiettivo, e anche uno stato
  post-adozione su una `kind:proposal`, verificando che ciascuna fallisca. Dimostra che fallisce se il
  controllo che lo regge viene disattivato. Se un controllo va esteso, è un controllo in più, con un test
  che lo fa fallire.
- Dopo ogni modifica a `data/`:
  - `node tools/_footer.mjs`, e committa ciò che scrive; un secondo `_footer` deve scrivere 0 file;
  - `node tools/og-image.mjs` per la card nuova (serve `BROWSER_QA_CHROME`); ripristina le card i cui
    input non sono cambiati e controlla con `--check`;
  - dichiara `superseded` o `pending_translation` ogni chiave di locale toccata, oppure dichiara che
    nessuna lo è e perché.
- **Ogni commit che modifica un file pubblicato** porta una riga `Evidence: <fonte, record o
  controllo>`; `tools/commit-evidence.mjs origin/main HEAD` deve dare 0 commit senza evidenza.
- Leggi il `git diff` completo prima di ogni commit.

## 9.3 · Checkpoint — la sessione si ferma qui

- Rilancia:
  - `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`,
    `seo-audit`;
  - le 25 suite (con `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, o il
    percorso dell'ambiente), e la suite browser con `--require-browser`;
  - il gate avversariale, `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`,
    `tools/commit-evidence.mjs`.

  Prima dell'ultima corsa delle suite, verifica che `agent/records/` sia vuoto di ciò che hai prodotto.
- Apri la pagina del DNA in un browser, tema scuro e chiaro, desktop e 390px; apri anche le pagine degli
  strumenti all'altro capo di ogni arco. Verifica che **nessuna pagina presenti la proposta come diritto
  vigente**, né per stato, né per date, né per chi sarebbe obbligato, né per sanzioni; in particolare
  l'intestazione («Next date», «Sanction ceiling»), «In short» e la tabella delle provision.
- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 8. Contiene:
  - le decisioni dell'autore e cosa è stato scritto (commit);
  - i controlli modificati e perché;
  - i fatti letti, non letti e lasciati `null`;
  - i criteri di uscita della voce 2.6, e la chiusura della Fase 2 come proposta all'autore, non come
    fatto;
  - i conteggi prima/dopo, con il motivo;
  - la pagina vista nel browser;
  - i finding non corretti;
  - la checklist di verifica e come controllare a mano.
- Tieni visibili nel rapporto i finding ancora aperti:
  - sessione 8: il colore del link «Read it at the source» nell'avviso, in tema scuro; il `<title>` della
    pagina EHDS («EHDS — …»); la `status_note` di `data-omnibus` da riverificare sull'esito del Coreper
    del 21 ottobre 2026; `nis2 → eidas` non modellato;
  - ancora aperti: (g) i riferimenti interni (sessione 10, voce 10.2); `src-ec-ai-omnibus-in-force`
    (403); il test `::1`; le 8 relazioni v1 e il flip `edge-v1-sources`; R-01 e gli otto rilievi del
    design §7 (Fase 3).
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore; si registra in §8. Poi chiedi se aprire una pull request
  verso `main` e registra la sorte del branch nel registro di `docs/HANDOVER.md`. **Non pushare sul branch
  dopo aver chiesto il merge.**

## Cosa NON fare in questa sessione

- Non presentare la proposta come diritto vigente, e non aggiungere come evento una data che la proposta
  prevede.
- Non creare un nodo per il Codice europeo delle comunicazioni elettroniche, il Regolamento BEREC, il
  Regolamento (UE) 2015/2120 o un altro atto senza una decisione dell'autore.
- Non creare una claim che la prosa del brief non contiene.
- Non correggere i finding aperti elencati sopra: la sessione 8 ne ha chiusi alcuni su richiesta
  esplicita dell'autore, e questa sessione non lo fa senza una richiesta nuova.
- Non toccare i riferimenti interni (sessione 10, voce 10.2), né `rel-data-omnibus-gdpr` oltre a quanto
  deciso, né la `status_note` di `data-omnibus` senza una domanda all'autore.
- Non pubblicare la mappa delle dipendenze né la sua vista. Non implementare D2 né D3 oltre a ciò che la
  voce 2.6 richiede in modo dimostrabile.
- Non avviare la Fase 3 («what applies», base), anche se la Fase 2 si chiude con questa voce.
- Non implementare né preparare l'Evidence Navigator (roadmap §4), né toccare `js/search.js` per esso.
- Non introdurre Tier A/B/C, automazione, dipendenze runtime, richieste a terze parti, dashboard,
  redesign.
- Non dichiarare «sicurezza operativa dimostrata». Non trasformare uno skip in un pass.
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Criterio di uscita e consegna

La sessione è completa in uno di tre casi: la voce 2.6 è implementata e il suo checkpoint è approvato
dall'autore; l'autore decide di fermarsi; oppure il criterio di inclusione non regge e lo hai dimostrato
sulle fonti.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (9.0–9.3) indica:
- cosa è stato modificato (file, record, viste);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
