<!--
Provenance: the prompt of v2 Session 22, REVISED on 4 Nov 2026 on `claude/v2-phase-4-plan`, after v2 Session 21 was
merged (#60). The version merged in #60 (git history, `0b0f0ae`) scoped Session 22 as the re-reading of the 25 remaining
rules and the comparison of 98 Article headings, on the author's three answers in v2 Session 21 ("25 rules + headings
(Recommended)"; "By instrument + stop rule (Recommended)"; "Final batch, first to drop (Recommended)"). On the author's
request of 4 Nov 2026 ("I want you to conceive the sessions needed to conclude phase 4 efficiently and effectively") the
plan of `docs/PHASE-4-PLAN.md` replaces that scope, and the reading of the 25 rules and the headings moves to Sessions
23 and 24, as the plan's §3 sets out. The author's four answers to the questions put with the plan: the order,
"Attestation first (Recommended)"; where the attestation lives, "In data/ (Recommended)"; the optional items, "Reading
packet, §8 well-formed check (P-10), Notice check (P-07)"; the route, "Follow-up PR after #60 (Recommended)". The
exit criteria X-1…X-5 and the out-list of the plan are approved only by the §8 row that cites it. The starting state was
measured on `main` at `959e08d` on 4 Nov 2026, full clone. Drawn from docs/PHASE-4-PLAN.md (all of it);
docs/PHASE-4-SETUP.md §1, §2.2, §3; docs/RULE-MAINTENANCE.md; docs/ROADMAP-v2.md §8 (v2 Session 21, every row); docs/
HANDOVER.md (the reports of v2 Session 21). The decisions live in those rows and nowhere else; this file is the
instruction text that cites them. This prompt records no §8 row of its own and does not open the session: v2 Session 22
records its scope in §8 as its first write. Written in Italian, as the author's session prompts are. The author may
change it before use.
-->

SESSION 22 — La forma dell'attestazione umana per la lettura delle regole (P-08, P-11): disegno, implementazione, tabella
delle disposizioni e il prompt della sessione 23, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

Verifica che `main` contenga la sessione 21, il piano e questo prompt:
- `docs/PHASE-4-PLAN.md` esiste, con le tre sezioni che questa sessione usa: §1 (i criteri di uscita X-1…X-5), §3 (le
  sessioni) e §5 (i rischi);
- `docs/ROADMAP-v2.md` §8 ha le righe della sessione 21 fino al suo checkpoint finale, e **la riga che approva il
  piano** (se manca, il piano non è approvato: fermati e chiedi);
- `docs/RULE-MAINTENANCE.md` contiene le tre premesse decise e le tre correzioni del primo uso;
- `tools/selftest.mjs` contiene la lista `READ_2026_11_04` con otto regole;
- `docs/prompts/v2-session-22.md` esiste.

Se manca qualcosa, fermati e segnalalo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 22» con le parole con cui
l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande.
Senza quella riga non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md` (atteso: `origin/scout/digest-digest-2026-11-02T16-04-07Z`, nel registro).

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2-session-22-attestation`. Non lavorare su
`main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare».
2. `docs/PHASE-4-PLAN.md` per intero: **è il piano che questa sessione esegue**.
3. `docs/PHASE-4-SETUP.md` §1 (l'inventario P-01…P-13), §2.2 (i livelli per processo), §3 (che cosa la fase lascia).
4. `docs/RULE-MAINTENANCE.md` per intero: i passi 1–6 sono il processo di cui la forma è l'attestazione.
5. `docs/ROADMAP-v2.md` §8: le righe della sessione 21 (le tre premesse; i pin di `selftest`; la regola permanente).
6. `docs/AI-SAFE-BOUNDARIES.md` e `docs/AUTONOMY-POLICY.md`: un campo nuovo in `data/*.json` è Classe C e si scrive solo
   sulla parola dell'autore; un controllo nuovo in `tools/` è verde.
7. Il `$description` di `data/applicability.json`, e `docs/V2-DATA-DESIGN.md` per il modo in cui i campi delle regole
   sono descritti e controllati.
8. `docs/HANDOVER.md`: i rapporti della sessione 21.

Se ritieni che una decisione del brief, del piano o di §8 vada rivista, segnalalo e attendi conferma. Non
reinterpretare in silenzio.

## Obiettivo della sessione

**Cinque voci, in quest'ordine; un checkpoint dopo la 22.1, uno dopo la 22.2, uno finale.**

- **22.1 · Il disegno, solo `docs/`.** La forma dell'attestazione umana per P-08 e P-11: che cosa dichiara chi ha letto,
  dove sta su una regola (`data/applicability.json`, come l'autore ha deciso), come si accoppia a `last_verified` e a
  `verification_note` **senza che nessun fatto abbia due case** (`AGENTS.md`: una casa per fatto), quali controlli
  offline la accompagnano e che cosa non possono vedere. Scrivi `docs/ATTESTATION-FORM.md`, che dice anche che la forma
  non dimostra che la legge sia stata letta (`docs/AUDIT-2026-09-01.md` F-12). **Prova su carta** contro le otto
  chiusure reali della sessione 21 (le loro note, riscritte come se la forma ci fosse stata): dove la forma non basta, lo
  si dice. Checkpoint 22.1: la 22.2 non comincia prima della sua approvazione.
- **22.2 · L'implementazione (Classe C).** Il campo, la sua validazione, i controlli, `tools/selftest.mjs`; **prima, ogni
  consumatore** di `verification_note` e dei campi della regola (misurali: almeno `tools/_refsweep.mjs`, `agent/schemas`,
  `agent/integrate`, `agent/improve`, `js/applies.js`, i pin di `selftest`). **Solo in avanti**: le 33 note esistenti
  restano prosa, nessun backfill (piano §2). Checkpoint 22.2.
- **22.3 · La tabella X-1**, solo `docs/`: per ciascuno dei tredici processi di `docs/PHASE-4-SETUP.md` §1, la
  disposizione (un controllo esiste e si nomina; esiste un'attestazione strutturata; resta manuale, con la ragione;
  fuori dalla fase, con la ragione). Una riga per processo, approvata in §8.
- **22.4 · Le voci facoltative**, ciascuna con la sua domanda e **ciascuna la prima a cadere** se la sessione si allunga
  (piano §3, regola d'arresto): (a) il *pacchetto di lettura* — una vista derivata, offline, che per una regola elenca
  CELEX e Articoli da leggere dal suo record; (b) il controllo della buona formazione di `docs/ROADMAP-v2.md` §8 (P-10);
  (c) il controllo delle clausole fattuali dell'avviso di `applies.html` (P-07). Nessuna fa una richiesta di rete.
- **22.5 · Il prompt della sessione 23** — **la regola permanente di §8 (4 nov 2026)**: l'ultima voce, prima del
  checkpoint finale. L'ambito della sessione 23 chiesto all'autore; le risposte nella provenienza con le sue parole;
  `docs/prompts/v2-session-23.md` scritto su questo branch, nella stessa PR. **Il checkpoint finale approva insieme il
  lavoro e il prompt; senza il prompt non si approva.**

**Regola d'arresto:** se la sessione si allunga, cadono nell'ordine (1) le voci 22.4, (2) la tabella 22.3, che apre la
sessione 23; la 22.1 e la 22.2 non si spostano. Ciò che cade va, per nome, nel prompt della sessione 23.

## Lo stato di partenza

Misurato il 4 novembre 2026 su `main` a `959e08d`, clone completo. **Rimisura tutto.**

| Fatto | Misura del 4 novembre 2026 |
|---|---|
| Le regole | 33; 25 con `last_verified` 2026-10-29, 8 con 2026-11-04 (`ap-nis2-01`, `ap-nis2-02`, `ap-cra-01`, `ap-ai-act-02`, `ap-ai-act-06`, `ap-gdpr-04`, `ap-dsa-03`, `ap-dma-04`) |
| Scadenze | `freshness --as-of 2027-01-27` 0 `RULE_STALE`; `2027-01-28` 25; `2027-02-03` 33 |
| T-12 | `evidence-audit --as-of 2027-03-26`: solo `ap-cra-01` |
| Test | `selftest` 124/124; 25 suite 1330 pass, 0 fail; browser 343 pass, 1 indecidibile |
| La forma | non esiste: l'attestazione è prosa in `verification_note` e nelle righe di §8 (`docs/PHASE-4-SETUP.md` §2.2) |
| Da leggere nelle sessioni 23 e 24 | 25 regole: gdpr 4 (con `ap-cross-01`), dsa 4, dma 3, ai-act 5, data-act 4 (**20** in tutto, sessione 23); nis2 1, dora 2, pld 1, eidas2 1 (**5**, sessione 24); 98 intestazioni in 15 strumenti (50 + 23 + 25, piano §3) |
| Rete | Cellar e SPARQL raggiungibili con `Accept-Language: eng`; il CELEX di una rettifica va codificato (`R%28NN%29`) |

## 22.0 · Le domande all'autore

**Una ricognizione in sola lettura prima**, che rimisura la tabella; poi le domande, **una per volta, con lo strumento
di domande**, la raccomandazione in prima posizione e la motivazione nella domanda, ogni risposta in §8 con le parole
dell'autore, **committata subito**.

**Prima della prima domanda sulla forma, misura** (e riportalo nella domanda): quanti dei `sources[].locator` delle 33
regole un analizzatore deterministico risolve in Articoli (piano §5, secondo rischio); un controllo che non sa risolvere
certi locator lo dice, non li salta in silenzio.

**Per la 22.1**, almeno: i campi della forma (che cosa è dichiarazione e non derivabile; che cosa si accoppia a `last_verified`
senza copiarlo); il valore «esito» (modificata / chiusa senza modifica) e il suo legame con la riga di §8; che cosa
succede a una regola con `last_verified` successivo all'introduzione della forma e senza attestazione (un controllo che
la segnali è la versione offline di «un `last_verified` senza nota è un avviso silenziato», `docs/RULE-MAINTENANCE.md`
§4); la data da cui la forma vale; se `js/applies.js` la mostra. Il testo esatto del documento, prima e dopo, approvato
in una domanda.

**Per la 22.2**: i controlli nominati uno per uno con il caso che li fa fallire; **i pin di `selftest`** che cambiano,
esatti, mai allentati. **Per la 22.3**: la tabella, riga per riga. **Per la 22.4**: una domanda per voce, con la misura
del costo.

Una premessa che una domanda non nomina si chiede a parte.

## Scrivere

- Le righe di §8 prima di `data/`, `tools/` o altro. Un campo nuovo, un controllo, una modifica di `data/` solo dopo la
  parola dell'autore.
- **Dopo ogni modifica di codice o di dati: `node tools/validate.mjs`, `node tools/seo-audit.mjs`, `node
  tools/selftest.mjs` e le 25 suite, prima del commit.** Dopo ogni `data/`: `node tools/_footer.mjs` e commit di ciò che
  scrive. Ogni commit che cambia un file pubblicato porta `Evidence:`.
- Nessuna richiesta di rete in nessuno strumento nuovo; nessun comando che interroghi Cellar o SPARQL.
- Un controllo nuovo prova il caso che deve far fallire (un test che lo pianta), come i controlli esistenti in
  `tools/selftest.mjs`.
- Prima di ogni checkpoint, rilancia tutto e salva gli output: `validate`, `i18n-audit`, `design-qa`, `evidence-audit
  --as-of <oggi>` e `--as-of 2027-03-26`, `freshness --as-of <oggi>`, `2027-01-28` e `2027-02-03`, `seo-audit`,
  `tools/og-image.mjs --check`; le 25 suite (con `BROWSER_QA_CHROME`), la suite browser con `--require-browser`, il
  gate avversariale, `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`; la prontezza, letta
  fino in fondo; `node tools/commit-evidence.mjs <base> HEAD`.

## Checkpoint

- **22.1:** il rapporto in `docs/HANDOVER.md`: il documento, il prima/dopo, la misura dei locator, la prova su carta
  contro le otto chiusure, ciò che la forma non vede. Attendi l'approvazione, registrata in §8.
- **22.2:** il rapporto: i consumatori trovati, i controlli con il caso che li fa fallire, i pin cambiati, i commit, i
  conteggi. Attendi l'approvazione, registrata in §8.
- **Finale (22.3 + 22.4 + 22.5):** la tabella X-1; le voci facoltative fatte o cadute, per nome; il prompt della sessione
  23 (percorso, commit, risposte dell'autore); ciò che non è stato verificato e perché; i rilievi nuovi, non corretti;
  la checklist (22.0–22.5). Riscarica `origin/main` subito prima dell'ultima scrittura di `docs/HANDOVER.md`. **Senza
  il prompt della sessione 23 non si chiede l'approvazione.** Poi chiedi se aprire una pull request verso `main` e
  registra la sorte del branch. Non pushare dopo aver aperto la PR.

## Cosa NON fare in questa sessione

- Non leggere né chiudere nessuna delle 25 regole: è la sessione 23. Non toccare le otto del 4 novembre, gli stati degli
  strumenti, il gruppo (d) (F-18, F-27), i rilievi nuovi della sessione 21 né i quattro titoli generici.
- Non fare un backfill delle 33 note esistenti nella forma nuova (piano §2). Non riscrivere una nota.
- Non automatizzare un passo di lettura: la forma *dichiara*, non *legge*. Nessuno strumento fa una richiesta di rete.
- Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale,
  `ALLOWED_RUNTIME_ORIGINS`; non scegliere né installare un CMS (D-5 si decide in sessione 24); non rinnovare la
  concessione di autonomia (scade il 9 marzo 2027: segnalalo); non scrivere l'ambito della Fase 5.
- Non creare un secondo posto per un fatto che `data/` già tiene (la data della lettura è `last_verified`; gli Articoli
  citati sono nei `locator`). Non cambiare un `claim_type`; non togliere un asterisco, un `reference_gap`, un
  `requires_verification` o una `verification_note` senza la parola dell'autore.
- Non abbassare gate, validator, test o limiti: un pin di `selftest` si aggiorna esattamente, sulla parola dell'autore.
  Non toccare licenza, non affiliazione, assenza di consulenza legale, README; non modificare a mano un file sotto
  `instruments/`.
- Non riscrivere la storia di `main`, né forzare un push; non riscrivere un rapporto passato (si annota).
- Vale in pieno «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–21 (da `docs/HANDOVER.md`; non ripeterle)

- **`selftest` fissa ciò che cambi.** Nella sessione 21 il branch è rimasto rosso per quattro chiusure perché non lo si
  era lanciato; cinque test fissavano la data del 29 ottobre. Qui il campo nuovo ha più consumatori: trovali prima,
  lancia tutto dopo ogni modifica.
- **Conta prima di scrivere.** Nella preparazione di questo piano un conteggio (17 regole, 41 intestazioni) era sbagliato
  (20 e 50): è stato ricontato prima del commit. Ciò che si dice all'autore va misurato e citato esattamente.
- **Una sostituzione che fallisce non deve finire in un commit che la dichiara** (sessione 21, `c9b8eef`/`7917a09`):
  conta le occorrenze prima, concatena con `&&`.
- **Un controllo può fissare ciò che cambi** (`validate.mjs:514` lega `status_as_of` e `last_verified`): cercalo prima.
- **Non dichiarare una correzione che non hai fatto**; un difetto che il lavoro espone si porta all'autore; una
  premessa può essere inesatta: rimisurala e dillo nella domanda.
- **Cellar** risponde 400 senza `Accept-Language: eng` e 404 a un CELEX di rettifica non codificato.
- **Riavvii del worker** (cinque nella sessione 21, nessuna risposta persa): ogni risposta in §8 e committata subito;
  output su file; un «Internal Server Error» al push si ritenta con attesa crescente.
- **Un clone superficiale non è un albero difettoso.** **Nessun output di agenti in `agent/records/`.**

## Criterio di uscita e consegna

La sessione è completa quando: la forma è disegnata (`docs/ATTESTATION-FORM.md`), implementata con i suoi controlli e il
caso che li fa fallire, e approvata ai due checkpoint; la tabella X-1 ha una riga per ciascuno dei tredici processi,
approvata in §8; le voci 22.4 sono fatte o cadute per nome; `selftest` e le 25 suite passano; **il prompt della sessione
23 esiste su questo branch, porta la stessa regola nel suo criterio di uscita, ed è approvato con il lavoro** (regola
permanente di §8, 4 nov 2026). Oppure l'autore decide di fermarsi: anche allora, **prima di chiudere, si scrive il prompt
della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (22.0–22.5) cosa è stato scritto (file, righe di
§8, commit), come verificarlo a mano, se esiste un test automatico e dove (suite e nome del test), quale criterio di
uscita soddisfa. Se un punto non è completo, dichiaralo.
