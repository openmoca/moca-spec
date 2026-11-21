# 0032 — `isPartOf` is a core relation, and unknown relation types are reported

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A release of a series could not point back to the series. Relation types
other than the core four were kept silently, so a typo or an invented type
went unnoticed ([issue #10](https://github.com/openmoca/moca-spec/issues/10)).

## Options

1. `isPartOf` in a profile.
2. `isPartOf` as a core type with no effect, and an info diagnostic for any
   type that is neither core nor defined by a declared profile.

## Decision

Option 2 ([package spec §7.2](../../spec/moca-package-spec.md#72-relations)).

- The name follows Dublin Core's `dcterms:isPartOf` and schema.org's
  `isPartOf`. It is reported and has no effect: the series' `members`,
  pinned by digest, is what composes it. A back-link without `version`
  stays true as the series grows.
- A profile for one type would make every release declare a profile to avoid
  a diagnostic.
- `R005_RELATION_TYPE_UNKNOWN` is info. It is not reported when the package
  declares a profile the Reader does not recognise, because the Reader cannot
  tell which types that profile defines.
- Series guidance (package spec §7.3) covers versions, order, topics, long
  series, and free and members-only releases. Suggested node types are an
  informative list on openmoca.org, like app types
  ([ADR-0026](0026-apps-is-a-hint.md)).

## Consequences

- Packages with invented relation types now see `R005`; nothing else changes
  for them.

## What would change this decision

A relation type with an effect that a series needs, which would come with its
own authorisation rule, as `supersedes` has
([ADR-0015](0015-relations-need-a-scoped-signer.md)).
