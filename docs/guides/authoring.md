# Authoring a MOCA package

The [quickstart](../quickstart.md) gets you a valid package. This guide covers
what you add once you want it to be genuinely useful to a consumer.

Everything here is optional. A package with none of it is still a conformant
Level 1 package.

## Grounding content nodes

A bare content node is just Markdown. Frontmatter turns it into something a
harness can reason about.

```markdown
---
id: urn:node:refund-window
title: Refund eligibility window
summary: "Customers may request a refund within 30 days of delivery."
concepts:
  - id: ex:RefundPolicy
    role: primary
  - id: ex:Delivery
    role: supporting
epistemicStatus: verified
lastReviewed: "2026-08-14"
evidence:
  - source: "./sources/commercial-policy-v4.pdf"
    locator:
      type: page
      page: 12
---
# Refund eligibility window

Customers may request a full refund within 30 days of delivery...
```

Taking the fields in order of how much value they add:

**`epistemicStatus`** is the highest-value field in the format and the most
under-used. It tells a consumer how much to trust this node:
`verified` (a human checked it), `sourced` (traceable but unverified),
`inferred`, `generated` (AI-written, unchecked), `disputed`, `deprecated`.
A harness should rank on it. If you set nothing else, set this.

**`lastReviewed`** and `validFrom` answer "is this current?". Content with an
honest review date is more useful than content with a rich ontology and no
freshness signal.

**`id`** gives the node an identity that survives file renames. Without it the
identity is the path relative to `content/` — fine, but brittle if you
reorganise.

**`concepts[]`** binds the node to concepts with a `role` (`primary` or
`supporting`), enabling graph-aware retrieval. Using a CURIE such as
`ex:RefundPolicy` requires declaring the prefix in an inline `@context` in
`moca.json`:

```json
{
  "@context": { "ex": "https://example.org/vocab#" },
  "id": "urn:moca:example:support-kb",
  "version": "1.0.0",
  "title": "Support knowledge base"
}
```

An `@context` is required only when a CURIE appears somewhere in the package.

**`evidence[]`** points at the source backing the content, optionally with a
locator (a page, a time range, a selector). Sources must resolve inside the
package — a consumer will reject paths that escape it.

## Lifecycle: freshness and supersession

Three optional fields, usable on the manifest and on content nodes
([core §7.5](../../spec/moca-core-spec.md#75-content-node-lifecycle-fields)):

| Field | Meaning |
|---|---|
| `validFrom` | When this content became authoritative |
| `lastReviewed` | When a human or defined process last confirmed it |
| `supersedes` | Package `id`(s) this replaces |

`supersedes` is how you retire content without deleting it. The superseded
package stays independently readable and auditable — important when you need
to show what the policy *was* on a given date.

## Integrity and package identity

```json
{
  "integrity": {
    "content/01-refund-window.md": "sha256:a1b2c3…"
  },
  "canonicalDigest": {
    "algorithm": "sha256",
    "value": "d4e5f6…"
  }
}
```

`integrity` is per-file. `canonicalDigest` is a reproducible identity for the
whole package, computed from on-disk bytes plus the manifest (with
`canonicalDigest` and `signature` removed). Consumers recompute rather than
trusting the declared value.

**These are derived data and go stale on any edit.** `canonicalDigest` covers
the *manifest*, so changing `license` or `description` invalidates it — and
invalidates any signature over it. In this repository,
`npm run refresh:derived` re-derives everything in dependency order; if you
maintain your own corpus you will want the equivalent. See
[trust model §2.1](../../spec/moca-trust-model.md#21-any-manifest-edit-is-a-re-signing-event).

## Composing packages

Two independent mechanisms
([core §10](../../spec/moca-core-spec.md#10-package-composition--relationships)):

**`members`** — containment. This package is assembled from those packages:

```json
{
  "composition": {
    "members": [
      { "id": "urn:moca:module:probability-basics", "version": "^1.0.0", "order": 1 },
      { "id": "urn:moca:module:bayes-theorem",      "version": "^1.0.0", "order": 2 }
    ]
  }
}
```

Direction is parent → child only. A member never names its parents, so the
same module can belong to several courses. A composition-only package needs no
`content/` at all.

**`relates`** — loose association with no containment or ordering:

```json
{
  "composition": {
    "relates": [
      { "id": "urn:moca:policy:api-usage-v1", "relationship": "supersedes" }
    ]
  }
}
```

Examples: [composition-members](../../examples/composition-members),
[composition-relates](../../examples/composition-relates).

## Declaring a profile

Profiles add domain vocabulary without changing core semantics:

```json
{
  "profile": ["https://openmoca.org/profiles/education/v1"],
  "profileData": {
    "education": { "difficulty": "introductory" }
  }
}
```

Profile-specific data MUST live under `profileData`, keyed by profile name,
never as top-level manifest properties. A consumer that doesn't recognise the
profile still processes the package as valid MOCA Core.

Note that this repository's `moca-lint` validates Core only — it deliberately
does not validate `profileData` against a profile's schema. That is the
profile owner's tooling to provide.

## Augmenting content you can't modify

When you need to ground an AI system against material you don't own — a
vendor's PDF bundle, a legacy courseware archive — `augmentation` lets a
package describe an external target rather than containing it
([core §9](../../spec/moca-core-spec.md#9-sidecar-augmentation-pattern-augmentation)).

Examples: [augmentation-generic](../../examples/augmentation-generic),
[augmentation-scorm2004](../../examples/augmentation-scorm2004).

## Converting from what you already have

```sh
# A folder of Markdown, structure preserved
npx @openmoca/moca-convert ./docs -o my-package --id urn:moca:example:my-docs --title "My Docs"

# An Obsidian vault, [[wikilinks]] rewritten to relative links
npx @openmoca/moca-convert ./my-vault -o my-package --id urn:moca:example:my-vault

# An OpenAPI 3.x document, one content node per operation
npx @openmoca/moca-convert ./openapi.yaml -o my-package --id urn:moca:example:my-api
```

Converters never fabricate ontologies, claims, profiles, or signatures —
output is bare/identified Level 1, and semantic grounding stays a deliberate
manual step. Each run lints its own output before reporting success, so a
successful conversion is already a validated package.

Full reference: [tools/moca-convert](../../tools/moca-convert/README.md).

## Validating as you go

```sh
npx @openmoca/moca-lint lint my-package            # human-readable
npx @openmoca/moca-lint lint my-package --format json
npx @openmoca/moca-lint lint my-package --strict   # warnings become errors
```

Once it validates, `pack` produces an archive and refuses to write if any
error-severity finding is present:

```sh
npx @openmoca/moca-lint pack my-package -o my-package.moca
```

## Next

- [Signing and trust](signing-and-trust.md) — required if you ship `skills/`.
- [Search and indexes](search-and-indexes.md) — optional retrieval sidecars.
- [Consuming a package](consuming.md) — what a reader does with all of this.
