---
type: Policy
title: Changing or cancelling an order
description: When an order can still be changed or cancelled.
tags: [orders]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
verified:
  - by: human:sam.ortiz
    at: 2026-09-14T00:00:00Z
stale_after: 2027-09-01T00:00:00Z
sources:
  - id: terms-3
    title: "Acme Customer Terms, section 3 (Orders)"
    resource: ../../sources/customer-terms.txt
moca:
  audience: public
  evidence:
    - source: terms-3
      selector:
        type: TextQuoteSelector
        exact: You can change or cancel an order free of charge until it is dispatched.
    - source: terms-3
      selector:
        type: TextQuoteSelector
        exact: "Once an order has been dispatched, it can no longer be cancelled; return it instead."
  concepts:
    - iri: https://example.com/moca/acme-support/topics#ChangingOrCancellingAnOrder
      role: primary
---

# Changing or cancelling an order

You can change or cancel an order free of charge until it is dispatched.

To change or cancel, open the order in your account and choose **Change** or **Cancel**. Once an order has been dispatched, it can no longer be cancelled; return it instead.
