---
type: Policy
title: Returns policy
description: "What can be returned, and in what condition."
tags: [returns]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
verified:
  - by: human:sam.ortiz
    at: 2026-09-14T00:00:00Z
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
        exact: Returned items must be unused and in their original packaging.
  concepts:
    - iri: https://example.com/moca/acme-support/topics#ReturnsPolicy
      role: primary
---

# Returns policy

You can return most items for a full refund. Returned items must be unused and in their original packaging.

See [Refund window](refund-window.md) for how long you have, and [How to return an item](how-to-return-an-item.md) for the steps.
