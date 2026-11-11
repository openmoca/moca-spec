# 0016 — Audience filtering fails closed

- **Status:** Accepted
- **Date:** 2026-11-10
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A host can give the Reader an audience set, such as `public`, so that only
content for that audience reaches a model or a user. Up to 0.5, content with
no `moca.audience` label passed the filter, and the prose did not say what
happened to a malformed label or to a translation with no label of its own.
An author who forgot one label leaked a page to every audience.

## Options

1. Fail open: unlabelled content passes (the 0.5 behaviour).
2. Fail closed: unlabelled content is left out, with a host option to allow
   it.
3. A package-level default audience that unlabelled pages inherit.

## Decision

Option 2 ([Reader contract §8](../../spec/moca-reader-contract.md)).

- Under a host audience set, a node with no label is left out, unless the
  host sets `allowUnlabelled` (off by default). With it set, unlabelled
  content is searched alongside the allowed audiences.
- A malformed label (anything other than a non-empty string) never matches.
- A translation with no label of its own has the label of its
  default-language file.

A package-level default was considered and not wanted: it adds a second
place to look, and a mistake in it leaks a whole package.

## Consequences

- A missing label hides content rather than exposing it.
- Authors should label every page. Hosts that relied on unlabelled content
  passing must label it or set `allowUnlabelled`.
- Bindings and MCP servers apply the same rule to every record they hand on.

## What would change this decision

Evidence that hosts routinely need unlabelled content under an audience set,
and that `allowUnlabelled` is too coarse for them.
