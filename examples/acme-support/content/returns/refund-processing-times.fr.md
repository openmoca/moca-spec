---
type: Policy
title: Délais de traitement des remboursements
description: Quand le remboursement arrive au client.
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
        exact: "Le remboursement est effectué sur le moyen de paiement d'origine dans les 5 jours ouvrés suivant la réception de l'article retourné."
  concepts:
    - iri: https://example.com/moca/acme-support/topics#RefundProcessingTimes
      role: primary
---

# Délais de traitement des remboursements

Le remboursement est effectué sur le moyen de paiement d'origine dans les 5 jours ouvrés suivant la réception de l'article retourné.

Les banques peuvent mettre encore 3 à 5 jours ouvrés pour afficher le remboursement sur un relevé.
