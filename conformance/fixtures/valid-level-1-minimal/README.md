# Level 1 Grounded Example

This package demonstrates the informal **grounded** rung of Level 1. It has
the same Level 1 conformance number as
[the bare example](../level-1-bare), but enriches its CommonMark node with:

- An explicit node `id` and `title`.
- Concept binding through `concepts`.
- An `epistemicStatus` and `summary`.
- An inline `@context` that resolves the `ex:` CURIE prefix.

All of this frontmatter is optional at Level 1. It is useful when consumers
need stable identifiers, concept-aware discovery, or provenance metadata.
Packages that only need portable Markdown can use the bare form instead.
