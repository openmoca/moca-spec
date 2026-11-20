# 0039 — OpenMOCA Conformant and the OpenMOCA Commitment

- **Status:** Proposed
- **Date:** 2026-11-19 (reworked 2026-11-20 with the owner: two audiences, two
  marks, and the names)
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))
- **Supersedes in part:** [ADR-0037](0037-a-named-host-claim-for-creators-terms.md):
  the host claim becomes the OpenMOCA Commitment, a signed declaration rather
  than a tested claim; its harness design may come later as an optional
  self-check

## Context

Two different people ask two different questions.

- **Someone building with OpenMOCA, or checking software that does** (a
  security team, a company choosing a Reader, a packaging tool or a linter):
  does this software read, make or check packages exactly as the
  specification says? The test suites answer that.
- **Someone using an app:** will this app honour what the creator asked, and
  what I asked? That matters most, and it is hard to test from outside. What
  people need is a clear, public promise from a named company that they can
  hold it to.

## Decision

Two marks, one for each audience. Neither is registered as a trade mark.

### OpenMOCA Conformant: for software

A listing on openmoca.org of software that passes the OpenMOCA test suite for
what it is: a **Reader**, a **Producer** (package creator), a **linter**, and
other kinds as test suites exist for them. Each entry names the software, its
version, the specification version and the suite it passed, and has one of
three standings:

| Standing | Means |
| --- | --- |
| **Official** | The project's own software, such as its Readers and tools |
| **Verified** | The project has re-run the suite against that version itself (for partners) |
| **Self-tested** | The maker ran the public suite and published the result |

A result covers one version. An entry that fails when re-run is removed.

### The OpenMOCA Commitment: for people

A company signs a statement that a named product and version honours
creators' and people's rules as the specification sets out, and it is listed
on openmoca.org. **OpenMOCA does not test it.** The statement is the
company's own public commitment; it is what a person or a creator can point
to if they challenge the company. Listed products may show the Commitment
mark in their apps.

What the Commitment covers is written twice, in
[COMMITMENT.md](../../COMMITMENT.md): **for people**, in plain words, and **for
companies**, as the precise list of what the specification asks of a host,
for creators' terms and for people's own rules.

The signed statement names the company, the product, the versions covered,
the date, the models and destinations the product uses, the set-ups covered,
and a contact for challenges, and is signed with the attestation format
packages use. A new version needs a new statement. OpenMOCA removes a listing
that is withdrawn or shown to be untrue, and never tests, audits or
guarantees a product.

### Order

1. OpenMOCA 0.7.0.
2. The listing page on openmoca.org for both marks, the signed statement's
   shape, and the Commitment mark artwork.
3. The project's own software listed as Official; the project's own apps
   make the Commitment first.

All part of the 1.0 release; step 2 and 3 may land before.

## Consequences

- People get one plain promise to look for; builders get a clear listing of
  what software passes which suite.
- The project does not take on testing apps; the Commitment rests on the
  company's signed word.
- TRADEMARKS.md's "Claiming conformance" section is updated to match.
- Whether a signed public statement can be enforced is a question of each
  country's law; the project says what the statement is, not what legal
  effect it has.
- A person's settings are applied through the host level, so a record shows
  `decidedBy: host` where the person chose; a distinct `person` level can come
  in a later version.

## How we'll know it works

- Products making the Commitment, and independent ones, not only ours.
- Conformant software listed, by kind and standing.
- Challenges reported, and how they were resolved.
- Whether people recognise the Commitment mark and know what it means.

## What would change this decision

- Commitments being broken without consequence: add the host tests as a
  requirement.
- Demand for more kinds of conformant software: add a suite, then a kind.
