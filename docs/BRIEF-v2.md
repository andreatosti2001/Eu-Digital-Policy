<!--
Provenance: the BRIEF v2.0, the author's document, committed on the author's decision of 27 Oct 2026
(D-1, docs/ROADMAP-v2.md §8). Text below the rule is verbatim, in Italian, as the author pasted it in
v2 Session 2. One home: session prompts cite this file rather than carrying a copy. It is changed only
by the author; a session that thinks a decision here should be revisited says so and waits, as the
brief's own preamble requires.
-->

---

# BRIEF v2.0 — Contratto tra sessioni

Questo documento è vincolante per tutte le sessioni di lavoro sulla v2.0. Ogni prompt di sessione vi rinvia. Se una sessione ritiene che una decisione qui contenuta vada rivista, deve segnalarlo esplicitamente e attendere conferma prima di procedere.

## Principi guida (non negoziabili)

1. La v2.0 non deve essere più grande: deve essere **più esplicita**.
2. Ogni scelta di espansione deve essere tracciabile a un criterio dichiarato.
3. L'incertezza va resa leggibile, non nascosta.
4. La parzialità è ammessa, purché dichiarata — la mappa delle dipendenze è il modo per dichiararla.
5. Il valore del progetto dipende dalla capacità di chiarire **che cosa è stato controllato, su quali evidenze, a quale data e con quali limiti**.

## Cosa NON fare (in ogni sessione)

- **Non aggiungere la Tier A/B/C come primo intervento.** Prima di automatizzare, rendi trasparente il processo manuale.
- **Non costruire un backend serverless custom** finché un CMS git-based non si dimostra insufficiente.
- **Non pubblicare "what applies to me"** prima che i trigger siano verificati con lo stesso rigore delle claim.
- **Non inseguire la completezza** aggiungendo ViDA, AVMSD, copyright, GPSR, EAA, P2B, pubblicità politica come pagine complete. Vanno nel registro delle esclusioni o nella watchlist.
- **Non trattare la mappa delle dipendenze come un'illustrazione.** Se un nodo o un arco non è verificabile, va rimosso o declassato. Una mappa non verificata è peggio di nessuna mappa.
- **Non aggiungere un'altra dashboard** prima di aver sistemato i P0/P1 dell'audit.
- **Non comprimere problemi eterogenei in un punteggio aggregato.**
- **Non dichiarare "sicurezza operativa dimostrata"** dove ci sono solo controlli implementati nel codice e test eseguiti.
- **Non implementare nulla prima che la sessione precedente sia stata approvata.** I checkpoint sono reali, non decorativi.

## Decisioni già prese (vincolanti)

- **Inclusioni prioritarie Fase 2**: eIDAS 2.0 (promozione), Cyber Solidarity Act, EHDS, Interoperable Europe Act, Digital Networks Act (come regime in formazione).
- **Inclusioni condizionate Fase 3**: MiCA, PSD3/PSR, DGA in transizione — solo se si apre esplicitamente il capitolo finanza.
- **Etichette di stato uniformi**: `in vigore`, `in applicazione scaglionata`, `proposta legislativa in corso`, `accordo politico raggiunto, adozione formale attesa`, `ritirato`, `in transizione / possibile abrogazione`.
- **Mappa delle dipendenze**: artefatto dati verificabile, non illustrazione. Soggetta a `evidence-audit.mjs`.
- **Control Room**: Tier A (auto, controllo macchina), Tier B (attestazione umana), Tier C (autorialità umana). Login preferito: CMS git-based con OAuth. Serverless solo se necessario.
- **Sequenza**: Fase 0 (P0 audit) → Fase 1 (P1 audit) → Fase 2 (espansione) → Fase 3 (what applies base) → Fase 4 (automazione) → Fase 5 (what applies avanzata).
- **Punto di fragilità noto**: la proprietà `stratum` (`product` | `system` | `mixed`) è un'euristica analitica, non una categoria giuridica. Se in Session 2 emerge che va eliminata o sostituita, la proposta va motivata e approvata prima di procedere.

## Riferimenti

- Repository: https://github.com/andreatosti2001/Eu-Digital-Policy
- Audit P0/P1: documento del 24 ottobre 2026 (in `docs/` o allegato alla sessione)
- Roadmap approvata: `docs/ROADMAP-v2.md` (prodotta in Session 1)
- Documentazione Control Room: `docs/CONTROL-ROOM.md` (da riallineare in Fase 1)
