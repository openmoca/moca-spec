---
name: Profile proposal
about: Propose a new MOCA profile
title: "[Profile] "
labels: profile-proposal
---

## Purpose

<!-- What the profile is for, and who will use it. -->

## Why core and existing profiles are not enough

## Proposed profile

- **URI**: `https://w3id.org/moca/profiles/<name>/v1` (or your own domain)
- **Package-level data** under `profiles["<uri>"]`:
- **Node-level data** under `moca.profiles["<uri>"]`:
- **Files or directories** the profile adds to a package:
- **What a Reader that recognises it does differently**:

## Additive only

<!-- Confirm that a core-only Reader loses nothing it needs, that no core field
     changes meaning, and that no top-level manifest key is added.
     See spec/moca-package-spec.md §9. -->

## Example

```json
{ "profiles": { "https://w3id.org/moca/profiles/<name>/v1": {} } }
```
