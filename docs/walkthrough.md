# Walkthrough

From a folder of Markdown to a signed, reviewed, indexed package served to an
agent. Every command and output below was run against a copy of
[`examples/support-kb`](../examples/support-kb). Start in the repository root
after `npm install`:

```sh
M="$PWD/tools"
mkdir -p /tmp/moca-walkthrough && cd /tmp/moca-walkthrough
cp -R "$M/../examples/support-kb" support-kb && rm -rf support-kb/attestations
```

## 1. Check the package

```sh
node $M/moca-lint/bin/moca-lint.js lint support-kb
```

```text
No findings.

sha256:6539697fc762840cbaa031aec5288aae588ff6f376d56e24bc4ca98d647e5610
capabilities: core, localized, located-evidence
```

The digest identifies this exact content. `located-evidence` comes from the
`moca.evidence` selectors in `refund-window.md`, and `localized` from its
French representation.

## 2. Create keys and a trust root

In production, prefer Sigstore (`--sigstore`), which needs no long-lived keys.
Here we use local Ed25519 keys:

```sh
node $M/moca-sign/bin/moca-sign.js keygen --keyid acme-publisher --roles package --identity "Acme publishing key" --out keys
node $M/moca-sign/bin/moca-sign.js keygen --keyid sam-reviewer  --roles review  --identity "Sam Ortiz" --out keys
```

`keys/trust-root.json` now lists both public keys, each limited to its role.
The trust root belongs to whoever **reads** packages: it says whom they trust,
for what.

## 3. Sign as the publisher

```sh
node $M/moca-sign/bin/moca-sign.js sign support-kb --key keys/acme-publisher.pem --keyid acme-publisher
```

```text
Signed sha256:6539697fc762840cbaa031aec5288aae588ff6f376d56e24bc4ca98d647e5610
Wrote attestations/package.acme-publisher.dsse.json
```

The digest did not change: `attestations/` is outside it.

## 4. Record a review

Sam checked the refund policy against the customer terms:

```sh
node $M/moca-sign/bin/moca-sign.js review support-kb --nodes refund-window.md \
  --reviewer human:sam.ortiz --scope "Checked against the customer terms" \
  --key keys/sam-reviewer.pem --keyid sam-reviewer
```

The review binds Sam's statement to the exact bytes of
`content/refund-window.md`. Adding it did not change the package or need a
re-sign.

## 5. Verify, as a reader would

```sh
node $M/moca-sign/bin/moca-sign.js verify support-kb --trust-root keys/trust-root.json
node $M/moca-lint/bin/moca-lint.js lint support-kb --trust-root keys/trust-root.json
```

```text
VALID         attestations/package.acme-publisher.dsse.json  (Acme publishing key)
VALID         attestations/reviews/human-sam-ortiz-2026-09-27.dsse.json  (Sam Ortiz)

Verified sha256:6539697fc762840cbaa031aec5288aae588ff6f376d56e24bc4ca98d647e5610

No findings.

sha256:6539697fc762840cbaa031aec5288aae588ff6f376d56e24bc4ca98d647e5610
capabilities: core, localized, located-evidence, reviewed, signed
```

Without `--trust-root`, the attestations are reported as unverifiable and the
package is neither `signed` nor `reviewed`: trust is always the reader's call.

## 6. Build a sidecar index

```sh
node $M/moca-index/bin/moca-index.js build support-kb -o support-kb.moca.idx --chunk headings
node $M/moca-lint/bin/moca-lint.js lint support-kb --sidecar support-kb.moca.idx
```

The sidecar is bound to the digest. Change the package and the sidecar is
reported stale and ignored.

## 7. Pack and ship

```sh
node $M/moca-lint/bin/moca-lint.js pack support-kb -o support-kb.moca --trust-root keys/trust-root.json
node $M/moca-lint/bin/moca-lint.js digest support-kb.moca
```

```text
sha256:6539697fc762840cbaa031aec5288aae588ff6f376d56e24bc4ca98d647e5610
```

The archive has the same digest as the folder. To publish to a registry, see
the [OCI binding](../spec/moca-oci-binding.md).

## 8. Serve it to an agent

```sh
node $M/moca-mcp/bin/moca-mcp.js support-kb.moca --trust-root keys/trust-root.json --audience public
```

Register that command as a stdio server in any MCP client. A `moca_search` for
"refund window" returns a citation record with the text, the package version
and digest, `signed: true`, Sam's attested review, the evidence quote from the
customer terms, and `stale: false`. The internal account-deletion procedure is
never returned, because the host allowed only the `public` audience.

## 9. See what tampering looks like

Change one word in the reviewed node, then verify again:

```sh
sed -i.bak 's/30 days of delivery/45 days of delivery/' support-kb/content/refund-window.md
node $M/moca-sign/bin/moca-sign.js verify support-kb --trust-root keys/trust-root.json
```

```text
INVALID       attestations/package.acme-publisher.dsse.json  (Acme publishing key)  subject digest does not match the package digest
OUTDATED      attestations/reviews/human-sam-ortiz-2026-09-27.dsse.json  (Sam Ortiz)

attestations/package.acme-publisher.dsse.json
  ERROR A002_ATTESTATION_INVALID  package attestation does not match this package: subject digest does not match the package digest
attestations/reviews/human-sam-ortiz-2026-09-27.dsse.json
  WARNING A006_REVIEW_OUTDATED  review of content/refund-window.md no longer matches the file

Verification failed.
```

The publisher's signature no longer covers the content, and Sam's review no
longer counts for the changed node.
