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

   THE VISUAL LANGUAGE. A wheel, drawn the way the Sefer Yetzirah
   diagrams and the volvelles in their margins are drawn: points set
   evenly on a circle and joined to every other point, so that the
   chords themselves weave the figure. Four such lattices sit inside
   one another — twenty-two points on the rim, then twelve, then
   seven, then three — inside a stack of concentric rules, with a
   radiant aperture at the centre and four rosettes held outside the
   rim. Fine lines, the site's own ink, one warm accent at the
   centre. There is not a single letter anywhere in it, and nothing
   in it is meant to be read.

   The counts are the point. 3 · 7 · 12 · 22 is the partition those
   diagrams give the alphabet — three mothers, seven doubles, twelve
   simples, twenty-two in all — kept here as a division of MARKS
   rather than of letters, because the reason it is here at all is
   not decorative. A closed set of divisions that everything else is
   drawn from is an ENUM AUTHORITY, which is exactly what
   `data/taxonomy.json` is to every other dataset on this site. The
   transition says: a closed vocabulary, recognised, and a door
   behind it. It does not say hacking, and there is deliberately
   nothing here of the terminal-green kind.

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

/* The divisions, kept as counts rather than as an alphabet. Each is
   a number of points on a circle; the drawing is what joining them
   to one another produces. */
const RIM_COUNT = 22;
const OUTER_COUNT = 12;
const MID_COUNT = 7;
const CORE_COUNT = 3;
const GRADUATIONS = 66;
const RAY_COUNT = 44;

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

const angleAt = (i, count) => (i / count) * Math.PI * 2 - Math.PI / 2;
const pointAt = (angle, r) => [Math.cos(angle) * r, Math.sin(angle) * r];

/** A plain rule: one concentric circle, nothing on it. */
function rule(g, r, klass) {
  g.appendChild(el('circle', { cx: 0, cy: 0, r, class: 'thr-ring ' + klass }));
}

/** One radial mark, at a given angle, between two radii. */
function tick(g, { angle, rInner, rOuter, klass }) {
  const [x1, y1] = pointAt(angle, rInner);
  const [x2, y2] = pointAt(angle, rOuter);
  g.appendChild(el('line', { x1, y1, x2, y2, class: klass }));
}

/** The figure this whole drawing is made of: `count` points set
 *  evenly on a circle of radius `r`, every point joined to every
 *  other. Twenty-two points give two hundred and thirty-one chords,
 *  twelve give sixty-six, seven give twenty-one, three give three —
 *  and the weave that produces is the thing, not any one line in it.
 *  `skip` drops the shortest chords where the ring should read as a
 *  lattice rather than as a filled disc. The chords go in their own
 *  group so the transition can raise the whole web at once instead
 *  of animating each line. Returns the points, for a caller that
 *  wants to brace one ring against another. */
function rose(g, { r, count, klass, nodeR = 1.9, skip = 1, chords = true }) {
  const pts = [];
  for (let i = 0; i < count; i++) pts.push(pointAt(angleAt(i, count), r));
  if (chords) {
    const web = el('g', { class: 'thr-web ' + klass });
    for (let i = 0; i < count; i++) {
      for (let j = i + skip; j < count; j++) {
        web.appendChild(el('line', {
          x1: pts[i][0], y1: pts[i][1], x2: pts[j][0], y2: pts[j][1], class: 'thr-chord',
        }));
      }
    }
    g.appendChild(web);
  }
  for (const [x, y] of pts) g.appendChild(el('circle', { cx: x, cy: y, r: nodeR, class: 'thr-node ' + klass }));
  return pts;
}

/** The rim: three close-set rules, sixty-six graduations between the
 *  outer two, and the twenty-two-point lattice hung inside them. */
function rim(g) {
  rule(g, 158, 'thr-b4');
  rule(g, 150, 'thr-b4');
  rule(g, 138, 'thr-b4');
  for (let i = 0; i < GRADUATIONS; i++) {
    const major = i % 3 === 0;
    tick(g, {
      angle: angleAt(i, GRADUATIONS),
      rInner: major ? 150 : 153,
      rOuter: 158,
      klass: 'thr-tick ' + (major ? 'thr-tick-major ' : '') + 'thr-b4',
    });
  }
  const pts = rose(g, { r: 138, count: RIM_COUNT, klass: 'thr-b4', skip: 1, nodeR: 2.2 });
  for (const [x, y] of pts) g.appendChild(el('line', { x1: x, y1: y, x2: x * (150 / 138), y2: y * (150 / 138), class: 'thr-spoke thr-b4' }));
}

/** The inner wheels: twelve, seven, three — each a lattice of its
 *  own, each on its own rule, turning together against the rim. A
 *  band of forty-four fine marks divides the space between the first
 *  two, so the eye has something to read the rotation against once
 *  the chords behind it have gone still. */
function wheels(g) {
  rule(g, 118, 'thr-b3');
  rose(g, { r: 112, count: OUTER_COUNT, klass: 'thr-b3', skip: 1 });
  for (let i = 0; i < RAY_COUNT; i++) {
    tick(g, { angle: angleAt(i, RAY_COUNT), rInner: i % 4 === 0 ? 100 : 105, rOuter: 112, klass: 'thr-tick thr-b3' });
  }
  rule(g, 96, 'thr-b2');
  rose(g, { r: 76, count: MID_COUNT, klass: 'thr-b2', skip: 1, nodeR: 2.4 });
  rule(g, 62, 'thr-b1');
  rose(g, { r: 46, count: CORE_COUNT, klass: 'thr-b1', skip: 1, nodeR: 2.8 });
}

/** A rosette: a small lattice on its own, set outside the rim on a
 *  diagonal. Four of them hold the square of the figure against the
 *  circle of it — the corner ornaments those diagrams carry, drawn
 *  from the same construction as everything else rather than as a
 *  separate device. */
function rosette(g, { cx, cy, r, count }) {
  const holder = el('g', { class: 'thr-rosette', transform: `translate(${cx} ${cy})` });
  rule(holder, r, 'thr-b2');
  rose(holder, { r: r * 0.78, count, klass: 'thr-b2', skip: 1, nodeR: 1.2 });
  g.appendChild(holder);
}

/** The fixed frame: the aperture at the centre with its radiance,
 *  and the four rosettes outside the rim. Neither wheel touches
 *  these; they hold still while both turn. */
function frame(g) {
  for (let i = 0; i < RAY_COUNT; i++) {
    const long = i % 4 === 0;
    tick(g, { angle: angleAt(i, RAY_COUNT), rInner: long ? 9 : 14, rOuter: long ? 26 : 21, klass: 'thr-ray' });
  }
  g.appendChild(el('circle', { cx: 0, cy: 0, r: 26, class: 'thr-gate' }));
  g.appendChild(el('circle', { cx: 0, cy: 0, r: 8, class: 'thr-gate' }));
  g.appendChild(el('circle', { cx: 0, cy: 0, r: 2, class: 'thr-gate-dot' }));
  /* Far enough out that a rosette clears the rim rather than
     straddling it: the corners of the square are where these belong,
     holding the figure's four sides against its one circle. */
  const d = 133;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    rosette(g, { cx: sx * d, cy: sy * d, r: 15, count: 7 });
  }
}

function wheel() {
  const svg = el('svg', { viewBox: '-180 -180 360 360', class: 'thr-wheel', 'aria-hidden': 'true', focusable: 'false' });
  const outer = el('g', { class: 'thr-rotor thr-rotor-a' });
  rim(outer);
  svg.appendChild(outer);

  const inner = el('g', { class: 'thr-rotor thr-rotor-b' });
  wheels(inner);
  svg.appendChild(inner);

  const fixed = el('g', { class: 'thr-fixed' });
  frame(fixed);
  svg.appendChild(fixed);

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
      mark: '⊙',
      title: 'The thirty-two paths',
      sub: 'A private control plane, behind its own login. This page grants no access to it.',
      action: () => passage(),
    }],
  }];
}

export const THRESHOLD_TRIGGERS = TRIGGERS.slice();
