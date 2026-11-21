---
type: Article
title: .inf as an id
sources:
  - { id: .inf, resource: ../sources/first.txt }
moca:
  evidence:
    - source: '.inf'
      selector: { type: TextQuoteSelector, exact: the tide turns at noon }
---
# .inf as an id

YAML's .inf is not a string, so the source has no id and ".inf" names nothing (C006).
