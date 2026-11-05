<!--
Provenance: the prompt of Stage 1 of docs/SESSION-ARCHITECTURE.md (Phase 4's operational closure), drafted on 5 Nov 2026
in v2 Session 25 (item 25.5), on `claude/inspiring-meitner-c7s9le`, under the standing rule of docs/ROADMAP-v2.md §8
(4 Nov 2026) and on the author's answer of 5 Nov 2026 ("yse" to drafting it; §8, "v2 Session 25, 25.5: the prompt of
Stage 1, and a pull request"). Drawn from §8, v2 Session 25, 25.5 question 2 (#68 recorded, X-3 amended, Stage 1 finishes
it) and the correction recorded after it (the gate has run in GitHub Actions; C5, C7 and C10 never exercised);
docs/AUDIT-2026-11-04.md §E, §F, §J, §K; docs/DEPLOYMENT.md §2a, §3, §3a, §3b; the logs of `pages.yml` run 77 (`6060bd2`).
The starting state was measured on 5 Nov 2026 on `main` `6060bd2`. The session has no number: its scope row sets it, as
#68 and #69 ran unnumbered (docs/SESSION-ARCHITECTURE.md §3). The decisions live in §8 and nowhere else; this file is the
instruction text that cites them. It records no §8 row of its own and does not open the session. Written in Italian, as
the author's session prompts are. The author may change it before use.
-->

STADIO 1 — La chiusura operativa della Fase 4: la prima decisione umana firmata, la catena di rilascio esercitata per
intero, e il gate G1, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

Verifica che `main` contenga l'architettura e questo prompt:
- `docs/SESSION-ARCHITECTURE.md` esiste (stadi, gate G1–G4, tracce M e R);
- `docs/ROADMAP-v2.md` §8 ha le righe «v2 Session 25, 25.5 question 1» … «question 4», la correzione «the release gate has
  run in GitHub Actions» e «the prompt of Stage 1, and a pull request»;
- `docs/AUDIT-2026-11-04.md` esiste;
- `docs/prompts/v2-stage-1-operational-closure.md` esiste.

Se manca qualcosa, fermati e segnalalo.

**Rimisura la data, prima di ogni altra cosa.** **Se è il 12 gennaio 2027 o dopo**, la finestra della sessione 25 (Traccia M,
12 gennaio – 2 febbraio 2027) è aperta e le 33 regole scadono il 3 febbraio: dillo all'autore per primo, perché la Traccia M
ha la precedenza su ogni stadio. **Se è il 9 marzo 2027 o dopo**, la concessione di autonomia è scaduta: dillo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of Stage 1 (Phase 4's operational closure)» con
le parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo
strumento di domande. Senza quella riga non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/stage-1-operational-closure`. Non lavorare su
`main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare» — in particolare «Non dichiarare "sicurezza operativa dimostrata" dove ci sono solo
   controlli implementati nel codice e test eseguiti».
2. `docs/SESSION-ARCHITECTURE.md` §1–§3 (Stadio 1 e G1).
3. `docs/AUDIT-2026-11-04.md` per intero: ciò che #68 ha fatto, e §J–§K, ciò che non ha fatto.
4. `docs/DEPLOYMENT.md` §2a, §3, §3a, §3b; `agent/implement/decisions/README.md`; `agent/release/README.md`.
5. `docs/AUTONOMY-POLICY.md` e `docs/AI-SAFE-BOUNDARIES.md` §0 e §3.

Se ritieni che una decisione del brief, dell'architettura o di §8 vada rivista, segnalalo e attendi conferma. Non
reinterpretare in silenzio.

## Obiettivo della sessione

**Che G1 regga**: la catena proposta → decisione umana firmata → dispatch → gate → artefatto esercitata una volta per intero,
su una modifica reale, con C5, C7 e C10 del gate che passano invece di risultare «–». La sessione **prepara, misura e
guida**; **gli atti sono dell'autore**: la chiave, la firma, le impostazioni di GitHub, la fusione. Due checkpoint:

- **1.1 · La misura** — `node agent/production/cli.mjs readiness` (letta fino in fondo), `node agent/release/cli.mjs status`,
  `node agent/release/cli.mjs verify-ledger`, e **i log** (non solo l'esito) dell'ultima esecuzione di `pages.yml` su `main`:
  per ciascuna delle dieci condizioni C1…C10, ✓, «–» o «!», con la sua riga. Poi le sei impostazioni di
  `docs/DEPLOYMENT.md` §3a, **chieste all'autore una per volta** (nessuna è misurabile dall'albero): fatta, non fatta, o non
  voluta, con le sue parole in §8.
- **1.2 · Gli atti dell'autore, guidati** — nell'ordine di `docs/DEPLOYMENT.md` §3b: (1) `keygen` con la chiave privata
  **fuori dal repository**, eseguito dall'autore; (2) la voce pubblica in `agent/implement/decisions/reviewers.json`, in una
  pull request che l'autore rivede e fonde (la sessione può preparare il file con la voce pubblica che l'autore le dà;
  **mai** la chiave privata); (3) la variabile `RELEASE_REVIEWER_REGISTRY_SHA256` impostata dall'autore all'impronta che
  `status` stampa; (4) le impostazioni di §3a che l'autore decide di applicare. **Checkpoint**: il rapporto, e la conferma
  dell'autore, atto per atto.
- **1.3 · Una modifica reale attraverso la catena** — una sola, **reale e necessaria**, scelta dall'autore con una domanda
  tra candidati che la sessione misura nei record (una modifica che si farebbe comunque, di rischio basso, prodotta
  dall'agente che ne è titolare, mai inventata per il collaudo). La proposta nel registro dei record; il suo
  `ApprovalRequest`; l'autore ne ispeziona `evidence`, `proposed_change.operations`, `risk`, `rollback_plan`,
  `what_to_check` e **firma lui** con `node agent/implement/cli.mjs decide … --sign-key`; `decisions.jsonl` in un commit
  suo, **prima** della modifica (C7); `node agent/release/cli.mjs dispatch --proposal <id>` in prova, poi `--execute`; la PR;
  la fusione dell'autore; **i log del gate su quel commit**: C5, C7, C10 ✓.
- **1.4 · La rimisura e G1** — `readiness` di nuovo, e la tabella di `docs/AUDIT-2026-11-04.md` §I rimisurata (annotata, non
  riscritta); ciò che resta bloccato, nominato con la ragione. Poi la domanda all'autore: **G1 regge?** Se sì, la riga di
  §8 che apre lo Stadio 2.
- **1.5 · Il prompt della sessione successiva** — nello Stadio 2 il prompt della 27 esiste; manca quello di **PV2-01**
  (A, data readiness, `docs/POST-V2.md` §3 e §4.1): lo si scrive, in italiano, sotto la regola permanente di §8.
  **Il checkpoint finale approva insieme il lavoro e il prompt; senza il prompt non si approva.**

**Regola d'arresto:** se gli atti di 1.2 non sono compiuti dall'autore nella sessione, la sessione si ferma a 1.2 con l'elenco
di ciò che manca, e 1.3 aspetta: **G1 non regge, e lo si dice**. Nessuna approvazione si simula, nessuna voce `SIMULATED:`
entra nel registro reale, nessuna modifica si fa passare per la catena senza la firma dell'autore. Anche fermandosi, si
scrive il prompt della sessione successiva con ciò che resta.

## Lo stato di partenza

Misurato il 5 novembre 2026 su `main` `6060bd2`. **Rimisura tutto.**

| Fatto | Misura del 5 novembre 2026 |
|---|---|
| Il gate in GitHub Actions | eseguito in `pages.yml` run 76 (`d4f860e`) e 77 (`6060bd2`), entrambi `success` e pubblicati; run 77: «RELEASE GATE — PASSED (CI: an unmeasured condition blocks)» |
| Le condizioni del gate (run 77) | C1, C2, C3, C4, C6, C9 ✓; **C5, C7, C10 «–»** (nessun registro, nessuna Proposal, nessuna firma); C8 «!»: quattro commit di #69 con un marcatore d'agente e nessuna Proposal, riportati e non bloccanti |
| `agent/release/cli.mjs status` | proposte nel registro dei record 0; registro delle decisioni assente; registro dei revisori ASSENTE; impronta da fissare «–»; workflow 14 controlli superati |
| File | nessun `agent/implement/decisions/decisions.jsonl`; nessun `reviewers.json`; nessun `agent/orchestrator/dispatchers.mjs` |
| `RELEASE_REVIEWER_REGISTRY_SHA256` | vuota nel run 77 |
| Prontezza | 17 di 20, come riportato da #68 (`de0663a`); da rimisurare |
| Le impostazioni di §3a | non misurabili dall'albero; secondo `docs/DEPLOYMENT.md` §3a al 4 nov 2026: fonte di Pages riportata fatta il 24 ott 2026, il resto non fatto |
| Validatori | `validate.mjs` 0 errori · 5 avvertimenti; `selftest` 141/141 |

## Scrivere

- Le righe di §8 prima di ogni modifica; ogni risposta in §8 con le parole dell'autore, **committata subito**.
- Ogni commit che cambia un file pubblicato porta `Evidence:`. La modifica di 1.3 segue `docs/RULE-MAINTENANCE.md` se tocca
  una regola, e in ogni caso i validatori, `_footer.mjs` se tocca `data/`, e le suite che la riguardano.
- Prima di ogni checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of
  <oggi>`, `seo-audit`, `node --test tools/selftest.mjs`, le 25 suite, `node --test agent/release/selftest.mjs`, la suite
  browser con `--require-browser`, il gate avversariale, `node agent/release/cli.mjs workflows`,
  `node tools/commit-evidence.mjs <base> HEAD`. Non scrivere nell'albero mentre la batteria gira.

## Checkpoint

- **1.2:** la misura di 1.1 e gli atti dell'autore, uno per uno, con le righe di §8; il rapporto in `docs/HANDOVER.md`.
  Attendi l'approvazione, registrata in §8.
- **Finale (1.3–1.5):** la modifica, la proposta, la decisione firmata (il suo hash, non la chiave), il dispatch, la PR, i
  log del gate con C1…C10; la prontezza rimisurata; la decisione su G1; il prompt di PV2-01; la checklist. Riscarica
  `origin/main` subito prima dell'ultima scrittura di `docs/HANDOVER.md`. **Senza il prompt di PV2-01 non si chiede
  l'approvazione.** Poi chiedi se aprire una pull request verso `main` e registra la sorte del branch.

## Cosa NON fare in questa sessione

- **Non generare, vedere, chiedere, conservare o usare la chiave privata dell'autore**; non eseguire `keygen` né `decide`
  al suo posto; non scrivere a mano `decisions.jsonl` né `reviewers.json` con una chiave che non sia quella pubblica data
  dall'autore; non registrare la chiave di un agente come revisore.
- Non mettere una voce `SIMULATED:` o di prova nel registro reale; non usare un fixture come approvazione.
- Non creare `agent/orchestrator/dispatchers.mjs` né attivare il dispatcher di produzione: è una decisione di governo
  (`docs/PRODUCTION-OPERATING-MODE.md`), non dello Stadio 1, salvo una decisione dell'autore che lo chieda per nome.
- Non indebolire, saltare o riscrivere una condizione del gate, di `readiness` o del gate avversariale per farla passare;
  non toccare `ALLOWED_RUNTIME_ORIGINS`.
- Non modificare impostazioni di GitHub: sono dell'autore. Non dichiarare applicata un'impostazione che l'albero non può
  mostrare: si registra con le parole dell'autore.
- Non dichiarare «sicurezza operativa dimostrata»: si dice quale condizione è stata esercitata, su quale commit, e che cosa
  resta non misurato.
- Non riaprire la Fase 4; non cambiare una regola fuori dalla modifica scelta in 1.3; non rinnovare la concessione di
  autonomia; non scegliere né installare un CMS (D-5).
- Non toccare licenza, non affiliazione, assenza di consulenza legale, README. Non riscrivere la storia di `main`; non
  riscrivere un rapporto passato (si annota). Vale in pieno «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–25 (da `docs/HANDOVER.md`; non ripeterle)

- **Una premessa citata da un rapporto può essere superata dai fatti**: la sessione 25 ha scritto «il gate non è stato
  verificato in Actions» copiandolo da `docs/AUDIT-2026-11-04.md`, mentre due esecuzioni l'avevano già fatto girare; corretto
  in §8. **Si leggono i log, non solo l'esito e non solo il rapporto.**
- **`origin/main` si muove durante la sessione**, e una PR può essere fusa mentre si lavora: riscarica prima di ogni
  scrittura di `docs/HANDOVER.md` e prima di aprire una PR.
- **La data della sessione è un fatto da misurare**; la Traccia M ha la precedenza.
- **`selftest` fissa ciò che cambi**; **conta prima di scrivere**; **non dichiarare una correzione che non hai fatto**.
- **Riavvii del worker**: ogni risposta in §8 committata subito; dopo un'interruzione, `git status` prima di rifare un
  comando. **Un clone superficiale non è un albero difettoso.** **Nessun output di agenti in `agent/records/` committato.**

## Criterio di uscita e consegna

La sessione è completa quando: la misura di 1.1 è registrata; gli atti di 1.2 sono compiuti dall'autore, o nominati come
mancanti; una modifica reale è passata per la catena con la firma dell'autore e il gate su `main` mostra C5, C7, C10 ✓ (o,
per la regola d'arresto, 1.3 è nominata come non fatta e G1 non regge); la prontezza è rimisurata; l'autore ha deciso su
G1; i checkpoint sono approvati in §8; `selftest` e le 25 suite passano; **il prompt di PV2-01 esiste su questo branch,
porta la stessa regola nel suo criterio di uscita, ed è approvato con il lavoro** (regola permanente di §8, 4 nov 2026).

Prima di chiudere, produci la checklist di verifica: per ciascun punto (1.1–1.5) cosa è stato scritto (file, righe di §8,
commit), come verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è
completo, dichiaralo.
