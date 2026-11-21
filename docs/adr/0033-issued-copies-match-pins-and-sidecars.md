# 0033 — Issued copies match member pins and the publisher's sidecar

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Members of a members' series receive issued copies of its releases
([ADR-0028](0028-issued-copies.md)). Each copy has its own digest, so a series
that pins the publisher's packages could never resolve a licensee's copy
(`R002`), and the publisher's sidecar index never bound to a copy (`S003`):
every copy needed its own index before it could be searched on a device
([issue #10](https://github.com/openmoca/moca-spec/issues/10)).

## Options

1. Pin and index each copy: one series package and one index per licensee.
2. Let a copy match through its `issuedCopy.originalDigest`, which the
   Reader rebuilt and verified against the host's trust root.

## Decision

Option 2 ([package spec §7.1](../../spec/moca-package-spec.md#71-members),
[sidecar spec §5](../../spec/moca-sidecar-index-spec.md#5-binding-and-staleness)).

- A member that is an issued copy matches its pin when its verified
  `issuedCopy.originalDigest` equals it. A copy that did not verify is
  compared by its own digest and does not match. `R002` says so.
- A sidecar binds to an issued copy the same way. Items of files the issuer
  changed are replaced by each file's whole body, without a vector, and the
  Reader reports `S009_SIDECAR_ITEMS_REPLACED` (info). Lexical search covers
  the whole copy; dense search misses only changed nodes. Publishers should
  let issuers mark only files that need not be found by meaning.
- The trust in both rests on the issued-copy verification already in place:
  the issuer's role and `ids`, the publisher's consent in `issuedCopies`,
  and the rebuilt original digest.

## Consequences

- One series package and one sidecar serve every licensee's copies.
- A host without the issuer in its trust root sees `R002` and `S003` for
  copies, as before.

## What would change this decision

Issuers that need to change most node files, which would make the publisher's
sidecar of little use for dense search.
