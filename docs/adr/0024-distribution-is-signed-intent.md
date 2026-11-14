# 0024 — `distribution` is the publisher's signed intent, not access control

- **Status:** Accepted
- **Date:** 2026-11-14
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A package is handed over in full, handed over encrypted, or kept on a server
that returns citation records. A package cannot say which of these its
publisher intends, so a catalogue cannot tell a reader what they will get.
Proposal: [moca-spec#5](https://github.com/openmoca/moca-spec/issues/5).

## Options

1. A manifest property, `distribution`, with no Reader behaviour.
2. The same property, with a diagnostic when an `encrypted-only` package is
   read plain.
3. Intent outside the package: in a catalogue, or in a detached statement.

## Decision

Option 1. `distribution` is `open` (the default), `encrypted-only` or
`service-only`. It is covered by the digest, so it is the publisher's signed
intent and travels with every copy. A Reader exposes the value and never
refuses a package because of it.

Option 2 is rejected: a Reader cannot tell how a package arrived, and a
`service-only` package is always read plain by the service it is meant for.
The host compares the value with how it received the package. Option 3
remains open to hosts, but on its own the intent would not travel with the
package.

The enum is closed. A later value needs a new minor release.

## Consequences

- No existing package changes meaning.
- `distribution` is a label, like `audience`
  ([package spec §13.3](../../spec/moca-package-spec.md#133-audience-is-a-label-not-access-control)).
  It protects nothing. Removing it from a decrypted copy changes the digest,
  so the publisher's signature no longer verifies, but the copy stays
  readable unsigned.

## What would change this decision

A way for a Reader to know how a package was delivered, or a delivery method
that none of the three values describes.
