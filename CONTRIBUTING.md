# Contributing to MOCA

Thank you for helping. MOCA (Modular Ontology, Content & Attestation) is small
and young, and the process is light (see
[GOVERNANCE.md](GOVERNANCE.md)).

## Set up

```sh
npm install
npm test   # every check CI runs: public dependencies, examples, conformance, derived artifacts, links, Markdown
```

Node.js 22 or later is required. The checks use the reference Reader and the
signing and index tools: check out
[moca-reader-typescript](https://github.com/openmoca/moca-reader-typescript)
and [moca-tools](https://github.com/openmoca/moca-tools) beside this
repository, and run `npm install` in each first.

`npm run check:deps` checks that every dependency is public: from the npm
registry, nuget.org, PyPI, or another open MOCA repository. It fails on private
registries and feeds, git dependencies outside openmoca, and paths that leave
the repository. It also checks that every published npm package declares, as a
runtime dependency, each package its shipped files import, so it installs on
its own. Every open MOCA repository runs this script against itself in CI:
`node ../moca-spec/scripts/check-deps.mjs .`

`scripts/run-guide.mjs` runs a getting-started guide as written: its code
blocks with a `title` become files, and its shell blocks run in order. Each
Reader's CI runs its own guide with it.

## Proposing a specification change

A specification change is a **Spec Change Proposal**: an issue, then linked
pull requests in several repositories, merged in a fixed order. We follow it
for our own changes too.

### Pins

Every repository's CI checks out the other MOCA repositories it needs at a
fixed ref, never a branch, so a change in one repository cannot break another
part-way through:

| Repository | Pins |
| --- | --- |
| moca-spec | the reference Reader (moca-reader-typescript) and moca-tools |
| moca-reader-typescript, moca-reader-dotnet | the corpus (moca-spec), and what their tests use |
| moca-tools, moca-mcp-dotnet, moca-convert, moca-examples | moca-spec and the Readers they build on |

Pins sit in one `env` block at the top of each workflow (`MOCA_SPEC_REF`,
`MOCA_READER_TYPESCRIPT_REF` and the like). Between proposals each pin is a
release tag, such as `v0.6.0`. While a proposal is in flight, a pin
may name a commit. `npm run check:deps` fails on a checkout without a pin, or
pinned to a branch.

### Steps

1. **Issue.** Open an issue with the **Spec change proposal** template (label
   `spec-change`): the problem, the sections affected, the change, and its
   migration impact. Wait for rough agreement. Link every pull request below
   to it.
2. **The text, in moca-spec.** One pull request with the prose in `spec/`, the
   schema in `schemas/v1/`, [CHANGELOG.md](CHANGELOG.md), and
   [MIGRATIONS.md](MIGRATIONS.md) if packages or Readers must change. No new
   conformance cases yet: CI runs the corpus against the pinned reference
   Reader, which does not know the change. Merge.
3. **The reference Reader.** One pull request in
   [moca-reader-typescript](https://github.com/openmoca/moca-reader-typescript)
   that implements the change, copies the schema into `lib/schemas/` (its
   `npm run check:schemas` compares them), and pins moca-spec to the commit
   merged in step 2. Merge.
4. **The corpus, in moca-spec.** One pull request with the conformance cases,
   which also moves the reference Reader pin to the commit merged in step 3.
   CI now runs the new cases against the Reader that implements them. Merge.
5. **Every other Reader.** Each one (moca-reader-dotnet; moca-reader-python
   when it exists) implements the change and pins moca-spec to the commit
   merged in step 4, so its CI runs the new cases. A Reader that cannot follow
   yet lists the new cases in its expected failures, with a reason and a link
   to the issue. The reference Reader moves its pin to that commit too.
6. **Tools.** moca-tools, moca-mcp-dotnet and moca-convert follow where the
   change touches them, the same way.

A change to a schema that the Readers check against moca-spec takes steps 2
and 4 as separate pull requests, as above. A change with no normative effect,
such as wording or an example, is a single moca-spec pull request.

When the proposal is part of a release, every pin moves back to a release tag
([docs/releasing.md](docs/releasing.md)). Then close the issue.

### Keywords

The specification uses RFC 2119 keywords. Use MUST only for interoperability
requirements, SHOULD for strong recommendations with documented exceptions,
and MAY for genuine options. Changing an existing keyword is a specification
change in its own right and needs its own issue.

### Diagnostic codes

Codes are the contract between implementations. Add a code to the reference
Reader's `lib/codes.js` and to the table in
[Reader contract §11](spec/moca-reader-contract.md#11-diagnostics) in the same
pull request, with at least one conformance case that produces it. Never
change what an existing code means; add a new one.

## Adding or changing conformance cases

Cases live in [`conformance/cases.json`](conformance/cases.json) and fixtures
under `conformance/fixtures/`. Expectations are written and reviewed by hand;
`npm run conformance:actual` prints what the reference Reader concludes, to
help you check a new case, never to generate expectations blindly. See
[conformance/README.md](conformance/README.md).

## After editing an example or fixture

Some files are derived: member digest pins, attestations, sidecar indexes and
the archive fixture. They go stale when any byte they depend on changes.
Never edit them by hand. Run:

```sh
npm run refresh:derived
```

It regenerates everything listed in
[`scripts/derived.config.json`](scripts/derived.config.json), in dependency
order, signing with the published, insecure example keys in
[`fixtures/signing-keys/`](fixtures/signing-keys/README.md). `npm test` fails
if anything is stale.

## Proposing a profile

Open an issue with the **Profile proposal** template. Follow
[profiles/README.md](profiles/README.md#write-a-profile): state the URI, the
package- and node-level data with a JSON Schema, any files the profile adds,
and confirm that a core-only Reader loses nothing it needs.

## Releasing

Maintainers: see [docs/releasing.md](docs/releasing.md).

## Bugs

Use the **Bug report** template for problems in the specification, schemas,
tools, examples or documentation. Report security issues privately; see
[SECURITY.md](SECURITY.md).
