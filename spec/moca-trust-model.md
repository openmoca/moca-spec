# MOCA Signature & Trust Model

## 1. Scope

[Core §8.2](moca-core-spec.md#82-security--trust-boundary-rule) and
[core §3.1](moca-core-spec.md#31-level-requirement-clarification) require
any package containing `skills/` to carry a valid `signature` object in
`moca.json`, regardless of the package's declared conformance level, and
require a harness to refuse to load `skills/` content when that signature is
missing or does not verify. Core deliberately leaves the operational
detail — what a `signature` object contains, which keys or identities are
trusted, and how verification is performed offline versus online — to this
document, the same way [spec/moca-sidecar-index-spec.md](moca-sidecar-index-spec.md)
carries the `.moca.idx` operational detail that core §4.1.1 only references.

This document does not change any normative rule in core §8.2/§3.1/§5.1. It
defines the reference envelope shape and verification behavior implemented
by [`tools/moca-sign`](../tools/moca-sign/README.md) and consumed by
[`tools/moca-lint`](../tools/moca-lint/README.md)'s Security pass.

## 2. What a signature signs over

A `signature` binds to the package's `canonicalDigest.value`
([core §5.5](moca-core-spec.md#55-canonical-package-digest)), not to a raw
archive. Archive bytes are sensitive to Zip entry order, compression, and
timestamps that have nothing to do with content identity — the same reason
`canonicalDigest` itself is computed from resource bytes on disk rather than
from archive hashing.

**A package that declares `signature` MUST also declare `canonicalDigest`.**
This is a new conditional requirement on top of §8.2's existing "any package
containing `skills/` MUST include a valid `signature` object" rule: there is
nothing else stable for a signature to bind to. A `signature` present
without a `canonicalDigest` is treated as unverifiable (see §6).

The signed payload is an
[in-toto v1 Statement](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md):

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [
    {
      "name": "urn:moca:example:course@2.0.0",
      "digest": { "sha256": "b17ef6d19c7a5b1ee83b907c595526dcb1eb06db8227d650d5dda0a9f4ce8dc" }
    }
  ],
  "predicateType": "https://openmoca.org/attestations/package-signature/v1",
  "predicate": {}
}
```

`subject[0].name` is `"<manifest id>@<manifest version>"`; `digest.sha256` is
the package's `canonicalDigest.value`. `predicate` is intentionally empty —
this attestation only asserts "this exact package content was signed," not
any additional claim about it. A future predicate type MAY add build
provenance or review metadata; this document defines only the minimal case
core §8.2 requires.

### 2.1 Any manifest edit is a re-signing event

`canonicalDigest` covers the manifest itself, not only the files under
`content/` and friends (core §5.5 — the manifest is included with
`canonicalDigest` and `signature` removed). A signature binds to that digest.
Together these mean:

> Editing **any** manifest field other than `canonicalDigest` and `signature`
> invalidates the digest, and therefore invalidates the signature.

This includes fields with no bearing on the package's meaning — `license`,
`description`, a `keywords` entry. Authors should expect a metadata-only edit
to require the same re-signing step as a content change; a verifier cannot
distinguish the two, and MUST NOT attempt to.

The effect compounds under composition. A composed package folds its members'
*declared* digests (core §5.5), so a change to one member invalidates the
digest of every package composing it, transitively. Re-derivation therefore
has to proceed in dependency order — members before composers — or an
intermediate package will be signed over a digest that is already stale.

Tooling should make this a single operation rather than a manual sequence.
This repository's own corpus is refreshed with `npm run refresh:derived`
(implemented by `scripts/refresh-derived.mjs`), which topologically orders the
packages, recomputes digests, re-signs signed packages, and re-binds dependent
sidecar `target_package_hash` values; `npm run validate:derived` is the
read-only check that fails when any of it has drifted.

## 3. Two signature modes on one schema

No `moca.schema.json` change is required. The existing `signature.type`
(`"sigstore"` | `"dsse"`), `.value`, `.keyid`, and `.certificate` fields
(core §5.1) are sufficient carriers for both modes below.

### 3.1 `type: "sigstore"` — keyless, Fulcio + Rekor

`value` holds a base64-encoded
[Sigstore Bundle](https://github.com/sigstore/protobuf-specs) (JSON), as
produced by `sigstore.attest()` from the
[`sigstore`](https://www.npmjs.com/package/sigstore) npm package: a
short-lived Fulcio certificate bound to an OIDC identity (a maintainer's
email, or a CI workload identity such as a GitHub Actions job), the
DSSE-wrapped in-toto statement from §2, and a Rekor transparency-log
inclusion proof. This is the **recommended mode for any package signed by an
individual maintainer or in CI** — there is no long-lived private key to
protect, and every signature is publicly, independently auditable via Rekor.

`keyid` and `certificate` are unused in this mode; the certificate chain
travels inside the bundle.

### 3.2 `type: "dsse"` — long-lived keypair

`value` holds a base64-encoded raw
[DSSE envelope](https://github.com/secure-systems-lab/dsse) wrapping the same
in-toto statement, signed with a long-lived Ed25519 keypair. `keyid`
identifies the signing key against a host-supplied trust root (§4.2).
`certificate`, if present, carries a PEM certificate for the key instead of a
bare `keyid` lookup.

This mode exists for signers who cannot or will not depend on Fulcio/OIDC:
air-gapped environments, private-PKI organizations, and this repository's
own conformance fixtures and example packages, where a live Fulcio/Rekor
round-trip would make CI non-deterministic and network-dependent. It is not
a lesser-trust fallback in the abstract — it shifts trust from "Sigstore's
public-good instance plus your OIDC provider" to "however you protect this
private key" — but it is the mode this repository's own tooling and examples
use, and its trust value is exactly as strong as the host's key custody.

## 4. Trust roots and identity constraints

Core does not mandate either mode's trust-root contents; that is Application
/ Host-layer security policy, consistent with the layered architecture in
[core §1.1](moca-core-spec.md#11-the-3-layer-system-architecture) —
the package format and its signature stay portable, but *whom to trust* is
always a host decision.

### 4.1 `sigstore` mode

- Defaults to Sigstore's public-good TUF trust root, fetched and cached
  locally by the `sigstore` package's embedded TUF client (seeded from a
  bundled root of trust, refreshed opportunistically — this is standard
  `sigstore-js`/`cosign` behavior, not a MOCA-specific mechanism).
- `--trust-root <cache-dir>` pins verification against a specific,
  pre-populated TUF cache directory instead of the ambient one, for
  air-gapped or fully reproducible verification.
- `--identity-constraint <issuer>=<identity-pattern>` (repeatable) restricts
  which OIDC issuer/identity pairs are accepted, mirroring
  `cosign verify --certificate-oidc-issuer`/`--certificate-identity`. Without
  at least one constraint, verification only proves *some* valid Sigstore
  signature exists — not that it came from anyone the host actually trusts
  to sign skill-bearing content. **A host SHOULD always configure at least
  one identity constraint before trusting `sigstore`-mode signatures.**

### 4.2 `dsse` mode

`--trust-root <trust-roots.json>` supplies an explicit map:

```json
{
  "keys": [
    {
      "keyid": "moca-spec-example-signing-key-2026",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n",
      "identity": "MOCA spec repo — non-production example signing key",
      "expires": "2027-09-01T00:00:00Z"
    }
  ]
}
```

A `keyid` absent from the supplied trust root, or past its `expires` date,
fails verification closed. `identity` is a free-text label surfaced in
diagnostics; it has no cryptographic meaning.

## 5. Offline vs. online verification

- **Offline (default).** No network calls. `dsse` verification is always
  offline — it only ever consults the supplied trust-root file. `sigstore`
  verification checks the bundle's embedded certificate chain against the
  locally cached/pinned trust root and the embedded Rekor inclusion
  proof/checkpoint against the locally cached Rekor public key. This is
  sufficient for reproducible CI and air-gapped hosts, but cannot see
  anything published *after* the bundle was produced — for example a
  since-revoked certificate, or an incident affecting a log entry.
- **`--online-verify`.** For `sigstore` mode only, additionally queries the
  live Rekor API to reconfirm transparency-log inclusion and refreshes the
  TUF trust root before verifying. `dsse` mode ignores this flag — there is
  nothing online to check. On network failure, verification **fails
  closed** by default; `--allow-offline-fallback` explicitly permits
  degrading to the offline check instead of failing outright.

## 6. Verification outcomes

Verification of a `signature` object produces exactly one of:

| Outcome | Meaning |
|---|---|
| **Valid** | Envelope parses, signature/certificate chain verifies, subject digest matches `canonicalDigest.value`, and (if configured) the signer identity satisfies the host's constraints. |
| **Malformed** | `signature` is present but is not a parseable envelope for its declared `type` — including the literal placeholder string `"PLACEHOLDER-NOT-A-REAL-SIGNATURE-DO-NOT-TRUST"` used by pre-signing example packages, and a `signature` present without a `canonicalDigest` (§2). |
| **Invalid** | Envelope parses but verification fails: bad signature bytes, a subject digest that does not match `canonicalDigest.value`, an expired/untrusted key or certificate, or a signer identity outside the host's configured constraints. |
| **Indeterminate** | `--online-verify` was requested but the live check could not complete, and `--allow-offline-fallback` was not passed. |

A harness or `moca-lint` MUST treat every outcome other than **Valid** as
"refuse to load `skills/`," per core §8.2 — Malformed, Invalid, and
Indeterminate are not distinguished by trust level, only by diagnostic
message.

## 7. Revocation

- **`sigstore` mode.** Fulcio-issued certificates are short-lived (minutes),
  which makes classic CRL/OCSP revocation largely moot — the exposure
  window closes on its own. `--online-verify` is what catches anything
  Sigstore's own incident process publishes after the fact (a compromised
  Rekor entry, a mis-issued certificate); offline verification cannot.
- **`dsse` mode.** Revocation is an `expires` field, or simply removing an
  entry, in the host's own `trust-roots.json` (§4.2). Core and this document
  do not specify a revocation *service* — key lifecycle is entirely host
  policy, consistent with §4's framing.

## 8. Key rotation

`dsse`-mode trust roots support multiple simultaneous `keys` entries. To
rotate a signing key: add the new key's entry to every consuming host's
trust root, sign new/updated packages with the new key, and only remove the
old key's entry once no signature a host still needs to verify depends on
it. There is no MOCA-specific rotation protocol beyond ordinary trust-root
file maintenance.

## 9. Worked example

See [`tools/moca-sign/README.md`](../tools/moca-sign/README.md) for the
`moca-sign sign`/`moca-sign verify` CLI walkthrough, and
[`examples/level-3-extended`](../examples/level-3-extended) for a
`dsse`-mode-signed package verifiable against the repository's own
documented (non-production) example signing key.
