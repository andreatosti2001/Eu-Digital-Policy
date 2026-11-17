<!--
Provenance: the prompt of the Track R session that follows V2C-03…05, drafted on 16 Nov 2026 in the V2C-03…05 session, on
`claude/friendly-pasteur-mtqo8h`, on the author's answer "V2C-17–19 (Recommended)" (docs/ROADMAP-v2.md §8, "V2C-03…05, W.4"), under the
standing rule of §8 (4 Nov 2026). Drawn from docs/V2-CLOSURE.md (V2C-17, V2C-18, V2C-19), docs/V2C-03-05-READING.md and the records as
measured on 16 Nov 2026. **Nothing was read from the DNA's title, NIS 2, the Political Advertising Regulation, the AVMSD or the P2B
Regulation for this prompt**: that is the session's to do. It records no §8 row of its own and does not open the session: the session
records its scope in §8 as its first write. Written in Italian, as the author's session prompts are. The author may change it before use.
-->

SESSIONE V2C-17…19 — Traccia R, la mappa: i nodi che mancano e tre archi non letti, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`). Verifica che `main` contenga la PR di V2C-03…05, `docs/V2C-03-05-READING.md` e questo prompt; altrimenti fermati
e chiedi all'autore. **Rimisura la data. La Traccia M ha la precedenza** (`docs/SESSION-ARCHITECTURE.md` §1): dal 12 gennaio 2027 la
finestra della sessione 25 è aperta e va detto all'autore prima di ogni altra cosa; il 24 dicembre 2026 è la tappa di `eidas2`; la
concessione di autonomia scade il 9 marzo 2027 (si segnala, non si rinnova).

**Come prima scrittura**, registra in §8 la riga «The scope of the V2C-17…19 session» con le parole dell'autore; se mancano, chiedile con lo
strumento di domande. Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`.
Lavora sul branch assegnato. Non lavorare su `main`.

Leggi: `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §2; `docs/V2-CLOSURE.md` (V2C-17, V2C-18, V2C-19);
`docs/V2C-03-05-READING.md` (§2 le nove disposizioni; §5); `docs/V2C-13-MAP-CHECKS.md`; `tools/map-audit.mjs` e `tools/selftest.mjs` (MP1…MP9).

## Lo stato di partenza (16 novembre 2026; **rimisura tutto**)

Dopo V2C-03…05: 44 archi (10 analitici, 34 testuali); M-15 è un ERROR e gli array `amends`, `repeals`, `amended_by`, `proposes_to_amend` non
esistono più in nessun record; `data-omnibus` ha dieci archi uscenti. **Un arco ha due estremi che sono istanze**: V2C-17 nasce da questo.

## Obiettivo

- **W.1 · La lettura, per CELEX da Cellar (`Accept-Language: eng`, SHA-256 per documento), senza nulla da memoria.**
  - **V2C-17:** cosa fa la proposta del DNA (`digital-networks-act`, CELEX 52026PC0016) alla Direttiva (UE) 2018/1972, al Regolamento (UE)
    2018/1971, alla Decisione n. 243/2012/UE, al Regolamento (UE) 2015/2120 e alla Decisione n. 676/2002/CE, e in quale articolo. Sono nomi dal
    titolo della proposta registrati in V2C-CLOSURE: **verificali nel testo**.
  - **V2C-18:** l'articolo di NIS 2 (32022L2555) che modifica il Regolamento (UE) n. 910/2014 (`nis2` → `eidas`), **se esiste**: la fonte indicata
    in V2C-CLOSURE sono i metadati, non il testo.
  - **V2C-19:** gli Artt. 2(3)(f) e (h) del Regolamento sulla pubblicità politica (`ttpa`, 32024R0900), che nominano l'AVMSD (`avmsd`) e il P2B
    (`p2b`), e se sono rinvii (`defers-to`).
- **W.2 · La proposta, all'autore**: una tabella per voce; **una domanda per decisione, raccomandazione per prima, ogni risposta in §8 con le
  sue parole, committata subito.** Per V2C-17: se i cinque atti diventano istanze (e con quale criterio di inclusione, `docs/V2-DATA-DESIGN.md`
  §5; senza una domanda non si aggiungono termini di tassonomia né istanze) o restano nominati senza nodo.
- **W.3 · La scrittura**, solo dopo le risposte. Ogni modifica a un controllo con il suo test che può fallire; MP1…MP9 solo stringibili;
  `node tools/_footer.mjs` se un dato cambia; ogni commit che tocca un file pubblicato porta la riga `Evidence:`; dopo ogni modifica di `data/`
  le 25 suite, non solo i validatori.
- **W.4 · Il prompt della sessione successiva**, scelto dall'autore tra le righe di Traccia R che §8 non mostra già eseguite (F-18 prima di ogni
  modifica di `ap-dma-01`; la sessione 25 se la finestra è vicina; i punti aperti sotto). **Il checkpoint finale approva insieme il lavoro e il
  prompt; senza il prompt non si approva.**

**Punti aperti, portati qui da V2C-03…05, da trattare solo se l'autore lo decide:** (1) `gdpr.legal_basis` è `["tfeu:art-114"]` ma il visa cita
solo l'Art. 16 (non esiste `tfeu:art-16`); (2) l'Allegato II di COM(2026) 502 senza record di fonte proprio; (3) letture rimaste parziali
(nessuna rettifica cercata; Capo VIII del Data Act; i tre archi analitici senza claim e `rel-dsa-copyright-dsm-defers`); (4) **l'Art. 3 punto 8
di COM(2025) 837 modifica l'Art. 33 del GDPR e `rel-data-omnibus-gdpr` e `clm-omnibus-four-gdpr-reforms` non lo nominano** (§8, 16 nov 2026,
decisione 7: nominato, non toccato); (5) la nota di `docs/V2C-03-05-READING.md` §5 sulla discrepanza tra memorandum e Art. 10(2) sul P2B.

**Regola d'arresto**: ciò che non si legge nel testo non si scrive e si dichiara; nessun arco si aggiunge per far passare un controllo e nessun
arco letto si toglie per lo stesso motivo. **Un controllo che trova qualcosa di rosso si nomina e si decide.**

## Scrivere e verificare

`docs/` sempre; `data/`, `tools/` ciascuno dopo la sua riga di §8. Prima del checkpoint: `validate`, `i18n-audit`, `design-qa`,
`evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`, `node --test tools/selftest.mjs`,
`node tools/commit-evidence.mjs <base> HEAD`, le 25 suite e `.control-room/`, la suite del browser (in background: supera i 120 s). Non
scrivere nell'albero mentre la batteria gira. **Confronta l'output intero con la base.** Se il conteggio `unverified` cambia, §12 di
`docs/CURRENT-ARCHITECTURE.md` e tutte le suite (due lo fissano: `agent/health` e `agent/implement` R6).

## Cosa NON fare

Non toccare `eidas2`, `ap-eidas2-01` né alcuna regola di `data/applicability.json`; né stato, date, `timeline`, `last_verified` di un record
non riletto. Non pubblicare la vista della mappa. Non cambiare `basis` di un termine di `relationship_kind`, né il testo, il tipo o le fonti di
un rapporto non riletto. Non rinominare un ID. Non autorizzare da memoria un Articolo, una data, un CELEX. Non abbassare gate, validator,
test o limiti. Non svuotare le liste congelate di `tools/map-audit.mjs` senza che l'arco sia risolto. Non toccare il dispatcher di produzione,
il registro delle decisioni, la prontezza, il gate avversariale, `ALLOWED_RUNTIME_ORIGINS`, né rinnovare la concessione. Non toccare licenza,
non affiliazione, assenza di consulenza legale, README. Non riscrivere la storia di `main` né forzare un push. Vale «Cosa NON fare» del brief.

## Lezioni (da `docs/HANDOVER.md`)

La data è un fatto da misurare · **una lettura contro il testo può smentire il dato** (V2C-12: due archi su otto; V2C-03…05: il titolo di
COM(2025) 837 nomina sette atti modificati e gli articoli ne modificano nove) · **una misura può smentire la parola della decisione**
(V2C-03…05: gli array erano su 39 istanze, non su 11) · una modifica ai dati può rompere un test fuori dallo scrivibile (V2C-13; V2C-03…05:
V1 fissa la lista degli archi «proposed») · il numero di `unverified` è fissato in due suite · un controllo che non può fallire non è un
controllo · `origin/main` si muove · ogni risposta in §8 si committa subito.

## Criterio di uscita e consegna

Completa quando: le tre letture (W.1) sono fatte e annotate; le decisioni di W.2 sono in §8 con le parole dell'autore; ogni voce è risolta
per decisione (scritta, o lasciata e dichiarata); nessun rapporto, regola, stato o data è cambiato senza una riga di §8; validatori,
`selftest`, 25 suite, `.control-room/` e browser passano e ogni avvertimento nuovo è spiegato; i punti aperti sono nominati; **il prompt della
sessione successiva esiste sul branch, porta la stessa regola nel suo criterio di uscita ed è approvato con il lavoro**. Oppure l'autore decide
di fermarsi: anche allora si scrive il prompt della successiva. Prima di chiudere, la checklist W.1–W.4: cosa è stato scritto (file, righe di §8,
commit), come verificarlo a mano, se esiste un test e dove.
