/* ============================================================
   agent/proposals/editorial/prose.mjs — the site's own prose, read
   as a structure

   Every agent before this one read `data/`. This is the first that
   reads what a reader actually reads, and the reason it can be done
   at all is that the brief already carries its editorial structure
   in its markup:

     data-i18n          a stable anchor on 416 blocks of index.html,
                        and the key three locale editions translate
     data-claim         the provenance link — which claim records the
                        sentence is a view of. 59 of them
     data-i18n-scope    the part a block sits in
     data-tone="crit"   the brief's own CRITIQUE boxes, labelled as
                        such in the markup

   NOTHING HERE IS INVENTED, AND NOTHING IS STORED. The anchors, the
   claim links, the tone markers and the part ids are read off the
   files every time. There is no index of the prose anywhere in this
   repository and this module does not create one: an index would be
   a second home for sentences that already have one, and it would
   go stale the first time somebody edited a paragraph.

   THE THREE HOMES ARE READ AS THREE. `legal-editorial`'s SKILL.md
   says an English string can live in the markup, in the inline
   `window.__CONTENT__` blob and in the locale overlays, and that
   `meta.standfirst` has already drifted between the first two. This
   module reads the markup AND the blob AND `data/brief.json`,
   reports what differs, and RECONCILES NOTHING. The drift is the
   author's decision (docs/HANDOVER.md: do not fix it on your own
   initiative).

   IT IS READ-ONLY, AND THAT IS ENFORCED RATHER THAN PROMISED —
   `selftest.mjs` scans every module in this directory for a write
   call, as `agent/integrate/` and `agent/architect/` already do.

   WHAT IT IS NOT. It is not an HTML parser and does not claim to
   be. It is a tag scanner with a stack, over markup this repository
   controls and `tools/design-qa.mjs` already checks. Where the
   stack cannot make sense of a close tag it drops it rather than
   guessing, and the count of dropped tags is reported so a run
   cannot silently examine less than it says it did.
   ============================================================ */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from '../../schemas/types.mjs';

/**
 * The elements that can hold an authored sentence. A block is one
 * of these; everything else is chrome, layout or a rendered value.
 *
 * `td` and `th` are here because the brief's comparison tables carry
 * written prose in their cells, and a sentence is a sentence
 * wherever it was typed.
 */
export const BLOCK_TAGS = ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figcaption', 'blockquote', 'summary', 'dd', 'dt', 'td', 'th', 'caption'];

/**
 * Elements that never close. HTML's void set and nothing else.
 *
 * The SVG primitives this site inlines are NOT here, and that was a
 * measured correction rather than a preference: `index.html` writes
 * `<circle …/>` in one place and `<circle …></circle>` in another,
 * so treating them as void dropped 126 close tags on the first pass.
 * The self-closing test below covers the first form and the stack
 * covers the second, which is the only way to get both right.
 */
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

/**
 * What makes an element an authored block.
 *
 * Two answers, and the second is read from the site rather than
 * decided here. An element in `BLOCK_TAGS` is a block by its tag.
 * An element carrying `data-i18n` or `data-claim` is a block
 * because THE SITE SAYS SO: the first is the key a translator works
 * from, the second is the claim record the sentence is a view of,
 * and neither is put on chrome. That second rule is what reaches
 * the brief's own critique boxes, whose prose sits in a
 * `<div class="box-body" data-i18n=… data-claim=…>` — twelve of the
 * fifty-nine claim attributions in `index.html`, and the twelve
 * most editorially loaded, since they are the boxes the author
 * labelled CRITIQUE.
 */
const isBlock = (name, attrs) => BLOCK_TAGS.includes(name) || 'data-i18n' in attrs || 'data-claim' in attrs;

/**
 * How many words make a block an authored sentence rather than a
 * rendered value.
 *
 * THE THRESHOLD IS STATED RATHER THAN TUNED, on the same principle
 * `agent/integrate/canonical.mjs` states its compilation-date
 * threshold. A table cell holding "23", "Yes" or "Article 5(2)" is a
 * value the author put in a table; it is not a sentence, and this
 * agent only ever looks at sentences. Six words is where a cell
 * stops being a label. It is a signal and it is named as one — a
 * block below the line is not thereby proved to assert nothing.
 */
export const PROSE_MIN_WORDS = 6;

/** Where prose lives outside the markup. Named so a caller does not
 *  hard-code the string. */
export const CONTENT_BLOB_ANCHOR = 'window.__CONTENT__';

const HTML_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…', laquo: '«', raquo: '»',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', middot: '·',
  eacute: 'é', egrave: 'è', agrave: 'à', uuml: 'ü', ouml: 'ö',
  euro: '€', deg: '°', times: '×', shy: '', zwj: '', thinsp: ' ',
};

/** Decode the entities this repository's markup actually uses, plus
 *  numeric references. An unknown named entity is left alone rather
 *  than guessed at — a wrong character in a quoted sentence is a
 *  misquotation. */
export function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name.toLowerCase() in HTML_ENTITIES ? HTML_ENTITIES[name.toLowerCase()] : m));
}

/** Inner HTML to the words a reader sees. */
export function textOf(html) {
  return decodeEntities(String(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export const wordCount = (text) => (String(text).trim() ? String(text).trim().split(/\s+/).length : 0);

/** Attributes of one start tag, as a map. */
export function attrsOf(raw) {
  const out = {};
  for (const m of String(raw).matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g)) out[m[1].toLowerCase()] = m[2];
  for (const m of String(raw).matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*'([^']*)'/g)) {
    if (!(m[1].toLowerCase() in out)) out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

/**
 * Blank out the regions a tag scanner must not walk into, keeping
 * every byte position intact so a line number stays true.
 *
 * `<script>` matters more than the others: `index.html` inlines the
 * whole `window.__CONTENT__` blob inside one, and a `<li>` appearing
 * inside a JSON string in it would otherwise be scanned as markup.
 * The blob is read separately and deliberately, by `readContentBlob`.
 */
export function maskUnscannable(html) {
  let s = String(html);
  const blank = (m) => ' '.repeat(m.length);
  s = s.replace(/<!--[\s\S]*?-->/g, blank);
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, blank);
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, blank);
  s = s.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, blank);
  return s;
}

/** 1-based line number of a byte offset. */
const lineAt = (s, i) => s.slice(0, i).split('\n').length;

/**
 * Read one page's authored blocks.
 *
 * The scanner keeps a stack, so a block knows the section scope it
 * sits in, the id of the nearest enclosing element and whether it is
 * inside one of the brief's own labelled boxes. A close tag with no
 * matching open is DROPPED AND COUNTED rather than guessed at.
 *
 * @returns {{blocks:object[], dropped:number, tags:number}}
 */
export function readPage(file, { root = REPO_ROOT } = {}) {
  const raw = readFileSync(join(root, file), 'utf8');
  const masked = maskUnscannable(raw);
  const stack = [];
  const blocks = [];
  let dropped = 0;
  let tags = 0;
  /* Per-scope ordinals, so a block with no data-i18n key still has a
     deterministic anchor: the same file scanned twice gives the same
     anchors, and inserting a paragraph renumbers only what follows
     it inside that one scope. */
  const ordinals = new Map();

  for (const m of masked.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g)) {
    tags++;
    const [full, slash, nameRaw, attrRaw] = m;
    const name = nameRaw.toLowerCase();
    if (slash) {
      const at = stack.map((f) => f.name).lastIndexOf(name);
      if (at < 0) { dropped++; continue; }
      const closed = stack.splice(at)[0];

      /* The brief's own box labels — CRITIQUE, MECHANICS. Recorded
         onto the nearest tone-bearing ancestor as the label closes,
         which is before any of the box's prose is pushed, so every
         block inside inherits it. Read from the markup the author
         wrote; never inferred from the prose. */
      if (String(closed.attrs.class ?? '').split(/\s+/).includes('box-label')) {
        const holder = [...stack].reverse().find((f) => f.attrs['data-tone']);
        if (holder) holder.boxLabel = textOf(raw.slice(closed.contentStart, m.index)) || null;
        continue;
      }

      if (!isBlock(name, closed.attrs)) continue;

      const inner = raw.slice(closed.contentStart, m.index);
      const text = textOf(inner);
      if (wordCount(text) < PROSE_MIN_WORDS) continue;

      const scope = closed.scope ?? (file.replace(/\.html$/, ''));
      const key = `${scope}:${name}`;
      const n = (ordinals.get(key) ?? 0) + 1;
      ordinals.set(key, n);

      blocks.push({
        home: 'markup',
        file,
        /* The i18n key where there is one: it is the site's own
           stable name for this block, it is what the locale
           register keys on, and it survives the block moving. */
        anchor: closed.attrs['data-i18n'] ?? `${scope}:${name}${n}`,
        tag: name,
        i18n_key: closed.attrs['data-i18n'] ?? null,
        claim_ids: (closed.attrs['data-claim'] ?? '').split(/\s+/).filter(Boolean),
        part_id: closed.partId,
        scope,
        element_id: closed.attrs.id ?? closed.enclosingId,
        /* The brief labels its own critique boxes. Read, never
           inferred: a box the author marked CRITIQUE is the author
           saying which of the four states this is. */
        tone: closed.tone,
        box_label: closed.boxLabel,
        html: inner,
        text,
        words: wordCount(text),
        line: lineAt(raw, closed.contentStart),
        start: closed.contentStart,
        end: m.index,
      });
      continue;
    }

    if (VOID_TAGS.has(name) || /\/\s*$/.test(attrRaw)) continue;
    const attrs = attrsOf(attrRaw);
    const parent = stack[stack.length - 1];
    const scope = attrs['data-i18n-scope'] ?? parent?.scope ?? null;
    stack.push({
      name,
      attrs,
      contentStart: m.index + full.length,
      scope,
      partId: /^(part-\d+|annex-[a-z])$/.test(String(scope)) ? scope : (parent?.partId ?? null),
      enclosingId: attrs.id ?? parent?.enclosingId ?? null,
      tone: attrs['data-tone'] ?? parent?.tone ?? null,
      boxLabel: parent?.boxLabel ?? null,
    });
  }

  return { blocks, dropped, tags };
}

/** Every page at the repository root, in a stable order. */
export function pageFiles({ root = REPO_ROOT } = {}) {
  return readdirSync(root).filter((f) => f.endsWith('.html')).sort();
}

/**
 * The inline `window.__CONTENT__` blob — the second home of the
 * brief's prose, and the one the reader's contents overlay and
 * search index actually read.
 *
 * Nothing loads `data/brief.json` at runtime. That is the
 * `__CONTENT__` bypass (docs/CURRENT-ARCHITECTURE.md §8), and this
 * function exists so a proposal can say it checked both rather than
 * promise that somebody will.
 */
export function readContentBlob({ root = REPO_ROOT, file = 'index.html' } = {}) {
  const raw = readFileSync(join(root, file), 'utf8');
  const at = raw.indexOf(`${CONTENT_BLOB_ANCHOR} = `);
  if (at < 0) return { present: false, file, bytes: 0, content: null, blocks: [] };
  const start = at + `${CONTENT_BLOB_ANCHOR} = `.length;
  const end = raw.indexOf('</script>', start);
  let json = raw.slice(start, end).trim();
  if (json.endsWith(';')) json = json.slice(0, -1);
  const content = JSON.parse(json);

  const blocks = [];
  const push = (anchor, text, part_id = null) => {
    if (wordCount(text) < PROSE_MIN_WORDS) return;
    blocks.push({
      home: 'content_blob', file, anchor, tag: null, i18n_key: null, claim_ids: [],
      part_id, scope: 'content_blob', element_id: null, tone: null, box_label: null,
      html: String(text), text: String(text), words: wordCount(text), line: lineAt(raw, start),
    });
  };
  for (const [k, v] of Object.entries(content.meta ?? {})) push(`meta.${k}`, v);
  (content.nodes ?? []).forEach((n, i) => push(`nodes[${i}].blurb`, n.blurb ?? '', n.part ?? null));
  (content.search ?? []).forEach((s, i) => {
    push(`search[${i}].dek`, s.dek ?? '', s.id ?? null);
    push(`search[${i}].text`, s.text ?? '', s.id ?? null);
  });
  return { present: true, file, bytes: json.length, content, blocks };
}

/** `data/brief.json` — canonical, and fetched by nothing. */
export function readBriefJson({ root = REPO_ROOT } = {}) {
  const path = 'data/brief.json';
  const brief = JSON.parse(readFileSync(join(root, path), 'utf8'));
  const blocks = [];
  const push = (anchor, text, part_id = null) => {
    if (wordCount(text) < PROSE_MIN_WORDS) return;
    blocks.push({
      home: 'brief_json', file: path, anchor, tag: null, i18n_key: null, claim_ids: [],
      part_id, scope: 'brief_json', element_id: null, tone: null, box_label: null,
      html: String(text), text: String(text), words: wordCount(text), line: 1,
    });
  };
  for (const [k, v] of Object.entries(brief.meta ?? {})) push(`meta.${k}`, v);
  for (const p of brief.parts ?? []) {
    push(`parts[${p.id}].title`, p.title ?? '', p.id);
    push(`parts[${p.id}].dek`, p.dek ?? '', p.id);
  }
  return { brief, blocks };
}

/**
 * Where the two homes of the brief's own metadata disagree.
 *
 * REPORTED, NEVER RECONCILED. `meta.standfirst` has already drifted
 * and the handover is explicit that fixing it is not an agent's to
 * take. What this function buys is that a proposal touching a
 * diverged string can SAY it diverged, which is what
 * `EditorialProposal.content_blob_divergence` is for.
 */
export function blobDivergences({ root = REPO_ROOT } = {}) {
  const blob = readContentBlob({ root });
  const { brief } = readBriefJson({ root });
  if (!blob.present) return [{ field: null, why: 'index.html carries no __CONTENT__ blob', blob: null, brief_json: null }];
  const out = [];
  const keys = [...new Set([...Object.keys(blob.content.meta ?? {}), ...Object.keys(brief.meta ?? {})])].sort();
  for (const k of keys) {
    const a = blob.content.meta?.[k] ?? null;
    const b = brief.meta?.[k] ?? null;
    if (String(a) !== String(b)) out.push({ field: `meta.${k}`, blob: a, brief_json: b, why: a === null || b === null ? 'the field exists in one home and not the other' : 'the two homes hold different text' });
  }
  const byId = new Map((brief.parts ?? []).map((p) => [p.id, p]));
  for (const n of blob.content.nav ?? []) {
    const p = byId.get(n.id);
    if (!p) { out.push({ field: `nav[${n.id}]`, blob: n.title ?? null, brief_json: null, why: 'the blob carries a part data/brief.json does not' }); continue; }
    if (String(n.title) !== String(p.title)) out.push({ field: `nav[${n.id}].title`, blob: n.title, brief_json: p.title, why: 'the two homes hold different text' });
  }
  return out;
}

/**
 * The whole of the site's authored prose, in one read.
 *
 * @returns {{blocks:object[], by_home:object, pages:string[], dropped:number,
 *            divergences:object[], blob:object}}
 */
export function readProse({ root = REPO_ROOT } = {}) {
  const pages = pageFiles({ root });
  const blocks = [];
  let dropped = 0;
  for (const f of pages) {
    const r = readPage(f, { root });
    blocks.push(...r.blocks);
    dropped += r.dropped;
  }
  const blob = readContentBlob({ root });
  blocks.push(...blob.blocks);
  blocks.push(...readBriefJson({ root }).blocks);

  const by_home = {};
  for (const b of blocks) by_home[b.home] = (by_home[b.home] ?? 0) + 1;

  return {
    blocks,
    by_home,
    pages,
    dropped,
    blob,
    divergences: blobDivergences({ root }),
    /* Two counts that are the honest shape of what this agent can
       see: how much of the prose carries a claim record, and how
       much does not. The second is not a defect of the site — most
       sentences are not consequential statements — and it is why
       `not_attributed` is one of the five states. */
    attributed: blocks.filter((b) => b.claim_ids.length).length,
    unattributed: blocks.filter((b) => !b.claim_ids.length).length,
  };
}
