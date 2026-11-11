---
type: Policy
title: Délai de remboursement
description: "Le délai pour demander un remboursement, et à partir de quand."
tags: [returns]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
verified:
  - by: human:sam.ortiz
    at: 2026-09-14T00:00:00Z
stale_after: 2027-03-14T00:00:00Z
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
        exact: Le client peut demander un remboursement intégral dans les 30 jours suivant la livraison.
    - source: terms-7
      selector:
        type: TextQuoteSelector
        exact: Les articles soldés en vente finale ne peuvent pas être remboursés.
  concepts:
    - iri: https://example.com/moca/acme-support/topics#RefundWindow
      role: primary
---

# Délai de remboursement

Le client peut demander un remboursement intégral dans les 30 jours suivant la livraison. Le délai court à partir de la date de livraison enregistrée par le transporteur, et non de la date de commande.

Les articles soldés en vente finale ne peuvent pas être remboursés.
