---
type: Policy
title: Politique de retour
description: "Ce qui peut être retourné, et dans quel état."
tags: [returns]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
verified:
  - by: human:sam.ortiz
    at: 2026-09-14T00:00:00Z
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
        exact: "Les articles retournés doivent être inutilisés et dans leur emballage d'origine."
  concepts:
    - iri: https://example.com/moca/acme-support/topics#ReturnsPolicy
      role: primary
---

# Politique de retour

Vous pouvez retourner la plupart des articles contre un remboursement intégral. Les articles retournés doivent être inutilisés et dans leur emballage d'origine.

Voir [Délai de remboursement](refund-window.md) pour le délai, et [Retourner un article](how-to-return-an-item.md) pour les étapes.
