---
type: Policy
title: Final sale items
description: Which items cannot be refunded.
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
        exact: Items marked as final sale are not eligible for a refund.
  concepts:
    - iri: https://example.com/moca/acme-support/topics#FinalSaleItems
      role: primary
---

# Final sale items

Items marked as final sale are not eligible for a refund.

They are marked **Final sale** on the product page and on the receipt. Faulty final sale items are still covered by the warranty.
