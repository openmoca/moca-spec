# 0040 — `ids` bind a signer to the package ids it may sign

- **Status:** Accepted (owner, 2026-11-21)
- **Date:** 2026-11-21
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A host's trust root lists the keys and Sigstore identities it trusts, each
with roles ([attestations §6](../../spec/moca-attestations.md#6-trust-roots)).
An entry with the `package` role could sign a package with any `id`. So
`signed` meant "signed by someone in my trust root". It did not mean "signed
by someone who may publish under this id".

For a host with one publisher the two are the same. A host that trusts
several publishers (a library, a school, a marketplace) could not say which
publisher may sign which packages. An application could compare a package's
`signers` with the publisher it expected, but nothing in the result told it
to.

`ids` already exists on trust-root entries. It scopes relations
([ADR-0015](0015-relations-need-a-scoped-signer.md)): a package can supersede
or contest only ids its signer covers. It scopes issued copies
([ADR-0028](0028-issued-copies.md)): an issuer may issue copies only of the
ids it covers. The same field, with the same matching rule, can say which
packages an entry signs.

## Options

1. **`ids` also scopes the `package` role, when present.** An entry with
   `ids` signs only packages whose `id` its `ids` cover. An entry without
   `ids` behaves as before.
2. **Leave it, and say so in the trust guide.** `signed` keeps its meaning,
   and hosts with several publishers compare `signers` themselves.
3. **Require `ids` with the `package` role**, as `issued-copy` does. Every
   existing trust root without `ids` would stop being valid.

## Decision

Option 1.

- A trust-root key or identity with the `package` role MAY carry `ids`. When
  it does, it counts as a signer only for packages whose `id` its `ids`
  cover: an exact id, or a prefix ending in `/`, `:` or `#`, as in
  [package spec §7.2](../../spec/moca-package-spec.md#72-relations). An
  empty list covers nothing.
- An entry without `ids` signs a package with any `id`, as in earlier
  versions. Its packages still make no relation take effect (ADR-0015).
- When a package attestation's signature verifies and its statement matches,
  but the signer's `ids` do not cover the package's `id`, the Reader reports
  `A010_SIGNER_NOT_FOR_PACKAGE` (error). The attestation does not count: it
  adds no signer, does not make the package `signed`, and does not meet
  `requireSignature`. Like the other `A` codes except `A009`, it does not
  make the package invalid.
- `ids` does not narrow the `review` role. A reviewer's reach is set by
  `reviewers`.

Option 1 is small and additive: no schema shape changes, no trust root stops
working, and a host opts in by adding a field it may already have for
relations. Option 2 leaves the gap to every application. Option 3 breaks
every simple trust root for a need only some hosts have.

**How we will know it works.** The conformance corpus has a case for each
branch: `signer-binding-covered`, `signer-binding-no-ids`,
`signer-binding-not-covered`, `require-signature-signer-not-covered` and, for
Sigstore identities, `sigstore-signer-not-covered`. A Reader passes when it
reaches the same codes and capabilities.

## Consequences

- A host with several publishers can bind each to its own ids, and a package
  signed by the wrong one reads as not signed, with a code that says why.
- A trust root that already had `ids` for relations now also limits what
  that entry signs. A package outside those ids, signed by that entry, was
  `signed` under 0.6.0 and is not under 0.7.0. This is the intended reading
  of `ids` ("the package ids this entry may speak for"), and it is named in
  the changelog and in MIGRATIONS.md.
- An entry without `ids` is still "may sign anything". The trust guide tells
  hosts with more than one publisher to add `ids`.
- This does not prove who owns an id. It records the host's own decision
  about who may use it.

## What would change this decision

- Hosts ask to scope reviews by package id too. That would be a new record.
- A shared way to learn who owns an id (a registry, or a proof of control
  over the id's domain) arrives. `ids` would then be one input among others.
