# MOCA conformance suite

A language-neutral corpus that every MOCA SDK is tested against, so a
TypeScript, Python, and .NET implementation agree on what a package means.

The behavioural contract these cases pin down is
[spec/moca-sdk-contract.md](../spec/moca-sdk-contract.md).

```text
conformance/
├── README.md      # this file — the runner contract
├── cases/*.json   # one declarative case per fixture
└── fixtures/      # the packages the cases point at
```

## Why this exists

Three SDKs written against a 900-line prose specification, with no shared test
corpus, will diverge — and the divergence will not surface until something
built on one of them behaves differently on another. Sharing fixtures and
expected outcomes makes each SDK's test suite a thin adapter over this corpus
rather than an independent reinterpretation of the spec.

## Case format

```json
{
  "name": "signature-tampered",
  "fixture": "fixtures/signature-tampered",
  "description": "Content changed after signing fails verification (contract §7.3).",
  "trustRoot": "conformance/fixtures/signature.trust-root.json",
  "capabilities": ["content", "diagnostics", "integrity", "manifest", "signatures"],
  "expect": {
    "manifestParsed": true,
    "valid": false,
    "codes": ["E406_SIGNATURE_INVALID"],
    "bySeverity": { "error": ["E406_SIGNATURE_INVALID"], "warning": [], "info": [] }
  }
}
```

| Field | Meaning |
|---|---|
| `name` | Stable case identifier |
| `fixture` | Package path, relative to `conformance/` |
| `description` | What behaviour this case pins, and which contract section |
| `trustRoot` | Repo-relative trust root to pass when verifying, or `null` |
| `capabilities` | Contract capabilities exercised — see below |
| `expect.manifestParsed` | Whether the manifest parsed at all |
| `expect.valid` | Whether zero **error**-severity findings were produced |
| `expect.codes` | All finding codes, sorted |
| `expect.bySeverity` | The same codes partitioned by severity |

## What a case asserts — and what it deliberately does not

Cases assert **diagnostic codes and outcomes**. They never assert message
prose, finding order, line numbers, or object shape.

This is deliberate, and matches contract §6: codes are the stable contract,
message wording is not. An SDK that reports
`E406_SIGNATURE_INVALID` with entirely different wording, in a different
order, through a different object model, is conformant.

## Running the suite

An SDK's runner:

1. Read every `cases/*.json`.
2. Skip any case whose `capabilities` include one the SDK does not implement,
   and report it as skipped rather than passed.
3. Load `fixture` and validate it, passing `trustRoot` if non-null.
4. Compare the sorted set of produced diagnostic codes to `expect.codes`, and
   the error/warning/info partition to `expect.bySeverity`.
5. Compare the derived validity to `expect.valid`.

A case passes when the code sets match exactly. Extra codes are a failure —
an SDK reporting findings the reference does not is as much a divergence as
one missing them.

### Declaring partial support

`capabilities` values are: `manifest`, `content`, `diagnostics`, `integrity`,
`signatures`, `composition`, `profiles`, `semantic`.

An SDK that does not implement signature verification skips the `signatures`
cases and says so. Claiming conformance requires publishing which optional
capabilities are unimplemented (contract §14) — silently skipping is not
conformance.

## Regenerating

Expectations are **observed from the reference implementation**, not
hand-written, so they cannot drift from it:

```sh
npm run conformance:generate    # rewrite cases from current behaviour
npm run conformance:check       # verify cases still match (runs in CI)
```

`description` is the one hand-written field and is preserved across
regeneration.

If `conformance:check` fails, the reference implementation's behaviour
changed. That is either a bug in the change or a deliberate contract
change — and if deliberate, it belongs in
[MIGRATIONS.md](../MIGRATIONS.md), because it is a breaking change for every
SDK.

## Fixtures

Invalid-by-design fixtures come from `moca-lint`'s test corpus; the
`valid-*` fixtures are copies of the example packages. They are **copied
rather than referenced** so the suite does not depend on a tool's private test
layout or on `examples/` staying arranged as it is today.

The signing fixtures use non-production keys with no trust value.

## Coverage

25 cases spanning: the Level 1 floor with no frontmatter; identity from path;
duplicate node identity; excluded manifest properties; integrity mismatch;
malformed claims and evidence locators; opaque `profileData`; unrecognised
profiles; RO-Crate precedence; all five signature outcomes (valid, missing,
placeholder, tampered, untrusted signer); invalid skill frontmatter;
composition members and relates; a composition-only package with no content;
and Level 2 and Level 3 packages.

Known gaps, to add as SDKs surface them: locale-resolution fallback,
composition cycle detection, archive-extraction hardening, and sidecar
binding. These are specified in the contract (§5.2, §8, §3, §10) but not yet
represented as fixtures.
