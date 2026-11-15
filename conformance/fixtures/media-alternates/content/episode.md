---
type: PodcastEpisode
title: Tides
sources:
  - id: audio
    resource: https://media.example.com/tides.mp3
  - id: video
    resource: https://video.example.com/watch?v=tides
  - id: clip
    resource: https://video.example.com/tides-clip.mp4
  - id: transcript
    resource: ../media/episode.en.vtt
moca:
  media:
    - source: audio
      type: audio/mpeg
      duration: 100
      transcript: transcript
    - source: video
      type: text/html
      duration: 130
      alternateOf: audio
      sync:
        - { at: 0, offset: 10 }
        - { at: 40, offset: null }
        - { at: 50, offset: 0 }
        - { at: 70, offset: 20 }
    - source: clip
      type: video/mp4
      duration: 100
      alternateOf: audio
  evidence:
    - source: video
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=12,30' }
      note: 'In the first stretch: 2 to 20 on the audio'
    - source: video
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=50,70' }
      note: 'A whole stretch, ending on its boundary'
    - source: video
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=95,110' }
      note: 'In the last stretch: 75 to 90 on the audio'
    - source: clip
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=10,20' }
      note: 'No sync: the same timeline as the audio'
    - source: video
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=40,60' }
      note: 'Across two stretches: does not map'
    - source: video
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=75,85' }
      note: 'In the ad break only the video has: does not map'
    - source: video
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=95' }
      note: 'No end: maps its start'
    - source: video
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=110,125' }
      note: '90 to 105 on the audio, past its duration'
---
# Tides

The moon pulls the water, and spring tides come with the full moon.
