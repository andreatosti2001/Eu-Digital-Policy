/* ============================================================
   THE SHARED CHROME
   ------------------------------------------------------------
   Every page but the brief carried a hand-written header. They had
   drifted: the same destination was "Compare instruments" on one
   page and "Compare" on three others, the current page linked to
   itself with no indication that you were already there, the theme
   toggle was five copies of the same eight-line IIFE, there was no
   search anywhere outside the brief, and the skip link pointed at
   #maincontent — an id that existed on one page out of six, so on
   the other five the first thing a keyboard user pressed did
   nothing at all.

   This module owns that chrome. One nav model, one current-page
   rule, one theme control, one search entry point, and a skip link
   that is resolved against the page it is actually on rather than
   assumed.

   It deliberately does NOT take over the brief's own top bar.
   That bar carries the reading lens, the contents tree, the reading
   progress and the language menu, all bound by id in app.js; it is
   a reading instrument, not a site header. On the brief this module
   adds only what was missing there: the destinations, exposed in
   the contents overlay and in the small-screen controls sheet.
   ============================================================ */

import { locales } from './data.js';

/* ---------------------------------------------------------- the nav model
   One list. Order is the conceptual model of the product, not
   alphabetical and not traffic-ranked: what is this → what is in it →
   who runs it → what has it done → what does it mean for me → what is
   any of it based on. */
export const NAV = [
  { id: 'brief',        file: 'index.html',          label: 'The brief',    long: 'The brief' },
  { id: 'instruments',  file: 'instruments.html',    label: 'Instruments',  long: 'Instruments' },
  { id: 'institutions', file: 'institutions.html',   label: 'Institutions', long: 'Institutions' },
  { id: 'enforcement',  file: 'enforcement.html',    label: 'Enforcement',  long: 'Enforcement' },
  { id: 'applies',      file: 'applies.html',        label: 'Applicability',long: 'What applies to me?' },
  { id: 'evidence',     file: 'bibliography.html',   label: 'Evidence',     long: 'Evidence and sources' },
];

/* pages that are not top-level destinations, and which parent they sit under */
const CHILD_OF = { instrument: 'instruments' };

export function currentPage() {
  const b = document.body.dataset.page;
  if (b) return b;
  const f = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const hit = NAV.find((n) => n.file === f);
  return hit ? hit.id : f.replace('.html', '');
}

const el = (tag, attrs, kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;
    else n.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of kids || []) if (c) n.appendChild(c);
  return n;
};

const SEARCH_ICON =
  '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
  '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

/* ---------------------------------------------------------- theme
   The pre-paint bootstrap stays inline in each page (it has to run
   before the first paint or the wrong palette flashes). This owns
   only the control, so there is one implementation of the label,
   the aria state and the persistence. */
const THEME_KEY = 'eupolicy:theme';

function themeButton() {
  const btn = el('button', {
    type: 'button', class: 'chrome-btn', id: 'themeToggle',
    'aria-pressed': document.body.dataset.theme === 'light' ? 'false' : 'true',
  });
  const dot = el('span', { class: 'dot', 'aria-hidden': 'true' });
  const word = el('span', { class: 'chrome-btn-word' });
  const paint = () => {
    const dark = document.body.dataset.theme !== 'light';
    word.textContent = dark ? 'Night' : 'Day';
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.setAttribute('aria-label', dark ? 'Theme: night. Switch to day.' : 'Theme: day. Switch to night.');
  };
  btn.append(dot, word);
  paint();
  btn.addEventListener('click', () => {
    document.body.dataset.theme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(THEME_KEY, document.body.dataset.theme); } catch (e) { /* private mode */ }
    paint();
  });
  return btn;
}

/* ---------------------------------------------------------- language
   The tool pages have no UI translation — only the entity overlay,
   which is keyed on canonical IDs and does translate instrument
   names, statuses and event types. Rather than pretend either that
   the language does not exist or that these pages are translated,
   the chrome carries the language the reader chose on the brief,
   applies it to the entity layer, and says plainly that the
   interface text around it is English. */
async function languageNote() {
  let lang = 'en';
  try { lang = localStorage.getItem('eupolicy:lang') || 'en'; } catch (e) { /* private mode */ }
  if (lang === 'en') return null;
  const reg = await locales();
  const rec = reg.by && reg.by.get(lang);
  if (!rec) return null;                       /* a language we do not ship is not applied */
  document.documentElement.setAttribute('lang', lang);
  const note = el('a', {
    class: 'chrome-btn chrome-lang', href: 'index.html',
    title: 'Record labels follow ' + (rec.name || lang.toUpperCase()) +
           '. The interface text on this page is English.',
  });
  note.innerHTML = '<b>' + lang.toUpperCase() + '</b><span class="chrome-btn-word">· UI EN</span>';
  return note;
}

/* ---------------------------------------------------------- skip link
   Resolved against the page rather than assumed. The target is the
   first of: an explicit [data-skip-target], <main>, .page-head. It
   is given tabindex="-1" so focus actually lands on it, which an id
   alone does not guarantee. */
function fixSkipLink() {
  let link = document.querySelector('a.skip-link');
  const target =
    document.querySelector('[data-skip-target]') ||
    document.querySelector('main') ||
    document.querySelector('.page-head');
  if (!target) return;
  if (!target.id) target.id = 'maincontent';
  target.setAttribute('tabindex', '-1');
  if (!link) {
    link = el('a', { class: 'skip-link', text: 'Skip to content' });
    document.body.insertBefore(link, document.body.firstChild);
  }
  link.setAttribute('href', '#' + target.id);
}

/* ---------------------------------------------------------- the header */
function buildChrome(page) {
  const nav = el('nav', { class: 'chrome-nav', 'aria-label': 'Sections of this project' });
  const parent = CHILD_OF[page] || page;
  for (const n of NAV) {
    const a = el('a', { href: n.file, text: n.label });
    if (n.id === parent) {
      /* aria-current="page" only where it is literally this page; a detail
         page under a section is "true", which is the weaker, correct claim */
      a.setAttribute('aria-current', n.id === page ? 'page' : 'true');
    }
    nav.appendChild(a);
  }

  const search = el('button', {
    type: 'button', class: 'chrome-btn', id: 'openSearch',
    'aria-label': 'Search the record',
    html: SEARCH_ICON + '<span class="chrome-btn-word">Search</span><kbd>⌘K</kbd>',
  });

  const brand = el('a', { href: 'index.html', class: 'chrome-brand', 'aria-label': 'EU Digital Policy — the brief' });
  brand.append(el('span', { class: 'mark', 'aria-hidden': 'true' }), el('b', { text: 'EU Digital Policy' }));

  const tools = el('div', { class: 'chrome-tools' }, [search, themeButton()]);
  const inner = el('div', { class: 'chrome-inner' }, [brand, nav, el('div', { class: 'chrome-sp' }), tools]);
  const header = el('header', { class: 'chrome', role: 'banner' }, [inner]);

  languageNote().then((n) => { if (n) tools.insertBefore(n, tools.firstChild); });
  return header;
}

/* ---------------------------------------------------------- breadcrumbs */
function buildCrumbs(page) {
  const parent = CHILD_OF[page];
  const here = document.body.dataset.crumb || document.title.split('—')[0].trim();
  const items = [el('li', {}, [el('a', { href: 'index.html', text: 'Digital Policy' })])];
  if (parent) {
    const p = NAV.find((n) => n.id === parent);
    if (p) items.push(el('li', {}, [el('a', { href: p.file, text: p.label })]));
  }
  items.push(el('li', {}, [el('span', { 'aria-current': 'page', text: here })]));
  return el('ol', { class: 'crumbs' }, items);
}

/* ---------------------------------------------------------- the brief
   On the brief the destinations go where a reader already looks for
   "where else can I go": the front door, the contents overlay, and
   the small-screen controls sheet. Nothing is added to the top bar,
   which is full. */

/* What each destination is for, in one line. The front door answered
   "what is this" and "what is the state of play" but never "what can
   I do here" — the tools existed and were reachable only from a quiet
   link under a table in Part I. */
const DOOR_BLURB = {
  instruments: 'Compare any set of instruments across eleven dimensions.',
  institutions: 'Who legislates, supervises, fines, and interprets — kept apart.',
  enforcement: 'Every action on record, and how far each one actually travelled.',
  applies: 'Three questions, answered against the rules rather than guessed.',
  evidence: 'Every claim, graded by what carries it. Including the thin ones.',
};

function frontDoor() {
  const cta = document.querySelector('.portal-cta');
  if (!cta || document.querySelector('.portal-doors')) return;
  const wrap = el('nav', { class: 'portal-doors', 'aria-label': 'What you can do here' });
  wrap.appendChild(el('h2', { class: 'doors-label', text: 'What you can do here' }));
  const ul = el('ul', {});
  for (const n of NAV) {
    if (n.id === 'brief') continue;
    const a = el('a', { href: n.file });
    a.append(el('b', { text: n.long }), el('span', { text: DOOR_BLURB[n.id] || '' }));
    ul.appendChild(el('li', {}, [a]));
  }
  wrap.appendChild(ul);
  cta.parentNode.insertBefore(wrap, cta.nextSibling);
}

function briefDestinations() {
  const make = (label) => {
    const wrap = el('nav', { class: 'dest', 'aria-label': label });
    wrap.appendChild(el('span', { class: 'dest-label', text: 'Elsewhere in this project' }));
    const ul = el('ul', {});
    for (const n of NAV) {
      if (n.id === 'brief') continue;
      ul.appendChild(el('li', {}, [el('a', { href: n.file, text: n.long })]));
    }
    wrap.appendChild(ul);
    return wrap;
  };
  const tree = document.querySelector('#treeScrim .tree-full') || document.getElementById('treeScrim');
  if (tree && !tree.querySelector('.dest')) tree.appendChild(make('Other sections'));
  const sheet = document.getElementById('moreSheet');
  if (sheet && !sheet.querySelector('.dest')) sheet.appendChild(make('Other sections (sheet)'));
}

/* ---------------------------------------------------------- boot */
export function initShell() {
  const page = currentPage();
  document.body.dataset.page = page;

  if (page === 'brief') {
    frontDoor();
    briefDestinations();
    fixSkipLink();
    return page;
  }

  /* replace whichever hand-written header this page shipped with */
  const old = document.querySelector('.tool-top, .bib-top');
  const chrome = buildChrome(page);
  if (old) old.replaceWith(chrome);
  else document.body.insertBefore(chrome, document.body.firstChild);

  /* the chrome is a full-bleed bar; the crumbs belong inside the page shell */
  const shell = document.querySelector('.page-shell, .tool-shell, .bib-shell');
  if (shell && !shell.querySelector('.crumbs')) shell.insertBefore(buildCrumbs(page), shell.firstChild);

  fixSkipLink();
  return page;
}
