/* ============================================================
   One accessible dialog primitive. Owns dialog semantics, focus
   movement, focus containment, Escape, focus restoration and
   background inerting — so no view has to reimplement them, and
   so the four existing overlays can adopt it later.
   ============================================================ */

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const stack = [];

function focusables(el) {
  return [...el.querySelectorAll(FOCUSABLE)]
    .filter((n) => n.getClientRects().length > 0 && !n.hasAttribute('inert'));
}

function onKeydown(e) {
  const top = stack[stack.length - 1];
  if (!top) return;
  if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); top.close(); return; }
  if (e.key !== 'Tab') return;
  const f = focusables(top.panel);
  if (!f.length) { e.preventDefault(); top.panel.focus(); return; }
  // Move focus explicitly rather than letting the browser decide and only
  // catching the edges: an element the edge test misses would leak focus
  // out of the dialog, and the leak is invisible to a sighted tester.
  e.preventDefault();
  const i = f.indexOf(document.activeElement);
  const step = e.shiftKey ? -1 : 1;
  const next = i === -1
    ? (e.shiftKey ? f[f.length - 1] : f[0])
    : f[(i + step + f.length) % f.length];
  next.focus();
}
document.addEventListener('keydown', onKeydown, true);

/**
 * Create a dialog around an existing panel element.
 * @param {HTMLElement} panel  the dialog surface
 * @param {HTMLElement} scrim  the backdrop (click closes)
 * @param {object} opts        { labelledBy, onClose }
 */
export function createDialog(panel, scrim, opts = {}) {
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('tabindex', '-1');
  if (opts.labelledBy) panel.setAttribute('aria-labelledby', opts.labelledBy);
  else if (opts.label) panel.setAttribute('aria-label', opts.label);
  panel.hidden = true;
  if (scrim) scrim.hidden = true;

  let opener = null;
  let open = false;

  const api = {
    panel,
    scrim,
    get isOpen() { return open; },
    open(trigger) {
      if (open) return;
      opener = trigger || document.activeElement;
      open = true;
      panel.hidden = false;
      if (scrim) { scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add('show')); }
      requestAnimationFrame(() => panel.classList.add('open'));
      // background is inert while the dialog is up
      inertSiblings(true);
      const f = focusables(panel);
      (f[0] || panel).focus({ preventScroll: true });
      stack.push(api);
    },
    close() {
      if (!open) return;
      open = false;
      panel.classList.remove('open');
      if (scrim) scrim.classList.remove('show');
      inertSiblings(false);
      const i = stack.indexOf(api);
      if (i > -1) stack.splice(i, 1);
      const done = () => { panel.hidden = true; if (scrim) scrim.hidden = true; };
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) done(); else setTimeout(done, 260);
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
      opener = null;
      if (typeof opts.onClose === 'function') opts.onClose();
    },
    toggle(trigger) { open ? api.close() : api.open(trigger); },
  };

  function inertSiblings(on) {
    for (const el of document.body.children) {
      if (el === panel || el === scrim) continue;
      if (on) {
        if (!el.hasAttribute('data-was-inert')) {
          el.setAttribute('data-was-inert', el.hasAttribute('inert') ? '1' : '0');
          el.setAttribute('inert', '');
          el.setAttribute('aria-hidden', 'true');
        }
      } else if (el.hasAttribute('data-was-inert')) {
        if (el.getAttribute('data-was-inert') === '0') { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
        el.removeAttribute('data-was-inert');
      }
    }
  }

  if (scrim) scrim.addEventListener('click', (e) => { if (e.target === scrim) api.close(); });
  return api;
}
