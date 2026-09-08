---
id: urn:node:video-segment-01
title: Video Segment Reference
concepts:
  - ex:ServiceCommunication
epistemicStatus: sourced
summary: "Grounds a claim in a specific timestamp range of a recorded talk."
evidence:
  - source: "./media/recording.mp4"
    locator:
      type: FragmentSelector
      conformsTo: "http://www.w3.org/TR/media-frags/"
      value: "t=75,210"
---
# Video Segment Reference

This node's evidence locator uses the W3C Web Annotation `FragmentSelector`
model to target seconds 75–210 of `media/recording.mp4`, per
[core §7.3](../../../spec/moca-core-spec.md#73-multi-modal-evidence--web-annotation-locators).
No `media/recording.mp4` file is included in this fixture — the locator
demonstrates the pattern, not a playable asset.
