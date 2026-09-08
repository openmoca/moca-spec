# [Spec] Define Canonical Package Hashing (Digest Scheme)

## Precondition — satisfied

This proposal depends on `composition` (`members`/`relates`) being merged and
stable. **Roadmap item 2 (Core Hardening: Lifecycle, Provenance & Composition)
is complete** as of this writing, so this precondition is satisfied and the
design below resolves the open questions the original outline
(`ISSUE-DRAFT-canonical-hashing.md`, first pass) deliberately left open.

## Affected section(s)

- `moca-core-spec.md` §5.4 Integrity Precedence and a new §5.5 Canonical
  Package Digest (renumbering the current §5.5 Spec Evolution to §5.6).
- `schemas/core/moca.schema.json` — new `canonicalDigest` manifest property.
- `schemas/core/context.jsonld` — new `canonicalDigest` JSON-LD term (scoped,
  matching the existing `augmentation`/`composition` pattern).
- `scripts/validate-canonical-digest.mjs` (new) — reference implementation
  and CI check that recomputes and verifies `canonicalDigest` on every
  example that declares one.
- `package.json` — add `canonicalize` (RFC 8785 JCS) as a direct
  devDependency (currently only present transitively via `jsonld`), and a
  new `validate:canonical-digest` script.
- `.github/workflows/validate.yml` — run the new script in the existing
  `validate-examples` job.
- Two new/updated example packages: one non-composed package with a
  `canonicalDigest`, and the existing `examples/composition-members/`
  trio annotated with `canonicalDigest` to demonstrate member-folding.
- `docs/sidecar-index-spec.md` §4 Target Binding — allow binding against
  `canonicalDigest` in addition to a raw archive hash.
- `docs/quickstart.md` "Going further" table.
- `CHANGELOG.md`.

## Problem

Core's existing `integrity` object (§5.1, §5.4) records per-resource SHA-256
digests for individual files and is authoritative over any RO-Crate/BagIt
checksum manifest present, but it does not define a single canonical digest
for the package **as a whole**, and it is optional and may be partial (an
author can declare hashes for some files and omit others). This blocks two
things already on the roadmap:

1. **Sidecar index binding.** The
   [MOCA Sidecar Index Specification](../docs/sidecar-index-spec.md) wants an
   optional whole-package hash a `.moca.idx` can bind against so a consumer
   can verify the sidecar was built against the exact package version it
   claims. Without a canonical digest, `target_package_hash` can only mean
   "hash of the `.moca` archive bytes," which is sensitive to irrelevant
   details (Zip entry order, compression settings, timestamps).
2. **Composed package identity.** Now that `composition.members` exists, a
   composing package's meaningful identity depends on its members'
   digests, not just its own files. Two otherwise-identical composing
   packages that reference different member versions must not hash the
   same.

## Proposed change

Add an optional manifest property `canonicalDigest`:

```json
{
  "id": "urn:moca:example:system-design",
  "version": "2.0.0",
  "canonicalDigest": {
    "algorithm": "sha256",
    "value": "b17ef6d19c7a5b1ee83b907c595526dcb1eb06db8227d650d5dda0a9f4ce8dc"
  }
}
```

### Resolution of the two open questions from the original outline

**1. What goes into the digest — the declared `integrity` map, or file
contents?**

Resolved: **file contents, always recomputed from disk.** `canonicalDigest`
MUST be derived from each resource file's actual on-disk bytes at
computation time, not from the `integrity` object's declared values.
`integrity` remains a separate, optional, author-declared convenience for
per-resource checks (§5.4 is unchanged); `canonicalDigest` is the
independently-verifiable whole-package identity and must not depend on
whether, or how completely, an author chose to populate `integrity`. This
also means `canonicalDigest` is computable for a package that declares no
`integrity` object at all.

**2. Are manifest fields included, or only file contents?**

Resolved: **yes, the manifest is included.** Two packages with byte-identical
`content/`/`ontologies/` trees but a different `id`, `version`, `title`, or
`entryConcepts` are not the same package and must not produce the same
digest. The manifest is included as a canonicalized JSON object with the
`canonicalDigest` property itself removed (to avoid self-reference).

### Algorithm (`algorithm: "sha256"`, v1)

1. **Resource digests.** Walk every file under the package root except
   `moca.json` itself and the standard pack excludes (`.git/`,
   `node_modules/`, `.DS_Store` — same set `moca-lint pack` already uses).
   For each file, compute its SHA-256 digest directly from its bytes on
   disk. Build `resources`, a map of package-relative POSIX path → lowercase
   hex digest.
2. **Manifest digest.** Take the parsed `moca.json` object, delete the
   `canonicalDigest` key, canonicalize the result per
   [RFC 8785 (JSON Canonicalization Scheme)](https://www.rfc-editor.org/rfc/rfc8785),
   and SHA-256 the resulting UTF-8 bytes → `manifestDigest` (lowercase hex).
3. **Member digests (composed packages only).** If `composition.members` is
  present, resolve each member to a concrete package version and read its
  own `canonicalDigest.value`. Build `members`, a map of
  `"<id>@<resolved concrete version>"` → member's digest value. The
  `composition.members[].order` property is intentionally omitted: sequencing
  does not affect the digest, only membership does. A member that cannot be
  resolved, or that has no `canonicalDigest` of its own, MUST cause digest
  computation to fail closed rather than silently omitting that member.
  Because core §10.4 does not mandate a member-resolution mechanism,
  reproducibility of a composed package's `canonicalDigest` is conditioned on
  implementations resolving the same members to the same concrete versions.
  Implementations using different registries, lockfiles, or resolution
  strategies MAY therefore compute different digests for the same manifest.
  `composition.relates` is intentionally excluded — related packages remain
  independent by design (core §10.2), so their content identity must not
  entangle with the referencing package's digest the way `members` does.
4. **Assemble and hash.** Build the top-level object:

   ```json
   {
     "manifest": "<manifestDigest>",
     "resources": { "<relPath>": "<digest>", "...": "..." },
    "members": { "<id>@<resolved concrete version>": "<digest>", "...": "..." }
   }
   ```

   Omit the `members` key entirely for a non-composed package (do not emit
   `{}`, so a package's digest doesn't change the moment it adopts an empty
   `composition` block versus none at all). Canonicalize this object per
   RFC 8785 and SHA-256 the resulting UTF-8 bytes. The resulting lowercase
   hex string is `canonicalDigest.value`.

RFC 8785 is used instead of an ad hoc "sort keys lexicographically" rule
because it already has a maintained implementation
([`canonicalize`](https://www.npmjs.com/package/canonicalize) on npm, RFC
8785-conformant) that is *already present in this repo's dependency tree*
(a transitive dependency of `jsonld`, used by `validate-jsonld-context.mjs`).
This proposal promotes it to a direct, intentional devDependency rather than
relying on an incidental transitive one, and avoids the repo inventing and
maintaining its own canonicalization edge-case handling (Unicode
normalization, number formatting) that JCS already specifies.

### What this proposal does not specify

- **Signature interaction.** Whether a future Level 3 `signature` (§8.2)
  signs over `canonicalDigest` versus the full archive is a follow-up
  question, deliberately out of scope here.
- **Digest algorithm agility.** `algorithm` is a string field (not hardcoded
  to `sha256` in the schema) so a future revision can add a second value,
  but only `"sha256"` is defined by this proposal.
- **`moca-lint` verification.** This proposal ships the reference algorithm
  as a standalone script (`scripts/validate-canonical-digest.mjs`),
  mirroring `validate-jsonld-context.mjs`/`validate-sidecar-index.mjs`, and
  runs it in CI against the example packages. Turning "does `canonicalDigest`
  match?" into a `moca-lint` finding code (e.g. an `E4xx` alongside `E402`)
  is a reasonable follow-up but is left to `moca-lint`'s own versioned
  validation contract (roadmap item 5), not bundled into this spec change.

## Impact on existing conformance levels / profiles

Additive at all levels: a package without `canonicalDigest` is unaffected
and remains conformant. This does not change `integrity`'s existing
per-resource behavior or its precedence rule (§5.4). No existing profile is
changed. No existing example package is invalidated; examples updated by
this proposal simply gain an additional, correct `canonicalDigest` value.

## Alternatives considered

- **Hash the whole archive (Zip) instead of a digest-of-file-digests.**
  Rejected as the primary mechanism: archive-level hashing is sensitive to
  file ordering, compression settings, and timestamps that have nothing to
  do with content identity.
- **Digest-of-digests over the declared `integrity` map (the original
  outline's suggestion), instead of recomputing from disk.** Rejected: since
  `integrity` is optional and may be partial, this would let two packages
  with different content hash identically whenever an author simply didn't
  declare `integrity` entries for the differing files. Recomputing from disk
  gives every implementation the same answer regardless of what the author
  chose to declare.
- **Exclude the manifest from the digest, hash only file contents.**
  Rejected: manifest-only differences (a bumped `version`, a changed
  `entryConcepts` root) are content-identity-relevant and must change the
  digest.
- **Invent a bespoke canonical-JSON rule instead of RFC 8785.** Rejected:
  RFC 8785 is a maintained standard with an existing, already-vendored
  implementation; reinventing it would just reproduce its edge cases worse.

## Implementation scope

If accepted, implementation touches only:

- `moca-core-spec.md` (new §5.5, renumbering current §5.5 → §5.6).
- `schemas/core/moca.schema.json` (`canonicalDigest` property + `$def`).
- `schemas/core/context.jsonld` (`canonicalDigest` term, scoped context for
  `algorithm`/`value`).
- `scripts/validate-canonical-digest.mjs` (new), `package.json` (direct
  `canonicalize` devDependency + `validate:canonical-digest` script),
  `.github/workflows/validate.yml` (wire the new script into CI).
- One non-composed example package annotated with a real, computed
  `canonicalDigest`, and the `examples/composition-members/` trio annotated
  similarly to demonstrate member-folding.
- `docs/sidecar-index-spec.md` §4 cross-reference, `docs/quickstart.md`
  "Going further" row, `CHANGELOG.md`.

This proposal does not change Level 1/2/3 requirements, does not mandate
`canonicalDigest` on any existing package, does not add a `moca-lint`
finding code, and does not finalize signature interaction.
