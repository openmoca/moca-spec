---
type: Practice
title: Service boundaries
description: Each service owns its data and exposes it only through its API.
moca:
  profiles:
    https://w3id.org/moca/profiles/ontology/v1:
      concepts:
        - iri: https://example.org/services#ServiceBoundary
          role: primary
        - iri: https://example.org/services#Microservice
          role: supporting
---

# Service boundaries

A service boundary is the perimeter of what one service owns: its code, its
data and its operational duties. No other service reads or writes that data
directly; it goes through the owning service's API.
