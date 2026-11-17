<!--
Provenance: the prompt of the Track R session that follows V2C-17…19, drafted on 17 Nov 2026 in the V2C-17…19 session, on
`claude/cool-goodall-dr0emd`, on the author's request ("Affrontiamo anche F-18") and answer ("Next session's prompt (Recommended)").
Drawn from docs/PHASE-3-AUDIT.md (F-18), docs/ROADMAP-v2.md §8 (4 Nov 2026, 23.2 and 24.2 R-4), docs/PHASE-5-SETUP.md (§5.2, §10)
and `ap-dma-01` as it stands. **Nothing was read from Regulation (EU) 2022/1925, the brief's Part 4 or any claim for this prompt**:
that is the session's to do. It records no §8 row of its own and does not open the session: the session records its scope in §8 as
its first write. Written in Italian, as the author's session prompts are. The author may change it before use.
-->

SESSIONE F-18 — Traccia R, sessione di evidenza (gruppo (d)): «immediately» contro l'Art. 3(10) del DMA, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`). Verifica che `main` contenga la PR di V2C-17…19, `docs/V2C-17-19-READING.md` e questo prompt; altrimenti
fermati e chiedi all'autore. **Rimisura la data. La Traccia M ha la precedenza** (`docs/SESSION-ARCHITECTURE.md` §1): il 24 dicembre
2026 è la tappa di `eidas2`; dal 12 gennaio 2027 la finestra della sessione 25 è aperta; **le 33 regole scadono insieme il 28 gennaio
2027 e `ap-dma-01` va riletta entro il 3 febbraio 2027** (`docs/PHASE-3-AUDIT.md`, `docs/ROADMAP-v2.md` §8, 24.2 R-4): dillo
all'autore prima di ogni altra cosa. La concessione di autonomia scade il 9 marzo 2027 (si segnala, non si rinnova).

**Come prima scrittura**, registra in §8 la riga «The scope of the F-18 session» con le parole dell'autore; se mancano, chiedile con lo
strumento di domande. Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`.
Lavora sul branch assegnato. Non lavorare su `main`.

Leggi: `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §2; `docs/PHASE-3-AUDIT.md` (F-18, F-27);
`docs/ROADMAP-v2.md` §8 (4 nov 2026: 23.2 `ap-dma-01` e F-18; 24.2 R-4); `docs/RULE-MAINTENANCE.md` (i passi 1–6 della forma di
attestazione); `docs/EVIDENCE-MODEL.md`; `docs/SOURCE-POLICY.md`; `docs/DATA-GOVERNANCE.md`.

## Lo stato di partenza (17 novembre 2026; **rimisura tutto**)

**F-18**, come registrato: l'Art. 3(10) del DMA dà sei mesi («The gatekeeper shall comply with the obligations laid down in Articles 5,
6 and 7 within 6 months after a core platform service has been listed in the designation decision», citato dalla nota di verifica di
`ap-dma-01` del 4 nov 2026); la `rationale` di `ap-dma-01`, il claim `clm-dma-ex-ante` e il paragrafo `part-4.p2` del brief (con le
sovrapposizioni it/fr/es) dicono «immediately» (la `rationale`: «the Article 5 prohibitions apply immediately and self-executingly»);
IP/25/1085 chiama marzo 2024 il momento in cui «the DMA obligations became legally binding» (contesto, non cita articoli). La regola è
chiusa «unchanged, F-18 open» (`9ae3376`, `e77d274`). **Tutto questo è da rileggere nei testi, non da riprendere da qui.**

## Obiettivo

- **W.1 · La lettura, per CELEX da Cellar (`Accept-Language: eng`, SHA-256 per documento), senza nulla da memoria.** Regolamento (UE)
  2022/1925 (`32022R1925`): l'Art. 3(10) e ciò che dice del momento da cui gli Artt. 5, 6 e 7 vincolano; gli Artt. 5, 6, 7 e 13 per
  ogni formula che ne fissi il momento; l'Art. 3(9)–(10) sulla decisione di designazione; i corrigenda (solo 32022R1925R(02) ha un
  testo inglese, secondo la lettura del 4 nov: **verifica**) e ogni atto modificativo (la lettura del 4 nov non ne trova: **verifica**).
  Poi i tre posti del sito: `ap-dma-01` (`rationale`, `depends_on`, `dates`), `clm-dma-ex-ante` e `part-4.p2` con le sovrapposizioni
  it/fr/es; più ogni altro punto in cui il sito dice «immediately» (o l'equivalente) a proposito del DMA (`grep` su `data/`, `i18n/`,
  `js/`, le pagine generate). Che cosa dice ciascuno, contro che cosa, e se **è** un errore o una formula che il testo regge.
- **W.2 · La proposta, all'autore**: una tabella per voce (testo letto; cosa dice oggi il sito; cosa il testo permette di dire);
  **una domanda per decisione, raccomandazione per prima, ogni risposta in §8 con le sue parole, committata subito.** Decisioni
  attese: se la `rationale` di `ap-dma-01` cambia (e in che parole, citando l'Articolo); se `clm-dma-ex-ante` cambia testo, tipo o
  fonti; se `part-4.p2` e le tre sovrapposizioni cambiano (la traduzione è un file `i18n/`: l'autore decide chi le scrive e come si
  segna una sovrapposizione che non è stata riletta); se `dates` di `ap-dma-01` deve mostrare il termine dei sei mesi (un evento di
  `data/timeline.json` non si inventa: si legge o non si scrive).
- **W.3 · La scrittura**, solo dopo le risposte. Ogni modifica a un dato con la sua riga `Evidence:` nel commit; una regola toccata
  segue i passi di `docs/RULE-MAINTENANCE.md` (attestazione, `last_verified`, A-1…A-8 a 0 errori e 0 avvertimenti) e **la sua riga di
  §8 dice che il lavoro è la sua attestazione**; `node tools/_footer.mjs` se un dato pubblicato cambia; **dopo ogni modifica di `data/`
  le 25 suite, non solo i validatori** (`tools/selftest.mjs` fissa liste e conteggi: se un test fissa ciò che cambia, la sua modifica
  ha una riga di §8 prima).
- **W.4 · Il prompt della sessione successiva**, scelto dall'autore tra le righe di Traccia R che §8 non mostra già eseguite
  (le sessioni di etichette di stato V2C-14, V2C-20, D-3; F-27 e V2C-66; V2C-11; F-29; la sessione 25 se la finestra è vicina; i
  punti aperti sotto). **Il checkpoint finale approva insieme il lavoro e il prompt; senza il prompt non si approva.**

**Punti aperti, portati qui da V2C-17…19, da trattare solo se l'autore lo decide:** (1) `gdpr.legal_basis` è `["tfeu:art-114"]` ma il
visa cita solo l'Art. 16; (2) l'Allegato II di COM(2026) 502 senza record di fonte; (3) letture rimaste parziali (V2C-12: nessuna
rettifica cercata, Capo VIII del Data Act, tre archi analitici senza claim, `rel-dsa-copyright-dsm-defers`); (4) l'Art. 3 punto 8 di
COM(2025) 837 modifica l'Art. 33 del GDPR e `rel-data-omnibus-gdpr` e `clm-omnibus-four-gdpr-reforms` non lo nominano; (5) la
discrepanza tra memorandum e Art. 10(2) sul P2B (`docs/V2C-03-05-READING.md` §5); (6) **da V2C-17…19**: i sette atti dell'Art. 2(3)
del Regolamento sulla pubblicità politica senza arco (`docs/V2C-17-19-READING.md` §4, F5); la nota sorgente `src-eurlex-dna-proposal`
che cita «proposes to amend» per sei atti di cui il testo ne abroga tre; l'Art. 199(1) del DNA che rinvia al Comitato delle
comunicazioni «istituito dalla Direttiva (UE) 2018/1972», che l'Art. 209 abroga; le cinque nuove istanze (`eecc`,
`berec-regulation`, `rspp-decision`, `open-internet-regulation`, `radio-spectrum-decision`) lette solo per titolo, Art. 1 e Articolo di
entrata in vigore.

**Regola d'arresto**: ciò che non si legge nel testo non si scrive e si dichiara; nessuna formula si sostituisce con una «plausibile»;
se il testo regge «immediately» in un senso preciso, lo si dice e non si cambia nulla per far quadrare F-18. **Un controllo che trova
qualcosa di rosso si nomina e si decide.**

## Scrivere e verificare

`docs/` sempre; `data/`, `i18n/`, `tools/` ciascuno dopo la sua riga di §8. Prima del checkpoint: `validate`, `i18n-audit`,
`design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`, `node --test tools/selftest.mjs`,
`node tools/commit-evidence.mjs <base> HEAD`, le 25 suite e `.control-room/`, la suite del browser (in background: supera i 120 s).
Non scrivere nell'albero mentre la batteria gira. **Confronta l'output intero con la base** (salvato prima di scrivere). Se il
conteggio `unverified` cambia, §12 di `docs/CURRENT-ARCHITECTURE.md` e tutte le suite (due lo fissano: `agent/health` e
`agent/implement` R6).

## Cosa NON fare

Non toccare `eidas2`, `ap-eidas2-01`, né alcuna regola di `data/applicability.json` **tranne `ap-dma-01` e solo dopo la decisione
dell'autore in §8**; né stato, date, `timeline`, `last_verified` di un record non riletto. Non cambiare gli archi della mappa. Non
rinominare un ID. Non autorizzare da memoria un Articolo, una data, un CELEX, un termine. Non abbassare gate, validator, test o
limiti. Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale,
`ALLOWED_RUNTIME_ORIGINS`, né rinnovare la concessione. Non toccare licenza, non affiliazione, assenza di consulenza legale, README.
Non riscrivere la storia di `main` né forzare un push. Vale «Cosa NON fare» del brief.

## Lezioni (da `docs/HANDOVER.md`)

La data è un fatto da misurare · una lettura contro il testo può smentire il dato (V2C-12, V2C-03…05, V2C-17…19: il prompt diceva
«repeal or amend» per cinque atti, il testo ne abroga tre e ne modifica tre) · **un controllo che trova rosso va nominato**
(V2C-17…19: M-07 ha fermato cinque istanze «in force» la cui base era solo il metadato, finché non si è letto l'Articolo di entrata in
vigore) · una modifica ai dati può rompere un test fuori dallo scrivibile (V2C-13; V2C-03…05; V2C-17…19: quattro test di
`tools/selftest.mjs`) · un controllo che non può fallire non è un controllo · il numero di `unverified` è fissato in due suite ·
`origin/main` si muove · ogni risposta in §8 si committa subito.

## Criterio di uscita e consegna

Completa quando: la lettura (W.1) è fatta e annotata nei file di `docs/`; le decisioni di W.2 sono in §8 con le parole dell'autore;
ogni voce è risolta per decisione (scritta, o lasciata e dichiarata); nessuna regola, claim, stato o data è cambiato senza una riga di
§8; validatori, `selftest`, 25 suite, `.control-room/` e browser passano e ogni avvertimento nuovo è spiegato; i punti aperti sono
nominati; **il prompt della sessione successiva esiste sul branch, porta la stessa regola nel suo criterio di uscita ed è approvato
con il lavoro**. Oppure l'autore decide di fermarsi: anche allora si scrive il prompt della successiva. Prima di chiudere, la
checklist W.1–W.4: cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
