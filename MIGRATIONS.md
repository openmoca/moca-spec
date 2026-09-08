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

## `moca-lint` now cryptographically verifies `signature`, retiring `I404`

**What changed:** Pass 4's `I404_SIGNATURE_NOT_VERIFIED` informational code
(present but not implemented) is retired. `moca-lint` now performs real
Sigstore/DSSE verification via [`tools/moca-sign`](tools/moca-sign/README.md),
per [docs/trust-model.md](docs/trust-model.md), and reports one of three new
hard-error codes when a `signature` object is present but does not verify:
`E404_SIGNATURE_MALFORMED`, `E406_SIGNATURE_INVALID`,
`E407_SIGNATURE_VERIFICATION_INDETERMINATE`. `E401_UNSIGNED_SKILLS` (no
`signature` object at all) is unchanged. See [CHANGELOG.md](CHANGELOG.md).

A related, additive change: `canonicalDigest` (core §5.5) now excludes the
`signature` property from its manifest hash, the same self-reference reason
it already excluded `canonicalDigest` itself — a signature signs over
`canonicalDigest.value`, so that value cannot depend on the signature being
computed from it. No previously-shipped example combined both fields before
this release, so no existing `canonicalDigest.value` changes as a result.

**Who's affected:** Any package with a `signature` object — most commonly
one containing `skills/`, since core §8.2 requires `signature` there.

**What to do:**

- A signed package MUST also declare `canonicalDigest` (docs/trust-model.md
  §2); a `signature` without one now reports `E404_SIGNATURE_MALFORMED`.
- Pass `--trust-root <path>` (and, for `sigstore` mode, optionally
  `--identity-constraint`) to `moca-lint lint`/`pack`/`extract --lint` — a
  `dsse`-mode signature reports `E406_SIGNATURE_INVALID` without one.
- A package still carrying the placeholder value
  `"PLACEHOLDER-NOT-A-REAL-SIGNATURE-DO-NOT-TRUST"` (this repo's own
  examples used it prior to this release) now fails with
  `E404_SIGNATURE_MALFORMED` instead of only the previously-informational
  `I404`. Sign it for real with `moca-sign` (see
  [tools/moca-sign/README.md](tools/moca-sign/README.md)).

**No action needed if:** your package declares no `signature` object at all
(a package without `skills/` is never required to have one).
