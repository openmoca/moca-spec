# Plan 03 — MIF interoperability profile and converter

**Status:** Draft, depends on [plan 01](01-okf-v0.2-conformance.md)
**Issue draft:** [profile-mif-interop.md](issues/profile-mif-interop.md)
**Effort:** 6–9 days
**Breaking:** no — purely additive

## Why

MIF (Modeled Information Format, `modeled-information-format/MIF`) is a
solo/small-team project that describes itself as "the opinionated,
OKF-compliant content model that fills OKF's deliberately empty envelope." It
defines entity types, typed relationships, bi-temporal validity, and
trust/provenance fields — the content model OKF deliberately omits.

It is worth **interoperating with**, not negotiating with. A profile plus a
converter is a one-to-two-week exercise. A standards liaison with a project of
this size is not a good use of the effort, and MOCA should not inherit MIF's
model.

There is also a strategic reason to look closely: MIF v1.3.0 shipped a
"Container Profile" for bundle transport, which is a move onto MOCA's
differentiated territory. That comparison is the most useful thing this plan
produces and is written up below.

## Verified facts about MIF

Checked against the published repository, because the details matter for the
mapping:

- **Current version 1.3.0** (2026-07-11). Not "~1.x" loosely — the Container
  Profile is specifically a 1.3.0 addition (ADR-021).
- **Pinned to OKF v0.1**, not v0.2. This is the sharpest interop hazard; see
  below.
- Three base knowledge types: `semantic` (declarative), `episodic`
  (time-bound), `procedural` (how-to).
- **Its own Levels 1/2/3** — Core / Standard / Full. These are *not* MOCA's
  conformance levels and the collision is purely nominal. The profile document
  must disambiguate in its opening paragraph or every reader will conflate them.
- `provenance.sourceType` and `provenance.trustLevel` sit at MIF Level 3
  (optional).
- `temporal` models bi-temporal validity: when recorded *and* when valid.
- Typed relationships include `Supersedes` and `ConflictsWith`.

## Scope

`profiles/mif/` — profile specification, `profile.schema.json`, one example
package — plus a **fifth adapter in the existing
[`moca-convert`](../../tools/moca-convert)**, not a new `tools/mif-convert/`.

`moca-convert` already has four working adapters (`directory`, `markdown`,
`obsidian`, `openapi`), auto-detection that
[refuses ambiguity rather than guessing](../../tools/moca-convert/lib/detect.js),
and a [fail-closed lint gate](../../tools/moca-convert/lib/write.js) that lints
output before writing anything. All of that is reusable. Adding a package would
duplicate it.

Export is the genuinely new part: `moca-convert` is import-only today, so
MOCA → MIF needs a new command path (`moca-convert export --format mif`) and
the write-side plumbing that goes with it.

## Mapping

| MIF | MOCA target | Notes |
|---|---|---|
| `conceptType`: `semantic` / `episodic` / `procedural` | node `type` | Direct and clean — and only possible because [plan 01](01-okf-v0.2-conformance.md) makes `type` required |
| `@id` (UUID identity) | frontmatter `id` | MOCA's `id` is a documented override of path identity |
| `title`, `description`, `tags` | OKF `title` / `description` / `tags` | Handled by OKF conformance, not by this profile |
| `entity`, `entities` | `claims[]` ([§7.4](../../spec/moca-core-spec.md#74-explicit-claims-graph-claims)) | Entity assertions become subject/predicate/object triples |
| `relationships` (typed) | `claims[]` node-scoped; `composition.relates` package-scoped | See below |
| `Supersedes`, `ConflictsWith` | `supersedes`, `conflictsWith` | **Already suggested values** in [§10.2](../../spec/moca-core-spec.md#102-compositionrelates--loose-reference-relates-to) — an unplanned exact match |
| `provenance.sourceType`, `provenance.trustLevel` | `profileData.mif` + OKF `sources[]` / `verified` | No lossless core home; profile data is correct here |
| `temporal` (bi-temporal) | `profileData.mif.temporal` | **Genuine expressiveness gap** — see below |
| `embedding` | dropped, or `.moca.idx` sidecar | Out of scope for the profile |
| MIF Levels 1/2/3 | *not* MOCA Levels 1/2/3 | Must be disambiguated explicitly |

### The relationship split is the interesting part

MIF puts typed relationships at the node level. MOCA has them at two levels:
`claims[]` for node-to-node assertions, `composition.relates` for
package-to-package association. A MIF relationship whose target is inside the
same bundle lowers to a claim; one whose target is another bundle lowers to a
`relates` entry. The converter has to decide per relationship, and the
round-trip has to preserve which choice it made — otherwise export produces a
different shape than import consumed.

### The bi-temporal gap is real

MOCA's [§7.5](../../spec/moca-core-spec.md#75-content-node-lifecycle-fields)
`validFrom` and `lastReviewed` are **single-axis**: they record one timeline.
MIF's `temporal` records two — when a fact was recorded, and when it was true.
There is no lossless core mapping, and `profileData.mif.temporal` is the
correct home rather than a workaround.

Worth noting for [plan 04](04-converter-first-core-audit.md): if bi-temporal
validity turns out to matter to real consumers, that is a candidate Core
addition rather than a permanent profile field. Do not decide it here.

### The OKF version fork

**MIF pins OKF v0.1. After [plan 01](01-okf-v0.2-conformance.md), MOCA pins
v0.2.** The v0.1 → v0.2 transition was breaking in exactly the fields this
converter touches:

- `timestamp` → `generated: {by, at}`
- a `# Citations` body list → a `sources` frontmatter block

So the adapter must **upgrade** v0.1 frontmatter on import and **downgrade** it
on export. Round-tripping is therefore lossy by construction, not by
implementation quality: `sources[].author`, `usage_count` and `last_modified`
have no v0.1 representation and are dropped on export.

The profile document must carry an explicit **round-trip fidelity contract**
naming exactly which fields survive MIF → MOCA → MIF and which do not. Without
it, "bidirectional converter" promises more than the format boundary can
deliver. A round-trip test fixture asserting the documented lossy set is part
of the deliverable, not a nice-to-have.

## The Container Profile overlap

MIF 1.3.0's Container Profile (ADR-021) defines `*.corpus.json`: an optional
single-file transport envelope serialising a bundle, or a subset of one, for
wire transport. That is transport and composition — MOCA's differentiated
territory.

The honest comparison, to be written into the profile document rather than
left as a private note:

| | MIF Container Profile | MOCA |
|---|---|---|
| Envelope | `*.corpus.json`, single JSON file | `.moca` Zip, directory, or DB shred ([§4.1](../../spec/moca-core-spec.md#41-storage--transport-independence)) |
| Integrity | No canonical digest defined | RFC 8785 + SHA-256, folding members transitively ([§5.5](../../spec/moca-core-spec.md#55-canonical-package-digest)) |
| Signing | — | Sigstore / DSSE over the digest ([trust model](../../spec/moca-trust-model.md)) |
| Composition | Subset extraction | `members` containment + typed `relates`, with cycle detection |
| Partial understanding | — | Specified graceful degradation ([§11.2](../../spec/moca-core-spec.md#112-graceful-degradation)) |

**Reading:** the differentiator holds on this axis. MIF has an envelope; MOCA
has a *trusted* envelope. Two independent projects converging on "OKF needs a
container" is evidence that the container is the right thing to be building —
and MOCA is the only one that has attached integrity and trust to it.

That is the strongest available support for the thesis behind these plans, and
it is cited in [ADR-0001](../adr/0001-moca-spec-vs-oci-artifacts.md). Note what
it does *not* support: it says nothing about whether MOCA's container should be
bespoke or OCI-shaped.

**Do not treat the Container Profile as competitive pressure to respond to.**
It is a much smaller project solving its own transport problem. The correct
response is to map it in the converter — a `*.corpus.json` is a legitimate
input — and move on.

## Sequence and sizing

| Step | Output | Effort |
|---|---|---|
| 1 | File the profile proposal issue | — |
| 2 | Author `profiles/mif/` spec, schema, example | 2 d |
| 3 | Import adapter: MIF bundle → MOCA package | 2 d |
| 4 | OKF v0.1 → v0.2 frontmatter upgrade on import | 1 d |
| 5 | Export path: `moca-convert export --format mif` | 2 d |
| 6 | Round-trip fidelity contract + fixture test | 1 d |
| 7 | `*.corpus.json` Container Profile input support | 1 d |

Step 7 is optional and can be dropped if effort runs long — it is the least
load-bearing part. **Steps 3–5 depend on [plan 01](01-okf-v0.2-conformance.md)
landing**, because `conceptType` → `type` is the mapping's spine and `type`
does not exist until then.

## Open questions

1. **Does the profile track MIF 1.3.0 specifically, or MIF 1.x?** MIF has
   shipped six releases in seven months. Pinning to 1.3.0 is honest but ages
   fast; tracking 1.x promises compatibility the converter cannot verify.
   **Leaning pin, with the version in a `regulationVersion`-style field** as
   [§11.5](../../spec/moca-core-spec.md#115-compliance--standards-profiles)
   recommends for compliance profiles.
2. **Does `moca-convert` gain a general `export` verb, or a MIF-specific one?**
   A general verb is better design and more work; it also implies export
   adapters for the other four formats, which nobody has asked for.
   **Leaning MIF-specific, named so it can generalise later.**
3. **Should MIF's `embedding` field map to a `.moca.idx` sidecar** rather than
   being dropped? Technically possible, and it would exercise
   [`moca-index`](../../tools/moca-index) against a real external source. Adds
   two or three days and is not required for interop.
4. **Does auto-detection distinguish a MIF bundle from a plain OKF bundle?**
   Both are directories of Markdown. MIF nodes carry `conceptType` and
   `@context`, which is probably a sufficient signal — but
   [`detect.js`](../../tools/moca-convert/lib/detect.js)'s stated policy is to
   refuse rather than guess, so ambiguity must raise a `UsageError` and require
   an explicit `--from mif`.
