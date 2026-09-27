# Conformance corpus

A language-neutral test suite for anything that reads MOCA packages. An
implementation conforms to the [Reader contract](../spec/moca-reader-contract.md)
when it reaches the same conclusions as these cases.

## Layout

```text
conformance/
├── cases.json          43 cases: target, options, expected conclusions
├── fixtures/           the packages, sidecars and one .zip archive they read
└── fixtures/trust-root.json
```

## A case

```json
{
  "id": "signature-tampered",
  "description": "Content changed after signing: ...",
  "target": "fixtures/signature-tampered",
  "options": { "trustRoot": "fixtures/trust-root.json" },
  "expect": {
    "valid": true,
    "codes": ["A002_ATTESTATION_INVALID", "A006_REVIEW_OUTDATED"],
    "capabilities": ["core"]
  }
}
```

| Field | Meaning |
| --- | --- |
| `target` | Package directory or archive, relative to `conformance/`. |
| `options.trustRoot` | Trust root to verify attestations with. Absent means none. |
| `options.members` | Directories a resolver searches for members by `id` and `version`. Absent means no resolver. |
| `options.sidecar` | A sidecar to bind to the package after reading it. |
| `expect.valid` | Whether the package is valid (no `T`/`P`/`M`/`C` error). |
| `expect.codes` | The **set** of diagnostic codes, from the package and the sidecar. Exactly these; extra codes fail. |
| `expect.capabilities` | The exact set of derived capabilities. |
| `expect.digest` | The package digest, or `SAME:<case id>` for "equal to that case's digest". |
| `expect.sidecarUsable` | Whether the sidecar may be used. |

Order, counts and message text are not compared.

## What the corpus covers

- **Digest agreement**: literal digests for every valid package, and equality
  across a directory, a `.zip` archive, and a copy with hidden entries.
- Every content, manifest, attestation, member, profile, skill and sidecar
  diagnostic family.
- Attestation outcomes: valid, no trust root, tampered content, untrusted key,
  key used outside its role, malformed envelope.

Some rules cannot be expressed as portable fixtures, because Git and some file
systems cannot store them: symbolic links, unreadable folders, and file names
that differ only in Unicode normalisation or case. The reference Reader tests
them in [`tools/moca-core/test`](../tools/moca-core/test/reader.test.js); other
implementations should build equivalent tests.

## Running it

```sh
npm run conformance           # the reference Reader against every case
npm run conformance:actual    # print the reference Reader's conclusions
```

Another implementation reads `cases.json`, runs each case with its own Reader,
and compares. Pin a released corpus version (`corpusVersion`); do not copy the
corpus into another repository.

## Changing the corpus

Expectations are written by hand and reviewed. `conformance:actual` helps you
check a new case; it must never be pasted in unread. Fixtures that are derived
(attestations, member pins, sidecars, the archive, literal digests) are
regenerated with `npm run refresh:derived`. See [CONTRIBUTING.md](../CONTRIBUTING.md).
