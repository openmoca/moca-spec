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
moca:
  media:
    - source: video
      type: video/mp4
      duration: 5
      transcript: transcript
      captions:
        - source: captions-fr
          language: fr
          kind: subtitles
---

# Talk

Welcome to the talk.
