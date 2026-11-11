---
type: Policy
title: Cartes cadeaux
description: Comment fonctionnent les cartes cadeaux Acme.
tags: [payments]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
stale_after: 2026-09-30T00:00:00Z
sources:
  - id: terms-4
    title: "Conditions générales Acme, article 4 (Paiement)"
    resource: ../../sources/conditions-generales.txt
moca:
  audience: public
  evidence:
    - source: terms-4
      selector:
        type: TextQuoteSelector
        exact: "Les cartes cadeaux sont valables 24 mois à compter de la date d'achat et ne peuvent pas être échangées contre de l'argent."
  concepts:
    - iri: https://example.com/moca/acme-support/topics#GiftCards
      role: primary
---

# Cartes cadeaux

Les cartes cadeaux sont valables 24 mois à compter de la date d'achat et ne peuvent pas être échangées contre de l'argent.

Une carte cadeau peut régler tout ou partie d'une commande. Le solde reste sur la carte.
