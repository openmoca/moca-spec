---
type: Policy
title: Gift cards
description: How Acme gift cards work.
tags: [payments]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
stale_after: 2026-09-30T00:00:00Z
sources:
  - id: terms-4
    title: "Acme Customer Terms, section 4 (Payment)"
    resource: ../../sources/customer-terms.txt
moca:
  audience: public
  evidence:
    - source: terms-4
      selector:
        type: TextQuoteSelector
        exact: Gift cards are valid for 24 months from the date of purchase and cannot be exchanged for cash.
  concepts:
    - iri: https://example.com/moca/acme-support/topics#GiftCards
      role: primary
---

# Gift cards

Gift cards are valid for 24 months from the date of purchase and cannot be exchanged for cash.

A gift card can pay for all or part of an order. Any balance stays on the card.
