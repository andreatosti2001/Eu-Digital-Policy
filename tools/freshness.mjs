/* ============================================================
   Freshness audit. Zero dependencies; run from site/:

       node tools/freshness.mjs            # against today
       node tools/freshness.mjs 2026-08-27 # against a fixed date

   The site is a current-state reference, and the failure mode of a
   current-state reference is not being wrong — it is being stale while
   still looking authoritative. Nothing on the page goes red when a
   dataset ages, so this is the check that has to be run deliberately.

   It reports, rather than judging:

     1. How old every verification date is, and whether the dataset has
        real per-record dates or one compilation date wearing that name.
     2. Time-sensitive collections whose newest record is older than the
        interval at which that kind of fact actually changes.
     3. Events that have passed since the last verification — a
        transposition deadline or an application date that went by while
        the dataset was not looking.
     4. Records whose own text says they are provisional (preliminary
        findings, pending appeals, unknown payment) and which are
        therefore expected to change.

   Exit code is 0 unless something is past its stated interval; this is
   a prompt to go and look, not a build break.
   ============================================================ */

import { readFileSync, readdirSync } from 'node:fs';

const AS_OF = process.argv[2] || new Date().toISOString().slice(0, 10);
const DAY = 86400000;
const days = (a, b) => Math.round((Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')) / DAY);

const read = (f) => JSON.parse(readFileSync('data/' + f, 'utf8'));
const arr = (x) => (Array.isArray(x) ? x : []);

/* How often each kind of fact actually moves in the world. These are the
   intervals the dataset is promising to keep up with; exceeding one is not
   an error, it is a statement that the promise is now overdue. */
const EXPECTED = {
  enforcement: { days: 45, why: 'regulators announce actions continuously; a quarter-old enforcement set is visibly behind' },
  timeline: { days: 90, why: 'application and transposition dates move less often, but they move' },
  instruments: { days: 90, why: 'legislative status changes on adoption, entry into force and application' },
  institutions: { days: 180, why: 'competences change slowly, usually only with a new instrument' },
  claims: { days: 90, why: 'the quantitative claims are the ones that rot fastest' },
  sources: { days: 180, why: 'URLs rot; the accessed date is the only evidence they were ever reachable' },
};

let overdue = 0;
const line = (s) => console.log(s);
const flag = (s) => { overdue++; console.log('  ! ' + s); };

line('\nFRESHNESS AUDIT  as of ' + AS_OF);
line('='.repeat(64));

/* ---------------------------------------------------------- 1. dates */

line('\nVERIFICATION DATES');
const files = readdirSync('data').filter((f) => f.endsWith('.json'));
const allDates = [];
for (const f of files) {
  const d = read(f);
  const name = f.replace('.json', '');
  const per = [];
  (function walk(o) {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === 'object') {
      for (const [k, v] of Object.entries(o)) {
        if (k === 'last_verified' && typeof v === 'string') per.push(v);
        else walk(v);
      }
    }
  })(d);
  const file = d.$last_verified || null;
  const uniq = [...new Set(per)].sort();
  allDates.push(...per, ...(file ? [file] : []));
  const age = file ? days(file, AS_OF) : null;
  const spread = uniq.length === 0 ? 'no per-record dates'
    : uniq.length === 1 ? `all ${per.length} records share ${uniq[0]}`
      : `${per.length} records across ${uniq.length} distinct dates (${uniq[0]} … ${uniq[uniq.length - 1]})`;
  line(`  ${name.padEnd(15)} file ${String(file).padEnd(12)} ${age == null ? '' : age + 'd old'}`);
  line(`  ${''.padEnd(15)} ${spread}`);
  const exp = EXPECTED[name];
  if (exp && age != null && age > exp.days) flag(`${name} is ${age} days old, past its ${exp.days}-day interval — ${exp.why}`);
}

const uniqAll = [...new Set(allDates)];
if (uniqAll.length === 1) {
  line('');
  flag(`every verification date in the repository is ${uniqAll[0]}. The field is per-record but has never been used per-record: read it as a compilation date, and do not present it as evidence of independent re-checking.`);
}

/* ---------------------------------------------------------- 2. passed events */

line('\nEVENTS THAT HAVE PASSED');
const tl = read('timeline.json');
const tlVer = tl.$last_verified;
const passedSince = arr(tl.events)
  .filter((e) => e.date > (tlVer || '0000-00-00') && e.date <= AS_OF);
if (!passedSince.length) line(`  none between ${tlVer} and ${AS_OF}`);
else passedSince.forEach((e) => flag(`${e.date} ${e.instrument} — ${e.event_type} fell due after the last verification: ${String(e.obligation || '').slice(0, 80)}`));

const nextUp = arr(tl.events).filter((e) => e.date > AS_OF)
  .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
line('  next due:');
nextUp.forEach((e) => line(`    ${e.date} (${days(AS_OF, e.date)}d) ${e.instrument} — ${String(e.obligation || '').slice(0, 62)}`));

/* ---------------------------------------------------------- 3. provisional */

line('\nRECORDS EXPECTED TO CHANGE');
const enf = arr(read('enforcement.json').enforcement);
const prov = {
  'preliminary / announced only': enf.filter((r) => r.action_status === 'action:announced'),
  'appeal pending or unknown': enf.filter((r) => ['appeal:pending', 'appeal:unknown'].includes(r.appeal?.status)),
  'payment unknown': enf.filter((r) => !r.payment_status || r.payment_status === 'payment:unknown'),
  'flagged requires_verification': enf.filter((r) => r.requires_verification),
};
for (const [k, v] of Object.entries(prov)) {
  line(`  ${String(v.length).padStart(3)} of ${enf.length}  ${k}`);
  if (v.length && v.length <= 4) v.forEach((r) => line(`         ${r.id}`));
}

/* the newest thing in the enforcement set, which is the number a reader
   would actually use to judge whether the observatory is current */
const newest = enf.map((r) => r.decision_date).filter(Boolean).sort().pop();
line(`\n  newest enforcement decision recorded: ${newest} (${days(newest, AS_OF)} days before ${AS_OF})`);
if (days(newest, AS_OF) > EXPECTED.enforcement.days)
  flag(`the most recent enforcement action recorded is ${days(newest, AS_OF)} days old — check for decisions taken since`);

/* ---------------------------------------------------------- 4. url rot */

line('\nSOURCE REACHABILITY');
const srcs = arr(read('sources.json').sources);
const byStatus = {};
for (const s of srcs) byStatus[s.url_status] = (byStatus[s.url_status] || 0) + 1;
line('  ' + Object.entries(byStatus).map(([k, v]) => `${v} ${k}`).join(' · '));
const noUrl = srcs.filter((s) => !s.url);
if (noUrl.length) {
  /* Two different failures live in this list and they need different work.
     A missing URL can be found by looking. A source that was never pinned to
     a named publication cannot: the reference has to be identified first, and
     attaching a plausible-looking document to it would be exactly the
     "loosely related substitute" the method note refuses. */
  const groups = {
    'url-not-located': 'publication identified, no stable URL found — findable by searching',
    'publication-not-identified': 'no specific publication named — cannot be fixed by finding a link',
    'self-reference': 'not a source at all',
  };
  line(`  ${noUrl.length} sources carry no URL. Claims resting only on one of these are not reproducible by a reader.`);
  for (const [key, why] of Object.entries(groups)) {
    const g = noUrl.filter((s) => s.resolution === key);
    if (!g.length) continue;
    line(`\n    ${g.length} · ${key} — ${why}`);
    g.forEach((s) => line(`        ${s.id.padEnd(38)} ${String(s.publisher_name || '').slice(0, 38)}`));
  }
  const un = noUrl.filter((s) => !s.resolution);
  if (un.length) {
    flag(`${un.length} URL-less source(s) carry no \`resolution\` field, so it is not recorded why they cannot be linked: ${un.map((s) => s.id).join(', ')}`);
  }
}

line('\n' + '='.repeat(64));
line(overdue ? `${overdue} item(s) need attention.` : 'Nothing past its stated interval.');
process.exit(overdue ? 1 : 0);
