<!--
Provenance: the prompt of v2 Session 12, drafted at the end of v2 Session 11 (28 Oct 2026) on the
author's request ("Inizierei la fase 3"; then "Scrivi il prompt della S12 (Recommended)"), from
docs/ROADMAP-v2.md §4 (Phase 3) and §8 as it stands after the rows "The closing gate of v2" and "The
checkpoint of v2 Session 11", from docs/V2-CLOSURE.md and from docs/V2-DATA-DESIGN.md §1.4, §2 and §4.
The decisions live in those rows and nowhere else; this file is the instruction text that cites them.
Written in Italian, as the author's session prompts are. The author may change it before use.
-->

SESSION 12 — Apertura della Fase 3 («what applies», base): V2C-01, poi l'estensione del controllo alle regole di applicabilità, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Verifica che `main`
contenga:
- la pull request #35 (sessione 11, il gate di chiusura): `docs/V2-CLOSURE.md` esiste e
  `docs/ROADMAP-v2.md` §8 ha le righe «The closing gate of v2» e «The checkpoint of v2 Session 11»;
- la pull request #36 (sessione 11.5, l'audit P0 del 28 ottobre 2026): `docs/AUDIT-2026-10-28.md`
  esiste.

Se una delle due manca in `main`, fermati e segnalalo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 12» con le
parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo
con lo strumento di domande. Senza quella riga non si scrive nulla, nemmeno in `docs/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso, se nel frattempo non è cambiato nulla:
- `origin/scout/digest-digest-2026-10-26T13-10-32Z` e `origin/claude/v2-session-8-findings` (già nel
  registro);
- `origin/claude/v2-session-12-prompt`, che porta questo prompt e la sua riga di registro. Se non è in
  `main`, proponi all'autore di unirlo nel branch di sessione.

Crea un branch di sessione (`claude/v2-session-12-phase-3-open` o quello assegnato dall'ambiente). Non
lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`: i cinque principi, «Cosa NON fare» (in particolare «Non pubblicare "what applies
   to me" prima che i trigger siano verificati con lo stesso rigore delle claim»), «Decisioni già prese».
2. `docs/ROADMAP-v2.md`: §1, §3 (D-2, D-3, D-6), §4 Fase 3 per intero, e tutte le righe di §8, in
   particolare «The closing gate of v2» (punti 1, 3a, 3b, 3c) e il checkpoint della sessione 11.
3. `docs/V2-CLOSURE.md`: §1.5 (la condizione d'ingresso misurata) e §2.1, le righe V2C-01, V2C-02,
   V2C-06…V2C-10, V2C-12, V2C-13 e V2C-16.
4. `docs/V2-DATA-DESIGN.md`: §1.4 (la modalità derivata), §2 (i trigger, T-01…T-11), §4 (l'estensione di
   `tools/evidence-audit.mjs`: architettura, severità BACKLOG, integrazione, flip) e §7.
5. `docs/v2-design/applicability-rule.schema.json`, `docs/v2-design/applicability-examples.json`,
   `docs/v2-design/map.schema.json` (`x-derived`).
6. `docs/HANDOVER.md`: i rapporti della sessione 11 e della sessione 11.5; `docs/AUDIT-2026-10-28.md`.
7. Il codice che toccherai: `js/interactions.js`, `js/instrument-view.js` (la lista «Related»),
   `js/applies.js`, `tools/evidence-audit.mjs`, `tools/register-audit.mjs`, `tools/selftest.mjs`, e il
   `$description`/`$note` di `data/applicability.json` e di `data/instruments.json`.

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e
attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

Le due prime voci della Fase 3, **nell'ordine deciso dall'autore** (§8, «The closing gate of v2», 3c):
**12.1 V2C-01, poi 12.2 l'estensione del controllo.** Poi checkpoint. **Nessuna regola si aggiunge e
nessuna regola esistente si corregge in questa sessione**: le 33 regole e i rilievi F-4…F-8 si
correggono nelle sessioni successive, contro le fonti primarie, dopo che il controllo li legge.

## Lo stato di partenza

Misurato il 28 ottobre 2026. **Rimisura tutto**: sono valori da ricontrollare, non da copiare.
- `data/applicability.json`: 33 regole; 0 con un riferimento a fonte che porti `supports` e locator
  (tutti ID nudi); 0 dei 101 valori di condizione che si risolvono a un ID di provvedimento (le
  condizioni sono termini di tassonomia); i 77 `obligations` si risolvono tutti.
- `tools/evidence-audit.mjs` carica e calcola l'hash di `applicability.json` ma non controlla nessuna
  regola; `tools/evidence-audit-record.mjs` LIMITS lo dice.
- Gli archi da una proposta: 8 (`from` con `status:proposal`), resi al presente nelle schede delle
  interazioni («Digital Networks Act Amends ePrivacy», «Data Omnibus Repeals P2B Regulation») e nella
  lista «Related» («ePrivacy / Amends», senza qualifica). 7 dei 8 `summary` cominciano con «Proposed».
- La baseline dopo la sessione 11.5 (dal suo rapporto, da rimisurare): `validate` 0/0, 45 non
  verificati; `i18n-audit`, `design-qa`, `seo-audit` 0/0; `evidence-audit` 0 errori; `freshness` 0
  difetti; `tools/selftest.mjs` 111 test; suite browser 343 · 0 · 1; gate avversariale 65 · 0 · 3 · 1;
  prontezza di produzione che rifiuta (17 di 20).
- **Un rilievo che la sessione 11 non ha inventariato**, da portare all'autore e non da correggere in
  silenzio: `docs/V2-DATA-DESIGN.md` §4.3 prevede il flip di `scope-decision-missing` e
  `status-basis-missing` da BACKLOG a ERROR «at the end of item 2.6». La voce 2.6 è chiusa; il 28
  ottobre `evidence-audit` riportava ancora `BACKLOG scope-decision-missing 11` e
  `BACKLOG status-basis-missing 23`. Non è un flip da fare in questa sessione: si misura, si riporta, si
  chiede.

## 12.0 · Domande da porre all'autore, prima di toccare qualcosa di pubblicato

Prima una ricognizione in sola lettura di 12.1 e 12.2. Poi **una domanda per volta tramite lo strumento
di domande**, con la raccomandazione in prima posizione e la motivazione nella domanda stessa. Almeno:

1. **La regola della modalità.** `docs/V2-DATA-DESIGN.md` §1.4 deriva `modality` dallo stato del nodo
   `from`. La sessione 9 (V2C-16) ha mostrato che questa regola leggerebbe come «law» un arco `enables`
   da un atto in vigore verso una proposta (da `eidas`, `nis2`, `gdpr`, `iea` verso il DNA). Proporre la
   regola che si fonda su dove sta il locator di ciascun tipo di arco (§1.4: `enables` nel testo
   dipendente, `defers-to` in quello che rinvia, `amends` e `repeals` in quello che modifica), oppure
   un'altra, con la tabella dei 40 archi e la modalità che ne risulta per ciascuno. È una revisione di
   una decisione di design: si chiede, non si applica.
2. **Le parole che il lettore vede** per un arco proposto: la scheda delle interazioni (per ogni tipo
   d'arco presente nei dati), la lista «Related», ed eventuali altri punti in cui il tipo d'arco è
   stampato (cercali tutti: pagine generate, `instrument.html?id=`, il confronto, la ricerca, le edizioni
   it/fr/es). Parola per parola, prima e dopo, per gruppo. Le chiavi di locale interessate vanno
   dichiarate `superseded` o `pending_translation`.
3. **Dove vive la derivazione.** Il design (§4.1) prevede `js/map-model.js` con `modality(r, ix)`, letto
   dalla pagina e dall'audit. Proporre di crearlo ora con la sola funzione che 12.1 usa, oppure di
   tenerla in un modulo esistente; una sola casa in ogni caso.
4. **Il perimetro di 12.2.** Le regole T-01…T-11 di §2 nell'audit, con la severità BACKLOG di §4.1, e
   una sezione TRIGGERS nel rapporto (anche in `--json` e `--markdown`). Chiedere se in questa sessione
   entrano anche i controlli della mappa M-08…M-15 (V2C-13) o se restano a una sessione successiva della
   Fase 3. Raccomandazione da fondare sulla ricognizione, non su questo prompt.
5. **Le severità**, regola per regola, con il conteggio misurato oggi per ciascuna: quali ERROR
   (devono dare 0 sull'albero attuale, altrimenti non si introducono come ERROR senza chiedere), quali
   BACKLOG, quali WARNING. Nessuna regola introdotta in modo che l'albero attuale diventi rosso.
6. **Il flip non fatto** di `scope-decision-missing` e `status-basis-missing` (sopra): lasciarlo,
   assegnarlo, o deciderne il momento.

Registra ogni risposta in §8 con le parole dell'autore. Ciò che non è approvato non entra.

## 12.1 · V2C-01: un arco da una proposta non si legge come diritto

- Si deriva, non si memorizza: nessun campo `modality` in `data/`. Un dato cambiato in `data/` in questa
  voce è un errore.
- Si cambia solo la presentazione del tipo d'arco, nelle parole approvate in 12.0; i `summary` non si
  toccano.
- Un test nuovo in `tools/selftest.mjs` fissa la regola: nessun arco la cui modalità derivata è
  «proposed» viene reso con il tipo al presente in nessuna pagina (statica, generata, `instrument.html`);
  con un fallimento piantato che lo dimostra (la regola spenta → il test fallisce).
- `node tools/_footer.mjs` rilanciato; una seconda esecuzione scrive 0 file.
- Aperto nel browser: le pagine del DNA, del Data Omnibus, di ePrivacy, del GDPR, della P2B
  (`instrument.html?id=p2b`), nei due temi, a 1280px e 390px.

## 12.2 · Il controllo legge le regole

- `tools/evidence-audit.mjs` legge `data/applicability.json` e riporta le regole come riporta le claim,
  con le regole approvate in 12.0. La logica in un modulo puro letto dall'audit (§4.1), che riceve
  `asOf` come argomento e non legge l'orologio.
- **Il codice d'uscita non cambia significato**: exit 1 solo su un ERROR, cioè un difetto dell'albero
  vero a ogni data. BACKLOG non lo imposta mai.
- Una prova piantata per ogni regola ERROR in `tools/selftest.mjs` (§4.3: «a check that cannot be shown
  to fire is a check on nothing»), e il conteggio BACKLOG atteso fissato in modo che possa solo
  scendere.
- `tools/evidence-audit-record.mjs` LIMITS aggiornato: la frase «It reports nothing about
  data/applicability.json» diventa falsa e va corretta, nelle parole che l'autore approva.
- `applies.html` e la sua nota (D-2) non cambiano. Nessuna regola cambia.

## 12.3 · Scrivere e verificare

- Ogni commit che tocca un file pubblicato porta la riga `Evidence:`; `tools/commit-evidence.mjs
  origin/main HEAD` deve dare 0 commit senza evidenza.
- Rilancia tutto, prima e dopo, e salva gli output su file: `validate`, `i18n-audit`, `design-qa`,
  `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`; le 25 suite (con
  `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, o il percorso dell'ambiente)
  e la suite browser con `--require-browser`; il gate avversariale, `agent/schemas/cli.mjs check`,
  `.control-room/cli.mjs boundary` e `routes`, `tools/og-image.mjs --check`,
  `agent/production/cli.mjs readiness`.
- Se una suite fallisce per una premessa cambiata (un conteggio, un elenco), si dice quale e perché, e
  si chiede prima di cambiare un'asserzione.
- Non scrivere file mentre la suite browser gira: tratta un albero cambiato come sospetto e il risultato
  non vale (sessione 11).
- Leggi il `git diff` completo prima di ogni commit.

## 12.4 · Checkpoint — la sessione si ferma qui

- Il rapporto in `docs/HANDOVER.md`, sul modello di quelli delle sessioni 10 e 11: decisioni
  dell'autore e commit; prima/dopo di ogni testo cambiato; il rapporto TRIGGERS di oggi con i conteggi
  per regola; i conteggi prima/dopo con il motivo di ogni movimento; ciò che non è stato verificato e
  perché; i rilievi trovati; la checklist di verifica (12.0–12.4) e come controllare a mano.
- `docs/V2-CLOSURE.md`: la riga di V2C-01 indica il commit che la chiude (classe A → chiusa) solo dopo
  l'approvazione dell'autore; nessun'altra riga si cambia.
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore; si registra in §8. Poi chiedi se aprire una pull request
  verso `main` e registra la sorte del branch nel registro. **Non pushare sul branch dopo aver chiesto
  il merge.**

## Cosa NON fare in questa sessione

- Non aggiungere, togliere o correggere regole di applicabilità, né le loro fonti, né F-4…F-8: si
  correggono dopo che il controllo le legge, ciascuna contro il suo Articolo, in una sessione successiva.
- Non scrivere `modality`, `publishable`, `verification_state` o un'altra proprietà derivata in `data/`.
- Non fare il flip di `edge-v1-sources`, `edge-analytical-no-claim`, `scope-decision-missing`,
  `status-basis-missing` né di un BACKLOG nuovo senza la decisione dell'autore.
- Non pubblicare la vista della mappa; non implementare le etichette di stato (D-3) né la derivazione
  che sostituisce `stratum`: sono della Fase 3, ma non di questa sessione.
- Non toccare `applies.html` né la sua nota; non ritirare la pagina.
- Non avviare la Fase 4, il capitolo finanza, il post-v2, né la sessione 13.
- Non dichiarare la v2 conclusa; non dichiarare «sicurezza operativa dimostrata».
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione.
- Non toccare la licenza né il testo di non affiliazione o di assenza di consulenza legale; non scrivere
  nel README.
- Non implementare né preparare l'Evidence Navigator.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–11 (da `docs/HANDOVER.md`; non ripeterle)

- **I testi che il lettore vede si approvano parola per parola prima di scriverli.**
- **Un difetto che il lavoro espone si porta all'autore**: né corretto in silenzio, né lasciato in
  silenzio.
- **Ciò che si dice all'autore va misurato prima**, e un'affermazione imprecisa si corregge apertamente
  nel rapporto (la sessione 11 ne ha corrette sei dei rapporti precedenti).
- **La suite browser e i self-test trovano ciò che la lettura non trova.** Rilanciali prima di
  dichiarare un esito, e non scrivere file mentre girano.
- **Branch e merge.** Non pushare su un branch dopo aver chiesto il merge della sua PR. `main` può
  muoversi durante la sessione (la sessione 11.5 è entrata mentre la 11 si chiudeva): riscarica prima
  dell'ultima scrittura.
- **Riavvii del worker.** I job in background muoiono con il worker: salva gli output su file,
  ricontrollali, committa e pusha spesso. Non usare `pkill -f` con una stringa che compare nella tua
  stessa riga di comando.
- **Nessun output di agenti in `agent/records/`**; si diffano solo i record toccati.

## Criterio di uscita e consegna

La sessione è completa in uno di due casi: 12.1 e 12.2 sono scritti come l'autore li ha decisi, ogni
controllo rilanciato è a 0 errori, il checkpoint è approvato; oppure l'autore decide di fermarsi.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (12.0–12.4) indica:
- cosa è stato scritto (file, righe di §8, commit);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
