# 0017 — `reviewed` means signed and approved

- **Status:** Accepted
- **Date:** 2026-11-10
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Up to 0.5, a package earned the `reviewed` capability when its pages carried
review attestations, whatever they said. A review that found a page
inaccurate still counted, and so did reviews in an unsigned package, where
anyone could have added them.

## Options

1. Keep the 0.5 meaning: reviews are present.
2. Strict: the package is signed, and every reviewed page has a current
   `accurate` review and no current review against it.
3. Report review outcomes per page, with no package capability.

## Decision

Option 2 ([package spec §11](../../spec/moca-package-spec.md#11-capabilities)).

- `reviewed` needs a valid package attestation (from a key whose `ids` cover
  the package, [ADR-0015](0015-relations-need-a-scoped-signer.md)) and every
  reviewed page approved.
- Each page gets a `reviewStatus`: `approved`, `disputed`, `unverified`
  (reviews in an unsigned package) or `none`. Every counting review stays in
  the citation record with its outcome, and `packageVerified` says whether
  the package carrying it is signed.
- The latest review from each signer counts. A review dated in the future is
  ignored, with `A007_REVIEW_DATE_FUTURE`. A trust-root key may list the
  `reviewers` it may sign as.
- A missing review is not evidence of anything.

## Consequences

- `reviewed` can be relied on: it never hides a negative review.
- Simple unsigned packages are unaffected: their OKF `verified` and `status`
  work as before. They cannot earn `reviewed`.
- Applications should show `disputed` and `unverified` as such.

## What would change this decision

A need for reviews that count without a package signature, with another way
to know who added them.
