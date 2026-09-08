# moca-convert

CLI that creates a Level 1 [MOCA](../../moca-core-spec.md) package (a
`moca.json` plus CommonMark under `content/`) from existing source material.
It never fabricates ontologies, claims, profiles, embeddings, or a
signature — output is Level 1 only; semantic enrichment stays a deliberate,
manual, later step.

**Status: work in progress.** `directory`, `markdown`, and `obsidian` are
implemented. `openapi` is planned (see
[issue-drafts/ISSUE-DRAFT-moca-convert.md](../../issue-drafts/ISSUE-DRAFT-moca-convert.md)).

## Install

From the repo root (moca-convert is an npm workspace):

```sh
npm install
```

## Usage

```sh
moca-convert <input> -o <output-dir> --id <urn> --title <string> [options]
```

`<input>` is a source file or directory. `--from` selects the adapter
explicitly (`directory|markdown|obsidian|openapi`); when omitted, it's
auto-detected from the input's shape, refusing rather than guessing when
detection is ambiguous.

```sh
moca-convert ./docs -o ./my-package --id urn:moca:example:my-docs --title "My Docs"
```

`moca-convert` lints its own output with `moca-lint` before reporting
success and is **fail-closed**: if the emitted package has any
error-severity finding, nothing is written (or, with `--force` against an
existing output directory, that directory is left untouched) and the CLI
exits `1`.

## Options

| Option | Description |
|---|---|
| `-o, --output <dir>` | Output package directory (required). |
| `--id <urn>` | Manifest `id` (required). |
| `--title <string>` | Manifest `title` (required for `directory`/`markdown`/`openapi`). |
| `--version <semver>` | Manifest `version`. Default `1.0.0`. |
| `--from <format>` | `directory\|markdown\|obsidian\|openapi`. Auto-detected if omitted. |
| `--exclude <glob...>` | `obsidian` only: note paths to exclude from conversion (still indexed for wikilink resolution). |
| `--force` | Allow writing into a non-empty output directory. |
| `--strict` | Escalate warning-level output-validation findings to errors. |
| `--format <fmt>` | `text` (default) or `json` summary output. |
| `--report <file>` | Write the formatted summary to a file. |
| `--log-file <file>` | Append a full debug trace to a file. |
| `-v, --verbose` | Increase console trace output (repeatable). |
| `-q, --quiet` | Suppress non-error console output. |
| `--no-color` | Disable colored output. |

## Exit codes

- `0` — conversion succeeded; output written and passed the `moca-lint`
  gate with zero error-severity findings.
- `1` — conversion completed internally but the emitted package failed its
  own validation gate; no output was left on disk.
- `2` — usage error: bad/missing input path, ambiguous format detection,
  missing required `--id`/`--title`, an adapter-specific flag (e.g.
  `--exclude`) used with the wrong adapter, or a non-empty output directory
  without `--force`.

## Adapters

### `directory`

A folder of Markdown files (optionally nested). Each `.md` file becomes one
content node at the corresponding path under `content/`. Existing YAML
frontmatter — including any `id` — is preserved; a file with no frontmatter
produces a file with no frontmatter block in the output. When a file has no
`id`, none is synthesized: core §7.1's fallback (identity derived from the
file's path relative to `content/`) applies.

### `markdown`

A single Markdown file, or a glob of files (e.g. `"docs/*.md"`) with no
directory structure worth preserving. Each file becomes
`content/<slug>.md`, where the slug is derived from a title — frontmatter
`title`, falling back to the first `# H1` heading, falling back to the
filename — not from the source path. Frontmatter is preserved the same way
as the `directory` adapter. Files whose derived titles collide get `-2`,
`-3`, ... suffixes, assigned deterministically in sorted-input order.

### `obsidian`

An Obsidian vault directory (detected by its top-level `.obsidian/`
folder). Each note becomes a content node at its same relative path under
`content/`, and `[[wikilink]]`/`[[target|alias]]`/`[[target#heading]]`
syntax is rewritten to relative Markdown links — resolved by note filename
first, then by any frontmatter `aliases` entry, matching Obsidian's own
resolution order. A destination containing a space (common with
human-titled filenames) is wrapped in angle brackets so it stays valid
CommonMark. A wikilink that can't be resolved, or that resolves to a note
excluded via `--exclude`, is left as literal `[[...]]` text with a non-fatal
warning (`W_UNRESOLVED_WIKILINK` / `W_EXCLUDED_WIKILINK`) rather than
failing the conversion; `![[embed]]` transclusion syntax has no CommonMark
equivalent and is always left literal with a `W_UNSUPPORTED_EMBED` warning.
Wikilink syntax inside fenced code blocks is never touched. All frontmatter
keys are preserved verbatim. `--title` defaults to the vault directory's
basename when omitted.

## Development

```sh
cd tools/moca-convert
npm test              # node --test test/*.test.js
```
