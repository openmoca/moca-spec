---
type: Policy
title: Refunds
sources:
  - id: terms
    resource: ../sources/terms.txt
moca:
  evidence:
    - source: terms
      selector: {type: TextQuoteSelector, exact: "within 30 days of delivery"}
    - source: terms
      selector: {type: TextQuoteSelector, exact: "Café orders", prefix: ".\n", suffix: " are excluded"}
    - source: terms
      selector: {type: TextPositionSelector, start: 0, end: 7}
---

# Refunds

A refund can be requested within 30 days of delivery.
