# The moca: vocabulary

`https://w3id.org/moca/ns#`, written `moca:`: the few RDF terms of the MOCA
specification that no existing vocabulary has. Everything else a package's
`structure.ttl` uses comes from SKOS, Dublin Core, OWL and schema.org
([package spec §5.6](../spec/moca-package-spec.md#56-structure)).

The vocabulary is also published as Turtle, [`ns.ttl`](ns.ttl), at
`https://w3id.org/moca/ns` for a client that asks for `text/turtle`. Readers
never fetch it: a term's IRI is a name, and resolving it is a convenience for
people and tools
([package spec §13.4](../spec/moca-package-spec.md#134-identifier-control)).

| Term | Since | Defined in |
| --- | --- | --- |
| [`moca:defaultEdition`](#mocadefaultedition) | 0.8.0 | [Package spec §7.4](../spec/moca-package-spec.md#74-edition-groups) |

<a id="defaultEdition"></a>

## moca:defaultEdition

**IRI:** `https://w3id.org/moca/ns#defaultEdition`

The edition a slot shows when no edition is in the reader's language. A slot
is a concept in a composite package's `structure.ttl` whose
`schema:workExample` values are member packages that are editions of one work;
`moca:defaultEdition` names one of them.

- **Subject:** a slot, a `skos:Concept` with `schema:workExample` values.
- **Value:** one of the slot's `schema:workExample` values: a member package's
  `id`.
- **At most one per slot.** A value that is not one of the slot's editions,
  or a second one, is reported as `O006_EDITION_GROUP_INVALID` and ignored.

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix schema: <https://schema.org/> .
@prefix moca: <https://w3id.org/moca/ns#> .

<https://example.com/course#bread> a skos:Concept ;
  schema:workExample <https://example.com/bread-en> , <https://example.com/bread-fr> ;
  moca:defaultEdition <https://example.com/bread-en> .
```

## Adding a term

A new term needs a Spec Change Proposal ([CONTRIBUTING.md](../CONTRIBUTING.md)),
and only when no existing vocabulary has one that fits. A term is never
renamed or removed; a term that should no longer be used is marked
`owl:deprecated true` here.
