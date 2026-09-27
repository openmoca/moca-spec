# @openmoca/moca-mcp

An MCP server that serves MOCA packages to any agent. Every result is a
[citation record](../../spec/moca-reader-contract.md#7-citation-records): the
text plus package, version, digest, signature status, reviews, freshness and
evidence.

```sh
node tools/moca-mcp/bin/moca-mcp.js <package...> [--trust-root file] [--members dirs...] [--audience public,internal] [--embedder module]
```

- A `<package>` is a directory or `.moca` archive. Write `package=sidecar` to
  search through a sidecar index.
- `--trust-root` verifies publisher and review attestations. Without it,
  nothing is reported as signed or reviewed.
- `--audience` is the host's filter. Callers cannot widen it.
- `--embedder` (experimental) loads a module whose default export is an
  embedder (`name`, `version?`, `dimensions`, `embed(texts)`). Search then uses
  sidecar vectors. A sidecar whose model does not match is reported
  (`S006_MODEL_MISMATCH`), and that package is not searchable.

Every search goes through one `Search` entry point, so the default retrieval
policy and the audience filter apply whichever backend is used.

Invalid packages are skipped and reported on stderr; the server refuses to
start if none are valid.

## Tools

| Tool | Arguments | Returns |
| --- | --- | --- |
| `moca_list_packages` | none | Loaded packages: id, version, digest, signed, capabilities, search mode (`lexical`, `sidecar`, `dense` or `unavailable`). |
| `moca_search` | `query`, `limit?`, `locale?`, `include_all?`, `concepts?` | Citation records. Out-of-force, superseded and deprecated content is left out unless `include_all`. `concepts` keeps only content bound to one of those concept IRIs (ontology profile). |
| `moca_get_node` | `node_id`, `locale?` | One citation record with the node's full text. |

## Client configuration

```json
{
  "mcpServers": {
    "support-kb": {
      "command": "node",
      "args": ["/path/to/moca-spec/tools/moca-mcp/bin/moca-mcp.js", "/path/to/support-kb.moca",
               "--trust-root", "/path/to/trust-root.json", "--audience", "public"]
    }
  }
}
```

Package text is returned as data inside citation records. Tool descriptions
tell the model to quote and cite it, not follow it
([Reader contract §11](../../spec/moca-reader-contract.md#11-handing-content-to-a-model)).
