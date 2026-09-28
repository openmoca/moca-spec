# 0016 — Structure facts are normative; ontology-guided retrieval is pluggable

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Ontology-guided retrieval uses a package's structure to shape a search. It
has two steps:

- **ingress** maps a query onto concepts, and widens or narrows the search
  scope;
- **egress** walks the results through the structure graph, to pull in
  required material, re-rank, or group.

Different domains want different strategies. A legal application follows
cross-references and amendments. A procedures application follows the order
of steps and the checks that must come first. A course application follows
prerequisites.

If each domain built its own Reader, packages would stop meaning the same
thing everywhere. If the strategy were fixed in the specification, no
application could do better than the default.

## Options

1. Fix one retrieval strategy in the specification.
2. Let each domain build its own Reader.
3. Make the structure **facts** normative, and the retrieval **strategy**
   pluggable through hooks on the standard Reader.

## Decision

Option 3.

**Facts are normative.** Every Reader parses the structure core
([ADR-0012](0012-structure-core.md)) identically and answers the structure
operations identically. The corpus tests these exactly.

**Strategy is pluggable.** The Reader's search runs this pipeline:

1. **`ingress(query, ctx)`** may return a rewritten query, concepts and a
   scope.
2. The backend search runs.
3. **`egress(candidates, ctx)`** may reorder candidates, or add nodes found
   through structure operations. Each added node is tagged
   `retrieval: { via, from }`.
4. **The gate runs, always last.** In order: the digest allowlist, the
   default retrieval policy, the audience set, then locale, scope and
   concepts, then the limit.

`ctx` gives read-only access to the structure operations, the overlays and
the host's options.

**Hooks are host code.** They are never loaded from a package, and they
cannot get past the gate.

**The default is opt-in.** The Reader ships a default ontology-guided
strategy. Without hooks, search is plain.

**Domain Readers are extensions, not separate Readers.** A legal Reader, a
procedures Reader or a course Reader is a Reader extension: its hooks plus a
vocabulary overlay ([ADR-0013](0013-package-application-organisation-layers.md)).
Extensions live outside this repository and bring their own tests. There is
still one Reader per language and one corpus.

## Consequences

- Applications and domain extensions can compete on retrieval quality
  without forking the Reader or changing what a package means.
- The corpus tests that no hook can return what the gate excludes. It never
  compares ranking.
- Citation records gain an optional `retrieval` field.

## What would change this decision

Evidence that a common strategy works well enough everywhere. It could then
become part of the specification.
