# Education Profile Example

Demonstrates the [education profile](../../moca-education-profile.md)
(`Course`/`Module` structure, `socratic-debugging` skill) against a
Level 3-conformant package.

## ⚠️ About the `signature` field

This package contains `skills/`, so a valid `signature` is mandatory
(core [§3.1](../../../../moca-core-spec.md#31-level-requirement-clarification)/[§8.2](../../../../moca-core-spec.md#82-security--trust-boundary-rule)).
`moca.json` carries a real, verifiable `dsse`-mode signature (see
[docs/trust-model.md](../../../../docs/trust-model.md)) — **but it is signed
with this repository's own non-production example key**
([examples/keys/README.md](../../../../examples/keys/README.md)), not a
signer any real host should trust:

```sh
node tools/moca-sign/bin/moca-sign.js verify profiles/education/examples/education-profile \
  --trust-root examples/keys/example-signing-trust-root.json
```

Verifying successfully against this repo's example trust root does not make
this package trustworthy for any purpose beyond demonstrating the mechanism;
no real host should add `moca-spec-example-signing-key-2026` to its own
trust root.
