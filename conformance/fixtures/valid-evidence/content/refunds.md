---
type: Policy
title: Refunds
sources:
  - id: terms
    resource: ../sources/terms.txt
  - id: video
    resource: https://example.com/talk.mp4
moca:
  evidence:
    - source: terms
      selector: {type: TextQuoteSelector, exact: "within 30 days of delivery"}
    - source: terms
      selector: {type: TextPositionSelector, start: 0, end: 7}
    - source: video
      selector: {type: FragmentSelector, conformsTo: "http://www.w3.org/TR/media-frags/", value: "t=75,210"}
---

# Refunds

Body text.
