<!--
Provenance: the prompt of v2 Session 27, drafted on 4 Nov 2026 in v2 Session 25 (item 25.4), on
`claude/inspiring-meitner-c7s9le`, under the standing rule of docs/ROADMAP-v2.md §8 (4 Nov 2026) and on the author's answer
"Draft S27's prompt now (Recommended)" (§8, "v2 Session 25, 25.4: the prompt of v2 Session 27"). Session 27 is the first
session of Phase 5, its design; it runs before Sessions 25 and 26 in time and after them in number, as the author decided
(§8, 25.4 question 3, "From 27, numbers name work (Recommended)"). Drawn from docs/PHASE-5-SETUP.md (all of it, approved
on 4 Nov 2026 by §8, 25.4 questions 1–7) and docs/ROADMAP-v2.md §8 (v2 Session 25, every row). The starting state was
measured on the branch of v2 Session 25 on 4 Nov 2026, full clone. The decisions live in those rows and nowhere else; this
file is the instruction text that cites them. It records no §8 row of its own and does not open the session: v2 Session
27 records its scope in §8 as its first write. Written in Italian, as the author's session prompts are. The author may
change it before use.
Amended on 5 Nov 2026 (v2 Session 25, 25.5; §8, 25.5 questions 1–4): Session 27 sits in Stage 2 of
docs/SESSION-ARCHITECTURE.md, beside Post-v2's PV2-01 and PV2-02, and its output is an input to C; Phase 5 opens at G2, after
C's selection, not at the end of Session 27. The date wording and 27.5 are changed accordingly; nothing else.
-->

SESSION 27 — Fase 5, il disegno: lo standard dei nuovi trigger (E5-3), la tabella delle disposizioni (X5-1), la prova su
carta e il prompt della sessione 28, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

Verifica che `main` contenga il piano della Fase 5 e questo prompt:
- `docs/PHASE-5-SETUP.md` esiste, con lo stato «APPROVED BY THE AUTHOR ON 4 NOV 2026 … PHASE 5 IS PLANNED AND NOT OPENED» e
  le risposte dell'autore in §7;
- `docs/ROADMAP-v2.md` §8 ha le righe «v2 Session 25, 25.4 question 1» … «question 7» e «v2 Session 25, 25.4: the prompt
  of v2 Session 27» (se manca la riga della domanda 7, il piano non è approvato: fermati e chiedi);
- `docs/prompts/v2-session-25.md` esiste, invariato (la lettura di gennaio);
- `docs/prompts/v2-session-27.md` esiste;
- `docs/SESSION-ARCHITECTURE.md` esiste, e §8 ha le righe «v2 Session 25, 25.5 question 1» … «question 4» e una riga che
  apre lo Stadio 2 (gate G1). **Senza la riga di G1 lo Stadio 2 non è aperto: fermati e chiedi.**

Se manca qualcosa, fermati e segnalalo.

**Rimisura la data, prima di ogni altra cosa.** Questa sessione è il disegno della Fase 5, nello Stadio 2 di
`docs/SESSION-ARCHITECTURE.md`; non ha una data, ma la Traccia M ha la precedenza. **Se la data di oggi è il 12 gennaio 2027 o dopo**, la finestra della sessione 25 (12 gennaio – 2 febbraio 2027)
è aperta e le 33 regole scadono il 3 febbraio: dillo all'autore prima di ogni altra cosa, perché la lettura viene prima
del disegno. **Se è il 3 febbraio 2027 o dopo** e le sessioni 25 e 26 non hanno chiuso le loro letture, le 33 regole sono
`RULE_STALE`: dillo per primo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 27» con le parole con cui l'autore
avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande. Senza quella
riga non si scrive nulla. Registra anche, in quella riga, che la Fase 5 è pianificata e non aperta.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2-session-27-phase-5-design`. Non lavorare su
`main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare».
2. `docs/PHASE-5-SETUP.md` per intero, in particolare §0 (le premesse, decise), §1 (M-1…M-7), §3 (E5-3) e §6 (i rischi).
3. `docs/ROADMAP-v2.md` §8: le righe della sessione 25, item 25.4.
4. `data/applicability.json`: `$description`, `$outcomes`, `$limits`; e l'intestazione di `tools/trigger-audit.mjs`
   (T-01…T-12), lo standard della Fase 3 che E5-3 estende.
5. `docs/ATTESTATION-FORM.md` §4 e §5: il modello di una misura fatta con un parser di prova fuori dal repository, e di una
   prova su carta.

Se ritieni che una decisione del brief, del piano o di §8 vada rivista, segnalalo e attendi conferma. Non reinterpretare in
silenzio.

## Obiettivo della sessione

**Il disegno della Fase 5 in `docs/`, e nient'altro: lo standard E5-3 scritto, la tabella X5-1 proposta, la prova su carta,
il prompt della sessione 28.** La numerazione segue `docs/PHASE-5-SETUP.md` §5.1. Due checkpoint:

- **27.1 · Le premesse** — già decise il 4 novembre 2026 (P-A profondità, P-B prima il disegno e dopo le modifiche, P-C
  dalla 27, P-D nessuna proposta di agenti): si verifica solo che le righe ci siano. Nessuna domanda.
- **27.2 · Lo standard E5-3**, in `docs/`, nel file che proponi all'autore (una sezione di `docs/PHASE-5-SETUP.md` o un file
  suo). Ogni clausola di E5-3 — ogni domanda o dimensione risolve in un ID di disposizione; ogni risposta che può cambiare un
  esito cita una fonte di livello 1 con `supports` e un locator; un'esenzione valutata ha la base che T-04 già richiede;
  **una domanda senza risposta non restringe mai un esito**, e NON DETERMINATO resta ciò che nessuna regola copre — con:
  la regola esatta che un controllo applicherebbe, il caso piantato che la fa fallire (come `docs/ATTESTATION-FORM.md` §5),
  e ciò che il controllo non può vedere. Ogni scelta all'autore, una domanda per volta. **Checkpoint.**
- **27.3 · La tabella X5-1, proposta** — una riga per ciascuno dei 38 elementi di `depends_on` (25 regole), delle 4 chiavi di
  soglia (`ap-dsa-02`, `ap-dma-02` ×2, `ap-ai-act-03`) e delle 26 esenzioni (20 regole: 10 `excludes`, 16 `narrows`), con:
  la regola, ciò su cui l'elemento poggia secondo i record (l'Articolo che nomina, o nessuno), e la disposizione proposta —
  **chiedibile** (con la disposizione che la definisce), **valutata** (un'esenzione che il matcher applica), **resta una
  dipendenza dichiarata** (con la ragione: un fatto che nessun questionario può stabilire), o **lasciata**. Misurata con un
  parser di prova **fuori dal repository** (nello scratchpad); **nulla in `data/` cambia**. M-1…M-4 (F-05, F-12, F-24, R-8)
  nominati per la sessione 28. Le disposizioni si propongono all'autore **per strumento**, una domanda per strumento, la
  raccomandazione per prima.
- **27.4 · La prova su carta** — tre o quattro casi tipici, scelti dall'autore con una domanda, ciascuno attraversato con il
  questionario come la tabella proposta lo renderebbe: quali regole scattano oggi, quali dopo, e la dimostrazione che **nessuna
  domanda lasciata senza risposta produce un «no»** (X5-3). Su carta, in `docs/`; nessun codice.
- **27.5 · Il prompt della sessione 28** — il prompt di `docs/prompts/v2-session-28.md` (E5-3 come controllo a ERROR, poi
  F-05, F-12, F-24, R-8, una domanda ciascuno; la 28 parte dopo il gate G2 — la selezione di C e l'apertura della Fase 5 — e
  dopo le letture delle sessioni 25 e 26: E5-5), sotto la regola permanente di §8. **La Fase 5 non si apre in questa
  sessione**: si apre al gate G2, dopo PV2-05 (§8, 25.5 domande 1 e 3). **Il checkpoint finale approva insieme il lavoro e il prompt; senza il prompt non si approva.**

**Regola d'arresto** (`docs/PHASE-5-SETUP.md` §5.1, regola 1): se la sessione si allunga, cade prima 27.4, poi 27.3 passa
all'apertura della sessione 28, nominata nel suo prompt; **27.2 non si sposta.**

## Lo stato di partenza

Misurato il 4 novembre 2026 sul branch della sessione 25, clone completo. **Rimisura tutto.**

| Fatto | Misura del 4 novembre 2026 |
|---|---|
| Le regole | 33, tutte `last_verified` 2026-11-04; 25 con `attestation` |
| Dimensioni | actor 44 termini, activity 22, territory 3; `thresholds` su 3 regole |
| Esiti | applies 13, likely 9, possible 10, unlikely 1 (likely + possible = 19, ciascuna con `depends_on`: T-06) |
| Ciò che non si chiede | `depends_on` 38 su 25 regole; soglie 4 chiavi su 3 regole; esenzioni 26 su 20 regole (10 `excludes`, 16 `narrows`), nessuna valutata |
| Validatori | `validate.mjs` 0 errori · 5 avvertimenti (A-8 di `ap-eidas2-01`); `selftest` 140/140 |
| Scadenze | `freshness --as-of 2027-02-03`: 33 `RULE_STALE` (le letture delle sessioni 25 e 26 non fatte) |
| Concessione di autonomia | scade il 9 marzo 2027: si segnala, non si rinnova |

## Scrivere

- **Solo `docs/`.** Nessuna modifica a `data/`, `tools/`, `js/`, `i18n/`, a una pagina o a `agent/`. La tabella si misura
  fuori dal repository; nessuno strumento nuovo entra nel repository in questa sessione.
- Le righe di §8 prima di ogni documento che dipende da una decisione; ogni risposta in §8 con le parole dell'autore,
  **committata subito**.
- Una domanda che cita il testo di un Articolo lo cita dal testo della Gazzetta ufficiale letto in questa sessione da Cellar
  per CELEX (`Accept-Language: eng`), mai a memoria. **La tabella non è una lettura**: classifica ciò che i record dicono;
  nessuna regola si chiude e nessuna data si muove.
- Prima di ogni checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of
  <oggi>`, `seo-audit`, `node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`. **Prima del
  checkpoint finale, anche le 25 suite**, perché E5-6 si misurerà a G2 su questo albero. Non scrivere nell'albero mentre la batteria gira.

## Checkpoint

- **27.2:** lo standard, con le risposte dell'autore (righe §8) e i casi piantati; il rapporto in `docs/HANDOVER.md`.
  Attendi l'approvazione, registrata in §8.
- **Finale (27.3–27.5):** la tabella proposta e le disposizioni decise, per strumento; la prova su carta; il prompt della 28
  (percorso, commit, risposte dell'autore); la checklist. Riscarica `origin/main`
  subito prima dell'ultima scrittura di `docs/HANDOVER.md`. **Senza il prompt della 28 non si chiede l'approvazione.** Poi
  chiedi se aprire una pull request verso `main` e registra la sorte del branch.

## Cosa NON fare in questa sessione

- Non cambiare una regola, un esito, una condizione o un'esenzione; non chiudere una regola; non toccare le letture delle
  sessioni 25 e 26 né il loro prompt (E5-5: nessuna modifica alle regole prima che si chiudano).
- Non aprire la Fase 5 senza la parola dell'autore; non implementare E5-3 come controllo (è della 28); non aggiungere un
  termine a `data/taxonomy.json`.
- Non far proporre a un agente una modifica di regola (P-D); non toccare `agent/integrate/preserve.mjs` né il suo test.
- Non riaprire F-18 (gruppo (d)), il gruppo (b) fuori dalle sue domande della 28, V2C-13 (le sessioni della mappa) o V2C-15
  (sessione 30, dopo V2C-13).
- Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale,
  `ALLOWED_RUNTIME_ORIGINS`; D-5 è rinviato: non scegliere né installare un CMS; non rinnovare la concessione di autonomia.
- Non abbassare gate, validator, test o limiti. Non toccare licenza, non affiliazione, assenza di consulenza legale, README.
- Non riscrivere la storia di `main`, né forzare un push su un branch altrui; non riscrivere un rapporto passato (si annota).
- Vale in pieno «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–25 (da `docs/HANDOVER.md`; non ripeterle)

- **La data della sessione è un fatto da misurare, e una premessa del prompt può essere sbagliata**: la sessione 25 è
  partita lo stesso giorno di `FORM_FROM` e delle ultime letture, e la lettura è stata rinviata (§8, 25.0 domanda 1).
- **`origin/main` si muove durante la sessione**: nella sessione 25 la PR #66 è stata fusa mentre si scriveva 25.4. Prima
  di ogni scrittura di `docs/HANDOVER.md` e prima di aprire una PR, riscarica e confronta; se la PR del branch è già fusa, il
  lavoro nuovo va su una nuova PR, ribasato.
- **Un innesto può rompere un documento**: l'intestazione di `docs/HANDOVER.md` è stata troncata in `1925258` e riparata
  nella sessione 25. Leggi il diff intero prima di ogni commit.
- **`selftest` fissa ciò che cambi**; **conta prima di scrivere**; **non dichiarare una correzione che non hai fatto**.
- **Riavvii del worker e interruzioni**: ogni risposta in §8 committata subito; dopo un'interruzione, `git status` prima di
  rifare un comando. **Un clone superficiale non è un albero difettoso.** **Nessun output di agenti in `agent/records/`.**

## Criterio di uscita e consegna

La sessione è completa quando: lo standard E5-3 è scritto in `docs/` con i suoi casi piantati e approvato in §8; la tabella
X5-1 è proposta e le disposizioni decise per strumento (o, per la regola d'arresto, la tabella è nominata nel prompt della
28); la prova su carta è fatta (o caduta, nominata); il suo esito è consegnato come input a C (PV2-03…05); i checkpoint sono approvati in
§8; `selftest` passa e nulla fuori da `docs/` è cambiato; **il prompt della sessione 28 esiste su questo branch, porta la
stessa regola nel suo criterio di uscita, ed è approvato con il lavoro** (regola permanente di §8, 4 nov 2026). Oppure
l'autore decide di fermarsi: anche allora, **prima di chiudere, si scrive il prompt della sessione successiva** con ciò che
resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (27.1–27.5) cosa è stato scritto (file, righe di §8,
commit), come verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è
completo, dichiaralo.
