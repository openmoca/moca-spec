# [Spec] Define a Concrete PROV-O Mapping for `claims[]`

## Affected section(s)

- `moca-core-spec.md` §7.4 Explicit Claims Graph (`claims`) and §3
  Conformance Levels (Level 2 row, tightening the existing "`evidence` links
  resolve against PROV-O provenance records" language into a concrete
  mapping).
- `schemas/core/moca.schema.json`, adding an optional `provenance` object
  to the `claims[]` item `$def`.
- `examples/level-2-semantic/`, extending its existing `claims` usage with
  provenance fields.
- `docs/quickstart.md` "Going further" table.
- `CHANGELOG.md`.

## Problem

Core §2's standards-alignment table names W3C PROV-O as the standard behind
"Provenance & Auditability," and §3's Level 2 row states that "`evidence`
links resolve against PROV-O provenance records." Neither section says
*which* `claims[]` or `evidence[]` fields map to *which* PROV-O terms. As
written, a Level 2 implementer must invent their own mapping, which
defeats the purpose of naming PROV-O as the standard in the first place —
two independent Level 2 implementations could interpret the same `claims`
block as two different RDF graphs.

This is a generic gap, not tied to any one domain: any package using
`claims[]` at Level 2 needs the same answer to "what activity produced this
claim, and what was it derived from?"

## Proposed change

Add an optional `provenance` object to each `claims[]` entry (Core §7.4),
scoped to Level 2 RDF interpretation only — it has no normative effect at
Level 1, consistent with §3's existing statement that Level 1 claims are
"structured data only."

```yaml
claims:
  - id: urn:claim:001
    subject: ex:OrderService
    predicate: ex:dependsOn
    object: ex:OrderDatabase
    epistemicStatus: sourced
    evidence:
      - source: "./sources/architecture-spec.pdf"
        page: 12
    provenance:
      wasDerivedFrom: "./sources/architecture-spec.pdf"
      wasGeneratedBy: urn:activity:manual-extraction-2026-01
      generatedAtTime: "2026-01-15T00:00:00Z"
      wasAttributedTo: "urn:person:jsmith"
```

| Field | PROV-O term | Description |
|---|---|---|
| `wasDerivedFrom` | `prov:wasDerivedFrom` | Source entity the claim was derived from. At Level 2, this SHOULD align with (not duplicate the meaning of) the existing `evidence[].source` locator — it names the same source as an RDF entity reference rather than a file-relative path. |
| `wasGeneratedBy` | `prov:wasGeneratedBy` | The activity (extraction, review, inference) that produced the claim. An open URN/URI, not a closed vocabulary — Core does not mandate a taxonomy of activity types. |
| `generatedAtTime` | `prov:generatedAtTime` | ISO-8601 timestamp of the generating activity, distinct from a node's `validFrom`/`lastReviewed` (see `ISSUE-DRAFT-lifecycle.md`, if accepted), which describe the *content's* validity window rather than the *claim's* generation event. |
| `wasAttributedTo` | `prov:wasAttributedTo` | Agent (person, tool, or model identifier) responsible for the claim. Core does not require this to resolve to a real-world identity; a package MAY use a pseudonymous or tool-name URN. |

All four sub-fields are optional; a `claims[]` entry MAY omit `provenance`
entirely, matching the existing optionality of `evidence` on the same
entry.

### Level 2 interpretation

At Level 2, a `claims[]` entry with a `provenance` object is interpretable
as an RDF graph fragment: the claim itself becomes a `prov:Entity`, related
to a `prov:Activity` (`wasGeneratedBy`) and a `prov:Agent`
(`wasAttributedTo`) via the standard PROV-O predicates. This gives Level 2
implementers one unambiguous mapping instead of each inventing their own.

At Level 1, `provenance` (like the rest of `claims[]`) is structured data
only — present or absent, but not resolved against any RDF graph.

## Impact on existing conformance levels / profiles

This is additive: `claims[]` entries without a `provenance` object are
unaffected, and no existing package becomes non-conformant. This tightens
(makes concrete) but does not change the existing Level 2 requirement that
"evidence links resolve against PROV-O provenance records" — it gives that
sentence an actual field mapping to point to. No Level 1 or Level 3
requirement changes. No existing profile is changed.

## Alternatives considered

- **Leave the mapping unspecified / implementer-defined.** Rejected: this
  is the status quo and is the problem being solved — naming a standard
  without a concrete mapping does not give Level 2 implementations
  interoperable RDF output.
- **Require a full external PROV-O document (`ontologies/` role) instead of
  inline fields.** Rejected as the sole mechanism: it's heavier than most
  `claims[]` usage needs, and Core already has an `ontologies/` `governance`
  /`domain` role pattern (§6.2) for packages that do want a full provenance
  ontology alongside this lighter inline mapping. The two are not mutually
  exclusive — a package MAY do both.
- **Put provenance fields on `evidence[]` instead of `claims[]`.** Rejected:
  `evidence[]` already exists on both content nodes (§7.3) and `claims[]`
  entries (§7.4) as a locator to a *source*; provenance as proposed here
  describes the *generation event of the claim itself*, which is a
  different concern from where the claim's supporting evidence lives.

## Implementation scope

If accepted, implementation touches only:

- `moca-core-spec.md` (§7.4 new `provenance` sub-fields, §3 Level 2 row
  tightened to reference the concrete mapping).
- `schemas/core/moca.schema.json` (`provenance` object added to the
  `claims[]` item `$def`, all sub-fields optional).
- `examples/level-2-semantic/content/01-service-boundaries.md`, extended
  with one `provenance`-annotated claim.
- `docs/quickstart.md` and `CHANGELOG.md` cross-references.

This proposal does not change Level 1 or Level 3 requirements, does not
mandate `provenance` on any existing `claims[]` entry, and does not depend
on the `composition` or lifecycle-fields proposals being accepted (though
it cross-references the lifecycle proposal's `generatedAtTime` distinction
above for consistency if both land).
