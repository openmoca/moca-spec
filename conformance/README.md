# Conformance corpus

A language-neutral test suite for anything that reads MOCA packages. An
implementation conforms to the [Reader contract](../spec/moca-reader-contract.md)
when it reaches the same conclusions as these cases: package, `search` and
`structure` cases all apply to every Reader.

## Layout

```text
conformance/
├── cases.json          76 cases: target, options, expected conclusions
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
| `options.limits` | Reader limits to use instead of the defaults, for example `{ "maxTriples": 3 }` ([contract §3](../spec/moca-reader-contract.md#3-opening-a-package)). |
| `expect.valid` | Whether the package is valid (no `T`/`P`/`M`/`C` error). |
| `expect.codes` | The **set** of diagnostic codes, from the package and the sidecar. Exactly these; extra codes fail. |
| `expect.capabilities` | The exact set of derived capabilities. |
| `expect.digest` | The package digest, or `SAME:<case id>` for "equal to that case's digest". |
| `expect.sidecarUsable` | Whether the sidecar may be used. |
| `expect.evidenceMatched` | For each node path, the `matched` value of each `evidence` entry of its default-language citation record, in order; `null` means absent. |

Order, counts and message text are not compared.

## A search case

```json
{
  "id": "search-default-policy",
  "kind": "search",
  "packages": ["fixtures/search-policy/v1", "fixtures/search-policy/v2"],
  "options": { "now": "2026-09-27T00:00:00Z", "backend": "lexical" },
  "search": { "query": "retention period" },
  "expect": {
    "include": ["https://example.com/conformance/search-policy@2.0.0#current.md"],
    "exclude": ["https://example.com/conformance/search-policy@1.0.0#current.md"]
  }
}
```

Every valid package in `packages` is loaded into one library, then one search
runs. Results are named `<package id>@<version>#<node path>`.

| Field | Meaning |
| --- | --- |
| `options.now` | The host clock. |
| `options.hooks` | `ontology-guided`: the Reader's default ontology-guided hooks. `hostile`: an egress hook that returns every node of every loaded package plus a record whose digest is not loaded; the gate must remove all that policy and audience exclude. |
| `options.allow` | With `backend: store`: the packages whose digests are in the host's allowlist. |
| `options.backend` | `store`: every listed package is ingested into a store that keeps whole citation records; the search resolves hits from those records, with only `options.allow` loaded. `lexical`: the Reader's own lexical search. `all`: a test backend that ignores every filter, declares no features, and returns one hit with score 1 for every representation of every loaded package, plus one hit from the digest `sha256:000…0`, which is not loaded. `dense`: dense search over `options.sidecar` with the conformance embedder. |
| `options.audiences` | The host's audience set. |
| `options.sidecar` | A sidecar to bind to every package that it matches. |
| `options.embedder` | The conformance embedder's identity: `name`, optional `version`, `dimensions`. It returns `[1, 0, …, 0]` of that length for every text. |
| `search` | `query`, and optionally `limit` (default 50), `includeAll`, `locale`, `concepts`. |
| `expect.codes` | The set of diagnostic codes from sidecars and the backend. |
| `expect.include` | Results that must be returned. |
| `expect.exclude` | Results that must never be returned. |
| `expect.count` | The exact number of results, when given. |
| `expect.locales` | The `node.locale` a result must have. |

Every result must be a valid citation record with a `score`. Ranking is never
compared, so lexical and dense implementations can differ.

## A structure case

```json
{
  "id": "structure-overlay-requires",
  "kind": "structure",
  "packages": ["fixtures/structure-procedure"],
  "options": { "overlays": [{ "id": "acme", "layer": "organisation", "path": "fixtures/overlays/organisation-review.ttl" }] },
  "op": "requires",
  "iri": "https://example.org/handbook/incident#ResolveAndReview",
  "args": { "transitive": true },
  "expect": { "codes": [], "result": [ { "iri": "…#AssessSeverity", "label": "Assess severity", "layer": "package" } ] }
}
```

Every valid package in `packages` is loaded with the overlays, then one
structure operation runs ([contract §10](../spec/moca-reader-contract.md#10-structure)).
`op` is `concept`, `requires`, `requiredBy`, `parts`, `narrower`, `broader`,
`related`, `sequence` or `nodes`; `args` holds `transitive` or `include`.
Concept items are compared as `{ iri, label, layer }`; `nodes` as the list of
`node.ref`; `concept` as the whole object. Structure answers are facts, so
they are compared **exactly**, order included.

## What the corpus covers

- **Digest agreement**: literal digests for every valid package, and equality
  across a directory, a `.zip` archive, and a copy with hidden entries.
- Every content, manifest, attestation, member, profile, skill and sidecar
  diagnostic family.
- Attestation outcomes: valid, no trust root, tampered content, untrusted key,
  key used outside its role, malformed envelope.
- Evidence checks against in-package sources, and `self-contained-evidence`.
- Structure: a valid procedure, each `O` diagnostic, every structure
  operation, overlays and their layers.
- Resource limits, and packages written for an earlier digest.
- Search: the default retrieval policy, the host's opt-in, audience
  sets, the re-check of every hit whatever the backend returns, locale,
  concepts, and the dense model check.

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

## Running it against another Reader

A Reader in another repository or language provides an **adapter**: a command
that reads one JSON object on standard input and writes one JSON object to
standard output.

- Input: `{ "root": "<absolute path of conformance/>", "case": { … } }`.
- Output for a package case: `{ "valid", "codes", "capabilities", "digest",
  "sidecarUsable", "evidenceVerified" }`, as defined above.
- Output for a search case: `{ "codes", "records" }`, where `records` are the
  citation records the search returned.
- Output for a structure case: `{ "codes", "result" }`, shaped as above.

Run the corpus through it with:

```sh
node scripts/run-conformance.mjs --reader "dotnet run --project tests/Conformance"
```

[`scripts/conformance-adapter.mjs`](../scripts/conformance-adapter.mjs) is the
reference adapter, and `--reader "node scripts/conformance-adapter.mjs"` must
give the same result as the in-process run. Pin a released corpus version
(`corpusVersion`); each release attaches the corpus as an archive. Do not copy
the corpus into another repository.

## Changing the corpus

Expectations are written by hand and reviewed. `conformance:actual` helps you
check a new case; it must never be pasted in unread. Fixtures that are derived
(attestations, member pins, sidecars, the archive, literal digests) are
regenerated with `npm run refresh:derived`. See [CONTRIBUTING.md](../CONTRIBUTING.md).
