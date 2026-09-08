# Quickstart

Build a valid MOCA package in five minutes, using ordinary JSON and Markdown.

New to MOCA? [Why MOCA?](why-moca.md) explains what problem it solves first.

## 1. Copy the smallest valid package

```sh
cp -r examples/level-1-bare my-package
```

[level-1-bare](../examples/level-1-bare) is a `moca.json` plus one plain
CommonMark file. That is the entire Level 1 floor.

## 2. The manifest

Every package needs a root `moca.json` with at minimum `id`, `version`, and
`title` ([core §5.1](../spec/moca-core-spec.md#51-manifest-properties)):

```json
{
  "id": "urn:moca:example:my-package",
  "version": "1.0.0",
  "title": "My Package"
}
```

Do **not** add `endpoints`, `settings`, `credentials`, or `apiKeys`. These are
forbidden in any MOCA manifest
([core §5.3](../spec/moca-core-spec.md#53-excluded-properties)) — a package is
portable data, never runtime configuration.

## 3. Add content

At least one Markdown file under `content/`:

```markdown
# My First Node

This content can be consumed with ordinary Markdown tooling.
```

No frontmatter required. Without an explicit `id`, a consumer identifies the
node by its path relative to `content/` — here, `01-my-first-node.md`.

You now have a conformant Level 1 package.

## 4. Validate

```sh
npm install
npx moca-lint lint my-package
```

Conformance level is *derived* from what the package contains — it is never
declared in `moca.json`.

To validate only the manifest against the schema:

```sh
npx ajv-cli validate -s schemas/v1/core/moca.schema.json \
  -d my-package/moca.json --spec=draft2020
```

## 5. Package it

```sh
npx moca-lint pack my-package -o my-package.moca
npx moca-lint extract my-package.moca -o my-package-copy
```

`pack` is fail-closed — it refuses to write if any error-severity finding is
present.

## Already have content?

[`moca-convert`](../tools/moca-convert/README.md) builds a Level 1 package
from what you have, and lints its own output before reporting success:

```sh
# A folder of Markdown, structure preserved
npx moca-convert ./docs -o my-package --id urn:moca:example:my-docs --title "My Docs"

# An Obsidian vault, [[wikilinks]] rewritten to relative links
npx moca-convert ./my-vault -o my-package --id urn:moca:example:my-vault

# An OpenAPI 3.x document, one content node per operation
npx moca-convert ./openapi.yaml -o my-package --id urn:moca:example:my-api
```

## Next steps

| If you want to… | Go to |
|---|---|
| See the whole pipeline, convert → sign → index → answer | [End-to-end walkthrough](walkthrough.md) |
| Add identity, concepts, evidence, freshness, composition | [Authoring guide](guides/authoring.md) |
| Build something that *reads* packages | [Consuming a package](guides/consuming.md) |
| Work out which conformance level you need | [Choosing a level](guides/choosing-a-level.md) |
| Sign a package, or ship `skills/` | [Signing and trust](guides/signing-and-trust.md) |
| Add semantic or hybrid search | [Search and indexes](guides/search-and-indexes.md) |
| See MOCA shaped like real corpora | [Use-case examples](../examples/use-cases) |

### Example packages

| Example | Shows |
|---|---|
| [level-1-bare](../examples/level-1-bare) | The minimum valid package |
| [level-1-minimal](../examples/level-1-minimal) | Frontmatter, concepts, lifecycle fields |
| [level-2-semantic](../examples/level-2-semantic) | Ontologies, SHACL, RDF-interpretable claims |
| [level-3-extended](../examples/level-3-extended) | Web Annotation locators, a signed skill |
| [composition-members](../examples/composition-members) | A package composed of other packages |
| [composition-relates](../examples/composition-relates) | Loose cross-package relationships |
| [augmentation-generic](../examples/augmentation-generic) | Grounding content you can't modify |
| [use-cases/support-kb](../examples/use-cases/support-kb) | Epistemic status as a retrieval signal |
| [use-cases/policy-corpus](../examples/use-cases/policy-corpus) | Versioned policy with supersession |
| [education-profile](../profiles/education/examples/education-profile) | A domain profile applied |
| [eu-ai-act-profile](../profiles/eu-ai-act/examples/eu-ai-act-profile) | A compliance profile applied |

For the full normative rules, see
[the core specification](../spec/moca-core-spec.md).
