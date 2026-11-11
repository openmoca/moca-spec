# 0004 — Named capabilities instead of conformance levels

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

An earlier draft had three levels: Core; Semantic (RDF, SHACL, ontologies);
and Extended (Web Annotation locators plus signatures plus skills). The rungs
bundled unrelated features: a package with a page locator and a signature but
no ontology fitted none cleanly, and one clause spoke of a "declared" level
while another forbade declaring one.

## Options

1. Keep conformance levels and fix their boundaries.
2. Derive named, independent capabilities from what a package contains.

## Decision

Option 2. A Reader derives a set of named capabilities from what a package
contains and what verifies: `core`, `composed`, `located-evidence`,
`self-contained-evidence`, `localized`, `structured`, `signed` and `reviewed`
([package spec §11](../../spec/moca-package-spec.md#11-capabilities)).
Nothing is declared. `signed` and `reviewed` depend on the host's trust root.

## Consequences

- Each feature is independent and can be adopted alone.
- "Which level do I need?" becomes "which capabilities does my use need?",
  which is the question adopters actually have.
- Capability names are part of the conformance corpus, so they cannot drift
  between implementations. (Amended in 0.6.0: an earlier version of this
  record also said they were part of the citation record; they never were.
  Capabilities are reported on the package result, not on each record.)

## What would change this decision

Evidence that adopters need a single badge ("MOCA Level N") to buy or procure
against. A named bundle of capabilities could then be defined on top.
