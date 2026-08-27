/* ============================================================
   Structured entity search.

   Until now the palette searched prose: the thirteen Parts of the
   brief plus the fifteen glossary definitions, both scraped from the
   rendered DOM. That answers "where does the text say X" and nothing
   else. It could not answer "who fines under the DMA", "what happens
   on 2 December 2027", "which article is the systemic-risk duty in",
   or "what has Ireland actually decided" — because none of those are
   passages. They are entities.

   This module builds a flat index over the canonical JSON and hands
   it to the palette. Ten kinds, each a real record with a real ID:

     instrument · provision · claim · institution · authority
     enforcement · date · concept · actor · obligation

   Two design commitments carried from earlier phases:

   1. Nothing here restates a fact. Every record holds a reference to
      the canonical entity and reads its fields; the index is a view,
      not a second copy. Rebuild it when the language changes and the
      titles change with it.

   2. A record never asserts more than the data supports. An unverified
      claim is labelled unverified in the result row; an enforcement
      record whose payment status is unknown says unknown. The search
      results are held to the same standard as the pages they lead to.
   ============================================================ */

import { loadAll, index, label as taxLabel, loadOverlay } from './data.js';
import * as F from './format.js';

/* ---------------------------------------------------------- helpers */

const norm = (s) => String(s == null ? '' : s)
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '');   /* café === cafe */

const ART_RE = /\b(?:art(?:icle|icolo|\.)?|§)\s*(\d+)\s*(?:\(\s*(\d+)\s*\))?/i;
const DATE_RE = /\b(19|20)\d{2}\b/;

let IX = null;
let OVERLAY = {};
let RECORDS = [];

const tr = (k, fallback) => (OVERLAY && OVERLAY[k]) || fallback;

/* Kind order is the order the groups appear in. Concepts and instruments
   first because they are what a reader most often means; obligations last
   because they are the most numerous and the least specific. */
const KINDS = [
  ['concept', 'Concepts'],
  ['instrument', 'Instruments'],
  ['provision', 'Provisions'],
  ['authority', 'Who does what'],
  ['institution', 'Institutions'],
  ['enforcement', 'Enforcement'],
  ['date', 'Dates'],
  ['claim', 'Claims'],
  ['obligation', 'Obligations'],
  ['actor', 'Actors and sectors'],
];
const KIND_ORDER = new Map(KINDS.map(([k], i) => [k, i]));

/* Base weight per kind, so that an exact hit on a concept outranks an
   incidental mention of the same word inside a claim's statement. */
const WEIGHT = {
  concept: 60, instrument: 58, provision: 50, authority: 48, institution: 46,
  enforcement: 44, date: 40, claim: 34, obligation: 30, actor: 28,
};

const instName = (id) => {
  const i = IX.instrument.get(id);
  if (!i) return id;
  return tr(id + '.short_name', i.short_name);
};

const provRef = (pid) => {
  const pr = IX.provision.get(pid);
  if (!pr) return pid;
  const owner = IX.provisionOwner.get(pid);
  return (owner ? instName(owner) + ' ' : '') + 'Art. ' + pr.number;
};

/* An entity that carries an explicit unverified state says so in the
   result row. The search must not make a shaky record look settled. */
function unverifiedNote(e) {
  if (e && e.requires_verification) return 'requires verification';
  const n = String((e && e.verification_note) || '');
  if (/^requires verification|^REQUIRES VERIFICATION|^PLACEHOLDER/i.test(n)) return 'requires verification';
  return '';
}

function push(out, rec) {
  /* the haystack is built once, normalised once */
  rec.hay = norm([rec.title, rec.sub, rec.body, rec.id, (rec.alias || []).join(' ')].join('  '));
  rec.titleHay = norm(rec.title + ' ' + (rec.alias || []).join(' '));
  rec.weight = WEIGHT[rec.kind] || 10;
  out.push(rec);
}

/* ---------------------------------------------------------- the index */

export function buildIndex() {
  const out = [];
  if (!IX) return out;

  /* ---- instruments ---- */
  for (const inst of IX.instrumentList) {
    const st = inst.legislative_status;
    push(out, {
      kind: 'instrument', id: inst.id,
      title: instName(inst.id),
      sub: inst.full_name || '',
      body: [inst.celex, inst.dna && inst.dna.objective, (inst.aliases || []).join(' ')].join(' '),
      alias: [inst.short_name, inst.full_name, inst.celex, ...(inst.aliases || [])].filter(Boolean),
      badge: st ? taxLabel(IX, st) : '',
      href: 'instruments.html#' + inst.id,
      note: unverifiedNote(inst),
    });
  }

  /* ---- provisions ---- */
  for (const [pid, pr] of IX.provision) {
    const owner = IX.provisionOwner.get(pid);
    push(out, {
      kind: 'provision', id: pid,
      title: provRef(pid) + (pr.heading ? ' — ' + pr.heading : ''),
      sub: pr.summary || '',
      body: [pr.heading, pr.summary, 'article ' + pr.number, 'art ' + pr.number].join(' '),
      alias: ['Article ' + pr.number, 'Art. ' + pr.number, 'Art ' + pr.number],
      badge: owner ? instName(owner) : '',
      href: 'instruments.html#' + (owner || ''),
      note: unverifiedNote(pr),
      artNum: String(pr.number),
    });

    /* ---- obligations: a provision that binds somebody ---- */
    for (const who of pr.obligation_on || []) {
      push(out, {
        kind: 'obligation', id: pid + '::' + who,
        title: taxLabel(IX, who) + ' — ' + provRef(pid),
        sub: pr.summary || pr.heading || '',
        body: [taxLabel(IX, who), pr.heading, pr.summary].join(' '),
        badge: owner ? instName(owner) : '',
        href: 'instruments.html#' + (owner || ''),
        note: unverifiedNote(pr),
      });
    }
  }

  /* ---- institutions, and the competences that make one an authority ---- */
  for (const inst of IX.institutionList) {
    const isClass = String(inst.id).endsWith('-*');
    push(out, {
      kind: 'institution', id: inst.id,
      title: inst.short_name,
      sub: inst.full_name && inst.full_name !== inst.short_name ? inst.full_name : '',
      body: [inst.full_name, inst.member_state, taxLabel(IX, inst.type)].join(' '),
      alias: [inst.short_name, inst.full_name].filter(Boolean),
      badge: taxLabel(IX, inst.type) + (isClass ? ' · class' : ''),
      href: 'institutions.html#' + inst.id,
      note: unverifiedNote(inst),
    });

    for (const c of inst.competences || []) {
      const role = taxLabel(IX, c.role);
      const what = c.instrument === '*' ? 'across the acquis' : instName(c.instrument);
      push(out, {
        kind: 'authority', id: inst.id + '::' + c.role + '::' + c.instrument,
        title: inst.short_name + ' — ' + role + ' · ' + what,
        sub: c.scope || (c.basis || []).map(provRef).join(' · ') || '',
        /* the role verb is repeated so a bare "who fines" reaches it */
        body: [role, c.role.split(':').pop(), what, c.scope, inst.full_name,
          (c.basis || []).map(provRef).join(' ')].join(' '),
        badge: c.exclusive ? 'exclusive' : '',
        href: 'institutions.html#' + inst.id,
        note: String(c.note || '').startsWith('requires verification') ? 'requires verification' : '',
      });
    }
  }

  /* ---- enforcement ---- */
  for (const rec of IX.enforcementList) {
    const money = rec.fine_eur == null ? 'no fine recorded' : F.eur(rec.fine_eur);
    push(out, {
      kind: 'enforcement', id: rec.id,
      title: rec.entity + ' — ' + instName(rec.instrument),
      sub: [taxLabel(IX, rec.action_status), money,
        'payment ' + (taxLabel(IX, rec.payment_status) || 'unknown').toLowerCase()].filter(Boolean).join(' · '),
      /* one authority per record, stored as an id, not a list */
      body: [rec.entity, rec.action, instName(rec.instrument),
        (() => { const x = IX.institution.get(rec.authority); return x ? x.short_name + ' ' + (x.full_name || '') : rec.authority; })(),
        (rec.legal_basis || []).map(provRef).join(' '),
        taxLabel(IX, rec.action_status), taxLabel(IX, rec.payment_status),
        rec.decision_date, rec.behavioural_outcome].join(' '),
      alias: [rec.entity],
      badge: rec.decision_date ? F.humanDate(rec.decision_date, 'precision:day') : '',
      href: 'enforcement.html#' + rec.id,
      note: unverifiedNote(rec),
    });
  }

  /* ---- dates ---- */
  for (const ev of IX.event.values()) {
    push(out, {
      kind: 'date', id: ev.id,
      title: F.humanDate(ev.date, ev.date_precision) + ' — ' + instName(ev.instrument),
      sub: tr(ev.id + '.obligation', ev.obligation) || taxLabel(IX, ev.event_type),
      body: [ev.date, ev.obligation, ev.required_action, taxLabel(IX, ev.event_type),
        instName(ev.instrument), (ev.provisions || []).map(provRef).join(' ')].join(' '),
      badge: taxLabel(IX, ev.event_type),
      href: 'index.html#annex-a',
      note: unverifiedNote(ev),
      year: String(ev.date || '').slice(0, 4),
    });
  }

  /* ---- claims ---- */
  for (const c of IX.claimList) {
    const fam = F.familyOf(c);
    push(out, {
      kind: 'claim', id: c.id,
      title: c.statement,
      sub: [taxLabel(IX, c.type), (c.sources || []).length + ' source' + ((c.sources || []).length === 1 ? '' : 's')]
        .filter(Boolean).join(' · '),
      body: [c.statement, (c.instruments || []).map(instName).join(' '),
        (c.provisions || []).map(provRef).join(' ')].join(' '),
      badge: fam || taxLabel(IX, c.type),
      href: 'index.html#' + (c.brief_part || ''),
      claim: c.id,
      note: unverifiedNote(c),
    });
  }

  /* ---- glossary concepts ---- */
  for (const t of IX.term.values()) {
    push(out, {
      kind: 'concept', id: t.id,
      title: t.term,
      sub: t.definition || '',
      body: [t.definition, (t.instruments || []).map(instName).join(' '),
        (t.provisions || []).map(provRef).join(' ')].join(' '),
      alias: [t.term],
      badge: (t.instruments || []).map(instName).join(' · '),
      href: null,
      gloss: t.legacy_dom_id || String(t.id).replace(/^gl-/, ''),
      note: unverifiedNote(t),
    });
  }

  /* ---- actors and sectors ---- */
  for (const dim of ['actor', 'sector', 'activity', 'territory']) {
    for (const term of IX.taxonomyDim(dim)) {
      push(out, {
        kind: 'actor', id: term.id,
        title: term.label,
        sub: term.note || '',
        body: [term.label, term.note, dim].join(' '),
        badge: dim,
        href: 'applies.html',
        note: '',
      });
    }
  }

  return out;
}

/* ---------------------------------------------------------- query */

/* Words that carry no discriminating power in a question. Dropping them is
   what turns "who fines under the DMA" into "fines dma", which is the query
   the index can actually answer. */
const STOP = new Set(['who', 'what', 'which', 'when', 'where', 'how', 'why',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'of', 'on', 'in',
  'to', 'for', 'by', 'and', 'or', 'under', 'with', 'from', 'that', 'this',
  'does', 'do', 'did', 'can', 'may', 'my', 'me', 'i', 'it', 'its', 'has', 'have']);

/* A short query must land on a word boundary. Without this, "SME" matches
   asse-ssme-nt and "act" matches ex-act-ly, and the results read as noise. */
const boundedHit = (hay, w) => {
  let i = hay.indexOf(w);
  while (i > -1) {
    const before = i === 0 || !/[a-z0-9]/.test(hay[i - 1]);
    const j = i + w.length;
    const after = j >= hay.length || !/[a-z0-9]/.test(hay[j]);
    if (before && after) return i;
    i = hay.indexOf(w, i + 1);
  }
  return -1;
};

const contains = (hay, w) => (w.length <= 4 ? boundedHit(hay, w) : hay.indexOf(w)) > -1;

/**
 * Score one record against a normalised query.
 * Returns 0 for no match. Higher is better.
 */
function score(rec, q, artNum, year) {
  let s = 0;

  if (artNum && rec.artNum === artNum) s += 140;
  if (year && rec.year === year) s += 90;

  const ti = q.length <= 4 ? boundedHit(rec.titleHay, q) : rec.titleHay.indexOf(q);
  if (ti === 0) s += 120;
  else if (ti > 0) s += rec.titleHay[ti - 1] === ' ' ? 90 : 55;

  if (!s) {
    if (contains(rec.hay, q)) {
      s += 30;
    } else {
      /* otherwise every meaningful word must appear somewhere in the record.
         This is what lets "who fines under the DMA" reach the Commission's
         DMA competence, which contains no such phrase. */
      const words = q.split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
      if (words.length < 2 || !words.every((w) => contains(rec.hay, w))) return 0;
      s += 18 + words.length * 4;
    }
  }

  return s + rec.weight;
}

/**
 * Query the entity index.
 * @returns [{kind, label, items:[record]}] in KINDS order.
 */
export function query(raw, opts) {
  const o = opts || {};
  const perKind = o.perKind || 4;
  const q = norm(String(raw || '').trim());
  if (!q || q.length < 2) return [];

  const art = String(raw).match(ART_RE);
  const artNum = art ? art[1] : null;
  const yr = String(raw).match(DATE_RE);
  const year = yr ? yr[0] : null;

  const hits = [];
  for (const rec of RECORDS) {
    const s = score(rec, q, artNum, year);
    if (s > 0) hits.push({ rec, s });
  }
  hits.sort((a, b) => b.s - a.s || a.rec.title.length - b.rec.title.length);

  const byKind = new Map();
  const seen = new Set();
  for (const { rec, s } of hits) {
    /* one row per entity; the same institution reached through three
       competences should not fill the list three times */
    const dedup = rec.kind + '|' + rec.title;
    if (seen.has(dedup)) continue;
    seen.add(dedup);
    if (!byKind.has(rec.kind)) byKind.set(rec.kind, []);
    const list = byKind.get(rec.kind);
    if (list.length < perKind) list.push({ ...rec, score: s });
  }

  return KINDS
    .filter(([k]) => byKind.has(k))
    .map(([k, label]) => ({ kind: k, label, items: byKind.get(k) }))
    .sort((a, b) => {
      const ta = a.items[0].score, tb = b.items[0].score;
      return tb - ta || KIND_ORDER.get(a.kind) - KIND_ORDER.get(b.kind);
    });
}

export function count() { return RECORDS.length; }

/* ---------------------------------------------------------- boot */

export async function initSearch() {
  const db = await loadAll(['taxonomy', 'instruments', 'institutions', 'claims',
    'enforcement', 'timeline', 'glossary']);
  IX = index(db);

  /* a few list views the index does not already expose, derived once */
  IX.instrumentList = db.instruments.instruments || [];
  IX.institutionList = db.institutions.institutions || [];
  IX.claimList = db.claims.claims || [];
  IX.enforcementList = db.enforcement.enforcement || [];
  IX.taxonomyDim = (dim) => {
    const d = (db.taxonomy || {})[dim];
    if (!d) return [];
    const arr = Array.isArray(d) ? d : (d.terms || []);
    return arr.filter((t) => t && t.id && t.label);
  };

  const rebuild = () => {
    RECORDS = buildIndex();
    window.__EU_ENTITY_SEARCH__ = { query, count, kinds: KINDS };
    document.dispatchEvent(new CustomEvent('search:entities-ready', {
      detail: { records: RECORDS.length }
    }));
  };

  OVERLAY = await loadOverlay();
  rebuild();

  /* titles are translated, so the index is rebuilt when the language changes */
  document.addEventListener('i18n:applied', async () => {
    OVERLAY = await loadOverlay();
    rebuild();
  });

  return RECORDS.length;
}
