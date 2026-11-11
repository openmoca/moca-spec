# 0019 — Park `structure.json`

- **Status:** Accepted
- **Date:** 2026-11-10
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

[ADR-0007](0007-structure-core.md) let a package ship `structure.json`, a view
derived from `structure.ttl`, for Readers without an RDF parser. Readers that
parse Turtle checked it and reported `O004_STRUCTURE_VIEW_MISMATCH`. Every
Reader parses Turtle, and no application reads the file. It gave each Reader
a second source of structure to keep in step, and two files that could
disagree.

## Options

1. Specify the view fully: canonical JSON, versioning, and what a Reader
   without Turtle may answer from it.
2. Park it, as [ADR-0011](0011-park-unconsumed-features.md) parked other
   features with no consumer.

## Decision

Option 2, from 0.6.

- `structure.ttl` is the only structure file. A `structure.json` is an
  ordinary package file: covered by the digest, read by nothing
  ([package spec §5.6](../../spec/moca-package-spec.md#56-structure)).
- `O004_STRUCTURE_VIEW_MISMATCH` is retired; the code is never reused.
- `moca-lint structure` prints the sorted JSON view to standard output, for
  people and tools to read. It no longer writes into a package.
- Readers keep the view as a function (`structureView`), with its schema.

## Consequences

- One source of structure, and one fewer check in every Reader.
- A Reader without a Turtle parser cannot read structure.
- Packages that ship the file stay valid; it is simply not used.

## What would change this decision

A Reader, in a language or setting without a Turtle parser, that needs
structure. The view would return through a new ADR that specifies it fully.
