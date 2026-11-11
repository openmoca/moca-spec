---
type: Policy
title: Articles en vente finale
description: Les articles qui ne peuvent pas être remboursés.
tags: [returns]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
stale_after: 2027-09-01T00:00:00Z
sources:
  - id: terms-7
    title: "Conditions générales Acme, article 7 (Remboursements et retours)"
    resource: ../../sources/conditions-generales.txt
moca:
  audience: public
  evidence:
    - source: terms-7
      selector:
        type: TextQuoteSelector
        exact: Les articles soldés en vente finale ne peuvent pas être remboursés.
  concepts:
    - iri: https://example.com/moca/acme-support/topics#FinalSaleItems
      role: primary
---

# Articles en vente finale

Les articles soldés en vente finale ne peuvent pas être remboursés.

Ils sont marqués **Vente finale** sur la page produit et sur le reçu. Les articles en vente finale défectueux restent couverts par la garantie.
