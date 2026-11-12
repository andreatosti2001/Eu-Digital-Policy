<!--
Provenance: the prompt of HP-02 (the homepage follow-up), drafted on 12 Nov 2026 by HP-01 (the homepage session, on
`claude/funny-hamilton-yt9uh0`), as its last item under the standing rule of docs/ROADMAP-v2.md §8 (4 Nov 2026). Drawn from
prototypes/homepage/README.md (HP-01's output), docs/PROTOTYPES.md §H, docs/ROADMAP-v2.md §8 (the five rows "HP-01: …" and the scope row),
docs/FRONTEND-REFERENCES.md §4 (M1–M8) and docs/POST-V2.md §3 C–D. The author's answers, in the author's words, each recorded in §8 when given:
  1. "Supersedes homepage only (Recommended)" — the homepage prototype replaces PV2-05's homepage view only.
  2. "I'll supply the original (Recommended)" — the serpent's sharp version comes from the author's original artwork.
  3. "Homepage follow-up first (Recommended)" — HP-02 comes before PV2-05.
  4. "No, keep two lenses (Recommended)" — Status and Falls due next only.
  And, for the record: "Yes, all of it (Recommended)" (HP-01's decisions recorded with this prompt); "After recording (Recommended)" (the pull
  request opened after the record).
The decisions live in §8 and nowhere else; this file is the instruction text that cites them. It records no §8 row of its own and does not
open the session: HP-02 records its scope in §8 as its first write. Written in Italian, as the author's session prompts are. The author
may change it before use.
-->

HP-02 — il seguito della homepage: il serpente originale, il contrasto nella figura, i tempi dell'apertura, le lingue (piano), per EU Digital
Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi `git rev-parse --is-shallow-repository`: se risponde
`true`, esegui `git fetch --unshallow` prima di qualunque suite.

**Verifica le righe, prima di ogni altra cosa.** In `docs/ROADMAP-v2.md` §8 devono esserci la riga d'ambito di HP-01 («The scope of HP-01, the
homepage session») e le quattro righe «HP-01: …» (la direzione, l'apertura, il serpente di notte, il prototipo costruito e ciò che lo segue).
Verifica che `main` contenga `prototypes/homepage/` (con il suo `README.md`), `docs/PROTOTYPES.md` §H e questo prompt. Se manca qualcosa, fermati
e chiedi.

**Il disegno del serpente è dell'autore.** HP-02 parte dall'originale che l'autore fornisce (alta risoluzione o SVG). **Se l'autore non l'ha
ancora fornito, chiedilo per primo**; non ricalcarlo dall'icona, non disegnarne uno, non scaricarne uno: è il marchio del sito, e una versione
derivata richiede una decisione dell'autore che non è stata presa (§8, «HP-01: the homepage prototype built», punto 3).

**Rimisura la data.** **Se è il 12 gennaio 2027 o dopo**, la finestra della Traccia M è aperta e le 33 regole scadono il 3 febbraio: dillo
all'autore per primo, perché la Traccia M ha la precedenza. **Se è il 9 marzo 2027 o dopo**, la concessione di autonomia è scaduta: dillo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of HP-02 (the homepage follow-up)» con le parole con cui l'autore
avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di `docs/HANDOVER.md`.

## Obiettivo della sessione

Portare `prototypes/homepage/` da prototipo approvato a prototipo **misurato e pronto a un piano di produzione**, senza toccare il sito.

1. **Il serpente originale.** Sostituisci i tre file derivati in `prototypes/homepage/assets/` con il disegno dell'autore: il corpo, i puntini e
   la variante notte. Se l'originale è vettoriale, il contorno notturno diventa un tratto (`--paper-dim`, circa 0,75 px), non un file a parte, e la
   geometria dei puntini si legge dal disegno, non da una misura sull'immagine. L'apertura resta quella approvata (§8, «HP-01: the opening»):
   cambia la nitidezza, non il racconto.
2. **Il contrasto nella figura.** Misura, in giorno e notte, ciò che HP-01 ha giudicato solo a occhio: le etichette delle orbite (`--paper-faint`),
   le etichette degli strumenti, i punti tratteggiati, il contorno notturno, la didascalia. Con il metodo di `docs/FRONTEND-REFERENCES.md` §4 (M2)
   dove si applica, e dicendo dove non si applica (testo dentro un SVG). Correggi ciò che non raggiunge 4,5 : 1 per il testo e 3 : 1 per i segni
   grafici, solo con i token del sito.
3. **I tempi dell'apertura.** Misura l'apertura in Chromium con la CPU rallentata (4× e 6×): fotogrammi persi, durata reale. Se scatta,
   semplifica il disegno, non la sequenza (meno nodi nel DOM, meno attributi per fotogramma), e ridichiara la misura.
4. **Le lingue (piano, non implementazione).** Elenca ogni stringa nuova della figura (lenti, legenda, didascalie, etichette delle orbite,
   l'elenco) e proponi come raggiunge le edizioni it, fr, es attraverso `i18n/locales.json`, con la regola delle traduzioni superate di `AGENTS.md`.
   Mettila all'autore come domanda; **non scrivere traduzioni**.
5. **Le correzioni minori lasciate da HP-01**: le etichette che si sfiorano (in basso; «Data Omnibus» e un punto *mapped*; CRA ed eIDAS2), e lo stato
   del README.

**Due lenti, non quattro** (risposta dell'autore: «No, keep two lenses (Recommended)»): *Status* e *Falls due next*. Non costruire *Enforcement* né
*Relationships*.

## Lo stato di partenza

- `prototypes/homepage/` (`d1ea89b`, `9e19891`): leggi il suo `README.md` per intero prima di toccare un file. È adattato a MC-2: le bande contano gli
  strumenti core e adiacenti (`js/regulatory-model.js coveredInstruments()`), e ogni strumento contato porta il suo segno di stato nella figura.
- I file derivati dall'icona sono **solo** nella cartella del prototipo; `img/icons/` non è stato toccato.
- PV2-05 viene dopo HP-02, senza la sua vista homepage (§8, punto 2 della riga «HP-01: the homepage prototype built»): il suo prompt va annotato
  di conseguenza se non lo è già, con una nota, senza riscriverlo.

## Scrivere

- Il prototipo, su un branch della sessione; il suo `README.md` aggiornato (ciò che è cambiato, ciò che è stato misurato, ciò che resta non visto).
- `docs/PROTOTYPES.md` §H: una riga per ciò che HP-02 ha misurato, con rimando al README; niente di duplicato.
- `docs/ROADMAP-v2.md` §8: le risposte dell'autore, con le sue parole, quando arrivano.
- `docs/HANDOVER.md`: il registro dei branch e l'entrata della sessione, in testa, dopo aver riscaricato `origin/main`.

## Checkpoint

- **C.1:** il disegno dell'autore ricevuto e integrato; screenshot e un video dell'apertura in giorno e notte, desktop e mobile, mostrati all'autore
  **prima** delle misure. Attendi l'approvazione, registrata in §8.
- **Finale:** il contrasto misurato e corretto; i tempi misurati; il piano delle lingue con la risposta dell'autore; le correzioni minori; il prompt
  della sessione successiva (con ogni probabilità PV2-05 senza la homepage, oppure il piano di produzione della homepage: chiedilo); la checklist.
  Riscarica `origin/main` subito prima dell'ultima scrittura di `docs/HANDOVER.md`. Poi chiedi se aprire una pull request verso `main` e registra la
  sorte del branch.

## Cosa NON fare in questa sessione

- Non toccare `index.html`, `style.css`, `app.js`, `js/`, `css/`, `data/`, `i18n/`, `img/icons/`, la CSP, `ALLOWED_RUNTIME_ORIGINS` o
  `tools/pages-artifact.mjs`. Nulla della homepage va in produzione in questa sessione.
- Non ricalcare, ridisegnare o sostituire il serpente con qualcosa che l'autore non ha fornito.
- Non cambiare il racconto dell'apertura approvato in §8; se la misura dei tempi chiede di cambiarlo, chiedi.
- Non contare strumenti per stato nel prototipo: il conteggio ha una casa sola (`js/regulatory-model.js`, MC-2).
- Non scrivere traduzioni; non aggiungere lenti.
- Non toccare licenza, non affiliazione, assenza di consulenza legale, README del repository. Non riscrivere la storia di `main`.

## Lezioni di HP-01 (non ripeterle)

- **Mostra video, non solo immagini.** Ogni decisione sull'apertura è arrivata da un video renderizzato; il rallentato e l'affiancato (prima/dopo,
  due versi di rotazione) hanno chiuso le domande più in fretta delle parole.
- **`main` si muove durante la sessione.** In HP-01 #102 ha cambiato ciò che le bande contano mentre il prototipo era in costruzione: riscarica e
  ribasa prima di scrivere `docs/`, e rileggi i moduli che il prototipo importa.
- **Il nero del serpente è il fondo della notte** (`#14111B` = `--ink-0`): ogni versione va provata nei due temi, non solo in giorno.
- **Un filo sottile ricavato da un'immagine piccola si sfoca**: calcolalo a risoluzione maggiore, o meglio usa un tratto vettoriale.
- **Nessun numero scritto a mano**: anche una didascalia nascosta («sixteen core instruments») è una seconda casa di un conteggio.

## Criterio di uscita e consegna

La sessione è completa quando: la riga d'ambito di HP-02 è in §8 con le parole dell'autore; il disegno dell'autore è nel prototipo e i file derivati
dall'icona non servono più; il contrasto nella figura è misurato in giorno e notte e corretto con i token del sito; i tempi dell'apertura sono
misurati con la CPU rallentata; il piano delle lingue ha la risposta dell'autore in §8; nulla del sito pubblicato è cambiato e nulla di terzi è
entrato nel repository; i validatori e `tools/selftest.mjs` passano come su `main`; il README del prototipo e `docs/PROTOTYPES.md` §H dicono ciò che è
stato misurato e ciò che no; **il prompt della sessione successiva esiste su questo branch, porta la stessa regola nel suo criterio di uscita, ed è
approvato con il lavoro** (regola permanente di §8, 4 nov 2026). Oppure l'autore decide di fermarsi: anche allora, **prima di chiudere, si scrive il
prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (1–5) cosa è stato scritto (file, righe di §8, commit), come verificarlo a
mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è completo, dichiaralo.
