# 0039 — A conformance programme and an implementations registry

- **Status:** Proposed
- **Date:** 2026-11-19
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))
- **Builds on:** [TRADEMARKS.md](../../TRADEMARKS.md) ("Claiming conformance"),
  [ADR-0037](0037-a-named-host-claim-for-creators-terms.md) (the named host claim)

## Context

The conformance corpus is open, free to run and versioned with the
specification. TRADEMARKS.md lets anyone claim "OpenMOCA conformant" for a
named version if their software passes the corpus, checked by the claimant,
with no fee and no application. ADR-0037 adds one named, self-certified claim
for hosts. Optional features (such as `encryption` and `sigstore`) let a Reader
skip the cases for what it does not implement.

What is missing is a public place to find implementations, a record of what
each one passed that a machine can check, and rules for listing, retesting
and withdrawing. Creators and people choosing an app need to see which
implementations read packages correctly and apply creators' terms; developers
need a clear target. An independent review of 0.7.0 (2026-11-19) recommended
such a programme.

## Options

1. Keep conformance claims as they are, with no public list.
2. **A public registry of self-certified, reproducible results, with
   capabilities shown one by one.**
3. Independent certification by the maintainer or a body before any listing.

## Decision

Option 2: the **OpenMOCA Conformance Programme** and the **OpenMOCA
Implementations Registry**.

**Open to implement; conformance is earned and verifiable.** Nobody needs
permission to implement OpenMOCA or to describe their software as working with
it. A conformance claim, and a listing, need a result anyone can reproduce.

**Two levels now, a third later.**

| Level | Means | How |
| --- | --- | --- |
| Listed | The implementation is in the registry, with its role, versions and declared capabilities | The developer submits an entry |
| Conformant | It passes every corpus case for the core and for each optional feature it declares, for a named specification version | A signed conformance record (below), reproducible by anyone |
| Independently assessed (later) | A named reviewer has also checked behaviour the corpus cannot see, such as key handling or what a host sends to a model | Optional; only once reviewers exist; never required to be listed or conformant |

**Capabilities, not one tick.** Each entry names its role (Reader, Producer,
or a host making the ADR-0037 claim) and shows, for the core and each optional
feature, `passed`, `not implemented` or `not tested`. Not implementing an
optional feature is not a failure.

**A signed conformance record.** The conformance runner writes a record of a
run: the implementation, its version and the digest or commit of the build
tested, the specification and corpus version, the result for the core and for
each feature, the cases run, and the date. The claimant signs it with the
attestation format packages use
([attestations](../../spec/moca-attestations.md)), with its own Ed25519 key or
Sigstore identity. A record is about one build: it says nothing about later
releases.

**The registry** is a page on openmoca.org built from the records, also
published as JSON. Each entry links to its record and run output. It starts
with the project's own implementations: the four Readers, the MCP servers and
the tools, with their real results and known limits.

**Rules** (added to TRADEMARKS.md and GOVERNANCE.md):

- "Listed" never appears as "conformant", and the OpenMOCA mark or
  "OpenMOCA compatible" badge is used only by conformant entries.
- A new specification version needs a new record; old records stay, labelled
  with their version.
- Anyone may report an entry they cannot reproduce. An entry whose result is
  not reproduced, or whose claim is untrue, is marked suspended and then
  withdrawn, with the reason shown. The developer may appeal to the
  maintainer, as set out in GOVERNANCE.md.
- There is never a fee for a technical decision.
- **Passing the corpus is not a security audit.** The registry says so on
  every page: an implementation can pass every case and still mishandle keys
  or send content where a creator's terms do not allow it.

**When.** The programme is part of the 1.0 release. The ADR, the runner's
record and the first entries may land before 1.0, while the specification is
finalised, starting with 0.7.0.

## Consequences

- Creators and people get a public, checkable list; developers get a clear
  target and a badge they can earn.
- The runner gains a `--record` output, and a small tool to sign and verify
  records.
- The registry needs upkeep: the maintainer reviews submissions for form,
  checks a sample by re-running them, and handles reports.
- Self-certification can be false. The remedies are the published record,
  re-running it, and withdrawal, as in ADR-0037.

## How we'll know it works

- Every entry has a record that verifies and a run anyone can repeat.
- Independent implementations join, not only the project's own.
- Reports of unreproducible entries are handled within a stated time.

## What would change this decision

- Evidence that self-certified records are being gamed: move "conformant" to
  re-running every submission ourselves.
- An independent body ready to run assessments: add the third level.
