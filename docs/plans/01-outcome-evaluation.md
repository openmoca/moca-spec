# Plan 01 — Outcome evaluation

**Status:** Ready to start
**Question:** Does MOCA metadata make an assistant's answers measurably
better? If a field does not help, it should leave the specification.

## Why this first

MOCA's value claim is that verifiable trust signals, validity windows and
evidence lead to better answers. That claim has not been tested. Counting
which fields a reference implementation reads would only reflect how that
implementation was written. Measuring outcomes does not.

## Design

**Corpus.** Openly licensed, multi-version content with real history, for
example a public policy or standard with several published versions, and an
open-source project's documentation across releases. Convert each version to
a package with `moca-convert`, add `relations`, validity windows and a sample
of review attestations. Carry the original source documents under `sources/`
with evidence selectors into them, and bind a subset of nodes to a small SKOS
concept scheme with the [ontology profile](../../profiles/ontology/moca-ontology-profile.md).

**Question set.** 200 questions with reference answers, written before the
runs, including:

- questions whose answer changed between versions (tests supersession and
  validity);
- questions answered by a node whose `stale_after` has passed;
- questions touching contested content;
- questions that need a precise citation;
- questions phrased in a domain's vocabulary rather than the text's own words
  (tests concept binding).

**Conditions.** The same model, retriever and prompt, varying only what the
retriever and model see:

| Condition | What is available |
| --- | --- |
| A | Plain text of all versions (the status quo). |
| B | OKF fields only. |
| C | Full MOCA citation records with the default retrieval policy. |
| D | As C, with sidecar chunk citations. |
| E | As C, with the concept filter from the ontology profile. |
| F | As D, run offline in-process on a constrained device: no network, the Reader's own lexical and dense-sidecar search, a small embedder. |

## Measures

| Measure | Definition |
| --- | --- |
| Answer accuracy | Graded against the reference answer. |
| Stale-answer rate | Answers that rely on superseded, out-of-force or stale content without saying so. |
| Citation precision | Share of citations that point at a passage that supports the claim. |
| Citation-verification rate | Share of answers whose every citation has `evidence[].verified: true` against the original inside the package. |
| Contest handling | Share of contested questions where the answer surfaces the conflict. |
| Cost | Authoring effort per package (including concept binding), and retrieval latency, on a server and on the device in condition F. |

## Decision rule

A field or feature stays in core when it improves at least one measure with a
clear margin and does not hurt another. Features that do not are moved to a
profile or removed in the next minor version, recorded as an ADR.

The ontology profile stays Draft unless condition E beats condition C on
answer accuracy or citation precision
([ADR-0009](../adr/0009-ontology-profile.md)).

When the first host running the evaluation is also a MOCA maintainer's
project, an outside reviewer checks the question set, the grading and the
report before it is published.

## Output

A public report and the harness in its own repository, so others can rerun it
on their own content.
