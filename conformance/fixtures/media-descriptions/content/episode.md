---
type: PodcastEpisode
title: Episode one
sources:
  - id: audio
    resource: https://media.example.com/episode-1.mp3
  - id: transcript
    resource: ../media/episode-1.en.vtt
moca:
  media:
    - source: audio
      type: audio/mpeg
      duration: 40
      digest: sha256:abababababababababababababababababababababababababababababababab
      transcript: transcript
  evidence:
    - source: transcript
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: 't=1,4'
      note: 'Inside the cues'
    - source: audio
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: 't=1,4'
      note: 'The hosted audio, checked against its transcript'
    - source: transcript
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: 't=18,30'
      note: 'Past the last cue, within the duration'
    - source: transcript
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: 't=18,45'
      note: 'Past the duration'
    - source: audio
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: 't=18'
      note: 'No end: runs to the end of the media'
    - source: transcript
      selector:
        type: TextQuoteSelector
        exact: "about tides\nand the moon."
---

# Episode one

Welcome to the first episode. Today we talk about tides and the moon. Thanks for listening.
