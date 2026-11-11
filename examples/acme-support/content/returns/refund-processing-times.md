---
type: Policy
title: Refund processing times
description: When a refund reaches the customer.
tags: [returns]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
stale_after: 2027-09-01T00:00:00Z
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
        exact: Refunds are made to the original payment method within 5 working days of the returned item being received.
  concepts:
    - iri: https://example.com/moca/acme-support/topics#RefundProcessingTimes
      role: primary
---

# Refund processing times

Refunds are made to the original payment method within 5 working days of the returned item being received.

Banks can take a further 3 to 5 working days to show the refund on a statement.
