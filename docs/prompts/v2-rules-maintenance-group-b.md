<!--
Provenance: the prompt of the Track R session that follows the rules-maintenance session, group (a), drafted on 17 Nov 2026 in that session, on
`claude/laughing-tesla-ydv2ro`, on the author's answer "Rules re-attestation before 3 Feb (Recommended)" (docs/ROADMAP-v2.md §8, "Rules
maintenance (a), W.4"), under the standing rule of §8 (4 Nov 2026). Drawn from docs/RULES-MAINTENANCE-A-READING.md (§1: the nine findings of
group (a) were closed on 4 Nov 2026 in v2 Session 21; no rule's attestation was due in that session), docs/RULE-MAINTENANCE.md and
docs/ATTESTATION-FORM.md. **Nothing was read from any Regulation, Directive or rule for this prompt**: that is the session's to do. It records
no §8 row of its own and does not open the session: the session records its scope in §8 as its first write. Written in Italian, as the
author's session prompts are. The author may change it before use.
-->

SESSIONE MANUTENZIONE DELLE REGOLE, gruppo (b) — Traccia R: la riattestazione delle regole prima del 3 febbraio 2027, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`). Verifica che `main` contenga il lavoro del gruppo (a) (`docs/RULES-MAINTENANCE-A-READING.md`, le righe di §8 del
17 novembre 2026, il commit dei dati su `nis2` e `ap-dma-04`) e questo prompt; altrimenti fermati e chiedi all'autore. **Rimisura la data. La
Traccia M ha la precedenza** (`docs/SESSION-ARCHITECTURE.md` §1): il 24 dicembre 2026 è la tappa di `eidas2`; dal 12 gennaio 2027 la finestra
della sessione 25 è aperta. **Misurato il 17 novembre 2026 con `freshness.mjs`: 32 regole scadono il 3 febbraio 2027 (`last_verified`
2026-11-04), `ap-dma-01` (2026-11-17) il 16 febbraio 2027, e T-12 scatta su `ap-cra-01` il 26 marzo 2027; rimisura con `node tools/freshness.mjs
--as-of <data>` e `node tools/evidence-audit.mjs --as-of <data>`** e dillo all'autore prima di ogni altra cosa. La concessione di autonomia
scade il 9 marzo 2027 (si segnala, non si rinnova).

**Come prima scrittura**, registra in §8 la riga «The scope of the rules-maintenance session (group (b))» con le parole dell'autore; se mancano,
chiedile con lo strumento di domande. Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di
`docs/HANDOVER.md`. Lavora sul branch assegnato. Non lavorare su `main`.

Leggi: `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §2; `docs/RULE-MAINTENANCE.md` (i passi 1–6, e le tre correzioni
del 4 novembre 2026); `docs/ATTESTATION-FORM.md`; `docs/RULES-MAINTENANCE-A-READING.md` (il metodo e ciò che il gruppo (a) ha lasciato);
`docs/F-18-READING.md`; `docs/EVIDENCE-MODEL.md`; `docs/SOURCE-POLICY.md`.

## Lo stato di partenza (17 novembre 2026; **rimisura tutto**)

I rilievi F-02, F-03, F-04, F-13, F-14, F-17, F-19, F-20 e F-23 sono chiusi (v2 Session 21, 4 novembre 2026; punto di partenza del gruppo (a)
rimisurato il 17 novembre). Restano due cose che **non sono rilievi ma scadenze**: le 32 regole lette il 4 novembre 2026 hanno `last_verified`
2026-11-04 e l'intervallo è di 90 giorni; `ap-dma-01` è stata riletta il 17 novembre 2026 (F-18). **Nessuna regola è stata riletta dal gruppo (a)**:
il suo lavoro ha toccato solo parole (`nis2` `status_note`, `instruments.html`, l'ultima frase di `ap-dma-04`), senza spostare alcun
`last_verified`.

**Residui del gruppo (a), da trattare solo se l'autore lo decide:** (1) `data/timeline.json` non ha alcun evento per il 2 agosto 2027
(Art. 111(3) dell'AI Act; deciso «lasciato com'è» il 17 novembre); (2) i punti aperti del prompt del gruppo (a): `gdpr.legal_basis` contro il
visa; l'Allegato II di COM(2026) 502 senza record di fonte; letture rimaste parziali (V2C-12; V2C-17…19); l'Art. 3 punto 8 di COM(2025) 837
che modifica l'Art. 33 del GDPR; la discrepanza tra memorandum e Art. 10(2) sul P2B; i sette atti dell'Art. 2(3) del Regolamento sulla
pubblicità politica senza arco; da F-18: le traduzioni it/fr/es ritirate, la «self-executing» di `ap-dma-01`/`part-4.p4`,
`tl-dma-2024-03-07-compliance`, le due fonti non tier-1 di `ap-dma-01`, il testo dei corrigenda `R(01)`, `R(02)`, `R(03)` del DMA.

## Obiettivo

- **W.1 · La lettura, per CELEX da Cellar (`Accept-Language: eng`, SHA-256 per documento), senza nulla da memoria.** Per ogni regola scelta
  dall'autore: gli Articoli che cita (`obligations`, `condition_provisions`, ogni `sources[].locator`), citati alla lettera; gli atti
  modificativi e i corrigenda (SPARQL, come in `docs/RULE-MAINTENANCE.md` §2, rieseguito: il gruppo (a) **non** lo ha rieseguito); **ciò che non
  si legge non si scrive e si dichiara** (un testo che Cellar non serve in XHTML può servirsi in HTML: prova prima di dichiararlo mancante).
- **W.2 · La proposta, all'autore**: **quali regole, in quale ordine** (per istrumento: una lettura di un Regolamento serve più regole), e per
  ciascuna se il lavoro è **la sua attestazione** (`docs/RULE-MAINTENANCE.md`, passi 1–6) e **con quali fonti in `attestation.read`**; una
  tabella per divergenza trovata (cosa dice il testo, cosa dice il sito, cosa il testo permette di dire); **una domanda per decisione,
  raccomandazione per prima, ogni risposta in §8 con le sue parole, committata subito.** Se il testo regge la regola, si riattesta senza
  cambiare le parole e lo si dice.
- **W.3 · La scrittura**, solo dopo le risposte. Ogni commit che tocca un file pubblicato porta la riga `Evidence:`; una regola toccata passa
  A-1…A-8; `node tools/_footer.mjs` se un dato pubblicato cambia; **dopo ogni modifica di `data/` o di `i18n/` le 25 suite, non solo i
  validatori**, e `node --test tools/selftest.mjs`: `READ_2026_11_04` fissa le date di lettura e si aggiorna **solo sulla parola
  dell'autore** (`docs/RULE-MAINTENANCE.md` step 4); un riferimento registrato in `docs/CURRENT-ARCHITECTURE.md` §12 si muove solo con una
  riga di §8 e con le suite che lo fissano; **una stringa della brief che cambia ritira le traduzioni it/fr/es come `superseded`**, non le
  riscrive.
- **W.4 · Il prompt della sessione successiva**, scelto dall'autore tra le righe di Traccia R che §8 non mostra già eseguite (le etichette di
  stato V2C-14, V2C-20, D-3; F-27 e V2C-66; V2C-11; F-29; la sessione 25 se la finestra è vicina; i residui sopra; le regole non riattestate in
  questa sessione, se ne restano). **Il checkpoint finale approva insieme il lavoro e il prompt; senza il prompt non si approva.**

**Domanda da porre all'autore prima della lettura:** `ap-eidas2-01` (Traccia M, tappa del 24 dicembre 2026) e le regole che citano gli atti di
`eidas2` rientrano nella riattestazione di questa sessione, o restano alla Traccia M? Il prompt del gruppo (a) le escludeva per nome; qui la
decisione è dell'autore e va in §8 prima di toccarle.

**Regola d'arresto**: ciò che non si legge nel testo non si scrive e si dichiara; nessuna formulazione si sostituisce con una «plausibile»;
una riattestazione non cambia una parola per chiudere una scadenza; se il testo non regge una regola, **si nomina e si decide**, non si
corregge in silenzio. **Un controllo che trova qualcosa di rosso si nomina e si decide.**

## Scrivere e verificare

`docs/` sempre; `data/`, `i18n/`, `tools/` ciascuno dopo la sua riga di §8. Prima del checkpoint: `validate`, `i18n-audit`, `design-qa`,
`evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`, `node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs
<base> HEAD`, `node agent/implement/cli.mjs check --as-of <oggi>`, le 25 suite e `.control-room/`, la suite del browser (in background:
supera i 120 s; **non scrivere nell'albero mentre gira**). **Confronta l'output intero con la base** (salvato prima di scrivere). Se il
conteggio `unverified` o degli avvertimenti di `validate` cambia, §12 di `docs/CURRENT-ARCHITECTURE.md` e tutte le suite. Misura che, dopo la
sessione, `freshness --as-of 2027-02-03` non nomini più le regole riattestate.

## Cosa NON fare

Non toccare una regola di `data/applicability.json` che l'autore non abbia nominato in §8; né stato, date, `timeline`, `last_verified` di un
record non riletto. Non cambiare gli archi della mappa. Non rinominare un ID. Non autorizzare da memoria un Articolo, una data, un CELEX, un
termine. Non scrivere una traduzione senza che l'autore lo decida. Non abbassare gate, validator, test o limiti, né allargare un intervallo
di freschezza. Non spostare `last_verified` senza una lettura vera: **spostarlo è l'atto che il processo attesta**. Non toccare il dispatcher
di produzione, il registro delle decisioni, la prontezza, il gate avversariale, `ALLOWED_RUNTIME_ORIGINS`, né rinnovare la concessione. Non
toccare licenza, non affiliazione, assenza di consulenza legale, README. Non riscrivere la storia di `main` né forzare un push. Vale «Cosa NON
fare» del brief.

## Lezioni (da `docs/HANDOVER.md` e dal gruppo (a))

**Il prompt può descrivere un albero che non è più quello**: il prompt del gruppo (a) partiva dall'albero del 3 novembre e i nove rilievi erano
già chiusi dal 4 novembre — rimisura ogni premessa contro `data/` e §8 prima di proporre · la data è un fatto da misurare · una lettura contro
il testo può smentire il dato · **una chiave senza risposta HTTP in un formato non è un testo mancante** · **un controllo che trova rosso va
nominato** · una modifica ai dati può rompere un test fuori dallo scrivibile (`tools/selftest.mjs` fissa le date di lettura; un test di
`agent/implement` fissa il riferimento di §12) · **un riferimento registrato si muove con una riga di §8** · un controllo che non può fallire
non è un controllo · `origin/main` si muove · ogni risposta in §8 si committa subito · **un testo che si dice letto ma di cui non si è rieseguito
SPARQL va dichiarato come tale**.

## Criterio di uscita e consegna

Completa quando: le regole scelte dall'autore sono lette (W.1) e annotate nei file di `docs/`; le decisioni di W.2 sono in §8 con le parole
dell'autore; ogni regola è riattestata, o lasciata e dichiarata con la ragione; nessuna regola, claim, stato o data è cambiato senza una riga
di §8; validatori, `selftest`, 25 suite, `.control-room/` e browser passano e ogni avvertimento nuovo è spiegato; i residui e i punti aperti
sono nominati; **il prompt della sessione successiva esiste sul branch, porta la stessa regola nel suo criterio di uscita ed è approvato con
il lavoro**. Oppure l'autore decide di fermarsi: anche allora si scrive il prompt della successiva. Prima di chiudere, la checklist W.1–W.4:
cosa è stato scritto (file, righe di §8, commit), come verificarlo a mano, se esiste un test e dove.
