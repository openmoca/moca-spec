---
id: urn:node:service-boundaries
title: Service Boundaries and Isolation
concepts:
  - id: ex:ServiceBoundary
    role: primary
  - id: ex:Microservices
    role: supporting
epistemicStatus: sourced
summary: "Defines architectural rules for isolating service boundaries."
claims:
  - id: urn:claim:001
    subject: ex:OrderService
    predicate: ex:dependsOn
    object: ex:OrderDatabase
    epistemicStatus: sourced
    provenance:
      wasDerivedFrom: "./sources/architecture-spec.pdf"
      wasGeneratedBy: urn:activity:manual-extraction-2026-01
      generatedAtTime: "2026-01-15T00:00:00Z"
      wasAttributedTo: "urn:person:jsmith"
---
# Service Boundaries and Isolation

A service boundary defines the explicit ownership and data isolation
perimeter of a service. At Level 2, the `claims` block above is
interpretable as an RDF triple (`ex:OrderService ex:dependsOn
ex:OrderDatabase`) because this package declares a JSON-LD `@context` and a
domain ontology resolving the `ex:` prefix (see
[core §7.4](../../../moca-core-spec.md#74-explicit-claims-graph-claims)).
The `provenance` object resolves against the concrete PROV-O mapping in the
same section.
