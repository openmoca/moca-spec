# [Spec] Define Canonical Package Hashing (Digest Scheme)

## Precondition

**This proposal assumes `composition` (`ISSUE-DRAFT-composition.md`) has
been merged and its `members`/`relates` shape is stable, not merely
proposed.** A composed package's digest plausibly needs to account for its
members' digests transitively (see "Composed packages" below); designing
this scheme before that shape settles risks retrofitting the digest scheme
once composition ships. If `composition` is still open when this proposal
is picked up, resolve it first.

## Affected section(s)

- `moca-core-spec.md` §5.4 Integrity Precedence and a new §5.5 Canonical
  Package Digest (renumbering the current §5.5 Spec Evolution to §5.6).
- `schemas/core/moca.schema.json`, adding a `canonicalDigest` property
  alongside the existing `integrity` object.
- `docs/sidecar-index-spec.md`, updating any target-binding language that
  currently references per-file `integrity` hashes to also allow binding
  against the new whole-package canonical digest.
- `docs/quickstart.md` "Going further" table.
- `CHANGELOG.md`.

## Problem

Core's existing `integrity` object (§5.1, §5.4) records per-resource
SHA-256 digests for individual files in a package, and is authoritative
over any RO-Crate or BagIt checksum manifest present. It does not define a
single canonical digest *for the package as a whole*. This gap blocks two
things already on the roadmap:

1. **Sidecar index binding.** The
   [MOCA Sidecar Index Specification](docs/sidecar-index-spec.md) supports
   an "optional SHA-256 target binding" so a consumer can verify a
   `.moca.idx` sidecar was built against the package version it claims.
   Without a canonical whole-package digest, that binding can only target
   one file's hash, not the package's actual content identity.
2. **Composed package identity.** If `composition.members` is accepted, a
   composing package (e.g. a course referencing several modules) has a
   content identity that plausibly depends on its members' digests, not
   just its own files. Without a transitive scheme, two packages with
   identical `moca.json` but different member versions would hash
   identically, which is wrong.

This is listed as an "Initial Open Decision" in `ROADMAP.md` and has no
design document yet.

## Proposed change

*(This section is a starting outline, not a final design — it is expected
to be substantially revised during review; it exists to give the proposal
review process a concrete starting point rather than an empty page.)*

### Canonical digest of a single (non-composed) package

Define `canonicalDigest` as a SHA-256 digest computed over a deterministic
serialization of the package's `integrity` entries (§5.1) — i.e. a digest
of digests, not a re-hash of file contents. This avoids re-reading
potentially large binary assets solely to compute a package-level digest
when per-file digests already exist.

```json
{
  "id": "urn:moca:example:system-design",
  "version": "2.0.0",
  "integrity": {
    "content/01-introduction.md": "sha256-...",
    "content/02-advanced-patterns.md": "sha256-..."
  },
  "canonicalDigest": {
    "algorithm": "sha256",
    "value": "sha256-<digest-of-sorted-integrity-map>"
  }
}
```

Open questions for review, not resolved by this outline:

- Exact canonicalization rule for ordering/serializing the `integrity` map
  before hashing (e.g. lexicographic key sort, JCS/RFC 8785-style JSON
  canonicalization).
- Whether `moca.json` manifest fields themselves (excluding
  `canonicalDigest` itself, to avoid self-reference) are included in the
  digest input, or only the `integrity` map.

### Composed packages

For a package with a `composition.members` block, `canonicalDigest`
SHOULD additionally fold in each referenced member's own `canonicalDigest`
at the resolved version, so that a course's digest changes if any module's
digest changes, without requiring the course package to re-embed the
modules' file contents.

```json
{
  "composition": {
    "members": [
      { "id": "urn:moca:module:probability-basics", "version": "1.2.0" }
    ]
  },
  "canonicalDigest": {
    "algorithm": "sha256",
    "value": "sha256-<digest-of-own-integrity-map-plus-member-digests>"
  }
}
```

This requires member resolution at digest-computation time (the
composition proposal explicitly leaves resolution mechanism out of Core
scope — see `ISSUE-DRAFT-composition.md` "What Core does not specify").
This proposal inherits that same non-mandate: Core defines what goes into
the digest input, not how a harness locates the member package to read its
digest from.

`composition.relates` (loose reference) is NOT proposed to be folded into
`canonicalDigest` — related packages remain independent by design (the
composition proposal is explicit that `relates` packages "remain fully
valid and useful on their own"), so their content identity should not
entangle with the referencing package's digest the way `members` does.

### What this proposal does not specify

- **Signature interaction.** Whether `canonicalDigest` becomes the thing a
  Level 3 `signature` (§8.2) signs over, versus signing the full archive,
  is a follow-up question deliberately out of scope here.
- **Digest algorithm agility.** This outline assumes SHA-256 for
  consistency with the existing `integrity` object; a future revision
  could add an `algorithm` enum if a second algorithm becomes necessary.

## Impact on existing conformance levels / profiles

Additive at all levels: a package without `canonicalDigest` is unaffected
and remains conformant. No existing package becomes non-conformant. This
does not change `integrity`'s existing per-resource behavior or its
precedence rule (§5.4). No existing profile is changed.

## Alternatives considered

- **Hash the whole archive (Zip) instead of a digest-of-digests.** Rejected
  as the primary mechanism: archive-level hashing is sensitive to
  irrelevant details (file ordering within the Zip, compression settings,
  timestamps) that have nothing to do with content identity, which is
  exactly the class of problem a canonical digest is meant to avoid.
- **Defer canonical hashing indefinitely, rely on `version` alone for
  identity.** Rejected: `version` is author-declared and not
  cryptographically verifiable; sidecar index binding and composed-package
  identity both need a verifiable content digest, not just a trust-the-author
  version string.

## Implementation scope

If accepted, implementation touches only:

- `moca-core-spec.md` (new §5.5, renumbering current §5.5 to §5.6).
- `schemas/core/moca.schema.json` (`canonicalDigest` property).
- One example package (composed, once composition examples exist) and one
  non-composed example, both annotated with `canonicalDigest`.
- `docs/sidecar-index-spec.md` cross-reference update.
- `docs/quickstart.md` and `CHANGELOG.md` cross-references.

This proposal does not change Level 1/2/3 requirements, does not mandate
`canonicalDigest` on any existing package, and does not finalize signature
interaction (tracked separately, if needed, as a follow-up once this
digest scheme is settled).
