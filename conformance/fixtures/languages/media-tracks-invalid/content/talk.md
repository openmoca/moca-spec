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
  tracks:
    - { media: video, source: subtitles-fr, language: fr }
    - { media: video, source: subtitles-fr, language: fr, kind: captions }
    - { media: audio, source: transcript, language: en }
    - { media: video, source: unknown, language: de }
    - { media: video, source: page, language: en }
    - { media: video, source: transcript, language: x-private }
    - { media: video, source: transcript, language: en, kind: karaoke }
    - { media: video, source: transcript, language: en, label: "" }
---

# Talk

Welcome to the talk.
