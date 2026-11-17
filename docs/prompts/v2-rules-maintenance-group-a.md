<!--
Provenance: the prompt of the Track R session that follows F-18, drafted on 17 Nov 2026 in the F-18 session, on
`claude/cool-goodall-dr0emd`, on the author's answer "Rules maintenance before 28 Jan 2027 (Recommended)" (docs/ROADMAP-v2.md §8,
"F-18, W.4"), under the standing rule of §8 (4 Nov 2026). Drawn from docs/PHASE-3-AUDIT.md (§4, F-02, F-03, F-04, F-13, F-14, F-17,
F-19, F-20, F-23), docs/ROADMAP-v2.md §8 (3 Nov 2026, 17.5.0 question 4, group (a)), docs/RULE-MAINTENANCE.md and
docs/ATTESTATION-FORM.md. **Nothing was read from any Regulation, Directive or rule for this prompt**: that is the session's to do.
It records no §8 row of its own and does not open the session: the session records its scope in §8 as its first write. Written in
Italian, as the author's session prompts are. The author may change it before use.
-->

SESSIONE MANUTENZIONE DELLE REGOLE, gruppo (a) — Traccia R: le formulazioni di nove rilievi, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`). Verifica che `main` contenga le PR di V2C-17…19 e di F-18, `docs/V2C-17-19-READING.md`,
`docs/F-18-READING.md` e questo prompt; altrimenti fermati e chiedi all'autore (F-18 è stata eseguita sul branch di V2C-17…19: le
due serie di commit possono arrivare in `main` insieme). **Rimisura la data. La Traccia M ha la precedenza**
(`docs/SESSION-ARCHITECTURE.md` §1): il 24 dicembre 2026 è la tappa di `eidas2`; dal 12 gennaio 2027 la finestra della sessione 25
è aperta; **misurato il 17 novembre 2026 con `freshness.mjs`: 32 regole scadono il 3 febbraio 2027 e `ap-dma-01` (riletta il 17 novembre) il 16 febbraio 2027; rimisura con `node tools/freshness.mjs --as-of <data>`** e dillo
all'autore prima di ogni altra cosa. La concessione di autonomia scade il 9 marzo 2027 (si segnala, non si rinnova).

**Come prima scrittura**, registra in §8 la riga «The scope of the rules-maintenance session (group (a))» con le parole
dell'autore; se mancano, chiedile con lo strumento di domande. Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né
tuo né nel registro di `docs/HANDOVER.md`. Lavora sul branch assegnato. Non lavorare su `main`.

Leggi: `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §2; `docs/PHASE-3-AUDIT.md` §4 (i nove rilievi);
`docs/RULE-MAINTENANCE.md` (i passi 1–6); `docs/ATTESTATION-FORM.md`; `docs/F-18-READING.md` (il metodo e la sua conclusione);
`docs/EVIDENCE-MODEL.md`; `docs/SOURCE-POLICY.md`.

## Lo stato di partenza (17 novembre 2026; **rimisura tutto**)

I nove rilievi del gruppo (a), come registrati da `docs/PHASE-3-AUDIT.md` (**tutto da rileggere nei testi, non da riprendere da qui**):
**F-02** `ap-nis2-01`, `depends_on`: «materially incomplete» contro «While most complied» del comunicato; **F-03** `ap-cra-01`,
`rationale`: «serious incidents» contro «severe incident» dell'Art. 14(3); **F-04** `ap-nis2-02`, `rationale`: un settore «which NIS2
treats as essential» contro l'Allegato I, «sectors of high criticality»; **F-13** `ap-ai-act-02`: l'Art. 111(3) (modelli GPAI
immessi prima del 2 agosto 2025: fino al 2 agosto 2027) non è tenuto da nessun evento, e la `rationale` dice «owes Article 53 since
2 August 2025»; **F-14** `ap-ai-act-06`, l'eccezione termina con l'argomento del brief («The brief argues …»), le stesse parole su
`rel-ai-act-teu-4-2` e `teu:art-4-2`; **F-17** `ap-gdpr-04`, la nota dice che le disposizioni dell'AI Act «belong to Session 16»;
**F-19** `ap-dsa-03`, `rationale`: la trasparenza dei parametri dei sistemi di raccomandazione, che l'Art. 19 toglie alle micro e
piccole piattaforme; **F-20** `ap-dma-04`: le decisioni di designazione cloud «due in November 2026», un obiettivo della
Commissione, non un termine (e `STATUS_PREDATES_MILESTONE instruments/dma` è un avvertimento dal 1° novembre 2026); **F-23** le
definizioni degli attori passano per l'Art. 4 del GDPR; `ap-gdpr-04` e il ruolo di titolare. **Alcuni possono essersi chiusi nel
frattempo o toccarsi con F-18: verifica ciascuno sul testo e sul dato prima di proporre.**

## Obiettivo

- **W.1 · La lettura, per CELEX da Cellar (`Accept-Language: eng`, SHA-256 per documento), senza nulla da memoria.** Per ogni
  rilievo: la regola, il testo del dato oggi, l'Articolo (o la fonte) che lo smentisce o lo regge, citati alla lettera; i
  corrigenda e gli atti modificativi di ogni testo letto (SPARQL, come in `docs/RULE-MAINTENANCE.md` §2); **ciò che non si legge non
  si scrive e si dichiara** (un testo che Cellar non serve in XHTML può servirsi in HTML: prova prima di dichiararlo mancante).
- **W.2 · La proposta, all'autore**: una tabella per rilievo (cosa dice il testo, cosa dice il sito, cosa il testo permette di dire);
  **una domanda per decisione, raccomandazione per prima, ogni risposta in §8 con le sue parole, committata subito.** Per ogni regola
  da rileggere: se il lavoro è la sua attestazione (`docs/RULE-MAINTENANCE.md`, passi 1–6), e **con quali fonti in `attestation.read`**
  (F-18 ha dichiarato solo ciò che ha letto quel giorno e ha accettato due avvertimenti A-8 nominati: decisioni 7 e 8 di F-18).
- **W.3 · La scrittura**, solo dopo le risposte. Ogni commit che tocca un file pubblicato porta la riga `Evidence:`; una regola
  toccata passa A-1…A-8; `node tools/_footer.mjs` se un dato pubblicato cambia; **dopo ogni modifica di `data/` o di `i18n/` le 25
  suite, non solo i validatori**; un riferimento registrato in `docs/CURRENT-ARCHITECTURE.md` §12 (avvertimenti, `unverified`) si
  muove solo con una riga di §8 e con le suite che lo fissano; **una stringa della brief che cambia ritira le traduzioni it/fr/es
  come `superseded`** (`i18n/locales.json`, e la chiave tolta dal file del locale; F-18, decisione 4), non le riscrive.
- **W.4 · Il prompt della sessione successiva**, scelto dall'autore tra le righe di Traccia R che §8 non mostra già eseguite
  (le etichette di stato V2C-14, V2C-20, D-3; F-27 e V2C-66; V2C-11; F-29; la sessione 25 se la finestra è vicina; i punti aperti
  sotto). **Il checkpoint finale approva insieme il lavoro e il prompt; senza il prompt non si approva.**

**Punti aperti, portati qui da F-18 e dalle sessioni precedenti, da trattare solo se l'autore lo decide:** (1) `gdpr.legal_basis` è
`["tfeu:art-114"]` ma il visa cita solo l'Art. 16; (2) l'Allegato II di COM(2026) 502 senza record di fonte; (3) letture rimaste
parziali (V2C-12; V2C-17…19: i cinque nuovi atti letti solo per titolo, Art. 1 e Articolo di entrata in vigore); (4) l'Art. 3
punto 8 di COM(2025) 837 modifica l'Art. 33 del GDPR e `rel-data-omnibus-gdpr` e `clm-omnibus-four-gdpr-reforms` non lo nominano;
(5) la discrepanza tra memorandum e Art. 10(2) sul P2B; (6) i sette atti dell'Art. 2(3) del Regolamento sulla pubblicità politica
senza arco; la nota di `src-eurlex-dna-proposal` («proposes to amend» per sei atti, il testo ne abroga tre); l'Art. 199(1) del DNA
che rinvia a un comitato istituito dalla Direttiva abrogata dall'Art. 209; (7) **da F-18**: le traduzioni it/fr/es di `part-4.p2` e
`part-4.p4` (it) sono ritirate e attendono una traduzione rivista; la «self-executing» di `ap-dma-01`/`part-4.p4` (Art. 5 contro Art.
8) non è stata verificata; `tl-dma-2024-03-07-compliance` poggia su due fonti della Commissione non rilette; le due fonti non tier-1
di `ap-dma-01` (Review Report, IP/25/1085) non sono state rilette il 17 novembre; il testo dei corrigenda `R(01)`, `R(02)`, `R(03)`
del DMA non è stato recuperato.

**Regola d'arresto**: ciò che non si legge nel testo non si scrive e si dichiara; nessuna formulazione si sostituisce con una
«plausibile»; se il testo regge la formula del sito, lo si dice e non si cambia nulla per chiudere il rilievo. **Un controllo che
trova qualcosa di rosso si nomina e si decide.**

## Scrivere e verificare

`docs/` sempre; `data/`, `i18n/`, `tools/` ciascuno dopo la sua riga di §8. Prima del checkpoint: `validate`, `i18n-audit`,
`design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`, `node --test tools/selftest.mjs`,
`node tools/commit-evidence.mjs <base> HEAD`, `node agent/implement/cli.mjs check --as-of <oggi>`, le 25 suite e `.control-room/`, la
suite del browser (in background: supera i 120 s). Non scrivere nell'albero mentre la batteria gira. **Confronta l'output intero con
la base** (salvato prima di scrivere). Se il conteggio `unverified` o degli avvertimenti di `validate` cambia, §12 di
`docs/CURRENT-ARCHITECTURE.md` e tutte le suite.

## Cosa NON fare

Non toccare `eidas2`, `ap-eidas2-01`, né alcuna regola di `data/applicability.json` che non sia nominata da un rilievo di questo
prompt **e decisa dall'autore in §8**; né stato, date, `timeline`, `last_verified` di un record non riletto. Non cambiare gli archi
della mappa. Non rinominare un ID. Non autorizzare da memoria un Articolo, una data, un CELEX, un termine. Non scrivere una
traduzione senza che l'autore lo decida (una traduzione non rivista non è rivista). Non abbassare gate, validator, test o limiti. Non
toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale, `ALLOWED_RUNTIME_ORIGINS`, né
rinnovare la concessione. Non toccare licenza, non affiliazione, assenza di consulenza legale, README. Non riscrivere la storia di
`main` né forzare un push. Vale «Cosa NON fare» del brief.

## Lezioni (da `docs/HANDOVER.md`)

La data è un fatto da misurare · una lettura contro il testo può smentire il dato (V2C-17…19: «repeal or amend» per cinque atti, il
testo ne abroga tre e ne modifica tre; F-18: «immediately», il testo dà sei mesi) · **una chiave senza risposta HTTP in un formato
non è un testo mancante** (V2C-17…19, F-18: 404 sull'XHTML, HTML disponibile) · **un controllo che trova rosso va nominato**
(V2C-17…19: M-07; F-18: A-4 e A-8) · una modifica ai dati può rompere un test fuori dallo scrivibile (V2C-13; V2C-03…05; V2C-17…19;
F-18: sette test di `tools/selftest.mjs` e un test di `agent/implement`, che fissa il riferimento di §12) · **un riferimento
registrato si muove con una riga di §8** · un controllo che non può fallire non è un controllo · `origin/main` si muove · ogni
risposta in §8 si committa subito.

## Criterio di uscita e consegna

Completa quando: la lettura (W.1) è fatta e annotata nei file di `docs/`; le decisioni di W.2 sono in §8 con le parole
dell'autore; ogni rilievo è risolto per decisione (scritto, o lasciato e dichiarato); nessuna regola, claim, stato o data è cambiato
senza una riga di §8; validatori, `selftest`, 25 suite, `.control-room/` e browser passano e ogni avvertimento nuovo è spiegato; i
punti aperti sono nominati; **il prompt della sessione successiva esiste sul branch, porta la stessa regola nel suo criterio di
uscita ed è approvato con il lavoro**. Oppure l'autore decide di fermarsi: anche allora si scrive il prompt della successiva. Prima
di chiudere, la checklist W.1–W.4: cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
