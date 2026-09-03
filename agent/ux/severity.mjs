/* ============================================================
   agent/ux/severity.mjs — how bad it is, and where it goes in the
   backlog

   SESSION 16 asks for a severity on every finding and a prioritised
   backlog at the end. Both are easy to produce badly: a severity an
   agent assigns by feel is a number with nothing behind it, and a
   backlog ordered by that number inherits the problem and hides it
   under an ordinal.

   SO SEVERITY IS DERIVED, from three things that were read rather
   than judged:

     the CLASS     which of the seven the finding is
     the STAKE     what the reader on that journey can come away
                   believing — journeys.mjs derives it from the nav
                   model, and only two journeys carry the highest
     the SPREAD    how many pages, sheets or modules carry it

   and one gate that outranks all three.

   ------------------------------------------------------------
   THE GATE: AN ABSENCE OF KNOWLEDGE THAT READS AS A NEGATIVE
   FINDING IS ALWAYS `critical`.

   This is not a severity scale borrowed from general UX practice.
   It is this project's own thesis turned on its own interface. The
   site exists to say what it cannot support: `null` is not
   researched, `unknown` is researched and not determinable, no
   matching rule is NOT DETERMINED and never "probably not"
   (AGENTS.md rules 5 and 6, docs/AI-SAFE-BOUNDARIES.md §0.3 and
   §0.5, and the first section of the ux-audit skill's own
   checklist). A reader who takes one of those for "no obligation"
   may act on it, and that is not a usability complaint about a
   website — it is the harm the whole project is built to prevent.

   A finding that carries `misreads_absence: true` is `critical`
   whatever else it is, and `escalations` records that it was, so a
   reviewer can see the gate fire rather than take the number.

   ------------------------------------------------------------
   AND THE FLOOR: AN ENHANCEMENT IS NEVER A DEFECT.

   `enhancement` is capped at `medium` — the contract refuses
   `critical` and `high` on it independently, and both checks exist
   because either alone could be edited away. Without the cap, "the
   comparison table could group by regime" competes with "a reader
   cannot tell an unknown from a zero" for the top of the backlog,
   and the backlog stops being a ranking of anything.
   ============================================================ */

import { UX_SEVERITY_RANK, UX_NON_DEFECT_CLASS } from '../schemas/types.mjs';
import { JOURNEY_STAKES } from './journeys.mjs';

/**
 * The base severity of a class, before the journey and the spread
 * move it.
 *
 * `accessibility_defect` starts highest because it is the one class
 * where the reader cannot work around the problem: a colour-only
 * state is not harder to read in greyscale, it is absent. Every
 * other class starts at `medium` or below, and the journey is what
 * lifts it.
 */
export const CLASS_FLOOR = {
  accessibility_defect: 'high',
  usability_defect: 'medium',
  interaction_problem: 'medium',
  information_architecture: 'medium',
  discoverability: 'medium',
  visual: 'low',
  enhancement: 'low',
};

/** The highest an `enhancement` may reach. Nothing that is not a
 *  defect outranks one. */
export const NON_DEFECT_CEILING = 'medium';

const ORDER = ['critical', 'high', 'medium', 'low'];
const up = (s) => ORDER[Math.max(0, ORDER.indexOf(s) - 1)];
const down = (s) => ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(s) + 1)];
const cap = (s, ceiling) => (UX_SEVERITY_RANK[s] < UX_SEVERITY_RANK[ceiling] ? ceiling : s);

/**
 * Derive a severity, and return the working.
 *
 * The steps are returned rather than the number alone, because the
 * number is the least interesting part: a reviewer who disagrees
 * with a `high` needs to see which step produced it, and a severity
 * a reviewer cannot argue with is a severity nobody can correct.
 *
 * @param {{finding_class:string, stake:string, spread:number,
 *          misreads_absence?:boolean, blocks_journey?:boolean}} f
 */
export function severityOf(f) {
  const steps = [];
  const cls = f.finding_class;
  let s = CLASS_FLOOR[cls] ?? 'low';
  steps.push({ step: 'class floor', to: s, why: `a ${cls.replace(/_/g, ' ')} starts at ${s}` });

  /* THE GATE. Before anything else can move it, and recorded as an
     escalation rather than folded into the arithmetic. */
  if (f.misreads_absence === true) {
    steps.push({ step: 'absence gate', to: 'critical', why: 'a reader can take an absence of knowledge for a negative finding: AGENTS.md rules 5 and 6, and the failure this project exists to prevent' });
    return { severity: 'critical', steps, gated: true, capped: false };
  }

  /* A JOURNEY WHERE THE READER CAN COME AWAY WITH A BELIEF ABOUT
     WHAT THE LAW REQUIRES OF THEM. Two of the ten carry it, and
     journeys.mjs derives which from the nav model rather than
     letting a lens nominate one. */
  if (f.stake === 'legal_consequence') {
    const to = up(s);
    if (to !== s) steps.push({ step: 'journey stake', to, why: 'on a journey where the reader is deciding what applies to them, or what a statement is standing on' });
    s = to;
  } else if (f.stake === 'navigation' && cls !== 'accessibility_defect') {
    const to = down(s);
    if (to !== s) steps.push({ step: 'journey stake', to, why: 'on a journey where the cost is getting lost rather than being misled' });
    s = to;
  }

  /* A DEFECT THAT STOPS A READER COMPLETING THE JOURNEY AT ALL is
     not the same as one that makes it harder. Only a lens that can
     show the stop sets this. */
  if (f.blocks_journey === true) {
    const to = up(s);
    if (to !== s) steps.push({ step: 'blocks the journey', to, why: 'the reader cannot complete what they came to do, rather than completing it badly' });
    s = to;
  }

  /* SPREAD. Three or more surfaces is the point at which a defect is
     the system's rather than a page's. It moves severity by one
     step and no more: a defect on eight pages is not eight times
     worse than the same defect on one, and a scale that said so
     would put every shared-stylesheet finding at the top. */
  if ((f.spread ?? 1) >= 3) {
    const to = up(s);
    if (to !== s) steps.push({ step: 'spread', to, why: `it is carried by ${f.spread} surfaces, which makes it the design system's rather than one page's` });
    s = to;
  }

  /* THE CEILING ON EVERYTHING THE GATE DID NOT FIRE FOR.
     `critical` means one thing in this model — a reader can take an
     absence of knowledge for a negative finding — and a scale where
     three ordinary escalations can also reach it would make the word
     mean "several things at once" instead. Without the gate, `high`
     is the top. */
  let ceilinged = false;
  if (UX_SEVERITY_RANK[s] < UX_SEVERITY_RANK.high) {
    steps.push({ step: 'reserved ceiling', to: 'high', why: 'critical is reserved for a finding where a reader can take an absence of knowledge for a negative finding; this is not one, however much else it carries' });
    s = 'high';
    ceilinged = true;
  }

  /* THE FLOOR, applied last so nothing above it can lift an
     opportunity past a defect. */
  let capped = false;
  if (cls === UX_NON_DEFECT_CLASS) {
    const to = cap(s, NON_DEFECT_CEILING);
    if (to !== s) { steps.push({ step: 'not a defect', to, why: 'an enhancement is an opportunity, and an opportunity never outranks a defect' }); capped = true; }
    s = to;
  }

  return { severity: s, steps, gated: false, capped, ceilinged };
}

/**
 * The backlog: the findings, ordered.
 *
 * Severity first, then the journey's stake, then how much the
 * finding is standing on, then the subject — which is a total order
 * over any set of findings, so two runs over an unchanged site
 * produce the same backlog and a diff between two runs means
 * something.
 *
 * `rank` is DERIVED here and never stored on a record.
 * `UXProposal.forbidden.priority` says why: a stored position is a
 * second home for the ordering, and the day somebody re-runs the
 * audit the two disagree.
 */
export function backlogOf(findings) {
  const stake = (f) => JOURNEY_STAKES.indexOf(f.stake ?? 'navigation');
  return [...findings]
    .sort((a, b) =>
      (UX_SEVERITY_RANK[a.severity] - UX_SEVERITY_RANK[b.severity])
      || (stake(a) - stake(b))
      || ((b.quoted ?? 0) - (a.quoted ?? 0))
      || String(a.subject).localeCompare(String(b.subject)))
    .map((f, i) => ({ ...f, rank: i + 1 }));
}

/**
 * Where SESSION 17 stops.
 *
 * A testable proposal is written for the findings at the top of the
 * backlog and nowhere else, because a proposal for every finding is
 * a redesign and SESSION 16's brief refuses one. "High priority"
 * means severity `critical` or `high` — stated here as a constant
 * rather than as a number in a CLI flag, so the line has one home.
 */
export const HIGH_PRIORITY = new Set(['critical', 'high']);

export const isHighPriority = (f) => HIGH_PRIORITY.has(f.severity);

/** How much a finding is standing on, as a confidence. Never 1: this
 *  agent has established that the FILES say what it quotes, and has
 *  established nothing about what a reader actually experiences,
 *  because nothing here has opened a page. */
export function confidenceOf(finding) {
  const n = finding.quoted ?? (finding.evidence ?? []).length;
  if (finding.misreads_absence === true) return 0.9;
  if (n >= 6) return 0.85;
  if (n >= 3) return 0.8;
  if (n >= 2) return 0.75;
  return 0.7;
}
