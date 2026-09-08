# Consuming a MOCA package

This guide is for people building the thing that *reads* packages — a harness,
a retrieval pipeline, an agent, an importer. Everything else in these docs is
about authoring; this is the other half.

It describes the behaviour a correct consumer implements, in the order you
implement it. The normative rules live in
[the core specification](../../spec/moca-core-spec.md); this guide is the
practical reading of them, and it is also the source material for the
forthcoming SDK contract, so the shape here is the shape the SDKs will have.

> **Rule zero:** loading a package MUST NOT execute anything. A MOCA package
> is inert data. If your loader evaluates, imports, or shells out to anything
> found inside a package, it is not a MOCA consumer.

## 1. Resolve the package root

A package is a directory containing `moca.json` at its root, or a Zip archive
(`.moca`) containing the same. Three shapes are legitimate
([core §4.1](../../spec/moca-core-spec.md#41-storage--transport-independence)):
a directory on disk, an archive, or records shredded into a database or object
store.

If you accept archives, you are accepting untrusted input, so apply the usual
protections before extracting: reject entry names containing `..` or absolute
paths, cap the entry count, and cap total uncompressed size. `moca-lint`'s
`validateArchiveEntries()` does exactly this and is worth reading as a
reference implementation.

## 2. Parse and validate the manifest

Required at every level: `id`, `version`, `title`. Validate against
[`schemas/v1/core/moca.schema.json`](../../schemas/v1/core/moca.schema.json).

Two checks matter more than schema conformance:

**Reject excluded properties.** `endpoints`, `settings`, `credentials`, and
`apiKeys` MUST NOT appear in any manifest, at any level, under any profile
([core §5.3](../../spec/moca-core-spec.md#53-excluded-properties)). A manifest
carrying them is not a MOCA package. Treat this as a hard failure, not a
warning — it is the guarantee that a package cannot reconfigure your runtime.

**Keep every path inside the package.** Anything path-shaped in the manifest —
`integrity` keys, `evidence[].source`, `augmentation.target`, ontology paths —
must resolve within the package root. Reject absolute paths and parent
traversal. `moca-lint`'s `resolvePackagePath()` is the reference behaviour.

## 3. Derive the conformance level — don't read it

There is no level field, deliberately
([core §3](../../spec/moca-core-spec.md#3-conformance-levels)). You determine
what a package supports by looking at what is present and what validates:

- **Level 1** — valid manifest, plus either at least one CommonMark file under
  `content/` or a `composition` block referencing another package.
- **Level 2** — adds `ontologies/`, and `claims` interpretable as RDF.
- **Level 3** — adds Web Annotation locators and signatures.

A feature from a higher level that is present but invalid does **not** raise
the level; treat it as an unsupported or invalid feature. Never report a
package as conformant to a level whose requirements failed.

## 4. Enumerate content nodes

Read every `.md` under `content/`. Parse YAML frontmatter if present — at
Level 1 it is entirely optional.

**Node identity.** If frontmatter carries `id`, that is the node's identity.
If it does not, the identity is the file path relative to `content/`
([core §7.1](../../spec/moca-core-spec.md#71-commonmark-knowledge-nodes-content)).
Both are valid; a consumer MUST handle the absent case rather than skipping
the node.

**Optional enrichment you should use when present:**

| Field | What to do with it |
|---|---|
| `title` | Display name; fall back to the first H1, then the filename. |
| `summary` | A one-line description, useful for retrieval snippets. |
| `concepts[]` | Concept bindings with a `role` (`primary`, `supporting`). Use for graph-aware retrieval. |
| `epistemicStatus` | How much to trust this node — see below. |
| `evidence[]` | Source references with optional locators. |
| `claims[]` | Structured assertions, optionally with PROV-O provenance. |

**Epistemic status is a ranking signal, not decoration.** The core vocabulary
is `sourced`, `verified`, `inferred`, `generated`, `disputed`, and
`deprecated` ([core §7.2](../../spec/moca-core-spec.md#72-core-epistemic-status-vocabulary)).
A harness answering a question should prefer `verified` over `generated`, and
should be reluctant to present `disputed` or `deprecated` content without
saying so. A value you don't recognise probably comes from a profile — treat
it as unknown rather than invalid.

## 5. Resolve locales

Locale variants are a filename convention, not a manifest structure:

```text
content/01-introduction.md        # default
content/01-introduction.fr.md     # French
content/01-introduction.pt-BR.md  # Brazilian Portuguese
```

To resolve for a requested locale, look for the suffixed file; if it is absent,
**fall back to the unsuffixed file** — this is a MUST
([core §4.2](../../spec/moca-core-spec.md#42-localization-convention)). The
same fallback applies whether or not the node declares a frontmatter `id`.

Manifest string fields (`title`, `description`, `author`, `publisher`) are
separately localisable as objects keyed by BCP-47 code. Resolution order:
exact match → partial match (`pt` for `pt-BR`) → the manifest's `language` →
any single key present
([core §5.2](../../spec/moca-core-spec.md#52-localized-string-values)).

## 6. Check integrity, if you care about it

Two independent mechanisms:

- **`integrity`** — a map of per-resource SHA-256 digests. Verify file bytes
  against it. If the package also carries RO-Crate or BagIt checksums and they
  disagree, `moca.json`'s `integrity` wins, and you SHOULD warn rather than
  silently pick one ([core §5.4](../../spec/moca-core-spec.md#54-integrity-precedence)).
- **`canonicalDigest`** — a reproducible whole-package identity computed from
  on-disk bytes plus the manifest (with `canonicalDigest` and `signature`
  removed). Recompute it rather than trusting the declared value; that is the
  entire point of it
  ([core §5.5](../../spec/moca-core-spec.md#55-canonical-package-digest)).

For a composed package, the digest folds in members' declared digests
transitively, so reproducing it requires resolving members the same way the
producer did. Different resolution strategies legitimately produce different
digests for the same manifest.

## 7. Follow composition — carefully

Two independent mechanisms under `composition`
([core §10](../../spec/moca-core-spec.md#10-package-composition--relationships)):

**`members`** is containment: this package is *made of* those packages,
ordered, with version ranges. Direction is parent → child only; a member never
names its parents, which is what keeps members reusable across several
aggregates.

**`relates`** is loose association — `crossReferences`, `supersedes` and
similar. It carries no containment meaning and no ordering.

Practical requirements for a consumer:

- **Resolution is yours to define.** The format says a member has an `id` and
  a version range. Where you find it — a local directory, a registry, an MCP
  server — is a host concern. Document your strategy, because package identity
  under composition depends on it.
- **Guard against cycles.** Nothing in the format prevents A → B → A. Track
  visited ids and fail closed on a cycle. (`moca-lint` cannot currently detect
  this because it lints one directory at a time — a known gap, and a real one
  for consumers to cover.)
- **Handle dangling members.** A member id that resolves to nothing is a
  legitimate runtime condition, not a corrupt package. Decide whether you
  degrade or refuse, and be consistent.
- **A composition-only package is valid.** It may have no `content/` at all.
  Do not assume every package has content.

## 8. Make the trust decision before touching `skills/`

This is the one part of consuming a package with real security consequences.

`skills/` contains Agent Skills — instructions intended to be executed by a
harness. The rules are not advisory
([core §8.2](../../spec/moca-core-spec.md#82-security--trust-boundary-rule)):

1. Any package containing `skills/` MUST have a valid `signature`, regardless
   of what level it otherwise satisfies.
2. A harness MUST refuse to load `skills/` content from an unsigned or
   signature-invalid package.
3. A harness MUST filter each skill's `allowed-tools` against host policy
   before executing anything. `allowed-tools` is the skill's *request*, never
   a grant.
4. Rejecting `skills/` MUST NOT invalidate the rest of the package — and
   accepting the rest MUST NOT imply accepting the skills.

Treat a `skills/` directory as attacker-controlled input until verification
succeeds. Verification itself — what the signature covers, which signers you
trust, offline versus online, revocation — is
[the trust model](../../spec/moca-trust-model.md), with
[`moca-sign`](../../tools/moca-sign/README.md) as the reference
implementation. Point 4 is the one most often got wrong: unsigned skills mean
"ignore the skills", not "reject the package".

## 9. Degrade gracefully

The single behaviour that most distinguishes a good consumer from a brittle
one: **anything optional being absent, unrecognised, or unsupported must
reduce capability, not cause failure.**

| Situation | Correct behaviour |
|---|---|
| Unrecognised profile URI in `profile[]` | Process as valid MOCA Core, ignore the profile's semantics. Required by [core §11.2](../../spec/moca-core-spec.md#112-graceful-degradation). |
| Unknown `profileData.<name>` | Leave it opaque. It belongs to a profile, not to you. |
| Unknown `epistemicStatus` value | Treat as unknown, not invalid — likely profile vocabulary. |
| No sidecar index | Fall back to lexical search or straight enumeration. The package is complete without one. |
| No `ontologies/` | Level 1 behaviour. Concepts are opaque strings. |
| No frontmatter anywhere | Fully valid. Identify nodes by path. |
| Unknown `x-*` vendor key | Ignore it. |
| Unknown `storage.format` in a sidecar | Ignore that sidecar. |

## 10. Attach a sidecar index, if one is offered

An index is optional, derived, and never authoritative
([sidecar spec](../../spec/moca-sidecar-index-spec.md)). Before using one:

- Check `target_package_id` matches the package.
- If `target_package_hash` is declared, verify it. On mismatch you MUST reject
  the sidecar or mark it stale per a documented local policy.
- A sidecar without a declared hash MAY be used per local policy, but identity
  alone does not prove it is synchronised.

Every indexed item exposes `content_path`, `chunk_index`, and `chunk_count`,
with `0 ≤ chunk_index < chunk_count`. Resolve retrieval hits back to real
content through `content_path`, which must land inside the target's `content/`.

**Never infer trust from a sidecar.** A harness MUST NOT take package
integrity, conformance, credentials, model configuration, or execution policy
from an index.

## Putting it together

A minimal but correct load sequence:

```text
1.  resolve root (dir | archive → safe extract)
2.  parse manifest → reject excluded properties, validate paths
3.  derive level from what's present and valid
4.  enumerate content/ → node id = frontmatter id ?? path
5.  resolve locale with fallback to unsuffixed
6.  verify integrity / recompute canonicalDigest   (optional)
7.  resolve composition.members                     (cycle-guarded)
8.  if skills/ → verify signature or drop skills only
9.  attach sidecar index if present and bound       (optional)
10. serve content, carrying epistemicStatus and evidence into the answer
```

Steps 6, 7, 9 are optional capabilities. Steps 2 and 8 are the ones with
security consequences.

## See also

- [Choosing a conformance level](choosing-a-level.md) — what to support first.
- [Signing and trust](signing-and-trust.md) — the verification side in practice.
- [Search and indexes](search-and-indexes.md) — building and binding a sidecar.
- [End-to-end walkthrough](../walkthrough.md) — source material to grounded answer.
