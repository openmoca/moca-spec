# MOCA Ontology profile

Profile URI: `https://w3id.org/moca/profiles/ontology/v1`
Status: Draft, `0.3.0-alpha.1`

## 1. Purpose

Some packages need a shared vocabulary, not just text. A service catalogue
names its services and how they relate; a policy corpus is organised by
regulation and obligation. This profile lets a package carry that vocabulary
as a SKOS concept scheme or an OWL ontology, bind nodes to its concepts, and
let search filter by concept.

It is the successor to the ontology support in the v0.1 draft, moved out of
core ([ADR-0009](../../docs/adr/0009-ontology-profile.md)). Core stays free of
RDF. Packages and Readers that do not use this profile are unaffected.

This profile is about **vocabulary**. For machine-readable **assertions**
("service A depends on database B, according to page 12"), use the
[claims profile](../claims/moca-claims-profile.md). A package can use both.

## 2. Layout

```text
ontologies/
└── <name>.ttl      SKOS or OWL, Turtle syntax
```

Ontology files are part of the package and covered by its digest. They SHOULD
live under `ontologies/`.

## 3. Package-level data

```json
{
  "profiles": {
    "https://w3id.org/moca/profiles/ontology/v1": {
      "files": [
        { "path": "ontologies/services.ttl", "role": "domain" },
        { "path": "ontologies/shapes.ttl", "role": "shapes" }
      ],
      "entryConcepts": ["https://example.org/services#ServiceBoundary"]
    }
  }
}
```

- `files` (required) lists every ontology file, as a package-relative path,
  with its role:

  | Role | Holds |
  | --- | --- |
  | `domain` | The concepts of the subject the package covers, and how they relate. |
  | `governance` | Constraints on compliance, safety or scope. |
  | `shapes` | SHACL shapes. Informative: see §6. |
  | `extension` | Supplementary vocabulary. |

- `entryConcepts` (optional) lists the concepts a reader of the package should
  start from, as absolute IRIs.

The JSON Schema is [profile.schema.json](profile.schema.json).

## 4. Node-level data

A node binds to concepts under its own `moca.profiles` entry:

```yaml
moca:
  profiles:
    https://w3id.org/moca/profiles/ontology/v1:
      concepts:
        - iri: https://example.org/services#ServiceBoundary
          role: primary
        - iri: https://example.org/services#Microservice
          role: supporting
```

`iri` is required and MUST be an absolute IRI. `role` is optional: `primary`
for what the node is about, `supporting` for what it mentions.

## 5. Rules

- **Turtle only, local only.** Files MUST be Turtle. A file MUST NOT use
  `owl:imports`. Every IRI in a file and every binding MUST be absolute once
  the file's own `@prefix` and `@base` declarations are applied, so a Reader
  never fetches or resolves anything outside the package.
- **Declared concepts.** A concept is declared when some listed file, in any
  role except `shapes`, contains a triple with that IRI as subject and
  `rdf:type` as predicate. Every binding and every entry concept MUST be
  declared.
- **Concept IRIs used across packages SHOULD be globally unique.** Two packages
  that define the same IRI differently are a data-quality problem for the
  consumer; the profile does not arbitrate.
- **Deprecation.** A deprecated concept SHOULD be marked `owl:deprecated true`,
  with its successor given by `dcterms:isReplacedBy`. A Reader MAY show the
  successor.

## 6. What a Reader that implements this profile does

1. Reads each listed file through the package source, never from outside the
   package.
2. Reports, all as warnings that never make a package invalid:
   - `O001_ONTOLOGY_UNPARSEABLE` for a listed file that is missing or not
     parseable Turtle;
   - `O002_CONCEPT_UNDECLARED` for a binding or entry concept that no file
     declares;
   - `O003_REMOTE_REFERENCE` for `owl:imports`, or an IRI that is not
     absolute.
3. Derives the `ontology` capability when the profile is declared and there
   is no `O` diagnostic ([package spec §11](../../spec/moca-package-spec.md#11-capabilities)).
4. Puts each node's absolute binding IRIs in its citation record's `concepts`
   ([Reader contract §7](../../spec/moca-reader-contract.md#7-citation-records)).
5. Filters search by concept when the caller asks
   ([Reader contract §9.2](../../spec/moca-reader-contract.md#92-the-search-entry-point)).
   A Reader MAY expand the caller's concepts over `skos:broader`,
   `skos:narrower` and `skos:related` before filtering, and MUST say so when
   it does.
6. Treats SHACL in `shapes` files as informative. It MUST NOT report a package
   as conforming to shapes it has not evaluated.

A Reader that does not implement the profile reports `F001` (info), reads the
package as core, and keeps the bindings as opaque profile data. It loses
nothing a core consumer needs.

## 7. Example

[examples/service-catalogue](examples/service-catalogue/moca.json) declares a
small SKOS scheme of services and binds two nodes to it.

## 8. Status

Draft. It will not be promoted until the
[outcome evaluation](../../docs/plans/01-outcome-evaluation.md) shows that
concept binding improves retrieval or citation accuracy enough to justify
authoring it.
