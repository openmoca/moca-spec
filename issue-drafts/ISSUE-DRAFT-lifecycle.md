# [Spec] Add Optional Lifecycle Fields (`validFrom`, `lastReviewed`, `supersedes`)

## Affected section(s)

- `moca-core-spec.md` §5.1 Manifest Properties and §6.4 Concept Lifecycle
  (cross-reference only), and a new §7.5 Content Node Lifecycle Fields.
- `schemas/core/moca.schema.json`, adding optional properties to the
  manifest and to content-node frontmatter.
- `examples/level-1-minimal/` or `examples/level-2-semantic/`, adding a
  brief lifecycle-field usage snippet.
- `docs/quickstart.md` "Going further" table.
- `CHANGELOG.md`.

## Problem

Core §6.4 already lets a *concept* be marked deprecated or superseded via
its ontology definition (`owl:deprecated`, `skos:historyNote`,
`dcterms:isReplacedBy`). There is no equivalent for a *manifest* or a
*content node* itself: nothing records when a package's content became
valid, when it was last reviewed for accuracy, or which package/node it
replaces.

This matters independently of any one domain. A harness combining several
packages needs a portable way to answer "is this still current?" and "has
something newer replaced this?" without inventing ad hoc `profileData`
fields per profile, which would fragment the same basic freshness question
across every domain that needs it.

## Proposed change

Add three optional, domain-agnostic fields, usable at the manifest level
and, where noted, at the content-node frontmatter level (Core §7.1).

### Manifest-level (`moca.json`)

```json
{
  "id": "urn:moca:example:system-design",
  "version": "2.0.0",
  "title": "System Architecture Knowledge",
  "validFrom": "2026-01-15T00:00:00Z",
  "lastReviewed": "2026-08-01T00:00:00Z",
  "supersedes": "urn:moca:example:system-design@1.x"
}
```

| Field | Type | Description |
|---|---|---|
| `validFrom` | String (ISO-8601) | When this package's content became authoritative. Distinct from `created`/`modified` (§5.1), which describe file authorship history, not content validity. |
| `lastReviewed` | String (ISO-8601) | When a human or defined process last confirmed the content's continued accuracy. Absence does not imply the content is unreviewed elsewhere; it means Core has no record of one. |
| `supersedes` | String (URN/URI) / Array of Strings | Package `id` (optionally version-scoped) that this package replaces. Directional, matching `composition.relates`'s `supersedes` relationship value where one exists — see "Relationship to composition" below. |

### Content-node level (frontmatter, Core §7.1)

The same three fields are optionally usable in a content node's YAML
frontmatter, scoped to that node rather than the whole package, for packages
where individual nodes age independently of the manifest as a whole:

```markdown
---
id: urn:node:service-boundaries
title: Service Boundaries and Isolation
validFrom: 2025-11-01T00:00:00Z
lastReviewed: 2026-07-15T00:00:00Z
---
```

A harness MUST treat these fields as informational metadata only — Core
does not mandate that a harness exclude, downrank, or otherwise change how
it treats content based on `validFrom`/`lastReviewed` age or the presence of
`supersedes`. This mirrors the existing `epistemicStatus` conflict-resolution
stance (Core §7.2): MOCA surfaces the signal, harnesses decide what to do
with it.

### Relationship to `composition.relates` (if accepted)

If the `composition` proposal (`ISSUE-DRAFT-composition.md`) is also
accepted, its `relates[].relationship: "supersedes"` value expresses the
same directional relationship between two independent packages. The two
mechanisms are not redundant:

- `composition.relates` records a relationship *to another package's `id`*,
  useful when the two packages otherwise have no relation and the
  supersession is the only link.
- Manifest-level `supersedes` (this proposal) is a lighter-weight,
  single-value shorthand that does not require standing up a full
  `composition` block just to record a lineage pointer.

Neither is required to fill in the other. A package MAY use one, both, or
neither.

## Impact on existing conformance levels / profiles

This is additive: packages that declare none of these fields are
unaffected, and no existing package becomes non-conformant. No Level 1/2/3
requirement changes. No existing profile is changed. A future profile MAY
add stricter freshness requirements (e.g. an EU AI Act governance profile
mandating `lastReviewed` within a rolling window) layered on top of this
generic primitive, rather than inventing a profile-specific field for the
same purpose.

## Alternatives considered

- **Fold into `profileData`.** Rejected: freshness/lineage is not
  domain-specific — every profile that has content drift or versioned
  replacement needs the same three facts, so per-profile duplication would
  be worse than one small additive Core vocabulary.
- **Reuse `created`/`modified` instead of new fields.** Rejected:
  `created`/`modified` describe file/manifest authorship history (per
  §5.1's existing description), not content validity or review status.
  Overloading them would break existing implementations that rely on their
  narrower meaning.
- **Mandate harness behavior on `supersedes`/staleness.** Rejected, for the
  same reason Core does not arbitrate `epistemicStatus` conflicts (§7.2):
  mandating exclusion or downranking policy would require Core to take a
  position on retrieval strategy, which belongs to the AI Harness layer
  (§1.1), not the package format.

## Implementation scope

If accepted, implementation touches only:

- `moca-core-spec.md` (§5.1 new field rows, new §7.5).
- `schemas/core/moca.schema.json` (three optional properties on the
  manifest `$defs` and on the content-node frontmatter `$defs`).
- One example package annotated with `validFrom`/`lastReviewed` and, if
  a suitable versioned pair exists, `supersedes`.
- `docs/quickstart.md` and `CHANGELOG.md` cross-references.

This proposal does not change Level 2/3 requirements, does not mandate any
harness behavior in response to these fields, and does not depend on the
`composition` proposal being accepted (the two are independently useful,
though cross-referenced above for consistency if both land).
