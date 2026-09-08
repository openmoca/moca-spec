# MOCA documentation

Non-normative guides. The normative specifications live in
[`spec/`](../spec).

## Start here

| | |
|---|---|
| [Why MOCA?](why-moca.md) | The problem it solves, what it is not, and why not to just use a folder of Markdown or a vector database |
| [Use cases](use-cases.md) | What people build with it, and how it relates to RO-Crate, DITA, SCORM, MCP and others |
| [Quickstart](quickstart.md) | A valid package in five minutes |
| [End-to-end walkthrough](walkthrough.md) | Source files → convert → sign → index → pack → grounded answer |

## Guides

| | |
|---|---|
| [Choosing a conformance level](guides/choosing-a-level.md) | Level 1, 2 or 3 — and why the answer is usually 1 |
| [Authoring](guides/authoring.md) | Grounding metadata, lifecycle, integrity, composition, profiles |
| [Consuming a package](guides/consuming.md) | Building a harness: load, validate, resolve, degrade gracefully |
| [Signing and trust](guides/signing-and-trust.md) | Signing in practice, verification, and the `skills/` boundary |
| [Search and indexes](guides/search-and-indexes.md) | Optional `.moca.idx` sidecars and how they bind |

## Reference

Rather than restating them here — where they would drift — these point at the
authoritative source for each.

| Looking for | Authoritative source |
|---|---|
| Manifest field reference | [core spec §5.1](../spec/moca-core-spec.md#51-manifest-properties) |
| Package directory layout | [core spec §4](../spec/moca-core-spec.md#4-logical-package-structure) |
| Conformance level requirements | [core spec §3](../spec/moca-core-spec.md#3-conformance-levels) |
| Content node frontmatter | [core spec §7.1](../spec/moca-core-spec.md#71-commonmark-knowledge-nodes-content) |
| Epistemic status vocabulary | [core spec §7.2](../spec/moca-core-spec.md#72-core-epistemic-status-vocabulary) |
| Composition semantics | [core spec §10](../spec/moca-core-spec.md#10-package-composition--relationships) |
| Profile mechanism | [core spec §11](../spec/moca-core-spec.md#11-profiles) |
| Sidecar index manifest | [sidecar index spec](../spec/moca-sidecar-index-spec.md) |
| Signature format, trust roots, revocation | [trust model](../spec/moca-trust-model.md) |
| JSON Schemas | [`schemas/v1/`](../schemas/v1) |
| `moca-lint` finding codes | [tools/moca-lint](../tools/moca-lint/README.md#validation-passes--finding-codes) |
| CLI options and exit codes | [moca-lint](../tools/moca-lint/README.md) · [moca-convert](../tools/moca-convert/README.md) · [moca-index](../tools/moca-index/README.md) · [moca-sign](../tools/moca-sign/README.md) |

## Project

| | |
|---|---|
| [Versioning and release](versioning-and-release.md) | Semver policy, release checklist, what beta means |
| [Migrations](../MIGRATIONS.md) | Behaviour changes that affect existing packages |
| [Roadmap](../ROADMAP.md) | What is delivered and what is next |
| [Contributing](../CONTRIBUTING.md) | Proposing spec changes and new profiles |
| [Governance](../GOVERNANCE.md) | How decisions get made, and the repository model |
