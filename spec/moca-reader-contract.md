# MOCA Reader Contract

Specification version: `0.6.0`
Status: Before `1.0.0`. A minor version may still change the format; each change is in [MIGRATIONS.md](../MIGRATIONS.md).
License: [Apache License 2.0](../LICENSE)

## 1. Scope

This document says what any software that reads MOCA packages must conclude
about a package and how it must behave, in any language. It specifies
behaviour, not API shape: method names, types and error handling follow each
language's own idioms. Where this document and the
[package specification](moca-package-spec.md) disagree, the package
specification takes precedence.

Conformance is shown by passing the [conformance corpus](../conformance/README.md).
The reference implementation is [`@openmoca/moca-core`](https://github.com/openmoca/moca-reader-typescript#readme).
The operations every implementation offers, named once for all languages, are
in the [Reader interface](moca-reader-interface.md).

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, RECOMMENDED, MAY
and OPTIONAL are to be interpreted as described in RFC 2119 and RFC 8174 when,
and only when, they appear in capitals. Terms are as defined in
[package specification §2](moca-package-spec.md#2-conventions).

## 2. Conformance classes

| Class | Does | Typical software |
| --- | --- | --- |
| **Reader** | Opens, checks and verifies packages, produces citation records, searches with the default retrieval policy applied, and answers structure operations (§3-§13). | Language Readers, the MCP server, framework bindings. |
| **Producer** | Everything a Reader does, plus writing packages, attestations or sidecars that a Reader accepts. | Converters, signing tools, index builders. |

A Producer MUST NOT write anything that a Reader of the same contract version
(the release version of the document set, [package spec §14](moca-package-spec.md#14-versioning-of-this-specification))
would reject with an error.

Search is part of the Reader class
([ADR-0001](../docs/adr/0001-three-pillars-and-admission-test.md)): anything
that hands MOCA content to an application or a model goes through a Reader, so
the corpus can show that it never returns what §8 excludes.

## 3. Opening a package

A Reader MUST accept a directory with `moca.json` at its root. It SHOULD accept
a `.moca` Zip archive (as a path or as bytes) and a **package source**: an
object the host implements that lists a package's files and returns the
bytes of any listed file, so packages can live in memory, blob storage or a
database. The same package MUST produce the same conclusions, including the
same digest, whatever its source.

Every source has the same limits. Before reading any entry of an archive,
directory or host source, a Reader MUST reject it (`T003_ARCHIVE_REJECTED`) if
it has more entries, or more total uncompressed bytes, than the limits below.
A host source need not list sizes, so a Reader MUST also stop, with `T003`,
once the bytes it has read pass the byte limit.

**Archives.** A `.moca` archive is a Zip file. A Reader MUST read it as
follows:

- **Entry names.** Names are UTF-8. A name with a byte outside ASCII and
  without the UTF-8 flag (general purpose bit 11) is rejected (`T003`): a
  Reader never guesses another encoding. A name that is absolute, starts
  with a drive prefix (`C:`), uses `\`, contains NUL, or has an empty, `.` or
  `..` segment is rejected (`T003`). A trailing `/` marks a directory, which
  is ignored.
- **Duplicates and links.** Two entries with one name collide
  (`P003_PATH_COLLISION`). An entry whose Unix mode (in the external
  attributes) is a symbolic link, or anything but a regular file, is
  unsupported (`P001_UNSUPPORTED_ENTRY`).
- **Compression.** A Reader MUST read entries that are stored or deflated, and
  MUST NOT read any other method: such an entry is unreadable
  (`P002_UNREADABLE_ENTRY`), so every Reader reaches the same conclusion.
- **Sizes.** An entry is never inflated past its declared uncompressed size.
  Every entry, stored or deflated, MUST be exactly its declared size and
  match its CRC-32; one that is not is unreadable (`P002`). The byte limit is checked against
  declared sizes before reading.
- **Directory.** The central directory is authoritative.

When an entry cannot be read, the Reader stops with `P002`: it does not go on
with missing bytes.

**Envelopes.** A Zip archive, given as a path or as bytes, with
`moca-enc.json` at its root and no `moca.json` is an envelope: an encrypted
package ([encrypted packages](moca-encrypted-package.md)). Every Reader recognises one. A Reader that
implements the optional feature `encryption` opens it in the order in
encrypted packages §5.2. One that does not checks the outer archive and its
entries (steps 1 and 2), then reports `E001_ENCRYPTED_NO_KEY`. The archive
rules and limits on this page apply to the envelope, and again to the
archive inside it.

**Directories.** A Reader MUST NOT follow a symbolic link in a directory
source, including one that replaces a file after it was listed: the file is
then unreadable (`P002`).

**Limits.** Package content is untrusted input, so a Reader MUST also bound the
work it does while reading. The outcome in the last column is normative; the
values are implementation-defined, MUST be documented, and SHOULD be
configurable by the host under the option names given. A Reader's defaults MUST
be at least those below, which the conformance corpus assumes:

| Limit | Option | Default | When exceeded |
| --- | --- | --- | --- |
| Entries in a source | `maxEntries` | 20,000 | `T003` |
| Uncompressed bytes in a source | `maxBytes` | 512 MiB | `T003` |
| Decrypted bytes of an envelope's `package.age` or `index.age`, counted as they are produced | `maxBytes` | 512 MiB | `T003` |
| age scrypt work factor (log2 N) in an envelope | `maxScryptWorkFactor` | 20 | `E006`, without running scrypt |
| Bytes of one manifest image ([package spec §4.6](moca-package-spec.md#46-images)), or of an envelope's cover copy | `maxImageBytes` | 1 MiB | `M010` for that image (`E005` for a cover copy) |
| Frontmatter block size | `maxFrontmatterBytes` | 64 KiB | `C002` for that node (`C004` for a reserved file) |
| YAML aliases in frontmatter | — | 0 (aliases are refused) | `C002` for that node |
| Structure file size | `maxStructureBytes` | 4 MiB | `O001` |
| Triples in a structure file | `maxTriples` | 100,000 | `O001` |
| Evidence entries checked per node representation | `maxEvidencePerNode` | 256 | Further entries are not checked; `matched` is absent |
| Source file size checked for evidence | `maxSourceBytesChecked` | 8 MiB | Not checked; `matched` is absent |
| Evidence checks per package | `maxEvidenceChecksPerPackage` | 10,000 | Further entries are not checked; `matched` is absent |
| Source bytes scanned for evidence per package, counted once per check | `maxEvidenceBytesPerPackage` | 256 MiB | Further entries are not checked; `matched` is absent |
| Depth of members ([package spec §7.1.1](moca-package-spec.md#711-resolving-a-composition)) | `maxMemberDepth` | 8 | `R001` for that member; it is not resolved |
| Members resolved in one read, at every depth | `maxMembers` | 256 | `R001` for each further member; it is not resolved |

A Reader MUST normalise each evidence source once per package, not once per
check, and MUST NOT let structure traversal depend on recursion depth: a long
chain of relations must not exhaust the call stack.

A Reader MUST NOT request a path from a host source that the source did not
list.

A Reader MUST report "target does not exist" (`T001`) separately from "target
has no `moca.json`" (`T002`).

## 4. What a Reader must never do

These apply to both classes.

- **No execution.** A Reader or Producer MUST NOT execute anything from a
  package: no evaluation, dynamic import or subprocess for any content.
- **No acting on package-supplied locations or settings.** A Reader MUST
  perform I/O only through things the host supplied and enabled: a package
  source, a member resolver, online signature checks, and search backends.
  Nothing in a package can cause a Reader to contact anything. A Reader MUST
  NOT use an address, a model name or a credential that a package supplies.
- **No access outside the package.** A Reader MUST NOT read or write outside
  the package while resolving package-relative paths.
- **No age plugins.** A Reader MUST NOT run an age plugin, or any other
  program, to open an envelope ([encrypted packages](moca-encrypted-package.md) §4). Key
  routes come only from the host's key provider.
- **No required infrastructure.** A Reader MUST NOT require a model, a vector
  database or an agent framework to read a package.

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

A Reader MUST report every problem in a package as a diagnostic, never as an
exception or a crash. Malformed content is a finding; exceptions are only for
programming errors, such as a missing argument.

## 6. Attestations

A Reader that verifies attestations MUST follow
[moca-attestations.md](moca-attestations.md), which is the home of these
rules. In summary:

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
               "digest": "sha256:4992…", "signed": true, "signers": ["MOCA examples publisher (INSECURE, published private key)"] },
  "node": { "id": "https://example.com/moca/support-kb#refund-window.md",
            "ref": "https://example.com/moca/support-kb@4.2.0#refund-window.md", "path": "refund-window.md",
            "locale": "en", "type": "Policy", "title": "Refund eligibility window", "digest": "sha256:…" },
  "span": { "start": 753, "end": 1077 },
  "text": "# Refund eligibility window …",
  "trust": {
    "status": "stable",
    "generated": { "by": "acme-drafter/2.1", "at": "2026-07-30T09:00:00Z" },
    "declaredVerified": [{ "by": "human:sam.ortiz", "at": "2026-08-14T00:00:00Z" }],
    "attestedReviews": [{ "reviewer": "human:sam.ortiz", "reviewedAt": "2026-08-14T00:00:00Z",
                          "outcome": "accurate", "signer": "MOCA examples reviewer (INSECURE, published private key)",
                          "packageVerified": true }],
    "reviewStatus": "approved",
    "staleAfter": "2027-02-14T00:00:00Z", "stale": false, "inForce": true,
    "superseded": false, "contested": false
  },
  "evidence": [{ "source": { "id": "terms-7", "resource": "../sources/refund-policy-2026.txt" },
                 "selector": { "type": "TextQuoteSelector", "exact": "Customers may request …" },
                 "matched": true }],
  "audience": "public"
}
```

Rules (members the example node does not have, such as `concepts`, `retrieval`
and `profiles`, are left out, as they are in a real record):

- `node.ref` is the versioned node reference, `<package id>@<version>#<path>`.
  `node.id` is the same across versions of a package, so applications SHOULD
  use `node.ref` (or `node.id` with `package.digest`) as the key when they
  record what an answer cited. A package `id` and `version` are names a
  package gives itself: `node.ref` is unique only while publishers never
  reuse a version, and a forged copy can carry the same `node.ref`.
  `node.id` with `package.digest` is the key that cannot be forged. A library
  MUST NOT hold two packages with the same `id` and `version` but different
  digests: it keeps the first and refuses the second
  (`L001_IDENTITY_CONFLICT`).
  Two representations of a node share `node.ref`; when an application
  records a citation it SHOULD keep `node.locale` with it, and any
  de-duplication is by `node.ref`, `node.locale` and `span` together.
- `span` offsets are UTF-8 byte offsets into the file of the representation the
  record cites (`<name>.<tag>.md` for a translation).
- Every field is derived as follows, so every Reader writes the same record:

  | Field | Value |
  | --- | --- |
  | `node.locale` | The representation's tag; for the default representation, the manifest's `language`, or absent when it has none. |
  | `node.digest` | `sha256:` and the SHA-256 of the representation file's bytes. |
  | `text` | When included, the representation file's UTF-8 text after the closing frontmatter delimiter, or the text at `span` for a chunk. |
  | `trust.status` | OKF `status` when it is `draft`, `stable` or `deprecated`; otherwise `stable`. |
  | `trust.generated`, `trust.declaredVerified` | OKF `generated` and `verified`; an entry with no `by` is left out. |
  | `trust.validFrom`, `trust.validUntil` | The node's effective window ([package spec §4.4](moca-package-spec.md#44-validity-window)), as written. |
  | `trust.contestedBy` | The node's `moca.contested_by`, as written, then `<id>@<version>` of each loaded package it conflicts with. |
  | `audience` | As in [§8](#8-default-retrieval-policy); `audienceInvalid` is `true` when the label is malformed. |
  | `profiles` | The manifest's profile URIs, in manifest order; absent when there are none. |

  A consumer of citation records (a store, an application) SHOULD ignore
  properties it does not know: later versions add fields. An AG-UI client
  MUST ([AG-UI citations §4](moca-ag-ui-citations.md#4-client-rules)).
- `declaredVerified` copies OKF `verified`; `attestedReviews` lists only reviews
  that verified against the trust root and match the current file, the latest
  from each signer, each with `packageVerified` (whether the package is
  signed). `reviewStatus` is `approved`, `disputed`, `unverified` or `none`
  ([attestations §4](moca-attestations.md#4-review-attestations)). An
  application SHOULD NOT present a declared verification as an attested one,
  or an `unverified` or `disputed` review as an approval.
- `stale` is true when now ≥ `stale_after`. `inForce` is false outside the
  validity window ([package spec §4.4](moca-package-spec.md#44-validity-window)).
  The host supplies the clock.
- `superseded` and `contested` reflect the relations among the packages the
  Reader has loaded, and the node's `moca.contested_by`
  ([package spec §7.2](moca-package-spec.md#72-relations)).
- `evidence[].matched` is `true` when the Reader checked the selector against
  the cited file inside the package and it matched, and `false` when it checked
  and it did not match (`C011`). It is absent when the Reader did not check:
  the source is outside the package, its file type is not in the table below,
  or the Reader does not check that kind of selector. It says the quote is in the
  file; it does not say the node's claim is true.
- **Text is normalised before matching**, as W3C Web Annotation requires
  ("the text MUST be normalized"). By source type, from the file name's extension, compared case-insensitively in ASCII:

  | Source | Normalised text |
  | --- | --- |
  | `.txt`, `.text` | The file's text, unchanged. |
  | `.md`, `.markdown` | 1. `![alt](url)` becomes `alt` and `[text](url)` becomes `text`; 2. on each line, a leading heading marker (1-6 `#` and whitespace) and a leading list marker (`-`, `*`, `+`, or digits and `.` or `)`, then whitespace) are removed; 3. every `*`, `_` and backtick is removed. |
  | `.html`, `.htm` | `script` and `style` elements removed, all tags removed, then character references decoded: numeric ones, and `&amp;` `&lt;` `&gt;` `&quot;` `&apos;` `&nbsp;` (U+00A0). |
  | `.vtt` (WebVTT) | The payload lines of every cue, cue tags removed and character references decoded as for HTML, joined with LF. The header, `NOTE` and other blocks without a cue timing line are skipped. |

  For Markdown and HTML sources, the quote's `exact`, `prefix` and `suffix` are
  normalised the same way, so markup in either never decides a match. A
  `TextQuoteSelector` matches when one occurrence of `exact` in the normalised
  text is immediately preceded by `prefix` (when given) and immediately
  followed by `suffix` (when given): that is, when `prefix` + `exact` +
  `suffix` occurs. No whitespace or case folding is applied. A leading byte
  order mark is not part of a source's text, and the Markdown markers in
  step 2 are removed with any white space before them. A
  `TextPositionSelector` on its own is not checked, and `matched` is absent:
  offsets in range prove nothing about what is there.
- **Media time ranges.** A `FragmentSelector` that `conformsTo`
  `http://www.w3.org/TR/media-frags/` with a temporal value `t=start[,end]`
  (seconds, or `hh:mm:ss` with an optional `npt:` prefix; an empty start
  means 0, as Media Fragments 1.0 allows) matches a WebVTT
  source when the range overlaps at least one cue. Against other media it is
  not checked. Carry the captions or transcript of a video in the package to
  make its citations checkable.
- `concepts` lists the absolute concept IRIs the node is bound to by its
  `moca.concepts` ([package spec §5.6](moca-package-spec.md#56-structure)).

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

When the host supplies a set of allowed audiences, a Reader MUST remove before
results are returned every record:

- whose `audience` is not in the set;
- whose node has a malformed `moca.audience` (anything but a non-empty
  string; the record carries `audienceInvalid: true`), even when the host
  allows unlabelled content;
- that has no `audience`, unless the host has also allowed unlabelled content
  (`allowUnlabelled`, off by default).

Labels are compared exactly. A caller of the search MUST NOT be able to widen
the host's audience set, allow unlabelled content, or opt in to excluded
content. A record's `audience` is its representation's `moca.audience`, or,
for a translation with none of its own, the default representation's
([package spec §5.4](moca-package-spec.md#54-locales)).

Audience is a label a host filters on, not access control
([package spec §13.3](moca-package-spec.md#133-audience-is-a-label-not-access-control)):
fail-closed filtering protects against a forgotten label, not against someone
who has the package file.

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
{ "digest": "sha256:4992…", "node": "https://example.com/moca/support-kb#refund-window.md",
  "path": "refund-window.md", "locale": "en", "span": { "start": 753, "end": 1077 }, "score": 3.1452 }
```

`digest` is the package digest the hit was indexed from; `span`, when present,
is UTF-8 byte offsets into the node file (§7). A higher score is a better
match; scores from different backends are not comparable. A backend declares
`lexical`, `dense` or both (a hybrid backend, §9.6), and `filterPushdown` when
it applies the filters itself.

Every Reader MUST provide a lexical backend over the loaded packages' own text,
so that search works offline with nothing else installed. Dense and store
backends are optional.

**The built-in lexical backend** searches each node representation's title
and body, or a bound sidecar's chunks, always reading the package's own bytes
and never a sidecar's `text`. It MUST tokenise query and text alike:
NFKC-normalise, then lower-case as package spec §6.3 does; letters, digits and
combining marks (`\p{L}`, `\p{N}`, `\p{M}`) form words and anything else
separates them; text in scripts written without spaces (Thai, Lao, Myanmar,
Khmer, Japanese kana, CJK ideographs) is split into single characters, each
with its combining marks, and indexed as each character and each pair of
neighbours. A representation or chunk matches when it shares at least one
token with the query. There is no stemming. How matches are scored is the
backend's own (the reference Readers use BM25 with k1 = 1.2 and b = 0.75); a
host that needs other matching supplies its own backend.

### 9.2 The pipeline and the gate

Each search runs these steps, in order
([ADR-0010](../docs/adr/0010-pluggable-ontology-guided-retrieval.md)):

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
   6. keep one record per node representation and span: two candidates with
      the same `node.ref`, `node.locale` and `span.start` are one result, the
      first;
   7. return at most `limit` records. `limit` defaults to 5.

Hooks are host code, supplied when the host creates the search. A package can
never supply or select one. A backend without `filterPushdown` can return hits
the gate removes; a Reader SHOULD ask such a backend for more hits than the
caller's limit.

### 9.3 Dense backends

A dense backend (semantic search) embeds the query with an embedder the host supplies. The
embedder declares a model `name`, an optional `version` and its vector
`dimensions`. Before a dense search over a sidecar or store, the backend MUST
compare the embedder with the index's `model`. They match when all of these
hold: the names are equal; the versions are equal, if both give one; the
dimensions are equal (the index's `model.dimensions`, or the length of its
vectors when that is not given); and `queryPrefix` and `documentPrefix` are
each equal, where a prefix that only one side declares is a difference:
vectors made with a prefix and queries made without one do not compare. On any
difference it MUST report `S006_MODEL_MISMATCH` and MUST NOT perform a dense
search. It MAY fall back to lexical search over the same text.

A Reader embeds a search query with the role `query`, and a store backend
embeds content at ingest with the role `document`
([Reader interface §5.3](moca-reader-interface.md#53-embedder)). The embedder
applies its model's convention for each role. A Reader MUST NOT add a prefix
it reads from an index to what it embeds: an index is untrusted input, and
some models take free-text instructions.

A dense backend MUST report `S007_NO_VECTORS` for each loaded package it has
no vectors for (no sidecar, an unusable sidecar, or one without vectors), and
MUST NOT return hits from it. With `S006`, every loaded package a dense
backend does not search is reported, so a host never mistakes results from
some packages for results from all of them.

A dense backend scores each vector against the query by the index's
`model.distance`: `cosine` (the default when it is absent) is cosine
similarity, `dot` is the dot product, and `euclidean` is the negative
Euclidean distance, so a higher score is always a better match.

A package can never name the embedder a Reader uses (§4); the sidecar's
`model` is only compared and read for its distance, never acted on.

### 9.4 Store backends

A store backend searches content a host has already ingested into its own
vector store or database. Ingest MUST go through a Reader, and every stored
record MUST carry its whole citation record (§7), including the package
digest. A stored record is a snapshot: whatever depends on other packages or on
the trust root may have changed since ingest.

So a store search takes the host's **package states**: for each loaded
package, its digest, `id`, `version`, default language, relations, relation
scopes (§7.2 of the package spec), signers, current reviews and node-level
`moca.contested_by`. A Reader produces a package's state from the package
result (`packageState`); it is small, plain JSON that a host keeps beside its
store. At query time the Reader resolves store hits from their records and
MUST recompute from the states and the clock: `stale` and `inForce`;
`superseded`, `supersededBy`, `contested` and `contestedBy` from the relations
among the loaded packages; `package.signed` and `signers`; and
`attestedReviews` and `reviewStatus`. It keeps only records whose package is
among the states. The host therefore never needs every package in memory to
search its store, and a package superseded, or a key removed from the trust
root, after ingest is reflected at once. Records left behind by an older
version of a package are never returned, because its state is not supplied.

The store itself is trusted: the Reader cannot check a stored record's text or
audience against the package without loading it. A host whose store others can
write to SHOULD NOT use it as a store backend: the Reader cannot protect it.

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

### 9.6 Hybrid backends

A Reader MAY offer a hybrid backend. It runs a lexical and a dense backend the
host supplies, with the same query, limit and filters, and merges their hits.
Two hits are the same hit when their digest, node, locale and span are equal;
a hit without a span stands for the whole representation and is the same hit
as no other. The host sets any weights; a package or a sidecar never does. A
package the dense backend cannot search (`S006`, `S007`) is still found
through the lexical side. The gate (§9.2) runs after the hybrid backend, as
for every backend.

How the hits are merged and ranked is not part of conformance (§14). The
reference Readers use Reciprocal Rank Fusion (informative):

```text
score(hit) = Σ over the two backends of  weight_b / (k + rank_b(hit))
```

`rank_b` is the hit's 1-based position in backend b's results; a hit a backend
did not return adds nothing from it. `k` defaults to 60 and each weight to 1.
Weights are at least 0, and at least one is above 0; a Reader MUST refuse other
settings as a host error, before any search.
A hit whose fused score is 0 is dropped, so a backend with weight 0
contributes nothing. Ties are ordered by node id, then locale, then span start,
then digest; a record with no span comes before one with a span. The hybrid backend declares `lexical` and `dense`,
`filterPushdown` when both backends do, and reports both backends'
diagnostics. Our three Readers rank identically, which their parity tests
check; another Reader may rank differently and still conform.

## 10. Structure

A Reader answers these operations over the merged structure of every loaded
package and every overlay the host supplied. They are facts, not strategy:
every Reader MUST answer them identically, and the corpus tests them exactly.
Terms and meanings are in
[package spec §5.6](moca-package-spec.md#56-structure).

| Operation | Returns |
| --- | --- |
| `concept(iri)` | The concept's preferred label (no language tag, then `en`, then the first language tag in order, §2 of the package spec), labels, definition, `deprecated`, what it replaces and what replaces it, and its layer; or nothing when no layer declares it. |
| `requires(iri, { transitive })` | The concepts `iri` requires. Direct: ordered by IRI. Transitive: every concept reachable through `requires`, each after the concepts it requires (depth first, ties by IRI). |
| `requiredBy(iri)` | The concepts that require `iri`, ordered by IRI. |
| `parts(iri)` | The direct parts of `iri`, ordered by IRI. |
| `narrower(iri, { transitive })` | Narrower concepts; transitively, breadth first, each level ordered by IRI. |
| `broader(iri)`, `related(iri)` | Direct broader concepts; related concepts in either direction. Ordered by IRI. |
| `sequence(iri)` | The members of the ordered collection `iri`, in list order; nothing if `iri` is not an ordered collection. |
| `nodes(iri, { include })` | Citation records of the nodes bound to `iri`, and, with `include` of `narrower`, `parts` or `both`, to its descendants, with the default retrieval policy applied, ordered by `node.ref`. |

Every concept item carries its `iri`, its preferred `label` (absent when the
concept has none) and the `layer` that stated the fact: `package`,
`application` or `organisation`.

**The concept result.** `concept(iri)` returns an object with these members,
in this order:

| Member | Value |
| --- | --- |
| `iri` | The concept's IRI. |
| `label` | The preferred label; absent when there is none. |
| `labels` | Every `skos:prefLabel`, keyed by language tag (`""` for none). |
| `definition` | The preferred `skos:definition`, chosen as the label is; absent when there is none. |
| `deprecated` | `true` when a layer states `owl:deprecated true`, otherwise `false`. |
| `replacedBy` | The concepts that replace this one, ordered by IRI. |
| `replaces` | The concepts this one replaces, ordered by IRI. |
| `layer` | The layer that declared the concept. |

**Cycles.** `O005` is a warning, so a merged graph can still hold cycles, and
overlays can add them. Every traversal keeps a set of visited concepts: each
concept appears at most once, the starting concept never appears in its own
result, and a concept already visited is skipped. For transitive `requires`,
a concept still on the current path is skipped too, so inside a cycle a
concept can come before one it requires. `narrower` lists each concept at the
shallowest level it is reached.

**Layers.** The host MAY supply overlays: Turtle it loads over the packages'
structure, as the application layer or the organisation layer
([ADR-0008](../docs/adr/0008-package-application-organisation-layers.md)).
Overlays are parsed with the same rules and limits as `structure.ttl`; a
problem in one is reported with the overlay as the file. An overlay can only
add: when two layers state the same fact, it is reported with the first layer
that states it, in this order: package, application, organisation. Overlays are never
covered by a package's digest or signatures, and a package can never name or
load one.

**Describes, never enforces.** `requires` reports what the structure says.
Whether a person may see content depends on runtime state that only the
application holds. In the same way, `deprecated`, `replaces` and `replacedBy`
are reported, never acted on: structure never removes a record from search or
from `nodes()` ([package spec §5.5](moca-package-spec.md#55-trust-fields)).

**Overlays never change a package.** A package's capabilities, validity and
diagnostics come from the package alone; the structure operations are the only
place overlays appear.

## 11. Diagnostics

A Reader MUST report findings as structured values with `code`, `severity`
(`error`, `warning` or `info`), `message`, and, where it applies, `file`
(package-relative) and `line` (1-based). Codes are the contract; message text
is not, and hosts MUST NOT match on it. A Reader MUST offer a strict mode that
promotes warnings to errors without changing codes. Validity then follows
the promoted severities: a `T`, `P`, `M`, `C` or `E` warning makes the package
invalid, and a promoted warning in another family affects only its feature.

A package is **valid** when it has no error in the `T`, `P`, `M`, `C` or `E`
families. Errors in other families affect only the feature concerned: an
invalid attestation does not count, a
mismatched member is not used, an unusable sidecar is ignored. `O` diagnostics
withhold only the `structured` capability.

| Code | Severity | Meaning |
| --- | --- | --- |
| `T001_TARGET_NOT_FOUND` | error | The target does not exist. |
| `T002_MANIFEST_NOT_FOUND` | error | The target exists but has no moca.json at its root. |
| `T003_ARCHIVE_REJECTED` | error | An archive or host source broke a safety rule or limit. |
| `P001_UNSUPPORTED_ENTRY` | error | The package contains a symbolic link or other non-regular file. |
| `P002_UNREADABLE_ENTRY` | error | A package entry could not be read. |
| `P003_PATH_COLLISION` | error | Two package paths are equal after Unicode NFC normalisation, or after normalisation and simple lowercase mapping ([package spec §6.3](moca-package-spec.md#63-entries-that-make-a-package-invalid)). |
| `M001_MANIFEST_INVALID_JSON` | error | moca.json is not valid UTF-8 JSON. |
| `M002_MANIFEST_SCHEMA` | error | moca.json does not validate against the manifest schema. |
| `M003_NO_CONTENT` | error | The package has neither a content node nor a member. |
| `M004_UNKNOWN_KEY` | info | A top-level manifest key is neither defined by the spec nor a vendor x-<vendor>-<key> key. |
| `M005_DUPLICATE_MEMBER` | error | The same member id appears more than once. |
| `M006_VALIDITY_WINDOW_INVALID` | warning | validUntil is not later than validFrom. |
| `M007_UNREGISTERED_URN` | info | The package id uses a URN namespace that is not registered with IANA. |
| `M008_DIGEST_V1_PACKAGE` | info | The package was written for a `mocaVersion` before 0.4; digests, pins and attestations made then will not match `moca-digest-v2` ([package spec §14](moca-package-spec.md#14-versioning-of-this-specification)). |
| `M009_MOCA_VERSION_NEWER` | warning | The package was written for a newer `mocaVersion` than this Reader implements; it is read under the newest rules this Reader implements ([package spec §14](moca-package-spec.md#14-versioning-of-this-specification)). |
| `M010_IMAGE_INVALID` | warning | A manifest image is missing, over `maxImageBytes`, or does not start with the signature of its `type`. It is left out of the result ([package spec §4.6](moca-package-spec.md#46-images)). |
| `M011_TRANSLATION_LOCALE_UNDECLARED` | error | A key of `translations` is not a tag in `locales` ([package spec §4.7](moca-package-spec.md#47-translations)). |
| `M012_TAG_DUPLICATE` | warning | Two tags in one list are equal, compared case-insensitively. The repeat is dropped ([package spec §4.8](moca-package-spec.md#48-tags)). |
| `M013_ALT_IMAGE_UNKNOWN` | warning | A translated `alt` text names no image in `images`. It is dropped. |
| `C001_FRONTMATTER_MISSING` | error | A concept document has no YAML frontmatter (OKF MUST). |
| `C002_FRONTMATTER_INVALID` | error | Frontmatter is not parseable YAML or is not a mapping. |
| `C003_TYPE_MISSING` | error | Frontmatter has no non-empty type (OKF MUST). |
| `C004_RESERVED_FILE_INVALID` | error | index.md or log.md breaks the OKF reserved-file rules. |
| `C005_FIELD_INVALID` | warning | A frontmatter field does not match the node schema. |
| `C006_EVIDENCE_SOURCE_UNKNOWN` | warning | moca.evidence names a source id that sources[] does not declare. |
| `C007_LINK_UNRESOLVED` | warning | An internal Markdown link does not resolve. |
| `C008_UNSAFE_PATH` | error | A package-relative path is absolute or escapes the package root. |
| `C009_LOCALE_ORPHAN` | warning | A locale representation has no default-language file. |
| `C010_VALIDITY_WINDOW_INVALID` | warning | moca.valid_until is not later than moca.valid_from. |
| `C011_EVIDENCE_SELECTOR_UNMATCHED` | warning | An evidence selector does not match the text source file it cites inside the package. |
| `E001_ENCRYPTED_NO_KEY` | error | An envelope was not opened: there is no key provider, it returned no key or a kind of key no stanza uses, or the Reader does not implement `encryption` ([encrypted packages §5.1](moca-encrypted-package.md#51-the-key-provider)). |
| `E002_DECRYPTION_FAILED` | error | A key was supplied for an envelope, but it is not a valid key of its kind, unwrapping failed, or the header MAC failed. |
| `E003_PAYLOAD_CORRUPT` | error | An envelope's encrypted payload failed authentication or was truncated. |
| `E004_OUTLINE_MISMATCH` | error | An envelope's outline differs from the decrypted manifest, structure or cover. |
| `E005_ENVELOPE_INVALID` | error | An envelope has a missing, repeated or unexpected entry, an encrypted entry that is not stored, a cover copy over `maxImageBytes`, or an invalid `moca-enc.json`, or a Zip has both `moca.json` and `moca-enc.json` at its root. |
| `E006_AGE_HEADER_INVALID` | error | An envelope's age header is malformed or unsupported, over 64 KiB, breaks the scrypt rules or the work-factor limit, has no full payload nonce, or has a low-order X25519 share. |
| `A001_ATTESTATION_MALFORMED` | error | An attestation file is not a parseable envelope and statement. |
| `A002_ATTESTATION_INVALID` | error | An attestation failed verification or does not match the package. |
| `A003_ATTESTATION_UNVERIFIABLE` | warning | An attestation could not be checked ([attestations §7](moca-attestations.md#7-verifying-an-attestation) says when). |
| `A004_ATTESTATION_INDETERMINATE` | warning | Online verification was requested but could not complete. |
| `A006_REVIEW_OUTDATED` | warning | A review attestation covers a file whose bytes have since changed or been removed. |
| `A007_REVIEW_DATE_FUTURE` | warning | A review is dated later than the host clock, so it does not count ([attestations §4](moca-attestations.md#4-review-attestations)). |
| `A008_PACKAGE_DIGEST_MISMATCH` | error | A package attestation names this package's `id` and `version` with a different digest: the content changed after it was signed ([attestations §3](moca-attestations.md#3-package-attestations)). |
| `A009_SIGNATURE_REQUIRED` | error | The host requires a valid package attestation (`requireSignature`) and the package has none. This one makes the package invalid. |
| `R001_MEMBER_UNRESOLVED` | warning | A member could not be resolved by the host resolver. |
| `R002_MEMBER_DIGEST_MISMATCH` | error | A resolved member does not match its pinned digest. |
| `R003_MEMBER_CYCLE` | error | Members form a cycle. |
| `R004_RELATION_UNAUTHORISED` | info | A `supersedes` or `conflictsWith` relation is not authorised by a signer of the package, so it has no effect ([package spec §7.2](moca-package-spec.md#72-relations)). |
| `L001_IDENTITY_CONFLICT` | error | A library was given a second package with the same `id` and `version` but a different digest; the second is refused (§7). Reported by the library, not the package. |
| `F001_PROFILE_UNRECOGNISED` | info | A declared profile is not recognised by this Reader. |
| `O001_ONTOLOGY_UNPARSEABLE` | warning | `structure.ttl` or a host overlay is over the size or triple limit (§3), or is not parseable Turtle. |
| `O002_CONCEPT_UNDECLARED` | warning | A relation, ordered collection or node binding uses a concept that is not declared as a `skos:Concept`. |
| `O003_REMOTE_REFERENCE` | warning | `structure.ttl` or a node binding relies on something a Reader would have to fetch or resolve: `owl:imports`, or an IRI that is not absolute. |
| `O005_STRUCTURE_CYCLE` | warning | `requires`, `broader` or `hasPart` forms a cycle ([package spec §5.6](moca-package-spec.md#56-structure)). |
| `S001_SIDECAR_INVALID` | error | index.json does not validate against the sidecar schema. |
| `S002_SIDECAR_TARGET_MISMATCH` | error | The sidecar is bound to a different package id or version. |
| `S003_SIDECAR_STALE` | warning | The sidecar digest does not match the package; the sidecar is ignored. |
| `S004_SIDECAR_ITEM_INVALID` | error | A payload item breaks the addressing rules. |
| `S005_SIDECAR_FORMAT_UNKNOWN` | info | The payload format is not recognised; the sidecar is ignored. |
| `S006_MODEL_MISMATCH` | warning | The host's embedder does not match the index's model; dense search is refused. |
| `S007_NO_VECTORS` | warning | A loaded package has no vectors a dense backend can search; that package is not searched. |

Retired codes, never reused: `A005_SKILLS_WITHHELD`, `K001_SKILL_INVALID` ([ADR-0011](../docs/adr/0011-park-unconsumed-features.md)), `O004_STRUCTURE_VIEW_MISMATCH` ([ADR-0019](../docs/adr/0019-park-structure-json.md)).

## 12. Handing content to a model

Package text is untrusted input
([package spec §13.1](moca-package-spec.md#131-content-is-untrusted-input-to-a-model)).

**Package-supplied text** is every string that comes from a package: node
bodies, titles, descriptions, tags, every frontmatter value (`x-` keys
included), manifest fields, structure labels and definitions, evidence
quotes, sidecar text, file paths, and names in attestations. All of it is
untrusted, not only the body.

A Reader, adapter or server that passes content to a model:

- MUST pass package-supplied text as data inside an envelope, never as system
  or developer instructions;
- MUST escape package-supplied text so that it cannot end the envelope or
  start a new part of it. A JSON document, with the text in JSON strings, is
  the RECOMMENDED envelope: JSON's own escaping does this. Any other
  delimiter (a tag, a fence, a marker line) MUST be escaped or removed
  wherever it appears in the text;
- MUST NOT grant tools, change settings or follow links because content asks;
- SHOULD tell the model, outside the envelope, that retrieved text is
  reference material to quote and cite, not instructions.

**Rendering.** Applications are not a conformance class, so this is advice
([package spec §1.1](moca-package-spec.md#11-the-document-set)); an AG-UI
client is bound by it
([AG-UI citations §4](moca-ag-ui-citations.md#4-client-rules)). An
application that shows package-supplied text, or a model's answer built from
it, to a person:

- SHOULD make links only for `http` and `https` URIs, and show any other
  scheme (`javascript:`, `data:`, `file:` and the rest) as plain text;
- SHOULD NOT load remote resources named in package text automatically: no
  images, frames, styles or scripts fetched because the text names them. A
  Markdown image in a package or an answer can send data to whoever controls
  its URL;
- SHOULD render package text as text or as sanitised markup, never as active
  content.

## 13. Degradation

| Condition | Required behaviour |
| --- | --- |
| Unknown top-level manifest key | Ignored, never acted on; `M004` (info). |
| Unknown profile | Package read as core; profile data preserved; `F001` (info). |
| Unknown `type`, missing optional field | Accepted (OKF rule). |
| Malformed optional frontmatter field | `C005` (warning); node still read. |
| Unknown relation type | Preserved; no effect. |
| Unknown attestation predicate | Ignored. |
| An envelope, with no key provider | Envelope recognised; not opened; `E001` (error). The package is not valid, and nothing inside it is exposed. |
| An envelope, read by a Reader without the `encryption` feature | Envelope recognised; not opened; `E001` (error), as with no key provider. |
| No trust root | Attestations unverifiable; package still readable. |
| No resolver | Members exposed unresolved; no diagnostic. |
| Unresolvable or mismatched member | That member is not used; the rest usable. |
| No sidecar, stale sidecar, or unknown payload format | Sidecar ignored; the package searched directly. |
| No embedder, or an embedder that does not match the index model | No dense search (`S006` on mismatch); lexical search still available. |
| A package without vectors, under a dense backend | That package is not searched by the dense backend (`S007`); lexical search still available. |
| Evidence source that cannot be checked | `evidence[].matched` absent; no diagnostic. |
| Structure or binding problem | `O` warning; `structured` capability withheld; the rest usable. |

## 14. Demonstrating conformance

An implementation claiming conformance MUST name its class, the contract
version, and any **optional features** it does not implement (archives, host
sources, Sigstore verification, sidecars, profiles, `encryption`).
`encryption` is opening envelopes
([encrypted packages](moca-encrypted-package.md)). A Reader without it still
recognises an envelope and reports `E001`. "Optional features" are
what an implementation does; "capabilities" are what a package has
([package spec §11](moca-package-spec.md#11-capabilities)). It MUST pass every
case in [`conformance/cases.json`](../conformance/cases.json) except those
that need an optional feature it names, producing the expected validity, diagnostic codes, capabilities and
digests. A Reader MUST also pass every `search` case, which checks what is
returned and what is never returned but never the ranking, and every
`structure` case, which checks the answers to structure operations exactly.
Message text is never compared.

An implementation in another repository runs the corpus through the runner
protocol in [conformance/README.md](../conformance/README.md).
