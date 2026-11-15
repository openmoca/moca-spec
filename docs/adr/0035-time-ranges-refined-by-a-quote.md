# 0035 — A time range can be refined by the words spoken in it

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A time range in audio or video matched when it overlapped a cue and ended
within the media ([ADR-0029](0029-media-is-described-never-fetched.md)). That
says the range is real, not that the cited words are spoken in it. An app
that plays a citation, or quotes it, wants both, and the exact moment
([issue #10](https://github.com/openmoca/moca-spec/issues/10)).

## Options

1. A new evidence key for the spoken words.
2. W3C Web Annotation's `refinedBy`: a `TextQuoteSelector` inside the
   media time range, checked against the cues the range covers.

## Decision

Option 2 ([Reader contract §7](../../spec/moca-reader-contract.md#7-citation-records)).

- The quote is checked against the payloads of the cues the range overlaps,
  joined with LF. Each run of white space counts as one space, in the cues
  and in the quote, because caption line breaks fall anywhere. Only refined
  quotes are compared this way; every other quote keeps exact matching.
- Both must match for `matched` to be `true`. A range that matches with the
  words spoken elsewhere does not match: the claim is that they are spoken
  in that range.
- `located` gives the cue-precise span of the words: the shortest of several
  occurrences, the earliest on a tie. Through an alternate, the range is
  checked on its reference and `located` comes back on the alternate's
  timeline.
- A `refinedBy` of another type is not checked; the range is checked alone.

## Consequences

- Citation records gain `evidence[].located`. The corpus compares it
  (`expect.evidenceLocated`).
- Existing time ranges are checked as before.

## What would change this decision

A need to locate words to finer than a cue, which would need word timings
the WebVTT files do not carry.
