# YouTube videos

Two packages built from YouTube with `moca-youtube`, which captures a video or
playlist with [yt-dlp](https://github.com/yt-dlp/yt-dlp) and runs
`moca-convert --from youtube` on the capture. Nothing in them was written by
hand.

- `video/` is one recorded talk. Its node holds the video's description and a
  transcript made from its captions, grouped by the video's chapters.
- `playlist/` is a nine-video playlist, one node per video (these videos
  have no chapters, so each transcript is one section), with a
  `structure.ttl` that keeps the videos in playlist order
  (`skos:OrderedCollection`) and makes each a part of the playlist
  (`dcterms:hasPart`). Each node is bound to its concept with `moca.concepts`.
  `content/index.md` lists the videos in the same order.

What they show:

- **Media evidence.** Each node cites its chapters, or the whole video when it
  has none, as time ranges (a Media Fragments `FragmentSelector`,
  `t=start,end`). The captions travel
  under `media/` as WebVTT, so a Reader checks every range against the cue
  timings without a network.
- **Originals in the package.** The YouTube description is kept as written
  under `sources/`, and the node quotes it (`TextQuoteSelector`). The video
  itself stays on YouTube: it is the node's `resource` and a `sources` entry,
  but no evidence depends on it, so both packages are
  `self-contained-evidence`.

The captions are YouTube's automatic ones. YouTube's own WebVTT for those
repeats each line as it scrolls, so `moca-youtube` fetches the timed phrases
instead and writes one cue per phrase, with no overlaps.

The playlist's order is YouTube's, not the order of the part numbers in the
titles: the playlist lists the parts newest first.

## Regenerating

From the repository root, with Node 22 or later and yt-dlp on `PATH` (or
`--yt-dlp <path>`, or `$YT_DLP`):

```sh
node tools/moca-convert/bin/moca-youtube.js "https://www.youtube.com/watch?v=nENs3UndI2o" \
  -o examples/youtube/video --id https://example.com/moca/youtube/agent-framework-workflows --force

node tools/moca-convert/bin/moca-youtube.js "https://www.youtube.com/playlist?list=PLHTHCZPMDRMlnEYaQHhcFaEieKFvs7sdq" \
  -o examples/youtube/playlist --id https://example.com/moca/youtube/agent-framework-playlist --force
```

Add `--capture-dir <dir>` to keep the capture: converting the same capture
again with `moca-convert <dir> -o … --id …` gives a byte-identical package.
YouTube's automatic captions can change between fetches, so a fresh capture
may not.

## Attribution

The titles, descriptions and captions are the work of their creators and are
published on YouTube under the standard YouTube licence. They are included
here only as example source material, unchanged apart from the caption
cleanup described above; copyright stays with the creators, and the
repository's Apache-2.0 licence does not apply to them. Neither creator is
affiliated with MOCA.

- `video/`: "Microsoft Agent Framework Workflows: From Zero to Hero",
  [Microsoft Reactor](https://www.youtube.com/channel/UCkm6luGCS3hD25jcEhvRMIA),
  <https://www.youtube.com/watch?v=nENs3UndI2o>.
- `playlist/`: "Microsoft Agent Framework",
  [Karthikeyan Vijayakumar](https://www.youtube.com/channel/UCUABQE89pVvAHEgCRYWrGyg),
  <https://www.youtube.com/playlist?list=PLHTHCZPMDRMlnEYaQHhcFaEieKFvs7sdq>;
  each node links to its own video.
