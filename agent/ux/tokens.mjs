/* ============================================================
   agent/ux/tokens.mjs — the existing design system, and the refusal
   to invent one

   SESSION 17's rule, in its own words: "No proposal may invent
   arbitrary design tokens. Use the existing design system."

   That rule is enforceable because the design system is a set of
   files rather than a taste. `css/tokens.css` declares eleven type
   roles, one spacing scale, a radius and motion vocabulary, and a
   theme-dependent layer on `body`; `style.css` declares the
   palette. Every custom property in this repository is declared
   somewhere, and `tools/design-qa.mjs` already errors on a `var()`
   pointing at one that is not.

   SO THERE ARE TWO CHECKS, AND BOTH EXIST BECAUSE EITHER ALONE
   COULD BE EDITED AWAY.

   The contract rule refuses a proposal that ADDS a token with no
   open question saying what the existing system could not hold.
   This module refuses a proposal that NAMES a token no stylesheet
   declares, which the contract cannot do because a contract cannot
   read a file.

   AND ONE THING THIS DELIBERATELY DOES NOT DO. It does not judge
   whether a token is the RIGHT one. `--crit` and `--live` are both
   declared, both real, and choosing between them for a particular
   badge is a design decision about a production site. This module
   answers "does this exist"; it has no answer to "is this correct",
   and a module that pretended otherwise would be choosing the
   palette.
   ============================================================ */

/** Tokens a proposal may name without the stylesheets declaring
 *  them: the ones the markup and the modules set as inline custom
 *  properties. `surface.tokensOf` already collects these, and they
 *  are listed here only so the refusal message can say why one was
 *  allowed. */
export const INLINE_SET = 'set from the markup or from setProperty, not from a stylesheet';

/**
 * Is every token this proposal names one the design system already
 * declares?
 *
 * @param {{tokens_used?:string[], tokens_added?:object[]}} proposal
 * @param {object} tokens  from surface.tokensOf()
 * @returns {{ok:boolean, unknown:string[], why:string|null}}
 */
export function tokensExist(proposal, tokens) {
  const added = new Set((proposal.tokens_added ?? []).map((t) => t.token));
  const unknown = (proposal.tokens_used ?? [])
    .filter((t) => !tokens.declared.has(t) && !added.has(t));
  if (!unknown.length) return { ok: true, unknown: [], why: null };
  return {
    ok: false,
    unknown,
    why: `names ${unknown.length} custom propert${unknown.length === 1 ? 'y' : 'ies'} no stylesheet declares — ${unknown.join(', ')}. SESSION 17's rule is that a proposal uses the existing design system; a token this agent made up would enter that system through a proposal nobody read closely.`,
  };
}

/**
 * The tokens a set of stylesheet rules actually leans on.
 *
 * Used to fill `tokens_used` from the rules a finding quotes, so a
 * proposal's declared dependency on the design system is READ off
 * the rules it would change rather than asserted about them.
 */
export function tokensIn(text, tokens) {
  const named = new Set();
  for (const m of String(text ?? '').matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
    if (tokens.declared.has(m[1])) named.add(m[1]);
  }
  return [...named].sort();
}

/**
 * A token that already carries a non-colour channel for a status,
 * for a proposal that needs one.
 *
 * Returns what the design system HAS, never what it should use:
 * `.badge` in `css/tokens.css` is the one component that draws a
 * status with a glyph and a border style, and a proposal about
 * status legibility should point at it rather than invent a second
 * vocabulary. Which glyph goes with which state is the author's.
 */
export function statusVocabulary(surface) {
  const rules = surface.sheets.flatMap((s) => s.rules)
    .filter((r) => /\.badge\[data-st=/.test(r.selector));
  const glyphs = rules
    .filter((r) => r.declarations.some((d) => d.prop === 'content'))
    .map((r) => ({
      state: (r.selector.match(/data-st="([^"]+)"/) ?? [])[1] ?? null,
      glyph: (r.declarations.find((d) => d.prop === 'content')?.value ?? '').replace(/["']/g, ''),
      file: r.file,
      line: r.line,
    }));
  const borders = rules
    .filter((r) => r.declarations.some((d) => d.prop === 'border-style'))
    .map((r) => ({
      state: (r.selector.match(/data-st="([^"]+)"/) ?? [])[1] ?? null,
      style: r.declarations.find((d) => d.prop === 'border-style')?.value ?? null,
      file: r.file,
      line: r.line,
    }));
  return { glyphs, borders, component: '.badge', home: glyphs[0]?.file ?? 'css/tokens.css' };
}
