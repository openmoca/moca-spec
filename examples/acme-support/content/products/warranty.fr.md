---
type: Policy
title: Garantie
description: Ce que couvre la garantie Acme.
tags: [products]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
verified:
  - by: human:sam.ortiz
    at: 2026-09-14T00:00:00Z
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
        exact: "Chaque produit Acme bénéficie d'une garantie de deux ans contre les défauts de fabrication."
  concepts:
    - iri: https://example.com/moca/acme-support/topics#Warranty
      role: primary
---

# Garantie

Chaque produit Acme bénéficie d'une garantie de deux ans contre les défauts de fabrication.

La garantie ne couvre pas l'usure normale, les dommages accidentels ni la mauvaise utilisation.
