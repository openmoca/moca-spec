# Governance

MOCA (Modular Ontology, Content & Attestation) is an open specification
maintained by one person today. It becomes a
standard only when independent parties implement it; until then this document
describes a deliberately light process and how it will grow.

## Current model

- **One maintainer** has final say across the `openmoca` organisation.
- **Decisions happen in the open**, in GitHub issues and pull requests.
- **Significant decisions are recorded** as [ADRs](docs/adr/README.md), each
  with the evidence that would change it.

## How changes are decided

| Change | Process |
| --- | --- |
| Normative specification (`spec/`, `schemas/`) | Issue first, using the spec-change template. A pull request updates prose, schema, reference Reader and conformance cases together. |
| Diagnostic codes or conformance cases | Treated as specification changes: codes and expected results are the contract. |
| New profile | Issue using the profile template. Profiles are additive by construction ([package spec §9](spec/moca-package-spec.md#9-profiles)). |
| Examples, docs, tools | Normal pull-request review. |

## Path to a standard

The project will add co-maintainers with named areas, and a lightweight RFC
process for normative changes, once there is a second independent
implementation or adopter.

`1.0.0` comes when the format has settled and is used beyond its maintainer.
The signs we look for: an implementation written by someone else passes the
conformance corpus, an organisation other than the maintainer's uses MOCA
packages in production, and evidence from the
[outcome evaluation](docs/plans/01-outcome-evaluation.md) shows where it helps.
They guide the decision; they are not a checklist.

The project will also offer the package layer to the OKF maintainers as a
companion specification. If OKF adopts packaging itself, MOCA will align with it
or retire ([ADR-0002](docs/adr/0002-package-layer-over-okf.md)).

## Trade marks

The name OpenMOCA and its logo are held by PI & Mash Solutions Ltd on behalf
of the project, under the [trade mark policy](TRADEMARKS.md). The policy
applies to everyone in the same way, including the maintainer's own products.
It exists so that "OpenMOCA" and "OpenMOCA conformant" can be trusted. If
adoption grows, the project will consider moving the marks to a neutral
foundation.

## Repository layout

This repository holds the specification, schemas, profiles, examples and the
conformance corpus, because they must change together.

| Lives here | Lives in its own repository |
| --- | --- |
| Specification, schemas, profiles | Readers, one per language, starting with the reference Reader ([moca-reader-typescript](https://github.com/openmoca/moca-reader-typescript)) |
| Examples | The MCP server ([moca-mcp-dotnet](https://github.com/openmoca/moca-mcp-dotnet)), converters ([moca-convert](https://github.com/openmoca/moca-convert)) and command-line tools ([moca-tools](https://github.com/openmoca/moca-tools)) |
| Conformance corpus | Framework bindings, in each Reader's repository |

A specification change that needs Reader code lands as a pair of pull
requests, here and in the reference Reader (see [CONTRIBUTING.md](CONTRIBUTING.md)).

Other repositories consume the conformance corpus from here, pinned to a
release, and never copy it. Findings from implementations are filed here as
issues.

## Profiles outside this repository

A profile's identity is its URI, not its location, so a profile can move to
its own repository without affecting packages. A profile moves out when it has
its own maintainers or release cadence. External profiles are listed in the
[profile registry](profiles/README.md).
