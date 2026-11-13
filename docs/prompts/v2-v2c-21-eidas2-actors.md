<!--
Provenance: the prompt of the Track R session for V2C-21, drafted on 13 Nov 2026 after v2 Session 27's final checkpoint, on
`claude/eager-euler-05ukz9`, on the author's answers "V2C-21, eidas2 actors (Recommended)" (docs/ROADMAP-v2.md §8, "The next
session, before the reading window of 12 Jan 2027: V2C-21, `eidas2`'s regulated actors (Track R)") and "Draft it now
(Recommended)", under the standing rule of §8 (4 Nov 2026). Drawn from docs/PHASE-3-AUDIT.md (V2C-21's row),
docs/V2-CLOSURE.md (V2C-21's row: moved on 3 Nov 2026 by §8, v2 Session 17.5, question 2, to a reader-facing data session,
destination 1), docs/PHASE-5-SETUP.md §5.2 and §10.7 (item 67), docs/SESSION-ARCHITECTURE.md (Track R) and the records as
measured on 13 Nov 2026. **No Article of Regulation (EU) No 910/2014 or 2024/1183 was read for this prompt**, and nothing in it
says who the Regulation binds: that is the session's to read. It records no §8 row of its own and does not open the session:
the session records its scope in §8 as its first write. Written in Italian, as the author's session prompts are. The author may
change it before use.
-->

SESSIONE V2C-21 — Traccia R, dati per il lettore: gli attori regolati di `eidas2` («Who it binds»), letti contro gli
Articoli, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

Verifica che `main` contenga: in `docs/ROADMAP-v2.md` §8 le righe «Final checkpoint of v2 Session 27 approved…», «G2: Stage 3
is opened, and with it Phase 5» e «The next session, before the reading window of 12 Jan 2027: V2C-21…»; questo prompt. Se
manca qualcosa (per esempio la PR #112 non è ancora fusa), fermati e chiedi all'autore se procedere dal branch.

**Rimisura la data, prima di ogni altra cosa. La Traccia M ha la precedenza** (`docs/SESSION-ARCHITECTURE.md` §1):
- **se oggi è il 12 gennaio 2027 o dopo**, la finestra della sessione 25 è aperta: dillo all'autore prima di ogni altra cosa,
  perché la lettura viene prima di questa sessione;
- **il 24 dicembre 2026** è la tappa dello stato di `eidas2` (`docs/prompts/v2-session-25.md`, 25.2): lo stato e le sue tappe
  sono della sessione 25, **non di questa**; se la data è passata, segnalalo e non toccarlo;
- **la concessione di autonomia scade il 9 marzo 2027**: si segnala, non si rinnova.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of the V2C-21 session» con le parole con cui
l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande. Senza
quella riga non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di `docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2c-21-eidas2-actors`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §2 (un campo fattuale di `data/` è ambra).
2. `docs/PHASE-3-AUDIT.md` e `docs/V2-CLOSURE.md`: le righe di V2C-21.
3. `data/instruments.json`: `$description` e `$note`; il record `eidas2` (`dna.regulated_actor`, `provisions`, `sources`,
   `verification_note`); `data/taxonomy.json` `actor` (`$description`, e i termini `actor:member-state`,
   `actor:trust-service-provider`).
4. `js/dna.js` e `js/instrument-view.js`: dove `regulated_actor` diventa «Who it binds» per il lettore.
5. `docs/PHASE-5-SETUP.md` §5.2 e §10.7, voce 67 (perché la sessione 29 aspetta V2C-21).

## Lo stato di partenza

Misurato il 13 novembre 2026 sul branch della sessione 27, clone completo. **Rimisura tutto.**

| Fatto | Misura del 13 novembre 2026 |
|---|---|
| `eidas2.dna.regulated_actor` | `actor:member-state`, `actor:public-authority`, `actor:large-company`, `actor:vlop`, `actor:trust-service-provider` |
| Il rilievo (V2C-21) | mescola i destinatari degli obblighi sul portafoglio con i prestatori di servizi fiduciari dell'articolo sull'ambito; non esaustivo (`docs/PHASE-3-AUDIT.md`; `docs/V2-CLOSURE.md`) |
| Le disposizioni di `eidas2` nei record | `eidas2:art-2` (Scope), `art-3` (Definitions), `art-5a` (European Digital Identity Wallets), `art-5f` (Cross-border reliance) — Articoli del Regolamento (UE) n. 910/2014, registrati sotto il regolamento modificativo (A-8) |
| Le fonti | `src-eurlex-eidas2` (CELEX 32024R1183) e `src-eurlex-eidas` (CELEX 32014R0910), tier 1; due regolamenti di esecuzione (2024/2977, 2024/2981) |
| La regola `ap-eidas2-01` | `possible`, `activity:digital-identity`; nella lettura della sessione 25; voce 67 della tabella X5-1: «stays a dependency» fino a V2C-21 |
| Validatori | `validate.mjs` 0 errori · 5 avvertimenti (A-8 di `ap-eidas2-01`); `selftest` 189/189 |

## Obiettivo della sessione

**Che «Who it binds» di `eidas2` dica chi il Regolamento vincola, letto negli Articoli, e nient'altro.** Tre punti:

- **V.1 · La lettura.** Dal testo della Gazzetta ufficiale letto in questa sessione da Cellar per CELEX (`Accept-Language:
  eng`), mai a memoria: il Regolamento (UE) 2024/1183 e, per gli Articoli che modifica o inserisce, il Regolamento (UE) n.
  910/2014 come modificato — l'Articolo sull'ambito, le definizioni, e gli Articoli che pongono obblighi (sul portafoglio, sulla
  sua fornitura e sull'affidamento transfrontaliero, sui prestatori di servizi fiduciari). Interroga lo SPARQL dell'Ufficio delle
  pubblicazioni per gli atti modificativi e le rettifiche, come le sessioni 21–24. **Annota chi ciascun Articolo vincola, con la
  citazione e il locator; non scrivere nulla nei dati finché la lettura non è completa.**
- **V.2 · La proposta, all'autore.** Una tabella: ogni attore che la lettura trova, l'Articolo che lo vincola, il termine di
  `data/taxonomy.json` che lo dice (esistente, o **nuovo**, aggiunto e mai rinominato), e per ciascuno dei cinque attori di oggi
  se resta, cambia o esce, con la ragione. Una domanda all'autore per decisione, la raccomandazione per prima; ogni risposta in
  §8 con le parole dell'autore, **committata subito**. Se un attore non si può dire con un termine senza fabbricare una
  categoria, **si dichiara il limite** (in `verification_note`) invece di chiuderlo con un sostituto plausibile.
- **V.3 · La scrittura.** Solo dopo le risposte: `eidas2.dna.regulated_actor` in `data/instruments.json`, i termini nuovi in
  `data/taxonomy.json` (con `note` che cita l'Articolo letto), la `verification_note` di `eidas2` riscritta con ciò che è stato
  letto (i CELEX, gli Articoli, lo SPARQL), un record di `data/sources.json` **solo** per un documento letto davvero; il registro
  `i18n/` se un'etichetta nuova arriva al lettore (le edizioni `pending_translation`; una revisione di traduzione non è mai di un
  agente). Diff minimi; nessuna riformattazione di un file intero. Ogni commit che tocca un file pubblicato porta la riga
  `Evidence:`.
- **V.4 · Il prompt della sessione successiva** — per tempo e dipendenza: la **sessione 25** (sul suo prompt, invariato) se la
  finestra del 12 gennaio 2027 è vicina; altrimenti ciò che l'autore sceglie nella Traccia R (V2C-13, la sessione di evidenza
  F-18, V2C-12). **Il checkpoint finale approva insieme il lavoro e il prompt; senza il prompt non si approva.**

**Regola d'arresto**: se la lettura non si completa, **nulla si scrive in `data/`**: la sessione consegna le note di lettura in
`docs/` e il prompt della successiva, con V2C-21 nominato come aperto. Nessun attore si scrive su una lettura parziale.

## Scrivere

- **`docs/`** sempre; **`data/instruments.json`** (solo il record `eidas2`: `dna.regulated_actor`, `verification_note`,
  `last_verified` se la lettura lo giustifica), **`data/taxonomy.json`** (solo aggiunte), **`data/sources.json`** (solo per un
  documento letto), **`i18n/`** (solo il registro) — ciascuno dopo la sua riga di §8.
- Prima del checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`,
  `seo-audit`, `node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`, le 25 suite, e **la suite del
  browser** (cambia ciò che una pagina mostra). Non scrivere nell'albero mentre la batteria gira. Un avvertimento nuovo è un
  rilievo, non rumore.

## Checkpoint

- **Finale (V.1–V.4):** le note di lettura; la tabella e le risposte (righe §8); il diff dei dati; la batteria; il prompt della
  sessione successiva; la checklist. Riscarica `origin/main` subito prima dell'ultima scrittura di `docs/HANDOVER.md`. Poi
  chiedi se aprire una pull request verso `main` e registra la sorte del branch.

## Cosa NON fare in questa sessione

- **Non toccare `ap-eidas2-01`** né alcuna regola di `data/applicability.json`: la regola è nella lettura della sessione 25, e
  una modifica di questa sessione correrebbe contro la sua chiusura (`docs/PHASE-5-SETUP.md` §0, P-B). Ciò che V2C-21 trova per
  la regola si **nomina** per la sessione 25 o per la 29 (voce 67), non si scrive.
- **Non toccare lo stato di `eidas2`**, `status_as_of`, le tappe o la `timeline`: sono della sessione 25 (25.2).
- **Non toccare i due avvertimenti A-8** né `EIDAS2_A8` in `tools/selftest.mjs`: sono il caso dichiarato di `ap-eidas2-01`.
- Non rinominare un ID di `data/taxonomy.json`; non autorizzare da memoria un Articolo, una data, un CELEX o un attore.
- Non aprire né modificare le sessioni della Fase 5, né il loro prompt; non riaprire le decisioni di `docs/PHASE-5-SETUP.md` §10.
- Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale,
  `ALLOWED_RUNTIME_ORIGINS`; non rinnovare la concessione di autonomia.
- Non abbassare gate, validator, test o limiti. Non toccare licenza, non affiliazione, assenza di consulenza legale, README.
- Non riscrivere la storia di `main`, né forzare un push su un branch altrui; non riscrivere un rapporto passato (si annota).
- Vale in pieno «Cosa NON fare» del brief.

## Lezioni (da `docs/HANDOVER.md`; non ripeterle)

- **La data della sessione è un fatto da misurare, e una premessa del prompt può essere sbagliata.**
- **Prima di un esempio in una domanda all'autore, misuralo** (la sessione 27, domanda 4).
- **Ciò che un record dice di un Articolo non è una lettura**: i `summary` di `data/instruments.json` non sostituiscono il testo.
- **Una suite può creare `agent/records/` vuoto** durante la batteria (sessione 27): controlla prima della chiusura; nessun
  output di agenti va committato lì.
- **`origin/main` si muove durante la sessione**: riscarica prima di ogni scrittura di `docs/HANDOVER.md` e prima di una PR.
- **Riavvii del worker**: ogni risposta in §8 committata subito; dopo un'interruzione, `git status` prima di rifare un comando.

## Criterio di uscita e consegna

La sessione è completa quando: la lettura è fatta e annotata; ogni attore di `eidas2.dna.regulated_actor` ha una decisione
dell'autore in §8 ed è scritto contro l'Articolo letto, o il limite è dichiarato; nessuna regola, stato o data è cambiato; i
validatori, `selftest`, le 25 suite e la suite del browser passano, e ogni avvertimento nuovo è spiegato; **il prompt della
sessione successiva esiste su questo branch, porta la stessa regola nel suo criterio di uscita, ed è approvato con il lavoro**
(regola permanente di §8, 4 nov 2026). Oppure l'autore decide di fermarsi: anche allora, **prima di chiudere, si scrive il
prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (V.1–V.4) cosa è stato scritto (file, righe di §8,
commit), come verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è
completo, dichiaralo.
