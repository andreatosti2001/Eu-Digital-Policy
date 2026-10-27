# Methodological note, v2 — the map, the register, the watchlist (D5)

**Status: final text, for the author's editorial review.** Written in v2 Session 2, 27 Oct 2026. It is
the section `methodology.html` gains when Phase 3 ships the dependency map. It goes after "Dates, status
and competence" and before "How the records are kept honest".

**Not published yet, and why.** It describes a view, a register and a watchlist that do not exist on
the site today. Published before them, it would describe things a reader cannot find. It ships in the
same commit as the map.

**Rules the text follows:**
- **It states no number.** How many instruments are covered, excluded or watched is computed on the page,
  as the evidence counts are, so no document can drift from it.
- **It names no instrument's status.** Statuses live in the records.
- **One clause depends on an open decision.** The criterion paragraph restates the inclusion criterion
  proposed in `docs/V2-DATA-DESIGN.md` §5 (D-7). If the author changes the criterion, that paragraph
  changes with it and nothing else does.

**Localisation.** The section adds keys to the `it`, `fr` and `es` overlays. They are declared
`pending_translation` until translated; nothing is machine-translated into a published edition.

---

## What the map covers, and what it leaves out

The map shows the instruments this site records and the relationships between them. It is drawn from
the same records as the rest of the site. Every line on it is a record, and each record names the
provision that establishes it.

**Two kinds of relationship.** Some relationships are stated by the law itself:
- one act amends or repeals another;
- one act leaves a matter to another;
- one act relies on the definitions, bodies or means another establishes.

Each is recorded with the article that says so. Others are this site's reading: two acts reach the same
conduct, complement each other, or pull in opposite directions. A reading is an argument, and it is
recorded as one, with the claim that carries it. The map draws the two kinds differently.

**What is not yet checked is shown as not yet checked.** A relationship that has not been read against
its source is drawn as unverified, or not drawn at all. It is never drawn like one that has. A
relationship that comes from a proposal is drawn as proposed: a proposal binds nobody.

**"In transition" is not a prediction.** When a pending proposal would repeal an act that is in force,
the map marks that act as in transition. The mark is computed from the proposal's own text, the
provision that would repeal, and from its status. Nobody writes it, so nobody has to remember to remove
it: when the proposal is adopted, withdrawn or amended, the mark changes by itself.

**Four kinds of coverage:**
- *Covered*: analysed in the brief, with a page of its own.
- *Mapped*: recorded, dated and linked, but not analysed at length.
- *Excluded*: deliberately outside this site, listed in the register below.
- *Watched*: not covered yet, on a watchlist, for a stated reason.

The kind is computed from the record. Whether an instrument has a page is checked against it, so an
excluded act cannot acquire a page by accident.

**What decides coverage.** An instrument is covered when its own subject-matter article sets rules on at
least one of:
- personal data and the use of data;
- digital services and online platforms;
- artificial intelligence;
- the security of networks and information systems;
- the digital infrastructure beneath them: electronic identity, the interoperability of public digital
  services, electronic communications networks.

It must also apply across sectors, or be one sector's instance of one of those layers, built on an
instrument the site already covers. And it must not be organised around another field of law:
- tax;
- intellectual property;
- media content;
- product safety;
- accessibility;
- electoral law;
- financial markets and payments.

Every addition and every exclusion cites the parts of this test it rests on.

**The exclusion register is not a verdict on the law.** An act in the register is one this site does
not analyse. That says nothing about whether it matters, or whether it applies to you. Its obligations
are as real as any other act's; they are simply not examined here. Each entry says why it is excluded,
what establishes its identity and status, and where to read it: the official text, never a summary
standing in for it.

**The watchlist is a decision postponed, with its trigger named.** An act on the watchlist is not
covered today, and each entry names the event that would reopen the question:
- a proposal's formal adoption;
- the end of a procedure that would repeal it;
- a chapter this site might open.

When that event appears in the records, the site reports that the decision is due. It does not quietly
keep the old one.

**Status in six words, and the state beside them.** Each instrument carries one of six plain labels:
- *in force*;
- *applying in stages*;
- *legislative proposal under negotiation*;
- *political agreement reached, formal adoption pending*;
- *withdrawn*;
- *in transition*, shown in addition to one of the others.

The label is computed from the instrument's recorded status and its dated milestones, never typed in.
The precise legal state is always shown beside it, because a label groups states and grouping loses
detail. Some states have no label and are shown as they are. A directive whose transposition is pending
or overdue is in force at Union level, but what binds a reader is national law, and calling it simply
"in force" would suggest otherwise.

**No layers.** The map does not sort acts into "product" and "system" regimes, or any similar scheme.
No provision says which kind an act is, so such a label could only be this site's assertion about each
act, stated as if it were a fact. The map shows instead what the records establish:
- who each act addresses, read from its applicability rules;
- which other acts rely on it, read from their texts.

**What the map cannot establish.** It is as complete as the relationships recorded, and no more. **No
line between two acts does not mean they do not interact.** It means no relationship between them has
been recorded. Absence of a record is absence of knowledge, here as everywhere on this site.
