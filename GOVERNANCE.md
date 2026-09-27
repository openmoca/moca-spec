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

- **Core spec changes** (edits to `spec/moca-core-spec.md`, `schemas/v1/core/`):
  highest scrutiny, since they affect every profile and every conformance
  level. Require an issue discussing rationale before a PR is merged.
- **Profile additions** (new `moca-<name>-profile.md` files, or additions to
  an existing profile): lighter weight, since profiles are additive-only
  by construction ([core §11.2](spec/moca-core-spec.md#112-graceful-degradation),
  [§11.4](spec/moca-core-spec.md#114-profile-restrictions)) and cannot break
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

Through `1.0.0`, MOCA is developed as a **single repository**,
`openmoca/moca-spec`. It contains:

| Area | Contents |
|---|---|
| Specification | `spec/moca-core-spec.md` and the normative satellite specifications (sidecar index, trust model) |
| Schemas | JSON Schemas and JSON-LD contexts under `schemas/` |
| Profiles | Self-contained profile bundles under `profiles/` (see Profile Graduation above) |
| Examples | Static fixture packages under `examples/` |
| Tools | The reference CLIs under `tools/` — `moca-lint`, `moca-convert`, `moca-index`, `moca-sign` — which are the Producer-class authoring tooling ([SDK contract §1.2](spec/moca-sdk-contract.md#12-conformance-classes)) |
| Conformance | The shared, language-neutral test corpus every SDK and Knowledge Harness validates against |

This is deliberate rather than incidental. The specification, its schemas, and
the conformance corpus must change together, and splitting them would turn
every specification change into a multi-repository coordination problem for a
solo-maintained project. The conformance corpus is what keeps implementations
in different languages consistent, so it lives with the specification it
tests.

Components graduate to their own repositories on the same triggers described
under [Profile Graduation](#profile-graduation): an independent maintainer
group, a genuinely independent release cadence, or size that makes the core hard
to navigate.

Several categories live outside this repository from the start, because they
carry third-party dependency surfaces and release cadences the specification
should not inherit
([ADR-0003](docs/adr/0003-knowledge-harness-implementations.md)):

| Repo | Purpose |
|---|---|
| `openmoca/moca-knowledge-harness-dotnet` | The Knowledge Harness for .NET — first implementation |
| `openmoca/moca-knowledge-harness-python` | The Knowledge Harness for Python — second |
| `openmoca/moca-knowledge-harness-typescript` | The Knowledge Harness for TypeScript — third |
| `openmoca/moca-integrations-*` | Framework adapters and the MOCA MCP server — LangChain, LlamaIndex, MCP, Microsoft Agent Framework |
| `openmoca/moca-example-end-to-end` | The reference AI Harness and full end-to-end demonstration |
| `openmoca/moca-profile-education` | The education profile, graduated from `profiles/education/` |

None of these is published yet. Conformance fixtures are never vendored into a
dependent repository; they are consumed from this one, pinned to a released
version. Specification findings from an implementation are filed as issues
here.
