---
type: PodcastEpisode
title: Hosted audio with no transcript
sources:
  - id: audio
    resource: https://media.example.com/episode-1.mp3
moca:
  media:
    - source: audio
      type: audio/mpeg
      duration: 40
  evidence:
    - source: audio
      selector:
        type: FragmentSelector
        conformsTo: http://www.w3.org/TR/media-frags/
        value: 't=1,4'
---

# Hosted

A time range on hosted media with a duration and no transcript is not checked.
