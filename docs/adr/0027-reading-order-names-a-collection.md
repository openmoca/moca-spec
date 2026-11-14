# 0027 — The reading order names a collection, and `upTo` is the caller's

- **Status:** Accepted
- **Date:** 2026-11-14
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Many packages are meant to be read in order. `structure.ttl` can hold that
order as a `skos:OrderedCollection`, but a package may hold several, and
nothing said which one orders the whole package. A reader part way through
also wants answers only from what they have reached
([issue #9](https://github.com/openmoca/moca-spec/issues/9)).

## Options

1. `readingOrder` as a list of node paths, as in the W3C Publication
   Manifest.
2. Use the first ordered collection found.
3. `readingOrder` names one ordered collection in the package's own
   `structure.ttl`, and a search option `upTo` names how far the reader has
   got.

## Decision

Option 3 ([package spec §4.10](../../spec/moca-package-spec.md#410-reading-order),
[Reader contract §9](../../spec/moca-reader-contract.md#9-search)).

- The order is stated once, in the structure. The manifest only points to it,
  using the W3C name. An overlay never supplies or changes it.
- A concept's position is the first member that is it or contains it by
  hierarchy or parts, in the package's own structure. So a library search
  and a store search agree, and overlays never move material.
- `upTo` is inclusive. In a limited package, a record passes when every
  concept it is bound to that is on the reading order is at or before the
  point. A node bound to module 1 and module 5 does not reach a reader on
  module 1.
- Records off the reading order pass: a glossary, an introduction or
  reference pages are useful at every point. `scope` and `concepts` remove
  them when a caller wants.
- `upTo` limits only the packages whose reading order has it as a member.
  Reference packages searched beside a course still answer. A search never
  returns nothing just because a package lacks the point.
- `upTo` runs in the gate and follows the caller. An ingress hook cannot set,
  change or remove it. It adds no pushdown filter.
- Structure describes; it never hides content
  ([ADR-0020](0020-structure-never-hides-content.md)). `upTo` narrows a
  search the caller asked for; it is not access control.

## Consequences

- One new warning, `M014_READING_ORDER_UNRESOLVED`, and no new capability.
- Package states grow by the reading order's members and positions.
- A backend with `filterPushdown` may return hits the gate then drops for
  `upTo`; the Reader asks for more hits, as it already does without pushdown.

## What would change this decision

Packages that need more than one reading order (for example one per
audience), or a need for `upTo` in the structure operations.
