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
     `acme-support.bge-small-en-v1.5.mocai`: everything
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

Each repository that publishes a package has a release workflow that runs
when a `vX.Y.Z` tag is pushed on main. It publishes through the registry's
trusted publishing (npm with provenance, NuGet, PyPI), so no repository keeps
a registry token. Within a repository the workflow keeps the order: a Reader
before its bindings, `@openmoca/moca-embed` and `@openmoca/moca-sign` before
`@openmoca/moca-index`. Across repositories, tag in this order and wait for
each publish to finish:

1. moca-reader-typescript (`@openmoca/moca-core`);
2. moca-tools and moca-convert, which each check that their
   `@openmoca/moca-core` range is on npm;
3. moca-reader-dotnet and moca-reader-python;
4. moca-mcp-dotnet, once its `OpenMoca.Reader` version is on NuGet.

On a pull request to main, each release workflow runs its checks and packs
its packages (`npm publish --dry-run`, `dotnet pack`, `uv build` with
`twine check`) without publishing anything, so a broken release path shows
up before release day. Until a dependency is on its registry, the dry run
takes it from the pinned commit, as the tests do.

## Release day

A checklist for the maintainer who holds the registry accounts. The work on
a version happens on a `release-X.Y.Z` branch in each repository, with a pull
request to main; nothing is merged, tagged or published until this list
starts.

### Before you tag: registry and GitHub set-up

Every publishing workflow uses trusted publishing: the registry trusts one
workflow file, in one GitHub environment, in one repository. Set each one up
before you push the first tag; a workflow that is not trusted fails at its
publish step, after its checks pass.

1. **GitHub environments.** In each repository below, create the environment
   `release` (Settings, Environments). To approve each publish by hand, add
   yourself as a required reviewer. A workflow creates a missing environment
   on its first run, with no reviewer.
2. **npm trusted publishers.** Do this no more than two days before you tag.
   On npmjs.com, for each package: Settings, Trusted Publisher, GitHub
   Actions, with organisation `openmoca`, workflow `release.yml` and
   environment `release`.

   | Package | Repository |
   | --- | --- |
   | `@openmoca/moca-core` | `moca-reader-typescript` |
   | `@openmoca/moca-embed` | `moca-tools` |
   | `@openmoca/moca-sign` | `moca-tools` |
   | `@openmoca/moca-lint` | `moca-tools` |
   | `@openmoca/moca-index` | `moca-tools` |
   | `@openmoca/moca-convert` | `moca-convert` |

3. **PyPI publishers.** On pypi.org, for each project: Manage, Publishing,
   Add a new publisher, GitHub, with owner `openmoca`, repository
   `moca-reader-python`, workflow `release.yml` and environment `release`.
   The projects are `moca-reader`, `moca-reader-langchain` and
   `moca-reader-llamaindex`.
4. **NuGet trusted publishing policies.** On nuget.org, signed in as the
   account that owns the `OpenMoca.*` packages: Trusted Publishing, one policy
   for each repository, `moca-reader-dotnet` and `moca-mcp-dotnet`, with owner
   `openmoca`, workflow `release.yml` and environment `release`. A policy
   covers packages the account does not own yet, so a new package (such as
   `OpenMoca.Reader.Age` in 0.7.0) is created by its first publish.
5. **`NUGET_USER`.** In `moca-reader-dotnet` and `moca-mcp-dotnet`, add the
   secret `NUGET_USER` (Settings, Secrets and variables, Actions): the
   nuget.org profile name of that account, not its email address. It is not a
   credential, but `NuGet/login` needs it.

| Repository | Environment | Registry set-up | Secret |
| --- | --- | --- | --- |
| moca-reader-typescript | `release` | npm: `@openmoca/moca-core` | — |
| moca-tools | `release` | npm: four packages | — |
| moca-convert | `release` | npm: `@openmoca/moca-convert` | — |
| moca-reader-dotnet | `release` | NuGet policy | `NUGET_USER` |
| moca-reader-python | `release` | PyPI: three projects | — |
| moca-mcp-dotnet | `release` | NuGet policy | `NUGET_USER` |

### The tags, in order

Before the first tag, check that every release branch is green, including
the release workflow's dry run on its pull request. Then, for each step:
fast-forward main to the release branch (`git merge --ff-only`, so every
commit keeps its author; do not use the merge button), push main, then push
an annotated tag `vX.Y.Z` with the message `OpenMOCA X.Y.Z`. Wait for the
release workflow to finish, and check the registry, before the next step.

1. **moca-reader-typescript.** Check: `npm view @openmoca/moca-core@X.Y.Z`.
2. **moca-tools and moca-convert.** First, on each release branch, change
   `@openmoca/moca-core` from the `file:` link to `^X.Y.Z`, run
   `npm install` so the lockfile takes it from npm, and let CI pass. Then tag.
   Check each package with `npm view`.
3. **moca-reader-dotnet and moca-reader-python.** Check NuGet (a new version
   can take a few minutes to be listed) and PyPI.
4. **moca-mcp-dotnet**, once `OpenMoca.Reader` X.Y.Z is listed on NuGet. Its
   workflow also makes the GitHub release with the six builds.
5. **moca-spec.** Point the `devDependencies` at the released versions,
   set `MOCA_READER_TYPESCRIPT_REF` and `MOCA_TOOLS_REF` to `vX.Y.Z`, run
   `npm run validate`, then tag and publish the release as in
   "Specification release" above.
6. **Every other open repository.** Move each `MOCA_*_REF`, in `test.yml` and
   in `release.yml`, to the new tags, and fast-forward main again.
   openmoca.org goes last. Merging its main does not publish the site: the
   maintainer deploys it by hand with `npm run deploy` after the merge.
7. **GitHub releases** for the libraries, with the changelog section as
   notes, as for earlier versions.
8. **Afterwards:** submit the media type templates in [docs/iana](iana/)
   once the version they cite is tagged.

If a release workflow fails before it publishes anything, fix the workflow
on the release branch, delete the tag (`git push origin :refs/tags/vX.Y.Z`),
fast-forward main again and push the tag again. Never move a tag once a
registry has a version from it: publish a patch version instead.

## Identifiers

The specification's identifiers live under `https://w3id.org/moca/`. The
redirect is maintained in the w3id.org repository
([perma-id/w3id.org](https://github.com/perma-id/w3id.org)); keep it pointing
at the published schemas and profile documents.
