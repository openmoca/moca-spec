# Architecture decision records

Each record states one decision, the options considered, and what would make
us revisit it. Records are numbered in order and never renumbered. A decision
that changes is superseded by a new record, not edited.

This series starts with 0.4.0-alpha.2 and holds the decisions in force at
that version. Earlier records, and the decisions they replaced, are not
carried over.

| ADR | Decision |
| --- | --- |
| [0001](0001-three-pillars-and-admission-test.md) | Three pillars (Package, Reader, Application), a test for what enters the standard, and one search entry point |
| [0002](0002-package-layer-over-okf.md) | MOCA is a package layer over the Open Knowledge Format |
| [0003](0003-digest-v2-and-detached-attestations.md) | `moca-digest-v2` over a BagIt-style manifest, with detached attestations |
| [0004](0004-capabilities-not-levels.md) | Named capabilities instead of conformance levels |
| [0005](0005-reader-rules-not-forbidden-keys.md) | Safety comes from Reader rules, not forbidden manifest keys |
| [0006](0006-reader-interface-and-per-language-readers.md) | A language-neutral Reader interface here, one Reader repository per language |
| [0007](0007-structure-core.md) | A structure core in the package, and structure operations in the Reader |
| [0008](0008-package-application-organisation-layers.md) | Package, application and organisation layers |
| [0009](0009-self-contained-evidence.md) | Carrying the original sources is a capability a Reader can check |
| [0010](0010-pluggable-ontology-guided-retrieval.md) | Structure facts are normative; ontology-guided retrieval is pluggable |
| [0011](0011-park-unconsumed-features.md) | Park features that have no consumer: skills, claims, EU AI Act, OCI |
| [0012](0012-trade-mark-policy.md) | Protect the OpenMOCA name with a published trade mark policy |
| [0013](0013-citations-over-ag-ui.md) | Carry citations over AG-UI in one custom event |
| [0014](0014-dsse-keys-are-ed25519.md) | Sign DSSE attestations with Ed25519 keys only |
| [0015](0015-relations-need-a-scoped-signer.md) | Relations that retire or contest need a scoped signer |
| [0016](0016-audience-fails-closed.md) | Audience filtering fails closed |
| [0017](0017-reviewed-means-signed-and-approved.md) | `reviewed` means signed and approved |
| [0018](0018-ranking-is-informative.md) | Search ranking is informative |
| [0019](0019-park-structure-json.md) | Park `structure.json` |
| [0020](0020-structure-never-hides-content.md) | Structure never hides content |
| [0021](0021-digests-do-not-name-their-algorithm.md) | Digests do not name their algorithm |
| [0022](0022-applications-get-advice.md) | Rules for applications are advice |
| [0023](0023-encrypted-packages-in-an-age-envelope.md) | Encrypt packages in an age envelope |
| [0024](0024-distribution-is-signed-intent.md) | `distribution` is the publisher's signed intent, not access control |

New records use the template in [0000-template.md](0000-template.md).
