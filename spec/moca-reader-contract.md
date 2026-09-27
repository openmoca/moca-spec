# MOCA Reader Contract

Specification version: `0.2.0-alpha.1`
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

## 2. Conformance classes

| Class | Does | Typical software |
| --- | --- | --- |
| **Reader** | Opens, checks and verifies packages, and produces citation records (§3-§11). | Libraries, the MCP server, framework adapters. |
| **Producer** | Everything a Reader does, plus writing packages, attestations or sidecars that a Reader accepts. | Converters, signing tools, index builders. |

A Producer MUST NOT write anything that a Reader of the same contract version
would reject with an error.

Search is not part of either class. A Reader MAY offer it; §8 says what any
search built on a Reader must respect.

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
implementation uses 20,000 entries and 512 MiB. A Reader MUST NOT request a
path from a host source that the source did not list.

A Reader MUST report "target does not exist" (`T001`) separately from "target
has no `moca.json`" (`T002`).

## 4. What a Reader must never do

These apply to both classes.

- **Never execute anything from a package.** No evaluation, dynamic import or
  subprocess for any content, including `skills/`.
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
6. withhold `skills/` unless a package attestation verified
   ([package spec §8](moca-package-spec.md#8-skills));
7. resolve members through the host's resolver, if one is supplied, and check
   each against its pin (§7.1 of the package spec);
8. derive capabilities ([package spec §11](moca-package-spec.md#11-capabilities)).

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
  "node": { "id": "https://example.com/moca/support-kb#refund-window.md", "path": "refund-window.md",
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
                 "selector": { "type": "TextQuoteSelector", "exact": "Customers may request …" } }],
  "audience": "public"
}
```

Rules:

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

## 9. Diagnostics

A Reader reports findings as structured values with `code`, `severity`
(`error`, `warning` or `info`), `message`, and, where it applies, `file`
(package-relative) and `line` (1-based). Codes are the contract; message text
is not, and hosts MUST NOT match on it. A Reader MUST offer a strict mode that
promotes warnings to errors without changing codes.

A package is **valid** when it has no error in the `T`, `P`, `M` or `C`
families. Errors in other families affect only the feature concerned: an
invalid attestation does not count, withheld skills are not exposed, a
mismatched member is not used, an unusable sidecar is ignored.

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
| `A001_ATTESTATION_MALFORMED` | error | An attestation file is not a parseable envelope and statement. |
| `A002_ATTESTATION_INVALID` | error | An attestation failed verification or does not match the package. |
| `A003_ATTESTATION_UNVERIFIABLE` | warning | An attestation could not be checked because no trust root was supplied. |
| `A004_ATTESTATION_INDETERMINATE` | warning | Online verification was requested but could not complete. |
| `A005_SKILLS_WITHHELD` | error | skills/ is present without a valid package attestation; skills are withheld. |
| `A006_REVIEW_OUTDATED` | warning | A review attestation covers a file whose bytes have since changed or been removed. |
| `R001_MEMBER_UNRESOLVED` | warning | A member could not be resolved by the host resolver. |
| `R002_MEMBER_DIGEST_MISMATCH` | error | A resolved member does not match its pinned digest. |
| `R003_MEMBER_CYCLE` | error | Members form a cycle. |
| `F001_PROFILE_UNRECOGNISED` | info | A declared profile is not recognised by this reader. |
| `K001_SKILL_INVALID` | warning | A skill does not conform to the Agent Skills specification. |
| `S001_SIDECAR_INVALID` | error | index.json does not validate against the sidecar schema. |
| `S002_SIDECAR_TARGET_MISMATCH` | error | The sidecar is bound to a different package id or version. |
| `S003_SIDECAR_STALE` | warning | The sidecar digest does not match the package; the sidecar is ignored. |
| `S004_SIDECAR_ITEM_INVALID` | error | A payload item breaks the addressing rules. |
| `S005_SIDECAR_FORMAT_UNKNOWN` | info | The payload format is not recognised; the sidecar is ignored. |

## 10. Handing content to a model

Package text is untrusted input
([package spec §13.1](moca-package-spec.md#131-content-is-untrusted-input-to-a-model)).
A Reader, adapter or server that passes content to a model:

- MUST pass it as data inside a citation record or a clearly delimited
  quotation, never as system or developer instructions;
- MUST NOT grant tools, change settings or follow links because content asks;
- SHOULD tell the model that retrieved text is reference material to quote and
  cite, not instructions.

## 11. Degradation

| Condition | Required behaviour |
| --- | --- |
| Unknown top-level manifest key | Ignored, never acted on; `M004` (info). |
| Unknown profile | Package read as core; profile data preserved; `F001` (info). |
| Unknown `type`, missing optional field | Accepted (OKF rule). |
| Malformed optional frontmatter field | `C005` (warning); node still read. |
| Unknown relation type | Preserved; no effect. |
| Unknown attestation predicate | Ignored. |
| No trust root | Attestations unverifiable; package still readable; skills withheld. |
| Invalid or missing package attestation with `skills/` present | Skills withheld (`A005`); the rest of the package usable. |
| No resolver | Members exposed unresolved; no diagnostic. |
| Unresolvable or mismatched member | That member is not used; the rest usable. |
| No sidecar, stale sidecar, or unknown payload format | Sidecar ignored; the package searched directly. |

## 12. Demonstrating conformance

An implementation claiming conformance MUST name its class, the contract
version, and any optional capabilities it does not implement (archives, host
sources, Sigstore verification, sidecars). It MUST pass every case in
[`conformance/cases.json`](../conformance/cases.json) that its capabilities
cover, producing the expected validity, diagnostic codes, capabilities and
digests. Message text is never compared.
