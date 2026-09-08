# Governance

MOCA is currently maintained by a single maintainer. This document describes
today's lightweight process and the intended path to formalize it as the
project grows.

## Current Model

- **Solo maintainer**: one person has final say on all changes across the
  `openmoca` org. There is no steering committee or formal voting process
  yet.
- **Decisions happen in the open**: proposals go through GitHub issues and
  PRs in the relevant repo (see [CONTRIBUTING.md](CONTRIBUTING.md)), not
  private discussion.

## Decision Process

Different kinds of changes get different scrutiny:

- **Core spec changes** (edits to `moca-core-spec.md`, `schemas/core/`):
  highest scrutiny, since they affect every profile and every conformance
  level. Require an issue discussing rationale before a PR is merged.
- **Profile additions** (new `moca-<name>-profile.md` files, or additions to
  the education profile): lighter weight, since profiles are additive-only
  by construction ([core §11.2](moca-core-spec.md#112-graceful-degradation),
  [§11.4](moca-core-spec.md#114-profile-restrictions)) and cannot break
  existing core-only consumers. Still require an issue first.
- **Examples, schemas, docs, tooling**: normal PR review, no separate
  proposal step required unless the change implies a spec interpretation
  question.

## Path to Formalizing

As the project grows beyond solo maintenance, expect this document to add:
co-maintainers with defined areas of ownership, a lightweight RFC process
for core changes, and a public profile registry. None of that exists yet —
this section exists so contributors know it's anticipated, not to describe a
timeline.

## Profile Graduation

New profiles start as a self-contained `profiles/<name>/` directory containing
`moca-<name>-profile.md`, `profile.schema.json`, and its `examples/` inside
this repo, alongside core. This is deliberate while the project is
solo-maintained and both core and profiles are still evolving during the beta:
it keeps core/profile changes reviewable in a single PR and validated by one
CI run, instead of coordinating across repos.

A profile MAY later graduate to its own `openmoca/profile-<name>` repo, once
any of the following becomes true:

- It gains an independent maintainer or contributor group distinct from
  core's.
- It needs its own release/versioning cadence, decoupled from core's.
- The number of profiles in this repo makes core itself hard to navigate.

Graduation is a non-breaking move for existing consumers: a profile's
identity is its URI (e.g. `https://openmoca.org/profiles/education/v1`,
declared in a package's `profile` array), not its repo location. Copying the
profile directory to a new repo does not change that URI or require any
already-published package to change. When a profile graduates, this repo keeps
a short pointer to the new repo in place of the local directory.

## Repository Layout (`openmoca` org)

The project is split across multiple repositories by concern:

| Repo | Purpose |
|---|---|
| `openmoca/moca-spec` (this repo) | The specification itself, JSON Schemas, JSON-LD contexts, and static example/fixture packages. No executable harness code. |
| `openmoca/sdk-dotnet` | .NET harness SDK for consuming MOCA packages, plus its own runnable code samples. |
| `openmoca/sdk-python` | Python harness SDK for consuming MOCA packages, plus its own runnable code samples. |

`sdk-dotnet` and `sdk-python` are not yet built. Static MOCA package fixtures
used for conformance testing live in `moca-spec/examples/` and are not
duplicated into the SDK repos — SDKs depend on this repo's schemas and
examples rather than vendoring copies.
