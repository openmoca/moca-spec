---
type: Policy
title: Your data and privacy
description: How long Acme keeps account data.
tags: [account]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
verified:
  - by: human:priya.shah
    at: 2026-09-20T00:00:00Z
stale_after: 2027-09-01T00:00:00Z
sources:
  - id: terms-10
    title: "Acme Customer Terms, section 10 (Your data)"
    resource: ../../sources/customer-terms.txt
moca:
  audience: public
  evidence:
    - source: terms-10
      selector:
        type: TextQuoteSelector
        exact: We keep your account data for as long as your account is open.
    - source: terms-10
      selector:
        type: TextQuoteSelector
        exact: "When you close your account, we delete your personal data within 30 days, except where the law requires us to keep it."
  concepts:
    - iri: https://example.com/moca/acme-support/topics#YourDataAndPrivacy
      role: primary
---

# Your data and privacy

We keep your account data for as long as your account is open.

When you close your account, we delete your personal data within 30 days, except where the law requires us to keep it.
