---
name: project-context
description: Load the mandatory context for the Eu-Digital-Policy repository before doing any work, by reading level — always the binding constraints, then the documents the catalogue lists for the task's domain, then records only on request. Use at the start of every session, before reading implementation files or making any change.
---

# project-context

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 holds the absolute prohibitions. Skills in
this library point at them rather than copying them — with one deliberate exception, recorded
in `data-governance` and in `docs/SKILL-MAP.md` §4.

## Purpose

This repository has strict invariants that are not obvious from the code, and a public
audience that may act on what the site says about EU law. Starting work without loading the
context is how a session ships a false statement or a silent architectural regression.

It reads **by level** (the author's decision, `docs/ROADMAP-v2.md` §8, «D1, D.3 question 2»;
the levels are `docs/DOCUMENTATION-ARCHITECTURE.md` §7): what binds every session, always;
what the task's domain needs, from the catalogue; records, only when something cites them.

## When to invoke

At the start of **every** session, before anything else. Also whenever a session resumes
after a long gap or after context has been summarised.

## Procedure

1. **Always — whatever the task:**
   - `docs/AI-SAFE-BOUNDARIES.md` §0 and §3 — the absolute prohibitions and the red tier.
   - the header of `docs/HANDOVER.md` — everything above its first `## ` entry: the current
     state, the branch, and what the next session is.
   - the rules of `AGENTS.md` — «The rules that matter most» and «When to stop and ask».

2. **By domain — what the task touches.** Name the task's domain (or domains) from the table
   in `docs/DOCUMENTATION-ARCHITECTURE.md` §7, then open `docs/README.md` §2 and read what its
   row lists for that domain: the second column always, the third when the task touches what
   it names. **Read the list there; do not copy it here or anywhere** — the catalogue is its
   one home, and a list copied into a skill goes stale the day a document is added.

3. **On request — nothing else by default.** Records (prompts, readings, audits, runs), the
   archive, generated sheets and snapshots are read when the task, its prompt or a §8 row
   cites them, and not before. `docs/HANDOVER.md` beyond its header is a record of this kind.

4. **Verify the handover against the code.** The repository is the source of truth. If
   `docs/HANDOVER.md` describes something the code does not do, **stop and report the
   discrepancy** rather than reconciling it silently.

5. **Establish the baseline** before changing anything:
   ```
   node tools/validate.mjs
   node tools/i18n-audit.mjs
   node tools/design-qa.mjs
   node tools/freshness.mjs
   git status
   git log --oneline -10
   ```
   Record the output. Every later claim about regressions is measured against it.

6. **Read the `$description` and `$note`** of any dataset you intend to touch before
   touching it. The non-obvious invariant lives in the `$note`.

7. **Load the skill you need, not all of them.** `docs/SKILL-MAP.md` lists the library, what
   each skill owns, and which agent role uses which. Each skill is narrow on purpose: it
   states its own scope boundary and names the sibling that owns what it does not.

## The five things to internalise

1. One home per fact. A fact in two files means one of them is wrong.
2. Derivation over storage. Grades, pipeline stages, competent authority and key dates are
   computed, never stored.
3. Absence of knowledge is not a negative finding. `null` ≠ `unknown`; unknown is never zero.
4. Never fabricate a legal fact, and never close an evidence gap with a plausible substitute.
5. Zero build, zero dependencies, zero third-party requests — by explicit design.

## Refusal conditions

Do not proceed if a document of the «always» level is missing or contradicts the code, or if
`docs/README.md` §2 has no row for the task's domain. Report first.

## Its tests

`tools/docs-check.mjs`, the `SKILL` checks (errors; the author's decision, §8, «D4, D4.1: where
the skill's tests live»): this file names every item of the «always» level and `docs/README.md`
§2, copies no domain's list, names only paths that exist; `CLAUDE.md` and `docs/SKILL-MAP.md`
point to it rather than carry a reading list of their own.
