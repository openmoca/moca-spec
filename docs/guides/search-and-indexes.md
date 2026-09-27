# Search and sidecar indexes

MOCA has one search entry point, `search()`, over a backend the host chooses.
The backend finds candidates. Search turns each one into a citation record and
applies the trust rules: content that is out of force, superseded or
deprecated is left out, and so is content outside the host's audience set. It
does this the same way for every backend
([Reader contract §9](../../spec/moca-reader-contract.md#9-search)).

| Backend | Needs | Use it for |
| --- | --- | --- |
| Lexical (`LexicalBackend`) | Nothing | Offline and edge use, small packages, the MCP server. BM25 over node text, or over a sidecar's chunks. |
| Dense (`DenseBackend`) | A sidecar with vectors, and a host embedder for the same model | Semantic search on a device without a vector database. |
| Store (`MemoryStoreBackend` is the reference; real stores come through a binding) | Your vector store | Production retrieval over many packages. See [consuming](consuming.md#feeding-your-own-retrieval-stack). |

```js
import { readPackage, bindSidecar, Library, Search, LexicalBackend, DenseBackend } from '@openmoca/moca-core';

const pkg = await readPackage('kb');
const sidecar = bindSidecar('kb.moca.idx', pkg);
const library = new Library().add(pkg, sidecar.usable ? { chunks: sidecar.chunks, index: sidecar.index } : {});

const search = new Search(library, { backend: new LexicalBackend(library), audiences: ['public'] });
const records = await search.search('refund window', { limit: 5, locale: 'fr' });
```

Switching to dense search changes one line. The call and the records it
returns stay the same:

```js
const search = new Search(library, { backend: new DenseBackend(library, { embedder }), audiences: ['public'] });
```

`library.search(query, options)` is a synchronous shortcut for lexical search.

## Sidecars

A sidecar is a derived, disposable index for one package version, kept
outside the package ([sidecar spec](../../spec/moca-sidecar-index-spec.md)):

```sh
node tools/moca-index/bin/moca-index.js build kb -o kb.moca.idx --chunk headings
node tools/moca-index/bin/moca-index.js check kb.moca.idx --package kb
```

- It is bound to the package digest. Change the package and the sidecar is
  stale; Readers ignore it and search the package directly.
- Every chunk has byte offsets into its node file, so a hit can be cited to
  the exact passage.
- The portable payload is `moca-jsonl-v1`. A dense or hybrid sidecar adds a
  `vector` to each item and MUST name its embedding `model`.

## Embedders

The host supplies the embedder; a package never names one a Reader will use.
An embedder is an object with `name`, optional `version`, `dimensions`, and
`embed(texts)`, which returns one vector per text.

- `moca-index build --embedder <module>` (experimental) writes vectors and
  the model into the sidecar.
- `DenseBackend` compares the host embedder with the sidecar's `model` before
  searching. A different name, version or dimension count is reported as
  `S006_MODEL_MISMATCH`, and that sidecar's vectors are not searched, because
  the neighbours they would return are meaningless.
- `moca-mcp --embedder <module>` serves dense search over MCP.
