# 0037 — A named claim for hosts that honour creators' terms

- **Status:** Accepted; superseded in part by
  [ADR-0039](0039-a-conformance-programme-and-an-implementations-registry.md)
  (2026-11-20): the host claim is now the OpenMOCA Commitment, a signed
  promise rather than a tested claim
- **Date:** 2026-11-16
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))
- **Narrows:** [ADR-0022](0022-applications-get-advice.md)

## Context

[ADR-0022](0022-applications-get-advice.md) turned the rules for applications
and hosts into advice, because applications are not a conformance class and
the corpus cannot test them.

The creator's terms ([ADR-0036](0036-creators-terms-travel-with-the-work.md))
only matter if hosts honour them, and the moment that matters is when a host
sends content to an AI model, plays it, or shows it to a younger audience. A
Reader can expose the terms and gate a result set, and the corpus tests that.
It cannot see where a host sends what it gets. Creators need a way to tell a
host that honours their terms from one that does not.

ADR-0022 names what would change it: applications built by many parties that
need a shared, testable bar. This is such a case, for one narrow behaviour.

## Options

1. Keep the rules for hosts as advice only.
2. A full Host conformance class inside the corpus.
3. One named, versioned claim outside the Reader and Producer classes, with
   its own black-box tests.
4. A certification programme outside the specification.

## Decision

Option 3.

**The claim.** A host may say it **"honours creators' ratings and AI-use
rules (OpenMOCA 0.7)"**, naming the spec version, when it passes the public
host tests for that version. The claim is about one behaviour only. It is not
"OpenMOCA conformant", and does not make the host a conformance class.
Everything else ADR-0022 says stays as it is.

**What the claim means.** Before content leaves the host for an AI model, or
is shown or played under a rating filter, the host:

- asks a Reader to resolve the terms and gate the result set, stating the
  real destination (device, the host's own service, or a third-party
  provider) and use (answering, embedding or indexing, translating,
  summarising);
- never loosens a creator's terms with its own settings;
- treats absent terms with the specification's platform defaults, and
  training as not allowed;
- records, for each answer, where each part came from and which level
  decided each term.

A host that relays content to a third party's model counts that as a
provider. A host that counts its own tenancy on a cloud provider as its own
service says so in its public list of the models it uses.

**The tests.** A black-box harness, published with the corpus:

- the host under test is given fixture packages and a configuration, and is
  driven through scripted actions (ask, translate a quote, play, list for a
  younger profile);
- recording stand-ins take the place of the model, the host's service and
  the embedder, and log every payload;
- canary packages carry unique tokens, one rule each. The host passes when no
  canary token reaches a destination its package forbids, and every answer
  records its sources and the deciding level;
- cases cover each destination and use, absent and malformed terms, unrated
  content, composite members, a host setting trying to loosen, and a signed
  package trying to loosen the platform defaults.

**Self-certified, and said to be.** As with "OpenMOCA conformant"
([TRADEMARKS.md](../../TRADEMARKS.md)), the host runs the tests itself. A
claim must be published with the run's output, the corpus version and the
date, signed by the claimant, and is withdrawn if a later release fails. The
specification says plainly that the claim is self-certified. The claim's
wording is protected under the trade mark policy
([ADR-0012](0012-trade-mark-policy.md)).

**Declared interest.** The maintainer's organisation also builds hosts and
will make this claim for its own. It writes the tests in the open, publishes
its own runs like anyone else, and names at least one other host or pilot
partner that runs the tests before the claim leaves Proposed. A service that
releases keys for encrypted packages on the strength of the claim must also
require a signed agreement with a right to audit, and the specification
says so.

## Consequences

- Creators get a shared, testable bar for the one behaviour they care about
  most, without turning every application rule into a MUST.
- The corpus stays a Reader and Producer corpus; the host harness is a
  separate set of tests with its own runner.
- TRADEMARKS.md gains the claim's wording next to "OpenMOCA conformant".
- A self-certified claim can be false. The remedy is the published run, the
  right to ask for it, and withdrawal; not a promise the format cannot keep.

## What would change this decision

- Hosts that need a wider testable bar than this one behaviour, which would
  reopen a Host conformance class.
- A false claim that self-certification failed to correct, which would move
  this to an audited certification programme under a separate name.
