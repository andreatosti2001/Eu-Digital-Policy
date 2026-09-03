/* ============================================================
   agent/health/public.mjs — PUBLIC WEBSITE HEALTH

   The ten SESSION 20 names. What a failure here costs is a reader
   who cannot use the site, or who is shown something broken; it is
   recoverable by a fix, which is exactly why it must not be added to
   the knowledge domain, where a failure is a reader told something
   false about EU law.

   THE DIVISION OF LABOUR, and it is the reason the sources differ
   metric by metric. Six of these ten can only be answered by opening
   a page: `tools/design-qa.mjs` can see that `instruments.html`
   contains `<div id="dnaTable">` and cannot see whether anything ever
   put a table in it. Those six are sourced from `agent/browser/`, and
   when the browser suite did not run they return `unmeasurable` with
   the reason — never zero.

   EVERY METRIC HERE IS PUBLIC. Nothing in this domain is operational
   data about the agent system; it is the state of a site anyone can
   load, and a reader is entitled to know it is broken.
   ============================================================ */

import { defineMetric, measured, unmeasurable, notApplicable } from './model.mjs';
import { browserArea, BROWSER_ABSENT } from './gather.mjs';

/** The validator check a metric reads, by name, with its baseline. */
function validatorCheck(ctx, name) {
  return (ctx.validators?.checks ?? []).find((c) => c.name === `tools/${name}`) ?? null;
}

/** Shared shape for the six browser-sourced metrics. `area` is the
 *  `agent/browser/checks.mjs` area; `undecidableIsNotAFailure` is the
 *  rule that an undecidable check established neither a defect nor
 *  its absence, so it is reported beside the count and never inside
 *  it. */
function fromBrowser(ctx, area) {
  const a = browserArea(ctx, area);
  if (!a) return unmeasurable(BROWSER_ABSENT.why, BROWSER_ABSENT.needs);
  return measured(a.failed.length, {
    of: a.total,
    unit: 'failing checks',
    detail: {
      failed: a.failed.map((f) => ({ id: f.id, summary: f.summary })),
      undecidable: a.undecidable.map((f) => ({ id: f.id, summary: f.summary, why: f.why })),
      undecidable_note: a.undecidable.length
        ? `${a.undecidable.length} check(s) in this area established neither a defect nor its absence. They are NOT counted as passes and NOT counted as failures.`
        : null,
    },
    evidence: a.failed.map((f) => `agent/browser: ${f.id} — ${f.summary}`),
  });
}

export const PUBLIC_METRICS = [

  defineMetric({
    id: 'public_website.validation_failures',
    name: 'Validation failures',
    domain: 'public_website',
    definition: 'Errors reported by tools/validate.mjs, which checks referential integrity, ID discipline and shape across every data/*.json the site loads.',
    source: 'node tools/validate.mjs, parsed by agent/implement/checks.mjs',
    calculation: 'The ERRORS count from the run, compared against the baseline recorded in docs/CURRENT-ARCHITECTURE.md §12 (0 errors) and parsed from it by agent/implement/baseline.mjs.',
    frequency: 'per_commit',
    interpretation: 'Any value above 0 means a dataset references something that does not exist, or breaks a shape the renderers assume. The site will render something wrong or nothing at all. This is the one metric in this domain where 0 is a genuine, checkable pass.',
    limitations: 'validate.mjs parses every data/*.json but only checks shapes it knows BY NAME — an unrecognised file passes silently. It carries one check that can never fire and treats every wildcard reference as resolving (docs/AUDIT-2026-09-01.md F-11). A clean run is weaker evidence than it looks.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) {
      const c = validatorCheck(ctx, 'validate.mjs');
      if (!c) return unmeasurable('the validators were not run in this gathering', 'run the monitor without --no-validators');
      if (c.exit_code === 127) return unmeasurable('tools/validate.mjs could not be executed', c.output_excerpt);
      return measured(c.errors, { unit: 'errors', detail: { warnings: c.warnings, baseline: `${c.baseline_errors}/${c.baseline_warnings}`, new_findings: c.new_findings }, evidence: [c.command] });
    },
  }),

  defineMetric({
    id: 'public_website.broken_internal_links',
    name: 'Broken internal links',
    domain: 'public_website',
    definition: 'Internal link targets that do not resolve, counted by following every distinct non-external href on every page with a real HTTP request.',
    source: 'agent/browser/checks.mjs checkInternalLinks, over the seven pages',
    calculation: 'Every a[href] that is not http(s):, mailto:, tel:, javascript: or a bare fragment is de-duplicated by path and requested with HEAD against the local fixture server. A status >= 400 is a break.',
    frequency: 'per_run',
    interpretation: 'Above 0 means a reader following a link on the rendered page reaches nothing. This is stricter than design-qa.mjs, which resolves hrefs against the file system and cannot see a link a module added at runtime.',
    limitations: 'It follows only links present in the RENDERED DOM of the seven pages listed in agent/browser/checks.mjs PAGES. A link that appears only after an interaction is not followed. External links are deliberately not requested: nothing in this repository has ever fetched an external URL (AUDIT F-12) and this metric does not change that.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) { return fromBrowser(ctx, 'links'); },
  }),

  defineMetric({
    id: 'public_website.browser_regressions',
    name: 'Browser regressions',
    domain: 'public_website',
    definition: 'Checks in the browser regression suite that failed, across all seventeen areas, measured against the suite\'s recorded baseline of zero failures.',
    source: 'node agent/browser/cli.mjs — agent/browser/runner.mjs',
    calculation: 'The suite\'s fail count. Undecidable checks are counted separately and never folded in: an undecidable established neither a defect nor its absence.',
    frequency: 'per_run',
    interpretation: 'A rise means something a reader meets in a browser stopped working. Three failures are EXPECTED as at 2026-09-03 and are named in docs/BROWSER-QA.md §4 — they are open findings, not regressions, and a fourth is the signal. A FALL to below three means one was fixed or a check stopped firing, and this metric cannot tell those apart.',
    limitations: 'One browser, Chromium, headless. No screen reader, no contrast computation, no pixel comparison, no visual regression. README limitation 7 stands. A layout that renders without overflow and looks wrong passes every check.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) {
      if (!ctx.browser) {
        return ctx.browser_error
          ? unmeasurable(`the browser suite threw: ${ctx.browser_error}`, 'a working browser and a re-run; the suite itself is tested by node --test agent/browser/selftest.mjs')
          : unmeasurable(BROWSER_ABSENT.why, BROWSER_ABSENT.needs);
      }
      if (ctx.browser.status === 'skipped') {
        return unmeasurable(`no browser was found, so the suite did not run: ${ctx.browser.skipReason}`, 'a Chromium or Chrome executable on this machine, or $BROWSER_QA_CHROME pointing at one');
      }
      return measured(ctx.browser.counts.fail, {
        of: ctx.browser.counts.total,
        unit: 'failing checks',
        detail: {
          pass: ctx.browser.counts.pass,
          undecidable: ctx.browser.counts.undecidable,
          verdict: ctx.browser.verdict,
          browser: ctx.browser.browser?.version ?? null,
          failed: (ctx.browser.failed ?? []).map((f) => f.id),
        },
        evidence: (ctx.browser.failed ?? []).map((f) => `${f.id} — ${f.summary}`),
      });
    },
  }),

  defineMetric({
    id: 'public_website.console_errors',
    name: 'Console errors',
    domain: 'public_website',
    definition: 'Pages that logged a console error or threw an uncaught exception during a real page load.',
    source: 'agent/browser/cdp.mjs Runtime.consoleAPICalled and Runtime.exceptionThrown, collected per page',
    calculation: 'One failing check per page that logged at least one console error, and one per page that threw at least one uncaught exception. The two are kept apart on purpose.',
    frequency: 'per_run',
    interpretation: 'Above 0 means a module failed at runtime on a page a reader can load. The site logs "[shell] failed" DELIBERATELY when the chrome cannot mount, so a console error here is a real failure and not defensive logging — and an uncaught exception is a different, worse fact than a logged one.',
    limitations: 'Only the seven pages in agent/browser/checks.mjs PAGES, only on load and the interactions the suite performs. An error thrown by an interaction nobody scripted is invisible. Nothing after deployment is observed at all: failures on the live site are console.error only and reach no one (AUDIT F-14).',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) { return fromBrowser(ctx, 'console'); },
  }),

  defineMetric({
    id: 'public_website.localization_failures',
    name: 'Localization failures',
    domain: 'public_website',
    definition: 'Errors and warnings from tools/i18n-audit.mjs, plus failures in the browser suite\'s localization area — the register against the markup, and the register against what a reader actually sees after switching language.',
    source: 'node tools/i18n-audit.mjs, and agent/browser/checks.mjs checkLanguageSwitching',
    calculation: 'i18n-audit errors + i18n-audit warnings + failing checks in the browser suite\'s "localization" area. Warnings are included because this validator\'s baseline is 0 warnings, so any warning is new.',
    frequency: 'per_commit',
    interpretation: 'Above 0 means a locale asserts something the register does not declare, a key was dropped without being declared superseded, or the language switch does not do what it says. The superseded hazard is the sharp one: correcting an English string without declaring the key superseded leaves the it/fr/es editions asserting the thing that was just corrected, and this has already happened once.',
    limitations: 'i18n-audit cannot detect a STALE PRESENT key — a translation that exists, is declared, and no longer matches the English it translates (AUDIT F-08). That is the most likely localization defect in this repository and this metric is blind to it. Fallbacks to English are reported by the browser suite but are NOT counted as failures: the register declares its gaps deliberately.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) {
      const c = validatorCheck(ctx, 'i18n-audit.mjs');
      const b = browserArea(ctx, 'localization');
      if (!c) return unmeasurable('the validators were not run in this gathering', 'run the monitor without --no-validators');
      const audit = c.errors + c.warnings;
      return measured(audit + (b?.failed.length ?? 0), {
        unit: 'failures',
        detail: {
          i18n_audit_errors: c.errors,
          i18n_audit_warnings: c.warnings,
          browser_failures: b ? b.failed.map((f) => f.id) : null,
          browser_note: b ? null : BROWSER_ABSENT.why,
          stale_present_keys: 'not measurable by anything in this repository — AUDIT F-08',
        },
        evidence: [c.command, ...(b?.failed ?? []).map((f) => f.id)],
      });
    },
  }),

  defineMetric({
    id: 'public_website.accessibility_failures',
    name: 'Accessibility failures',
    domain: 'public_website',
    definition: 'Failing checks in the browser suite\'s accessibility area: the RENDERED heading outline, duplicate ids after rendering, missing alt, landmarks, the lang attribute, accessible names on focusable elements, and the skip link\'s position in the real tab order.',
    source: 'agent/browser/checks.mjs checkAccessibility, checkKeyboard, checkNavigation',
    calculation: 'Failing checks in the "accessibility" area across all seven pages. Undecidable checks — chiefly the focus-indicator comparison and the standing statement that no contrast was computed — are reported separately and never counted as passes.',
    frequency: 'per_run',
    interpretation: 'Above 0 means a reader using a keyboard or a screen reader meets something the markup does not reveal. Two of the three current failures are of exactly that kind: design-qa.mjs checks the MARKUP, where the heading order is correct and the skip link is first, and the defects exist only after js/shell.js has run.',
    limitations: 'NO CONTRAST RATIO IS COMPUTED, NO SCREEN READER IS RUN, AND NO PIXELS ARE COMPARED. This metric measures what a headless Chromium\'s DOM and computed styles can support and nothing beyond it. README limitation 7 is unchanged by it, and docs/UX-AUDIT.md §7 lists the twelve open questions that need a person. A 0 here would mean the automatable checks passed, not that the site is accessible.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) { return fromBrowser(ctx, 'accessibility'); },
  }),

  defineMetric({
    id: 'public_website.rendering_failures',
    name: 'Rendering failures',
    domain: 'public_website',
    definition: 'Pages whose mount point still holds the loading fallback the markup ships, or which rendered under 200 characters, or which rendered no h1 or more than one.',
    source: 'agent/browser/checks.mjs checkPageLoads, over the seven pages',
    calculation: 'Failing checks in the "page-load" area. A page is "rendered" when its mount point no longer holds the shipped fallback — checking for the ABSENCE of the fallback rather than the presence of content, because a renderer that wrote an error message into the same element would satisfy the second and not the first.',
    frequency: 'per_run',
    interpretation: 'Above 0 means a page a reader can load shows nothing, or shows "Loading the comparison…" forever. Every page outside the brief renders from a fetch in js/data.js, so this is the metric that would catch a dataset the renderers can no longer read.',
    limitations: 'Network quiet is 350 ms after the last request, not a real idle signal. A renderer slower than that would read as not having rendered — no such case exists today, and it would show as a failure rather than a silent pass. Only the seven listed pages; only the default viewport.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) { return fromBrowser(ctx, 'page-load'); },
  }),

  defineMetric({
    id: 'public_website.search_failures',
    name: 'Search failures',
    domain: 'public_website',
    definition: 'Failures in the command palette: whether "/" opens it, whether focus lands in its input, whether typing produces results, and whether Escape closes it.',
    source: 'agent/browser/checks.mjs checkSearch, on enforcement.html',
    calculation: 'Failing checks in the "search" area. The palette is opened BY KEYBOARD rather than by clicking its button, because the "/" binding lives in js/palette.js and nothing else exercises it.',
    frequency: 'per_run',
    interpretation: 'Above 0 means search is broken for a reader. Search is how the record is reachable at all for anyone who does not already know which page holds what, so a failure here is larger than its count suggests.',
    limitations: 'One query ("gdpr"), on one page. It establishes that the palette opens, focuses, returns results and closes — not that the results are RELEVANT, RANKED sensibly, or complete. Nothing here measures search quality, and a palette returning 26 wrong results passes.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) { return fromBrowser(ctx, 'search'); },
  }),

  defineMetric({
    id: 'public_website.navigation_failures',
    name: 'Navigation failures',
    domain: 'public_website',
    definition: 'Failures in reaching the six top-level pages from the rendered chrome, and in reaching them with scripting disabled.',
    source: 'agent/browser/checks.mjs checkNavigation, with and without script execution',
    calculation: 'Failing checks in the "navigation" area. The no-script half loads the same page with Emulation.setScriptExecutionDisabled and asks the same question.',
    frequency: 'per_run',
    interpretation: 'Above 0 means a reader cannot get from one page to another. One failure is EXPECTED as at 2026-09-03 and is issue 25: with scripting off the site links to none of its six top-level pages, and the <noscript> notice — which lists eight things that will not appear — does not list navigation. That is a defect a reader can meet today.',
    limitations: 'It checks that a link EXISTS and resolves, not that a reader can find it. Discoverability, labelling and information scent are docs/UX-AUDIT.md\'s subject and are not measured here.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) { return fromBrowser(ctx, 'navigation'); },
  }),

  defineMetric({
    id: 'public_website.deployment_failures',
    name: 'Deployment failures',
    domain: 'public_website',
    definition: 'Publications of the site that did not reach readers, or reached them broken.',
    source: 'nothing. There is no deployment telemetry in this repository and no observation of the deployed origin.',
    calculation: 'None is possible. Deployment is GitHub Pages serving main at the repository root; there is no build log this repository can read, no deploy hook, no status endpoint it queries, and no health check against the live site.',
    frequency: 'per_deploy',
    interpretation: 'This metric is UNMEASURABLE and reports as such on every run. It is declared rather than omitted because SESSION 20 asks for it, and because a health view that silently dropped the one thing standing between the repository and its readers would be describing a different system. A 0 here would be a lie of exactly the kind AI-SAFE-BOUNDARIES §0.4 prohibits.',
    limitations: 'Everything. Nothing here has ever fetched https://andreatosti2001.github.io/Eu-Digital-Policy/ — outbound access to that origin is refused by this environment\'s network policy (HTTP 403 on CONNECT, recorded in docs/CURRENT-ARCHITECTURE.md §13), and no session has confirmed what the live site serves. .github/workflows/qa.yml runs the checks on every push but is NOT a deploy gate: nothing sits between a commit and publication.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure() {
      return unmeasurable(
        'there is no deployment telemetry in this repository, and no session has ever fetched the deployed origin — outbound access to andreatosti2001.github.io is refused by this environment\'s network policy (docs/CURRENT-ARCHITECTURE.md §13). Nothing here can see whether a publication succeeded, failed, or served something different from the tree.',
        'either a reachable deployed origin plus a check that fetches it, or a GitHub Pages deployment status this repository is permitted to read. Both are outside the tree; the first is also outside this environment.',
      );
    },
  }),

];
