# Search and sidecar indexes

MOCA defines no retrieval engine. You have three options, and can mix them.

| Option | Needs | Use it for |
| --- | --- | --- |
| Reader lexical search | Nothing | Small packages, offline use, the MCP server. BM25 over node text. |
| A sidecar index | A `.moca.idx` built for the package digest | Faster search, chunk-level citations, or shipping precomputed vectors with a package. |
| Your vector store | Your stack | Production retrieval over many packages. See [consuming](consuming.md#feeding-your-own-retrieval-stack). |

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
- The portable payload is `moca-jsonl-v1`. A dense sidecar adds a `vector` to
  each item and MUST name its embedding `model`: vectors are useless without it.
  `moca-index` builds lexical sidecars today; an embedding back end is on the
  roadmap.

## Searching a sidecar

```js
import { readPackage, bindSidecar, Library } from '@openmoca/moca-core';
const pkg = await readPackage('kb');
const sidecar = bindSidecar('kb.moca.idx', pkg);
const library = new Library().add(pkg, { chunks: sidecar.usable ? sidecar.chunks : undefined });
```

`moca-mcp` accepts `package=sidecar` arguments for the same effect.
