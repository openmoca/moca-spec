# Example signing keys — INSECURE

These Ed25519 private keys are **published on purpose** so that example and
conformance attestations can be regenerated deterministically
(`npm run refresh:derived`). Anyone can sign anything with them. Never trust
them outside this repository.

| File | Key id | Role in `trust-root.json` |
| --- | --- | --- |
| `INSECURE-publisher.pem` | `example-publisher-2026` | `package` |
| `INSECURE-reviewer.pem` | `example-reviewer-2026` | `review` |
| `INSECURE-rogue.pem` | `example-rogue-2026` | Not trusted: used to test untrusted signatures |

`trust-root.json` is the trust root the examples verify against;
`conformance/fixtures/trust-root.json` is a copy, so the corpus stands alone.
