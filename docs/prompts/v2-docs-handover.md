<!--
Provenance: written on 26 Nov 2026 in documentation session D4 (`docs/ROADMAP-v2.md` §8, «The scope of the documentation session D4»), on
`claude/vibrant-hypatia-7b2y7w`, from `main` `064488c` (#141 merged), as D4's item D4.4 (`docs/prompts/v2-docs-agents-entry.md`) and under the
standing rule of 4 Nov 2026 (the next session's prompt). It carries the author's decision on the current state (§8, «D1, D.3 question 3») and
D4's rows of 26 Nov 2026. Every figure below was measured by D4 on its branch; **rimisura tutto**. Nothing was read from any legal text for
this prompt. Written in Italian, like D1's, D2's, D3's and D4's. Approved, or not, with D4's work at its final checkpoint.
-->

SESSIONE D5 (programma di semplificazione della documentazione) — `docs/HANDOVER.md` ridotto: le voci chiuse in `docs/archive/`, byte per byte

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`: `tools/docs-check.mjs` verifica i commit citati sulla linea first-parent di `main`). Esegui
`git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`.

**Controlla che D4 sia approvata e su `main`**: la riga di §8 «Final checkpoint of the documentation session D4» e il merge del suo branch
(`claude/vibrant-hypatia-7b2y7w`). Se il branch non è su `main`, chiedi all'autore se fonderlo prima o partire dal branch: il brief, «Non
implementare nulla prima che la sessione precedente sia stata approvata».

Lavora sul branch assegnato dall'ambiente. **Come prima scrittura**, registra in §8 la riga «The scope of the documentation session D5» con
le parole con cui l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo. Senza quella riga non si scrive
nulla.

Leggi, e trattali come vincolanti: `docs/DOCS-SIMPLIFICATION-PLAN.md` (§1: si spostano solo i record chiusi; §2, la riga D5: che cosa fa e
che cosa non fa; §4, le regole di ogni sessione; §5 punto 12: **i rilievi sostanziali ancora aperti restano visibili in `docs/HANDOVER.md`
finché non sono chiusi**); `docs/ROADMAP-v2.md` §8, **la riga «D1, D.3 question 3»** (nessuno stato generato: lo stato resta in §8, in
`main` e nei comandi, e l'intestazione di `docs/HANDOVER.md` dice dove), la riga «Rebalancing the sessions» del 22 nov 2026 (il precedente:
`docs/archive/HANDOVER-to-2026-11-13.md`, `43fb9bb`) e le righe di D4 del 26 novembre 2026; `docs/DOCUMENTATION-ARCHITECTURE.md` §1
(`historical`: spostato fuori dall'insieme di lavoro byte per byte), §3 (quando un record è chiuso) e §5 (l'archivio non porta
l'intestazione); `docs/README.md` §1 (le righe di `docs/HANDOVER.md` e dell'archivio) e §2 (il livello «always» legge l'intestazione di
`docs/HANDOVER.md`); `.agents/skills/project-context/SKILL.md` (il passo 1: «everything above its first `## ` entry»);
`agent/proposals/governance/patterns.mjs` (le ancore); **`tools/docs-check.mjs`** (CAT, TOTAL, ANCHOR, SKILL) e
`tools/docs-check-selftest.mjs`; `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §3.

## Il punto di partenza (misurato da D4 il 26 novembre 2026; **rimisura tutto**)

- **`docs/HANDOVER.md`**: 609 righe, 102.675 byte, prima della voce che D4 aggiunge al suo checkpoint finale. **L'intestazione** sono le
  righe 1–26 (titolo, riga d'intestazione standard, «Last updated», «Branch», «Read first»): è ciò che il livello «always» della skill legge,
  e resta sopra la prima `## `. **30 voci `## `**, dal 13 al 26 novembre 2026: 26 di sessione, 4 «Branch register» (13 nov ×3, 14 nov).
- **L'archivio**: `docs/archive/HANDOVER-to-2026-11-13.md`, 10.604 righe, 818.017 byte, `historical`, senza intestazione, spostato il 22 nov
  2026 «unchanged» con una nota iniziale che dice da quali righe viene. È il precedente; **non è un file da riaprire**: aggiungervi testo
  cambierebbe un record storico. Un secondo file d'archivio è un documento nuovo: riga di catalogo e totali nello stesso commit (CAT, TOTAL).
- **Le ancore**: 0 in `docs/HANDOVER.md`; 5 in `docs/archive/HANDOVER-to-2026-11-13.md` (`patterns.mjs`). Un'ancora il cui testo lascia
  `docs/HANDOVER.md` cambia `path` nello stesso commit, **mai il testo** (ANCHOR è un errore di `docs-check` dal D3).
- **Chi legge il testo**: nessun codice legge `docs/HANDOVER.md` (solo commenti e messaggi lo nominano). **Ma tre messaggi stampati da
  codice mandano a una sezione che non c'è più**: `agent/implement/cli.mjs:72` e `:264`, `agent/health/control.mjs:48` dicono
  «docs/HANDOVER.md, "Exact next objective"», un'intestazione che dal 22 nov 2026 è solo nell'archivio (righe 9398 e 10261). È un rilievo:
  correggerlo cambia il testo di un messaggio di `agent/`, e lo decide l'autore.
- **Che cosa è chiuso**: una voce è chiusa quando la sua sessione ha in §8 la riga che la chiude (`docs/DOCUMENTATION-ARCHITECTURE.md` §3,
  la regola dei record). **Da misurare voce per voce**, con la riga che la chiude; una voce che porta un rilievo ancora aperto non si sposta
  senza che il rilievo resti visibile (il piano §5 punto 12).
- **`tools/docs-check.mjs`** è in CI: 0 errori; 4 avvertimenti (`agent/schemas/types.mjs:673`, `tools/commit-evidence.mjs:140`, due prompt),
  lasciati all'autore; 64 percorsi di fixture contati; 31 test nel selftest. Un avvertimento nuovo è un rilievo.
- **Da D4, per l'autore e non per D5** (`docs/AGENTS-ENTRY-MOVES.md` §3a): `repositoryCaveats()` in `.control-room/views.mjs` non ha
  chiamanti dalla sessione 21; H03 e H14, spostati alla lettera in `docs/DEPLOYMENT.md`, non concordano sul deploy gate;
  `docs/AI-SAFE-BOUNDARIES.md` §4 porta quattro avvertenze che hanno un'altra casa; l'ancora «\_\_CONTENT\_\_» ha un `what` che nomina il
  punto d'ingresso. **Della mappa di D4 non resta nulla da fare**: le 40 unità sono spostate.

## La decisione dell'autore (§8, 26 nov 2026; non si richiede)

- **D.3, domanda 3 — nessuno stato generato** («None; HANDOVER header (Recommended)»): lo stato resta in §8, in `main` e nei comandi;
  l'intestazione di `docs/HANDOVER.md` dice dove; **D5 accorcia soltanto `docs/HANDOVER.md`** e non scrive alcun file di stato.

## Obiettivo

- **D5.1 · La mappa delle voci, misurata prima.** Per ognuna delle 30 voci (e di quella che D4 aggiunge): le righe, la sessione, **la riga
  di §8 che la chiude** (o nessuna: allora resta), i rilievi aperti che porta e dove restano visibili, le ancore che tocca. Per i quattro
  «Branch register»: che cosa resta del registro corrente. **Checkpoint**: la mappa all'autore, e le sue parole in §8 (una riga per ciò che
  decide) **prima** di spostare. Chiedi anche, con la mappa: il nome del nuovo file d'archivio (un secondo file per il periodo
  13–26 nov 2026, come il precedente, oppure altro), e che cosa diventano i tre messaggi di `agent/` che puntano a «Exact next objective».
- **D5.2 · Lo spostamento.** Le voci chiuse in `docs/archive/`, **byte per byte**, con una nota iniziale che dice da quali righe vengono e
  su quale riga di §8, come quella del 22 nov 2026; `docs/HANDOVER.md` tiene l'intestazione e le voci aperte, e il «Read first» dice dove è
  l'archivio. Il `path` di ogni ancora che si sposta cambia nello stesso commit. La riga di catalogo del file nuovo e i totali di
  `docs/README.md` §4 nello stesso commit. Dopo ogni commit `node tools/docs-check.mjs` a 0 errori e
  `node agent/proposals/governance/cli.mjs check` a exit 0.
- **D5.3 · Il prompt di D6** (lo spostamento dei record chiusi, il solo programmato da §1 del piano; chiude entro il 10 gennaio 2027), sul
  branch. Il checkpoint finale approva insieme il lavoro e il prompt.

**Regola d'arresto**: se la sessione si allunga, D5.2 si ferma a un commit coerente (0 errori) e ciò che resta della mappa è nominato nel
prompt di D6; D5.1 e D5.3 non cadono.

## Scrivere e verificare

Dopo ogni commit che tocca `docs/HANDOVER.md`, l'archivio o il catalogo: `node tools/docs-check.mjs`, `node --test tools/docs-check-selftest.mjs`,
`node agent/proposals/governance/cli.mjs check`. Lo spostamento si verifica **per confronto di byte**: il testo di ogni voce spostata nel file
d'archivio è identico alle sue righe in `docs/HANDOVER.md` alla base (uno script fuori dal repository, il cui risultato si dice). **Non
lanciare il self-test del browser mentre scrivi file.** Prima di ogni checkpoint la batteria del piano §4, più `node tools/docs-check.mjs` e
il suo selftest. L'output dei validatori resta quello della base; una frase che lo scanner delle credenziali legge come una coppia
chiave-valore si riformula (`node agent/implement/cli.mjs boundary`: 0 bloccanti, 24 avvertimenti); la baseline non si alza.

## Cosa NON fare

- Non scrivere uno stato generato né un file di stato a mano (§8, «D1, D.3 question 3»).
- Non spostare una voce che §8 non chiude, e non spostare un rilievo aperto fuori dalla vista di `docs/HANDOVER.md`.
- Non modificare il testo di una voce che si sposta, né quello dell'archivio esistente; non riaprire
  `docs/archive/HANDOVER-to-2026-11-13.md`.
- Non togliere né accorciare l'intestazione di `docs/HANDOVER.md` sopra la prima `## `: è il livello «always» della skill.
- Non modificare il testo di un'ancora, un pin o un test per farlo passare: si aggiorna il `path` dell'ancora nello stesso commit, e si dice.
- Non spostare, rinominare, fondere o cancellare un altro documento (solo D6 sposta, e solo i record chiusi).
- Non toccare `AGENTS.md`, la skill, `CLAUDE.md` né `docs/AI-SAFE-BOUNDARIES.md` senza una riga di §8 con le parole dell'autore, scritta prima.
- Non toccare `data/`, `i18n/`, `index.html` né le pagine pubblicate; non registrare una revisione di traduzione; non toccare il testo di
  `docs/BRIEF-v2.md`.
- Non aggiungere una dipendenza.

Vale «Cosa NON fare» del brief.

## Criterio di uscita e consegna

Completa quando:
- la mappa delle voci è approvata dall'autore in §8, e ogni voce spostata è in `docs/archive/` byte per byte, con la sua nota;
- `docs/HANDOVER.md` tiene l'intestazione, le voci aperte e il registro dei branch corrente, e dice dove è l'archivio; ogni rilievo aperto
  resta visibile;
- `tools/docs-check.mjs` a 0 errori, il controllo di governance a exit 0, validatori, `selftest`, le suite e `.control-room/` passano, e ogni
  avvertimento nuovo è spiegato;
- **il prompt della sessione successiva (D6) esiste sul branch, porta questa stessa regola nel suo criterio di uscita ed è approvato con il
  lavoro; senza il prompt non si approva.**

Oppure l'autore decide di fermarsi: anche allora si scrive il prompt della successiva.

**Il calendario.** D6 chiude entro il 10 gennaio 2027 (§8, 25 nov 2026); se una sessione del programma è in corso il 10 gennaio, si ferma a un
checkpoint e il programma riprende dopo il giro delle regole di febbraio 2027.

**La Traccia M ha la precedenza alle sue tappe.** Rimisura la data prima di iniziare: `evidence-audit --as-of <oggi>` stampa
`STATUS_PREDATES_MILESTONE` dopo le tappe di `ai-act` (2 dic 2026), `pld` (9 dic) ed `eidas2` (24 dic) — misurato da D4 il 26 nov 2026: 0
righe; gli stati sono della sessione 25, 25.2 (`docs/prompts/v2-session-25.md`). **Se una tappa è passata, dillo all'autore prima di
iniziare**: decide lui se la sessione 25.2 viene prima.

Prima di chiudere, la checklist D5.1–D5.3: cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
