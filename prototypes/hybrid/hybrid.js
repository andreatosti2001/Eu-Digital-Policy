/* PV2-05 · what every Hybrid page loads first, before its view module.

   The Hybrid reuses whole view modules rather than rewriting them (one
   home): the article is the Editorial's (../editorial/article.js, direction
   1's reading column) and the regulation page and the timeline mode are the
   observatory's (../observatory/regulation.js and timeline.js, direction
   2's table-first layout). Those modules name their own prototype in the
   document title; this module renames it, and does nothing else. It reads
   no data and writes nothing. */

const fix = () => {
  const t = document.title;
  const n = t.replace(/\b(Editorial|Observatory) prototype\b/, 'Hybrid prototype');
  if (n !== t) document.title = n;
};
const title = document.querySelector('title');
if (title) new MutationObserver(fix).observe(title, { childList: true, characterData: true, subtree: true });
fix();
