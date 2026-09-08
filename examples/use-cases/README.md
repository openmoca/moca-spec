# Use-case examples

The packages under [examples/](../) are named by conformance level, which is a
specification author's way of organising them. These are named by the job they
do, which is how you probably think about your own content.

Both are plain Level 1 packages — no ontologies, no signatures, no index.

| Example | Demonstrates |
|---|---|
| [support-kb](support-kb) | `epistemicStatus` as a ranking signal (`verified` vs `sourced` vs `disputed`), `lastReviewed` freshness, concept binding without an ontology |
| [policy-corpus](policy-corpus) | Versioned policy as two independent packages, linked with `supersedes` and `composition.relates`, so the superseded text stays auditable |

See [docs/use-cases.md](../../docs/use-cases.md) for the wider discussion.
