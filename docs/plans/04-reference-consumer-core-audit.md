# Plan 04 — Reference-consumer core boundary audit

**Status:** Draft, depends on [plan 01](01-okf-v0.2-conformance.md)
**Effort:** 13–21 days
**Breaking:** no directly — it *produces* deletion proposals

## Why

The Core/profile boundary question — which manifest and frontmatter fields
actually earn their place in Core — is currently answerable only by argument.
Everyone involved has an opinion about whether `entryConcepts` or
`epistemicStatus` or node-level `validFrom` is load-bearing, and nobody has
data.

This plan replaces the argument with a measurement. Build a minimal,
domain-neutral **reference AI Harness** on the .NET
[Knowledge Harness](../architecture.md#pillar-2-the-knowledge-harness), run it
end to end against real multi-package content, and have the Knowledge Harness
log every manifest and frontmatter field it actually reads at runtime. **Any
field never touched after a full run is a concrete deletion or
demotion-to-profile candidate.**

The secondary benefit is that this is the first end-to-end proof MOCA has. The
run exercises conversion, composition, profiles, Knowledge Harness
consumption, and AI Harness grounding in one pass — which is
[ROADMAP item 11](../../ROADMAP.md#11-full-end-to-end-reference-example),
pulled forward and given a second job.

## Why the instrumentation lives in the Knowledge Harness

Under the [three-pillar model](../adr/0002-three-pillar-architecture.md), every
read of a manifest or frontmatter field goes through the Knowledge Harness. The
AI Harness asks for knowledge; it does not parse packages. Instrumenting the
Knowledge Harness therefore sees every field access from any AI Harness built
on it, not only from this plan's reference consumer. It also makes the
instrumentation a permanent feature rather than a throwaway spike: any future
AI Harness can contribute a coverage report.

## Why this ordering

Three Knowledge Harness implementations written against a Core that is about to
lose several
[§7](../../spec/moca-core-spec.md#7-grounded-content-nodes-claims--evidence-locators)
fields is wasted implementation effort, tripled. The .NET implementation is the
first of the three
([ROADMAP item 7](../../ROADMAP.md#7-knowledge-harness-implementations)), and it
has to exist for this plan anyway. Measuring with it before starting Python
and TypeScript settles the specification's scope against a real consumer
**before** it is implemented twice more.

## Milestones

| # | Output | Effort |
|---|---|---|
| M1 | Source real, openly licensed, multi-part content; inventory every field it carries | 1–2 d |
| M2 | Convert it with `moca-convert`: one package per part plus a composing package via `composition.members`, and a versioned policy set using `composition.relates` / `supersedes` | 3–5 d |
| M3 | **Field-access instrumentation** in the .NET Knowledge Harness, with a coverage report | 2–3 d |
| M4 | Minimal reference AI Harness on the .NET Knowledge Harness | 4–6 d |
| M5 | Capability coverage check: every capability exercised or recorded as untested | 1–2 d |
| M6 | Full run → untouched-field report → deletion proposals | 2–3 d |

### M1 — real content, not a fixture

The examples under [`examples/`](../../examples) are fixtures: each exercises
the fields its author already believed in, which is exactly the bias this plan
exists to remove. Use real, published content with genuine structure — for
example, an open-source project's documentation set split into several
independently useful parts, plus several published versions of one policy or
standard. It must be openly licensed, genuinely multi-part, and carry real
metadata rather than defaults.

### M2 — conversion and composition

One package per part plus a composing package using
[`composition.members`](../../spec/moca-core-spec.md#101-compositionmembers--containment-part-of),
and a policy set where each version is its own package linked with
[`composition.relates`](../../spec/moca-core-spec.md#102-compositionrelates--loose-reference-relates-to).
`moca-convert`'s existing Markdown and directory adapters cover the first; the
second may need light manual authoring, which is recorded as a converter gap.

Note the digest consequence:
[§5.5](../../spec/moca-core-spec.md#55-canonical-package-digest) requires each
member to resolve to a concrete version whose own `canonicalDigest` folds into
the parent's, failing closed if a member cannot be resolved. Generated
multi-package content is the first real test of that path.

### M3 — the instrumentation

The actual deliverable. The Knowledge Harness wraps manifest and frontmatter
access so every key read at runtime is logged with its access path, then emits
a coverage report over the full field inventory from
[§5.1](../../spec/moca-core-spec.md#51-manifest-properties) and
[§7.1](../../spec/moca-core-spec.md#71-commonmark-knowledge-nodes-content).

Three buckets, and the distinction between the second and third is what keeps
the report honest:

- **Read** — the Knowledge Harness used it on behalf of some AI Harness.
- **Not read, but exercised** — the code path ran and did not need the field.
  A genuine deletion candidate.
- **Not read, not exercised** — no code path touched this capability. Proves
  nothing; a gap in M4 or M5, not evidence about the field.

### M4–M5 — the reference AI Harness

A minimal, domain-neutral assistant: ask questions of the composed package,
get answers grounded in content and evidence locators, and apply a simple
trust policy — prefer `verified`, flag `disputed`, warn on content past its
`lastReviewed` date, and answer only from the policy version in force. It does
not need to be good. It needs to be *complete enough that every field Core
defines has a fair chance of being read*.

That last point is the methodological crux. An AI Harness that never asks for
a localised answer will never cause `locales` to be read, which proves nothing
about `locales`. M5's acceptance criterion is therefore coverage of
*capabilities*, not answer quality: locale resolution, composition traversal,
integrity verification, signature verification, profile degradation, evidence
resolution, and each Knowledge Harness search mode available at the time must
each be exercised at least once, or the report must record them as untested
rather than as unused.

### M6 — the report

Untouched fields become Spec Change Proposal issues, one per field or coherent
group, following
[CONTRIBUTING.md](../../CONTRIBUTING.md#proposing-a-core-spec-change).

## Methodological limits

Stated here so the report cannot be over-read, and repeated in the report
itself:

- **One AI Harness, one corpus.** A field this assistant never reads may be
  load-bearing for a compliance consumer. Cross-check every candidate against
  [`profiles/eu-ai-act/`](../../profiles/eu-ai-act) and
  [`examples/use-cases/`](../../examples/use-cases) before proposing deletion.
- **The report produces candidates, not verdicts.** Each still goes through
  issue → PR with its own argument.
- **Absence of use is not absence of value.** `supersedes` and `validFrom`
  earn their place at audit and provenance time, not at retrieval time. A
  retrieval-shaped AI Harness may never read them, and that is not evidence
  against them.
- **The instrumentation measures the post-[plan 01](01-okf-v0.2-conformance.md)
  field set.** Running it earlier measures fields that are already scheduled
  for deprecation.

## Where this work lives

[ROADMAP.md](../../ROADMAP.md#where-this-work-lives) puts Knowledge Harness
implementations, the reference AI Harness, and the end-to-end demonstration
**outside this repository**, "because they carry third-party dependency
surfaces and release cadences the specification should not inherit."

- M3 lives in `openmoca/moca-knowledge-harness-dotnet`.
- M4 and M5 live in `openmoca/moca-example-end-to-end`.
- M2's converter gaps belong here, in [`tools/moca-convert`](../../tools/moca-convert).

What comes back into `moca-spec` is the M6 report and its issues — data and
proposals, not dependencies.

## ROADMAP.md changes — applied

The roadmap already reflects this plan:

- **[Item 7](../../ROADMAP.md#7-knowledge-harness-implementations)** —
  Knowledge Harness implementations, .NET first, then Python, then TypeScript.
- **[Item 8](../../ROADMAP.md#8-reference-ai-harness)** — the reference AI
  Harness, with the field instrumentation in the Knowledge Harness and the
  three-bucket reporting distinction.
- **[Item 9](../../ROADMAP.md#9-core-boundary-audit)** — this audit, run
  against real content.
- **[Where this work lives](../../ROADMAP.md#where-this-work-lives)** and
  **[Open decisions](../../ROADMAP.md#open-decisions)** — the ADR-0001
  question, whether `epistemicStatus` survives OKF conformance, and whether
  MOCA continues to define a content model at all after the audit.

## Sequencing across all four plans

```
ADR-0001 (2-3 d) ─────────┐   gate: a "shrink MOCA" outcome rescopes everything below
                          ▼
plan 01  OKF conformance (8-12 d) ──┬──> plan 02  skills → profile (3-5 d)
                                    │
                                    ├──> plan 03  MIF interop (6-9 d)
                                    │
                                    └──> plan 04  reference-consumer audit (13-21 d)
```

- **[ADR-0001](../adr/0001-moca-spec-vs-oci-artifacts.md) first, as a real
  gate.** If its outcome is that MOCA should be an OKF profile plus OCI
  transport, plan 01 is hardening a specification that should be shrinking.
  Writing the ADR afterwards would sequence the answer behind the commitment.
- **[Plan 01](01-okf-v0.2-conformance.md) next**, because 03 and 04 both
  consume it.
- **[Plan 02](02-skills-to-agent-skills-profile.md) in parallel with 01** —
  disjoint specification sections, except that both edit the
  [§3](../../spec/moca-core-spec.md#3-conformance-levels) table, so land 01's
  §3 change first.
- **Plans 03 and 04 after 01.** Plan 04 is the long pole and the least
  reversible, which is a further argument for the ADR gate. Its M3 can start as
  soon as the .NET Knowledge Harness reads packages.

**Total: 32–50 days**, dominated by this plan.

## Open questions

1. **Which content?** It needs to be openly licensed, genuinely multi-part,
   and carry real metadata rather than defaults. Sourcing may be the actual M1
   difficulty.
2. **Is one corpus enough?** Two corpora from different authoring tools would
   materially strengthen the report. Adds three to five days.
3. **Does the reference AI Harness need a model at all for the audit?** A
   scripted question set with deterministic retrieval would exercise the same
   Knowledge Harness paths more reproducibly. A model is still needed for the
   end-to-end demonstration.
