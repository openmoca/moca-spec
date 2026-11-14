# MOCA Encrypted Packages

Specification version: `0.7.0` (draft)
Status: Before `1.0.0`. A minor version may still change the format; each change is in [MIGRATIONS.md](../MIGRATIONS.md).
License: [Apache License 2.0](../LICENSE)

## 1. Scope

An **encrypted package** is a `.moca` archive inside an **envelope**: a Zip
file that holds the archive encrypted with
[age v1](https://c2sp.org/age), a plain format marker and an optional
outline. Once opened, it is that `.moca` archive. Every rule of the
[package specification](moca-package-spec.md) and the
[Reader contract](moca-reader-contract.md) then applies to it unchanged, and
it gives the same digest.

Encryption gives confidentiality only. It does not show who made the file.
Provenance comes only from attestations, which are made over the plain
package and verified after the envelope is opened.

This document binds Producers of envelopes, and Readers that implement the
optional feature `encryption`
([Reader contract §14](moca-reader-contract.md#14-demonstrating-conformance)).
A Reader without the feature still recognises an envelope and reports
`E001`.

The rest of this document is written in the 0.7.0 Spec Change Proposal
([moca-spec#5](https://github.com/openmoca/moca-spec/issues/5)): the layout,
the marker and outline, encryption, opening an envelope, derived data,
security considerations and versioning.
