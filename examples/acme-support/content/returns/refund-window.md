---
type: Policy
title: Refund window
description: "How long customers have to ask for a refund, and from when."
tags: [returns]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
verified:
  - by: human:sam.ortiz
    at: 2026-09-14T00:00:00Z
stale_after: 2027-03-14T00:00:00Z
sources:
  - id: terms-7
    title: "Acme Customer Terms, section 7 (Refunds and returns)"
    resource: ../../sources/customer-terms.txt
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
  concepts:
    - iri: https://example.com/moca/acme-support/topics#RefundWindow
      role: primary
---

# Refund window

Customers may request a full refund within 30 days of delivery. The window runs from the delivery date recorded by the carrier, not the order date.

Items marked as final sale are not eligible for a refund.
