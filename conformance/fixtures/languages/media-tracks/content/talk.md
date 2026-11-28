---
type: Talk
title: Talk
sources:
  - id: video
    resource: https://media.example.com/talk.mp4
  - id: transcript
    resource: ../media/talk.en.vtt
  - id: subtitles-fr
    resource: ../media/talk.fr.vtt
moca:
  media:
    - source: video
      type: video/mp4
      duration: 5
      transcript: transcript
  tracks:
    - media: video
      source: subtitles-fr
      language: fr
      kind: subtitles
      label: Français
---

# Talk

Welcome to the talk.
