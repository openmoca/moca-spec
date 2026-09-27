# Releasing

For maintainers.

## Specification release

1. `npm test` passes on a clean checkout.
2. `CHANGELOG.md` has a dated section for the version; `MIGRATIONS.md` covers
   every breaking change.
3. The version is updated in: the headers of `spec/*.md`, `package.json`,
   `conformance/cases.json` (`corpusVersion`), and `docs/versioning-and-release.md`.
4. Tag `vX.Y.Z` and publish a GitHub release whose notes are the changelog
   section.

## Tool releases

Each tool under `tools/` is published to npm as `@openmoca/<tool>` with its
own version.

1. Update the tool's `package.json` version, and its dependency on
   `@openmoca/moca-core` if that changed. Publish `moca-core` first.
2. `npm test` passes.
3. From the tool directory: `npm publish --access public`.
4. Tag `<tool>@X.Y.Z`.

## Identifiers

The specification's identifiers live under `https://w3id.org/moca/`. The
redirect is maintained in the w3id.org repository
([perma-id/w3id.org](https://github.com/perma-id/w3id.org)); keep it pointing
at the published schemas and profile documents.
