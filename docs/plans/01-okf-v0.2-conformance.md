# Plan 01 — OKF v0.2 conformance as a Level 1 MUST

**Status:** Draft, pending [ADR-0001](../adr/0001-moca-spec-vs-oci-artifacts.md)
**Issue drafts:** [spec-okf-conformance.md](issues/spec-okf-conformance.md),
[spec-deprecate-node-fields.md](issues/spec-deprecate-node-fields.md)
**Effort:** 8–12 days
**Breaking:** yes — proposed bump `0.2.0-beta.1`

## Why

The Open Knowledge Format v0.2, published by Google in
`GoogleCloudPlatform/open-knowledge-format`, is a deliberately minimal
Markdown-plus-YAML-frontmatter interchange format for AI-consumable knowledge.
It occupies exactly the ground MOCA's
[§7](../../spec/moca-core-spec.md#7-grounded-content-nodes-claims--evidence-locators)
occupies, with a hyperscaler behind it.

MOCA does not currently mention OKF anywhere — not in the specification, not in
[ROADMAP.md](../../ROADMAP.md), not in the repository's history. That is the
problem this plan fixes, and it fixes it in the strong direction: not
"compatible with," but **conformant to**, enforced in CI.

The strategic argument is that MOCA's content model was never its
differentiator. Package semantics are — signed, versioned, composable artifacts
with canonical digests and specified degradation. Conceding the content model
to OKF is not a retreat; it removes the part of MOCA that was competing on
someone else's ground, and leaves the part that is defensible.

## What OKF v0.2 actually requires

Verified against the published specification, not summarised from memory.

OKF has **no conformance levels**. It has MUST rules (M1–M6) and SHOULD rules
(S1–S6); the reference validator fails MUST violations and warns on SHOULD
unless `--strict` is passed. "Level 1" throughout this plan therefore means
*MOCA's* Level 1.

**The MUST rules, in substance:**

- A bundle is a directory of `.md` files.
- Every non-reserved `.md` opens with a parseable YAML frontmatter block.
- Every such block carries a non-empty **`type`**.
- `index.md` and `log.md` are reserved and cannot be concept documents.
  `index.md` carries no frontmatter, except that a bundle-root `index.md` may
  declare `okf_version`. `log.md` date headings are ISO 8601.
- Path is identity.
- Files only — no runtime.

**The SHOULD rules, in substance:** a root `index.md`; indexes that enumerate
their directory; internal links that resolve; no isolated concepts; `tags` as a
list; well-formed `generated` / `verified` / `sources` / `status` /
`stale_after`.

Consumer obligations run the other way and are strikingly close to MOCA's own
[§5.6](../../spec/moca-core-spec.md#56-spec-evolution): consumers MUST NOT
reject concepts for missing optional fields, MUST NOT reject bundles for
unknown `type` values or extra keys, and MUST tolerate broken cross-links.
**MOCA's extra frontmatter keys are therefore safe** — the incompatibility is
entirely in what OKF requires that MOCA lacks, not in what MOCA adds.

## The requirement

New subsection **§2.2 "OKF Conformance"**, sited immediately after
[§2.1](../../spec/moca-core-spec.md#21-honest-ro-crate-alignment) and
structurally modelled on it — but inverted. §2.1 is a disclaimer ("MOCA is
informed by RO-Crate, not conformant to it"). §2.2 is a commitment:

> A MOCA package's `content/` directory MUST validate as a conformant Open
> Knowledge Format v0.2 bundle. `content/` is the OKF bundle root.
>
> A package that has no `content/` directory — a composition-only package
> (§10.3) or a sidecar augmentation (§9) — is unaffected by this requirement.
>
> Unlike §2.1's RO-Crate alignment, this is not optional and not conditional on
> a marker file. Tooling MUST enforce it.

Plus a row in the [§2](../../spec/moca-core-spec.md#2-standards-alignment-baseline)
standards-alignment table: *Knowledge Content Interchange → Open Knowledge
Format v0.2*.

Consequential edits:

| Location | Change |
|---|---|
| [§3](../../spec/moca-core-spec.md#3-conformance-levels) Level 1 row | Add: `content/`, if present, MUST validate as a conformant OKF v0.2 bundle |
| [§3](../../spec/moca-core-spec.md#3-conformance-levels) line 108 | **Delete** "YAML frontmatter and its fields are optional, additive enrichment at Level 1" |
| [§4](../../spec/moca-core-spec.md#4-logical-package-structure) | Reserve `content/index.md` and `content/log.md`; note they are not knowledge nodes |
| [§7.1](../../spec/moca-core-spec.md#71-commonmark-knowledge-nodes-content) | **Delete** "At Level 1, YAML frontmatter is OPTIONAL"; add required `type`; invert the identity rule (see below) |

**The identity rule inverts, and improves.** §7.1 currently makes frontmatter
`id` primary with path as fallback. OKF's "path is identity" agrees with the
fallback, so the fallback becomes the rule and frontmatter `id` becomes a
documented MOCA extension that overrides it. This is a clarification, not a
behaviour change — [SDK contract §5.1](../../spec/moca-sdk-contract.md#51-node-identity)
already specifies both.

## What breaks

Measured, not estimated. Reproduce with:

```sh
find examples profiles conformance/fixtures tools/moca-lint/test/fixtures \
  -path '*/content/*.md' | wc -l
grep -rl '^type:' --include='*.md' examples profiles | wc -l
```

| Fact | Count |
|---|---|
| `content/*.md` files repository-wide | **49** |
| …carrying a non-empty `type` | **0** |
| …with no YAML frontmatter at all | **9** |
| Example and profile packages containing `content/` | 12 of 15 |

Every content file in the repository fails the `type` rule. Nine also fail the
frontmatter rule: [`examples/level-1-bare`](../../examples/level-1-bare), both
`composition-members` modules, both `composition-relates` documents, and four
`conformance/fixtures/valid-*` copies of them.

### Consequences beyond the mechanical fix

- **[`examples/level-1-bare`](../../examples/level-1-bare) loses its premise.**
  Its documented purpose is demonstrating frontmatter-free, path-derived
  identity. Under this change that package is illegal. Either retire it or
  re-scope it to "the minimum OKF-conformant node" — see
  [open questions](#open-questions).
- **The headline pitch changes.** [README.md](../../README.md) and
  [docs/quickstart.md](../quickstart.md) both sell "a folder of Markdown."
  After this, Level 1 requires frontmatter on every node. Both need rewriting,
  as does [docs/guides/choosing-a-level.md](../guides/choosing-a-level.md).
- **`moca-convert` breaks completely, not partially.** All four adapters
  (`directory`, `markdown`, `obsidian`, `openapi`) emit nodes without `type`.
  Because [`lib/write.js`](../../tools/moca-convert/lib/write.js) lints output
  before writing and fails closed, the tool stops producing any output the
  moment the lint rule lands. Each adapter needs a `type` derivation.
- **`moca-index`** chunks content nodes; confirm `type` passes through and that
  no `.moca.idx` rebinding is required.
- **Cross-cutting principle tension.** "Low entry bar: Level 1 should solve a
  useful problem with minimal tooling"
  ([ROADMAP](../../ROADMAP.md#cross-cutting-principles)) is weakened, not
  broken — the bar rises from "a folder of Markdown" to "a folder of Markdown
  with three lines of frontmatter each." This should be stated plainly in the
  issue rather than glossed.

### Locale interaction

[§4.2](../../spec/moca-core-spec.md#42-localization-convention)'s
`01-introduction.fr.md` is a **distinct OKF concept document** and needs its
own frontmatter and `type`. The fallback rule is unaffected, but the new
validation pass must not treat locale variants as duplicate concepts. This is a
test case, not a specification change.

## Deprecating the fields OKF already owns

Filed as a **separate issue** from the conformance change
([spec-deprecate-node-fields.md](issues/spec-deprecate-node-fields.md)), because
[CONTRIBUTING.md](../../CONTRIBUTING.md#rfc-2119-keyword-conventions) requires
keyword changes to be the explicit subject of their own change, and because the
conformance rule stands on its own merits even if the deprecations are
rejected.

The overlap, field by field:

| OKF v0.2 | MOCA §7 today | Disposition |
|---|---|---|
| `sources[]` (`resource`, `title`, `author`, `last_modified`, `usage_count`, `id`) | `evidence[].source` | Deprecate `evidence`'s carrier role; keep the locator |
| `generated: {by, at}` | `claims[].provenance.wasGeneratedBy`, `generatedAtTime` | Deprecate at node level; keep inside `claims[]` |
| `verified: [{by, at}]` → trust tiers | `epistemicStatus: verified` | Deprecate that one value |
| `status`: draft / stable / deprecated | `epistemicStatus: deprecated` | Deprecate that one value |
| `stale_after` | node-level `lastReviewed`, `validFrom` ([§7.5](../../spec/moca-core-spec.md#75-content-node-lifecycle-fields)) | Deprecate at node level; **manifest-level survives** |
| `title`, `description` | `title`, `summary` | Deprecate `summary` |
| `tags` | (manifest `keywords` only) | Adopt OKF `tags` at node level |

### What Core keeps, and why

The residue is the honest answer to "what does MOCA's content model add to
OKF?" It is small, and that is the point.

**Keep [§7.3](../../spec/moca-core-spec.md#73-multi-modal-evidence--web-annotation-locators),
the Web Annotation locators.** OKF's `sources[].resource` is a bare path or URL
with no sub-resource addressing. MOCA's `FragmentSelector`, `TextQuoteSelector`
and page locators have no OKF equivalent, and "cite page 12 of this PDF" or
"cite `t=75,210` of this video" is the whole grounding story. Restructure so
the *source* is an OKF `sources[]` entry and MOCA contributes only the locator,
joined on `sources[].id` — OKF provides that `id` explicitly for per-claim
attribution, which makes this a clean join rather than a parallel structure.

**Keep [§7.4](../../spec/moca-core-spec.md#74-explicit-claims-graph-claims), the
claims graph.** Subject/predicate/object triples with PROV-O provenance,
interpretable as RDF at Level 2. No OKF analogue, and it is the bridge to
[§6](../../spec/moca-core-spec.md#6-linked-data--micro-ontologies).

**[§7.2](../../spec/moca-core-spec.md#72-core-epistemic-status-vocabulary),
epistemic status — contested.** See [open questions](#open-questions).

After this, MOCA Core's content model is *a claims graph and an
evidence-locator vocabulary layered on OKF*. It is not a content model of its
own, and the specification should say so.

## Schema changes

Less than expected in the manifest schema, because `content/` and `skills/` are
directory conventions that were never modelled there.

- **New `schemas/v1/core/content-node.schema.json`.** The repository has *no
  schema for node frontmatter today* — it is validated imperatively in
  [`tools/moca-lint/lib/passes/content.js`](../../tools/moca-lint/lib/passes/content.js).
  One is needed now, because `type` is required and the deprecated fields need
  a machine-readable deprecation surface.
- **Vendor it** into `tools/moca-lint/lib/`. Published tarballs ship only
  `bin/`, `lib/` and `README.md`, so `../../../schemas/` does not resolve after
  install — hence the existing vendoring. Extend
  [`scripts/check-vendored-schema.mjs`](../../scripts/check-vendored-schema.mjs),
  which byte-compares the copies, to cover the new file.
- **Fix in passing:** `profileData`'s description in
  `schemas/v1/core/moca.schema.json` cites "core §10.3"; profiles are §11.3.

Per [CONTRIBUTING.md](../../CONTRIBUTING.md#schemas-and-examples), "a manifest
field described in the spec but not reflected in the schema is a bug" — the new
node schema extends that discipline to frontmatter for the first time.

## `moca-lint` changes

The pass architecture is hand-written functions wired in
[`lib/lint.js`](../../tools/moca-lint/lib/lint.js), with codes grouped by pass
in [`lib/codes.js`](../../tools/moca-lint/lib/codes.js): E1xx manifest, E2xx
content and skills, E3xx semantic, E4xx security. Add a new **E5xx OKF pass**
rather than extending the content pass, so that OKF conformance can be reported
and reasoned about as a distinct axis.

- `lib/passes/okf.js` exporting `runOkfPass({ rootDir, manifest, findings })`,
  wired into `lint.js` after the content pass.
- New codes:

  | Code | Rule | Severity |
  |---|---|---|
  | `E501_OKF_MISSING_FRONTMATTER` | No parseable frontmatter block | error |
  | `E502_OKF_MISSING_TYPE` | Frontmatter lacks a non-empty `type` | error |
  | `E503_OKF_RESERVED_FILE_INVALID` | `index.md` / `log.md` structure | error |
  | `E504_OKF_DEPRECATED_NODE_FIELD` | A deprecated MOCA field is present | warning |
  | `E505_OKF_UNRESOLVED_LINK` | Internal `.md` link does not resolve | warning |

- `E504` and `E505` go in `WARN_BY_DEFAULT` in
  [`lib/codes.js`](../../tools/moca-lint/lib/codes.js). `E505` is deliberately
  a warning: it is an OKF SHOULD, and OKF consumers MUST tolerate broken links
  even though producers should not create them. `--strict` escalates both,
  which matches the OKF validator's own `--strict` semantics.
- Existing `E204_INVALID_EPISTEMIC_STATUS` and `E210` route into the
  deprecation path rather than being deleted, so packages get a migration
  warning rather than a silent behaviour change.

### Regenerating the conformance corpus

Expectations in `conformance/cases/` are **observed from the linter**, not
hand-written — see
[`scripts/generate-conformance-cases.mjs`](../../scripts/generate-conformance-cases.mjs).
So `npm run conformance:check` fails until the cases are regenerated, and the
runner treats *extra* codes as failures
([conformance/README.md](../../conformance/README.md)). Order matters:

1. Fix all 24 fixture packages (add frontmatter and `type`).
2. Regenerate cases.
3. Verify no fixture gained an unintended code.

Fixtures are **copies** of `tools/moca-lint/test/fixtures/` and `examples/`,
not symlinks, so each edit lands in two or three places. This is the single
most tedious part of the work and should be scripted.

## Version impact

This removes an existing guarantee, so
[docs/versioning-and-release.md](../versioning-and-release.md#semantic-versioning-policy)
requires it to be called out in both [CHANGELOG.md](../../CHANGELOG.md) and
[MIGRATIONS.md](../../MIGRATIONS.md). Proposed bump: **`0.2.0-beta.1`**.

A `moca-migrate` codemod — inject `type:`, rewrite deprecated fields, leave
everything else alone — is strongly recommended and should ship in the same
release. Without it, every existing package author does the same mechanical
edit by hand. Scoped as optional but sequenced immediately after the lint pass,
because the same fixture corpus exercises both.

Note the derived-artifact cascade: touching any content file invalidates
`canonicalDigest` and therefore `signature`, transitively through composed
members. `npm run refresh:derived` after every fixture batch, per
[CONTRIBUTING.md](../../CONTRIBUTING.md#after-editing-an-example-package).

## Sequence and sizing

| Step | Output | Effort |
|---|---|---|
| 1 | File both issues; reach rough consensus | — |
| 2 | Spec PR: §2 table row, §2.2, §3, §4, §7.1 | 2 d |
| 3 | `content-node.schema.json` + vendoring + `check-vendored-schema` | 1 d |
| 4 | `lib/passes/okf.js` + codes + unit tests | 2 d |
| 5 | Fix 24 fixture packages; regenerate conformance cases | 1–2 d |
| 6 | `moca-convert`: `type` derivation in all four adapters | 2 d |
| 7 | `moca-migrate` codemod | 1–2 d |
| 8 | README, quickstart, choosing-a-level, CHANGELOG, MIGRATIONS | 1–2 d |

Steps 2 and 3 can overlap. Step 5 blocks step 6, because `moca-convert`'s tests
assert against linted output.

## Open questions

1. **Does `epistemicStatus` survive?** OKF's `verified[]` plus trust tiers
   cover *verified*; `status` covers *deprecated*. But MOCA's `sourced`,
   `inferred`, `generated` and especially **`disputed`** have no OKF
   equivalent — and `disputed` is load-bearing:
   [§7.2](../../spec/moca-core-spec.md#72-core-epistemic-status-vocabulary)'s
   conflict-resolution paragraph and
   [§10.2](../../spec/moca-core-spec.md#102-compositionrelates--loose-reference-relates-to)'s
   `conflictsWith` both depend on MOCA being able to surface epistemic tension.
   **Recommendation:** narrow `epistemicStatus` to the values OKF cannot
   express, deprecating only `verified` and `deprecated`. Needs a decision
   before the deprecation issue is filed.
2. **Does MOCA define a `type` vocabulary?** OKF requires a non-empty `type`
   but defines no values — it is minimally opinionated by design. Defining one
   reintroduces a content model, against the thesis. Defining none means
   adapters invent defaults and packages do not interoperate on `type`.
   **Recommendation:** define no vocabulary, require non-empty, and have each
   `moca-convert` adapter emit a documented default.
3. **Does `evidence[]` survive as a field, or fold into `sources[].id` plus a
   locator extension?** Folding is cleaner and more honestly "OKF plus
   locators," but it rewrites §7.3's examples and every `evidence`-carrying
   fixture. **Leaning fold.**
4. **Is `0.2.0-beta.1` sufficient** for three simultaneous breaking changes, or
   does this warrant a named pre-1.0 milestone?
5. **Retire or re-scope `level-1-bare`?** Re-scoping keeps the "minimum viable
   package" teaching role; retiring is honest about the bar having moved.
6. **Should `profiles/okf/` exist?** If OKF conformance is a Core-level MUST,
   an OKF profile is self-contradictory. **Assumed no.**
