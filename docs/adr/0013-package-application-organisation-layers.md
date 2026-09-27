# 0013 — Package, application and organisation layers

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Applications need to add their own meaning on top of a package. Examples:

- a domain vocabulary, such as applicability rules, jurisdictions or learning
  objectives;
- application rules, such as which events to record;
- organisation policy, such as a check that must precede a step.

Putting any of this in the package would turn the package into configuration
for whoever reads it ([ADR-0006](0006-reader-rules-not-forbidden-keys.md)).
Leaving it out entirely would force every application to invent its own way
to join its rules to the package's structure.

## Options

1. Put application and organisation data in the package.
2. Let the host supply **overlays**, which are layers loaded over the package.

## Decision

Option 2.

**Three layers, loaded in order:**

| Layer | Supplied by | Covered by the digest and signatures |
| --- | --- | --- |
| Package | The publisher | Yes |
| Application | The application | No |
| Organisation | The organisation running it | No |

**Overlays add, and never change.** An overlay may add triples to the
structure graph. It cannot remove or rewrite anything the package says.
Because RDF graphs merge by union, the rule holds by construction.

**Every result names its layer.** Each structure fact a Reader returns says
which layer it came from, so an application can always tell what the
publisher said from what it or its organisation added.

**Overlays are configuration the host chooses.** They are never loaded because
a package names them.

**Scope in 0.4.** 0.4 implements structure overlays. Manifest overlays (an
application's or an organisation's additions to `moca.json`) are specified
here, but wait for the admission test
([ADR-0011](0011-three-pillars-and-admission-test.md)).

## Consequences

- Applications can carry domain vocabularies and rules, such as event
  tracking rules, as overlays, without any of it entering the standard.
- Structure operations run over the merged graph, and results carry a
  `layer`.
- A package stays inert data: nothing it contains configures its reader.

## What would change this decision

An application that needs an overlay to hide or override package content. Hiding
or overriding content is policy, and it belongs in the application's own logic.
