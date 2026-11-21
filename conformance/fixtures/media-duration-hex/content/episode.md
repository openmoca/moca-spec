---
type: PodcastEpisode
title: A long hex duration
sources:
  - { id: audio, resource: 'https://media.example.com/hex.mp3' }
moca:
  media:
    - { source: audio, type: audio/mpeg, duration: 0x10000000000000801 }
---
# A long hex duration

The duration is 2 to the power 64, plus 2,049. The nearest double is 2 to the power 64, plus 4,096: rounded once, not twice.
