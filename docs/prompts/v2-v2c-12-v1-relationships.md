<!--
Provenance: the prompt of the Track R session that follows V2C-21b, drafted on 14 Nov 2026 in the V2C-21b session, on
`claude/confident-johnson-yeffcv`, on the author's answer "V2C-12, the eight v1 relationships (Recommended)" (docs/ROADMAP-v2.md
§8, "V2C-21b, W.4"), under the standing rule of §8 (4 Nov 2026). Drawn from docs/PHASE-3-AUDIT.md (V2C-12's row),
docs/V2-CLOSURE.md (V2C-12; N5; P3; P4), docs/SESSION-ARCHITECTURE.md (Track R) and the records as measured on 14 Nov 2026.
**No relationship was read against its sources for this prompt**: that is the session's to do. It records no §8 row of its own and
does not open the session: the session records its scope in §8 as its first write. Written in Italian, as the author's session
prompts are. The author may change it before use.
-->

SESSIONE V2C-12 — Traccia R, dati per il lettore: gli otto rapporti ancora v1 di `data/instruments.json`, letti contro le loro
fonti, per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune`, `git branch -a` e `git rev-parse --is-shallow-repository`
(se `true`, `git fetch --unshallow` prima di ogni suite). Verifica che `main` contenga la PR di V2C-21b, `docs/V2C-21b-READING.md`
e questo prompt. Se manca qualcosa, fermati e chiedi all'autore.

**Rimisura la data, prima di ogni altra cosa. La Traccia M ha la precedenza** (`docs/SESSION-ARCHITECTURE.md` §1): se oggi è il
12 gennaio 2027 o dopo, la finestra della sessione 25 è aperta e va detto all'autore prima di ogni altra cosa; il 24 dicembre 2026
è la tappa dello stato di `eidas2` (sessione 25, non questa); la concessione di autonomia scade il 9 marzo 2027 (si segnala, non
si rinnova).

**Come prima scrittura**, registra in §8 la riga «The scope of the V2C-12 session» con le parole dell'autore; se il prompt arriva
senza parole dell'autore, chiediglielo con lo strumento di domande. Senza quella riga non si scrive nulla.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch né tuo né nel registro di `docs/HANDOVER.md`. Lavora sul branch
assegnato o su `claude/v2c-12-v1-relationships`. Non lavorare su `main`.

Leggi, in quest'ordine: `docs/BRIEF-v2.md` «Cosa NON fare»; `docs/AI-SAFE-BOUNDARIES.md` §0 e §2; `docs/PHASE-3-AUDIT.md` (riga
V2C-12) e `docs/V2-CLOSURE.md` (V2C-12, N5, P3, P4); `data/instruments.json` `$description`, `$note` e i quaranta `relationships`;
`tools/selftest.mjs` W12 (la lista v1 «può solo ridursi»); `js/instrument-view.js` (dove i rapporti arrivano ai riquadri di
interazione), `js/format.js` `tierWord()`; `docs/V2-DATA-DESIGN.md` per `edge-v1-sources` e `edge-analytical-no-claim`;
`docs/V2C-21b-READING.md` come modello di lettura e di nota.

## Lo stato di partenza (14 novembre 2026; **rimisura tutto**)

Quaranta rapporti, otto ancora con id di fonte «nudi» (v1), nessuno con `requires_verification`:

| Rapporto | `sources` oggi |
|---|---|
| `rel-ai-act-gdpr-impact-assessments`, `rel-data-act-cloud-ai-act`, `rel-tfeu-114-acquis`, `rel-ai-act-teu-4-2` | `src-brief-original` (poggiano solo sul brief: il lettore vede «Unverified · the brief itself») |
| `rel-dsa-dma-scope`, `rel-nis2-cer`, `rel-cra-nis2` | due fonti EUR-Lex, senza locator e senza claim |
| `rel-data-omnibus-gdpr` | `src-eurlex-data-omnibus-837` |

Validatori all'inizio dell'ultima sessione: `validate` 0 errori, 5 avvertimenti (A-8 di `ap-eidas2-01`); `selftest` 189/189; 25 suite
e `.control-room/` 1495 test (1494 pass, 1 skipped); browser 361 pass, 1 undecidable.

## Obiettivo

**Ogni rapporto v1 è letto contro le sue fonti e migrato, o resta dichiarato per ciò che è.** Quattro punti:

- **W.1 · La lettura.** Per ciascuno degli otto, dal testo ufficiale letto in questa sessione (Cellar per CELEX, `Accept-Language:
  eng`; mai a memoria): cosa dice il rapporto, quale disposizione lo sostiene, se il testo la sostiene. Un rapporto che il testo non
  sostiene si propone di declassare o togliere, non di «aggiustare». Un rapporto che poggia solo sul brief non si promuove: o si
  trova la disposizione letta, o resta «Unverified» e con `requires_verification`.
- **W.2 · La proposta, all'autore.** Una tabella per rapporto: cosa si scrive (`provisions`, `claims`, `sources` v2 con locator,
  `verification_note`), o che resta v1 e perché. Una domanda all'autore per decisione, raccomandazione per prima, ogni risposta in
  §8 con le sue parole, **committata subito**. Se il «flip» `edge-v1-sources` si fa è decisione dell'autore.
- **W.3 · La scrittura**, solo dopo le risposte: i rapporti in `data/instruments.json` (e `data/claims.json` / `data/sources.json`
  solo per un documento letto davvero); `node tools/_footer.mjs`; diff minimi; ogni commit che tocca un file pubblicato porta la
  riga `Evidence:`. Se W12 deve cambiare perché la lista v1 si riduce, si cambia con la riga di §8, mai abbassandolo.
- **W.4 · Il prompt della sessione successiva**, scelto dall'autore tra le righe di Traccia R che §8 non mostra già eseguite (V2C-13
  prima di S30; F-18 prima di ogni modifica di `ap-dma-01`; la sessione 25 se la finestra del 12 gennaio 2027 è vicina). **Il
  checkpoint finale approva insieme il lavoro e il prompt; senza il prompt non si approva.**

**Regola d'arresto**: se la lettura di un rapporto non si completa, quel rapporto non si scrive e resta v1, dichiarato; nessun
rapporto si migra su una lettura parziale.

## Scrivere e verificare

`docs/` sempre; `data/instruments.json` (solo i `relationships` decisi), `data/claims.json`, `data/sources.json` — ciascuno dopo la
sua riga di §8. Prima del checkpoint: `validate`, `i18n-audit`, `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of
<oggi>`, `seo-audit`, `node --test tools/selftest.mjs`, `node tools/commit-evidence.mjs <base> HEAD`, le 25 suite e `.control-room/`,
la suite del browser. Non scrivere nell'albero mentre la batteria gira. **Confronta l'output intero con quello della base, non un
filtro** (lezione di V2C-21). Un avvertimento nuovo è un rilievo.

## Cosa NON fare

- Non toccare `eidas2` (i suoi attori e le sue disposizioni sono di V2C-21/21b), `ap-eidas2-01` né alcuna regola di
  `data/applicability.json`; né stato, date, `timeline`, `last_verified` di un record che la sessione non rilegge.
- Non implementare i controlli della mappa (V2C-13): se servono per tenere V2C-12, si nominano.
- Non rinominare un ID; non aggiungere termini di tassonomia senza una domanda; non autorizzare da memoria un Articolo, una data,
  un CELEX. Non abbassare gate, validator, test o limiti.
- Non toccare il dispatcher di produzione, il registro delle decisioni, la prontezza, il gate avversariale, `ALLOWED_RUNTIME_ORIGINS`,
  né rinnovare la concessione. Non toccare licenza, non affiliazione, assenza di consulenza legale, README.
- Non riscrivere la storia di `main` né forzare un push; non riscrivere un rapporto passato (si annota). Vale «Cosa NON fare» del brief.

## Lezioni (da `docs/HANDOVER.md`)

La data è un fatto da misurare e una premessa del prompt può essere sbagliata · il soggetto grammaticale di un «shall» è il
destinatario · un filtro che non trova nulla non prova nulla · una suite può creare `agent/records/` vuoto: controlla prima della
chiusura · `origin/main` si muove: riscarica prima di ogni scrittura di `docs/HANDOVER.md` e prima di una PR · ogni risposta in §8
si committa subito, e dopo un riavvio `git status` prima di rifare un comando.

## Criterio di uscita e consegna

Completa quando: ogni rapporto v1 è letto e annotato; ciascuno è migrato con una disposizione letta, o resta v1 dichiarato con una
decisione dell'autore in §8; nessuna regola, stato o data è cambiato; validatori, `selftest`, 25 suite, `.control-room/` e browser
passano e ogni avvertimento nuovo è spiegato; **il prompt della sessione successiva esiste sul branch, porta la stessa regola nel
suo criterio di uscita ed è approvato con il lavoro**. Oppure l'autore decide di fermarsi: anche allora, prima di chiudere si scrive
il prompt della successiva.

Prima di chiudere, produci la checklist: per ciascun punto (W.1–W.4) cosa è stato scritto (file, righe di §8, commit), come
verificarlo a mano, se esiste un test e dove, quale criterio di uscita soddisfa. Se un punto non è completo, dichiaralo.
