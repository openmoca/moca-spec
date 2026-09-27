# Support knowledge base

A support team's answers, showing most of what MOCA adds on top of plain OKF:

- **Evidence** — `refund-window.md` quotes the exact sentences of the source
  terms it relies on (`moca.evidence` with `TextQuoteSelector`).
- **Declared and attested review** — OKF `verified` records who says they
  checked a node; `attestations/reviews/` holds a signed review of
  `refund-window.md` that a Reader can verify.
- **Freshness and status** — `stale_after`, `status: draft`.
- **Audience** — `account-deletion.md` is `internal`, so a host serving the
  public can filter it out before retrieval.
- **Locales** — `refund-window.fr.md` is the French representation of the
  same node.
- **Publisher signature** — `attestations/package.*.dsse.json`.

The attestations are signed with the published, insecure example keys in
`fixtures/signing-keys/`. Verify with:

```sh
node tools/moca-sign/bin/moca-sign.js verify examples/support-kb \
  --trust-root fixtures/signing-keys/trust-root.json
```

`examples/sidecars/support-kb.moca.idx/` is a lexical sidecar index bound to
this package's digest.
