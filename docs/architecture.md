# Architecture

MOCA has three pillars
([ADR-0011](adr/0011-three-pillars-and-admission-test.md)):

```text
MOCA Application   agents, prompts, workflow, policy, runtime state
      │            (yours: built on the agent harness of your choice)
      │  citation records · structure answers
      ▼
MOCA Reader        read · verify · search · navigate structure · cite
      │            in-process, one per language, one conformance corpus;
      │            bindings present it as each framework's retriever,
      │            context provider or vector-store adapter, and as an MCP server
      ▼
MOCA Package       structure (optional) · content · evidence
                   with identity, digest and signatures across all three
```

The host that runs the Reader decides:

- what to trust (the trust root);
- where to find members (the resolver);
- who may see what (the audience set);
- which search backend and embedder to use;
- which overlays and retrieval hooks to load.

A package never decides any of these.

MOCA serves two purposes:

1. **Moving knowledge between platforms securely and verifiably.** The
   package serves this.
2. **Reading and integrating packages locally**, on edge devices or on
   infrastructure a client owns. The Reader serves this.

## The package

A package is a directory, a `.moca` archive or a host-supplied source. It
has three layers:

| Layer | Files | What it holds |
| --- | --- | --- |
| Structure (optional) | `structure.ttl`, optionally `structure.json` | Concepts, hierarchy, parts, order, `requires`, `replaces` |
| Content | `content/`, an OKF bundle | The knowledge, one node per topic, bound to concepts with `moca.concepts` |
| Evidence | `sources/`, `media/` | The originals, pointed into by W3C selectors |

The digest is the SHA-256 of a BagIt-style manifest of every file, so the
three layers travel together and arrive unchanged. Signed attestations under
`attestations/` sit outside the digest. They say who published the package,
and who reviewed which node.

A package is data. Loading it never runs anything, and nothing in it can
configure the Reader. See the
[package specification](../spec/moca-package-spec.md).

## Layers at load time

An application and an organisation can add to a package's structure without
changing it
([ADR-0013](adr/0013-package-application-organisation-layers.md)):

```text
organisation overlay   e.g. "a review requires the incident to be declared"
application overlay    e.g. the application's own vocabulary or event rules
package                structure.ttl, as published and signed
```

The host loads overlays. Only the package layer is digested and signed, and
every structure answer names the layer that stated it.

## The Reader

A Reader turns a package into conclusions that any implementation must agree
on:

- whether it is valid, and its digest and capabilities;
- which attestations verify;
- which members match their pins;
- whether each quoted passage matches its source;
- a citation record per node, with a versioned node reference;
- the answers to structure operations.

The [Reader contract](../spec/moca-reader-contract.md) is normative. The
[Reader interface](../spec/moca-reader-interface.md) names the same
operations for every language. The [conformance corpus](../conformance/README.md)
checks them.

| Reader | Status |
| --- | --- |
| [`@openmoca/moca-core`](../tools/moca-core/README.md) (TypeScript) | The reference Reader, in this repository. |
| .NET | Next, for a first .NET host. |
| Python | When an adopter needs it. |

### Search

Search is one operation over a backend the host chooses:

| Backend | Searches | Needs |
| --- | --- | --- |
| Lexical | The package's own text, or a sidecar's chunks | Nothing. Works offline. |
| Dense | A sidecar's binary vectors | A host embedder for the same model |
| Store | The host's own vector store | A binding that stores whole citation records at ingest |

Every search runs a pipeline: ingress, backend, resolve, egress, then the
gate. The gate always runs last. It removes content from packages that are
not loaded, content that is out of force, superseded or deprecated, content
outside the host's audience set, and content outside the caller's locale,
concepts or scope. Whatever a backend or a hook did, nothing the policy
excludes is returned.

### Ontology-guided retrieval

Structure facts are normative; how an application uses them to retrieve is
not ([ADR-0016](adr/0016-pluggable-ontology-guided-retrieval.md)):

- **ingress** maps a question onto concepts, and narrows or widens what is
  searched;
- **egress** walks the results through the structure, for example adding the
  step that a procedure requires first.

The reference Reader ships a default strategy. A domain extension, such as a
legal, procedures or course extension, supplies its own hooks and an overlay
vocabulary, on the same Reader.

## Bindings

A binding presents citation records in a framework's own types. It is thin:
it wraps the framework's abstractions, and never changes what a citation
record says.

| Framework | Binding |
| --- | --- |
| LangChain / LangGraph | Retriever |
| LlamaIndex | Retriever |
| Microsoft Agent Framework | Context provider |
| Microsoft.Extensions.VectorData | Store backend |
| Model Context Protocol | [`@openmoca/moca-mcp`](../tools/moca-mcp/README.md): tools for search and structure, and nodes as resources |

## How it fits a production retrieval stack

```text
package ──► Reader (verify at ingest) ──► your chunker + embedder ──► your vector store
                                                                           │
query ──► Reader search (store backend) ──► gate ──► cite from the record
```

- **Ingest:** verify the package once, then write each chunk to the store with
  its whole citation record, including the package digest.
- **Query:** search through the store backend. The Reader resolves hits from
  the stored records, recomputes freshness and validity, and keeps only
  packages the host has loaded, so it never needs every package in memory.
- **Answer:** cite `node.ref`, the version and the evidence, and show whether
  the evidence matched the original.
- **Update:** when a package's digest changes, re-ingest only the files whose
  SHA-256 changed. Records from the old digest stop being returned as soon as
  it leaves the allowlist.

## The application

Your product decides what the signals mean for its users. It might refuse
stale answers, warn on contested content, or prefer attested reviews. It
decides whether a person may move on to content that requires something they
have not done. It keeps that state, and any reporting, itself. MOCA makes the
signals and the structure reliable and portable; policy and state belong to
you.
