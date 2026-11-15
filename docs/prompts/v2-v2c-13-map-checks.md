<!--
Provenance: the prompt of the Track R session that follows V2C-12, drafted on 15 Nov 2026 in the V2C-12 session, on
`claude/upbeat-thompson-yewfls`, on the author's answer "V2C-13, the map checks (Recommended)" (docs/ROADMAP-v2.md §8, "V2C-12, W.4"),
under the standing rule of §8 (4 Nov 2026). Drawn from docs/V2-DATA-DESIGN.md §1.5 and §4 (M-08…M-16), docs/V2-CLOSURE.md (V2C-13;
B4; N5; P4), docs/PHASE-3-AUDIT.md (V2C-13's row), docs/ROADMAP-v2.md §8 (28 Oct 2026, "12.0 question 4: the perimeter of 12.2"),
docs/SESSION-ARCHITECTURE.md (Track R) and the records as measured on 15 Nov 2026. **No check was written for this prompt**: that is
the session's to do. It records no §8 row of its own and does not open the session: the session records its scope in §8 as its first
write. Written in Italian, as the author's session prompts are. The author may change it before use.
-->

SESSIONE V2C-13 — Traccia R, la mappa: i controlli sui rapporti (M-08…M-16) e il «flip» di `edge-v1-sources`, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a` e `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow` prima di ogni suite). Verifica che `main` contenga la PR di V2C-12, `docs/V2C-12-READING.md` e questo prompt. Se
manca qualcosa, fermati e chiedi all'autore.

**Rimisura la data, prima di ogni altra cosa. La Traccia M ha la precedenza** (`docs/SESSION-ARCHITECTURE.md` §1): se oggi è il 12 gennaio
2027 o dopo, la finestra della sessione 25 è aperta e va detto all'autore prima di ogni altra cosa; il 24 dicembre 2026 è la tappa dello
stato di `eidas2` (sessione 25, non questa); la concessione di autonomia scade il 9 marzo 2027 (si segnala, non si rinnova).

**Come prima scrittura**, registra in §8 la riga «The scope of the V2C-13 session» con le parole dell'autore; se il prompt arriva senza
parole dell'autore, chiediglielo con lo strumento di domande. Senza quella riga non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`
(`origin/scout/digest-digest-2026-11-09T16-29-04Z` era segnalato, senza menzione in alcun documento, il 15 nov 2026). Lavora sul branch
assegnato o su `claude/v2c-13-map-checks`. Non lavorare su `main`.

Leggi, in quest'ordine: `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §2; `docs/V2-DATA-DESIGN.md` §1.4–§1.5 e §4
(le regole M-01…M-16, la colonna «Phase 3 implements», §4.3 sul checkpoint in cui un BACKLOG diventa ERROR); `docs/V2-CLOSURE.md` (V2C-13,
B4, N5, P4) e `docs/PHASE-3-AUDIT.md` (riga V2C-13); `docs/ROADMAP-v2.md` §8 (28 ott 2026, «12.0 question 4: the perimeter of 12.2» — **qui
l'autore ha rinviato a questa sessione due decisioni**); `docs/V2C-12-READING.md` (§4, §5: cosa V2C-12 ha scritto e perché); `tools/evidence-audit.mjs`,
`tools/register-audit.mjs` e `tools/trigger-audit.mjs` (come un controllo è un modulo puro con la sua sezione) e `tools/selftest.mjs` (W12, W12b, W18);
`data/taxonomy.json` `relationship_kind`; `docs/v2-design/map.schema.json`.

## Lo stato di partenza (15 novembre 2026; **rimisura tutto**)

39 rapporti in `data/instruments.json`, **tutti in forma v2** (nessun id di fonte «nudo»); `B3_STILL_V1` in `tools/selftest.mjs` è `[]`; W12b ne fissa
sette. Due rapporti portano `requires_verification: true` (`rel-ai-act-gdpr-impact-assessments`, `rel-data-act-cloud-ai-act`). Per tipo:
overlap 3, conflict 2, complement 5, amends 7, repeals 3, lex-specialis 1, carve-out 1, defers-to 11, enables 6. Archi analitici senza claim (M-10):
`rel-dsa-dma-scope`, `rel-nis2-cer`, `rel-cra-nis2` (3). Nessun `symmetric: true` su un tipo non analitico. **Nessun termine di
`relationship_kind` porta `basis`** (M-16 non può girare). Il valore `unverified` del validatore: 47 (CURRENT-ARCHITECTURE §12).

Validatori all'inizio dell'ultima sessione: `validate` 0 errori, 5 avvertimenti (A-8 di `ap-eidas2-01`); `selftest` 190/190; le 25 suite e
`.control-room/` 1496 test (1495 pass, 1 skipped, con `tools/selftest.mjs`); browser 361 pass, 1 undecidable.

## Obiettivo

**I controlli sui rapporti esistono, sono mantenuti da un test, e ciò che V2C-12 ha scritto è tenuto da un controllo e non solo da un elenco.** Quattro punti:

- **W.1 · Le due decisioni che il §8 del 28 ott 2026 ha rinviato qui.** (a) M-11 e M-13 sull'arco `defers-to` parziale
  (`rel-dsa-copyright-dsm-defers`): ERROR come da progetto o BACKLOG dichiarato, **misurando prima** cosa renderebbe rosso l'albero; (b) il campo
  `basis` di M-16 (`textual` | `analytical` su ogni termine di `relationship_kind`): **è un dato nuovo in `data/taxonomy.json`**, quindi una
  domanda all'autore, con i termini classificati nella proposta (V2-DATA-DESIGN §1.4 li classifica già) — non si aggiunge nulla senza la sua
  risposta in §8.
- **W.2 · La proposta, all'autore.** Una tabella per regola M-08…M-16: cosa controlla, la severità proposta (ERROR / BACKLOG / WARNING) e
  **cosa darebbe oggi sui 39 rapporti, misurato**, con le righe che diventerebbero rosse. Una domanda all'autore per decisione, raccomandazione
  per prima, ogni risposta in §8 con le sue parole, **committata subito**. **Il «flip» di `edge-v1-sources` e di `edge-analytical-no-claim`**
  (BACKLOG → ERROR) è decisione dell'autore, non della sessione: V2C-12 l'ha lasciato qui («No flip; leave to V2C-13», §8, 15 nov 2026), e
  adesso nessun rapporto è v1.
- **W.3 · La scrittura**, solo dopo le risposte: i controlli come modulo puro in `tools/` con la sua sezione nel rapporto, ciascuno con un test che
  **può fallire** (un arco piantato che lo viola) in `tools/selftest.mjs`; `data/taxonomy.json` solo per `basis` e solo se deciso; nessun
  controllo abbassa un gate esistente. Se un controllo trova qualcosa di rosso, **si nomina e si decide, non si «sistema» il dato per far passare il
  controllo**. `node tools/_footer.mjs` se un dato cambia; ogni commit che tocca un file pubblicato porta la riga `Evidence:`.
- **W.4 · Il prompt della sessione successiva**, scelto dall'autore tra le righe di Traccia R che §8 non mostra già eseguite (V2C-03…05;
  V2C-16…19; F-18 prima di ogni modifica di `ap-dma-01`; la sessione 25 se la finestra del 12 gennaio 2027 è vicina). **Il checkpoint finale
  approva insieme il lavoro e il prompt; senza il prompt non si approva.**

**Tre punti rimasti aperti da V2C-12, da nominare nel §8 della sessione e trattare solo se l'autore lo decide:**

1. **`data/instruments.json`: `gdpr.legal_basis` è `["tfeu:art-114"]`, ma il visa del GDPR cita solo l'Art. 16** (`docs/V2C-12-READING.md` §3.1;
   l'autore ha deciso «Carry it to the next session», §8 15 nov 2026, decisione 5). Non esiste una disposizione `tfeu:art-16`: i trattati sono
   modellati come disposizioni di `tfeu` e `teu` (`$note` di `instruments.json`), quindi **la correzione chiede una decisione su come
   rappresentare l'Art. 16 TFEU** (una disposizione nuova in `tfeu`, o `legal_basis: []` con la ragione). Nota che `ai-act.legal_basis` cita il solo
   Art. 114 mentre il visa dell'AI Act cita gli Artt. 16 e 114. Una domanda all'autore; nessuna scrittura prima della risposta.
2. **Il documento letto per `rel-data-act-cloud-ai-act`**: l'Allegato II di COM(2026) 502 è stato letto dalla manifestazione di Cellar degli
   Allegati; la fonte registrata, `src-council-cloud-ai-act-2026` (ST 10104/26), **non lo riproduce**, e il rapporto lo dice nella sua nota. Se
   l'autore vuole citare l'Allegato con un record di fonte proprio, è una decisione e un record di `data/sources.json`; altrimenti resta com'è.
3. **Letture rimaste parziali in V2C-12** (non sono difetti): nessuna rettifica (corrigendum) di alcuno degli otto atti è stata cercata; il
   Capo VIII del Data Act (interoperabilità, Artt. 33–36) non è stato letto oltre ciò che è citato; la mappa degli archi `analitici` senza claim
   (M-10) non è stata toccata.

**Regola d'arresto**: se un controllo non si può misurare sui 39 rapporti, non si implementa e si dichiara; nessun controllo si scrive su una
misura parziale. **Nessun rapporto si modifica per far passare un controllo**: V2C-12 ha letto ciascuno contro il testo, e una correzione di un
rapporto è una decisione dell'autore con la sua riga in §8.

## Scrivere e verificare

`docs/` sempre; `tools/` (i moduli dei controlli e `tools/selftest.mjs`) e `data/taxonomy.json` (solo `basis`) — ciascuno dopo la sua riga di §8.
Prima del checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`,
`node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`, le 25 suite e `.control-room/`, la suite del browser. Non scrivere
nell'albero mentre la batteria gira. **Confronta l'output intero con quello della base, non un filtro** (lezione di V2C-21). Un avvertimento
nuovo è un rilievo. **Se il conteggio `unverified` cambia, si aggiorna il §12 di `docs/CURRENT-ARCHITECTURE.md` con la spiegazione** (il test
`agent/health/selftest.mjs` «the unverified count matches the recorded baseline in §12» lo pretende; V2C-12 l'ha portato da 45 a 47).

## Cosa NON fare

- Non toccare `eidas2`, `ap-eidas2-01` né alcuna regola di `data/applicability.json`; né stato, date, `timeline`, `last_verified` di un record che la
  sessione non rilegge. Non pubblicare la vista della mappa (resta non pubblicata, §8 27 ott 2026, A.0).
- Non cambiare il testo, il tipo o le fonti di un rapporto per far passare un controllo. Non rinominare un ID; non aggiungere termini di
  tassonomia senza una domanda; non autorizzare da memoria un Articolo, una data, un CELEX. **Non abbassare gate, validator, test o limiti**; non
  ammorbidire un test esistente (W12 si può solo stringere).
- Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale, `ALLOWED_RUNTIME_ORIGINS`, né rinnovare la
  concessione. Non toccare licenza, non affiliazione, assenza di consulenza legale, README.
- Non riscrivere la storia di `main` né forzare un push; non riscrivere un rapporto passato (si annota). Vale «Cosa NON fare» del brief.

## Lezioni (da `docs/HANDOVER.md`)

La data è un fatto da misurare e una premessa del prompt può essere sbagliata · il soggetto grammaticale di un «shall» è il destinatario · un
filtro che non trova nulla non prova nulla · **un controllo che non può fallire non è un controllo: ogni regola ha il suo arco piantato** · una suite
può creare `agent/records/` vuoto: controlla prima della chiusura · `origin/main` si muove: riscarica prima di ogni scrittura di `docs/HANDOVER.md` e
prima di una PR · ogni risposta in §8 si committa subito, e dopo un riavvio `git status` prima di rifare un comando · **una lettura contro il testo
può smentire il dato (V2C-12: due archi su otto; un arco puntato a un'istanza che il testo esclude): la regola d'arresto vale anche per un controllo
che «passa» perché non guarda**.

## Criterio di uscita e consegna

Completa quando: le decisioni di W.1 sono in §8 con le parole dell'autore; ogni regola M-08…M-16 è implementata con la severità decisa, misurata sui
39 rapporti e con un test che può fallire, **oppure** dichiarata non implementata con la ragione; il «flip» è fatto o rinviato per decisione
dell'autore in §8; nessun rapporto, regola, stato o data è cambiato senza una riga di §8; validatori, `selftest`, 25 suite, `.control-room/` e browser
passano e ogni avvertimento nuovo è spiegato; i tre punti aperti sono nominati; **il prompt della sessione successiva esiste sul branch, porta la
stessa regola nel suo criterio di uscita ed è approvato con il lavoro**. Oppure l'autore decide di fermarsi: anche allora, prima di chiudere si scrive
il prompt della successiva.

Prima di chiudere, produci la checklist: per ciascun punto (W.1–W.4) cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se
esiste un test e dove, quale criterio di uscita soddisfa. Se un punto non è completo, dichiaralo.
