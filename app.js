(function(){
'use strict';
var DATA = window.__CONTENT__;

/* ================= progress bar + active-spine tracking ================= */
var fill = document.getElementById('progressFill');
var parts = [...document.querySelectorAll('.part')];
var spineLinks = [...document.querySelectorAll('.spine-item')];

function onScroll(){
  var doc = document.documentElement;
  var pct = doc.scrollTop / (doc.scrollHeight - doc.clientHeight) * 100;
  fill.style.width = Math.min(100, Math.max(0, pct)) + '%';

  var pos = window.scrollY + 120;
  var current = parts[0];
  for (var p of parts){ if (p.offsetTop <= pos) current = p; }
  spineLinks.forEach(function(a){ a.classList.toggle('active', a.dataset.target === current.id); });
}
document.addEventListener('scroll', onScroll, {passive:true});
onScroll();

/* ================= scroll-reveal ================= */
var groups = [...document.querySelectorAll('.reveal-group')];
var io = new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if (e.isIntersecting){
      var children = [...e.target.children];
      children.forEach(function(el, i){
        setTimeout(function(){ el.classList.add('in'); }, Math.min(i, 8) * 55);
      });
      io.unobserve(e.target);
    }
  });
}, {threshold: 0.08, rootMargin: '0px 0px -8% 0px'});
groups.forEach(function(g){ io.observe(g); });
// fallback: reveal everything already above the fold on load
requestAnimationFrame(function(){
  groups.forEach(function(g){
    var r = g.getBoundingClientRect();
    if (r.top < window.innerHeight) { [...g.children].forEach(function(el){ el.classList.add('in'); }); io.unobserve(g); }
  });
});

/* ================= reading lens: mechanics / critique / all ================= */
document.querySelectorAll('.lens button').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.lens button').forEach(function(b){ b.setAttribute('aria-pressed','false'); });
    btn.setAttribute('aria-pressed','true');
    document.body.dataset.lens = btn.dataset.lens;
  });
});

/* ================= progress persistence (localStorage) ================= */
var DONE_KEY = 'eupolicy:progress';
function getVisited(){ try{ return new Set(JSON.parse(localStorage.getItem(DONE_KEY)||'[]')); }catch(e){ return new Set(); } }
function saveVisited(s){ try{ localStorage.setItem(DONE_KEY, JSON.stringify([...s])); }catch(e){} }
var visited = getVisited();
function markVisible(){
  var pos = window.scrollY + window.innerHeight * 0.5;
  parts.forEach(function(p){
    if (p.offsetTop < pos) visited.add(p.id);
  });
}
var saveTimer;
document.addEventListener('scroll', function(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function(){ markVisible(); saveVisited(visited); paintVisited(); }, 400);
}, {passive:true});
function paintVisited(){
  spineLinks.forEach(function(a){
    a.classList.toggle('visited', visited.has(a.dataset.target));
  });
  document.querySelectorAll('.tree-listitem').forEach(function(a){
    a.style.opacity = visited.has(a.dataset.node) ? '' : '.68';
  });
}
markVisible(); paintVisited();

var resetBtn = document.getElementById('resetProgress');
if (resetBtn) resetBtn.addEventListener('click', function(){
  visited.clear(); saveVisited(visited); paintVisited();
  resetBtn.textContent = 'Cleared';
  setTimeout(function(){ resetBtn.textContent = 'Reset reading progress'; }, 1200);
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

/* ================= Tree-of-Life contents overlay ================= */
var treeScrim = document.getElementById('treeScrim');
var openTreeBtn = document.getElementById('openTree');
var treeCloseBtn = document.getElementById('treeClose');
function openTree(){ treeScrim.classList.add('show'); }
function closeTree(){ treeScrim.classList.remove('show'); }
if (openTreeBtn) openTreeBtn.addEventListener('click', openTree);
if (treeCloseBtn) treeCloseBtn.addEventListener('click', closeTree);
if (treeScrim) treeScrim.addEventListener('click', function(e){ if (e.target === treeScrim) closeTree(); });
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape' && treeScrim.classList.contains('show')) closeTree();
});

function highlightNode(id, on){
  document.querySelectorAll('.tree-node[data-node="'+id+'"]').forEach(function(n){ n.classList.toggle('hl', on); });
  document.querySelectorAll('.tree-listitem[data-node="'+id+'"]').forEach(function(n){ n.classList.toggle('hl', on); });
  document.querySelectorAll('.tree-path[data-a="'+id+'"], .tree-path[data-b="'+id+'"]').forEach(function(p){ p.classList.toggle('lit', on); });
}
document.querySelectorAll('.tree-node, .tree-listitem').forEach(function(el){
  var id = el.dataset.node;
  el.addEventListener('mouseenter', function(){ highlightNode(id, true); });
  el.addEventListener('mouseleave', function(){ highlightNode(id, false); });
  el.addEventListener('click', function(){ closeTree(); jumpTo(id); });
  el.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); closeTree(); jumpTo(id); } });
});

/* ================= glossary: inline popovers + side panel ================= */
var popEl = document.createElement('div');
popEl.className = 'gloss-pop';
document.body.appendChild(popEl);

function glossTextFor(id){
  var entry = document.getElementById('gloss-' + id);
  return entry ? {term: entry.querySelector('b').textContent, def: entry.querySelector('span').textContent} : null;
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
  popEl.innerHTML = '<b>' + g.term + '</b>' + g.def;
  popEl.dataset.term = id;
  var r = btn.getBoundingClientRect();
  var top = r.bottom + window.scrollY + 8;
  var left = Math.min(r.left + window.scrollX, window.innerWidth - 336);
  popEl.style.top = top + 'px'; popEl.style.left = Math.max(12,left) + 'px';
  popEl.classList.add('show');
  btn.setAttribute('aria-expanded','true');
});
document.addEventListener('click', function(e){
  /* both handlers now sit on document, so this one must not undo the opener */
  if (e.target.closest && e.target.closest('.gloss')) return;
  popEl.classList.remove('show');
  document.querySelectorAll('.gloss[aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
});

var gpanel = document.getElementById('gpanel');
var scrim = document.getElementById('scrim');
function openPanel(){ gpanel.classList.add('open'); scrim.classList.add('show'); }
function closePanel(){ gpanel.classList.remove('open'); scrim.classList.remove('show'); }
var glossBtn = document.getElementById('openGlossary');
if (glossBtn) glossBtn.addEventListener('click', openPanel);
var gClose = document.getElementById('gpanelClose');
if (gClose) gClose.addEventListener('click', closePanel);
if (scrim) scrim.addEventListener('click', closePanel);

/* ================= command palette ================= */
var cmdkScrim = document.getElementById('cmdkScrim');
var cmdkInput = document.getElementById('cmdkInput');
var cmdkResults = document.getElementById('cmdkResults');
var selIndex = 0, currentItems = [];

function openCmdk(){
  cmdkScrim.classList.add('show'); cmdkInput.value=''; cmdkInput.focus();
  renderResults('');
}
function closeCmdk(){ cmdkScrim.classList.remove('show'); }
document.getElementById('openSearch').addEventListener('click', openCmdk);
cmdkScrim.addEventListener('click', function(e){ if (e.target === cmdkScrim) closeCmdk(); });

function esc(s){ return s.replace(/[&<>]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }); }
function snippet(text, q){
  var i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return esc(text.slice(0,100)) + '\u2026';
  var s = Math.max(0, i-45), e = Math.min(text.length, i+q.length+65);
  return (s>0?'\u2026':'') + esc(text.slice(s,i)) + '<mark>' + esc(text.slice(i,i+q.length)) + '</mark>' + esc(text.slice(i+q.length,e)) + (e<text.length?'\u2026':'');
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

function renderResults(q){
  var ql = q.trim().toLowerCase();
  var artMatch = q.trim().match(ART_RE);
  var defHits = [], refHits = [], passHits = [];

  if (!ql){
    passHits = DATA.search.map(function(s){ return {id:s.id, roman:s.roman, title:s.title, sub:s.dek}; });
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

  defHits = defHits.slice(0,5); refHits = refHits.slice(0,6);
  passHits = passHits.slice(0, ql ? 10 : 20);
  var groups = [['Definitions', defHits], ['References', refHits], ['Parts', passHits]]
    .filter(function(g){ return g[1].length; });

  currentItems = [].concat(defHits, refHits, passHits);
  selIndex = 0;

  if (!currentItems.length){
    cmdkResults.innerHTML = '<div class="cmdk-empty">No matches for &ldquo;'+esc(q)+'&rdquo;</div>';
    return;
  }
  var out = '', idx = 0;
  groups.forEach(function(g){
    out += '<div class="cmdk-group">'+g[0]+'</div>';
    g[1].forEach(function(it){
      var dataAttr = it.gloss ? ' data-gloss="'+it.gloss+'"' : ' data-id="'+it.id+'"';
      out += '<div class="cmdk-item'+(idx===0?' sel':'')+'"'+dataAttr+'>'+
        '<span class="cr">'+it.roman+'</span><span><span class="ct">'+esc(it.title)+'</span><span class="cs">'+it.sub+'</span></span></div>';
      idx++;
    });
  });
  cmdkResults.innerHTML = out;
}
cmdkInput.addEventListener('input', function(){ renderResults(cmdkInput.value.trim()); });
cmdkResults.addEventListener('click', function(e){
  var item = e.target.closest('.cmdk-item'); if (!item) return;
  closeCmdk();
  if (item.dataset.gloss){
    openPanel();
    var ent = document.getElementById('gloss-'+item.dataset.gloss);
    if (ent){ ent.scrollIntoView({block:'center'}); ent.classList.add('lit'); setTimeout(function(){ ent.classList.remove('lit'); }, 1600); }
  } else {
    jumpTo(item.dataset.id);
  }
});
function paintSel(){
  [...cmdkResults.children].forEach(function(el,i){ el.classList.toggle('sel', i===selIndex); });
  var sel = cmdkResults.children[selIndex];
  if (sel) sel.scrollIntoView({block:'nearest'});
}
document.addEventListener('keydown', function(e){
  var openPalette = cmdkScrim.classList.contains('show');
  if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openPalette ? closeCmdk() : openCmdk(); return; }
  if (!openPalette){
    if (e.key==='/' && e.target.tagName!=='INPUT'){ e.preventDefault(); openCmdk(); }
    return;
  }
  if (e.key==='Escape'){ closeCmdk(); return; }
  if (e.key==='ArrowDown'){ e.preventDefault(); selIndex=Math.min(selIndex+1,currentItems.length-1); paintSel(); }
  if (e.key==='ArrowUp'){ e.preventDefault(); selIndex=Math.max(selIndex-1,0); paintSel(); }
  if (e.key==='Enter'){
    e.preventDefault();
    var it=currentItems[selIndex];
    if(it){
      closeCmdk();
      if (it.gloss){
        openPanel();
        var ent = document.getElementById('gloss-'+it.gloss);
        if (ent){ ent.scrollIntoView({block:'center'}); ent.classList.add('lit'); setTimeout(function(){ ent.classList.remove('lit'); }, 1600); }
      } else {
        jumpTo(it.id);
      }
    }
  }
});

/* ================= hash deep-link on load ================= */
if (location.hash) { setTimeout(function(){ jumpTo(location.hash.slice(1)); }, 60); }

/* ================= resume: last three reading positions ================= */
var RECENTS_KEY = 'eupolicy:recents';
function getRecents(){ try{ return JSON.parse(localStorage.getItem(RECENTS_KEY)||'[]'); }catch(e){ return []; } }
function saveRecents(r){ try{ localStorage.setItem(RECENTS_KEY, JSON.stringify(r.slice(0,3))); }catch(e){} }
function pushRecent(id){
  var r = getRecents().filter(function(x){ return x.id!==id; });
  r.unshift({ id:id, ts:Date.now() });
  saveRecents(r);
}
var lastPushed = null, recentTimer;
document.addEventListener('scroll', function(){
  clearTimeout(recentTimer);
  recentTimer = setTimeout(function(){
    var pos = window.scrollY + 120, cur = parts[0];
    for (var p of parts){ if (p.offsetTop <= pos) cur = p; }
    if (cur.id !== lastPushed){ lastPushed = cur.id; pushRecent(cur.id); }
  }, 1500);
}, {passive:true});

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
shortcutsScrim.innerHTML = '<div class="shortcuts-panel"><h3>Keyboard shortcuts</h3>'+
  '<div class="shortcuts-row"><span>Search</span><kbd>&#8984;K</kbd></div>'+
  '<div class="shortcuts-row"><span>Search</span><kbd>/</kbd></div>'+
  '<div class="shortcuts-row"><span>Contents &middot; Tree of Life</span><kbd>G</kbd></div>'+
  '<div class="shortcuts-row"><span>Next / previous Part</span><kbd>]</kbd> <kbd>[</kbd></div>'+
  '<div class="shortcuts-row"><span>Close anything open</span><kbd>Esc</kbd></div>'+
  '<div class="shortcuts-row"><span>This panel</span><kbd>?</kbd></div></div>';
document.body.appendChild(shortcutsScrim);
shortcutsScrim.addEventListener('click', function(e){ if (e.target===shortcutsScrim) shortcutsScrim.classList.remove('show'); });

document.addEventListener('keydown', function(e){
  if (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA') return;
  if (cmdkScrim.classList.contains('show') || treeScrim.classList.contains('show') || gpanel.classList.contains('open')) return;
  if (e.key==='?'){ e.preventDefault(); shortcutsScrim.classList.toggle('show'); return; }
  if (shortcutsScrim.classList.contains('show')){
    if (e.key==='Escape') shortcutsScrim.classList.remove('show');
    return;
  }
  if (e.key.toLowerCase()==='g'){ e.preventDefault(); openTree(); return; }
  if (e.key===']' || e.key==='['){
    e.preventDefault();
    var pos = window.scrollY + 120, ci = 0;
    parts.forEach(function(p,i){ if (p.offsetTop <= pos) ci = i; });
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

  /* vessels already read stay lit, so the tree records the journey */
  function paintPortal(){
    var seen; try{ seen = new Set(JSON.parse(localStorage.getItem('eupolicy:progress')||'[]')); }
    catch(e){ seen = new Set(); }
    tree.querySelectorAll('.pt-node').forEach(function(n){
      n.classList.toggle('visited', seen.has(n.dataset.node));
    });
  }
  paintPortal();
  document.addEventListener('scroll', function(){ paintPortal(); }, {passive:true});
})();


/* ================= THE ROTA: volvelle for the compliance calendar ================= */
(function(){
  var svg = document.getElementById('rotaSvg');
  if (!svg) return;
  /* the wheel reads the annex table rather than carrying its own copy of the
     dates, so it follows whatever language the page is in and can never drift
     out of sync with the authoritative static table underneath it */
  var MONTHS = {
    jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
    gen:1,mag:5,giu:6,lug:7,ago:8,set:9,ott:10,dic:12,
    ene:1,abr:4,ago_es:8,dic_es:12,
    fev:2,avr:4,mai:5,juin:6,juil:7,aou:8,ao:8,sept:9,oct_fr:10,dec_fr:12
  };
  function parseWhen(s){
    var t = s.toLowerCase().replace(/[.,]/g,' ');
    var day = (t.match(/\b(\d{1,2})\b(?!\d)/) || [])[1];
    var year = (t.match(/\b(20\d{2})\b/) || [])[1];
    var mon = 0;
    var words = t.split(/\s+/);
    for (var i=0;i<words.length;i++){
      var w = words[i].slice(0,4);
      for (var k in MONTHS){
        if (w.indexOf(k.slice(0,3))===0 && k.slice(0,3).length===3){ mon = MONTHS[k]; break; }
      }
      if (mon) break;
    }
    return (parseInt(year||'2100',10))*10000 + mon*100 + parseInt(day||'1',10);
  }
  function readTable(){
    var rows = document.querySelectorAll('#annex-a table tbody tr');
    var out = [];
    rows.forEach(function(tr){
      var td = tr.querySelectorAll('td');
      if (td.length < 3) return;
      out.push([td[0].textContent.trim(), td[1].textContent.trim(), td[2].textContent.trim()]);
    });
    out.sort(function(a,b){ return parseWhen(a[0]) - parseWhen(b[0]); });
    return out;
  }
  var EV = readTable();
  var disc = document.getElementById('rotaDisc');
  var dots = [].slice.call(svg.querySelectorAll('.rota-dot'));
  var ticks = [].slice.call(svg.querySelectorAll('.rota-tick'));
  var elC = document.getElementById('rotaCount'), elD = document.getElementById('rotaDate');
  var elI = document.getElementById('rotaIns'), elT = document.getElementById('rotaText');
  var n = EV.length, cur = -1, turns = 0, prevIdx = 0;

  function select(i, animate){
    i = ((i % n) + n) % n;
    if (i === cur) return;
    /* keep turning the short way round rather than unwinding the whole dial */
    var diff = i - prevIdx;
    if (diff > n/2) turns -= 1; else if (diff < -n/2) turns += 1;
    prevIdx = i; cur = i;
    var deg = -(i * (360/n)) + turns * 360;
    if (animate === false) disc.style.transition = 'none';
    disc.style.transform = 'rotate(' + deg + 'deg)';
    if (animate === false) { void disc.offsetWidth; disc.style.transition = ''; }
    dots.forEach(function(d,k){ d.classList.toggle('on', k===i); });
    ticks.forEach(function(t,k){ t.classList.toggle('on', k===i); });
    var of = (document.documentElement.getAttribute('lang')||'en');
    var word = {en:'of', it:'di', es:'de', fr:'sur'}[of] || 'of';
    elC.textContent = (i+1) + ' ' + word + ' ' + n;
    elD.textContent = EV[i][0];
    elI.textContent = EV[i][1];
    elT.textContent = EV[i][2];
  }

  dots.forEach(function(d,k){
    d.addEventListener('click', function(){ select(k); });
    d.addEventListener('keydown', function(e){
      if (e.key==='Enter'||e.key===' '){ e.preventDefault(); select(k); }
    });
  });
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

  select(0, false);

  /* when the language changes the table text changes underneath us, so re-read
     it and repaint the panel at the same position the reader was on */
  document.addEventListener('i18n:applied', function(){
    var at = cur < 0 ? 0 : cur;
    EV = readTable();
    if (!EV.length) return;
    cur = -1;
    select(at, false);
  });
})();


/* ================= i18n: pre-translated strings, swapped in place =================
   Translations are authored, not machine-generated, and shipped as static JSON.
   Nothing is fetched from a translation service at runtime; switching languages
   is a local string swap, so it is instant and works offline. English is held in
   memory from the original DOM, so returning to it never needs a request. ==== */
(function(){
  var btn = document.getElementById('langToggle');
  var menu = document.getElementById('langMenu');
  var label = document.getElementById('langCurrent');
  if (!btn || !menu) return;

  var LANGS = {en:'English', it:'Italiano', es:'Espa\u00f1ol', fr:'Fran\u00e7ais'};
  var KEY = 'eupolicy:lang';
  var cache = {};          /* lang -> map of key:html */
  var original = null;     /* the English DOM as authored */
  var current = 'en';

  function nodes(){ return document.querySelectorAll('[data-i18n]'); }

  function snapshotEnglish(){
    if (original) return;
    original = {};
    nodes().forEach(function(el){ original[el.getAttribute('data-i18n')] = el.innerHTML; });
    cache.en = original;
  }

  function apply(map, lang){
    var missing = 0;
    nodes().forEach(function(el){
      var k = el.getAttribute('data-i18n');
      var v = map[k];
      /* fall back to the English original rather than leaving a hole */
      if (v === undefined){ v = original[k]; if (lang !== 'en') missing++; }
      if (v !== undefined && el.innerHTML !== v) el.innerHTML = v;
    });
    document.documentElement.setAttribute('lang', lang);
    label.textContent = lang.toUpperCase();
    menu.querySelectorAll('li').forEach(function(li){
      li.setAttribute('aria-selected', String(li.dataset.lang === lang));
    });
    current = lang;
    try{ localStorage.setItem(KEY, lang); }catch(e){}
    document.dispatchEvent(new CustomEvent('i18n:applied', {detail:{lang:lang, missing:missing}}));
  }

  function setLang(lang){
    snapshotEnglish();
    if (lang === current && cache[lang]) return;
    if (cache[lang]) { apply(cache[lang], lang); return; }
    document.body.classList.add('i18n-busy');
    fetch('i18n/' + lang + '.json', {cache:'force-cache'})
      .then(function(r){ if(!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function(j){ cache[lang] = j; apply(j, lang); })
      .catch(function(){
        /* a missing or unreachable file leaves the reader on English, not on a broken page */
        apply(original, 'en');
        label.textContent = 'EN';
      })
      .then(function(){ document.body.classList.remove('i18n-busy'); });
  }

  function closeMenu(){ menu.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    var open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', function(e){
    var li = e.target.closest('li[data-lang]');
    if (!li) return;
    e.stopPropagation();
    closeMenu();
    setLang(li.dataset.lang);
  });
  document.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });

  snapshotEnglish();
  var saved; try{ saved = localStorage.getItem(KEY); }catch(e){}
  if (saved && LANGS[saved] && saved !== 'en') setLang(saved); else apply(original, 'en');
})();

})();
