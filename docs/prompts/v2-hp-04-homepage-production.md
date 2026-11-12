<!--
Provenance: the prompt of HP-04 (the homepage in production: the plan executed), drafted on 12 Nov 2026 by HP-03 (the homepage
production plan, on `claude/quirky-goldberg-fpoxdz`), as its last item under the standing rule of docs/ROADMAP-v2.md §8 (4 Nov 2026).
Drawn from docs/HOMEPAGE-PRODUCTION-PLAN.md (HP-03's output, the plan this session executes), prototypes/homepage/README.md, and the
§8 rows "HP-03: …". The author's answers, in the author's words, each recorded in §8 when given:
  1. "Approve (Recommended)" — the plan's index; "Keep markup, enhance (Recommended)" — the figure enhances #portalTree, whose markup
     stays byte for byte; "§8 row + PR merge (Recommended)" — the authorization route; "Figure + opening; depth later (Recommended)"
     — HP-02b's layers stay in the prototype.
  2. "Read parts lit; no veil (Recommended)"; "One English line + README (Recommended)"; "iPhone, ≤10 % slow frames (Recommended)";
     "Yes, with the figure (Recommended)" — the open questions of the plan's §7.
  3. "HP-04: execute the plan (Recommended)" — the next session.
The decisions live in §8 and nowhere else; this file is the instruction text that cites them. It records no §8 row of its own and
does not open the session: HP-04 records its scope in §8 as its first write. Written in Italian, as the author's session prompts are.
The author may change it before use.
-->

HP-04 — la homepage in produzione: l'esecuzione del piano, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi `git rev-parse --is-shallow-repository`: se risponde `true`,
esegui `git fetch --unshallow` prima di qualunque suite.

**Verifica le righe, prima di ogni altra cosa.** In `docs/ROADMAP-v2.md` §8 devono esserci le righe «The scope of HP-03», «HP-03: C.1 approved»,
«HP-03: the open questions» e «HP-03: the next session», e su `main` devono esserci `docs/HOMEPAGE-PRODUCTION-PLAN.md`, `prototypes/homepage/` e
questo prompt. Se manca qualcosa, fermati e chiedi.

**Rimisura la data.** **Se è il 12 gennaio 2027 o dopo**, la finestra della Traccia M è aperta e le 33 regole scadono il 3 febbraio: dillo all'autore per
primo, perché la Traccia M ha la precedenza. **Se è il 9 marzo 2027 o dopo**, la concessione di autonomia è scaduta: dillo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of HP-04 (the homepage in production)» con le parole con cui l'autore avvia
questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande.

**Poi, prima di toccare un file del sito, l'autorizzazione (Classe D).** `docs/AUTONOMY-POLICY.md` mette «Redesigning the website» e «Publishing,
deploying, or pushing to `main`» nella Classe D: serve un'autorizzazione esplicita dell'autore che **nomini l'azione**. Chiedila con lo strumento di
domande, nominando l'azione («pubblicare la figura della homepage come la descrive `docs/HOMEPAGE-PRODUCTION-PLAN.md`») e registrala in §8 con le sue
parole (passo 0 del piano, §4). **Senza quella riga non si scrive nulla fuori da `docs/`.**

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di `docs/HANDOVER.md`
(HP-03 ha segnalato `claude/brave-goldberg-gm87jp`, una riga di `js/datasets-page.js`, non suo: verifica se è ancora aperto).

## Obiettivo della sessione

**Eseguire il piano, e solo il piano.** Leggi `docs/HOMEPAGE-PRODUCTION-PLAN.md` per intero prima di toccare qualunque file, poi
`prototypes/homepage/README.md`. **Rimisura ogni numero del piano** (righe, byte, conteggi, il baseline del §0) sull'albero del giorno: se una riga
citata non dice più ciò che il piano dice, fermati e segnala la differenza, non riconciliarla in silenzio.

I commit, nell'ordine del piano (§4 e §8), su un solo branch:

1. `img/home/` (le tre immagini, byte per byte quelle del prototipo), `js/home-serpent.js` (la geometria delle 22 perle, **generata** da
   `prototypes/homepage/assets/derive-serpent.py`, non scritta a mano; verifica che lo script riproduca tutto byte per byte).
2. `js/masthead.js`: `upcomingEvents(ix, asOf)` e `statedDay()` esportate, usate dalle sue due viste. **Il masthead reso deve essere identico prima e
   dopo**: dillo con una misura, non con un'impressione.
3. `js/home-figure.js` e `css/home.css`, non ancora caricati da nessuna pagina: tutto ciò che il §1 del piano toglie (le due fetch, `brief.js`, il tema e
   la nav del prototipo, le tre tracce `__hp*`, la profondità a strati, la banda del prototipo) e ciò che cambia (le parti dal documento, il tema da
   `body[data-theme]`, le immagini solo quando l'apertura parte, «≈» per una data al mese, le parti lette accese, nessun velo, i segni di stato sul masthead,
   `lang="en"` e la riga inglese nelle edizioni).
4. **Il cablaggio:** le due aggiunte a `index.html`, la chiamata in `js/main.js`, poi `node tools/_footer.mjs`. `git status --porcelain` dopo deve
   mostrare solo `index.html`, `it/`, `fr/`, `es/` e `js/main.js`: ogni altro percorso è un risultato da riportare.
5. I controlli nuovi del §5 in `agent/browser/` (`home:*`), con la loro suite.
6. **La misura su iPhone (§6): la fa l'autore**, con Safari Web Inspector, tre aperture, al più 10 % di fotogrammi oltre 25 ms e nessun compito oltre
   50 ms in ciascuna. Preparagli i passi e il server; **non inventare, stimare o simulare la misura**. Se fallisce: si semplifica il disegno nell'ordine del
   §6, mai la sequenza; se nulla basta, chiedi.
7. `docs/`: `CURRENT-ARCHITECTURE.md` §9, `BROWSER-QA.md`, `PROTOTYPES.md` §H, il README del prototipo (cosa è entrato), `HANDOVER.md`, §8.
   **Le parole che aggiungono la figura alla limitazione 8 del README del repository** si propongono all'autore e si scrivono solo con la sua
   approvazione in §8 (sezione rossa: si aggiunge, non si attenua).

## Checkpoint

- **C.1:** dopo il commit 4, su un albero quieto: video e immagini della homepage con la figura (Day e Night, desktop e telefono emulato, l'apertura,
  le due lenti, `/it/` con la sua riga inglese, la pagina senza JavaScript), la batteria del §0 del piano e il diff del masthead. Attendi l'approvazione,
  registrata in §8.
- **C.2:** la misura su iPhone dell'autore, registrata in §8 con il modello, iOS e Safari.
- **Finale:** la checklist, il prompt della sessione successiva (con ogni probabilità PV2-05 senza la homepage: chiedilo). Riscarica `origin/main`
  subito prima dell'ultima scrittura di `docs/HANDOVER.md`. Poi chiedi se aprire la pull request verso `main` (**merge commit**, non squash: il ritorno
  indietro è un solo `git revert -m 1`) e registra la sorte del branch. Il merge è dell'autore.

## Cosa NON fare in questa sessione

- Nulla fuori dal piano: niente profondità a strati, niente veli, niente traduzioni, nessuna chiave in `i18n/`, niente in `data/`, nessun cambiamento alla
  CSP, a `ALLOWED_RUNTIME_ORIGINS`, a `tools/pages-artifact.mjs`, a `.github/`, al registro delle decisioni o al dispatcher.
- Non toccare `#portalTree`, la sua didascalia, il pulsante «Open the contents» né `app.js`: la figura li legge, non li cambia.
- Non ricalcare, ridisegnare o sostituire il serpente; non cambiare il racconto dell'apertura approvato in §8.
- Non indebolire un controllo per farlo passare; non aggiungere un'eccezione a `home:labels` diversa da *Digital Networks Act*.
- Non toccare licenza, non affiliazione, assenza di consulenza legale. Non riscrivere la storia di `main`, non fare merge.
- Non rendere vero in un documento ciò che l'albero non mostra (le impostazioni di `docs/DEPLOYMENT.md` §3a restano parola dell'autore).

## Lezioni di HP-03 (non ripeterle)

- **`node agent/browser/cli.mjs --help` avvia la suite intera**: non è un aiuto. Lanciala solo quando la vuoi, su un albero quieto, e salva l'uscita intera
  in un file invece di tagliarla con `head`.
- **Una data al mese non è un conto di giorni**: il prototipo stampava «DMA · 50 d» per una scadenza nota al mese; il masthead scrive «≈». Ogni numero
  derivato da una data porta la sua precisione.
- **La stessa cosa calcolata in quattro posti** (il prossimo evento) è un disaccordo che aspetta il suo giorno: una funzione, importata da tutti.
- **Il prototipo sfuggiva a `design-qa`** (che legge `css/` e `js/`): spostato lì, lo vede per la prima volta. Aspettati risultati nuovi e trattali come tali.

## Criterio di uscita e consegna

La sessione è completa quando: la riga d'ambito e la riga d'autorizzazione (Classe D) di HP-04 sono in §8 con le parole dell'autore; i sette commit del
piano esistono nell'ordine, ciascuno con i validatori al baseline; la figura è su `index.html` come il piano la descrive e `#portalTree` è byte per byte
quello di `main`; i controlli `home:*` passano; la misura su iPhone è registrata (o il suo fallimento e la decisione dell'autore); `tools/selftest.mjs`, le
25 suite e `.control-room/` e la suite del browser passano; **il prompt della sessione successiva esiste su questo branch, porta la stessa regola nel suo
criterio di uscita, ed è approvato con il lavoro** (regola permanente di §8, 4 nov 2026). Oppure l'autore decide di fermarsi: anche allora, **prima di
chiudere, si scrive il prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun commit del piano cosa è stato scritto (file, righe di §8, commit), come verificarlo a
mano, se esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è completo, dichiaralo.
