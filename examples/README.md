# Examples

Example packages, each showing part of what MOCA adds. Every package here is
checked on each run of `npm test` against the capabilities listed below.

Most are also released as ready-made `.moca` files: download them from the
[latest release](https://github.com/openmoca/moca-spec/releases/latest),
together with `example-trust-root.json`, the trust root that verifies their
signatures. The example key is for testing only: never trust it for real
content.

| Example | What it shows | Capabilities | Download |
| --- | --- | --- | --- |
| [`minimal`](minimal) | The smallest valid package: a manifest and one page. Start here | core | `minimal.moca` |
| [`acme-support`](acme-support/README.md) | A support knowledge base of 34 pages in English and French: signed, reviewed, structured, with quotes checked against the original sources. The [walkthrough](../docs/walkthrough.md) uses it | core, localized, located-evidence, reviewed, self-contained-evidence, signed, structured | `acme-support.moca` |
| [`support-kb`](support-kb/README.md) | A four-answer support knowledge base, small enough to read in one sitting: evidence, a signed review, a French translation, a draft and an internal-only page | core, located-evidence, localized, reviewed, self-contained-evidence, signed | `support-kb.moca` |
| [`policy-corpus`](policy-corpus/README.md) | Two versions of one policy, with validity windows and `supersedes`, so only the one in force is returned | core | `policy-corpus-retention-2025.moca`, `policy-corpus-retention-2026.moca` |
| [`handbook`](handbook/README.md) | A handbook composed of two chapter packages, each pinned by its digest | core, composed (chapters: core, structured) | `handbook.moca`, `handbook-incident-response.moca`, `handbook-service-ownership.moca` |
| [`pdf`](pdf/README.md) | The FAA's Airplane Flying Handbook, converted from 19 PDFs, with evidence cited to the PDF page | core, located-evidence, structured | `airplane-flying-handbook.moca` |
| [`youtube`](youtube/README.md) | A video and a playlist built by `moca-youtube`, with evidence cited to time ranges in the captions | core, located-evidence, self-contained-evidence (playlist: also structured) | `youtube-video.moca`, `youtube-playlist.moca` |
| [`service-catalogue`](service-catalogue) | Structure in Turtle ([package specification §5.6](../spec/moca-package-spec.md)) | core, structured | — |

Two folders hold supporting files rather than packages:

- [`sidecars`](sidecars) holds a sidecar search index for `support-kb`
  ([sidecar index specification](../spec/moca-sidecar-index-spec.md)).
- [`ag-ui`](ag-ui) holds a `moca.citations` event built from `support-kb`
  ([citations over AG-UI](../spec/moca-ag-ui-citations.md)).

## Try them

```sh
# Check a package, and see its digest and capabilities
npx @openmoca/moca-lint lint acme-support.moca --trust-root example-trust-root.json

# Serve them to any MCP client, with the MCP server (one download):
# https://github.com/openmoca/moca-mcp-dotnet#readme
# Put the .moca files and the trust root in one folder, then serve the folder:
moca-mcp --library . --trust-root example-trust-root.json
```

Several are also in [Try OpenMOCA](https://try.openmoca.org), where you can
search them in the browser without an account.

## Changing an example

Every file inside a package folder is covered by its digest, and the signed
packages carry attestations over that digest. After any change, run
`npm run refresh:derived` to re-sign and re-pin everything derived from the
packages, then `npm run validate`.
