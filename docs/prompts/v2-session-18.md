<!--
Provenance: the prompt of v2 Session 18, drafted on 3 Nov 2026 at the end of v2 Session 17.5, on the author's
request ("Ask me and then write session 18's prompt"), after "The checkpoint of v2 Session 17.5" was approved and
merged (#51). Its scope was put to the author in four questions before drafting, answered: "Notice + (c) + V2C-28–36
(Recommended)"; "Notice first, own checkpoint (Recommended)"; "Not in 18 (Recommended)" (Phase 4); "New branch + PR
(Recommended)". Those answers are recorded in docs/HANDOVER.md's branch register for this prompt, not in §8: a
session's scope is recorded in §8 by the session itself, in the author's words, as its first write. Drawn from
docs/ROADMAP-v2.md §8 (v2 Session 17.5: questions 2, 3 and 4, and the checkpoint); docs/PHASE-3-AUDIT.md §4 and
§4.1; docs/V2-CLOSURE.md rows V2C-27…V2C-36; and the v2 Session 17.5 report in docs/HANDOVER.md. The starting
state was measured on `main` at 7c333b3 on 3 Nov 2026. The decisions live in those rows and nowhere else; this file
is the instruction text that cites them. Written in Italian, as the author's session prompts are. The author may
change it before use.
-->

SESSION 18 — Sessione di manutenzione: la nota D-2 di `applies.html` nel testo approvato, poi i rilievi del gruppo (c) e le righe V2C-28…V2C-36, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. **Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque
suite** (rilievo 1 della sessione 17.5: su un clone superficiale `agent/proposals/governance/selftest.mjs` fallisce 8
test su 45 e la prontezza aggiunge due bloccanti; non è un difetto dell'albero).

Verifica che `main` contenga la sessione 17.5 e questo prompt:
- `docs/ROADMAP-v2.md` §8 ha la riga «The checkpoint of v2 Session 17.5» e, sopra, «v2 Session 17.5, 17.5.0 question 3»
  con il testo approvato della nota;
- `docs/PHASE-3-AUDIT.md` e `docs/PHASE-4-SETUP.md` esistono;
- `docs/prompts/v2-session-18.md` esiste.

Se manca qualcosa, fermati e segnalalo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 18» con le parole con cui
l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di
domande. Senza quella riga non si scrive nulla, nemmeno in `docs/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso: `origin/scout/digest-digest-2026-11-02T16-04-07Z` (nel registro, lasciato aperto per
decisione dell'autore), e il branch di questo prompt se la sua PR non è ancora unita.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2-session-18-maintenance`. Non lavorare
su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, in particolare «Cosa NON fare».
2. `docs/ROADMAP-v2.md` §8: le righe della sessione 17.5, in particolare le domande 2, 3 e 4 e il checkpoint.
3. `docs/PHASE-3-AUDIT.md` §4 (i rilievi F-01…F-30, misurati il 3 novembre 2026) e §4.1 (la nota, prima e dopo).
4. `docs/V2-CLOSURE.md`: le righe V2C-27…V2C-36, con la colonna «Measured today».
5. `docs/HANDOVER.md`: il rapporto della sessione 17.5.
6. `AGENTS.md`, «Known hazards»: le traduzioni superate (`superseded`), la rigenerazione con `tools/_footer.mjs`, lo
   script inline e la CSP, il trailer `Evidence:`.
7. `docs/AUTONOMY-POLICY.md`: ogni voce di questa sessione che cambia una pagina, un dato, uno stile o un controllo è
   di classe C — si prepara, si mostra, l'autore approva.

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e attendi
conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**Una sessione di manutenzione, con due checkpoint.** Il primo per la nota, che è un'affermazione pubblicata oggi
falsa e non deve attendere il resto; il secondo per i rilievi di presentazione e di vocabolario. **La Fase 4 non è in
questa sessione** (la sua apertura è una decisione dell'autore, da registrare all'inizio della sessione che fa la voce
4.1; risposta dell'autore prima di questo prompt: «Not in 18»).

- **18.1 · La nota D-2**, poi checkpoint.
- **18.2 · Il gruppo (c) e le righe V2C-28…V2C-36**, poi checkpoint finale.

Ogni testo che un lettore vede e che cambia si mostra all'autore **prima e dopo, parola per parola**, e si scrive solo
dopo la sua risposta, registrata in §8 e committata subito.

## Lo stato di partenza

Misurato il 3 novembre 2026 su `main` a `7c333b3` (la sessione 17.5 unita). **Rimisura tutto.**

**La baseline** (rapporto della sessione 17.5, misurata su un clone completo): `validate` 0 errori, provvedimenti
113, 45 non verificati; `i18n-audit`, `design-qa`, `seo-audit` 0/0; `evidence-audit --as-of 2026-11-03` 0 errori,
12 warning, publishable 33 of 33; `freshness --as-of 2026-11-03` 0 difetti, 4 richieste; `tools/selftest.mjs` 123; le
24 suite 1253 su 1253; Control Room 76 · 1 saltato (`::1`); suite browser 343 · 0 · 1; gate avversariale 65 · 0 · 3 ·
1; prontezza 17 di 20, rifiuta. Un numero che si muove con la data (le richieste di `freshness`, i warning
`STATUS_PREDATES_MILESTONE`: dal 2 dicembre 2026 anche `ai-act`) si spiega, non si «sistema».

**18.1 — la nota.** `applies.html:82`, `data-i18n="applies.notice"`. Il testo di oggi e quello approvato sono in §8
(17.5, domanda 3) e in `docs/PHASE-3-AUDIT.md` §4.1. **Un controllo fissa il testo di oggi**: `tools/selftest.mjs` N1
(«applies.html carries the approved notice …») confronta il paragrafo con la vecchia frase, parola per parola, «change
it only on their word». Scrivere la nota senza cambiare N1 porta `tools/selftest.mjs` e la CI al rosso; cambiare N1 è
una modifica di un controllo (classe C). È una premessa che la domanda 3 della sessione 17.5 non ha nominato: si chiede
a parte (vedi 18.0). `applies.notice` è `pending_translation` in it, fr ed es (V2C-27): le edizioni mostrano l'inglese,
e nessuna traduzione esiste da dichiarare `superseded` — verificalo prima di scrivere.

**18.2 — i rilievi.** Misurati il 3 novembre 2026; rimisurali uno per uno.

| Rilievo | Che cosa | Dove (oggi) | Legge? |
|---|---|---|---|
| F-06 | le note di tassonomia «NIS2 Annex I.» / «NIS2 Annex II.» per `actor:essential-entity` / `actor:important-entity`; l'Art. 3 di NIS2 classifica anche per dimensione | `data/taxonomy.json` | **sì** |
| F-15 | l'intestazione di `ai-act:art-50`, «Transparency obligations»; la Gazzetta ufficiale stampa un'intestazione più lunga | `data/instruments.json` | **sì** (la pagina dell'AI Act) |
| F-16 / V2C-33 | «1 days ago»; e «1 rule in the dataset turn on this instrument» | `js/evidence-view.js:132`; `js/instrument-view.js:385` | no |
| F-21 | gli Articoli di definizione stampano «Applies from … — the instrument's general date» (il ripiego della derivazione) | `js/regulatory-model.js` e la sua resa | no |
| F-28 | l'insieme pre-adozione ha due case | `js/regulatory-model.js:26` `PRE_ADOPTION`; `tools/register-audit.mjs:56` `PROCEDURAL_STATES` | no |
| F-30 | «Seventeen edges are recorded» (sono 40) | `js/interactions.js:18`, un commento | no |
| F-10 | `$last_verified` 2026-08-27 in `data/applicability.json`, letto da nulla | `data/applicability.json` | no |
| V2C-28 | il link «Read it at the source» della nota «not covered» è il blu predefinito in entrambi i temi (circa 2.0:1 sul fondo scuro) | `instrument.html?id=p2b` | no (accessibilità) |
| V2C-29 | il `<title>` della pagina EHDS: «EHDS — key provisions and key dates» | `instruments/ehds/index.html`, generato da `tools/seo.mjs` | no |
| V2C-30 | «member State» nelle descrizioni generate di 5 pagine (CSA, DNA, EHDS, eIDAS2, IEA) | `tools/seo.mjs` `lowerLead()` | no |
| V2C-31 | una voce di bibliografia senza data finisce `.”.` (31 voci) | `js/bibliography.js` | no |
| V2C-32 | la data di «last verified on» va a capo, perché il `<b>` dentro `.fresh` si comporta da blocco | `css/tokens.css:349–354` | no |
| V2C-34 | residui nelle note dei claim (un id di provvedimento, id nudi di strumenti) | `data/claims.json` | no |
| V2C-35 | testi approvati che si leggono rigidi; «this environment» in 14 righe di `data/sources.json` (misurato con `grep -c`) | `data/sources.json` e altri | no |
| V2C-36 | il blocco morto `.tool-top` / `.bib-top` in `css/tools.css`; `js/shell.js` interroga ancora quegli header | `css/tools.css:26–30` | no |

## 18.0 · Le domande all'autore

**Una ricognizione in sola lettura prima**, con le fonti lette; poi le domande, **una per volta, con lo strumento di
domande**, la raccomandazione in prima posizione e la motivazione nella domanda; ogni risposta in §8 con le parole
dell'autore, committata subito; nulla di pubblicato cambia prima della risposta.

Per 18.1, almeno:
1. **N1** (la premessa non nominata): N1 aggiornato al testo approvato, con la stessa formula «change it only on their
   word» e il controllo sul `pending_translation` invariato; prima e dopo dell'asserzione, parola per parola.
2. **La nota**: il testo approvato (§8, 17.5 domanda 3) mostrato com'è in `applies.html` prima e dopo, con il `<b>`; la
   riga `Evidence:` proposta; che cosa scrive `node tools/_footer.mjs` (una seconda esecuzione deve scrivere 0 file).

Poi **checkpoint 18.1**: il rapporto breve in `docs/HANDOVER.md`, i validatori e le suite rilanciati, la pagina vista
nel browser (chiaro e scuro, 1280px e 390px), l'approvazione dell'autore in §8. **18.2 non comincia prima.**

Per 18.2, per ogni rilievo: che cosa cambia, prima e dopo parola per parola (o la regola CSS e il contrasto misurato),
e la raccomandazione. Si possono raggruppare in una tabella approvata con una sola domanda i rilievi di sola
presentazione dello stesso tipo (per esempio V2C-29 e V2C-30, entrambi in `tools/seo.mjs`); **ogni rilievo con «Legge?
sì» ha la sua domanda** e:
- **F-06**: leggi l'Art. 3 di NIS2 nel testo della Gazzetta ufficiale recuperato da Cellar per CELEX (32022L2555),
  cita paragrafo e data; proponi le due note in parole che dicano ciò che l'Articolo dice. Nulla dalla memoria.
- **F-15**: leggi l'intestazione dell'Art. 50 nel testo della Gazzetta ufficiale del Regolamento (UE) 2024/1689
  (32024R1689) e verifica se il Regolamento (UE) 2026/1744 (32026R1744) la modifica; proponi l'intestazione esatta.
- Se la rete non raggiunge Cellar, dillo: il rilievo resta aperto. **Non chiudere un rilievo di diritto con una
  formulazione plausibile.**
- **F-28** è una questione di casa unica: proponi quale modulo importa l'altro, senza cambiare il comportamento di
  nessuno dei due, con le suite che lo dimostrano.
- **F-10**: le opzioni (togliere il campo, lasciarlo con una nota, o altro) con ciò che `validate.mjs` e `freshness.mjs`
  ne leggono oggi.
- **V2C-34 e V2C-35**: ogni testo all'autore (la decisione della sessione 11: «each text to the author»).

Una premessa che una domanda non nomina si chiede a parte.

## 18.3 · Scrivere e verificare

- Un commit per voce approvata, con la riga `Evidence:` quando cambia un file pubblicato
  (`tools/commit-evidence.mjs <base> HEAD`: 0 senza evidenza).
- Dopo una modifica a `data/` o a uno script inline: `node tools/_footer.mjs`, poi una seconda esecuzione che scrive 0
  file; `seo-audit` 0 errori.
- Una stringa inglese corretta che ha una traduzione: la chiave si dichiara `superseded` in `i18n/locales.json` in ogni
  lingua interessata. **Non scrivere traduzioni**: una traduzione approvata è di un parlante (V2C-27).
- Rilancia tutto come misura, prima e dopo, su un clone completo, e salva gli output su file: `validate`, `i18n-audit`,
  `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`; le 25 suite (con
  `BROWSER_QA_CHROME` sul Chromium dell'ambiente, per esempio `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`),
  la suite browser con `--require-browser`, il gate avversariale, `agent/schemas/cli.mjs check`, `.control-room/cli.mjs
  boundary` e `routes`, `tools/og-image.mjs --check`, `agent/production/cli.mjs readiness`. Misura in un worktree
  separato o senza scrivere file mentre le suite girano.
- Ogni pagina toccata vista in Chromium: chiaro e scuro, 1280px e 390px; nessun errore in console, nessun overflow
  orizzontale; per V2C-28 il contrasto misurato in entrambi i temi.
- Leggi il `git diff` completo prima di ogni commit.

## 18.4 · Checkpoint finale — la sessione si ferma qui

- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 17: le decisioni con i commit; prima e dopo
  di ogni testo che un lettore vede; i conteggi prima e dopo con il motivo di ogni movimento; ciò che non è stato
  verificato e perché; i rilievi nuovi, non corretti; la checklist (18.0–18.4) e come controllare a mano.
- Dopo l'approvazione: le righe di `docs/V2-CLOSURE.md` chiuse con «Closed, `<commit>`» come fanno le altre; e chiedi
  all'autore se `docs/PHASE-3-AUDIT.md` §4 riceve lo stesso segno per gli F chiusi, con il testo esatto.
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore, registrata in §8. Poi chiedi se aprire una pull request verso `main`,
  e registra la sorte del branch. **Non pushare sul branch dopo aver aperto la PR.** Il prompt della sessione
  successiva si scrive solo se l'autore lo chiede.

## Cosa NON fare in questa sessione

- Non aprire né avviare la Fase 4; non scrivere la voce 4.1; non toccare D-5, `ALLOWED_RUNTIME_ORIGINS`, la concessione
  di autonomia, i dispatcher.
- Non correggere i rilievi degli altri gruppi della domanda 4 della sessione 17.5: (a) la formulazione delle regole
  (una sessione dedicata prima del 28 gennaio 2027), (b) esiti e condizioni (Fase 5), (d) il brief e i suoi claim (una
  sessione di evidenze), F-29 (le sessioni della mappa); né le righe con altra destinazione (V2C-11 e le quindici di
  17.5 domanda 2).
- Non rileggere né modificare regole, claim o paragrafi del brief, se non ciò che una voce approvata nomina.
- Non cambiare la nota D-2 in parole diverse da quelle approvate; non ritirare `applies.html`.
- Non scrivere traduzioni, né dichiarare rivista una lingua.
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione; non trasformare uno skip
  (il test `::1`) in un pass; un'asserzione cambia solo con la risposta dell'autore (N1 compreso).
- Non toccare la licenza né il testo di non affiliazione o di assenza di consulenza legale; non scrivere nel README.
- Non riscrivere la storia di `main`, né forzare un push.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–17.5 (da `docs/HANDOVER.md`; non ripeterle)

- **Ciò che si dice all'autore va misurato e citato esattamente**, e si legge prima di chiedere. Prima di dire dove un
  testo si stampa, cercalo nel codice (`js/search.js`, `js/interactions.js`, `js/calendar.js`).
- **Un controllo può fissare il testo che cambi** (N1): cercalo prima di scrivere (`grep` in `tools/`, `agent/`,
  `.control-room/`).
- **Un difetto che il lavoro espone si porta all'autore**: né corretto in silenzio, né lasciato in silenzio.
- **Un clone superficiale non è un albero difettoso**: controlla `--is-shallow-repository` prima delle suite.
- **Un numero che cambia con la data si spiega.**
- **Una premessa che la domanda non ha nominato si chiede a parte** (sessioni 13, 15, 17, 17.5).
- **Branch e merge.** Non pushare su un branch dopo aver aperto la sua PR; `main` può muoversi durante la sessione:
  riscarica prima dell'ultima scrittura.
- **Riavvii del worker.** Registra ogni risposta in §8 e committa subito; salva gli output su file; non usare
  `pkill -f` con una stringa che compare nella tua stessa riga di comando; ferma un server per PID.
- **Nessun output di agenti in `agent/records/`.**

## Criterio di uscita e consegna

La sessione è completa in uno di due casi: la nota è scritta nel testo approvato con N1 aggiornato e il checkpoint 18.1
approvato; ogni rilievo di 18.2 è corretto come l'autore ha approvato o lasciato aperto con la ragione registrata in
§8; il checkpoint finale è approvato. Oppure l'autore decide di fermarsi (anche dopo il checkpoint 18.1).

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (18.0–18.4) indica:
- cosa è stato scritto (file, righe di §8, commit);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
