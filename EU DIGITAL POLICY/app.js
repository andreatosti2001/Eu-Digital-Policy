(function(){
'use strict';
var DATA = window.__CONTENT__;

/* ================= one scroll pass =================
   There were three scroll listeners on this page and they did not
   agree with each other. The first ran on every scroll event and,
   inside it, read documentElement.scrollHeight, clientHeight and
   then every Part's offsetTop — thirteen forced layout reads per
   event, at whatever rate the browser chooses to fire, which on a
   trackpad is faster than the screen refreshes. The second and
   third each set their own timer to do the same offsetTop walk
   again, for progress persistence and for the resume list.

   Now: one passive listener, which does nothing but ask for a frame.
   One frame handler, which reads scroll position once, resolves the
   current Part against a cached offset table, and writes only what
   actually changed. The two pieces of deferred work — remembering
   what has been read, and remembering where you were — hang off the
   same pass rather than off timers of their own.

   The offset table is the only state that can go stale, so it is
   invalidated by the things that actually move the layout: a resize,
   a language swap, a reading-lens change, and the article being
   re-rendered underneath. Nothing here measures during a frame it
   also writes in.
   =============================================================== */
var fill = document.getElementById('progressFill');
var parts = [...document.querySelectorAll('.part')];
var spineLinks = [...document.querySelectorAll('.spine-item')];
var spineByTarget = new Map();
spineLinks.forEach(function(a){
  if (!spineByTarget.has(a.dataset.target)) spineByTarget.set(a.dataset.target, []);
  spineByTarget.get(a.dataset.target).push(a);
});

var offsets = null;          /* cached part offsetTops, index-aligned with parts */
var docSpan = 0;             /* scrollHeight - clientHeight, cached with them */

function measure(){
  var doc = document.documentElement;
  docSpan = doc.scrollHeight - doc.clientHeight;
  offsets = parts.map(function(p){ return p.offsetTop; });
}
function invalidate(){ offsets = null; schedule(); }

/* index of the Part the given document position falls inside */
function partAt(pos){
  if (!offsets) measure();
  var lo = 0;
  for (var i = 0; i < offsets.length; i++){ if (offsets[i] <= pos) lo = i; else break; }
  return lo;
}

var lastPart = -1, lastPct = -1;

/* ---- deferred work, driven by the same pass rather than its own timers ---- */
var DONE_KEY = 'eupolicy:progress';
var RECENTS_KEY = 'eupolicy:recents';
function getVisited(){ try{ return new Set(JSON.parse(localStorage.getItem(DONE_KEY)||'[]')); }catch(e){ return new Set(); } }
function saveVisited(s){ try{ localStorage.setItem(DONE_KEY, JSON.stringify([...s])); }catch(e){} }
var visited = getVisited();
var treeItems = null;        /* queried once, not on every repaint */
function treeList(){
  if (!treeItems) treeItems = [...document.querySelectorAll('.tree-listitem')];
  return treeItems;
}
function paintVisited(){
  spineLinks.forEach(function(a){
    a.classList.toggle('visited', visited.has(a.dataset.target));
  });
  treeList().forEach(function(a){
    a.style.opacity = visited.has(a.dataset.node) ? '' : '.68';
  });
}
function markVisible(){
  if (!offsets) measure();
  var pos = window.scrollY + window.innerHeight * 0.5;
  var changed = false;
  for (var i = 0; i < parts.length; i++){
    if (offsets[i] < pos && !visited.has(parts[i].id)){ visited.add(parts[i].id); changed = true; }
  }
  return changed;
}
function getRecents(){ try{ return JSON.parse(localStorage.getItem(RECENTS_KEY)||'[]'); }catch(e){ return []; } }
function saveRecents(r){ try{ localStorage.setItem(RECENTS_KEY, JSON.stringify(r.slice(0,3))); }catch(e){} }
function pushRecent(id){
  var r = getRecents().filter(function(x){ return x.id!==id; });
  r.unshift({ id:id, ts:Date.now() });
  saveRecents(r);
}
var lastPushed = null, saveTimer = null, recentTimer = null;

/* ---- the single frame handler ---- */
var frameQueued = false;
function frame(){
  frameQueued = false;
  if (!offsets) measure();

  var y = window.scrollY;

  /* progress: only touch the style when the rounded value moves */
  var pct = docSpan > 0 ? Math.min(100, Math.max(0, (y / docSpan) * 100)) : 0;
  var r = Math.round(pct * 10) / 10;
  if (r !== lastPct){ lastPct = r; if (fill) fill.style.width = r + '%'; }

  /* active Part: only touch classes when the Part actually changes */
  var i = partAt(y + 120);
  if (i !== lastPart){
    if (lastPart > -1) (spineByTarget.get(parts[lastPart].id)||[]).forEach(function(a){ a.classList.remove('active'); });
    (spineByTarget.get(parts[i].id)||[]).forEach(function(a){ a.classList.add('active'); });
    lastPart = i;
  }

  clearTimeout(saveTimer);
  saveTimer = setTimeout(function(){
    if (!markVisible()) return;
    saveVisited(visited); paintVisited();
    /* anything else that draws reading progress redraws now, and only now */
    document.dispatchEvent(new CustomEvent('progress:changed', {detail:{visited:visited}}));
  }, 400);

  clearTimeout(recentTimer);
  recentTimer = setTimeout(function(){
    var id = parts[partAt(window.scrollY + 120)].id;
    if (id !== lastPushed){ lastPushed = id; pushRecent(id); }
  }, 1500);
}
function schedule(){
  if (frameQueued) return;
  frameQueued = true;
  requestAnimationFrame(frame);
}

document.addEventListener('scroll', schedule, {passive:true});
window.addEventListener('resize', invalidate, {passive:true});
window.addEventListener('orientationchange', invalidate, {passive:true});
/* the article's height changes when it is translated, when the reading lens
   hides a class of boxes, and when the evidence and calendar layers render */
document.addEventListener('i18n:applied', invalidate);
document.addEventListener('evidence:ready', invalidate);
document.addEventListener('lens:changed', invalidate);
if (window.ResizeObserver){
  var rw = document.querySelector('.readwrap');
  if (rw) new ResizeObserver(invalidate).observe(rw);
}
schedule();
markVisible(); paintVisited();

var resetBtn = document.getElementById('resetProgress');
if (resetBtn) resetBtn.addEventListener('click', function(){
  visited.clear(); saveVisited(visited); paintVisited();
  document.dispatchEvent(new CustomEvent('progress:changed', {detail:{visited:visited}}));
  resetBtn.textContent = 'Cleared';
  setTimeout(function(){ resetBtn.textContent = 'Reset reading progress'; }, 1200);
});

/* ================= scroll-reveal =================
   A group is armed only while it is being revealed, and disarmed the
   moment the reveal has run. Nothing stays hidden waiting on a class
   that may never arrive — see the note in style.css for the eighty-five
   elements that were doing exactly that. ======================== */
var groups = [...document.querySelectorAll('.reveal-group')];
var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var REVEAL_MS = 1100;      /* .55s transition + the longest stagger, with slack */

function disarm(g){ g.classList.remove('armed','in'); }
function reveal(g){
  if (!g.classList.contains('armed')) return;
  requestAnimationFrame(function(){
    g.classList.add('in');
    setTimeout(function(){ disarm(g); }, REVEAL_MS);
  });
}

if (!REDUCE && groups.length && 'IntersectionObserver' in window){
  groups.forEach(function(g){ g.classList.add('armed'); });
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      reveal(e.target);
    });
  }, {
    /* threshold 0: any pixel entering is enough. A ratio threshold cannot be
       relied on here — several .part-body groups are far taller than the
       viewport, and a group that never reaches the ratio never reveals. */
    threshold: 0, rootMargin: '0px 0px -8% 0px'
  });
  groups.forEach(function(g){ io.observe(g); });
  /* whatever is already on screen reveals immediately rather than waiting
     for a scroll that may never come */
  requestAnimationFrame(function(){
    groups.forEach(function(g){
      if (g.getBoundingClientRect().top < window.innerHeight){ io.unobserve(g); reveal(g); }
    });
  });
  /* a hard backstop: nothing may remain armed, whatever the observer does */
  setTimeout(function(){ groups.forEach(disarm); }, 2500);
}

/* ================= reading lens: mechanics / critique / all ================= */
document.querySelectorAll('.lens button').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.lens button').forEach(function(b){ b.setAttribute('aria-pressed','false'); });
    btn.setAttribute('aria-pressed','true');
    document.body.dataset.lens = btn.dataset.lens;
    /* the lens hides whole boxes, so every cached offset below one is wrong */
    document.dispatchEvent(new CustomEvent('lens:changed'));
  });
});

/* ================= system map + node cards -> jump to part ================= */
function jumpTo(id){
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
}
document.querySelectorAll('.map-node').forEach(function(n){
  n.addEventListener('click', function(){ jumpTo(n.dataset.part); });
  n.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); jumpTo(n.dataset.part); } });
});
document.querySelectorAll('.node-card').forEach(function(n){
  n.addEventListener('click', function(){ jumpTo(n.dataset.part); });
});

/* ================= theme toggle (day / night) ================= */
var THEME_KEY = 'eupolicy:theme';
var themeBtn = document.getElementById('themeToggle');
var themeLabel = document.getElementById('themeLabel');
function applyTheme(t){
  document.body.dataset.theme = t;
  if (themeLabel) themeLabel.textContent = t === 'light' ? 'Day' : 'Night';
  try{ localStorage.setItem(THEME_KEY, t); }catch(e){}
}
(function(){
  var saved = null;
  try{ saved = localStorage.getItem(THEME_KEY); }catch(e){}
  if (!saved) saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  applyTheme(saved);
})();
if (themeBtn) themeBtn.addEventListener('click', function(){
  applyTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light');
});

/* ================= modal plumbing, shared =================
   Phase 2 built a proper dialog for the evidence drawer — role, modal
   flag, focus trap, focus restore, background inert — in js/dialog.js.
   The four overlays that predate it never got any of that: the contents
   tree, the glossary panel, the shortcuts card and the palette were
   divs with a class toggled on them. A keyboard reader could tab
   straight out of an open panel into the article behind it and go on
   reading a page they could not see, with no way back and no Escape.

   app.js is a classic script and js/dialog.js is a module, so rather
   than reach across that line this is the same contract implemented
   once here and applied to all four.
   =============================================================== */
var MODAL_INERT = ['.readwrap','.portal','.hero','.sitehead','.spine','.resume-bar'];
var openModals = [];

function modalFocusables(root){
  return [...root.querySelectorAll(
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
    'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(function(el){ return el.offsetParent !== null || el === document.activeElement; });
}

function inertBackground(on){
  MODAL_INERT.forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(el){
      if (el.closest('.cmdk-scrim, .tree-scrim, .gpanel, .shortcuts-scrim')) return;
      if (on){ el.setAttribute('inert',''); el.setAttribute('aria-hidden','true'); }
      else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
    });
  });
}

/**
 * Turn an element into a modal dialog with the behaviour a dialog owes:
 * a name, a modal flag, focus moved in, focus trapped, Escape, and focus
 * returned to whatever opened it.
 */
function makeModal(panel, opts){
  var o = opts || {};
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  if (o.label && !panel.getAttribute('aria-label')) panel.setAttribute('aria-label', o.label);
  var opener = null;

  function isOpen(){ return o.isOpen(); }

  function trap(e){
    if (!isOpen()) return;
    if (e.key === 'Escape'){ e.preventDefault(); api.close(); return; }
    if (e.key !== 'Tab') return;
    var f = modalFocusables(panel);
    if (!f.length){ e.preventDefault(); panel.focus(); return; }
    e.preventDefault();
    var i = f.indexOf(document.activeElement);
    var step = e.shiftKey ? -1 : 1;
    var next = i === -1
      ? (e.shiftKey ? f[f.length-1] : f[0])
      : f[(i + step + f.length) % f.length];
    next.focus();
  }

  var api = {
    panel: panel,
    open: function(){
      if (isOpen()) return;
      opener = document.activeElement;
      o.show();
      openModals.push(api);
      inertBackground(true);
      document.addEventListener('keydown', trap, true);
      var f = modalFocusables(panel);
      if (o.focus && o.focus()) o.focus().focus();
      else if (f.length) f[0].focus();
      else { panel.setAttribute('tabindex','-1'); panel.focus(); }
    },
    close: function(){
      if (!isOpen()) return;
      o.hide();
      openModals = openModals.filter(function(m){ return m !== api; });
      document.removeEventListener('keydown', trap, true);
      if (!openModals.length) inertBackground(false);
      var back = (opener && opener !== document.body && document.contains(opener)) ? opener : o.opener && o.opener();
      if (back) back.focus();
      opener = null;
    },
    toggle: function(){ isOpen() ? api.close() : api.open(); }
  };
  return api;
}

/* ================= Tree-of-Life contents overlay ================= */
var treeScrim = document.getElementById('treeScrim');
var openTreeBtn = document.getElementById('openTree');
var treeCloseBtn = document.getElementById('treeClose');
/* the dialog is the scrim, not the inner panel: the close button is a sibling
   of the panel, and a trap that cannot reach the close button is not a trap */
var treeModal = treeScrim ? makeModal(treeScrim, {
  label: 'Contents',
  isOpen: function(){ return treeScrim.classList.contains('show'); },
  show: function(){ treeScrim.classList.add('show'); },
  hide: function(){ treeScrim.classList.remove('show'); },
  focus: function(){ return treeCloseBtn; },
  opener: function(){ return openTreeBtn; }
}) : null;
function openTree(){ if (treeModal) treeModal.open(); }
function closeTree(){ if (treeModal) treeModal.close(); }
if (openTreeBtn) openTreeBtn.addEventListener('click', openTree);
if (treeCloseBtn) treeCloseBtn.addEventListener('click', closeTree);
if (treeScrim) treeScrim.addEventListener('click', function(e){ if (e.target === treeScrim) closeTree(); });

/* The tree is static once rendered, so the three selector queries that used
   to run on every mouseenter and every mouseleave — up to a hundred a second
   while the pointer crosses the map — are done once and kept as maps. Hover
   then costs a Map lookup and a classList toggle. Two delegated listeners
   replace fifty-two direct ones. */
var TREE_NODES = new Map(), TREE_PATHS = new Map();
(function indexTree(){
  document.querySelectorAll('.tree-node[data-node], .tree-listitem[data-node]').forEach(function(n){
    var id = n.dataset.node;
    if (!TREE_NODES.has(id)) TREE_NODES.set(id, []);
    TREE_NODES.get(id).push(n);
  });
  document.querySelectorAll('.tree-path[data-a], .tree-path[data-b]').forEach(function(p){
    [p.dataset.a, p.dataset.b].forEach(function(id){
      if (!id) return;
      if (!TREE_PATHS.has(id)) TREE_PATHS.set(id, []);
      TREE_PATHS.get(id).push(p);
    });
  });
})();
function highlightNode(id, on){
  (TREE_NODES.get(id) || []).forEach(function(n){ n.classList.toggle('hl', on); });
  (TREE_PATHS.get(id) || []).forEach(function(p){ p.classList.toggle('lit', on); });
}
(function delegateTree(){
  var host = treeScrim || document;
  var hovered = null;
  host.addEventListener('mouseover', function(e){
    var el = e.target.closest && e.target.closest('.tree-node[data-node], .tree-listitem[data-node]');
    var id = el ? el.dataset.node : null;
    if (id === hovered) return;
    if (hovered) highlightNode(hovered, false);
    hovered = id;
    if (id) highlightNode(id, true);
  });
  host.addEventListener('mouseleave', function(){
    if (hovered){ highlightNode(hovered, false); hovered = null; }
  });
  host.addEventListener('focusin', function(e){
    var el = e.target.closest && e.target.closest('.tree-node[data-node], .tree-listitem[data-node]');
    if (!el) return;
    if (hovered) highlightNode(hovered, false);
    hovered = el.dataset.node;
    highlightNode(hovered, true);
  });
  host.addEventListener('click', function(e){
    var el = e.target.closest && e.target.closest('.tree-node[data-node], .tree-listitem[data-node]');
    if (!el) return;
    closeTree(); jumpTo(el.dataset.node);
  });
  host.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest && e.target.closest('.tree-node[data-node], .tree-listitem[data-node]');
    if (!el) return;
    e.preventDefault(); closeTree(); jumpTo(el.dataset.node);
  });
})();

/* ================= the small-screen controls sheet =================
   At 390px the bar measured 614px wide: the language menu, the theme
   toggle, Glossary and Search all sat off the right edge, unreachable.
   Search is the primary tool of the whole product and a phone reader
   could not press it.

   The four secondary controls are *moved* into a sheet below the
   breakpoint and moved back above it. Moving rather than duplicating
   matters: every listener in this file is bound directly to
   #themeToggle, #langToggle and #openGlossary, and listeners travel
   with the element. A second copy would have been a second set of
   ids and a silent divergence.
   =============================================================== */
var moreBtn = document.getElementById('topMore');
var moreScrim = document.getElementById('moreScrim');
var moreSheet = document.getElementById('moreSheet');
var moreModal = null;

if (moreBtn && moreScrim && moreSheet){
  var SMALL = window.matchMedia('(max-width: 860px)');
  var homes = [
    ['msLens',  '.topmid .lens'],
    ['msLang',  '.topmid .langwrap'],
    ['msTheme', '#themeToggle'],
    ['msGloss', '#openGlossary']
  ];
  var origin = new Map();

  function place(small){
    homes.forEach(function(pair){
      var slot = document.getElementById(pair[0]);
      var el = document.querySelector(pair[1]) || origin.get(pair[0]);
      if (!el || !slot) return;
      if (!origin.has(pair[0])){
        origin.set(pair[0], el);
        el.dataset.homeNext = '';
      }
      if (small){
        if (el.parentNode !== slot) slot.appendChild(el);
      } else {
        var mid = document.querySelector('.topmid');
        if (mid && el.parentNode === slot){
          /* back into the bar, before the search button so the order holds */
          var before = document.getElementById('openSearch');
          mid.insertBefore(el, before);
        }
      }
    });
    if (!small && moreModal) moreModal.close();
  }

  moreModal = makeModal(moreSheet, {
    label: 'Controls',
    isOpen: function(){ return !moreScrim.hidden; },
    show: function(){ moreScrim.hidden = false; moreBtn.setAttribute('aria-expanded','true'); },
    hide: function(){ moreScrim.hidden = true;  moreBtn.setAttribute('aria-expanded','false'); },
    opener: function(){ return moreBtn; }
  });
  moreSheet.setAttribute('aria-labelledby','moreSheetTitle');

  moreBtn.addEventListener('click', function(){ moreModal.toggle(); });
  document.getElementById('moreClose').addEventListener('click', function(){ moreModal.close(); });
  moreScrim.addEventListener('click', function(e){ if (e.target === moreScrim) moreModal.close(); });
  /* choosing a language or opening the glossary from the sheet closes it */
  moreSheet.addEventListener('click', function(e){
    if (e.target.closest('#openGlossary, .langmenu li[data-lang]')) moreModal.close();
  });

  place(SMALL.matches);
  if (SMALL.addEventListener) SMALL.addEventListener('change', function(e){ place(e.matches); });
  else SMALL.addListener(function(e){ place(e.matches); });
}

/* ================= glossary: inline popovers + side panel ================= */
var popEl = document.createElement('div');
popEl.className = 'gloss-pop';
popEl.id = 'glossPop';
popEl.setAttribute('role','dialog');
popEl.setAttribute('aria-label','Definition');
document.body.appendChild(popEl);

function glossTextFor(id){
  var entry = document.getElementById('gloss-' + id);
  if (!entry) return null;
  var b = entry.querySelector('b');
  /* the definition is the first span; the graph rows that follow are not it */
  var def = entry.querySelector(':scope > span');
  return {term: b ? b.textContent : id, def: def ? def.textContent : ''};
}
/* delegated, so glossary terms keep working after the text is swapped for a
   translation and the original buttons no longer exist */
document.addEventListener('click', function(e){
  var btn = e.target.closest ? e.target.closest('.gloss') : null;
  if (!btn) return;
  e.stopPropagation();
  var id = btn.dataset.term;
  var g = glossTextFor(id);
  if (!g) return;
  var already = popEl.classList.contains('show') && popEl.dataset.term === id;
  document.querySelectorAll('.gloss[aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
  if (already) { popEl.classList.remove('show'); return; }
  /* the provenance line the glossary graph attached: which instrument the term
     belongs to, the defining article, and any enforcement that turns on it */
  var meta = btn.dataset.termMeta
    ? '<span class="gloss-pop-meta">' + escText(btn.dataset.termMeta) + '</span>' : '';
  popEl.innerHTML = '<b>' + escText(g.term) + '</b>' + escText(g.def) + meta +
    '<a class="gloss-pop-more" href="#gloss-' + encodeURIComponent(id) + '" data-gloss-more="' + escText(id) + '">Open in the glossary</a>';
  popEl.dataset.term = id;
  var r = btn.getBoundingClientRect();
  var top = r.bottom + window.scrollY + 8;
  var left = Math.min(r.left + window.scrollX, window.innerWidth - 336);
  popEl.style.top = top + 'px'; popEl.style.left = Math.max(12,left) + 'px';
  popEl.classList.add('show');
  btn.setAttribute('aria-expanded','true');
});
function escText(s){ return String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
/* Escape closes the popover and returns focus to the term that opened it */
document.addEventListener('keydown', function(e){
  if (e.key !== 'Escape' || !popEl.classList.contains('show')) return;
  var open = document.querySelector('.gloss[aria-expanded="true"]');
  popEl.classList.remove('show');
  if (open){ open.setAttribute('aria-expanded','false'); open.focus(); }
});
popEl.addEventListener('click', function(e){
  var a = e.target.closest('[data-gloss-more]');
  if (!a) return;
  e.preventDefault(); e.stopPropagation();
  popEl.classList.remove('show');
  openPanel();
  var ent = document.getElementById('gloss-' + a.dataset.glossMore);
  if (ent){ ent.scrollIntoView({block:'center'}); ent.classList.add('lit');
    setTimeout(function(){ ent.classList.remove('lit'); }, 1600); }
});
document.addEventListener('click', function(e){
  /* both handlers now sit on document, so this one must not undo the opener */
  if (e.target.closest && e.target.closest('.gloss')) return;
  popEl.classList.remove('show');
  document.querySelectorAll('.gloss[aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
});

var gpanel = document.getElementById('gpanel');
var scrim = document.getElementById('scrim');
var glossBtn = document.getElementById('openGlossary');
var gClose = document.getElementById('gpanelClose');
var glossModal = gpanel ? makeModal(gpanel, {
  label: 'Glossary',
  isOpen: function(){ return gpanel.classList.contains('open'); },
  show: function(){ gpanel.classList.add('open'); if (scrim) scrim.classList.add('show'); },
  hide: function(){ gpanel.classList.remove('open'); if (scrim) scrim.classList.remove('show'); },
  focus: function(){ return gClose; },
  opener: function(){ return glossBtn; }
}) : null;
function openPanel(){ if (glossModal) glossModal.open(); }
function closePanel(){ if (glossModal) glossModal.close(); }
if (glossBtn) glossBtn.addEventListener('click', openPanel);
if (gClose) gClose.addEventListener('click', closePanel);
if (scrim) scrim.addEventListener('click', closePanel);

/* ================= command palette =================
   Two indexes feed one list.

   The prose index is the thirteen Parts and it answers "where does the
   text say this". The entity index — js/search.js, built from the
   canonical JSON — answers the questions prose search cannot: who fines
   under the DMA, which article carries the systemic-risk duty, what
   falls due in December 2027, what has actually been collected. Entity
   groups are rendered first because a reader who types "Article 34"
   wants the provision, not a paragraph that mentions it.

   Selection. The rows and the group headings share one container, so
   the selected row must be addressed by an explicit index rather than
   by position among the container's children. It used to be the latter:
   `cmdkResults.children[selIndex]` counted the "Definitions" and
   "Parts" headings as rows, so from the second group onward the
   highlighted row and the row Enter actually opened were different
   rows. Rows now carry data-i, the highlight is found by that, and
   currentItems[selIndex] is the same object in both paths.

   Semantics. The palette is a modal dialog containing a combobox whose
   listbox is the results. Focus is trapped inside it, the page behind
   is inert, and focus returns to whatever opened it. ============ */
var cmdkScrim = document.getElementById('cmdkScrim');
var cmdkInput = document.getElementById('cmdkInput');
var cmdkResults = document.getElementById('cmdkResults');
var cmdkStatus = null;
var selIndex = 0, currentItems = [];

(function cmdkSemantics(){
  if (!cmdkScrim) return;
  var panel = cmdkScrim.querySelector('.cmdk');
  if (panel){
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-modal','true');
    panel.setAttribute('aria-label','Search the brief and the record');
  }
  if (cmdkInput){
    cmdkInput.setAttribute('role','combobox');
    cmdkInput.setAttribute('aria-expanded','true');
    cmdkInput.setAttribute('aria-controls','cmdkResults');
    cmdkInput.setAttribute('aria-autocomplete','list');
    cmdkInput.setAttribute('autocomplete','off');
    if (!cmdkInput.getAttribute('aria-label')) cmdkInput.setAttribute('aria-label','Search');
  }
  if (cmdkResults){
    cmdkResults.setAttribute('role','listbox');
    cmdkResults.setAttribute('aria-label','Results');
    cmdkStatus = document.createElement('div');
    cmdkStatus.className = 'sr-only';
    cmdkStatus.setAttribute('role','status');
    cmdkStatus.setAttribute('aria-live','polite');
    cmdkResults.parentNode.insertBefore(cmdkStatus, cmdkResults.nextSibling);
  }
})();

/* the same modal contract the tree, the glossary and the shortcuts card use */
var searchBtn = document.getElementById('openSearch');
var cmdkModal = makeModal(cmdkScrim.querySelector('.cmdk') || cmdkScrim, {
  label: 'Search the brief and the record',
  isOpen: function(){ return cmdkScrim.classList.contains('show'); },
  show: function(){ cmdkScrim.classList.add('show'); cmdkInput.value=''; renderResults(''); },
  hide: function(){ cmdkScrim.classList.remove('show'); },
  focus: function(){ return cmdkInput; },
  opener: function(){ return searchBtn; }
});
function openCmdk(){ cmdkModal.open(); }
function closeCmdk(){ cmdkModal.close(); }
searchBtn.addEventListener('click', openCmdk);
cmdkScrim.addEventListener('click', function(e){ if (e.target === cmdkScrim) closeCmdk(); });

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function snippet(text, q){
  text = String(text == null ? '' : text);
  var i = q ? text.toLowerCase().indexOf(String(q).toLowerCase()) : -1;
  if (i < 0) return esc(text.slice(0,110)) + (text.length>110 ? '…' : '');
  var s = Math.max(0, i-45), e = Math.min(text.length, i+q.length+65);
  return (s>0?'…':'') + esc(text.slice(s,i)) + '<mark>' + esc(text.slice(i,i+q.length)) + '</mark>' + esc(text.slice(i+q.length,e)) + (e<text.length?'…':'');
}
/* ---- search index self-heal: some search entries (e.g. annexes) ship with
   an empty text field from the generator; backfill from the rendered DOM so
   they remain searchable without waiting on a content_data.py fix ---- */
DATA.search.forEach(function(s){
  if (!s.text || !s.text.trim()){
    var sec = document.getElementById(s.id);
    var body = sec && sec.querySelector('.part-body');
    if (body) s.text = body.textContent.replace(/\s+/g,' ').trim();
  }
});

/* ---- glossary terms, indexed for search (reuses the existing panel DOM) ---- */
var GLOSS_INDEX = [...document.querySelectorAll('.gloss-entry')].map(function(el){
  var b = el.querySelector('b'), sp = el.querySelector('span');
  return { id: el.id.replace('gloss-',''), term: b ? b.textContent : '', def: sp ? sp.textContent : '' };
});
var ART_RE = /\bart(?:icle|\.)?\s*(\d+)\b/i;

function splitSentences(t){
  return t.replace(/([.?!])\s+(?=[A-Z0-9])/g, '$1|SPLIT|').split('|SPLIT|');
}
function refHitsFor(s, ql, artNum){
  var hits = [];
  splitSentences(s.text).forEach(function(sent){
    var isRef = artNum
      ? new RegExp('article\\s*'+artNum+'\\b','i').test(sent)
      : sent.toLowerCase().indexOf(ql) > -1 && /article\s*\d/i.test(sent);
    if (isRef) hits.push(sent.trim());
  });
  return hits.slice(0,2);
}

/* the entity index publishes itself when its datasets have loaded */
function entitySearch(){ return window.__EU_ENTITY_SEARCH__ || null; }
document.addEventListener('search:entities-ready', function(){
  if (cmdkScrim.classList.contains('show')) renderResults(cmdkInput.value.trim());
});

function renderResults(q){
  var ql = q.trim().toLowerCase();
  var artMatch = q.trim().match(ART_RE);
  var groups = [];
  currentItems = [];

  /* --- entities first: they are answers, not occurrences --- */
  var es = entitySearch();
  if (ql && es){
    try {
      es.query(q).forEach(function(g){
        groups.push([g.label, g.items.map(function(it){
          return {
            kind: it.kind, id: it.id, href: it.href, gloss: it.gloss, claim: it.claim,
            roman: KIND_MARK[it.kind] || '○',
            title: it.title,
            sub: snippet(it.sub || '', q),
            badge: it.badge, note: it.note
          };
        })]);
      });
    } catch (err){ console.error('[search] entity query failed', err); }
  }

  /* --- then the prose --- */
  var defHits = [], refHits = [], passHits = [];
  if (!ql){
    passHits = DATA.search.map(function(s){ return {id:s.id, roman:s.roman, title:s.title, sub:esc(s.dek||'')}; });
  } else {
    GLOSS_INDEX.forEach(function(g){
      if (g.term.toLowerCase().indexOf(ql)>-1 || g.def.toLowerCase().indexOf(ql)>-1){
        defHits.push({gloss:g.id, roman:'§', title:g.term, sub: snippet(g.def, g.term.toLowerCase().indexOf(ql)>-1 ? g.term : q)});
      }
    });
    DATA.search.forEach(function(s){
      refHitsFor(s, ql, artMatch ? artMatch[1] : null).forEach(function(sent){
        refHits.push({id:s.id, roman:s.roman, title:s.title, sub: snippet(sent, artMatch?('Article '+artMatch[1]):q)});
      });
    });
    passHits = DATA.search.filter(function(s){
      return s.title.toLowerCase().indexOf(ql)>-1 || s.text.toLowerCase().indexOf(ql)>-1;
    }).map(function(s){
      var hay = s.title.toLowerCase().indexOf(ql)>-1 ? s.title : s.text;
      return {id:s.id, roman:s.roman, title:s.title, sub: snippet(hay, q)};
    });
  }
  /* the entity index already carries the glossary as first-class concepts, so
     the DOM-scraped definitions are only used when it has not loaded */
  if (!es || !ql) defHits = defHits.slice(0,5); else defHits = [];
  refHits = refHits.slice(0,6);
  passHits = passHits.slice(0, ql ? 10 : 20);

  if (defHits.length) groups.push(['Definitions', defHits]);
  if (refHits.length) groups.push(['References in the text', refHits]);
  if (passHits.length) groups.push([ql ? 'Passages' : 'Parts', passHits]);

  groups = groups.filter(function(g){ return g[1].length; });
  groups.forEach(function(g){ g[1].forEach(function(it){ currentItems.push(it); }); });
  selIndex = 0;

  if (!currentItems.length){
    cmdkResults.innerHTML = '<div class="cmdk-empty">No matches for &ldquo;'+esc(q)+'&rdquo;</div>';
    cmdkInput.removeAttribute('aria-activedescendant');
    announce('No matches');
    return;
  }

  var out = '', idx = 0;
  groups.forEach(function(g, gi){
    out += '<div class="cmdk-group" id="cmdk-g'+gi+'" role="presentation">'+esc(g[0])+'</div>';
    g[1].forEach(function(it){
      out += '<div class="cmdk-item'+(idx===0?' sel':'')+'" role="option" tabindex="-1"'+
        ' id="cmdk-i'+idx+'" data-i="'+idx+'" aria-selected="'+(idx===0)+'"'+
        (it.kind ? ' data-kind="'+esc(it.kind)+'"' : '')+'>'+
        '<span class="cr">'+esc(it.roman)+'</span>'+
        '<span class="cbody"><span class="ct">'+esc(it.title)+
          (it.badge ? ' <span class="cbadge">'+esc(it.badge)+'</span>' : '')+
          (it.note ? ' <span class="cbadge unver">'+esc(it.note)+'</span>' : '')+
        '</span><span class="cs">'+(it.sub||'')+'</span></span></div>';
      idx++;
    });
  });
  cmdkResults.innerHTML = out;
  cmdkInput.setAttribute('aria-activedescendant','cmdk-i0');
  announce(currentItems.length + ' result' + (currentItems.length===1?'':'s') +
    ' in ' + groups.length + ' group' + (groups.length===1?'':'s') +
    '. ' + (currentItems[0] ? currentItems[0].title : ''));
}

var KIND_MARK = {
  concept:'§', instrument:'■', provision:'¶', authority:'◆',
  institution:'◇', enforcement:'⚖', date:'◔', claim:'“',
  obligation:'→', actor:'△'
};

var announceTimer;
function announce(msg){
  if (!cmdkStatus) return;
  clearTimeout(announceTimer);
  announceTimer = setTimeout(function(){ cmdkStatus.textContent = msg; }, 220);
}

function activate(it){
  if (!it) return;
  closeCmdk();
  if (it.gloss){
    openPanel();
    var ent = document.getElementById('gloss-'+it.gloss);
    if (ent){ ent.scrollIntoView({block:'center'}); ent.classList.add('lit'); setTimeout(function(){ ent.classList.remove('lit'); }, 1600); }
    return;
  }
  if (it.href){
    /* a same-page anchor scrolls; anything else is a real navigation */
    var here = location.pathname.split('/').pop() || 'index.html';
    var parts = it.href.split('#');
    if ((parts[0] === '' || parts[0] === here) && parts[1]){ jumpTo(parts[1]); return; }
    location.href = it.href;
    return;
  }
  if (it.id) jumpTo(it.id);
}

cmdkInput.addEventListener('input', function(){ renderResults(cmdkInput.value.trim()); });
cmdkResults.addEventListener('click', function(e){
  var item = e.target.closest('.cmdk-item'); if (!item) return;
  activate(currentItems[Number(item.dataset.i)]);
});

/* the highlight is addressed by data-i, never by child position — group
   headings share the container and would otherwise shift every index */
function paintSel(){
  var rows = cmdkResults.querySelectorAll('.cmdk-item');
  for (var i=0;i<rows.length;i++){
    var on = Number(rows[i].dataset.i) === selIndex;
    rows[i].classList.toggle('sel', on);
    rows[i].setAttribute('aria-selected', String(on));
    if (on){
      rows[i].scrollIntoView({block:'nearest'});
      cmdkInput.setAttribute('aria-activedescendant', rows[i].id);
    }
  }
  var cur = currentItems[selIndex];
  if (cur) announce(cur.title + (cur.badge ? ', ' + cur.badge : ''));
}

document.addEventListener('keydown', function(e){
  var openPalette = cmdkScrim.classList.contains('show');
  if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openPalette ? closeCmdk() : openCmdk(); return; }
  if (!openPalette){
    if (e.key==='/' && e.target.tagName!=='INPUT' && e.target.tagName!=='TEXTAREA' && !e.target.isContentEditable){ e.preventDefault(); openCmdk(); }
    return;
  }
  /* Escape and Tab are handled by the shared modal trap, which runs first */
  if (e.key==='Escape' || e.key==='Tab') return;
  if (e.key==='ArrowDown'){ e.preventDefault(); selIndex=Math.min(selIndex+1,currentItems.length-1); paintSel(); return; }
  if (e.key==='ArrowUp'){ e.preventDefault(); selIndex=Math.max(selIndex-1,0); paintSel(); return; }
  if (e.key==='Home' && currentItems.length){ e.preventDefault(); selIndex=0; paintSel(); return; }
  if (e.key==='End' && currentItems.length){ e.preventDefault(); selIndex=currentItems.length-1; paintSel(); return; }
  if (e.key==='Enter'){ e.preventDefault(); activate(currentItems[selIndex]); }
});

/* ================= hash deep-link on load ================= */
if (location.hash) { setTimeout(function(){ jumpTo(location.hash.slice(1)); }, 60); }

/* ================= resume: last three reading positions =================
   The position is recorded by the single scroll pass at the top of this
   file; getRecents/pushRecent live there with it. Only the rendering of
   the resume bar belongs here. ==================================== */
function timeAgo(ts){
  var s = Math.max(1, Math.round((Date.now()-ts)/1000));
  if (s<60) return 'just now';
  var m = Math.round(s/60); if (m<60) return m+'m ago';
  var h = Math.round(m/60); if (h<24) return h+'h ago';
  return Math.round(h/24)+'d ago';
}
(function renderResume(){
  if (location.hash) return;
  var recents = getRecents(); if (!recents.length) return;
  var dismissed = false; try{ dismissed = !!sessionStorage.getItem('eupolicy:resumeDismissed'); }catch(e){}
  if (dismissed) return;
  var nav = {}; DATA.nav.forEach(function(n){ nav[n.id]=n; });
  var items = recents.map(function(r){ return nav[r.id] ? Object.assign({},nav[r.id],{ts:r.ts}) : null; }).filter(Boolean);
  if (!items.length) return;
  var bar = document.createElement('div');
  bar.className = 'resume-bar';
  bar.innerHTML = '<div class="resume-card"><span class="rc-label">Continue reading</span>'+
    '<div class="resume-list">'+items.map(function(it){
      return '<button class="resume-item" data-id="'+it.id+'"><span class="ri-roman">'+it.roman+'</span> '+esc(it.title.split(':')[0])+' <span class="ri-ago">'+timeAgo(it.ts)+'</span></button>';
    }).join('')+'</div>'+
    '<button class="resume-dismiss" type="button" aria-label="Dismiss">&times;</button></div>';
  var hero = document.querySelector('.hero');
  if (!hero) return;
  hero.parentNode.insertBefore(bar, hero);
  bar.addEventListener('click', function(e){
    var btn = e.target.closest('.resume-item');
    if (btn){ jumpTo(btn.dataset.id); return; }
    if (e.target.closest('.resume-dismiss')){ bar.remove(); try{ sessionStorage.setItem('eupolicy:resumeDismissed','1'); }catch(err){} }
  });
})();

/* ================= pager: previous / next between Parts ================= */
(function buildPagers(){
  DATA.nav.forEach(function(n, i){
    var sec = document.getElementById(n.id);
    if (!sec) return;
    var prev = DATA.nav[i-1], next = DATA.nav[i+1];
    var html = '<div class="pager">';
    html += prev ? '<a class="pg prev" href="#'+prev.id+'"><small>Previous &middot; Part '+prev.roman+'</small><b>'+esc(prev.title.split(':')[0])+'</b></a>' : '<span></span>';
    html += next ? '<a class="pg next" href="#'+next.id+'"><small>Next &middot; Part '+next.roman+'</small><b>'+esc(next.title.split(':')[0])+'</b></a>' : '<span></span>';
    html += '</div>';
    sec.insertAdjacentHTML('beforeend', html);
  });
})();

/* ================= shortcuts overlay + extra keys (g, [, ], ?) ================= */
var shortcutsScrim = document.createElement('div');
shortcutsScrim.className = 'shortcuts-scrim';
shortcutsScrim.innerHTML = '<div class="shortcuts-panel">'+
  '<h2 id="shortcutsTitle">Keyboard shortcuts</h2>'+
  '<dl class="shortcuts-list">'+
  '<div class="shortcuts-row"><dt>Search</dt><dd><kbd>&#8984;K</kbd> <kbd>/</kbd></dd></div>'+
  '<div class="shortcuts-row"><dt>Contents &middot; Tree of Life</dt><dd><kbd>G</kbd></dd></div>'+
  '<div class="shortcuts-row"><dt>Next / previous Part</dt><dd><kbd>]</kbd> <kbd>[</kbd></dd></div>'+
  '<div class="shortcuts-row"><dt>Close anything open</dt><dd><kbd>Esc</kbd></dd></div>'+
  '<div class="shortcuts-row"><dt>This panel</dt><dd><kbd>?</kbd></dd></div>'+
  '</dl>'+
  '<button type="button" class="shortcuts-close" id="shortcutsClose">Close</button></div>';
document.body.appendChild(shortcutsScrim);
var shortcutsModal = makeModal(shortcutsScrim.querySelector('.shortcuts-panel'), {
  label: 'Keyboard shortcuts',
  isOpen: function(){ return shortcutsScrim.classList.contains('show'); },
  show: function(){ shortcutsScrim.classList.add('show'); },
  hide: function(){ shortcutsScrim.classList.remove('show'); }
});
shortcutsScrim.querySelector('.shortcuts-panel').setAttribute('aria-labelledby','shortcutsTitle');
shortcutsScrim.addEventListener('click', function(e){ if (e.target===shortcutsScrim) shortcutsModal.close(); });
document.getElementById('shortcutsClose').addEventListener('click', function(){ shortcutsModal.close(); });

document.addEventListener('keydown', function(e){
  if (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA' || e.target.isContentEditable) return;
  if (cmdkScrim.classList.contains('show') || treeScrim.classList.contains('show') || gpanel.classList.contains('open')) return;
  if (e.key==='?'){ e.preventDefault(); shortcutsModal.toggle(); return; }
  if (shortcutsScrim.classList.contains('show')) return;   /* the modal owns Escape */
  if (e.key.toLowerCase()==='g'){ e.preventDefault(); openTree(); return; }
  if (e.key===']' || e.key==='['){
    e.preventDefault();
    /* the same cached offset table the scroll pass uses */
    var ci = partAt(window.scrollY + 120);
    var t = parts[e.key===']' ? ci+1 : ci-1];
    if (t) jumpTo(t.id);
  }
});

/* ================= THE PORTAL: tree frontispiece, caption, veil transition ========= */
(function(){
  var tree = document.getElementById('portalTree');
  if (!tree) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* give every path its true length so the draw-in unspools rather than guessing */
  tree.querySelectorAll('.pt-path').forEach(function(l){
    try{ l.style.setProperty('--len', Math.ceil(l.getTotalLength())); }catch(e){}
  });

  /* caption: the hovered vessel names itself, with its cost in minutes */
  var cap = document.getElementById('portalCaption');
  var capDefault = cap ? cap.innerHTML : '';
  function showCap(n){
    if (!cap || !n) return;
    cap.innerHTML = '<span class="pc-roman">'+n.dataset.roman+'</span>'+
      '<span class="pc-title">'+n.dataset.title+'</span>'+
      '<span class="pc-mins">'+n.dataset.mins+' min read</span>';
  }
  function clearCap(){ if (cap) cap.innerHTML = capDefault; }

  /* the veil: covers the jump so the reader arrives rather than is thrown */
  var veil = document.createElement('div');
  veil.className = 'veil';
  veil.innerHTML = '<span class="veil-roman"></span><span class="veil-title"></span>';
  document.body.appendChild(veil);
  var vRoman = veil.querySelector('.veil-roman'), vTitle = veil.querySelector('.veil-title');
  var crossing = false;

  function cross(id, roman, title){
    var target = document.getElementById(id);
    if (!target) return;
    if (reduce || crossing){ target.scrollIntoView({behavior:'auto', block:'start'}); return; }
    crossing = true;
    vRoman.textContent = roman || '';
    vTitle.textContent = title || '';
    veil.classList.add('on');
    setTimeout(function(){
      target.scrollIntoView({behavior:'auto', block:'start'});
      setTimeout(function(){
        veil.classList.remove('on');
        crossing = false;
        var h = target.querySelector('h2');
        if (h){ h.setAttribute('tabindex','-1'); h.focus({preventScroll:true}); }
      }, 340);
    }, 520);
  }

  tree.querySelectorAll('.pt-node').forEach(function(n){
    n.addEventListener('mouseenter', function(){ showCap(n); });
    n.addEventListener('focus', function(){ showCap(n); });
    n.addEventListener('mouseleave', clearCap);
    n.addEventListener('blur', clearCap);
    /* capture phase so the veil is raised before the generic handler scrolls */
    n.addEventListener('click', function(e){
      e.stopPropagation(); e.preventDefault();
      cross(n.dataset.node, n.dataset.roman, n.dataset.title);
    }, true);
    n.addEventListener('keydown', function(e){
      if (e.key==='Enter' || e.key===' '){
        e.stopPropagation(); e.preventDefault();
        cross(n.dataset.node, n.dataset.roman, n.dataset.title);
      }
    }, true);
  });

  var beginBtn = document.querySelector('[data-portal-enter]');
  if (beginBtn) beginBtn.addEventListener('click', function(e){
    e.preventDefault();
    cross(beginBtn.getAttribute('data-portal-enter'), 'I',
      'The architecture: how Europe decided to regulate software');
  });

  /* Vessels already read stay lit, so the tree records the journey.

     This used to run on every scroll event, and each run did a synchronous
     localStorage read, a JSON.parse and a querySelectorAll — on the main
     thread, at scroll frequency, to redraw something that changes at most
     thirteen times in a reading. It now redraws when the reading progress
     actually changes, which is what it was always trying to observe. */
  var ptNodes = [...tree.querySelectorAll('.pt-node')];
  function paintPortal(seen){
    if (!seen){
      try{ seen = new Set(JSON.parse(localStorage.getItem('eupolicy:progress')||'[]')); }
      catch(e){ seen = new Set(); }
    }
    ptNodes.forEach(function(n){ n.classList.toggle('visited', seen.has(n.dataset.node)); });
  }
  paintPortal();
  document.addEventListener('progress:changed', function(e){
    paintPortal(e.detail && e.detail.visited);
  });
})();


/* ================= THE ROTA: the compliance dial =================

   What it was: eleven dots spaced evenly around a pale circle, and a
   disc that stepped 1/11 of a turn each time. Evenly spaced meant the
   dial said nothing the table did not already say — the positions
   carried no information — and at hairline weight on vellum it read
   as an empty ring.

   What it is now:

   · Dots are placed by DATE, not by index. Eleven deadlines across two
     years are not evenly spread, and now you can see that: two events
     four days apart in September 2026 sit almost on top of each other,
     and the long empty arc through 2027 is a real gap in the calendar.
     The wheel became a timeline.

   · The dial is rebuilt from the rows each time they change. It used
     to be drawn once with eleven fixed dots while the count came from
     the table — so filtering the calendar to three events left eight
     dead dots and a rotation step computed against the wrong total.

   · Dates come from data-date on the row. The old code recovered them
     by parsing rendered month names against a table of abbreviations
     in five languages, which is a guess wearing the clothes of a
     lookup.

   · The motion carries weight: the disc overshoots and settles, the
     arc from the start of the period sweeps to meet the selection,
     the incoming dot swells and rings once, and the panel changes
     under a short wipe. Under prefers-reduced-motion all of it
     collapses to an instant state change.
   ================================================================== */
(function(){
  var svg = document.getElementById('rotaSvg');
  if (!svg) return;

  var CX = 260, CY = 260;
  var R_DOT = 186, R_TICK_IN = 202, R_TICK_OUT = 216, R_ARC = 228, R_LABEL = 246;
  var SPAN = 320;              /* degrees used; the remaining 40 keeps the ends apart */
  var START = -160;            /* first event sits here, measured from 12 o'clock */

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var disc = document.getElementById('rotaDisc');
  var elC = document.getElementById('rotaCount'), elD = document.getElementById('rotaDate');
  var elI = document.getElementById('rotaIns'), elT = document.getElementById('rotaText');
  var elE = document.getElementById('rotaType');
  var panel = svg.parentNode.querySelector('.rota-panel');

  var EV = [], n = 0, cur = -1, turns = 0, prevIdx = 0, lastDeg = 0;
  var dots = [], ticks = [];
  var arc = null, arcLen = 0;

  /* ---------------------------------------------------------- reading */

  function cellText(root, sel){
    var el = root.querySelector(sel);
    return el ? el.textContent.trim() : '';
  }

  function readTable(){
    var rows = document.querySelectorAll('#annex-a table tbody tr.cal-row');
    var out = [];
    rows.forEach(function(tr){
      var td = tr.querySelectorAll('td');
      if (td.length < 3) return;

      var date = td[0].cloneNode(true);
      var approx = date.querySelector('.c-approx');
      if (approx) approx.remove();

      var obl = td[2].querySelector('div');
      var text;
      if (obl){
        var c = obl.cloneNode(true);
        var mark = c.querySelector('.cal-fallback');
        if (mark) mark.remove();
        text = c.textContent.trim();
      } else {
        text = td[2].textContent.trim();
      }

      out.push({
        iso:  tr.dataset.date || '',
        type: tr.dataset.etype || '',
        past: tr.classList.contains('past'),
        when: date.textContent.trim(),
        inst: td[1].textContent.trim(),
        text: text,
        etype: cellText(td[2], '.cal-etype')
      });
    });
    /* the ISO string sorts correctly as a string; no month names involved */
    out.sort(function(a,b){ return a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0; });
    return out;
  }

  /* fall back to the static no-JS table, which has no data-date */
  function readStatic(){
    var rows = document.querySelectorAll('#annex-a table tbody tr');
    var out = [];
    rows.forEach(function(tr){
      var td = tr.querySelectorAll('td');
      if (td.length < 3 || tr.classList.contains('cal-detail')) return;
      out.push({ iso:'', type:'', past:false, when:td[0].textContent.trim(),
                 inst:td[1].textContent.trim(), text:td[2].textContent.trim(), etype:'' });
    });
    return out;
  }

  /* ---------------------------------------------------------- geometry */

  var DAY = 86400000;
  function ms(iso){ var d = new Date(String(iso).slice(0,10) + 'T00:00:00'); return isNaN(d) ? null : +d; }

  /* Angle for each event, proportional to its date within the period the
     dial covers. Where dates are unavailable the dial falls back to even
     spacing and says nothing it cannot support. */
  function angles(list){
    var t = list.map(function(e){ return ms(e.iso); });
    var ok = t.every(function(x){ return x !== null; });
    var lo = ok ? Math.min.apply(null, t) : 0;
    var hi = ok ? Math.max.apply(null, t) : 0;
    var range = hi - lo;
    return list.map(function(e, i){
      if (!ok || range <= 0) return START + (list.length < 2 ? 0 : (i / (list.length - 1)) * SPAN);
      return START + ((t[i] - lo) / range) * SPAN;
    });
  }

  var rad = function(deg){ return (deg - 90) * Math.PI / 180; };
  var px = function(deg, r){ return (CX + Math.cos(rad(deg)) * r).toFixed(2); };
  var py = function(deg, r){ return (CY + Math.sin(rad(deg)) * r).toFixed(2); };

  function el(name, attrs){
    var e = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* ---------------------------------------------------------- the dial */

  function build(){
    if (!disc) return;
    disc.textContent = '';
    dots = []; ticks = [];
    if (!n) return;

    var A = angles(EV);
    var t = EV.map(function(e){ return ms(e.iso); });
    var dated = t.every(function(x){ return x !== null; });

    /* The period the dial covers is written once, below it. It must not go
       on the rim: the rim turns, and a date label that turns with it ends
       up upside down and pointing at the wrong place. */
    var span = document.getElementById('rotaSpan');
    if (span){
      span.textContent = (dated && n > 1) ? (EV[0].when + ' — ' + EV[n-1].when) : '';
      span.hidden = !(dated && n > 1);
    }

    /* The full period as a faint track, so the ring always reads as a span
       of time, with the travelled part drawn over it. */
    var a0 = A[0], aN = A[n-1];
    if (n > 1){
      var big = (aN - a0) > 180 ? 1 : 0;
      disc.appendChild(el('path', {
        class: 'rota-track', fill: 'none',
        d: 'M ' + px(a0, R_ARC) + ' ' + py(a0, R_ARC) +
           ' A ' + R_ARC + ' ' + R_ARC + ' 0 ' + big + ' 1 ' + px(aN, R_ARC) + ' ' + py(aN, R_ARC)
      }));
    }
    arc = el('path', {class:'rota-arc', d:'', fill:'none'});
    disc.appendChild(arc);

    EV.forEach(function(e, i){
      var a = A[i];
      var tk = el('line', {
        class: 'rota-tick', 'data-i': i,
        x1: px(a, R_TICK_IN), y1: py(a, R_TICK_IN),
        x2: px(a, R_TICK_OUT), y2: py(a, R_TICK_OUT)
      });
      disc.appendChild(tk); ticks.push(tk);

      var d = el('circle', {
        class: 'rota-dot' + (e.past ? ' past' : ''), 'data-i': i, 'data-e': e.type,
        cx: px(a, R_DOT), cy: py(a, R_DOT), r: 9,
        role: 'button', tabindex: '0',
        'aria-label': e.when + ', ' + e.inst + (e.etype ? ', ' + e.etype : '')
      });
      /* the ring that pulses once when this dot becomes the selection */
      var ring = el('circle', {
        class: 'rota-ring', 'data-i': i,
        cx: px(a, R_DOT), cy: py(a, R_DOT), r: 9, fill: 'none'
      });
      disc.appendChild(ring);
      disc.appendChild(d);
      dots.push(d);
    });

    /* one delegated handler for the whole dial, rebuilt or not */
    disc.onclick = function(ev){
      var d = ev.target.closest && ev.target.closest('.rota-dot');
      if (d) select(Number(d.dataset.i));
    };
    disc.onkeydown = function(ev){
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var d = ev.target.closest && ev.target.closest('.rota-dot');
      if (!d) return;
      ev.preventDefault(); select(Number(d.dataset.i));
    };

    ANGLES = A;

    /* the dial holds pressable things, so it is a group, not an image, and
       its label states what is actually on it rather than a count typed
       into the HTML that filtering would falsify */
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label',
      n + ' dated ' + (n === 1 ? 'event' : 'events') +
      (dated && n > 1 ? ', ' + EV[0].when + ' to ' + EV[n-1].when : '') +
      ', placed by date. Use the left and right arrow keys to turn the dial.');
  }

  var ANGLES = [];

  function paintArc(i){
    if (!arc || !ANGLES.length) return;
    var a0 = ANGLES[0], a1 = ANGLES[i];
    /* at the first event there is no travelled arc; the track carries the ring */
    if (a1 <= a0 + 0.4){ arc.setAttribute('d',''); return; }
    var large = (a1 - a0) > 180 ? 1 : 0;
    arc.setAttribute('d',
      'M ' + px(a0, R_ARC) + ' ' + py(a0, R_ARC) +
      ' A ' + R_ARC + ' ' + R_ARC + ' 0 ' + large + ' 1 ' + px(a1, R_ARC) + ' ' + py(a1, R_ARC));
    if (reduce) return;
    /* redraw the sweep each time rather than tweening between two arcs */
    var len = arc.getTotalLength ? arc.getTotalLength() : 0;
    if (!len) return;
    arc.style.transition = 'none';
    arc.style.strokeDasharray = len;
    arc.style.strokeDashoffset = len;
    void arc.getBoundingClientRect();
    arc.style.transition = 'stroke-dashoffset .68s cubic-bezier(.22,.9,.24,1)';
    arc.style.strokeDashoffset = 0;
  }

  /* ---------------------------------------------------------- selection */

  function daysAway(iso){
    var t = ms(iso); if (t === null) return null;
    var today = new Date(); today.setHours(0,0,0,0);
    return Math.round((t - (+today)) / DAY);
  }

  function select(i, animate){
    if (!n) return;
    i = ((i % n) + n) % n;
    if (i === cur) return;

    /* Placing the dots by date has one consequence for the motion: two events
       four days apart in a two-year span sit half a degree apart, so stepping
       between them would turn the dial by an amount no one can see, and the
       wheel would look broken exactly where the calendar is busiest.

       So the marks keep their true angles — nothing about the data moves —
       and the *travel* is given a floor: a step that would turn the dial less
       than eight degrees takes the long way round instead, one full
       revolution in the direction you asked for. You see that you moved. */
    var target = -ANGLES[i];
    var prevAngle = cur < 0 ? target : -ANGLES[prevIdx];
    var delta = target - prevAngle;

    var diff = i - prevIdx;
    if (diff > n/2) turns -= 1; else if (diff < -n/2) turns += 1;

    if (cur >= 0 && Math.abs(delta) < 8 && i !== prevIdx){
      turns += (i > prevIdx || (prevIdx === n - 1 && i === 0)) ? -1 : 1;
    }
    prevIdx = i; cur = i;

    var deg = target + turns * 360;
    /* a long way round is given more time, so it reads as one deliberate
       revolution rather than a snap */
    disc.classList.toggle('long', Math.abs(deg - lastDeg) > 200);
    lastDeg = deg;
    if (animate === false || reduce){
      disc.style.transition = 'none';
      disc.style.transform = 'rotate(' + deg + 'deg)';
      void disc.getBoundingClientRect();
      disc.style.transition = '';
    } else {
      disc.style.transform = 'rotate(' + deg + 'deg)';
    }

    dots.forEach(function(d,k){ d.classList.toggle('on', k===i); });
    ticks.forEach(function(t,k){ t.classList.toggle('on', k===i); });

    /* the ring pulses once on arrival; restarting the animation needs the
       class removed and the layout flushed before it goes back on */
    if (!reduce && animate !== false){
      var ring = disc.querySelector('.rota-ring[data-i="' + i + '"]');
      if (ring){
        ring.classList.remove('pulse');
        void ring.getBoundingClientRect();
        ring.classList.add('pulse');
      }
    }

    paintArc(i);

    var e = EV[i];
    var of = (document.documentElement.getAttribute('lang')||'en');
    var word = {en:'of', it:'di', es:'de', fr:'sur'}[of] || 'of';
    elC.textContent = (i+1) + ' ' + word + ' ' + n;
    elD.textContent = e.when;
    elI.textContent = e.inst;
    elT.textContent = e.text;
    if (elE){ elE.textContent = e.etype || ''; elE.hidden = !e.etype; }

    /* how far away it is, computed rather than written down */
    var away = document.getElementById('rotaAway');
    if (away){
      var dd = daysAway(e.iso);
      if (dd === null){ away.hidden = true; }
      else {
        away.hidden = false;
        away.textContent = dd === 0 ? 'today'
          : dd === 1 ? 'tomorrow'
          : dd === -1 ? 'yesterday'
          : dd > 0 ? 'in ' + dd + ' days'
          : Math.abs(dd) + ' days ago';
        away.classList.toggle('past', dd < 0);
      }
    }

    if (!reduce && animate !== false && panel){
      panel.classList.remove('wipe');
      void panel.getBoundingClientRect();
      panel.classList.add('wipe');
    }
  }

  /* ---------------------------------------------------------- wiring */

  function refresh(keepAt){
    var live = readTable();
    EV = live.length ? live : readStatic();
    n = EV.length;
    build();
    cur = -1; prevIdx = 0; turns = 0;
    if (!n){
      if (elC) elC.textContent = '';
      if (elD) elD.textContent = 'No dated event matches these filters.';
      if (elI) elI.textContent = '';
      if (elT) elT.textContent = '';
      if (elE) elE.hidden = true;
      return;
    }
    /* land on the next event still to come, not always the first */
    var at = keepAt;
    if (at == null){
      at = EV.findIndex(function(e){ return !e.past; });
      if (at < 0) at = n - 1;
    }
    select(Math.min(at, n-1), false);
  }

  document.getElementById('rotaPrev').addEventListener('click', function(){ select(cur-1); });
  document.getElementById('rotaNext').addEventListener('click', function(){ select(cur+1); });

  /* arrows drive the wheel only while it is the thing you are looking at */
  document.addEventListener('keydown', function(e){
    if (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA') return;
    if (e.key!=='ArrowLeft' && e.key!=='ArrowRight') return;
    var r = document.getElementById('rota').getBoundingClientRect();
    if (r.bottom < 120 || r.top > window.innerHeight - 120) return;
    e.preventDefault();
    select(e.key==='ArrowRight' ? cur+1 : cur-1);
  });

  refresh();

  /* the calendar dispatches this after every render — a language swap, a
     filter change, anything. The dial is rebuilt, not merely re-read. */
  document.addEventListener('i18n:applied', function(){
    var at = cur < 0 ? null : cur;
    refresh(at);
  });
})();




/* ================= i18n: pre-translated strings, swapped in place =================
   Translations are authored, not machine-generated, and shipped as static JSON.
   Nothing is sent to a translation service at runtime.

   The register at i18n/locales.json is the single source of truth for which
   languages exist and which file each one lives in. The menu is built from it,
   so a language cannot be offered unless the register declares a file for it,
   and a declared file that fails to load demotes that language in the menu
   rather than leaving the reader on a half-translated page.

   Not offline. The first switch to a language fetches its JSON over the
   network; after that it is served from an in-memory cache for the rest of the
   page view. English alone never needs a request, because it is snapshotted
   from the source DOM. There is no service worker and nothing is precached.

   Fallback is explicit: a key the locale does not carry falls back to the
   English original and the element is marked data-i18n-fallback, so a gap is
   visible in the interface and countable in a test rather than silent. ==== */
(function(){
  var btn = document.getElementById('langToggle');
  var menu = document.getElementById('langMenu');
  var label = document.getElementById('langCurrent');
  if (!btn || !menu) return;

  var KEY = 'eupolicy:lang';
  var REGISTER = 'i18n/locales.json';
  var cache = {};          /* code -> map of key:html */
  var original = null;     /* the English DOM as authored */
  var current = 'en';
  var LOCALES = null;      /* code -> record from the register */
  var ORDER = ['en'];
  var NODES = null;        /* cached [data-i18n] elements \u2014 the DOM set is static */

  function nodes(){
    if (!NODES) NODES = [].slice.call(document.querySelectorAll('[data-i18n]'));
    return NODES;
  }

  function snapshotEnglish(){
    if (original) return;
    original = {};
    nodes().forEach(function(el){ original[el.getAttribute('data-i18n')] = el.innerHTML; });
    cache.en = original;
  }

  function apply(map, lang){
    var rec = (LOCALES && LOCALES[lang]) || null;
    var missing = 0;
    nodes().forEach(function(el){
      var k = el.getAttribute('data-i18n');
      var v = map[k];
      var fell = false;
      if (v === undefined){
        v = original[k];                 /* never leave a hole */
        fell = lang !== 'en';
        if (fell) missing++;
      }
      if (v !== undefined && el.innerHTML !== v) el.innerHTML = v;
      if (fell) el.setAttribute('data-i18n-fallback', 'en');
      else el.removeAttribute('data-i18n-fallback');
    });
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', (rec && rec.dir) || 'ltr');
    label.textContent = lang.toUpperCase();
    menu.querySelectorAll('li[data-lang]').forEach(function(li){
      li.setAttribute('aria-selected', String(li.dataset.lang === lang));
    });
    current = lang;
    try{ localStorage.setItem(KEY, lang); }catch(e){}
    document.dispatchEvent(new CustomEvent('i18n:applied', {
      detail: {lang: lang, missing: missing, total: nodes().length}
    }));
  }

  /* a locale whose file will not load is struck from the menu, not silently
     retried \u2014 the reader is told, once, why they are back on English */
  function demote(lang, why){
    var rec = LOCALES && LOCALES[lang];
    if (rec) { rec.broken = why; }
    var li = menu.querySelector('li[data-lang="' + lang + '"]');
    if (li){
      li.setAttribute('aria-disabled', 'true');
      li.removeAttribute('data-lang');
      var s = li.querySelector('span');
      if (s) s.textContent = s.textContent + ' \u2014 unavailable';
    }
  }

  /* The language the reader asked for last is the language they get.

     Without the token below, four quick clicks — it, fr, es, en — start four
     requests and the page ends on whichever *file* came back last, not on
     whichever *button* was pressed last. Tested: requesting it→fr→es→en
     landed on Spanish. English was cached and applied instantly, then the
     Spanish response arrived and overwrote it.

     Every request now carries a sequence number, and a response that is no
     longer the current request is parsed into the cache and otherwise
     discarded. */
  var langSeq = 0;

  function setLang(lang){
    snapshotEnglish();
    var token = ++langSeq;

    if (lang === 'en'){ apply(original, 'en'); return; }
    var rec = LOCALES && LOCALES[lang];
    if (!rec || !rec.file){ apply(original, 'en'); return; }
    if (lang === current && cache[lang]) return;
    if (cache[lang]) { apply(cache[lang], lang); return; }

    document.body.classList.add('i18n-busy');
    fetch(rec.file, {cache:'force-cache'})
      .then(function(r){ if(!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function(j){
        cache[lang] = j;                 /* keep it either way: it was paid for */
        if (token === langSeq) apply(j, lang);
      })
      .catch(function(err){
        demote(lang, String(err && err.message || err));
        if (token === langSeq) apply(original, 'en');
      })
      .then(function(){
        if (token === langSeq) document.body.classList.remove('i18n-busy');
      });
  }

  /* the menu is rendered from the register, so it can never offer a file that
     does not exist \u2014 the failure mode the previous hard-coded list allowed */
  function buildMenu(list){
    LOCALES = {}; ORDER = [];
    list.forEach(function(l){ LOCALES[l.code] = l; ORDER.push(l.code); });
    menu.innerHTML = list.map(function(l){
      var partial = l.complete === false
        ? ' <span class="lm-partial" title="Some strings fall back to English">partial</span>' : '';
      return '<li role="option" tabindex="-1" data-lang="' + l.code + '" aria-selected="' +
        (l.code === current) + '"><b>' + l.code.toUpperCase() + '</b><span>' +
        l.label + partial + '</span></li>';
    }).join('');
  }

  function closeMenu(){ menu.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    var open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    if (open){ var sel = menu.querySelector('li[aria-selected="true"]') || menu.firstElementChild; if (sel) sel.focus(); }
  });
  menu.addEventListener('click', function(e){
    var li = e.target.closest('li[data-lang]');
    if (!li) return;
    e.stopPropagation();
    closeMenu();
    btn.focus();
    setLang(li.dataset.lang);
  });
  /* the listbox is operable from the keyboard, not only the mouse */
  menu.addEventListener('keydown', function(e){
    var items = [].slice.call(menu.querySelectorAll('li[data-lang]'));
    var i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault();
      var n = i === -1 ? 0 : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      if (items[n]) items[n].focus();
    } else if (e.key === 'Enter' || e.key === ' '){
      if (i === -1) return;
      e.preventDefault(); closeMenu(); btn.focus(); setLang(items[i].dataset.lang);
    } else if (e.key === 'Escape'){ closeMenu(); btn.focus(); }
  });
  document.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && menu.classList.contains('open')){ closeMenu(); btn.focus(); }
  });

  snapshotEnglish();
  var saved; try{ saved = localStorage.getItem(KEY); }catch(e){}

  fetch(REGISTER, {cache:'no-cache'})
    .then(function(r){ if(!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(function(reg){
      var list = (reg.locales || []).filter(function(l){ return l.code === 'en' || l.file; });
      if (!list.length) throw new Error('register declares no locales');
      buildMenu(list);
      if (saved && LOCALES[saved] && saved !== 'en') setLang(saved); else apply(original, 'en');
    })
    .catch(function(){
      /* without the register there is no way to know what ships, so the site
         stays in its source language rather than guessing at filenames */
      LOCALES = {en:{code:'en', label:'English', dir:'ltr', file:null}};
      menu.innerHTML = '<li role="option" data-lang="en" aria-selected="true"><b>EN</b><span>English</span></li>';
      apply(original, 'en');
    });
})();
})();
