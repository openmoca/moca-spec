# Roadmap

MOCA (Modular Ontology, Content & Attestation) is portable grounding for AI: a
package that carries knowledge with its
structure and its sources, an open Reader per language, and applications built
on both.

This page is direction, not a promise. It changes as we learn what people need.
What has shipped is in [CHANGELOG.md](CHANGELOG.md).

## Where it stands

- A package format over [OKF](https://github.com/GoogleCloudPlatform/open-knowledge-format):
  content, an optional structure layer and the original sources, sealed by one
  digest and optionally signed.
- Three Readers, in TypeScript, .NET and Python, that read, verify, search and
  cite packages the same way, and all pass one conformance corpus.
- Tools to convert, check, sign and index packages, and an MCP server.
- A live example, [Try OpenMOCA](https://try.openmoca.org), with real packages.

## Now: get it into people's hands

- Make it easy to start: packages on npm, NuGet and PyPI, guides that work as
  written, and the example site.
- Learn where it helps, by using it on real content and listening to the
  people who try it.
- Measure what it changes: answers that cite their source, fewer stale or
  out-of-scope answers ([outcome evaluation](docs/plans/01-outcome-evaluation.md)).

## Next: meet people where they are

- More bindings for the frameworks people already use, such as LangChain and
  LlamaIndex for TypeScript.
- Package signing with established tooling, such as OpenSSF Model Signing.
- Work with early adopters who share knowledge across a boundary: a vendor's
  documentation, a regulator's guidance, a platform team's runbooks.
- Talk to the OKF maintainers about packaging as a companion specification.

## Later

- Readers for mobile platforms, when someone needs one.
- Importers from structured sources, such as DITA.
- `1.0.0`, when the format has settled and is used beyond its maintainer
  ([GOVERNANCE.md](GOVERNANCE.md#path-to-a-standard)).

## Principles

- **Borrow before inventing.** OKF for content, SKOS and Dublin Core for
  structure, BagIt for the manifest, Sigstore and DSSE for signing, W3C
  selectors for evidence, MCP for access.
- **Two use cases or it stays out.** A feature joins the format when real use
  needs it ([ADR-0001](docs/adr/0001-three-pillars-and-admission-test.md)).
- **Fail closed on identity, degrade gracefully on meaning.** Anything that
  could make the digest ambiguous is an error; anything a Reader does not
  understand is ignored and reported.
- **Evidence over argument.** What stays in the format is what helps in use.
