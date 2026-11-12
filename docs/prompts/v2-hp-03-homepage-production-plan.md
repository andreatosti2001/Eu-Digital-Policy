<!--
Provenance: the prompt of HP-03 (the homepage production plan), drafted on 12 Nov 2026 by HP-02 (the homepage follow-up, on
`claude/jolly-hamilton-du9xkp`), as its last item under the standing rule of docs/ROADMAP-v2.md §8 (4 Nov 2026). Drawn from
prototypes/homepage/README.md (HP-01's and HP-02's output), docs/PROTOTYPES.md §H, docs/ROADMAP-v2.md §8 (the rows "HP-01: …" and "HP-02: …"), and
docs/AI-SAFE-BOUNDARIES.md, docs/DEPLOYMENT.md, docs/SEO-OPERATIONS.md, agent/release/README.md for the gates a production change meets.
The author's answers, in the author's words, each recorded in §8 when given:
  1. "Homepage production plan (Recommended)" — HP-03 is a plan, not an implementation.
  2. "English figure, declared (Recommended)" — the figure is English in the it / fr / es editions, and says so.
  3. "Keep, they pass (Recommended)" — rings and tree lines in --paper-faint.
  4. "Leave it, say so (Recommended)" — the Digital Networks Act label.
  5. "Accept as measured (Recommended)" — the opening's timing at 6x CPU, to be revisited on a real phone.
  6. "This is the best (Recommended)" and "Accept as drawn (Recommended)" — the serpent is the author's 1920 x 1080 raster, framed as drawn.
The decisions live in §8 and nowhere else; this file is the instruction text that cites them. It records no §8 row of its own and does not open the
session: HP-03 records its scope in §8 as its first write. Written in Italian, as the author's session prompts are. The author may change it before use.
-->

HP-03 — il piano di produzione della homepage, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi `git rev-parse --is-shallow-repository`: se risponde `true`,
esegui `git fetch --unshallow` prima di qualunque suite.

**Verifica le righe, prima di ogni altra cosa.** In `docs/ROADMAP-v2.md` §8 devono esserci le righe «HP-02: C.1 approved», «HP-02: the measures»,
«HP-02: the languages» e «HP-02: the next session». Verifica che `main` contenga `prototypes/homepage/` con `assets/serpent-original.png`,
`assets/derive-serpent.py` e il `README.md` aggiornato da HP-02, e questo prompt. Se manca qualcosa, fermati e chiedi.

**Rimisura la data.** **Se è il 12 gennaio 2027 o dopo**, la finestra della Traccia M è aperta e le 33 regole scadono il 3 febbraio: dillo all'autore per
primo, perché la Traccia M ha la precedenza. **Se è il 9 marzo 2027 o dopo**, la concessione di autonomia è scaduta: dillo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of HP-03 (the homepage production plan)» con le parole con cui l'autore avvia
questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di `docs/HANDOVER.md`.

## Obiettivo della sessione

**Un piano, non un'implementazione.** Scrivi il piano con cui `prototypes/homepage/` diventerebbe la homepage pubblicata, in modo che l'autore possa
approvarlo, correggerlo o fermarlo **prima** che una riga del sito cambi. Nessun file di `index.html`, `style.css`, `app.js`, `js/`, `css/`, `data/`,
`i18n/`, `img/`, `.github/`, `tools/pages-artifact.mjs` o della CSP si modifica in questa sessione.

Il piano risponde, per scritto e con rimandi al codice (file e righe), a queste domande:

1. **Che cosa cambia, file per file.** Cosa del prototipo entra in `index.html` (il markup della figura, i pulsanti, la banda del prototipo che NON entra),
   cosa diventa un modulo sotto `js/` (oggi `homepage.js`, che importa `prototypes/editorial/brief.js`: **quella dipendenza non può restare**), cosa va in
   `css/` o `style.css`, dove vivono le tre immagini del serpente e quale percorso le pubblica (`tools/pages-artifact.mjs` è l'unica casa di «cosa si
   pubblica»; `img/` è pubblicato, `prototypes/` no). Una figura costruita da script non è nel markup: dì come lo leggono la ricerca, `tools/seo-audit.mjs`
   e un crawler senza JavaScript (oggi il tree è markup, la figura no).
2. **Il contratto con ciò che esiste.** `js/regulatory-model.js` resta l'unica casa dei conteggi (MC-2: nessun conteggio per stato nel nuovo modulo);
   `js/data.js` resta l'unico modulo che fa `fetch`; la CSP (`script-src` con gli hash degli script inline, nessuno qui) e `ALLOWED_RUNTIME_ORIGINS`
   (vuota) non cambiano; `node tools/_footer.mjs` rigenera pagine e edizioni: cosa cambia in `it/`, `fr/`, `es/`, `instruments/<id>/`.
3. **Le lingue** (§8, «English figure, declared»): dove e con quali parole la figura si dichiara inglese nelle edizioni it / fr / es, e come si evita che
   `tools/i18n-audit.mjs` o `tools/editions.mjs` la leggano male. Non scrivere traduzioni, non aggiungere chiavi.
4. **I gate**, in ordine, per ogni passo del piano: quale validatore o suite lo ferma, quale classe di autonomia lo governa (`docs/AUTONOMY-POLICY.md`,
   la tabella ambra di `docs/AI-SAFE-BOUNDARIES.md` §2: `i18n/**`, il CSS «solo entro i token» e la prosa di `index.html`, che è dell'autore; per `js/` quella
   tabella non dice nulla: verifica tu dove lo collocano gli altri documenti, e dillo se non lo trovi), cosa passa dal dispatcher e dal
   gate di rilascio (`agent/release/README.md`, `docs/DEPLOYMENT.md` §2a) e cosa no, e **chi firma** (il registro delle decisioni ha una voce: del
   6 novembre 2026).
5. **Ciò che i test di oggi non vedono**, e quali controlli nuovi servirebbero perché la figura sia protetta come il resto: oggi la suite del browser
   (`agent/browser/`) non copre `prototypes/`, nessuna suite misura il contrasto in una figura SVG (HP-02 lo ha fatto con uno script di scratch, descritto
   nel README), nessuna controlla i tempi, e **nessun lettore di schermo è stato usato**: dì come ciascuno diventerebbe un controllo o una misura
   dichiarata, e che cosa NON proverebbe.
6. **I tempi su un telefono reale.** HP-02 ha misurato con la CPU rallentata, in un Chromium senza GPU (0 fotogrammi persi a 1×; 10–30 % a 6×; il
   costo è nel rendering, non nello script). L'autore ha accettato la misura e ha detto di rivederla su un dispositivo vero: il piano contiene **quel passo**,
   con quale dispositivo, quale misura, quale soglia, e cosa succede se la soglia non è rispettata (la sequenza non cambia: si semplifica il disegno).
7. **Le questioni aperte del disegno**, ciascuna come domanda all'autore con la sua risposta in §8: il serpente è un raster (la versione vettoriale
   renderebbe nitido il disegno e il contorno notturno un tratto esatto); la sua inquadratura nel disco è diversa da quella dell'icona del sito, quindi il
   primo fotogramma dell'apertura non è identico al marchio nell'intestazione; l'etichetta *Digital Networks Act* in basso (lasciata com'è); le tracce
   `__hpFrame`, `__hpLabels` e `__hpParallax` per le registrazioni di revisione (non entrano in produzione); **la profondità a strati** (HP-02b: otto gruppi SVG
   traslati dal mouse, solo con puntatore fine e senza movimento ridotto; misurata e tenuta a 8 unità, §8 «HP-02b»), che il piano deve dire se porta in produzione, con quale
   costo di misura e quale comportamento per tastiera, touch e lettore di schermo.
8. **Il rilascio e il ritorno indietro.** In quanti commit, in che ordine, con quale ramo e quale pull request; come si torna indietro (un solo `git revert`
   dei commit del piano deve restituire la homepage pubblicata, e il piano deve dire come lo si verifica); cosa si guarda dopo il deploy
   (`docs/DEPLOYMENT.md`, `docs/SEO-OPERATIONS.md`: canonico, sitemap, indicizzabilità).

**Non scrivere il piano da zero**: parti da `prototypes/homepage/README.md` (per intero, prima di toccare qualunque file), da `docs/PROTOTYPES.md` §H e dalle
righe di §8. **Misura invece di ricordare**: ogni numero del piano (righe, byte, nodi, suite) si rilegge dall'albero il giorno della sessione.

## Scrivere

- Il piano: `docs/HOMEPAGE-PRODUCTION-PLAN.md` (un documento nuovo, con la sua stessa avvertenza: è una proposta; approvata solo dalla riga di §8 che la cita).
- `docs/ROADMAP-v2.md` §8: la riga d'ambito all'inizio, le risposte dell'autore con le sue parole quando arrivano.
- `docs/HANDOVER.md`: il registro dei branch e l'entrata della sessione, in testa, dopo aver riscaricato `origin/main`.

## Checkpoint

- **C.1:** l'indice del piano (i suoi capitoli e, per ciascuno, la domanda a cui risponde) e **le tre decisioni più grosse** che il piano chiede
  all'autore, mostrati **prima** di scrivere il resto. Attendi l'approvazione, registrata in §8.
- **Finale:** il piano completo, le domande con le risposte, il prompt della sessione successiva (con ogni probabilità l'esecuzione del piano, oppure
  PV2-05 senza la homepage: chiedilo), la checklist. Riscarica `origin/main` subito prima dell'ultima scrittura di `docs/HANDOVER.md`. Poi chiedi se aprire
  una pull request verso `main` e registra la sorte del branch.

## Cosa NON fare in questa sessione

- Non toccare nulla del sito pubblicato né dei suoi gate (elenco sopra). Non portare in produzione parte della figura «per provare».
- Non scrivere traduzioni, non aggiungere chiavi a `i18n/`, non toccare `data/`.
- Non ricalcare, ridisegnare o sostituire il serpente; non cambiare il racconto dell'apertura approvato in §8.
- Non rendere vero in un documento ciò che l'albero non mostra: se il piano dipende da un'impostazione del repository o di Pages che solo l'autore vede
  (`docs/DEPLOYMENT.md` §3a), scrivila come una domanda, non come un fatto.
- Non toccare licenza, non affiliazione, assenza di consulenza legale, README del repository. Non riscrivere la storia di `main`.

## Lezioni di HP-02 (non ripeterle)

- **Una misura che non applica il metodo del sito va detta.** M2 legge `color`; un SVG dipinge con `fill` e `stroke`: HP-02 lo ha scritto e ha misurato i pixel
  dietro ogni elemento, invece di fingere M2.
- **Tre esecuzioni non risolvono differenze piccole.** Il conteggio dei fotogrammi persi ha una dispersione grande; ciò che ha separato il miglioramento dal
  rumore è stato misurare il costo dello script per fotogramma a parte.
- **Un correttore che sposta un'etichetta può farla leggere come il nome del segno accanto.** Il limite di spostamento (26 unità; 34 per un'etichetta di
  scadenza accanto al suo punto) è lì per questo: un'etichetta che tocca è meglio di un'etichetta sbagliata.
- **Un controllo che avvia la suite del browser mentre scrivi in un file la invalida da solo.** Lancia la suite su un albero quieto e non scrivere finché non
  finisce.
- **Mostra video, non solo immagini**, e **`main` si muove durante la sessione**: riscarica e ribasa prima di scrivere `docs/`.

## Criterio di uscita e consegna

La sessione è completa quando: la riga d'ambito di HP-03 è in §8 con le parole dell'autore; il piano esiste, risponde alle otto domande con rimandi al
codice e dichiara per ciascun passo il gate, la classe di autonomia e chi firma; ogni decisione che spetta all'autore è una domanda con la risposta in §8;
nulla del sito pubblicato è cambiato; i validatori e `tools/selftest.mjs` passano come su `main`; **il prompt della sessione successiva esiste su questo
branch, porta la stessa regola nel suo criterio di uscita, ed è approvato con il lavoro** (regola permanente di §8, 4 nov 2026). Oppure l'autore decide di
fermarsi: anche allora, **prima di chiudere, si scrive il prompt della sessione successiva** con ciò che resta.

Prima di chiudere, produci la checklist di verifica: per ciascun punto (1–8) cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se
esiste un test automatico e dove, quale criterio di uscita soddisfa. Se un punto non è completo, dichiaralo.
