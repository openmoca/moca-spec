# Releasing

For maintainers.

## Specification release

1. `npm test` passes on a clean checkout.
2. `CHANGELOG.md` has a dated section for the version; `MIGRATIONS.md` covers
   every breaking change.
3. The version is updated in: the headers of `spec/*.md`, `package.json`,
   `conformance/cases.json` (`corpusVersion`), and `docs/versioning-and-release.md`.
4. Tag `vX.Y.Z` and publish a GitHub release whose notes are the changelog
   section. Attach:
   - the corpus as `moca-conformance-X.Y.Z.tar.gz` (the `conformance/`
     directory), so an implementation can pin it without a checkout;
   - every example package as a `.moca` file, and the example trust root as
     `example-trust-root.json`, and Acme's semantic index as
     `acme-support.bge-small-en-v1.5.moca.idx.zip`: everything
     `npm run pack:examples` writes to `dist/examples/`. It checks each file as
     it packs it. The index needs the standard model installed first
     (`npx @openmoca/moca-embed models add bge-small-en-v1.5`); the walkthrough
     links to it. The Readers'
     getting-started guides download `support-kb.moca` and
     `example-trust-root.json`, and the examples' READMEs and openmoca.org
     link to every file, so keep the names. Upload them with
     `gh release upload vX.Y.Z dist/examples/*`.
5. Once `@openmoca/moca-core`, `moca-index` and `moca-sign` are on npm, the
   `devDependencies` in `package.json` name their released versions instead of
   `file:../` paths, so a clone of a release tag can run the corpus on its own
   (`npm ci && npm run conformance`).

## Moving the pins

The specification and the reference Reader release together, at the same
version, because each pins the other
([CONTRIBUTING.md](../CONTRIBUTING.md#pins)):

1. Release moca-reader-typescript and moca-tools with their moca-spec pin set
   to the coming tag `vX.Y.Z`, the commit you are about to tag.
2. In moca-spec, set `MOCA_READER_TYPESCRIPT_REF` and `MOCA_TOOLS_REF` to their
   new tags, then release the specification as above.
3. In every other open repository, move each `MOCA_*_REF` to the new tags in
   one pull request per repository.

Between releases, no pin names a branch.

## Reader and tool releases

The reference Reader and the tools are released from their own repositories
(moca-reader-typescript, moca-convert, moca-tools), each published to npm as
`@openmoca/<tool>` with its own version. The MCP server, moca-mcp-dotnet, is
released as platform downloads and the `OpenMoca.Mcp` .NET tool. Publish
`@openmoca/moca-core` first; the others depend on it. Each repository's
README has its release steps.

## Identifiers

The specification's identifiers live under `https://w3id.org/moca/`. The
redirect is maintained in the w3id.org repository
([perma-id/w3id.org](https://github.com/perma-id/w3id.org)); keep it pointing
at the published schemas and profile documents.
