# Draft: `[Spec] Deprecate node frontmatter fields OKF v0.2 already defines`

**Template:** Spec change proposal · **Labels:** `spec-change`
**Plan:** `docs/plans/01-okf-v0.2-conformance.md`
**Depends on:** the OKF conformance issue — this is meaningless without it.
**Paste everything below the rule.**

---

## Affected section(s)

- `spec/moca-core-spec.md` §7.1 CommonMark Knowledge Nodes — `summary`
- `spec/moca-core-spec.md` §7.2 Core Epistemic Status Vocabulary
- `spec/moca-core-spec.md` §7.3 Multi-Modal Evidence & Web Annotation Locators
  — the `evidence[].source` carrier, not the locator
- `spec/moca-core-spec.md` §7.5 Content Node Lifecycle Fields — node-level
  `validFrom` and `lastReviewed` only
- `tools/moca-lint/` — deprecation diagnostics

## Problem

Once `content/` MUST validate as a conformant OKF v0.2 bundle, MOCA node
frontmatter carries two spellings for most of the same information. OKF v0.2
made provenance, trust, and lifecycle first-class, and in doing so it landed on
the same concepts §7 already had:

| OKF v0.2 | MOCA §7 today |
|---|---|
| `sources[]` — `resource`, `title`, `author`, `last_modified`, `usage_count`, `id` | `evidence[].source` |
| `generated: {by, at}` | `claims[].provenance.wasGeneratedBy`, `generatedAtTime` |
| `verified: [{by, at}]`, with derived trust tiers | `epistemicStatus: verified` |
| `status`: `draft` / `stable` / `deprecated` | `epistemicStatus: deprecated` |
| `stale_after` | node-level `lastReviewed`, `validFrom` |
| `title`, `description` | `title`, `summary` |
| `tags` | (no node-level equivalent; manifest `keywords` only) |

Two spellings for one fact is a drift problem with no upside. Authors will not
know which to populate, consumers will not know which to trust, and the two
will disagree in real packages. Worse, it undercuts the reason for conforming
to OKF at all: an OKF consumer reading a MOCA package would see empty `sources`
and `verified` while the real data sits in MOCA-specific keys it is required to
ignore.

## Proposed change

Deprecate the MOCA spellings in favour of OKF's, keeping only what OKF cannot
express.

**Deprecated** (retained and accepted for one minor version with a warning,
then removed):

- `summary` → OKF `description`
- `epistemicStatus: verified` → OKF `verified[]`
- `epistemicStatus: deprecated` → OKF `status: deprecated`
- node-level `validFrom` / `lastReviewed` → OKF `stale_after` and
  `generated.at`
- `evidence[].source` as a source carrier → OKF `sources[]`

**Adopted:** OKF `tags` at node level.

**Explicitly retained, because OKF has no equivalent:**

1. **§7.3's Web Annotation locators.** OKF's `sources[].resource` is a bare
   path or URL with no sub-resource addressing. `FragmentSelector`,
   `TextQuoteSelector` and page locators have no OKF counterpart, and
   "cite page 12 of this PDF" or "cite `t=75,210` of this recording" is the
   entire grounding story. Restructure so the *source* is an OKF `sources[]`
   entry and MOCA contributes only the locator, joined on `sources[].id` —
   OKF provides that `id` specifically for per-claim attribution, which makes
   this a clean join rather than a parallel structure.
2. **§7.4's claims graph.** Subject/predicate/object triples with PROV-O
   provenance, interpretable as RDF at Level 2. No OKF analogue, and it is the
   bridge to §6.
3. **Manifest-level `validFrom` / `lastReviewed` / `supersedes`.** OKF is a
   content format and says nothing about packages. Only the *node-level*
   duplicates are deprecated.

**Open for discussion — the rest of §7.2.** OKF's `verified` and `status` cover
two of the six core epistemic-status values. The other four — `sourced`,
`inferred`, `generated`, `disputed` — have no OKF equivalent, and `disputed` is
load-bearing: §7.2's conflict-resolution paragraph and §10.2's `conflictsWith`
both depend on MOCA being able to surface epistemic tension between nodes.

The proposal is therefore to **narrow §7.2 rather than delete it**, deprecating
only `verified` and `deprecated` and keeping the four values that carry
information OKF cannot. Deleting §7.2 outright is the alternative and is
discussed below.

**RFC 2119 implications.** No MUST/SHOULD/MAY keyword changes: every affected
field is currently OPTIONAL and becomes deprecated-then-removed. The keyword
change lives in the companion OKF conformance issue.

## Impact on existing conformance levels / profiles

- **Level 1:** no floor change beyond what the OKF conformance issue already
  proposes. These fields are optional today.
- **Level 2:** `claims[].provenance` is untouched, so PROV-O interpretation is
  unaffected. `evidence` links still resolve against provenance records; only
  the source carrier moves.
- **Level 3:** Web Annotation selectors are explicitly retained, so the Level 3
  definition is unchanged.
- **Education profile:** extends the epistemic-status vocabulary with
  `authoritative` and `peer-reviewed`. **Directly affected if §7.2 is deleted
  outright**, unaffected if §7.2 is narrowed. This is the strongest practical
  argument for narrowing.
- **EU AI Act profile:** no node-level frontmatter dependency. Unaffected.
- **Packages in the wild:** any package using `summary`, `epistemicStatus:
  verified|deprecated`, or node-level lifecycle fields gets a warning for one
  minor version, then an error. A `moca-migrate` codemod should handle the
  rewrite mechanically.
- **`moca-lint`:** existing `E204_INVALID_EPISTEMIC_STATUS` and
  `E210_UNVERIFIABLE_EPISTEMIC_STATUS` route into the deprecation path rather
  than being deleted, so authors see a migration warning rather than a silent
  behaviour change.

## Alternatives considered

**1. Keep both spellings, specify a normative mapping.** Add a §7.6
correspondence table, require the two to agree when both are present, and add a
`moca-lint` error on divergence. Least disruptive. Rejected: it leaves MOCA
permanently carrying a content model it has just conceded, doubles the
authoring surface, and the "must agree" rule is a validation burden that exists
only because of the duplication.

**2. Delete §7.2 entirely.** Sharpest expression of "MOCA does not define a
content model." Rejected for now: it breaks the education profile's vocabulary
extension, and `disputed` has no OKF equivalent while being depended on by
§10.2. Reconsider after the `docs/plans/04-converter-first-core-audit.md`
instrumentation shows whether any consumer reads it.

**3. Defer the whole decision to the harness instrumentation** in plan 04.
Evidence-driven and appealing. Rejected as sequencing: the duplication would
ship in `0.2.0-beta.1` alongside OKF conformance and then be removed a release
later, meaning two migrations for authors instead of one. The retained fields
are defensible on their own merits without waiting for data; only §7.2's
narrowing genuinely benefits from it, and that is why §7.2 is flagged as open
rather than settled.
