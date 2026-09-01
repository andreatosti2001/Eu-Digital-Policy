# The manual pass — what design-qa.mjs cannot see

Run against `python3 -m http.server 8000`. Mark each item **pass / fail / not tested**.
"Not tested" is a legitimate result and must appear in the report.

## 1. Absence of knowledge

- [ ] `null` and `unknown` render differently from each other and from a value, in text as
      well as in colour.
- [ ] No total, percentage, chart axis or pipeline count treats unknown as zero.
- [ ] Where no applicability rule fires, the outcome reads **Not determined**, with the reason
      given, and cannot be mistaken for "no obligation".
- [ ] A claim graded *Unresolved* is visibly distinguishable from one graded *Primary*.
- [ ] An interpretation is never rendered in the same way as binding law.
- [ ] A reference gap (asterisk) is visible in the prose and explained on inspection.

## 2. Keyboard and focus

- [ ] The skip link is the first tab stop and moves focus into `<main>`.
- [ ] Every interactive control is reachable by keyboard, in a sensible order.
- [ ] Focus is visible on every control, in both themes.
- [ ] Opening a dialog moves focus into it; closing returns focus to the trigger.
- [ ] `Escape` closes the dialog, the palette, the glossary popover, the overlay.
- [ ] Focus is trapped inside a modal dialog and nowhere else.
- [ ] No keyboard trap in the reading lens, the pager, or the contents overlay.

## 3. Names and semantics

- [ ] Every control has an accessible name that says what it does, not what it looks like.
- [ ] Icon-only buttons carry a label.
- [ ] Landmarks: one `main`, navigation labelled, no content outside a landmark.
- [ ] Headings describe the section, and the level reflects structure rather than size.
- [ ] Dynamic updates that matter (search results, an error) are announced, not silent.

## 4. Status without colour

- [ ] Every badge state carries a glyph and a border style as well as a colour.
- [ ] The page survives greyscale — check it, do not assume it.
- [ ] Nothing conveys "verified", "unknown" or "failed" by hue alone.

## 5. Theme, zoom, motion

- [ ] Both themes compute; no token resolves against the wrong palette. A theme-dependent
      token is declared on `body`, never `:root`.
- [ ] 200% zoom and a 320px-wide viewport: no horizontal scroll, no clipped control.
- [ ] `prefers-reduced-motion` is respected by every transition and the reading lens.
- [ ] Text remains legible against every surface it lands on, in both themes.

## 6. Failure and empty states

- [ ] A dataset that fails to load shows a clear error, leaves the surrounding static content
      intact, and renders **no fallback data**.
- [ ] An empty result says which question returned nothing.
- [ ] With JavaScript off, the `<noscript>` notice states what will not appear, and the
      written analysis still reads.

## 7. Localisation

- [ ] A missing string falls back to English, is marked `data-i18n-fallback`, and shows as
      **EN** in the interface.
- [ ] A superseded translation is not silently rendered as current.
- [ ] Switching locale does not lose reading position or focus.

## 8. What was not tested

State it explicitly. The project's declared position (README limitation 7) is that no screen
reader has been run, verification is programmatic, Chromium only, and no real-device testing
has been done. An audit report must not imply more coverage than it had.
