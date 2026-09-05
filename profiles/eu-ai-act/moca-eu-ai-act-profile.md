# MOCA EU AI Act Profile

Profile URI: `https://openmoca.org/profiles/eu-ai-act/v1`
Extends: MOCA Core Specification
Status: Beta `0.1.0-beta.1` — pre-`1.0.0`, experimental

---

## 1. Purpose

This profile adapts MOCA Core to carry a self-declared, machine-checkable
classification under the EU AI Act (Regulation (EU) 2024/1689) and related
AI governance requirements. It provides a structured way to document:

- Regulatory risk tier (prohibited, high-risk, limited, minimal)
- Annex III high-risk category alignment (if applicable)
- Data governance provenance and recency
- Human oversight mechanisms and escalation procedures
- Pointers to content nodes representing compliance controls

It is purely additive over MOCA Core. A package declaring this profile MUST
still be fully valid and usable to a MOCA-Core-only consumer, per Core §10.2
— an EU-AI-Act-unaware harness can ground against it with degraded (but
functional) fidelity, simply ignoring the compliance layer.

**Disclaimer**: This profile is a structured way to carry a self-declared
classification and pointer to oversight mechanisms. It does NOT constitute
legal compliance advice, certification, or a substitute for legal review. A
package's self-declared risk tier and governance data are the author's
assertion only; a conforming consumer MUST NOT treat this profile's contents
as establishing legal compliance without independent validation. See
[docs/versioning-and-release.md](../../docs/versioning-and-release.md) for an
analogous note on external-standard validation by tooling.

Declare the profile in the manifest:

```json
{
  "profile": ["https://openmoca.org/profiles/eu-ai-act/v1"]
}
```

---

## 2. Additional Ontology Role: `governance`

This profile uses the core `governance` ontology role (Core §6.2) for formal,
machine-checkable governance rules and constraints. If your package ships
SHACL shapes expressing EU AI Act compliance checks (e.g. a rule validating
that all high-risk content nodes have an oversight override reference), define
them under the `governance` role:

```json
{
  "ontologies": {
    "governance": {
      "iri": "https://example.org/eu-ai-act/governance",
      "role": "governance",
      "format": "turtle",
      "uri": "./ontologies/governance.shacl.ttl"
    }
  }
}
```

This is *optional*; not all EU AI Act packages need formal SHACL rules. Use
this role only if your package includes machine-checkable compliance rules.

---

## 3. Regulatory Manifest Data (`profileData.euAiAct`)

All EU AI Act-specific manifest data lives under `profileData.euAiAct`, per
Core §10.3:

```json
{
  "profileData": {
    "euAiAct": {
      "riskTier": "high_risk",
      "regulationVersion": "2024/1689",
      "intendedPurpose": "Employment screening system with human review",
      "annexIiiCategory": "Employment decision-making",
      "dataGovernance": {
        "provenanceUri": "https://example.org/datasets/training-data-v2",
        "dataCutoff": "2024-06-30"
      },
      "humanOversight": {
        "level": "human_in_the_loop",
        "overrideNode": "urn:node:override-procedure",
        "requiredRole": "compliance-officer"
      }
    }
  }
}
```

| Field | Type | Description |
|---|---|---|
| `riskTier` | String | Regulatory risk classification. Examples: `"prohibited"`, `"high_risk"`, `"limited"`, `"minimal"`. Open vocabulary — no enforced enum. Authors and tools MAY use domain-specific variants (e.g. `"high_risk_with_exceptions"`). Consistent with §10.5 guidance, this field is extensible as regulation evolves. |
| `regulationVersion` | String | Version, edition, or regulation ID being applied (e.g. `"2024/1689"`). Allows classifications to remain traceable as the EU AI Act is amended. |
| `intendedPurpose` | String | Natural-language description of the system's intended purpose and use case, per EU AI Act Article 3. |
| `annexIiiCategory` | String (optional) | Annex III high-risk category (e.g. `"Employment decision-making"`, `"Biometric identification"`), if the package falls under high-risk classification. Open string; no enforced enum. |
| `dataGovernance` | Object | Metadata about training, tuning, and evaluation data. |
| `dataGovernance.provenanceUri` | URI | Reference (URL or URN) to documentation or a knowledge node describing data provenance, collection method, and preprocessing. |
| `dataGovernance.dataCutoff` | String (date, ISO-8601) | Most recent date of data collection or update (e.g. `"2024-06-30"`). Helps auditors understand temporal scope. |
| `humanOversight` | Object | Human oversight and escalation procedures. |
| `humanOversight.level` | String | Oversight model. Examples: `"human_in_the_loop"` (human reviews every decision), `"human_on_the_loop"` (human available for monitoring/override), `"human_in_command"` (human retains final authority). Open vocabulary; variations are allowed. |
| `humanOversight.overrideNode` | String (URN) | Reference to a content node (same URN pattern as education's `assessment.linkedNodes`) documenting the human override or escalation procedure. Example: `"urn:node:override-procedure"`. |
| `humanOversight.requiredRole` | String | Role or team responsible for oversight (e.g. `"compliance-officer"`, `"ethics-review-board"`). |

All fields MUST be strings or objects as shown. Classification fields (riskTier,
annexIiiCategory, humanOversight.level) are open strings to allow for
regulatory evolution and domain-specific variants.

---

## 4. Conformance

An EU AI Act profile package:

1. MUST be a valid MOCA Core package at whatever conformance level it
   otherwise declares (Core §3).
2. MUST declare `"https://openmoca.org/profiles/eu-ai-act/v1"` in its
   manifest `profile` array.
3. MUST include at least `riskTier`, `regulationVersion`, and
   `intendedPurpose` in `profileData.euAiAct`; other fields are optional
   but RECOMMENDED.
4. MAY include a `governance` ontology (§2) with SHACL shapes or RDF
   rules encoding formal compliance checks; if present, it MUST be valid
   Turtle/RDF and MUST not conflict with core ontologies.
5. MAY reference content nodes via `humanOversight.overrideNode` to
   ground compliance procedures; these references MUST be valid URNs
   pointing to existing nodes in `content/`.
6. MUST NOT rely on EU AI Act profile semantics for content a Core-only
   harness needs to correctly ground against the package — per Core §10.2,
   the profile is enrichment, not a requirement for basic function.
7. SHOULD include a `README.md` or package description noting which
   version of the EU AI Act regulation the classification applies to, and
   any limitations of the self-declared classification (e.g. "Awaiting
   independent expert assessment").

---

## See Also

- [MOCA Core Specification §10.5](../../moca-core-spec.md#105-compliance--standards-profiles) — overview of compliance profiles
- [Example EU AI Act package](examples/eu-ai-act-profile/) — runnable fixture demonstrating this profile
- [JSON Schema for profileData.euAiAct](profile.schema.json)
