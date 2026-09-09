# 0001 — MOCA as a specification vs. OKF bundles as OCI artifacts

- **Status:** Proposed
- **Date:** 2026-09-09
- **Deciders:** MOCA maintainer (see [GOVERNANCE.md](../../GOVERNANCE.md#current-model))
- **Supersedes:** —

## Context

MOCA currently specifies its own package format end to end: a manifest
([core §5.1](../../spec/moca-core-spec.md#51-manifest-properties)), a canonical
digest ([§5.5](../../spec/moca-core-spec.md#55-canonical-package-digest)), a
signature envelope and trust model
([trust model](../../spec/moca-trust-model.md)), a composition mechanism
([§10](../../spec/moca-core-spec.md#10-package-composition--relationships)), a
profile mechanism ([§11](../../spec/moca-core-spec.md#11-profiles)), and a
content model ([§7](../../spec/moca-core-spec.md#7-grounded-content-nodes-claims--evidence-locators)).

Two things have changed since that scope was set.

**First, the content model is contested territory and MOCA is losing it.** The
Open Knowledge Format v0.2, published by Google, occupies the same ground —
Markdown plus YAML frontmatter for AI-consumable knowledge — with materially
more community weight. [Plan 01](../plans/01-okf-v0.2-conformance.md) proposes
conceding it outright: `content/` becomes a conformant OKF bundle, and the
MOCA node fields OKF duplicates are deprecated. If that lands, MOCA's remaining
distinct surface is the *package*, not the content.

**Second, if the package is the product, then the package format has to justify
itself against the incumbent.** The OCI ecosystem — image manifests, artifact
manifests with custom `artifactType`, image indexes, the referrers API, cosign,
and a registry in every cloud — solves content-addressed, signed, composable
artifact distribution. It is deployed at a scale MOCA will not approach, and
much of it maps onto what MOCA specifies by hand.

This ADR asks the uncomfortable question directly, before
[plan 01](../plans/01-okf-v0.2-conformance.md) hardens a specification that may
not need to exist in its current form: **is there anything in MOCA's
manifest, profile, and composition semantics that OCI plus existing tooling
does not already give you?**

A weak answer is a valid outcome. This record is written to be capable of
concluding that MOCA should shrink.

## Decision drivers

- **Honesty over sunk cost.** The specification is at `0.1.0-beta.1`. It is
  cheaper to shrink it now than after SDKs exist in three languages
  ([ROADMAP item 7](../../ROADMAP.md#7-core-sdks-across-languages)).
- **Maintenance surface.** A solo maintainer
  ([GOVERNANCE.md](../../GOVERNANCE.md#current-model)) currently owns a bespoke
  signing and trust model. Every line of it is a line cosign already maintains.
- **Adoption cost for consumers.** "Pull it with any OCI client" is a much
  shorter sentence than "implement the SDK contract."
- **The gap MOCA itself admits.**
  [§10.4](../../spec/moca-core-spec.md#104-what-core-does-not-specify)
  explicitly declines to specify resolution and distribution — the exact
  problem registries solve.
- **Storage independence**
  ([§4.1](../../spec/moca-core-spec.md#41-storage--transport-independence)) is
  a stated principle: Zip, directory, or database shred. It is not obviously
  compatible with being registry-shaped.

## Considered options

1. **Status quo** — MOCA specifies its own manifest, digest, signing, and
   composition; OCI is not referenced.
2. **Replacement** — retire the MOCA specification. Ship OKF-conformant
   bundles as OCI artifacts with a custom media type, signed with cosign,
   composed with image indexes. MOCA becomes, at most, an OKF profile plus a
   packaging convention.
3. **Hybrid** — MOCA keeps the manifest and semantics; OCI becomes a
   *supported transport binding*. `moca.json` maps to an OCI artifact manifest
   with `artifactType: application/vnd.moca.package.v1+json`; cosign is
   documented as a signing mode alongside DSSE; `composition.members` gets a
   documented lowering onto image indexes or the referrers API.

## Capability comparison

Marked against what each actually provides today, not what it could.

| Capability | OCI + cosign + image index | MOCA today |
|---|---|---|
| Content addressing | Digest-native, per-layer, universally tooled | [§5.5](../../spec/moca-core-spec.md#55-canonical-package-digest) RFC 8785 + SHA-256 |
| Signing | cosign — mature, keyless, widely deployed | [trust model](../../spec/moca-trust-model.md) — Sigstore/DSSE, reimplements cosign's model |
| Transparency log / revocation | Rekor, integrated | [trust model §7](../../spec/moca-trust-model.md#7-revocation) — host policy, hand-rolled |
| Registry and distribution | Every cloud runs one | **Absent — [§10.4](../../spec/moca-core-spec.md#104-what-core-does-not-specify) declines to specify it** |
| Version resolution | Tags plus digests, with real resolvers | **Absent — [§10.4](../../spec/moca-core-spec.md#104-what-core-does-not-specify) recommends but does not mandate semver ranges** |
| Composition | Image index, referrers API | [§10](../../spec/moca-core-spec.md#10-package-composition--relationships) `members` + `relates` |
| Typed relationships | `subject` + `artifactType` only — untyped in practice | Open `relationship` vocabulary: `supersedes`, `conflictsWith`, `amends` |
| Partial understanding | Unknown media types are opaque blobs | [§11.2](../../spec/moca-core-spec.md#112-graceful-degradation) — a *specified consumer obligation* |
| Storage independence | Registry-shaped by definition | [§4.1](../../spec/moca-core-spec.md#41-storage--transport-independence) — Zip, directory, or DB shred |
| Content semantics | Blobs | [§7](../../spec/moca-core-spec.md#7-grounded-content-nodes-claims--evidence-locators) — but after plan 01 this is OKF's, not MOCA's |

### Where OCI plainly wins

Four rows above are not close. OCI has registries, distribution, resolution,
and a signing stack that MOCA either lacks entirely or reimplements. The trust
model is the sharpest case: it is a careful, well-written document that
describes, in about two hundred lines, a subset of what cosign does — and it
already cites `cosign` twice as the reference behaviour it is matching
([trust model §4.1](../../spec/moca-trust-model.md#41-sigstore-mode)). That is
not a differentiator. That is a maintenance liability wearing one.

### The genuinely MOCA-only residue

Four things survive scrutiny. They are narrower than the current specification
implies, and each needs to be weighed on its own.

**1. The digest covers canonicalised semantic content, not archive bytes.**
An OCI digest is over the blob. Repack the same package with a different Zip
implementation, a different file order, or a different timestamp, and the
digest changes. MOCA's
[§5.5](../../spec/moca-core-spec.md#55-canonical-package-digest) digest is over
an RFC 8785 canonicalisation of the manifest plus per-resource content digests,
so it survives repacking and is stable across the three storage forms in
[§4.1](../../spec/moca-core-spec.md#41-storage--transport-independence). This
is real and it is not something OCI can be configured into. Its weight depends
entirely on whether anyone actually needs a package identity that survives
transport-format changes — which is a question the
[plan 04 instrumentation](../plans/04-converter-first-core-audit.md) can
partially answer.

**2. Composition carries meaning, not just structure.** An OCI image index
says "these artifacts are related." It cannot say *how*. MOCA's
[§10.2](../../spec/moca-core-spec.md#102-compositionrelates--loose-reference-relates-to)
distinguishes `supersedes` from `amends` from `conflictsWith`, and treats
`conflictsWith` as informative rather than an error — surfacing the tension and
leaving arbitration to the harness. Encoding that in OCI means inventing
annotations, at which point the semantics live in MOCA's specification again
and OCI is only carrying them.

**3. Graceful degradation is a consumer obligation, not a convention.**
[§11.2](../../spec/moca-core-spec.md#112-graceful-degradation) *requires* a
consumer that does not recognise a profile to process the package as valid
Core. [§5.6](../../spec/moca-core-spec.md#56-spec-evolution) requires unknown
fields to be ignored rather than rejected. OCI has no equivalent contract: an
unrecognised media type is an opaque blob, and what a client does with it is
undefined. For a format whose whole premise is that knowledge outlives the
tooling that read it, a specified degradation contract is worth something.

**4. Storage independence is incompatible with being registry-shaped.**
A MOCA package is valid as a directory on disk, with no registry, no daemon,
and no network. That is the [§4.1](../../spec/moca-core-spec.md#41-storage--transport-independence)
promise and it is the reason
[`examples/level-1-bare`](../../examples/level-1-bare) is three lines of JSON
and one Markdown file. Option 2 trades that away.

### The territorial evidence from MIF

One external data point worth recording, because it was found while scoping
[plan 03](../plans/03-mif-interoperability.md). MIF — a much smaller project,
also targeting OKF — shipped a "Container Profile" in v1.3.0: a single-file
`*.corpus.json` envelope for transporting a bundle or a subset of one.

It has an envelope. It does not define a canonical digest, a signature format,
a trust root model, or typed composition. So the field is independently
converging on "OKF needs a container," and MOCA's container is currently the
only one with integrity and trust attached. That supports the *thesis* — the
container is the defensible territory — while saying nothing about whether
MOCA's container should be bespoke or OCI-shaped. It is evidence for option 3,
not option 1.

## Decision outcome

**Proposed: option 3, the hybrid — with a scope reduction that option 3 as
usually stated does not include.**

MOCA keeps the manifest, the canonical digest, typed composition, profiles, and
graceful degradation. It adds OCI as a specified transport binding. And it
**stops specifying its own trust model as a first-class mechanism**, demoting
it to one of two documented signing bindings, with cosign-over-OCI as the
other.

The reasoning: of the four surviving differentiators, three (canonical digest,
typed composition, degradation contract) are *manifest semantics* and survive
any transport. The fourth (storage independence) is actively destroyed by
option 2. None of them require MOCA to own signing, distribution, or
resolution — the three areas where the comparison is most lopsided.

Concretely, this means:

- `moca.json` gains a documented lowering to an OCI artifact manifest with
  `artifactType: application/vnd.moca.package.v1+json`, without becoming one.
- `composition.members` gains a documented lowering onto image indexes; the
  typed `relates` vocabulary is carried as annotations, and the specification
  notes plainly that an OCI-native consumer will not understand it.
- The [trust model](../../spec/moca-trust-model.md) is reframed as *bindings*:
  `dsse` for offline and airgapped use, `sigstore`/cosign for registry use.
  Any part of it that merely restates cosign behaviour is deleted and cited
  instead.
- [§10.4](../../spec/moca-core-spec.md#104-what-core-does-not-specify)'s refusal
  to specify resolution stops being a gap and becomes a delegation: OCI
  registries are the specified answer for anyone who wants one, and the
  filesystem remains the answer for anyone who does not.

### What would change this decision

Stated up front so the ADR can be falsified rather than defended:

- If the [plan 04](../plans/04-converter-first-core-audit.md) instrumentation
  shows a harness reads almost none of the manifest, differentiators 1–3 are
  theoretical and option 2 becomes correct.
- If no adopter ever needs a package outside a registry, differentiator 4
  evaporates and option 2 becomes correct.
- If typed composition turns out to be unused in practice — if every real
  package uses `members` and nobody uses `relates` — differentiator 2 goes with
  it.

Two of those three are measurable by plan 04. That is a further argument for
running plan 04 early, and against treating this ADR as settled.

## Consequences

**Positive.** A materially smaller specification to maintain and to implement
an SDK against. Distribution and resolution are answered rather than deferred.
The signing surface shrinks to a binding document. The remaining specification
says something OCI does not, which makes "why not just use OCI?" answerable in
a sentence instead of an essay.

**Negative.** The OCI binding is new specification work not currently on
[ROADMAP.md](../../ROADMAP.md), and it adds a dependency on an ecosystem with
its own release cadence. Reframing the trust model is a breaking change to a
document that only just shipped
([ROADMAP delivered item 6](../../ROADMAP.md#delivered)). And a hybrid is
harder to explain than either pure option — "MOCA is a manifest format with an
OCI binding" invites the follow-up this ADR exists to answer, every time.

**Neutral.** [Plan 01](../plans/01-okf-v0.2-conformance.md) is unaffected in
direction and mostly unaffected in scope: conceding the content model to OKF is
correct under all three options. What changes under option 3 is how much of
[§7](../../spec/moca-core-spec.md#7-grounded-content-nodes-claims--evidence-locators)
is worth keeping afterwards, which is
[plan 01's open question 1](../plans/01-okf-v0.2-conformance.md#open-questions).

## Open questions

1. Does the OCI binding belong in the core specification, or in a separate
   `spec/moca-oci-binding.md`? A separate document keeps
   [§4.1](../../spec/moca-core-spec.md#41-storage--transport-independence)'s
   transport neutrality honest — OCI would be one binding among Zip and
   directory, not a promotion.
2. Does `artifactType: application/vnd.moca.package.v1+json` need registration
   with IANA, and does that block anything?
3. Can [§5.5](../../spec/moca-core-spec.md#55-canonical-package-digest)'s
   canonical digest be carried as an OCI annotation such that cosign's
   signature transitively covers it, or does the digest need re-signing per
   transport? This is the load-bearing technical unknown in option 3.
4. Is `relates` actually used? If it is dead weight, differentiator 2 is
   weaker than argued above.
