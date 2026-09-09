# Policy corpus (use-case example)

Two Level 1 packages representing the same policy at two points in time.

The problem it addresses: "what is our data-retention period?" has one correct
answer and at least one dangerously plausible wrong one — the previous
version. A retrieval system that flattens both into a single corpus will
sometimes return the superseded figures, and will have no way to signal that
it did.

What it demonstrates:

- **A version is a package, not a revision.**
  [policy-v1](policy-v1) and [policy-v2](policy-v2) have distinct `id`s and
  their own `validFrom`. The superseded version stays independently readable,
  which is what makes it auditable — you can still show what the policy *was*
  on a given date.

- **Two complementary ways to say "replaced".** `policy-v2` declares the
  manifest-level `supersedes` field *and* a `composition.relates` entry with
  `relationship: "supersedes"`. The first is lifecycle metadata; the second
  makes the relationship part of the package-to-package graph a harness
  traverses.

- **`epistemicStatus: deprecated`** on the v1 content node, so a consumer that
  loads both packages has a per-node signal and not just a manifest-level one.

```sh
npx @openmoca/moca-lint lint examples/use-cases/policy-corpus/policy-v1
npx @openmoca/moca-lint lint examples/use-cases/policy-corpus/policy-v2
```
