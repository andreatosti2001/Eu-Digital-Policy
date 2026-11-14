<!--
Provenance: the prompt of the Track R session that follows V2C-21, drafted on 14 Nov 2026 in the V2C-21 session, on
`claude/sweet-newton-58i6p3`, on the author's answer "eIDAS2 provisions (Recommended)" (docs/ROADMAP-v2.md §8, "V2C-21, V.4:
the next session, before the reading window of 12 Jan 2027"), under the standing rule of §8 (4 Nov 2026). Drawn from
docs/V2C-21-READING.md (§3, the table of who each Article binds; §5 and §6, what was named for a later session) and from the
records as measured on 14 Nov 2026. The Articles it names were read in the V2C-21 session from the Official Journal texts; this
prompt is not a reading, and the session reads them again. It records no §8 row of its own and does not open the session: the
session records its scope in §8 as its first write. Written in Italian, as the author's session prompts are. The author may change
it before use.
-->

SESSIONE V2C-21b — Traccia R, dati per il lettore: le disposizioni di `eidas2` che dicono chi il Regolamento vincola,
perché «Who it binds» sia ancorato ad Articoli mostrati nella pagina, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

Verifica che `main` contenga: in `docs/ROADMAP-v2.md` §8 le righe «V2C-21, V.2: …» e «V2C-21, V.4: the next session …» e la
riga di approvazione del checkpoint finale di V2C-21; `docs/V2C-21-READING.md`; questo prompt; in `data/taxonomy.json` i termini
`actor:relying-party`, `actor:wallet-provider`, `actor:web-browser-provider`. Se manca qualcosa (per esempio la PR di V2C-21 non è
ancora fusa), fermati e chiedi all'autore se procedere dal branch.

**Rimisura la data, prima di ogni altra cosa. La Traccia M ha la precedenza** (`docs/SESSION-ARCHITECTURE.md` §1):
- **se oggi è il 12 gennaio 2027 o dopo**, la finestra della sessione 25 è aperta: dillo all'autore prima di ogni altra cosa,
  perché la lettura viene prima di questa sessione;
- **il 24 dicembre 2026** è la tappa dello stato di `eidas2` (`docs/prompts/v2-session-25.md`, 25.2): lo stato e le sue tappe
  sono della sessione 25, **non di questa**; se la data è passata, segnalalo e non toccarlo;
- **la concessione di autonomia scade il 9 marzo 2027**: si segnala, non si rinnova.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of the V2C-21b session» con le parole con cui
l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande. Senza
quella riga non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di `docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2c-21b-eidas2-provisions`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §2 (un campo fattuale di `data/` è ambra).
2. `docs/V2C-21-READING.md` per intero: §3 (chi vincola ciascun Articolo, A1–A13), §5 e §6 (ciò che è stato nominato per
   questa sessione).
3. `data/instruments.json`: `$description` e `$note`; il record `eidas2` (`dna.regulated_actor`, `dna.obligation_anchor`,
   `provisions`, `sources`); una disposizione di un altro strumento con `obligation_on` e `verification_note` come modello.
4. `js/instrument-view.js` (dove le disposizioni e `obligation_on` arrivano al lettore), `js/search.js` `bindingActors()`,
   `js/pyramid.js` (legge `obligation_on`), `tools/seo.mjs`.
5. `tools/register-audit.mjs` e `tools/selftest.mjs` `EIDAS2_A8`: come una disposizione di `eidas2` si colloca, o non si
   colloca, in un testo di livello 1 (gli avvertimenti A-8).

## Lo stato di partenza

Misurato il 14 novembre 2026 sul branch di V2C-21. **Rimisura tutto.**

| Fatto | Misura del 14 novembre 2026 |
|---|---|
| `eidas2.dna.regulated_actor` | `actor:member-state`, `actor:wallet-provider`, `actor:relying-party`, `actor:vlop`, `actor:gatekeeper`, `actor:trust-service-provider`, `actor:web-browser-provider`, `actor:public-authority` (V2C-21, `61dd1a7`) |
| Le disposizioni di `eidas2` | `eidas2:art-2` (Scope), `art-3` (Definitions), `art-5a` (`obligation_on` `actor:member-state`), `art-5f` (`obligation_on` `actor:large-company`, `actor:public-authority`, `actor:vlop`) |
| Attori senza una disposizione che li vincoli nella pagina | `actor:wallet-provider`, `actor:relying-party`, `actor:gatekeeper`, `actor:trust-service-provider`, `actor:web-browser-provider`, `actor:public-authority` |
| Il rilievo su `art-5f` | 5f(1) vincola lo Stato membro («Where Member States require … they shall also accept»), non l'autorità pubblica; 5f(2) vincola le parti facenti affidamento private, medie imprese incluse, non le «large companies» (`docs/V2C-21-READING.md` §3 A1, A4; §5) |
| `eidas2.last_verified` | 2026-10-27, lasciato invariato dall'autore il 14 nov 2026 |
| Validatori | `validate.mjs` 0 errori · 5 avvertimenti (A-8 di `ap-eidas2-01`); `selftest` 189/189; le 25 suite e `.control-room/` 1495 test, 0 falliti; browser 361 pass, 1 undecidable |

## Obiettivo della sessione

**Che ogni attore di «Who it binds» di `eidas2` sia vincolato, nella pagina, da una disposizione letta nell'Articolo.** Tre punti:

- **W.1 · La rilettura.** Dal testo della Gazzetta ufficiale letto in questa sessione da Cellar per CELEX (`Accept-Language:
  eng`), mai a memoria e mai dalle note di V2C-21 da sole: gli Articoli che V2C-21 ha trovato — 5b, 12b, 19a, 24, 45, 45a,
  45f, 45g, 46a, 46b del Regolamento (UE) n. 910/2014 come modificato dal Regolamento (UE) 2024/1183 — e 5f. Rifai la query
  SPARQL per atti modificativi e rettifiche: **una rettifica o un atto nuovi dopo il 13 novembre 2026 si leggono prima di
  scrivere**. Annota per ciascuna disposizione proposta il numero, il titolo, un riassunto che segue i paragrafi dell'Articolo,
  `obligation_on` e il locator.
- **W.2 · La proposta, all'autore.** Una tabella: ogni disposizione nuova (id `eidas2:art-…`, mai rinominato), l'Articolo,
  `obligation_on`, e se entra in `dna.obligation_anchor`; e la correzione di `eidas2:art-5f` (`obligation_on` e riassunto). Una
  domanda all'autore per decisione, la raccomandazione per prima; ogni risposta in §8 con le parole dell'autore, **committata
  subito**. Quante disposizioni (una per attore, o una per Articolo) è una decisione dell'autore, non della sessione.
- **W.3 · La scrittura.** Solo dopo le risposte: le disposizioni in `data/instruments.json` (solo il record `eidas2`), ciascuna
  con `sources` (`src-eurlex-eidas2`, `src-eurlex-eidas` se l'Articolo è del testo originale) e `verification_note` che dice
  cosa è stato letto e quando; `node tools/_footer.mjs` e ciò che scrive; un record di `data/sources.json` **solo** per un
  documento letto davvero. Diff minimi; nessuna riformattazione di un file intero. Ogni commit che tocca un file pubblicato
  porta la riga `Evidence:`.
- **W.4 · Il prompt della sessione successiva** — per tempo e dipendenza: la **sessione 25** (sul suo prompt, invariato) se la
  finestra del 12 gennaio 2027 è vicina; altrimenti ciò che l'autore sceglie nella Traccia R (V2C-13, la sessione di evidenza
  F-18, V2C-12). **Il checkpoint finale approva insieme il lavoro e il prompt; senza il prompt non si approva.**

**Regola d'arresto**: se la rilettura non si completa, **nulla si scrive in `data/`**: la sessione consegna le note in `docs/` e
il prompt della successiva, con il punto nominato come aperto. Nessuna disposizione si scrive su una lettura parziale.

## Scrivere

- **`docs/`** sempre; **`data/instruments.json`** (solo il record `eidas2`: `provisions`, `dna.obligation_anchor`; **non**
  `dna.regulated_actor`, già deciso in V2C-21, salvo che la rilettura trovi un errore — allora si chiede); **`data/sources.json`**
  (solo per un documento letto); le pagine generate da `tools/_footer.mjs` — ciascuno dopo la sua riga di §8.
- Prima del checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`,
  `seo-audit`, `node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`, le 25 suite, e **la suite del
  browser** (cambia ciò che una pagina mostra). Non scrivere nell'albero mentre la batteria gira. Un avvertimento nuovo è un
  rilievo, non rumore: **una disposizione nuova che `tools/register-audit.mjs` non sa collocare in un testo di livello 1** si
  confronta con gli A-8 di `ap-eidas2-01` e si spiega, non si silenzia.

## Checkpoint

- **Finale (W.1–W.4):** le note di rilettura; la tabella e le risposte (righe §8); il diff dei dati; la batteria; il prompt della
  sessione successiva; la checklist. Riscarica `origin/main` subito prima dell'ultima scrittura di `docs/HANDOVER.md`. Poi
  chiedi se aprire una pull request verso `main` e registra la sorte del branch.

## Cosa NON fare in questa sessione

- **Non toccare `ap-eidas2-01`** né alcuna regola di `data/applicability.json` (sessione 25; voce 67 di X5-1, sessione 29): ciò
  che le disposizioni nuove dicono per la regola si **nomina**, non si scrive.
- **Non toccare lo stato di `eidas2`**, `status_as_of`, le tappe, la `timeline`, `last_verified` del record: sono della sessione
  25 (25.2) o decisi dall'autore il 14 nov 2026.
- **Non toccare i due avvertimenti A-8** né `EIDAS2_A8` in `tools/selftest.mjs`.
- Non rinominare un ID di `data/taxonomy.json` né di una disposizione; non aggiungere termini senza una domanda; non autorizzare
  da memoria un Articolo, una data, un CELEX o un attore.
- Non aprire né modificare le sessioni della Fase 5, né il loro prompt; non riaprire le decisioni di `docs/PHASE-5-SETUP.md` §10.
- Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale,
  `ALLOWED_RUNTIME_ORIGINS`; non rinnovare la concessione di autonomia.
- Non abbassare gate, validator, test o limiti. Non toccare licenza, non affiliazione, assenza di consulenza legale, README.
- Non riscrivere la storia di `main`, né forzare un push su un branch altrui; non riscrivere un rapporto passato (si annota).
- Vale in pieno «Cosa NON fare» del brief.

## Lezioni (da `docs/HANDOVER.md`; non ripeterle)

- **La data della sessione è un fatto da misurare, e una premessa del prompt può essere sbagliata** (V2C-21: il prompt dava per
  esistente una `verification_note` del record che nessuno strumento ha).
- **Il soggetto grammaticale di un «shall» è il destinatario**: 5f(1) parla di servizi del settore pubblico ma vincola gli Stati
  membri (V2C-21). Leggi chi deve, non di che cosa si parla.
- **Un filtro che non trova nulla non prova nulla**: un confronto tra due output si fa sull'output intero (V2C-21, la verifica
  degli avvertimenti di `evidence-audit`).
- **Una suite può creare `agent/records/` vuoto** durante la batteria: controlla prima della chiusura; nessun output di agenti
  va committato lì.
- **`origin/main` si muove durante la sessione**: riscarica prima di ogni scrittura di `docs/HANDOVER.md` e prima di una PR.
- **Riavvii del worker**: ogni risposta in §8 committata subito; dopo un'interruzione, `git status` prima di rifare un comando.

## Criterio di uscita e consegna

La sessione è completa quando: la rilettura è fatta e annotata; ogni attore di `eidas2.dna.regulated_actor` è vincolato da una
disposizione scritta contro l'Articolo letto, o il limite è dichiarato, con una decisione dell'autore in §8; `eidas2:art-5f` è
corretto o la ragione per non farlo è in §8; nessuna regola, stato o data è cambiato; i validatori, `selftest`, le 25 suite e la
suite del browser passano, e ogni avvertimento nuovo è spiegato; **il prompt della sessione successiva esiste su questo branch,
porta la stessa regola nel suo criterio di uscita, ed è approvato con il lavoro** (regola permanente di §8, 4 nov 2026). Oppure
l'autore decide di fermarsi: anche allora, **prima di chiudere, si scrive il prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (W.1–W.4) cosa è stato scritto (file, righe di §8,
commit), come verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è
completo, dichiaralo.
