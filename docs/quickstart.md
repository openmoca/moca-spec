# Quickstart: Build Your First MOCA Package

This walkthrough builds a Level 1 (MOCA Core) package from scratch, then
points you at where to go for JSON-LD, ontologies, and signed skills.

## 1. Start from the minimal example

The smallest valid MOCA package is
[examples/level-1-minimal](../examples/level-1-minimal): a `moca.json`
manifest plus one grounded content node. Copy that folder as your starting
point:

```sh
cp -r examples/level-1-minimal my-package
```

## 2. The manifest (`moca.json`)

Every MOCA package needs a root manifest with, at minimum, `id`, `version`,
and `title` ([core §5.1](../moca-core-spec.md#51-manifest-properties)):

```json
{
  "@context": {
    "ex": "https://example.org/vocab#"
  },
  "id": "urn:moca:example:my-package",
  "version": "1.0.0",
  "title": "My Package"
}
```

When a package uses CURIEs such as `ex:MyConcept`, `@context` is required. At
Level 1 it is an inline prefix map, so ordinary JSON tooling can resolve those
CURIEs without JSON-LD processing.

Do not add `endpoints`, `settings`, `credentials`, or `apiKeys` — these are
explicitly excluded from any MOCA manifest
([core §5.3](../moca-core-spec.md#53-excluded-properties)) because MOCA
packages are runtime-independent data, not configuration.

## 3. Ground content in `content/`

Add a CommonMark file under `content/` with YAML frontmatter linking it to a
concept ([core §7.1](../moca-core-spec.md#71-commonmark-knowledge-nodes-content)):

```markdown
---
id: urn:node:my-first-node
title: My First Node
concepts:
  - id: ex:MyConcept
    role: primary
epistemicStatus: sourced
summary: "One-line summary of what this node grounds."
---
# My First Node

The Markdown body a harness surfaces to a model or a user.
```

## 4. Validate

```sh
npm install
npx moca-lint lint my-package
```

This validates the package directory using the same manifest, content, and
referential-integrity checks used in CI. Conformance level is derived from the
package contents; it is not added to `moca.json`.

To validate only the manifest against
[schemas/core/moca.schema.json](../schemas/core/moca.schema.json), run:

```sh
npx ajv-cli validate -s schemas/core/moca.schema.json -d my-package/moca.json --spec=draft2020
```

## 5. Going further

| Want to... | Look at |
|---|---|
| Add JSON-LD, ontologies, SHACL validation, and RDF-interpretable claims (Level 2) | [examples/level-2-semantic](../examples/level-2-semantic) |
| Add Web Annotation evidence locators and a signed Agent Skill (Level 3) | [examples/level-3-extended](../examples/level-3-extended) |
| Build a tutoring/courseware package | [examples/education-profile](../examples/education-profile), [moca-education-profile.md](../moca-education-profile.md) |
| Ground an AI harness against existing content without modifying it | [examples/augmentation-generic](../examples/augmentation-generic), [examples/augmentation-scorm2004](../examples/augmentation-scorm2004) |

For the full normative rules, see
[moca-core-spec.md](../moca-core-spec.md).
