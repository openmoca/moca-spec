---
type: Policy
title: "Livraison vers l'Union européenne"
description: "Délais de livraison et douane pour les commandes vers l'UE."
tags: [delivery]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
stale_after: 2027-09-01T00:00:00Z
sources:
  - id: terms-5
    title: "Conditions générales Acme, article 5 (Livraison)"
    resource: ../../sources/conditions-generales.txt
moca:
  audience: public
  evidence:
    - source: terms-5
      selector:
        type: TextQuoteSelector
        exact: "La livraison vers l'Union européenne prend de 5 à 8 jours ouvrés."
  concepts:
    - iri: https://example.com/moca/acme-support/topics#DeliveryToTheEU
      role: primary
---

# Livraison vers l'Union européenne

La livraison vers l'Union européenne prend de 5 à 8 jours ouvrés.

Les commandes vers l'UE sont expédiées droits acquittés : il n'y a rien de plus à payer à la livraison.
