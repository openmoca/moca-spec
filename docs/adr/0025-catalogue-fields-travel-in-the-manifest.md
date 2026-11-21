# 0025 — Images, translated titles and tags travel in the manifest

- **Status:** Accepted
- **Date:** 2026-11-14
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md))

## Context

A library or catalogue that lists packages needs an icon, a cover, a title in
the reader's language and a few tags. Until now each host kept these in its own
configuration, so the publisher's text and pictures did not travel with the
package and were not signed
([issue #7](https://github.com/openmoca/moca-spec/issues/7)).

## Options

1. Keep them outside the package, in each host's configuration.
2. Image URLs, and per-locale `title.<tag>` keys at the top level.
3. Optional manifest fields: `images` (files under `media/`), `translations`
   (keyed by declared locales) and `tags` (plain labels).

## Decision

Option 3 ([package spec §4.6–4.8](../../spec/moca-package-spec.md#46-images)).

- Images are package files, so the digest covers them. Only PNG, JPEG and WebP
  are allowed. A Reader checks the size and the first bytes, and never decodes
  an image. A Reader never fetches, so URLs are not allowed.
- `translations` is one map, keyed by the tags in `locales`, as the W3C
  incubation work does. The manifest's key set stays closed.
- Tags are readable labels. The firm link to a vocabulary is still the concept
  binding in `structure.ttl`.
- A problem with an image, a tag or a translated alt text is a warning
  (`M010`, `M012`, `M013`): the item is dropped and the package stays valid.
  A translation for an undeclared locale is an error (`M011`).
- An encrypted package may leave one copy of its cover readable, and may put
  `translations` and `tags` in its outline
  ([encrypted packages](../../spec/moca-encrypted-package.md)).

## Consequences

- The publisher's own text and pictures travel with the package and are signed.
  A host may still override them.
- Readers carry three more result fields and a new limit, `maxImageBytes`.
- Pixel sizes, shapes and missing alt text are checked by moca-lint, not by
  Readers.

## What would change this decision

A need for vector images that can be shown safely without a document
renderer, or catalogues that need more than icon and cover roles.
