# Machine-made content

A package can say which parts a machine made, such as a transcript or a
summary, with which model, and which of those parts a person checked. These
are **declarations** by whoever made the package. A Reader carries them to
every citation; it does not detect machine-made content, and the absence of a
mark proves nothing
([package spec §4.14](../../spec/moca-package-spec.md#414-terms), "Machine-made
content").

## Mark a part a machine made

Use OKF's `generated` in the node's frontmatter. `model` is optional: the
model's name and version, as one string.

```yaml
---
type: Transcript
title: The lantern, transcribed
generated:
  by: example-transcriber/2.0
  at: 2026-11-20T09:00:00Z
  model: example-speech-model-large-v3
---
```

A file with no frontmatter of its own, such as a WebVTT transcript, is marked
on the `sources` entry that names it, with the same `generated`.

## Mark a part a person checked

Machine-made content a person has checked keeps `generated` and adds OKF
`verified`:

```yaml
generated:
  by: example-transcriber/2.0
  at: 2026-11-20T09:00:00Z
  model: example-speech-model-large-v3
verified:
  - by: human:keeper
    at: 2026-11-20T12:00:00Z
```

Both reach the citation record, as `trust.generated` and
`trust.declaredVerified`
([Reader contract §7](../../spec/moca-reader-contract.md#7-citation-records)),
so an app can say "machine-made, checked by a person". `verified` is a
statement too. A signed review, which shows who checked these exact bytes, is
different, and is kept apart in `trust.attestedReviews`
([signing and review](signing-and-review.md)).

## Mixed authorship

The mark is per node. Where a person and a machine each wrote part of one
work, put each part in its own node and mark the machine's. For a
conversation with an AI assistant, that is one node per turn. A node marked
`generated` says it is machine-made as a whole.

## The original is never changed

The marks live in the package's own files (frontmatter and the manifest),
never in a creator's original media. Watermarks or content credentials a
creator puts in their own files are theirs, and a Reader neither reads nor
changes them.

## Beside other marks

- **IPTC digital source types.** A node marked `generated` with a `model`
  corresponds to `trainedAlgorithmicMedia`, and a package mixing such nodes
  with a person's work to `compositeWithTrainedAlgorithmicMedia`.
- **C2PA content credentials** in media files travel with the file,
  unchanged.

Both mappings are informative.

## Next

- [Credits and dates](credits-and-dates.md)
- [The creator's terms](creators-terms.md)
- [Trust and provenance](../trust-and-provenance.md)
