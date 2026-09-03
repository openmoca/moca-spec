# Security Policy

## Scope

This repository contains a specification, JSON Schemas, JSON-LD contexts,
and static example packages. **It does not ship executable code** — there is
no runtime, server, or library here to have a traditional code
vulnerability.

That said, security issues are still in scope:

- Errors in `schemas/` that would let an invalid or malicious `moca.json`
  pass validation (e.g. a schema that fails to reject the excluded
  properties in
  [core §5.2](moca-core-spec.md#52-excluded-properties)).
- Errors in example packages that model insecure or misleading patterns
  implementers might copy.
- Issues in CI tooling (`.github/workflows/`) that could be abused (e.g.
  script injection via untrusted PR input).

## Security Model for Implementers

MOCA Core packages are intended to be **inert data**. The one area with
direct security implications for anyone building a harness against this spec
is the `skills/` + `signature` model in
[core §8.2](moca-core-spec.md#82-security--trust-boundary-rule):

- Loading a MOCA package MUST NOT automatically execute code.
- Any package containing `skills/` MUST include a valid `signature` object,
  regardless of declared conformance level.
- A harness MUST refuse to load `skills/` content from an unsigned or
  signature-invalid package, MUST sandbox `allowed-tools` against host
  policy, and MUST NOT treat the rest of a package as untrustworthy just
  because its `skills/` are rejected (or vice versa).

Harness implementers should treat any package's `skills/` directory as
untrusted, attacker-controlled input until signature verification succeeds.

## Reporting a Vulnerability

Please report security issues privately using GitHub's
["Report a vulnerability"](https://github.com/openmoca/moca-spec/security/advisories/new)
flow on this repository rather than opening a public issue. Include the
affected file(s), the concern, and if applicable, a minimal example package
demonstrating the issue.
