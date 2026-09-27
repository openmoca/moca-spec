# Signing and review

MOCA uses two kinds of signed statement, stored under `attestations/` and
kept outside the package digest
([attestations spec](../../spec/moca-attestations.md)).

| Statement | Says | Made by | Command |
| --- | --- | --- | --- |
| Package attestation | "I published exactly this package." | The publisher, usually in CI. | `moca-sign sign` |
| Review attestation | "I checked exactly these nodes." | A reviewer. | `moca-sign review` |

## Choosing a signing mode

- **Sigstore** (`--sigstore`): keyless. The signer proves an OIDC identity
  (a person's account, or a CI workflow) and the signature is logged publicly
  in Rekor. Recommended for publishing from CI and for reviewers with company
  accounts.
- **DSSE with a key** (`--key`, `--keyid`): for air-gapped environments and
  private PKI. Its security is exactly how well the private key is kept.

## Signing in CI with Sigstore

```yaml
permissions:
  id-token: write
steps:
  - run: node tools/moca-sign/bin/moca-sign.js sign ./kb --sigstore
```

A reader's trust root then lists the workflow identity:

```json
{ "sigstore": { "identities": [
  { "issuer": "https://token.actions.githubusercontent.com",
    "subject": "https://github.com/acme/kb/.github/workflows/publish.yml@refs/heads/main",
    "roles": ["package"] } ] } }
```

## Reviews

```sh
node tools/moca-sign/bin/moca-sign.js review ./kb --nodes refund-window.md shipping-estimates.md \
  --reviewer human:sam.ortiz --outcome accurate --scope "Checked against terms v2026" --sigstore
```

A review names files and their exact SHA-256. It keeps counting across
package versions while the file is unchanged, and stops the moment the file
changes (`A006_REVIEW_OUTDATED`). Re-review changed nodes and add a new
attestation; old ones can stay for history.

OKF's `verified` field and a review attestation are different things. Keep
writing `verified` for readers that only understand OKF; the attestation is
what lets a reader check it. Citation records keep them apart
(`declaredVerified` and `attestedReviews`).

## Trust roots are the reader's

A trust root lists the keys and Sigstore identities a host trusts, each for
`package`, `review` or both. Without one, every attestation is unverifiable;
"some valid signature exists" is never enough. See
[attestations §6](../../spec/moca-attestations.md#6-trust-roots).

## What signing does not do

It does not make content true or safe. Treat package text as untrusted input to
a model, whoever signed it ([SECURITY.md](../../SECURITY.md)).

## Agent material

A package carries knowledge, not agent skills or tools. Since 0.4 a `skills/`
directory has no special meaning
([ADR-0015](../adr/0015-park-unconsumed-features.md)).
