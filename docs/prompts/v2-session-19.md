<!--
Provenance: the prompt of v2 Session 19, drafted on 3 Nov 2026 at the end of v2 Session 18, on the author's request
("did you redact session 19's prompt already? if not, integrate this:", followed by the request quoted verbatim below,
under «La richiesta dell'autore»). Its scope was put to the author in three questions before drafting, answered: "Site
name only (Recommended)"; "Homepage full, subpages @id only (Recommended)"; "New branch after #53 merges
(Recommended)". Those answers are recorded in docs/HANDOVER.md's branch register for this prompt, not in §8: a
session's scope is recorded in §8 by the session itself, in the author's words, as its first write. The starting state
was measured on 3 Nov 2026 on Session 18's tree (`claude/v2-session-18-maintenance` at `16bc7e9`, PR #53) and on the
live site. The decisions live in §8 and nowhere else; this file is the instruction text. Written in Italian, as the
author's session prompts are. The author may change it before use.
-->

SESSION 19 — Sessione di manutenzione: il nome del sito nei risultati di ricerca ("EU Digital Policy"), per EU Digital Policy v2.0

## Prima di iniziare

Esegui `git status --short --branch`, `git fetch --all --prune` e `git branch -a`. Poi
`git rev-parse --is-shallow-repository`: se risponde `true`, esegui `git fetch --unshallow` prima di qualunque suite.

Verifica che `main` contenga la sessione 18 e questo prompt:
- `docs/ROADMAP-v2.md` §8 ha la riga «The final checkpoint of v2 Session 18 = item 18.2», approvata;
- `docs/prompts/v2-session-19.md` esiste.

Se manca qualcosa, fermati e segnalalo.

**Come prima scrittura della sessione**, registra in §8 la riga «The scope of v2 Session 19» con le parole con cui
l'autore avvia questa sessione; se il prompt arriva senza parole dell'autore, chiediglielo con lo strumento di domande.
Senza quella riga non si scrive nulla, nemmeno in `docs/`.

Esegui `git branch -r --no-merged origin/main` e segnala ogni branch che non sia tuo né nel registro di
`docs/HANDOVER.md`. Atteso: `origin/scout/digest-digest-2026-11-02T16-04-07Z` (nel registro, lasciato aperto per
decisione dell'autore), e il branch di questo prompt se la sua PR non è ancora unita.

Lavora sul branch assegnato dall'ambiente o, se non ce n'è uno, su `claude/v2-session-19-site-name`. Non lavorare su
`main`.

Leggi, in quest'ordine, e trattali come vincolanti:
1. `docs/BRIEF-v2.md`, in particolare «Cosa NON fare».
2. `docs/SEO-OPERATIONS.md` e `docs/DISCOVERABILITY-STRATEGY.md`: il modello canonico, il gate di indicizzabilità e ciò
   che solo il proprietario può fare in Search Console.
3. `tools/seo.mjs` (`SITE`, `TOP_PAGES`, la costruzione del JSON-LD alle righe ~489–523) e `tools/seo-audit.mjs` (riga
   151, `og:site_name`; righe 333–334, il nodo WebSite su ogni pagina).
4. `docs/HANDOVER.md`: il rapporto della sessione 18.
5. `AGENTS.md`, «Known hazards»: la rigenerazione con `tools/_footer.mjs`, lo script inline e la CSP, il trailer
   `Evidence:`, le traduzioni superate.
6. `docs/AUTONOMY-POLICY.md`: ogni voce di questa sessione che cambia una pagina, un generatore o un controllo è di
   classe C — si prepara, si mostra, l'autore approva.

Se ritieni che una decisione del brief, della roadmap o di §8 vada rivista, segnalalo esplicitamente e attendi
conferma. Non reinterpretare in silenzio.

## La richiesta dell'autore (3 novembre 2026, testuale)

> Nei risultati di Google il mio sito appare come "EU Digital Policy —" con sotto "eudigitalpolicy.eu". Voglio che il
> nome del sito mostrato sia "EU Digital Policy" (maiuscole esatte), senza il trattino finale e senza che venga usato il
> dominio al posto del nome.
>
> Fai queste modifiche nel repo:
>
> 1. Dati strutturati WebSite (JSON-LD) nella homepage, dentro <head> di index:
>    - @type: WebSite
>    - name: "EU Digital Policy"
>    - alternateName: ["EUDigitalPolicy", "eudigitalpolicy.eu"]
>    - url: "https://eudigitalpolicy.eu/" (con slash finale, URL canonico della homepage)
>    Il JSON-LD deve stare SOLO nella homepage, non nelle sottopagine.
>
> 2. Tag <title> della homepage: deve essere coerente con il nome del sito, ad esempio "EU Digital Policy" oppure "EU
>    Digital Policy | [breve descrizione]". Elimina trattini o separatori finali penzolanti (il "—" attuale a fine
>    titolo). Controlla anche che il template dei titoli delle altre pagine usi un formato uniforme tipo "Titolo pagina |
>    EU Digital Policy".
>
> 3. Meta tag coerenti:
>    - <meta property="og:site_name" content="EU Digital Policy">
>    - <link rel="canonical" href="https://eudigitalpolicy.eu/"> nella homepage
>    - <meta name="application-name" content="EU Digital Policy">
>
> 4. Controlli di coerenza:
>    - Verifica che "EU Digital Policy" sia scritto identico ovunque (header, footer, title, og:site_name, JSON-LD).
>      Niente varianti come "Eu Digital Policy" o "EUDigitalPolicy" nel nome principale.
>    - Verifica che http, www e non-www facciano redirect 301 verso https://eudigitalpolicy.eu/ (se la configurazione è
>      nel repo, sistemala).
>    - Assicurati che robots.txt e sitemap.xml esistano e puntino all'URL canonico.
>
> 5. Valida il JSON-LD (sintassi corretta) e fammi un riepilogo dei file modificati. Fai commit in un'unica branch e
>    dimmi esplicitamente se serve fare merge su main.

Prima di questo prompt l'autore ha deciso (le tre risposte nel registro di `docs/HANDOVER.md`): **solo il nome del sito
in questa sessione**; **il nodo WebSite completo solo nella homepage, e nelle sottopagine solo il riferimento per
`@id`** come proposta da portare alla domanda; **la Fase 4 non è in questa sessione**.

## Obiettivo della sessione

**Una sessione di manutenzione con un checkpoint.** 19.1: il nome del sito, come la richiesta lo chiede, dove l'albero
non lo fa già. Ogni testo che un lettore o un motore di ricerca vede e che cambia si mostra all'autore **prima e dopo,
parola per parola**, e si scrive solo dopo la sua risposta, registrata in §8 e committata subito.

## Lo stato di partenza

Misurato il 3 novembre 2026 sull'albero della sessione 18 (`16bc7e9`, PR #53) e sul sito pubblicato. **Rimisura
tutto** su `main` dopo l'unione di #53.

**Già vero — si verifica e si riporta, non si cambia:**

| Punto della richiesta | Misura del 3 novembre 2026 |
|---|---|
| 4 · redirect | `http://eudigitalpolicy.eu/`, `http://www.eudigitalpolicy.eu/`, `https://www.eudigitalpolicy.eu/`: **301 → `https://eudigitalpolicy.eu/`**; la homepage 200 (`curl -sS -o /dev/null -w "%{http_code} -> %{redirect_url}"`). Non è configurato nel repo: GitHub Pages con `CNAME` (`eudigitalpolicy.eu`) e le impostazioni del proprietario (`docs/DEPLOYMENT.md`). Niente da cambiare nel repo. |
| 4 · robots, sitemap | `robots.txt` e `sitemap.xml` esistono, generati da `tools/_footer.mjs` da `tools/seo.mjs`; `Sitemap: https://eudigitalpolicy.eu/sitemap.xml`; la prima `<loc>` è `https://eudigitalpolicy.eu/`. |
| 3 · og:site_name | `<meta content="EU Digital Policy" property="og:site_name"/>` su ogni pagina (`tools/seo.mjs:452`; `tools/seo-audit.mjs:151` lo controlla). |
| 3 · canonical | `<link href="https://eudigitalpolicy.eu/" rel="canonical"/>` nella homepage. |
| 1 · name, url | il nodo WebSite della homepage ha già `name: "EU Digital Policy"` e `url: "https://eudigitalpolicy.eu/"`. |
| 4 · grafia | "EU Digital Policy" ricorre 109 volte nelle pagine e in `js/shell.js`, sempre identica; nessuna variante («Eu Digital Policy», «EUDigitalPolicy») come nome principale. Rimisura con `grep -rhoi "eu digital policy" *.html */index.html js/shell.js \| sort \| uniq -c`. |

**Da fare (la proposta va all'autore, 19.0):**

| Punto | Oggi | Dove |
|---|---|---|
| 2 · `<title>` della homepage | "EU Digital Policy — The European Legal Framework for the Digital World" (anche `og:title` e il `name` del nodo WebPage) | `tools/seo.mjs:93`, `TOP_PAGES[0].title` |
| 2 · formato delle altre pagine | già "Titolo pagina \| EU Digital Policy" (`BRAND = ' \| ' + SITE.name`, `tools/seo.mjs:79`); verificalo su ogni pagina generata | `tools/seo.mjs` |
| 1 · alternateName | "The European Legal Framework for the Digital World" (una stringa) | `tools/seo.mjs:59`, `SITE.alternateName` |
| 3 · application-name | assente su ogni pagina | `tools/seo.mjs` (l'head generato) |
| 1 · «SOLO nella homepage» | 24 sottopagine portano un nodo WebSite completo; ogni nodo WebPage vi rimanda con `isPartOf: {"@id": "https://eudigitalpolicy.eu/#site"}` | `tools/seo.mjs:489–523` |

## Le premesse che la richiesta non nomina (ciascuna si chiede a parte)

1. **Un controllo fissa il nodo WebSite su ogni pagina.** `tools/seo-audit.mjs:333–334` fallisce una pagina il cui
   grafo non contiene un nodo WebSite con `name` e `url` del sito. Togliere il nodo dalle sottopagine porta
   `seo-audit` e la CI al rosso. La proposta: il controllo richiede il nodo completo **solo** sulla homepage e, sulle
   sottopagine, che il WebPage rimandi a `#site` per `@id` e che **non** vi sia un nodo WebSite — più severo di oggi,
   non meno. Prima e dopo dell'asserzione, parola per parola.
2. **`SITE.alternateName` è anche il titolo dell'immagine social.** `tools/og-image.mjs:91` stampa
   `SITE.alternateName` come titolo della card della homepage. Sostituirlo con `["EUDigitalPolicy",
   "eudigitalpolicy.eu"]` cambierebbe quell'immagine. La proposta: il sottotitolo passa a un campo suo (per esempio
   `SITE.tagline`) che legge `og-image.mjs`, e `alternateName` diventa l'array richiesto; `node tools/og-image.mjs
   --check` deve restare a 0 (o l'immagine si rigenera, con il prima e dopo mostrato).
3. **Le edizioni it, fr, es.** Le loro homepage hanno lo stesso "—": "EU Digital Policy — Il quadro giuridico europeo per
   il mondo digitale", "… — Le cadre juridique européen du monde numérique", "… — El marco jurídico europeo del mundo
   digital", da `i18n/locales.json` (`edition.title`). Cambiare il separatore è una modifica di un testo d'edizione:
   si chiede se rientra nella sessione, con il testo esatto; **non si traduce nulla**.
4. **Dove sta `application-name`**: su ogni pagina (il nome del sito è lo stesso ovunque) o solo nella homepage.
5. **Che cosa il repo non può fare.** Il nome che Google mostra è scelto da Google, che legge il nodo WebSite della
   homepage, il `<title>` e `og:site_name`; cambia solo quando Google ri-scansiona la homepage. Richiedere
   l'indicizzazione in Search Console è del proprietario (`docs/SEO-OPERATIONS.md`). Il rapporto lo dice, senza
   promettere un risultato.

## 19.0 · Le domande all'autore

**Una ricognizione in sola lettura prima**, che rimisura le due tabelle sopra; poi le domande, **una per volta, con lo
strumento di domande**, la raccomandazione in prima posizione e la motivazione nella domanda; ogni risposta in §8 con
le parole dell'autore, committata subito; nulla di pubblicato cambia prima della risposta. Almeno:

1. **Il `<title>` della homepage** (con `og:title` e il `name` del WebPage, che lo seguono): proposta "EU Digital Policy |
   The European Legal Framework for the Digital World" — il nome intero davanti, poi il separatore delle altre pagine,
   nessun trattino penzolante; alternativa "EU Digital Policy". Prima e dopo.
2. **Il nodo WebSite**: `alternateName: ["EUDigitalPolicy", "eudigitalpolicy.eu"]`, con la premessa 2
   (`og-image.mjs`); il nodo completo solo nella homepage e il riferimento per `@id` nelle sottopagine (la proposta
   dell'autore), con la premessa 1 (`seo-audit.mjs`) chiesta a parte. Il JSON-LD prima e dopo, intero.
3. **`application-name`**, premessa 4.
4. **Le edizioni it, fr, es**, premessa 3.

Una premessa che una domanda non nomina si chiede a parte.

## 19.1 · Scrivere e verificare

- Un commit per voce approvata, con la riga `Evidence:` quando cambia un file pubblicato
  (`tools/commit-evidence.mjs <base> HEAD`: 0 senza evidenza).
- Si cambia il generatore (`tools/seo.mjs`), mai una pagina a mano; poi `node tools/_footer.mjs` e una seconda esecuzione
  che scrive 0 file. Se una pagina ha uno script inline, la CSP si aggiorna con `_footer.mjs` (non a mano).
- **Valida il JSON-LD**: ogni blocco `application/ld+json` di ogni pagina generata si analizza con `JSON.parse` (zero
  errori), e `seo-audit` 0 errori, 0 warning; riporta il nodo WebSite della homepage intero.
- Rilancia tutto come misura, prima e dopo, su un clone completo, e salva gli output su file: `validate`, `i18n-audit`,
  `design-qa`, `evidence-audit --as-of <oggi>`, `freshness --as-of <oggi>`, `seo-audit`, `tools/og-image.mjs --check`;
  le 25 suite (con `BROWSER_QA_CHROME` sul Chromium dell'ambiente), la suite browser con `--require-browser`, il gate
  avversariale, `agent/schemas/cli.mjs check`, `.control-room/cli.mjs boundary` e `routes`,
  `agent/production/cli.mjs readiness`. Misura in un worktree separato.
- La homepage e due sottopagine viste in Chromium: chiaro e scuro, 1280px e 390px; nessun errore in console, nessun
  overflow; il `<head>` letto nel DOM reso.
- Leggi il `git diff` completo prima di ogni commit.

## 19.2 · Checkpoint — la sessione si ferma qui

- Il rapporto in `docs/HANDOVER.md`, sul modello di quello della sessione 18: le decisioni con i commit; prima e dopo di
  ogni testo e di ogni tag cambiato; **il riepilogo dei file modificati** (la richiesta, punto 5); i conteggi prima e
  dopo con il motivo di ogni movimento; ciò che era già vero (la tabella sopra, rimisurata); ciò che non è stato
  verificato e perché; i rilievi nuovi, non corretti; la checklist (19.0–19.2) e come controllare a mano.
- **Detto esplicitamente all'autore** (la richiesta, punto 5): sì, serve l'unione su `main` — il sito si pubblica da
  `main` con `.github/workflows/pages.yml` (`docs/DEPLOYMENT.md`); dopo l'unione, la richiesta di indicizzazione della
  homepage in Search Console è del proprietario; il nome mostrato da Google cambia solo dopo la sua nuova scansione.
- Riscarica `origin/main` e confrontalo subito prima dell'ultima scrittura di `docs/HANDOVER.md`.
- Attendi l'approvazione esplicita dell'autore, registrata in §8. Poi chiedi se aprire una pull request verso `main`, e
  registra la sorte del branch. **Non pushare sul branch dopo aver aperto la PR.** Il prompt della sessione successiva
  si scrive solo se l'autore lo chiede.

## Cosa NON fare in questa sessione

- Non aprire né avviare la Fase 4; non scrivere la voce 4.1; non toccare D-5, `ALLOWED_RUNTIME_ORIGINS`, la concessione
  di autonomia, i dispatcher.
- Non correggere i tre rilievi nuovi della sessione 18 (il titolo di eIDAS2, le intestazioni degli altri strumenti, 
  `docs/v2-design/status-labels.json`): l'autore li ha lasciati fuori da questa sessione.
- Non cambiare i titoli delle altre pagine oltre ciò che una voce approvata nomina; non cambiare `SITE.name`; non
  introdurre varianti del nome.
- Non modificare a mano un file generato (`index.html`, `instruments/`, `robots.txt`, `sitemap.xml`, le edizioni).
- Non toccare `CNAME`, le impostazioni di Pages o il DNS: i redirect sono già corretti e non stanno nel repo.
- Non scrivere traduzioni, né dichiarare rivista una lingua.
- Non abbassare gate, validator, test, CSP o limiti di pubblicazione; un'asserzione cambia solo con la risposta
  dell'autore (`seo-audit.mjs:334` compreso).
- Non toccare la licenza né il testo di non affiliazione o di assenza di consulenza legale; non scrivere nel README.
- Non riscrivere la storia di `main`, né forzare un push.
- Vale in pieno la sezione «Cosa NON fare» del brief.

## Lezioni delle sessioni 8–18 (da `docs/HANDOVER.md`; non ripeterle)

- **Ciò che si dice all'autore va misurato e citato esattamente.** Nella sessione 18 una domanda ha detto «l'unico»
  dove non lo era (V2C-29): conta prima di scrivere «l'unico», «tutti», «nessuno».
- **Un controllo può fissare ciò che cambi** (N1, S2, `seo-audit.mjs:334`): cercalo prima di scrivere (`grep` in
  `tools/`, `agent/`, `.control-room/`).
- **Una premessa del rilievo può essere inesatta** (F-10, V2C-35 nella sessione 18): rimisurala e dillo nella domanda.
- **Un difetto che il lavoro espone si porta all'autore**: né corretto in silenzio, né lasciato in silenzio.
- **Un clone superficiale non è un albero difettoso**: controlla `--is-shallow-repository` prima delle suite.
- **Branch e merge.** Non pushare su un branch dopo aver aperto la sua PR; `main` può muoversi durante la sessione:
  riscarica prima dell'ultima scrittura.
- **Riavvii del worker.** Registra ogni risposta in §8 e committa subito; salva gli output su file; ferma un server per
  PID.
- **Nessun output di agenti in `agent/records/`.**

## Criterio di uscita e consegna

La sessione è completa quando ogni punto della richiesta è scritto come l'autore ha approvato, già vero e verificato, o
lasciato aperto con la ragione registrata in §8; il JSON-LD è validato; il checkpoint è approvato; e all'autore è stato
detto esplicitamente che serve l'unione su `main`. Oppure l'autore decide di fermarsi.

Prima di chiudere, produci la checklist di verifica. Per ciascun punto (19.0–19.2) indica:
- cosa è stato scritto (file, righe di §8, commit);
- come verificarlo manualmente (passi);
- se esiste un test automatico, e dove (suite e nome del test);
- quale criterio di uscita soddisfa.

Se un punto non è completo, dichiaralo invece di darlo per risolto.
