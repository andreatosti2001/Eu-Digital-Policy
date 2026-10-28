/* ============================================================
   THE INSTRUMENT PAGE — boot. The renderer is js/instrument-view.js.

   Two kinds of page load this module:

   · instruments/<id>/index.html — one per substantive instrument,
     declared on <body data-instrument="…">. Its HTML already holds the
     whole view, pre-rendered by tools/_footer.mjs without a clock. This
     re-renders the same view with one, so the fragments that depend on
     today's date (the next date, "applies since", a pipeline's reach, a
     record's age) are filled in. Its title, canonical and structured
     data are already right and are not touched.

   · instrument.html?id=… — the address every instrument had until
     27 Sep 2026, kept so that no inbound link breaks. For an instrument
     with a page of its own it forwards there, keeping the #fragment,
     with location.replace so the back button is not a loop. For a
     record too thin for a page of its own (js/routes.js, the gate) it
     renders the view here and marks the page noindex: it stays useful
     to a reader and is not offered to a search engine as a landing
     page. With no id, it forwards to the instrument list. A record in
     the exclusion register or on the watchlist gets neither: it gets a
     notice that this site does not cover it, why, and where to read it
     (the wording approved by the author on 27 Oct 2026, docs/ROADMAP-v2.md
     §8), because the full view would present it as an instrument this
     site analyses.

   Which instrument has a page is asked of js/routes.js, which answers
   from the data — the same function the generator and the sitemap ask.
   ============================================================ */

import { loadAll, index, renderError, loadOverlay } from './data.js';
import { renderInstrument } from './instrument-view.js';
import { hasEntityPage, entityPath, siteRoot, href, coverage, notCovered } from './routes.js';
import { humanDate } from './format.js';
import { interactionsFor } from './interactions.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* the section nav follows the reading position, on one shared frame rather
   than a listener per section */
function spy() {
  const links = [...document.querySelectorAll('.subnav a')];
  const targets = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (!targets.length) return;
  let ticking = false;
  const paint = () => {
    ticking = false;
    const y = window.scrollY + 140;
    let cur = 0;
    targets.forEach((t, i) => { if (t.offsetTop <= y) cur = i; });
    links.forEach((a, i) => {
      if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(paint); }
  }, { passive: true });
  paint();
}

/** A page that is not to be indexed says so, and stops claiming a canonical. */
function noindex() {
  let m = document.querySelector('meta[name="robots"]');
  if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'robots'); document.head.appendChild(m); }
  m.setAttribute('content', 'noindex, follow');
  const c = document.querySelector('link[rel="canonical"]');
  if (c) c.remove();
}

/** The notice for an instrument this site names and deliberately does not
 *  cover. Every value in it is read from the record's scope decision and
 *  the source records it refers to; nothing here is written for one record. */
function notCoveredNotice(inst, IX) {
  const d = inst.scope_decision;
  const name = esc(inst.short_name);
  const first = coverage(inst) === 'watched'
    ? 'The ' + name + ' is on this site\'s watchlist: the brief does not analyse it today. ' +
      'The decision is reopened when: ' + esc(d.watch_for && d.watch_for.description)
    : 'The ' + name + ' is in this site\'s exclusion register: the brief does not analyse it.';
  const refer = (d.refer_to || []).map((id) => {
    const s = IX.source.get(id);
    if (!s) return '';
    const t = esc(s.title || s.publisher_name || id);
    return s.url ? '<a href="' + esc(s.url) + '" rel="noopener noreferrer" target="_blank">' + t + '</a>' : t;
  }).filter(Boolean).join('; ');
  return '<div class="page-head"><h1>' + name + '</h1>' +
    '<p class="lede"><strong>Not covered by this site.</strong> ' + first + '</p></div>' +
    '<p><strong>Why.</strong> ' + esc(d.reason) + '</p>' +
    (refer ? '<p><strong>Read it at the source:</strong> ' + refer + '</p>' : '') +
    '<p>Decision recorded on ' + esc(humanDate(d.approved_on, 'precision:day')) +
    '; the facts it rests on were last checked on ' + esc(humanDate(d.last_verified, 'precision:day')) + '.</p>' +
    relationshipsRecorded(inst, IX);
}

/* The relationships the dataset records for a record it does not cover,
   with the instrument page's own renderer (decided 28 Oct 2026,
   docs/ROADMAP-v2.md §8): an edge to a covered instrument is otherwise
   visible from that end only. Nothing when there are none. */
function relationshipsRecorded(inst, IX) {
  const blocks = interactionsFor(inst.id, IX);
  if (!blocks) return '';
  const n = (IX.relationship || []).filter((r) => r.from === inst.id || r.to === inst.id).length;
  /* a <div>, not a <section>: agent/browser/checks.mjs checkNotCovered proves the
     notice is not the instrument view by finding no <section> in it */
  return '<div class="section" id="sec-interactions"><h2>Relationships recorded</h2>' +
    '<p>' + n + ' recorded relationship' + (n === 1 ? '' : 's') + ' with other instruments.</p>' +
    '<div class="ix-list ix-inline">' + blocks + '</div></div>';
}

async function boot() {
  const mount = document.getElementById('instrumentPage');
  const declared = document.body.dataset.instrument || null;
  const asked = declared || new URLSearchParams(location.search).get('id');

  if (!declared && !asked) {
    /* the chooser this page used to render is the list on the instruments
       page now, generated into its HTML so a crawler can follow it */
    location.replace(href('instruments.html') + '#instrument-records');
    return;
  }

  let db;
  try {
    db = await loadAll(['taxonomy', 'instruments', 'institutions', 'sources', 'claims',
      'timeline', 'enforcement', 'applicability', 'glossary']);
  } catch (e) {
    /* on a pre-rendered page the static view stays: it is the same view,
       true on every date, and wiping it for a failed refresh would leave
       the reader with less than the HTML already gave them */
    if (!declared) renderError(mount, e, () => boot());
    return;
  }
  const IX = index(db);
  const inst = IX.instrument.get(asked);

  if (!declared && inst && hasEntityPage(inst, IX)) {
    location.replace(siteRoot() + entityPath(inst.id) + location.hash);
    return;
  }

  const OVERLAY = await loadOverlay();

  if (!inst) {
    noindex();
    mount.innerHTML = '<div class="page-head"><h1>No such instrument</h1>' +
      '<p class="lede">Nothing in the dataset has the id <span class="mono">' + esc(asked) + '</span>. ' +
      'It may have been renamed — ids are permanent by rule, so this is more likely a typo in the link. ' +
      '<a href="' + esc(href('instruments.html')) + '#instrument-records">Every instrument with a page of its own</a>.</p></div>';
    document.title = 'No such instrument | EU Digital Policy';
    return;
  }

  const kept = notCovered(inst);

  if (!declared) {
    noindex();
    document.title = inst.short_name + ' | EU Digital Policy';
    document.body.dataset.crumb = inst.short_name;
    const crumb = document.querySelector('.crumbs [aria-current="page"]');
    if (crumb) crumb.textContent = inst.short_name;
  }

  if (kept) {
    mount.innerHTML = notCoveredNotice(inst, IX);
    return;
  }

  mount.innerHTML = renderInstrument(inst, {
    ix: IX, db, overlay: OVERLAY, today: new Date().toISOString().slice(0, 10), root: siteRoot(),
  });

  spy();

  /* deep links land on the section, not near it */
  if (location.hash) {
    let t = null;
    try { t = document.querySelector(location.hash); } catch (e) { /* not a selector */ }
    if (t) t.scrollIntoView({ block: 'start' });
  }
}

boot();
