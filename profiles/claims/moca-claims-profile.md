# MOCA Claims profile

Profile URI: `https://w3id.org/moca/profiles/claims/v1`
Status: Draft, `0.2.0-alpha.1`

## 1. Purpose

Some consumers need machine-readable assertions, not just text: "service A
depends on database B, according to page 12 of the design review". This
profile carries them as [nanopublications](https://nanopub.net/), the
established format for a single assertion bundled with its provenance and
publication information, instead of inventing a claims model.

Core stays free of RDF. Packages and Readers that do not use this profile are
unaffected.

## 2. Layout

```text
claims/
└── <name>.trig      one or more nanopublications per file, TriG syntax
```

`claims/` is part of the package and covered by its digest.

## 3. Rules

Each nanopublication has the usual three named graphs: assertion, provenance
and publication info. In the provenance graph:

- `prov:wasDerivedFrom` SHOULD name the node the assertion comes from, by its
  node id (`<package id>#<path>`);
- evidence below node level SHOULD use a W3C Web Annotation selector on that
  node, the same selector types as `moca.evidence`.

Concept IRIs used across packages SHOULD be absolute and globally unique.
Two packages that define the same IRI differently are a data-quality problem
the consumer must handle; the profile does not arbitrate.

## 4. Package-level data

```json
{
  "profiles": {
    "https://w3id.org/moca/profiles/claims/v1": {
      "files": ["claims/architecture.trig"],
      "vocabularies": ["https://example.org/architecture#"]
    }
  }
}
```

`files` lists the TriG files; `vocabularies` lists the namespaces the
assertions use. Both are informative.

## 5. Status

Draft. It will not be promoted until an implementation reads it and the
[outcome evaluation](../../docs/plans/01-outcome-evaluation.md) shows
structured claims improve answers enough to justify authoring them.
