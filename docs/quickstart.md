# Quickstart

A valid package in five minutes. You need Node.js 22 or later; `npx` fetches
each tool.

## 1. Write a package

```sh
mkdir -p my-kb/content
```

`my-kb/moca.json`:

```json
{
  "id": "https://example.com/moca/my-kb",
  "version": "1.0.0",
  "title": "My knowledge base",
  "language": "en"
}
```

`my-kb/content/opening-hours.md`:

```markdown
---
type: Fact
title: Opening hours
verified:
  - by: human:you
    at: 2026-09-27T00:00:00Z
stale_after: 2027-03-27T00:00:00Z
---

# Opening hours

The office is open 09:00-17:00, Monday to Friday.
```

`type` is the one field OKF requires. The rest is optional.

## 2. Check it

```sh
npx @openmoca/moca-lint lint my-kb
```

```text
No findings.

sha256:…
capabilities: core
```

The `sha256:` line is the package's digest: change any byte and it changes.

## 3. Or convert existing Markdown

```sh
npx @openmoca/moca-convert ./docs -o my-docs \
  --id https://example.com/moca/my-docs --title "My docs"
```

`moca-convert` adds `type` and `title` to files that lack them and leaves
everything else untouched. It also reads Obsidian vaults and OpenAPI documents.

## 4. Ask it questions

Add the [MCP server](https://github.com/openmoca/moca-mcp-dotnet#readme) to any MCP client. It is one download with
nothing to install. For example, in a client's JSON configuration:

```json
{
  "mcpServers": {
    "my-kb": { "command": "/path/to/moca-mcp", "args": ["/path/to/my-kb"] }
  }
}
```

The client gets `moca_search`, `moca_get_node`, `moca_structure` and `moca_list_packages`, and
every result carries its citation.

## Next

- [Walkthrough](walkthrough.md): sign, review, index and serve.
- [Consuming packages](guides/consuming.md): read, verify, search and cite
  from your own code, in TypeScript or .NET.
- [Authoring](guides/authoring.md): evidence, validity windows, versions,
  members and relations.
