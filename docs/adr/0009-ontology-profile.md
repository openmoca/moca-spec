# 0009 — Optional ontology as a profile, with local files and absolute IRIs

- **Status:** Superseded by [0012](0012-structure-core.md)
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

The v0.1 draft carried ontology in core:
- an `ontologies/` directory with `domain`, `governance`, `shapes` and
  `extension` roles;
- manifest `entryConcepts`;
- node `concepts`;
- a JSON-LD `@context` that could be remote, with CURIEs throughout;
- SHACL that was declared but never evaluated.

v0.2 removed all of it. [MIGRATIONS.md](../../MIGRATIONS.md) sent that
material to the claims profile, but claims are nanopublications: assertions,
not a vocabulary. A concept scheme, and the binding of a node to its concepts,
had nowhere to go. OKF `tags` are plain strings.

The review behind v0.2 objected to three things:
- remote contexts, which let a package make a Reader fetch;
- CURIE resolution;
- declaring SHACL that nothing checks.

It asked for ontology to move to a profile, not to be deleted.

Concept-scoped search and domain structure are real needs. Examples are a
service catalogue whose nodes bind to service concepts, or a policy corpus
organised by regulation.

## Options

1. Leave ontology out of MOCA.
2. Restore it in core.
3. Define an ontology profile that uses only local files and absolute IRIs.

## Decision

Option 3. The profile URI is `https://w3id.org/moca/profiles/ontology/v1`
([profile](../../profiles/ontology/moca-ontology-profile.md)).

- **Files are local.** SKOS or OWL files in Turtle live inside the package,
  under `ontologies/`, and are covered by the digest. The manifest's profile
  entry lists each file with its role: `domain`, `governance`, `shapes` or
  `extension`.
- **Bindings are profile-owned.** A node binds to concepts under
  `moca.profiles["https://w3id.org/moca/profiles/ontology/v1"].concepts`, as a
  list of absolute IRIs with an optional role (`primary` or `supporting`).
  Nothing is added to the core `moca` mapping, so [package spec
  §9](../../spec/moca-package-spec.md#9-profiles) holds unchanged.
- **Nothing is fetched.** Remote `@context`, CURIEs, `owl:imports` and any IRI a
  Reader would have to dereference are forbidden. Turtle is the only syntax in
  v1; JSON-LD is deferred, because the common JSON-LD processors resolve remote
  contexts by default.
- **Profile problems never invalidate a package.** They are reported with the
  new `O` diagnostic family, all warnings, and they withhold the `ontology`
  capability.
- **A profile may define a capability.** `ontology` is the first such
  capability. Only a Reader that implements the profile derives it, and a
  Reader that doesn't simply never reports it.
- **Search gets a concept filter.** Expansion over `skos:broader`, `narrower`
  and `related` is allowed (MAY) but is not in the reference Reader for v1.
- **SHACL is informative** until a Reader evaluates it.
- **The profile stays Draft** until the outcome evaluation
  ([plan 01](../plans/01-outcome-evaluation.md)) shows a gain in retrieval or
  citation accuracy from concept binding.

## Consequences

- Ontology is available again without putting RDF back in core.
- There is no domain capture and no CURIE resolution, and nothing is declared
  that isn't checked.
- The reference Reader takes on a Turtle parser as a dependency.
- The claims profile and the ontology profile both use RDF, but for different
  things: claims are assertions, the ontology is vocabulary.
  [profiles/README.md](../../profiles/README.md) says which to use when.

## What would change this decision

- The outcome evaluation showing no gain from concept binding. The profile
  would then stay Draft, or be withdrawn.
- A JSON-LD processor that can be proven never to fetch. JSON-LD could then
  join Turtle.
