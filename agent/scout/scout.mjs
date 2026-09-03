/* ============================================================
   agent/scout/scout.mjs — Agent 1: the Source Scout

   Its whole job: find documents from official EU sources that bear
   on the instruments this repository already tracks, and say what it
   found, what it could not reach, and how sure it is.

   WHAT IT IS NOT ALLOWED TO DO, and does not:

     · publish anything;
     · modify a canonical fact — it never opens data/*.json for
       writing, and it never creates a sources.json record;
     · produce a finished article, a claim, or a verification;
     · update an existing record silently. It cannot update one at
       all: everything it emits is a new immutable record with its
       own id, and the only thing it does about a document that
       already exists in the corpus is NAME it as a possible
       duplicate and stop.

   HOW THE FOUR STATES ARE FILLED, because this is the part that
   matters more than the crawling:

     fact           the title, the publisher and the publication date,
                    but ONLY where the document itself states them in
                    a machine-readable field, each citing the
                    retrieval that read them.
     inference      the authority class, concluded from the host the
                    document was served by, and the evidence tier,
                    concluded from the taxonomy's own tier
                    definitions. Never from the document's tone or
                    its URL.
     interpretation the relevance: which instruments this Scout
                    thinks the document bears on, with the exact
                    string that matched, so somebody can disagree
                    with it on the evidence.
     unresolved     everything else. A document with no stated date
                    yields publication_date "unknown" and a question,
                    not a date taken from the address. A host on no
                    registered endpoint yields a null authority class
                    and a question, not a quiet "secondary". A
                    refused retrieval yields a DataGap, not silence
                    and not a candidate.

   Every record leaves through agent/schemas/gateway.mjs, which
   validates and throws. There is no second path out of this module.
   ============================================================ */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isoOf } from '../observability/ids.mjs';
import { emit } from '../schemas/gateway.mjs';
import { IdMinter } from '../schemas/identity.mjs';
import { authorityForUrl, authorityRank, endpointsByPriority, estimateTier } from './authorities.mjs';
import { extractLinks, extractPublicationDate, extractPublisher, extractTitle, instrumentTerms, matchInstruments, textOf } from './extract.mjs';
import { findDuplicates } from './dedupe.mjs';
import { AGENT_ROOT } from './store.mjs';

export const SCOUT_AGENT = 'source-scout';

export const DEFAULT_SCOUT_LIMITS = {
  max_endpoints: 8,
  max_documents_per_endpoint: 4,
  max_links_considered: 40,
};

/** Role in the bibliography's vocabulary, from the authority class.
 *  An unregistered host gets "unresolved" — which is a role, and an
 *  honest one, rather than a default of "secondary" that would be a
 *  claim about a publisher nobody has identified. */
const ROLE_BY_AUTHORITY = {
  'authority:eur-lex': 'primary',
  'authority:court': 'primary',
  'authority:commission': 'official',
  'authority:edpb': 'official',
  'authority:edps': 'official',
  'authority:enisa': 'official',
  'authority:eu-agency': 'official',
  'authority:national-authority': 'official',
  'authority:secondary-expert': 'secondary',
};

export function loadInstruments(root = join(AGENT_ROOT, '..')) {
  return JSON.parse(readFileSync(join(root, 'data', 'instruments.json'), 'utf8')).instruments;
}

const empty = () => ({ fact: [], inference: [], interpretation: [], unresolved: [] });

/**
 * How much the Scout is standing on. Stated as a formula rather than
 * a feeling, so two candidates with the same evidence get the same
 * number and a reviewer can tell why one is lower.
 */
function confidenceOf({ title, publisher, date, registeredAuthority, matchKind }) {
  let c = 0.3;                                   // it fetched something, and that is all
  if (title) c += 0.15;                          // the document names itself
  if (publisher) c += 0.15;                      // and says who published it
  if (date) c += 0.15;                           // and when
  if (registeredAuthority) c += 0.15;            // served by a host on the registry
  if (matchKind === 'celex') c += 0.1;           // identified an instrument by its CELEX number
  else if (matchKind === 'full_name') c += 0.05; // or by its full title
  return Math.min(0.95, Number(c.toFixed(2)));   // never 1: it has verified nothing
}

export class Scout {
  constructor({ tracer, transport, store, endpoints, instruments, limits = {} }) {
    this.tracer = tracer;
    this.transport = transport;
    this.store = store;
    this.endpoints = endpoints ?? endpointsByPriority();
    this.instruments = instruments ?? loadInstruments();
    this.terms = instrumentTerms(this.instruments);
    this.limits = { ...DEFAULT_SCOUT_LIMITS, ...limits };
    this.simulated = transport.simulated === true;
    /* Ids are derived from the finding's own content, never from a
       counter — agent/schemas/identity.mjs says why. */
    this.ids = new IdMinter();
  }

  #now() { return isoOf(this.tracer.clock.now()); }

  #envelope(contract, span, over = {}) {
    return {
      contract,
      contract_version: 1,
      agent: SCOUT_AGENT,
      created_at: this.#now(),
      affected_entities: [],
      evidence: [],
      epistemic: empty(),
      trace_ref: { trace_id: span.trace_id, span_id: span.span_id, run_id: span.run_id },
      simulated: this.simulated,
      ...over,
    };
  }

  /** Validate, register in the trace, store. One way out. */
  #ship(span, record) {
    emit(span, record, { allowSimulated: this.simulated });
    this.store.write(record);
    return record;
  }

  /* ---------------------------------------------------------- fetch */

  async #fetch(parent, url, purpose) {
    const span = parent.startTool({ name: 'scout.fetch', inputs: { url, purpose } });
    const res = await this.transport.get(url);
    span.usage({ latency_ms: res.elapsed_ms ?? null });
    span.end({
      status: res.ok ? 'ok' : 'failed',
      outputs: { status: res.status, byte_length: res.byte_length ?? 0, sha256: res.sha256 ?? null, blocked_by: res.blocked_by ?? null },
    });
    return res;
  }

  /* ---------------------------------------------------------- gaps */

  #gapForFailure(span, { url, res, endpoint, purpose }) {
    const blocked = res.blocked_by === 'egress_policy';
    const gap = this.#envelope('DataGap', span, {
      /* The same URL, unread for the same purpose, is the same gap
         on every run — which is what lets a reader see that a
         retrieval has been failing for six weeks rather than see
         six weeks of new gaps. */
      gap_id: this.ids.mint('gap', {
        kind: 'retrieval_blocked',
        entities: [{ kind: 'source', id: endpoint?.id ?? null, path: null }],
        subject: url,
        discriminator: purpose,
      }),
      gap_kind: 'retrieval_blocked',
      absence_kind: 'null_not_researched',
      what_is_missing: `The document at ${url} has not been read. Retrieval was attempted and did not succeed.`,
      why_open: blocked
        ? `Retrieval was refused before it reached the origin: ${res.reason}. This is this environment's egress policy, not a statement about the document.`
        : `Retrieval failed: ${res.reason}${res.status ? ` (status ${res.status})` : ''}.`,
      closes_with: blocked
        ? `Retrieving ${url} from an environment whose egress policy permits ${safeHost(url)}, and reading what it says.`
        : `Retrieving ${url} successfully and reading what it says.`,
      candidate_leads: [url],
      blocking: false,
      first_seen_at: this.#now(),
      last_reviewed_at: null,
      state: 'open',
      closed_by: null,
      affected_entities: [{
        kind: 'source',
        id: endpoint?.id ?? null,
        path: null,
        field: null,
        note: `Prospective source, ${purpose}. Not retrieved, therefore not a source.`,
      }],
      evidence: [{
        evidence_id: 'ev-absent',
        kind: 'absent',
        source_id: null, url: null, locator: null, title: null, publisher: null,
        quote: null, retrieved_at: null, checksum: null,
        supports: null, role: 'unresolved', simulated: this.simulated,
      }],
      epistemic: {
        fact: [], inference: [], interpretation: [],
        unresolved: [{
          field: null,
          question: `What does the document at ${url} say?`,
          missing: 'The document itself. Nothing has been read, so nothing is asserted about its contents.',
          absence_kind: 'null_not_researched',
          blocks: false,
        }],
      },
    });
    return this.#ship(span, gap);
  }

  /* ---------------------------------------------------------- candidates */

  #buildCandidate(span, { url, res, endpoint, html }) {
    const title = extractTitle(html);
    const publisher = extractPublisher(html);
    const date = extractPublicationDate(html);
    const registered = authorityForUrl(url) ?? endpoint ?? null;
    const authority_class = registered?.authority_class ?? null;
    const matches = matchInstruments(textOf(html), this.terms);
    if (matches.length === 0) return null;

    const { tier, method: tierMethod } = estimateTier({ authority_class, source_type: null });
    const retrieved_at = this.#now();

    const evidence = [{
      evidence_id: 'ev-retrieval',
      kind: 'retrieved_document',
      source_id: null,
      url,
      locator: 'the document as served',
      title: title?.value ?? null,
      publisher: publisher?.value ?? null,
      quote: null,
      retrieved_at,
      checksum: res.sha256,
      supports: 'supports:direct',
      role: ROLE_BY_AUTHORITY[authority_class] ?? 'unresolved',
      simulated: this.simulated,
    }];

    const ep = empty();

    if (title) ep.fact.push({ field: 'title', statement: `The document titles itself "${title.value}".`, evidence_refs: ['ev-retrieval'] });
    if (publisher) ep.fact.push({ field: 'publisher', statement: `The document names "${publisher.value}" as its publisher.`, evidence_refs: ['ev-retrieval'] });
    if (date) ep.fact.push({ field: 'publication_date', statement: `The document states the publication date "${date.value}" in ${date.read_from}.`, evidence_refs: ['ev-retrieval'] });

    if (authority_class) {
      ep.inference.push({
        field: 'authority_class',
        statement: `It was issued by ${registered.authority_name}.`,
        from: ['ev-retrieval'],
        method: `The document was served by a host registered to this authority (${registered.id}). This is a conclusion from where it was served, not something the document states about itself.`,
      });
    } else {
      ep.unresolved.push({
        field: 'authority_class',
        question: 'Which authority issued this document?',
        missing: 'An identification of the issuing body — the host is on no registered endpoint, and the document names no publisher this Scout can place.',
        absence_kind: 'null_not_researched',
        blocks: false,
      });
    }

    if (tier) {
      ep.inference.push({ field: 'tier_estimate', statement: `It sits in ${tier}.`, from: ['ev-retrieval'], method: tierMethod });
    } else {
      ep.unresolved.push({
        field: 'tier_estimate',
        question: 'Which evidence tier does this document sit in?',
        missing: `The document type. ${tierMethod}`,
        absence_kind: 'null_not_researched',
        blocks: false,
      });
    }

    ep.interpretation.push({
      field: 'relevance',
      statement: `It bears on ${matches.map((m) => m.instrument_id).join(', ')}.`,
      held_by: SCOUT_AGENT,
      basis: matches.map((m) => `matched ${m.match_kind} "${m.matched_on}" ${m.count}×`).join('; '),
      contested: matches.every((m) => m.match_kind === 'short_name'),
    });

    if (!date) {
      ep.unresolved.push({
        field: 'publication_date',
        question: 'When was this document published?',
        missing: 'A publication date stated by the document itself. It carries none in any machine-readable field, and this Scout does not take a date from a URL or from prose.',
        absence_kind: 'unknown_not_determinable',
        blocks: false,
      });
    }
    if (!publisher) {
      ep.unresolved.push({
        field: 'publisher',
        question: 'Who published this document?',
        missing: 'A publisher stated by the document. Being served by a given host is not the document saying who published it.',
        absence_kind: 'null_not_researched',
        blocks: false,
      });
    }
    ep.unresolved.push({
      field: 'source_type',
      question: 'What kind of document is this — a decision, an opinion, guidance, a press release?',
      missing: 'A classification. This Scout does not classify document type; it reads what the document states and stops.',
      absence_kind: 'null_not_researched',
      blocks: false,
    });

    return this.#envelope('SourceCandidate', span, {
      /* A candidate IS a URL read against the instruments it
         mentions. Two runs over the same page produce one node. */
      candidate_id: this.ids.mint('cand', {
        kind: 'source_candidate',
        entities: matches.map((m) => ({ kind: 'instrument', id: m.instrument_id, path: 'data/instruments.json' })),
        subject: url,
      }),
      url,
      locator: null,
      title: title?.value ?? null,
      publisher: publisher?.value ?? null,
      publication_date: date ? date.value : 'unknown',
      source_type: null,
      url_status: 'url:live',
      tier_estimate: tier,
      authority_class,
      relevance: `Mentions ${matches.map((m) => `${m.instrument_id} (${m.match_kind} "${m.matched_on}", ${m.count}×)`).join('; ')}. Whether it is a development in any of them is not established here.`,
      confidence: confidenceOf({
        title: !!title, publisher: !!publisher, date: !!date,
        registeredAuthority: !!authority_class, matchKind: matches[0].match_kind,
      }),
      duplicate_candidate_ids: [],
      matches_existing_source_id: null,
      verification_ref: null,
      state: 'proposed',
      affected_entities: matches.map((m) => ({
        kind: 'instrument', id: m.instrument_id, path: 'data/instruments.json', field: null,
        note: `Matched on ${m.match_kind} "${m.matched_on}".`,
      })),
      evidence,
      epistemic: ep,
    });
  }

  /* ---------------------------------------------------------- observations */

  #observe(span, { subject, summary, data, confidence, risk, facts = [], unresolved = [] }) {
    const rec = this.#envelope('AgentObservation', span, {
      observation_id: this.ids.mint('obs', { kind: 'observation', subject, discriminator: summary }),
      subject,
      summary,
      data,
      confidence,
      risk,
      refs: [],
      supersedes: null,
      evidence: [{
        evidence_id: 'ev-measured',
        kind: 'measurement',
        source_id: null, url: null, locator: 'counted during this run', title: null, publisher: null,
        quote: null, retrieved_at: this.#now(), checksum: null,
        supports: 'supports:direct', role: 'primary', simulated: this.simulated,
      }],
      epistemic: {
        fact: facts.map((f) => ({ field: null, statement: f, evidence_refs: ['ev-measured'] })),
        inference: [], interpretation: [], unresolved,
      },
    });
    return this.#ship(span, rec);
  }

  /* ---------------------------------------------------------- the run */

  async run({ task = 'Discover developments bearing on the instruments this repository tracks.' } = {}) {
    const started_at = this.#now();
    const run = this.tracer.startRun({
      kind: 'agent',
      agent: SCOUT_AGENT,
      task,
      inputs: {
        endpoints: this.endpoints.map((e) => e.id),
        mode: this.simulated ? 'mock' : 'live',
        instruments_tracked: this.instruments.length,
        limits: this.limits,
      },
    });

    const candidates = [];
    const gaps = [];
    let fetched = 0;
    let screened_out = 0;

    try {
      run.observe({
        summary: `Scout starting over ${this.endpoints.length} endpoint(s) in ${this.simulated ? 'mock' : 'live'} mode, searching for ${this.instruments.length} tracked instruments.`,
        subject: 'run',
        data: { endpoints: this.endpoints.length, simulated: this.simulated },
        confidence: 1,
        risk: 'none',
        simulated: this.simulated,
      });

      for (const endpoint of this.endpoints.slice(0, this.limits.max_endpoints)) {
        const listing = await this.#fetch(run, endpoint.url, `listing page for ${endpoint.id}`);
        fetched++;

        if (!listing.ok) {
          run.observe({
            summary: `${endpoint.id}: not retrieved — ${listing.reason}`,
            subject: endpoint.id,
            data: { url: endpoint.url, status: listing.status, blocked_by: listing.blocked_by },
            confidence: 1, risk: 'low', simulated: this.simulated,
          });
          gaps.push(this.#gapForFailure(run, { url: endpoint.url, res: listing, endpoint, purpose: `listing page for ${endpoint.id}` }));
          this.#observe(run, {
            subject: endpoint.id,
            summary: `The listing page for ${endpoint.id} could not be retrieved, so nothing was discovered from it.`,
            data: { url: endpoint.url, status: listing.status, blocked_by: listing.blocked_by, reason: listing.reason },
            confidence: 1,
            risk: 'low',
            facts: [`A GET of ${endpoint.url} did not return a document${listing.status ? ` (status ${listing.status})` : ''}.`],
            unresolved: [{
              field: null,
              question: `What is currently published at ${endpoint.id}?`,
              missing: 'The listing page, and anything linked from it.',
              absence_kind: 'null_not_researched',
              blocks: false,
            }],
          });
          continue;
        }

        run.provenance({
          source_id: endpoint.id,
          role: ROLE_BY_AUTHORITY[endpoint.authority_class] ?? 'unresolved',
          url: endpoint.url,
          title: extractTitle(listing.bytes.toString('utf8'))?.value ?? null,
          publisher: null,
          retrieved_at: this.#now(),
          content_sha256: listing.sha256,
          simulated: this.simulated,
        });

        const html = listing.bytes.toString('utf8');
        const links = extractLinks(html, listing.final_url ?? endpoint.url, { limit: this.limits.max_links_considered })
          .slice(0, this.limits.max_documents_per_endpoint);

        run.observe({
          summary: `${endpoint.id}: ${links.length} link(s) taken from the listing page.`,
          subject: endpoint.id,
          data: { links: links.length, sha256: listing.sha256 },
          confidence: 1, risk: 'none', simulated: this.simulated,
        });

        for (const link of links) {
          const doc = await this.#fetch(run, link, `document linked from ${endpoint.id}`);
          fetched++;
          if (!doc.ok) {
            gaps.push(this.#gapForFailure(run, { url: link, res: doc, endpoint, purpose: `document linked from ${endpoint.id}` }));
            continue;
          }
          const candidate = this.#buildCandidate(run, { url: link, res: doc, endpoint, html: doc.bytes.toString('utf8') });
          if (!candidate) {
            screened_out++;
            run.observe({
              summary: `Screened out: ${link} mentions no instrument this repository tracks.`,
              subject: link,
              data: { url: link },
              confidence: 0.8, risk: 'none', simulated: this.simulated,
            });
            continue;
          }
          candidates.push(candidate);
        }

        this.#observe(run, {
          subject: endpoint.id,
          summary: `${endpoint.id}: ${links.length} document(s) considered, ${candidates.filter((c) => c.url.startsWith(new URL(endpoint.url).origin)).length} candidate(s) so far.`,
          data: { endpoint: endpoint.id, authority_class: endpoint.authority_class, rank: authorityRank(endpoint.authority_class), links: links.length },
          confidence: 1,
          risk: 'none',
          facts: [`The listing page at ${endpoint.url} was retrieved and ${links.length} link(s) were taken from it.`],
        });
      }

      /* Duplicates are named across the whole run, before anything is
         shipped, because a candidate cannot know about one found
         after it. */
      const dupes = findDuplicates(candidates.map((c) => ({
        candidate_id: c.candidate_id,
        url: c.url,
        title: c.title,
        fingerprint: c.evidence[0]?.checksum ?? null,
      })));
      for (const c of candidates) {
        const found = dupes.get(c.candidate_id) ?? [];
        c.duplicate_candidate_ids = found.map((d) => d.candidate_id);
        if (found.length) {
          c.epistemic.unresolved.push({
            /* Not `field: 'duplicate_candidate_ids'` — that field is
               populated, and naming it would assert an absence that
               is not there. What is open is a decision about the
               record as a whole. */
            field: null,
            question: 'Which of these candidates is the one to keep?',
            missing: `A decision. ${found.map((d) => `${d.candidate_id} (${d.basis})`).join('; ')}. This Scout names duplicates and does not choose between them.`,
            absence_kind: 'null_not_researched',
            blocks: false,
          });
        }
        this.#ship(run, c);
      }

      const blocked = gaps.filter((g) => /refused before it reached the origin/.test(g.why_open));
      this.#observe(run, {
        subject: 'run',
        summary: `${candidates.length} candidate(s), ${gaps.length} gap(s), ${screened_out} document(s) screened out, over ${fetched} retrieval attempt(s).`,
        data: {
          candidates: candidates.length, gaps: gaps.length, screened_out, fetched,
          blocked_by_egress_policy: blocked.length, mode: this.simulated ? 'mock' : 'live',
        },
        confidence: 1,
        risk: gaps.length ? 'medium' : 'low',
        facts: [`${fetched} retrieval(s) were attempted; ${gaps.length} did not return a document.`],
        unresolved: blocked.length ? [{
          field: null,
          question: 'What is published at the endpoints that could not be reached?',
          missing: `${blocked.length} endpoint(s) or document(s) were refused before reaching the origin. Nothing is known about them from this run.`,
          absence_kind: 'null_not_researched',
          blocks: false,
        }] : [],
      });

      const ended_at = this.#now();
      const runRecord = this.#envelope('AgentRun', run, {
        run_id: run.span_id,
        parent_run_id: run.parent_run_id,
        task,
        started_at,
        ended_at,
        status: 'ok',
        inputs: { endpoints: this.endpoints.map((e) => e.id), mode: this.simulated ? 'mock' : 'live' },
        outputs: { candidates: candidates.length, gaps: gaps.length, screened_out },
        produced: [
          ...candidates.map((c) => ({ contract: 'SourceCandidate', id: c.candidate_id })),
          ...gaps.map((g) => ({ contract: 'DataGap', id: g.gap_id })),
        ],
        /* A read-only discovery run changes nothing, so it is green
           tier and affects no entity. What the run is ABOUT lives on
           the candidates it produced; affected_entities here would
           claim it touched them, and it did not. */
        autonomy_class: 'autonomous',
        confidence: candidates.length ? 0.7 : 0.4,
        risk: 'low',
        handed_off_to: [],
        affected_entities: [],
        evidence: [{
          evidence_id: 'ev-run',
          kind: 'measurement',
          source_id: null, url: null, locator: 'this run', title: null, publisher: null,
          quote: null, retrieved_at: ended_at, checksum: null,
          supports: 'supports:direct', role: 'primary', simulated: this.simulated,
        }],
        epistemic: {
          fact: [{ field: null, statement: `The run began at ${started_at} and finished at ${ended_at}, attempting ${fetched} retrieval(s).`, evidence_refs: ['ev-run'] }],
          inference: [], interpretation: [],
          unresolved: gaps.length ? [{
            field: null,
            question: 'Is the candidate set complete?',
            missing: `It is not. ${gaps.length} retrieval(s) failed, and this run says nothing about what they would have contained.`,
            absence_kind: 'null_not_researched',
            blocks: false,
          }] : [],
        },
      });
      this.#ship(run, runRecord);

      run.end({ status: 'ok', outputs: { candidates: candidates.length, gaps: gaps.length }, confidence: 0.7, risk: 'low' });
      return { run_id: run.span_id, trace_id: run.trace_id, candidates, gaps, screened_out, fetched, blocked: blocked.length };
    } catch (err) {
      run.error(err, { fatal: true });
      run.end({ status: 'failed' });
      throw err;
    }
  }
}

function safeHost(url) {
  try { return new URL(url).hostname; } catch { return 'the host'; }
}
