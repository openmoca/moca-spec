# @openmoca/moca-core

The reference MOCA Reader, in TypeScript/JavaScript: open a package from a
directory, a `.moca` archive or a host-supplied source; check it; compute its
digest; verify attestations and evidence; resolve members; produce citation
records; and search with one entry point over lexical, dense-sidecar or store
backends. It implements the Reader class of the
[Reader contract](../../spec/moca-reader-contract.md), follows the
[Reader interface](../../spec/moca-reader-interface.md), and passes the
[conformance corpus](../../conformance/README.md).

```js
import { readPackage, Library, Search, LexicalBackend, directoryResolver } from '@openmoca/moca-core';

const pkg = await readPackage('kb', { trustRoot: 'trust-root.json', resolveMember: directoryResolver(['./packages']) });
pkg.valid;          // boolean
pkg.digest;         // 'sha256:…'
pkg.capabilities;   // ['core', 'signed', ...]
pkg.diagnostics;    // [{ code, severity, message, file?, line? }]

const library = new Library().add(pkg);
const search = new Search(library, { backend: new LexicalBackend(library), audiences: ['public'] });
await search.search('refund window', { limit: 5 }); // citation records, each with a score
library.get('https://example.com/moca/support-kb#refund-window.md', { locale: 'fr' });
```

## API

| Export | Purpose |
| --- | --- |
| `readPackage(target, options)` | Read and check a package. `target`: path, `.moca`/`.zip` path, or `{ list(), read(path) }`. Options: `trustRoot`, `resolveMember`, `strict`, `limits`, `online`, `allowOfflineFallback`, `tufCachePath`. |
| `Library` | Holds verified packages (and their sidecar `chunks` and `index`); `citations()`, `get()`, and `search()` as a synchronous lexical shortcut; applies relations. Takes a `clock` for testing. |
| `Search` | One entry point over a backend: `search(query, { limit, includeAll, locale, concepts, scope })`, with optional `hooks: { ingress, egress }`. The gate always runs last ([Reader contract §9](../../spec/moca-reader-contract.md#9-search)). `new Search({ digests, clock }, { backend })` searches a store from its ingest-time records. |
| `LexicalBackend`, `DenseBackend`, `MemoryStoreBackend` | Backends: BM25 over package text or sidecar chunks; sidecar vectors with a host embedder (`S006` on a model mismatch); a reference in-memory store. |
| `selectorMatches(selector, text)` | The evidence check behind `evidence[].matched` and `C011`. |
| `bindSidecar(target, pkg)` | Check a sidecar against a package and return usable chunks. |
| `directoryResolver(dirs)` | A simple member resolver over folders. |
| `hostSource`, `archiveSource`, `directorySource` | Package sources. |
| `loadTrustRoot`, `verifySignature`, `packageStatement`, `reviewStatement`, `createEnvelope` | Attestation primitives, shared with `moca-sign`. |
| `computeDigest`, `packageFiles` | The digest algorithm. |
| `validateAgainst(name, value)`, `SCHEMAS` | The `schemas/v1` schemas. |
| `Library.structure` | Structure operations over the loaded packages and the host's overlays: `concept`, `requires`, `requiredBy`, `parts`, `narrower`, `broader`, `related`, `sequence`, `nodes`. Each item names its layer. `new Library({ overlays })` loads overlays. |
| `ontologyGuided()` | The default ingress/egress hooks for `Search`. |
| `readStructure`, `structureView` | Parse `structure.ttl` (with `n3`) and derive `structure.json`. |
| `KNOWN_PROFILES`, `PROFILE_ONTOLOGY` | Recognised profiles; profile data stays opaque. |
| `CODES`, `formatText`, `formatJson`, `formatSarif` | Diagnostics. |

`readPackage` never executes package content and performs no network I/O,
except online Sigstore checks when `online` is set. Ontology files are parsed
locally; `owl:imports` is reported, never followed. Embedders are supplied by
the host, never named by a package.

`lib/schemas/` holds byte-identical copies of `schemas/v1`, checked by
`npm run validate:schemas`.
