<!--
Provenance: drafted on 25 Nov 2026 in the translation-review session (no §8 row numbers it), on
`claude/eudigitalpolicy-translation-review-f7jdzs`, from `main` `685dd22` (#137 merged), at the author's request in chat («prepara il prompt
per la prossima sessione»), after the author shared a proposal for reorganising the documentation written with ChatGPT («ti mando un audit
di chatgpt su come programmarlo, dimmi che ne pensi») and the session answered with what it had measured. That proposal was supplied in chat
and **is not in the repository**: this prompt carries what the next session needs from it, and the measurements below were made by this
session on `685dd22`, not taken from the proposal. **Nothing was read from any legal text for this prompt.** It records no §8 row of its own.
Written in Italian. The author may change it before use.
Updated the same day with the author's four answers (§8, the four rows of 25 Nov 2026 «The documentation simplification programme, …»):
this is **D1**, the first of six sessions of `docs/DOCS-SIMPLIFICATION-PLAN.md`; the questions already answered are removed from D.3, and
D.4 now writes D2's prompt.
-->

SESSIONE D1 (programma di semplificazione della documentazione) — la verità dei documenti (D.1), la mappa delle dipendenze (D.2), le
decisioni dell'autore (D.3)

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`). Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente. **Come prima scrittura**, registra in §8 la riga «The scope of the documentation session» con
le parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande.
Senza quella riga non si scrive nulla.

Leggi, e trattali come vincolanti: **`docs/DOCS-SIMPLIFICATION-PLAN.md` per intero** (il programma D1…D6, le decisioni dell'autore del 25
novembre, le regole di §4 valide per ogni sessione del programma); `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §3 (il livello rosso: tra gli altri
la sezione «Known limitations» del README e la registrazione di una revisione di traduzione); `docs/DATA-GOVERNANCE.md` (una sola casa per
ogni fatto, la derivazione prima della copia); `docs/SESSION-ARCHITECTURE.md` §1 (la Traccia M ha la precedenza alle sue tappe);
`docs/ROADMAP-v2.md` §8, le righe del 22 novembre 2026 (l'alternanza delle sessioni; l'archivio di `docs/HANDOVER.md`, il precedente di questa
sessione) e ogni riga che una correzione cita; `agent/proposals/governance/patterns.mjs` (le ancore); `agent/implement/baseline.mjs` (come la
§12 di `docs/CURRENT-ARCHITECTURE.md` viene letta).

**Il principio di questa sessione**: prima la verità dei documenti, poi la loro autorità, solo alla fine (in una sessione successiva) gli
spostamenti. Qui **nessun file si sposta, si rinomina, si fonde o si cancella.**

## Il punto di partenza (misurato il 25 novembre 2026 su `main` `685dd22`; **rimisura tutto**)

**La superficie.** 205 file `.md` tracciati, 133 sotto `docs/`, 48 prompt in `docs/prompts/`. `AGENTS.md` 64 KB; `docs/ROADMAP-v2.md` 746 KB;
`docs/HANDOVER.md` 78 KB; `docs/archive/HANDOVER-to-2026-11-13.md` 798 KB; `README.md` 27 KB; `docs/PROJECT-CONTEXT.md` 7 KB.

**Affermazioni che non corrispondono più a `main` o a §8** (ciascuna da ricontrollare contro la riga di §8 o il comando che la regge):
- `AGENTS.md` riga 60: «Phase 4 open since 3 Nov 2026, its first item (4.1) not yet written; 5 not started». §8 registra la Fase 4 conclusa
  il 4 nov 2026 e la Fase 5 aperta il 13 nov 2026 (G2, con E5-5 che fallisce ed è dichiarato).
- `docs/PHASE-4-SETUP.md`, intestazione: «its first item, 4.1 (§6), is not yet written».
- `docs/PHASE-4-PLAN.md`, intestazione: «A PROPOSAL, PUT TO THE AUTHOR; IT DECIDES NOTHING UNTIL ROADMAP §8 SAYS SO» (§8 lo ha approvato e la
  fase è conclusa).
- `docs/POST-V2.md` riga 3: «Stato: non aperto. Nessuna sessione è stata avviata e nessuna decisione è stata presa.» §8 registra decisioni del
  5 e dell'11 novembre e l'apertura dello Stadio 2 (G1).
- `README.md` riga 194: «the twelve instruments»; le pagine sotto `instruments/` sono 17. `network.html` e `datasets.html`: verifica se il
  README li elenca.
- `docs/CURRENT-ARCHITECTURE.md` riga 62: `network.html` «`noindex` until measured on a real phone»; è indicizzabile dal 23 nov 2026 (§8,
  «Network-map trials, T.3»).
- **`README.md` riga 429, limitazione 5**: le traduzioni «[have not] been reviewed by a native speaker». Dal 24–25 nov 2026 l'edizione
  italiana è **431/431 approvata dall'autore** (`i18n/review/it.json`, 431 voci, `node tools/i18n-review.mjs status`); francese e spagnolo no.
  **È testo del livello rosso** (§3: «Deleting or rewriting the README's "Known limitations" section»): si propone all'autore, non si scrive.
- `docs/i18n-review/it.md` dice «429 reviewed · 2 stale»: è il foglio generato prima del `record` dell'autore. Rigeneralo
  (`node tools/i18n-review.mjs sheet it`, un agente può farlo) e verifica che dica 0 stringhe da rivedere.
- **`docs/HANDOVER.md` è fermo al 24 novembre** e non registra il lavoro del 24–25 novembre: PR #133 (revisione IT/FR: correzioni e 14
  stringhe tradotte), #135 (la revisione italiana dell'autore e i tre test che presupponevano «nessuna edizione revisionata»), #136 (titolo e
  descrizione di `/it/` accorciati e riapprovati), #137 (l'elenco della figura nascosto su telefono), e la PR che ha portato su `main` questo
  prompt, `docs/DOCS-SIMPLIFICATION-PLAN.md` e le quattro righe di §8 del 25 novembre. Leggi i messaggi di commit e le descrizioni delle PR:
  sono la fonte.
- Il branch `scout/digest-digest-2026-11-23T18-18-06Z` non è in alcun registro.

**Le dipendenze già note** (non solo percorsi: **frasi esatte**):
- `agent/proposals/governance/patterns.mjs` ha 29 ancore `path:`; **9 citano `AGENTS.md`**, 5 l'archivio di HANDOVER, 5
  `docs/SESSION-25-FIRST-REAL-WORLD-RUN.md`, 5 `docs/AUDIT-2026-09-01.md`. Se il testo citato cambia, `node
  agent/proposals/governance/cli.mjs check` dà REFUTED e la CI fallisce (passo «The governance evidence»). Il 22 novembre spostare l'HANDOVER
  in archivio ha richiesto di aggiornare cinque ancore nello stesso commit.
- `tools/validate.mjs` legge `docs/ROADMAP-v2.md`; `.control-room/views.mjs` legge `AGENTS.md`; `agent/ux/surface.mjs` legge `README.md`;
  `agent/implement/baseline.mjs` analizza la §12 di `docs/CURRENT-ARCHITECTURE.md`; `tools/selftest.mjs` copia la ROADMAP.
- La skill `.agents/skills/project-context` impone di leggere cinque documenti a ogni sessione: `PROJECT-CONTEXT.md`, `CURRENT-ARCHITECTURE.md`,
  `AI-SAFE-BOUNDARIES.md`, `HANDOVER.md`, `README.md`.

## Obiettivo

- **D.1 · La verità dei documenti.** Correggi le affermazioni di fatto che contraddicono `main` o §8, **una per una e ciascuna con la sua
  fonte** (la riga di §8, il commit o il comando che la regge), nel commit che la cambia. Si corregge la frase, non si riscrive il documento.
  Il testo del livello rosso (la sezione «Known limitations» del README, la limitazione 5 compresa; `AI-SAFE-BOUNDARIES.md`;
  `AUTONOMY-POLICY.md`; licenza, non affiliazione, assenza di consulenza legale) **si propone all'autore con le parole esatte** e si scrive solo
  dopo la sua riga di §8. Scrivi in `docs/HANDOVER.md` la voce del 24–25 novembre. Rigenera `docs/i18n-review/it.md`. **Checkpoint.**
- **D.2 · La mappa delle dipendenze (sola lettura).** Un rapporto in `docs/` (per esempio `docs/DOCS-DEPENDENCY-MAP.md`), prodotto da uno script
  tenuto fuori dal repository, come le sessioni precedenti hanno fatto con i loro parser: per ogni documento sotto `docs/` e alla radice, chi lo
  legge (codice, workflow, skill, prompt, test), quali sue frasi sono citate (ancore, pin dei test), quali sezioni sono analizzate (la §12),
  la dimensione, e una proposta (non una decisione) di **ciclo di vita** (attivo, storico, superato, chiuso) e di **autorità** (normativo,
  canonico, riferimento). Nessun file spostato. Ciò che lo script non sa classificare si dice.
- **D.3 · Le decisioni all'autore.** Già decise il 25 novembre (§8, non si richiedono): programma continuo D1…D6 con l'alternanza sospesa
  solo per esse; chiusura **entro il 10 gennaio 2027**; si spostano **solo i record chiusi**, in D6; la proposta di ChatGPT è riassunta nel
  piano, §0. Restano le quattro domande di `docs/DOCS-SIMPLIFICATION-PLAN.md` §3, una per decisione, raccomandazione per prima, risposte in
  §8 con le parole dell'autore:
  1. `AGENTS.md`: a che cosa si riduce, e dove vanno le regole che escono (le 9 ancore si aggiornano in D4, nello stesso commit).
  2. La skill `project-context`: una lettura a livelli (i vincoli sempre; le specifiche per dominio quando il compito le chiede) oppure com'è.
  3. Uno stato corrente: un `docs/CURRENT-STATE.md` **generato** da uno strumento (come `_footer.mjs` genera le pagine), oppure nessuno e
     l'intestazione di `HANDOVER.md` come oggi. **Non scritto a mano**: sarebbe una seconda casa (`docs/DATA-GOVERNANCE.md`).
  4. Il controllo della documentazione (D3): uno strumento nuovo o l'estensione di uno esistente (`validate`, `prose-homes`, il controllo di
     governance), e che cosa controlla: link, percorsi, **frasi citate**, intestazioni di stato, conteggi.
  Nulla di D.3 si implementa in questa sessione: si implementa nelle sessioni D3–D5.
- **D.4 · Il prompt di D2** (`docs/DOCS-SIMPLIFICATION-PLAN.md` §2: autorità e catalogo), sul branch, con le risposte di D.3 che lo
  riguardano. Il checkpoint finale approva insieme il lavoro e il prompt.

**Regola d'arresto**: se la sessione si allunga, cadono nell'ordine le domande 4 e 3 di D.3, ciascuna nominata nel prompt di D2; D.1 e D.2 non
cadono. Un controllo rosso si nomina e si decide; non si abbassa.

## Scrivere e verificare

Ogni commit che tocca un file pubblicato porta `Evidence:` (questa sessione non dovrebbe toccarne). Dopo ogni commit che cambia il testo di un
documento citato da un'ancora: `node agent/proposals/governance/cli.mjs check`. Prima di ogni checkpoint: `validate`, `i18n-audit`,
`design-qa`, `seo-audit`, `node tools/_footer.mjs --check`, `node --test tools/selftest.mjs`, `node --test agent/implement/selftest.mjs`
(l'analisi della §12), tutte le suite dell'elenco di `.github/workflows/qa.yml` e `.control-room/`, `node agent/schemas/cli.mjs check`,
`node tools/commit-evidence.mjs <base> HEAD`. L'output dei validatori deve restare quello della base: un avvertimento nuovo è un rilievo.

## Cosa NON fare

- Non spostare, rinominare, fondere o cancellare un documento.
- Non riscrivere né riordinare le righe esistenti di §8: si aggiungono righe.
- Non creare una copia scritta a mano di uno stato che ha già una casa.
- Non toccare `data/`, `i18n/`, `index.html` né le pagine pubblicate: **una frase inglese del brief cambiata rende «da rivedere» la sua
  traduzione italiana approvata e toglie `/it/` dagli indici finché l'autore non la rilegge.**
- Non registrare una revisione di traduzione.
- Non scrivere testo del livello rosso senza la riga di §8.
- Non modificare un'ancora, un pin o un test per farlo passare: se una correzione vera rompe un'ancora, l'ancora si aggiorna nello stesso
  commit e lo si dice.
- Non dedurre uno stato da un documento: lo stato viene da §8, da `main` o da un comando.

Vale «Cosa NON fare» del brief.

## Criterio di uscita e consegna

Completa quando:
- ogni correzione di D.1 è scritta con la sua fonte, oppure proposta all'autore e decisa in §8;
- `docs/HANDOVER.md` registra il lavoro del 24–25 novembre;
- la mappa di D.2 esiste e dice ciò che non sa;
- le decisioni di D.3 sono in §8 con le parole dell'autore;
- validatori, `selftest`, le suite, `.control-room/` e il controllo di governance passano, e ogni avvertimento nuovo è spiegato;
- **il prompt della sessione successiva esiste sul branch, porta questa stessa regola nel suo criterio di uscita ed è approvato con il lavoro;
  senza il prompt non si approva.**

Oppure l'autore decide di fermarsi: anche allora si scrive il prompt della successiva.

**Il calendario del programma**: D6 chiude entro il 10 gennaio 2027 (§8, 25 nov 2026). Se una sessione del programma è in corso il 10
gennaio, si ferma a un checkpoint, ciò che resta va nel suo prompt e il programma riprende dopo il giro delle regole di febbraio 2027.

**La Traccia M ha la precedenza alle sue tappe.** Rimisura la data prima di iniziare:
- `evidence-audit --as-of <oggi>` stampa `STATUS_PREDATES_MILESTONE` dopo le tappe di `ai-act` (2 dic 2026), `pld` (9 dic) ed `eidas2`
  (24 dic); gli stati sono della sessione 25, 25.2 (`docs/prompts/v2-session-25.md`, con l'aggiunta N1).
- La finestra della sessione 25 si apre il 12 gennaio 2027; se si apre mentre questa sessione è in corso, dillo all'autore.
- Le regole (misurato il 25 nov 2026: 33, `last_verified` 1 al 17 nov, 31 al 18 nov, 1 al 23 nov; `RULE_INTERVAL` 90 giorni) scadono intorno al
  15–17 febbraio 2027, `ap-eidas2-01` il 21 febbraio: rimisura con `freshness --as-of` (`docs/prompts/v2-track-m-rules-round-2027-02.md`).

Prima di chiudere, la checklist D.1–D.4: cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
