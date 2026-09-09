# Support knowledge base (use-case example)

A Level 1 package shaped like a real customer-support corpus.

What it demonstrates:

- **`epistemicStatus` as a retrieval signal.** Three nodes carry three
  different values. `01-refund-window.md` is `verified` — a human confirmed
  it. `02-shipping-estimates.md` is `sourced` — traceable but not
  independently checked, and its `lastReviewed` date is five months older.
  `03-account-deletion.md` is `disputed`, because two teams disagree.

  A harness answering "how long do I have to return something?" should prefer
  the `verified` node, and should not present the `disputed` node as settled
  guidance without saying so.

- **Freshness that survives ingestion.** `lastReviewed` is per node as well as
  per package, so staleness is visible at the granularity that matters.

- **Concept binding without an ontology.** `concepts[]` uses `kb:` CURIEs
  declared in an inline `@context`. That is enough to group related nodes
  without committing to Level 2 and an ontology you would then have to
  maintain.

Nothing here requires more than JSON and Markdown tooling to read.

```sh
npx @openmoca/moca-lint lint examples/use-cases/support-kb
```
