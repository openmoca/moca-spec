# [Tool] `moca-index` — Generate `.moca.idx` Sidecar Indexes

## Roadmap context

[ROADMAP.md item 5](../ROADMAP.md#5-open-source-cli-application-and-developer-tooling)
names, as a planned capability:

> `moca-index` to generate optional search indexes and associated
> embeddings.

Roadmap item 4 (MOCA Index and Optional Search) is complete: it defined and
shipped the `.moca.idx` **format** —
[docs/sidecar-index-spec.md](../docs/sidecar-index-spec.md),
`schemas/core/sidecar-index.schema.json`,
`scripts/validate-sidecar-index.mjs`, and a real, hand-built reference
sidecar at
[examples/indices/level-1-minimal.moca.idx](../examples/indices/level-1-minimal.moca.idx).
What's missing is a tool that **produces** a conformant sidecar from an
arbitrary target package, rather than one being hand-authored per example.
This proposal is gated on nothing further — the format it targets is
already stable and validated.

## Affected / new paths

- New workspace package `tools/moca-index/`, structured like
  `tools/moca-lint/`, picked up by the existing `"workspaces": ["tools/*"]`
  root entry.
- `.github/workflows/validate.yml` — new test job for the package,
  mirroring the existing `moca-lint (tests + example packages)` job.
- `docs/quickstart.md` — a new "Generating a sidecar index" section.
- `docs/sidecar-index-spec.md` — no normative change expected, but add a
  cross-reference to this tool once it exists (parallel to how §4 already
  cross-references `canonicalDigest`).
- `CHANGELOG.md`.

## Problem

`docs/sidecar-index-spec.md` deliberately specifies the manifest and
addressing contract without prescribing a chunking strategy, embedding
model, or payload format — that's the right scope for a *format* spec. But
it leaves every producer to independently re-derive: how to walk
`content/`, how to chunk it while satisfying the
`content_path`/`chunk_index`/`chunk_count` invariant (spec §5), how to
compute and bind `target_package_hash` correctly (spec §4, preferring
`canonicalDigest.value`), and how to assemble a schema-valid `index.json`.
Without a reference tool, every implementer either hand-writes sidecars
(as the one shipped example does) or writes a one-off script, which is the
same fragmentation problem `moca-convert`'s absence causes for package
creation.

## Proposed change

Add a `moca-index` CLI:

```sh
moca-index build <package-dir> -o <output.moca.idx> [options]
```

### Pipeline

1. **Resolve and bind the target.** Read `<package-dir>/moca.json`. If it
   has a `canonicalDigest` (core §5.5), use `canonicalDigest.value` as
   `target_package_hash` with the `sha256:` prefix — the spec's preferred
   form (spec §4), reusing the same digest algorithm
   `scripts/validate-canonical-digest.mjs` already implements (as a shared
   library function, not a reimplementation — see Implementation scope). If
   the target has no `canonicalDigest`, `moca-index` MUST NOT compute one
   itself as a side effect (that's the target package's own concern, not
   the indexer's); it either omits `target_package_hash` with a warning, or
   refuses to proceed without an explicit `--allow-unbound` flag, since an
   unbound sidecar can't be verified as synchronized with its target (spec
   §4).
2. **Walk and chunk `content/`.** Default chunker: one chunk per content
   file (`chunk_index: 0`, `chunk_count: 1`) — the simplest conformant
   strategy and a safe default for arbitrary Markdown. A `--chunker
   <strategy>` option selects alternatives (e.g. a heading-based or
   fixed-token-window chunker) that MAY emit multiple chunks per
   `content_path`, matching the multi-chunk case the reference example
   already demonstrates. Every chunker MUST satisfy the addressing
   invariant from spec §5 (`0 <= chunk_index < chunk_count`) — enforced by
   validating the emitted payload before writing (see step 4).
3. **Embed (optional, pluggable).** `--embedder <name>` selects an
   embedding provider adapter that turns each chunk's text into a vector
   or sparse representation. Default (`--embedder none` / omitted): no
   vectors are generated, and `index_type` is set to a lexical/text-only
   value — a fully offline, model-free `.moca.idx` remains possible,
   consistent with the format spec's "It does not define ... an embedding
   model" scoping and with core's runtime-independence principle. Real
   embedding providers (a local model runtime, a hosted API) ship as
   **separate, optional adapter packages** the core `moca-index` package
   declares as optional peer/plugin dependencies, not as hard dependencies
   of the base install — see Alternatives.
4. **Assemble and validate.** Build `index.json` conforming to
   `schemas/core/sidecar-index.schema.json`, write the payload (default
   format: JSONL, matching the reference example's
   `payload/index.jsonl`), then run the same checks
   `scripts/validate-sidecar-index.mjs` performs (schema conformance,
   payload existence, addressing invariant, target hash match) against its
   own output before reporting success. **Fail closed**: refuse to write a
   sidecar that wouldn't itself pass `validate-sidecar-index.mjs`, mirroring
   `moca-lint pack`'s fail-closed contract.
5. **Package.** Write the `index.json` + `payload/` layout as a directory
   or, with `--zip`, as a Zip archive at the conventional `.moca.idx` path
   (spec §2), reusing `moca-lint`'s archive-writing logic rather than a
   second implementation (see Implementation scope).

### What this does not specify

- **Which embedding model to use by default.** Deliberately none — see
  step 3. Choosing and shipping a first default embedding backend is
  listed as an open decision in `ROADMAP.md` ("First supported embedding
  and storage backends") and is out of scope for this proposal, which only
  needs the adapter interface (see Alternatives) to exist so a backend can
  be added later without redesigning the CLI.
- **Query/retrieval.** `moca-index` only *builds* a sidecar. Combining
  lexical, semantic, and graph-aware retrieval over one is the generic AI
  harness's job (`ROADMAP.md` item 8), a separate, later component.
- **Vector database integration.** No hosted or embedded vector DB is
  written to directly; the payload is a portable file
  (`storage.file`/`storage.format`, spec §2) a harness loads however it
  chooses. `ISearchIndexProvider`-style abstractions belong to item 9.
- **Re-indexing/diffing an existing sidecar incrementally.** v1 always
  rebuilds the full sidecar from the target package; incremental updates
  are a reasonable future enhancement, not required for the roadmap
  outcome.

## Impact on existing conformance levels / profiles

None. `.moca.idx` is, by the format spec's own scope (§1, §6), an optional
derived artifact; nothing about package conformance changes. The one
existing hand-built sidecar
(`examples/indices/level-1-minimal.moca.idx`) is unaffected and can
optionally be regenerated with `moca-index` later purely as a
demonstration that the tool reproduces a spec-conformant, schema-valid
sidecar — not required for this proposal to land.

## Alternatives considered

- **Bundle a specific embedding provider as a hard dependency** (e.g.
  always call a particular hosted API). Rejected: it would make the base
  `moca-index` install non-functional offline and implicitly pick a vendor
  the core spec deliberately stays neutral on (`docs/sidecar-index-spec.md`
  §1: "It does not define ... an embedding model"). The pluggable-adapter
  design keeps the default install fully offline (lexical-only,
  `--embedder none`) while leaving room for first-party adapter packages
  later, addressing the same open roadmap decision without forcing it now.
- **Fold `moca-index` into `moca-lint`** as a subcommand, matching how
  `pack` lives there. Rejected: unlike `pack` (which only re-packages
  files the target already has), `moca-index` performs a genuinely
  different class of operation — chunking heuristics, an embedding-adapter
  plugin surface, payload generation — with its own, likely much larger and
  more variable dependency footprint depending on which adapters a
  consumer installs. Keeping it a separate workspace package avoids that
  variability leaking into `moca-lint`'s dependency tree. `moca-index` MAY
  still depend on `moca-lint`'s library internals (canonical-digest
  reading, sidecar schema validation, archive writing) without merging the
  CLIs, the same relationship proposed for `moca-convert`.
- **Require `canonicalDigest` on the target as a hard precondition.**
  Rejected as a hard requirement: `canonicalDigest` is optional at the
  format level (core §5.5), and a sidecar can still be useful, if less
  verifiable, without one. The `--allow-unbound` escape hatch (step 1)
  preserves the spec's existing "producer SHOULD include
  `target_package_hash`... consumer MAY use a sidecar without a declared
  digest according to local policy" language (spec §4) instead of silently
  contradicting it.

## Implementation scope

If accepted, implementation touches only:

- New `tools/moca-index/` workspace package (CLI, chunker(s), embedder
  plugin interface + a `none`/lexical built-in, payload writer, tests,
  README).
- Extraction of shared logic `moca-index` needs from `moca-lint`
  (canonical-digest computation, sidecar schema validation, archive
  writing) into either a small shared internal library or a direct
  workspace dependency on `tools/moca-lint` — the exact factoring is an
  implementation detail for the PR, not fixed by this proposal.
- `.github/workflows/validate.yml` (new test job).
- `docs/quickstart.md`, `docs/sidecar-index-spec.md` (cross-reference
  only), `CHANGELOG.md`.

This proposal does not change `docs/sidecar-index-spec.md`'s normative
content, `schemas/core/sidecar-index.schema.json`, or any existing example.
