# Quickstart: Build Your First MOCA Package

This walkthrough builds a Level 1 (MOCA Core) package from ordinary JSON and
Markdown, then adds optional identity and concept-grounding metadata.

## 1. Start from the bare example

The smallest valid MOCA package is
[examples/level-1-bare](../examples/level-1-bare): a `moca.json` manifest plus
one plain CommonMark file. Copy that folder as your starting point:

```sh
cp -r examples/level-1-bare my-package
```

## 2. The manifest (`moca.json`)

Every MOCA package needs a root manifest with, at minimum, `id`, `version`,
and `title` ([core §5.1](../moca-core-spec.md#51-manifest-properties)):

```json
{
  "id": "urn:moca:example:my-package",
  "version": "1.0.0",
  "title": "My Package"
}
```

Do not add `endpoints`, `settings`, `credentials`, or `apiKeys` — these are
explicitly excluded from any MOCA manifest
([core §5.3](../moca-core-spec.md#53-excluded-properties)) because MOCA
packages are runtime-independent data, not configuration.

## 3. Add plain CommonMark content

Create at least one Markdown file under `content/`:

```markdown
# My First Node

This content can be consumed with ordinary Markdown tooling.
```

No YAML frontmatter is required. When a node has no explicit `id`, a harness
identifies it by its file path relative to `content/`, such as
`01-my-first-node.md`.

This is the informal **bare** rung of Level 1. The terms bare, identified, and
grounded describe increasing metadata richness within Level 1; they are not
new conformance levels.

## 4. Optional: add identity and concept grounding

Add frontmatter when consumers need a stable identifier or display title.
This is the informal **identified** rung:

```markdown
---
id: urn:node:my-first-node
title: My First Node
---
# My First Node

This content has an explicit identity.
```

Concept binding and other metadata are also optional. To use a CURIE such as
`ex:MyConcept`, first add its prefix to an inline `@context` in `moca.json`:

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

Then enrich the content node with concept and provenance metadata
([core §7.1](../moca-core-spec.md#71-commonmark-knowledge-nodes-content)):

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

This is the informal **grounded** rung. The
[level-1-minimal example](../examples/level-1-minimal) demonstrates this form.
An `@context` is required only when a CURIE appears anywhere in the package;
it is unnecessary for the bare example because that package uses no CURIEs.

## 5. Validate

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

## 6. Going further

| Want to... | Look at |
|---|---|
| Add JSON-LD, ontologies, SHACL validation, and RDF-interpretable claims (Level 2) | [examples/level-2-semantic](../examples/level-2-semantic) |
| Add Web Annotation evidence locators and a signed Agent Skill (Level 3) | [examples/level-3-extended](../examples/level-3-extended) |
| Build a tutoring/courseware package | [examples/education-profile](../profiles/education/examples/education-profile), [moca-education-profile.md](../profiles/education/moca-education-profile.md) |
| Ground an AI harness against existing content without modifying it | [examples/augmentation-generic](../examples/augmentation-generic), [examples/augmentation-scorm2004](../examples/augmentation-scorm2004) |
| Apply a regulatory/compliance standard to a package | [examples/eu-ai-act-profile](../profiles/eu-ai-act/examples/eu-ai-act-profile), [moca-eu-ai-act-profile.md](../profiles/eu-ai-act/moca-eu-ai-act-profile.md) |
| Define a reproducible whole-package identity, including composed members | [examples/composition-members](../examples/composition-members), [core §5.5](../moca-core-spec.md#55-canonical-package-digest) |
| Record freshness and lineage (`validFrom`, `lastReviewed`, `supersedes`) | [examples/level-1-minimal/moca.json](../examples/level-1-minimal/moca.json), [core §7.5](../moca-core-spec.md#75-content-node-lifecycle-fields) |
| Trace a claim's provenance against PROV-O | [examples/level-2-semantic](../examples/level-2-semantic), [core §7.4](../moca-core-spec.md#74-explicit-claims-graph-claims) |
| Compose a package from other packages, or relate two independent packages | [examples/composition-members](../examples/composition-members), [examples/composition-relates](../examples/composition-relates), [core §10](../moca-core-spec.md#10-package-composition--relationships) |

For the full normative rules, see
[moca-core-spec.md](../moca-core-spec.md).
