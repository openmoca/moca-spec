# @openmoca/moca-lint

Checks packages exactly as the reference Reader reads them, and packs and
extracts `.moca` archives.

```sh
moca-lint lint <package> [--trust-root f] [--members dirs...] [--sidecar path] [--strict] [--format text|json|sarif] [--output f]
moca-lint digest <package>
moca-lint info <package> [--trust-root f]
moca-lint pack <dir> -o <file.moca> [--trust-root f] [--members dirs...] [--strict]
moca-lint extract <archive> -o <dir>
```

- `lint` exits 1 when there is any error-severity diagnostic, 0 otherwise.
  Codes are listed in [Reader contract §10](../../spec/moca-reader-contract.md#10-diagnostics).
- `digest` prints the canonical digest; it is the same for a folder and its
  archive.
- `pack` writes nothing if lint fails. The archive contains the package's
  regular files and its `attestations/`; hidden entries are left out.
- `extract` applies the Reader's archive checks before writing anything.
- `--format sarif` produces a report for code-scanning tools.

In this repository: `node tools/moca-lint/bin/moca-lint.js ...`.
