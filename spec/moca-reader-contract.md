# MOCA Reader Contract

Specification version: `0.7.0`
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
  (`P002_UNREADABLE_ENTRY`), so every Reader reaches the same conclusion. An
  entry with the encryption flag (general purpose bit 0) is unreadable too
  (`P002`).
- **Sizes.** An entry is never inflated past its declared uncompressed size.
  Every entry, stored or deflated, MUST be exactly its declared size and
  match its CRC-32; one that yields fewer bytes, or more, or fails its
  CRC-32, is unreadable (`P002`). The byte limit is checked against
  declared sizes before reading.
- **Directory.** One central directory is authoritative, and a Reader finds
  it the same way every time:
  - **One end record.** The end-of-central-directory record is the one that
    ends exactly at the end of the file: its signature, its 22 bytes, and a
    comment of the length it declares, with nothing after. A Reader searches
    back from the end of the file through the longest comment a record can
    declare (65,535 bytes). If no position qualifies, or more than one does,
    the archive is rejected (`T003`).
  - **One file, no Zip64.** A multi-disk archive (a disk number that is not
    0, or two different entry counts) is rejected (`T003`). So is an archive
    that uses Zip64 in its directory: an end record whose entry count is
    0xFFFF or whose directory size or offset is 0xFFFFFFFF, or a Zip64
    end-of-central-directory locator just before the end record (`T003`).
    This version does not read Zip64; no package within the default limits
    needs it.
  - **The directory holds what it declares.** The central directory starts
    at the offset the end record gives, ends at or before the end record,
    and holds exactly the declared number of entries in exactly the declared
    number of bytes. Otherwise: `T003`.
  - **Local headers agree.** Each entry's local header is at the offset the
    directory gives, before the central directory, and has the same name,
    byte for byte, and the same compression method. Otherwise: `T003`.
  - **Everything else comes from the directory.** Names, flags, sizes and
    CRC-32 values are read from the central directory, never from a local
    header or a data descriptor. The Info-ZIP Unicode path extra field is
    ignored: the name is the directory's file name field.

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
| Decrypted bytes of an envelope's `package.age` or `index.age`, computed from the encrypted payload's length before any of it is decrypted | `maxBytes` | 512 MiB | `T003` |
| age scrypt work factor (log2 N) in an envelope: an integer from 1 to 22. Any other value is a host error, and the Reader refuses it. The default, 20, needs about 1 GiB of memory for each encrypted entry, and a package and its index can both need it, so a server may set it lower | `maxScryptWorkFactor` | 20 | `E006`, without running scrypt |
| Recipient stanzas in an envelope's age header | — | 256 | `E006` |
| Bytes of one manifest image ([package spec §4.6](moca-package-spec.md#46-images)), or of an envelope's cover copy | `maxImageBytes` | 1 MiB | `M010` for that image (`E005` for a cover copy) |
| Frontmatter block size | `maxFrontmatterBytes` | 64 KiB | `C002` for that node (`C004` for a reserved file) |
| YAML aliases in frontmatter | — | 0 (aliases are refused) | `C002` for that node |
| Nesting of JSON, of YAML frontmatter and of structure Turtle (`structure.ttl` and host overlays; below). This one is fixed, not a default, so every Reader agrees on what is malformed | — | 64 levels | The text is malformed: `M001` for `moca.json`, `C002` for a node's frontmatter (`C004` for a reserved file), `A001` for an attestation file or its statement, `E005` for `moca-enc.json`, `S001` for a sidecar's `index.json`, `S004` for a payload line, `O001` for `structure.ttl` or a host's structure overlay |
| Structure file size | `maxStructureBytes` | 4 MiB | `O001` |
| Triples in a structure file | `maxTriples` | 100,000 | `O001` |
| Collection members in a structure file: the list cells reached from every `skos:memberList` statement, added together, so a list that several collections name counts once for each | `maxTriples` | 100,000 | `O001` |
| Attestation files in a package ([attestations §7](moca-attestations.md#7-verifying-an-attestation), step 1) | `maxAttestations` | 256 | None of them is read; `A001`, once |
| Bytes of one attestation file | `maxAttestationBytes` | 1 MiB | `A001` for that file; it is not parsed |
| Signature entries in one DSSE envelope, in a `.dsse.json` file or a Sigstore bundle. This one is fixed, not a default, so every Reader agrees on which envelopes are malformed | — | 16 | `A001` for that file; no entry is tried |
| Evidence entries checked per node representation | `maxEvidencePerNode` | 256 | Further entries are not checked; `matched` is absent |
| Source file size checked for evidence | `maxSourceBytesChecked` | 8 MiB | Not checked; `matched` is absent |
| Evidence checks in one read, by the package and all its members together (below) | `maxEvidenceChecksPerPackage` | 10,000 | Further entries are not checked; `matched` is absent |
| Source bytes scanned for evidence in one read, by the package and all its members together, counted once per check | `maxEvidenceBytesPerPackage` | 256 MiB | Further entries are not checked; `matched` is absent |
| Depth of members ([package spec §7.1.1](moca-package-spec.md#711-resolving-a-composition)) | `maxMemberDepth` | 8 | `R001` for that member; it is not resolved |
| Members resolved in one read, at every depth, each distinct member counted once (below). Each resolved member is held in memory, so a host on a small device may set it lower | `maxMembers` | 4,096 | `R001` for each further member; it is not resolved |
| Bytes of all the members read in one read, counted once per distinct member. Checked before each new member is resolved, so one member can take the total past it | `maxMemberBytes` | 1 GiB | `R001` for each further member; it is not resolved |

**Each member once per read.** Within one read, a member with a given `id`,
`version` and pinned `digest` is resolved and read once, the first time it is
reached, depth first in the order of each `members` list. Every later
occurrence in the same read shares that result: it is not resolved, read,
decrypted or verified again, and counts once toward `maxMembers` and
`maxMemberBytes`. So a composition in which many packages share members costs
what its distinct members cost. A member whose `id` an earlier entry of the
same `members` list already has is a repeat (`M005_DUPLICATE_MEMBER`) and is
not resolved at all.

A Reader holds each member it reads in memory, and a read can take a small
multiple of the members' bytes (their text, parsed structure and indexes), so
the memory one read needs grows with `maxMemberBytes` by a factor that
depends on the Reader. A host on a small device sets `maxMemberBytes` lower.
The same member result can be reached from more than one composing package
in one read: `members` is a shared graph, not a tree, and a host that walks
or serialises it keeps track of the members it has visited.

A refined quote (§7) is checked in time and memory roughly linear in the
covered text and the quote, however many times the quote occurs.

**One evidence budget per read.** The two evidence budgets cover the whole
read: the package and every member it reads spend from the same checks and
bytes, so members do not multiply them. The options keep their earlier names.
A Reader MUST normalise each evidence source once per package, not once per
check, and parse each WebVTT file's cues once per package too. It MUST NOT let
structure traversal, or any other step, depend on recursion depth or on how
many arguments one call can take: a long chain of relations, or a transcript
of many cues, must not exhaust the call stack.

**Nesting.** JSON and YAML frontmatter in a package or a sidecar are nested at
most 64 levels deep. A value's level is the number of arrays and objects
(in YAML, sequences and mappings) it lies inside, so the outermost object or
mapping is level 1, and a scalar may lie inside 64 of them. A text that
opens a 65th is malformed, with the code its kind of file already has for
text that does not parse (the limits table, above), and a Reader refuses it
without parsing deeper: the check MUST NOT itself depend on recursion depth.
This covers `moca.json`, every node's and reserved file's frontmatter, each
attestation file and the statement decoded from its payload, `moca-enc.json`,
and a sidecar's `index.json` and payload lines. The host's own input, such as
a trust root, is not package content, and a Reader may refuse it as it sees
fit.

A package's `structure.ttl` and each structure overlay the host supplies
(§10, "Layers") are nested at most 64 levels deep too: overlays go through the
same parser, so this limit is fixed for them as well, unlike other host input.
In Turtle, each blank-node property list (`[ ]`) or collection (`( )`) is one
level, so the outermost one is level 1 and a term may lie inside 64 of them. A
file that opens a 65th is refused with `O001`, and none of its structure is
read. For an overlay, the file is the overlay, as for its other problems. The
check follows Turtle's own rules for what is a bracket: one inside an IRI, a
string, a comment or a prefixed name (escaped characters included) does not
count. Like the others, it MUST NOT depend on recursion depth.

**Numbers too large.** A frontmatter number too large for a finite double,
however it is written (`1e400`, or a decimal, octal or hex integer of any
length), is read as `.inf` is ([package spec §5.1](moca-package-spec.md#51-an-okf-bundle)),
and reading it never fails. A number that is not finite may be a mapping key;
the node is still read.

**Structure work stays roughly linear.** Resolving a reading order
([package spec §4.10](moca-package-spec.md#410-reading-order)) and binding
members by composition ([package spec §5.6](moca-package-spec.md#56-structure))
MUST take work and memory roughly in proportion to the structure's triples
plus the members and nodes involved, not to their product. For example, a
Reader walks the ordered collection once, and finds a concept's ancestors
once, not once per node bound to it or per member of the list. A member
list that several collections name is walked once and shared, and what the
collections hold together is bounded (the limits table, above): the subjects
and the list members of a structure file never multiply into more work than
its triple limit allows.

**Text work stays roughly linear.** Finding the links in a node's body, and
normalising an evidence source (§7), MUST take work roughly in proportion to
the size of the text, whatever it holds: a line of unclosed brackets or
unclosed tags costs no more than any other line of its length.

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
  It MUST NOT fetch, resolve or open a URI in `apps`
  ([package spec §4.9](moca-package-spec.md#49-apps)): an app URI is a name.
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
programming errors, such as a missing argument. A `moca.json` that is valid
JSON but not an object fails its schema (`M002`), and nothing more of the
package is read. A member of the manifest with the wrong type is `M002` too,
and a Reader that reads on does so as if that member were absent.

## 6. Attestations

A Reader that verifies attestations MUST follow
[moca-attestations.md](moca-attestations.md), which is the home of these
rules. In summary:

- with no trust root, every attestation is **unverifiable**
  (`A003`), never valid;
- a key or identity is trusted only for the roles the trust root gives it;
- a key or identity with `ids` signs only the packages those ids cover: a
  valid signature from one that does not cover the package's `id` is reported
  (`A010`) and does not make the package `signed`;
- a Sigstore identity matches only when its issuer and its subject each equal
  the certificate's, character for character; never as a pattern;
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
  (`L001_IDENTITY_CONFLICT`). When both are issued copies of the same
  original (both results have `issuedCopy` with the same `originalDigest`),
  it reports `L002_ISSUED_COPY_DUPLICATE` (info) instead, and still keeps
  only the first.
  Two representations of a node share `node.ref`; when an application
  records a citation it SHOULD keep `node.locale` with it, and any
  de-duplication is by `node.ref`, `node.locale` and `span` together.
- `span` offsets are UTF-8 byte offsets into the file of the representation the
  record cites (`<name>.<tag>.md` for a translation).
- Every field is derived as follows, so every Reader writes the same record:

  | Field | Value |
  | --- | --- |
  | `node.locale` | The representation's tag; for the default representation, the node's `moca.language`, else the manifest's `language`, or absent when there is neither ([package spec §5.4](moca-package-spec.md#54-locales)). |
  | `node.digest` | `sha256:` and the SHA-256 of the representation file's bytes. |
  | `text` | When included, the representation file's UTF-8 text after the closing frontmatter delimiter, or the text at `span` for a chunk. |
  | `trust.status` | OKF `status` when it is `draft`, `stable` or `deprecated`; otherwise `stable`. A translation with no `status` key has its default representation's ([package spec §5.4](moca-package-spec.md#54-locales)). |
  | `trust.generated`, `trust.declaredVerified` | OKF `generated` and `verified`; an entry with no `by` is left out. `generated.model` is kept when it is a string. |
  | `terms` | Only in records from a search with a terms request (§15.4): `{ authority, ai, rating, rights }` for the record's node, where each `ai` field and `rights.export` is `{ value, decidedBy }` (§15.3) and `rating` is the node's effective rating. Absent otherwise. |
  | `trust.validFrom`, `trust.validUntil` | The node's effective window ([package spec §4.4](moca-package-spec.md#44-validity-window)), as written. |
  | `trust.contestedBy` | The node's `moca.contested_by`, as written, then `<id>@<version>` of each loaded package it conflicts with. |
  | `audience` | As in [§8](#8-default-retrieval-policy); `audienceInvalid` is `true` when the label is malformed. |
  | `profiles` | The manifest's profile URIs, in manifest order; absent when there are none. |
  | `package.datePublished` | The manifest's `datePublished`, as written, when the manifest passes its schema; absent otherwise ([package spec §4.12](moca-package-spec.md#412-publication-and-packaging-dates)). |
  | `node.datePublished` | The node's `moca.date_published`, as written, when it parses; absent otherwise. The package's date is never copied to it. |
  | `package.datePackaged` | The manifest's `datePackaged`, as written, when the manifest passes its schema; absent otherwise ([package spec §4.12](moca-package-spec.md#412-publication-and-packaging-dates)). |
  | `node.license` | The node's licence: the `rights.license` of the node's `terms.nodes` entry ([package spec §4.14](moca-package-spec.md#414-terms)), else the manifest's `license`; a value with a terms problem at its path is skipped. Absent when neither gives one. |
  | `node.copyright` | The node's copyright statement, as written: the `rights.copyright` of its `terms.nodes` entry, else `terms.rights.copyright`; a value with a terms problem at or under its path is skipped. Absent when neither gives one. |
  | `node.contributors` | The node's `moca.contributors`, as written, less any image that failed its check, when they match the node schema; absent otherwise ([package spec §4.13](moca-package-spec.md#413-credits)). The package's contributors are never copied to it. |
  | `node.media` | The node's valid media descriptions ([package spec §5.7](moca-package-spec.md#57-media)), in order, each `{ source, resource, type, duration?, digest?, transcript?, alternateOf?, sync? }`, where `resource` is the source's `resource` as written. A valid alternate carries `alternateOf` and its `sync`, which is `[{ "at": 0, "offset": 0 }]` when the node gave none. Absent when there are none. |
  | `node.tracks` | The node's timed text tracks that stand ([package spec §5.7](moca-package-spec.md#57-media)), in order, each `{ media, source, language, kind, label? }`, with `kind` `subtitles` when the node gave none. Absent when there are none. |

  A consumer of citation records (a store, an application) SHOULD ignore
  properties it does not know: later versions add fields. An AG-UI client
  MUST ([AG-UI citations §4](moca-ag-ui-citations.md#4-client-rules)).
- `declaredVerified` copies OKF `verified`; `attestedReviews` lists only reviews
  that verified against the trust root and match the current file, the latest
  from each signer, each with `packageVerified` (whether the package is
  signed). In an issued copy, it also lists reviews of the publisher's bytes
  of a changed file, with `fileChanged: true`; they never count toward
  `reviewStatus`
  ([attestations §7.1](moca-attestations.md#71-issued-copies-two-passes)). `reviewStatus` is `approved`, `disputed`, `unverified` or `none`
  ([attestations §4](moca-attestations.md#4-review-attestations)). An
  application SHOULD NOT present a declared verification as an attested one,
  or an `unverified` or `disputed` review as an approval.
- `stale` is true when now ≥ `stale_after`. `inForce` is false outside the
  validity window ([package spec §4.4](moca-package-spec.md#44-validity-window)).
  The host supplies the clock.
- **Issued copies.** `package.issuedCopy` is the result's `issuedCopy`
  ([attestations §7.1](moca-attestations.md#71-issued-copies-two-passes)),
  absent for any other package. `node.issuedChange` is `true` when the
  representation file is in the issued copy's `changedFiles`, and absent
  otherwise. `package.digest` stays the copy's own digest. A host that shares
  citations outside the licensee's own use SHOULD use
  `issuedCopy.originalDigest`, which is the same for every copy and
  identifies no one.
- `superseded` and `contested` reflect the relations among the packages the
  Reader has loaded, and the node's `moca.contested_by`
  ([package spec §7.2](moca-package-spec.md#72-relations)).
- `evidence[].matched` is `true` when the Reader checked the selector against
  the cited file inside the package and it matched, and `false` when it checked
  and it did not match (`C011`). It is absent when the Reader did not check:
  the source is outside the package (and is not media with a `transcript`,
  for a time range), its file type is not in the table below, or the Reader
  does not check that kind of selector. It says the quote is in the
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
  means 0, as Media Fragments 1.0 allows) is checked against a WebVTT file in
  the package: the cited source, when it is one, or else the `transcript` of
  the cited source's media description
  ([package spec §5.7](moca-package-spec.md#57-media)), or, for an alternate
  with no `transcript` of its own, the range mapped to its reference and
  checked against the reference's `transcript` (a range that does not map
  does not match). It matches when both hold:
  1. the range overlaps at least one cue; and
  2. the range lies within the media: its end is at or before the bound. The
     bound is the latest end time of any cue, or the declared `duration` when
     that is later. The duration is that of the media description being
     checked, or, when the evidence cites the WebVTT file itself, of the
     node's first media description whose `transcript` names that source. A range with
     no end runs to the end of the media, so it lies within it.

  Any other time range is not checked. Carry the captions or transcript of
  audio or video in the package, and name it as the media's `transcript`, to
  make its citations checkable.
- **A time range refined by a quote.** A media time range MAY carry a
  `TextQuoteSelector` as its `refinedBy` (W3C Web Annotation): the words
  spoken in that range. The Reader checks the range as above, against the
  same WebVTT file and through an alternate's reference in the same way. It
  then checks the quote against the range's **covered text**: the payloads of
  the cues the range overlaps, in file order, normalised as for any WebVTT
  source and joined with LF. Before comparing, every run of white space (here
  only tab, line feed, form feed, carriage return and space, U+0009, U+000A,
  U+000C, U+000D and U+0020) becomes one space, in the covered text and in the quote's
  `exact`, `prefix` and `suffix`; this applies to refined quotes only, and
  every other quote keeps exact matching. No case folding is applied.
  - Both match: `matched` is `true`, and the entry's `located` is
    `{ start, end }`, in seconds on the cited source's timeline: from the
    earliest start to the latest end of the cues the quote touches. A cue
    is touched when a character of `exact` other than white space comes
    from it. If the
    quote occurs more than once in the covered text, the shortest such span
    is used, and the earliest if two are equally short. On an alternate,
    `located` is moved back to the alternate's timeline by the offset of the
    stretch the range maps through.
  - The range does not match: `matched` is `false` (`C011`), the quote is
    not checked, and `located` is absent.
  - The range matches but the quote is not in its covered text: `matched` is
    `false` (`C011`), even if the words occur elsewhere in the transcript,
    and `located` is absent.
  - The range is not checked (hosted media with no transcript): neither is
    the quote, and `matched` and `located` are absent.

  A `refinedBy` of any other type is not checked: the range is checked
  alone, and `located` is absent. A `TextQuoteSelector` with an empty or
  missing `exact` does not match, as for any quote, and neither does a
  refined one whose `exact` is only white space.
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
([package spec §5.4](moca-package-spec.md#54-locales)). A translation's
`status`, validity window and `concepts` are taken the same way, so the
policy above retires a translation with its original.

Audience is a label a host filters on, not access control
([package spec §13.3](moca-package-spec.md#133-labels-not-locks)):
fail-closed filtering protects against a forgotten label, not against someone
who has the package file.

This policy applies to every search backend, including a host's own vector
store, and is applied after the backend returns (§9.2).

## 9. Search

A Reader offers one search operation. It has the same signature in every
language, and the default retrieval policy is applied inside it:

```text
search(query, { limit, includeAll, locale, localeMode, editions, concepts, scope, upTo }) -> citation records, each with a score
```

`locale` is a language tag or a priority list of them, most preferred first
([package spec §5.4](moca-package-spec.md#54-locales)); an empty list is no
locale. A search keeps at most the first 16 entries and drops an entry longer
than 35 characters, and reports `S014_LOCALE_TRIMMED` (info) when it dropped
any. A list of languages says something about a person, so a Reader never
records it in a finding, a log or a trace: it records how many entries there
were and which one matched.

`localeMode` says what the locale does, and has no effect without one:

- `"choose"` (the default): for each node, the representation the locale
  selects (§9.2 step 5.4). Nothing is left out for its language, and nothing
  is reordered: a node with no file in the language passes in its default
  language.
- `"only"`: as `"choose"`, then only records whose language matches an entry
  of the locale list pass, so a node with no file in the language drops out.
- `"first"`: as `"choose"`, then records are ordered by the first entry of the
  locale list their language matches, then the next entry, then records that
  match none; within each group they keep the order they would otherwise have
  (by score, or as an egress hook ordered them). This is the one place a filter
  changes the order of results.

A record's language is its `node.locale`; it **matches** a locale entry when
package spec §5.4's lookup for that entry, over that one tag, selects it (so
`fr` matches `fr-CA`, and `pt-BR` matches `pt-AO`). With no locale, every
representation and every edition is searched, in score order.

`editions` is `"choose"` (the default) or `"all"`. With a locale and
`"choose"`, a composite package's edition groups keep one edition per slot
([package spec §7.4](moca-package-spec.md#74-edition-groups)); `"all"` keeps
every edition. Without a locale it has no effect.

`concepts` keeps records bound to at least one of the given concept IRIs, by
the node's own `moca.concepts` or by composition
([package spec §5.6](moca-package-spec.md#56-structure));
`scope` keeps records bound to the concept or any of its descendants by
hierarchy or parts (§10). Both refer to the package structure
([package spec §5.6](moca-package-spec.md#56-structure)).

`upTo` is the IRI of a concept on a package's reading order
([package spec §4.10](moca-package-spec.md#410-reading-order)): a member, or
a descendant of a member by `skos:narrower` or `dcterms:hasPart`. It leaves
out material that comes after that point:

- **Where the point is.** `upTo` takes its position as any concept does: the
  first member that is it or contains it. So a descendant limits exactly as
  that member would.
- **Which packages.** `upTo` limits the packages whose reading order places
  it, and their resolved members at any depth
  ([package spec §7.1](moca-package-spec.md#71-members)). Records from other
  loaded packages, such as reference packages searched beside a course, are
  not limited by it.
- **Members.** A record from a member of a limited package takes its
  positions on the composing package's reading order from every concept it is
  bound to there: its node's own `moca.concepts`, and the concepts it is bound
  to by composition, such as the member's package `id` listed in the order
  ([package spec §5.6](moca-package-spec.md#56-structure)). A member's own
  reading order limits only for points that it places itself. A record that
  more than one limit applies to must pass each of them.
- **Who may limit a member.** A composing package's reading order limits a
  member's records only when the composing package's signers speak for that
  member: when the `ids` of its valid package attestations' signers cover the
  member's `id`, as for relations
  ([package spec §7.2](moca-package-spec.md#72-relations), `R004`). A host
  that loads only its own packages MAY allow unsigned composing packages to
  limit their members, with the same option that allows unsigned relations.
  So a package loaded beside a member can never hide the member's records
  from an `upTo` search unless it speaks for that member. A composing package
  that the default retrieval policy leaves out at package level (out of force,
  or superseded by a loaded package) limits nothing
  ([package spec §7.4](moca-package-spec.md#74-edition-groups)).
- **Unresolved.** If no loaded package's reading order places `upTo`, it
  limits nothing, and the Reader reports `S008_UPTO_UNRESOLVED` (warning)
  for that search, so it never fails silently.
- **What passes.** In a limited package, a record passes when every
  position it has is at or before the position of `upTo`. The point itself is
  included.
- **Records off the reading order.** A record with no position is not
  limited: a glossary, an introduction or reference
  pages are useful at every point and are not ahead of anything. A caller
  that wants them out narrows the search with `scope` or `concepts`.
- `upTo` combines with `concepts` and `scope`: a record must pass each one
  the caller named. It applies to search only; the structure operations
  (§10) report the whole structure.
- `upTo` is a convenience, not access control. A person with the package
  file can read all of it.

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
   4. when the caller named a locale, keep only the representation that
      package spec §5.4's lookup selects for it, for each node, **among the
      node's representations that pass steps 5.1 to 5.3**. So a retired or
      out-of-audience translation is treated as a missing one: a reader in
      that language gets the next match, or the default representation. When
      the default representation is not a candidate either, the fallback is
      the candidate with the lowest tag (compared case-insensitively, by code
      point). With the host's opt-in to excluded content, the representations
      the default retrieval policy excludes are candidates too. Then, unless
      the caller asked for `editions: "all"`, apply each loaded composite package's
      edition groups ([package spec §7.4](moca-package-spec.md#74-edition-groups)):
      for each slot whose composite is in force and not superseded, and whose
      signers cover the record's package `id` (or with the host's option that
      allows unsigned relations), a record from one or more of the slot's
      editions, or their members at any depth, passes only when the edition
      the slot chooses for the locale, among the editions this search can
      return, is one of them, or when another such slot leaves out the chosen
      edition (`S013`). Records from no slot's editions are not affected.
      Then, with `localeMode: "only"`, keep only records whose language
      matches an entry of the locale list (§9);
   5. when the caller named concepts or a scope, keep only records bound to
      them. Concepts and scope set by an ingress hook narrow the search
      ("Ingress narrowing", below) but never bind the gate: the gate follows
      the caller;
   6. when the caller named `upTo`, keep only records that pass it (§9). An
      ingress hook can never set, change or remove `upTo`;
   7. when the host made a terms request, remove the records the terms gate
      removes (§15.4). It runs after the steps above, so what it counts
      (`U004`) are records that would otherwise be returned;
   8. keep one record per node representation and span: two candidates with
      the same `node.ref`, `node.locale` and `span.start` are one result, the
      first;
   9. return at most `limit` records. `limit` defaults to 5.

Hooks are host code, supplied when the host creates the search. A package can
never supply or select one.

**Language first.** With `localeMode: "first"`, the search returns the first
`limit` records, in the order §9 gives, among all the records that pass the
gate. So a Reader asks the backend again until `limit` records of the first
group pass, or the backend has no more. When the host set no bound
(below), a Reader bounds the candidates a `"first"` search examines at 1,000,
or `limit` when that is larger, and reports `S010_SEARCH_TRUNCATED` when it
stops there, so a request for a rare language never reads a store to its end.

**Filters come before the limit.** Steps 5.1 to 5.8 decide which records can
be results; step 5.9 only counts them. A search MUST return the best-scored
records among all the records that match the query and pass the gate: the same
records, in the same order, as ranking every matching record, applying the
gate, and keeping the first `limit`. So when at least `limit` matching records
pass the gate, the search returns `limit` records, however far down the
unfiltered ranking they are. A Reader MUST NOT apply the gate to a fixed number
of top candidates and return what is left.

A Reader meets this in either of two ways, or both: it passes the filters to a
backend that applies them before it ranks (`filterPushdown`, §9.5), or it asks
the backend again, for more hits each time, until `limit` records pass the
gate or the backend has no more. Filters remove records; they never change a
record's score, which is the backend's score for the query over all the loaded
packages. When an egress hook is set, it runs again on the whole candidate list
each time the Reader fetches more.

**Ingress narrowing.** When an ingress hook sets concepts or a scope, the
search returns only records bound to them (by the node's own concepts or by
composition, [package spec §5.6](moca-package-spec.md#56-structure)), as well
as passing the gate. A Reader passes them to a backend with `filterPushdown`
when it can (§9.5). When it can't (the backend has no pushdown, or a loaded
package binds members by composition) it applies them itself to the
resolved hits: after the backend, before the egress hook and the gate, on every
round of asking again, within any bound the host set. Records an egress hook
adds are not narrowed by them. "Filters come before the limit" holds for them
too: the search returns the best records that pass both.

A host MAY bound the work one search does, for example the number of
candidates it examines. When a bound stops a search before `limit` records
pass the gate, the Reader MUST report `S010_SEARCH_TRUNCATED` (warning) for
that search, so a short result is never silent. The reference Readers set no
bound by default.

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
([Reader interface §5.3](moca-reader-interface.md#53-embedder)): only the
content that passes the ingest's terms request, when the host gives one
(§9.4). The embedder
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

**Ingest with a terms request.** Embedding sends content to a model (§15.4),
so ingest takes the host's terms request: `{ destination, conditions }`, the
`ai` part of a request with the use `embed`
([Reader interface §5.2](moca-reader-interface.md#52-backends)), together with
the host's terms limits. The Reader resolves each unit's terms (§15.3, with
every level a search uses) and applies the gate's `ai` test. A unit it
removes MUST NOT be sent to the embedder or written to the store. The Reader
reports `U004_TERMS_EXCLUDED` for the ingest when it removes any, with the
counts of §15.4. Without a request, ingest takes every unit, as a search
without one removes nothing. The destination is the embedder's: the host
names where its embedder runs (`device`, `host` or `provider`). The store is
the host's own storage, as its other storage is, and is not a destination. A
binding a model calls always passes a request, with `provider` and no
conditions when its host configured none. A sidecar is built by the packager
or the person (the reference tool, `moca-embed`, runs its model on the
person's machine); binding one is reading, and its records are gated when
they are served.

So a store search takes the host's **package states**: for each loaded
package, its digest, `id`, `version`, default language, relations, relation
scopes (§7.2 of the package spec), signers, current reviews, node-level
`moca.contested_by`, its `issuedCopy`, and, when `readingOrder` resolves,
its members in order and the position of each concept on it, so a store
search applies `upTo` as a library search does. For each node with more than
one file, it carries the tag of each file, the default file marked, and what
steps 5.2 and 5.3 of the gate read for each: its `status`, the validity window
it ends up with, and its audience label. So a store search keeps one
representation per node by
[package spec §5.4](moca-package-spec.md#54-locales)'s lookup among the files
that pass steps 5.1 to 5.3, with the same fallbacks, exactly as a library
search does (§9.2 step 5.4): a stored record whose file the lookup does not
select is not returned, a node with no file in the requested languages is
returned in its default language, and a retired translation falls back as a
missing one does.
It also carries the nodes whose default file sets
`moca.language`, each with that language, so a stored record is matched to
the right file (package spec §5.3). For a package with members,
the state also carries every member that resolved, matched its pin and is
valid, at any depth and once each: its digest and `id`, whether the package's
structure declares that `id` as a concept, the paths of its nodes whose
identifiers the structure declares, and the members that compose it. With
them come, for each concept on the way up from those declared identifiers,
its broader concepts and the concepts it is a part of in the package's
structure ([package spec §5.6](moca-package-spec.md#56-structure)); each
member's `language` and `locales`; and the composing package's edition
groups: its own `language`, and for each slot, its IRI, its editions' ids and
its default edition, when it names one
([package spec §7.4](moca-package-spec.md#74-edition-groups)). Every state
also carries the package's own `validFrom` and `validUntil`, so a store search
knows whether a composite is in force, and a summary of what its files can
return: each distinct combination, over all its files, of `status`, the window
a file ends up with and its audience label (with the node's path when the
package's terms have node-level entries), so a slot chooses only among
editions the search can return. So a
store search applies `concepts`, `scope`, `upTo` and edition groups to
members' records as a library search does, and the state grows with the structure and the members,
not with their product (§3). A Reader produces a package's state from the package
result (`packageState`); it is small, plain JSON that a host keeps beside
its store. At query time the Reader resolves store hits from their records and
MUST recompute from the states and the clock: `stale` and `inForce`;
`superseded`, `supersededBy`, `contested` and `contestedBy` from the relations
among the loaded packages; `package.signed`, `signers` and `issuedCopy`; and
`attestedReviews` and `reviewStatus`; and, for a terms request, each node's
resolved terms and the package's authority (§15), from the `terms` the state
carries. It keeps only records whose package is
among the states. The host therefore never needs every package in memory to
search its store, and a package superseded, or a key removed from the trust
root, after ingest is reflected at once. Records left behind by an older
version of a package are never returned, because its state is not supplied.

**A state the search cannot get.** A host MAY supply states on demand: the
search asks only for the states its records depend on. A record depends on
its own package's state, the states of the loaded packages that compose it,
and the states of the loaded packages whose relations act on it. A store
search that cannot get one of those states, for a package the host has
loaded, MUST NOT return the record as if that package did not limit it
(`upTo`, composition, composite terms, relations): it withholds the record
and reports `S011_STATE_MISSING` (warning). A Reader that cannot tell which
records a missing state affects withholds every record. Relation effects
(`superseded`, `supersededBy`, `contested` and `contestedBy`) MUST come from
the same states as `package.signed` and `signers`: a Reader or host that
caches them (an index of the store) checks the cache against the states it
loads, and corrects or rebuilds it where they differ, never using it
silently. When the trust root changes, the host MUST recompute each package's
state, and what it derived from them, before the next search.

**Structure in a store search.** A package state carries composition, not the
concept graph or its labels. A host MAY give a store search a **structure
source**: packages it has read itself (for a show, its show and season
packages), whose merged structure the hooks see (`ctx.structure`) and through
which `scope` reaches descendants. A structure source adds no records and is
not loaded for the gate: records still come only from the packages whose
states the host supplied. Without one, hooks in a store search see no
structure.

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
| `locale` | The caller's locales, if any, as a priority list. |
| `everyRepresentation` | `true` when the caller named a locale and the Reader applies it in the gate instead of passing `locale` (below). |
| `concepts` | The concepts to search: the caller's, a scope and its descendants, or those an ingress hook chose. |

Pushdown is an optimisation. The gate (§9.2) still runs on every candidate.
Whether or not a backend applies the filters, the result is the same (§9.2,
"Filters come before the limit").
A backend that applies `locale` cannot see which representations the gate's
steps 5.1 to 5.3 remove, so when a loaded node has a representation they
remove and another they keep, the Reader passes no `locale` filter and applies
the locale itself in the gate (§9.2 step 5.4). It passes `everyRepresentation`
instead: a backend MUST then return every representation of a node that
matches the query and passes the other filters, not only its best-scoring
one, which may be the file the gate removes. A backend keeps one
representation per node only when it applied `locale` itself, or when the
caller named no locale.
A record bound to a concept by composition
([package spec §5.6](moca-package-spec.md#56-structure)) does not carry that
concept itself, so when any loaded package binds members by composition, the
Reader passes no `concepts` filter and applies the concepts itself (§9.2,
"Ingress narrowing") and in the gate.
`upTo` adds no filter, because records off the reading order and from other
packages still pass it; the gate applies it.
Edition groups add no filter either; the gate applies them (§9.2 step 5.4).
A terms request (§15.4) adds the nodes it removes to `exclude`, worked out
from the loaded packages or their states.

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

`rank_b` is the hit's 1-based position in backend b's ranking of the loaded
packages before any filter, so that filters never change a score (§9.2); a hit
a backend did not return adds nothing from it. Filters pushed down to the two
backends only decide which fused hits pass. `k` defaults to 60 and each weight to 1.
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
| `concept(iri)` | The concept's preferred label (no language tag, then `en`, then the first language tag in order, §2 of the package spec), labels, alternative labels (`altLabels`: by language tag, each a list in the order read, with duplicates dropped; empty when there are none), definition, `deprecated`, what it replaces and what replaces it, and its layer; or nothing when no layer declares it. |
| `requires(iri, { transitive })` | The concepts `iri` requires. Direct: ordered by IRI. Transitive: every concept reachable through `requires`, each after the concepts it requires (depth first, ties by IRI). |
| `requiredBy(iri)` | The concepts that require `iri`, ordered by IRI. |
| `parts(iri)` | The direct parts of `iri`, ordered by IRI. |
| `narrower(iri, { transitive })` | Narrower concepts; transitively, breadth first, each level ordered by IRI. |
| `broader(iri)`, `related(iri)` | Direct broader concepts; related concepts in either direction. Ordered by IRI. |
| `sequence(iri)` | The members of the ordered collection `iri`, in list order; nothing if `iri` is not an ordered collection. |
| `editions(iri)` | The editions of the slot `iri` ([package spec §7.4](moca-package-spec.md#74-edition-groups)), each `{ id, version, language, title, default }` (`language` and `title` absent when the edition's manifest has none; `default` true only for the slot's default edition), ordered by `id`: only editions that resolved, matched their pin and are valid. Empty when `iri` is no slot of a loaded package. A slot is declared only by a composite whose `id` its IRI starts with; of several loaded versions of that composite, the one package spec §7.4 ("Display") names answers. |
| `chooseEdition(iri, locale)` | The `id` of the edition of the slot `iri` that a search with that locale and no audience set keeps (package spec §7.4, "Choosing"): among the editions that resolved, matched their pin and are valid, and are loaded with a record that passes the default retrieval policy. Nothing when `iri` is no slot or has no edition that can be chosen. |
| `nodes(iri, { include })` | Citation records of the nodes bound to `iri`, by their own `moca.concepts` or by composition ([package spec §5.6](moca-package-spec.md#56-structure)), and, with `include` of `narrower`, `parts` or `both`, to its descendants, with the default retrieval policy applied, ordered by `node.ref`. |

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

**Under a terms request.** Labels and definitions are package-supplied text
(§12). A host that hands structure answers to a model asks for them with its
terms request ([Reader interface §6](moca-reader-interface.md#6-structure)).
The operations then run over the merged structure of the loaded packages that
are not closed for the request (§15.4), and the overlays. A label, definition
or relation that only a closed package states is absent, and a concept only a
closed package declares is not declared. These are the same operations over a
smaller library, so every Reader still answers them identically. `nodes`
returns records only from those packages; a hand-off to a model applies the
terms gate to each of them, as to every record. Without a terms request, or
with one that has no `ai` part, the structure is that of every loaded package.

## 11. Diagnostics

A Reader MUST report findings as structured values with `code`, `severity`
(`error`, `warning` or `info`), `message`, and, where it applies, `file`
(package-relative) and `line` (1-based). `U004` also carries its counts
(§15.4). Codes are the contract; message text
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
| `M001_MANIFEST_INVALID_JSON` | error | moca.json is not valid UTF-8 JSON, or is nested more than 64 levels deep (§3). |
| `M002_MANIFEST_SCHEMA` | error | moca.json does not validate against the manifest schema. |
| `M003_NO_CONTENT` | error | The package has neither a content node nor a member. |
| `M004_UNKNOWN_KEY` | info | A top-level manifest key is neither defined by the spec nor a vendor x-<vendor>-<key> key. |
| `M005_DUPLICATE_MEMBER` | error | The same member id appears more than once. |
| `M006_VALIDITY_WINDOW_INVALID` | warning | validUntil is not later than validFrom. |
| `M007_UNREGISTERED_URN` | info | The package id uses a URN namespace that is not registered with IANA. |
| `M008_DIGEST_V1_PACKAGE` | info | The package was written for a `mocaVersion` before 0.4; digests, pins and attestations made then will not match `moca-digest-v2` ([package spec §14](moca-package-spec.md#14-versioning-of-this-specification)). |
| `M009_MOCA_VERSION_NEWER` | warning | The package was written for a newer `mocaVersion` than this Reader implements; it is read under the newest rules this Reader implements ([package spec §14](moca-package-spec.md#14-versioning-of-this-specification)). |
| `M010_IMAGE_INVALID` | warning | A manifest image, or the image of a credit ([package spec §4.13](moca-package-spec.md#413-credits)), is missing, over `maxImageBytes`, or does not start with the signature of its `type`. It is left out of the result ([package spec §4.6](moca-package-spec.md#46-images)). |
| `M011_TRANSLATION_LOCALE_UNDECLARED` | error | A key of `translations` is not a tag in `locales` ([package spec §4.7](moca-package-spec.md#47-translations)). |
| `M012_TAG_DUPLICATE` | warning | Two tags in one list are equal, compared case-insensitively. The repeat is dropped ([package spec §4.8](moca-package-spec.md#48-tags)). |
| `M013_ALT_IMAGE_UNKNOWN` | warning | A translated `alt` text names no image in `images`. It is dropped. |
| `M014_READING_ORDER_UNRESOLVED` | warning | `readingOrder` does not name a `skos:OrderedCollection` with a `skos:memberList` in the package's own `structure.ttl`. It is ignored ([package spec §4.10](moca-package-spec.md#410-reading-order)). |
| `C001_FRONTMATTER_MISSING` | error | A concept document has no YAML frontmatter (OKF MUST). |
| `C002_FRONTMATTER_INVALID` | error | Frontmatter is not parseable YAML, is not a mapping, repeats a key, uses an alias, is nested more than 64 levels deep (§3), or lists two sources with one `id`. |
| `C003_TYPE_MISSING` | error | Frontmatter has no non-empty type (OKF MUST). |
| `C004_RESERVED_FILE_INVALID` | error | index.md or log.md breaks the OKF reserved-file rules. |
| `C005_FIELD_INVALID` | warning | A frontmatter field does not match the node schema. |
| `C006_EVIDENCE_SOURCE_UNKNOWN` | warning | moca.evidence or moca.media names a source id that sources[] does not declare. |
| `C007_LINK_UNRESOLVED` | warning | An internal Markdown link does not resolve. |
| `C008_UNSAFE_PATH` | error | A package-relative path is absolute or escapes the package root. |
| `C009_LOCALE_ORPHAN` | warning | A locale representation has no default-language file. |
| `C010_VALIDITY_WINDOW_INVALID` | warning | moca.valid_until is not later than moca.valid_from. |
| `C011_EVIDENCE_SELECTOR_UNMATCHED` | warning | An evidence selector does not match the text source file it cites inside the package. |
| `C012_TRANSLATION_SAME_TAG` | warning | A translation is tagged with its node's own language; it is ignored, and the default file answers for that language ([package spec §5.4](moca-package-spec.md#54-locales)). |
| `E001_ENCRYPTED_NO_KEY` | error | An envelope was not opened: there is no key provider, it returned no key or a kind of key no stanza uses, or the Reader does not implement `encryption` ([encrypted packages §5.1](moca-encrypted-package.md#51-the-key-provider)). |
| `E002_DECRYPTION_FAILED` | error | A key was supplied for an envelope, but it is not a valid key of its kind, unwrapping failed, or the header MAC failed. |
| `E003_PAYLOAD_CORRUPT` | error | An envelope's encrypted payload failed authentication or was truncated. |
| `E004_OUTLINE_MISMATCH` | error | An envelope's outline differs from the decrypted manifest, structure or cover. |
| `E005_ENVELOPE_INVALID` | error | An envelope has a missing, repeated or unexpected entry, an encrypted entry that is not stored, a cover copy over `maxImageBytes`, or an invalid `moca-enc.json`, or a Zip has both `moca.json` and `moca-enc.json` at its root. |
| `E006_AGE_HEADER_INVALID` | error | An envelope's age header is malformed or unsupported, over 64 KiB, breaks the scrypt rules or the work-factor limit, has no full payload nonce, or has a low-order X25519 share. |
| `A001_ATTESTATION_MALFORMED` | error | An attestation file is not a parseable envelope and statement, is over a limit (its size, or its signature entries), or the package has more attestation files than the limit (§3). |
| `A002_ATTESTATION_INVALID` | error | An attestation failed verification or does not match the package. |
| `A003_ATTESTATION_UNVERIFIABLE` | warning | An attestation could not be checked ([attestations §7](moca-attestations.md#7-verifying-an-attestation) says when). |
| `A004_ATTESTATION_INDETERMINATE` | warning | Online verification was requested but could not complete. |
| `A006_REVIEW_OUTDATED` | warning | A review attestation covers a file whose bytes have since changed or been removed. |
| `A007_REVIEW_DATE_FUTURE` | warning | A review is dated later than the host clock, so it does not count ([attestations §4](moca-attestations.md#4-review-attestations)). |
| `A008_PACKAGE_DIGEST_MISMATCH` | error | A package attestation names this package's `id` and `version` with a different digest: the content changed after it was signed ([attestations §3](moca-attestations.md#3-package-attestations)). |
| `A009_SIGNATURE_REQUIRED` | error | The host requires a valid package attestation (`requireSignature`) and the package has none. This one makes the package invalid. |
| `A010_SIGNER_NOT_FOR_PACKAGE` | error | A package attestation's signature verifies and its statement matches, but the signer's `ids` in the trust root do not cover this package's `id` ([attestations §6](moca-attestations.md#6-trust-roots)). The attestation does not count, so it does not make the package `signed`. |
| `A011_SIGNER_SCOPE_WIDE` | warning | A signer of this package has an `ids` entry in the trust root that names no host or path, such as `https://`, so it covers every package under that scheme ([attestations §6](moca-attestations.md#6-trust-roots)). |
| `R001_MEMBER_UNRESOLVED` | warning | A member could not be resolved by the host resolver. |
| `R002_MEMBER_DIGEST_MISMATCH` | error | A resolved member does not match its pinned digest, or, for an issued copy that verified, its original digest ([package spec §7.1](moca-package-spec.md#71-members)). |
| `R003_MEMBER_CYCLE` | error | Members form a cycle. |
| `R004_RELATION_UNAUTHORISED` | info | A `supersedes` or `conflictsWith` relation is not authorised by a signer of the package, so it has no effect ([package spec §7.2](moca-package-spec.md#72-relations)). |
| `R005_RELATION_TYPE_UNKNOWN` | info | A relation's type is not a core type (`supersedes`, `amends`, `conflictsWith`, `crossReferences`, `isPartOf`, `translationOf`, `editionOf`), and no profile the package declares defines it. It is preserved and has no effect ([package spec §7.2](moca-package-spec.md#72-relations)). |
| `L001_IDENTITY_CONFLICT` | error | A library was given a second package with the same `id` and `version` but a different digest; the second is refused (§7). Reported by the library, not the package. |
| `L002_ISSUED_COPY_DUPLICATE` | info | A library was given a second issued copy of the same original (§7): the same `id` and `version`, another digest, and the same `issuedCopy.originalDigest`. The second is not loaded. Reported by the library. |
| `F001_PROFILE_UNRECOGNISED` | info | A declared profile is not recognised by this Reader. |
| `O001_ONTOLOGY_UNPARSEABLE` | warning | `structure.ttl` or a host overlay is over the size or triple limit (§3), is nested more than 64 levels deep, or is not parseable Turtle (§3). |
| `O002_CONCEPT_UNDECLARED` | warning | A relation, ordered collection or node binding uses a concept that is not declared as a `skos:Concept`. |
| `O003_REMOTE_REFERENCE` | warning | `structure.ttl` or a node binding relies on something a Reader would have to fetch or resolve: `owl:imports`, or an IRI that is not absolute. |
| `O005_STRUCTURE_CYCLE` | warning | `requires`, `broader` or `hasPart` forms a cycle ([package spec §5.6](moca-package-spec.md#56-structure)). |
| `O006_EDITION_GROUP_INVALID` | warning | A `schema:workExample` names no member of the composite package, or a slot's IRI is not in the composite's own namespace, or a `moca:defaultEdition` names no edition of its slot, or a slot names two default editions, or a predicate is a near miss of these terms; the statement is ignored ([package spec §7.4](moca-package-spec.md#74-edition-groups)). |
| `O007_EDITION_NOT_COVERED` | info | A slot lists an edition that no signer of its composite covers, so the slot groups it and hides none of its records ([package spec §7.4](moca-package-spec.md#74-edition-groups)). |
| `S001_SIDECAR_INVALID` | error | index.json does not validate against the sidecar schema. |
| `S002_SIDECAR_TARGET_MISMATCH` | error | The sidecar is bound to a different package id or version. |
| `S003_SIDECAR_STALE` | warning | The sidecar digest does not match the package; the sidecar is ignored. |
| `S004_SIDECAR_ITEM_INVALID` | error | A payload item breaks the addressing rules. |
| `S005_SIDECAR_FORMAT_UNKNOWN` | info | The payload format is not recognised; the sidecar is ignored. |
| `S006_MODEL_MISMATCH` | warning | The host's embedder does not match the index's model; dense search is refused. |
| `S007_NO_VECTORS` | warning | A loaded package has no vectors a dense backend can search; that package is not searched. |
| `S008_UPTO_UNRESOLVED` | warning | A search's `upTo` is on no loaded package's reading order, neither a member nor a descendant of one. It limits nothing (§9). |
| `S009_SIDECAR_ITEMS_REPLACED` | info | A sidecar built from the publisher's package is bound to an issued copy, and the items of the files the issuer changed were replaced by each file's whole body, without a vector ([sidecar spec §5](moca-sidecar-index-spec.md#5-binding-and-staleness)). |
| `S010_SEARCH_TRUNCATED` | warning | A search stopped at a bound the host set before `limit` records passed the gate; better-matching records that pass may exist (§9.2). |
| `S011_STATE_MISSING` | warning | A store search withheld records because a package state each depends on (its own package's, a composing package's, or one whose relations act on it) was asked for and not given (§9.4). |
| `S012_EDITION_SLOT_EMPTY` | info | An edition group left out records for its chosen edition, and the search returned nothing from that edition ([package spec §7.4](moca-package-spec.md#74-edition-groups)). |
| `S013_EDITION_SLOTS_DISAGREE` | warning | Two edition groups that may leave out records chose different editions, so one of them left nothing out ([package spec §7.4](moca-package-spec.md#74-edition-groups)). |
| `S014_LOCALE_TRIMMED` | info | A search's locale list had more than 16 entries, or entries longer than 35 characters; they were dropped ([package spec §5.4](moca-package-spec.md#54-locales)). The finding gives the count, never the entries. |
| `U001_TERMS_INVALID` | warning | A field of `terms` is malformed ([package spec §4.14](moca-package-spec.md#414-terms)). The package stays valid; the field counts as its strictest value when terms are applied (§15). |
| `U002_TERMS_LOOSENED` | warning | A `terms.nodes` entry, or a composing package, is looser than the package for a permission; the stricter value stands (§15.3). |
| `U003_TERMS_UNKNOWN_VALUE` | warning | A `terms` field has a value this version does not know, such as one from a later release. It is exposed, and counts as its strictest value when terms are applied (§15). |
| `U004_TERMS_EXCLUDED` | info | A search's or an ingest's terms request removed records; the finding counts them by reason, and counts those from packages hidden for the request (§15.4). |

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
- MUST NOT pass a package's `terms` to a model as instructions, and, when it
  is the hand-off to a model, MUST apply the terms gate (§15.4) to everything
  it hands on: records, structure labels and definitions, text it sends for
  embedding or indexing, and what it says about packages;
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

## 15. Creators' terms

A package's `terms` ([package spec §4.14](moca-package-spec.md#414-terms))
are labels, not locks. A Reader exposes them exactly, works out who stated
them, and resolves them only when the host asks. It never fetches anything
because of them, and never lets them change how it reads a package.

### 15.1 Exposing terms

A Reader MUST expose, in the package result
([Reader interface §4](moca-reader-interface.md#4-reading)):

- `terms.declared`: the manifest's `terms`, exactly as written, when the
  manifest passes its schema; absent when the manifest has none;
- `terms.problems`: the `U001` and `U003` findings for it, each with the path
  of the field (for example `ai.allowed.provider`);
- `terms.authority`: `packager` or `unverified` (§15.2).

It MUST NOT fill in defaults: absent fields stay absent.

### 15.2 Authority

The authority is worked out from the package's signatures, never from fields
the signer writes:

| Authority | When |
| --- | --- |
| `packager` | A package attestation verifies under the host's trust root. |
| `unverified` | No package attestation verifies. |

A signature shows who signed the package, not who owns the work: a package
whose `rights.rightsHolder` names a channel has the authority `packager`
like any other signed package. Neither authority lets a package loosen the
platform defaults (§15.3): in this version no package can, so
`ai.allowed.training: true` has no effect.

### 15.3 Resolving terms

When the host asks, a Reader resolves the terms that apply to a node: the
package's own, the host's limits, and composing packages. For each
permission:

1. **Package.** Start from the platform default (below). The package's own
   value applies only if it is stricter, whatever its authority and whatever
   `rights` says. A field that is not set never changes anything.
2. **Node.** A node's value applies only if it is stricter. A looser node
   value is reported as `U002_TERMS_LOOSENED` (warning), and the package's
   value stands. Both values are in the manifest, so a Reader reports this
   when it reads the package, compared with the package's own value.
3. **Composition.** A composing package's terms apply to a member's node only
   when they are stricter and the composing package's signers speak for the
   member, as for `upTo` (§9).
4. **Host.** The host's limits apply only if they are stricter. A limit is a
   floor, never a value.

"Stricter" is defined per field: `false` is stricter than `true`; a
destination not allowed anywhere is not allowed; more `providerRequires` conditions are
stricter; `work` is stricter than `model`. A malformed or unknown value counts
as the strictest value.

**A malformed container fails closed.** A container is a value that holds
permissions: `ai`, `ai.allowed`, `rights`, `rights.export`, `nodes`, and an
entry of `nodes`. One that is present and has the wrong type (`"allowed":
false`, `"ai": "none"`, `"nodes": {}`) sets every permission under it to its
strictest value, exactly as if each had been written wrongly one by one: no
destination is allowed, nor training, nor machine translation, nor mention
(so, at package level, the package is closed and hidden for every
destination, §15.4); the `providerRequires` conditions cannot be met; `answerSources` is `work`; and
under `rights` or `rights.export`, export is not allowed. Only an absent
container sets nothing. For `nodes`:

- a `nodes` that is not a list, an entry that is not an object, and an entry
  whose `paths` is missing or is not a list of strings do not say which nodes
  they mean. Each counts for **every** node of the package, with every
  permission at its strictest and a malformed rating (§15.4);
- inside a well-formed entry, a malformed `ai` or `ai.allowed` sets the
  permissions under it to their strictest for that entry's nodes only.

The Reader still reports each of these once, at the container, as `U001`
([package spec §4.14](moca-package-spec.md#414-terms)).

**Platform defaults**, used only when no level sets a field:
`allowed.device`, `allowed.host` and `allowed.provider` `true`,
`allowed.machineTranslation` `true`, `allowed.mention` `true`,
`allowed.training` `false`, no `providerRequires` conditions,
`answerSources` `model`, and `rights.export.allowed` `true`.

**`allowed.mention` is a package-level term**
([ADR-0041](../docs/adr/0041-what-the-terms-gate-covers-and-hiding-a-closed-package.md)).
It resolves like every other `allowed.*` field, from the platform, the
package, a composing package that speaks for it, and the host: the stricter
value, `false`, applies whatever its authority, so an unsigned package's
`mention: false` stands. It has no node level: in a `nodes` entry it is
`U003` and has no effect, and a malformed `nodes` or entry does not change
it.

Each resolved field says which level decided it: `platform`, `package`,
`node`, `composite` or `host`.

**Export** (`rights.export.allowed`) resolves the same way, with two levels:
the package, and a composing package whose signers speak for the member.
Nodes have no export value, and the host needs none: a host that does not
export text simply never does. Its platform default is `true`. It removes
nothing from a search: a host that lets people copy, save or export text
outside the app checks it first.

**Ratings are not resolved.** A node's effective rating is its own `nodes`
entry, if any, else the package's. A Reader also gives the package's
strictest rating: `explicit` true if any node or the package says true, and
each scheme's entries, from all nodes.

### 15.4 The terms gate

A host that is about to hand records to a model, or to show or play them
under a rating filter, MAY ask the search to apply terms with a `terms`
request ([Reader interface §5.1](moca-reader-interface.md#51-the-search-operation)).
Without one, terms remove nothing. With one, the gate (§9.2, step 5.7) also
removes:

- for `ai` (`{ destination, conditions, use }`): records whose resolved
  terms do not allow the destination (`allowed.device`, `allowed.host` or
  `allowed.provider` is not `true`), whose `providerRequires` conditions are
  not all among the host's `conditions` (`noTraining`, `noRetention`) for a
  `provider`, whose `allowed.training` is not `true` for the use `train`, or
  whose `allowed.machineTranslation` is not `true` for the use `translate`. The
  other uses are `answer`, `embed` and `summarise`;
- for `rating` (`{ explicit, schemes, allowUnrated, acceptFeedRatings }`):
  records rated `explicit: true` when `explicit` is `false`; records with a
  `contentRating` value outside the host's allowed set for that scheme;
  unrated records unless `allowUnrated`. `typicalAgeRange` never removes
  anything. The rules below say exactly what "rated" means.

**Rated, for this host's filter.** A record's rating is its node's effective
rating (§15.3). For one rating request, the record is **rated** when at least
one of these holds:

- its rating has an `explicit` value that counts. A rating with
  `declaredBy: feed` that says `explicit: false` counts only when the request
  has `acceptFeedRatings: true`; every other boolean counts;
- its rating has a `contentRating` entry under a scheme the request lists in
  `schemes`.

Otherwise it is **unrated**, and the gate removes it unless the request has
`allowUnrated: true`. So a record rated only under a scheme the host did not
list is unrated for that host: a rating the host cannot compare says nothing
to its filter, and never lets a record through on its own.

A rated record is then checked. It is removed when the request has
`explicit: false` and the record's `explicit` counts and is `true`; and, for
each scheme the request lists under which the record has an entry, when the
entry's `value` is not in the request's list for that scheme. A scheme the
request lists and the record has no entry under removes nothing.

**A malformed rating fails closed.** A rating that is present and is not an
object counts as `explicit: true` and as a value outside the allowed set of
every scheme the request lists. Inside a rating object, an `explicit` that
is not a boolean counts as `true`; a `contentRating` that is not a list, or
that has an entry that is not an object with a string `scheme`, counts as a
value outside the allowed set of every scheme the request lists. A citation
record shows a rating that is not an object as `{ "explicit": true }`.

**A request the Reader cannot honour removes everything.** This version
defines the four members above and no others; a `mode` member drafted
earlier, with the value `strict-path`, is not part of it. A `rating` request
that is not an object, that has a member this version does not define, or
whose `schemes` is not an object, is never run as a weaker filter: the gate
removes every record. A scheme whose allowed set is not a list allows no
value.

A request a caller or a hook sets can never widen what the host asked for.
Records the terms gate removes are counted in `U004_TERMS_EXCLUDED` (info) on
the search. The gate runs after every other filter but the one-per-span step
(§9.2, step 5.7), so it counts only records the search would otherwise have
returned: a record the locale, `scope` or `upTo` leaves out is not counted. The finding carries `excluded`, the number of records removed for
each reason (a record removed for two reasons counts under each), and
`hidden`, how many of the removed records belong to packages hidden for the
request (below). `U004` is for the host, and is always complete.

**Destinations.** `device` is a model that runs on the person's own device.
`host` is a model the host runs itself, including on a cloud provider's
hardware that the host controls, under its own terms; a host that counts
that as `host` says so publicly. `provider` is any other party's model,
including a host relaying content to it. Answering, embedding or indexing,
translating and summarising are all uses that send content to a model.

**What the gate covers**
([ADR-0041](../docs/adr/0041-what-the-terms-gate-covers-and-hiding-a-closed-package.md)).
Everything a Reader, adapter or server hands to a model MUST go through the
terms gate, not only the records a search returns:

- records, from a search or any other operation, such as `nodes` (§10) or a
  lookup by id;
- structure labels and definitions: for a request with terms, the structure
  is built only from the packages not closed for it (§10);
- text sent for embedding or indexing: ingest takes the host's terms request
  (§9.4);
- what is said about the packages themselves: only what the catalogue rule
  (below) allows.

**A Reader that hands content to a model**, such as an MCP server, MUST apply
the terms gate to everything it hands on. Its destination comes from its
host's configuration; with none, it MUST use `provider` with no conditions.
It never hands content to a model without a terms request with an `ai` part.

**Closed and hidden.** For a request with an `ai` part, a package is
**closed** when its package-level resolved terms fail the gate's `ai` test
for the request's destination and conditions. They are resolved as in §15.3
from the platform, the package, a composing package that speaks for it and
the host, with no node level. The package is closed when
`allowed.<destination>` is not `true`, or, for `provider`, when its
`providerRequires` conditions are not all among the request's `conditions`.
Its `closedBy` is the gate's reason: `ai.allowed.device`, `ai.allowed.host`,
`ai.allowed.provider` or `ai.providerRequires`. A use never closes a package:
`train` and `translate` remove the records that action may not use, and leave
the package open for others. A package that is not closed may still have
nodes the gate removes.

A package that is closed for a request, and whose resolved `allowed.mention`
is `false`, is **hidden** for it. A package that is not closed is never
hidden: `mention` changes nothing while the destination is allowed. A request
with no `ai` part closes and hides nothing.

**The catalogue rule.** What a Reader hands a model about the packages
themselves, such as a list of packages or one package's details, is a
**catalogue** ([Reader interface §4](moca-reader-interface.md#4-reading)).
For a request, a loaded package has an entry only when all of these hold:

1. at least one of its records, or of the records of the members it
   composes, at any depth, passes the host's audience set and, unless the
   host opted in to excluded content, the default retrieval policy (§8);
2. when the request has a `rating` part, the package's own rating
   (`terms.rating`, never a node's) passes it, as a record with that rating
   would;
3. it is not hidden.

A package that fails any of these has no entry at all. There is no
placeholder, such as "title unavailable": an entry would itself say that the
package exists. An entry is valid against
[`catalogue-entry.schema.json`](../schemas/v1/catalogue-entry.schema.json):

- an **open** package's entry has `id`, `version`, `title`, `description`,
  `publisher` (the publisher's `name`), `signed` and `tags`, each when the
  manifest has it, and, for a package with members, `members`: the ids of
  its members that have an entry of their own in the same catalogue;
- a **closed** package's entry has exactly `id`, `version`, `title`,
  `publisher` (the publisher's `name`, when the manifest has one), `signed`
  and `closedBy`, and nothing else: not the description, tags, contributors
  or anything else in the manifest.

The title, description, tags and the publisher's name are package-supplied
text (§12), passed as data in the envelope like any other. `signed` goes
with the publisher's name because an unsigned package can claim any
publisher. Entries are ordered by `id`, then `version`, in code-point order.

**Nothing names a hidden package.** A hand-off to a model MUST NOT pass on
anything that names a package hidden for its request:

- an answer about a hidden package, such as a lookup of the package or of
  one of its nodes, MUST be exactly the answer for a package that is not
  loaded;
- counts and notes handed to a model MUST NOT include hidden packages: a
  host takes `hidden` out of `U004`'s counts before it says anything about
  them;
- a list MUST leave hidden packages out before it is paged, and MUST NOT
  give a total that counts them;
- in a record from a search with a terms request, `trust.supersededBy` and
  `trust.contestedBy` leave out every entry that names a hidden package (its
  `id`, its `id@version`, or a node id under either); `superseded` and
  `contested` keep their values;
- an open composite's catalogue entry leaves out its hidden members;
- findings (§11) about a closed or hidden package MUST NOT be handed to a
  model.

Three channels remain, and are accepted. Concept IRIs that other packages use
may sit under a hidden package's id: an IRI is an identifier another package
chose to use, and the labels are gated. Scores are computed over every loaded
package (§9.2), and carry no identity. An earlier version of a package that
was open is still served: terms belong to a version
([package spec §4.14](moca-package-spec.md#414-terms)).

**Telling the person.** An application's own interface still tells a person
why something was left out: `mention` never changes what an application shows
people. A host whose only voice is a model MAY say that something was left
out, with no name, no count and no reason, and MUST NOT say more.

### 15.5 Never

A Reader MUST NOT fetch anything named in `terms`, use it to configure
itself, or pass it to a model as an instruction. Terms never change what
`readPackage`, `Library.citations`, `Library.get`, or a search, an ingest,
the structure operations or a catalogue without a terms request returns.
