# Composition Members Example

Demonstrates `composition.members` (core §10.1): a handbook package that
contains no content of its own beyond structure, referencing two ordinary
chapter packages.

- [handbook/](handbook) — composition-only package (`composition.members`
  only, no `content/`). This is valid Level 1 per the amended floor in
  core §3: a package MAY satisfy Level 1 with either at least one
  CommonMark file under `content/`, or a `composition` block referencing
  at least one other package.
- [chapter-1/](chapter-1) and [chapter-2/](chapter-2) — ordinary, independent
  Level 1 packages with real content. Each is fully valid and useful on
  its own; neither declares any relationship back to the handbook
  (composition is parent → children only, per core §10.1).

Core does not specify how a Knowledge Harness resolves
`composition.members[].id` to an actual package (local file, registry,
database record) — here it is simply a sibling directory, which is one valid
resolution strategy among several, not a normative requirement.

The chapter and handbook manifests also demonstrate `canonicalDigest`: the
handbook folds in both member digests, so changing either chapter's digest
changes the handbook digest as well.
