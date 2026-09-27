---
type: Policy
title: Refunds
sources:
  - id: policy
    resource: ../sources/policy.md
  - id: returns
    resource: ../sources/returns.html
moca:
  evidence:
    - source: policy
      selector: {type: TextQuoteSelector, exact: "Customers may request a full refund within 30 days of delivery."}
    - source: policy
      selector: {type: TextQuoteSelector, exact: "Café orders are excluded."}
    - source: policy
      selector: {type: TextPositionSelector, start: 0, end: 7}
    - source: policy
      selector: {type: TextQuoteSelector, exact: "a **full refund**"}
    - source: returns
      selector: {type: TextQuoteSelector, exact: "Returns are free for orders over £50 & under 30 kg."}
---

# Refunds

Refunds are available within 30 days of delivery.
