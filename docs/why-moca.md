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
4. **Where is the original?** An answer cites a source, but the source stayed
   behind on the sender's side, so nobody downstream can check the quote.

And more and more, knowledge is read where there is no service to ask: inside
a mobile app, on an embedded device, or in a client network that allows no
outside calls. The checks above have to run there too.

## What already exists

The [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format)
(OKF) gives knowledge a common file format: Markdown with YAML frontmatter, a
required `type`, and, since v0.2, trust fields such as `generated`,
`verified`, `status` and `stale_after`. It is the right content format, and
MOCA uses it as is.

OKF stops at the file on purpose. It has no package identity or version, no
integrity, no signing, and no way to compose bundles or relate versions. OKF
can reference sources, but because it defines no packaging, nothing
guarantees that the originals travel with the knowledge or arrive unchanged.
That is the layer MOCA provides.

In one sentence: **OKF describes knowledge; MOCA ships it with its evidence,
sealed.**

MOCA has two purposes, and every part of it serves one of them:

1. **Moving knowledge between platforms securely and verifiably**: identity,
   a digest, signatures, reviews, pinned members, and the original sources
   inside the package.
2. **Reading and integrating packages locally**, on edge devices or on
   infrastructure a client owns: an in-process Reader in the host's language,
   offline search, one search API whatever the backend, and bindings to the
   host's framework.

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
- **The original sources inside the package**, covered by the digest. A Reader
  checks each quoted passage against its source and says whether it matched,
  with no network.
- **Evidence, validity and audience** on nodes: cite the exact sentence of a
  source, stop serving content outside its validity window, filter internal
  content before retrieval.
- **One search entry point** over whatever backend a host uses, from the
  package's own text to a client's vector store, with the same trust rules
  applied every time.
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
and metadata to filter and cite with, and its Search layer applies the trust
rules to what the index returns.

**...OCI artifacts and cosign?** Use them for distribution: MOCA has an
[OCI binding](../spec/moca-oci-binding.md). OCI digests identify archive bytes;
MOCA's digest identifies content across archives. And OCI has no notion of a
reviewed node or a superseded policy.

## What MOCA is not

- Not a content model, a vector database, an embedding format or an agent
  framework.
- Not configuration: nothing in a package can make a Reader contact anything.
- Not proof of truth: attestations say who published and who reviewed.
  Content is still untrusted input to a model.

## Honest status

MOCA is alpha. The specification, tools and conformance corpus are complete
and tested together, but nobody has yet measured whether MOCA metadata
improves answers. That [evaluation](plans/01-outcome-evaluation.md) comes
next, and fields that do not earn their place will be removed.
