---
type: Policy
title: Vos données et votre vie privée
description: Combien de temps Acme conserve les données de compte.
tags: [account]
generated:
  by: acme-drafter/3.0
  at: 2026-09-01T09:00:00Z
verified:
  - by: human:priya.shah
    at: 2026-09-20T00:00:00Z
stale_after: 2027-09-01T00:00:00Z
sources:
  - id: terms-10
    title: "Conditions générales Acme, article 10 (Vos données)"
    resource: ../../sources/conditions-generales.txt
moca:
  audience: public
  evidence:
    - source: terms-10
      selector:
        type: TextQuoteSelector
        exact: Nous conservons les données de votre compte tant que votre compte est ouvert.
    - source: terms-10
      selector:
        type: TextQuoteSelector
        exact: "Lorsque vous fermez votre compte, nous supprimons vos données personnelles dans les 30 jours, sauf si la loi nous oblige à les conserver."
  concepts:
    - iri: https://example.com/moca/acme-support/topics#YourDataAndPrivacy
      role: primary
---

# Vos données et votre vie privée

Nous conservons les données de votre compte tant que votre compte est ouvert.

Lorsque vous fermez votre compte, nous supprimons vos données personnelles dans les 30 jours, sauf si la loi nous oblige à les conserver.
