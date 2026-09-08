# Security Policy

## Scope

This repository contains a specification, JSON Schemas, JSON-LD contexts,
static example packages, and the executable `moca-lint`/`moca-sign` CLIs. It
does not ship a runtime or server, but the CLIs and their
archive-handling/cryptographic code are in scope for traditional code
vulnerabilities.

That said, security issues are still in scope:

- Errors in `schemas/` that would let an invalid or malicious `moca.json`
  pass validation (e.g. a schema that fails to reject the excluded
  properties in
  [core §5.3](moca-core-spec.md#53-excluded-properties)).
- A `moca-lint` error-severity check (`E1xx`–`E4xx`) that fails to flag a
  manifest or package it should reject — a false negative in the
  validation contract itself, not just in the schema it validates against.
  See [tools/moca-lint/README.md](tools/moca-lint/README.md#validation-contract)
  for which checks are normative.
- A `moca-sign` verification bug that accepts a signature that shouldn't
  verify — a bad signature, a subject digest that doesn't match
  `canonicalDigest.value`, an untrusted signer, or an expired/removed
  `dsse`-mode trust-root entry. See
  [docs/trust-model.md](docs/trust-model.md) for the intended behavior.
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
