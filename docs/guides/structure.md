# Structure

Search finds pages that match the words of a question. It does not know that
a procedure has steps in order, that one step must come before another, or
that a topic has parts. Without that, an assistant can answer with step 3 and
skip the check that step 1 requires.

A package's optional **structure layer** says how its knowledge is organised:

- which topics (**concepts**) it covers, and how they nest;
- what is part of what;
- the order steps come in;
- what requires what;
- what replaces what.

Every Reader answers questions about it the same way, can limit a search to
one topic, and can use it to add what a result depends on. This guide uses
[`examples/handbook/incident-response`](../../examples/handbook/incident-response),
a four-step incident procedure. Every command and output below was run with the
0.6.0 tools, and the code was run in all three Readers, which print the same
thing.

To follow along, download the example:

```sh
curl -fsSLO https://github.com/openmoca/moca-spec/releases/latest/download/handbook-incident-response.moca
```

## 1. Write `structure.ttl`

Structure is a Turtle (RDF) file named `structure.ttl` at the package root.
The example's:

```turtle
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix ir: <https://example.org/handbook/incident#> .

ir:IncidentResponse a skos:Concept ;
  skos:prefLabel "Incident response"@en ;
  dct:hasPart ir:AssessSeverity, ir:DeclareIncident, ir:NotifyCustomers, ir:ResolveAndReview .

ir:ResponseSteps a skos:OrderedCollection ;
  skos:prefLabel "Incident response steps"@en ;
  skos:memberList ( ir:AssessSeverity ir:DeclareIncident ir:NotifyCustomers ir:ResolveAndReview ) .

ir:AssessSeverity a skos:Concept ;
  skos:prefLabel "Assess severity"@en .

ir:DeclareIncident a skos:Concept ;
  skos:prefLabel "Declare the incident"@en ;
  dct:requires ir:AssessSeverity .

ir:NotifyCustomers a skos:Concept ;
  skos:prefLabel "Notify customers"@en ;
  dct:requires ir:AssessSeverity .

ir:ResolveAndReview a skos:Concept ;
  skos:prefLabel "Resolve and review"@en .
```

In words: incident response has four parts, they come in this order, and
both declaring the incident and notifying customers require the severity to be
assessed first.

Every Reader understands these terms, from W3C SKOS and Dublin Core:

| To say | Write |
| --- | --- |
| A is a topic, with a name | `A a skos:Concept ; skos:prefLabel "Name"@en` (and `skos:definition` for a definition) |
| A is a kind or subtopic of B | `A skos:broader B` |
| A and B are related | `A skos:related B` |
| B is part of A | `A dct:hasPart B` |
| These come in this order | an `skos:OrderedCollection` with `skos:memberList ( … )` |
| A requires B first | `A dct:requires B` |
| A replaces B | `A dct:replaces B` |
| A should no longer be used | `A owl:deprecated true` |

The file can carry any other vocabulary too, such as OWL, SHACL, PROV-O or your
own terms. Readers ignore what they do not understand, and it travels in the
package for applications that do.

**Rules:**

- Declare every concept you use with `a skos:Concept` (`O002`).
- Use absolute IRIs under a domain you control (`O003`), and never
  `owl:imports`: a Reader never fetches anything.
- Don't let `requires`, `broader` or `hasPart` go round in a loop (`O005`).

**Retiring a concept doesn't retire its pages.** `owl:deprecated` and
`dct:replaces` describe the concept; Readers report them, and search still
returns the pages bound to it. To take a page out of search, mark the page
`status: deprecated` or give it a `moca.valid_until`. `moca-lint` warns
(`LINT_RETIRED_CONCEPT`) when a page's primary concept is retired and the page
is not. The full list of signals and their effects is in
[package spec §5.5](../../spec/moca-package-spec.md#55-trust-fields).

## 2. Bind pages to concepts

Each page says which concepts it is about, under `moca.concepts`:

```markdown
---
type: Procedure
title: Notify customers
moca:
  concepts:
    - iri: https://example.org/handbook/incident#NotifyCustomers
      role: primary
---

# Notify customers

Post a status update that states the affected journeys and the next update time.
```

`role` is `primary` when the page is about the concept, and `supporting` when
it only mentions it. A page can be bound to several concepts, and a concept
can have several pages.

## 3. Check it

```sh
npx @openmoca/moca-lint lint incident-response
```

```text
No findings.

sha256:2af099d05f6c26fa588ae72e5e56561f23513584781a3a3870afd59125f93ccb
capabilities: core, structured
```

`structured` means the structure parsed and every binding resolved. Any
structure problem withholds it. This is a concept used but not declared:

```text
structure.ttl
  WARNING O002_CONCEPT_UNDECLARED  https://example.org/handbook/incident#ResolveAndReview is used in a relation but not declared as a skos:Concept
content/steps/resolve-and-review.md
  WARNING O002_CONCEPT_UNDECLARED  concept https://example.org/handbook/incident#ResolveAndReview is not declared in structure.ttl

0 error(s), 2 warning(s), 0 info

sha256:42caaf6ad6b4c88fb10afa6d27f8cada7f36fc9d0d2df17c3b0b9fb2efbcbcc9
capabilities: core
```

**Optional: see it as JSON.** To read the structure as sorted JSON, print it:

```sh
npx @openmoca/moca-lint structure incident-response
```

This is for reading only. Don't ship it as `structure.json`: Readers read
structure from `structure.ttl` alone, and a `structure.json` is just another
file in the package.

## 4. Ask the structure questions

Every Reader answers the same structure questions, and they have exactly one
right answer, so the conformance corpus tests them exactly
([Reader contract §10](../../spec/moca-reader-contract.md#10-structure)):
what a concept requires, the steps in order, and the pages for a topic and its
parts.

<!-- tabs -->

**TypeScript:**

```js
import { readPackage, Library, Search, LexicalBackend, ontologyGuided } from '@openmoca/moca-core';

const IR = 'https://example.org/handbook/incident#';
const pkg = await readPackage('handbook-incident-response.moca');
const library = new Library().add(pkg);
const structure = library.structure;

console.log('requires:', structure.requires(IR + 'NotifyCustomers').map((c) => c.label).join(', '));
console.log('sequence:', structure.sequence(IR + 'ResponseSteps').map((c) => c.label).join(', '));
console.log('nodes:   ', structure.nodes(IR + 'IncidentResponse', { include: 'parts' }).map((r) => r.node.path).join(', '));
```

**.NET:**

```csharp
using OpenMoca.Reader;
using OpenMoca.Reader.Search;
using OpenMoca.Reader.Structure;

const string IR = "https://example.org/handbook/incident#";
var pkg = await MocaReader.ReadPackageAsync("handbook-incident-response.moca");
var library = new Library().Add(pkg);
var structure = library.Structure;

Console.WriteLine($"requires: {string.Join(", ", structure.Requires(IR + "NotifyCustomers").Select(c => c.Label))}");
Console.WriteLine($"sequence: {string.Join(", ", (structure.Sequence(IR + "ResponseSteps") ?? []).Select(c => c.Label))}");
Console.WriteLine($"nodes:    {string.Join(", ", structure.Nodes(IR + "IncidentResponse", include: "parts").Select(r => r.Node.Path))}");
```

**Python:**

```python
from moca_reader import LexicalBackend, Library, Overlay, Search, ontology_guided, read_package

IR = "https://example.org/handbook/incident#"
pkg = read_package("handbook-incident-response.moca")
library = Library().add(pkg)
structure = library.structure

print("requires:", ", ".join(c["label"] for c in structure.requires(IR + "NotifyCustomers")))
print("sequence:", ", ".join(c["label"] for c in structure.sequence(IR + "ResponseSteps") or []))
print("nodes:   ", ", ".join(r["node"]["path"] for r in structure.nodes(IR + "IncidentResponse", include="parts")))
```

<!-- /tabs -->

```text
requires: Assess severity
sequence: Assess severity, Declare the incident, Notify customers, Resolve and review
nodes:    incident-response.md, steps/assess-severity.md, steps/declare-incident.md, steps/notify-customers.md, steps/resolve-and-review.md
```

`nodes` returns citation records, with the retrieval policy applied, so they
can be cited like any search result. The other operations are `concept`,
`requiredBy`, `parts`, `narrower` and `broader` (both optionally transitive)
and `related`. Each concept they return carries its `iri`, its `label`, and
the `layer` that stated it (step 6).

## 5. Search with structure

Structure changes search in two ways:

- **Within a topic.** `scope` limits a search to one concept and everything
  under it.
- **Ontology-guided.** The default `ontologyGuided` strategy plugs into search
  as two hooks. Before the search, it narrows to any concept the question
  names; after it, it adds the pages each result requires, tagged
  `retrieval.via: requires`.

<!-- tabs -->

**TypeScript:**

```js
const search = new Search(library, { backend: new LexicalBackend(library) });
const plain = await search.search('notify customers', { limit: 3 });
console.log('plain:   ', plain.map((r) => r.node.path).join(', '));
const scoped = await search.search('customers', { scope: IR + 'NotifyCustomers' });
console.log('scoped:  ', scoped.map((r) => r.node.path).join(', '));

const guided = new Search(library, { backend: new LexicalBackend(library), hooks: ontologyGuided() });
const hits = await guided.search('notify customers', { limit: 3 });
console.log('guided:  ', hits.map((r) => `${r.node.path} (${r.retrieval.via})`).join(', '));
```

**.NET:**

```csharp
var search = new MocaSearch(library, new LexicalBackend(library));
var plain = await search.SearchAsync("notify customers", new SearchOptions { Limit = 3 });
Console.WriteLine($"plain:    {string.Join(", ", plain.Select(r => r.Node.Path))}");
var scoped = await search.SearchAsync("customers", new SearchOptions { Scope = IR + "NotifyCustomers" });
Console.WriteLine($"scoped:   {string.Join(", ", scoped.Select(r => r.Node.Path))}");

var guided = new MocaSearch(library, new LexicalBackend(library), hooks: OntologyGuided.Hooks());
var hits = await guided.SearchAsync("notify customers", new SearchOptions { Limit = 3 });
Console.WriteLine($"guided:   {string.Join(", ", hits.Select(r => $"{r.Node.Path} ({r.Retrieval?.Via})"))}");
```

**Python:**

```python
search = Search(library, LexicalBackend(library))
plain = search.search("notify customers", limit=3)
print("plain:   ", ", ".join(r["node"]["path"] for r in plain))
scoped = search.search("customers", scope=IR + "NotifyCustomers")
print("scoped:  ", ", ".join(r["node"]["path"] for r in scoped))

guided = Search(library, LexicalBackend(library), hooks=ontology_guided())
hits = guided.search("notify customers", limit=3)
print("guided:  ", ", ".join(f"{r['node']['path']} ({r['retrieval']['via']})" for r in hits))
```

<!-- /tabs -->

```text
plain:    steps/notify-customers.md, incident-response.md, steps/assess-severity.md
scoped:   steps/notify-customers.md
guided:   steps/notify-customers.md (search), steps/assess-severity.md (requires)
```

The plain search finds pages by their words: the overview, and "assess
severity" because it mentions customers. The guided search names the
concept, finds the page about notifying customers, and adds assessing
severity *because notifying requires it*, saying so in `retrieval.via`. An
application can show it as "do this first".

**`requires` describes; it never enforces.** Whether a person may see a step
depends on what they have done, and only your application knows that. The
Reader's trust checks still run after both hooks, so a hook can never add
content the retrieval policy or the audience would remove.

## 6. Add your own rules with an overlay

Your application, or the organisation running it, can add to a package's
structure without changing the package: its own concepts, extra `requires`,
or its own vocabulary. Acme's rule is that the review cannot start until the
incident has been declared:

<!-- tabs -->

**TypeScript:**

```js
const acme = new Library({
  overlays: [{
    id: 'acme', layer: 'organisation',
    source: `@prefix dct: <http://purl.org/dc/terms/> .
<${IR}ResolveAndReview> dct:requires <${IR}DeclareIncident> .`,
  }],
}).add(pkg);
console.log('overlay: ', acme.structure.requires(IR + 'ResolveAndReview').map((c) => `${c.label} (${c.layer})`).join(', '));
```

An overlay can also be a file: `{ id, layer, path: 'acme-rules.ttl' }`.

**.NET:**

```csharp
var acme = new Library(new LibraryOptions
{
    Overlays = [new StructureOverlay("acme", "organisation", $"""
        @prefix dct: <http://purl.org/dc/terms/> .
        <{IR}ResolveAndReview> dct:requires <{IR}DeclareIncident> .
        """)],
}).Add(pkg);
Console.WriteLine($"overlay:  {string.Join(", ", acme.Structure.Requires(IR + "ResolveAndReview").Select(c => $"{c.Label} ({c.Layer})"))}");
```

**Python:**

```python
acme = Library(
    overlays=[
        Overlay(
            id="acme",
            layer="organisation",
            source=f"""@prefix dct: <http://purl.org/dc/terms/> .
<{IR}ResolveAndReview> dct:requires <{IR}DeclareIncident> .""",
        )
    ]
).add(pkg)
print("overlay: ", ", ".join(f"{c['label']} ({c['layer']})" for c in acme.structure.requires(IR + "ResolveAndReview")))
```

An overlay can also be a file: `Overlay(id=..., layer=..., path="acme-rules.ttl")`.

<!-- /tabs -->

```text
overlay:  Declare the incident (organisation)
```

Every structure answer names the layer that stated it: `package`,
`application` or `organisation`. Overlays are never part of the package's
digest or signatures, and a package can never load one
([ADR-0008](../adr/0008-package-application-organisation-layers.md)).

## 7. Write your own hooks

`ontologyGuided` is a starting point. An application, or a domain extension for
law, procedures or courses, can supply its own hooks
([ADR-0010](../adr/0010-pluggable-ontology-guided-retrieval.md)):

- **`ingress(query, context)`** runs before the backend. It may return a new
  `query`, `concepts` to search, or a `scope`. Return nothing to leave the
  search as it is.
- **`egress(candidates, context)`** runs after the backend. It returns the
  candidates, in any order, and may add records found through the structure.
- **`context`** is read-only: the request, the library, its `structure`, the
  audiences and the time.

Acme's staff say "triage" and "status page", words the package never uses. An
ingress hook maps them onto the package's concepts, and an egress hook puts
the results in the order of the response steps:

<!-- tabs -->

**TypeScript:**

```js
import { readPackage, Library, Search, LexicalBackend } from '@openmoca/moca-core';

const IR = 'https://example.org/handbook/incident#';
const pkg = await readPackage('handbook-incident-response.moca');
const library = new Library().add(pkg);

// Ingress: the organisation's own words for the package's concepts.
const OUR_WORDS = { triage: IR + 'AssessSeverity', 'status page': IR + 'NotifyCustomers' };

const hooks = {
  ingress(query) {
    const q = query.toLowerCase();
    const concepts = Object.entries(OUR_WORDS).filter(([word]) => q.includes(word)).map(([, iri]) => iri);
    return concepts.length > 0 ? { concepts } : {};
  },
  // Egress: put the results in the order of the response steps.
  egress(candidates, ctx) {
    const steps = (ctx.structure.sequence(IR + 'ResponseSteps') ?? []).map((c) => c.iri);
    const position = (r) => {
      const i = Math.min(...(r.concepts ?? []).map((c) => steps.indexOf(c)).filter((n) => n >= 0));
      return Number.isFinite(i) ? i : steps.length;
    };
    return [...candidates].sort((a, b) => position(a) - position(b));
  },
};

const question = 'what goes on the status page after triage';
const plain = await new Search(library, { backend: new LexicalBackend(library) }).search(question, { limit: 3 });
console.log('plain: ', plain.map((r) => r.node.path).join(', '));
const ours = await new Search(library, { backend: new LexicalBackend(library), hooks }).search(question, { limit: 3 });
console.log('hooks: ', ours.map((r) => r.node.path).join(', '));
```

**.NET:**

```csharp
using OpenMoca.Reader;
using OpenMoca.Reader.Citations;
using OpenMoca.Reader.Search;

const string IR = "https://example.org/handbook/incident#";
var pkg = await MocaReader.ReadPackageAsync("handbook-incident-response.moca");
var library = new Library().Add(pkg);

// Ingress: the organisation's own words for the package's concepts.
var ourWords = new Dictionary<string, string> { ["triage"] = IR + "AssessSeverity", ["status page"] = IR + "NotifyCustomers" };

var hooks = new SearchHooks
{
    Ingress = (query, ctx, ct) =>
    {
        var concepts = ourWords.Where(w => query.Contains(w.Key, StringComparison.OrdinalIgnoreCase)).Select(w => w.Value).ToList();
        return ValueTask.FromResult<IngressResult?>(concepts.Count > 0 ? new IngressResult(Concepts: concepts) : null);
    },
    // Egress: put the results in the order of the response steps.
    Egress = (candidates, ctx, ct) =>
    {
        var steps = (ctx.Structure?.Sequence(IR + "ResponseSteps") ?? []).Select(c => c.Iri).ToList();
        int Position(CitationRecord r) =>
            (r.Concepts ?? []).Select(c => steps.IndexOf(c)).Where(i => i >= 0).DefaultIfEmpty(steps.Count).Min();
        return ValueTask.FromResult<IReadOnlyList<CitationRecord>>(candidates.OrderBy(Position).ToList());
    },
};

const string question = "what goes on the status page after triage";
var plain = await new MocaSearch(library, new LexicalBackend(library)).SearchAsync(question, new SearchOptions { Limit = 3 });
Console.WriteLine($"plain:  {string.Join(", ", plain.Select(r => r.Node.Path))}");
var ours = await new MocaSearch(library, new LexicalBackend(library), hooks: hooks).SearchAsync(question, new SearchOptions { Limit = 3 });
Console.WriteLine($"hooks:  {string.Join(", ", ours.Select(r => r.Node.Path))}");
```

**Python:**

```python
from moca_reader import LexicalBackend, Library, Search, SearchHooks, read_package

IR = "https://example.org/handbook/incident#"
pkg = read_package("handbook-incident-response.moca")
library = Library().add(pkg)

# Ingress: the organisation's own words for the package's concepts.
OUR_WORDS = {"triage": IR + "AssessSeverity", "status page": IR + "NotifyCustomers"}


def ingress(query, ctx):
    concepts = [iri for word, iri in OUR_WORDS.items() if word in query.lower()]
    return {"concepts": concepts} if concepts else {}


# Egress: put the results in the order of the response steps.
def egress(candidates, ctx):
    steps = [c["iri"] for c in ctx.structure.sequence(IR + "ResponseSteps") or []]

    def position(r):
        found = [steps.index(c) for c in r.get("concepts", []) if c in steps]
        return min(found) if found else len(steps)

    return sorted(candidates, key=position)


hooks = SearchHooks(ingress=ingress, egress=egress)

question = "what goes on the status page after triage"
plain = Search(library, LexicalBackend(library)).search(question, limit=3)
print("plain: ", ", ".join(r["node"]["path"] for r in plain))
ours = Search(library, LexicalBackend(library), hooks=hooks).search(question, limit=3)
print("hooks: ", ", ".join(r["node"]["path"] for r in ours))
```

<!-- /tabs -->

```text
plain:  steps/notify-customers.md, steps/declare-incident.md, incident-response.md
hooks:  steps/assess-severity.md, steps/notify-customers.md
```

The plain search misses assessing severity, because the package never says
"triage". With the hooks, the search covers exactly the two steps the question
is about, and returns them in the order they are done.

Rules for hooks:

- **Hooks are your application's code.** A package can never supply or choose
  one.
- **The gate runs last.** Whatever a hook adds or reorders, the Reader still
  leaves out what the retrieval policy or the audience removes, and keeps the
  caller's own scope and limit.
- **Concepts from ingress narrow the search; they never widen what the caller
  asked for.**
- **Combine strategies** by calling one hook from another: for example, run
  your ingress first and fall back to `ontologyGuided`'s.

## Next

- [Search and sidecar indexes](search-and-indexes.md): semantic and hybrid
  search.
- [Package spec §5.6](../../spec/moca-package-spec.md#56-structure): every
  structure rule.
- Try the
  [Airplane Flying Handbook](https://try.openmoca.org/p/flying-handbook): a
  72-concept structure, where each topic shows what it builds on.
