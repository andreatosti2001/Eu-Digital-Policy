---
name: ux-audit
description: Review the interface for what the validators cannot see — accessibility beyond structure, status legibility, focus and dialog behaviour, and whether an absence of knowledge reads as one. Use when reviewing a view, not when running the checks.
---

# ux-audit

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 applies in full and is not restated here.

## Purpose

`tools/design-qa.mjs` checks structure: one `<h1>`, no skipped heading level, no duplicate id,
the skip link resolves, token layer first, no third-party resource, alt attributes present. It
cannot tell whether the interface is *legible*, whether focus goes somewhere sensible, or
whether a reader can tell "not researched" from "no obligation". That judgment is this skill.

## When to invoke

Reviewing a new or changed view. Before handing an interface change to the author. Auditing a
page against the accessibility limitations the README already states.

## Scope boundary

| This skill | Not this skill |
|---|---|
| Judgment the checks cannot make | Running the four validators — `legal-site-qa` |
| Whether a state reads correctly | Building the view — `frontend-implementation` |
| | The wording itself — `legal-editorial` |

## The audit that matters most here

**An absence of knowledge must not read as a negative finding.** This is the site's own
thesis applied to its interface, and it is the highest-severity class of defect the project
can ship.

- `null` (not researched) and `unknown` (researched, not determinable) must be visually and
  textually distinct, and both distinct from a value.
- An unknown pipeline stage is not an unreached one, and is never summed into a total or a
  percentage.
- Where no applicability rule fires, the interface says **NOT DETERMINED**, with the reason —
  never "probably not", never an empty panel that a reader reads as "no obligation".
- An empty state says which question returned nothing. A dataset failure shows an error and
  leaves the static content alone; it never renders fallback data.

## The rest of the checklist

`references/manual-checks.md` carries the full pass: keyboard path, focus management and
dialog semantics, status legibility without colour, motion, zoom and reflow, the three
declared theme states, and the locale fallback marking. Work it in order; report against it
item by item.

## Method

1. **Serve the site** — `python3 -m http.server 8000`. `file://` blocks the modules and the
   fetches, so a `file://` audit is an audit of nothing.
2. **Keyboard first, pointer second.** The skip link should be the first tab stop and move
   focus to `<main>`.
3. **Look at each state**, not just the happy one: loading, empty, error, unknown, `null`,
   not-determined, fallback-to-English.
4. **Both themes**, and greyscale. Status is never carried by hue alone — every badge state
   has a glyph and a border as well as a colour, and that rule exists because its absence
   already shipped as a bug.
5. **Say what you did not test.** The README's limitation 7 is that no screen reader has been
   run against this site, and that programmatic verification is not the same thing. An audit
   that implies otherwise makes the project's honesty worse.

## Done when

- Every item in `references/manual-checks.md` is marked pass, fail, or not tested.
- Each finding names the file, the state that produces it, and what a reader would conclude.
- The untested surfaces are listed by name.

## Refusal conditions

- Do not report a screen-reader, browser or device result you did not obtain. Chromium-only,
  programmatic-only is the honest description of what is testable here.
- Do not fix production code during an audit — record and hand off, as `repository-audit`
  does.
- Do not describe the deployed site if outbound access is blocked; audit the local server and
  say so.
- Do not soften an accessibility limitation the README already states.
