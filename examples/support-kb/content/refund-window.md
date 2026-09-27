---
type: Policy
title: Refund eligibility window
description: How long customers have to ask for a refund, and from when.
tags: [refunds, policy]
generated:
  by: acme-drafter/2.1
  at: 2026-07-30T09:00:00Z
verified:
  - by: human:sam.ortiz
    at: 2026-08-14T00:00:00Z
stale_after: 2027-02-14T00:00:00Z
sources:
  - id: terms-7
    resource: ../sources/refund-policy-2026.txt
    title: Acme Customer Terms, section 7
moca:
  audience: public
  evidence:
    - source: terms-7
      selector:
        type: TextQuoteSelector
        exact: Customers may request a full refund within 30 days of delivery.
    - source: terms-7
      selector:
        type: TextQuoteSelector
        exact: Items marked as final sale are not eligible for a refund.
---

# Refund eligibility window

Customers may request a full refund within **30 days of delivery**. The window
runs from the delivery date recorded by the carrier, not the order date.

Items marked as final sale are not eligible. Where a carrier has not recorded a
delivery date, use the dispatch date plus five working days.
