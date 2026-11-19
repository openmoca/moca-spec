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
| [0025](0025-catalogue-fields-travel-in-the-manifest.md) | Images, translated titles and tags travel in the manifest |
| [0026](0026-apps-is-a-hint.md) | `apps` is a hint, never configuration |
| [0027](0027-reading-order-names-a-collection.md) | The reading order names a collection, and `upTo` is the caller's |
| [0028](0028-issued-copies.md) | Issued copies are bound to the publisher's package, with its consent |
| [0029](0029-media-is-described-never-fetched.md) | Describe hosted media, never fetch it, and bound time ranges by it |
| [0030](0030-series-bind-members-by-composition.md) | A composing package's structure can bind its members, and `upTo` reaches them |
| [0031](0031-date-published.md) | `datePublished` follows the W3C Publication Manifest, and is informative |
| [0032](0032-is-part-of-and-unknown-relation-types.md) | `isPartOf` is a core relation, and unknown relation types are reported |
| [0033](0033-issued-copies-match-pins-and-sidecars.md) | Issued copies match member pins and the publisher's sidecar |
| [0034](0034-alternate-media-sync-by-stretches.md) | Alternate media line up stretch by stretch |
| [0035](0035-time-ranges-refined-by-a-quote.md) | A time range can be refined by the words spoken in it |
| [0036](0036-creators-terms-travel-with-the-work.md) | The creator's terms travel with the work, and only the rights holder can loosen them |
| [0037](0037-a-named-host-claim-for-creators-terms.md) | A named claim for hosts that honour creators' terms, narrowing ADR-0022 |
| [0038](0038-credits-in-fixed-shapes.md) | Credits are labels in fixed shapes (Proposed) |
| [0039](0039-a-conformance-programme-and-an-implementations-registry.md) | A conformance programme and an implementations registry: signed, reproducible records with their own attestation type; capabilities defined centrally; statuses, challenges and history; part of 1.0 (Proposed) |

New records use the template in [0000-template.md](0000-template.md).
