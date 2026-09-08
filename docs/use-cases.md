# Use cases

MOCA Core is domain-agnostic — nothing in the format knows whether it is
carrying support articles, case law, API documentation, or a statistics
course. This page describes concrete shapes the format takes in practice, and
how it relates to standards you may already be using.

## Support knowledge base

**The problem.** Support answers drift. An article written against v2 of a
product is still in the index when v4 ships, and the assistant quoting it has
no way to know. Nobody can tell which answers a human has actually verified.

**What MOCA adds.** `lastReviewed` and `validFrom` let a harness down-rank or
refuse stale content. `epistemicStatus` separates `verified` answers from
`generated` summaries. `supersedes` lets a rewritten article explicitly retire
its predecessor rather than silently coexisting with it.

**Worked example:** [examples/use-cases/support-kb](../examples/use-cases/support-kb)

## Policy and compliance corpus

**The problem.** "What is our current data-retention policy?" has a correct
answer and several dangerously plausible wrong ones — previous versions, drafts,
and regional variants. An assistant that cannot distinguish them is worse than
no assistant.

**What MOCA adds.** Each policy version is its own package with its own
identity and `validFrom`. `composition.relates` records that one supersedes
another without merging them, so the superseded version stays independently
readable and auditable. Evidence locators tie an assertion to a clause in the
source document.

**Worked example:** [examples/use-cases/policy-corpus](../examples/use-cases/policy-corpus)

## Internal engineering documentation

**The problem.** An engineering wiki accumulates architecture decisions,
runbooks, and API references at different levels of trustworthiness, and a
retrieval system flattens them into one undifferentiated pile.

**What MOCA adds.** Concept grounding links a runbook to the service it
describes. `composition.members` composes a per-service package into a
platform-wide one without duplication. [`moca-convert`](../tools/moca-convert/README.md)
can bootstrap the packages from an existing Markdown tree, an Obsidian vault,
or an OpenAPI document.

## Regulated / auditable AI systems

**The problem.** You need to show an auditor not just what the system said,
but what it was reading, where that came from, and who signed off.

**What MOCA adds.** `canonicalDigest` gives a reproducible identity for
exactly the bytes in play. PROV-O-mapped claim provenance records derivation.
Profiles carry regulatory vocabulary — see the shipped
[EU AI Act profile](../profiles/eu-ai-act/moca-eu-ai-act-profile.md) — without
that vocabulary leaking into core.

## Courseware and training

**The problem.** Course content is inherently composite (course → module →
lesson) and existing standards for it are tied to delivery runtimes.

**What MOCA adds.** `composition.members` expresses the hierarchy while each
module stays an independently usable package. The
[education profile](../profiles/education/moca-education-profile.md) adds
pedagogical vocabulary on top.

## How MOCA relates to adjacent standards

MOCA deliberately reuses existing standards rather than reinventing them, so
the honest comparison is mostly "what layer does this sit at".

| Standard | What it does | Relationship to MOCA |
|---|---|---|
| **Plain Markdown + frontmatter** | Human-authored content with ad hoc metadata | MOCA Level 1 *is* this, plus a manifest that standardises identity, versioning, and integrity. A converter exists both ways in practice. |
| **RO-Crate** | Packaging research data with JSON-LD metadata | Closest neighbour, and MOCA is compatible with it — a package MAY carry `ro-crate-metadata.json`, and core §5.4 defines which checksum manifest wins on conflict. RO-Crate describes datasets generally; MOCA is specifically shaped for AI consumption (epistemic status, evidence locators, skills trust boundary). |
| **Dublin Core / schema.org** | Descriptive metadata vocabularies | Used *within* MOCA via JSON-LD at Level 2, not competed with. |
| **PROV-O** | W3C provenance ontology | Adopted directly: `claims[].provenance` maps onto concrete PROV-O predicates ([core §7.4](../spec/moca-core-spec.md#74-explicit-claims-graph-claims)). |
| **W3C Web Annotation** | Pointing precisely into a resource | Adopted at Level 3 for evidence locators (a page, a time range, a text selector). |
| **SHACL** | Validating RDF shapes | Optional Level 2 validation; MOCA does not define its own shape language. |
| **DITA** | Structured technical authoring and publishing | Authoring/publishing pipeline for humans; MOCA is a consumption format for machines. A DITA shop would convert, not replace. |
| **SCORM / cmi5** | Packaging e-learning for an LMS runtime | Both package learning content, but SCORM binds to a delivery runtime and its tracking model. MOCA is runtime-neutral. Import tooling is on the roadmap. |
| **MCP resources** | Exposing resources to a model at runtime | Complementary and at a different layer: MCP is a *transport* for handing content to a model; MOCA is the *artifact* being handed over. An MCP server serving MOCA packages is a planned integration. |
| **OpenAPI** | Describing an HTTP API | A source format MOCA converts *from* ([`moca-convert openapi`](../tools/moca-convert/README.md)), producing one content node per operation. |
| **Vector databases** | Storing and searching embeddings | Downstream and derived. MOCA's [sidecar index](guides/search-and-indexes.md) binds an index to a package by digest without prescribing a database. |

## Where MOCA is a poor fit

- **Rapidly changing operational data** — ticket queues, metrics, inventory.
  MOCA packages are versioned artifacts, not live records. Query the system of
  record instead.
- **Content with no provenance story and no reuse** — if a single team owns
  the content, consumes it in one pipeline, and nobody will ever ask where it
  came from, a folder of Markdown is genuinely fine.
- **Anything requiring runtime configuration to travel with the content.**
  That is explicitly out of scope, permanently
  ([core §5.3](../spec/moca-core-spec.md#53-excluded-properties)).
