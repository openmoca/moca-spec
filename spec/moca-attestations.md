# MOCA Attestations

Specification version: `0.6.0`
Status: Before `1.0.0`. A minor version may still change the format; each change is in [MIGRATIONS.md](../MIGRATIONS.md).
License: [Apache License 2.0](../LICENSE)

## 1. Scope

This document defines the two statements MOCA attests, how they are stored in
a package, and how a Reader verifies them. It does not define a signing
system: signing, certificates, transparency logs and key custody are
[Sigstore](https://www.sigstore.dev/)'s and
[DSSE](https://github.com/secure-systems-lab/dsse)'s, used as they are.

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, RECOMMENDED, MAY
and OPTIONAL are to be interpreted as described in RFC 2119 and RFC 8174 when,
and only when, they appear in capitals. Terms are as defined in
[package specification §2](moca-package-spec.md#2-conventions).

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

A Reader MUST ignore statements with a predicate type it does not know.

## 3. Package attestations

Predicate type: `https://w3id.org/moca/attestation/package/v1`

This predicate is MOCA's own for now. The OpenSSF Model Signing work defines a
signature format for AI artefacts; if it covers what this predicate says, a
later version may adopt it beside or instead of this one, through an ADR.

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [
    { "name": "https://example.com/moca/support-kb@4.2.0",
      "digest": { "sha256": "4992176b90ea0992037617ee56d5dcafecf60aeb400cfa9369c9164453df96da" } }
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
is **invalid** (`A002_ATTESTATION_INVALID`). A statement that names this
package's `id@version` with a different digest is positive evidence that the
content changed after it was signed, and is reported as
`A008_PACKAGE_DIGEST_MISMATCH` (error) instead.

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
| `reviewedAt` | When the review was made: an RFC 3339 date-time. |
| `outcome` | `accurate`, `needs-change` or `inaccurate`. |
| `scope`, `note` | Optional text: what was checked, and anything else. |

A review attestation counts for a node representation when its signature
verifies against a key or identity the host trusts for the `review` role, its
predicate is valid, and the subject's digest equals the current file's.
Subjects whose file changed are outdated (`A006_REVIEW_OUTDATED`, warning).

The reviewer named in the predicate is a claim by whoever signed. The trust
root decides whose signatures count. A trust-root key or identity MAY list the
`reviewers` it may sign as; a review naming anyone else is invalid (`A002`).
A common arrangement is one signing identity per reviewer.

A review whose `reviewedAt` is later than the host's clock does not count
(`A007_REVIEW_DATE_FUTURE`, warning). For each file, only the latest review
from each signer counts, by `reviewedAt`; a later review supersedes the same
signer's earlier verdict.

A file's reviews give its **review status**:

| Status | When |
| --- | --- |
| `approved` | The package is `signed`, and at least one current review says `accurate` and none says `needs-change` or `inaccurate`. |
| `disputed` | The package is `signed`, and a current review says `needs-change` or `inaccurate`. |
| `unverified` | Reviews exist, but the package has no valid package attestation. The reviewed bytes are real, but the package `id` the review names is only a claim, so a review here never counts as approved. |
| `none` | No current review. |

A package is `reviewed` ([package spec §11](moca-package-spec.md#11-capabilities))
when it is signed and every reviewed file is approved.

Reviews live outside the digest, so anyone who passes a package on can remove
one without trace. The absence of a review is not evidence of anything: a host
that needs every review of a package gets them from the reviewer or a log, not
from the package. A reviewer SHOULD list as subjects the evidence files a page
cites as well as the page itself, so the review stops counting if those files
change.

Reviews and OKF's `verified` field answer different questions. `verified`
is the author saying who checked; a review attestation is the checker saying
so, verifiably. Readers keep them apart in citation records.

## 5. Signing modes

| Mode | Trust rests on | Use when |
| --- | --- | --- |
| Sigstore (`*.sigstore.json`) | The Sigstore public-good instance (or a private one) and the signer's OIDC identity. Every signature is logged in Rekor. | Signing by people and CI with no long-lived key. Sigstore verification is an optional Reader feature ([Reader contract §14](moca-reader-contract.md#14-demonstrating-conformance)); if your recipients' Readers might not verify it, also sign with a DSSE key. |
| DSSE with a key (`*.dsse.json`) | Whoever holds the private key, and how well it is kept. | The portable choice: every Reader verifies it. Air-gapped environments, private PKI, and deterministic test fixtures. |

**DSSE keys are Ed25519** ([ADR-0014](../docs/adr/0014-dsse-keys-are-ed25519.md)).
A DSSE envelope is signed with an Ed25519 key (RFC 8032), and a trust root's
`publicKey` for it is the Ed25519 public key in PEM (SubjectPublicKeyInfo). A
Reader verifies a DSSE signature only with an Ed25519 key: a trusted key of any
other type verifies nothing, so the attestation is invalid (`A002`). Sigstore
attestations are not affected; Sigstore's own rules govern their keys.

**Strict Ed25519.** Ed25519 libraries disagree on unusual inputs, so a Reader
MUST check these before it verifies, and treat a failure as a signature that
does not verify:

- the public key `A` and the signature's `R` are each the canonical encoding
  of a point of prime order L: not the identity, with no small-order component,
  and with `y` less than p;
- the signature's `S` is less than L.

With these, RFC 8032's cofactored and cofactorless equations give the same
answer. Producers never meet the difference: a key made by any Ed25519
library passes. `moca-sign trust add` refuses a key that does not. The
corpus's `signature-small-order-key` and `signature-mixed-order-key` cases
test it; the
[ed25519-speccheck](https://github.com/novifinancial/ed25519-speccheck)
vectors all fail it.

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

- `keyid` MUST be unique within a trust root. A Reader MUST refuse a trust
  root that repeats one, as it refuses any trust root that is not valid
  against the schema: that is a host error, not a package diagnostic.
- `publicKey` is an Ed25519 public key (§5).
- `roles` is REQUIRED on every key and identity, and lists what it may
  attest: `package`, `review` or both. An empty list trusts it for nothing,
  which is how a host disables an entry without removing it.
- `ids` is OPTIONAL: the package ids a key or identity may speak for when a
  package it signed supersedes or contests another
  ([package spec §7.2](moca-package-spec.md#72-relations)). Without `ids`, a
  package it signs can make no relation take effect.
- A key is not trusted from the instant the host's clock reaches `expires`
  (now ≥ `expires`, compared as in
  [package spec §4.4](moca-package-spec.md#44-validity-window)); a key whose
  `expires` does not parse is not trusted at all. DSSE carries no trusted
  signing time, so expiry is checked against the clock when the package is
  read, not when it was signed: every package signed with a key stops being
  `signed` when that key expires. Re-sign packages with a new key before the
  old one expires, or sign long-lived archives with Sigstore, whose
  transparency log records when each signature was made.
- A Sigstore identity matches a certificate when `issuer` equals the
  certificate's OIDC issuer (the Fulcio extension OID 1.3.6.1.4.1.57264.1.8,
  or the older 1.3.6.1.4.1.57264.1.1) and `subject` equals its subject
  alternative name (an email address or a URI), both exactly and
  case-sensitively. There are no patterns.
- **Sigstore trust material.** `sigstore.trustedRoot` MAY hold a Sigstore
  trusted root: the `trusted_root.json` document of
  [sigstore/protobuf-specs](https://github.com/sigstore/protobuf-specs), with
  the Fulcio certificate authorities, Rekor and certificate-transparency log
  keys and timestamp authorities to verify against. When it is present, a
  Reader MUST verify Sigstore bundles against it and nothing else, offline.
  When it is absent, a Reader MAY use trust material it already has, such as
  a cached copy of the public-good instance's, and MUST NOT fetch any unless
  the host enabled online checks. A host that runs a private Sigstore
  instance, or reads packages offline, supplies `trustedRoot`. A Reader MAY
  verify offline only and use no trust material but `trustedRoot`; without
  it, such a Reader reports Sigstore attestations as unverifiable. To follow
  key rotation in the public-good instance, a host refreshes `trustedRoot`
  from Sigstore's TUF repository on its own schedule; the Reader never does. A Sigstore
  attestation is valid only for an identity listed here; "some valid Sigstore
  signature exists" is never enough.

## 7. Verifying an attestation

A Reader verifies each attestation file on its own, in this order. A step
that fails ends the verification of that file with the outcome named.

1. **Select.** Only regular files under `attestations/` whose names end in
   `.dsse.json` or `.sigstore.json` are attestations. Other files there are
   ignored.
2. **Parse.** The file is JSON. For DSSE it is the envelope; for Sigstore the
   envelope is the bundle's `dsseEnvelope`. The envelope has a string
   `payload` and a string `payloadType`. Otherwise: **malformed**.
3. **Payload type.** `payloadType` is `application/vnd.in-toto+json`.
   Otherwise: **malformed**.
4. **Decode.** `payload` is base64 (RFC 4648 §4) or base64url (§5), with or
   without padding; any other character, or a length no encoding can
   produce, makes it **malformed**. The decoded bytes are a JSON object with
   `_type` equal to `https://in-toto.io/Statement/v1`, an array `subject`,
   and a string `predicateType`. Otherwise: **malformed**.
5. **Predicate type.** A statement whose `predicateType` is neither the
   package (§3) nor the review (§4) predicate is ignored: no diagnostic, and
   it attests nothing. Otherwise the predicate type sets the **role**:
   `package` or `review`.
6. **Trust root.** With no trust root: **unverifiable**. For Sigstore, with no
   Sigstore identities in the trust root, with no trust material to verify
   against (§6), or in a Reader that does not implement Sigstore
   verification: **unverifiable**. A `trustedRoot` that is not a usable
   trusted root leaves the Reader with no trust material.
7. **Signature.**
   - **DSSE.** `signatures` is a non-empty array. Each entry with a string
     `keyid` and a string `sig` is tried; an entry without both is skipped.
     The candidate key is the trust-root key with that `keyid`. It counts only
     if its `roles` include the role, it has not expired, and it is Ed25519
     (§5). The signature is `sig`, decoded as in step 4, and it is verified
     over the DSSE pre-authentication encoding (PAE) of `payloadType` and the
     decoded payload: `DSSEv1 <len> <type> <len> <payload>`, each length the
     decimal byte length of the field after it. Ed25519 verification follows
     RFC 8032 §5.1.7 and rejects a signature whose `S` is not less than the
     group order. The first entry that verifies makes the signature valid;
     one is enough. If none verifies, including when no key matches, a key
     has the wrong role, or a key is not Ed25519: **invalid**.
   - **Sigstore.** The bundle verifies under Sigstore's rules for an identity
     the trust root lists for the role (§6). If identities are listed but
     none for the role, or none matches: **invalid**.
8. **Statement.** A package attestation's statement MUST match the package
   (§3); a review's predicate MUST be valid, MUST name the package's `id`, and
   every subject MUST have a string `name` and a string `sha256` digest (§4).
   Otherwise: **invalid**.

An attestation that passes every step is **valid**. Its **signer** is the
trust-root key's `identity`, or its `keyid` when it has no `identity`; for
Sigstore, the identity's `issuer` and `subject`, separated by a space. A
package's `signers` are the signers of its valid package attestations, in
file-name order.

| Outcome | Diagnostic |
| --- | --- |
| Valid | none |
| Malformed | `A001` (error) |
| Invalid | `A002` (error) |
| Unverifiable | `A003` (warning) |
| Indeterminate: online verification was requested and could not complete, and offline fallback was not allowed | `A004` (warning) |

A review subject whose file has changed is outdated (`A006`, warning), one
diagnostic for each such subject; the review still counts for its other
subjects.

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

A missing or invalid attestation leaves the rest of the package valid (§7),
because many hosts read unsigned packages. A host that serves only signed
content reads with `requireSignature`: a package with no valid package
attestation is then invalid (`A009_SIGNATURE_REQUIRED`), so a tampered or
unsigned package is refused rather than served unsigned. See also
[package spec §13.5](moca-package-spec.md#135-old-versions-frozen-copies-and-forged-copies).
