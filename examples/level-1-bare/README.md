# Level 1 Bare Example

This package demonstrates the informal **bare** rung of Level 1. It is fully
Level 1 conformant with only:

- A `moca.json` containing `id`, `version`, and `title`.
- One plain CommonMark file under `content/`.

The content has no YAML frontmatter. A harness therefore identifies the node
by its path relative to `content/`: `01-intro.md`.

The package has no `@context` because it uses no CURIEs. It also requires no
model, vector database, hosted service, credentials, or agent framework.

"Bare" is documentation shorthand, not a separate conformance level. Authors
can add optional identity and concept-grounding metadata while remaining at
Level 1. See [the grounded example](../level-1-minimal) for the richer end of
that same conformance level.
