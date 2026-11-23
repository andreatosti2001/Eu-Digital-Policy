<!--
Provenance: drafted on 23 Nov 2026 in the network-map session, on `claude/dazzling-mendel-yor1kd`, on the author's answer of that day
(docs/ROADMAP-v2.md §8, 23 Nov 2026, «Network map, N.4: the next session»): after the visible session that put network.html in production,
a trials session that records the author's measurement on a real phone and decides the page's indexing. Drawn from docs/HANDOVER.md (the
network-map entry), docs/ROADMAP-v2.md §8 (the rows of 23 Nov 2026), agent/browser/network-checks.mjs and docs/prompts/v2-visible-network-map.md.
**Nothing was read from any legal text for this prompt**, and no instrument, edge or status is asserted here. It records no §8 row of its
own: the session records its scope as its first write.
Amended on 23 Nov 2026 at the author's request, after PR #128 was merged: the author's own test on a real phone (iPhone 15 Pro,
Safari) is recorded under «Il punto di partenza» as already done, and T.1 now registers it rather than asking for it; T.3 (indexing) stays
open and is still the author's. Written in Italian, as the author's session prompts are. The author may change it
before use.
-->

SESSIONE DI PROVE — la mappa della rete su un telefono vero, e l'indicizzazione di `network.html`

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`). Verifica che `main` contenga `network.html`, `js/network-page.js`, `js/network-model.js`,
`agent/browser/network-checks.mjs`, le righe di §8 del 23 novembre 2026 sulla mappa (scope, N.1 decisioni 1–3, decisione 4, N.3, N.4) e
questo prompt; altrimenti fermati e chiedi all'autore. Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel
registro di `docs/HANDOVER.md`. Lavora sul branch assegnato, mai su `main`.

**Rimisura la data.** La Traccia M ha la precedenza alle sue tappe (`docs/SESSION-ARCHITECTURE.md` §1): dal 25 dicembre 2026
`evidence-audit` stampa `STATUS_PREDATES_MILESTONE` per `eidas2`; la finestra della Sessione 25 (25.2, con N1) si apre il 12 gennaio 2027;
`ap-dma-01` scade il 16 febbraio 2027, le altre 30 regole il 17, `ap-eidas2-01` il 21 (`docs/prompts/v2-track-m-rules-round-2027-02.md`).
Se una di queste date è passata o cade durante la sessione, dillo all'autore prima di iniziare.

**Come prima scrittura**, registra in §8 la riga «The scope of the network-map trials session» con le parole dell'autore; se mancano,
chiedile.

Leggi: `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §2; la voce di `docs/HANDOVER.md` sulla mappa della rete;
`docs/ROADMAP-v2.md` §8, le righe del 23 novembre 2026; `agent/browser/network-checks.mjs` (che cosa misura e che cosa no);
`docs/BROWSER-QA.md`.

## Il punto di partenza (23 novembre 2026; **rimisura tutto**)

- `network.html` è pubblicata, collegata da `instruments.html` e dall'indice del sito, **`noindex`, senza canonical, fuori dal sitemap**
  (§8, N.1 decisione 3): `tools/seo.mjs`, voce `network.html`, `noindex: true`.
- Misurato in Chromium headless (Chrome for Testing 153) a 1440 e 390 px, chiaro e scuro: 23 controlli `netmap:*` passano; `NETMAP 2`
  mostra che otto falliscono su sette difetti piantati. **Non misurato in quella prova: un telefono vero, un dito, Safari, Firefox, un lettore di schermo,
  il contrasto dentro l'SVG sui pixel, le prestazioni su un dispositivo lento.**
- **Prova reale già effettuata dall'autore dopo il merge della PR #128 (23 novembre 2026):**
  - Dispositivo: iPhone 15 Pro.
  - Browser: Safari.
  - Versione iOS: non specificata.
  - Versione Safari: non specificata.
  - Esito riferito dall'autore: «funziona tutto».
  - Problemi riscontrati: nessuno segnalato.

  Questa è una verifica su dispositivo reale riferita dall'autore. Non chiedere di
  ripetere la prova generale. Non inferire versioni del sistema o del browser e
  non estendere il risultato ad altri dispositivi, browser o tecnologie assistive.
- I dati misurati quel giorno: 44 strumenti, 53 relazioni, 18 «proposed» per `js/map-model.js`, 8 strumenti senza relazione. Sono un
  riferimento, non valori da scrivere: i controlli li ricavano da `data/` a ogni esecuzione.

## Obiettivo

- **T.1 · La misura dell'autore (già raccolta).** La prova su iPhone 15 Pro con
  Safari è già stata effettuata dopo il merge della PR #128. Registra in §8
  l'esito riferito dall'autore («funziona tutto»), il dispositivo e il browser;
  indica come non specificate le rispettive versioni di sistema e browser.
  Non chiedere all'autore di ripetere la prova. Se emergono anomalie specifiche
  dai controlli tecnici, chiedi soltanto le informazioni aggiuntive necessarie
  per riprodurle.
- **T.2 · Ciò che la misura trova.** Ogni difetto riferito si riproduce, se possibile, in `agent/browser/` (un controllo che fallisce
  prima della correzione e passa dopo), poi si corregge nella pagina, nel modulo o nel foglio di stile. **Nessun dato nuovo, nessun arco
  nuovo, nessuna stringa riscritta in `data/`.** Un difetto che non si riproduce in Chromium si scrive come tale, con il dispositivo.
- **T.3 · L'indicizzazione.** Con la misura in mano, una domanda all'autore, raccomandazione per prima: lasciare `noindex`, oppure
  togliere `noindex: true` dalla voce di `tools/seo.mjs` (e nient'altro), rigenerare con `node tools/_footer.mjs` e far entrare la pagina
  nel sitemap. Se la pagina diventa indicizzabile, `tools/seo-audit.mjs` pretende ciò che pretende da ogni pagina indicizzabile (testo
  minimo, dati strutturati, canonical): un rosso si nomina e si decide, non si aggira. Risposta in §8.
- **T.4 · Il prompt della sessione successiva**, che per la regola del 22 novembre 2026 è una sessione visibile se questa non lo è
  stata. Il checkpoint finale approva insieme il lavoro e il prompt.

**Regola d'arresto**: se la misura mostra una relazione che i dati non hanno, o ne nasconde una che hanno, o legge una proposta come
legge, ci si ferma e si nomina. Un controllo rosso si nomina e si decide.

## Scrivere e verificare

Ogni commit che tocca un file pubblicato porta la riga `Evidence:` (la misura dell'autore con il dispositivo, o le misure del browser, con
viewport e commit). Prima del checkpoint: `validate`, `i18n-audit`, `design-qa`, `csp`, `thirdparty`, `seo-audit`,
`node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`, le 25 suite e `.control-room/`, la suite del browser
(in background; **non scrivere nell'albero mentre gira**).

## Cosa NON fare

Non toccare `data/`. Non aggiungere, togliere o riclassificare un arco. Non stampare un titolo di parte da `data/brief.json` (§8,
decisione 4). Non introdurre una libreria, un font o una richiesta esterna (`ALLOWED_RUNTIME_ORIGINS` resta vuoto). Non abbassare gate,
validator o test; un controllo che cambia perché il mondo è cambiato si dice nel commit e in `docs/HANDOVER.md`. Non toccare licenza, non
affiliazione, assenza di consulenza legale, README. Non pubblicare l'Editorial, l'observatory o il resto dell'Hybrid. Non riscrivere la
storia di `main` né forzare un push. Vale «Cosa NON fare» del brief.

## Criterio di uscita e consegna

Completa quando: la misura dell'autore è scritta con le sue parole e con ciò che non è stato misurato; ogni difetto riferito è corretto con
un controllo che lo prova, o scritto come non riproducibile; la decisione sull'indicizzazione è in §8 e applicata; validatori, `selftest`,
le 25 suite, `.control-room/` e il browser passano e ogni avvertimento nuovo è spiegato; **il prompt della sessione successiva esiste sul
branch, porta questa stessa regola nel suo criterio di uscita ed è approvato con il lavoro; senza il prompt non si approva.** Oppure
l'autore decide di fermarsi: anche allora si scrive il prompt della successiva.

Prima di chiudere, la checklist T.1–T.4: cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
