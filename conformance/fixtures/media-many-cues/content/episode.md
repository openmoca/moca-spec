---
type: PodcastEpisode
title: A transcript of 200,000 cues
sources:
  - { id: audio, resource: 'https://media.example.com/long.mp3' }
  - { id: transcript, resource: ../media/episode.en.vtt }
moca:
  media:
    - { source: audio, type: audio/mpeg, transcript: transcript }
  evidence:
    - source: audio
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=10,20' }
    - source: audio
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=1990,2100' }
---
# A transcript of 200,000 cues

The transcript has 200,000 cues of 10 milliseconds each, so it ends at 2,000 seconds. A range inside it matches; one
that runs past its last cue, with no declared duration, does not.
