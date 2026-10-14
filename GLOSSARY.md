# Glossary

The canonical vocabulary for this repo. Terminology only - no implementation
detail, no decisions, no status. If a term here conflicts with how a doc or a
piece of code uses a word, the glossary wins and the usage is a bug.

## Handover

Deliberately **not** used on its own. The word has meant three different things
in this repo and conflating them has caused real drift, so each sense has its
own term below. Prefer the specific term everywhere.

## Independence argument

The client-facing claim that the client is not dependent on one developer,
evidenced by the public documentation library. It is an argument about
*capability*, not about absence: it says the client *can* operate and extend the
platform without the builder, not that the builder leaves. The strongest close
in the sales material ("let the docs do the closing").

## Tier deliverables

What a client actually receives at each engagement tier - Launch, Growth, Scale
- across code and licence, vendor accounts, domain, docs, training, support,
exit and retainer. A ladder of *receipts*, distinct from the scope ladder (what
gets built), which the pricing material owns.

## Template handover

Forking this repository as a baseline for a new build: the fork and rebrand
checklist, the environment variables to replace, and the production-readiness
gaps. A builder-facing process, never a client-facing deliverable.

## Engagement phase

A separately scoped and separately priced stage of one client engagement
(for example: account setup, brand and catalogue customisation, build, care).
Phases are sequential and cross-cutting; tiers are the level at which an
engagement is pitched. A tier is not a phase.
