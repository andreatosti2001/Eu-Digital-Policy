<!--
Provenance: drafted on 22 Nov 2026 in the rebalancing session, on `claude/rebalance-housekeeping`, from `main` `a61b99d`, on the author's
answer of that day (docs/ROADMAP-v2.md §8, "The corrigenda without an English expression"): in the next rule-check round, a corrigendum with
no English expression is read in another official language, Italian or French, the language is recorded in the attestation, and the site
still states the gap. Drawn from docs/RULES-MAINTENANCE-B-READING.md (53 corrigenda answering HTTP 404 in English, XHTML and HTML, on
18 Nov 2026), docs/RULE-MAINTENANCE.md and docs/ATTESTATION-FORM.md. **Nothing was read from any legal text for this prompt.** It records no
§8 row of its own. Written in Italian. The author may change it before use. It does not replace the Track M prompt for `eidas2`
(`v2-track-m-eidas2-milestone.md`), which comes first.
-->

SESSIONE TRACCIA M — il giro di riattestazione delle regole prima del 16–17 febbraio 2027, con i corrigenda letti in italiano o francese

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a`, `git rev-parse --is-shallow-repository` (se `true`,
`git fetch --unshallow`). Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`.
**Rimisura la data** con `node tools/freshness.mjs --as-of <data>`: misurato il 18 novembre 2026, `ap-dma-01` scade il 16 febbraio 2027 e le
altre 30 regole riattestate il 17 febbraio 2027; `ap-eidas2-01` è della sessione `eidas2`. **Come prima scrittura**, registra in §8 la riga
«The scope of the rules round of February 2027» con le parole dell'autore.

Leggi: `docs/RULE-MAINTENANCE.md`; `docs/ATTESTATION-FORM.md`; `docs/RULES-MAINTENANCE-B-READING.md` (il metodo, gli hash, la query SPARQL,
l'elenco dei 53 corrigenda senza espressione inglese); `docs/AI-SAFE-BOUNDARIES.md` §0 e §2.

## Obiettivo

- **R.1 · La lettura, per CELEX da Cellar, SHA-256 per documento.** I testi che le regole citano, con la query SPARQL rieseguita per atti
  modificativi e corrigenda nuovi. **I corrigenda senza espressione inglese si chiedono in italiano (`Accept-Language: ita`) e, se mancano anche
  in italiano, in francese (`fra`)**; si registra la lingua letta accanto all'hash. Un corrigendum che non risponde in nessuna delle tre lingue
  resta non letto e si dichiara. La lettura in un'altra lingua dice che cosa il corrigendum corregge; **non** autorizza a tradurre in inglese
  le parole di una regola: dove una regola cita una formulazione corretta, la si nomina all'autore.
- **R.2 · La proposta, all'autore**, una domanda per decisione, raccomandazione per prima, risposte in §8: per regola, riattestare senza
  cambiare parole, riformulare sul testo, o nominare un divario. Le frasi valutative lasciate dal gruppo (b) si trattano solo se l'autore lo
  decide.
- **R.3 · La scrittura**, solo dopo le risposte: `attestation` con la lingua di ogni corrigendum letto fuori dall'inglese; `last_verified`
  spostato solo su una lettura vera; le pin di `tools/selftest.mjs` solo sulla parola dell'autore.
- **R.4 · Il divario sul sito.** Ciò che resta non letto (corrigenda senza testo in nessuna lingua provata) si dice al lettore, nel punto
  che l'autore sceglie (la pagina del metodo, la nota della regola, o entrambe), con il conteggio derivato dai dati, non scritto a mano.
- **R.5 · Il prompt della sessione successiva** (una sessione visibile, per la regola del 22 novembre 2026). Il checkpoint finale approva
  insieme il lavoro e il prompt.

**Regola d'arresto**: ciò che non si legge non si scrive e si dichiara; nessuna formulazione si sostituisce con una «plausibile»; una
riattestazione non cambia una parola per chiudere una scadenza.

## Scrivere e verificare

Ogni commit che tocca un file pubblicato porta `Evidence:`. Prima del checkpoint: `validate`, `i18n-audit`, `design-qa`,
`evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>` e `--as-of 2027-02-17`, `seo-audit`, `node --test tools/selftest.mjs`,
`node tools/commit-evidence.mjs <base> HEAD`, `node agent/implement/cli.mjs check --as-of <oggi>`, le 25 suite e `.control-room/`, la suite
del browser (in background; non scrivere nell'albero mentre gira).

## Cosa NON fare

Non tradurre una regola dal testo italiano o francese. Non spostare `last_verified` senza una lettura vera. Non allargare un intervallo di
freschezza. Non toccare una regola che l'autore non abbia nominato in §8. Non abbassare gate, validator o test. Non toccare licenza, non
affiliazione, assenza di consulenza legale, README. Vale «Cosa NON fare» del brief.
