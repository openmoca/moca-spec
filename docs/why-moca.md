# Why MOCA?

**OpenMOCA is an open standard for portable grounding for AI.** A MOCA package
carries the knowledge an AI system answers from, how that knowledge is
organised, and the original sources it came from, sealed by one digest and
optionally signed. Open Readers in TypeScript, .NET and Python read, verify,
search and cite it the same way, on a server or offline, whatever model,
vector store or agent framework you use.

**MOCA stands for Modular Ontology, Content & Attestation**: knowledge in
modular packages that can be assembled into larger ones, organised by an
optional ontology, its content kept with the original sources, and
attestations, signatures that prove who published it and who checked it.

It fits wherever an AI answers from your knowledge: [RAG](moca-and-rag.md)
with citations you can check, [trust and provenance](trust-and-provenance.md),
[grounding for AI agents](ai-agents.md), [ontology for AI retrieval](ontology.md),
and [sovereign and offline AI](sovereign-ai.md). Questions people often ask are
in the [FAQ](faq.md).

## The problem

Knowledge that feeds AI systems moves: a vendor ships product documentation to
customers, a platform team serves policies to many product teams, a regulator
publishes guidance that thousands of assistants quote. At every hop, five
questions often go unanswered:

1. **Which content is this, exactly?** It is hard to prove an answer came from
   version 4.2 of the knowledge base and not a stale copy.
2. **Who stands behind it?** "Verified" is a label anyone can type. Often
   nothing ties it to the person who checked, or to the text they checked.
3. **Is it still in force?** Superseded policies and expired procedures can
   stay in the index, because the pipeline is rarely told to stop serving them.
4. **Where is the original?** An answer cites a source, but the source often
   stays behind on the sender's side, so it is hard to check the quote downstream.
5. **How is this knowledge organised?** Procedures have steps in order,
   regulations have clauses that depend on each other, courses have
   prerequisites. Plain retrieval often flattens all of it, so an assistant
   answers out of order or out of scope.

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

In one sentence: **OKF describes knowledge; MOCA ships it with its structure
and its evidence, sealed when signed.**

MOCA has two purposes, and every part of it serves one of them:

1. **Moving knowledge between platforms securely and verifiably**: identity,
   a digest, signatures, reviews, pinned members, the structure, and the
   original sources, carried in the package where they can be.
2. **Reading and integrating packages locally**, on edge devices or on
   infrastructure a client owns: an in-process MOCA Reader in the host's
   language, offline search, structure operations, and bindings to the host's
   framework.

## What MOCA adds

- **Identity and version** for a whole bundle, with version numbers that say how
  much the meaning changed.
- **A digest** computed from the content, the same for a folder, an archive or
  a registry artifact, so any copy can be checked.
- **Publisher attestations**: who published exactly these bytes, verified with
  an Ed25519 key or a Sigstore identity the host trusts
  ([signing and review](guides/signing-and-review.md)).
- **Review attestations**: a reviewer signs that they checked the exact bytes of
  a node; the review stops counting the moment the node changes.
- **Members pinned by digest and typed relations**, so bundles compose
  reproducibly and a newer version can retire an older one.
- **The original sources, carried in the package** where they can be, and
  covered by the digest. A Reader checks each quoted passage against a source
  in the package and says whether it matched, with no network.
- **Evidence, validity and audience** on nodes: cite the exact sentence of a
  source, stop serving content outside its validity window, filter internal
  content before retrieval.
- **An optional structure layer** in RDF (Turtle). Every Reader understands a
  small core of SKOS and Dublin Core terms (hierarchy, parts, order, what
  requires what, what replaces what) and answers questions about it the same
  way. The same file can carry any other vocabulary, such as OWL, SHACL,
  PROV-O or your own domain terms. It travels in the package, covered by the
  digest, and its meaning is left to the application
  ([structure guide](guides/structure.md)).
- **Ontology-guided search, through pluggable hooks.** Before a search, an
  ingress hook can narrow it to a topic and everything under it. After it, an
  egress hook can reorder the results or add what they build on. Every Reader
  ships a default, and an application can supply its own for its domain, such
  as law or procedures. The Reader's trust checks run after both hooks, so a
  hook can never return content they would remove
  ([write your own hooks](guides/structure.md#7-write-your-own-hooks)).
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
and metadata to filter and cite with, and the Reader's search applies the
trust rules to what the index returns.

**...a knowledge graph or GraphRAG?** GraphRAG usually means a graph an LLM
extracts from text. MOCA's structure is curated with the content, from
standard vocabularies, and travels with it; any graph tooling can load
`structure.ttl`.

**...OCI artifacts and cosign?** Use them for distribution: a package is a
set of files, which any registry can carry. OCI digests identify archive
bytes; MOCA's digest identifies content across archives, and is the hash of a
standard BagIt manifest. And OCI has no notion of a
reviewed node or a superseded policy.

## What MOCA is not

- Not a content model, a vector database, an embedding format or an agent
  framework.
- Not configuration: nothing in a package can make a Reader contact anything.
- Not proof of truth: attestations say who published and who reviewed, and
  `matched` says a quote is in its source. Content is still untrusted input to
  a model, and structure narrows what is retrieved, not what a model says.

## Honest status

MOCA is at 0.6.0, before 1.0. The specification, three Readers, the tools and
the conformance corpus are complete and tested together, but nobody has yet
measured how much MOCA metadata improves answers. That
[evaluation](plans/01-outcome-evaluation.md) comes next, and fields that do not
earn their place will be removed.
