# Policy corpus

**Download** both versions, [`policy-corpus-retention-2025.moca`](https://github.com/openmoca/moca-spec/releases/latest/download/policy-corpus-retention-2025.moca) and
[`policy-corpus-retention-2026.moca`](https://github.com/openmoca/moca-spec/releases/latest/download/policy-corpus-retention-2026.moca), from the [latest release](https://github.com/openmoca/moca-spec/releases/latest).

Two versions of one policy package, `data-retention@1.0.0` and `@2.0.0`. Each
states when it is in force (`validFrom`, `validUntil`), and 2.0.0 declares that
it `supersedes` 1.0.0. 2.0.0 is signed with the examples publisher key.

When a Reader has both loaded, with a trust root whose publisher key covers the
policy's id (the examples trust root, `example-trust-root.json`, lets it speak
for `https://example.com/`), the 1.0.0 nodes carry `superseded: true` in their
citation records, and the default retrieval policy leaves them out. Without a
trust root the relation is reported (`R004`) and has no effect
([package spec §7.2](../../spec/moca-package-spec.md#72-relations)). Both
versions stay readable and auditable, so "what did the policy say in 2025?"
still has an answer.
