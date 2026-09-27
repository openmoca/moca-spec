# Why MOCA?

## The problem

Knowledge that feeds AI systems moves: a vendor ships product documentation to
customers, a platform team serves policies to many product teams, a regulator
publishes guidance that thousands of assistants quote. At every hop, three
questions go unanswered:

1. **Which content is this, exactly?** Nobody can prove an answer came from
   version 4.2 of the knowledge base and not a stale copy.
2. **Who stands behind it?** "Verified" is a label anyone can type. Nothing ties
   it to the person who checked, or to the text they checked.
3. **Is it still in force?** Superseded policies and expired procedures stay in
   the index, and nothing tells the pipeline to stop serving them.

## What already exists

The [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format)
(OKF) gives knowledge a common file format: Markdown with YAML frontmatter, a
required `type`, and, since v0.2, trust fields such as `generated`,
`verified`, `status` and `stale_after`. It is the right content format, and
MOCA uses it as is.

OKF stops at the file on purpose. It has no package identity or version, no
integrity, no signing, and no way to compose bundles or relate versions.
That is the layer MOCA provides.

## What MOCA adds

- **Identity and version** for a whole bundle, with version numbers that say how
  much the meaning changed.
- **A digest** computed from the content, the same for a folder, an archive or
  a registry artifact, so any copy can be checked.
- **Publisher attestations**: who published exactly these bytes, verified with
  Sigstore or a key the host trusts.
- **Review attestations**: a reviewer signs that they checked the exact bytes of
  a node; the review stops counting the moment the node changes.
- **Members pinned by digest and typed relations**, so bundles compose
  reproducibly and a newer version can retire an older one.
- **Evidence, validity and audience** on nodes: cite the exact sentence of a
  source, stop serving content outside its validity window, filter internal
  content before retrieval.
- **A Reader contract and conformance corpus**, so every implementation reaches
  the same conclusions.

## Why not just use something else?

**...OKF?** Use OKF for content; MOCA is built on it. Add MOCA when bundles
cross a boundary and someone needs to know which version, who published it and
who checked it.

**...a folder of Markdown in git?** Git gives history within one repository.
It does not give a reader outside that repository a way to verify who
published what they received, which parts a named person reviewed, or that a
policy is no longer in force.

**...a vector database?** A vector index is derived data for one model and one
chunking scheme. Keep it; feed it from packages. MOCA gives it verified input
and metadata to filter and cite with.

**...OCI artifacts and cosign?** Use them for distribution: MOCA has an
[OCI binding](../spec/moca-oci-binding.md). OCI digests identify archive bytes;
MOCA's digest identifies content across archives. And OCI has no notion of a
reviewed node or a superseded policy.

## What MOCA is not

- Not a content model, a retrieval engine, an embedding format or an agent
  framework.
- Not configuration: nothing in a package can make a Reader contact anything.
- Not proof of truth: attestations say who published and who reviewed.
  Content is still untrusted input to a model.

## Honest status

MOCA is alpha. The specification, tools and conformance corpus are complete
and tested together, but nobody has yet measured whether MOCA metadata
improves answers. That [evaluation](plans/01-outcome-evaluation.md) comes
next, and fields that do not earn their place will be removed.
