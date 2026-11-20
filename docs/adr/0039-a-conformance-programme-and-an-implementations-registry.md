# 0039 — A conformance programme: apps that honour creators' and people's rules

- **Status:** Proposed
- **Date:** 2026-11-19 (reworked 2026-11-20, owner: the host claim leads, and
  covers people's rules as well as creators')
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))
- **Supersedes in part:** [ADR-0037](0037-a-named-host-claim-for-creators-terms.md):
  the claim's wording and scope (its harness design, destinations and uses stay)
- **Builds on:** [TRADEMARKS.md](../../TRADEMARKS.md) ("Claiming conformance")

> Anyone can implement OpenMOCA. Anyone can claim conformance by publishing a
> signed, reproducible passing result. Anyone can verify or challenge that
> claim.

## Context

The question a person asks before opening a package is not "does this app
parse the format?" but **"can I trust this app with this creator's work, and
with my own choices?"** A Reader can resolve a creator's terms correctly and
the app around it can still ignore them: send content to a model the creator
forbade, show it to a younger profile, let it be exported, or override a
person's own setting with a looser one of its own.

ADR-0037 answered part of this with a named claim, "honours creators' ratings
and AI-use rules", tested by a black-box harness. Two things were missing:

- **People's rules.** In a host, both sides have settings and ownership: the
  creator owns the work and its terms; the person owns their choices (what
  may be sent where, what they see, what they keep private) and anything they
  bring themselves. A host that honours one and not the other is not
  trustworthy.
- **The harness itself.** ADR-0037 designed it; it has not been built. Until
  it is, nobody can make the claim.

Independent reviews (2026-11-19 and 2026-11-20) recommended a conformance
programme and a public registry, and, after discussion with the owner, that
the host side be first-class rather than an optional extra.

## Decision

The **OpenMOCA Conformance Programme** and the **OpenMOCA Implementations
Registry**, built around three separate claims. The host claim is the one
people look for; the other two are its foundation.

| Claim | Question it answers | How it is shown |
| --- | --- | --- |
| **Honours creators' and people's rules (OpenMOCA x.y)** | Will this app treat the work and my choices as the specification says? | The host harness, plus a signed scope statement |
| **OpenMOCA conformant Reader (x.y)** | Does it read packages the way every Reader does? | The conformance corpus |
| **OpenMOCA conformant Producer (x.y)** | Does it make valid packages? | The corpus's producer cases |

Each is claimed on its own. An app that uses a conformant Reader library does
not inherit the Reader's claim, and needs the host claim to say anything about
its own behaviour.

### The host claim

"Honours creators' and people's rules" replaces ADR-0037's wording. It means
the host does everything the specification asks of a host, on both sides:

#### The creator's side

- **1.** Before content leaves the host for an AI model, or is shown or played
  under a rating filter, it asks a Reader to resolve the terms and gate the
  result set, stating the real destination and use (as ADR-0037).
- **2.** It never loosens a creator's terms; absent terms get the platform
  defaults, and training is not allowed.
- **3.** It honours `rights.export`: no export where the work does not allow it.
- **4.** It keeps the creator's credits, licence and copyright with what it shows,
  and records, for each answer, where each part came from and which level
  decided each term.
- **5.** It shows terms honestly: the creator's declaration, who signed it, what
  the host enforces, and what it claims about itself, told apart.
- **6.** Encrypted packages are handled as the encrypted-package guidance says:
  decrypted only in memory, no plaintext in logs, caches or derived data
  that outlive the key.

#### The person's side

- **7.** A person's own settings (which destinations their reading may go to, the
  ratings they see, what is kept) take part in resolution as host limits:
  stricter wins, and the host never overrides a person's setting with a
  looser one of its own.
- **8.** What a person brings or keeps private is theirs: it is not shown to other
  people on the same host, sent anywhere they have not allowed, or
  published, and the person is its creator for the terms that apply.
- **9.** A person can see why something was left out: the deciding level is shown,
  not hidden.

### Tested, or declared, and said which

Each item above is either **tested** by the public host harness or
**declared** in a signed scope statement, and the registry shows which. A
declaration is never shown as a test.

- **Tested** (the ADR-0037 harness: fixture packages with unique canary
  tokens, recording stand-ins for every model and service, scripted actions):
  items 1–5, 7, 9, and item 8 with two profiles on one host (no canary from
  one person's private package reaches the other or any destination).
- **Declared** (what a black box cannot see): item 6, providers' retention,
  and anything outside the harness's scripted actions.

**The scope statement** is signed with the run's record and names the app,
its version and build, the models and destinations it uses, and the set-ups
the claim covers. A claim that holds for the host's own AI but not when a
person connects an outside one says so.

**Narrow where it must be.** A behaviour joins the claim's tested list only
when the harness can test it. The claim's wording stays the same; the
registry shows each item's state.

### Reader and Producer claims

As TRADEMARKS.md has it today: pass the full corpus for a named version;
capabilities are the specification's (the core never skippable; a declared
optional feature means passing all its cases, hostile ones included); each
shows `passed`, `not implemented` or `not tested`. A separate adapter
contract, with its own tests, says what an adapter must return; a missing or
malformed result is a failure, never a skip.

### The signed record

The runner (corpus or host harness) writes a record of the run; the claimant
signs it as an attestation with its own predicate type,
`https://w3id.org/moca/attestation/conformance/v1`, never to be taken for a
package attestation. It names: the record schema version; the implementation,
its role and version; the build's artifact digest, source commit, uncommitted
changes, submodules and lock-file digest; the specification and corpus (or
harness) versions and digests; the runner and adapter versions; each item's
or feature's result with the cases run; the date and the signer. A signature
shows control of a key, not legal identity. A record covers one build only.

### The registry

A page on openmoca.org and the same data as JSON. Each entry shows its claims
side by side, with the host claim first, each item tested or declared, the
build and versions, the record and run output, the last tested date, and its
status:

| Status | Meaning |
| --- | --- |
| Listed | An entry with no claim |
| Conformant | A valid signed passing record for the named build and version |
| Reproduced | Someone else re-ran it and got the same results |
| Contested | A concern is being looked into |
| Suspended | A reproduced failure: the claim is not shown as valid |
| Withdrawn | The claimant or the programme has withdrawn it |
| Superseded | A newer record is the current one |

History stays visible. Anyone may challenge a record; the maintainer
acknowledges, the claimant responds, the results are published, and the
record is kept, corrected, suspended or withdrawn. Optional independent
assessment may be added later; it is never required.

On every page: **passing these tests is not a security audit, and no claim
guarantees legal protection of anyone's rights.** It shows that an app passed
public tests and made a signed, checkable commitment.

### Words and marks (added to TRADEMARKS.md)

| Wording | Means |
| --- | --- |
| OpenMOCA compatible | Works with OpenMOCA in some way; not necessarily tested |
| OpenMOCA Listed | In the registry; no claim implied |
| OpenMOCA conformant Reader / Producer | A signed passing corpus record |
| Honours creators' and people's rules | A signed passing host-harness record, with its scope statement |

Each badge links to the record it rests on. There is never a fee for a
technical decision.

### Order

1. OpenMOCA 0.7.0 as planned.
2. **The host harness**, first, because it is what people need: canary
   fixtures, recording stand-ins, a driver contract for hosts (like the
   Reader adapter), and cases for items 1–5, 7–9. The first hosts tested are
   the project's own: the MCP server, and any app built on OpenMOCA that
   wants the claim.
3. The signed record and a sign-and-verify tool.
4. The registry page and JSON, and the TRADEMARKS.md and GOVERNANCE.md
   changes.

All of it is part of the 1.0 release; steps 2–4 may land before.

## Consequences

- People get one claim that answers their real question, with every item
  marked tested or declared.
- The host harness is real work, larger than a Reader feature; until it
  ships, no host may make the claim, ours included.
- Creators' and people's rules sit side by side in one claim, so a host
  cannot pass by honouring only one.
- The registry needs upkeep: reviewing submissions, re-running a sample, and
  handling challenges within a stated time.

## How we'll know it works

- Hosts with the claim, and the share of its items each has tested rather
  than declared.
- Independent implementations, not only the project's own.
- Records reproduced by others, and the agreement rate.
- Challenges handled, and the time to resolve them (zero challenges is not
  the target).
- Corpus and harness quality: requirements with a case; every confirmed bug a
  regression case; new cases shown to fail against a broken implementation.
- Whether creators and people can tell a host that honours their rules from
  one that does not (occasional surveys, totals only).

## What would change this decision

- Evidence that self-certified records are being gamed: re-run every
  submission before showing it.
- A person's choices needing their own level in terms resolution (so a
  record says `decidedBy: person`, not `host`): add it in a later version.
- An independent body ready to assess: add the optional assessment.
