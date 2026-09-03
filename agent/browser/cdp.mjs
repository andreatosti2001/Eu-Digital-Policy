/* ============================================================
   agent/browser/cdp.mjs — a browser, driven, with nothing installed

   The whole client is Node 22's global `WebSocket` plus
   `child_process.spawn`. That is the entire dependency list, and it
   is why this suite can exist in a repository whose architecture
   forbids a package.json.

   WHAT THIS IS NOT. It is not Playwright. It has no auto-waiting, no
   selector engine, no trace viewer and no cross-browser support, and
   `docs/BROWSER-QA.md` §6 lists what that costs. Every check in
   `checks.mjs` is therefore written to be explicit about what it
   waited for, because there is no framework here quietly waiting on
   its behalf — and a check that passed because it ran before the
   page had rendered would be the worst kind of green.

   THE PROTOCOL, in the three moves this file makes:

     · spawn the browser with --remote-debugging-port=0 and read the
       `DevTools listening on ws://…` line off stderr. Port 0 rather
       than a fixed port so two runs never collide.
     · Target.createTarget + Target.attachToTarget({flatten:true}) to
       get a session for one page. Flat sessions mean every later
       message carries a sessionId and there is one socket, not two.
     · Runtime.evaluate with awaitPromise, which is how every check
       asks the page a question.

   Nothing here writes to the page. The suite reads the rendered
   result and clicks things a reader can click; it does not inject
   content, and `runner.mjs` asserts the repository is byte-identical
   afterwards.
   ============================================================ */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const LAUNCH_TIMEOUT_MS = 30_000;
export const COMMAND_TIMEOUT_MS = 30_000;

/** Flags, each with the reason it is here. A flag list nobody can
 *  explain is a flag list nobody can shorten. */
export const CHROME_FLAGS = [
  '--headless=new',            // no display on a runner
  '--remote-debugging-port=0', // ephemeral: two runs never collide
  '--remote-allow-origins=*',  // the CDP socket refuses a null Origin otherwise
  '--no-sandbox',              // containers and GitHub runners have no user namespaces
  '--disable-dev-shm-usage',   // /dev/shm is 64 MB in most containers
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--mute-audio',
  '--hide-scrollbars',

  /* THE BROWSER PROCESS'S OWN TRAFFIC, suppressed as far as flags
     reach. This is a different question from what the PAGES request,
     and conflating the two would overstate what `checkNoThirdParty`
     proves: that check reads Network events on the page's own
     session, so it is a statement about the site and not about
     Chromium. Observed during construction: a run left connection
     attempts to www.google.com and content-autofill.googleapis.com
     in the environment's proxy log, none of them made by a page.
     Recorded in docs/BROWSER-QA.md §6.8 rather than left to be
     rediscovered as a security finding. */
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-sync',
  '--disable-domain-reliability',
  '--disable-client-side-phishing-detection',
  '--safebrowsing-disable-auto-update',
  '--disable-breakpad',
  '--no-pings',
  '--no-service-autorun',
  '--metrics-recording-only',
  '--disable-features=Translate,OptimizationHints,MediaRouter,AutofillServerCommunication,CalculateNativeWinOcclusion,InterestFeedContentSuggestions',
];

class Rpc {
  constructor(ws) {
    this.ws = ws;
    this.next = 1;
    this.pending = new Map();
    this.listeners = new Map();
    ws.addEventListener('message', (ev) => this.#onMessage(String(ev.data)));
  }

  #onMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.id !== undefined && this.pending.has(msg.id)) {
      const { ok, fail, timer } = this.pending.get(msg.id);
      clearTimeout(timer);
      this.pending.delete(msg.id);
      if (msg.error) fail(new Error(`${msg.error.message}${msg.error.data ? ` — ${msg.error.data}` : ''}`));
      else ok(msg.result);
      return;
    }
    if (msg.method) {
      for (const fn of this.listeners.get(msg.method) ?? []) { try { fn(msg.params, msg.sessionId); } catch { /* a listener must not kill the socket */ } }
      for (const fn of this.listeners.get('*') ?? []) { try { fn(msg); } catch { /* same */ } }
    }
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
    return this;
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.next++;
    const payload = JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params });
    return new Promise((ok, fail) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        fail(new Error(`${method} did not answer within ${COMMAND_TIMEOUT_MS} ms`));
      }, COMMAND_TIMEOUT_MS);
      this.pending.set(id, { ok, fail, timer });
      try { this.ws.send(payload); } catch (e) { clearTimeout(timer); this.pending.delete(id); fail(e); }
    });
  }
}

/** Resolves once the socket is open, or rejects with something a
 *  human can act on. */
function openSocket(url) {
  return new Promise((ok, fail) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => fail(new Error(`the DevTools socket at ${url} did not open within ${LAUNCH_TIMEOUT_MS} ms`)), LAUNCH_TIMEOUT_MS);
    ws.addEventListener('open', () => { clearTimeout(timer); ok(ws); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); fail(new Error(`the DevTools socket at ${url} refused the connection`)); }, { once: true });
  });
}

/**
 * Launch a browser and attach to it.
 *
 * @param {{executable:string, flags?:string[], headless?:boolean}} opts
 * @returns {Promise<Browser>}
 */
export async function launch({ executable, flags = CHROME_FLAGS }) {
  const profile = mkdtempSync(join(tmpdir(), 'browser-qa-'));
  const child = spawn(executable, [...flags, `--user-data-dir=${profile}`, 'about:blank'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const wsUrl = await new Promise((ok, fail) => {
    let buf = '';
    const timer = setTimeout(() => fail(new Error(`${executable} did not print a DevTools endpoint within ${LAUNCH_TIMEOUT_MS} ms. stderr so far:\n${buf.slice(-2000)}`)), LAUNCH_TIMEOUT_MS);
    const onData = (chunk) => {
      buf += String(chunk);
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(timer); child.stderr.off('data', onData); ok(m[1]); }
    };
    child.stderr.on('data', onData);
    child.once('error', (e) => { clearTimeout(timer); fail(new Error(`could not start ${executable}: ${e.message}`)); });
    child.once('exit', (code) => { clearTimeout(timer); fail(new Error(`${executable} exited with code ${code} before printing a DevTools endpoint. stderr:\n${buf.slice(-2000)}`)); });
  });

  const ws = await openSocket(wsUrl);
  return new Browser({ child, ws, profile, rpc: new Rpc(ws) });
}

export class Browser {
  constructor({ child, ws, profile, rpc }) {
    this.child = child;
    this.ws = ws;
    this.profile = profile;
    this.rpc = rpc;
    this.pages = [];
  }

  async version() {
    const v = await this.rpc.send('Browser.getVersion');
    return v.product ?? null;
  }

  /** One page, isolated in its own browser context so localStorage
   *  from an earlier check cannot decide a later one. That has bitten
   *  this site's own tests before: the language choice is stored in
   *  `eupolicy:lang` and survives a reload. */
  async newPage() {
    const { browserContextId } = await this.rpc.send('Target.createBrowserContext', { disposeOnDetach: true });
    const { targetId } = await this.rpc.send('Target.createTarget', { url: 'about:blank', browserContextId });
    const { sessionId } = await this.rpc.send('Target.attachToTarget', { targetId, flatten: true });
    const page = new Page(this, sessionId, targetId, browserContextId);
    await page.init();
    this.pages.push(page);
    return page;
  }

  async close() {
    for (const p of this.pages) { try { await p.close(); } catch { /* closing a dead page is not a failure */ } }
    try { await this.rpc.send('Browser.close'); } catch { /* the browser may already be gone */ }
    try { this.ws.close(); } catch { /* same */ }
    await new Promise((ok) => {
      const t = setTimeout(() => { try { this.child.kill('SIGKILL'); } catch { /* already dead */ } ok(); }, 4000);
      this.child.once('exit', () => { clearTimeout(t); ok(); });
      if (this.child.exitCode !== null) { clearTimeout(t); ok(); }
    });
    try { rmSync(this.profile, { recursive: true, force: true }); } catch { /* a leftover temp profile is not a test result */ }
  }
}

export class Page {
  constructor(browser, sessionId, targetId, contextId) {
    this.browser = browser;
    this.sessionId = sessionId;
    this.targetId = targetId;
    this.contextId = contextId;
    /** Every console message, kept whole. `console errors` is one of
     *  the fifteen things SESSION 19 names, and a count without the
     *  text is not a finding. */
    this.console = [];
    /** Every uncaught exception. Distinct from a console.error: the
     *  site logs `[shell] failed` deliberately, and a thrown
     *  TypeError is a different fact. */
    this.exceptions = [];
    /** Every request the page made, with its origin. */
    this.requests = [];
    this.failedRequests = [];
  }

  send(method, params) { return this.browser.rpc.send(method, params, this.sessionId); }

  async init() {
    const r = this.browser.rpc;
    r.on('Runtime.consoleAPICalled', (p, sid) => {
      if (sid !== this.sessionId) return;
      this.console.push({
        level: p.type,
        text: (p.args ?? []).map(describeRemote).join(' '),
        url: p.stackTrace?.callFrames?.[0]?.url ?? null,
        line: p.stackTrace?.callFrames?.[0]?.lineNumber ?? null,
      });
    });
    r.on('Runtime.exceptionThrown', (p, sid) => {
      if (sid !== this.sessionId) return;
      const d = p.exceptionDetails ?? {};
      this.exceptions.push({
        text: d.exception?.description ?? d.text ?? 'uncaught exception',
        url: d.url ?? null,
        line: d.lineNumber ?? null,
      });
    });
    r.on('Network.requestWillBeSent', (p, sid) => {
      if (sid !== this.sessionId) return;
      this.requests.push({ url: p.request.url, type: p.type ?? null });
    });
    r.on('Network.loadingFailed', (p, sid) => {
      if (sid !== this.sessionId) return;
      this.failedRequests.push({ requestId: p.requestId, error: p.errorText ?? null, type: p.type ?? null });
    });

    await this.send('Runtime.enable');
    await this.send('Page.enable');
    await this.send('Network.enable');
    await this.send('DOM.enable');
  }

  /** Navigate, then wait for the page to be quiet. `Page.loadEventFired`
   *  is not enough here: every page outside the brief renders from a
   *  `fetch` in `js/data.js` that resolves AFTER load, so a check
   *  that stopped at load would read an empty `<main>` and report it. */
  async goto(url, { settleMs = 350, timeoutMs = COMMAND_TIMEOUT_MS } = {}) {
    const before = this.requests.length;
    const loaded = new Promise((ok) => {
      const off = (p, sid) => { if (sid === this.sessionId) ok(true); };
      this.browser.rpc.on('Page.loadEventFired', off);
      setTimeout(() => ok(false), timeoutMs);
    });
    const nav = await this.send('Page.navigate', { url });
    if (nav.errorText) throw new Error(`navigating to ${url} failed: ${nav.errorText}`);
    await loaded;
    await this.waitForQuiet({ settleMs, timeoutMs: Math.max(2000, timeoutMs - 5000), since: before });
    return nav;
  }

  /** Network quiet: no new request for `settleMs`. Crude next to
   *  Playwright's networkidle, and stated as such in
   *  docs/BROWSER-QA.md §6 rather than dressed up. */
  async waitForQuiet({ settleMs = 350, timeoutMs = 15_000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    let seen = this.requests.length;
    let quietSince = Date.now();
    for (;;) {
      await sleep(50);
      if (this.requests.length !== seen) { seen = this.requests.length; quietSince = Date.now(); }
      if (Date.now() - quietSince >= settleMs) return true;
      if (Date.now() > deadline) return false;
    }
  }

  /** Ask the page a question. `expr` is evaluated in the page and its
   *  value comes back by value, so nothing here holds a handle to a
   *  DOM node across a navigation. */
  async evaluate(expr, { awaitPromise = true } = {}) {
    const r = await this.send('Runtime.evaluate', {
      expression: typeof expr === 'function' ? `(${expr.toString()})()` : expr,
      returnByValue: true,
      awaitPromise,
      userGesture: true,
    });
    if (r.exceptionDetails) {
      throw new Error(`page evaluation threw: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
    }
    return r.result?.value;
  }

  /** Poll a predicate in the page. Returns the value, or null on
   *  timeout — the caller decides whether a timeout is a finding. */
  async waitFor(expr, { timeoutMs = 10_000, everyMs = 100 } = {}) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      let v = null;
      try { v = await this.evaluate(expr); } catch { v = null; }
      if (v) return v;
      if (Date.now() > deadline) return null;
      await sleep(everyMs);
    }
  }

  async setViewport({ width, height, mobile = false, deviceScaleFactor = 1 }) {
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, mobile, deviceScaleFactor });
  }

  /**
   * A real key event, dispatched through the input pipeline, so the
   * page's own keydown handlers see it exactly as a reader's would.
   *
   * `text` is what separates a keypress from a character. A `keyDown`
   * CARRYING text inserts that character if nothing calls
   * preventDefault; a `rawKeyDown` without it does not. Both matter
   * here and getting them the wrong way round produced a real false
   * positive during this session: opening the palette with
   * `key('/', { text: '/' })` fired the page's own "/" binding AND
   * typed a slash into the input it had just focused, so the search
   * ran for "/gdpr" and the check reported the palette as returning
   * nothing. Send text only when a character is wanted.
   */
  async key(key, { code = key, keyCode = 0, modifiers = 0, text } = {}) {
    const base = { modifiers, key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
    await this.send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', text, ...base });
    await this.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
  }

  /** One character per keypress. `Input.insertText` would be faster
   *  and would skip every keydown handler the page has, which is
   *  most of what a search box is. */
  async type(text) {
    for (const ch of text) {
      await this.key(ch, { code: /[a-z]/i.test(ch) ? `Key${ch.toUpperCase()}` : 'Unidentified', text: ch });
      await sleep(15);
    }
  }

  async close() {
    try { await this.browser.rpc.send('Target.closeTarget', { targetId: this.targetId }); } catch { /* already closed */ }
  }
}

/** CDP hands back a RemoteObject; a console line is only useful as
 *  its text. Objects arrive with a `description` and primitives with
 *  a `value`, and an unrendered `[object Object]` in a finding is a
 *  finding nobody can act on. */
function describeRemote(o) {
  if (!o) return '';
  if (o.type === 'string') return o.value;
  if ('value' in o) return JSON.stringify(o.value);
  return o.description ?? o.className ?? o.type ?? '';
}

export const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
