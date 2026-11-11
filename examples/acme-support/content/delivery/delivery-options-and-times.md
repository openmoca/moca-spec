---
type: Policy
title: Delivery options and times
description: "How long each delivery option takes, and when it is free."
tags: [delivery]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
verified:
  - by: human:sam.ortiz
    at: 2026-09-14T00:00:00Z
stale_after: 2027-09-01T00:00:00Z
sources:
  - id: terms-5
    title: "Acme Customer Terms, section 5 (Delivery)"
    resource: ../../sources/customer-terms.txt
moca:
  audience: public
  contested_by:
    - https://example.com/moca/acme-support#delivery/carrier-disruption-notice.md
  evidence:
    - source: terms-5
      selector:
        type: TextQuoteSelector
        exact: Standard delivery within the UK takes 3 to 5 working days.
    - source: terms-5
      selector:
        type: TextQuoteSelector
        exact: Express delivery within the UK takes 1 to 2 working days.
    - source: terms-5
      selector:
        type: TextQuoteSelector
        exact: Standard delivery is free on orders over £50.
  concepts:
    - iri: https://example.com/moca/acme-support/topics#DeliveryOptionsAndTimes
      role: primary
---

# Delivery options and times

Standard delivery within the UK takes 3 to 5 working days.

Express delivery within the UK takes 1 to 2 working days.

Standard delivery is free on orders over £50.

Times are counted from dispatch, not from the order.
