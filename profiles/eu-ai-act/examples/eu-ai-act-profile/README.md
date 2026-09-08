# EU AI Act Profile Example

Demonstrates the MOCA EU AI Act compliance profile
([moca-eu-ai-act-profile.md](../../moca-eu-ai-act-profile.md)):

- `profileData.euAiAct` with risk classification, regulation version, intended purpose, and Annex III category.
- Data governance metadata (provenance URI and data cutoff date).
- Human oversight configuration with reference to an override procedure node.
- A `governance` ontology with SHACL shapes expressing illustrative compliance checks
  ([ontologies/governance.shacl.ttl](ontologies/governance.shacl.ttl)).
- A content node ([content/01-oversight-node.md](content/01-oversight-node.md)) documenting the human override and escalation procedure, referenced by `profileData.euAiAct.humanOversight.overrideNode`.

## ⚠️ About This Example

**The profile data in this package is self-declared, not verified, and intended for illustration only.**

This example demonstrates the *structure* and *shape* of an EU AI Act-compliant MOCA package. It does NOT constitute:

- Legal compliance with the EU AI Act
- Certification by any external regulatory body
- A template for real-world systems without independent legal review
- A substitute for expert compliance assessment

The SHACL governance shapes in `ontologies/governance.shacl.ttl` are **illustrative placeholders** showing what kind of machine-checkable rules *could* be expressed in a real compliance package. They are not actual regulatory rules and should not be treated as defining legal compliance requirements.

Real governance shapes would require:

- Formal interpretation of the EU AI Act and related guidance by compliance experts
- Mapping to specific regulatory articles and annexes
- Validation against real systems and their actual behavior
- Independent audit by external experts with domain knowledge in AI governance

This package is a teaching example, not a template for production use.

## ⚠️ About the `signature` field

`moca.json` carries a real, verifiable `dsse`-mode signature (see
[spec/moca-trust-model.md](../../../../spec/moca-trust-model.md)) — **but it is signed
with this repository's own non-production example key**
([fixtures/signing-keys/README.md](../../../../fixtures/signing-keys/README.md)), not a
signer any real host should trust. Verifying successfully against this
repo's example trust root does not make this package trustworthy for any
purpose beyond demonstrating the mechanism; no real host should add
`moca-spec-example-signing-key-2026` to its own trust root.

## What This Demonstrates

- How regulatory/compliance standards map to MOCA's ordinary profile system (see [core §11.5](../../../../spec/moca-core-spec.md#115-compliance--standards-profiles))
- The no-special-mechanism principle: a compliance profile uses the same `profileData` namespace, `governance` ontology role, and content reference patterns as any other profile
- The open-string approach to classification fields: `riskTier`, `annexIiiCategory`, and `humanOversight.level` are open vocabulary, not enums, to allow for regulatory evolution
- How to reference structured compliance procedures (human oversight, escalation) via content node URNs
- Optional SHACL shapes expressing formal governance constraints
