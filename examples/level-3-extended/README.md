# Level 3 Extended Example

Demonstrates MOCA Core Level 3 conformance
([core §3](../../moca-core-spec.md#3-conformance-levels)):

- A W3C Web Annotation `FragmentSelector` evidence locator
  ([core §7.3](../../moca-core-spec.md#73-multi-modal-evidence--web-annotation-locators)),
  in `content/01-video-segment.md`.
- An Agent Skill under `skills/example-skill/`
  ([core §8.1](../../moca-core-spec.md#81-agent-skills-integration)).

## ⚠️ About the `signature` field

The `signature` object in `moca.json` is a **placeholder**, not a real
cryptographic signature. Its `value` is the literal string
`"PLACEHOLDER-NOT-A-REAL-SIGNATURE-DO-NOT-TRUST"`. No Sigstore/DSSE signing
infrastructure exists for this repo yet.

Per [core §8.2](../../moca-core-spec.md#82-security--trust-boundary-rule), a
real harness MUST refuse to load `skills/` content from a package whose
signature does not verify — this example package would (and should) be
rejected by any conforming signature-checking implementation. It exists
purely to show the *shape* of a Level 3 package with `skills/`, not to be
loaded as trusted.
