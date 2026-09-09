# Plans

Working documents for changes that are too large to describe in a single issue.
Each plan states what will change, what it breaks, and what it costs — in
enough detail that the resulting Spec Change Proposal issues can be filed
without redoing the analysis.

Plans are **not normative and not commitments**. The normative documents are in
[`spec/`](../../spec); committed direction is in
[ROADMAP.md](../../ROADMAP.md). A plan is the analysis that sits between the
two.

## How a plan is used

1. The plan is written and reviewed here.
2. Its issue drafts in [`issues/`](issues) are filed against the repository
   using the templates in
   [`.github/ISSUE_TEMPLATE/`](../../.github/ISSUE_TEMPLATE), per
   [CONTRIBUTING.md](../../CONTRIBUTING.md#proposing-a-core-spec-change). The
   drafts use each template's exact section headings so they paste in
   unchanged.
3. Discussion happens in the issue, not in this file. **Where a plan and its
   issue disagree, the issue is current** — plans are snapshots of the
   proposal, not a running record of the debate.
4. Once the resulting PRs merge, the plan is deleted. What shipped is recorded
   in [CHANGELOG.md](../../CHANGELOG.md), and behaviour changes affecting
   existing packages in [MIGRATIONS.md](../../MIGRATIONS.md). A plan that
   outlives its change becomes a second, stale source of truth.

## Current plans

These four are one body of work with a single thesis: **MOCA's differentiator
is package and container semantics, not a content model.** Signed, versioned,
composable knowledge artifacts — canonical digests, DSSE/Sigstore signing,
`composition`, `augmentation`, profile-based graceful degradation — are
territory MOCA can hold. A Markdown frontmatter vocabulary is not, because the
Open Knowledge Format already occupies it with Google behind it.

| # | Plan | Effort |
|---|---|---|
| [01](01-okf-v0.2-conformance.md) | OKF v0.2 conformance as a Level 1 MUST, and deprecation of the node fields OKF already owns | 8–12 d |
| [02](02-skills-to-agent-skills-profile.md) | Move the Agent Skills vocabulary out of Core into a profile, keeping the security boundary in Core | 3–5 d |
| [03](03-mif-interoperability.md) | A MIF interoperability profile and a bidirectional `moca-convert` adapter | 6–9 d |
| [04](04-converter-first-core-audit.md) | Build the SCORM → MOCA → harness → xAPI chain first, and use its instrumentation to decide what Core keeps | 15–25 d |

Sequencing, dependencies, and the gating ADR are in
[04-converter-first-core-audit.md](04-converter-first-core-audit.md#sequencing-across-all-four-plans).

## The gate

None of these should start before
[ADR-0001](../adr/0001-moca-spec-vs-oci-artifacts.md) is resolved. It asks
whether MOCA should be a specification at all, or an OKF profile plus OCI
transport. If the answer is the latter, plans 01–04 are hardening a
specification that should instead be shrinking, and their scope changes
materially.
