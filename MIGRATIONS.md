# Migrations

Entries here describe changes to `moca-lint`'s validation behavior that flip
an existing check's pass/fail outcome for a previously-valid or
previously-invalid package — what an affected package or profile author
should actually do about the change, not just what changed. See
[CHANGELOG.md](CHANGELOG.md) for the full, dated history of every change;
this file is a curated subset written for someone acting on one specific
behavior change, not a second changelog.

This project is in **Beta `0.1.0-beta.1`** status; see
[docs/versioning-and-release.md](docs/versioning-and-release.md) for what
compatibility means during the `0.x` line.

## `moca-lint` no longer validates `profileData` against profile schemas

**What changed:** `moca-lint` narrowed its scope to MOCA Core conformance
and structural checks. It no longer inspects or validates a package's
`profileData.<profile-name>` object against that profile's own
`profile.schema.json` (see [CHANGELOG.md](CHANGELOG.md), "Narrowed
repository validation to MOCA Core conformance and structural checks").
`profileData` content is now treated as opaque to core-only validation,
consistent with
[tools/moca-lint/README.md](tools/moca-lint/README.md#profile-support).

**Who's affected:** Anyone who relied on a clean `moca-lint lint` run as
evidence that a package's `profileData` matched its declared profile's
schema.

**What to do:** If you need that check, use (or build) profile-specific
validation tooling instead — profile owners MAY ship or link to their own
validator, as documented in [profiles/README.md](profiles/README.md).
`moca-lint` continues to validate everything else about a profiled package
unchanged: the core manifest schema, content/referential-integrity checks,
and (per [core §11.4](moca-core-spec.md#114-profile-restrictions)) that a
profile stays additive at the structural level `moca-lint` can see.

**No action needed if:** your package doesn't declare a `profile`, or you
were already relying on separate profile-specific tooling rather than
`moca-lint` for `profileData` validation.
