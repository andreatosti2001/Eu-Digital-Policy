<!--
Provenance: the prompt of the Track R session that follows V2C-13, drafted on 16 Nov 2026 in the V2C-13 session, on
`claude/amazing-pascal-95wq2o`, on the author's answer "V2C-03–05: the arrays and COM(2025) 837 (Recommended)" (docs/ROADMAP-v2.md §8,
"V2C-13, W.4"), under the standing rule of §8 (4 Nov 2026). Drawn from docs/V2-CLOSURE.md (V2C-03, V2C-04, V2C-05), docs/PHASE-3-AUDIT.md
(their rows), docs/V2-DATA-DESIGN.md §1.4 ("A second home found"), §1.5 (M-15), §7 (F-1…F-3), docs/V2C-13-MAP-CHECKS.md and the records as
measured on 16 Nov 2026. **Nothing was read from COM(2025) 837 for this prompt**: that is the session's to do. It records no §8 row of its
own and does not open the session: the session records its scope in §8 as its first write. Written in Italian, as the author's session
prompts are. The author may change it before use.
-->

SESSIONE V2C-03…05 — Traccia R, la mappa: gli array delle istanze come seconda casa degli archi, e COM(2025) 837, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a` e `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow` prima di ogni suite). Verifica che `main` contenga la PR di V2C-13, `docs/V2C-13-MAP-CHECKS.md`, `tools/map-audit.mjs`
e questo prompt. Se manca qualcosa, fermati e chiedi all'autore.

**Rimisura la data, prima di ogni altra cosa. La Traccia M ha la precedenza** (`docs/SESSION-ARCHITECTURE.md` §1): se oggi è il 12 gennaio
2027 o dopo, la finestra della sessione 25 è aperta e va detto all'autore prima di ogni altra cosa; il 24 dicembre 2026 è la tappa dello
stato di `eidas2` (sessione 25, non questa); la concessione di autonomia scade il 9 marzo 2027 (si segnala, non si rinnova).

**Come prima scrittura**, registra in §8 la riga «The scope of the V2C-03…05 session» con le parole dell'autore; se il prompt arriva senza
parole dell'autore, chiediglielo con lo strumento di domande. Senza quella riga non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`. Lavora sul branch assegnato
o su `claude/v2c-03-05-arrays`. Non lavorare su `main`.

Leggi, in quest'ordine: `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §2; `docs/V2-DATA-DESIGN.md` §1.4 («A second home
found»), §1.5 (M-15) e §7 (F-1, F-2, F-3); `docs/V2-CLOSURE.md` (V2C-03, V2C-04, V2C-05) e `docs/PHASE-3-AUDIT.md` (le loro righe);
`docs/V2C-13-MAP-CHECKS.md` (§2, M-15 misurato **per coppia e con il tipo**; §5 ciò che è stato scritto); `tools/map-audit.mjs` (`arrayPairs`,
M-15) e `tools/selftest.mjs` (MP1, MP6); `docs/V2C-12-READING.md` §2.5 (`rel-data-omnibus-gdpr`, già letto contro l'Art. 3 della proposta) e
le righe di `data/instruments.json` per `data-omnibus`, `eprivacy`, `nis2`, `dga`, `cer`, `p2b`.

## Lo stato di partenza (16 novembre 2026; **rimisura tutto**)

`tools/map-audit.mjs` M-15 conta, su `data/instruments.json`, **5 voci su 4 coppie, tutte `data-omnibus`** (BACKLOG `edge-second-home`, mai
ERROR): `proposes_to_amend` elenca `eprivacy` e `nis2` **senza alcun rapporto**; elenca `dga` come modifica mentre `rel-data-omnibus-dga-repeals`
dice abrogazione (e `proposes_to_amend` non può dire «abroga»); `rel-data-omnibus-p2b-repeals` non ha voce in alcun array. `cer` (V2C-05:
«modificato dall'Art. 9 di COM(2025) 837») non è né nell'array né negli archi. Rapporti uscenti da `data-omnibus`: `gdpr` amends (letto il
15 nov), `data-act` amends, `dga` repeals, `p2b` repeals (letti il 27 ott). Fonte: `src-eurlex-data-omnibus-837` (CELEX 52025PC0837); `status:proposal`.
Gli array `amends`, `repeals`, `amended_by`, `proposes_to_amend` esistono su 11 istanze; **la progettazione raccomanda di derivarli dai rapporti e
cancellarli** (`V2-DATA-DESIGN.md` §1.4), il che è una decisione dell'autore.

Validatori alla fine dell'ultima sessione: `validate` 0 errori; `selftest` 199/199 (9 test nuovi, MP1…MP9); `evidence-audit` 0 errori e la sezione
MAP (39 archi, 10 analitici e 29 testuali; BACKLOG 3 + 1 + 5); 25 suite e `.control-room/` (la suite `agent/detector` ha richiesto la
classificazione di `taxonomy_term.basis` come prosa, decisione 6 del 16 nov); browser 361 pass, 1 undecidable. **Rimisura.**

## Obiettivo

**Gli archi che `data-omnibus` porta sono letti contro il testo della proposta, e la seconda casa si chiude per decisione dell'autore, non per
comodità di un controllo.** Quattro punti:

- **W.1 · La lettura.** Da Cellar per CELEX (`52025PC0837`, con `Accept-Language: eng`; hash SHA-256 per documento, come V2C-12): cosa COM(2025) 837
  fa a `eprivacy` (V2C-03), a `nis2` (V2C-03), al `dga` (V2C-04: abroga, e in che termini) e al `cer` (V2C-05: Art. 9), e se esistono altri atti
  che modifica e che il record non nomina. **Nessun articolo, data o CELEX da memoria**: ciò che non si legge non si scrive. Un atto che il
  testo non tocca nel modo detto dall'array si nomina come tale.
- **W.2 · La proposta, all'autore.** Una tabella per voce di M-15 (le 5, più `cer`): cosa dice il testo, cosa propone la sessione (aggiungere l'arco
  letto / togliere la voce dall'array / lasciare), e cosa darebbe M-15 dopo. **Una domanda per decisione, raccomandazione per prima, ogni risposta
  in §8 con le sue parole, committata subito.** Inclusa la decisione di struttura: **derivare gli array dai rapporti e cancellarli** (raccomandazione
  del progetto), derivarli e tenerli, o tenerli e aggiornarli a mano; e il «flip» di `edge-second-home` (BACKLOG → ERROR), da proporre solo se
  la seconda casa è chiusa.
- **W.3 · La scrittura**, solo dopo le risposte: `data/instruments.json` (i rapporti decisi e gli array) e, per un documento letto davvero,
  `data/sources.json` / `data/claims.json`; `tools/map-audit.mjs` e `tools/selftest.mjs` se M-15 cambia (**ogni modifica a un controllo con il suo
  test che può fallire; W12, MP1…MP9 si possono solo stringere**); `node tools/_footer.mjs` se un dato cambia; ogni commit che tocca un file
  pubblicato porta la riga `Evidence:`. Se si cancellano gli array, **si cercano i consumatori** (`js/`, `agent/`, le pagine) prima, e se uno è
  fuori dallo scrivibile di questa sessione si chiede.
- **W.4 · Il prompt della sessione successiva**, scelto dall'autore tra le righe di Traccia R che §8 non mostra già eseguite (V2C-16…19; F-18 prima di
  ogni modifica di `ap-dma-01`; la sessione 25 se la finestra del 12 gennaio 2027 è vicina). **Il checkpoint finale approva insieme il lavoro e il
  prompt; senza il prompt non si approva.**

**Tre punti rimasti aperti da V2C-12, portati qui da V2C-13 (§8, 16 nov 2026, decisione 7) e da trattare solo se l'autore lo decide:**

1. **`gdpr.legal_basis` è `["tfeu:art-114"]`, ma il visa del GDPR cita solo l'Art. 16** (`docs/V2C-12-READING.md` §3.1). Non esiste `tfeu:art-16`:
   la correzione chiede una decisione su come rappresentare l'Art. 16 TFEU (una disposizione nuova in `tfeu`, o `legal_basis: []` con la ragione).
   Nota che `ai-act.legal_basis` cita il solo Art. 114 mentre il visa dell'AI Act cita gli Artt. 16 e 114.
2. **L'Allegato II di COM(2026) 502**, letto dalla manifestazione di Cellar, non ha un record di fonte proprio: `src-council-cloud-ai-act-2026`
   (ST 10104/26) non lo riproduce, e `rel-data-act-cloud-ai-act` lo dice nella sua nota.
3. **Letture rimaste parziali**: nessuna rettifica (corrigendum) di alcuno degli otto atti di V2C-12 cercata; il Capo VIII del Data Act
   (Artt. 33–36) non letto oltre ciò che è citato; **i tre archi analitici senza claim** (`rel-dsa-dma-scope`, `rel-nis2-cer`, `rel-cra-nis2`,
   BACKLOG `edge-analytical-no-claim`, congelato e che si può solo restringere) e **l'arco `rel-dsa-copyright-dsm-defers`** (BACKLOG
   `edge-textual-partial`: il DSA nomina un corpo di diritto e non la Direttiva) non sono stati toccati.

**Regola d'arresto**: se una voce non si può leggere nel testo, non si scrive e si dichiara; nessun arco si aggiunge per far passare M-15, e
nessun arco letto si toglie per lo stesso motivo. **Un controllo che trova qualcosa di rosso si nomina e si decide.**

## Scrivere e verificare

`docs/` sempre; `data/instruments.json`, `data/sources.json`, `data/claims.json`, `tools/map-audit.mjs` e `tools/selftest.mjs` — ciascuno dopo la sua
riga di §8. Prima del checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`,
`node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`, le 25 suite e `.control-room/`, la suite del browser. Non scrivere
nell'albero mentre la batteria gira. **Confronta l'output intero con quello della base, non un filtro.** Un avvertimento nuovo è un rilievo.
**Se il conteggio `unverified` cambia, si aggiorna il §12 di `docs/CURRENT-ARCHITECTURE.md` con la spiegazione, e si rilanciano TUTTE le suite**
(due lo fissano: `agent/health` e `agent/implement` R6). **Un campo nuovo in `data/` può rompere il registro dei campi di `agent/detector/fields.mjs`**:
rilancia le 25 suite dopo ogni modifica di `data/`, non solo i validatori.

## Cosa NON fare

- Non toccare `eidas2`, `ap-eidas2-01` né alcuna regola di `data/applicability.json`; né stato, date, `timeline`, `last_verified` di un record che la
  sessione non rilegge. Non pubblicare la vista della mappa (resta non pubblicata, §8 27 ott 2026, A.0).
- Non cambiare `basis` di un termine di `relationship_kind` (è un campo di prosa nel registro dei campi, decisione 6 del 16 nov), né il testo, il
  tipo o le fonti di un rapporto che la sessione non ha riletto. Non rinominare un ID; non aggiungere termini di tassonomia senza una domanda; non
  autorizzare da memoria un Articolo, una data, un CELEX. **Non abbassare gate, validator, test o limiti**; non ammorbidire un test esistente.
- Non svuotare le liste congelate di `tools/map-audit.mjs` senza che l'arco sia stato risolto; non farle crescere.
- Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale, `ALLOWED_RUNTIME_ORIGINS`, né rinnovare la
  concessione. Non toccare licenza, non affiliazione, assenza di consulenza legale, README.
- Non riscrivere la storia di `main` né forzare un push; non riscrivere un rapporto passato (si annota). Vale «Cosa NON fare» del brief.

## Lezioni (da `docs/HANDOVER.md`)

La data è un fatto da misurare e una premessa del prompt può essere sbagliata · il soggetto grammaticale di un «shall» è il destinatario · un
filtro che non trova nulla non prova nulla · **un controllo che non può fallire non è un controllo: ogni regola ha il suo arco piantato** · una suite
può creare `agent/records/` vuoto: controlla prima della chiusura · `origin/main` si muove: riscarica prima di ogni scrittura di `docs/HANDOVER.md` e
prima di una PR · ogni risposta in §8 si committa subito, e dopo un riavvio `git status` prima di rifare un comando · **una lettura contro il testo
può smentire il dato** (V2C-12: due archi su otto) · **una modifica ai dati può rompere un test fuori dallo scrivibile** (V2C-13: `basis` e il registro
dei campi): si ferma, si chiede, e la riga di §8 lo dice · **il numero di `unverified` è fissato in due suite**.

## Criterio di uscita e consegna

Completa quando: la lettura di COM(2025) 837 è fatta e annotata (W.1); le decisioni di W.2 sono in §8 con le parole dell'autore; ogni voce di M-15
è risolta per decisione (arco letto e scritto, voce tolta, o lasciata e dichiarata) e M-15 lo misura; il «flip» di `edge-second-home` è fatto o
rinviato per decisione dell'autore in §8; nessun rapporto, regola, stato o data è cambiato senza una riga di §8; validatori, `selftest`, 25 suite,
`.control-room/` e browser passano e ogni avvertimento nuovo è spiegato; i tre punti aperti sono nominati; **il prompt della sessione successiva
esiste sul branch, porta la stessa regola nel suo criterio di uscita ed è approvato con il lavoro**. Oppure l'autore decide di fermarsi: anche
allora, prima di chiudere si scrive il prompt della successiva.

Prima di chiudere, produci la checklist: per ciascun punto (W.1–W.4) cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se
esiste un test e dove, quale criterio di uscita soddisfa. Se un punto non è completo, dichiaralo.
