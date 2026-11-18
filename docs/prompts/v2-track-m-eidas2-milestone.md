<!--
Provenance: the prompt of the Track M session that follows the rules-maintenance session, group (b), drafted on 18 Nov 2026 in that session, on
`claude/amazing-mccarthy-doan3m`, on the author's answer "Track M: eidas2, 24 Dec milestone (Recommended)" (docs/ROADMAP-v2.md §8, "Rules
maintenance (b), W.4"), under the standing rule of §8 (4 Nov 2026). Drawn from docs/RULES-MAINTENANCE-B-READING.md (§1 and §5: 31 of 32 rules
re-attested on 18 Nov 2026; `ap-eidas2-01` left to Track M by the author's decision of the same day), docs/RULE-MAINTENANCE.md and
docs/ATTESTATION-FORM.md. **Nothing was read from any Regulation, Directive or rule for this prompt**: that is the session's to do. It records no
§8 row of its own and does not open the session: the session records its scope in §8 as its first write. Written in Italian, as the author's
session prompts are. The author may change it before use.
-->

SESSIONE TRACCIA M — la tappa di `eidas2` del 24 dicembre 2026 e la riattestazione di `ap-eidas2-01`, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`). Verifica che `main` contenga il lavoro del gruppo (b) (`docs/RULES-MAINTENANCE-B-READING.md`, le righe di §8 del
18 novembre 2026, il commit dei dati che riattesta 31 regole) e questo prompt; altrimenti fermati e chiedi all'autore. **Rimisura la data**: la
tappa di `eidas2` è il 24 dicembre 2026; dal 12 gennaio 2027 la finestra della sessione 25 è aperta; `ap-eidas2-01` ha `last_verified`
2026-11-04 e **scade il 3 febbraio 2027** (misurato il 18 novembre 2026: è l'unica regola che `node tools/freshness.mjs --as-of 2027-02-03` nomina).
Rimisura con `node tools/freshness.mjs --as-of <data>` e `node tools/evidence-audit.mjs --as-of <data>` e dillo all'autore prima di ogni altra cosa.
La concessione di autonomia scade il 9 marzo 2027 (si segnala, non si rinnova).

**Come prima scrittura**, registra in §8 la riga «The scope of the Track M session (eidas2 milestone)» con le parole dell'autore; se mancano,
chiedile con lo strumento di domande. Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di
`docs/HANDOVER.md`. Lavora sul branch assegnato. Non lavorare su `main`.

Leggi: `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §2; `docs/SESSION-ARCHITECTURE.md` §1 (la Traccia M); `docs/RULE-MAINTENANCE.md`;
`docs/ATTESTATION-FORM.md` (§4 e §5, punto 1: perché `ap-eidas2-01` è per la maggior parte fuori da A-4, con cinque avvertimenti A-8);
`docs/RULES-MAINTENANCE-B-READING.md` (il metodo, gli hash, la query SPARQL rieseguita); `docs/V2C-21-READING.md` e il prompt `v2-v2c-21b-eidas2-provisions.md`.

## Lo stato di partenza (18 novembre 2026; **rimisura tutto**)

- `eidas2` ha `last_verified` 2026-10-27 e il suo evento `tl-eidas2-2026-12-24-compliance-deadline` è `review-due` (`freshness`, critical); la
  riga di §8 del 14 novembre 2026 (V2C-21, V.2) dice che la lettura del 13 novembre non ha coperto status, `status_as_of` né tappe, che sono della
  sessione 25 (25.2): la decisione dell'autore su dove stia questo lavoro va **riconfermata prima di toccare l'istrumento**.
- `ap-eidas2-01` è l'ultima regola a 2026-11-04: il suo `attestation` ha cinque avvertimenti A-8 (due «Citation (…)» di atti di esecuzione, tre
  disposizioni del Regolamento (UE) n. 910/2014 registrate sotto la fonte dell'atto modificativo). La riattestazione non può «chiuderli»: li
  nomina.
- `ap-dma-01` è a 2026-11-17 (scade il 16 febbraio 2027) e le altre 30 regole a 2026-11-18 (scadono il 17 febbraio 2027), salvo nuova lettura.
- Residui del gruppo (b), da trattare solo se l'autore lo decide: i corrigenda senza espressione inglese (53, tra cui PLD R(02) e R(03)) non letti;
  le frasi valutative lasciate e nominate (`ap-nis2-01`, `ap-gdpr-04`, `ap-ai-act-04`, `-05`, `ap-data-act-01`); il residuo 2 ago 2027 (nessun evento)
  e i punti aperti del gruppo (a).

## Obiettivo

- **M.1 · La lettura, per CELEX da Cellar (`Accept-Language: eng`, SHA-256 per documento), senza nulla da memoria.** Gli atti di `eidas2`
  (Regolamento (UE) 2024/1183 e gli atti di esecuzione che `ap-eidas2-01` cita), il Regolamento (UE) n. 910/2014; SPARQL rieseguito per atti
  modificativi e corrigenda; ciò che non si legge non si scrive e si dichiara (una chiave senza risposta in un formato non è un testo mancante:
  prova XHTML e HTML).
- **M.2 · La proposta, all'autore**, una domanda per decisione, raccomandazione per prima, ogni risposta in §8 con le sue parole e committata subito:
  se il testo regge `ap-eidas2-01` (riattestazione senza cambiare parole), se la tappa del 24 dicembre 2026 e lo status di `eidas2` vanno riletti
  qui o alla sessione 25.
- **M.3 · La scrittura**, solo dopo le risposte. Ogni commit che tocca un file pubblicato porta la riga `Evidence:`; una regola toccata passa
  A-1…A-8; `node tools/_footer.mjs` se un dato pubblicato cambia; dopo ogni modifica di `data/` le 25 suite e `node --test tools/selftest.mjs`
  (le date di lettura sono in `READ_V2_23`; si aggiornano **solo sulla parola dell'autore**); una stringa della brief che cambia ritira le
  traduzioni it/fr/es come `superseded`, non le riscrive.
- **M.4 · Il prompt della sessione successiva**, scelto dall'autore tra le righe di Traccia R/M che §8 non mostra già eseguite (la sessione 25
  se la finestra è vicina; le etichette di stato V2C-14, V2C-20, D-3; F-27 e V2C-66; V2C-11; F-29; i residui sopra). **Il checkpoint finale
  approva insieme il lavoro e il prompt; senza il prompt non si approva.**

**Regola d'arresto**: ciò che non si legge nel testo non si scrive e si dichiara; nessuna formulazione si sostituisce con una «plausibile»; una
riattestazione non cambia una parola per chiudere una scadenza; se il testo non regge una regola, **si nomina e si decide**. **Un controllo che
trova qualcosa di rosso si nomina e si decide.**

## Scrivere e verificare

`docs/` sempre; `data/`, `i18n/`, `tools/` ciascuno dopo la sua riga di §8. Prima del checkpoint: `validate`, `i18n-audit`, `design-qa`,
`evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`, `node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs
<base> HEAD`, `node agent/implement/cli.mjs check --as-of <oggi>`, le 25 suite e `.control-room/`, la suite del browser (in background, oltre
120 s; **non scrivere nell'albero mentre gira**). Confronta l'output intero con la base salvata prima di scrivere. Misura che, dopo la sessione,
`freshness --as-of 2027-02-03` non nomini più `ap-eidas2-01` se è stata riattestata.

## Cosa NON fare

Non toccare una regola o un istrumento che l'autore non abbia nominato in §8; né stato, date, `timeline`, `last_verified` di un record non
riletto. Non cambiare gli archi della mappa. Non rinominare un ID. Non autorizzare da memoria un Articolo, una data, un CELEX, un termine. Non
scrivere una traduzione senza che l'autore lo decida. Non abbassare gate, validator, test o limiti, né allargare un intervallo di freschezza.
Non spostare `last_verified` senza una lettura vera. Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate
avversariale, `ALLOWED_RUNTIME_ORIGINS`, né rinnovare la concessione. Non toccare licenza, non affiliazione, assenza di consulenza legale, README.
Non riscrivere la storia di `main` né forzare un push. Vale «Cosa NON fare» del brief.

## Lezioni (dal gruppo (b))

Il prompt può descrivere un albero che non è più quello: rimisura ogni premessa · la data è un fatto da misurare · **una chiave senza risposta
HTTP in un formato non è un testo mancante** · una modifica ai dati può rompere un test fuori dallo scrivibile (`tools/selftest.mjs` fissa le
date di lettura e usa `ap-cra-01` come fixture dello stato del 4 novembre) · un controllo che trova rosso va nominato · `origin/main` si
muove · ogni risposta in §8 si committa subito · **leggere il titolo e il primo comma di un Articolo non è leggerlo: dichiaralo**.

## Criterio di uscita e consegna

Completa quando: i testi di `eidas2` sono letti (M.1) e annotati in `docs/`; le decisioni di M.2 sono in §8 con le parole dell'autore;
`ap-eidas2-01` è riattestata o lasciata e dichiarata con la ragione; nessuna regola, claim, stato o data è cambiato senza una riga di §8;
validatori, `selftest`, 25 suite, `.control-room/` e browser passano e ogni avvertimento nuovo è spiegato; i residui sono nominati; **il prompt
della sessione successiva esiste sul branch, porta la stessa regola nel suo criterio di uscita ed è approvato con il lavoro**. Oppure l'autore
decide di fermarsi: anche allora si scrive il prompt della successiva. Prima di chiudere, la checklist M.1–M.4: cosa è stato scritto (file,
righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
