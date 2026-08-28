/* One-shot data patch: the results of the reference sweep of 28 August 2026.

   Everything here was found by searching for the publication the brief was
   pointing at, opening it, and checking that it says what the brief says it
   says. Nothing was attached because it looked related — the method note
   forbids that, and a loosely related substitute is worse than an admitted
   gap because it looks resolved.

   Where the publication could not be identified, the source keeps
   `resolution: publication-not-identified` and the claims resting on it are
   marked with a reference gap, which the interface renders as an asterisk.

   Run: node tools/_refsweep.mjs   (from the repository root) */

import { readFileSync, writeFileSync } from 'node:fs';

const read = (f) => JSON.parse(readFileSync(f, 'utf8'));
const write = (f, o) => writeFileSync(f, JSON.stringify(o, null, 2) + '\n');

const SWEEP = '2026-08-28';

/* ------------------------------------------------ 1. resolved URL-less sources */

const RESOLVED = {
  'src-papakonstantinou-dehert': {
    tier: 'tier:3',
    type: 'source-type:research',
    title: 'The Regulation of Digital Technologies in the EU: the law-making phenomena of “act-ification”, “GDPR mimesis” and “EU law brutality”',
    url: 'https://techreg.org/article/view/11459',
    url_status: 'url:live',
    published: '2022-05-21',
    note: 'Technology and Regulation, 2022, 48–60. Open access. Located 28 Aug 2026: the paper is the origin of both terms the brief uses, and it identifies the same three phenomena. The authors later expanded it into a Routledge monograph (2024); the brief\'s characterisation matches the paper.',
    resolution: null,
  },
  'src-cset-gpai-code': {
    tier: 'tier:3',
    type: 'source-type:research',
    title: 'AI Safety under the EU AI Code of Practice — A New Global Standard?',
    url: 'https://cset.georgetown.edu/article/eu-ai-code-safety/',
    url_status: 'url:live',
    published: '2025-07-01',
    note: 'Mia Hoffmann, Center for Security and Emerging Technology, Georgetown. Located 28 Aug 2026. States that the safety and security chapter sets a minimum standard going beyond current industry practice, provided the Code is widely adopted — which is the brief\'s claim, including the proviso.',
    resolution: null,
  },
  'src-noyb-omnibus': {
    tier: 'tier:4',
    type: 'source-type:report',
    title: 'Digital Omnibus Report V3: Analysis of Select GDPR and ePrivacy Proposals by the Commission',
    url: 'https://noyb.eu/en/digital-omnibus-report-v3-analysis-select-gdpr-and-eprivacy-proposals-commission',
    url_status: 'url:live',
    published: '2026-02-24',
    note: 'Located 28 Aug 2026. noyb states the GDPR and ePrivacy amendments would produce multiple conflicts with the Charter and a clear departure from the GDPR\'s logic and CJEU case law — the brief\'s wording tracks this closely. V3 also comments on the EDPB/EDPS joint opinion of 11 Feb 2026.',
    resolution: null,
  },
  'src-itif-dma-compliance': {
    tier: 'tier:4',
    type: 'source-type:legislative-document',
    title: 'Comments to the European Commission for Its First Review of the Digital Markets Act',
    url: 'https://itif.org/publications/2025/09/24/comments-to-the-european-commission-for-its-first-review-of-the-digital-markets-act/',
    url_status: 'url:live',
    published: '2025-09-24',
    note: 'Located 28 Aug 2026. Carries the "opaque and administratively complex" characterisation and the argument that a gatekeeper may struggle to know whether it is compliant, let alone deliberately violate. Note that ITIF is itself quoting studies for the first phrase.',
    resolution: null,
  },
  'src-icle-gdpr-law-of-everything': {
    tier: 'tier:4',
    type: 'source-type:legislative-document',
    title: 'ICLE Comments to the European Commission on GDPR and ePrivacy in the Digital Omnibus',
    url: 'https://laweconcenter.org/resources/icle-comments-to-the-european-commission-on-gdpr-and-eprivacy-in-the-digital-omnibus/',
    url_status: 'url:live',
    published: '2026-03-13',
    note: 'Located 28 Aug 2026. Contains the proportionality-asymmetry argument almost verbatim: the EDPB/EDPS analysis tests whether limitations on data protection are justified without asking whether the scope of data protection remains proportionate to the burdens it imposes. The phrase "law of everything" is not ICLE\'s coinage — see src-purtova-law-of-everything.',
    resolution: null,
  },
  'src-algorithmwatch-systemic-risk': {
    tier: 'tier:3',
    type: 'source-type:report',
    title: 'Researching Systemic Risks under the Digital Services Act (interim report)',
    url: 'https://algorithmwatch.org/en/researching-systemic-risks-under-the-digital-services-act/',
    url_status: 'url:live',
    published: '2024-07-26',
    note: 'Oliver Marsh, AlgorithmWatch. Located 28 Aug 2026. The report records that Recitals 79–89 were often not seen as providing clarity and were argued to confuse the Articles further — the brief\'s claim. Note the report\'s own headline finding is that practical problems outweigh conceptual ones, which is a slightly different emphasis from the brief\'s.',
    resolution: null,
  },
  'src-iccl-ireland-bottleneck': {
    tier: 'tier:4',
    type: 'source-type:report',
    title: 'Europe\'s enforcement paralysis: ICCL\'s 2021 GDPR report',
    url: 'https://www.iccl.ie/digital-data/2021-gdpr-report/',
    url_status: 'url:live',
    published: '2021-09-13',
    note: 'Johnny Ryan and Alan Toner, Irish Council for Civil Liberties. Located 28 Aug 2026. Source of both the "bottleneck" characterisation and the Spain-issues-ten-times-more-draft-decisions comparison. IMPORTANT: this is a 2021 report. The brief presents the critique in the present tense; the underlying data are five years old and the DPC has since restructured.',
    resolution: null,
  },
  'src-cms-enforcement-tracker': {
    tier: 'tier:4',
    type: 'source-type:report',
    title: 'GDPR Enforcement Tracker Report 2025/2026 (7th edition)',
    url: 'https://cms.law/en/int/publication/GDPR-Enforcement-Tracker-Report/executive-summary',
    url_status: 'url:live',
    published: '2026-03-01',
    note: 'Located 28 Aug 2026. Records 2,685 fines as at March 2026 and Spain as the most active authority by count (1,048 published fines). CORRECTION SURFACED: the EUR 7.1bn cumulative total and the EUR 4.04bn Irish figure are DLA Piper\'s, not CMS\'s — CMS records roughly EUR 6.11bn in directly documented fines. The divergence is exactly what Annex B warns about, and the brief was citing the wrong tracker for those two numbers.',
    resolution: null,
  },
};

/* ------------------------------------------------------- 2. sources added */

const ADDED = [
  {
    id: 'src-dlapiper-gdpr-survey-2026',
    tier: 'tier:4', type: 'source-type:report',
    publisher: null, publisher_name: 'DLA Piper',
    title: 'GDPR Fines and Data Breach Survey: January 2026 (eighth edition)',
    url: 'https://www.dlapiper.com/en/insights/publications/2026/01/dla-piper-gdpr-fines-and-data-breach-survey-january-2026',
    url_status: 'url:live', published: '2026-01-21', accessed: SWEEP, language: 'en',
    note: 'The actual source of three figures the brief attributed to the CMS tracker: EUR 7.1bn cumulative to 10 Jan 2026, EUR 4.04bn for the Irish DPC, and 443 breach notifications per day (up 22% from 363). A law firm\'s survey, not a regulator\'s return — indicative of magnitude, as Annex B says.',
  },
  {
    id: 'src-ec-dma-gatekeepers-portal',
    tier: 'tier:2', type: 'source-type:regulator-statement',
    publisher: 'ec', publisher_name: 'European Commission',
    title: 'DMA designated gatekeepers',
    url: 'https://digital-markets-act.ec.europa.eu/gatekeepers-portal_en',
    url_status: 'url:live', published: '2025-04-23', accessed: SWEEP, language: 'en',
    note: 'The Commission\'s own register. Six designated 6 Sep 2023; Apple iPadOS added 29 Apr 2024; Booking added 13 May 2024; Facebook Marketplace undesignated 23 Apr 2025. Confirms the seven undertakings the brief names, and gives 23 currently designated core platform services.',
  },
  {
    id: 'src-oj-aild-withdrawal-2025',
    tier: 'tier:1', type: 'source-type:legislative-document',
    publisher: 'eu', publisher_name: 'Official Journal of the European Union',
    title: 'Withdrawal of Commission proposals, C/2025/5423',
    url: 'https://www.europarl.europa.eu/legislative-train/theme-a-europe-fit-for-the-digital-age/file-ai-liability-directive',
    url_status: 'url:live', published: '2025-10-06', accessed: SWEEP, language: 'en',
    note: 'The AI Liability Directive was announced for withdrawal in the Commission Work Programme 2025 (COM(2025) 45, 11 Feb 2025, "no foreseeable agreement") and formally withdrawn in the Official Journal on 6 October 2025. Cited here through the Parliament\'s legislative train file, which carries the OJ reference; the OJ notice itself has not been opened directly.',
  },
  {
    id: 'src-draghi-report-2024',
    tier: 'tier:2', type: 'source-type:report',
    publisher: 'ec', publisher_name: 'European Commission',
    title: 'The future of European competitiveness — report by Mario Draghi',
    url: 'https://ec.europa.eu/newsroom/growth/items/847989',
    url_status: 'url:live', published: '2024-09-09', accessed: SWEEP, language: 'en',
    note: 'Part A (Competitiveness Strategy) and Part B (In-Depth Analysis and Recommendations). Confirmed as the document and the date. The individual percentages the brief quotes have NOT been checked against their pages in Part B.',
  },
  {
    id: 'src-purtova-law-of-everything',
    tier: 'tier:3', type: 'source-type:research',
    publisher: null, publisher_name: 'Nadezhda Purtova',
    title: 'The law of everything. Broad concept of personal data and future of EU data protection law',
    url: 'https://www.tandfonline.com/doi/full/10.1080/17579961.2018.1452176',
    url_status: 'url:live', published: '2018-04-02', accessed: SWEEP, language: 'en',
    note: 'Law, Innovation and Technology. The origin of the phrase the brief attributes to ICLE. Purtova\'s conclusion is not ICLE\'s: she argues for abandoning the personal/non-personal distinction, not for narrowing the scope of the GDPR. Attached as context so the borrowing is visible.',
  },
  {
    id: 'src-techpolicy-national-security-2026',
    tier: 'tier:4', type: 'source-type:commentary',
    publisher: null, publisher_name: 'Tech Policy Press',
    title: 'When National Security Becomes a Shield for Evading AI Accountability',
    url: 'https://www.techpolicy.press/when-national-security-becomes-a-shield-for-evading-ai-accountability/',
    url_status: 'url:live', published: '2026-02-16', accessed: SWEEP, language: 'en',
    note: 'Carries both halves of the brief\'s Part XI argument: that "national security" is loosely enough defined to be used as a bypass, and that Hungary had not invoked the exemption for its facial-recognition deployment. Attached in place of the CDT publication the brief refers to, which could not be identified.',
  },
];

/* ------------------------------------------ 3. claim → source attachments */

const ATTACH = {
  'clm-gdpr-total-fines': {
    add: [{ source_id: 'src-dlapiper-gdpr-survey-2026', supports: 'supports:direct', locator: 'Aggregate total to 10 January 2026' }],
    last_verified: SWEEP,
    verification_note: 'Resolved 28 Aug 2026 against the DLA Piper survey of January 2026, which is the actual source of the EUR 7.1bn figure — the brief attributed it to the CMS tracker, which records roughly EUR 6.11bn on its own methodology. Both are compilations by law firms from published decisions, not audited totals; Annex B\'s warning stands and is now demonstrated rather than asserted.',
  },
  'clm-dpc-share-of-fines': {
    add: [{ source_id: 'src-dlapiper-gdpr-survey-2026', supports: 'supports:partial', locator: 'EUR 4.04bn, Irish Data Protection Commission' }],
    last_verified: SWEEP,
    verification_note: 'The EUR 4.04bn figure is confirmed against DLA Piper (January 2026). The derived 57% share and the "nine of the ten largest fines" ranking are NOT stated by that source and remain the brief\'s own arithmetic against a total from the same compilation.',
    gap: '57% share and nine-of-ten ranking',
  },
  'clm-breach-notifications-per-day': {
    add: [{ source_id: 'src-dlapiper-gdpr-survey-2026', supports: 'supports:direct', locator: '443 per day, up 22% from 363 (28 Jan 2025 – 27 Jan 2026)' }],
    last_verified: SWEEP,
    verification_note: 'Resolved 28 Aug 2026. Both numbers and the window are stated by the source.',
  },
  'clm-spain-most-decisions': {
    add: [{ source_id: 'src-cms-enforcement-tracker', supports: 'supports:direct', locator: 'Numbers and figures: 1,048 published fines, most active authority' }],
    last_verified: SWEEP,
    verification_note: 'Resolved 28 Aug 2026. CMS records 1,048 published fines for the Spanish AEPD as at March 2026, the highest count of any authority. Note the brief says "decisions" where the tracker counts published fines — a narrower quantity.',
  },
  'clm-seven-gatekeepers': {
    add: [{ source_id: 'src-ec-dma-gatekeepers-portal', supports: 'supports:direct', locator: 'Gatekeepers portal' }],
    last_verified: SWEEP,
    verification_note: 'Resolved 28 Aug 2026 against the Commission\'s own register. Seven undertakings, 23 designated core platform services.',
  },
  'clm-aild-abandoned': {
    add: [{ source_id: 'src-oj-aild-withdrawal-2025', supports: 'supports:direct', locator: 'C/2025/5423, 6 October 2025' }],
    last_verified: SWEEP,
    verification_note: 'Resolved 28 Aug 2026, and made more precise: announced for withdrawal in the Commission Work Programme 2025 on 11 February 2025 ("no foreseeable agreement"), formally withdrawn in the Official Journal on 6 October 2025. The brief\'s "abandoned" is correct but undated.',
  },
  'clm-draghi-statistics': {
    add: [{ source_id: 'src-draghi-report-2024', supports: 'supports:partial', locator: 'Part B, In-Depth Analysis and Recommendations' }],
    last_verified: SWEEP,
    verification_note: 'The report is confirmed as the source and its date is confirmed. The individual percentages — 70% of foundation models, 65% cloud share, under 15% European share, 22% robotics, 17% AI services — have NOT been checked against their pages in Part B.',
    gap: 'the individual percentages',
  },
  'clm-hungary-no-infringement': {
    add: [{ source_id: 'src-techpolicy-national-security-2026', supports: 'supports:partial', locator: 'Hungary has not invoked the national security exemption' }],
    last_verified: SWEEP,
    verification_note: 'Re-checked 28 Aug 2026. Contemporary commentary confirms that civil-society organisations were urging the Commission to open proceedings and that Hungary had not invoked the national-security exemption. The negative half of the claim — that no proceedings have been opened — cannot be proved by any source and is true only at an instant. Re-verify before every publication.',
  },
};

/* ---------------------------------- 4. gaps that research did not close */

const GAPS = {
  'clm-dpc-staff-growth': 'No DPC annual report was located giving both the 2018 figure and the 2026 figure. The three-Commissioner structure is on the public record; the staffing numbers are not sourced here.',
  'clm-eprivacy-miscounted-fines': 'The two French decisions of September 2025 are widely reported, but no source was located that states they are frequently miscounted as GDPR fines — that observation is the brief\'s own.',
  'clm-dma-asymmetry': 'The headquarters composition is checkable from the gatekeeper register. The USTR objection is not sourced here; no filing or statement was located.',
  'clm-data-act-enforcement-uneven': 'No source located for the position of the Irish Data Bill in February 2026.',
  'clm-nis2-enforcement-despite-transposition': 'No source located naming any first NIS2 fine in Belgium, Italy or Hungary. The enforcement record already carries this as an explicit placeholder.',
  'clm-four-categories-94pct': 'The CMS tracker analyses violation categories, but no edition was located stating that four categories account for roughly 94% of fine value.',
  'clm-charter-binds-member-states': 'Article 51(1) of the Charter is the legal basis and is in the dataset; the data-retention case line (Digital Rights Ireland, Tele2, La Quadrature du Net) is not individually sourced here.',
};

/* -------------------------------------------------------------- apply */

const sources = read('data/sources.json');
const byId = new Map(sources.sources.map((s) => [s.id, s]));

let resolved = 0;
for (const [id, patch] of Object.entries(RESOLVED)) {
  const s = byId.get(id);
  if (!s) { console.log('  MISSING source', id); continue; }
  Object.assign(s, patch, { accessed: SWEEP });
  if (patch.resolution === null) delete s.resolution;
  resolved++;
}
for (const s of ADDED) { if (!byId.has(s.id)) { sources.sources.push(s); byId.set(s.id, s); } }
sources.$last_verified = SWEEP;
write('data/sources.json', sources);

const claims = read('data/claims.json');
const cById = new Map(claims.claims.map((c) => [c.id, c]));

let attached = 0;
for (const [id, patch] of Object.entries(ATTACH)) {
  const c = cById.get(id);
  if (!c) { console.log('  MISSING claim', id); continue; }
  for (const a of patch.add) {
    if (!c.sources.some((x) => x.source_id === a.source_id)) c.sources.unshift(a);
  }
  c.last_verified = patch.last_verified;
  c.verification_note = patch.verification_note;
  if (patch.gap) { c.reference_gap = true; c.gap_note = patch.gap; }
  else { delete c.reference_gap; delete c.gap_note; }
  attached++;
}
for (const [id, note] of Object.entries(GAPS)) {
  const c = cById.get(id);
  if (!c) { console.log('  MISSING claim', id); continue; }
  c.reference_gap = true;
  c.gap_note = note;
  c.last_verified = SWEEP;
}
claims.$last_verified = SWEEP;
write('data/claims.json', claims);

console.log(`sources resolved ${resolved}, added ${ADDED.length}`);
console.log(`claims re-sourced ${attached}, gaps marked ${Object.keys(GAPS).length + Object.values(ATTACH).filter((p) => p.gap).length}`);
