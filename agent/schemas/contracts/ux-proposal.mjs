/* ============================================================
   UXProposal — a change to the interface, and (SESSION 16) a
   finding about it

   Two of this project's rules exist because both already shipped as
   bugs: status is never carried by hue alone, and a theme-dependent
   token is declared on `body`, never on `:root`. `design-qa.mjs`
   checks both. This contract asks the proposing agent to declare
   them rather than discover them.

   The accessibility block is deliberately four separate booleans
   with a note, not one "accessible: true". The project already
   states that no screen-reader and no non-Chromium testing has been
   done; a proposal that quietly implies otherwise would be the kind
   of resolved-looking answer this repository exists to refuse.

   ------------------------------------------------------------
   SESSION 16 · WHY THIS CONTRACT GREW RATHER THAN GAINED A SIBLING

   `UXProposal` had existed since SESSION 03 and had been produced by
   nothing — precisely where `EditorialProposal` stood before
   SESSION 14. SESSION 16 asks for a UX AUDIT: findings, each with a
   problem, evidence, an affected journey, a severity, a recommended
   change and a success criterion, ranked into a backlog.

   Everything in that list except five things was already here.
   `reason` is the problem, `evidence` is the evidence,
   `proposed_change` is the recommended change, `confidence` and
   `risk` are already separated. What the contract could not hold is
   the difference between A FINDING and A PROPOSAL, whose journey a
   defect sits on, how bad it is, and how anyone would know it had
   been fixed.

   Five fields, and each one is a field rather than a convention
   because a rule had to be written against it:

     proposal_kind      so "a finding never drafts a value" is
                        enforceable rather than conventional
     finding_class      so "an enhancement is not a defect" is
     severity           so a backlog can be ordered by something
                        other than the order the lenses ran in
     affected_journey   so a defect is attached to a reader doing
                        something, not to a file
     success_criterion  so a proposal that cannot be falsified is
                        refused at the boundary

   SESSION 17 adds the testable half — hypothesis, metrics,
   regression risks, accessibility checks, browser tests — on the
   same contract, under `proposal_kind: "testable_proposal"`. A
   finding carries none of them and the rules below say so, so the
   two cannot be confused by a reader or by a query.

   AND THE TOKENS. SESSION 17's brief: "No proposal may invent
   arbitrary design tokens. Use the existing design system."
   `tokens_used` is how a proposal says which existing custom
   properties it leans on, and a proposal that adds one must carry an
   open question saying what the existing system could not hold.
   The contract cannot read `css/tokens.css`; `agent/ux/tokens.mjs`
   does, and refuses a proposal naming a property no stylesheet
   declares. Both checks exist because either alone could be edited
   away.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineProposal } from '../define.mjs';
import {
  UX_FINDING_CLASSES, UX_SEVERITIES, UX_PROPOSAL_KINDS,
  UX_NON_DEFECT_CLASS, UX_DRAFTABLE_KIND,
} from '../types.mjs';

const Journey = F.object({
  id: F.string('The journey\'s id — read_the_brief, check_what_applies_to_me, follow_the_evidence.'),
  label: F.string('What the reader is trying to do, in their words rather than the product\'s.'),
  pages: F.array(F.string('A page filename the journey passes through.'), 'The pages it runs through. A journey that touches no page is not a journey.', { min: 1 }),
  why: F.string('Why this defect sits on this journey — what the reader is doing when they meet it.'),
}, 'The reader\'s journey this sits on. A defect attached to a file tells a reviewer where the code is; a defect attached to a journey tells them who is affected.');

export const UXProposal = defineProposal({
  name: 'UXProposal',
  doc: 'A finding about how the site presents itself, or a proposed change to it: pages, components, tokens, interaction, accessibility.',
  fields: {
    /* ---------------------------------------------------- SESSION 16 */
    proposal_kind: F.enum(UX_PROPOSAL_KINDS, 'finding — something is wrong, and no value is drafted. testable_proposal — the smallest coherent change, with the tests that would prove it.'),
    finding_class: F.enum(UX_FINDING_CLASSES, 'Which of the seven this is. "enhancement" is the one that is not a defect, and the severity rules hold it to that.'),
    severity: F.enum(UX_SEVERITIES, 'How bad it is for a reader. Derived by the auditing agent from the class, the journey and the spread — never assigned by hand.', { epistemic: 'inference' }),
    affected_journey: Journey,
    success_criterion: F.text('How anyone would know this had been fixed, stated so it could fail. Never a restatement of the change: "the badge is legible in greyscale" is a criterion, "the badge is fixed" is not.'),

    /* ---------------------------------------------------- SESSION 17 */
    hypothesis: F.text('What is believed to be true about the reader, which this change would test. Null on a finding: a finding says what is wrong, and a hypothesis is what you would do about it.', { nullable: true, epistemic: 'interpretation' }),
    success_metrics: F.array(F.object({
      metric: F.string('What would be measured.'),
      how_measured: F.string('By what — a validator, a count in the markup, a manual pass. This project has no analytics and no telemetry, so a metric that needs them is not available here and must not be written as though it were.'),
      baseline: F.string('What it measures today. A metric with no before is not a metric.', { nullable: true }),
    }, 'One measurable outcome.'), 'How the change would be judged. Empty on a finding.'),
    regression_risks: F.array(F.object({
      risk: F.string('What this change could break.'),
      watch: F.string('What would show it — a validator, a page, a state.'),
      mitigation: F.string('What keeps it from happening, or null if nothing does.', { nullable: true }),
    }, 'One thing that could go wrong.'), 'What this could break. Empty on a finding.'),
    accessibility_checks: F.array(F.object({
      check: F.string('What must be true after the change.'),
      how: F.string('How it would actually be checked.'),
      tool: F.string('What does the checking — a validator, a browser, a person. Null where nothing in this repository can.', { nullable: true }),
    }, 'One accessibility check.'), 'What must be verified about access before this lands. Empty on a finding.'),
    browser_tests: F.array(F.object({
      name: F.string('What the test is called.'),
      page: F.string('Which page it drives.'),
      steps: F.array(F.string('One step.'), 'The steps, in order.', { min: 1 }),
      expected: F.string('What passing looks like.'),
      harness: F.string('What would run it. This repository has no browser harness and no dependency budget for one, so a test that needs one says so rather than implying it exists.', { nullable: true }),
    }, 'One browser test.'), 'The tests that would prove the change. Empty on a finding.'),
    tokens_used: F.array(F.string('An existing custom property, including the leading --.'), 'The design system this leans on. Every entry must already be declared in a stylesheet; agent/ux/tokens.mjs checks that against the files.'),

    /* ---------------------------------------------------- SESSION 03 */
    pages: F.array(F.string('A page filename.'), 'Which of the seven pages this touches.'),
    components: F.array(F.string('A component or module name.'), 'Which components change.'),
    tokens_added: F.array(F.object({
      token: F.string('The custom property name, including the leading --.'),
      light: F.string('Its value in the light theme.'),
      dark: F.string('Its value in the dark theme. Both themes or neither.'),
      declared_on: F.enum(['body'], 'Always body. A theme-dependent token on :root cannot change with the theme — this already shipped as a bug.'),
    }, 'One new design token.'), 'New tokens. A new colour goes in css/tokens.css in both themes, on body, never inline.'),
    status_conveyed_by_hue_alone: F.bool('True if any state would be distinguishable only by colour. Must be false — this already shipped as a bug and design-qa.mjs checks for it.'),
    adds_third_party_asset: F.bool('True if this would load a font, script, stylesheet or image from another origin. Red tier, and design-qa.mjs fails the build on it.'),
    accessibility: F.object({
      keyboard_reachable: F.bool('Every new control is reachable and operable by keyboard.'),
      accessible_name: F.bool('Every new control has an accessible name.'),
      contrast_checked: F.bool('Contrast was actually computed in both themes, not eyeballed.'),
      screen_reader_checked: F.bool('A screen reader was actually used. The project has never been able to say true here; saying it falsely is worse than the gap.'),
      note: F.text('What was checked, how, and what was not.', { nullable: true }),
    }, 'What was actually verified about this change, separately from what is believed about it.'),
    motion_note: F.text('What this does under prefers-reduced-motion.', { nullable: true }),
  },
  forbidden: {
    inline_style: 'A colour never goes inline. It goes in css/tokens.css, in both themes, on body.',
    looks_good: 'Not a field. What the proposal is standing on goes in evidence; what it is claiming goes in the epistemic block.',
    priority: 'Not a field. Severity says how bad it is for a reader; where it sits in a backlog is derived from severity and the journey, and storing the position would be a second home for the ordering.',
    users_affected: 'Not a field. This project has no analytics and no telemetry: a number here could only be invented, and an invented number is the most persuasive kind of fabrication.',
  },
  rules: [
    (r) => (r.status_conveyed_by_hue_alone === true
      ? ['status_conveyed_by_hue_alone is true: status is never carried by hue alone in this project — this already shipped as a bug once']
      : []),
    (r) => ((r.tokens_added ?? []).filter((t) => t.declared_on !== 'body').length
      ? ['a token is declared somewhere other than body: a theme-dependent token on :root cannot change with the theme']
      : []),
    (r) => (r.adds_third_party_asset === true && r.autonomy_class !== 'human_only'
      ? [`adds_third_party_asset is true with autonomy_class "${r.autonomy_class}": a third-party request is red tier and design-qa.mjs fails on it`]
      : []),
    (r) => (r.accessibility?.contrast_checked === false && !(r.epistemic?.unresolved ?? []).some((u) => /contrast/i.test(u.question + u.missing))
      ? ['contrast was not checked and no unresolved entry says so: an unchecked contrast is an open question, not a silent omission']
      : []),
    (r) => ((r.pages ?? []).length === 0 && (r.components ?? []).length === 0
      ? ['neither a page nor a component is named: say what this changes']
      : []),

    /* ------------------------------------------------ SESSION 16 rules */

    /* A FINDING DRAFTS NOTHING. SESSION 16's brief is explicit: the
       agent observes and proposes, and does not redesign the website
       in this session. The same guarantee agent/architect/ gives
       about schemas, given here about the interface. */
    (r) => {
      if (r.proposal_kind !== 'finding') return [];
      const drafted = (r.proposed_change?.operations ?? []).filter((o) => o.proposed !== null && o.proposed !== undefined);
      return drafted.length
        ? [`proposal_kind is "finding" but ${drafted.length} operation(s) carry a drafted value: a finding names what is wrong and what the decision is, and drafting the replacement is redesigning the site`]
        : [];
    },
    (r) => (r.proposal_kind === 'finding' && (r.tokens_added ?? []).length
      ? [`proposal_kind is "finding" but ${r.tokens_added.length} token(s) are added: a finding does not design, and a token invented inside one would enter the design system through the back door`]
      : []),
    (r) => (r.proposal_kind === 'finding'
      && (r.hypothesis !== null
        || (r.success_metrics ?? []).length || (r.regression_risks ?? []).length
        || (r.accessibility_checks ?? []).length || (r.browser_tests ?? []).length)
      ? ['proposal_kind is "finding" but it carries the testable half: a hypothesis, a metric, a regression risk or a browser test belongs to a testable_proposal, and a finding wearing them reads as a decided change']
      : []),

    /* AN ENHANCEMENT IS NOT A DEFECT. Without this, "could be
       better" competes with "a reader cannot read the status" for
       the top of the backlog, and the backlog stops meaning
       anything. */
    (r) => (r.finding_class === UX_NON_DEFECT_CLASS && (r.severity === 'critical' || r.severity === 'high')
      ? [`finding_class is "${UX_NON_DEFECT_CLASS}" at severity "${r.severity}": an opportunity is not a defect, and ranking one above a defect is how a backlog stops being a ranking`]
      : []),

    /* THE WORST FINDING STANDS ON SOMETHING QUOTED. `critical` is
       reserved for an absence of knowledge that reads as a negative
       finding — the failure this whole site exists to prevent — and
       a claim that large may not rest on an inference alone. */
    (r) => (r.severity === 'critical' && !(r.epistemic?.fact ?? []).length
      ? ['severity is "critical" with no fact entry: the worst class of finding here says a reader may be misled, and that claim is made from something read out of a file rather than concluded about one']
      : []),

    /* A CRITERION THAT RESTATES THE CHANGE IS NOT A CRITERION. */
    (r) => {
      const c = String(r.success_criterion ?? '').trim().toLowerCase();
      const s = String(r.proposed_change?.summary ?? '').trim().toLowerCase();
      return c && c === s
        ? ['success_criterion repeats proposed_change.summary word for word: a criterion says how anyone would know the change worked, which is a different sentence from what the change is']
        : [];
    },

    /* SAYING A SCREEN READER WAS USED IS THE ONE CLAIM HERE NOBODY
       MAY MAKE LOOSELY. README limitation 7 is that none ever has
       been. */
    (r) => (r.accessibility?.screen_reader_checked === true && !r.accessibility?.note
      ? ['screen_reader_checked is true with no note: which screen reader, on what, is the whole content of that claim — and README limitation 7 says none has ever been run against this site']
      : []),

    /* ------------------------------------------------ SESSION 17 rules */

    /* A PROPOSAL NOBODY CAN FALSIFY IS A SUGGESTION. The four
       arrays are what SESSION 17 asked for, and a testable proposal
       missing one of them is not testable. */
    (r) => {
      if (r.proposal_kind !== UX_DRAFTABLE_KIND) return [];
      const missing = [];
      if (!(r.success_metrics ?? []).length) missing.push('success_metrics');
      if (!(r.regression_risks ?? []).length) missing.push('regression_risks');
      if (!(r.accessibility_checks ?? []).length) missing.push('accessibility_checks');
      if (!(r.browser_tests ?? []).length) missing.push('browser_tests');
      return missing.length
        ? [`proposal_kind is "${UX_DRAFTABLE_KIND}" but ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} empty: a proposal nobody can test is a suggestion`]
        : [];
    },
    (r) => (r.proposal_kind === UX_DRAFTABLE_KIND && r.hypothesis === null
      ? [`proposal_kind is "${UX_DRAFTABLE_KIND}" with a null hypothesis: what is believed about the reader is the thing the change would test, and a change that tests nothing cannot be judged afterwards`]
      : []),

    /* USE THE EXISTING DESIGN SYSTEM. A new token is not forbidden;
       an UNEXPLAINED one is. The open question is where the reviewer
       reads what the existing system could not hold. */
    (r) => ((r.tokens_added ?? []).length
      && !(r.epistemic?.unresolved ?? []).some((u) => /token|design system/i.test(`${u.question} ${u.missing}`))
      ? [`${r.tokens_added.length} new token(s) with no unresolved entry about them: SESSION 17's rule is that a proposal uses the existing design system, so adding to it is an open question about the system rather than a detail of the change`]
      : []),
  ],
});
