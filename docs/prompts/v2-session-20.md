<!--
Provenance: the prompt of v2 Session 20, drafted on 3 Nov 2026 after v2 Session 19 was merged (#55, #56), on the
author's request ("What's up for session 20?" → "Yes"). Its scope was put to the author in four questions before
drafting, answered: "Open Phase 4 + item 4.1 (Recommended)"; "Open Phase 4, then 4.1 (Recommended)"; "Session 21, using
4.1 (Recommended)" (group (a), the rules' wording); "New branch + PR (Recommended)". Those answers are recorded in
docs/HANDOVER.md's branch register for this prompt, not in §8: a session's scope is recorded in §8 by the session
itself, in the author's words, as its first write. Drawn from docs/ROADMAP-v2.md §8 (v2 Session 17.5, questions 4,
6, 7, 8a, 8b and the checkpoint); docs/PHASE-4-SETUP.md §1, §2.2, §5 and §6; docs/PHASE-3-AUDIT.md §5. The starting
state was measured on `main` at 943467d on 3 Nov 2026. The decisions live in those rows and nowhere else; this file is
the instruction text that cites them. Written in Italian, as the author's session prompts are. The author may change
it before use.
-->

SESSION 20 — L'apertura della Fase 4 e la voce 4.1: il processo di manutenzione delle regole scritto come processo manuale, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite
(su un clone superficiale `agent/proposals/governance/selftest.mjs` fallisce e la prontezza aggiunge due bloccanti; non è
un difetto dell'albero). **E-5 si misura solo su un clone completo.**

Verifica che `main` contenga la sessione 19 e questo prompt:
- `docs/ROADMAP-v2.md` §8 ha la riga «The checkpoint of v2 Session 19 = item 19.1, the site name» e, sotto, la riga
  sull'`alternateName` («v2 Session 19, after the checkpoint»);
- `docs/PHASE-4-SETUP.md` §5 (E-1…E-6) e §6 (la voce 4.1) esistono, e §8 ha «v2 Session 17.5, 17.5.0 question 8b»;
- `docs/prompts/v2-session-20.md` esiste.

Se manca qualcosa, fermati e segnalalo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 20» con le parole con cui
l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande.
Senza quella riga non si scrive nulla, nemmeno in `docs/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso: `origin/scout/digest-digest-2026-11-02T16-04-07Z` (nel registro, lasciato aperto per
decisione dell'autore), e il branch di questo prompt se la sua PR non è ancora unita.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2-session-20-phase-4`. Non lavorare su
`main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, in particolare la Fase 4 («prima di automatizzare, rendi trasparente il processo manuale») e
   «Cosa NON fare».
2. `docs/ROADMAP-v2.md` §4 (la Fase 4: condizione d'ingresso e prima voce) e §8, le righe della sessione 17.5 (domande
   6, 7, 8a, 8b e il checkpoint).
3. `docs/PHASE-4-SETUP.md` per intero: l'inventario P-01…P-13 (§1), i tre livelli e la loro assegnazione (§2.1, §2.2),
   D-5 rinviata (§4), la condizione d'ingresso (§5), la voce 4.1 (§6), ciò che non stabilisce (§7).
4. `docs/PHASE-3-AUDIT.md` §5: i due controlli di manutenzione (`RULE_STALE`, T-12 `LAW_CHANGED_SINCE_VERIFIED`) e le
   loro date.
5. `docs/AUTONOMY-POLICY.md` e `docs/AI-SAFE-BOUNDARIES.md`: la Fase 4 non cambia le classi; nulla qui è automatico.
6. `docs/HANDOVER.md`: il rapporto della sessione 19.

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e attendi
conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**Due voci, ciascuna con il suo checkpoint, in quest'ordine.**

- **20.1 · L'apertura della Fase 4.** E-5 rimisurato su un clone completo; E-1…E-4 verificati sulle loro righe di §8;
  poi la domanda all'autore se aprire la Fase 4. **La Fase 4 si apre solo con la sua risposta**, registrata in §8.
  Checkpoint 20.1; la 20.2 non comincia prima della sua approvazione.
- **20.2 · La voce 4.1.** Il processo di manutenzione delle regole (P-08 → P-09 → P-10 → P-11 → P-12 → P-13) scritto
  come un unico documento in `docs/`, ogni passo con il suo livello e la traccia che lascia; provato una volta sui
  record con `--as-of 2027-03-26` contro il T-12 di `ap-cra-01`, nessuna regola cambiata. Checkpoint finale.

**Nulla fuori da `docs/` cambia in questa sessione (E-6).** Nessun codice, nessun dato, nessun controllo, nessuna
pagina.

## Lo stato di partenza

Misurato il 3 novembre 2026 su `main` a `943467d`. **Rimisura tutto.**

| Fatto | Misura del 3 novembre 2026 |
|---|---|
| E-1 Fase 3 | chiusa (§8, «v2 Session 17.5, 17.5.0 question 1») |
| E-2 D-4 | decisa: *machine check*, *human attestation*, *human authorship*, senza lettere (§8, domanda 6) |
| E-3 inventario | approvato con i livelli di §2.2; la premessa di §0 decisa «by principle» (§8, domande 6 e 8a) |
| E-4 D-5 | rinviata con la ragione (§8, domanda 7) |
| E-5 base | misurata soddisfatta nella 17.5; **da rimisurare** sull'albero di oggi (dopo le sessioni 18 e 19) |
| E-6 | una proprietà della voce: 4.1 scrive solo in `docs/` |
| Le 33 regole | tutte `last_verified` 2026-10-29; `freshness --as-of 2027-01-27` nessun `RULE_STALE`, `--as-of 2027-01-28` 33 `RULE_STALE` (intervallo di 90 giorni) |
| T-12 | `evidence-audit --as-of 2027-03-26`: `! LAW_CHANGED_SINCE_VERIFIED applicability/ap-cra-01: cites cra, amended by ehds (rel-ehds-cra-amends), whose tl-ehds-2027-03-26-application (2027-03-26) is after last_verified 2026-10-29` |
| P-08…P-13 | scritti oggi solo come prosa nelle righe di §8 e nei `verification_note` delle regole; cinque volte eseguiti da sessioni (13–17) |

## 20.0 · Le domande all'autore

**Una ricognizione in sola lettura prima**, che rimisura la tabella sopra; poi le domande, **una per volta, con lo
strumento di domande**, la raccomandazione in prima posizione e la motivazione nella domanda; ogni risposta in §8 con le
parole dell'autore, committata subito. Almeno:

**Per la 20.1:**
1. **Aprire la Fase 4**, con E-1…E-6 mostrati criterio per criterio, ciascuno con la misura di oggi e il comando che la
   produce. Se E-5 fallisce, non si chiede: si riporta il fallimento e la sessione si ferma al checkpoint 20.1.
2. **Gli stati dei documenti** che l'apertura tocca (l'intestazione di `docs/ROADMAP-v2.md`, la riga di `AGENTS.md`
   sulla roadmap e su `docs/PHASE-4-SETUP.md`, lo stato di quest'ultimo, l'«Last updated» di `docs/HANDOVER.md`):
   prima e dopo, parola per parola, approvati in una domanda.

**Per la 20.2:**
3. **Il nome e il posto del documento** (proposta: `docs/RULE-MAINTENANCE.md`) e la sua struttura: un passo per
   processo, e per ciascuno il chi, l'innesco, l'azione, il livello (D-4), la traccia, ciò che nessun controllo vede.
4. **Il punto in cui un passo si chiude senza cambiare la regola** («riletta il D, nessun cambiamento»): oggi non ha
   altra forma che un nuovo `last_verified` (`docs/PHASE-4-SETUP.md` §2.2, P-11). Il documento lo descrive come lo fa
   oggi la pratica, **senza** proporre un campo nuovo; la forma di attestazione è la voce successiva, non questa.
5. **Il resoconto della prova** (`--as-of 2027-03-26`, `ap-cra-01`): dove sta (nel documento o nel rapporto in
   `docs/HANDOVER.md`) e che cosa dice di non aver fatto — nessuna rilettura reale, nessuna regola cambiata, la rete
   usata o no.

Una premessa che una domanda non nomina si chiede a parte.

## 20.1 · Scrivere e verificare

- Rilancia tutto come misura, su un clone completo, e salva gli output su file: `validate`, `i18n-audit`, `design-qa`,
  `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`, `tools/og-image.mjs --check`; le 25 suite
  (con `BROWSER_QA_CHROME` sul Chromium dell'ambiente), la suite browser con `--require-browser`, il gate avversariale,
  `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`, `agent/production/cli.mjs readiness`
  (riportata, **non** un criterio: §5 di `docs/PHASE-4-SETUP.md`).
- Le righe di §8 e gli stati dei documenti, solo come approvati.

## 20.2 · Scrivere e provare

- Il documento descrive ciò che si fa, non ciò che si vorrebbe: ogni passo si appoggia su una riga di §8, un comando o
  un file esistenti, citati. **Nessun fatto giuridico nuovo**: gli esempi usano ciò che i record già dicono.
- La prova: esegui `node tools/evidence-audit.mjs --as-of 2027-03-26` e `node tools/freshness.mjs --as-of 2027-03-26`,
  e percorri i passi del documento su `ap-cra-01` fino al punto in cui una persona dovrebbe leggere il testo; registra
  dove il documento era chiaro, dove no, e ciò che hai dovuto supporre. **Non rileggere la legge per davvero e non
  cambiare la regola.** Un passo che la prova mostra sbagliato si corregge nel documento e si dice.
- Leggi il `git diff` completo prima di ogni commit; `git diff --stat main` deve toccare solo `docs/` e `AGENTS.md`
  (se la domanda 2 lo approva).

## Checkpoint

- **20.1:** il rapporto in `docs/HANDOVER.md` con E-1…E-6 e le misure, la risposta dell'autore e i conteggi. Attendi
  l'approvazione esplicita, registrata in §8.
- **20.2 (finale):** il rapporto sul modello di quello della sessione 19: le decisioni con i commit; il documento e la
  prova; ciò che non è stato verificato e perché; i rilievi nuovi, non corretti; la checklist (20.0–20.2) e come
  controllare a mano. Riscarica `origin/main` subito prima dell'ultima scrittura di `docs/HANDOVER.md`. Attendi
  l'approvazione, poi chiedi se aprire una pull request verso `main` e registra la sorte del branch. **Non pushare sul
  branch dopo aver aperto la PR.**
- Il prompt della sessione 21 si scrive solo se l'autore lo chiede. L'autore ha già indicato che la sessione 21 è quella
  di manutenzione delle regole (gruppo (a) della domanda 4 della 17.5: F-02, F-03, F-04, F-13, F-14, F-17, F-19, F-20,
  F-23), prima del **28 gennaio 2027**, e che userà il processo scritto in 4.1.

## Cosa NON fare in questa sessione

- Non automatizzare alcun passo; non aggiungere un campo, una forma di attestazione, un controllo o un comando. La forma
  di *human attestation* per P-08/P-11 è la voce successiva, non questa.
- Non toccare una regola, un dato, una pagina, un generatore o una traduzione; non rileggere la legge per cambiare una
  regola. Il gruppo (a) è della sessione 21.
- Non riaprire D-5; non scegliere, installare o configurare un CMS; non toccare `ALLOWED_RUNTIME_ORIGINS`, la
  concessione di autonomia, i dispatcher, la prontezza.
- Non correggere i rilievi aperti della sessione 18 (il titolo di eIDAS2, le intestazioni degli altri strumenti,
  `docs/v2-design/status-labels.json`) né la stringa «EUDigitalPolicy» rimasta nel rapporto della sessione 19 in
  `docs/HANDOVER.md`: l'autore li ha lasciati fuori. Segnalali nel rapporto se ancora veri.
- Non scrivere l'ambito della Fase 5: si scrive dopo il checkpoint della Fase 4 (§8, domanda 5 della 17.5).
- Non abbassare gate, validator, test o limiti di pubblicazione; non toccare la licenza né il testo di non affiliazione o
  di assenza di consulenza legale; non scrivere nel README.
- Non riscrivere la storia di `main`, né forzare un push.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–19 (da `docs/HANDOVER.md`; non ripeterle)

- **Ciò che si dice all'autore va misurato e citato esattamente.** Conta prima di scrivere «l'unico», «tutti»,
  «nessuno» (sessione 18, V2C-29).
- **Un controllo può fissare ciò che cambi** (N1, S2, `seo-audit.mjs:334`, S4b nella sessione 19): cercalo prima di
  scrivere.
- **Una premessa può essere inesatta**: rimisurala e dillo nella domanda.
- **Un difetto che il lavoro espone si porta all'autore**: né corretto in silenzio, né lasciato in silenzio.
- **Un clone superficiale non è un albero difettoso**: controlla `--is-shallow-repository` prima delle suite.
- **Una domanda d'ambito precede il prompt** (sessione 19: una domanda posta prima di leggere il prompt in `main` ne ha
  proposto un ambito diverso). Leggi questo prompt prima di chiedere qualunque cosa.
- **Branch e merge.** Non pushare su un branch dopo aver aperto la sua PR (la correzione della sessione 19 è andata su un
  branch nuovo, #56); `main` può muoversi durante la sessione: riscarica prima dell'ultima scrittura.
- **Riavvii del worker.** Registra ogni risposta in §8 e committa subito; salva gli output su file; ferma un server per
  PID.
- **Nessun output di agenti in `agent/records/`.**

## Criterio di uscita e consegna

La sessione è completa quando: la Fase 4 è aperta da una riga di §8 nelle parole dell'autore, con E-1…E-6 misurati; il
documento della 4.1 esiste, ogni passo nomina il suo livello e la sua traccia, ed è stato provato una volta su
`ap-cra-01` con `--as-of 2027-03-26` senza cambiare alcuna regola; entrambi i checkpoint sono approvati. Oppure E-5
fallisce, e la sessione si ferma al checkpoint 20.1 con il fallimento riportato. Oppure l'autore decide di fermarsi.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (20.0–20.2) indica:
- cosa è stato scritto (file, righe di §8, commit);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
