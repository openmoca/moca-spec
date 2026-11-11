---
type: Policy
title: Modifier ou annuler une commande
description: Quand une commande peut encore être modifiée ou annulée.
tags: [orders]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
verified:
  - by: human:sam.ortiz
    at: 2026-09-14T00:00:00Z
stale_after: 2027-09-01T00:00:00Z
sources:
  - id: terms-3
    title: "Conditions générales Acme, article 3 (Commandes)"
    resource: ../../sources/conditions-generales.txt
moca:
  audience: public
  evidence:
    - source: terms-3
      selector:
        type: TextQuoteSelector
        exact: "Vous pouvez modifier ou annuler une commande gratuitement jusqu'à son expédition."
    - source: terms-3
      selector:
        type: TextQuoteSelector
        exact: "Une fois expédiée, une commande ne peut plus être annulée ; retournez-la à la place."
  concepts:
    - iri: https://example.com/moca/acme-support/topics#ChangingOrCancellingAnOrder
      role: primary
---

# Modifier ou annuler une commande

Vous pouvez modifier ou annuler une commande gratuitement jusqu'à son expédition.

Pour modifier ou annuler, ouvrez la commande dans votre compte et choisissez **Modifier** ou **Annuler**. Une fois expédiée, une commande ne peut plus être annulée ; retournez-la à la place.
