# 0010 — Carrying the original sources is a capability a Reader can check

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A MOCA package can carry the original source files, not just knowledge written
about them:
- `sources/` sits inside the package and is covered by the digest;
- `moca.evidence` points into those files with W3C selectors, down to an exact
  quote or a PDF page.

OKF can reference sources, but it defines no packaging, so nothing guarantees
that the originals travel with the knowledge or arrive unchanged. This is
MOCA's clearest difference from OKF, and v0.2 never states it.

v0.2 also checks less than it appears to:
- `C006_EVIDENCE_SOURCE_UNKNOWN` only checks that an evidence source id exists
  in the node's `sources`;
- `C007_LINK_UNRESOLVED` catches a missing source file;
- nothing checks that a quoted passage is really in the file it cites.

## Options

1. Leave it as something the format allows.
2. Make it a derived capability, and check selectors against the in-package
   files.

## Decision

Option 2.

- **New capability: `self-contained-evidence`** ([package spec
  §11](../../spec/moca-package-spec.md#11-capabilities)). It is present when:
  - the package has `located-evidence`;
  - every evidence source in every node resolves to a file inside the package,
    under `sources/` or `media/`;
  - no `C007` or `C008` was raised for those files.
- **New diagnostic: `C011_EVIDENCE_SELECTOR_UNMATCHED`,** a warning. It is
  raised when a `TextQuoteSelector` quote does not occur in a text source file,
  or when a `TextPositionSelector` falls outside the file. No new code is added
  for a missing file, because `C007` already covers that.
- **Citation records gain `evidence[].verified`:**
  - `true`: the Reader checked the selector against the in-package file and it
    matched;
  - `false`: the Reader checked and it did not match;
  - absent: the Reader could not check, for example for a PDF or a source
    outside the package.

  Checks are exact matches on the file's UTF-8 text, with no whitespace
  folding. Only `text/plain` and `text/markdown` sources are checked in this
  version.

## Consequences

- "Why not just OKF?" has a one-sentence answer: OKF describes knowledge; MOCA
  ships it with its evidence, sealed.
- A citation can be checked against its original on a device with no network.
  A migrated package keeps its audit trail.
- The outcome evaluation gains a strong metric: the share of answers whose
  citations verify against the original.
- Adding a capability changes the expected capability sets in the conformance
  corpus for packages that already qualify.

## What would change this decision

Evidence that authors routinely cite sources that cannot legally travel with
the package. A variant that pins an external source by digest, without carrying
it, would then be worth defining.
