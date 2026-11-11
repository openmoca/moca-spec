---
type: Policy
title: Damaged or faulty items
description: Returning an item that arrived damaged or developed a fault.
tags: [returns]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
stale_after: 2027-09-01T00:00:00Z
sources:
  - id: terms-8
    title: "Acme Customer Terms, section 8 (Faulty items and warranty)"
    resource: ../../sources/customer-terms.txt
moca:
  audience: public
  evidence:
    - source: terms-8
      selector:
        type: TextQuoteSelector
        exact: "Faulty or damaged items can be returned at any time within the warranty period, and we pay the return postage."
  concepts:
    - iri: https://example.com/moca/acme-support/topics#DamagedOrFaultyItems
      role: primary
---

# Damaged or faulty items

Faulty or damaged items can be returned at any time within the warranty period, and we pay the return postage.

Take a photo of the damage, then contact support. We send a prepaid label, and a replacement or a refund once the item is back.
