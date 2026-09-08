# moca-index

CLI that builds a [`.moca.idx` sidecar index](../../docs/sidecar-index-spec.md)
for a MOCA package: the `index.json` manifest plus a `payload/` search
payload. A `.moca` package remains complete and usable without one — this
tool exists so a producer doesn't have to hand-write the manifest, chunk
`content/`, or bind against the target's `canonicalDigest` themselves.

**V1 scope is deliberately small:** one chunk per content file
(`chunk_index: 0`, `chunk_count: 1`), and a single, lexical (no embedding
vectors) index type. Real embedding providers are a documented future
extension point — see [Embedder](#embedder) below.

## Install

From the repo root (moca-index is an npm workspace):

```sh
npm install
```

## Usage

```sh
moca-index build <package-dir> -o <output-path> [options]
```

```sh
moca-index build examples/level-1-minimal -o my-index
moca-index build examples/level-1-minimal -o my-index.moca.idx --zip
```

`<package-dir>` must contain a `moca.json` with an `id` and a `content/`
directory with at least one Markdown file. `-o/--output` is a directory by
default, or a single archive file with `--zip`.

`moca-index` self-validates its own output (schema conformance, the
`chunk_index`/`chunk_count` addressing invariant, and — when bound — that
`target_package_hash` still matches the target's actual `canonicalDigest`)
before reporting success, and is **fail-closed**: nothing is written if
that check fails.

## Binding

Per [docs/sidecar-index-spec.md](../../docs/sidecar-index-spec.md) §4, the
sidecar is bound to its target via `target_package_hash`, preferring the
target's own `canonicalDigest.value` (core §5.5). `moca-index` reads this
directly from the target's `moca.json` — it does not compute or verify the
target's `canonicalDigest` itself; that's the target package's own concern.

If the target has no `canonicalDigest`, `moca-index` refuses by default,
since an unbound sidecar can't be verified as synchronized with its target:

```sh
moca-index build ./my-package -o my-index --allow-unbound
```

A target that declares `composition.members` is refused entirely (with or
without `--allow-unbound`) — binding against a composed package's identity
isn't supported yet.

## Embedder

`--embedder <name>` selects an embedding provider; only `"none"`
(lexical-only, the default) is implemented. Passing any other value is a
usage error. This flag exists now so a real embedding backend can be added
later without a CLI redesign.

## Options

| Option | Description |
|---|---|
| `-o, --output <path>` | Output directory (default) or archive file path (with `--zip`). Required. |
| `--allow-unbound` | Build a sidecar even when the target has no `canonicalDigest`. |
| `--zip` | Write a single `.moca.idx` archive file instead of a directory. |
| `--force` | Allow overwriting a non-empty output directory, or an existing output file with `--zip`. |
| `--embedder <name>` | Only `none` (default) is implemented. |

## Exit codes

- `0` — the sidecar was built and passed its own validation.
- `1` — the built sidecar failed its own validation (an internal bug —
  should be rare); no output was written.
- `2` — usage error: bad target directory, no `content/` files, an
  unbound target without `--allow-unbound`, a composed target, an unknown
  `--embedder` value, or a non-empty/existing output without `--force`.

## Development

```sh
cd tools/moca-index
npm test              # node --test test/*.test.js
```
