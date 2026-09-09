# Plan 04 — Converter-first Core boundary audit

**Status:** Draft, depends on [plan 01](01-okf-v0.2-conformance.md)
**Effort:** 15–25 days
**Breaking:** no directly — it *produces* deletion proposals

## Why

The Core/profile boundary question — which manifest and frontmatter fields
actually earn their place in Core — is currently answerable only by argument.
Everyone involved has an opinion about whether `entryConcepts` or
`epistemicStatus` or node-level `validFrom` is load-bearing, and nobody has
data.

This plan replaces the argument with a measurement. Build
`SCORM/cmi5 → MOCA Education → AI Tutor Harness → xAPI` end to end against one
real course package, then instrument the harness to log every manifest and
frontmatter field it actually reads at runtime. **Any field never touched after
a full course run is a concrete deletion or demotion-to-profile candidate.**

The secondary benefit is that this is the first end-to-end proof MOCA has. The
chain exercises conversion, composition, profiles, harness consumption, and
export in one pass — which is
[ROADMAP item 11](../../ROADMAP.md#11-full-end-to-end-reference-example),
pulled forward and given a second job.

## Why this ordering, rather than SDKs first

Before this plan's roadmap change, [ROADMAP.md](../../ROADMAP.md) ran
documentation → SDK contract →
[item 7 Core SDKs](../../ROADMAP.md#7-core-sdks-across-languages) →
item 8 harness, with courseware import tooling buried inside the compliance
profiles item.

Three SDKs implemented against a Core that is about to lose several
[§7](../../spec/moca-core-spec.md#7-grounded-content-nodes-claims--evidence-locators)
fields is wasted implementation effort, tripled. The roadmap's own reasoning
supports reordering: it says the SDKs "are expected to *change the
specification*," which is an argument for settling the specification's scope
against a real consumer **before** writing three implementations of it.

The harness is the cheapest real consumer available, and it is already on the
roadmap. Building it early as a measurement instrument costs little beyond
instrumentation, and it de-risks the SDK work rather than delaying it.

## Milestones

| # | Output | Effort |
|---|---|---|
| M1 | Source a real SCORM 2004 or cmi5 course; inventory every manifest field it carries | 1–2 d |
| M2 | `moca-convert` SCORM adapter → one package per module plus a composing package via `composition.members` | 4–6 d |
| M3 | Education profile redesigned around `composition.members` | 2–3 d |
| M4 | Minimal AI tutor harness reading the composed package | 4–6 d |
| M5 | **Field-access instrumentation** and coverage report | 2–3 d |
| M6 | xAPI statement emission from harness events | 2–3 d |
| M7 | Full course run → untouched-field report → deletion proposals | 2 d |

### M1 — a real course, not a fixture

[`examples/augmentation-scorm2004`](../../examples/augmentation-scorm2004) is
explicitly "a fixture — the manifest demonstrates the shape, not a runnable
SCORM package." That is not sufficient input for an audit: a synthetic package
exercises the fields the author already believed in, which is exactly the bias
this plan exists to remove. Use a real published course.

### M2 — the converter

One package per module plus a composing package using
[`composition.members`](../../spec/moca-core-spec.md#101-compositionmembers--containment-part-of).
This is now [ROADMAP item 9](../../ROADMAP.md#9-courseware-converter-and-the-core-boundary-audit)
and it supersedes the per-module sidecar-augmentation workaround documented
in the [education profile §5](../../profiles/education/moca-education-profile.md#5-sidecar-augmentation-for-courseware).

Note the digest consequence:
[§5.5](../../spec/moca-core-spec.md#55-canonical-package-digest) requires each
member to resolve to a concrete version whose own `canonicalDigest` folds into
the parent's, failing closed if a member cannot be resolved. A generated
multi-package course is the first real test of that path.

### M3 — education profile redesign

Replace the flat `prerequisites` URN-array in
[education profile §4](../../profiles/education/moca-education-profile.md#4-learning-specific-manifest-data-profiledataeducation)
with `composition.members` ordering. Listed under
[ROADMAP item 12](../../ROADMAP.md#12-compliance-and-standards-profiles); this
plan gives it a forcing function rather than leaving it to wait.

### M4–M6 — the harness and xAPI

A minimal tutor: load the composed package, resolve members, retrieve content,
ground answers in evidence locators, emit xAPI statements for learner events.
It does not need to be good. It needs to be *complete enough that every field
Core defines has a fair chance of being read*.

That last point is the methodological crux. A harness that never attempts
localisation will never read `locales`, which proves nothing about `locales`.
M4's acceptance criterion is therefore coverage of *capabilities*, not quality
of tutoring: locale resolution, composition traversal, integrity verification,
signature verification, profile degradation, and evidence resolution must each
be exercised at least once, or the report must record them as untested rather
than as unused.

### M5 — the instrumentation

The actual deliverable. Wrap manifest and frontmatter access so every key read
at runtime is logged with its access path, then emit a coverage report over the
full field inventory from
[§5.1](../../spec/moca-core-spec.md#51-manifest-properties) and
[§7.1](../../spec/moca-core-spec.md#71-commonmark-knowledge-nodes-content).

Three buckets, and the distinction between the second and third is what keeps
the report honest:

- **Read** — the harness used it.
- **Not read, but exercised** — the code path ran and did not need the field.
  A genuine deletion candidate.
- **Not read, not exercised** — no code path touched this capability. Proves
  nothing; a gap in M4, not evidence about the field.

### M7 — the report

Untouched fields become Spec Change Proposal issues, one per field or coherent
group, following
[CONTRIBUTING.md](../../CONTRIBUTING.md#proposing-a-core-spec-change).

## Methodological limits

Stated here so the report cannot be over-read, and repeated in the report
itself:

- **One harness, one course, one domain.** A field an education tutor never
  reads may be load-bearing for a compliance consumer. Cross-check every
  candidate against [`profiles/eu-ai-act/`](../../profiles/eu-ai-act) and
  [`examples/use-cases/`](../../examples/use-cases) before proposing deletion.
- **The report produces candidates, not verdicts.** Each still goes through
  issue → PR with its own argument.
- **Absence of use is not absence of value.** `supersedes` and `validFrom`
  earn their place at audit and provenance time, not at retrieval time. A
  retrieval-shaped harness will never read them and that is not evidence
  against them.
- **The instrumentation measures the post-[plan 01](01-okf-v0.2-conformance.md)
  field set.** Running it earlier measures fields that are already scheduled
  for deprecation.

## Where this work lives

[ROADMAP.md](../../ROADMAP.md#where-this-work-lives) puts framework
integrations and the end-to-end demonstration **outside this repository from
the start**, "because they carry third-party dependency surfaces and release
cadences the specification should not inherit."

M4 and M6 honour that: the harness and the xAPI emitter live in their own
repository. M2 and M3 are converter and profile work and belong here. What
comes back into `moca-spec` is the M5 report and the M7 issues — data and
proposals, not dependencies.

## ROADMAP.md changes — applied

This plan is the one that edits [ROADMAP.md](../../ROADMAP.md). Those edits are
already in place, so the roadmap reflects the proposed direction; the plans
themselves are still drafts. What changed:

- **New "Now" subsection — "OKF conformance and the Core boundary"**, covering
  plans 01–03, placed ahead of the SDK work with the rationale above, and
  explicitly gated on [ADR-0001](../adr/0001-moca-spec-vs-oci-artifacts.md).
- **[Item 8, the generic AI harness](../../ROADMAP.md#8-generic-ai-harness)**
  gained the field-instrumentation requirement and the three-bucket reporting
  distinction, and now runs alongside item 9.
- **New [item 9, courseware converter and the core boundary audit](../../ROADMAP.md#9-courseware-converter-and-the-core-boundary-audit)**,
  promoted out of the compliance-profiles item — it is the audit's input, not a
  profile nicety. Later items renumbered 9–13 → 10–14 accordingly.
- **`agent-skills` and `mif` added** to
  [item 12](../../ROADMAP.md#12-compliance-and-standards-profiles)'s profile
  list, flagged as sharing the registration and versioning question without
  being compliance profiles.
- **[Where this work lives](../../ROADMAP.md#where-this-work-lives)** extended
  so the tutor harness and xAPI emitter fall under the existing out-of-repo
  rule.
- **Three new entries under
  [Open decisions](../../ROADMAP.md#open-decisions):** the ADR-0001 question,
  whether `epistemicStatus` survives OKF conformance, and whether MOCA
  continues to define a content model at all after the audit.

The Delivered / Now / Next / Later structure is preserved, and Open decisions
is added to rather than replaced.

## Sequencing across all four plans

```
ADR-0001 (2-3 d) ─────────┐   gate: a "shrink MOCA" outcome rescopes everything below
                          ▼
plan 01  OKF conformance (8-12 d) ──┬──> plan 02  skills → profile (3-5 d)
                                    │
                                    ├──> plan 03  MIF interop (6-9 d)
                                    │
                                    └──> plan 04  converter audit (15-25 d)
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
  reversible, which is a further argument for the ADR gate.

**Total: 34–54 days**, dominated by this plan.

## Open questions

1. **Which course?** Needs to be openly licensed, genuinely multi-module, and
   carry real metadata rather than defaults. Sourcing may be the actual M1
   difficulty.
2. **Does the harness live in `moca-spec` temporarily?**
   [ROADMAP.md](../../ROADMAP.md#where-this-work-lives) says its own
   repository; the instrumentation makes it briefly specification-critical.
   **Assumed own repository, report imported** — but a temporary in-repo
   `spike/` would be defensible if the coordination cost bites.
3. **Does instrumentation ship in the harness permanently**, or is it a
   throwaway spike? Permanent is more useful — it would let any future consumer
   contribute a coverage report — and it is more work.
4. **Is one course enough?** Two courses from different authoring tools would
   materially strengthen the report. Adds three to five days.
