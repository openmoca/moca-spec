# MOCA Reader Contract

Specification version: `0.3.0-alpha.1`
Status: Alpha. Expect changes before `1.0.0`.
License: [Apache License 2.0](../LICENSE)

## 1. Scope

This document says what any software that reads MOCA packages must conclude
about a package and how it must behave, in any language. It specifies
behaviour, not API shape: method names, types and error handling follow each
language's own idioms. Where this document and the
[package specification](moca-package-spec.md) disagree, the package
specification wins and this document has a bug.

Conformance is shown by passing the [conformance corpus](../conformance/README.md).
The reference implementation is [`@openmoca/moca-core`](../tools/moca-core/README.md).
The operations every implementation offers, named once for all languages, are
in the [Reader interface](moca-reader-interface.md).

## 2. Conformance classes

| Class | Does | Typical software |
| --- | --- | --- |
| **Reader** | Opens, checks and verifies packages, produces citation records, searches with the default retrieval policy applied, and answers structure operations (§3-§13). | Language Readers, the MCP server, framework bindings. |
| **Producer** | Everything a Reader does, plus writing packages, attestations or sidecars that a Reader accepts. | Converters, signing tools, index builders. |

A Producer MUST NOT write anything that a Reader of the same contract version
would reject with an error.

Search is part of the Reader class
([ADR-0011](../docs/adr/0011-three-pillars-and-admission-test.md)): anything
that hands MOCA content to an application or a model goes through a Reader, so
the corpus can show that it never returns what §8 excludes.

## 3. Opening a package

A Reader MUST accept a directory with `moca.json` at its root. It SHOULD accept
a `.moca` Zip archive (as a path or as bytes) and a **host-supplied source**:
an object the host implements that lists a package's files and returns the
bytes of any listed file, so packages can live in memory, blob storage or a
database. The same package MUST produce the same conclusions, including the
same digest, whatever its source.

Before reading any entry of an archive or host source, a Reader MUST reject
(`T003_ARCHIVE_REJECTED`):

- entry names that are absolute, use `\`, or contain a `..` segment;
- more entries than an implementation-defined limit;
- more total uncompressed bytes than an implementation-defined limit.

Limits MUST be documented and SHOULD be configurable. The reference
implementation uses 20,000 entries and 512 MiB.

Package content is untrusted input, so a Reader MUST also bound the work it
does while reading. The reference implementation's limits are:

| Limit | Default | When exceeded |
| --- | --- | --- |
| Frontmatter block size | 64 KiB | `C002` for that node |
| YAML aliases in frontmatter | 0 (aliases are refused) | `C002` for that node |
| Structure file size | 4 MiB | `O001` |
| Triples in a structure file | 100,000 | `O001` |
| Evidence entries checked per node | 256 | Further entries are not checked; `matched` is absent |
| Source file size checked for evidence | 8 MiB | Not checked; `matched` is absent |

A Reader MUST NOT request a path from a host source that the source did not
list.

A Reader MUST report "target does not exist" (`T001`) separately from "target
has no `moca.json`" (`T002`).

## 4. What a Reader must never do

These apply to both classes.

- **Never execute anything from a package.** No evaluation, dynamic import or
  subprocess for any content.
- **Never act on a location or setting a package supplies.** A Reader performs
  I/O only through things the host supplied and enabled: a package source, a
  member resolver, online signature checks, and search back ends. Nothing in a
  package can cause a Reader to contact anything, and a package can never
  supply an address, a model name or a credential that a Reader will use.
- **Never read or write outside the package** while resolving package-relative
  paths.
- **Never require a model, a vector database or an agent framework** to read a
  package.

## 5. Reading a package

A Reader MUST:

1. list the package's entries and apply [package spec §6.2-§6.3](moca-package-spec.md#62-what-is-not-part-of-a-package):
   skip hidden entries, and fail closed on links, unreadable entries and path
   collisions;
2. parse `moca.json` and validate it against
   [`manifest.schema.json`](../schemas/v1/manifest.schema.json);
3. compute the digest ([package spec §6.4](moca-package-spec.md#64-algorithm));
4. read `content/` as an OKF bundle ([package spec §5](moca-package-spec.md#5-content)),
   group locale representations into nodes, and check paths and links;
5. verify attestations against the host's trust root (§6);
6. resolve members through the host's resolver, if one is supplied, and check
   each against its pin (§7.1 of the package spec);
7. derive capabilities ([package spec §11](moca-package-spec.md#11-capabilities)).

Frontmatter MUST be parsed with the YAML 1.2 core schema, so that timestamps
stay strings.

A Reader MUST NOT throw for a malformed package when a diagnostic is possible.
Malformed content is a finding; exceptions are for programming errors.

## 6. Attestations

A Reader that verifies attestations MUST follow
[moca-attestations.md](moca-attestations.md). In particular:

- with no trust root, every attestation is **unverifiable**
  (`A003`), never valid;
- a key or identity is trusted only for the roles the trust root gives it;
- offline verification is the default; online checks are opt-in, and an
  online check that cannot complete is **indeterminate** (`A004`) unless the
  host allowed an offline fallback;
- a review whose subject digest no longer matches the file is outdated
  (`A006`) and does not count.

## 7. Citation records

Whatever a Reader hands to an application for a node, or a chunk of a node,
MUST be expressible as a citation record valid against
[`citation-record.schema.json`](../schemas/v1/citation-record.schema.json):

```json
{
  "package": { "id": "https://example.com/moca/support-kb", "version": "4.2.0",
               "digest": "sha256:6539…", "signed": true, "signers": ["MOCA examples publisher"] },
  "node": { "id": "https://example.com/moca/support-kb#refund-window.md",
            "ref": "https://example.com/moca/support-kb@4.2.0#refund-window.md", "path": "refund-window.md",
            "locale": "en", "type": "Policy", "title": "Refund eligibility window", "digest": "sha256:…" },
  "span": { "start": 802, "end": 1125 },
  "text": "# Refund eligibility window …",
  "trust": {
    "status": "stable",
    "generated": { "by": "acme-drafter/2.1", "at": "2026-07-30T09:00:00Z" },
    "declaredVerified": [{ "by": "human:sam.ortiz", "at": "2026-08-14T00:00:00Z" }],
    "attestedReviews": [{ "reviewer": "human:sam.ortiz", "reviewedAt": "2026-08-14T00:00:00Z",
                          "outcome": "accurate", "signer": "MOCA examples reviewer" }],
    "staleAfter": "2027-02-14T00:00:00Z", "stale": false, "inForce": true,
    "superseded": false, "contested": false
  },
  "evidence": [{ "source": { "id": "terms-7", "resource": "../sources/refund-policy-2026.txt" },
                 "selector": { "type": "TextQuoteSelector", "exact": "Customers may request …" },
                 "matched": true }],
  "audience": "public"
}
```

Rules:

- `node.ref` is the versioned node reference, `<package id>@<version>#<path>`.
  `node.id` is the same across versions of a package, so applications MUST
  use `node.ref` (or `node.id` with `package.digest`) as the key when they
  record what an answer cited.
- `span` offsets are UTF-8 byte offsets into the node file.
- `declaredVerified` copies OKF `verified`; `attestedReviews` lists only reviews
  that verified against the trust root and match the current file. An
  application MUST NOT present a declared verification as an attested one.
- `stale` is true when now ≥ `stale_after`. `inForce` is false outside the
  validity window ([package spec §4.4](moca-package-spec.md#44-validity-window)).
  The host supplies the clock.
- `superseded` and `contested` reflect the relations among the packages the
  Reader has loaded, and the node's `moca.contested_by`
  ([package spec §7.2](moca-package-spec.md#72-relations)).
- `evidence[].matched` is `true` when the Reader checked the selector against
  the cited file inside the package and it matched, and `false` when it checked
  and it did not match (`C011`). It is absent when the Reader did not check:
  the source is outside the package or of a type below that is not listed, or
  the selector is of a kind it does not check. It says the quote is in the
  file; it does not say the node's claim is true.
- **Text is normalised before matching**, as W3C Web Annotation requires
  ("the text MUST be normalized"). By source type, from the file name:

  | Source | Normalised text |
  | --- | --- |
  | `.txt`, `.text` | The file's text, unchanged. |
  | `.md`, `.markdown` | 1. `![alt](url)` becomes `alt` and `[text](url)` becomes `text`; 2. on each line, a leading heading marker (1-6 `#` and whitespace) and a leading list marker (`-`, `*`, `+`, or digits and `.` or `)`, then whitespace) are removed; 3. every `*`, `_` and backtick is removed. |
  | `.html`, `.htm` | `script` and `style` elements removed, all tags removed, then character references decoded: numeric ones, and `&amp;` `&lt;` `&gt;` `&quot;` `&apos;` `&nbsp;` (U+00A0). |
  | `.vtt` (WebVTT) | The payload lines of every cue, cue tags removed and character references decoded as for HTML, joined with LF. The header, `NOTE` and other blocks without a cue timing line are skipped. |

  A `TextQuoteSelector` matches when its `exact` text occurs in the normalised
  text and, when `prefix` or `suffix` is given, an occurrence has that text
  immediately before or after it. No whitespace or case folding is applied. A
  `TextPositionSelector` matches when `start` ≤ `end` ≤ the length of the
  normalised text in Unicode code points.
- **Media time ranges.** A `FragmentSelector` that `conformsTo`
  `http://www.w3.org/TR/media-frags/` with a temporal value `t=start[,end]`
  (seconds, or `hh:mm:ss` with an optional `npt:` prefix) matches a WebVTT
  source when the range overlaps at least one cue. Against other media it is
  not checked. Carry the captions or transcript of a video in the package to
  make its citations checkable.
- `concepts` lists the absolute concept IRIs the node is bound to, when the
  Reader implements the [ontology profile](../profiles/ontology/moca-ontology-profile.md).

Framework adapters (for LlamaIndex, LangChain, Microsoft.Extensions.DataIngestion
and others) SHOULD store these fields as chunk metadata at ingest time, and
SHOULD store the package digest on every record, so that a changed package can
be detected and only changed files re-ingested.

## 8. Default retrieval policy

Any search built on a Reader MUST, by default, leave out records that are:

- not in force (`trust.inForce` is false);
- superseded (`trust.superseded` is true);
- deprecated (`trust.status` is `deprecated`).

The host MAY opt in to including them; they are then returned with those flags
set. Stale and contested content is returned by default, flagged.

When the host supplies a set of allowed audiences, records whose `audience` is
outside that set MUST be removed before results are returned. A caller of the
search MUST NOT be able to widen the host's audience set.

This policy applies to every search backend, including a host's own vector
store, and is applied after the backend returns (§9.2).

## 9. Search

A Reader offers one search operation. It has the same signature in every
language, and the default retrieval policy is applied inside it:

```text
search(query, { limit, includeAll, locale, concepts, scope }) -> citation records, each with a score
```

`concepts` keeps records bound to at least one of the given concept IRIs;
`scope` keeps records bound to the concept or any of its descendants by
hierarchy or parts (§10). Both refer to the package structure
([package spec §5.6](moca-package-spec.md#56-structure)).

### 9.1 Backends

Search runs over a backend the host chooses and configures; a package never
chooses one (§4). A backend takes a query, a limit and optional filters
(§9.5), and returns hits valid against
[`search-hit.schema.json`](../schemas/v1/search-hit.schema.json):

```json
{ "digest": "sha256:6539…", "node": "https://example.com/moca/support-kb#refund-window.md",
  "path": "refund-window.md", "locale": "en", "span": { "start": 802, "end": 1125 }, "score": 3.1452 }
```

`digest` is the package digest the hit was indexed from; `span`, when present,
is UTF-8 byte offsets into the node file (§7). A higher score is a better
match; scores from different backends are not comparable. A backend declares
`lexical` or `dense`, and `filterPushdown` when it applies the filters itself.

Every Reader MUST provide a lexical backend over the loaded packages' own text,
so that search works offline with nothing else installed. Dense and store
backends are optional.

### 9.2 The pipeline and the gate

Each search runs these steps, in order
([ADR-0016](../docs/adr/0016-pluggable-ontology-guided-retrieval.md)):

1. **ingress** (optional host hook): may rewrite the query and narrow the
   concepts or scope the backend searches;
2. **backend**: returns hits;
3. **resolve**: each hit becomes a citation record (§7), from the loaded
   package or, for a store backend, from the record written at ingest (§9.4);
   a hit that does not resolve is dropped;
4. **egress** (optional host hook): may reorder candidates, or add records it
   found through structure operations (§10), each tagged
   `retrieval: { via, from }`;
5. **the gate**, which MUST run last, on every candidate, whatever the backend
   and the hooks did:
   1. drop records whose package digest is not loaded (or, for a store search,
      not in the host's allowlist);
   2. apply the default retrieval policy (§8), unless the host opted in to
      including excluded content;
   3. remove records outside the host's audience set;
   4. when the caller named a locale, keep only the representation §5 of the
      package spec selects for it;
   5. when the caller named concepts or a scope, keep only records bound to
      them. Concepts and scope set by an ingress hook narrow the backend's
      search but never bind the gate: the gate follows the caller;
   6. return at most `limit` records.

Hooks are host code, supplied when the host creates the search. A package can
never supply or select one. A backend without `filterPushdown` can return hits
the gate removes; a Reader SHOULD ask such a backend for more hits than the
caller's limit.

### 9.3 Dense backends

A dense backend embeds the query with an embedder the host supplies. The
embedder declares a model `name`, an optional `version` and its vector
`dimensions`. Before a dense search over a sidecar or store, the backend MUST
compare the embedder with the index's `model`: the names must be equal, the
versions must be equal when both are given, and the dimensions must be equal
(the index's `model.dimensions`, or the length of its vectors when that is not
given). On any difference it MUST report `S006_MODEL_MISMATCH` and MUST NOT
perform a dense search. It MAY fall back to lexical search over the same text.

A package can never name the embedder a Reader uses (§4); the sidecar's
`model` is only compared, never acted on.

### 9.4 Store backends

A store backend searches content a host has already ingested into its own
vector store or database. Ingest MUST go through a Reader, and every stored
record MUST carry its whole citation record (§7), including the package
digest. At query time the Reader resolves store hits from those records: it
recomputes the clock-dependent fields (`stale`, `inForce`) for now, and keeps
only records whose digest is in the host's allowlist of loaded packages. The
host therefore never needs every package in memory to search its store.
Records left behind by an older version of a package are never returned,
because its digest is not in the allowlist.

### 9.5 Filter pushdown

When a backend declares `filterPushdown`, the Reader SHOULD pass these filters
to it:

| Filter | Value |
| --- | --- |
| `digests` | The digests of the loaded packages. |
| `exclude` | Pairs of package digest and node id that §8 excludes, unless the host opted in to including them. A node id alone is not enough: two versions of a package share node ids. |
| `audiences` | The host's audience set, if any. |
| `locale` | The caller's locale, if any. |
| `concepts` | The concepts to search: the caller's, a scope and its descendants, or those an ingress hook chose. |

Pushdown is an optimisation. The gate (§9.2) still runs on every candidate.

## 10. Structure

A Reader answers these operations over the merged structure of every loaded
package and every overlay the host supplied. They are facts, not strategy:
every Reader MUST answer them identically, and the corpus tests them exactly.
Terms and meanings are in
[package spec §5.6](moca-package-spec.md#56-structure).

| Operation | Returns |
| --- | --- |
| `concept(iri)` | The concept's preferred label (no language tag, then `en`, then the first language in code order), labels, definition, `deprecated`, what it replaces and what replaces it, and its layer; or nothing when no layer declares it. |
| `requires(iri, { transitive })` | The concepts `iri` requires. Direct: ordered by IRI. Transitive: every concept reachable through `requires`, each after the concepts it requires (depth first, ties by IRI). |
| `requiredBy(iri)` | The concepts that require `iri`, ordered by IRI. |
| `parts(iri)` | The direct parts of `iri`, ordered by IRI. |
| `narrower(iri, { transitive })` | Narrower concepts; transitively, breadth first, each level ordered by IRI. |
| `broader(iri)`, `related(iri)` | Direct broader concepts; related concepts in either direction. Ordered by IRI. |
| `sequence(iri)` | The members of the ordered collection `iri`, in list order; nothing if `iri` is not an ordered collection. |
| `nodes(iri, { include })` | Citation records of the nodes bound to `iri`, and, with `include` of `narrower`, `parts` or `both`, to its descendants, with the default retrieval policy applied, ordered by `node.ref`. |

Every concept item carries its `iri`, its preferred `label` and the `layer`
that stated the fact: `package`, `application` or `organisation`.

**Layers.** The host MAY supply overlays: Turtle it loads over the packages'
structure, as the application layer or the organisation layer
([ADR-0013](../docs/adr/0013-package-application-organisation-layers.md)).
Overlays are parsed with the same rules and limits as `structure.ttl`; a
problem in one is reported with the overlay as the file. An overlay can only
add: when two layers state the same fact, the lower layer (package, then
application, then organisation) is the one reported. Overlays are never
covered by a package's digest or signatures, and a package can never name or
load one.

**Describes, never enforces.** `requires` reports what the structure says.
Whether a person may see content depends on runtime state that only the
application holds.

## 11. Diagnostics

A Reader reports findings as structured values with `code`, `severity`
(`error`, `warning` or `info`), `message`, and, where it applies, `file`
(package-relative) and `line` (1-based). Codes are the contract; message text
is not, and hosts MUST NOT match on it. A Reader MUST offer a strict mode that
promotes warnings to errors without changing codes.

A package is **valid** when it has no error in the `T`, `P`, `M` or `C`
families. Errors in other families affect only the feature concerned: an
invalid attestation does not count, a
mismatched member is not used, an unusable sidecar is ignored. `O` diagnostics
withhold only the `ontology` capability.

| Code | Severity | Meaning |
| --- | --- | --- |
| `T001_TARGET_NOT_FOUND` | error | The target does not exist. |
| `T002_MANIFEST_NOT_FOUND` | error | The target exists but has no moca.json at its root. |
| `T003_ARCHIVE_REJECTED` | error | An archive or host source broke a safety rule or limit. |
| `P001_UNSUPPORTED_ENTRY` | error | The package contains a symbolic link or other non-regular file. |
| `P002_UNREADABLE_ENTRY` | error | A package entry could not be read. |
| `P003_PATH_COLLISION` | error | Two package paths are equal after Unicode NFC normalisation or case folding. |
| `M001_MANIFEST_INVALID_JSON` | error | moca.json is not valid UTF-8 JSON. |
| `M002_MANIFEST_SCHEMA` | error | moca.json does not validate against the manifest schema. |
| `M003_NO_CONTENT` | error | The package has neither a content node nor a member. |
| `M004_UNKNOWN_KEY` | info | A top-level manifest key is neither defined by the spec nor a vendor x-<vendor>-<key> key. |
| `M005_DUPLICATE_MEMBER` | error | The same member id appears more than once. |
| `M006_VALIDITY_WINDOW_INVALID` | warning | validUntil is not later than validFrom. |
| `M007_UNREGISTERED_URN` | info | The package id uses a URN namespace that is not registered with IANA. |
| `M008_DIGEST_V1_PACKAGE` | info | The package was written for a `mocaVersion` before 0.4; digests, pins and attestations made then will not match `moca-digest-v2`. |
| `C001_FRONTMATTER_MISSING` | error | A concept document has no YAML frontmatter (OKF MUST). |
| `C002_FRONTMATTER_INVALID` | error | Frontmatter is not parseable YAML or is not a mapping. |
| `C003_TYPE_MISSING` | error | Frontmatter has no non-empty type (OKF MUST). |
| `C004_RESERVED_FILE_INVALID` | error | index.md or log.md breaks the OKF reserved-file rules. |
| `C005_FIELD_INVALID` | warning | A frontmatter field does not match the node schema. |
| `C006_EVIDENCE_SOURCE_UNKNOWN` | warning | moca.evidence names a source id that sources[] does not declare. |
| `C007_LINK_UNRESOLVED` | warning | An internal Markdown link does not resolve. |
| `C008_UNSAFE_PATH` | error | A package-relative path is absolute or escapes the package root. |
| `C009_LOCALE_ORPHAN` | warning | A locale variant has no default-language file. |
| `C010_VALIDITY_WINDOW_INVALID` | warning | moca.valid_until is not later than moca.valid_from. |
| `C011_EVIDENCE_SELECTOR_UNMATCHED` | warning | An evidence selector does not match the text source file it cites inside the package. |
| `A001_ATTESTATION_MALFORMED` | error | An attestation file is not a parseable envelope and statement. |
| `A002_ATTESTATION_INVALID` | error | An attestation failed verification or does not match the package. |
| `A003_ATTESTATION_UNVERIFIABLE` | warning | An attestation could not be checked because no trust root was supplied. |
| `A004_ATTESTATION_INDETERMINATE` | warning | Online verification was requested but could not complete. |
| `A006_REVIEW_OUTDATED` | warning | A review attestation covers a file whose bytes have since changed or been removed. |
| `R001_MEMBER_UNRESOLVED` | warning | A member could not be resolved by the host resolver. |
| `R002_MEMBER_DIGEST_MISMATCH` | error | A resolved member does not match its pinned digest. |
| `R003_MEMBER_CYCLE` | error | Members form a cycle. |
| `F001_PROFILE_UNRECOGNISED` | info | A declared profile is not recognised by this reader. |
| `O001_ONTOLOGY_UNPARSEABLE` | warning | An ontology file listed by the ontology profile is missing or is not parseable Turtle. |
| `O002_CONCEPT_UNDECLARED` | warning | A node is bound to a concept IRI that no ontology file in the package declares. |
| `O003_REMOTE_REFERENCE` | warning | An ontology file or concept binding relies on something a Reader would have to fetch or resolve: owl:imports, or an IRI that is not absolute. |
| `S001_SIDECAR_INVALID` | error | index.json does not validate against the sidecar schema. |
| `S002_SIDECAR_TARGET_MISMATCH` | error | The sidecar is bound to a different package id or version. |
| `S003_SIDECAR_STALE` | warning | The sidecar digest does not match the package; the sidecar is ignored. |
| `S004_SIDECAR_ITEM_INVALID` | error | A payload item breaks the addressing rules. |
| `S005_SIDECAR_FORMAT_UNKNOWN` | info | The payload format is not recognised; the sidecar is ignored. |
| `S006_MODEL_MISMATCH` | warning | The host's embedder does not match the index's model; dense search is refused. |

Retired codes, never reused: `A005_SKILLS_WITHHELD`, `K001_SKILL_INVALID` ([ADR-0015](../docs/adr/0015-park-unconsumed-features.md)).

## 12. Handing content to a model

Package text is untrusted input
([package spec §13.1](moca-package-spec.md#131-content-is-untrusted-input-to-a-model)).
A Reader, adapter or server that passes content to a model:

- MUST pass it as data inside a citation record or a clearly delimited
  quotation, never as system or developer instructions;
- MUST NOT grant tools, change settings or follow links because content asks;
- SHOULD tell the model that retrieved text is reference material to quote and
  cite, not instructions.

## 13. Degradation

| Condition | Required behaviour |
| --- | --- |
| Unknown top-level manifest key | Ignored, never acted on; `M004` (info). |
| Unknown profile | Package read as core; profile data preserved; `F001` (info). |
| Unknown `type`, missing optional field | Accepted (OKF rule). |
| Malformed optional frontmatter field | `C005` (warning); node still read. |
| Unknown relation type | Preserved; no effect. |
| Unknown attestation predicate | Ignored. |
| No trust root | Attestations unverifiable; package still readable. |
| No resolver | Members exposed unresolved; no diagnostic. |
| Unresolvable or mismatched member | That member is not used; the rest usable. |
| No sidecar, stale sidecar, or unknown payload format | Sidecar ignored; the package searched directly. |
| No embedder, or an embedder that does not match the index model | No dense search (`S006` on mismatch); lexical search still available. |
| Evidence source that cannot be checked | `evidence[].matched` absent; no diagnostic. |
| Ontology profile not implemented | Package read as core; concept bindings preserved as profile data; `F001` (info). |
| Ontology file or binding problem | `O` warning; `ontology` capability withheld; the rest usable. |

## 14. Demonstrating conformance

An implementation claiming conformance MUST name its class, the contract
version, and any optional capabilities it does not implement (archives, host
sources, Sigstore verification, sidecars, profiles). It MUST pass every case in
[`conformance/cases.json`](../conformance/cases.json) that its capabilities
cover, producing the expected validity, diagnostic codes, capabilities and
digests. A Reader MUST also pass every `search` case, which checks what is
returned and what is never returned but never the ranking, and every
`structure` case, which checks the answers to structure operations exactly.
Message text is never compared.

An implementation in another repository runs the corpus through the runner
protocol in [conformance/README.md](../conformance/README.md).
