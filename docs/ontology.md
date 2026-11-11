# Ontology for AI retrieval

An ontology says what the topics in a body of knowledge are and how they
relate: which are kinds of others, what is part of what, which steps come in
which order, and what must be understood or done before something else.
Retrieval that ignores this answers with a step out of order, or skips the
check a step depends on.

**In MOCA, the ontology is an optional layer of the package**: a small RDF
file, `structure.ttl`, with each page bound to the topics it covers. Every
Reader answers questions about it the same way, can limit a search to one
topic, and can add what a result requires. It is the "Ontology" in Modular
Ontology, Content & Attestation.

## A small core everyone agrees on

Readers understand a deliberately small set of W3C SKOS and Dublin Core
terms, so every Reader reaches the same answer:

| Idea | Terms |
| --- | --- |
| Topics and their names | `skos:Concept`, `skos:prefLabel`, `skos:definition` |
| Kinds and subtopics | `skos:broader`, `skos:narrower` |
| Related topics | `skos:related` |
| Parts | `dcterms:hasPart`, `dcterms:isPartOf` |
| Order | `skos:OrderedCollection`, `skos:memberList` |
| Prerequisites | `dcterms:requires`, `dcterms:isRequiredBy` |
| Replacements | `dcterms:replaces`, `owl:deprecated` |

**Any other vocabulary travels too.** The same file can carry OWL, SHACL,
PROV-O, or your own domain terms. Readers ignore what they do not understand;
it stays in the package, covered by the digest, for applications that do.

## What it does for retrieval

- **Structure questions with one right answer.** What does notifying customers
  require? What are the steps, in order? Which pages cover this topic and its
  parts? Every Reader answers identically, and the conformance corpus tests it.
- **Search within a topic.** `scope` limits a search to one concept and
  everything under it.
- **Ontology-guided retrieval.** Pluggable hooks run before and after search.
  The default strategy narrows a search to a topic the question names, and
  adds the pages each result requires, tagged so an application can show them
  as "do this first". A domain can supply its own strategy, for example for
  law, procedures or courses
  ([write your own hooks](guides/structure.md#7-write-your-own-hooks)).
- **Your own rules on top.** An application or organisation can add concepts
  and prerequisites as an overlay, without changing the signed package. Every
  answer says which layer stated it.

`requires` describes; it never enforces. Whether a person may see a step
depends on what they have done, which only the application knows.

## Where it pays off

Procedures and manuals (steps and checks), regulations (clauses and
cross-references), clinical pathways (tests before treatments), and courses
(modules and prerequisites). A flat FAQ does not need one.

## See it

- The [structure guide](guides/structure.md) writes, checks and uses an
  ontology, with code in TypeScript, .NET and Python.
- [Try OpenMOCA](https://try.openmoca.org/p/flying-handbook) shows the FAA's
  Airplane Flying Handbook with a 72-concept ontology: each topic shows what
  it builds on.
- [Package spec §5.6](../spec/moca-package-spec.md#56-structure) has every
  rule.
