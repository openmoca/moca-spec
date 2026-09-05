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
