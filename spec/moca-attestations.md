# MOCA Attestations

Specification version: `0.3.0-alpha.1`
Status: Alpha. Expect changes before `1.0.0`.
License: [Apache License 2.0](../LICENSE)

## 1. Scope

This document defines the two statements MOCA attests, how they are stored in
a package, and how a Reader verifies them. It does not define a signing
system: signing, certificates, transparency logs and key custody are
[Sigstore](https://www.sigstore.dev/)'s and
[DSSE](https://github.com/secure-systems-lab/dsse)'s, used as they are.

## 2. Files and envelopes

Attestations live under the package's top-level `attestations/` directory,
which the digest excludes. Each file holds one envelope:

| File name | Envelope |
| --- | --- |
| `*.dsse.json` | A DSSE envelope, JSON serialisation, signed with a long-lived key. |
| `*.sigstore.json` | A Sigstore bundle containing a DSSE envelope, signed keyless with a short-lived certificate and logged in Rekor. |

The envelope's `payloadType` MUST be `application/vnd.in-toto+json` and its
payload an in-toto v1 Statement. Conventional names are
`attestations/package.<signer>.dsse.json`, `attestations/package.sigstore.json`
and `attestations/reviews/<reviewer>-<date>.<dsse|sigstore>.json`; Readers
MUST NOT depend on names beyond the suffix.

A Reader ignores statements with a predicate type it does not know.

## 3. Package attestations

Predicate type: `https://w3id.org/moca/attestation/package/v1`

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [
    { "name": "https://example.com/moca/support-kb@4.2.0",
      "digest": { "sha256": "6539697fc762840cbaa031aec5288aae588ff6f376d56e24bc4ca98d647e5610" } }
  ],
  "predicateType": "https://w3id.org/moca/attestation/package/v1",
  "predicate": {}
}
```

The statement has exactly one subject. Its `name` is `<id>@<version>` from
`moca.json`, and its `sha256` is the package digest without the `sha256:`
prefix. It asserts only that the signer published exactly this content.

A package attestation is **valid** for a host when its signature verifies
against a key or identity the host trusts for the `package` role, and its
subject matches the package's `id`, `version` and computed digest. Otherwise it
is **invalid** (`A002_ATTESTATION_INVALID`).

Several package attestations MAY be present, for example a publisher and a
distributor. Each valid one names a signer.

## 4. Review attestations

Predicate type: `https://w3id.org/moca/attestation/review/v1`

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [
    { "name": "content/refund-window.md",
      "digest": { "sha256": "…sha256 of the file's bytes…" } }
  ],
  "predicateType": "https://w3id.org/moca/attestation/review/v1",
  "predicate": {
    "package": "https://example.com/moca/support-kb",
    "reviewer": "human:sam.ortiz",
    "reviewedAt": "2026-08-14T00:00:00Z",
    "outcome": "accurate",
    "scope": "Checked against Acme Customer Terms section 7"
  }
}
```

A review attestation records that a reviewer checked exact files. Its subjects
are package-relative file paths and the SHA-256 of each file's bytes, so a
review stays true across package versions for as long as the file is
unchanged, and stops counting as soon as it changes. The predicate is
validated by [`review-predicate.schema.json`](../schemas/v1/review-predicate.schema.json):

| Field | Meaning |
| --- | --- |
| `package` | The package `id` the review was made in. MUST equal the reading package's `id`. |
| `reviewer` | Who reviewed, as an OKF actor (`human:<id>`, `process:<id>`, `<producer>/<version>`). |
| `reviewedAt` | When. |
| `outcome` | `accurate`, `needs-change` or `inaccurate`. |
| `scope`, `note` | Optional text: what was checked, and anything else. |

A review attestation counts for a node representation when its signature
verifies against a key or identity the host trusts for the `review` role, its
predicate is valid, and the subject's digest equals the current file's.
Subjects whose file changed are outdated (`A006_REVIEW_OUTDATED`, warning).

The reviewer named in the predicate is a claim by whoever signed. The trust
root decides whose signatures count; the host decides whether a signer may
review on behalf of the reviewer it names. A common arrangement is one
signing identity per reviewer.

Reviews and OKF's `verified` field answer different questions. `verified`
is the author saying who checked; a review attestation is the checker saying
so, verifiably. Readers keep them apart in citation records.

## 5. Signing modes

| Mode | Trust rests on | Use when |
| --- | --- | --- |
| Sigstore (`*.sigstore.json`) | The Sigstore public-good instance (or a private one) and the signer's OIDC identity. Every signature is logged in Rekor. | Signing by people and CI. Recommended default. |
| DSSE with a key (`*.dsse.json`) | Whoever holds the private key, and how well it is kept. | Air-gapped environments, private PKI, and deterministic test fixtures. Ed25519 keys are recommended. |

MOCA adds nothing to either mode's cryptography. Revocation, key rotation and
transparency follow Sigstore's model, or the host's own key management for
DSSE.

## 6. Trust roots

Whom to trust is always the host's decision. A host supplies a trust root,
valid against [`trust-root.schema.json`](../schemas/v1/trust-root.schema.json):

```json
{
  "keys": [
    { "keyid": "acme-publisher-2026", "publicKey": "-----BEGIN PUBLIC KEY-----\n…",
      "identity": "Acme Support publishing key", "expires": "2027-01-01T00:00:00Z",
      "roles": ["package"] }
  ],
  "sigstore": {
    "identities": [
      { "issuer": "https://token.actions.githubusercontent.com",
        "subject": "https://github.com/acme/kb/.github/workflows/publish.yml@refs/heads/main",
        "roles": ["package"] },
      { "issuer": "https://accounts.google.com", "subject": "sam.ortiz@acme.example", "roles": ["review"] }
    ]
  }
}
```

- `roles` limits what a key or identity may attest. Without `roles`, it may
  attest both.
- A key past `expires` is not trusted.
- A Sigstore attestation is valid only for an identity listed here. A trust
  root with no Sigstore identities makes every Sigstore attestation
  unverifiable; "some valid Sigstore signature exists" is never enough.

## 7. Verification outcomes

| Outcome | Meaning | Diagnostic |
| --- | --- | --- |
| Valid | Signature verifies for the role, and the statement matches the package. | none |
| Malformed | Not an envelope, wrong payload type, or not an in-toto v1 Statement. | `A001` (error) |
| Invalid | The signature does not verify for the role, or the statement does not match. | `A002` (error) |
| Unverifiable | No trust root, or no trusted identity for this mode and role. | `A003` (warning) |
| Indeterminate | Online verification was requested and could not complete, and offline fallback was not allowed. | `A004` (warning) |

Verification is offline by default. Online verification (checking the live
transparency log and refreshing Sigstore's trust material) is opt-in.

Only **valid** attestations count. Every other outcome is reported and
otherwise treated as if the attestation were absent. None of them makes the
rest of the package invalid.

## 8. What attestations do not prove

A valid package attestation proves who published the bytes. A valid review
proves who signed a statement about them. Neither proves the content is true or
safe to follow. Content remains untrusted input to a model
([package spec §13.1](moca-package-spec.md#131-content-is-untrusted-input-to-a-model)).
