# Versioning and Release

## Current Release

This repository is preparing the first public beta:

- Repository and specification release: `0.1.0-beta.1`
- `moca-lint` release: `0.1.0-beta.1`
- `moca-convert` release: `0.1.0-beta.1`
- `moca-index` release: `0.1.0-beta.1`
- `moca-sign` release: `0.1.0-beta.1`
- Git tag: `v0.1.0-beta.1`

This is a beta of the format and reference tooling, not a promise that the
MOCA specification is stable. Consumers should expect feedback from the POC
SDK and real-world packages to change the specification before `1.0.0`.

## Versioned Artifacts

The release version applies to the repository as a coordinated specification
and tooling snapshot. It does not replace the `version` field in a package's
`moca.json`. That field identifies the package's content version and remains
independent of the MOCA specification release and the `moca-lint` version.

Profiles have their own versioned profile URIs. A package declares the profile
URI it uses in `profile`; the URI identifies the profile vocabulary and
contract, while the repository release identifies the snapshot containing the
profile documentation and schema.

## Semantic Versioning Policy

The project follows Semantic Versioning for released repository snapshots:

- `0.x` means the format is not yet stable and breaking changes may occur.
- `0.1.0-beta.N` identifies an incrementing beta pre-release of the `0.1`
  contract. Changes between beta releases may still require package or SDK
  updates.
- The patch component is for compatible corrections and documentation or
  tooling fixes that do not intentionally change the package contract.
- The minor component may introduce additive fields, checks, profiles, or
  capabilities during the `0.x` period.
- A change that removes or changes the meaning of an existing requirement must
  be called out in the changelog and [migration notes](../MIGRATIONS.md), even
  when semver permits it under `0.x`.
- `1.0.0` will require an explicit stability review, versioned normative
  schemas, compatibility expectations, and a documented migration policy.

## Conformance and Versioning

Conformance level is derived from package contents and validation results; it
is not stored in `moca.json` and is not part of the release version. A package
must not claim a higher capability level merely because it was created with a
newer repository release.

The beta linter is an offline reference implementation. Its findings and
supported checks are part of the beta tooling contract, but an informational
finding does not establish cryptographic trust or full conformance to an
external standard.

## Release Checklist

The operational runbook — npm setup, publish order, dist-tags, provenance,
post-publish verification, and what to do when a bad version ships — is
[releasing.md](releasing.md).

In summary, a release is two artifacts cut together:

- **the specification snapshot** — `spec/`, `schemas/`, `profiles/`,
  `examples/`, `conformance/`, captured as an annotated git tag and published
  to no registry;
- **the reference tooling** — the four `@openmoca/*` CLIs, published to npm.

Nothing is tagged before `npm test` passes and the packed tarballs have been
installed into an empty project and run.

## After the POC

The Framework-Agnostic MOCA SDK Standard and its first SDK implementation are
expected to test the assumptions in this beta. Findings from that work should
be captured as specification changes, compatibility notes, or a new beta
release before the format is promoted to `1.0.0`.
