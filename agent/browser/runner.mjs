/* ============================================================
   agent/browser/runner.mjs — one run of the browser suite

   Serve → launch → ask the fifteen questions → close → report,
   with three properties that are the whole reason this file is
   separate from `checks.mjs`:

   A RUN THAT COULD NOT OPEN A BROWSER IS `skipped`, NEVER `pass`.
   `find.mjs` says why; this carries the reason into the result, and
   `agent/implement/` refuses to land a change whose proposal
   required browser QA on a `skipped` result. Requirement 7 of
   SESSION 18 is "browser QA cannot be silently skipped when
   required", and this pair of files is where that is implemented
   rather than asserted.

   THE RESULT IS SHAPED LIKE A QAResult CHECK. `agent/schemas/
   contracts/qa-result.mjs` wants a name, a command, an exit code,
   errors, warnings, the baseline it is measured against, and the new
   findings by name. `asQACheck()` produces exactly that, so the
   implementation agent does not have to re-derive it and cannot
   quietly summarise it differently.

   THE REPOSITORY IS HASHED AROUND THE RUN. Every agent here does it;
   this one has more reason than most, because it is the first thing
   in this repository that starts a subprocess with the site in front
   of it. "It changed nothing" is checked, not claimed.
   ============================================================ */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findBrowser, browserVersion } from './find.mjs';
import { serveSite, REPO_ROOT } from './serve.mjs';
import { launch } from './cdp.mjs';
import {
  PAGES, checkPageLoads, checkNavigation, checkInternalLinks, checkSearch, checkGlossary,
  checkComparison, checkEvidence, checkApplicability, checkInstrumentView,
  checkLanguageSwitching, checkViewports, checkKeyboard, checkDialogs,
  checkNoThirdParty, checkAccessibility,
} from './checks.mjs';

export const BROWSER_QA_COMMAND = 'node agent/browser/cli.mjs';
export const BROWSER_QA_NAME = 'agent/browser (browser regression suite)';

/** The suite's own recorded baseline. Kept here rather than in
 *  docs/CURRENT-ARCHITECTURE.md §12 because §12 records the four
 *  validators and this is not one of them — but read the same way: a
 *  new failure is a finding, and an undecidable that was decidable
 *  last week is also a finding. */
export const BASELINE = { errors: 0, warnings: 0 };


/** The three statuses a run can end in. `skipped` is not a pass and
 *  never becomes one. */
export const RUN_STATUSES = ['ok', 'failed', 'skipped'];

function hashTree(root = REPO_ROOT) {
  const out = {};
  const walk = (dir, rel = '') => {
    for (const name of readdirSync(dir).sort()) {
      if (name === '.git' || name === 'node_modules') continue;
      const abs = join(dir, name);
      const r = rel ? `${rel}/${name}` : name;
      let st;
      try { st = statSync(abs); } catch { continue; }
      if (st.isDirectory()) {
        /* Run artifacts change every run by design and are
           git-ignored; hashing them would report every run as having
           modified the repository. */
        if (['runs', 'records', 'drafts'].includes(name)) continue;
        walk(abs, r);
      } else {
        out[r] = createHash('sha256').update(readFileSync(abs)).digest('hex');
      }
    }
  };
  walk(root);
  return out;
}

/**
 * @param {{only?:string[], pages?:Array, quick?:boolean, root?:string}} opts
 * @returns {Promise<BrowserQARun>}
 */
export async function runBrowserQA({ only = null, pages = PAGES, quick = false, root = REPO_ROOT } = {}) {
  const startedAt = new Date().toISOString();
  const found = findBrowser();
  const before = hashTree(root);

  if (!found.found) {
    return finish({
      status: 'skipped',
      startedAt,
      browser: null,
      results: [],
      skipReason: found.reason,
      lookedIn: found.looked,
      treeUnchanged: true,
      requests: 0,
    });
  }

  const site = await serveSite({ root });
  let browser = null;
  const results = [];
  let failure = null;
  let requestCount = 0;

  const wants = (id) => !only || only.includes(id);

  try {
    browser = await launch({ executable: found.path });
    const page = await browser.newPage();

    if (wants('pages')) for (const spec of (quick ? pages.slice(0, 3) : pages)) results.push(...await checkPageLoads(page, site.origin, spec));
    if (wants('navigation')) results.push(...await checkNavigation(page, site.origin));
    if (wants('links')) results.push(...await checkInternalLinks(page, site.origin, { pages: quick ? pages.slice(0, 3) : pages }));
    if (wants('search')) results.push(...await checkSearch(page, site.origin));
    if (wants('glossary')) results.push(...await checkGlossary(page, site.origin));
    if (wants('comparison')) results.push(...await checkComparison(page, site.origin));
    if (wants('evidence')) results.push(...await checkEvidence(page, site.origin));
    if (wants('applicability')) results.push(...await checkApplicability(page, site.origin));
    if (wants('instrument')) results.push(...await checkInstrumentView(page, site.origin));
    /* In its own browser context, and this is not tidiness. The
       language choice is written to localStorage under
       `eupolicy:lang` and survives a reload, so running it on the
       shared page left every LATER check reading an Italian DOM —
       observed during this session as a heading-order finding
       reported against a page whose lang attribute said "it".
       `newPage()` opens an isolated context; the leak cannot cross
       it. See docs/BROWSER-QA.md §7. */
    if (wants('language')) {
      const langPage = await browser.newPage();
      try { results.push(...await checkLanguageSwitching(langPage, site.origin)); }
      finally { await langPage.close(); }
    }
    if (wants('keyboard')) results.push(...await checkKeyboard(page, site.origin));
    if (wants('dialogs')) results.push(...await checkDialogs(page, site.origin));
    if (wants('responsive')) results.push(...await checkViewports(page, site.origin, { pages: quick ? pages.slice(0, 2) : pages.slice(0, 5) }));
    if (wants('accessibility')) results.push(...await checkAccessibility(page, site.origin, { pages: quick ? pages.slice(0, 3) : pages }));
    /* Last, because it is a claim about every request the whole run
       made and it can only be made once they have all been made. */
    if (wants('network')) results.push(...checkNoThirdParty(page, site.origin));

    requestCount = page.requests.length;
  } catch (err) {
    failure = err;
  } finally {
    if (browser) { try { await browser.close(); } catch { /* a browser that will not close is not a site defect */ } }
    await site.close();
  }

  const after = hashTree(root);
  const treeUnchanged = JSON.stringify(before) === JSON.stringify(after);

  return finish({
    status: failure ? 'failed' : 'ok',
    startedAt,
    browser: { path: found.path, via: found.via, version: browserVersion(found.path) },
    results,
    failure,
    treeUnchanged,
    changedPaths: treeUnchanged ? [] : Object.keys(after).filter((k) => before[k] !== after[k]).concat(Object.keys(before).filter((k) => !(k in after))),
    requests: requestCount,
    origin: site.origin,
  });
}

function finish(r) {
  const results = r.results ?? [];
  const failed = results.filter((x) => x.status === 'fail');
  const passed = results.filter((x) => x.status === 'pass');
  const undecided = results.filter((x) => x.status === 'undecidable');

  return {
    ...r,
    finishedAt: new Date().toISOString(),
    counts: {
      total: results.length,
      pass: passed.length,
      fail: failed.length,
      undecidable: undecided.length,
    },
    failed,
    undecided,
    areas: results.reduce((o, x) => { o[x.area] = (o[x.area] ?? 0) + 1; return o; }, {}),
    /* Never derived from the pass count alone. A run with no results
       is not a run that found nothing wrong. */
    verdict: verdictOf(r.status, results),
  };
}

export function verdictOf(status, results) {
  if (status === 'skipped') return 'skipped';
  if (status === 'failed') return 'fail';
  if (!results.length) return 'skipped';
  if (results.some((x) => x.status === 'fail')) return 'fail';
  if (results.some((x) => x.status === 'undecidable')) return 'pass_with_findings';
  return 'pass';
}

/**
 * The run, in the shape `agent/schemas/contracts/qa-result.mjs`
 * wants for one check. An undecidable is a WARNING, not an error:
 * it did not establish a defect, and it did not establish an
 * absence of one either.
 */
export function asQACheck(run) {
  const exit = run.verdict === 'pass' || run.verdict === 'pass_with_findings' ? 0 : 1;
  return {
    name: BROWSER_QA_NAME,
    command: BROWSER_QA_COMMAND,
    exit_code: run.status === 'skipped' ? 1 : exit,
    errors: run.counts?.fail ?? 0,
    warnings: run.counts?.undecidable ?? 0,
    baseline_errors: BASELINE.errors,
    baseline_warnings: BASELINE.warnings,
    new_findings: [
      ...(run.failed ?? []).map((f) => `${f.id} — ${f.summary}`),
      ...(run.undecided ?? []).map((f) => `${f.id} — UNDECIDABLE: ${f.summary} (${f.why})`),
      ...(run.status === 'skipped' ? [`the suite did not run: ${run.skipReason}`] : []),
    ],
    output_excerpt: run.status === 'skipped'
      ? `SKIPPED — ${run.skipReason}\nLooked in:\n  ${(run.lookedIn ?? []).join('\n  ')}`
      : [
        `${run.counts.pass} pass · ${run.counts.fail} fail · ${run.counts.undecidable} undecidable`,
        run.browser ? `${run.browser.version} at ${run.browser.path}` : '',
        ...(run.failed ?? []).slice(0, 10).map((f) => `FAIL ${f.id}: ${f.summary}`),
      ].filter(Boolean).join('\n'),
  };
}

