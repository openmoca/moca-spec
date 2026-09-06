# [Spec] Make Level 1 Span Bare Through Grounded CommonMark Content

## Affected section(s)

- `moca-core-spec.md` §3 Conformance Levels, §4.2 Localization Convention,
  and §7.1 CommonMark Knowledge Nodes.
- `schemas/core/moca.schema.json`, limited to the `@context` property
  description.
- A new `examples/level-1-bare/` package.
- `examples/level-1-minimal/`, by adding a README that describes it as the
  informal "grounded" Level 1 rung.
- `docs/quickstart.md`.
- `CHANGELOG.md`.

## Problem

The Level 1 row in `moca-core-spec.md` §3 currently requires grounded
CommonMark nodes bound to concepts through YAML frontmatter and a resolvable
inline `@context` prefix map. Section 5.1 already states the narrower,
conditional rule that `@context` is required only when a CURIE appears
anywhere in the package. These requirements are inconsistent for Level 1
packages that contain ordinary Markdown but use no CURIEs.

The current Level 1 floor is also higher than the adoption goal in
`ROADMAP.md` item 1. The roadmap calls for a valid `moca.json` and CommonMark
content to be sufficient, while keeping frontmatter, ontologies, claims,
profiles, signatures, embeddings, and indexes optional unless a higher
conformance level requires them. Requiring concept-binding frontmatter before
ordinary Markdown can conform makes existing documentation unnecessarily
costly to package and adopt.

## Proposed change

Keep the existing Level 1 conformance number and make it span a sliding scale
from bare content to fully grounded content.

The normative Level 1 floor will be:

- A valid root `moca.json` containing `id`, `version`, and `title`.
- At least one CommonMark file under `content/`.

YAML frontmatter is optional at Level 1. This includes `id`, `title`,
`concepts`, `epistemicStatus`, `summary`, `evidence`, and `claims`. When a
content node has no frontmatter `id`, a harness derives its identity from the
file's relative path within `content/`. An `@context` remains required when a
CURIE appears anywhere in the package and is not required when no CURIE is
used.

The Level 1 row in §3 will state only this minimum floor and that richer
frontmatter is optional, additive enrichment, with a forward reference to
§7.1. The following informal rungs will be used only in documentation and
examples, not as normative conformance levels:

- **Bare:** no frontmatter; node identity comes from the relative content
  path. This supports wrapping existing documentation and optional
  vector-based search through a `.moca.idx` sidecar.
- **Identified:** optional `id` and `title` frontmatter.
- **Grounded:** concept-binding and richer metadata, matching the current
  Level 1 example.

Section 4.2 will clarify that filename-based locale matching and fallback work
the same whether a node has a frontmatter `id` or uses path-derived identity.
Section 7.1 will define the optional fields and path fallback explicitly.

The manifest's optional entryConcepts field is unaffected by this change: it remains valid to declare and simply has no applicable targets in a package that uses no concept-bound frontmatter.

This change lowers the minimum Level 1 authoring requirement. It does not
introduce a new conformance level or weaken validation of optional metadata
when that metadata is present.

## Impact on existing conformance levels / profiles

This change is backward-compatible and does not invalidate any existing MOCA
package. Existing Level 1 packages with concept-bound YAML frontmatter and an
inline `@context` remain conformant as richer examples of the same level.

Level 2 and Level 3 requirements do not change. In particular, ontology,
SHACL, RDF interpretation, Web Annotation, integrity, signature, and
skill-related requirements remain as currently specified. No profile is
changed, and profile packages that already conform continue to do so.

moca-lint's Level 1 checks currently enforce concept-binding frontmatter and must be updated to treat concepts, epistemicStatus, summary, evidence, and claims as optional, consistent with this change; that update is tracked as a follow-up in the linter's own repository/task list and is not part of this proposal's implementation scope.

## Alternatives considered

A new "Level 0" tier was considered and rejected because it would mix a
metadata-richness axis with the existing standards-based Level 1/2/3 ladder;
require renumbering or cross-reference churn in `examples/`, the README
conformance table, `docs/quickstart.md`, `CONTRIBUTING.md`, and
`GOVERNANCE.md`; and collide confusingly with the `0.1.0-beta.1` specification
version numbering.

## Implementation scope

If this proposal is accepted, implementation will touch only:

- `moca-core-spec.md` (§3, §4.2, and §7.1).
- `schemas/core/moca.schema.json` (`@context` description only; no change to
  the schema-level `required` array is needed).
- A new `examples/level-1-bare/` package containing a three-field manifest,
  one frontmatter-free Markdown file, and a README.
- `examples/level-1-minimal/README.md`, identifying the existing example as
  the informal grounded rung.
- `docs/quickstart.md`, restructured to begin with the bare minimum and then
  add optional identity and concept-grounding.
- `CHANGELOG.md`, under `[Unreleased]` > `Changed`.

This proposal does not change Level 2 or Level 3 requirements, modify
`profiles/`, add a new conformance-level number, or introduce a declared
conformance level in `moca.json`.
