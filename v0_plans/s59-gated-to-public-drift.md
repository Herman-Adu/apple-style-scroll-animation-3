# S59 — The showroom answers the engine room

## Why

The nine owner-gated Positioning docs are the engine room: what the owner
charges, how they pitch, and the objections they answer in a live sales
conversation. The eight public CTO docs are the showroom — the pages a post
links to and a buyer reads unaccompanied.

Nothing fails when the pitch commits to an answer and the public layer does not
carry it. That is the failure mode that let What's New drift for eleven sprints
before S50, and the one S57 found in the proof page: a claim made where the
reader cannot check it.

Measured before planning, not assumed:

- `Positioning` holds nine docs, every one `access: "owner"`.
- The CTO audience (`Business Case`, `Technology Strategy`, `Security & Trust`)
  holds eight public docs.
- Three gated docs carry an objection-handling section — fifteen objections in
  all, each a question a buyer actually asks.
- Of those, three have **no public answer anywhere**: the words
  `deliverability`, `rented`, `per-contact` and `another developer` appear in no
  public CTO doc. The gated demo script even tells the seller to point a buyer
  at the Email Selling Points doc for "the real cost saving" — a doc behind the
  owner gate.

## Outcome

Every objection the gated pitch commits to answering has a public counterpart
that answers it, and a test fails when that stops being true.

## Scope

1. `features/docs/lib/domain/showroom.ts` — pure: parse the objections out of
   the gated docs (steps titles and `Objection` table rows under an
   objection-handling heading), normalise them to stable keys, and check a
   declared manifest of public answers for coverage, staleness and drift.
   Anchors match on word boundaries, so `ESP` inside `respond` is not an answer.
2. `qa/unit/docs/showroom-coverage.test.ts` — table-driven unit tests on a
   fixture, with the allow/refuse cases lifted from the real docs, plus the
   real-repo assertions. A floor pins the derived source set so a parser that
   returns nothing cannot pass the guard vacuously.
3. Fix the three gaps in public copy, in the showroom's existing neutral voice
   (categories, not vendor names, which is how the public docs already read):
   - ROI & TCO — the rented-ESP line: per-contact fees rise with the list while
     this one is flat.
   - Security & Compliance Posture — deliverability: an authenticated sending
     domain, opt-in respected, every send logged, unsubscribe honoured.
   - Engineering Quality — continuity: what another developer needs to pick the
     platform up.

Data impact: none. No schema change, no deploy.

## Out of scope

- The handover tier matrix, the full showcase re-export and the Strapi builder
  ADR — the other three candidates in `docs/next-steps.md`, each its own sprint.
- An exemption path for an objection that is deliberately owner-only. Every one
  of the fifteen has a public home today, so the mechanism would be unused code.
  The guard failing is the right way to force that decision when it arrives.
