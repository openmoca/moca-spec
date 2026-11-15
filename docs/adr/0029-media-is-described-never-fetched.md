# 0029 — Describe hosted media, never fetch it, and bound time ranges by it

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Podcast and video series content keeps its audio and video outside the
package: a media host serves the files. A node could name the file as a
source, but could not say what it is or how long it runs, and nothing tied
a citation of the media to the transcript in the package. Such evidence was
never checked, and it cost the package `self-contained-evidence`. A time
range was checked only by overlap with a cue, so `t=30,5000` matched a
37-second recording ([issue #10](https://github.com/openmoca/moca-spec/issues/10)).

## Options

1. Require the media inside the package.
2. Let a Reader fetch the media to check it.
3. A description of the media in `moca.media`: media type, duration, an
   optional SHA-256 and the transcript in the package. A Reader exposes it
   and never fetches the media.

## Decision

Option 3 ([package spec §5.7](../../spec/moca-package-spec.md#57-media),
[Reader contract §7](../../spec/moca-reader-contract.md#7-citation-records)).

- The description lives under `moca`, beside `evidence`, and names an OKF
  source by `id`, so it never collides with an OKF field.
- A Reader never fetches the media and never checks `duration` or `digest`
  against it. The description is covered by the digest, so a signed package
  vouches for which file it means; a host that downloads the file may compare
  it.
- A time range that cites the media is checked against the media's
  `transcript`. Evidence checked this way counts toward
  `self-contained-evidence`: the check runs on bytes in the package.
- A time range now matches only when it overlaps a cue and ends at or before
  the bound: the last cue's end, or the declared duration when later. A time
  range on media with no transcript stays unchecked, even with a duration:
  `matched` reports a check of package bytes, and a duration alone is a claim.
- Search reads the node, not its sources, so transcript text belongs in the
  node body too. A quote across cues includes the line break between them.

## Consequences

- Citation records gain `node.media`. Nodes gain `moca.media`; malformed
  descriptions are `C005` or `C006` and ignored.
- A time range that ran past the end of its transcript, and matched before,
  now does not (`C011`).
- Hosts can show media type and length, and check a download, without any
  Reader network access.

## What would change this decision

A need for Readers to verify hosted media themselves, which would need a
network rule this specification does not have.
