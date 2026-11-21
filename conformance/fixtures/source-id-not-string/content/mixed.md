---
type: Article
title: The number 1 and the string "1"
sources:
  - { id: 1, resource: ../sources/first.txt }
  - { id: '1', resource: ../sources/second.txt }
moca:
  evidence:
    - source: '1'
      selector: { type: TextQuoteSelector, exact: the tide turns at dusk }
---
# The number 1 and the string "1"

Only the string is an id, so "1" names the second source, and the quote matches it.
