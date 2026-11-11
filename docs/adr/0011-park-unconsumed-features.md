# 0011 — Park features that have no consumer

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Four parts of 0.3 had no consumer, and each one cost every Reader port
something:

- **Agent Skills.** This covered core `skills/` handling and the signing gate
  as well as the profile. It carried instructions for an agent to act on
  inside a knowledge package, which made it the widest prompt-injection
  surface in MOCA.
- **The claims profile** (nanopublications).
- **The EU AI Act data-governance profile.** It overlapped SPDX 3.0's Dataset
  profile and Croissant's Responsible AI vocabulary.
- **The OCI transport binding.** It was specification only, and OCI tooling
  already carries any directory.

None of them passes the admission test
([ADR-0001](0001-three-pillars-and-admission-test.md)).

## Options

1. Keep them as optional profiles.
2. Remove them until a consumer appears.

## Decision

Option 2. **All four were removed in 0.4.**

**`skills/` is an ordinary directory.** It is covered by the digest like any
other, and is never exposed specially. `A005` and `K001` are retired; codes
are never reused.

**Unrecognised profiles.** A package that still declares one of the removed
profiles is read as core, and `F001_PROFILE_UNRECOGNISED` (info) is reported.

**Coming back.** Any of them returns through a new ADR that names two use
cases.

## Consequences

- The specification, the Reader and the corpus are smaller.
- Packages that used `skills/` lose the signed-skill guarantee. An
  application that needs skills should ship them as its own code, not as
  package content.

## What would change this decision

A real consumer and a second use case for one of the parked features.
