---
name: Profile proposal
about: Propose a new MOCA profile
title: "[Profile] "
labels: profile-proposal
---

## Domain

<!-- What domain/use case is this profile for? e.g. legal research,
     customer support, healthcare documentation -->

## Why existing profiles don't cover this

<!-- Why can't this be expressed with MOCA Core alone or an existing
     profile? -->

## Proposed additions

- **New ontology roles** (namespaced, e.g. `mydomain:taxonomy`):
- **Extended epistemic-status values**:
- **New `profileData.<profile-name>` fields**:
- **Expected `augmentation.targetType` values** (if any):

## Conformance to core §11.4

<!-- Confirm this profile is purely additive: it does not redefine any core
     field/vocabulary term, does not introduce top-level manifest properties
     outside profileData, and does not change any core-required/optional
     field. See moca-core-spec.md §11.4. -->

## Example manifest snippet

```json
{
  "profile": ["https://openmoca.org/profiles/<name>/v1"]
}
```
