# POST-V2 — il piano successivo alla v2, non ancora aperto

**Stato:** non aperto. Nessuna sessione è stata avviata e nessuna decisione è stata presa.
**Fonte:** `docs/prompts/v2-session-6.md`, sezione «Passaggio al lavoro post-v2» (righe 149–270). È il
roadmap scritto dall'autore, incollato come prompt della sessione 6 il 27 ottobre 2026 e conservato per sua
decisione di quel giorno. Questo documento lo riporta senza cambiarne il contenuto (§3), e aggiunge solo le
condizioni di apertura, la stima delle sessioni (§4, aggiornata il 4 novembre 2026) e le domande che l'autore
deve decidere. **Dall'11 novembre 2026 §3 porta anche due sottosezioni aggiunte, una in C e una in D, per il
Regulatory Network Explorer** (vedi l'ultimo aggiornamento qui sotto): il testo dell'autore resta com'era, e
ogni aggiunta è marcata come tale.
**Aggiornamento del 4 novembre 2026:** la stima delle sessioni è stata rifatta dall'autore (§4: numerazione
PV2-01…PV2-12 e previsione di 11 sessioni nello scenario raccomandato). A quella data le parti A–E (§3) non erano
cambiate (ma vedi l'aggiornamento dell'11 novembre 2026).
La stima è una **previsione**, non una durata garantita, e non apre il post-v2: lo stato resta «non aperto».
**Aggiornamento del 5 novembre 2026** (`docs/ROADMAP-v2.md` §8, v2 Session 25, 25.5 domande 1–4): il post-v2 è diviso in
due stadi dell'architettura delle sessioni (`docs/SESSION-ARCHITECTURE.md`). **A, B e C (PV2-01…05) sono lo Stadio 2,
prima della Fase 5**, e si aprono sulla parola dell'autore senza che la v2 sia chiusa; **D, E e il final QA (PV2-06…12)
sono lo Stadio 4**, dopo la Fase 5 e dopo la chiusura della v2, e mantengono le condizioni del §2. Le parti A–E (§3)
non erano cambiate a quella data. Lo stato resta «non aperto» finché l'autore non apre lo Stadio 2 (gate G1).
**Aggiornamento dell'11 novembre 2026** (richiesta dell'autore, registrata in `docs/ROADMAP-v2.md` §8): una nuova
funzionalità, il **Regulatory Network Explorer**, entra nel piano **dentro** i blocchi esistenti, senza un percorso
parallelo. Si progetta e si confronta in C (§3 C, sottosezione aggiunta; sessioni PV2-04 e PV2-05) e si implementa in D
(§3 D, sottosezione aggiunta; sessione PV2-08). **Cambiano quindi due righe della tabella di §4.1 (PV2-05, PV2-08) e il
commento di §4.2.** Non cambiano: il testo originale dell'autore nelle parti A–E, la sequenza delle sessioni, gli
stadi e i gate (G1…G4), le condizioni del §2, lo stato «non aperto». **La stima di 11 sessioni è anteriore a questa
richiesta e non è stata rifatta** (§4.2, «Il Regulatory Network Explorer e la stima»).
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

#### C — Aggiunta dell'11 novembre 2026: il Regulatory Network Explorer nei concept Policy observatory e Ibrido

*Questa sottosezione non fa parte del testo originale dell'autore: è una specifica aggiunta su sua richiesta
(`docs/ROADMAP-v2.md` §8, riga dell'11 novembre 2026). Il paragrafo di C sopra resta com'era.*

**Che cosa è.** Uno strumento interattivo di esplorazione della rete normativa: gli strumenti giuridici del sito come
nodi, le relazioni giuridiche **già registrate** come archi. Non una figura statica delle relazioni tra regolamenti. Il
livello di interattività e la presentazione della rete si ispirano all'esperienza di
[Knwler](https://github.com/Orbifold/knwler), **come riferimento d'uso e non come progetto da adottare**: non se ne
copiano codice, asset o animazioni, e vale la posizione dei riferimenti visivi di `docs/FRONTEND-REFERENCES.md` §9
(descritti, non punteggiati, niente copiato; gli screenshot restano fuori dal repository).
*Che cosa si sa di Knwler, all'11 novembre 2026* (la pagina del repository, letta quel giorno, e una foto dello schermo
dell'autore dell'esplorazione di un corpus di diritto civile belga): è uno strumento **Python** che **estrae** con un LLM
entità e relazioni dai documenti, ne raggruppa i nodi con l'algoritmo di Louvain e produce un report HTML autonomo, con
interruttore chiaro/scuro; il README porta il distintivo MIT, **ma il testo del file LICENSE non è stato letto**. La foto mostra un grafo di migliaia di
nodi, un pannello con le schede «Properties» e «Relations», i comandi «Group by community», «Layout selected group» e
«Re-layout graph» e una legenda delle comunità. **Non si sa**, perché la pagina non lo dice, con quale libreria disegni il
grafo né con quale algoritmo lo disponga. **Due differenze da tenere ferme:** Knwler *genera* le relazioni con un LLM e
questo sito le *registra* (§3 D: nessun LLM, nessuna relazione inventata); e il suo grafo ha migliaia di nodi, il
nostro poche decine, per cui si prende l'interazione e non la scala. Il riuso di qualsiasi cosa, se mai, richiede la licenza
letta al momento della scelta (§5).

**Dove sta.** È una **modalità della vista analitica già prevista** — quella delle quattro viste di C che è «dashboard o
timeline», qualunque delle due la sessione PV2-03 fissi al suo primo checkpoint (C.1) — **solo nei concept Policy
observatory e Ibrido**. Non è una quarta direzione grafica, non è una quinta vista (resta valido «le quattro viste di C
non cambiano», `docs/ROADMAP-v2.md` §8, 25.5 domanda 3), non è un quarto prototipo e non è un progetto separato dal
redesign. Il concept Editoriale non lo comprende. **Chi lo costruisce:** l'istanza Policy observatory nella sessione di
quella direzione (PV2-04), l'istanza Ibrida in PV2-05, che ne fa anche il confronto (§4.1).

**Che cosa il concept deve mostrare** (l'esperienza da progettare; i vincoli sui dati sono in D e valgono già qui):

- un **canvas centrale** con nodi e connessioni; i **nodi**, selezionabili, sono gli strumenti normativi;
- gli **archi** sono relazioni giuridiche registrate, **distinte per tipologia con più di un segnale visivo** (non il solo
  colore) e con la **direzione** dove il record ne ha una;
- **zoom e pan**; **ricerca** degli strumenti; **filtri per tipologia di relazione**;
- la possibilità di **mettere a fuoco le connessioni dirette** di un nodo (il suo vicinato) e di tornare alla vista intera;
- un **pannello laterale contestuale** che si aggiorna alla selezione di un nodo o di un arco. Per un **nodo**: le
  informazioni essenziali e il collegamento alla sua pagina. Per un **arco**: tipologia e direzione; sintesi; disposizioni
  interessate; claims e fonti associate, **quando disponibili**; informazioni sulla verifica e sulla provenienza;
- sul modello dell'esplorazione di Knwler, per scelta dell'autore dell'11 novembre 2026: un pannello **a schede**
  (le proprietà dello strumento o della relazione separate dalle sue relazioni); un comando che **rimette in ordine il
  layout**; una **legenda sempre visibile** delle tipologie di relazione, accanto al canvas;
- un eventuale **raggruppamento dei nodi, solo da campi già presenti nei record** (per esempio `scope_class` o
  `brief_part`, quest'ultimo assente su 24 strumenti di 39, che andrebbero in un gruppo «non assegnato»), **mai da un
  algoritmo di rilevamento di comunità**: un raggruppamento calcolato sarebbe un'inferenza, non una relazione registrata.
  Quali campi e se sia una modalità selezionabile lo propongono i concept, e la scelta è dell'autore;
- uno **stato per ogni assenza**: una relazione senza claims, senza disposizioni o senza dichiarazione di verifica si
  mostra come «non registrata», mai come vuota in silenzio e mai come «verificata» o «nessuna».

**Che cosa si confronta.** I due concept rappresentano **gli stessi dati** e offrono **le stesse interazioni essenziali**:
ciò che si confronta è la **gerarchia informativa e la presentazione visiva**, non le funzioni. Il prototipo **non è uno
screenshot decorativo né un'immagine**: è interattivo, perché si giudica il modo in cui funzionerebbe l'interazione.
Come ogni prototipo di C, è costruito in HTML, CSS e moduli ES vanilla in una cartella non pubblicata, del tipo deciso in §8
(«PV2-02, B.4 question 2»; il nome lo conferma PV2-03), **legge in posto i JSON canonici** e non ne copia né ne ricopia i dati in una seconda forma:
non si disegna una rete su dati inventati per il prototipo. Mostra anche come si risolvono l'**alternativa accessibile**
(elenco o tabella), la **tastiera**, il **mobile** — che non è il canvas desktop rimpicciolito — e i **due temi**:
l'elenco dei requisiti è in D, e qui si decide come ciascun concept li soddisfa, non se li soddisfa. **Nel confronto a tre**
(deciso dall'autore l'11 novembre 2026, §6 domanda 7) l'Editoriale non ha l'Explorer ma **mostra le stesse relazioni come
tabella non interattiva** nella sua vista analitica, così che le tre direzioni portino gli stessi contenuti; l'esperienza
interattiva si confronta tra i due concept che la comprendono. La tabella è la stessa che l'alternativa accessibile
richiede (D), non un'altra rappresentazione dei dati.

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

#### D — Aggiunta dell'11 novembre 2026: l'implementazione del Regulatory Network Explorer

*Questa sottosezione non fa parte del testo originale dell'autore: è una specifica aggiunta su sua richiesta
(`docs/ROADMAP-v2.md` §8, riga dell'11 novembre 2026). I punti di D sopra restano com'erano. L'idea e l'esperienza
d'uso sono in C (sottosezione aggiunta); qui stanno il perimetro, i dati e i vincoli.*

**Quando e che cosa.** Nella sessione dedicata alle visualizzazioni, **PV2-08** (§4.1), quindi nello Stadio 4: dopo la
selezione del prototipo (PV2-05, gate G2), dopo la chiusura della v2 (gate G4, §2) e dopo il superamento del gate di data
readiness (A). Si implementa **soltanto il concept selezionato**, nel **perimetro circoscritto** descritto qui. Se
quel perimetro non è compatibile con una sessione, non si taglia: §4.2.

**Perimetro funzionale.**

- navigazione libera nel grafo con **zoom e pan**;
- **ricerca** degli strumenti normativi;
- **filtri** per tipologia di relazione;
- **selezione** di nodi e di archi;
- **evidenziazione** delle connessioni dirette e del vicinato del nodo selezionato;
- un **pannello laterale** con le informazioni contestuali del nodo o dell'arco selezionato;
- **collegamenti alle pagine normative già presenti** nel sito;
- una **legenda** per interpretare correttamente le connessioni.

Gli elementi in più che C aggiunge a questa lista (pannello a schede, riordino del layout, raggruppamento da campi dei
record) entrano nel perimetro di PV2-08 **solo se il concept selezionato li comprende**, e contano nella stima di §4.2.

**Modello dei dati.** La fonte primaria è `data/instruments.json`. I **nodi** sono i record di `instruments`; gli **archi**
sono i record dell'array `relationships`. Nodi, archi e conteggi si **derivano dai JSON canonici** a ogni rendering, per il
percorso di caricamento che il sito ha già (`js/data.js` è l'unico modulo che legge un dataset). **Nessuna seconda
rappresentazione**: non si crea un file di grafo, uno schema parallelo, né coordinate o conteggi memorizzati in `data/`
(la posizione dei nodi si calcola al rendering). I conteggi di 39 strumenti e 40 relazioni, misurati l'11 novembre
2026 su `main` `124f600`, sono **un riferimento, non un valore da scrivere nel codice**.

**Nella prima versione i nodi sono soltanto gli strumenti.** Claims, fonti, disposizioni, istituzioni, enforcement e ogni
altro soggetto **non diventano nodi** e non si aggiungono archi per collegarli. Si raggiungono dai pannelli, quando sono
collegati al record selezionato. È una scelta intenzionale dell'autore: un grafo leggibile e realmente esplorabile, non una
rete ingestibile con ogni entità del progetto.

**Il record non va forzato.** Ciò che segue è misurato l'11 novembre 2026 sui dati (`main` `124f600`); l'implementazione lo
rimisura, perché i dati si muovono.

- **Tipologia e direzione rispettano il dato.** La tipologia è il campo `kind` (vocabolario `relationship_kind` di
  `data/taxonomy.json`: etichette e note vengono da lì, non si riscrivono; 12 termini, 10 in uso). La direzione è
  `from` → `to`, e **solo** dove `symmetric` è `false`: un record con `symmetric: true` (9 di 40) **non ha una
  direzione** e non si disegna con una freccia. La direzione non si deduce dalla tipologia: una relazione `complement`
  ha `symmetric: false`. Non si inventa una connessione: nessun arco da una disposizione, un claim o una fonte condivisi,
  nessun arco transitivo.
- **Un record non è l'altro.** I campi `amends`, `amended_by` e `repeals` che 9 strumenti portano per conto proprio
  risultano tutti anche in `relationships` (che ne ha di più: per esempio le modifiche proposte dagli omnibus): l'Explorer
  legge **solo** `relationships` e non fonde le due rappresentazioni, perché sarebbe una seconda sede dello stesso fatto.
- **I campi del pannello sono facoltativi, e l'assenza ha un testo suo.** `claims` è presente su 11 relazioni di 40,
  `provisions` su 12; `sources` su tutte, ma 8 relazioni ne hanno 11 come **semplice identificativo**, senza `supports` né
  `locator` (gli altri 37 riferimenti li hanno); `requires_verification` e `verification_note` sono presenti su 31 relazioni, con
  `requires_verification` **vero su nessuna**, e **assenti su 9**. Un campo assente è «non registrato»: non è «verificato»,
  non è «nessuna fonte» e non è zero (`AGENTS.md`, regole 2 e 5).
- **Nessuna relazione registrata non è nessuna relazione.** 8 strumenti di 39 non compaiono in alcuna relazione:
  restano cercabili e visibili, con la dicitura «nessuna relazione registrata», mai «nessuna relazione».
- **Più archi tra due strumenti.** `ai-act` e `gdpr` hanno due relazioni distinte: sono due archi, selezionabili
  separatamente, non uno.
- **Gli strumenti non sono tutti coperti nello stesso modo.** Dei 39, 16 sono *covered*, 12 *mapped*, 5 *watched* e 6
  *excluded* secondo `coverage()` di `js/routes.js`; 9 relazioni toccano uno strumento *excluded* o *watched*. Uno
  strumento che il sito nomina e deliberatamente non analizza si mostra come tale, **non come uno strumento che il sito
  copre**.
- **I collegamenti** si risolvono con `instrumentHref()` e le altre funzioni di `js/routes.js` (una sola sede
  dell'URL scheme; non si costruisce un URL a mano). Solo 17 strumenti di 39 hanno una pagina propria: per gli altri la
  funzione porta alla route dell'applicazione.
- **Le cifre mostrate.** Un conteggio che l'Explorer mostra (strumenti, relazioni per tipologia, relazioni di uno
  strumento) esce da **una sola funzione** che importa le derivazioni del sito, e «nessuna registrata» è uno stato, non lo
  zero (`docs/DATA-READINESS.md` §6, MC-2, MC-6). Una scheda di metrica propria per l'Explorer non serve (§6, domanda 8, deciso).

**Vincoli architetturali.**

- HTML, CSS e JavaScript vanilla; **nessun framework frontend**; **nessuna dipendenza esterna a runtime**
  (`ALLOWED_RUNTIME_ORIGINS` resta vuoto, `tools/thirdparty.mjs`); **nessun backend Python**; **nessun database a
  grafo**; **nessun sistema LLM** che generi o proponga relazioni; **nessun nuovo schema** parallelo ai dataset canonici.
- **SVG nativo** è il candidato preferito per nodi e archi. La scelta definitiva (rispetto a un altro mezzo di disegno) si
  **motiva durante l'implementazione**, con l'accessibilità e la prestazione misurate sui dati reali, non presupposte.
- **Riuso di `js/routes.js`** per gli URL delle pagine normative, e delle funzioni che il sito ha già per etichette,
  indici e derivazioni.
- **Distinto dal grafo del glossario.** `js/glossary-graph.js` non si sostituisce, non si riscrive e non cambia
  comportamento; l'Explorer è un modulo a parte.
- Si mantengono la Content-Security-Policy, i gate di pubblicazione e i test esistenti; nulla si pubblica senza
  passare dove passa il resto del sito (`tools/pages-artifact.mjs`, il gate di rilascio).

**Accessibilità e responsive** — requisiti di progettazione (già per i prototipi di C) e di implementazione:

- un'**alternativa accessibile** al grafo, in forma di elenco o di tabella: stessi dati, stessi filtri, stessa selezione;
- **navigazione da tastiera** completa (focus visibile, ordine ragionevole, uscita dal canvas senza trappole);
- **etichette comprensibili** per nodi e relazioni (nome dello strumento, tipologia e direzione a parole, non solo la
  forma);
- la tipologia delle relazioni **non affidata al solo colore** (tratto, marcatore, etichetta);
- **schermi piccoli**: la versione mobile è un'esperienza utilizzabile — non il canvas desktop ridotto — e come tale è
  progettata e verificata;
- rispetto di **`prefers-reduced-motion`**: l'Explorer funziona identico senza animazione, e il movimento non porta
  informazione che solo lui porta;
- **contrasto adeguato** nei temi chiaro e scuro, misurato.

**Qualità e verifica.** I controlli di qualità, accessibilità e verifica **non si comprimono** per far stare il lavoro nel
conteggio originario di §4: i quattro validatori, la suite del browser dove si applica e le prove proprie dell'Explorer,
che devono **fallire quando una proprietà essenziale manca** (per esempio: ogni arco e ogni direzione mostrati
corrispondono a un record di `relationships`; i conteggi sono quelli dei JSON; un arco simmetrico non ha freccia; un
campo assente non si legge come presente).

**Fuori perimetro.** Nodi diversi dagli strumenti; la modifica di un dataset canonico; nuove relazioni o claim; l'estrazione
automatica o con un LLM; un'estensione generale del progetto di knowledge graph; l'Evidence Navigator (escluso da questo
piano, §4.2).

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
| PV2-05 | C — Prototipo Ibrido e selezione | Terza direzione, confronto omogeneo dei tre prototipi e decisione esplicita dell'autore. **Comprende anche il confronto dei concept del Regulatory Network Explorer** (Policy observatory e Ibrido; §3 C, aggiunta dell'11 novembre 2026), in modo che l'esperienza proposta si possa valutare |
| PV2-06 | D — Design system e struttura | Token, componenti riusabili, layout e pattern approvati; nessuna modifica ai dati canonici non autorizzata |
| PV2-07 | D — Redesign delle viste | Implementazione incrementale delle pagine principali e della navigazione sulla base del prototipo selezionato |
| PV2-08 | D — Infografiche e visualizzazioni | Grafici, tooltip e alternative testuali fondati sulle metriche approvate in A. **Comprende l'implementazione circoscritta del Regulatory Network Explorer** sul concept selezionato (§3 D, aggiunta dell'11 novembre 2026), con la stima del suo lavoro effettivo a inizio sessione (§4.2) |
| PV2-09 | D — Motion, temi e accessibilità | Passaggio giorno/notte, microanimazioni, responsive, tastiera, contrasto e `prefers-reduced-motion`; regressioni mirate |
| PV2-10 | E — Blog statico e SEO | Archivio e pagine articolo autonomamente indicizzabili, template, metadati, sitemap e controlli automatici |
| PV2-11 | Final QA e rilascio | Verifica integrata di contenuti, rendering, accessibilità, SEO, CSP, prestazioni e regressioni; checklist di rilascio |
| PV2-12 | Buffer eventuale | Correzioni sostanziali emerse dai gate, che non possono essere chiuse nel perimetro assegnato |

*Nota dell'11 novembre 2026.* Le righe PV2-05 e PV2-08 sopra sono cambiate per il Regulatory Network Explorer; le altre
no. **La riga di PV2-04 non è cambiata, e il suo perimetro sì**: l'istanza Policy observatory dell'Explorer è una modalità
della vista analitica di quella direzione (§3 C, aggiunta) e si costruisce in quella sessione, sotto la sua condizione di
uscita («gli stessi contenuti e criteri di confronto»). Il peso di PV2-04 è nella stima, §4.2.

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

**Il Regulatory Network Explorer e la stima (aggiunta dell'11 novembre 2026).** *Le 11 sessioni dello scenario raccomandato
e la ripartizione qui sopra sono anteriori alla richiesta dell'Explorer e **non sono state rifatte**.* La funzionalità
non è priva di impatto sul lavoro previsto, e questo documento non finge che lo sia; ma **non è stata misurata**, e una cifra
scritta adesso sarebbe inventata. Quello che si registra è dove l'impatto cade e chi lo misura:

- **C.** L'Explorer aggiunge a PV2-04 e a PV2-05 una vista interattiva ciascuna (l'istanza Policy observatory e quella
  Ibrida) e, in PV2-05, il confronto dei concept. **PV2-05 deve poter valutare l'esperienza proposta**: un'immagine non
  basta (§3 C). Resta il vincolo di questa sezione, e del blocco C: stessi contenuti e stesse condizioni per i prototipi.
  Se il lavoro non sta nel perimetro di una sessione, **lo si dice al checkpoint e si decide**; non si riducono la
  tastiera, il mobile, il contrasto o l'alternativa accessibile per farcelo stare.
- **D.** **PV2-08 deve stimare il lavoro effettivo di implementazione come suo primo passo**, con il concept selezionato in
  mano e prima di costruire: il solo momento in cui la stima ha qualcosa da misurare. PV2-08 porta già le visualizzazioni
  fondate sulle metriche di A e la scrittura del contratto delle metriche («D (PV2-08) writes it»,
  `docs/DATA-READINESS.md` §6), e D eredita ciò che la data readiness ha trovato (§7 dello stesso documento):
  **non si presume che l'Explorer ci stia in più**.
- **Se il perimetro non è compatibile con una sola sessione PV2-08**, si propone una **sessione aggiuntiva** e si
  **aggiorna questa stima**: se ne passa da 11 a 12 nello scenario raccomandato, e la ripartizione e il conteggio degli
  scenari si rifanno di conseguenza. Il numero e il posto della sessione aggiuntiva nella sequenza sono dell'autore.
- **I controlli di qualità, accessibilità e verifica non si comprimono** per rispettare il conteggio originario. Il numero
  cede, non i controlli.
- **L'ampliamento della stima, se serve, si sottopone alla decisione dell'autore** prima di qualunque sessione che lo
  presupponga: non si assorbe in silenzio nel buffer (PV2-12) né nello scenario conservativo.

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
- **Che il Regulatory Network Explorer stia nel perimetro di PV2-04, PV2-05 o PV2-08, né quanto lavoro sia.** È una
  specifica, non una misura (§4.2). Né che l'esperienza di Knwler si possa riprodurre con i dati e i vincoli di questo
  sito: lo dice il confronto dei prototipi, e la scelta è dell'autore.
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

**Aggiunte l'11 novembre 2026, per il Regulatory Network Explorer (§3 C e D).** Le domande 6–9 sono state decise dall'autore nella stessa giornata (sotto); questa aggiunta non ne decide altre:

6. ~~La stima: il perimetro dell'Explorer sta in una sessione PV2-08?~~ **Deciso dall'autore l'11 novembre 2026: lo decide
   PV2-08 a inizio sessione**, con il concept in mano (§4.2). Nessuna sessione aggiuntiva è pianificata adesso e nessuna
   cifra nuova è scritta; se PV2-08 trova che non basta, la sessione aggiuntiva, il suo posto nella sequenza e la stima nuova
   tornano all'autore, prima che una sessione li presupponga. Lo stesso per il peso aggiunto a PV2-04 e PV2-05.
7. ~~Il confronto a tre.~~ **Deciso dall'autore l'11 novembre 2026: l'Editoriale mostra le relazioni come tabella non
   interattiva** (§3 C); l'Explorer interattivo si confronta tra Policy observatory e Ibrido. La riga di PV2-04 non è
   modificata. **Conseguenza da portare:** la tabella dell'Editoriale è un lavoro di PV2-03, il cui prompt
   (`docs/prompts/v2-pv2-03-prototype-editorial.md`) non la menziona e non è stato modificato.
8. ~~La data readiness: serve una scheda per le relazioni?~~ **Deciso dall'autore l'11 novembre 2026: no.** Le cifre che
   l'Explorer mostra soddisfano il contratto di `docs/DATA-READINESS.md` §6 così com'è (una sola funzione, nessuno zero al
   posto di «non registrato») e PV2-01 non si riapre.
9. ~~Il riferimento a Knwler: lo si apre o si lavora dalla descrizione dell'autore?~~ **Aperto e letto l'11 novembre 2026,
   su scelta dell'autore** (§3 C: che cosa si sa e che cosa no; il testo del file LICENSE resta non letto). **Il file LICENSE non si legge
   adesso** (deciso l'11 novembre 2026): non si riusa nulla, e la licenza si legge solo se un giorno si decide un riuso
   (§5). Resta aperto per i concept soltanto quali campi dei record raggruppano i nodi, se li raggruppano (§3 C).
