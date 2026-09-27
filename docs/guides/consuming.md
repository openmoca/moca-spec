# Consuming packages

## Read once, verify once

```js
import { readPackage, Library, directoryResolver } from '@openmoca/moca-core';

const pkg = await readPackage('support-kb.moca', {
  trustRoot: 'trust-root.json',                     // whom you trust, for what
  resolveMember: directoryResolver(['./packages']), // where members come from
});
if (!pkg.valid) throw new Error(pkg.diagnostics.map((d) => d.code).join(', '));

pkg.digest;        // 'sha256:6539…'
pkg.capabilities;  // ['core', 'localized', 'located-evidence', 'reviewed', 'signed']
pkg.signers;       // ['Acme publishing key']
```

`readPackage` never throws for a bad package: problems are diagnostics with
stable codes ([Reader contract §10](../../spec/moca-reader-contract.md#10-diagnostics)).
A package is usable when `valid` is true; attestation, member and sidecar
problems only disable the feature concerned.

## Citation records

```js
const library = new Library().add(pkg);
const hits = library.search('refund window', { audiences: ['public'] });
hits[0].trust;   // { status, declaredVerified, attestedReviews, stale, inForce, superseded, contested, ... }
```

Every result is a
[citation record](../../spec/moca-reader-contract.md#7-citation-records). Show
users where an answer came from (`package.id`, `package.version`, `node.title`,
`evidence`), and log `package.digest` with the answer so you can later prove
what the assistant read.

## The default retrieval policy

Searches leave out content that is not in force, superseded by another loaded
package, or deprecated. Pass `includeAll: true` to include it, flagged. Stale
and contested content is returned, flagged; your application decides whether
to warn, down-rank or refuse.

## Feeding your own retrieval stack

Verify at ingest, then write each chunk to your store with metadata from its
citation record:

| Metadata | From |
| --- | --- |
| `moca_package_id`, `moca_package_version`, `moca_package_digest` | `package` |
| `moca_node_id`, `moca_node_digest` | `node` |
| `moca_status`, `moca_in_force_until`, `moca_stale_after`, `moca_superseded` | `trust` |
| `moca_attested_reviews`, `moca_signed` | `trust.attestedReviews`, `package.signed` |
| `moca_audience` | `audience` |

At query time, filter on this metadata to apply the default policy and your
audience rules. When a package's digest changes, compare `node.digest` values
and re-ingest only the nodes that changed. Adapters for LlamaIndex, LangChain
and Microsoft.Extensions.DataIngestion that do this are on the
[roadmap](../../ROADMAP.md).

## Over MCP

`moca-mcp` wraps all of this for any MCP client:

```sh
node tools/moca-mcp/bin/moca-mcp.js kb.moca policies.moca --trust-root trust-root.json --audience public
```

Tools: `moca_list_packages`, `moca_search`, `moca_get_node`. The host's
audience filter cannot be widened by the caller.

## Handing content to a model

Package text is untrusted. Put it in the model's context as quoted, cited
reference material, never as instructions, and never grant tools because
content asks ([Reader contract §11](../../spec/moca-reader-contract.md#11-handing-content-to-a-model)).
