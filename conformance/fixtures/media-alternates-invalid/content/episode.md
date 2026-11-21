---
type: PodcastEpisode
title: Invalid alternates
sources:
  - { id: audio, resource: 'https://media.example.com/a.mp3' }
  - { id: v1, resource: 'https://video.example.com/1' }
  - { id: v2, resource: 'https://video.example.com/2' }
  - { id: v3, resource: 'https://video.example.com/3' }
  - { id: v4, resource: 'https://video.example.com/4' }
  - { id: v5, resource: 'https://video.example.com/5' }
  - { id: v6, resource: 'https://video.example.com/6' }
  - { id: v7, resource: 'https://video.example.com/7' }
moca:
  media:
    - { source: audio, type: audio/mpeg, duration: 60 }
    - { source: v1, type: text/html, alternateOf: missing }
    - { source: v2, type: text/html, alternateOf: v2 }
    - source: v3
      type: text/html
      alternateOf: audio
      sync: [{ at: 10, offset: 0 }, { at: 5, offset: 1 }]
    - source: v4
      type: text/html
      alternateOf: audio
      sync: [{ at: 0, offset: 30 }, { at: 20, offset: 0 }]
    - { source: v5, type: text/html, alternateOf: v6 }
    - source: v6
      type: text/html
      alternateOf: audio
      sync: [{ at: 0, offset: 5 }]
    - source: v7
      type: text/html
      sync: [{ at: 0, offset: 1 }]
  evidence:
    - source: v6
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=6,7' }
      note: 'The reference has no transcript: not checked'
---
# Invalid alternates

Each video but v6 loses its alternateOf.
