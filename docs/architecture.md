# Architecture

MOCA has two purposes:

1. **Moving knowledge between platforms, securely and verifiably.** This is
   what the package serves.
2. **Reading and integrating packages locally**, on edge devices or on
   infrastructure a client owns. This is what the Reader, Search and Bindings
   layers serve.

```text
Your application   agents, prompts, workflow, policy
      │            decides what to do with stale, contested or unreviewed content
      │  citation records
      ▼
Bindings           framework types: retrievers, context providers, vector-store
      │            adapters, the MCP server
      ▼
Search             one search() over a pluggable backend; retrieval policy,
      │            audience, locale and concept filters applied once
      ▼
Reader             open · check · digest · verify · resolve members · cite
      │            in-process, in the host's language
      ▼
MOCA package       moca.json + OKF content + sources + attestations
```

The host that runs the Reader decides:
- what to trust (the trust root);
- where to find members (the resolver);
- who may see what (the audience set);
- which search backend and embedder to use.

A package never decides any of these.

## The package

A package can be a directory, a `.moca` archive, a host-supplied source or an
OCI artifact. It contains:
- `moca.json`;
- an OKF bundle under `content/`;
- the original sources under `sources/` and `media/`;
- optional skills and profile files;
- signed attestations under `attestations/`.

The digest covers everything except the attestations, so the originals travel
with the knowledge and arrive unchanged. A package is data: loading it never
runs anything, and nothing in it can configure the Reader. See the
[package specification](../spec/moca-package-spec.md).

## The Reader

A Reader turns a package into conclusions that any implementation must agree
on:
- whether it is valid, and its digest and capabilities;
- which attestations verify;
- which members match their pins;
- whether each quoted passage matches its source;
- a citation record per node.

The [Reader contract](../spec/moca-reader-contract.md) is normative. The
[Reader interface](../spec/moca-reader-interface.md) names the same operations
for every language. The [conformance corpus](../conformance/README.md) checks
them.

Each language has its own Reader, in its own repository
([ADR-0007](adr/0007-reader-interface-and-per-language-readers.md)). A Reader
ships only when it passes the whole corpus.

| Reader | Status |
| --- | --- |
| [`@openmoca/moca-core`](../tools/moca-core/README.md) (TypeScript) | The reference Reader, in this repository. |
| .NET | Next, for a first .NET host. |
| Python | When an adopter needs it. |

## Search

Search is one entry point, `search()`, over a backend the host chooses
([ADR-0008](adr/0008-search-backend-interface.md)):

| Backend | Searches | Needs |
| --- | --- | --- |
| Lexical | The package's own text, or a sidecar's chunks. | Nothing. Works offline. |
| Dense | A sidecar's vectors. | A host embedder whose model matches the sidecar's. |
| Store | The host's own vector store or database. | A binding for that store. |

A backend only finds candidates. Search resolves every hit through the Reader
and turns it into a citation record. It then applies the default retrieval
policy (content that is out of force, superseded or deprecated is left out),
the host's audience set, and the caller's locale and concepts. It does this
every time, whatever the backend did, and hits from a package version that is
no longer loaded are dropped. An application keeps the same code when it
moves from a package on a device to a client's vector store.

## Bindings

A binding presents citation records in a framework's own types. It is thin: it
wraps the framework's abstractions and never changes what a citation record
says.

| Framework | Binding |
| --- | --- |
| LangChain / LangGraph | Retriever |
| LlamaIndex | Retriever |
| Microsoft Agent Framework | Context provider |
| Microsoft.Extensions.VectorData | Store backend |
| Model Context Protocol | [`@openmoca/moca-mcp`](../tools/moca-mcp/README.md), for any agent in any language |

## How it fits a production retrieval stack

```text
package ──► Reader (verify at ingest) ──► your chunker + embedder ──► your vector store
                                                                           │
query ──► Search (store backend) ──► policy + audience re-check ──► cite from the record
```

- **Ingest:** verify the package once, then write each chunk to the store with
  its citation record fields and the package digest.
- **Query:** search through the store backend. Pushdown filters keep the top
  results relevant, and Search re-checks every hit.
- **Answer:** cite package, version, node and evidence from the record, and
  show whether the evidence was verified against the original.
- **Update:** when a package's digest changes, re-ingest only the files whose
  SHA-256 changed. Records from the old digest stop being returned as soon as
  the old version is unloaded.

## The application

Your product decides what trust signals mean for its users. It might refuse
stale answers, warn on contested content, prefer attested reviews, or run a
skill in a sandbox. MOCA makes the signals reliable and portable; policy
belongs to you.
