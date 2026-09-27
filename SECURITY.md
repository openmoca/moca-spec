# Security policy

## Reporting a vulnerability

Report security issues privately with GitHub's
["Report a vulnerability"](https://github.com/openmoca/moca-spec/security/advisories/new)
form, not in a public issue. Include the files affected, what goes wrong, and,
if you can, a minimal package that shows it.

## In scope

- A Reader conclusion that is wrong in a security-relevant way: an attestation
  reported valid when it should not be, skills exposed without a valid package
  attestation, a digest that does not change when content changes, a member
  accepted despite a digest mismatch, or content read from outside the package.
- Entries the digest silently ignores but a Reader still serves (for example
  links or unreadable files: these must fail closed).
- Archive handling in `moca-core` and `moca-lint`: traversal, zip bombs,
  entry limits.
- The MCP server widening what the host allows, for example returning content
  outside the host's audience filter.
- Schemas that accept what the specification forbids.
- Examples or documentation that teach an insecure pattern.
- CI workflows that untrusted pull requests could abuse.

## The security model in one page

- **A package is data, never configuration.** A Reader never executes package
  content and never acts on a location, model, setting or credential a package
  supplies ([Reader contract §4](spec/moca-reader-contract.md#4-what-a-reader-must-never-do)).
- **Content is untrusted input to a model.** Retrieved text can carry
  instructions. Hand it to models as cited data, never as instructions, and
  never grant tools because content asks
  ([Reader contract §10](spec/moca-reader-contract.md#10-handing-content-to-a-model)).
- **Attestations prove who, not what.** A valid package attestation proves who
  published the bytes; a valid review proves who signed a statement about them.
  Neither proves the content is true or safe. Whom to trust is the host's trust
  root ([attestations §6](spec/moca-attestations.md#6-trust-roots)).
- **Skills are withheld unless the package is attested**, and an application
  that runs one must sandbox it and grant only tools that host policy allows.
- **Audience is a label, not access control.** Anyone with the package can
  read every file.

## The example keys are insecure on purpose

`fixtures/signing-keys/` contains private keys that are published so that the
examples and conformance fixtures can be regenerated deterministically. Never
trust them outside this repository.
