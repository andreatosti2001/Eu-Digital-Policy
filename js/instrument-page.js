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
     page. With no id, it forwards to the instrument list.

   Which instrument has a page is asked of js/routes.js, which answers
   from the data — the same function the generator and the sitemap ask.
   ============================================================ */

import { loadAll, index, renderError, loadOverlay } from './data.js';
import { renderInstrument } from './instrument-view.js';
import { hasEntityPage, entityPath, siteRoot, href } from './routes.js';

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

  if (!declared) {
    noindex();
    document.title = inst.short_name + ' | EU Digital Policy';
    document.body.dataset.crumb = inst.short_name;
    const crumb = document.querySelector('.crumbs [aria-current="page"]');
    if (crumb) crumb.textContent = inst.short_name;
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
