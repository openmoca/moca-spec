# 0039 — Two marks for two audiences, and a public registry

- **Status:** Proposed
- **Date:** 2026-11-19 (reworked 2026-11-20 with the owner: two audiences, two
  marks)
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))
- **Supersedes in part:** [ADR-0037](0037-a-named-host-claim-for-creators-terms.md):
  the claim's wording and scope; its test harness design stays
- **Builds on:** [TRADEMARKS.md](../../TRADEMARKS.md) ("Claiming conformance")

> Anyone can implement OpenMOCA. Anyone can claim a mark by publishing a
> signed, reproducible passing result. Anyone can check or challenge it.

## Context

Two different people ask two different questions.

- **Someone building with OpenMOCA, or checking software that does** (a
  security team, a company choosing a Reader or a packaging tool): does this
  code read or make packages exactly as the specification says?
- **Someone using an app:** will this app honour what the creator asked, and
  what I asked, as the specification sets out?

The corpus answers the first today. ADR-0037 began on the second, with a
claim about creators' ratings and AI-use rules and a black-box harness that
has not yet been built. It left out the person's own rules: in a host, the
creator owns the work and its terms, and the person owns their choices and
anything they bring. Both must be honoured.

## Decision

**Two marks, one for each audience.**

| Mark | For | Means | Shown by |
| --- | --- | --- | --- |
| **OpenMOCA conformant** (Reader or Producer, version) | Builders and those checking software | The code reads or makes packages as the specification says | Passing the conformance corpus |
| **Honours creators' and people's rules** (version) | People choosing an app | The app does what the specification asks of a host, for the creator and for the person | Passing the host tests |

An app that uses a conformant Reader does not inherit it: the app needs the
second mark to say anything about how it behaves.

### What "honours creators' and people's rules" means

Everything the specification asks of a host:

- **For the creator:** check the terms before content goes to any AI, is
  played, or is shown under a rating filter, naming the real destination;
  never loosen them; honour export; keep the credits, licence and copyright
  with what is shown, and record where each answer came from; show terms
  honestly; handle encrypted content as the guidance says.
- **For the person:** apply their own settings, stricter wins, and never
  override them with a looser setting of the app's; keep what they bring or
  keep private to them, never shown to others, sent where they have not
  allowed, or published; show them why something was left out.

### How the marks are earned

- **Run the public tests yourself:** the corpus for the first mark, the host
  tests for the second (ADR-0037's harness: packages with unique canary
  tokens, stand-ins that record everything sent to any model or service,
  scripted actions such as ask, play and export, and two profiles on one
  host).
- **Publish a signed result:** what was tested (name, version, build), which
  tests (version), the results, and the date, signed with the attestation
  format packages use. A result covers that build only.
- **Say what the tests cannot see.** Some of the host rules (how decrypted
  content is held in memory, what a provider keeps) cannot be seen from
  outside. The app states these in its signed result, with the models and
  set-ups the mark covers, and the registry shows them as stated, not tested.
- **Self-certified, and said to be.** No fee and no application. Anyone can
  re-run the tests; a false claim is withdrawn.

Passing is not a security audit and does not guarantee anyone's rights in
law; it shows an app passed public tests and made a signed commitment.

### The registry

A page on openmoca.org, and the same data as JSON, listing every published
result: who, what build, which mark, the result, what is stated rather than
tested, and the date. Anyone may challenge an entry; the maintainer looks
into it, and an entry that fails when re-run is marked withdrawn. Old
results stay visible.

### Order

1. OpenMOCA 0.7.0.
2. The host tests, since they answer the question people ask. Our own MCP
   server is the first host tested.
3. The signed result and the registry, and the wording in TRADEMARKS.md.

All part of the 1.0 release; steps 2 and 3 may land before.

## Consequences

- Two marks people can tell apart, each answering one question.
- The host tests are real work; until they exist no app can carry the second
  mark, ours included.
- A person's settings are applied through the host level for now, so a
  result shows `decidedBy: host` where the person chose; a distinct `person`
  level can come in a later version.

## How we'll know it works

- Apps carrying the second mark, and independent ones, not only ours.
- Results re-run by others that match.
- Challenges answered, and how quickly.
- Whether people can tell an app that honours their rules from one that does
  not.

## What would change this decision

- Results being gamed: re-run every result before listing it.
- A real need for more marks: add one only when it has its own tests.
