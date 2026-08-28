/* ============================================================
   Boot. Loads the canonical datasets once, builds the indexes, and
   hands them to each view. Runs after app.js so that the English
   snapshot the i18n layer takes is clean of anything added here.
   ============================================================ */

import { loadAll, index, renderError, loadOverlay } from './data.js';
import { initEvidence } from './evidence.js';
import { initStatus } from './status.js';
import { initCalendar } from './calendar.js';
import { initDNA, setOverlay } from './dna.js';
import { initGlossaryGraph } from './glossary-graph.js';
import { initMasthead } from './masthead.js';
import { initPyramid } from './pyramid.js';
import { initShell } from './shell.js';
import { initPalette } from './palette.js';
import { initInteractions } from './interactions.js';

const NEEDED = ['taxonomy', 'instruments', 'institutions', 'sources', 'claims', 'timeline'];

async function boot() {
  /* the chrome first: it owns the skip-link target and the destinations,
     neither of which should wait on a dataset */
  try { initShell(); } catch (e) { console.error('[shell] failed', e); }

  let db;
  try {
    db = await loadAll(NEEDED);
  } catch (e) {
    // §42: say so plainly, substitute nothing, leave the prose alone.
    const annex = document.querySelector('#annex-a .part-body') || document.querySelector('#part-1 .part-body');
    const mount = document.createElement('div');
    if (annex) annex.insertBefore(mount, annex.firstChild);
    renderError(mount, e, () => { mount.remove(); boot(); });
    console.error('[evidence] dataset load failed —', e);
    return;
  }

  const ix = index(db);

  const overlay = await loadOverlay();

  try { initDNA(ix, overlay); } catch (e) { console.error('[dna] failed', e); }
  try { initEvidence(ix); } catch (e) { console.error('[evidence] failed', e); }
  try { initStatus(ix); } catch (e) { console.error('[status] failed', e); }
  try { await initCalendar(ix); } catch (e) { console.error('[calendar] failed', e); }

  document.addEventListener('i18n:applied', (e) => {
    if (e.detail && e.detail.source === 'calendar') return;
    loadOverlay().then((o) => { setOverlay(o); initDNA(ix, o); });
  });

  document.dispatchEvent(new CustomEvent('evidence:ready', { detail: { records: ix.claim.size } }));

  /* The palette and the glossary both read the canonical entities. Neither is
     on the critical path for reading the brief, so both are started after the
     article itself is rendered and neither can block it if it fails. */
  /* the masthead is the first thing a reader sees, so it goes first */
  initMasthead().catch((e) => console.error('[masthead] failed', e));
  /* the palette starts the entity index itself, so it is started once */
  initPalette().catch((e) => console.error('[palette] failed', e));
  initGlossaryGraph().catch((e) => console.error('[glossary] graph failed', e));
  initPyramid().catch((e) => console.error('[pyramid] failed', e));
  /* the interactions view reads instruments, claims and sources, all of which
     are already loaded; it renders into Part IX and blocks nothing */
  initInteractions(ix).catch((e) => console.error('[interactions] failed', e));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
