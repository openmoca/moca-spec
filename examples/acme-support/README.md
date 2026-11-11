# Acme Support Knowledge Base

**Download** [`acme-support.moca`](https://github.com/openmoca/moca-spec/releases/latest/download/acme-support.moca),
signed with the example key, and
[`example-trust-root.json`](https://github.com/openmoca/moca-spec/releases/latest/download/example-trust-root.json)
to verify it, from the [latest release](https://github.com/openmoca/moca-spec/releases/latest).

What the support team of Acme, a made-up online shop, tells its customers, and
the procedures it follows: 34 pages, every one in English and French. The
[walkthrough](../../docs/walkthrough.md) uses it.

| Topic | Pages |
| --- | --- |
| Orders | Placing, changing or cancelling an order; a missing confirmation |
| Delivery | Options and times, the EU, tracking, a missing parcel, a carrier disruption notice |
| Returns and refunds | The returns policy, the refund window (now, in 2025, and the new portal in 2027), how to return an item, final sale, faulty items, processing times |
| Payments and billing | Payment methods, failed payments, invoices and VAT, gift cards |
| Account and privacy | Creating, updating and closing an account, passwords, your data |
| Products and warranty | The warranty, product care, the size guide and the old size chart |
| Support procedures | Five internal procedures for support staff |

What it shows:

- **Evidence.** Policy pages quote Acme's customer terms, which travel in the
  package in both languages (`sources/customer-terms.txt` and
  `sources/conditions-generales.txt`), so every quote is checked against the
  original (`located-evidence`, `self-contained-evidence`).
- **Two languages.** Every page has a French version (`*.fr.md`), with its
  own frontmatter: audience, validity and evidence are repeated in it, so the
  French pages are filtered exactly as the English ones (`localized`).
- **Audience.** The support procedures are `internal`: a host serving
  customers never returns them, in either language.
- **When a page is in force.** The 2025 refund window has expired, and the 2027
  returns portal has not started yet: search leaves both out unless the host
  asks for everything.
- **Freshness and status.** The gift card page is past its `stale_after`
  date; the carrier notice disputes the delivery times (`contested_by`); the
  old size chart is `deprecated`; one internal procedure is a `draft`.
- **Drafted and checked.** Public pages say they were drafted by a tool
  (`generated`); some say who checked them (`verified`); three have signed
  reviews under `attestations/reviews/` (`reviewed`).
- **Structure.** `structure.ttl` gives each page a concept under its topic,
  what requires what (returning an item requires the refund window), what
  replaces what, and the returns steps in order (`structured`).
- **Signed** by the example publisher key (`signed`).

The attestations are signed with the published, insecure example keys in
`fixtures/signing-keys/`. Check it:

```sh
npx @openmoca/moca-lint lint examples/acme-support --trust-root fixtures/signing-keys/trust-root.json
```

It is written for the examples and the walkthrough: Acme, its terms and its
people are made up.
