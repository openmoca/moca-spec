# MOCA — Modular Ontology & Content Assembly
## Core Package Specification

License: MIT Specification Version
Status: Draft — pre-adoption, no version pinning yet

---

## 1. Scope, Philosophy & Architecture Model

MOCA defines a portable, storage-independent, and runtime-neutral format for
packaging semantic knowledge, grounded content, evidence, and ontologies for
AI consumption.

MOCA Core is domain-agnostic. It makes no assumptions about what the content
is *for* — a customer-support knowledge base, a legal research corpus, an
internal engineering wiki, and an educational course are all equally valid
uses of a MOCA package. Domain-specific vocabulary and behavior belong in
**profiles** layered on top of core (see §10), not in core itself.

### 1.1 The 3-Layer System Architecture

MOCA enforces a strict separation of concerns across three distinct layers:

```
┌──────────────────────────────────────────────────────────┐
│               1. Application / Host Layer                │
│ PII Redaction · Security Policy · Identity · Enterprise  │
└────────────────────────────┬───────────────────────────-─┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────┐
│                   2. AI Harness Layer                    │
│ Retrieval (GraphRAG/Vector) · Agent Routing · Tools      │
│ Reasoning · Context Assembly · Memory & Session State    │
└────────────────────────────┬────────────────────────────-┘
                              │
                      consumes / interprets
                              │
                              ▼
┌──────────────────────────────────────────────────────────┐
│               3. MOCA Knowledge Package                  │
│ Concepts · Ontologies · Grounded Nodes · Claims          │
│ Evidence & Locators · Provenance · Inert Content         │
└────────────────────────────────────────────────────────-─┘
```

- **Application / Host Layer**: Controls enterprise security policies, tenant
  isolation, PII redaction, identity management, billing, and regulatory
  compliance.
- **AI Harness Layer**: Controls retrieval strategy (vector search, SPARQL,
  GraphRAG), prompt assembly, agent routing, tool execution (e.g. MCP), and
  session memory.
- **MOCA Knowledge Package Layer**: A portable, storage-agnostic, and inert
  semantic knowledge package. MOCA packages MUST NOT encode runtime execution
  parameters, model configurations, or security credentials.

---

## 2. Standards Alignment Baseline

MOCA reuses and profiles established open standards rather than inventing
proprietary wrappers.

| MOCA Domain | Primary Standard | Role in MOCA |
|---|---|---|
| Package Envelope & Metadata | RO-Crate 1.3 (optional envelope) | Optional `ro-crate-metadata.json` for RO-Crate-aware tooling. MOCA's own root manifest (`moca.json`) is authoritative regardless of RO-Crate presence — see §2.1. |
| Linked Data Serialization | JSON-LD 1.1 | Provides RDF graph mapping while remaining fully compatible with ordinary JSON parsers. |
| Semantic Graph & Taxonomies | RDF 1.2 / SKOS / OWL | Expresses concept schemes, taxonomies (SKOS), and formal domain ontologies (OWL). |
| Graph Validation | SHACL | Validates structural integrity and relationship constraints of knowledge graphs. |
| Evidence & Segment Targeting | W3C Web Annotation | Locates fine-grained segments across multi-modal assets (PDF pages, video timestamps, text ranges). |
| Provenance & Auditability | W3C PROV-O | Tracks origin, extraction activities, human review, and machine generation histories. |
| Executable Capabilities | Agent Skills Spec | Packages reusable agent instructions (SKILL.md) behind a strict security sandboxing boundary. |
| Physical Transport | Zip / BagIt | Zip archive distribution (`.moca`) or BagIt checksum preservation payload. |

### 2.1 Honest RO-Crate Alignment

MOCA is **informed by** RO-Crate conventions, not conformant to the RO-Crate
specification. `ro-crate-metadata.json` is optional (§4). A package without
it is a valid MOCA package but is not a valid RO-Crate. Tooling and
documentation MUST NOT claim RO-Crate conformance unless
`ro-crate-metadata.json` is present and itself valid per RO-Crate 1.3.

---

## 3. Conformance Levels

| Level | Name | Requirements |
|---|---|---|
| **1** | MOCA Core | Valid `moca.json` root manifest. Grounded CommonMark knowledge nodes (`content/`) bound to concepts via YAML frontmatter and resolvable `namespaces`. Any `claims` or `evidence` present are treated as structured data only — no RDF interpretation required. Parseable with standard JSON + Markdown tooling only. |
| **2** | MOCA Semantic | Adds JSON-LD `@context` in `moca.json`. Formal ontologies (`ontologies/`) using RDF, SKOS, or OWL. SHACL shape validation. `claims` are interpretable as RDF triples. `evidence` links resolve against PROV-O provenance records. |
| **3** | MOCA Extended | Adds W3C Web Annotation selectors for precise multi-modal locators. Cryptographic digests and digital signatures (Sigstore / DSSE / in-toto) — **mandatory, not optional, for any package containing `skills/`** (see §8.2). Optional Agent Skills. |

### 3.1 Level Requirement Clarification

A package MAY contain `skills/` at any conformance level, but any package
containing `skills/` MUST meet Level 3 signature requirements regardless of
what level it otherwise declares. Executable-adjacent content is the
highest-risk artifact type in a MOCA package and is never permitted to ship
unsigned.

---

## 4. Logical Package Structure

```
package-name/
│
├── moca.json                # Canonical root manifest file (Required)
│
├── ontologies/               # [Optional] Ontology files (.jsonld, .ttl, .shacl.ttl)
│   ├── domain.jsonld
│   └── validation.shacl.ttl
│
├── content/                  # [Required for Grounded Text] CommonMark knowledge nodes (.md)
│   ├── 01-introduction.md
│   └── 02-advanced-patterns.md
│
├── sources/                  # [Optional] Source reference documents (PDFs, PPTs, transcripts)
│   ├── reference.pdf
│   └── transcript.txt
│
├── media/                    # [Optional] Static diagrams, images, audio, or video assets
│   └── diagram.png
│
├── skills/                   # [Optional, Level 3 signature required] Agent skill directories
│   └── example-skill/
│       └── SKILL.md
│
├── profiles/                 # [Optional] Profile-specific data — see §10
│   └── <profile-name>/
│
└── ro-crate-metadata.json    # [Optional] RO-Crate metadata envelope
```

### 4.1 Storage & Transport Independence

How a MOCA package is stored or transported is handled by host ingestion
adapters:

- **Physical Archive (`.moca`)**: A standard Zip archive containing
  `moca.json` at its root.
- **Uncompressed Directory**: A local or workspace folder structure on disk.
- **Virtual / Database Store**: Shredded database records or object-store
  references.

### 4.2 Localization Convention

Content files supporting multiple locales use a filename suffix matching a
BCP-47 code declared in the manifest's `locales` array:

```
content/01-introduction.md        # default / language
content/01-introduction.fr.md     # French
content/01-introduction.pt-BR.md  # Brazilian Portuguese
```

A harness resolving content for a given locale MUST fall back to the
unsuffixed file if no locale-specific variant exists.

---

## 5. Package Manifest (`moca.json`) Specification

The root manifest MUST be named `moca.json`.

### 5.1 Manifest Properties

| Property | Type | Required | Description |
|---|---|---|---|
| `$schema` | String (URI) | No | Canonical JSON Schema URI. |
| `@context` | Object / String | No | JSON-LD 1.1 context definition or URL mapping terms to standard IRIs. |
| `id` | String (URN/URI) | Yes | Canonical unique identifier for the package. |
| `version` | String | Yes | Semantic version string of the *content* (independent of any spec version). |
| `profile` | Array of Strings (URI) | No | Zero or more profile URIs this package declares conformance to. See §10. |
| `title` | String / Object | Yes | Human-readable title or BCP-47 localized string map. |
| `description` | String / Object | No | Summary description or BCP-47 localized string map. |
| `language` | String | No | Primary BCP-47 language code (e.g. `"en-US"`). |
| `locales` | Array of Strings | No | Supported BCP-47 language/locale codes. |
| `license` | String | No | Valid SPDX license identifier. |
| `keywords` | Array of Strings | No | Classification tags for indexing and search. |
| `categories` | Array of Strings | No | High-level classification categories. |
| `author` | String / Object | No | Package author or organization. |
| `publisher` | String / Object | No | Publishing entity. |
| `created` | String (ISO-8601) | No | Package creation UTC timestamp. |
| `modified` | String (ISO-8601) | No | Last modification UTC timestamp. |
| `namespaces` | Object | Required if any CURIE appears anywhere in the package | Dictionary mapping CURIE prefixes to full IRIs. |
| `ontologies` | Object | No | Map of ontology roles to file paths or structured ontology objects. Core roles: `domain`, `governance`, `shapes`, `extension`. Profiles MAY define additional roles (namespaced, see §10.3). |
| `entryConcepts` | Array of Strings | No | Root concept URNs/CURIEs acting as semantic entry points. |
| `augmentation` | Object | No | Declaration of target content being augmented (sidecar usage). See §9. |
| `integrity` | Object | No | Per-resource SHA-256 digest manifest. Authoritative over any RO-Crate or BagIt checksum manifest present in the same package — see §5.4. |
| `signature` | Object | Required if `skills/` present | Cryptographic signature object (Sigstore / DSSE). |
| `profileData` | Object | No | Namespaced container for profile-specific manifest extensions. See §10.3. |
| `x-*` | Any | No | Vendor extension keys. MUST be namespaced as `x-<vendor>-<key>` to avoid collision between vendors. |

### 5.2 Localized String Values

Properties marked "String / Object" (`title`, `description`, `author`,
`publisher`) accept either a plain string or an object mapping BCP-47
locale codes to localized strings:

```json
{
  "title": {
    "en": "Introduction to Microservices",
    "fr": "Introduction aux microservices",
    "pt-BR": "Introdução a microsserviços"
  },
  "description": "A single, non-localized description is also valid."
}
```

When an object is used, a harness resolving a display value for a given
locale MUST fall back to the `language` manifest property, and then to any
single key present, if no exact or partial (e.g. `pt` for `pt-BR`) locale
match exists.

### 5.3 Excluded Properties

The following MUST NOT appear in a MOCA manifest, at any conformance level,
under any profile:

- `endpoints` (telemetry, remote LLM, evaluation endpoints)
- `settings` (model selection, temperature, vector DB config)
- `credentials` / `apiKeys`

These violate the runtime-independence guarantee in §1.

### 5.4 Integrity Precedence

A package MAY contain integrity information in up to three places:
`moca.json`'s `integrity` object, an RO-Crate checksum convention, and a
BagIt `manifest-sha256.txt`. When more than one is present and they disagree,
`moca.json`'s `integrity` object is authoritative. Host adapters SHOULD warn
on mismatch rather than silently picking one.

### 5.5 Spec Evolution

A consumer encountering unknown top-level manifest fields MUST ignore them
rather than reject the package, provided all required fields for the
consumer's supported conformance level are present and valid. This applies
equally to unrecognized `profile` URIs (§10.2).

---

## 6. Linked Data & Micro-Ontologies

### 6.1 JSON-LD Compatibility

MOCA manifests are JSON-LD 1.1 compatible. A semantic consumer can process
the manifest as an RDF graph, while a standard JSON consumer can parse it as
plain JSON:

```json
{
  "$schema": "https://openmoca.org/schemas/core/moca.schema.json",
  "@context": {
    "moca": "https://openmoca.org/vocab/core#",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "ex": "https://example.org/vocab#"
  },
  "id": "urn:moca:example:system-design",
  "version": "1.0.0",
  "title": "System Architecture Knowledge",
  "namespaces": {
    "ex": "https://example.org/vocab#",
    "skos": "http://www.w3.org/2004/02/skos/core#"
  },
  "ontologies": {
    "domain": {
      "iri": "https://example.org/architecture",
      "role": "domain",
      "format": "jsonld",
      "uri": "./ontologies/domain.jsonld"
    },
    "shapes": {
      "role": "shapes",
      "format": "shacl",
      "uri": "./ontologies/validation.shacl.ttl"
    }
  },
  "entryConcepts": ["ex:ServiceBoundary"]
}
```

### 6.2 Core Ontology Roles

- `domain`: Primary domain ontology (concept hierarchy, relationship
  definitions).
- `governance`: Compliance, safety, and domain boundary constraints.
- `shapes`: SHACL shape definitions for graph validation.
- `extension`: Supplemental domain ontology extensions.

Profiles MAY define additional roles. Profile-defined roles MUST be
namespaced (e.g. `education:competencies`) to avoid colliding with future
core roles.

### 6.3 Multi-Package Concept Collisions

When a harness loads more than one MOCA package, concept URIs MAY collide
across packages (two packages independently defining `ex:ServiceBoundary`
with different meanings). MOCA does not resolve this at the spec level —
disambiguation is a harness responsibility, typically via package-scoped
graph namespacing at load time. Packages SHOULD use fully-qualified,
globally-unique IRIs (not bare CURIEs) for any concept intended to be
referenced across package boundaries.

### 6.4 Concept Lifecycle

A concept MAY be marked deprecated or superseded via its ontology definition
(e.g. `owl:deprecated` / `skos:historyNote` / a `skos:related` /
`dcterms:isReplacedBy` pointer to the successor concept). Core does not
mandate a specific vocabulary for this but requires that harnesses
encountering a deprecated concept reference SHOULD surface the successor if
one is declared, rather than silently treating the reference as broken.

---

## 7. Grounded Content Nodes, Claims & Evidence Locators

### 7.1 CommonMark Knowledge Nodes (`content/`)

Knowledge nodes are CommonMark documents with YAML frontmatter linking them
to concepts, declaring epistemic status, and providing evidence references:

```markdown
---
id: urn:node:service-boundaries
title: Service Boundaries and Isolation
concepts:
  - id: ex:ServiceBoundary
    role: primary
  - id: ex:Microservices
    role: supporting
epistemicStatus: sourced
summary: "Defines architectural rules for isolating service boundaries."
evidence:
  - source: "./sources/architecture-spec.pdf"
    locator:
      type: page
      page: 12
---
# Service Boundaries and Isolation

A service boundary defines the explicit ownership and data isolation
perimeter...
```

### 7.2 Core Epistemic Status Vocabulary

A domain-neutral vocabulary usable regardless of what kind of content is
being grounded:

- `sourced`: Traceable to an identified evidence source (§7.3), not
  independently verified by a reviewer.
- `verified`: Confirmed accurate by a designated reviewer or process.
- `inferred`: Derived or synthesized from other nodes/claims, not directly
  sourced.
- `generated`: AI-generated explanation or summary, no independent
  verification.
- `disputed`: Contains conflicting or unverified assertions.
- `deprecated`: Outdated or superseded information.

Profiles MAY extend this vocabulary with additional, more specific values
(e.g. an academic peer-review profile adding `authoritative` or
`peer-reviewed`), but MUST NOT redefine the meaning of a core value.

**Conflict resolution**: MOCA does not arbitrate `epistemicStatus` conflicts
between two nodes claiming the same concept — this is left to the harness.
This is a deliberate trade-off in favor of package portability over
cross-package consistency guarantees; harnesses combining multiple packages
SHOULD implement their own precedence policy (e.g. prefer `verified` over
`sourced`, most-recently-`modified` wins on ties).

### 7.3 Multi-Modal Evidence & Web Annotation Locators

MOCA adopts the W3C Web Annotation selector model for fine-grained source
targeting:

```markdown
---
id: urn:node:video-segment-01
title: Video Segment Reference
concepts:
  - ex:ServiceCommunication
evidence:
  - source: "./media/recording.mp4"
    locator:
      type: FragmentSelector
      conformsTo: "http://www.w3.org/TR/media-frags/"
      value: "t=75,210"
---
```

Supported locator types:

- `page`: PDF or document page number (`page: 12`).
- `FragmentSelector`: Media fragments (`t=75,210`), spatial regions, or HTML
  anchors.
- `TextQuoteSelector`: Exact text quotes with prefix/suffix context.

### 7.4 Explicit Claims Graph (`claims`)

Nodes MAY specify structured claims to bridge natural language text with
machine-readable graph assertions. At Level 1, claims are structured data
only. At Level 2, claims are interpretable as RDF triples.

```yaml
claims:
  - id: urn:claim:001
    subject: ex:OrderService
    predicate: ex:dependsOn
    object: ex:OrderDatabase
    epistemicStatus: sourced
    evidence:
      - source: "./sources/architecture-spec.pdf"
        page: 12
```

---

## 8. Executable Capabilities (`skills/`) & Security Boundary

### 8.1 Agent Skills Integration

MOCA integrates the Agent Skills Specification
(https://agentskills.io/specification). Each skill resides in a sub-folder
under `skills/` containing a required `SKILL.md` file with YAML frontmatter.

```markdown
---
name: example-skill
description: Performs a defined task against package concepts.
metadata:
  concepts: [ex:ServiceBoundary]
allowed-tools: [read_file, grep_search]
---
# Skill Instructions
...
```

`allowed-tools` is always an array, consistent with array typing used
elsewhere in the spec.

### 8.2 Security & Trust Boundary Rule

MOCA Knowledge Assets are strictly inert data.

- Loading a MOCA package MUST NOT automatically execute code or grant host
  system permissions.
- `skills/` are treated as separate, untrusted executable proposals.
- The AI Harness MUST enforce strict sandboxing, filtering `allowed-tools`
  against host security policy before executing any skill instructions or
  scripts.
- Any package containing `skills/` MUST include a valid `signature` object
  in `moca.json`, regardless of the package's declared conformance level
  (see §3.1). A harness MUST refuse to load `skills/` content from an
  unsigned or signature-invalid package, even if it is willing to load the
  rest of the package's content.

---

## 9. Sidecar Augmentation Pattern (`augmentation`)

MOCA packages can act as semantic sidecars, augmenting external content of
any kind — a document repository, a video archive, a wiki export, a
courseware package, a support-ticket corpus — without modifying the original
source material.

```json
{
  "id": "urn:moca:aug:kb-sidecar",
  "version": "1.0.0",
  "title": "Knowledge Base Semantic Augmentation",
  "augmentation": {
    "target": "./raw/external-content.zip",
    "targetType": "generic-archive",
    "relationship": "augments"
  }
}
```

`targetType` is an open string, not a closed enum — it names whatever format
the target content is in (`"scorm-2004"`, `"confluence-export"`,
`"video-playlist"`, `"generic-archive"`, etc.). Core does not maintain a
canonical list; profiles MAY define expected `targetType` values for their
domain (see §10).

`augmentation.target` supports exactly one target per package. A package
sidecar-augmenting multiple external targets should be split into multiple
MOCA packages, or use a single target that is itself a container (e.g. a
directory or archive) referencing multiple underlying resources.

The AI Harness uses the MOCA sidecar to ground conversational AI and
GraphRAG against the external content seamlessly, without that content
needing to natively support MOCA's data model.

---

## 10. Profiles

A **profile** is a named, versioned extension to MOCA Core that adds
domain-specific vocabulary, ontology roles, epistemic-status values, or
manifest fields — without modifying or restricting core semantics.

### 10.1 Profile Declaration

A package declares conformance to zero or more profiles via the manifest's
`profile` array:

```json
{
  "profile": ["https://openmoca.org/profiles/education/v1"]
}
```

### 10.2 Graceful Degradation

A harness that does not recognize a declared profile URI MUST still process
the package as valid MOCA Core, ignoring profile-specific semantics it
doesn't understand (per §5.5). A package MUST remain fully valid and useful
under MOCA Core alone, with the profile strictly additive. Profiles MUST NOT
require behavior that would make a package invalid or unusable to a
core-only consumer.

### 10.3 Where Profile Data Lives

Profile-specific manifest fields MUST be nested under `profileData`, keyed
by profile name, never added as top-level manifest properties:

```json
{
  "profileData": {
    "education": {
      "competencies": { "...": "..." }
    }
  }
}
```

This lets a core-only parser trivially skip the entire block without needing
to know which top-level keys are "safe" to ignore.

Profile-defined ontology roles (§6.2) and epistemic-status values (§7.2)
follow the same namespacing discipline.

### 10.4 Profile Restrictions

A profile MAY:
- Add new ontology roles (namespaced)
- Extend the epistemic-status vocabulary (additively)
- Add manifest fields under `profileData.<profile-name>`
- Define expected `targetType` values for `augmentation`
- Specify additional required *content* (e.g. "every node must declare X")
  as a profile-level authoring convention

A profile MUST NOT:
- Redefine the meaning of any core field or vocabulary term
- Introduce new top-level manifest properties outside `profileData`
- Make any core-required field optional, or any core-optional field
  core-required (a profile can only add its *own* additional requirements,
  scoped to packages declaring that profile)

---

## 11. Vendor Extensions (`x-*`)

Vendor-specific manifest keys use the `x-<vendor>-<key>` pattern (e.g.
`x-acme-tenant-id`) to avoid collision between vendors reusing a bare `x-foo`
key for different purposes. Consumers MUST ignore unrecognized `x-*` keys.
