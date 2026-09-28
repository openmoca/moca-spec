# MOCA Ontology profile

Profile URI: `https://w3id.org/moca/profiles/ontology/v1`
Status: Draft, `0.4.0-alpha.1`

## 1. Purpose

Since 0.4, the structure every Reader understands lives in the package's
`structure.ttl`: concepts, hierarchy, parts, order, `requires` and
`replaces`, built from SKOS and DCMI terms
([package spec §5.6](../../spec/moca-package-spec.md#56-structure),
[ADR-0012](../../docs/adr/0012-structure-core.md)).

This profile is for everything beyond that core. Examples:

- a full OWL ontology;
- SHACL shapes;
- the classes and properties of a domain vocabulary.

A package can carry these files for the applications that use them. Readers
do not interpret them. The profile also records which files they are and what
role each plays.

## 2. Layout

```text
ontologies/
└── <name>.ttl      OWL, SKOS or SHACL, in Turtle
```

Ontology files are part of the package and covered by its digest. They SHOULD
live under `ontologies/`.

## 3. Package-level data

```json
{
  "profiles": {
    "https://w3id.org/moca/profiles/ontology/v1": {
      "files": [
        { "path": "ontologies/domain.ttl", "role": "domain" },
        { "path": "ontologies/shapes.ttl", "role": "shapes" }
      ]
    }
  }
}
```

| Role | Holds |
| --- | --- |
| `domain` | Classes and properties of the subject the package covers. |
| `governance` | Constraints on compliance, safety or scope. |
| `shapes` | SHACL shapes. Informative: a Reader never reports a package as conforming to them. |
| `extension` | Supplementary vocabulary. |

The JSON Schema is [profile.schema.json](profile.schema.json).

## 4. What a Reader does

- **A Reader that recognises the profile:** it does not report `F001`, and it
  passes the files through untouched. Structure operations use only
  `structure.ttl` and host-supplied overlays, never these files.
- **Files follow the same rules as `structure.ttl`:** Turtle only, absolute
  IRIs, no `owl:imports`, nothing fetched.
- **Application-specific meaning belongs in an overlay.** Rules, tracking
  verbs and domain vocabulary that an application layers onto a package's
  structure are supplied by the host, not by the package
  ([ADR-0013](../../docs/adr/0013-package-application-organisation-layers.md)).

## 5. Status

Draft. The claims profile (nanopublications), which this profile was once
contrasted with, was removed in 0.4
([ADR-0015](../../docs/adr/0015-park-unconsumed-features.md)).
