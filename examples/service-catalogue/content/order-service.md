---
type: Service
title: Order service
description: Takes and tracks customer orders; owns the order database.
moca:
  concepts:
    - iri: https://example.org/services#OrderService
      role: primary
    - iri: https://example.org/services#OrderDatabase
      role: supporting
---

# Order service

The order service takes customer orders and tracks them to delivery. It is
the only service that writes to the order database; other services read order
state through its API.
