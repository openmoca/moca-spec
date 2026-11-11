# MOCA, OKF and MCP

Three open efforts sit close together. They do different jobs, and work
together.

| | What it is | Its job |
| --- | --- | --- |
| **OKF**, the [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format) | A file format: Markdown pages with YAML frontmatter and trust fields | How one page of knowledge is written |
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
