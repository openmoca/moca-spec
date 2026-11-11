# 0020 — Structure never hides content

- **Status:** Accepted
- **Date:** 2026-11-10
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A package has several ways to say something is old: node `status:
deprecated`, the package relation `supersedes`, and in `structure.ttl`,
`owl:deprecated`, `dcterms:replaces` and `dcterms:isReplacedBy`. The spec did
not say which of them change retrieval, so Readers and authors could read
them differently.

## Options

1. Every signal excludes content.
2. Structure signals exclude content only when no node says otherwise.
3. Structure signals are descriptive only; node status and package
   relations alone change retrieval.

## Decision

Option 3.

- Only node `status: deprecated`, an ended validity window and an
  authorised package `supersedes`
  ([ADR-0015](0015-relations-need-a-scoped-signer.md)) leave content out of
  default retrieval. The package spec lists each signal and its effect in one
  table ([package spec §5.6](../../spec/moca-package-spec.md#56-structure)).
- Structure terms are reported, never acted on: structure never hides
  content.
- `supersedes` means the whole target package. A partial change is
  `amends`, which stays informative.
- `moca-lint` warns when a node's primary concept is deprecated or replaced
  but the node is neither `status: deprecated` nor bounded by its own
  `moca.valid_until`, and names the replacement.

## Consequences

- One place decides what is hidden: the node and the package, which an
  author can see and a signer vouches for.
- An author who deprecates a concept must also retire its pages. The lint
  warning catches the gap.

## What would change this decision

Packages where concept-level retirement is common and marking each page is a
real burden.
