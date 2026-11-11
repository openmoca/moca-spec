---
type: Policy
title: Warranty
description: What the Acme warranty covers.
tags: [products]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
verified:
  - by: human:sam.ortiz
    at: 2026-09-14T00:00:00Z
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
        exact: Every Acme product carries a two-year warranty against manufacturing faults.
  concepts:
    - iri: https://example.com/moca/acme-support/topics#Warranty
      role: primary
---

# Warranty

Every Acme product carries a two-year warranty against manufacturing faults.

The warranty does not cover wear and tear, accidental damage or misuse.
