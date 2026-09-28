# @openmoca/moca-convert

Creates MOCA packages from existing sources, including YouTube videos and
playlists. Every node it writes is an OKF
concept document with a `type`, and the package id must be an absolute URI.

```sh
moca-convert <input> -o <dir> --id <uri> [--title text] [--version semver] [--type type]
             [--language bcp47] [--license spdx] [--from directory|markdown|obsidian|openapi|youtube]
             [--exclude glob...] [--chunker operation|tag] [--min-description-ratio 0-1]
             [--force] [--strict] [--format text|json]
```

| Adapter | Input | Default `type` |
| --- | --- | --- |
| `directory` | A folder of Markdown, structure preserved | `Document` |
| `markdown` | One file or a glob; names from titles | `Document` |
| `obsidian` | A vault (has `.obsidian/`); wikilinks become Markdown links | `Note` |
| `openapi` | An OpenAPI 3.x document with real descriptions | `API Operation` or `API Tag` |
| `youtube` | A capture folder written by `moca-youtube` | `Video` |

- Existing frontmatter is kept byte for byte. A file without a `type` gets
  `type` (and `title`, if missing) added at the top of its frontmatter.
- The adapter is detected from the input unless `--from` is given; ambiguous
  input is refused, not guessed.
- Output is read back with the reference Reader before anything is left on
  disk. If it would be invalid, nothing is written.

## YouTube

`moca-youtube` captures a video or a playlist with
[yt-dlp](https://github.com/yt-dlp/yt-dlp), which must be installed, and then
runs `moca-convert --from youtube` on the capture:

```sh
moca-youtube <url> -o <dir> --id <uri> [--title text] [--version semver] [--type type]
             [--language bcp47] [--license spdx] [--capture-dir dir] [--no-convert]
             [--yt-dlp path] [--force] [--quiet]
```

- Each video becomes one node: its description, and a transcript from its
  captions grouped by chapter. The captions are written under `media/` as
  WebVTT and the description under `sources/`, and the node cites each
  chapter as a time range (`t=start,end`) and quotes the description, so the
  package is `self-contained-evidence`.
- A playlist also gets `content/index.md` and a `structure.ttl` that keeps the
  videos in playlist order.
- Captions the creator supplied in `--language` (default `en`) are preferred,
  then YouTube's automatic ones. A video without captions is kept, without a
  transcript, and reported.
- `--capture-dir` keeps the capture (`youtube-capture.json` and
  `videos/<id>/`); converting it again gives the same package. Without it the
  capture goes to a temporary directory.
- yt-dlp is run directly, without a shell, so this works on macOS, Linux and
  Windows. Point at it with `--yt-dlp` or `$YT_DLP` when it is not on `PATH`.

See [`examples/youtube`](../../examples/youtube).
