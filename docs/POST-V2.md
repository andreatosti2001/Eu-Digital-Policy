# POST-V2 — il piano successivo alla v2, non ancora aperto

**Stato:** non aperto. Nessuna sessione è stata avviata e nessuna decisione è stata presa.
**Fonte:** `docs/prompts/v2-session-6.md`, sezione «Passaggio al lavoro post-v2» (righe 149–270). È il
roadmap scritto dall'autore, incollato come prompt della sessione 6 il 27 ottobre 2026 e conservato per sua
decisione di quel giorno. Questo documento lo riporta senza cambiarne il contenuto (§3), e aggiunge solo le
condizioni di apertura, la stima delle sessioni (§4, aggiornata il 4 novembre 2026) e le domande che l'autore
deve decidere.
**Aggiornamento del 4 novembre 2026:** la stima delle sessioni è stata rifatta dall'autore (§4: numerazione
PV2-01…PV2-12 e previsione di 11 sessioni nello scenario raccomandato). Le parti A–E (§3) non sono cambiate.
La stima è una **previsione**, non una durata garantita, e non apre il post-v2: lo stato resta «non aperto».
**Aggiornamento del 5 novembre 2026** (`docs/ROADMAP-v2.md` §8, v2 Session 25, 25.5 domande 1–4): il post-v2 è diviso in
due stadi dell'architettura delle sessioni (`docs/SESSION-ARCHITECTURE.md`). **A, B e C (PV2-01…05) sono lo Stadio 2,
prima della Fase 5**, e si aprono sulla parola dell'autore senza che la v2 sia chiusa; **D, E e il final QA (PV2-06…12)
sono lo Stadio 4**, dopo la Fase 5 e dopo la chiusura della v2, e mantengono le condizioni del §2. Le parti A–E (§3)
non sono cambiate. Lo stato resta «non aperto» finché l'autore non apre lo Stadio 2 (gate G1).
**Riferimenti:** `docs/V2-CLOSURE.md`, domanda 6 (e la voce V2C-37); `docs/ROADMAP-v2.md` §8 per ogni decisione
presa.

---

## 1. Che cosa è

Il post-v2 è il lavoro sul frontend e sui contenuti che la v2 **non** fa: il redesign, le infografiche,
le animazioni e il blog. La v2 riguarda la correttezza del contenuto (Fase 0–3), non l'aspetto del sito.

**Non si apre da solo.** Si apre quando l'autore lo decide esplicitamente e la decisione è registrata in
`docs/ROADMAP-v2.md` §8. Aprirlo non significa avviarlo: anche dopo l'apertura, ogni sessione parte solo
con l'approvazione della precedente.

## 2. Condizioni prima di aprire

Il piano originale dice di non chiudere la v2 con fasi non eseguite e di non dichiarare la v2 conclusa senza
una decisione esplicita dell'autore. Quindi, prima di aprire il post-v2:

- la v2 è chiusa o la sua chiusura è decisa, con i finding aperti classificati (`docs/V2-CLOSURE.md`);
- il gate finale di chiusura (sessione 11, se necessaria) è registrato in §8;
- la Fase 3 è chiusa, o l'autore decide che il post-v2 può partire comunque.

*Modificato il 5 novembre 2026 per A, B e C soltanto* (`docs/ROADMAP-v2.md` §8, v2 Session 25, 25.5 domanda 1): PV2-01…05
non richiedono la chiusura della v2; si aprono con lo Stadio 2 di `docs/SESSION-ARCHITECTURE.md`, al gate G1. Per D, E e
il final QA (PV2-06…12) le tre condizioni sopra restano come scritte (25.5 domanda 4).

## 3. Le cinque parti, nell'ordine del piano

Il piano dà un ordine: **A, B, C, D, E**. Ogni parte richiede l'approvazione della precedente.

### A — Data readiness (gate per dashboard e infografiche)

Inventario dei dataset e delle metriche che si vorrebbero mostrare, prima di costruire qualsiasi
visualizzazione. Per ogni metrica candidata:

- la domanda a cui risponde e la sua definizione operativa;
- i campi e i record sorgente, con collegamenti alla fonte;
- formula, denominatore e unità di misura, se applicabili;
- periodo e data «as of»;
- criteri di inclusione ed esclusione;
- il significato di zero, null, sconosciuto, non applicabile e non verificato;
- limiti di copertura, confrontabilità e aggiornamento;
- livello e stato dell'evidenza;
- test che falliscono quando una proprietà essenziale manca.

Si produce prima un audit e una proposta di contratto delle metriche. **Nessun valore stimato o generato per
riempire i buchi.** Le visualizzazioni sono un gate successivo, non parte del primo audit.

### B — Riferimenti frontend open source

Ricerca documentata di progetti realmente consultabili. Non si sceglie un template dal solo screenshot o dal
numero di stelle. Per ogni candidato: repository e demo, attività e manutenzione, licenza e obblighi di
attribuzione, stack, dipendenze di runtime e di build, responsive, tema chiaro e scuro, accessibilità, qualità
di tabelle e grafici, gerarchia editoriale, animazioni, facilità di ricostruzione senza dipendenze, limiti.

Griglia pubblicata **prima** della selezione:

| Criterio | Peso |
|---|---:|
| Adattabilità a un osservatorio giuridico/editoriale | 20% |
| Gerarchia informativa e leggibilità | 20% |
| Qualità di dashboard, tabelle e visualizzazioni | 20% |
| Responsive, accessibilità e temi | 15% |
| Possibilità concreta di ricostruzione vanilla HTML/CSS/JS | 15% |
| Licenza e manutenzione documentate | 10% |

Galleria di riferimenti per categorie: homepage editoriale, pagina dello strumento, dashboard, timeline,
tabella comparativa, blog o articolo, navigazione, microinterazioni.

**Vincoli:** nessun framework, libreria, font remoto, script di terze parti o immagine proprietaria. I progetti
servono a studiare pattern e, solo se la licenza lo consente, a piccoli riusi con attribuzione. La produzione
resta senza dipendenze di runtime esterne.

**Deliverable da approvare prima del prototipo:** matrice dei repository, punteggi motivati, screenshot e note,
licenze verificate, tre direzioni grafiche descritte.

**Shortlist iniziale da verificare** (non è una decisione di adozione; va verificata dal vivo e alla data della
ricerca; le licenze indicate non autorizzano a copiare un progetto intero senza leggere il suo LICENSE e le
licenze degli asset):

- *PureDashboard* — candidato tecnico per dashboard vanilla (HTML e ES modules, nessun build step). MIT.
- *Tabler* — per studiare gerarchia di dashboard, KPI, tabelle e tema chiaro/scuro. MIT, ma basato su Bootstrap 5;
  solo come riferimento visivo. Licenze dei componenti (soprattutto i grafici) da verificare a parte.
- *GOV.UK Design System / GOV.UK Frontend* — riferimento per chiarezza, tabelle, form, stati e accessibilità.
  MIT salvo indicazioni specifiche.
- *Simple.css* — per una base editoriale leggibile. MIT.
- *HTML5 UP — Editorial* — per layout di lettura con sidebar. Creative Commons Attribution 3.0; alcuni template
  includono jQuery. Solo riferimento, finché asset e licenza del template specifico non sono verificati.
- *Kabarza* — riferimento visivo esterno per ritmo e transizioni, **non** un progetto open source. Non si copiano
  codice, asset o animazioni; si traducono principi di timing e feedback in implementazioni originali e accessibili.

### C — Tre prototipi confrontabili (non un redesign)

Tre direzioni:

1. **Editoriale:** forte gerarchia tipografica e lettura lineare.
2. **Policy observatory:** navigazione e dati in primo piano.
3. **Ibrida:** apertura editoriale, pagine strumento e viste analitiche più strutturate.

Ogni direzione usa gli stessi contenuti e almeno quattro viste: homepage, pagina di un regolamento,
dashboard o timeline, pagina di un articolo. Desktop e mobile, tema chiaro e scuro, stati vuoti e dati mancanti.
Si confrontano prima di selezionare. **Il frontend attuale resta la baseline.** Non si riscrivono insieme
struttura dei dati, modelli di evidenza e rendering. La nuova interfaccia consuma i JSON canonici e mantiene
i gate di pubblicazione, la Content-Security-Policy e i test esistenti.

### D — Redesign, infografiche e microanimazioni

Solo dopo la scelta del prototipo e il superamento del gate di data readiness (A):

- trasformare i pattern approvati in token e componenti riusabili;
- grafici solo dove migliorano una domanda analitica reale;
- tooltip accessibili e una rappresentazione testuale alternativa;
- un dato mancante mostrato come mancante, **non come zero**;
- un unico sistema di movimento, con il passaggio giorno/notte e transizioni brevi;
- rispetto di `prefers-reduced-motion`, tastiera, contrasto e link diretti a pagine e ancore;
- HTML semantico, nessuna dipendenza di produzione.

Qui rientra anche la voce V2C-37 di `docs/V2-CLOSURE.md`: la barra sottile dello spine restringe il rail di
10px quando compare. Il piano la considera parte del redesign, non un intervento a sé durante la v2.

### E — Blog statico con SEO per articolo

Il blog è una pubblicazione statica, non una lista caricata solo via JavaScript:

- `/blog/` come archivio indicizzabile;
- un URL stabile e un HTML autonomo per ogni articolo;
- metadati coerenti, sitemap e controlli automatici.

Il piano non dichiara una dipendenza esplicita di E dalle altre parti.

## 4. Sequenza e stima delle sessioni (previsione aggiornata al 4 novembre 2026)

Questa sezione sostituisce la stima originale di «circa 4–5 sessioni» (e la numerazione «12–16» con cui era
espressa), che era una pianificazione compressa: accorpava data readiness e ricerca frontend, prevedeva una
sola sessione per i tre prototipi e non separava la verifica finale dal lavoro di implementazione. La nuova
stima adotta lo stesso criterio della v2: ricerca, progettazione, implementazione e verifica hanno ciascuna un
deliverable e una condizione di uscita verificabili.

**È una previsione, non una durata garantita.** Ogni sessione chiude con il proprio checkpoint e parte solo con
l'approvazione dell'autore. Non si accorpano sessioni per rispettare il conteggio; se un gate fallisce o emerge
un problema sostanziale, ci si ferma, si documenta e si stima il lavoro aggiuntivo.

**Numerazione.** `PV2-NN`, distinta dalla numerazione «v2 Session N» di `docs/ROADMAP-v2.md` (le due serie non
sono collegate).

### 4.1 Le sessioni

| Sessione | Attività | Condizione di uscita |
|---|---|---|
| PV2-01 | A — Data readiness | Inventario dei dataset e delle metriche candidate; definizioni, fonti, formule, denominatori, periodi, trattamento dei valori mancanti, limiti e test documentati |
| PV2-02 | B — Ricerca e selezione dei riferimenti frontend open source | Matrice dei repository e delle demo, manutenzione, licenze, stack, accessibilità, responsive, temi e pattern; shortlist e tre direzioni grafiche descritte |
| PV2-03 | C — Prototipo Editoriale | Prima direzione implementata sulle viste e sugli stati concordati |
| PV2-04 | C — Prototipo Policy Observatory | Seconda direzione implementata con gli stessi contenuti e criteri di confronto |
| PV2-05 | C — Prototipo Ibrido e selezione | Terza direzione, confronto omogeneo dei tre prototipi e decisione esplicita dell'autore |
| PV2-06 | D — Design system e struttura | Token, componenti riusabili, layout e pattern approvati; nessuna modifica ai dati canonici non autorizzata |
| PV2-07 | D — Redesign delle viste | Implementazione incrementale delle pagine principali e della navigazione sulla base del prototipo selezionato |
| PV2-08 | D — Infografiche e visualizzazioni | Grafici, tooltip e alternative testuali fondati sulle metriche approvate in A |
| PV2-09 | D — Motion, temi e accessibilità | Passaggio giorno/notte, microanimazioni, responsive, tastiera, contrasto e `prefers-reduced-motion`; regressioni mirate |
| PV2-10 | E — Blog statico e SEO | Archivio e pagine articolo autonomamente indicizzabili, template, metadati, sitemap e controlli automatici |
| PV2-11 | Final QA e rilascio | Verifica integrata di contenuti, rendering, accessibilità, SEO, CSP, prestazioni e regressioni; checklist di rilascio |
| PV2-12 | Buffer eventuale | Correzioni sostanziali emerse dai gate, che non possono essere chiuse nel perimetro assegnato |

**PV2-12 non è una sessione ordinaria.** Si attiva solo se PV2-11, o una sessione precedente, rileva problemi che
non possono essere chiusi nel perimetro assegnato. Non rientra nel conteggio dello scenario raccomandato.

*Dal 5 novembre 2026* le righe PV2-01…05 sono lo Stadio 2 e PV2-06…12 lo Stadio 4 di `docs/SESSION-ARCHITECTURE.md`, che è
la sede dell'ordine tra queste sessioni e quelle della Fase 5; tra i due stadi stanno la Fase 5 e la chiusura della v2.

L'ordine delle righe è l'ordine di esecuzione previsto: data readiness → selezione frontend → prototipi →
redesign e visualizzazioni → blog → final QA. L'ordine di PV2-10 non stabilisce una dipendenza di E dalle altre
parti (vedi §5).

### 4.2 La stima

| Scenario | Sessioni |
|---|---:|
| Efficiente | 8–9 — possibile solo con prototipi e redesign circoscritti e poche iterazioni |
| **Realistico, raccomandato** | **11** (PV2-01…PV2-11) |
| Conservativo | 12–13 — se emergono revisioni sostanziali del design system, problemi di accessibilità o responsive, o regressioni d'integrazione |
| Buffer | PV2-12, soltanto se necessaria (vedi sopra) |

Ripartizione dello scenario raccomandato:

| Blocco | Sessioni | Sessioni PV2 | Nota |
|---|---:|---|---|
| A — Data readiness | 1 | PV2-01 | Audit e contratto delle metriche; è un gate per le visualizzazioni |
| B — Ricerca frontend | 1 | PV2-02 | Ricerca documentata, matrice comparativa e licenze |
| C — Prototipi | 3 | PV2-03, 04, 05 | Una sessione per ciascuna direzione; la terza include il confronto e la selezione |
| D — Redesign e visualizzazioni | 4 | PV2-06, 07, 08, 09 | Design system, pagine, grafici e infografiche, motion e accessibilità |
| E — Blog SEO | 1 | PV2-10 | Architettura statica, template, metadati e sitemap |
| Final QA | 1 | PV2-11 | Verifica integrata e rilascio |
| **Totale** | **11** | | Più PV2-12 soltanto se necessaria |

**Presupposti e rischi.** La stima presuppone che A non richieda una revisione sostanziale dei dataset canonici
e che il redesign D mantenga l'architettura dei dati e i gate esistenti. Una modifica strutturale ai dati, alla
Content-Security-Policy o al modello di evidenza richiede una decisione di scope e una stima separata: non si
assorbe silenziosamente nel redesign. D è il principale fattore di rischio e di durata: il blocco non si
comprime a due sessioni per rispettare un calendario, perché include sistema di componenti, viste,
visualizzazioni, temi, microanimazioni, responsive e accessibilità. Il blocco C deve garantire che le tre
direzioni siano confrontate con gli stessi contenuti e nelle stesse condizioni, non soltanto che esistano tre
homepage dimostrative.

**Evidence Navigator.** Escluso dal conteggio e da questo piano di implementazione: lo scrive l'autore, in un
percorso separato. Non se ne anticipano implementazione, scaffolding o integrazione nelle sessioni PV2.

**Che cosa la stima non fa.** Non apre il post-v2 e non chiude la v2: per entrambi restano le condizioni del §2 e
una decisione esplicita dell'autore, registrata in `docs/ROADMAP-v2.md` §8. Non misura il successo dal numero di
file o schermate aggiunti, ma dal miglioramento della qualità legale, dalla provenienza verificabile,
dall'assenza di regressioni e dalla possibilità del lettore di capire che cosa il sistema sa e che cosa non sa.

## 5. Ciò che il piano non stabilisce

- **Una stima di sessioni nel piano originale.** Il piano diceva «circa 4–5 sessioni», con una numerazione che
  non era più quella attuale. È stata rifatta il 4 novembre 2026: vedi §4, che la sostituisce. Il testo originale
  resta in `docs/prompts/v2-session-6.md`, come storia.
- **Un ordine di pubblicazione di E rispetto al resto.** La sequenza del §4.1 mette E dopo D come ordine di
  esecuzione previsto; il piano non dichiara che E dipenda da D.
- **Che il redesign sia giusto.** La direzione la sceglie l'autore dopo il confronto dei prototipi.
- **Alcuna licenza o alcun riuso.** Ogni scelta richiede la verifica della licenza al momento della scelta.

## 6. Domande aperte per l'autore

1. Il post-v2 si apre, e quando? (`docs/V2-CLOSURE.md`, domanda 6.) **Per A–C deciso il 5 novembre 2026**: allo Stadio 2,
   al gate G1 (`docs/ROADMAP-v2.md` §8, 25.5 domanda 1). Per D–E: dopo la chiusura della v2 (25.5 domanda 4).
2. La parte A (data readiness) può partire prima della chiusura formale della v2, perché non tocca il contenuto?
   **Sì, con B e C** (25.5 domanda 1).
3. Il gate di B richiede la griglia approvata prima della ricerca, come scritto nel piano? **Sì, deciso il 9 novembre 2026**:
   la griglia è il primo checkpoint di PV2-02 e nessun candidato si ricerca prima della sua approvazione (`docs/ROADMAP-v2.md`
   §8, «PV2-01, A.5 question 2»).
4. ~~La stima di sessioni va rifatta: chi la fa, e in quale sessione?~~ **Rifatta dall'autore il 4 novembre 2026**
   (§4), come previsione. Resta aperto se e quando registrarla in `docs/ROADMAP-v2.md` §8: l'aggiornamento di
   questo documento non lo fa.
5. Il Kabarza resta un riferimento visivo esterno, come scritto nel piano? **Sì, deciso il 10 novembre 2026**: riferimento visivo soltanto, senza punteggio
   (`docs/ROADMAP-v2.md` §8, «PV2-02, B.1 question 2»).
