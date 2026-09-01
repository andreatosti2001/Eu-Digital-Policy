/* ============================================================
   UXProposal — a change to the interface

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
   ============================================================ */

import { F } from '../fields.mjs';
import { defineProposal } from '../define.mjs';

export const UXProposal = defineProposal({
  name: 'UXProposal',
  doc: 'A proposed change to how the site presents itself: pages, components, tokens, interaction, accessibility.',
  fields: {
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
  ],
});
