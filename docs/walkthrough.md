# End-to-end walkthrough

From a folder of Markdown to a signed, packed, searchable package — then
reading it back and answering a question with grounded evidence.

Every command here was run against this repository's tooling; the outputs are
real. Total time is a few minutes.

> This is the reduced form of the full reference example on the
> [roadmap](../ROADMAP.md). It stops short of a live model call, because that
> would tie the walkthrough to a specific provider — the point is that
> everything up to the model is portable.

## 0. Setup

```sh
git clone https://github.com/openmoca/moca-spec
cd moca-spec
npm install
```

Create some ordinary source content, in a working directory outside the repo:

```sh
mkdir -p /tmp/wt/src
cat > /tmp/wt/src/refunds.md <<'EOF'
# Refund window
Customers may request a full refund within 30 days of delivery.
EOF
cat > /tmp/wt/src/shipping.md <<'EOF'
# Shipping estimates
Standard delivery is 3-5 working days.
EOF
```

## 1. Convert to a package

```sh
npx @openmoca/moca-convert /tmp/wt/src -o /tmp/wt/pkg \
  --id urn:moca:example:walkthrough --title "Walkthrough"
```

```text
Wrote /tmp/wt/pkg (2 content node(s), 0 warning(s))
```

You now have:

```text
/tmp/wt/pkg
├── moca.json
└── content/
    ├── refunds.md
    └── shipping.md
```

That is a complete, conformant Level 1 package. The converter fabricates
nothing — no ontologies, no claims, no signatures. It also lints its own
output before reporting success, so this already validates.

## 2. Lint it

```sh
npx @openmoca/moca-lint lint /tmp/wt/pkg
```

```text
No findings.
```

## 3. Sign it

Signing gives the package a reproducible identity (`canonicalDigest`) and
proves authorship. Required if you ship `skills/`; useful regardless.

```sh
# Generate a keypair — OUTSIDE the package directory
npx @openmoca/moca-sign generate-key -o /tmp/wt/wt-key --keyid walkthrough-key

npx @openmoca/moca-sign sign /tmp/wt/pkg \
  --mode dsse --key /tmp/wt/wt-key.pem --keyid walkthrough-key
```

`generate-key` writes three files and tells you what to do with them:

```text
Wrote /tmp/wt/wt-key.pem (private, keep secret)
      /tmp/wt/wt-key.pub.pem
      /tmp/wt/wt-key.trust-root.json (keyid "walkthrough-key")

Sign with:   moca-sign sign <package> --mode dsse --key /tmp/wt/wt-key.pem --keyid walkthrough-key
Then verify: moca-lint lint <package> --trust-root /tmp/wt/wt-key.trust-root.json
```

```text
Signed.
  canonicalDigest: sha256:5ebac484bae2cf8ec151c3e9f5e8835052b62d274c572824a8d0d9a96c38e659
  signature.type:  dsse
```

> **The key must live outside the package.** `canonicalDigest` covers every
> file under the package root, so a private key saved next to `moca.json`
> becomes signed package content and ships with it.

### Verifying needs a trust root

Lint the package again with no trust root and it **fails**:

```sh
npx @openmoca/moca-lint lint /tmp/wt/pkg
```

```text
ERROR E406_SIGNATURE_INVALID  dsse-mode signature but no trust root supplied (--trust-root)

1 error(s), 0 warning(s), 0 info
```

This is correct, deliberate, fail-closed behaviour: a `dsse` signature that
cannot be checked against a trust root is **not** treated as absent, and is
never silently passed. Supply the trust root `generate-key` emitted:

```sh
npx @openmoca/moca-lint lint /tmp/wt/pkg --trust-root /tmp/wt/wt-key.trust-root.json
```

```text
No findings.
```

In production the trust root is host configuration listing the signers *you*
accept — not a file that ships with the package. The generated one exists so
you can verify your own work immediately.

## 4. Build a search sidecar

```sh
npx @openmoca/moca-index build /tmp/wt/pkg -o /tmp/wt/pkg.moca.idx
```

```text
Wrote /tmp/wt/pkg.moca.idx (2 item(s))
```

Because the package now declares `canonicalDigest`, the sidecar binds to it
automatically. Before signing you would have needed `--allow-unbound`, and the
result could not have proved it was synchronised with its target.

The payload:

```json
{"content_path":"refunds.md","chunk_index":0,"chunk_count":1,"text":"# Refund window\nCustomers may request a full refund within 30 days of delivery."}
{"content_path":"shipping.md","chunk_index":0,"chunk_count":1,"text":"# Shipping estimates\nStandard delivery is 3-5 working days."}
```

Note `content_path` — every indexed item resolves back to a real file inside
the target's `content/`. That is what lets a retrieval hit become a citation.

## 5. Pack for distribution

```sh
npx @openmoca/moca-lint pack /tmp/wt/pkg -o /tmp/wt/walkthrough.moca \
  --trust-root /tmp/wt/wt-key.trust-root.json
```

```text
No findings.
Wrote /tmp/wt/walkthrough.moca
```

`pack` is fail-closed: it refuses to write if any error-severity finding is
present. You cannot accidentally ship an invalid package.

## 6. Read it back

```sh
npx @openmoca/moca-lint extract /tmp/wt/walkthrough.moca -o /tmp/wt/roundtrip
npx @openmoca/moca-lint lint /tmp/wt/roundtrip --trust-root /tmp/wt/wt-key.trust-root.json
```

The extracted copy has the same `canonicalDigest` as the original, because the
digest is computed from content rather than archive bytes — re-zipping does
not change package identity.

## 7. Answer a question with it

What a harness does, in the order described in
[consuming a package](guides/consuming.md):

1. **Load and validate** — parse `moca.json`, reject excluded properties,
   check paths stay inside the package.
2. **Verify** — recompute `canonicalDigest`, check the signature against your
   trust root. If it fails and there were `skills/`, drop the skills but keep
   the content.
3. **Retrieve** — query the sidecar for "how long do I have to return
   something?", get a hit on `content_path: refunds.md`, `chunk_index: 0`.
4. **Resolve** — read `content/refunds.md` from the package. This step is why
   the index binds by digest: you know the text you retrieved and the text you
   are about to quote are the same version.
5. **Ground the answer** — pass the node's content to the model *with* its
   metadata, and carry that metadata into the response:

   > Customers may request a full refund within 30 days of delivery.
   >
   > — Refund window (`urn:node:refund-window`), from
   > `urn:moca:example:walkthrough@1.0.0`, digest `sha256:5ebac484…`

   In a package with grounding metadata, this is also where
   `epistemicStatus` and `lastReviewed` enter the answer — see
   [examples/use-cases/support-kb](../examples/use-cases/support-kb), where
   one node is `verified`, one is `sourced` and five months older, and one is
   `disputed`.

## 8. Prove the index is optional

The claim that a sidecar is disposable, tested:

```sh
rm -rf /tmp/wt/pkg.moca.idx
npx @openmoca/moca-lint lint /tmp/wt/pkg --trust-root /tmp/wt/wt-key.trust-root.json
```

```text
No findings.
```

The package is still complete, still valid, still readable. Retrieval falls
back to lexical search or plain enumeration over `content/`. Rebuild the
sidecar whenever you like — with a different chunking strategy or a different
embedding model — without touching the package.

That is the whole design in one command: **the package is the asset, the index
is a cache.**

## What to read next

| If you want to… | Go to |
|---|---|
| Add grounding metadata | [Authoring](guides/authoring.md) |
| Build the harness side properly | [Consuming a package](guides/consuming.md) |
| Decide how far up the levels to go | [Choosing a level](guides/choosing-a-level.md) |
| Understand signing in depth | [Signing and trust](guides/signing-and-trust.md) |
