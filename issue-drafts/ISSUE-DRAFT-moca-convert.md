# [Tool] `moca-convert` — Create Level 1 Packages from Existing Sources

## Roadmap context

[ROADMAP.md item 5](../ROADMAP.md#5-open-source-cli-application-and-developer-tooling)
(Open Source CLI Application and Developer Tooling) names `moca-convert` as a
planned capability:

> `moca-convert` to create Level 1 packages from directories, Markdown
> sources, Obsidian vaults, and suitable OpenAPI inputs.

No conversion tool exists yet. This is a from-scratch tool proposal, not a
core spec change — no edits to `moca-core-spec.md` or `schemas/core/` are
required, since the tool only ever emits packages that already satisfy the
existing Level 1 floor (core §3, as lowered by the merged
`issue-drafts/ISSUE-DRAFT-level1.md`).

This draft is independent of, and does not block on,
`ISSUE-DRAFT-moca-pack.md` or `ISSUE-DRAFT-moca-index.md` — it only produces
plain package directories, which `moca-lint`/`moca-pack` already lint and
archive.

## Affected / new paths

- New workspace package `tools/moca-convert/`, structured like
  `tools/moca-lint/` (`bin/`, `lib/`, `test/`, `README.md`,
  `package.json`), picked up automatically by the existing
  `"workspaces": ["tools/*"]` entry in the root `package.json`.
- `.github/workflows/validate.yml` — add a job running
  `tools/moca-convert`'s own test suite, mirroring the existing
  `moca-lint (tests + example packages)` job.
- `docs/quickstart.md` — a new "Converting existing content" section.
- `CHANGELOG.md`.

## Problem

Authoring a valid Level 1 package by hand (a `moca.json` plus CommonMark
under `content/`) is already low-friction by design (core §3), but most
prospective content doesn't start out in that shape — it exists as a folder
of loose Markdown files, an Obsidian vault, or an OpenAPI document. Without
a conversion path, every adopter re-derives the same mechanical mapping
(what becomes `id`, how frontmatter maps to node metadata, how internal
links translate) independently, which is exactly the kind of ad hoc,
incompatible tooling the roadmap's "low entry bar" principle is meant to
avoid.

## Proposed change

Add a `moca-convert` CLI with one primary command:

```sh
moca-convert <input> -o <output-dir> [--from directory|markdown|obsidian|openapi] [options]
```

`--from` is optional; when omitted, the tool inspects `<input>` (file
extension, directory shape, presence of an Obsidian `.obsidian/` folder, an
OpenAPI `openapi`/`swagger` root key) and picks a source adapter, refusing
to guess and exiting with a usage error (matching `moca-lint`'s exit code 2
convention) when the input is ambiguous.

Every adapter emits **only** a Level 1 package: a `moca.json` with the
required `id`/`version`/`title` and CommonMark files under `content/`.
`moca-convert` never fabricates `ontologies/`, `claims[]`, `profile`,
`profileData`, embeddings, or a `signature` — semantic enrichment stays a
deliberate, manual, Level 2/3 upgrade step (core's "opt-in complexity"
principle), not something a converter infers from source formatting.

### Source adapters

**`directory`** — a folder of Markdown files (optionally nested). Each
`.md` file becomes one content node at the corresponding path under
`content/`. Existing YAML frontmatter is preserved as-is when it already
matches core §7.1 content-node frontmatter shape; unrecognized frontmatter
keys are left untouched under the file's own frontmatter block (Level 1
does not require frontmatter to be authoritative — core §7.1 makes it
optional) rather than silently dropped.

**`markdown`** — a single Markdown file or glob of files with no shared
directory structure to preserve; each becomes one `content/<slugified
title-or-filename>.md`.

**`obsidian`** — an Obsidian vault directory. Each note becomes a content
node. `[[wikilink]]` targets are rewritten to relative Markdown links
against the converted `content/` tree when the linked note is included in
the conversion; a wikilink to an excluded or unresolvable note is left as
literal text with a conversion-time warning (not silently dropped, not a
hard failure). Obsidian-specific frontmatter (`tags`, `aliases`, etc.) is
preserved verbatim alongside any recognized core frontmatter keys, same
rule as the `directory` adapter.

**`openapi`** — a "suitable" OpenAPI 3.x document (JSON or YAML): one
whose operations carry human-readable `summary`/`description` fields, not
a bare machine-generated schema dump. The adapter emits one content node
per operation (or per tag-grouped set of operations, configurable) with
the operation's description as prose and its request/response shapes
rendered as fenced code blocks. Because "suitable" is a judgment call, the
adapter MUST validate suitability up front — e.g. refuse (exit code 2, not
a silently thin package) an input where fewer than some documented
threshold of operations have a non-empty `description` — rather than
emitting a low-value package that merely echoes the raw schema.

### Determinism and output validation

- Content-node `id` (when the adapter can't derive one from source
  frontmatter) MUST fall back to the file's `content/`-relative path,
  consistent with the same fallback already specified for hand-authored
  Level 1 packages (core §7.1).
- Given the same input and flags, `moca-convert` MUST produce byte-identical
  output on repeated runs (no embedded timestamps, no nondeterministic
  ordering) — this matters because a converted package is expected to be
  linted, diffed, and version-controlled like any hand-authored one.
- `moca-convert` MUST lint its own output against `moca-lint` before
  reporting success (invoking it as a library dependency, not by shelling
  out) and MUST fail closed — refuse to write, or clearly mark as invalid —
  if the emitted package doesn't pass with zero error-severity findings.
  This mirrors `moca-lint pack`'s existing fail-closed contract
  (`tools/moca-lint/lib/pack.js`) and keeps the two tools' guarantees
  consistent.

### What this does not specify

- **Semantic enrichment.** No ontology inference, no `claims[]` extraction,
  no automatic profile selection. A converted package is Level 1 only; a
  human decides whether and how to add Level 2/3 structure afterward.
- **Embedding/index generation.** Out of scope — that's `moca-index`
  (`ISSUE-DRAFT-moca-index.md`), run as a separate, later step against the
  converted package.
- **SCORM/cmi5 or other structured courseware import.** That's a distinct,
  already-tracked roadmap item ([core §11](../ROADMAP.md#11-compliance-and-standards-profiles),
  item 11's generic courseware-import tooling), which additionally has to
  emit a `composition`-linked package set, not a single flat package. This
  proposal's `directory`/`markdown`/`obsidian`/`openapi` adapters are
  deliberately simpler, single-package conversions.
- **Multi-package/`composition` output.** Every adapter in this proposal
  produces exactly one package. A future adapter option (e.g. "one package
  per top-level vault folder, joined by `composition.members`") is a
  reasonable follow-up but is left out here to keep the first version's
  surface area small and matched to the roadmap wording ("create Level 1
  packages," not composed package sets).

## Alternatives considered

- **Fold conversion into `moca-lint` as a new subcommand** (`moca-lint
  convert`), matching how `pack` already lives there. Rejected for the
  primary command surface: `moca-lint`'s job is analysis of an existing
  package: conversion is a fundamentally different operation (source format
  detection, lossy-mapping judgment calls, four independent adapters) with
  its own dependency footprint (a Markdown/frontmatter parser is already
  shared, but an OpenAPI parser is a new, sizeable dependency `moca-lint`
  itself has no other reason to carry). A separate workspace package keeps
  `moca-lint` lean and lets `moca-convert` version independently as its
  adapters mature at different rates. `moca-convert` MAY still depend on
  `moca-lint`'s library internals for output validation (see above) without
  merging the CLIs.
- **LLM-assisted conversion** (e.g., using a model to draft frontmatter or
  summaries). Rejected: it would contradict core's runtime-independence
  principle for the package format if `moca-convert` became a de facto
  required dependency for authoring, and would make output non-deterministic
  unless carefully constrained. Nothing here prevents a separate, optional,
  clearly-labeled tool from doing this later; it should not be
  `moca-convert`'s default or only path.

## Implementation scope

If accepted, implementation touches only:

- New `tools/moca-convert/` workspace package (CLI, four source adapters,
  tests, README).
- `.github/workflows/validate.yml` (new test job for the package).
- `docs/quickstart.md`, `CHANGELOG.md`.

This proposal does not change `moca-core-spec.md`, `schemas/core/`, or any
existing example package.
