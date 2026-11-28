---
type: Talk
title: Talk
sources:
  - id: video
    resource: https://media.example.com/talk.mp4
  - id: transcript
    resource: ../media/talk.en.vtt
  - id: captions-fr
    resource: ../media/talk.fr.vtt
  - id: page
    resource: https://example.com/talk-captions.html
moca:
  evidence:
    - source: video
      selector:
        type: FragmentSelector
        value: t=0,5
        conformsTo: http://www.w3.org/TR/media-frags/
        refinedBy:
          type: TextQuoteSelector
          exact: Bienvenue.
  media:
    - source: video
      type: video/mp4
      duration: 5
      transcript: transcript
      captions:
        - source: captions-fr
          language: fr
        - source: captions-fr
          language: fr
          kind: captions
        - source: unknown
          language: de
        - source: page
          language: en
        - source: transcript
          language: x-private
        - source: transcript
          language: en
          kind: karaoke
---

# Talk

Welcome to the talk.
