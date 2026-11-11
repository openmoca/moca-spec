---
type: Policy
title: Refunds
sources:
  - id: terms
    resource: ../sources/terms.txt
moca:
  evidence:
    - source: terms
      selector: {type: TextQuoteSelector, exact: "within 60 days of delivery"}
    - source: terms
      selector: {type: TextPositionSelector, start: 0, end: 5000}
---

# Refunds

A refund can be requested within 60 days of delivery.
