/* ============================================================
   PV2-05 · the Regulatory Network Explorer, Hybrid instance — the
   combination the author asked for at C.5 (roadmap §8, "PV2-05, C.5: the
   author's answer" and "the combination built now"): the Hybrid's layout,
   led by the table, with **the observatory's 3D network** in its map box,
   and an option to enlarge it to a full-width stage.

   One home: the network is prototypes/observatory/explorer.js's
   mountExplorer(), imported and run unchanged — its records, its counting
   function, its 3D layout, its controls, legend, tabbed panel, keyboard,
   phone ego view and table all come from there. This module only arranges
   what it renders, inside the same root (so its own lookups still find
   every part):
   - the box (the default): the selection panel and the relationships table
     on the left — the table leads — and the 3D stage on the right, its
     controls as a bar above the canvas and its legend below it;
   - enlarged: the stage across the full width, the panel back inside it on
     the right, exactly the observatory's arrangement, the table below.
     The same button, or Esc outside the canvas, shrinks it back.
   And it keys the table to the network: each row group gets "Show in the
   network", each relationship row a button that selects it there — matched
   to the records in relations.js's own order, and left unkeyed rather than
   keyed wrongly when a count does not match.

   The flat, ring-based explorer the Hybrid was measured with (a5eca14,
   docs/PROTOTYPES.md §3) stays in the branch's history.
   ============================================================ */

import { esc } from '../observatory/common.js';
import { mountExplorer as mountNetwork } from '../observatory/explorer.js';

const PHONE = '(max-width: 51.99rem)';

export function mountExplorer(root, ix, db, { focus = null, tableMount } = {}) {
  let sel = null;
  const api = mountNetwork(root, ix, db, { focus, tableMount, onSelect: (s) => { sel = s; } });

  /* ------------------------------------------------ the arrangement */
  const explorer = root.querySelector('.explorer');
  const stage = root.querySelector('.stage');
  const panel = root.querySelector('#ex-panel');
  const hx = document.createElement('div');
  hx.className = 'hx hx3d';
  hx.innerHTML = `
    <div class="hx-main">
      <div class="hx-panel-slot"></div>
      <section class="hx-table" aria-labelledby="hx-table-h"><h2 id="hx-table-h">The relationships, recorded</h2></section>
    </div>
    <div class="hx-side">
      <p class="hx-bar"><button type="button" class="btn hx-enlarge" aria-pressed="false">Enlarge the network</button></p>
    </div>`;
  root.appendChild(hx);
  hx.querySelector('.hx-side').appendChild(explorer);
  hx.querySelector('.hx-table').appendChild(tableMount);
  const slot = hx.querySelector('.hx-panel-slot');
  slot.appendChild(panel);
  panel.classList.add('hx-panel');

  const btn = hx.querySelector('.hx-enlarge');
  const setWide = (wide) => {
    hx.classList.toggle('hx--wide', wide);
    btn.setAttribute('aria-pressed', String(wide));
    btn.textContent = wide ? 'Back to the page layout' : 'Enlarge the network';
    if (wide) stage.appendChild(panel); else slot.appendChild(panel);
    panel.classList.toggle('hx-panel', !wide);
  };
  btn.addEventListener('click', () => setWide(!hx.classList.contains('hx--wide')));
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape' || !hx.classList.contains('hx--wide')) return;
    if (ev.target.closest && ev.target.closest('.ex-canvas')) return; // inside the canvas Esc clears the selection, as in the observatory
    setWide(false); btn.focus();
  });

  /* ------------------------------------------------ the table, keyed to the network */
  const names = new Map([...new Set(ix.instrument.values())].map((i) => [i.short_name, i]));
  const alpha = [...new Set(ix.instrument.values())].sort((a, b) => a.short_name.localeCompare(b.short_name));
  const shownKinds = () => new Set([...root.querySelectorAll('#ex-legend input[data-kind]')].filter((c) => c.checked).map((c) => c.dataset.kind));
  function annotate() {
    const table = tableMount.querySelector('table.rel');
    if (!table) return;
    const kinds = shownKinds();
    const rels = ix.relationship.filter((r) => kinds.has(r.kind));
    const groups = [...table.querySelectorAll(':scope > tbody')];
    let list;
    if (groups.length > 1 || groups[0]?.querySelector('th[scope="rowgroup"]')) list = alpha;
    else {
      const m = (table.caption?.textContent || '').match(/^Relationships recorded for (.+) in /);
      const inst = m && names.get(m[1]);
      list = inst ? [inst] : [];
    }
    const single = sel?.type === 'edge' ? ix.relationship.find((r) => r.id === sel.id) : null;
    groups.forEach((tb, gi) => {
      const inst = list[gi];
      if (!inst) return;
      const mine = single ? [single] : rels.filter((r) => r.from === inst.id || r.to === inst.id);
      const head = tb.querySelector('th[scope="rowgroup"]');
      if (head) head.insertAdjacentHTML('beforeend', ` <button type="button" class="hx-show" data-node="${esc(inst.id)}">Show in the network<span class="visually-hidden">: ${esc(inst.short_name)}</span></button>`);
      const rows = [...tb.rows].filter((tr) => tr.querySelector('td') && !tr.querySelector('td[colspan]'));
      if (rows.length !== mine.length) return;
      rows.forEach((tr, k) => {
        const r = mine[k];
        tr.dataset.rel = r.id;
        if (single) { tr.classList.add('picked'); return; }
        tr.cells[3]?.querySelector('div')?.insertAdjacentHTML('beforeend',
          ` <button type="button" class="hx-pick-rel" data-rel="${esc(r.id)}">Select in the network<span class="visually-hidden">: ${esc(ix.instrument.get(r.from)?.short_name || r.from)} and ${esc(ix.instrument.get(r.to)?.short_name || r.to)}</span></button>`);
      });
    });
    const go = (s) => {
      api.select(s, { focusNode: false });
      if (!window.matchMedia(PHONE).matches) explorer.scrollIntoView({ block: 'nearest' });
    };
    for (const b of tableMount.querySelectorAll('button.hx-show')) b.addEventListener('click', () => go({ type: 'node', id: b.dataset.node }));
    for (const b of tableMount.querySelectorAll('button.hx-pick-rel')) b.addEventListener('click', () => go({ type: 'edge', id: b.dataset.rel }));
  }
  /* the observatory's explorer re-renders the table on every selection and filter: key each new rendering */
  new MutationObserver(annotate).observe(tableMount, { childList: true });
  annotate();
  return api;
}
