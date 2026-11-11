<!--
Provenance: the prompt of Post-v2 PV2-04 (block C, second prototype: the Policy observatory direction, with its instance of the
Regulatory Network Explorer), drafted on 11 Nov 2026 by PV2-03 (docs/prompts/v2-pv2-03-prototype-editorial.md) on
`claude/pv2-03-prototype-editorial`, as its last item under the standing rule of docs/ROADMAP-v2.md §8 (4 Nov 2026). Drawn from
docs/POST-V2.md §3 C (with the addition of 11 Nov 2026), §3 D (its addition on the Explorer), §4.1, §5; docs/FRONTEND-REFERENCES.md §1, §4, §8.2
and §9; docs/PROTOTYPES.md §0 and §1 (PV2-03's output); docs/ROADMAP-v2.md §8. The author's answers, in the author's words, each recorded in §8
when given:
  1. "prototypes/observatory/ (Recommended)" — PV2-04's folder (§8, "PV2-03, C.5 questions 1 and 2").
  2. "Explorer core fixed, extras shrink (Recommended)" — what may shrink if the session runs long (same row).
  And, from PV2-03's measurement: "Read the full tree (Recommended)" — M4 is read on the full accessibility tree where ariaSnapshot shows a
  focusable control with no name (§8, "PV2-03, grid C4 step 4").
  And, after PV2-03's final checkpoint, on the screenshots of the Editorial: "layout orribile"; "Vorrei che ciò che c'è di caratteristico del
  layout del sito (riferimenti esoterici, estetica professionale ma caratteristica) siano mantenuti. Spero che ciò che mi hai mandato non andrà ad
  essere il layout finale del sito"; "Albero-portale e numeri romani" (what the prototypes keep); "Ora, su questo branch (Recommended)" (the
  Editorial reworked in PV2-03). Added to this prompt on 11 Nov 2026, before its approval (§8, the four rows after "Final checkpoint of PV2-03").
The decisions live in §8 and nowhere else; this file is the instruction text that cites them. It records no §8 row of its own and does not
open the session: PV2-04 records its scope in §8 as its first write. Written in Italian, as the author's session prompts are. The author
may change it before use.
-->

PV2-04 — Post-v2, blocco C, secondo prototipo: la direzione Policy observatory, con la sua istanza del Regulatory Network Explorer
(stesse viste, stessi contenuti e stesse condizioni dell'Editoriale, per il confronto; il frontend attuale resta la baseline), per EU Digital
Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi `git rev-parse --is-shallow-repository`: se risponde
`true`, esegui `git fetch --unshallow` prima di qualunque suite.

**Verifica le righe, prima di ogni altra cosa.** In `docs/ROADMAP-v2.md` §8 devono esserci: «G1: Stage 2 is opened» (11 nov 2026); le righe
di PV2-03 (ambito, C.1 domande 1–4, «Checkpoint C.1 of PV2-03 approved», «PV2-03, grid C4 step 4», «PV2-03, C.5 questions 1 and 2») **e la
riga che approva il checkpoint finale di PV2-03**. Se manca quest'ultima, PV2-04 non è autorizzato: fermati e chiedi. Verifica che `main`
contenga `prototypes/editorial/`, `docs/PROTOTYPES.md` e questo prompt.

**Rimisura la data.** **Se è il 12 gennaio 2027 o dopo**, la finestra della Traccia M è aperta e le 33 regole scadono il 3 febbraio: dillo
all'autore per primo, perché la Traccia M ha la precedenza. **Se è il 9 marzo 2027 o dopo**, la concessione di autonomia è scaduta: dillo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of PV2-04 (Post-v2 C, the Policy observatory prototype)» con le
parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di `docs/HANDOVER.md`.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/pv2-04-prototype-observatory`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, «Cosa NON fare».
2. `docs/POST-V2.md` §3 C **con l'aggiunta dell'11 novembre 2026** (che cosa l'Explorer deve mostrare) e §3 D **con la sua aggiunta** (i vincoli
   sui dati dell'Explorer: solo strumenti come nodi, solo `relationships` come archi, nessuna relazione inventata, nessun raggruppamento calcolato,
   l'alternativa accessibile), e §5.
3. `AGENTS.md`, «Architecture — do not rebuild it»: nessun build step, nessuna dipendenza, nessun framework, **nessuna libreria di grafi**,
   nessuna richiesta a terzi; la Content-Security-Policy (`docs/DEPLOYMENT.md` §4).
4. `docs/FRONTEND-REFERENCES.md` §1 (la griglia), §4 (M1…M8; **M4 come deciso l'11 novembre 2026**), §8.2 **direzione 2, Policy observatory**
   (che cosa prende, da dove, che cosa non si ricostruisce senza una dipendenza: il rendering dei grafici di *Tabler*, sostituito da SVG proprio con
   la tabella accanto), §9 (riferimenti soltanto visivi: *Open Future* ed *Economics Observatory / The Pudding*, niente copiato).
5. **`docs/PROTOTYPES.md` §0 e §1 per intero**: il perimetro comune (le quattro viste e i loro stati), come è costruita l'Editoriale, le sue
   misure, i nove casi piantati, ciò che la misura non vede. PV2-04 ripete il perimetro **identico**.
6. `docs/DATA-READINESS.md` §6 e `docs/DATA-GOVERNANCE.md` §1.2 e §2: si importano `js/data.js`, `js/format.js`, `js/pipeline.js`,
   `js/evidence-model.js`, `js/status.js`, `js/routes.js`; non si riscrivono.

Se ritieni che una decisione del brief, del piano o di §8 vada rivista, segnalalo e attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**La seconda direzione, implementata nello stesso perimetro della prima**, in `prototypes/observatory/` (§8, «PV2-03, C.5 questions 1 and 2»):
homepage; pagina dell'AI Act con il Chips Act come stato vuoto; Parte V del brief come articolo; la timeline come vista analitica — a 1280 e
390 px, tema chiaro e scuro, stati vuoti e dati mancanti. **Nella vista analitica, l'Explorer** come modalità, con la tabella delle relazioni come
sua alternativa accessibile. Checkpoint:

- **C.1 · Le premesse.** Verifica le righe. Verifica con `node tools/pages-artifact.mjs list` che `prototypes/` non sia nell'elenco e che
  `tools/pages-artifact.mjs` non venga toccato. Poi, con lo strumento di domande, **una domanda per volta, la raccomandazione per prima**, ciò che
  l'Explorer lascia ai concept e all'autore: **il raggruppamento dei nodi** (se c'è, da quali campi già presenti — per esempio `scope_class` o
  `brief_part`, assente su 24 strumenti di 39, che andrebbero in «non assegnato» — e se è una modalità selezionabile; `docs/POST-V2.md` §3 C).
  **Checkpoint.** Prima della riga che lo approva non si scrive nella cartella.
- **C.2 · La griglia.** Le ancore e i pesi non cambiano; M4 si legge come deciso l'11 novembre 2026. Un'ancora che sembri chiedere una lettura
  nuova si porta all'autore (§1.1, regola 9).
- **C.3 · L'implementazione.** La direzione 2 di `docs/FRONTEND-REFERENCES.md` §8.2: dati in primo piano; un elenco delle sezioni a sinistra e
  uno «in questa pagina» a destra (*USWDS*); tabelle con intestazioni ordinabili, intestazioni fisse e disposizione impilata su schermo stretto, ciascuna
  con didascalia (*GOV.UK*); **ogni grafico accanto alla sua tabella di dati**; schede con etichetta, valore e variazione (solo l'anatomia di *Tabler*,
  riscritta); «sconosciuto» diverso da zero e «non registrato» diverso da entrambi, come nel §1.1 di `docs/PROTOTYPES.md`; un totale che porta il
  conteggio di ciò che non può rendere conto (`aggregate()`). **Il tema scuro non ha riferimento: si progetta, e si dice.**
  **Ciò che è caratteristico del sito resta** (§8, 11 nov 2026, le righe dopo il checkpoint finale di PV2-03): **l'albero-portale delle parti**,
  letto in posto da `#portalTree` di `index.html`, e **la colonna dei numeri romani**, da `data/brief.json`, come nell'Editoriale rifatto
  (`docs/PROTOTYPES.md` §1.6); l'estetica è professionale ma caratteristica, e la pagina usa tutta la larghezza. Pergamena, oro, i caratteri del
  sito, il filo essenziale e le etichette mono **non sono richiesti**: la direzione li tiene o li sostituisce, e lo dice.
  **L'Explorer** (`docs/POST-V2.md` §3 C, aggiunta): nodi = strumenti, archi = `relationships` di `data/instruments.json` letto in posto; tipologia
  dell'arco con **più di un segnale visivo**; direzione **solo** dove `symmetric` è `false`; pannello laterale **a schede** (proprietà, relazioni);
  **legenda sempre visibile**; un campo assente è «non registrato». Il disegno della rete è scritto nella cartella, in JavaScript vanilla e SVG o
  canvas, **deterministico** (stessi dati, stessa disposizione) e **mai da un algoritmo di rilevamento di comunità**. Il mobile non è il canvas
  rimpicciolito. **La tabella delle relazioni è la stessa dell'Editoriale**: si importa `prototypes/editorial/relations.js` (le sue regole sono in
  `docs/PROTOTYPES.md` §1.1), oppure, se la direzione chiede un'altra marcatura, lo si dice e si tengono le stesse regole senza duplicarne la logica.
- **C.4 · La misura.** Gli stessi campioni dell'Editoriale — **E = la pagina dell'articolo, D = la timeline** (qui con l'Explorer) — nominati prima
  di leggere un numero; M1…M8 come scritti nel §4 (gli script di PV2-03 non sono nel repository: si riscrivono dal testo, e lo si dice); `node
  agent/browser/cli.mjs --require-browser` per la baseline. **I nove casi piantati di `docs/PROTOTYPES.md` §1.4, ripetuti**, più quelli
  dell'Explorer: un arco senza claims, disposizioni o verifica mostra «non registrato» nel pannello; un arco simmetrico non ha freccia; ogni nodo
  si raggiunge e si seleziona da tastiera; uno strumento senza relazioni resta nella rete o nell'elenco. Si registra in `docs/PROTOTYPES.md` §2,
  con ciò che la misura non vede (i caratteri di sistema cambiano con il sistema operativo; `tools/thirdparty.mjs` non legge `prototypes/`).
- **C.5 · Il prompt della sessione successiva** — `docs/prompts/v2-pv2-05-prototype-hybrid-selection.md` (blocco C, terza direzione, il confronto
  dei tre prototipi e dei due concept dell'Explorer, la decisione esplicita dell'autore: `docs/POST-V2.md` §4.1 PV2-05), sotto la regola permanente
  di §8. **Il checkpoint finale approva insieme il lavoro e il prompt; senza il prompt non si approva.**

**Regola d'arresto** (§8, «PV2-03, C.5 questions 1 and 2»): **non si riducono mai** le quattro viste, i due temi, gli stati vuoti e i dati mancanti,
né **il nucleo dell'Explorer** — canvas con nodi e archi selezionabili, tipologia con più di un segnale, direzione, pannello a schede, legenda sempre
visibile, la tabella come alternativa accessibile, tastiera e 390 px. **Possono ridursi** gli accessori dell'Explorer: zoom e pan, ricerca, filtri per
tipologia, messa a fuoco del vicinato, riordino del layout, raggruppamento. Ciò che si riduce si dice in `docs/PROTOTYPES.md` §2.

## Lo stato di partenza

Misurato da PV2-03 l'11 novembre 2026 sul suo branch. **Rimisura tutto.**

| Fatto | Misura dell'11 novembre 2026 |
|---|---|
| G1 | **registrato** in §8 l'11 novembre 2026 (lo Stadio 2 è aperto) |
| Uscita di PV2-03 | `prototypes/editorial/` (quattro viste, tabella delle relazioni fissa), **rifatto dopo il giudizio dell'autore** (tre colonne, albero-portale, numeri romani); `docs/PROTOTYPES.md` §0–§1 (§1.6 per la versione attuale); passi C1 3 · C2 4 · C3 2 · C4 4 · C5 4 · C6 non punteggiato |
| Che cosa l'Editoriale non raggiunge | C1 passo 4 e C3 passo 3: nessuna tabella ordinabile o filtrabile da tastiera, per scelta dell'autore — è ciò che la direzione 2 deve provare a portare |
| Dati | 39 strumenti, 40 relazioni (31 con `requires_verification`, 9 senza), 101 eventi, 182 claims, 21 record di enforcement (20 azioni, 1 inazione) |
| Validatori | `validate` 0 errori · 5 avvertimenti; `evidence-audit` e `freshness --as-of` exit 0 (3 richiami di freschezza sull'enforcement); `tools/selftest.mjs` 143/143 |
| Suite | le 25 suite: 1286 test, 1285 superati, 0 falliti, 1 saltato (`.control-room`, loopback IPv6); suite del browser: 343 superati, 0 falliti, 1 indecidibile |
| Concessione di autonomia | scade il 9 marzo 2027: si segnala, non si rinnova |

## Scrivere

- **Il prototipo vive solo in `prototypes/observatory/`.** Nessun file della baseline si modifica, e `prototypes/editorial/` resta com'è: un difetto
  dell'Editoriale trovato qui si segnala all'autore e si corregge solo su una riga di §8. Il prototipo **legge `data/` e `index.html` sul posto**.
- **Nessuna dipendenza, nessun font remoto, nessuna richiesta a terzi**; nessun codice, asset, immagine o animazione di terzi; nessuno script
  inline né attributo `style`; la CSP del sito con `script-src 'self'`. Nulla di Knwler si riusa (§8, «four open points decided», punto 4).
- **Una cifra non è mai uno zero per default e un valore sconosciuto non entra in una somma.** `null` ≠ `unknown`. Nessuna regola che scatta ≠
  nessun obbligo.
- Le righe di §8 prima di ogni documento che dipende da una decisione; ogni risposta in §8 con le parole dell'autore, **committata subito**.
- Prima di ogni checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`,
  `node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`. Prima del checkpoint finale anche le 25 suite e la suite del browser.
  Non scrivere nell'albero mentre la batteria gira. Una `agent/records/` locale non vuota fa fallire 3 test della suite governance: misurali con la
  cartella spostata, e dillo.
- **Nessun identificativo di modello nei messaggi di commit** (`AGENTS.md`, «Git»).

## Checkpoint

- **C.1:** le premesse e la risposta sul raggruppamento (righe §8); il rapporto in `docs/HANDOVER.md`. Attendi l'approvazione, registrata in §8.
- **Finale (C.3–C.5):** il prototipo, la sua misura e ciò che questa non vede (`docs/PROTOTYPES.md` §2); ciò che la regola d'arresto ha ridotto, se
  qualcosa; il prompt di PV2-05 (percorso, commit, risposte dell'autore); la checklist. Riscarica `origin/main` subito prima dell'ultima scrittura di
  `docs/HANDOVER.md`. Poi chiedi se aprire una pull request verso `main` e registra la sorte del branch.

## Cosa NON fare in questa sessione

- Non scegliere la direzione, non dichiarare vincitore un prototipo e non confrontare ancora: è PV2-05. Non costruire la direzione Ibrida.
- Non toccare la baseline, `prototypes/editorial/`, i dati canonici, i modelli di evidenza, il rendering attuale, la CSP, `ALLOWED_RUNTIME_ORIGINS` o
  `tools/pages-artifact.mjs`. Non aggiungere uno strumento, una relazione o un campo a `data/` per far apparire la rete più ricca.
- Non costruire l'Explorer pubblicato (è PV2-08) né implementare il contratto MC-1…MC-15 (è di D); non aprire D, E, S27 né la Fase 5.
- Non cambiare un'ancora o un peso della griglia senza una riga di §8.
- Non toccare licenza, non affiliazione, assenza di consulenza legale, README. Non riscrivere la storia di `main`; non riscrivere un rapporto
  passato (si annota). Vale in pieno «Cosa NON fare» del brief.

## Lezioni di PV2-03 (non ripeterle)

- **Un prototipo che passa tutte le misure può essere giudicato brutto**: la prima Editoriale soddisfaceva la griglia ed era una colonna sola a
  sinistra di uno schermo largo, senza nulla del sito; l'autore la giudicò «orribile». La griglia non ha un criterio estetico: **mostra
  all'autore gli screenshot prima del checkpoint finale**, non dopo.

- **Una misura può smentire la propria specifica, non la griglia**: in PV2-03 la colonna misurò 87 caratteri, dentro l'ancora di C2 ma fuori dai
  65–85 della direzione; si corresse il prototipo, non la misura, e si tennero entrambi i numeri. Fai lo stesso.
- **Uno strumento di misura può non vedere ciò che il browser espone**: `ariaSnapshot` non dà nome a un `<summary>`, l'albero completo sì; per questo
  l'autore ha deciso come leggere M4. Un controllo personalizzato non si sceglie per compiacere lo strumento.
- **Una frase su punteggi passati va verificata prima di scriverla**: PV2-03 scrisse che nessun punteggio di PV2-02 cambiava con la nuova lettura di
  M4, senza averlo misurato, e la corresse (quello di *Simple.css* potrebbe cambiare; non è stato rimisurato).
- **I caratteri di sistema cambiano con il sistema**: nel contenitore di PV2-03 il corpo era *Caladea* e i titoli *Inter* (`CSS.getPlatformFontsForNode`);
  misura nello stesso tipo di ambiente e dillo.
- **Una tabella fissa di 80 righe impilate su un telefono è lunga** (circa 61.000 px): la direzione 2 può mostrare come la si filtra senza perdere
  «uno strumento senza relazioni resta nell'elenco».
- **Riavvii del worker**: ogni risposta in §8 committata subito; dopo un'interruzione, `git status` prima di rifare un comando.
  **Nessun output di agenti in `agent/records/` committato.**

## Criterio di uscita e consegna

La sessione è completa quando: la riga di approvazione finale di PV2-03 è in §8 prima dell'avvio; la risposta sul raggruppamento è in §8 con le
parole dell'autore; la direzione Policy observatory è implementata in `prototypes/observatory/`, sulle quattro viste, in desktop e mobile, in tema
chiaro e scuro, con stati vuoti e dati mancanti, **con l'Explorer nella vista analitica e la tabella delle relazioni come sua alternativa**, almeno nel
nucleo che la regola d'arresto tiene fermo; è misurata con le stesse misure e gli stessi casi piantati di PV2-03 e si dice ciò che la misura non vede
(`docs/PROTOTYPES.md` §2); nulla della baseline, di `prototypes/editorial/`, dei dati, dei modelli, della CSP o di `tools/pages-artifact.mjs` è
cambiato e nulla di terzi è entrato nel repository; i checkpoint sono approvati in §8; `selftest` e le 25 suite passano; **il prompt di PV2-05 esiste
su questo branch, porta la stessa regola nel suo criterio di uscita, ed è approvato con il lavoro** (regola permanente di §8, 4 nov 2026). Oppure
l'autore decide di fermarsi: anche allora, **prima di chiudere, si scrive il prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (C.1–C.5) cosa è stato scritto (file, righe di §8, commit), come
verificarlo a mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è completo, dichiaralo.
