---
type: PodcastEpisode
title: Invalid media descriptions
sources:
  - id: audio
    resource: https://media.example.com/episode-1.mp3
  - id: notes
    resource: ../sources/notes.txt
moca:
  media:
    - source: missing
      type: audio/mpeg
    - source: audio
      type: audio
    - source: audio
      type: audio/mpeg; codecs=mp3
      transcript: notes
    - source: audio
      type: audio/ogg
---

# Invalid

An unknown source, a bad media type, a transcript that is not WebVTT, and a second description of one source.
