---
type: PodcastEpisode
title: Edges of refined quotes
sources:
  - { id: audio, resource: 'https://media.example.com/edge.mp3' }
  - { id: transcript, resource: ../media/episode.en.vtt }
moca:
  media:
    - { source: audio, type: audio/mpeg, duration: 50, transcript: transcript }
  evidence:
    - source: audio
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=0,40', refinedBy: { type: TextQuoteSelector, exact: beta gamma } }
      note: 'Cues out of time order: located runs from the earliest start, 10, to the latest end, 40'
    - source: audio
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=40,50', refinedBy: { type: TextQuoteSelector, exact: " " } }
      note: 'A no-break space is not white space here, so it is a character to find'
    - source: audio
      selector: { type: FragmentSelector, conformsTo: 'http://www.w3.org/TR/media-frags/', value: 't=40,50', refinedBy: { type: TextQuoteSelector, exact: "\t \n" } }
      note: 'Only white space: does not match'
---
# Edges of refined quotes

Alpha, beta, gamma, and the tide tables.
