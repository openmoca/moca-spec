# 0018 — Search ranking is informative

- **Status:** Accepted
- **Date:** 2026-11-10
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

The Reader contract described hybrid ranking in detail: Reciprocal Rank
Fusion with `k = 60`, weights and tie order. The conformance corpus never
tested ranking, and other backends rank in their own way. Text that reads as
normative but is never tested invites Readers to disagree silently.

## Options

1. Make ranking normative and test it in the corpus.
2. Make ranking informative, and keep normative only what changes what a
   host may be handed.

## Decision

Option 2.

- Reciprocal Rank Fusion is the reference hybrid backend, a recommended
  default ([Reader contract §9.6](../../spec/moca-reader-contract.md)).
- Normative: what makes two hits the same hit, that the host (never a
  package or sidecar) sets weights, and that the gate runs after ranking.
- The embedder recipe in the sidecar spec is informative. A `model.name` and
  `version` pair names an exact recipe, so a host knows how to embed queries.
- The reference Readers keep parity tests that check they rank alike. That
  is a promise about these Readers, not part of conformance.

## Consequences

- Any search backend can be conformant.
- Two conformant Readers may rank the same query differently. The gate and
  the trust rules still apply to whatever they return.

## What would change this decision

Hosts needing identical ranking across Readers from different vendors.
