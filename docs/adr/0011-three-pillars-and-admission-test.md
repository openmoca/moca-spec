# 0011 — Three pillars, and a test for what enters the standard

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))
- **Supersedes:** [0008](0008-search-backend-interface.md)

## Context

Each MOCA release since 0.1 has moved the same features in and out of the
standard: structure (ontology), search, and per-language Readers.

- 0.1 had them in core.
- 0.2 removed them as unproven.
- 0.3 restored them as a profile and a separate conformance class.
- The 0.3 review proposed parking them again.

Each review judged features against a different imagined consumer and a
different idea of what MOCA is for. None of them held a fixed line between
the open standard and the products built on it, so every review redrew that
line.

## Options

1. Keep deciding feature by feature.
2. Fix the layers once, name them, and give every feature one test for which
   layer it belongs to.

## Decision

Option 2.

**The pillars.** Earlier documents called the Reader a "Knowledge Harness" and
the Application an "AI Harness". Those names are retired, because an *agent
harness* now commonly means the loop and tooling around a model.

| Pillar | Licence | What it is |
| --- | --- | --- |
| **MOCA Package** | Open standard | Portable grounding, neutral to any use case. Content, optional structure, evidence, and the identity and trust that cover them. |
| **MOCA Reader** | Open source, one per language | The standard way to get anything out of a package: open, verify, search, navigate structure, cite. It appears in each agent framework as that framework's retriever, loader or context provider. |
| **MOCA Application** | The adopter's product | Built for one use case on an agent harness of its choice. It owns runtime state, domain rules and the user experience. |

**The admission test.** A feature enters the Package or the Reader only when
two use cases need it, and at least one of them is real and named. A feature
only one application needs belongs in that application.

**Decisions recorded here** (D1-D9 of the 0.3 re-evaluation, as amended):

| # | Decision |
| --- | --- |
| D1 | The three pillars above. |
| D2 | The admission test above. |
| D3 | Search is a core Reader operation: one entry point, the same signature in every language, with the default retrieval policy applied inside it. It is no longer a separate conformance class. The backend contract stays small: lexical search is required, and dense and store backends are optional. |
| D4 | One Reader per agent ecosystem. Every Reader passes the same conformance corpus. |
| D5 | A small structure core is part of the package specification, and optional in each package ([ADR-0012](0012-structure-core.md)). Full ontologies stay an optional profile. |
| D6 | Originals are carried in the package, or pinned by URL. Media time ranges use W3C Media Fragments, and captions use WebVTT. A streamed original that the host can re-encode cannot be verified by digest, and the specification says so. |
| D7 | Integrity follows a BagIt-style manifest ([ADR-0014](0014-digest-v2-bagit-manifest.md)). Package signing moves to OpenSSF Model Signing after a spike, in a later release. |
| D8 | OKF is the content model. The package layer and the structure core are offered to its maintainers as a companion. |
| D9 | Defects are fixed whatever else changes: versioned node references, `evidence[].matched`, resource limits, and store search without loading every package. |

**Reopening.** A decision here reopens only on the evidence named for it, or
when a pilot shows that it blocks a real use case. A review opinion alone does
not reopen it. A review verdict must name the pillar a feature belongs to and
apply the admission test.

## Consequences

- The Package and Reader change only through the specification and the
  conformance corpus. Applications can change freely without breaking any
  package.
- [ADR-0008](0008-search-backend-interface.md) is superseded. Its core stands
  (one entry point, with policy applied in one place, after every backend).
  What changes is that search now belongs to the Reader class, and the
  `hybrid` feature and the Search conformance class are withdrawn.
- Every future feature proposal has to name its second use case.

## What would change this decision

A second implementer or adopter who needs the lines drawn differently, with a
real use case to show for it.
