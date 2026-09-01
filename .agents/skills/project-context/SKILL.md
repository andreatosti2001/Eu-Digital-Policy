---
name: project-context
description: Load the mandatory context for the Eu-Digital-Policy repository before doing any work. Use at the start of every session, before reading implementation files or making any change.
---

# project-context

**Boundaries:** `docs/AI-SAFE-BOUNDARIES.md` §0 holds the absolute prohibitions. Skills in
this library point at them rather than copying them — with one deliberate exception, recorded
in `data-governance` and in `docs/SKILL-MAP.md` §4.

## Purpose

This repository has strict invariants that are not obvious from the code, and a public
audience that may act on what the site says about EU law. Starting work without loading the
context is how a session ships a false statement or a silent architectural regression.

## When to invoke

At the start of **every** session, before anything else. Also whenever a session resumes
after a long gap or after context has been summarised.

## Procedure

1. **Read, in this order:**
   - `docs/PROJECT-CONTEXT.md` — what the project is and the seven governing principles.
   - `docs/CURRENT-ARCHITECTURE.md` — the rendering model, dependency map, derivation layer,
     tooling baseline, and the `__CONTENT__` bypass in §8.
   - `docs/AI-SAFE-BOUNDARIES.md` — the green/amber/red tiers and the absolute prohibitions.
   - `docs/HANDOVER.md` — the previous session's state and the current objective.
   - `README.md` — the author's own account, including the eight known limitations.

2. **Verify the handover against the code.** The repository is the source of truth. If
   `HANDOVER.md` describes something the code does not do, **stop and report the
   discrepancy** rather than reconciling it silently.

3. **Establish the baseline** before changing anything:
   ```
   node tools/validate.mjs
   node tools/i18n-audit.mjs
   node tools/design-qa.mjs
   node tools/freshness.mjs
   git status
   git log --oneline -10
   ```
   Record the output. Every later claim about regressions is measured against it.

4. **Read the `$description` and `$note`** of any dataset you intend to touch before
   touching it. The non-obvious invariant lives in the `$note`.

5. **Load the skill you need, not all of them.** `docs/SKILL-MAP.md` lists the library, what
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

Do not proceed if the context documents are missing or contradict the code. Report first.
