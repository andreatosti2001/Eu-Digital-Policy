<!--
Provenance: drafted on 22 Nov 2026 in the rebalancing session, on `claude/rebalance-housekeeping`, from `main` `a61b99d`, on the author's
answers of that day (docs/ROADMAP-v2.md §8, "Rebalancing the sessions" and "The Hybrid's first piece in production"): every other session
ships a change a reader of eudigitalpolicy.eu can see, and the first piece of the Hybrid to reach production, before the v2 closes, is the
network map. Drawn from docs/PROTOTYPES.md §3.6 (the combination of 13 Nov 2026, `6fdc311`), docs/POST-V2.md §3 D (the addition of 11 Nov
2026 on the Regulatory Network Explorer) and docs/SESSION-ARCHITECTURE.md §1–§2. **Nothing was read from any legal text for this prompt**,
and no instrument, edge or status is asserted here. It records no §8 row of its own: the session records its scope as its first write.
Written in Italian, as the author's session prompts are. The author may change it before use.
-->

SESSIONE VISIBILE — la mappa della rete normativa (Regulatory Network Explorer) in produzione, prima della chiusura della v2

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`). Verifica che `main` contenga le righe di §8 del 22 novembre 2026 («Rebalancing the sessions», «The Hybrid's first
piece in production») e questo prompt; altrimenti fermati e chiedi all'autore. Esegui `git branch -r --no-merged origin/main` e segnala ogni
branch né tuo né nel registro di `docs/HANDOVER.md`. Lavora sul branch assegnato, mai su `main`.

**Come prima scrittura**, registra in §8 la riga «The scope of the network-map session» con le parole dell'autore; se mancano, chiedile.

Leggi: `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §2; `docs/PROTOTYPES.md` §3 e §3.6; `docs/POST-V2.md` §3 D
(l'aggiunta dell'11 novembre 2026) e §4 (la riga PV2-08); `docs/SESSION-ARCHITECTURE.md` §1–§2; `prototypes/hybrid/README.md`;
`docs/CURRENT-ARCHITECTURE.md` §9 e la sua sezione finale (cosa non si ricostruisce).

## Il punto di partenza (22 novembre 2026; **rimisura tutto**)

- La combinazione scelta dall'autore il 13 novembre 2026 vive in `prototypes/hybrid/` (`6fdc311`, non pubblicata): il layout dell'Hybrid con
  la rete 3D dell'observatory (`mountExplorer()` importato invariato) nel riquadro della mappa, «Enlarge the network» a tutta larghezza.
- PROTOTYPES §3.6 ha misurato 29 casi piantati su 29, nessuno scroll orizzontale a 390 px, 0 errori in console. **Non misurato: un telefono
  vero, Safari, Firefox.**
- Un difetto noto nell'observatory: il filtro per tipo lascia gli archi disegnati (`off` senza regola CSS); l'Hybrid porta la regola.
- Il sito pubblicato non ha la mappa. Questa sessione è un'**eccezione decisa dall'autore** alla sequenza di `SESSION-ARCHITECTURE.md` (PV2-08
  nello Stadio 4): porta in produzione **la mappa sola**, non il resto del redesign.

## Obiettivo

- **N.1 · La stima e il perimetro, all'autore.** Come primo passo misura il lavoro (POST-V2 §4, D: «PV2-08 deve stimare il lavoro effettivo
  come suo primo passo»): dove vive la mappa (una pagina nuova, p. es. `network.html`, o una sezione di `instruments.html`); cosa del prototipo
  entra e cosa resta fuori; come rispetta l'architettura (nessun build, nessuna dipendenza, nessuna richiesta di terzi, `js/data.js` unico
  modulo che fa `fetch`, `js/shell.js` per l'intestazione, CSP). Una domanda per decisione, raccomandazione per prima, risposte in §8.
- **N.2 · La costruzione.** La mappa legge gli istrumenti e le relazioni da `data/instruments.json` attraverso `js/data.js`; **nessun dato
  nuovo e nessun arco nuovo**. Un'alternativa testuale (la tabella delle relazioni) è nel markup o resa in modo che chi non ha JavaScript veda
  una lista di link, non un segnaposto. Rispetta `prefers-reduced-motion`. Nessuna stringa nuova senza la sua chiave nel registro i18n.
- **N.3 · La verifica.** I casi piantati di PROTOTYPES §3.6 riportati in `agent/browser/` per la pagina pubblicata; 390 e 1440 px, chiaro e
  scuro, tastiera (frecce, Invio, Esc, Tab), JavaScript spento. Chiedi all'autore **una misura su un telefono vero** prima del checkpoint
  finale e scrivi ciò che non è stato misurato.
- **N.4 · Il prompt della sessione successiva**, che per la regola del 22 novembre 2026 è una sessione di manutenzione o di prove se questa è
  visibile. Il checkpoint finale approva insieme il lavoro e il prompt.

**Regola d'arresto**: se la mappa mostra una relazione che i dati non hanno, o ne nasconde una che hanno, ci si ferma e si nomina. Un
controllo rosso si nomina e si decide.

## Scrivere e verificare

Ogni commit che tocca un file pubblicato porta la riga `Evidence:` (le misure del browser, con viewport e commit). Prima del checkpoint:
`validate`, `i18n-audit`, `design-qa`, `csp`, `thirdparty`, `seo-audit` (la pagina nuova entra nel sitemap solo se l'autore lo decide),
`node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`, le 25 suite e `.control-room/`, la suite del browser (in
background; **non scrivere nell'albero mentre gira**).

## Cosa NON fare

Non toccare `data/`. Non aggiungere, togliere o riclassificare un arco. Non pubblicare l'Editorial, l'observatory o il resto dell'Hybrid. Non
introdurre una libreria, un font o una richiesta esterna (`ALLOWED_RUNTIME_ORIGINS` resta vuoto). Non abbassare gate, validator o test. Non
toccare licenza, non affiliazione, assenza di consulenza legale, README. Non riscrivere la storia di `main` né forzare un push. Vale «Cosa NON
fare» del brief.

## Criterio di uscita e consegna (aggiunto il 23 novembre 2026)

*Aggiunto dalla sessione Traccia M (`eidas2`), su `claude/sweet-lamport-fhdex7`, quando l'autore ha scelto questa sessione come la successiva
(`docs/ROADMAP-v2.md` §8, 23 nov 2026, «Track M (eidas2), M.4: the next session»). Il resto del prompt è come scritto il 22 novembre.*

Completa quando: la mappa è pubblicata come l'autore l'ha decisa in §8, senza un dato o un arco nuovo; N.3 è misurato e ciò che non è stato
misurato è scritto; validatori, `selftest`, le 25 suite, `.control-room/` e il browser passano e ogni avvertimento nuovo è spiegato; **il
prompt della sessione successiva esiste sul branch, porta questa stessa regola nel suo criterio di uscita ed è approvato con il lavoro; senza il
prompt non si approva.** Oppure l'autore decide di fermarsi: anche allora si scrive il prompt della successiva.

**La Traccia M ha la precedenza alle sue tappe** (`docs/SESSION-ARCHITECTURE.md` §1). Rimisura la data prima di iniziare: dal 25 dicembre 2026
`evidence-audit` stampa `STATUS_PREDATES_MILESTONE` per `eidas2` (e prima per `ai-act` e `pld`); gli stati alle tappe sono della sessione 25,
25.2, con la questione N1 (`docs/prompts/v2-session-25.md`, aggiunta del 23 novembre 2026). Se la finestra della 25 (dal 12 gennaio 2027) si apre
mentre questa sessione è in corso, dillo all'autore. `ap-eidas2-01` scade il 21 febbraio 2027; `ap-dma-01` il 16 febbraio; le altre 30 regole il
17 febbraio (`docs/prompts/v2-track-m-rules-round-2027-02.md`).

Prima di chiudere, la checklist N.1–N.4: cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
