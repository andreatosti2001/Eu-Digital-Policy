/* ============================================================
   PV2-04 · the Policy observatory prototype — what the four views share.

   Direction 2 of docs/FRONTEND-REFERENCES.md §8.2: data in front; a list of
   the sections on the left and an "On this page" list on the right (USWDS);
   tables with sortable headers, sticky headers and a stacked layout at
   narrow widths, each with a caption (USWDS, GOV.UK); every chart beside
   its data table; cards with a label, a value and a change (Tabler's
   anatomy only, rewritten here). Nothing of theirs is copied.

   Reused, not rewritten:
   - js/data.js, js/format.js, js/pipeline.js, js/routes.js, js/status.js,
     js/evidence-model.js (through format.js) — the site's derivations;
   - ../editorial/common.js — the absence tokens, the tags, dates, sources,
     provisions and the column of Roman numerals, so the two prototypes keep
     ONE rule for "not recorded" vs "unknown" (docs/PROTOTYPES.md §1.1);
   - ../editorial/relations.js — the relationships table, the same table in
     both directions (docs/POST-V2.md §3 C, addition of 11 Nov 2026).
   ============================================================ */

import { loadAll, index, renderError, label } from '../../js/data.js';
import * as F from '../../js/format.js';
import {
  esc, has, notRecorded, unknown, tag, statusTag, evidenceTag, dateText, instrumentLink, instrumentName,
  provisionText, sourceShort, renderRail,
} from '../editorial/common.js';

export {
  F, label, esc, has, notRecorded, unknown, tag, statusTag, evidenceTag, dateText, instrumentLink, instrumentName,
  provisionText, sourceShort,
};

/** The date the page was read, which every derived figure depends on
 *  (AGENTS.md, "Derived output depends on the reader's clock"). */
export const TODAY = new Date().toISOString().slice(0, 10);

/* ---------------------------------------------------------- the theme
   Day and Night. The dark theme has no reference among the scored
   candidates (USWDS and GOV.UK offer none): it is designed here. */

const THEME_KEY = 'pv2-04-observatory-theme';
const THEMES = ['auto', 'light', 'dark'];
const THEME_WORD = { auto: 'Theme: system', light: 'Theme: day', dark: 'Theme: night' };

function readTheme() {
  try { const v = localStorage.getItem(THEME_KEY); return THEMES.includes(v) ? v : 'auto'; } catch (e) { return 'auto'; }
}
function applyTheme(v) {
  if (v === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', v);
  const btn = document.querySelector('[data-action="theme"]');
  if (btn) btn.textContent = THEME_WORD[v];
}
let current = 'auto';
function initTheme() {
  current = readTheme();
  applyTheme(current);
  const btn = document.querySelector('[data-action="theme"]');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => {
    current = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    try { localStorage.setItem(THEME_KEY, current); } catch (e) { /* private window: the choice lasts this page */ }
    applyTheme(current);
    document.dispatchEvent(new CustomEvent('obs:theme'));
  });
}

/* ---------------------------------------------------------- boot */

/** Load the named datasets through js/data.js, index them, render. A failure
 *  is shown in place by js/data.js's renderError; nothing is substituted. */
export async function boot(names, render, { part } = {}) {
  initTheme();
  markCurrent();
  const asof = document.getElementById('asof');
  if (asof) asof.textContent = 'Read ' + F.humanDate(TODAY);
  const mount = document.getElementById('view');
  if (!names.includes('brief')) names = [...names, 'brief'];
  try {
    const db = await loadAll(names);
    const ix = index(db);
    renderRail(db, part);
    await render(db, ix, mount);
    fillOnPage(mount);
  } catch (err) {
    renderError(mount, err, () => boot(names, render, { part }));
  }
}

/** The section list on the left marks the page being read. A view is a
 *  file plus its one defining parameter (the regulation's id, the
 *  analytical view's mode), with the same defaults the views apply. */
function markCurrent() {
  const key = (u) => {
    const file = u.pathname.split('/').pop() || 'index.html';
    const q = u.searchParams;
    if (file === 'regulation.html') return file + '?' + (q.get('id') || 'ai-act');
    if (file === 'timeline.html') return file + '?' + (q.get('mode') === 'network' ? 'network' : 'timeline');
    return file;
  };
  const here = key(new URL(location.href));
  for (const a of document.querySelectorAll('#sidenav a')) {
    if (key(new URL(a.href)) === here) a.setAttribute('aria-current', 'page');
  }
}

/** "On this page", on the right, built from the headings actually rendered,
 *  so it cannot list a section the page does not have. */
export function fillOnPage(mount) {
  const box = document.getElementById('onpage');
  if (!box) return;
  const hs = [...mount.querySelectorAll('h2[id]')].filter((h) => !h.closest('[hidden]'));
  if (hs.length < 3) { box.hidden = true; document.body.classList.add('no-onpage'); return; }
  box.hidden = false;
  box.querySelector('ol').innerHTML = hs.map((h) => `<li><a href="#${esc(h.id)}">${esc(h.textContent)}</a></li>`).join('');
}

export const section = (id, title, body, cls = '') =>
  `<section${cls ? ` class="${cls}"` : ''} aria-labelledby="${id}"><h2 id="${id}">${esc(title)}</h2>${body}</section>`;

export const empty = (what, where = '') => `<p class="empty"><b>${what}</b>${where ? ' ' + where : ''}</p>`;

/* ---------------------------------------------------------- cards
   Tabler's anatomy, rewritten: a label, a value, a change. The value is
   never 0 by default and an unknown never enters it; the "change" line
   appears only where dated records give a change, with its window stated —
   the record keeps no earlier reading of a count, so none is invented. */

export function card({ label: lab, value, unit = '', change, note = '', tone = '' }) {
  return `<div class="card${tone ? ' ' + tone : ''}">
    <p class="card-label">${esc(lab)}</p>
    <p class="card-value">${value}${unit ? ` <span class="card-unit">${esc(unit)}</span>` : ''}</p>
    ${change == null ? '' : `<p class="card-change">${change}</p>`}
    ${note ? `<p class="card-note">${note}</p>` : ''}
  </div>`;
}

/* ---------------------------------------------------------- sortable tables
   A real <table> with a caption and th scope; each sortable column header
   holds a <button>, so sorting is reached and used from the keyboard; the
   current order is announced through aria-sort. Rows are re-ordered, never
   re-rendered from another source. Below 52rem the stylesheet stacks the
   table (each cell carries its column's name in data-label). */

export function sortableTable({ id, caption, cols, rows, empty: emptyHtml = '', cls = '' }) {
  /* cols: [{ key, label, sort: 'text'|'num'|'date'|false }]
     rows: [{ cells: { key: html }, keys: { key: sortValue }, attrs }] */
  const head = cols.map((c, i) => c.sort
    ? `<th scope="col" aria-sort="none" data-col="${i}"><button type="button" data-sort="${i}">${esc(c.label)}<span class="sort-ind" aria-hidden="true"></span></button></th>`
    : `<th scope="col">${esc(c.label)}</th>`).join('');
  const body = rows.length
    ? rows.map((r) => `<tr${r.attrs || ''}>${cols.map((c, i) => {
      const v = r.keys && r.keys[c.key] != null ? ` data-v="${esc(r.keys[c.key])}"` : '';
      const cell = r.cells[c.key];
      return i === 0 && r.rowHeader
        ? `<th scope="row" data-label="${esc(c.label)}"${v}>${cell}</th>`
        : `<td data-label="${esc(c.label)}"${v}>${cell}</td>`;
    }).join('')}</tr>`).join('')
    : `<tr><td colspan="${cols.length}" data-label="">${emptyHtml || notRecorded('no row')}</td></tr>`;
  return `<div class="tbl-wrap"><table class="data${cls ? ' ' + cls : ''}" id="${esc(id)}"><caption>${caption}</caption>
    <thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/** Wire every sortable header under `root`. A missing value (no data-v)
 *  sorts last in both directions: it is never compared as 0 or as "". */
export function wireSort(root, cols) {
  for (const btn of root.querySelectorAll('button[data-sort]')) {
    if (btn.dataset.bound) continue;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const table = btn.closest('table');
      const i = +btn.dataset.sort;
      const th = btn.closest('th');
      const dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
      for (const o of table.querySelectorAll('thead th[aria-sort]')) o.setAttribute('aria-sort', 'none');
      th.setAttribute('aria-sort', dir);
      const kind = (cols && cols[i] && cols[i].sort) || 'text';
      const tb = table.tBodies[0];
      const rows = [...tb.rows];
      const val = (tr) => { const c = tr.cells[i]; return c && c.hasAttribute('data-v') ? c.getAttribute('data-v') : null; };
      rows.sort((a, b) => {
        const x = val(a), y = val(b);
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        const r = kind === 'num' ? (+x) - (+y) : String(x).localeCompare(String(y));
        return dir === 'ascending' ? r : -r;
      });
      for (const r of rows) tb.appendChild(r);
      const live = document.getElementById('sort-status');
      if (live) live.textContent = `${table.caption ? table.caption.textContent.split('.')[0] : 'Table'}: sorted by ${btn.textContent.trim()}, ${dir}.`;
    });
  }
}

/* ---------------------------------------------------------- a chart beside its table
   Horizontal bars in SVG, drawn here; the same numbers are in the table
   beside it, so no value is read only from a shape or only with a pointer.
   Series are told apart by fill pattern and by the words in the table, not
   by colour alone. A row whose value is not recorded draws no bar and says
   so; it is never drawn as a bar of zero length. */

let chartSeq = 0;
export function barChart({ title, rows, max, unitWord = '' }) {
  const pid = 'ch' + (++chartSeq);
  /* rows: [{ label, value (number|null), pattern: 'solid'|'hatch'|'dots' }] */
  const W = 330, rowH = 26, labelW = 118, H = rows.length * rowH + 8;
  const m = max || Math.max(1, ...rows.map((r) => r.value || 0));
  const bars = rows.map((r, i) => {
    const y = 4 + i * rowH;
    const lab = `<text class="ch-label" x="${labelW - 8}" y="${y + rowH / 2 + 4}" text-anchor="end">${esc(r.label)}</text>`;
    if (r.value == null) return lab + `<text class="ch-nr" x="${labelW}" y="${y + rowH / 2 + 4}">not recorded</text>`;
    const w = Math.max(r.value > 0 ? 2 : 0, (W - labelW - 40) * r.value / m);
    const fill = r.pattern === 'hatch' || r.pattern === 'dots' ? ` fill="url(#${pid}-${r.pattern})"` : '';
    return lab + `<rect class="ch-bar ${r.pattern || 'solid'}"${fill} x="${labelW}" y="${y + 4}" width="${w.toFixed(1)}" height="${rowH - 9}"/>` +
      `<text class="ch-val" x="${(labelW + w + 6).toFixed(1)}" y="${y + rowH / 2 + 4}">${esc(r.value)}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}${unitWord ? ' (' + esc(unitWord) + ')' : ''}; the values are in the table beside it">
    <defs>
      <pattern id="${pid}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="ch-hatch-bg" width="6" height="6"/><line class="ch-hatch" x1="0" y1="0" x2="0" y2="6"/></pattern>
      <pattern id="${pid}-dots" width="5" height="5" patternUnits="userSpaceOnUse"><rect class="ch-hatch-bg" width="5" height="5"/><circle class="ch-dot" cx="2.5" cy="2.5" r="1.2"/></pattern>
    </defs>${bars}</svg>`;
}

/** A figure that puts a chart and its table side by side (stacked below
 *  60rem), with one caption naming both. */
export const chartWithTable = (caption, chart, table) =>
  `<figure class="chart-pair"><figcaption>${caption}</figcaption><div class="chart-pair-grid"><div class="chart-box">${chart}</div><div>${table}</div></div></figure>`;

/** Count items by a key, keeping absent keys as their own bucket (null),
 *  never folded into another. */
export function countBy(items, key) {
  const m = new Map();
  for (const x of items) { const k = key(x); m.set(k, (m.get(k) || 0) + 1); }
  return m;
}

/** Days between two ISO dates (b − a). */
export const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/** The date twelve months before `iso`. */
export function yearBefore(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString().slice(0, 10);
}
