# Composition Relates Example

Demonstrates `composition.relates` (core §12.2): typed, non-hierarchical
associations between independent packages, as opposed to
[../composition-members](../composition-members)'s containment shape.

- [document-current/](document-current) — the current policy document,
  declaring `relates` entries with `crossReferences` (pointing at a
  document not included in this example) and `supersedes` (pointing at
  [document-prior/](document-prior)).
- [document-prior/](document-prior) — an older, independent document. It is
  fully valid and useful on its own; it does not declare anything about
  being superseded (direction is one-way, from the newer document).

`conflictsWith` is not demonstrated here, but would use the same shape.
