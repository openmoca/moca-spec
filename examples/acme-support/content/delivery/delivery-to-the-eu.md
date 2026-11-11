---
type: Policy
title: Delivery to the European Union
description: Delivery times and customs for orders to the EU.
tags: [delivery]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
stale_after: 2027-09-01T00:00:00Z
sources:
  - id: terms-5
    title: "Acme Customer Terms, section 5 (Delivery)"
    resource: ../../sources/customer-terms.txt
moca:
  audience: public
  evidence:
    - source: terms-5
      selector:
        type: TextQuoteSelector
        exact: Delivery to the European Union takes 5 to 8 working days.
  concepts:
    - iri: https://example.com/moca/acme-support/topics#DeliveryToTheEU
      role: primary
---

# Delivery to the European Union

Delivery to the European Union takes 5 to 8 working days.

Orders to the EU are sent with duties paid, so there is nothing more to pay on delivery.
