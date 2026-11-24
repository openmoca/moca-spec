# MOCA, OKF and MCP

Three open efforts sit close together. They do different jobs, and work
together.

| | What it is | Its job |
| --- | --- | --- |
| **OKF**, the [Open Knowledge Format](https://github.com/open-knowledge-format/open-knowledge-format) | A file format: Markdown pages with YAML frontmatter and trust fields | How one page of knowledge is written |
| **MOCA**, Modular Ontology, Content & Attestation | A package format and the Readers that read it | How a body of knowledge travels: with its version, structure, sources and signatures, read the same way everywhere |
| **MCP**, the [Model Context Protocol](https://modelcontextprotocol.io) | A protocol between AI applications and the tools and data they use | How an agent asks for knowledge at run time |

## MOCA and OKF

**MOCA builds on OKF; it does not replace it.** Every page in a MOCA package
is an OKF document, and MOCA reads OKF's own fields (`type`, `generated`,
`verified`, `status`, `stale_after`) as OKF defines them.

OKF stops at the file, on purpose. MOCA adds what a body of knowledge needs
when it moves between systems or organisations: a package identity and
version, one digest over every file, signatures and reviews, the original
sources inside the package, validity windows, audiences, translations,
composition from other packages, and an optional ontology. A MOCA package
without any of these is still a valid OKF bundle with a manifest
([why MOCA](why-moca.md)).

## OKF 0.3

OKF 0.3 was published on 18 November 2026 ([OKF 0.3 specification](https://github.com/open-knowledge-format/open-knowledge-format/blob/main/SPEC.md)).
OpenMOCA 0.7.0 reads OKF 0.2 (commit `ad30107`) and moves to 0.3 in 0.8.0. The
[OKF 0.2 text we read](https://github.com/open-knowledge-format/open-knowledge-format/blob/ad30107c31c06aec8a7d5636e0d1058118604e6f/SPEC.md)
stays available at that commit.

### If you write to OKF 0.3 today

A package written to 0.7.0 is a valid OKF 0.3 bundle. Only the other direction
can fail. Until 0.8.0, avoid these in `content/`:

- **A title, description or licence in the root `index.md`.** OKF 0.3 allows
  them. A 0.7.0 Reader allows only `okf_version` there, and anything more is
  error `C004_RESERVED_FILE_INVALID`. Put the title, description and licence in
  the package manifest.
- **Paths that start with `/`.** OKF 0.3 resolves them from the bundle root.
  A 0.7.0 Reader refuses them (`C008_UNSAFE_PATH`). Write the path relative to
  the page's own folder.
- **An unknown `status` value.** OKF 0.3 treats it as not `stable`. A 0.7.0
  Reader serves it as `stable`, so a page you meant to hold back is returned.
  Use `draft`, `stable` or `deprecated`.
- **A `.md` file with no frontmatter or no `type`**, a README for example.
  OKF 0.3 skips it. A 0.7.0 Reader reports an error (`C001_FRONTMATTER_MISSING`
  or `C003_TYPE_MISSING`) and the package is not valid. Keep such files out of
  `content/`.

## MOCA and MCP

**MCP is how an agent reaches knowledge; MOCA is the knowledge it reaches.**
The MOCA MCP server, `moca-mcp`, serves packages to any MCP client:

- tools to list packages, search them, fetch a page and ask structure
  questions;
- every page as an MCP resource, so generic clients can read packages too;
- the same trust rules as every Reader: signatures verified against your
  trust root, and an audience filter the caller cannot widen.

So an MCP-capable assistant gets citations it can check, and content that is
current and meant for it, without any MOCA-specific code. See the
[MCP server](https://github.com/openmoca/moca-mcp-dotnet#readme) (one download, nothing to install) and the
[walkthrough](walkthrough.md#8-serve-it-to-an-ai-agent).

## In one sentence

Write pages in OKF, ship them as a MOCA package, and serve them over MCP, or
read them in-process with a MOCA Reader.
