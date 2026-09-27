# 0004 — Named capabilities instead of conformance levels

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

The earlier draft had three levels: Core; Semantic (RDF, SHACL, ontologies);
and Extended (Web Annotation locators plus signatures plus skills). The rungs
bundled unrelated features: a package with a page locator and a signature but
no ontology fitted none cleanly, and one clause spoke of a "declared" level
while another forbade declaring one.

## Decision

A Reader derives a set of named capabilities from what a package contains and
what verifies: `core`, `composed`, `located-evidence`, `localized`, `signed`,
`reviewed`, `skills`
([package spec §11](../../spec/moca-package-spec.md#11-capabilities)). Nothing
is declared. `signed`, `reviewed` and `skills` depend on the host's trust root.

## Consequences

- Each feature is independent and can be adopted alone.
- "Which level do I need?" becomes "which capabilities does my use need?",
  which is the question adopters actually have.
- Capability names are part of the conformance corpus and the citation record,
  so they cannot drift between implementations.

## What would change this decision

Evidence that adopters need a single badge ("MOCA Level N") to buy or procure
against. A named bundle of capabilities could then be defined on top.
