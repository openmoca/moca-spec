# Profiles

Each subdirectory under `profiles/` is a complete, independently extractable
profile bundle. It contains the profile specification
(`moca-<name>-profile.md`), its JSON Schema (`profile.schema.json`), and one or
more example packages (`examples/`).

Per [Profile Graduation](../GOVERNANCE.md#profile-graduation), extracting a
profile to a separate repository is simply copying its `profiles/<name>/`
directory into that repository. A profile's identity is its URI, not this
repository path, so extracting it does not change already-published packages.

This repository's `moca-lint` validates MOCA Core conformance only. It does not
validate a profile's `profileData` against that profile's schema. A profile MAY
ship or link to separate linting or validation tooling when its owner wants
that; such tooling is out of scope for `moca-spec`.

## Profiles in this repository

| Profile | URI |
|---|---|
| [EU AI Act](eu-ai-act/moca-eu-ai-act-profile.md) | `https://openmoca.org/profiles/eu-ai-act/v1` |

## Graduated profiles

These profiles have moved to their own repositories under
[Profile Graduation](../GOVERNANCE.md#profile-graduation). Their URIs are
unchanged, so packages that declare them need no change.

| Profile | URI | Repository |
|---|---|---|
| Education | `https://openmoca.org/profiles/education/v1` | `openmoca/moca-profile-education` |
