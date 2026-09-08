# [Tool] Complete the `moca-pack` Archive Create/Extract Workflow

## Roadmap context

[ROADMAP.md item 5](../ROADMAP.md#5-open-source-cli-application-and-developer-tooling)
names, as a planned capability:

> `moca-pack` or equivalent archive creation and extraction workflows.

Archive **creation** already exists and is fail-closed:
`moca-lint pack <target> -o <out.moca>`
(`tools/moca-lint/lib/pack.js`, documented in
`tools/moca-lint/README.md` "Pack") lints a target directory first and
refuses to write the archive if any error-severity finding is present, then
zips it with `moca.json` at the archive root. Archive **extraction** exists
only as an internal implementation detail: `resolveTarget()`
(`tools/moca-lint/lib/target.js`) already extracts a `.moca`/`.zip` to a
temp directory — with zip-bomb/path-traversal defenses (entry count cap,
uncompressed-size cap, `..` rejection) — so `moca-lint lint`/`pack` can
operate on an archive input, but that temp directory is always cleaned up
immediately after the command finishes. There is no user-facing command
that persists an extracted package to a directory the user chooses.

This is a smaller, narrower gap than `moca-convert` or `moca-index`: most of
the roadmap bullet's "or equivalent" is already satisfied. This proposal is
almost entirely additive to `tools/moca-lint`, not a new tool.

## Affected paths

- `tools/moca-lint/lib/target.js` — extract the archive-extraction logic
  (currently inlined in `resolveTarget()`) into a reusable
  `extractArchive(archivePath, destDir)` function that both `resolveTarget`
  and the new command call, so the size/entry/path-traversal guards are
  defined once.
- `tools/moca-lint/bin/moca-lint.js` — new `extract` subcommand.
- `tools/moca-lint/test/` — new test file for `extract` (successful
  extraction, zip-bomb rejection, path-traversal rejection, refusing to
  overwrite a non-empty destination without `--force`).
- `tools/moca-lint/README.md` — document `extract` alongside `lint`/`pack`.
- `docs/quickstart.md` — mention the create → lint → pack → (later)
  extract round trip.
- `CHANGELOG.md`.

## Problem

An author can already turn a directory into a `.moca` archive
(`moca-lint pack`), and any command can transparently *read* a `.moca`
archive without the user having to unpack it first. But there is no
supported way to go the other direction on purpose: given a `.moca` file a
teammate sent you, or one pulled from a registry, there's no command to
put its contents on disk as an ordinary directory for editing, diffing, or
inspection outside `moca-lint`. Today the only way to do that is to rename
the file to `.zip` and use a generic unzip tool, which bypasses the same
zip-bomb/path-traversal hardening `moca-lint` already applies when it reads
an archive itself — an inconsistency between the trusted and untrusted path
for the exact same operation.

## Proposed change

Add:

```sh
moca-lint extract <archive> -o <dest-dir> [--force]
```

Reuses the existing hardened extraction path (entry-count cap, uncompressed-
size cap, `..`-containing entry rejection — the same limits documented in
`tools/moca-lint/README.md` "Known limitations (v1)") instead of introducing
a second, divergent extraction code path. `-o/--out` is required (no
implicit default, unlike `pack`'s target-dirname default, since silently
extracting into the current directory is a worse default for an operation
that writes many files). Refuses to extract into a destination that exists
and is non-empty unless `--force` is passed, and always creates the
destination if it doesn't exist.

`extract` does **not** lint the result by default — unlike `pack`,
extraction of an untrusted archive is not fail-closed on content validity,
only on the existing structural defenses (size/entries/traversal), because
inspecting an invalid package is itself a legitimate use of `extract` (e.g.
"why did this fail `moca-lint lint`? let me look at the files"). Add
`--lint` as an opt-in flag that runs `moca-lint lint` against the extracted
directory afterward and reports findings, for the common case of "extract
and immediately check."

### Round-trip verification

Add a test asserting that `pack` → `extract` on an example package (e.g.
`examples/level-1-minimal`) reproduces a directory whose own
`canonicalDigest` (core §5.5, `scripts/validate-canonical-digest.mjs`)
matches the original — proving the create/extract cycle doesn't lose or
alter file bytes, independent of Zip metadata like entry order or
timestamps.

## What this does not specify

- **A distinct `moca-pack` binary/package.** See Alternatives below —
  this proposal keeps `pack`/`extract` inside `moca-lint`, matching
  `pack`'s existing placement, rather than splitting into a new
  `tools/moca-pack` workspace.
- **Registry push/pull.** "Archive creation and extraction" is local
  file I/O only; fetching a `.moca` from a remote registry is out of
  scope for this repository's tooling roadmap entirely (not mentioned
  anywhere in `ROADMAP.md`).
- **Selective/partial extraction** (e.g. extracting a single file out of
  an archive). Full-package extraction only, matching `pack`'s
  whole-directory granularity.

## Impact on existing behavior

Purely additive: `lint` and `pack` are unchanged. The refactor of
extraction logic out of `resolveTarget()` into a shared function must not
change `resolveTarget()`'s existing behavior or its temp-directory cleanup
contract — covered by the existing `tools/moca-lint/test/*.test.js` suite
continuing to pass unmodified.

## Alternatives considered

- **New standalone `tools/moca-pack` workspace package**, separate from
  `moca-lint`, matching the roadmap bullet's literal naming. Rejected:
  `pack` already lives in `moca-lint` and depends directly on
  `lintPackage()` for its fail-closed guarantee; splitting it into a
  separate package would mean either a circular workspace dependency or
  duplicating the lint-then-archive logic. The roadmap bullet's own
  wording ("`moca-pack` **or equivalent**") anticipates this — `moca-lint
  pack`/`moca-lint extract` is the equivalent. Worth revisiting only if the
  `moca-lint` binary name becomes a genuine discoverability problem once
  `moca-convert` and `moca-index` also ship as separate binaries (open
  question, not resolved by this proposal).
- **Always lint on extract (fail-closed like `pack`).** Rejected: extraction
  of a possibly-invalid archive for inspection is a legitimate primary use
  case (see Problem), so making it fail-closed on content validity would
  remove the one workflow this command exists to support. Structural
  (zip-bomb/traversal) defense stays mandatory; content linting stays
  opt-in via `--lint`.

## Implementation scope

If accepted, implementation touches only:

- `tools/moca-lint/lib/target.js` (extraction refactor into a shared
  function).
- `tools/moca-lint/bin/moca-lint.js` (new `extract` subcommand).
- `tools/moca-lint/test/` (new extraction tests, including the round-trip
  digest check).
- `tools/moca-lint/README.md`, `docs/quickstart.md`, `CHANGELOG.md`.

This proposal does not change `moca-core-spec.md`, `schemas/core/`, or the
existing `lint`/`pack` command contracts.
