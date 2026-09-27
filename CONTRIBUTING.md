# Contributing to MOCA

Thank you for helping. MOCA is small and young, and the process is light (see
[GOVERNANCE.md](GOVERNANCE.md)).

## Set up

```sh
npm install
npm test   # every check CI runs: examples, conformance, derived artifacts, schemas, links, Markdown, tool tests
```

Node.js 22 or later is required.

## Proposing a specification change

1. Open an issue with the **Spec change proposal** template: the problem, the
   sections affected, the change, and its migration impact.
2. When there is rough agreement, open one pull request that changes, together:
   - the prose in `spec/`;
   - the schema in `schemas/v1/` (then copy it to `tools/moca-core/lib/schemas/`;
     `npm run validate:schemas` checks they match);
   - the reference Reader in `tools/moca-core/`;
   - the conformance cases in `conformance/`;
   - [CHANGELOG.md](CHANGELOG.md), and [MIGRATIONS.md](MIGRATIONS.md) if packages
     or Readers must change.

A behaviour described in the specification but missing from the schema, the
Reader or the corpus is a bug.

### Keywords

The specification uses RFC 2119 keywords. Use MUST only for interoperability
requirements, SHOULD for strong recommendations with documented exceptions,
and MAY for genuine options. Changing an existing keyword is a specification
change in its own right and needs its own issue.

### Diagnostic codes

Codes are the contract between implementations. Add a code to
`tools/moca-core/lib/codes.js` and to the table in
[Reader contract §9](spec/moca-reader-contract.md#9-diagnostics) in the same
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
[profiles/README.md](profiles/README.md#writing-a-profile): state the URI, the
package- and node-level data with a JSON Schema, any files the profile adds,
and confirm that a core-only Reader loses nothing it needs.

## Releasing

Maintainers: see [docs/releasing.md](docs/releasing.md).

## Bugs

Use the **Bug report** template for problems in the specification, schemas,
tools, examples or documentation. Report security issues privately; see
[SECURITY.md](SECURITY.md).
