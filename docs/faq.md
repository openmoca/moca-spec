# Frequently asked questions

## What is OpenMOCA?

OpenMOCA is an open standard for portable grounding for AI. A MOCA package
carries the knowledge an AI system answers from, how it is organised, and the
original sources it came from, sealed by one digest and optionally signed.
Open Readers in TypeScript, .NET and Python read, verify, search and cite it
the same way, on a server or offline.

## What does MOCA stand for?

Modular Ontology, Content & Attestation: knowledge in modular packages that
can be assembled into larger ones, organised by an optional ontology, with
attestations, signatures that prove who published it and who checked it.
OpenMOCA is the open project: the specification, the Readers and the tools.

## How do you say OpenMOCA?

"Open MO-kuh": MOCA is said like mocha, the coffee. Say it as one word, not
as letters. The same goes for a `.moca` file: a "MO-kuh file".

## Is MOCA a vector database?

No. A package is a file format for knowledge, and a Reader is a library that
reads it. Search can run over the package's own text, over a sidecar index of
vectors built for it, or through your own vector database: the Reader applies
the same trust rules to each
([search and sidecar indexes](guides/search-and-indexes.md)).

## Is MOCA an alternative to RAG?

No. It is what you put into retrieval-augmented generation (RAG). A MOCA
package gives a RAG pipeline knowledge with its version, its structure and
its sources, so every answer can cite a passage that can be checked, and
content that is out of date or for another audience is left out before the
model sees it ([MOCA and RAG](moca-and-rag.md)).

## Does MOCA stop hallucinations?

It reduces the conditions for them, but no format controls what a model says.
MOCA makes sure the model is given the right content (current, in scope, for
the right audience, in the right order) and that every passage it is given
carries a citation you can check against the original. Whether the model uses
it faithfully is up to the model and your application, which can check its
citations.

## Do I need a particular model, vector database or framework?

No. A package names no model or service, and a Reader never calls one. The
same package works with any model, any vector store and any agent framework.
There are bindings for LangChain and LlamaIndex (Python), the Microsoft Agent
Framework and Microsoft.Extensions.AI and VectorData (.NET), and an MCP server
for any MCP client.

## Can it run offline, or on infrastructure we control?

Yes. Readers are libraries that run in your process and never reach the
network because a package names something. A package carries its sources, so
quotes are checked offline, and signatures are verified against keys you
list. Lexical (keyword) search needs nothing else; semantic search needs only an
embedding model you run yourself
([sovereign and offline AI](sovereign-ai.md)).

## What is the ontology, and do I need one?

The optional structure layer is a small ontology in RDF (Turtle): topics, what
is part of what, the order of steps, and what requires what. Every Reader
understands a small core of W3C SKOS and Dublin Core terms, and answers
questions about them the same way. The same file can carry any other
vocabulary, such as OWL, SHACL, PROV-O or your own domain terms: Readers keep
it in the package, covered by the digest, and leave its meaning to your
application, which can act on it through its own retrieval hooks.

You need it when order or prerequisites matter, as in procedures, regulations
and courses. A package without it is complete
([ontology for AI retrieval](ontology.md),
[structure guide](guides/structure.md)).

## How does MOCA relate to OKF and MCP?

MOCA builds on the [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format)
(OKF): the pages in a package are OKF documents, and MOCA adds the package
around them. The Model Context Protocol (MCP) is how an agent calls tools; the
MOCA MCP server lets any MCP client search and cite packages
([MOCA, OKF and MCP](moca-okf-mcp.md)).

## Can AI agents use it?

Yes. Any MCP client can search and cite packages through the MOCA MCP server,
and there are bindings for the Microsoft Agent Framework, LangChain and
LlamaIndex. The same package grounds every agent, with the same trust rules
([grounding for AI agents](ai-agents.md)).

## How do I know who published a package, and whether anyone checked it?

A package can be signed by its publisher, and individual pages can carry
signed reviews. A Reader verifies both against a trust root you control, and
every search result says who signed it and who reviewed it
([trust and provenance](trust-and-provenance.md)).

## Which languages are supported?

TypeScript (the reference Reader), .NET and Python. All three pass the same
conformance corpus, so they reach the same conclusions about every package.
The MCP server works with any client.

## Is it free, and who is behind it?

Yes. The specification, Readers and tools are open source under Apache-2.0.
OpenMOCA is maintained by PI & Mash Solutions Ltd, which holds the OpenMOCA
trade mark on behalf of the project ([governance](../GOVERNANCE.md)).

## Is it ready to use?

It is at 0.6.0, before 1.0. The format is tested end to end and the three
Readers agree on every case, but it may still change before 1.0
([versioning](versioning-and-release.md)).

## Where do I start?

[Try OpenMOCA](https://try.openmoca.org) in the browser, follow the
[walkthrough](walkthrough.md), make a package with the
[quickstart](quickstart.md), or read one with the Reader for
[TypeScript](https://github.com/openmoca/moca-reader-typescript/blob/main/docs/getting-started.md),
[.NET](https://github.com/openmoca/moca-reader-dotnet/blob/main/docs/getting-started.md) or
[Python](https://github.com/openmoca/moca-reader-python/blob/main/docs/getting-started.md).
