---
type: PodcastEpisode
title: Infinite numbers
sources:
  - { id: audio, resource: 'https://media.example.com/inf.mp3' }
  - { id: video, resource: 'https://video.example.com/inf' }
  - { id: transcript, resource: ../media/episode.en.vtt }
moca:
  media:
    - { source: audio, type: audio/mpeg, duration: .inf, transcript: transcript }
    - source: video
      type: text/html
      alternateOf: audio
      sync: [{ at: 0, offset: .nan }]
  evidence:
    - source: audio
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=10,20' }
---
# Infinite numbers

A duration of .inf and an offset of .nan fail the node schema, so both descriptions are ignored.
