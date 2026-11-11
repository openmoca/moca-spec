# 0015 — Relations that retire or contest need a scoped signer

- **Status:** Accepted
- **Date:** 2026-11-10
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A `supersedes` relation marks another package's nodes `superseded`, and
`conflictsWith` marks them `contested`. Both change what a host retrieves by
default. Up to 0.5, any loaded package could declare either against any
other, even an unsigned one. A package `id` is a name the package gives
itself, so the relation proved nothing about who may retire another
publisher's content.

## Options

1. Scope signing keys: a trust-root key or Sigstore identity lists the
   package ids it may speak for, and a retiring relation takes effect only
   when the declaring package is signed by a key whose scope covers the
   target.
2. Require the same signer on both packages. This blocks a successor
   published by a new team or key.
3. Leave relations ungated and document the risk.
4. Leave the choice to each host, with no default.

## Decision

Option 1, with a small part of option 4.

- Trust-root keys and Sigstore identities get an optional `ids` list
  ([attestations §6](../../spec/moca-attestations.md#6-trust-roots)). An entry
  covers an id when it equals it, or when it ends in `/`, `:` or `#` and the
  id starts with it. There are no patterns.
- A `supersedes` or `conflictsWith` takes effect only when the declaring
  package has a valid package attestation from a key or identity whose `ids`
  cover the target's `id`
  ([package spec §7.2](../../spec/moca-package-spec.md#72-relations)).
  Otherwise it is preserved, reported as `R004_RELATION_UNAUTHORISED`
  (info), and has no effect.
- A host option, off by default, applies relations from unsigned or
  unscoped packages. It is for a library of the host's own packages.

## Consequences

- A package can no longer remove another publisher's content from default
  retrieval by naming it.
- Authors who use `supersedes` or `conflictsWith` must sign, and the host's
  trust root must scope the key. Unsigned relation fixtures and examples were
  signed in the same change.
- The same scope can later flag a signed package that claims an id its key
  does not cover.

## What would change this decision

A real need for cross-publisher retirement that a scoped key cannot express.
