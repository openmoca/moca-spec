# @openmoca/moca-convert

Creates MOCA packages from existing sources. Every node it writes is an OKF
concept document with a `type`, and the package id must be an absolute URI.

```sh
moca-convert <input> -o <dir> --id <uri> [--title text] [--version semver] [--type type]
             [--language bcp47] [--license spdx] [--from directory|markdown|obsidian|openapi]
             [--exclude glob...] [--chunker operation|tag] [--min-description-ratio 0-1]
             [--force] [--strict] [--format text|json]
```

| Adapter | Input | Default `type` |
| --- | --- | --- |
| `directory` | A folder of Markdown, structure preserved | `Document` |
| `markdown` | One file or a glob; names from titles | `Document` |
| `obsidian` | A vault (has `.obsidian/`); wikilinks become Markdown links | `Note` |
| `openapi` | An OpenAPI 3.x document with real descriptions | `API Operation` or `API Tag` |

- Existing frontmatter is kept byte for byte. A file without a `type` gets
  `type` (and `title`, if missing) added at the top of its frontmatter.
- The adapter is detected from the input unless `--from` is given; ambiguous
  input is refused, not guessed.
- Output is read back with the reference Reader before anything is left on
  disk. If it would be invalid, nothing is written.
