# 0031 — `datePublished` follows the W3C Publication Manifest, and is informative

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

Series releases are ordered and shown by the date they came out. MOCA had no
publication date: `validFrom` says when content is in force, which is a
different thing ([issue #10](https://github.com/openmoca/moca-spec/issues/10)).

## Options

1. Reuse `validFrom`.
2. A vendor key per producer.
3. `datePublished` in the manifest, as the W3C Publication Manifest
   (§4.7.1.8) and schema.org name it, and `moca.date_published` on nodes.

## Decision

Option 3 ([package spec §4.12](../../spec/moca-package-spec.md#412-publication-and-packaging-dates)).

- The value is a full date or an RFC 3339 date-time with an offset, like every
  other date here: stricter than the Publication Manifest's ISO 8601, so no
  time zone is guessed. A bad manifest value fails the schema (`M002`), as a
  bad `validFrom` does; a bad node value is `C005` and treated as absent.
- It is the date of first publication. There is no `dateModified`: version
  and digest say what changed.
- It is informative. It never changes retrieval, the validity window or the
  reading order, and a Reader never checks an order against dates.
- A node's date is its own; it never inherits the package's.

## Consequences

- The package result and citation records gain `datePublished`.
- A producer that orders a series by date still writes the order into
  `structure.ttl`.

## What would change this decision

A need to compare publication dates with the clock, for example embargoes.
That would be a validity rule, not this field.
