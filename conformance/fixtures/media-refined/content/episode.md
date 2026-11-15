---
type: PodcastEpisode
title: Tides, quoted
sources:
  - { id: audio, resource: 'https://media.example.com/tides.mp3' }
  - { id: video, resource: 'https://video.example.com/watch?v=tides' }
  - { id: transcript, resource: ../media/episode.en.vtt }
moca:
  media:
    - { source: audio, type: audio/mpeg, duration: 60, transcript: transcript }
    - source: video
      type: text/html
      duration: 160
      alternateOf: audio
      sync: [{ at: 0, offset: 100 }]
  evidence:
    - source: audio
      selector:
        type: FragmentSelector
        conformsTo: 'http://www.w3.org/TR/media-frags/'
        value: 't=10,20'
        refinedBy: { type: TextQuoteSelector, exact: 'talk about the tides' }
      note: 'A line break inside a cue counts as a space'
    - source: audio
      selector:
        type: FragmentSelector
        conformsTo: 'http://www.w3.org/TR/media-frags/'
        value: 't=0,30'
        refinedBy: { type: TextQuoteSelector, exact: 'the show. Today' }
      note: 'Across two cues'
    - source: audio
      selector:
        type: FragmentSelector
        conformsTo: 'http://www.w3.org/TR/media-frags/'
        value: 't=40,60'
        refinedBy: { type: TextQuoteSelector, exact: 'pulls the water' }
      note: 'Two occurrences: the shorter span, 52 to 60, wins'
    - source: audio
      selector:
        type: FragmentSelector
        conformsTo: 'http://www.w3.org/TR/media-frags/'
        value: 't=20,40'
        refinedBy: { type: TextQuoteSelector, exact: 'the water' }
      note: 'Two equally short spans: the earlier wins'
    - source: audio
      selector:
        type: FragmentSelector
        conformsTo: 'http://www.w3.org/TR/media-frags/'
        value: 't=0,10'
        refinedBy: { type: TextQuoteSelector, exact: 'the tides' }
      note: 'The range matches; the words are spoken elsewhere'
    - source: audio
      selector:
        type: FragmentSelector
        conformsTo: 'http://www.w3.org/TR/media-frags/'
        value: 't=200,210'
        refinedBy: { type: TextQuoteSelector, exact: 'Welcome' }
      note: 'The range does not match; the quote is not checked'
    - source: audio
      selector:
        type: FragmentSelector
        conformsTo: 'http://www.w3.org/TR/media-frags/'
        value: 't=20,30'
        refinedBy: { type: TextQuoteSelector, exact: moon, prefix: 'The ', suffix: ' pulls' }
      note: 'With a prefix and a suffix'
    - source: audio
      selector:
        type: FragmentSelector
        conformsTo: 'http://www.w3.org/TR/media-frags/'
        value: 't=0,10'
        refinedBy: { type: TextPositionSelector, start: 0, end: 7 }
      note: 'Another kind of refinement: the range alone'
    - source: video
      selector:
        type: FragmentSelector
        conformsTo: 'http://www.w3.org/TR/media-frags/'
        value: 't=152,160'
        refinedBy: { type: TextQuoteSelector, exact: 'the moon pulls the water' }
      note: 'On the alternate: 52 to 60 on the audio, 152 to 160 on the video'
    - source: audio
      selector:
        type: FragmentSelector
        conformsTo: 'http://www.w3.org/TR/media-frags/'
        value: 't=50'
        refinedBy: { type: TextQuoteSelector, exact: 'the water up.' }
      note: 'No end'
---
# Tides, quoted

The moon pulls the water, twice a day.
