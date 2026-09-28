# Structure

The optional structure layer says how a package's knowledge is organised:

- which concepts it covers;
- how they nest;
- what is part of what;
- the order steps come in;
- what requires what;
- what replaces what.

Readers use it to answer structure questions, to limit search to a topic,
and, through an application's strategy, for ontology-guided retrieval. The
normative rules are in
[package spec §5.6](../../spec/moca-package-spec.md#56-structure) and
[Reader contract §10](../../spec/moca-reader-contract.md#10-structure).

## Write `structure.ttl`

Put a Turtle file named `structure.ttl` at the package root. Use only these
terms; any others are ignored by Readers:

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix ir: <https://example.org/handbook/incident#> .

ir:IncidentResponse a skos:Concept ;
  skos:prefLabel "Incident response"@en ;
  dct:hasPart ir:AssessSeverity, ir:NotifyCustomers .

ir:ResponseSteps a skos:OrderedCollection ;
  skos:memberList ( ir:AssessSeverity ir:NotifyCustomers ) .

ir:AssessSeverity a skos:Concept ;
  skos:prefLabel "Assess severity"@en .

ir:NotifyCustomers a skos:Concept ;
  skos:prefLabel "Notify customers"@en ;
  dct:requires ir:AssessSeverity .
```

| To say | Use |
| --- | --- |
| A is a kind or subtopic of B | `A skos:broader B` |
| A and B are related | `A skos:related B` |
| B is part of A | `A dct:hasPart B` |
| These come in this order | an `skos:OrderedCollection` with `skos:memberList ( … )` |
| A requires B first | `A dct:requires B` |
| A supersedes B | `A dct:replaces B` |
| A should no longer be used | `A owl:deprecated true` |

**Rules to follow:**

- Declare every concept you mention with `a skos:Concept` (`O002`).
- Use IRIs under a domain you control, and absolute IRIs only (`O003`).
- Never use `owl:imports`.
- Don't make `requires`, `broader` or `hasPart` loop (`O005`).

## Bind nodes to concepts

```yaml
---
type: Procedure
title: Notify customers
moca:
  concepts:
    - iri: https://example.org/handbook/incident#NotifyCustomers
      role: primary
---
```

`primary` means the node is about the concept; `supporting` means it
mentions it.

## Check it

```sh
node tools/moca-lint/bin/moca-lint.js lint my-package            # O diagnostics, capability `structured`
node tools/moca-lint/bin/moca-lint.js structure my-package --write  # writes structure.json for Readers without RDF
```

Regenerate `structure.json` whenever `structure.ttl` changes. A Reader
reports a stale view as `O004`.

## Use it from a Reader

```js
const library = new Library().add(await readPackage('incident-response'));
const s = library.structure;
s.requires('https://example.org/handbook/incident#NotifyCustomers');  // [{ iri: …#AssessSeverity, label, layer: 'package' }]
s.sequence('https://example.org/handbook/incident#ResponseSteps');    // the steps, in order
s.nodes('https://example.org/handbook/incident#IncidentResponse', { include: 'parts' });

const search = new Search(library, { backend: new LexicalBackend(library), hooks: ontologyGuided() });
await search.search('when do we notify customers');
// notify-customers.md, then assess-severity.md with retrieval: { via: 'requires' }
```

`requires` describes; it never enforces. Whether a person may see something
depends on what they have done, and only your application knows that.

## Overlays

Your application, or the organisation running it, can add to a package's
structure without changing the package. Examples are its own concepts, extra
`requires`, or its own vocabulary:

```js
const library = new Library({ overlays: [{ id: 'acme', layer: 'organisation', path: 'acme-rules.ttl' }] });
```

Every structure answer names the layer that stated it: `package`,
`application` or `organisation`. Overlays are never part of the package's
digest or signatures. See
[ADR-0013](../adr/0013-package-application-organisation-layers.md).

## Your own retrieval strategy

The default `ontologyGuided` hooks are a starting point. A domain extension,
such as legal, procedures or courses, can supply its own `ingress` and
`egress`, for example following cross-references and amendments. The Reader's
gate still applies the retrieval policy to everything a hook adds. See
[ADR-0016](../adr/0016-pluggable-ontology-guided-retrieval.md).
