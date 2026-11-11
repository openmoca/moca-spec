# Signing and review

A package's digest proves the content has not changed. A **signature** proves
who published it, and a signed **review** proves who checked a page. Both are
statements a reader can verify, instead of taking the author's word.

| Statement | Says | Made by | Command |
| --- | --- | --- | --- |
| Package attestation | "I published exactly this package, at this version." | The publisher, usually in CI | `moca-sign sign` |
| Review attestation | "I checked exactly these pages, and here is my verdict." | A reviewer | `moca-sign review` |

Both are files under `attestations/`, outside the digest
([attestations spec](../../spec/moca-attestations.md)). Adding one never
changes what it signs.

This guide signs and reviews the package from
[authoring packages](authoring.md), then shows what happens when it changes
version and when the publisher changes key. Every command and output below
was run with the 0.6.0 tools. The [walkthrough](../walkthrough.md) is a
shorter first run of the same commands.

## Choose how to sign

| Mode | How | Verified by | Use when |
| --- | --- | --- | --- |
| **An Ed25519 key** (DSSE, `--key`) | A key pair you make and keep. Readers trust its public key. | All three Readers, `moca-sign verify`, `moca-lint`, the MCP server | You want every Reader to verify it today. Air-gapped and private setups. |
| **Sigstore** (`--sigstore`) | No long-lived key: the signer proves an identity they already have, such as a CI workflow or a company account, and the signature is logged publicly. | The TypeScript Reader and the tools built on it. The .NET and Python Readers report it as unverifiable for now (`A003`). | Signing from CI without managing a key, for readers on the TypeScript Reader or the tools. |

A package can carry both: sign with a key so every Reader verifies it, and
with Sigstore as well. DSSE keys are always Ed25519
([attestations §5](../../spec/moca-attestations.md#5-signing-modes)).

## 1. Make keys

```sh
npx @openmoca/moca-sign keygen --keyid acme-2026 --roles package \
  --identity "Acme publishing key 2026" --expires 2027-06-30 --out publisher
npx @openmoca/moca-sign keygen --keyid sam --roles review --identity "Sam Ortiz" --out reviewer
```

```text
Wrote acme-2026.pem and acme-2026.pub.pem, and added the key to publisher/trust-root.json. Keep private keys out of every package.
Wrote sam.pem and sam.pub.pem, and added the key to reviewer/trust-root.json. Keep private keys out of every package.
```

- **`.pem`** is the private key. Keep it secret: in CI, store it as a secret,
  never in the repository, and never in a package.
- **`.pub.pem`** is the public key. Publish it, with its key id, somewhere
  your readers already trust, such as your website or repository.
- **`--roles`** limits what the key may sign: `package`, `review` or both.
  Separate keys for publishing and reviewing mean a reviewer's key can never
  pass as the publisher's.
- **`--expires`** sets when readers stop trusting the key. Plan to rotate
  before then (step 5).

Your readers add the public keys to their own trust roots with
`moca-sign trust add`. Here, the reader's trust root:

```sh
npx @openmoca/moca-sign trust add trust-root.json --keyid acme-2026 \
  --public-key publisher/acme-2026.pub.pem --identity "Acme publishing key 2026" \
  --roles package --expires 2027-06-30
npx @openmoca/moca-sign trust add trust-root.json --keyid sam \
  --public-key reviewer/sam.pub.pem --identity "Sam Ortiz" --roles review
```

```text
Added key acme-2026 in trust-root.json, trusted for package.
Added key sam in trust-root.json, trusted for review.
```

See [your trust root](consuming.md#your-trust-root) for the reader's side.

## 2. Sign the package

```sh
npx @openmoca/moca-sign sign kb --key publisher/acme-2026.pem --keyid acme-2026
```

```text
Signed sha256:e58a7cfca2bb0c8178e74d3f9408e4238809135d646a628685c60d78bf0c34ac
Wrote attestations/package.acme-2026.dsse.json
```

The signature names the package's id, its version and its digest. `sign`
refuses a package that is not valid, so check it first with
`moca-lint lint --strict`.

## 3. Record reviews

Sam has checked the refund page, in English and French, against the customer
terms:

```sh
npx @openmoca/moca-sign review kb --nodes refund-window.md refund-window.fr.md \
  --reviewer human:sam.ortiz --outcome accurate \
  --scope "Checked against Acme Customer Terms section 7" --key reviewer/sam.pem --keyid sam
```

```text
Reviewed content/refund-window.md, content/refund-window.fr.md
Wrote attestations/reviews/human-sam-ortiz-2026-11-03.dsse.json
```

Sam also looked at the 2027 page, and is not happy with it yet:

```sh
npx @openmoca/moca-sign review kb --nodes refund-window-2027.md \
  --reviewer human:sam.ortiz --outcome needs-change \
  --note "Wait for legal to confirm the 45 days" --name sam-2027-draft \
  --key reviewer/sam.pem --keyid sam
```

```text
Reviewed content/refund-window-2027.md
Wrote attestations/reviews/sam-2027-draft.dsse.json
```

A reader sees each page's **review status** in its citation records: the
refund page is `approved`, and the 2027 page is `disputed` until Sam reviews it
again as `accurate` (Sam's latest review counts). Reviews count as approved
only in a **signed** package: the publisher vouches for the package, the
reviewer for the pages within it. In an unsigned package they show as
`unverified`. The package is `reviewed` only when every reviewed page is
approved.

| Option | Means |
| --- | --- |
| `--nodes` | The pages reviewed, relative to `content/`. The review covers each file's exact bytes. |
| `--reviewer` | Who reviewed, as an OKF actor, such as `human:sam.ortiz`. |
| `--outcome` | `accurate` (the default), `needs-change` or `inaccurate`. |
| `--scope` | What the review covered. |
| `--note` | Anything else the reader should know. |
| `--at` | When, if not now. |
| `--name` | The file name under `attestations/reviews/`, if not the reviewer and the day. |

Each verified review appears in the page's citation records, under
`trust.attestedReviews`, with its signer, outcome, scope and date. The
Reader reports the verdict; your application decides what it means, for
example to show "reviewed by Sam Ortiz" only for `accurate`.

OKF's `verified` field, written in the page itself, is the author saying who
checked it. A review attestation is the checker saying so, verifiably.
Citation records keep them apart (`declaredVerified` and `attestedReviews`),
and it is worth writing both: `verified` for readers that only understand
OKF.

## 4. Verify, as a reader would

```sh
npx @openmoca/moca-sign verify kb --trust-root trust-root.json
```

```text
VALID         attestations/package.acme-2026.dsse.json  (Acme publishing key 2026)
VALID         attestations/reviews/human-sam-ortiz-2026-11-03.dsse.json  (Sam Ortiz)
VALID         attestations/reviews/sam-2027-draft.dsse.json  (Sam Ortiz)

Verified sha256:e58a7cfca2bb0c8178e74d3f9408e4238809135d646a628685c60d78bf0c34ac
```

`verify` exits 0 only when every attestation verifies and at least one
package attestation is valid, so it can gate a release. A Reader is more
forgiving: it counts the attestations that verify and reports the rest as
diagnostics, and the package is still read.

## 5. A new version

Acme adds a page about final-sale items and releases version 1.1.0. Before
re-signing:

```text
INVALID       attestations/package.acme-2026.dsse.json  (Acme publishing key 2026)  subject "https://example.com/moca/acme-policies@1.0.0" does not name https://example.com/moca/acme-policies@1.1.0
VALID         attestations/reviews/human-sam-ortiz-2026-11-03.dsse.json  (Sam Ortiz)
VALID         attestations/reviews/sam-2027-draft.dsse.json  (Sam Ortiz)

attestations/package.acme-2026.dsse.json
  ERROR A002_ATTESTATION_INVALID  package attestation does not match this package: subject "https://example.com/moca/acme-policies@1.0.0" does not name https://example.com/moca/acme-policies@1.1.0

1 error(s), 0 warning(s), 0 info

Verification failed.
```

- **The package signature no longer counts.** It named version 1.0.0 and the
  old digest. Sign every release again with `moca-sign sign`.
- **The reviews still count.** A review names files, not versions, and the
  pages Sam reviewed did not change. The moment one does, its review is
  reported as outdated (`A006_REVIEW_OUTDATED`) and stops counting for that
  page. Re-review it and add a new attestation; old ones can stay for the
  record.

## 6. Change keys

Before `acme-2026` expires, Acme makes `acme-2027`, gives readers its public
key, and signs with both:

```sh
npx @openmoca/moca-sign keygen --keyid acme-2027 --roles package \
  --identity "Acme publishing key 2027" --expires 2028-06-30 --out publisher
npx @openmoca/moca-sign sign kb --key publisher/acme-2027.pem --keyid acme-2027
```

The package now has two package attestations, one per key. A reader who
trusts either key sees the package as `signed`. Once readers have the new key,
Acme removes the old attestation from its next release.

In between, `moca-sign verify` is strict. For a reader who already trusts only
the new key, the old signature does not verify, so the command fails:

```text
INVALID       attestations/package.acme-2026.dsse.json  no signature verified against a trusted key
VALID         attestations/package.acme-2027.dsse.json  (Acme publishing key 2027)
```

The Reader still counts the valid one, so the package is `signed`:

```text
capabilities: core, localized, located-evidence, reviewed, self-contained-evidence, signed
```

## Sign in CI with Sigstore

In GitHub Actions, the workflow's identity signs, with no key to keep:

```yaml
permissions:
  contents: read
  id-token: write   # lets the job prove its identity to Sigstore
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with: { node-version: 22 }
  - run: npx @openmoca/moca-lint lint kb --strict
  - run: npx @openmoca/moca-sign sign kb --sigstore
  - run: npx @openmoca/moca-lint pack kb -o kb.moca
```

This writes `attestations/package.sigstore.json`, a Sigstore bundle with the
signature and its public log entry. It needs a CI identity, so unlike the rest
of this guide it was not run for this page. Readers trust the workflow, not a key:

```sh
npx @openmoca/moca-sign trust add trust-root.json \
  --issuer https://token.actions.githubusercontent.com \
  --subject https://github.com/acme/kb/.github/workflows/publish.yml@refs/heads/main \
  --roles package
```

which adds:

```json
{ "sigstore": { "identities": [
  { "issuer": "https://token.actions.githubusercontent.com",
    "subject": "https://github.com/acme/kb/.github/workflows/publish.yml@refs/heads/main",
    "roles": ["package"] } ] } }
```

Only a signature from that exact workflow, on that branch, is accepted.
Remember the limit above: the .NET and Python Readers do not verify Sigstore
yet, so for them, sign with a key as well. Reviewers with company accounts can
sign reviews with `--sigstore` in the same way.

## What signing does not do

It does not make content true or safe. A signature proves who published it,
not that it is right, and package text is still untrusted input to a model,
whoever signed it ([SECURITY.md](../../SECURITY.md)). A package carries
knowledge, never instructions or tools for an agent to run
([ADR-0011](../adr/0011-park-unconsumed-features.md)).

## Next

- [Consuming packages](consuming.md#your-trust-root): the reader's trust
  root, and what a citation record says about signatures and reviews.
- [Capabilities](capabilities.md): `signed` and `reviewed`, and when you need
  them.
- [Attestations specification](../../spec/moca-attestations.md): the formats
  and every rule.
