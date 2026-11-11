---
type: Policy
title: Moyens de paiement
description: "Les moyens de paiement acceptés, et quand le paiement est prélevé."
tags: [payments]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
stale_after: 2027-09-01T00:00:00Z
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
        exact: "Nous acceptons Visa, Mastercard, American Express, PayPal et les cartes cadeaux Acme."
    - source: terms-4
      selector:
        type: TextQuoteSelector
        exact: "Le paiement est prélevé à l'expédition de la commande."
  concepts:
    - iri: https://example.com/moca/acme-support/topics#PaymentMethods
      role: primary
---

# Moyens de paiement

Nous acceptons Visa, Mastercard, American Express, PayPal et les cartes cadeaux Acme.

Le paiement est prélevé à l'expédition de la commande.
