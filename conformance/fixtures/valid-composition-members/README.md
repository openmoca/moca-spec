# Composition Members Example

Demonstrates `composition.members` (core §10.1): a course package that
contains no content of its own beyond structure, referencing two ordinary
module packages.

- [course/](course) — composition-only package (`composition.members`
  only, no `content/`). This is valid Level 1 per the amended floor in
  core §3: a package MAY satisfy Level 1 with either at least one
  CommonMark file under `content/`, or a `composition` block referencing
  at least one other package.
- [module-1/](module-1) and [module-2/](module-2) — ordinary, independent
  Level 1 packages with real content. Each is fully valid and useful on
  its own; neither declares any relationship back to the course
  (composition is parent → children only, per core §10.1).

Core does not specify how a harness resolves `composition.members[].id` to
an actual package (local file, registry, database record) — here it is
simply a sibling directory, which is one valid resolution strategy among
several, not a normative requirement.

The module and course manifests also demonstrate `canonicalDigest`: the
course folds in both member digests, so changing either module's digest changes
the course digest as well.
