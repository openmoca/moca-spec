# moca-sign

Reference signing and verification CLI for the `signature` object
[core §5.1](../../moca-core-spec.md#51-manifest-properties)/[§8.2](../../moca-core-spec.md#82-security--trust-boundary-rule)
requires on any package containing `skills/`. See
[docs/trust-model.md](../../docs/trust-model.md) for the full design: what a
signature signs over, the two supported modes, trust roots, identity
constraints, and offline/online verification behavior. This README covers
CLI usage only.

## Install

From the repo root (moca-sign is an npm workspace):

```sh
npm install
```

## Signing modes

- **`dsse`** — a long-lived Ed25519 keypair. No network calls, fully
  reproducible. Use `moca-sign generate-key` to create one. This is the mode
  this repository's own examples and conformance fixtures use.
- **`sigstore`** — keyless signing via Fulcio + Rekor, using the
  [`sigstore`](https://www.npmjs.com/package/sigstore) package's `attest()`.
  Requires a real OIDC identity token (ambient CI credentials, e.g. GitHub
  Actions, or an explicit `--identity-token`). This is the recommended mode
  for real-world signing — see [Known limitations](#known-limitations) for
  why it isn't exercised by this package's own test suite.

Both modes sign an in-toto statement over the package's `canonicalDigest`,
**not** the raw archive — see [docs/trust-model.md §2](../../docs/trust-model.md#2-what-a-signature-signs-over).

## Usage

### Generate a dsse-mode keypair

```sh
moca-sign generate-key -o my-key
# writes my-key.pem (private, keep secret) and my-key.pub.pem
```

### Sign a package

```sh
# dsse mode
moca-sign sign <package-dir> --mode dsse --key my-key.pem --keyid my-key-2026

# sigstore mode (needs a real OIDC identity token, e.g. from CI)
moca-sign sign <package-dir> --mode sigstore
```

`sign` computes (or recomputes) `canonicalDigest` from the package's current
on-disk content and writes both `canonicalDigest` and `signature` into
`moca.json` in place.

**Keys and trust-root files must live outside the package directory being
signed.** `canonicalDigest` is computed from every file under the package
root (core §5.5) — a private key or trust-root file saved alongside
`moca.json` would itself become signed package content.

### Verify a package

```sh
# dsse mode
moca-sign verify <package-dir> --trust-root trust-roots.json

# sigstore mode, restricting to a specific signer identity
moca-sign verify <package-dir> \
  --identity-constraint "https://token.actions.githubusercontent.com=https://github.com/org/repo/.github/workflows/release.yml@refs/heads/main"

# sigstore mode, requiring a live Rekor check
moca-sign verify <package-dir> --online-verify
```

`verify` exits `0` for a valid signature, `1` otherwise, and prints one of
four outcomes (`valid`/`malformed`/`invalid`/`indeterminate` — see
[docs/trust-model.md §6](../../docs/trust-model.md#6-verification-outcomes)).
`--format json` emits the structured result instead.

`trust-roots.json` (dsse mode) shape:

```json
{
  "keys": [
    { "keyid": "my-key-2026", "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n" }
  ]
}
```

## Library usage

`tools/moca-lint` depends on this package and calls
`verifyPackageSignature()` directly from its Security pass rather than
shelling out to the CLI:

```js
import { verifyPackageSignature } from 'moca-sign/lib/verify.js';

const result = await verifyPackageSignature({ rootDir, dsseTrustRootPath: 'trust-roots.json' });
// { outcome: 'valid', keyid: '...' } | { outcome: 'malformed'|'invalid'|'indeterminate', reason: '...' }
```

## Known limitations

- **`sign --mode sigstore` is not exercised by this package's automated test
  suite.** It requires a real OIDC identity token and network access to
  Fulcio/Rekor, which would make `npm test` non-deterministic and
  network-dependent — the same reason this repository's own examples and
  fixtures are signed in `dsse` mode instead. The code path is real (a thin
  wrapper over `sigstore`'s `attest()`/`verify()`), but its correctness
  beyond argument plumbing is verified manually/in a dedicated release
  workflow, not `npm test`.
- **Composed packages (`composition.members`) are not supported.** Signing
  and verifying only walk a single target directory, the same limitation
  `moca-lint` documents for `composition` validation generally.
- **`--identity-constraint` matches by regular expression, `sigstore` mode
  only.** There is no equivalent identity-scoping mechanism for `dsse` mode
  beyond which `keyid`s appear in the supplied trust root.
