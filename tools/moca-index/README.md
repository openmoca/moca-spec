# @openmoca/moca-index

Builds [sidecar indexes](../../spec/moca-sidecar-index-spec.md) in the portable
`moca-jsonl-v1` format, bound to a package's digest.

```sh
moca-index build <package> -o <out> [--zip] [--chunk node|headings] [--force]
moca-index check <sidecar> --package <package>
```

- `--chunk node` indexes each node representation whole; `--chunk headings`
  splits at level 1-3 headings. Every chunk records UTF-8 byte offsets into its
  node file.
- The builder checks its own output with the Reader before finishing.
- Keep sidecars outside the package directory.

This version builds lexical sidecars (text, no vectors). Dense sidecars use the
same format with a `vector` per item and a `model` in `index.json`.
