/* ============================================================
   agent/ux/journeys.mjs — what a reader came here to do

   A defect attached to a file tells a reviewer where the code is. A
   defect attached to a JOURNEY tells them who is affected and what
   they were in the middle of, which is the difference between a
   backlog and a list of nits.

   THE JOURNEYS ARE READ, NOT INVENTED. `js/shell.js` carries the
   site's own conceptual model in two literals — `NAV`, whose
   comment says the order "is the conceptual model of the product,
   not alphabetical and not traffic-ranked", and `DOOR_BLURB`, which
   is the author's one-line answer to what each destination is for.
   Both are parsed out of the module. Writing a list of journeys here
   would be a second home for the product's own model, and the two
   would drift the first time a destination was added.

   FOUR JOURNEYS ARE NOT DESTINATIONS, and they are derived from the
   modules rather than from the nav: searching the record, opening a
   glossary term, following a claim to its evidence, and reading in
   another language. Each is declared with the module that owns it
   and is dropped if that module is not there, so a journey cannot
   outlive the thing it describes.

   NOTHING HERE KNOWS ANYTHING ABOUT ANY READER. This project has no
   analytics, no telemetry and no user research, and
   `UXProposal.forbidden.users_affected` exists so that a count of
   affected readers cannot be written into a record. A journey is a
   statement about what the interface OFFERS, which is checkable
   from the files; it is not a statement about who takes it.
   ============================================================ */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './surface.mjs';

/**
 * How much a defect on this journey costs a reader, used by the
 * severity model and by nothing else.
 *
 * `legal_consequence` is the one that matters and it is narrow on
 * purpose: a journey earns it only where a reader can come away with
 * a belief about what the law requires of them. Applicability is the
 * clearest case — the tool answers "does this apply to me?" — and
 * the evidence journey is the second, because a reader following a
 * claim to what carries it is deciding how much to trust a statement
 * about EU law. Everything else is `comprehension` or `navigation`,
 * and inflating a journey to `legal_consequence` to raise a
 * finding's severity is the failure this field is guarding.
 */
export const JOURNEY_STAKES = ['legal_consequence', 'comprehension', 'navigation'];

/** Which destination carries which stake. Keyed by the nav model's
 *  own ids so a renamed destination fails loudly rather than
 *  silently losing its stake. */
const STAKE_OF = {
  applies: 'legal_consequence',
  evidence: 'legal_consequence',
  brief: 'comprehension',
  instruments: 'comprehension',
  institutions: 'comprehension',
  enforcement: 'comprehension',
};

/** What the reader is doing, in their words rather than the
 *  product's. The nav model's `long` label is the product's name for
 *  the destination; this is the question a reader arrives with. Kept
 *  beside the stake because both are judgements about the same
 *  thing, and splitting them would put half a judgement in two
 *  files. */
const ASKING = {
  brief: 'Read the argument and understand how the EU regulates software.',
  instruments: 'Compare instruments and see how they differ.',
  institutions: 'Find out who is actually responsible for what.',
  enforcement: 'See what has actually been enforced, and how far it got.',
  applies: 'Work out whether any of this applies to me.',
  evidence: 'Check what a statement on this site is actually standing on.',
};

/* ---------------------------------------------------- the nav model */

/**
 * `NAV` and `DOOR_BLURB`, parsed out of `js/shell.js`.
 *
 * Parsed rather than imported because `js/shell.js` is a browser
 * module that touches `document` and `localStorage` at load; a Node
 * import of it would need a DOM, and a DOM here would be a
 * dependency. Parsing is the smaller lie: it reads the literal, and
 * the suite asserts the count it read matches the count in the file.
 */
export function navModelOf({ root = REPO_ROOT } = {}) {
  const path = 'js/shell.js';
  if (!existsSync(join(root, path))) return { path, entries: [], blurbs: {} };
  const src = readFileSync(join(root, path), 'utf8');

  const navBlock = (src.match(/export const NAV = \[([\s\S]*?)\n\];/) ?? [])[1] ?? '';
  const entries = [...navBlock.matchAll(/\{\s*id:\s*'([^']+)',\s*file:\s*'([^']+)',\s*label:\s*'([^']*)',\s*long:\s*'([^']*)'/g)]
    .map((m, i) => ({ id: m[1], file: m[2], label: m[3], long: m[4], order: i }));

  const blurbBlock = (src.match(/const DOOR_BLURB = \{([\s\S]*?)\n\};/) ?? [])[1] ?? '';
  const blurbs = Object.fromEntries([...blurbBlock.matchAll(/(\w+):\s*'([^']*)'/g)].map((m) => [m[1], m[2]]));

  /* Pages that are not destinations, and the destination each sits
     under. `instrument.html` is the only one, and it is the page
     nothing in any markup links to. */
  const childOf = Object.fromEntries([...(src.match(/const CHILD_OF = \{([^}]*)\}/) ?? ['', ''])[1]
    .matchAll(/(\w+):\s*'([^']+)'/g)].map((m) => [m[1], m[2]]));

  return { path, src, entries, blurbs, childOf };
}

/* ---------------------------------------------------- the journeys */

/**
 * The journeys a reader can take, each with the pages and modules it
 * runs through.
 *
 * @param {object} surface  from readSurface()
 */
export function journeysOf(surface) {
  const nav = navModelOf({ root: surface.root });
  const has = (path) => surface.modules.some((m) => m.path === path);
  const page = (file) => surface.pages.find((p) => p.page === file) ?? null;

  const out = [];

  for (const entry of nav.entries) {
    const p = page(entry.file);
    if (!p) continue;
    /* The detail pages that hang off this destination, from the nav
       model's own CHILD_OF rather than from a guess. */
    const children = Object.entries(nav.childOf ?? {})
      .filter(([, parent]) => parent === entry.id)
      .map(([child]) => surface.pages.find((x) => x.data_page === child)?.page)
      .filter(Boolean);
    out.push({
      id: entry.id,
      label: ASKING[entry.id] ?? entry.long,
      product_label: entry.long,
      blurb: nav.blurbs[entry.id] ?? null,
      pages: [entry.file, ...children],
      /* Every module the destination's pages actually run, through
         the import graph. */
      modules: [...new Set([entry.file, ...children].flatMap((f) => surface.graph.byPage.get(f) ?? []))].sort(),
      stake: STAKE_OF[entry.id] ?? 'navigation',
      order: entry.order,
      derived_from: `${nav.path} NAV[${entry.order}]`,
    });
  }

  /* The four that are not destinations. Each names the module that
     owns it, and is dropped if that module is gone — a journey that
     outlived its implementation would be a finding about nothing. */
  const CROSS = [
    {
      id: 'search_the_record', owners: ['js/palette.js'],
      label: 'Find a thing by name, from wherever I am.',
      stake: 'navigation',
      why: 'The search control is in the chrome on every page but the brief, and on the brief it is the palette bound in app.js.',
    },
    {
      id: 'open_a_term', owners: ['js/glossary-graph.js'],
      label: 'Find out what a word in this means.',
      stake: 'comprehension',
      why: 'A glossary button sits inline in the running prose; opening one is a reader interrupting a sentence to check a term.',
    },
    {
      id: 'follow_the_evidence', owners: ['js/evidence.js', 'js/evidence-view.js', 'js/bibliography.js'],
      label: 'See what this particular statement is standing on.',
      stake: 'legal_consequence',
      why: 'The evidence markers and their drawer are how a reader gets from a sentence about EU law to the source behind it, and the grade attached to it.',
    },
    {
      id: 'read_in_another_language', owners: ['js/shell.js', 'app.js'],
      label: 'Read this in Italian, French or Spanish.',
      stake: 'comprehension',
      why: 'i18n/locales.json declares three shipped locales, and the chrome carries whichever one the reader chose on the brief.',
    },
  ];

  for (const c of CROSS) {
    const owners = c.owners.filter(has);
    if (!owners.length) continue;
    /* THE PAGES ARE THE ONES THAT ACTUALLY LOAD THE MODULE, followed
       through the import graph rather than read off the two script
       tags in the markup. `index.html` names two scripts and runs
       seventeen modules; a journey scoped to the two would be scoped
       to almost nothing. */
    const pages = [...new Set(owners.flatMap((o) => surface.graph.pagesLoading(o)))].sort();
    if (!pages.length) continue;
    out.push({
      id: c.id,
      label: c.label,
      product_label: c.label,
      blurb: null,
      pages,
      modules: owners,
      stake: c.stake,
      order: 100 + CROSS.indexOf(c),
      cross_cutting: true,
      why: c.why,
      derived_from: owners.join(', '),
    });
  }

  /* AND THE ONE THAT IS THE SITE ITSELF. A defect in the shared
     chrome, in the token layer or in a stylesheet every page loads is
     not a defect on the applicability tool; it is a defect on using
     this site at all, and filing it under the highest-stake journey
     it happens to touch would make every shared-file finding read as
     a finding about what the law requires of somebody. It reaches
     those journeys, and `also_reaches` on the finding says so — but
     the stake it is weighed at is the one it actually has. */
  out.push({
    id: 'the_site',
    label: 'Use this site at all.',
    product_label: 'The site',
    blurb: null,
    pages: surface.pages.map((p) => p.page),
    modules: surface.modules.map((m) => m.path),
    stake: 'navigation',
    order: 200,
    site_wide: true,
    why: 'The finding is in a file every page loads, or reaches every page, so it is not on one journey — it is on all of them at once.',
    derived_from: 'every page in the repository',
  });

  return out;
}

/**
 * The journey a finding sits on, chosen by the files it touches.
 *
 * A finding that touches a shared file — `css/tokens.css`,
 * `js/shell.js`, `app.js` — reaches every journey, and the one it is
 * FILED under is the one with the highest stake, because that is the
 * reader who pays most for it. The others are recorded on the
 * finding as `also_reaches` rather than dropped: a defect in the
 * chrome is not a defect on one page, and a record that said so
 * would understate it.
 */
export function journeyFor(journeys, { pages = [], modules = [] } = {}) {
  const site = journeys.find((j) => j.site_wide);
  const specific = journeys.filter((j) => !j.site_wide);
  const touched = specific.filter((j) =>
    pages.some((p) => j.pages.includes(p)) || modules.some((m) => j.modules.includes(m)));
  if (!touched.length) return { journey: site ?? null, also_reaches: [] };

  /* A finding that reaches every page is the site's, not the
     highest-stake journey's. Without this every finding in a shared
     stylesheet is filed against the applicability tool, because that
     is the journey with the most at stake and every finding touches
     it — which would make the field say "this matters" rather than
     "this is where the reader meets it". */
  if (site && pages.length && site.pages.every((p) => pages.includes(p))) {
    const rank = (j) => JOURNEY_STAKES.indexOf(j.stake);
    return { journey: site, also_reaches: [...touched].sort((a, b) => rank(a) - rank(b) || a.order - b.order).map((j) => j.id) };
  }

  const rank = (j) => JOURNEY_STAKES.indexOf(j.stake);
  const sorted = [...touched].sort((a, b) => rank(a) - rank(b) || a.order - b.order);
  return { journey: sorted[0], also_reaches: sorted.slice(1).map((j) => j.id) };
}

/** The contract's journey shape, from a journey and the reason this
 *  finding sits on it. */
export function journeyRecord(journey, why) {
  return {
    id: journey.id,
    label: journey.label,
    pages: journey.pages,
    why,
  };
}
