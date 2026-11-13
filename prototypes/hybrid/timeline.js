/* PV2-05 · the analytical view (roadmap §8, "PV2-03, C.1 question 3": the
   timeline), with the same two modes as the observatory's, reached by the
   same real links:
   - Timeline: the observatory's timeline mode, imported whole
     (../observatory/timeline.js): direction 2's table-first layout, which is
     what direction 3 takes for the analytical view (docs/FRONTEND-REFERENCES.md
     §8.2, 3). Its links are relative, so they stay in this folder.
   - Network: the Hybrid's own explorer (explorer.js), flat and led by the
     relationships table (roadmap §8, "PV2-05, C.1 question 1"). */

import { boot, section } from '../observatory/common.js';
import { mountExplorer } from './explorer.js';

const NEEDED = ['taxonomy', 'instruments', 'timeline', 'claims', 'sources', 'brief'];
const params = new URLSearchParams(location.search);

if (params.get('mode') === 'network') {
  boot(NEEDED, (db, ix, mount) => {
    const focus = params.get('focus');
    document.title = 'Network explorer · Hybrid prototype';
    mount.classList.add('full'); // the explorer lays out its own two columns: no "On this page" list
    mount.innerHTML = `
      <header class="head">
        <p class="kicker">Analysis</p>
        <h1>Timeline and network</h1>
        <p class="lede">The relationships recorded between the instruments the site records — only those: none is inferred, and none is drawn from a shared provision or source. The table is the record; the map beside it is its picture.</p>
      </header>
      <nav class="modes" aria-label="Modes of the analytical view">
        <a href="timeline.html">Timeline</a>
        <a href="timeline.html?mode=network" aria-current="page">Network explorer</a>
      </nav>
      ${section('explorer', 'Regulatory network explorer', '<div id="explorer-root"></div>')}`;
    mountExplorer(mount.querySelector('#explorer-root'), ix, db, {
      focus: focus && ix.instrument.get(focus) ? ix.instrument.get(focus).id : null,
    });
  });
} else {
  await import('../observatory/timeline.js');
}
