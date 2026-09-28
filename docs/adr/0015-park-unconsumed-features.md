# 0015 — Park features that have no consumer

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))
- **Supersedes:** [0005](0005-oci-transport-binding.md)

## Context

Four parts of 0.3 have no consumer, and each one costs every Reader port
something:

- **Agent Skills.** This covers core `skills/` handling and the signing gate
  as well as the profile. It carries instructions for an agent to act on
  inside a knowledge package, which makes it the widest prompt-injection
  surface in MOCA.
- **The claims profile** (nanopublications).
- **The EU AI Act data-governance profile.** It overlaps SPDX 3.0's Dataset
  profile and Croissant's Responsible AI vocabulary.
- **The OCI binding.** It is specification only, and OCI tooling already
  carries any directory.

None of them passes the admission test
([ADR-0011](0011-three-pillars-and-admission-test.md)).

## Decision

**Remove all four from 0.4.** They remain in the history, at tag
`v0.3.0-alpha.1`.

**`skills/` becomes an ordinary directory.** It is covered by the digest like
any other, and is never exposed specially. `A005` and `K001` are retired;
codes are never reused.

**Unrecognised profiles.** A package that still declares one of the removed
profiles is read as core, and `F001_PROFILE_UNRECOGNISED` (info) is reported.

**Coming back.** Any of them returns through a new ADR that names two use
cases.

## Consequences

- The specification, the Reader and the corpus shrink.
- Packages that used `skills/` lose the signed-skill guarantee. An
  application that needs skills should ship them as its own code, not as
  package content.

## What would change this decision

A real consumer and a second use case for one of the parked features.
