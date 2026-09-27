# 0002 — The digest is computed, never declared; attestations are detached

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

The earlier draft stored `canonicalDigest` and `signature` inside `moca.json`
and excluded them from the digest they described. That created several
problems:

- a digest a package declares about itself proves nothing, since whoever edits
  the content can edit the declaration;
- any manifest edit, including a reviewer updating a review date, forced
  re-signing of the package and of every package composing it;
- composed digests depended on how a host resolved version ranges, so they
  were not reproducible;
- `epistemicStatus: verified` was an unsigned label; nothing let a reviewer
  sign what they checked;
- the specification did not define symlinks, unreadable entries or file-name
  normalisation, and the reference tools silently skipped symlinks and
  unreadable folders.

## Options

1. Keep the embedded digest and signature and patch the gaps.
2. Compute the digest only; pin members by digest; store attestations as
   separate in-toto statements outside the digest.

## Decision

Option 2.

- The digest is computed by a fully specified algorithm (`moca-digest-v1`):
  regular files only; links, unreadable entries and colliding names fail
  closed; paths are NFC; hidden entries and `attestations/` are excluded.
- Members are pinned by digest in `moca.json`, so a composed package's digest
  covers its members and is reproducible everywhere.
- Attestations are in-toto statements in DSSE envelopes or Sigstore bundles
  under `attestations/`, with two predicate types: package (publisher) and
  review (reviewer, bound to the exact bytes of each node file).
- Trust roots give keys and Sigstore identities roles, so a reviewer key
  cannot sign as a publisher.

## Consequences

- Adding a review never changes a package's identity or needs a re-sign.
- `verified` can now be backed by a signature from the person who checked.
- Signing and verification reuse Sigstore and DSSE unchanged. MOCA defines two
  predicates and a trust-root format, not a trust model.
- A digest mismatch always means content changed, never that a declaration was
  stale.

## What would change this decision

An OKF-level or OCI-level standard for content-addressed knowledge bundles
that makes MOCA's digest redundant.
