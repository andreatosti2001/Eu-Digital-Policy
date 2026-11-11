/* ============================================================
   PV2-03 · the Editorial prototype — what the four views share.

   Every dataset comes through js/data.js, the site's single fetch point,
   which resolves data/ against itself: the prototype reads the canonical
   JSON in place and holds no copy. Derivations are imported, never
   re-implemented (docs/DATA-GOVERNANCE.md §1.2): js/format.js,
   js/pipeline.js, js/evidence-model.js, js/status.js.

   Two absences are kept apart everywhere (AGENTS.md rules 5 and 6):
     notRecorded()  null — the field was never researched or filled
     unknown()      researched, and not publicly determinable
   Neither is ever written as 0, and neither enters a sum.
   ============================================================ */

import { loadAll, index, renderError, label } from '../../js/data.js';
import * as F from '../../js/format.js';

export { F, label };

export const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const notRecorded = (what = 'not recorded') => `<span class="nr">${esc(what)}</span>`;
export const unknown = (what = 'unknown') => `<span class="unk">${esc(what)}</span>`;
export const tag = (text, tone = '') => `<span class="tag${tone ? ' ' + tone : ''}">${esc(text)}</span>`;

/** A list's honest emptiness: present-but-empty and absent read the same
 *  way ("not recorded"), never as "none" and never silently. */
export const has = (x) => Array.isArray(x) && x.length > 0;

/** The tone of a legislative status tag. The word is the taxonomy's label;
 *  the colour is a second signal, never the only one. */
export function statusTone(statusId) {
  const s = String(statusId || '').split(':').pop();
  if (['applicable', 'in-force'].includes(s)) return 'ok';
  if (['repealed', 'withdrawn', 'transposition-overdue'].includes(s)) return 'crit';
  if (['proposal', 'political-agreement'].includes(s)) return '';
  return 'warn';
}

export function statusTag(ix, statusId) {
  if (!statusId) return notRecorded('status not recorded');
  return tag(label(ix, statusId), statusTone(statusId));
}

/** Evidence status, derived by js/evidence-model.js through js/format.js. */
export function evidenceTag(claim) {
  const s = F.evidenceStatus(claim);
  const tone = s === 'evidence:direct' ? 'ok' : s === 'evidence:disputed' ? 'crit' : s === 'evidence:unverified' ? 'warn' : '';
  return tag(F.EVIDENCE_WORD[s] || s, tone);
}

/** A date at the precision it was published — and a word when the day is not
 *  established, so "December 2027" is not read as "1 December 2027". */
export function dateText(iso, precision) {
  if (!iso) return notRecorded('date not recorded');
  const p = String(precision || '').split(':').pop();
  const d = esc(F.humanDate(iso, precision));
  return p === 'month' ? d + ' <span class="meta">(day not established)</span>' : d;
}

export const regulationHref = (id) => 'regulation.html?id=' + encodeURIComponent(id);

export function instrumentName(ix, id) {
  const i = ix.instrument.get(id);
  return i ? i.short_name : null;
}

export function instrumentLink(ix, id) {
  const name = instrumentName(ix, id);
  return name ? `<a href="${regulationHref(id)}">${esc(name)}</a>` : `<code>${esc(id)}</code> ${notRecorded('no such instrument')}`;
}

/** "GDPR Art. 22" from "gdpr:art-22", read from the instrument's own
 *  provision record where one exists. */
export function provisionText(ix, pid) {
  const p = ix.provision.get(pid);
  const owner = instrumentName(ix, ix.provisionOwner.get(pid) || String(pid).split(':')[0]);
  if (p && p.number) return esc((owner ? owner + ' ' : '') + 'Art. ' + p.number);
  /* not in the instrument's provision list: shown as its id, not guessed */
  const [inst, art] = String(pid).split(':');
  return esc(instrumentName(ix, inst) || inst) + ' <code>' + esc(art || pid) + '</code>';
}

/** A source in its short, reader-facing form, linked where it has a URL. */
export function sourceShort(ix, ref, { locator = true } = {}) {
  const id = typeof ref === 'string' ? ref : ref && ref.source_id;
  const src = ix.source.get(id);
  if (!src) return `<code>${esc(id)}</code> ${notRecorded('source record not found')}`;
  const title = esc(src.title);
  const head = src.url ? `<a href="${esc(src.url)}">${title}</a>` : `${title} <span class="meta">(no public URL located)</span>`;
  const loc = locator && ref && typeof ref === 'object' && ref.locator ? ` — ${esc(ref.locator)}` : '';
  return head + loc;
}

/* ---------------------------------------------------------- the theme */

const THEME_KEY = 'pv2-03-editorial-theme';
const THEMES = ['auto', 'light', 'dark'];

function readTheme() {
  try { const v = localStorage.getItem(THEME_KEY); return THEMES.includes(v) ? v : 'auto'; } catch (e) { return 'auto'; }
}
function applyTheme(v) {
  if (v === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', v);
  const btn = document.querySelector('[data-action="theme"]');
  if (btn) btn.textContent = 'Theme: ' + v;
}
let current = 'auto';
export function initTheme() {
  current = readTheme();
  applyTheme(current);
  const btn = document.querySelector('[data-action="theme"]');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => {
    current = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    try { localStorage.setItem(THEME_KEY, current); } catch (e) { /* private window: the choice lasts this page */ }
    applyTheme(current);
  });
}

/* ---------------------------------------------------------- boot */

/** Load the named datasets through js/data.js, index them, render. A failure
 *  is shown in place by js/data.js's renderError, and nothing is substituted. */
/** The column of Roman numerals: the parts of the brief, in their order, from
 *  data/brief.json — kept from the site (roadmap §8, 11 Nov 2026). Part V opens
 *  the article view; every other part opens in the current site. */
export function renderRail(db, current) {
  const rail = document.getElementById('rail');
  const parts = db.brief?.parts;
  if (!rail || !has(parts)) return;
  rail.innerHTML = '<ol>' + parts.map((p) => {
    const href = p.id === 'part-5' ? 'article.html' : '../../index.html#' + encodeURIComponent(p.id);
    const word = p.kind === 'annex' ? 'Annex' : 'Part';
    const name = `${word} ${p.roman || ''}${p.title ? ': ' + p.title : ''}`;
    return `<li${p.kind === 'annex' && p.roman === 'A' ? ' class="annex"' : ''}><a href="${href}" aria-label="${esc(name)}" title="${esc(name)}"${p.id === current ? ' aria-current="page"' : ''}>${esc(p.roman || '?')}</a></li>`;
  }).join('') + '</ol>';
}

export async function boot(names, render, { part } = {}) {
  initTheme();
  const mount = document.getElementById('view');
  if (!names.includes('brief')) names = [...names, 'brief'];
  try {
    const db = await loadAll(names);
    const ix = index(db);
    renderRail(db, part);
    await render(db, ix, mount);
  } catch (err) {
    renderError(mount, err, () => boot(names, render));
  }
}

/** Build the "On this page" list from the headings actually rendered, so it
 *  cannot list a section the page does not have. */
export function fillToc(mount, toc) {
  if (!toc) return;
  const hs = [...mount.querySelectorAll('h2[id]')].filter((h) => !h.closest('.toc') && !h.closest('.thread'));
  if (hs.length < 2) { toc.querySelector('nav')?.remove(); if (!toc.children.length) toc.remove(); return; }
  toc.querySelector('ol').innerHTML = hs.map((h) => `<li><a href="#${esc(h.id)}">${esc(h.textContent)}</a></li>`).join('');
}
