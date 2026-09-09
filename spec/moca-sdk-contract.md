# MOCA SDK Contract

Specification version: `0.1.0-beta.1`
Status: Beta — pre-`1.0.0`, experimental
License: [Apache License 2.0](../LICENSE)

---

## 1. Scope

This document defines the language-neutral behavioural contract every MOCA SDK
implements, so that a TypeScript, Python, and .NET SDK agree on what a package
means. It is normative for SDK implementers. It is **not** a second
specification of the package format — where this document and
[the core specification](moca-core-spec.md) appear to disagree, core wins and
this document has a bug.

It deliberately specifies **behaviour, not API shape**. Method names,
casing, error types, synchrony, and object models are each SDK's own business,
and should be idiomatic in its language. What must not vary is what a
conformant SDK *concludes* about a given package.

Conformance is demonstrated by passing the shared corpus in
[`conformance/`](../conformance/README.md), not by resembling any particular
implementation.

### 1.1 Terminology

RFC 2119 keywords (`MUST`, `SHOULD`, `MAY`) carry their standard meanings.

- **SDK** — a library implementing this contract.
- **Host** — the application embedding an SDK.
- **Diagnostic** — a structured finding an SDK reports about a package.

## 2. Capability surface

An SDK MUST provide these eight capabilities. It MAY provide more.

| # | Capability | Summary |
|---|---|---|
| 1 | **Target resolution** | Open a package from a directory or archive |
| 2 | **Manifest access** | Parse, validate, and create a manifest |
| 3 | **Content traversal** | Enumerate content nodes with identity and metadata |
| 4 | **Diagnostics** | Report structured findings with stable codes |
| 5 | **Identity & integrity** | Verify digests; compute `canonicalDigest` |
| 6 | **Composition** | Resolve `members`/`relates` via a host-supplied resolver |
| 7 | **Profile discovery** | Surface declared profiles without interpreting them |
| 8 | **Index discovery** | Detect and bind an optional sidecar |

Signing and verification MAY be a separate package; when offered, §7 applies.

### 2.1 What an SDK MUST NOT do

- **MUST NOT execute anything found in a package.** No evaluation, no dynamic
  import, no subprocess, for any package content including `skills/`.
- **MUST NOT perform network I/O** as part of loading, parsing, or validating
  a package. Composition resolution and online signature verification are the
  only permitted exceptions, and both MUST be explicitly requested by the host.
- **MUST NOT read or write outside the package root** while resolving
  package-relative paths.
- **MUST NOT require a model, vector database, or agent framework.**

## 3. Target resolution

An SDK MUST accept a **directory** containing `moca.json` at its root, and
SHOULD accept a **Zip archive** (`.moca`) containing the same.

When an SDK opens archives it MUST, before extracting any entry, reject:

- entry names that are absolute or contain a `..` segment;
- archives exceeding an implementation-defined entry-count limit;
- archives exceeding an implementation-defined total-uncompressed-size limit.

Limits MUST be documented and SHOULD be configurable. The reference
implementation defaults to 20,000 entries and 512 MiB.

An SDK MUST report a distinct diagnostic for "target does not exist" versus
"target exists but has no `moca.json`".

## 4. Manifest access

### 4.1 Parsing and validation

An SDK MUST validate the manifest against
[`schemas/v1/core/moca.schema.json`](../schemas/v1/core/moca.schema.json), and
MUST additionally enforce two rules the schema cannot fully express:

**Excluded properties.** The presence of `endpoints`, `settings`,
`credentials`, or `apiKeys` at any level, under any profile, MUST produce an
**error**-severity diagnostic. An SDK MUST NOT expose their values through any
API. This is the runtime-independence guarantee
([core §5.3](moca-core-spec.md#53-excluded-properties)) and is not
configurable.

**Path containment.** Every package-relative path — `integrity` keys,
`evidence[].source`, `augmentation.target`, ontology paths — MUST resolve
inside the package root. Absolute paths and parent traversal MUST produce an
error-severity diagnostic and MUST NOT be dereferenced.

### 4.2 Localized values

`title`, `description`, `author`, and `publisher` are either a string or a
BCP-47-keyed object. Given a requested locale, an SDK MUST resolve in this
order ([core §5.2](moca-core-spec.md#52-localized-string-values)):

1. exact locale match;
2. partial match (`pt` for a requested `pt-BR`, or vice versa);
3. the manifest's `language`;
4. any single key present.

### 4.3 Creation

An SDK MUST be able to produce a manifest that validates. A created manifest
MUST NOT contain excluded properties even if the caller supplies them: an SDK
MUST reject such input rather than writing it.

## 5. Content traversal

An SDK MUST enumerate every `.md` file under `content/` and expose each as a
node with a body and, when present, parsed YAML frontmatter.

### 5.1 Node identity

```text
node.id = frontmatter.id  if present
        = path relative to content/, using forward slashes  otherwise
```

An SDK MUST NOT skip, or report as invalid, a node lacking frontmatter
([core §7.1](moca-core-spec.md#71-commonmark-knowledge-nodes-content)).

Two nodes resolving to the same identity MUST produce an error-severity
diagnostic.

### 5.2 Locale resolution

Locale variants are the filename convention
`<base>.<bcp47>.md` ([core §4.2](moca-core-spec.md#42-localization-convention)).
Resolving a node for a locale MUST prefer the matching suffixed file and MUST
fall back to the unsuffixed file when absent. This behaviour is identical
whether or not the node declares a frontmatter `id`.

An SDK MUST NOT expose locale variants as distinct nodes by default; they are
representations of one node.

### 5.3 Metadata

An SDK MUST surface `title`, `summary`, `concepts`, `epistemicStatus`,
`evidence`, `claims`, and lifecycle fields when present, and MUST treat every
one of them as optional.

An `epistemicStatus` outside the core vocabulary
([core §7.2](moca-core-spec.md#72-core-epistemic-status-vocabulary)) MUST be
surfaced as an unrecognised value with at most **warning** severity — never an
error. It is most likely profile vocabulary.

## 6. Diagnostics

An SDK MUST report findings as structured values, not as prose. Each finding
MUST carry:

| Field | Requirement |
|---|---|
| `code` | Stable identifier, e.g. `E202_UNRESOLVED_NAMESPACE_PREFIX` |
| `severity` | `error`, `warning`, or `info` |
| `message` | Human-readable text |
| `file` | Package-relative path, when applicable |
| `line` | 1-based line, when applicable |

**Codes are the contract; message prose is not.** An SDK MUST NOT require
hosts to match on message text, and message wording MAY change between
releases. The canonical code list is
[`tools/moca-lint`](../tools/moca-lint/README.md#validation-passes--finding-codes);
`conformance/` records which codes are expected for each case.

An SDK MUST support a strict mode in which `warning` findings are promoted to
`error`. Severity promotion MUST NOT change a finding's `code`.

An SDK MUST NOT throw for an invalid package where a diagnostic is possible.
Malformed content is a finding, not an exception; exceptions are for
programming errors and unreadable I/O.

## 7. Identity and integrity

### 7.1 `integrity`

An SDK SHOULD verify declared per-file SHA-256 digests against file bytes and
report mismatches. Where RO-Crate or BagIt checksums are also present and
disagree, `moca.json`'s `integrity` is authoritative and the SDK SHOULD warn
rather than silently choosing
([core §5.4](moca-core-spec.md#54-integrity-precedence)).

### 7.2 `canonicalDigest`

An SDK MUST implement `canonicalDigest` computation exactly as core §5.5
defines it, because the value is cross-implementation:

- computed from resource file bytes **on disk**, never from declared
  `integrity` values;
- the manifest participates, with `canonicalDigest` and `signature` removed;
- RFC 8785 (JCS) canonicalization for the manifest and assembled inputs;
- for a composed package, members' **declared** digests fold in transitively,
  keyed `<id>@<resolved version>`, excluding `relates` and member ordering.

An SDK MUST expose recomputation independently of the declared value.
Verification means comparing a recomputed digest to the declared one.

Because member folding depends on how members were resolved, an SDK MUST
document its resolution strategy and MUST NOT present a composed digest as
reproducible across differing strategies.

### 7.3 Signatures

An SDK offering verification MUST:

- treat a `signature` with no `canonicalDigest` as malformed;
- treat a `dsse` signature with no trust root supplied as **unverifiable**,
  never as verified — silently passing it is a conformance failure;
- default to offline verification, with online verification opt-in;
- when online verification is requested but cannot complete, return
  *indeterminate* rather than success, unless the host explicitly permits
  offline fallback.

See [the trust model](moca-trust-model.md).

## 8. Composition

An SDK MUST expose `composition.members` (ordered, versioned containment) and
`composition.relates` (unordered association) separately, and MUST NOT
conflate them.

Resolution is **host-supplied**. An SDK MUST accept a resolver from the host
and MUST NOT implement a network registry itself. With no resolver, an SDK
MUST still expose the unresolved references.

When resolving, an SDK MUST:

- detect cycles across `members` and fail closed with a diagnostic naming the
  cycle;
- report an unresolvable member as a diagnostic, not an exception;
- treat a package with `composition` and no `content/` as valid.

## 9. Profiles

An SDK MUST expose the `profile` array and the `profileData` object, and MUST
treat `profileData` as **opaque**: it MUST NOT validate it against a profile
schema, and MUST NOT reject a package for an unrecognised profile URI
([core §11.2](moca-core-spec.md#112-graceful-degradation)).

An unrecognised profile MAY produce an `info` diagnostic. It MUST NOT produce
an error.

## 10. Index discovery

An SDK MUST be usable with no index present. Where it supports sidecars, it
MUST:

- validate `index.json` against
  [`sidecar-index.schema.json`](../schemas/v1/core/sidecar-index.schema.json);
- confirm `target_package_id` matches the package;
- verify `target_package_hash` when declared, and reject or mark stale on
  mismatch;
- enforce `0 ≤ chunk_index < chunk_count` per item;
- resolve `content_path` inside the target's `content/`, rejecting absolute
  paths and traversal;
- ignore a sidecar whose `storage.format` it does not recognise.

An SDK MUST NOT derive package integrity, conformance, trust, credentials, or
execution policy from a sidecar.

## 11. Graceful degradation

The behaviour that most distinguishes conformant SDKs. Every row is testable
and appears in `conformance/`:

| Condition | Required behaviour |
|---|---|
| No frontmatter on any node | Valid. Identity from path. |
| Unrecognised profile URI | Process as core. At most `info`. |
| Unknown `profileData` key | Opaque, preserved, not validated. |
| Unknown `epistemicStatus` | At most `warning`. |
| Unknown `x-*` vendor key | Ignored, preserved. |
| No `ontologies/` | Level 1. Concepts are opaque strings. |
| No sidecar | Full functionality minus search. |
| Unknown `storage.format` | Sidecar ignored, package unaffected. |
| Unresolvable composition member | Diagnostic; other members still usable. |
| `skills/` unsigned or invalid | Skills refused; **rest of package still usable**. |

The last row is the one implementations most often get wrong in both
directions. Rejecting skills MUST NOT invalidate the package, and accepting
the package MUST NOT imply accepting its skills.

## 12. Conformance level derivation

An SDK MUST derive the level from package contents and validation results, and
MUST NOT read it from the manifest — the manifest MUST NOT contain one
([core §3](moca-core-spec.md#3-conformance-levels)).

A higher-level feature that is present but invalid MUST NOT raise the derived
level. A package containing `skills/` without a valid signature MUST NOT be
reported as Level 3 conformant.

## 13. Versioning

SDKs version independently of each other and of this contract, and MUST
document which contract version they implement. A change to *required*
behaviour here is a breaking change for every SDK and MUST be recorded in
[MIGRATIONS.md](../MIGRATIONS.md).

## 14. Demonstrating conformance

An SDK claiming conformance MUST pass every case in
[`conformance/`](../conformance/README.md) whose `capabilities` it declares
support for, and MUST publish which optional capabilities it does not
implement. Passing means producing the expected diagnostic **codes** and
expected outcome — never matching message prose.
