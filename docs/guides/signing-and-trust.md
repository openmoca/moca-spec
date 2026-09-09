# Signing and trust

Practical guide to signing packages and verifying them. The normative rules
are in [the trust model](../../spec/moca-trust-model.md); this page is how you
actually do it.

## When you must sign

**Any package containing `skills/` must be signed.** Not "should" — a
conformant harness must refuse to load skill content from an unsigned or
signature-invalid package
([core §8.2](../../spec/moca-core-spec.md#82-security--trust-boundary-rule)).
`skills/` is executable-adjacent content, and it is never permitted to ship
unsigned.

You may also want to sign a package with no skills at all, simply to let
consumers prove the bytes they hold are the bytes you published.

## What a signature actually covers

A signature binds to the package's `canonicalDigest.value` — **not** to
archive bytes. Archive bytes change with Zip entry order, compression, and
timestamps, none of which relate to content identity.

`canonicalDigest` covers every resource file plus the manifest, with
`canonicalDigest` and `signature` themselves removed (otherwise the digest
would depend on the signature computed from it). A signed package must
therefore also declare `canonicalDigest`.

The signed payload is an in-toto v1 Statement wrapped in DSSE, with the
package's digest as its subject.

### The consequence people trip over

Because the manifest is part of the digest, **editing any manifest field
invalidates the signature** — including fields with no semantic weight, like
`license` or a `keywords` entry. There is no "metadata-only" edit, and a
verifier cannot distinguish one from a content change (nor should it try).

Under composition this compounds: a composed package folds its members'
declared digests, so changing one member invalidates every package composing
it, transitively. Re-derivation must run in dependency order — members before
composers.

Automate it. This repository uses `npm run refresh:derived`, which
topologically orders packages, recomputes digests, re-signs, and re-binds
sidecars in one command. See
[trust model §2.1](../../spec/moca-trust-model.md#21-any-manifest-edit-is-a-re-signing-event).

## Two modes

| Mode | Key material | Network | Use when |
|---|---|---|---|
| **`sigstore`** | Keyless, via Fulcio + Rekor and an OIDC identity | Required to sign | Real-world distribution, especially from CI |
| **`dsse`** | A long-lived Ed25519 keypair | None | Air-gapped, reproducible, or test corpora |

`sigstore` is the recommended mode for real signing — it ties the signature to
a verifiable identity rather than to possession of a file. `dsse` is what this
repository's own examples use, because it works offline and deterministically
in CI.

## Signing with `dsse`

```sh
# 1. Generate a keypair (once)
npx @openmoca/moca-sign generate-key -o my-key --keyid my-key-2026
# writes my-key.pem (private — keep secret), my-key.pub.pem,
# and my-key.trust-root.json

# 2. Sign
npx @openmoca/moca-sign sign ./my-package \
  --mode dsse --key my-key.pem --keyid my-key-2026

# 3. Verify your own work
npx @openmoca/moca-lint lint ./my-package --trust-root my-key.trust-root.json
```

`generate-key` emits a matching trust root because a `dsse` signature that
cannot be checked is reported as `E406`, never silently accepted — so without
one, a package you just signed is unlintable until you hand-write the file.

`sign` recomputes `canonicalDigest` from current on-disk content and writes
both `canonicalDigest` and `signature` into `moca.json` in place.

> **Keep keys and trust-root files outside the package directory.**
> `canonicalDigest` covers every file under the package root — a private key
> saved next to `moca.json` becomes signed package content, and is then
> distributed with it.

## Signing with `sigstore`

```sh
npx @openmoca/moca-sign sign ./my-package --mode sigstore
```

Requires a real OIDC identity token — ambient CI credentials (GitHub Actions,
for instance) or an explicit `--identity-token`. There is no long-lived
private key to protect, which is the main reason to prefer it.

## Verifying

Verification is part of linting, so it happens wherever you already lint:

```sh
# dsse: supply the trust root that lists acceptable signers
npx @openmoca/moca-lint lint ./my-package --trust-root ./trust-roots.json

# sigstore: constrain which identities you accept
npx @openmoca/moca-lint lint ./my-package \
  --identity-constraint "https://token.actions.githubusercontent.com=https://github.com/myorg/*"
```

Verification is **offline by default**. `--online-verify` additionally
confirms live Rekor inclusion and refreshes the trust root; if it cannot
complete, the result is *indeterminate* rather than a pass, unless you
explicitly pass `--allow-offline-fallback`.

### The findings you'll see

| Code | Meaning |
|---|---|
| `E401` | `skills/` present, no `signature` object at all |
| `E404` | `signature` present but unparseable, or `canonicalDigest` missing |
| `E406` | Verification failed — tampered content, or a signer outside your trust root |
| `E407` | `--online-verify` couldn't complete and fallback wasn't allowed |

A `dsse`-mode signature with no `--trust-root` supplied reports `E406`, not a
silent pass. There is no configuration under which an unverified signature
counts as verified.

## Setting up a `dsse` trust root

`generate-key` writes a single-key trust root for you. A real one lists every
signer you accept:

```json
{
  "keys": [
    {
      "keyid": "my-key-2026",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----",
      "identity": "Release signing key, rotated 2026-01",
      "expires": "2027-01-01T00:00:00Z"
    }
  ]
}
```

Trust roots are **host configuration, not package content**. They express who
*you* trust, so they never ship inside a package — and a package that arrives
with its own trust root has told you nothing. Distribute them through whatever
channel you already use for configuration.

## What signing does *not* give you

- **It is not authorization.** A valid signature says "this came from that
  signer unmodified". Whether that signer may supply content to your system is
  a host policy decision.
- **It does not make skills safe.** Verification tells you the skill is
  authentic, not benign. You must still filter `allowed-tools` against host
  policy before executing anything — `allowed-tools` is a request, not a
  grant.
- **It says nothing about content quality.** Signed content can still be
  `disputed` or out of date. Read `epistemicStatus` and `lastReviewed`.

## Rejecting skills without rejecting the package

The rule most often implemented wrongly: if signature verification fails, a
harness must refuse the `skills/` content — but it MUST NOT treat the rest of
the package as untrustworthy on those grounds, or vice versa. Unsigned skills
mean "ignore the skills", not "reject the package".

## The example key in this repository

`fixtures/signing-keys/` contains a real Ed25519 keypair, private half
included, used to sign this repository's example packages so they carry
genuine verifiable signatures rather than placeholders.

**It has no trust value.** It is published deliberately so anyone can inspect
it and re-sign the examples. Never configure a real host to trust
`moca-spec-example-signing-key-2026`.
