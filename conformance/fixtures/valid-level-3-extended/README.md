# Level 3 Extended Example

Demonstrates MOCA Core Level 3 conformance
([core §3](../../spec/moca-core-spec.md#3-conformance-levels)):

- A W3C Web Annotation `FragmentSelector` evidence locator
  ([core §7.3](../../spec/moca-core-spec.md#73-multi-modal-evidence--web-annotation-locators)),
  in `content/01-video-segment.md`.
- An Agent Skill under `skills/example-skill/`
  ([core §8.1](../../spec/moca-core-spec.md#81-agent-skills-integration)).

## ⚠️ About the `signature` field

`moca.json` carries a real, verifiable `dsse`-mode signature (see
[spec/moca-trust-model.md](../../spec/moca-trust-model.md)) — **but it is signed with
this repository's own non-production example key**
([fixtures/signing-keys/README.md](../../fixtures/signing-keys/README.md)), not a signer any real host
should trust. Verify it yourself with:

```sh
node tools/moca-sign/bin/moca-sign.js verify examples/level-3-extended \
  --trust-root fixtures/signing-keys/example-signing-trust-root.json
```

Per [core §8.2](../../spec/moca-core-spec.md#82-security--trust-boundary-rule), a
real harness MUST refuse to load `skills/` content from a package whose
signature does not verify against a trust root *it* configured. Verifying
successfully against this repo's example trust root does not make this
package trustworthy for any purpose beyond demonstrating the mechanism —
no real host should ever add `moca-spec-example-signing-key-2026` to its own
trust root.
