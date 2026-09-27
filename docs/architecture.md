# Architecture

MOCA has two layers and a consumer:

```text
Your application   agents, prompts, workflow, policy
      │            decides what to do with stale, contested or unreviewed content
      │  citation records
      ▼
MOCA Reader        open · check · digest · verify · resolve members · cite
      │            moca-core (library), moca-mcp (server), or a framework adapter
      ▼
MOCA package       moca.json + OKF content + attestations
```

The host that runs the Reader decides what to trust (the trust root), where to
find members (the resolver), who may see what (the audience filter), and which
retrieval stack to use.

## The package

A directory, `.moca` archive, host-supplied source or OCI artifact containing
`moca.json`, an OKF bundle under `content/`, optional sources and skills, and
signed attestations under `attestations/`. It is data: loading it never runs
anything, and nothing in it can configure the Reader. See the
[package specification](../spec/moca-package-spec.md).

## The Reader

A Reader turns a package into conclusions any implementation must agree on:
valid or not, its digest, its capabilities, which attestations verify, which
members match their pins, and a citation record per node. The
[Reader contract](../spec/moca-reader-contract.md) is normative; the
[conformance corpus](../conformance/README.md) checks it.

There are three ways to get a Reader:

| Shape | Use it when |
| --- | --- |
| [`@openmoca/moca-core`](../tools/moca-core/README.md), a library | You are in JavaScript or TypeScript, or you need ingest-time checks in a pipeline. |
| [`@openmoca/moca-mcp`](../tools/moca-mcp/README.md), an MCP server | Your agent speaks MCP, in any language. The quickest start. |
| A framework adapter | You already ingest into LlamaIndex, LangChain or Microsoft.Extensions.DataIngestion. The adapter verifies the package and writes citation-record fields as chunk metadata. |

## How it fits your retrieval stack

MOCA does not compete on retrieval. A typical production setup:

```text
package ──► Reader (verify at ingest) ──► your chunker + embedder ──► your vector store
                                                                           │
query ──► your retriever ──► filter by trust metadata ──► cite from the record
```

- **Ingest:** verify the package once, then write each chunk with the citation
  record fields and the package digest as metadata.
- **Query:** apply the default retrieval policy (leave out content that is out
  of force, superseded or deprecated) with metadata filters, plus the host's
  audience filter.
- **Answer:** cite package, version, node and evidence from the metadata.
- **Update:** when a package's digest changes, re-ingest only the files whose
  SHA-256 changed.

For offline or small deployments, the Reader's own lexical search, optionally
over a [sidecar index](../spec/moca-sidecar-index-spec.md), needs no model and
no database.

## The application

Your product. It decides what trust signals mean for its users: refuse stale
answers, show a warning on contested content, prefer attested reviews, run a
skill in a sandbox. MOCA makes the signals reliable and portable; policy
belongs to you.
