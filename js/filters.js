/* ============================================================
   FILTER STATE — one system, shared by every filtered view.

   The controls themselves stay where they are: each page knows what
   its own dimensions are. What was missing everywhere was the state
   *readout* — which filters are currently on, how many records that
   leaves, and a way to take one off without hunting back through the
   select that set it. A reader who has to reopen three menus to find
   out what they have chosen has been given a puzzle rather than a
   tool.

   Also here: reflecting the state in the URL, so a filtered view is
   a thing you can send to somebody.
   ============================================================ */

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Render the active-filter row.
 * @param {object} o
 *   host      element to render into
 *   active    [{key, label, value}] — one per filter that is set
 *   count     {shown, total}
 *   onRemove  (key) => void
 *   onClear   () => void
 */
export function renderFilterState(o) {
  const host = o.host;
  if (!host) return;
  const active = o.active || [];
  const c = o.count || {};

  if (!active.length) {
    /* the count still matters when nothing is filtered: it tells the reader
       how big the set is before they narrow it */
    host.innerHTML = c.total != null
      ? '<span class="result-count" role="status">' + c.total + ' record' +
        (c.total === 1 ? '' : 's') + '</span>'
      : '';
    return;
  }

  host.innerHTML =
    active.map((f) =>
      '<span class="chip"><span>' + esc(f.label) + ': <b>' + esc(f.value) + '</b></span>' +
      '<button type="button" data-remove="' + esc(f.key) + '" ' +
      'aria-label="Remove filter ' + esc(f.label) + ': ' + esc(f.value) + '">×</button></span>').join('') +
    '<button type="button" class="link-btn" data-clear>Clear all</button>' +
    '<span class="result-count" role="status">' +
      (c.shown != null && c.total != null
        ? c.shown + ' of ' + c.total + ' shown'
        : (c.shown || 0) + ' shown') + '</span>';

  host.onclick = (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) { o.onRemove(rm.dataset.remove); return; }
    if (e.target.closest('[data-clear]')) o.onClear();
  };
}

/** Write the set filters into the query string, replacing rather than pushing
 *  so the back button still leaves the page rather than unwinding ten filter
 *  changes one at a time. */
export function syncUrl(filters) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
  const q = p.toString();
  history.replaceState(null, '', q ? location.pathname + '?' + q + location.hash
                                   : location.pathname + location.hash);
}

/** Read filters back out of the query string, ignoring anything unrecognised. */
export function readUrl(filters) {
  const p = new URLSearchParams(location.search);
  const out = { ...filters };
  for (const k of Object.keys(filters)) {
    const v = p.get(k);
    if (v) out[k] = v;
  }
  return out;
}

/** A real empty state: what happened, and what to do about it. */
export function emptyState(what, hint) {
  return '<div class="state" data-kind="empty">' +
    '<h3>No ' + esc(what) + ' match these filters</h3>' +
    '<p>' + esc(hint || 'Removing one of the active filters above will widen the set.') + '</p>' +
    '<div class="state-actions"><button type="button" class="link-btn" data-clear>Clear all filters</button></div>' +
    '</div>';
}
