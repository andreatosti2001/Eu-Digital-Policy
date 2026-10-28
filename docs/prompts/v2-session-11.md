<!--
Provenance: the prompt of v2 Session 11, drafted at the end of v2 Session 10 (28 Oct 2026) on the
author's request ("Write session 11"), from the author's roadmap after v2 Session 5
(docs/prompts/v2-session-6.md: "11 (se necessaria) — Gate finale di chiusura v2", §5 and the
"Conteggio realistico") and from docs/ROADMAP-v2.md as it stands after the §8 row "The checkpoint of
v2 Session 10 = items 10.1 and 10.2". The decisions live in those rows and nowhere else; this file is
the instruction text that cites them. Written in Italian, as the author's session prompts are. The
author may change it before use.
-->

SESSION 11 — Gate finale di chiusura della v2: confronto con la roadmap, classificazione dei finding aperti, decisione dell'autore, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Verifica tre cose:
- che `main` contenga la pull request #33 (sessione 10: voci 10.1 e 10.2), cioè almeno `8cdeec5`;
- che `docs/ROADMAP-v2.md` §8 abbia la riga «The checkpoint of v2 Session 10 = items 10.1 and 10.2»;
- che `docs/prompts/v2-session-6.md` (la roadmap dell'autore) e `docs/prompts/v2-session-10.md` siano in
  `main`.

Se una delle tre manca in `main`, fermati e segnalalo.

La roadmap dell'autore è un piano, non un'autorizzazione (§8, «The scope of v2 Session 6»), e la sua
sessione 11 è marcata «se necessaria». **Come prima scrittura della sessione**, registra in §8 la riga
«The scope of v2 Session 11» con le parole con cui l'autore avvia questa sessione; se il prompt arriva
senza parole dell'autore, chiediglielo con lo strumento di domande. Senza quella riga non si scrive
nulla, nemmeno in `docs/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso, se nel frattempo non è cambiato nulla:
- `origin/scout/digest-digest-2026-10-26T13-10-32Z` e `origin/claude/v2-session-8-findings` (già nel
  registro);
- `origin/claude/v2-session-11-prompt`, che porta questo prompt e la sua riga di registro. Se non è in
  `main`, proponi all'autore di unirlo nel branch di sessione, come nella sessione 9 con `c756f0f`.

Crea un branch di sessione (`claude/v2-session-11-closing-gate` o quello assegnato dall'ambiente). Non
lavorare su `main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, contratto tra sessioni: i cinque principi, «Cosa NON fare», «Decisioni già prese»
   e la sequenza Fase 0 → Fase 5.
2. `docs/prompts/v2-session-6.md`: §1, la riga «11 (se necessaria)» della tabella di §6 e il
   «Conteggio realistico», §3, §4 (Evidence Navigator) e §5 per intero, in particolare: «Prima di
   dichiarare v2 "conclusa", confrontare la definizione di completamento con docs/ROADMAP-v2.md, incluse
   le fasi successive e le rispettive condizioni d'ingresso. Non segnare fasi non eseguite come
   complete».
3. `docs/ROADMAP-v2.md` per intero: §1 (i principi come condizioni), §3 (D-1…D-10), §4 (ogni voce e il
   suo criterio d'uscita, comprese le Fasi 3, 4 e 5), §6, §7 e **tutte** le righe di §8.
4. `docs/HANDOVER.md`: i rapporti delle sessioni v2 1–10, in particolare ogni «Found, for the author —
   not changed», «Still open» e la checklist di verifica della sessione 10.
5. `docs/AUDIT-2026-10-24.md` §1.5 e §5; `docs/V2-DATA-DESIGN.md` §5 e §7; `README.md`, «Known
   limitations»; `docs/AI-SAFE-BOUNDARIES.md` §0–§3; `docs/PRODUCTION-OPERATING-MODE.md` (la lista di
   prontezza che rifiuta).

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e
attendi conferma. Non reinterpretare in silenzio.

## Obiettivo della sessione

**Solo il gate di chiusura**, poi checkpoint. È una sessione di misura e di decisione, non di
implementazione: **non si modifica nulla di pubblicato** (`data/`, `js/`, `css/`, `style.css`, le pagine,
`i18n/`, `img/`) e nessun controllo. Si scrive soltanto in `docs/`.

La sessione produce tre cose e le porta all'autore:
1. **il confronto** tra ciò che la v2 doveva fare (brief e roadmap) e ciò che il repository fa oggi,
   misurato, non ricopiato dai rapporti;
2. **l'inventario dei finding aperti**, ciascuno con una classe proposta;
3. **la domanda sul perimetro della v2**, che è dell'autore e di nessun altro.

Non dichiarare la v2 «conclusa», «chiusa» o «completata» in nessun documento finché la riga dell'autore
non è in §8. Un controllo verde non chiude una fase che non è stata eseguita.

## Lo stato di partenza

Misurato il 28 ottobre 2026 su `main` dopo la #33. **Rimisura tutto**: sono valori da ricontrollare,
non da copiare.

**Cosa la roadmap ha eseguito, secondo §8** (da verificare commit per commit):
- Fase 0 (0.1–0.4) e Fase 1 (1.1–1.5): sessione 3; l'audit P0/P1 dichiarato chiuso in
  `docs/AUDIT-2026-10-24.md` §1.5;
- Fase 2: 2.0 (sessione 2), 2.1 (sessione 4), 2.2–2.6 (sessioni 5–9); la Fase 2 dichiarata chiusa
  nella riga del checkpoint della sessione 9;
- la manutenzione delle sessioni 10 (scrollbar; riferimenti interni), fuori dalla numerazione delle
  fasi.

**Cosa la roadmap non ha eseguito:**
- Fase 3 («what applies», base): condizione d'ingresso misurata il 25 ottobre come non soddisfatta
  (33 regole, nessuna con `supports` e locator, nessuna letta da `evidence-audit.mjs`). Contiene R-01 e
  gli otto finding di `docs/V2-DATA-DESIGN.md` §7 (§8, «corrected in Phase 3»);
- Fase 4 (automazione): D-4 (i nomi dei tre livelli) e D-5 (CMS git-based con OAuth) ancora aperte;
- Fase 5: non pianificata per definizione («its scope is written only after Phase 3's checkpoint»);
- il capitolo finanza (MiCA, PSD3/PSR, DGA in transizione): non aperto.

**La baseline di chiusura della sessione 10:**
- `validate` 0/0 con 45 non verificati; `i18n-audit`, `design-qa`, `seo-audit` 0/0;
- `evidence-audit --as-of 2026-10-28`: 0 errori, 11 warning, REGISTER «covered 16 · mapped 12 ·
  watched 5 · excluded 6»;
- `freshness --as-of 2026-10-28`: 0 difetti, 3 richieste (il calendario: alla data di questa sessione
  possono essere di più, ed è un dato da riportare, non un difetto da correggere);
- 25 suite: 1314 pass + 1 saltato (`::1`); browser 343 · 0 · 1 indecidibile (`a11y:bound`); gate
  avversariale 65 · 0 · 3 · 1;
- `node agent/production/cli.mjs readiness`: **rifiuta** (da rimisurare: quante condizioni passano e
  quali bloccano);
- 17 pagine strumento e 26 route indicizzabili; 39 strumenti, 40 relazioni, 225 fonti, 181 claim,
  101 eventi, 312 termini.

## 11.1 · Il confronto, misurato

Scrivi `docs/V2-CLOSURE.md` (nome proposto; l'autore può cambiarlo). Una tabella per ciascuno dei
blocchi qui sotto; per ogni riga: **stato** (eseguito · non eseguito · non iniziato · decisione aperta ·
superato), **evidenza** (commit, riga di §8, test o controllo che lo tiene), e **verifica di oggi** (il
test o il comando rilanciato in questa sessione, con l'esito).
- I cinque principi del brief, nella forma verificabile di `docs/ROADMAP-v2.md` §1.
- Ogni voce di «Cosa NON fare» del brief: rispettata o no, con la prova.
- Ogni «Decisione già presa» del brief, e D-1…D-10 di §3.
- Ogni voce di §4, da 0.1 a 2.6, **con il suo criterio d'uscita rilanciato oggi**, non ricopiato dal
  rapporto della sessione che l'ha chiusa. Se il criterio nomina un'asserzione, cita il test e il suo
  esito di oggi; se non c'è un test, dillo.
- Le Fasi 3, 4 e 5, con la loro condizione d'ingresso misurata oggi (per la Fase 3: quante delle 33
  regole hanno `supports` e locator, quante condizioni si risolvono a un ID di provvedimento, se
  `evidence-audit.mjs` legge `applicability.json`).

**Una riga che oggi fallisce non si corregge in questa sessione**: si riporta, con il comando che lo
mostra, e diventa un finding.

## 11.2 · L'inventario dei finding aperti

Raccogli ogni finding ancora aperto da `docs/HANDOVER.md` (sessioni v2 1–10), da
`docs/AUDIT-2026-10-24.md` §5, da `docs/V2-DATA-DESIGN.md` §7, dalla roadmap dell'autore §3 e dal
confronto di 11.1. Per ciascuno: un identificativo stabile nel documento, l'origine (sessione e
sezione), cosa dice in una riga, **se tocca ciò che il sito dice di diritto a un lettore** o solo la
presentazione, gli strumenti interni o l'ambiente, e se è stato già chiuso (con il commit che lo
chiude: un finding chiuso non si riporta come aperto).

Atteso almeno (da ricontrollare uno per uno):
- sessione 10: gli avanzi fuori regola nelle note dei claim (un ID di provvedimento, ID di strumento
  nudi); i riferimenti «(audit, …)» senza codice; il blocco morto `.tool-top`/`.bib-top`; la barra
  sottile della `.spine` che restringe la colonna; nessuno stato hover sulle scrollbar; Firefox,
  Safari, dispositivi touch, screen reader e colori forzati non verificati;
- sessione 9: il tipo d'arco al presente per una proposta; la modalità derivata dal nodo `from` e i
  quattro archi `enables` candidati; gli atti che la DNA abrogherebbe o modificherebbe non modellati;
  «member State» nelle descrizioni generate; il `.”.` delle fonti senza data; la data di verifica che va
  a capo; nessun tipo di evento per una tappa procedurale;
- sessione 8: il colore del link «Read it at the source» in tema scuro; il `<title>` della pagina EHDS;
  la `status_note` di `data-omnibus` da riverificare sull'esito del Coreper del 21 ottobre 2026;
  `nis2 → eidas` non modellato;
- ancora aperti: `src-ec-ai-omnibus-in-force` (403); il test `::1`, mai eseguito in questo ambiente; le
  8 relazioni v1 e il flip `edge-v1-sources`; R-01 e gli otto rilievi del design §7; i finding della
  sessione 5 elencati nella roadmap dell'autore, §3;
- la prontezza di produzione che rifiuta, con le condizioni che bloccano.

Proponi per ciascuno **una** di queste classi; la classe è una proposta, la decisione è dell'autore:
- **A · blocca la chiusura**: il sito afferma qualcosa di falso, o un criterio d'uscita della v2 fallisce
  oggi. Non si corregge in questa sessione: si chiede all'autore se aprirne una;
- **B · assegnato**: a una fase o sessione successiva nominata (Fase 3, Fase 4, post-v2 A–E, una
  sessione di manutenzione), con la ragione;
- **C · da verificare fuori da questo ambiente**: richiede rete, un runner IPv6, un altro browser o un
  dispositivo; nominare dove e come;
- **D · limitazione dichiarata**: proposta per «Known limitations» del README. Il testo del README è
  dell'autore (`docs/AI-SAFE-BOUNDARIES.md` §3): si propone la formulazione, non si scrive;
- **E · chiuso o superato**: con il commit o la riga di §8 che lo prova.

Un finding che tocca ciò che il sito dice di diritto non va in D senza dirlo nella domanda.

## 11.0 · Domande da porre all'autore

Prima fai 11.1 e 11.2 e mettili in `docs/V2-CLOSURE.md` (scrittura in `docs/`, permessa dalla riga di
scope). Poi porta all'autore, **una domanda per volta tramite lo strumento di domande**, con la
raccomandazione in prima posizione e la motivazione nella domanda stessa. Non meno di queste:

1. **Il perimetro della v2.** Le opzioni, ciascuna con ciò che comporta per la Fase 3, la Fase 4, la
   Fase 5, il capitolo finanza e la sequenza del brief («Fase 0 → … → Fase 5», che è una decisione già
   presa e vincolante: la sessione la segnala come tale, non la rilegge). Almeno:
   - la v2 si chiude sulle Fasi 0–2 e la manutenzione della sessione 10, e le Fasi 3–5 restano
     pianificate come capitolo successivo con le loro condizioni d'ingresso invariate;
   - la v2 resta aperta e la sessione successiva apre la Fase 3, cominciando dall'estensione del
     controllo che la roadmap prescrive;
   - un'altra delimitazione proposta dall'autore.
   La raccomandazione si fonda sul confronto di 11.1, non su questo prompt. Se la chiusura richiede di
   rivedere una decisione del brief, la domanda lo dice con le parole del brief.
2. **La classificazione dei finding**, gruppo per gruppo (per classe proposta, o per sessione d'origine
   se più leggibile), con l'elenco completo nella domanda o nel documento che la domanda cita.
3. **I finding di classe A**, se ce ne sono: per ciascuno, se aprire una sessione dedicata prima della
   chiusura, o riclassificarlo con la ragione dell'autore.
4. **Le proposte di classe D**: per ciascuna, la formulazione esatta proposta per il README. La
   decisione e il testo sono dell'autore; questa sessione non scrive nel README.
5. **D-4 e D-5**: restano aperte e legate alla Fase 4, o l'autore le decide ora.
6. **Il post-v2.** Se e quando si apre (la roadmap dell'autore: sessione 12 = post-v2 A+B). È una
   decisione separata dal perimetro: aprirlo non lo avvia in questa sessione.
7. **I documenti che dicono lo stato della v2** (l'intestazione di `docs/ROADMAP-v2.md`, la riga di
   `AGENTS.md` sulla roadmap, il «Last updated» di `docs/HANDOVER.md`): se e come aggiornarli dopo la
   decisione, con il prima e il dopo esatti.

Registra ogni risposta in §8 con le parole dell'autore. Ciò che non è approvato non entra.

## 11.3 · Scrivere e verificare

- Si scrive soltanto in `docs/`: `docs/V2-CLOSURE.md`, le righe di §8, il rapporto in
  `docs/HANDOVER.md`, e i documenti di stato della domanda 7, solo con il testo approvato.
- **Nessun file pubblicato cambia**, quindi nessun commit ha bisogno di una riga `Evidence:`;
  `tools/commit-evidence.mjs origin/main HEAD` deve comunque dare 0 commit senza evidenza.
- Rilancia tutto come misura, prima e dopo, e confronta con la baseline della sessione 10:
  `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`,
  `seo-audit`; le 25 suite (con `BROWSER_QA_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`,
  o il percorso dell'ambiente) e la suite browser con `--require-browser`; il gate avversariale,
  `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`,
  `tools/og-image.mjs --check`, `agent/production/cli.mjs readiness`. Salva gli output su file.
- Un numero che si muove senza che nulla di pubblicato sia cambiato (per esempio le richieste di
  `freshness` con la data) si spiega, non si «sistema».
- Leggi il `git diff` completo prima di ogni commit.

## 11.4 · Checkpoint — la sessione si ferma qui

- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 10. Contiene:
  - le decisioni dell'autore e cosa è stato scritto (commit);
  - il riassunto del confronto (il dettaglio resta in `docs/V2-CLOSURE.md`);
  - l'inventario dei finding con la classe **decisa**, e quanti per classe;
  - i conteggi prima/dopo, con il motivo di ogni movimento;
  - ciò che non è stato verificato e perché;
  - la checklist di verifica (11.0–11.4) e come controllare a mano.
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore; si registra in §8. Poi chiedi se aprire una pull request
  verso `main` e registra la sorte del branch nel registro di `docs/HANDOVER.md`. **Non pushare sul
  branch dopo aver chiesto il merge.**

## Lezioni delle sessioni 8–10 (da `docs/HANDOVER.md`; non ripeterle)

- **I testi che il lettore vede si approvano parola per parola prima di scriverli.** Qui nessun testo
  pubblicato cambia; vale per il README e per i documenti di stato.
- **Un difetto che il lavoro espone si porta all'autore, non si corregge in silenzio, e non si lascia
  in silenzio.**
- **Ciò che si dice all'autore va misurato prima.** Nella sessione 10 due affermazioni fatte nelle
  domande (dove si stampano le note delle fonti; i numeri delle note a piè di pagina) si sono rivelate
  imprecise e sono state corrette nel rapporto: misura prima di affermare, e correggi apertamente.
- **La suite browser e i self-test trovano ciò che la lettura non trova.** Rilanciali prima di
  dichiarare un esito.
- **Branch e merge.** Non pushare su un branch dopo aver chiesto il merge della sua PR. Una PR impilata
  su un'altra va unita dopo, con «Create a merge commit».
- **Riavvii del worker.** I job in background muoiono quando il worker si riavvia, e con loro il server
  locale: salva gli output su file, ricontrollali e riavvia il server se serve. Non usare `pkill -f` con
  una stringa che compare nella tua stessa riga di comando. Committa e pusha spesso.
- **Le lezioni della sessione 7 valgono ancora**: nessun output di agenti in `agent/records/`; si
  diffano solo i record toccati.

## Cosa NON fare in questa sessione

- Non dichiarare la v2 conclusa senza la riga dell'autore in §8, e non segnare come completa una fase
  non eseguita (la roadmap dell'autore, §5).
- Non avviare la Fase 3, la Fase 4, il capitolo finanza, il post-v2 né la sessione 12, anche se
  l'autore decide di aprirli: aprirli è una decisione, avviarli è un'altra sessione.
- Non correggere alcun finding, nemmeno uno piccolo o di sola presentazione: si classifica e si chiede.
- Non modificare `data/`, `js/`, `css/`, `style.css`, le pagine, `i18n/`, `img/`, `tools/`, `agent/` né
  `.control-room/`.
- Non scrivere nel README, e non ammorbidire una limitazione dichiarata.
- Non implementare né preparare l'Evidence Navigator (roadmap dell'autore, §4).
- Non dichiarare «sicurezza operativa dimostrata». Non trasformare uno skip in un pass: il test `::1`
  non eseguito resta non eseguito.
- Non abbassare gate, validator, test, CSP, CSRF, Origin, OIDC o limiti di pubblicazione.
- Non toccare la licenza né il testo di non affiliazione o di assenza di consulenza legale.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Criterio di uscita e consegna

La sessione è completa in uno di due casi: il confronto e l'inventario sono scritti, l'autore ha deciso
il perimetro della v2 e la classe di ogni finding, e il checkpoint è approvato; oppure l'autore decide
di fermarsi.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (11.0–11.4) indica:
- cosa è stato scritto (file, righe di §8);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
