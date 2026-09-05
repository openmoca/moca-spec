---
id: urn:node:override-procedure
title: Human Override and Escalation Procedure
concepts:
  - id: ex:Oversight
    role: primary
  - id: ex:Escalation
    role: supporting
epistemicStatus: authoritative
summary: "Procedure for human override and escalation in AI employment screening decisions"
---

# Human Override and Escalation Procedure

## Overview

When the AI employment screening system recommends a candidate rejection or flagged concern, the compliance officer MUST review the decision before final communication to the candidate or hiring team.

## Escalation Trigger

An escalation is required if:

- The system's confidence score is between 40% and 60% (borderline confidence)
- The decision conflicts with prior hiring decisions for similar candidates
- The candidate requests human review
- A compliance or legal concern is flagged by any team member

## Review Process

1. **Compliance Officer Assignment** — The case is routed to an available compliance officer within 24 hours.
2. **Evidence Examination** — The officer reviews:
   - System input features and their values
   - System reasoning/explanation (if available)
   - Candidate context (prior employment, domain expertise, role requirements)
   - Relevant policy constraints
3. **Decision Point** — The officer MAY:
   - Approve the system recommendation
   - Override the system decision with justified alternative recommendation
   - Request data correction if input data is incomplete or erroneous
   - Escalate to legal/ethics review for high-impact decisions
4. **Documentation** — All overrides MUST be logged with:
   - Reason for override
   - Officer name and role
   - Timestamp
   - Any policy amendments resulting from the review

## Audit and Feedback

- Escalation logs are retained per EU AI Act Article 12 (record-keeping) for a minimum of 3 years.
- Monthly aggregated statistics on override rates by reason are shared with the ethics review board.
- High override rates on particular screening criteria trigger re-audit of the underlying model.

## Escalation to Legal/Ethics Review

Cases involving potential discrimination, protected characteristics, or policy conflicts MUST be escalated to the ethics review board, which includes legal counsel.
