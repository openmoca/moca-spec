# 0014 — `moca-digest-v2`: a digest over a BagIt-style manifest

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))
- **Supersedes:** [0002](0002-computed-digest-and-detached-attestations.md)

## Context

`moca-digest-v1` hashed an object canonicalised with RFC 8785, containing the
SHA-256 of the canonicalised `moca.json` and a map of file hashes. This has
two costs:

- Every Reader, in every language, needs a byte-exact canonical JSON
  implementation.
- No standard tool can check a MOCA package.

The one property it bought, that re-indenting `moca.json` leaves the digest
unchanged, is not needed: tools write manifests.

[BagIt (RFC 8493)](https://www.rfc-editor.org/rfc/rfc8493.html) already
defines a payload manifest: one line per file, giving the file's checksum and
path. OpenSSF Model Signing uses a per-file hash manifest in the same spirit.

## Options

1. Keep `moca-digest-v1`.
2. Compute the digest over a plain, BagIt-style manifest.

## Decision

Option 2: `moca-digest-v2`.

1. List the package's files, as before. Skip hidden entries and
   `attestations/`, and fail closed on links, unreadable entries and path
   collisions.
2. For every file, **including `moca.json`**, write the line
   `<lowercase hex SHA-256>  <NFC path>` followed by a newline (LF). Sort the
   lines by the UTF-8 bytes of the path.
3. The digest is `sha256:` followed by the SHA-256 of that text.

This text is exactly a BagIt `manifest-sha256.txt`. So a package can be
checked with `sha256sum -c` or `shasum -a 256 -c`, and the digest is the hash
of that file.

**Attestations.** Package and review attestations stay detached, outside the
digest, as [ADR-0002](0002-computed-digest-and-detached-attestations.md)
decided. A re-review still never changes a package's identity. They keep the
current DSSE and Sigstore formats. Moving package signing to OpenSSF Model
Signing waits for a later release, after a spike against its specification
and tooling.

## Consequences

- Every 0.3 digest, member pin and package attestation changes. A Reader
  reports `M008_DIGEST_V1_PACKAGE` (info) for a package written for
  `mocaVersion` below 0.4.
- Readers need no canonical JSON library.
- A formatting-only change to `moca.json` now changes the digest.

## What would change this decision

OpenSSF Model Signing defining a directory manifest that MOCA can adopt
exactly. The digest would then follow that format.
