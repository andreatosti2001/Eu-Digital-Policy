# Content freshness policy

**Status:** binding. It sets out when the site's content is to be called *stale*, and what
happens next. Written for AUDIT-2026-09-25, T-23.
**Read with:** `docs/VERIFICATION-POLICY.md`, which defines what verification is. This
document only says when it is overdue.

---

## 1. Why this exists

The site states what EU law requires, and some of those statements expire. A deadline
passes. A preliminary finding becomes a decision, or it is dropped. An appeal is decided.
An enforcement set that nobody has re-read reads as current, and it is not. The audit found
the content had not moved for four weeks while the tooling around it grew. Nothing in CI
said so where a reviewer would see it.

## 2. The rule

The content is **stale** when `tools/freshness.mjs` reports a staleness prompt. Four
conditions produce one:

1. **A dated event has passed since it was last verified.** A timeline event whose date
   falls after the later of the file's `$last_verified` and the event's own `last_verified`,
   and on or before today.
2. **A provisional enforcement record has not been re-verified within the recheck
   window.** Provisional means one of: announced only, appeal pending or unknown, payment
   unknown, or flagged `requires_verification`. The window is
   `RECHECK.provisional_enforcement` in `tools/freshness.mjs`.
3. **The newest enforcement decision on record is older than the enforcement interval.**
   This asks a different question from condition 2: whether decisions taken since have been
   missed. The interval is `EXPECTED.enforcement`.
4. **A dataset is past its interval**, meaning its file-level `$last_verified` is older
   than its entry in `EXPECTED`.

The numbers live in `tools/freshness.mjs` and nowhere else. `tools/selftest.mjs` F5 asserts
them, so a change to one shows up in a diff somebody reads. Loosening a threshold to clear
a prompt is prohibited (`docs/AI-SAFE-BOUNDARIES.md` §0.7).

## 3. What CI does

The QA workflow (`.github/workflows/qa.yml`) runs `freshness.mjs` on every push and pull
request. Each prompt is raised as a GitHub Actions **warning titled "Content stale"**, so
it appears on the run and on the pull request, not only in the log.

**It is a warning, not an error, and the build stays green.** A prompt is true because time
has passed, not because anything in the tree is wrong. The same bytes would pass if they
had been checked on their own verification date, and no commit can make a prompt
permanently false. `freshness.mjs` exits 1 only on a defect in the tree. The contract is at
the head of that file, and `tools/selftest.mjs` F1–F9 hold it from both sides.

**A green run is therefore not evidence that the content is current.** The report says so
on the line that gives the exit code.

## 4. What closes a prompt

Only verification work does: a person opens the primary or official source, re-reads the
record, and updates it. That means recording its `last_verified`, its `verification_note`,
and any value that has changed, as `docs/VERIFICATION-POLICY.md` §1 requires.

A prompt is never closed by:
- moving a file-level `$last_verified` for records that were not re-read;
- widening an interval;
- stamping a date on a record that was not opened.

Where a record was re-read and nothing had changed, the new `last_verified` is the whole
of the change, and that is a legitimate outcome.

## 5. What this policy does not do

- It does not gate deployment. A push to `main` publishes (`docs/AI-SAFE-BOUNDARIES.md`
  §4), and a warning cannot stop it.
- It does not fetch anything. `freshness.mjs` performs no network I/O. It ages the dates the
  data records and cannot tell whether a source has changed.
- It does not read the prose. A stale sentence in `index.html` with no record behind it
  raises no prompt. The audit of 25 September 2026 counted about a dozen verifiable statements
  that sit outside the record system.
