<!--
Provenance: the prompt of v2 Session 13, drafted at the end of v2 Session 12 (28–29 Oct 2026) on the
author's request ("draft session 13 and merge it"; then "farò un pull unico"), from docs/ROADMAP-v2.md §8
as it stands after the rows "The checkpoint of v2 Session 12" and "The plan for meeting Phase 3's entry
condition, and the maintenance of the rules", from docs/V2-CLOSURE.md (V2C-67) and from the v2 Session 12
report in docs/HANDOVER.md. The decisions live in those rows and nowhere else; this file is the
instruction text that cites them. Written in Italian, as the author's session prompts are. The author may
change it before use.
-->

SESSION 13 — Fase 3, prima sessione di lavoro sulle regole: V2C-67, il validatore impara la forma v2, pilota su due regole, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Verifica che `main`
contenga la sessione 12 e questo prompt:
- `js/map-model.js` e `tools/trigger-audit.mjs` esistono;
- `docs/ROADMAP-v2.md` §8 ha le righe «The checkpoint of v2 Session 12» e «The plan for meeting Phase 3's
  entry condition, and the maintenance of the rules»;
- `docs/prompts/v2-session-13.md` esiste.

Se manca qualcosa in `main`, fermati e segnalalo. (L'autore ha detto che unirà la sessione 12 e questo
prompt con un'unica pull request.)

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 13» con le
parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo
con lo strumento di domande. Senza quella riga non si scrive nulla, nemmeno in `docs/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso: `origin/scout/digest-digest-2026-10-26T13-10-32Z` e
`origin/claude/v2-session-8-findings` (già nel registro). Se `claude/v2-session-12-phase-3-open` o
`claude/v2-session-13-prompt` risultano non uniti, è la pull request unica non ancora unita: segnalalo.

Crea un branch di sessione (`claude/v2-session-13-rules-pilot` o quello assegnato dall'ambiente). Non
lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, in particolare «Non pubblicare "what applies to me" prima che i trigger siano
   verificati con lo stesso rigore delle claim».
2. `docs/ROADMAP-v2.md`: §4 Fase 3; in §8 tutte le righe della sessione 12 e la riga del piano
   (sessioni 13–17).
3. `docs/V2-CLOSURE.md`: V2C-67, V2C-02, V2C-06…V2C-10, V2C-66.
4. `docs/V2-DATA-DESIGN.md` §2 (T-01…T-11) e §7 (F-1…F-8); `docs/v2-design/applicability-rule.schema.json`
   e `docs/v2-design/applicability-examples.json`.
5. `docs/HANDOVER.md`: il rapporto della sessione 12 (il rapporto TRIGGERS, «Found, for the author»).
6. `docs/AUDIT-2026-10-28.md` F-1 (il mandato del Consiglio sul Data Omnibus, ST 14756/26).
7. Il codice e i dati che toccherai: `index.html` `part-9.p8` e le sue tre sovrapposizioni
   (`i18n/it.json`, `fr.json`, `es.json`), `i18n/locales.json`; `tools/selftest.mjs` P1 (`NO_MANDATE`) e
   X1–X4; `tools/validate.mjs` (la sezione delle regole di applicabilità); `tools/trigger-audit.mjs`
   (`RULES_V1`); il `$description` di `data/applicability.json`; in `data/instruments.json` le
   disposizioni di `eidas2` e `pld`; `data/sources.json` `src-eurlex-eidas2`, `src-eurlex-eudi-2024-2981`,
   `src-eurlex-pld`.

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e
attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

Tre voci, **in quest'ordine**, poi checkpoint:
- **13.1 V2C-67**: la frase di Parte IX sul mandato del Consiglio, falsa dal 21 ottobre 2026.
- **13.2 il validatore**: `tools/validate.mjs` accetta una regola nella forma v2, e la controlla.
  Nessuna regola cambia in questa voce.
- **13.3 il pilota**: `ap-eidas2-01` e `ap-pld-01` portate alla forma v2 contro i loro Articoli, fino a
  essere pubblicabili; il metodo fissato per le sessioni 14–17.

Le altre 31 regole e i rilievi F-4…F-8 **non** si toccano: appartengono alle sessioni 14–17 (§8, il piano).

## Lo stato di partenza

Misurato il 28 ottobre 2026 sull'albero della sessione 12. **Rimisura tutto.**
- `index.html` `part-9.p8`: «…But consolidation is contested from within: the Council has yet to agree a
  mandate on the Commission's own GDPR reforms, while the co-legislators used the AI Omnibus to add new
  prohibitions even as they delayed the high-risk tier. Simplification and expansion are happening in the
  same instrument.» Le tre edizioni dicono lo stesso («il Consiglio non ha ancora concordato un mandato…»,
  «le Conseil n'a toujours pas arrêté de mandat…», «el Consejo aún no ha acordado un mandato…»). Il record
  `data-omnibus` (COM(2025) 837, che modifica il GDPR) registra il mandato concordato dal Coreper il
  21 ottobre 2026 (ST 14756/26, `clm-data-omnibus-council-mandate`). La claim del paragrafo,
  `clm-consolidation-contested`, è un'interpretazione che poggia sul brief soltanto. I pattern di P1 non
  colgono questa formulazione.
- `node tools/evidence-audit.mjs --as-of <oggi>`: TRIGGERS 33 regole, pubblicabili 0; BACKLOG
  `rule-v1-sources` 33, `rule-scope-basis-missing` 33, `rule-condition-provisions-missing` 33,
  `rule-exemption-v1` 13, `rule-threshold-basis-missing` 3, `rule-dates-not-derived` 10.
- `tools/validate.mjs` **rifiuta** una regola v2: un riferimento oggetto in `sources` dà
  `DANGLING source ref "[object Object]"` (misurato su una copia, sessione 12).
- `ap-eidas2-01`: `activity:digital-identity`; `outcome:possible`; obbligazione `eidas2:art-5a`; fonti
  nude `src-eurlex-eidas2`, `src-eurlex-eudi-2024-2981`; `dates` vuoto; nessuna esenzione. `eidas2` ha due
  disposizioni (art. 5a, 5f del Regolamento (UE) n. 910/2014 come inserite).
- `ap-pld-01`: tre attori, quattro attività; `outcome:likely`; **nessuna obbligazione**; fonte nuda
  `src-eurlex-pld`; data `tl-pld-2026-12-09-application`. **`pld` non ha alcuna disposizione registrata**:
  `condition_provisions` richiede di aggiungerne (ambito, definizioni), ciascuna letta sul testo.
- La baseline dopo la sessione 12 (dal suo rapporto, da rimisurare): validatori 0 errori, 45 non
  verificati; `tools/selftest.mjs` 116; le 24 suite 1246 test; Control Room 76 · 1 saltato; suite browser
  343 · 0 · 1; gate avversariale 65 · 0 · 3 · 1; prontezza 17 di 20, rifiuta.

## 13.0 · Domande da porre all'autore, prima di toccare qualcosa di pubblicato

Prima una ricognizione in sola lettura di 13.1–13.3, con le fonti **lette** (EUR-Lex o il Cellar del
Publications Office per CELEX; il registro del Consiglio per ST 14756/26). Poi **una domanda per volta
tramite lo strumento di domande**, con la raccomandazione in prima posizione e la motivazione nella domanda
stessa. Almeno:

1. **Le parole di Parte IX**, in inglese e nelle tre edizioni, prima e dopo, parola per parola. La frase
   deve dire ciò che il record dice (un mandato di negoziato del Consiglio, concordato dal Coreper il
   21 ottobre 2026; nessuna posizione del Parlamento), datata, senza perdere l'argomento del paragrafo.
   Le chiavi dichiarate `superseded` o `pending_translation` come l'autore decide. Se la frase cita un
   record, `data-claim` lo nomina. Aggiungere a P1 il pattern della vecchia frase.
2. **Che cosa controlla il validatore** su una regola v2 (§2 e lo schema): riferimenti oggetto che si
   risolvono, `supports` e `for` nel vocabolario; `condition_provisions` che si risolvono a disposizioni;
   `threshold_basis`; esenzioni oggetto. Una sola casa per ogni controllo: ciò che si *risolve* in
   `validate.mjs`, ciò che una regola *può portare* in `trigger-audit.mjs` (§4.1). Proporre la divisione.
3. **Il pilota, regola per regola**: gli Articoli letti (con il locator), il record prima e dopo,
   ogni disposizione nuova (numero e titolo come letti), ogni testo visibile su `applies.html` che cambia,
   parola per parola. Se un Articolo non è recuperabile, la regola resta nel backlog: si dice, non si
   sostituisce.
4. **Il metodo per le sessioni 14–17**: approvazione regola per regola, oppure una tabella per strumento
   approvata in una domanda (§8, il piano lo lascia a questo pilota). Raccomandazione fondata su come è
   andato il pilota.
5. **`RULES_V1`**: le due regole del pilota escono dalla lista e dai conteggi fissati in X1; chiedere
   prima di cambiare l'asserzione, dicendo quale premessa è cambiata.

Registra ogni risposta in §8 con le parole dell'autore. Ciò che non è approvato non entra.

## 13.1 · V2C-67

- Solo `part-9.p8` e le sue tre sovrapposizioni, nelle parole approvate; nessun altro paragrafo.
- P1 esteso: il pattern della vecchia frase scatta su di essa (piantato) e su nessuna pagina o edizione.
- `node tools/_footer.mjs` rilanciato se una pagina generata cambia; una seconda esecuzione scrive 0 file.
- `docs/V2-CLOSURE.md`: la riga di V2C-67 indica il commit solo dopo l'approvazione del checkpoint.

## 13.2 · Il validatore

- Una regola v1 (le 31 non toccate) continua a validare come oggi; una regola v2 valida se è corretta e
  fallisce, con un messaggio che nomina il campo, se non lo è. Una prova piantata per ogni nuovo errore.
- Nessuna regola cambia in questa voce; `validate` resta 0 errori sull'albero.

## 13.3 · Il pilota

- Ogni valore scritto in `data/` è letto da una fonte recuperata, con `last_verified` della lettura; la
  nota di verifica dice che cosa è stato letto e dove. **Nulla dalla memoria del modello.**
- Le due regole escono da `RULES_V1` e diventano pubblicabili (`publishable`, derivato); il rapporto
  TRIGGERS lo mostra.
- `applies.html` e la sua nota D-2 non cambiano; cambia solo ciò che la regola stampa, nelle parole
  approvate.
- Aperto nel browser: `applies.html` con le combinazioni che fanno scattare le due regole, nei due temi,
  a 1280px e 390px.

## 13.4 · Scrivere e verificare

- Ogni commit che tocca un file pubblicato porta la riga `Evidence:`; `tools/commit-evidence.mjs
  origin/main HEAD` deve dare 0 commit senza evidenza.
- Rilancia tutto, prima e dopo, e salva gli output su file: `validate`, `i18n-audit`, `design-qa`,
  `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`; le 25 suite (con
  `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, o il percorso dell'ambiente),
  la suite browser con `--require-browser`, il gate avversariale, `agent/schemas/cli.mjs check`,
  `.control-room/cli.mjs boundary` e `routes`, `tools/og-image.mjs --check`,
  `agent/production/cli.mjs readiness` (con `BROWSER_QA_CHROME` impostato: senza, `browser_suite_pass`
  blocca e il conteggio scende a 15 di 20 senza che nulla sia cambiato).
- Se una suite fallisce per una premessa cambiata (un conteggio, un elenco), si dice quale e perché, e si
  chiede prima di cambiare un'asserzione.
- Non scrivere file mentre la suite browser gira. Leggi il `git diff` completo prima di ogni commit.

## 13.5 · Checkpoint — la sessione si ferma qui

- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 12: decisioni e commit;
  prima/dopo di ogni testo cambiato; le fonti lette, con data e locator; il rapporto TRIGGERS prima e
  dopo; i conteggi con il motivo di ogni movimento; ciò che non è stato verificato e perché; i rilievi
  trovati; la checklist (13.0–13.5) e come controllare a mano.
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore; si registra in §8. Poi chiedi se aprire una pull request
  verso `main` e registra la sorte del branch nel registro. **Non pushare sul branch dopo aver chiesto il
  merge.**

## Cosa NON fare in questa sessione

- Non toccare le altre 31 regole, né F-4…F-8 (sessioni 14–17).
- Non scrivere `modality`, `publishable`, `verification_state` o un'altra proprietà derivata in `data/`.
- Non fare il flip dei BACKLOG `rule-*`, `scope-decision-missing`, `status-basis-missing`,
  `edge-v1-sources`, `edge-analytical-no-claim`.
- Non implementare i due controlli di manutenzione (sessione 17) né i controlli della mappa M-08…M-16.
- Non toccare `applies.html` né la sua nota; non ritirare la pagina.
- Non correggere altri paragrafi del brief; un altro difetto trovato si porta all'autore.
- Non avviare la Fase 4, il capitolo finanza, il post-v2, né la sessione 14.
- Non dichiarare la v2 conclusa; non dichiarare «sicurezza operativa dimostrata».
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione.
- Non toccare la licenza né il testo di non affiliazione o di assenza di consulenza legale; non scrivere
  nel README.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–12 (da `docs/HANDOVER.md`; non ripeterle)

- **I testi che il lettore vede si approvano parola per parola prima di scriverli.**
- **Un difetto che il lavoro espone si porta all'autore**: né corretto in silenzio, né lasciato in silenzio
  (la sessione 12 ha trovato V2C-67 così).
- **Ciò che si dice all'autore va misurato prima.** Una cifra del design che non si riproduce (F-8: 11 nel
  design, 10 misurate) si dice con il metodo, non si adegua.
- **Una regola che dipende dalla data non è un ERROR** (regola della sessione 30): è un WARNING.
- **La suite browser e i self-test trovano ciò che la lettura non trova.** Rilanciali prima di dichiarare
  un esito, e non scrivere file mentre girano.
- **Branch e merge.** Non pushare su un branch dopo aver chiesto il merge della sua PR; `main` può muoversi
  durante la sessione: riscarica prima dell'ultima scrittura.
- **Riavvii del worker.** Registra ogni risposta in §8 e committa subito: un riavvio non deve perdere una
  decisione. Salva gli output su file. Non usare `pkill -f` con una stringa che compare nella tua stessa
  riga di comando (la sessione 12 ha ucciso così la propria shell).
- **Nessun output di agenti in `agent/records/`**; si diffano solo i record toccati.

## Criterio di uscita e consegna

La sessione è completa in uno di due casi: 13.1–13.3 sono scritti come l'autore li ha decisi, ogni
controllo rilanciato è a 0 errori, il checkpoint è approvato; oppure l'autore decide di fermarsi.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (13.0–13.5) indica:
- cosa è stato scritto (file, righe di §8, commit);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
