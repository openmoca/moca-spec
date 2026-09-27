# @openmoca/moca-sign

Writes and verifies MOCA [attestations](../../spec/moca-attestations.md):
package attestations for publishers and review attestations for reviewers.

```sh
moca-sign keygen --keyid <id> --out <dir> [--roles package,review] [--identity text]
moca-sign sign <package> (--key <pem> --keyid <id> | --sigstore)
moca-sign review <package> --nodes <paths...> --reviewer <actor> [--outcome accurate|needs-change|inaccurate] [--scope text] [--note text] [--at iso] (--key <pem> --keyid <id> | --sigstore)
moca-sign verify <package> --trust-root <file> [--online] [--allow-offline-fallback] [--tuf-cache dir]
```

- `keygen` creates an Ed25519 key pair and adds the public key to
  `<dir>/trust-root.json`. Never put a private key in a package.
- `sign` writes `attestations/package.<keyid>.dsse.json` (or
  `package.sigstore.json`). It refuses to sign an invalid package.
- `review` writes `attestations/reviews/<reviewer>-<date>.dsse.json`, binding
  the review to each node file's exact SHA-256.
- `verify` checks every attestation and exits 0 only if all verify and at least
  one package attestation is valid.

Sigstore signing needs an OIDC identity: in GitHub Actions, grant
`id-token: write`. DSSE signatures are deterministic, which the repository uses
to regenerate its example attestations.
