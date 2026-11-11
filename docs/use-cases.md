# Use cases

MOCA is not another model, vector store or agent framework. It is the form
your knowledge travels in, so that whatever you build (a RAG pipeline, an AI
agent, a search page) answers from the right version, cites the original
source, and can prove both.

It pays off when knowledge has to keep its **structure and its sources**
wherever it is read, or when it **crosses a boundary**: between organisations,
between teams, or between the people who own it and the systems that serve
it.

Every use case below gets the same foundations:

- **One digest seals the package**, and a signature shows who published it.
- **Every answer is a citation** to a versioned node, with a quote checked
  against the original source.
- **Trust rules apply at search time.** Content that is out of force,
  superseded or for another audience never comes back, whatever search
  backend you use.

## At a glance

| Use case | What MOCA adds | See&nbsp;it |
| --- | --- | --- |
| [Sharing knowledge for grounding](#sharing-knowledge-for-grounding) | Package a body of knowledge once; any assistant, model or framework grounds on it | [Try&nbsp;it](https://try.openmoca.org/p/kubernetes-docs) |
| [Manuals and procedures](#manuals-and-procedures) | Steps in order, the checks that come first, cited to the PDF page, offline | [Try&nbsp;it](https://try.openmoca.org/p/flying-handbook) |
| [Law and regulation](#law-and-regulation) | Only the version in force, with the exact clause cited | [Try&nbsp;it](https://try.openmoca.org/p/data-protection-act) |
| [Courses and training](#courses-and-training) | Modules, lessons in order and prerequisites, cited to the moment in a lecture | [Try&nbsp;it](https://try.openmoca.org/p/copilot-studio) |
| [Recorded talks and video series](#recorded-talks-and-video-series) | Searchable speech, every answer opening the video at the moment | [Try&nbsp;it](https://try.openmoca.org/p/claude-first-steps) |
| [Onboarding](#onboarding) | Foundations before advanced material, with named owners' reviews | [Try&nbsp;it](https://try.openmoca.org/p/gitlab-handbook) |
| [Documentation shipped to customers](#documentation-shipped-to-customers) | Customers verify who published it, and stop quoting last year's release | [Try&nbsp;it](https://try.openmoca.org/p/kubernetes-docs) |
| [Customer support knowledge](#customer-support-knowledge) | AI drafts kept apart from what a person checked, internal answers kept internal | [Try&nbsp;it](https://try.openmoca.org/p/support-kb) |
| [Audit and regulated AI](#audit-and-regulated-ai) | A record of exactly which content each answer used | [Try&nbsp;it](https://try.openmoca.org/p/support-kb?view=inspect) |
| [Clinical guidelines](#clinical-guidelines) | The pathway's order kept, every citation checked against the guideline | |

These are examples, not a complete list: MOCA fits wherever the signs above
hold. They are described at the same depth on purpose. MOCA is neutral between
domains, and none of them is special to the standard. The "Try it" links open
a package in [Try OpenMOCA](https://try.openmoca.org), an example site you can
search without an account.

## Sharing knowledge for grounding

**The problem.** A body of knowledge, such as a team's documentation, a
project's docs or a published guide, has to be loaded again into every
assistant, model and pipeline that should answer from it. Each copy is
chunked and indexed its own way, loses its structure and its sources, and
drifts from the original. Nobody can say which version an answer came from.

**What MOCA adds.**

- **Package once, ground anywhere.** The same `.moca` file is read in-process
  by the TypeScript, .NET or Python Reader, served to any MCP client, or loaded
  into your own vector store, with the same trust rules and citation records
  each time. Changing model or framework does not mean rebuilding the
  knowledge.
- **Start small.** A package can be just a manifest and a folder of Markdown,
  with no structure and no signatures. That is enough to move a grounded
  project from one assistant to another.
- **Grow when you need to.** Add structure, evidence, a sidecar search index or
  a signature later, without changing how anyone reads the package.
- **Every answer is traceable.** A citation names the node, its version and
  the package digest, whoever answered.

**See it.** [`examples/minimal`](../examples/minimal) and the
[quickstart](quickstart.md): a valid package in five minutes. Try the
[Kubernetes documentation](https://try.openmoca.org/p/kubernetes-docs): all
1,653 pages in one package.

## Manuals and procedures

**The problem.** A technician needs the current procedure, in the right order,
often with no connection. A chatbot over a folder of PDFs returns a step out
of order, or one from a withdrawn revision, and nobody can tell which page it
came from.

**What MOCA adds.**

- **The order and the checks are kept.** Structure holds the assembly tree
  (`dcterms:hasPart`), the steps in order (`skos:OrderedCollection`) and the
  checks that come first (`dcterms:requires`). Every Reader answers "what must
  happen before step 5?" the same way.
- **Answers stay on the job.** Search can be limited to the system being
  repaired and everything under it.
- **Withdrawn procedures stop being used.** A new revision `supersedes` the
  old one, and the Reader leaves the old one out.
- **It works offline.** A `.moca` file with a sidecar index runs on a laptop
  or tablet. Lexical search needs nothing more; semantic search needs only a
  small local embedding model.
- **Your PDFs are the starting point.** `moca-convert` splits each PDF into a
  node per section, and evidence cites the pages each node came from
  (`page=12`, with the printed page number).
- **Large manuals are composed.** A handbook can be built from chapter
  packages, each pinned by its digest, so the handbook fixes exactly which
  chapter versions it contains.

**See it.** [`examples/pdf`](../examples/pdf), the FAA's 19-PDF flying
handbook, and [`examples/handbook`](../examples/handbook), a handbook
composed of chapters. Try the
[Airplane Flying Handbook](https://try.openmoca.org/p/flying-handbook), where
each topic shows what it builds on, and the
[HSE guidance](https://try.openmoca.org/p/hse-guidance), cited to the PDF page.

## Law and regulation

**The problem.** "Which clause applies, and what does it depend on?" has one
right answer. A system that mixes last year's text with this year's, or
paraphrases without a citation, gives a confident wrong one.

**What MOCA adds.**

- **Only what is in force.** Each version is a package with a validity window.
  The default retrieval policy leaves out versions that are not in force, and
  `supersedes` retires them without deleting them, so "what did it say in
  2025?" still has an answer.
- **The shape of the law is kept.** Structure holds the part, section and
  clause tree, cross-references (`dcterms:requires`) and amendments
  (`dcterms:replaces`).
- **The exact clause is cited.** Evidence points at the clause in the original
  text, and the Reader marks it `matched` when the quote is found there.

**See it.** [`examples/policy-corpus`](../examples/policy-corpus), two
versions of one policy. Try the
[Data Protection Act 2018](https://try.openmoca.org/p/data-protection-act),
section by section.

## Courses and training

**The problem.** A course has modules, a sequence and prerequisites. An
assistant that ignores them answers with material the learner has not reached,
or cites "the lecture" with no way to find the moment.

**What MOCA adds.**

- **The course's shape is kept.** Structure holds modules as parts, lessons
  in order, and prerequisites as `requires`. An application can use them to
  keep a learner on their current module.
- **Citations to the moment.** Evidence can point at a time range in a
  lecture (Media Fragments). The WebVTT captions travel in the package, so the
  citation is checked against what was said.
- **Your teaching vocabulary stays yours.** Learning objectives and similar
  terms travel as an overlay or extra vocabulary, never as part of the
  standard.

**See it.** Try [Learn Copilot Studio 2026](https://try.openmoca.org/p/copilot-studio),
a 17-video series in order.

## Recorded talks and video series

**The problem.** A talk or a video series is knowledge locked in speech. You
cannot search it, and an answer about it cannot point to where it was said.

**What MOCA adds.**

- **Speech becomes searchable text.** Each video is a node holding its
  description and a transcript from its captions. The video stays where it is
  published, as the node's `resource`.
- **Every answer opens at the moment.** Evidence cites chapters as time
  ranges, and the captions travel under `media/`, so every range is checked
  without a network.
- **A series stays in order** (`skos:OrderedCollection`).
- **Nothing is written by hand.** `moca-youtube` builds the package from a
  video or a playlist.

**See it.** [`examples/youtube`](../examples/youtube). Try
[First Steps to Using Claude AI](https://try.openmoca.org/p/claude-first-steps),
a recorded talk cited to its chapters.

## Onboarding

**The problem.** A new starter should meet the foundations before the
advanced material, and the handbook they learn from should be one someone
actually checked.

**What MOCA adds.**

- **Foundations first.** Structure holds skill areas, the learning path, and
  foundations as `requires`.
- **Your own rules, without editing the package.** An overlay adds the
  organisation's rules, for example a compliance module required before
  system access ([ADR-0008](adr/0008-package-application-organisation-layers.md)).
- **Named owners.** Review attestations show which pages a named owner has
  checked, and when.

**See it.** Try the [GitLab handbook](https://try.openmoca.org/p/gitlab-handbook),
a company's policies and people practices.

## Documentation shipped to customers

**The problem.** A software vendor's customers load its documentation into
their own assistants. Copies drift, last year's behaviour keeps being quoted,
and nobody can tell an official copy from a modified one.

**What MOCA adds.**

- **Customers verify the publisher.** They check the publisher attestation
  before loading the package.
- **Old releases stop being quoted.** Each release is a new version that
  `supersedes` the last.
- **It fits the customer's stack.** Whatever Reader, MCP client or vector
  store the customer uses, the same trust rules apply.
- **The exact paragraph is cited**, in the documentation or the release notes.

**See it.** Try the
[Kubernetes documentation](https://try.openmoca.org/p/kubernetes-docs),
vendor documentation at scale.

## Customer support knowledge

**The problem.** Support answers drift, and AI drafting tools rewrite them.
Soon nobody knows which answers a person has checked, and internal procedures
leak into the public assistant.

**What MOCA adds.**

- **Drafts are marked.** OKF `generated` marks drafted content, and a support
  lead's review attestation marks what a person actually checked.
- **Answers are re-checked.** `stale_after` sets when a node is due for
  review again.
- **Internal stays internal.** `audience: internal` keeps agent-only
  procedures out of the public assistant, before retrieval.
- **One answer, several languages.** A node can carry translations, and the
  Reader picks the one for the caller's language.

**See it.** [`examples/support-kb`](../examples/support-kb). Try the
[Acme Support Knowledge Base](https://try.openmoca.org/p/support-kb): signed,
reviewed, in two languages, with superseded content flagged.

## Audit and regulated AI

**The problem.** An organisation must show which knowledge its assistant used
for an answer, and where that knowledge came from. Logs of "retrieved chunk
4711" from a vector store that has since been rebuilt prove nothing.

**What MOCA adds.**

- **A record that names the exact content.** Store the versioned node
  reference and the package digest with every answer. Together they name the
  exact bytes the answer came from, long after the index is rebuilt.
- **The sources are kept.** The originals travel under `sources/`, so each
  citation can be matched against its source at audit time.
- **A clear scope.** Dataset governance records, such as an SPDX 3.0 Dataset
  or Croissant document, sit beside the package, and risk classification
  stays with the AI system, not the package.

**See it.** Try
[inspecting a package](https://try.openmoca.org/p/support-kb?view=inspect):
its digest, its signer, the Reader's findings and its search indexes.

## Clinical guidelines

**The problem.** A guideline is a pathway: tests before treatments,
conditions and their subtypes. Retrieval that ignores the pathway can surface
a treatment before the test it depends on.

**What MOCA adds.**

- **The pathway is kept.** Structure holds the conditions (`skos:broader`),
  the pathway stages in order, and what each stage requires.
- **Every citation can be checked.** The original guideline travels inside
  the package, so a citation is matched against it with no network.
- **A clear limit.** MOCA grounds an assistant over the guideline. It does not
  replace clinical decision-support standards, and structure narrows what is
  retrieved, not what a model says.

## Where MOCA is a poor fit

- **Live operational data**, such as tickets, stock levels or metrics. Query
  the system of record.
- **One team, one pipeline, and no one asking where an answer came from.** Use
  OKF on its own.
- **Anything that needs configuration to travel with content.** Packages never
  configure their Readers.
