<!--
Provenance: the prompt of v2 Session 21. Drafted on 4 Nov 2026, after v2 Session 20 was merged (#58), on the author's
request ("Write session 21 prompts, including the commitment to write the next session's prompt as a precondition to
closing the session's work"). Its scope was put to the author in four questions before drafting, and answered as
follows. The scope: "Assumptions first, then group (a) (Recommended)". How the commitment works: "Last item, before the
final checkpoint (Recommended)". Where it is recorded: "§8 row + prompt + AGENTS.md pointer (Recommended)". The
leftovers of Session 20 that also go to Session 21: all four offered — "Stale 'Phase 4 not open' lines",
"STATUS_PREDATES_MILESTONE dma", "'EUDigitalPolicy' in HANDOVER", "Session 18's three open findings". The commitment is
a standing rule and has its own §8 row ("A standing rule: the next session's prompt", 4 Nov 2026, `64fecbb`). The other
answers shape this prompt; they are not §8 rows. A session's scope is recorded in §8 by the session itself, as its first
write. Drawn from docs/ROADMAP-v2.md §8 (v2 Session 17.5, question 4; v2 Session 20, every row); docs/RULE-MAINTENANCE.md
(all of it, §9 in particular); docs/PHASE-3-AUDIT.md §4 and §5; docs/HANDOVER.md (the reports of Sessions 18 and 20). The
starting state was measured on `main` at 3bae4fa on 4 Nov 2026. The decisions live in those rows and nowhere else; this
file is the instruction text that cites them. Written in Italian, as the author's session prompts are. The author may
change it before use.
-->

SESSION 21 — La manutenzione delle regole con il processo scritto (voce 4.1): le tre premesse, il gruppo (a) e il prompt della sessione 22, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.
Un clone superficiale non è un albero difettoso.

Verifica che `main` contenga la sessione 20 e questo prompt:
- `docs/RULE-MAINTENANCE.md` esiste e il suo §9 elenca tre premesse da confermare;
- `docs/ROADMAP-v2.md` §8 ha la riga «The final checkpoint of v2 Session 20» e, sotto, la riga **«A standing rule: the
  next session's prompt is a precondition of closing a session's work»** (4 Nov 2026);
- `AGENTS.md`, sotto «At the end of every session», rimanda a quella riga;
- `docs/prompts/v2-session-21.md` esiste.

Se manca qualcosa, fermati e segnalalo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 21» con le parole con cui
l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande.
Senza quella riga non si scrive nulla, nemmeno in `docs/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso: `origin/scout/digest-digest-2026-11-02T16-04-07Z` (nel registro, lasciato aperto per
decisione dell'autore), e il branch di questo prompt se la sua PR non è ancora unita.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2-session-21-rules`. Non lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, in particolare «Cosa NON fare».
2. `docs/ROADMAP-v2.md` §8: la domanda 4 della sessione 17.5 (i sei gruppi; il gruppo (a) a una sessione di
   manutenzione delle regole prima del **28 gennaio 2027**), tutte le righe della sessione 20 e la regola permanente del
   4 novembre 2026.
3. `docs/RULE-MAINTENANCE.md` per intero: **è il processo che questa sessione usa**. I passi 1–6 (P-08 → P-13), il §4
   (la chiusura senza modifica e il suo limite), il §5 (la rigenerazione anche per un solo `last_verified`) e il §9 (la
   prova e le tre premesse).
4. `docs/PHASE-3-AUDIT.md` §4 (le righe F-02, F-03, F-04, F-13, F-14, F-17, F-19, F-20, F-23) e §5.
5. `docs/AI-SAFE-BOUNDARIES.md` e `docs/AUTONOMY-POLICY.md`: ogni valore nuovo o modificato in `data/*.json` è Classe C
   e si scrive solo sulla parola dell'autore; un fatto giuridico si scrive solo da una fonte letta.
6. Il `$description` e il `$note` di `data/applicability.json` e di `data/instruments.json` prima di toccarli.
7. `docs/HANDOVER.md`: i rapporti delle sessioni 20 e 18 (i tre rilievi aperti di quest'ultima).

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e attendi
conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**Quattro voci, in quest'ordine; un checkpoint dopo la 21.1, uno dopo la 21.2, uno finale.**

- **21.1 · Le tre premesse del processo.** Le tre premesse di `docs/RULE-MAINTENANCE.md` §9, poste all'autore una per
  volta e registrate in §8; poi scritte nel documento (solo `docs/`). Checkpoint 21.1: la 21.2 non comincia prima
  della sua approvazione, perché le premesse decidono come si chiude una regola.
- **21.2 · Il gruppo (a), con il processo scritto.** I nove rilievi F-02, F-03, F-04, F-13, F-14, F-17, F-19, F-20, F-23
  presi uno per uno attraverso i passi 1–6 di `docs/RULE-MAINTENANCE.md`, sulle regole che toccano; insieme a F-20, la
  rilettura dello stato del DMA che `STATUS_PREDATES_MILESTONE instruments/dma` chiede. Ogni modifica in `data/` sulla
  parola dell'autore, da un testo letto. Checkpoint 21.2.
- **21.3 · I residui delle sessioni 18–20.** Le righe che dicono ancora «Phase 4 not started/not open»; la stringa
  «EUDigitalPolicy» in `docs/HANDOVER.md`; i tre rilievi aperti della sessione 18. Ciascuno rimisurato e portato
  all'autore; nulla corretto senza la sua risposta.
- **21.4 · Il prompt della sessione 22** — **la regola permanente di §8 (4 nov 2026)**: l'ultima voce, prima del
  checkpoint finale. L'ambito della sessione 22 chiesto all'autore, le risposte nella provenienza del prompt con le
  sue parole, `docs/prompts/v2-session-22.md` scritto su questo branch, nella stessa PR. **Il checkpoint finale approva
  insieme il lavoro e il prompt; senza il prompt non si approva.**

## Lo stato di partenza

Misurato il 4 novembre 2026 su `main` a `3bae4fa`, clone completo. **Rimisura tutto.**

| Fatto | Misura del 4 novembre 2026 |
|---|---|
| Fase 4 | aperta (§8, «v2 Session 20, 20.0 question 1»); voce 4.1 scritta (`docs/RULE-MAINTENANCE.md`), provata una volta |
| Le 33 regole | tutte `last_verified` 2026-10-29; `freshness --as-of 2027-01-27` 0 `RULE_STALE`, `--as-of 2027-01-28` 33 |
| T-12 | `evidence-audit --as-of 2027-03-26`: solo `ap-cra-01` (CRA modificato dall'EHDS, applicazione 2027-03-26) |
| Le tre premesse | non decise (§8, il checkpoint finale della sessione 20) |
| Gruppo (a) | i nove rilievi «still» in `docs/PHASE-3-AUDIT.md` §4 al 3 nov 2026; regole toccate, da verificare: `ap-nis2-01`, `ap-cra-01`, `ap-nis2-02`, `ap-ai-act-02`, `ap-ai-act-06`, `ap-gdpr-04`, `ap-dsa-03`, `ap-dma-04`, e le definizioni degli attori del GDPR (F-23) |
| DMA | `evidence-audit` oggi: `STATUS_PREDATES_MILESTONE instruments/dma: status_as_of 2026-10-21, and since then 2026-11-01 designation` |
| Righe «Phase 4» superate | `docs/V2-CLOSURE.md` righe N1 e B5 («Phase 4 not started; D-4 open»); `docs/ROADMAP-v2.md` §4, il punto della Fase 4 («Phase 4 opens on the author's word once E-5 is measured») |
| «EUDigitalPolicy» | nel rapporto della sessione 19 in `docs/HANDOVER.md` (la tabella prima/dopo e il nodo WebSite citato per intero): è il valore scritto in 19.1, poi corretto da #56 |
| Rilievi della sessione 18 | (1) il titolo di eIDAS2 è ancora il generico «eIDAS2 — key provisions and key dates \| EU Digital Policy»; (2) le intestazioni degli articoli degli strumenti diversi dall'AI Act non confrontate con la GUUE; (3) `docs/v2-design/status-labels.json` conserva `x-verification` |
| Rete | Cellar fu raggiungibile in alcune sessioni e non in altre (`docs/HANDOVER.md`, sessione 18); una sonda della sessione 20 rispose HTTP 400, non indagata |

## 21.0 · Le domande all'autore

**Una ricognizione in sola lettura prima**, che rimisura la tabella sopra; poi le domande, **una per volta, con lo
strumento di domande**, la raccomandazione in prima posizione e la motivazione nella domanda; ogni risposta in §8 con le
parole dell'autore, **committata subito**.

**Per la 21.1** (una domanda per premessa, con il testo di `docs/RULE-MAINTENANCE.md` §9 citato):
1. Che cosa fa `last_verified` quando la lettura non si è potuta fare (Cellar irraggiungibile, testo illeggibile). Il
   documento oggi dice di lasciarlo dov'è: è una premessa, non una decisione.
2. Le 33 regole si rileggono in un giorno o a tappe. **Attenzione:** rileggere solo le regole del gruppo (a) le fa
   scadere in un'altra data rispetto alle altre; se l'autore decide «tutte in un giorno», la 21.2 cambierebbe misura —
   **non allargarla da solo**: riporta la conseguenza e chiedi.
3. Il testo delle interrogazioni SPARQL, oggi conservato da nessuna parte: se e dove conservarlo (in `docs/`, mai come
   strumento che interroga la rete: nessun controllo nuovo, nessun comando nuovo).
4. Lo stato del documento dopo la 21.1: le righe di `docs/RULE-MAINTENANCE.md` che cambiano, prima e dopo, parola per
   parola, approvate in una domanda.

**Per la 21.2**, per ogni rilievo (o gruppo di rilievi sulla stessa regola): il testo attuale del record, il testo
dell'articolo **letto in questa sessione** con CELEX e data, la proposta prima/dopo, e la chiusura (regola modificata,
oppure chiusa senza modifica con la nota del §4). Per F-20 e lo stato del DMA, la stessa forma. **Un rilievo la cui
fonte non si può leggere non si chiude**: si dice e si applica la decisione della premessa 1.

**Per la 21.3**, per ciascun residuo: la misura di oggi, la proposta prima/dopo, la domanda. In particolare:
- la stringa «EUDigitalPolicy» registra ciò che la 19.1 scrisse: proponi una **nota** che rimanda a #56 e alla riga di §8
  «v2 Session 19, after the checkpoint», non una riscrittura del rapporto;
- il rilievo (2) della sessione 18 è una lettura giuridica di molti articoli: **misurane prima la dimensione** (quanti
  strumenti, quante intestazioni) e chiedi se farlo qui o assegnarlo a una sessione di evidenza;
- il titolo di eIDAS2 si cambia solo in `tools/seo.mjs` e si rigenera con `tools/_footer.mjs`, mai a mano.

**Per la 21.4**, dopo il checkpoint 21.2 e la 21.3: l'ambito della sessione 22, una domanda per volta (che cosa resta
della Fase 4 dopo la 4.1 — la forma di *human attestation* per P-08 e P-11 è la voce che `docs/PHASE-4-SETUP.md` §6
nomina come seconda; ciò che la 21.2 avrà lasciato aperto; i gruppi (c), (d), (e) della domanda 4 della 17.5); poi la
bozza, mostrata all'autore prima del checkpoint finale.

Una premessa che una domanda non nomina si chiede a parte.

## 21.1 · Scrivere

- Le righe di §8; poi `docs/RULE-MAINTENANCE.md` solo come approvato. Nessun campo, controllo o comando nuovo.
- Checkpoint 21.1 in `docs/HANDOVER.md`: le risposte con i commit, il prima/dopo del documento.

## 21.2 · Leggere, proporre, scrivere

- **Segui `docs/RULE-MAINTENANCE.md` passo per passo**, e annota dove il documento ti ha guidato e dove no: è la prima
  volta che il processo scritto si usa su un caso vero. Un passo che l'uso mostra sbagliato si corregge nel documento,
  con la sua domanda all'autore, e si dice.
- **Ogni testo giuridico letto in questa sessione**, dalla GUUE recuperata da Cellar per CELEX (il metodo del passo 1),
  con gli atti modificativi e le rettifiche (passo 2). Mai da memoria, mai da un risultato di ricerca. Se Cellar non
  risponde, dillo, non chiudere il rilievo e applica la premessa 1.
- Chiudi ogni regola come dice il §4 del documento: un nuovo `last_verified` **solo** con una `verification_note` che
  nomina data, CELEX, articoli letti e metadati interrogati. Un `last_verified` senza quella nota è un avviso silenziato,
  non una chiusura.
- Dopo ogni modifica in `data/`, `node tools/_footer.mjs` e commit di ciò che scrive (anche per il solo
  `last_verified`: lo dimostra il §9 del documento). Ogni commit che cambia un file pubblicato porta una riga
  `Evidence:`; `node tools/commit-evidence.mjs <base> HEAD` prima del checkpoint.
- Un testo inglese corretto che una traduzione rende: verifica se `i18n/` lo contiene e dichiara la chiave `superseded`
  in `i18n/locales.json` dove serve; non tradurre.
- Rilancia tutto come misura e salva gli output su file: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of
  <oggi>` e `--as-of 2027-03-26`, `freshness --as-of <oggi>` e `--as-of 2027-01-28`, `seo-audit`, `tools/og-image.mjs
  --check`; le 25 suite (con `BROWSER_QA_CHROME` sul Chromium dell'ambiente), la suite browser con `--require-browser`,
  il gate avversariale, `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`; la prontezza,
  riportata e letta fino in fondo.

## 21.3 · Scrivere

- Solo come approvato, ciascun residuo con il suo commit. `tools/seo.mjs` e la rigenerazione, se l'autore lo decide,
  sono Classe C e portano `Evidence:`.

## 21.4 · Il prompt della sessione 22

- **Lo richiede la regola permanente di §8 del 4 novembre 2026**; `AGENTS.md` vi rimanda. Scritto sul modello di questo
  prompt: provenienza con le parole dell'autore, ambito, stato di partenza misurato, domande, cosa NON fare, lezioni,
  criterio di uscita — **che riporta la stessa regola per la sessione 23**.
- Il prompt non apre la sessione 22 e non scrive righe di §8 sue: la sessione 22 registra il proprio ambito come prima
  scrittura.

## Checkpoint

- **21.1:** il rapporto in `docs/HANDOVER.md`; attendi l'approvazione esplicita, registrata in §8.
- **21.2:** il rapporto: per rilievo, la regola, il testo letto (CELEX, articoli, data), il prima/dopo, la chiusura, i
  commit; dove il processo scritto era chiaro e dove no; i conteggi. Attendi l'approvazione, registrata in §8.
- **Finale (21.3 + 21.4):** il rapporto sul modello di quello della sessione 20: le decisioni con i commit; i residui;
  il prompt della sessione 22 (percorso, commit, risposte dell'autore); ciò che non è stato verificato e perché; i
  rilievi nuovi, non corretti; la checklist (21.0–21.4) e come controllare a mano. Riscarica `origin/main` subito prima
  dell'ultima scrittura di `docs/HANDOVER.md`. **Senza il prompt della sessione 22 non si chiede l'approvazione.**
  Attendi l'approvazione, poi chiedi se aprire una pull request verso `main` e registra la sorte del branch. **Non
  pushare sul branch dopo aver aperto la PR.**

## Cosa NON fare in questa sessione

- Non automatizzare alcun passo; non aggiungere un campo, una forma di attestazione, un controllo o un comando. La forma
  di *human attestation* per P-08/P-11 è una voce successiva.
- Non scrivere un fatto giuridico che non hai letto in questa sessione da una fonte recuperata; non chiudere un rilievo
  con un sostituto plausibile; non cambiare un `claim_type`; non togliere un asterisco, un `reference_gap`, un
  `requires_verification` o una `verification_note` senza la parola dell'autore.
- Non aggiornare `last_verified` in blocco, né su una regola che non hai letto; non toccare le regole fuori dal gruppo
  (a) e da F-20 senza una risposta dell'autore (premessa 2).
- Non toccare i gruppi (b)–(f) della domanda 4 della 17.5 oltre ciò che la 21.3 nomina; non riaprire D-5; non scegliere
  un CMS; non toccare `ALLOWED_RUNTIME_ORIGINS`, la concessione di autonomia (scade il 9 marzo 2027: segnalalo, non
  rinnovarla), i dispatcher, la prontezza.
- Non scrivere l'ambito della Fase 5.
- Non abbassare gate, validator, test o limiti di pubblicazione; non toccare la licenza né il testo di non affiliazione o
  di assenza di consulenza legale; non scrivere nel README; non modificare un file sotto `instruments/` a mano.
- Non riscrivere la storia di `main`, né forzare un push; non riscrivere un rapporto passato di `docs/HANDOVER.md` (si
  annota).
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–20 (da `docs/HANDOVER.md`; non ripeterle)

- **Ciò che si dice all'autore va misurato e citato esattamente.** Conta prima di scrivere «l'unico», «tutti»,
  «nessuno» (sessione 18, V2C-29).
- **Non dichiarare una correzione che non hai fatto** (sessione 20: una prima stesura del resoconto diceva di aver
  corretto un passo di una bozza che non era mai stata sbagliata; è stato rettificato prima del commit). Il resoconto
  dice ciò che è successo.
- **Un `last_verified` da solo silenzia entrambi gli avvisi e rende obsoleti `sitemap.xml` e la pagina generata dello
  strumento** (misurato nella sessione 20, `docs/RULE-MAINTENANCE.md` §9): ogni chiusura ha la sua nota e la sua
  rigenerazione.
- **Un controllo può fissare ciò che cambi** (N1, S2, `seo-audit.mjs:334`, S4b nella sessione 19): cercalo prima di
  scrivere.
- **Una premessa può essere inesatta**: rimisurala e dillo nella domanda.
- **Un difetto che il lavoro espone si porta all'autore**: né corretto in silenzio, né lasciato in silenzio.
- **Un clone superficiale non è un albero difettoso**: controlla `--is-shallow-repository` prima delle suite.
- **Leggi questo prompt prima di chiedere qualunque cosa** (sessione 19).
- **Branch e merge.** Non pushare su un branch dopo aver aperto la sua PR; `main` può muoversi durante la sessione:
  riscarica prima dell'ultima scrittura.
- **Riavvii del worker.** Registra ogni risposta in §8 e committa subito; salva gli output su file; ferma un server per
  PID. (Nella sessione 20 il worker si è riavviato due volte: nessuna risposta è andata persa perché ciascuna era già
  committata.)
- **Nessun output di agenti in `agent/records/`.**

## Criterio di uscita e consegna

La sessione è completa quando: le tre premesse sono decise in §8 e scritte nel documento; ciascuno dei nove rilievi del
gruppo (a) e F-20 con lo stato del DMA è chiuso sulla parola dell'autore — regola modificata, chiusa senza modifica con
la sua nota, oppure lasciata aperta con la ragione (fonte illeggibile) —, con il testo letto citato; i residui della
21.3 sono decisi; **il prompt della sessione 22 esiste su questo branch, porta la stessa regola nel suo criterio di
uscita, ed è approvato con il lavoro**; i tre checkpoint sono approvati. Oppure l'autore decide di fermarsi: anche
allora, **prima di chiudere, si scrive il prompt della sessione successiva** con ciò che resta, come la regola di §8
richiede.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (21.0–21.4) indica:
- cosa è stato scritto (file, righe di §8, commit);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
