# 0039 — A conformance programme and an implementations registry

- **Status:** Proposed
- **Date:** 2026-11-19 (refined the same day after an independent critique)
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))
- **Builds on:** [TRADEMARKS.md](../../TRADEMARKS.md) ("Claiming conformance"),
  [ADR-0037](0037-a-named-host-claim-for-creators-terms.md) (the named host claim)

> Anyone can implement OpenMOCA. Anyone can claim conformance by publishing a
> signed, reproducible passing result. Anyone can verify or challenge that
> claim.

## Context

The conformance corpus is open, free to run and versioned with the
specification. TRADEMARKS.md lets anyone claim "OpenMOCA conformant" for a
named version if their software passes the corpus, checked by the claimant,
with no fee and no application. ADR-0037 adds one named, self-certified claim
for hosts. Optional features (such as `encryption` and `sigstore`) let a Reader
skip the cases for what it does not implement (Reader contract §14).

What is missing is a public place to find implementations, a record of what
each one passed that a machine can check, and rules for listing, retesting,
challenging and withdrawing. Creators and people choosing an app need to see
which implementations read packages correctly and apply creators' terms;
developers need a clear target. Independent reviews of 0.7.0 (2026-11-19)
recommended such a programme and then critiqued this plan; their refinements
are folded in below.

## Options

1. Keep conformance claims as they are, with no public list.
2. **A public registry of self-certified, signed, reproducible results, with
   capabilities shown one by one.**
3. Independent certification by the maintainer or a body before any listing.

## Decision

Option 2: the **OpenMOCA Conformance Programme** and the **OpenMOCA
Implementations Registry**.

**Open to implement; conformance is earned and verifiable.** Nobody needs
permission to implement OpenMOCA or to describe their software as working with
it. A conformance claim, and its listing, need a signed result anyone can
reproduce. OpenMOCA publishes the rules, the tests and the evidence; it does
not decide which software may exist.

### What each level means, and what it does not

| Level | Means | Does not mean |
| --- | --- | --- |
| **Listed** | The implementation is in the registry, with its role, versions and declared capabilities | Any conformance claim |
| **Conformant** | The claimant has published a valid signed record of a passing run for a named build and specification version, under the published rules | That OpenMOCA ran or witnessed the tests |
| **Reproduced** (shown on Conformant entries) | Someone other than the claimant re-ran the same corpus against the same build and got matching results; each rerun is itself a signed record | That the implementation is secure |
| **Independently assessed** (later, optional) | A named reviewer also checked behaviour the corpus cannot see, such as key handling or what a host sends to a model | A requirement for any other level |

**Passing the corpus is not a security audit.** The registry says so on every
page: an implementation can pass every case and still mishandle keys or send
content where a creator's terms do not allow it.

### Capabilities, defined centrally

- **The vocabulary is the specification's,** versioned with it: the core, and
  each optional feature the Reader contract and the corpus define (today
  `encryption` and `sigstore`; narrower features may be split out where a real
  implementation needs it, never invented by a claimant).
- **The core is never skippable.** Declaring an optional feature absent skips
  only the cases that require that feature.
- **Declaring a feature means passing all of its cases,** the hostile and
  negative ones included.
- Each capability shows `passed`, `not implemented` or `not tested`; the last
  two are different statements, and neither is a failure of the core.

### Roles, and implementation versus deployment

Each entry has a role: **Reader**, **Producer**, or a **host** making the
ADR-0037 claim. A component claims conformance only for the role and
capabilities it implements and has tested. Software that uses a conformant
Reader (an MCP server, an app) names that dependency but does not inherit its
status. A deployed service is listed separately from the software it runs.

**The host claim stays separate** from technical conformance, shown as
"declared by the operator", and is a signed statement about a defined
deployment or configuration (which models and destinations it covers), not a
promise about every use of a product.

### The signed conformance record

The conformance runner writes a record of a run; the claimant signs it as an
attestation with its own predicate type,
`https://w3id.org/moca/attestation/conformance/v1`, so it can never be taken
for a package attestation. The signature covers a canonical form of the whole
record:

- the record schema version;
- the implementation's name, role and version;
- the artifact digest of the build tested, the source commit, whether the
  working tree had uncommitted changes, submodule commits, and a digest of the
  dependency lock file;
- the specification version and digest, and the corpus version and digest;
- the runner and adapter versions;
- the result for the core and for each feature, with the cases run, passed,
  failed and skipped;
- the date, and the signer (an Ed25519 key or a Sigstore identity).

A signature shows control of a key, not the legal identity of the developer
named. A record is about one build: a newer release never inherits it. If a
signing key is later compromised or retired, the record stays in the history
and the registry shows the key's current status.

### The adapter is part of the trust chain

A separate **adapter contract**, with its own tests, says what an adapter must
return. The runner validates every adapter result against that schema and
treats a missing or malformed result as a failure, never as a skip.

### The registry

A page on openmoca.org built from the records, and the same data as JSON.
Each entry shows its role, the build tested, the specification and corpus
version, each capability's result, the record and run output, the last tested
date and how old that is, and its status. It distinguishes the latest release,
the latest tested release and the latest conformant build. It starts with the
project's own implementations: the four Readers, the MCP servers and the
tools, with their real results and known limits.

| Status | Meaning |
| --- | --- |
| Listed | An entry with no conformance claim |
| Conformant | A valid signed passing record exists for the named build and version |
| Contested | A reproducibility or validity concern is being investigated |
| Suspended | A material, reproduced concern means the claim is not shown as valid |
| Withdrawn | The claimant or the programme has withdrawn the claim |
| Superseded | A newer record has replaced this one as the current listing |

History stays visible: no record is ever changed to look as if another build
was tested.

**Challenges.** Anyone may challenge a record, naming the record, the build,
the corpus and runner versions, the environment and adapter, the failing
cases, and what they saw. The maintainer acknowledges it; the claimant can
reproduce and respond; the results are published; the record is kept,
corrected, suspended or withdrawn. A challenge is not an accusation, but a
serious, reproduced failure is not shown as an unqualified Conformant result
while it is looked into.

### Words and marks (added to TRADEMARKS.md)

| Wording | Means |
| --- | --- |
| OpenMOCA compatible | Works with OpenMOCA in some way; not necessarily tested |
| OpenMOCA Listed | In the registry; no conformance implied |
| OpenMOCA conformant | A signed passing record for a named version and declared capabilities |

The conformant badge links to the signed record for the build it names. A
listed entry may not use a mark that looks like it. There is never a fee for a
technical decision.

### The corpus is a product too

- Every confirmed conformance bug becomes a permanent regression case.
- Normative requirements are mapped to the cases that test them, extending
  today's traceability check (every diagnostic code has a case) to the
  requirements themselves; uncovered requirements are listed.
- Cases cover interactions between features, not only each feature alone:
  composition with terms, encryption with sidecars, issued copies with
  composition, citations with per-node rights, signatures with trust-root
  changes.
- New cases are checked against a deliberately broken implementation, to show
  they fail where they should (as was done for the composition-terms cases).

### When

The programme is part of the 1.0 release. This ADR, the runner's record, the
sign-and-verify tool and the first entries may land before 1.0, while the
specification is finalised, starting with 0.7.0.

## Consequences

- Creators and people get a public, checkable list; developers get a clear
  target and a badge they can earn.
- The runner gains a `--record` output and adapter-result validation; a small
  tool signs and verifies records, explaining any failure.
- The registry needs upkeep: the maintainer reviews submissions for form,
  re-runs a sample, and handles challenges within a stated time.
- Self-certification can be false. The remedies are the published record,
  reproduction by others, challenge and withdrawal, as in ADR-0037.

## How we'll know it works

- **Adoption:** independent implementations (not the project's own), the
  languages and roles represented, and the time from a first run to a
  conformant record.
- **Interoperability:** a matrix of which Producers' packages and sidecars
  which Readers open; real-world interoperability failures reported, and the
  time to resolve them.
- **Trust:** the share of records independently reproduced, the agreement rate
  of reruns, records with complete build identity, challenges, suspensions and
  withdrawals, and the median time to resolve a challenge. Zero challenges is
  not the target: it may mean nobody is checking.
- **Corpus quality:** requirements with and without a case, cross-feature
  cases, regression cases added per release, and broken-implementation checks
  that failed as they should.
- **Creator and people value:** whether creators can find Readers that apply
  their terms, and whether people can tell a conformant Reader from an
  untested one; from occasional surveys and totals only, never tracking.

## What would change this decision

- Evidence that self-certified records are being gamed: re-run every
  submission ourselves before showing it as Conformant.
- An independent body ready to run assessments: add the optional third level.
- A real implementation that needs a narrower capability than the
  specification defines: split that optional feature in a minor release.
