# @openmoca/moca-index

Builds [sidecar indexes](../../spec/moca-sidecar-index-spec.md) in the portable
`moca-jsonl-v1` format, bound to a package's digest.

```sh
moca-index build <package> -o <out> [--zip] [--chunk node|headings] [--force] [--embedder module]
moca-index check <sidecar> --package <package>
```

- `--chunk node` indexes each node representation whole; `--chunk headings`
  splits at level 1-3 headings. Every chunk records UTF-8 byte offsets into its
  node file.
- The builder checks its own output with the Reader before finishing.
- Keep sidecars outside the package directory.

- `--embedder` (experimental) loads a module whose default export is an
  embedder (`name`, `version?`, `dimensions`, `embed(texts)`). Each item then
  gets a `vector`, and `index.json` records the embedder as its `model`
  (`indexType: hybrid`). A Reader searches the vectors only with an embedder
  for the same model.

Without `--embedder`, the sidecar is lexical: text and offsets, no vectors.
