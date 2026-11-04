<!--
Provenance: the prompt of v2 Session 23, drafted on 4 Nov 2026 in v2 Session 22 (item 22.5), on `claude/session-22-o5cl9k`,
under the standing rule of docs/ROADMAP-v2.md §8 (4 Nov 2026): the next session's prompt is a precondition of closing a
session's work, and is approved with it at the final checkpoint. Scope from docs/PHASE-4-PLAN.md §3 (S23), approved in §8
("The plan to conclude Phase 4"). The author's answers to the four questions put while drafting it, in the author's words:
the checkpoints, "Three batches (Recommended)"; the stop rule, "Headings first, then batch 3 (Recommended)"; the selftest
pins, "One growing list, asked at S23's start (Recommended)"; this session's two open findings, "(2) in S23's prompt, (1) to
S24 (Recommended)". Drawn from docs/PHASE-4-PLAN.md (§1, §1a, §3, §4); docs/ATTESTATION-FORM.md (all of it);
docs/RULE-MAINTENANCE.md (steps 1–6, with the additions A–F of v2 Session 22); docs/ROADMAP-v2.md §8 (v2 Sessions 21 and
22, every row); docs/HANDOVER.md (the reports of v2 Session 22). The starting state was measured on the branch of v2
Session 22 on 4 Nov 2026, full clone. The decisions live in those rows and nowhere else; this file is the instruction
text that cites them. It records no §8 row of its own and does not open the session: v2 Session 23 records its scope in
§8 as its first write. Written in Italian, as the author's session prompts are. The author may change it before use.
-->

SESSION 23 — La prima tornata di lettura: 20 regole chiuse nella forma nuova e 50 intestazioni confrontate con la Gazzetta
ufficiale, in tre lotti, e il prompt della sessione 24, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

Verifica che `main` contenga la sessione 22:
- `docs/ATTESTATION-FORM.md` esiste; `tools/attestation-audit.mjs` e `tools/notice-audit.mjs` esistono e
  `node tools/validate.mjs` li esegue;
- `docs/PHASE-4-PLAN.md` ha il §1a (la tabella X-1, tredici righe);
- `docs/ROADMAP-v2.md` §8 ha le righe della sessione 22 fino al suo checkpoint finale;
- `node tools/attestation-audit.mjs packet ap-gdpr-01` stampa un pacchetto di lettura;
- `docs/prompts/v2-session-23.md` esiste.

Se manca qualcosa, fermati e segnalalo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 23» con le parole con cui
l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande.
Senza quella riga non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2-session-23-reading`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare».
2. `docs/PHASE-4-PLAN.md` §1, §1a, §3, §4: questa sessione è la S23.
3. `docs/ATTESTATION-FORM.md` per intero: **la forma che ogni chiusura scrive**, i controlli A-1…A-8 e ciò che non vedono.
4. `docs/RULE-MAINTENANCE.md` per intero: i passi 1–6, con le aggiunte A–F della sessione 22.
5. `docs/ROADMAP-v2.md` §8: le righe delle sessioni 21 e 22 (le tre premesse; la forma, Q1–Q12; le voci 22.3 e 22.4).
6. `docs/HANDOVER.md`: i rapporti della sessione 22.

Se ritieni che una decisione del brief, del piano o di §8 vada rivista, segnalalo e attendi conferma. Non
reinterpretare in silenzio.

## Obiettivo della sessione

**Le 20 regole che scadono il 28 gennaio 2027 e non sono della sessione 24, ciascuna chiusa nella forma nuova — i primi
usi reali della forma (X-2, ultima clausola) — e le 50 intestazioni degli Articoli dei loro strumenti, confrontate con il
testo della Gazzetta ufficiale.** Tre lotti, un checkpoint dopo ciascuno («Three batches (Recommended)»):

- **23.1 · GDPR e trasversale** — `ap-gdpr-01`, `ap-gdpr-02`, `ap-gdpr-03`, `ap-cross-01` (4 regole); le 18 intestazioni del
  GDPR. Il lotto più piccolo, perché il primo uso reale della forma si riveda prima del grosso.
- **23.2 · DSA e DMA** — `ap-dsa-01`, `ap-dsa-02`, `ap-dsa-04`, `ap-dsa-05`, `ap-dma-01`, `ap-dma-02`, `ap-dma-03` (7
  regole); le 16 intestazioni del DSA e le 9 del DMA.
- **23.3 · AI Act e Data Act** — `ap-ai-act-01`, `ap-ai-act-03`, `ap-ai-act-04`, `ap-ai-act-05`, `ap-ai-act-07`,
  `ap-data-act-01`, `ap-data-act-02`, `ap-data-act-03`, `ap-data-act-04` (9 regole); le 7 intestazioni del Data Act (quelle
  dell'AI Act sono state confrontate nella sessione 18).
- **23.4 · Il prompt della sessione 24** — **la regola permanente di §8 (4 nov 2026)**: l'ultima voce, prima del
  checkpoint finale. L'ambito della sessione 24 chiesto all'autore; le risposte nella provenienza con le sue parole;
  `docs/prompts/v2-session-24.md` scritto su questo branch, nella stessa PR. **Il checkpoint finale approva insieme il
  lavoro e il prompt; senza il prompt non si approva.**

**Regola d'arresto** («Headings first, then batch 3 (Recommended)»): se la sessione si allunga, cadono nell'ordine (1) le
intestazioni del lotto non ancora iniziato, (2) le regole del lotto 23.3. I lotti 23.1 e 23.2 non si spostano. Ciò che cade
va, per nome, nel prompt della sessione 24, prima del 28 gennaio 2027 (la sessione 25 è il margine). Fissato da §8 e non
chiesto: **una regola i cui testi citati non sono stati letti tutti non si chiude e la sua data non si muove** (premessa
1 della sessione 21; ora anche A-4).

## Come si chiude una regola (per ciascuna delle 20)

I passi 1–6 di `docs/RULE-MAINTENANCE.md`, con la forma:

1. **`node tools/attestation-audit.mjs packet <id>`**: elenca i testi (per `source_id` e CELEX) e gli Articoli che A-4
   richiederà, i testi da interrogare per A-5, le fonti di secondo livello, ciò che A-8 non può controllare. **Il pacchetto
   non è una lettura** e non porta uno scheletro di attestazione: non copiarlo nella forma senza aver letto.
2. Leggi ogni Articolo elencato nel testo della Gazzetta ufficiale preso da Cellar per CELEX (`Accept-Language: eng`; il
   CELEX di una rettifica codificato, `R%28NN%29`); interroga SPARQL per ogni testo che A-5 richiede, **compreso un atto
   modificativo che la regola cita**: per `ap-ai-act-01`, `-04`, `-05` e `-07` anche l'AI Omnibus (`src-eurlex-ai-omnibus`),
   come la prova su carta della sessione 22 ha mostrato (`docs/ATTESTATION-FORM.md` §5; «(2) in S23's prompt»).
3. Ciò che cambierebbe la regola va all'autore, una domanda per volta, in §8 con le sue parole, committato subito.
4. Chiudi: nella stessa modifica `last_verified` nuovo, `verification_note` riscritta (con il CELEX di ogni testo di primo
   livello letto, A-7) e **`attestation`** con `of` uguale a `last_verified`, `read`, `queried`, `outcome` e i titoli §8
   delle decisioni. Una lettura incompleta non scrive nulla in `data/`.
5. `node tools/validate.mjs` (A-1…A-8, N-0…N-4, i titoli di §8), `node tools/selftest.mjs`, `node tools/_footer.mjs` e
   commit di ciò che scrive.
6. Commit con `Evidence:` (la chiusura cambia un file pubblicato).

**Le intestazioni.** Per ciascuno strumento del lotto, confronta ogni `heading` di `data/instruments.json` con l'intestazione
dell'Articolo nel testo letto; una differenza va all'autore come le altre (Classe C), un'intestazione non letta resta com'è.

## 23.0 · Le domande all'autore

**Una ricognizione in sola lettura prima**, che rimisura la tabella sotto; poi, **come prima domanda, i pin di
`tools/selftest.mjs`** («One growing list, asked at S23's start (Recommended)»): una lista con nome (per esempio
`READ_<data>`) che cresce a ogni chiusura, con Y3–Y6, F10, X1 e X2 che la seguono come seguono `READ_2026_11_04`, e AT0
cambiato da «nessuna regola dopo FORM_FROM» a «ogni regola datata dopo FORM_FROM porta un'attestazione e passa A-1…A-8».
Le modifiche esatte si approvano una volta; `selftest` gira dopo ogni chiusura. Poi le domande dei lotti, **una per
volta, con lo strumento di domande**, la raccomandazione in prima posizione, il testo dell'Articolo citato (mai a memoria),
ogni risposta in §8 con le parole dell'autore, **committata subito**.

## Lo stato di partenza

Misurato il 4 novembre 2026 sul branch della sessione 22, clone completo. **Rimisura tutto.**

| Fatto | Misura del 4 novembre 2026 |
|---|---|
| Le regole | 33; 25 con `last_verified` 2026-10-29, 8 con 2026-11-04; nessuna porta `attestation` |
| Scadenze | `freshness --as-of 2027-01-27` 0 `RULE_STALE`; `2027-01-28` 25; `2027-02-03` 33 |
| T-12 | `evidence-audit --as-of 2027-03-26`: solo `ap-cra-01` |
| La forma | `tools/attestation-audit.mjs`: in silenzio sull'albero; 214 dei 216 segmenti di locator di primo livello risolti, 32 regole su 33; 133 dei 136 riferimenti a disposizioni |
| Test | `selftest` 140/140; 25 suite 1349 pass, 0 fail, 1 saltato; browser 343 pass, 1 indecidibile; gate avversariale 0 succeeded |
| Intestazioni | gdpr 18, dsa 16, dma 9, data-act 7 = 50 (sessione 23); 23 + 25 nella sessione 24 |
| Da leggere nella sessione 24 | `ap-nis2-03`, `ap-dora-01`, `ap-dora-02`, `ap-pld-01`, `ap-eidas2-01`; l'audit di uscita X-1…X-5; D-5 |

## Scrivere

- Le righe di §8 prima di `data/`, `tools/` o altro. Una modifica di `data/` solo dopo la parola dell'autore, da un testo
  letto in questa sessione.
- **Dopo ogni chiusura: `node tools/validate.mjs`, `node tools/seo-audit.mjs`, `node tools/selftest.mjs`; dopo ogni
  `data/`: `node tools/_footer.mjs` e commit di ciò che scrive.** Ogni commit che cambia un file pubblicato porta
  `Evidence:`.
- Nessuno strumento nuovo; nessuno strumento fa una richiesta di rete. Le letture di Cellar e SPARQL sono della sessione,
  non di un comando del repository.
- Prima di ogni checkpoint, rilancia tutto e salva gli output: `validate`, `i18n-audit`, `design-qa`, `evidence-audit
  --as-of <oggi>` e `--as-of 2027-03-26`, `freshness --as-of <oggi>`, `2027-01-28` e `2027-02-03`, `seo-audit`,
  `tools/og-image.mjs --check`; le 25 suite (con `BROWSER_QA_CHROME`), la suite browser con `--require-browser` (**senza
  modificare l'albero mentre gira**: la suite segnala un albero cambiato), il gate avversariale,
  `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`; la prontezza, letta fino in fondo;
  `node tools/commit-evidence.mjs <base> HEAD`.

## Checkpoint

- **23.1, 23.2, 23.3:** il rapporto in `docs/HANDOVER.md`: per ogni regola i testi e gli Articoli letti, le interrogazioni,
  le decisioni (righe §8), l'attestazione scritta e l'esito di A-1…A-8; le intestazioni confrontate e le differenze; i
  pin cambiati; i commit; i conteggi. Attendi l'approvazione, registrata in §8.
- **Finale (23.4):** il prompt della sessione 24 (percorso, commit, risposte dell'autore); ciò che non è stato letto e
  perché; i rilievi nuovi, non corretti; la checklist. Riscarica `origin/main` subito prima dell'ultima scrittura di
  `docs/HANDOVER.md`. **Senza il prompt della sessione 24 non si chiede l'approvazione.** Poi chiedi se aprire una pull
  request verso `main` e registra la sorte del branch. Non pushare dopo aver aperto la PR.

## Cosa NON fare in questa sessione

- Non chiudere una regola su una lettura incompleta; non scrivere un'attestazione per una lettura non fatta; non copiare il
  pacchetto nella forma; non spostare `FORM_FROM`.
- Non toccare le otto regole del 4 novembre (scadono il 3 febbraio 2027) né le cinque della sessione 24; non fare un
  backfill delle note esistenti.
- **Non lavorare sul rilievo di `agent/integrate/preserve.mjs`** (non controlla nessuna regola di applicabilità): va
  all'audit di uscita della sessione 24 («(1) to S24»).
- Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale,
  `ALLOWED_RUNTIME_ORIGINS`; non scegliere né installare un CMS (D-5 è della sessione 24); non rinnovare la concessione di
  autonomia (scade il 9 marzo 2027: segnalalo); non scrivere l'ambito della Fase 5.
- Non abbassare gate, validator, test o limiti: un pin di `selftest` si aggiorna esattamente, sulla parola dell'autore.
  Non toccare licenza, non affiliazione, assenza di consulenza legale, README; non modificare a mano un file sotto
  `instruments/`.
- Non riscrivere la storia di `main`, né forzare un push; non riscrivere un rapporto passato (si annota).
- Vale in pieno «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–22 (da `docs/HANDOVER.md`; non ripeterle)

- **`selftest` fissa ciò che cambi**: la prima domanda è sui pin, e `selftest` gira dopo ogni chiusura (sessione 21).
- **Una premessa detta all'autore può essere sbagliata: misurala prima, e se la misura la smentisce, torna dall'autore**
  (sessione 22, Q10 (b) → Q11: un controllo dichiarato che non avrebbe controllato nulla).
- **Un controllo nuovo può rompere un pin vecchio** (sessione 22, Y1 e un locator `null`): si porta all'autore, non si
  allenta.
- **La suite browser segnala un albero cambiato durante la corsa**: non scrivere mentre gira.
- **Conta prima di scrivere**; **una sostituzione che fallisce non deve finire in un commit che la dichiara**; **non
  dichiarare una correzione che non hai fatto**.
- **Cellar** risponde 400 senza `Accept-Language: eng` e 404 a un CELEX di rettifica non codificato.
- **Riavvii del worker** (molti nella sessione 22, nessuna risposta persa): ogni risposta in §8 e committata subito.
- **Un clone superficiale non è un albero difettoso.** **Nessun output di agenti in `agent/records/`.**

## Criterio di uscita e consegna

La sessione è completa quando: ciascuna delle 20 regole è chiusa nella forma (con `attestation` che passa A-1…A-8) o, se
non è stata letta per intero, nominata nel prompt della sessione 24 con la ragione; le 50 intestazioni sono confrontate o
cadute per nome; i tre checkpoint e quello finale sono approvati in §8; `selftest` e le 25 suite passano; **il prompt della
sessione 24 esiste su questo branch, porta la stessa regola nel suo criterio di uscita, ed è approvato con il lavoro**
(regola permanente di §8, 4 nov 2026). Oppure l'autore decide di fermarsi: anche allora, **prima di chiudere, si scrive il
prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (23.0–23.4) cosa è stato scritto (file, righe di §8,
commit), come verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è
completo, dichiaralo.
