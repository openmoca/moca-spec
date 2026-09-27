# @openmoca/moca-core

The reference MOCA Reader: open a package from a directory, a `.moca` archive
or a host-supplied source; check it; compute its digest; verify attestations;
resolve members; and produce citation records. It implements the
[Reader contract](../../spec/moca-reader-contract.md) and passes the
[conformance corpus](../../conformance/README.md).

```js
import { readPackage, Library, bindSidecar, directoryResolver } from '@openmoca/moca-core';

const pkg = await readPackage('kb', { trustRoot: 'trust-root.json', resolveMember: directoryResolver(['./packages']) });
pkg.valid;          // boolean
pkg.digest;         // 'sha256:…'
pkg.capabilities;   // ['core', 'signed', ...]
pkg.diagnostics;    // [{ code, severity, message, file?, line? }]

const library = new Library().add(pkg);
library.search('refund window', { limit: 5, audiences: ['public'] }); // citation records
library.get('https://example.com/moca/support-kb#refund-window.md', { locale: 'fr' });
```

## API

| Export | Purpose |
| --- | --- |
| `readPackage(target, options)` | Read and check a package. `target`: path, `.moca`/`.zip` path, or `{ list(), read(path) }`. Options: `trustRoot`, `resolveMember`, `strict`, `limits`, `online`, `allowOfflineFallback`, `tufCachePath`. |
| `Library` | Holds verified packages; `citations()`, `search()`, `get()`; applies relations and the default retrieval policy. Takes a `clock` for testing. |
| `bindSidecar(target, pkg)` | Check a sidecar against a package and return usable chunks. |
| `directoryResolver(dirs)` | A simple member resolver over folders. |
| `hostSource`, `archiveSource`, `directorySource` | Package sources. |
| `loadTrustRoot`, `verifySignature`, `packageStatement`, `reviewStatement`, `createEnvelope` | Attestation primitives, shared with `moca-sign`. |
| `computeDigest`, `packageFiles` | The digest algorithm. |
| `validateAgainst(name, value)`, `SCHEMAS` | The `schemas/v1` schemas. |
| `CODES`, `formatText`, `formatJson`, `formatSarif` | Diagnostics. |

`readPackage` never executes package content and performs no network I/O,
except online Sigstore checks when `online` is set.

`lib/schemas/` holds byte-identical copies of `schemas/v1`, checked by
`npm run validate:schemas`.
