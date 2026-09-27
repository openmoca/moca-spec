# Architecture decision records

Each record states one decision, the options considered, and what would make
us revisit it. Records are numbered in order and never renumbered. A decision
that changes is superseded by a new record, not edited.

| ADR | Decision |
| --- | --- |
| [0001](0001-package-layer-over-okf.md) | MOCA is a package layer over the Open Knowledge Format |
| [0002](0002-computed-digest-and-detached-attestations.md) | The digest is computed, never declared; attestations are detached |
| [0003](0003-reader-mcp-server-and-adapters.md) | ~~One Reader, an MCP server and framework adapters, not a harness per language~~ Superseded by 0007 |
| [0004](0004-capabilities-not-levels.md) | Named capabilities instead of conformance levels |
| [0005](0005-oci-transport-binding.md) | OCI registries as an optional transport binding |
| [0006](0006-reader-rules-not-forbidden-keys.md) | Safety comes from Reader rules, not forbidden manifest keys |
| [0007](0007-reader-interface-and-per-language-readers.md) | A language-neutral Reader interface here, one Reader repository per language (supersedes 0003) |
| [0008](0008-search-backend-interface.md) | One search entry point over pluggable backends, with policy in one place |
| [0009](0009-ontology-profile.md) | Optional ontology as a profile, with local files and absolute IRIs |
| [0010](0010-self-contained-evidence.md) | Carrying the original sources is a capability a Reader can check |

New records use the template in [0000-template.md](0000-template.md).
