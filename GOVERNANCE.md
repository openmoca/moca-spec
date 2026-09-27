# Governance

MOCA is an open specification maintained by one person today. It becomes a
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
implementation or adopter. Before `1.0.0`:

1. At least one implementation not written by the maintainer passes the
   conformance corpus.
2. At least one organisation other than the maintainer's uses MOCA packages in
   production.
3. The [outcome evaluation](docs/plans/01-outcome-evaluation.md) is published.

The project will also offer the package layer to the OKF maintainers as a
companion specification. If OKF adopts packaging itself, MOCA will align with it
or retire ([ADR-0001](docs/adr/0001-package-layer-over-okf.md)).

## Repository layout

This repository holds the specification, schemas, profiles, examples, the
conformance corpus and the reference tools, because they must change together.

| Lives here | Lives in its own repository |
| --- | --- |
| Specification, schemas, profiles | Framework adapters (LlamaIndex, LangChain, Microsoft.Extensions.DataIngestion) |
| Conformance corpus | Native Readers in other languages, when an adopter needs one |
| Reference Reader and CLIs, MCP server | End-to-end demonstrations |

Other repositories consume the conformance corpus from here, pinned to a
release, and never copy it. Findings from implementations are filed here as
issues.

## Profiles outside this repository

A profile's identity is its URI, not its location, so a profile can move to
its own repository without affecting packages. A profile moves out when it has
its own maintainers or release cadence. External profiles are listed in the
[profile registry](profiles/README.md).
