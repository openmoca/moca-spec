---
type: Policy
title: Payment methods
description: "Which payment methods Acme accepts, and when payment is taken."
tags: [payments]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
stale_after: 2027-09-01T00:00:00Z
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
        exact: "We accept Visa, Mastercard, American Express, PayPal and Acme gift cards."
    - source: terms-4
      selector:
        type: TextQuoteSelector
        exact: Payment is taken when the order is dispatched.
  concepts:
    - iri: https://example.com/moca/acme-support/topics#PaymentMethods
      role: primary
---

# Payment methods

We accept Visa, Mastercard, American Express, PayPal and Acme gift cards.

Payment is taken when the order is dispatched.
