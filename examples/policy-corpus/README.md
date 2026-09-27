# Policy corpus

Two versions of one policy package, `data-retention@1.0.0` and `@2.0.0`. Each
states when it is in force (`validFrom`, `validUntil`), and 2.0.0 declares that
it `supersedes` 1.0.0.

When a Reader has both loaded, the 1.0.0 nodes carry `superseded: true` in
their citation records, and the default retrieval policy leaves them out. Both
versions stay readable and auditable, so "what did the policy say in 2025?"
still has an answer.
