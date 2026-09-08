/* ============================================================
   THE THRESHOLD — the public site's discovery route to a private
   control plane, and nothing else.
   ------------------------------------------------------------
   WHAT THIS IS. A reader who types a particular phrase into the
   search palette is shown one extra result. Choosing it plays a
   short drawn transition and then offers a link to the Control
   Room's login page. That is the whole mechanism.

   WHAT THIS IS NOT, said first because it is the part that matters.
   It does not authenticate. It does not authorize. It does not
   approve, execute, or read anything privileged. It holds no
   token, no session, no credential, no endpoint that answers with
   system data, and no state that any server anywhere consults. The
   phrase is NOT a credential: anybody who finds it — and it is
   written in this file, which is served to every reader — arrives
   at exactly the same login page as somebody who typed the URL,
   and meets exactly the same authentication and authorization
   layers there.

   That is the governance protocol's own position, not a
   convenience: §10 says a hidden route, a hidden link, robots.txt,
   a frontend check and an unlisted page are NOT security
   mechanisms. A discovery affordance that had to stay secret to be
   safe would be one of them. This one does not have to.

   WHERE IT LEADS, AND WHY THAT IS USUALLY NOWHERE. The Control
   Room is `.control-room/`, and a path whose segments begin with a
   dot is not served by this site's deployment. So on the published
   site the passage ends at a statement — the control plane is
   somewhere else, it requires an account, and this page cannot get
   you one — and only a deployment that declares an address in
   `<meta name="eu-control-room">` navigates anywhere. Nothing here
   invents one, and the published pages declare none.

   THE VISUAL LANGUAGE. A wheel: three concentric bands divided
   3 · 7 · 12, twenty-two letters set around them, drawn in fine
   lines in the site's own ink. It is an original construction in
   the diagrammatic manner of the Sefer Yetzirah wheels, and the
   division is the reason it is here rather than decoration: that
   tradition's twenty-two letters are an ENUM AUTHORITY — a closed
   vocabulary from which everything else is said to be composed —
   which is exactly what `data/taxonomy.json` is to every other
   dataset on this site. The transition says: a closed vocabulary,
   recognised, and a door behind it. It does not say hacking, and
   there is deliberately nothing here of the terminal-green kind.

   IT IS INTERRUPTIBLE AND IT DEGRADES. Escape or a click ends it at
   any point; `prefers-reduced-motion` skips straight to the end
   state; a browser without inline SVG gets the panel and the link
   without the drawing. No privileged state, and no state at all,
   depends on the animation completing.
   ============================================================ */

/* The phrase. Thirty-two is the count the tradition gives the paths
   of wisdom — twenty-two letters and ten sefirot — and it is the
   only string in this module that has to be typed exactly. It is
   not secret and nothing depends on it being unguessable. */
const TRIGGERS = ['thirty-two paths', 'thirty two paths', '32 paths'];

const MOTHERS = ['א', 'מ', 'ש'];
const DOUBLES = ['ב', 'ג', 'ד', 'כ', 'פ', 'ר', 'ת'];
const SIMPLES = ['ה', 'ו', 'ז', 'ח', 'ט', 'י', 'ל', 'נ', 'ס', 'ע', 'צ', 'ק'];

const NS = 'http://www.w3.org/2000/svg';

const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();

/** True when the query is the phrase. Nothing else in this module
    runs until this returns true. */
export function isThreshold(q) { return TRIGGERS.indexOf(norm(q)) !== -1; }

/** The address of the Control Room, if this deployment declares one.
    Read from the document, never from a default, and never
    constructed: a page that guessed an address would be publishing
    a claim about where a private system lives. */
export function controlRoomHref(doc) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d || !d.querySelector) return null;
  const meta = d.querySelector('meta[name="eu-control-room"]');
  const v = meta && meta.getAttribute('content');
  return v && v.trim() ? v.trim() : null;
}

/* ---------------------------------------------------------- the wheel */

function el(name, attrs) {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  return n;
}

/** One band: a ring, its radial divisions, and its letters. */
function band(g, { r, count, letters, klass }) {
  g.appendChild(el('circle', { cx: 0, cy: 0, r, class: 'thr-ring ' + klass }));
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const inner = r - 26;
    g.appendChild(el('line', {
      x1: Math.cos(a) * inner, y1: Math.sin(a) * inner,
      x2: Math.cos(a) * r, y2: Math.sin(a) * r,
      class: 'thr-spoke ' + klass,
    }));
    const mid = a + (Math.PI / count);
    const t = el('text', {
      x: Math.cos(mid) * (r - 13), y: Math.sin(mid) * (r - 13),
      class: 'thr-letter ' + klass, 'text-anchor': 'middle', 'dominant-baseline': 'central',
    });
    t.textContent = letters[i % letters.length];
    g.appendChild(t);
  }
}

function wheel() {
  const svg = el('svg', { viewBox: '-160 -160 320 320', class: 'thr-wheel', 'aria-hidden': 'true', focusable: 'false' });
  const g = el('g', {});
  band(g, { r: 148, count: 12, letters: SIMPLES, klass: 'thr-b3' });
  band(g, { r: 104, count: 7, letters: DOUBLES, klass: 'thr-b2' });
  band(g, { r: 62, count: 3, letters: MOTHERS, klass: 'thr-b1' });
  g.appendChild(el('circle', { cx: 0, cy: 0, r: 20, class: 'thr-gate' }));
  svg.appendChild(g);
  return svg;
}

/* ---------------------------------------------------------- the passage */

let open = null;

/** Close whatever is open. Safe to call at any time, including
    before anything has been opened. */
export function close() {
  if (!open) return;
  document.removeEventListener('keydown', open.onKey, true);
  if (open.node && open.node.parentNode) open.node.parentNode.removeChild(open.node);
  if (open.restore && open.restore.focus) { try { open.restore.focus(); } catch (e) { /* the element may be gone */ } }
  open = null;
}

/**
 * Play the transition and offer the login.
 *
 * @param {{href?:string|null, reduced?:boolean|null, doc?:Document}} opts
 *        `href` and `reduced` are injectable so the suite can drive
 *        this without a browser's media queries.
 */
export function passage(opts) {
  const o = opts || {};
  if (typeof document === 'undefined') return null;
  close();

  const href = o.href !== undefined ? o.href : controlRoomHref(o.doc);
  const reduced = o.reduced !== undefined && o.reduced !== null
    ? o.reduced
    : !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const node = document.createElement('div');
  node.className = 'thr-scrim';
  node.setAttribute('role', 'dialog');
  node.setAttribute('aria-modal', 'true');
  node.setAttribute('aria-label', 'Threshold');

  const figure = document.createElement('div');
  figure.className = 'thr-figure';
  /* A browser without inline SVG gets the panel and nothing else,
     which is the whole of what the mechanism actually does. */
  if (document.createElementNS) figure.appendChild(wheel());

  const panel = document.createElement('div');
  panel.className = 'thr-panel';
  const kicker = document.createElement('p');
  kicker.className = 'thr-kicker';
  kicker.textContent = 'Threshold';
  const h = document.createElement('h2');
  h.className = 'thr-title';
  h.textContent = 'A private control plane';
  const p1 = document.createElement('p');
  p1.className = 'thr-body';
  p1.textContent = 'The agents that maintain this record, the evidence behind each proposal, and the decisions taken on them are administered elsewhere, on a system that is not part of this website. Finding this page grants no access to it: it is behind an account, and every privileged request there is authorised on its own server.';
  const p2 = document.createElement('p');
  p2.className = 'thr-body thr-quiet';
  p2.textContent = href
    ? 'Continuing takes you to its login page, where you will be asked to sign in.'
    : 'This deployment does not publish its address, so there is nowhere for this page to send you. Run the Control Room yourself with node .control-room/cli.mjs serve and open the address it prints.';

  const actions = document.createElement('div');
  actions.className = 'thr-actions';
  if (href) {
    const a = document.createElement('a');
    a.className = 'thr-go';
    a.href = href;
    a.rel = 'nofollow';
    a.textContent = 'Continue to the Control Room login';
    actions.appendChild(a);
  }
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'thr-back';
  back.textContent = href ? 'Back to the record' : 'Close';
  back.addEventListener('click', close);
  actions.appendChild(back);

  panel.appendChild(kicker); panel.appendChild(h); panel.appendChild(p1); panel.appendChild(p2); panel.appendChild(actions);
  node.appendChild(figure);
  node.appendChild(panel);
  /* A click anywhere off the panel ends it, exactly as a click on
     the button does. Nothing is committed at any point, so there is
     nothing an accidental dismissal could lose. */
  node.addEventListener('click', (e) => { if (e.target === node || e.target === figure) close(); });

  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey, true);

  open = { node, onKey, restore: document.activeElement };
  document.body.appendChild(node);

  /* The transition is one class. Removing it, or never adding it,
     leaves the finished state on screen — which is why an
     interruption cannot strand the reader half way through. */
  if (reduced) node.classList.add('thr-still');
  else requestAnimationFrame(() => node.classList.add('thr-run'));

  try { back.focus(); } catch (e) { /* not focusable in every context */ }
  return node;
}

/* ---------------------------------------------------------- the provider */

/**
 * The palette's provider contract: given a query, return groups.
 * Returns exactly one item, and only for the phrase. Every other
 * query gets an empty array, so this module contributes nothing to
 * ordinary search.
 */
export function thresholdProvider(q) {
  if (!isThreshold(q)) return [];
  return [{
    kind: 'threshold',
    label: 'Threshold',
    items: [{
      kind: 'threshold',
      mark: 'א',
      title: 'The thirty-two paths',
      sub: 'A private control plane, behind its own login. This page grants no access to it.',
      action: () => passage(),
    }],
  }];
}

export const THRESHOLD_TRIGGERS = TRIGGERS.slice();
