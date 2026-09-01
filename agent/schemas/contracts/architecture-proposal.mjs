/* ============================================================
   ArchitectureProposal — a change to how the system is built

   docs/CURRENT-ARCHITECTURE.md closes by listing what must not be
   rebuilt, and AI-SAFE-BOUNDARIES §3 makes architectural
   replacement red tier: a framework, a build step, a bundler, a
   dependency, a service worker, server-side rendering, a
   third-party script or stylesheet. Two of those already fail
   `tools/design-qa.mjs`.

   The three `introduces_*` booleans exist so a proposal has to
   declare it rather than have it discovered in review, and the
   rules below refuse any autonomy class other than human_only when
   one is true. The named invariants are the properties the site's
   argument rests on; touching one is at least amber.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineProposal } from '../define.mjs';

export const ARCHITECTURE_INVARIANTS = [
  'single_data_gateway',        // js/data.js is the only module that fetches a dataset
  'single_shell_renderer',      // js/shell.js renders the chrome from one nav model
  'one_home_per_fact',
  'derivation_over_storage',
  'taxonomy_enum_authority',
  'null_vs_unknown',
  'unknown_is_never_zero',
  'no_rule_is_not_a_negative',
  'zero_build',
  'zero_dependency',
  'no_third_party_request',
  'theme_token_on_body',
  'status_not_by_hue_alone',
  'footer_in_markup_not_script',
];

export const ArchitectureProposal = defineProposal({
  name: 'ArchitectureProposal',
  doc: 'A proposed change to the system\'s structure: modules, topology, tooling, or one of the invariants the architecture is made of.',
  fields: {
    modules_affected: F.array(F.string('A repository path.'), 'Which modules or scripts this touches.', { min: 1 }),
    invariants_touched: F.array(F.enum(ARCHITECTURE_INVARIANTS, 'One of the named invariants.'), 'Which architectural invariants this proposal bears on. Empty means none — and that claim is checkable in review.'),
    dependency_impact: F.text('What this does to the dependency map in docs/CURRENT-ARCHITECTURE.md §9 — including "nothing".'),
    introduces_dependency: F.bool('True if this adds any runtime or build dependency. Red tier.'),
    introduces_build_step: F.bool('True if anything would have to be compiled, bundled, minified or generated at deploy time. Red tier.'),
    introduces_third_party_request: F.bool('True if a page would request anything from an origin other than its own. Red tier, and design-qa.mjs fails on it.'),
    migration: F.text('How the repository gets from the current state to the proposed one without an intermediate state that is broken.', { nullable: true }),
    performance_note: F.text('What this costs or saves, measured rather than asserted. Null where nothing was measured.', { nullable: true, epistemic: 'inference' }),
  },
  forbidden: {
    approved: 'A proposal does not record its own approval. That is an ApprovalRequest.',
  },
  rules: [
    (r) => {
      const flags = ['introduces_dependency', 'introduces_build_step', 'introduces_third_party_request'].filter((k) => r[k] === true);
      return flags.length && r.autonomy_class !== 'human_only'
        ? [`${flags.join(', ')} true with autonomy_class "${r.autonomy_class}": architectural replacement is red tier — an agent may propose it and nothing more`]
        : [];
    },
    (r) => ((r.invariants_touched ?? []).length > 0 && r.autonomy_class === 'autonomous'
      ? [`invariants_touched names ${r.invariants_touched.join(', ')} but autonomy_class is "autonomous": an invariant the site's argument rests on is not a green-tier change`]
      : []),
    (r) => (r.introduces_third_party_request === true && !(r.validation_requirements ?? []).some((v) => v.command.includes('design-qa'))
      ? ['introduces_third_party_request is true but design-qa.mjs is not in validation_requirements: that script is what fails on a third-party resource']
      : []),
  ],
});
