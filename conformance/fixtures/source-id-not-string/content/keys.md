---
type: Article
title: Numbers as keys
1e400: a key too large to be a finite number
extra:
  .inf: a key that is not a finite number
sources:
  - { id: first, resource: ../sources/first.txt }
moca:
  evidence:
    - source: first
      selector: { type: TextQuoteSelector, exact: the tide turns at noon }
---
# Numbers as keys

A mapping key may be a number that is not finite. The node is still read, and its quote matches.
