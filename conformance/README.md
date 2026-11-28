# Conformance corpus

A language-neutral test suite for anything that reads MOCA packages. An
implementation conforms to the [Reader contract](../spec/moca-reader-contract.md)
when it reaches the same conclusions as these cases: package, `search`,
`structure`, `map-time` and `catalogue` cases all apply to every Reader.

## OpenMOCA Conformant

Software that passes the suite for what it is, for a named specification
version, may say so: "OpenMOCA 0.7 Conformant Reader". You run the suite
yourself; there is no fee and no application. Publish the signed result and
ask for it to be listed on openmoca.org as **Self-tested**. The project's own
software is listed as **Official**, and software whose result the project has
re-run itself as **Verified** ([TRADEMARKS.md](../TRADEMARKS.md)).

## Layout

```text
conformance/
├── cases.json          every case: target, options, expected conclusions
├── fixtures/           the packages, sidecars and .zip archives they read
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
| `options.now` | The host clock. Trust-root keys expire against it ([attestations §6](../spec/moca-attestations.md#6-trust-roots)). Every case with a trust root sets it, so the corpus never depends on the day it is run. |
| `options.requireSignature` | `true`: the host requires a valid package attestation ([attestations §8](../spec/moca-attestations.md#8-what-attestations-do-not-prove)). |
| `requires` | Optional features the case needs, such as `["sigstore"]` or `["encryption"]` (see "Running it against another Reader"). |
| `options.identities` | Identity files, relative to `conformance/`. The host's key provider returns every `AGE-SECRET-KEY-1…` line in them ([encrypted packages §5.1](../spec/moca-encrypted-package.md#51-the-key-provider)). |
| `options.passphrase` | The key provider returns this passphrase. |
| `options.fileKey` | The key provider returns this file key, given as 32 hex digits. With no `identities`, `passphrase` or `fileKey`, the Reader has no key provider. |
| `options.envelopeSidecar` | `true`: after reading the target envelope, bind its `index.age` through the same key provider ([encrypted packages §6](../spec/moca-encrypted-package.md#6-derived-data)). Its codes join `expect.codes`, and `expect.sidecarUsable` applies to it. |
| `options.strict` | `true`: strict mode, which promotes warnings to errors ([contract §11](../spec/moca-reader-contract.md#11-diagnostics)). |
| `expect.valid` | Whether the package is valid (no `T`/`P`/`M`/`C`/`E` error). |
| `expect.codes` | The **set** of diagnostic codes, from the package and the sidecar. Exactly these; extra codes fail. |
| `expect.capabilities` | The exact set of derived capabilities. |
| `expect.digest` | The package digest, or `SAME:<case id>` for "equal to that case's digest". |
| `expect.distribution` | The result's `distribution` ([package spec §4.1](../spec/moca-package-spec.md#41-properties)): `open`, `encrypted-only`, `service-only`, or `null` when the result has none. |
| `expect.images`, `expect.translations`, `expect.tags`, `expect.apps`, `expect.readingOrder`, `expect.datePublished`, `expect.datePackaged`, `expect.publisher`, `expect.url`, `expect.contributors`, `expect.issuedCopy` | The result's `images`, `translations`, `tags`, `apps`, `readingOrder`, `datePublished`, `publisher`, `url`, `contributors` ([package spec §4.6–4.13](../spec/moca-package-spec.md#46-images)) and `issuedCopy` (`{ originalDigest, issuers, changedFiles }`, [attestations §7.1](../spec/moca-attestations.md#71-issued-copies-two-passes)), compared as JSON values (object members in any order, arrays in order); `null` when the result has none. |
| `expect.sidecarUsable` | Whether the sidecar may be used. |
| `expect.envelope` | For an envelope: the fields of the result's `envelope` that are given (`format`, `opened`), compared exactly ([encrypted packages](../spec/moca-encrypted-package.md)). |
| `expect.evidenceMatched` | For each node path, the `matched` value of each `evidence` entry of its default-language citation record, in order; `null` means absent. |
| `expect.evidenceLocated` | For each node path, the `located` value (`{ start, end }`) of each `evidence` entry, in order; `null` means absent ([contract §7](../spec/moca-reader-contract.md#7-citation-records)). |
| `expect.terms` | The result's `terms` ([contract §15.1](../spec/moca-reader-contract.md#151-exposing-terms)): `authority` compared exactly, `problems` as a set of `code` and `path`, and `declared` as a JSON value (`null`: absent), each only when given. `expect.terms: null` means the result has none. |

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
| `options.hooks` | `ontology-guided`: the Reader's default ontology-guided hooks. `hostile`: an egress hook that returns every node of every loaded package plus a record whose digest is not loaded; the gate must remove all that policy and audience exclude. `hostile-ingress`: an ingress hook that asks for the opt-in to excluded content, a limit of 1000, the locale `fr` and no `upTo`, as far as the language's hook type lets it; the gate must still follow the caller. |
| `options.structure` | With `backend: store`: packages read (with `options.members`) into a small library that is the search's structure source ([contract §9.4](../spec/moca-reader-contract.md#94-store-backends)): the hooks see its structure; it adds no records. |
| `options.allow` | With `backend: store`: the packages the host has loaded. The search gets their package states ([contract §9.4](../spec/moca-reader-contract.md#94-store-backends)). |
| `options.withhold` | With `backend: store`: packages in `options.allow` whose states the host cannot give when the search asks ([contract §9.4](../spec/moca-reader-contract.md#94-store-backends)): they stay loaded, and their states are never supplied. |
| `options.ingestSeparately` | With `backend: store`: each package is ingested on its own, so its stored records know nothing of the other packages. |
| `options.backend` | `store`: every listed package is ingested into a store that keeps whole citation records; the search resolves hits from those records, with only `options.allow` loaded. `lexical`: the Reader's own lexical search. `all`: a test backend that ignores every filter, declares no features, and returns one hit with score 1 for every representation of every loaded package, plus one hit from the digest `sha256:000…0`, which is not loaded. `dense`: dense search over `options.sidecar` with the conformance embedder. `hybrid`: the Reader's hybrid backend over its lexical backend and that dense backend. |
| `options.hybrid` | With `backend: hybrid`: `k` and `weights` (`lexical`, `dense`) for the fusion; absent values take the defaults (60, 1, 1). |
| `options.audiences` | The host's audience set. |
| `options.allowUnlabelled` | `true`: unlabelled content is searched alongside the audience set ([contract §8](../spec/moca-reader-contract.md#8-default-retrieval-policy)). Absent means false. |
| `options.allowUnsignedRelations` | `true`: the library applies relations from unsigned or unscoped packages ([package spec §7.2](../spec/moca-package-spec.md#72-relations)). Absent means false. |
| `options.sidecar` | A sidecar offered to every loaded package. A package it does not match reports the binding code (for example `S002`) and is searched without it. |
| `options.embedder` | The conformance embedder's identity: `name`, optional `version`, `dimensions`, and optional `queryPrefix` and `documentPrefix` it declares. It returns `[1, 0, …, 0]` of that length for every text, whatever the role. |
| `options.termsLimits` | The host's terms limits, an `ai` object ([contract §15.3](../spec/moca-reader-contract.md#153-resolving-terms)): floors that only tighten. They apply to the search and, with `options.ingestTerms`, to the ingest. |
| `options.ingestTerms` | With `backend: store`: the host's terms request for the ingest, `{ destination, conditions }`, with the use `embed` ([contract §9.4](../spec/moca-reader-contract.md#94-store-backends)). Units it removes are never stored; the ingest's codes (`U004`) join `expect.codes`. Absent means an ingest with no request. |
| `search` | `query`, and optionally `limit` (default 50), `includeAll`, `locale`, `concepts`, `scope` (a concept IRI the search is limited to), `upTo` (a concept on a reading order, contract §9), `terms` (the host's terms request, [contract §15.4](../spec/moca-reader-contract.md#154-the-terms-gate)). |
| `expect.codes` | The set of diagnostic codes from sidecars, the backend, the library (`L` codes) and the search itself (`Search.diagnostics`, such as `S008`). |
| `expect.include` | Results that must be returned. |
| `expect.exclude` | Results that must never be returned. |
| `expect.count` | The exact number of results, when given. |
| `expect.reviewStatus` | For each listed result, its `trust.reviewStatus` ([contract §7](../spec/moca-reader-contract.md#7-citation-records)). |
| `expect.issuedChange` | For each listed result, whether `node.issuedChange` is `true` ([contract §7](../spec/moca-reader-contract.md#7-citation-records)). |
| `expect.fileChanged` | For each listed result, whether one of its `trust.attestedReviews` has `fileChanged: true`. |
| `expect.issuedCopy` | Every result's `package.issuedCopy` (`{ originalDigest, issuers }`), or `null` for none. |
| `expect.contested` | For each listed result, whether `trust.contested` is true ([package spec §7.2](../spec/moca-package-spec.md#72-relations)). |
| `expect.locales` | The `node.locale` a result must have. |
| `expect.fields` | For each listed result, fields named by a dotted path (`node.media`, `package.datePublished`), compared as JSON values; `null` means absent ([package spec §4.12, §5.7](../spec/moca-package-spec.md#57-media)). |
| `expect.termsExcluded` | The counts of the search's `U004` ([contract §15.4](../spec/moca-reader-contract.md#154-the-terms-gate)): `excluded` (removed records by reason) and `hidden` (how many came from packages hidden for the request), each compared exactly when given. `null` means the search has no `U004`. |

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
With `options.terms`, a terms request (and optionally `options.termsLimits`),
the operation runs over the structure for that request: the packages not
closed for it, and the overlays (contract §10, "Under a terms request";
`Library.structureFor` in [Reader interface §6](../spec/moca-reader-interface.md#6-structure)).
`options.now`, `options.trustRoot` and `options.members` are as for a package
case.
`op` is `concept`, `requires`, `requiredBy`, `parts`, `narrower`, `broader`,
`related`, `sequence` or `nodes`; `args` holds `transitive` or `include`.
Concept items are compared as `{ iri, label, layer }`; `nodes` as the list of
`node.ref`; `concept` as the whole object. Structure answers are facts, so
they are compared **exactly**, order included.

## A catalogue case

```json
{
  "id": "catalogue-terms-closed-named",
  "kind": "catalogue",
  "packages": ["fixtures/terms/mention/open", "fixtures/terms/mention/closed-named"],
  "options": { "now": "2026-11-21T00:00:00Z", "trustRoot": "fixtures/trust-root.json" },
  "terms": { "ai": { "destination": "provider", "use": "answer" } },
  "expect": { "codes": [], "result": [ { "id": "…closed-named", "version": "1.0.0", "title": "A show closed to providers", "publisher": "Example Network", "signed": true, "closedBy": ["ai.allowed.provider"] }, { "id": "…open", "…": "…" } ] }
}
```

Every valid package in `packages` is loaded into one library, then the
library's catalogue is asked for `terms` (absent: no terms request)
([Reader interface §4](../spec/moca-reader-interface.md#4-reading),
[contract §15.4](../spec/moca-reader-contract.md#154-the-terms-gate), "The
catalogue rule"). `options` takes `now`, `trustRoot`, `members`,
`audiences`, `allowUnlabelled`, `includeAll` and `termsLimits`, as for a
search case. `codes` are the library's own findings. `result` is the list of
entries, compared **exactly**, in order (members of an entry object in any
order); each entry must be valid against
[`catalogue-entry.schema.json`](../schemas/v1/catalogue-entry.schema.json).

## A map-time case

```json
{
  "id": "map-time-alternates",
  "kind": "map-time",
  "target": "fixtures/media-alternates",
  "node": "episode.md",
  "calls": [{ "from": "audio", "to": "video", "t": 39.5 }, { "from": "audio", "to": "video", "t": 45 }],
  "expect": { "codes": ["C011_EVIDENCE_SELECTOR_UNMATCHED"], "result": [49.5, null] }
}
```

The target is read, and its citation record for the node at `node` in the
default language is passed to `mapTime` once for each call
([Reader interface §4](../spec/moca-reader-interface.md#4-reading),
[package spec §5.7](../spec/moca-package-spec.md#57-media)). `codes` are the
package's diagnostics. `result` lists the answers in order, `null` for
nothing, and is compared **exactly**.

## What the corpus covers

- **Digest agreement**: literal digests for every valid package, and equality
  across a directory, a `.zip` archive, and a copy with hidden entries.
- Every content, manifest, attestation, member, profile and sidecar
  diagnostic family.
- Attestation outcomes: valid, no trust root, tampered content, untrusted key,
  key used outside its role, a trusted key that is not Ed25519, malformed
  envelope.
- Evidence checks against in-package sources, and `self-contained-evidence`.
- Structure: a valid procedure, each `O` diagnostic, every structure
  operation, overlays and their layers.
- Resource limits, and packages written for an earlier digest.
- Encrypted packages: X25519 and passphrase envelopes, with and without an
  outline and the structure copy; each `E` code; the limits inside an
  envelope.
- Search: the default retrieval policy, the host's opt-in, audience
  sets, the re-check of every hit whatever the backend returns, locale,
  concepts, and the dense model check.
- Creators' terms: the block as written and its problems, resolution at every
  level, the terms gate on search, ingest and structure, `mention`, and the
  catalogue rule.
- Podcast and video series content: media descriptions and time ranges bounded
  by a transcript or a duration; `datePublished`; binding by composition and
  `upTo` across members, in a library and in a store; `isPartOf` and unknown
  relation types; issued copies matching member pins and a publisher's
  sidecar; alternate media, its evidence checks and `mapTime`.

Some rules cannot be expressed as portable directory fixtures, because Git and
some file systems cannot store them: unreadable folders, and symbolic links in
a directory. Archive rules are tested through `.zip` fixtures instead: names
that differ only in Unicode normalisation or case (`archive-collision-*`), a
symbolic-link entry, names that are not UTF-8 or that hold NUL, empty or `.`
segments, a duplicate entry, and an unsupported compression method. The reference Reader tests
them in its [own test suite](https://github.com/openmoca/moca-reader-typescript/blob/main/test/reader.test.js); other
implementations should build equivalent tests.

### Requirements and cases

Each row names a group of requirements and the cases that test it. A `*` at
the end of a case name stands for every case that starts that way.
`scripts/check-traceability.mjs` (part of `npm run validate`) checks that
every case named here exists, and that every diagnostic code in
[Reader contract §11](../spec/moca-reader-contract.md#11-diagnostics) is
expected by at least one case or is listed below as untestable.

| Requirement | Where | Cases |
| --- | --- | --- |
| Targets: not found, no manifest, archives | Contract §3 | `target-*`, `valid-archive`, `archive-*`, `limit-archive-*` |
| Entry names, collisions, unsafe paths | Contract §3, package spec §6.3 | `path-collision-*`, `unsafe-path*`, `valid-noncharacter-path`, `valid-dotted-i`, `valid-hidden-entries` |
| Resource limits | Contract §3 | `limit-*`, `structure-deep-chain`, `structure-shared-list*`, `attestation-signatures-*` |
| Nesting of JSON and frontmatter | Contract §3 | `manifest-nesting-*`, `frontmatter-nesting-*`, `attestation-nesting-over-limit` |
| Archive records: the end record, Zip64, local headers, short entries | Contract §3 | `archive-two-end-records`, `archive-zip64`, `archive-local-name-mismatch`, `archive-entry-short` |
| The digest | Package spec §6.4 | every valid package case (`expect.digest`), `digest-v1-package`, `attestations-as-file` |
| Manifest | Package spec §4 | `manifest-*`, `distribution-*`, `unknown-key`, `unregistered-urn`, `profile-unrecognised`, `no-content`, `field-invalid` |
| Images, translations, tags and apps | Package spec §4.6–4.9 | `catalogue-valid`, `image-*`, `translation-*`, `tags-*`, `apps-*` |
| Reading order and `upTo` | Package spec §4.10, contract §9 | `reading-order-*`, `search-upto-*` |
| Filters come before the limit | Contract §9.2 | `search-upto-below-top-200`, `search-concepts-below-top-200`, `search-scope-below-top-200`, `search-filtered-limit-full` |
| Alternative labels, ingress narrowing, a store's structure source | Package spec §5.6, contract §9.2, §9.4, Reader interface §5.4 | `structure-alt-labels`, `search-ontology-guided-alt-label`, `search-ingress-narrows-composition`, `search-ingress-narrows-without-pushdown`, `search-store-structure-source` |
| Issued copies: consent, the two passes, records and libraries | Package spec §4.11, attestations §3a and §7.1, contract §7 | `issued-*`, `search-issued-copy-*` |
| Versioning | Package spec §14 | `moca-version-*`, `digest-v1-package` |
| Content and frontmatter | Package spec §5 | `frontmatter-*`, `type-missing`, `reserved-file-invalid`, `log-heading-in-fence`, `log-heading-cr`, `log-heading-line-separator`, `link-unresolved`, `resource-bad-escape`, `valid-minimal` |
| Locales | Package spec §5.4 | `locale-orphan`, `valid-locales`, `search-locale*` |
| Validity windows and dates | Package spec §4.4 | `validity-*`, `node-validity-window`, `search-validity-*` |
| Evidence | Package spec §5.5, contract §5 | `evidence-*`, `valid-evidence`, `self-contained-evidence`, `limit-evidence-*` |
| Structure and its operations | Package spec §5.6, contract §10 | `structure-*` |
| Members | Package spec §7.1 | `composed-*`, `member-*`, `duplicate-member` |
| Relations | Package spec §7.2 | `relation-*`, `search-relation-*` |
| Attestations and trust roots | Attestations §5–§7 | `attestation-*`, `signature-*`, `signed-*`, `key-*`, `trust-root-empty-roles`, `require-signature-*` |
| A signer's `ids` cover the package | Attestations §6, ADR-0040 | `signer-binding-*`, `require-signature-signer-not-covered`, `sigstore-signer-not-covered` |
| Sigstore, offline against the host's trusted root (optional feature) | Attestations §6–§7 | `sigstore-*` |
| Sigstore identities are compared exactly | Attestations §6 | `sigstore-identity-not-listed`, `sigstore-subject-shorter`, `sigstore-subject-other-character`, `sigstore-issuer-shorter` |
| Terms and ratings fail closed | Package spec §4.14, contract §15.3–15.4 | `terms-container-malformed`, `search-terms-*-fails-closed`, `search-terms-rating-unlisted-scheme*`, `search-terms-rating-listed-scheme`, `search-terms-rating-request-unknown-member` |
| `ai.allowed.mention`, closed and hidden packages | Package spec §4.14, contract §15.3–15.4, ADR-0041 | `terms-mention-*`, `search-terms-mention-*`, `search-terms-hidden-count`, `search-terms-superseded-by-*` |
| What the terms gate covers: ingest, structure and the catalogue | Contract §9.4, §10, §15.4, Reader interface §4–§6, ADR-0041 | `search-store-ingest-*`, `structure-terms-*`, `catalogue-terms-*` |
| Reviews and `reviewed` | Package spec §11, attestations §4 | `review-*`, `search-review-*`, `signed-reviewed` |
| Strict mode | Contract §11 | `strict-*` |
| Encrypted packages: recognition, the layout and marker, keys, decryption, the outline check, limits | Encrypted packages §2–§5, contract §3 | `envelope-*` |
| Library identity | Contract §7 | `search-identity-conflict` |
| Default retrieval policy | Contract §8 | `search-default-policy`, `search-include-all`, `search-recheck`, `search-gate-representations` |
| Audience | Contract §8 | `audience-rules`, `search-audience*` |
| A state a store search cannot get; `S011_STATE_MISSING` | Contract §9.4 | `search-store-state-missing-*` |
| The search pipeline, hooks and backends | Contract §9 | `search-concepts`, `search-scope`, `search-upto-*`, `search-ontology-guided`, `search-hostile-*`, `search-store-*`, `search-hybrid*` |
| Dense search and the model check | Contract §9.3, sidecar spec | `search-dense*` |
| Sidecars | Sidecar spec | `sidecar-*`, `search-sidecar-no-text` |
| Media descriptions and alternates | Package spec §5.7, contract §7, interface §4 | `media-*`, `search-media-*`, `map-time-*` |

**Not testable by the corpus.** These rules need a live service, a file system
feature or a model, so each implementation tests them itself:

| Rule | Where | Why, and where it is tested |
| --- | --- | --- |
| No execution, no network, no reads outside the package | Contract §4 | A fixture cannot show an absence. The reference Readers test that offline verification opens no socket. |
| Online Sigstore verification; `A004_ATTESTATION_INDETERMINATE` | Attestations §7 | Needs the network. Offline verification is tested (`sigstore-*`). |
| Symbolic links and unreadable entries in a directory | Contract §3 | Git cannot store them portably; each Reader's own tests. |
| Handing content to a model, and rendering it | Contract §12 | Needs a model or a client; the bindings' own tests (for example the .NET envelope test). |
| What a binding a model calls never says about a hidden package: the not-found answer, counts and notes, paging, findings | Contract §15.4, Reader interface §7 | The hand-off is the binding's, not the Reader's; each model-facing server tests that a hidden package's id and title reach no tool answer, resource, note or error. The corpus tests what the Reader gives it: `U004`'s `hidden` count, relation ids, the catalogue and the structure. |
| A Reader never writes decrypted bytes to a file | Encrypted packages §5.4 | A fixture cannot show an absence. Each Reader reads an envelope with a temporary directory it cannot write to, in its own tests. |
| A host's bound on a search; `S010_SEARCH_TRUNCATED` | Contract §9.2 | Whether a bound stops a search depends on how a Reader's backends check candidates, which conformance leaves open. Each reference Reader's own tests set `maxCandidates` with a backend that applies no filter. |
| Ranking | Contract §9.6 | Informative ([ADR-0018](../docs/adr/0018-ranking-is-informative.md)); the reference Readers' parity tests. |

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
  "distribution", "images", "translations", "tags", "apps", "readingOrder",
  "datePublished", "publisher", "url", "contributors", "issuedCopy", "sidecarUsable", "evidenceMatched", "evidenceLocated",
  "envelope" }`, as defined above.
  `envelope` is the package result's `envelope` field for an envelope, and
  absent otherwise.
- Output for a search case: `{ "codes", "records", "termsExcluded" }`, where
  `records` are the citation records the search returned and
  `termsExcluded` is `{ excluded, hidden }` from the search's `U004`, or
  `null` when it has none.
- Output for a structure case: `{ "codes", "result" }`, shaped as above.
- Output for a map-time case: `{ "codes", "result" }`: the package's codes and
  the answer to each call, `null` for nothing.
- Output for a catalogue case: `{ "codes", "result" }`: the library's codes
  and the catalogue entries.

Run the corpus through it from a clone of this repository at a release tag,
so you test against a fixed corpus. You need Node.js 22 or later:

```sh
git clone --branch v0.7.0 https://github.com/openmoca/moca-spec.git
cd moca-spec && npm ci
node scripts/run-conformance.mjs --reader "dotnet run --project ../my-reader/tests/Conformance"
```

A case with `requires` needs an optional feature
([Reader contract §14](../spec/moca-reader-contract.md#14-demonstrating-conformance)).
A Reader that names a feature as not implemented skips those cases with
`--without <feature>`, for example `--without sigstore`. The features in the
corpus are `sigstore` and `encryption`. A Reader run `--without encryption`
still runs the cases that only recognise an envelope: they expect `E001`
without opening it.

The runner prints each case that fails and why, and exits non-zero if any do.
[moca-reader-dotnet](https://github.com/openmoca/moca-reader-dotnet) runs it
this way in CI.

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

**Sigstore fixtures** (`fixtures/sigstore/`) are made against a self-made test
Sigstore: a certificate authority, a certificate-transparency log and a
transparency log whose INSECURE keys are derived from published labels.
Nothing is written to a public log, and every Reader verifies them offline
with the trusted root inside each fixture trust root. They are checked with
both sigstore-js and sigstore-python. Regenerate them with
`uv run --with cryptography==50.0.2 python scripts/sigstore-fixtures.py`; the
signatures are deterministic, so an unchanged run gives the same bytes.

**Envelope fixtures** (`fixtures/envelopes/`) are encrypted packages made
once with the reference age tool (age 1.3, with `age-plugin-batchpass` for
passphrases), by `python3 scripts/envelope-fixtures.py`. The `index.age`
fixtures were added later with `--only index`, which leaves the other
envelopes untouched. The failure fixtures
are byte or text edits of its output, and the script checks every fixture with
`age --decrypt`. age encryption is randomised, so the bytes are committed and
never regenerated by `refresh:derived`; a new run gives new bytes. The keys in
`fixtures/envelopes/keys/` and the passphrases in the script are INSECURE test
values. Each Reader also runs the C2SP age test kit in its own CI.
