/* ============================================================
   THE URL SCHEME — one home.

   Until 27 Sep 2026 every instrument lived at instrument.html?id=…,
   one HTML file whose canonical, title and <h1> existed only after
   JavaScript ran (docs/SEO-AUDIT-2026-09-27.md, A1–A3). Each
   substantive instrument now has a page of its own at
   instruments/<id>/, pre-rendered from the canonical records by
   tools/_footer.mjs through the same renderer the browser runs
   (js/instrument-view.js). instrument.html?id=… still works: it
   forwards to that page, and renders the rest itself.

   Which instruments get a page is DERIVED, never listed: the gate
   below reads the record and its edges and answers from them, so an
   instrument that gains an objective, dates and evidence gains a page
   on the next generation, and one that loses them loses it. The
   browser (links, the forwarding in instrument.html), the generator,
   the sitemap and tools/seo-audit.mjs all ask this one function.

   Pure: no module here touches the DOM at import time, so the tools
   import it in Node.
   ============================================================ */

export const ENTITY_DIR = 'instruments/';

/** The relative path from a page to the site root. Pages below the root
 *  declare it on <body data-root="../../">; the seven top-level pages
 *  declare nothing and get "". Read at call time, never cached, and "" in
 *  Node, where the generator passes its own root explicitly. */
export function siteRoot() {
  try {
    return (typeof document !== 'undefined' && document.body && document.body.dataset.root) || '';
  } catch (e) { return ''; }
}

/** A site-relative path, made relative to the page that links to it. */
export const href = (path, root = siteRoot()) => root + path;

/** The canonical path of an instrument page, relative to the site root. */
export const entityPath = (id) => ENTITY_DIR + id + '/';

/* ---------------------------------------------------------- the gate

   An instrument earns an indexable page only when its record can answer
   what a reader arriving from a search would ask of it. Seven criteria,
   each read from the data; all seven must hold. A record that fails one
   stays fully available in the application — the comparison, the search,
   instrument.html?id=… — and is simply not offered to a search engine as
   a landing page of its own, because a page that has to say "not recorded"
   under most headings is a thin page, however honest. */
export const GATE = [
  { id: 'not-treaty', label: 'is an act of secondary law or a proposal, not a Treaty text',
    test: (i) => !String(i.kind || '').includes('treaty') },
  { id: 'identity', label: 'has a short name, a full name and a CELEX number',
    test: (i) => !!(i.short_name && i.full_name && i.celex) },
  { id: 'explanation', label: 'has a recorded objective (dna.objective)',
    test: (i) => !!(i.dna && String(i.dna.objective || '').trim()) },
  { id: 'status', label: 'has a legislative status and the date it was assessed',
    test: (i) => !!(i.legislative_status && i.status_as_of) },
  { id: 'dates', label: 'has at least one dated milestone in timeline.json',
    test: (i, ix) => (i.milestones || []).some((m) => ix.event.has(m)) },
  { id: 'evidence', label: 'has at least one claim, or one provision with a source',
    test: (i, ix) => claimCount(i.id, ix) > 0 || (i.provisions || []).some((p) => (p.sources || []).length) },
  { id: 'context', label: 'is analysed in a Part of the brief or has a recorded relationship',
    test: (i, ix) => !!i.brief_part || (ix.relationship || []).some((r) => r.from === i.id || r.to === i.id) },
];

const COUNTS = new WeakMap();
function claimCount(id, ix) {
  let m = COUNTS.get(ix);
  if (!m) {
    m = new Map();
    for (const c of ix.claim.values()) for (const i of c.instruments || []) m.set(i, (m.get(i) || 0) + 1);
    COUNTS.set(ix, m);
  }
  return m.get(id) || 0;
}

/** Every criterion, with whether this record meets it. */
export function gateReport(inst, ix) {
  return GATE.map((g) => ({ id: g.id, label: g.label, met: !!g.test(inst, ix) }));
}

/** Does this instrument have a page of its own at instruments/<id>/? */
export function hasEntityPage(inst, ix) {
  return !!inst && GATE.every((g) => g.test(inst, ix));
}

/** Every instrument with a page, in a stable order (the dataset's own). */
export function entityInstruments(ix) {
  return [...new Set(ix.instrument.values())].filter((i) => hasEntityPage(i, ix));
}

/** Where a link to this instrument goes: its own page when it has one,
 *  the application route otherwise. Accepts an id or a record. */
export function instrumentHref(instOrId, ix, root = siteRoot()) {
  const inst = typeof instOrId === 'string' ? ix.instrument.get(instOrId) : instOrId;
  if (inst && hasEntityPage(inst, ix)) return root + entityPath(inst.id);
  const id = inst ? inst.id : instOrId;
  return root + 'instrument.html?id=' + encodeURIComponent(id);
}

/* ---------------------------------------------------------- names

   The name a reader types is often not the short name the record uses:
   "Digital Services Act", not "DSA". Those names are already in the data,
   as aliases ("digital-services-act"); this is only their capitalisation,
   which a slug cannot carry. A name is used only while it still matches an
   alias of the record, so it can never assert a name the data does not
   hold — delete the alias and the name disappears from the page, the
   title and the structured data together. tools/seo-audit.mjs reports an
   entry here that matches nothing. */
export const KNOWN_AS = {
  gdpr: 'General Data Protection Regulation',
  dsa: 'Digital Services Act',
  dma: 'Digital Markets Act',
  'ai-act': 'Artificial Intelligence Act',
  cra: 'Cyber Resilience Act',
  'ai-omnibus': 'Digital Omnibus on AI',
  'data-omnibus': 'Digital Omnibus',
  pld: 'Product Liability Directive',
};

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** The alias-backed common name of an instrument, or null. */
export function knownAs(inst) {
  const name = inst && KNOWN_AS[inst.id];
  if (!name) return null;
  return (inst.aliases || []).includes(slug(name)) ? name : null;
}

/* ---------------------------------------------------------- legal text

   The instrument's own text, where the data records it: a tier-1 source
   in sources.json whose URL names this CELEX number, or the matching ELI
   path. Read from records that exist; when none matches, the answer is
   null and the page says the text is not linked, rather than
   constructing a EUR-Lex URL nobody recorded. */
export function legalTextSource(inst, ix) {
  if (!inst || !inst.celex) return null;
  const m = String(inst.celex).match(/^3(\d{4})([RL])(\d{4})$/);
  const eli = m ? new RegExp('/eli/' + (m[2] === 'R' ? 'reg' : 'dir') + '/' + m[1] + '/' + Number(m[3]) + '(/|$)') : null;
  const hits = [...ix.source.values()].filter((s) => s && s.url && s.tier === 'tier:1' &&
    (s.url.includes(inst.celex) || (eli && eli.test(s.url))));
  hits.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return hits[0] || null;
}
