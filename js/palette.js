/* ============================================================
   THE COMMAND PALETTE — one implementation, every page.
   ------------------------------------------------------------
   Search used to exist on the brief and nowhere else. The entity
   index (js/search.js) was already global — 450-odd records built
   from the canonical JSON — but the only surface that could reach
   it was a palette hard-wired into app.js, which the five tool
   pages do not load. So on the enforcement page you could not
   search for an enforcement record.

   This module owns the palette everywhere. The brief keeps its
   prose search by registering a *provider* rather than by keeping
   a second palette: app.js hands over a function that returns
   passage and reference hits, and this file renders them in the
   same list, with the same keyboard model and the same dialog
   contract, below the entity answers.

   Two behaviours carried over deliberately, because both were
   bugs once and the fixes are load-bearing:

   1. The selected row is addressed by data-i, never by position
      among the container's children. Group headings share that
      container; counting them made the highlighted row and the row
      Enter opened drift apart by up to nine positions.
   2. An entity that carries an unverified state says so in the
      result row. Search results are held to the same evidentiary
      standard as the pages they lead to.
   ============================================================ */

import { createDialog } from './dialog.js';
import { initSearch } from './search.js';

const KIND_MARK = {
  concept: '§', instrument: '■', provision: '¶', authority: '◆',
  institution: '◇', enforcement: '⚖', date: '◔', claim: '“',
  obligation: '→', actor: '△', passage: '¶', definition: '§',
};

const esc = (s) => String(s == null ? '' : s)
  .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function snippet(text, q) {
  text = String(text == null ? '' : text);
  const i = q ? text.toLowerCase().indexOf(String(q).toLowerCase()) : -1;
  if (i < 0) return esc(text.slice(0, 110)) + (text.length > 110 ? '…' : '');
  const s = Math.max(0, i - 45), e = Math.min(text.length, i + q.length + 65);
  return (s > 0 ? '…' : '') + esc(text.slice(s, i)) + '<mark>' + esc(text.slice(i, i + q.length)) +
    '</mark>' + esc(text.slice(i + q.length, e)) + (e < text.length ? '…' : '');
}

/* ---------------------------------------------------------- markup */

const SEARCH_SVG =
  '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="17" height="17" fill="none" ' +
  'stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/>' +
  '<line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

function ensureDom() {
  let scrim = document.getElementById('cmdkScrim');
  if (scrim) {
    /* the brief ships the palette shell in its HTML; it predates the type
       filter and the scope readout, so those are added rather than assumed */
    const box = scrim.querySelector('.cmdk');
    if (box && !scrim.querySelector('#cmdkFilters')) {
      const f = document.createElement('div');
      f.className = 'cmdk-filters'; f.id = 'cmdkFilters';
      f.setAttribute('role', 'group');
      f.setAttribute('aria-label', 'Filter results by type');
      box.insertBefore(f, scrim.querySelector('#cmdkResults'));
    }
    const hint = scrim.querySelector('.cmdk-hint');
    if (hint && !scrim.querySelector('#cmdkScope')) {
      const sp = document.createElement('span');
      sp.className = 'cmdk-scope'; sp.id = 'cmdkScope';
      hint.appendChild(sp);
    }
    return scrim;
  }
  scrim = document.createElement('div');
  scrim.className = 'cmdk-scrim';
  scrim.id = 'cmdkScrim';
  scrim.innerHTML =
    '<div class="cmdk">' +
      '<div class="cmdk-input-wrap">' + SEARCH_SVG +
        '<input id="cmdkInput" type="text" placeholder="Search instruments, articles, authorities, cases, dates…" ' +
        'aria-label="Search the record"/>' +
        '<span class="cmdk-esc">ESC</span>' +
      '</div>' +
      '<div class="cmdk-filters" id="cmdkFilters" role="group" aria-label="Filter results by type"></div>' +
      '<div class="cmdk-results" id="cmdkResults"></div>' +
      '<div class="cmdk-hint"><span><kbd>↑↓</kbd> move</span><span><kbd>↵</kbd> open</span>' +
      '<span><kbd>esc</kbd> close</span><span class="cmdk-scope" id="cmdkScope"></span></div>' +
    '</div>';
  document.body.appendChild(scrim);
  return scrim;
}

/* ---------------------------------------------------------- the module */

let scrim, panel, input, results, filters, statusEl, scopeEl, dialog;
let items = [], sel = 0, kindFilter = null, lastQuery = '';
let entities = null;              /* { query } once search.js has loaded */
let prose = null;                 /* optional provider, registered by the brief */
let announceTimer = null;

/** The brief registers its passage/definition search here. app.js is a classic
    script and cannot import, so it may also just set window.__EU_PROSE_SEARCH__;
    both routes end in the same provider slot. */
export function registerProse(fn) { prose = fn; if (isOpen()) render(input.value.trim()); }

const isOpen = () => !!dialog && dialog.isOpen;

function announce(msg) {
  if (!statusEl) return;
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { statusEl.textContent = msg; }, 220);
}

function collect(q) {
  const groups = [];
  const ql = q.trim().toLowerCase();

  if (ql && entities) {
    try {
      for (const g of entities.query(q)) {
        groups.push({
          kind: g.kind,
          label: g.label,
          items: g.items.map((it) => ({
            kind: it.kind, id: it.id, href: it.href, gloss: it.gloss,
            mark: KIND_MARK[it.kind] || '○',
            title: it.title, sub: snippet(it.sub || '', q),
            badge: it.badge, note: it.note,
          })),
        });
      }
    } catch (err) { console.error('[palette] entity query failed', err); }
  }

  if (prose) {
    try {
      for (const g of prose(q) || []) if (g.items && g.items.length) groups.push(g);
    } catch (err) { console.error('[palette] prose provider failed', err); }
  }
  return groups.filter((g) => g.items.length);
}

/* the type filter is only offered once there is something to filter */
function paintFilters(groups) {
  if (!filters) return;
  if (groups.length < 2) { filters.innerHTML = ''; filters.hidden = true; return; }
  filters.hidden = false;
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  let out = '<button type="button" class="cmdk-filter" data-k="" aria-pressed="' +
    (kindFilter ? 'false' : 'true') + '">All <i>' + total + '</i></button>';
  for (const g of groups) {
    out += '<button type="button" class="cmdk-filter" data-k="' + esc(g.kind || g.label) +
      '" aria-pressed="' + ((g.kind || g.label) === kindFilter ? 'true' : 'false') + '">' +
      esc(g.label) + ' <i>' + g.items.length + '</i></button>';
  }
  filters.innerHTML = out;
}

function render(q) {
  lastQuery = q;
  const all = collect(q);
  paintFilters(all);
  const groups = kindFilter ? all.filter((g) => (g.kind || g.label) === kindFilter) : all;

  items = [];
  for (const g of groups) for (const it of g.items) items.push(it);
  sel = 0;

  if (!items.length) {
    results.innerHTML = q
      ? '<div class="state" data-kind="empty"><h3>No matches</h3>' +
        '<p>Nothing in the record matches &ldquo;' + esc(q) + '&rdquo;.' +
        (kindFilter ? ' A type filter is active — clearing it may help.' : '') +
        ' Try an instrument (<b>DMA</b>), an article (<b>Article 34</b>), a body (<b>AI Office</b>), ' +
        'a company (<b>Amazon</b>) or a year (<b>2027</b>).</p></div>'
      : '<div class="state" data-kind="empty"><h3>Search the whole record</h3>' +
        '<p>Instruments, provisions, institutions, competences, enforcement actions, dated events, ' +
        'claims and their sources — about ' + (entities ? entities.count() : '450') +
        ' records, plus the text of the brief.</p></div>';
    input.removeAttribute('aria-activedescendant');
    announce('No matches');
    return;
  }

  let out = '', idx = 0;
  groups.forEach((g, gi) => {
    out += '<div class="cmdk-group" id="cmdk-g' + gi + '" role="presentation">' + esc(g.label) + '</div>';
    for (const it of g.items) {
      out += '<div class="cmdk-item' + (idx === 0 ? ' sel' : '') + '" role="option" tabindex="-1"' +
        ' id="cmdk-i' + idx + '" data-i="' + idx + '" aria-selected="' + (idx === 0) + '"' +
        (it.kind ? ' data-kind="' + esc(it.kind) + '"' : '') + '>' +
        '<span class="cr">' + esc(it.mark || it.roman || '○') + '</span>' +
        '<span class="cbody"><span class="ct">' + esc(it.title) +
          (it.badge ? ' <span class="cbadge">' + esc(it.badge) + '</span>' : '') +
          (it.note ? ' <span class="cbadge unver">' + esc(it.note) + '</span>' : '') +
        '</span><span class="cs">' + (it.sub || '') + '</span></span></div>';
      idx++;
    }
  });
  results.innerHTML = out;
  input.setAttribute('aria-activedescendant', 'cmdk-i0');
  announce(items.length + ' result' + (items.length === 1 ? '' : 's') +
    ' in ' + groups.length + ' group' + (groups.length === 1 ? '' : 's') +
    '. ' + (items[0] ? items[0].title : ''));
}

function paintSel() {
  const rows = results.querySelectorAll('.cmdk-item');
  for (const row of rows) {
    const on = Number(row.dataset.i) === sel;
    row.classList.toggle('sel', on);
    row.setAttribute('aria-selected', String(on));
    if (on) { row.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', row.id); }
  }
  const cur = items[sel];
  if (cur) announce(cur.title + (cur.badge ? ', ' + cur.badge : ''));
}

function activate(it) {
  if (!it) return;
  dialog.close();
  if (typeof it.action === 'function') { it.action(); return; }

  if (it.gloss) {
    /* the brief owns the glossary panel; elsewhere the term is a destination */
    if (typeof window.__EU_OPEN_GLOSSARY__ === 'function') { window.__EU_OPEN_GLOSSARY__(it.gloss); return; }
    location.href = 'index.html#gloss-' + it.gloss;
    return;
  }
  const here = location.pathname.split('/').pop() || 'index.html';
  const target = it.href || (it.id ? '#' + it.id : null);
  if (!target) return;
  const [file, hash] = target.split('#');
  if ((file === '' || file === here) && hash) {
    if (typeof window.__EU_JUMP__ === 'function') window.__EU_JUMP__(hash);
    else {
      const node = document.getElementById(hash);
      if (node) { node.scrollIntoView({ block: 'start' }); location.hash = hash; }
      else location.hash = hash;
    }
    return;
  }
  location.href = target;
}

export async function initPalette(opts = {}) {
  prose = opts.prose || window.__EU_PROSE_SEARCH__ || null;
  scrim = ensureDom();
  panel = scrim.querySelector('.cmdk');
  input = scrim.querySelector('#cmdkInput');
  results = scrim.querySelector('#cmdkResults');
  filters = scrim.querySelector('#cmdkFilters');
  scopeEl = scrim.querySelector('#cmdkScope');

  /* combobox semantics: the input owns the listbox, and the active row is
     announced through aria-activedescendant rather than by moving focus */
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'true');
  input.setAttribute('aria-controls', 'cmdkResults');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('autocomplete', 'off');
  results.setAttribute('role', 'listbox');
  results.setAttribute('aria-label', 'Results');

  statusEl = document.createElement('div');
  statusEl.className = 'sr-only';
  statusEl.setAttribute('role', 'status');
  statusEl.setAttribute('aria-live', 'polite');
  results.parentNode.insertBefore(statusEl, results.nextSibling);

  /* the scrim is display:none until .show; the dialog primitive also sets
     hidden, and the two must not fight — the primitive wins, the class
     stays for the existing styling */
  dialog = createDialog(panel, scrim, { label: 'Search the record' });
  const openBtns = [...document.querySelectorAll('#openSearch, [data-open-search]')];
  for (const b of openBtns) b.addEventListener('click', () => dialog.open(b));

  const origOpen = dialog.open.bind(dialog);
  dialog.open = (t) => {
    scrim.classList.add('show');
    origOpen(t);
    input.value = '';
    kindFilter = null;
    render('');
  };
  const origClose = dialog.close.bind(dialog);
  dialog.close = () => { scrim.classList.remove('show'); origClose(); };

  input.addEventListener('input', () => render(input.value.trim()));
  results.addEventListener('click', (e) => {
    const row = e.target.closest('.cmdk-item');
    if (row) activate(items[Number(row.dataset.i)]);
  });
  filters.addEventListener('click', (e) => {
    const b = e.target.closest('.cmdk-filter');
    if (!b) return;
    kindFilter = b.dataset.k || null;
    render(lastQuery);
    input.focus();
  });

  document.addEventListener('keydown', (e) => {
    const open = isOpen();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); open ? dialog.close() : dialog.open(); return;
    }
    if (!open) {
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' &&
          !e.target.isContentEditable) { e.preventDefault(); dialog.open(); }
      return;
    }
    if (e.key === 'Escape' || e.key === 'Tab') return;   /* owned by the dialog primitive */
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); paintSel(); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); paintSel(); return; }
    if (e.key === 'Home' && items.length) { e.preventDefault(); sel = 0; paintSel(); return; }
    if (e.key === 'End' && items.length) { e.preventDefault(); sel = items.length - 1; paintSel(); return; }
    if (e.key === 'Enter') { e.preventDefault(); activate(items[sel]); }
  });

  window.__EU_PALETTE__ = {
    open: () => dialog.open(), close: () => dialog.close(), registerProse, snippet, esc,
  };

  /* the index loads asynchronously; an open palette repaints when it lands */
  if (opts.entities !== false) {
    try {
      const n = await initSearch();
      entities = window.__EU_ENTITY_SEARCH__;
      if (scopeEl) scopeEl.textContent = n + ' records';
      if (isOpen()) render(input.value.trim());
    } catch (err) {
      console.error('[palette] entity index unavailable', err);
      if (scopeEl) scopeEl.textContent = 'entity index unavailable';
    }
  }
  document.addEventListener('search:entities-ready', () => {
    entities = window.__EU_ENTITY_SEARCH__;
    if (isOpen()) render(input.value.trim());
  });

  return dialog;
}
