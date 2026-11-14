# Changelog

All notable changes to the MOCA specification, schemas, profiles and
conformance corpus. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow
[the versioning policy](docs/versioning-and-release.md).

## [Unreleased]

The 0.7.0 Spec Change Proposal:
[distribution tiers, encrypted packages and issued copies](https://github.com/openmoca/moca-spec/issues/5).

### Added

- A new document, [encrypted packages](spec/moca-encrypted-package.md): a
  `.moca` archive encrypted with age v1 inside an envelope.
- Package spec §2: the terms envelope, encrypted package, outline, key
  provider, issued copy and issuer. §12: an envelope is a transport, not a
  fourth form.
- Reader contract §14: the optional feature `encryption`. §13: what a Reader
  does with an envelope it cannot open.
- Conformance runner: the `encryption` feature and the adapter's `envelope`
  output.
- ADR-0023 (age envelope) and ADR-0024 (`distribution`).
- Package spec §4.1: `distribution` (`open`, `encrypted-only`,
  `service-only`), the publisher's signed intent; a label only. The manifest
  schema gains the closed enum, and the Reader interface's package result
  gains `distribution`. Cases `distribution-encrypted-only` and
  `distribution-unknown`; the runner compares `expect.distribution`.

### Changed

- Reader contract §11 and package spec §11 (`core`): the `E` family counts
  for validity.

## [0.6.0] - 2026-11-11

Hardening from the 10 November 2026 specification review. 0.5.0 was a soft
launch; 0.6.0 is the first release published to npm, NuGet and PyPI.

### Added (Sigstore conformance cases)

- Attestations §6: a Reader may verify Sigstore offline only, against
  `trustedRoot` alone; hosts refresh it themselves. The Python and .NET
  Readers now verify Sigstore this way, so all three pass the `sigstore-*`
  cases.

- Seven `sigstore-*` cases: signed, reviewed, an identity that is not listed,
  the wrong role, tampered content, a transparency-log entry that does not
  match, and an untrusted CA. The bundles are made against a self-made test
  Sigstore with INSECURE keys (`scripts/sigstore-fixtures.py`), verified
  offline with the trusted root in each fixture trust root, and checked with
  both sigstore-js and sigstore-python. Nothing is written to a public log.
- A Sigstore smoke test against the public instance, ready for after the move
  to openmoca: `sigstore-smoke/`, `scripts/sigstore-smoke.mjs` and a
  hand-run workflow that signs only in the openmoca organisation. It is not a
  corpus case.
- Cases can name the optional features they need (`requires`), and the
  runner skips them with `--without <feature>` for a Reader that names the
  feature as not implemented (Reader contract §14).

### Changed (Ed25519 and Sigstore trust material)

- Strict Ed25519 (attestations §5): A and R must be canonical points of prime
  order, and S < L, checked before any library verifies. Before, the three
  reference Readers' libraries disagreed on 4 of the 12 ed25519-speccheck
  vectors, and Python accepted a signature from a small-order key for any
  message. New cases `signature-small-order-key` and
  `signature-mixed-order-key`.
- Sigstore trust material (attestations §6): a trust root may carry
  `sigstore.trustedRoot`; with it, Sigstore bundles are verified against it
  alone, offline. Issuer matching names the Fulcio extension OIDs; there are
  no patterns. An unusable trusted root is `A003`.

### Changed (wording and structure)

- Requirements that were written as description now use MUST or MUST NOT,
  and "throw" is replaced by a testable rule (contract §5). The terms table
  in package spec §2 adds digest, attestation, trust root, sidecar, overlay,
  backend, citation record and the gate, and states how codes are cited.
- One name for each idea ("locale representation", "package source"),
  "Reader" capitalised, UK spellings, no hyperbole or informal wording.
- The AG-UI document has the same header as the others and is no longer
  marked Draft. The sidecar table lists `indexVersion` and `createdBy`, and
  `model` is a MUST with its code. Package spec §13.1 points at the limits,
  and §1.1 at the ADRs for rationale.

### Changed (small specification gaps)

- The frontmatter block's grammar (package spec §5.1): BOM, the `---` lines,
  LF and CRLF only, and `...` never ends it. New cases
  `frontmatter-close-after-cr` and `frontmatter-close-line-separator`.
- Strict mode's effect on validity; the record's `profiles` field; evidence
  source extensions compared in ASCII (Reader contract §7, §11).
- Sidecars: `indexType` is `lexical`, `dense` or `hybrid` (`sparse` is gone);
  inline `vector` is accepted until 1.0.
- AG-UI: an optional `computedAt` says when the trust flags were true.
- Attestations §3 says the package predicate may give way to OpenSSF Model
  Signing. ADR-0009 notes that HTML and WebVTT are now normalised.
  `composed` and `localized` are explained.

### Changed (characters, names and edge cases)

- Package spec §2 says what digits, letters, white space, case-insensitive
  comparison, string order and the end of a string mean, everywhere in the
  set. Each Reader now follows it: Python and .NET regular expressions and
  trims had other meanings (non-ASCII digits in dates, a trailing newline in
  vendor keys, U+FEFF in `type`, a dotless ı in `index.md`).
- M007 uses a snapshot of the IANA URN registry
  ([`data/urn-namespaces.json`](data/urn-namespaces.json)) and accepts
  informal namespaces.
- A package `id` never contains `#`; the node reference's parsing rule is
  stated. `relation.version` must be a semantic version. A `type` of only
  white space fails the node schema too. Language tags are those that start
  with a language subtag.
- Stored (uncompressed) archive entries are checked for size and CRC-32 like
  deflated ones. The `x-` key grammar, reserved-name matching, the evidence
  limit per representation, a BOM in evidence sources, Markdown marker
  indentation, an empty media start, hybrid weights and ties with no span are
  specified.
- New cases `archive-stored-size`, `date-non-ascii-digits`,
  `vendor-key-trailing-newline`, `reserved-name-ascii-only`,
  `type-white-space`, `manifest-id-fragment` and
  `relation-version-not-semver`.

### Changed (decisions on folding, digests and applications)

- Path collisions use simple lowercase mapping, not Unicode case folding
  (package spec §6.3).
- Digest strings keep their form; `mocaVersion` says which algorithm applies
  ([ADR-0021](docs/adr/0021-digests-do-not-name-their-algorithm.md)).
- Rules for applications and hosts are advice (SHOULD); the AG-UI client
  rules stay MUSTs ([ADR-0022](docs/adr/0022-applications-get-advice.md)).

### Changed (the document set, model handoff, privacy, traceability)

- The document set (package spec §1.1): the status of each document, what it
  binds, and one order of precedence. Rules duplicated across documents now
  link to one home. What an implementation leaves out are "optional
  features", not "capabilities", and the Reader interface's "every case"
  matches the contract.
- Handing content to a model (Reader contract §12): "package-supplied text"
  is every string from a package. It goes to a model inside an escaped
  envelope (JSON recommended). Applications link only `http` and `https`, and
  never load remote resources that package text names. An AG-UI service cites
  only records its Reader returned during the run.
- Personal data (package spec §13.6): which fields can hold it, that a
  published version cannot be redacted, and pseudonymous identifiers.
- Traceability (`conformance/README.md`): a table from each group of
  requirements to its cases, a list of rules the corpus cannot test, and
  `scripts/check-traceability.mjs` in `npm run validate`. New corpus options
  `strict` and `expect.contested`; new cases `strict-promotes-warnings`,
  `strict-other-families`, `search-relation-conflict`,
  `search-relation-conflict-unauthorised`, `search-dense-version-mismatch`
  and `search-dense-dimension-mismatch`.

### Changed (versioning and schema patterns)

- Versioning (package spec §14): the document set is versioned as one
  release, which is "the contract version". `mocaVersion` is compared
  numerically; M008 applies only below `0.4`; a newer `mocaVersion` is read
  on a best-effort basis with the new `M009_MOCA_VERSION_NEWER` (warning). A
  table says when `schemas/v1`, the predicate types, `indexVersion`, the
  AG-UI `version` and the digest algorithm change.
- Schema patterns mean the same in every regular-expression engine: `[0-9]`
  for `\d`, ECMAScript's white-space list for `\s`, and `(?![\s\S])` for a
  final `$` (package spec §2). Before, a trailing newline passed in Python and
  .NET, and non-ASCII digits passed in Python. New cases
  `moca-version-newer`, `moca-version-leading-zeros`,
  `moca-version-trailing-newline`, `moca-version-non-ascii-digits` and
  `manifest-id-unicode-space`.

### Changed (structure, composition and retirement)

- Composition (package spec §7.1.1): resolution order, the cycle rule behind
  `R003` (keyed on `id@version`, checked before the resolver is called),
  member identity, trust and capabilities, and how a library adds members.
  New limits `maxMemberDepth` (8) and `maxMembers` (256): a member past
  either is not resolved (`R001`).
- Retirement signals (package spec §5.5,
  [ADR-0020](docs/adr/0020-structure-never-hides-content.md)): one table of
  what each signal sets and whether it is left out by default. Structure
  never hides content. `supersedes` means the whole target package.
- Structure (Reader contract §10): the shape of the `concept()` result,
  traversal over cycles (each concept once, never the start), and overlays
  never change a package's capabilities, validity or diagnostics. Overlays
  add concepts and relations; "vocabulary" is dropped. New case
  `structure-op-requires-cycle`.

### Removed

- `structure.json` ([ADR-0019](docs/adr/0019-park-structure-json.md)):
  `structure.ttl` is the only structure file. A `structure.json` is an
  ordinary package file that no Reader checks. `O004_STRUCTURE_VIEW_MISMATCH`
  is retired. The corpus case `structure-view-mismatch` becomes
  `structure-json-ordinary-file`, and `examples/service-catalogue` no longer
  ships the file. `structure.schema.json` stays, as the shape of the view
  `moca-lint structure` prints.

### Added (decision records)

- ADR-0015 to ADR-0020 record the 0.6 decisions on relations, audience,
  reviews, ranking, `structure.json` and retirement signals.

### Added

- Conformance cases for unsafe and malformed paths (`unsafe-path-absolute`,
  `resource-bad-escape`), a trust root with empty `roles`, a 30,000-concept
  `requires` chain, unparseable dates and actorless entries, a `log.md` heading
  in a code block, `moca.json` that is not UTF-8, a top-level file named
  `attestations`, a package composing another version of itself, and the first
  `T001`, `T002` and `T003` cases (a missing target, a target with no
  `moca.json`, and archive entry and byte limits).
- Attestation cases, one fault each: wrong payload type, a payload that is not
  JSON, a payload that is not an in-toto Statement, no signatures, a signature
  with no `keyid`, a statement naming another version, an untrusted and a
  trusted signature together (valid), base64url (valid), an unknown predicate
  type (ignored), and a review naming another package.
- Date cases: a key at and one second before its expiry, window intersection,
  date-only bounds, a date-time without an offset and an inverted window. Every
  case with a trust root now sets `options.now`, so the corpus no longer
  starts failing when the fixture keys expire in 2031.
- Relation authority cases: an unauthorised and an authorised relation, an
  unsigned, an out-of-scope and a no-boundary relation in search, and the host
  option. The `search-policy/v2` fixture and the `policy-corpus` 2.0.0 example
  are now signed, and the publisher keys in the fixture and example trust
  roots have `ids`.
- Audience cases: unlabelled, allowed unlabelled, malformed labels (a list and
  a number), the gate on its own, and a translation that inherits its label.
  The `search-policy` fixture's `stale.md` is now labelled `public`.
- Review cases: an inaccurate review, the latest review winning, reviews in an
  unsigned package, a review dated in the future, and a reviewer the key may
  not sign as; the runner checks `expect.reviewStatus`.
- A store case where a package is superseded after its records were ingested
  (`ingestSeparately`).
- Cases for `requireSignature` (unsigned, tampered, signed) and an identity
  conflict; `signature-tampered` now expects `A008`.
- Limit and archive cases: the evidence budgets, the directory entry limit,
  and zip fixtures for names that are not UTF-8 or hold NUL, empty and `.`
  segments, a duplicate entry, a symbolic link and bzip2 compression.
- Determinism cases: an archive with %, #, CR and LF in paths, repeated keys in
  `moca.json`, a statement and frontmatter, and locale fallback for `fr-CA`,
  `pt` and a mixed-case tag.
- A sidecar whose item text differs from the package, and a gate case for a
  node in several languages; a one-sided prefix is now `S006`. 166 cases in
  all.

### Changed

- Attestations §7 is now a numbered verification algorithm with one outcome
  for each step. A003 means only that a check was not possible (no trust root,
  or for Sigstore no identities or no Sigstore support); a key or identity that
  is unlisted or has the wrong role is A002, as the corpus already expected.
  The signer string, the base64 and base64url rules, Ed25519's `S` check and
  the one-valid-signature rule are written down.
- Sidecars and search (ADR-0018): a sidecar item's `text`
  must be the package's bytes at its span, inside the body (`S004`), and
  search reads only the package; a one-sided embedding prefix is `S006`; the
  built-in lexical tokeniser and the default `ontologyGuided` hook are
  specified; the gate keeps one result per representation and span, and
  `limit` defaults to 5; Reciprocal Rank Fusion is now the informative
  reference hybrid backend, with the digest as the last tie-break; sidecar
  §5.1 is "Embedders the MOCA tools support"; sidecar §5.2 adds security
  considerations and §6 defers to the store-backend rules.
- Determinism: digest lines sort by the NFC path before
  percent-encoding (as the Readers already did); `moca.json` and statements
  are I-JSON (repeated member names are `M001` and `A001`), and repeated
  frontmatter keys are `C002`; OKF v0.2 is pinned to a commit; links and
  resources resolve relative to the node file, with the rules written down;
  locale fallback follows RFC 4647 Lookup, then the lowest longer tag, case-
  insensitively; evidence quotes are normalised like their sources, and a
  position selector alone is not checked; contract §7 gains a table of how
  each record field is derived and says consumers ignore unknown fields;
  P003's wording matches the package spec; ADR-0004 no longer claims
  capabilities are in the record.
- Limits and archives (Reader contract §3, review B9 and M6): every source
  has the entry and byte limits, directories included, and a host source's
  bytes are counted as read. Evidence work is bounded per package (new
  `maxEvidenceChecksPerPackage` and `maxEvidenceBytesPerPackage`), each source
  is normalised once, and a quote is matched in one pass: a few kilobytes of
  archive can no longer keep a Reader busy for hours. Archive rules are
  normative: UTF-8 names, no NUL, empty or `.` segments, duplicates collide,
  links are unsupported, only stored and deflated entries are read, entries
  never inflate past their declared size. The limits table names each option,
  and its outcomes are normative. Package spec §2 says how a MUST maps to a
  diagnostic's severity, and §6.2 forbids writing or extracting hidden
  entries.
- Identity and tampering (review M2, M3): a library refuses a second digest
  for one `id@version` (new `L001_IDENTITY_CONFLICT`); an attestation for this
  `id@version` with another digest is `A008_PACKAGE_DIGEST_MISMATCH`; a resolved
  member must match its pin's `id` and `version`; `readPackage` takes
  `requireSignature` (new `A009_SIGNATURE_REQUIRED`, which invalidates). Package
  spec §13.5 covers rollback, frozen copies and two digests for one version.
- Store search (contract §9.4, review B2): a store search takes the loaded
  packages' states, not bare digests, and recomputes supersession, contest,
  signatures and reviews at query time. Before, a package superseded after
  ingest, or a key removed from the trust root, was still served as current or
  signed. The store is declared a trusted component.
- Reviews (ADR-0017): `reviewed` needs a signed package with every
  reviewed page approved. Citation records gain `trust.reviewStatus`
  (`approved`, `disputed`, `unverified`, `none`) and each review's
  `packageVerified`; review `outcome` is an enum in the record schema. The
  latest review from each signer counts, a review dated after the clock is
  ignored (new `A007_REVIEW_DATE_FUTURE`), and trust-root entries may list the
  `reviewers` they may sign as. Attestations §4 says that a missing review is
  not evidence, and recommends listing cited evidence files as subjects.
- Audience (Reader contract §8, ADR-0016): under a host audience set,
  unlabelled content is left out unless the host sets `allowUnlabelled`, and a
  malformed label (now marked `audienceInvalid` in the citation record) never
  matches. A translation with no label has its default-language
  representation's. Reader interface §7: bindings apply the audience set and
  the default policy to every record they hand to a model or user, and the
  opt-ins are host configuration, never tool arguments.
- Relations (package spec §7.2, ADR-0015): `supersedes` and
  `conflictsWith` take effect only when the declaring package has a valid
  package attestation from a key or Sigstore identity whose new `ids` cover the
  target's id; otherwise they are reported (`R004_RELATION_UNAUTHORISED`,
  info) and have no effect. A host option, off by default, applies unsigned
  relations. Before, any loaded package, signed or not, could remove another
  publisher's content from default search.
- Dates (package spec §4.4): a full date means 00:00Z; a date-time needs an
  offset, and one without is reported and ignored rather than read in some
  time zone; `validFrom` is inclusive and `validUntil` exclusive. A node's
  window is the intersection with its package's, and an inverted window is
  ignored. Keys expire at the instant of `expires` against the host clock,
  which `readPackage` now takes (Reader interface §3); attestations §6 states
  the trade-off and the advice to re-sign.
- Trust roots: `roles` is required on every key and identity (an empty list
  trusts nothing), `keyid`s are unique, and Sigstore issuer and subject match
  exactly ([MIGRATIONS.md](MIGRATIONS.md)).
- SECURITY.md no longer describes a skills gate: MOCA has no skills mechanism
  since 0.4, and package content is never loaded as skills, prompts or tools.
- Every specification document now defines its requirement key words
  (RFC 2119 and RFC 8174) and points to the package specification's terms. The
  AG-UI citations document has the same header as the others.
- Reader contract §4 states its prohibitions as MUST NOT requirements.
- Worked examples in the attestations, sidecar and Reader contract documents
  use the real `support-kb` values: its digest, signer names and spans.
- Sidecar specification §6 is called "Store backends", as in the Reader
  contract and interface.
- Smaller wording fixes: two garbled sentences, UK spellings, and terse table
  entries.

## [0.5.0] - Not published

A soft launch, not published to the registries. Packages written for `0.4` read as before
([MIGRATIONS.md](MIGRATIONS.md)). New packages declare `mocaVersion` `0.5`. One
rule is tightened: DSSE keys are Ed25519.

### Added

- [Citations over AG-UI](spec/moca-ag-ui-citations.md): one AG-UI `CUSTOM`
  event, `moca.citations`, carries the whole citation record of each node an
  answer cites, after the answer. With
  [`ag-ui-citations.schema.json`](schemas/v1/ag-ui-citations.schema.json) and an
  example the checks keep equal to the Reader's output
  ([ADR-0013](docs/adr/0013-citations-over-ag-ui.md)). Application layer only:
  packages and the Reader contract do not change.

- [TRADEMARKS.md](TRADEMARKS.md), the OpenMOCA trade mark policy: what needs no
  permission, the rule for claiming "OpenMOCA conformant", and what to ask
  about first. OpenMOCA is filed as a UK trade mark (UK00004468246).
  [GOVERNANCE.md](GOVERNANCE.md) says who holds the marks
  ([ADR-0012](docs/adr/0012-trade-mark-policy.md)).

- A semantic index for the Acme example in the release,
  `acme-support.bge-small-en-v1.5.moca.idx.zip`, built with a standard model.
  The walkthrough now ends step 8 by asking a question by meaning, and the
  search guide's semantic example uses the standard model `all-MiniLM-L6-v2`
  in all three languages.

### Changed

- **DSSE keys are Ed25519** ([attestations §5](spec/moca-attestations.md#5-signing-modes),
  [ADR-0014](docs/adr/0014-dsse-keys-are-ed25519.md)). A Reader verifies a DSSE
  signature only with an Ed25519 key; a trusted key of another type verifies
  nothing (`A002`). Before, the TypeScript and .NET Readers also verified ECDSA
  and RSA signatures, and the Python Reader did not. New corpus case
  `signature-key-not-ed25519`.

## [0.4.0-alpha.2] - 2026-10-30

The first release from this repository. Packages are unchanged from
0.4.0-alpha.1 and still declare `mocaVersion` `0.4`; the Reader contract adds
one diagnostic code. Earlier history is not carried over.
[MIGRATIONS.md](MIGRATIONS.md) covers every change up to this version.

### Changed

- The reference Reader and the tools moved to their own repositories:
  [moca-reader-typescript](https://github.com/openmoca/moca-reader-typescript)
  (`@openmoca/moca-core`),
  [moca-mcp-dotnet](https://github.com/openmoca/moca-mcp-dotnet) (the MCP server),
  [moca-convert](https://github.com/openmoca/moca-convert) and
  [moca-tools](https://github.com/openmoca/moca-tools) (`moca-lint`,
  `moca-index`, `moca-sign`). This repository holds the specification,
  schemas, profiles, examples and conformance corpus, with the scripts that
  validate them.
- The check that the Reader's vendored schemas match `schemas/v1/` moved to
  moca-reader-typescript.
- Spec Change Proposals are a fixed sequence of linked pull requests across
  repositories, and every repository's CI pins the others to a release tag,
  or a commit during a proposal, never a branch ([CONTRIBUTING.md](CONTRIBUTING.md)).
  `scripts/check-deps.mjs` enforces the pins, and checks that each published
  npm package declares every package it imports.

### Added

- `examples/youtube`: a single video and a playlist.
- `examples/pdf`: the FAA *Airplane Flying Handbook*, 19 PDFs converted into
  251 section nodes with page evidence. `scripts/fetch-pdfs.mjs` downloads a
  `pdfs.json`'s documents and pins their digests.
- Reader contract §9.6, hybrid backends (#15): a lexical and a dense
  backend merged by Reciprocal Rank Fusion, Σ weight / (k + rank), k 60 and
  weights 1 by default, set by the host. Conformance cases `search-hybrid`
  and `search-hybrid-dense-only`; `options.backend` `hybrid` and
  `options.hybrid`.
- Embedding roles and declared prefixes (#12): `embed(texts, { role })` with
  `query` or `document` (Reader interface §5.3); the sidecar `model` may give
  `queryPrefix` and `documentPrefix` (schema), compared like `version`, never
  applied (Reader contract §9.3, sidecar spec §3 and §5). Conformance cases
  `search-dense-prefix-match`, `-mismatch` and `-undeclared`, with sidecar
  variant `dense-prefixed`.
- Reader contract §9.3: a dense backend scores by the index's
  `model.distance` (`cosine` by default, `dot`, or negative `euclidean`)
  (#10). Conformance cases `search-dense-distance-cosine`, `-dot` and
  `-euclidean`, with fixture `search-distance` and generated sidecars.
- Package spec §6.3 names the lower-casing for path collisions (`P003`): the
  Unicode simple lowercase mapping, one code point at a time (#8). Conformance
  cases `path-collision-nfc`, `path-collision-case`,
  `path-collision-simple-lowercase` and `valid-dotted-i`, from generated
  archives (`add` in `scripts/derived.config.json`); the corpus had no `P003`
  case before.
- `S007_NO_VECTORS` (warning): a dense backend reports each loaded package it
  has no vectors for, and does not search it (Reader contract §9.3, #4).
  Conformance case `search-dense-no-vectors`.
- Conformance case `valid-noncharacter-path`: an archive whose node path holds
  U+FFFE is valid, and every Reader computes the same digest. The fixture is
  generated (`rename` in `scripts/derived.config.json`).
- Conformance case `search-sidecar-no-text`: lexical search over a sidecar
  whose items carry no `text` runs over the package text their offsets point
  at (Reader contract §9.1).
- Conformance case `search-hostile-ingress`: an ingress hook that asks for
  excluded content, a larger limit and another locale; the gate follows the
  caller.
- `scripts/check-deps.mjs` (`npm run check:deps`): fails on any dependency that
  is not public. Every open MOCA repository runs it in CI.

### Fixed

- The Reader contract describes structure as package spec §5.6 does, not as
  the pre-0.4 ontology profile: `O` diagnostics withhold `structured` (not
  `ontology`), `O001`-`O003` speak of `structure.ttl` and node bindings,
  `concepts` comes from `moca.concepts`, and §13 drops the "ontology profile
  not implemented" row (an unknown profile is covered by its own row).
- The Reader contract §11 table lists `O004_STRUCTURE_VIEW_MISMATCH` and
  `O005_STRUCTURE_CYCLE`. Package spec §5.6, the corpus and both Readers
  already used them; the table did not.
