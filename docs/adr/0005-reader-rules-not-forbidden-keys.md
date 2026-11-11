# 0005 — Safety comes from Reader rules, not forbidden manifest keys

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

An earlier draft forbade the keys `endpoints`, `settings`, `credentials` and
`apiKeys` "at any level". Testing showed the reference linter checked only the
top level, and that `apiKey`, `endpoint`, `token` or `x-acme-endpoint` passed
unnoticed. No list of names can be complete. Meanwhile the real risk was
elsewhere: for a language model, retrieved text is instructions, so a package's
content is a larger attack surface than its metadata.

## Options

1. Keep a forbidden-key list and check it at every level.
2. Make safety a rule about what a Reader does, whatever the package says.

## Decision

Option 2.

- No forbidden-key list. Unknown keys are ignored and reported as info.
- The guarantee is a Reader rule: a Reader never acts on a location, model
  name, setting or credential a package supplies, and performs I/O only through
  what the host supplied
  ([Reader contract §4](../../spec/moca-reader-contract.md#4-what-a-reader-must-never-do)).
- Content is untrusted model input. Readers and servers hand it to models as
  cited data, never as instructions
  ([Reader contract §12](../../spec/moca-reader-contract.md#12-handing-content-to-a-model)).
- Any package that crosses an organisational boundary should be signed.

## Consequences

- One rule that holds for every key, present and future, instead of a list
  that invites false confidence.
- Hosts get honest guidance about where the risk actually is.

## What would change this decision

A concrete attack that a Reader rule cannot prevent but a manifest check can.
