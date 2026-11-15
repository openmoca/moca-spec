# 0030 — A composing package's structure can bind its members, and `upTo` reaches them

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A series of releases (podcast and video series content) is a package whose
`members` are the releases. Its `structure.ttl` has the topics and the
order, but a node can bind only to concepts in its own package's structure,
so a series could not file its releases under its topics. `upTo` limited
only the package whose reading order placed the point, so a series' order
never limited its members
([ADR-0027](0027-reading-order-names-a-collection.md),
[issue #10](https://github.com/openmoca/moca-spec/issues/10)).
`maxMembers` (256, counted at every depth) was also too small for a long
series.

## Options

1. Each release declares the series' topic IRIs and binds its nodes to them.
2. The composing package's structure uses a member's package `id`, or a
   member's node identifier, as a concept; the member's records are bound to
   it by composition.
3. Both.

## Decision

Option 3 ([package spec §5.6](../../spec/moca-package-spec.md#56-structure),
[Reader contract §9](../../spec/moca-reader-contract.md#9-search)).

- Binding by composition applies to the `concepts` and `scope` filters,
  to `upTo`, and to the structure operation `nodes()` (Reader contract §10),
  so listing a topic's nodes agrees with searching it. It never changes the member's bytes, digest, trust or its
  record's `concepts`. Only a member that resolved and matched its pin is
  bound.
- `upTo` limits a package whose reading order places the point and its
  resolved members at any depth, but a composing package limits a member
  only when its signers' `ids` cover the member's `id`, as for relations
  (`R004`), or the host allows unsigned packages to. A package loaded beside
  a member cannot hide the member's records unless it speaks for it. A member record takes positions from its own
  concepts and from its bindings by composition. This extends the "which
  packages" rule of ADR-0027; the rest of it stands.
- The IRI names both a package or node and a concept. SKOS allows that; the
  specification says not to type it `skos:Collection` or
  `skos:ConceptScheme`, and that an identifier Turtle cannot write cannot be
  bound.
- Package states carry the bindings, so a store search agrees with a library
  search.
- `maxMembers` rises to 4,096; `maxMemberDepth` stays 8. Series guidance
  (package spec §7.3) groups long series by season and lists every release in
  the series' ordered collection.

## Consequences

- A series can add a topic, or a release to a topic, in a new series version,
  with no new version of any release.
- A composing package can only narrow what a search returns for its members
  (through filters the caller chose, or `upTo`); it never removes a member's
  content from default retrieval.
- A host on a small device may need a lower `maxMembers`.

## What would change this decision

Composing packages that need to bind members they do not pin.
