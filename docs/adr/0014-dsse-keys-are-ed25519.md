# 0014 — Sign DSSE attestations with Ed25519 keys only

- **Status:** Accepted
- **Date:** 2026-11-03
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Attestations §5 said Ed25519 keys were "recommended" for DSSE, and named no
other key type. The Readers filled the gap differently: the TypeScript and .NET
Readers also verified ECDSA P-256 and RSA signatures (SHA-256), and the Python
Reader verified only Ed25519. The corpus had only Ed25519 cases, so nothing
caught it. A package signed with an ECDSA or RSA key was `signed` in two
Readers and not the third, which breaks the promise that every Reader reaches
the same conclusions.

`moca-sign` only makes Ed25519 keys. Sigstore, the recommended signing mode,
has its own key rules and is not affected.

## Options

1. **Require Ed25519 for DSSE.** One key type, one rule, and the Readers agree.
2. **Name Ed25519, ECDSA P-256 and RSA as supported**, with corpus cases for
   each, and add the two missing types to the Python Reader.

## Decision

Option 1. A DSSE envelope is signed with an Ed25519 key, and a Reader verifies
a DSSE signature only with an Ed25519 key. A trusted key of another type
verifies nothing, so its attestation is invalid (`A002`). A corpus case checks
it with a correct RSA signature from a key the trust root lists.

Ed25519 is small, fast, deterministic, and in every language's standard or
common crypto library. Supporting more types would add choices (curves,
padding, hashes) that each Reader must make the same way, for no current
need: anyone who needs another key type can sign with Sigstore.

## Consequences

- Every Reader reaches the same conclusion about every DSSE attestation.
- A publisher whose own PKI uses ECDSA or RSA keys must use Sigstore, or an
  Ed25519 key for MOCA. No packages are known to be signed with another type.
- `moca-sign trust add` refuses a public key of another type.

## What would change this decision

A publisher or reviewer who must sign with an existing ECDSA or RSA key and
cannot use Sigstore. Option 2 would then add those types with corpus cases.
