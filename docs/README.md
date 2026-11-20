# Documentation

OpenMOCA is an open standard for portable grounding for AI. MOCA stands for
Modular Ontology, Content & Attestation. A package keeps a creator's credits,
sources and terms with their work, wherever it goes.

## Understand

| Page | What it covers |
| --- | --- |
| [Why MOCA?](why-moca.md) | The problem, what MOCA adds to OKF, and what it is not |
| [MOCA and RAG](moca-and-rag.md) | What a package adds to retrieval-augmented generation |
| [Trust and provenance](trust-and-provenance.md) | Who signed it, who checked it, who made it, on what terms, whether it is current, and proof of what an answer used |
| [Grounding for AI agents](ai-agents.md) | One package for any agent: MCP, framework bindings and in-process Readers |
| [Ontology for AI retrieval](ontology.md) | Topics, order and prerequisites as structure, and retrieval that uses them |
| [Sovereign and offline AI](sovereign-ai.md) | Grounding that runs on infrastructure you control, with no outside calls |
| [Use cases](use-cases.md) | Where a package layer pays off, and where it does not |
| [Architecture](architecture.md) | MOCA Package, Reader and Application; layers and overlays; how it fits your retrieval stack |
| [MOCA, OKF and MCP](moca-okf-mcp.md) | How the three fit together |
| [FAQ](faq.md) | Short answers: what MOCA is, and how it relates to RAG, vector stores, OKF and MCP |

## Do

| Page | What it covers |
| --- | --- |
| [Quickstart](quickstart.md) | A valid package in five minutes |
| [Walkthrough](walkthrough.md) | Check, sign, review, index and serve a package to an AI agent |
| [Authoring packages](guides/authoring.md) | Content, evidence, validity, versions, members, relations |
| [Structure](guides/structure.md) | `structure.ttl`, concept bindings, structure operations, overlays, retrieval strategies |
| [Signing and review](guides/signing-and-review.md) | Publisher and review attestations, trust roots |
| [Encrypt a package](guides/encryption.md) | Encrypted packages, key providers, what encryption does not do, issued copies |
| [Protected sources](guides/protected-sources.md) | Package protected content sealed, or as reference nodes that only point to the original |
| [The creator's terms](guides/creators-terms.md) | AI use, ratings and rights that travel with the work; how they resolve, and who decides |
| [Credits and dates](guides/credits-and-dates.md) | The publisher, contributors and their roles, licence and copyright, `datePublished` and `datePackaged` |
| [Machine-made content](guides/machine-made.md) | Mark what a machine made, with which model, and what a person checked |
| [Showing terms honestly](guides/showing-terms.md) | For app builders: apply terms before content goes anywhere, and show them without making a label look like a lock |
| [Consuming packages](guides/consuming.md) | Use a Reader in TypeScript, .NET or Python: read and verify, search, citation records, your own store, MCP |
| [Search and sidecar indexes](guides/search-and-indexes.md) | One search, backends, scope, hooks, sidecars, vector stores |
| [Capabilities](guides/capabilities.md) | Which features your use needs |

## Decide and plan

| Page | What it covers |
| --- | --- |
| [Decision records](adr/README.md) | Why the design is what it is, and what would change it |
| [Plans](plans/README.md) | Work in progress |
| [Versioning and release](versioning-and-release.md) | What version numbers promise |
| [Releasing](releasing.md) | The maintainer's release runbook |

The normative documents are in [`spec/`](../spec).
