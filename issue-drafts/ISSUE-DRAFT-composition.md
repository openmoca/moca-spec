# [Spec] Add a Core `composition` Mechanism for Referencing Other MOCA Packages

## Affected section(s)

- `moca-core-spec.md` §3 Conformance Levels (Level 1 floor clarification),
  §5.1 Manifest Properties, and a new §12 Package Composition &
  Relationships.
- `schemas/core/moca.schema.json`, adding an optional `composition` property
  and its `$defs`.
- New example packages under `examples/` demonstrating both composition
  relationship kinds.
- `tools/moca-lint`, flagging known limitations for a future follow-up (not
  implemented as part of this proposal).
- `docs/quickstart.md` "Going further" table.
- `CHANGELOG.md`.

## Problem

MOCA Core currently defines exactly one shape of package: a single
self-contained unit identified by one `id`, with its own `content/`,
`ontologies/`, etc. There is no manifest-level way for one package to
reference another MOCA package.

Two real use cases expose this gap and are subtly different from each
other:

1. **Containment ("part-of"):** a course composed of several independently
   authored and reusable modules. The course is meaningfully *the
   aggregate* of its modules; it may carry little or no content of its own
   beyond structure and ordering.
2. **Loose reference ("relates-to"):** two independent, freestanding legal
   documents that remain fully valid and useful on their own, where a
   separate decision procedure needs to consult both and reason about how
   they relate (supersession, cross-reference, conflict). Neither document
   is "part of" the other.

`augmentation` (core §9) does not fit either case: it is a 1:1 relationship
from one MOCA package to exactly one *non-MOCA* external artifact
(`relationship: "augments"`), not a MOCA-to-MOCA, 1:many structural or
associative relationship. Overloading `augmentation` for this would
conflate two conceptually distinct mechanisms.

Without a Core mechanism, implementers will invent ad hoc, incompatible
ways to link packages (e.g. burying references inside `profileData`, or
inside `content/` frontmatter), fragmenting interoperability exactly where
it matters most: multi-package reasoning.

## Proposed change

Add an optional, domain-agnostic manifest property, `composition`, with two
independent sub-mechanisms. A package MAY use either, both, or neither.

### `composition.members` — containment ("part-of")

Ordered, versioned references to packages that make up this package's
aggregate structure. Direction is parent → children only; a member package
never declares which aggregates include it, keeping members reusable
across multiple aggregates without circular coupling.

```json
{
  "id": "urn:moca:course:intro-to-bayesian-stats",
  "version": "1.0.0",
  "title": "Introduction to Bayesian Statistics",
  "composition": {
    "members": [
      { "id": "urn:moca:module:probability-basics",  "version": "^1.0.0", "order": 1 },
      { "id": "urn:moca:module:bayes-theorem",        "version": "^1.0.0", "order": 2 },
      { "id": "urn:moca:module:priors-and-posteriors","version": "^1.0.0", "order": 3 }
    ]
  }
}
```

### `composition.relates` — loose reference ("relates-to")

Typed, non-hierarchical associations between independent packages.
`relationship` is an open string, not a closed enum — consistent with
`riskTier` and `epistemicStatus` extension patterns elsewhere in the spec —
so consumers and profiles can extend the vocabulary as needed. Core
suggests but does not mandate initial values: `partOf`, `crossReferences`,
`supersedes`, `amends`, `conflictsWith`.

```json
{
  "id": "urn:moca:legal:nda-template",
  "version": "2.0.0",
  "title": "NDA Template",
  "composition": {
    "relates": [
      { "id": "urn:moca:legal:master-services-agreement", "relationship": "crossReferences" },
      { "id": "urn:moca:legal:prior-nda-v1",               "relationship": "supersedes" }
    ]
  }
}
```

`conflictsWith` is a legitimate, informative relationship value, not an
error state to be resolved by the schema. As with `epistemicStatus`
conflicts (core §7.2), MOCA surfaces the tension; arbitrating it is a
harness responsibility.

### A package MAY be composition-only

A package MAY declare `composition` with no content of its own beyond the
required manifest fields. This is the intended shape for a pure "joining"
package (e.g. the course above, if it contributes no content beyond
structure).

**This creates a direct conflict with the current Level 1 floor**, which
requires "at least one CommonMark file under `content/`" (core §3). This
proposal resolves it by amending the Level 1 floor to:

> A valid root `moca.json` containing `id`, `version`, and `title`, **and
> either** at least one CommonMark file under `content/` **or** a
> `composition` block referencing at least one other package.

### What Core does *not* specify

- **Resolution mechanism.** How a harness locates the package behind a
  referenced `id` (local file, registry lookup, database record) is
  explicitly out of scope, mirroring `augmentation.target`'s existing
  treatment. This preserves runtime neutrality (core §1) and the
  physical/virtual storage independence already established for a single
  package.
- **Version constraint syntax semantics.** `version` in `members` accepts
  a string; this proposal recommends (not mandates) semver-range syntax
  familiar from existing package ecosystems, but does not require a
  specific resolver behavior.
- **Domain-specific relationship semantics.** Whether `partOf` implies
  sequencing, whether `conflictsWith` needs jurisdiction/date scoping
  (relevant to a future legal profile) — these are profile or harness
  concerns, layered on top of the generic Core primitive via
  `profileData.<profile-name>` or a profile-defined ontology role, not
  additions to the `composition` shape itself.

### `moca-lint` limitations (documented, not implemented here)

`moca-lint` currently lints one target directory at a time. Cycle
detection (package A's composition includes package B which includes
package A) and dangling-reference checks across a `composition` block
require a multi-package/workspace lint mode that does not exist yet. This
proposal recommends documenting this as a known limitation, parallel to
the existing SHACL (`I301`) and signature-verification (`I404`) deferrals,
rather than blocking this proposal on building that mode first.

### Interaction with canonical package hashing

The canonical package hashing scheme (tracked as an open decision in
`ROADMAP.md`) has not yet been finalized. A composed package's content
identity plausibly needs to account for its members' digests transitively.
This proposal recommends designing composition and canonical hashing
together rather than sequentially, to avoid revising the digest scheme
once composition ships.

## Impact on existing conformance levels / profiles

This is additive: packages that declare no `composition` block are
unaffected. The Level 1 floor amendment only *widens* what qualifies (a
composition-only package now also satisfies Level 1), and does not
invalidate any existing package, which already satisfies the
content-file requirement.

Level 2/3 requirements are unaffected in this proposal. A future
follow-up could specify that `composition.relates[].relationship` is
interpretable as an RDF predicate at Level 2, analogous to `claims` (core
§7.4), but that is deferred rather than included here to keep this
proposal's scope minimal.

No existing profile is changed. The education profile (in development)
is expected to define `Course`/`Module` as ordinary MOCA packages linked
via `composition.members`, rather than inventing profile-specific
containment semantics — this proposal is a prerequisite for that profile
design.

## Alternatives considered

- **Reuse `augmentation`.** Rejected: `augmentation` is 1:1,
  MOCA-to-non-MOCA, and evidential ("augments"); composition is 1:many,
  MOCA-to-MOCA, and structural/associative. Conflating them would make
  both harder to reason about.
- **A separate "MOCA Catalog" artifact**, distinct from a MOCA package,
  that references package IDs without itself being a package. Rejected
  for now: this is more conservative and keeps package identity narrower,
  but course-from-modules is central enough to the near-term roadmap that
  it shouldn't wait on a separate catalog specification maturing. Worth
  revisiting once composition usage in the wild reveals whether a
  dedicated catalog layer is actually needed on top of it.
- **Domain-specific joining mechanisms per profile** (an education-specific
  containment field, a separate legal-specific relation field). Rejected:
  the mechanism itself is identical regardless of domain; only the
  relationship vocabulary and the referenced packages' `profileData`
  differ. A single generic Core primitive keeps linting, tooling, and the
  mental model uniform across every future domain.

## Implementation scope

If accepted, implementation touches only:

- `moca-core-spec.md` (§3 Level 1 floor amendment, §5.1 new `composition`
  property row, new §12).
- `schemas/core/moca.schema.json` (`composition` property and
  `compositionMember`/`compositionRelation` `$defs`).
- Two new example packages: one demonstrating `members` (a minimal
  course + two modules), one demonstrating `relates` (two independent
  documents with a `crossReferences`/`supersedes` pair).
- `tools/moca-lint/README.md`, documenting the multi-package lint gap as a
  known limitation.
- `docs/quickstart.md` and `CHANGELOG.md` cross-references.

This proposal does not change Level 2/3 requirements, does not modify
`augmentation`, does not implement multi-package `moca-lint` checks, and
does not finalize canonical package hashing (tracked separately).
