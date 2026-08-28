/* ============================================================
   The single point at which a dataset is fetched, shape-checked,
   indexed and cached. No renderer ever calls fetch() itself.
   ============================================================ */

const CACHE = new Map();          // name -> Promise<parsed>
const ROOT = 'data/';

/** Load one dataset. Repeated calls share one request. */
export function load(name) {
  if (!CACHE.has(name)) {
    CACHE.set(name, fetch(ROOT + name + '.json', { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + ROOT + name + '.json');
        return r.json();
      })
      .catch((e) => { CACHE.delete(name); throw e; }));
  }
  return CACHE.get(name);
}

/** Load several datasets at once, failing with the first real error. */
export function loadAll(names) {
  return Promise.all(names.map(load)).then((vals) => {
    const o = {};
    names.forEach((n, i) => { o[n] = vals[i]; });
    return o;
  });
}

const arr = (x) => (Array.isArray(x) ? x : []);

/** Build the reverse indexes every view needs. Pure: same input, same output. */
export function index(db) {
  const ix = {
    instrument: new Map(),
    provision: new Map(),
    institution: new Map(),
    source: new Map(),
    claim: new Map(),
    event: new Map(),
    term: new Map(),
    taxonomy: new Map(),
    relationship: [],
    claimsByPart: new Map(),
    eventsByInstrument: new Map(),
    provisionOwner: new Map(),
  };

  for (const [k, v] of Object.entries(db.taxonomy || {})) {
    if (k.startsWith('$') || !Array.isArray(v)) continue;
    for (const t of v) ix.taxonomy.set(t.id, t);
  }
  for (const i of arr(db.instruments?.instruments)) {
    ix.instrument.set(i.id, i);
    for (const a of arr(i.aliases)) if (!ix.instrument.has(a)) ix.instrument.set(a, i);
    for (const p of arr(i.provisions)) { ix.provision.set(p.id, p); ix.provisionOwner.set(p.id, i.id); }
  }
  ix.relationship = arr(db.instruments?.relationships);
  for (const x of arr(db.institutions?.institutions)) ix.institution.set(x.id, x);
  for (const x of arr(db.sources?.sources)) ix.source.set(x.id, x);
  for (const x of arr(db.claims?.claims)) {
    ix.claim.set(x.id, x);
    if (x.brief_part) {
      if (!ix.claimsByPart.has(x.brief_part)) ix.claimsByPart.set(x.brief_part, []);
      ix.claimsByPart.get(x.brief_part).push(x);
    }
  }
  for (const e of arr(db.timeline?.events)) {
    ix.event.set(e.id, e);
    if (!ix.eventsByInstrument.has(e.instrument)) ix.eventsByInstrument.set(e.instrument, []);
    ix.eventsByInstrument.get(e.instrument).push(e);
  }
  for (const t of arr(db.glossary?.terms)) ix.term.set(t.id, t);
  return ix;
}

/** Taxonomy label for an id, falling back to the raw id rather than to nothing. */
export function label(ix, id) {
  if (!id) return null;
  const t = ix.taxonomy.get(id);
  return t ? t.label : String(id).split(':').pop().replace(/-/g, ' ');
}

/** Taxonomy note (the disambiguating sentence), or null. */
export function note(ix, id) {
  const t = ix.taxonomy.get(id);
  return t && t.note ? t.note : null;
}

/**
 * Render a dataset failure in place. §42: show a clear error, do not
 * fabricate fallback data, leave the surrounding static content alone.
 */
export function renderError(mount, err, retry) {
  if (!mount) return;
  mount.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'data-error';
  box.setAttribute('role', 'alert');
  const b = document.createElement('b'); b.textContent = 'Data could not be loaded';
  const p = document.createElement('p');
  p.style.margin = '0';
  p.textContent = 'This section is generated from the site’s canonical data files and cannot be shown. Nothing has been substituted for it. ';
  const c = document.createElement('code'); c.textContent = String(err && err.message ? err.message : err);
  p.appendChild(c);
  box.append(b, p);
  if (typeof retry === 'function') {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = 'Try again';
    btn.addEventListener('click', retry);
    box.appendChild(btn);
  }
  mount.appendChild(box);
}

/* ---------------------------------------------------------- i18n overlay */

const OVERLAYS = new Map();
let REGISTER = null;

/**
 * The locale register, i18n/locales.json. It is the only place that knows which
 * languages ship and where each one's files live, so nothing else may construct
 * an i18n path by string concatenation. Fetched once and shared.
 */
export function locales() {
  if (!REGISTER) {
    REGISTER = fetch('i18n/locales.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { locales: [] }))
      .then((reg) => {
        const by = new Map();
        for (const l of reg.locales || []) by.set(l.code, l);
        return { ...reg, by };
      })
      .catch(() => ({ locales: [], by: new Map() }));
  }
  return REGISTER;
}

/**
 * Entity-keyed translation overlay for a locale: { "gdpr.short_name": "RGPD", … }.
 * Keys are canonical entity IDs plus a field name, identical across every
 * locale, so a translation survives the DOM being rebuilt.
 *
 * English is the source language and has no overlay. A locale the register does
 * not declare, or whose file will not load, resolves to an empty overlay: every
 * field then falls back to English, which the callers mark visibly. That is the
 * defined behaviour, not an error.
 */
export function loadOverlay(lang) {
  const l = lang || document.documentElement.getAttribute('lang') || 'en';
  if (l === 'en') return Promise.resolve({});
  if (!OVERLAYS.has(l)) {
    OVERLAYS.set(l, locales()
      .then((reg) => {
        const rec = reg.by.get(l);
        if (!rec || !rec.data) return {};
        return fetch(rec.data, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {}));
      })
      .catch(() => ({})));
  }
  return OVERLAYS.get(l);
}
