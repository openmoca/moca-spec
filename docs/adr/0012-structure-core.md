# 0012 — A structure core in the package, and structure operations in the Reader

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))
- **Supersedes:** [0009](0009-ontology-profile.md)

## Context

Structured corpora share five structural ideas:

- **hierarchy**: topics and subtopics, systems and subsystems;
- **parts**: a handbook and its chapters, an act and its sections, a course
  and its modules;
- **order**: procedure steps, clause order, a learning path;
- **requires**: a safety check before a step, a test before a treatment, a
  foundation before an advanced topic;
- **replaces**: an amended clause, a superseded procedure.

Manuals and SOPs, legal and regulatory corpora, clinical guidelines,
onboarding and courses all need these ideas, which passes the admission test
([ADR-0011](0011-three-pillars-and-admission-test.md)).

In 0.3 structure lived in an open-ended ontology profile. Every package could
invent its own predicates, so structure was only portable in syntax. RDF
standardises how triples are written, not what a predicate like
`ex:prerequisite` means.

## Options

1. Keep an open-ended optional profile.
2. Define a small fixed vocabulary, built only from existing terms, that every
   Reader understands. Keep full ontologies optional.

## Decision

Option 2.

**Terms.** The structure core uses only existing terms. MOCA invents none:

| Idea | Terms |
| --- | --- |
| Concept, label, definition | `skos:Concept`, `skos:prefLabel`, `skos:definition` |
| Hierarchy | `skos:broader`, `skos:narrower` |
| Association | `skos:related` |
| Parts | `dcterms:hasPart`, `dcterms:isPartOf` |
| Order | `skos:OrderedCollection`, `skos:memberList` |
| Requires | `dcterms:requires`, `dcterms:isRequiredBy` |
| Replaces | `dcterms:replaces`, `dcterms:isReplacedBy` |
| Deprecated | `owl:deprecated` |

**Files.**

- `structure.ttl` at the package root holds the structure in Turtle, with
  absolute IRIs, no `owl:imports`, and nothing fetched.
- A package may also ship `structure.json`, a derived view in a fixed shape.
  It is for Readers without an RDF parser. Readers that can parse Turtle
  check the view against it.
- Structure is **optional**. A package of a manifest and content alone stays
  valid.

**Binding.** A node binds to concepts with `moca.concepts: [{ iri, role }]` in
its frontmatter. `role` is `primary` or `supporting`.

**Describes, never enforces.** `dcterms:requires` says that B requires A.
Whether a person may see B depends on runtime state, which belongs to the
application.

**Reader operations.** Each Reader answers these operations identically,
tested exactly by the corpus:

- `concept`
- `requires`
- `parts` and `narrower`
- `sequence`
- `nodes`
- search with a `scope`

**Capability.** `structured` is present when `structure.ttl` parses and every
binding resolves, with no `O` diagnostic.

**Ontology profile.** The ontology profile is reduced to extra vocabulary
files (OWL, SHACL) that a Reader passes through without interpreting.
Profile-defined capabilities are withdrawn.

## Consequences

- Structure becomes portable in meaning, not only in syntax.
- Every Reader needs a Turtle parser, or must rely on `structure.json`.
- Operations with one right answer can be tested exactly, unlike ranking.
- `moca.profiles[<ontology URI>].concepts` from 0.3 moves to `moca.concepts`,
  and profile ontology files move to `structure.ttl` (see
  [MIGRATIONS.md](../../MIGRATIONS.md)).

## What would change this decision

Two pilots in which structure-aware retrieval does not reduce scope
violations or order errors, measured by the
[outcome evaluation](../plans/01-outcome-evaluation.md). Structure would then
return to an optional profile.
