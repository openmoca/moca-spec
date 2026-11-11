# 0022 — Rules for applications are advice

- **Status:** Accepted
- **Date:** 2026-11-10
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Some MUSTs in the specification were addressed to applications and hosts: how
to key citations, how to show trust, how to render package text, and which
stores to search. Applications are not a conformance class, and the corpus
cannot test them, so those MUSTs could not be checked.

## Options

1. Add an Application conformance class, with its own tests.
2. Turn the rules for applications and hosts into advice (SHOULD).

## Decision

Option 2 ([package spec §1.1](../../spec/moca-package-spec.md#11-the-document-set)).
The AG-UI client rules stay MUSTs: they bind any client that shows the
`moca.citations` event. Everything a Reader, a binding or a Producer does stays
a MUST, so the safety rules a test can check are unchanged.

## Consequences

- Every MUST in the specification binds something a test can reach.
- The guidance for applications is just as strong in what it says, but an
  application that ignores it is not "non-conformant".

## What would change this decision

Applications built by many parties that need a shared, testable bar.
