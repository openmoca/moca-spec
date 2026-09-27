# 0006 — Safety comes from Reader rules, not forbidden manifest keys

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

The earlier draft forbade the keys `endpoints`, `settings`, `credentials` and
`apiKeys` "at any level". Testing showed the reference linter checked only the
top level, and that `apiKey`, `endpoint`, `token` or `x-acme-endpoint` passed
unnoticed. No list of names can be complete. Meanwhile the real risk was
elsewhere: for a language model, retrieved text is instructions, so a package's
content is a larger attack surface than its metadata.

## Decision

- Remove the forbidden-key list. Unknown keys are ignored and reported as
  info.
- Make the guarantee a Reader rule: a Reader never acts on a location, model
  name, setting or credential a package supplies, and performs I/O only through
  what the host supplied
  ([Reader contract §4](../../spec/moca-reader-contract.md#4-what-a-reader-must-never-do)).
- State plainly that content is untrusted model input, and require Readers and
  servers to hand it to models as cited data, never as instructions
  ([Reader contract §11](../../spec/moca-reader-contract.md#11-handing-content-to-a-model)).
- Recommend signing any package that crosses an organisational boundary, not
  only packages with skills.

## Consequences

- One rule that holds for every key, present and future, instead of a list
  that invites false confidence.
- Hosts get honest guidance about where the risk actually is.

## What would change this decision

A concrete attack that a Reader rule cannot prevent but a manifest check can.
