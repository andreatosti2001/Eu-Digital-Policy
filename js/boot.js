/* ============================================================
   The two things every page outside the brief needs, and which
   each of them previously either duplicated or did without:
   the chrome (navigation, breadcrumbs, theme, skip target) and
   the palette (search over the whole record).

   Kept separate from each page's own module so that a failure in
   one cannot take out the other: a broken enforcement renderer
   must not remove the navigation from the page.
   ============================================================ */

import { initShell } from './shell.js';
import { initPalette } from './palette.js';

try { initShell(); } catch (e) { console.error('[shell] failed', e); }
initPalette().catch((e) => console.error('[palette] failed', e));
