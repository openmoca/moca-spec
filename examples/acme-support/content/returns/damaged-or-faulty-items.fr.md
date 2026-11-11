---
type: Policy
title: Articles endommagés ou défectueux
description: Retourner un article arrivé endommagé ou devenu défectueux.
tags: [returns]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
stale_after: 2027-09-01T00:00:00Z
sources:
  - id: terms-8
    title: "Conditions générales Acme, article 8 (Articles défectueux et garantie)"
    resource: ../../sources/conditions-generales.txt
moca:
  audience: public
  evidence:
    - source: terms-8
      selector:
        type: TextQuoteSelector
        exact: "Les articles défectueux ou endommagés peuvent être retournés à tout moment pendant la période de garantie, et nous payons les frais de retour."
  concepts:
    - iri: https://example.com/moca/acme-support/topics#DamagedOrFaultyItems
      role: primary
---

# Articles endommagés ou défectueux

Les articles défectueux ou endommagés peuvent être retournés à tout moment pendant la période de garantie, et nous payons les frais de retour.

Prenez une photo du dommage, puis contactez le support. Nous envoyons une étiquette prépayée, puis un remplacement ou un remboursement au retour de l'article.
