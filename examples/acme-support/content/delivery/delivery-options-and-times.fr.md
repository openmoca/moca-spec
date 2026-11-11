---
type: Policy
title: Options et délais de livraison
description: "Les délais de chaque option de livraison, et quand elle est gratuite."
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
    title: "Conditions générales Acme, article 5 (Livraison)"
    resource: ../../sources/conditions-generales.txt
moca:
  audience: public
  contested_by:
    - https://example.com/moca/acme-support#delivery/carrier-disruption-notice.md
  evidence:
    - source: terms-5
      selector:
        type: TextQuoteSelector
        exact: La livraison standard au Royaume-Uni prend de 3 à 5 jours ouvrés.
    - source: terms-5
      selector:
        type: TextQuoteSelector
        exact: La livraison express au Royaume-Uni prend de 1 à 2 jours ouvrés.
    - source: terms-5
      selector:
        type: TextQuoteSelector
        exact: La livraison standard est gratuite pour les commandes de plus de 50 £.
  concepts:
    - iri: https://example.com/moca/acme-support/topics#DeliveryOptionsAndTimes
      role: primary
---

# Options et délais de livraison

La livraison standard au Royaume-Uni prend de 3 à 5 jours ouvrés.

La livraison express au Royaume-Uni prend de 1 à 2 jours ouvrés.

La livraison standard est gratuite pour les commandes de plus de 50 £.

Les délais courent à partir de l'expédition, pas de la commande.
