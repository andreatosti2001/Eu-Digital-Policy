/* ============================================================
   agent/health/knowledge.mjs — KNOWLEDGE / CONTENT HEALTH

   The ten SESSION 20 names. This is the domain where a failure is
   not a broken page but a reader told something false about EU law,
   and it is why the three domains are never summed: a fix repairs a
   broken link, and nothing repairs a decision somebody already took.

   THREE OF THESE TEN ARE `not_a_score`, AND THAT IS THE POINT.

   `unresolved_claims`, `verification_gaps` and `provenance_gaps`
   count the 106 unverified records and the ten reference gaps in the
   running text. Those numbers are the project's honesty
   (`docs/AI-SAFE-BOUNDARIES.md` §0.7), and the ONLY legitimate way to
   move them is verification work this monitor cannot see or do.
   Every other route down is a prohibited action:

     · clearing requires_verification without reading the source;
     · attaching a loosely related source to close a gap;
     · bulk-stamping last_verified;
     · deleting or shortening the unverified report.

   An agent shown these as "defects to reduce" would find one of
   those four routes, because they are cheap and the honest route is
   expensive. So the model refuses to let them be labelled
   lower_is_better, `NOT_A_SCORE_METRICS` names them, and the suite
   asserts nobody has quietly re-labelled one.

   A RISE IN THESE THREE IS OFTEN GOOD NEWS. It usually means
   somebody looked at a record nobody had looked at before and found
   it wanting, which is the corpus getting more honest rather than
   less healthy. `interpretation` on each says so.
   ============================================================ */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineMetric, measured, unmeasurable } from './model.mjs';
import {
  claimsOf, sourcesOf, instrumentsOf, relationshipsOf, institutionsOf,
  enforcementOf, timelineOf, glossaryOf, rulesOf,
} from './gather.mjs';

/** A claim's evidence is only as good as what it is allowed to
 *  support. `supports:context` is NOT a citation — the source policy
 *  says so, and the site's own grading derives from it. */
const CITES = (s) => s.supports === 'supports:direct' || s.supports === 'supports:partial';

/** The self-reference placeholder. A claim resting only on this is
 *  by definition unverified and the dataset says so in its own note. */
const SELF_SOURCE = 'src-brief-original';

const ARGUMENT_TYPES = ['claim-type:interpretation', 'claim-type:critique', 'claim-type:prediction'];

export const KNOWLEDGE_METRICS = [

  defineMetric({
    id: 'knowledge.evidence_coverage',
    name: 'Evidence coverage',
    domain: 'knowledge',
    definition: 'The share of claims carrying at least one EXTERNAL source that directly or partially supports them — excluding supports:context, which is not a citation, and excluding the self-reference placeholder src-brief-original.',
    source: 'data/claims.json, data/sources.json',
    calculation: 'claims where sources[] contains an entry whose supports is supports:direct or supports:partial AND whose source_id is not src-brief-original, divided by all claims. Reported as a percentage with the numerator and denominator both stated.',
    frequency: 'per_commit',
    interpretation: 'A FALL means claims were added faster than sources were found for them, which is the corpus outrunning its evidence. A RISE means verification work happened — but only if the sources are real, and this metric cannot check that. It counts the SHAPE of an attachment, not whether the document says what the claim says it says.',
    limitations: 'It cannot open a source. supports:direct is a stored qualifier an author typed, and a wrongly-typed one is invisible here — SOURCE-POLICY.md §2 governs it and no validator enforces it. It also cannot distinguish a tier:1 primary source from a tier:4 commentary; the tier→grade map in js/format.js does that at render time and this metric deliberately does not duplicate it.',
    visibility: 'public',
    direction: 'higher_is_better',
    measure(ctx) {
      const claims = claimsOf(ctx);
      if (!claims.length) return unmeasurable('data/claims.json did not parse or holds no claims', 'a readable data/claims.json');
      const covered = claims.filter((c) => (c.sources ?? []).some((s) => CITES(s) && s.source_id !== SELF_SOURCE));
      const selfOnly = claims.filter((c) => (c.sources ?? []).length > 0 && (c.sources ?? []).every((s) => s.source_id === SELF_SOURCE));
      return measured(Math.round((covered.length / claims.length) * 1000) / 10, {
        unit: 'percent',
        of: claims.length,
        detail: {
          covered: covered.length,
          total: claims.length,
          self_reference_only: selfOnly.length,
          no_sources_at_all: claims.filter((c) => !(c.sources ?? []).length).length,
          context_only: claims.filter((c) => (c.sources ?? []).length && !(c.sources ?? []).some(CITES)).length,
        },
        evidence: ['data/claims.json'],
      });
    },
  }),

  defineMetric({
    id: 'knowledge.unresolved_claims',
    name: 'Unresolved claims',
    domain: 'knowledge',
    definition: 'Records the corpus itself declares unverified: the UNVERIFIED / REQUIRES VERIFICATION total tools/validate.mjs reports across ALL ten datasets — claims, enforcement, competences, provisions, timeline events, applicability rules, glossary terms, instruments, relationships, sources and transpositions.',
    source: 'node tools/validate.mjs (canonical), cross-checked against a direct count over data/claims.json and data/enforcement.json',
    calculation: 'The UNVERIFIED / REQUIRES VERIFICATION total from validate.mjs. A SECOND, NARROWER count is computed directly over claims and enforcement only and reported beside it — the two cover different populations on purpose, and stating both is what stops a reader taking the smaller number for the whole.',
    frequency: 'per_commit',
    interpretation: 'THIS IS NOT A DEFECT COUNT AND MUST NOT BE OPTIMISED. It is the project stating what it has not established, and AI-SAFE-BOUNDARIES §0.7 makes softening it a prohibited action. A RISE usually means somebody examined a record nobody had examined and found it wanting — the corpus getting MORE honest. A FALL is only good news if genuine verification work produced it, and this metric cannot tell that from a bulk-stamped last_verified, an attached-but-unrelated source, or a deleted note. Read the commit, not the number.',
    limitations: 'It counts records that ADMIT to being unverified. It cannot count records that are wrong and do not say so — a false statement with a confident note and a plausible source is invisible to it, and to every validator in this repository. The validators do not read prose.',
    visibility: 'public',
    direction: 'not_a_score',
    measure(ctx) {
      const claims = claimsOf(ctx);
      const enf = enforcementOf(ctx);
      const direct = claims.filter((c) => c.verification_note || c.requires_verification || c.reference_gap).length
        + enf.filter((e) => e.verification_note || e.requires_verification).length;
      const excerpt = `${(ctx.validators?.checks ?? []).find((c) => c.name === 'tools/validate.mjs')?.output_excerpt ?? ''}`;
      const fromValidator = Number((excerpt.match(/UNVERIFIED[^\d]*(\d+)/) ?? [])[1] ?? NaN);
      const recorded = ctx.baseline?.unverified ?? null;

      if (Number.isNaN(fromValidator)) {
        /* The narrower count, clearly labelled as narrower. Reporting
           it as if it were the whole would understate the corpus's
           own declared uncertainty, which is the one direction this
           number must never be wrong in. */
        return measured(direct, {
          unit: 'records (claims and enforcement ONLY)',
          detail: {
            scope: 'PARTIAL. tools/validate.mjs did not run in this gathering, so this counts claims and enforcement only. The canonical total also covers competences, provisions, timeline events, applicability rules, glossary terms, instruments, relationships, sources and transpositions, and is LARGER.',
            recorded_baseline: recorded,
            claims_with_verification_note: claims.filter((c) => c.verification_note).length,
            claims_with_reference_gap: claims.filter((c) => c.reference_gap).length,
            enforcement_requiring_verification: enf.filter((e) => e.requires_verification).length,
          },
          evidence: ['data/claims.json', 'data/enforcement.json'],
        });
      }

      return measured(fromValidator, {
        unit: 'records',
        detail: {
          claims_and_enforcement_only: direct,
          claims_with_verification_note: claims.filter((c) => c.verification_note).length,
          claims_with_reference_gap: claims.filter((c) => c.reference_gap).length,
          enforcement_requiring_verification: enf.filter((e) => e.requires_verification).length,
          recorded_baseline: recorded,
          /* Two counts over two populations. Naming the difference is
             the point: a reader who saw only the smaller number would
             think the corpus declared less uncertainty than it does. */
          scope_note: `validate.mjs counts ${fromValidator} across all ten datasets; a direct count over claims and enforcement alone finds ${direct}. The difference is competences, provisions, timeline events, applicability rules, glossary terms, instruments, relationships, sources and transpositions.`,
          movement_against_baseline: recorded === null ? null
            : fromValidator === recorded ? `unchanged from the ${recorded} recorded in docs/CURRENT-ARCHITECTURE.md §12`
              : `MOVED: ${recorded} recorded in §12, ${fromValidator} now. Neither direction is automatically good — read the commit that moved it, not the number.`,
        },
        evidence: ['data/claims.json', 'data/enforcement.json', 'node tools/validate.mjs'],
      });
    },
  }),

  defineMetric({
    id: 'knowledge.stale_sources',
    name: 'Stale sources',
    domain: 'knowledge',
    definition: 'Records whose last_verified date is older than the interval their own dataset states, plus sources whose url_status has never been established by a retrieval.',
    source: 'node tools/freshness.mjs, and data/sources.json',
    calculation: 'Records past their stated interval as freshness.mjs computes it, plus a direct count of sources whose url_status is a stored value rather than a measured one.',
    frequency: 'per_commit',
    interpretation: 'A rise means the corpus is ageing relative to what it claims about its own currency. The second half of the count is the one that matters more: url_status is a FIELD SOMEBODY TYPED, and treating it as evidence a link works is the failure docs/AGENT-ROLES.md §3 names by name.',
    limitations: 'freshness.mjs prints a SOURCE REACHABILITY heading and performs NO NETWORK I/O — no URL in this repository has ever been fetched (AUDIT F-12). Its exit code 0 is also not evidence of currency: it reported "nothing past its stated interval" while the newest enforcement decision was 38 days old against a 45-day interval. This metric therefore reports what freshness.mjs says AND what it cannot say.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) {
      const srcs = sourcesOf(ctx);
      const c = (ctx.validators?.checks ?? []).find((x) => x.name === 'tools/freshness.mjs');
      const neverFetched = srcs.filter((s) => s.url && s.url_status && s.url_status !== 'url:none');
      const past = c ? (`${c.output_excerpt}`.match(/past its stated interval/i) && !/Nothing past/i.test(`${c.output_excerpt}`) ? 1 : 0) : null;
      return measured(neverFetched.length, {
        unit: 'sources with an unverified url_status',
        of: srcs.length,
        detail: {
          freshness_says: c ? (/Nothing past/i.test(`${c.output_excerpt}`) ? 'nothing past its stated interval' : 'something is past its stated interval') : 'the validators were not run',
          freshness_past_interval: past,
          sources_with_a_url: srcs.filter((s) => s.url).length,
          sources_never_fetched: neverFetched.length,
          note: 'url_status is a STORED FIELD. Nothing in this repository has ever fetched a URL (AUDIT F-12), so every one of these is unverified by measurement whatever the field says.',
        },
        evidence: ['data/sources.json', 'node tools/freshness.mjs'],
      });
    },
  }),

  defineMetric({
    id: 'knowledge.duplicate_facts',
    name: 'Duplicate facts',
    domain: 'knowledge',
    definition: 'Facts stored in more than one place, where the two copies can disagree and no generator or drift check keeps them together.',
    source: 'index.html (the inlined window.__CONTENT__ blob), data/brief.json, and docs/DATA-GOVERNANCE.md §5\'s list of known second homes',
    calculation: 'The part titles and the standfirst are compared between data/brief.json and the __CONTENT__ blob inlined in index.html. Each disagreement is one duplicate fact that has already drifted; each agreeing pair is a second home that has not drifted YET and is still counted, because the hazard is the second copy and not the disagreement.',
    frequency: 'per_commit',
    interpretation: 'Above 0 means two copies of a fact exist and nothing checks that they match. AGENTS.md carries this as a known hazard: index.html inlines a ~59.8 KB blob duplicating data/brief.json, nothing loads brief.json at runtime, no validator compares the two, and meta.standfirst HAS ALREADY DRIFTED. A rise means a new second home was created; a fall means one was removed or a generator was added.',
    limitations: 'It compares the part titles and the standfirst only — the fields whose drift is already established. The blob also holds the prose and a search index, and a prose-level comparison is not attempted here because the two are not stored in comparable form. This metric therefore UNDERSTATES: it is a floor on the duplication, not a measurement of it.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) {
      const brief = ctx.data.brief;
      if (!brief) return unmeasurable('data/brief.json did not parse', 'a readable data/brief.json');
      let html;
      try { html = readFileSync(join(ctx.root, 'index.html'), 'utf8'); }
      catch { return unmeasurable('index.html could not be read', 'a readable index.html'); }

      /* The blob is one long assignment on a single line, ending at
         </script>. A lazy regex for a balanced object does not work
         on 59.8 KB of nested JSON — the first draft of this metric
         used one, failed to match, and reported "could not be
         located", which is a worse answer than the real one. Slice
         to the closing tag and parse. */
      const at = html.indexOf('window.__CONTENT__');
      if (at === -1) {
        return measured(1, {
          unit: 'second homes',
          detail: { note: 'no window.__CONTENT__ assignment is in index.html. If the blob was removed, this metric should be rewritten; it is reported as one second home rather than zero, because a failure to find it does not disprove duplication.' },
          evidence: ['index.html'],
        });
      }
      const rest = html.slice(html.indexOf('=', at) + 1);
      const raw = rest.slice(0, rest.indexOf('</script>')).trim().replace(/;+$/, '');

      let blob = null;
      let parseError = null;
      try { blob = JSON.parse(raw); } catch (e) { parseError = e.message; }

      const parts = brief.parts ?? [];
      const disagreements = [];
      if (blob) {
        /* The blob calls them `nav`; data/brief.json calls them
           `parts`. Same fourteen ids, same titles — which is exactly
           what makes them two homes for one fact. */
        const blobParts = blob.nav ?? blob.parts ?? [];
        for (const p of parts) {
          const other = blobParts.find?.((q) => q.id === p.id);
          if (!other) { disagreements.push({ field: `parts[${p.id}]`, brief_json: p.title, inlined: null, kind: 'missing from the inlined copy' }); continue; }
          if (other.title && p.title && other.title !== p.title) {
            disagreements.push({ field: `parts[${p.id}].title`, brief_json: p.title, inlined: other.title, kind: 'the two copies disagree' });
          }
        }
        const bs = brief.meta?.standfirst;
        const is_ = blob.meta?.standfirst;
        if (bs && is_ && bs !== is_) {
          disagreements.push({ field: 'meta.standfirst', brief_json: `${bs}`.slice(0, 110), inlined: `${is_}`.slice(0, 110), kind: 'the two copies disagree — this is the drift AGENTS.md records as already having happened' });
        }
      }

      /* Every part title plus the standfirst exists twice. The count
         is the SECOND HOMES, not the disagreements — the hazard is
         the duplication, and a pair that agrees today is a pair
         nothing keeps agreeing tomorrow. */
      const secondHomes = parts.length + (brief.meta?.standfirst ? 1 : 0);
      return measured(secondHomes, {
        unit: 'facts stored in two places with no drift check',
        detail: {
          part_titles_duplicated: parts.length,
          standfirst_duplicated: Boolean(brief.meta?.standfirst),
          already_drifted: disagreements.length,
          disagreements,
          blob_parsed: Boolean(blob),
          blob_parse_error: parseError,
          blob_bytes: raw.length,
          note: 'Nothing loads data/brief.json at runtime and no validator compares it to the inlined blob. See AGENTS.md, "The __CONTENT__ bypass", and docs/CURRENT-ARCHITECTURE.md §8.',
        },
        evidence: ['index.html', 'data/brief.json'],
      });
    },
  }),

  defineMetric({
    id: 'knowledge.missing_relationships',
    name: 'Missing relationships',
    domain: 'knowledge',
    definition: 'Entities that should be connected to the graph and are not: instruments in no relationship edge, claims attached to no instrument, provision or institution, glossary terms reachable from nothing, and timeline events belonging to no instrument.',
    source: 'data/instruments.json (instruments and relationships), data/claims.json, data/glossary.json, data/timeline.json',
    calculation: 'Four disjoint counts, summed, each also reported separately so the total is never the only thing on offer.',
    frequency: 'per_commit',
    interpretation: 'A knowledge graph is only as good as its edges. An instrument in no relationship is an instrument the comparison views cannot situate; a claim attached to nothing is an assertion the site can render but not trace to what it is about. A rise means new records were added without wiring them in.',
    limitations: 'It cannot tell a MISSING relationship from one that correctly does not exist — tfeu is a treaty and belongs in few instrument-to-instrument edges, and a claim about the rulebook as a whole legitimately attaches to several instruments and no provision. This is a count of candidates for attention, NOT a defect count, and it is labelled lower_is_better only because the current population is genuinely under-connected rather than because 0 is the target.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) {
      const instruments = instrumentsOf(ctx);
      const rels = relationshipsOf(ctx);
      const claims = claimsOf(ctx);
      const terms = glossaryOf(ctx);
      const events = timelineOf(ctx);

      const inEdge = new Set(rels.flatMap((r) => [r.from, r.to]));
      const orphanInstruments = instruments.filter((i) => !inEdge.has(i.id)).map((i) => i.id);
      const orphanClaims = claims.filter((c) => !(c.instruments ?? []).length && !(c.provisions ?? []).length && !(c.institutions ?? []).length && !(c.enforcement ?? []).length).map((c) => c.id);
      const orphanTerms = terms.filter((t) => !(t.instruments ?? []).length && !(t.provisions ?? []).length).map((t) => t.id ?? t.term);
      const orphanEvents = events.filter((e) => !e.instrument && !(e.instruments ?? []).length).map((e) => e.id);

      return measured(orphanInstruments.length + orphanClaims.length + orphanTerms.length + orphanEvents.length, {
        unit: 'entities with no edge',
        detail: {
          instruments_in_no_relationship: orphanInstruments,
          claims_attached_to_nothing: orphanClaims.slice(0, 12),
          claims_attached_to_nothing_total: orphanClaims.length,
          glossary_terms_with_no_anchor: orphanTerms,
          timeline_events_with_no_instrument: orphanEvents.slice(0, 12),
          timeline_events_with_no_instrument_total: orphanEvents.length,
        },
        evidence: ['data/instruments.json', 'data/claims.json', 'data/glossary.json', 'data/timeline.json'],
      });
    },
  }),

  defineMetric({
    id: 'knowledge.incomplete_entities',
    name: 'Incomplete entities',
    domain: 'knowledge',
    definition: 'Records missing a field the site renders: an instrument with no celex or no legislative_status, a source with neither url nor a stated resolution, an institution with no competences, an enforcement action with no authority or no legal_basis.',
    source: 'data/instruments.json, data/sources.json, data/institutions.json, data/enforcement.json',
    calculation: 'Per-dataset counts of records missing at least one of the named fields, summed, with each dataset reported separately.',
    frequency: 'per_commit',
    interpretation: 'Above 0 means a view will render a gap. It is distinct from an unresolved claim: an incomplete entity is a field nobody filled, whereas an unresolved claim is a field somebody filled and then said they could not stand behind.',
    limitations: 'A missing field is not always a defect. A source with url_status "url:none" has NO url on purpose, and the record says so in resolution — those are excluded. But a null that means "not researched" and a null that means "researched and not determinable" are indistinguishable in most of these datasets, and AI-SAFE-BOUNDARIES §0.3 says they are different states. This metric cannot tell them apart and therefore OVERSTATES incompleteness wherever a null is a deliberate unknown.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) {
      const instruments = instrumentsOf(ctx);
      const srcs = sourcesOf(ctx);
      const insts = institutionsOf(ctx);
      const enf = enforcementOf(ctx);

      const noCelex = instruments.filter((i) => !i.celex).map((i) => i.id);
      const noStatus = instruments.filter((i) => !i.legislative_status).map((i) => i.id);
      const srcNoUrl = srcs.filter((s) => !s.url && !s.resolution).map((s) => s.id);
      const instNoComp = insts.filter((i) => !(i.competences ?? []).length).map((i) => i.id);
      const enfNoAuthority = enf.filter((e) => !e.authority).map((e) => e.id);
      const enfNoBasis = enf.filter((e) => !(e.legal_basis ?? []).length).map((e) => e.id);

      const total = noCelex.length + noStatus.length + srcNoUrl.length + instNoComp.length + enfNoAuthority.length + enfNoBasis.length;
      return measured(total, {
        unit: 'missing fields',
        detail: {
          instruments_without_celex: noCelex,
          instruments_without_legislative_status: noStatus,
          sources_without_url_or_resolution: srcNoUrl,
          institutions_without_competences: instNoComp,
          enforcement_without_authority: enfNoAuthority,
          enforcement_without_legal_basis: enfNoBasis,
          note: 'a null that means "not researched" and one that means "researched and not determinable" are indistinguishable here. AI-SAFE-BOUNDARIES §0.3 says they are different states; this count treats both as missing and therefore overstates.',
        },
        evidence: ['data/instruments.json', 'data/sources.json', 'data/institutions.json', 'data/enforcement.json'],
      });
    },
  }),

  defineMetric({
    id: 'knowledge.provenance_gaps',
    name: 'Provenance gaps',
    domain: 'knowledge',
    definition: 'Statements whose evidence chain is admitted to be incomplete: claims carrying a reference_gap, claims resting only on the self-reference placeholder, and claims with no source at all.',
    source: 'data/claims.json, data/sources.json',
    calculation: 'Claims with reference_gap set, plus claims whose only source_id is src-brief-original, plus claims with an empty sources[]. Reported as three separate counts and a total.',
    frequency: 'per_commit',
    interpretation: 'NOT A DEFECT COUNT AND NOT TO BE OPTIMISED. An asterisk in the running text means THE REFERENCE IS MISSING, not that the statement is doubted, and AI-SAFE-BOUNDARIES §0.2 is explicit that it is removed by finding the publication the brief was pointing at — never by attaching something related. A fall produced by attaching a plausible substitute is worse than the gap, because it LOOKS resolved. A rise usually means somebody checked a claim they had not checked before.',
    limitations: 'It counts admitted gaps. A claim with a confident-looking source that does not actually say what the claim says is a provenance gap this metric cannot see, and neither can any validator here: nothing in this repository has opened a source document.',
    visibility: 'public',
    direction: 'not_a_score',
    measure(ctx) {
      const claims = claimsOf(ctx);
      if (!claims.length) return unmeasurable('data/claims.json did not parse or holds no claims', 'a readable data/claims.json');
      const gaps = claims.filter((c) => c.reference_gap);
      const selfOnly = claims.filter((c) => (c.sources ?? []).length > 0 && (c.sources ?? []).every((s) => s.source_id === SELF_SOURCE));
      const none = claims.filter((c) => !(c.sources ?? []).length);
      const ids = new Set([...gaps, ...selfOnly, ...none].map((c) => c.id));
      return measured(ids.size, {
        unit: 'claims',
        of: claims.length,
        detail: {
          reference_gap: gaps.map((c) => c.id),
          self_reference_only: selfOnly.map((c) => c.id).slice(0, 20),
          self_reference_only_total: selfOnly.length,
          no_source_at_all: none.map((c) => c.id),
          note: 'An asterisk means the reference is missing, not that the statement is doubted. It is removed by finding the publication — never by attaching something related.',
        },
        evidence: ['data/claims.json'],
      });
    },
  }),

  defineMetric({
    id: 'knowledge.verification_gaps',
    name: 'Verification gaps',
    domain: 'knowledge',
    definition: 'Records that have never been checked against a source, or whose check is recorded without a date: claims and enforcement actions with no last_verified, and records whose last_verified predates their own published date.',
    source: 'data/claims.json, data/enforcement.json, data/instruments.json, data/institutions.json',
    calculation: 'Records with a null or absent last_verified, plus records where last_verified is earlier than published — which means the record was checked before the thing it describes existed.',
    frequency: 'per_commit',
    interpretation: 'NOT A DEFECT COUNT AND NOT TO BE OPTIMISED. Setting last_verified on a record nobody read is prohibited under every autonomy class (AUTONOMY-POLICY, prohibited action 2), and bulk-stamping it is prohibited action 3. A fall in this number without a corresponding source having been opened is the failure this metric exists to make visible, not the improvement it looks like.',
    limitations: 'last_verified is a stored date. It records that somebody SAID they checked, not that they did, and nothing in this repository can distinguish the two. The second half — verified-before-published — catches only the arithmetically impossible case.',
    visibility: 'public',
    direction: 'not_a_score',
    measure(ctx) {
      const rows = [
        ...claimsOf(ctx).map((r) => ({ ...r, _kind: 'claim' })),
        ...enforcementOf(ctx).map((r) => ({ ...r, _kind: 'enforcement' })),
        ...instrumentsOf(ctx).map((r) => ({ ...r, _kind: 'instrument' })),
        ...institutionsOf(ctx).map((r) => ({ ...r, _kind: 'institution' })),
      ];
      if (!rows.length) return unmeasurable('no dataset parsed', 'readable datasets under data/');
      const never = rows.filter((r) => !r.last_verified);
      const impossible = rows.filter((r) => r.last_verified && r.published && r.last_verified < r.published);
      return measured(never.length + impossible.length, {
        unit: 'records',
        of: rows.length,
        detail: {
          never_verified: never.map((r) => `${r._kind}:${r.id}`).slice(0, 20),
          never_verified_total: never.length,
          verified_before_published: impossible.map((r) => `${r._kind}:${r.id} (verified ${r.last_verified}, published ${r.published})`),
          note: 'last_verified records that somebody SAID they checked. Nothing here can distinguish that from having checked.',
        },
        evidence: ['data/claims.json', 'data/enforcement.json', 'data/instruments.json', 'data/institutions.json'],
      });
    },
  }),

  defineMetric({
    id: 'knowledge.contradictory_records',
    name: 'Contradictory records',
    domain: 'knowledge',
    definition: 'Records that assert incompatible things: a relationship kind stored as both symmetric and asymmetric, a relationship whose reverse edge disagrees about symmetry, and an instrument whose transposition state contradicts its legislative status.',
    source: 'data/instruments.json (relationships), data/taxonomy.json',
    calculation: 'For each relationship_kind, the set of distinct symmetric values across the edges that use it — more than one value is a contradiction. Plus edges whose reverse is present with a different symmetric flag.',
    frequency: 'per_commit',
    interpretation: 'Above 0 means the corpus disagrees with itself, and a renderer will pick one answer without knowing there was a choice. docs/HANDOVER.md issue 18 is exactly this: rel-kind:complement is stored as both symmetric and asymmetric, and it has been the cheapest real decision on the list for five sessions — one field, five records, one word.',
    limitations: 'It detects STRUCTURAL contradictions between stored values. It cannot detect a contradiction between two prose statements, or between a claim and the source it cites, or between the markup and data/claims.json about what a passage is — handover issue 20, which remains open and is invisible here.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) {
      const rels = relationshipsOf(ctx);
      if (!rels.length) return unmeasurable('data/instruments.json holds no relationships', 'a readable data/instruments.json');
      const byKind = {};
      for (const r of rels) (byKind[r.kind] ??= new Set()).add(r.symmetric === true);
      const inconsistentKinds = Object.entries(byKind)
        .filter(([, set]) => set.size > 1)
        .map(([kind]) => ({ kind, edges: rels.filter((r) => r.kind === kind).map((r) => ({ id: r.id, symmetric: r.symmetric === true })) }));

      const pairDisagreements = [];
      for (const r of rels) {
        const rev = rels.find((q) => q.from === r.to && q.to === r.from && q.kind === r.kind && q.id !== r.id);
        if (rev && (rev.symmetric === true) !== (r.symmetric === true)) {
          pairDisagreements.push({ a: r.id, b: rev.id, kind: r.kind });
        }
      }

      return measured(inconsistentKinds.length + pairDisagreements.length, {
        unit: 'contradictions',
        detail: {
          relationship_kinds_stored_both_ways: inconsistentKinds,
          reverse_edges_disagreeing: pairDisagreements,
          note: 'handover issue 18. Structural only: a contradiction between two prose statements, or between a claim and the source it cites, is invisible here.',
        },
        evidence: ['data/instruments.json'],
      });
    },
  }),

  defineMetric({
    id: 'knowledge.unsupported_factual_statements',
    name: 'Unsupported factual statements',
    domain: 'knowledge',
    definition: 'Claims typed as FACT whose evidence cannot carry a fact: no source, only supports:context, or only the self-reference placeholder.',
    source: 'data/claims.json, data/taxonomy.json (claim_type)',
    calculation: 'Claims whose type is a fact-family claim_type and which have no source entry with supports:direct or supports:partial pointing at anything other than src-brief-original.',
    frequency: 'per_commit',
    interpretation: 'This is the single highest-consequence number in this domain. A claim TYPED as a fact renders as law on the site; one whose evidence is context or self-reference is a statement about EU law resting on nothing a reader could check. Argument-family claims — interpretation, critique, prediction — are excluded deliberately: they are not gradeable by sourcing, and the Knowledge Architect role exists partly to keep that boundary.',
    limitations: 'It checks the SHAPE of the evidence, not what the source says. A claim typed as a fact with a tier:1 primary source that does not actually support it passes this check and is exactly as wrong. Nothing in this repository has opened a source document; agent/verifier/ is the role that would, and it produces proposals rather than checks.',
    visibility: 'public',
    direction: 'lower_is_better',
    measure(ctx) {
      const claims = claimsOf(ctx);
      if (!claims.length) return unmeasurable('data/claims.json did not parse or holds no claims', 'a readable data/claims.json');
      const facts = claims.filter((c) => !ARGUMENT_TYPES.includes(c.type));
      const unsupported = facts.filter((c) => !(c.sources ?? []).some((s) => CITES(s) && s.source_id !== SELF_SOURCE));
      return measured(unsupported.length, {
        unit: 'fact-typed claims',
        of: facts.length,
        detail: {
          fact_typed_claims: facts.length,
          argument_typed_excluded: claims.length - facts.length,
          unsupported: unsupported.map((c) => ({ id: c.id, type: c.type, sources: (c.sources ?? []).map((s) => `${s.source_id}/${s.supports}`) })).slice(0, 20),
          unsupported_total: unsupported.length,
        },
        evidence: ['data/claims.json'],
      });
    },
  }),

];
