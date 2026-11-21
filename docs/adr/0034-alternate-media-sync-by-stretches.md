# 0034 — Alternate media line up stretch by stretch

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Many podcasts are published as audio and as video. The two versions often
have different intros, and ad breaks that only one of them has, including
breaks in the middle. An app that plays one should be able to switch to the
other at the same moment, and evidence cited on one should be checkable
against the captions of the other
([issue #10](https://github.com/openmoca/moca-spec/issues/10)).

## Options

1. One `offset` per alternate. Simple, but right only when the versions
   differ before the content starts.
2. A `sync` list of stretches on the reference's timeline, `{ at, offset }`,
   each applying until the next, with `offset: null` for a stretch the
   alternate does not hold.
3. Alternates across nodes or packages, by reference.

## Decision

Option 2, within one node only
([package spec §5.7](../../spec/moca-package-spec.md#57-media),
[Reader interface §4](../../spec/moca-reader-interface.md#4-reading)).

- A description names its reference with `alternateOf`. The reference has
  no `alternateOf`, so there are no chains: every alternate is one step from
  the reference's timeline.
- A stretch holds its `at` and every time up to the next `at`. An ad break
  that only the reference has is a `null` stretch; one that only the
  alternate has is the gap between two stretches on the alternate.
- `at` values strictly increase, and stretches must not overlap on the
  alternate's timeline, so every moment maps one way at most. A sync that
  breaks either rule, or an `alternateOf` naming nothing, itself or another
  alternate, is `C005`, and the description stands on its own.
- A time range maps only within one stretch; its end may equal the
  stretch's last moment. A range across two stretches spans content the
  versions do not share, so it does not map.
- An alternate with no transcript of its own is checked through its
  reference's transcript, and that counts as checkable in the package.
- Each Reader offers `mapTime`, and the corpus tests it, so apps do not each
  write the arithmetic.

## Consequences

- Citation records carry `alternateOf` and `sync` in `node.media`; `sync` is
  explicit even when the node gave none.
- A video version needs no captions of its own for its citations to be
  checked.
- The conformance runner gains a `map-time` case kind.
- A video published in another package must be added as a source of the
  episode's node to be an alternate.

## What would change this decision

A need to align versions whose content differs within a stretch, such as
edits at another speed, or alternates that live in separate packages.
