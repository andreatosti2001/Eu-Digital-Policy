/* The substantiated half of the external review of 28 August 2026.

   Each edit below was checked before being made. Points the review raised
   that were already satisfied, or that attacked wording the brief does not
   use, are not here — they are listed in the phase record instead.

   IMPORTANT: every string edited here carries a `data-i18n` key, and the
   Italian, French and Spanish overlays hold a translation of the *previous*
   English. Leaving them would make those editions assert the thing that was
   just corrected — which is exactly the failure phase 5 caught with the
   Annex A captions. Each edited key is therefore declared `superseded` in
   i18n/locales.json and falls back to English until a translator reaches it.

   Run: node tools/_review10.mjs  (from the repository root) */

import { readFileSync, writeFileSync } from 'node:fs';

const EDITS = [
  /* ---- P1.4: the deferral did not move every high-risk obligation equally.
     Verified against Regulation (EU) 2026/1744: Annex III stand-alone systems
     moved 2 Aug 2026 → 2 Dec 2027 (sixteen months); Annex I product-embedded
     systems moved 2 Aug 2027 → 2 Aug 2028 (twelve). timeline.json already
     held both dates correctly; only the prose collapsed them into one. */
  {
    key: 'part-5.p9',
    from: 'The delay is real but partial: prohibitions, <button class="gloss" data-term="gpai">GPAI</button> duties and transparency all remain on or near the original track; the high-risk tier moved by roughly sixteen months.',
    to: 'The delay is real, partial, and unequal across the tier. Prohibitions, <button class="gloss" data-term="gpai">GPAI</button> duties and transparency all remain on or near the original track. Within the high-risk tier the two routes moved by different amounts: Annex III stand-alone systems went from 2 August 2026 to 2 December 2027, sixteen months; Annex I product-embedded systems went from 2 August 2027 to 2 August 2028, twelve. The Omnibus also added two new Article 5 prohibitions applying from 2 December 2026 and rewrote the Article 4 AI-literacy duty from an obligation to ensure a sufficient level into one to take measures supporting it — so the same instrument delayed, expanded and softened at once.',
  },
  {
    key: 'part-5.li4',
    from: 'roughly sixteen months',
    to: 'sixteen months for Annex III stand-alone systems and twelve for Annex I embedded ones',
  },

  /* ---- P2.4: the Commission's own timeline shows a first draft, a second
     (19 Dec 2024), a third (11 Mar 2025) and the final text (10 Jul 2025).
     "Four drafts" only holds if the final text counts as a draft. This was
     already flagged in the phase 1 data work and never carried into prose. */
  {
    key: 'part-5.p8',
    from: 'finalised on 10 July 2025 after four drafts',
    to: 'finalised on 10 July 2025 after three drafts and a final text',
  },
  {
    key: 'part-1.p10',
    from: 'finalised on 10 July 2025 after four drafts',
    to: 'finalised on 10 July 2025 after three drafts and a final text',
  },

  /* ---- P2.1: the six subjects are not six regulations. The cyber layer
     alone contains two directives and two regulations, so "one directive
     family" both undercounts the directives and miscounts the rest. */
  {
    key: 'portal.p1',
    from: 'Six regulations, one directive family and a live reform package now govern',
    to: 'Six regulatory regimes — regulations, a family of directives and a live reform package — now govern',
  },

  /* ---- P1.1: Article 22 does not apply *because* a system is minimal risk.
     The two regimes classify independently; the point the brief is making is
     that AI Act classification does not switch Article 22 off. */
  {
    key: 'part-2.p4',
    from: 'Article 22 is the pre-existing European law of automated decision-making — it did not wait for the AI Act, and it applies to systems the AI Act classifies as minimal risk.',
    to: 'Article 22 is the pre-existing European law of automated decision-making — it did not wait for the AI Act, and the two classify independently. A system the AI Act places in the minimal-risk band, owing it no obligations under that Act, is still caught by Article 22 if it makes solely automated decisions with legal or similarly significant effects. Neither regime switches the other off.',
  },

  /* ---- P1.2: "not payable until confirmed by a court" is too categorical to
     state as a general rule; what the DPC published is its own position about
     its own inquiries, and that is what the brief can support. */
  {
    key: 'part-2.div1',
    from: 'because fines generally do not become payable until confirmed by a court.',
    to: 'on the DPC\'s own account, because a fine it imposes is not treated as collectible while an appeal is live. How and when an imposed fine becomes payable varies by Member State and by procedural posture; the general point the brief needs is narrower and safer — imposed and collected are different quantities, and the gap between them is large.',
  },

  /* ---- P3.4: a negative claim about the world is unprovable; a negative
     claim about a search is checkable and dated. */
  {
    key: 'part-11.div1',
    from: 'The Commission has not opened infringement proceedings on this basis.',
    to: 'No Commission infringement proceeding on this basis was identified as of 28 August 2026.',
  },

  /* ---- P2.3: voluntary is correct and is not the same as legally
     irrelevant, and the brief's own argument depends on the difference. */
  {
    key: 'part-5.p8',
    from: 'That proviso is doing real work: the Code is voluntary.',
    to: 'That proviso is doing real work: the Code is voluntary. Voluntary is not the same as legally irrelevant — adherence is the route the Commission and the AI Board have confirmed as an adequate means of demonstrating compliance with the Chapter V obligations, so a provider that declines it does not escape the obligations, only this way of discharging them.',
  },
];

/* ------------------------------------------------------------------ apply */

let html = readFileSync('index.html', 'utf8');
const touched = new Set();
let applied = 0;

for (const e of EDITS) {
  const n = html.split(e.from).length - 1;
  if (n === 0) { console.log('  NOT FOUND:', e.from.slice(0, 60)); continue; }
  /* the string also appears inside the inlined __CONTENT__ search index, and
     the search text must not diverge from what the reader sees */
  html = html.split(e.from).join(e.to);
  touched.add(e.key);
  applied++;
  console.log(`  ${e.key.padEnd(16)} ${n} occurrence(s)`);
}
writeFileSync('index.html', html);

/* --------------------------------------------- declare the stale overlays */

const reg = JSON.parse(readFileSync('i18n/locales.json', 'utf8'));
for (const loc of reg.locales) {
  if (!loc.file) continue;
  loc.superseded = loc.superseded || [];
  for (const k of touched) if (!loc.superseded.includes(k)) loc.superseded.push(k);
  loc.superseded.sort();
}
reg.$last_verified = '2026-08-28';
writeFileSync('i18n/locales.json', JSON.stringify(reg, null, 2) + '\n');

console.log(`\n${applied} edit(s) applied across ${touched.size} key(s);`);
console.log(`${touched.size} key(s) declared superseded in it, fr and es.`);
