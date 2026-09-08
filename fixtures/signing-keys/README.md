# ⚠️ Non-production example signing key

`example-signing-key.pem`/`example-signing-key.pub.pem` is a `dsse`-mode
Ed25519 keypair (see [spec/moca-trust-model.md](../../spec/moca-trust-model.md) §3.2)
used **only** to sign this repository's own skill-bearing example packages
(`examples/level-3-extended`,
`profiles/education/examples/education-profile`,
`profiles/eu-ai-act/examples/eu-ai-act-profile`) so they carry real,
verifiable signatures instead of the placeholder string previously used.

**This key has no production trust value.** It is committed to the repo,
its private half included, precisely so anyone can inspect it, regenerate
the example signatures after editing example content, or use it as a
starting point for their own `dsse`-mode signing — not because private
signing keys normally belong in version control. Do not configure any real
host to trust `moca-spec-example-signing-key-2026`
(`example-signing-trust-root.json`); it exists solely so this repo's own
`moca-lint` test suite and CI can verify its own examples end to end.

To re-sign an example after editing its content:

```sh
node tools/moca-sign/bin/moca-sign.js sign <example-dir> \
  --mode dsse --key fixtures/signing-keys/INSECURE-example-signing-key.pem \
  --keyid moca-spec-example-signing-key-2026
```
