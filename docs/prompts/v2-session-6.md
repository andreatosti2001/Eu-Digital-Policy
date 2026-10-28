<!--
Provenance: the author's roadmap after v2 Session 5, pasted as the prompt of v2 Session 6 on 27 Oct 2026
and kept here on the author's decision of that day ("§8 + docs/prompts/ (Recommended)";
docs/ROADMAP-v2.md §8, "The scope of v2 Session 6"). The decisions live in that row and in the rows
after it; this file is the instruction text that cites them. Text below the rule is the author's,
in Italian, as pasted. It covers sessions 6–16; only Session 6 is in scope until the author approves
its checkpoint. It is changed only by the author.
-->

---

EU Digital Policy — roadmap after v2 Session 5

Documento operativo per Claude Code
Baseline verificata: main, 27 ottobre 2026
Scopo: proseguire la roadmap v2 senza confondere implementazioni già completate, backlog approvato e desiderata post-v2.

> Questo documento organizza il lavoro futuro. Non autorizza Claude Code a eseguire tutta la roadmap in una sola sessione, a saltare i checkpoint previsti dal brief, né a modificare decisioni approvate senza chiedere all’autore.

0. Baseline: Session 5 è conclusa

La PR #23 è merged in main. Prima di ogni nuovo lavoro, verificare comunque lo stato reale del checkout e non assumere che i numeri riportati qui siano ancora quelli correnti.

Completato in Session 5

• Voce 2.2: eidas2 promosso a strumento coperto, con pagina generata instruments/eidas2/, decisione di scope ed evidenza per lo stato.
• I campi analitici non dimostrati sono rimasti null/“not established”; non vanno riempiti per rendere la pagina apparentemente completa.
• Corrette due descrizioni diventate obsolete dopo la promozione.
• PP-09 aggiornato per citare le verifiche datate disponibili; l’esito resta undecidable/high, perché il gate non effettua una verifica di rete in tempo reale.
• Corretto il calcolo dell’origin e del redirect_uri OIDC per la porta effettiva e per host IPv6 tra parentesi quadre. I controlli Origin, CSRF, state, nonce e PKCE non sono stati indeboliti.
• Otto relazioni sono migrate allo schema v2 {source_id, supports, locator}; nove restano v1. Il controllo generale sulle relazioni v1 resta intenzionalmente differito.

Baseline di qualità riportata alla chiusura della Session 5

Sono valori storici da ricontrollare, non obiettivi da copiare né una garanzia sul checkout corrente:

• validate: 0 errori, 45 elementi non verificati;
• i18n-audit, design-qa, seo-audit: 0 errori e 0 warning nel report della sessione;
• evidence-audit --as-of 2026-10-27: 0 errori, 11 warning;
• freshness --as-of 2026-10-27: 0 difetti, 2 richieste di revisione;
• 25 suite: 1.309 test, 0 fallimenti, 1 test saltato (il test con bind IPv6 ::1 in un ambiente che non supporta il loopback IPv6);
• browser suite: 343 pass, 0 fail, 1 risultato indecidibile (a11y:bound).

Fonte primaria interna per baseline e finding: docs/HANDOVER.md, in particolare il report e la verification checklist di v2 Session 5. Le decisioni di scope sono in docs/ROADMAP-v2.md §8; il contratto tra sessioni è docs/BRIEF-v2.md.

1. Regole vincolanti per ogni sessione futura

Prima di intervenire:

1. Eseguire git status --short --branch, git fetch --all --prune, controllare il branch corrente e git branch -r --no-merged origin/main. Non cancellare, sovrascrivere o includere modifiche dell’autore non pertinenti.
2. Verificare che PR #23 e le decisioni della Session 5 siano presenti sul main usato per il lavoro. Se non lo sono, fermarsi e segnalare la discrepanza.
3. Leggere docs/BRIEF-v2.md, docs/ROADMAP-v2.md §8, il blocco pertinente di docs/HANDOVER.md, docs/V2-DATA-DESIGN.md, docs/AI-SAFE-BOUNDARIES.md e docs/SOURCE-POLICY.md. Leggere inoltre il codice e i test specifici che verranno toccati.
4. Creare/riutilizzare un branch di sessione coerente con le convenzioni del repository. Non lavorare direttamente su main.
5. Prima di aggiungere fatti legali o modificare dati canonici, recuperare e leggere le fonti primarie pertinenti nella sessione corrente. I risultati dei motori di ricerca, gli snippet e la memoria del modello non sono fonti probatorie.
6. Non inventare campi mancanti, date, relazioni o citazioni. Usare null o uno stato esplicito di non verificato quando l’evidenza non basta.
7. Non abbassare gate, validator, test, controlli CSP, CSRF, Origin, OIDC o limiti di pubblicazione per ottenere una suite verde.
8. Rispettare la revisione e l’approvazione esplicita dell’autore nei punti previsti. Registrare le decisioni approvate in docs/ROADMAP-v2.md §8 con le parole dell’autore e aggiornare docs/HANDOVER.md.
9. Per ogni commit che modifica un file pubblicato, mantenere l’evidence requirement verificato da tools/commit-evidence.mjs.
10. Al checkpoint, fornire un report con file modificati, fonti lette, fatti lasciati null, test eseguiti, risultati prima/dopo, limiti e passaggi di verifica manuale. Fermarsi e attendere l’approvazione prima di iniziare la fase successiva.

Questa roadmap non sostituisce il brief e non autorizza la riapertura automatica delle decisioni rinviate.

2. Lavoro ancora nel perimetro di v2

Session 6 — item 2.3: Cyber Solidarity Act

Scope unico: valutare e, se i criteri lo consentono, aggiungere il Cyber Solidarity Act come strumento coperto. Non aggiungere altri strumenti nella stessa sessione.

Passaggi richiesti:

1. Rileggere nel main le regole di inclusione approvate in docs/V2-DATA-DESIGN.md §5 e il gate pagine in js/routes.js (GATE e funzioni correlate).
2. Recuperare e leggere le fonti ufficiali primarie necessarie per identità, stato procedurale, data di valutazione, eventi e obiettivo. Registrare in data/sources.json soltanto documenti effettivamente recuperati e letti.
3. Prima di scrivere in data/, presentare all’autore in un solo blocco la proposta per i campi che richiedono giudizio editoriale, la motivazione d’inclusione, i fatti verificati, i fatti non verificati e i riferimenti alle fonti. Attendere l’approvazione dove richiesta dal brief.
4. Usare la struttura canonica esistente. Le date devono vivere nel timeline canonico, non in copie concorrenti. Non aggiungere un arco a un altro strumento soltanto per superare il gate di pubblicazione.
5. Generare gli artefatti attraverso node tools/_footer.mjs; non modificare a mano pagine che devono essere generate.
6. Dichiarare lo stato delle chiavi di localizzazione interessate (superseded o pending_translation secondo le regole correnti).
7. Rilanciare gli audit e le suite richieste dal brief, compresa la browser suite e tools/commit-evidence.mjs; aprire la nuova pagina in un browser e verificare che non mostri affermazioni più forti dei record.
8. Registrare conteggi e finding nel handover e fermarsi al checkpoint.

Non avanzare all’item 2.4 nella stessa sessione.

Session 7 — item 2.4: European Health Data Space (EHDS)

Applicare lo stesso protocollo di Session 6 a EHDS, ma partire dallo stato effettivo di main e dalle fonti primarie della sessione. Non copiare automaticamente schema, status, relazioni o conclusioni preparate per il Cyber Solidarity Act. Un’eventuale relazione tra strumenti deve avere una base testuale specifica e approvazione nei casi previsti. Chiudere con report e checkpoint, senza iniziare 2.5.

Session 8 — item 2.5: Interoperable Europe Act

Applicare lo stesso protocollo. Non inferire lo scope o gli obblighi dal solo titolo dell’atto. Distinguere esplicitamente identità dello strumento, stato, date, campo di applicazione e rilevanza per il brief. Nessuna relazione viene aggiunta per “completare” la pagina. Chiudere con report e checkpoint, senza iniziare 2.6.

Session 9 — item 2.6: Digital Networks Act

Applicare lo stesso protocollo, prestando particolare attenzione allo stato legislativo effettivo alla data della verifica. Se il regime è ancora in formazione, l’etichetta deve riflettere quello che le fonti primarie stabiliscono in quella data; non presentare una proposta come diritto vigente. Non aggiungere una previsione come se fosse un fatto giuridico. Chiudere con report e checkpoint.

Session 10 — manutenzione frontend e pulizia dei riferimenti pubblici

Questa è una sessione distinta dal lavoro giuridico sugli strumenti. Non modificare il modello dei dati, il brief o il layout complessivo durante questa sessione. I due interventi richiesti sono 1.1 e 1.4.

10.1 — Scrollbar coerenti con il design corrente

• Esaminare css/tokens.css, style.css e gli stili specifici dei contenitori scrollabili. Prima di modificare, individuare le scrollbar già nascoste o personalizzate e spiegare quali superfici riguardano.
• Usare i token esistenti per track, thumb, hover e tema chiaro/scuro; non introdurre una nuova palette o un sistema grafico parallelo.
• Personalizzare solo dove il browser lo supporta. Non tentare di sostituire lo scorrimento nativo con una scrollbar costruita in JavaScript.
• Non nascondere globalmente le scrollbar per ragioni puramente estetiche. Nelle strisce orizzontali, mantenere un segnale visivo che il contenuto continui fuori dalla viewport.
• Verificare tastiera, touch, viewport stretti, zoom, contrasto, entrambi i temi e prefers-reduced-motion. La scrollbar deve restare utilizzabile e distinguibile.
• Non introdurre dipendenze runtime, inline script/style o eccezioni CSP.

10.2 — Riferimenti interni che finiscono nell’interfaccia pubblica

Eseguire prima una ricognizione dei contenuti effettivamente pubblicati e generati. Il problema aperto in Session 5 include almeno:

• gli identificativi clm-eidas2-* mostrati nella status_note di eIDAS 2.0;
• i riferimenti a docs/V2-DATA-DESIGN.md §1.4 resi visibili nelle note delle relazioni mostrate dal box delle interazioni;
• eventuali altri docs/..., riferimenti a commit, identificativi di finding o codici di decisione interni ancora presenti in testi pubblici o pagine generate.

Regola editoriale:

• sostituire i riferimenti interni con una spiegazione comprensibile al lettore e con una fonte primaria quando esiste;
• mantenere i link pubblici al repository quando hanno una funzione di trasparenza intenzionale, ma non usare un percorso interno o un identificativo di lavoro come prova legale;
• non eliminare i riferimenti di provenienza dalle strutture canoniche che servono ai controlli: si ripulisce la presentazione pubblica senza distruggere il tracciamento interno;
• dove una nota non può essere riscritta senza alterare un giudizio legale, fermarsi e chiedere all’autore invece di improvvisare;
• verificare anche le pagine generate, la ricerca, le relazioni, il brief, la metodologia e i metadata SEO; non basta cercare soltanto nei file HTML sorgente.

Il repository GitHub rimane pubblico. Questo lavoro serve a non presentare al visitatore del sito artefatti interni come contenuto editoriale, non a dichiarare privati file che sono pubblici su GitHub.

Checkpoint Session 10

Confrontare prima/dopo per ogni stringa individuata, eseguire node tools/_footer.mjs se sono toccati file generati, rilanciare validate, i18n-audit, design-qa, evidence-audit, freshness, seo-audit, le suite Node e la browser suite. Verificare manualmente scrollbar e testi su desktop/mobile in entrambi i temi. Segnalare esplicitamente gli aspetti non verificati su browser o dispositivi non disponibili.

3. Finding della Session 5 da non trasformare in correzioni silenziose

Questi elementi sono ancora aperti nel report della Session 5. Non sono autorizzati interventi automatici senza fonte, proposta e approvazione dove necessaria.

1. rel-dsa-gdpr-transparency-minimisation: il summary e le provision non corrispondono più interamente alla fonte EDPB riletta. Il significato analitico è dell’autore: proporre una revisione motivata e attendere l’approvazione prima di cambiare summary/provisions.
2. rel-data-omnibus-gdpr: il testo “stalled in Council” non è supportato da una fonte presente sulla relazione e lo stato del Consiglio non è stato riletto in Session 5. Non conservarlo come fatto confermato; prima recuperare la fonte ufficiale aggiornata e presentare proposta.
3. Restano quattro relazioni che si appoggiano solo al brief originale e tre relazioni analitiche senza claim. Restano v1 finché non esiste evidenza adeguata e una decisione autorizzata. Il flip di edge-v1-sources resta differito.
4. La nota di src-ec-apple-meta-dma-2025 attribuisce articoli specifici a un comunicato che, nel testo recuperato, non li nomina. Rileggere la pagina completa o rimuovere/correggere l’attribuzione soltanto dopo aver stabilito cosa supporta la fonte.
5. src-ec-ai-omnibus-in-force ha risposto HTTP 403 e non è stata riletta nella Session 5. Non affermare di averla verificata in quella sessione.
6. Il test OIDC che richiede ::1 non è stato eseguito nel container Session 5 per assenza di loopback IPv6. Verificare l’esito in un runner che lo supporti; non trasformare uno skip in un pass.
7. Il gap R-01 relativo al trigger P2B e gli otto finding di docs/V2-DATA-DESIGN.md §7 appartengono alla Fase 3 secondo la roadmap vigente. Non correggerli dentro alle sessioni 6–10 senza un’esplicita decisione di scope.

Questi finding vanno tenuti visibili nel handover. Non usare la pulizia UI del punto 10.2 come pretesto per cambiare il significato dei dati.

4. Delimitazione: Evidence Navigator

L’Evidence Navigator sarà scritto dall’autore. Claude Code non deve implementarlo, scaffolarlo, generare il codice, aggiungere una pagina, creare un branch dedicato o modificare js/search.js per anticiparlo nell’ambito di questa roadmap. La guida di progettazione e apprendimento è un documento separato.

Per l’eventuale integrazione futura, non duplicare i JSON canonici né inventare nuove fonti di verità. Il Navigator dovrà essere deterministico, senza LLM, API remote, embeddings a consumo o dipendenze runtime, e dovrà rispettare lo stato di verifica delle informazioni. Questi sono vincoli di design futuri, non autorizzazione a implementarlo ora.

5. Passaggio al lavoro post-v2

Non modificare il sito globalmente per il redesign finché gli item attivi e i checkpoint richiesti non sono conclusi. Prima di dichiarare v2 “conclusa”, confrontare la definizione di completamento con docs/ROADMAP-v2.md, incluse le fasi successive e le rispettive condizioni d’ingresso. Non segnare fasi non eseguite come complete: la delimitazione finale del perimetro v2 deve essere una decisione esplicita dell’autore, registrata in §8.

Una volta che l’autore ha esplicitamente aperto il post-v2, seguire quest’ordine.

Post-v2 A — data readiness (gate per dashboard e infografiche)

Prima di costruire visualizzazioni nuove, inventariare i dataset e le metriche che si vorrebbero mostrare. Per ogni metrica candidata documentare:

• domanda a cui risponde e definizione operativa;
• campi e record sorgente, con collegamenti alla fonte;
• formula, denominatore e unità di misura, se applicabili;
• periodo temporale e data “as of”;
• criteri di inclusione/esclusione;
• significato di zero, null, sconosciuto, non applicabile e non verificato;
• limiti di copertura, confrontabilità e aggiornamento;
• livello e stato dell’evidenza;
• test che falliscono quando una proprietà essenziale manca.

Produrre prima un audit e una proposta di contratto delle metriche; non riempire i buchi con valori stimati o generati. Le visualizzazioni sono un gate successivo, non parte del primo audit.

Post-v2 B — raccolta e selezione dei riferimenti open source frontend

Produrre una ricerca documentata di progetti open source realmente consultabili. Non scegliere un template sulla base del solo screenshot o del numero di stelle.

Per ogni candidato registrare almeno: repository e demo, attività/manutenzione, licenza e obblighi di attribuzione, stack, dipendenze runtime e di build, struttura responsive, dark/light theme, accessibilità, qualità di tabelle/grafici, gerarchia editoriale, animazioni, facilità di ricostruzione senza dipendenze, limiti e pattern specifici da studiare.

Valutare ogni progetto con una griglia pubblicata prima della selezione:

|Criterio                                                 |Peso|
|---------------------------------------------------------|---:|
|Adattabilità a un osservatorio giuridico/editoriale      |20% |
|Gerarchia informativa e leggibilità                      |20% |
|Qualità di dashboard, tabelle e visualizzazioni          |20% |
|Responsive, accessibilità e temi                         |15% |
|Possibilità concreta di ricostruzione vanilla HTML/CSS/JS|15% |
|Licenza e manutenzione documentate                       |10% |

Creare una galleria di riferimenti per categorie: homepage editoriale, pagina dello strumento, dashboard, timeline, tabella comparativa, blog/articolo, navigazione e microinterazioni. Kabarza può essere un riferimento visivo esterno per il motion design, non una fonte open source né una licenza di riuso.

Non importare framework, librerie, font remoti, script di terze parti o immagini proprietarie. I progetti open source servono per studiare pattern e, solo se la licenza lo consente, valutare piccoli riusi con attribuzione. La versione di produzione deve rimanere senza dipendenze runtime esterne.

Deliverable da approvare prima del prototyping: matrice dei repository, punteggi motivati, screenshot/riferimenti con note, licenze verificate e tre direzioni grafiche descritte.

Shortlist iniziale da verificare (non è una decisione di adozione)

Questi candidati coprono esigenze diverse; vanno valutati dal vivo e controllati di nuovo al momento della ricerca. Le licenze indicate qui non autorizzano a copiare un progetto intero senza leggere il relativo file LICENSE e le licenze degli asset inclusi.

• PureDashboard — candidato tecnico per dashboard vanilla: dichiara HTML/ES modules, zero dipendenze e nessun build step, con pattern per tabelle, layout, timeline e temi. È molto aderente al vincolo tecnico, ma non va promosso automaticamente a riferimento estetico: valutare la qualità visuale sul demo reale, l’accessibilità e la maturità/manutenzione. Il repository dichiara MIT.
• Tabler — candidato per studiare gerarchia delle dashboard, KPI, tabelle e modalità light/dark. È MIT, ma è costruito su Bootstrap 5 e include un ecosistema di terze parti; usarlo inizialmente come riferimento visuale, senza importarne il runtime. Verificare separatamente le licenze dei componenti inclusi, soprattutto dei grafici.
• GOV.UK Design System / GOV.UK Frontend — riferimento per chiarezza dei contenuti, tabelle, form, messaggi di stato, navigazione e accessibilità. Il codice è MIT salvo indicazioni specifiche; stack e dipendenze vanno valutati prima di qualsiasi riuso. È un riferimento di qualità informativa, non necessariamente il linguaggio grafico finale.
• Simple.css — candidato per studiare una base editoriale leggibile e una tipografia essenziale senza un sistema di componenti pesante. Il repository dichiara MIT. È utile soprattutto per valutare il rapporto tra testo, tabelle, link e gerarchie di pagina, non per risolvere da solo dashboard complesse.
• HTML5 UP — Editorial — riferimento per un layout di lettura/editoriale e una navigazione con sidebar. I template HTML5 UP sono pubblicati con licenza Creative Commons Attribution 3.0; alcuni template includono jQuery o altre librerie. Usarlo solo come riferimento finché non siano verificati gli asset e la licenza specifica del template; attribuzione richiesta per qualsiasi riuso coperto dalla licenza.
• Kabarza — riferimento visuale esterno per ritmo e transizioni, non un progetto open source. Non copiarne il codice, gli asset o le animazioni proprietarie; tradurre soltanto principi di timing, continuità e feedback in implementazioni originali e accessibili.

La ricerca può sostituire o integrare questi candidati se trova progetti migliori. Ogni scelta finale deve essere spiegata con criteri, demo osservata, data della verifica e licenza; popolarità/star count non è un criterio sufficiente.

Post-v2 C — tre prototipi confrontabili, non un redesign immediato

Prototipare tre direzioni:

1. Editoriale: forte gerarchia tipografica e lettura lineare.
2. Policy observatory: navigazione e dati in primo piano.
3. Ibrida: apertura editoriale, pagine strumento e viste analitiche più strutturate.

Ogni direzione deve usare gli stessi contenuti e almeno le stesse quattro viste: homepage, pagina di un regolamento, dashboard/timeline e pagina articolo. Provare desktop e mobile, tema chiaro e scuro, stati vuoti e dati mancanti. Comparare prima di selezionare; non sostituire l’intero frontend prima dell’approvazione.

Conservare il design system attuale come baseline. Non riscrivere insieme struttura dati, modelli di evidenza e rendering. La nuova UI deve consumare i JSON canonici e mantenere i gate di pubblicazione, la CSP e i test esistenti.

Post-v2 D — redesign, infografiche e microanimazioni

Dopo la selezione del prototipo e il superamento del data-readiness gate:

• trasformare i pattern approvati in token e componenti riusabili;
• sviluppare grafici solo dove migliorano una domanda analitica reale;
• fornire tooltip accessibili e una tabella o rappresentazione testuale alternativa;
• mostrare l’assenza di un dato come assenza, non come zero;
• integrare Day/Night toggle e transizioni brevi in un unico sistema di motion;
• rispettare prefers-reduced-motion, tastiera, contrasto e link diretti a pagine/ancore;
• mantenere HTML semantico e nessuna dipendenza di produzione.

Le animazioni del punto 1.3 sono quindi parte del redesign post-v2, non un intervento a sé stante durante v2.

Post-v2 E — blog con SEO per articolo

Progettare il blog come pubblicazione statica, non come una lista caricata soltanto via JavaScript.

Requisiti minimi:

• /blog/ come archivio indicizzabile;
• URL stabile e HTML autonomo per ogni articolo;
• title, description, canonical, Open Graph, data di pubblicazione/aggiornamento, autore;
• dati strutturati BlogPosting/Article coerenti con il contenuto visibile;
• sitemap aggiornata, collegamenti interni utili e RSS se fattibile;
• articoli scritti in un formato semplice e versionato su Git;
• generazione statica tramite toolchain esistente/Node built-in, senza backend obbligatorio e senza dipendenze runtime.

Il blog deve avere un modello di contenuto e un template condiviso; non creare pagine duplicate manualmente senza test che controllino i metadata per ogni slug.

6. Sequenza e stima delle sessioni

Questa stima è un piano operativo indicativo, non una garanzia di completamento. Ogni sessione deve chiudersi con il checkpoint previsto; non accorpare fasi solo per rispettare il conteggio. Se un gate fallisce o emerge un problema sostanziale, fermarsi, documentare e stimare il lavoro aggiuntivo.

|Sessione          |Perimetro                                                               |Condizione di uscita                                                                                                             |
|------------------|------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
|6                 |v2 item 2.3 — Cyber Solidarity Act                                      |Decisione editoriale, evidenze, test e handover completati                                                                       |
|7                 |v2 item 2.4 — European Health Data Space                                |Decisione editoriale, evidenze, test e handover completati                                                                       |
|8                 |v2 item 2.5 — Interoperable Europe Act                                  |Decisione editoriale, evidenze, test e handover completati                                                                       |
|9                 |v2 item 2.6 — Digital Networks Act                                      |Stato giuridico verificato, test e handover completati                                                                           |
|10                |Scrollbar e pulizia dei riferimenti interni esposti pubblicamente       |Diff circoscritta, audit e verifiche manuali completati                                                                          |
|11 (se necessaria)|Gate finale di chiusura v2                                              |Confronto esplicito con `docs/ROADMAP-v2.md`, finding aperti classificati e decisione dell’autore registrata in §8               |
|12                |Post-v2 A+B: data readiness e ricerca/selezione dei riferimenti frontend|Audit metriche e matrice comparativa documentati; nessun redesign avviato senza approvazione                                     |
|13                |Post-v2 C: tre prototipi confrontabili                                  |Stesse viste/contenuti confrontati su desktop/mobile e light/dark; direzione scelta dall’autore                                  |
|14–15             |Post-v2 D: redesign e visualizzazioni                                   |Implementazione per incrementi, con test e approvazioni; la seconda sessione è contingente alla complessità e agli esiti dei test|
|16                |Post-v2 E: blog statico e SEO per articolo                              |Archivio e pagine articolo indicizzabili, metadata coerenti, sitemap e controlli automatici                                      |

Conteggio realistico

• Per chiudere la v2: 5 sessioni previste (6–10), più una sessione 11 se il controllo finale richiede lavoro o una decisione separata.
• Per il post-v2 descritto qui: circa 4–5 sessioni (12–16), perché il redesign può richiedere una o due sessioni.
• Evidence Navigator: escluso dal conteggio e da questo piano di implementazione; lo sviluppa l’autore in parallelo o in un percorso separato.

Il conteggio non implica che la v2 sia conclusa automaticamente al termine della sessione 10. La chiusura richiede il confronto con i gate effettivi di docs/BRIEF-v2.md e docs/ROADMAP-v2.md, la classificazione dei finding ancora aperti e una decisione esplicita dell’autore. Non dichiarare completate fasi non eseguite.

Ordine complessivo: v2 item 2.3–2.6 → manutenzione mirata del frontend → gate di chiusura v2 → data readiness → selezione frontend → prototipi → redesign/visualizzazioni → blog SEO.

Non misurare il successo dal numero di file o schermate aggiunti. Misurarlo dal miglioramento della qualità legale, dalla provenienza verificabile, dall’assenza di regressioni e dalla possibilità del lettore di capire cosa il sistema sa e cosa non sa.
