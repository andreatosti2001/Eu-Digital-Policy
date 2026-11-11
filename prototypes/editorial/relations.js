/* ============================================================
   PV2-03 · the relationships between instruments, as a NON-interactive
   table (roadmap §8, 11 Nov 2026: the Editorial has no Regulatory Network
   Explorer and shows the same relationships this way).

   Read in place from the `relationships` array of data/instruments.json,
   through js/data.js's index (ix.relationship). Rules, docs/POST-V2.md §3 D:
   - the type is the `kind` field, shown with the taxonomy's label;
   - a direction from → to is shown ONLY where `symmetric` is false;
   - an absent or empty field (claims, provisions, sources, verification) is
     "not recorded" — never "verified", never "none", never blank;
   - an instrument with no relationship stays in the list and says so.
   No sorting, no filtering, no canvas: column headers with scope, a
   row-group header per instrument, readable by keyboard and at 390 px.
   Explicit ARIA table roles: below 52rem the table is stacked with
   display:block, which can cost a table its semantics in some browsers.
   ============================================================ */

import { esc, has, notRecorded, tag, label, F, instrumentLink, instrumentName, provisionText, sourceShort } from './common.js';

const COLS = ['With', 'Type', 'Direction', 'What the record says', 'Provisions', 'Claims and sources', 'Verification'];

function direction(ix, r) {
  if (r.symmetric === true) return 'Mutual — no direction';
  if (r.symmetric === false) return `${esc(instrumentName(ix, r.from) || r.from)} → ${esc(instrumentName(ix, r.to) || r.to)}`;
  return notRecorded('direction not recorded');
}

function verification(r) {
  const when = r.last_verified ? `<br><span class="meta">last verified ${esc(F.humanDate(r.last_verified))}</span>` : '';
  if (r.requires_verification === true) return tag('Requires verification', 'warn') + when;
  if (r.requires_verification === false) {
    return (r.verification_note ? tag('Checked', 'ok') : tag('Checked, no note', 'warn')) + when;
  }
  return notRecorded('verification not recorded') + when;
}

function evidence(ix, r) {
  const claims = has(r.claims)
    ? `${esc(F.plural(r.claims.length, 'claim'))}`
    : notRecorded('claims not recorded');
  const sources = has(r.sources)
    ? '<ul class="plain">' + r.sources.map((s) => `<li>${sourceShort(ix, s)}</li>`).join('') + '</ul>'
    : notRecorded('sources not recorded');
  return claims + '<br>' + sources;
}

function row(ix, r, self) {
  const other = r.from === self ? r.to : r.from;
  const cells = [
    instrumentLink(ix, other),
    r.kind ? esc(label(ix, r.kind)) : notRecorded('type not recorded'),
    direction(ix, r),
    r.summary ? esc(r.summary) : notRecorded('summary not recorded'),
    has(r.provisions) ? r.provisions.map((p) => provisionText(ix, p)).join('; ') : notRecorded('provisions not recorded'),
    evidence(ix, r),
    verification(r),
  ];
  return '<tr role="row">' + cells.map((c, i) => `<td role="cell" data-label="${esc(COLS[i])}"${i === 3 ? ' class="sum"' : ''}><div>${c}</div></td>`).join('') + '</tr>';
}

const touching = (ix, id) => ix.relationship.filter((r) => r.from === id || r.to === id);

function group(ix, inst, withHeader) {
  const rels = touching(ix, inst.id);
  const head = withHeader
    ? `<tr role="row"><th role="rowheader" scope="rowgroup" colspan="${COLS.length}">${esc(inst.short_name)} <span class="meta">${rels.length ? esc(F.plural(rels.length, 'relationship')) : ''}</span></th></tr>`
    : '';
  const body = rels.length
    ? rels.map((r) => row(ix, r, inst.id)).join('')
    : `<tr role="row"><td role="cell" colspan="${COLS.length}" data-label="">${notRecorded('no relationship recorded')}</td></tr>`;
  return `<tbody role="rowgroup">${head}${body}</tbody>`;
}

/** The full table, every instrument (a relationship appears under each of the
 *  two instruments it joins), or one instrument's rows. */
export function relationsTable(ix, { only } = {}) {
  const all = [...new Set(ix.instrument.values())].sort((a, b) => a.short_name.localeCompare(b.short_name));
  const list = only ? all.filter((i) => i.id === only) : all;
  const caption = only
    ? `Relationships recorded for ${esc(list[0] ? list[0].short_name : only)} in <code>data/instruments.json</code>.`
    : `All ${esc(F.plural(ix.relationship.length, 'relationship'))} recorded between ${esc(F.plural(all.length, 'instrument'))} in <code>data/instruments.json</code>, grouped by instrument; a relationship appears under both instruments it joins. A fixed table: it is not sorted or filtered.`;
  return `<div class="tablewrap"><table class="rel" role="table"><caption>${caption}</caption>` +
    `<thead role="rowgroup"><tr role="row">${COLS.map((c) => `<th role="columnheader" scope="col">${c}</th>`).join('')}</tr></thead>` +
    list.map((i) => group(ix, i, !only)).join('') +
    '</table></div>';
}
