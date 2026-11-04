<!--
Provenance: the prompt of v2 Session 22. Written in v2 Session 21 (4 Nov 2026) on `claude/v2-session-21-rules`, in the
same pull request as that session's work, under the standing rule of `docs/ROADMAP-v2.md` §8 ("A standing rule: the next session's
prompt is a precondition of closing a session's work", 4 Nov 2026). Its scope is put to the author one question at a
time; the answers, in the author's words:
- Question 1, the scope: "25 rules + headings (Recommended)" — re-read the remaining 25 rules with
  `docs/RULE-MAINTENANCE.md` before 28 Jan 2027, and compare each instrument's Article headings from the same retrieved
  text (98 headings; v2 Session 21, 21.3, Session 18 finding (2), assigned to Session 22). Not chosen: the status
  milestones, the attestation form (4.2), the findings of group (d) and Session 21's new findings.
- Question 2, the shape: "By instrument + stop rule (Recommended)" — instrument by instrument, rules and headings from
  the same retrieved text; checkpoints after GDPR + DSA + DMA, after AI Act + Data Act, and a final one (NIS2, DORA, PLD,
  eIDAS2, then Session 23's prompt); whatever is not closed goes, named, into Session 23's prompt, which must run before
  28 Jan 2027.
- Question 3, the headings of instruments with no rule in Session 22 (25: cra 7, csa 3, ehds 4, iea 4,
  digital-networks-act 3, tfeu 3, teu 1): "Final batch, first to drop (Recommended)" — compared in the final batch,
  after the rules; under the stop rule they move to Session 23 before any rule does.
The starting state was measured on `claude/v2-session-21-rules` at `6cd7bc6`, full clone, on 4 Nov 2026. Drawn from
docs/ROADMAP-v2.md §8 (v2 Session 21, every row); docs/RULE-MAINTENANCE.md (as corrected in v2 Session 21);
docs/HANDOVER.md (the reports of v2 Session 21). The decisions live in §8 and nowhere else; this file is the instruction
text that cites them. This prompt records no §8 row of its own and does not open the session: v2 Session 22 records its
scope in §8 as its first write. Written in Italian, as the author's session prompts are. The author may change it before
use.
-->

SESSION 22 — La rilettura delle 25 regole restanti e il confronto delle intestazioni degli articoli con la GUUE, per EU
Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

Verifica che `main` contenga la sessione 21 e questo prompt:
- `docs/ROADMAP-v2.md` §8 ha le righe della sessione 21, fino al suo checkpoint finale approvato;
- `docs/RULE-MAINTENANCE.md` contiene le tre premesse decise (§0 «re-read in stages», §2 le due interrogazioni SPARQL,
  §4 «only if every Article it cites was read») e le tre correzioni del primo uso (CELEX di una rettifica codificato,
  `selftest` che fissa una chiusura);
- `tools/selftest.mjs` contiene la lista `READ_2026_11_04` con otto regole;
- `docs/prompts/v2-session-22.md` esiste.

Se manca qualcosa, fermati e segnalalo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 22» con le parole con cui
l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2-session-22-rules`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare».
2. `docs/ROADMAP-v2.md` §8: tutte le righe della sessione 21 (le tre premesse, i rilievi del gruppo (a), i pin di
   `selftest`, le tre correzioni, i residui) e la regola permanente del 4 novembre 2026.
3. `docs/RULE-MAINTENANCE.md` per intero: **è il processo che questa sessione usa**, come lo ha lasciato la sessione 21.
4. `docs/AI-SAFE-BOUNDARIES.md` e `docs/AUTONOMY-POLICY.md`: ogni valore nuovo o modificato in `data/*.json` è Classe C.
5. Il `$description` di `data/applicability.json` e il `$description`/`$note` di `data/instruments.json`.
6. `docs/HANDOVER.md`: i rapporti della sessione 21 (21.1, 21.2 e il finale).

Se ritieni che una decisione vada rivista, segnalalo e attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**Per strumento, in tre lotti; un checkpoint dopo ciascuno.** Per ogni strumento: le sue regole rilette con i passi 1–6 di
`docs/RULE-MAINTENANCE.md`, e le intestazioni dei suoi articoli in `data/instruments.json` confrontate con lo stesso testo
recuperato.

- **22.1 · GDPR, DSA, DMA.** Regole `ap-gdpr-01`, `ap-gdpr-02`, `ap-gdpr-03`, `ap-cross-01`; `ap-dsa-01`, `ap-dsa-02`,
  `ap-dsa-04`, `ap-dsa-05`; `ap-dma-01`, `ap-dma-02`, `ap-dma-03`. Intestazioni: gdpr 18, dsa 16, dma 9. Checkpoint 22.1.
- **22.2 · AI Act, Data Act.** Regole `ap-ai-act-01`, `ap-ai-act-03`, `ap-ai-act-04`, `ap-ai-act-05`, `ap-ai-act-07`;
  `ap-data-act-01` … `ap-data-act-04`. Intestazioni: data-act 7 (quelle dell'AI Act furono confrontate nella sessione
  18). Checkpoint 22.2.
- **22.3 · NIS2, DORA, PLD, eIDAS2, poi le intestazioni senza regola.** Regole `ap-nis2-03`, `ap-dora-01`,
  `ap-dora-02`, `ap-pld-01`, `ap-eidas2-01`. Intestazioni: nis2 7, dora 9, pld 3, eidas2 4; **poi**, per ultime, le 25
  degli strumenti senza regola in questa sessione (cra 7, csa 3, ehds 4, iea 4, digital-networks-act 3, tfeu 3, teu 1).
- **22.4 · Il prompt della sessione 23** — la regola permanente di §8: l'ultima voce, prima del checkpoint finale.

**La regola d'arresto (domanda 2):** ciò che non è chiuso alla fine della sessione va, per nome, nel prompt della
sessione 23, che deve svolgersi **prima del 28 gennaio 2027**. Le 25 intestazioni senza regola sono le prime a
spostarsi (domanda 3), prima di qualunque regola.

## Lo stato di partenza

Misurato il 4 novembre 2026 su `claude/v2-session-21-rules` a `6cd7bc6`, clone completo. **Rimisura tutto.**

| Fatto | Misura del 4 novembre 2026 |
|---|---|
| Le regole | 33; 25 con `last_verified` 2026-10-29, 8 con 2026-11-04 (`ap-nis2-01`, `ap-nis2-02`, `ap-cra-01`, `ap-ai-act-02`, `ap-ai-act-06`, `ap-gdpr-04`, `ap-dsa-03`, `ap-dma-04`) |
| Scadenze (premessa 2, a tappe) | `freshness --as-of 2027-01-27` 0 `RULE_STALE`; `2027-01-28` 25; `2027-02-02` 25; `2027-02-03` 33 |
| T-12 | `evidence-audit --as-of 2027-03-26`: solo `ap-cra-01` (EHDS, applicazione 2027-03-26), anche dopo la chiusura del 4 nov |
| Le 25 regole per strumento | gdpr 4 (con `ap-cross-01`), dsa 4, dma 3, ai-act 5, data-act 4, nis2 1, dora 2, pld 1, eidas2 1 |
| Le intestazioni da confrontare | 98 in 15 strumenti: gdpr 18, dsa 16, dma 9, dora 9, data-act 7, nis2 7, cra 7, eidas2 4, ehds 4, iea 4, pld 3, csa 3, digital-networks-act 3, tfeu 3, teu 1 |
| Avvisi di oggi | `evidence-audit --as-of 2026-11-04`: 0 errori, 11 avvisi (claim composite e locator), nessuno `STATUS_PREDATES_MILESTONE` |
| Stati in arrivo (non in questa sessione) | ai-act 2 dic 2026; pld 9 dic; eidas2 24 dic; data-act 12 gen 2027; ehds 26 mar 2027 |
| Test | 25 suite, 1330 pass, 0 fail; `selftest` 124/124; browser 343 pass, 1 indecidibile |
| Rete | Cellar e SPARQL raggiungibili per tutta la sessione 21, con `Accept-Language: eng`; il CELEX di una rettifica va codificato (`R%28NN%29`) |

## 22.0 · Le domande all'autore

Una ricognizione in sola lettura che rimisura la tabella; poi le domande, **una per volta**, la raccomandazione in prima
posizione, ogni risposta in §8 con le parole dell'autore, **committata subito**.

Per ogni regola: il testo attuale, gli articoli **letti in questa sessione** con CELEX e data, gli atti modificativi e le
rettifiche (con l'espressione inglese, letta), la proposta prima/dopo, e la chiusura: regola modificata, oppure **chiusa
senza modifica** con la nota del §4 (data, CELEX, articoli letti, metadati interrogati). Più regole dello stesso strumento
senza modifica possono andare in una domanda sola, purché ciascuna sia nominata con ciò che è stato letto. **Una regola
i cui testi non si sono letti tutti non si chiude** (premessa 1): nulla cambia in `data/`, lo si scrive in §8 e nel
rapporto.

Per le intestazioni: la tabella, per strumento, dell'intestazione registrata e di quella della GUUE, parola per parola;
uguali e diverse contate; ogni differenza proposta prima/dopo all'autore. Un'intestazione si cambia solo sulla sua parola.

## Scrivere

- **Segui `docs/RULE-MAINTENANCE.md` passo per passo** e annota dove ti ha guidato e dove no.
- Dopo ogni modifica in `data/`: `node tools/_footer.mjs`, poi **`node tools/validate.mjs`, `node tools/seo-audit.mjs` e
  `node tools/selftest.mjs`** prima del commit. Ogni regola chiusa entra nella lista dei pin di `tools/selftest.mjs`
  (oggi `READ_2026_11_04`; una lista per la nuova data, sulla parola dell'autore, come decise la sessione 21) nello stesso
  commit. Ogni commit che cambia un file pubblicato porta `Evidence:`.
- Un testo inglese corretto che una traduzione rende: verifica `i18n/` e dichiara `superseded` dove serve.
- Prima di ogni checkpoint, rilancia tutto e salva gli output: `validate`, `i18n-audit`, `design-qa`, `evidence-audit
  --as-of <oggi>` e `--as-of 2027-03-26`, `freshness --as-of <oggi>`, `2027-01-28` e `2027-02-03`, `seo-audit`,
  `tools/og-image.mjs --check`; le 25 suite (con `BROWSER_QA_CHROME`), la suite browser con `--require-browser`, il
  gate avversariale, `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`; la prontezza, letta
  fino in fondo; `node tools/commit-evidence.mjs <base> HEAD`.

## 22.4 · Il prompt della sessione 23

Lo richiede la regola permanente di §8 (4 nov 2026). L'ambito della sessione 23 chiesto all'autore, una domanda per
volta; le risposte nella provenienza con le sue parole; `docs/prompts/v2-session-23.md` scritto su questo branch, nella
stessa PR. **Se resta una delle 25 regole, il prompt della sessione 23 la nomina e la fissa prima del 28 gennaio 2027;
le otto regole del 4 novembre scadono il 3 febbraio 2027.** Il prompt riporta la stessa regola permanente per la
sessione 24 nel suo criterio di uscita.

## Checkpoint

- **22.1, 22.2:** il rapporto in `docs/HANDOVER.md`: per regola il testo letto (CELEX, articoli, data), il prima/dopo, la
  chiusura, i commit; per strumento la tabella delle intestazioni; i conteggi; dove il processo era chiaro e dove no.
  Attendi l'approvazione, registrata in §8.
- **Finale (22.3 + 22.4):** come sopra, più ciò che passa alla sessione 23, il prompt della sessione 23, ciò che non è
  stato verificato e perché, i rilievi nuovi, la checklist (22.0–22.4). Riscarica `origin/main` prima dell'ultima
  scrittura di `docs/HANDOVER.md`. **Senza il prompt della sessione 23 non si chiede l'approvazione.** Poi chiedi se
  aprire una pull request verso `main` e registra la sorte del branch. Non pushare dopo aver aperto la PR.

## Cosa NON fare in questa sessione

- Non automatizzare alcun passo; nessun campo, forma di attestazione, controllo o comando nuovo (la forma di *human
  attestation*, voce 4.2, non è stata scelta per questa sessione).
- Non scrivere un fatto giuridico non letto in questa sessione da una fonte recuperata; nessun sostituto plausibile; non
  cambiare un `claim_type`; non togliere un asterisco, un `reference_gap`, un `requires_verification` o una
  `verification_note` senza la parola dell'autore.
- Non aggiornare `last_verified` in blocco né su una regola i cui testi non hai letto tutti (premessa 1).
- Non toccare le otto regole del 4 novembre, gli stati degli strumenti (ai-act, pld, eidas2, data-act, ehds), il gruppo
  (d) (F-18, F-27), i rilievi nuovi della sessione 21 e i quattro titoli generici: non sono stati scelti (domanda 1).
  Un difetto che il lavoro espone si porta all'autore.
- Non abbassare gate, validator, test o limiti; un pin di `selftest` si aggiorna esattamente, mai allentato, e solo sulla
  parola dell'autore. Non toccare la licenza, la non affiliazione, l'assenza di consulenza legale, il README,
  `ALLOWED_RUNTIME_ORIGINS`, la concessione di autonomia (scade il 9 marzo 2027: segnalalo, non rinnovarla), i
  dispatcher, la prontezza; non scrivere l'ambito della Fase 5; non modificare a mano un file sotto `instruments/`.
- Non riscrivere la storia di `main`, né forzare un push; non riscrivere un rapporto passato (si annota).
- Vale in pieno «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–21 (da `docs/HANDOVER.md`; non ripeterle)

- **`selftest` fissa le chiusure.** Nella sessione 21 si sono lanciati `validate` e `seo-audit` dopo ogni chiusura, ma non
  `selftest`: il branch è rimasto rosso per quattro chiusure. Lancialo dopo ognuna.
- **Una sostituzione che fallisce non deve finire in un commit che la dichiara** (sessione 21, `c9b8eef`: il messaggio
  nominava una modifica che non si era applicata, perché la frase compariva due volte; corretto con `7917a09`, non
  riscritto). Concatena con `&&`, e conta le occorrenze prima.
- **Cellar risponde 400 senza `Accept-Language: eng`**, e 404 a un CELEX di rettifica non codificato.
- **Un difetto che il lavoro espone si porta all'autore**; **non dichiarare una correzione che non hai fatto**; ciò che si
  dice all'autore va misurato e citato esattamente; una premessa può essere inesatta: rimisurala.
- **Un controllo può fissare ciò che cambi** (`validate.mjs:514` lega `status_as_of` e `last_verified`; `seo-audit`
  vuole che le faccette di un titolo compaiano nella pagina): cercalo prima di scrivere.
- **Riavvii del worker** (cinque nella sessione 21, nessuna risposta persa): ogni risposta in §8 e committata subito;
  output su file; un errore di push «Internal Server Error» si ritenta con attesa crescente.
- **Un clone superficiale non è un albero difettoso.** **Nessun output di agenti in `agent/records/`.**

## Criterio di uscita e consegna

La sessione è completa quando: ciascuna delle 25 regole è chiusa sulla parola dell'autore — modificata, chiusa senza
modifica con la sua nota, oppure lasciata aperta con la ragione — oppure nominata nel prompt della sessione 23 secondo la
regola d'arresto; le intestazioni confrontate sono decise, quelle non confrontate nominate; i checkpoint sono approvati;
**il prompt della sessione 23 esiste su questo branch, porta la stessa regola nel suo criterio di uscita, ed è approvato
con il lavoro** (regola permanente di §8, 4 nov 2026). Oppure l'autore decide di fermarsi: anche allora, **prima di
chiudere, si scrive il prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (22.0–22.4) cosa è stato scritto (file, righe di
§8, commit), come verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto
non è completo, dichiaralo.
