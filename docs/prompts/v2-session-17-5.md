<!--
Provenance: the prompt of v2 Session 17.5, drafted on 3 Nov 2026 on the author's request after v2 Session 17's
checkpoint was approved and merged (#47): "I want to generate a 17.5 session to set up Phase 4, auditing Phase 3's
accomplishments to transit Phase 3 to Phase 4 seamlessly". Drawn from docs/BRIEF-v2.md (the sequence Fase 0 → … →
Fase 5; «Cosa NON fare»: no Tier A/B/C as the first intervention, no custom serverless backend until a git-based CMS
is shown insufficient); docs/ROADMAP-v2.md §3 (D-4, D-5), §4 (Phases 3, 4, 5) and §8 (the closing gate of v2,
28 Oct 2026, answers 1, 3a–3c and 5; the plan row of 28 Oct 2026; the rows of Sessions 12–17 and "The checkpoint of
v2 Session 17"); docs/V2-CLOSURE.md (every row classed "B — Phase 3" or "B — Phase 4"); docs/POST-V2.md §2; and the
v2 Session 17 report in docs/HANDOVER.md. The starting state was measured on `main` at d65e713 on 3 Nov 2026. The
decisions live in those rows and nowhere else; this file is the instruction text that cites them, and it records
none. Written in Italian, as the author's session prompts are. The author may change it before use.
-->

SESSION 17.5 — Il passaggio dalla Fase 3 alla Fase 4: l'audit di ciò che la Fase 3 ha prodotto, la decisione sul suo stato, e la preparazione della Fase 4 (D-4, D-5, l'inventario dei processi manuali, una condizione d'ingresso che possa fallire), per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Verifica che `main` contenga la
sessione 17 e questo prompt:
- `docs/ROADMAP-v2.md` §8 ha la riga «The checkpoint of v2 Session 17 = items 17.1, 17.2 and 17.3»;
- `node tools/evidence-audit.mjs --as-of <oggi>` riporta «publishable 33 of 33» e **nessuna** riga «BACKLOG rule-»;
- `docs/prompts/v2-session-17-5.md` esiste.

Se manca qualcosa in `main`, fermati e segnalalo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 17.5» con le parole con
cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di
domande. Senza quella riga non si scrive nulla, nemmeno in `docs/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso: `origin/scout/digest-digest-2026-10-26T13-10-32Z` e `origin/claude/v2-session-8-findings`
(già nel registro), e il branch di questo prompt se la sua PR non è ancora unita.

**Un difetto presente in `main` prima della sessione.** Il 2 novembre 2026 `main` ha ricevuto `d65e713` («Add Open
Graph site name meta tag», un commit dell'autore fuori dalle sessioni). Misurato il 3 novembre 2026:
- `node tools/seo-audit.mjs` esce **1** con 3 ERROR: «generated: es/index.html is stale — run node tools/_footer.mjs»,
  e lo stesso per `fr/` e `it/`;
- `index.html` porta **due** `og:site_name`: la riga 13 aggiunta a mano e la riga 22 che `tools/_footer.mjs` genera
  dentro il blocco `social-meta` (`tools/seo.mjs`);
- `node tools/commit-evidence.mjs 9cc7aa5 d65e713`: «✗ d65e713 changes 1 published file(s) (index.html) and carries
  no "Evidence:" trailer».

Rimisuralo. Se è ancora così, **è la prima cosa da portare all'autore** (domanda 0, sotto), prima di ogni altra
domanda: un gate rosso in `main` è un difetto del pubblicato, non un rumore di fondo, e questa sessione non lo
corregge in silenzio né lo lascia in silenzio. Non è compito di questa sessione riscrivere la storia di `main`: un
commit già unito non si modifica (`d65e713` resta senza trailer; si riporta).

Crea un branch di sessione (`claude/v2-session-17-5-phase-transition` o quello assegnato dall'ambiente). Non
lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`: la sequenza «Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5» (una decisione già presa);
   «Non aggiungere la Tier A/B/C come primo intervento. Prima di automatizzare, rendi trasparente il processo
   manuale»; «Non costruire un backend serverless custom finché un CMS git-based non si dimostra insufficiente»; la
   riga «Control Room: Tier A … Tier B … Tier C … Login preferito: CMS git-based con OAuth».
2. `docs/ROADMAP-v2.md`: §3 (D-4, D-5, con le raccomandazioni); §4, Fasi 0 e 1 (le voci 0.1–0.4 e 1.1–1.5: sono i
   processi manuali che la Fase 4 automatizza), Fase 3 (la condizione d'ingresso e la riga «Met on 29 Oct 2026»),
   Fase 4 per intero («Phase 4 automates only what Phases 0–1 made visible as a manual process») e Fase 5 («Its
   scope is written only after Phase 3's checkpoint»); §7; e in §8: «The closing gate of v2» (risposte 1, 3a–3c, 5,
   6), il piano del 28 ottobre 2026 («and the entry condition is met; and two maintenance checks»), le righe delle
   sessioni 12–17 e «The checkpoint of v2 Session 17».
3. `docs/V2-CLOSURE.md`: §2 per intero. Ogni riga di classe «B — Phase 3» e «B — Phase 4», con la sua colonna
   «Today» e l'eventuale «Closed, `<commit>`».
4. `docs/HANDOVER.md`: i rapporti delle sessioni 12–17, in particolare ogni «Found, for the author — not changed» e
   «What was not verified».
5. `docs/POST-V2.md` §2 (le condizioni prima di aprire il post-v2, tra cui «la Fase 3 è chiusa, o l'autore decide
   che il post-v2 può partire comunque»).
6. Ciò che esiste già e che la Fase 4 troverebbe: `docs/AUTONOMY-POLICY.md` (le classi A/B/C/D, che sono la
   collisione di D-4), `docs/LIMITED-AUTONOMY.md`, `docs/CONTROL-ROOM.md` (il login OIDC, le viste, i gate di
   approvazione), `docs/EDITORIAL-AUDIT-PATH.md` (1.1), `docs/PRODUCTION-OPERATING-MODE.md` (la prontezza che
   rifiuta), `tools/thirdparty.mjs` (`ALLOWED_RUNTIME_ORIGINS`, vuoto).

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e attendi
conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**Una sessione di misura e di decisione, non di implementazione**, sul modello della sessione 11 (il gate di
chiusura della v2). **Non si modifica nulla di pubblicato** (`data/`, `js/`, `css/`, `style.css`, le pagine,
`i18n/`, `img/`, `instruments/`) né alcun controllo (`tools/`, `agent/`, `.control-room/`). Si scrive soltanto in
`docs/`. L'unica eccezione possibile è il difetto di `d65e713`, e solo se l'autore, alla domanda 0, decide di
correggerlo in questa sessione: allora è un commit a sé, con la riga `Evidence:`, prima di ogni altra scrittura.

Tre voci, nell'ordine, poi checkpoint:
- **17.5.1 · L'audit della Fase 3**: che cosa la Fase 3 ha prodotto, misurato oggi, non ricopiato dai rapporti; e che
  cosa le era stato assegnato e resta aperto.
- **17.5.2 · La preparazione della Fase 4**: l'inventario dei processi manuali che la Fase 4 automatizzerebbe, i tre
  livelli di D-4 applicati a quell'inventario, i fatti che D-5 richiede, e una condizione d'ingresso proposta.
- **17.5.0 · Le domande all'autore**, una per volta, dopo 17.5.1 e 17.5.2 scritti.

Non dichiarare la Fase 3 «chiusa», «conclusa» o «completata», né la Fase 4 «aperta» o «avviata», in nessun
documento finché la riga dell'autore non è in §8. Una condizione d'ingresso soddisfatta non chiude la fase che apre.

## Lo stato di partenza

Misurato il 3 novembre 2026 su `main` a `d65e713`, dove indicato; il resto viene dal rapporto della sessione 17
(`42feb8f`, 29 ottobre 2026). **Rimisura tutto.**

**Ciò che la Fase 3 ha fatto (§8, sessioni 12–17):**
- 12: V2C-01 (la modalità derivata degli archi, `js/map-model.js`) e il controllo `tools/trigger-audit.mjs`, T-01…T-11;
- 13: V2C-67, `tools/validate.mjs` sulla forma v2, il pilota (`ap-eidas2-01`, `ap-pld-01`) e il metodo delle sessioni
  14–17 (una tabella per strumento, una domanda a parte per ciò che va oltre la forma);
- 14–17: le 33 regole nella forma v2, lette contro i loro Articoli; V2C-06…V2C-10 chiusi;
- 17: il flip dei BACKLOG `rule-*` a ERROR (`RULES_V1` rimossa), T-12 `LAW_CHANGED_SINCE_VERIFIED` e la freschezza
  per regola (`RULE_STALE`, 90 giorni); V2C-02 chiuso; §4 «Met on 29 Oct 2026».

**Ciò che la Fase 3 non ha fatto.** `docs/V2-CLOSURE.md` dà alla Fase 3 venti righe di classe B. Al 3 novembre 2026
ne risultano **chiuse** sei (V2C-02, -06, -07, -08, -09, -10) più V2C-01 (classe A); **aperte** quindici: V2C-03,
-04, -05 (gli array `proposes_to_amend` come seconda casa degli archi), V2C-11 (R-01 non può scattare per P2B),
V2C-12 (8 relazioni v1, il flip `edge-v1-sources` rinviato), V2C-13 (l'audit non legge le relazioni), V2C-14 (le sei
etichette di stato, D-3, non sul sito), V2C-15 (`stratum` non derivato), V2C-16…V2C-19 (la mappa: la derivazione
della modalità per `enables`, gli atti della DNA, `nis2 → eidas`, i due `defers-to` del regolamento sulla pubblicità
politica), V2C-20 (nessun tipo d'evento per una tappa procedurale), V2C-21 (`eidas2.regulated_actor`), V2C-66 (il
flip di `scope-decision-missing` e `status-basis-missing`). **Ricontrolla riga per riga**: il conteggio è da
rimisurare, non da copiare.

**I rilievi aperti delle sessioni 12–17** (da `docs/HANDOVER.md`), tra cui:
- la nota D-2 su `applies.html` dice ancora che le regole citano le fonti «by identifier only» e che l'audit non le
  controlla: falso per tutte e 33 dal 29 ottobre 2026 (rilievo 1 della sessione 17; la parola è dell'autore);
- `ap-nis2-01` «materially incomplete» contro «While most complied» del comunicato; `ap-cra-01` «serious incidents»
  contro «severe incident» dell'Art. 14(3); `ap-nis2-02` «which NIS2 treats as essential»; `ap-data-act-02`
  `likely`; le note di tassonomia di `actor:essential-entity` e `actor:important-entity`; Art. 111(3) dell'AI Act;
  «1 days ago»; i titoli dell'Art. 50 dell'AI Act.

**I due controlli di manutenzione, sul calendario** (da rimisurare): T-12 riporta `ap-cra-01` dal 26 marzo 2027 (la
data d'applicazione dell'EHDS, che modifica il CRA); `RULE_STALE` riporta tutte e 33 le regole dal 28 gennaio 2027,
lette tutte nello stesso giorno.

**Ciò che la Fase 4 troverebbe.** D-4 e D-5 aperte (§8, «The closing gate of v2», risposta 5: «Both open, tied to
Phase 4»). Tre righe «B — Phase 4» aperte: V2C-40 (nessun dispatcher di produzione), V2C-41 (il registro delle
decisioni `agent/implement/decisions/decisions.jsonl` assente), V2C-43 (il gate avversariale: PP-08 parziale alto,
HE-04 e OB-05 medi; PP-09 indecidibile). La prontezza di produzione: 17 di 20, **rifiuta**; bloccano
`production_dispatcher_wired`, `decision_ledger_present` e `deploy_gate_exists` (non misurabile dall'albero, V2C-42).
`ALLOWED_RUNTIME_ORIGINS` è vuoto. La concessione di autonomia limitata scade il 9 marzo 2027.

**La baseline.**
- Misurata il 3 novembre 2026 su `d65e713`: `validate` 0 errori, provvedimenti 113, 45 non verificati;
  `i18n-audit`, `design-qa` 0/0; **`seo-audit` 3 ERROR** (sopra); `evidence-audit --as-of 2026-11-03` 0 errori,
  **12** warning (gli 11 di prima più `STATUS_PREDATES_MILESTONE instruments/dma`: la designazione del 1° novembre
  2026 è passata), publishable 33 of 33; `freshness --as-of 2026-11-03` 0 difetti, **4** richieste.
- Dal rapporto della sessione 17 (`42feb8f`): `tools/selftest.mjs` 123; le 24 suite 1253; Control Room 76 · 1
  saltato; suite browser 343 · 0 · 1; gate avversariale 65 · 0 · 3 · 1; prontezza 17 di 20, rifiuta.

Un numero che si muove con la data (le richieste di `freshness`, il warning sulla DMA) si spiega, non si «sistema».

## 17.5.1 · L'audit della Fase 3

Scrivi `docs/PHASE-3-AUDIT.md` (nome proposto; l'autore può cambiarlo), sul modello di `docs/V2-CLOSURE.md`: per
ogni riga **stato** (eseguito · non eseguito · aperto · chiuso · superato), **evidenza** (commit, riga di §8, test) e
**verifica di oggi** (il comando o il test rilanciato in questa sessione, con l'esito). Sezioni:

1. **La condizione d'ingresso**, i suoi tre criteri di §4 rimisurati uno per uno, con i comandi; e una prova che il
   flip regge (una regola piantata con un ID nudo in una copia dell'albero: `evidence-audit` esce 1 con T-01 e T-02).
2. **Le 33 regole, sessione per sessione**: per ciascuna sessione 12–17, le righe di §8 che hanno deciso, i commit,
   e le asserzioni che le tengono (X1–X4, Y1–Y6, F10) rilanciate oggi. Le regole non si rileggono contro gli
   Articoli in questa sessione: si misura che la forma e ciò che l'autore ha approvato reggono.
3. **Ciò che era assegnato alla Fase 3 e resta aperto**: ogni riga «B — Phase 3» di `docs/V2-CLOSURE.md`, con lo
   stato misurato oggi. Per una riga aperta, che cosa la chiuderebbe e se tocca ciò che il sito dice a un lettore.
4. **I rilievi delle sessioni 12–17 ancora aperti**, ciascuno con la sessione d'origine, se tocca ciò che il sito dice
   di diritto o solo la presentazione, e (per la nota D-2) il testo attuale e una formulazione proposta, **parola
   per parola**, che resta una proposta.
5. **I due controlli di manutenzione**: che cosa riportano oggi e alle date note (26 marzo 2027, 28 gennaio 2027),
   misurato con `--as-of`; e che cosa la loro risposta richiede a una persona (D-4, D-5: accorgersi che il diritto è
   cambiato resta un atto di una persona finché la Fase 4 non decide altrimenti).
6. **La Fase 5**: la roadmap dice che il suo perimetro si scrive solo dopo il checkpoint della Fase 3. Questa sessione
   **non lo scrive**: misura soltanto che cosa la Fase 3 ha lasciato come base (le 33 regole, le tre dimensioni del
   questionario, i rilievi su condizioni ed esiti come `ap-ai-act-01` e i fornitori GPAI) e lo porta all'autore.

**Una riga che oggi fallisce non si corregge in questa sessione**: si riporta, con il comando che lo mostra.

## 17.5.2 · La preparazione della Fase 4

Scrivi `docs/PHASE-4-SETUP.md` (nome proposto). È un documento di progetto: **non implementa nulla**.

1. **L'inventario dei processi manuali** (il brief: «Prima di automatizzare, rendi trasparente il processo
   manuale»; §4: «Phase 4 automates only what Phases 0–1 made visible as a manual process»). Una riga per processo:
   - quelli resi visibili dalle Fasi 0–1: 0.1 (istantanea di tempo e stato), 0.2 (l'attestazione della revisione delle
     evidenze), 0.3 (una data illeggibile rifiutata), 1.1 (il percorso dell'audit editoriale registrato), 1.2 (le
     definizioni delle metriche), 1.3 (`docs/CONTROL-ROOM.md` allineato all'interfaccia), 1.5 (la nota di
     `applies.html`);
   - quelli che la Fase 3 ha reso manuali e ripetibili: leggere una regola contro i suoi Articoli in Cellar; chiedere
     ai metadati SPARQL modifiche, rettifiche e lingue; il metodo delle domande in §8; la risposta a un
     `LAW_CHANGED_SINCE_VERIFIED` o a un `RULE_STALE`; rigenerare le pagine con `tools/_footer.mjs`; la riga
     `Evidence:`.
   Per ciascuno: chi lo fa oggi, dove resta traccia (§8, `docs/HANDOVER.md`, la traccia della Control Room, un file
   tracciato o ignorato da git), che cosa un validatore può già stabilire, e che cosa resta di una persona.
2. **I tre livelli applicati all'inventario**, con i nomi della raccomandazione di D-4 (*machine check*, *human
   attestation*, *human authorship*) **in attesa della decisione**: per ogni processo, quale parte è di quale livello.
   Senza lettere: «Tier A/B/C» collide con le classi A/B/C/D di `docs/AUTONOMY-POLICY.md` (D-4).
3. **Ciò che esiste già**: la concessione di autonomia limitata e le sue cinque categorie, i gate della Control Room,
   la prontezza e i suoi tre bloccanti, le tre righe «B — Phase 4». Per ciascuno, se la Fase 4 lo estende, lo usa o
   non lo tocca. La regola: **nessun secondo luogo per una politica** (`agent/policy/` è l'unica casa).
4. **D-5, i due fatti.** La raccomandazione di D-5 chiede, prima di scegliere un CMS git-based, due fatti letti nella
   **documentazione del CMS stesso**: se il suo login GitHub richiede uno scambio di token lato server (cioè un
   backend), e da quali origini carica codice (`ALLOWED_RUNTIME_ORIGINS` è vuoto; aggiungerne una è una decisione
   di classe D). Leggili se la rete lo consente, per i CMS che l'autore indica o, se non ne indica, per al più due
   proposti con la ragione; cita URL, data e sezione letta. **Nulla dalla memoria del modello.** Se la rete non lo
   consente, dillo: D-5 resta aperta. Confronta con il login OIDC che la Control Room ha già. Non installare nulla.
5. **Una condizione d'ingresso per la Fase 4 che possa fallire**, sul modello di quella della Fase 3: un elenco di
   criteri misurabili (per esempio: D-4 decisa; l'inventario di 17.5.2.1 approvato, ogni processo con il suo livello;
   D-5 decisa sui due fatti letti, o rinviata con la ragione), ciascuno con il comando o il documento che lo verifica.
   È una **proposta**; la decisione è dell'autore.
6. **Una prima voce proposta per la Fase 4**, coerente con il brief (prima la trasparenza del processo manuale, poi
   l'automazione), senza piano oltre la prima sessione: la roadmap non pianifica una fase prima di raggiungerla (§6).

## 17.5.0 · Domande da porre all'autore

Prima fai 17.5.1 e 17.5.2 e mettili nei due documenti (scrittura in `docs/`, permessa dalla riga di scope). Poi
porta all'autore, **una domanda per volta tramite lo strumento di domande**, con la raccomandazione in prima
posizione e la motivazione nella domanda stessa. Almeno:

0. **Il difetto di `d65e713`**, se ancora presente: correggerlo in questa sessione (un commit a sé: togliere la riga
   13 di `index.html` e rilanciare `node tools/_footer.mjs`, che rigenera `es/`, `fr/`, `it/`; la riga `Evidence:`),
   o lasciarlo a una sessione di manutenzione e registrarlo. Mostra prima e dopo misurati su una copia.
1. **Lo stato della Fase 3.** Le opzioni, ciascuna con ciò che comporta per la Fase 4, la Fase 5, il post-v2 (che
   attende «la Fase 3 è chiusa, o l'autore decide…») e la sequenza del brief, che è vincolante:
   - la Fase 3 («what applies», base) si chiude sulla condizione d'ingresso soddisfatta e sulle 33 regole, e le
     righe «B — Phase 3» ancora aperte passano a una destinazione nominata (la mappa e le etichette a una fase o a
     sessioni dedicate; ciò che tocca il lettore prima del resto);
   - la Fase 3 resta aperta finché quelle righe non si chiudono, e la Fase 4 si prepara solo nei documenti;
   - un'altra delimitazione proposta dall'autore.
   La raccomandazione si fonda su 17.5.1, non su questo prompt. Se un'opzione richiede di rileggere una decisione
   del brief, la domanda lo dice con le parole del brief.
2. **La destinazione di ogni riga «B — Phase 3» aperta**, gruppo per gruppo (gli array e gli archi; la mappa; le
   etichette e le transizioni; `stratum`; gli attori; il flip di V2C-66), con l'elenco completo nel documento.
3. **La nota D-2 su `applies.html`**: la formulazione proposta, parola per parola, prima e dopo, con le sue
   traduzioni (`applies.notice` è `pending_translation` in it, fr, es: V2C-27). La parola è dell'autore; scriverla
   cambia una pagina pubblicata, quindi **non in questa sessione**: la domanda è se e quando, e con che testo.
4. **I rilievi aperti delle sessioni 12–17**: per ciascun gruppo, una sessione di manutenzione, la Fase 5, o lasciato
   con la ragione.
5. **La Fase 5**: se il suo perimetro si scrive nella sessione successiva, dopo la Fase 4, o in un altro momento.
   Questa sessione non lo scrive.
6. **D-4**: i nomi dei tre livelli (la raccomandazione di §3: in parole, senza lettere), e l'assegnazione dei livelli
   all'inventario di 17.5.2.
7. **D-5**: sui due fatti letti, decisa o rinviata con la ragione. Se un'opzione aggiunge un'origine in
   `ALLOWED_RUNTIME_ORIGINS`, la domanda dice che è una decisione di classe D.
8. **La condizione d'ingresso della Fase 4 e la sua prima voce**, come proposte in 17.5.2.5–6.
9. **I documenti di stato** (l'intestazione di `docs/ROADMAP-v2.md`, la riga di `AGENTS.md` sulla roadmap, il «Last
   updated» di `docs/HANDOVER.md`, l'intestazione di `docs/V2-CLOSURE.md` e le righe che la domanda 2 sposta): se e
   come aggiornarli dopo le decisioni, con il prima e il dopo esatti.

Registra ogni risposta in §8 con le parole dell'autore, e committa subito. Ciò che non è approvato non entra.

## 17.5.3 · Scrivere e verificare

- Si scrive soltanto in `docs/`: i due documenti, le righe di §8, il rapporto in `docs/HANDOVER.md`, e i documenti
  di stato della domanda 9, solo con il testo approvato. (Eccezione: la domanda 0, se l'autore decide così.)
- Rilancia tutto come misura, prima e dopo, e salva gli output su file: `validate`, `i18n-audit`, `design-qa`,
  `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`; le 25 suite (con
  `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, o il percorso dell'ambiente), la suite
  browser con `--require-browser`, il gate avversariale, `agent/schemas/cli.mjs check`, `.control-room/cli.mjs
  boundary` e `routes`, `tools/og-image.mjs --check`, `agent/production/cli.mjs readiness`.
- `tools/commit-evidence.mjs <base della sessione> HEAD`: 0 commit di sessione senza evidenza (un commit che cambia
  solo `docs/` non ne richiede).
- Leggi il `git diff` completo prima di ogni commit. Non scrivere file mentre la suite browser gira.

## 17.5.4 · Checkpoint — la sessione si ferma qui

- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 17: le decisioni dell'autore e i commit; il
  riassunto dell'audit della Fase 3 (il dettaglio resta in `docs/PHASE-3-AUDIT.md`); l'inventario della Fase 4 con
  i livelli **decisi**; le righe di `docs/V2-CLOSURE.md` con la destinazione decisa; i conteggi prima e dopo con il
  motivo di ogni movimento; ciò che non è stato verificato e perché; la checklist (17.5.0–17.5.4) e come controllare
  a mano.
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore; si registra in §8. Poi chiedi se aprire una pull request verso
  `main`, e registra la sorte del branch. **Non pushare sul branch dopo aver aperto la PR.** Il prompt della
  sessione successiva (la prima della Fase 4, o ciò che l'autore decide) si scrive solo se l'autore lo chiede.

## Cosa NON fare in questa sessione

- Non avviare la Fase 4: nessun CMS installato o configurato, nessun login, nessuna origine in
  `ALLOWED_RUNTIME_ORIGINS`, nessun dispatcher, nessuna nuova concessione di autonomia, nessun codice in `tools/`,
  `agent/` o `.control-room/`. Aprire una fase è una decisione; avviarla è un'altra sessione.
- Non introdurre lettere «Tier A/B/C» in nessun documento come nome di un livello (D-4); citarle solo come parole
  del brief.
- Non dichiarare la Fase 3 chiusa né la Fase 4 aperta senza la riga dell'autore in §8; non dichiarare la v2
  conclusa; non dichiarare «sicurezza operativa dimostrata».
- Non scrivere il perimetro della Fase 5; non aprire il post-v2, il capitolo finanza o l'Evidence Navigator.
- Non correggere alcun rilievo, nemmeno uno piccolo: si misura, si classifica e si chiede (la sola eccezione è la
  domanda 0, se l'autore la decide).
- Non toccare `applies.html` né la sua nota; non ritirare la pagina.
- Non rileggere né modificare le regole, i claim o i paragrafi del brief.
- Non riscrivere la storia di `main`, né forzare un push.
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione; non trasformare uno skip
  (il test `::1`) in un pass.
- Non toccare la licenza né il testo di non affiliazione o di assenza di consulenza legale; non scrivere nel README.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–17 (da `docs/HANDOVER.md`; non ripeterle)

- **Ciò che si dice all'autore va misurato e citato esattamente**, e si legge prima di chiedere. Prima di dire dove
  un testo si stampa, cercalo nel codice (`js/search.js`, `js/interactions.js`, `js/calendar.js` stampano anche
  ciò che una pagina sola non mostra).
- **Un difetto che il lavoro espone si porta all'autore**: né corretto in silenzio, né lasciato in silenzio. Vale
  anche per un difetto in `main` che non è di una sessione.
- **Anche un controllo può avere un difetto**; un controllo nuovo che trova qualcosa è un rilievo, non un difetto da
  far tacere. Un numero che cambia con la data si spiega.
- **Una condizione d'ingresso soddisfatta non è una fase chiusa**: la sessione 11 ha chiuso nulla che non fosse
  eseguito; vale lo stesso qui.
- **Una premessa che la domanda non ha nominato si chiede a parte** (sessioni 13, 15 e 17).
- **Branch e merge.** Non pushare su un branch dopo aver aperto la sua PR; `main` può muoversi durante la sessione:
  riscarica prima dell'ultima scrittura (il 2 novembre 2026 si è mosso con un commit dell'autore).
- **Riavvii del worker.** Registra ogni risposta in §8 e committa subito; salva gli output su file; non usare
  `pkill -f` con una stringa che compare nella tua stessa riga di comando; ferma un server per PID.
- **Nessun output di agenti in `agent/records/`.**

## Criterio di uscita e consegna

La sessione è completa in uno di due casi: i due documenti sono scritti, l'autore ha deciso lo stato della Fase 3,
la destinazione delle righe aperte, D-4 (e D-5, o il suo rinvio motivato) e la condizione d'ingresso della Fase 4, e
il checkpoint è approvato; oppure l'autore decide di fermarsi.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (17.5.0–17.5.4) indica:
- cosa è stato scritto (file, righe di §8, commit);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
