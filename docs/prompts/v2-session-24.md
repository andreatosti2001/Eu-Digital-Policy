<!--
Provenance: the prompt of v2 Session 24, drafted on 4 Nov 2026 in v2 Session 23 (item 23.4), on `claude/funny-bohr-w74g7e`,
under the standing rule of docs/ROADMAP-v2.md §8 (4 Nov 2026): the next session's prompt is a precondition of closing a
session's work, and is approved with it at the final checkpoint. Scope from docs/PHASE-4-PLAN.md §3 (S24), approved in §8
("The plan to conclude Phase 4"). The author's answers to the three questions put while drafting it, in the author's words:
the checkpoints, "Two: reading, then exit (Recommended)"; the 3 Feb 2027 clustering, "Name it in the hand-over
(Recommended)"; Session 23's new findings, "Into the exit audit (Recommended)". The author asked for the drafting with "go
with session 24's prompt redaction". Drawn from docs/PHASE-4-PLAN.md (§1, §1a, §2, §3, §4); docs/ATTESTATION-FORM.md;
docs/RULE-MAINTENANCE.md; docs/ROADMAP-v2.md §8 (v2 Sessions 21, 22 and 23, every row); docs/HANDOVER.md (the reports of v2
Session 23). The starting state was measured on the branch of v2 Session 23 on 4 Nov 2026, full clone. The decisions live in
those rows and nowhere else; this file is the instruction text that cites them. It records no §8 row of its own and does not
open the session: v2 Session 24 records its scope in §8 as its first write. Written in Italian, as the author's session
prompts are. The author may change it before use.
-->

SESSION 24 — La seconda tornata di lettura e l'uscita dalla Fase 4: 5 regole chiuse nella forma, 48 intestazioni, l'audit
X-1…X-5, la domanda D-5 e il passaggio di consegne, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

Verifica che `main` contenga la sessione 23:
- in `data/applicability.json` 20 regole portano `attestation`, tutte con `last_verified` 2026-11-04;
- `tools/selftest.mjs` ha `READ_V2_23` con 20 voci e AT0 nella forma della sessione 23;
- `docs/ROADMAP-v2.md` §8 ha le righe della sessione 23 fino al suo checkpoint finale;
- `docs/prompts/v2-session-24.md` esiste.

Se manca qualcosa, fermati e segnalalo. **Rimisura la data**: la sessione 23 è stata scritta il giorno di `FORM_FROM`
(2026-11-04); ogni chiusura di questa sessione è datata il giorno della sua lettura e porta sempre la forma (§8, 23.0
domanda 1). Se la data di oggi è successiva a `FORM_FROM`, anche A-3 tiene la chiusura.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 24» con le parole con cui l'autore
avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande. Senza quella
riga non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2-session-24-exit`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare».
2. `docs/PHASE-4-PLAN.md` per intero: questa sessione è la S24, e il §1 (X-1…X-5) è il suo criterio d'uscita.
3. `docs/ATTESTATION-FORM.md` per intero, in particolare §5 punto 1 e §6: `ap-eidas2-01` è in gran parte fuori da A-4.
4. `docs/RULE-MAINTENANCE.md` per intero.
5. `docs/ROADMAP-v2.md` §8: le righe delle sessioni 21, 22 e 23.
6. `docs/HANDOVER.md`: i rapporti della sessione 23, in particolare i rilievi nuovi di ciascun checkpoint.

Se ritieni che una decisione del brief, del piano o di §8 vada rivista, segnalalo e attendi conferma. Non
reinterpretare in silenzio.

## Obiettivo della sessione

**Le 5 regole che scadono il 28 gennaio 2027, ciascuna chiusa nella forma, e le 48 intestazioni che restano; poi l'audit
d'uscita della Fase 4 contro X-1…X-5, la domanda D-5 e il passaggio di consegne.** Due checkpoint («Two: reading, then
exit (Recommended)»):

- **24.1 · La lettura** — `ap-nis2-03`, `ap-dora-01`, `ap-dora-02`, `ap-pld-01`, `ap-eidas2-01` (5 regole); le 23 intestazioni
  dei loro strumenti (nis2 7, dora 9, pld 3, eidas2 4) e le 25 degli strumenti senza regola in questa tornata (cra 7, ehds 4,
  iea 4, csa 3, digital-networks-act 3, tfeu 3, teu 1), confrontate con il testo della Gazzetta ufficiale. **Checkpoint.**
- **24.2 · L'audit d'uscita** — X-1…X-5 di `docs/PHASE-4-PLAN.md` §1, ciascuno misurato con ciò che lo verifica; e i rilievi
  aperti, ciascuno per numero, con la destinazione proposta (correggere, Fase 5, manutenzione, o lasciato con la ragione),
  messi all'autore («Into the exit audit (Recommended)»): il rilievo di `agent/integrate/preserve.mjs` (non controlla nessuna
  regola di applicabilità; «(1) to S24») e i sette della sessione 23 elencati sotto.
- **24.3 · D-5** — la domanda del CMS e del suo login (X-4): decisa, o rinviata oltre la Fase 4 con la ragione, in §8.
- **24.4 · Il passaggio di consegne e il prompt successivo** — il calendario di `docs/PHASE-4-PLAN.md` §4, rimisurato; **le 28
  regole che scadono insieme il 3 febbraio 2027** («Name it in the hand-over (Recommended)»: si nomina, non si rilegge in
  anticipo; la premessa 2 della sessione 21 resta); la concessione di autonomia che scade il 9 marzo 2027 (si segnala, non si
  rinnova); il T-12 su `ap-cra-01` del 26 marzo 2027; gli stati che incontrano le loro tappe (`STATUS_PREDATES_MILESTONE`).
  Poi, **la regola permanente di §8 (4 nov 2026)**: il prompt della sessione successiva — la 25 se l'autore non chiude la
  Fase 4, o la prima di ciò che viene dopo — scritto su questo branch, nella stessa PR. **Il checkpoint finale approva
  insieme il lavoro e il prompt; senza il prompt non si approva.** Lo scopo della Fase 5 non si scrive qui (piano §2).

**Regola d'arresto** (piano §3, regola 2): se la sessione si allunga, cadono nell'ordine (1) le 25 intestazioni degli
strumenti senza regola, (2) le intestazioni degli strumenti delle 5 regole. Le regole non si spostano prima delle
intestazioni. Ciò che cade va, per nome, nel prompt successivo, prima del 28 gennaio 2027. Fissato da §8 e non chiesto:
**una regola i cui testi citati non sono stati letti tutti non si chiude e la sua data non si muove** (premessa 1 della
sessione 21; A-4).

## Come si chiude una regola (per ciascuna delle 5)

I passi 1–6 di `docs/RULE-MAINTENANCE.md`, con la forma, come nella sessione 23:

1. **`node tools/attestation-audit.mjs packet <id>`**: i testi e gli Articoli che A-4 richiederà, i testi da interrogare per
   A-5, le fonti di secondo livello, ciò che A-8 non può controllare. **Il pacchetto non è una lettura.**
2. Leggi ogni Articolo elencato nel testo della Gazzetta ufficiale preso da Cellar per CELEX (`Accept-Language: eng`; il CELEX
   di una rettifica codificato, `R%28NN%29`), **per intero**: un'attestazione nomina solo ciò che è stato letto, e se nomina
   un Articolo intero l'Articolo è stato letto per intero. Interroga SPARQL per ogni testo che A-5 richiede e leggi ogni
   rettifica con un'espressione inglese. **Leggi per intero l'articolo modificativo di un atto modificativo citato**, non
   solo i punti che la regola cita: nella sessione 23 l'Omnibus modificava anche Articoli non citati e rilevanti.
3. **Leggi la motivazione contro i testi, non solo contro le citazioni.** Nella sessione 23 cinque regole su venti
   fondavano un'affermazione su un Articolo non citato, che A-4 non può vedere; il rimedio scelto ogni volta dall'autore è
   stato un riferimento `for: "rationale"`. Ciò che cambierebbe la regola va all'autore, una domanda per volta, in §8 con le
   sue parole, committato subito. **Un nuovo riferimento alza ciò che A-4 richiede**: leggi per intero gli Articoli che
   cita prima di scrivere l'attestazione.
4. Chiudi: nella stessa modifica `last_verified` nuovo, `verification_note` riscritta (con il CELEX di ogni testo di primo
   livello letto, A-7) e **`attestation`** con `of` uguale a `last_verified`, `read`, `queried`, `outcome` e i titoli §8
   delle decisioni; la voce di `READ_V2_23` (o della lista che l'autore decide per questa sessione, prima domanda di 24.1) nello
   stesso commit. Una lettura incompleta non scrive nulla in `data/`.
5. `node tools/validate.mjs` (A-1…A-8, N-0…N-4, i titoli di §8), `node tools/selftest.mjs`, `node tools/_footer.mjs` e
   commit di ciò che scrive (anche `sitemap.xml`, quando la data più recente di uno strumento cambia).
6. Commit con `Evidence:` (la chiusura cambia un file pubblicato).

**`ap-eidas2-01`** (`docs/ATTESTATION-FORM.md` §5, punto 1): due segmenti «Citation (…)» e tre disposizioni di Regulation (EU)
No 910/2014 registrate sotto l'atto modificativo, che A-8 nomina come avvertimenti. Leggili lo stesso; **AT0 richiede 0
avvertimenti**: se la chiusura di `ap-eidas2-01` ne produce, è un pin da portare all'autore come domanda, non da allentare.

**Le intestazioni.** Per ciascuno strumento, confronta ogni `heading` di `data/instruments.json` con l'intestazione dell'Articolo
(o del Capo) nel testo letto; una differenza va all'autore come le altre (Classe C); un'intestazione non letta resta com'è.
Le intestazioni dei Capi e delle sezioni sono in maiuscolo nella Gazzetta: la sola differenza di maiuscole non è una
differenza.

## 24.0 · Le domande all'autore

**Una ricognizione in sola lettura prima**, che rimisura la tabella sotto. Poi, **come prima domanda, i pin di
`tools/selftest.mjs`**: se le 5 chiusure entrano in `READ_V2_23` (che diventerebbe la lista delle chiusure nella forma) o in
una lista nuova, con le stesse regole di Y2–Y6, F10, X1, X2, AT0 e AT1 della sessione 23 (§8, 23.0 domanda 2; 23.1, i due
pin rotti dalla prima chiusura). Le modifiche esatte si approvano una volta; `selftest` gira dopo ogni chiusura. Poi le
domande delle regole, **una per volta, con lo strumento di domande**, la raccomandazione in prima posizione, il testo
dell'Articolo citato (mai a memoria), ogni risposta in §8 con le parole dell'autore, **committata subito**.

## I rilievi aperti per l'audit d'uscita (24.2)

Ciascuno per numero, con la destinazione proposta, all'autore. Nessuno si corregge fuori da una domanda.

| # | Rilievo | Da |
|---|---|---|
| R-1 | `agent/integrate/preserve.mjs` non controlla nessuna regola di applicabilità (tenuto da un test in `agent/integrate/selftest.mjs`) | sessione 22, «(1) to S24» |
| R-2 | A-4 non vede una motivazione che si appoggia a un Articolo non citato; la lettura ne ha trovate cinque, ora con un riferimento `for: "rationale"` (`ap-dsa-01`, `-02`, `ap-ai-act-04`, `ap-data-act-01`, `-04`) | sessione 23, 23.2–23.3 |
| R-3 | I locator di `src-ec-dma-review-2026` usano le pagine del PDF, non quelle stampate (p. 8 è la «7», p. 14 la «13») | sessione 23, 23.2 |
| R-4 | `ap-dma-01` chiusa con F-18 aperto, assegnato alla sessione delle prove (gruppo (d)) | sessione 23, 23.2 |
| R-5 | Il Data Act ha una settima rettifica (R(07), 30 ott 2026), senza espressione inglese | sessione 23, 23.3 |
| R-6 | `ap-ai-act-01` include `actor:gpai-provider` nelle condizioni (deciso «not changed» il 29 ott 2026, gruppo (b), Fase 5) | sessione 23, 23.3 |
| R-7 | L'art. 2(13) dell'AI Act, inserito dall'Omnibus: atti delegati entro il 2 ago 2027 possono limitare gli Artt. 9–15 e 17–25 per alcuni sistemi dell'Allegato I; `ap-ai-act-04` andrebbe riletta, e nessun T-12 scatta per un atto non registrato | sessione 23, 23.3 |
| R-8 | GDPR art. 2(2)(a) e (b) non portati da nessuna regola | sessione 23, 23.1 |

## Lo stato di partenza

Misurato il 4 novembre 2026 sul branch della sessione 23, clone completo. **Rimisura tutto.**

| Fatto | Misura del 4 novembre 2026 |
|---|---|
| Le regole | 33; 28 con `last_verified` 2026-11-04 (20 con `attestation`), 5 con 2026-10-29 |
| Scadenze | `freshness --as-of 2027-01-27` 0 `RULE_STALE`; `2027-01-28` 5 (le cinque di questa sessione); `2027-02-02` 5; `2027-02-03` 33 |
| T-12 | `evidence-audit --as-of 2027-03-26`: solo `ap-cra-01` |
| La forma | `tools/attestation-audit.mjs`: 20 regole attestate, 0 errori, 0 avvertimenti |
| I pacchetti | nis2 32022L2555 (Artt. 2, 6, 21, 23, All. I); dora 32022R2554 (`-01`: Artt. 2, 5, 6, 16, 17, 19, 24, 28; `-02`: Artt. 2, 3, 28, 30, 31, 33); pld 32024L2853 (Artt. 2, 4, 8, Cons. 13); eidas2 32024R1183 Art. 1, 32024R2977 Art. 6, 32024R2981 Art. 22, con 5 voci A-8 |
| Test | `selftest` 140/140; 25 suite 1349 pass, 0 fail, 1 saltato; browser 343 pass, 1 indecidibile; gate avversariale 0 succeeded; prontezza 17 su 20 |
| Intestazioni | 50 confrontate nella sessione 23 (gdpr, dsa, dma, data-act; 2 corrette, gdpr Artt. 58 e 60); 23 + 25 in questa |

## Scrivere

- Le righe di §8 prima di `data/`, `tools/` o altro. Una modifica di `data/` solo dopo la parola dell'autore, da un testo
  letto in questa sessione.
- **Dopo ogni chiusura: `node tools/validate.mjs`, `node tools/seo-audit.mjs`, `node tools/selftest.mjs`; dopo ogni
  `data/`: `node tools/_footer.mjs` e commit di ciò che scrive.** Ogni commit che cambia un file pubblicato porta
  `Evidence:`.
- Nessuno strumento nuovo nel repository; nessuno strumento fa una richiesta di rete. Le letture di Cellar e SPARQL sono della
  sessione, non di un comando del repository.
- Prima di ogni checkpoint, rilancia tutto e salva gli output: `validate`, `i18n-audit`, `design-qa`, `evidence-audit
  --as-of <oggi>` e `--as-of 2027-03-26`, `freshness --as-of <oggi>`, `2027-01-28` e `2027-02-03`, `seo-audit`,
  `tools/og-image.mjs --check`; le 25 suite (con `BROWSER_QA_CHROME`), la suite browser con `--require-browser`, il gate
  avversariale, `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`; la prontezza, letta fino in fondo;
  `node tools/commit-evidence.mjs <base> HEAD`. **Non scrivere nell'albero mentre la batteria gira**: la suite browser, la
  simulazione e il gate avversariale segnalano un albero cambiato (sessione 23: tre suite rosse per un commit durante la
  corsa, verdi a albero fermo).

## Checkpoint

- **24.1:** il rapporto in `docs/HANDOVER.md`: per ogni regola i testi e gli Articoli letti, le interrogazioni, le decisioni
  (righe §8), l'attestazione e l'esito di A-1…A-8; le intestazioni confrontate e le differenze; i pin cambiati; i commit; i
  conteggi. Attendi l'approvazione, registrata in §8.
- **Finale (24.2–24.4):** l'audit X-1…X-5 con ciò che misura; i rilievi R-1…R-8 con le destinazioni decise; D-5; il passaggio
  di consegne; il prompt successivo (percorso, commit, risposte dell'autore); la checklist. Riscarica `origin/main` subito
  prima dell'ultima scrittura di `docs/HANDOVER.md`. **Senza il prompt successivo non si chiede l'approvazione.** Poi chiedi
  se la Fase 4 è conclusa (la decisione è dell'autore, piano §1), se aprire una pull request verso `main`, e registra la
  sorte del branch. Non pushare dopo aver aperto la PR.

## Cosa NON fare in questa sessione

- Non chiudere una regola su una lettura incompleta; non scrivere un'attestazione per una lettura non fatta; non copiare il
  pacchetto nella forma; non spostare `FORM_FROM`.
- Non toccare le 28 regole del 4 novembre (scadono il 3 febbraio 2027) né fare un backfill delle note; non rileggere in
  anticipo per sciogliere il raggruppamento del 3 febbraio.
- Non correggere un rilievo R-1…R-8 fuori dalla sua domanda; non riaprire F-18 o il gruppo (b).
- Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale,
  `ALLOWED_RUNTIME_ORIGINS` (X-3); non scegliere né installare un CMS (D-5 si decide o si rinvia, non si costruisce); non
  rinnovare la concessione di autonomia (scade il 9 marzo 2027: segnalalo); non scrivere l'ambito della Fase 5.
- Non abbassare gate, validator, test o limiti: un pin di `selftest` si aggiorna esattamente, sulla parola dell'autore.
  Non toccare licenza, non affiliazione, assenza di consulenza legale, README; non modificare a mano un file sotto
  `instruments/`.
- Non riscrivere la storia di `main`, né forzare un push; non riscrivere un rapporto passato (si annota).
- Vale in pieno «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–23 (da `docs/HANDOVER.md`; non ripeterle)

- **`selftest` fissa ciò che cambi**, anche dove la domanda dei pin non arriva: la prima chiusura della sessione 23 ha rotto
  Y1 (la copia di prova senza il roadmap) e AT1 (una lista fissa). Si porta all'autore, non si allenta.
- **La data della sessione è un fatto da misurare**: la sessione 23 cadeva su `FORM_FROM`, contro la premessa del suo prompt.
- **Una premessa detta all'autore può essere sbagliata: misurala prima** (sessione 22, Q10 (b) → Q11).
- **Leggi per intero ciò che nomini**: nella sessione 23 una prima stampa troncata dell'art. 4 GDPR e degli Artt. 10–49
  dell'AI Act è stata completata prima di scrivere `read`.
- **La batteria non si interrompe con un commit**; **conta prima di scrivere**; **non dichiarare una correzione che non hai
  fatto**.
- **Cellar** risponde 400 senza `Accept-Language: eng` e 404 a un CELEX di rettifica non codificato. Il comunicato completo
  della Commissione si legge dall'API documenti della press corner (la pagina del sito DMA è un riassunto).
- **Riavvii del worker**: ogni risposta in §8 e committata subito.
- **Un clone superficiale non è un albero difettoso.** **Nessun output di agenti in `agent/records/`.**

## Criterio di uscita e consegna

La sessione è completa quando: ciascuna delle 5 regole è chiusa nella forma (con `attestation` che passa A-1…A-8) o, se non
è stata letta per intero, nominata nel prompt successivo con la ragione; le 48 intestazioni sono confrontate o cadute per
nome; X-1…X-5 sono misurati e il loro esito è in §8; R-1…R-8 hanno una destinazione decisa; D-5 è deciso o rinviato con la
ragione; i due checkpoint sono approvati in §8; `selftest` e le 25 suite passano; **il prompt successivo esiste su questo
branch, porta la stessa regola nel suo criterio di uscita, ed è approvato con il lavoro** (regola permanente di §8, 4 nov
2026). Se l'autore dichiara conclusa la Fase 4, lo dice una riga di §8 con le sue parole. Oppure l'autore decide di fermarsi:
anche allora, **prima di chiudere, si scrive il prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (24.0–24.4) cosa è stato scritto (file, righe di §8,
commit), come verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è
completo, dichiaralo.
