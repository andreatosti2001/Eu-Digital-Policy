<!--
Provenance: the prompt of v2 Session 10, drafted at the end of v2 Session 9 (28 Oct 2026) on the
author's request ("Do it", after "Did you redact session 10's prompt?"), from the author's roadmap after
v2 Session 5 (docs/prompts/v2-session-6.md, "Session 10 — manutenzione frontend e pulizia dei
riferimenti pubblici") and the §8 rows of 28 Oct 2026 that close Session 9 and Phase 2. The decisions
live in those rows and nowhere else; this file is the instruction text that cites them. Written in
Italian, as the author's session prompts are. The author may change it before use.
-->

SESSION 10 — Manutenzione frontend e pulizia dei riferimenti pubblici (voci 10.1 e 10.2), per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Verifica tre cose:
- che `main` contenga la pull request #31 (sessione 9: voce 2.6, `digital-networks-act`, e la chiusura
  della Fase 2), cioè almeno `480a83c`;
- che `docs/ROADMAP-v2.md` §8 abbia le righe del 28 ottobre 2026 della sessione 9, fino a «The
  checkpoint of v2 Session 9 = item 2.6»;
- che `docs/prompts/v2-session-6.md` (la roadmap dell'autore) e `docs/prompts/v2-session-9.md` siano in
  `main`.

Se una delle tre manca in `main`, fermati e segnalalo.

La roadmap dell'autore è un piano, non un'autorizzazione (§8, «The scope of v2 Session 6»). **Come prima
scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 10» con le parole con cui
l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo
strumento di domande. Senza quella riga non si modifica nulla di pubblicato.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso, se nel frattempo non è cambiato nulla:
- `origin/scout/digest-digest-2026-10-26T13-10-32Z` (già nel registro);
- `origin/claude/new-session-o9uopd` e `origin/claude/v2-session-8-findings`, il cui contenuto è in `main`
  con la #31 (registro della sessione 9);
- `origin/claude/v2-session-10-prompt`, che porta questo prompt e la sua riga di registro. Se non è in
  `main`, proponi all'autore di unirlo nel branch di sessione, come nella sessione 9 con `c756f0f`.

Crea un branch di sessione (`claude/v2-session-10-frontend` o quello assegnato dall'ambiente). Non
lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, contratto tra sessioni. In particolare «Cosa NON fare» (nessuna nuova dashboard,
   nessun redesign, nessuna Tier A/B/C).
2. `docs/prompts/v2-session-6.md`: §1 (regole per ogni sessione), «Session 10» per intero, compreso
   «Checkpoint Session 10», §3 (i finding della sessione 5 da non trasformare in correzioni silenziose),
   §4 (Evidence Navigator) e §5 (nessun redesign prima della fine degli item attivi).
3. `docs/ROADMAP-v2.md` §8, tutte le righe, in particolare quelle delle sessioni 5–9 che lasciano aperti
   «the internal references shown to a reader» (finding (g), voce 10.2).
4. `docs/HANDOVER.md`: i rapporti «v2 Session 9 — checkpoint report (item 2.6, …)», «v2 Session 8, part
   2» e «v2 Session 5 — Part A checkpoint report (item 2.2)» (dove il finding nasce).
5. `docs/AI-SAFE-BOUNDARIES.md` §0–§3, `docs/DATA-GOVERNANCE.md` (una sede per fatto; gli stati),
   `docs/DEPLOYMENT.md` (la CSP: nessuno stile o script inline nuovo), `docs/BROWSER-QA.md`,
   `docs/UX-AUDIT.md` §7.
6. Il codice che tocchi: `css/tokens.css`, `style.css`, `css/tools.css`, `css/evidence.css`;
   `js/interactions.js` (`ix-kindnote`), `js/instrument-view.js`, `js/status.js`, `js/evidence-view.js`,
   `js/bibliography.js`, `js/search.js` (solo per leggerlo: vedi «Cosa NON fare»), `tools/seo.mjs`,
   `tools/_footer.mjs`, `tools/design-qa.mjs`, `tools/csp.mjs`, `tools/prose-homes.mjs`,
   `agent/browser/checks.mjs`, e i test di `tools/selftest.mjs` che leggono le pagine generate (S1, W16,
   W17).

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e
attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**Solo le voci 10.1 e 10.2**, poi checkpoint. La sessione si ferma al checkpoint; non avviare la
sessione 11, la Fase 3 né il post-v2.

Questa è una sessione di presentazione, non di diritto. **Non si cambia il significato di nessun dato**:
nessuno stato, data, relazione, claim, fonte o giudizio legale cambia contenuto. Dove un testo che il
lettore vede non può essere ripulito senza toccare un giudizio, ci si ferma e si chiede.

## Lo stato di partenza

Misurato il 28 ottobre 2026 sul branch della sessione 9 (`480a83c`). **Rimisura tutto prima di porre
le domande**: le misure qui sotto sono una ricognizione rapida, non l'inventario che 10.2 richiede.

**10.1 — scrollbar.** Nei fogli di stile, oggi:
- nascoste: `.spine` (`style.css:147`), `.chrome-nav` (`css/tokens.css:202–203`), `.subnav`
  (`css/tokens.css:259–265`), `.tool-top > nav` e `.bib-top > nav` (`css/tools.css:641–647`);
- sottili: `.tbl-scroll`, `.dna-wrap` (`css/tools.css:706`);
- nessun'altra regola sulle scrollbar; `js/calendar.js` nomina «scrollbar», da leggere.

Per ciascuna superficie nascosta, verifica se c'è oggi un altro segnale che il contenuto continua fuori
dalla viewport (sfumatura, freccia, contenuto tagliato). La roadmap vieta di nasconderle per sola
estetica nelle strisce orizzontali senza un segnale.

**10.2 — riferimenti interni visibili.** Nel testo visibile delle pagine statiche generate (script
esclusi):
- `docs/V2-DATA-DESIGN.md §1.4`: 26 occorrenze, dalla nota del tipo di relazione (`rel-kind:enables`,
  `rel-kind:defers-to`, `data/taxonomy.json`) che `js/interactions.js` stampa come `ix-kindnote`. Sono
  sulle pagine di AI Act, CRA, CSA, Data Act, DNA, DORA, DSA, EHDS, eIDAS2, GDPR, IEA e NIS2;
- `docs/AUDIT-2026-10-14.md §1 F`: una occorrenza sulla pagina della CRA;
- identificativi `clm-*`: 5 sulla pagina della Data Omnibus (la sua `status_note`), 2 su quella di
  eIDAS2 (la sua `status_note`, il caso della sessione 5);
- i quattro `docs/application/pdf/…` in `bibliography.html` sono URL della Corte, non riferimenti
  interni.

Nei campi dei dati che un renderer può mostrare (`status_note`, `summary`, `note`, `reason`,
`verification_note`, le note della tassonomia):
- `clm-*` in 59 `verification_note` di `claims.json` e in 10 `status_note` di `instruments.json`;
- `item 2.x`, `v2 Session 5`, `D-7`, `F-1`, `F-2`, `docs/V2-DATA-DESIGN.md` e hash di commit
  (`282a782`, `1895845`) in note di `instruments.json`, `sources.json`, `taxonomy.json`,
  `timeline.json`, `applicability.json` ed `enforcement.json`;
- **la sessione 9 ne ha aggiunti** («for item 2.6», «Added … for item 2.6 on the author's decision») in
  due note di fonte, una nota di tassonomia e le `verification_note` dei tre archi, sul modello delle
  voci 2.2–2.5.

Quale di questi campi sia davvero mostrato, dove (pagina generata, `instrument.html`, il pannello delle
evidenze, la bibliografia, la ricerca, i metadati SEO, le card OG) e a quale larghezza, **non è stato
misurato**: è il primo lavoro di 10.2. Un campo che nessun renderer mostra non è un riferimento
pubblico, anche se GitHub lo espone (la roadmap: il repository resta pubblico).

**La baseline di chiusura della sessione 9** (da ricontrollare, non da copiare):
- `validate` 0/0 con 45 non verificati; `i18n-audit`, `design-qa`, `seo-audit` 0/0;
- `evidence-audit --as-of 2026-10-28`: 0 errori, 11 warning, REGISTER «covered 16 · mapped 12 ·
  watched 5 · excluded 6»;
- `freshness`: 0 difetti, 3 richieste al 28/10 (è il calendario);
- 25 suite: 1313 pass + 1 saltato (`::1`); browser 343 · 0 · 1 indecidibile (`a11y:bound`); gate
  avversariale 65 · 0 · 3 · 1;
- 17 pagine strumento e 26 route indicizzabili; 39 strumenti, 40 relazioni, 225 fonti, 101 eventi,
  312 termini.

## Lezioni delle sessioni 8 e 9 (da `docs/HANDOVER.md`; non ripeterle)

- **I testi che il lettore vede si approvano parola per parola prima di scriverli.** Ogni riscrittura
  di 10.2 va nella domanda con il prima e il dopo esatti.
- **Un difetto che il lavoro espone si porta all'autore, non si corregge in silenzio, e non si lascia
  in silenzio.** Nella sessione 9 la nuova pagina ha esposto due difetti (`actNumber()`, `tierWord()`):
  sono stati chiesti, poi corretti alla radice con un test. Vale anche per ciò che 10.2 trova.
- **Un cambio di testo può rendere falsa la premessa di un test.** Prima di riscrivere una nota, cerca i
  test e i controlli che la leggono (selftest, suite browser, `tools/prose-homes.mjs`, `design-qa`). Si
  cambia la piantatura, non si toglie un'asserzione; si misura che il test fallisce con il controllo
  disattivato, e lo si dichiara.
- **La suite browser verifica l'avviso «not covered» cercando che non contenga alcun `<section>`**
  (`checkNotCovered`): qualunque blocco aggiunto lì è un `<div>`.
- **Branch e merge.** Non pushare su un branch dopo aver chiesto il merge della sua PR. Una PR impilata
  su un'altra va unita dopo, con «Create a merge commit».
- **Riavvii del worker.** I job in background muoiono quando il worker si riavvia: salva gli output su
  file e ricontrollali. Non usare `pkill -f` con una stringa che compare nella tua stessa riga di
  comando.
- **Le lezioni della sessione 7 valgono ancora**: nessun output di agenti in `agent/records/`; si
  correggono alla radice i controlli che un cambiamento espone; si diffano solo i record toccati
  (`timeline.json` è indentato di uno spazio, `sources.json` ha escape misti, e i file dei dati non
  sempre finiscono con un a capo: conservalo).

## 10.0 · Domande da porre all'autore prima di modificare qualsiasi cosa di pubblicato

Prima fai la ricognizione (10.1 e 10.2, sotto). Poi porta all'autore, **una domanda per volta tramite lo
strumento di domande**, con la raccomandazione in prima posizione e la motivazione nella domanda stessa.
Non meno di queste:

1. **Le scrollbar, superficie per superficie.** Per ciascuna delle superfici nascoste o personalizzate:
   cosa scorre, se c'è un segnale di continuità, e la proposta (mostrarla con i token esistenti,
   lasciarla nascosta con un segnale visibile, o lasciarla com'è con il motivo). Nomina i token che
   useresti (track, thumb, hover, tema chiaro e scuro) e dove sono definiti; nessuna palette nuova.
2. **La regola di 10.2.** Cosa conta come riferimento interno (percorsi `docs/`, `clm-*`, hash di
   commit, codici di decisione o di finding, «item 2.x», «Session N») e cosa no (gli URL pubblici
   delle fonti, i link intenzionali al repository per trasparenza). Proponi la regola e il controllo
   che la terrà (vedi 10.3), con il perimetro: quali renderer e quali campi.
3. **La nota del tipo di relazione** (`enables`, `defers-to`, le 26 occorrenze): proponi il testo che il
   lettore vede, parola per parola, e dove resta la provenienza (per esempio nella nota della tassonomia,
   non stampata, o in un campo separato che il renderer non mostra). La definizione del tipo non cambia.
4. **Le `status_note` con `clm-*`** (eIDAS2, Data Omnibus e ogni altra trovata): per ciascuna, il prima
   e il dopo esatti. **La `status_note` della Data Omnibus è anche un finding aperto della sessione 8**
   (da riverificare sull'esito del Coreper del 21 ottobre 2026): questa sessione ne rimuove solo gli
   identificativi, senza toccarne i fatti, salvo una richiesta nuova dell'autore. Dove togliere
   l'identificativo lascerebbe un'affermazione senza la sua prova visibile, proponi come rendere la
   prova (la fonte primaria, se esiste) invece di toglierla.
5. **Gli altri testi trovati** (la pagina della CRA, le note delle fonti nella bibliografia, le
   `verification_note` mostrate, i metadati SEO, le card OG): raggruppali per renderer e proponi, per
   ciascun gruppo, se ripulire il testo, nasconderne il campo dal renderer o lasciarlo com'è, con il
   motivo. Le note scritte dalla sessione 9 («item 2.6») vanno trattate come le altre.
6. **Le chiavi di locale**: per ogni stringa toccata, se esiste una chiave in `i18n/` e se dichiararla
   `superseded` o `pending_translation`.

Registra ogni risposta in §8 con le parole dell'autore. Ciò che non è approvato non entra.

## 10.1 · Scrollbar coerenti con il design corrente

Vale per intero il testo della roadmap (`docs/prompts/v2-session-6.md`, «10.1»). In più:
- personalizza solo dove il browser lo supporta (`scrollbar-width`, `scrollbar-color`, e
  `::-webkit-scrollbar` dove serve); nessuna scrollbar costruita in JavaScript;
- nessuno stile inline, nessuno script inline, nessuna eccezione alla CSP (`tools/csp.mjs`);
- verifica tastiera, touch (per quanto un browser headless lo consente: dichiaralo), 390px e desktop,
  zoom al 200%, contrasto del thumb sul track in entrambi i temi, `prefers-reduced-motion`;
- `design-qa` deve restare 0/0; se un controllo di `design-qa` va esteso per tenere la regola, è un
  controllo in più, con un test che lo fa fallire.

## 10.2 · Riferimenti interni nell'interfaccia pubblica

Vale per intero il testo della roadmap («10.2»). In più:
- **Prima l'inventario, poi le modifiche**: per ogni occorrenza, il file o record d'origine, il campo, il
  renderer che lo mostra, le pagine e le larghezze. Cerca nelle pagine generate, in `instrument.html`
  con un id, nel pannello delle evidenze, nella bibliografia, nella ricerca (i risultati, non il
  codice), nei metadati SEO e JSON-LD, nelle card OG (`img/og/manifest.json` dice da quali input sono
  fatte) e nelle edizioni `it/`, `fr/`, `es/`.
- **Si ripulisce la presentazione, non la tracciabilità**: un riferimento che serve a un controllo resta
  nella struttura canonica (per esempio `claims`, `sources`, un campo di provenienza) e smette solo di
  essere stampato come testo editoriale.
- **Nessun fatto cambia**: una riscrittura che alteri una data, uno stato, una fonte o un giudizio non è
  10.2. Fermati e chiedi.
- Le pagine generate si rigenerano con `node tools/_footer.mjs`, mai a mano; un secondo `_footer` deve
  scrivere 0 file. Se una card OG cambia, `node tools/og-image.mjs` (serve `BROWSER_QA_CHROME`), poi
  ripristina le card i cui input non sono cambiati e controlla con `--check`.

## 10.3 · Scrivere e verificare

- Aggiungi in `tools/selftest.mjs` un test che tenga la regola di 10.2 sui renderer approvati: nessun
  riferimento interno nel testo visibile delle pagine generate. Deve piantare una nota con
  `docs/…`, una con `clm-…` e una con un hash, e verificare che ciascuna fallisca; dimostra che
  fallisce se il controllo che lo regge viene disattivato. Se la regola diventa un controllo di
  `design-qa` o `seo-audit`, vale lo stesso.
- I controlli devono restare a 0 errori. Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o
  limiti di pubblicazione.
- **Ogni commit che modifica un file pubblicato** porta una riga `Evidence: <fonte, record o
  controllo>`; `tools/commit-evidence.mjs origin/main HEAD` deve dare 0 commit senza evidenza.
- Leggi il `git diff` completo prima di ogni commit.

## 10.4 · Checkpoint — la sessione si ferma qui

- Confronta prima/dopo **per ogni stringa individuata** (una tabella nel rapporto).
- Rilancia:
  - `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`,
    `seo-audit`;
  - le 25 suite (con `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, o il
    percorso dell'ambiente), e la suite browser con `--require-browser`;
  - il gate avversariale, `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`,
    `tools/og-image.mjs --check`, `tools/commit-evidence.mjs`.

  Prima dell'ultima corsa delle suite, verifica che `agent/records/` sia vuoto di ciò che hai prodotto.
- Verifica a mano, in un browser, scrollbar e testi su desktop e a 390px, in entrambi i temi: almeno la
  home, `instruments.html`, la bibliografia, una pagina con molte interazioni (GDPR o DSA), la pagina
  della DNA e quella di eIDAS2. **Dichiara cosa non hai potuto verificare** (browser diversi da
  Chromium, dispositivi touch reali, screen reader, pixel).
- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 9. Contiene:
  - le decisioni dell'autore e cosa è stato scritto (commit);
  - i controlli modificati o aggiunti e perché;
  - l'inventario di 10.2 e la tabella prima/dopo;
  - i conteggi prima/dopo, con il motivo;
  - ciò che è stato visto nel browser e ciò che non è stato verificato;
  - i finding non corretti;
  - la checklist di verifica e come controllare a mano.
- Tieni visibili nel rapporto i finding ancora aperti:
  - sessione 9: il tipo d'arco al presente («Amends», «Defers to») per una proposta; la modalità derivata
    dal nodo `from` (`docs/V2-DATA-DESIGN.md` §1.4) e i quattro archi `enables` candidati; gli atti che
    la DNA abrogherebbe o modificherebbe non modellati; «member State» nelle descrizioni generate; il
    `.”.` delle fonti senza data; la data di verifica che va a capo con il punto e virgola; nessun tipo
    di evento per una tappa procedurale;
  - sessione 8: il colore del link «Read it at the source» nell'avviso, in tema scuro; il `<title>`
    della pagina EHDS («EHDS — …»); la `status_note` di `data-omnibus` da riverificare sull'esito del
    Coreper del 21 ottobre 2026; `nis2 → eidas` non modellato;
  - ancora aperti: `src-ec-ai-omnibus-in-force` (403); il test `::1`; le 8 relazioni v1 e il flip
    `edge-v1-sources`; R-01 e gli otto rilievi del design §7 (Fase 3); i finding della sessione 5
    elencati nella roadmap, §3.

  Alcuni finding della sessione 9 sono di presentazione e sembrano vicini a 10.1–10.2 (la data che va a
  capo, «member State», il `.”.`, il colore del link). **Non entrano da soli**: proponili all'autore come
  domanda separata, con il prima e il dopo, e correggili solo su sua decisione.
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore; si registra in §8. Poi chiedi se aprire una pull request
  verso `main` e registra la sorte del branch nel registro di `docs/HANDOVER.md`. **Non pushare sul
  branch dopo aver chiesto il merge.**

## Cosa NON fare in questa sessione

- Non cambiare il significato di nessun dato: stati, date, relazioni, claim, fonti, giudizi.
- Non correggere i finding aperti elencati sopra senza una decisione dell'autore, nemmeno quelli di
  presentazione.
- Non toccare la `status_note` di `data-omnibus` oltre agli identificativi, senza una domanda
  all'autore.
- Non eliminare la provenienza dalle strutture canoniche che servono ai controlli.
- Non nascondere globalmente le scrollbar; non costruirne una in JavaScript; non introdurre dipendenze
  runtime, stili o script inline, eccezioni CSP.
- Non modificare il modello dei dati, il brief o il layout complessivo; nessun redesign, nessuna
  dashboard.
- Non implementare né preparare l'Evidence Navigator (roadmap §4), né toccare `js/search.js` per esso.
  Se la ricerca mostra un riferimento interno, la correzione sta nel dato o nel renderer che lo produce,
  ed è una domanda all'autore.
- Non avviare la Fase 3, la sessione 11 o il post-v2.
- Non dichiarare «sicurezza operativa dimostrata». Non trasformare uno skip in un pass.
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Criterio di uscita e consegna

La sessione è completa in uno di due casi: le voci 10.1 e 10.2 sono implementate e il checkpoint è
approvato dall'autore; oppure l'autore decide di fermarsi.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (10.0–10.4) indica:
- cosa è stato modificato (file, record, viste);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
