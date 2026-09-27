# MOCA EU AI Act data-governance profile

Profile URI: `https://w3id.org/moca/profiles/eu-ai-act/v1`
Status: Draft, `0.3.0-alpha.1`

## 1. Purpose and scope

The EU AI Act (Regulation (EU) 2024/1689) classifies **AI systems** by risk
and places duties on their providers and deployers. A knowledge package is not
an AI system: the same package can feed a minimal-risk FAQ assistant and a
high-risk system. This profile therefore carries **no risk tier, intended
purpose or human-oversight classification**. Those belong to the system that
uses the package, and to that system's documentation.

What a package can honestly carry is information a provider needs for its own
data-governance and transparency work: where the knowledge came from, what
period it covers, how it was prepared, its known gaps, whether it contains
personal data, and how much of it was machine-generated. That is what this
profile records.

**Disclaimer.** Declaring this profile is a statement by the package's
publisher. It is not legal advice, a conformity assessment or evidence of
compliance, and a consumer MUST NOT treat it as such.

## 2. Package-level data

```json
{
  "profiles": {
    "https://w3id.org/moca/profiles/eu-ai-act/v1": {
      "regulation": "Regulation (EU) 2024/1689",
      "dataGovernance": {
        "sources": ["Acme Customer Terms 2026", "Support team macros, 2024-2026"],
        "collectionPeriod": { "from": "2024-01-01", "to": "2026-08-31" },
        "preparation": ["deduplicated", "outdated macros removed", "reviewed by the support policy owner"],
        "knownGaps": ["no content for business customers"],
        "personalData": "none"
      },
      "syntheticContent": { "present": true, "marking": "okf-generated" }
    }
  }
}
```

| Field | Meaning |
| --- | --- |
| `regulation` | The legal text and version the data was prepared against. |
| `dataGovernance.sources` | Human-readable description of the origins of the content. |
| `dataGovernance.collectionPeriod` | When the content was gathered. |
| `dataGovernance.preparation` | Processing applied: cleaning, filtering, review. |
| `dataGovernance.knownGaps` | Known shortcomings or missing coverage. |
| `dataGovernance.personalData` | `none`, `pseudonymised` or `present`. |
| `syntheticContent.present` | Whether any node was machine-generated. |
| `syntheticContent.marking` | How generated content is marked; `okf-generated` means every such node carries OKF `generated`. |

The schema is [`profile.schema.json`](profile.schema.json).

## 3. Reader behaviour

A Reader that recognises this profile MAY validate the data against the
schema and surface it to the application. It never changes how the package's
content is read, and a core-only Reader loses nothing it needs.

See [the example package](examples/support-kb-governance).
