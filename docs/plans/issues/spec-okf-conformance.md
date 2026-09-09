# Draft: `[Spec] content/ MUST validate as a conformant OKF v0.2 bundle`

**Template:** Spec change proposal · **Labels:** `spec-change`
**Plan:** `docs/plans/01-okf-v0.2-conformance.md`
**Paste everything below the rule.** Links are written as plain paths rather
than Markdown links, because relative links do not resolve inside a GitHub
issue.

---

## Affected section(s)

- `spec/moca-core-spec.md` §2 Standards Alignment Baseline — new table row
- `spec/moca-core-spec.md` §2.2 OKF Conformance — new subsection
- `spec/moca-core-spec.md` §3 Conformance Levels — Level 1 row, and the
  sentence "YAML frontmatter and its fields are optional, additive enrichment
  at Level 1"
- `spec/moca-core-spec.md` §4 Logical Package Structure — reserved filenames
- `spec/moca-core-spec.md` §7.1 CommonMark Knowledge Nodes
- `schemas/v1/core/` — new `content-node.schema.json`
- `tools/moca-lint/` — new OKF validation pass

## Problem

The Open Knowledge Format v0.2, published by Google in
`GoogleCloudPlatform/open-knowledge-format`, is a minimal Markdown +
YAML-frontmatter interchange format for AI-consumable knowledge. It occupies
the same ground as MOCA §7, with materially more community weight behind it.

MOCA does not currently reference OKF anywhere — not in the specification, not
in `ROADMAP.md`, not in the repository's history. As a result:

1. A MOCA package cannot be consumed by OKF tooling, and vice versa, despite
   the two formats being a few frontmatter keys apart.
2. MOCA is implicitly competing with OKF on content modelling, which is not
   where MOCA's differentiation lies. MOCA's defensible territory is package
   and container semantics — canonical digests, signing, composition, profile
   degradation — not a frontmatter vocabulary.
3. Every month this stays unaddressed, the two formats drift further and the
   conversion cost rises.

The narrow technical gap is that OKF requires every non-reserved `.md` file to
open with a parseable YAML frontmatter block carrying a non-empty `type`. MOCA
§3 and §7.1 currently guarantee the opposite: frontmatter is optional at
Level 1, and MOCA defines no `type` field at all.

## Proposed change

Add §2.2, structurally modelled on §2.1's RO-Crate alignment clause but
inverted from a disclaimer into a commitment:

> ### 2.2 OKF Conformance
>
> A MOCA package's `content/` directory MUST validate as a conformant Open
> Knowledge Format v0.2 bundle. `content/` is the OKF bundle root.
>
> A package that has no `content/` directory — a composition-only package
> (§10.3) or a sidecar augmentation (§9) — is unaffected by this requirement.
>
> Unlike §2.1's RO-Crate alignment, this is not optional and not conditional
> on the presence of a marker file. Tooling MUST enforce it.

Consequential changes:

- **§2 table:** new row — Knowledge Content Interchange → Open Knowledge Format
  v0.2.
- **§3 Level 1 row:** add that `content/`, if present, MUST validate as a
  conformant OKF v0.2 bundle.
- **§3:** delete "YAML frontmatter and its fields are optional, additive
  enrichment at Level 1."
- **§7.1:** delete "At Level 1, YAML frontmatter is OPTIONAL." Add `type` as a
  required frontmatter field. Invert the identity rule so that path-derived
  identity is primary and frontmatter `id` is a documented MOCA override —
  this matches OKF's "path is identity" and is a clarification rather than a
  behaviour change, since `spec/moca-sdk-contract.md` §5.1 already specifies
  both.
- **§4:** reserve `content/index.md` and `content/log.md`, which OKF reserves;
  note that they are not knowledge nodes.

**RFC 2119 implications.** This is a **SHOULD-to-MUST-equivalent upgrade**: a
Level 1 requirement is added where none existed, and an explicit OPTIONAL is
removed. Per `CONTRIBUTING.md`, keyword changes deserve their own issue, which
is why the deprecation of MOCA's overlapping node fields is proposed separately
rather than bundled here.

## Impact on existing conformance levels / profiles

**This is a breaking change to Level 1.** Measured against the current tree:

| Fact | Count |
|---|---|
| `content/*.md` files repository-wide | 49 |
| …carrying a non-empty `type` | **0** |
| …with no YAML frontmatter at all | 9 |

Every content file in the repository fails. Specifically:

- **`examples/level-1-bare` loses its premise.** Its documented purpose is
  demonstrating frontmatter-free, path-derived identity. It must be retired or
  re-scoped.
- **Nine files have no frontmatter at all:** `examples/level-1-bare`, both
  `composition-members` modules, both `composition-relates` documents, and four
  `conformance/fixtures/valid-*` copies.
- **`moca-convert` breaks completely, not partially.** All four adapters emit
  nodes without `type`, and `lib/write.js` lints before writing and fails
  closed — so the tool stops producing output entirely until each adapter gains
  a `type` derivation.
- **24 conformance fixtures** need updating. Because expectations in
  `conformance/cases/` are observed from the linter rather than authored, they
  must be regenerated *after* the fixtures are fixed, and the runner treats
  extra codes as failures.
- **Level 2 and Level 3 are unaffected** beyond inheriting the Level 1 floor.
- **Profiles are unaffected.** Both shipped profiles' example packages carry
  frontmatter already and need only a `type` added. No profile mechanism
  changes.
- **Localisation:** a locale variant such as `01-introduction.fr.md` is a
  distinct OKF concept document and needs its own frontmatter and `type`. The
  §4.2 fallback rule is unchanged.

**Version impact:** proposed bump to `0.2.0-beta.1`, with entries in both
`CHANGELOG.md` and `MIGRATIONS.md` as `docs/versioning-and-release.md`
requires for any change that removes an existing requirement. A `moca-migrate`
codemod injecting `type:` should ship in the same release.

**Cross-cutting principle:** `ROADMAP.md`'s "Low entry bar" principle is
weakened, not broken. The bar rises from "a folder of Markdown" to "a folder of
Markdown with two lines of frontmatter each." That cost is stated openly rather
than glossed; it buys interoperability with a format Google is backing.

## Alternatives considered

**1. SHOULD at Level 1, MUST at Level 2.** Preserves the low-entry-bar promise
and breaks nothing. Rejected: it makes the interoperability claim conditional,
so no consumer can rely on a MOCA package being OKF-readable — which is most of
the value. "Conform hard" becomes "conform when convenient."

**2. Stage the enforcement** — specification says MUST, `moca-lint` warns for
one minor version, errors at `0.3.0`. Rejected as adding a release cycle of
ambiguity while reaching the same destination; a `moca-migrate` codemod
addresses the same migration pain more directly.

**3. An `okf` profile rather than a Core requirement.** Rejected as
self-contradictory: if OKF conformance is optional, it does not deliver
interoperability, and profiles are for domain-specific additions rather than
baseline format conformance.

**4. Define a MOCA `type` vocabulary.** Deliberately *not* proposed. OKF
requires a non-empty `type` but defines no values, by design. Defining one
would reintroduce into Core exactly the content-modelling role this change
exists to concede. Recommendation is to require non-empty and let each
converter adapter emit a documented default.
