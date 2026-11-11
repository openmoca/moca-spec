# 0003 — `moca-digest-v2` over a BagIt-style manifest, with detached attestations

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A package needs an identity that proves its content has not changed, and a
way for publishers and reviewers to sign what they checked.

An earlier draft stored the digest and the signature inside `moca.json`. A
digest a package declares about itself proves nothing, since whoever edits
the content can edit the declaration. Any manifest edit, even a reviewer's
date, forced a re-sign of the package and of every package composing it. And
nothing let a reviewer sign the exact content they checked.

`moca-digest-v1`, used up to 0.3, was computed rather than declared. It hashed
an object canonicalised with RFC 8785, containing the SHA-256 of the
canonicalised `moca.json` and a map of file hashes. This had two costs:

- Every Reader, in every language, needs a byte-exact canonical JSON
  implementation.
- No standard tool can check a MOCA package.

The one property it bought, that re-indenting `moca.json` leaves the digest
unchanged, is not needed: tools write manifests.

[BagIt (RFC 8493)](https://www.rfc-editor.org/rfc/rfc8493.html) already
defines a payload manifest: one line per file, giving the file's checksum and
path. OpenSSF Model Signing uses a per-file hash manifest in the same spirit.

## Options

1. A digest and signature declared in `moca.json`.
2. `moca-digest-v1`: computed over canonical JSON.
3. A digest computed over a plain, BagIt-style manifest, with attestations
   kept outside it.

## Decision

Option 3.

**The digest, `moca-digest-v2`.**

1. List the package's files: regular files only. Skip hidden entries and
   `attestations/`. Links, unreadable entries and path collisions fail
   closed. Paths are NFC.
2. For every file, **including `moca.json`**, write the line
   `<lowercase hex SHA-256>  <NFC path>` followed by a newline (LF). Sort the
   lines by the UTF-8 bytes of the path.
3. The digest is `sha256:` followed by the SHA-256 of that text.

This text is exactly a BagIt `manifest-sha256.txt`. So a package can be
checked with `sha256sum -c` or `shasum -a 256 -c`, and the digest is the hash
of that file.

**Members are pinned by digest** in `moca.json`, so a composed package's
digest covers its members and is reproducible everywhere.

**Attestations are detached.** They are in-toto statements, in DSSE envelopes
or Sigstore bundles, under `attestations/`, outside the digest. There are two
predicate types: package (publisher) and review (reviewer, bound to the exact
bytes of each node file). Trust roots give keys and Sigstore identities roles,
so a reviewer key cannot sign as a publisher.

Moving package signing to OpenSSF Model Signing waits for a later release,
after a spike against its specification and tooling.

## Consequences

- A digest mismatch always means content changed, never that a declaration
  was stale.
- Adding a review never changes a package's identity or needs a re-sign.
- OKF's `verified` can be backed by a signature from the person who checked.
- Signing and verification reuse Sigstore and DSSE unchanged. MOCA defines two
  predicates and a trust-root format, not a trust model.
- Readers need no canonical JSON library.
- A formatting-only change to `moca.json` changes the digest.
- Every 0.3 digest, member pin and package attestation changed in 0.4. A
  Reader reports `M008_DIGEST_V1_PACKAGE` (info) for a package written for
  `mocaVersion` below 0.4.

## What would change this decision

OpenSSF Model Signing defining a directory manifest that MOCA can adopt
exactly. The digest would then follow that format.
