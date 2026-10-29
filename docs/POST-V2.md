# POST-V2 — il piano successivo alla v2, non ancora aperto

**Stato:** non aperto. Nessuna sessione è stata avviata e nessuna decisione è stata presa.
**Fonte:** `docs/prompts/v2-session-6.md`, sezione «Passaggio al lavoro post-v2» (righe 149–270). È il
roadmap scritto dall'autore, incollato come prompt della sessione 6 il 27 ottobre 2026 e conservato per sua
decisione di quel giorno. Questo documento lo riporta senza cambiarne il contenuto, e aggiunge solo le
condizioni di apertura e le domande che l'autore deve decidere.
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

## 4. Ciò che il piano non stabilisce

- **Una stima di sessioni.** Il piano diceva «circa 4–5 sessioni», ma con una numerazione che non è più quella
  attuale. La stima va rifatta quando il post-v2 si apre.
- **Un ordine di pubblicazione di E rispetto al resto.**
- **Che il redesign sia giusto.** La direzione la sceglie l'autore dopo il confronto dei prototipi.
- **Alcuna licenza o alcun riuso.** Ogni scelta richiede la verifica della licenza al momento della scelta.

## 5. Domande aperte per l'autore

1. Il post-v2 si apre, e quando? (`docs/V2-CLOSURE.md`, domanda 6.)
2. La parte A (data readiness) può partire prima della chiusura formale della v2, perché non tocca il contenuto?
3. Il gate di B richiede la griglia approvata prima della ricerca, come scritto nel piano?
4. La stima di sessioni va rifatta: chi la fa, e in quale sessione?
5. Il Kabarza resta un riferimento visivo esterno, come scritto nel piano?
