# 0028 — Issued copies are bound to the publisher's package, with its consent

- **Status:** Accepted
- **Date:** 2026-11-14
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Publishers of courses and other paid knowledge want offline use for one
licensee, and a copy that can be recognised if it leaks. An issuer can mark a
licensee's copy by changing some body text. Any change alters the digest, so
the publisher's package attestation no longer matches (`A008`), reviews of
the changed files stop counting, and a host that requires a signature refuses
the copy ([issue #5](https://github.com/openmoca/moca-spec/issues/5), part C).

## Options

1. Marks outside the digest: only in attestations or hidden files.
2. The publisher signs every copy itself.
3. Reuse the `package` role: a trusted distributor signs each copy as a
   package.
4. A new predicate, `issued-copy`, that binds the copy to the publisher's
   package. The Reader rebuilds the original digest from the copy and the
   original hashes of the changed files, then checks the publisher's
   attestations against it.

## Decision

Option 4 ([attestations §3a and §7.1](../../spec/moca-attestations.md#3a-issued-copy-attestations)).

- **The Reader checks the binding.** It rebuilds the digest manifest with
  each changed file's original hash. The result must equal the original
  digest that the publisher signed.
- **Only files under `content/` or `media/` may change.** `moca.json`,
  `structure.ttl`, `sources/`, hidden entries and profile files never do, so
  the manifest the publisher signed is the manifest the Reader reads.
- **Two keys must agree.** The host trusts the issuer for a new role,
  `issued-copy`, with `ids` required. The publisher names the issuer and the
  paths it may mark in `issuedCopies` (package spec §4.11). Issuers are named
  by key or Sigstore identity, never by a host's `keyid`.
- **Reviews of changed files never count**, and are listed with
  `fileChanged: true`. A copy whose reviewed files were marked is not
  `reviewed`.
- **Records say what changed.** `package.issuedCopy` names the original
  digest and the issuers; `node.issuedChange` marks records from changed
  files.
- **Libraries.** A second issued copy of the same original is `L002`
  (info), not `L001`.
- **No licensee in the statement.** The copy's digest already identifies it
  to the issuer.
- Every failure is `A002`, and the copy is then read as any package.

## Consequences

- A marked copy stays `signed` by its publisher, and `requireSignature`
  accepts it.
- The `roles` enum gains `issued-copy`, so a 0.6 Reader refuses a trust root
  that lists it. We accept this breaking change before 1.0.
- A 0.6 Reader treats an issued copy as a tampered package (`A008`), and
  refuses it under `requireSignature`. That fails safe.
- The Reader cannot prove that only marks changed, or that the meaning is the
  same. That is the issuer's assertion (attestations §8).
- An issuer's key expiry ends the binding of every copy it issued, so issuers
  re-issue before keys expire.

## What would change this decision

Marks that need to change files outside `content/` and `media/`, or a
standard for marked copies that Readers could adopt instead.
