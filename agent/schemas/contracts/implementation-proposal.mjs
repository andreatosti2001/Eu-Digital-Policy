/* ============================================================
   ImplementationProposal — a change to the code

   The three rules below are the repository's own, stated as checks
   rather than as prose:

     · no new dependency, ever, without a human. Zero dependencies is
       not a preference here, it is a red-tier prohibition and part
       of what the site is arguing.
     · no build step, for the same reason.
     · js/data.js is the only module that fetches a dataset. A
       renderer that calls fetch() has quietly become a second data
       gateway, and the two can then disagree about what the data is.

   `validator_impact` is where a proposal states, in advance, what
   it expects the four validators to say. A new warning is a
   finding, not noise — so a proposal that expects one has to say
   why before the run, not explain it afterwards.
   ============================================================ */

import { F } from '../fields.mjs';
import { defineProposal } from '../define.mjs';

export const ImplementationProposal = defineProposal({
  name: 'ImplementationProposal',
  doc: 'A proposed change to the code: modules, scripts, tools, tests.',
  fields: {
    files: F.array(F.string('A repository path.'), 'Every file this would touch.', { min: 1 }),
    modules: F.array(F.string('A module path.'), 'Which ES modules change behaviour.'),
    new_dependencies: F.array(F.string('A package name and version.'), 'Any dependency this would add. Must be empty, and a non-empty list is red tier.'),
    adds_build_step: F.bool('True if anything would need compiling, bundling or generating at deploy time. Red tier.'),
    adds_fetch_call: F.bool('True if a new fetch() would be introduced. Only js/data.js may fetch a dataset.'),
    fetch_modules: F.array(F.string('A module path.'), 'Which modules would fetch. Anything but js/data.js breaks the single data gateway.'),
    tests_added: F.array(F.object({
      file: F.string('Where the test lives.'),
      covers: F.string('What behaviour it holds down.'),
      command: F.string('How to run it.'),
    }, 'One test.'), 'Tests added with this change. Adding a check is always safe; adding one that fails is a finding, not a regression.'),
    validator_impact: F.object({
      baseline_ref: F.string('Which recorded baseline this is measured against — docs/CURRENT-ARCHITECTURE.md §12, or a run in this session.'),
      expected_new_errors: F.int('How many new errors this is expected to produce. Anything but 0 needs a very good reason.', { min: 0 }),
      expected_new_warnings: F.int('How many new warnings. A new warning is a finding, not noise.', { min: 0 }),
      justification: F.text('Why a new warning or error is acceptable. Required when either count is above zero.', { nullable: true }),
    }, 'What the four validators are expected to say afterwards, stated before they are run.'),
  },
  forbidden: {
    package_json: 'There is no package.json in this repository and adding one is a red-tier architectural change. Propose it as an ArchitectureProposal, where the introduces_dependency flag forces the tier.',
    refactor_everything: 'Not a field. A proposal names the files it touches.',
  },
  rules: [
    (r) => ((r.new_dependencies ?? []).length > 0 && r.autonomy_class !== 'human_only'
      ? [`new_dependencies lists ${r.new_dependencies.join(', ')} with autonomy_class "${r.autonomy_class}": zero dependencies is a red-tier prohibition, not a default`]
      : []),
    (r) => (r.adds_build_step === true && r.autonomy_class !== 'human_only'
      ? [`adds_build_step is true with autonomy_class "${r.autonomy_class}": introducing a build step is red tier`]
      : []),
    (r) => {
      const bad = (r.fetch_modules ?? []).filter((m) => m !== 'js/data.js');
      return bad.length ? [`${bad.join(', ')} would fetch: js/data.js is the only module that fetches a dataset, and a second gateway is a second home for the data`] : [];
    },
    (r) => (r.adds_fetch_call === true && (r.fetch_modules ?? []).length === 0
      ? ['adds_fetch_call is true but fetch_modules is empty: name the module that would fetch']
      : []),
    (r) => {
      const vi = r.validator_impact ?? {};
      return (vi.expected_new_errors > 0 || vi.expected_new_warnings > 0) && !vi.justification
        ? ['validator_impact expects a new error or warning but gives no justification: a new warning is a finding, and a finding is explained before the run, not after']
        : [];
    },
    (r) => ((r.validator_impact?.expected_new_errors ?? 0) > 0 && r.autonomy_class === 'autonomous'
      ? ['a proposal that expects new validator errors cannot be autonomous']
      : []),
  ],
});
