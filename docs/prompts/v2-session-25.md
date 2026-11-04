<!--
Provenance: the prompt of v2 Session 25, drafted on 4 Nov 2026 in v2 Session 24 (item 24.4), on `claude/v2-session-24-exit`,
under the standing rule of docs/ROADMAP-v2.md §8 (4 Nov 2026): the next session's prompt is a precondition of closing a
session's work, and is approved with it at the final checkpoint. The author's answers to the three questions put while
drafting it, in the author's words: what the next prompt describes, "S25: the 3 Feb 2027 reading (Recommended)"; how the
reading of the 33 rules is staged, "Two sessions (Recommended)" — S25 the GDPR, cross-cutting, DSA and DMA rules (14), S26 the
AI Act, Data Act, NIS2, DORA, CRA, PLD and eIDAS2 rules (19); the statuses meeting their milestones, "In the reading sessions
(Recommended)". Drawn from docs/ROADMAP-v2.md §8 (v2 Session 24, every row, in particular 24.2's R-1…R-12 and 24.3's D-5);
docs/RULE-MAINTENANCE.md (step 1 as amended for R-2); docs/ATTESTATION-FORM.md; docs/HANDOVER.md (the reports of v2 Session
24); docs/PHASE-4-PLAN.md §4. The starting state was measured on the branch of v2 Session 24 on 4 Nov 2026, full clone. The
decisions live in those rows and nowhere else; this file is the instruction text that cites them. It records no §8 row of
its own and does not open the session: v2 Session 25 records its scope in §8 as its first write. Whether Phase 4 is
concluded is the author's decision at v2 Session 24's final checkpoint; this prompt holds either way, because the reading of
3 Feb 2027 is maintenance under the written process (docs/PHASE-4-PLAN.md §4). Written in Italian, as the author's session
prompts are. The author may change it before use.
-->

SESSION 25 — La lettura del 3 febbraio 2027, prima tornata: 14 regole (GDPR, trasversale, DSA, DMA) nella forma, gli stati
giunti alle loro tappe, e il prompt della sessione 26, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

Verifica che `main` contenga la sessione 24:
- in `data/applicability.json` 25 regole portano `attestation`, tutte con `last_verified` 2026-11-04; le 8 senza sono quelle
  della sessione 21 (`ap-gdpr-04`, `ap-dsa-03`, `ap-dma-04`, `ap-ai-act-02`, `ap-ai-act-06`, `ap-nis2-01`, `ap-nis2-02`,
  `ap-cra-01`);
- `tools/selftest.mjs` ha `READ_V2_23` con 25 voci, `EIDAS2_A8` (cinque righe) e `OLDEST_READ`;
- `docs/CURRENT-ARCHITECTURE.md` §12 registra `validate.mjs` a 0 errori · 5 avvertimenti, ciascuno nominato;
- `docs/ROADMAP-v2.md` §8 ha le righe della sessione 24 fino al suo checkpoint finale;
- `docs/prompts/v2-session-25.md` esiste.

Se manca qualcosa, fermati e segnalalo. **Rimisura la data**: ogni chiusura è datata il giorno della sua lettura e porta la
forma (§8, 23.0 domanda 1). Questa sessione cade dopo `FORM_FROM` (2026-11-04): A-3 vale per ogni regola che chiude. **Se la
data di oggi è il 3 febbraio 2027 o dopo**, le 33 regole sono già `RULE_STALE`: dillo all'autore prima di ogni altra cosa.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 25» con le parole con cui l'autore
avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande. Senza quella
riga non si scrive nulla. Registra anche, in quella riga, se §8 dichiara conclusa la Fase 4 (la decisione del checkpoint
finale della sessione 24).

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2-session-25-reading`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare».
2. `docs/RULE-MAINTENANCE.md` per intero: il passo 1 contiene ora l'istruzione di R-2 (leggere motivazione, obblighi e
   `depends_on` contro i testi, non solo contro le citazioni).
3. `docs/ATTESTATION-FORM.md` per intero.
4. `docs/ROADMAP-v2.md` §8: le righe delle sessioni 23 e 24, in particolare le decisioni sulle regole di questa tornata e
   24.2 (R-1…R-12).
5. `docs/HANDOVER.md`: i rapporti della sessione 24.

Se ritieni che una decisione del brief, del piano o di §8 vada rivista, segnalalo e attendi conferma. Non
reinterpretare in silenzio.

## Obiettivo della sessione

**Le 14 regole della prima tornata, ciascuna chiusa nella forma prima del 3 febbraio 2027; gli stati degli strumenti giunti
alle loro tappe; il prompt della sessione 26.** Due checkpoint:

- **25.1 · La lettura** — `ap-gdpr-01`, `ap-gdpr-02`, `ap-gdpr-03`, `ap-gdpr-04`, `ap-cross-01`, `ap-dsa-01` … `ap-dsa-05`,
  `ap-dma-01` … `ap-dma-04` (14 regole), con i punti di §8 che le riguardano:
  - **R-3** (`ap-dma-01`, `ap-dma-03`): i locator di `src-ec-dma-review-2026` nominano la pagina stampata con la sezione
    (p. 14 del PDF è la «13», p. 8 la «7»), alla rilettura del Review Report;
  - **R-4** (`ap-dma-01`): F-18 (l'art. 3(10) del DMA dà sei mesi; la regola, `clm-dma-ex-ante` e `part-4.p2` dicono
    «immediately») va all'autore come prima domanda di `ap-dma-01`: affrontarlo ora con la claim e il paragrafo del brief, o
    programmare prima la sessione delle prove del gruppo (d). Non si riapre in silenzio;
  - **R-8** (`ap-gdpr-01`): la nota nomina l'art. 2(2)(a) e (b) come non portati da nessuna regola (destinazione: Fase 5);
  - le intestazioni: già confrontate nella sessione 23 (GDPR, DSA, DMA): non si riconfrontano.
  **Checkpoint.**
- **25.2 · Gli stati** — per ciascuno strumento la cui tappa è passata alla data della sessione
  (`node tools/evidence-audit.mjs --as-of <oggi>`, `STATUS_PREDATES_MILESTONE`), lo stato riletto contro il testo della
  tappa: ai-act (2 dic 2026), pld (9 dic 2026), eidas2 (24 dic 2026), dma (1 gen 2027), data-act (12 gen 2027); ehds
  (26 mar 2027) solo se già passata. Ogni cambiamento di `legislative_status` o `status_as_of` sulla parola dell'autore,
  da un testo letto in questa sessione. Gli stati la cui tappa non è ancora passata vanno, per nome, nel prompt della 26.
- **25.3 · Il prompt della sessione 26** — le 19 regole della seconda tornata (`ap-ai-act-01` … `-07`, `ap-data-act-01` …
  `-04`, `ap-nis2-01` … `-03`, `ap-dora-01`, `-02`, `ap-cra-01`, `ap-pld-01`, `ap-eidas2-01`), prima del 3 febbraio 2027, con
  R-5 (le rettifiche del Data Act senza espressione inglese, R(02)…R(07): rifare l'interrogazione), R-7 (atti delegati
  dell'art. 2(13) dell'AI Act: interrogare SPARQL prima del 2 ago 2027), R-12 (l'atto delegato dell'art. 31(6) del DORA: da
  cercare e leggere per `ap-dora-02`), il T-12 su `ap-cra-01` del 26 marzo 2027 (che chiederà una lettura dopo quella data) e
  gli stati non ancora giunti alle loro tappe. **La regola permanente di §8 (4 nov 2026)**: il prompt della 26 scritto su
  questo branch, nella stessa PR; **il checkpoint finale approva insieme il lavoro e il prompt; senza il prompt non si
  approva.** Lo scopo della Fase 5 non si scrive qui.

**Regola d'arresto:** se la sessione si allunga, cadono nell'ordine (1) gli stati di 25.2, (2) le regole DMA, poi DSA, ciascuna
nominata nel prompt della 26. **Ciò che cade va letto prima del 3 febbraio 2027.** Fissato da §8 e non chiesto: **una regola
i cui testi citati non sono stati letti tutti non si chiude e la sua data non si muove** (premessa 1 della sessione 21; A-4).

## Come si chiude una regola (per ciascuna delle 14)

I passi 1–6 di `docs/RULE-MAINTENANCE.md`, con la forma, come nelle sessioni 23 e 24:

1. **`node tools/attestation-audit.mjs packet <id>`**. **Il pacchetto non è una lettura**, e non nomina gli atti modificativi di
   un testo citato solo per una data (sessione 24: 2026/1731).
2. Leggi ogni Articolo elencato nel testo della Gazzetta ufficiale preso da Cellar per CELEX (`Accept-Language: eng`; il CELEX
   di una rettifica codificato, `R%28NN%29`), **per intero**. Interroga SPARQL per ogni testo che A-5 richiede, **anche se la
   nota precedente non registra un'interrogazione** (sessione 24: così si è trovata la rettifica dell'art. 2(1) della PLD), e
   leggi ogni rettifica con un'espressione inglese, anche le nuove dal 4 novembre 2026.
3. **Leggi la motivazione, gli obblighi e `depends_on` contro i testi** (passo 1 come modificato per R-2): ciò che poggia su un
   Articolo non citato, o un obbligo che il testo rende applicabile e manca, va all'autore, una domanda per volta, in §8 con le
   sue parole, committato subito. **Un nuovo riferimento alza ciò che A-4 richiede.**
4. Chiudi: nella stessa modifica `last_verified` nuovo, `verification_note` riscritta (con il CELEX di ogni testo di primo
   livello letto, A-7) e **`attestation`** con `of` uguale a `last_verified` — per le 11 regole già attestate la nuova sostituisce
   la vecchia (A-2) —, `read`, `queried`, `outcome` e i titoli §8 delle decisioni; la voce di `READ_V2_23` (o della lista che
   l'autore decide, prima domanda di 25.0) nello stesso commit. Una lettura incompleta non scrive nulla in `data/`.
5. `node tools/validate.mjs`, `node tools/selftest.mjs`, `node tools/_footer.mjs` e commit di ciò che scrive.
6. Commit con `Evidence:`.

## 25.0 · Le domande all'autore

**Una ricognizione in sola lettura prima**, che rimisura la tabella sotto. Poi, **come prima domanda, i pin di
`tools/selftest.mjs`**, misurati prima di porla: `READ_V2_23` ha oggi 25 voci tutte al 2026-11-04 (una nuova lettura ne cambia
la data); `ap-gdpr-04`, `ap-dsa-03` e `ap-dma-04` sono in `READ_2026_11_04` e non in `READ_V2_23` (la loro prima attestazione:
AT0 «no backfill» deve accoglierle come chiusure, non come backfill); F10 conta 33 − 8 − `READ_V2_23` regole scadute il
2027-01-28 e il suo intervallo va da `OLDEST_READ` a `NEWEST_READ`; X1 e Y2–Y6 seguono `dateOf()`. Le modifiche esatte si
approvano una volta; `selftest` gira dopo ogni chiusura. Poi le domande delle regole, **una per volta, con lo strumento di
domande**, la raccomandazione in prima posizione, il testo dell'Articolo citato (mai a memoria), ogni risposta in §8 con le
parole dell'autore, **committata subito**.

## Lo stato di partenza

Misurato il 4 novembre 2026 sul branch della sessione 24, clone completo. **Rimisura tutto.**

| Fatto | Misura del 4 novembre 2026 |
|---|---|
| Le regole | 33, tutte con `last_verified` 2026-11-04; 25 con `attestation`, 8 senza (sessione 21) |
| Scadenze | `freshness --as-of 2027-02-02` 0 `RULE_STALE`; `2027-02-03` 33 |
| T-12 | `evidence-audit --as-of 2027-03-26`: solo `ap-cra-01` |
| Stati alle tappe | `evidence-audit --as-of 2027-03-26`: `STATUS_PREDATES_MILESTONE` per dma, ai-act, data-act, pld, eidas2, ehds |
| La forma | 25 regole attestate, 0 errori, 5 avvertimenti (A-8 di `ap-eidas2-01`, fissati da `EIDAS2_A8`) |
| I pacchetti (esempi) | `ap-gdpr-04`: 32016R0679 Artt. 2, 4, 22, 35; `ap-dsa-03`: 32022R2065 Artt. 2, 3, 33, 34, 35; `ap-dma-04`: 32022R1925 Artt. 1, 2, 3; `ap-dma-01`: 32022R1925 Artt. 1, 2, 3, 5, 6, 7, 13 |
| Test | `selftest` 140/140; 25 suite 1349 pass, 0 fail, 1 saltato; browser 343 pass, 1 indecidibile; gate avversariale 0 succeeded; prontezza 17 su 20 |
| Concessione di autonomia | scade il 9 marzo 2027: si segnala, non si rinnova |

## Scrivere

- Le righe di §8 prima di `data/`, `tools/` o altro. Una modifica di `data/` solo dopo la parola dell'autore, da un testo
  letto in questa sessione.
- **Dopo ogni chiusura: `node tools/validate.mjs`, `node tools/seo-audit.mjs`, `node tools/selftest.mjs`; dopo ogni
  `data/`: `node tools/_footer.mjs` e commit di ciò che scrive.** Ogni commit che cambia un file pubblicato porta
  `Evidence:`. Se una modifica tocca regole, claim o eventi, prima del commit girano anche le suite che leggono `data/`.
- Nessuno strumento nuovo nel repository; nessuno strumento fa una richiesta di rete. Le letture di Cellar e SPARQL sono della
  sessione, non di un comando del repository.
- Prima di ogni checkpoint, rilancia tutto e salva gli output: `validate`, `i18n-audit`, `design-qa`, `evidence-audit
  --as-of <oggi>` e `--as-of 2027-03-26`, `freshness --as-of <oggi>`, `2027-02-02` e `2027-02-03`, `seo-audit`,
  `tools/og-image.mjs --check`; le 25 suite (con `BROWSER_QA_CHROME`), la suite browser con `--require-browser`, il gate
  avversariale, `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`; la prontezza, letta fino in fondo;
  `node agent/implement/cli.mjs check --as-of <oggi>`; `node tools/commit-evidence.mjs <base> HEAD`. **Non scrivere
  nell'albero mentre la batteria gira.**

## Checkpoint

- **25.1:** il rapporto in `docs/HANDOVER.md`: per ogni regola i testi e gli Articoli letti, le interrogazioni, le decisioni
  (righe §8), l'attestazione e l'esito di A-1…A-8; R-3, R-4 e R-8 come trattati; i pin cambiati; i commit; i conteggi.
  Attendi l'approvazione, registrata in §8.
- **Finale (25.2–25.3):** gli stati riletti e quelli rinviati; il prompt della 26 (percorso, commit, risposte dell'autore); la
  checklist. Riscarica `origin/main` subito prima dell'ultima scrittura di `docs/HANDOVER.md`. **Senza il prompt della 26 non
  si chiede l'approvazione.** Poi chiedi se aprire una pull request verso `main` e registra la sorte del branch. Non pushare
  dopo aver aperto la PR.

## Cosa NON fare in questa sessione

- Non chiudere una regola su una lettura incompleta; non scrivere un'attestazione per una lettura non fatta; non copiare il
  pacchetto nella forma; non spostare `FORM_FROM`.
- Non toccare le 19 regole della seconda tornata (sono della 26), salvo che una decisione dell'autore lo chieda per nome.
- Non riaprire F-18 senza la domanda di R-4; non riaprire il gruppo (b) (R-6) né decidere R-8 (Fase 5); non correggere R-10
  (sessione delle prove) né R-11 (lasciato).
- Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale,
  `ALLOWED_RUNTIME_ORIGINS`; D-5 è rinviato oltre la Fase 4 (§8, 24.3): non scegliere né installare un CMS; non rinnovare la
  concessione di autonomia; non scrivere l'ambito della Fase 5.
- Non abbassare gate, validator, test o limiti: un pin di `selftest` si aggiorna esattamente, sulla parola dell'autore. Un
  sesto avvertimento di `validate.mjs` è un rilievo. Non toccare licenza, non affiliazione, assenza di consulenza legale,
  README; non modificare a mano un file sotto `instruments/`.
- Non riscrivere la storia di `main`, né forzare un push; non riscrivere un rapporto passato (si annota).
- Vale in pieno «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–24 (da `docs/HANDOVER.md`; non ripeterle)

- **`selftest` fissa ciò che cambi**, anche dove la domanda dei pin non arriva: nella sessione 24 la chiusura dell'ultima regola
  datata 2026-10-29 ha rotto un letterale di F10, e gli avvertimenti di A-8 hanno rotto AT0, AT1 e AT9. Si misura sulla chiusura
  non committata, si porta all'autore, non si allenta.
- **Una nota senza interrogazione è una lettura a metà**: la PLD aveva una rettifica in inglese all'art. 2(1) che la lettura del
  29 ottobre non aveva cercato. La stessa parola sbagliata stava in quattro altri record (R-9): cerca il fatto in tutto
  `data/` prima di proporre la correzione.
- **La data della sessione è un fatto da misurare**; **una premessa detta all'autore può essere sbagliata: misurala prima**.
- **Leggi per intero ciò che nomini**: l'art. 1 di un atto modificativo si legge tutto (2024/1183: 53 punti).
- **Cellar**: 400 senza `Accept-Language: eng`; 404 a un CELEX di rettifica non codificato; **300 Multiple Choices** per un
  documento COM (si segue l'elenco: il documento dell'atto); **12016E** restituisce l'indice dei Trattati — un articolo si
  prende per CELEX proprio (`12016E102`).
- **La batteria non si interrompe con un commit**; **conta prima di scrivere**; **non dichiarare una correzione che non hai
  fatto**.
- **Riavvii del worker e interruzioni**: ogni risposta in §8 e committata subito; dopo un'interruzione, controlla l'albero
  (`git status`) prima di rifare un comando.
- **Un clone superficiale non è un albero difettoso.** **Nessun output di agenti in `agent/records/`.**

## Criterio di uscita e consegna

La sessione è completa quando: ciascuna delle 14 regole è chiusa nella forma (con `attestation` che passa A-1…A-8) o, se non
è stata letta per intero, nominata nel prompt della 26 con la ragione; R-3, R-4 e R-8 sono trattati come §8 decide; gli stati
giunti alle tappe sono riletti o nominati; i due checkpoint sono approvati in §8; `selftest` e le 25 suite passano; **il prompt
della sessione 26 esiste su questo branch, porta la stessa regola nel suo criterio di uscita, ed è approvato con il lavoro**
(regola permanente di §8, 4 nov 2026). Oppure l'autore decide di fermarsi: anche allora, **prima di chiudere, si scrive il
prompt della sessione successiva** con ciò che resta, e ciò che resta va letto prima del 3 febbraio 2027.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (25.0–25.3) cosa è stato scritto (file, righe di §8,
commit), come verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è
completo, dichiaralo.
