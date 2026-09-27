# Use cases

MOCA pays off when knowledge **crosses a boundary**: between organisations,
between teams, or between the people who own it and the systems that serve it.
Inside one team with one pipeline, plain OKF is usually enough.

## Vendor documentation shipped to customers

A software vendor publishes product knowledge that customers load into their
own assistants.

- The customer verifies the **publisher attestation** before loading.
- Each release is a new **version**; the new package `supersedes` the old, so
  customers' assistants stop quoting last year's behaviour.
- **Evidence** points at the exact paragraph of the release notes.

## A policy corpus

"What is our data-retention period?" has one right answer and several
plausible wrong ones.

- Each policy version is a package with a **validity window**; the default
  retrieval policy leaves out versions that are not in force.
- `supersedes` retires old versions without deleting them, so "what did the
  policy say in 2025?" still has an answer.
- A **review attestation** from the policy owner is attached to the nodes they
  checked. See [`examples/policy-corpus`](../examples/policy-corpus).

## Customer support knowledge

Support answers drift and get rewritten by AI drafting tools.

- OKF `generated` marks drafted content; a support lead's **review
  attestation** marks what a person actually checked.
- `stale_after` forces re-review; `audience: internal` keeps agent-only
  procedures out of the public assistant.
- See [`examples/support-kb`](../examples/support-kb).

## A platform team's handbook

A platform team composes per-service guides into one handbook.

- The handbook lists **members pinned by digest**, so every product team loads
  exactly the same chapters, and a changed chapter is detected, not silently
  mixed in. See [`examples/handbook`](../examples/handbook).

## Field service, offline

Technicians need the current procedure on site with no connection.

- A `.moca` file with a **sidecar index** runs on a laptop with lexical search:
  no model, no database, no network.
- `supersedes` and validity windows stop a withdrawn procedure being used.

## Regulated systems

An organisation must show which knowledge its assistant used and where it came
from.

- Record the **package digest** with every answer: it names the exact content.
- Keep the originals under `sources/`, so each citation can be matched
  against its source. For dataset-level governance records, link an SPDX 3.0
  Dataset or Croissant document; risk classification stays with the AI
  system, not the package.

## Where MOCA is a poor fit

- **Live operational data** such as tickets, stock levels or metrics. Query the
  system of record.
- **One team, one pipeline, no one asking where an answer came from.** Use OKF
  on its own.
- **Anything that needs configuration to travel with content.** Packages never
  configure their readers.
