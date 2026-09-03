/* ============================================================
   agent/proposals/editorial/drafts-dir.mjs — where a drafted
   proposal lives

   SESSION 14: *draft into `agent/proposals/editorial/`. Do not
   directly modify production HTML.* This is that directory, named
   in one place so no caller writes the path twice.

   IT IS THE RECORD STORE, POINTED SOMEWHERE ELSE. The drafts are
   `EditorialProposal` records in the shape every other agent here
   produces — validated on the way in by the same store, hashed into
   the same trace, refused by the same contract. What differs is
   only where they land, and they land where the session said.

   A DRAFT IS NOT A PATCH, AND THERE IS NO SECOND COPY OF THE
   SENTENCE. The proposal's own operations carry `current` and
   `proposed` in full; writing the replacement out a second time as
   a patch file would be the second home this repository exists to
   prevent, and the two copies would eventually disagree about what
   was being proposed. The CLI renders them; the record is the
   draft.

   IT IS GIT-IGNORED, for the reason `agent/records/` is: a draft is
   a run artifact, regenerable, and the site is not changed because
   an agent was confident.
   ============================================================ */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EDITORIAL_DIR = dirname(fileURLToPath(import.meta.url));

export const DRAFT_DIR = join(EDITORIAL_DIR, 'drafts');
