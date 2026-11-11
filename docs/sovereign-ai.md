# Sovereign and offline AI

Sovereign AI means running AI on infrastructure you control, under your own
jurisdiction and rules, without depending on a service you do not control.
The knowledge an AI answers from has to work the same way: it cannot rely on
an outside search service, a hosted index, or a call home to check where it
came from.

**MOCA grounding runs entirely where you put it.** A MOCA package is a file.
A MOCA Reader is a library that runs inside your application. Reading,
verifying, searching and citing need no network, no external service and no
particular model.

## What runs where

| Step | Where it runs | Needs |
| --- | --- | --- |
| Read a package | In your process | The `.moca` file or folder |
| Verify its digest and signatures | In your process | A trust root you control, listing the keys you accept |
| Check quotes against their sources | In your process | Nothing: the originals travel inside the package |
| Lexical search | In your process | Nothing |
| Semantic search | In your process | A sidecar index, and an embedding model you run yourself |
| Answer a question | Your model, wherever you run it | Your choice of model |

## The rules that make it hold

These are part of the [Reader contract](../spec/moca-reader-contract.md),
which every Reader must follow, and the conformance corpus tests:

- **A Reader never reaches the network because a package names something.**
  A package can cite a web address, but the Reader never fetches it.
- **A package never configures its Reader.** No field can make a Reader load
  a model, call a service or change a setting.
- **The host decides whom to trust.** Signatures count only against a trust
  root you supply. DSSE signatures with Ed25519 keys verify offline in every
  Reader.
- **Loading a package never runs anything.** A package is data.

## Air-gapped, edge and on-device

- **Air-gapped networks.** Carry a signed `.moca` file and its sidecar index
  across the gap; verify it on the other side against your trust root.
- **Edge and devices.** Readers are libraries in TypeScript (Node.js, Workers,
  browsers), .NET and Python. A package with a lexical index searches on a
  laptop or tablet with nothing else installed.
- **Your own models.** Semantic search uses an embedding model you choose and
  run, such as a small local model through Ollama or ONNX Runtime. The index
  records the model it was built with, and the Reader refuses a mismatch
  ([search and sidecar indexes](guides/search-and-indexes.md#4-when-the-model-does-not-match)).
- **Your own agents.** The MCP server runs as a local process on the same
  machine as the client.

## Proving what was used

Sovereignty also means accountability. With MOCA you can show exactly which
knowledge an assistant used, long after the fact: log the package digest and
the versioned page reference with each answer. Together they name the exact
text, independent of any index or service that may since have changed
([use cases: audit and regulated AI](use-cases.md#audit-and-regulated-ai)).

## Next

- [Architecture](architecture.md): the package, the Reader, and what the host
  decides.
- [Signing and review](guides/signing-and-review.md): keys you control.
- [Consuming packages](guides/consuming.md): read once, verify once, search
  and cite.
