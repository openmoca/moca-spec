# Architecture Decision Records

An ADR records a decision that shaped the specification, together with the
options that were rejected and why. It exists so that a future reader — or a
future maintainer arguing the opposite case — can see the reasoning rather than
re-deriving it from the outcome.

ADRs are **not normative**. The normative documents are in
[`spec/`](../../spec). An ADR explains why a normative document says what it
says; where the two disagree, the specification wins and the ADR is stale.

## When to write one

Write an ADR when a decision is architectural, contested, and hard to reverse:

- Adopting, deferring to, or declining an external standard.
- Drawing or moving the Core/profile boundary.
- Choosing a transport, integrity, or trust mechanism.
- Deciding *not* to build something, where the absence needs justification.

Do not write one for ordinary spec changes. Those go through the issue → PR
process in [CONTRIBUTING.md](../../CONTRIBUTING.md#proposing-a-core-spec-change),
and their rationale is recorded in the issue.

## Format

[MADR](https://adr.github.io/madr/)-style: Status, Context, Decision Drivers,
Considered Options, Decision Outcome, Consequences. Filenames are
`NNNN-kebab-case-title.md`, numbered sequentially and never reused.

Status is one of `Proposed`, `Accepted`, `Rejected`, `Superseded by NNNN`. An
accepted ADR is never edited to reflect a later reversal — supersede it with a
new record instead, so the history of the reasoning survives.

## Index

| # | Title | Status |
|---|---|---|
| [0001](0001-moca-spec-vs-oci-artifacts.md) | MOCA as a specification vs. OKF bundles as OCI artifacts | Proposed |
