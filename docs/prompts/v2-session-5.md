<!--
Provenance: the prompt of v2 Session 5, drafted at the end of v2 Session 4 (27 Oct 2026) from the
author's three answers recorded in docs/ROADMAP-v2.md §8 ("The scope of v2 Session 5"). The
decisions live in that row and nowhere else; this file is the instruction text that cites it.
Written in Italian, as the author's session prompts are. The author may change it before use.
-->

SESSION 5 — Voce 2.2 (eIDAS 2.0, promozione) e tre interventi aperti dalla sessione 4, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git fetch --all && git branch -a`. Verifica due cose:
- che `main` contenga la pull request #21 (sessione 4: voce 2.1 e Parte B);
- che `docs/ROADMAP-v2.md` §8 abbia la riga del 27 ottobre 2026 «The scope of v2 Session 5».

Se una delle due manca in `main`, fermati e segnalalo: le decisioni di questa sessione hanno una sola
sede, ed è quella riga.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md` — contratto tra sessioni.
2. `docs/ROADMAP-v2.md`:
   - §4, Fase 2, voci 2.2–2.6 (il paragrafo comune: ogni voce è lavoro ambra o rosso);
   - §8, tutte le righe, in particolare quelle del 27 ottobre 2026 della sessione 4 e «The scope of
     v2 Session 5».
3. `docs/HANDOVER.md`, sezioni «Next — v2 Session 5», «v2 Session 4 — Part B checkpoint report» e
   «v2 Session 4 — Part A checkpoint report (item 2.1)».
4. `docs/V2-DATA-DESIGN.md`:
   - lo stato in testa (voce 2.1 implementata, e dove l'implementazione si discosta);
   - §1.3 (nodi e copertura), §1.5 (M-01…M-16), §3 (S-, R-), §4.3, §5 (criterio approvato), §6
     (righe di `eidas2`), §6.4 I-6;
   - §7 (otto rilievi, della Fase 3: non correggerli).
5. `tools/register-audit.mjs`, `js/routes.js` (`GATE`, `coverage()`), `tools/seo.mjs`.
6. `docs/AI-SAFE-BOUNDARIES.md` §0–§3 e `docs/SOURCE-POLICY.md`: ogni fatto di questa voce è rosso.

Se ritieni che una decisione del brief, della roadmap o del design vada rivista, segnalalo
esplicitamente e attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione, nell'ordine deciso dall'autore

**Parte A** — voce 2.2 (promozione di `eidas2` a strumento coperto), poi checkpoint. La sessione si
ferma al checkpoint.
**Parte B** — tre interventi aperti dalla sessione 4, solo dopo l'approvazione del checkpoint A.

Non procedere alla voce 2.3 (Cyber Solidarity Act) né oltre.

## Parte A — eIDAS 2.0 (voce 2.2)

### A.0 · Domande da porre all'autore prima di scrivere qualsiasi cosa in `data/`

Misurato il 27 ottobre 2026 sul record `eidas2` in `main`:
- `scope_class: scope:adjacent`, `dna: null`, `brief_part: null`, nessuna relazione, nessuna claim
  propria, 2 provisions, 1 regola di applicabilità (`ap-eidas2-01`);
- `milestones` contiene solo due scadenze di adempimento: nessun evento di entrata in vigore;
- `eidas2` è nel backlog congelato di M-07 (`STATUS_BASIS_BACKLOG`), non in quello di M-04.

Rimisura tutto questo prima di porre le domande: può essere cambiato.

1. **Il cancello della pagina.** Promosso a `scope:core`, `eidas2` diventa `covered` e M-05 richiede
   una pagina. Il cancello di `js/routes.js` ha sette criteri; oggi `eidas2` non soddisfa
   `explanation` (nessun `dna.objective`) né `context` (nessun `brief_part`, nessuna relazione).
   - `dna.objective` è testo dell'autore: proponi una bozza, letta sul testo, e attendi.
   - Per `context` porta all'autore le strade possibili, ciascuna con la fonte che la regge: una
     relazione verso un record che esiste già, letta nel testo; oppure un `brief_part`, se il brief lo
     analizza in una Parte. Non creare un record nuovo per dare un arco a `eidas2`: l'arco verso
     l'EHDS del design (§6.1) presuppone la voce 2.4.
   - Se nessuna strada regge, la promozione non si fa e lo dici. Non indebolire il cancello.
2. **Che cosa entra nella pagina.** Un record coperto si presenta come gli undici core. Elenca i campi
   che la pagina mostra e quali sono vuoti per `eidas2`; per ciascuno, chiedi se va letto ora o
   lasciato dichiaratamente vuoto.

### A.1 · La revisione

Presenta all'autore, in un solo blocco, la proposta di promozione:
- `scope_decision` (`included`, criterio `crit:object-infrastructure` + `crit:horizontal`, come il
  design §5), con la `reason` in bozza;
- `status_basis` (articolo di entrata in vigore e metadati dell'Ufficio delle pubblicazioni);
- l'evento di entrata in vigore, se lo si aggiunge;
- `dna.objective` e ogni altro campo deciso in A.0.

L'autore approva, corregge o rifiuta. Registra ogni approvazione in roadmap §8, con le parole
dell'autore. Solo allora `approved_on` prende la data (M-04). Ciò che non è approvato non entra.

### A.2 · Prima di scrivere: leggere le fonti

- Rileggi in questa sessione ogni fatto, compresi quelli già nel record: la `status_note` dice che lo
  stato fu riletto il 14 ottobre 2026 e il resto il 27 settembre.
  - Cellar per CELEX (32024R1183; i regolamenti di esecuzione 2024/2977 e 2024/2981, già fonti del
    record), perché EUR-Lex restituisce pagine vuote a questo ambiente;
  - i metadati SPARQL dell'Ufficio delle pubblicazioni.
- Un fatto che oggi non riesci a riconfermare non entra in `data/`. Resta `null`, con una nota.
- I record di `data/sources.json` nascono solo da documenti recuperati e letti
  (`tools/source-contract.mjs`). Le fonti esistenti `src-eurlex-*` hanno URL EUR-Lex: se le rileggi via
  Cellar, la nota lo dice.

### A.3 · Scrivere

- Una sola sede per fatto. Le date stanno in `timeline.json`, mai sullo strumento. Titoli e nomi in
  uso stanno in `tools/seo.mjs` e `js/routes.js KNOWN_AS`, mai in `data/` per far leggere meglio una
  pagina.
- Taxonomy: si aggiungono termini e non se ne rinomina nessuno.
- I controlli della voce 2.1 devono restare a 0 errori: M-04 (`eidas2` diventa core dopo il
  25 ottobre 2026, quindi la decisione è obbligatoria), M-05 (la pagina), M-07 (se scrivi
  `status_basis`, è tenuto alla regola piena). Se un controllo va esteso, è un controllo in più, con
  un test che lo fa fallire.
- Dopo ogni modifica a `data/`:
  - riesegui `node tools/_footer.mjs` e committa ciò che scrive (la nuova pagina `instruments/eidas2/`,
    la sitemap, la lista di `instruments.html`);
  - dichiara `superseded` o `pending_translation` ogni chiave di locale toccata.
- **Ogni commit che modifica un file pubblicato** (`data/`, le pagine, `i18n/`, `js/`, `css/`,
  `sitemap.xml`) porta una riga `Evidence: <fonte, record o controllo>`. `tools/commit-evidence.mjs` lo
  verifica in CI e nel deploy.

### A.4 · Checkpoint della Parte A — la sessione si ferma qui

- Rilancia `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`,
  `freshness --as-of <oggi>`, `seo-audit`, tutte le 25 suite e la suite browser (con
  `BROWSER_QA_CHROME`, se Chromium non è nel PATH), il gate avversariale.
- Apri la pagina nuova in un browser e verifica che non dica nulla che i record non reggono.
- Consegna un rapporto con: ogni fatto letto o lasciato `null`; ogni criterio di uscita di 2.2; ogni
  conteggio cambiato rispetto alla baseline (`docs/CURRENT-ARCHITECTURE.md` §12 e il rapporto di
  chiusura della sessione 4), con il motivo. Registralo in `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore. Si registra in roadmap §8.

## Parte B — tre interventi aperti dalla sessione 4, dopo il checkpoint A

### B.1 · Il testo superato di PP-09

- `agent/policy/verify/attacks.mjs` PP-09 dice che il sito pubblicato non è mai stato letto;
  `docs/DEPLOYMENT.md` §1 lo ha misurato il 27 settembre e il 23 ottobre 2026.
- Correggi il testo perché citi quelle misure datate. L'esito resta quello che le misure reggono: se
  proponi di cambiarlo, riporta il prima e il dopo, fermati e chiedi.
- `agent/policy/` è tra i percorsi mai automatici: la modifica va nominata nel rapporto.

### B.2 · L'URI di redirect OIDC e l'origine IPv6

- `.control-room/authn.mjs redirectUri()` costruisce l'URI da `cfg.port`: con `CONTROL_ROOM_PORT=0` e il
  provider OIDC è sbagliato, come lo era l'Origin prima di B.3 della sessione 4.
- Con `CONTROL_ROOM_HOST=::1` né l'origine di `server.mjs` né quella di `authn.mjs` ha le parentesi
  quadre (`http://::1:7802`), che nessun browser invia.
- Correggi entrambi con una sola sede per l'origine del server, senza allentare il controllo
  dell'Origin, il CSRF né la verifica dello `state` e del `nonce` OIDC.
- In `.control-room/selftest.mjs`, test accoppiati: l'origine giusta passa, una estranea resta
  rifiutata; il redirect URI con porta 0 porta la porta reale.

### B.3 · La migrazione delle relazioni esistenti

- Misurato il 27 ottobre 2026: delle 17 relazioni v1, 10 citano solo fonti di livello 1 o 2; 4
  poggiano solo su `src-brief-original`; 3 relazioni analitiche non hanno claim.
- Migra le 10 alla forma v2 (`{source_id, supports, locator}`), rileggendo ciascuna fonte in questa
  sessione. È lavoro rosso: una relazione la cui fonte non regge più ciò che il `summary` dice resta
  v1 e lo dici; non si corregge il `summary` senza l'autore.
- Le 4 e le 3 restano nel backlog. Il passaggio di `edge-v1-sources` ed `edge-analytical-no-claim` a
  ERROR resta rinviato, come deciso il 27 ottobre 2026: non farlo.
- Prima di scrivere, porta all'autore l'elenco delle 10 con il locator proposto per ciascuna, e
  attendi l'approvazione. Registrala in §8.

### Checkpoint della Parte B

Validatori, suite e gate rilanciati; ogni verdetto mosso riportato prima e dopo; rapporto in
`docs/HANDOVER.md`; approvazione dell'autore registrata in roadmap §8.

## Cosa NON fare in questa sessione

- Non implementare le voci 2.3–2.6: Cyber Solidarity Act, EHDS, Interoperable Europe Act, Digital
  Networks Act. Non creare record per loro, nemmeno per dare un arco a `eidas2`.
- Non pubblicare la mappa delle dipendenze né la sua vista.
- Non implementare D2 (trigger v2) né D3 (etichette) oltre a ciò che la voce 2.2 richiede in modo
  dimostrabile.
- Non correggere gli otto rilievi di `docs/V2-DATA-DESIGN.md` §7, né il limite di R-01 su P2B: sono
  della Fase 3.
- Non applicare la correzione `data-omnibus` rimasta in `docs/v2-design/register-watchlist.proposed.json`.
- Non aprire il capitolo finanza.
- Non introdurre Tier A/B/C, automazione, dipendenze runtime, richieste a terze parti, dashboard.
- Non dichiarare «sicurezza operativa dimostrata».
- Non scrivere in `data/` un fatto letto da un risultato di ricerca o dalla memoria del modello.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Criterio di uscita e consegna

La sessione è completa quando la Parte A è approvata e la Parte B è implementata e approvata, oppure
quando l'autore decide di fermarsi a un checkpoint.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (A.0–A.4, B.1–B.3) indica:
- cosa è stato modificato (file, funzioni, record, viste);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e se sì dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto. Alla fine chiedi all'autore se
aprire una pull request verso `main`, e registra nel registro dei branch di `docs/HANDOVER.md` che fine
fa il branch.
